---
layout: post
title:  Flutter Go 代码开发规范 0.1.0 版
tag: [flutter, Location, awesome-flutter,flutter开发规范]
date: 2019-07-08
---

<article class="markdown-body entry-content p-3 p-md-6" itemprop="text"><h1><a id="user-content-flutter-go-代码开发规范-010-版" class="anchor" aria-hidden="true" href="#flutter-go-代码开发规范-010-版"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>Flutter Go 代码开发规范 0.1.0 版</h1>
<h2><a id="user-content-代码风格" class="anchor" aria-hidden="true" href="#代码风格"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>代码风格</h2>
<h3><a id="user-content-标识符三种类型" class="anchor" aria-hidden="true" href="#标识符三种类型"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>标识符三种类型</h3>
<h4><a id="user-content-大驼峰" class="anchor" aria-hidden="true" href="#大驼峰"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>大驼峰</h4>
<p>类、枚举、typedef和类型参数</p>
<pre><code>  class SliderMenu { ... }
  
  class HttpRequest { ... }
  
  typedef Predicate = bool Function&lt;T&gt;(T value);
</code></pre>
<p>包括用于元数据注释的类</p>
<pre><code>  class Foo {
    const Foo([arg]);
  }
  
  @Foo(anArg)
  class A { ... }
  
  @Foo()
  class B { ... }
</code></pre>
<h4><a id="user-content-使用小写加下划线来命名库和源文件" class="anchor" aria-hidden="true" href="#使用小写加下划线来命名库和源文件"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>使用小写加下划线来命名库和源文件</h4>
<pre><code>  library peg_parser.source_scanner;
  
  import 'file_system.dart';
  import 'slider_menu.dart';
</code></pre>
<p>不推荐如下写法：</p>
<pre><code>  library pegparser.SourceScanner;
  
  import 'file-system.dart';
  import 'SliderMenu.dart';
</code></pre>
<h4><a id="user-content-使用小写加下划线来命名导入前缀" class="anchor" aria-hidden="true" href="#使用小写加下划线来命名导入前缀"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>使用小写加下划线来命名导入前缀</h4>
<pre><code>  import 'dart:math' as math;
  import 'package:angular_components/angular_components'
      as angular_components;
  import 'package:js/js.dart' as js;
</code></pre>
<p>不推荐如下写法：</p>
<pre><code>  import 'dart:math' as Math;
  import 'package:angular_components/angular_components'
      as angularComponents;
  import 'package:js/js.dart' as JS;
</code></pre>
<h4><a id="user-content-使用小驼峰法命名其他标识符" class="anchor" aria-hidden="true" href="#使用小驼峰法命名其他标识符"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>使用小驼峰法命名其他标识符</h4>
<pre><code>  var item;
  
  HttpRequest httpRequest;
  
  void align(bool clearItems) {
    // ...
  }
</code></pre>
<h4><a id="user-content-优先使用小驼峰法作为常量命名" class="anchor" aria-hidden="true" href="#优先使用小驼峰法作为常量命名"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>优先使用小驼峰法作为常量命名</h4>
<pre><code>  const pi = 3.14;
  const defaultTimeout = 1000;
  final urlScheme = RegExp('^([a-z]+):');
  
  class Dice {
    static final numberGenerator = Random();
  }
</code></pre>
<p>不推荐如下写法：</p>
<pre><code>  const PI = 3.14;
  const DefaultTimeout = 1000;
  final URL_SCHEME = RegExp('^([a-z]+):');
  
  class Dice {
    static final NUMBER_GENERATOR = Random();
  }
</code></pre>
<h4><a id="user-content-不使用前缀字母" class="anchor" aria-hidden="true" href="#不使用前缀字母"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>不使用前缀字母</h4>
<p>因为Dart可以告诉您声明的类型、范围、可变性和其他属性，所以没有理由将这些属性编码为标识符名称。</p>
<pre><code>  defaultTimeout
</code></pre>
<p>不推荐如下写法：</p>
<pre><code>  kDefaultTimeout
</code></pre>
<h3><a id="user-content-排序" class="anchor" aria-hidden="true" href="#排序"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>排序</h3>
<p>为了使你的文件前言保持整洁，我们有规定的命令，指示应该出现在其中。每个“部分”应该用空行分隔。</p>
<h4><a id="user-content-在其他引入之前引入所需的dart库" class="anchor" aria-hidden="true" href="#在其他引入之前引入所需的dart库"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>在其他引入之前引入所需的dart库</h4>
<pre><code>  import 'dart:async';
  import 'dart:html';
  
  import 'package:bar/bar.dart';
  import 'package:foo/foo.dart';
</code></pre>
<h4><a id="user-content-在相对引入之前先引入在包中的库" class="anchor" aria-hidden="true" href="#在相对引入之前先引入在包中的库"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>在相对引入之前先引入在包中的库</h4>
<pre><code>  import 'package:bar/bar.dart';
  import 'package:foo/foo.dart';
  
  import 'util.dart';
</code></pre>
<h4><a id="user-content-第三方包的导入先于其他包" class="anchor" aria-hidden="true" href="#第三方包的导入先于其他包"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>第三方包的导入先于其他包</h4>
<pre><code>  import 'package:bar/bar.dart';
  import 'package:foo/foo.dart';
  
  import 'package:my_package/util.dart';
</code></pre>
<h4><a id="user-content-在所有导入之后在单独的部分中指定导出" class="anchor" aria-hidden="true" href="#在所有导入之后在单独的部分中指定导出"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>在所有导入之后，在单独的部分中指定导出</h4>
<pre><code>  import 'src/error.dart';
  import 'src/foo_bar.dart';
  
  export 'src/error.dart';
</code></pre>
<p>不推荐如下写法：</p>
<pre><code>  import 'src/error.dart';
  export 'src/error.dart';
  import 'src/foo_bar.dart';
</code></pre>
<h3><a id="user-content-所有流控制结构请使用大括号" class="anchor" aria-hidden="true" href="#所有流控制结构请使用大括号"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>所有流控制结构，请使用大括号</h3>
<p>这样做可以避免悬浮的else问题</p>
<pre><code>  if (isWeekDay) {
    print('Bike to work!');
  } else {
    print('Go dancing or read a book!');
  }
</code></pre>
<h4><a id="user-content-例外" class="anchor" aria-hidden="true" href="#例外"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>例外</h4>
<p>一个if语句没有else子句，其中整个if语句和then主体都适合一行。在这种情况下，如果你喜欢的话，你可以去掉大括号</p>
<pre><code>  if (arg == null) return defaultValue;
</code></pre>
<p>如果流程体超出了一行需要分划请使用大括号：</p>
<pre><code>  if (overflowChars != other.overflowChars) {
    return overflowChars &lt; other.overflowChars;
  }
</code></pre>
<p>不推荐如下写法：</p>
<pre><code>  if (overflowChars != other.overflowChars)
    return overflowChars &lt; other.overflowChars;
</code></pre>
<h2><a id="user-content-注释" class="anchor" aria-hidden="true" href="#注释"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>注释</h2>
<h3><a id="user-content-要像句子一样格式化" class="anchor" aria-hidden="true" href="#要像句子一样格式化"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>要像句子一样格式化</h3>
<p>除非是区分大小写的标识符，否则第一个单词要大写。以句号结尾(或“!”或“?”)。对于所有的注释都是如此：doc注释、内联内容，甚至TODOs。即使是一个句子片段。</p>
<pre><code>  greet(name) {
    // Assume we have a valid name.
    print('Hi, $name!');
  }
</code></pre>
<p>不推荐如下写法：</p>
<pre><code>  greet(name) {
    /* Assume we have a valid name. */
    print('Hi, $name!');
  }
</code></pre>
<p>可以使用块注释(/…/)临时注释掉一段代码，但是所有其他注释都应该使用//</p>
<h3><a id="user-content-doc注释" class="anchor" aria-hidden="true" href="#doc注释"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>Doc注释</h3>
<p>使用///文档注释来记录成员和类型。</p>
<p>使用doc注释而不是常规注释，可以让dartdoc找到并生成文档。</p>
<pre><code>  /// The number of characters in this chunk when unsplit.
  int get length =&gt; ...
</code></pre>
<blockquote>
<p>由于历史原因，达特茅斯学院支持道格评论的两种语法:///(“C#风格”)和/**…* /(“JavaDoc风格”)。我们更喜欢/// 因为它更紧凑。/*<em>和</em>/在多行文档注释中添加两个无内容的行。在某些情况下，///语法也更容易阅读，例如文档注释包含使用*标记列表项的项目符号列表。</p>
</blockquote>
<h3><a id="user-content-考虑为私有api编写文档注释" class="anchor" aria-hidden="true" href="#考虑为私有api编写文档注释"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>考虑为私有api编写文档注释</h3>
<p>Doc注释并不仅仅针对库的公共API的外部使用者。它们还有助于理解从库的其他部分调用的私有成员</p>
<h4><a id="user-content-用一句话总结开始doc注释" class="anchor" aria-hidden="true" href="#用一句话总结开始doc注释"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>用一句话总结开始doc注释</h4>
<p>以简短的、以用户为中心的描述开始你的文档注释，以句号结尾。</p>
<pre><code>/// Deletes the file at [path] from the file system.
void delete(String path) {
  ...
}
</code></pre>
<p>不推荐如下写法：</p>
<pre><code>  /// Depending on the state of the file system and the user's permissions,
  /// certain operations may or may not be possible. If there is no file at
  /// [path] or it can't be accessed, this function throws either [IOError]
  /// or [PermissionError], respectively. Otherwise, this deletes the file.
  void delete(String path) {
    ...
  }
</code></pre>
<h4><a id="user-content-doc注释的第一句话分隔成自己的段落" class="anchor" aria-hidden="true" href="#doc注释的第一句话分隔成自己的段落"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>“doc注释”的第一句话分隔成自己的段落</h4>
<p>在第一个句子之后添加一个空行，把它分成自己的段落</p>
<pre><code>  /// Deletes the file at [path].
  ///
  /// Throws an [IOError] if the file could not be found. Throws a
  /// [PermissionError] if the file is present but could not be deleted.
  void delete(String path) {
    ...
  }
</code></pre>
<h2><a id="user-content-flutter_go-使用参考" class="anchor" aria-hidden="true" href="#flutter_go-使用参考"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>Flutter_Go 使用参考</h2>
<h3><a id="user-content-库的引用" class="anchor" aria-hidden="true" href="#库的引用"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>库的引用</h3>
<p>flutter go 中，导入lib下文件库，统一指定包名，避免过多的<code>../../</code></p>
<pre><code>package:flutter_go/
</code></pre>
<h3><a id="user-content-字符串的使用" class="anchor" aria-hidden="true" href="#字符串的使用"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>字符串的使用</h3>
<h4><a id="user-content-使用相邻字符串连接字符串文字" class="anchor" aria-hidden="true" href="#使用相邻字符串连接字符串文字"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>使用相邻字符串连接字符串文字</h4>
<p>如果有两个字符串字面值(不是值，而是实际引用的字面值)，则不需要使用+连接它们。就像在C和c++中，简单地把它们放在一起就能做到。这是创建一个长字符串很好的方法但是不适用于单独一行。</p>
<pre><code>raiseAlarm(
    'ERROR: Parts of the spaceship are on fire. Other '
    'parts are overrun by martians. Unclear which are which.');
</code></pre>
<p>不推荐如下写法:</p>
<pre><code>raiseAlarm('ERROR: Parts of the spaceship are on fire. Other ' +
    'parts are overrun by martians. Unclear which are which.');
</code></pre>
<h4><a id="user-content-优先使用模板字符串" class="anchor" aria-hidden="true" href="#优先使用模板字符串"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>优先使用模板字符串</h4>
<pre><code>'Hello, $name! You are ${year - birth} years old.';
</code></pre>
<h4><a id="user-content-在不需要的时候避免使用花括号" class="anchor" aria-hidden="true" href="#在不需要的时候避免使用花括号"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>在不需要的时候，避免使用花括号</h4>
<pre><code>  'Hi, $name!'
  "Wear your wildest $decade's outfit."
</code></pre>
<p>不推荐如下写法：</p>
<pre><code>  'Hello, ' + name + '! You are ' + (year - birth).toString() + ' y...';
</code></pre>
<p>不推荐如下写法：</p>
<pre><code>  'Hi, ${name}!'
  "Wear your wildest ${decade}'s outfit."
</code></pre>
<h3><a id="user-content-集合" class="anchor" aria-hidden="true" href="#集合"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>集合</h3>
<h4><a id="user-content-尽可能使用集合字面量" class="anchor" aria-hidden="true" href="#尽可能使用集合字面量"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>尽可能使用集合字面量</h4>
<p>如果要创建一个不可增长的列表，或者其他一些自定义集合类型，那么无论如何，都要使用构造函数。</p>
<pre><code>  var points = [];
  var addresses = {};
  var lines = &lt;Lines&gt;[];
</code></pre>
<p>不推荐如下写法：</p>
<pre><code>  var points = List();
  var addresses = Map();
</code></pre>
<h4><a id="user-content-不要使用length查看集合是否为空" class="anchor" aria-hidden="true" href="#不要使用length查看集合是否为空"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>不要使用.length查看集合是否为空</h4>
<pre><code>if (lunchBox.isEmpty) return 'so hungry...';
if (words.isNotEmpty) return words.join(' ');
</code></pre>
<p>不推荐如下写法：</p>
<pre><code>  if (lunchBox.length == 0) return 'so hungry...';
  if (!words.isEmpty) return words.join(' ');
</code></pre>
<h4><a id="user-content-考虑使用高阶方法转换序列" class="anchor" aria-hidden="true" href="#考虑使用高阶方法转换序列"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>考虑使用高阶方法转换序列</h4>
<p>如果有一个集合，并且希望从中生成一个新的修改后的集合，那么使用.map()、.where()和Iterable上的其他方便的方法通常更短，也更具有声明性</p>
<pre><code>  var aquaticNames = animals
      .where((animal) =&gt; animal.isAquatic)
      .map((animal) =&gt; animal.name);
</code></pre>
<h4><a id="user-content-避免使用带有函数字面量的iterableforeach" class="anchor" aria-hidden="true" href="#避免使用带有函数字面量的iterableforeach"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>避免使用带有函数字面量的Iterable.forEach()</h4>
<p>在Dart中，如果你想遍历一个序列，惯用的方法是使用循环。</p>
<pre><code>for (var person in people) {
  ...
}
</code></pre>
<p>不推荐如下写法：</p>
<pre><code>  people.forEach((person) {
    ...
  });
</code></pre>
<h4><a id="user-content-不要使用listfrom除非打算更改结果的类型" class="anchor" aria-hidden="true" href="#不要使用listfrom除非打算更改结果的类型"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>不要使用List.from()，除非打算更改结果的类型</h4>
<p>给定一个迭代，有两种明显的方法可以生成包含相同元素的新列表</p>
<pre><code>var copy1 = iterable.toList();
var copy2 = List.from(iterable);
</code></pre>
<p>明显的区别是第一个比较短。重要的区别是第一个保留了原始对象的类型参数</p>
<pre><code>// Creates a List&lt;int&gt;:
var iterable = [1, 2, 3];

// Prints "List&lt;int&gt;":
print(iterable.toList().runtimeType);
</code></pre>
<pre><code>// Creates a List&lt;int&gt;:
var iterable = [1, 2, 3];

// Prints "List&lt;dynamic&gt;":
print(List.from(iterable).runtimeType);
</code></pre>
<h3><a id="user-content-参数的使用" class="anchor" aria-hidden="true" href="#参数的使用"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>参数的使用</h3>
<h4><a id="user-content-使用将命名参数与其默认值分割开" class="anchor" aria-hidden="true" href="#使用将命名参数与其默认值分割开"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>使用=将命名参数与其默认值分割开</h4>
<p>由于遗留原因，Dart均允许“:”和“=”作为指定参数的默认值分隔符。为了与可选的位置参数保持一致，使用“=”。</p>
<pre><code>  void insert(Object item, {int at = 0}) { ... }
</code></pre>
<p>不推荐如下写法：</p>
<pre><code>  void insert(Object item, {int at: 0}) { ... }
</code></pre>
<h4><a id="user-content-不要使用显式默认值null" class="anchor" aria-hidden="true" href="#不要使用显式默认值null"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>不要使用显式默认值null</h4>
<p>如果参数是可选的，但没有给它一个默认值，则语言隐式地使用null作为默认值，因此不需要编写它</p>
<pre><code>void error([String message]) {
  stderr.write(message ?? '\n');
}
</code></pre>
<p>不推荐如下写法:</p>
<pre><code>void error([String message = null]) {
  stderr.write(message ?? '\n');
}
</code></pre>
<h3><a id="user-content-变量" class="anchor" aria-hidden="true" href="#变量"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>变量</h3>
<h4><a id="user-content-不要显式地将变量初始化为空" class="anchor" aria-hidden="true" href="#不要显式地将变量初始化为空"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>不要显式地将变量初始化为空</h4>
<p>在Dart中，未显式初始化的变量或字段自动被初始化为null。不要多余赋值null</p>
<pre><code>  int _nextId;
  
  class LazyId {
    int _id;
  
    int get id {
      if (_nextId == null) _nextId = 0;
      if (_id == null) _id = _nextId++;
  
      return _id;
    }
  }
</code></pre>
<p>不推荐如下写法：</p>
<pre><code>  int _nextId = null;
  
  class LazyId {
    int _id = null;
  
    int get id {
      if (_nextId == null) _nextId = 0;
      if (_id == null) _id = _nextId++;
  
      return _id;
    }
  }
</code></pre>
<h4><a id="user-content-避免储存你能计算的东西" class="anchor" aria-hidden="true" href="#避免储存你能计算的东西"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>避免储存你能计算的东西</h4>
<p>在设计类时，您通常希望将多个视图公开到相同的底层状态。通常你会看到在构造函数中计算所有视图的代码，然后存储它们:</p>
<p>应该避免的写法：</p>
<pre><code>  class Circle {
    num radius;
    num area;
    num circumference;
  
    Circle(num radius)
        : radius = radius,
          area = pi * radius * radius,
          circumference = pi * 2.0 * radius;
  }
</code></pre>
<p>如上代码问题：</p>
<ul>
<li>浪费内存</li>
<li>缓存的问题是无效——如何知道何时缓存过期需要重新计算？</li>
</ul>
<p>推荐的写法如下：</p>
<pre><code>  class Circle {
    num radius;
  
    Circle(this.radius);
  
    num get area =&gt; pi * radius * radius;
    num get circumference =&gt; pi * 2.0 * radius;
  }
</code></pre>
<h3><a id="user-content-类成员" class="anchor" aria-hidden="true" href="#类成员"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>类成员</h3>
<h4><a id="user-content-不要把不必要地将字段包装在getter和setter中" class="anchor" aria-hidden="true" href="#不要把不必要地将字段包装在getter和setter中"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>不要把不必要地将字段包装在getter和setter中</h4>
<p>不推荐如下写法：</p>
<pre><code>  class Box {
    var _contents;
    get contents =&gt; _contents;
    set contents(value) {
      _contents = value;
    }
  }
</code></pre>
<h4><a id="user-content-优先使用final字段来创建只读属性" class="anchor" aria-hidden="true" href="#优先使用final字段来创建只读属性"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>优先使用final字段来创建只读属性</h4>
<p>尤其对于 <code>StatelessWidget</code></p>
<h4><a id="user-content-在不需要的时候不要用this" class="anchor" aria-hidden="true" href="#在不需要的时候不要用this"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>在不需要的时候不要用this</h4>
<p>不推荐如下写法：</p>
<pre><code>  class Box {
    var value;
    
    void clear() {
      this.update(null);
    }
    
    void update(value) {
      this.value = value;
    }
  }
</code></pre>
<p>推荐如下写法：</p>
<pre><code>  class Box {
    var value;
  
    void clear() {
      update(null);
    }
  
    void update(value) {
      this.value = value;
    }
  }
</code></pre>
<h3><a id="user-content-构造函数" class="anchor" aria-hidden="true" href="#构造函数"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>构造函数</h3>
<h4><a id="user-content-尽可能使用初始化的形式" class="anchor" aria-hidden="true" href="#尽可能使用初始化的形式"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>尽可能使用初始化的形式</h4>
<p>不推荐如下写法：</p>
<pre><code>  class Point {
    num x, y;
    Point(num x, num y) {
      this.x = x;
      this.y = y;
    }
  }
</code></pre>
<p>推荐如下写法：</p>
<pre><code>class Point {
  num x, y;
  Point(this.x, this.y);
}
</code></pre>
<h4><a id="user-content-不要使用new" class="anchor" aria-hidden="true" href="#不要使用new"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>不要使用new</h4>
<p>Dart2使new 关键字可选</p>
<p>推荐写法：</p>
<pre><code>  Widget build(BuildContext context) {
    return Row(
      children: [
        RaisedButton(
          child: Text('Increment'),
        ),
        Text('Click!'),
      ],
    );
  }
</code></pre>
<p>不推荐如下写法：</p>
<pre><code>  Widget build(BuildContext context) {
    return new Row(
      children: [
        new RaisedButton(
          child: new Text('Increment'),
        ),
        new Text('Click!'),
      ],
    );
  }
</code></pre>
<h3><a id="user-content-异步" class="anchor" aria-hidden="true" href="#异步"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>异步</h3>
<h4><a id="user-content-优先使用asyncawait代替原始的futures" class="anchor" aria-hidden="true" href="#优先使用asyncawait代替原始的futures"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>优先使用async/await代替原始的futures</h4>
<p>async/await语法提高了可读性，允许你在异步代码中使用所有Dart控制流结构。</p>
<pre><code>  Future&lt;int&gt; countActivePlayers(String teamName) async {
    try {
      var team = await downloadTeam(teamName);
      if (team == null) return 0;
  
      var players = await team.roster;
      return players.where((player) =&gt; player.isActive).length;
    } catch (e) {
      log.error(e);
      return 0;
    }
  }
</code></pre>
<h4><a id="user-content-当异步没有任何用处时不要使用它" class="anchor" aria-hidden="true" href="#当异步没有任何用处时不要使用它"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>当异步没有任何用处时，不要使用它</h4>
<p>如果可以在不改变函数行为的情况下省略异步，那么就这样做。、</p>
<pre><code>  Future afterTwoThings(Future first, Future second) {
    return Future.wait([first, second]);
  }
</code></pre>
<p>不推荐写法：</p>
<pre><code>  Future afterTwoThings(Future first, Future second) async {
    return Future.wait([first, second]);
  }
</code></pre>
</article>