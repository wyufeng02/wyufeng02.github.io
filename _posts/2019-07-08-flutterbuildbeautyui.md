---
layout: post
title:  用 Flutter 构建漂亮的 UI 界面 - 基础组件篇
tag: [flutter, Location, Maps,UI]
date: 2019-07-08
---

<td class="d-block comment-body markdown-body  js-comment-body simpread-focus-highlight" style="z-index: 2147483646; overflow: visible; position: relative;">
          <h2>1. 前言</h2>
<p><code>Flutter</code>作为时下最流行的技术之一，凭借其出色的性能以及抹平多端的差异优势，早已引起大批技术爱好者的关注，甚至一些<code>闲鱼</code>，<code>美团</code>，<code>腾讯</code>等大公司均已开始使用。虽然目前其生态还没有完全成熟，但身靠背后的<code>Google</code>加持，其发展速度已经足够惊人，可以预见将来对<code>Flutter</code>开发人员的需求也会随之增长。</p>
<p>无论是为了现在的技术尝鲜还是将来的潮流趋势，都9102年了，作为一个前端开发者，似乎没有理由不去尝试它。正是带着这样的心理，笔者也开始学习<code>Flutter</code>，同时建了一个用于练习的<a href="https://github.com/SmallStoneSK/flutter_training_app">仓库</a>，后续所有代码都会托管在上面，欢迎star，一起学习。</p>
<p>今天分享的是Flutter中最常用到的一些基础组件，它们是构成UI界面的基础元素：<code>容器</code>，<code>行</code>，<code>列</code>，<code>绝对定位布局</code>，<code>文本</code>，<code>图片</code>和<code>图标</code>等。</p>
<p><a target="_blank" rel="noopener noreferrer" href="https://camo.githubusercontent.com/b405ad5a5ed1c0ce4714d3fa5ce30f7a7146207f/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d633638643866343664366364643764622e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"><img src="https://camo.githubusercontent.com/b405ad5a5ed1c0ce4714d3fa5ce30f7a7146207f/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d633638643866343664366364643764622e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430" alt="cover.png" data-canonical-src="https://upload-images.jianshu.io/upload_images/1990133-c68d8f46d6cdd7db.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240" style="max-width:100%;"></a></p>
<h2>2. 基础组件</h2>
<h3>2.1 Container(容器组件)</h3>
<div align="center">
  <a target="_blank" rel="noopener noreferrer" href="https://camo.githubusercontent.com/df59b65a94861c4bf83c1bfc6eae4f0ea721ddc7/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d303365316661353231333263366335332e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"><img width="500" src="https://camo.githubusercontent.com/df59b65a94861c4bf83c1bfc6eae4f0ea721ddc7/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d303365316661353231333263366335332e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430" data-canonical-src="https://upload-images.jianshu.io/upload_images/1990133-03e1fa52132c6c53.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240" style="max-width:100%;"></a>
</div>
<p><code>Container</code>组件是最常用的布局组件之一，可以认为它是web开发中的<code>div</code>，rn开发中的<code>View</code>。其往往可以用来控制大小、背景颜色、边框、阴影、内外边距和内容排列方式等。我们先来看下其构造函数：</p>
<div class="highlight highlight-source-dart"><pre><span class="pl-c1">Container</span>({
  <span class="pl-c1">Key</span> key,
  <span class="pl-k">double</span> width,
  <span class="pl-k">double</span> height,
  <span class="pl-c1">this</span>.margin,
  <span class="pl-c1">this</span>.padding,
  <span class="pl-c1">Color</span> color,
  <span class="pl-c1">this</span>.alignment,
  <span class="pl-c1">BoxConstraints</span> constraints,
  <span class="pl-c1">Decoration</span> decoration,
  <span class="pl-c1">this</span>.foregroundDecoration,
  <span class="pl-c1">this</span>.transform,
  <span class="pl-c1">this</span>.child,
})</pre></div>
<h4>2.1.1 <code>width</code>，<code>height</code>，<code>margin</code>，<code>padding</code></h4>
<p>这些属性的含义和我们已经熟知的并没有区别。唯一需要注意的是，<code>margin</code>和<code>padding</code>的赋值不是一个简单的数字，因为其有<code>left</code>, <code>top</code>, <code>right</code>, <code>bottom</code>四个方向的值需要设置。<code>Flutter</code>提供了<code>EdgeInsets</code>这个类，帮助我们方便地生成四个方向的值。通常情况下，我们可能会用到<code>EdgeInsets</code>的4种构造方法：</p>
<ul>
<li><code>EdgeInsets.all(value)</code>: 用于设置4个方向一样的值；</li>
<li><code>EdgeInsets.only(left: val1, top: val2, right: val3, bottom: val4)</code>: 可以单独设置某个方向的值；</li>
<li><code>EdgeInsets.symmetric(horizontal: val1, vertical: val2)</code>: 用于设置水平/垂直方向上的值；</li>
<li><code>EdgeInsets.fromLTRB(left, top, right, bottom)</code>: 按照左上右下的顺序设置4个方向的值。</li>
</ul>
<h4>2.1.2 <code>color</code></h4>
<p>该属性的含义是背景颜色，等同于web/rn中的backgroundColor。需要注意的是<code>Flutter</code>中有一个专门表示颜色的<code>Color</code>类，而非我们常用的字符串。不过我们可以非常轻松地进行转换，举个栗子：</p>
<p>在web/rn中我们会用<code>'#FF0000'</code>或<code>'red'</code>来表示红色，而在Flutter中，我们可以用<code>Color(0xFFFF0000)</code>或<code>Colors.red</code>来表示。</p>
<h4>2.1.3 <code>alignment</code></h4>
<p>该属性是用来决定<code>Container</code>组件的子组件将以何种方式进行排列（PS：再也不用为怎么居中操心了）。其可选值通常会用到：</p>
<ul>
<li><code>Alignment.topLeft</code>: 左上</li>
<li><code>Alignment.topCenter</code>: 上中</li>
<li><code>Alignment.topRight</code>: 右上</li>
<li><code>Alignment.centerLeft</code>: 左中</li>
<li><code>Alignment.center</code>: 居中</li>
<li><code>Alignment.centerRight</code>: 右中</li>
<li><code>Alignment.bottomLeft</code>: 左下</li>
<li><code>Alignment.bottomCenter</code>: 下中</li>
<li><code>Alignment.bottomRight</code>: 右下</li>
</ul>
<h4>2.1.4 <code>constraints</code></h4>
<p>在web/rn中我们通常会用<code>minWidth</code>/<code>maxWidth</code>/<code>minHeight</code>/<code>maxHeight</code>等属性来限制容器的宽高。在<code>Flutter</code>中，你需要使用<code>BoxConstraints</code>（盒约束）来实现该功能。</p>
<div class="highlight highlight-source-dart"><pre><span class="pl-c">// 容器的大小将被限制在[100*100 ~ 200*200]内</span>
<span class="pl-c1">BoxConstraints</span>(
  minWidth<span class="pl-k">:</span> <span class="pl-c1">100</span>,
  maxWidth<span class="pl-k">:</span> <span class="pl-c1">200</span>,
  minHeight<span class="pl-k">:</span> <span class="pl-c1">100</span>,
  maxHeight<span class="pl-k">:</span> <span class="pl-c1">200</span>,
)</pre></div>
<h4>2.1.5 <code>decoration</code></h4>
<p>该属性非常强大，字面意思是装饰，因为通过它你可以设置<code>边框</code>，<code>阴影</code>，<code>渐变</code>，<code>圆角</code>等常用属性。<code>BoxDecoration</code>继承自<code>Decoration</code>类，因此我们通常会生成一个<code>BoxDecoration</code>实例来设置这些属性。</p>
<p><strong>1) 边框</strong></p>
<p>可以用<code>Border.all</code>构造函数直接生成4条边框，也可以用<code>Border</code>构造函数单独设置不同方向上的边框。不过令人惊讶的是官方提供的边框竟然不支持<code>虚线</code>（<a href="https://github.com/flutter/flutter/issues/4858" data-hovercard-type="issue" data-hovercard-url="/flutter/flutter/issues/4858/hovercard">issue</a>在这里）。</p>
<div class="highlight highlight-source-dart"><pre><span class="pl-c">// 同时设置4条边框：1px粗细的黑色实线边框</span>
<span class="pl-c1">BoxDecoration</span>(
  border<span class="pl-k">:</span> <span class="pl-c1">Border</span>.<span class="pl-en">all</span>(color<span class="pl-k">:</span> <span class="pl-c1">Colors</span>.black, width<span class="pl-k">:</span> <span class="pl-c1">1</span>, style<span class="pl-k">:</span> <span class="pl-c1">BorderStyle</span>.solid)
)

<span class="pl-c">// 设置单边框：上边框为1px粗细的黑色实线边框，右边框为1px粗细的红色实线边框</span>
<span class="pl-c1">BoxDecoration</span>(
  border<span class="pl-k">:</span> <span class="pl-c1">Border</span>(
    top<span class="pl-k">:</span> <span class="pl-c1">BorderSide</span>(color<span class="pl-k">:</span> <span class="pl-c1">Colors</span>.black, width<span class="pl-k">:</span> <span class="pl-c1">1</span>, style<span class="pl-k">:</span> <span class="pl-c1">BorderStyle</span>.solid),
    right<span class="pl-k">:</span> <span class="pl-c1">BorderSide</span>(color<span class="pl-k">:</span> <span class="pl-c1">Colors</span>.red, width<span class="pl-k">:</span> <span class="pl-c1">1</span>, style<span class="pl-k">:</span> <span class="pl-c1">BorderStyle</span>.solid),
  ),
)</pre></div>
<p><strong>2) 阴影</strong></p>
<p>阴影属性和web中的<code>boxShadow</code>几乎没有区别，可以指定<code>x</code>，<code>y</code>，<code>blur</code>，<code>spread</code>，<code>color</code>等属性。</p>
<div class="highlight highlight-source-dart"><pre><span class="pl-c1">BoxDecoration</span>(
  boxShadow<span class="pl-k">:</span> [
    <span class="pl-c1">BoxShadow</span>(
      offset<span class="pl-k">:</span> <span class="pl-c1">Offset</span>(<span class="pl-c1">0</span>, <span class="pl-c1">0</span>),
      blurRadius<span class="pl-k">:</span> <span class="pl-c1">6</span>,
      spreadRadius<span class="pl-k">:</span> <span class="pl-c1">10</span>,
      color<span class="pl-k">:</span> <span class="pl-c1">Color</span>.<span class="pl-en">fromARGB</span>(<span class="pl-c1">20</span>, <span class="pl-c1">0</span>, <span class="pl-c1">0</span>, <span class="pl-c1">0</span>),
    ),
  ],
)</pre></div>
<p><strong>3) 渐变</strong></p>
<p>如果你不想容器的背景颜色是单调的，可以尝试用<code>gradient</code>属性。<code>Flutter</code>同时支持<code>线性渐变</code>和<code>径向渐变</code>：</p>
<div class="highlight highlight-source-dart"><pre><span class="pl-c">// 从左到右，红色到蓝色的线性渐变</span>
<span class="pl-c1">BoxDecoration</span>(
  gradient<span class="pl-k">:</span> <span class="pl-c1">LinearGradient</span>(
    begin<span class="pl-k">:</span> <span class="pl-c1">Alignment</span>.centerLeft,
    end<span class="pl-k">:</span> <span class="pl-c1">Alignment</span>.centerRight,
    colors<span class="pl-k">:</span> [<span class="pl-c1">Colors</span>.red, <span class="pl-c1">Colors</span>.blue],
  ),
)

<span class="pl-c">// 从中心向四周扩散，红色到蓝色的径向渐变</span>
<span class="pl-c1">BoxDecoration</span>(
  gradient<span class="pl-k">:</span> <span class="pl-c1">RadialGradient</span>(
    center<span class="pl-k">:</span> <span class="pl-c1">Alignment</span>.center,
    colors<span class="pl-k">:</span> [<span class="pl-c1">Colors</span>.red, <span class="pl-c1">Colors</span>.blue],
  ),
)</pre></div>
<p><strong>4) 圆角</strong></p>
<p>通常情况下，你可能会用到<code>BorderRadius.circular</code>构造函数来同时设置4个角的圆角，或是<code>BorderRadius.only</code>构造函数来单独设置某几个角的圆角：</p>
<div class="highlight highlight-source-dart"><pre><span class="pl-c">// 同时设置4个角的圆角为5</span>
<span class="pl-c1">BoxDecoration</span>(
  borderRadius<span class="pl-k">:</span> <span class="pl-c1">BorderRadius</span>.<span class="pl-en">circular</span>(<span class="pl-c1">5</span>),
)

<span class="pl-c">// 设置单圆角：左上角的圆角为5，右上角的圆角为10</span>
<span class="pl-c1">BoxDecoration</span>(
  borderRadius<span class="pl-k">:</span> <span class="pl-c1">BorderRadius</span>.<span class="pl-en">only</span>(
    topLeft<span class="pl-k">:</span> <span class="pl-c1">Radius</span>.<span class="pl-en">circular</span>(<span class="pl-c1">5</span>),
    topRight<span class="pl-k">:</span> <span class="pl-c1">Radius</span>.<span class="pl-en">circular</span>(<span class="pl-c1">10</span>),
  ),
)</pre></div>
<h4>2.1.6 <code>transform</code></h4>
<p><code>transform</code>属性和我们在web/rn中经常用到的基本也没有差别，主要包括：<code>平移</code>，<code>缩放</code>、<code>旋转</code>和<code>倾斜</code>。在Flutter中，封装了矩阵变换类<code>Matrix4</code>帮助我们进行变换：</p>
<ul>
<li><code>translationValues(x, y, z)</code>: 平移x, y, z；</li>
<li><code>rotationX(radians)</code>: x轴旋转radians弧度；</li>
<li><code>rotationY(radians)</code>: y轴旋转radians弧度；</li>
<li><code>rotationZ(radians)</code>: z轴旋转radians弧度；</li>
<li><code>skew(alpha, beta)</code>: x轴倾斜alpha度，y轴倾斜beta度；</li>
<li><code>skewX(alpha)</code>: x轴倾斜alpha度；</li>
<li><code>skewY(beta)</code>: y轴倾斜beta度；</li>
</ul>
<h4>2.1.7 小结</h4>
<p><code>Container</code>组件的属性很丰富，虽然有些用法上和web/rn有些许差异，但基本上大同小异，所以过渡起来也不会有什么障碍。另外，由于<code>Container</code>组件是单子节点组件，也就是只允许子节点有一个。所以在布局上，很多时候我们会用<code>Row</code>和<code>Column</code>组件进行<code>行</code>/<code>列</code>布局。</p>
<h3>2.2 Row/Column(行/列组件)</h3>
<div align="center">
  <a target="_blank" rel="noopener noreferrer" href="https://camo.githubusercontent.com/bdbffeb89e5a2caa0a5914c085e050295c47a967/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d306361353538303137343363323630632e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"><img width="500" src="https://camo.githubusercontent.com/bdbffeb89e5a2caa0a5914c085e050295c47a967/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d306361353538303137343363323630632e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430" data-canonical-src="https://upload-images.jianshu.io/upload_images/1990133-0ca55801743c260c.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240" style="max-width:100%;"></a>
</div>
<p><code>Row</code>和<code>Column</code>组件其实和web/rn中的<code>Flex布局</code>（弹性盒子）特别相似，或者我们可以就这么理解。使用<code>Flex布局</code>的同学对<code>主轴</code>和<code>次轴</code>的概念肯定都已经十分熟悉，<code>Row</code>组件的主轴就是横向，<code>Column</code>组件的主轴就是纵向。且它们的构造函数十分相似（已省略不常用属性）：</p>
<div class="highlight highlight-source-dart"><pre><span class="pl-c1">Row</span>({
  <span class="pl-c1">Key</span> key,
  <span class="pl-c1">MainAxisAlignment</span> mainAxisAlignment <span class="pl-k">=</span> <span class="pl-c1">MainAxisAlignment</span>.start,
  <span class="pl-c1">CrossAxisAlignment</span> crossAxisAlignment <span class="pl-k">=</span> <span class="pl-c1">CrossAxisAlignment</span>.center,
  <span class="pl-c1">MainAxisSize</span> mainAxisSize <span class="pl-k">=</span> <span class="pl-c1">MainAxisSize</span>.max,
  <span class="pl-c1">List</span><span class="pl-k">&lt;</span><span class="pl-c1">Widget</span><span class="pl-k">&gt;</span> children <span class="pl-k">=</span> <span class="pl-k">const</span> <span class="pl-k">&lt;</span><span class="pl-c1">Widget</span><span class="pl-k">&gt;</span>[],
})

<span class="pl-c1">Column</span>({
  <span class="pl-c1">Key</span> key,
  <span class="pl-c1">MainAxisAlignment</span> mainAxisAlignment <span class="pl-k">=</span> <span class="pl-c1">MainAxisAlignment</span>.start,
  <span class="pl-c1">CrossAxisAlignment</span> crossAxisAlignment <span class="pl-k">=</span> <span class="pl-c1">CrossAxisAlignment</span>.center,
  <span class="pl-c1">MainAxisSize</span> mainAxisSize <span class="pl-k">=</span> <span class="pl-c1">MainAxisSize</span>.max,
  <span class="pl-c1">List</span><span class="pl-k">&lt;</span><span class="pl-c1">Widget</span><span class="pl-k">&gt;</span> children <span class="pl-k">=</span> <span class="pl-k">const</span> <span class="pl-k">&lt;</span><span class="pl-c1">Widget</span><span class="pl-k">&gt;</span>[],
})</pre></div>
<h4>2.2.1 <code>mainAxisAlignment</code></h4>
<p>该属性的含义是主轴排列方式，根据上述构造函数可以知道<code>Row</code>和<code>Column</code>组件在主轴方向上默认都是从start开始，也就是说<code>Row</code>组件默认从左到右开始排列子组件，<code>Column</code>组件默认从上到下开始排列子组件。</p>
<p>当然，你还可以使用其他的可选值：</p>
<ul>
<li>MainAxisAlignment.start</li>
<li>MainAxisAlignment.end</li>
<li>MainAxisAlignment.center</li>
<li>MainAxisAlignment.spaceBetween</li>
<li>MainAxisAlignment.spaceAround</li>
<li>MainAxisAlignment.spaceEvenly</li>
</ul>
<h4>2.2.2 <code>crossAxisAlignment</code></h4>
<p>该属性的含义是次轴排列方式，根据上述构造函数可以知道<code>Row</code>和<code>Column</code>组件在次轴方向上默认都是居中。</p>
<p>这里有一点需要<strong>特别注意</strong>：由于<code>Column</code>组件次轴方向上（即水平）默认是居中对齐，所以水平方向上不会撑满其父容器，此时需要指定<code>CrossAxisAlignment.stretch</code>才可以。</p>
<p>另外，crossAxisAlignment其他的可选值有：</p>
<ul>
<li>crossAxisAlignment.start</li>
<li>crossAxisAlignment.end</li>
<li>crossAxisAlignment.center</li>
<li>crossAxisAlignment.stretch</li>
<li>crossAxisAlignment.baseline</li>
</ul>
<h4>2.2.3 <code>mainAxisSize</code></h4>
<p>字面意思上来说，该属性指的是在主轴上的尺寸。其实就是指在主轴方向上，是包裹其内容，还是撑满其父容器。它的可选值有<code>MainAxisSize.min</code>和<code>MainAxisSize.max</code>。由于其默认值都是<code>MainAxisSize.max</code>，所以主轴方向上默认大小都是尽可能撑满父容器的。</p>
<h4>2.2.4 小结</h4>
<p>由于<code>Row</code>/<code>Column</code>组件和我们熟悉的<code>Flex布局</code>非常相似，所以上手起来非常容易，几乎零学习成本。</p>
<h3>2.3 Stack/Positoned(绝对定位布局组件)</h3>
<div align="center">
  <a target="_blank" rel="noopener noreferrer" href="https://camo.githubusercontent.com/65c5464e64374868ce3e4482f15eeda4ab1a9300/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d396334616637356435616534646663342e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"><img width="500" src="https://camo.githubusercontent.com/65c5464e64374868ce3e4482f15eeda4ab1a9300/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d396334616637356435616534646663342e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430" data-canonical-src="https://upload-images.jianshu.io/upload_images/1990133-9c4af75d5ae4dfc4.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240" style="max-width:100%;"></a>
</div>
<p>绝对定位布局在web/rn开发中也是使用频率较高的一种布局方式，<code>Flutter</code>也提供了相应的组件实现，需要将<code>Stack</code>和<code>Positioned</code>组件搭配在一起使用。比如下方的这个例子就是创建了一个黄色的盒子，并且在其四个角落放置了4个红色的小正方形。<code>Stack</code>组件就是绝对定位的容器，<code>Positioned</code>组件通过<code>left</code>，<code>top </code>，<code>right</code>，<code>bottom</code>四个方向上的属性值来决定其在父容器中的位置。</p>
<div class="highlight highlight-source-dart"><pre><span class="pl-c1">Container</span>(
  height<span class="pl-k">:</span> <span class="pl-c1">100</span>,
  color<span class="pl-k">:</span> <span class="pl-c1">Colors</span>.yellow,
  child<span class="pl-k">:</span> <span class="pl-c1">Stack</span>(
    children<span class="pl-k">:</span> <span class="pl-k">&lt;</span><span class="pl-c1">Widget</span><span class="pl-k">&gt;</span>[
      <span class="pl-c1">Positioned</span>(
        left<span class="pl-k">:</span> <span class="pl-c1">10</span>,
        top<span class="pl-k">:</span> <span class="pl-c1">10</span>,
        child<span class="pl-k">:</span> <span class="pl-c1">Container</span>(width<span class="pl-k">:</span> <span class="pl-c1">10</span>, height<span class="pl-k">:</span> <span class="pl-c1">10</span>, color<span class="pl-k">:</span> <span class="pl-c1">Colors</span>.red),
      ),
      <span class="pl-c1">Positioned</span>(
        right<span class="pl-k">:</span> <span class="pl-c1">10</span>,
        top<span class="pl-k">:</span> <span class="pl-c1">10</span>,
        child<span class="pl-k">:</span> <span class="pl-c1">Container</span>(width<span class="pl-k">:</span> <span class="pl-c1">10</span>, height<span class="pl-k">:</span> <span class="pl-c1">10</span>, color<span class="pl-k">:</span> <span class="pl-c1">Colors</span>.red),
      ),
      <span class="pl-c1">Positioned</span>(
        left<span class="pl-k">:</span> <span class="pl-c1">10</span>,
        bottom<span class="pl-k">:</span> <span class="pl-c1">10</span>,
        child<span class="pl-k">:</span> <span class="pl-c1">Container</span>(width<span class="pl-k">:</span> <span class="pl-c1">10</span>, height<span class="pl-k">:</span> <span class="pl-c1">10</span>, color<span class="pl-k">:</span> <span class="pl-c1">Colors</span>.red),
      ),
      <span class="pl-c1">Positioned</span>(
        right<span class="pl-k">:</span> <span class="pl-c1">10</span>,
        bottom<span class="pl-k">:</span> <span class="pl-c1">10</span>,
        child<span class="pl-k">:</span> <span class="pl-c1">Container</span>(width<span class="pl-k">:</span> <span class="pl-c1">10</span>, height<span class="pl-k">:</span> <span class="pl-c1">10</span>, color<span class="pl-k">:</span> <span class="pl-c1">Colors</span>.red),
      ),
    ],
  ),
)</pre></div>
<h3>2.4 Text（文本组件）</h3>
<div align="center">
  <a target="_blank" rel="noopener noreferrer" href="https://camo.githubusercontent.com/8c6ba39d87c0162305ba221d30796700890bcfe8/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d626565373531333962646630353233622e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"><img width="500" src="https://camo.githubusercontent.com/8c6ba39d87c0162305ba221d30796700890bcfe8/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d626565373531333962646630353233622e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430" data-canonical-src="https://upload-images.jianshu.io/upload_images/1990133-bee75139bdf0523b.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240" style="max-width:100%;"></a>
</div>
<p><code>Text</code>组件也是日常开发中最常用的基础组件之一，我们通常用它来展示文本信息。来看下其构造函数（已省略不常用属性）：</p>
<div class="highlight highlight-source-dart"><pre><span class="pl-k">const</span> <span class="pl-c1">Text</span>(
  <span class="pl-c1">this</span>.data, {
  <span class="pl-c1">Key</span> key,
  <span class="pl-c1">this</span>.style,
  <span class="pl-c1">this</span>.textAlign,
  <span class="pl-c1">this</span>.softWrap,
  <span class="pl-c1">this</span>.overflow,
  <span class="pl-c1">this</span>.maxLines,
})</pre></div>
<ul>
<li><code>data</code>: 显示的文本信息；</li>
<li><code>style</code>: 文本样式，<code>Flutter</code>提供了一个<code>TextStyle</code>类，最常用的<code>fontSize</code>，<code>fontWeight</code>，<code>color</code>，<code>backgroundColor</code>和<code>shadows</code>等属性都是通过它设置的；</li>
<li><code>textAlign</code>: 文字对齐方式，常用可选值有<code>TextAlign</code>的<code>left</code>，<code>right</code>，<code>center</code>和<code>justify</code>；</li>
<li><code>softWrap</code>: 文字是否换行；</li>
<li><code>overflow</code>: 当文字溢出的时候，以何种方式处理（默认直接截断）。可选值有<code>TextOverflow</code>的<code>clip</code>，<code>fade</code>，<code>ellipsis</code>和<code>visible</code>；</li>
<li><code>maxLines</code>: 当文字超过最大行数还没显示完的时候，就会根据<code>overflow</code>属性决定如何截断处理。</li>
</ul>
<p><code>Flutter</code>的<code>Text</code>组件足够灵活，提供了各种属性让我们定制，不过一般情况下，我们更多地只需下方几行代码就足够了：</p>
<div class="highlight highlight-source-dart"><pre><span class="pl-c1">Text</span>(
  <span class="pl-s">'这是测试文本'</span>,
  style<span class="pl-k">:</span> <span class="pl-c1">TextStyle</span>(
    fontSize<span class="pl-k">:</span> <span class="pl-c1">13</span>,
    fontWeight<span class="pl-k">:</span> <span class="pl-c1">FontWeight</span>.bold,
    color<span class="pl-k">:</span> <span class="pl-c1">Color</span>(<span class="pl-c1">0xFF999999</span>),
  ),
)</pre></div>
<p>除了上述的应用场景外，有时我们还会遇到<code>富文本</code>的需求（即一段文本中，可能需要不同的字体样式）。比如在一些UI设计中经常会遇到表示价格的时候，<code>￥</code>符号比<code>金额</code>的字号小点。对于此类需求，我们可以用<code>Flutter</code>提供的<code>Text.rich</code>构造函数来创建相应的文本组件：</p>
<div class="highlight highlight-source-dart"><pre><span class="pl-c1">Text</span>.<span class="pl-en">rich</span>(<span class="pl-c1">TextSpan</span>(
  children<span class="pl-k">:</span> [
    <span class="pl-c1">TextSpan</span>(
      <span class="pl-s">'￥'</span>,
      style<span class="pl-k">:</span> <span class="pl-c1">TextStyle</span>(
        fontSize<span class="pl-k">:</span> <span class="pl-c1">12</span>,
        color<span class="pl-k">:</span> <span class="pl-c1">Color</span>(<span class="pl-c1">0xFFFF7528</span>),
      ),
    ),
    <span class="pl-c1">TextSpan</span>(
      <span class="pl-s">'258'</span>,
      style<span class="pl-k">:</span> <span class="pl-c1">TextStyle</span>(
        fontSize<span class="pl-k">:</span> <span class="pl-c1">15</span>,
        color<span class="pl-k">:</span> <span class="pl-c1">Color</span>(<span class="pl-c1">0xFFFF7528</span>),
      ),
    ),
  ]
))</pre></div>
<h3>2.5 Image(图片组件)</h3>
<div align="center">
  <a target="_blank" rel="noopener noreferrer" href="https://camo.githubusercontent.com/2c61d89c4e73df6ae5aba8c9456be1327f1550a0/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d633238623936366337323666623931632e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"><img width="500" src="https://camo.githubusercontent.com/2c61d89c4e73df6ae5aba8c9456be1327f1550a0/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d633238623936366337323666623931632e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430" data-canonical-src="https://upload-images.jianshu.io/upload_images/1990133-c28b966c726fb91c.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240" style="max-width:100%;"></a>
</div>
<p><code>Image</code>图片组件作为丰富内容的基础组件之一，日常开发中的使用频率也非常高。看下其构造函数（已省略不常用属性）：</p>
<div class="highlight highlight-source-dart"><pre><span class="pl-c1">Image</span>({
  <span class="pl-c1">Key</span> key,
  <span class="pl-k">@required</span> <span class="pl-c1">this</span>.image,
  <span class="pl-c1">this</span>.width,
  <span class="pl-c1">this</span>.height,
  <span class="pl-c1">this</span>.color,
  <span class="pl-c1">this</span>.fit,
  <span class="pl-c1">this</span>.repeat <span class="pl-k">=</span> <span class="pl-c1">ImageRepeat</span>.noRepeat,
})</pre></div>
<ul>
<li><code>image</code>: 图片源，最常用到主要有两种（<code>AssetImage</code>和<code>NetworkImage</code>）。使用<code>AssetImage</code>之前，需要在<code>pubspec.yaml</code>文件中声明好图片资源，然后才能使用；而<code>NextworkImage</code>指定图片的网络地址即可，主要是在加载一些网络图片时会用到；</li>
<li><code>width</code>: 图片宽度；</li>
<li><code>height</code>: 图片高度；</li>
<li><code>color</code>: 图片的背景颜色，当网络图片未加载完毕之前，会显示该背景颜色；</li>
<li><code>fit</code>: 当我们希望图片根据容器大小进行适配而不是指定固定的宽高值时，可以通过该属性来实现。其可选值有<code>BoxFit</code>的<code>fill</code>，<code>contain</code>，<code>cover</code>，<code>fitWidth</code>，<code>fitHeight</code>，<code>none</code>和<code>scaleDown</code>；</li>
<li><code>repeat</code>: 决定当图片实际大小不足指定大小时是否使用重复效果。</li>
</ul>
<p>另外，<code>Flutter</code>还提供了<code>Image.network</code>和<code>Image.asset</code>构造函数，其实是语法糖。比如下方的两段代码结果是完全一样的：</p>
<div class="highlight highlight-source-dart"><pre><span class="pl-c1">Image</span>(
  image<span class="pl-k">:</span> <span class="pl-c1">NetworkImage</span>(<span class="pl-s">'https://ss1.bdstatic.com/70cFuXSh_Q1YnxGkpoWK1HF6hhy/it/u=1402367109,4157195964&amp;fm=27&amp;gp=0.jpg'</span>),
  width<span class="pl-k">:</span> <span class="pl-c1">100</span>,
  height<span class="pl-k">:</span> <span class="pl-c1">100</span>,
)

<span class="pl-c1">Image</span>.<span class="pl-en">network</span>(
  <span class="pl-s">'https://ss1.bdstatic.com/70cFuXSh_Q1YnxGkpoWK1HF6hhy/it/u=1402367109,4157195964&amp;fm=27&amp;gp=0.jpg'</span>,
  width<span class="pl-k">:</span> <span class="pl-c1">100</span>,
  height<span class="pl-k">:</span> <span class="pl-c1">100</span>,
)</pre></div>
<h3>2.6 <code>Icon</code>(图标组件)</h3>
<div align="center">
  <a target="_blank" rel="noopener noreferrer" href="https://camo.githubusercontent.com/df6eab7e8b378b6d52b0207da1f8fbf0eccbd0c3/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d373136613931626262316463316435332e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"><img width="500" src="https://camo.githubusercontent.com/df6eab7e8b378b6d52b0207da1f8fbf0eccbd0c3/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d373136613931626262316463316435332e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430" data-canonical-src="https://upload-images.jianshu.io/upload_images/1990133-716a91bbb1dc1d53.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240" style="max-width:100%;"></a>
</div>
<p><code>Icon</code>图标组件相比于图片有着放大不会失真的优势，在日常开发中也是经常会被用到。<code>Flutter</code>更是直接内置了一套<code>Material</code>风格的图标（你可以在<a href="https://api.flutter.dev/flutter/material/Icons-class.html#constants" rel="nofollow">这里</a>预览所有的图标类型）。看下构造函数：</p>
<div class="highlight highlight-source-dart"><pre><span class="pl-k">const</span> <span class="pl-c1">Icon</span>(
  <span class="pl-c1">this</span>.icon, {
  <span class="pl-c1">Key</span> key,
  <span class="pl-c1">this</span>.size,
  <span class="pl-c1">this</span>.color,
})</pre></div>
<ul>
<li><code>icon</code>: 图标类型；</li>
<li><code>size</code>: 图标大小；</li>
<li><code>color</code>: 图标颜色。</li>
</ul>
<h2>3. 布局实战</h2>
<p>通过上一节的介绍，我们对<code>Container</code>，<code>Row</code>，<code>Column</code>，<code>Stack</code>，<code>Positioned</code>，<code>Text</code>，<code>Image</code>和<code>Icon</code>组件有了初步的认识。接下来，就让我们通过一个实际的例子来加深理解和记忆。</p>
<div align="center">
  <a target="_blank" rel="noopener noreferrer" href="https://camo.githubusercontent.com/cc54abdf4d9109c693a4a4fc5bbf7e280af7cbfa/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d643666663539663130323864336234622e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"><img height="350" src="https://camo.githubusercontent.com/cc54abdf4d9109c693a4a4fc5bbf7e280af7cbfa/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d643666663539663130323864336234622e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430" data-canonical-src="https://upload-images.jianshu.io/upload_images/1990133-d6ff59f1028d3b4b.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240" style="max-width:100%;"></a>
</div>
<h3>3.1 准备工作 - 数据类型</h3>
<p>根据上述卡片中的内容，我们可以定义一些字段。为了规范开发流程，我们先给卡片定义一个数据类型的类，这样在后续的开发过程中也能更好地对数据进行Mock和管理：</p>
<div class="highlight highlight-source-dart"><pre><span class="pl-k">class</span> <span class="pl-c1">PetCardViewModel</span> {
  <span class="pl-c">///</span><span class="pl-c"> 封面地址</span>
  <span class="pl-k">final</span> <span class="pl-c1">String</span> coverUrl;

  <span class="pl-c">///</span><span class="pl-c"> 用户头像地址</span>
  <span class="pl-k">final</span> <span class="pl-c1">String</span> userImgUrl;

  <span class="pl-c">///</span><span class="pl-c"> 用户名</span>
  <span class="pl-k">final</span> <span class="pl-c1">String</span> userName;

  <span class="pl-c">///</span><span class="pl-c"> 用户描述</span>
  <span class="pl-k">final</span> <span class="pl-c1">String</span> description;

  <span class="pl-c">///</span><span class="pl-c"> 话题</span>
  <span class="pl-k">final</span> <span class="pl-c1">String</span> topic;

  <span class="pl-c">///</span><span class="pl-c"> 发布时间</span>
  <span class="pl-k">final</span> <span class="pl-c1">String</span> publishTime;

  <span class="pl-c">///</span><span class="pl-c"> 发布内容</span>
  <span class="pl-k">final</span> <span class="pl-c1">String</span> publishContent;

  <span class="pl-c">///</span><span class="pl-c"> 回复数量</span>
  <span class="pl-k">final</span> <span class="pl-k">int</span> replies;

  <span class="pl-c">///</span><span class="pl-c"> 喜欢数量</span>
  <span class="pl-k">final</span> <span class="pl-k">int</span> likes;

  <span class="pl-c">///</span><span class="pl-c"> 分享数量</span>
  <span class="pl-k">final</span> <span class="pl-k">int</span> shares;

  <span class="pl-k">const</span> <span class="pl-c1">PetCardViewModel</span>({
    <span class="pl-c1">this</span>.coverUrl,
    <span class="pl-c1">this</span>.userImgUrl,
    <span class="pl-c1">this</span>.userName,
    <span class="pl-c1">this</span>.description,
    <span class="pl-c1">this</span>.topic,
    <span class="pl-c1">this</span>.publishTime,
    <span class="pl-c1">this</span>.publishContent,
    <span class="pl-c1">this</span>.replies,
    <span class="pl-c1">this</span>.likes,
    <span class="pl-c1">this</span>.shares,
  });
}</pre></div>
<h3>3.2 搭建骨架，布局拆分</h3>
<div align="center">
  <a target="_blank" rel="noopener noreferrer" href="https://camo.githubusercontent.com/03e8cd93acc329b8c7bab058a560605ca11d5e3c/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d383138653837306464666364366638332e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"><img height="350" src="https://camo.githubusercontent.com/03e8cd93acc329b8c7bab058a560605ca11d5e3c/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d383138653837306464666364366638332e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430" data-canonical-src="https://upload-images.jianshu.io/upload_images/1990133-818e870ddfcd6f83.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240" style="max-width:100%;"></a>
</div>
<p>根据给的视觉图，我们可以将整体进行拆分，一共划分成4个部分：<code>Cover</code>，<code>UserInfo</code>，<code>PublishContent</code>和<code>InteractionArea</code>。为此，我们可以搭起代码的基本骨架：</p>
<div class="highlight highlight-source-dart"><pre><span class="pl-k">class</span> <span class="pl-c1">PetCard</span> <span class="pl-k">extends</span> <span class="pl-c1">StatelessWidget</span> {
  <span class="pl-k">final</span> <span class="pl-c1">PetCardViewModel</span> data;

  <span class="pl-k">const</span> <span class="pl-c1">PetCard</span>({
    <span class="pl-c1">Key</span> key,
    <span class="pl-c1">this</span>.data,
  }) <span class="pl-k">:</span> <span class="pl-c1">super</span>(key<span class="pl-k">:</span> key);

  <span class="pl-c1">Widget</span> <span class="pl-en">renderCover</span>() {
    
  }

  <span class="pl-c1">Widget</span> <span class="pl-en">renderUserInfo</span>() {
    
  }

  <span class="pl-c1">Widget</span> <span class="pl-en">renderPublishContent</span>() {
  
  }

  <span class="pl-c1">Widget</span> <span class="pl-en">renderInteractionArea</span>() {
   
  }

  <span class="pl-k">@override</span>
  <span class="pl-c1">Widget</span> <span class="pl-en">build</span>(<span class="pl-c1">BuildContext</span> context) {
    <span class="pl-k">return</span> <span class="pl-c1">Container</span>(
      margin<span class="pl-k">:</span> <span class="pl-c1">EdgeInsets</span>.<span class="pl-en">all</span>(<span class="pl-c1">16</span>),
      decoration<span class="pl-k">:</span> <span class="pl-c1">BoxDecoration</span>(
        color<span class="pl-k">:</span> <span class="pl-c1">Colors</span>.white,
        borderRadius<span class="pl-k">:</span> <span class="pl-c1">BorderRadius</span>.<span class="pl-en">circular</span>(<span class="pl-c1">8</span>),
        boxShadow<span class="pl-k">:</span> [
          <span class="pl-c1">BoxShadow</span>(
            blurRadius<span class="pl-k">:</span> <span class="pl-c1">6</span>,
            spreadRadius<span class="pl-k">:</span> <span class="pl-c1">4</span>,
            color<span class="pl-k">:</span> <span class="pl-c1">Color</span>.<span class="pl-en">fromARGB</span>(<span class="pl-c1">20</span>, <span class="pl-c1">0</span>, <span class="pl-c1">0</span>, <span class="pl-c1">0</span>),
          ),
        ],
      ),
      child<span class="pl-k">:</span> <span class="pl-c1">Column</span>(
        crossAxisAlignment<span class="pl-k">:</span> <span class="pl-c1">CrossAxisAlignment</span>.stretch,
        children<span class="pl-k">:</span> <span class="pl-k">&lt;</span><span class="pl-c1">Widget</span><span class="pl-k">&gt;</span>[
          <span class="pl-c1">this</span>.<span class="pl-en">renderCover</span>(),
          <span class="pl-c1">this</span>.<span class="pl-en">renderUserInfo</span>(),
          <span class="pl-c1">this</span>.<span class="pl-en">renderPublishContent</span>(),
          <span class="pl-c1">this</span>.<span class="pl-en">renderInteractionArea</span>(),
        ],
      ),
    );
  }
}</pre></div>
<h3>3.3 封面区域</h3>
<p>为了更好的凸现图片的效果，这里加了一个蒙层，所以此处刚好可以用得上<code>Stack</code>/<code>Positioned</code>布局和<code>LinearGradient</code>渐变，Dom结构如下：</p>
<p><a target="_blank" rel="noopener noreferrer" href="https://camo.githubusercontent.com/1722fe4fe7492333a1df23dc8dd72b996872f632/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d656265626663353562333237656137302e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"><img src="https://camo.githubusercontent.com/1722fe4fe7492333a1df23dc8dd72b996872f632/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d656265626663353562333237656137302e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430" alt="cover" data-canonical-src="https://upload-images.jianshu.io/upload_images/1990133-ebebfc55b327ea70.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240" style="max-width:100%;"></a></p>
<div class="highlight highlight-source-dart"><pre><span class="pl-c1">Widget</span> <span class="pl-en">renderCover</span>() {
  <span class="pl-k">return</span> <span class="pl-c1">Stack</span>(
    fit<span class="pl-k">:</span> <span class="pl-c1">StackFit</span>.passthrough,
    children<span class="pl-k">:</span> <span class="pl-k">&lt;</span><span class="pl-c1">Widget</span><span class="pl-k">&gt;</span>[
      <span class="pl-c1">ClipRRect</span>(
        borderRadius<span class="pl-k">:</span> <span class="pl-c1">BorderRadius</span>.<span class="pl-en">only</span>(
          topLeft<span class="pl-k">:</span> <span class="pl-c1">Radius</span>.<span class="pl-en">circular</span>(<span class="pl-c1">8</span>),
          topRight<span class="pl-k">:</span> <span class="pl-c1">Radius</span>.<span class="pl-en">circular</span>(<span class="pl-c1">8</span>),
        ),
        child<span class="pl-k">:</span> <span class="pl-c1">Image</span>.<span class="pl-en">network</span>(
          data.coverUrl,
          height<span class="pl-k">:</span> <span class="pl-c1">200</span>,
          fit<span class="pl-k">:</span> <span class="pl-c1">BoxFit</span>.fitWidth,
        ),
      ),
      <span class="pl-c1">Positioned</span>(
        left<span class="pl-k">:</span> <span class="pl-c1">0</span>,
        top<span class="pl-k">:</span> <span class="pl-c1">100</span>,
        right<span class="pl-k">:</span> <span class="pl-c1">0</span>,
        bottom<span class="pl-k">:</span> <span class="pl-c1">0</span>,
        child<span class="pl-k">:</span> <span class="pl-c1">Container</span>(
          decoration<span class="pl-k">:</span> <span class="pl-c1">BoxDecoration</span>(
            gradient<span class="pl-k">:</span> <span class="pl-c1">LinearGradient</span>(
              begin<span class="pl-k">:</span> <span class="pl-c1">Alignment</span>.topCenter,
              end<span class="pl-k">:</span> <span class="pl-c1">Alignment</span>.bottomCenter,
              colors<span class="pl-k">:</span> [
                <span class="pl-c1">Color</span>.<span class="pl-en">fromARGB</span>(<span class="pl-c1">0</span>, <span class="pl-c1">0</span>, <span class="pl-c1">0</span>, <span class="pl-c1">0</span>),
                <span class="pl-c1">Color</span>.<span class="pl-en">fromARGB</span>(<span class="pl-c1">80</span>, <span class="pl-c1">0</span>, <span class="pl-c1">0</span>, <span class="pl-c1">0</span>),
              ],
            ),
          ),
        ),
      ),
    ],
  );
}</pre></div>
<h3>3.4 用户信息区域</h3>
<p>用户信息区域就非常适合使用<code>Row</code>和<code>Column</code>组件来进行布局，Dom结构如下：</p>
<p><a target="_blank" rel="noopener noreferrer" href="https://camo.githubusercontent.com/d84922fe725417bba85eb4eab931c3795f0c89c1/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d623135353039303138646532663163652e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"><img src="https://camo.githubusercontent.com/d84922fe725417bba85eb4eab931c3795f0c89c1/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d623135353039303138646532663163652e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430" alt="user-info" data-canonical-src="https://upload-images.jianshu.io/upload_images/1990133-b15509018de2f1ce.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240" style="max-width:100%;"></a></p>
<div class="highlight highlight-source-dart"><pre><span class="pl-c1">Widget</span> <span class="pl-en">renderUserInfo</span>() {
  <span class="pl-k">return</span> <span class="pl-c1">Container</span>(
    margin<span class="pl-k">:</span> <span class="pl-c1">EdgeInsets</span>.<span class="pl-en">only</span>(top<span class="pl-k">:</span> <span class="pl-c1">16</span>),
    padding<span class="pl-k">:</span> <span class="pl-c1">EdgeInsets</span>.<span class="pl-en">symmetric</span>(horizontal<span class="pl-k">:</span> <span class="pl-c1">16</span>),
    child<span class="pl-k">:</span> <span class="pl-c1">Row</span>(
      crossAxisAlignment<span class="pl-k">:</span> <span class="pl-c1">CrossAxisAlignment</span>.start,
      mainAxisAlignment<span class="pl-k">:</span> <span class="pl-c1">MainAxisAlignment</span>.spaceBetween,
      children<span class="pl-k">:</span> <span class="pl-k">&lt;</span><span class="pl-c1">Widget</span><span class="pl-k">&gt;</span>[
        <span class="pl-c1">Row</span>(
          children<span class="pl-k">:</span> <span class="pl-k">&lt;</span><span class="pl-c1">Widget</span><span class="pl-k">&gt;</span>[
            <span class="pl-c1">CircleAvatar</span>(
              radius<span class="pl-k">:</span> <span class="pl-c1">20</span>,
              backgroundColor<span class="pl-k">:</span> <span class="pl-c1">Color</span>(<span class="pl-c1">0xFFCCCCCC</span>),
              backgroundImage<span class="pl-k">:</span> <span class="pl-c1">NetworkImage</span>(data.userImgUrl),
            ),
            <span class="pl-c1">Padding</span>(padding<span class="pl-k">:</span> <span class="pl-c1">EdgeInsets</span>.<span class="pl-en">only</span>(left<span class="pl-k">:</span> <span class="pl-c1">8</span>)),
            <span class="pl-c1">Column</span>(
              crossAxisAlignment<span class="pl-k">:</span> <span class="pl-c1">CrossAxisAlignment</span>.start,
              children<span class="pl-k">:</span> <span class="pl-k">&lt;</span><span class="pl-c1">Widget</span><span class="pl-k">&gt;</span>[
                <span class="pl-c1">Text</span>(
                  data.userName,
                  style<span class="pl-k">:</span> <span class="pl-c1">TextStyle</span>(
                    fontSize<span class="pl-k">:</span> <span class="pl-c1">15</span>,
                    fontWeight<span class="pl-k">:</span> <span class="pl-c1">FontWeight</span>.bold,
                    color<span class="pl-k">:</span> <span class="pl-c1">Color</span>(<span class="pl-c1">0xFF333333</span>),
                  ),
                ),
                <span class="pl-c1">Padding</span>(padding<span class="pl-k">:</span> <span class="pl-c1">EdgeInsets</span>.<span class="pl-en">only</span>(top<span class="pl-k">:</span> <span class="pl-c1">2</span>)),
                <span class="pl-c1">Text</span>(
                  data.description,
                  style<span class="pl-k">:</span> <span class="pl-c1">TextStyle</span>(
                    fontSize<span class="pl-k">:</span> <span class="pl-c1">12</span>,
                    color<span class="pl-k">:</span> <span class="pl-c1">Color</span>(<span class="pl-c1">0xFF999999</span>),
                  ),
                ),
              ],
            ),
          ],
        ),
        <span class="pl-c1">Text</span>(
          data.publishTime,
          style<span class="pl-k">:</span> <span class="pl-c1">TextStyle</span>(
            fontSize<span class="pl-k">:</span> <span class="pl-c1">13</span>,
            color<span class="pl-k">:</span> <span class="pl-c1">Color</span>(<span class="pl-c1">0xFF999999</span>),
          ),
        ),
      ],
    ),
  );
}</pre></div>
<h3>3.5 发布内容区域</h3>
<p>通过这块区域的UI练习，我们可以实践<code>Container</code>组件设置不同的<code>borderRadius</code>，以及<code>Text</code>组件文本内容超出时的截断处理，Dom结构如下：</p>
<p><a target="_blank" rel="noopener noreferrer" href="https://camo.githubusercontent.com/b294435613447d923dcafb8d96e6a00055c7c925/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d323837653933333639626636353235392e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"><img src="https://camo.githubusercontent.com/b294435613447d923dcafb8d96e6a00055c7c925/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d323837653933333639626636353235392e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430" alt="publish-content" data-canonical-src="https://upload-images.jianshu.io/upload_images/1990133-287e93369bf65259.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240" style="max-width:100%;"></a></p>
<div class="highlight highlight-source-dart"><pre><span class="pl-c1">Widget</span> <span class="pl-en">renderPublishContent</span>() {
  <span class="pl-k">return</span> <span class="pl-c1">Container</span>(
    margin<span class="pl-k">:</span> <span class="pl-c1">EdgeInsets</span>.<span class="pl-en">only</span>(top<span class="pl-k">:</span> <span class="pl-c1">16</span>),
    padding<span class="pl-k">:</span> <span class="pl-c1">EdgeInsets</span>.<span class="pl-en">symmetric</span>(horizontal<span class="pl-k">:</span> <span class="pl-c1">16</span>),
    child<span class="pl-k">:</span> <span class="pl-c1">Column</span>(
      crossAxisAlignment<span class="pl-k">:</span> <span class="pl-c1">CrossAxisAlignment</span>.start,
      children<span class="pl-k">:</span> <span class="pl-k">&lt;</span><span class="pl-c1">Widget</span><span class="pl-k">&gt;</span>[
        <span class="pl-c1">Container</span>(
          margin<span class="pl-k">:</span> <span class="pl-c1">EdgeInsets</span>.<span class="pl-en">only</span>(bottom<span class="pl-k">:</span> <span class="pl-c1">14</span>),
          padding<span class="pl-k">:</span> <span class="pl-c1">EdgeInsets</span>.<span class="pl-en">symmetric</span>(horizontal<span class="pl-k">:</span> <span class="pl-c1">8</span>, vertical<span class="pl-k">:</span> <span class="pl-c1">2</span>),
          decoration<span class="pl-k">:</span> <span class="pl-c1">BoxDecoration</span>(
            color<span class="pl-k">:</span> <span class="pl-c1">Color</span>(<span class="pl-c1">0xFFFFC600</span>),
            borderRadius<span class="pl-k">:</span> <span class="pl-c1">BorderRadius</span>.<span class="pl-en">only</span>(
              topRight<span class="pl-k">:</span> <span class="pl-c1">Radius</span>.<span class="pl-en">circular</span>(<span class="pl-c1">8</span>),
              bottomLeft<span class="pl-k">:</span> <span class="pl-c1">Radius</span>.<span class="pl-en">circular</span>(<span class="pl-c1">8</span>),
              bottomRight<span class="pl-k">:</span> <span class="pl-c1">Radius</span>.<span class="pl-en">circular</span>(<span class="pl-c1">8</span>),
            ),
          ),
          child<span class="pl-k">:</span> <span class="pl-c1">Text</span>(
            <span class="pl-s">'# ${<span class="pl-v">data.topic</span>}'</span>,
            style<span class="pl-k">:</span> <span class="pl-c1">TextStyle</span>(
              fontSize<span class="pl-k">:</span> <span class="pl-c1">12</span>,
              color<span class="pl-k">:</span> <span class="pl-c1">Colors</span>.white,
            ),
          ),
        ),
        <span class="pl-c1">Text</span>(
          data.publishContent,
          maxLines<span class="pl-k">:</span> <span class="pl-c1">2</span>,
          overflow<span class="pl-k">:</span> <span class="pl-c1">TextOverflow</span>.ellipsis,
          style<span class="pl-k">:</span> <span class="pl-c1">TextStyle</span>(
            fontSize<span class="pl-k">:</span> <span class="pl-c1">15</span>,
            fontWeight<span class="pl-k">:</span> <span class="pl-c1">FontWeight</span>.bold,
            color<span class="pl-k">:</span> <span class="pl-c1">Color</span>(<span class="pl-c1">0xFF333333</span>),
          ),
        ),
      ],
    ),
  );
}</pre></div>
<h3>3.6 互动区域</h3>
<p>在这个模块，我们会用到<code>Icon</code>图标组件，可以控制其大小和颜色等属性，Dom结构如下：</p>
<p><a target="_blank" rel="noopener noreferrer" href="https://camo.githubusercontent.com/4875f81452b9eaf636e803735adf3109b332a09f/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d383465646463623734616163633132312e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"><img src="https://camo.githubusercontent.com/4875f81452b9eaf636e803735adf3109b332a09f/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d383465646463623734616163633132312e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430" alt="interaction-area" data-canonical-src="https://upload-images.jianshu.io/upload_images/1990133-84eddcb74aacc121.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240" style="max-width:100%;"></a></p>
<div class="highlight highlight-source-dart"><pre><span class="pl-c1">Widget</span> <span class="pl-en">renderInteractionArea</span>() {
  <span class="pl-k">return</span> <span class="pl-c1">Container</span>(
    margin<span class="pl-k">:</span> <span class="pl-c1">EdgeInsets</span>.<span class="pl-en">symmetric</span>(vertical<span class="pl-k">:</span> <span class="pl-c1">16</span>),
    padding<span class="pl-k">:</span> <span class="pl-c1">EdgeInsets</span>.<span class="pl-en">symmetric</span>(horizontal<span class="pl-k">:</span> <span class="pl-c1">16</span>),
    child<span class="pl-k">:</span> <span class="pl-c1">Row</span>(
      mainAxisAlignment<span class="pl-k">:</span> <span class="pl-c1">MainAxisAlignment</span>.spaceBetween,
      children<span class="pl-k">:</span> <span class="pl-k">&lt;</span><span class="pl-c1">Widget</span><span class="pl-k">&gt;</span>[
        <span class="pl-c1">Row</span>(
          children<span class="pl-k">:</span> <span class="pl-k">&lt;</span><span class="pl-c1">Widget</span><span class="pl-k">&gt;</span>[
            <span class="pl-c1">Icon</span>(
              <span class="pl-c1">Icons</span>.message,
              size<span class="pl-k">:</span> <span class="pl-c1">16</span>,
              color<span class="pl-k">:</span> <span class="pl-c1">Color</span>(<span class="pl-c1">0xFF999999</span>),
            ),
            <span class="pl-c1">Padding</span>(padding<span class="pl-k">:</span> <span class="pl-c1">EdgeInsets</span>.<span class="pl-en">only</span>(left<span class="pl-k">:</span> <span class="pl-c1">6</span>)),
            <span class="pl-c1">Text</span>(
              data.replies.<span class="pl-en">toString</span>(),
              style<span class="pl-k">:</span> <span class="pl-c1">TextStyle</span>(
                fontSize<span class="pl-k">:</span> <span class="pl-c1">15</span>,
                color<span class="pl-k">:</span> <span class="pl-c1">Color</span>(<span class="pl-c1">0xFF999999</span>),
              ),
            ),
          ],
        ),
        <span class="pl-c1">Row</span>(
          children<span class="pl-k">:</span> <span class="pl-k">&lt;</span><span class="pl-c1">Widget</span><span class="pl-k">&gt;</span>[
            <span class="pl-c1">Icon</span>(
              <span class="pl-c1">Icons</span>.favorite,
              size<span class="pl-k">:</span> <span class="pl-c1">16</span>,
              color<span class="pl-k">:</span> <span class="pl-c1">Color</span>(<span class="pl-c1">0xFFFFC600</span>),
            ),
            <span class="pl-c1">Padding</span>(padding<span class="pl-k">:</span> <span class="pl-c1">EdgeInsets</span>.<span class="pl-en">only</span>(left<span class="pl-k">:</span> <span class="pl-c1">6</span>)),
            <span class="pl-c1">Text</span>(
              data.likes.<span class="pl-en">toString</span>(),
              style<span class="pl-k">:</span> <span class="pl-c1">TextStyle</span>(
                fontSize<span class="pl-k">:</span> <span class="pl-c1">15</span>,
                color<span class="pl-k">:</span> <span class="pl-c1">Color</span>(<span class="pl-c1">0xFF999999</span>),
              ),
            ),
          ],
        ),
        <span class="pl-c1">Row</span>(
          children<span class="pl-k">:</span> <span class="pl-k">&lt;</span><span class="pl-c1">Widget</span><span class="pl-k">&gt;</span>[
            <span class="pl-c1">Icon</span>(
              <span class="pl-c1">Icons</span>.share,
              size<span class="pl-k">:</span> <span class="pl-c1">16</span>,
              color<span class="pl-k">:</span> <span class="pl-c1">Color</span>(<span class="pl-c1">0xFF999999</span>),
            ),
            <span class="pl-c1">Padding</span>(padding<span class="pl-k">:</span> <span class="pl-c1">EdgeInsets</span>.<span class="pl-en">only</span>(left<span class="pl-k">:</span> <span class="pl-c1">6</span>)),
            <span class="pl-c1">Text</span>(
              data.shares.<span class="pl-en">toString</span>(),
              style<span class="pl-k">:</span> <span class="pl-c1">TextStyle</span>(
                fontSize<span class="pl-k">:</span> <span class="pl-c1">15</span>,
                color<span class="pl-k">:</span> <span class="pl-c1">Color</span>(<span class="pl-c1">0xFF999999</span>),
              ),
            ),
          ],
        ),
      ],
    ),
  );
}</pre></div>
<h3>3.7 小结</h3>
<p>通过上面的一个例子，我们成功地把一个看起来复杂的UI界面一步步拆解，将之前提到的组件都用了个遍，并且最终得到了不错的效果。其实，日常开发中90%以上的需求都离不开上述提到的基础组件。因此，只要稍加练习，熟悉了<code>Flutter</code>中的基础组件用法，就已经算是迈出了一大步哦~</p>
<p>这里还有<a href="https://github.com/SmallStoneSK/flutter_training_app/blob/master/lib/basic_widgets/credit_card.dart">银行卡</a>和<a href="https://github.com/SmallStoneSK/flutter_training_app/blob/master/lib/basic_widgets/friend_circle.dart">朋友圈</a>的UI练习例子，由于篇幅原因就不贴代码了，可以去<a href="https://github.com/SmallStoneSK/flutter_training_app/tree/master/lib/basic_widgets">github仓库</a>看。</p>
<h2>4. 总结</h2>
<p>本文首先介绍了<code>Flutter</code>中构建UI界面最常用的基础组件（<code>容器</code>，<code>行</code>，<code>列</code>，<code>绝对定位布局</code>，<code>文本</code>，<code>图片</code>和<code>图标</code>）用法。接着，介绍了一个较复杂的UI实战例子。通过对Dom结构的层层拆解，前文提到过的组件得到一个综合运用，也算是巩固了前面所学的概念知识。</p>
<p>不过最后不得不吐槽一句：<code>Flutter</code>的嵌套真的很难受。。。如果不对UI布局进行模块拆分，那绝对是噩梦般的体验。而且不像web/rn开发样式可以单独抽离，<code>Flutter</code>这种将样式当做属性的处理方式，一眼看去真的很难理清dom结构，对于新接手代码的开发人员而言，需要费点时间理解。。。</p>
      </td>