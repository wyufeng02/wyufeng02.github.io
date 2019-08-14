// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

// This is CodeMirror (http://codemirror.net), a code editor
// implemented in JavaScript on top of the browser's DOM.
//
// You can find some technical background for some of the code below
// at http://marijnhaverbeke.nl/blog/#cm-internals .

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.CodeMirror = factory());
}(this, (function () { 'use strict';

// Kludges for bugs and behavior differences that can't be feature
// detected are enabled based on userAgent etc sniffing.
var userAgent = navigator.userAgent
var platform = navigator.platform

var gecko = /gecko\/\d/i.test(userAgent)
var ie_upto10 = /MSIE \d/.test(userAgent)
var ie_11up = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(userAgent)
var edge = /Edge\/(\d+)/.exec(userAgent)
var ie = ie_upto10 || ie_11up || edge
var ie_version = ie && (ie_upto10 ? document.documentMode || 6 : +(edge || ie_11up)[1])
var webkit = !edge && /WebKit\//.test(userAgent)
var qtwebkit = webkit && /Qt\/\d+\.\d+/.test(userAgent)
var chrome = !edge && /Chrome\//.test(userAgent)
var presto = /Opera\//.test(userAgent)
var safari = /Apple Computer/.test(navigator.vendor)
var mac_geMountainLion = /Mac OS X 1\d\D([8-9]|\d\d)\D/.test(userAgent)
var phantom = /PhantomJS/.test(userAgent)

var ios = !edge && /AppleWebKit/.test(userAgent) && /Mobile\/\w+/.test(userAgent)
var android = /Android/.test(userAgent)
// This is woefully incomplete. Suggestions for alternative methods welcome.
var mobile = ios || android || /webOS|BlackBerry|Opera Mini|Opera Mobi|IEMobile/i.test(userAgent)
var mac = ios || /Mac/.test(platform)
var chromeOS = /\bCrOS\b/.test(userAgent)
var windows = /win/i.test(platform)

var presto_version = presto && userAgent.match(/Version\/(\d*\.\d*)/)
if (presto_version) { presto_version = Number(presto_version[1]) }
if (presto_version && presto_version >= 15) { presto = false; webkit = true }
// Some browsers use the wrong event properties to signal cmd/ctrl on OS X
var flipCtrlCmd = mac && (qtwebkit || presto && (presto_version == null || presto_version < 12.11))
var captureRightClick = gecko || (ie && ie_version >= 9)

function classTest(cls) { return new RegExp("(^|\\s)" + cls + "(?:$|\\s)\\s*") }

var rmClass = function(node, cls) {
  var current = node.className
  var match = classTest(cls).exec(current)
  if (match) {
    var after = current.slice(match.index + match[0].length)
    node.className = current.slice(0, match.index) + (after ? match[1] + after : "")
  }
}

function removeChildren(e) {
  for (var count = e.childNodes.length; count > 0; --count)
    { e.removeChild(e.firstChild) }
  return e
}

function removeChildrenAndAdd(parent, e) {
  return removeChildren(parent).appendChild(e)
}

function elt(tag, content, className, style) {
  var e = document.createElement(tag)
  if (className) { e.className = className }
  if (style) { e.style.cssText = style }
  if (typeof content == "string") { e.appendChild(document.createTextNode(content)) }
  else if (content) { for (var i = 0; i < content.length; ++i) { e.appendChild(content[i]) } }
  return e
}
// wrapper for elt, which removes the elt from the accessibility tree
function eltP(tag, content, className, style) {
  var e = elt(tag, content, className, style)
  e.setAttribute("role", "presentation")
  return e
}

var range
if (document.createRange) { range = function(node, start, end, endNode) {
  var r = document.createRange()
  r.setEnd(endNode || node, end)
  r.setStart(node, start)
  return r
} }
else { range = function(node, start, end) {
  var r = document.body.createTextRange()
  try { r.moveToElementText(node.parentNode) }
  catch(e) { return r }
  r.collapse(true)
  r.moveEnd("character", end)
  r.moveStart("character", start)
  return r
} }

function contains(parent, child) {
  if (child.nodeType == 3) // Android browser always returns false when child is a textnode
    { child = child.parentNode }
  if (parent.contains)
    { return parent.contains(child) }
  do {
    if (child.nodeType == 11) { child = child.host }
    if (child == parent) { return true }
  } while (child = child.parentNode)
}

function activeElt() {
  // IE and Edge may throw an "Unspecified Error" when accessing document.activeElement.
  // IE < 10 will throw when accessed while the page is loading or in an iframe.
  // IE > 9 and Edge will throw when accessed in an iframe if document.body is unavailable.
  var activeElement
  try {
    activeElement = document.activeElement
  } catch(e) {
    activeElement = document.body || null
  }
  while (activeElement && activeElement.shadowRoot && activeElement.shadowRoot.activeElement)
    { activeElement = activeElement.shadowRoot.activeElement }
  return activeElement
}

function addClass(node, cls) {
  var current = node.className
  if (!classTest(cls).test(current)) { node.className += (current ? " " : "") + cls }
}
function joinClasses(a, b) {
  var as = a.split(" ")
  for (var i = 0; i < as.length; i++)
    { if (as[i] && !classTest(as[i]).test(b)) { b += " " + as[i] } }
  return b
}

var selectInput = function(node) { node.select() }
if (ios) // Mobile Safari apparently has a bug where select() is broken.
  { selectInput = function(node) { node.selectionStart = 0; node.selectionEnd = node.value.length } }
else if (ie) // Suppress mysterious IE10 errors
  { selectInput = function(node) { try { node.select() } catch(_e) {} } }

function bind(f) {
  var args = Array.prototype.slice.call(arguments, 1)
  return function(){return f.apply(null, args)}
}

function copyObj(obj, target, overwrite) {
  if (!target) { target = {} }
  for (var prop in obj)
    { if (obj.hasOwnProperty(prop) && (overwrite !== false || !target.hasOwnProperty(prop)))
      { target[prop] = obj[prop] } }
  return target
}

// Counts the column offset in a string, taking tabs into account.
// Used mostly to find indentation.
function countColumn(string, end, tabSize, startIndex, startValue) {
  if (end == null) {
    end = string.search(/[^\s\u00a0]/)
    if (end == -1) { end = string.length }
  }
  for (var i = startIndex || 0, n = startValue || 0;;) {
    var nextTab = string.indexOf("\t", i)
    if (nextTab < 0 || nextTab >= end)
      { return n + (end - i) }
    n += nextTab - i
    n += tabSize - (n % tabSize)
    i = nextTab + 1
  }
}

var Delayed = function() {this.id = null};
Delayed.prototype.set = function (ms, f) {
  clearTimeout(this.id)
  this.id = setTimeout(f, ms)
};

function indexOf(array, elt) {
  for (var i = 0; i < array.length; ++i)
    { if (array[i] == elt) { return i } }
  return -1
}

// Number of pixels added to scroller and sizer to hide scrollbar
var scrollerGap = 30

// Returned or thrown by various protocols to signal 'I'm not
// handling this'.
var Pass = {toString: function(){return "CodeMirror.Pass"}}

// Reused option objects for setSelection & friends
var sel_dontScroll = {scroll: false};
var sel_mouse = {origin: "*mouse"};
var sel_move = {origin: "+move"};
// The inverse of countColumn -- find the offset that corresponds to
// a particular column.
function findColumn(string, goal, tabSize) {
  for (var pos = 0, col = 0;;) {
    var nextTab = string.indexOf("\t", pos)
    if (nextTab == -1) { nextTab = string.length }
    var skipped = nextTab - pos
    if (nextTab == string.length || col + skipped >= goal)
      { return pos + Math.min(skipped, goal - col) }
    col += nextTab - pos
    col += tabSize - (col % tabSize)
    pos = nextTab + 1
    if (col >= goal) { return pos }
  }
}

var spaceStrs = [""]
function spaceStr(n) {
  while (spaceStrs.length <= n)
    { spaceStrs.push(lst(spaceStrs) + " ") }
  return spaceStrs[n]
}

function lst(arr) { return arr[arr.length-1] }

function map(array, f) {
  var out = []
  for (var i = 0; i < array.length; i++) { out[i] = f(array[i], i) }
  return out
}

function insertSorted(array, value, score) {
  var pos = 0, priority = score(value)
  while (pos < array.length && score(array[pos]) <= priority) { pos++ }
  array.splice(pos, 0, value)
}

function nothing() {}

function createObj(base, props) {
  var inst
  if (Object.create) {
    inst = Object.create(base)
  } else {
    nothing.prototype = base
    inst = new nothing()
  }
  if (props) { copyObj(props, inst) }
  return inst
}

var nonASCIISingleCaseWordChar = /[\u00df\u0587\u0590-\u05f4\u0600-\u06ff\u3040-\u309f\u30a0-\u30ff\u3400-\u4db5\u4e00-\u9fcc\uac00-\ud7af]/
function isWordCharBasic(ch) {
  return /\w/.test(ch) || ch > "\x80" &&
    (ch.toUpperCase() != ch.toLowerCase() || nonASCIISingleCaseWordChar.test(ch))
}
function isWordChar(ch, helper) {
  if (!helper) { return isWordCharBasic(ch) }
  if (helper.source.indexOf("\\w") > -1 && isWordCharBasic(ch)) { return true }
  return helper.test(ch)
}

function isEmpty(obj) {
  for (var n in obj) { if (obj.hasOwnProperty(n) && obj[n]) { return false } }
  return true
}

// Extending unicode characters. A series of a non-extending char +
// any number of extending chars is treated as a single unit as far
// as editing and measuring is concerned. This is not fully correct,
// since some scripts/fonts/browsers also treat other configurations
// of code points as a group.
var extendingChars = /[\u0300-\u036f\u0483-\u0489\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u065e\u0670\u06d6-\u06dc\u06de-\u06e4\u06e7\u06e8\u06ea-\u06ed\u0711\u0730-\u074a\u07a6-\u07b0\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0900-\u0902\u093c\u0941-\u0948\u094d\u0951-\u0955\u0962\u0963\u0981\u09bc\u09be\u09c1-\u09c4\u09cd\u09d7\u09e2\u09e3\u0a01\u0a02\u0a3c\u0a41\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a70\u0a71\u0a75\u0a81\u0a82\u0abc\u0ac1-\u0ac5\u0ac7\u0ac8\u0acd\u0ae2\u0ae3\u0b01\u0b3c\u0b3e\u0b3f\u0b41-\u0b44\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b82\u0bbe\u0bc0\u0bcd\u0bd7\u0c3e-\u0c40\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0cbc\u0cbf\u0cc2\u0cc6\u0ccc\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0d3e\u0d41-\u0d44\u0d4d\u0d57\u0d62\u0d63\u0dca\u0dcf\u0dd2-\u0dd4\u0dd6\u0ddf\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0f18\u0f19\u0f35\u0f37\u0f39\u0f71-\u0f7e\u0f80-\u0f84\u0f86\u0f87\u0f90-\u0f97\u0f99-\u0fbc\u0fc6\u102d-\u1030\u1032-\u1037\u1039\u103a\u103d\u103e\u1058\u1059\u105e-\u1060\u1071-\u1074\u1082\u1085\u1086\u108d\u109d\u135f\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b7-\u17bd\u17c6\u17c9-\u17d3\u17dd\u180b-\u180d\u18a9\u1920-\u1922\u1927\u1928\u1932\u1939-\u193b\u1a17\u1a18\u1a56\u1a58-\u1a5e\u1a60\u1a62\u1a65-\u1a6c\u1a73-\u1a7c\u1a7f\u1b00-\u1b03\u1b34\u1b36-\u1b3a\u1b3c\u1b42\u1b6b-\u1b73\u1b80\u1b81\u1ba2-\u1ba5\u1ba8\u1ba9\u1c2c-\u1c33\u1c36\u1c37\u1cd0-\u1cd2\u1cd4-\u1ce0\u1ce2-\u1ce8\u1ced\u1dc0-\u1de6\u1dfd-\u1dff\u200c\u200d\u20d0-\u20f0\u2cef-\u2cf1\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua66f-\ua672\ua67c\ua67d\ua6f0\ua6f1\ua802\ua806\ua80b\ua825\ua826\ua8c4\ua8e0-\ua8f1\ua926-\ua92d\ua947-\ua951\ua980-\ua982\ua9b3\ua9b6-\ua9b9\ua9bc\uaa29-\uaa2e\uaa31\uaa32\uaa35\uaa36\uaa43\uaa4c\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uabe5\uabe8\uabed\udc00-\udfff\ufb1e\ufe00-\ufe0f\ufe20-\ufe26\uff9e\uff9f]/
function isExtendingChar(ch) { return ch.charCodeAt(0) >= 768 && extendingChars.test(ch) }

// Returns a number from the range [`0`; `str.length`] unless `pos` is outside that range.
function skipExtendingChars(str, pos, dir) {
  while ((dir < 0 ? pos > 0 : pos < str.length) && isExtendingChar(str.charAt(pos))) { pos += dir }
  return pos
}

// Returns the value from the range [`from`; `to`] that satisfies
// `pred` and is closest to `from`. Assumes that at least `to`
// satisfies `pred`. Supports `from` being greater than `to`.
function findFirst(pred, from, to) {
  // At any point we are certain `to` satisfies `pred`, don't know
  // whether `from` does.
  var dir = from > to ? -1 : 1
  for (;;) {
    if (from == to) { return from }
    var midF = (from + to) / 2, mid = dir < 0 ? Math.ceil(midF) : Math.floor(midF)
    if (mid == from) { return pred(mid) ? from : to }
    if (pred(mid)) { to = mid }
    else { from = mid + dir }
  }
}

// The display handles the DOM integration, both for input reading
// and content drawing. It holds references to DOM nodes and
// display-related state.

function Display(place, doc, input) {
  var d = this
  this.input = input

  // Covers bottom-right square when both scrollbars are present.
  d.scrollbarFiller = elt("div", null, "CodeMirror-scrollbar-filler")
  d.scrollbarFiller.setAttribute("cm-not-content", "true")
  // Covers bottom of gutter when coverGutterNextToScrollbar is on
  // and h scrollbar is present.
  d.gutterFiller = elt("div", null, "CodeMirror-gutter-filler")
  d.gutterFiller.setAttribute("cm-not-content", "true")
  // Will contain the actual code, positioned to cover the viewport.
  d.lineDiv = eltP("div", null, "CodeMirror-code")
  // Elements are added to these to represent selection and cursors.
  d.selectionDiv = elt("div", null, null, "position: relative; z-index: 1")
  d.cursorDiv = elt("div", null, "CodeMirror-cursors")
  // A visibility: hidden element used to find the size of things.
  d.measure = elt("div", null, "CodeMirror-measure")
  // When lines outside of the viewport are measured, they are drawn in this.
  d.lineMeasure = elt("div", null, "CodeMirror-measure")
  // Wraps everything that needs to exist inside the vertically-padded coordinate system
  d.lineSpace = eltP("div", [d.measure, d.lineMeasure, d.selectionDiv, d.cursorDiv, d.lineDiv],
                    null, "position: relative; outline: none")
  var lines = eltP("div", [d.lineSpace], "CodeMirror-lines")
  // Moved around its parent to cover visible view.
  d.mover = elt("div", [lines], null, "position: relative")
  // Set to the height of the document, allowing scrolling.
  d.sizer = elt("div", [d.mover], "CodeMirror-sizer")
  d.sizerWidth = null
  // Behavior of elts with overflow: auto and padding is
  // inconsistent across browsers. This is used to ensure the
  // scrollable area is big enough.
  d.heightForcer = elt("div", null, null, "position: absolute; height: " + scrollerGap + "px; width: 1px;")
  // Will contain the gutters, if any.
  d.gutters = elt("div", null, "CodeMirror-gutters")
  d.lineGutter = null
  // Actual scrollable element.
  d.scroller = elt("div", [d.sizer, d.heightForcer, d.gutters], "CodeMirror-scroll")
  d.scroller.setAttribute("tabIndex", "-1")
  // The element in which the editor lives.
  d.wrapper = elt("div", [d.scrollbarFiller, d.gutterFiller, d.scroller], "CodeMirror")

  // Work around IE7 z-index bug (not perfect, hence IE7 not really being supported)
  if (ie && ie_version < 8) { d.gutters.style.zIndex = -1; d.scroller.style.paddingRight = 0 }
  if (!webkit && !(gecko && mobile)) { d.scroller.draggable = true }

  if (place) {
    if (place.appendChild) { place.appendChild(d.wrapper) }
    else { place(d.wrapper) }
  }

  // Current rendered range (may be bigger than the view window).
  d.viewFrom = d.viewTo = doc.first
  d.reportedViewFrom = d.reportedViewTo = doc.first
  // Information about the rendered lines.
  d.view = []
  d.renderedView = null
  // Holds info about a single rendered line when it was rendered
  // for measurement, while not in view.
  d.externalMeasured = null
  // Empty space (in pixels) above the view
  d.viewOffset = 0
  d.lastWrapHeight = d.lastWrapWidth = 0
  d.updateLineNumbers = null

  d.nativeBarWidth = d.barHeight = d.barWidth = 0
  d.scrollbarsClipped = false

  // Used to only resize the line number gutter when necessary (when
  // the amount of lines crosses a boundary that makes its width change)
  d.lineNumWidth = d.lineNumInnerWidth = d.lineNumChars = null
  // Set to true when a non-horizontal-scrolling line widget is
  // added. As an optimization, line widget aligning is skipped when
  // this is false.
  d.alignWidgets = false

  d.cachedCharWidth = d.cachedTextHeight = d.cachedPaddingH = null

  // Tracks the maximum line length so that the horizontal scrollbar
  // can be kept static when scrolling.
  d.maxLine = null
  d.maxLineLength = 0
  d.maxLineChanged = false

  // Used for measuring wheel scrolling granularity
  d.wheelDX = d.wheelDY = d.wheelStartX = d.wheelStartY = null

  // True when shift is held down.
  d.shift = false

  // Used to track whether anything happened since the context menu
  // was opened.
  d.selForContextMenu = null

  d.activeTouch = null

  input.init(d)
}

// Find the line object corresponding to the given line number.
function getLine(doc, n) {
  n -= doc.first
  if (n < 0 || n >= doc.size) { throw new Error("There is no line " + (n + doc.first) + " in the document.") }
  var chunk = doc
  while (!chunk.lines) {
    for (var i = 0;; ++i) {
      var child = chunk.children[i], sz = child.chunkSize()
      if (n < sz) { chunk = child; break }
      n -= sz
    }
  }
  return chunk.lines[n]
}

// Get the part of a document between two positions, as an array of
// strings.
function getBetween(doc, start, end) {
  var out = [], n = start.line
  doc.iter(start.line, end.line + 1, function (line) {
    var text = line.text
    if (n == end.line) { text = text.slice(0, end.ch) }
    if (n == start.line) { text = text.slice(start.ch) }
    out.push(text)
    ++n
  })
  return out
}
// Get the lines between from and to, as array of strings.
function getLines(doc, from, to) {
  var out = []
  doc.iter(from, to, function (line) { out.push(line.text) }) // iter aborts when callback returns truthy value
  return out
}

// Update the height of a line, propagating the height change
// upwards to parent nodes.
function updateLineHeight(line, height) {
  var diff = height - line.height
  if (diff) { for (var n = line; n; n = n.parent) { n.height += diff } }
}

// Given a line object, find its line number by walking up through
// its parent links.
function lineNo(line) {
  if (line.parent == null) { return null }
  var cur = line.parent, no = indexOf(cur.lines, line)
  for (var chunk = cur.parent; chunk; cur = chunk, chunk = chunk.parent) {
    for (var i = 0;; ++i) {
      if (chunk.children[i] == cur) { break }
      no += chunk.children[i].chunkSize()
    }
  }
  return no + cur.first
}

// Find the line at the given vertical position, using the height
// information in the document tree.
function lineAtHeight(chunk, h) {
  var n = chunk.first
  outer: do {
    for (var i$1 = 0; i$1 < chunk.children.length; ++i$1) {
      var child = chunk.children[i$1], ch = child.height
      if (h < ch) { chunk = child; continue outer }
      h -= ch
      n += child.chunkSize()
    }
    return n
  } while (!chunk.lines)
  var i = 0
  for (; i < chunk.lines.length; ++i) {
    var line = chunk.lines[i], lh = line.height
    if (h < lh) { break }
    h -= lh
  }
  return n + i
}

function isLine(doc, l) {return l >= doc.first && l < doc.first + doc.size}

function lineNumberFor(options, i) {
  return String(options.lineNumberFormatter(i + options.firstLineNumber))
}

// A Pos instance represents a position within the text.
function Pos(line, ch, sticky) {
  if ( sticky === void 0 ) sticky = null;

  if (!(this instanceof Pos)) { return new Pos(line, ch, sticky) }
  this.line = line
  this.ch = ch
  this.sticky = sticky
}

// Compare two positions, return 0 if they are the same, a negative
// number when a is less, and a positive number otherwise.
function cmp(a, b) { return a.line - b.line || a.ch - b.ch }

function equalCursorPos(a, b) { return a.sticky == b.sticky && cmp(a, b) == 0 }

function copyPos(x) {return Pos(x.line, x.ch)}
function maxPos(a, b) { return cmp(a, b) < 0 ? b : a }
function minPos(a, b) { return cmp(a, b) < 0 ? a : b }

// Most of the external API clips given positions to make sure they
// actually exist within the document.
function clipLine(doc, n) {return Math.max(doc.first, Math.min(n, doc.first + doc.size - 1))}
function clipPos(doc, pos) {
  if (pos.line < doc.first) { return Pos(doc.first, 0) }
  var last = doc.first + doc.size - 1
  if (pos.line > last) { return Pos(last, getLine(doc, last).text.length) }
  return clipToLen(pos, getLine(doc, pos.line).text.length)
}
function clipToLen(pos, linelen) {
  var ch = pos.ch
  if (ch == null || ch > linelen) { return Pos(pos.line, linelen) }
  else if (ch < 0) { return Pos(pos.line, 0) }
  else { return pos }
}
function clipPosArray(doc, array) {
  var out = []
  for (var i = 0; i < array.length; i++) { out[i] = clipPos(doc, array[i]) }
  return out
}

// Optimize some code when these features are not used.
var sawReadOnlySpans = false;
var sawCollapsedSpans = false;
function seeReadOnlySpans() {
  sawReadOnlySpans = true
}

function seeCollapsedSpans() {
  sawCollapsedSpans = true
}

// TEXTMARKER SPANS

function MarkedSpan(marker, from, to) {
  this.marker = marker
  this.from = from; this.to = to
}

// Search an array of spans for a span matching the given marker.
function getMarkedSpanFor(spans, marker) {
  if (spans) { for (var i = 0; i < spans.length; ++i) {
    var span = spans[i]
    if (span.marker == marker) { return span }
  } }
}
// Remove a span from an array, returning undefined if no spans are
// left (we don't store arrays for lines without spans).
function removeMarkedSpan(spans, span) {
  var r
  for (var i = 0; i < spans.length; ++i)
    { if (spans[i] != span) { (r || (r = [])).push(spans[i]) } }
  return r
}
// Add a span to a line.
function addMarkedSpan(line, span) {
  line.markedSpans = line.markedSpans ? line.markedSpans.concat([span]) : [span]
  span.marker.attachLine(line)
}

// Used for the algorithm that adjusts markers for a change in the
// document. These functions cut an array of spans at a given
// character position, returning an array of remaining chunks (or
// undefined if nothing remains).
function markedSpansBefore(old, startCh, isInsert) {
  var nw
  if (old) { for (var i = 0; i < old.length; ++i) {
    var span = old[i], marker = span.marker
    var startsBefore = span.from == null || (marker.inclusiveLeft ? span.from <= startCh : span.from < startCh)
    if (startsBefore || span.from == startCh && marker.type == "bookmark" && (!isInsert || !span.marker.insertLeft)) {
      var endsAfter = span.to == null || (marker.inclusiveRight ? span.to >= startCh : span.to > startCh)
      ;(nw || (nw = [])).push(new MarkedSpan(marker, span.from, endsAfter ? null : span.to))
    }
  } }
  return nw
}
function markedSpansAfter(old, endCh, isInsert) {
  var nw
  if (old) { for (var i = 0; i < old.length; ++i) {
    var span = old[i], marker = span.marker
    var endsAfter = span.to == null || (marker.inclusiveRight ? span.to >= endCh : span.to > endCh)
    if (endsAfter || span.from == endCh && marker.type == "bookmark" && (!isInsert || span.marker.insertLeft)) {
      var startsBefore = span.from == null || (marker.inclusiveLeft ? span.from <= endCh : span.from < endCh)
      ;(nw || (nw = [])).push(new MarkedSpan(marker, startsBefore ? null : span.from - endCh,
                                            span.to == null ? null : span.to - endCh))
    }
  } }
  return nw
}

// Given a change object, compute the new set of marker spans that
// cover the line in which the change took place. Removes spans
// entirely within the change, reconnects spans belonging to the
// same marker that appear on both sides of the change, and cuts off
// spans partially within the change. Returns an array of span
// arrays with one element for each line in (after) the change.
function stretchSpansOverChange(doc, change) {
  if (change.full) { return null }
  var oldFirst = isLine(doc, change.from.line) && getLine(doc, change.from.line).markedSpans
  var oldLast = isLine(doc, change.to.line) && getLine(doc, change.to.line).markedSpans
  if (!oldFirst && !oldLast) { return null }

  var startCh = change.from.ch, endCh = change.to.ch, isInsert = cmp(change.from, change.to) == 0
  // Get the spans that 'stick out' on both sides
  var first = markedSpansBefore(oldFirst, startCh, isInsert)
  var last = markedSpansAfter(oldLast, endCh, isInsert)

  // Next, merge those two ends
  var sameLine = change.text.length == 1, offset = lst(change.text).length + (sameLine ? startCh : 0)
  if (first) {
    // Fix up .to properties of first
    for (var i = 0; i < first.length; ++i) {
      var span = first[i]
      if (span.to == null) {
        var found = getMarkedSpanFor(last, span.marker)
        if (!found) { span.to = startCh }
        else if (sameLine) { span.to = found.to == null ? null : found.to + offset }
      }
    }
  }
  if (last) {
    // Fix up .from in last (or move them into first in case of sameLine)
    for (var i$1 = 0; i$1 < last.length; ++i$1) {
      var span$1 = last[i$1]
      if (span$1.to != null) { span$1.to += offset }
      if (span$1.from == null) {
        var found$1 = getMarkedSpanFor(first, span$1.marker)
        if (!found$1) {
          span$1.from = offset
          if (sameLine) { (first || (first = [])).push(span$1) }
        }
      } else {
        span$1.from += offset
        if (sameLine) { (first || (first = [])).push(span$1) }
      }
    }
  }
  // Make sure we didn't create any zero-length spans
  if (first) { first = clearEmptySpans(first) }
  if (last && last != first) { last = clearEmptySpans(last) }

  var newMarkers = [first]
  if (!sameLine) {
    // Fill gap with whole-line-spans
    var gap = change.text.length - 2, gapMarkers
    if (gap > 0 && first)
      { for (var i$2 = 0; i$2 < first.length; ++i$2)
        { if (first[i$2].to == null)
          { (gapMarkers || (gapMarkers = [])).push(new MarkedSpan(first[i$2].marker, null, null)) } } }
    for (var i$3 = 0; i$3 < gap; ++i$3)
      { newMarkers.push(gapMarkers) }
    newMarkers.push(last)
  }
  return newMarkers
}

// Remove spans that are empty and don't have a clearWhenEmpty
// option of false.
function clearEmptySpans(spans) {
  for (var i = 0; i < spans.length; ++i) {
    var span = spans[i]
    if (span.from != null && span.from == span.to && span.marker.clearWhenEmpty !== false)
      { spans.splice(i--, 1) }
  }
  if (!spans.length) { return null }
  return spans
}

// Used to 'clip' out readOnly ranges when making a change.
function removeReadOnlyRanges(doc, from, to) {
  var markers = null
  doc.iter(from.line, to.line + 1, function (line) {
    if (line.markedSpans) { for (var i = 0; i < line.markedSpans.length; ++i) {
      var mark = line.markedSpans[i].marker
      if (mark.readOnly && (!markers || indexOf(markers, mark) == -1))
        { (markers || (markers = [])).push(mark) }
    } }
  })
  if (!markers) { return null }
  var parts = [{from: from, to: to}]
  for (var i = 0; i < markers.length; ++i) {
    var mk = markers[i], m = mk.find(0)
    for (var j = 0; j < parts.length; ++j) {
      var p = parts[j]
      if (cmp(p.to, m.from) < 0 || cmp(p.from, m.to) > 0) { continue }
      var newParts = [j, 1], dfrom = cmp(p.from, m.from), dto = cmp(p.to, m.to)
      if (dfrom < 0 || !mk.inclusiveLeft && !dfrom)
        { newParts.push({from: p.from, to: m.from}) }
      if (dto > 0 || !mk.inclusiveRight && !dto)
        { newParts.push({from: m.to, to: p.to}) }
      parts.splice.apply(parts, newParts)
      j += newParts.length - 3
    }
  }
  return parts
}

// Connect or disconnect spans from a line.
function detachMarkedSpans(line) {
  var spans = line.markedSpans
  if (!spans) { return }
  for (var i = 0; i < spans.length; ++i)
    { spans[i].marker.detachLine(line) }
  line.markedSpans = null
}
function attachMarkedSpans(line, spans) {
  if (!spans) { return }
  for (var i = 0; i < spans.length; ++i)
    { spans[i].marker.attachLine(line) }
  line.markedSpans = spans
}

// Helpers used when computing which overlapping collapsed span
// counts as the larger one.
function extraLeft(marker) { return marker.inclusiveLeft ? -1 : 0 }
function extraRight(marker) { return marker.inclusiveRight ? 1 : 0 }

// Returns a number indicating which of two overlapping collapsed
// spans is larger (and thus includes the other). Falls back to
// comparing ids when the spans cover exactly the same range.
function compareCollapsedMarkers(a, b) {
  var lenDiff = a.lines.length - b.lines.length
  if (lenDiff != 0) { return lenDiff }
  var aPos = a.find(), bPos = b.find()
  var fromCmp = cmp(aPos.from, bPos.from) || extraLeft(a) - extraLeft(b)
  if (fromCmp) { return -fromCmp }
  var toCmp = cmp(aPos.to, bPos.to) || extraRight(a) - extraRight(b)
  if (toCmp) { return toCmp }
  return b.id - a.id
}

// Find out whether a line ends or starts in a collapsed span. If
// so, return the marker for that span.
function collapsedSpanAtSide(line, start) {
  var sps = sawCollapsedSpans && line.markedSpans, found
  if (sps) { for (var sp = (void 0), i = 0; i < sps.length; ++i) {
    sp = sps[i]
    if (sp.marker.collapsed && (start ? sp.from : sp.to) == null &&
        (!found || compareCollapsedMarkers(found, sp.marker) < 0))
      { found = sp.marker }
  } }
  return found
}
function collapsedSpanAtStart(line) { return collapsedSpanAtSide(line, true) }
function collapsedSpanAtEnd(line) { return collapsedSpanAtSide(line, false) }

// Test whether there exists a collapsed span that partially
// overlaps (covers the start or end, but not both) of a new span.
// Such overlap is not allowed.
function conflictingCollapsedRange(doc, lineNo, from, to, marker) {
  var line = getLine(doc, lineNo)
  var sps = sawCollapsedSpans && line.markedSpans
  if (sps) { for (var i = 0; i < sps.length; ++i) {
    var sp = sps[i]
    if (!sp.marker.collapsed) { continue }
    var found = sp.marker.find(0)
    var fromCmp = cmp(found.from, from) || extraLeft(sp.marker) - extraLeft(marker)
    var toCmp = cmp(found.to, to) || extraRight(sp.marker) - extraRight(marker)
    if (fromCmp >= 0 && toCmp <= 0 || fromCmp <= 0 && toCmp >= 0) { continue }
    if (fromCmp <= 0 && (sp.marker.inclusiveRight && marker.inclusiveLeft ? cmp(found.to, from) >= 0 : cmp(found.to, from) > 0) ||
        fromCmp >= 0 && (sp.marker.inclusiveRight && marker.inclusiveLeft ? cmp(found.from, to) <= 0 : cmp(found.from, to) < 0))
      { return true }
  } }
}

// A visual line is a line as drawn on the screen. Folding, for
// example, can cause multiple logical lines to appear on the same
// visual line. This finds the start of the visual line that the
// given line is part of (usually that is the line itself).
function visualLine(line) {
  var merged
  while (merged = collapsedSpanAtStart(line))
    { line = merged.find(-1, true).line }
  return line
}

function visualLineEnd(line) {
  var merged
  while (merged = collapsedSpanAtEnd(line))
    { line = merged.find(1, true).line }
  return line
}

// Returns an array of logical lines that continue the visual line
// started by the argument, or undefined if there are no such lines.
function visualLineContinued(line) {
  var merged, lines
  while (merged = collapsedSpanAtEnd(line)) {
    line = merged.find(1, true).line
    ;(lines || (lines = [])).push(line)
  }
  return lines
}

// Get the line number of the start of the visual line that the
// given line number is part of.
function visualLineNo(doc, lineN) {
  var line = getLine(doc, lineN), vis = visualLine(line)
  if (line == vis) { return lineN }
  return lineNo(vis)
}

// Get the line number of the start of the next visual line after
// the given line.
function visualLineEndNo(doc, lineN) {
  if (lineN > doc.lastLine()) { return lineN }
  var line = getLine(doc, lineN), merged
  if (!lineIsHidden(doc, line)) { return lineN }
  while (merged = collapsedSpanAtEnd(line))
    { line = merged.find(1, true).line }
  return lineNo(line) + 1
}

// Compute whether a line is hidden. Lines count as hidden when they
// are part of a visual line that starts with another line, or when
// they are entirely covered by collapsed, non-widget span.
function lineIsHidden(doc, line) {
  var sps = sawCollapsedSpans && line.markedSpans
  if (sps) { for (var sp = (void 0), i = 0; i < sps.length; ++i) {
    sp = sps[i]
    if (!sp.marker.collapsed) { continue }
    if (sp.from == null) { return true }
    if (sp.marker.widgetNode) { continue }
    if (sp.from == 0 && sp.marker.inclusiveLeft && lineIsHiddenInner(doc, line, sp))
      { return true }
  } }
}
function lineIsHiddenInner(doc, line, span) {
  if (span.to == null) {
    var end = span.marker.find(1, true)
    return lineIsHiddenInner(doc, end.line, getMarkedSpanFor(end.line.markedSpans, span.marker))
  }
  if (span.marker.inclusiveRight && span.to == line.text.length)
    { return true }
  for (var sp = (void 0), i = 0; i < line.markedSpans.length; ++i) {
    sp = line.markedSpans[i]
    if (sp.marker.collapsed && !sp.marker.widgetNode && sp.from == span.to &&
        (sp.to == null || sp.to != span.from) &&
        (sp.marker.inclusiveLeft || span.marker.inclusiveRight) &&
        lineIsHiddenInner(doc, line, sp)) { return true }
  }
}

// Find the height above the given line.
function heightAtLine(lineObj) {
  lineObj = visualLine(lineObj)

  var h = 0, chunk = lineObj.parent
  for (var i = 0; i < chunk.lines.length; ++i) {
    var line = chunk.lines[i]
    if (line == lineObj) { break }
    else { h += line.height }
  }
  for (var p = chunk.parent; p; chunk = p, p = chunk.parent) {
    for (var i$1 = 0; i$1 < p.children.length; ++i$1) {
      var cur = p.children[i$1]
      if (cur == chunk) { break }
      else { h += cur.height }
    }
  }
  return h
}

// Compute the character length of a line, taking into account
// collapsed ranges (see markText) that might hide parts, and join
// other lines onto it.
function lineLength(line) {
  if (line.height == 0) { return 0 }
  var len = line.text.length, merged, cur = line
  while (merged = collapsedSpanAtStart(cur)) {
    var found = merged.find(0, true)
    cur = found.from.line
    len += found.from.ch - found.to.ch
  }
  cur = line
  while (merged = collapsedSpanAtEnd(cur)) {
    var found$1 = merged.find(0, true)
    len -= cur.text.length - found$1.from.ch
    cur = found$1.to.line
    len += cur.text.length - found$1.to.ch
  }
  return len
}

// Find the longest line in the document.
function findMaxLine(cm) {
  var d = cm.display, doc = cm.doc
  d.maxLine = getLine(doc, doc.first)
  d.maxLineLength = lineLength(d.maxLine)
  d.maxLineChanged = true
  doc.iter(function (line) {
    var len = lineLength(line)
    if (len > d.maxLineLength) {
      d.maxLineLength = len
      d.maxLine = line
    }
  })
}

// BIDI HELPERS

function iterateBidiSections(order, from, to, f) {
  if (!order) { return f(from, to, "ltr", 0) }
  var found = false
  for (var i = 0; i < order.length; ++i) {
    var part = order[i]
    if (part.from < to && part.to > from || from == to && part.to == from) {
      f(Math.max(part.from, from), Math.min(part.to, to), part.level == 1 ? "rtl" : "ltr", i)
      found = true
    }
  }
  if (!found) { f(from, to, "ltr") }
}

var bidiOther = null
function getBidiPartAt(order, ch, sticky) {
  var found
  bidiOther = null
  for (var i = 0; i < order.length; ++i) {
    var cur = order[i]
    if (cur.from < ch && cur.to > ch) { return i }
    if (cur.to == ch) {
      if (cur.from != cur.to && sticky == "before") { found = i }
      else { bidiOther = i }
    }
    if (cur.from == ch) {
      if (cur.from != cur.to && sticky != "before") { found = i }
      else { bidiOther = i }
    }
  }
  return found != null ? found : bidiOther
}

// Bidirectional ordering algorithm
// See http://unicode.org/reports/tr9/tr9-13.html for the algorithm
// that this (partially) implements.

// One-char codes used for character types:
// L (L):   Left-to-Right
// R (R):   Right-to-Left
// r (AL):  Right-to-Left Arabic
// 1 (EN):  European Number
// + (ES):  European Number Separator
// % (ET):  European Number Terminator
// n (AN):  Arabic Number
// , (CS):  Common Number Separator
// m (NSM): Non-Spacing Mark
// b (BN):  Boundary Neutral
// s (B):   Paragraph Separator
// t (S):   Segment Separator
// w (WS):  Whitespace
// N (ON):  Other Neutrals

// Returns null if characters are ordered as they appear
// (left-to-right), or an array of sections ({from, to, level}
// objects) in the order in which they occur visually.
var bidiOrdering = (function() {
  // Character types for codepoints 0 to 0xff
  var lowTypes = "bbbbbbbbbtstwsbbbbbbbbbbbbbbssstwNN%%%NNNNNN,N,N1111111111NNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNbbbbbbsbbbbbbbbbbbbbbbbbbbbbbbbbb,N%%%%NNNNLNNNNN%%11NLNNN1LNNNNNLLLLLLLLLLLLLLLLLLLLLLLNLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLN"
  // Character types for codepoints 0x600 to 0x6f9
  var arabicTypes = "nnnnnnNNr%%r,rNNmmmmmmmmmmmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmmmmmmmmmmmmmmmnnnnnnnnnn%nnrrrmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmnNmmmmmmrrmmNmmmmrr1111111111"
  function charType(code) {
    if (code <= 0xf7) { return lowTypes.charAt(code) }
    else if (0x590 <= code && code <= 0x5f4) { return "R" }
    else if (0x600 <= code && code <= 0x6f9) { return arabicTypes.charAt(code - 0x600) }
    else if (0x6ee <= code && code <= 0x8ac) { return "r" }
    else if (0x2000 <= code && code <= 0x200b) { return "w" }
    else if (code == 0x200c) { return "b" }
    else { return "L" }
  }

  var bidiRE = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/
  var isNeutral = /[stwN]/, isStrong = /[LRr]/, countsAsLeft = /[Lb1n]/, countsAsNum = /[1n]/

  function BidiSpan(level, from, to) {
    this.level = level
    this.from = from; this.to = to
  }

  return function(str, direction) {
    var outerType = direction == "ltr" ? "L" : "R"

    if (str.length == 0 || direction == "ltr" && !bidiRE.test(str)) { return false }
    var len = str.length, types = []
    for (var i = 0; i < len; ++i)
      { types.push(charType(str.charCodeAt(i))) }

    // W1. Examine each non-spacing mark (NSM) in the level run, and
    // change the type of the NSM to the type of the previous
    // character. If the NSM is at the start of the level run, it will
    // get the type of sor.
    for (var i$1 = 0, prev = outerType; i$1 < len; ++i$1) {
      var type = types[i$1]
      if (type == "m") { types[i$1] = prev }
      else { prev = type }
    }

    // W2. Search backwards from each instance of a European number
    // until the first strong type (R, L, AL, or sor) is found. If an
    // AL is found, change the type of the European number to Arabic
    // number.
    // W3. Change all ALs to R.
    for (var i$2 = 0, cur = outerType; i$2 < len; ++i$2) {
      var type$1 = types[i$2]
      if (type$1 == "1" && cur == "r") { types[i$2] = "n" }
      else if (isStrong.test(type$1)) { cur = type$1; if (type$1 == "r") { types[i$2] = "R" } }
    }

    // W4. A single European separator between two European numbers
    // changes to a European number. A single common separator between
    // two numbers of the same type changes to that type.
    for (var i$3 = 1, prev$1 = types[0]; i$3 < len - 1; ++i$3) {
      var type$2 = types[i$3]
      if (type$2 == "+" && prev$1 == "1" && types[i$3+1] == "1") { types[i$3] = "1" }
      else if (type$2 == "," && prev$1 == types[i$3+1] &&
               (prev$1 == "1" || prev$1 == "n")) { types[i$3] = prev$1 }
      prev$1 = type$2
    }

    // W5. A sequence of European terminators adjacent to European
    // numbers changes to all European numbers.
    // W6. Otherwise, separators and terminators change to Other
    // Neutral.
    for (var i$4 = 0; i$4 < len; ++i$4) {
      var type$3 = types[i$4]
      if (type$3 == ",") { types[i$4] = "N" }
      else if (type$3 == "%") {
        var end = (void 0)
        for (end = i$4 + 1; end < len && types[end] == "%"; ++end) {}
        var replace = (i$4 && types[i$4-1] == "!") || (end < len && types[end] == "1") ? "1" : "N"
        for (var j = i$4; j < end; ++j) { types[j] = replace }
        i$4 = end - 1
      }
    }

    // W7. Search backwards from each instance of a European number
    // until the first strong type (R, L, or sor) is found. If an L is
    // found, then change the type of the European number to L.
    for (var i$5 = 0, cur$1 = outerType; i$5 < len; ++i$5) {
      var type$4 = types[i$5]
      if (cur$1 == "L" && type$4 == "1") { types[i$5] = "L" }
      else if (isStrong.test(type$4)) { cur$1 = type$4 }
    }

    // N1. A sequence of neutrals takes the direction of the
    // surrounding strong text if the text on both sides has the same
    // direction. European and Arabic numbers act as if they were R in
    // terms of their influence on neutrals. Start-of-level-run (sor)
    // and end-of-level-run (eor) are used at level run boundaries.
    // N2. Any remaining neutrals take the embedding direction.
    for (var i$6 = 0; i$6 < len; ++i$6) {
      if (isNeutral.test(types[i$6])) {
        var end$1 = (void 0)
        for (end$1 = i$6 + 1; end$1 < len && isNeutral.test(types[end$1]); ++end$1) {}
        var before = (i$6 ? types[i$6-1] : outerType) == "L"
        var after = (end$1 < len ? types[end$1] : outerType) == "L"
        var replace$1 = before == after ? (before ? "L" : "R") : outerType
        for (var j$1 = i$6; j$1 < end$1; ++j$1) { types[j$1] = replace$1 }
        i$6 = end$1 - 1
      }
    }

    // Here we depart from the documented algorithm, in order to avoid
    // building up an actual levels array. Since there are only three
    // levels (0, 1, 2) in an implementation that doesn't take
    // explicit embedding into account, we can build up the order on
    // the fly, without following the level-based algorithm.
    var order = [], m
    for (var i$7 = 0; i$7 < len;) {
      if (countsAsLeft.test(types[i$7])) {
        var start = i$7
        for (++i$7; i$7 < len && countsAsLeft.test(types[i$7]); ++i$7) {}
        order.push(new BidiSpan(0, start, i$7))
      } else {
        var pos = i$7, at = order.length
        for (++i$7; i$7 < len && types[i$7] != "L"; ++i$7) {}
        for (var j$2 = pos; j$2 < i$7;) {
          if (countsAsNum.test(types[j$2])) {
            if (pos < j$2) { order.splice(at, 0, new BidiSpan(1, pos, j$2)) }
            var nstart = j$2
            for (++j$2; j$2 < i$7 && countsAsNum.test(types[j$2]); ++j$2) {}
            order.splice(at, 0, new BidiSpan(2, nstart, j$2))
            pos = j$2
          } else { ++j$2 }
        }
        if (pos < i$7) { order.splice(at, 0, new BidiSpan(1, pos, i$7)) }
      }
    }
    if (direction == "ltr") {
      if (order[0].level == 1 && (m = str.match(/^\s+/))) {
        order[0].from = m[0].length
        order.unshift(new BidiSpan(0, 0, m[0].length))
      }
      if (lst(order).level == 1 && (m = str.match(/\s+$/))) {
        lst(order).to -= m[0].length
        order.push(new BidiSpan(0, len - m[0].length, len))
      }
    }

    return direction == "rtl" ? order.reverse() : order
  }
})()

// Get the bidi ordering for the given line (and cache it). Returns
// false for lines that are fully left-to-right, and an array of
// BidiSpan objects otherwise.
function getOrder(line, direction) {
  var order = line.order
  if (order == null) { order = line.order = bidiOrdering(line.text, direction) }
  return order
}

// EVENT HANDLING

// Lightweight event framework. on/off also work on DOM nodes,
// registering native DOM handlers.

var noHandlers = []

var on = function(emitter, type, f) {
  if (emitter.addEventListener) {
    emitter.addEventListener(type, f, false)
  } else if (emitter.attachEvent) {
    emitter.attachEvent("on" + type, f)
  } else {
    var map = emitter._handlers || (emitter._handlers = {})
    map[type] = (map[type] || noHandlers).concat(f)
  }
}

function getHandlers(emitter, type) {
  return emitter._handlers && emitter._handlers[type] || noHandlers
}

function off(emitter, type, f) {
  if (emitter.removeEventListener) {
    emitter.removeEventListener(type, f, false)
  } else if (emitter.detachEvent) {
    emitter.detachEvent("on" + type, f)
  } else {
    var map = emitter._handlers, arr = map && map[type]
    if (arr) {
      var index = indexOf(arr, f)
      if (index > -1)
        { map[type] = arr.slice(0, index).concat(arr.slice(index + 1)) }
    }
  }
}

function signal(emitter, type /*, values...*/) {
  var handlers = getHandlers(emitter, type)
  if (!handlers.length) { return }
  var args = Array.prototype.slice.call(arguments, 2)
  for (var i = 0; i < handlers.length; ++i) { handlers[i].apply(null, args) }
}

// The DOM events that CodeMirror handles can be overridden by
// registering a (non-DOM) handler on the editor for the event name,
// and preventDefault-ing the event in that handler.
function signalDOMEvent(cm, e, override) {
  if (typeof e == "string")
    { e = {type: e, preventDefault: function() { this.defaultPrevented = true }} }
  signal(cm, override || e.type, cm, e)
  return e_defaultPrevented(e) || e.codemirrorIgnore
}

function signalCursorActivity(cm) {
  var arr = cm._handlers && cm._handlers.cursorActivity
  if (!arr) { return }
  var set = cm.curOp.cursorActivityHandlers || (cm.curOp.cursorActivityHandlers = [])
  for (var i = 0; i < arr.length; ++i) { if (indexOf(set, arr[i]) == -1)
    { set.push(arr[i]) } }
}

function hasHandler(emitter, type) {
  return getHandlers(emitter, type).length > 0
}

// Add on and off methods to a constructor's prototype, to make
// registering events on such objects more convenient.
function eventMixin(ctor) {
  ctor.prototype.on = function(type, f) {on(this, type, f)}
  ctor.prototype.off = function(type, f) {off(this, type, f)}
}

// Due to the fact that we still support jurassic IE versions, some
// compatibility wrappers are needed.

function e_preventDefault(e) {
  if (e.preventDefault) { e.preventDefault() }
  else { e.returnValue = false }
}
function e_stopPropagation(e) {
  if (e.stopPropagation) { e.stopPropagation() }
  else { e.cancelBubble = true }
}
function e_defaultPrevented(e) {
  return e.defaultPrevented != null ? e.defaultPrevented : e.returnValue == false
}
function e_stop(e) {e_preventDefault(e); e_stopPropagation(e)}

function e_target(e) {return e.target || e.srcElement}
function e_button(e) {
  var b = e.which
  if (b == null) {
    if (e.button & 1) { b = 1 }
    else if (e.button & 2) { b = 3 }
    else if (e.button & 4) { b = 2 }
  }
  if (mac && e.ctrlKey && b == 1) { b = 3 }
  return b
}

// Detect drag-and-drop
var dragAndDrop = function() {
  // There is *some* kind of drag-and-drop support in IE6-8, but I
  // couldn't get it to work yet.
  if (ie && ie_version < 9) { return false }
  var div = elt('div')
  return "draggable" in div || "dragDrop" in div
}()

var zwspSupported
function zeroWidthElement(measure) {
  if (zwspSupported == null) {
    var test = elt("span", "\u200b")
    removeChildrenAndAdd(measure, elt("span", [test, document.createTextNode("x")]))
    if (measure.firstChild.offsetHeight != 0)
      { zwspSupported = test.offsetWidth <= 1 && test.offsetHeight > 2 && !(ie && ie_version < 8) }
  }
  var node = zwspSupported ? elt("span", "\u200b") :
    elt("span", "\u00a0", null, "display: inline-block; width: 1px; margin-right: -1px")
  node.setAttribute("cm-text", "")
  return node
}

// Feature-detect IE's crummy client rect reporting for bidi text
var badBidiRects
function hasBadBidiRects(measure) {
  if (badBidiRects != null) { return badBidiRects }
  var txt = removeChildrenAndAdd(measure, document.createTextNode("A\u062eA"))
  var r0 = range(txt, 0, 1).getBoundingClientRect()
  var r1 = range(txt, 1, 2).getBoundingClientRect()
  removeChildren(measure)
  if (!r0 || r0.left == r0.right) { return false } // Safari returns null in some cases (#2780)
  return badBidiRects = (r1.right - r0.right < 3)
}

// See if "".split is the broken IE version, if so, provide an
// alternative way to split lines.
var splitLinesAuto = "\n\nb".split(/\n/).length != 3 ? function (string) {
  var pos = 0, result = [], l = string.length
  while (pos <= l) {
    var nl = string.indexOf("\n", pos)
    if (nl == -1) { nl = string.length }
    var line = string.slice(pos, string.charAt(nl - 1) == "\r" ? nl - 1 : nl)
    var rt = line.indexOf("\r")
    if (rt != -1) {
      result.push(line.slice(0, rt))
      pos += rt + 1
    } else {
      result.push(line)
      pos = nl + 1
    }
  }
  return result
} : function (string) { return string.split(/\r\n?|\n/); }

var hasSelection = window.getSelection ? function (te) {
  try { return te.selectionStart != te.selectionEnd }
  catch(e) { return false }
} : function (te) {
  var range
  try {range = te.ownerDocument.selection.createRange()}
  catch(e) {}
  if (!range || range.parentElement() != te) { return false }
  return range.compareEndPoints("StartToEnd", range) != 0
}

var hasCopyEvent = (function () {
  var e = elt("div")
  if ("oncopy" in e) { return true }
  e.setAttribute("oncopy", "return;")
  return typeof e.oncopy == "function"
})()

var badZoomedRects = null
function hasBadZoomedRects(measure) {
  if (badZoomedRects != null) { return badZoomedRects }
  var node = removeChildrenAndAdd(measure, elt("span", "x"))
  var normal = node.getBoundingClientRect()
  var fromRange = range(node, 0, 1).getBoundingClientRect()
  return badZoomedRects = Math.abs(normal.left - fromRange.left) > 1
}

var modes = {};
var mimeModes = {};
// Extra arguments are stored as the mode's dependencies, which is
// used by (legacy) mechanisms like loadmode.js to automatically
// load a mode. (Preferred mechanism is the require/define calls.)
function defineMode(name, mode) {
  if (arguments.length > 2)
    { mode.dependencies = Array.prototype.slice.call(arguments, 2) }
  modes[name] = mode
}

function defineMIME(mime, spec) {
  mimeModes[mime] = spec
}

// Given a MIME type, a {name, ...options} config object, or a name
// string, return a mode config object.
function resolveMode(spec) {
  if (typeof spec == "string" && mimeModes.hasOwnProperty(spec)) {
    spec = mimeModes[spec]
  } else if (spec && typeof spec.name == "string" && mimeModes.hasOwnProperty(spec.name)) {
    var found = mimeModes[spec.name]
    if (typeof found == "string") { found = {name: found} }
    spec = createObj(found, spec)
    spec.name = found.name
  } else if (typeof spec == "string" && /^[\w\-]+\/[\w\-]+\+xml$/.test(spec)) {
    return resolveMode("application/xml")
  } else if (typeof spec == "string" && /^[\w\-]+\/[\w\-]+\+json$/.test(spec)) {
    return resolveMode("application/json")
  }
  if (typeof spec == "string") { return {name: spec} }
  else { return spec || {name: "null"} }
}

// Given a mode spec (anything that resolveMode accepts), find and
// initialize an actual mode object.
function getMode(options, spec) {
  spec = resolveMode(spec)
  var mfactory = modes[spec.name]
  if (!mfactory) { return getMode(options, "text/plain") }
  var modeObj = mfactory(options, spec)
  if (modeExtensions.hasOwnProperty(spec.name)) {
    var exts = modeExtensions[spec.name]
    for (var prop in exts) {
      if (!exts.hasOwnProperty(prop)) { continue }
      if (modeObj.hasOwnProperty(prop)) { modeObj["_" + prop] = modeObj[prop] }
      modeObj[prop] = exts[prop]
    }
  }
  modeObj.name = spec.name
  if (spec.helperType) { modeObj.helperType = spec.helperType }
  if (spec.modeProps) { for (var prop$1 in spec.modeProps)
    { modeObj[prop$1] = spec.modeProps[prop$1] } }

  return modeObj
}

// This can be used to attach properties to mode objects from
// outside the actual mode definition.
var modeExtensions = {}
function extendMode(mode, properties) {
  var exts = modeExtensions.hasOwnProperty(mode) ? modeExtensions[mode] : (modeExtensions[mode] = {})
  copyObj(properties, exts)
}

function copyState(mode, state) {
  if (state === true) { return state }
  if (mode.copyState) { return mode.copyState(state) }
  var nstate = {}
  for (var n in state) {
    var val = state[n]
    if (val instanceof Array) { val = val.concat([]) }
    nstate[n] = val
  }
  return nstate
}

// Given a mode and a state (for that mode), find the inner mode and
// state at the position that the state refers to.
function innerMode(mode, state) {
  var info
  while (mode.innerMode) {
    info = mode.innerMode(state)
    if (!info || info.mode == mode) { break }
    state = info.state
    mode = info.mode
  }
  return info || {mode: mode, state: state}
}

function startState(mode, a1, a2) {
  return mode.startState ? mode.startState(a1, a2) : true
}

// STRING STREAM

// Fed to the mode parsers, provides helper functions to make
// parsers more succinct.

var StringStream = function(string, tabSize, lineOracle) {
  this.pos = this.start = 0
  this.string = string
  this.tabSize = tabSize || 8
  this.lastColumnPos = this.lastColumnValue = 0
  this.lineStart = 0
  this.lineOracle = lineOracle
};

StringStream.prototype.eol = function () {return this.pos >= this.string.length};
StringStream.prototype.sol = function () {return this.pos == this.lineStart};
StringStream.prototype.peek = function () {return this.string.charAt(this.pos) || undefined};
StringStream.prototype.next = function () {
  if (this.pos < this.string.length)
    { return this.string.charAt(this.pos++) }
};
StringStream.prototype.eat = function (match) {
  var ch = this.string.charAt(this.pos)
  var ok
  if (typeof match == "string") { ok = ch == match }
  else { ok = ch && (match.test ? match.test(ch) : match(ch)) }
  if (ok) {++this.pos; return ch}
};
StringStream.prototype.eatWhile = function (match) {
  var start = this.pos
  while (this.eat(match)){}
  return this.pos > start
};
StringStream.prototype.eatSpace = function () {
    var this$1 = this;

  var start = this.pos
  while (/[\s\u00a0]/.test(this.string.charAt(this.pos))) { ++this$1.pos }
  return this.pos > start
};
StringStream.prototype.skipToEnd = function () {this.pos = this.string.length};
StringStream.prototype.skipTo = function (ch) {
  var found = this.string.indexOf(ch, this.pos)
  if (found > -1) {this.pos = found; return true}
};
StringStream.prototype.backUp = function (n) {this.pos -= n};
StringStream.prototype.column = function () {
  if (this.lastColumnPos < this.start) {
    this.lastColumnValue = countColumn(this.string, this.start, this.tabSize, this.lastColumnPos, this.lastColumnValue)
    this.lastColumnPos = this.start
  }
  return this.lastColumnValue - (this.lineStart ? countColumn(this.string, this.lineStart, this.tabSize) : 0)
};
StringStream.prototype.indentation = function () {
  return countColumn(this.string, null, this.tabSize) -
    (this.lineStart ? countColumn(this.string, this.lineStart, this.tabSize) : 0)
};
StringStream.prototype.match = function (pattern, consume, caseInsensitive) {
  if (typeof pattern == "string") {
    var cased = function (str) { return caseInsensitive ? str.toLowerCase() : str; }
    var substr = this.string.substr(this.pos, pattern.length)
    if (cased(substr) == cased(pattern)) {
      if (consume !== false) { this.pos += pattern.length }
      return true
    }
  } else {
    var match = this.string.slice(this.pos).match(pattern)
    if (match && match.index > 0) { return null }
    if (match && consume !== false) { this.pos += match[0].length }
    return match
  }
};
StringStream.prototype.current = function (){return this.string.slice(this.start, this.pos)};
StringStream.prototype.hideFirstChars = function (n, inner) {
  this.lineStart += n
  try { return inner() }
  finally { this.lineStart -= n }
};
StringStream.prototype.lookAhead = function (n) {
  var oracle = this.lineOracle
  return oracle && oracle.lookAhead(n)
};
StringStream.prototype.baseToken = function () {
  var oracle = this.lineOracle
  return oracle && oracle.baseToken(this.pos)
};

var SavedContext = function(state, lookAhead) {
  this.state = state
  this.lookAhead = lookAhead
};

var Context = function(doc, state, line, lookAhead) {
  this.state = state
  this.doc = doc
  this.line = line
  this.maxLookAhead = lookAhead || 0
  this.baseTokens = null
  this.baseTokenPos = 1
};

Context.prototype.lookAhead = function (n) {
  var line = this.doc.getLine(this.line + n)
  if (line != null && n > this.maxLookAhead) { this.maxLookAhead = n }
  return line
};

Context.prototype.baseToken = function (n) {
    var this$1 = this;

  if (!this.baseTokens) { return null }
  while (this.baseTokens[this.baseTokenPos] <= n)
    { this$1.baseTokenPos += 2 }
  var type = this.baseTokens[this.baseTokenPos + 1]
  return {type: type && type.replace(/( |^)overlay .*/, ""),
          size: this.baseTokens[this.baseTokenPos] - n}
};

Context.prototype.nextLine = function () {
  this.line++
  if (this.maxLookAhead > 0) { this.maxLookAhead-- }
};

Context.fromSaved = function (doc, saved, line) {
  if (saved instanceof SavedContext)
    { return new Context(doc, copyState(doc.mode, saved.state), line, saved.lookAhead) }
  else
    { return new Context(doc, copyState(doc.mode, saved), line) }
};

Context.prototype.save = function (copy) {
  var state = copy !== false ? copyState(this.doc.mode, this.state) : this.state
  return this.maxLookAhead > 0 ? new SavedContext(state, this.maxLookAhead) : state
};


// Compute a style array (an array starting with a mode generation
// -- for invalidation -- followed by pairs of end positions and
// style strings), which is used to highlight the tokens on the
// line.
function highlightLine(cm, line, context, forceToEnd) {
  // A styles array always starts with a number identifying the
  // mode/overlays that it is based on (for easy invalidation).
  var st = [cm.state.modeGen], lineClasses = {}
  // Compute the base array of styles
  runMode(cm, line.text, cm.doc.mode, context, function (end, style) { return st.push(end, style); },
          lineClasses, forceToEnd)
  var state = context.state

  // Run overlays, adjust style array.
  var loop = function ( o ) {
    context.baseTokens = st
    var overlay = cm.state.overlays[o], i = 1, at = 0
    context.state = true
    runMode(cm, line.text, overlay.mode, context, function (end, style) {
      var start = i
      // Ensure there's a token end at the current position, and that i points at it
      while (at < end) {
        var i_end = st[i]
        if (i_end > end)
          { st.splice(i, 1, end, st[i+1], i_end) }
        i += 2
        at = Math.min(end, i_end)
      }
      if (!style) { return }
      if (overlay.opaque) {
        st.splice(start, i - start, end, "overlay " + style)
        i = start + 2
      } else {
        for (; start < i; start += 2) {
          var cur = st[start+1]
          st[start+1] = (cur ? cur + " " : "") + "overlay " + style
        }
      }
    }, lineClasses)
    context.state = state
    context.baseTokens = null
    context.baseTokenPos = 1
  };

  for (var o = 0; o < cm.state.overlays.length; ++o) loop( o );

  return {styles: st, classes: lineClasses.bgClass || lineClasses.textClass ? lineClasses : null}
}

function getLineStyles(cm, line, updateFrontier) {
  if (!line.styles || line.styles[0] != cm.state.modeGen) {
    var context = getContextBefore(cm, lineNo(line))
    var resetState = line.text.length > cm.options.maxHighlightLength && copyState(cm.doc.mode, context.state)
    var result = highlightLine(cm, line, context)
    if (resetState) { context.state = resetState }
    line.stateAfter = context.save(!resetState)
    line.styles = result.styles
    if (result.classes) { line.styleClasses = result.classes }
    else if (line.styleClasses) { line.styleClasses = null }
    if (updateFrontier === cm.doc.highlightFrontier)
      { cm.doc.modeFrontier = Math.max(cm.doc.modeFrontier, ++cm.doc.highlightFrontier) }
  }
  return line.styles
}

function getContextBefore(cm, n, precise) {
  var doc = cm.doc, display = cm.display
  if (!doc.mode.startState) { return new Context(doc, true, n) }
  var start = findStartLine(cm, n, precise)
  var saved = start > doc.first && getLine(doc, start - 1).stateAfter
  var context = saved ? Context.fromSaved(doc, saved, start) : new Context(doc, startState(doc.mode), start)

  doc.iter(start, n, function (line) {
    processLine(cm, line.text, context)
    var pos = context.line
    line.stateAfter = pos == n - 1 || pos % 5 == 0 || pos >= display.viewFrom && pos < display.viewTo ? context.save() : null
    context.nextLine()
  })
  if (precise) { doc.modeFrontier = context.line }
  return context
}

// Lightweight form of highlight -- proceed over this line and
// update state, but don't save a style array. Used for lines that
// aren't currently visible.
function processLine(cm, text, context, startAt) {
  var mode = cm.doc.mode
  var stream = new StringStream(text, cm.options.tabSize, context)
  stream.start = stream.pos = startAt || 0
  if (text == "") { callBlankLine(mode, context.state) }
  while (!stream.eol()) {
    readToken(mode, stream, context.state)
    stream.start = stream.pos
  }
}

function callBlankLine(mode, state) {
  if (mode.blankLine) { return mode.blankLine(state) }
  if (!mode.innerMode) { return }
  var inner = innerMode(mode, state)
  if (inner.mode.blankLine) { return inner.mode.blankLine(inner.state) }
}

function readToken(mode, stream, state, inner) {
  for (var i = 0; i < 10; i++) {
    if (inner) { inner[0] = innerMode(mode, state).mode }
    var style = mode.token(stream, state)
    if (stream.pos > stream.start) { return style }
  }
  throw new Error("Mode " + mode.name + " failed to advance stream.")
}

var Token = function(stream, type, state) {
  this.start = stream.start; this.end = stream.pos
  this.string = stream.current()
  this.type = type || null
  this.state = state
};

// Utility for getTokenAt and getLineTokens
function takeToken(cm, pos, precise, asArray) {
  var doc = cm.doc, mode = doc.mode, style
  pos = clipPos(doc, pos)
  var line = getLine(doc, pos.line), context = getContextBefore(cm, pos.line, precise)
  var stream = new StringStream(line.text, cm.options.tabSize, context), tokens
  if (asArray) { tokens = [] }
  while ((asArray || stream.pos < pos.ch) && !stream.eol()) {
    stream.start = stream.pos
    style = readToken(mode, stream, context.state)
    if (asArray) { tokens.push(new Token(stream, style, copyState(doc.mode, context.state))) }
  }
  return asArray ? tokens : new Token(stream, style, context.state)
}

function extractLineClasses(type, output) {
  if (type) { for (;;) {
    var lineClass = type.match(/(?:^|\s+)line-(background-)?(\S+)/)
    if (!lineClass) { break }
    type = type.slice(0, lineClass.index) + type.slice(lineClass.index + lineClass[0].length)
    var prop = lineClass[1] ? "bgClass" : "textClass"
    if (output[prop] == null)
      { output[prop] = lineClass[2] }
    else if (!(new RegExp("(?:^|\s)" + lineClass[2] + "(?:$|\s)")).test(output[prop]))
      { output[prop] += " " + lineClass[2] }
  } }
  return type
}

// Run the given mode's parser over a line, calling f for each token.
function runMode(cm, text, mode, context, f, lineClasses, forceToEnd) {
  var flattenSpans = mode.flattenSpans
  if (flattenSpans == null) { flattenSpans = cm.options.flattenSpans }
  var curStart = 0, curStyle = null
  var stream = new StringStream(text, cm.options.tabSize, context), style
  var inner = cm.options.addModeClass && [null]
  if (text == "") { extractLineClasses(callBlankLine(mode, context.state), lineClasses) }
  while (!stream.eol()) {
    if (stream.pos > cm.options.maxHighlightLength) {
      flattenSpans = false
      if (forceToEnd) { processLine(cm, text, context, stream.pos) }
      stream.pos = text.length
      style = null
    } else {
      style = extractLineClasses(readToken(mode, stream, context.state, inner), lineClasses)
    }
    if (inner) {
      var mName = inner[0].name
      if (mName) { style = "m-" + (style ? mName + " " + style : mName) }
    }
    if (!flattenSpans || curStyle != style) {
      while (curStart < stream.start) {
        curStart = Math.min(stream.start, curStart + 5000)
        f(curStart, curStyle)
      }
      curStyle = style
    }
    stream.start = stream.pos
  }
  while (curStart < stream.pos) {
    // Webkit seems to refuse to render text nodes longer than 57444
    // characters, and returns inaccurate measurements in nodes
    // starting around 5000 chars.
    var pos = Math.min(stream.pos, curStart + 5000)
    f(pos, curStyle)
    curStart = pos
  }
}

// Finds the line to start with when starting a parse. Tries to
// find a line with a stateAfter, so that it can start with a
// valid state. If that fails, it returns the line with the
// smallest indentation, which tends to need the least context to
// parse correctly.
function findStartLine(cm, n, precise) {
  var minindent, minline, doc = cm.doc
  var lim = precise ? -1 : n - (cm.doc.mode.innerMode ? 1000 : 100)
  for (var search = n; search > lim; --search) {
    if (search <= doc.first) { return doc.first }
    var line = getLine(doc, search - 1), after = line.stateAfter
    if (after && (!precise || search + (after instanceof SavedContext ? after.lookAhead : 0) <= doc.modeFrontier))
      { return search }
    var indented = countColumn(line.text, null, cm.options.tabSize)
    if (minline == null || minindent > indented) {
      minline = search - 1
      minindent = indented
    }
  }
  return minline
}

function retreatFrontier(doc, n) {
  doc.modeFrontier = Math.min(doc.modeFrontier, n)
  if (doc.highlightFrontier < n - 10) { return }
  var start = doc.first
  for (var line = n - 1; line > start; line--) {
    var saved = getLine(doc, line).stateAfter
    // change is on 3
    // state on line 1 looked ahead 2 -- so saw 3
    // test 1 + 2 < 3 should cover this
    if (saved && (!(saved instanceof SavedContext) || line + saved.lookAhead < n)) {
      start = line + 1
      break
    }
  }
  doc.highlightFrontier = Math.min(doc.highlightFrontier, start)
}

// LINE DATA STRUCTURE

// Line objects. These hold state related to a line, including
// highlighting info (the styles array).
var Line = function(text, markedSpans, estimateHeight) {
  this.text = text
  attachMarkedSpans(this, markedSpans)
  this.height = estimateHeight ? estimateHeight(this) : 1
};

Line.prototype.lineNo = function () { return lineNo(this) };
eventMixin(Line)

// Change the content (text, markers) of a line. Automatically
// invalidates cached information and tries to re-estimate the
// line's height.
function updateLine(line, text, markedSpans, estimateHeight) {
  line.text = text
  if (line.stateAfter) { line.stateAfter = null }
  if (line.styles) { line.styles = null }
  if (line.order != null) { line.order = null }
  detachMarkedSpans(line)
  attachMarkedSpans(line, markedSpans)
  var estHeight = estimateHeight ? estimateHeight(line) : 1
  if (estHeight != line.height) { updateLineHeight(line, estHeight) }
}

// Detach a line from the document tree and its markers.
function cleanUpLine(line) {
  line.parent = null
  detachMarkedSpans(line)
}

// Convert a style as returned by a mode (either null, or a string
// containing one or more styles) to a CSS style. This is cached,
// and also looks for line-wide styles.
var styleToClassCache = {};
var styleToClassCacheWithMode = {};
function interpretTokenStyle(style, options) {
  if (!style || /^\s*$/.test(style)) { return null }
  var cache = options.addModeClass ? styleToClassCacheWithMode : styleToClassCache
  return cache[style] ||
    (cache[style] = style.replace(/\S+/g, "cm-$&"))
}

// Render the DOM representation of the text of a line. Also builds
// up a 'line map', which points at the DOM nodes that represent
// specific stretches of text, and is used by the measuring code.
// The returned object contains the DOM node, this map, and
// information about line-wide styles that were set by the mode.
function buildLineContent(cm, lineView) {
  // The padding-right forces the element to have a 'border', which
  // is needed on Webkit to be able to get line-level bounding
  // rectangles for it (in measureChar).
  var content = eltP("span", null, null, webkit ? "padding-right: .1px" : null)
  var builder = {pre: eltP("pre", [content], "CodeMirror-line"), content: content,
                 col: 0, pos: 0, cm: cm,
                 trailingSpace: false,
                 splitSpaces: (ie || webkit) && cm.getOption("lineWrapping")}
  lineView.measure = {}

  // Iterate over the logical lines that make up this visual line.
  for (var i = 0; i <= (lineView.rest ? lineView.rest.length : 0); i++) {
    var line = i ? lineView.rest[i - 1] : lineView.line, order = (void 0)
    builder.pos = 0
    builder.addToken = buildToken
    // Optionally wire in some hacks into the token-rendering
    // algorithm, to deal with browser quirks.
    if (hasBadBidiRects(cm.display.measure) && (order = getOrder(line, cm.doc.direction)))
      { builder.addToken = buildTokenBadBidi(builder.addToken, order) }
    builder.map = []
    var allowFrontierUpdate = lineView != cm.display.externalMeasured && lineNo(line)
    insertLineContent(line, builder, getLineStyles(cm, line, allowFrontierUpdate))
    if (line.styleClasses) {
      if (line.styleClasses.bgClass)
        { builder.bgClass = joinClasses(line.styleClasses.bgClass, builder.bgClass || "") }
      if (line.styleClasses.textClass)
        { builder.textClass = joinClasses(line.styleClasses.textClass, builder.textClass || "") }
    }

    // Ensure at least a single node is present, for measuring.
    if (builder.map.length == 0)
      { builder.map.push(0, 0, builder.content.appendChild(zeroWidthElement(cm.display.measure))) }

    // Store the map and a cache object for the current logical line
    if (i == 0) {
      lineView.measure.map = builder.map
      lineView.measure.cache = {}
    } else {
      ;(lineView.measure.maps || (lineView.measure.maps = [])).push(builder.map)
      ;(lineView.measure.caches || (lineView.measure.caches = [])).push({})
    }
  }

  // See issue #2901
  if (webkit) {
    var last = builder.content.lastChild
    if (/\bcm-tab\b/.test(last.className) || (last.querySelector && last.querySelector(".cm-tab")))
      { builder.content.className = "cm-tab-wrap-hack" }
  }

  signal(cm, "renderLine", cm, lineView.line, builder.pre)
  if (builder.pre.className)
    { builder.textClass = joinClasses(builder.pre.className, builder.textClass || "") }

  return builder
}

function defaultSpecialCharPlaceholder(ch) {
  var token = elt("span", "\u2022", "cm-invalidchar")
  token.title = "\\u" + ch.charCodeAt(0).toString(16)
  token.setAttribute("aria-label", token.title)
  return token
}

// Build up the DOM representation for a single token, and add it to
// the line map. Takes care to render special characters separately.
function buildToken(builder, text, style, startStyle, endStyle, title, css) {
  if (!text) { return }
  var displayText = builder.splitSpaces ? splitSpaces(text, builder.trailingSpace) : text
  var special = builder.cm.state.specialChars, mustWrap = false
  var content
  if (!special.test(text)) {
    builder.col += text.length
    content = document.createTextNode(displayText)
    builder.map.push(builder.pos, builder.pos + text.length, content)
    if (ie && ie_version < 9) { mustWrap = true }
    builder.pos += text.length
  } else {
    content = document.createDocumentFragment()
    var pos = 0
    while (true) {
      special.lastIndex = pos
      var m = special.exec(text)
      var skipped = m ? m.index - pos : text.length - pos
      if (skipped) {
        var txt = document.createTextNode(displayText.slice(pos, pos + skipped))
        if (ie && ie_version < 9) { content.appendChild(elt("span", [txt])) }
        else { content.appendChild(txt) }
        builder.map.push(builder.pos, builder.pos + skipped, txt)
        builder.col += skipped
        builder.pos += skipped
      }
      if (!m) { break }
      pos += skipped + 1
      var txt$1 = (void 0)
      if (m[0] == "\t") {
        var tabSize = builder.cm.options.tabSize, tabWidth = tabSize - builder.col % tabSize
        txt$1 = content.appendChild(elt("span", spaceStr(tabWidth), "cm-tab"))
        txt$1.setAttribute("role", "presentation")
        txt$1.setAttribute("cm-text", "\t")
        builder.col += tabWidth
      } else if (m[0] == "\r" || m[0] == "\n") {
        txt$1 = content.appendChild(elt("span", m[0] == "\r" ? "\u240d" : "\u2424", "cm-invalidchar"))
        txt$1.setAttribute("cm-text", m[0])
        builder.col += 1
      } else {
        txt$1 = builder.cm.options.specialCharPlaceholder(m[0])
        txt$1.setAttribute("cm-text", m[0])
        if (ie && ie_version < 9) { content.appendChild(elt("span", [txt$1])) }
        else { content.appendChild(txt$1) }
        builder.col += 1
      }
      builder.map.push(builder.pos, builder.pos + 1, txt$1)
      builder.pos++
    }
  }
  builder.trailingSpace = displayText.charCodeAt(text.length - 1) == 32
  if (style || startStyle || endStyle || mustWrap || css) {
    var fullStyle = style || ""
    if (startStyle) { fullStyle += startStyle }
    if (endStyle) { fullStyle += endStyle }
    var token = elt("span", [content], fullStyle, css)
    if (title) { token.title = title }
    return builder.content.appendChild(token)
  }
  builder.content.appendChild(content)
}

function splitSpaces(text, trailingBefore) {
  if (text.length > 1 && !/  /.test(text)) { return text }
  var spaceBefore = trailingBefore, result = ""
  for (var i = 0; i < text.length; i++) {
    var ch = text.charAt(i)
    if (ch == " " && spaceBefore && (i == text.length - 1 || text.charCodeAt(i + 1) == 32))
      { ch = "\u00a0" }
    result += ch
    spaceBefore = ch == " "
  }
  return result
}

// Work around nonsense dimensions being reported for stretches of
// right-to-left text.
function buildTokenBadBidi(inner, order) {
  return function (builder, text, style, startStyle, endStyle, title, css) {
    style = style ? style + " cm-force-border" : "cm-force-border"
    var start = builder.pos, end = start + text.length
    for (;;) {
      // Find the part that overlaps with the start of this text
      var part = (void 0)
      for (var i = 0; i < order.length; i++) {
        part = order[i]
        if (part.to > start && part.from <= start) { break }
      }
      if (part.to >= end) { return inner(builder, text, style, startStyle, endStyle, title, css) }
      inner(builder, text.slice(0, part.to - start), style, startStyle, null, title, css)
      startStyle = null
      text = text.slice(part.to - start)
      start = part.to
    }
  }
}

function buildCollapsedSpan(builder, size, marker, ignoreWidget) {
  var widget = !ignoreWidget && marker.widgetNode
  if (widget) { builder.map.push(builder.pos, builder.pos + size, widget) }
  if (!ignoreWidget && builder.cm.display.input.needsContentAttribute) {
    if (!widget)
      { widget = builder.content.appendChild(document.createElement("span")) }
    widget.setAttribute("cm-marker", marker.id)
  }
  if (widget) {
    builder.cm.display.input.setUneditable(widget)
    builder.content.appendChild(widget)
  }
  builder.pos += size
  builder.trailingSpace = false
}

// Outputs a number of spans to make up a line, taking highlighting
// and marked text into account.
function insertLineContent(line, builder, styles) {
  var spans = line.markedSpans, allText = line.text, at = 0
  if (!spans) {
    for (var i$1 = 1; i$1 < styles.length; i$1+=2)
      { builder.addToken(builder, allText.slice(at, at = styles[i$1]), interpretTokenStyle(styles[i$1+1], builder.cm.options)) }
    return
  }

  var len = allText.length, pos = 0, i = 1, text = "", style, css
  var nextChange = 0, spanStyle, spanEndStyle, spanStartStyle, title, collapsed
  for (;;) {
    if (nextChange == pos) { // Update current marker set
      spanStyle = spanEndStyle = spanStartStyle = title = css = ""
      collapsed = null; nextChange = Infinity
      var foundBookmarks = [], endStyles = (void 0)
      for (var j = 0; j < spans.length; ++j) {
        var sp = spans[j], m = sp.marker
        if (m.type == "bookmark" && sp.from == pos && m.widgetNode) {
          foundBookmarks.push(m)
        } else if (sp.from <= pos && (sp.to == null || sp.to > pos || m.collapsed && sp.to == pos && sp.from == pos)) {
          if (sp.to != null && sp.to != pos && nextChange > sp.to) {
            nextChange = sp.to
            spanEndStyle = ""
          }
          if (m.className) { spanStyle += " " + m.className }
          if (m.css) { css = (css ? css + ";" : "") + m.css }
          if (m.startStyle && sp.from == pos) { spanStartStyle += " " + m.startStyle }
          if (m.endStyle && sp.to == nextChange) { (endStyles || (endStyles = [])).push(m.endStyle, sp.to) }
          if (m.title && !title) { title = m.title }
          if (m.collapsed && (!collapsed || compareCollapsedMarkers(collapsed.marker, m) < 0))
            { collapsed = sp }
        } else if (sp.from > pos && nextChange > sp.from) {
          nextChange = sp.from
        }
      }
      if (endStyles) { for (var j$1 = 0; j$1 < endStyles.length; j$1 += 2)
        { if (endStyles[j$1 + 1] == nextChange) { spanEndStyle += " " + endStyles[j$1] } } }

      if (!collapsed || collapsed.from == pos) { for (var j$2 = 0; j$2 < foundBookmarks.length; ++j$2)
        { buildCollapsedSpan(builder, 0, foundBookmarks[j$2]) } }
      if (collapsed && (collapsed.from || 0) == pos) {
        buildCollapsedSpan(builder, (collapsed.to == null ? len + 1 : collapsed.to) - pos,
                           collapsed.marker, collapsed.from == null)
        if (collapsed.to == null) { return }
        if (collapsed.to == pos) { collapsed = false }
      }
    }
    if (pos >= len) { break }

    var upto = Math.min(len, nextChange)
    while (true) {
      if (text) {
        var end = pos + text.length
        if (!collapsed) {
          var tokenText = end > upto ? text.slice(0, upto - pos) : text
          builder.addToken(builder, tokenText, style ? style + spanStyle : spanStyle,
                           spanStartStyle, pos + tokenText.length == nextChange ? spanEndStyle : "", title, css)
        }
        if (end >= upto) {text = text.slice(upto - pos); pos = upto; break}
        pos = end
        spanStartStyle = ""
      }
      text = allText.slice(at, at = styles[i++])
      style = interpretTokenStyle(styles[i++], builder.cm.options)
    }
  }
}


// These objects are used to represent the visible (currently drawn)
// part of the document. A LineView may correspond to multiple
// logical lines, if those are connected by collapsed ranges.
function LineView(doc, line, lineN) {
  // The starting line
  this.line = line
  // Continuing lines, if any
  this.rest = visualLineContinued(line)
  // Number of logical lines in this visual line
  this.size = this.rest ? lineNo(lst(this.rest)) - lineN + 1 : 1
  this.node = this.text = null
  this.hidden = lineIsHidden(doc, line)
}

// Create a range of LineView objects for the given lines.
function buildViewArray(cm, from, to) {
  var array = [], nextPos
  for (var pos = from; pos < to; pos = nextPos) {
    var view = new LineView(cm.doc, getLine(cm.doc, pos), pos)
    nextPos = pos + view.size
    array.push(view)
  }
  return array
}

var operationGroup = null

function pushOperation(op) {
  if (operationGroup) {
    operationGroup.ops.push(op)
  } else {
    op.ownsGroup = operationGroup = {
      ops: [op],
      delayedCallbacks: []
    }
  }
}

function fireCallbacksForOps(group) {
  // Calls delayed callbacks and cursorActivity handlers until no
  // new ones appear
  var callbacks = group.delayedCallbacks, i = 0
  do {
    for (; i < callbacks.length; i++)
      { callbacks[i].call(null) }
    for (var j = 0; j < group.ops.length; j++) {
      var op = group.ops[j]
      if (op.cursorActivityHandlers)
        { while (op.cursorActivityCalled < op.cursorActivityHandlers.length)
          { op.cursorActivityHandlers[op.cursorActivityCalled++].call(null, op.cm) } }
    }
  } while (i < callbacks.length)
}

function finishOperation(op, endCb) {
  var group = op.ownsGroup
  if (!group) { return }

  try { fireCallbacksForOps(group) }
  finally {
    operationGroup = null
    endCb(group)
  }
}

var orphanDelayedCallbacks = null

// Often, we want to signal events at a point where we are in the
// middle of some work, but don't want the handler to start calling
// other methods on the editor, which might be in an inconsistent
// state or simply not expect any other events to happen.
// signalLater looks whether there are any handlers, and schedules
// them to be executed when the last operation ends, or, if no
// operation is active, when a timeout fires.
function signalLater(emitter, type /*, values...*/) {
  var arr = getHandlers(emitter, type)
  if (!arr.length) { return }
  var args = Array.prototype.slice.call(arguments, 2), list
  if (operationGroup) {
    list = operationGroup.delayedCallbacks
  } else if (orphanDelayedCallbacks) {
    list = orphanDelayedCallbacks
  } else {
    list = orphanDelayedCallbacks = []
    setTimeout(fireOrphanDelayed, 0)
  }
  var loop = function ( i ) {
    list.push(function () { return arr[i].apply(null, args); })
  };

  for (var i = 0; i < arr.length; ++i)
    loop( i );
}

function fireOrphanDelayed() {
  var delayed = orphanDelayedCallbacks
  orphanDelayedCallbacks = null
  for (var i = 0; i < delayed.length; ++i) { delayed[i]() }
}

// When an aspect of a line changes, a string is added to
// lineView.changes. This updates the relevant part of the line's
// DOM structure.
function updateLineForChanges(cm, lineView, lineN, dims) {
  for (var j = 0; j < lineView.changes.length; j++) {
    var type = lineView.changes[j]
    if (type == "text") { updateLineText(cm, lineView) }
    else if (type == "gutter") { updateLineGutter(cm, lineView, lineN, dims) }
    else if (type == "class") { updateLineClasses(cm, lineView) }
    else if (type == "widget") { updateLineWidgets(cm, lineView, dims) }
  }
  lineView.changes = null
}

// Lines with gutter elements, widgets or a background class need to
// be wrapped, and have the extra elements added to the wrapper div
function ensureLineWrapped(lineView) {
  if (lineView.node == lineView.text) {
    lineView.node = elt("div", null, null, "position: relative")
    if (lineView.text.parentNode)
      { lineView.text.parentNode.replaceChild(lineView.node, lineView.text) }
    lineView.node.appendChild(lineView.text)
    if (ie && ie_version < 8) { lineView.node.style.zIndex = 2 }
  }
  return lineView.node
}

function updateLineBackground(cm, lineView) {
  var cls = lineView.bgClass ? lineView.bgClass + " " + (lineView.line.bgClass || "") : lineView.line.bgClass
  if (cls) { cls += " CodeMirror-linebackground" }
  if (lineView.background) {
    if (cls) { lineView.background.className = cls }
    else { lineView.background.parentNode.removeChild(lineView.background); lineView.background = null }
  } else if (cls) {
    var wrap = ensureLineWrapped(lineView)
    lineView.background = wrap.insertBefore(elt("div", null, cls), wrap.firstChild)
    cm.display.input.setUneditable(lineView.background)
  }
}

// Wrapper around buildLineContent which will reuse the structure
// in display.externalMeasured when possible.
function getLineContent(cm, lineView) {
  var ext = cm.display.externalMeasured
  if (ext && ext.line == lineView.line) {
    cm.display.externalMeasured = null
    lineView.measure = ext.measure
    return ext.built
  }
  return buildLineContent(cm, lineView)
}

// Redraw the line's text. Interacts with the background and text
// classes because the mode may output tokens that influence these
// classes.
function updateLineText(cm, lineView) {
  var cls = lineView.text.className
  var built = getLineContent(cm, lineView)
  if (lineView.text == lineView.node) { lineView.node = built.pre }
  lineView.text.parentNode.replaceChild(built.pre, lineView.text)
  lineView.text = built.pre
  if (built.bgClass != lineView.bgClass || built.textClass != lineView.textClass) {
    lineView.bgClass = built.bgClass
    lineView.textClass = built.textClass
    updateLineClasses(cm, lineView)
  } else if (cls) {
    lineView.text.className = cls
  }
}

function updateLineClasses(cm, lineView) {
  updateLineBackground(cm, lineView)
  if (lineView.line.wrapClass)
    { ensureLineWrapped(lineView).className = lineView.line.wrapClass }
  else if (lineView.node != lineView.text)
    { lineView.node.className = "" }
  var textClass = lineView.textClass ? lineView.textClass + " " + (lineView.line.textClass || "") : lineView.line.textClass
  lineView.text.className = textClass || ""
}

function updateLineGutter(cm, lineView, lineN, dims) {
  if (lineView.gutter) {
    lineView.node.removeChild(lineView.gutter)
    lineView.gutter = null
  }
  if (lineView.gutterBackground) {
    lineView.node.removeChild(lineView.gutterBackground)
    lineView.gutterBackground = null
  }
  if (lineView.line.gutterClass) {
    var wrap = ensureLineWrapped(lineView)
    lineView.gutterBackground = elt("div", null, "CodeMirror-gutter-background " + lineView.line.gutterClass,
                                    ("left: " + (cm.options.fixedGutter ? dims.fixedPos : -dims.gutterTotalWidth) + "px; width: " + (dims.gutterTotalWidth) + "px"))
    cm.display.input.setUneditable(lineView.gutterBackground)
    wrap.insertBefore(lineView.gutterBackground, lineView.text)
  }
  var markers = lineView.line.gutterMarkers
  if (cm.options.lineNumbers || markers) {
    var wrap$1 = ensureLineWrapped(lineView)
    var gutterWrap = lineView.gutter = elt("div", null, "CodeMirror-gutter-wrapper", ("left: " + (cm.options.fixedGutter ? dims.fixedPos : -dims.gutterTotalWidth) + "px"))
    cm.display.input.setUneditable(gutterWrap)
    wrap$1.insertBefore(gutterWrap, lineView.text)
    if (lineView.line.gutterClass)
      { gutterWrap.className += " " + lineView.line.gutterClass }
    if (cm.options.lineNumbers && (!markers || !markers["CodeMirror-linenumbers"]))
      { lineView.lineNumber = gutterWrap.appendChild(
        elt("div", lineNumberFor(cm.options, lineN),
            "CodeMirror-linenumber CodeMirror-gutter-elt",
            ("left: " + (dims.gutterLeft["CodeMirror-linenumbers"]) + "px; width: " + (cm.display.lineNumInnerWidth) + "px"))) }
    if (markers) { for (var k = 0; k < cm.options.gutters.length; ++k) {
      var id = cm.options.gutters[k], found = markers.hasOwnProperty(id) && markers[id]
      if (found)
        { gutterWrap.appendChild(elt("div", [found], "CodeMirror-gutter-elt",
                                   ("left: " + (dims.gutterLeft[id]) + "px; width: " + (dims.gutterWidth[id]) + "px"))) }
    } }
  }
}

function updateLineWidgets(cm, lineView, dims) {
  if (lineView.alignable) { lineView.alignable = null }
  for (var node = lineView.node.firstChild, next = (void 0); node; node = next) {
    next = node.nextSibling
    if (node.className == "CodeMirror-linewidget")
      { lineView.node.removeChild(node) }
  }
  insertLineWidgets(cm, lineView, dims)
}

// Build a line's DOM representation from scratch
function buildLineElement(cm, lineView, lineN, dims) {
  var built = getLineContent(cm, lineView)
  lineView.text = lineView.node = built.pre
  if (built.bgClass) { lineView.bgClass = built.bgClass }
  if (built.textClass) { lineView.textClass = built.textClass }

  updateLineClasses(cm, lineView)
  updateLineGutter(cm, lineView, lineN, dims)
  insertLineWidgets(cm, lineView, dims)
  return lineView.node
}

// A lineView may contain multiple logical lines (when merged by
// collapsed spans). The widgets for all of them need to be drawn.
function insertLineWidgets(cm, lineView, dims) {
  insertLineWidgetsFor(cm, lineView.line, lineView, dims, true)
  if (lineView.rest) { for (var i = 0; i < lineView.rest.length; i++)
    { insertLineWidgetsFor(cm, lineView.rest[i], lineView, dims, false) } }
}

function insertLineWidgetsFor(cm, line, lineView, dims, allowAbove) {
  if (!line.widgets) { return }
  var wrap = ensureLineWrapped(lineView)
  for (var i = 0, ws = line.widgets; i < ws.length; ++i) {
    var widget = ws[i], node = elt("div", [widget.node], "CodeMirror-linewidget")
    if (!widget.handleMouseEvents) { node.setAttribute("cm-ignore-events", "true") }
    positionLineWidget(widget, node, lineView, dims)
    cm.display.input.setUneditable(node)
    if (allowAbove && widget.above)
      { wrap.insertBefore(node, lineView.gutter || lineView.text) }
    else
      { wrap.appendChild(node) }
    signalLater(widget, "redraw")
  }
}

function positionLineWidget(widget, node, lineView, dims) {
  if (widget.noHScroll) {
    ;(lineView.alignable || (lineView.alignable = [])).push(node)
    var width = dims.wrapperWidth
    node.style.left = dims.fixedPos + "px"
    if (!widget.coverGutter) {
      width -= dims.gutterTotalWidth
      node.style.paddingLeft = dims.gutterTotalWidth + "px"
    }
    node.style.width = width + "px"
  }
  if (widget.coverGutter) {
    node.style.zIndex = 5
    node.style.position = "relative"
    if (!widget.noHScroll) { node.style.marginLeft = -dims.gutterTotalWidth + "px" }
  }
}

function widgetHeight(widget) {
  if (widget.height != null) { return widget.height }
  var cm = widget.doc.cm
  if (!cm) { return 0 }
  if (!contains(document.body, widget.node)) {
    var parentStyle = "position: relative;"
    if (widget.coverGutter)
      { parentStyle += "margin-left: -" + cm.display.gutters.offsetWidth + "px;" }
    if (widget.noHScroll)
      { parentStyle += "width: " + cm.display.wrapper.clientWidth + "px;" }
    removeChildrenAndAdd(cm.display.measure, elt("div", [widget.node], null, parentStyle))
  }
  return widget.height = widget.node.parentNode.offsetHeight
}

// Return true when the given mouse event happened in a widget
function eventInWidget(display, e) {
  for (var n = e_target(e); n != display.wrapper; n = n.parentNode) {
    if (!n || (n.nodeType == 1 && n.getAttribute("cm-ignore-events") == "true") ||
        (n.parentNode == display.sizer && n != display.mover))
      { return true }
  }
}

// POSITION MEASUREMENT

function paddingTop(display) {return display.lineSpace.offsetTop}
function paddingVert(display) {return display.mover.offsetHeight - display.lineSpace.offsetHeight}
function paddingH(display) {
  if (display.cachedPaddingH) { return display.cachedPaddingH }
  var e = removeChildrenAndAdd(display.measure, elt("pre", "x"))
  var style = window.getComputedStyle ? window.getComputedStyle(e) : e.currentStyle
  var data = {left: parseInt(style.paddingLeft), right: parseInt(style.paddingRight)}
  if (!isNaN(data.left) && !isNaN(data.right)) { display.cachedPaddingH = data }
  return data
}

function scrollGap(cm) { return scrollerGap - cm.display.nativeBarWidth }
function displayWidth(cm) {
  return cm.display.scroller.clientWidth - scrollGap(cm) - cm.display.barWidth
}
function displayHeight(cm) {
  return cm.display.scroller.clientHeight - scrollGap(cm) - cm.display.barHeight
}

// Ensure the lineView.wrapping.heights array is populated. This is
// an array of bottom offsets for the lines that make up a drawn
// line. When lineWrapping is on, there might be more than one
// height.
function ensureLineHeights(cm, lineView, rect) {
  var wrapping = cm.options.lineWrapping
  var curWidth = wrapping && displayWidth(cm)
  if (!lineView.measure.heights || wrapping && lineView.measure.width != curWidth) {
    var heights = lineView.measure.heights = []
    if (wrapping) {
      lineView.measure.width = curWidth
      var rects = lineView.text.firstChild.getClientRects()
      for (var i = 0; i < rects.length - 1; i++) {
        var cur = rects[i], next = rects[i + 1]
        if (Math.abs(cur.bottom - next.bottom) > 2)
          { heights.push((cur.bottom + next.top) / 2 - rect.top) }
      }
    }
    heights.push(rect.bottom - rect.top)
  }
}

// Find a line map (mapping character offsets to text nodes) and a
// measurement cache for the given line number. (A line view might
// contain multiple lines when collapsed ranges are present.)
function mapFromLineView(lineView, line, lineN) {
  if (lineView.line == line)
    { return {map: lineView.measure.map, cache: lineView.measure.cache} }
  for (var i = 0; i < lineView.rest.length; i++)
    { if (lineView.rest[i] == line)
      { return {map: lineView.measure.maps[i], cache: lineView.measure.caches[i]} } }
  for (var i$1 = 0; i$1 < lineView.rest.length; i$1++)
    { if (lineNo(lineView.rest[i$1]) > lineN)
      { return {map: lineView.measure.maps[i$1], cache: lineView.measure.caches[i$1], before: true} } }
}

// Render a line into the hidden node display.externalMeasured. Used
// when measurement is needed for a line that's not in the viewport.
function updateExternalMeasurement(cm, line) {
  line = visualLine(line)
  var lineN = lineNo(line)
  var view = cm.display.externalMeasured = new LineView(cm.doc, line, lineN)
  view.lineN = lineN
  var built = view.built = buildLineContent(cm, view)
  view.text = built.pre
  removeChildrenAndAdd(cm.display.lineMeasure, built.pre)
  return view
}

// Get a {top, bottom, left, right} box (in line-local coordinates)
// for a given character.
function measureChar(cm, line, ch, bias) {
  return measureCharPrepared(cm, prepareMeasureForLine(cm, line), ch, bias)
}

// Find a line view that corresponds to the given line number.
function findViewForLine(cm, lineN) {
  if (lineN >= cm.display.viewFrom && lineN < cm.display.viewTo)
    { return cm.display.view[findViewIndex(cm, lineN)] }
  var ext = cm.display.externalMeasured
  if (ext && lineN >= ext.lineN && lineN < ext.lineN + ext.size)
    { return ext }
}

// Measurement can be split in two steps, the set-up work that
// applies to the whole line, and the measurement of the actual
// character. Functions like coordsChar, that need to do a lot of
// measurements in a row, can thus ensure that the set-up work is
// only done once.
function prepareMeasureForLine(cm, line) {
  var lineN = lineNo(line)
  var view = findViewForLine(cm, lineN)
  if (view && !view.text) {
    view = null
  } else if (view && view.changes) {
    updateLineForChanges(cm, view, lineN, getDimensions(cm))
    cm.curOp.forceUpdate = true
  }
  if (!view)
    { view = updateExternalMeasurement(cm, line) }

  var info = mapFromLineView(view, line, lineN)
  return {
    line: line, view: view, rect: null,
    map: info.map, cache: info.cache, before: info.before,
    hasHeights: false
  }
}

// Given a prepared measurement object, measures the position of an
// actual character (or fetches it from the cache).
function measureCharPrepared(cm, prepared, ch, bias, varHeight) {
  if (prepared.before) { ch = -1 }
  var key = ch + (bias || ""), found
  if (prepared.cache.hasOwnProperty(key)) {
    found = prepared.cache[key]
  } else {
    if (!prepared.rect)
      { prepared.rect = prepared.view.text.getBoundingClientRect() }
    if (!prepared.hasHeights) {
      ensureLineHeights(cm, prepared.view, prepared.rect)
      prepared.hasHeights = true
    }
    found = measureCharInner(cm, prepared, ch, bias)
    if (!found.bogus) { prepared.cache[key] = found }
  }
  return {left: found.left, right: found.right,
          top: varHeight ? found.rtop : found.top,
          bottom: varHeight ? found.rbottom : found.bottom}
}

var nullRect = {left: 0, right: 0, top: 0, bottom: 0}

function nodeAndOffsetInLineMap(map, ch, bias) {
  var node, start, end, collapse, mStart, mEnd
  // First, search the line map for the text node corresponding to,
  // or closest to, the target character.
  for (var i = 0; i < map.length; i += 3) {
    mStart = map[i]
    mEnd = map[i + 1]
    if (ch < mStart) {
      start = 0; end = 1
      collapse = "left"
    } else if (ch < mEnd) {
      start = ch - mStart
      end = start + 1
    } else if (i == map.length - 3 || ch == mEnd && map[i + 3] > ch) {
      end = mEnd - mStart
      start = end - 1
      if (ch >= mEnd) { collapse = "right" }
    }
    if (start != null) {
      node = map[i + 2]
      if (mStart == mEnd && bias == (node.insertLeft ? "left" : "right"))
        { collapse = bias }
      if (bias == "left" && start == 0)
        { while (i && map[i - 2] == map[i - 3] && map[i - 1].insertLeft) {
          node = map[(i -= 3) + 2]
          collapse = "left"
        } }
      if (bias == "right" && start == mEnd - mStart)
        { while (i < map.length - 3 && map[i + 3] == map[i + 4] && !map[i + 5].insertLeft) {
          node = map[(i += 3) + 2]
          collapse = "right"
        } }
      break
    }
  }
  return {node: node, start: start, end: end, collapse: collapse, coverStart: mStart, coverEnd: mEnd}
}

function getUsefulRect(rects, bias) {
  var rect = nullRect
  if (bias == "left") { for (var i = 0; i < rects.length; i++) {
    if ((rect = rects[i]).left != rect.right) { break }
  } } else { for (var i$1 = rects.length - 1; i$1 >= 0; i$1--) {
    if ((rect = rects[i$1]).left != rect.right) { break }
  } }
  return rect
}

function measureCharInner(cm, prepared, ch, bias) {
  var place = nodeAndOffsetInLineMap(prepared.map, ch, bias)
  var node = place.node, start = place.start, end = place.end, collapse = place.collapse

  var rect
  if (node.nodeType == 3) { // If it is a text node, use a range to retrieve the coordinates.
    for (var i$1 = 0; i$1 < 4; i$1++) { // Retry a maximum of 4 times when nonsense rectangles are returned
      while (start && isExtendingChar(prepared.line.text.charAt(place.coverStart + start))) { --start }
      while (place.coverStart + end < place.coverEnd && isExtendingChar(prepared.line.text.charAt(place.coverStart + end))) { ++end }
      if (ie && ie_version < 9 && start == 0 && end == place.coverEnd - place.coverStart)
        { rect = node.parentNode.getBoundingClientRect() }
      else
        { rect = getUsefulRect(range(node, start, end).getClientRects(), bias) }
      if (rect.left || rect.right || start == 0) { break }
      end = start
      start = start - 1
      collapse = "right"
    }
    if (ie && ie_version < 11) { rect = maybeUpdateRectForZooming(cm.display.measure, rect) }
  } else { // If it is a widget, simply get the box for the whole widget.
    if (start > 0) { collapse = bias = "right" }
    var rects
    if (cm.options.lineWrapping && (rects = node.getClientRects()).length > 1)
      { rect = rects[bias == "right" ? rects.length - 1 : 0] }
    else
      { rect = node.getBoundingClientRect() }
  }
  if (ie && ie_version < 9 && !start && (!rect || !rect.left && !rect.right)) {
    var rSpan = node.parentNode.getClientRects()[0]
    if (rSpan)
      { rect = {left: rSpan.left, right: rSpan.left + charWidth(cm.display), top: rSpan.top, bottom: rSpan.bottom} }
    else
      { rect = nullRect }
  }

  var rtop = rect.top - prepared.rect.top, rbot = rect.bottom - prepared.rect.top
  var mid = (rtop + rbot) / 2
  var heights = prepared.view.measure.heights
  var i = 0
  for (; i < heights.length - 1; i++)
    { if (mid < heights[i]) { break } }
  var top = i ? heights[i - 1] : 0, bot = heights[i]
  var result = {left: (collapse == "right" ? rect.right : rect.left) - prepared.rect.left,
                right: (collapse == "left" ? rect.left : rect.right) - prepared.rect.left,
                top: top, bottom: bot}
  if (!rect.left && !rect.right) { result.bogus = true }
  if (!cm.options.singleCursorHeightPerLine) { result.rtop = rtop; result.rbottom = rbot }

  return result
}

// Work around problem with bounding client rects on ranges being
// returned incorrectly when zoomed on IE10 and below.
function maybeUpdateRectForZooming(measure, rect) {
  if (!window.screen || screen.logicalXDPI == null ||
      screen.logicalXDPI == screen.deviceXDPI || !hasBadZoomedRects(measure))
    { return rect }
  var scaleX = screen.logicalXDPI / screen.deviceXDPI
  var scaleY = screen.logicalYDPI / screen.deviceYDPI
  return {left: rect.left * scaleX, right: rect.right * scaleX,
          top: rect.top * scaleY, bottom: rect.bottom * scaleY}
}

function clearLineMeasurementCacheFor(lineView) {
  if (lineView.measure) {
    lineView.measure.cache = {}
    lineView.measure.heights = null
    if (lineView.rest) { for (var i = 0; i < lineView.rest.length; i++)
      { lineView.measure.caches[i] = {} } }
  }
}

function clearLineMeasurementCache(cm) {
  cm.display.externalMeasure = null
  removeChildren(cm.display.lineMeasure)
  for (var i = 0; i < cm.display.view.length; i++)
    { clearLineMeasurementCacheFor(cm.display.view[i]) }
}

function clearCaches(cm) {
  clearLineMeasurementCache(cm)
  cm.display.cachedCharWidth = cm.display.cachedTextHeight = cm.display.cachedPaddingH = null
  if (!cm.options.lineWrapping) { cm.display.maxLineChanged = true }
  cm.display.lineNumChars = null
}

function pageScrollX() {
  // Work around https://bugs.chromium.org/p/chromium/issues/detail?id=489206
  // which causes page_Offset and bounding client rects to use
  // different reference viewports and invalidate our calculations.
  if (chrome && android) { return -(document.body.getBoundingClientRect().left - parseInt(getComputedStyle(document.body).marginLeft)) }
  return window.pageXOffset || (document.documentElement || document.body).scrollLeft
}
function pageScrollY() {
  if (chrome && android) { return -(document.body.getBoundingClientRect().top - parseInt(getComputedStyle(document.body).marginTop)) }
  return window.pageYOffset || (document.documentElement || document.body).scrollTop
}

function widgetTopHeight(lineObj) {
  var height = 0
  if (lineObj.widgets) { for (var i = 0; i < lineObj.widgets.length; ++i) { if (lineObj.widgets[i].above)
    { height += widgetHeight(lineObj.widgets[i]) } } }
  return height
}

// Converts a {top, bottom, left, right} box from line-local
// coordinates into another coordinate system. Context may be one of
// "line", "div" (display.lineDiv), "local"./null (editor), "window",
// or "page".
function intoCoordSystem(cm, lineObj, rect, context, includeWidgets) {
  if (!includeWidgets) {
    var height = widgetTopHeight(lineObj)
    rect.top += height; rect.bottom += height
  }
  if (context == "line") { return rect }
  if (!context) { context = "local" }
  var yOff = heightAtLine(lineObj)
  if (context == "local") { yOff += paddingTop(cm.display) }
  else { yOff -= cm.display.viewOffset }
  if (context == "page" || context == "window") {
    var lOff = cm.display.lineSpace.getBoundingClientRect()
    yOff += lOff.top + (context == "window" ? 0 : pageScrollY())
    var xOff = lOff.left + (context == "window" ? 0 : pageScrollX())
    rect.left += xOff; rect.right += xOff
  }
  rect.top += yOff; rect.bottom += yOff
  return rect
}

// Coverts a box from "div" coords to another coordinate system.
// Context may be "window", "page", "div", or "local"./null.
function fromCoordSystem(cm, coords, context) {
  if (context == "div") { return coords }
  var left = coords.left, top = coords.top
  // First move into "page" coordinate system
  if (context == "page") {
    left -= pageScrollX()
    top -= pageScrollY()
  } else if (context == "local" || !context) {
    var localBox = cm.display.sizer.getBoundingClientRect()
    left += localBox.left
    top += localBox.top
  }

  var lineSpaceBox = cm.display.lineSpace.getBoundingClientRect()
  return {left: left - lineSpaceBox.left, top: top - lineSpaceBox.top}
}

function charCoords(cm, pos, context, lineObj, bias) {
  if (!lineObj) { lineObj = getLine(cm.doc, pos.line) }
  return intoCoordSystem(cm, lineObj, measureChar(cm, lineObj, pos.ch, bias), context)
}

// Returns a box for a given cursor position, which may have an
// 'other' property containing the position of the secondary cursor
// on a bidi boundary.
// A cursor Pos(line, char, "before") is on the same visual line as `char - 1`
// and after `char - 1` in writing order of `char - 1`
// A cursor Pos(line, char, "after") is on the same visual line as `char`
// and before `char` in writing order of `char`
// Examples (upper-case letters are RTL, lower-case are LTR):
//     Pos(0, 1, ...)
//     before   after
// ab     a|b     a|b
// aB     a|B     aB|
// Ab     |Ab     A|b
// AB     B|A     B|A
// Every position after the last character on a line is considered to stick
// to the last character on the line.
function cursorCoords(cm, pos, context, lineObj, preparedMeasure, varHeight) {
  lineObj = lineObj || getLine(cm.doc, pos.line)
  if (!preparedMeasure) { preparedMeasure = prepareMeasureForLine(cm, lineObj) }
  function get(ch, right) {
    var m = measureCharPrepared(cm, preparedMeasure, ch, right ? "right" : "left", varHeight)
    if (right) { m.left = m.right; } else { m.right = m.left }
    return intoCoordSystem(cm, lineObj, m, context)
  }
  var order = getOrder(lineObj, cm.doc.direction), ch = pos.ch, sticky = pos.sticky
  if (ch >= lineObj.text.length) {
    ch = lineObj.text.length
    sticky = "before"
  } else if (ch <= 0) {
    ch = 0
    sticky = "after"
  }
  if (!order) { return get(sticky == "before" ? ch - 1 : ch, sticky == "before") }

  function getBidi(ch, partPos, invert) {
    var part = order[partPos], right = part.level == 1
    return get(invert ? ch - 1 : ch, right != invert)
  }
  var partPos = getBidiPartAt(order, ch, sticky)
  var other = bidiOther
  var val = getBidi(ch, partPos, sticky == "before")
  if (other != null) { val.other = getBidi(ch, other, sticky != "before") }
  return val
}

// Used to cheaply estimate the coordinates for a position. Used for
// intermediate scroll updates.
function estimateCoords(cm, pos) {
  var left = 0
  pos = clipPos(cm.doc, pos)
  if (!cm.options.lineWrapping) { left = charWidth(cm.display) * pos.ch }
  var lineObj = getLine(cm.doc, pos.line)
  var top = heightAtLine(lineObj) + paddingTop(cm.display)
  return {left: left, right: left, top: top, bottom: top + lineObj.height}
}

// Positions returned by coordsChar contain some extra information.
// xRel is the relative x position of the input coordinates compared
// to the found position (so xRel > 0 means the coordinates are to
// the right of the character position, for example). When outside
// is true, that means the coordinates lie outside the line's
// vertical range.
function PosWithInfo(line, ch, sticky, outside, xRel) {
  var pos = Pos(line, ch, sticky)
  pos.xRel = xRel
  if (outside) { pos.outside = true }
  return pos
}

// Compute the character position closest to the given coordinates.
// Input must be lineSpace-local ("div" coordinate system).
function coordsChar(cm, x, y) {
  var doc = cm.doc
  y += cm.display.viewOffset
  if (y < 0) { return PosWithInfo(doc.first, 0, null, true, -1) }
  var lineN = lineAtHeight(doc, y), last = doc.first + doc.size - 1
  if (lineN > last)
    { return PosWithInfo(doc.first + doc.size - 1, getLine(doc, last).text.length, null, true, 1) }
  if (x < 0) { x = 0 }

  var lineObj = getLine(doc, lineN)
  for (;;) {
    var found = coordsCharInner(cm, lineObj, lineN, x, y)
    var merged = collapsedSpanAtEnd(lineObj)
    var mergedPos = merged && merged.find(0, true)
    if (merged && (found.ch > mergedPos.from.ch || found.ch == mergedPos.from.ch && found.xRel > 0))
      { lineN = lineNo(lineObj = mergedPos.to.line) }
    else
      { return found }
  }
}

function wrappedLineExtent(cm, lineObj, preparedMeasure, y) {
  y -= widgetTopHeight(lineObj)
  var end = lineObj.text.length
  var begin = findFirst(function (ch) { return measureCharPrepared(cm, preparedMeasure, ch - 1).bottom <= y; }, end, 0)
  end = findFirst(function (ch) { return measureCharPrepared(cm, preparedMeasure, ch).top > y; }, begin, end)
  return {begin: begin, end: end}
}

function wrappedLineExtentChar(cm, lineObj, preparedMeasure, target) {
  if (!preparedMeasure) { preparedMeasure = prepareMeasureForLine(cm, lineObj) }
  var targetTop = intoCoordSystem(cm, lineObj, measureCharPrepared(cm, preparedMeasure, target), "line").top
  return wrappedLineExtent(cm, lineObj, preparedMeasure, targetTop)
}

// Returns true if the given side of a box is after the given
// coordinates, in top-to-bottom, left-to-right order.
function boxIsAfter(box, x, y, left) {
  return box.bottom <= y ? false : box.top > y ? true : (left ? box.left : box.right) > x
}

function coordsCharInner(cm, lineObj, lineNo, x, y) {
  // Move y into line-local coordinate space
  y -= heightAtLine(lineObj)
  var preparedMeasure = prepareMeasureForLine(cm, lineObj)
  // When directly calling `measureCharPrepared`, we have to adjust
  // for the widgets at this line.
  var widgetHeight = widgetTopHeight(lineObj)
  var begin = 0, end = lineObj.text.length, ltr = true

  var order = getOrder(lineObj, cm.doc.direction)
  // If the line isn't plain left-to-right text, first figure out
  // which bidi section the coordinates fall into.
  if (order) {
    var part = (cm.options.lineWrapping ? coordsBidiPartWrapped : coordsBidiPart)
                 (cm, lineObj, lineNo, preparedMeasure, order, x, y)
    ltr = part.level != 1
    // The awkward -1 offsets are needed because findFirst (called
    // on these below) will treat its first bound as inclusive,
    // second as exclusive, but we want to actually address the
    // characters in the part's range
    begin = ltr ? part.from : part.to - 1
    end = ltr ? part.to : part.from - 1
  }

  // A binary search to find the first character whose bounding box
  // starts after the coordinates. If we run across any whose box wrap
  // the coordinates, store that.
  var chAround = null, boxAround = null
  var ch = findFirst(function (ch) {
    var box = measureCharPrepared(cm, preparedMeasure, ch)
    box.top += widgetHeight; box.bottom += widgetHeight
    if (!boxIsAfter(box, x, y, false)) { return false }
    if (box.top <= y && box.left <= x) {
      chAround = ch
      boxAround = box
    }
    return true
  }, begin, end)

  var baseX, sticky, outside = false
  // If a box around the coordinates was found, use that
  if (boxAround) {
    // Distinguish coordinates nearer to the left or right side of the box
    var atLeft = x - boxAround.left < boxAround.right - x, atStart = atLeft == ltr
    ch = chAround + (atStart ? 0 : 1)
    sticky = atStart ? "after" : "before"
    baseX = atLeft ? boxAround.left : boxAround.right
  } else {
    // (Adjust for extended bound, if necessary.)
    if (!ltr && (ch == end || ch == begin)) { ch++ }
    // To determine which side to associate with, get the box to the
    // left of the character and compare it's vertical position to the
    // coordinates
    sticky = ch == 0 ? "after" : ch == lineObj.text.length ? "before" :
      (measureCharPrepared(cm, preparedMeasure, ch - (ltr ? 1 : 0)).bottom + widgetHeight <= y) == ltr ?
      "after" : "before"
    // Now get accurate coordinates for this place, in order to get a
    // base X position
    var coords = cursorCoords(cm, Pos(lineNo, ch, sticky), "line", lineObj, preparedMeasure)
    baseX = coords.left
    outside = y < coords.top || y >= coords.bottom
  }

  ch = skipExtendingChars(lineObj.text, ch, 1)
  return PosWithInfo(lineNo, ch, sticky, outside, x - baseX)
}

function coordsBidiPart(cm, lineObj, lineNo, preparedMeasure, order, x, y) {
  // Bidi parts are sorted left-to-right, and in a non-line-wrapping
  // situation, we can take this ordering to correspond to the visual
  // ordering. This finds the first part whose end is after the given
  // coordinates.
  var index = findFirst(function (i) {
    var part = order[i], ltr = part.level != 1
    return boxIsAfter(cursorCoords(cm, Pos(lineNo, ltr ? part.to : part.from, ltr ? "before" : "after"),
                                   "line", lineObj, preparedMeasure), x, y, true)
  }, 0, order.length - 1)
  var part = order[index]
  // If this isn't the first part, the part's start is also after
  // the coordinates, and the coordinates aren't on the same line as
  // that start, move one part back.
  if (index > 0) {
    var ltr = part.level != 1
    var start = cursorCoords(cm, Pos(lineNo, ltr ? part.from : part.to, ltr ? "after" : "before"),
                             "line", lineObj, preparedMeasure)
    if (boxIsAfter(start, x, y, true) && start.top > y)
      { part = order[index - 1] }
  }
  return part
}

function coordsBidiPartWrapped(cm, lineObj, _lineNo, preparedMeasure, order, x, y) {
  // In a wrapped line, rtl text on wrapping boundaries can do things
  // that don't correspond to the ordering in our `order` array at
  // all, so a binary search doesn't work, and we want to return a
  // part that only spans one line so that the binary search in
  // coordsCharInner is safe. As such, we first find the extent of the
  // wrapped line, and then do a flat search in which we discard any
  // spans that aren't on the line.
  var ref = wrappedLineExtent(cm, lineObj, preparedMeasure, y);
  var begin = ref.begin;
  var end = ref.end;
  if (/\s/.test(lineObj.text.charAt(end - 1))) { end-- }
  var part = null, closestDist = null
  for (var i = 0; i < order.length; i++) {
    var p = order[i]
    if (p.from >= end || p.to <= begin) { continue }
    var ltr = p.level != 1
    var endX = measureCharPrepared(cm, preparedMeasure, ltr ? Math.min(end, p.to) - 1 : Math.max(begin, p.from)).right
    // Weigh against spans ending before this, so that they are only
    // picked if nothing ends after
    var dist = endX < x ? x - endX + 1e9 : endX - x
    if (!part || closestDist > dist) {
      part = p
      closestDist = dist
    }
  }
  if (!part) { part = order[order.length - 1] }
  // Clip the part to the wrapped line.
  if (part.from < begin) { part = {from: begin, to: part.to, level: part.level} }
  if (part.to > end) { part = {from: part.from, to: end, level: part.level} }
  return part
}

var measureText
// Compute the default text height.
function textHeight(display) {
  if (display.cachedTextHeight != null) { return display.cachedTextHeight }
  if (measureText == null) {
    measureText = elt("pre")
    // Measure a bunch of lines, for browsers that compute
    // fractional heights.
    for (var i = 0; i < 49; ++i) {
      measureText.appendChild(document.createTextNode("x"))
      measureText.appendChild(elt("br"))
    }
    measureText.appendChild(document.createTextNode("x"))
  }
  removeChildrenAndAdd(display.measure, measureText)
  var height = measureText.offsetHeight / 50
  if (height > 3) { display.cachedTextHeight = height }
  removeChildren(display.measure)
  return height || 1
}

// Compute the default character width.
function charWidth(display) {
  if (display.cachedCharWidth != null) { return display.cachedCharWidth }
  var anchor = elt("span", "xxxxxxxxxx")
  var pre = elt("pre", [anchor])
  removeChildrenAndAdd(display.measure, pre)
  var rect = anchor.getBoundingClientRect(), width = (rect.right - rect.left) / 10
  if (width > 2) { display.cachedCharWidth = width }
  return width || 10
}

// Do a bulk-read of the DOM positions and sizes needed to draw the
// view, so that we don't interleave reading and writing to the DOM.
function getDimensions(cm) {
  var d = cm.display, left = {}, width = {}
  var gutterLeft = d.gutters.clientLeft
  for (var n = d.gutters.firstChild, i = 0; n; n = n.nextSibling, ++i) {
    left[cm.options.gutters[i]] = n.offsetLeft + n.clientLeft + gutterLeft
    width[cm.options.gutters[i]] = n.clientWidth
  }
  return {fixedPos: compensateForHScroll(d),
          gutterTotalWidth: d.gutters.offsetWidth,
          gutterLeft: left,
          gutterWidth: width,
          wrapperWidth: d.wrapper.clientWidth}
}

// Computes display.scroller.scrollLeft + display.gutters.offsetWidth,
// but using getBoundingClientRect to get a sub-pixel-accurate
// result.
function compensateForHScroll(display) {
  return display.scroller.getBoundingClientRect().left - display.sizer.getBoundingClientRect().left
}

// Returns a function that estimates the height of a line, to use as
// first approximation until the line becomes visible (and is thus
// properly measurable).
function estimateHeight(cm) {
  var th = textHeight(cm.display), wrapping = cm.options.lineWrapping
  var perLine = wrapping && Math.max(5, cm.display.scroller.clientWidth / charWidth(cm.display) - 3)
  return function (line) {
    if (lineIsHidden(cm.doc, line)) { return 0 }

    var widgetsHeight = 0
    if (line.widgets) { for (var i = 0; i < line.widgets.length; i++) {
      if (line.widgets[i].height) { widgetsHeight += line.widgets[i].height }
    } }

    if (wrapping)
      { return widgetsHeight + (Math.ceil(line.text.length / perLine) || 1) * th }
    else
      { return widgetsHeight + th }
  }
}

function estimateLineHeights(cm) {
  var doc = cm.doc, est = estimateHeight(cm)
  doc.iter(function (line) {
    var estHeight = est(line)
    if (estHeight != line.height) { updateLineHeight(line, estHeight) }
  })
}

// Given a mouse event, find the corresponding position. If liberal
// is false, it checks whether a gutter or scrollbar was clicked,
// and returns null if it was. forRect is used by rectangular
// selections, and tries to estimate a character position even for
// coordinates beyond the right of the text.
function posFromMouse(cm, e, liberal, forRect) {
  var display = cm.display
  if (!liberal && e_target(e).getAttribute("cm-not-content") == "true") { return null }

  var x, y, space = display.lineSpace.getBoundingClientRect()
  // Fails unpredictably on IE[67] when mouse is dragged around quickly.
  try { x = e.clientX - space.left; y = e.clientY - space.top }
  catch (e) { return null }
  var coords = coordsChar(cm, x, y), line
  if (forRect && coords.xRel == 1 && (line = getLine(cm.doc, coords.line).text).length == coords.ch) {
    var colDiff = countColumn(line, line.length, cm.options.tabSize) - line.length
    coords = Pos(coords.line, Math.max(0, Math.round((x - paddingH(cm.display).left) / charWidth(cm.display)) - colDiff))
  }
  return coords
}

// Find the view element corresponding to a given line. Return null
// when the line isn't visible.
function findViewIndex(cm, n) {
  if (n >= cm.display.viewTo) { return null }
  n -= cm.display.viewFrom
  if (n < 0) { return null }
  var view = cm.display.view
  for (var i = 0; i < view.length; i++) {
    n -= view[i].size
    if (n < 0) { return i }
  }
}

function updateSelection(cm) {
  cm.display.input.showSelection(cm.display.input.prepareSelection())
}

function prepareSelection(cm, primary) {
  if ( primary === void 0 ) primary = true;

  var doc = cm.doc, result = {}
  var curFragment = result.cursors = document.createDocumentFragment()
  var selFragment = result.selection = document.createDocumentFragment()

  for (var i = 0; i < doc.sel.ranges.length; i++) {
    if (!primary && i == doc.sel.primIndex) { continue }
    var range = doc.sel.ranges[i]
    if (range.from().line >= cm.display.viewTo || range.to().line < cm.display.viewFrom) { continue }
    var collapsed = range.empty()
    if (collapsed || cm.options.showCursorWhenSelecting)
      { drawSelectionCursor(cm, range.head, curFragment) }
    if (!collapsed)
      { drawSelectionRange(cm, range, selFragment) }
  }
  return result
}

// Draws a cursor for the given range
function drawSelectionCursor(cm, head, output) {
  var pos = cursorCoords(cm, head, "div", null, null, !cm.options.singleCursorHeightPerLine)

  var cursor = output.appendChild(elt("div", "\u00a0", "CodeMirror-cursor"))
  cursor.style.left = pos.left + "px"
  cursor.style.top = pos.top + "px"
  cursor.style.height = Math.max(0, pos.bottom - pos.top) * cm.options.cursorHeight + "px"

  if (pos.other) {
    // Secondary cursor, shown when on a 'jump' in bi-directional text
    var otherCursor = output.appendChild(elt("div", "\u00a0", "CodeMirror-cursor CodeMirror-secondarycursor"))
    otherCursor.style.display = ""
    otherCursor.style.left = pos.other.left + "px"
    otherCursor.style.top = pos.other.top + "px"
    otherCursor.style.height = (pos.other.bottom - pos.other.top) * .85 + "px"
  }
}

function cmpCoords(a, b) { return a.top - b.top || a.left - b.left }

// Draws the given range as a highlighted selection
function drawSelectionRange(cm, range, output) {
  var display = cm.display, doc = cm.doc
  var fragment = document.createDocumentFragment()
  var padding = paddingH(cm.display), leftSide = padding.left
  var rightSide = Math.max(display.sizerWidth, displayWidth(cm) - display.sizer.offsetLeft) - padding.right
  var docLTR = doc.direction == "ltr"

  function add(left, top, width, bottom) {
    if (top < 0) { top = 0 }
    top = Math.round(top)
    bottom = Math.round(bottom)
    fragment.appendChild(elt("div", null, "CodeMirror-selected", ("position: absolute; left: " + left + "px;\n                             top: " + top + "px; width: " + (width == null ? rightSide - left : width) + "px;\n                             height: " + (bottom - top) + "px")))
  }

  function drawForLine(line, fromArg, toArg) {
    var lineObj = getLine(doc, line)
    var lineLen = lineObj.text.length
    var start, end
    function coords(ch, bias) {
      return charCoords(cm, Pos(line, ch), "div", lineObj, bias)
    }

    function wrapX(pos, dir, side) {
      var extent = wrappedLineExtentChar(cm, lineObj, null, pos)
      var prop = (dir == "ltr") == (side == "after") ? "left" : "right"
      var ch = side == "after" ? extent.begin : extent.end - (/\s/.test(lineObj.text.charAt(extent.end - 1)) ? 2 : 1)
      return coords(ch, prop)[prop]
    }

    var order = getOrder(lineObj, doc.direction)
    iterateBidiSections(order, fromArg || 0, toArg == null ? lineLen : toArg, function (from, to, dir, i) {
      var ltr = dir == "ltr"
      var fromPos = coords(from, ltr ? "left" : "right")
      var toPos = coords(to - 1, ltr ? "right" : "left")

      var openStart = fromArg == null && from == 0, openEnd = toArg == null && to == lineLen
      var first = i == 0, last = !order || i == order.length - 1
      if (toPos.top - fromPos.top <= 3) { // Single line
        var openLeft = (docLTR ? openStart : openEnd) && first
        var openRight = (docLTR ? openEnd : openStart) && last
        var left = openLeft ? leftSide : (ltr ? fromPos : toPos).left
        var right = openRight ? rightSide : (ltr ? toPos : fromPos).right
        add(left, fromPos.top, right - left, fromPos.bottom)
      } else { // Multiple lines
        var topLeft, topRight, botLeft, botRight
        if (ltr) {
          topLeft = docLTR && openStart && first ? leftSide : fromPos.left
          topRight = docLTR ? rightSide : wrapX(from, dir, "before")
          botLeft = docLTR ? leftSide : wrapX(to, dir, "after")
          botRight = docLTR && openEnd && last ? rightSide : toPos.right
        } else {
          topLeft = !docLTR ? leftSide : wrapX(from, dir, "before")
          topRight = !docLTR && openStart && first ? rightSide : fromPos.right
          botLeft = !docLTR && openEnd && last ? leftSide : toPos.left
          botRight = !docLTR ? rightSide : wrapX(to, dir, "after")
        }
        add(topLeft, fromPos.top, topRight - topLeft, fromPos.bottom)
        if (fromPos.bottom < toPos.top) { add(leftSide, fromPos.bottom, null, toPos.top) }
        add(botLeft, toPos.top, botRight - botLeft, toPos.bottom)
      }

      if (!start || cmpCoords(fromPos, start) < 0) { start = fromPos }
      if (cmpCoords(toPos, start) < 0) { start = toPos }
      if (!end || cmpCoords(fromPos, end) < 0) { end = fromPos }
      if (cmpCoords(toPos, end) < 0) { end = toPos }
    })
    return {start: start, end: end}
  }

  var sFrom = range.from(), sTo = range.to()
  if (sFrom.line == sTo.line) {
    drawForLine(sFrom.line, sFrom.ch, sTo.ch)
  } else {
    var fromLine = getLine(doc, sFrom.line), toLine = getLine(doc, sTo.line)
    var singleVLine = visualLine(fromLine) == visualLine(toLine)
    var leftEnd = drawForLine(sFrom.line, sFrom.ch, singleVLine ? fromLine.text.length + 1 : null).end
    var rightStart = drawForLine(sTo.line, singleVLine ? 0 : null, sTo.ch).start
    if (singleVLine) {
      if (leftEnd.top < rightStart.top - 2) {
        add(leftEnd.right, leftEnd.top, null, leftEnd.bottom)
        add(leftSide, rightStart.top, rightStart.left, rightStart.bottom)
      } else {
        add(leftEnd.right, leftEnd.top, rightStart.left - leftEnd.right, leftEnd.bottom)
      }
    }
    if (leftEnd.bottom < rightStart.top)
      { add(leftSide, leftEnd.bottom, null, rightStart.top) }
  }

  output.appendChild(fragment)
}

// Cursor-blinking
function restartBlink(cm) {
  if (!cm.state.focused) { return }
  var display = cm.display
  clearInterval(display.blinker)
  var on = true
  display.cursorDiv.style.visibility = ""
  if (cm.options.cursorBlinkRate > 0)
    { display.blinker = setInterval(function () { return display.cursorDiv.style.visibility = (on = !on) ? "" : "hidden"; },
      cm.options.cursorBlinkRate) }
  else if (cm.options.cursorBlinkRate < 0)
    { display.cursorDiv.style.visibility = "hidden" }
}

function ensureFocus(cm) {
  if (!cm.state.focused) { cm.display.input.focus(); onFocus(cm) }
}

function delayBlurEvent(cm) {
  cm.state.delayingBlurEvent = true
  setTimeout(function () { if (cm.state.delayingBlurEvent) {
    cm.state.delayingBlurEvent = false
    onBlur(cm)
  } }, 100)
}

function onFocus(cm, e) {
  if (cm.state.delayingBlurEvent) { cm.state.delayingBlurEvent = false }

  if (cm.options.readOnly == "nocursor") { return }
  if (!cm.state.focused) {
    signal(cm, "focus", cm, e)
    cm.state.focused = true
    addClass(cm.display.wrapper, "CodeMirror-focused")
    // This test prevents this from firing when a context
    // menu is closed (since the input reset would kill the
    // select-all detection hack)
    if (!cm.curOp && cm.display.selForContextMenu != cm.doc.sel) {
      cm.display.input.reset()
      if (webkit) { setTimeout(function () { return cm.display.input.reset(true); }, 20) } // Issue #1730
    }
    cm.display.input.receivedFocus()
  }
  restartBlink(cm)
}
function onBlur(cm, e) {
  if (cm.state.delayingBlurEvent) { return }

  if (cm.state.focused) {
    signal(cm, "blur", cm, e)
    cm.state.focused = false
    rmClass(cm.display.wrapper, "CodeMirror-focused")
  }
  clearInterval(cm.display.blinker)
  setTimeout(function () { if (!cm.state.focused) { cm.display.shift = false } }, 150)
}

// Read the actual heights of the rendered lines, and update their
// stored heights to match.
function updateHeightsInViewport(cm) {
  var display = cm.display
  var prevBottom = display.lineDiv.offsetTop
  for (var i = 0; i < display.view.length; i++) {
    var cur = display.view[i], height = (void 0)
    if (cur.hidden) { continue }
    if (ie && ie_version < 8) {
      var bot = cur.node.offsetTop + cur.node.offsetHeight
      height = bot - prevBottom
      prevBottom = bot
    } else {
      var box = cur.node.getBoundingClientRect()
      height = box.bottom - box.top
    }
    var diff = cur.line.height - height
    if (height < 2) { height = textHeight(display) }
    if (diff > .005 || diff < -.005) {
      updateLineHeight(cur.line, height)
      updateWidgetHeight(cur.line)
      if (cur.rest) { for (var j = 0; j < cur.rest.length; j++)
        { updateWidgetHeight(cur.rest[j]) } }
    }
  }
}

// Read and store the height of line widgets associated with the
// given line.
function updateWidgetHeight(line) {
  if (line.widgets) { for (var i = 0; i < line.widgets.length; ++i) {
    var w = line.widgets[i], parent = w.node.parentNode
    if (parent) { w.height = parent.offsetHeight }
  } }
}

// Compute the lines that are visible in a given viewport (defaults
// the the current scroll position). viewport may contain top,
// height, and ensure (see op.scrollToPos) properties.
function visibleLines(display, doc, viewport) {
  var top = viewport && viewport.top != null ? Math.max(0, viewport.top) : display.scroller.scrollTop
  top = Math.floor(top - paddingTop(display))
  var bottom = viewport && viewport.bottom != null ? viewport.bottom : top + display.wrapper.clientHeight

  var from = lineAtHeight(doc, top), to = lineAtHeight(doc, bottom)
  // Ensure is a {from: {line, ch}, to: {line, ch}} object, and
  // forces those lines into the viewport (if possible).
  if (viewport && viewport.ensure) {
    var ensureFrom = viewport.ensure.from.line, ensureTo = viewport.ensure.to.line
    if (ensureFrom < from) {
      from = ensureFrom
      to = lineAtHeight(doc, heightAtLine(getLine(doc, ensureFrom)) + display.wrapper.clientHeight)
    } else if (Math.min(ensureTo, doc.lastLine()) >= to) {
      from = lineAtHeight(doc, heightAtLine(getLine(doc, ensureTo)) - display.wrapper.clientHeight)
      to = ensureTo
    }
  }
  return {from: from, to: Math.max(to, from + 1)}
}

// Re-align line numbers and gutter marks to compensate for
// horizontal scrolling.
function alignHorizontally(cm) {
  var display = cm.display, view = display.view
  if (!display.alignWidgets && (!display.gutters.firstChild || !cm.options.fixedGutter)) { return }
  var comp = compensateForHScroll(display) - display.scroller.scrollLeft + cm.doc.scrollLeft
  var gutterW = display.gutters.offsetWidth, left = comp + "px"
  for (var i = 0; i < view.length; i++) { if (!view[i].hidden) {
    if (cm.options.fixedGutter) {
      if (view[i].gutter)
        { view[i].gutter.style.left = left }
      if (view[i].gutterBackground)
        { view[i].gutterBackground.style.left = left }
    }
    var align = view[i].alignable
    if (align) { for (var j = 0; j < align.length; j++)
      { align[j].style.left = left } }
  } }
  if (cm.options.fixedGutter)
    { display.gutters.style.left = (comp + gutterW) + "px" }
}

// Used to ensure that the line number gutter is still the right
// size for the current document size. Returns true when an update
// is needed.
function maybeUpdateLineNumberWidth(cm) {
  if (!cm.options.lineNumbers) { return false }
  var doc = cm.doc, last = lineNumberFor(cm.options, doc.first + doc.size - 1), display = cm.display
  if (last.length != display.lineNumChars) {
    var test = display.measure.appendChild(elt("div", [elt("div", last)],
                                               "CodeMirror-linenumber CodeMirror-gutter-elt"))
    var innerW = test.firstChild.offsetWidth, padding = test.offsetWidth - innerW
    display.lineGutter.style.width = ""
    display.lineNumInnerWidth = Math.max(innerW, display.lineGutter.offsetWidth - padding) + 1
    display.lineNumWidth = display.lineNumInnerWidth + padding
    display.lineNumChars = display.lineNumInnerWidth ? last.length : -1
    display.lineGutter.style.width = display.lineNumWidth + "px"
    updateGutterSpace(cm)
    return true
  }
  return false
}

// SCROLLING THINGS INTO VIEW

// If an editor sits on the top or bottom of the window, partially
// scrolled out of view, this ensures that the cursor is visible.
function maybeScrollWindow(cm, rect) {
  if (signalDOMEvent(cm, "scrollCursorIntoView")) { return }

  var display = cm.display, box = display.sizer.getBoundingClientRect(), doScroll = null
  if (rect.top + box.top < 0) { doScroll = true }
  else if (rect.bottom + box.top > (window.innerHeight || document.documentElement.clientHeight)) { doScroll = false }
  if (doScroll != null && !phantom) {
    var scrollNode = elt("div", "\u200b", null, ("position: absolute;\n                         top: " + (rect.top - display.viewOffset - paddingTop(cm.display)) + "px;\n                         height: " + (rect.bottom - rect.top + scrollGap(cm) + display.barHeight) + "px;\n                         left: " + (rect.left) + "px; width: " + (Math.max(2, rect.right - rect.left)) + "px;"))
    cm.display.lineSpace.appendChild(scrollNode)
    scrollNode.scrollIntoView(doScroll)
    cm.display.lineSpace.removeChild(scrollNode)
  }
}

// Scroll a given position into view (immediately), verifying that
// it actually became visible (as line heights are accurately
// measured, the position of something may 'drift' during drawing).
function scrollPosIntoView(cm, pos, end, margin) {
  if (margin == null) { margin = 0 }
  var rect
  if (!cm.options.lineWrapping && pos == end) {
    // Set pos and end to the cursor positions around the character pos sticks to
    // If pos.sticky == "before", that is around pos.ch - 1, otherwise around pos.ch
    // If pos == Pos(_, 0, "before"), pos and end are unchanged
    pos = pos.ch ? Pos(pos.line, pos.sticky == "before" ? pos.ch - 1 : pos.ch, "after") : pos
    end = pos.sticky == "before" ? Pos(pos.line, pos.ch + 1, "before") : pos
  }
  for (var limit = 0; limit < 5; limit++) {
    var changed = false
    var coords = cursorCoords(cm, pos)
    var endCoords = !end || end == pos ? coords : cursorCoords(cm, end)
    rect = {left: Math.min(coords.left, endCoords.left),
            top: Math.min(coords.top, endCoords.top) - margin,
            right: Math.max(coords.left, endCoords.left),
            bottom: Math.max(coords.bottom, endCoords.bottom) + margin}
    var scrollPos = calculateScrollPos(cm, rect)
    var startTop = cm.doc.scrollTop, startLeft = cm.doc.scrollLeft
    if (scrollPos.scrollTop != null) {
      updateScrollTop(cm, scrollPos.scrollTop)
      if (Math.abs(cm.doc.scrollTop - startTop) > 1) { changed = true }
    }
    if (scrollPos.scrollLeft != null) {
      setScrollLeft(cm, scrollPos.scrollLeft)
      if (Math.abs(cm.doc.scrollLeft - startLeft) > 1) { changed = true }
    }
    if (!changed) { break }
  }
  return rect
}

// Scroll a given set of coordinates into view (immediately).
function scrollIntoView(cm, rect) {
  var scrollPos = calculateScrollPos(cm, rect)
  if (scrollPos.scrollTop != null) { updateScrollTop(cm, scrollPos.scrollTop) }
  if (scrollPos.scrollLeft != null) { setScrollLeft(cm, scrollPos.scrollLeft) }
}

// Calculate a new scroll position needed to scroll the given
// rectangle into view. Returns an object with scrollTop and
// scrollLeft properties. When these are undefined, the
// vertical/horizontal position does not need to be adjusted.
function calculateScrollPos(cm, rect) {
  var display = cm.display, snapMargin = textHeight(cm.display)
  if (rect.top < 0) { rect.top = 0 }
  var screentop = cm.curOp && cm.curOp.scrollTop != null ? cm.curOp.scrollTop : display.scroller.scrollTop
  var screen = displayHeight(cm), result = {}
  if (rect.bottom - rect.top > screen) { rect.bottom = rect.top + screen }
  var docBottom = cm.doc.height + paddingVert(display)
  var atTop = rect.top < snapMargin, atBottom = rect.bottom > docBottom - snapMargin
  if (rect.top < screentop) {
    result.scrollTop = atTop ? 0 : rect.top
  } else if (rect.bottom > screentop + screen) {
    var newTop = Math.min(rect.top, (atBottom ? docBottom : rect.bottom) - screen)
    if (newTop != screentop) { result.scrollTop = newTop }
  }

  var screenleft = cm.curOp && cm.curOp.scrollLeft != null ? cm.curOp.scrollLeft : display.scroller.scrollLeft
  var screenw = displayWidth(cm) - (cm.options.fixedGutter ? display.gutters.offsetWidth : 0)
  var tooWide = rect.right - rect.left > screenw
  if (tooWide) { rect.right = rect.left + screenw }
  if (rect.left < 10)
    { result.scrollLeft = 0 }
  else if (rect.left < screenleft)
    { result.scrollLeft = Math.max(0, rect.left - (tooWide ? 0 : 10)) }
  else if (rect.right > screenw + screenleft - 3)
    { result.scrollLeft = rect.right + (tooWide ? 0 : 10) - screenw }
  return result
}

// Store a relative adjustment to the scroll position in the current
// operation (to be applied when the operation finishes).
function addToScrollTop(cm, top) {
  if (top == null) { return }
  resolveScrollToPos(cm)
  cm.curOp.scrollTop = (cm.curOp.scrollTop == null ? cm.doc.scrollTop : cm.curOp.scrollTop) + top
}

// Make sure that at the end of the operation the current cursor is
// shown.
function ensureCursorVisible(cm) {
  resolveScrollToPos(cm)
  var cur = cm.getCursor()
  cm.curOp.scrollToPos = {from: cur, to: cur, margin: cm.options.cursorScrollMargin}
}

function scrollToCoords(cm, x, y) {
  if (x != null || y != null) { resolveScrollToPos(cm) }
  if (x != null) { cm.curOp.scrollLeft = x }
  if (y != null) { cm.curOp.scrollTop = y }
}

function scrollToRange(cm, range) {
  resolveScrollToPos(cm)
  cm.curOp.scrollToPos = range
}

// When an operation has its scrollToPos property set, and another
// scroll action is applied before the end of the operation, this
// 'simulates' scrolling that position into view in a cheap way, so
// that the effect of intermediate scroll commands is not ignored.
function resolveScrollToPos(cm) {
  var range = cm.curOp.scrollToPos
  if (range) {
    cm.curOp.scrollToPos = null
    var from = estimateCoords(cm, range.from), to = estimateCoords(cm, range.to)
    scrollToCoordsRange(cm, from, to, range.margin)
  }
}

function scrollToCoordsRange(cm, from, to, margin) {
  var sPos = calculateScrollPos(cm, {
    left: Math.min(from.left, to.left),
    top: Math.min(from.top, to.top) - margin,
    right: Math.max(from.right, to.right),
    bottom: Math.max(from.bottom, to.bottom) + margin
  })
  scrollToCoords(cm, sPos.scrollLeft, sPos.scrollTop)
}

// Sync the scrollable area and scrollbars, ensure the viewport
// covers the visible area.
function updateScrollTop(cm, val) {
  if (Math.abs(cm.doc.scrollTop - val) < 2) { return }
  if (!gecko) { updateDisplaySimple(cm, {top: val}) }
  setScrollTop(cm, val, true)
  if (gecko) { updateDisplaySimple(cm) }
  startWorker(cm, 100)
}

function setScrollTop(cm, val, forceScroll) {
  val = Math.min(cm.display.scroller.scrollHeight - cm.display.scroller.clientHeight, val)
  if (cm.display.scroller.scrollTop == val && !forceScroll) { return }
  cm.doc.scrollTop = val
  cm.display.scrollbars.setScrollTop(val)
  if (cm.display.scroller.scrollTop != val) { cm.display.scroller.scrollTop = val }
}

// Sync scroller and scrollbar, ensure the gutter elements are
// aligned.
function setScrollLeft(cm, val, isScroller, forceScroll) {
  val = Math.min(val, cm.display.scroller.scrollWidth - cm.display.scroller.clientWidth)
  if ((isScroller ? val == cm.doc.scrollLeft : Math.abs(cm.doc.scrollLeft - val) < 2) && !forceScroll) { return }
  cm.doc.scrollLeft = val
  alignHorizontally(cm)
  if (cm.display.scroller.scrollLeft != val) { cm.display.scroller.scrollLeft = val }
  cm.display.scrollbars.setScrollLeft(val)
}

// SCROLLBARS

// Prepare DOM reads needed to update the scrollbars. Done in one
// shot to minimize update/measure roundtrips.
function measureForScrollbars(cm) {
  var d = cm.display, gutterW = d.gutters.offsetWidth
  var docH = Math.round(cm.doc.height + paddingVert(cm.display))
  return {
    clientHeight: d.scroller.clientHeight,
    viewHeight: d.wrapper.clientHeight,
    scrollWidth: d.scroller.scrollWidth, clientWidth: d.scroller.clientWidth,
    viewWidth: d.wrapper.clientWidth,
    barLeft: cm.options.fixedGutter ? gutterW : 0,
    docHeight: docH,
    scrollHeight: docH + scrollGap(cm) + d.barHeight,
    nativeBarWidth: d.nativeBarWidth,
    gutterWidth: gutterW
  }
}

var NativeScrollbars = function(place, scroll, cm) {
  this.cm = cm
  var vert = this.vert = elt("div", [elt("div", null, null, "min-width: 1px")], "CodeMirror-vscrollbar")
  var horiz = this.horiz = elt("div", [elt("div", null, null, "height: 100%; min-height: 1px")], "CodeMirror-hscrollbar")
  place(vert); place(horiz)

  on(vert, "scroll", function () {
    if (vert.clientHeight) { scroll(vert.scrollTop, "vertical") }
  })
  on(horiz, "scroll", function () {
    if (horiz.clientWidth) { scroll(horiz.scrollLeft, "horizontal") }
  })

  this.checkedZeroWidth = false
  // Need to set a minimum width to see the scrollbar on IE7 (but must not set it on IE8).
  if (ie && ie_version < 8) { this.horiz.style.minHeight = this.vert.style.minWidth = "18px" }
};

NativeScrollbars.prototype.update = function (measure) {
  var needsH = measure.scrollWidth > measure.clientWidth + 1
  var needsV = measure.scrollHeight > measure.clientHeight + 1
  var sWidth = measure.nativeBarWidth

  if (needsV) {
    this.vert.style.display = "block"
    this.vert.style.bottom = needsH ? sWidth + "px" : "0"
    var totalHeight = measure.viewHeight - (needsH ? sWidth : 0)
    // A bug in IE8 can cause this value to be negative, so guard it.
    this.vert.firstChild.style.height =
      Math.max(0, measure.scrollHeight - measure.clientHeight + totalHeight) + "px"
  } else {
    this.vert.style.display = ""
    this.vert.firstChild.style.height = "0"
  }

  if (needsH) {
    this.horiz.style.display = "block"
    this.horiz.style.right = needsV ? sWidth + "px" : "0"
    this.horiz.style.left = measure.barLeft + "px"
    var totalWidth = measure.viewWidth - measure.barLeft - (needsV ? sWidth : 0)
    this.horiz.firstChild.style.width =
      Math.max(0, measure.scrollWidth - measure.clientWidth + totalWidth) + "px"
  } else {
    this.horiz.style.display = ""
    this.horiz.firstChild.style.width = "0"
  }

  if (!this.checkedZeroWidth && measure.clientHeight > 0) {
    if (sWidth == 0) { this.zeroWidthHack() }
    this.checkedZeroWidth = true
  }

  return {right: needsV ? sWidth : 0, bottom: needsH ? sWidth : 0}
};

NativeScrollbars.prototype.setScrollLeft = function (pos) {
  if (this.horiz.scrollLeft != pos) { this.horiz.scrollLeft = pos }
  if (this.disableHoriz) { this.enableZeroWidthBar(this.horiz, this.disableHoriz, "horiz") }
};

NativeScrollbars.prototype.setScrollTop = function (pos) {
  if (this.vert.scrollTop != pos) { this.vert.scrollTop = pos }
  if (this.disableVert) { this.enableZeroWidthBar(this.vert, this.disableVert, "vert") }
};

NativeScrollbars.prototype.zeroWidthHack = function () {
  var w = mac && !mac_geMountainLion ? "12px" : "18px"
  this.horiz.style.height = this.vert.style.width = w
  this.horiz.style.pointerEvents = this.vert.style.pointerEvents = "none"
  this.disableHoriz = new Delayed
  this.disableVert = new Delayed
};

NativeScrollbars.prototype.enableZeroWidthBar = function (bar, delay, type) {
  bar.style.pointerEvents = "auto"
  function maybeDisable() {
    // To find out whether the scrollbar is still visible, we
    // check whether the element under the pixel in the bottom
    // right corner of the scrollbar box is the scrollbar box
    // itself (when the bar is still visible) or its filler child
    // (when the bar is hidden). If it is still visible, we keep
    // it enabled, if it's hidden, we disable pointer events.
    var box = bar.getBoundingClientRect()
    var elt = type == "vert" ? document.elementFromPoint(box.right - 1, (box.top + box.bottom) / 2)
        : document.elementFromPoint((box.right + box.left) / 2, box.bottom - 1)
    if (elt != bar) { bar.style.pointerEvents = "none" }
    else { delay.set(1000, maybeDisable) }
  }
  delay.set(1000, maybeDisable)
};

NativeScrollbars.prototype.clear = function () {
  var parent = this.horiz.parentNode
  parent.removeChild(this.horiz)
  parent.removeChild(this.vert)
};

var NullScrollbars = function () {};

NullScrollbars.prototype.update = function () { return {bottom: 0, right: 0} };
NullScrollbars.prototype.setScrollLeft = function () {};
NullScrollbars.prototype.setScrollTop = function () {};
NullScrollbars.prototype.clear = function () {};

function updateScrollbars(cm, measure) {
  if (!measure) { measure = measureForScrollbars(cm) }
  var startWidth = cm.display.barWidth, startHeight = cm.display.barHeight
  updateScrollbarsInner(cm, measure)
  for (var i = 0; i < 4 && startWidth != cm.display.barWidth || startHeight != cm.display.barHeight; i++) {
    if (startWidth != cm.display.barWidth && cm.options.lineWrapping)
      { updateHeightsInViewport(cm) }
    updateScrollbarsInner(cm, measureForScrollbars(cm))
    startWidth = cm.display.barWidth; startHeight = cm.display.barHeight
  }
}

// Re-synchronize the fake scrollbars with the actual size of the
// content.
function updateScrollbarsInner(cm, measure) {
  var d = cm.display
  var sizes = d.scrollbars.update(measure)

  d.sizer.style.paddingRight = (d.barWidth = sizes.right) + "px"
  d.sizer.style.paddingBottom = (d.barHeight = sizes.bottom) + "px"
  d.heightForcer.style.borderBottom = sizes.bottom + "px solid transparent"

  if (sizes.right && sizes.bottom) {
    d.scrollbarFiller.style.display = "block"
    d.scrollbarFiller.style.height = sizes.bottom + "px"
    d.scrollbarFiller.style.width = sizes.right + "px"
  } else { d.scrollbarFiller.style.display = "" }
  if (sizes.bottom && cm.options.coverGutterNextToScrollbar && cm.options.fixedGutter) {
    d.gutterFiller.style.display = "block"
    d.gutterFiller.style.height = sizes.bottom + "px"
    d.gutterFiller.style.width = measure.gutterWidth + "px"
  } else { d.gutterFiller.style.display = "" }
}

var scrollbarModel = {"native": NativeScrollbars, "null": NullScrollbars}

function initScrollbars(cm) {
  if (cm.display.scrollbars) {
    cm.display.scrollbars.clear()
    if (cm.display.scrollbars.addClass)
      { rmClass(cm.display.wrapper, cm.display.scrollbars.addClass) }
  }

  cm.display.scrollbars = new scrollbarModel[cm.options.scrollbarStyle](function (node) {
    cm.display.wrapper.insertBefore(node, cm.display.scrollbarFiller)
    // Prevent clicks in the scrollbars from killing focus
    on(node, "mousedown", function () {
      if (cm.state.focused) { setTimeout(function () { return cm.display.input.focus(); }, 0) }
    })
    node.setAttribute("cm-not-content", "true")
  }, function (pos, axis) {
    if (axis == "horizontal") { setScrollLeft(cm, pos) }
    else { updateScrollTop(cm, pos) }
  }, cm)
  if (cm.display.scrollbars.addClass)
    { addClass(cm.display.wrapper, cm.display.scrollbars.addClass) }
}

// Operations are used to wrap a series of changes to the editor
// state in such a way that each change won't have to update the
// cursor and display (which would be awkward, slow, and
// error-prone). Instead, display updates are batched and then all
// combined and executed at once.

var nextOpId = 0
// Start a new operation.
function startOperation(cm) {
  cm.curOp = {
    cm: cm,
    viewChanged: false,      // Flag that indicates that lines might need to be redrawn
    startHeight: cm.doc.height, // Used to detect need to update scrollbar
    forceUpdate: false,      // Used to force a redraw
    updateInput: null,       // Whether to reset the input textarea
    typing: false,           // Whether this reset should be careful to leave existing text (for compositing)
    changeObjs: null,        // Accumulated changes, for firing change events
    cursorActivityHandlers: null, // Set of handlers to fire cursorActivity on
    cursorActivityCalled: 0, // Tracks which cursorActivity handlers have been called already
    selectionChanged: false, // Whether the selection needs to be redrawn
    updateMaxLine: false,    // Set when the widest line needs to be determined anew
    scrollLeft: null, scrollTop: null, // Intermediate scroll position, not pushed to DOM yet
    scrollToPos: null,       // Used to scroll to a specific position
    focus: false,
    id: ++nextOpId           // Unique ID
  }
  pushOperation(cm.curOp)
}

// Finish an operation, updating the display and signalling delayed events
function endOperation(cm) {
  var op = cm.curOp
  finishOperation(op, function (group) {
    for (var i = 0; i < group.ops.length; i++)
      { group.ops[i].cm.curOp = null }
    endOperations(group)
  })
}

// The DOM updates done when an operation finishes are batched so
// that the minimum number of relayouts are required.
function endOperations(group) {
  var ops = group.ops
  for (var i = 0; i < ops.length; i++) // Read DOM
    { endOperation_R1(ops[i]) }
  for (var i$1 = 0; i$1 < ops.length; i$1++) // Write DOM (maybe)
    { endOperation_W1(ops[i$1]) }
  for (var i$2 = 0; i$2 < ops.length; i$2++) // Read DOM
    { endOperation_R2(ops[i$2]) }
  for (var i$3 = 0; i$3 < ops.length; i$3++) // Write DOM (maybe)
    { endOperation_W2(ops[i$3]) }
  for (var i$4 = 0; i$4 < ops.length; i$4++) // Read DOM
    { endOperation_finish(ops[i$4]) }
}

function endOperation_R1(op) {
  var cm = op.cm, display = cm.display
  maybeClipScrollbars(cm)
  if (op.updateMaxLine) { findMaxLine(cm) }

  op.mustUpdate = op.viewChanged || op.forceUpdate || op.scrollTop != null ||
    op.scrollToPos && (op.scrollToPos.from.line < display.viewFrom ||
                       op.scrollToPos.to.line >= display.viewTo) ||
    display.maxLineChanged && cm.options.lineWrapping
  op.update = op.mustUpdate &&
    new DisplayUpdate(cm, op.mustUpdate && {top: op.scrollTop, ensure: op.scrollToPos}, op.forceUpdate)
}

function endOperation_W1(op) {
  op.updatedDisplay = op.mustUpdate && updateDisplayIfNeeded(op.cm, op.update)
}

function endOperation_R2(op) {
  var cm = op.cm, display = cm.display
  if (op.updatedDisplay) { updateHeightsInViewport(cm) }

  op.barMeasure = measureForScrollbars(cm)

  // If the max line changed since it was last measured, measure it,
  // and ensure the document's width matches it.
  // updateDisplay_W2 will use these properties to do the actual resizing
  if (display.maxLineChanged && !cm.options.lineWrapping) {
    op.adjustWidthTo = measureChar(cm, display.maxLine, display.maxLine.text.length).left + 3
    cm.display.sizerWidth = op.adjustWidthTo
    op.barMeasure.scrollWidth =
      Math.max(display.scroller.clientWidth, display.sizer.offsetLeft + op.adjustWidthTo + scrollGap(cm) + cm.display.barWidth)
    op.maxScrollLeft = Math.max(0, display.sizer.offsetLeft + op.adjustWidthTo - displayWidth(cm))
  }

  if (op.updatedDisplay || op.selectionChanged)
    { op.preparedSelection = display.input.prepareSelection() }
}

function endOperation_W2(op) {
  var cm = op.cm

  if (op.adjustWidthTo != null) {
    cm.display.sizer.style.minWidth = op.adjustWidthTo + "px"
    if (op.maxScrollLeft < cm.doc.scrollLeft)
      { setScrollLeft(cm, Math.min(cm.display.scroller.scrollLeft, op.maxScrollLeft), true) }
    cm.display.maxLineChanged = false
  }

  var takeFocus = op.focus && op.focus == activeElt()
  if (op.preparedSelection)
    { cm.display.input.showSelection(op.preparedSelection, takeFocus) }
  if (op.updatedDisplay || op.startHeight != cm.doc.height)
    { updateScrollbars(cm, op.barMeasure) }
  if (op.updatedDisplay)
    { setDocumentHeight(cm, op.barMeasure) }

  if (op.selectionChanged) { restartBlink(cm) }

  if (cm.state.focused && op.updateInput)
    { cm.display.input.reset(op.typing) }
  if (takeFocus) { ensureFocus(op.cm) }
}

function endOperation_finish(op) {
  var cm = op.cm, display = cm.display, doc = cm.doc

  if (op.updatedDisplay) { postUpdateDisplay(cm, op.update) }

  // Abort mouse wheel delta measurement, when scrolling explicitly
  if (display.wheelStartX != null && (op.scrollTop != null || op.scrollLeft != null || op.scrollToPos))
    { display.wheelStartX = display.wheelStartY = null }

  // Propagate the scroll position to the actual DOM scroller
  if (op.scrollTop != null) { setScrollTop(cm, op.scrollTop, op.forceScroll) }

  if (op.scrollLeft != null) { setScrollLeft(cm, op.scrollLeft, true, true) }
  // If we need to scroll a specific position into view, do so.
  if (op.scrollToPos) {
    var rect = scrollPosIntoView(cm, clipPos(doc, op.scrollToPos.from),
                                 clipPos(doc, op.scrollToPos.to), op.scrollToPos.margin)
    maybeScrollWindow(cm, rect)
  }

  // Fire events for markers that are hidden/unidden by editing or
  // undoing
  var hidden = op.maybeHiddenMarkers, unhidden = op.maybeUnhiddenMarkers
  if (hidden) { for (var i = 0; i < hidden.length; ++i)
    { if (!hidden[i].lines.length) { signal(hidden[i], "hide") } } }
  if (unhidden) { for (var i$1 = 0; i$1 < unhidden.length; ++i$1)
    { if (unhidden[i$1].lines.length) { signal(unhidden[i$1], "unhide") } } }

  if (display.wrapper.offsetHeight)
    { doc.scrollTop = cm.display.scroller.scrollTop }

  // Fire change events, and delayed event handlers
  if (op.changeObjs)
    { signal(cm, "changes", cm, op.changeObjs) }
  if (op.update)
    { op.update.finish() }
}

// Run the given function in an operation
function runInOp(cm, f) {
  if (cm.curOp) { return f() }
  startOperation(cm)
  try { return f() }
  finally { endOperation(cm) }
}
// Wraps a function in an operation. Returns the wrapped function.
function operation(cm, f) {
  return function() {
    if (cm.curOp) { return f.apply(cm, arguments) }
    startOperation(cm)
    try { return f.apply(cm, arguments) }
    finally { endOperation(cm) }
  }
}
// Used to add methods to editor and doc instances, wrapping them in
// operations.
function methodOp(f) {
  return function() {
    if (this.curOp) { return f.apply(this, arguments) }
    startOperation(this)
    try { return f.apply(this, arguments) }
    finally { endOperation(this) }
  }
}
function docMethodOp(f) {
  return function() {
    var cm = this.cm
    if (!cm || cm.curOp) { return f.apply(this, arguments) }
    startOperation(cm)
    try { return f.apply(this, arguments) }
    finally { endOperation(cm) }
  }
}

// Updates the display.view data structure for a given change to the
// document. From and to are in pre-change coordinates. Lendiff is
// the amount of lines added or subtracted by the change. This is
// used for changes that span multiple lines, or change the way
// lines are divided into visual lines. regLineChange (below)
// registers single-line changes.
function regChange(cm, from, to, lendiff) {
  if (from == null) { from = cm.doc.first }
  if (to == null) { to = cm.doc.first + cm.doc.size }
  if (!lendiff) { lendiff = 0 }

  var display = cm.display
  if (lendiff && to < display.viewTo &&
      (display.updateLineNumbers == null || display.updateLineNumbers > from))
    { display.updateLineNumbers = from }

  cm.curOp.viewChanged = true

  if (from >= display.viewTo) { // Change after
    if (sawCollapsedSpans && visualLineNo(cm.doc, from) < display.viewTo)
      { resetView(cm) }
  } else if (to <= display.viewFrom) { // Change before
    if (sawCollapsedSpans && visualLineEndNo(cm.doc, to + lendiff) > display.viewFrom) {
      resetView(cm)
    } else {
      display.viewFrom += lendiff
      display.viewTo += lendiff
    }
  } else if (from <= display.viewFrom && to >= display.viewTo) { // Full overlap
    resetView(cm)
  } else if (from <= display.viewFrom) { // Top overlap
    var cut = viewCuttingPoint(cm, to, to + lendiff, 1)
    if (cut) {
      display.view = display.view.slice(cut.index)
      display.viewFrom = cut.lineN
      display.viewTo += lendiff
    } else {
      resetView(cm)
    }
  } else if (to >= display.viewTo) { // Bottom overlap
    var cut$1 = viewCuttingPoint(cm, from, from, -1)
    if (cut$1) {
      display.view = display.view.slice(0, cut$1.index)
      display.viewTo = cut$1.lineN
    } else {
      resetView(cm)
    }
  } else { // Gap in the middle
    var cutTop = viewCuttingPoint(cm, from, from, -1)
    var cutBot = viewCuttingPoint(cm, to, to + lendiff, 1)
    if (cutTop && cutBot) {
      display.view = display.view.slice(0, cutTop.index)
        .concat(buildViewArray(cm, cutTop.lineN, cutBot.lineN))
        .concat(display.view.slice(cutBot.index))
      display.viewTo += lendiff
    } else {
      resetView(cm)
    }
  }

  var ext = display.externalMeasured
  if (ext) {
    if (to < ext.lineN)
      { ext.lineN += lendiff }
    else if (from < ext.lineN + ext.size)
      { display.externalMeasured = null }
  }
}

// Register a change to a single line. Type must be one of "text",
// "gutter", "class", "widget"
function regLineChange(cm, line, type) {
  cm.curOp.viewChanged = true
  var display = cm.display, ext = cm.display.externalMeasured
  if (ext && line >= ext.lineN && line < ext.lineN + ext.size)
    { display.externalMeasured = null }

  if (line < display.viewFrom || line >= display.viewTo) { return }
  var lineView = display.view[findViewIndex(cm, line)]
  if (lineView.node == null) { return }
  var arr = lineView.changes || (lineView.changes = [])
  if (indexOf(arr, type) == -1) { arr.push(type) }
}

// Clear the view.
function resetView(cm) {
  cm.display.viewFrom = cm.display.viewTo = cm.doc.first
  cm.display.view = []
  cm.display.viewOffset = 0
}

function viewCuttingPoint(cm, oldN, newN, dir) {
  var index = findViewIndex(cm, oldN), diff, view = cm.display.view
  if (!sawCollapsedSpans || newN == cm.doc.first + cm.doc.size)
    { return {index: index, lineN: newN} }
  var n = cm.display.viewFrom
  for (var i = 0; i < index; i++)
    { n += view[i].size }
  if (n != oldN) {
    if (dir > 0) {
      if (index == view.length - 1) { return null }
      diff = (n + view[index].size) - oldN
      index++
    } else {
      diff = n - oldN
    }
    oldN += diff; newN += diff
  }
  while (visualLineNo(cm.doc, newN) != newN) {
    if (index == (dir < 0 ? 0 : view.length - 1)) { return null }
    newN += dir * view[index - (dir < 0 ? 1 : 0)].size
    index += dir
  }
  return {index: index, lineN: newN}
}

// Force the view to cover a given range, adding empty view element
// or clipping off existing ones as needed.
function adjustView(cm, from, to) {
  var display = cm.display, view = display.view
  if (view.length == 0 || from >= display.viewTo || to <= display.viewFrom) {
    display.view = buildViewArray(cm, from, to)
    display.viewFrom = from
  } else {
    if (display.viewFrom > from)
      { display.view = buildViewArray(cm, from, display.viewFrom).concat(display.view) }
    else if (display.viewFrom < from)
      { display.view = display.view.slice(findViewIndex(cm, from)) }
    display.viewFrom = from
    if (display.viewTo < to)
      { display.view = display.view.concat(buildViewArray(cm, display.viewTo, to)) }
    else if (display.viewTo > to)
      { display.view = display.view.slice(0, findViewIndex(cm, to)) }
  }
  display.viewTo = to
}

// Count the number of lines in the view whose DOM representation is
// out of date (or nonexistent).
function countDirtyView(cm) {
  var view = cm.display.view, dirty = 0
  for (var i = 0; i < view.length; i++) {
    var lineView = view[i]
    if (!lineView.hidden && (!lineView.node || lineView.changes)) { ++dirty }
  }
  return dirty
}

// HIGHLIGHT WORKER

function startWorker(cm, time) {
  if (cm.doc.highlightFrontier < cm.display.viewTo)
    { cm.state.highlight.set(time, bind(highlightWorker, cm)) }
}

function highlightWorker(cm) {
  var doc = cm.doc
  if (doc.highlightFrontier >= cm.display.viewTo) { return }
  var end = +new Date + cm.options.workTime
  var context = getContextBefore(cm, doc.highlightFrontier)
  var changedLines = []

  doc.iter(context.line, Math.min(doc.first + doc.size, cm.display.viewTo + 500), function (line) {
    if (context.line >= cm.display.viewFrom) { // Visible
      var oldStyles = line.styles
      var resetState = line.text.length > cm.options.maxHighlightLength ? copyState(doc.mode, context.state) : null
      var highlighted = highlightLine(cm, line, context, true)
      if (resetState) { context.state = resetState }
      line.styles = highlighted.styles
      var oldCls = line.styleClasses, newCls = highlighted.classes
      if (newCls) { line.styleClasses = newCls }
      else if (oldCls) { line.styleClasses = null }
      var ischange = !oldStyles || oldStyles.length != line.styles.length ||
        oldCls != newCls && (!oldCls || !newCls || oldCls.bgClass != newCls.bgClass || oldCls.textClass != newCls.textClass)
      for (var i = 0; !ischange && i < oldStyles.length; ++i) { ischange = oldStyles[i] != line.styles[i] }
      if (ischange) { changedLines.push(context.line) }
      line.stateAfter = context.save()
      context.nextLine()
    } else {
      if (line.text.length <= cm.options.maxHighlightLength)
        { processLine(cm, line.text, context) }
      line.stateAfter = context.line % 5 == 0 ? context.save() : null
      context.nextLine()
    }
    if (+new Date > end) {
      startWorker(cm, cm.options.workDelay)
      return true
    }
  })
  doc.highlightFrontier = context.line
  doc.modeFrontier = Math.max(doc.modeFrontier, context.line)
  if (changedLines.length) { runInOp(cm, function () {
    for (var i = 0; i < changedLines.length; i++)
      { regLineChange(cm, changedLines[i], "text") }
  }) }
}

// DISPLAY DRAWING

var DisplayUpdate = function(cm, viewport, force) {
  var display = cm.display

  this.viewport = viewport
  // Store some values that we'll need later (but don't want to force a relayout for)
  this.visible = visibleLines(display, cm.doc, viewport)
  this.editorIsHidden = !display.wrapper.offsetWidth
  this.wrapperHeight = display.wrapper.clientHeight
  this.wrapperWidth = display.wrapper.clientWidth
  this.oldDisplayWidth = displayWidth(cm)
  this.force = force
  this.dims = getDimensions(cm)
  this.events = []
};

DisplayUpdate.prototype.signal = function (emitter, type) {
  if (hasHandler(emitter, type))
    { this.events.push(arguments) }
};
DisplayUpdate.prototype.finish = function () {
    var this$1 = this;

  for (var i = 0; i < this.events.length; i++)
    { signal.apply(null, this$1.events[i]) }
};

function maybeClipScrollbars(cm) {
  var display = cm.display
  if (!display.scrollbarsClipped && display.scroller.offsetWidth) {
    display.nativeBarWidth = display.scroller.offsetWidth - display.scroller.clientWidth
    display.heightForcer.style.height = scrollGap(cm) + "px"
    display.sizer.style.marginBottom = -display.nativeBarWidth + "px"
    display.sizer.style.borderRightWidth = scrollGap(cm) + "px"
    display.scrollbarsClipped = true
  }
}

function selectionSnapshot(cm) {
  if (cm.hasFocus()) { return null }
  var active = activeElt()
  if (!active || !contains(cm.display.lineDiv, active)) { return null }
  var result = {activeElt: active}
  if (window.getSelection) {
    var sel = window.getSelection()
    if (sel.anchorNode && sel.extend && contains(cm.display.lineDiv, sel.anchorNode)) {
      result.anchorNode = sel.anchorNode
      result.anchorOffset = sel.anchorOffset
      result.focusNode = sel.focusNode
      result.focusOffset = sel.focusOffset
    }
  }
  return result
}

function restoreSelection(snapshot) {
  if (!snapshot || !snapshot.activeElt || snapshot.activeElt == activeElt()) { return }
  snapshot.activeElt.focus()
  if (snapshot.anchorNode && contains(document.body, snapshot.anchorNode) && contains(document.body, snapshot.focusNode)) {
    var sel = window.getSelection(), range = document.createRange()
    range.setEnd(snapshot.anchorNode, snapshot.anchorOffset)
    range.collapse(false)
    sel.removeAllRanges()
    sel.addRange(range)
    sel.extend(snapshot.focusNode, snapshot.focusOffset)
  }
}

// Does the actual updating of the line display. Bails out
// (returning false) when there is nothing to be done and forced is
// false.
function updateDisplayIfNeeded(cm, update) {
  var display = cm.display, doc = cm.doc

  if (update.editorIsHidden) {
    resetView(cm)
    return false
  }

  // Bail out if the visible area is already rendered and nothing changed.
  if (!update.force &&
      update.visible.from >= display.viewFrom && update.visible.to <= display.viewTo &&
      (display.updateLineNumbers == null || display.updateLineNumbers >= display.viewTo) &&
      display.renderedView == display.view && countDirtyView(cm) == 0)
    { return false }

  if (maybeUpdateLineNumberWidth(cm)) {
    resetView(cm)
    update.dims = getDimensions(cm)
  }

  // Compute a suitable new viewport (from & to)
  var end = doc.first + doc.size
  var from = Math.max(update.visible.from - cm.options.viewportMargin, doc.first)
  var to = Math.min(end, update.visible.to + cm.options.viewportMargin)
  if (display.viewFrom < from && from - display.viewFrom < 20) { from = Math.max(doc.first, display.viewFrom) }
  if (display.viewTo > to && display.viewTo - to < 20) { to = Math.min(end, display.viewTo) }
  if (sawCollapsedSpans) {
    from = visualLineNo(cm.doc, from)
    to = visualLineEndNo(cm.doc, to)
  }

  var different = from != display.viewFrom || to != display.viewTo ||
    display.lastWrapHeight != update.wrapperHeight || display.lastWrapWidth != update.wrapperWidth
  adjustView(cm, from, to)

  display.viewOffset = heightAtLine(getLine(cm.doc, display.viewFrom))
  // Position the mover div to align with the current scroll position
  cm.display.mover.style.top = display.viewOffset + "px"

  var toUpdate = countDirtyView(cm)
  if (!different && toUpdate == 0 && !update.force && display.renderedView == display.view &&
      (display.updateLineNumbers == null || display.updateLineNumbers >= display.viewTo))
    { return false }

  // For big changes, we hide the enclosing element during the
  // update, since that speeds up the operations on most browsers.
  var selSnapshot = selectionSnapshot(cm)
  if (toUpdate > 4) { display.lineDiv.style.display = "none" }
  patchDisplay(cm, display.updateLineNumbers, update.dims)
  if (toUpdate > 4) { display.lineDiv.style.display = "" }
  display.renderedView = display.view
  // There might have been a widget with a focused element that got
  // hidden or updated, if so re-focus it.
  restoreSelection(selSnapshot)

  // Prevent selection and cursors from interfering with the scroll
  // width and height.
  removeChildren(display.cursorDiv)
  removeChildren(display.selectionDiv)
  display.gutters.style.height = display.sizer.style.minHeight = 0

  if (different) {
    display.lastWrapHeight = update.wrapperHeight
    display.lastWrapWidth = update.wrapperWidth
    startWorker(cm, 400)
  }

  display.updateLineNumbers = null

  return true
}

function postUpdateDisplay(cm, update) {
  var viewport = update.viewport

  for (var first = true;; first = false) {
    if (!first || !cm.options.lineWrapping || update.oldDisplayWidth == displayWidth(cm)) {
      // Clip forced viewport to actual scrollable area.
      if (viewport && viewport.top != null)
        { viewport = {top: Math.min(cm.doc.height + paddingVert(cm.display) - displayHeight(cm), viewport.top)} }
      // Updated line heights might result in the drawn area not
      // actually covering the viewport. Keep looping until it does.
      update.visible = visibleLines(cm.display, cm.doc, viewport)
      if (update.visible.from >= cm.display.viewFrom && update.visible.to <= cm.display.viewTo)
        { break }
    }
    if (!updateDisplayIfNeeded(cm, update)) { break }
    updateHeightsInViewport(cm)
    var barMeasure = measureForScrollbars(cm)
    updateSelection(cm)
    updateScrollbars(cm, barMeasure)
    setDocumentHeight(cm, barMeasure)
    update.force = false
  }

  update.signal(cm, "update", cm)
  if (cm.display.viewFrom != cm.display.reportedViewFrom || cm.display.viewTo != cm.display.reportedViewTo) {
    update.signal(cm, "viewportChange", cm, cm.display.viewFrom, cm.display.viewTo)
    cm.display.reportedViewFrom = cm.display.viewFrom; cm.display.reportedViewTo = cm.display.viewTo
  }
}

function updateDisplaySimple(cm, viewport) {
  var update = new DisplayUpdate(cm, viewport)
  if (updateDisplayIfNeeded(cm, update)) {
    updateHeightsInViewport(cm)
    postUpdateDisplay(cm, update)
    var barMeasure = measureForScrollbars(cm)
    updateSelection(cm)
    updateScrollbars(cm, barMeasure)
    setDocumentHeight(cm, barMeasure)
    update.finish()
  }
}

// Sync the actual display DOM structure with display.view, removing
// nodes for lines that are no longer in view, and creating the ones
// that are not there yet, and updating the ones that are out of
// date.
function patchDisplay(cm, updateNumbersFrom, dims) {
  var display = cm.display, lineNumbers = cm.options.lineNumbers
  var container = display.lineDiv, cur = container.firstChild

  function rm(node) {
    var next = node.nextSibling
    // Works around a throw-scroll bug in OS X Webkit
    if (webkit && mac && cm.display.currentWheelTarget == node)
      { node.style.display = "none" }
    else
      { node.parentNode.removeChild(node) }
    return next
  }

  var view = display.view, lineN = display.viewFrom
  // Loop over the elements in the view, syncing cur (the DOM nodes
  // in display.lineDiv) with the view as we go.
  for (var i = 0; i < view.length; i++) {
    var lineView = view[i]
    if (lineView.hidden) {
    } else if (!lineView.node || lineView.node.parentNode != container) { // Not drawn yet
      var node = buildLineElement(cm, lineView, lineN, dims)
      container.insertBefore(node, cur)
    } else { // Already drawn
      while (cur != lineView.node) { cur = rm(cur) }
      var updateNumber = lineNumbers && updateNumbersFrom != null &&
        updateNumbersFrom <= lineN && lineView.lineNumber
      if (lineView.changes) {
        if (indexOf(lineView.changes, "gutter") > -1) { updateNumber = false }
        updateLineForChanges(cm, lineView, lineN, dims)
      }
      if (updateNumber) {
        removeChildren(lineView.lineNumber)
        lineView.lineNumber.appendChild(document.createTextNode(lineNumberFor(cm.options, lineN)))
      }
      cur = lineView.node.nextSibling
    }
    lineN += lineView.size
  }
  while (cur) { cur = rm(cur) }
}

function updateGutterSpace(cm) {
  var width = cm.display.gutters.offsetWidth
  cm.display.sizer.style.marginLeft = width + "px"
}

function setDocumentHeight(cm, measure) {
  cm.display.sizer.style.minHeight = measure.docHeight + "px"
  cm.display.heightForcer.style.top = measure.docHeight + "px"
  cm.display.gutters.style.height = (measure.docHeight + cm.display.barHeight + scrollGap(cm)) + "px"
}

// Rebuild the gutter elements, ensure the margin to the left of the
// code matches their width.
function updateGutters(cm) {
  var gutters = cm.display.gutters, specs = cm.options.gutters
  removeChildren(gutters)
  var i = 0
  for (; i < specs.length; ++i) {
    var gutterClass = specs[i]
    var gElt = gutters.appendChild(elt("div", null, "CodeMirror-gutter " + gutterClass))
    if (gutterClass == "CodeMirror-linenumbers") {
      cm.display.lineGutter = gElt
      gElt.style.width = (cm.display.lineNumWidth || 1) + "px"
    }
  }
  gutters.style.display = i ? "" : "none"
  updateGutterSpace(cm)
}

// Make sure the gutters options contains the element
// "CodeMirror-linenumbers" when the lineNumbers option is true.
function setGuttersForLineNumbers(options) {
  var found = indexOf(options.gutters, "CodeMirror-linenumbers")
  if (found == -1 && options.lineNumbers) {
    options.gutters = options.gutters.concat(["CodeMirror-linenumbers"])
  } else if (found > -1 && !options.lineNumbers) {
    options.gutters = options.gutters.slice(0)
    options.gutters.splice(found, 1)
  }
}

var wheelSamples = 0;
var wheelPixelsPerUnit = null;
// Fill in a browser-detected starting value on browsers where we
// know one. These don't have to be accurate -- the result of them
// being wrong would just be a slight flicker on the first wheel
// scroll (if it is large enough).
if (ie) { wheelPixelsPerUnit = -.53 }
else if (gecko) { wheelPixelsPerUnit = 15 }
else if (chrome) { wheelPixelsPerUnit = -.7 }
else if (safari) { wheelPixelsPerUnit = -1/3 }

function wheelEventDelta(e) {
  var dx = e.wheelDeltaX, dy = e.wheelDeltaY
  if (dx == null && e.detail && e.axis == e.HORIZONTAL_AXIS) { dx = e.detail }
  if (dy == null && e.detail && e.axis == e.VERTICAL_AXIS) { dy = e.detail }
  else if (dy == null) { dy = e.wheelDelta }
  return {x: dx, y: dy}
}
function wheelEventPixels(e) {
  var delta = wheelEventDelta(e)
  delta.x *= wheelPixelsPerUnit
  delta.y *= wheelPixelsPerUnit
  return delta
}

function onScrollWheel(cm, e) {
  var delta = wheelEventDelta(e), dx = delta.x, dy = delta.y

  var display = cm.display, scroll = display.scroller
  // Quit if there's nothing to scroll here
  var canScrollX = scroll.scrollWidth > scroll.clientWidth
  var canScrollY = scroll.scrollHeight > scroll.clientHeight
  if (!(dx && canScrollX || dy && canScrollY)) { return }

  // Webkit browsers on OS X abort momentum scrolls when the target
  // of the scroll event is removed from the scrollable element.
  // This hack (see related code in patchDisplay) makes sure the
  // element is kept around.
  if (dy && mac && webkit) {
    outer: for (var cur = e.target, view = display.view; cur != scroll; cur = cur.parentNode) {
      for (var i = 0; i < view.length; i++) {
        if (view[i].node == cur) {
          cm.display.currentWheelTarget = cur
          break outer
        }
      }
    }
  }

  // On some browsers, horizontal scrolling will cause redraws to
  // happen before the gutter has been realigned, causing it to
  // wriggle around in a most unseemly way. When we have an
  // estimated pixels/delta value, we just handle horizontal
  // scrolling entirely here. It'll be slightly off from native, but
  // better than glitching out.
  if (dx && !gecko && !presto && wheelPixelsPerUnit != null) {
    if (dy && canScrollY)
      { updateScrollTop(cm, Math.max(0, scroll.scrollTop + dy * wheelPixelsPerUnit)) }
    setScrollLeft(cm, Math.max(0, scroll.scrollLeft + dx * wheelPixelsPerUnit))
    // Only prevent default scrolling if vertical scrolling is
    // actually possible. Otherwise, it causes vertical scroll
    // jitter on OSX trackpads when deltaX is small and deltaY
    // is large (issue #3579)
    if (!dy || (dy && canScrollY))
      { e_preventDefault(e) }
    display.wheelStartX = null // Abort measurement, if in progress
    return
  }

  // 'Project' the visible viewport to cover the area that is being
  // scrolled into view (if we know enough to estimate it).
  if (dy && wheelPixelsPerUnit != null) {
    var pixels = dy * wheelPixelsPerUnit
    var top = cm.doc.scrollTop, bot = top + display.wrapper.clientHeight
    if (pixels < 0) { top = Math.max(0, top + pixels - 50) }
    else { bot = Math.min(cm.doc.height, bot + pixels + 50) }
    updateDisplaySimple(cm, {top: top, bottom: bot})
  }

  if (wheelSamples < 20) {
    if (display.wheelStartX == null) {
      display.wheelStartX = scroll.scrollLeft; display.wheelStartY = scroll.scrollTop
      display.wheelDX = dx; display.wheelDY = dy
      setTimeout(function () {
        if (display.wheelStartX == null) { return }
        var movedX = scroll.scrollLeft - display.wheelStartX
        var movedY = scroll.scrollTop - display.wheelStartY
        var sample = (movedY && display.wheelDY && movedY / display.wheelDY) ||
          (movedX && display.wheelDX && movedX / display.wheelDX)
        display.wheelStartX = display.wheelStartY = null
        if (!sample) { return }
        wheelPixelsPerUnit = (wheelPixelsPerUnit * wheelSamples + sample) / (wheelSamples + 1)
        ++wheelSamples
      }, 200)
    } else {
      display.wheelDX += dx; display.wheelDY += dy
    }
  }
}

// Selection objects are immutable. A new one is created every time
// the selection changes. A selection is one or more non-overlapping
// (and non-touching) ranges, sorted, and an integer that indicates
// which one is the primary selection (the one that's scrolled into
// view, that getCursor returns, etc).
var Selection = function(ranges, primIndex) {
  this.ranges = ranges
  this.primIndex = primIndex
};

Selection.prototype.primary = function () { return this.ranges[this.primIndex] };

Selection.prototype.equals = function (other) {
    var this$1 = this;

  if (other == this) { return true }
  if (other.primIndex != this.primIndex || other.ranges.length != this.ranges.length) { return false }
  for (var i = 0; i < this.ranges.length; i++) {
    var here = this$1.ranges[i], there = other.ranges[i]
    if (!equalCursorPos(here.anchor, there.anchor) || !equalCursorPos(here.head, there.head)) { return false }
  }
  return true
};

Selection.prototype.deepCopy = function () {
    var this$1 = this;

  var out = []
  for (var i = 0; i < this.ranges.length; i++)
    { out[i] = new Range(copyPos(this$1.ranges[i].anchor), copyPos(this$1.ranges[i].head)) }
  return new Selection(out, this.primIndex)
};

Selection.prototype.somethingSelected = function () {
    var this$1 = this;

  for (var i = 0; i < this.ranges.length; i++)
    { if (!this$1.ranges[i].empty()) { return true } }
  return false
};

Selection.prototype.contains = function (pos, end) {
    var this$1 = this;

  if (!end) { end = pos }
  for (var i = 0; i < this.ranges.length; i++) {
    var range = this$1.ranges[i]
    if (cmp(end, range.from()) >= 0 && cmp(pos, range.to()) <= 0)
      { return i }
  }
  return -1
};

var Range = function(anchor, head) {
  this.anchor = anchor; this.head = head
};

Range.prototype.from = function () { return minPos(this.anchor, this.head) };
Range.prototype.to = function () { return maxPos(this.anchor, this.head) };
Range.prototype.empty = function () { return this.head.line == this.anchor.line && this.head.ch == this.anchor.ch };

// Take an unsorted, potentially overlapping set of ranges, and
// build a selection out of it. 'Consumes' ranges array (modifying
// it).
function normalizeSelection(ranges, primIndex) {
  var prim = ranges[primIndex]
  ranges.sort(function (a, b) { return cmp(a.from(), b.from()); })
  primIndex = indexOf(ranges, prim)
  for (var i = 1; i < ranges.length; i++) {
    var cur = ranges[i], prev = ranges[i - 1]
    if (cmp(prev.to(), cur.from()) >= 0) {
      var from = minPos(prev.from(), cur.from()), to = maxPos(prev.to(), cur.to())
      var inv = prev.empty() ? cur.from() == cur.head : prev.from() == prev.head
      if (i <= primIndex) { --primIndex }
      ranges.splice(--i, 2, new Range(inv ? to : from, inv ? from : to))
    }
  }
  return new Selection(ranges, primIndex)
}

function simpleSelection(anchor, head) {
  return new Selection([new Range(anchor, head || anchor)], 0)
}

// Compute the position of the end of a change (its 'to' property
// refers to the pre-change end).
function changeEnd(change) {
  if (!change.text) { return change.to }
  return Pos(change.from.line + change.text.length - 1,
             lst(change.text).length + (change.text.length == 1 ? change.from.ch : 0))
}

// Adjust a position to refer to the post-change position of the
// same text, or the end of the change if the change covers it.
function adjustForChange(pos, change) {
  if (cmp(pos, change.from) < 0) { return pos }
  if (cmp(pos, change.to) <= 0) { return changeEnd(change) }

  var line = pos.line + change.text.length - (change.to.line - change.from.line) - 1, ch = pos.ch
  if (pos.line == change.to.line) { ch += changeEnd(change).ch - change.to.ch }
  return Pos(line, ch)
}

function computeSelAfterChange(doc, change) {
  var out = []
  for (var i = 0; i < doc.sel.ranges.length; i++) {
    var range = doc.sel.ranges[i]
    out.push(new Range(adjustForChange(range.anchor, change),
                       adjustForChange(range.head, change)))
  }
  return normalizeSelection(out, doc.sel.primIndex)
}

function offsetPos(pos, old, nw) {
  if (pos.line == old.line)
    { return Pos(nw.line, pos.ch - old.ch + nw.ch) }
  else
    { return Pos(nw.line + (pos.line - old.line), pos.ch) }
}

// Used by replaceSelections to allow moving the selection to the
// start or around the replaced test. Hint may be "start" or "around".
function computeReplacedSel(doc, changes, hint) {
  var out = []
  var oldPrev = Pos(doc.first, 0), newPrev = oldPrev
  for (var i = 0; i < changes.length; i++) {
    var change = changes[i]
    var from = offsetPos(change.from, oldPrev, newPrev)
    var to = offsetPos(changeEnd(change), oldPrev, newPrev)
    oldPrev = change.to
    newPrev = to
    if (hint == "around") {
      var range = doc.sel.ranges[i], inv = cmp(range.head, range.anchor) < 0
      out[i] = new Range(inv ? to : from, inv ? from : to)
    } else {
      out[i] = new Range(from, from)
    }
  }
  return new Selection(out, doc.sel.primIndex)
}

// Used to get the editor into a consistent state again when options change.

function loadMode(cm) {
  cm.doc.mode = getMode(cm.options, cm.doc.modeOption)
  resetModeState(cm)
}

function resetModeState(cm) {
  cm.doc.iter(function (line) {
    if (line.stateAfter) { line.stateAfter = null }
    if (line.styles) { line.styles = null }
  })
  cm.doc.modeFrontier = cm.doc.highlightFrontier = cm.doc.first
  startWorker(cm, 100)
  cm.state.modeGen++
  if (cm.curOp) { regChange(cm) }
}

// DOCUMENT DATA STRUCTURE

// By default, updates that start and end at the beginning of a line
// are treated specially, in order to make the association of line
// widgets and marker elements with the text behave more intuitive.
function isWholeLineUpdate(doc, change) {
  return change.from.ch == 0 && change.to.ch == 0 && lst(change.text) == "" &&
    (!doc.cm || doc.cm.options.wholeLineUpdateBefore)
}

// Perform a change on the document data structure.
function updateDoc(doc, change, markedSpans, estimateHeight) {
  function spansFor(n) {return markedSpans ? markedSpans[n] : null}
  function update(line, text, spans) {
    updateLine(line, text, spans, estimateHeight)
    signalLater(line, "change", line, change)
  }
  function linesFor(start, end) {
    var result = []
    for (var i = start; i < end; ++i)
      { result.push(new Line(text[i], spansFor(i), estimateHeight)) }
    return result
  }

  var from = change.from, to = change.to, text = change.text
  var firstLine = getLine(doc, from.line), lastLine = getLine(doc, to.line)
  var lastText = lst(text), lastSpans = spansFor(text.length - 1), nlines = to.line - from.line

  // Adjust the line structure
  if (change.full) {
    doc.insert(0, linesFor(0, text.length))
    doc.remove(text.length, doc.size - text.length)
  } else if (isWholeLineUpdate(doc, change)) {
    // This is a whole-line replace. Treated specially to make
    // sure line objects move the way they are supposed to.
    var added = linesFor(0, text.length - 1)
    update(lastLine, lastLine.text, lastSpans)
    if (nlines) { doc.remove(from.line, nlines) }
    if (added.length) { doc.insert(from.line, added) }
  } else if (firstLine == lastLine) {
    if (text.length == 1) {
      update(firstLine, firstLine.text.slice(0, from.ch) + lastText + firstLine.text.slice(to.ch), lastSpans)
    } else {
      var added$1 = linesFor(1, text.length - 1)
      added$1.push(new Line(lastText + firstLine.text.slice(to.ch), lastSpans, estimateHeight))
      update(firstLine, firstLine.text.slice(0, from.ch) + text[0], spansFor(0))
      doc.insert(from.line + 1, added$1)
    }
  } else if (text.length == 1) {
    update(firstLine, firstLine.text.slice(0, from.ch) + text[0] + lastLine.text.slice(to.ch), spansFor(0))
    doc.remove(from.line + 1, nlines)
  } else {
    update(firstLine, firstLine.text.slice(0, from.ch) + text[0], spansFor(0))
    update(lastLine, lastText + lastLine.text.slice(to.ch), lastSpans)
    var added$2 = linesFor(1, text.length - 1)
    if (nlines > 1) { doc.remove(from.line + 1, nlines - 1) }
    doc.insert(from.line + 1, added$2)
  }

  signalLater(doc, "change", doc, change)
}

// Call f for all linked documents.
function linkedDocs(doc, f, sharedHistOnly) {
  function propagate(doc, skip, sharedHist) {
    if (doc.linked) { for (var i = 0; i < doc.linked.length; ++i) {
      var rel = doc.linked[i]
      if (rel.doc == skip) { continue }
      var shared = sharedHist && rel.sharedHist
      if (sharedHistOnly && !shared) { continue }
      f(rel.doc, shared)
      propagate(rel.doc, doc, shared)
    } }
  }
  propagate(doc, null, true)
}

// Attach a document to an editor.
function attachDoc(cm, doc) {
  if (doc.cm) { throw new Error("This document is already in use.") }
  cm.doc = doc
  doc.cm = cm
  estimateLineHeights(cm)
  loadMode(cm)
  setDirectionClass(cm)
  if (!cm.options.lineWrapping) { findMaxLine(cm) }
  cm.options.mode = doc.modeOption
  regChange(cm)
}

function setDirectionClass(cm) {
  ;(cm.doc.direction == "rtl" ? addClass : rmClass)(cm.display.lineDiv, "CodeMirror-rtl")
}

function directionChanged(cm) {
  runInOp(cm, function () {
    setDirectionClass(cm)
    regChange(cm)
  })
}

function History(startGen) {
  // Arrays of change events and selections. Doing something adds an
  // event to done and clears undo. Undoing moves events from done
  // to undone, redoing moves them in the other direction.
  this.done = []; this.undone = []
  this.undoDepth = Infinity
  // Used to track when changes can be merged into a single undo
  // event
  this.lastModTime = this.lastSelTime = 0
  this.lastOp = this.lastSelOp = null
  this.lastOrigin = this.lastSelOrigin = null
  // Used by the isClean() method
  this.generation = this.maxGeneration = startGen || 1
}

// Create a history change event from an updateDoc-style change
// object.
function historyChangeFromChange(doc, change) {
  var histChange = {from: copyPos(change.from), to: changeEnd(change), text: getBetween(doc, change.from, change.to)}
  attachLocalSpans(doc, histChange, change.from.line, change.to.line + 1)
  linkedDocs(doc, function (doc) { return attachLocalSpans(doc, histChange, change.from.line, change.to.line + 1); }, true)
  return histChange
}

// Pop all selection events off the end of a history array. Stop at
// a change event.
function clearSelectionEvents(array) {
  while (array.length) {
    var last = lst(array)
    if (last.ranges) { array.pop() }
    else { break }
  }
}

// Find the top change event in the history. Pop off selection
// events that are in the way.
function lastChangeEvent(hist, force) {
  if (force) {
    clearSelectionEvents(hist.done)
    return lst(hist.done)
  } else if (hist.done.length && !lst(hist.done).ranges) {
    return lst(hist.done)
  } else if (hist.done.length > 1 && !hist.done[hist.done.length - 2].ranges) {
    hist.done.pop()
    return lst(hist.done)
  }
}

// Register a change in the history. Merges changes that are within
// a single operation, or are close together with an origin that
// allows merging (starting with "+") into a single event.
function addChangeToHistory(doc, change, selAfter, opId) {
  var hist = doc.history
  hist.undone.length = 0
  var time = +new Date, cur
  var last

  if ((hist.lastOp == opId ||
       hist.lastOrigin == change.origin && change.origin &&
       ((change.origin.charAt(0) == "+" && hist.lastModTime > time - (doc.cm ? doc.cm.options.historyEventDelay : 500)) ||
        change.origin.charAt(0) == "*")) &&
      (cur = lastChangeEvent(hist, hist.lastOp == opId))) {
    // Merge this change into the last event
    last = lst(cur.changes)
    if (cmp(change.from, change.to) == 0 && cmp(change.from, last.to) == 0) {
      // Optimized case for simple insertion -- don't want to add
      // new changesets for every character typed
      last.to = changeEnd(change)
    } else {
      // Add new sub-event
      cur.changes.push(historyChangeFromChange(doc, change))
    }
  } else {
    // Can not be merged, start a new event.
    var before = lst(hist.done)
    if (!before || !before.ranges)
      { pushSelectionToHistory(doc.sel, hist.done) }
    cur = {changes: [historyChangeFromChange(doc, change)],
           generation: hist.generation}
    hist.done.push(cur)
    while (hist.done.length > hist.undoDepth) {
      hist.done.shift()
      if (!hist.done[0].ranges) { hist.done.shift() }
    }
  }
  hist.done.push(selAfter)
  hist.generation = ++hist.maxGeneration
  hist.lastModTime = hist.lastSelTime = time
  hist.lastOp = hist.lastSelOp = opId
  hist.lastOrigin = hist.lastSelOrigin = change.origin

  if (!last) { signal(doc, "historyAdded") }
}

function selectionEventCanBeMerged(doc, origin, prev, sel) {
  var ch = origin.charAt(0)
  return ch == "*" ||
    ch == "+" &&
    prev.ranges.length == sel.ranges.length &&
    prev.somethingSelected() == sel.somethingSelected() &&
    new Date - doc.history.lastSelTime <= (doc.cm ? doc.cm.options.historyEventDelay : 500)
}

// Called whenever the selection changes, sets the new selection as
// the pending selection in the history, and pushes the old pending
// selection into the 'done' array when it was significantly
// different (in number of selected ranges, emptiness, or time).
function addSelectionToHistory(doc, sel, opId, options) {
  var hist = doc.history, origin = options && options.origin

  // A new event is started when the previous origin does not match
  // the current, or the origins don't allow matching. Origins
  // starting with * are always merged, those starting with + are
  // merged when similar and close together in time.
  if (opId == hist.lastSelOp ||
      (origin && hist.lastSelOrigin == origin &&
       (hist.lastModTime == hist.lastSelTime && hist.lastOrigin == origin ||
        selectionEventCanBeMerged(doc, origin, lst(hist.done), sel))))
    { hist.done[hist.done.length - 1] = sel }
  else
    { pushSelectionToHistory(sel, hist.done) }

  hist.lastSelTime = +new Date
  hist.lastSelOrigin = origin
  hist.lastSelOp = opId
  if (options && options.clearRedo !== false)
    { clearSelectionEvents(hist.undone) }
}

function pushSelectionToHistory(sel, dest) {
  var top = lst(dest)
  if (!(top && top.ranges && top.equals(sel)))
    { dest.push(sel) }
}

// Used to store marked span information in the history.
function attachLocalSpans(doc, change, from, to) {
  var existing = change["spans_" + doc.id], n = 0
  doc.iter(Math.max(doc.first, from), Math.min(doc.first + doc.size, to), function (line) {
    if (line.markedSpans)
      { (existing || (existing = change["spans_" + doc.id] = {}))[n] = line.markedSpans }
    ++n
  })
}

// When un/re-doing restores text containing marked spans, those
// that have been explicitly cleared should not be restored.
function removeClearedSpans(spans) {
  if (!spans) { return null }
  var out
  for (var i = 0; i < spans.length; ++i) {
    if (spans[i].marker.explicitlyCleared) { if (!out) { out = spans.slice(0, i) } }
    else if (out) { out.push(spans[i]) }
  }
  return !out ? spans : out.length ? out : null
}

// Retrieve and filter the old marked spans stored in a change event.
function getOldSpans(doc, change) {
  var found = change["spans_" + doc.id]
  if (!found) { return null }
  var nw = []
  for (var i = 0; i < change.text.length; ++i)
    { nw.push(removeClearedSpans(found[i])) }
  return nw
}

// Used for un/re-doing changes from the history. Combines the
// result of computing the existing spans with the set of spans that
// existed in the history (so that deleting around a span and then
// undoing brings back the span).
function mergeOldSpans(doc, change) {
  var old = getOldSpans(doc, change)
  var stretched = stretchSpansOverChange(doc, change)
  if (!old) { return stretched }
  if (!stretched) { return old }

  for (var i = 0; i < old.length; ++i) {
    var oldCur = old[i], stretchCur = stretched[i]
    if (oldCur && stretchCur) {
      spans: for (var j = 0; j < stretchCur.length; ++j) {
        var span = stretchCur[j]
        for (var k = 0; k < oldCur.length; ++k)
          { if (oldCur[k].marker == span.marker) { continue spans } }
        oldCur.push(span)
      }
    } else if (stretchCur) {
      old[i] = stretchCur
    }
  }
  return old
}

// Used both to provide a JSON-safe object in .getHistory, and, when
// detaching a document, to split the history in two
function copyHistoryArray(events, newGroup, instantiateSel) {
  var copy = []
  for (var i = 0; i < events.length; ++i) {
    var event = events[i]
    if (event.ranges) {
      copy.push(instantiateSel ? Selection.prototype.deepCopy.call(event) : event)
      continue
    }
    var changes = event.changes, newChanges = []
    copy.push({changes: newChanges})
    for (var j = 0; j < changes.length; ++j) {
      var change = changes[j], m = (void 0)
      newChanges.push({from: change.from, to: change.to, text: change.text})
      if (newGroup) { for (var prop in change) { if (m = prop.match(/^spans_(\d+)$/)) {
        if (indexOf(newGroup, Number(m[1])) > -1) {
          lst(newChanges)[prop] = change[prop]
          delete change[prop]
        }
      } } }
    }
  }
  return copy
}

// The 'scroll' parameter given to many of these indicated whether
// the new cursor position should be scrolled into view after
// modifying the selection.

// If shift is held or the extend flag is set, extends a range to
// include a given position (and optionally a second position).
// Otherwise, simply returns the range between the given positions.
// Used for cursor motion and such.
function extendRange(range, head, other, extend) {
  if (extend) {
    var anchor = range.anchor
    if (other) {
      var posBefore = cmp(head, anchor) < 0
      if (posBefore != (cmp(other, anchor) < 0)) {
        anchor = head
        head = other
      } else if (posBefore != (cmp(head, other) < 0)) {
        head = other
      }
    }
    return new Range(anchor, head)
  } else {
    return new Range(other || head, head)
  }
}

// Extend the primary selection range, discard the rest.
function extendSelection(doc, head, other, options, extend) {
  if (extend == null) { extend = doc.cm && (doc.cm.display.shift || doc.extend) }
  setSelection(doc, new Selection([extendRange(doc.sel.primary(), head, other, extend)], 0), options)
}

// Extend all selections (pos is an array of selections with length
// equal the number of selections)
function extendSelections(doc, heads, options) {
  var out = []
  var extend = doc.cm && (doc.cm.display.shift || doc.extend)
  for (var i = 0; i < doc.sel.ranges.length; i++)
    { out[i] = extendRange(doc.sel.ranges[i], heads[i], null, extend) }
  var newSel = normalizeSelection(out, doc.sel.primIndex)
  setSelection(doc, newSel, options)
}

// Updates a single range in the selection.
function replaceOneSelection(doc, i, range, options) {
  var ranges = doc.sel.ranges.slice(0)
  ranges[i] = range
  setSelection(doc, normalizeSelection(ranges, doc.sel.primIndex), options)
}

// Reset the selection to a single range.
function setSimpleSelection(doc, anchor, head, options) {
  setSelection(doc, simpleSelection(anchor, head), options)
}

// Give beforeSelectionChange handlers a change to influence a
// selection update.
function filterSelectionChange(doc, sel, options) {
  var obj = {
    ranges: sel.ranges,
    update: function(ranges) {
      var this$1 = this;

      this.ranges = []
      for (var i = 0; i < ranges.length; i++)
        { this$1.ranges[i] = new Range(clipPos(doc, ranges[i].anchor),
                                   clipPos(doc, ranges[i].head)) }
    },
    origin: options && options.origin
  }
  signal(doc, "beforeSelectionChange", doc, obj)
  if (doc.cm) { signal(doc.cm, "beforeSelectionChange", doc.cm, obj) }
  if (obj.ranges != sel.ranges) { return normalizeSelection(obj.ranges, obj.ranges.length - 1) }
  else { return sel }
}

function setSelectionReplaceHistory(doc, sel, options) {
  var done = doc.history.done, last = lst(done)
  if (last && last.ranges) {
    done[done.length - 1] = sel
    setSelectionNoUndo(doc, sel, options)
  } else {
    setSelection(doc, sel, options)
  }
}

// Set a new selection.
function setSelection(doc, sel, options) {
  setSelectionNoUndo(doc, sel, options)
  addSelectionToHistory(doc, doc.sel, doc.cm ? doc.cm.curOp.id : NaN, options)
}

function setSelectionNoUndo(doc, sel, options) {
  if (hasHandler(doc, "beforeSelectionChange") || doc.cm && hasHandler(doc.cm, "beforeSelectionChange"))
    { sel = filterSelectionChange(doc, sel, options) }

  var bias = options && options.bias ||
    (cmp(sel.primary().head, doc.sel.primary().head) < 0 ? -1 : 1)
  setSelectionInner(doc, skipAtomicInSelection(doc, sel, bias, true))

  if (!(options && options.scroll === false) && doc.cm)
    { ensureCursorVisible(doc.cm) }
}

function setSelectionInner(doc, sel) {
  if (sel.equals(doc.sel)) { return }

  doc.sel = sel

  if (doc.cm) {
    doc.cm.curOp.updateInput = doc.cm.curOp.selectionChanged = true
    signalCursorActivity(doc.cm)
  }
  signalLater(doc, "cursorActivity", doc)
}

// Verify that the selection does not partially select any atomic
// marked ranges.
function reCheckSelection(doc) {
  setSelectionInner(doc, skipAtomicInSelection(doc, doc.sel, null, false))
}

// Return a selection that does not partially select any atomic
// ranges.
function skipAtomicInSelection(doc, sel, bias, mayClear) {
  var out
  for (var i = 0; i < sel.ranges.length; i++) {
    var range = sel.ranges[i]
    var old = sel.ranges.length == doc.sel.ranges.length && doc.sel.ranges[i]
    var newAnchor = skipAtomic(doc, range.anchor, old && old.anchor, bias, mayClear)
    var newHead = skipAtomic(doc, range.head, old && old.head, bias, mayClear)
    if (out || newAnchor != range.anchor || newHead != range.head) {
      if (!out) { out = sel.ranges.slice(0, i) }
      out[i] = new Range(newAnchor, newHead)
    }
  }
  return out ? normalizeSelection(out, sel.primIndex) : sel
}

function skipAtomicInner(doc, pos, oldPos, dir, mayClear) {
  var line = getLine(doc, pos.line)
  if (line.markedSpans) { for (var i = 0; i < line.markedSpans.length; ++i) {
    var sp = line.markedSpans[i], m = sp.marker
    if ((sp.from == null || (m.inclusiveLeft ? sp.from <= pos.ch : sp.from < pos.ch)) &&
        (sp.to == null || (m.inclusiveRight ? sp.to >= pos.ch : sp.to > pos.ch))) {
      if (mayClear) {
        signal(m, "beforeCursorEnter")
        if (m.explicitlyCleared) {
          if (!line.markedSpans) { break }
          else {--i; continue}
        }
      }
      if (!m.atomic) { continue }

      if (oldPos) {
        var near = m.find(dir < 0 ? 1 : -1), diff = (void 0)
        if (dir < 0 ? m.inclusiveRight : m.inclusiveLeft)
          { near = movePos(doc, near, -dir, near && near.line == pos.line ? line : null) }
        if (near && near.line == pos.line && (diff = cmp(near, oldPos)) && (dir < 0 ? diff < 0 : diff > 0))
          { return skipAtomicInner(doc, near, pos, dir, mayClear) }
      }

      var far = m.find(dir < 0 ? -1 : 1)
      if (dir < 0 ? m.inclusiveLeft : m.inclusiveRight)
        { far = movePos(doc, far, dir, far.line == pos.line ? line : null) }
      return far ? skipAtomicInner(doc, far, pos, dir, mayClear) : null
    }
  } }
  return pos
}

// Ensure a given position is not inside an atomic range.
function skipAtomic(doc, pos, oldPos, bias, mayClear) {
  var dir = bias || 1
  var found = skipAtomicInner(doc, pos, oldPos, dir, mayClear) ||
      (!mayClear && skipAtomicInner(doc, pos, oldPos, dir, true)) ||
      skipAtomicInner(doc, pos, oldPos, -dir, mayClear) ||
      (!mayClear && skipAtomicInner(doc, pos, oldPos, -dir, true))
  if (!found) {
    doc.cantEdit = true
    return Pos(doc.first, 0)
  }
  return found
}

function movePos(doc, pos, dir, line) {
  if (dir < 0 && pos.ch == 0) {
    if (pos.line > doc.first) { return clipPos(doc, Pos(pos.line - 1)) }
    else { return null }
  } else if (dir > 0 && pos.ch == (line || getLine(doc, pos.line)).text.length) {
    if (pos.line < doc.first + doc.size - 1) { return Pos(pos.line + 1, 0) }
    else { return null }
  } else {
    return new Pos(pos.line, pos.ch + dir)
  }
}

function selectAll(cm) {
  cm.setSelection(Pos(cm.firstLine(), 0), Pos(cm.lastLine()), sel_dontScroll)
}

// UPDATING

// Allow "beforeChange" event handlers to influence a change
function filterChange(doc, change, update) {
  var obj = {
    canceled: false,
    from: change.from,
    to: change.to,
    text: change.text,
    origin: change.origin,
    cancel: function () { return obj.canceled = true; }
  }
  if (update) { obj.update = function (from, to, text, origin) {
    if (from) { obj.from = clipPos(doc, from) }
    if (to) { obj.to = clipPos(doc, to) }
    if (text) { obj.text = text }
    if (origin !== undefined) { obj.origin = origin }
  } }
  signal(doc, "beforeChange", doc, obj)
  if (doc.cm) { signal(doc.cm, "beforeChange", doc.cm, obj) }

  if (obj.canceled) { return null }
  return {from: obj.from, to: obj.to, text: obj.text, origin: obj.origin}
}

// Apply a change to a document, and add it to the document's
// history, and propagating it to all linked documents.
function makeChange(doc, change, ignoreReadOnly) {
  if (doc.cm) {
    if (!doc.cm.curOp) { return operation(doc.cm, makeChange)(doc, change, ignoreReadOnly) }
    if (doc.cm.state.suppressEdits) { return }
  }

  if (hasHandler(doc, "beforeChange") || doc.cm && hasHandler(doc.cm, "beforeChange")) {
    change = filterChange(doc, change, true)
    if (!change) { return }
  }

  // Possibly split or suppress the update based on the presence
  // of read-only spans in its range.
  var split = sawReadOnlySpans && !ignoreReadOnly && removeReadOnlyRanges(doc, change.from, change.to)
  if (split) {
    for (var i = split.length - 1; i >= 0; --i)
      { makeChangeInner(doc, {from: split[i].from, to: split[i].to, text: i ? [""] : change.text, origin: change.origin}) }
  } else {
    makeChangeInner(doc, change)
  }
}

function makeChangeInner(doc, change) {
  if (change.text.length == 1 && change.text[0] == "" && cmp(change.from, change.to) == 0) { return }
  var selAfter = computeSelAfterChange(doc, change)
  addChangeToHistory(doc, change, selAfter, doc.cm ? doc.cm.curOp.id : NaN)

  makeChangeSingleDoc(doc, change, selAfter, stretchSpansOverChange(doc, change))
  var rebased = []

  linkedDocs(doc, function (doc, sharedHist) {
    if (!sharedHist && indexOf(rebased, doc.history) == -1) {
      rebaseHist(doc.history, change)
      rebased.push(doc.history)
    }
    makeChangeSingleDoc(doc, change, null, stretchSpansOverChange(doc, change))
  })
}

// Revert a change stored in a document's history.
function makeChangeFromHistory(doc, type, allowSelectionOnly) {
  var suppress = doc.cm && doc.cm.state.suppressEdits
  if (suppress && !allowSelectionOnly) { return }

  var hist = doc.history, event, selAfter = doc.sel
  var source = type == "undo" ? hist.done : hist.undone, dest = type == "undo" ? hist.undone : hist.done

  // Verify that there is a useable event (so that ctrl-z won't
  // needlessly clear selection events)
  var i = 0
  for (; i < source.length; i++) {
    event = source[i]
    if (allowSelectionOnly ? event.ranges && !event.equals(doc.sel) : !event.ranges)
      { break }
  }
  if (i == source.length) { return }
  hist.lastOrigin = hist.lastSelOrigin = null

  for (;;) {
    event = source.pop()
    if (event.ranges) {
      pushSelectionToHistory(event, dest)
      if (allowSelectionOnly && !event.equals(doc.sel)) {
        setSelection(doc, event, {clearRedo: false})
        return
      }
      selAfter = event
    } else if (suppress) {
      source.push(event)
      return
    } else { break }
  }

  // Build up a reverse change object to add to the opposite history
  // stack (redo when undoing, and vice versa).
  var antiChanges = []
  pushSelectionToHistory(selAfter, dest)
  dest.push({changes: antiChanges, generation: hist.generation})
  hist.generation = event.generation || ++hist.maxGeneration

  var filter = hasHandler(doc, "beforeChange") || doc.cm && hasHandler(doc.cm, "beforeChange")

  var loop = function ( i ) {
    var change = event.changes[i]
    change.origin = type
    if (filter && !filterChange(doc, change, false)) {
      source.length = 0
      return {}
    }

    antiChanges.push(historyChangeFromChange(doc, change))

    var after = i ? computeSelAfterChange(doc, change) : lst(source)
    makeChangeSingleDoc(doc, change, after, mergeOldSpans(doc, change))
    if (!i && doc.cm) { doc.cm.scrollIntoView({from: change.from, to: changeEnd(change)}) }
    var rebased = []

    // Propagate to the linked documents
    linkedDocs(doc, function (doc, sharedHist) {
      if (!sharedHist && indexOf(rebased, doc.history) == -1) {
        rebaseHist(doc.history, change)
        rebased.push(doc.history)
      }
      makeChangeSingleDoc(doc, change, null, mergeOldSpans(doc, change))
    })
  };

  for (var i$1 = event.changes.length - 1; i$1 >= 0; --i$1) {
    var returned = loop( i$1 );

    if ( returned ) return returned.v;
  }
}

// Sub-views need their line numbers shifted when text is added
// above or below them in the parent document.
function shiftDoc(doc, distance) {
  if (distance == 0) { return }
  doc.first += distance
  doc.sel = new Selection(map(doc.sel.ranges, function (range) { return new Range(
    Pos(range.anchor.line + distance, range.anchor.ch),
    Pos(range.head.line + distance, range.head.ch)
  ); }), doc.sel.primIndex)
  if (doc.cm) {
    regChange(doc.cm, doc.first, doc.first - distance, distance)
    for (var d = doc.cm.display, l = d.viewFrom; l < d.viewTo; l++)
      { regLineChange(doc.cm, l, "gutter") }
  }
}

// More lower-level change function, handling only a single document
// (not linked ones).
function makeChangeSingleDoc(doc, change, selAfter, spans) {
  if (doc.cm && !doc.cm.curOp)
    { return operation(doc.cm, makeChangeSingleDoc)(doc, change, selAfter, spans) }

  if (change.to.line < doc.first) {
    shiftDoc(doc, change.text.length - 1 - (change.to.line - change.from.line))
    return
  }
  if (change.from.line > doc.lastLine()) { return }

  // Clip the change to the size of this doc
  if (change.from.line < doc.first) {
    var shift = change.text.length - 1 - (doc.first - change.from.line)
    shiftDoc(doc, shift)
    change = {from: Pos(doc.first, 0), to: Pos(change.to.line + shift, change.to.ch),
              text: [lst(change.text)], origin: change.origin}
  }
  var last = doc.lastLine()
  if (change.to.line > last) {
    change = {from: change.from, to: Pos(last, getLine(doc, last).text.length),
              text: [change.text[0]], origin: change.origin}
  }

  change.removed = getBetween(doc, change.from, change.to)

  if (!selAfter) { selAfter = computeSelAfterChange(doc, change) }
  if (doc.cm) { makeChangeSingleDocInEditor(doc.cm, change, spans) }
  else { updateDoc(doc, change, spans) }
  setSelectionNoUndo(doc, selAfter, sel_dontScroll)
}

// Handle the interaction of a change to a document with the editor
// that this document is part of.
function makeChangeSingleDocInEditor(cm, change, spans) {
  var doc = cm.doc, display = cm.display, from = change.from, to = change.to

  var recomputeMaxLength = false, checkWidthStart = from.line
  if (!cm.options.lineWrapping) {
    checkWidthStart = lineNo(visualLine(getLine(doc, from.line)))
    doc.iter(checkWidthStart, to.line + 1, function (line) {
      if (line == display.maxLine) {
        recomputeMaxLength = true
        return true
      }
    })
  }

  if (doc.sel.contains(change.from, change.to) > -1)
    { signalCursorActivity(cm) }

  updateDoc(doc, change, spans, estimateHeight(cm))

  if (!cm.options.lineWrapping) {
    doc.iter(checkWidthStart, from.line + change.text.length, function (line) {
      var len = lineLength(line)
      if (len > display.maxLineLength) {
        display.maxLine = line
        display.maxLineLength = len
        display.maxLineChanged = true
        recomputeMaxLength = false
      }
    })
    if (recomputeMaxLength) { cm.curOp.updateMaxLine = true }
  }

  retreatFrontier(doc, from.line)
  startWorker(cm, 400)

  var lendiff = change.text.length - (to.line - from.line) - 1
  // Remember that these lines changed, for updating the display
  if (change.full)
    { regChange(cm) }
  else if (from.line == to.line && change.text.length == 1 && !isWholeLineUpdate(cm.doc, change))
    { regLineChange(cm, from.line, "text") }
  else
    { regChange(cm, from.line, to.line + 1, lendiff) }

  var changesHandler = hasHandler(cm, "changes"), changeHandler = hasHandler(cm, "change")
  if (changeHandler || changesHandler) {
    var obj = {
      from: from, to: to,
      text: change.text,
      removed: change.removed,
      origin: change.origin
    }
    if (changeHandler) { signalLater(cm, "change", cm, obj) }
    if (changesHandler) { (cm.curOp.changeObjs || (cm.curOp.changeObjs = [])).push(obj) }
  }
  cm.display.selForContextMenu = null
}

function replaceRange(doc, code, from, to, origin) {
  if (!to) { to = from }
  if (cmp(to, from) < 0) { var assign;
    (assign = [to, from], from = assign[0], to = assign[1], assign) }
  if (typeof code == "string") { code = doc.splitLines(code) }
  makeChange(doc, {from: from, to: to, text: code, origin: origin})
}

// Rebasing/resetting history to deal with externally-sourced changes

function rebaseHistSelSingle(pos, from, to, diff) {
  if (to < pos.line) {
    pos.line += diff
  } else if (from < pos.line) {
    pos.line = from
    pos.ch = 0
  }
}

// Tries to rebase an array of history events given a change in the
// document. If the change touches the same lines as the event, the
// event, and everything 'behind' it, is discarded. If the change is
// before the event, the event's positions are updated. Uses a
// copy-on-write scheme for the positions, to avoid having to
// reallocate them all on every rebase, but also avoid problems with
// shared position objects being unsafely updated.
function rebaseHistArray(array, from, to, diff) {
  for (var i = 0; i < array.length; ++i) {
    var sub = array[i], ok = true
    if (sub.ranges) {
      if (!sub.copied) { sub = array[i] = sub.deepCopy(); sub.copied = true }
      for (var j = 0; j < sub.ranges.length; j++) {
        rebaseHistSelSingle(sub.ranges[j].anchor, from, to, diff)
        rebaseHistSelSingle(sub.ranges[j].head, from, to, diff)
      }
      continue
    }
    for (var j$1 = 0; j$1 < sub.changes.length; ++j$1) {
      var cur = sub.changes[j$1]
      if (to < cur.from.line) {
        cur.from = Pos(cur.from.line + diff, cur.from.ch)
        cur.to = Pos(cur.to.line + diff, cur.to.ch)
      } else if (from <= cur.to.line) {
        ok = false
        break
      }
    }
    if (!ok) {
      array.splice(0, i + 1)
      i = 0
    }
  }
}

function rebaseHist(hist, change) {
  var from = change.from.line, to = change.to.line, diff = change.text.length - (to - from) - 1
  rebaseHistArray(hist.done, from, to, diff)
  rebaseHistArray(hist.undone, from, to, diff)
}

// Utility for applying a change to a line by handle or number,
// returning the number and optionally registering the line as
// changed.
function changeLine(doc, handle, changeType, op) {
  var no = handle, line = handle
  if (typeof handle == "number") { line = getLine(doc, clipLine(doc, handle)) }
  else { no = lineNo(handle) }
  if (no == null) { return null }
  if (op(line, no) && doc.cm) { regLineChange(doc.cm, no, changeType) }
  return line
}

// The document is represented as a BTree consisting of leaves, with
// chunk of lines in them, and branches, with up to ten leaves or
// other branch nodes below them. The top node is always a branch
// node, and is the document object itself (meaning it has
// additional methods and properties).
//
// All nodes have parent links. The tree is used both to go from
// line numbers to line objects, and to go from objects to numbers.
// It also indexes by height, and is used to convert between height
// and line object, and to find the total height of the document.
//
// See also http://marijnhaverbeke.nl/blog/codemirror-line-tree.html

function LeafChunk(lines) {
  var this$1 = this;

  this.lines = lines
  this.parent = null
  var height = 0
  for (var i = 0; i < lines.length; ++i) {
    lines[i].parent = this$1
    height += lines[i].height
  }
  this.height = height
}

LeafChunk.prototype = {
  chunkSize: function chunkSize() { return this.lines.length },

  // Remove the n lines at offset 'at'.
  removeInner: function removeInner(at, n) {
    var this$1 = this;

    for (var i = at, e = at + n; i < e; ++i) {
      var line = this$1.lines[i]
      this$1.height -= line.height
      cleanUpLine(line)
      signalLater(line, "delete")
    }
    this.lines.splice(at, n)
  },

  // Helper used to collapse a small branch into a single leaf.
  collapse: function collapse(lines) {
    lines.push.apply(lines, this.lines)
  },

  // Insert the given array of lines at offset 'at', count them as
  // having the given height.
  insertInner: function insertInner(at, lines, height) {
    var this$1 = this;

    this.height += height
    this.lines = this.lines.slice(0, at).concat(lines).concat(this.lines.slice(at))
    for (var i = 0; i < lines.length; ++i) { lines[i].parent = this$1 }
  },

  // Used to iterate over a part of the tree.
  iterN: function iterN(at, n, op) {
    var this$1 = this;

    for (var e = at + n; at < e; ++at)
      { if (op(this$1.lines[at])) { return true } }
  }
}

function BranchChunk(children) {
  var this$1 = this;

  this.children = children
  var size = 0, height = 0
  for (var i = 0; i < children.length; ++i) {
    var ch = children[i]
    size += ch.chunkSize(); height += ch.height
    ch.parent = this$1
  }
  this.size = size
  this.height = height
  this.parent = null
}

BranchChunk.prototype = {
  chunkSize: function chunkSize() { return this.size },

  removeInner: function removeInner(at, n) {
    var this$1 = this;

    this.size -= n
    for (var i = 0; i < this.children.length; ++i) {
      var child = this$1.children[i], sz = child.chunkSize()
      if (at < sz) {
        var rm = Math.min(n, sz - at), oldHeight = child.height
        child.removeInner(at, rm)
        this$1.height -= oldHeight - child.height
        if (sz == rm) { this$1.children.splice(i--, 1); child.parent = null }
        if ((n -= rm) == 0) { break }
        at = 0
      } else { at -= sz }
    }
    // If the result is smaller than 25 lines, ensure that it is a
    // single leaf node.
    if (this.size - n < 25 &&
        (this.children.length > 1 || !(this.children[0] instanceof LeafChunk))) {
      var lines = []
      this.collapse(lines)
      this.children = [new LeafChunk(lines)]
      this.children[0].parent = this
    }
  },

  collapse: function collapse(lines) {
    var this$1 = this;

    for (var i = 0; i < this.children.length; ++i) { this$1.children[i].collapse(lines) }
  },

  insertInner: function insertInner(at, lines, height) {
    var this$1 = this;

    this.size += lines.length
    this.height += height
    for (var i = 0; i < this.children.length; ++i) {
      var child = this$1.children[i], sz = child.chunkSize()
      if (at <= sz) {
        child.insertInner(at, lines, height)
        if (child.lines && child.lines.length > 50) {
          // To avoid memory thrashing when child.lines is huge (e.g. first view of a large file), it's never spliced.
          // Instead, small slices are taken. They're taken in order because sequential memory accesses are fastest.
          var remaining = child.lines.length % 25 + 25
          for (var pos = remaining; pos < child.lines.length;) {
            var leaf = new LeafChunk(child.lines.slice(pos, pos += 25))
            child.height -= leaf.height
            this$1.children.splice(++i, 0, leaf)
            leaf.parent = this$1
          }
          child.lines = child.lines.slice(0, remaining)
          this$1.maybeSpill()
        }
        break
      }
      at -= sz
    }
  },

  // When a node has grown, check whether it should be split.
  maybeSpill: function maybeSpill() {
    if (this.children.length <= 10) { return }
    var me = this
    do {
      var spilled = me.children.splice(me.children.length - 5, 5)
      var sibling = new BranchChunk(spilled)
      if (!me.parent) { // Become the parent node
        var copy = new BranchChunk(me.children)
        copy.parent = me
        me.children = [copy, sibling]
        me = copy
     } else {
        me.size -= sibling.size
        me.height -= sibling.height
        var myIndex = indexOf(me.parent.children, me)
        me.parent.children.splice(myIndex + 1, 0, sibling)
      }
      sibling.parent = me.parent
    } while (me.children.length > 10)
    me.parent.maybeSpill()
  },

  iterN: function iterN(at, n, op) {
    var this$1 = this;

    for (var i = 0; i < this.children.length; ++i) {
      var child = this$1.children[i], sz = child.chunkSize()
      if (at < sz) {
        var used = Math.min(n, sz - at)
        if (child.iterN(at, used, op)) { return true }
        if ((n -= used) == 0) { break }
        at = 0
      } else { at -= sz }
    }
  }
}

// Line widgets are block elements displayed above or below a line.

var LineWidget = function(doc, node, options) {
  var this$1 = this;

  if (options) { for (var opt in options) { if (options.hasOwnProperty(opt))
    { this$1[opt] = options[opt] } } }
  this.doc = doc
  this.node = node
};

LineWidget.prototype.clear = function () {
    var this$1 = this;

  var cm = this.doc.cm, ws = this.line.widgets, line = this.line, no = lineNo(line)
  if (no == null || !ws) { return }
  for (var i = 0; i < ws.length; ++i) { if (ws[i] == this$1) { ws.splice(i--, 1) } }
  if (!ws.length) { line.widgets = null }
  var height = widgetHeight(this)
  updateLineHeight(line, Math.max(0, line.height - height))
  if (cm) {
    runInOp(cm, function () {
      adjustScrollWhenAboveVisible(cm, line, -height)
      regLineChange(cm, no, "widget")
    })
    signalLater(cm, "lineWidgetCleared", cm, this, no)
  }
};

LineWidget.prototype.changed = function () {
    var this$1 = this;

  var oldH = this.height, cm = this.doc.cm, line = this.line
  this.height = null
  var diff = widgetHeight(this) - oldH
  if (!diff) { return }
  updateLineHeight(line, line.height + diff)
  if (cm) {
    runInOp(cm, function () {
      cm.curOp.forceUpdate = true
      adjustScrollWhenAboveVisible(cm, line, diff)
      signalLater(cm, "lineWidgetChanged", cm, this$1, lineNo(line))
    })
  }
};
eventMixin(LineWidget)

function adjustScrollWhenAboveVisible(cm, line, diff) {
  if (heightAtLine(line) < ((cm.curOp && cm.curOp.scrollTop) || cm.doc.scrollTop))
    { addToScrollTop(cm, diff) }
}

function addLineWidget(doc, handle, node, options) {
  var widget = new LineWidget(doc, node, options)
  var cm = doc.cm
  if (cm && widget.noHScroll) { cm.display.alignWidgets = true }
  changeLine(doc, handle, "widget", function (line) {
    var widgets = line.widgets || (line.widgets = [])
    if (widget.insertAt == null) { widgets.push(widget) }
    else { widgets.splice(Math.min(widgets.length - 1, Math.max(0, widget.insertAt)), 0, widget) }
    widget.line = line
    if (cm && !lineIsHidden(doc, line)) {
      var aboveVisible = heightAtLine(line) < doc.scrollTop
      updateLineHeight(line, line.height + widgetHeight(widget))
      if (aboveVisible) { addToScrollTop(cm, widget.height) }
      cm.curOp.forceUpdate = true
    }
    return true
  })
  if (cm) { signalLater(cm, "lineWidgetAdded", cm, widget, typeof handle == "number" ? handle : lineNo(handle)) }
  return widget
}

// TEXTMARKERS

// Created with markText and setBookmark methods. A TextMarker is a
// handle that can be used to clear or find a marked position in the
// document. Line objects hold arrays (markedSpans) containing
// {from, to, marker} object pointing to such marker objects, and
// indicating that such a marker is present on that line. Multiple
// lines may point to the same marker when it spans across lines.
// The spans will have null for their from/to properties when the
// marker continues beyond the start/end of the line. Markers have
// links back to the lines they currently touch.

// Collapsed markers have unique ids, in order to be able to order
// them, which is needed for uniquely determining an outer marker
// when they overlap (they may nest, but not partially overlap).
var nextMarkerId = 0

var TextMarker = function(doc, type) {
  this.lines = []
  this.type = type
  this.doc = doc
  this.id = ++nextMarkerId
};

// Clear the marker.
TextMarker.prototype.clear = function () {
    var this$1 = this;

  if (this.explicitlyCleared) { return }
  var cm = this.doc.cm, withOp = cm && !cm.curOp
  if (withOp) { startOperation(cm) }
  if (hasHandler(this, "clear")) {
    var found = this.find()
    if (found) { signalLater(this, "clear", found.from, found.to) }
  }
  var min = null, max = null
  for (var i = 0; i < this.lines.length; ++i) {
    var line = this$1.lines[i]
    var span = getMarkedSpanFor(line.markedSpans, this$1)
    if (cm && !this$1.collapsed) { regLineChange(cm, lineNo(line), "text") }
    else if (cm) {
      if (span.to != null) { max = lineNo(line) }
      if (span.from != null) { min = lineNo(line) }
    }
    line.markedSpans = removeMarkedSpan(line.markedSpans, span)
    if (span.from == null && this$1.collapsed && !lineIsHidden(this$1.doc, line) && cm)
      { updateLineHeight(line, textHeight(cm.display)) }
  }
  if (cm && this.collapsed && !cm.options.lineWrapping) { for (var i$1 = 0; i$1 < this.lines.length; ++i$1) {
    var visual = visualLine(this$1.lines[i$1]), len = lineLength(visual)
    if (len > cm.display.maxLineLength) {
      cm.display.maxLine = visual
      cm.display.maxLineLength = len
      cm.display.maxLineChanged = true
    }
  } }

  if (min != null && cm && this.collapsed) { regChange(cm, min, max + 1) }
  this.lines.length = 0
  this.explicitlyCleared = true
  if (this.atomic && this.doc.cantEdit) {
    this.doc.cantEdit = false
    if (cm) { reCheckSelection(cm.doc) }
  }
  if (cm) { signalLater(cm, "markerCleared", cm, this, min, max) }
  if (withOp) { endOperation(cm) }
  if (this.parent) { this.parent.clear() }
};

// Find the position of the marker in the document. Returns a {from,
// to} object by default. Side can be passed to get a specific side
// -- 0 (both), -1 (left), or 1 (right). When lineObj is true, the
// Pos objects returned contain a line object, rather than a line
// number (used to prevent looking up the same line twice).
TextMarker.prototype.find = function (side, lineObj) {
    var this$1 = this;

  if (side == null && this.type == "bookmark") { side = 1 }
  var from, to
  for (var i = 0; i < this.lines.length; ++i) {
    var line = this$1.lines[i]
    var span = getMarkedSpanFor(line.markedSpans, this$1)
    if (span.from != null) {
      from = Pos(lineObj ? line : lineNo(line), span.from)
      if (side == -1) { return from }
    }
    if (span.to != null) {
      to = Pos(lineObj ? line : lineNo(line), span.to)
      if (side == 1) { return to }
    }
  }
  return from && {from: from, to: to}
};

// Signals that the marker's widget changed, and surrounding layout
// should be recomputed.
TextMarker.prototype.changed = function () {
    var this$1 = this;

  var pos = this.find(-1, true), widget = this, cm = this.doc.cm
  if (!pos || !cm) { return }
  runInOp(cm, function () {
    var line = pos.line, lineN = lineNo(pos.line)
    var view = findViewForLine(cm, lineN)
    if (view) {
      clearLineMeasurementCacheFor(view)
      cm.curOp.selectionChanged = cm.curOp.forceUpdate = true
    }
    cm.curOp.updateMaxLine = true
    if (!lineIsHidden(widget.doc, line) && widget.height != null) {
      var oldHeight = widget.height
      widget.height = null
      var dHeight = widgetHeight(widget) - oldHeight
      if (dHeight)
        { updateLineHeight(line, line.height + dHeight) }
    }
    signalLater(cm, "markerChanged", cm, this$1)
  })
};

TextMarker.prototype.attachLine = function (line) {
  if (!this.lines.length && this.doc.cm) {
    var op = this.doc.cm.curOp
    if (!op.maybeHiddenMarkers || indexOf(op.maybeHiddenMarkers, this) == -1)
      { (op.maybeUnhiddenMarkers || (op.maybeUnhiddenMarkers = [])).push(this) }
  }
  this.lines.push(line)
};

TextMarker.prototype.detachLine = function (line) {
  this.lines.splice(indexOf(this.lines, line), 1)
  if (!this.lines.length && this.doc.cm) {
    var op = this.doc.cm.curOp
    ;(op.maybeHiddenMarkers || (op.maybeHiddenMarkers = [])).push(this)
  }
};
eventMixin(TextMarker)

// Create a marker, wire it up to the right lines, and
function markText(doc, from, to, options, type) {
  // Shared markers (across linked documents) are handled separately
  // (markTextShared will call out to this again, once per
  // document).
  if (options && options.shared) { return markTextShared(doc, from, to, options, type) }
  // Ensure we are in an operation.
  if (doc.cm && !doc.cm.curOp) { return operation(doc.cm, markText)(doc, from, to, options, type) }

  var marker = new TextMarker(doc, type), diff = cmp(from, to)
  if (options) { copyObj(options, marker, false) }
  // Don't connect empty markers unless clearWhenEmpty is false
  if (diff > 0 || diff == 0 && marker.clearWhenEmpty !== false)
    { return marker }
  if (marker.replacedWith) {
    // Showing up as a widget implies collapsed (widget replaces text)
    marker.collapsed = true
    marker.widgetNode = eltP("span", [marker.replacedWith], "CodeMirror-widget")
    if (!options.handleMouseEvents) { marker.widgetNode.setAttribute("cm-ignore-events", "true") }
    if (options.insertLeft) { marker.widgetNode.insertLeft = true }
  }
  if (marker.collapsed) {
    if (conflictingCollapsedRange(doc, from.line, from, to, marker) ||
        from.line != to.line && conflictingCollapsedRange(doc, to.line, from, to, marker))
      { throw new Error("Inserting collapsed marker partially overlapping an existing one") }
    seeCollapsedSpans()
  }

  if (marker.addToHistory)
    { addChangeToHistory(doc, {from: from, to: to, origin: "markText"}, doc.sel, NaN) }

  var curLine = from.line, cm = doc.cm, updateMaxLine
  doc.iter(curLine, to.line + 1, function (line) {
    if (cm && marker.collapsed && !cm.options.lineWrapping && visualLine(line) == cm.display.maxLine)
      { updateMaxLine = true }
    if (marker.collapsed && curLine != from.line) { updateLineHeight(line, 0) }
    addMarkedSpan(line, new MarkedSpan(marker,
                                       curLine == from.line ? from.ch : null,
                                       curLine == to.line ? to.ch : null))
    ++curLine
  })
  // lineIsHidden depends on the presence of the spans, so needs a second pass
  if (marker.collapsed) { doc.iter(from.line, to.line + 1, function (line) {
    if (lineIsHidden(doc, line)) { updateLineHeight(line, 0) }
  }) }

  if (marker.clearOnEnter) { on(marker, "beforeCursorEnter", function () { return marker.clear(); }) }

  if (marker.readOnly) {
    seeReadOnlySpans()
    if (doc.history.done.length || doc.history.undone.length)
      { doc.clearHistory() }
  }
  if (marker.collapsed) {
    marker.id = ++nextMarkerId
    marker.atomic = true
  }
  if (cm) {
    // Sync editor state
    if (updateMaxLine) { cm.curOp.updateMaxLine = true }
    if (marker.collapsed)
      { regChange(cm, from.line, to.line + 1) }
    else if (marker.className || marker.title || marker.startStyle || marker.endStyle || marker.css)
      { for (var i = from.line; i <= to.line; i++) { regLineChange(cm, i, "text") } }
    if (marker.atomic) { reCheckSelection(cm.doc) }
    signalLater(cm, "markerAdded", cm, marker)
  }
  return marker
}

// SHARED TEXTMARKERS

// A shared marker spans multiple linked documents. It is
// implemented as a meta-marker-object controlling multiple normal
// markers.
var SharedTextMarker = function(markers, primary) {
  var this$1 = this;

  this.markers = markers
  this.primary = primary
  for (var i = 0; i < markers.length; ++i)
    { markers[i].parent = this$1 }
};

SharedTextMarker.prototype.clear = function () {
    var this$1 = this;

  if (this.explicitlyCleared) { return }
  this.explicitlyCleared = true
  for (var i = 0; i < this.markers.length; ++i)
    { this$1.markers[i].clear() }
  signalLater(this, "clear")
};

SharedTextMarker.prototype.find = function (side, lineObj) {
  return this.primary.find(side, lineObj)
};
eventMixin(SharedTextMarker)

function markTextShared(doc, from, to, options, type) {
  options = copyObj(options)
  options.shared = false
  var markers = [markText(doc, from, to, options, type)], primary = markers[0]
  var widget = options.widgetNode
  linkedDocs(doc, function (doc) {
    if (widget) { options.widgetNode = widget.cloneNode(true) }
    markers.push(markText(doc, clipPos(doc, from), clipPos(doc, to), options, type))
    for (var i = 0; i < doc.linked.length; ++i)
      { if (doc.linked[i].isParent) { return } }
    primary = lst(markers)
  })
  return new SharedTextMarker(markers, primary)
}

function findSharedMarkers(doc) {
  return doc.findMarks(Pos(doc.first, 0), doc.clipPos(Pos(doc.lastLine())), function (m) { return m.parent; })
}

function copySharedMarkers(doc, markers) {
  for (var i = 0; i < markers.length; i++) {
    var marker = markers[i], pos = marker.find()
    var mFrom = doc.clipPos(pos.from), mTo = doc.clipPos(pos.to)
    if (cmp(mFrom, mTo)) {
      var subMark = markText(doc, mFrom, mTo, marker.primary, marker.primary.type)
      marker.markers.push(subMark)
      subMark.parent = marker
    }
  }
}

function detachSharedMarkers(markers) {
  var loop = function ( i ) {
    var marker = markers[i], linked = [marker.primary.doc]
    linkedDocs(marker.primary.doc, function (d) { return linked.push(d); })
    for (var j = 0; j < marker.markers.length; j++) {
      var subMarker = marker.markers[j]
      if (indexOf(linked, subMarker.doc) == -1) {
        subMarker.parent = null
        marker.markers.splice(j--, 1)
      }
    }
  };

  for (var i = 0; i < markers.length; i++) loop( i );
}

var nextDocId = 0
var Doc = function(text, mode, firstLine, lineSep, direction) {
  if (!(this instanceof Doc)) { return new Doc(text, mode, firstLine, lineSep, direction) }
  if (firstLine == null) { firstLine = 0 }

  BranchChunk.call(this, [new LeafChunk([new Line("", null)])])
  this.first = firstLine
  this.scrollTop = this.scrollLeft = 0
  this.cantEdit = false
  this.cleanGeneration = 1
  this.modeFrontier = this.highlightFrontier = firstLine
  var start = Pos(firstLine, 0)
  this.sel = simpleSelection(start)
  this.history = new History(null)
  this.id = ++nextDocId
  this.modeOption = mode
  this.lineSep = lineSep
  this.direction = (direction == "rtl") ? "rtl" : "ltr"
  this.extend = false

  if (typeof text == "string") { text = this.splitLines(text) }
  updateDoc(this, {from: start, to: start, text: text})
  setSelection(this, simpleSelection(start), sel_dontScroll)
}

Doc.prototype = createObj(BranchChunk.prototype, {
  constructor: Doc,
  // Iterate over the document. Supports two forms -- with only one
  // argument, it calls that for each line in the document. With
  // three, it iterates over the range given by the first two (with
  // the second being non-inclusive).
  iter: function(from, to, op) {
    if (op) { this.iterN(from - this.first, to - from, op) }
    else { this.iterN(this.first, this.first + this.size, from) }
  },

  // Non-public interface for adding and removing lines.
  insert: function(at, lines) {
    var height = 0
    for (var i = 0; i < lines.length; ++i) { height += lines[i].height }
    this.insertInner(at - this.first, lines, height)
  },
  remove: function(at, n) { this.removeInner(at - this.first, n) },

  // From here, the methods are part of the public interface. Most
  // are also available from CodeMirror (editor) instances.

  getValue: function(lineSep) {
    var lines = getLines(this, this.first, this.first + this.size)
    if (lineSep === false) { return lines }
    return lines.join(lineSep || this.lineSeparator())
  },
  setValue: docMethodOp(function(code) {
    var top = Pos(this.first, 0), last = this.first + this.size - 1
    makeChange(this, {from: top, to: Pos(last, getLine(this, last).text.length),
                      text: this.splitLines(code), origin: "setValue", full: true}, true)
    if (this.cm) { scrollToCoords(this.cm, 0, 0) }
    setSelection(this, simpleSelection(top), sel_dontScroll)
  }),
  replaceRange: function(code, from, to, origin) {
    from = clipPos(this, from)
    to = to ? clipPos(this, to) : from
    replaceRange(this, code, from, to, origin)
  },
  getRange: function(from, to, lineSep) {
    var lines = getBetween(this, clipPos(this, from), clipPos(this, to))
    if (lineSep === false) { return lines }
    return lines.join(lineSep || this.lineSeparator())
  },

  getLine: function(line) {var l = this.getLineHandle(line); return l && l.text},

  getLineHandle: function(line) {if (isLine(this, line)) { return getLine(this, line) }},
  getLineNumber: function(line) {return lineNo(line)},

  getLineHandleVisualStart: function(line) {
    if (typeof line == "number") { line = getLine(this, line) }
    return visualLine(line)
  },

  lineCount: function() {return this.size},
  firstLine: function() {return this.first},
  lastLine: function() {return this.first + this.size - 1},

  clipPos: function(pos) {return clipPos(this, pos)},

  getCursor: function(start) {
    var range = this.sel.primary(), pos
    if (start == null || start == "head") { pos = range.head }
    else if (start == "anchor") { pos = range.anchor }
    else if (start == "end" || start == "to" || start === false) { pos = range.to() }
    else { pos = range.from() }
    return pos
  },
  listSelections: function() { return this.sel.ranges },
  somethingSelected: function() {return this.sel.somethingSelected()},

  setCursor: docMethodOp(function(line, ch, options) {
    setSimpleSelection(this, clipPos(this, typeof line == "number" ? Pos(line, ch || 0) : line), null, options)
  }),
  setSelection: docMethodOp(function(anchor, head, options) {
    setSimpleSelection(this, clipPos(this, anchor), clipPos(this, head || anchor), options)
  }),
  extendSelection: docMethodOp(function(head, other, options) {
    extendSelection(this, clipPos(this, head), other && clipPos(this, other), options)
  }),
  extendSelections: docMethodOp(function(heads, options) {
    extendSelections(this, clipPosArray(this, heads), options)
  }),
  extendSelectionsBy: docMethodOp(function(f, options) {
    var heads = map(this.sel.ranges, f)
    extendSelections(this, clipPosArray(this, heads), options)
  }),
  setSelections: docMethodOp(function(ranges, primary, options) {
    var this$1 = this;

    if (!ranges.length) { return }
    var out = []
    for (var i = 0; i < ranges.length; i++)
      { out[i] = new Range(clipPos(this$1, ranges[i].anchor),
                         clipPos(this$1, ranges[i].head)) }
    if (primary == null) { primary = Math.min(ranges.length - 1, this.sel.primIndex) }
    setSelection(this, normalizeSelection(out, primary), options)
  }),
  addSelection: docMethodOp(function(anchor, head, options) {
    var ranges = this.sel.ranges.slice(0)
    ranges.push(new Range(clipPos(this, anchor), clipPos(this, head || anchor)))
    setSelection(this, normalizeSelection(ranges, ranges.length - 1), options)
  }),

  getSelection: function(lineSep) {
    var this$1 = this;

    var ranges = this.sel.ranges, lines
    for (var i = 0; i < ranges.length; i++) {
      var sel = getBetween(this$1, ranges[i].from(), ranges[i].to())
      lines = lines ? lines.concat(sel) : sel
    }
    if (lineSep === false) { return lines }
    else { return lines.join(lineSep || this.lineSeparator()) }
  },
  getSelections: function(lineSep) {
    var this$1 = this;

    var parts = [], ranges = this.sel.ranges
    for (var i = 0; i < ranges.length; i++) {
      var sel = getBetween(this$1, ranges[i].from(), ranges[i].to())
      if (lineSep !== false) { sel = sel.join(lineSep || this$1.lineSeparator()) }
      parts[i] = sel
    }
    return parts
  },
  replaceSelection: function(code, collapse, origin) {
    var dup = []
    for (var i = 0; i < this.sel.ranges.length; i++)
      { dup[i] = code }
    this.replaceSelections(dup, collapse, origin || "+input")
  },
  replaceSelections: docMethodOp(function(code, collapse, origin) {
    var this$1 = this;

    var changes = [], sel = this.sel
    for (var i = 0; i < sel.ranges.length; i++) {
      var range = sel.ranges[i]
      changes[i] = {from: range.from(), to: range.to(), text: this$1.splitLines(code[i]), origin: origin}
    }
    var newSel = collapse && collapse != "end" && computeReplacedSel(this, changes, collapse)
    for (var i$1 = changes.length - 1; i$1 >= 0; i$1--)
      { makeChange(this$1, changes[i$1]) }
    if (newSel) { setSelectionReplaceHistory(this, newSel) }
    else if (this.cm) { ensureCursorVisible(this.cm) }
  }),
  undo: docMethodOp(function() {makeChangeFromHistory(this, "undo")}),
  redo: docMethodOp(function() {makeChangeFromHistory(this, "redo")}),
  undoSelection: docMethodOp(function() {makeChangeFromHistory(this, "undo", true)}),
  redoSelection: docMethodOp(function() {makeChangeFromHistory(this, "redo", true)}),

  setExtending: function(val) {this.extend = val},
  getExtending: function() {return this.extend},

  historySize: function() {
    var hist = this.history, done = 0, undone = 0
    for (var i = 0; i < hist.done.length; i++) { if (!hist.done[i].ranges) { ++done } }
    for (var i$1 = 0; i$1 < hist.undone.length; i$1++) { if (!hist.undone[i$1].ranges) { ++undone } }
    return {undo: done, redo: undone}
  },
  clearHistory: function() {this.history = new History(this.history.maxGeneration)},

  markClean: function() {
    this.cleanGeneration = this.changeGeneration(true)
  },
  changeGeneration: function(forceSplit) {
    if (forceSplit)
      { this.history.lastOp = this.history.lastSelOp = this.history.lastOrigin = null }
    return this.history.generation
  },
  isClean: function (gen) {
    return this.history.generation == (gen || this.cleanGeneration)
  },

  getHistory: function() {
    return {done: copyHistoryArray(this.history.done),
            undone: copyHistoryArray(this.history.undone)}
  },
  setHistory: function(histData) {
    var hist = this.history = new History(this.history.maxGeneration)
    hist.done = copyHistoryArray(histData.done.slice(0), null, true)
    hist.undone = copyHistoryArray(histData.undone.slice(0), null, true)
  },

  setGutterMarker: docMethodOp(function(line, gutterID, value) {
    return changeLine(this, line, "gutter", function (line) {
      var markers = line.gutterMarkers || (line.gutterMarkers = {})
      markers[gutterID] = value
      if (!value && isEmpty(markers)) { line.gutterMarkers = null }
      return true
    })
  }),

  clearGutter: docMethodOp(function(gutterID) {
    var this$1 = this;

    this.iter(function (line) {
      if (line.gutterMarkers && line.gutterMarkers[gutterID]) {
        changeLine(this$1, line, "gutter", function () {
          line.gutterMarkers[gutterID] = null
          if (isEmpty(line.gutterMarkers)) { line.gutterMarkers = null }
          return true
        })
      }
    })
  }),

  lineInfo: function(line) {
    var n
    if (typeof line == "number") {
      if (!isLine(this, line)) { return null }
      n = line
      line = getLine(this, line)
      if (!line) { return null }
    } else {
      n = lineNo(line)
      if (n == null) { return null }
    }
    return {line: n, handle: line, text: line.text, gutterMarkers: line.gutterMarkers,
            textClass: line.textClass, bgClass: line.bgClass, wrapClass: line.wrapClass,
            widgets: line.widgets}
  },

  addLineClass: docMethodOp(function(handle, where, cls) {
    return changeLine(this, handle, where == "gutter" ? "gutter" : "class", function (line) {
      var prop = where == "text" ? "textClass"
               : where == "background" ? "bgClass"
               : where == "gutter" ? "gutterClass" : "wrapClass"
      if (!line[prop]) { line[prop] = cls }
      else if (classTest(cls).test(line[prop])) { return false }
      else { line[prop] += " " + cls }
      return true
    })
  }),
  removeLineClass: docMethodOp(function(handle, where, cls) {
    return changeLine(this, handle, where == "gutter" ? "gutter" : "class", function (line) {
      var prop = where == "text" ? "textClass"
               : where == "background" ? "bgClass"
               : where == "gutter" ? "gutterClass" : "wrapClass"
      var cur = line[prop]
      if (!cur) { return false }
      else if (cls == null) { line[prop] = null }
      else {
        var found = cur.match(classTest(cls))
        if (!found) { return false }
        var end = found.index + found[0].length
        line[prop] = cur.slice(0, found.index) + (!found.index || end == cur.length ? "" : " ") + cur.slice(end) || null
      }
      return true
    })
  }),

  addLineWidget: docMethodOp(function(handle, node, options) {
    return addLineWidget(this, handle, node, options)
  }),
  removeLineWidget: function(widget) { widget.clear() },

  markText: function(from, to, options) {
    return markText(this, clipPos(this, from), clipPos(this, to), options, options && options.type || "range")
  },
  setBookmark: function(pos, options) {
    var realOpts = {replacedWith: options && (options.nodeType == null ? options.widget : options),
                    insertLeft: options && options.insertLeft,
                    clearWhenEmpty: false, shared: options && options.shared,
                    handleMouseEvents: options && options.handleMouseEvents}
    pos = clipPos(this, pos)
    return markText(this, pos, pos, realOpts, "bookmark")
  },
  findMarksAt: function(pos) {
    pos = clipPos(this, pos)
    var markers = [], spans = getLine(this, pos.line).markedSpans
    if (spans) { for (var i = 0; i < spans.length; ++i) {
      var span = spans[i]
      if ((span.from == null || span.from <= pos.ch) &&
          (span.to == null || span.to >= pos.ch))
        { markers.push(span.marker.parent || span.marker) }
    } }
    return markers
  },
  findMarks: function(from, to, filter) {
    from = clipPos(this, from); to = clipPos(this, to)
    var found = [], lineNo = from.line
    this.iter(from.line, to.line + 1, function (line) {
      var spans = line.markedSpans
      if (spans) { for (var i = 0; i < spans.length; i++) {
        var span = spans[i]
        if (!(span.to != null && lineNo == from.line && from.ch >= span.to ||
              span.from == null && lineNo != from.line ||
              span.from != null && lineNo == to.line && span.from >= to.ch) &&
            (!filter || filter(span.marker)))
          { found.push(span.marker.parent || span.marker) }
      } }
      ++lineNo
    })
    return found
  },
  getAllMarks: function() {
    var markers = []
    this.iter(function (line) {
      var sps = line.markedSpans
      if (sps) { for (var i = 0; i < sps.length; ++i)
        { if (sps[i].from != null) { markers.push(sps[i].marker) } } }
    })
    return markers
  },

  posFromIndex: function(off) {
    var ch, lineNo = this.first, sepSize = this.lineSeparator().length
    this.iter(function (line) {
      var sz = line.text.length + sepSize
      if (sz > off) { ch = off; return true }
      off -= sz
      ++lineNo
    })
    return clipPos(this, Pos(lineNo, ch))
  },
  indexFromPos: function (coords) {
    coords = clipPos(this, coords)
    var index = coords.ch
    if (coords.line < this.first || coords.ch < 0) { return 0 }
    var sepSize = this.lineSeparator().length
    this.iter(this.first, coords.line, function (line) { // iter aborts when callback returns a truthy value
      index += line.text.length + sepSize
    })
    return index
  },

  copy: function(copyHistory) {
    var doc = new Doc(getLines(this, this.first, this.first + this.size),
                      this.modeOption, this.first, this.lineSep, this.direction)
    doc.scrollTop = this.scrollTop; doc.scrollLeft = this.scrollLeft
    doc.sel = this.sel
    doc.extend = false
    if (copyHistory) {
      doc.history.undoDepth = this.history.undoDepth
      doc.setHistory(this.getHistory())
    }
    return doc
  },

  linkedDoc: function(options) {
    if (!options) { options = {} }
    var from = this.first, to = this.first + this.size
    if (options.from != null && options.from > from) { from = options.from }
    if (options.to != null && options.to < to) { to = options.to }
    var copy = new Doc(getLines(this, from, to), options.mode || this.modeOption, from, this.lineSep, this.direction)
    if (options.sharedHist) { copy.history = this.history
    ; }(this.linked || (this.linked = [])).push({doc: copy, sharedHist: options.sharedHist})
    copy.linked = [{doc: this, isParent: true, sharedHist: options.sharedHist}]
    copySharedMarkers(copy, findSharedMarkers(this))
    return copy
  },
  unlinkDoc: function(other) {
    var this$1 = this;

    if (other instanceof CodeMirror) { other = other.doc }
    if (this.linked) { for (var i = 0; i < this.linked.length; ++i) {
      var link = this$1.linked[i]
      if (link.doc != other) { continue }
      this$1.linked.splice(i, 1)
      other.unlinkDoc(this$1)
      detachSharedMarkers(findSharedMarkers(this$1))
      break
    } }
    // If the histories were shared, split them again
    if (other.history == this.history) {
      var splitIds = [other.id]
      linkedDocs(other, function (doc) { return splitIds.push(doc.id); }, true)
      other.history = new History(null)
      other.history.done = copyHistoryArray(this.history.done, splitIds)
      other.history.undone = copyHistoryArray(this.history.undone, splitIds)
    }
  },
  iterLinkedDocs: function(f) {linkedDocs(this, f)},

  getMode: function() {return this.mode},
  getEditor: function() {return this.cm},

  splitLines: function(str) {
    if (this.lineSep) { return str.split(this.lineSep) }
    return splitLinesAuto(str)
  },
  lineSeparator: function() { return this.lineSep || "\n" },

  setDirection: docMethodOp(function (dir) {
    if (dir != "rtl") { dir = "ltr" }
    if (dir == this.direction) { return }
    this.direction = dir
    this.iter(function (line) { return line.order = null; })
    if (this.cm) { directionChanged(this.cm) }
  })
})

// Public alias.
Doc.prototype.eachLine = Doc.prototype.iter

// Kludge to work around strange IE behavior where it'll sometimes
// re-fire a series of drag-related events right after the drop (#1551)
var lastDrop = 0

function onDrop(e) {
  var cm = this
  clearDragCursor(cm)
  if (signalDOMEvent(cm, e) || eventInWidget(cm.display, e))
    { return }
  e_preventDefault(e)
  if (ie) { lastDrop = +new Date }
  var pos = posFromMouse(cm, e, true), files = e.dataTransfer.files
  if (!pos || cm.isReadOnly()) { return }
  // Might be a file drop, in which case we simply extract the text
  // and insert it.
  if (files && files.length && window.FileReader && window.File) {
    var n = files.length, text = Array(n), read = 0
    var loadFile = function (file, i) {
      if (cm.options.allowDropFileTypes &&
          indexOf(cm.options.allowDropFileTypes, file.type) == -1)
        { return }

      var reader = new FileReader
      reader.onload = operation(cm, function () {
        var content = reader.result
        if (/[\x00-\x08\x0e-\x1f]{2}/.test(content)) { content = "" }
        text[i] = content
        if (++read == n) {
          pos = clipPos(cm.doc, pos)
          var change = {from: pos, to: pos,
                        text: cm.doc.splitLines(text.join(cm.doc.lineSeparator())),
                        origin: "paste"}
          makeChange(cm.doc, change)
          setSelectionReplaceHistory(cm.doc, simpleSelection(pos, changeEnd(change)))
        }
      })
      reader.readAsText(file)
    }
    for (var i = 0; i < n; ++i) { loadFile(files[i], i) }
  } else { // Normal drop
    // Don't do a replace if the drop happened inside of the selected text.
    if (cm.state.draggingText && cm.doc.sel.contains(pos) > -1) {
      cm.state.draggingText(e)
      // Ensure the editor is re-focused
      setTimeout(function () { return cm.display.input.focus(); }, 20)
      return
    }
    try {
      var text$1 = e.dataTransfer.getData("Text")
      if (text$1) {
        var selected
        if (cm.state.draggingText && !cm.state.draggingText.copy)
          { selected = cm.listSelections() }
        setSelectionNoUndo(cm.doc, simpleSelection(pos, pos))
        if (selected) { for (var i$1 = 0; i$1 < selected.length; ++i$1)
          { replaceRange(cm.doc, "", selected[i$1].anchor, selected[i$1].head, "drag") } }
        cm.replaceSelection(text$1, "around", "paste")
        cm.display.input.focus()
      }
    }
    catch(e){}
  }
}

function onDragStart(cm, e) {
  if (ie && (!cm.state.draggingText || +new Date - lastDrop < 100)) { e_stop(e); return }
  if (signalDOMEvent(cm, e) || eventInWidget(cm.display, e)) { return }

  e.dataTransfer.setData("Text", cm.getSelection())
  e.dataTransfer.effectAllowed = "copyMove"

  // Use dummy image instead of default browsers image.
  // Recent Safari (~6.0.2) have a tendency to segfault when this happens, so we don't do it there.
  if (e.dataTransfer.setDragImage && !safari) {
    var img = elt("img", null, null, "position: fixed; left: 0; top: 0;")
    img.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
    if (presto) {
      img.width = img.height = 1
      cm.display.wrapper.appendChild(img)
      // Force a relayout, or Opera won't use our image for some obscure reason
      img._top = img.offsetTop
    }
    e.dataTransfer.setDragImage(img, 0, 0)
    if (presto) { img.parentNode.removeChild(img) }
  }
}

function onDragOver(cm, e) {
  var pos = posFromMouse(cm, e)
  if (!pos) { return }
  var frag = document.createDocumentFragment()
  drawSelectionCursor(cm, pos, frag)
  if (!cm.display.dragCursor) {
    cm.display.dragCursor = elt("div", null, "CodeMirror-cursors CodeMirror-dragcursors")
    cm.display.lineSpace.insertBefore(cm.display.dragCursor, cm.display.cursorDiv)
  }
  removeChildrenAndAdd(cm.display.dragCursor, frag)
}

function clearDragCursor(cm) {
  if (cm.display.dragCursor) {
    cm.display.lineSpace.removeChild(cm.display.dragCursor)
    cm.display.dragCursor = null
  }
}

// These must be handled carefully, because naively registering a
// handler for each editor will cause the editors to never be
// garbage collected.

function forEachCodeMirror(f) {
  if (!document.getElementsByClassName) { return }
  var byClass = document.getElementsByClassName("CodeMirror")
  for (var i = 0; i < byClass.length; i++) {
    var cm = byClass[i].CodeMirror
    if (cm) { f(cm) }
  }
}

var globalsRegistered = false
function ensureGlobalHandlers() {
  if (globalsRegistered) { return }
  registerGlobalHandlers()
  globalsRegistered = true
}
function registerGlobalHandlers() {
  // When the window resizes, we need to refresh active editors.
  var resizeTimer
  on(window, "resize", function () {
    if (resizeTimer == null) { resizeTimer = setTimeout(function () {
      resizeTimer = null
      forEachCodeMirror(onResize)
    }, 100) }
  })
  // When the window loses focus, we want to show the editor as blurred
  on(window, "blur", function () { return forEachCodeMirror(onBlur); })
}
// Called when the window resizes
function onResize(cm) {
  var d = cm.display
  if (d.lastWrapHeight == d.wrapper.clientHeight && d.lastWrapWidth == d.wrapper.clientWidth)
    { return }
  // Might be a text scaling operation, clear size caches.
  d.cachedCharWidth = d.cachedTextHeight = d.cachedPaddingH = null
  d.scrollbarsClipped = false
  cm.setSize()
}

var keyNames = {
  3: "Pause", 8: "Backspace", 9: "Tab", 13: "Enter", 16: "Shift", 17: "Ctrl", 18: "Alt",
  19: "Pause", 20: "CapsLock", 27: "Esc", 32: "Space", 33: "PageUp", 34: "PageDown", 35: "End",
  36: "Home", 37: "Left", 38: "Up", 39: "Right", 40: "Down", 44: "PrintScrn", 45: "Insert",
  46: "Delete", 59: ";", 61: "=", 91: "Mod", 92: "Mod", 93: "Mod",
  106: "*", 107: "=", 109: "-", 110: ".", 111: "/", 127: "Delete", 145: "ScrollLock",
  173: "-", 186: ";", 187: "=", 188: ",", 189: "-", 190: ".", 191: "/", 192: "`", 219: "[", 220: "\\",
  221: "]", 222: "'", 63232: "Up", 63233: "Down", 63234: "Left", 63235: "Right", 63272: "Delete",
  63273: "Home", 63275: "End", 63276: "PageUp", 63277: "PageDown", 63302: "Insert"
}

// Number keys
for (var i = 0; i < 10; i++) { keyNames[i + 48] = keyNames[i + 96] = String(i) }
// Alphabetic keys
for (var i$1 = 65; i$1 <= 90; i$1++) { keyNames[i$1] = String.fromCharCode(i$1) }
// Function keys
for (var i$2 = 1; i$2 <= 12; i$2++) { keyNames[i$2 + 111] = keyNames[i$2 + 63235] = "F" + i$2 }

var keyMap = {}

keyMap.basic = {
  "Left": "goCharLeft", "Right": "goCharRight", "Up": "goLineUp", "Down": "goLineDown",
  "End": "goLineEnd", "Home": "goLineStartSmart", "PageUp": "goPageUp", "PageDown": "goPageDown",
  "Delete": "delCharAfter", "Backspace": "delCharBefore", "Shift-Backspace": "delCharBefore",
  "Tab": "defaultTab", "Shift-Tab": "indentAuto",
  "Enter": "newlineAndIndent", "Insert": "toggleOverwrite",
  "Esc": "singleSelection"
}
// Note that the save and find-related commands aren't defined by
// default. User code or addons can define them. Unknown commands
// are simply ignored.
keyMap.pcDefault = {
  "Ctrl-A": "selectAll", "Ctrl-D": "deleteLine", "Ctrl-Z": "undo", "Shift-Ctrl-Z": "redo", "Ctrl-Y": "redo",
  "Ctrl-Home": "goDocStart", "Ctrl-End": "goDocEnd", "Ctrl-Up": "goLineUp", "Ctrl-Down": "goLineDown",
  "Ctrl-Left": "goGroupLeft", "Ctrl-Right": "goGroupRight", "Alt-Left": "goLineStart", "Alt-Right": "goLineEnd",
  "Ctrl-Backspace": "delGroupBefore", "Ctrl-Delete": "delGroupAfter", "Ctrl-S": "save", "Ctrl-F": "find",
  "Ctrl-G": "findNext", "Shift-Ctrl-G": "findPrev", "Shift-Ctrl-F": "replace", "Shift-Ctrl-R": "replaceAll",
  "Ctrl-[": "indentLess", "Ctrl-]": "indentMore",
  "Ctrl-U": "undoSelection", "Shift-Ctrl-U": "redoSelection", "Alt-U": "redoSelection",
  fallthrough: "basic"
}
// Very basic readline/emacs-style bindings, which are standard on Mac.
keyMap.emacsy = {
  "Ctrl-F": "goCharRight", "Ctrl-B": "goCharLeft", "Ctrl-P": "goLineUp", "Ctrl-N": "goLineDown",
  "Alt-F": "goWordRight", "Alt-B": "goWordLeft", "Ctrl-A": "goLineStart", "Ctrl-E": "goLineEnd",
  "Ctrl-V": "goPageDown", "Shift-Ctrl-V": "goPageUp", "Ctrl-D": "delCharAfter", "Ctrl-H": "delCharBefore",
  "Alt-D": "delWordAfter", "Alt-Backspace": "delWordBefore", "Ctrl-K": "killLine", "Ctrl-T": "transposeChars",
  "Ctrl-O": "openLine"
}
keyMap.macDefault = {
  "Cmd-A": "selectAll", "Cmd-D": "deleteLine", "Cmd-Z": "undo", "Shift-Cmd-Z": "redo", "Cmd-Y": "redo",
  "Cmd-Home": "goDocStart", "Cmd-Up": "goDocStart", "Cmd-End": "goDocEnd", "Cmd-Down": "goDocEnd", "Alt-Left": "goGroupLeft",
  "Alt-Right": "goGroupRight", "Cmd-Left": "goLineLeft", "Cmd-Right": "goLineRight", "Alt-Backspace": "delGroupBefore",
  "Ctrl-Alt-Backspace": "delGroupAfter", "Alt-Delete": "delGroupAfter", "Cmd-S": "save", "Cmd-F": "find",
  "Cmd-G": "findNext", "Shift-Cmd-G": "findPrev", "Cmd-Alt-F": "replace", "Shift-Cmd-Alt-F": "replaceAll",
  "Cmd-[": "indentLess", "Cmd-]": "indentMore", "Cmd-Backspace": "delWrappedLineLeft", "Cmd-Delete": "delWrappedLineRight",
  "Cmd-U": "undoSelection", "Shift-Cmd-U": "redoSelection", "Ctrl-Up": "goDocStart", "Ctrl-Down": "goDocEnd",
  fallthrough: ["basic", "emacsy"]
}
keyMap["default"] = mac ? keyMap.macDefault : keyMap.pcDefault

// KEYMAP DISPATCH

function normalizeKeyName(name) {
  var parts = name.split(/-(?!$)/)
  name = parts[parts.length - 1]
  var alt, ctrl, shift, cmd
  for (var i = 0; i < parts.length - 1; i++) {
    var mod = parts[i]
    if (/^(cmd|meta|m)$/i.test(mod)) { cmd = true }
    else if (/^a(lt)?$/i.test(mod)) { alt = true }
    else if (/^(c|ctrl|control)$/i.test(mod)) { ctrl = true }
    else if (/^s(hift)?$/i.test(mod)) { shift = true }
    else { throw new Error("Unrecognized modifier name: " + mod) }
  }
  if (alt) { name = "Alt-" + name }
  if (ctrl) { name = "Ctrl-" + name }
  if (cmd) { name = "Cmd-" + name }
  if (shift) { name = "Shift-" + name }
  return name
}

// This is a kludge to keep keymaps mostly working as raw objects
// (backwards compatibility) while at the same time support features
// like normalization and multi-stroke key bindings. It compiles a
// new normalized keymap, and then updates the old object to reflect
// this.
function normalizeKeyMap(keymap) {
  var copy = {}
  for (var keyname in keymap) { if (keymap.hasOwnProperty(keyname)) {
    var value = keymap[keyname]
    if (/^(name|fallthrough|(de|at)tach)$/.test(keyname)) { continue }
    if (value == "...") { delete keymap[keyname]; continue }

    var keys = map(keyname.split(" "), normalizeKeyName)
    for (var i = 0; i < keys.length; i++) {
      var val = (void 0), name = (void 0)
      if (i == keys.length - 1) {
        name = keys.join(" ")
        val = value
      } else {
        name = keys.slice(0, i + 1).join(" ")
        val = "..."
      }
      var prev = copy[name]
      if (!prev) { copy[name] = val }
      else if (prev != val) { throw new Error("Inconsistent bindings for " + name) }
    }
    delete keymap[keyname]
  } }
  for (var prop in copy) { keymap[prop] = copy[prop] }
  return keymap
}

function lookupKey(key, map, handle, context) {
  map = getKeyMap(map)
  var found = map.call ? map.call(key, context) : map[key]
  if (found === false) { return "nothing" }
  if (found === "...") { return "multi" }
  if (found != null && handle(found)) { return "handled" }

  if (map.fallthrough) {
    if (Object.prototype.toString.call(map.fallthrough) != "[object Array]")
      { return lookupKey(key, map.fallthrough, handle, context) }
    for (var i = 0; i < map.fallthrough.length; i++) {
      var result = lookupKey(key, map.fallthrough[i], handle, context)
      if (result) { return result }
    }
  }
}

// Modifier key presses don't count as 'real' key presses for the
// purpose of keymap fallthrough.
function isModifierKey(value) {
  var name = typeof value == "string" ? value : keyNames[value.keyCode]
  return name == "Ctrl" || name == "Alt" || name == "Shift" || name == "Mod"
}

function addModifierNames(name, event, noShift) {
  var base = name
  if (event.altKey && base != "Alt") { name = "Alt-" + name }
  if ((flipCtrlCmd ? event.metaKey : event.ctrlKey) && base != "Ctrl") { name = "Ctrl-" + name }
  if ((flipCtrlCmd ? event.ctrlKey : event.metaKey) && base != "Cmd") { name = "Cmd-" + name }
  if (!noShift && event.shiftKey && base != "Shift") { name = "Shift-" + name }
  return name
}

// Look up the name of a key as indicated by an event object.
function keyName(event, noShift) {
  if (presto && event.keyCode == 34 && event["char"]) { return false }
  var name = keyNames[event.keyCode]
  if (name == null || event.altGraphKey) { return false }
  // Ctrl-ScrollLock has keyCode 3, same as Ctrl-Pause,
  // so we'll use event.code when available (Chrome 48+, FF 38+, Safari 10.1+)
  if (event.keyCode == 3 && event.code) { name = event.code }
  return addModifierNames(name, event, noShift)
}

function getKeyMap(val) {
  return typeof val == "string" ? keyMap[val] : val
}

// Helper for deleting text near the selection(s), used to implement
// backspace, delete, and similar functionality.
function deleteNearSelection(cm, compute) {
  var ranges = cm.doc.sel.ranges, kill = []
  // Build up a set of ranges to kill first, merging overlapping
  // ranges.
  for (var i = 0; i < ranges.length; i++) {
    var toKill = compute(ranges[i])
    while (kill.length && cmp(toKill.from, lst(kill).to) <= 0) {
      var replaced = kill.pop()
      if (cmp(replaced.from, toKill.from) < 0) {
        toKill.from = replaced.from
        break
      }
    }
    kill.push(toKill)
  }
  // Next, remove those actual ranges.
  runInOp(cm, function () {
    for (var i = kill.length - 1; i >= 0; i--)
      { replaceRange(cm.doc, "", kill[i].from, kill[i].to, "+delete") }
    ensureCursorVisible(cm)
  })
}

function moveCharLogically(line, ch, dir) {
  var target = skipExtendingChars(line.text, ch + dir, dir)
  return target < 0 || target > line.text.length ? null : target
}

function moveLogically(line, start, dir) {
  var ch = moveCharLogically(line, start.ch, dir)
  return ch == null ? null : new Pos(start.line, ch, dir < 0 ? "after" : "before")
}

function endOfLine(visually, cm, lineObj, lineNo, dir) {
  if (visually) {
    var order = getOrder(lineObj, cm.doc.direction)
    if (order) {
      var part = dir < 0 ? lst(order) : order[0]
      var moveInStorageOrder = (dir < 0) == (part.level == 1)
      var sticky = moveInStorageOrder ? "after" : "before"
      var ch
      // With a wrapped rtl chunk (possibly spanning multiple bidi parts),
      // it could be that the last bidi part is not on the last visual line,
      // since visual lines contain content order-consecutive chunks.
      // Thus, in rtl, we are looking for the first (content-order) character
      // in the rtl chunk that is on the last line (that is, the same line
      // as the last (content-order) character).
      if (part.level > 0 || cm.doc.direction == "rtl") {
        var prep = prepareMeasureForLine(cm, lineObj)
        ch = dir < 0 ? lineObj.text.length - 1 : 0
        var targetTop = measureCharPrepared(cm, prep, ch).top
        ch = findFirst(function (ch) { return measureCharPrepared(cm, prep, ch).top == targetTop; }, (dir < 0) == (part.level == 1) ? part.from : part.to - 1, ch)
        if (sticky == "before") { ch = moveCharLogically(lineObj, ch, 1) }
      } else { ch = dir < 0 ? part.to : part.from }
      return new Pos(lineNo, ch, sticky)
    }
  }
  return new Pos(lineNo, dir < 0 ? lineObj.text.length : 0, dir < 0 ? "before" : "after")
}

function moveVisually(cm, line, start, dir) {
  var bidi = getOrder(line, cm.doc.direction)
  if (!bidi) { return moveLogically(line, start, dir) }
  if (start.ch >= line.text.length) {
    start.ch = line.text.length
    start.sticky = "before"
  } else if (start.ch <= 0) {
    start.ch = 0
    start.sticky = "after"
  }
  var partPos = getBidiPartAt(bidi, start.ch, start.sticky), part = bidi[partPos]
  if (cm.doc.direction == "ltr" && part.level % 2 == 0 && (dir > 0 ? part.to > start.ch : part.from < start.ch)) {
    // Case 1: We move within an ltr part in an ltr editor. Even with wrapped lines,
    // nothing interesting happens.
    return moveLogically(line, start, dir)
  }

  var mv = function (pos, dir) { return moveCharLogically(line, pos instanceof Pos ? pos.ch : pos, dir); }
  var prep
  var getWrappedLineExtent = function (ch) {
    if (!cm.options.lineWrapping) { return {begin: 0, end: line.text.length} }
    prep = prep || prepareMeasureForLine(cm, line)
    return wrappedLineExtentChar(cm, line, prep, ch)
  }
  var wrappedLineExtent = getWrappedLineExtent(start.sticky == "before" ? mv(start, -1) : start.ch)

  if (cm.doc.direction == "rtl" || part.level == 1) {
    var moveInStorageOrder = (part.level == 1) == (dir < 0)
    var ch = mv(start, moveInStorageOrder ? 1 : -1)
    if (ch != null && (!moveInStorageOrder ? ch >= part.from && ch >= wrappedLineExtent.begin : ch <= part.to && ch <= wrappedLineExtent.end)) {
      // Case 2: We move within an rtl part or in an rtl editor on the same visual line
      var sticky = moveInStorageOrder ? "before" : "after"
      return new Pos(start.line, ch, sticky)
    }
  }

  // Case 3: Could not move within this bidi part in this visual line, so leave
  // the current bidi part

  var searchInVisualLine = function (partPos, dir, wrappedLineExtent) {
    var getRes = function (ch, moveInStorageOrder) { return moveInStorageOrder
      ? new Pos(start.line, mv(ch, 1), "before")
      : new Pos(start.line, ch, "after"); }

    for (; partPos >= 0 && partPos < bidi.length; partPos += dir) {
      var part = bidi[partPos]
      var moveInStorageOrder = (dir > 0) == (part.level != 1)
      var ch = moveInStorageOrder ? wrappedLineExtent.begin : mv(wrappedLineExtent.end, -1)
      if (part.from <= ch && ch < part.to) { return getRes(ch, moveInStorageOrder) }
      ch = moveInStorageOrder ? part.from : mv(part.to, -1)
      if (wrappedLineExtent.begin <= ch && ch < wrappedLineExtent.end) { return getRes(ch, moveInStorageOrder) }
    }
  }

  // Case 3a: Look for other bidi parts on the same visual line
  var res = searchInVisualLine(partPos + dir, dir, wrappedLineExtent)
  if (res) { return res }

  // Case 3b: Look for other bidi parts on the next visual line
  var nextCh = dir > 0 ? wrappedLineExtent.end : mv(wrappedLineExtent.begin, -1)
  if (nextCh != null && !(dir > 0 && nextCh == line.text.length)) {
    res = searchInVisualLine(dir > 0 ? 0 : bidi.length - 1, dir, getWrappedLineExtent(nextCh))
    if (res) { return res }
  }

  // Case 4: Nowhere to move
  return null
}

// Commands are parameter-less actions that can be performed on an
// editor, mostly used for keybindings.
var commands = {
  selectAll: selectAll,
  singleSelection: function (cm) { return cm.setSelection(cm.getCursor("anchor"), cm.getCursor("head"), sel_dontScroll); },
  killLine: function (cm) { return deleteNearSelection(cm, function (range) {
    if (range.empty()) {
      var len = getLine(cm.doc, range.head.line).text.length
      if (range.head.ch == len && range.head.line < cm.lastLine())
        { return {from: range.head, to: Pos(range.head.line + 1, 0)} }
      else
        { return {from: range.head, to: Pos(range.head.line, len)} }
    } else {
      return {from: range.from(), to: range.to()}
    }
  }); },
  deleteLine: function (cm) { return deleteNearSelection(cm, function (range) { return ({
    from: Pos(range.from().line, 0),
    to: clipPos(cm.doc, Pos(range.to().line + 1, 0))
  }); }); },
  delLineLeft: function (cm) { return deleteNearSelection(cm, function (range) { return ({
    from: Pos(range.from().line, 0), to: range.from()
  }); }); },
  delWrappedLineLeft: function (cm) { return deleteNearSelection(cm, function (range) {
    var top = cm.charCoords(range.head, "div").top + 5
    var leftPos = cm.coordsChar({left: 0, top: top}, "div")
    return {from: leftPos, to: range.from()}
  }); },
  delWrappedLineRight: function (cm) { return deleteNearSelection(cm, function (range) {
    var top = cm.charCoords(range.head, "div").top + 5
    var rightPos = cm.coordsChar({left: cm.display.lineDiv.offsetWidth + 100, top: top}, "div")
    return {from: range.from(), to: rightPos }
  }); },
  undo: function (cm) { return cm.undo(); },
  redo: function (cm) { return cm.redo(); },
  undoSelection: function (cm) { return cm.undoSelection(); },
  redoSelection: function (cm) { return cm.redoSelection(); },
  goDocStart: function (cm) { return cm.extendSelection(Pos(cm.firstLine(), 0)); },
  goDocEnd: function (cm) { return cm.extendSelection(Pos(cm.lastLine())); },
  goLineStart: function (cm) { return cm.extendSelectionsBy(function (range) { return lineStart(cm, range.head.line); },
    {origin: "+move", bias: 1}
  ); },
  goLineStartSmart: function (cm) { return cm.extendSelectionsBy(function (range) { return lineStartSmart(cm, range.head); },
    {origin: "+move", bias: 1}
  ); },
  goLineEnd: function (cm) { return cm.extendSelectionsBy(function (range) { return lineEnd(cm, range.head.line); },
    {origin: "+move", bias: -1}
  ); },
  goLineRight: function (cm) { return cm.extendSelectionsBy(function (range) {
    var top = cm.cursorCoords(range.head, "div").top + 5
    return cm.coordsChar({left: cm.display.lineDiv.offsetWidth + 100, top: top}, "div")
  }, sel_move); },
  goLineLeft: function (cm) { return cm.extendSelectionsBy(function (range) {
    var top = cm.cursorCoords(range.head, "div").top + 5
    return cm.coordsChar({left: 0, top: top}, "div")
  }, sel_move); },
  goLineLeftSmart: function (cm) { return cm.extendSelectionsBy(function (range) {
    var top = cm.cursorCoords(range.head, "div").top + 5
    var pos = cm.coordsChar({left: 0, top: top}, "div")
    if (pos.ch < cm.getLine(pos.line).search(/\S/)) { return lineStartSmart(cm, range.head) }
    return pos
  }, sel_move); },
  goLineUp: function (cm) { return cm.moveV(-1, "line"); },
  goLineDown: function (cm) { return cm.moveV(1, "line"); },
  goPageUp: function (cm) { return cm.moveV(-1, "page"); },
  goPageDown: function (cm) { return cm.moveV(1, "page"); },
  goCharLeft: function (cm) { return cm.moveH(-1, "char"); },
  goCharRight: function (cm) { return cm.moveH(1, "char"); },
  goColumnLeft: function (cm) { return cm.moveH(-1, "column"); },
  goColumnRight: function (cm) { return cm.moveH(1, "column"); },
  goWordLeft: function (cm) { return cm.moveH(-1, "word"); },
  goGroupRight: function (cm) { return cm.moveH(1, "group"); },
  goGroupLeft: function (cm) { return cm.moveH(-1, "group"); },
  goWordRight: function (cm) { return cm.moveH(1, "word"); },
  delCharBefore: function (cm) { return cm.deleteH(-1, "char"); },
  delCharAfter: function (cm) { return cm.deleteH(1, "char"); },
  delWordBefore: function (cm) { return cm.deleteH(-1, "word"); },
  delWordAfter: function (cm) { return cm.deleteH(1, "word"); },
  delGroupBefore: function (cm) { return cm.deleteH(-1, "group"); },
  delGroupAfter: function (cm) { return cm.deleteH(1, "group"); },
  indentAuto: function (cm) { return cm.indentSelection("smart"); },
  indentMore: function (cm) { return cm.indentSelection("add"); },
  indentLess: function (cm) { return cm.indentSelection("subtract"); },
  insertTab: function (cm) { return cm.replaceSelection("\t"); },
  insertSoftTab: function (cm) {
    var spaces = [], ranges = cm.listSelections(), tabSize = cm.options.tabSize
    for (var i = 0; i < ranges.length; i++) {
      var pos = ranges[i].from()
      var col = countColumn(cm.getLine(pos.line), pos.ch, tabSize)
      spaces.push(spaceStr(tabSize - col % tabSize))
    }
    cm.replaceSelections(spaces)
  },
  defaultTab: function (cm) {
    if (cm.somethingSelected()) { cm.indentSelection("add") }
    else { cm.execCommand("insertTab") }
  },
  // Swap the two chars left and right of each selection's head.
  // Move cursor behind the two swapped characters afterwards.
  //
  // Doesn't consider line feeds a character.
  // Doesn't scan more than one line above to find a character.
  // Doesn't do anything on an empty line.
  // Doesn't do anything with non-empty selections.
  transposeChars: function (cm) { return runInOp(cm, function () {
    var ranges = cm.listSelections(), newSel = []
    for (var i = 0; i < ranges.length; i++) {
      if (!ranges[i].empty()) { continue }
      var cur = ranges[i].head, line = getLine(cm.doc, cur.line).text
      if (line) {
        if (cur.ch == line.length) { cur = new Pos(cur.line, cur.ch - 1) }
        if (cur.ch > 0) {
          cur = new Pos(cur.line, cur.ch + 1)
          cm.replaceRange(line.charAt(cur.ch - 1) + line.charAt(cur.ch - 2),
                          Pos(cur.line, cur.ch - 2), cur, "+transpose")
        } else if (cur.line > cm.doc.first) {
          var prev = getLine(cm.doc, cur.line - 1).text
          if (prev) {
            cur = new Pos(cur.line, 1)
            cm.replaceRange(line.charAt(0) + cm.doc.lineSeparator() +
                            prev.charAt(prev.length - 1),
                            Pos(cur.line - 1, prev.length - 1), cur, "+transpose")
          }
        }
      }
      newSel.push(new Range(cur, cur))
    }
    cm.setSelections(newSel)
  }); },
  newlineAndIndent: function (cm) { return runInOp(cm, function () {
    var sels = cm.listSelections()
    for (var i = sels.length - 1; i >= 0; i--)
      { cm.replaceRange(cm.doc.lineSeparator(), sels[i].anchor, sels[i].head, "+input") }
    sels = cm.listSelections()
    for (var i$1 = 0; i$1 < sels.length; i$1++)
      { cm.indentLine(sels[i$1].from().line, null, true) }
    ensureCursorVisible(cm)
  }); },
  openLine: function (cm) { return cm.replaceSelection("\n", "start"); },
  toggleOverwrite: function (cm) { return cm.toggleOverwrite(); }
}


function lineStart(cm, lineN) {
  var line = getLine(cm.doc, lineN)
  var visual = visualLine(line)
  if (visual != line) { lineN = lineNo(visual) }
  return endOfLine(true, cm, visual, lineN, 1)
}
function lineEnd(cm, lineN) {
  var line = getLine(cm.doc, lineN)
  var visual = visualLineEnd(line)
  if (visual != line) { lineN = lineNo(visual) }
  return endOfLine(true, cm, line, lineN, -1)
}
function lineStartSmart(cm, pos) {
  var start = lineStart(cm, pos.line)
  var line = getLine(cm.doc, start.line)
  var order = getOrder(line, cm.doc.direction)
  if (!order || order[0].level == 0) {
    var firstNonWS = Math.max(0, line.text.search(/\S/))
    var inWS = pos.line == start.line && pos.ch <= firstNonWS && pos.ch
    return Pos(start.line, inWS ? 0 : firstNonWS, start.sticky)
  }
  return start
}

// Run a handler that was bound to a key.
function doHandleBinding(cm, bound, dropShift) {
  if (typeof bound == "string") {
    bound = commands[bound]
    if (!bound) { return false }
  }
  // Ensure previous input has been read, so that the handler sees a
  // consistent view of the document
  cm.display.input.ensurePolled()
  var prevShift = cm.display.shift, done = false
  try {
    if (cm.isReadOnly()) { cm.state.suppressEdits = true }
    if (dropShift) { cm.display.shift = false }
    done = bound(cm) != Pass
  } finally {
    cm.display.shift = prevShift
    cm.state.suppressEdits = false
  }
  return done
}

function lookupKeyForEditor(cm, name, handle) {
  for (var i = 0; i < cm.state.keyMaps.length; i++) {
    var result = lookupKey(name, cm.state.keyMaps[i], handle, cm)
    if (result) { return result }
  }
  return (cm.options.extraKeys && lookupKey(name, cm.options.extraKeys, handle, cm))
    || lookupKey(name, cm.options.keyMap, handle, cm)
}

// Note that, despite the name, this function is also used to check
// for bound mouse clicks.

var stopSeq = new Delayed

function dispatchKey(cm, name, e, handle) {
  var seq = cm.state.keySeq
  if (seq) {
    if (isModifierKey(name)) { return "handled" }
    if (/\'$/.test(name))
      { cm.state.keySeq = null }
    else
      { stopSeq.set(50, function () {
        if (cm.state.keySeq == seq) {
          cm.state.keySeq = null
          cm.display.input.reset()
        }
      }) }
    if (dispatchKeyInner(cm, seq + " " + name, e, handle)) { return true }
  }
  return dispatchKeyInner(cm, name, e, handle)
}

function dispatchKeyInner(cm, name, e, handle) {
  var result = lookupKeyForEditor(cm, name, handle)

  if (result == "multi")
    { cm.state.keySeq = name }
  if (result == "handled")
    { signalLater(cm, "keyHandled", cm, name, e) }

  if (result == "handled" || result == "multi") {
    e_preventDefault(e)
    restartBlink(cm)
  }

  return !!result
}

// Handle a key from the keydown event.
function handleKeyBinding(cm, e) {
  var name = keyName(e, true)
  if (!name) { return false }

  if (e.shiftKey && !cm.state.keySeq) {
    // First try to resolve full name (including 'Shift-'). Failing
    // that, see if there is a cursor-motion command (starting with
    // 'go') bound to the keyname without 'Shift-'.
    return dispatchKey(cm, "Shift-" + name, e, function (b) { return doHandleBinding(cm, b, true); })
        || dispatchKey(cm, name, e, function (b) {
             if (typeof b == "string" ? /^go[A-Z]/.test(b) : b.motion)
               { return doHandleBinding(cm, b) }
           })
  } else {
    return dispatchKey(cm, name, e, function (b) { return doHandleBinding(cm, b); })
  }
}

// Handle a key from the keypress event
function handleCharBinding(cm, e, ch) {
  return dispatchKey(cm, "'" + ch + "'", e, function (b) { return doHandleBinding(cm, b, true); })
}

var lastStoppedKey = null
function onKeyDown(e) {
  var cm = this
  cm.curOp.focus = activeElt()
  if (signalDOMEvent(cm, e)) { return }
  // IE does strange things with escape.
  if (ie && ie_version < 11 && e.keyCode == 27) { e.returnValue = false }
  var code = e.keyCode
  cm.display.shift = code == 16 || e.shiftKey
  var handled = handleKeyBinding(cm, e)
  if (presto) {
    lastStoppedKey = handled ? code : null
    // Opera has no cut event... we try to at least catch the key combo
    if (!handled && code == 88 && !hasCopyEvent && (mac ? e.metaKey : e.ctrlKey))
      { cm.replaceSelection("", null, "cut") }
  }

  // Turn mouse into crosshair when Alt is held on Mac.
  if (code == 18 && !/\bCodeMirror-crosshair\b/.test(cm.display.lineDiv.className))
    { showCrossHair(cm) }
}

function showCrossHair(cm) {
  var lineDiv = cm.display.lineDiv
  addClass(lineDiv, "CodeMirror-crosshair")

  function up(e) {
    if (e.keyCode == 18 || !e.altKey) {
      rmClass(lineDiv, "CodeMirror-crosshair")
      off(document, "keyup", up)
      off(document, "mouseover", up)
    }
  }
  on(document, "keyup", up)
  on(document, "mouseover", up)
}

function onKeyUp(e) {
  if (e.keyCode == 16) { this.doc.sel.shift = false }
  signalDOMEvent(this, e)
}

function onKeyPress(e) {
  var cm = this
  if (eventInWidget(cm.display, e) || signalDOMEvent(cm, e) || e.ctrlKey && !e.altKey || mac && e.metaKey) { return }
  var keyCode = e.keyCode, charCode = e.charCode
  if (presto && keyCode == lastStoppedKey) {lastStoppedKey = null; e_preventDefault(e); return}
  if ((presto && (!e.which || e.which < 10)) && handleKeyBinding(cm, e)) { return }
  var ch = String.fromCharCode(charCode == null ? keyCode : charCode)
  // Some browsers fire keypress events for backspace
  if (ch == "\x08") { return }
  if (handleCharBinding(cm, e, ch)) { return }
  cm.display.input.onKeyPress(e)
}

var DOUBLECLICK_DELAY = 400

var PastClick = function(time, pos, button) {
  this.time = time
  this.pos = pos
  this.button = button
};

PastClick.prototype.compare = function (time, pos, button) {
  return this.time + DOUBLECLICK_DELAY > time &&
    cmp(pos, this.pos) == 0 && button == this.button
};

var lastClick;
var lastDoubleClick;
function clickRepeat(pos, button) {
  var now = +new Date
  if (lastDoubleClick && lastDoubleClick.compare(now, pos, button)) {
    lastClick = lastDoubleClick = null
    return "triple"
  } else if (lastClick && lastClick.compare(now, pos, button)) {
    lastDoubleClick = new PastClick(now, pos, button)
    lastClick = null
    return "double"
  } else {
    lastClick = new PastClick(now, pos, button)
    lastDoubleClick = null
    return "single"
  }
}

// A mouse down can be a single click, double click, triple click,
// start of selection drag, start of text drag, new cursor
// (ctrl-click), rectangle drag (alt-drag), or xwin
// middle-click-paste. Or it might be a click on something we should
// not interfere with, such as a scrollbar or widget.
function onMouseDown(e) {
  var cm = this, display = cm.display
  if (signalDOMEvent(cm, e) || display.activeTouch && display.input.supportsTouch()) { return }
  display.input.ensurePolled()
  display.shift = e.shiftKey

  if (eventInWidget(display, e)) {
    if (!webkit) {
      // Briefly turn off draggability, to allow widgets to do
      // normal dragging things.
      display.scroller.draggable = false
      setTimeout(function () { return display.scroller.draggable = true; }, 100)
    }
    return
  }
  if (clickInGutter(cm, e)) { return }
  var pos = posFromMouse(cm, e), button = e_button(e), repeat = pos ? clickRepeat(pos, button) : "single"
  window.focus()

  // #3261: make sure, that we're not starting a second selection
  if (button == 1 && cm.state.selectingText)
    { cm.state.selectingText(e) }

  if (pos && handleMappedButton(cm, button, pos, repeat, e)) { return }

  if (button == 1) {
    if (pos) { leftButtonDown(cm, pos, repeat, e) }
    else if (e_target(e) == display.scroller) { e_preventDefault(e) }
  } else if (button == 2) {
    if (pos) { extendSelection(cm.doc, pos) }
    setTimeout(function () { return display.input.focus(); }, 20)
  } else if (button == 3) {
    if (captureRightClick) { onContextMenu(cm, e) }
    else { delayBlurEvent(cm) }
  }
}

function handleMappedButton(cm, button, pos, repeat, event) {
  var name = "Click"
  if (repeat == "double") { name = "Double" + name }
  else if (repeat == "triple") { name = "Triple" + name }
  name = (button == 1 ? "Left" : button == 2 ? "Middle" : "Right") + name

  return dispatchKey(cm,  addModifierNames(name, event), event, function (bound) {
    if (typeof bound == "string") { bound = commands[bound] }
    if (!bound) { return false }
    var done = false
    try {
      if (cm.isReadOnly()) { cm.state.suppressEdits = true }
      done = bound(cm, pos) != Pass
    } finally {
      cm.state.suppressEdits = false
    }
    return done
  })
}

function configureMouse(cm, repeat, event) {
  var option = cm.getOption("configureMouse")
  var value = option ? option(cm, repeat, event) : {}
  if (value.unit == null) {
    var rect = chromeOS ? event.shiftKey && event.metaKey : event.altKey
    value.unit = rect ? "rectangle" : repeat == "single" ? "char" : repeat == "double" ? "word" : "line"
  }
  if (value.extend == null || cm.doc.extend) { value.extend = cm.doc.extend || event.shiftKey }
  if (value.addNew == null) { value.addNew = mac ? event.metaKey : event.ctrlKey }
  if (value.moveOnDrag == null) { value.moveOnDrag = !(mac ? event.altKey : event.ctrlKey) }
  return value
}

function leftButtonDown(cm, pos, repeat, event) {
  if (ie) { setTimeout(bind(ensureFocus, cm), 0) }
  else { cm.curOp.focus = activeElt() }

  var behavior = configureMouse(cm, repeat, event)

  var sel = cm.doc.sel, contained
  if (cm.options.dragDrop && dragAndDrop && !cm.isReadOnly() &&
      repeat == "single" && (contained = sel.contains(pos)) > -1 &&
      (cmp((contained = sel.ranges[contained]).from(), pos) < 0 || pos.xRel > 0) &&
      (cmp(contained.to(), pos) > 0 || pos.xRel < 0))
    { leftButtonStartDrag(cm, event, pos, behavior) }
  else
    { leftButtonSelect(cm, event, pos, behavior) }
}

// Start a text drag. When it ends, see if any dragging actually
// happen, and treat as a click if it didn't.
function leftButtonStartDrag(cm, event, pos, behavior) {
  var display = cm.display, moved = false
  var dragEnd = operation(cm, function (e) {
    if (webkit) { display.scroller.draggable = false }
    cm.state.draggingText = false
    off(display.wrapper.ownerDocument, "mouseup", dragEnd)
    off(display.wrapper.ownerDocument, "mousemove", mouseMove)
    off(display.scroller, "dragstart", dragStart)
    off(display.scroller, "drop", dragEnd)
    if (!moved) {
      e_preventDefault(e)
      if (!behavior.addNew)
        { extendSelection(cm.doc, pos, null, null, behavior.extend) }
      // Work around unexplainable focus problem in IE9 (#2127) and Chrome (#3081)
      if (webkit || ie && ie_version == 9)
        { setTimeout(function () {display.wrapper.ownerDocument.body.focus(); display.input.focus()}, 20) }
      else
        { display.input.focus() }
    }
  })
  var mouseMove = function(e2) {
    moved = moved || Math.abs(event.clientX - e2.clientX) + Math.abs(event.clientY - e2.clientY) >= 10
  }
  var dragStart = function () { return moved = true; }
  // Let the drag handler handle this.
  if (webkit) { display.scroller.draggable = true }
  cm.state.draggingText = dragEnd
  dragEnd.copy = !behavior.moveOnDrag
  // IE's approach to draggable
  if (display.scroller.dragDrop) { display.scroller.dragDrop() }
  on(display.wrapper.ownerDocument, "mouseup", dragEnd)
  on(display.wrapper.ownerDocument, "mousemove", mouseMove)
  on(display.scroller, "dragstart", dragStart)
  on(display.scroller, "drop", dragEnd)

  delayBlurEvent(cm)
  setTimeout(function () { return display.input.focus(); }, 20)
}

function rangeForUnit(cm, pos, unit) {
  if (unit == "char") { return new Range(pos, pos) }
  if (unit == "word") { return cm.findWordAt(pos) }
  if (unit == "line") { return new Range(Pos(pos.line, 0), clipPos(cm.doc, Pos(pos.line + 1, 0))) }
  var result = unit(cm, pos)
  return new Range(result.from, result.to)
}

// Normal selection, as opposed to text dragging.
function leftButtonSelect(cm, event, start, behavior) {
  var display = cm.display, doc = cm.doc
  e_preventDefault(event)

  var ourRange, ourIndex, startSel = doc.sel, ranges = startSel.ranges
  if (behavior.addNew && !behavior.extend) {
    ourIndex = doc.sel.contains(start)
    if (ourIndex > -1)
      { ourRange = ranges[ourIndex] }
    else
      { ourRange = new Range(start, start) }
  } else {
    ourRange = doc.sel.primary()
    ourIndex = doc.sel.primIndex
  }

  if (behavior.unit == "rectangle") {
    if (!behavior.addNew) { ourRange = new Range(start, start) }
    start = posFromMouse(cm, event, true, true)
    ourIndex = -1
  } else {
    var range = rangeForUnit(cm, start, behavior.unit)
    if (behavior.extend)
      { ourRange = extendRange(ourRange, range.anchor, range.head, behavior.extend) }
    else
      { ourRange = range }
  }

  if (!behavior.addNew) {
    ourIndex = 0
    setSelection(doc, new Selection([ourRange], 0), sel_mouse)
    startSel = doc.sel
  } else if (ourIndex == -1) {
    ourIndex = ranges.length
    setSelection(doc, normalizeSelection(ranges.concat([ourRange]), ourIndex),
                 {scroll: false, origin: "*mouse"})
  } else if (ranges.length > 1 && ranges[ourIndex].empty() && behavior.unit == "char" && !behavior.extend) {
    setSelection(doc, normalizeSelection(ranges.slice(0, ourIndex).concat(ranges.slice(ourIndex + 1)), 0),
                 {scroll: false, origin: "*mouse"})
    startSel = doc.sel
  } else {
    replaceOneSelection(doc, ourIndex, ourRange, sel_mouse)
  }

  var lastPos = start
  function extendTo(pos) {
    if (cmp(lastPos, pos) == 0) { return }
    lastPos = pos

    if (behavior.unit == "rectangle") {
      var ranges = [], tabSize = cm.options.tabSize
      var startCol = countColumn(getLine(doc, start.line).text, start.ch, tabSize)
      var posCol = countColumn(getLine(doc, pos.line).text, pos.ch, tabSize)
      var left = Math.min(startCol, posCol), right = Math.max(startCol, posCol)
      for (var line = Math.min(start.line, pos.line), end = Math.min(cm.lastLine(), Math.max(start.line, pos.line));
           line <= end; line++) {
        var text = getLine(doc, line).text, leftPos = findColumn(text, left, tabSize)
        if (left == right)
          { ranges.push(new Range(Pos(line, leftPos), Pos(line, leftPos))) }
        else if (text.length > leftPos)
          { ranges.push(new Range(Pos(line, leftPos), Pos(line, findColumn(text, right, tabSize)))) }
      }
      if (!ranges.length) { ranges.push(new Range(start, start)) }
      setSelection(doc, normalizeSelection(startSel.ranges.slice(0, ourIndex).concat(ranges), ourIndex),
                   {origin: "*mouse", scroll: false})
      cm.scrollIntoView(pos)
    } else {
      var oldRange = ourRange
      var range = rangeForUnit(cm, pos, behavior.unit)
      var anchor = oldRange.anchor, head
      if (cmp(range.anchor, anchor) > 0) {
        head = range.head
        anchor = minPos(oldRange.from(), range.anchor)
      } else {
        head = range.anchor
        anchor = maxPos(oldRange.to(), range.head)
      }
      var ranges$1 = startSel.ranges.slice(0)
      ranges$1[ourIndex] = bidiSimplify(cm, new Range(clipPos(doc, anchor), head))
      setSelection(doc, normalizeSelection(ranges$1, ourIndex), sel_mouse)
    }
  }

  var editorSize = display.wrapper.getBoundingClientRect()
  // Used to ensure timeout re-tries don't fire when another extend
  // happened in the meantime (clearTimeout isn't reliable -- at
  // least on Chrome, the timeouts still happen even when cleared,
  // if the clear happens after their scheduled firing time).
  var counter = 0

  function extend(e) {
    var curCount = ++counter
    var cur = posFromMouse(cm, e, true, behavior.unit == "rectangle")
    if (!cur) { return }
    if (cmp(cur, lastPos) != 0) {
      cm.curOp.focus = activeElt()
      extendTo(cur)
      var visible = visibleLines(display, doc)
      if (cur.line >= visible.to || cur.line < visible.from)
        { setTimeout(operation(cm, function () {if (counter == curCount) { extend(e) }}), 150) }
    } else {
      var outside = e.clientY < editorSize.top ? -20 : e.clientY > editorSize.bottom ? 20 : 0
      if (outside) { setTimeout(operation(cm, function () {
        if (counter != curCount) { return }
        display.scroller.scrollTop += outside
        extend(e)
      }), 50) }
    }
  }

  function done(e) {
    cm.state.selectingText = false
    counter = Infinity
    e_preventDefault(e)
    display.input.focus()
    off(display.wrapper.ownerDocument, "mousemove", move)
    off(display.wrapper.ownerDocument, "mouseup", up)
    doc.history.lastSelOrigin = null
  }

  var move = operation(cm, function (e) {
    if (!e_button(e)) { done(e) }
    else { extend(e) }
  })
  var up = operation(cm, done)
  cm.state.selectingText = up
  on(display.wrapper.ownerDocument, "mousemove", move)
  on(display.wrapper.ownerDocument, "mouseup", up)
}

// Used when mouse-selecting to adjust the anchor to the proper side
// of a bidi jump depending on the visual position of the head.
function bidiSimplify(cm, range) {
  var anchor = range.anchor;
  var head = range.head;
  var anchorLine = getLine(cm.doc, anchor.line)
  if (cmp(anchor, head) == 0 && anchor.sticky == head.sticky) { return range }
  var order = getOrder(anchorLine)
  if (!order) { return range }
  var index = getBidiPartAt(order, anchor.ch, anchor.sticky), part = order[index]
  if (part.from != anchor.ch && part.to != anchor.ch) { return range }
  var boundary = index + ((part.from == anchor.ch) == (part.level != 1) ? 0 : 1)
  if (boundary == 0 || boundary == order.length) { return range }

  // Compute the relative visual position of the head compared to the
  // anchor (<0 is to the left, >0 to the right)
  var leftSide
  if (head.line != anchor.line) {
    leftSide = (head.line - anchor.line) * (cm.doc.direction == "ltr" ? 1 : -1) > 0
  } else {
    var headIndex = getBidiPartAt(order, head.ch, head.sticky)
    var dir = headIndex - index || (head.ch - anchor.ch) * (part.level == 1 ? -1 : 1)
    if (headIndex == boundary - 1 || headIndex == boundary)
      { leftSide = dir < 0 }
    else
      { leftSide = dir > 0 }
  }

  var usePart = order[boundary + (leftSide ? -1 : 0)]
  var from = leftSide == (usePart.level == 1)
  var ch = from ? usePart.from : usePart.to, sticky = from ? "after" : "before"
  return anchor.ch == ch && anchor.sticky == sticky ? range : new Range(new Pos(anchor.line, ch, sticky), head)
}


// Determines whether an event happened in the gutter, and fires the
// handlers for the corresponding event.
function gutterEvent(cm, e, type, prevent) {
  var mX, mY
  if (e.touches) {
    mX = e.touches[0].clientX
    mY = e.touches[0].clientY
  } else {
    try { mX = e.clientX; mY = e.clientY }
    catch(e) { return false }
  }
  if (mX >= Math.floor(cm.display.gutters.getBoundingClientRect().right)) { return false }
  if (prevent) { e_preventDefault(e) }

  var display = cm.display
  var lineBox = display.lineDiv.getBoundingClientRect()

  if (mY > lineBox.bottom || !hasHandler(cm, type)) { return e_defaultPrevented(e) }
  mY -= lineBox.top - display.viewOffset

  for (var i = 0; i < cm.options.gutters.length; ++i) {
    var g = display.gutters.childNodes[i]
    if (g && g.getBoundingClientRect().right >= mX) {
      var line = lineAtHeight(cm.doc, mY)
      var gutter = cm.options.gutters[i]
      signal(cm, type, cm, line, gutter, e)
      return e_defaultPrevented(e)
    }
  }
}

function clickInGutter(cm, e) {
  return gutterEvent(cm, e, "gutterClick", true)
}

// CONTEXT MENU HANDLING

// To make the context menu work, we need to briefly unhide the
// textarea (making it as unobtrusive as possible) to let the
// right-click take effect on it.
function onContextMenu(cm, e) {
  if (eventInWidget(cm.display, e) || contextMenuInGutter(cm, e)) { return }
  if (signalDOMEvent(cm, e, "contextmenu")) { return }
  cm.display.input.onContextMenu(e)
}

function contextMenuInGutter(cm, e) {
  if (!hasHandler(cm, "gutterContextMenu")) { return false }
  return gutterEvent(cm, e, "gutterContextMenu", false)
}

function themeChanged(cm) {
  cm.display.wrapper.className = cm.display.wrapper.className.replace(/\s*cm-s-\S+/g, "") +
    cm.options.theme.replace(/(^|\s)\s*/g, " cm-s-")
  clearCaches(cm)
}

var Init = {toString: function(){return "CodeMirror.Init"}}

var defaults = {}
var optionHandlers = {}

function defineOptions(CodeMirror) {
  var optionHandlers = CodeMirror.optionHandlers

  function option(name, deflt, handle, notOnInit) {
    CodeMirror.defaults[name] = deflt
    if (handle) { optionHandlers[name] =
      notOnInit ? function (cm, val, old) {if (old != Init) { handle(cm, val, old) }} : handle }
  }

  CodeMirror.defineOption = option

  // Passed to option handlers when there is no old value.
  CodeMirror.Init = Init

  // These two are, on init, called from the constructor because they
  // have to be initialized before the editor can start at all.
  option("value", "", function (cm, val) { return cm.setValue(val); }, true)
  option("mode", null, function (cm, val) {
    cm.doc.modeOption = val
    loadMode(cm)
  }, true)

  option("indentUnit", 2, loadMode, true)
  option("indentWithTabs", false)
  option("smartIndent", true)
  option("tabSize", 4, function (cm) {
    resetModeState(cm)
    clearCaches(cm)
    regChange(cm)
  }, true)

  option("lineSeparator", null, function (cm, val) {
    cm.doc.lineSep = val
    if (!val) { return }
    var newBreaks = [], lineNo = cm.doc.first
    cm.doc.iter(function (line) {
      for (var pos = 0;;) {
        var found = line.text.indexOf(val, pos)
        if (found == -1) { break }
        pos = found + val.length
        newBreaks.push(Pos(lineNo, found))
      }
      lineNo++
    })
    for (var i = newBreaks.length - 1; i >= 0; i--)
      { replaceRange(cm.doc, val, newBreaks[i], Pos(newBreaks[i].line, newBreaks[i].ch + val.length)) }
  })
  option("specialChars", /[\u0000-\u001f\u007f-\u009f\u00ad\u061c\u200b-\u200f\u2028\u2029\ufeff]/g, function (cm, val, old) {
    cm.state.specialChars = new RegExp(val.source + (val.test("\t") ? "" : "|\t"), "g")
    if (old != Init) { cm.refresh() }
  })
  option("specialCharPlaceholder", defaultSpecialCharPlaceholder, function (cm) { return cm.refresh(); }, true)
  option("electricChars", true)
  option("inputStyle", mobile ? "contenteditable" : "textarea", function () {
    throw new Error("inputStyle can not (yet) be changed in a running editor") // FIXME
  }, true)
  option("spellcheck", false, function (cm, val) { return cm.getInputField().spellcheck = val; }, true)
  option("rtlMoveVisually", !windows)
  option("wholeLineUpdateBefore", true)

  option("theme", "default", function (cm) {
    themeChanged(cm)
    guttersChanged(cm)
  }, true)
  option("keyMap", "default", function (cm, val, old) {
    var next = getKeyMap(val)
    var prev = old != Init && getKeyMap(old)
    if (prev && prev.detach) { prev.detach(cm, next) }
    if (next.attach) { next.attach(cm, prev || null) }
  })
  option("extraKeys", null)
  option("configureMouse", null)

  option("lineWrapping", false, wrappingChanged, true)
  option("gutters", [], function (cm) {
    setGuttersForLineNumbers(cm.options)
    guttersChanged(cm)
  }, true)
  option("fixedGutter", true, function (cm, val) {
    cm.display.gutters.style.left = val ? compensateForHScroll(cm.display) + "px" : "0"
    cm.refresh()
  }, true)
  option("coverGutterNextToScrollbar", false, function (cm) { return updateScrollbars(cm); }, true)
  option("scrollbarStyle", "native", function (cm) {
    initScrollbars(cm)
    updateScrollbars(cm)
    cm.display.scrollbars.setScrollTop(cm.doc.scrollTop)
    cm.display.scrollbars.setScrollLeft(cm.doc.scrollLeft)
  }, true)
  option("lineNumbers", false, function (cm) {
    setGuttersForLineNumbers(cm.options)
    guttersChanged(cm)
  }, true)
  option("firstLineNumber", 1, guttersChanged, true)
  option("lineNumberFormatter", function (integer) { return integer; }, guttersChanged, true)
  option("showCursorWhenSelecting", false, updateSelection, true)

  option("resetSelectionOnContextMenu", true)
  option("lineWiseCopyCut", true)
  option("pasteLinesPerSelection", true)

  option("readOnly", false, function (cm, val) {
    if (val == "nocursor") {
      onBlur(cm)
      cm.display.input.blur()
    }
    cm.display.input.readOnlyChanged(val)
  })
  option("disableInput", false, function (cm, val) {if (!val) { cm.display.input.reset() }}, true)
  option("dragDrop", true, dragDropChanged)
  option("allowDropFileTypes", null)

  option("cursorBlinkRate", 530)
  option("cursorScrollMargin", 0)
  option("cursorHeight", 1, updateSelection, true)
  option("singleCursorHeightPerLine", true, updateSelection, true)
  option("workTime", 100)
  option("workDelay", 100)
  option("flattenSpans", true, resetModeState, true)
  option("addModeClass", false, resetModeState, true)
  option("pollInterval", 100)
  option("undoDepth", 200, function (cm, val) { return cm.doc.history.undoDepth = val; })
  option("historyEventDelay", 1250)
  option("viewportMargin", 10, function (cm) { return cm.refresh(); }, true)
  option("maxHighlightLength", 10000, resetModeState, true)
  option("moveInputWithCursor", true, function (cm, val) {
    if (!val) { cm.display.input.resetPosition() }
  })

  option("tabindex", null, function (cm, val) { return cm.display.input.getField().tabIndex = val || ""; })
  option("autofocus", null)
  option("direction", "ltr", function (cm, val) { return cm.doc.setDirection(val); }, true)
}

function guttersChanged(cm) {
  updateGutters(cm)
  regChange(cm)
  alignHorizontally(cm)
}

function dragDropChanged(cm, value, old) {
  var wasOn = old && old != Init
  if (!value != !wasOn) {
    var funcs = cm.display.dragFunctions
    var toggle = value ? on : off
    toggle(cm.display.scroller, "dragstart", funcs.start)
    toggle(cm.display.scroller, "dragenter", funcs.enter)
    toggle(cm.display.scroller, "dragover", funcs.over)
    toggle(cm.display.scroller, "dragleave", funcs.leave)
    toggle(cm.display.scroller, "drop", funcs.drop)
  }
}

function wrappingChanged(cm) {
  if (cm.options.lineWrapping) {
    addClass(cm.display.wrapper, "CodeMirror-wrap")
    cm.display.sizer.style.minWidth = ""
    cm.display.sizerWidth = null
  } else {
    rmClass(cm.display.wrapper, "CodeMirror-wrap")
    findMaxLine(cm)
  }
  estimateLineHeights(cm)
  regChange(cm)
  clearCaches(cm)
  setTimeout(function () { return updateScrollbars(cm); }, 100)
}

// A CodeMirror instance represents an editor. This is the object
// that user code is usually dealing with.

function CodeMirror(place, options) {
  var this$1 = this;

  if (!(this instanceof CodeMirror)) { return new CodeMirror(place, options) }

  this.options = options = options ? copyObj(options) : {}
  // Determine effective options based on given values and defaults.
  copyObj(defaults, options, false)
  setGuttersForLineNumbers(options)

  var doc = options.value
  if (typeof doc == "string") { doc = new Doc(doc, options.mode, null, options.lineSeparator, options.direction) }
  this.doc = doc

  var input = new CodeMirror.inputStyles[options.inputStyle](this)
  var display = this.display = new Display(place, doc, input)
  display.wrapper.CodeMirror = this
  updateGutters(this)
  themeChanged(this)
  if (options.lineWrapping)
    { this.display.wrapper.className += " CodeMirror-wrap" }
  initScrollbars(this)

  this.state = {
    keyMaps: [],  // stores maps added by addKeyMap
    overlays: [], // highlighting overlays, as added by addOverlay
    modeGen: 0,   // bumped when mode/overlay changes, used to invalidate highlighting info
    overwrite: false,
    delayingBlurEvent: false,
    focused: false,
    suppressEdits: false, // used to disable editing during key handlers when in readOnly mode
    pasteIncoming: false, cutIncoming: false, // help recognize paste/cut edits in input.poll
    selectingText: false,
    draggingText: false,
    highlight: new Delayed(), // stores highlight worker timeout
    keySeq: null,  // Unfinished key sequence
    specialChars: null
  }

  if (options.autofocus && !mobile) { display.input.focus() }

  // Override magic textarea content restore that IE sometimes does
  // on our hidden textarea on reload
  if (ie && ie_version < 11) { setTimeout(function () { return this$1.display.input.reset(true); }, 20) }

  registerEventHandlers(this)
  ensureGlobalHandlers()

  startOperation(this)
  this.curOp.forceUpdate = true
  attachDoc(this, doc)

  if ((options.autofocus && !mobile) || this.hasFocus())
    { setTimeout(bind(onFocus, this), 20) }
  else
    { onBlur(this) }

  for (var opt in optionHandlers) { if (optionHandlers.hasOwnProperty(opt))
    { optionHandlers[opt](this$1, options[opt], Init) } }
  maybeUpdateLineNumberWidth(this)
  if (options.finishInit) { options.finishInit(this) }
  for (var i = 0; i < initHooks.length; ++i) { initHooks[i](this$1) }
  endOperation(this)
  // Suppress optimizelegibility in Webkit, since it breaks text
  // measuring on line wrapping boundaries.
  if (webkit && options.lineWrapping &&
      getComputedStyle(display.lineDiv).textRendering == "optimizelegibility")
    { display.lineDiv.style.textRendering = "auto" }
}

// The default configuration options.
CodeMirror.defaults = defaults
// Functions to run when options are changed.
CodeMirror.optionHandlers = optionHandlers

// Attach the necessary event handlers when initializing the editor
function registerEventHandlers(cm) {
  var d = cm.display
  on(d.scroller, "mousedown", operation(cm, onMouseDown))
  // Older IE's will not fire a second mousedown for a double click
  if (ie && ie_version < 11)
    { on(d.scroller, "dblclick", operation(cm, function (e) {
      if (signalDOMEvent(cm, e)) { return }
      var pos = posFromMouse(cm, e)
      if (!pos || clickInGutter(cm, e) || eventInWidget(cm.display, e)) { return }
      e_preventDefault(e)
      var word = cm.findWordAt(pos)
      extendSelection(cm.doc, word.anchor, word.head)
    })) }
  else
    { on(d.scroller, "dblclick", function (e) { return signalDOMEvent(cm, e) || e_preventDefault(e); }) }
  // Some browsers fire contextmenu *after* opening the menu, at
  // which point we can't mess with it anymore. Context menu is
  // handled in onMouseDown for these browsers.
  if (!captureRightClick) { on(d.scroller, "contextmenu", function (e) { return onContextMenu(cm, e); }) }

  // Used to suppress mouse event handling when a touch happens
  var touchFinished, prevTouch = {end: 0}
  function finishTouch() {
    if (d.activeTouch) {
      touchFinished = setTimeout(function () { return d.activeTouch = null; }, 1000)
      prevTouch = d.activeTouch
      prevTouch.end = +new Date
    }
  }
  function isMouseLikeTouchEvent(e) {
    if (e.touches.length != 1) { return false }
    var touch = e.touches[0]
    return touch.radiusX <= 1 && touch.radiusY <= 1
  }
  function farAway(touch, other) {
    if (other.left == null) { return true }
    var dx = other.left - touch.left, dy = other.top - touch.top
    return dx * dx + dy * dy > 20 * 20
  }
  on(d.scroller, "touchstart", function (e) {
    if (!signalDOMEvent(cm, e) && !isMouseLikeTouchEvent(e) && !clickInGutter(cm, e)) {
      d.input.ensurePolled()
      clearTimeout(touchFinished)
      var now = +new Date
      d.activeTouch = {start: now, moved: false,
                       prev: now - prevTouch.end <= 300 ? prevTouch : null}
      if (e.touches.length == 1) {
        d.activeTouch.left = e.touches[0].pageX
        d.activeTouch.top = e.touches[0].pageY
      }
    }
  })
  on(d.scroller, "touchmove", function () {
    if (d.activeTouch) { d.activeTouch.moved = true }
  })
  on(d.scroller, "touchend", function (e) {
    var touch = d.activeTouch
    if (touch && !eventInWidget(d, e) && touch.left != null &&
        !touch.moved && new Date - touch.start < 300) {
      var pos = cm.coordsChar(d.activeTouch, "page"), range
      if (!touch.prev || farAway(touch, touch.prev)) // Single tap
        { range = new Range(pos, pos) }
      else if (!touch.prev.prev || farAway(touch, touch.prev.prev)) // Double tap
        { range = cm.findWordAt(pos) }
      else // Triple tap
        { range = new Range(Pos(pos.line, 0), clipPos(cm.doc, Pos(pos.line + 1, 0))) }
      cm.setSelection(range.anchor, range.head)
      cm.focus()
      e_preventDefault(e)
    }
    finishTouch()
  })
  on(d.scroller, "touchcancel", finishTouch)

  // Sync scrolling between fake scrollbars and real scrollable
  // area, ensure viewport is updated when scrolling.
  on(d.scroller, "scroll", function () {
    if (d.scroller.clientHeight) {
      updateScrollTop(cm, d.scroller.scrollTop)
      setScrollLeft(cm, d.scroller.scrollLeft, true)
      signal(cm, "scroll", cm)
    }
  })

  // Listen to wheel events in order to try and update the viewport on time.
  on(d.scroller, "mousewheel", function (e) { return onScrollWheel(cm, e); })
  on(d.scroller, "DOMMouseScroll", function (e) { return onScrollWheel(cm, e); })

  // Prevent wrapper from ever scrolling
  on(d.wrapper, "scroll", function () { return d.wrapper.scrollTop = d.wrapper.scrollLeft = 0; })

  d.dragFunctions = {
    enter: function (e) {if (!signalDOMEvent(cm, e)) { e_stop(e) }},
    over: function (e) {if (!signalDOMEvent(cm, e)) { onDragOver(cm, e); e_stop(e) }},
    start: function (e) { return onDragStart(cm, e); },
    drop: operation(cm, onDrop),
    leave: function (e) {if (!signalDOMEvent(cm, e)) { clearDragCursor(cm) }}
  }

  var inp = d.input.getField()
  on(inp, "keyup", function (e) { return onKeyUp.call(cm, e); })
  on(inp, "keydown", operation(cm, onKeyDown))
  on(inp, "keypress", operation(cm, onKeyPress))
  on(inp, "focus", function (e) { return onFocus(cm, e); })
  on(inp, "blur", function (e) { return onBlur(cm, e); })
}

var initHooks = []
CodeMirror.defineInitHook = function (f) { return initHooks.push(f); }

// Indent the given line. The how parameter can be "smart",
// "add"/null, "subtract", or "prev". When aggressive is false
// (typically set to true for forced single-line indents), empty
// lines are not indented, and places where the mode returns Pass
// are left alone.
function indentLine(cm, n, how, aggressive) {
  var doc = cm.doc, state
  if (how == null) { how = "add" }
  if (how == "smart") {
    // Fall back to "prev" when the mode doesn't have an indentation
    // method.
    if (!doc.mode.indent) { how = "prev" }
    else { state = getContextBefore(cm, n).state }
  }

  var tabSize = cm.options.tabSize
  var line = getLine(doc, n), curSpace = countColumn(line.text, null, tabSize)
  if (line.stateAfter) { line.stateAfter = null }
  var curSpaceString = line.text.match(/^\s*/)[0], indentation
  if (!aggressive && !/\S/.test(line.text)) {
    indentation = 0
    how = "not"
  } else if (how == "smart") {
    indentation = doc.mode.indent(state, line.text.slice(curSpaceString.length), line.text)
    if (indentation == Pass || indentation > 150) {
      if (!aggressive) { return }
      how = "prev"
    }
  }
  if (how == "prev") {
    if (n > doc.first) { indentation = countColumn(getLine(doc, n-1).text, null, tabSize) }
    else { indentation = 0 }
  } else if (how == "add") {
    indentation = curSpace + cm.options.indentUnit
  } else if (how == "subtract") {
    indentation = curSpace - cm.options.indentUnit
  } else if (typeof how == "number") {
    indentation = curSpace + how
  }
  indentation = Math.max(0, indentation)

  var indentString = "", pos = 0
  if (cm.options.indentWithTabs)
    { for (var i = Math.floor(indentation / tabSize); i; --i) {pos += tabSize; indentString += "\t"} }
  if (pos < indentation) { indentString += spaceStr(indentation - pos) }

  if (indentString != curSpaceString) {
    replaceRange(doc, indentString, Pos(n, 0), Pos(n, curSpaceString.length), "+input")
    line.stateAfter = null
    return true
  } else {
    // Ensure that, if the cursor was in the whitespace at the start
    // of the line, it is moved to the end of that space.
    for (var i$1 = 0; i$1 < doc.sel.ranges.length; i$1++) {
      var range = doc.sel.ranges[i$1]
      if (range.head.line == n && range.head.ch < curSpaceString.length) {
        var pos$1 = Pos(n, curSpaceString.length)
        replaceOneSelection(doc, i$1, new Range(pos$1, pos$1))
        break
      }
    }
  }
}

// This will be set to a {lineWise: bool, text: [string]} object, so
// that, when pasting, we know what kind of selections the copied
// text was made out of.
var lastCopied = null

function setLastCopied(newLastCopied) {
  lastCopied = newLastCopied
}

function applyTextInput(cm, inserted, deleted, sel, origin) {
  var doc = cm.doc
  cm.display.shift = false
  if (!sel) { sel = doc.sel }

  var paste = cm.state.pasteIncoming || origin == "paste"
  var textLines = splitLinesAuto(inserted), multiPaste = null
  // When pasting N lines into N selections, insert one line per selection
  if (paste && sel.ranges.length > 1) {
    if (lastCopied && lastCopied.text.join("\n") == inserted) {
      if (sel.ranges.length % lastCopied.text.length == 0) {
        multiPaste = []
        for (var i = 0; i < lastCopied.text.length; i++)
          { multiPaste.push(doc.splitLines(lastCopied.text[i])) }
      }
    } else if (textLines.length == sel.ranges.length && cm.options.pasteLinesPerSelection) {
      multiPaste = map(textLines, function (l) { return [l]; })
    }
  }

  var updateInput
  // Normal behavior is to insert the new text into every selection
  for (var i$1 = sel.ranges.length - 1; i$1 >= 0; i$1--) {
    var range = sel.ranges[i$1]
    var from = range.from(), to = range.to()
    if (range.empty()) {
      if (deleted && deleted > 0) // Handle deletion
        { from = Pos(from.line, from.ch - deleted) }
      else if (cm.state.overwrite && !paste) // Handle overwrite
        { to = Pos(to.line, Math.min(getLine(doc, to.line).text.length, to.ch + lst(textLines).length)) }
      else if (lastCopied && lastCopied.lineWise && lastCopied.text.join("\n") == inserted)
        { from = to = Pos(from.line, 0) }
    }
    updateInput = cm.curOp.updateInput
    var changeEvent = {from: from, to: to, text: multiPaste ? multiPaste[i$1 % multiPaste.length] : textLines,
                       origin: origin || (paste ? "paste" : cm.state.cutIncoming ? "cut" : "+input")}
    makeChange(cm.doc, changeEvent)
    signalLater(cm, "inputRead", cm, changeEvent)
  }
  if (inserted && !paste)
    { triggerElectric(cm, inserted) }

  ensureCursorVisible(cm)
  cm.curOp.updateInput = updateInput
  cm.curOp.typing = true
  cm.state.pasteIncoming = cm.state.cutIncoming = false
}

function handlePaste(e, cm) {
  var pasted = e.clipboardData && e.clipboardData.getData("Text")
  if (pasted) {
    e.preventDefault()
    if (!cm.isReadOnly() && !cm.options.disableInput)
      { runInOp(cm, function () { return applyTextInput(cm, pasted, 0, null, "paste"); }) }
    return true
  }
}

function triggerElectric(cm, inserted) {
  // When an 'electric' character is inserted, immediately trigger a reindent
  if (!cm.options.electricChars || !cm.options.smartIndent) { return }
  var sel = cm.doc.sel

  for (var i = sel.ranges.length - 1; i >= 0; i--) {
    var range = sel.ranges[i]
    if (range.head.ch > 100 || (i && sel.ranges[i - 1].head.line == range.head.line)) { continue }
    var mode = cm.getModeAt(range.head)
    var indented = false
    if (mode.electricChars) {
      for (var j = 0; j < mode.electricChars.length; j++)
        { if (inserted.indexOf(mode.electricChars.charAt(j)) > -1) {
          indented = indentLine(cm, range.head.line, "smart")
          break
        } }
    } else if (mode.electricInput) {
      if (mode.electricInput.test(getLine(cm.doc, range.head.line).text.slice(0, range.head.ch)))
        { indented = indentLine(cm, range.head.line, "smart") }
    }
    if (indented) { signalLater(cm, "electricInput", cm, range.head.line) }
  }
}

function copyableRanges(cm) {
  var text = [], ranges = []
  for (var i = 0; i < cm.doc.sel.ranges.length; i++) {
    var line = cm.doc.sel.ranges[i].head.line
    var lineRange = {anchor: Pos(line, 0), head: Pos(line + 1, 0)}
    ranges.push(lineRange)
    text.push(cm.getRange(lineRange.anchor, lineRange.head))
  }
  return {text: text, ranges: ranges}
}

function disableBrowserMagic(field, spellcheck) {
  field.setAttribute("autocorrect", "off")
  field.setAttribute("autocapitalize", "off")
  field.setAttribute("spellcheck", !!spellcheck)
}

function hiddenTextarea() {
  var te = elt("textarea", null, null, "position: absolute; bottom: -1em; padding: 0; width: 1px; height: 1em; outline: none")
  var div = elt("div", [te], null, "overflow: hidden; position: relative; width: 3px; height: 0px;")
  // The textarea is kept positioned near the cursor to prevent the
  // fact that it'll be scrolled into view on input from scrolling
  // our fake cursor out of view. On webkit, when wrap=off, paste is
  // very slow. So make the area wide instead.
  if (webkit) { te.style.width = "1000px" }
  else { te.setAttribute("wrap", "off") }
  // If border: 0; -- iOS fails to open keyboard (issue #1287)
  if (ios) { te.style.border = "1px solid black" }
  disableBrowserMagic(te)
  return div
}

// The publicly visible API. Note that methodOp(f) means
// 'wrap f in an operation, performed on its `this` parameter'.

// This is not the complete set of editor methods. Most of the
// methods defined on the Doc type are also injected into
// CodeMirror.prototype, for backwards compatibility and
// convenience.

function addEditorMethods(CodeMirror) {
  var optionHandlers = CodeMirror.optionHandlers

  var helpers = CodeMirror.helpers = {}

  CodeMirror.prototype = {
    constructor: CodeMirror,
    focus: function(){window.focus(); this.display.input.focus()},

    setOption: function(option, value) {
      var options = this.options, old = options[option]
      if (options[option] == value && option != "mode") { return }
      options[option] = value
      if (optionHandlers.hasOwnProperty(option))
        { operation(this, optionHandlers[option])(this, value, old) }
      signal(this, "optionChange", this, option)
    },

    getOption: function(option) {return this.options[option]},
    getDoc: function() {return this.doc},

    addKeyMap: function(map, bottom) {
      this.state.keyMaps[bottom ? "push" : "unshift"](getKeyMap(map))
    },
    removeKeyMap: function(map) {
      var maps = this.state.keyMaps
      for (var i = 0; i < maps.length; ++i)
        { if (maps[i] == map || maps[i].name == map) {
          maps.splice(i, 1)
          return true
        } }
    },

    addOverlay: methodOp(function(spec, options) {
      var mode = spec.token ? spec : CodeMirror.getMode(this.options, spec)
      if (mode.startState) { throw new Error("Overlays may not be stateful.") }
      insertSorted(this.state.overlays,
                   {mode: mode, modeSpec: spec, opaque: options && options.opaque,
                    priority: (options && options.priority) || 0},
                   function (overlay) { return overlay.priority; })
      this.state.modeGen++
      regChange(this)
    }),
    removeOverlay: methodOp(function(spec) {
      var this$1 = this;

      var overlays = this.state.overlays
      for (var i = 0; i < overlays.length; ++i) {
        var cur = overlays[i].modeSpec
        if (cur == spec || typeof spec == "string" && cur.name == spec) {
          overlays.splice(i, 1)
          this$1.state.modeGen++
          regChange(this$1)
          return
        }
      }
    }),

    indentLine: methodOp(function(n, dir, aggressive) {
      if (typeof dir != "string" && typeof dir != "number") {
        if (dir == null) { dir = this.options.smartIndent ? "smart" : "prev" }
        else { dir = dir ? "add" : "subtract" }
      }
      if (isLine(this.doc, n)) { indentLine(this, n, dir, aggressive) }
    }),
    indentSelection: methodOp(function(how) {
      var this$1 = this;

      var ranges = this.doc.sel.ranges, end = -1
      for (var i = 0; i < ranges.length; i++) {
        var range = ranges[i]
        if (!range.empty()) {
          var from = range.from(), to = range.to()
          var start = Math.max(end, from.line)
          end = Math.min(this$1.lastLine(), to.line - (to.ch ? 0 : 1)) + 1
          for (var j = start; j < end; ++j)
            { indentLine(this$1, j, how) }
          var newRanges = this$1.doc.sel.ranges
          if (from.ch == 0 && ranges.length == newRanges.length && newRanges[i].from().ch > 0)
            { replaceOneSelection(this$1.doc, i, new Range(from, newRanges[i].to()), sel_dontScroll) }
        } else if (range.head.line > end) {
          indentLine(this$1, range.head.line, how, true)
          end = range.head.line
          if (i == this$1.doc.sel.primIndex) { ensureCursorVisible(this$1) }
        }
      }
    }),

    // Fetch the parser token for a given character. Useful for hacks
    // that want to inspect the mode state (say, for completion).
    getTokenAt: function(pos, precise) {
      return takeToken(this, pos, precise)
    },

    getLineTokens: function(line, precise) {
      return takeToken(this, Pos(line), precise, true)
    },

    getTokenTypeAt: function(pos) {
      pos = clipPos(this.doc, pos)
      var styles = getLineStyles(this, getLine(this.doc, pos.line))
      var before = 0, after = (styles.length - 1) / 2, ch = pos.ch
      var type
      if (ch == 0) { type = styles[2] }
      else { for (;;) {
        var mid = (before + after) >> 1
        if ((mid ? styles[mid * 2 - 1] : 0) >= ch) { after = mid }
        else if (styles[mid * 2 + 1] < ch) { before = mid + 1 }
        else { type = styles[mid * 2 + 2]; break }
      } }
      var cut = type ? type.indexOf("overlay ") : -1
      return cut < 0 ? type : cut == 0 ? null : type.slice(0, cut - 1)
    },

    getModeAt: function(pos) {
      var mode = this.doc.mode
      if (!mode.innerMode) { return mode }
      return CodeMirror.innerMode(mode, this.getTokenAt(pos).state).mode
    },

    getHelper: function(pos, type) {
      return this.getHelpers(pos, type)[0]
    },

    getHelpers: function(pos, type) {
      var this$1 = this;

      var found = []
      if (!helpers.hasOwnProperty(type)) { return found }
      var help = helpers[type], mode = this.getModeAt(pos)
      if (typeof mode[type] == "string") {
        if (help[mode[type]]) { found.push(help[mode[type]]) }
      } else if (mode[type]) {
        for (var i = 0; i < mode[type].length; i++) {
          var val = help[mode[type][i]]
          if (val) { found.push(val) }
        }
      } else if (mode.helperType && help[mode.helperType]) {
        found.push(help[mode.helperType])
      } else if (help[mode.name]) {
        found.push(help[mode.name])
      }
      for (var i$1 = 0; i$1 < help._global.length; i$1++) {
        var cur = help._global[i$1]
        if (cur.pred(mode, this$1) && indexOf(found, cur.val) == -1)
          { found.push(cur.val) }
      }
      return found
    },

    getStateAfter: function(line, precise) {
      var doc = this.doc
      line = clipLine(doc, line == null ? doc.first + doc.size - 1: line)
      return getContextBefore(this, line + 1, precise).state
    },

    cursorCoords: function(start, mode) {
      var pos, range = this.doc.sel.primary()
      if (start == null) { pos = range.head }
      else if (typeof start == "object") { pos = clipPos(this.doc, start) }
      else { pos = start ? range.from() : range.to() }
      return cursorCoords(this, pos, mode || "page")
    },

    charCoords: function(pos, mode) {
      return charCoords(this, clipPos(this.doc, pos), mode || "page")
    },

    coordsChar: function(coords, mode) {
      coords = fromCoordSystem(this, coords, mode || "page")
      return coordsChar(this, coords.left, coords.top)
    },

    lineAtHeight: function(height, mode) {
      height = fromCoordSystem(this, {top: height, left: 0}, mode || "page").top
      return lineAtHeight(this.doc, height + this.display.viewOffset)
    },
    heightAtLine: function(line, mode, includeWidgets) {
      var end = false, lineObj
      if (typeof line == "number") {
        var last = this.doc.first + this.doc.size - 1
        if (line < this.doc.first) { line = this.doc.first }
        else if (line > last) { line = last; end = true }
        lineObj = getLine(this.doc, line)
      } else {
        lineObj = line
      }
      return intoCoordSystem(this, lineObj, {top: 0, left: 0}, mode || "page", includeWidgets || end).top +
        (end ? this.doc.height - heightAtLine(lineObj) : 0)
    },

    defaultTextHeight: function() { return textHeight(this.display) },
    defaultCharWidth: function() { return charWidth(this.display) },

    getViewport: function() { return {from: this.display.viewFrom, to: this.display.viewTo}},

    addWidget: function(pos, node, scroll, vert, horiz) {
      var display = this.display
      pos = cursorCoords(this, clipPos(this.doc, pos))
      var top = pos.bottom, left = pos.left
      node.style.position = "absolute"
      node.setAttribute("cm-ignore-events", "true")
      this.display.input.setUneditable(node)
      display.sizer.appendChild(node)
      if (vert == "over") {
        top = pos.top
      } else if (vert == "above" || vert == "near") {
        var vspace = Math.max(display.wrapper.clientHeight, this.doc.height),
        hspace = Math.max(display.sizer.clientWidth, display.lineSpace.clientWidth)
        // Default to positioning above (if specified and possible); otherwise default to positioning below
        if ((vert == 'above' || pos.bottom + node.offsetHeight > vspace) && pos.top > node.offsetHeight)
          { top = pos.top - node.offsetHeight }
        else if (pos.bottom + node.offsetHeight <= vspace)
          { top = pos.bottom }
        if (left + node.offsetWidth > hspace)
          { left = hspace - node.offsetWidth }
      }
      node.style.top = top + "px"
      node.style.left = node.style.right = ""
      if (horiz == "right") {
        left = display.sizer.clientWidth - node.offsetWidth
        node.style.right = "0px"
      } else {
        if (horiz == "left") { left = 0 }
        else if (horiz == "middle") { left = (display.sizer.clientWidth - node.offsetWidth) / 2 }
        node.style.left = left + "px"
      }
      if (scroll)
        { scrollIntoView(this, {left: left, top: top, right: left + node.offsetWidth, bottom: top + node.offsetHeight}) }
    },

    triggerOnKeyDown: methodOp(onKeyDown),
    triggerOnKeyPress: methodOp(onKeyPress),
    triggerOnKeyUp: onKeyUp,
    triggerOnMouseDown: methodOp(onMouseDown),

    execCommand: function(cmd) {
      if (commands.hasOwnProperty(cmd))
        { return commands[cmd].call(null, this) }
    },

    triggerElectric: methodOp(function(text) { triggerElectric(this, text) }),

    findPosH: function(from, amount, unit, visually) {
      var this$1 = this;

      var dir = 1
      if (amount < 0) { dir = -1; amount = -amount }
      var cur = clipPos(this.doc, from)
      for (var i = 0; i < amount; ++i) {
        cur = findPosH(this$1.doc, cur, dir, unit, visually)
        if (cur.hitSide) { break }
      }
      return cur
    },

    moveH: methodOp(function(dir, unit) {
      var this$1 = this;

      this.extendSelectionsBy(function (range) {
        if (this$1.display.shift || this$1.doc.extend || range.empty())
          { return findPosH(this$1.doc, range.head, dir, unit, this$1.options.rtlMoveVisually) }
        else
          { return dir < 0 ? range.from() : range.to() }
      }, sel_move)
    }),

    deleteH: methodOp(function(dir, unit) {
      var sel = this.doc.sel, doc = this.doc
      if (sel.somethingSelected())
        { doc.replaceSelection("", null, "+delete") }
      else
        { deleteNearSelection(this, function (range) {
          var other = findPosH(doc, range.head, dir, unit, false)
          return dir < 0 ? {from: other, to: range.head} : {from: range.head, to: other}
        }) }
    }),

    findPosV: function(from, amount, unit, goalColumn) {
      var this$1 = this;

      var dir = 1, x = goalColumn
      if (amount < 0) { dir = -1; amount = -amount }
      var cur = clipPos(this.doc, from)
      for (var i = 0; i < amount; ++i) {
        var coords = cursorCoords(this$1, cur, "div")
        if (x == null) { x = coords.left }
        else { coords.left = x }
        cur = findPosV(this$1, coords, dir, unit)
        if (cur.hitSide) { break }
      }
      return cur
    },

    moveV: methodOp(function(dir, unit) {
      var this$1 = this;

      var doc = this.doc, goals = []
      var collapse = !this.display.shift && !doc.extend && doc.sel.somethingSelected()
      doc.extendSelectionsBy(function (range) {
        if (collapse)
          { return dir < 0 ? range.from() : range.to() }
        var headPos = cursorCoords(this$1, range.head, "div")
        if (range.goalColumn != null) { headPos.left = range.goalColumn }
        goals.push(headPos.left)
        var pos = findPosV(this$1, headPos, dir, unit)
        if (unit == "page" && range == doc.sel.primary())
          { addToScrollTop(this$1, charCoords(this$1, pos, "div").top - headPos.top) }
        return pos
      }, sel_move)
      if (goals.length) { for (var i = 0; i < doc.sel.ranges.length; i++)
        { doc.sel.ranges[i].goalColumn = goals[i] } }
    }),

    // Find the word at the given position (as returned by coordsChar).
    findWordAt: function(pos) {
      var doc = this.doc, line = getLine(doc, pos.line).text
      var start = pos.ch, end = pos.ch
      if (line) {
        var helper = this.getHelper(pos, "wordChars")
        if ((pos.sticky == "before" || end == line.length) && start) { --start; } else { ++end }
        var startChar = line.charAt(start)
        var check = isWordChar(startChar, helper)
          ? function (ch) { return isWordChar(ch, helper); }
          : /\s/.test(startChar) ? function (ch) { return /\s/.test(ch); }
          : function (ch) { return (!/\s/.test(ch) && !isWordChar(ch)); }
        while (start > 0 && check(line.charAt(start - 1))) { --start }
        while (end < line.length && check(line.charAt(end))) { ++end }
      }
      return new Range(Pos(pos.line, start), Pos(pos.line, end))
    },

    toggleOverwrite: function(value) {
      if (value != null && value == this.state.overwrite) { return }
      if (this.state.overwrite = !this.state.overwrite)
        { addClass(this.display.cursorDiv, "CodeMirror-overwrite") }
      else
        { rmClass(this.display.cursorDiv, "CodeMirror-overwrite") }

      signal(this, "overwriteToggle", this, this.state.overwrite)
    },
    hasFocus: function() { return this.display.input.getField() == activeElt() },
    isReadOnly: function() { return !!(this.options.readOnly || this.doc.cantEdit) },

    scrollTo: methodOp(function (x, y) { scrollToCoords(this, x, y) }),
    getScrollInfo: function() {
      var scroller = this.display.scroller
      return {left: scroller.scrollLeft, top: scroller.scrollTop,
              height: scroller.scrollHeight - scrollGap(this) - this.display.barHeight,
              width: scroller.scrollWidth - scrollGap(this) - this.display.barWidth,
              clientHeight: displayHeight(this), clientWidth: displayWidth(this)}
    },

    scrollIntoView: methodOp(function(range, margin) {
      if (range == null) {
        range = {from: this.doc.sel.primary().head, to: null}
        if (margin == null) { margin = this.options.cursorScrollMargin }
      } else if (typeof range == "number") {
        range = {from: Pos(range, 0), to: null}
      } else if (range.from == null) {
        range = {from: range, to: null}
      }
      if (!range.to) { range.to = range.from }
      range.margin = margin || 0

      if (range.from.line != null) {
        scrollToRange(this, range)
      } else {
        scrollToCoordsRange(this, range.from, range.to, range.margin)
      }
    }),

    setSize: methodOp(function(width, height) {
      var this$1 = this;

      var interpret = function (val) { return typeof val == "number" || /^\d+$/.test(String(val)) ? val + "px" : val; }
      if (width != null) { this.display.wrapper.style.width = interpret(width) }
      if (height != null) { this.display.wrapper.style.height = interpret(height) }
      if (this.options.lineWrapping) { clearLineMeasurementCache(this) }
      var lineNo = this.display.viewFrom
      this.doc.iter(lineNo, this.display.viewTo, function (line) {
        if (line.widgets) { for (var i = 0; i < line.widgets.length; i++)
          { if (line.widgets[i].noHScroll) { regLineChange(this$1, lineNo, "widget"); break } } }
        ++lineNo
      })
      this.curOp.forceUpdate = true
      signal(this, "refresh", this)
    }),

    operation: function(f){return runInOp(this, f)},
    startOperation: function(){return startOperation(this)},
    endOperation: function(){return endOperation(this)},

    refresh: methodOp(function() {
      var oldHeight = this.display.cachedTextHeight
      regChange(this)
      this.curOp.forceUpdate = true
      clearCaches(this)
      scrollToCoords(this, this.doc.scrollLeft, this.doc.scrollTop)
      updateGutterSpace(this)
      if (oldHeight == null || Math.abs(oldHeight - textHeight(this.display)) > .5)
        { estimateLineHeights(this) }
      signal(this, "refresh", this)
    }),

    swapDoc: methodOp(function(doc) {
      var old = this.doc
      old.cm = null
      attachDoc(this, doc)
      clearCaches(this)
      this.display.input.reset()
      scrollToCoords(this, doc.scrollLeft, doc.scrollTop)
      this.curOp.forceScroll = true
      signalLater(this, "swapDoc", this, old)
      return old
    }),

    getInputField: function(){return this.display.input.getField()},
    getWrapperElement: function(){return this.display.wrapper},
    getScrollerElement: function(){return this.display.scroller},
    getGutterElement: function(){return this.display.gutters}
  }
  eventMixin(CodeMirror)

  CodeMirror.registerHelper = function(type, name, value) {
    if (!helpers.hasOwnProperty(type)) { helpers[type] = CodeMirror[type] = {_global: []} }
    helpers[type][name] = value
  }
  CodeMirror.registerGlobalHelper = function(type, name, predicate, value) {
    CodeMirror.registerHelper(type, name, value)
    helpers[type]._global.push({pred: predicate, val: value})
  }
}

// Used for horizontal relative motion. Dir is -1 or 1 (left or
// right), unit can be "char", "column" (like char, but doesn't
// cross line boundaries), "word" (across next word), or "group" (to
// the start of next group of word or non-word-non-whitespace
// chars). The visually param controls whether, in right-to-left
// text, direction 1 means to move towards the next index in the
// string, or towards the character to the right of the current
// position. The resulting position will have a hitSide=true
// property if it reached the end of the document.
function findPosH(doc, pos, dir, unit, visually) {
  var oldPos = pos
  var origDir = dir
  var lineObj = getLine(doc, pos.line)
  function findNextLine() {
    var l = pos.line + dir
    if (l < doc.first || l >= doc.first + doc.size) { return false }
    pos = new Pos(l, pos.ch, pos.sticky)
    return lineObj = getLine(doc, l)
  }
  function moveOnce(boundToLine) {
    var next
    if (visually) {
      next = moveVisually(doc.cm, lineObj, pos, dir)
    } else {
      next = moveLogically(lineObj, pos, dir)
    }
    if (next == null) {
      if (!boundToLine && findNextLine())
        { pos = endOfLine(visually, doc.cm, lineObj, pos.line, dir) }
      else
        { return false }
    } else {
      pos = next
    }
    return true
  }

  if (unit == "char") {
    moveOnce()
  } else if (unit == "column") {
    moveOnce(true)
  } else if (unit == "word" || unit == "group") {
    var sawType = null, group = unit == "group"
    var helper = doc.cm && doc.cm.getHelper(pos, "wordChars")
    for (var first = true;; first = false) {
      if (dir < 0 && !moveOnce(!first)) { break }
      var cur = lineObj.text.charAt(pos.ch) || "\n"
      var type = isWordChar(cur, helper) ? "w"
        : group && cur == "\n" ? "n"
        : !group || /\s/.test(cur) ? null
        : "p"
      if (group && !first && !type) { type = "s" }
      if (sawType && sawType != type) {
        if (dir < 0) {dir = 1; moveOnce(); pos.sticky = "after"}
        break
      }

      if (type) { sawType = type }
      if (dir > 0 && !moveOnce(!first)) { break }
    }
  }
  var result = skipAtomic(doc, pos, oldPos, origDir, true)
  if (equalCursorPos(oldPos, result)) { result.hitSide = true }
  return result
}

// For relative vertical movement. Dir may be -1 or 1. Unit can be
// "page" or "line". The resulting position will have a hitSide=true
// property if it reached the end of the document.
function findPosV(cm, pos, dir, unit) {
  var doc = cm.doc, x = pos.left, y
  if (unit == "page") {
    var pageSize = Math.min(cm.display.wrapper.clientHeight, window.innerHeight || document.documentElement.clientHeight)
    var moveAmount = Math.max(pageSize - .5 * textHeight(cm.display), 3)
    y = (dir > 0 ? pos.bottom : pos.top) + dir * moveAmount

  } else if (unit == "line") {
    y = dir > 0 ? pos.bottom + 3 : pos.top - 3
  }
  var target
  for (;;) {
    target = coordsChar(cm, x, y)
    if (!target.outside) { break }
    if (dir < 0 ? y <= 0 : y >= doc.height) { target.hitSide = true; break }
    y += dir * 5
  }
  return target
}

// CONTENTEDITABLE INPUT STYLE

var ContentEditableInput = function(cm) {
  this.cm = cm
  this.lastAnchorNode = this.lastAnchorOffset = this.lastFocusNode = this.lastFocusOffset = null
  this.polling = new Delayed()
  this.composing = null
  this.gracePeriod = false
  this.readDOMTimeout = null
};

ContentEditableInput.prototype.init = function (display) {
    var this$1 = this;

  var input = this, cm = input.cm
  var div = input.div = display.lineDiv
  disableBrowserMagic(div, cm.options.spellcheck)

  on(div, "paste", function (e) {
    if (signalDOMEvent(cm, e) || handlePaste(e, cm)) { return }
    // IE doesn't fire input events, so we schedule a read for the pasted content in this way
    if (ie_version <= 11) { setTimeout(operation(cm, function () { return this$1.updateFromDOM(); }), 20) }
  })

  on(div, "compositionstart", function (e) {
    this$1.composing = {data: e.data, done: false}
  })
  on(div, "compositionupdate", function (e) {
    if (!this$1.composing) { this$1.composing = {data: e.data, done: false} }
  })
  on(div, "compositionend", function (e) {
    if (this$1.composing) {
      if (e.data != this$1.composing.data) { this$1.readFromDOMSoon() }
      this$1.composing.done = true
    }
  })

  on(div, "touchstart", function () { return input.forceCompositionEnd(); })

  on(div, "input", function () {
    if (!this$1.composing) { this$1.readFromDOMSoon() }
  })

  function onCopyCut(e) {
    if (signalDOMEvent(cm, e)) { return }
    if (cm.somethingSelected()) {
      setLastCopied({lineWise: false, text: cm.getSelections()})
      if (e.type == "cut") { cm.replaceSelection("", null, "cut") }
    } else if (!cm.options.lineWiseCopyCut) {
      return
    } else {
      var ranges = copyableRanges(cm)
      setLastCopied({lineWise: true, text: ranges.text})
      if (e.type == "cut") {
        cm.operation(function () {
          cm.setSelections(ranges.ranges, 0, sel_dontScroll)
          cm.replaceSelection("", null, "cut")
        })
      }
    }
    if (e.clipboardData) {
      e.clipboardData.clearData()
      var content = lastCopied.text.join("\n")
      // iOS exposes the clipboard API, but seems to discard content inserted into it
      e.clipboardData.setData("Text", content)
      if (e.clipboardData.getData("Text") == content) {
        e.preventDefault()
        return
      }
    }
    // Old-fashioned briefly-focus-a-textarea hack
    var kludge = hiddenTextarea(), te = kludge.firstChild
    cm.display.lineSpace.insertBefore(kludge, cm.display.lineSpace.firstChild)
    te.value = lastCopied.text.join("\n")
    var hadFocus = document.activeElement
    selectInput(te)
    setTimeout(function () {
      cm.display.lineSpace.removeChild(kludge)
      hadFocus.focus()
      if (hadFocus == div) { input.showPrimarySelection() }
    }, 50)
  }
  on(div, "copy", onCopyCut)
  on(div, "cut", onCopyCut)
};

ContentEditableInput.prototype.prepareSelection = function () {
  var result = prepareSelection(this.cm, false)
  result.focus = this.cm.state.focused
  return result
};

ContentEditableInput.prototype.showSelection = function (info, takeFocus) {
  if (!info || !this.cm.display.view.length) { return }
  if (info.focus || takeFocus) { this.showPrimarySelection() }
  this.showMultipleSelections(info)
};

ContentEditableInput.prototype.showPrimarySelection = function () {
  var sel = window.getSelection(), cm = this.cm, prim = cm.doc.sel.primary()
  var from = prim.from(), to = prim.to()

  if (cm.display.viewTo == cm.display.viewFrom || from.line >= cm.display.viewTo || to.line < cm.display.viewFrom) {
    sel.removeAllRanges()
    return
  }

  var curAnchor = domToPos(cm, sel.anchorNode, sel.anchorOffset)
  var curFocus = domToPos(cm, sel.focusNode, sel.focusOffset)
  if (curAnchor && !curAnchor.bad && curFocus && !curFocus.bad &&
      cmp(minPos(curAnchor, curFocus), from) == 0 &&
      cmp(maxPos(curAnchor, curFocus), to) == 0)
    { return }

  var view = cm.display.view
  var start = (from.line >= cm.display.viewFrom && posToDOM(cm, from)) ||
      {node: view[0].measure.map[2], offset: 0}
  var end = to.line < cm.display.viewTo && posToDOM(cm, to)
  if (!end) {
    var measure = view[view.length - 1].measure
    var map = measure.maps ? measure.maps[measure.maps.length - 1] : measure.map
    end = {node: map[map.length - 1], offset: map[map.length - 2] - map[map.length - 3]}
  }

  if (!start || !end) {
    sel.removeAllRanges()
    return
  }

  var old = sel.rangeCount && sel.getRangeAt(0), rng
  try { rng = range(start.node, start.offset, end.offset, end.node) }
  catch(e) {} // Our model of the DOM might be outdated, in which case the range we try to set can be impossible
  if (rng) {
    if (!gecko && cm.state.focused) {
      sel.collapse(start.node, start.offset)
      if (!rng.collapsed) {
        sel.removeAllRanges()
        sel.addRange(rng)
      }
    } else {
      sel.removeAllRanges()
      sel.addRange(rng)
    }
    if (old && sel.anchorNode == null) { sel.addRange(old) }
    else if (gecko) { this.startGracePeriod() }
  }
  this.rememberSelection()
};

ContentEditableInput.prototype.startGracePeriod = function () {
    var this$1 = this;

  clearTimeout(this.gracePeriod)
  this.gracePeriod = setTimeout(function () {
    this$1.gracePeriod = false
    if (this$1.selectionChanged())
      { this$1.cm.operation(function () { return this$1.cm.curOp.selectionChanged = true; }) }
  }, 20)
};

ContentEditableInput.prototype.showMultipleSelections = function (info) {
  removeChildrenAndAdd(this.cm.display.cursorDiv, info.cursors)
  removeChildrenAndAdd(this.cm.display.selectionDiv, info.selection)
};

ContentEditableInput.prototype.rememberSelection = function () {
  var sel = window.getSelection()
  this.lastAnchorNode = sel.anchorNode; this.lastAnchorOffset = sel.anchorOffset
  this.lastFocusNode = sel.focusNode; this.lastFocusOffset = sel.focusOffset
};

ContentEditableInput.prototype.selectionInEditor = function () {
  var sel = window.getSelection()
  if (!sel.rangeCount) { return false }
  var node = sel.getRangeAt(0).commonAncestorContainer
  return contains(this.div, node)
};

ContentEditableInput.prototype.focus = function () {
  if (this.cm.options.readOnly != "nocursor") {
    if (!this.selectionInEditor())
      { this.showSelection(this.prepareSelection(), true) }
    this.div.focus()
  }
};
ContentEditableInput.prototype.blur = function () { this.div.blur() };
ContentEditableInput.prototype.getField = function () { return this.div };

ContentEditableInput.prototype.supportsTouch = function () { return true };

ContentEditableInput.prototype.receivedFocus = function () {
  var input = this
  if (this.selectionInEditor())
    { this.pollSelection() }
  else
    { runInOp(this.cm, function () { return input.cm.curOp.selectionChanged = true; }) }

  function poll() {
    if (input.cm.state.focused) {
      input.pollSelection()
      input.polling.set(input.cm.options.pollInterval, poll)
    }
  }
  this.polling.set(this.cm.options.pollInterval, poll)
};

ContentEditableInput.prototype.selectionChanged = function () {
  var sel = window.getSelection()
  return sel.anchorNode != this.lastAnchorNode || sel.anchorOffset != this.lastAnchorOffset ||
    sel.focusNode != this.lastFocusNode || sel.focusOffset != this.lastFocusOffset
};

ContentEditableInput.prototype.pollSelection = function () {
  if (this.readDOMTimeout != null || this.gracePeriod || !this.selectionChanged()) { return }
  var sel = window.getSelection(), cm = this.cm
  // On Android Chrome (version 56, at least), backspacing into an
  // uneditable block element will put the cursor in that element,
  // and then, because it's not editable, hide the virtual keyboard.
  // Because Android doesn't allow us to actually detect backspace
  // presses in a sane way, this code checks for when that happens
  // and simulates a backspace press in this case.
  if (android && chrome && this.cm.options.gutters.length && isInGutter(sel.anchorNode)) {
    this.cm.triggerOnKeyDown({type: "keydown", keyCode: 8, preventDefault: Math.abs})
    this.blur()
    this.focus()
    return
  }
  if (this.composing) { return }
  this.rememberSelection()
  var anchor = domToPos(cm, sel.anchorNode, sel.anchorOffset)
  var head = domToPos(cm, sel.focusNode, sel.focusOffset)
  if (anchor && head) { runInOp(cm, function () {
    setSelection(cm.doc, simpleSelection(anchor, head), sel_dontScroll)
    if (anchor.bad || head.bad) { cm.curOp.selectionChanged = true }
  }) }
};

ContentEditableInput.prototype.pollContent = function () {
  if (this.readDOMTimeout != null) {
    clearTimeout(this.readDOMTimeout)
    this.readDOMTimeout = null
  }

  var cm = this.cm, display = cm.display, sel = cm.doc.sel.primary()
  var from = sel.from(), to = sel.to()
  if (from.ch == 0 && from.line > cm.firstLine())
    { from = Pos(from.line - 1, getLine(cm.doc, from.line - 1).length) }
  if (to.ch == getLine(cm.doc, to.line).text.length && to.line < cm.lastLine())
    { to = Pos(to.line + 1, 0) }
  if (from.line < display.viewFrom || to.line > display.viewTo - 1) { return false }

  var fromIndex, fromLine, fromNode
  if (from.line == display.viewFrom || (fromIndex = findViewIndex(cm, from.line)) == 0) {
    fromLine = lineNo(display.view[0].line)
    fromNode = display.view[0].node
  } else {
    fromLine = lineNo(display.view[fromIndex].line)
    fromNode = display.view[fromIndex - 1].node.nextSibling
  }
  var toIndex = findViewIndex(cm, to.line)
  var toLine, toNode
  if (toIndex == display.view.length - 1) {
    toLine = display.viewTo - 1
    toNode = display.lineDiv.lastChild
  } else {
    toLine = lineNo(display.view[toIndex + 1].line) - 1
    toNode = display.view[toIndex + 1].node.previousSibling
  }

  if (!fromNode) { return false }
  var newText = cm.doc.splitLines(domTextBetween(cm, fromNode, toNode, fromLine, toLine))
  var oldText = getBetween(cm.doc, Pos(fromLine, 0), Pos(toLine, getLine(cm.doc, toLine).text.length))
  while (newText.length > 1 && oldText.length > 1) {
    if (lst(newText) == lst(oldText)) { newText.pop(); oldText.pop(); toLine-- }
    else if (newText[0] == oldText[0]) { newText.shift(); oldText.shift(); fromLine++ }
    else { break }
  }

  var cutFront = 0, cutEnd = 0
  var newTop = newText[0], oldTop = oldText[0], maxCutFront = Math.min(newTop.length, oldTop.length)
  while (cutFront < maxCutFront && newTop.charCodeAt(cutFront) == oldTop.charCodeAt(cutFront))
    { ++cutFront }
  var newBot = lst(newText), oldBot = lst(oldText)
  var maxCutEnd = Math.min(newBot.length - (newText.length == 1 ? cutFront : 0),
                           oldBot.length - (oldText.length == 1 ? cutFront : 0))
  while (cutEnd < maxCutEnd &&
         newBot.charCodeAt(newBot.length - cutEnd - 1) == oldBot.charCodeAt(oldBot.length - cutEnd - 1))
    { ++cutEnd }
  // Try to move start of change to start of selection if ambiguous
  if (newText.length == 1 && oldText.length == 1 && fromLine == from.line) {
    while (cutFront && cutFront > from.ch &&
           newBot.charCodeAt(newBot.length - cutEnd - 1) == oldBot.charCodeAt(oldBot.length - cutEnd - 1)) {
      cutFront--
      cutEnd++
    }
  }

  newText[newText.length - 1] = newBot.slice(0, newBot.length - cutEnd).replace(/^\u200b+/, "")
  newText[0] = newText[0].slice(cutFront).replace(/\u200b+$/, "")

  var chFrom = Pos(fromLine, cutFront)
  var chTo = Pos(toLine, oldText.length ? lst(oldText).length - cutEnd : 0)
  if (newText.length > 1 || newText[0] || cmp(chFrom, chTo)) {
    replaceRange(cm.doc, newText, chFrom, chTo, "+input")
    return true
  }
};

ContentEditableInput.prototype.ensurePolled = function () {
  this.forceCompositionEnd()
};
ContentEditableInput.prototype.reset = function () {
  this.forceCompositionEnd()
};
ContentEditableInput.prototype.forceCompositionEnd = function () {
  if (!this.composing) { return }
  clearTimeout(this.readDOMTimeout)
  this.composing = null
  this.updateFromDOM()
  this.div.blur()
  this.div.focus()
};
ContentEditableInput.prototype.readFromDOMSoon = function () {
    var this$1 = this;

  if (this.readDOMTimeout != null) { return }
  this.readDOMTimeout = setTimeout(function () {
    this$1.readDOMTimeout = null
    if (this$1.composing) {
      if (this$1.composing.done) { this$1.composing = null }
      else { return }
    }
    this$1.updateFromDOM()
  }, 80)
};

ContentEditableInput.prototype.updateFromDOM = function () {
    var this$1 = this;

  if (this.cm.isReadOnly() || !this.pollContent())
    { runInOp(this.cm, function () { return regChange(this$1.cm); }) }
};

ContentEditableInput.prototype.setUneditable = function (node) {
  node.contentEditable = "false"
};

ContentEditableInput.prototype.onKeyPress = function (e) {
  if (e.charCode == 0) { return }
  e.preventDefault()
  if (!this.cm.isReadOnly())
    { operation(this.cm, applyTextInput)(this.cm, String.fromCharCode(e.charCode == null ? e.keyCode : e.charCode), 0) }
};

ContentEditableInput.prototype.readOnlyChanged = function (val) {
  this.div.contentEditable = String(val != "nocursor")
};

ContentEditableInput.prototype.onContextMenu = function () {};
ContentEditableInput.prototype.resetPosition = function () {};

ContentEditableInput.prototype.needsContentAttribute = true

function posToDOM(cm, pos) {
  var view = findViewForLine(cm, pos.line)
  if (!view || view.hidden) { return null }
  var line = getLine(cm.doc, pos.line)
  var info = mapFromLineView(view, line, pos.line)

  var order = getOrder(line, cm.doc.direction), side = "left"
  if (order) {
    var partPos = getBidiPartAt(order, pos.ch)
    side = partPos % 2 ? "right" : "left"
  }
  var result = nodeAndOffsetInLineMap(info.map, pos.ch, side)
  result.offset = result.collapse == "right" ? result.end : result.start
  return result
}

function isInGutter(node) {
  for (var scan = node; scan; scan = scan.parentNode)
    { if (/CodeMirror-gutter-wrapper/.test(scan.className)) { return true } }
  return false
}

function badPos(pos, bad) { if (bad) { pos.bad = true; } return pos }

function domTextBetween(cm, from, to, fromLine, toLine) {
  var text = "", closing = false, lineSep = cm.doc.lineSeparator()
  function recognizeMarker(id) { return function (marker) { return marker.id == id; } }
  function close() {
    if (closing) {
      text += lineSep
      closing = false
    }
  }
  function addText(str) {
    if (str) {
      close()
      text += str
    }
  }
  function walk(node) {
    if (node.nodeType == 1) {
      var cmText = node.getAttribute("cm-text")
      if (cmText != null) {
        addText(cmText || node.textContent.replace(/\u200b/g, ""))
        return
      }
      var markerID = node.getAttribute("cm-marker"), range
      if (markerID) {
        var found = cm.findMarks(Pos(fromLine, 0), Pos(toLine + 1, 0), recognizeMarker(+markerID))
        if (found.length && (range = found[0].find(0)))
          { addText(getBetween(cm.doc, range.from, range.to).join(lineSep)) }
        return
      }
      if (node.getAttribute("contenteditable") == "false") { return }
      var isBlock = /^(pre|div|p)$/i.test(node.nodeName)
      if (isBlock) { close() }
      for (var i = 0; i < node.childNodes.length; i++)
        { walk(node.childNodes[i]) }
      if (isBlock) { closing = true }
    } else if (node.nodeType == 3) {
      addText(node.nodeValue)
    }
  }
  for (;;) {
    walk(from)
    if (from == to) { break }
    from = from.nextSibling
  }
  return text
}

function domToPos(cm, node, offset) {
  var lineNode
  if (node == cm.display.lineDiv) {
    lineNode = cm.display.lineDiv.childNodes[offset]
    if (!lineNode) { return badPos(cm.clipPos(Pos(cm.display.viewTo - 1)), true) }
    node = null; offset = 0
  } else {
    for (lineNode = node;; lineNode = lineNode.parentNode) {
      if (!lineNode || lineNode == cm.display.lineDiv) { return null }
      if (lineNode.parentNode && lineNode.parentNode == cm.display.lineDiv) { break }
    }
  }
  for (var i = 0; i < cm.display.view.length; i++) {
    var lineView = cm.display.view[i]
    if (lineView.node == lineNode)
      { return locateNodeInLineView(lineView, node, offset) }
  }
}

function locateNodeInLineView(lineView, node, offset) {
  var wrapper = lineView.text.firstChild, bad = false
  if (!node || !contains(wrapper, node)) { return badPos(Pos(lineNo(lineView.line), 0), true) }
  if (node == wrapper) {
    bad = true
    node = wrapper.childNodes[offset]
    offset = 0
    if (!node) {
      var line = lineView.rest ? lst(lineView.rest) : lineView.line
      return badPos(Pos(lineNo(line), line.text.length), bad)
    }
  }

  var textNode = node.nodeType == 3 ? node : null, topNode = node
  if (!textNode && node.childNodes.length == 1 && node.firstChild.nodeType == 3) {
    textNode = node.firstChild
    if (offset) { offset = textNode.nodeValue.length }
  }
  while (topNode.parentNode != wrapper) { topNode = topNode.parentNode }
  var measure = lineView.measure, maps = measure.maps

  function find(textNode, topNode, offset) {
    for (var i = -1; i < (maps ? maps.length : 0); i++) {
      var map = i < 0 ? measure.map : maps[i]
      for (var j = 0; j < map.length; j += 3) {
        var curNode = map[j + 2]
        if (curNode == textNode || curNode == topNode) {
          var line = lineNo(i < 0 ? lineView.line : lineView.rest[i])
          var ch = map[j] + offset
          if (offset < 0 || curNode != textNode) { ch = map[j + (offset ? 1 : 0)] }
          return Pos(line, ch)
        }
      }
    }
  }
  var found = find(textNode, topNode, offset)
  if (found) { return badPos(found, bad) }

  // FIXME this is all really shaky. might handle the few cases it needs to handle, but likely to cause problems
  for (var after = topNode.nextSibling, dist = textNode ? textNode.nodeValue.length - offset : 0; after; after = after.nextSibling) {
    found = find(after, after.firstChild, 0)
    if (found)
      { return badPos(Pos(found.line, found.ch - dist), bad) }
    else
      { dist += after.textContent.length }
  }
  for (var before = topNode.previousSibling, dist$1 = offset; before; before = before.previousSibling) {
    found = find(before, before.firstChild, -1)
    if (found)
      { return badPos(Pos(found.line, found.ch + dist$1), bad) }
    else
      { dist$1 += before.textContent.length }
  }
}

// TEXTAREA INPUT STYLE

var TextareaInput = function(cm) {
  this.cm = cm
  // See input.poll and input.reset
  this.prevInput = ""

  // Flag that indicates whether we expect input to appear real soon
  // now (after some event like 'keypress' or 'input') and are
  // polling intensively.
  this.pollingFast = false
  // Self-resetting timeout for the poller
  this.polling = new Delayed()
  // Used to work around IE issue with selection being forgotten when focus moves away from textarea
  this.hasSelection = false
  this.composing = null
};

TextareaInput.prototype.init = function (display) {
    var this$1 = this;

  var input = this, cm = this.cm
  this.createField(display)
  var te = this.textarea

  display.wrapper.insertBefore(this.wrapper, display.wrapper.firstChild)

  // Needed to hide big blue blinking cursor on Mobile Safari (doesn't seem to work in iOS 8 anymore)
  if (ios) { te.style.width = "0px" }

  on(te, "input", function () {
    if (ie && ie_version >= 9 && this$1.hasSelection) { this$1.hasSelection = null }
    input.poll()
  })

  on(te, "paste", function (e) {
    if (signalDOMEvent(cm, e) || handlePaste(e, cm)) { return }

    cm.state.pasteIncoming = true
    input.fastPoll()
  })

  function prepareCopyCut(e) {
    if (signalDOMEvent(cm, e)) { return }
    if (cm.somethingSelected()) {
      setLastCopied({lineWise: false, text: cm.getSelections()})
    } else if (!cm.options.lineWiseCopyCut) {
      return
    } else {
      var ranges = copyableRanges(cm)
      setLastCopied({lineWise: true, text: ranges.text})
      if (e.type == "cut") {
        cm.setSelections(ranges.ranges, null, sel_dontScroll)
      } else {
        input.prevInput = ""
        te.value = ranges.text.join("\n")
        selectInput(te)
      }
    }
    if (e.type == "cut") { cm.state.cutIncoming = true }
  }
  on(te, "cut", prepareCopyCut)
  on(te, "copy", prepareCopyCut)

  on(display.scroller, "paste", function (e) {
    if (eventInWidget(display, e) || signalDOMEvent(cm, e)) { return }
    cm.state.pasteIncoming = true
    input.focus()
  })

  // Prevent normal selection in the editor (we handle our own)
  on(display.lineSpace, "selectstart", function (e) {
    if (!eventInWidget(display, e)) { e_preventDefault(e) }
  })

  on(te, "compositionstart", function () {
    var start = cm.getCursor("from")
    if (input.composing) { input.composing.range.clear() }
    input.composing = {
      start: start,
      range: cm.markText(start, cm.getCursor("to"), {className: "CodeMirror-composing"})
    }
  })
  on(te, "compositionend", function () {
    if (input.composing) {
      input.poll()
      input.composing.range.clear()
      input.composing = null
    }
  })
};

TextareaInput.prototype.createField = function (_display) {
  // Wraps and hides input textarea
  this.wrapper = hiddenTextarea()
  // The semihidden textarea that is focused when the editor is
  // focused, and receives input.
  this.textarea = this.wrapper.firstChild
};

TextareaInput.prototype.prepareSelection = function () {
  // Redraw the selection and/or cursor
  var cm = this.cm, display = cm.display, doc = cm.doc
  var result = prepareSelection(cm)

  // Move the hidden textarea near the cursor to prevent scrolling artifacts
  if (cm.options.moveInputWithCursor) {
    var headPos = cursorCoords(cm, doc.sel.primary().head, "div")
    var wrapOff = display.wrapper.getBoundingClientRect(), lineOff = display.lineDiv.getBoundingClientRect()
    result.teTop = Math.max(0, Math.min(display.wrapper.clientHeight - 10,
                                        headPos.top + lineOff.top - wrapOff.top))
    result.teLeft = Math.max(0, Math.min(display.wrapper.clientWidth - 10,
                                         headPos.left + lineOff.left - wrapOff.left))
  }

  return result
};

TextareaInput.prototype.showSelection = function (drawn) {
  var cm = this.cm, display = cm.display
  removeChildrenAndAdd(display.cursorDiv, drawn.cursors)
  removeChildrenAndAdd(display.selectionDiv, drawn.selection)
  if (drawn.teTop != null) {
    this.wrapper.style.top = drawn.teTop + "px"
    this.wrapper.style.left = drawn.teLeft + "px"
  }
};

// Reset the input to correspond to the selection (or to be empty,
// when not typing and nothing is selected)
TextareaInput.prototype.reset = function (typing) {
  if (this.contextMenuPending || this.composing) { return }
  var cm = this.cm
  if (cm.somethingSelected()) {
    this.prevInput = ""
    var content = cm.getSelection()
    this.textarea.value = content
    if (cm.state.focused) { selectInput(this.textarea) }
    if (ie && ie_version >= 9) { this.hasSelection = content }
  } else if (!typing) {
    this.prevInput = this.textarea.value = ""
    if (ie && ie_version >= 9) { this.hasSelection = null }
  }
};

TextareaInput.prototype.getField = function () { return this.textarea };

TextareaInput.prototype.supportsTouch = function () { return false };

TextareaInput.prototype.focus = function () {
  if (this.cm.options.readOnly != "nocursor" && (!mobile || activeElt() != this.textarea)) {
    try { this.textarea.focus() }
    catch (e) {} // IE8 will throw if the textarea is display: none or not in DOM
  }
};

TextareaInput.prototype.blur = function () { this.textarea.blur() };

TextareaInput.prototype.resetPosition = function () {
  this.wrapper.style.top = this.wrapper.style.left = 0
};

TextareaInput.prototype.receivedFocus = function () { this.slowPoll() };

// Poll for input changes, using the normal rate of polling. This
// runs as long as the editor is focused.
TextareaInput.prototype.slowPoll = function () {
    var this$1 = this;

  if (this.pollingFast) { return }
  this.polling.set(this.cm.options.pollInterval, function () {
    this$1.poll()
    if (this$1.cm.state.focused) { this$1.slowPoll() }
  })
};

// When an event has just come in that is likely to add or change
// something in the input textarea, we poll faster, to ensure that
// the change appears on the screen quickly.
TextareaInput.prototype.fastPoll = function () {
  var missed = false, input = this
  input.pollingFast = true
  function p() {
    var changed = input.poll()
    if (!changed && !missed) {missed = true; input.polling.set(60, p)}
    else {input.pollingFast = false; input.slowPoll()}
  }
  input.polling.set(20, p)
};

// Read input from the textarea, and update the document to match.
// When something is selected, it is present in the textarea, and
// selected (unless it is huge, in which case a placeholder is
// used). When nothing is selected, the cursor sits after previously
// seen text (can be empty), which is stored in prevInput (we must
// not reset the textarea when typing, because that breaks IME).
TextareaInput.prototype.poll = function () {
    var this$1 = this;

  var cm = this.cm, input = this.textarea, prevInput = this.prevInput
  // Since this is called a *lot*, try to bail out as cheaply as
  // possible when it is clear that nothing happened. hasSelection
  // will be the case when there is a lot of text in the textarea,
  // in which case reading its value would be expensive.
  if (this.contextMenuPending || !cm.state.focused ||
      (hasSelection(input) && !prevInput && !this.composing) ||
      cm.isReadOnly() || cm.options.disableInput || cm.state.keySeq)
    { return false }

  var text = input.value
  // If nothing changed, bail.
  if (text == prevInput && !cm.somethingSelected()) { return false }
  // Work around nonsensical selection resetting in IE9/10, and
  // inexplicable appearance of private area unicode characters on
  // some key combos in Mac (#2689).
  if (ie && ie_version >= 9 && this.hasSelection === text ||
      mac && /[\uf700-\uf7ff]/.test(text)) {
    cm.display.input.reset()
    return false
  }

  if (cm.doc.sel == cm.display.selForContextMenu) {
    var first = text.charCodeAt(0)
    if (first == 0x200b && !prevInput) { prevInput = "\u200b" }
    if (first == 0x21da) { this.reset(); return this.cm.execCommand("undo") }
  }
  // Find the part of the input that is actually new
  var same = 0, l = Math.min(prevInput.length, text.length)
  while (same < l && prevInput.charCodeAt(same) == text.charCodeAt(same)) { ++same }

  runInOp(cm, function () {
    applyTextInput(cm, text.slice(same), prevInput.length - same,
                   null, this$1.composing ? "*compose" : null)

    // Don't leave long text in the textarea, since it makes further polling slow
    if (text.length > 1000 || text.indexOf("\n") > -1) { input.value = this$1.prevInput = "" }
    else { this$1.prevInput = text }

    if (this$1.composing) {
      this$1.composing.range.clear()
      this$1.composing.range = cm.markText(this$1.composing.start, cm.getCursor("to"),
                                         {className: "CodeMirror-composing"})
    }
  })
  return true
};

TextareaInput.prototype.ensurePolled = function () {
  if (this.pollingFast && this.poll()) { this.pollingFast = false }
};

TextareaInput.prototype.onKeyPress = function () {
  if (ie && ie_version >= 9) { this.hasSelection = null }
  this.fastPoll()
};

TextareaInput.prototype.onContextMenu = function (e) {
  var input = this, cm = input.cm, display = cm.display, te = input.textarea
  var pos = posFromMouse(cm, e), scrollPos = display.scroller.scrollTop
  if (!pos || presto) { return } // Opera is difficult.

  // Reset the current text selection only if the click is done outside of the selection
  // and 'resetSelectionOnContextMenu' option is true.
  var reset = cm.options.resetSelectionOnContextMenu
  if (reset && cm.doc.sel.contains(pos) == -1)
    { operation(cm, setSelection)(cm.doc, simpleSelection(pos), sel_dontScroll) }

  var oldCSS = te.style.cssText, oldWrapperCSS = input.wrapper.style.cssText
  input.wrapper.style.cssText = "position: absolute"
  var wrapperBox = input.wrapper.getBoundingClientRect()
  te.style.cssText = "position: absolute; width: 30px; height: 30px;\n      top: " + (e.clientY - wrapperBox.top - 5) + "px; left: " + (e.clientX - wrapperBox.left - 5) + "px;\n      z-index: 1000; background: " + (ie ? "rgba(255, 255, 255, .05)" : "transparent") + ";\n      outline: none; border-width: 0; outline: none; overflow: hidden; opacity: .05; filter: alpha(opacity=5);"
  var oldScrollY
  if (webkit) { oldScrollY = window.scrollY } // Work around Chrome issue (#2712)
  display.input.focus()
  if (webkit) { window.scrollTo(null, oldScrollY) }
  display.input.reset()
  // Adds "Select all" to context menu in FF
  if (!cm.somethingSelected()) { te.value = input.prevInput = " " }
  input.contextMenuPending = true
  display.selForContextMenu = cm.doc.sel
  clearTimeout(display.detectingSelectAll)

  // Select-all will be greyed out if there's nothing to select, so
  // this adds a zero-width space so that we can later check whether
  // it got selected.
  function prepareSelectAllHack() {
    if (te.selectionStart != null) {
      var selected = cm.somethingSelected()
      var extval = "\u200b" + (selected ? te.value : "")
      te.value = "\u21da" // Used to catch context-menu undo
      te.value = extval
      input.prevInput = selected ? "" : "\u200b"
      te.selectionStart = 1; te.selectionEnd = extval.length
      // Re-set this, in case some other handler touched the
      // selection in the meantime.
      display.selForContextMenu = cm.doc.sel
    }
  }
  function rehide() {
    input.contextMenuPending = false
    input.wrapper.style.cssText = oldWrapperCSS
    te.style.cssText = oldCSS
    if (ie && ie_version < 9) { display.scrollbars.setScrollTop(display.scroller.scrollTop = scrollPos) }

    // Try to detect the user choosing select-all
    if (te.selectionStart != null) {
      if (!ie || (ie && ie_version < 9)) { prepareSelectAllHack() }
      var i = 0, poll = function () {
        if (display.selForContextMenu == cm.doc.sel && te.selectionStart == 0 &&
            te.selectionEnd > 0 && input.prevInput == "\u200b") {
          operation(cm, selectAll)(cm)
        } else if (i++ < 10) {
          display.detectingSelectAll = setTimeout(poll, 500)
        } else {
          display.selForContextMenu = null
          display.input.reset()
        }
      }
      display.detectingSelectAll = setTimeout(poll, 200)
    }
  }

  if (ie && ie_version >= 9) { prepareSelectAllHack() }
  if (captureRightClick) {
    e_stop(e)
    var mouseup = function () {
      off(window, "mouseup", mouseup)
      setTimeout(rehide, 20)
    }
    on(window, "mouseup", mouseup)
  } else {
    setTimeout(rehide, 50)
  }
};

TextareaInput.prototype.readOnlyChanged = function (val) {
  if (!val) { this.reset() }
  this.textarea.disabled = val == "nocursor"
};

TextareaInput.prototype.setUneditable = function () {};

TextareaInput.prototype.needsContentAttribute = false

function fromTextArea(textarea, options) {
  options = options ? copyObj(options) : {}
  options.value = textarea.value
  if (!options.tabindex && textarea.tabIndex)
    { options.tabindex = textarea.tabIndex }
  if (!options.placeholder && textarea.placeholder)
    { options.placeholder = textarea.placeholder }
  // Set autofocus to true if this textarea is focused, or if it has
  // autofocus and no other element is focused.
  if (options.autofocus == null) {
    var hasFocus = activeElt()
    options.autofocus = hasFocus == textarea ||
      textarea.getAttribute("autofocus") != null && hasFocus == document.body
  }

  function save() {textarea.value = cm.getValue()}

  var realSubmit
  if (textarea.form) {
    on(textarea.form, "submit", save)
    // Deplorable hack to make the submit method do the right thing.
    if (!options.leaveSubmitMethodAlone) {
      var form = textarea.form
      realSubmit = form.submit
      try {
        var wrappedSubmit = form.submit = function () {
          save()
          form.submit = realSubmit
          form.submit()
          form.submit = wrappedSubmit
        }
      } catch(e) {}
    }
  }

  options.finishInit = function (cm) {
    cm.save = save
    cm.getTextArea = function () { return textarea; }
    cm.toTextArea = function () {
      cm.toTextArea = isNaN // Prevent this from being ran twice
      save()
      textarea.parentNode.removeChild(cm.getWrapperElement())
      textarea.style.display = ""
      if (textarea.form) {
        off(textarea.form, "submit", save)
        if (typeof textarea.form.submit == "function")
          { textarea.form.submit = realSubmit }
      }
    }
  }

  textarea.style.display = "none"
  var cm = CodeMirror(function (node) { return textarea.parentNode.insertBefore(node, textarea.nextSibling); },
    options)
  return cm
}

function addLegacyProps(CodeMirror) {
  CodeMirror.off = off
  CodeMirror.on = on
  CodeMirror.wheelEventPixels = wheelEventPixels
  CodeMirror.Doc = Doc
  CodeMirror.splitLines = splitLinesAuto
  CodeMirror.countColumn = countColumn
  CodeMirror.findColumn = findColumn
  CodeMirror.isWordChar = isWordCharBasic
  CodeMirror.Pass = Pass
  CodeMirror.signal = signal
  CodeMirror.Line = Line
  CodeMirror.changeEnd = changeEnd
  CodeMirror.scrollbarModel = scrollbarModel
  CodeMirror.Pos = Pos
  CodeMirror.cmpPos = cmp
  CodeMirror.modes = modes
  CodeMirror.mimeModes = mimeModes
  CodeMirror.resolveMode = resolveMode
  CodeMirror.getMode = getMode
  CodeMirror.modeExtensions = modeExtensions
  CodeMirror.extendMode = extendMode
  CodeMirror.copyState = copyState
  CodeMirror.startState = startState
  CodeMirror.innerMode = innerMode
  CodeMirror.commands = commands
  CodeMirror.keyMap = keyMap
  CodeMirror.keyName = keyName
  CodeMirror.isModifierKey = isModifierKey
  CodeMirror.lookupKey = lookupKey
  CodeMirror.normalizeKeyMap = normalizeKeyMap
  CodeMirror.StringStream = StringStream
  CodeMirror.SharedTextMarker = SharedTextMarker
  CodeMirror.TextMarker = TextMarker
  CodeMirror.LineWidget = LineWidget
  CodeMirror.e_preventDefault = e_preventDefault
  CodeMirror.e_stopPropagation = e_stopPropagation
  CodeMirror.e_stop = e_stop
  CodeMirror.addClass = addClass
  CodeMirror.contains = contains
  CodeMirror.rmClass = rmClass
  CodeMirror.keyNames = keyNames
}

// EDITOR CONSTRUCTOR

defineOptions(CodeMirror)

addEditorMethods(CodeMirror)

// Set up methods on CodeMirror's prototype to redirect to the editor's document.
var dontDelegate = "iter insert remove copy getEditor constructor".split(" ")
for (var prop in Doc.prototype) { if (Doc.prototype.hasOwnProperty(prop) && indexOf(dontDelegate, prop) < 0)
  { CodeMirror.prototype[prop] = (function(method) {
    return function() {return method.apply(this.doc, arguments)}
  })(Doc.prototype[prop]) } }

eventMixin(Doc)

// INPUT HANDLING

CodeMirror.inputStyles = {"textarea": TextareaInput, "contenteditable": ContentEditableInput}

// MODE DEFINITION AND QUERYING

// Extra arguments are stored as the mode's dependencies, which is
// used by (legacy) mechanisms like loadmode.js to automatically
// load a mode. (Preferred mechanism is the require/define calls.)
CodeMirror.defineMode = function(name/*, mode, …*/) {
  if (!CodeMirror.defaults.mode && name != "null") { CodeMirror.defaults.mode = name }
  defineMode.apply(this, arguments)
}

CodeMirror.defineMIME = defineMIME

// Minimal default mode.
CodeMirror.defineMode("null", function () { return ({token: function (stream) { return stream.skipToEnd(); }}); })
CodeMirror.defineMIME("text/plain", "null")

// EXTENSIONS

CodeMirror.defineExtension = function (name, func) {
  CodeMirror.prototype[name] = func
}
CodeMirror.defineDocExtension = function (name, func) {
  Doc.prototype[name] = func
}

CodeMirror.fromTextArea = fromTextArea

addLegacyProps(CodeMirror)

CodeMirror.version = "5.36.0"

return CodeMirror;

})));

(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.sanitizeHtml=f()}})(function(){var define,module,exports;return function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r}()({1:[function(require,module,exports){"use strict";var htmlparser=require("htmlparser2");var extend=require("xtend");var quoteRegexp=require("lodash.escaperegexp");var cloneDeep=require("lodash.clonedeep");var mergeWith=require("lodash.mergewith");var isString=require("lodash.isstring");var isPlainObject=require("lodash.isplainobject");var srcset=require("srcset");var postcss=require("postcss");var url=require("url");function each(obj,cb){if(obj)Object.keys(obj).forEach(function(key){cb(obj[key],key)})}function has(obj,key){return{}.hasOwnProperty.call(obj,key)}function filter(a,cb){var n=[];each(a,function(v){if(cb(v)){n.push(v)}});return n}module.exports=sanitizeHtml;var VALID_HTML_ATTRIBUTE_NAME=/^[^\0\t\n\f\r /<=>]+$/;function sanitizeHtml(html,options,_recursing){var result="";function Frame(tag,attribs){var that=this;this.tag=tag;this.attribs=attribs||{};this.tagPosition=result.length;this.text="";this.updateParentNodeText=function(){if(stack.length){var parentFrame=stack[stack.length-1];parentFrame.text+=that.text}}}if(!options){options=sanitizeHtml.defaults;options.parser=htmlParserDefaults}else{options=extend(sanitizeHtml.defaults,options);if(options.parser){options.parser=extend(htmlParserDefaults,options.parser)}else{options.parser=htmlParserDefaults}}var nonTextTagsArray=options.nonTextTags||["script","style","textarea"];var allowedAttributesMap;var allowedAttributesGlobMap;if(options.allowedAttributes){allowedAttributesMap={};allowedAttributesGlobMap={};each(options.allowedAttributes,function(attributes,tag){allowedAttributesMap[tag]=[];var globRegex=[];attributes.forEach(function(obj){if(isString(obj)&&obj.indexOf("*")>=0){globRegex.push(quoteRegexp(obj).replace(/\\\*/g,".*"))}else{allowedAttributesMap[tag].push(obj)}});allowedAttributesGlobMap[tag]=new RegExp("^("+globRegex.join("|")+")$")})}var allowedClassesMap={};each(options.allowedClasses,function(classes,tag){if(allowedAttributesMap){if(!has(allowedAttributesMap,tag)){allowedAttributesMap[tag]=[]}allowedAttributesMap[tag].push("class")}allowedClassesMap[tag]=classes});var transformTagsMap={};var transformTagsAll;each(options.transformTags,function(transform,tag){var transFun;if(typeof transform==="function"){transFun=transform}else if(typeof transform==="string"){transFun=sanitizeHtml.simpleTransform(transform)}if(tag==="*"){transformTagsAll=transFun}else{transformTagsMap[tag]=transFun}});var depth=0;var stack=[];var skipMap={};var transformMap={};var skipText=false;var skipTextDepth=0;var parser=new htmlparser.Parser({onopentag:function onopentag(name,attribs){if(skipText){skipTextDepth++;return}var frame=new Frame(name,attribs);stack.push(frame);var skip=false;var hasText=frame.text?true:false;var transformedTag;if(has(transformTagsMap,name)){transformedTag=transformTagsMap[name](name,attribs);frame.attribs=attribs=transformedTag.attribs;if(transformedTag.text!==undefined){frame.innerText=transformedTag.text}if(name!==transformedTag.tagName){frame.name=name=transformedTag.tagName;transformMap[depth]=transformedTag.tagName}}if(transformTagsAll){transformedTag=transformTagsAll(name,attribs);frame.attribs=attribs=transformedTag.attribs;if(name!==transformedTag.tagName){frame.name=name=transformedTag.tagName;transformMap[depth]=transformedTag.tagName}}if(options.allowedTags&&options.allowedTags.indexOf(name)===-1){skip=true;if(nonTextTagsArray.indexOf(name)!==-1){skipText=true;skipTextDepth=1}skipMap[depth]=true}depth++;if(skip){return}result+="<"+name;if(!allowedAttributesMap||has(allowedAttributesMap,name)||allowedAttributesMap["*"]){each(attribs,function(value,a){if(!VALID_HTML_ATTRIBUTE_NAME.test(a)){delete frame.attribs[a];return}var parsed;var passedAllowedAttributesMapCheck=false;if(!allowedAttributesMap||has(allowedAttributesMap,name)&&allowedAttributesMap[name].indexOf(a)!==-1||allowedAttributesMap["*"]&&allowedAttributesMap["*"].indexOf(a)!==-1||has(allowedAttributesGlobMap,name)&&allowedAttributesGlobMap[name].test(a)||allowedAttributesGlobMap["*"]&&allowedAttributesGlobMap["*"].test(a)){passedAllowedAttributesMapCheck=true}else if(allowedAttributesMap&&allowedAttributesMap[name]){var _iteratorNormalCompletion=true;var _didIteratorError=false;var _iteratorError=undefined;try{for(var _iterator=allowedAttributesMap[name][Symbol.iterator](),_step;!(_iteratorNormalCompletion=(_step=_iterator.next()).done);_iteratorNormalCompletion=true){var o=_step.value;if(isPlainObject(o)&&o.name&&o.name===a){passedAllowedAttributesMapCheck=true;var newValue="";if(o.multiple===true){var splitStrArray=value.split(" ");var _iteratorNormalCompletion2=true;var _didIteratorError2=false;var _iteratorError2=undefined;try{for(var _iterator2=splitStrArray[Symbol.iterator](),_step2;!(_iteratorNormalCompletion2=(_step2=_iterator2.next()).done);_iteratorNormalCompletion2=true){var s=_step2.value;if(o.values.indexOf(s)!==-1){if(newValue===""){newValue=s}else{newValue+=" "+s}}}}catch(err){_didIteratorError2=true;_iteratorError2=err}finally{try{if(!_iteratorNormalCompletion2&&_iterator2.return){_iterator2.return()}}finally{if(_didIteratorError2){throw _iteratorError2}}}}else if(o.values.indexOf(value)>=0){newValue=value}value=newValue}}}catch(err){_didIteratorError=true;_iteratorError=err}finally{try{if(!_iteratorNormalCompletion&&_iterator.return){_iterator.return()}}finally{if(_didIteratorError){throw _iteratorError}}}}if(passedAllowedAttributesMapCheck){if(options.allowedSchemesAppliedToAttributes.indexOf(a)!==-1){if(naughtyHref(name,value)){delete frame.attribs[a];return}}if(name==="iframe"&&a==="src"){var allowed=true;try{parsed=url.parse(value,false,true);var isRelativeUrl=parsed&&parsed.host===null&&parsed.protocol===null;if(isRelativeUrl){allowed=has(options,"allowIframeRelativeUrls")?options.allowIframeRelativeUrls:!options.allowedIframeHostnames}else if(options.allowedIframeHostnames){allowed=options.allowedIframeHostnames.find(function(hostname){return hostname===parsed.hostname})}}catch(e){allowed=false}if(!allowed){delete frame.attribs[a];return}}if(a==="srcset"){try{parsed=srcset.parse(value);each(parsed,function(value){if(naughtyHref("srcset",value.url)){value.evil=true}});parsed=filter(parsed,function(v){return!v.evil});if(!parsed.length){delete frame.attribs[a];return}else{value=srcset.stringify(filter(parsed,function(v){return!v.evil}));frame.attribs[a]=value}}catch(e){delete frame.attribs[a];return}}if(a==="class"){value=filterClasses(value,allowedClassesMap[name]);if(!value.length){delete frame.attribs[a];return}}if(a==="style"){try{var abstractSyntaxTree=postcss.parse(name+" {"+value+"}");var filteredAST=filterCss(abstractSyntaxTree,options.allowedStyles);value=stringifyStyleAttributes(filteredAST);if(value.length===0){delete frame.attribs[a];return}}catch(e){delete frame.attribs[a];return}}result+=" "+a;if(value.length){result+='="'+escapeHtml(value,true)+'"'}}else{delete frame.attribs[a]}})}if(options.selfClosing.indexOf(name)!==-1){result+=" />"}else{result+=">";if(frame.innerText&&!hasText&&!options.textFilter){result+=frame.innerText}}},ontext:function ontext(text){if(skipText){return}var lastFrame=stack[stack.length-1];var tag;if(lastFrame){tag=lastFrame.tag;text=lastFrame.innerText!==undefined?lastFrame.innerText:text}if(tag==="script"||tag==="style"){result+=text}else{var escaped=escapeHtml(text,false);if(options.textFilter){result+=options.textFilter(escaped)}else{result+=escaped}}if(stack.length){var frame=stack[stack.length-1];frame.text+=text}},onclosetag:function onclosetag(name){if(skipText){skipTextDepth--;if(!skipTextDepth){skipText=false}else{return}}var frame=stack.pop();if(!frame){return}skipText=false;depth--;if(skipMap[depth]){delete skipMap[depth];frame.updateParentNodeText();return}if(transformMap[depth]){name=transformMap[depth];delete transformMap[depth]}if(options.exclusiveFilter&&options.exclusiveFilter(frame)){result=result.substr(0,frame.tagPosition);return}frame.updateParentNodeText();if(options.selfClosing.indexOf(name)!==-1){return}result+="</"+name+">"}},options.parser);parser.write(html);parser.end();return result;function escapeHtml(s,quote){if(typeof s!=="string"){s=s+""}if(options.parser.decodeEntities){s=s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/\>/g,"&gt;");if(quote){s=s.replace(/\"/g,"&quot;")}}s=s.replace(/&(?![a-zA-Z0-9#]{1,20};)/g,"&amp;").replace(/</g,"&lt;").replace(/\>/g,"&gt;");if(quote){s=s.replace(/\"/g,"&quot;")}return s}function naughtyHref(name,href){href=href.replace(/[\x00-\x20]+/g,"");href=href.replace(/<\!\-\-.*?\-\-\>/g,"");var matches=href.match(/^([a-zA-Z]+)\:/);if(!matches){if(href.match(/^[\/\\]{2}/)){return!options.allowProtocolRelative}return false}var scheme=matches[1].toLowerCase();if(has(options.allowedSchemesByTag,name)){return options.allowedSchemesByTag[name].indexOf(scheme)===-1}return!options.allowedSchemes||options.allowedSchemes.indexOf(scheme)===-1}function filterCss(abstractSyntaxTree,allowedStyles){if(!allowedStyles){return abstractSyntaxTree}var filteredAST=cloneDeep(abstractSyntaxTree);var astRules=abstractSyntaxTree.nodes[0];var selectedRule;if(allowedStyles[astRules.selector]&&allowedStyles["*"]){selectedRule=mergeWith(cloneDeep(allowedStyles[astRules.selector]),allowedStyles["*"],function(objValue,srcValue){if(Array.isArray(objValue)){return objValue.concat(srcValue)}})}else{selectedRule=allowedStyles[astRules.selector]||allowedStyles["*"]}if(selectedRule){filteredAST.nodes[0].nodes=astRules.nodes.reduce(filterDeclarations(selectedRule),[])}return filteredAST}function stringifyStyleAttributes(filteredAST){return filteredAST.nodes[0].nodes.reduce(function(extractedAttributes,attributeObject){extractedAttributes.push(attributeObject.prop+":"+attributeObject.value+";");return extractedAttributes},[]).join("")}function filterDeclarations(selectedRule){return function(allowedDeclarationsList,attributeObject){if(selectedRule.hasOwnProperty(attributeObject.prop)){var matchesRegex=selectedRule[attributeObject.prop].some(function(regularExpression){return regularExpression.test(attributeObject.value)});if(matchesRegex){allowedDeclarationsList.push(attributeObject)}}return allowedDeclarationsList}}function filterClasses(classes,allowed){if(!allowed){return classes}classes=classes.split(/\s+/);return classes.filter(function(clss){return allowed.indexOf(clss)!==-1}).join(" ")}}var htmlParserDefaults={decodeEntities:true};sanitizeHtml.defaults={allowedTags:["h3","h4","h5","h6","blockquote","p","a","ul","ol","nl","li","b","i","strong","em","strike","code","hr","br","div","table","thead","caption","tbody","tr","th","td","pre","iframe"],allowedAttributes:{a:["href","name","target"],img:["src"]},selfClosing:["img","br","hr","area","base","basefont","input","link","meta"],allowedSchemes:["http","https","ftp","mailto"],allowedSchemesByTag:{},allowedSchemesAppliedToAttributes:["href","src","cite"],allowProtocolRelative:true};sanitizeHtml.simpleTransform=function(newTagName,newAttribs,merge){merge=merge===undefined?true:merge;newAttribs=newAttribs||{};return function(tagName,attribs){var attrib;if(merge){for(attrib in newAttribs){attribs[attrib]=newAttribs[attrib]}}else{attribs=newAttribs}return{tagName:newTagName,attribs:attribs}}}},{htmlparser2:34,"lodash.clonedeep":37,"lodash.escaperegexp":38,"lodash.isplainobject":39,"lodash.isstring":40,"lodash.mergewith":41,postcss:56,srcset:85,url:87,xtend:89}],2:[function(require,module,exports){(function(global){"use strict";function uniqNoSet(arr){var ret=[];for(var i=0;i<arr.length;i++){if(ret.indexOf(arr[i])===-1){ret.push(arr[i])}}return ret}function uniqSet(arr){var seen=new Set;return arr.filter(function(el){if(!seen.has(el)){seen.add(el);return true}return false})}function uniqSetWithForEach(arr){var ret=[];new Set(arr).forEach(function(el){ret.push(el)});return ret}function doesForEachActuallyWork(){var ret=false;new Set([true]).forEach(function(el){ret=el});return ret===true}if("Set"in global){if(typeof Set.prototype.forEach==="function"&&doesForEachActuallyWork()){module.exports=uniqSetWithForEach}else{module.exports=uniqSet}}else{module.exports=uniqNoSet}}).call(this,typeof global!=="undefined"?global:typeof self!=="undefined"?self:typeof window!=="undefined"?window:{})},{}],3:[function(require,module,exports){"use strict";exports.byteLength=byteLength;exports.toByteArray=toByteArray;exports.fromByteArray=fromByteArray;var lookup=[];var revLookup=[];var Arr=typeof Uint8Array!=="undefined"?Uint8Array:Array;var code="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";for(var i=0,len=code.length;i<len;++i){lookup[i]=code[i];revLookup[code.charCodeAt(i)]=i}revLookup["-".charCodeAt(0)]=62;revLookup["_".charCodeAt(0)]=63;function getLens(b64){var len=b64.length;if(len%4>0){throw new Error("Invalid string. Length must be a multiple of 4")}var validLen=b64.indexOf("=");if(validLen===-1)validLen=len;var placeHoldersLen=validLen===len?0:4-validLen%4;return[validLen,placeHoldersLen]}function byteLength(b64){var lens=getLens(b64);var validLen=lens[0];var placeHoldersLen=lens[1];return(validLen+placeHoldersLen)*3/4-placeHoldersLen}function _byteLength(b64,validLen,placeHoldersLen){return(validLen+placeHoldersLen)*3/4-placeHoldersLen}function toByteArray(b64){var tmp;var lens=getLens(b64);var validLen=lens[0];var placeHoldersLen=lens[1];var arr=new Arr(_byteLength(b64,validLen,placeHoldersLen));var curByte=0;var len=placeHoldersLen>0?validLen-4:validLen;for(var i=0;i<len;i+=4){tmp=revLookup[b64.charCodeAt(i)]<<18|revLookup[b64.charCodeAt(i+1)]<<12|revLookup[b64.charCodeAt(i+2)]<<6|revLookup[b64.charCodeAt(i+3)];arr[curByte++]=tmp>>16&255;arr[curByte++]=tmp>>8&255;arr[curByte++]=tmp&255}if(placeHoldersLen===2){tmp=revLookup[b64.charCodeAt(i)]<<2|revLookup[b64.charCodeAt(i+1)]>>4;arr[curByte++]=tmp&255}if(placeHoldersLen===1){tmp=revLookup[b64.charCodeAt(i)]<<10|revLookup[b64.charCodeAt(i+1)]<<4|revLookup[b64.charCodeAt(i+2)]>>2;arr[curByte++]=tmp>>8&255;arr[curByte++]=tmp&255}return arr}function tripletToBase64(num){return lookup[num>>18&63]+lookup[num>>12&63]+lookup[num>>6&63]+lookup[num&63]}function encodeChunk(uint8,start,end){var tmp;var output=[];for(var i=start;i<end;i+=3){tmp=(uint8[i]<<16&16711680)+(uint8[i+1]<<8&65280)+(uint8[i+2]&255);output.push(tripletToBase64(tmp))}return output.join("")}function fromByteArray(uint8){var tmp;var len=uint8.length;var extraBytes=len%3;var parts=[];var maxChunkLength=16383;for(var i=0,len2=len-extraBytes;i<len2;i+=maxChunkLength){parts.push(encodeChunk(uint8,i,i+maxChunkLength>len2?len2:i+maxChunkLength))}if(extraBytes===1){tmp=uint8[len-1];parts.push(lookup[tmp>>2]+lookup[tmp<<4&63]+"==")}else if(extraBytes===2){tmp=(uint8[len-2]<<8)+uint8[len-1];parts.push(lookup[tmp>>10]+lookup[tmp>>4&63]+lookup[tmp<<2&63]+"=")}return parts.join("")}},{}],4:[function(require,module,exports){},{}],5:[function(require,module,exports){(function(Buffer){"use strict";var base64=require("base64-js");var ieee754=require("ieee754");exports.Buffer=Buffer;exports.SlowBuffer=SlowBuffer;exports.INSPECT_MAX_BYTES=50;var K_MAX_LENGTH=2147483647;exports.kMaxLength=K_MAX_LENGTH;Buffer.TYPED_ARRAY_SUPPORT=typedArraySupport();if(!Buffer.TYPED_ARRAY_SUPPORT&&typeof console!=="undefined"&&typeof console.error==="function"){console.error("This browser lacks typed array (Uint8Array) support which is required by "+"`buffer` v5.x. Use `buffer` v4.x if you require old browser support.")}function typedArraySupport(){try{var arr=new Uint8Array(1);arr.__proto__={__proto__:Uint8Array.prototype,foo:function(){return 42}};return arr.foo()===42}catch(e){return false}}Object.defineProperty(Buffer.prototype,"parent",{enumerable:true,get:function(){if(!Buffer.isBuffer(this))return undefined;return this.buffer}});Object.defineProperty(Buffer.prototype,"offset",{enumerable:true,get:function(){if(!Buffer.isBuffer(this))return undefined;return this.byteOffset}});function createBuffer(length){if(length>K_MAX_LENGTH){throw new RangeError('The value "'+length+'" is invalid for option "size"')}var buf=new Uint8Array(length);buf.__proto__=Buffer.prototype;return buf}function Buffer(arg,encodingOrOffset,length){if(typeof arg==="number"){if(typeof encodingOrOffset==="string"){throw new TypeError('The "string" argument must be of type string. Received type number')}return allocUnsafe(arg)}return from(arg,encodingOrOffset,length)}if(typeof Symbol!=="undefined"&&Symbol.species!=null&&Buffer[Symbol.species]===Buffer){Object.defineProperty(Buffer,Symbol.species,{value:null,configurable:true,enumerable:false,writable:false})}Buffer.poolSize=8192;function from(value,encodingOrOffset,length){if(typeof value==="string"){return fromString(value,encodingOrOffset)}if(ArrayBuffer.isView(value)){return fromArrayLike(value)}if(value==null){throw TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, "+"or Array-like Object. Received type "+typeof value)}if(isInstance(value,ArrayBuffer)||value&&isInstance(value.buffer,ArrayBuffer)){return fromArrayBuffer(value,encodingOrOffset,length)}if(typeof value==="number"){throw new TypeError('The "value" argument must not be of type number. Received type number')}var valueOf=value.valueOf&&value.valueOf();if(valueOf!=null&&valueOf!==value){return Buffer.from(valueOf,encodingOrOffset,length)}var b=fromObject(value);if(b)return b;if(typeof Symbol!=="undefined"&&Symbol.toPrimitive!=null&&typeof value[Symbol.toPrimitive]==="function"){return Buffer.from(value[Symbol.toPrimitive]("string"),encodingOrOffset,length)}throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, "+"or Array-like Object. Received type "+typeof value)}Buffer.from=function(value,encodingOrOffset,length){return from(value,encodingOrOffset,length)};Buffer.prototype.__proto__=Uint8Array.prototype;Buffer.__proto__=Uint8Array;function assertSize(size){if(typeof size!=="number"){throw new TypeError('"size" argument must be of type number')}else if(size<0){throw new RangeError('The value "'+size+'" is invalid for option "size"')}}function alloc(size,fill,encoding){assertSize(size);if(size<=0){return createBuffer(size)}if(fill!==undefined){return typeof encoding==="string"?createBuffer(size).fill(fill,encoding):createBuffer(size).fill(fill)}return createBuffer(size)}Buffer.alloc=function(size,fill,encoding){return alloc(size,fill,encoding)};function allocUnsafe(size){assertSize(size);return createBuffer(size<0?0:checked(size)|0)}Buffer.allocUnsafe=function(size){return allocUnsafe(size)};Buffer.allocUnsafeSlow=function(size){return allocUnsafe(size)};function fromString(string,encoding){if(typeof encoding!=="string"||encoding===""){encoding="utf8"}if(!Buffer.isEncoding(encoding)){throw new TypeError("Unknown encoding: "+encoding)}var length=byteLength(string,encoding)|0;var buf=createBuffer(length);var actual=buf.write(string,encoding);if(actual!==length){buf=buf.slice(0,actual)}return buf}function fromArrayLike(array){var length=array.length<0?0:checked(array.length)|0;var buf=createBuffer(length);for(var i=0;i<length;i+=1){buf[i]=array[i]&255}return buf}function fromArrayBuffer(array,byteOffset,length){if(byteOffset<0||array.byteLength<byteOffset){throw new RangeError('"offset" is outside of buffer bounds')}if(array.byteLength<byteOffset+(length||0)){throw new RangeError('"length" is outside of buffer bounds')}var buf;if(byteOffset===undefined&&length===undefined){buf=new Uint8Array(array)}else if(length===undefined){buf=new Uint8Array(array,byteOffset)}else{buf=new Uint8Array(array,byteOffset,length)}buf.__proto__=Buffer.prototype;return buf}function fromObject(obj){if(Buffer.isBuffer(obj)){var len=checked(obj.length)|0;var buf=createBuffer(len);if(buf.length===0){return buf}obj.copy(buf,0,0,len);return buf}if(obj.length!==undefined){if(typeof obj.length!=="number"||numberIsNaN(obj.length)){return createBuffer(0)}return fromArrayLike(obj)}if(obj.type==="Buffer"&&Array.isArray(obj.data)){return fromArrayLike(obj.data)}}function checked(length){if(length>=K_MAX_LENGTH){throw new RangeError("Attempt to allocate Buffer larger than maximum "+"size: 0x"+K_MAX_LENGTH.toString(16)+" bytes")}return length|0}function SlowBuffer(length){if(+length!=length){length=0}return Buffer.alloc(+length)}Buffer.isBuffer=function isBuffer(b){return b!=null&&b._isBuffer===true&&b!==Buffer.prototype};Buffer.compare=function compare(a,b){if(isInstance(a,Uint8Array))a=Buffer.from(a,a.offset,a.byteLength);if(isInstance(b,Uint8Array))b=Buffer.from(b,b.offset,b.byteLength);if(!Buffer.isBuffer(a)||!Buffer.isBuffer(b)){throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array')}if(a===b)return 0;var x=a.length;var y=b.length;for(var i=0,len=Math.min(x,y);i<len;++i){if(a[i]!==b[i]){x=a[i];y=b[i];break}}if(x<y)return-1;if(y<x)return 1;return 0};Buffer.isEncoding=function isEncoding(encoding){switch(String(encoding).toLowerCase()){case"hex":case"utf8":case"utf-8":case"ascii":case"latin1":case"binary":case"base64":case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return true;default:return false}};Buffer.concat=function concat(list,length){if(!Array.isArray(list)){throw new TypeError('"list" argument must be an Array of Buffers')}if(list.length===0){return Buffer.alloc(0)}var i;if(length===undefined){length=0;for(i=0;i<list.length;++i){length+=list[i].length}}var buffer=Buffer.allocUnsafe(length);var pos=0;for(i=0;i<list.length;++i){var buf=list[i];if(isInstance(buf,Uint8Array)){buf=Buffer.from(buf)}if(!Buffer.isBuffer(buf)){throw new TypeError('"list" argument must be an Array of Buffers')}buf.copy(buffer,pos);pos+=buf.length}return buffer};function byteLength(string,encoding){if(Buffer.isBuffer(string)){return string.length}if(ArrayBuffer.isView(string)||isInstance(string,ArrayBuffer)){return string.byteLength}if(typeof string!=="string"){throw new TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. '+"Received type "+typeof string)}var len=string.length;var mustMatch=arguments.length>2&&arguments[2]===true;if(!mustMatch&&len===0)return 0;var loweredCase=false;for(;;){switch(encoding){case"ascii":case"latin1":case"binary":return len;case"utf8":case"utf-8":return utf8ToBytes(string).length;case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return len*2;case"hex":return len>>>1;case"base64":return base64ToBytes(string).length;default:if(loweredCase){return mustMatch?-1:utf8ToBytes(string).length}encoding=(""+encoding).toLowerCase();loweredCase=true}}}Buffer.byteLength=byteLength;function slowToString(encoding,start,end){var loweredCase=false;if(start===undefined||start<0){start=0}if(start>this.length){return""}if(end===undefined||end>this.length){end=this.length}if(end<=0){return""}end>>>=0;start>>>=0;if(end<=start){return""}if(!encoding)encoding="utf8";while(true){switch(encoding){case"hex":return hexSlice(this,start,end);case"utf8":case"utf-8":return utf8Slice(this,start,end);case"ascii":return asciiSlice(this,start,end);case"latin1":case"binary":return latin1Slice(this,start,end);case"base64":return base64Slice(this,start,end);case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return utf16leSlice(this,start,end);default:if(loweredCase)throw new TypeError("Unknown encoding: "+encoding);encoding=(encoding+"").toLowerCase();loweredCase=true}}}Buffer.prototype._isBuffer=true;function swap(b,n,m){var i=b[n];b[n]=b[m];b[m]=i}Buffer.prototype.swap16=function swap16(){var len=this.length;if(len%2!==0){throw new RangeError("Buffer size must be a multiple of 16-bits")}for(var i=0;i<len;i+=2){swap(this,i,i+1)}return this};Buffer.prototype.swap32=function swap32(){var len=this.length;if(len%4!==0){throw new RangeError("Buffer size must be a multiple of 32-bits")}for(var i=0;i<len;i+=4){swap(this,i,i+3);swap(this,i+1,i+2)}return this};Buffer.prototype.swap64=function swap64(){var len=this.length;if(len%8!==0){throw new RangeError("Buffer size must be a multiple of 64-bits")}for(var i=0;i<len;i+=8){swap(this,i,i+7);swap(this,i+1,i+6);swap(this,i+2,i+5);swap(this,i+3,i+4)}return this};Buffer.prototype.toString=function toString(){var length=this.length;if(length===0)return"";if(arguments.length===0)return utf8Slice(this,0,length);return slowToString.apply(this,arguments)};Buffer.prototype.toLocaleString=Buffer.prototype.toString;Buffer.prototype.equals=function equals(b){if(!Buffer.isBuffer(b))throw new TypeError("Argument must be a Buffer");if(this===b)return true;return Buffer.compare(this,b)===0};Buffer.prototype.inspect=function inspect(){var str="";var max=exports.INSPECT_MAX_BYTES;str=this.toString("hex",0,max).replace(/(.{2})/g,"$1 ").trim();if(this.length>max)str+=" ... ";return"<Buffer "+str+">"};Buffer.prototype.compare=function compare(target,start,end,thisStart,thisEnd){if(isInstance(target,Uint8Array)){target=Buffer.from(target,target.offset,target.byteLength)}if(!Buffer.isBuffer(target)){throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. '+"Received type "+typeof target)}if(start===undefined){start=0}if(end===undefined){end=target?target.length:0}if(thisStart===undefined){thisStart=0}if(thisEnd===undefined){thisEnd=this.length}if(start<0||end>target.length||thisStart<0||thisEnd>this.length){throw new RangeError("out of range index")}if(thisStart>=thisEnd&&start>=end){return 0}if(thisStart>=thisEnd){return-1}if(start>=end){return 1}start>>>=0;end>>>=0;thisStart>>>=0;thisEnd>>>=0;if(this===target)return 0;var x=thisEnd-thisStart;var y=end-start;var len=Math.min(x,y);var thisCopy=this.slice(thisStart,thisEnd);var targetCopy=target.slice(start,end);for(var i=0;i<len;++i){if(thisCopy[i]!==targetCopy[i]){x=thisCopy[i];y=targetCopy[i];break}}if(x<y)return-1;if(y<x)return 1;return 0};function bidirectionalIndexOf(buffer,val,byteOffset,encoding,dir){if(buffer.length===0)return-1;if(typeof byteOffset==="string"){encoding=byteOffset;byteOffset=0}else if(byteOffset>2147483647){byteOffset=2147483647}else if(byteOffset<-2147483648){byteOffset=-2147483648}byteOffset=+byteOffset;if(numberIsNaN(byteOffset)){byteOffset=dir?0:buffer.length-1}if(byteOffset<0)byteOffset=buffer.length+byteOffset;if(byteOffset>=buffer.length){if(dir)return-1;else byteOffset=buffer.length-1}else if(byteOffset<0){if(dir)byteOffset=0;else return-1}if(typeof val==="string"){val=Buffer.from(val,encoding)}if(Buffer.isBuffer(val)){if(val.length===0){return-1}return arrayIndexOf(buffer,val,byteOffset,encoding,dir)}else if(typeof val==="number"){val=val&255;if(typeof Uint8Array.prototype.indexOf==="function"){if(dir){return Uint8Array.prototype.indexOf.call(buffer,val,byteOffset)}else{return Uint8Array.prototype.lastIndexOf.call(buffer,val,byteOffset)}}return arrayIndexOf(buffer,[val],byteOffset,encoding,dir)}throw new TypeError("val must be string, number or Buffer")}function arrayIndexOf(arr,val,byteOffset,encoding,dir){var indexSize=1;var arrLength=arr.length;var valLength=val.length;if(encoding!==undefined){encoding=String(encoding).toLowerCase();if(encoding==="ucs2"||encoding==="ucs-2"||encoding==="utf16le"||encoding==="utf-16le"){if(arr.length<2||val.length<2){return-1}indexSize=2;arrLength/=2;valLength/=2;byteOffset/=2}}function read(buf,i){if(indexSize===1){return buf[i]}else{return buf.readUInt16BE(i*indexSize)}}var i;if(dir){var foundIndex=-1;for(i=byteOffset;i<arrLength;i++){if(read(arr,i)===read(val,foundIndex===-1?0:i-foundIndex)){if(foundIndex===-1)foundIndex=i;if(i-foundIndex+1===valLength)return foundIndex*indexSize}else{if(foundIndex!==-1)i-=i-foundIndex;foundIndex=-1}}}else{if(byteOffset+valLength>arrLength)byteOffset=arrLength-valLength;for(i=byteOffset;i>=0;i--){var found=true;for(var j=0;j<valLength;j++){if(read(arr,i+j)!==read(val,j)){found=false;break}}if(found)return i}}return-1}Buffer.prototype.includes=function includes(val,byteOffset,encoding){return this.indexOf(val,byteOffset,encoding)!==-1};Buffer.prototype.indexOf=function indexOf(val,byteOffset,encoding){return bidirectionalIndexOf(this,val,byteOffset,encoding,true)};Buffer.prototype.lastIndexOf=function lastIndexOf(val,byteOffset,encoding){return bidirectionalIndexOf(this,val,byteOffset,encoding,false)};function hexWrite(buf,string,offset,length){offset=Number(offset)||0;var remaining=buf.length-offset;if(!length){length=remaining}else{length=Number(length);if(length>remaining){length=remaining}}var strLen=string.length;if(length>strLen/2){length=strLen/2}for(var i=0;i<length;++i){var parsed=parseInt(string.substr(i*2,2),16);if(numberIsNaN(parsed))return i;buf[offset+i]=parsed}return i}function utf8Write(buf,string,offset,length){return blitBuffer(utf8ToBytes(string,buf.length-offset),buf,offset,length)}function asciiWrite(buf,string,offset,length){return blitBuffer(asciiToBytes(string),buf,offset,length)}function latin1Write(buf,string,offset,length){return asciiWrite(buf,string,offset,length)}function base64Write(buf,string,offset,length){return blitBuffer(base64ToBytes(string),buf,offset,length)}function ucs2Write(buf,string,offset,length){return blitBuffer(utf16leToBytes(string,buf.length-offset),buf,offset,length)}Buffer.prototype.write=function write(string,offset,length,encoding){if(offset===undefined){encoding="utf8";length=this.length;offset=0}else if(length===undefined&&typeof offset==="string"){encoding=offset;length=this.length;offset=0}else if(isFinite(offset)){offset=offset>>>0;if(isFinite(length)){length=length>>>0;if(encoding===undefined)encoding="utf8"}else{encoding=length;length=undefined}}else{throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported")}var remaining=this.length-offset;if(length===undefined||length>remaining)length=remaining;if(string.length>0&&(length<0||offset<0)||offset>this.length){throw new RangeError("Attempt to write outside buffer bounds")}if(!encoding)encoding="utf8";var loweredCase=false;for(;;){switch(encoding){case"hex":return hexWrite(this,string,offset,length);case"utf8":case"utf-8":return utf8Write(this,string,offset,length);case"ascii":return asciiWrite(this,string,offset,length);case"latin1":case"binary":return latin1Write(this,string,offset,length);case"base64":return base64Write(this,string,offset,length);case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return ucs2Write(this,string,offset,length);default:if(loweredCase)throw new TypeError("Unknown encoding: "+encoding);encoding=(""+encoding).toLowerCase();loweredCase=true}}};Buffer.prototype.toJSON=function toJSON(){return{type:"Buffer",data:Array.prototype.slice.call(this._arr||this,0)}};function base64Slice(buf,start,end){if(start===0&&end===buf.length){return base64.fromByteArray(buf)}else{return base64.fromByteArray(buf.slice(start,end))}}function utf8Slice(buf,start,end){end=Math.min(buf.length,end);var res=[];var i=start;while(i<end){var firstByte=buf[i];var codePoint=null;var bytesPerSequence=firstByte>239?4:firstByte>223?3:firstByte>191?2:1;if(i+bytesPerSequence<=end){var secondByte,thirdByte,fourthByte,tempCodePoint;switch(bytesPerSequence){case 1:if(firstByte<128){codePoint=firstByte}break;case 2:secondByte=buf[i+1];if((secondByte&192)===128){tempCodePoint=(firstByte&31)<<6|secondByte&63;if(tempCodePoint>127){codePoint=tempCodePoint}}break;case 3:secondByte=buf[i+1];thirdByte=buf[i+2];if((secondByte&192)===128&&(thirdByte&192)===128){tempCodePoint=(firstByte&15)<<12|(secondByte&63)<<6|thirdByte&63;if(tempCodePoint>2047&&(tempCodePoint<55296||tempCodePoint>57343)){codePoint=tempCodePoint}}break;case 4:secondByte=buf[i+1];thirdByte=buf[i+2];fourthByte=buf[i+3];if((secondByte&192)===128&&(thirdByte&192)===128&&(fourthByte&192)===128){tempCodePoint=(firstByte&15)<<18|(secondByte&63)<<12|(thirdByte&63)<<6|fourthByte&63;if(tempCodePoint>65535&&tempCodePoint<1114112){codePoint=tempCodePoint}}}}if(codePoint===null){codePoint=65533;bytesPerSequence=1}else if(codePoint>65535){codePoint-=65536;res.push(codePoint>>>10&1023|55296);codePoint=56320|codePoint&1023}res.push(codePoint);i+=bytesPerSequence}return decodeCodePointsArray(res)}var MAX_ARGUMENTS_LENGTH=4096;function decodeCodePointsArray(codePoints){var len=codePoints.length;if(len<=MAX_ARGUMENTS_LENGTH){return String.fromCharCode.apply(String,codePoints)}var res="";var i=0;while(i<len){res+=String.fromCharCode.apply(String,codePoints.slice(i,i+=MAX_ARGUMENTS_LENGTH))}return res}function asciiSlice(buf,start,end){var ret="";end=Math.min(buf.length,end);for(var i=start;i<end;++i){ret+=String.fromCharCode(buf[i]&127)}return ret}function latin1Slice(buf,start,end){var ret="";end=Math.min(buf.length,end);for(var i=start;i<end;++i){ret+=String.fromCharCode(buf[i])}return ret}function hexSlice(buf,start,end){var len=buf.length;if(!start||start<0)start=0;if(!end||end<0||end>len)end=len;var out="";for(var i=start;i<end;++i){out+=toHex(buf[i])}return out}function utf16leSlice(buf,start,end){var bytes=buf.slice(start,end);var res="";for(var i=0;i<bytes.length;i+=2){res+=String.fromCharCode(bytes[i]+bytes[i+1]*256)}return res}Buffer.prototype.slice=function slice(start,end){var len=this.length;start=~~start;end=end===undefined?len:~~end;if(start<0){start+=len;if(start<0)start=0}else if(start>len){start=len}if(end<0){end+=len;if(end<0)end=0}else if(end>len){end=len}if(end<start)end=start;var newBuf=this.subarray(start,end);newBuf.__proto__=Buffer.prototype;return newBuf};function checkOffset(offset,ext,length){if(offset%1!==0||offset<0)throw new RangeError("offset is not uint");if(offset+ext>length)throw new RangeError("Trying to access beyond buffer length")}Buffer.prototype.readUIntLE=function readUIntLE(offset,byteLength,noAssert){offset=offset>>>0;byteLength=byteLength>>>0;if(!noAssert)checkOffset(offset,byteLength,this.length);var val=this[offset];var mul=1;var i=0;while(++i<byteLength&&(mul*=256)){val+=this[offset+i]*mul}return val};Buffer.prototype.readUIntBE=function readUIntBE(offset,byteLength,noAssert){offset=offset>>>0;byteLength=byteLength>>>0;if(!noAssert){checkOffset(offset,byteLength,this.length)}var val=this[offset+--byteLength];var mul=1;while(byteLength>0&&(mul*=256)){val+=this[offset+--byteLength]*mul}return val};Buffer.prototype.readUInt8=function readUInt8(offset,noAssert){offset=offset>>>0;if(!noAssert)checkOffset(offset,1,this.length);return this[offset]};Buffer.prototype.readUInt16LE=function readUInt16LE(offset,noAssert){offset=offset>>>0;if(!noAssert)checkOffset(offset,2,this.length);return this[offset]|this[offset+1]<<8};Buffer.prototype.readUInt16BE=function readUInt16BE(offset,noAssert){offset=offset>>>0;if(!noAssert)checkOffset(offset,2,this.length);return this[offset]<<8|this[offset+1]};Buffer.prototype.readUInt32LE=function readUInt32LE(offset,noAssert){offset=offset>>>0;if(!noAssert)checkOffset(offset,4,this.length);return(this[offset]|this[offset+1]<<8|this[offset+2]<<16)+this[offset+3]*16777216};Buffer.prototype.readUInt32BE=function readUInt32BE(offset,noAssert){offset=offset>>>0;if(!noAssert)checkOffset(offset,4,this.length);return this[offset]*16777216+(this[offset+1]<<16|this[offset+2]<<8|this[offset+3])};Buffer.prototype.readIntLE=function readIntLE(offset,byteLength,noAssert){offset=offset>>>0;byteLength=byteLength>>>0;if(!noAssert)checkOffset(offset,byteLength,this.length);var val=this[offset];var mul=1;var i=0;while(++i<byteLength&&(mul*=256)){val+=this[offset+i]*mul}mul*=128;if(val>=mul)val-=Math.pow(2,8*byteLength);return val};Buffer.prototype.readIntBE=function readIntBE(offset,byteLength,noAssert){offset=offset>>>0;byteLength=byteLength>>>0;if(!noAssert)checkOffset(offset,byteLength,this.length);var i=byteLength;var mul=1;var val=this[offset+--i];while(i>0&&(mul*=256)){val+=this[offset+--i]*mul}mul*=128;if(val>=mul)val-=Math.pow(2,8*byteLength);return val};Buffer.prototype.readInt8=function readInt8(offset,noAssert){offset=offset>>>0;if(!noAssert)checkOffset(offset,1,this.length);if(!(this[offset]&128))return this[offset];return(255-this[offset]+1)*-1};Buffer.prototype.readInt16LE=function readInt16LE(offset,noAssert){offset=offset>>>0;if(!noAssert)checkOffset(offset,2,this.length);var val=this[offset]|this[offset+1]<<8;return val&32768?val|4294901760:val};Buffer.prototype.readInt16BE=function readInt16BE(offset,noAssert){offset=offset>>>0;if(!noAssert)checkOffset(offset,2,this.length);var val=this[offset+1]|this[offset]<<8;return val&32768?val|4294901760:val};Buffer.prototype.readInt32LE=function readInt32LE(offset,noAssert){offset=offset>>>0;if(!noAssert)checkOffset(offset,4,this.length);return this[offset]|this[offset+1]<<8|this[offset+2]<<16|this[offset+3]<<24};Buffer.prototype.readInt32BE=function readInt32BE(offset,noAssert){offset=offset>>>0;if(!noAssert)checkOffset(offset,4,this.length);return this[offset]<<24|this[offset+1]<<16|this[offset+2]<<8|this[offset+3]};Buffer.prototype.readFloatLE=function readFloatLE(offset,noAssert){offset=offset>>>0;if(!noAssert)checkOffset(offset,4,this.length);return ieee754.read(this,offset,true,23,4)};Buffer.prototype.readFloatBE=function readFloatBE(offset,noAssert){offset=offset>>>0;if(!noAssert)checkOffset(offset,4,this.length);return ieee754.read(this,offset,false,23,4)};Buffer.prototype.readDoubleLE=function readDoubleLE(offset,noAssert){offset=offset>>>0;if(!noAssert)checkOffset(offset,8,this.length);return ieee754.read(this,offset,true,52,8)};Buffer.prototype.readDoubleBE=function readDoubleBE(offset,noAssert){offset=offset>>>0;if(!noAssert)checkOffset(offset,8,this.length);return ieee754.read(this,offset,false,52,8)};function checkInt(buf,value,offset,ext,max,min){if(!Buffer.isBuffer(buf))throw new TypeError('"buffer" argument must be a Buffer instance');if(value>max||value<min)throw new RangeError('"value" argument is out of bounds');if(offset+ext>buf.length)throw new RangeError("Index out of range")}Buffer.prototype.writeUIntLE=function writeUIntLE(value,offset,byteLength,noAssert){value=+value;offset=offset>>>0;byteLength=byteLength>>>0;if(!noAssert){var maxBytes=Math.pow(2,8*byteLength)-1;checkInt(this,value,offset,byteLength,maxBytes,0)}var mul=1;var i=0;this[offset]=value&255;while(++i<byteLength&&(mul*=256)){this[offset+i]=value/mul&255}return offset+byteLength};Buffer.prototype.writeUIntBE=function writeUIntBE(value,offset,byteLength,noAssert){value=+value;offset=offset>>>0;byteLength=byteLength>>>0;if(!noAssert){var maxBytes=Math.pow(2,8*byteLength)-1;checkInt(this,value,offset,byteLength,maxBytes,0)}var i=byteLength-1;var mul=1;this[offset+i]=value&255;while(--i>=0&&(mul*=256)){this[offset+i]=value/mul&255}return offset+byteLength};Buffer.prototype.writeUInt8=function writeUInt8(value,offset,noAssert){value=+value;offset=offset>>>0;if(!noAssert)checkInt(this,value,offset,1,255,0);this[offset]=value&255;return offset+1};Buffer.prototype.writeUInt16LE=function writeUInt16LE(value,offset,noAssert){value=+value;offset=offset>>>0;if(!noAssert)checkInt(this,value,offset,2,65535,0);this[offset]=value&255;this[offset+1]=value>>>8;return offset+2};Buffer.prototype.writeUInt16BE=function writeUInt16BE(value,offset,noAssert){value=+value;offset=offset>>>0;if(!noAssert)checkInt(this,value,offset,2,65535,0);this[offset]=value>>>8;this[offset+1]=value&255;return offset+2};Buffer.prototype.writeUInt32LE=function writeUInt32LE(value,offset,noAssert){value=+value;offset=offset>>>0;if(!noAssert)checkInt(this,value,offset,4,4294967295,0);this[offset+3]=value>>>24;this[offset+2]=value>>>16;this[offset+1]=value>>>8;this[offset]=value&255;return offset+4};Buffer.prototype.writeUInt32BE=function writeUInt32BE(value,offset,noAssert){value=+value;offset=offset>>>0;if(!noAssert)checkInt(this,value,offset,4,4294967295,0);this[offset]=value>>>24;this[offset+1]=value>>>16;this[offset+2]=value>>>8;this[offset+3]=value&255;return offset+4};Buffer.prototype.writeIntLE=function writeIntLE(value,offset,byteLength,noAssert){value=+value;offset=offset>>>0;if(!noAssert){var limit=Math.pow(2,8*byteLength-1);checkInt(this,value,offset,byteLength,limit-1,-limit)}var i=0;var mul=1;var sub=0;this[offset]=value&255;while(++i<byteLength&&(mul*=256)){if(value<0&&sub===0&&this[offset+i-1]!==0){sub=1}this[offset+i]=(value/mul>>0)-sub&255}return offset+byteLength};Buffer.prototype.writeIntBE=function writeIntBE(value,offset,byteLength,noAssert){value=+value;offset=offset>>>0;if(!noAssert){var limit=Math.pow(2,8*byteLength-1);checkInt(this,value,offset,byteLength,limit-1,-limit)}var i=byteLength-1;var mul=1;var sub=0;this[offset+i]=value&255;while(--i>=0&&(mul*=256)){if(value<0&&sub===0&&this[offset+i+1]!==0){sub=1}this[offset+i]=(value/mul>>0)-sub&255}return offset+byteLength};Buffer.prototype.writeInt8=function writeInt8(value,offset,noAssert){value=+value;offset=offset>>>0;if(!noAssert)checkInt(this,value,offset,1,127,-128);if(value<0)value=255+value+1;this[offset]=value&255;return offset+1};Buffer.prototype.writeInt16LE=function writeInt16LE(value,offset,noAssert){value=+value;offset=offset>>>0;if(!noAssert)checkInt(this,value,offset,2,32767,-32768);this[offset]=value&255;this[offset+1]=value>>>8;return offset+2};Buffer.prototype.writeInt16BE=function writeInt16BE(value,offset,noAssert){value=+value;offset=offset>>>0;if(!noAssert)checkInt(this,value,offset,2,32767,-32768);this[offset]=value>>>8;this[offset+1]=value&255;return offset+2};Buffer.prototype.writeInt32LE=function writeInt32LE(value,offset,noAssert){value=+value;offset=offset>>>0;if(!noAssert)checkInt(this,value,offset,4,2147483647,-2147483648);this[offset]=value&255;this[offset+1]=value>>>8;this[offset+2]=value>>>16;this[offset+3]=value>>>24;return offset+4};Buffer.prototype.writeInt32BE=function writeInt32BE(value,offset,noAssert){value=+value;offset=offset>>>0;if(!noAssert)checkInt(this,value,offset,4,2147483647,-2147483648);if(value<0)value=4294967295+value+1;this[offset]=value>>>24;this[offset+1]=value>>>16;this[offset+2]=value>>>8;this[offset+3]=value&255;return offset+4};function checkIEEE754(buf,value,offset,ext,max,min){if(offset+ext>buf.length)throw new RangeError("Index out of range");if(offset<0)throw new RangeError("Index out of range")}function writeFloat(buf,value,offset,littleEndian,noAssert){value=+value;offset=offset>>>0;if(!noAssert){checkIEEE754(buf,value,offset,4,34028234663852886e22,-34028234663852886e22)}ieee754.write(buf,value,offset,littleEndian,23,4);return offset+4}Buffer.prototype.writeFloatLE=function writeFloatLE(value,offset,noAssert){return writeFloat(this,value,offset,true,noAssert)};Buffer.prototype.writeFloatBE=function writeFloatBE(value,offset,noAssert){return writeFloat(this,value,offset,false,noAssert)};function writeDouble(buf,value,offset,littleEndian,noAssert){value=+value;offset=offset>>>0;if(!noAssert){checkIEEE754(buf,value,offset,8,17976931348623157e292,-17976931348623157e292)}ieee754.write(buf,value,offset,littleEndian,52,8);return offset+8}Buffer.prototype.writeDoubleLE=function writeDoubleLE(value,offset,noAssert){return writeDouble(this,value,offset,true,noAssert)};Buffer.prototype.writeDoubleBE=function writeDoubleBE(value,offset,noAssert){return writeDouble(this,value,offset,false,noAssert)};Buffer.prototype.copy=function copy(target,targetStart,start,end){if(!Buffer.isBuffer(target))throw new TypeError("argument should be a Buffer");if(!start)start=0;if(!end&&end!==0)end=this.length;if(targetStart>=target.length)targetStart=target.length;if(!targetStart)targetStart=0;if(end>0&&end<start)end=start;if(end===start)return 0;if(target.length===0||this.length===0)return 0;if(targetStart<0){throw new RangeError("targetStart out of bounds")}if(start<0||start>=this.length)throw new RangeError("Index out of range");if(end<0)throw new RangeError("sourceEnd out of bounds");if(end>this.length)end=this.length;if(target.length-targetStart<end-start){end=target.length-targetStart+start}var len=end-start;if(this===target&&typeof Uint8Array.prototype.copyWithin==="function"){this.copyWithin(targetStart,start,end)}else if(this===target&&start<targetStart&&targetStart<end){for(var i=len-1;i>=0;--i){target[i+targetStart]=this[i+start]}}else{Uint8Array.prototype.set.call(target,this.subarray(start,end),targetStart)}return len};Buffer.prototype.fill=function fill(val,start,end,encoding){if(typeof val==="string"){if(typeof start==="string"){encoding=start;start=0;end=this.length}else if(typeof end==="string"){encoding=end;end=this.length}if(encoding!==undefined&&typeof encoding!=="string"){throw new TypeError("encoding must be a string")}if(typeof encoding==="string"&&!Buffer.isEncoding(encoding)){throw new TypeError("Unknown encoding: "+encoding)}if(val.length===1){var code=val.charCodeAt(0);if(encoding==="utf8"&&code<128||encoding==="latin1"){val=code}}}else if(typeof val==="number"){val=val&255}if(start<0||this.length<start||this.length<end){throw new RangeError("Out of range index")}if(end<=start){return this}start=start>>>0;end=end===undefined?this.length:end>>>0;if(!val)val=0;var i;if(typeof val==="number"){for(i=start;i<end;++i){this[i]=val}}else{var bytes=Buffer.isBuffer(val)?val:Buffer.from(val,encoding);var len=bytes.length;if(len===0){throw new TypeError('The value "'+val+'" is invalid for argument "value"')}for(i=0;i<end-start;++i){this[i+start]=bytes[i%len]}}return this};var INVALID_BASE64_RE=/[^+/0-9A-Za-z-_]/g;function base64clean(str){str=str.split("=")[0];str=str.trim().replace(INVALID_BASE64_RE,"");if(str.length<2)return"";while(str.length%4!==0){str=str+"="}return str}function toHex(n){if(n<16)return"0"+n.toString(16);return n.toString(16)}function utf8ToBytes(string,units){units=units||Infinity;var codePoint;var length=string.length;var leadSurrogate=null;var bytes=[];for(var i=0;i<length;++i){codePoint=string.charCodeAt(i);if(codePoint>55295&&codePoint<57344){if(!leadSurrogate){if(codePoint>56319){if((units-=3)>-1)bytes.push(239,191,189);continue}else if(i+1===length){if((units-=3)>-1)bytes.push(239,191,189);continue}leadSurrogate=codePoint;continue}if(codePoint<56320){if((units-=3)>-1)bytes.push(239,191,189);leadSurrogate=codePoint;continue}codePoint=(leadSurrogate-55296<<10|codePoint-56320)+65536}else if(leadSurrogate){if((units-=3)>-1)bytes.push(239,191,189)}leadSurrogate=null;if(codePoint<128){if((units-=1)<0)break;bytes.push(codePoint)}else if(codePoint<2048){if((units-=2)<0)break;bytes.push(codePoint>>6|192,codePoint&63|128)}else if(codePoint<65536){if((units-=3)<0)break;bytes.push(codePoint>>12|224,codePoint>>6&63|128,codePoint&63|128)}else if(codePoint<1114112){if((units-=4)<0)break;bytes.push(codePoint>>18|240,codePoint>>12&63|128,codePoint>>6&63|128,codePoint&63|128)}else{throw new Error("Invalid code point")}}return bytes}function asciiToBytes(str){var byteArray=[];for(var i=0;i<str.length;++i){byteArray.push(str.charCodeAt(i)&255)}return byteArray}function utf16leToBytes(str,units){var c,hi,lo;var byteArray=[];for(var i=0;i<str.length;++i){if((units-=2)<0)break;c=str.charCodeAt(i);hi=c>>8;lo=c%256;byteArray.push(lo);byteArray.push(hi)}return byteArray}function base64ToBytes(str){return base64.toByteArray(base64clean(str))}function blitBuffer(src,dst,offset,length){for(var i=0;i<length;++i){if(i+offset>=dst.length||i>=src.length)break;dst[i+offset]=src[i]}return i}function isInstance(obj,type){return obj instanceof type||obj!=null&&obj.constructor!=null&&obj.constructor.name!=null&&obj.constructor.name===type.name}function numberIsNaN(obj){return obj!==obj}}).call(this,require("buffer").Buffer)},{"base64-js":3,buffer:5,ieee754:35}],6:[function(require,module,exports){var ElementType=require("domelementtype");var entities=require("entities");var unencodedElements={__proto__:null,style:true,script:true,xmp:true,iframe:true,noembed:true,noframes:true,plaintext:true,noscript:true};function formatAttrs(attributes,opts){if(!attributes)return;var output="",value;for(var key in attributes){value=attributes[key];if(output){output+=" "}output+=key;if(value!==null&&value!==""||opts.xmlMode){output+='="'+(opts.decodeEntities?entities.encodeXML(value):value)+'"'}}return output}var singleTag={__proto__:null,area:true,base:true,basefont:true,br:true,col:true,command:true,embed:true,frame:true,hr:true,img:true,input:true,isindex:true,keygen:true,link:true,meta:true,param:true,source:true,track:true,wbr:true};var render=module.exports=function(dom,opts){if(!Array.isArray(dom)&&!dom.cheerio)dom=[dom];opts=opts||{};var output="";for(var i=0;i<dom.length;i++){var elem=dom[i];if(elem.type==="root")output+=render(elem.children,opts);else if(ElementType.isTag(elem))output+=renderTag(elem,opts);else if(elem.type===ElementType.Directive)output+=renderDirective(elem);else if(elem.type===ElementType.Comment)output+=renderComment(elem);else if(elem.type===ElementType.CDATA)output+=renderCdata(elem);else output+=renderText(elem,opts)}return output};function renderTag(elem,opts){if(elem.name==="svg")opts={decodeEntities:opts.decodeEntities,xmlMode:true};var tag="<"+elem.name,attribs=formatAttrs(elem.attribs,opts);if(attribs){tag+=" "+attribs}if(opts.xmlMode&&(!elem.children||elem.children.length===0)){tag+="/>"}else{tag+=">";if(elem.children){tag+=render(elem.children,opts)}if(!singleTag[elem.name]||opts.xmlMode){tag+="</"+elem.name+">"}}return tag}function renderDirective(elem){return"<"+elem.data+">"}function renderText(elem,opts){var data=elem.data||"";if(opts.decodeEntities&&!(elem.parent&&elem.parent.name in unencodedElements)){data=entities.encodeXML(data)}return data}function renderCdata(elem){return"<![CDATA["+elem.children[0].data+"]]>"}function renderComment(elem){return"\x3c!--"+elem.data+"--\x3e"}},{domelementtype:7,entities:18}],7:[function(require,module,exports){module.exports={Text:"text",Directive:"directive",Comment:"comment",Script:"script",Style:"style",Tag:"tag",CDATA:"cdata",Doctype:"doctype",isTag:function(elem){return elem.type==="tag"||elem.type==="script"||elem.type==="style"}}},{}],8:[function(require,module,exports){var ElementType=require("domelementtype");var re_whitespace=/\s+/g;var NodePrototype=require("./lib/node");var ElementPrototype=require("./lib/element");function DomHandler(callback,options,elementCB){if(typeof callback==="object"){elementCB=options;options=callback;callback=null}else if(typeof options==="function"){elementCB=options;options=defaultOpts}this._callback=callback;this._options=options||defaultOpts;this._elementCB=elementCB;this.dom=[];this._done=false;this._tagStack=[];this._parser=this._parser||null}var defaultOpts={normalizeWhitespace:false,withStartIndices:false,withEndIndices:false};DomHandler.prototype.onparserinit=function(parser){this._parser=parser};DomHandler.prototype.onreset=function(){DomHandler.call(this,this._callback,this._options,this._elementCB)};DomHandler.prototype.onend=function(){if(this._done)return;this._done=true;this._parser=null;this._handleCallback(null)};DomHandler.prototype._handleCallback=DomHandler.prototype.onerror=function(error){if(typeof this._callback==="function"){this._callback(error,this.dom)}else{if(error)throw error}};DomHandler.prototype.onclosetag=function(){var elem=this._tagStack.pop();if(this._options.withEndIndices&&elem){elem.endIndex=this._parser.endIndex}if(this._elementCB)this._elementCB(elem)};DomHandler.prototype._createDomElement=function(properties){if(!this._options.withDomLvl1)return properties;var element;if(properties.type==="tag"){element=Object.create(ElementPrototype)}else{element=Object.create(NodePrototype)}for(var key in properties){if(properties.hasOwnProperty(key)){element[key]=properties[key]}}return element};DomHandler.prototype._addDomElement=function(element){var parent=this._tagStack[this._tagStack.length-1];var siblings=parent?parent.children:this.dom;var previousSibling=siblings[siblings.length-1];element.next=null;if(this._options.withStartIndices){element.startIndex=this._parser.startIndex}if(this._options.withEndIndices){element.endIndex=this._parser.endIndex}if(previousSibling){element.prev=previousSibling;previousSibling.next=element}else{element.prev=null}siblings.push(element);element.parent=parent||null};DomHandler.prototype.onopentag=function(name,attribs){var properties={type:name==="script"?ElementType.Script:name==="style"?ElementType.Style:ElementType.Tag,name:name,attribs:attribs,children:[]};var element=this._createDomElement(properties);this._addDomElement(element);this._tagStack.push(element)};DomHandler.prototype.ontext=function(data){var normalize=this._options.normalizeWhitespace||this._options.ignoreWhitespace;var lastTag;if(!this._tagStack.length&&this.dom.length&&(lastTag=this.dom[this.dom.length-1]).type===ElementType.Text){if(normalize){lastTag.data=(lastTag.data+data).replace(re_whitespace," ")}else{lastTag.data+=data}}else{if(this._tagStack.length&&(lastTag=this._tagStack[this._tagStack.length-1])&&(lastTag=lastTag.children[lastTag.children.length-1])&&lastTag.type===ElementType.Text){if(normalize){lastTag.data=(lastTag.data+data).replace(re_whitespace," ")}else{lastTag.data+=data}}else{if(normalize){data=data.replace(re_whitespace," ")}var element=this._createDomElement({data:data,type:ElementType.Text});this._addDomElement(element)}}};DomHandler.prototype.oncomment=function(data){var lastTag=this._tagStack[this._tagStack.length-1];if(lastTag&&lastTag.type===ElementType.Comment){lastTag.data+=data;return}var properties={data:data,type:ElementType.Comment};var element=this._createDomElement(properties);this._addDomElement(element);this._tagStack.push(element)};DomHandler.prototype.oncdatastart=function(){var properties={children:[{data:"",type:ElementType.Text}],type:ElementType.CDATA};var element=this._createDomElement(properties);this._addDomElement(element);this._tagStack.push(element)};DomHandler.prototype.oncommentend=DomHandler.prototype.oncdataend=function(){this._tagStack.pop()};DomHandler.prototype.onprocessinginstruction=function(name,data){var element=this._createDomElement({name:name,data:data,type:ElementType.Directive});this._addDomElement(element)};module.exports=DomHandler},{"./lib/element":9,"./lib/node":10,domelementtype:7}],9:[function(require,module,exports){var NodePrototype=require("./node");var ElementPrototype=module.exports=Object.create(NodePrototype);var domLvl1={tagName:"name"};Object.keys(domLvl1).forEach(function(key){var shorthand=domLvl1[key];Object.defineProperty(ElementPrototype,key,{get:function(){return this[shorthand]||null},set:function(val){this[shorthand]=val;return val}})})},{"./node":10}],10:[function(require,module,exports){var NodePrototype=module.exports={get firstChild(){var children=this.children;return children&&children[0]||null},get lastChild(){var children=this.children;return children&&children[children.length-1]||null},get nodeType(){return nodeTypes[this.type]||nodeTypes.element}};var domLvl1={tagName:"name",childNodes:"children",parentNode:"parent",previousSibling:"prev",nextSibling:"next",nodeValue:"data"};var nodeTypes={element:1,text:3,cdata:4,comment:8};Object.keys(domLvl1).forEach(function(key){var shorthand=domLvl1[key];Object.defineProperty(NodePrototype,key,{get:function(){return this[shorthand]||null},set:function(val){this[shorthand]=val;return val}})})},{}],11:[function(require,module,exports){var DomUtils=module.exports;[require("./lib/stringify"),require("./lib/traversal"),require("./lib/manipulation"),require("./lib/querying"),require("./lib/legacy"),require("./lib/helpers")].forEach(function(ext){Object.keys(ext).forEach(function(key){DomUtils[key]=ext[key].bind(DomUtils)})})},{"./lib/helpers":12,"./lib/legacy":13,"./lib/manipulation":14,"./lib/querying":15,"./lib/stringify":16,"./lib/traversal":17}],12:[function(require,module,exports){exports.removeSubsets=function(nodes){var idx=nodes.length,node,ancestor,replace;while(--idx>-1){node=ancestor=nodes[idx];nodes[idx]=null;replace=true;while(ancestor){if(nodes.indexOf(ancestor)>-1){replace=false;nodes.splice(idx,1);break}ancestor=ancestor.parent}if(replace){nodes[idx]=node}}return nodes};var POSITION={DISCONNECTED:1,PRECEDING:2,FOLLOWING:4,CONTAINS:8,CONTAINED_BY:16};var comparePos=exports.compareDocumentPosition=function(nodeA,nodeB){var aParents=[];var bParents=[];var current,sharedParent,siblings,aSibling,bSibling,idx;if(nodeA===nodeB){return 0}current=nodeA;while(current){aParents.unshift(current);current=current.parent}current=nodeB;while(current){bParents.unshift(current);current=current.parent}idx=0;while(aParents[idx]===bParents[idx]){idx++}if(idx===0){return POSITION.DISCONNECTED}sharedParent=aParents[idx-1];siblings=sharedParent.children;aSibling=aParents[idx];bSibling=bParents[idx];if(siblings.indexOf(aSibling)>siblings.indexOf(bSibling)){if(sharedParent===nodeB){return POSITION.FOLLOWING|POSITION.CONTAINED_BY}return POSITION.FOLLOWING}else{if(sharedParent===nodeA){return POSITION.PRECEDING|POSITION.CONTAINS}return POSITION.PRECEDING}};exports.uniqueSort=function(nodes){var idx=nodes.length,node,position;nodes=nodes.slice();while(--idx>-1){node=nodes[idx];position=nodes.indexOf(node);if(position>-1&&position<idx){nodes.splice(idx,1)}}nodes.sort(function(a,b){var relative=comparePos(a,b);if(relative&POSITION.PRECEDING){return-1}else if(relative&POSITION.FOLLOWING){return 1}return 0});return nodes}},{}],13:[function(require,module,exports){var ElementType=require("domelementtype");var isTag=exports.isTag=ElementType.isTag;exports.testElement=function(options,element){for(var key in options){if(!options.hasOwnProperty(key));else if(key==="tag_name"){if(!isTag(element)||!options.tag_name(element.name)){return false}}else if(key==="tag_type"){if(!options.tag_type(element.type))return false}else if(key==="tag_contains"){if(isTag(element)||!options.tag_contains(element.data)){return false}}else if(!element.attribs||!options[key](element.attribs[key])){return false}}return true};var Checks={tag_name:function(name){if(typeof name==="function"){return function(elem){return isTag(elem)&&name(elem.name)}}else if(name==="*"){return isTag}else{return function(elem){return isTag(elem)&&elem.name===name}}},tag_type:function(type){if(typeof type==="function"){return function(elem){return type(elem.type)}}else{return function(elem){return elem.type===type}}},tag_contains:function(data){if(typeof data==="function"){return function(elem){return!isTag(elem)&&data(elem.data)}}else{return function(elem){return!isTag(elem)&&elem.data===data}}}};function getAttribCheck(attrib,value){if(typeof value==="function"){return function(elem){return elem.attribs&&value(elem.attribs[attrib])}}else{return function(elem){return elem.attribs&&elem.attribs[attrib]===value}}}function combineFuncs(a,b){return function(elem){return a(elem)||b(elem)}}exports.getElements=function(options,element,recurse,limit){var funcs=Object.keys(options).map(function(key){var value=options[key];return key in Checks?Checks[key](value):getAttribCheck(key,value)});return funcs.length===0?[]:this.filter(funcs.reduce(combineFuncs),element,recurse,limit)};exports.getElementById=function(id,element,recurse){if(!Array.isArray(element))element=[element];return this.findOne(getAttribCheck("id",id),element,recurse!==false)};exports.getElementsByTagName=function(name,element,recurse,limit){return this.filter(Checks.tag_name(name),element,recurse,limit)};exports.getElementsByTagType=function(type,element,recurse,limit){return this.filter(Checks.tag_type(type),element,recurse,limit)}},{domelementtype:7}],14:[function(require,module,exports){exports.removeElement=function(elem){if(elem.prev)elem.prev.next=elem.next;if(elem.next)elem.next.prev=elem.prev;if(elem.parent){var childs=elem.parent.children;childs.splice(childs.lastIndexOf(elem),1)}};exports.replaceElement=function(elem,replacement){var prev=replacement.prev=elem.prev;if(prev){prev.next=replacement}var next=replacement.next=elem.next;if(next){next.prev=replacement}var parent=replacement.parent=elem.parent;if(parent){var childs=parent.children;childs[childs.lastIndexOf(elem)]=replacement}};exports.appendChild=function(elem,child){child.parent=elem;if(elem.children.push(child)!==1){var sibling=elem.children[elem.children.length-2];sibling.next=child;child.prev=sibling;child.next=null}};exports.append=function(elem,next){var parent=elem.parent,currNext=elem.next;next.next=currNext;next.prev=elem;elem.next=next;next.parent=parent;if(currNext){currNext.prev=next;if(parent){var childs=parent.children;childs.splice(childs.lastIndexOf(currNext),0,next)}}else if(parent){parent.children.push(next)}};exports.prepend=function(elem,prev){var parent=elem.parent;if(parent){var childs=parent.children;childs.splice(childs.lastIndexOf(elem),0,prev)}if(elem.prev){elem.prev.next=prev}prev.parent=parent;prev.prev=elem.prev;prev.next=elem;elem.prev=prev}},{}],15:[function(require,module,exports){var isTag=require("domelementtype").isTag;module.exports={filter:filter,find:find,findOneChild:findOneChild,findOne:findOne,existsOne:existsOne,findAll:findAll};function filter(test,element,recurse,limit){if(!Array.isArray(element))element=[element];if(typeof limit!=="number"||!isFinite(limit)){limit=Infinity}return find(test,element,recurse!==false,limit)}function find(test,elems,recurse,limit){var result=[],childs;for(var i=0,j=elems.length;i<j;i++){if(test(elems[i])){result.push(elems[i]);if(--limit<=0)break}childs=elems[i].children;if(recurse&&childs&&childs.length>0){childs=find(test,childs,recurse,limit);result=result.concat(childs);limit-=childs.length;if(limit<=0)break}}return result}function findOneChild(test,elems){for(var i=0,l=elems.length;i<l;i++){if(test(elems[i]))return elems[i]}return null}function findOne(test,elems){var elem=null;for(var i=0,l=elems.length;i<l&&!elem;i++){if(!isTag(elems[i])){continue}else if(test(elems[i])){elem=elems[i]}else if(elems[i].children.length>0){elem=findOne(test,elems[i].children)}}return elem}function existsOne(test,elems){for(var i=0,l=elems.length;i<l;i++){if(isTag(elems[i])&&(test(elems[i])||elems[i].children.length>0&&existsOne(test,elems[i].children))){return true}}return false}function findAll(test,rootElems){var result=[];var stack=rootElems.slice();while(stack.length){var elem=stack.shift();if(!isTag(elem))continue;if(elem.children&&elem.children.length>0){stack.unshift.apply(stack,elem.children)}if(test(elem))result.push(elem)}return result}},{domelementtype:7}],16:[function(require,module,exports){var ElementType=require("domelementtype"),getOuterHTML=require("dom-serializer"),isTag=ElementType.isTag;module.exports={getInnerHTML:getInnerHTML,getOuterHTML:getOuterHTML,getText:getText};function getInnerHTML(elem,opts){return elem.children?elem.children.map(function(elem){return getOuterHTML(elem,opts)}).join(""):""}function getText(elem){if(Array.isArray(elem))return elem.map(getText).join("");if(isTag(elem))return elem.name==="br"?"\n":getText(elem.children);if(elem.type===ElementType.CDATA)return getText(elem.children);if(elem.type===ElementType.Text)return elem.data;return""}},{"dom-serializer":6,domelementtype:7}],17:[function(require,module,exports){var getChildren=exports.getChildren=function(elem){return elem.children};var getParent=exports.getParent=function(elem){return elem.parent};exports.getSiblings=function(elem){var parent=getParent(elem);return parent?getChildren(parent):[elem]};exports.getAttributeValue=function(elem,name){return elem.attribs&&elem.attribs[name]};exports.hasAttrib=function(elem,name){return!!elem.attribs&&hasOwnProperty.call(elem.attribs,name)};exports.getName=function(elem){return elem.name}},{}],18:[function(require,module,exports){var encode=require("./lib/encode.js"),decode=require("./lib/decode.js");exports.decode=function(data,level){return(!level||level<=0?decode.XML:decode.HTML)(data)};exports.decodeStrict=function(data,level){return(!level||level<=0?decode.XML:decode.HTMLStrict)(data)};exports.encode=function(data,level){return(!level||level<=0?encode.XML:encode.HTML)(data)};exports.encodeXML=encode.XML;exports.encodeHTML4=exports.encodeHTML5=exports.encodeHTML=encode.HTML;exports.decodeXML=exports.decodeXMLStrict=decode.XML;exports.decodeHTML4=exports.decodeHTML5=exports.decodeHTML=decode.HTML;exports.decodeHTML4Strict=exports.decodeHTML5Strict=exports.decodeHTMLStrict=decode.HTMLStrict;exports.escape=encode.escape},{"./lib/decode.js":19,"./lib/encode.js":21}],19:[function(require,module,exports){var entityMap=require("../maps/entities.json"),legacyMap=require("../maps/legacy.json"),xmlMap=require("../maps/xml.json"),decodeCodePoint=require("./decode_codepoint.js");var decodeXMLStrict=getStrictDecoder(xmlMap),decodeHTMLStrict=getStrictDecoder(entityMap);function getStrictDecoder(map){var keys=Object.keys(map).join("|"),replace=getReplacer(map);keys+="|#[xX][\\da-fA-F]+|#\\d+";var re=new RegExp("&(?:"+keys+");","g");return function(str){return String(str).replace(re,replace)}}var decodeHTML=function(){var legacy=Object.keys(legacyMap).sort(sorter);var keys=Object.keys(entityMap).sort(sorter);for(var i=0,j=0;i<keys.length;i++){if(legacy[j]===keys[i]){keys[i]+=";?";j++}else{keys[i]+=";"}}var re=new RegExp("&(?:"+keys.join("|")+"|#[xX][\\da-fA-F]+;?|#\\d+;?)","g"),replace=getReplacer(entityMap);function replacer(str){if(str.substr(-1)!==";")str+=";";return replace(str)}return function(str){return String(str).replace(re,replacer)}}();function sorter(a,b){return a<b?1:-1}function getReplacer(map){return function replace(str){if(str.charAt(1)==="#"){if(str.charAt(2)==="X"||str.charAt(2)==="x"){return decodeCodePoint(parseInt(str.substr(3),16))}return decodeCodePoint(parseInt(str.substr(2),10))}return map[str.slice(1,-1)]}}module.exports={XML:decodeXMLStrict,HTML:decodeHTML,HTMLStrict:decodeHTMLStrict}},{"../maps/entities.json":23,"../maps/legacy.json":24,"../maps/xml.json":25,"./decode_codepoint.js":20}],20:[function(require,module,exports){var decodeMap=require("../maps/decode.json");module.exports=decodeCodePoint;function decodeCodePoint(codePoint){if(codePoint>=55296&&codePoint<=57343||codePoint>1114111){return"�"}if(codePoint in decodeMap){codePoint=decodeMap[codePoint]}var output="";if(codePoint>65535){codePoint-=65536;output+=String.fromCharCode(codePoint>>>10&1023|55296);codePoint=56320|codePoint&1023}output+=String.fromCharCode(codePoint);return output}},{"../maps/decode.json":22}],21:[function(require,module,exports){var inverseXML=getInverseObj(require("../maps/xml.json")),xmlReplacer=getInverseReplacer(inverseXML);exports.XML=getInverse(inverseXML,xmlReplacer);var inverseHTML=getInverseObj(require("../maps/entities.json")),htmlReplacer=getInverseReplacer(inverseHTML);exports.HTML=getInverse(inverseHTML,htmlReplacer);function getInverseObj(obj){return Object.keys(obj).sort().reduce(function(inverse,name){inverse[obj[name]]="&"+name+";";return inverse},{})}function getInverseReplacer(inverse){var single=[],multiple=[];Object.keys(inverse).forEach(function(k){if(k.length===1){single.push("\\"+k)}else{multiple.push(k)}});multiple.unshift("["+single.join("")+"]");return new RegExp(multiple.join("|"),"g")}var re_nonASCII=/[^\0-\x7F]/g,re_astralSymbols=/[\uD800-\uDBFF][\uDC00-\uDFFF]/g;function singleCharReplacer(c){return"&#x"+c.charCodeAt(0).toString(16).toUpperCase()+";"}function astralReplacer(c){var high=c.charCodeAt(0);var low=c.charCodeAt(1);var codePoint=(high-55296)*1024+low-56320+65536;return"&#x"+codePoint.toString(16).toUpperCase()+";"}function getInverse(inverse,re){function func(name){return inverse[name]}return function(data){return data.replace(re,func).replace(re_astralSymbols,astralReplacer).replace(re_nonASCII,singleCharReplacer)}}var re_xmlChars=getInverseReplacer(inverseXML);function escapeXML(data){return data.replace(re_xmlChars,singleCharReplacer).replace(re_astralSymbols,astralReplacer).replace(re_nonASCII,singleCharReplacer)}exports.escape=escapeXML},{"../maps/entities.json":23,"../maps/xml.json":25}],22:[function(require,module,exports){module.exports={0:65533,128:8364,130:8218,131:402,132:8222,133:8230,134:8224,135:8225,136:710,137:8240,138:352,139:8249,140:338,142:381,145:8216,146:8217,147:8220,148:8221,149:8226,150:8211,151:8212,152:732,153:8482,154:353,155:8250,156:339,158:382,159:376}},{}],23:[function(require,module,exports){module.exports={Aacute:"Á",aacute:"á",Abreve:"Ă",abreve:"ă",ac:"∾",acd:"∿",acE:"∾̳",Acirc:"Â",acirc:"â",acute:"´",Acy:"А",acy:"а",AElig:"Æ",aelig:"æ",af:"⁡",Afr:"𝔄",afr:"𝔞",Agrave:"À",agrave:"à",alefsym:"ℵ",aleph:"ℵ",Alpha:"Α",alpha:"α",Amacr:"Ā",amacr:"ā",amalg:"⨿",amp:"&",AMP:"&",andand:"⩕",And:"⩓",and:"∧",andd:"⩜",andslope:"⩘",andv:"⩚",ang:"∠",ange:"⦤",angle:"∠",angmsdaa:"⦨",angmsdab:"⦩",angmsdac:"⦪",angmsdad:"⦫",angmsdae:"⦬",angmsdaf:"⦭",angmsdag:"⦮",angmsdah:"⦯",angmsd:"∡",angrt:"∟",angrtvb:"⊾",angrtvbd:"⦝",angsph:"∢",angst:"Å",angzarr:"⍼",Aogon:"Ą",aogon:"ą",Aopf:"𝔸",aopf:"𝕒",apacir:"⩯",ap:"≈",apE:"⩰",ape:"≊",apid:"≋",apos:"'",ApplyFunction:"⁡",approx:"≈",approxeq:"≊",Aring:"Å",aring:"å",Ascr:"𝒜",ascr:"𝒶",Assign:"≔",ast:"*",asymp:"≈",asympeq:"≍",Atilde:"Ã",atilde:"ã",Auml:"Ä",auml:"ä",awconint:"∳",awint:"⨑",backcong:"≌",backepsilon:"϶",backprime:"‵",backsim:"∽",backsimeq:"⋍",Backslash:"∖",Barv:"⫧",barvee:"⊽",barwed:"⌅",Barwed:"⌆",barwedge:"⌅",bbrk:"⎵",bbrktbrk:"⎶",bcong:"≌",Bcy:"Б",bcy:"б",bdquo:"„",becaus:"∵",because:"∵",Because:"∵",bemptyv:"⦰",bepsi:"϶",bernou:"ℬ",Bernoullis:"ℬ",Beta:"Β",beta:"β",beth:"ℶ",between:"≬",Bfr:"𝔅",bfr:"𝔟",bigcap:"⋂",bigcirc:"◯",bigcup:"⋃",bigodot:"⨀",bigoplus:"⨁",bigotimes:"⨂",bigsqcup:"⨆",bigstar:"★",bigtriangledown:"▽",bigtriangleup:"△",biguplus:"⨄",bigvee:"⋁",bigwedge:"⋀",bkarow:"⤍",blacklozenge:"⧫",blacksquare:"▪",blacktriangle:"▴",blacktriangledown:"▾",blacktriangleleft:"◂",blacktriangleright:"▸",blank:"␣",blk12:"▒",blk14:"░",blk34:"▓",block:"█",bne:"=⃥",bnequiv:"≡⃥",bNot:"⫭",bnot:"⌐",Bopf:"𝔹",bopf:"𝕓",bot:"⊥",bottom:"⊥",bowtie:"⋈",boxbox:"⧉",boxdl:"┐",boxdL:"╕",boxDl:"╖",boxDL:"╗",boxdr:"┌",boxdR:"╒",boxDr:"╓",boxDR:"╔",boxh:"─",boxH:"═",boxhd:"┬",boxHd:"╤",boxhD:"╥",boxHD:"╦",boxhu:"┴",boxHu:"╧",boxhU:"╨",boxHU:"╩",boxminus:"⊟",boxplus:"⊞",boxtimes:"⊠",boxul:"┘",boxuL:"╛",boxUl:"╜",boxUL:"╝",boxur:"└",boxuR:"╘",boxUr:"╙",boxUR:"╚",boxv:"│",boxV:"║",boxvh:"┼",boxvH:"╪",boxVh:"╫",boxVH:"╬",boxvl:"┤",boxvL:"╡",boxVl:"╢",boxVL:"╣",boxvr:"├",boxvR:"╞",boxVr:"╟",boxVR:"╠",bprime:"‵",breve:"˘",Breve:"˘",brvbar:"¦",bscr:"𝒷",Bscr:"ℬ",bsemi:"⁏",bsim:"∽",bsime:"⋍",bsolb:"⧅",bsol:"\\",bsolhsub:"⟈",bull:"•",bullet:"•",bump:"≎",bumpE:"⪮",bumpe:"≏",Bumpeq:"≎",bumpeq:"≏",Cacute:"Ć",cacute:"ć",capand:"⩄",capbrcup:"⩉",capcap:"⩋",cap:"∩",Cap:"⋒",capcup:"⩇",capdot:"⩀",CapitalDifferentialD:"ⅅ",caps:"∩︀",caret:"⁁",caron:"ˇ",Cayleys:"ℭ",ccaps:"⩍",Ccaron:"Č",ccaron:"č",Ccedil:"Ç",ccedil:"ç",Ccirc:"Ĉ",ccirc:"ĉ",Cconint:"∰",ccups:"⩌",ccupssm:"⩐",Cdot:"Ċ",cdot:"ċ",cedil:"¸",Cedilla:"¸",cemptyv:"⦲",cent:"¢",centerdot:"·",CenterDot:"·",cfr:"𝔠",Cfr:"ℭ",CHcy:"Ч",chcy:"ч",check:"✓",checkmark:"✓",Chi:"Χ",chi:"χ",circ:"ˆ",circeq:"≗",circlearrowleft:"↺",circlearrowright:"↻",circledast:"⊛",circledcirc:"⊚",circleddash:"⊝",CircleDot:"⊙",circledR:"®",circledS:"Ⓢ",CircleMinus:"⊖",CirclePlus:"⊕",CircleTimes:"⊗",cir:"○",cirE:"⧃",cire:"≗",cirfnint:"⨐",cirmid:"⫯",cirscir:"⧂",ClockwiseContourIntegral:"∲",CloseCurlyDoubleQuote:"”",CloseCurlyQuote:"’",clubs:"♣",clubsuit:"♣",colon:":",Colon:"∷",Colone:"⩴",colone:"≔",coloneq:"≔",comma:",",commat:"@",comp:"∁",compfn:"∘",complement:"∁",complexes:"ℂ",cong:"≅",congdot:"⩭",Congruent:"≡",conint:"∮",Conint:"∯",ContourIntegral:"∮",copf:"𝕔",Copf:"ℂ",coprod:"∐",Coproduct:"∐",copy:"©",COPY:"©",copysr:"℗",CounterClockwiseContourIntegral:"∳",crarr:"↵",cross:"✗",Cross:"⨯",Cscr:"𝒞",cscr:"𝒸",csub:"⫏",csube:"⫑",csup:"⫐",csupe:"⫒",ctdot:"⋯",cudarrl:"⤸",cudarrr:"⤵",cuepr:"⋞",cuesc:"⋟",cularr:"↶",cularrp:"⤽",cupbrcap:"⩈",cupcap:"⩆",CupCap:"≍",cup:"∪",Cup:"⋓",cupcup:"⩊",cupdot:"⊍",cupor:"⩅",cups:"∪︀",curarr:"↷",curarrm:"⤼",curlyeqprec:"⋞",curlyeqsucc:"⋟",curlyvee:"⋎",curlywedge:"⋏",curren:"¤",curvearrowleft:"↶",curvearrowright:"↷",cuvee:"⋎",cuwed:"⋏",cwconint:"∲",cwint:"∱",cylcty:"⌭",dagger:"†",Dagger:"‡",daleth:"ℸ",darr:"↓",Darr:"↡",dArr:"⇓",dash:"‐",Dashv:"⫤",dashv:"⊣",dbkarow:"⤏",dblac:"˝",Dcaron:"Ď",dcaron:"ď",Dcy:"Д",dcy:"д",ddagger:"‡",ddarr:"⇊",DD:"ⅅ",dd:"ⅆ",DDotrahd:"⤑",ddotseq:"⩷",deg:"°",Del:"∇",Delta:"Δ",delta:"δ",demptyv:"⦱",dfisht:"⥿",Dfr:"𝔇",dfr:"𝔡",dHar:"⥥",dharl:"⇃",dharr:"⇂",DiacriticalAcute:"´",DiacriticalDot:"˙",DiacriticalDoubleAcute:"˝",DiacriticalGrave:"`",DiacriticalTilde:"˜",diam:"⋄",diamond:"⋄",Diamond:"⋄",diamondsuit:"♦",diams:"♦",die:"¨",DifferentialD:"ⅆ",digamma:"ϝ",disin:"⋲",div:"÷",divide:"÷",divideontimes:"⋇",divonx:"⋇",DJcy:"Ђ",djcy:"ђ",dlcorn:"⌞",dlcrop:"⌍",dollar:"$",Dopf:"𝔻",dopf:"𝕕",Dot:"¨",dot:"˙",DotDot:"⃜",doteq:"≐",doteqdot:"≑",DotEqual:"≐",dotminus:"∸",dotplus:"∔",dotsquare:"⊡",doublebarwedge:"⌆",DoubleContourIntegral:"∯",DoubleDot:"¨",DoubleDownArrow:"⇓",DoubleLeftArrow:"⇐",DoubleLeftRightArrow:"⇔",DoubleLeftTee:"⫤",DoubleLongLeftArrow:"⟸",DoubleLongLeftRightArrow:"⟺",DoubleLongRightArrow:"⟹",DoubleRightArrow:"⇒",DoubleRightTee:"⊨",DoubleUpArrow:"⇑",DoubleUpDownArrow:"⇕",DoubleVerticalBar:"∥",DownArrowBar:"⤓",downarrow:"↓",DownArrow:"↓",Downarrow:"⇓",DownArrowUpArrow:"⇵",DownBreve:"̑",downdownarrows:"⇊",downharpoonleft:"⇃",downharpoonright:"⇂",DownLeftRightVector:"⥐",DownLeftTeeVector:"⥞",DownLeftVectorBar:"⥖",DownLeftVector:"↽",DownRightTeeVector:"⥟",DownRightVectorBar:"⥗",DownRightVector:"⇁",DownTeeArrow:"↧",DownTee:"⊤",drbkarow:"⤐",drcorn:"⌟",drcrop:"⌌",Dscr:"𝒟",dscr:"𝒹",DScy:"Ѕ",dscy:"ѕ",dsol:"⧶",Dstrok:"Đ",dstrok:"đ",dtdot:"⋱",dtri:"▿",dtrif:"▾",duarr:"⇵",duhar:"⥯",dwangle:"⦦",DZcy:"Џ",dzcy:"џ",dzigrarr:"⟿",Eacute:"É",eacute:"é",easter:"⩮",Ecaron:"Ě",ecaron:"ě",Ecirc:"Ê",ecirc:"ê",ecir:"≖",ecolon:"≕",Ecy:"Э",ecy:"э",eDDot:"⩷",Edot:"Ė",edot:"ė",eDot:"≑",ee:"ⅇ",efDot:"≒",Efr:"𝔈",efr:"𝔢",eg:"⪚",Egrave:"È",egrave:"è",egs:"⪖",egsdot:"⪘",el:"⪙",Element:"∈",elinters:"⏧",ell:"ℓ",els:"⪕",elsdot:"⪗",Emacr:"Ē",emacr:"ē",empty:"∅",emptyset:"∅",EmptySmallSquare:"◻",emptyv:"∅",EmptyVerySmallSquare:"▫",emsp13:" ",emsp14:" ",emsp:" ",ENG:"Ŋ",eng:"ŋ",ensp:" ",Eogon:"Ę",eogon:"ę",Eopf:"𝔼",eopf:"𝕖",epar:"⋕",eparsl:"⧣",eplus:"⩱",epsi:"ε",Epsilon:"Ε",epsilon:"ε",epsiv:"ϵ",eqcirc:"≖",eqcolon:"≕",eqsim:"≂",eqslantgtr:"⪖",eqslantless:"⪕",Equal:"⩵",equals:"=",EqualTilde:"≂",equest:"≟",Equilibrium:"⇌",equiv:"≡",equivDD:"⩸",eqvparsl:"⧥",erarr:"⥱",erDot:"≓",escr:"ℯ",Escr:"ℰ",esdot:"≐",Esim:"⩳",esim:"≂",Eta:"Η",eta:"η",ETH:"Ð",eth:"ð",Euml:"Ë",euml:"ë",euro:"€",excl:"!",exist:"∃",Exists:"∃",expectation:"ℰ",exponentiale:"ⅇ",ExponentialE:"ⅇ",fallingdotseq:"≒",Fcy:"Ф",fcy:"ф",female:"♀",ffilig:"ﬃ",fflig:"ﬀ",ffllig:"ﬄ",Ffr:"𝔉",ffr:"𝔣",filig:"ﬁ",FilledSmallSquare:"◼",FilledVerySmallSquare:"▪",fjlig:"fj",flat:"♭",fllig:"ﬂ",fltns:"▱",fnof:"ƒ",Fopf:"𝔽",fopf:"𝕗",forall:"∀",ForAll:"∀",fork:"⋔",forkv:"⫙",Fouriertrf:"ℱ",fpartint:"⨍",frac12:"½",frac13:"⅓",frac14:"¼",frac15:"⅕",frac16:"⅙",frac18:"⅛",frac23:"⅔",frac25:"⅖",frac34:"¾",frac35:"⅗",frac38:"⅜",frac45:"⅘",frac56:"⅚",frac58:"⅝",frac78:"⅞",frasl:"⁄",frown:"⌢",fscr:"𝒻",Fscr:"ℱ",gacute:"ǵ",Gamma:"Γ",gamma:"γ",Gammad:"Ϝ",gammad:"ϝ",gap:"⪆",Gbreve:"Ğ",gbreve:"ğ",Gcedil:"Ģ",Gcirc:"Ĝ",gcirc:"ĝ",Gcy:"Г",gcy:"г",Gdot:"Ġ",gdot:"ġ",ge:"≥",gE:"≧",gEl:"⪌",gel:"⋛",geq:"≥",geqq:"≧",geqslant:"⩾",gescc:"⪩",ges:"⩾",gesdot:"⪀",gesdoto:"⪂",gesdotol:"⪄",gesl:"⋛︀",gesles:"⪔",Gfr:"𝔊",gfr:"𝔤",gg:"≫",Gg:"⋙",ggg:"⋙",gimel:"ℷ",GJcy:"Ѓ",gjcy:"ѓ",gla:"⪥",gl:"≷",glE:"⪒",glj:"⪤",gnap:"⪊",gnapprox:"⪊",gne:"⪈",gnE:"≩",gneq:"⪈",gneqq:"≩",gnsim:"⋧",Gopf:"𝔾",gopf:"𝕘",grave:"`",GreaterEqual:"≥",GreaterEqualLess:"⋛",GreaterFullEqual:"≧",GreaterGreater:"⪢",GreaterLess:"≷",GreaterSlantEqual:"⩾",GreaterTilde:"≳",Gscr:"𝒢",gscr:"ℊ",gsim:"≳",gsime:"⪎",gsiml:"⪐",gtcc:"⪧",gtcir:"⩺",gt:">",GT:">",Gt:"≫",gtdot:"⋗",gtlPar:"⦕",gtquest:"⩼",gtrapprox:"⪆",gtrarr:"⥸",gtrdot:"⋗",gtreqless:"⋛",gtreqqless:"⪌",gtrless:"≷",gtrsim:"≳",gvertneqq:"≩︀",gvnE:"≩︀",Hacek:"ˇ",hairsp:" ",half:"½",hamilt:"ℋ",HARDcy:"Ъ",hardcy:"ъ",harrcir:"⥈",harr:"↔",hArr:"⇔",harrw:"↭",Hat:"^",hbar:"ℏ",Hcirc:"Ĥ",hcirc:"ĥ",hearts:"♥",heartsuit:"♥",hellip:"…",hercon:"⊹",hfr:"𝔥",Hfr:"ℌ",HilbertSpace:"ℋ",hksearow:"⤥",hkswarow:"⤦",hoarr:"⇿",homtht:"∻",hookleftarrow:"↩",hookrightarrow:"↪",hopf:"𝕙",Hopf:"ℍ",horbar:"―",HorizontalLine:"─",hscr:"𝒽",Hscr:"ℋ",hslash:"ℏ",Hstrok:"Ħ",hstrok:"ħ",HumpDownHump:"≎",HumpEqual:"≏",hybull:"⁃",hyphen:"‐",Iacute:"Í",iacute:"í",ic:"⁣",Icirc:"Î",icirc:"î",Icy:"И",icy:"и",Idot:"İ",IEcy:"Е",iecy:"е",iexcl:"¡",iff:"⇔",ifr:"𝔦",Ifr:"ℑ",Igrave:"Ì",igrave:"ì",ii:"ⅈ",iiiint:"⨌",iiint:"∭",iinfin:"⧜",iiota:"℩",IJlig:"Ĳ",ijlig:"ĳ",Imacr:"Ī",imacr:"ī",image:"ℑ",ImaginaryI:"ⅈ",imagline:"ℐ",imagpart:"ℑ",imath:"ı",Im:"ℑ",imof:"⊷",imped:"Ƶ",Implies:"⇒",incare:"℅",in:"∈",infin:"∞",infintie:"⧝",inodot:"ı",intcal:"⊺",int:"∫",Int:"∬",integers:"ℤ",Integral:"∫",intercal:"⊺",Intersection:"⋂",intlarhk:"⨗",intprod:"⨼",InvisibleComma:"⁣",InvisibleTimes:"⁢",IOcy:"Ё",iocy:"ё",Iogon:"Į",iogon:"į",Iopf:"𝕀",iopf:"𝕚",Iota:"Ι",iota:"ι",iprod:"⨼",iquest:"¿",iscr:"𝒾",Iscr:"ℐ",isin:"∈",isindot:"⋵",isinE:"⋹",isins:"⋴",isinsv:"⋳",isinv:"∈",it:"⁢",Itilde:"Ĩ",itilde:"ĩ",Iukcy:"І",iukcy:"і",Iuml:"Ï",iuml:"ï",Jcirc:"Ĵ",jcirc:"ĵ",Jcy:"Й",jcy:"й",Jfr:"𝔍",jfr:"𝔧",jmath:"ȷ",Jopf:"𝕁",jopf:"𝕛",Jscr:"𝒥",jscr:"𝒿",Jsercy:"Ј",jsercy:"ј",Jukcy:"Є",jukcy:"є",Kappa:"Κ",kappa:"κ",kappav:"ϰ",Kcedil:"Ķ",kcedil:"ķ",Kcy:"К",kcy:"к",Kfr:"𝔎",kfr:"𝔨",kgreen:"ĸ",KHcy:"Х",khcy:"х",KJcy:"Ќ",kjcy:"ќ",Kopf:"𝕂",kopf:"𝕜",Kscr:"𝒦",kscr:"𝓀",lAarr:"⇚",Lacute:"Ĺ",lacute:"ĺ",laemptyv:"⦴",lagran:"ℒ",Lambda:"Λ",lambda:"λ",lang:"⟨",Lang:"⟪",langd:"⦑",langle:"⟨",lap:"⪅",Laplacetrf:"ℒ",laquo:"«",larrb:"⇤",larrbfs:"⤟",larr:"←",Larr:"↞",lArr:"⇐",larrfs:"⤝",larrhk:"↩",larrlp:"↫",larrpl:"⤹",larrsim:"⥳",larrtl:"↢",latail:"⤙",lAtail:"⤛",lat:"⪫",late:"⪭",lates:"⪭︀",lbarr:"⤌",lBarr:"⤎",lbbrk:"❲",lbrace:"{",lbrack:"[",lbrke:"⦋",lbrksld:"⦏",lbrkslu:"⦍",Lcaron:"Ľ",lcaron:"ľ",Lcedil:"Ļ",lcedil:"ļ",lceil:"⌈",lcub:"{",Lcy:"Л",lcy:"л",ldca:"⤶",ldquo:"“",ldquor:"„",ldrdhar:"⥧",ldrushar:"⥋",ldsh:"↲",le:"≤",lE:"≦",LeftAngleBracket:"⟨",LeftArrowBar:"⇤",leftarrow:"←",LeftArrow:"←",Leftarrow:"⇐",LeftArrowRightArrow:"⇆",leftarrowtail:"↢",LeftCeiling:"⌈",LeftDoubleBracket:"⟦",LeftDownTeeVector:"⥡",LeftDownVectorBar:"⥙",LeftDownVector:"⇃",LeftFloor:"⌊",leftharpoondown:"↽",leftharpoonup:"↼",leftleftarrows:"⇇",leftrightarrow:"↔",LeftRightArrow:"↔",Leftrightarrow:"⇔",leftrightarrows:"⇆",leftrightharpoons:"⇋",leftrightsquigarrow:"↭",LeftRightVector:"⥎",LeftTeeArrow:"↤",LeftTee:"⊣",LeftTeeVector:"⥚",leftthreetimes:"⋋",LeftTriangleBar:"⧏",LeftTriangle:"⊲",LeftTriangleEqual:"⊴",LeftUpDownVector:"⥑",LeftUpTeeVector:"⥠",LeftUpVectorBar:"⥘",LeftUpVector:"↿",LeftVectorBar:"⥒",LeftVector:"↼",lEg:"⪋",leg:"⋚",leq:"≤",leqq:"≦",leqslant:"⩽",lescc:"⪨",les:"⩽",lesdot:"⩿",lesdoto:"⪁",lesdotor:"⪃",lesg:"⋚︀",lesges:"⪓",lessapprox:"⪅",lessdot:"⋖",lesseqgtr:"⋚",lesseqqgtr:"⪋",LessEqualGreater:"⋚",LessFullEqual:"≦",LessGreater:"≶",lessgtr:"≶",LessLess:"⪡",lesssim:"≲",LessSlantEqual:"⩽",LessTilde:"≲",lfisht:"⥼",lfloor:"⌊",Lfr:"𝔏",lfr:"𝔩",lg:"≶",lgE:"⪑",lHar:"⥢",lhard:"↽",lharu:"↼",lharul:"⥪",lhblk:"▄",LJcy:"Љ",ljcy:"љ",llarr:"⇇",ll:"≪",Ll:"⋘",llcorner:"⌞",Lleftarrow:"⇚",llhard:"⥫",lltri:"◺",Lmidot:"Ŀ",lmidot:"ŀ",lmoustache:"⎰",lmoust:"⎰",lnap:"⪉",lnapprox:"⪉",lne:"⪇",lnE:"≨",lneq:"⪇",lneqq:"≨",lnsim:"⋦",loang:"⟬",loarr:"⇽",lobrk:"⟦",longleftarrow:"⟵",LongLeftArrow:"⟵",Longleftarrow:"⟸",longleftrightarrow:"⟷",LongLeftRightArrow:"⟷",Longleftrightarrow:"⟺",longmapsto:"⟼",longrightarrow:"⟶",LongRightArrow:"⟶",Longrightarrow:"⟹",looparrowleft:"↫",looparrowright:"↬",lopar:"⦅",Lopf:"𝕃",lopf:"𝕝",loplus:"⨭",lotimes:"⨴",lowast:"∗",lowbar:"_",LowerLeftArrow:"↙",LowerRightArrow:"↘",loz:"◊",lozenge:"◊",lozf:"⧫",lpar:"(",lparlt:"⦓",lrarr:"⇆",lrcorner:"⌟",lrhar:"⇋",lrhard:"⥭",lrm:"‎",lrtri:"⊿",lsaquo:"‹",lscr:"𝓁",Lscr:"ℒ",lsh:"↰",Lsh:"↰",lsim:"≲",lsime:"⪍",lsimg:"⪏",lsqb:"[",lsquo:"‘",lsquor:"‚",Lstrok:"Ł",lstrok:"ł",ltcc:"⪦",ltcir:"⩹",lt:"<",LT:"<",Lt:"≪",ltdot:"⋖",lthree:"⋋",ltimes:"⋉",ltlarr:"⥶",ltquest:"⩻",ltri:"◃",ltrie:"⊴",ltrif:"◂",ltrPar:"⦖",lurdshar:"⥊",luruhar:"⥦",lvertneqq:"≨︀",lvnE:"≨︀",macr:"¯",male:"♂",malt:"✠",maltese:"✠",Map:"⤅",map:"↦",mapsto:"↦",mapstodown:"↧",mapstoleft:"↤",mapstoup:"↥",marker:"▮",mcomma:"⨩",Mcy:"М",mcy:"м",mdash:"—",mDDot:"∺",measuredangle:"∡",MediumSpace:" ",Mellintrf:"ℳ",Mfr:"𝔐",mfr:"𝔪",mho:"℧",micro:"µ",midast:"*",midcir:"⫰",mid:"∣",middot:"·",minusb:"⊟",minus:"−",minusd:"∸",minusdu:"⨪",MinusPlus:"∓",mlcp:"⫛",mldr:"…",mnplus:"∓",models:"⊧",Mopf:"𝕄",mopf:"𝕞",mp:"∓",mscr:"𝓂",Mscr:"ℳ",mstpos:"∾",Mu:"Μ",mu:"μ",multimap:"⊸",mumap:"⊸",nabla:"∇",Nacute:"Ń",nacute:"ń",nang:"∠⃒",nap:"≉",napE:"⩰̸",napid:"≋̸",napos:"ŉ",napprox:"≉",natural:"♮",naturals:"ℕ",natur:"♮",nbsp:" ",nbump:"≎̸",nbumpe:"≏̸",ncap:"⩃",Ncaron:"Ň",ncaron:"ň",Ncedil:"Ņ",ncedil:"ņ",ncong:"≇",ncongdot:"⩭̸",ncup:"⩂",Ncy:"Н",ncy:"н",ndash:"–",nearhk:"⤤",nearr:"↗",neArr:"⇗",nearrow:"↗",ne:"≠",nedot:"≐̸",NegativeMediumSpace:"​",NegativeThickSpace:"​",NegativeThinSpace:"​",NegativeVeryThinSpace:"​",nequiv:"≢",nesear:"⤨",nesim:"≂̸",NestedGreaterGreater:"≫",NestedLessLess:"≪",NewLine:"\n",nexist:"∄",nexists:"∄",Nfr:"𝔑",nfr:"𝔫",ngE:"≧̸",nge:"≱",ngeq:"≱",ngeqq:"≧̸",ngeqslant:"⩾̸",nges:"⩾̸",nGg:"⋙̸",ngsim:"≵",nGt:"≫⃒",ngt:"≯",ngtr:"≯",nGtv:"≫̸",nharr:"↮",nhArr:"⇎",nhpar:"⫲",ni:"∋",nis:"⋼",nisd:"⋺",niv:"∋",NJcy:"Њ",njcy:"њ",nlarr:"↚",nlArr:"⇍",nldr:"‥",nlE:"≦̸",nle:"≰",nleftarrow:"↚",nLeftarrow:"⇍",nleftrightarrow:"↮",nLeftrightarrow:"⇎",nleq:"≰",nleqq:"≦̸",nleqslant:"⩽̸",nles:"⩽̸",nless:"≮",nLl:"⋘̸",nlsim:"≴",nLt:"≪⃒",nlt:"≮",nltri:"⋪",nltrie:"⋬",nLtv:"≪̸",nmid:"∤",NoBreak:"⁠",NonBreakingSpace:" ",nopf:"𝕟",Nopf:"ℕ",Not:"⫬",not:"¬",NotCongruent:"≢",NotCupCap:"≭",NotDoubleVerticalBar:"∦",NotElement:"∉",NotEqual:"≠",NotEqualTilde:"≂̸",NotExists:"∄",NotGreater:"≯",NotGreaterEqual:"≱",NotGreaterFullEqual:"≧̸",NotGreaterGreater:"≫̸",NotGreaterLess:"≹",NotGreaterSlantEqual:"⩾̸",NotGreaterTilde:"≵",NotHumpDownHump:"≎̸",NotHumpEqual:"≏̸",notin:"∉",notindot:"⋵̸",notinE:"⋹̸",notinva:"∉",notinvb:"⋷",notinvc:"⋶",NotLeftTriangleBar:"⧏̸",NotLeftTriangle:"⋪",NotLeftTriangleEqual:"⋬",NotLess:"≮",NotLessEqual:"≰",NotLessGreater:"≸",NotLessLess:"≪̸",NotLessSlantEqual:"⩽̸",NotLessTilde:"≴",NotNestedGreaterGreater:"⪢̸",NotNestedLessLess:"⪡̸",notni:"∌",notniva:"∌",notnivb:"⋾",notnivc:"⋽",NotPrecedes:"⊀",NotPrecedesEqual:"⪯̸",NotPrecedesSlantEqual:"⋠",NotReverseElement:"∌",NotRightTriangleBar:"⧐̸",NotRightTriangle:"⋫",NotRightTriangleEqual:"⋭",NotSquareSubset:"⊏̸",NotSquareSubsetEqual:"⋢",NotSquareSuperset:"⊐̸",NotSquareSupersetEqual:"⋣",NotSubset:"⊂⃒",NotSubsetEqual:"⊈",NotSucceeds:"⊁",NotSucceedsEqual:"⪰̸",NotSucceedsSlantEqual:"⋡",NotSucceedsTilde:"≿̸",NotSuperset:"⊃⃒",NotSupersetEqual:"⊉",NotTilde:"≁",NotTildeEqual:"≄",NotTildeFullEqual:"≇",NotTildeTilde:"≉",NotVerticalBar:"∤",nparallel:"∦",npar:"∦",nparsl:"⫽⃥",npart:"∂̸",npolint:"⨔",npr:"⊀",nprcue:"⋠",nprec:"⊀",npreceq:"⪯̸",npre:"⪯̸",nrarrc:"⤳̸",nrarr:"↛",nrArr:"⇏",nrarrw:"↝̸",nrightarrow:"↛",nRightarrow:"⇏",nrtri:"⋫",nrtrie:"⋭",nsc:"⊁",nsccue:"⋡",nsce:"⪰̸",Nscr:"𝒩",nscr:"𝓃",nshortmid:"∤",nshortparallel:"∦",nsim:"≁",nsime:"≄",nsimeq:"≄",nsmid:"∤",nspar:"∦",nsqsube:"⋢",nsqsupe:"⋣",nsub:"⊄",nsubE:"⫅̸",nsube:"⊈",nsubset:"⊂⃒",nsubseteq:"⊈",nsubseteqq:"⫅̸",nsucc:"⊁",nsucceq:"⪰̸",nsup:"⊅",nsupE:"⫆̸",nsupe:"⊉",nsupset:"⊃⃒",nsupseteq:"⊉",nsupseteqq:"⫆̸",ntgl:"≹",Ntilde:"Ñ",ntilde:"ñ",ntlg:"≸",ntriangleleft:"⋪",ntrianglelefteq:"⋬",ntriangleright:"⋫",ntrianglerighteq:"⋭",Nu:"Ν",nu:"ν",num:"#",numero:"№",numsp:" ",nvap:"≍⃒",nvdash:"⊬",nvDash:"⊭",nVdash:"⊮",nVDash:"⊯",nvge:"≥⃒",nvgt:">⃒",nvHarr:"⤄",nvinfin:"⧞",nvlArr:"⤂",nvle:"≤⃒",nvlt:"<⃒",nvltrie:"⊴⃒",nvrArr:"⤃",nvrtrie:"⊵⃒",nvsim:"∼⃒",nwarhk:"⤣",nwarr:"↖",nwArr:"⇖",nwarrow:"↖",nwnear:"⤧",Oacute:"Ó",oacute:"ó",oast:"⊛",Ocirc:"Ô",ocirc:"ô",ocir:"⊚",Ocy:"О",ocy:"о",odash:"⊝",Odblac:"Ő",odblac:"ő",odiv:"⨸",odot:"⊙",odsold:"⦼",OElig:"Œ",oelig:"œ",ofcir:"⦿",Ofr:"𝔒",ofr:"𝔬",ogon:"˛",Ograve:"Ò",ograve:"ò",ogt:"⧁",ohbar:"⦵",ohm:"Ω",oint:"∮",olarr:"↺",olcir:"⦾",olcross:"⦻",oline:"‾",olt:"⧀",Omacr:"Ō",omacr:"ō",Omega:"Ω",omega:"ω",Omicron:"Ο",omicron:"ο",omid:"⦶",ominus:"⊖",Oopf:"𝕆",oopf:"𝕠",opar:"⦷",OpenCurlyDoubleQuote:"“",OpenCurlyQuote:"‘",operp:"⦹",oplus:"⊕",orarr:"↻",Or:"⩔",or:"∨",ord:"⩝",order:"ℴ",orderof:"ℴ",ordf:"ª",ordm:"º",origof:"⊶",oror:"⩖",orslope:"⩗",orv:"⩛",oS:"Ⓢ",Oscr:"𝒪",oscr:"ℴ",Oslash:"Ø",oslash:"ø",osol:"⊘",Otilde:"Õ",otilde:"õ",otimesas:"⨶",Otimes:"⨷",otimes:"⊗",Ouml:"Ö",ouml:"ö",ovbar:"⌽",OverBar:"‾",OverBrace:"⏞",OverBracket:"⎴",OverParenthesis:"⏜",para:"¶",parallel:"∥",par:"∥",parsim:"⫳",parsl:"⫽",part:"∂",PartialD:"∂",Pcy:"П",pcy:"п",percnt:"%",period:".",permil:"‰",perp:"⊥",pertenk:"‱",Pfr:"𝔓",pfr:"𝔭",Phi:"Φ",phi:"φ",phiv:"ϕ",phmmat:"ℳ",phone:"☎",Pi:"Π",pi:"π",pitchfork:"⋔",piv:"ϖ",planck:"ℏ",planckh:"ℎ",plankv:"ℏ",plusacir:"⨣",plusb:"⊞",pluscir:"⨢",plus:"+",plusdo:"∔",plusdu:"⨥",pluse:"⩲",PlusMinus:"±",plusmn:"±",plussim:"⨦",plustwo:"⨧",pm:"±",Poincareplane:"ℌ",pointint:"⨕",popf:"𝕡",Popf:"ℙ",pound:"£",prap:"⪷",Pr:"⪻",pr:"≺",prcue:"≼",precapprox:"⪷",prec:"≺",preccurlyeq:"≼",Precedes:"≺",PrecedesEqual:"⪯",PrecedesSlantEqual:"≼",PrecedesTilde:"≾",preceq:"⪯",precnapprox:"⪹",precneqq:"⪵",precnsim:"⋨",pre:"⪯",prE:"⪳",precsim:"≾",prime:"′",Prime:"″",primes:"ℙ",prnap:"⪹",prnE:"⪵",prnsim:"⋨",prod:"∏",Product:"∏",profalar:"⌮",profline:"⌒",profsurf:"⌓",prop:"∝",Proportional:"∝",Proportion:"∷",propto:"∝",prsim:"≾",prurel:"⊰",Pscr:"𝒫",pscr:"𝓅",Psi:"Ψ",psi:"ψ",puncsp:" ",Qfr:"𝔔",qfr:"𝔮",qint:"⨌",qopf:"𝕢",Qopf:"ℚ",qprime:"⁗",Qscr:"𝒬",qscr:"𝓆",quaternions:"ℍ",quatint:"⨖",quest:"?",questeq:"≟",quot:'"',QUOT:'"',rAarr:"⇛",race:"∽̱",Racute:"Ŕ",racute:"ŕ",radic:"√",raemptyv:"⦳",rang:"⟩",Rang:"⟫",rangd:"⦒",range:"⦥",rangle:"⟩",raquo:"»",rarrap:"⥵",rarrb:"⇥",rarrbfs:"⤠",rarrc:"⤳",rarr:"→",Rarr:"↠",rArr:"⇒",rarrfs:"⤞",rarrhk:"↪",rarrlp:"↬",rarrpl:"⥅",rarrsim:"⥴",Rarrtl:"⤖",rarrtl:"↣",rarrw:"↝",ratail:"⤚",rAtail:"⤜",ratio:"∶",rationals:"ℚ",rbarr:"⤍",rBarr:"⤏",RBarr:"⤐",rbbrk:"❳",rbrace:"}",rbrack:"]",rbrke:"⦌",rbrksld:"⦎",rbrkslu:"⦐",Rcaron:"Ř",rcaron:"ř",Rcedil:"Ŗ",rcedil:"ŗ",rceil:"⌉",rcub:"}",Rcy:"Р",rcy:"р",rdca:"⤷",rdldhar:"⥩",rdquo:"”",rdquor:"”",rdsh:"↳",real:"ℜ",realine:"ℛ",realpart:"ℜ",reals:"ℝ",Re:"ℜ",rect:"▭",reg:"®",REG:"®",ReverseElement:"∋",ReverseEquilibrium:"⇋",ReverseUpEquilibrium:"⥯",rfisht:"⥽",rfloor:"⌋",rfr:"𝔯",Rfr:"ℜ",rHar:"⥤",rhard:"⇁",rharu:"⇀",rharul:"⥬",Rho:"Ρ",rho:"ρ",rhov:"ϱ",RightAngleBracket:"⟩",RightArrowBar:"⇥",rightarrow:"→",RightArrow:"→",Rightarrow:"⇒",RightArrowLeftArrow:"⇄",rightarrowtail:"↣",RightCeiling:"⌉",RightDoubleBracket:"⟧",RightDownTeeVector:"⥝",RightDownVectorBar:"⥕",RightDownVector:"⇂",RightFloor:"⌋",rightharpoondown:"⇁",rightharpoonup:"⇀",rightleftarrows:"⇄",rightleftharpoons:"⇌",rightrightarrows:"⇉",rightsquigarrow:"↝",RightTeeArrow:"↦",RightTee:"⊢",RightTeeVector:"⥛",rightthreetimes:"⋌",RightTriangleBar:"⧐",RightTriangle:"⊳",RightTriangleEqual:"⊵",RightUpDownVector:"⥏",RightUpTeeVector:"⥜",RightUpVectorBar:"⥔",RightUpVector:"↾",RightVectorBar:"⥓",RightVector:"⇀",ring:"˚",risingdotseq:"≓",rlarr:"⇄",rlhar:"⇌",rlm:"‏",rmoustache:"⎱",rmoust:"⎱",rnmid:"⫮",roang:"⟭",roarr:"⇾",robrk:"⟧",ropar:"⦆",ropf:"𝕣",Ropf:"ℝ",roplus:"⨮",rotimes:"⨵",RoundImplies:"⥰",rpar:")",rpargt:"⦔",rppolint:"⨒",rrarr:"⇉",Rrightarrow:"⇛",rsaquo:"›",rscr:"𝓇",Rscr:"ℛ",rsh:"↱",Rsh:"↱",rsqb:"]",rsquo:"’",rsquor:"’",rthree:"⋌",rtimes:"⋊",rtri:"▹",rtrie:"⊵",rtrif:"▸",rtriltri:"⧎",RuleDelayed:"⧴",ruluhar:"⥨",rx:"℞",Sacute:"Ś",sacute:"ś",sbquo:"‚",scap:"⪸",Scaron:"Š",scaron:"š",Sc:"⪼",sc:"≻",sccue:"≽",sce:"⪰",scE:"⪴",Scedil:"Ş",scedil:"ş",Scirc:"Ŝ",scirc:"ŝ",scnap:"⪺",scnE:"⪶",scnsim:"⋩",scpolint:"⨓",scsim:"≿",Scy:"С",scy:"с",sdotb:"⊡",sdot:"⋅",sdote:"⩦",searhk:"⤥",searr:"↘",seArr:"⇘",searrow:"↘",sect:"§",semi:";",seswar:"⤩",setminus:"∖",setmn:"∖",sext:"✶",Sfr:"𝔖",sfr:"𝔰",sfrown:"⌢",sharp:"♯",SHCHcy:"Щ",shchcy:"щ",SHcy:"Ш",shcy:"ш",ShortDownArrow:"↓",ShortLeftArrow:"←",shortmid:"∣",shortparallel:"∥",ShortRightArrow:"→",ShortUpArrow:"↑",shy:"­",Sigma:"Σ",sigma:"σ",sigmaf:"ς",sigmav:"ς",sim:"∼",simdot:"⩪",sime:"≃",simeq:"≃",simg:"⪞",simgE:"⪠",siml:"⪝",simlE:"⪟",simne:"≆",simplus:"⨤",simrarr:"⥲",slarr:"←",SmallCircle:"∘",smallsetminus:"∖",smashp:"⨳",smeparsl:"⧤",smid:"∣",smile:"⌣",smt:"⪪",smte:"⪬",smtes:"⪬︀",SOFTcy:"Ь",softcy:"ь",solbar:"⌿",solb:"⧄",sol:"/",Sopf:"𝕊",sopf:"𝕤",spades:"♠",spadesuit:"♠",spar:"∥",sqcap:"⊓",sqcaps:"⊓︀",sqcup:"⊔",sqcups:"⊔︀",Sqrt:"√",sqsub:"⊏",sqsube:"⊑",sqsubset:"⊏",sqsubseteq:"⊑",sqsup:"⊐",sqsupe:"⊒",sqsupset:"⊐",sqsupseteq:"⊒",square:"□",Square:"□",SquareIntersection:"⊓",SquareSubset:"⊏",SquareSubsetEqual:"⊑",SquareSuperset:"⊐",SquareSupersetEqual:"⊒",SquareUnion:"⊔",squarf:"▪",squ:"□",squf:"▪",srarr:"→",Sscr:"𝒮",sscr:"𝓈",ssetmn:"∖",ssmile:"⌣",sstarf:"⋆",Star:"⋆",star:"☆",starf:"★",straightepsilon:"ϵ",straightphi:"ϕ",strns:"¯",sub:"⊂",Sub:"⋐",subdot:"⪽",subE:"⫅",sube:"⊆",subedot:"⫃",submult:"⫁",subnE:"⫋",subne:"⊊",subplus:"⪿",subrarr:"⥹",subset:"⊂",Subset:"⋐",subseteq:"⊆",subseteqq:"⫅",SubsetEqual:"⊆",subsetneq:"⊊",subsetneqq:"⫋",subsim:"⫇",subsub:"⫕",subsup:"⫓",succapprox:"⪸",succ:"≻",succcurlyeq:"≽",Succeeds:"≻",SucceedsEqual:"⪰",SucceedsSlantEqual:"≽",SucceedsTilde:"≿",succeq:"⪰",succnapprox:"⪺",succneqq:"⪶",succnsim:"⋩",succsim:"≿",SuchThat:"∋",sum:"∑",Sum:"∑",sung:"♪",sup1:"¹",sup2:"²",sup3:"³",sup:"⊃",Sup:"⋑",supdot:"⪾",supdsub:"⫘",supE:"⫆",supe:"⊇",supedot:"⫄",Superset:"⊃",SupersetEqual:"⊇",suphsol:"⟉",suphsub:"⫗",suplarr:"⥻",supmult:"⫂",supnE:"⫌",supne:"⊋",supplus:"⫀",supset:"⊃",Supset:"⋑",supseteq:"⊇",supseteqq:"⫆",supsetneq:"⊋",supsetneqq:"⫌",supsim:"⫈",supsub:"⫔",supsup:"⫖",swarhk:"⤦",swarr:"↙",swArr:"⇙",swarrow:"↙",swnwar:"⤪",szlig:"ß",Tab:"\t",target:"⌖",Tau:"Τ",tau:"τ",tbrk:"⎴",Tcaron:"Ť",tcaron:"ť",Tcedil:"Ţ",tcedil:"ţ",Tcy:"Т",tcy:"т",tdot:"⃛",telrec:"⌕",Tfr:"𝔗",tfr:"𝔱",there4:"∴",therefore:"∴",Therefore:"∴",Theta:"Θ",theta:"θ",thetasym:"ϑ",thetav:"ϑ",thickapprox:"≈",thicksim:"∼",ThickSpace:"  ",ThinSpace:" ",thinsp:" ",thkap:"≈",thksim:"∼",THORN:"Þ",thorn:"þ",tilde:"˜",Tilde:"∼",TildeEqual:"≃",TildeFullEqual:"≅",TildeTilde:"≈",timesbar:"⨱",timesb:"⊠",times:"×",timesd:"⨰",tint:"∭",toea:"⤨",topbot:"⌶",topcir:"⫱",top:"⊤",Topf:"𝕋",topf:"𝕥",topfork:"⫚",tosa:"⤩",tprime:"‴",trade:"™",TRADE:"™",triangle:"▵",triangledown:"▿",triangleleft:"◃",trianglelefteq:"⊴",triangleq:"≜",triangleright:"▹",trianglerighteq:"⊵",tridot:"◬",trie:"≜",triminus:"⨺",TripleDot:"⃛",triplus:"⨹",trisb:"⧍",tritime:"⨻",trpezium:"⏢",Tscr:"𝒯",tscr:"𝓉",TScy:"Ц",tscy:"ц",TSHcy:"Ћ",tshcy:"ћ",Tstrok:"Ŧ",tstrok:"ŧ",twixt:"≬",twoheadleftarrow:"↞",twoheadrightarrow:"↠",Uacute:"Ú",uacute:"ú",uarr:"↑",Uarr:"↟",uArr:"⇑",Uarrocir:"⥉",Ubrcy:"Ў",ubrcy:"ў",Ubreve:"Ŭ",ubreve:"ŭ",Ucirc:"Û",ucirc:"û",Ucy:"У",ucy:"у",udarr:"⇅",Udblac:"Ű",udblac:"ű",udhar:"⥮",ufisht:"⥾",Ufr:"𝔘",ufr:"𝔲",Ugrave:"Ù",ugrave:"ù",uHar:"⥣",uharl:"↿",uharr:"↾",uhblk:"▀",ulcorn:"⌜",ulcorner:"⌜",ulcrop:"⌏",ultri:"◸",Umacr:"Ū",umacr:"ū",uml:"¨",UnderBar:"_",UnderBrace:"⏟",UnderBracket:"⎵",UnderParenthesis:"⏝",Union:"⋃",UnionPlus:"⊎",Uogon:"Ų",uogon:"ų",Uopf:"𝕌",uopf:"𝕦",UpArrowBar:"⤒",uparrow:"↑",UpArrow:"↑",Uparrow:"⇑",UpArrowDownArrow:"⇅",updownarrow:"↕",UpDownArrow:"↕",Updownarrow:"⇕",UpEquilibrium:"⥮",upharpoonleft:"↿",upharpoonright:"↾",uplus:"⊎",UpperLeftArrow:"↖",UpperRightArrow:"↗",upsi:"υ",Upsi:"ϒ",upsih:"ϒ",Upsilon:"Υ",upsilon:"υ",UpTeeArrow:"↥",UpTee:"⊥",upuparrows:"⇈",urcorn:"⌝",urcorner:"⌝",urcrop:"⌎",Uring:"Ů",uring:"ů",urtri:"◹",Uscr:"𝒰",uscr:"𝓊",utdot:"⋰",Utilde:"Ũ",utilde:"ũ",utri:"▵",utrif:"▴",uuarr:"⇈",Uuml:"Ü",uuml:"ü",uwangle:"⦧",vangrt:"⦜",varepsilon:"ϵ",varkappa:"ϰ",varnothing:"∅",varphi:"ϕ",varpi:"ϖ",varpropto:"∝",varr:"↕",vArr:"⇕",varrho:"ϱ",varsigma:"ς",varsubsetneq:"⊊︀",varsubsetneqq:"⫋︀",varsupsetneq:"⊋︀",varsupsetneqq:"⫌︀",vartheta:"ϑ",vartriangleleft:"⊲",vartriangleright:"⊳",vBar:"⫨",Vbar:"⫫",vBarv:"⫩",Vcy:"В",vcy:"в",vdash:"⊢",vDash:"⊨",Vdash:"⊩",VDash:"⊫",Vdashl:"⫦",veebar:"⊻",vee:"∨",Vee:"⋁",veeeq:"≚",vellip:"⋮",verbar:"|",Verbar:"‖",vert:"|",Vert:"‖",VerticalBar:"∣",VerticalLine:"|",VerticalSeparator:"❘",VerticalTilde:"≀",VeryThinSpace:" ",Vfr:"𝔙",vfr:"𝔳",vltri:"⊲",vnsub:"⊂⃒",vnsup:"⊃⃒",Vopf:"𝕍",vopf:"𝕧",vprop:"∝",vrtri:"⊳",Vscr:"𝒱",vscr:"𝓋",vsubnE:"⫋︀",vsubne:"⊊︀",vsupnE:"⫌︀",vsupne:"⊋︀",Vvdash:"⊪",vzigzag:"⦚",Wcirc:"Ŵ",wcirc:"ŵ",wedbar:"⩟",wedge:"∧",Wedge:"⋀",wedgeq:"≙",weierp:"℘",Wfr:"𝔚",wfr:"𝔴",Wopf:"𝕎",wopf:"𝕨",wp:"℘",wr:"≀",wreath:"≀",Wscr:"𝒲",wscr:"𝓌",xcap:"⋂",xcirc:"◯",xcup:"⋃",xdtri:"▽",Xfr:"𝔛",xfr:"𝔵",xharr:"⟷",xhArr:"⟺",Xi:"Ξ",xi:"ξ",xlarr:"⟵",xlArr:"⟸",xmap:"⟼",xnis:"⋻",xodot:"⨀",Xopf:"𝕏",xopf:"𝕩",xoplus:"⨁",xotime:"⨂",xrarr:"⟶",xrArr:"⟹",Xscr:"𝒳",xscr:"𝓍",xsqcup:"⨆",xuplus:"⨄",xutri:"△",xvee:"⋁",xwedge:"⋀",Yacute:"Ý",yacute:"ý",YAcy:"Я",yacy:"я",Ycirc:"Ŷ",ycirc:"ŷ",Ycy:"Ы",ycy:"ы",yen:"¥",Yfr:"𝔜",yfr:"𝔶",YIcy:"Ї",yicy:"ї",Yopf:"𝕐",yopf:"𝕪",Yscr:"𝒴",yscr:"𝓎",YUcy:"Ю",yucy:"ю",yuml:"ÿ",Yuml:"Ÿ",Zacute:"Ź",zacute:"ź",Zcaron:"Ž",zcaron:"ž",Zcy:"З",zcy:"з",Zdot:"Ż",zdot:"ż",zeetrf:"ℨ",ZeroWidthSpace:"​",Zeta:"Ζ",zeta:"ζ",zfr:"𝔷",Zfr:"ℨ",ZHcy:"Ж",zhcy:"ж",zigrarr:"⇝",zopf:"𝕫",Zopf:"ℤ",Zscr:"𝒵",zscr:"𝓏",zwj:"‍",zwnj:"‌"}},{}],24:[function(require,module,exports){module.exports={Aacute:"Á",aacute:"á",Acirc:"Â",acirc:"â",acute:"´",AElig:"Æ",aelig:"æ",Agrave:"À",agrave:"à",amp:"&",AMP:"&",Aring:"Å",aring:"å",Atilde:"Ã",atilde:"ã",Auml:"Ä",auml:"ä",brvbar:"¦",Ccedil:"Ç",ccedil:"ç",cedil:"¸",cent:"¢",copy:"©",COPY:"©",curren:"¤",deg:"°",divide:"÷",Eacute:"É",eacute:"é",Ecirc:"Ê",ecirc:"ê",Egrave:"È",egrave:"è",ETH:"Ð",eth:"ð",Euml:"Ë",euml:"ë",frac12:"½",frac14:"¼",frac34:"¾",gt:">",GT:">",Iacute:"Í",iacute:"í",Icirc:"Î",icirc:"î",iexcl:"¡",Igrave:"Ì",igrave:"ì",iquest:"¿",Iuml:"Ï",iuml:"ï",laquo:"«",lt:"<",LT:"<",macr:"¯",micro:"µ",middot:"·",nbsp:" ",not:"¬",Ntilde:"Ñ",ntilde:"ñ",Oacute:"Ó",oacute:"ó",Ocirc:"Ô",ocirc:"ô",Ograve:"Ò",ograve:"ò",ordf:"ª",ordm:"º",Oslash:"Ø",oslash:"ø",Otilde:"Õ",otilde:"õ",Ouml:"Ö",ouml:"ö",para:"¶",plusmn:"±",pound:"£",quot:'"',QUOT:'"',raquo:"»",reg:"®",REG:"®",sect:"§",shy:"­",sup1:"¹",sup2:"²",sup3:"³",szlig:"ß",THORN:"Þ",thorn:"þ",times:"×",Uacute:"Ú",uacute:"ú",Ucirc:"Û",ucirc:"û",Ugrave:"Ù",ugrave:"ù",uml:"¨",Uuml:"Ü",uuml:"ü",Yacute:"Ý",yacute:"ý",yen:"¥",yuml:"ÿ"}},{}],25:[function(require,module,exports){module.exports={amp:"&",apos:"'",gt:">",lt:"<",quot:'"'}},{}],26:[function(require,module,exports){var objectCreate=Object.create||objectCreatePolyfill;var objectKeys=Object.keys||objectKeysPolyfill;var bind=Function.prototype.bind||functionBindPolyfill;function EventEmitter(){if(!this._events||!Object.prototype.hasOwnProperty.call(this,"_events")){this._events=objectCreate(null);this._eventsCount=0}this._maxListeners=this._maxListeners||undefined}module.exports=EventEmitter;EventEmitter.EventEmitter=EventEmitter;EventEmitter.prototype._events=undefined;EventEmitter.prototype._maxListeners=undefined;var defaultMaxListeners=10;var hasDefineProperty;try{var o={};if(Object.defineProperty)Object.defineProperty(o,"x",{value:0});hasDefineProperty=o.x===0}catch(err){hasDefineProperty=false}if(hasDefineProperty){Object.defineProperty(EventEmitter,"defaultMaxListeners",{enumerable:true,get:function(){return defaultMaxListeners},set:function(arg){if(typeof arg!=="number"||arg<0||arg!==arg)throw new TypeError('"defaultMaxListeners" must be a positive number');defaultMaxListeners=arg}})}else{EventEmitter.defaultMaxListeners=defaultMaxListeners}EventEmitter.prototype.setMaxListeners=function setMaxListeners(n){if(typeof n!=="number"||n<0||isNaN(n))throw new TypeError('"n" argument must be a positive number');this._maxListeners=n;return this};function $getMaxListeners(that){if(that._maxListeners===undefined)return EventEmitter.defaultMaxListeners;return that._maxListeners}EventEmitter.prototype.getMaxListeners=function getMaxListeners(){return $getMaxListeners(this)};function emitNone(handler,isFn,self){if(isFn)handler.call(self);else{var len=handler.length;var listeners=arrayClone(handler,len);for(var i=0;i<len;++i)listeners[i].call(self)}}function emitOne(handler,isFn,self,arg1){if(isFn)handler.call(self,arg1);else{var len=handler.length;var listeners=arrayClone(handler,len);for(var i=0;i<len;++i)listeners[i].call(self,arg1)}}function emitTwo(handler,isFn,self,arg1,arg2){if(isFn)handler.call(self,arg1,arg2);else{var len=handler.length;var listeners=arrayClone(handler,len);for(var i=0;i<len;++i)listeners[i].call(self,arg1,arg2)}}function emitThree(handler,isFn,self,arg1,arg2,arg3){if(isFn)handler.call(self,arg1,arg2,arg3);else{var len=handler.length;var listeners=arrayClone(handler,len);for(var i=0;i<len;++i)listeners[i].call(self,arg1,arg2,arg3)}}function emitMany(handler,isFn,self,args){if(isFn)handler.apply(self,args);else{var len=handler.length;var listeners=arrayClone(handler,len);for(var i=0;i<len;++i)listeners[i].apply(self,args)}}EventEmitter.prototype.emit=function emit(type){var er,handler,len,args,i,events;var doError=type==="error";events=this._events;if(events)doError=doError&&events.error==null;else if(!doError)return false;if(doError){if(arguments.length>1)er=arguments[1];if(er instanceof Error){throw er}else{var err=new Error('Unhandled "error" event. ('+er+")");err.context=er;throw err}return false}handler=events[type];if(!handler)return false;var isFn=typeof handler==="function";len=arguments.length;switch(len){case 1:emitNone(handler,isFn,this);break;case 2:emitOne(handler,isFn,this,arguments[1]);break;case 3:emitTwo(handler,isFn,this,arguments[1],arguments[2]);break;case 4:emitThree(handler,isFn,this,arguments[1],arguments[2],arguments[3]);break;default:args=new Array(len-1);for(i=1;i<len;i++)args[i-1]=arguments[i];emitMany(handler,isFn,this,args)}return true};function _addListener(target,type,listener,prepend){var m;var events;var existing;if(typeof listener!=="function")throw new TypeError('"listener" argument must be a function');events=target._events;if(!events){events=target._events=objectCreate(null);target._eventsCount=0}else{if(events.newListener){target.emit("newListener",type,listener.listener?listener.listener:listener);events=target._events}existing=events[type]}if(!existing){existing=events[type]=listener;++target._eventsCount}else{if(typeof existing==="function"){existing=events[type]=prepend?[listener,existing]:[existing,listener]}else{if(prepend){existing.unshift(listener)}else{existing.push(listener)}}if(!existing.warned){m=$getMaxListeners(target);if(m&&m>0&&existing.length>m){existing.warned=true;var w=new Error("Possible EventEmitter memory leak detected. "+existing.length+' "'+String(type)+'" listeners '+"added. Use emitter.setMaxListeners() to "+"increase limit.");w.name="MaxListenersExceededWarning";w.emitter=target;w.type=type;w.count=existing.length;if(typeof console==="object"&&console.warn){console.warn("%s: %s",w.name,w.message)}}}}return target}EventEmitter.prototype.addListener=function addListener(type,listener){return _addListener(this,type,listener,false)};EventEmitter.prototype.on=EventEmitter.prototype.addListener;EventEmitter.prototype.prependListener=function prependListener(type,listener){return _addListener(this,type,listener,true)};function onceWrapper(){if(!this.fired){this.target.removeListener(this.type,this.wrapFn);this.fired=true;switch(arguments.length){case 0:return this.listener.call(this.target);case 1:return this.listener.call(this.target,arguments[0]);case 2:return this.listener.call(this.target,arguments[0],arguments[1]);case 3:return this.listener.call(this.target,arguments[0],arguments[1],arguments[2]);default:var args=new Array(arguments.length);for(var i=0;i<args.length;++i)args[i]=arguments[i];this.listener.apply(this.target,args)}}}function _onceWrap(target,type,listener){var state={fired:false,wrapFn:undefined,target:target,type:type,listener:listener};var wrapped=bind.call(onceWrapper,state);wrapped.listener=listener;state.wrapFn=wrapped;return wrapped}EventEmitter.prototype.once=function once(type,listener){if(typeof listener!=="function")throw new TypeError('"listener" argument must be a function');this.on(type,_onceWrap(this,type,listener));return this};EventEmitter.prototype.prependOnceListener=function prependOnceListener(type,listener){if(typeof listener!=="function")throw new TypeError('"listener" argument must be a function');this.prependListener(type,_onceWrap(this,type,listener));return this};EventEmitter.prototype.removeListener=function removeListener(type,listener){var list,events,position,i,originalListener;if(typeof listener!=="function")throw new TypeError('"listener" argument must be a function');events=this._events;if(!events)return this;list=events[type];if(!list)return this;if(list===listener||list.listener===listener){if(--this._eventsCount===0)this._events=objectCreate(null);else{delete events[type];if(events.removeListener)this.emit("removeListener",type,list.listener||listener)}}else if(typeof list!=="function"){position=-1;for(i=list.length-1;i>=0;i--){if(list[i]===listener||list[i].listener===listener){originalListener=list[i].listener;position=i;break}}if(position<0)return this;if(position===0)list.shift();else spliceOne(list,position);if(list.length===1)events[type]=list[0];if(events.removeListener)this.emit("removeListener",type,originalListener||listener)}return this};EventEmitter.prototype.removeAllListeners=function removeAllListeners(type){var listeners,events,i;events=this._events;if(!events)return this;if(!events.removeListener){if(arguments.length===0){this._events=objectCreate(null);this._eventsCount=0}else if(events[type]){if(--this._eventsCount===0)this._events=objectCreate(null);else delete events[type]}return this}if(arguments.length===0){var keys=objectKeys(events);var key;for(i=0;i<keys.length;++i){key=keys[i];if(key==="removeListener")continue;this.removeAllListeners(key)}this.removeAllListeners("removeListener");this._events=objectCreate(null);this._eventsCount=0;return this}listeners=events[type];if(typeof listeners==="function"){this.removeListener(type,listeners)}else if(listeners){for(i=listeners.length-1;i>=0;i--){this.removeListener(type,listeners[i])}}return this};function _listeners(target,type,unwrap){var events=target._events;if(!events)return[];var evlistener=events[type];if(!evlistener)return[];if(typeof evlistener==="function")return unwrap?[evlistener.listener||evlistener]:[evlistener];return unwrap?unwrapListeners(evlistener):arrayClone(evlistener,evlistener.length)}EventEmitter.prototype.listeners=function listeners(type){return _listeners(this,type,true)};EventEmitter.prototype.rawListeners=function rawListeners(type){return _listeners(this,type,false)};EventEmitter.listenerCount=function(emitter,type){if(typeof emitter.listenerCount==="function"){return emitter.listenerCount(type)}else{return listenerCount.call(emitter,type)}};EventEmitter.prototype.listenerCount=listenerCount;function listenerCount(type){var events=this._events;if(events){var evlistener=events[type];if(typeof evlistener==="function"){return 1}else if(evlistener){return evlistener.length}}return 0}EventEmitter.prototype.eventNames=function eventNames(){return this._eventsCount>0?Reflect.ownKeys(this._events):[]};function spliceOne(list,index){for(var i=index,k=i+1,n=list.length;k<n;i+=1,k+=1)list[i]=list[k];list.pop()}function arrayClone(arr,n){var copy=new Array(n);for(var i=0;i<n;++i)copy[i]=arr[i];return copy}function unwrapListeners(arr){var ret=new Array(arr.length);for(var i=0;i<ret.length;++i){ret[i]=arr[i].listener||arr[i]}return ret}function objectCreatePolyfill(proto){var F=function(){};F.prototype=proto;return new F}function objectKeysPolyfill(obj){var keys=[];for(var k in obj)if(Object.prototype.hasOwnProperty.call(obj,k)){keys.push(k)}return k}function functionBindPolyfill(context){var fn=this;return function(){return fn.apply(context,arguments)}}},{}],27:[function(require,module,exports){module.exports=CollectingHandler;function CollectingHandler(cbs){this._cbs=cbs||{};this.events=[]}var EVENTS=require("./").EVENTS;Object.keys(EVENTS).forEach(function(name){if(EVENTS[name]===0){name="on"+name;CollectingHandler.prototype[name]=function(){this.events.push([name]);if(this._cbs[name])this._cbs[name]()}}else if(EVENTS[name]===1){name="on"+name;CollectingHandler.prototype[name]=function(a){this.events.push([name,a]);if(this._cbs[name])this._cbs[name](a)}}else if(EVENTS[name]===2){name="on"+name;CollectingHandler.prototype[name]=function(a,b){this.events.push([name,a,b]);if(this._cbs[name])this._cbs[name](a,b)}}else{throw Error("wrong number of arguments")}});CollectingHandler.prototype.onreset=function(){this.events=[];if(this._cbs.onreset)this._cbs.onreset()};CollectingHandler.prototype.restart=function(){if(this._cbs.onreset)this._cbs.onreset();for(var i=0,len=this.events.length;i<len;i++){if(this._cbs[this.events[i][0]]){var num=this.events[i].length;if(num===1){this._cbs[this.events[i][0]]()}else if(num===2){this._cbs[this.events[i][0]](this.events[i][1])}else{this._cbs[this.events[i][0]](this.events[i][1],this.events[i][2])}}}}},{"./":34}],28:[function(require,module,exports){var DomHandler=require("domhandler");var DomUtils=require("domutils");function FeedHandler(callback,options){this.init(callback,options)}require("inherits")(FeedHandler,DomHandler);FeedHandler.prototype.init=DomHandler;function getElements(what,where){return DomUtils.getElementsByTagName(what,where,true)}function getOneElement(what,where){return DomUtils.getElementsByTagName(what,where,true,1)[0]}function fetch(what,where,recurse){return DomUtils.getText(DomUtils.getElementsByTagName(what,where,recurse,1)).trim()}function addConditionally(obj,prop,what,where,recurse){var tmp=fetch(what,where,recurse);if(tmp)obj[prop]=tmp}var isValidFeed=function(value){return value==="rss"||value==="feed"||value==="rdf:RDF"};FeedHandler.prototype.onend=function(){var feed={},feedRoot=getOneElement(isValidFeed,this.dom),tmp,childs;if(feedRoot){if(feedRoot.name==="feed"){childs=feedRoot.children;feed.type="atom";addConditionally(feed,"id","id",childs);addConditionally(feed,"title","title",childs);if((tmp=getOneElement("link",childs))&&(tmp=tmp.attribs)&&(tmp=tmp.href))feed.link=tmp;addConditionally(feed,"description","subtitle",childs);if(tmp=fetch("updated",childs))feed.updated=new Date(tmp);addConditionally(feed,"author","email",childs,true);feed.items=getElements("entry",childs).map(function(item){var entry={},tmp;item=item.children;addConditionally(entry,"id","id",item);addConditionally(entry,"title","title",item);if((tmp=getOneElement("link",item))&&(tmp=tmp.attribs)&&(tmp=tmp.href))entry.link=tmp;if(tmp=fetch("summary",item)||fetch("content",item))entry.description=tmp;if(tmp=fetch("updated",item))entry.pubDate=new Date(tmp);return entry})}else{childs=getOneElement("channel",feedRoot.children).children;feed.type=feedRoot.name.substr(0,3);feed.id="";addConditionally(feed,"title","title",childs);addConditionally(feed,"link","link",childs);addConditionally(feed,"description","description",childs);if(tmp=fetch("lastBuildDate",childs))feed.updated=new Date(tmp);addConditionally(feed,"author","managingEditor",childs,true);feed.items=getElements("item",feedRoot.children).map(function(item){var entry={},tmp;item=item.children;addConditionally(entry,"id","guid",item);addConditionally(entry,"title","title",item);addConditionally(entry,"link","link",item);addConditionally(entry,"description","description",item);if(tmp=fetch("pubDate",item))entry.pubDate=new Date(tmp);return entry})}}this.dom=feed;DomHandler.prototype._handleCallback.call(this,feedRoot?null:Error("couldn't find root of feed"))};module.exports=FeedHandler},{domhandler:8,domutils:11,inherits:36}],29:[function(require,module,exports){var Tokenizer=require("./Tokenizer.js");var formTags={input:true,option:true,optgroup:true,select:true,button:true,datalist:true,textarea:true};var openImpliesClose={tr:{tr:true,th:true,td:true},th:{th:true},td:{thead:true,th:true,td:true},body:{head:true,link:true,script:true},li:{li:true},p:{p:true},h1:{p:true},h2:{p:true},h3:{p:true},h4:{p:true},h5:{p:true},h6:{p:true},select:formTags,input:formTags,output:formTags,button:formTags,datalist:formTags,textarea:formTags,option:{option:true},optgroup:{optgroup:true}};var voidElements={__proto__:null,area:true,base:true,basefont:true,br:true,col:true,command:true,embed:true,frame:true,hr:true,img:true,input:true,isindex:true,keygen:true,link:true,meta:true,param:true,source:true,track:true,wbr:true};var foreignContextElements={__proto__:null,math:true,svg:true};var htmlIntegrationElements={__proto__:null,mi:true,mo:true,mn:true,ms:true,mtext:true,"annotation-xml":true,foreignObject:true,desc:true,title:true};var re_nameEnd=/\s|\//;function Parser(cbs,options){this._options=options||{};this._cbs=cbs||{};this._tagname="";this._attribname="";this._attribvalue="";this._attribs=null;this._stack=[];this._foreignContext=[];this.startIndex=0;this.endIndex=null;this._lowerCaseTagNames="lowerCaseTags"in this._options?!!this._options.lowerCaseTags:!this._options.xmlMode;this._lowerCaseAttributeNames="lowerCaseAttributeNames"in this._options?!!this._options.lowerCaseAttributeNames:!this._options.xmlMode;if(this._options.Tokenizer){Tokenizer=this._options.Tokenizer}this._tokenizer=new Tokenizer(this._options,this);if(this._cbs.onparserinit)this._cbs.onparserinit(this)}require("inherits")(Parser,require("events").EventEmitter);Parser.prototype._updatePosition=function(initialOffset){if(this.endIndex===null){if(this._tokenizer._sectionStart<=initialOffset){this.startIndex=0}else{this.startIndex=this._tokenizer._sectionStart-initialOffset}}else this.startIndex=this.endIndex+1;this.endIndex=this._tokenizer.getAbsoluteIndex()};Parser.prototype.ontext=function(data){this._updatePosition(1);this.endIndex--;if(this._cbs.ontext)this._cbs.ontext(data)};Parser.prototype.onopentagname=function(name){if(this._lowerCaseTagNames){name=name.toLowerCase()}this._tagname=name;if(!this._options.xmlMode&&name in openImpliesClose){for(var el;(el=this._stack[this._stack.length-1])in openImpliesClose[name];this.onclosetag(el));}if(this._options.xmlMode||!(name in voidElements)){this._stack.push(name);if(name in foreignContextElements)this._foreignContext.push(true);else if(name in htmlIntegrationElements)this._foreignContext.push(false)}if(this._cbs.onopentagname)this._cbs.onopentagname(name);if(this._cbs.onopentag)this._attribs={}};Parser.prototype.onopentagend=function(){this._updatePosition(1);if(this._attribs){if(this._cbs.onopentag)this._cbs.onopentag(this._tagname,this._attribs);this._attribs=null}if(!this._options.xmlMode&&this._cbs.onclosetag&&this._tagname in voidElements){this._cbs.onclosetag(this._tagname)}this._tagname=""};Parser.prototype.onclosetag=function(name){this._updatePosition(1);if(this._lowerCaseTagNames){name=name.toLowerCase()}if(name in foreignContextElements||name in htmlIntegrationElements){this._foreignContext.pop()}if(this._stack.length&&(!(name in voidElements)||this._options.xmlMode)){var pos=this._stack.lastIndexOf(name);if(pos!==-1){if(this._cbs.onclosetag){pos=this._stack.length-pos;while(pos--)this._cbs.onclosetag(this._stack.pop())}else this._stack.length=pos}else if(name==="p"&&!this._options.xmlMode){this.onopentagname(name);this._closeCurrentTag()}}else if(!this._options.xmlMode&&(name==="br"||name==="p")){this.onopentagname(name);this._closeCurrentTag()}};Parser.prototype.onselfclosingtag=function(){if(this._options.xmlMode||this._options.recognizeSelfClosing||this._foreignContext[this._foreignContext.length-1]){this._closeCurrentTag()}else{this.onopentagend()}};Parser.prototype._closeCurrentTag=function(){var name=this._tagname;this.onopentagend();if(this._stack[this._stack.length-1]===name){if(this._cbs.onclosetag){this._cbs.onclosetag(name)}this._stack.pop()}};Parser.prototype.onattribname=function(name){if(this._lowerCaseAttributeNames){name=name.toLowerCase()}this._attribname=name};Parser.prototype.onattribdata=function(value){this._attribvalue+=value};Parser.prototype.onattribend=function(){if(this._cbs.onattribute)this._cbs.onattribute(this._attribname,this._attribvalue);if(this._attribs&&!Object.prototype.hasOwnProperty.call(this._attribs,this._attribname)){this._attribs[this._attribname]=this._attribvalue}this._attribname="";this._attribvalue=""};Parser.prototype._getInstructionName=function(value){var idx=value.search(re_nameEnd),name=idx<0?value:value.substr(0,idx);if(this._lowerCaseTagNames){name=name.toLowerCase()}return name};Parser.prototype.ondeclaration=function(value){if(this._cbs.onprocessinginstruction){var name=this._getInstructionName(value);this._cbs.onprocessinginstruction("!"+name,"!"+value)}};Parser.prototype.onprocessinginstruction=function(value){if(this._cbs.onprocessinginstruction){var name=this._getInstructionName(value);this._cbs.onprocessinginstruction("?"+name,"?"+value)}};Parser.prototype.oncomment=function(value){this._updatePosition(4);if(this._cbs.oncomment)this._cbs.oncomment(value);if(this._cbs.oncommentend)this._cbs.oncommentend()};Parser.prototype.oncdata=function(value){this._updatePosition(1);if(this._options.xmlMode||this._options.recognizeCDATA){if(this._cbs.oncdatastart)this._cbs.oncdatastart();if(this._cbs.ontext)this._cbs.ontext(value);if(this._cbs.oncdataend)this._cbs.oncdataend()}else{this.oncomment("[CDATA["+value+"]]")}};Parser.prototype.onerror=function(err){if(this._cbs.onerror)this._cbs.onerror(err)};Parser.prototype.onend=function(){if(this._cbs.onclosetag){for(var i=this._stack.length;i>0;this._cbs.onclosetag(this._stack[--i]));}if(this._cbs.onend)this._cbs.onend()};Parser.prototype.reset=function(){if(this._cbs.onreset)this._cbs.onreset();this._tokenizer.reset();this._tagname="";this._attribname="";this._attribs=null;this._stack=[];if(this._cbs.onparserinit)this._cbs.onparserinit(this)};Parser.prototype.parseComplete=function(data){this.reset();this.end(data)};Parser.prototype.write=function(chunk){this._tokenizer.write(chunk)};Parser.prototype.end=function(chunk){this._tokenizer.end(chunk)};Parser.prototype.pause=function(){this._tokenizer.pause()};Parser.prototype.resume=function(){this._tokenizer.resume()};Parser.prototype.parseChunk=Parser.prototype.write;Parser.prototype.done=Parser.prototype.end;module.exports=Parser},{"./Tokenizer.js":32,events:26,inherits:36}],30:[function(require,module,exports){module.exports=ProxyHandler;function ProxyHandler(cbs){this._cbs=cbs||{}}var EVENTS=require("./").EVENTS;Object.keys(EVENTS).forEach(function(name){if(EVENTS[name]===0){name="on"+name;ProxyHandler.prototype[name]=function(){if(this._cbs[name])this._cbs[name]()}}else if(EVENTS[name]===1){name="on"+name;ProxyHandler.prototype[name]=function(a){if(this._cbs[name])this._cbs[name](a)}}else if(EVENTS[name]===2){name="on"+name;ProxyHandler.prototype[name]=function(a,b){if(this._cbs[name])this._cbs[name](a,b)}}else{throw Error("wrong number of arguments")}})},{"./":34}],31:[function(require,module,exports){module.exports=Stream;var Parser=require("./WritableStream.js");function Stream(options){Parser.call(this,new Cbs(this),options)}require("inherits")(Stream,Parser);Stream.prototype.readable=true;function Cbs(scope){this.scope=scope}var EVENTS=require("../").EVENTS;Object.keys(EVENTS).forEach(function(name){if(EVENTS[name]===0){Cbs.prototype["on"+name]=function(){this.scope.emit(name)}}else if(EVENTS[name]===1){Cbs.prototype["on"+name]=function(a){this.scope.emit(name,a)}}else if(EVENTS[name]===2){Cbs.prototype["on"+name]=function(a,b){this.scope.emit(name,a,b)}}else{throw Error("wrong number of arguments!")}})},{"../":34,"./WritableStream.js":33,inherits:36}],32:[function(require,module,exports){module.exports=Tokenizer;var decodeCodePoint=require("entities/lib/decode_codepoint.js");var entityMap=require("entities/maps/entities.json");var legacyMap=require("entities/maps/legacy.json");var xmlMap=require("entities/maps/xml.json");var i=0;var TEXT=i++;var BEFORE_TAG_NAME=i++;var IN_TAG_NAME=i++;var IN_SELF_CLOSING_TAG=i++;var BEFORE_CLOSING_TAG_NAME=i++;var IN_CLOSING_TAG_NAME=i++;var AFTER_CLOSING_TAG_NAME=i++;var BEFORE_ATTRIBUTE_NAME=i++;var IN_ATTRIBUTE_NAME=i++;var AFTER_ATTRIBUTE_NAME=i++;var BEFORE_ATTRIBUTE_VALUE=i++;var IN_ATTRIBUTE_VALUE_DQ=i++;var IN_ATTRIBUTE_VALUE_SQ=i++;var IN_ATTRIBUTE_VALUE_NQ=i++;var BEFORE_DECLARATION=i++;var IN_DECLARATION=i++;var IN_PROCESSING_INSTRUCTION=i++;var BEFORE_COMMENT=i++;var IN_COMMENT=i++;var AFTER_COMMENT_1=i++;var AFTER_COMMENT_2=i++;var BEFORE_CDATA_1=i++;var BEFORE_CDATA_2=i++;var BEFORE_CDATA_3=i++;var BEFORE_CDATA_4=i++;var BEFORE_CDATA_5=i++;var BEFORE_CDATA_6=i++;var IN_CDATA=i++;var AFTER_CDATA_1=i++;var AFTER_CDATA_2=i++;var BEFORE_SPECIAL=i++;var BEFORE_SPECIAL_END=i++;var BEFORE_SCRIPT_1=i++;var BEFORE_SCRIPT_2=i++;var BEFORE_SCRIPT_3=i++;var BEFORE_SCRIPT_4=i++;var BEFORE_SCRIPT_5=i++;var AFTER_SCRIPT_1=i++;var AFTER_SCRIPT_2=i++;var AFTER_SCRIPT_3=i++;var AFTER_SCRIPT_4=i++;var AFTER_SCRIPT_5=i++;var BEFORE_STYLE_1=i++;var BEFORE_STYLE_2=i++;var BEFORE_STYLE_3=i++;var BEFORE_STYLE_4=i++;var AFTER_STYLE_1=i++;var AFTER_STYLE_2=i++;var AFTER_STYLE_3=i++;var AFTER_STYLE_4=i++;var BEFORE_ENTITY=i++;var BEFORE_NUMERIC_ENTITY=i++;var IN_NAMED_ENTITY=i++;var IN_NUMERIC_ENTITY=i++;var IN_HEX_ENTITY=i++;var j=0;var SPECIAL_NONE=j++;var SPECIAL_SCRIPT=j++;var SPECIAL_STYLE=j++;function whitespace(c){return c===" "||c==="\n"||c==="\t"||c==="\f"||c==="\r"}function ifElseState(upper,SUCCESS,FAILURE){var lower=upper.toLowerCase();if(upper===lower){return function(c){if(c===lower){this._state=SUCCESS}else{this._state=FAILURE;this._index--}}}else{return function(c){if(c===lower||c===upper){this._state=SUCCESS}else{this._state=FAILURE;this._index--}}}}function consumeSpecialNameChar(upper,NEXT_STATE){var lower=upper.toLowerCase();return function(c){if(c===lower||c===upper){this._state=NEXT_STATE}else{this._state=IN_TAG_NAME;this._index--}}}function Tokenizer(options,cbs){this._state=TEXT;this._buffer="";this._sectionStart=0;this._index=0;this._bufferOffset=0;this._baseState=TEXT;this._special=SPECIAL_NONE;this._cbs=cbs;this._running=true;this._ended=false;this._xmlMode=!!(options&&options.xmlMode);this._decodeEntities=!!(options&&options.decodeEntities)}Tokenizer.prototype._stateText=function(c){if(c==="<"){if(this._index>this._sectionStart){this._cbs.ontext(this._getSection())}this._state=BEFORE_TAG_NAME;this._sectionStart=this._index}else if(this._decodeEntities&&this._special===SPECIAL_NONE&&c==="&"){if(this._index>this._sectionStart){this._cbs.ontext(this._getSection())}this._baseState=TEXT;this._state=BEFORE_ENTITY;this._sectionStart=this._index}};Tokenizer.prototype._stateBeforeTagName=function(c){if(c==="/"){this._state=BEFORE_CLOSING_TAG_NAME}else if(c==="<"){this._cbs.ontext(this._getSection());this._sectionStart=this._index}else if(c===">"||this._special!==SPECIAL_NONE||whitespace(c)){this._state=TEXT}else if(c==="!"){this._state=BEFORE_DECLARATION;this._sectionStart=this._index+1}else if(c==="?"){this._state=IN_PROCESSING_INSTRUCTION;this._sectionStart=this._index+1}else{this._state=!this._xmlMode&&(c==="s"||c==="S")?BEFORE_SPECIAL:IN_TAG_NAME;this._sectionStart=this._index}};Tokenizer.prototype._stateInTagName=function(c){if(c==="/"||c===">"||whitespace(c)){this._emitToken("onopentagname");this._state=BEFORE_ATTRIBUTE_NAME;this._index--}};Tokenizer.prototype._stateBeforeCloseingTagName=function(c){if(whitespace(c));else if(c===">"){this._state=TEXT}else if(this._special!==SPECIAL_NONE){if(c==="s"||c==="S"){this._state=BEFORE_SPECIAL_END}else{this._state=TEXT;this._index--}}else{this._state=IN_CLOSING_TAG_NAME;this._sectionStart=this._index}};Tokenizer.prototype._stateInCloseingTagName=function(c){if(c===">"||whitespace(c)){this._emitToken("onclosetag");this._state=AFTER_CLOSING_TAG_NAME;this._index--}};Tokenizer.prototype._stateAfterCloseingTagName=function(c){if(c===">"){this._state=TEXT;this._sectionStart=this._index+1}};Tokenizer.prototype._stateBeforeAttributeName=function(c){if(c===">"){this._cbs.onopentagend();this._state=TEXT;this._sectionStart=this._index+1}else if(c==="/"){this._state=IN_SELF_CLOSING_TAG}else if(!whitespace(c)){this._state=IN_ATTRIBUTE_NAME;this._sectionStart=this._index}};Tokenizer.prototype._stateInSelfClosingTag=function(c){if(c===">"){this._cbs.onselfclosingtag();this._state=TEXT;this._sectionStart=this._index+1}else if(!whitespace(c)){this._state=BEFORE_ATTRIBUTE_NAME;this._index--}};Tokenizer.prototype._stateInAttributeName=function(c){if(c==="="||c==="/"||c===">"||whitespace(c)){this._cbs.onattribname(this._getSection());this._sectionStart=-1;this._state=AFTER_ATTRIBUTE_NAME;this._index--}};Tokenizer.prototype._stateAfterAttributeName=function(c){if(c==="="){this._state=BEFORE_ATTRIBUTE_VALUE}else if(c==="/"||c===">"){this._cbs.onattribend();this._state=BEFORE_ATTRIBUTE_NAME;this._index--}else if(!whitespace(c)){this._cbs.onattribend();this._state=IN_ATTRIBUTE_NAME;this._sectionStart=this._index}};Tokenizer.prototype._stateBeforeAttributeValue=function(c){if(c==='"'){this._state=IN_ATTRIBUTE_VALUE_DQ;this._sectionStart=this._index+1}else if(c==="'"){this._state=IN_ATTRIBUTE_VALUE_SQ;this._sectionStart=this._index+1}else if(!whitespace(c)){this._state=IN_ATTRIBUTE_VALUE_NQ;this._sectionStart=this._index;this._index--}};Tokenizer.prototype._stateInAttributeValueDoubleQuotes=function(c){if(c==='"'){this._emitToken("onattribdata");this._cbs.onattribend();this._state=BEFORE_ATTRIBUTE_NAME}else if(this._decodeEntities&&c==="&"){this._emitToken("onattribdata");this._baseState=this._state;this._state=BEFORE_ENTITY;this._sectionStart=this._index}};Tokenizer.prototype._stateInAttributeValueSingleQuotes=function(c){if(c==="'"){this._emitToken("onattribdata");this._cbs.onattribend();this._state=BEFORE_ATTRIBUTE_NAME}else if(this._decodeEntities&&c==="&"){this._emitToken("onattribdata");this._baseState=this._state;this._state=BEFORE_ENTITY;this._sectionStart=this._index}};Tokenizer.prototype._stateInAttributeValueNoQuotes=function(c){if(whitespace(c)||c===">"){this._emitToken("onattribdata");this._cbs.onattribend();this._state=BEFORE_ATTRIBUTE_NAME;this._index--}else if(this._decodeEntities&&c==="&"){this._emitToken("onattribdata");this._baseState=this._state;this._state=BEFORE_ENTITY;this._sectionStart=this._index}};Tokenizer.prototype._stateBeforeDeclaration=function(c){this._state=c==="["?BEFORE_CDATA_1:c==="-"?BEFORE_COMMENT:IN_DECLARATION};Tokenizer.prototype._stateInDeclaration=function(c){if(c===">"){this._cbs.ondeclaration(this._getSection());this._state=TEXT;this._sectionStart=this._index+1}};Tokenizer.prototype._stateInProcessingInstruction=function(c){if(c===">"){this._cbs.onprocessinginstruction(this._getSection());this._state=TEXT;this._sectionStart=this._index+1}};Tokenizer.prototype._stateBeforeComment=function(c){if(c==="-"){this._state=IN_COMMENT;this._sectionStart=this._index+1}else{this._state=IN_DECLARATION}};Tokenizer.prototype._stateInComment=function(c){if(c==="-")this._state=AFTER_COMMENT_1};Tokenizer.prototype._stateAfterComment1=function(c){if(c==="-"){this._state=AFTER_COMMENT_2}else{this._state=IN_COMMENT}};Tokenizer.prototype._stateAfterComment2=function(c){if(c===">"){this._cbs.oncomment(this._buffer.substring(this._sectionStart,this._index-2));this._state=TEXT;this._sectionStart=this._index+1}else if(c!=="-"){this._state=IN_COMMENT}};Tokenizer.prototype._stateBeforeCdata1=ifElseState("C",BEFORE_CDATA_2,IN_DECLARATION);Tokenizer.prototype._stateBeforeCdata2=ifElseState("D",BEFORE_CDATA_3,IN_DECLARATION);Tokenizer.prototype._stateBeforeCdata3=ifElseState("A",BEFORE_CDATA_4,IN_DECLARATION);Tokenizer.prototype._stateBeforeCdata4=ifElseState("T",BEFORE_CDATA_5,IN_DECLARATION);Tokenizer.prototype._stateBeforeCdata5=ifElseState("A",BEFORE_CDATA_6,IN_DECLARATION);Tokenizer.prototype._stateBeforeCdata6=function(c){if(c==="["){this._state=IN_CDATA;this._sectionStart=this._index+1}else{this._state=IN_DECLARATION;this._index--}};Tokenizer.prototype._stateInCdata=function(c){if(c==="]")this._state=AFTER_CDATA_1};Tokenizer.prototype._stateAfterCdata1=function(c){if(c==="]")this._state=AFTER_CDATA_2;else this._state=IN_CDATA};Tokenizer.prototype._stateAfterCdata2=function(c){if(c===">"){this._cbs.oncdata(this._buffer.substring(this._sectionStart,this._index-2));this._state=TEXT;this._sectionStart=this._index+1}else if(c!=="]"){this._state=IN_CDATA}};Tokenizer.prototype._stateBeforeSpecial=function(c){if(c==="c"||c==="C"){this._state=BEFORE_SCRIPT_1}else if(c==="t"||c==="T"){this._state=BEFORE_STYLE_1}else{this._state=IN_TAG_NAME;this._index--}};Tokenizer.prototype._stateBeforeSpecialEnd=function(c){if(this._special===SPECIAL_SCRIPT&&(c==="c"||c==="C")){this._state=AFTER_SCRIPT_1}else if(this._special===SPECIAL_STYLE&&(c==="t"||c==="T")){this._state=AFTER_STYLE_1}else this._state=TEXT};Tokenizer.prototype._stateBeforeScript1=consumeSpecialNameChar("R",BEFORE_SCRIPT_2);Tokenizer.prototype._stateBeforeScript2=consumeSpecialNameChar("I",BEFORE_SCRIPT_3);Tokenizer.prototype._stateBeforeScript3=consumeSpecialNameChar("P",BEFORE_SCRIPT_4);Tokenizer.prototype._stateBeforeScript4=consumeSpecialNameChar("T",BEFORE_SCRIPT_5);Tokenizer.prototype._stateBeforeScript5=function(c){if(c==="/"||c===">"||whitespace(c)){this._special=SPECIAL_SCRIPT}this._state=IN_TAG_NAME;this._index--};Tokenizer.prototype._stateAfterScript1=ifElseState("R",AFTER_SCRIPT_2,TEXT);Tokenizer.prototype._stateAfterScript2=ifElseState("I",AFTER_SCRIPT_3,TEXT);Tokenizer.prototype._stateAfterScript3=ifElseState("P",AFTER_SCRIPT_4,TEXT);Tokenizer.prototype._stateAfterScript4=ifElseState("T",AFTER_SCRIPT_5,TEXT);Tokenizer.prototype._stateAfterScript5=function(c){if(c===">"||whitespace(c)){this._special=SPECIAL_NONE;this._state=IN_CLOSING_TAG_NAME;this._sectionStart=this._index-6;this._index--}else this._state=TEXT};Tokenizer.prototype._stateBeforeStyle1=consumeSpecialNameChar("Y",BEFORE_STYLE_2);Tokenizer.prototype._stateBeforeStyle2=consumeSpecialNameChar("L",BEFORE_STYLE_3);Tokenizer.prototype._stateBeforeStyle3=consumeSpecialNameChar("E",BEFORE_STYLE_4);Tokenizer.prototype._stateBeforeStyle4=function(c){if(c==="/"||c===">"||whitespace(c)){this._special=SPECIAL_STYLE}this._state=IN_TAG_NAME;this._index--};Tokenizer.prototype._stateAfterStyle1=ifElseState("Y",AFTER_STYLE_2,TEXT);Tokenizer.prototype._stateAfterStyle2=ifElseState("L",AFTER_STYLE_3,TEXT);Tokenizer.prototype._stateAfterStyle3=ifElseState("E",AFTER_STYLE_4,TEXT);Tokenizer.prototype._stateAfterStyle4=function(c){if(c===">"||whitespace(c)){this._special=SPECIAL_NONE;this._state=IN_CLOSING_TAG_NAME;this._sectionStart=this._index-5;this._index--}else this._state=TEXT};Tokenizer.prototype._stateBeforeEntity=ifElseState("#",BEFORE_NUMERIC_ENTITY,IN_NAMED_ENTITY);Tokenizer.prototype._stateBeforeNumericEntity=ifElseState("X",IN_HEX_ENTITY,IN_NUMERIC_ENTITY);Tokenizer.prototype._parseNamedEntityStrict=function(){if(this._sectionStart+1<this._index){var entity=this._buffer.substring(this._sectionStart+1,this._index),map=this._xmlMode?xmlMap:entityMap;if(map.hasOwnProperty(entity)){this._emitPartial(map[entity]);this._sectionStart=this._index+1}}};Tokenizer.prototype._parseLegacyEntity=function(){var start=this._sectionStart+1,limit=this._index-start;if(limit>6)limit=6;while(limit>=2){var entity=this._buffer.substr(start,limit);if(legacyMap.hasOwnProperty(entity)){this._emitPartial(legacyMap[entity]);this._sectionStart+=limit+1;return}else{limit--}}};Tokenizer.prototype._stateInNamedEntity=function(c){if(c===";"){this._parseNamedEntityStrict();if(this._sectionStart+1<this._index&&!this._xmlMode){this._parseLegacyEntity()}this._state=this._baseState}else if((c<"a"||c>"z")&&(c<"A"||c>"Z")&&(c<"0"||c>"9")){if(this._xmlMode);else if(this._sectionStart+1===this._index);else if(this._baseState!==TEXT){if(c!=="="){this._parseNamedEntityStrict()}}else{this._parseLegacyEntity()}this._state=this._baseState;this._index--}};Tokenizer.prototype._decodeNumericEntity=function(offset,base){var sectionStart=this._sectionStart+offset;if(sectionStart!==this._index){var entity=this._buffer.substring(sectionStart,this._index);var parsed=parseInt(entity,base);this._emitPartial(decodeCodePoint(parsed));this._sectionStart=this._index}else{this._sectionStart--}this._state=this._baseState};Tokenizer.prototype._stateInNumericEntity=function(c){if(c===";"){this._decodeNumericEntity(2,10);this._sectionStart++}else if(c<"0"||c>"9"){if(!this._xmlMode){this._decodeNumericEntity(2,10)}else{this._state=this._baseState}this._index--}};Tokenizer.prototype._stateInHexEntity=function(c){if(c===";"){this._decodeNumericEntity(3,16);this._sectionStart++}else if((c<"a"||c>"f")&&(c<"A"||c>"F")&&(c<"0"||c>"9")){if(!this._xmlMode){this._decodeNumericEntity(3,16)}else{this._state=this._baseState}this._index--}};Tokenizer.prototype._cleanup=function(){if(this._sectionStart<0){this._buffer="";this._bufferOffset+=this._index;this._index=0}else if(this._running){if(this._state===TEXT){if(this._sectionStart!==this._index){this._cbs.ontext(this._buffer.substr(this._sectionStart))}this._buffer="";this._bufferOffset+=this._index;this._index=0}else if(this._sectionStart===this._index){this._buffer="";this._bufferOffset+=this._index;this._index=0}else{this._buffer=this._buffer.substr(this._sectionStart);this._index-=this._sectionStart;this._bufferOffset+=this._sectionStart}this._sectionStart=0}};Tokenizer.prototype.write=function(chunk){if(this._ended)this._cbs.onerror(Error(".write() after done!"));this._buffer+=chunk;this._parse()};Tokenizer.prototype._parse=function(){while(this._index<this._buffer.length&&this._running){var c=this._buffer.charAt(this._index);if(this._state===TEXT){this._stateText(c)}else if(this._state===BEFORE_TAG_NAME){this._stateBeforeTagName(c)}else if(this._state===IN_TAG_NAME){this._stateInTagName(c)}else if(this._state===BEFORE_CLOSING_TAG_NAME){this._stateBeforeCloseingTagName(c)}else if(this._state===IN_CLOSING_TAG_NAME){this._stateInCloseingTagName(c)}else if(this._state===AFTER_CLOSING_TAG_NAME){this._stateAfterCloseingTagName(c)}else if(this._state===IN_SELF_CLOSING_TAG){this._stateInSelfClosingTag(c)}else if(this._state===BEFORE_ATTRIBUTE_NAME){this._stateBeforeAttributeName(c)}else if(this._state===IN_ATTRIBUTE_NAME){this._stateInAttributeName(c)}else if(this._state===AFTER_ATTRIBUTE_NAME){this._stateAfterAttributeName(c)}else if(this._state===BEFORE_ATTRIBUTE_VALUE){this._stateBeforeAttributeValue(c)}else if(this._state===IN_ATTRIBUTE_VALUE_DQ){this._stateInAttributeValueDoubleQuotes(c)}else if(this._state===IN_ATTRIBUTE_VALUE_SQ){this._stateInAttributeValueSingleQuotes(c)}else if(this._state===IN_ATTRIBUTE_VALUE_NQ){this._stateInAttributeValueNoQuotes(c)}else if(this._state===BEFORE_DECLARATION){this._stateBeforeDeclaration(c)}else if(this._state===IN_DECLARATION){this._stateInDeclaration(c)}else if(this._state===IN_PROCESSING_INSTRUCTION){this._stateInProcessingInstruction(c)}else if(this._state===BEFORE_COMMENT){this._stateBeforeComment(c)}else if(this._state===IN_COMMENT){this._stateInComment(c)}else if(this._state===AFTER_COMMENT_1){this._stateAfterComment1(c)}else if(this._state===AFTER_COMMENT_2){this._stateAfterComment2(c)}else if(this._state===BEFORE_CDATA_1){this._stateBeforeCdata1(c)}else if(this._state===BEFORE_CDATA_2){this._stateBeforeCdata2(c)}else if(this._state===BEFORE_CDATA_3){this._stateBeforeCdata3(c)}else if(this._state===BEFORE_CDATA_4){this._stateBeforeCdata4(c)}else if(this._state===BEFORE_CDATA_5){this._stateBeforeCdata5(c)}else if(this._state===BEFORE_CDATA_6){this._stateBeforeCdata6(c)}else if(this._state===IN_CDATA){this._stateInCdata(c)}else if(this._state===AFTER_CDATA_1){this._stateAfterCdata1(c)}else if(this._state===AFTER_CDATA_2){this._stateAfterCdata2(c)}else if(this._state===BEFORE_SPECIAL){this._stateBeforeSpecial(c)}else if(this._state===BEFORE_SPECIAL_END){this._stateBeforeSpecialEnd(c)}else if(this._state===BEFORE_SCRIPT_1){this._stateBeforeScript1(c)}else if(this._state===BEFORE_SCRIPT_2){this._stateBeforeScript2(c)}else if(this._state===BEFORE_SCRIPT_3){this._stateBeforeScript3(c)}else if(this._state===BEFORE_SCRIPT_4){this._stateBeforeScript4(c)}else if(this._state===BEFORE_SCRIPT_5){this._stateBeforeScript5(c)}else if(this._state===AFTER_SCRIPT_1){this._stateAfterScript1(c)}else if(this._state===AFTER_SCRIPT_2){this._stateAfterScript2(c)}else if(this._state===AFTER_SCRIPT_3){this._stateAfterScript3(c)}else if(this._state===AFTER_SCRIPT_4){this._stateAfterScript4(c)}else if(this._state===AFTER_SCRIPT_5){this._stateAfterScript5(c)}else if(this._state===BEFORE_STYLE_1){this._stateBeforeStyle1(c)}else if(this._state===BEFORE_STYLE_2){this._stateBeforeStyle2(c)}else if(this._state===BEFORE_STYLE_3){this._stateBeforeStyle3(c)}else if(this._state===BEFORE_STYLE_4){this._stateBeforeStyle4(c)}else if(this._state===AFTER_STYLE_1){this._stateAfterStyle1(c)}else if(this._state===AFTER_STYLE_2){this._stateAfterStyle2(c)}else if(this._state===AFTER_STYLE_3){this._stateAfterStyle3(c)}else if(this._state===AFTER_STYLE_4){this._stateAfterStyle4(c)}else if(this._state===BEFORE_ENTITY){this._stateBeforeEntity(c)}else if(this._state===BEFORE_NUMERIC_ENTITY){this._stateBeforeNumericEntity(c)}else if(this._state===IN_NAMED_ENTITY){this._stateInNamedEntity(c)}else if(this._state===IN_NUMERIC_ENTITY){this._stateInNumericEntity(c)}else if(this._state===IN_HEX_ENTITY){this._stateInHexEntity(c)}else{this._cbs.onerror(Error("unknown _state"),this._state)}this._index++}this._cleanup()};Tokenizer.prototype.pause=function(){this._running=false};Tokenizer.prototype.resume=function(){this._running=true;if(this._index<this._buffer.length){this._parse()}if(this._ended){this._finish()}};Tokenizer.prototype.end=function(chunk){if(this._ended)this._cbs.onerror(Error(".end() after done!"));if(chunk)this.write(chunk);this._ended=true;if(this._running)this._finish()};Tokenizer.prototype._finish=function(){if(this._sectionStart<this._index){this._handleTrailingData()}this._cbs.onend()};Tokenizer.prototype._handleTrailingData=function(){var data=this._buffer.substr(this._sectionStart);if(this._state===IN_CDATA||this._state===AFTER_CDATA_1||this._state===AFTER_CDATA_2){this._cbs.oncdata(data)}else if(this._state===IN_COMMENT||this._state===AFTER_COMMENT_1||this._state===AFTER_COMMENT_2){this._cbs.oncomment(data)}else if(this._state===IN_NAMED_ENTITY&&!this._xmlMode){this._parseLegacyEntity();if(this._sectionStart<this._index){this._state=this._baseState;this._handleTrailingData()}}else if(this._state===IN_NUMERIC_ENTITY&&!this._xmlMode){this._decodeNumericEntity(2,10);if(this._sectionStart<this._index){this._state=this._baseState;this._handleTrailingData()}}else if(this._state===IN_HEX_ENTITY&&!this._xmlMode){this._decodeNumericEntity(3,16);if(this._sectionStart<this._index){this._state=this._baseState;this._handleTrailingData()}}else if(this._state!==IN_TAG_NAME&&this._state!==BEFORE_ATTRIBUTE_NAME&&this._state!==BEFORE_ATTRIBUTE_VALUE&&this._state!==AFTER_ATTRIBUTE_NAME&&this._state!==IN_ATTRIBUTE_NAME&&this._state!==IN_ATTRIBUTE_VALUE_SQ&&this._state!==IN_ATTRIBUTE_VALUE_DQ&&this._state!==IN_ATTRIBUTE_VALUE_NQ&&this._state!==IN_CLOSING_TAG_NAME){this._cbs.ontext(data)}};Tokenizer.prototype.reset=function(){Tokenizer.call(this,{xmlMode:this._xmlMode,decodeEntities:this._decodeEntities},this._cbs)};Tokenizer.prototype.getAbsoluteIndex=function(){return this._bufferOffset+this._index};Tokenizer.prototype._getSection=function(){return this._buffer.substring(this._sectionStart,this._index)};Tokenizer.prototype._emitToken=function(name){this._cbs[name](this._getSection());this._sectionStart=-1};Tokenizer.prototype._emitPartial=function(value){if(this._baseState!==TEXT){this._cbs.onattribdata(value)}else{this._cbs.ontext(value)}}},{"entities/lib/decode_codepoint.js":20,"entities/maps/entities.json":23,"entities/maps/legacy.json":24,"entities/maps/xml.json":25}],33:[function(require,module,exports){module.exports=Stream;var Parser=require("./Parser.js");var WritableStream=require("readable-stream").Writable;var StringDecoder=require("string_decoder").StringDecoder;var Buffer=require("buffer").Buffer;function Stream(cbs,options){var parser=this._parser=new Parser(cbs,options);var decoder=this._decoder=new StringDecoder;WritableStream.call(this,{decodeStrings:false});this.once("finish",function(){parser.end(decoder.end())})}require("inherits")(Stream,WritableStream);Stream.prototype._write=function(chunk,encoding,cb){if(chunk instanceof Buffer)chunk=this._decoder.write(chunk);this._parser.write(chunk);cb()}},{"./Parser.js":29,buffer:5,inherits:36,"readable-stream":4,string_decoder:86}],34:[function(require,module,exports){var Parser=require("./Parser.js");var DomHandler=require("domhandler");function defineProp(name,value){delete module.exports[name];module.exports[name]=value;return value}module.exports={Parser:Parser,Tokenizer:require("./Tokenizer.js"),ElementType:require("domelementtype"),DomHandler:DomHandler,get FeedHandler(){return defineProp("FeedHandler",require("./FeedHandler.js"))},get Stream(){return defineProp("Stream",require("./Stream.js"))},get WritableStream(){return defineProp("WritableStream",require("./WritableStream.js"))},get ProxyHandler(){return defineProp("ProxyHandler",require("./ProxyHandler.js"))},get DomUtils(){return defineProp("DomUtils",require("domutils"))},get CollectingHandler(){return defineProp("CollectingHandler",require("./CollectingHandler.js"))},DefaultHandler:DomHandler,get RssHandler(){return defineProp("RssHandler",this.FeedHandler)},parseDOM:function(data,options){var handler=new DomHandler(options);new Parser(handler,options).end(data);return handler.dom},parseFeed:function(feed,options){var handler=new module.exports.FeedHandler(options);new Parser(handler,options).end(feed);return handler.dom},createDomStream:function(cb,options,elementCb){var handler=new DomHandler(cb,options,elementCb);return new Parser(handler,options)},EVENTS:{attribute:2,cdatastart:0,cdataend:0,text:1,processinginstruction:2,comment:1,commentend:0,closetag:1,opentag:2,opentagname:1,error:1,end:0}}},{"./CollectingHandler.js":27,"./FeedHandler.js":28,"./Parser.js":29,"./ProxyHandler.js":30,"./Stream.js":31,"./Tokenizer.js":32,"./WritableStream.js":33,domelementtype:7,domhandler:8,domutils:11}],35:[function(require,module,exports){exports.read=function(buffer,offset,isLE,mLen,nBytes){var e,m;var eLen=nBytes*8-mLen-1;var eMax=(1<<eLen)-1;var eBias=eMax>>1;var nBits=-7;var i=isLE?nBytes-1:0;var d=isLE?-1:1;var s=buffer[offset+i];i+=d;e=s&(1<<-nBits)-1;s>>=-nBits;nBits+=eLen;for(;nBits>0;e=e*256+buffer[offset+i],i+=d,nBits-=8){}m=e&(1<<-nBits)-1;e>>=-nBits;nBits+=mLen;for(;nBits>0;m=m*256+buffer[offset+i],i+=d,nBits-=8){}if(e===0){e=1-eBias}else if(e===eMax){return m?NaN:(s?-1:1)*Infinity}else{m=m+Math.pow(2,mLen);e=e-eBias}return(s?-1:1)*m*Math.pow(2,e-mLen)};exports.write=function(buffer,value,offset,isLE,mLen,nBytes){var e,m,c;var eLen=nBytes*8-mLen-1;var eMax=(1<<eLen)-1;var eBias=eMax>>1;var rt=mLen===23?Math.pow(2,-24)-Math.pow(2,-77):0;var i=isLE?0:nBytes-1;var d=isLE?1:-1;var s=value<0||value===0&&1/value<0?1:0;value=Math.abs(value);if(isNaN(value)||value===Infinity){m=isNaN(value)?1:0;e=eMax}else{e=Math.floor(Math.log(value)/Math.LN2);if(value*(c=Math.pow(2,-e))<1){e--;c*=2}if(e+eBias>=1){value+=rt/c}else{value+=rt*Math.pow(2,1-eBias)}if(value*c>=2){e++;c/=2}if(e+eBias>=eMax){m=0;e=eMax}else if(e+eBias>=1){m=(value*c-1)*Math.pow(2,mLen);e=e+eBias}else{m=value*Math.pow(2,eBias-1)*Math.pow(2,mLen);e=0}}for(;mLen>=8;buffer[offset+i]=m&255,i+=d,m/=256,mLen-=8){}e=e<<mLen|m;eLen+=mLen;for(;eLen>0;buffer[offset+i]=e&255,i+=d,e/=256,eLen-=8){}buffer[offset+i-d]|=s*128}},{}],36:[function(require,module,exports){if(typeof Object.create==="function"){module.exports=function inherits(ctor,superCtor){ctor.super_=superCtor;ctor.prototype=Object.create(superCtor.prototype,{constructor:{value:ctor,enumerable:false,writable:true,configurable:true}})}}else{module.exports=function inherits(ctor,superCtor){ctor.super_=superCtor;var TempCtor=function(){};TempCtor.prototype=superCtor.prototype;ctor.prototype=new TempCtor;ctor.prototype.constructor=ctor}}},{}],37:[function(require,module,exports){(function(global){var LARGE_ARRAY_SIZE=200;var HASH_UNDEFINED="__lodash_hash_undefined__";var MAX_SAFE_INTEGER=9007199254740991;var argsTag="[object Arguments]",arrayTag="[object Array]",boolTag="[object Boolean]",dateTag="[object Date]",errorTag="[object Error]",funcTag="[object Function]",genTag="[object GeneratorFunction]",mapTag="[object Map]",numberTag="[object Number]",objectTag="[object Object]",promiseTag="[object Promise]",regexpTag="[object RegExp]",setTag="[object Set]",stringTag="[object String]",symbolTag="[object Symbol]",weakMapTag="[object WeakMap]";var arrayBufferTag="[object ArrayBuffer]",dataViewTag="[object DataView]",float32Tag="[object Float32Array]",float64Tag="[object Float64Array]",int8Tag="[object Int8Array]",int16Tag="[object Int16Array]",int32Tag="[object Int32Array]",uint8Tag="[object Uint8Array]",uint8ClampedTag="[object Uint8ClampedArray]",uint16Tag="[object Uint16Array]",uint32Tag="[object Uint32Array]";var reRegExpChar=/[\\^$.*+?()[\]{}|]/g;var reFlags=/\w*$/;var reIsHostCtor=/^\[object .+?Constructor\]$/;var reIsUint=/^(?:0|[1-9]\d*)$/;var cloneableTags={};cloneableTags[argsTag]=cloneableTags[arrayTag]=cloneableTags[arrayBufferTag]=cloneableTags[dataViewTag]=cloneableTags[boolTag]=cloneableTags[dateTag]=cloneableTags[float32Tag]=cloneableTags[float64Tag]=cloneableTags[int8Tag]=cloneableTags[int16Tag]=cloneableTags[int32Tag]=cloneableTags[mapTag]=cloneableTags[numberTag]=cloneableTags[objectTag]=cloneableTags[regexpTag]=cloneableTags[setTag]=cloneableTags[stringTag]=cloneableTags[symbolTag]=cloneableTags[uint8Tag]=cloneableTags[uint8ClampedTag]=cloneableTags[uint16Tag]=cloneableTags[uint32Tag]=true;cloneableTags[errorTag]=cloneableTags[funcTag]=cloneableTags[weakMapTag]=false;var freeGlobal=typeof global=="object"&&global&&global.Object===Object&&global;var freeSelf=typeof self=="object"&&self&&self.Object===Object&&self;var root=freeGlobal||freeSelf||Function("return this")();var freeExports=typeof exports=="object"&&exports&&!exports.nodeType&&exports;var freeModule=freeExports&&typeof module=="object"&&module&&!module.nodeType&&module;var moduleExports=freeModule&&freeModule.exports===freeExports;function addMapEntry(map,pair){map.set(pair[0],pair[1]);return map}function addSetEntry(set,value){set.add(value);return set}function arrayEach(array,iteratee){var index=-1,length=array?array.length:0;while(++index<length){if(iteratee(array[index],index,array)===false){break}}return array}function arrayPush(array,values){var index=-1,length=values.length,offset=array.length;while(++index<length){array[offset+index]=values[index]}return array}function arrayReduce(array,iteratee,accumulator,initAccum){var index=-1,length=array?array.length:0;if(initAccum&&length){accumulator=array[++index]}while(++index<length){accumulator=iteratee(accumulator,array[index],index,array)}return accumulator}function baseTimes(n,iteratee){var index=-1,result=Array(n);while(++index<n){result[index]=iteratee(index)}return result}function getValue(object,key){return object==null?undefined:object[key]}function isHostObject(value){var result=false;if(value!=null&&typeof value.toString!="function"){try{result=!!(value+"")}catch(e){}}return result}function mapToArray(map){var index=-1,result=Array(map.size);map.forEach(function(value,key){result[++index]=[key,value]});return result}function overArg(func,transform){return function(arg){return func(transform(arg))}}function setToArray(set){var index=-1,result=Array(set.size);set.forEach(function(value){result[++index]=value});return result}var arrayProto=Array.prototype,funcProto=Function.prototype,objectProto=Object.prototype;var coreJsData=root["__core-js_shared__"];var maskSrcKey=function(){var uid=/[^.]+$/.exec(coreJsData&&coreJsData.keys&&coreJsData.keys.IE_PROTO||"");return uid?"Symbol(src)_1."+uid:""}();var funcToString=funcProto.toString;var hasOwnProperty=objectProto.hasOwnProperty;var objectToString=objectProto.toString;var reIsNative=RegExp("^"+funcToString.call(hasOwnProperty).replace(reRegExpChar,"\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,"$1.*?")+"$");var Buffer=moduleExports?root.Buffer:undefined,Symbol=root.Symbol,Uint8Array=root.Uint8Array,getPrototype=overArg(Object.getPrototypeOf,Object),objectCreate=Object.create,propertyIsEnumerable=objectProto.propertyIsEnumerable,splice=arrayProto.splice;var nativeGetSymbols=Object.getOwnPropertySymbols,nativeIsBuffer=Buffer?Buffer.isBuffer:undefined,nativeKeys=overArg(Object.keys,Object);var DataView=getNative(root,"DataView"),Map=getNative(root,"Map"),Promise=getNative(root,"Promise"),Set=getNative(root,"Set"),WeakMap=getNative(root,"WeakMap"),nativeCreate=getNative(Object,"create");var dataViewCtorString=toSource(DataView),mapCtorString=toSource(Map),promiseCtorString=toSource(Promise),setCtorString=toSource(Set),weakMapCtorString=toSource(WeakMap);var symbolProto=Symbol?Symbol.prototype:undefined,symbolValueOf=symbolProto?symbolProto.valueOf:undefined;function Hash(entries){var index=-1,length=entries?entries.length:0;this.clear();while(++index<length){var entry=entries[index];this.set(entry[0],entry[1])}}function hashClear(){this.__data__=nativeCreate?nativeCreate(null):{}}function hashDelete(key){return this.has(key)&&delete this.__data__[key]}function hashGet(key){var data=this.__data__;if(nativeCreate){var result=data[key];return result===HASH_UNDEFINED?undefined:result}return hasOwnProperty.call(data,key)?data[key]:undefined}function hashHas(key){var data=this.__data__;return nativeCreate?data[key]!==undefined:hasOwnProperty.call(data,key)}function hashSet(key,value){var data=this.__data__;data[key]=nativeCreate&&value===undefined?HASH_UNDEFINED:value;return this}Hash.prototype.clear=hashClear;Hash.prototype["delete"]=hashDelete;Hash.prototype.get=hashGet;Hash.prototype.has=hashHas;Hash.prototype.set=hashSet;function ListCache(entries){var index=-1,length=entries?entries.length:0;this.clear();while(++index<length){var entry=entries[index];this.set(entry[0],entry[1])}}function listCacheClear(){this.__data__=[]}function listCacheDelete(key){var data=this.__data__,index=assocIndexOf(data,key);if(index<0){return false}var lastIndex=data.length-1;if(index==lastIndex){data.pop()}else{splice.call(data,index,1)}return true}function listCacheGet(key){var data=this.__data__,index=assocIndexOf(data,key);return index<0?undefined:data[index][1]}function listCacheHas(key){return assocIndexOf(this.__data__,key)>-1}function listCacheSet(key,value){var data=this.__data__,index=assocIndexOf(data,key);if(index<0){data.push([key,value])}else{data[index][1]=value}return this}ListCache.prototype.clear=listCacheClear;ListCache.prototype["delete"]=listCacheDelete;ListCache.prototype.get=listCacheGet;ListCache.prototype.has=listCacheHas;ListCache.prototype.set=listCacheSet;function MapCache(entries){var index=-1,length=entries?entries.length:0;this.clear();while(++index<length){var entry=entries[index];this.set(entry[0],entry[1])}}function mapCacheClear(){this.__data__={hash:new Hash,map:new(Map||ListCache),string:new Hash}}function mapCacheDelete(key){return getMapData(this,key)["delete"](key)}function mapCacheGet(key){return getMapData(this,key).get(key)}function mapCacheHas(key){return getMapData(this,key).has(key)}function mapCacheSet(key,value){getMapData(this,key).set(key,value);return this}MapCache.prototype.clear=mapCacheClear;MapCache.prototype["delete"]=mapCacheDelete;MapCache.prototype.get=mapCacheGet;MapCache.prototype.has=mapCacheHas;MapCache.prototype.set=mapCacheSet;function Stack(entries){this.__data__=new ListCache(entries)}function stackClear(){this.__data__=new ListCache}function stackDelete(key){return this.__data__["delete"](key)}function stackGet(key){return this.__data__.get(key)}function stackHas(key){return this.__data__.has(key)}function stackSet(key,value){var cache=this.__data__;if(cache instanceof ListCache){var pairs=cache.__data__;if(!Map||pairs.length<LARGE_ARRAY_SIZE-1){pairs.push([key,value]);return this}cache=this.__data__=new MapCache(pairs)}cache.set(key,value);return this}Stack.prototype.clear=stackClear;Stack.prototype["delete"]=stackDelete;Stack.prototype.get=stackGet;Stack.prototype.has=stackHas;Stack.prototype.set=stackSet;function arrayLikeKeys(value,inherited){var result=isArray(value)||isArguments(value)?baseTimes(value.length,String):[];var length=result.length,skipIndexes=!!length;for(var key in value){if((inherited||hasOwnProperty.call(value,key))&&!(skipIndexes&&(key=="length"||isIndex(key,length)))){result.push(key)}}return result}function assignValue(object,key,value){var objValue=object[key];if(!(hasOwnProperty.call(object,key)&&eq(objValue,value))||value===undefined&&!(key in object)){object[key]=value}}function assocIndexOf(array,key){var length=array.length;while(length--){if(eq(array[length][0],key)){return length}}return-1}function baseAssign(object,source){return object&&copyObject(source,keys(source),object)}function baseClone(value,isDeep,isFull,customizer,key,object,stack){var result;if(customizer){result=object?customizer(value,key,object,stack):customizer(value)}if(result!==undefined){return result}if(!isObject(value)){return value}var isArr=isArray(value);if(isArr){result=initCloneArray(value);if(!isDeep){return copyArray(value,result)}}else{var tag=getTag(value),isFunc=tag==funcTag||tag==genTag;if(isBuffer(value)){return cloneBuffer(value,isDeep)}if(tag==objectTag||tag==argsTag||isFunc&&!object){if(isHostObject(value)){return object?value:{}}result=initCloneObject(isFunc?{}:value);if(!isDeep){return copySymbols(value,baseAssign(result,value))}}else{if(!cloneableTags[tag]){return object?value:{}}result=initCloneByTag(value,tag,baseClone,isDeep)}}stack||(stack=new Stack);var stacked=stack.get(value);if(stacked){return stacked}stack.set(value,result);if(!isArr){var props=isFull?getAllKeys(value):keys(value)}arrayEach(props||value,function(subValue,key){if(props){key=subValue;subValue=value[key]}assignValue(result,key,baseClone(subValue,isDeep,isFull,customizer,key,value,stack))});return result}function baseCreate(proto){return isObject(proto)?objectCreate(proto):{}}function baseGetAllKeys(object,keysFunc,symbolsFunc){var result=keysFunc(object);return isArray(object)?result:arrayPush(result,symbolsFunc(object))}function baseGetTag(value){return objectToString.call(value)}function baseIsNative(value){if(!isObject(value)||isMasked(value)){return false}var pattern=isFunction(value)||isHostObject(value)?reIsNative:reIsHostCtor;return pattern.test(toSource(value))}function baseKeys(object){if(!isPrototype(object)){return nativeKeys(object)}var result=[];for(var key in Object(object)){if(hasOwnProperty.call(object,key)&&key!="constructor"){result.push(key)}}return result}function cloneBuffer(buffer,isDeep){if(isDeep){return buffer.slice()}var result=new buffer.constructor(buffer.length);buffer.copy(result);return result}function cloneArrayBuffer(arrayBuffer){var result=new arrayBuffer.constructor(arrayBuffer.byteLength);new Uint8Array(result).set(new Uint8Array(arrayBuffer));return result}function cloneDataView(dataView,isDeep){var buffer=isDeep?cloneArrayBuffer(dataView.buffer):dataView.buffer;return new dataView.constructor(buffer,dataView.byteOffset,dataView.byteLength)}function cloneMap(map,isDeep,cloneFunc){var array=isDeep?cloneFunc(mapToArray(map),true):mapToArray(map);return arrayReduce(array,addMapEntry,new map.constructor)}function cloneRegExp(regexp){var result=new regexp.constructor(regexp.source,reFlags.exec(regexp));result.lastIndex=regexp.lastIndex;return result}function cloneSet(set,isDeep,cloneFunc){var array=isDeep?cloneFunc(setToArray(set),true):setToArray(set);return arrayReduce(array,addSetEntry,new set.constructor)}function cloneSymbol(symbol){return symbolValueOf?Object(symbolValueOf.call(symbol)):{}}function cloneTypedArray(typedArray,isDeep){var buffer=isDeep?cloneArrayBuffer(typedArray.buffer):typedArray.buffer;return new typedArray.constructor(buffer,typedArray.byteOffset,typedArray.length)}function copyArray(source,array){var index=-1,length=source.length;array||(array=Array(length));while(++index<length){array[index]=source[index]}return array}function copyObject(source,props,object,customizer){object||(object={});var index=-1,length=props.length;while(++index<length){var key=props[index];var newValue=customizer?customizer(object[key],source[key],key,object,source):undefined;assignValue(object,key,newValue===undefined?source[key]:newValue)}return object}function copySymbols(source,object){return copyObject(source,getSymbols(source),object)}function getAllKeys(object){return baseGetAllKeys(object,keys,getSymbols)}function getMapData(map,key){var data=map.__data__;return isKeyable(key)?data[typeof key=="string"?"string":"hash"]:data.map}function getNative(object,key){var value=getValue(object,key);return baseIsNative(value)?value:undefined}var getSymbols=nativeGetSymbols?overArg(nativeGetSymbols,Object):stubArray;var getTag=baseGetTag;if(DataView&&getTag(new DataView(new ArrayBuffer(1)))!=dataViewTag||Map&&getTag(new Map)!=mapTag||Promise&&getTag(Promise.resolve())!=promiseTag||Set&&getTag(new Set)!=setTag||WeakMap&&getTag(new WeakMap)!=weakMapTag){getTag=function(value){var result=objectToString.call(value),Ctor=result==objectTag?value.constructor:undefined,ctorString=Ctor?toSource(Ctor):undefined;if(ctorString){switch(ctorString){case dataViewCtorString:return dataViewTag;case mapCtorString:return mapTag;case promiseCtorString:return promiseTag;case setCtorString:return setTag;case weakMapCtorString:return weakMapTag}}return result}}function initCloneArray(array){var length=array.length,result=array.constructor(length);if(length&&typeof array[0]=="string"&&hasOwnProperty.call(array,"index")){result.index=array.index;result.input=array.input}return result}function initCloneObject(object){return typeof object.constructor=="function"&&!isPrototype(object)?baseCreate(getPrototype(object)):{}}function initCloneByTag(object,tag,cloneFunc,isDeep){var Ctor=object.constructor;switch(tag){case arrayBufferTag:return cloneArrayBuffer(object);case boolTag:case dateTag:return new Ctor(+object);case dataViewTag:return cloneDataView(object,isDeep);case float32Tag:case float64Tag:case int8Tag:case int16Tag:case int32Tag:case uint8Tag:case uint8ClampedTag:case uint16Tag:case uint32Tag:return cloneTypedArray(object,isDeep);case mapTag:return cloneMap(object,isDeep,cloneFunc);case numberTag:case stringTag:return new Ctor(object);case regexpTag:return cloneRegExp(object);case setTag:return cloneSet(object,isDeep,cloneFunc);case symbolTag:return cloneSymbol(object)}}function isIndex(value,length){length=length==null?MAX_SAFE_INTEGER:length;return!!length&&(typeof value=="number"||reIsUint.test(value))&&(value>-1&&value%1==0&&value<length)}function isKeyable(value){var type=typeof value;return type=="string"||type=="number"||type=="symbol"||type=="boolean"?value!=="__proto__":value===null}function isMasked(func){return!!maskSrcKey&&maskSrcKey in func}function isPrototype(value){var Ctor=value&&value.constructor,proto=typeof Ctor=="function"&&Ctor.prototype||objectProto;return value===proto}function toSource(func){if(func!=null){try{return funcToString.call(func)}catch(e){}try{return func+""}catch(e){}}return""}function cloneDeep(value){return baseClone(value,true,true)}function eq(value,other){return value===other||value!==value&&other!==other}function isArguments(value){return isArrayLikeObject(value)&&hasOwnProperty.call(value,"callee")&&(!propertyIsEnumerable.call(value,"callee")||objectToString.call(value)==argsTag)}var isArray=Array.isArray;function isArrayLike(value){return value!=null&&isLength(value.length)&&!isFunction(value)}function isArrayLikeObject(value){return isObjectLike(value)&&isArrayLike(value)}var isBuffer=nativeIsBuffer||stubFalse;function isFunction(value){var tag=isObject(value)?objectToString.call(value):"";return tag==funcTag||tag==genTag}function isLength(value){return typeof value=="number"&&value>-1&&value%1==0&&value<=MAX_SAFE_INTEGER}function isObject(value){var type=typeof value;return!!value&&(type=="object"||type=="function")}function isObjectLike(value){return!!value&&typeof value=="object"}function keys(object){return isArrayLike(object)?arrayLikeKeys(object):baseKeys(object)}function stubArray(){return[]}function stubFalse(){return false}module.exports=cloneDeep}).call(this,typeof global!=="undefined"?global:typeof self!=="undefined"?self:typeof window!=="undefined"?window:{})},{}],38:[function(require,module,exports){(function(global){var INFINITY=1/0;var symbolTag="[object Symbol]";var reRegExpChar=/[\\^$.*+?()[\]{}|]/g,reHasRegExpChar=RegExp(reRegExpChar.source);var freeGlobal=typeof global=="object"&&global&&global.Object===Object&&global;var freeSelf=typeof self=="object"&&self&&self.Object===Object&&self;var root=freeGlobal||freeSelf||Function("return this")();var objectProto=Object.prototype;var objectToString=objectProto.toString;var Symbol=root.Symbol;var symbolProto=Symbol?Symbol.prototype:undefined,symbolToString=symbolProto?symbolProto.toString:undefined;function baseToString(value){if(typeof value=="string"){return value}if(isSymbol(value)){return symbolToString?symbolToString.call(value):""}var result=value+"";return result=="0"&&1/value==-INFINITY?"-0":result}function isObjectLike(value){return!!value&&typeof value=="object"}function isSymbol(value){return typeof value=="symbol"||isObjectLike(value)&&objectToString.call(value)==symbolTag}function toString(value){return value==null?"":baseToString(value)}function escapeRegExp(string){string=toString(string);return string&&reHasRegExpChar.test(string)?string.replace(reRegExpChar,"\\$&"):string}module.exports=escapeRegExp}).call(this,typeof global!=="undefined"?global:typeof self!=="undefined"?self:typeof window!=="undefined"?window:{})},{}],39:[function(require,module,exports){var objectTag="[object Object]";function isHostObject(value){var result=false;if(value!=null&&typeof value.toString!="function"){try{result=!!(value+"")}catch(e){}}return result}function overArg(func,transform){return function(arg){return func(transform(arg))}}var funcProto=Function.prototype,objectProto=Object.prototype;var funcToString=funcProto.toString;var hasOwnProperty=objectProto.hasOwnProperty;var objectCtorString=funcToString.call(Object);var objectToString=objectProto.toString;var getPrototype=overArg(Object.getPrototypeOf,Object);function isObjectLike(value){return!!value&&typeof value=="object"}function isPlainObject(value){if(!isObjectLike(value)||objectToString.call(value)!=objectTag||isHostObject(value)){return false}var proto=getPrototype(value);if(proto===null){return true}var Ctor=hasOwnProperty.call(proto,"constructor")&&proto.constructor;return typeof Ctor=="function"&&Ctor instanceof Ctor&&funcToString.call(Ctor)==objectCtorString}module.exports=isPlainObject},{}],40:[function(require,module,exports){var stringTag="[object String]";var objectProto=Object.prototype;var objectToString=objectProto.toString;var isArray=Array.isArray;function isObjectLike(value){return!!value&&typeof value=="object"}function isString(value){return typeof value=="string"||!isArray(value)&&isObjectLike(value)&&objectToString.call(value)==stringTag}module.exports=isString},{}],41:[function(require,module,exports){(function(global){var LARGE_ARRAY_SIZE=200;var HASH_UNDEFINED="__lodash_hash_undefined__";var HOT_COUNT=800,HOT_SPAN=16;var MAX_SAFE_INTEGER=9007199254740991;var argsTag="[object Arguments]",arrayTag="[object Array]",asyncTag="[object AsyncFunction]",boolTag="[object Boolean]",dateTag="[object Date]",errorTag="[object Error]",funcTag="[object Function]",genTag="[object GeneratorFunction]",mapTag="[object Map]",numberTag="[object Number]",nullTag="[object Null]",objectTag="[object Object]",proxyTag="[object Proxy]",regexpTag="[object RegExp]",setTag="[object Set]",stringTag="[object String]",undefinedTag="[object Undefined]",weakMapTag="[object WeakMap]";var arrayBufferTag="[object ArrayBuffer]",dataViewTag="[object DataView]",float32Tag="[object Float32Array]",float64Tag="[object Float64Array]",int8Tag="[object Int8Array]",int16Tag="[object Int16Array]",int32Tag="[object Int32Array]",uint8Tag="[object Uint8Array]",uint8ClampedTag="[object Uint8ClampedArray]",uint16Tag="[object Uint16Array]",uint32Tag="[object Uint32Array]";var reRegExpChar=/[\\^$.*+?()[\]{}|]/g;var reIsHostCtor=/^\[object .+?Constructor\]$/;var reIsUint=/^(?:0|[1-9]\d*)$/;var typedArrayTags={};typedArrayTags[float32Tag]=typedArrayTags[float64Tag]=typedArrayTags[int8Tag]=typedArrayTags[int16Tag]=typedArrayTags[int32Tag]=typedArrayTags[uint8Tag]=typedArrayTags[uint8ClampedTag]=typedArrayTags[uint16Tag]=typedArrayTags[uint32Tag]=true;typedArrayTags[argsTag]=typedArrayTags[arrayTag]=typedArrayTags[arrayBufferTag]=typedArrayTags[boolTag]=typedArrayTags[dataViewTag]=typedArrayTags[dateTag]=typedArrayTags[errorTag]=typedArrayTags[funcTag]=typedArrayTags[mapTag]=typedArrayTags[numberTag]=typedArrayTags[objectTag]=typedArrayTags[regexpTag]=typedArrayTags[setTag]=typedArrayTags[stringTag]=typedArrayTags[weakMapTag]=false;var freeGlobal=typeof global=="object"&&global&&global.Object===Object&&global;var freeSelf=typeof self=="object"&&self&&self.Object===Object&&self;var root=freeGlobal||freeSelf||Function("return this")();var freeExports=typeof exports=="object"&&exports&&!exports.nodeType&&exports;var freeModule=freeExports&&typeof module=="object"&&module&&!module.nodeType&&module;var moduleExports=freeModule&&freeModule.exports===freeExports;var freeProcess=moduleExports&&freeGlobal.process;var nodeUtil=function(){try{return freeProcess&&freeProcess.binding&&freeProcess.binding("util")}catch(e){}}();var nodeIsTypedArray=nodeUtil&&nodeUtil.isTypedArray;function apply(func,thisArg,args){switch(args.length){case 0:return func.call(thisArg);case 1:return func.call(thisArg,args[0]);case 2:return func.call(thisArg,args[0],args[1]);case 3:return func.call(thisArg,args[0],args[1],args[2])}return func.apply(thisArg,args)}function baseTimes(n,iteratee){var index=-1,result=Array(n);while(++index<n){result[index]=iteratee(index)}return result}function baseUnary(func){return function(value){return func(value)}}function getValue(object,key){return object==null?undefined:object[key]}function overArg(func,transform){return function(arg){return func(transform(arg))}}function safeGet(object,key){return key=="__proto__"?undefined:object[key]}var arrayProto=Array.prototype,funcProto=Function.prototype,objectProto=Object.prototype;var coreJsData=root["__core-js_shared__"];var funcToString=funcProto.toString;var hasOwnProperty=objectProto.hasOwnProperty;var maskSrcKey=function(){var uid=/[^.]+$/.exec(coreJsData&&coreJsData.keys&&coreJsData.keys.IE_PROTO||"");return uid?"Symbol(src)_1."+uid:""}();var nativeObjectToString=objectProto.toString;var objectCtorString=funcToString.call(Object);var reIsNative=RegExp("^"+funcToString.call(hasOwnProperty).replace(reRegExpChar,"\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,"$1.*?")+"$");var Buffer=moduleExports?root.Buffer:undefined,Symbol=root.Symbol,Uint8Array=root.Uint8Array,allocUnsafe=Buffer?Buffer.allocUnsafe:undefined,getPrototype=overArg(Object.getPrototypeOf,Object),objectCreate=Object.create,propertyIsEnumerable=objectProto.propertyIsEnumerable,splice=arrayProto.splice,symToStringTag=Symbol?Symbol.toStringTag:undefined;var defineProperty=function(){try{var func=getNative(Object,"defineProperty");func({},"",{});return func}catch(e){}}();var nativeIsBuffer=Buffer?Buffer.isBuffer:undefined,nativeMax=Math.max,nativeNow=Date.now;var Map=getNative(root,"Map"),nativeCreate=getNative(Object,"create");var baseCreate=function(){function object(){}return function(proto){if(!isObject(proto)){return{}}if(objectCreate){return objectCreate(proto)}object.prototype=proto;var result=new object;object.prototype=undefined;return result}}();function Hash(entries){var index=-1,length=entries==null?0:entries.length;this.clear();while(++index<length){var entry=entries[index];this.set(entry[0],entry[1])}}function hashClear(){this.__data__=nativeCreate?nativeCreate(null):{};this.size=0}function hashDelete(key){var result=this.has(key)&&delete this.__data__[key];this.size-=result?1:0;return result}function hashGet(key){var data=this.__data__;if(nativeCreate){var result=data[key];return result===HASH_UNDEFINED?undefined:result}return hasOwnProperty.call(data,key)?data[key]:undefined}function hashHas(key){var data=this.__data__;return nativeCreate?data[key]!==undefined:hasOwnProperty.call(data,key)}function hashSet(key,value){var data=this.__data__;this.size+=this.has(key)?0:1;data[key]=nativeCreate&&value===undefined?HASH_UNDEFINED:value;return this}Hash.prototype.clear=hashClear;Hash.prototype["delete"]=hashDelete;Hash.prototype.get=hashGet;Hash.prototype.has=hashHas;Hash.prototype.set=hashSet;function ListCache(entries){var index=-1,length=entries==null?0:entries.length;this.clear();while(++index<length){var entry=entries[index];this.set(entry[0],entry[1])}}function listCacheClear(){this.__data__=[];this.size=0}function listCacheDelete(key){var data=this.__data__,index=assocIndexOf(data,key);if(index<0){return false}var lastIndex=data.length-1;if(index==lastIndex){data.pop()}else{splice.call(data,index,1)}--this.size;return true}function listCacheGet(key){var data=this.__data__,index=assocIndexOf(data,key);return index<0?undefined:data[index][1]}function listCacheHas(key){return assocIndexOf(this.__data__,key)>-1}function listCacheSet(key,value){var data=this.__data__,index=assocIndexOf(data,key);if(index<0){++this.size;data.push([key,value])}else{data[index][1]=value}return this}ListCache.prototype.clear=listCacheClear;ListCache.prototype["delete"]=listCacheDelete;ListCache.prototype.get=listCacheGet;ListCache.prototype.has=listCacheHas;ListCache.prototype.set=listCacheSet;function MapCache(entries){var index=-1,length=entries==null?0:entries.length;this.clear();while(++index<length){var entry=entries[index];this.set(entry[0],entry[1])}}function mapCacheClear(){this.size=0;this.__data__={hash:new Hash,map:new(Map||ListCache),string:new Hash}}function mapCacheDelete(key){var result=getMapData(this,key)["delete"](key);this.size-=result?1:0;return result}function mapCacheGet(key){return getMapData(this,key).get(key)}function mapCacheHas(key){return getMapData(this,key).has(key)}function mapCacheSet(key,value){var data=getMapData(this,key),size=data.size;data.set(key,value);this.size+=data.size==size?0:1;return this}MapCache.prototype.clear=mapCacheClear;MapCache.prototype["delete"]=mapCacheDelete;MapCache.prototype.get=mapCacheGet;MapCache.prototype.has=mapCacheHas;MapCache.prototype.set=mapCacheSet;function Stack(entries){var data=this.__data__=new ListCache(entries);this.size=data.size}function stackClear(){this.__data__=new ListCache;this.size=0}function stackDelete(key){var data=this.__data__,result=data["delete"](key);this.size=data.size;return result}function stackGet(key){return this.__data__.get(key)}function stackHas(key){return this.__data__.has(key)}function stackSet(key,value){var data=this.__data__;if(data instanceof ListCache){var pairs=data.__data__;if(!Map||pairs.length<LARGE_ARRAY_SIZE-1){pairs.push([key,value]);this.size=++data.size;return this}data=this.__data__=new MapCache(pairs)}data.set(key,value);this.size=data.size;return this}Stack.prototype.clear=stackClear;Stack.prototype["delete"]=stackDelete;Stack.prototype.get=stackGet;Stack.prototype.has=stackHas;Stack.prototype.set=stackSet;function arrayLikeKeys(value,inherited){var isArr=isArray(value),isArg=!isArr&&isArguments(value),isBuff=!isArr&&!isArg&&isBuffer(value),isType=!isArr&&!isArg&&!isBuff&&isTypedArray(value),skipIndexes=isArr||isArg||isBuff||isType,result=skipIndexes?baseTimes(value.length,String):[],length=result.length;for(var key in value){if((inherited||hasOwnProperty.call(value,key))&&!(skipIndexes&&(key=="length"||isBuff&&(key=="offset"||key=="parent")||isType&&(key=="buffer"||key=="byteLength"||key=="byteOffset")||isIndex(key,length)))){result.push(key)}}return result}function assignMergeValue(object,key,value){if(value!==undefined&&!eq(object[key],value)||value===undefined&&!(key in object)){baseAssignValue(object,key,value)}}function assignValue(object,key,value){var objValue=object[key];if(!(hasOwnProperty.call(object,key)&&eq(objValue,value))||value===undefined&&!(key in object)){baseAssignValue(object,key,value)}}function assocIndexOf(array,key){var length=array.length;while(length--){if(eq(array[length][0],key)){return length}}return-1}function baseAssignValue(object,key,value){if(key=="__proto__"&&defineProperty){defineProperty(object,key,{configurable:true,enumerable:true,value:value,writable:true})}else{object[key]=value}}var baseFor=createBaseFor();function baseGetTag(value){if(value==null){return value===undefined?undefinedTag:nullTag}return symToStringTag&&symToStringTag in Object(value)?getRawTag(value):objectToString(value)}function baseIsArguments(value){return isObjectLike(value)&&baseGetTag(value)==argsTag}function baseIsNative(value){if(!isObject(value)||isMasked(value)){return false}var pattern=isFunction(value)?reIsNative:reIsHostCtor;return pattern.test(toSource(value))}function baseIsTypedArray(value){return isObjectLike(value)&&isLength(value.length)&&!!typedArrayTags[baseGetTag(value)]}function baseKeysIn(object){if(!isObject(object)){return nativeKeysIn(object)}var isProto=isPrototype(object),result=[];for(var key in object){if(!(key=="constructor"&&(isProto||!hasOwnProperty.call(object,key)))){result.push(key)}}return result}function baseMerge(object,source,srcIndex,customizer,stack){if(object===source){return}baseFor(source,function(srcValue,key){if(isObject(srcValue)){stack||(stack=new Stack);baseMergeDeep(object,source,key,srcIndex,baseMerge,customizer,stack)}else{var newValue=customizer?customizer(safeGet(object,key),srcValue,key+"",object,source,stack):undefined;if(newValue===undefined){newValue=srcValue}assignMergeValue(object,key,newValue)}},keysIn)}function baseMergeDeep(object,source,key,srcIndex,mergeFunc,customizer,stack){var objValue=safeGet(object,key),srcValue=safeGet(source,key),stacked=stack.get(srcValue);if(stacked){assignMergeValue(object,key,stacked);return}var newValue=customizer?customizer(objValue,srcValue,key+"",object,source,stack):undefined;var isCommon=newValue===undefined;if(isCommon){var isArr=isArray(srcValue),isBuff=!isArr&&isBuffer(srcValue),isTyped=!isArr&&!isBuff&&isTypedArray(srcValue);newValue=srcValue;if(isArr||isBuff||isTyped){if(isArray(objValue)){newValue=objValue}else if(isArrayLikeObject(objValue)){newValue=copyArray(objValue)}else if(isBuff){isCommon=false;newValue=cloneBuffer(srcValue,true)}else if(isTyped){isCommon=false;newValue=cloneTypedArray(srcValue,true)}else{newValue=[]}}else if(isPlainObject(srcValue)||isArguments(srcValue)){newValue=objValue;if(isArguments(objValue)){newValue=toPlainObject(objValue)}else if(!isObject(objValue)||srcIndex&&isFunction(objValue)){newValue=initCloneObject(srcValue)}}else{isCommon=false}}if(isCommon){stack.set(srcValue,newValue);mergeFunc(newValue,srcValue,srcIndex,customizer,stack);stack["delete"](srcValue)}assignMergeValue(object,key,newValue)}function baseRest(func,start){return setToString(overRest(func,start,identity),func+"")}var baseSetToString=!defineProperty?identity:function(func,string){return defineProperty(func,"toString",{configurable:true,enumerable:false,value:constant(string),writable:true})};function cloneBuffer(buffer,isDeep){if(isDeep){return buffer.slice()}var length=buffer.length,result=allocUnsafe?allocUnsafe(length):new buffer.constructor(length);buffer.copy(result);return result}function cloneArrayBuffer(arrayBuffer){var result=new arrayBuffer.constructor(arrayBuffer.byteLength);new Uint8Array(result).set(new Uint8Array(arrayBuffer));return result}function cloneTypedArray(typedArray,isDeep){var buffer=isDeep?cloneArrayBuffer(typedArray.buffer):typedArray.buffer;return new typedArray.constructor(buffer,typedArray.byteOffset,typedArray.length)}function copyArray(source,array){var index=-1,length=source.length;array||(array=Array(length));while(++index<length){array[index]=source[index]}return array}function copyObject(source,props,object,customizer){var isNew=!object;object||(object={});var index=-1,length=props.length;while(++index<length){var key=props[index];var newValue=customizer?customizer(object[key],source[key],key,object,source):undefined;if(newValue===undefined){newValue=source[key]}if(isNew){baseAssignValue(object,key,newValue)}else{assignValue(object,key,newValue)}}return object}function createAssigner(assigner){return baseRest(function(object,sources){var index=-1,length=sources.length,customizer=length>1?sources[length-1]:undefined,guard=length>2?sources[2]:undefined;customizer=assigner.length>3&&typeof customizer=="function"?(length--,customizer):undefined;if(guard&&isIterateeCall(sources[0],sources[1],guard)){customizer=length<3?undefined:customizer;length=1}object=Object(object);while(++index<length){var source=sources[index];if(source){assigner(object,source,index,customizer)}}return object})}function createBaseFor(fromRight){return function(object,iteratee,keysFunc){var index=-1,iterable=Object(object),props=keysFunc(object),length=props.length;while(length--){var key=props[fromRight?length:++index];if(iteratee(iterable[key],key,iterable)===false){break}}return object}}function getMapData(map,key){var data=map.__data__;return isKeyable(key)?data[typeof key=="string"?"string":"hash"]:data.map}function getNative(object,key){var value=getValue(object,key);return baseIsNative(value)?value:undefined}function getRawTag(value){var isOwn=hasOwnProperty.call(value,symToStringTag),tag=value[symToStringTag];try{value[symToStringTag]=undefined;var unmasked=true}catch(e){}var result=nativeObjectToString.call(value);if(unmasked){if(isOwn){value[symToStringTag]=tag}else{delete value[symToStringTag]}}return result}function initCloneObject(object){return typeof object.constructor=="function"&&!isPrototype(object)?baseCreate(getPrototype(object)):{}}function isIndex(value,length){var type=typeof value;length=length==null?MAX_SAFE_INTEGER:length;return!!length&&(type=="number"||type!="symbol"&&reIsUint.test(value))&&(value>-1&&value%1==0&&value<length)}function isIterateeCall(value,index,object){if(!isObject(object)){return false}var type=typeof index;if(type=="number"?isArrayLike(object)&&isIndex(index,object.length):type=="string"&&index in object){return eq(object[index],value)}return false}function isKeyable(value){var type=typeof value;return type=="string"||type=="number"||type=="symbol"||type=="boolean"?value!=="__proto__":value===null}function isMasked(func){return!!maskSrcKey&&maskSrcKey in func}function isPrototype(value){var Ctor=value&&value.constructor,proto=typeof Ctor=="function"&&Ctor.prototype||objectProto;return value===proto}function nativeKeysIn(object){var result=[];if(object!=null){for(var key in Object(object)){result.push(key)}}return result}function objectToString(value){return nativeObjectToString.call(value)}function overRest(func,start,transform){start=nativeMax(start===undefined?func.length-1:start,0);return function(){var args=arguments,index=-1,length=nativeMax(args.length-start,0),array=Array(length);while(++index<length){array[index]=args[start+index]}index=-1;var otherArgs=Array(start+1);while(++index<start){otherArgs[index]=args[index]}otherArgs[start]=transform(array);return apply(func,this,otherArgs)}}var setToString=shortOut(baseSetToString);function shortOut(func){var count=0,lastCalled=0;return function(){var stamp=nativeNow(),remaining=HOT_SPAN-(stamp-lastCalled);lastCalled=stamp;if(remaining>0){if(++count>=HOT_COUNT){return arguments[0]}}else{count=0}return func.apply(undefined,arguments)}}function toSource(func){if(func!=null){try{return funcToString.call(func)}catch(e){}try{return func+""}catch(e){}}return""}function eq(value,other){return value===other||value!==value&&other!==other}var isArguments=baseIsArguments(function(){return arguments}())?baseIsArguments:function(value){return isObjectLike(value)&&hasOwnProperty.call(value,"callee")&&!propertyIsEnumerable.call(value,"callee")};var isArray=Array.isArray;function isArrayLike(value){return value!=null&&isLength(value.length)&&!isFunction(value)}function isArrayLikeObject(value){return isObjectLike(value)&&isArrayLike(value)}var isBuffer=nativeIsBuffer||stubFalse;function isFunction(value){if(!isObject(value)){return false}var tag=baseGetTag(value);return tag==funcTag||tag==genTag||tag==asyncTag||tag==proxyTag}function isLength(value){return typeof value=="number"&&value>-1&&value%1==0&&value<=MAX_SAFE_INTEGER}function isObject(value){var type=typeof value;return value!=null&&(type=="object"||type=="function")}function isObjectLike(value){return value!=null&&typeof value=="object"}function isPlainObject(value){if(!isObjectLike(value)||baseGetTag(value)!=objectTag){return false}var proto=getPrototype(value);if(proto===null){return true}var Ctor=hasOwnProperty.call(proto,"constructor")&&proto.constructor;return typeof Ctor=="function"&&Ctor instanceof Ctor&&funcToString.call(Ctor)==objectCtorString}var isTypedArray=nodeIsTypedArray?baseUnary(nodeIsTypedArray):baseIsTypedArray;function toPlainObject(value){return copyObject(value,keysIn(value))}function keysIn(object){return isArrayLike(object)?arrayLikeKeys(object,true):baseKeysIn(object)}var mergeWith=createAssigner(function(object,source,srcIndex,customizer){baseMerge(object,source,srcIndex,customizer)});function constant(value){return function(){return value}}function identity(value){return value}function stubFalse(){return false}module.exports=mergeWith}).call(this,typeof global!=="undefined"?global:typeof self!=="undefined"?self:typeof window!=="undefined"?window:{})},{}],42:[function(require,module,exports){"use strict";module.exports=Number.isNaN||function(x){return x!==x}},{}],43:[function(require,module,exports){(function(process){function normalizeArray(parts,allowAboveRoot){var up=0;for(var i=parts.length-1;i>=0;i--){var last=parts[i];if(last==="."){parts.splice(i,1)}else if(last===".."){parts.splice(i,1);up++}else if(up){parts.splice(i,1);up--}}if(allowAboveRoot){for(;up--;up){parts.unshift("..")}}return parts}exports.resolve=function(){var resolvedPath="",resolvedAbsolute=false;for(var i=arguments.length-1;i>=-1&&!resolvedAbsolute;i--){var path=i>=0?arguments[i]:process.cwd();if(typeof path!=="string"){throw new TypeError("Arguments to path.resolve must be strings")}else if(!path){continue}resolvedPath=path+"/"+resolvedPath;resolvedAbsolute=path.charAt(0)==="/"}resolvedPath=normalizeArray(filter(resolvedPath.split("/"),function(p){return!!p}),!resolvedAbsolute).join("/");return(resolvedAbsolute?"/":"")+resolvedPath||"."};exports.normalize=function(path){var isAbsolute=exports.isAbsolute(path),trailingSlash=substr(path,-1)==="/";path=normalizeArray(filter(path.split("/"),function(p){return!!p}),!isAbsolute).join("/");if(!path&&!isAbsolute){path="."}if(path&&trailingSlash){path+="/"}return(isAbsolute?"/":"")+path};exports.isAbsolute=function(path){return path.charAt(0)==="/"};exports.join=function(){var paths=Array.prototype.slice.call(arguments,0);return exports.normalize(filter(paths,function(p,index){if(typeof p!=="string"){throw new TypeError("Arguments to path.join must be strings")}return p}).join("/"))};exports.relative=function(from,to){from=exports.resolve(from).substr(1);to=exports.resolve(to).substr(1);function trim(arr){var start=0;for(;start<arr.length;start++){if(arr[start]!=="")break}var end=arr.length-1;for(;end>=0;end--){if(arr[end]!=="")break}if(start>end)return[];return arr.slice(start,end-start+1)}var fromParts=trim(from.split("/"));var toParts=trim(to.split("/"));var length=Math.min(fromParts.length,toParts.length);var samePartsLength=length;for(var i=0;i<length;i++){if(fromParts[i]!==toParts[i]){samePartsLength=i;break}}var outputParts=[];for(var i=samePartsLength;i<fromParts.length;i++){outputParts.push("..")}outputParts=outputParts.concat(toParts.slice(samePartsLength));return outputParts.join("/")};exports.sep="/";exports.delimiter=":";exports.dirname=function(path){if(typeof path!=="string")path=path+"";if(path.length===0)return".";var code=path.charCodeAt(0);var hasRoot=code===47;var end=-1;var matchedSlash=true;for(var i=path.length-1;i>=1;--i){code=path.charCodeAt(i);if(code===47){if(!matchedSlash){end=i;break}}else{matchedSlash=false}}if(end===-1)return hasRoot?"/":".";if(hasRoot&&end===1){return"/"}return path.slice(0,end)};function basename(path){if(typeof path!=="string")path=path+"";var start=0;var end=-1;var matchedSlash=true;var i;for(i=path.length-1;i>=0;--i){if(path.charCodeAt(i)===47){if(!matchedSlash){start=i+1;break}}else if(end===-1){matchedSlash=false;end=i+1}}if(end===-1)return"";return path.slice(start,end)}exports.basename=function(path,ext){var f=basename(path);if(ext&&f.substr(-1*ext.length)===ext){f=f.substr(0,f.length-ext.length)}return f};exports.extname=function(path){if(typeof path!=="string")path=path+"";var startDot=-1;var startPart=0;var end=-1;var matchedSlash=true;var preDotState=0;for(var i=path.length-1;i>=0;--i){var code=path.charCodeAt(i);if(code===47){if(!matchedSlash){startPart=i+1;break}continue}if(end===-1){matchedSlash=false;end=i+1}if(code===46){if(startDot===-1)startDot=i;else if(preDotState!==1)preDotState=1}else if(startDot!==-1){preDotState=-1}}if(startDot===-1||end===-1||preDotState===0||preDotState===1&&startDot===end-1&&startDot===startPart+1){return""}return path.slice(startDot,end)};function filter(xs,f){if(xs.filter)return xs.filter(f);var res=[];for(var i=0;i<xs.length;i++){if(f(xs[i],i,xs))res.push(xs[i])}return res}var substr="ab".substr(-1)==="b"?function(str,start,len){return str.substr(start,len)}:function(str,start,len){if(start<0)start=str.length+start;return str.substr(start,len)}}).call(this,require("_process"))},{_process:68}],44:[function(require,module,exports){"use strict";exports.__esModule=true;exports.default=void 0;var _container=_interopRequireDefault(require("./container"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}function _inheritsLoose(subClass,superClass){subClass.prototype=Object.create(superClass.prototype);subClass.prototype.constructor=subClass;subClass.__proto__=superClass}var AtRule=function(_Container){_inheritsLoose(AtRule,_Container);function AtRule(defaults){var _this;_this=_Container.call(this,defaults)||this;_this.type="atrule";return _this}var _proto=AtRule.prototype;_proto.append=function append(){var _Container$prototype$;if(!this.nodes)this.nodes=[];for(var _len=arguments.length,children=new Array(_len),_key=0;_key<_len;_key++){children[_key]=arguments[_key]}return(_Container$prototype$=_Container.prototype.append).call.apply(_Container$prototype$,[this].concat(children))};_proto.prepend=function prepend(){var _Container$prototype$2;if(!this.nodes)this.nodes=[];for(var _len2=arguments.length,children=new Array(_len2),_key2=0;_key2<_len2;_key2++){children[_key2]=arguments[_key2]}return(_Container$prototype$2=_Container.prototype.prepend).call.apply(_Container$prototype$2,[this].concat(children))};return AtRule}(_container.default);var _default=AtRule;exports.default=_default;module.exports=exports.default},{"./container":46}],45:[function(require,module,exports){"use strict";exports.__esModule=true;exports.default=void 0;var _node=_interopRequireDefault(require("./node"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}function _inheritsLoose(subClass,superClass){subClass.prototype=Object.create(superClass.prototype);subClass.prototype.constructor=subClass;subClass.__proto__=superClass}var Comment=function(_Node){_inheritsLoose(Comment,_Node);function Comment(defaults){var _this;_this=_Node.call(this,defaults)||this;_this.type="comment";return _this}return Comment}(_node.default);var _default=Comment;exports.default=_default;module.exports=exports.default},{"./node":53}],46:[function(require,module,exports){"use strict";exports.__esModule=true;exports.default=void 0;var _declaration=_interopRequireDefault(require("./declaration"));var _comment=_interopRequireDefault(require("./comment"));var _node=_interopRequireDefault(require("./node"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}function _defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor)}}function _createClass(Constructor,protoProps,staticProps){if(protoProps)_defineProperties(Constructor.prototype,protoProps);if(staticProps)_defineProperties(Constructor,staticProps);return Constructor}function _inheritsLoose(subClass,superClass){subClass.prototype=Object.create(superClass.prototype);subClass.prototype.constructor=subClass;subClass.__proto__=superClass}function cleanSource(nodes){return nodes.map(function(i){if(i.nodes)i.nodes=cleanSource(i.nodes);delete i.source;return i})}var Container=function(_Node){_inheritsLoose(Container,_Node);function Container(){return _Node.apply(this,arguments)||this}var _proto=Container.prototype;_proto.push=function push(child){child.parent=this;this.nodes.push(child);return this};_proto.each=function each(callback){if(!this.lastEach)this.lastEach=0;if(!this.indexes)this.indexes={};this.lastEach+=1;var id=this.lastEach;this.indexes[id]=0;if(!this.nodes)return undefined;var index,result;while(this.indexes[id]<this.nodes.length){index=this.indexes[id];result=callback(this.nodes[index],index);if(result===false)break;this.indexes[id]+=1}delete this.indexes[id];return result};_proto.walk=function walk(callback){return this.each(function(child,i){var result;try{result=callback(child,i)}catch(e){e.postcssNode=child;if(e.stack&&child.source&&/\n\s{4}at /.test(e.stack)){var s=child.source;e.stack=e.stack.replace(/\n\s{4}at /,"$&"+s.input.from+":"+s.start.line+":"+s.start.column+"$&")}throw e}if(result!==false&&child.walk){result=child.walk(callback)}return result})};_proto.walkDecls=function walkDecls(prop,callback){if(!callback){callback=prop;return this.walk(function(child,i){if(child.type==="decl"){return callback(child,i)}})}if(prop instanceof RegExp){return this.walk(function(child,i){if(child.type==="decl"&&prop.test(child.prop)){return callback(child,i)}})}return this.walk(function(child,i){if(child.type==="decl"&&child.prop===prop){return callback(child,i)}})};_proto.walkRules=function walkRules(selector,callback){if(!callback){callback=selector;return this.walk(function(child,i){if(child.type==="rule"){return callback(child,i)}})}if(selector instanceof RegExp){return this.walk(function(child,i){if(child.type==="rule"&&selector.test(child.selector)){return callback(child,i)}})}return this.walk(function(child,i){if(child.type==="rule"&&child.selector===selector){return callback(child,i)}})};_proto.walkAtRules=function walkAtRules(name,callback){if(!callback){callback=name;return this.walk(function(child,i){if(child.type==="atrule"){return callback(child,i)}})}if(name instanceof RegExp){return this.walk(function(child,i){if(child.type==="atrule"&&name.test(child.name)){return callback(child,i)}})}return this.walk(function(child,i){if(child.type==="atrule"&&child.name===name){return callback(child,i)}})};_proto.walkComments=function walkComments(callback){return this.walk(function(child,i){if(child.type==="comment"){return callback(child,i)}})};_proto.append=function append(){for(var _len=arguments.length,children=new Array(_len),_key=0;_key<_len;_key++){children[_key]=arguments[_key]}for(var _i=0;_i<children.length;_i++){var child=children[_i];var nodes=this.normalize(child,this.last);for(var _iterator=nodes,_isArray=Array.isArray(_iterator),_i2=0,_iterator=_isArray?_iterator:_iterator[Symbol.iterator]();;){var _ref;if(_isArray){if(_i2>=_iterator.length)break;_ref=_iterator[_i2++]}else{_i2=_iterator.next();if(_i2.done)break;_ref=_i2.value}var node=_ref;this.nodes.push(node)}}return this};_proto.prepend=function prepend(){for(var _len2=arguments.length,children=new Array(_len2),_key2=0;_key2<_len2;_key2++){children[_key2]=arguments[_key2]}children=children.reverse();for(var _iterator2=children,_isArray2=Array.isArray(_iterator2),_i3=0,_iterator2=_isArray2?_iterator2:_iterator2[Symbol.iterator]();;){var _ref2;if(_isArray2){if(_i3>=_iterator2.length)break;_ref2=_iterator2[_i3++]}else{_i3=_iterator2.next();if(_i3.done)break;_ref2=_i3.value}var child=_ref2;var nodes=this.normalize(child,this.first,"prepend").reverse();for(var _iterator3=nodes,_isArray3=Array.isArray(_iterator3),_i4=0,_iterator3=_isArray3?_iterator3:_iterator3[Symbol.iterator]();;){var _ref3;if(_isArray3){if(_i4>=_iterator3.length)break;_ref3=_iterator3[_i4++]}else{_i4=_iterator3.next();if(_i4.done)break;_ref3=_i4.value}var node=_ref3;this.nodes.unshift(node)}for(var id in this.indexes){this.indexes[id]=this.indexes[id]+nodes.length}}return this};_proto.cleanRaws=function cleanRaws(keepBetween){_Node.prototype.cleanRaws.call(this,keepBetween);if(this.nodes){for(var _iterator4=this.nodes,_isArray4=Array.isArray(_iterator4),_i5=0,_iterator4=_isArray4?_iterator4:_iterator4[Symbol.iterator]();;){var _ref4;if(_isArray4){if(_i5>=_iterator4.length)break;_ref4=_iterator4[_i5++]}else{_i5=_iterator4.next();if(_i5.done)break;_ref4=_i5.value}var node=_ref4;node.cleanRaws(keepBetween)}}};_proto.insertBefore=function insertBefore(exist,add){exist=this.index(exist);var type=exist===0?"prepend":false;var nodes=this.normalize(add,this.nodes[exist],type).reverse();for(var _iterator5=nodes,_isArray5=Array.isArray(_iterator5),_i6=0,_iterator5=_isArray5?_iterator5:_iterator5[Symbol.iterator]();;){var _ref5;if(_isArray5){if(_i6>=_iterator5.length)break;_ref5=_iterator5[_i6++]}else{_i6=_iterator5.next();if(_i6.done)break;_ref5=_i6.value}var node=_ref5;this.nodes.splice(exist,0,node)}var index;for(var id in this.indexes){index=this.indexes[id];if(exist<=index){this.indexes[id]=index+nodes.length}}return this};_proto.insertAfter=function insertAfter(exist,add){exist=this.index(exist);var nodes=this.normalize(add,this.nodes[exist]).reverse();for(var _iterator6=nodes,_isArray6=Array.isArray(_iterator6),_i7=0,_iterator6=_isArray6?_iterator6:_iterator6[Symbol.iterator]();;){var _ref6;if(_isArray6){if(_i7>=_iterator6.length)break;_ref6=_iterator6[_i7++]}else{_i7=_iterator6.next();if(_i7.done)break;_ref6=_i7.value}var node=_ref6;this.nodes.splice(exist+1,0,node)}var index;for(var id in this.indexes){index=this.indexes[id];if(exist<index){this.indexes[id]=index+nodes.length}}return this};_proto.removeChild=function removeChild(child){child=this.index(child);this.nodes[child].parent=undefined;this.nodes.splice(child,1);var index;for(var id in this.indexes){index=this.indexes[id];if(index>=child){this.indexes[id]=index-1}}return this};_proto.removeAll=function removeAll(){for(var _iterator7=this.nodes,_isArray7=Array.isArray(_iterator7),_i8=0,_iterator7=_isArray7?_iterator7:_iterator7[Symbol.iterator]();;){var _ref7;if(_isArray7){if(_i8>=_iterator7.length)break;_ref7=_iterator7[_i8++]}else{_i8=_iterator7.next();if(_i8.done)break;_ref7=_i8.value}var node=_ref7;node.parent=undefined}this.nodes=[];return this};_proto.replaceValues=function replaceValues(pattern,opts,callback){if(!callback){callback=opts;opts={}}this.walkDecls(function(decl){if(opts.props&&opts.props.indexOf(decl.prop)===-1)return;if(opts.fast&&decl.value.indexOf(opts.fast)===-1)return;decl.value=decl.value.replace(pattern,callback)});return this};_proto.every=function every(condition){return this.nodes.every(condition)};_proto.some=function some(condition){return this.nodes.some(condition)};_proto.index=function index(child){if(typeof child==="number"){return child}return this.nodes.indexOf(child)};_proto.normalize=function normalize(nodes,sample){var _this=this;if(typeof nodes==="string"){var parse=require("./parse");nodes=cleanSource(parse(nodes).nodes)}else if(Array.isArray(nodes)){nodes=nodes.slice(0);for(var _iterator8=nodes,_isArray8=Array.isArray(_iterator8),_i9=0,_iterator8=_isArray8?_iterator8:_iterator8[Symbol.iterator]();;){var _ref8;if(_isArray8){if(_i9>=_iterator8.length)break;_ref8=_iterator8[_i9++]}else{_i9=_iterator8.next();if(_i9.done)break;_ref8=_i9.value}var i=_ref8;if(i.parent)i.parent.removeChild(i,"ignore")}}else if(nodes.type==="root"){nodes=nodes.nodes.slice(0);for(var _iterator9=nodes,_isArray9=Array.isArray(_iterator9),_i10=0,_iterator9=_isArray9?_iterator9:_iterator9[Symbol.iterator]();;){var _ref9;if(_isArray9){if(_i10>=_iterator9.length)break;_ref9=_iterator9[_i10++]}else{_i10=_iterator9.next();if(_i10.done)break;_ref9=_i10.value}var _i11=_ref9;if(_i11.parent)_i11.parent.removeChild(_i11,"ignore")}}else if(nodes.type){nodes=[nodes]}else if(nodes.prop){if(typeof nodes.value==="undefined"){throw new Error("Value field is missed in node creation")}else if(typeof nodes.value!=="string"){nodes.value=String(nodes.value)}nodes=[new _declaration.default(nodes)]}else if(nodes.selector){var Rule=require("./rule");nodes=[new Rule(nodes)]}else if(nodes.name){var AtRule=require("./at-rule");nodes=[new AtRule(nodes)]}else if(nodes.text){nodes=[new _comment.default(nodes)]}else{throw new Error("Unknown node type in node creation")}var processed=nodes.map(function(i){if(i.parent)i.parent.removeChild(i);if(typeof i.raws.before==="undefined"){if(sample&&typeof sample.raws.before!=="undefined"){i.raws.before=sample.raws.before.replace(/[^\s]/g,"")}}i.parent=_this;return i});return processed};_createClass(Container,[{key:"first",get:function get(){if(!this.nodes)return undefined;return this.nodes[0]}},{key:"last",get:function get(){if(!this.nodes)return undefined;return this.nodes[this.nodes.length-1]}}]);return Container}(_node.default);var _default=Container;exports.default=_default;module.exports=exports.default},{"./at-rule":44,"./comment":45,"./declaration":48,"./node":53,"./parse":54,"./rule":61}],47:[function(require,module,exports){"use strict";exports.__esModule=true;exports.default=void 0;var _supportsColor=_interopRequireDefault(require("supports-color"));var _chalk=_interopRequireDefault(require("chalk"));var _terminalHighlight=_interopRequireDefault(require("./terminal-highlight"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}function _inheritsLoose(subClass,superClass){subClass.prototype=Object.create(superClass.prototype);subClass.prototype.constructor=subClass;subClass.__proto__=superClass}function _assertThisInitialized(self){if(self===void 0){throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}return self}function _wrapNativeSuper(Class){var _cache=typeof Map==="function"?new Map:undefined;_wrapNativeSuper=function _wrapNativeSuper(Class){if(Class===null||!_isNativeFunction(Class))return Class;if(typeof Class!=="function"){throw new TypeError("Super expression must either be null or a function")}if(typeof _cache!=="undefined"){if(_cache.has(Class))return _cache.get(Class);_cache.set(Class,Wrapper)}function Wrapper(){return _construct(Class,arguments,_getPrototypeOf(this).constructor)}Wrapper.prototype=Object.create(Class.prototype,{constructor:{value:Wrapper,enumerable:false,writable:true,configurable:true}});return _setPrototypeOf(Wrapper,Class)};return _wrapNativeSuper(Class)}function isNativeReflectConstruct(){if(typeof Reflect==="undefined"||!Reflect.construct)return false;if(Reflect.construct.sham)return false;if(typeof Proxy==="function")return true;try{Date.prototype.toString.call(Reflect.construct(Date,[],function(){}));return true}catch(e){return false}}function _construct(Parent,args,Class){if(isNativeReflectConstruct()){_construct=Reflect.construct}else{_construct=function _construct(Parent,args,Class){var a=[null];a.push.apply(a,args);var Constructor=Function.bind.apply(Parent,a);var instance=new Constructor;if(Class)_setPrototypeOf(instance,Class.prototype);return instance}}return _construct.apply(null,arguments)}function _isNativeFunction(fn){return Function.toString.call(fn).indexOf("[native code]")!==-1}function _setPrototypeOf(o,p){_setPrototypeOf=Object.setPrototypeOf||function _setPrototypeOf(o,p){o.__proto__=p;return o};return _setPrototypeOf(o,p)}function _getPrototypeOf(o){_getPrototypeOf=Object.setPrototypeOf?Object.getPrototypeOf:function _getPrototypeOf(o){return o.__proto__||Object.getPrototypeOf(o)};return _getPrototypeOf(o)}var CssSyntaxError=function(_Error){_inheritsLoose(CssSyntaxError,_Error);function CssSyntaxError(message,line,column,source,file,plugin){var _this;_this=_Error.call(this,message)||this;_this.name="CssSyntaxError";_this.reason=message;if(file){_this.file=file}if(source){_this.source=source}if(plugin){_this.plugin=plugin}if(typeof line!=="undefined"&&typeof column!=="undefined"){_this.line=line;_this.column=column}_this.setMessage();if(Error.captureStackTrace){Error.captureStackTrace(_assertThisInitialized(_assertThisInitialized(_this)),CssSyntaxError)}return _this}var _proto=CssSyntaxError.prototype;_proto.setMessage=function setMessage(){this.message=this.plugin?this.plugin+": ":"";this.message+=this.file?this.file:"<css input>";if(typeof this.line!=="undefined"){this.message+=":"+this.line+":"+this.column}this.message+=": "+this.reason};_proto.showSourceCode=function showSourceCode(color){var _this2=this;if(!this.source)return"";var css=this.source;if(_terminalHighlight.default){if(typeof color==="undefined")color=_supportsColor.default.stdout;if(color)css=(0,_terminalHighlight.default)(css)}var lines=css.split(/\r?\n/);var start=Math.max(this.line-3,0);var end=Math.min(this.line+2,lines.length);var maxWidth=String(end).length;function mark(text){if(color&&_chalk.default.red){return _chalk.default.red.bold(text)}return text}function aside(text){if(color&&_chalk.default.gray){return _chalk.default.gray(text)}return text}return lines.slice(start,end).map(function(line,index){var number=start+1+index;var gutter=" "+(" "+number).slice(-maxWidth)+" | ";if(number===_this2.line){var spacing=aside(gutter.replace(/\d/g," "))+line.slice(0,_this2.column-1).replace(/[^\t]/g," ");return mark(">")+aside(gutter)+line+"\n "+spacing+mark("^")}return" "+aside(gutter)+line}).join("\n")};_proto.toString=function toString(){var code=this.showSourceCode();if(code){code="\n\n"+code+"\n"}return this.name+": "+this.message+code};return CssSyntaxError}(_wrapNativeSuper(Error));var _default=CssSyntaxError;exports.default=_default;module.exports=exports.default},{"./terminal-highlight":4,chalk:4,"supports-color":4}],48:[function(require,module,exports){"use strict";exports.__esModule=true;exports.default=void 0;var _node=_interopRequireDefault(require("./node"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}function _inheritsLoose(subClass,superClass){subClass.prototype=Object.create(superClass.prototype);subClass.prototype.constructor=subClass;subClass.__proto__=superClass}var Declaration=function(_Node){_inheritsLoose(Declaration,_Node);function Declaration(defaults){var _this;_this=_Node.call(this,defaults)||this;_this.type="decl";return _this}return Declaration}(_node.default);var _default=Declaration;exports.default=_default;module.exports=exports.default},{"./node":53}],49:[function(require,module,exports){"use strict";exports.__esModule=true;exports.default=void 0;var _cssSyntaxError=_interopRequireDefault(require("./css-syntax-error"));var _previousMap=_interopRequireDefault(require("./previous-map"));var _path=_interopRequireDefault(require("path"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}function _defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor)}}function _createClass(Constructor,protoProps,staticProps){if(protoProps)_defineProperties(Constructor.prototype,protoProps);if(staticProps)_defineProperties(Constructor,staticProps);return Constructor}var sequence=0;var Input=function(){function Input(css,opts){if(opts===void 0){opts={}}if(css===null||typeof css==="object"&&!css.toString){throw new Error("PostCSS received "+css+" instead of CSS string")}this.css=css.toString();if(this.css[0]==="\ufeff"||this.css[0]==="￾"){this.hasBOM=true;this.css=this.css.slice(1)}else{this.hasBOM=false}if(opts.from){if(/^\w+:\/\//.test(opts.from)){this.file=opts.from}else{this.file=_path.default.resolve(opts.from)}}var map=new _previousMap.default(this.css,opts);if(map.text){this.map=map;var file=map.consumer().file;if(!this.file&&file)this.file=this.mapResolve(file)}if(!this.file){sequence+=1;this.id="<input css "+sequence+">"}if(this.map)this.map.file=this.from}var _proto=Input.prototype;_proto.error=function error(message,line,column,opts){if(opts===void 0){opts={}}var result;var origin=this.origin(line,column);if(origin){result=new _cssSyntaxError.default(message,origin.line,origin.column,origin.source,origin.file,opts.plugin)}else{result=new _cssSyntaxError.default(message,line,column,this.css,this.file,opts.plugin)}result.input={line:line,column:column,source:this.css};if(this.file)result.input.file=this.file;return result};_proto.origin=function origin(line,column){if(!this.map)return false;var consumer=this.map.consumer();var from=consumer.originalPositionFor({line:line,column:column});if(!from.source)return false;var result={file:this.mapResolve(from.source),line:from.line,column:from.column};var source=consumer.sourceContentFor(from.source);if(source)result.source=source;return result};_proto.mapResolve=function mapResolve(file){if(/^\w+:\/\//.test(file)){return file}return _path.default.resolve(this.map.consumer().sourceRoot||".",file)};_createClass(Input,[{key:"from",get:function get(){return this.file||this.id}}]);return Input}();var _default=Input;exports.default=_default;module.exports=exports.default},{"./css-syntax-error":47,"./previous-map":57,path:43}],50:[function(require,module,exports){(function(process){"use strict";exports.__esModule=true;exports.default=void 0;var _mapGenerator=_interopRequireDefault(require("./map-generator"));var _stringify2=_interopRequireDefault(require("./stringify"));var _warnOnce=_interopRequireDefault(require("./warn-once"));var _result=_interopRequireDefault(require("./result"));var _parse=_interopRequireDefault(require("./parse"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}function _defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor)}}function _createClass(Constructor,protoProps,staticProps){if(protoProps)_defineProperties(Constructor.prototype,protoProps);if(staticProps)_defineProperties(Constructor,staticProps);return Constructor}function isPromise(obj){return typeof obj==="object"&&typeof obj.then==="function"}var LazyResult=function(){function LazyResult(processor,css,opts){this.stringified=false;this.processed=false;var root;if(typeof css==="object"&&css!==null&&css.type==="root"){root=css}else if(css instanceof LazyResult||css instanceof _result.default){root=css.root;if(css.map){if(typeof opts.map==="undefined")opts.map={};if(!opts.map.inline)opts.map.inline=false;opts.map.prev=css.map}}else{var parser=_parse.default;if(opts.syntax)parser=opts.syntax.parse;if(opts.parser)parser=opts.parser;if(parser.parse)parser=parser.parse;try{root=parser(css,opts)}catch(error){this.error=error}}this.result=new _result.default(processor,root,opts)}var _proto=LazyResult.prototype;_proto.warnings=function warnings(){return this.sync().warnings()};_proto.toString=function toString(){return this.css};_proto.then=function then(onFulfilled,onRejected){if(process.env.NODE_ENV!=="production"){if(!("from"in this.opts)){(0,_warnOnce.default)("Without `from` option PostCSS could generate wrong source map "+"and will not find Browserslist config. Set it to CSS file path "+"or to `undefined` to prevent this warning.")}}return this.async().then(onFulfilled,onRejected)};_proto.catch=function _catch(onRejected){return this.async().catch(onRejected)};_proto.finally=function _finally(onFinally){return this.async().then(onFinally,onFinally)};_proto.handleError=function handleError(error,plugin){try{this.error=error;if(error.name==="CssSyntaxError"&&!error.plugin){error.plugin=plugin.postcssPlugin;error.setMessage()}else if(plugin.postcssVersion){if(process.env.NODE_ENV!=="production"){var pluginName=plugin.postcssPlugin;var pluginVer=plugin.postcssVersion;var runtimeVer=this.result.processor.version;var a=pluginVer.split(".");var b=runtimeVer.split(".");if(a[0]!==b[0]||parseInt(a[1])>parseInt(b[1])){console.error("Unknown error from PostCSS plugin. Your current PostCSS "+"version is "+runtimeVer+", but "+pluginName+" uses "+pluginVer+". Perhaps this is the source of the error below.")}}}}catch(err){if(console&&console.error)console.error(err)}};_proto.asyncTick=function asyncTick(resolve,reject){var _this=this;if(this.plugin>=this.processor.plugins.length){this.processed=true;return resolve()}try{var plugin=this.processor.plugins[this.plugin];var promise=this.run(plugin);this.plugin+=1;if(isPromise(promise)){promise.then(function(){_this.asyncTick(resolve,reject)}).catch(function(error){_this.handleError(error,plugin);_this.processed=true;reject(error)})}else{this.asyncTick(resolve,reject)}}catch(error){this.processed=true;reject(error)}};_proto.async=function async(){var _this2=this;if(this.processed){return new Promise(function(resolve,reject){if(_this2.error){reject(_this2.error)}else{resolve(_this2.stringify())}})}if(this.processing){return this.processing}this.processing=new Promise(function(resolve,reject){if(_this2.error)return reject(_this2.error);_this2.plugin=0;_this2.asyncTick(resolve,reject)}).then(function(){_this2.processed=true;return _this2.stringify()});return this.processing};_proto.sync=function sync(){if(this.processed)return this.result;this.processed=true;if(this.processing){throw new Error("Use process(css).then(cb) to work with async plugins")}if(this.error)throw this.error;for(var _iterator=this.result.processor.plugins,_isArray=Array.isArray(_iterator),_i=0,_iterator=_isArray?_iterator:_iterator[Symbol.iterator]();;){var _ref;if(_isArray){if(_i>=_iterator.length)break;_ref=_iterator[_i++]}else{_i=_iterator.next();if(_i.done)break;_ref=_i.value}var plugin=_ref;var promise=this.run(plugin);if(isPromise(promise)){throw new Error("Use process(css).then(cb) to work with async plugins")}}return this.result};_proto.run=function run(plugin){this.result.lastPlugin=plugin;try{return plugin(this.result.root,this.result)}catch(error){this.handleError(error,plugin);throw error}};_proto.stringify=function stringify(){if(this.stringified)return this.result;this.stringified=true;this.sync();var opts=this.result.opts;var str=_stringify2.default;if(opts.syntax)str=opts.syntax.stringify;if(opts.stringifier)str=opts.stringifier;if(str.stringify)str=str.stringify;var map=new _mapGenerator.default(str,this.result.root,this.result.opts);var data=map.generate();this.result.css=data[0];this.result.map=data[1];return this.result};_createClass(LazyResult,[{key:"processor",get:function get(){return this.result.processor}},{key:"opts",get:function get(){return this.result.opts}},{key:"css",get:function get(){return this.stringify().css}},{key:"content",get:function get(){return this.stringify().content}},{key:"map",get:function get(){return this.stringify().map}},{key:"root",get:function get(){return this.sync().root}},{key:"messages",get:function get(){return this.sync().messages}}]);return LazyResult}();var _default=LazyResult;exports.default=_default;module.exports=exports.default}).call(this,require("_process"))},{"./map-generator":52,"./parse":54,"./result":59,"./stringify":63,"./warn-once":66,_process:68}],51:[function(require,module,exports){"use strict";exports.__esModule=true;exports.default=void 0;var list={split:function split(string,separators,last){var array=[];var current="";var split=false;var func=0;var quote=false;var escape=false;for(var i=0;i<string.length;i++){var letter=string[i];if(quote){if(escape){escape=false}else if(letter==="\\"){escape=true}else if(letter===quote){quote=false}}else if(letter==='"'||letter==="'"){quote=letter}else if(letter==="("){func+=1}else if(letter===")"){if(func>0)func-=1}else if(func===0){if(separators.indexOf(letter)!==-1)split=true}if(split){if(current!=="")array.push(current.trim());current="";split=false}else{current+=letter}}if(last||current!=="")array.push(current.trim());return array},space:function space(string){var spaces=[" ","\n","\t"];return list.split(string,spaces)},comma:function comma(string){return list.split(string,[","],true)}};var _default=list;exports.default=_default;module.exports=exports.default},{}],52:[function(require,module,exports){(function(Buffer){"use strict";exports.__esModule=true;exports.default=void 0;var _sourceMap=_interopRequireDefault(require("source-map"));var _path=_interopRequireDefault(require("path"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}var MapGenerator=function(){function MapGenerator(stringify,root,opts){this.stringify=stringify;this.mapOpts=opts.map||{};this.root=root;this.opts=opts}var _proto=MapGenerator.prototype;_proto.isMap=function isMap(){if(typeof this.opts.map!=="undefined"){return!!this.opts.map}return this.previous().length>0};_proto.previous=function previous(){var _this=this;if(!this.previousMaps){this.previousMaps=[];this.root.walk(function(node){if(node.source&&node.source.input.map){var map=node.source.input.map;if(_this.previousMaps.indexOf(map)===-1){_this.previousMaps.push(map)}}})}return this.previousMaps};_proto.isInline=function isInline(){if(typeof this.mapOpts.inline!=="undefined"){return this.mapOpts.inline}var annotation=this.mapOpts.annotation;if(typeof annotation!=="undefined"&&annotation!==true){return false}if(this.previous().length){return this.previous().some(function(i){return i.inline})}return true};_proto.isSourcesContent=function isSourcesContent(){if(typeof this.mapOpts.sourcesContent!=="undefined"){return this.mapOpts.sourcesContent}if(this.previous().length){return this.previous().some(function(i){return i.withContent()})}return true};_proto.clearAnnotation=function clearAnnotation(){if(this.mapOpts.annotation===false)return;var node;for(var i=this.root.nodes.length-1;i>=0;i--){node=this.root.nodes[i];if(node.type!=="comment")continue;if(node.text.indexOf("# sourceMappingURL=")===0){this.root.removeChild(i)}}};_proto.setSourcesContent=function setSourcesContent(){var _this2=this;var already={};this.root.walk(function(node){if(node.source){var from=node.source.input.from;if(from&&!already[from]){already[from]=true;var relative=_this2.relative(from);_this2.map.setSourceContent(relative,node.source.input.css)}}})};_proto.applyPrevMaps=function applyPrevMaps(){for(var _iterator=this.previous(),_isArray=Array.isArray(_iterator),_i=0,_iterator=_isArray?_iterator:_iterator[Symbol.iterator]();;){var _ref;if(_isArray){if(_i>=_iterator.length)break;_ref=_iterator[_i++]}else{_i=_iterator.next();if(_i.done)break;_ref=_i.value}var prev=_ref;var from=this.relative(prev.file);var root=prev.root||_path.default.dirname(prev.file);var map=void 0;if(this.mapOpts.sourcesContent===false){map=new _sourceMap.default.SourceMapConsumer(prev.text);if(map.sourcesContent){map.sourcesContent=map.sourcesContent.map(function(){return null})}}else{map=prev.consumer()}this.map.applySourceMap(map,from,this.relative(root))}};_proto.isAnnotation=function isAnnotation(){if(this.isInline()){return true}if(typeof this.mapOpts.annotation!=="undefined"){return this.mapOpts.annotation}if(this.previous().length){return this.previous().some(function(i){return i.annotation})}return true};_proto.toBase64=function toBase64(str){if(Buffer){return Buffer.from(str).toString("base64")}return window.btoa(unescape(encodeURIComponent(str)))};_proto.addAnnotation=function addAnnotation(){var content;if(this.isInline()){content="data:application/json;base64,"+this.toBase64(this.map.toString())}else if(typeof this.mapOpts.annotation==="string"){content=this.mapOpts.annotation}else{content=this.outputFile()+".map"}var eol="\n";if(this.css.indexOf("\r\n")!==-1)eol="\r\n";this.css+=eol+"/*# sourceMappingURL="+content+" */"};_proto.outputFile=function outputFile(){if(this.opts.to){return this.relative(this.opts.to)}if(this.opts.from){return this.relative(this.opts.from)}return"to.css"};_proto.generateMap=function generateMap(){this.generateString();if(this.isSourcesContent())this.setSourcesContent();if(this.previous().length>0)this.applyPrevMaps();if(this.isAnnotation())this.addAnnotation();if(this.isInline()){return[this.css]}return[this.css,this.map]};_proto.relative=function relative(file){if(file.indexOf("<")===0)return file;if(/^\w+:\/\//.test(file))return file;var from=this.opts.to?_path.default.dirname(this.opts.to):".";if(typeof this.mapOpts.annotation==="string"){from=_path.default.dirname(_path.default.resolve(from,this.mapOpts.annotation))}file=_path.default.relative(from,file);if(_path.default.sep==="\\"){return file.replace(/\\/g,"/")}return file};_proto.sourcePath=function sourcePath(node){if(this.mapOpts.from){return this.mapOpts.from}return this.relative(node.source.input.from)};_proto.generateString=function generateString(){var _this3=this;this.css="";this.map=new _sourceMap.default.SourceMapGenerator({file:this.outputFile()});var line=1;var column=1;var lines,last;this.stringify(this.root,function(str,node,type){_this3.css+=str;if(node&&type!=="end"){if(node.source&&node.source.start){_this3.map.addMapping({source:_this3.sourcePath(node),generated:{line:line,column:column-1},original:{line:node.source.start.line,column:node.source.start.column-1}})}else{_this3.map.addMapping({source:"<no source>",original:{line:1,column:0},generated:{line:line,column:column-1}})}}lines=str.match(/\n/g);if(lines){line+=lines.length;last=str.lastIndexOf("\n");column=str.length-last}else{column+=str.length}if(node&&type!=="start"){var p=node.parent||{raws:{}};if(node.type!=="decl"||node!==p.last||p.raws.semicolon){if(node.source&&node.source.end){_this3.map.addMapping({source:_this3.sourcePath(node),generated:{line:line,column:column-2},original:{line:node.source.end.line,column:node.source.end.column-1}})}else{_this3.map.addMapping({source:"<no source>",original:{line:1,column:0},generated:{line:line,column:column-1}})}}}})};_proto.generate=function generate(){this.clearAnnotation();if(this.isMap()){return this.generateMap()}var result="";this.stringify(this.root,function(i){result+=i});return[result]};return MapGenerator}();var _default=MapGenerator;exports.default=_default;module.exports=exports.default}).call(this,require("buffer").Buffer)},{buffer:5,path:43,"source-map":84}],53:[function(require,module,exports){(function(process){"use strict";exports.__esModule=true;exports.default=void 0;var _cssSyntaxError=_interopRequireDefault(require("./css-syntax-error"));var _stringifier=_interopRequireDefault(require("./stringifier"));var _stringify=_interopRequireDefault(require("./stringify"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}function cloneNode(obj,parent){var cloned=new obj.constructor;for(var i in obj){if(!obj.hasOwnProperty(i))continue;var value=obj[i];var type=typeof value;if(i==="parent"&&type==="object"){if(parent)cloned[i]=parent}else if(i==="source"){cloned[i]=value}else if(value instanceof Array){cloned[i]=value.map(function(j){return cloneNode(j,cloned)})}else{if(type==="object"&&value!==null)value=cloneNode(value);cloned[i]=value}}return cloned}var Node=function(){function Node(defaults){if(defaults===void 0){defaults={}}this.raws={};if(process.env.NODE_ENV!=="production"){if(typeof defaults!=="object"&&typeof defaults!=="undefined"){throw new Error("PostCSS nodes constructor accepts object, not "+JSON.stringify(defaults))}}for(var name in defaults){this[name]=defaults[name]}}var _proto=Node.prototype;_proto.error=function error(message,opts){if(opts===void 0){opts={}}if(this.source){var pos=this.positionBy(opts);return this.source.input.error(message,pos.line,pos.column,opts)}return new _cssSyntaxError.default(message)};_proto.warn=function warn(result,text,opts){var data={node:this};for(var i in opts){data[i]=opts[i]}return result.warn(text,data)};_proto.remove=function remove(){if(this.parent){this.parent.removeChild(this)}this.parent=undefined;return this};_proto.toString=function toString(stringifier){if(stringifier===void 0){stringifier=_stringify.default}if(stringifier.stringify)stringifier=stringifier.stringify;var result="";stringifier(this,function(i){result+=i});return result};_proto.clone=function clone(overrides){if(overrides===void 0){overrides={}}var cloned=cloneNode(this);for(var name in overrides){cloned[name]=overrides[name]}return cloned};_proto.cloneBefore=function cloneBefore(overrides){if(overrides===void 0){overrides={}}var cloned=this.clone(overrides);this.parent.insertBefore(this,cloned);return cloned};_proto.cloneAfter=function cloneAfter(overrides){if(overrides===void 0){overrides={}}var cloned=this.clone(overrides);this.parent.insertAfter(this,cloned);return cloned};_proto.replaceWith=function replaceWith(){if(this.parent){for(var _len=arguments.length,nodes=new Array(_len),_key=0;_key<_len;_key++){nodes[_key]=arguments[_key]}for(var _i=0;_i<nodes.length;_i++){var node=nodes[_i];this.parent.insertBefore(this,node)}this.remove()}return this};_proto.next=function next(){if(!this.parent)return undefined;var index=this.parent.index(this);return this.parent.nodes[index+1]};_proto.prev=function prev(){if(!this.parent)return undefined;var index=this.parent.index(this);return this.parent.nodes[index-1]};_proto.before=function before(add){this.parent.insertBefore(this,add);return this};_proto.after=function after(add){this.parent.insertAfter(this,add);return this};_proto.toJSON=function toJSON(){var fixed={};for(var name in this){if(!this.hasOwnProperty(name))continue;if(name==="parent")continue;var value=this[name];if(value instanceof Array){fixed[name]=value.map(function(i){if(typeof i==="object"&&i.toJSON){return i.toJSON()}else{return i}})}else if(typeof value==="object"&&value.toJSON){fixed[name]=value.toJSON()}else{fixed[name]=value}}return fixed};_proto.raw=function raw(prop,defaultType){var str=new _stringifier.default;return str.raw(this,prop,defaultType)};_proto.root=function root(){var result=this;while(result.parent){result=result.parent}return result};_proto.cleanRaws=function cleanRaws(keepBetween){delete this.raws.before;delete this.raws.after;if(!keepBetween)delete this.raws.between};_proto.positionInside=function positionInside(index){var string=this.toString();var column=this.source.start.column;var line=this.source.start.line;for(var i=0;i<index;i++){if(string[i]==="\n"){column=1;line+=1}else{column+=1}}return{line:line,column:column}};_proto.positionBy=function positionBy(opts){var pos=this.source.start;if(opts.index){pos=this.positionInside(opts.index)}else if(opts.word){var index=this.toString().indexOf(opts.word);if(index!==-1)pos=this.positionInside(index)}return pos};return Node}();var _default=Node;exports.default=_default;module.exports=exports.default}).call(this,require("_process"))},{"./css-syntax-error":47,"./stringifier":62,"./stringify":63,_process:68}],54:[function(require,module,exports){(function(process){"use strict";exports.__esModule=true;exports.default=void 0;var _parser=_interopRequireDefault(require("./parser"));var _input=_interopRequireDefault(require("./input"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}function parse(css,opts){var input=new _input.default(css,opts);var parser=new _parser.default(input);try{parser.parse()}catch(e){if(process.env.NODE_ENV!=="production"){if(e.name==="CssSyntaxError"&&opts&&opts.from){if(/\.scss$/i.test(opts.from)){e.message+="\nYou tried to parse SCSS with "+"the standard CSS parser; "+"try again with the postcss-scss parser"}else if(/\.sass/i.test(opts.from)){e.message+="\nYou tried to parse Sass with "+"the standard CSS parser; "+"try again with the postcss-sass parser"}else if(/\.less$/i.test(opts.from)){e.message+="\nYou tried to parse Less with "+"the standard CSS parser; "+"try again with the postcss-less parser"}}}throw e}return parser.root}var _default=parse;exports.default=_default;module.exports=exports.default}).call(this,require("_process"))},{"./input":49,"./parser":55,_process:68}],55:[function(require,module,exports){"use strict";exports.__esModule=true;exports.default=void 0;var _declaration=_interopRequireDefault(require("./declaration"));var _tokenize=_interopRequireDefault(require("./tokenize"));var _comment=_interopRequireDefault(require("./comment"));var _atRule=_interopRequireDefault(require("./at-rule"));var _root=_interopRequireDefault(require("./root"));var _rule=_interopRequireDefault(require("./rule"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}var Parser=function(){function Parser(input){this.input=input;this.root=new _root.default;this.current=this.root;this.spaces="";this.semicolon=false;this.createTokenizer();this.root.source={input:input,start:{line:1,column:1}}}var _proto=Parser.prototype;_proto.createTokenizer=function createTokenizer(){this.tokenizer=(0,_tokenize.default)(this.input)};_proto.parse=function parse(){var token;while(!this.tokenizer.endOfFile()){token=this.tokenizer.nextToken();switch(token[0]){case"space":this.spaces+=token[1];break;case";":this.freeSemicolon(token);break;case"}":this.end(token);break;case"comment":this.comment(token);break;case"at-word":this.atrule(token);break;case"{":this.emptyRule(token);break;default:this.other(token);break}}this.endFile()};_proto.comment=function comment(token){var node=new _comment.default;this.init(node,token[2],token[3]);node.source.end={line:token[4],column:token[5]};var text=token[1].slice(2,-2);if(/^\s*$/.test(text)){node.text="";node.raws.left=text;node.raws.right=""}else{var match=text.match(/^(\s*)([^]*[^\s])(\s*)$/);node.text=match[2];node.raws.left=match[1];node.raws.right=match[3]}};_proto.emptyRule=function emptyRule(token){var node=new _rule.default;this.init(node,token[2],token[3]);node.selector="";node.raws.between="";this.current=node};_proto.other=function other(start){var end=false;var type=null;var colon=false;var bracket=null;var brackets=[];var tokens=[];var token=start;while(token){type=token[0];tokens.push(token);if(type==="("||type==="["){if(!bracket)bracket=token;brackets.push(type==="("?")":"]")}else if(brackets.length===0){if(type===";"){if(colon){this.decl(tokens);return}else{break}}else if(type==="{"){this.rule(tokens);return}else if(type==="}"){this.tokenizer.back(tokens.pop());end=true;break}else if(type===":"){colon=true}}else if(type===brackets[brackets.length-1]){brackets.pop();if(brackets.length===0)bracket=null}token=this.tokenizer.nextToken()}if(this.tokenizer.endOfFile())end=true;if(brackets.length>0)this.unclosedBracket(bracket);if(end&&colon){while(tokens.length){token=tokens[tokens.length-1][0];if(token!=="space"&&token!=="comment")break;this.tokenizer.back(tokens.pop())}this.decl(tokens)}else{this.unknownWord(tokens)}};_proto.rule=function rule(tokens){tokens.pop();var node=new _rule.default;this.init(node,tokens[0][2],tokens[0][3]);node.raws.between=this.spacesAndCommentsFromEnd(tokens);this.raw(node,"selector",tokens);this.current=node};_proto.decl=function decl(tokens){var node=new _declaration.default;this.init(node);var last=tokens[tokens.length-1];if(last[0]===";"){this.semicolon=true;tokens.pop()}if(last[4]){node.source.end={line:last[4],column:last[5]}}else{node.source.end={line:last[2],column:last[3]}}while(tokens[0][0]!=="word"){if(tokens.length===1)this.unknownWord(tokens);node.raws.before+=tokens.shift()[1]}node.source.start={line:tokens[0][2],column:tokens[0][3]};node.prop="";while(tokens.length){var type=tokens[0][0];if(type===":"||type==="space"||type==="comment"){break}node.prop+=tokens.shift()[1]}node.raws.between="";var token;while(tokens.length){token=tokens.shift();if(token[0]===":"){node.raws.between+=token[1];break}else{if(token[0]==="word"&&/\w/.test(token[1])){this.unknownWord([token])}node.raws.between+=token[1]}}if(node.prop[0]==="_"||node.prop[0]==="*"){node.raws.before+=node.prop[0];node.prop=node.prop.slice(1)}node.raws.between+=this.spacesAndCommentsFromStart(tokens);this.precheckMissedSemicolon(tokens);for(var i=tokens.length-1;i>0;i--){token=tokens[i];if(token[1].toLowerCase()==="!important"){node.important=true;var string=this.stringFrom(tokens,i);string=this.spacesFromEnd(tokens)+string;if(string!==" !important")node.raws.important=string;break}else if(token[1].toLowerCase()==="important"){var cache=tokens.slice(0);var str="";for(var j=i;j>0;j--){var _type=cache[j][0];if(str.trim().indexOf("!")===0&&_type!=="space"){break}str=cache.pop()[1]+str}if(str.trim().indexOf("!")===0){node.important=true;node.raws.important=str;tokens=cache}}if(token[0]!=="space"&&token[0]!=="comment"){break}}this.raw(node,"value",tokens);if(node.value.indexOf(":")!==-1)this.checkMissedSemicolon(tokens)};_proto.atrule=function atrule(token){var node=new _atRule.default;node.name=token[1].slice(1);if(node.name===""){this.unnamedAtrule(node,token)}this.init(node,token[2],token[3]);var prev;var shift;var last=false;var open=false;var params=[];while(!this.tokenizer.endOfFile()){token=this.tokenizer.nextToken();if(token[0]===";"){node.source.end={line:token[2],column:token[3]};this.semicolon=true;break}else if(token[0]==="{"){open=true;break}else if(token[0]==="}"){if(params.length>0){shift=params.length-1;prev=params[shift];while(prev&&prev[0]==="space"){prev=params[--shift]}if(prev){node.source.end={line:prev[4],column:prev[5]}}}this.end(token);break}else{params.push(token)}if(this.tokenizer.endOfFile()){last=true;break}}node.raws.between=this.spacesAndCommentsFromEnd(params);if(params.length){node.raws.afterName=this.spacesAndCommentsFromStart(params);this.raw(node,"params",params);if(last){token=params[params.length-1];node.source.end={line:token[4],column:token[5]};this.spaces=node.raws.between;node.raws.between=""}}else{node.raws.afterName="";node.params=""}if(open){node.nodes=[];this.current=node}};_proto.end=function end(token){if(this.current.nodes&&this.current.nodes.length){this.current.raws.semicolon=this.semicolon}this.semicolon=false;this.current.raws.after=(this.current.raws.after||"")+this.spaces;this.spaces="";if(this.current.parent){this.current.source.end={line:token[2],column:token[3]};this.current=this.current.parent}else{this.unexpectedClose(token)}};_proto.endFile=function endFile(){if(this.current.parent)this.unclosedBlock();if(this.current.nodes&&this.current.nodes.length){this.current.raws.semicolon=this.semicolon}this.current.raws.after=(this.current.raws.after||"")+this.spaces};_proto.freeSemicolon=function freeSemicolon(token){this.spaces+=token[1];if(this.current.nodes){var prev=this.current.nodes[this.current.nodes.length-1];if(prev&&prev.type==="rule"&&!prev.raws.ownSemicolon){prev.raws.ownSemicolon=this.spaces;this.spaces=""}}};_proto.init=function init(node,line,column){this.current.push(node);node.source={start:{line:line,column:column},input:this.input};node.raws.before=this.spaces;this.spaces="";if(node.type!=="comment")this.semicolon=false};_proto.raw=function raw(node,prop,tokens){var token,type;var length=tokens.length;var value="";var clean=true;var next,prev;var pattern=/^([.|#])?([\w])+/i;for(var i=0;i<length;i+=1){token=tokens[i];type=token[0];if(type==="comment"&&node.type==="rule"){prev=tokens[i-1];next=tokens[i+1];if(prev[0]!=="space"&&next[0]!=="space"&&pattern.test(prev[1])&&pattern.test(next[1])){value+=token[1]}else{clean=false}continue}if(type==="comment"||type==="space"&&i===length-1){clean=false}else{value+=token[1]}}if(!clean){var raw=tokens.reduce(function(all,i){return all+i[1]},"");node.raws[prop]={value:value,raw:raw}}node[prop]=value};_proto.spacesAndCommentsFromEnd=function spacesAndCommentsFromEnd(tokens){var lastTokenType;var spaces="";while(tokens.length){lastTokenType=tokens[tokens.length-1][0];if(lastTokenType!=="space"&&lastTokenType!=="comment")break;spaces=tokens.pop()[1]+spaces}return spaces};_proto.spacesAndCommentsFromStart=function spacesAndCommentsFromStart(tokens){var next;var spaces="";while(tokens.length){next=tokens[0][0];if(next!=="space"&&next!=="comment")break;spaces+=tokens.shift()[1]}return spaces};_proto.spacesFromEnd=function spacesFromEnd(tokens){var lastTokenType;var spaces="";while(tokens.length){lastTokenType=tokens[tokens.length-1][0];if(lastTokenType!=="space")break;spaces=tokens.pop()[1]+spaces}return spaces};_proto.stringFrom=function stringFrom(tokens,from){var result="";for(var i=from;i<tokens.length;i++){result+=tokens[i][1]}tokens.splice(from,tokens.length-from);return result};_proto.colon=function colon(tokens){var brackets=0;var token,type,prev;for(var i=0;i<tokens.length;i++){token=tokens[i];type=token[0];if(type==="("){brackets+=1}if(type===")"){brackets-=1}if(brackets===0&&type===":"){if(!prev){this.doubleColon(token)}else if(prev[0]==="word"&&prev[1]==="progid"){continue}else{return i}}prev=token}return false};_proto.unclosedBracket=function unclosedBracket(bracket){throw this.input.error("Unclosed bracket",bracket[2],bracket[3])};_proto.unknownWord=function unknownWord(tokens){throw this.input.error("Unknown word",tokens[0][2],tokens[0][3])};_proto.unexpectedClose=function unexpectedClose(token){throw this.input.error("Unexpected }",token[2],token[3])};_proto.unclosedBlock=function unclosedBlock(){var pos=this.current.source.start;throw this.input.error("Unclosed block",pos.line,pos.column)};_proto.doubleColon=function doubleColon(token){throw this.input.error("Double colon",token[2],token[3])};_proto.unnamedAtrule=function unnamedAtrule(node,token){throw this.input.error("At-rule without name",token[2],token[3])};_proto.precheckMissedSemicolon=function precheckMissedSemicolon(){};_proto.checkMissedSemicolon=function checkMissedSemicolon(tokens){var colon=this.colon(tokens);if(colon===false)return;var founded=0;var token;for(var j=colon-1;j>=0;j--){token=tokens[j];if(token[0]!=="space"){founded+=1;if(founded===2)break}}throw this.input.error("Missed semicolon",token[2],token[3])};return Parser}();exports.default=Parser;module.exports=exports.default},{"./at-rule":44,"./comment":45,"./declaration":48,"./root":60,"./rule":61,"./tokenize":64}],56:[function(require,module,exports){"use strict";exports.__esModule=true;exports.default=void 0;var _declaration=_interopRequireDefault(require("./declaration"));var _processor=_interopRequireDefault(require("./processor"));var _stringify=_interopRequireDefault(require("./stringify"));var _comment=_interopRequireDefault(require("./comment"));var _atRule=_interopRequireDefault(require("./at-rule"));var _vendor=_interopRequireDefault(require("./vendor"));var _parse=_interopRequireDefault(require("./parse"));var _list=_interopRequireDefault(require("./list"));var _rule=_interopRequireDefault(require("./rule"));var _root=_interopRequireDefault(require("./root"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}function postcss(){for(var _len=arguments.length,plugins=new Array(_len),_key=0;_key<_len;_key++){plugins[_key]=arguments[_key]}if(plugins.length===1&&Array.isArray(plugins[0])){plugins=plugins[0]}return new _processor.default(plugins)}postcss.plugin=function plugin(name,initializer){function creator(){var transformer=initializer.apply(void 0,arguments);transformer.postcssPlugin=name;transformer.postcssVersion=(new _processor.default).version;return transformer}var cache;Object.defineProperty(creator,"postcss",{get:function get(){if(!cache)cache=creator();return cache}});creator.process=function(css,processOpts,pluginOpts){return postcss([creator(pluginOpts)]).process(css,processOpts)};return creator};postcss.stringify=_stringify.default;postcss.parse=_parse.default;postcss.vendor=_vendor.default;postcss.list=_list.default;postcss.comment=function(defaults){return new _comment.default(defaults)};postcss.atRule=function(defaults){return new _atRule.default(defaults)};postcss.decl=function(defaults){return new _declaration.default(defaults)};postcss.rule=function(defaults){return new _rule.default(defaults)};postcss.root=function(defaults){return new _root.default(defaults)};var _default=postcss;exports.default=_default;module.exports=exports.default},{"./at-rule":44,"./comment":45,"./declaration":48,"./list":51,"./parse":54,"./processor":58,"./root":60,"./rule":61,"./stringify":63,"./vendor":65}],57:[function(require,module,exports){(function(Buffer){"use strict";exports.__esModule=true;exports.default=void 0;var _sourceMap=_interopRequireDefault(require("source-map"));var _path=_interopRequireDefault(require("path"));var _fs=_interopRequireDefault(require("fs"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}function fromBase64(str){if(Buffer){return Buffer.from(str,"base64").toString()}else{return window.atob(str)}}var PreviousMap=function(){function PreviousMap(css,opts){this.loadAnnotation(css);this.inline=this.startWith(this.annotation,"data:");var prev=opts.map?opts.map.prev:undefined;var text=this.loadMap(opts.from,prev);if(text)this.text=text}var _proto=PreviousMap.prototype;_proto.consumer=function consumer(){if(!this.consumerCache){this.consumerCache=new _sourceMap.default.SourceMapConsumer(this.text)}return this.consumerCache};_proto.withContent=function withContent(){return!!(this.consumer().sourcesContent&&this.consumer().sourcesContent.length>0)};_proto.startWith=function startWith(string,start){if(!string)return false;return string.substr(0,start.length)===start};_proto.loadAnnotation=function loadAnnotation(css){var match=css.match(/\/\*\s*# sourceMappingURL=(.*)\s*\*\//);if(match)this.annotation=match[1].trim()};_proto.decodeInline=function decodeInline(text){var baseCharsetUri=/^data:application\/json;charset=utf-?8;base64,/;var baseUri=/^data:application\/json;base64,/;var uri="data:application/json,";if(this.startWith(text,uri)){return decodeURIComponent(text.substr(uri.length))}if(baseCharsetUri.test(text)||baseUri.test(text)){return fromBase64(text.substr(RegExp.lastMatch.length))}var encoding=text.match(/data:application\/json;([^,]+),/)[1];throw new Error("Unsupported source map encoding "+encoding)};_proto.loadMap=function loadMap(file,prev){if(prev===false)return false;if(prev){if(typeof prev==="string"){return prev}else if(typeof prev==="function"){var prevPath=prev(file);if(prevPath&&_fs.default.existsSync&&_fs.default.existsSync(prevPath)){return _fs.default.readFileSync(prevPath,"utf-8").toString().trim()}else{throw new Error("Unable to load previous source map: "+prevPath.toString())}}else if(prev instanceof _sourceMap.default.SourceMapConsumer){return _sourceMap.default.SourceMapGenerator.fromSourceMap(prev).toString()}else if(prev instanceof _sourceMap.default.SourceMapGenerator){return prev.toString()}else if(this.isMap(prev)){return JSON.stringify(prev)}else{throw new Error("Unsupported previous source map format: "+prev.toString())}}else if(this.inline){return this.decodeInline(this.annotation)}else if(this.annotation){var map=this.annotation;if(file)map=_path.default.join(_path.default.dirname(file),map);this.root=_path.default.dirname(map);if(_fs.default.existsSync&&_fs.default.existsSync(map)){return _fs.default.readFileSync(map,"utf-8").toString().trim()}else{return false}}};_proto.isMap=function isMap(map){if(typeof map!=="object")return false;return typeof map.mappings==="string"||typeof map._mappings==="string"};return PreviousMap}();var _default=PreviousMap;exports.default=_default;module.exports=exports.default}).call(this,require("buffer").Buffer)},{buffer:5,fs:4,path:43,"source-map":84}],58:[function(require,module,exports){(function(process){"use strict";exports.__esModule=true;exports.default=void 0;var _lazyResult=_interopRequireDefault(require("./lazy-result"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}var Processor=function(){function Processor(plugins){if(plugins===void 0){plugins=[]}this.version="7.0.14";this.plugins=this.normalize(plugins)}var _proto=Processor.prototype;_proto.use=function use(plugin){this.plugins=this.plugins.concat(this.normalize([plugin]));return this};_proto.process=function(_process){function process(_x){return _process.apply(this,arguments)}process.toString=function(){return _process.toString()};return process}(function(css,opts){if(opts===void 0){opts={}}if(this.plugins.length===0&&opts.parser===opts.stringifier){if(process.env.NODE_ENV!=="production"){if(typeof console!=="undefined"&&console.warn){console.warn("You did not set any plugins, parser, or stringifier. "+"Right now, PostCSS does nothing. Pick plugins for your case "+"on https://www.postcss.parts/ and use them in postcss.config.js.")}}}return new _lazyResult.default(this,css,opts)});_proto.normalize=function normalize(plugins){var normalized=[];for(var _iterator=plugins,_isArray=Array.isArray(_iterator),_i=0,_iterator=_isArray?_iterator:_iterator[Symbol.iterator]();;){var _ref;if(_isArray){if(_i>=_iterator.length)break;_ref=_iterator[_i++]}else{_i=_iterator.next();if(_i.done)break;_ref=_i.value}var i=_ref;if(i.postcss)i=i.postcss;if(typeof i==="object"&&Array.isArray(i.plugins)){normalized=normalized.concat(i.plugins)}else if(typeof i==="function"){normalized.push(i)}else if(typeof i==="object"&&(i.parse||i.stringify)){if(process.env.NODE_ENV!=="production"){throw new Error("PostCSS syntaxes cannot be used as plugins. Instead, please use "+"one of the syntax/parser/stringifier options as outlined "+"in your PostCSS runner documentation.")}}else{throw new Error(i+" is not a PostCSS plugin")}}return normalized};return Processor}();var _default=Processor;exports.default=_default;module.exports=exports.default}).call(this,require("_process"))},{"./lazy-result":50,_process:68}],59:[function(require,module,exports){"use strict";exports.__esModule=true;exports.default=void 0;var _warning=_interopRequireDefault(require("./warning"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}function _defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor)}}function _createClass(Constructor,protoProps,staticProps){if(protoProps)_defineProperties(Constructor.prototype,protoProps);if(staticProps)_defineProperties(Constructor,staticProps);return Constructor}var Result=function(){function Result(processor,root,opts){this.processor=processor;this.messages=[];this.root=root;this.opts=opts;this.css=undefined;this.map=undefined}var _proto=Result.prototype;_proto.toString=function toString(){return this.css};_proto.warn=function warn(text,opts){if(opts===void 0){opts={}}if(!opts.plugin){if(this.lastPlugin&&this.lastPlugin.postcssPlugin){opts.plugin=this.lastPlugin.postcssPlugin}}var warning=new _warning.default(text,opts);this.messages.push(warning);return warning};_proto.warnings=function warnings(){return this.messages.filter(function(i){return i.type==="warning"})};_createClass(Result,[{key:"content",get:function get(){return this.css}}]);return Result}();var _default=Result;exports.default=_default;module.exports=exports.default},{"./warning":67}],60:[function(require,module,exports){"use strict";exports.__esModule=true;exports.default=void 0;var _container=_interopRequireDefault(require("./container"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}function _inheritsLoose(subClass,superClass){subClass.prototype=Object.create(superClass.prototype);subClass.prototype.constructor=subClass;subClass.__proto__=superClass}var Root=function(_Container){_inheritsLoose(Root,_Container);function Root(defaults){var _this;_this=_Container.call(this,defaults)||this;_this.type="root";if(!_this.nodes)_this.nodes=[];return _this}var _proto=Root.prototype;_proto.removeChild=function removeChild(child,ignore){var index=this.index(child);if(!ignore&&index===0&&this.nodes.length>1){this.nodes[1].raws.before=this.nodes[index].raws.before}return _Container.prototype.removeChild.call(this,child)};_proto.normalize=function normalize(child,sample,type){var nodes=_Container.prototype.normalize.call(this,child);if(sample){if(type==="prepend"){if(this.nodes.length>1){sample.raws.before=this.nodes[1].raws.before}else{delete sample.raws.before}}else if(this.first!==sample){for(var _iterator=nodes,_isArray=Array.isArray(_iterator),_i=0,_iterator=_isArray?_iterator:_iterator[Symbol.iterator]();;){var _ref;if(_isArray){if(_i>=_iterator.length)break;_ref=_iterator[_i++]}else{_i=_iterator.next();if(_i.done)break;_ref=_i.value}var node=_ref;node.raws.before=sample.raws.before}}}return nodes};_proto.toResult=function toResult(opts){if(opts===void 0){opts={}}var LazyResult=require("./lazy-result");var Processor=require("./processor");var lazy=new LazyResult(new Processor,this,opts);return lazy.stringify()};return Root}(_container.default);var _default=Root;exports.default=_default;module.exports=exports.default},{"./container":46,"./lazy-result":50,"./processor":58}],61:[function(require,module,exports){"use strict";exports.__esModule=true;exports.default=void 0;var _container=_interopRequireDefault(require("./container"));var _list=_interopRequireDefault(require("./list"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}function _defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor)}}function _createClass(Constructor,protoProps,staticProps){if(protoProps)_defineProperties(Constructor.prototype,protoProps);if(staticProps)_defineProperties(Constructor,staticProps);return Constructor}function _inheritsLoose(subClass,superClass){subClass.prototype=Object.create(superClass.prototype);subClass.prototype.constructor=subClass;subClass.__proto__=superClass}var Rule=function(_Container){_inheritsLoose(Rule,_Container);function Rule(defaults){var _this;_this=_Container.call(this,defaults)||this;_this.type="rule";if(!_this.nodes)_this.nodes=[];return _this}_createClass(Rule,[{key:"selectors",get:function get(){return _list.default.comma(this.selector)},set:function set(values){var match=this.selector?this.selector.match(/,\s*/):null;var sep=match?match[0]:","+this.raw("between","beforeOpen");this.selector=values.join(sep)}}]);return Rule}(_container.default);var _default=Rule;exports.default=_default;module.exports=exports.default},{"./container":46,"./list":51}],62:[function(require,module,exports){"use strict";exports.__esModule=true;exports.default=void 0;var DEFAULT_RAW={colon:": ",indent:"    ",beforeDecl:"\n",beforeRule:"\n",beforeOpen:" ",beforeClose:"\n",beforeComment:"\n",after:"\n",emptyBody:"",commentLeft:" ",commentRight:" ",semicolon:false};function capitalize(str){return str[0].toUpperCase()+str.slice(1)}var Stringifier=function(){function Stringifier(builder){this.builder=builder}var _proto=Stringifier.prototype;_proto.stringify=function stringify(node,semicolon){this[node.type](node,semicolon)};_proto.root=function root(node){this.body(node);if(node.raws.after)this.builder(node.raws.after)};_proto.comment=function comment(node){var left=this.raw(node,"left","commentLeft");var right=this.raw(node,"right","commentRight");this.builder("/*"+left+node.text+right+"*/",node)};_proto.decl=function decl(node,semicolon){var between=this.raw(node,"between","colon");var string=node.prop+between+this.rawValue(node,"value");if(node.important){string+=node.raws.important||" !important"}if(semicolon)string+=";";this.builder(string,node)};_proto.rule=function rule(node){this.block(node,this.rawValue(node,"selector"));if(node.raws.ownSemicolon){this.builder(node.raws.ownSemicolon,node,"end")}};_proto.atrule=function atrule(node,semicolon){var name="@"+node.name;var params=node.params?this.rawValue(node,"params"):"";if(typeof node.raws.afterName!=="undefined"){name+=node.raws.afterName}else if(params){name+=" "}if(node.nodes){this.block(node,name+params)}else{var end=(node.raws.between||"")+(semicolon?";":"");this.builder(name+params+end,node)}};_proto.body=function body(node){var last=node.nodes.length-1;while(last>0){if(node.nodes[last].type!=="comment")break;last-=1}var semicolon=this.raw(node,"semicolon");for(var i=0;i<node.nodes.length;i++){var child=node.nodes[i];var before=this.raw(child,"before");if(before)this.builder(before);this.stringify(child,last!==i||semicolon)}};_proto.block=function block(node,start){var between=this.raw(node,"between","beforeOpen");this.builder(start+between+"{",node,"start");var after;if(node.nodes&&node.nodes.length){this.body(node);after=this.raw(node,"after")}else{after=this.raw(node,"after","emptyBody")}if(after)this.builder(after);this.builder("}",node,"end")};_proto.raw=function raw(node,own,detect){var value;if(!detect)detect=own;if(own){value=node.raws[own];if(typeof value!=="undefined")return value}var parent=node.parent;if(detect==="before"){if(!parent||parent.type==="root"&&parent.first===node){return""}}if(!parent)return DEFAULT_RAW[detect];var root=node.root();if(!root.rawCache)root.rawCache={};if(typeof root.rawCache[detect]!=="undefined"){return root.rawCache[detect]}if(detect==="before"||detect==="after"){return this.beforeAfter(node,detect)}else{var method="raw"+capitalize(detect);if(this[method]){value=this[method](root,node)}else{root.walk(function(i){value=i.raws[own];if(typeof value!=="undefined")return false})}}if(typeof value==="undefined")value=DEFAULT_RAW[detect];root.rawCache[detect]=value;return value};_proto.rawSemicolon=function rawSemicolon(root){var value;root.walk(function(i){if(i.nodes&&i.nodes.length&&i.last.type==="decl"){value=i.raws.semicolon;if(typeof value!=="undefined")return false}});return value};_proto.rawEmptyBody=function rawEmptyBody(root){var value;root.walk(function(i){if(i.nodes&&i.nodes.length===0){value=i.raws.after;if(typeof value!=="undefined")return false}});return value};_proto.rawIndent=function rawIndent(root){if(root.raws.indent)return root.raws.indent;var value;root.walk(function(i){var p=i.parent;if(p&&p!==root&&p.parent&&p.parent===root){if(typeof i.raws.before!=="undefined"){var parts=i.raws.before.split("\n");value=parts[parts.length-1];value=value.replace(/[^\s]/g,"");return false}}});return value};_proto.rawBeforeComment=function rawBeforeComment(root,node){var value;root.walkComments(function(i){if(typeof i.raws.before!=="undefined"){value=i.raws.before;if(value.indexOf("\n")!==-1){value=value.replace(/[^\n]+$/,"")}return false}});if(typeof value==="undefined"){value=this.raw(node,null,"beforeDecl")}else if(value){value=value.replace(/[^\s]/g,"")}return value};_proto.rawBeforeDecl=function rawBeforeDecl(root,node){var value;root.walkDecls(function(i){if(typeof i.raws.before!=="undefined"){value=i.raws.before;if(value.indexOf("\n")!==-1){value=value.replace(/[^\n]+$/,"")}return false}});if(typeof value==="undefined"){value=this.raw(node,null,"beforeRule")}else if(value){value=value.replace(/[^\s]/g,"")}return value};_proto.rawBeforeRule=function rawBeforeRule(root){var value;root.walk(function(i){if(i.nodes&&(i.parent!==root||root.first!==i)){if(typeof i.raws.before!=="undefined"){value=i.raws.before;if(value.indexOf("\n")!==-1){value=value.replace(/[^\n]+$/,"")}return false}}});if(value)value=value.replace(/[^\s]/g,"");return value};_proto.rawBeforeClose=function rawBeforeClose(root){var value;root.walk(function(i){if(i.nodes&&i.nodes.length>0){if(typeof i.raws.after!=="undefined"){value=i.raws.after;if(value.indexOf("\n")!==-1){value=value.replace(/[^\n]+$/,"")}return false}}});if(value)value=value.replace(/[^\s]/g,"");return value};_proto.rawBeforeOpen=function rawBeforeOpen(root){var value;root.walk(function(i){if(i.type!=="decl"){value=i.raws.between;if(typeof value!=="undefined")return false}});return value};_proto.rawColon=function rawColon(root){var value;root.walkDecls(function(i){if(typeof i.raws.between!=="undefined"){value=i.raws.between.replace(/[^\s:]/g,"");return false}});return value};_proto.beforeAfter=function beforeAfter(node,detect){var value;if(node.type==="decl"){value=this.raw(node,null,"beforeDecl")}else if(node.type==="comment"){value=this.raw(node,null,"beforeComment")}else if(detect==="before"){value=this.raw(node,null,"beforeRule")}else{value=this.raw(node,null,"beforeClose")}var buf=node.parent;var depth=0;while(buf&&buf.type!=="root"){depth+=1;buf=buf.parent}if(value.indexOf("\n")!==-1){var indent=this.raw(node,null,"indent");if(indent.length){for(var step=0;step<depth;step++){value+=indent}}}return value};_proto.rawValue=function rawValue(node,prop){var value=node[prop];var raw=node.raws[prop];if(raw&&raw.value===value){return raw.raw}return value};return Stringifier}();var _default=Stringifier;exports.default=_default;module.exports=exports.default},{}],63:[function(require,module,exports){"use strict";exports.__esModule=true;exports.default=void 0;var _stringifier=_interopRequireDefault(require("./stringifier"));function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}function stringify(node,builder){var str=new _stringifier.default(builder);str.stringify(node)}var _default=stringify;exports.default=_default;module.exports=exports.default},{"./stringifier":62}],64:[function(require,module,exports){"use strict";exports.__esModule=true;exports.default=tokenizer;var SINGLE_QUOTE="'".charCodeAt(0);var DOUBLE_QUOTE='"'.charCodeAt(0);var BACKSLASH="\\".charCodeAt(0);var SLASH="/".charCodeAt(0);var NEWLINE="\n".charCodeAt(0);var SPACE=" ".charCodeAt(0);var FEED="\f".charCodeAt(0);var TAB="\t".charCodeAt(0);var CR="\r".charCodeAt(0);var OPEN_SQUARE="[".charCodeAt(0);var CLOSE_SQUARE="]".charCodeAt(0);var OPEN_PARENTHESES="(".charCodeAt(0);var CLOSE_PARENTHESES=")".charCodeAt(0);var OPEN_CURLY="{".charCodeAt(0);var CLOSE_CURLY="}".charCodeAt(0);var SEMICOLON=";".charCodeAt(0);var ASTERISK="*".charCodeAt(0);var COLON=":".charCodeAt(0);var AT="@".charCodeAt(0);var RE_AT_END=/[ \n\t\r\f{}()'"\\;/[\]#]/g;var RE_WORD_END=/[ \n\t\r\f(){}:;@!'"\\\][#]|\/(?=\*)/g;var RE_BAD_BRACKET=/.[\\/("'\n]/;var RE_HEX_ESCAPE=/[a-f0-9]/i;function tokenizer(input,options){if(options===void 0){options={}}var css=input.css.valueOf();var ignore=options.ignoreErrors;var code,next,quote,lines,last,content,escape;var nextLine,nextOffset,escaped,escapePos,prev,n,currentToken;var length=css.length;var offset=-1;var line=1;var pos=0;var buffer=[];var returned=[];function position(){return pos}function unclosed(what){throw input.error("Unclosed "+what,line,pos-offset)}function endOfFile(){return returned.length===0&&pos>=length}function nextToken(opts){if(returned.length)return returned.pop();if(pos>=length)return;var ignoreUnclosed=opts?opts.ignoreUnclosed:false;code=css.charCodeAt(pos);if(code===NEWLINE||code===FEED||code===CR&&css.charCodeAt(pos+1)!==NEWLINE){offset=pos;line+=1}switch(code){case NEWLINE:case SPACE:case TAB:case CR:case FEED:next=pos;do{next+=1;code=css.charCodeAt(next);if(code===NEWLINE){offset=next;line+=1}}while(code===SPACE||code===NEWLINE||code===TAB||code===CR||code===FEED);currentToken=["space",css.slice(pos,next)];pos=next-1;break;case OPEN_SQUARE:case CLOSE_SQUARE:case OPEN_CURLY:case CLOSE_CURLY:case COLON:case SEMICOLON:case CLOSE_PARENTHESES:var controlChar=String.fromCharCode(code);currentToken=[controlChar,controlChar,line,pos-offset];break;case OPEN_PARENTHESES:prev=buffer.length?buffer.pop()[1]:"";n=css.charCodeAt(pos+1);if(prev==="url"&&n!==SINGLE_QUOTE&&n!==DOUBLE_QUOTE&&n!==SPACE&&n!==NEWLINE&&n!==TAB&&n!==FEED&&n!==CR){next=pos;do{escaped=false;next=css.indexOf(")",next+1);if(next===-1){if(ignore||ignoreUnclosed){next=pos;break}else{unclosed("bracket")}}escapePos=next;while(css.charCodeAt(escapePos-1)===BACKSLASH){escapePos-=1;escaped=!escaped}}while(escaped);currentToken=["brackets",css.slice(pos,next+1),line,pos-offset,line,next-offset];pos=next}else{next=css.indexOf(")",pos+1);content=css.slice(pos,next+1);if(next===-1||RE_BAD_BRACKET.test(content)){currentToken=["(","(",line,pos-offset]}else{currentToken=["brackets",content,line,pos-offset,line,next-offset];pos=next}}break;case SINGLE_QUOTE:case DOUBLE_QUOTE:quote=code===SINGLE_QUOTE?"'":'"';next=pos;do{escaped=false;next=css.indexOf(quote,next+1);if(next===-1){if(ignore||ignoreUnclosed){next=pos+1;break}else{unclosed("string")}}escapePos=next;while(css.charCodeAt(escapePos-1)===BACKSLASH){escapePos-=1;escaped=!escaped}}while(escaped);content=css.slice(pos,next+1);lines=content.split("\n");last=lines.length-1;if(last>0){nextLine=line+last;nextOffset=next-lines[last].length}else{nextLine=line;nextOffset=offset}currentToken=["string",css.slice(pos,next+1),line,pos-offset,nextLine,next-nextOffset];offset=nextOffset;line=nextLine;pos=next;break;case AT:RE_AT_END.lastIndex=pos+1;RE_AT_END.test(css);if(RE_AT_END.lastIndex===0){next=css.length-1}else{next=RE_AT_END.lastIndex-2}currentToken=["at-word",css.slice(pos,next+1),line,pos-offset,line,next-offset];pos=next;break;case BACKSLASH:next=pos;escape=true;while(css.charCodeAt(next+1)===BACKSLASH){next+=1;escape=!escape}code=css.charCodeAt(next+1);if(escape&&code!==SLASH&&code!==SPACE&&code!==NEWLINE&&code!==TAB&&code!==CR&&code!==FEED){next+=1;if(RE_HEX_ESCAPE.test(css.charAt(next))){while(RE_HEX_ESCAPE.test(css.charAt(next+1))){next+=1}if(css.charCodeAt(next+1)===SPACE){next+=1}}}currentToken=["word",css.slice(pos,next+1),line,pos-offset,line,next-offset];pos=next;break;default:if(code===SLASH&&css.charCodeAt(pos+1)===ASTERISK){next=css.indexOf("*/",pos+2)+1;if(next===0){if(ignore||ignoreUnclosed){next=css.length}else{unclosed("comment")}}content=css.slice(pos,next+1);lines=content.split("\n");last=lines.length-1;if(last>0){nextLine=line+last;nextOffset=next-lines[last].length}else{nextLine=line;nextOffset=offset}currentToken=["comment",content,line,pos-offset,nextLine,next-nextOffset];offset=nextOffset;line=nextLine;pos=next}else{RE_WORD_END.lastIndex=pos+1;RE_WORD_END.test(css);if(RE_WORD_END.lastIndex===0){next=css.length-1}else{next=RE_WORD_END.lastIndex-2}currentToken=["word",css.slice(pos,next+1),line,pos-offset,line,next-offset];buffer.push(currentToken);pos=next}break}pos++;return currentToken}function back(token){returned.push(token)}return{back:back,nextToken:nextToken,endOfFile:endOfFile,position:position}}module.exports=exports.default},{}],65:[function(require,module,exports){"use strict";exports.__esModule=true;exports.default=void 0;var vendor={prefix:function prefix(prop){var match=prop.match(/^(-\w+-)/);if(match){return match[0]}return""},unprefixed:function unprefixed(prop){return prop.replace(/^-\w+-/,"")}};var _default=vendor;exports.default=_default;module.exports=exports.default},{}],66:[function(require,module,exports){"use strict";exports.__esModule=true;exports.default=warnOnce;var printed={};function warnOnce(message){if(printed[message])return;printed[message]=true;if(typeof console!=="undefined"&&console.warn){console.warn(message)}}module.exports=exports.default},{}],67:[function(require,module,exports){"use strict";exports.__esModule=true;exports.default=void 0;var Warning=function(){function Warning(text,opts){if(opts===void 0){opts={}}this.type="warning";this.text=text;if(opts.node&&opts.node.source){var pos=opts.node.positionBy(opts);this.line=pos.line;this.column=pos.column}for(var opt in opts){this[opt]=opts[opt]}}var _proto=Warning.prototype;_proto.toString=function toString(){if(this.node){return this.node.error(this.text,{plugin:this.plugin,index:this.index,word:this.word}).message}if(this.plugin){return this.plugin+": "+this.text}return this.text};return Warning}();var _default=Warning;exports.default=_default;module.exports=exports.default},{}],68:[function(require,module,exports){var process=module.exports={};var cachedSetTimeout;var cachedClearTimeout;function defaultSetTimout(){throw new Error("setTimeout has not been defined")}function defaultClearTimeout(){throw new Error("clearTimeout has not been defined")}(function(){try{if(typeof setTimeout==="function"){cachedSetTimeout=setTimeout}else{cachedSetTimeout=defaultSetTimout}}catch(e){cachedSetTimeout=defaultSetTimout}try{if(typeof clearTimeout==="function"){cachedClearTimeout=clearTimeout}else{cachedClearTimeout=defaultClearTimeout}}catch(e){cachedClearTimeout=defaultClearTimeout}})();function runTimeout(fun){if(cachedSetTimeout===setTimeout){return setTimeout(fun,0)}if((cachedSetTimeout===defaultSetTimout||!cachedSetTimeout)&&setTimeout){cachedSetTimeout=setTimeout;return setTimeout(fun,0)}try{return cachedSetTimeout(fun,0)}catch(e){try{return cachedSetTimeout.call(null,fun,0)}catch(e){return cachedSetTimeout.call(this,fun,0)}}}function runClearTimeout(marker){if(cachedClearTimeout===clearTimeout){return clearTimeout(marker)}if((cachedClearTimeout===defaultClearTimeout||!cachedClearTimeout)&&clearTimeout){cachedClearTimeout=clearTimeout;return clearTimeout(marker)}try{return cachedClearTimeout(marker)}catch(e){try{return cachedClearTimeout.call(null,marker)}catch(e){return cachedClearTimeout.call(this,marker)}}}var queue=[];var draining=false;var currentQueue;var queueIndex=-1;function cleanUpNextTick(){if(!draining||!currentQueue){return}draining=false;if(currentQueue.length){queue=currentQueue.concat(queue)}else{queueIndex=-1}if(queue.length){drainQueue()}}function drainQueue(){if(draining){return}var timeout=runTimeout(cleanUpNextTick);draining=true;var len=queue.length;while(len){currentQueue=queue;queue=[];while(++queueIndex<len){if(currentQueue){currentQueue[queueIndex].run()}}queueIndex=-1;len=queue.length}currentQueue=null;draining=false;runClearTimeout(timeout)}process.nextTick=function(fun){var args=new Array(arguments.length-1);if(arguments.length>1){for(var i=1;i<arguments.length;i++){args[i-1]=arguments[i]}}queue.push(new Item(fun,args));if(queue.length===1&&!draining){runTimeout(drainQueue)}};function Item(fun,array){this.fun=fun;this.array=array}Item.prototype.run=function(){this.fun.apply(null,this.array)};process.title="browser";process.browser=true;process.env={};process.argv=[];process.version="";process.versions={};function noop(){}process.on=noop;process.addListener=noop;process.once=noop;process.off=noop;process.removeListener=noop;process.removeAllListeners=noop;process.emit=noop;process.prependListener=noop;process.prependOnceListener=noop;process.listeners=function(name){return[]};process.binding=function(name){throw new Error("process.binding is not supported")};process.cwd=function(){return"/"};process.chdir=function(dir){throw new Error("process.chdir is not supported")};process.umask=function(){return 0}},{}],69:[function(require,module,exports){(function(global){(function(root){var freeExports=typeof exports=="object"&&exports&&!exports.nodeType&&exports;var freeModule=typeof module=="object"&&module&&!module.nodeType&&module;var freeGlobal=typeof global=="object"&&global;if(freeGlobal.global===freeGlobal||freeGlobal.window===freeGlobal||freeGlobal.self===freeGlobal){root=freeGlobal}var punycode,maxInt=2147483647,base=36,tMin=1,tMax=26,skew=38,damp=700,initialBias=72,initialN=128,delimiter="-",regexPunycode=/^xn--/,regexNonASCII=/[^\x20-\x7E]/,regexSeparators=/[\x2E\u3002\uFF0E\uFF61]/g,errors={overflow:"Overflow: input needs wider integers to process","not-basic":"Illegal input >= 0x80 (not a basic code point)","invalid-input":"Invalid input"},baseMinusTMin=base-tMin,floor=Math.floor,stringFromCharCode=String.fromCharCode,key;function error(type){throw new RangeError(errors[type])}function map(array,fn){var length=array.length;var result=[];while(length--){result[length]=fn(array[length])}return result}function mapDomain(string,fn){var parts=string.split("@");var result="";if(parts.length>1){result=parts[0]+"@";string=parts[1]}string=string.replace(regexSeparators,".");var labels=string.split(".");var encoded=map(labels,fn).join(".");return result+encoded}function ucs2decode(string){var output=[],counter=0,length=string.length,value,extra;while(counter<length){value=string.charCodeAt(counter++);if(value>=55296&&value<=56319&&counter<length){extra=string.charCodeAt(counter++);if((extra&64512)==56320){output.push(((value&1023)<<10)+(extra&1023)+65536)}else{output.push(value);counter--}}else{output.push(value)}}return output}function ucs2encode(array){return map(array,function(value){var output="";if(value>65535){value-=65536;output+=stringFromCharCode(value>>>10&1023|55296);value=56320|value&1023}output+=stringFromCharCode(value);return output}).join("")}function basicToDigit(codePoint){if(codePoint-48<10){return codePoint-22}if(codePoint-65<26){return codePoint-65}if(codePoint-97<26){return codePoint-97}return base}function digitToBasic(digit,flag){return digit+22+75*(digit<26)-((flag!=0)<<5)}function adapt(delta,numPoints,firstTime){var k=0;delta=firstTime?floor(delta/damp):delta>>1;delta+=floor(delta/numPoints);for(;delta>baseMinusTMin*tMax>>1;k+=base){delta=floor(delta/baseMinusTMin)}return floor(k+(baseMinusTMin+1)*delta/(delta+skew))}function decode(input){var output=[],inputLength=input.length,out,i=0,n=initialN,bias=initialBias,basic,j,index,oldi,w,k,digit,t,baseMinusT;basic=input.lastIndexOf(delimiter);if(basic<0){basic=0}for(j=0;j<basic;++j){if(input.charCodeAt(j)>=128){error("not-basic")}output.push(input.charCodeAt(j))}for(index=basic>0?basic+1:0;index<inputLength;){for(oldi=i,w=1,k=base;;k+=base){if(index>=inputLength){error("invalid-input")}digit=basicToDigit(input.charCodeAt(index++));if(digit>=base||digit>floor((maxInt-i)/w)){error("overflow")}i+=digit*w;t=k<=bias?tMin:k>=bias+tMax?tMax:k-bias;if(digit<t){break}baseMinusT=base-t;if(w>floor(maxInt/baseMinusT)){error("overflow")}w*=baseMinusT}out=output.length+1;bias=adapt(i-oldi,out,oldi==0);if(floor(i/out)>maxInt-n){error("overflow")}n+=floor(i/out);i%=out;output.splice(i++,0,n)}return ucs2encode(output)}function encode(input){var n,delta,handledCPCount,basicLength,bias,j,m,q,k,t,currentValue,output=[],inputLength,handledCPCountPlusOne,baseMinusT,qMinusT;input=ucs2decode(input);inputLength=input.length;n=initialN;delta=0;bias=initialBias;for(j=0;j<inputLength;++j){currentValue=input[j];if(currentValue<128){output.push(stringFromCharCode(currentValue))}}handledCPCount=basicLength=output.length;if(basicLength){output.push(delimiter)}while(handledCPCount<inputLength){for(m=maxInt,j=0;j<inputLength;++j){currentValue=input[j];if(currentValue>=n&&currentValue<m){m=currentValue}}handledCPCountPlusOne=handledCPCount+1;if(m-n>floor((maxInt-delta)/handledCPCountPlusOne)){error("overflow")}delta+=(m-n)*handledCPCountPlusOne;n=m;for(j=0;j<inputLength;++j){currentValue=input[j];if(currentValue<n&&++delta>maxInt){error("overflow")}if(currentValue==n){for(q=delta,k=base;;k+=base){t=k<=bias?tMin:k>=bias+tMax?tMax:k-bias;if(q<t){break}qMinusT=q-t;baseMinusT=base-t;output.push(stringFromCharCode(digitToBasic(t+qMinusT%baseMinusT,0)));q=floor(qMinusT/baseMinusT)}output.push(stringFromCharCode(digitToBasic(q,0)));bias=adapt(delta,handledCPCountPlusOne,handledCPCount==basicLength);delta=0;++handledCPCount}}++delta;++n}return output.join("")}function toUnicode(input){return mapDomain(input,function(string){return regexPunycode.test(string)?decode(string.slice(4).toLowerCase()):string})}function toASCII(input){return mapDomain(input,function(string){return regexNonASCII.test(string)?"xn--"+encode(string):string})}punycode={version:"1.4.1",ucs2:{decode:ucs2decode,encode:ucs2encode},decode:decode,encode:encode,toASCII:toASCII,toUnicode:toUnicode};if(typeof define=="function"&&typeof define.amd=="object"&&define.amd){define("punycode",function(){return punycode})}else if(freeExports&&freeModule){if(module.exports==freeExports){freeModule.exports=punycode}else{for(key in punycode){punycode.hasOwnProperty(key)&&(freeExports[key]=punycode[key])}}}else{root.punycode=punycode}})(this)}).call(this,typeof global!=="undefined"?global:typeof self!=="undefined"?self:typeof window!=="undefined"?window:{})},{}],70:[function(require,module,exports){"use strict";function hasOwnProperty(obj,prop){return Object.prototype.hasOwnProperty.call(obj,prop)}module.exports=function(qs,sep,eq,options){sep=sep||"&";eq=eq||"=";var obj={};if(typeof qs!=="string"||qs.length===0){return obj}var regexp=/\+/g;qs=qs.split(sep);var maxKeys=1e3;if(options&&typeof options.maxKeys==="number"){maxKeys=options.maxKeys}var len=qs.length;if(maxKeys>0&&len>maxKeys){len=maxKeys}for(var i=0;i<len;++i){var x=qs[i].replace(regexp,"%20"),idx=x.indexOf(eq),kstr,vstr,k,v;if(idx>=0){kstr=x.substr(0,idx);vstr=x.substr(idx+1)}else{kstr=x;vstr=""}k=decodeURIComponent(kstr);v=decodeURIComponent(vstr);if(!hasOwnProperty(obj,k)){obj[k]=v}else if(isArray(obj[k])){obj[k].push(v)}else{obj[k]=[obj[k],v]}}return obj};var isArray=Array.isArray||function(xs){return Object.prototype.toString.call(xs)==="[object Array]"}},{}],71:[function(require,module,exports){"use strict";var stringifyPrimitive=function(v){switch(typeof v){case"string":return v;case"boolean":return v?"true":"false";case"number":return isFinite(v)?v:"";default:return""}};module.exports=function(obj,sep,eq,name){sep=sep||"&";eq=eq||"=";if(obj===null){obj=undefined}if(typeof obj==="object"){return map(objectKeys(obj),function(k){var ks=encodeURIComponent(stringifyPrimitive(k))+eq;if(isArray(obj[k])){return map(obj[k],function(v){return ks+encodeURIComponent(stringifyPrimitive(v))}).join(sep)}else{return ks+encodeURIComponent(stringifyPrimitive(obj[k]))}}).join(sep)}if(!name)return"";return encodeURIComponent(stringifyPrimitive(name))+eq+encodeURIComponent(stringifyPrimitive(obj))};var isArray=Array.isArray||function(xs){return Object.prototype.toString.call(xs)==="[object Array]"};function map(xs,f){if(xs.map)return xs.map(f);var res=[];for(var i=0;i<xs.length;i++){res.push(f(xs[i],i))}return res}var objectKeys=Object.keys||function(obj){var res=[];for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key))res.push(key)}return res}},{}],72:[function(require,module,exports){"use strict";exports.decode=exports.parse=require("./decode");exports.encode=exports.stringify=require("./encode")},{"./decode":70,"./encode":71}],73:[function(require,module,exports){var buffer=require("buffer");var Buffer=buffer.Buffer;function copyProps(src,dst){for(var key in src){dst[key]=src[key]}}if(Buffer.from&&Buffer.alloc&&Buffer.allocUnsafe&&Buffer.allocUnsafeSlow){module.exports=buffer}else{copyProps(buffer,exports);exports.Buffer=SafeBuffer}function SafeBuffer(arg,encodingOrOffset,length){return Buffer(arg,encodingOrOffset,length)}copyProps(Buffer,SafeBuffer);SafeBuffer.from=function(arg,encodingOrOffset,length){if(typeof arg==="number"){throw new TypeError("Argument must not be a number")}return Buffer(arg,encodingOrOffset,length)};SafeBuffer.alloc=function(size,fill,encoding){if(typeof size!=="number"){throw new TypeError("Argument must be a number")}var buf=Buffer(size);if(fill!==undefined){if(typeof encoding==="string"){buf.fill(fill,encoding)}else{buf.fill(fill)}}else{buf.fill(0)}return buf};SafeBuffer.allocUnsafe=function(size){if(typeof size!=="number"){throw new TypeError("Argument must be a number")}return Buffer(size)};SafeBuffer.allocUnsafeSlow=function(size){if(typeof size!=="number"){throw new TypeError("Argument must be a number")}return buffer.SlowBuffer(size)}},{buffer:5}],74:[function(require,module,exports){var util=require("./util");var has=Object.prototype.hasOwnProperty;var hasNativeMap=typeof Map!=="undefined";function ArraySet(){this._array=[];this._set=hasNativeMap?new Map:Object.create(null)}ArraySet.fromArray=function ArraySet_fromArray(aArray,aAllowDuplicates){var set=new ArraySet;for(var i=0,len=aArray.length;i<len;i++){set.add(aArray[i],aAllowDuplicates)}return set};ArraySet.prototype.size=function ArraySet_size(){return hasNativeMap?this._set.size:Object.getOwnPropertyNames(this._set).length};ArraySet.prototype.add=function ArraySet_add(aStr,aAllowDuplicates){var sStr=hasNativeMap?aStr:util.toSetString(aStr);var isDuplicate=hasNativeMap?this.has(aStr):has.call(this._set,sStr);var idx=this._array.length;if(!isDuplicate||aAllowDuplicates){this._array.push(aStr)}if(!isDuplicate){if(hasNativeMap){this._set.set(aStr,idx)}else{this._set[sStr]=idx}}};ArraySet.prototype.has=function ArraySet_has(aStr){if(hasNativeMap){return this._set.has(aStr)}else{var sStr=util.toSetString(aStr);return has.call(this._set,sStr)}};ArraySet.prototype.indexOf=function ArraySet_indexOf(aStr){if(hasNativeMap){var idx=this._set.get(aStr);if(idx>=0){return idx}}else{var sStr=util.toSetString(aStr);if(has.call(this._set,sStr)){return this._set[sStr]}}throw new Error('"'+aStr+'" is not in the set.')};ArraySet.prototype.at=function ArraySet_at(aIdx){if(aIdx>=0&&aIdx<this._array.length){return this._array[aIdx]}throw new Error("No element indexed by "+aIdx)};ArraySet.prototype.toArray=function ArraySet_toArray(){return this._array.slice()};exports.ArraySet=ArraySet},{"./util":83}],75:[function(require,module,exports){var base64=require("./base64");var VLQ_BASE_SHIFT=5;var VLQ_BASE=1<<VLQ_BASE_SHIFT;var VLQ_BASE_MASK=VLQ_BASE-1;var VLQ_CONTINUATION_BIT=VLQ_BASE;function toVLQSigned(aValue){return aValue<0?(-aValue<<1)+1:(aValue<<1)+0}function fromVLQSigned(aValue){var isNegative=(aValue&1)===1;var shifted=aValue>>1;return isNegative?-shifted:shifted}exports.encode=function base64VLQ_encode(aValue){var encoded="";var digit;var vlq=toVLQSigned(aValue);do{digit=vlq&VLQ_BASE_MASK;vlq>>>=VLQ_BASE_SHIFT;if(vlq>0){digit|=VLQ_CONTINUATION_BIT}encoded+=base64.encode(digit)}while(vlq>0);return encoded};exports.decode=function base64VLQ_decode(aStr,aIndex,aOutParam){var strLen=aStr.length;var result=0;var shift=0;var continuation,digit;do{if(aIndex>=strLen){throw new Error("Expected more digits in base 64 VLQ value.")}digit=base64.decode(aStr.charCodeAt(aIndex++));if(digit===-1){throw new Error("Invalid base64 digit: "+aStr.charAt(aIndex-1))}continuation=!!(digit&VLQ_CONTINUATION_BIT);digit&=VLQ_BASE_MASK;result=result+(digit<<shift);shift+=VLQ_BASE_SHIFT}while(continuation);aOutParam.value=fromVLQSigned(result);aOutParam.rest=aIndex}},{"./base64":76}],76:[function(require,module,exports){var intToCharMap="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");exports.encode=function(number){if(0<=number&&number<intToCharMap.length){return intToCharMap[number]}throw new TypeError("Must be between 0 and 63: "+number)};exports.decode=function(charCode){var bigA=65;var bigZ=90;var littleA=97;var littleZ=122;var zero=48;var nine=57;var plus=43;var slash=47;var littleOffset=26;var numberOffset=52;if(bigA<=charCode&&charCode<=bigZ){return charCode-bigA}if(littleA<=charCode&&charCode<=littleZ){return charCode-littleA+littleOffset}if(zero<=charCode&&charCode<=nine){return charCode-zero+numberOffset}if(charCode==plus){return 62}if(charCode==slash){return 63}return-1}},{}],77:[function(require,module,exports){exports.GREATEST_LOWER_BOUND=1;exports.LEAST_UPPER_BOUND=2;function recursiveSearch(aLow,aHigh,aNeedle,aHaystack,aCompare,aBias){var mid=Math.floor((aHigh-aLow)/2)+aLow;var cmp=aCompare(aNeedle,aHaystack[mid],true);if(cmp===0){return mid}else if(cmp>0){if(aHigh-mid>1){return recursiveSearch(mid,aHigh,aNeedle,aHaystack,aCompare,aBias)}if(aBias==exports.LEAST_UPPER_BOUND){return aHigh<aHaystack.length?aHigh:-1}else{return mid}}else{if(mid-aLow>1){return recursiveSearch(aLow,mid,aNeedle,aHaystack,aCompare,aBias)}if(aBias==exports.LEAST_UPPER_BOUND){return mid}else{return aLow<0?-1:aLow}}}exports.search=function search(aNeedle,aHaystack,aCompare,aBias){if(aHaystack.length===0){return-1}var index=recursiveSearch(-1,aHaystack.length,aNeedle,aHaystack,aCompare,aBias||exports.GREATEST_LOWER_BOUND);if(index<0){return-1}while(index-1>=0){if(aCompare(aHaystack[index],aHaystack[index-1],true)!==0){break}--index}return index}},{}],78:[function(require,module,exports){var util=require("./util");function generatedPositionAfter(mappingA,mappingB){var lineA=mappingA.generatedLine;var lineB=mappingB.generatedLine;var columnA=mappingA.generatedColumn;var columnB=mappingB.generatedColumn;return lineB>lineA||lineB==lineA&&columnB>=columnA||util.compareByGeneratedPositionsInflated(mappingA,mappingB)<=0}function MappingList(){this._array=[];this._sorted=true;this._last={generatedLine:-1,generatedColumn:0}}MappingList.prototype.unsortedForEach=function MappingList_forEach(aCallback,aThisArg){this._array.forEach(aCallback,aThisArg)};MappingList.prototype.add=function MappingList_add(aMapping){if(generatedPositionAfter(this._last,aMapping)){this._last=aMapping;this._array.push(aMapping)}else{this._sorted=false;this._array.push(aMapping)}};MappingList.prototype.toArray=function MappingList_toArray(){if(!this._sorted){this._array.sort(util.compareByGeneratedPositionsInflated);this._sorted=true}return this._array};exports.MappingList=MappingList},{"./util":83}],79:[function(require,module,exports){function swap(ary,x,y){var temp=ary[x];ary[x]=ary[y];ary[y]=temp}function randomIntInRange(low,high){return Math.round(low+Math.random()*(high-low))}function doQuickSort(ary,comparator,p,r){if(p<r){var pivotIndex=randomIntInRange(p,r);var i=p-1;swap(ary,pivotIndex,r);var pivot=ary[r];for(var j=p;j<r;j++){if(comparator(ary[j],pivot)<=0){i+=1;swap(ary,i,j)}}swap(ary,i+1,j);var q=i+1;doQuickSort(ary,comparator,p,q-1);doQuickSort(ary,comparator,q+1,r)}}exports.quickSort=function(ary,comparator){doQuickSort(ary,comparator,0,ary.length-1)}},{}],80:[function(require,module,exports){var util=require("./util");var binarySearch=require("./binary-search");var ArraySet=require("./array-set").ArraySet;var base64VLQ=require("./base64-vlq");var quickSort=require("./quick-sort").quickSort;function SourceMapConsumer(aSourceMap,aSourceMapURL){var sourceMap=aSourceMap;if(typeof aSourceMap==="string"){sourceMap=util.parseSourceMapInput(aSourceMap)}return sourceMap.sections!=null?new IndexedSourceMapConsumer(sourceMap,aSourceMapURL):new BasicSourceMapConsumer(sourceMap,aSourceMapURL)}SourceMapConsumer.fromSourceMap=function(aSourceMap,aSourceMapURL){return BasicSourceMapConsumer.fromSourceMap(aSourceMap,aSourceMapURL)};SourceMapConsumer.prototype._version=3;SourceMapConsumer.prototype.__generatedMappings=null;Object.defineProperty(SourceMapConsumer.prototype,"_generatedMappings",{configurable:true,enumerable:true,get:function(){if(!this.__generatedMappings){this._parseMappings(this._mappings,this.sourceRoot)}return this.__generatedMappings}});SourceMapConsumer.prototype.__originalMappings=null;Object.defineProperty(SourceMapConsumer.prototype,"_originalMappings",{configurable:true,enumerable:true,get:function(){if(!this.__originalMappings){this._parseMappings(this._mappings,this.sourceRoot)}return this.__originalMappings}});SourceMapConsumer.prototype._charIsMappingSeparator=function SourceMapConsumer_charIsMappingSeparator(aStr,index){var c=aStr.charAt(index);return c===";"||c===","};SourceMapConsumer.prototype._parseMappings=function SourceMapConsumer_parseMappings(aStr,aSourceRoot){throw new Error("Subclasses must implement _parseMappings")};SourceMapConsumer.GENERATED_ORDER=1;SourceMapConsumer.ORIGINAL_ORDER=2;SourceMapConsumer.GREATEST_LOWER_BOUND=1;SourceMapConsumer.LEAST_UPPER_BOUND=2;SourceMapConsumer.prototype.eachMapping=function SourceMapConsumer_eachMapping(aCallback,aContext,aOrder){var context=aContext||null;var order=aOrder||SourceMapConsumer.GENERATED_ORDER;var mappings;switch(order){case SourceMapConsumer.GENERATED_ORDER:mappings=this._generatedMappings;break;case SourceMapConsumer.ORIGINAL_ORDER:mappings=this._originalMappings;break;default:throw new Error("Unknown order of iteration.")}var sourceRoot=this.sourceRoot;mappings.map(function(mapping){var source=mapping.source===null?null:this._sources.at(mapping.source);source=util.computeSourceURL(sourceRoot,source,this._sourceMapURL);return{source:source,generatedLine:mapping.generatedLine,generatedColumn:mapping.generatedColumn,originalLine:mapping.originalLine,originalColumn:mapping.originalColumn,name:mapping.name===null?null:this._names.at(mapping.name)}},this).forEach(aCallback,context)};SourceMapConsumer.prototype.allGeneratedPositionsFor=function SourceMapConsumer_allGeneratedPositionsFor(aArgs){var line=util.getArg(aArgs,"line");var needle={source:util.getArg(aArgs,"source"),originalLine:line,originalColumn:util.getArg(aArgs,"column",0)};needle.source=this._findSourceIndex(needle.source);if(needle.source<0){return[]}var mappings=[];var index=this._findMapping(needle,this._originalMappings,"originalLine","originalColumn",util.compareByOriginalPositions,binarySearch.LEAST_UPPER_BOUND);if(index>=0){var mapping=this._originalMappings[index];if(aArgs.column===undefined){var originalLine=mapping.originalLine;while(mapping&&mapping.originalLine===originalLine){mappings.push({line:util.getArg(mapping,"generatedLine",null),column:util.getArg(mapping,"generatedColumn",null),lastColumn:util.getArg(mapping,"lastGeneratedColumn",null)});mapping=this._originalMappings[++index]}}else{var originalColumn=mapping.originalColumn;while(mapping&&mapping.originalLine===line&&mapping.originalColumn==originalColumn){mappings.push({line:util.getArg(mapping,"generatedLine",null),column:util.getArg(mapping,"generatedColumn",null),lastColumn:util.getArg(mapping,"lastGeneratedColumn",null)});mapping=this._originalMappings[++index]}}}return mappings};exports.SourceMapConsumer=SourceMapConsumer;function BasicSourceMapConsumer(aSourceMap,aSourceMapURL){var sourceMap=aSourceMap;if(typeof aSourceMap==="string"){sourceMap=util.parseSourceMapInput(aSourceMap)}var version=util.getArg(sourceMap,"version");var sources=util.getArg(sourceMap,"sources");var names=util.getArg(sourceMap,"names",[]);var sourceRoot=util.getArg(sourceMap,"sourceRoot",null);var sourcesContent=util.getArg(sourceMap,"sourcesContent",null);var mappings=util.getArg(sourceMap,"mappings");var file=util.getArg(sourceMap,"file",null);if(version!=this._version){throw new Error("Unsupported version: "+version)}if(sourceRoot){sourceRoot=util.normalize(sourceRoot)}sources=sources.map(String).map(util.normalize).map(function(source){return sourceRoot&&util.isAbsolute(sourceRoot)&&util.isAbsolute(source)?util.relative(sourceRoot,source):source});this._names=ArraySet.fromArray(names.map(String),true);this._sources=ArraySet.fromArray(sources,true);this._absoluteSources=this._sources.toArray().map(function(s){return util.computeSourceURL(sourceRoot,s,aSourceMapURL)});this.sourceRoot=sourceRoot;this.sourcesContent=sourcesContent;this._mappings=mappings;this._sourceMapURL=aSourceMapURL;this.file=file}BasicSourceMapConsumer.prototype=Object.create(SourceMapConsumer.prototype);BasicSourceMapConsumer.prototype.consumer=SourceMapConsumer;BasicSourceMapConsumer.prototype._findSourceIndex=function(aSource){var relativeSource=aSource;if(this.sourceRoot!=null){relativeSource=util.relative(this.sourceRoot,relativeSource)}if(this._sources.has(relativeSource)){return this._sources.indexOf(relativeSource)}var i;for(i=0;i<this._absoluteSources.length;++i){if(this._absoluteSources[i]==aSource){return i}}return-1};BasicSourceMapConsumer.fromSourceMap=function SourceMapConsumer_fromSourceMap(aSourceMap,aSourceMapURL){var smc=Object.create(BasicSourceMapConsumer.prototype);var names=smc._names=ArraySet.fromArray(aSourceMap._names.toArray(),true);var sources=smc._sources=ArraySet.fromArray(aSourceMap._sources.toArray(),true);smc.sourceRoot=aSourceMap._sourceRoot;smc.sourcesContent=aSourceMap._generateSourcesContent(smc._sources.toArray(),smc.sourceRoot);smc.file=aSourceMap._file;smc._sourceMapURL=aSourceMapURL;smc._absoluteSources=smc._sources.toArray().map(function(s){return util.computeSourceURL(smc.sourceRoot,s,aSourceMapURL)});var generatedMappings=aSourceMap._mappings.toArray().slice();var destGeneratedMappings=smc.__generatedMappings=[];var destOriginalMappings=smc.__originalMappings=[];for(var i=0,length=generatedMappings.length;i<length;i++){var srcMapping=generatedMappings[i];var destMapping=new Mapping;destMapping.generatedLine=srcMapping.generatedLine;destMapping.generatedColumn=srcMapping.generatedColumn;if(srcMapping.source){destMapping.source=sources.indexOf(srcMapping.source);destMapping.originalLine=srcMapping.originalLine;destMapping.originalColumn=srcMapping.originalColumn;if(srcMapping.name){destMapping.name=names.indexOf(srcMapping.name)}destOriginalMappings.push(destMapping)}destGeneratedMappings.push(destMapping)}quickSort(smc.__originalMappings,util.compareByOriginalPositions);return smc};BasicSourceMapConsumer.prototype._version=3;Object.defineProperty(BasicSourceMapConsumer.prototype,"sources",{get:function(){return this._absoluteSources.slice()}});function Mapping(){this.generatedLine=0;this.generatedColumn=0;this.source=null;this.originalLine=null;this.originalColumn=null;this.name=null}BasicSourceMapConsumer.prototype._parseMappings=function SourceMapConsumer_parseMappings(aStr,aSourceRoot){var generatedLine=1;var previousGeneratedColumn=0;var previousOriginalLine=0;var previousOriginalColumn=0;var previousSource=0;var previousName=0;var length=aStr.length;var index=0;var cachedSegments={};var temp={};var originalMappings=[];var generatedMappings=[];var mapping,str,segment,end,value;while(index<length){if(aStr.charAt(index)===";"){generatedLine++;index++;previousGeneratedColumn=0}else if(aStr.charAt(index)===","){index++}else{mapping=new Mapping;mapping.generatedLine=generatedLine;for(end=index;end<length;end++){if(this._charIsMappingSeparator(aStr,end)){break}}str=aStr.slice(index,end);segment=cachedSegments[str];if(segment){index+=str.length}else{segment=[];while(index<end){base64VLQ.decode(aStr,index,temp);value=temp.value;index=temp.rest;segment.push(value)}if(segment.length===2){throw new Error("Found a source, but no line and column")}if(segment.length===3){throw new Error("Found a source and line, but no column")}cachedSegments[str]=segment}mapping.generatedColumn=previousGeneratedColumn+segment[0];previousGeneratedColumn=mapping.generatedColumn;if(segment.length>1){mapping.source=previousSource+segment[1];previousSource+=segment[1];mapping.originalLine=previousOriginalLine+segment[2];previousOriginalLine=mapping.originalLine;mapping.originalLine+=1;mapping.originalColumn=previousOriginalColumn+segment[3];previousOriginalColumn=mapping.originalColumn;if(segment.length>4){mapping.name=previousName+segment[4];previousName+=segment[4]}}generatedMappings.push(mapping);if(typeof mapping.originalLine==="number"){originalMappings.push(mapping)}}}quickSort(generatedMappings,util.compareByGeneratedPositionsDeflated);this.__generatedMappings=generatedMappings;quickSort(originalMappings,util.compareByOriginalPositions);this.__originalMappings=originalMappings};BasicSourceMapConsumer.prototype._findMapping=function SourceMapConsumer_findMapping(aNeedle,aMappings,aLineName,aColumnName,aComparator,aBias){if(aNeedle[aLineName]<=0){throw new TypeError("Line must be greater than or equal to 1, got "+aNeedle[aLineName])}if(aNeedle[aColumnName]<0){throw new TypeError("Column must be greater than or equal to 0, got "+aNeedle[aColumnName])}return binarySearch.search(aNeedle,aMappings,aComparator,aBias)};BasicSourceMapConsumer.prototype.computeColumnSpans=function SourceMapConsumer_computeColumnSpans(){for(var index=0;index<this._generatedMappings.length;++index){var mapping=this._generatedMappings[index];if(index+1<this._generatedMappings.length){var nextMapping=this._generatedMappings[index+1];if(mapping.generatedLine===nextMapping.generatedLine){mapping.lastGeneratedColumn=nextMapping.generatedColumn-1;continue}}mapping.lastGeneratedColumn=Infinity}};BasicSourceMapConsumer.prototype.originalPositionFor=function SourceMapConsumer_originalPositionFor(aArgs){var needle={generatedLine:util.getArg(aArgs,"line"),generatedColumn:util.getArg(aArgs,"column")};var index=this._findMapping(needle,this._generatedMappings,"generatedLine","generatedColumn",util.compareByGeneratedPositionsDeflated,util.getArg(aArgs,"bias",SourceMapConsumer.GREATEST_LOWER_BOUND));if(index>=0){var mapping=this._generatedMappings[index];if(mapping.generatedLine===needle.generatedLine){var source=util.getArg(mapping,"source",null);if(source!==null){source=this._sources.at(source);source=util.computeSourceURL(this.sourceRoot,source,this._sourceMapURL)}var name=util.getArg(mapping,"name",null);if(name!==null){name=this._names.at(name)}return{source:source,line:util.getArg(mapping,"originalLine",null),column:util.getArg(mapping,"originalColumn",null),name:name}}}return{source:null,line:null,column:null,name:null}};BasicSourceMapConsumer.prototype.hasContentsOfAllSources=function BasicSourceMapConsumer_hasContentsOfAllSources(){if(!this.sourcesContent){return false}return this.sourcesContent.length>=this._sources.size()&&!this.sourcesContent.some(function(sc){return sc==null})};BasicSourceMapConsumer.prototype.sourceContentFor=function SourceMapConsumer_sourceContentFor(aSource,nullOnMissing){if(!this.sourcesContent){return null}var index=this._findSourceIndex(aSource);if(index>=0){return this.sourcesContent[index]}var relativeSource=aSource;if(this.sourceRoot!=null){relativeSource=util.relative(this.sourceRoot,relativeSource)}var url;if(this.sourceRoot!=null&&(url=util.urlParse(this.sourceRoot))){var fileUriAbsPath=relativeSource.replace(/^file:\/\//,"");if(url.scheme=="file"&&this._sources.has(fileUriAbsPath)){return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)]}if((!url.path||url.path=="/")&&this._sources.has("/"+relativeSource)){return this.sourcesContent[this._sources.indexOf("/"+relativeSource)]}}if(nullOnMissing){return null}else{throw new Error('"'+relativeSource+'" is not in the SourceMap.')}};BasicSourceMapConsumer.prototype.generatedPositionFor=function SourceMapConsumer_generatedPositionFor(aArgs){var source=util.getArg(aArgs,"source");source=this._findSourceIndex(source);if(source<0){return{line:null,column:null,lastColumn:null}}var needle={source:source,originalLine:util.getArg(aArgs,"line"),originalColumn:util.getArg(aArgs,"column")};var index=this._findMapping(needle,this._originalMappings,"originalLine","originalColumn",util.compareByOriginalPositions,util.getArg(aArgs,"bias",SourceMapConsumer.GREATEST_LOWER_BOUND));if(index>=0){var mapping=this._originalMappings[index];if(mapping.source===needle.source){return{line:util.getArg(mapping,"generatedLine",null),column:util.getArg(mapping,"generatedColumn",null),lastColumn:util.getArg(mapping,"lastGeneratedColumn",null)}}}return{line:null,column:null,lastColumn:null}};exports.BasicSourceMapConsumer=BasicSourceMapConsumer;function IndexedSourceMapConsumer(aSourceMap,aSourceMapURL){var sourceMap=aSourceMap;if(typeof aSourceMap==="string"){sourceMap=util.parseSourceMapInput(aSourceMap)}var version=util.getArg(sourceMap,"version");var sections=util.getArg(sourceMap,"sections");if(version!=this._version){throw new Error("Unsupported version: "+version)}this._sources=new ArraySet;this._names=new ArraySet;var lastOffset={line:-1,column:0};this._sections=sections.map(function(s){if(s.url){throw new Error("Support for url field in sections not implemented.")}var offset=util.getArg(s,"offset");var offsetLine=util.getArg(offset,"line");var offsetColumn=util.getArg(offset,"column");if(offsetLine<lastOffset.line||offsetLine===lastOffset.line&&offsetColumn<lastOffset.column){throw new Error("Section offsets must be ordered and non-overlapping.")}lastOffset=offset;return{generatedOffset:{generatedLine:offsetLine+1,generatedColumn:offsetColumn+1},consumer:new SourceMapConsumer(util.getArg(s,"map"),aSourceMapURL)}})}IndexedSourceMapConsumer.prototype=Object.create(SourceMapConsumer.prototype);IndexedSourceMapConsumer.prototype.constructor=SourceMapConsumer;IndexedSourceMapConsumer.prototype._version=3;Object.defineProperty(IndexedSourceMapConsumer.prototype,"sources",{get:function(){var sources=[];for(var i=0;i<this._sections.length;i++){for(var j=0;j<this._sections[i].consumer.sources.length;j++){sources.push(this._sections[i].consumer.sources[j])}}return sources}});IndexedSourceMapConsumer.prototype.originalPositionFor=function IndexedSourceMapConsumer_originalPositionFor(aArgs){var needle={generatedLine:util.getArg(aArgs,"line"),generatedColumn:util.getArg(aArgs,"column")};var sectionIndex=binarySearch.search(needle,this._sections,function(needle,section){var cmp=needle.generatedLine-section.generatedOffset.generatedLine;if(cmp){return cmp}return needle.generatedColumn-section.generatedOffset.generatedColumn});var section=this._sections[sectionIndex];if(!section){return{source:null,line:null,column:null,name:null}}return section.consumer.originalPositionFor({line:needle.generatedLine-(section.generatedOffset.generatedLine-1),column:needle.generatedColumn-(section.generatedOffset.generatedLine===needle.generatedLine?section.generatedOffset.generatedColumn-1:0),bias:aArgs.bias})};IndexedSourceMapConsumer.prototype.hasContentsOfAllSources=function IndexedSourceMapConsumer_hasContentsOfAllSources(){return this._sections.every(function(s){return s.consumer.hasContentsOfAllSources()})};IndexedSourceMapConsumer.prototype.sourceContentFor=function IndexedSourceMapConsumer_sourceContentFor(aSource,nullOnMissing){for(var i=0;i<this._sections.length;i++){var section=this._sections[i];var content=section.consumer.sourceContentFor(aSource,true);if(content){return content}}if(nullOnMissing){return null}else{throw new Error('"'+aSource+'" is not in the SourceMap.')}};IndexedSourceMapConsumer.prototype.generatedPositionFor=function IndexedSourceMapConsumer_generatedPositionFor(aArgs){for(var i=0;i<this._sections.length;i++){var section=this._sections[i];if(section.consumer._findSourceIndex(util.getArg(aArgs,"source"))===-1){continue}var generatedPosition=section.consumer.generatedPositionFor(aArgs);if(generatedPosition){var ret={line:generatedPosition.line+(section.generatedOffset.generatedLine-1),column:generatedPosition.column+(section.generatedOffset.generatedLine===generatedPosition.line?section.generatedOffset.generatedColumn-1:0)};return ret}}return{line:null,column:null}};IndexedSourceMapConsumer.prototype._parseMappings=function IndexedSourceMapConsumer_parseMappings(aStr,aSourceRoot){this.__generatedMappings=[];this.__originalMappings=[];for(var i=0;i<this._sections.length;i++){var section=this._sections[i];var sectionMappings=section.consumer._generatedMappings;for(var j=0;j<sectionMappings.length;j++){var mapping=sectionMappings[j];var source=section.consumer._sources.at(mapping.source);source=util.computeSourceURL(section.consumer.sourceRoot,source,this._sourceMapURL);this._sources.add(source);source=this._sources.indexOf(source);var name=null;if(mapping.name){name=section.consumer._names.at(mapping.name);this._names.add(name);name=this._names.indexOf(name)}var adjustedMapping={source:source,generatedLine:mapping.generatedLine+(section.generatedOffset.generatedLine-1),generatedColumn:mapping.generatedColumn+(section.generatedOffset.generatedLine===mapping.generatedLine?section.generatedOffset.generatedColumn-1:0),originalLine:mapping.originalLine,originalColumn:mapping.originalColumn,name:name};this.__generatedMappings.push(adjustedMapping);if(typeof adjustedMapping.originalLine==="number"){this.__originalMappings.push(adjustedMapping)}}}quickSort(this.__generatedMappings,util.compareByGeneratedPositionsDeflated);quickSort(this.__originalMappings,util.compareByOriginalPositions)};exports.IndexedSourceMapConsumer=IndexedSourceMapConsumer},{"./array-set":74,"./base64-vlq":75,"./binary-search":77,"./quick-sort":79,"./util":83}],81:[function(require,module,exports){var base64VLQ=require("./base64-vlq");var util=require("./util");var ArraySet=require("./array-set").ArraySet;var MappingList=require("./mapping-list").MappingList;function SourceMapGenerator(aArgs){if(!aArgs){aArgs={}}this._file=util.getArg(aArgs,"file",null);this._sourceRoot=util.getArg(aArgs,"sourceRoot",null);this._skipValidation=util.getArg(aArgs,"skipValidation",false);this._sources=new ArraySet;this._names=new ArraySet;this._mappings=new MappingList;this._sourcesContents=null}SourceMapGenerator.prototype._version=3;SourceMapGenerator.fromSourceMap=function SourceMapGenerator_fromSourceMap(aSourceMapConsumer){var sourceRoot=aSourceMapConsumer.sourceRoot;var generator=new SourceMapGenerator({file:aSourceMapConsumer.file,sourceRoot:sourceRoot});aSourceMapConsumer.eachMapping(function(mapping){var newMapping={generated:{line:mapping.generatedLine,column:mapping.generatedColumn}};if(mapping.source!=null){newMapping.source=mapping.source;if(sourceRoot!=null){newMapping.source=util.relative(sourceRoot,newMapping.source)}newMapping.original={line:mapping.originalLine,column:mapping.originalColumn};if(mapping.name!=null){newMapping.name=mapping.name}}generator.addMapping(newMapping)});aSourceMapConsumer.sources.forEach(function(sourceFile){var sourceRelative=sourceFile;if(sourceRoot!==null){sourceRelative=util.relative(sourceRoot,sourceFile)}if(!generator._sources.has(sourceRelative)){generator._sources.add(sourceRelative)}var content=aSourceMapConsumer.sourceContentFor(sourceFile);if(content!=null){generator.setSourceContent(sourceFile,content)}});return generator};SourceMapGenerator.prototype.addMapping=function SourceMapGenerator_addMapping(aArgs){var generated=util.getArg(aArgs,"generated");var original=util.getArg(aArgs,"original",null);var source=util.getArg(aArgs,"source",null);var name=util.getArg(aArgs,"name",null);if(!this._skipValidation){this._validateMapping(generated,original,source,name)}if(source!=null){source=String(source);if(!this._sources.has(source)){this._sources.add(source)}}if(name!=null){name=String(name);if(!this._names.has(name)){this._names.add(name)}}this._mappings.add({generatedLine:generated.line,generatedColumn:generated.column,originalLine:original!=null&&original.line,originalColumn:original!=null&&original.column,source:source,name:name})};SourceMapGenerator.prototype.setSourceContent=function SourceMapGenerator_setSourceContent(aSourceFile,aSourceContent){var source=aSourceFile;if(this._sourceRoot!=null){source=util.relative(this._sourceRoot,source)}if(aSourceContent!=null){if(!this._sourcesContents){this._sourcesContents=Object.create(null)}this._sourcesContents[util.toSetString(source)]=aSourceContent}else if(this._sourcesContents){delete this._sourcesContents[util.toSetString(source)];if(Object.keys(this._sourcesContents).length===0){this._sourcesContents=null}}};SourceMapGenerator.prototype.applySourceMap=function SourceMapGenerator_applySourceMap(aSourceMapConsumer,aSourceFile,aSourceMapPath){var sourceFile=aSourceFile;if(aSourceFile==null){if(aSourceMapConsumer.file==null){throw new Error("SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, "+'or the source map\'s "file" property. Both were omitted.')}sourceFile=aSourceMapConsumer.file}var sourceRoot=this._sourceRoot;if(sourceRoot!=null){sourceFile=util.relative(sourceRoot,sourceFile)}var newSources=new ArraySet;var newNames=new ArraySet;this._mappings.unsortedForEach(function(mapping){if(mapping.source===sourceFile&&mapping.originalLine!=null){var original=aSourceMapConsumer.originalPositionFor({line:mapping.originalLine,column:mapping.originalColumn});if(original.source!=null){mapping.source=original.source;if(aSourceMapPath!=null){mapping.source=util.join(aSourceMapPath,mapping.source)}if(sourceRoot!=null){mapping.source=util.relative(sourceRoot,mapping.source)}mapping.originalLine=original.line;mapping.originalColumn=original.column;if(original.name!=null){mapping.name=original.name}}}var source=mapping.source;if(source!=null&&!newSources.has(source)){newSources.add(source)}var name=mapping.name;if(name!=null&&!newNames.has(name)){newNames.add(name)}},this);this._sources=newSources;this._names=newNames;aSourceMapConsumer.sources.forEach(function(sourceFile){var content=aSourceMapConsumer.sourceContentFor(sourceFile);if(content!=null){if(aSourceMapPath!=null){sourceFile=util.join(aSourceMapPath,sourceFile)}if(sourceRoot!=null){sourceFile=util.relative(sourceRoot,sourceFile)}this.setSourceContent(sourceFile,content)}},this)};SourceMapGenerator.prototype._validateMapping=function SourceMapGenerator_validateMapping(aGenerated,aOriginal,aSource,aName){if(aOriginal&&typeof aOriginal.line!=="number"&&typeof aOriginal.column!=="number"){throw new Error("original.line and original.column are not numbers -- you probably meant to omit "+"the original mapping entirely and only map the generated position. If so, pass "+"null for the original mapping instead of an object with empty or null values.")}if(aGenerated&&"line"in aGenerated&&"column"in aGenerated&&aGenerated.line>0&&aGenerated.column>=0&&!aOriginal&&!aSource&&!aName){return}else if(aGenerated&&"line"in aGenerated&&"column"in aGenerated&&aOriginal&&"line"in aOriginal&&"column"in aOriginal&&aGenerated.line>0&&aGenerated.column>=0&&aOriginal.line>0&&aOriginal.column>=0&&aSource){return}else{throw new Error("Invalid mapping: "+JSON.stringify({generated:aGenerated,source:aSource,original:aOriginal,name:aName}))}};SourceMapGenerator.prototype._serializeMappings=function SourceMapGenerator_serializeMappings(){var previousGeneratedColumn=0;var previousGeneratedLine=1;var previousOriginalColumn=0;var previousOriginalLine=0;var previousName=0;var previousSource=0;var result="";var next;var mapping;var nameIdx;var sourceIdx;var mappings=this._mappings.toArray();for(var i=0,len=mappings.length;i<len;i++){mapping=mappings[i];next="";if(mapping.generatedLine!==previousGeneratedLine){previousGeneratedColumn=0;while(mapping.generatedLine!==previousGeneratedLine){next+=";";previousGeneratedLine++}}else{if(i>0){if(!util.compareByGeneratedPositionsInflated(mapping,mappings[i-1])){continue}next+=","}}next+=base64VLQ.encode(mapping.generatedColumn-previousGeneratedColumn);previousGeneratedColumn=mapping.generatedColumn;if(mapping.source!=null){sourceIdx=this._sources.indexOf(mapping.source);next+=base64VLQ.encode(sourceIdx-previousSource);previousSource=sourceIdx;next+=base64VLQ.encode(mapping.originalLine-1-previousOriginalLine);previousOriginalLine=mapping.originalLine-1;next+=base64VLQ.encode(mapping.originalColumn-previousOriginalColumn);previousOriginalColumn=mapping.originalColumn;if(mapping.name!=null){nameIdx=this._names.indexOf(mapping.name);next+=base64VLQ.encode(nameIdx-previousName);previousName=nameIdx}}result+=next}return result};SourceMapGenerator.prototype._generateSourcesContent=function SourceMapGenerator_generateSourcesContent(aSources,aSourceRoot){return aSources.map(function(source){if(!this._sourcesContents){return null}if(aSourceRoot!=null){source=util.relative(aSourceRoot,source)}var key=util.toSetString(source);return Object.prototype.hasOwnProperty.call(this._sourcesContents,key)?this._sourcesContents[key]:null},this)};SourceMapGenerator.prototype.toJSON=function SourceMapGenerator_toJSON(){var map={version:this._version,sources:this._sources.toArray(),names:this._names.toArray(),mappings:this._serializeMappings()};if(this._file!=null){map.file=this._file}if(this._sourceRoot!=null){map.sourceRoot=this._sourceRoot}if(this._sourcesContents){map.sourcesContent=this._generateSourcesContent(map.sources,map.sourceRoot)}return map};SourceMapGenerator.prototype.toString=function SourceMapGenerator_toString(){return JSON.stringify(this.toJSON())};exports.SourceMapGenerator=SourceMapGenerator},{"./array-set":74,"./base64-vlq":75,"./mapping-list":78,"./util":83}],82:[function(require,module,exports){var SourceMapGenerator=require("./source-map-generator").SourceMapGenerator;var util=require("./util");var REGEX_NEWLINE=/(\r?\n)/;var NEWLINE_CODE=10;var isSourceNode="$$$isSourceNode$$$";function SourceNode(aLine,aColumn,aSource,aChunks,aName){this.children=[];this.sourceContents={};this.line=aLine==null?null:aLine;this.column=aColumn==null?null:aColumn;this.source=aSource==null?null:aSource;this.name=aName==null?null:aName;this[isSourceNode]=true;if(aChunks!=null)this.add(aChunks)}SourceNode.fromStringWithSourceMap=function SourceNode_fromStringWithSourceMap(aGeneratedCode,aSourceMapConsumer,aRelativePath){var node=new SourceNode;var remainingLines=aGeneratedCode.split(REGEX_NEWLINE);var remainingLinesIndex=0;var shiftNextLine=function(){var lineContents=getNextLine();var newLine=getNextLine()||"";return lineContents+newLine;function getNextLine(){return remainingLinesIndex<remainingLines.length?remainingLines[remainingLinesIndex++]:undefined}};var lastGeneratedLine=1,lastGeneratedColumn=0;var lastMapping=null;aSourceMapConsumer.eachMapping(function(mapping){if(lastMapping!==null){if(lastGeneratedLine<mapping.generatedLine){addMappingWithCode(lastMapping,shiftNextLine());lastGeneratedLine++;lastGeneratedColumn=0}else{var nextLine=remainingLines[remainingLinesIndex]||"";var code=nextLine.substr(0,mapping.generatedColumn-lastGeneratedColumn);remainingLines[remainingLinesIndex]=nextLine.substr(mapping.generatedColumn-lastGeneratedColumn);lastGeneratedColumn=mapping.generatedColumn;addMappingWithCode(lastMapping,code);lastMapping=mapping;return}}while(lastGeneratedLine<mapping.generatedLine){node.add(shiftNextLine());lastGeneratedLine++}if(lastGeneratedColumn<mapping.generatedColumn){var nextLine=remainingLines[remainingLinesIndex]||"";node.add(nextLine.substr(0,mapping.generatedColumn));remainingLines[remainingLinesIndex]=nextLine.substr(mapping.generatedColumn);lastGeneratedColumn=mapping.generatedColumn}lastMapping=mapping},this);if(remainingLinesIndex<remainingLines.length){if(lastMapping){addMappingWithCode(lastMapping,shiftNextLine())}node.add(remainingLines.splice(remainingLinesIndex).join(""))}aSourceMapConsumer.sources.forEach(function(sourceFile){var content=aSourceMapConsumer.sourceContentFor(sourceFile);if(content!=null){if(aRelativePath!=null){sourceFile=util.join(aRelativePath,sourceFile)}node.setSourceContent(sourceFile,content)}});return node;function addMappingWithCode(mapping,code){if(mapping===null||mapping.source===undefined){node.add(code)}else{var source=aRelativePath?util.join(aRelativePath,mapping.source):mapping.source;node.add(new SourceNode(mapping.originalLine,mapping.originalColumn,source,code,mapping.name))}}};SourceNode.prototype.add=function SourceNode_add(aChunk){if(Array.isArray(aChunk)){aChunk.forEach(function(chunk){this.add(chunk)},this)}else if(aChunk[isSourceNode]||typeof aChunk==="string"){if(aChunk){this.children.push(aChunk)}}else{throw new TypeError("Expected a SourceNode, string, or an array of SourceNodes and strings. Got "+aChunk)}return this};SourceNode.prototype.prepend=function SourceNode_prepend(aChunk){if(Array.isArray(aChunk)){for(var i=aChunk.length-1;i>=0;i--){this.prepend(aChunk[i])}}else if(aChunk[isSourceNode]||typeof aChunk==="string"){this.children.unshift(aChunk)}else{throw new TypeError("Expected a SourceNode, string, or an array of SourceNodes and strings. Got "+aChunk)}return this};SourceNode.prototype.walk=function SourceNode_walk(aFn){var chunk;for(var i=0,len=this.children.length;i<len;i++){chunk=this.children[i];if(chunk[isSourceNode]){chunk.walk(aFn)}else{if(chunk!==""){aFn(chunk,{source:this.source,line:this.line,column:this.column,name:this.name})}}}};SourceNode.prototype.join=function SourceNode_join(aSep){var newChildren;var i;var len=this.children.length;if(len>0){newChildren=[];for(i=0;i<len-1;i++){newChildren.push(this.children[i]);newChildren.push(aSep)}newChildren.push(this.children[i]);this.children=newChildren}return this};SourceNode.prototype.replaceRight=function SourceNode_replaceRight(aPattern,aReplacement){var lastChild=this.children[this.children.length-1];if(lastChild[isSourceNode]){lastChild.replaceRight(aPattern,aReplacement)}else if(typeof lastChild==="string"){this.children[this.children.length-1]=lastChild.replace(aPattern,aReplacement)}else{this.children.push("".replace(aPattern,aReplacement))}return this};SourceNode.prototype.setSourceContent=function SourceNode_setSourceContent(aSourceFile,aSourceContent){this.sourceContents[util.toSetString(aSourceFile)]=aSourceContent};SourceNode.prototype.walkSourceContents=function SourceNode_walkSourceContents(aFn){for(var i=0,len=this.children.length;i<len;i++){if(this.children[i][isSourceNode]){this.children[i].walkSourceContents(aFn)}}var sources=Object.keys(this.sourceContents);for(var i=0,len=sources.length;i<len;i++){aFn(util.fromSetString(sources[i]),this.sourceContents[sources[i]])}};SourceNode.prototype.toString=function SourceNode_toString(){var str="";this.walk(function(chunk){str+=chunk});return str};SourceNode.prototype.toStringWithSourceMap=function SourceNode_toStringWithSourceMap(aArgs){var generated={code:"",line:1,column:0};var map=new SourceMapGenerator(aArgs);var sourceMappingActive=false;var lastOriginalSource=null;var lastOriginalLine=null;var lastOriginalColumn=null;var lastOriginalName=null;this.walk(function(chunk,original){generated.code+=chunk;if(original.source!==null&&original.line!==null&&original.column!==null){if(lastOriginalSource!==original.source||lastOriginalLine!==original.line||lastOriginalColumn!==original.column||lastOriginalName!==original.name){map.addMapping({source:original.source,original:{line:original.line,column:original.column},generated:{line:generated.line,column:generated.column},name:original.name})}lastOriginalSource=original.source;lastOriginalLine=original.line;lastOriginalColumn=original.column;lastOriginalName=original.name;sourceMappingActive=true}else if(sourceMappingActive){map.addMapping({generated:{line:generated.line,column:generated.column}});lastOriginalSource=null;sourceMappingActive=false}for(var idx=0,length=chunk.length;idx<length;idx++){if(chunk.charCodeAt(idx)===NEWLINE_CODE){generated.line++;generated.column=0;if(idx+1===length){lastOriginalSource=null;sourceMappingActive=false}else if(sourceMappingActive){map.addMapping({source:original.source,original:{line:original.line,column:original.column},generated:{line:generated.line,column:generated.column},name:original.name})}}else{generated.column++}}});this.walkSourceContents(function(sourceFile,sourceContent){map.setSourceContent(sourceFile,sourceContent)});return{code:generated.code,map:map}};exports.SourceNode=SourceNode},{"./source-map-generator":81,"./util":83}],83:[function(require,module,exports){function getArg(aArgs,aName,aDefaultValue){if(aName in aArgs){return aArgs[aName]}else if(arguments.length===3){return aDefaultValue}else{throw new Error('"'+aName+'" is a required argument.')}}exports.getArg=getArg;var urlRegexp=/^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/;var dataUrlRegexp=/^data:.+\,.+$/;function urlParse(aUrl){var match=aUrl.match(urlRegexp);if(!match){return null}return{scheme:match[1],auth:match[2],host:match[3],port:match[4],path:match[5]}}exports.urlParse=urlParse;function urlGenerate(aParsedUrl){var url="";if(aParsedUrl.scheme){url+=aParsedUrl.scheme+":"}url+="//";if(aParsedUrl.auth){url+=aParsedUrl.auth+"@"}if(aParsedUrl.host){url+=aParsedUrl.host}if(aParsedUrl.port){url+=":"+aParsedUrl.port}if(aParsedUrl.path){url+=aParsedUrl.path}return url}exports.urlGenerate=urlGenerate;function normalize(aPath){var path=aPath;var url=urlParse(aPath);if(url){if(!url.path){return aPath}path=url.path}var isAbsolute=exports.isAbsolute(path);var parts=path.split(/\/+/);for(var part,up=0,i=parts.length-1;i>=0;i--){part=parts[i];if(part==="."){parts.splice(i,1)}else if(part===".."){up++}else if(up>0){if(part===""){parts.splice(i+1,up);up=0}else{parts.splice(i,2);up--}}}path=parts.join("/");if(path===""){path=isAbsolute?"/":"."}if(url){url.path=path;return urlGenerate(url)}return path}exports.normalize=normalize;function join(aRoot,aPath){if(aRoot===""){aRoot="."}if(aPath===""){aPath="."}var aPathUrl=urlParse(aPath);var aRootUrl=urlParse(aRoot);if(aRootUrl){aRoot=aRootUrl.path||"/"}if(aPathUrl&&!aPathUrl.scheme){if(aRootUrl){aPathUrl.scheme=aRootUrl.scheme}return urlGenerate(aPathUrl)}if(aPathUrl||aPath.match(dataUrlRegexp)){return aPath}if(aRootUrl&&!aRootUrl.host&&!aRootUrl.path){aRootUrl.host=aPath;return urlGenerate(aRootUrl)}var joined=aPath.charAt(0)==="/"?aPath:normalize(aRoot.replace(/\/+$/,"")+"/"+aPath);if(aRootUrl){aRootUrl.path=joined;return urlGenerate(aRootUrl)}return joined}exports.join=join;exports.isAbsolute=function(aPath){return aPath.charAt(0)==="/"||urlRegexp.test(aPath)};function relative(aRoot,aPath){if(aRoot===""){aRoot="."}aRoot=aRoot.replace(/\/$/,"");var level=0;while(aPath.indexOf(aRoot+"/")!==0){var index=aRoot.lastIndexOf("/");if(index<0){return aPath}aRoot=aRoot.slice(0,index);if(aRoot.match(/^([^\/]+:\/)?\/*$/)){return aPath}++level}return Array(level+1).join("../")+aPath.substr(aRoot.length+1)}exports.relative=relative;var supportsNullProto=function(){var obj=Object.create(null);return!("__proto__"in obj)}();function identity(s){return s}function toSetString(aStr){if(isProtoString(aStr)){return"$"+aStr}return aStr}exports.toSetString=supportsNullProto?identity:toSetString;function fromSetString(aStr){if(isProtoString(aStr)){return aStr.slice(1)}return aStr}exports.fromSetString=supportsNullProto?identity:fromSetString;function isProtoString(s){if(!s){return false}var length=s.length;if(length<9){return false}if(s.charCodeAt(length-1)!==95||s.charCodeAt(length-2)!==95||s.charCodeAt(length-3)!==111||s.charCodeAt(length-4)!==116||s.charCodeAt(length-5)!==111||s.charCodeAt(length-6)!==114||s.charCodeAt(length-7)!==112||s.charCodeAt(length-8)!==95||s.charCodeAt(length-9)!==95){return false}for(var i=length-10;i>=0;i--){if(s.charCodeAt(i)!==36){return false}}return true}function compareByOriginalPositions(mappingA,mappingB,onlyCompareOriginal){var cmp=strcmp(mappingA.source,mappingB.source);if(cmp!==0){return cmp}cmp=mappingA.originalLine-mappingB.originalLine;if(cmp!==0){return cmp}cmp=mappingA.originalColumn-mappingB.originalColumn;if(cmp!==0||onlyCompareOriginal){return cmp}cmp=mappingA.generatedColumn-mappingB.generatedColumn;if(cmp!==0){return cmp}cmp=mappingA.generatedLine-mappingB.generatedLine;if(cmp!==0){return cmp}return strcmp(mappingA.name,mappingB.name)}exports.compareByOriginalPositions=compareByOriginalPositions;function compareByGeneratedPositionsDeflated(mappingA,mappingB,onlyCompareGenerated){var cmp=mappingA.generatedLine-mappingB.generatedLine;if(cmp!==0){return cmp}cmp=mappingA.generatedColumn-mappingB.generatedColumn;if(cmp!==0||onlyCompareGenerated){return cmp}cmp=strcmp(mappingA.source,mappingB.source);if(cmp!==0){return cmp}cmp=mappingA.originalLine-mappingB.originalLine;if(cmp!==0){return cmp}cmp=mappingA.originalColumn-mappingB.originalColumn;if(cmp!==0){return cmp}return strcmp(mappingA.name,mappingB.name)}exports.compareByGeneratedPositionsDeflated=compareByGeneratedPositionsDeflated;function strcmp(aStr1,aStr2){if(aStr1===aStr2){return 0}if(aStr1===null){return 1}if(aStr2===null){return-1}if(aStr1>aStr2){return 1}return-1}function compareByGeneratedPositionsInflated(mappingA,mappingB){var cmp=mappingA.generatedLine-mappingB.generatedLine;if(cmp!==0){return cmp}cmp=mappingA.generatedColumn-mappingB.generatedColumn;if(cmp!==0){return cmp}cmp=strcmp(mappingA.source,mappingB.source);if(cmp!==0){return cmp}cmp=mappingA.originalLine-mappingB.originalLine;if(cmp!==0){return cmp}cmp=mappingA.originalColumn-mappingB.originalColumn;if(cmp!==0){return cmp}return strcmp(mappingA.name,mappingB.name)}exports.compareByGeneratedPositionsInflated=compareByGeneratedPositionsInflated;function parseSourceMapInput(str){return JSON.parse(str.replace(/^\)]}'[^\n]*\n/,""))}exports.parseSourceMapInput=parseSourceMapInput;function computeSourceURL(sourceRoot,sourceURL,sourceMapURL){sourceURL=sourceURL||"";if(sourceRoot){if(sourceRoot[sourceRoot.length-1]!=="/"&&sourceURL[0]!=="/"){sourceRoot+="/"}sourceURL=sourceRoot+sourceURL}if(sourceMapURL){var parsed=urlParse(sourceMapURL);if(!parsed){throw new Error("sourceMapURL could not be parsed")}if(parsed.path){var index=parsed.path.lastIndexOf("/");if(index>=0){parsed.path=parsed.path.substring(0,index+1)}}sourceURL=join(urlGenerate(parsed),sourceURL)}return normalize(sourceURL)}exports.computeSourceURL=computeSourceURL},{}],84:[function(require,module,exports){exports.SourceMapGenerator=require("./lib/source-map-generator").SourceMapGenerator;exports.SourceMapConsumer=require("./lib/source-map-consumer").SourceMapConsumer;exports.SourceNode=require("./lib/source-node").SourceNode},{"./lib/source-map-consumer":80,"./lib/source-map-generator":81,"./lib/source-node":82}],85:[function(require,module,exports){"use strict";var numberIsNan=require("number-is-nan");var arrayUniq=require("array-uniq");var reInt=/^\d+$/;function deepUnique(arr){return arr.sort().filter(function(el,i){return JSON.stringify(el)!==JSON.stringify(arr[i-1])})}exports.parse=function(str){return deepUnique(str.split(",").map(function(el){var ret={};el.trim().split(/\s+/).forEach(function(el,i){if(i===0){return ret.url=el}var value=el.substring(0,el.length-1);var postfix=el[el.length-1];var intVal=parseInt(value,10);var floatVal=parseFloat(value);if(postfix==="w"&&reInt.test(value)){ret.width=intVal}else if(postfix==="h"&&reInt.test(value)){ret.height=intVal}else if(postfix==="x"&&!numberIsNan(floatVal)){ret.density=floatVal}else{throw new Error("Invalid srcset descriptor: "+el+".")}});return ret}))};exports.stringify=function(arr){return arrayUniq(arr.map(function(el){if(!el.url){throw new Error("URL is required.")}var ret=[el.url];if(el.width){ret.push(el.width+"w")}if(el.height){ret.push(el.height+"h")}if(el.density){ret.push(el.density+"x")}return ret.join(" ")})).join(", ")}},{"array-uniq":2,"number-is-nan":42}],86:[function(require,module,exports){"use strict";var Buffer=require("safe-buffer").Buffer;var isEncoding=Buffer.isEncoding||function(encoding){encoding=""+encoding;switch(encoding&&encoding.toLowerCase()){case"hex":case"utf8":case"utf-8":case"ascii":case"binary":case"base64":case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":case"raw":return true;default:return false}};function _normalizeEncoding(enc){if(!enc)return"utf8";var retried;while(true){switch(enc){case"utf8":case"utf-8":return"utf8";case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return"utf16le";case"latin1":case"binary":return"latin1";case"base64":case"ascii":case"hex":return enc;default:if(retried)return;enc=(""+enc).toLowerCase();retried=true}}}function normalizeEncoding(enc){var nenc=_normalizeEncoding(enc);if(typeof nenc!=="string"&&(Buffer.isEncoding===isEncoding||!isEncoding(enc)))throw new Error("Unknown encoding: "+enc);return nenc||enc}exports.StringDecoder=StringDecoder;function StringDecoder(encoding){this.encoding=normalizeEncoding(encoding);var nb;switch(this.encoding){case"utf16le":this.text=utf16Text;this.end=utf16End;nb=4;break;case"utf8":this.fillLast=utf8FillLast;nb=4;break;case"base64":this.text=base64Text;this.end=base64End;nb=3;break;default:this.write=simpleWrite;this.end=simpleEnd;return}this.lastNeed=0;this.lastTotal=0;this.lastChar=Buffer.allocUnsafe(nb)}StringDecoder.prototype.write=function(buf){if(buf.length===0)return"";var r;var i;if(this.lastNeed){r=this.fillLast(buf);if(r===undefined)return"";i=this.lastNeed;this.lastNeed=0}else{i=0}if(i<buf.length)return r?r+this.text(buf,i):this.text(buf,i);return r||""};StringDecoder.prototype.end=utf8End;StringDecoder.prototype.text=utf8Text;StringDecoder.prototype.fillLast=function(buf){if(this.lastNeed<=buf.length){buf.copy(this.lastChar,this.lastTotal-this.lastNeed,0,this.lastNeed);return this.lastChar.toString(this.encoding,0,this.lastTotal)}buf.copy(this.lastChar,this.lastTotal-this.lastNeed,0,buf.length);this.lastNeed-=buf.length};function utf8CheckByte(byte){if(byte<=127)return 0;else if(byte>>5===6)return 2;else if(byte>>4===14)return 3;else if(byte>>3===30)return 4;return byte>>6===2?-1:-2}function utf8CheckIncomplete(self,buf,i){var j=buf.length-1;if(j<i)return 0;var nb=utf8CheckByte(buf[j]);if(nb>=0){if(nb>0)self.lastNeed=nb-1;return nb}if(--j<i||nb===-2)return 0;nb=utf8CheckByte(buf[j]);if(nb>=0){if(nb>0)self.lastNeed=nb-2;return nb}if(--j<i||nb===-2)return 0;nb=utf8CheckByte(buf[j]);if(nb>=0){if(nb>0){if(nb===2)nb=0;else self.lastNeed=nb-3}return nb}return 0}function utf8CheckExtraBytes(self,buf,p){if((buf[0]&192)!==128){self.lastNeed=0;return"�"}if(self.lastNeed>1&&buf.length>1){if((buf[1]&192)!==128){self.lastNeed=1;return"�"}if(self.lastNeed>2&&buf.length>2){if((buf[2]&192)!==128){self.lastNeed=2;return"�"}}}}function utf8FillLast(buf){var p=this.lastTotal-this.lastNeed;var r=utf8CheckExtraBytes(this,buf,p);if(r!==undefined)return r;if(this.lastNeed<=buf.length){buf.copy(this.lastChar,p,0,this.lastNeed);return this.lastChar.toString(this.encoding,0,this.lastTotal)}buf.copy(this.lastChar,p,0,buf.length);this.lastNeed-=buf.length}function utf8Text(buf,i){var total=utf8CheckIncomplete(this,buf,i);if(!this.lastNeed)return buf.toString("utf8",i);this.lastTotal=total;var end=buf.length-(total-this.lastNeed);buf.copy(this.lastChar,0,end);return buf.toString("utf8",i,end)}function utf8End(buf){var r=buf&&buf.length?this.write(buf):"";if(this.lastNeed)return r+"�";return r}function utf16Text(buf,i){if((buf.length-i)%2===0){var r=buf.toString("utf16le",i);if(r){var c=r.charCodeAt(r.length-1);if(c>=55296&&c<=56319){this.lastNeed=2;this.lastTotal=4;this.lastChar[0]=buf[buf.length-2];this.lastChar[1]=buf[buf.length-1];return r.slice(0,-1)}}return r}this.lastNeed=1;this.lastTotal=2;this.lastChar[0]=buf[buf.length-1];return buf.toString("utf16le",i,buf.length-1)}function utf16End(buf){var r=buf&&buf.length?this.write(buf):"";if(this.lastNeed){var end=this.lastTotal-this.lastNeed;return r+this.lastChar.toString("utf16le",0,end)}return r}function base64Text(buf,i){var n=(buf.length-i)%3;if(n===0)return buf.toString("base64",i);this.lastNeed=3-n;this.lastTotal=3;if(n===1){this.lastChar[0]=buf[buf.length-1]}else{this.lastChar[0]=buf[buf.length-2];this.lastChar[1]=buf[buf.length-1]}return buf.toString("base64",i,buf.length-n)}function base64End(buf){var r=buf&&buf.length?this.write(buf):"";if(this.lastNeed)return r+this.lastChar.toString("base64",0,3-this.lastNeed);return r}function simpleWrite(buf){return buf.toString(this.encoding)}function simpleEnd(buf){return buf&&buf.length?this.write(buf):""}},{"safe-buffer":73}],87:[function(require,module,exports){"use strict";var punycode=require("punycode");var util=require("./util");exports.parse=urlParse;exports.resolve=urlResolve;exports.resolveObject=urlResolveObject;exports.format=urlFormat;exports.Url=Url;function Url(){this.protocol=null;this.slashes=null;this.auth=null;this.host=null;this.port=null;this.hostname=null;this.hash=null;this.search=null;this.query=null;this.pathname=null;this.path=null;this.href=null}var protocolPattern=/^([a-z0-9.+-]+:)/i,portPattern=/:[0-9]*$/,simplePathPattern=/^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,delims=["<",">",'"',"`"," ","\r","\n","\t"],unwise=["{","}","|","\\","^","`"].concat(delims),autoEscape=["'"].concat(unwise),nonHostChars=["%","/","?",";","#"].concat(autoEscape),hostEndingChars=["/","?","#"],hostnameMaxLen=255,hostnamePartPattern=/^[+a-z0-9A-Z_-]{0,63}$/,hostnamePartStart=/^([+a-z0-9A-Z_-]{0,63})(.*)$/,unsafeProtocol={javascript:true,"javascript:":true},hostlessProtocol={javascript:true,"javascript:":true},slashedProtocol={http:true,https:true,ftp:true,gopher:true,file:true,"http:":true,"https:":true,"ftp:":true,"gopher:":true,"file:":true},querystring=require("querystring");function urlParse(url,parseQueryString,slashesDenoteHost){if(url&&util.isObject(url)&&url instanceof Url)return url;var u=new Url;u.parse(url,parseQueryString,slashesDenoteHost);return u}Url.prototype.parse=function(url,parseQueryString,slashesDenoteHost){if(!util.isString(url)){throw new TypeError("Parameter 'url' must be a string, not "+typeof url)}var queryIndex=url.indexOf("?"),splitter=queryIndex!==-1&&queryIndex<url.indexOf("#")?"?":"#",uSplit=url.split(splitter),slashRegex=/\\/g;uSplit[0]=uSplit[0].replace(slashRegex,"/");url=uSplit.join(splitter);var rest=url;rest=rest.trim();if(!slashesDenoteHost&&url.split("#").length===1){var simplePath=simplePathPattern.exec(rest);if(simplePath){this.path=rest;this.href=rest;this.pathname=simplePath[1];if(simplePath[2]){this.search=simplePath[2];if(parseQueryString){this.query=querystring.parse(this.search.substr(1))}else{this.query=this.search.substr(1)}}else if(parseQueryString){this.search="";this.query={}}return this}}var proto=protocolPattern.exec(rest);if(proto){proto=proto[0];var lowerProto=proto.toLowerCase();this.protocol=lowerProto;rest=rest.substr(proto.length)}if(slashesDenoteHost||proto||rest.match(/^\/\/[^@\/]+@[^@\/]+/)){var slashes=rest.substr(0,2)==="//";if(slashes&&!(proto&&hostlessProtocol[proto])){rest=rest.substr(2);this.slashes=true}}if(!hostlessProtocol[proto]&&(slashes||proto&&!slashedProtocol[proto])){var hostEnd=-1;for(var i=0;i<hostEndingChars.length;i++){var hec=rest.indexOf(hostEndingChars[i]);if(hec!==-1&&(hostEnd===-1||hec<hostEnd))hostEnd=hec}var auth,atSign;if(hostEnd===-1){atSign=rest.lastIndexOf("@")}else{atSign=rest.lastIndexOf("@",hostEnd)}if(atSign!==-1){auth=rest.slice(0,atSign);rest=rest.slice(atSign+1);this.auth=decodeURIComponent(auth)}hostEnd=-1;for(var i=0;i<nonHostChars.length;i++){var hec=rest.indexOf(nonHostChars[i]);if(hec!==-1&&(hostEnd===-1||hec<hostEnd))hostEnd=hec}if(hostEnd===-1)hostEnd=rest.length;this.host=rest.slice(0,hostEnd);rest=rest.slice(hostEnd);this.parseHost();this.hostname=this.hostname||"";var ipv6Hostname=this.hostname[0]==="["&&this.hostname[this.hostname.length-1]==="]";if(!ipv6Hostname){var hostparts=this.hostname.split(/\./);for(var i=0,l=hostparts.length;i<l;i++){var part=hostparts[i];if(!part)continue;if(!part.match(hostnamePartPattern)){var newpart="";for(var j=0,k=part.length;j<k;j++){if(part.charCodeAt(j)>127){newpart+="x"}else{newpart+=part[j]}}if(!newpart.match(hostnamePartPattern)){var validParts=hostparts.slice(0,i);var notHost=hostparts.slice(i+1);var bit=part.match(hostnamePartStart);if(bit){validParts.push(bit[1]);notHost.unshift(bit[2])}if(notHost.length){rest="/"+notHost.join(".")+rest}this.hostname=validParts.join(".");break}}}}if(this.hostname.length>hostnameMaxLen){this.hostname=""}else{this.hostname=this.hostname.toLowerCase()}if(!ipv6Hostname){this.hostname=punycode.toASCII(this.hostname)}var p=this.port?":"+this.port:"";var h=this.hostname||"";this.host=h+p;this.href+=this.host;if(ipv6Hostname){this.hostname=this.hostname.substr(1,this.hostname.length-2);if(rest[0]!=="/"){rest="/"+rest}}}if(!unsafeProtocol[lowerProto]){for(var i=0,l=autoEscape.length;i<l;i++){var ae=autoEscape[i];if(rest.indexOf(ae)===-1)continue;var esc=encodeURIComponent(ae);if(esc===ae){esc=escape(ae)}rest=rest.split(ae).join(esc)}}var hash=rest.indexOf("#");if(hash!==-1){this.hash=rest.substr(hash);rest=rest.slice(0,hash)}var qm=rest.indexOf("?");if(qm!==-1){this.search=rest.substr(qm);this.query=rest.substr(qm+1);if(parseQueryString){this.query=querystring.parse(this.query)}rest=rest.slice(0,qm)}else if(parseQueryString){this.search="";this.query={}}if(rest)this.pathname=rest;if(slashedProtocol[lowerProto]&&this.hostname&&!this.pathname){this.pathname="/"}if(this.pathname||this.search){var p=this.pathname||"";var s=this.search||"";this.path=p+s}this.href=this.format();return this};function urlFormat(obj){if(util.isString(obj))obj=urlParse(obj);if(!(obj instanceof Url))return Url.prototype.format.call(obj);return obj.format()}Url.prototype.format=function(){var auth=this.auth||"";if(auth){auth=encodeURIComponent(auth);auth=auth.replace(/%3A/i,":");auth+="@"}var protocol=this.protocol||"",pathname=this.pathname||"",hash=this.hash||"",host=false,query="";if(this.host){host=auth+this.host}else if(this.hostname){host=auth+(this.hostname.indexOf(":")===-1?this.hostname:"["+this.hostname+"]");if(this.port){host+=":"+this.port}}if(this.query&&util.isObject(this.query)&&Object.keys(this.query).length){query=querystring.stringify(this.query)}var search=this.search||query&&"?"+query||"";if(protocol&&protocol.substr(-1)!==":")protocol+=":";if(this.slashes||(!protocol||slashedProtocol[protocol])&&host!==false){host="//"+(host||"");if(pathname&&pathname.charAt(0)!=="/")pathname="/"+pathname}else if(!host){host=""}if(hash&&hash.charAt(0)!=="#")hash="#"+hash;if(search&&search.charAt(0)!=="?")search="?"+search;pathname=pathname.replace(/[?#]/g,function(match){return encodeURIComponent(match)});search=search.replace("#","%23");return protocol+host+pathname+search+hash};function urlResolve(source,relative){return urlParse(source,false,true).resolve(relative)}Url.prototype.resolve=function(relative){return this.resolveObject(urlParse(relative,false,true)).format()};function urlResolveObject(source,relative){if(!source)return relative;return urlParse(source,false,true).resolveObject(relative)}Url.prototype.resolveObject=function(relative){if(util.isString(relative)){var rel=new Url;rel.parse(relative,false,true);relative=rel}var result=new Url;var tkeys=Object.keys(this);for(var tk=0;tk<tkeys.length;tk++){var tkey=tkeys[tk];result[tkey]=this[tkey]}result.hash=relative.hash;if(relative.href===""){result.href=result.format();return result}if(relative.slashes&&!relative.protocol){var rkeys=Object.keys(relative);for(var rk=0;rk<rkeys.length;rk++){var rkey=rkeys[rk];if(rkey!=="protocol")result[rkey]=relative[rkey]}if(slashedProtocol[result.protocol]&&result.hostname&&!result.pathname){result.path=result.pathname="/"}result.href=result.format();return result}if(relative.protocol&&relative.protocol!==result.protocol){if(!slashedProtocol[relative.protocol]){var keys=Object.keys(relative);for(var v=0;v<keys.length;v++){var k=keys[v];result[k]=relative[k]}result.href=result.format();return result}result.protocol=relative.protocol;if(!relative.host&&!hostlessProtocol[relative.protocol]){var relPath=(relative.pathname||"").split("/");while(relPath.length&&!(relative.host=relPath.shift()));if(!relative.host)relative.host="";if(!relative.hostname)relative.hostname="";if(relPath[0]!=="")relPath.unshift("");if(relPath.length<2)relPath.unshift("");result.pathname=relPath.join("/")}else{result.pathname=relative.pathname}result.search=relative.search;result.query=relative.query;result.host=relative.host||"";result.auth=relative.auth;result.hostname=relative.hostname||relative.host;result.port=relative.port;if(result.pathname||result.search){var p=result.pathname||"";var s=result.search||"";result.path=p+s}result.slashes=result.slashes||relative.slashes;result.href=result.format();return result}var isSourceAbs=result.pathname&&result.pathname.charAt(0)==="/",isRelAbs=relative.host||relative.pathname&&relative.pathname.charAt(0)==="/",mustEndAbs=isRelAbs||isSourceAbs||result.host&&relative.pathname,removeAllDots=mustEndAbs,srcPath=result.pathname&&result.pathname.split("/")||[],relPath=relative.pathname&&relative.pathname.split("/")||[],psychotic=result.protocol&&!slashedProtocol[result.protocol];if(psychotic){result.hostname="";result.port=null;if(result.host){if(srcPath[0]==="")srcPath[0]=result.host;else srcPath.unshift(result.host)}result.host="";if(relative.protocol){relative.hostname=null;relative.port=null;if(relative.host){if(relPath[0]==="")relPath[0]=relative.host;else relPath.unshift(relative.host)}relative.host=null}mustEndAbs=mustEndAbs&&(relPath[0]===""||srcPath[0]==="")}if(isRelAbs){result.host=relative.host||relative.host===""?relative.host:result.host;result.hostname=relative.hostname||relative.hostname===""?relative.hostname:result.hostname;result.search=relative.search;result.query=relative.query;srcPath=relPath}else if(relPath.length){if(!srcPath)srcPath=[];srcPath.pop();srcPath=srcPath.concat(relPath);result.search=relative.search;result.query=relative.query}else if(!util.isNullOrUndefined(relative.search)){if(psychotic){result.hostname=result.host=srcPath.shift();var authInHost=result.host&&result.host.indexOf("@")>0?result.host.split("@"):false;if(authInHost){result.auth=authInHost.shift();result.host=result.hostname=authInHost.shift()}}result.search=relative.search;result.query=relative.query;if(!util.isNull(result.pathname)||!util.isNull(result.search)){result.path=(result.pathname?result.pathname:"")+(result.search?result.search:"")}result.href=result.format();return result}if(!srcPath.length){result.pathname=null;if(result.search){result.path="/"+result.search}else{result.path=null}result.href=result.format();return result}var last=srcPath.slice(-1)[0];var hasTrailingSlash=(result.host||relative.host||srcPath.length>1)&&(last==="."||last==="..")||last==="";var up=0;for(var i=srcPath.length;i>=0;i--){last=srcPath[i];if(last==="."){srcPath.splice(i,1)}else if(last===".."){srcPath.splice(i,1);up++}else if(up){srcPath.splice(i,1);up--}}if(!mustEndAbs&&!removeAllDots){for(;up--;up){srcPath.unshift("..")}}if(mustEndAbs&&srcPath[0]!==""&&(!srcPath[0]||srcPath[0].charAt(0)!=="/")){srcPath.unshift("")}if(hasTrailingSlash&&srcPath.join("/").substr(-1)!=="/"){srcPath.push("")}var isAbsolute=srcPath[0]===""||srcPath[0]&&srcPath[0].charAt(0)==="/";if(psychotic){result.hostname=result.host=isAbsolute?"":srcPath.length?srcPath.shift():"";var authInHost=result.host&&result.host.indexOf("@")>0?result.host.split("@"):false;if(authInHost){result.auth=authInHost.shift();result.host=result.hostname=authInHost.shift()}}mustEndAbs=mustEndAbs||result.host&&srcPath.length;if(mustEndAbs&&!isAbsolute){srcPath.unshift("")}if(!srcPath.length){result.pathname=null;result.path=null}else{result.pathname=srcPath.join("/")}if(!util.isNull(result.pathname)||!util.isNull(result.search)){result.path=(result.pathname?result.pathname:"")+(result.search?result.search:"")}result.auth=relative.auth||result.auth;result.slashes=result.slashes||relative.slashes;result.href=result.format();return result};Url.prototype.parseHost=function(){var host=this.host;var port=portPattern.exec(host);if(port){port=port[0];if(port!==":"){this.port=port.substr(1)}host=host.substr(0,host.length-port.length)}if(host)this.hostname=host}},{"./util":88,punycode:69,querystring:72}],88:[function(require,module,exports){"use strict";module.exports={isString:function(arg){return typeof arg==="string"},isObject:function(arg){return typeof arg==="object"&&arg!==null},isNull:function(arg){return arg===null},isNullOrUndefined:function(arg){return arg==null}}},{}],89:[function(require,module,exports){module.exports=extend;var hasOwnProperty=Object.prototype.hasOwnProperty;function extend(){var target={};for(var i=0;i<arguments.length;i++){var source=arguments[i];for(var key in source){if(hasOwnProperty.call(source,key)){target[key]=source[key]}}}return target}},{}]},{},[1])(1)});


var TurndownService = (function () {
'use strict';

function extend (destination) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];
    for (var key in source) {
      if (source.hasOwnProperty(key)) destination[key] = source[key];
    }
  }
  return destination
}

function repeat (character, count) {
  return Array(count + 1).join(character)
}

var blockElements = [
  'address', 'article', 'aside', 'audio', 'blockquote', 'body', 'canvas',
  'center', 'dd', 'dir', 'div', 'dl', 'dt', 'fieldset', 'figcaption',
  'figure', 'footer', 'form', 'frameset', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'header', 'hgroup', 'hr', 'html', 'isindex', 'li', 'main', 'menu', 'nav',
  'noframes', 'noscript', 'ol', 'output', 'p', 'pre', 'section', 'table',
  'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'ul'
];

function isBlock (node) {
  return blockElements.indexOf(node.nodeName.toLowerCase()) !== -1
}

var voidElements = [
  'area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input',
  'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'
];

function isVoid (node) {
  return voidElements.indexOf(node.nodeName.toLowerCase()) !== -1
}

var voidSelector = voidElements.join();
function hasVoid (node) {
  return node.querySelector && node.querySelector(voidSelector)
}

var rules = {};

rules.paragraph = {
  filter: 'p',

  replacement: function (content) {
    return '\n\n' + content + '\n\n'
  }
};

rules.lineBreak = {
  filter: 'br',

  replacement: function (content, node, options) {
    return options.br + '\n'
  }
};

rules.heading = {
  filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],

  replacement: function (content, node, options) {
    var hLevel = Number(node.nodeName.charAt(1));

    if (options.headingStyle === 'setext' && hLevel < 3) {
      var underline = repeat((hLevel === 1 ? '=' : '-'), content.length);
      return (
        '\n\n' + content + '\n' + underline + '\n\n'
      )
    } else {
      return '\n\n' + repeat('#', hLevel) + ' ' + content + '\n\n'
    }
  }
};

rules.blockquote = {
  filter: 'blockquote',

  replacement: function (content) {
    content = content.replace(/^\n+|\n+$/g, '');
    content = content.replace(/^/gm, '> ');
    return '\n\n' + content + '\n\n'
  }
};

rules.list = {
  filter: ['ul', 'ol'],

  replacement: function (content, node) {
    var parent = node.parentNode;
    if (parent.nodeName === 'LI' && parent.lastElementChild === node) {
      return '\n' + content
    } else {
      return '\n\n' + content + '\n\n'
    }
  }
};

rules.listItem = {
  filter: 'li',

  replacement: function (content, node, options) {
    content = content
      .replace(/^\n+/, '') // remove leading newlines
      .replace(/\n+$/, '\n') // replace trailing newlines with just a single one
      .replace(/\n/gm, '\n    '); // indent
    var prefix = options.bulletListMarker + '   ';
    var parent = node.parentNode;
    if (parent.nodeName === 'OL') {
      var start = parent.getAttribute('start');
      var index = Array.prototype.indexOf.call(parent.children, node);
      prefix = (start ? Number(start) + index : index + 1) + '.  ';
    }
    return (
      prefix + content + (node.nextSibling && !/\n$/.test(content) ? '\n' : '')
    )
  }
};

rules.indentedCodeBlock = {
  filter: function (node, options) {
    return (
      options.codeBlockStyle === 'indented' &&
      node.nodeName === 'PRE' &&
      node.firstChild &&
      node.firstChild.nodeName === 'CODE'
    )
  },

  replacement: function (content, node, options) {
    return (
      '\n\n    ' +
      node.firstChild.textContent.replace(/\n/g, '\n    ') +
      '\n\n'
    )
  }
};

rules.fencedCodeBlock = {
  filter: function (node, options) {
    return (
      options.codeBlockStyle === 'fenced' &&
      node.nodeName === 'PRE' &&
      node.firstChild &&
      node.firstChild.nodeName === 'CODE'
    )
  },

  replacement: function (content, node, options) {
    var className = node.firstChild.className || '';
    var language = (className.match(/language-(\S+)/) || [null, ''])[1];

    return (
      '\n\n' + options.fence + language + '\n' +
      node.firstChild.textContent +
      '\n' + options.fence + '\n\n'
    )
  }
};

rules.horizontalRule = {
  filter: 'hr',

  replacement: function (content, node, options) {
    return '\n\n' + options.hr + '\n\n'
  }
};

rules.inlineLink = {
  filter: function (node, options) {
    return (
      options.linkStyle === 'inlined' &&
      node.nodeName === 'A' &&
      node.getAttribute('href')
    )
  },

  replacement: function (content, node) {
    var href = node.getAttribute('href');
    var title = node.title ? ' "' + node.title + '"' : '';
    return '[' + content + '](' + href + title + ')'
  }
};

rules.referenceLink = {
  filter: function (node, options) {
    return (
      options.linkStyle === 'referenced' &&
      node.nodeName === 'A' &&
      node.getAttribute('href')
    )
  },

  replacement: function (content, node, options) {
    var href = node.getAttribute('href');
    var title = node.title ? ' "' + node.title + '"' : '';
    var replacement;
    var reference;

    switch (options.linkReferenceStyle) {
      case 'collapsed':
        replacement = '[' + content + '][]';
        reference = '[' + content + ']: ' + href + title;
        break
      case 'shortcut':
        replacement = '[' + content + ']';
        reference = '[' + content + ']: ' + href + title;
        break
      default:
        var id = this.references.length + 1;
        replacement = '[' + content + '][' + id + ']';
        reference = '[' + id + ']: ' + href + title;
    }

    this.references.push(reference);
    return replacement
  },

  references: [],

  append: function (options) {
    var references = '';
    if (this.references.length) {
      references = '\n\n' + this.references.join('\n') + '\n\n';
      this.references = []; // Reset references
    }
    return references
  }
};

rules.emphasis = {
  filter: ['em', 'i'],

  replacement: function (content, node, options) {
    if (!content.trim()) return ''
    return options.emDelimiter + content + options.emDelimiter
  }
};

rules.strong = {
  filter: ['strong', 'b'],

  replacement: function (content, node, options) {
    if (!content.trim()) return ''
    return options.strongDelimiter + content + options.strongDelimiter
  }
};

rules.code = {
  filter: function (node) {
    var hasSiblings = node.previousSibling || node.nextSibling;
    var isCodeBlock = node.parentNode.nodeName === 'PRE' && !hasSiblings;

    return node.nodeName === 'CODE' && !isCodeBlock
  },

  replacement: function (content) {
    if (!content.trim()) return ''

    var delimiter = '`';
    var leadingSpace = '';
    var trailingSpace = '';
    var matches = content.match(/`+/gm);
    if (matches) {
      if (/^`/.test(content)) leadingSpace = ' ';
      if (/`$/.test(content)) trailingSpace = ' ';
      while (matches.indexOf(delimiter) !== -1) delimiter = delimiter + '`';
    }

    return delimiter + leadingSpace + content + trailingSpace + delimiter
  }
};

rules.image = {
  filter: 'img',

  replacement: function (content, node) {
    var alt = node.alt || '';
    var src = node.getAttribute('src') || '';
    var title = node.title || '';
    var titlePart = title ? ' "' + title + '"' : '';
    return src ? '![' + alt + ']' + '(' + src + titlePart + ')' : ''
  }
};

/**
 * Manages a collection of rules used to convert HTML to Markdown
 */

function Rules (options) {
  this.options = options;
  this._keep = [];
  this._remove = [];

  this.blankRule = {
    replacement: options.blankReplacement
  };

  this.keepReplacement = options.keepReplacement;

  this.defaultRule = {
    replacement: options.defaultReplacement
  };

  this.array = [];
  for (var key in options.rules) this.array.push(options.rules[key]);
}

Rules.prototype = {
  add: function (key, rule) {
    this.array.unshift(rule);
  },

  keep: function (filter) {
    this._keep.unshift({
      filter: filter,
      replacement: this.keepReplacement
    });
  },

  remove: function (filter) {
    this._remove.unshift({
      filter: filter,
      replacement: function () {
        return ''
      }
    });
  },

  forNode: function (node) {
    if (node.isBlank) return this.blankRule
    var rule;

    if ((rule = findRule(this.array, node, this.options))) return rule
    if ((rule = findRule(this._keep, node, this.options))) return rule
    if ((rule = findRule(this._remove, node, this.options))) return rule

    return this.defaultRule
  },

  forEach: function (fn) {
    for (var i = 0; i < this.array.length; i++) fn(this.array[i], i);
  }
};

function findRule (rules, node, options) {
  for (var i = 0; i < rules.length; i++) {
    var rule = rules[i];
    if (filterValue(rule, node, options)) return rule
  }
  return void 0
}

function filterValue (rule, node, options) {
  var filter = rule.filter;
  if (typeof filter === 'string') {
    if (filter === node.nodeName.toLowerCase()) return true
  } else if (Array.isArray(filter)) {
    if (filter.indexOf(node.nodeName.toLowerCase()) > -1) return true
  } else if (typeof filter === 'function') {
    if (filter.call(rule, node, options)) return true
  } else {
    throw new TypeError('`filter` needs to be a string, array, or function')
  }
}

/**
 * The collapseWhitespace function is adapted from collapse-whitespace
 * by Luc Thevenard.
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Luc Thevenard <lucthevenard@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * collapseWhitespace(options) removes extraneous whitespace from an the given element.
 *
 * @param {Object} options
 */
function collapseWhitespace (options) {
  var element = options.element;
  var isBlock = options.isBlock;
  var isVoid = options.isVoid;
  var isPre = options.isPre || function (node) {
    return node.nodeName === 'PRE'
  };

  if (!element.firstChild || isPre(element)) return

  var prevText = null;
  var prevVoid = false;

  var prev = null;
  var node = next(prev, element, isPre);

  while (node !== element) {
    if (node.nodeType === 3 || node.nodeType === 4) { // Node.TEXT_NODE or Node.CDATA_SECTION_NODE
      var text = node.data.replace(/[ \r\n\t]+/g, ' ');

      if ((!prevText || / $/.test(prevText.data)) &&
          !prevVoid && text[0] === ' ') {
        text = text.substr(1);
      }

      // `text` might be empty at this point.
      if (!text) {
        node = remove(node);
        continue
      }

      node.data = text;

      prevText = node;
    } else if (node.nodeType === 1) { // Node.ELEMENT_NODE
      if (isBlock(node) || node.nodeName === 'BR') {
        if (prevText) {
          prevText.data = prevText.data.replace(/ $/, '');
        }

        prevText = null;
        prevVoid = false;
      } else if (isVoid(node)) {
        // Avoid trimming space around non-block, non-BR void elements.
        prevText = null;
        prevVoid = true;
      }
    } else {
      node = remove(node);
      continue
    }

    var nextNode = next(prev, node, isPre);
    prev = node;
    node = nextNode;
  }

  if (prevText) {
    prevText.data = prevText.data.replace(/ $/, '');
    if (!prevText.data) {
      remove(prevText);
    }
  }
}

/**
 * remove(node) removes the given node from the DOM and returns the
 * next node in the sequence.
 *
 * @param {Node} node
 * @return {Node} node
 */
function remove (node) {
  var next = node.nextSibling || node.parentNode;

  node.parentNode.removeChild(node);

  return next
}

/**
 * next(prev, current, isPre) returns the next node in the sequence, given the
 * current and previous nodes.
 *
 * @param {Node} prev
 * @param {Node} current
 * @param {Function} isPre
 * @return {Node}
 */
function next (prev, current, isPre) {
  if ((prev && prev.parentNode === current) || isPre(current)) {
    return current.nextSibling || current.parentNode
  }

  return current.firstChild || current.nextSibling || current.parentNode
}

/*
 * Set up window for Node.js
 */

var root = (typeof window !== 'undefined' ? window : {});

/*
 * Parsing HTML strings
 */

function canParseHTMLNatively () {
  var Parser = root.DOMParser;
  var canParse = false;

  // Adapted from https://gist.github.com/1129031
  // Firefox/Opera/IE throw errors on unsupported types
  try {
    // WebKit returns null on unsupported types
    if (new Parser().parseFromString('', 'text/html')) {
      canParse = true;
    }
  } catch (e) {}

  return canParse
}

function createHTMLParser () {
  var Parser = function () {};

  {
    if (shouldUseActiveX()) {
      Parser.prototype.parseFromString = function (string) {
        var doc = new window.ActiveXObject('htmlfile');
        doc.designMode = 'on'; // disable on-page scripts
        doc.open();
        doc.write(string);
        doc.close();
        return doc
      };
    } else {
      Parser.prototype.parseFromString = function (string) {
        var doc = document.implementation.createHTMLDocument('');
        doc.open();
        doc.write(string);
        doc.close();
        return doc
      };
    }
  }
  return Parser
}

function shouldUseActiveX () {
  var useActiveX = false;
  try {
    document.implementation.createHTMLDocument('').open();
  } catch (e) {
    if (window.ActiveXObject) useActiveX = true;
  }
  return useActiveX
}

var HTMLParser = canParseHTMLNatively() ? root.DOMParser : createHTMLParser();

function RootNode (input) {
  var root;
  if (typeof input === 'string') {
    var doc = htmlParser().parseFromString(
      // DOM parsers arrange elements in the <head> and <body>.
      // Wrapping in a custom element ensures elements are reliably arranged in
      // a single element.
      '<x-turndown id="turndown-root">' + input + '</x-turndown>',
      'text/html'
    );
    root = doc.getElementById('turndown-root');
  } else {
    root = input.cloneNode(true);
  }
  collapseWhitespace({
    element: root,
    isBlock: isBlock,
    isVoid: isVoid
  });

  return root
}

var _htmlParser;
function htmlParser () {
  _htmlParser = _htmlParser || new HTMLParser();
  return _htmlParser
}

function Node (node) {
  node.isBlock = isBlock(node);
  node.isCode = node.nodeName.toLowerCase() === 'code' || node.parentNode.isCode;
  node.isBlank = isBlank(node);
  node.flankingWhitespace = flankingWhitespace(node);
  return node
}

function isBlank (node) {
  return (
    ['A', 'TH', 'TD'].indexOf(node.nodeName) === -1 &&
    /^\s*$/i.test(node.textContent) &&
    !isVoid(node) &&
    !hasVoid(node)
  )
}

function flankingWhitespace (node) {
  var leading = '';
  var trailing = '';

  if (!node.isBlock) {
    var hasLeading = /^[ \r\n\t]/.test(node.textContent);
    var hasTrailing = /[ \r\n\t]$/.test(node.textContent);

    if (hasLeading && !isFlankedByWhitespace('left', node)) {
      leading = ' ';
    }
    if (hasTrailing && !isFlankedByWhitespace('right', node)) {
      trailing = ' ';
    }
  }

  return { leading: leading, trailing: trailing }
}

function isFlankedByWhitespace (side, node) {
  var sibling;
  var regExp;
  var isFlanked;

  if (side === 'left') {
    sibling = node.previousSibling;
    regExp = / $/;
  } else {
    sibling = node.nextSibling;
    regExp = /^ /;
  }

  if (sibling) {
    if (sibling.nodeType === 3) {
      isFlanked = regExp.test(sibling.nodeValue);
    } else if (sibling.nodeType === 1 && !isBlock(sibling)) {
      isFlanked = regExp.test(sibling.textContent);
    }
  }
  return isFlanked
}

var reduce = Array.prototype.reduce;
var leadingNewLinesRegExp = /^\n*/;
var trailingNewLinesRegExp = /\n*$/;

function TurndownService (options) {
  if (!(this instanceof TurndownService)) return new TurndownService(options)

  var defaults = {
    rules: rules,
    headingStyle: 'setext',
    hr: '* * *',
    bulletListMarker: '*',
    codeBlockStyle: 'indented',
    fence: '```',
    emDelimiter: '_',
    strongDelimiter: '**',
    linkStyle: 'inlined',
    linkReferenceStyle: 'full',
    br: '  ',
    blankReplacement: function (content, node) {
      return node.isBlock ? '\n\n' : ''
    },
    keepReplacement: function (content, node) {
      return node.isBlock ? '\n\n' + node.outerHTML + '\n\n' : node.outerHTML
    },
    defaultReplacement: function (content, node) {
      return node.isBlock ? '\n\n' + content + '\n\n' : content
    }
  };
  this.options = extend({}, defaults, options);
  this.rules = new Rules(this.options);
}

TurndownService.prototype = {
  /**
   * The entry point for converting a string or DOM node to Markdown
   * @public
   * @param {String|HTMLElement} input The string or DOM node to convert
   * @returns A Markdown representation of the input
   * @type String
   */

  turndown: function (input) {
    if (!canConvert(input)) {
      throw new TypeError(
        input + ' is not a string, or an element/document/fragment node.'
      )
    }

    if (input === '') return ''

    var output = process.call(this, new RootNode(input));
    return postProcess.call(this, output)
  },

  /**
   * Add one or more plugins
   * @public
   * @param {Function|Array} plugin The plugin or array of plugins to add
   * @returns The Turndown instance for chaining
   * @type Object
   */

  use: function (plugin) {
    if (Array.isArray(plugin)) {
      for (var i = 0; i < plugin.length; i++) this.use(plugin[i]);
    } else if (typeof plugin === 'function') {
      plugin(this);
    } else {
      throw new TypeError('plugin must be a Function or an Array of Functions')
    }
    return this
  },

  /**
   * Adds a rule
   * @public
   * @param {String} key The unique key of the rule
   * @param {Object} rule The rule
   * @returns The Turndown instance for chaining
   * @type Object
   */

  addRule: function (key, rule) {
    this.rules.add(key, rule);
    return this
  },

  /**
   * Keep a node (as HTML) that matches the filter
   * @public
   * @param {String|Array|Function} filter The unique key of the rule
   * @returns The Turndown instance for chaining
   * @type Object
   */

  keep: function (filter) {
    this.rules.keep(filter);
    return this
  },

  /**
   * Remove a node that matches the filter
   * @public
   * @param {String|Array|Function} filter The unique key of the rule
   * @returns The Turndown instance for chaining
   * @type Object
   */

  remove: function (filter) {
    this.rules.remove(filter);
    return this
  },

  /**
   * Escapes Markdown syntax
   * @public
   * @param {String} string The string to escape
   * @returns A string with Markdown syntax escaped
   * @type String
   */

  escape: function (string) {
    return (
      string
        // Escape backslash escapes!
        .replace(/\\(\S)/g, '\\\\$1')

        // Escape headings
        .replace(/^(#{1,6} )/gm, '\\$1')

        // Escape hr
        .replace(/^([-*_] *){3,}$/gm, function (match, character) {
          return match.split(character).join('\\' + character)
        })

        // Escape ol bullet points
        .replace(/^(\W* {0,3})(\d+)\. /gm, '$1$2\\. ')

        // Escape ul bullet points
        .replace(/^([^\\\w]*)[*+-] /gm, function (match) {
          return match.replace(/([*+-])/g, '\\$1')
        })

        // Escape blockquote indents
        .replace(/^(\W* {0,3})> /gm, '$1\\> ')

        // Escape em/strong *
        .replace(/\*+(?![*\s\W]).+?\*+/g, function (match) {
          return match.replace(/\*/g, '\\*')
        })

        // Escape em/strong _
        .replace(/_+(?![_\s\W]).+?_+/g, function (match) {
          return match.replace(/_/g, '\\_')
        })

        // Escape code _
        .replace(/`+(?![`\s\W]).+?`+/g, function (match) {
          return match.replace(/`/g, '\\`')
        })

        // Escape link brackets
        .replace(/[\[\]]/g, '\\$&') // eslint-disable-line no-useless-escape
    )
  }
};

/**
 * Reduces a DOM node down to its Markdown string equivalent
 * @private
 * @param {HTMLElement} parentNode The node to convert
 * @returns A Markdown representation of the node
 * @type String
 */

function process (parentNode) {
  var self = this;
  return reduce.call(parentNode.childNodes, function (output, node) {
    node = new Node(node);

    var replacement = '';
    if (node.nodeType === 3) {
      replacement = node.isCode ? node.nodeValue : self.escape(node.nodeValue);
    } else if (node.nodeType === 1) {
      replacement = replacementForNode.call(self, node);
    }

    return join(output, replacement)
  }, '')
}

/**
 * Appends strings as each rule requires and trims the output
 * @private
 * @param {String} output The conversion output
 * @returns A trimmed version of the ouput
 * @type String
 */

function postProcess (output) {
  var self = this;
  this.rules.forEach(function (rule) {
    if (typeof rule.append === 'function') {
      output = join(output, rule.append(self.options));
    }
  });

  return output.replace(/^[\t\r\n]+/, '').replace(/[\t\r\n\s]+$/, '')
}

/**
 * Converts an element node to its Markdown equivalent
 * @private
 * @param {HTMLElement} node The node to convert
 * @returns A Markdown representation of the node
 * @type String
 */

function replacementForNode (node) {
  var rule = this.rules.forNode(node);
  var content = process.call(this, node);
  var whitespace = node.flankingWhitespace;
  if (whitespace.leading || whitespace.trailing) content = content.trim();
  return (
    whitespace.leading +
    rule.replacement(content, node, this.options) +
    whitespace.trailing
  )
}

/**
 * Determines the new lines between the current output and the replacement
 * @private
 * @param {String} output The current conversion output
 * @param {String} replacement The string to append to the output
 * @returns The whitespace to separate the current output and the replacement
 * @type String
 */

function separatingNewlines (output, replacement) {
  var newlines = [
    output.match(trailingNewLinesRegExp)[0],
    replacement.match(leadingNewLinesRegExp)[0]
  ].sort();
  var maxNewlines = newlines[newlines.length - 1];
  return maxNewlines.length < 2 ? maxNewlines : '\n\n'
}

function join (string1, string2) {
  var separator = separatingNewlines(string1, string2);

  // Remove trailing/leading newlines and replace with separator
  string1 = string1.replace(trailingNewLinesRegExp, '');
  string2 = string2.replace(leadingNewLinesRegExp, '');

  return string1 + separator + string2
}

/**
 * Determines whether an input can be converted
 * @private
 * @param {String|HTMLElement} input Describe this parameter
 * @returns Describe what it returns
 * @type String|Object|Array|Boolean|Number
 */

function canConvert (input) {
  return (
    input != null && (
      typeof input === 'string' ||
      (input.nodeType && (
        input.nodeType === 1 || input.nodeType === 9 || input.nodeType === 11
      ))
    )
  )
}

return TurndownService;

}());


/**
 * marked - a markdown parser
 * Copyright (c) 2011-2018, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/markedjs/marked
 */

;(function(root) {
'use strict';

/**
 * Block-Level Grammar
 */

var block = {
  newline: /^\n+/,
  code: /^( {4}[^\n]+\n*)+/,
  fences: noop,
  hr: /^ {0,3}((?:- *){3,}|(?:_ *){3,}|(?:\* *){3,})(?:\n+|$)/,
  heading: /^ *(#{1,6}) *([^\n]+?) *(?:#+ *)?(?:\n+|$)/,
  nptable: noop,
  blockquote: /^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/,
  list: /^( {0,3})(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
  html: '^ {0,3}(?:' // optional indentation
    + '<(script|pre|style)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)' // (1)
    + '|comment[^\\n]*(\\n+|$)' // (2)
    + '|<\\?[\\s\\S]*?\\?>\\n*' // (3)
    + '|<![A-Z][\\s\\S]*?>\\n*' // (4)
    + '|<!\\[CDATA\\[[\\s\\S]*?\\]\\]>\\n*' // (5)
    + '|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:\\n{2,}|$)' // (6)
    + '|<(?!script|pre|style)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:\\n{2,}|$)' // (7) open tag
    + '|</(?!script|pre|style)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:\\n{2,}|$)' // (7) closing tag
    + ')',
  def: /^ {0,3}\[(label)\]: *\n? *<?([^\s>]+)>?(?:(?: +\n? *| *\n *)(title))? *(?:\n+|$)/,
  table: noop,
  lheading: /^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,
  paragraph: /^([^\n]+(?:\n(?!hr|heading|lheading| {0,3}>|<\/?(?:tag)(?: +|\n|\/?>)|<(?:script|pre|style|!--))[^\n]+)*)/,
  text: /^[^\n]+/
};

block._label = /(?!\s*\])(?:\\[\[\]]|[^\[\]])+/;
block._title = /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/;
block.def = edit(block.def)
  .replace('label', block._label)
  .replace('title', block._title)
  .getRegex();

block.bullet = /(?:[*+-]|\d{1,9}\.)/;
block.item = /^( *)(bull) ?[^\n]*(?:\n(?!\1bull ?)[^\n]*)*/;
block.item = edit(block.item, 'gm')
  .replace(/bull/g, block.bullet)
  .getRegex();

block.list = edit(block.list)
  .replace(/bull/g, block.bullet)
  .replace('hr', '\\n+(?=\\1?(?:(?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$))')
  .replace('def', '\\n+(?=' + block.def.source + ')')
  .getRegex();

block._tag = 'address|article|aside|base|basefont|blockquote|body|caption'
  + '|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption'
  + '|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe'
  + '|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option'
  + '|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr'
  + '|track|ul';
block._comment = /<!--(?!-?>)[\s\S]*?-->/;
block.html = edit(block.html, 'i')
  .replace('comment', block._comment)
  .replace('tag', block._tag)
  .replace('attribute', / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/)
  .getRegex();

block.paragraph = edit(block.paragraph)
  .replace('hr', block.hr)
  .replace('heading', block.heading)
  .replace('lheading', block.lheading)
  .replace('tag', block._tag) // pars can be interrupted by type (6) html blocks
  .getRegex();

block.blockquote = edit(block.blockquote)
  .replace('paragraph', block.paragraph)
  .getRegex();

/**
 * Normal Block Grammar
 */

block.normal = merge({}, block);

/**
 * GFM Block Grammar
 */

block.gfm = merge({}, block.normal, {
  fences: /^ {0,3}(`{3,}|~{3,})([^`\n]*)\n(?:|([\s\S]*?)\n)(?: {0,3}\1[~`]* *(?:\n+|$)|$)/,
  paragraph: /^/,
  heading: /^ *(#{1,6}) +([^\n]+?) *#* *(?:\n+|$)/
});

block.gfm.paragraph = edit(block.paragraph)
  .replace('(?!', '(?!'
    + block.gfm.fences.source.replace('\\1', '\\2') + '|'
    + block.list.source.replace('\\1', '\\3') + '|')
  .getRegex();

/**
 * GFM + Tables Block Grammar
 */

block.tables = merge({}, block.gfm, {
  nptable: /^ *([^|\n ].*\|.*)\n *([-:]+ *\|[-| :]*)(?:\n((?:.*[^>\n ].*(?:\n|$))*)\n*|$)/,
  table: /^ *\|(.+)\n *\|?( *[-:]+[-| :]*)(?:\n((?: *[^>\n ].*(?:\n|$))*)\n*|$)/
});

/**
 * Pedantic grammar
 */

block.pedantic = merge({}, block.normal, {
  html: edit(
    '^ *(?:comment *(?:\\n|\\s*$)'
    + '|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)' // closed tag
    + '|<tag(?:"[^"]*"|\'[^\']*\'|\\s[^\'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))')
    .replace('comment', block._comment)
    .replace(/tag/g, '(?!(?:'
      + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub'
      + '|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)'
      + '\\b)\\w+(?!:|[^\\w\\s@]*@)\\b')
    .getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/
});

/**
 * Block Lexer
 */

function Lexer(options) {
  this.tokens = [];
  this.tokens.links = Object.create(null);
  this.options = options || marked.defaults;
  this.rules = block.normal;

  if (this.options.pedantic) {
    this.rules = block.pedantic;
  } else if (this.options.gfm) {
    if (this.options.tables) {
      this.rules = block.tables;
    } else {
      this.rules = block.gfm;
    }
  }
}

/**
 * Expose Block Rules
 */

Lexer.rules = block;

/**
 * Static Lex Method
 */

Lexer.lex = function(src, options) {
  var lexer = new Lexer(options);
  return lexer.lex(src);
};

/**
 * Preprocessing
 */

Lexer.prototype.lex = function(src) {
  src = src
    .replace(/\r\n|\r/g, '\n')
    .replace(/\t/g, '    ')
    .replace(/\u00a0/g, ' ')
    .replace(/\u2424/g, '\n');

  return this.token(src, true);
};

/**
 * Lexing
 */

Lexer.prototype.token = function(src, top) {
  src = src.replace(/^ +$/gm, '');
  var next,
      loose,
      cap,
      bull,
      b,
      item,
      listStart,
      listItems,
      t,
      space,
      i,
      tag,
      l,
      isordered,
      istask,
      ischecked;

  while (src) {
    // newline
    if (cap = this.rules.newline.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[0].length > 1) {
        this.tokens.push({
          type: 'space'
        });
      }
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      cap = cap[0].replace(/^ {4}/gm, '');
      this.tokens.push({
        type: 'code',
        text: !this.options.pedantic
          ? rtrim(cap, '\n')
          : cap
      });
      continue;
    }

    // fences (gfm)
    if (cap = this.rules.fences.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'code',
        lang: cap[2] ? cap[2].trim() : cap[2],
        text: cap[3] || ''
      });
      continue;
    }

    // heading
    if (cap = this.rules.heading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[1].length,
        text: cap[2]
      });
      continue;
    }

    // table no leading pipe (gfm)
    if (cap = this.rules.nptable.exec(src)) {
      item = {
        type: 'table',
        header: splitCells(cap[1].replace(/^ *| *\| *$/g, '')),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3] ? cap[3].replace(/\n$/, '').split('\n') : []
      };

      if (item.header.length === item.align.length) {
        src = src.substring(cap[0].length);

        for (i = 0; i < item.align.length; i++) {
          if (/^ *-+: *$/.test(item.align[i])) {
            item.align[i] = 'right';
          } else if (/^ *:-+: *$/.test(item.align[i])) {
            item.align[i] = 'center';
          } else if (/^ *:-+ *$/.test(item.align[i])) {
            item.align[i] = 'left';
          } else {
            item.align[i] = null;
          }
        }

        for (i = 0; i < item.cells.length; i++) {
          item.cells[i] = splitCells(item.cells[i], item.header.length);
        }

        this.tokens.push(item);

        continue;
      }
    }

    // hr
    if (cap = this.rules.hr.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'hr'
      });
      continue;
    }

    // blockquote
    if (cap = this.rules.blockquote.exec(src)) {
      src = src.substring(cap[0].length);

      this.tokens.push({
        type: 'blockquote_start'
      });

      cap = cap[0].replace(/^ *> ?/gm, '');

      // Pass `top` to keep the current
      // "toplevel" state. This is exactly
      // how markdown.pl works.
      this.token(cap, top);

      this.tokens.push({
        type: 'blockquote_end'
      });

      continue;
    }

    // list
    if (cap = this.rules.list.exec(src)) {
      src = src.substring(cap[0].length);
      bull = cap[2];
      isordered = bull.length > 1;

      listStart = {
        type: 'list_start',
        ordered: isordered,
        start: isordered ? +bull : '',
        loose: false
      };

      this.tokens.push(listStart);

      // Get each top-level item.
      cap = cap[0].match(this.rules.item);

      listItems = [];
      next = false;
      l = cap.length;
      i = 0;

      for (; i < l; i++) {
        item = cap[i];

        // Remove the list item's bullet
        // so it is seen as the next token.
        space = item.length;
        item = item.replace(/^ *([*+-]|\d+\.) */, '');

        // Outdent whatever the
        // list item contains. Hacky.
        if (~item.indexOf('\n ')) {
          space -= item.length;
          item = !this.options.pedantic
            ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '')
            : item.replace(/^ {1,4}/gm, '');
        }

        // Determine whether the next list item belongs here.
        // Backpedal if it does not belong in this list.
        if (i !== l - 1) {
          b = block.bullet.exec(cap[i + 1])[0];
          if (bull.length > 1 ? b.length === 1
            : (b.length > 1 || (this.options.smartLists && b !== bull))) {
            src = cap.slice(i + 1).join('\n') + src;
            i = l - 1;
          }
        }

        // Determine whether item is loose or not.
        // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
        // for discount behavior.
        loose = next || /\n\n(?!\s*$)/.test(item);
        if (i !== l - 1) {
          next = item.charAt(item.length - 1) === '\n';
          if (!loose) loose = next;
        }

        if (loose) {
          listStart.loose = true;
        }

        // Check for task list items
        istask = /^\[[ xX]\] /.test(item);
        ischecked = undefined;
        if (istask) {
          ischecked = item[1] !== ' ';
          item = item.replace(/^\[[ xX]\] +/, '');
        }

        t = {
          type: 'list_item_start',
          task: istask,
          checked: ischecked,
          loose: loose
        };

        listItems.push(t);
        this.tokens.push(t);

        // Recurse.
        this.token(item, false);

        this.tokens.push({
          type: 'list_item_end'
        });
      }

      if (listStart.loose) {
        l = listItems.length;
        i = 0;
        for (; i < l; i++) {
          listItems[i].loose = true;
        }
      }

      this.tokens.push({
        type: 'list_end'
      });

      continue;
    }

    // html
    if (cap = this.rules.html.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: this.options.sanitize
          ? 'paragraph'
          : 'html',
        pre: !this.options.sanitizer
          && (cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style'),
        text: cap[0]
      });
      continue;
    }

    // def
    if (top && (cap = this.rules.def.exec(src))) {
      src = src.substring(cap[0].length);
      if (cap[3]) cap[3] = cap[3].substring(1, cap[3].length - 1);
      tag = cap[1].toLowerCase().replace(/\s+/g, ' ');
      if (!this.tokens.links[tag]) {
        this.tokens.links[tag] = {
          href: cap[2],
          title: cap[3]
        };
      }
      continue;
    }

    // table (gfm)
    if (cap = this.rules.table.exec(src)) {
      item = {
        type: 'table',
        header: splitCells(cap[1].replace(/^ *| *\| *$/g, '')),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3] ? cap[3].replace(/\n$/, '').split('\n') : []
      };

      if (item.header.length === item.align.length) {
        src = src.substring(cap[0].length);

        for (i = 0; i < item.align.length; i++) {
          if (/^ *-+: *$/.test(item.align[i])) {
            item.align[i] = 'right';
          } else if (/^ *:-+: *$/.test(item.align[i])) {
            item.align[i] = 'center';
          } else if (/^ *:-+ *$/.test(item.align[i])) {
            item.align[i] = 'left';
          } else {
            item.align[i] = null;
          }
        }

        for (i = 0; i < item.cells.length; i++) {
          item.cells[i] = splitCells(
            item.cells[i].replace(/^ *\| *| *\| *$/g, ''),
            item.header.length);
        }

        this.tokens.push(item);

        continue;
      }
    }

    // lheading
    if (cap = this.rules.lheading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[2] === '=' ? 1 : 2,
        text: cap[1]
      });
      continue;
    }

    // top-level paragraph
    if (top && (cap = this.rules.paragraph.exec(src))) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'paragraph',
        text: cap[1].charAt(cap[1].length - 1) === '\n'
          ? cap[1].slice(0, -1)
          : cap[1]
      });
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      // Top-level should never reach here.
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'text',
        text: cap[0]
      });
      continue;
    }

    if (src) {
      throw new Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return this.tokens;
};

/**
 * Inline-Level Grammar
 */

var inline = {
  escape: /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
  autolink: /^<(scheme:[^\s\x00-\x1f<>]*|email)>/,
  url: noop,
  tag: '^comment'
    + '|^</[a-zA-Z][\\w:-]*\\s*>' // self-closing tag
    + '|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>' // open tag
    + '|^<\\?[\\s\\S]*?\\?>' // processing instruction, e.g. <?php ?>
    + '|^<![a-zA-Z]+\\s[\\s\\S]*?>' // declaration, e.g. <!DOCTYPE html>
    + '|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>', // CDATA section
  link: /^!?\[(label)\]\(href(?:\s+(title))?\s*\)/,
  reflink: /^!?\[(label)\]\[(?!\s*\])((?:\\[\[\]]?|[^\[\]\\])+)\]/,
  nolink: /^!?\[(?!\s*\])((?:\[[^\[\]]*\]|\\[\[\]]|[^\[\]])*)\](?:\[\])?/,
  strong: /^__([^\s_])__(?!_)|^\*\*([^\s*])\*\*(?!\*)|^__([^\s][\s\S]*?[^\s])__(?!_)|^\*\*([^\s][\s\S]*?[^\s])\*\*(?!\*)/,
  em: /^_([^\s_])_(?!_)|^\*([^\s*"<\[])\*(?!\*)|^_([^\s][\s\S]*?[^\s_])_(?!_|[^\spunctuation])|^_([^\s_][\s\S]*?[^\s])_(?!_|[^\spunctuation])|^\*([^\s"<\[][\s\S]*?[^\s*])\*(?!\*)|^\*([^\s*"<\[][\s\S]*?[^\s])\*(?!\*)/,
  code: /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,
  br: /^( {2,}|\\)\n(?!\s*$)/,
  del: noop,
  text: /^(`+|[^`])(?:[\s\S]*?(?:(?=[\\<!\[`*]|\b_|$)|[^ ](?= {2,}\n))|(?= {2,}\n))/
};

// list of punctuation marks from common mark spec
// without ` and ] to workaround Rule 17 (inline code blocks/links)
inline._punctuation = '!"#$%&\'()*+,\\-./:;<=>?@\\[^_{|}~';
inline.em = edit(inline.em).replace(/punctuation/g, inline._punctuation).getRegex();

inline._escapes = /\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/g;

inline._scheme = /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/;
inline._email = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/;
inline.autolink = edit(inline.autolink)
  .replace('scheme', inline._scheme)
  .replace('email', inline._email)
  .getRegex();

inline._attribute = /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/;

inline.tag = edit(inline.tag)
  .replace('comment', block._comment)
  .replace('attribute', inline._attribute)
  .getRegex();

inline._label = /(?:\[[^\[\]]*\]|\\[\[\]]?|`[^`]*`|`(?!`)|[^\[\]\\`])*?/;
inline._href = /\s*(<(?:\\[<>]?|[^\s<>\\])*>|[^\s\x00-\x1f]*)/;
inline._title = /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/;

inline.link = edit(inline.link)
  .replace('label', inline._label)
  .replace('href', inline._href)
  .replace('title', inline._title)
  .getRegex();

inline.reflink = edit(inline.reflink)
  .replace('label', inline._label)
  .getRegex();

/**
 * Normal Inline Grammar
 */

inline.normal = merge({}, inline);

/**
 * Pedantic Inline Grammar
 */

inline.pedantic = merge({}, inline.normal, {
  strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
  em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/,
  link: edit(/^!?\[(label)\]\((.*?)\)/)
    .replace('label', inline._label)
    .getRegex(),
  reflink: edit(/^!?\[(label)\]\s*\[([^\]]*)\]/)
    .replace('label', inline._label)
    .getRegex()
});

/**
 * GFM Inline Grammar
 */

inline.gfm = merge({}, inline.normal, {
  escape: edit(inline.escape).replace('])', '~|])').getRegex(),
  _extended_email: /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/,
  url: /^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/,
  _backpedal: /(?:[^?!.,:;*_~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_~)]+(?!$))+/,
  del: /^~+(?=\S)([\s\S]*?\S)~+/,
  text: /^(`+|[^`])(?:[\s\S]*?(?:(?=[\\<!\[`*~]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@))|(?= {2,}\n|[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@))/
});

inline.gfm.url = edit(inline.gfm.url, 'i')
  .replace('email', inline.gfm._extended_email)
  .getRegex();
/**
 * GFM + Line Breaks Inline Grammar
 */

inline.breaks = merge({}, inline.gfm, {
  br: edit(inline.br).replace('{2,}', '*').getRegex(),
  text: edit(inline.gfm.text).replace(/\{2,\}/g, '*').getRegex()
});

/**
 * Inline Lexer & Compiler
 */

function InlineLexer(links, options) {
  this.options = options || marked.defaults;
  this.links = links;
  this.rules = inline.normal;
  this.renderer = this.options.renderer || new Renderer();
  this.renderer.options = this.options;

  if (!this.links) {
    throw new Error('Tokens array requires a `links` property.');
  }

  if (this.options.pedantic) {
    this.rules = inline.pedantic;
  } else if (this.options.gfm) {
    if (this.options.breaks) {
      this.rules = inline.breaks;
    } else {
      this.rules = inline.gfm;
    }
  }
}

/**
 * Expose Inline Rules
 */

InlineLexer.rules = inline;

/**
 * Static Lexing/Compiling Method
 */

InlineLexer.output = function(src, links, options) {
  var inline = new InlineLexer(links, options);
  return inline.output(src);
};

/**
 * Lexing/Compiling
 */

InlineLexer.prototype.output = function(src) {
  var out = '',
      link,
      text,
      href,
      title,
      cap,
      prevCapZero;

  while (src) {
    // escape
    if (cap = this.rules.escape.exec(src)) {
      src = src.substring(cap[0].length);
      out += escape(cap[1]);
      continue;
    }

    // tag
    if (cap = this.rules.tag.exec(src)) {
      if (!this.inLink && /^<a /i.test(cap[0])) {
        this.inLink = true;
      } else if (this.inLink && /^<\/a>/i.test(cap[0])) {
        this.inLink = false;
      }
      if (!this.inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
        this.inRawBlock = true;
      } else if (this.inRawBlock && /^<\/(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
        this.inRawBlock = false;
      }

      src = src.substring(cap[0].length);
      out += this.options.sanitize
        ? this.options.sanitizer
          ? this.options.sanitizer(cap[0])
          : escape(cap[0])
        : cap[0];
      continue;
    }

    // link
    if (cap = this.rules.link.exec(src)) {
      var lastParenIndex = findClosingBracket(cap[2], '()');
      if (lastParenIndex > -1) {
        var linkLen = cap[0].length - (cap[2].length - lastParenIndex) - (cap[3] || '').length;
        cap[2] = cap[2].substring(0, lastParenIndex);
        cap[0] = cap[0].substring(0, linkLen).trim();
        cap[3] = '';
      }
      src = src.substring(cap[0].length);
      this.inLink = true;
      href = cap[2];
      if (this.options.pedantic) {
        link = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(href);

        if (link) {
          href = link[1];
          title = link[3];
        } else {
          title = '';
        }
      } else {
        title = cap[3] ? cap[3].slice(1, -1) : '';
      }
      href = href.trim().replace(/^<([\s\S]*)>$/, '$1');
      out += this.outputLink(cap, {
        href: InlineLexer.escapes(href),
        title: InlineLexer.escapes(title)
      });
      this.inLink = false;
      continue;
    }

    // reflink, nolink
    if ((cap = this.rules.reflink.exec(src))
        || (cap = this.rules.nolink.exec(src))) {
      src = src.substring(cap[0].length);
      link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
      link = this.links[link.toLowerCase()];
      if (!link || !link.href) {
        out += cap[0].charAt(0);
        src = cap[0].substring(1) + src;
        continue;
      }
      this.inLink = true;
      out += this.outputLink(cap, link);
      this.inLink = false;
      continue;
    }

    // strong
    if (cap = this.rules.strong.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.strong(this.output(cap[4] || cap[3] || cap[2] || cap[1]));
      continue;
    }

    // em
    if (cap = this.rules.em.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.em(this.output(cap[6] || cap[5] || cap[4] || cap[3] || cap[2] || cap[1]));
      continue;
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.codespan(escape(cap[2].trim(), true));
      continue;
    }

    // br
    if (cap = this.rules.br.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.br();
      continue;
    }

    // del (gfm)
    if (cap = this.rules.del.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.del(this.output(cap[1]));
      continue;
    }

    // autolink
    if (cap = this.rules.autolink.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[2] === '@') {
        text = escape(this.mangle(cap[1]));
        href = 'mailto:' + text;
      } else {
        text = escape(cap[1]);
        href = text;
      }
      out += this.renderer.link(href, null, text);
      continue;
    }

    // url (gfm)
    if (!this.inLink && (cap = this.rules.url.exec(src))) {
      if (cap[2] === '@') {
        text = escape(cap[0]);
        href = 'mailto:' + text;
      } else {
        // do extended autolink path validation
        do {
          prevCapZero = cap[0];
          cap[0] = this.rules._backpedal.exec(cap[0])[0];
        } while (prevCapZero !== cap[0]);
        text = escape(cap[0]);
        if (cap[1] === 'www.') {
          href = 'http://' + text;
        } else {
          href = text;
        }
      }
      src = src.substring(cap[0].length);
      out += this.renderer.link(href, null, text);
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      src = src.substring(cap[0].length);
      if (this.inRawBlock) {
        out += this.renderer.text(cap[0]);
      } else {
        out += this.renderer.text(escape(this.smartypants(cap[0])));
      }
      continue;
    }

    if (src) {
      throw new Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return out;
};

InlineLexer.escapes = function(text) {
  return text ? text.replace(InlineLexer.rules._escapes, '$1') : text;
};

/**
 * Compile Link
 */

InlineLexer.prototype.outputLink = function(cap, link) {
  var href = link.href,
      title = link.title ? escape(link.title) : null;

  return cap[0].charAt(0) !== '!'
    ? this.renderer.link(href, title, this.output(cap[1]))
    : this.renderer.image(href, title, escape(cap[1]));
};

/**
 * Smartypants Transformations
 */

InlineLexer.prototype.smartypants = function(text) {
  if (!this.options.smartypants) return text;
  return text
    // em-dashes
    .replace(/---/g, '\u2014')
    // en-dashes
    .replace(/--/g, '\u2013')
    // opening singles
    .replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018')
    // closing singles & apostrophes
    .replace(/'/g, '\u2019')
    // opening doubles
    .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c')
    // closing doubles
    .replace(/"/g, '\u201d')
    // ellipses
    .replace(/\.{3}/g, '\u2026');
};

/**
 * Mangle Links
 */

InlineLexer.prototype.mangle = function(text) {
  if (!this.options.mangle) return text;
  var out = '',
      l = text.length,
      i = 0,
      ch;

  for (; i < l; i++) {
    ch = text.charCodeAt(i);
    if (Math.random() > 0.5) {
      ch = 'x' + ch.toString(16);
    }
    out += '&#' + ch + ';';
  }

  return out;
};

/**
 * Renderer
 */

function Renderer(options) {
  this.options = options || marked.defaults;
}

Renderer.prototype.code = function(code, infostring, escaped) {
  var lang = (infostring || '').match(/\S*/)[0];
  if (this.options.highlight) {
    var out = this.options.highlight(code, lang);
    if (out != null && out !== code) {
      escaped = true;
      code = out;
    }
  }

  if (!lang) {
    return '<pre><code>'
      + (escaped ? code : escape(code, true))
      + '</code></pre>';
  }

  return '<pre><code class="'
    + this.options.langPrefix
    + escape(lang, true)
    + '">'
    + (escaped ? code : escape(code, true))
    + '</code></pre>\n';
};

Renderer.prototype.blockquote = function(quote) {
  return '<blockquote>\n' + quote + '</blockquote>\n';
};

Renderer.prototype.html = function(html) {
  return html;
};

Renderer.prototype.heading = function(text, level, raw, slugger) {
  if (this.options.headerIds) {
    return '<h'
      + level
      + ' id="'
      + this.options.headerPrefix
      + slugger.slug(raw)
      + '">'
      + text
      + '</h'
      + level
      + '>\n';
  }
  // ignore IDs
  return '<h' + level + '>' + text + '</h' + level + '>\n';
};

Renderer.prototype.hr = function() {
  return this.options.xhtml ? '<hr/>\n' : '<hr>\n';
};

Renderer.prototype.list = function(body, ordered, start) {
  var type = ordered ? 'ol' : 'ul',
      startatt = (ordered && start !== 1) ? (' start="' + start + '"') : '';
  return '<' + type + startatt + '>\n' + body + '</' + type + '>\n';
};

Renderer.prototype.listitem = function(text) {
  return '<li>' + text + '</li>\n';
};

Renderer.prototype.checkbox = function(checked) {
  return '<input '
    + (checked ? 'checked="" ' : '')
    + 'disabled="" type="checkbox"'
    + (this.options.xhtml ? ' /' : '')
    + '> ';
};

Renderer.prototype.paragraph = function(text) {
  return '<p>' + text + '</p>\n';
};

Renderer.prototype.table = function(header, body) {
  if (body) body = '<tbody>' + body + '</tbody>';

  return '<table>\n'
    + '<thead>\n'
    + header
    + '</thead>\n'
    + body
    + '</table>\n';
};

Renderer.prototype.tablerow = function(content) {
  return '<tr>\n' + content + '</tr>\n';
};

Renderer.prototype.tablecell = function(content, flags) {
  var type = flags.header ? 'th' : 'td';
  var tag = flags.align
    ? '<' + type + ' align="' + flags.align + '">'
    : '<' + type + '>';
  return tag + content + '</' + type + '>\n';
};

// span level renderer
Renderer.prototype.strong = function(text) {
  return '<strong>' + text + '</strong>';
};

Renderer.prototype.em = function(text) {
  return '<em>' + text + '</em>';
};

Renderer.prototype.codespan = function(text) {
  return '<code>' + text + '</code>';
};

Renderer.prototype.br = function() {
  return this.options.xhtml ? '<br/>' : '<br>';
};

Renderer.prototype.del = function(text) {
  return '<del>' + text + '</del>';
};

Renderer.prototype.link = function(href, title, text) {
  href = cleanUrl(this.options.sanitize, this.options.baseUrl, href);
  if (href === null) {
    return text;
  }
  var out = '<a href="' + escape(href) + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += '>' + text + '</a>';
  return out;
};

Renderer.prototype.image = function(href, title, text) {
  href = cleanUrl(this.options.sanitize, this.options.baseUrl, href);
  if (href === null) {
    return text;
  }

  var out = '<img src="' + href + '" alt="' + text + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += this.options.xhtml ? '/>' : '>';
  return out;
};

Renderer.prototype.text = function(text) {
  return text;
};

/**
 * TextRenderer
 * returns only the textual part of the token
 */

function TextRenderer() {}

// no need for block level renderers

TextRenderer.prototype.strong =
TextRenderer.prototype.em =
TextRenderer.prototype.codespan =
TextRenderer.prototype.del =
TextRenderer.prototype.text = function (text) {
  return text;
};

TextRenderer.prototype.link =
TextRenderer.prototype.image = function(href, title, text) {
  return '' + text;
};

TextRenderer.prototype.br = function() {
  return '';
};

/**
 * Parsing & Compiling
 */

function Parser(options) {
  this.tokens = [];
  this.token = null;
  this.options = options || marked.defaults;
  this.options.renderer = this.options.renderer || new Renderer();
  this.renderer = this.options.renderer;
  this.renderer.options = this.options;
  this.slugger = new Slugger();
}

/**
 * Static Parse Method
 */

Parser.parse = function(src, options) {
  var parser = new Parser(options);
  return parser.parse(src);
};

/**
 * Parse Loop
 */

Parser.prototype.parse = function(src) {
  this.inline = new InlineLexer(src.links, this.options);
  // use an InlineLexer with a TextRenderer to extract pure text
  this.inlineText = new InlineLexer(
    src.links,
    merge({}, this.options, {renderer: new TextRenderer()})
  );
  this.tokens = src.reverse();

  var out = '';
  while (this.next()) {
    out += this.tok();
  }

  return out;
};

/**
 * Next Token
 */

Parser.prototype.next = function() {
  return this.token = this.tokens.pop();
};

/**
 * Preview Next Token
 */

Parser.prototype.peek = function() {
  return this.tokens[this.tokens.length - 1] || 0;
};

/**
 * Parse Text Tokens
 */

Parser.prototype.parseText = function() {
  var body = this.token.text;

  while (this.peek().type === 'text') {
    body += '\n' + this.next().text;
  }

  return this.inline.output(body);
};

/**
 * Parse Current Token
 */

Parser.prototype.tok = function() {
  switch (this.token.type) {
    case 'space': {
      return '';
    }
    case 'hr': {
      return this.renderer.hr();
    }
    case 'heading': {
      return this.renderer.heading(
        this.inline.output(this.token.text),
        this.token.depth,
        unescape(this.inlineText.output(this.token.text)),
        this.slugger);
    }
    case 'code': {
      return this.renderer.code(this.token.text,
        this.token.lang,
        this.token.escaped);
    }
    case 'table': {
      var header = '',
          body = '',
          i,
          row,
          cell,
          j;

      // header
      cell = '';
      for (i = 0; i < this.token.header.length; i++) {
        cell += this.renderer.tablecell(
          this.inline.output(this.token.header[i]),
          { header: true, align: this.token.align[i] }
        );
      }
      header += this.renderer.tablerow(cell);

      for (i = 0; i < this.token.cells.length; i++) {
        row = this.token.cells[i];

        cell = '';
        for (j = 0; j < row.length; j++) {
          cell += this.renderer.tablecell(
            this.inline.output(row[j]),
            { header: false, align: this.token.align[j] }
          );
        }

        body += this.renderer.tablerow(cell);
      }
      return this.renderer.table(header, body);
    }
    case 'blockquote_start': {
      body = '';

      while (this.next().type !== 'blockquote_end') {
        body += this.tok();
      }

      return this.renderer.blockquote(body);
    }
    case 'list_start': {
      body = '';
      var ordered = this.token.ordered,
          start = this.token.start;

      while (this.next().type !== 'list_end') {
        body += this.tok();
      }

      return this.renderer.list(body, ordered, start);
    }
    case 'list_item_start': {
      body = '';
      var loose = this.token.loose;
      var checked = this.token.checked;
      var task = this.token.task;

      if (this.token.task) {
        body += this.renderer.checkbox(checked);
      }

      while (this.next().type !== 'list_item_end') {
        body += !loose && this.token.type === 'text'
          ? this.parseText()
          : this.tok();
      }
      return this.renderer.listitem(body, task, checked);
    }
    case 'html': {
      // TODO parse inline content if parameter markdown=1
      return this.renderer.html(this.token.text);
    }
    case 'paragraph': {
      return this.renderer.paragraph(this.inline.output(this.token.text));
    }
    case 'text': {
      return this.renderer.paragraph(this.parseText());
    }
    default: {
      var errMsg = 'Token with "' + this.token.type + '" type was not found.';
      if (this.options.silent) {
        console.log(errMsg);
      } else {
        throw new Error(errMsg);
      }
    }
  }
};

/**
 * Slugger generates header id
 */

function Slugger () {
  this.seen = {};
}

/**
 * Convert string to unique id
 */

Slugger.prototype.slug = function (value) {
  var slug = value
    .toLowerCase()
    .trim()
    .replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g, '')
    .replace(/\s/g, '-');

  if (this.seen.hasOwnProperty(slug)) {
    var originalSlug = slug;
    do {
      this.seen[originalSlug]++;
      slug = originalSlug + '-' + this.seen[originalSlug];
    } while (this.seen.hasOwnProperty(slug));
  }
  this.seen[slug] = 0;

  return slug;
};

/**
 * Helpers
 */

function escape(html, encode) {
  if (encode) {
    if (escape.escapeTest.test(html)) {
      return html.replace(escape.escapeReplace, function (ch) { return escape.replacements[ch]; });
    }
  } else {
    if (escape.escapeTestNoEncode.test(html)) {
      return html.replace(escape.escapeReplaceNoEncode, function (ch) { return escape.replacements[ch]; });
    }
  }

  return html;
}

escape.escapeTest = /[&<>"']/;
escape.escapeReplace = /[&<>"']/g;
escape.replacements = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

escape.escapeTestNoEncode = /[<>"']|&(?!#?\w+;)/;
escape.escapeReplaceNoEncode = /[<>"']|&(?!#?\w+;)/g;

function unescape(html) {
  // explicitly match decimal, hex, and named HTML entities
  return html.replace(/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig, function(_, n) {
    n = n.toLowerCase();
    if (n === 'colon') return ':';
    if (n.charAt(0) === '#') {
      return n.charAt(1) === 'x'
        ? String.fromCharCode(parseInt(n.substring(2), 16))
        : String.fromCharCode(+n.substring(1));
    }
    return '';
  });
}

function edit(regex, opt) {
  regex = regex.source || regex;
  opt = opt || '';
  return {
    replace: function(name, val) {
      val = val.source || val;
      val = val.replace(/(^|[^\[])\^/g, '$1');
      regex = regex.replace(name, val);
      return this;
    },
    getRegex: function() {
      return new RegExp(regex, opt);
    }
  };
}

function cleanUrl(sanitize, base, href) {
  if (sanitize) {
    try {
      var prot = decodeURIComponent(unescape(href))
        .replace(/[^\w:]/g, '')
        .toLowerCase();
    } catch (e) {
      return null;
    }
    if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0 || prot.indexOf('data:') === 0) {
      return null;
    }
  }
  if (base && !originIndependentUrl.test(href)) {
    href = resolveUrl(base, href);
  }
  try {
    href = encodeURI(href).replace(/%25/g, '%');
  } catch (e) {
    return null;
  }
  return href;
}

function resolveUrl(base, href) {
  if (!baseUrls[' ' + base]) {
    // we can ignore everything in base after the last slash of its path component,
    // but we might need to add _that_
    // https://tools.ietf.org/html/rfc3986#section-3
    if (/^[^:]+:\/*[^/]*$/.test(base)) {
      baseUrls[' ' + base] = base + '/';
    } else {
      baseUrls[' ' + base] = rtrim(base, '/', true);
    }
  }
  base = baseUrls[' ' + base];

  if (href.slice(0, 2) === '//') {
    return base.replace(/:[\s\S]*/, ':') + href;
  } else if (href.charAt(0) === '/') {
    return base.replace(/(:\/*[^/]*)[\s\S]*/, '$1') + href;
  } else {
    return base + href;
  }
}
var baseUrls = {};
var originIndependentUrl = /^$|^[a-z][a-z0-9+.-]*:|^[?#]/i;

function noop() {}
noop.exec = noop;

function merge(obj) {
  var i = 1,
      target,
      key;

  for (; i < arguments.length; i++) {
    target = arguments[i];
    for (key in target) {
      if (Object.prototype.hasOwnProperty.call(target, key)) {
        obj[key] = target[key];
      }
    }
  }

  return obj;
}

function splitCells(tableRow, count) {
  // ensure that every cell-delimiting pipe has a space
  // before it to distinguish it from an escaped pipe
  var row = tableRow.replace(/\|/g, function (match, offset, str) {
        var escaped = false,
            curr = offset;
        while (--curr >= 0 && str[curr] === '\\') escaped = !escaped;
        if (escaped) {
          // odd number of slashes means | is escaped
          // so we leave it alone
          return '|';
        } else {
          // add space before unescaped |
          return ' |';
        }
      }),
      cells = row.split(/ \|/),
      i = 0;

  if (cells.length > count) {
    cells.splice(count);
  } else {
    while (cells.length < count) cells.push('');
  }

  for (; i < cells.length; i++) {
    // leading or trailing whitespace is ignored per the gfm spec
    cells[i] = cells[i].trim().replace(/\\\|/g, '|');
  }
  return cells;
}

// Remove trailing 'c's. Equivalent to str.replace(/c*$/, '').
// /c*$/ is vulnerable to REDOS.
// invert: Remove suffix of non-c chars instead. Default falsey.
function rtrim(str, c, invert) {
  if (str.length === 0) {
    return '';
  }

  // Length of suffix matching the invert condition.
  var suffLen = 0;

  // Step left until we fail to match the invert condition.
  while (suffLen < str.length) {
    var currChar = str.charAt(str.length - suffLen - 1);
    if (currChar === c && !invert) {
      suffLen++;
    } else if (currChar !== c && invert) {
      suffLen++;
    } else {
      break;
    }
  }

  return str.substr(0, str.length - suffLen);
}

function findClosingBracket(str, b) {
  if (str.indexOf(b[1]) === -1) {
    return -1;
  }
  var level = 0;
  for (var i = 0; i < str.length; i++) {
    if (str[i] === '\\') {
      i++;
    } else if (str[i] === b[0]) {
      level++;
    } else if (str[i] === b[1]) {
      level--;
      if (level < 0) {
        return i;
      }
    }
  }
  return -1;
}

/**
 * Marked
 */

function marked(src, opt, callback) {
  // throw error in case of non string input
  if (typeof src === 'undefined' || src === null) {
    throw new Error('marked(): input parameter is undefined or null');
  }
  if (typeof src !== 'string') {
    throw new Error('marked(): input parameter is of type '
      + Object.prototype.toString.call(src) + ', string expected');
  }

  if (callback || typeof opt === 'function') {
    if (!callback) {
      callback = opt;
      opt = null;
    }

    opt = merge({}, marked.defaults, opt || {});

    var highlight = opt.highlight,
        tokens,
        pending,
        i = 0;

    try {
      tokens = Lexer.lex(src, opt);
    } catch (e) {
      return callback(e);
    }

    pending = tokens.length;

    var done = function(err) {
      if (err) {
        opt.highlight = highlight;
        return callback(err);
      }

      var out;

      try {
        out = Parser.parse(tokens, opt);
      } catch (e) {
        err = e;
      }

      opt.highlight = highlight;

      return err
        ? callback(err)
        : callback(null, out);
    };

    if (!highlight || highlight.length < 3) {
      return done();
    }

    delete opt.highlight;

    if (!pending) return done();

    for (; i < tokens.length; i++) {
      (function(token) {
        if (token.type !== 'code') {
          return --pending || done();
        }
        return highlight(token.text, token.lang, function(err, code) {
          if (err) return done(err);
          if (code == null || code === token.text) {
            return --pending || done();
          }
          token.text = code;
          token.escaped = true;
          --pending || done();
        });
      })(tokens[i]);
    }

    return;
  }
  try {
    if (opt) opt = merge({}, marked.defaults, opt);
    return Parser.parse(Lexer.lex(src, opt), opt);
  } catch (e) {
    e.message += '\nPlease report this to https://github.com/markedjs/marked.';
    if ((opt || marked.defaults).silent) {
      return '<p>An error occurred:</p><pre>'
        + escape(e.message + '', true)
        + '</pre>';
    }
    throw e;
  }
}

/**
 * Options
 */

marked.options =
marked.setOptions = function(opt) {
  merge(marked.defaults, opt);
  return marked;
};

marked.getDefaults = function () {
  return {
    baseUrl: null,
    breaks: false,
    gfm: true,
    headerIds: true,
    headerPrefix: '',
    highlight: null,
    langPrefix: 'language-',
    mangle: true,
    pedantic: false,
    renderer: new Renderer(),
    sanitize: false,
    sanitizer: null,
    silent: false,
    smartLists: false,
    smartypants: false,
    tables: true,
    xhtml: false
  };
};

marked.defaults = marked.getDefaults();

/**
 * Expose
 */

marked.Parser = Parser;
marked.parser = Parser.parse;

marked.Renderer = Renderer;
marked.TextRenderer = TextRenderer;

marked.Lexer = Lexer;
marked.lexer = Lexer.lex;

marked.InlineLexer = InlineLexer;
marked.inlineLexer = InlineLexer.output;

marked.Slugger = Slugger;

marked.parse = marked;

if (typeof module !== 'undefined' && typeof exports === 'object') {
  module.exports = marked;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return marked; });
} else {
  root.marked = marked;
}
})(this || (typeof window !== 'undefined' ? window : global));


(function ($) {

    var sanitizeHtmlAllowedTags = sanitizeHtml.defaults.allowedTags.concat([
        'img', 'h1', 'h2', 'del', 'span'
    ]);

    $(window).on('resize', function () {
        var height = $(window).height() - $('.editor-toolbar').outerHeight() - $('#hdr').height();
        $('.editor-panel').height(height);
    }).trigger('resize');

    $('.editor-panel').layout({
        east__size: '50%',
        east__minSize: '33%',
        east__maxSize: '66%',
    });

    var editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
        lineNumbers: true,
        lineWrapping: true,
        smartIndent: true,
        indentWithTabs: true,
        tabindex: 2,
        tabSize: 4,
        indentUnit: 4,
        showCursorWhenSelecting: true,
        viewportMargin: 20,
        cursorScrollMargin: 10,
        gutters: ["CodeMirror-linenumbers"],
        // extraKeys: extraKeys,
    });
    editor.setOption("theme", "default");
    editor.setOption("mode", "markdown");

    if (window.localStorage['markdown-draft']) {
        editor.setValue(window.localStorage['markdown-draft']);
    }

    var preview = $('.editor-preview');
    editor.on("change", function (cm, changes) {
        window.localStorage['markdown-draft'] = cm.getValue();
        var html = sanitizeHtml(marked(cm.getValue()), {allowedTags: sanitizeHtmlAllowedTags});
        preview.html(html);
    });

    var html = sanitizeHtml(marked(editor.getValue()), {allowedTags: sanitizeHtmlAllowedTags});
    preview.html(html);


    function surroundSelections(before, after) {
        before = before || '';
        after = after || '';
        var selections = editor.getSelections();
        selections = selections.map(function (originText) {
            return before + originText + after;
        });
        editor.replaceSelections(selections);
    }
    function replaceSelections(text) {
        text = text || '';
        var selections = editor.getSelections();
        selections = selections.map(function (originText) {
            return text;
        });
        editor.replaceSelections(selections);
    }
    function prependLines(prefix) {
        var selections = editor.getSelections();
        selections = selections.map(function (originText) {
            var lines = originText.split(/\r?\n/);
            return lines.map(function (line) {
            	return prefix + line;
			}).join("\n");
        });
        editor.replaceSelections(selections);
	}

    function boldSelections() {
        surroundSelections('**', '**');
    }
    function italicSelections() {
        surroundSelections('*', '*');
    }
    function linkSelections() {
        surroundSelections('[', ']()');
    }
    function lineThroughSelections() {
		surroundSelections('~~', '~~');
    }
    function underlineSelections() {
        surroundSelections('<u>', '</u>');
    }
    // quote
    function quoteSelections() {
        prependLines('> ');
    }
    // table
    function tableSelections() {
        replaceSelections('\n| header1 | header2 |\n| ------- | ------- |\n|         |         |\n');
    }
    // image
    function imageSelections() {
        surroundSelections('![', ']()');
    }
    // heading
    function headingSelections(n) {
        surroundSelections('\n\n' + '#'.repeat(n) + ' ', '\n\n');
    }
    // code
    function codeSelections() {
        surroundSelections('\n```\n', '\n```\n');
    }

    $('.js-bold').on('click', function (e) {
        boldSelections();
    });
    $('.js-italic').on('click', function (e) {
        italicSelections();
    });
    $('.js-link').on('click', function (e) {
        linkSelections();
    });
    $('.js-line-through').on('click', function (e) {
        lineThroughSelections();
    });
    $('.js-underline').on('click', function (e) {
        underlineSelections();
    });
    $('.js-quote').on('click', function (e) {
        quoteSelections();
    });
    $('.js-table').on('click', function (e) {
        tableSelections();
    });
    $('.js-image').on('click', function (e) {
        imageSelections();
    });
    $('.js-heading').on('click', function (e) {
        headingSelections();
    });
    $('.js-code').on('click', function (e) {
        codeSelections();
    });

    $('.js-import').on('click', function (e) {
        $.facebox({div: '#convert_modal'});
    });

    var turndownService = new TurndownService();

    $(document).on('click', '.convert', function (e) {
        var text = turndownService.turndown($('#facebox .html').val(), {gfm: true});
        replaceSelections(text);
        $(document).trigger('close.facebox');
    });

    $('.js-beautify').on('click', function (e) {
        var url = $('.js-beautify').data('url');
        $.post(url, {code: editor.getValue()}, function (data) {
            if (data.status) {
                editor.setValue(data.text);
            } else {
                $.facebox('<p>' + data.message + '</p>');
            }
        }, 'json').error(function () {
            alert("提交失败，请重试！");
        });
    });
})(jQuery);
