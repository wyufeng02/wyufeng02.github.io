---
layout: post
title:  用 Flutter 构建漂亮的 UI 界面 - 基础组件篇
tag: [flutter, Location, Maps,UI]
date: 2019-07-08
---



<sr-rd-content dangerouslysetinnerhtml="[object Object]" data-reactid=".0.3"><h2 id="sr-toc-0">1. 前言</h2><p><code>Flutter</code>作为时下最流行的技术之一，凭借其出色的性能以及抹平多端的差异优势，早已引起大批技术爱好者的关注，甚至一些<code>闲鱼</code>，<code>美团</code>，<code>腾讯</code>等大公司均已开始使用。虽然目前其生态还没有完全成熟，但身靠背后的<code>Google</code>加持，其发展速度已经足够惊人，可以预见将来对<code>Flutter</code>开发人员的需求也会随之增长。</p><p>无论是为了现在的技术尝鲜还是将来的潮流趋势，都 9102 年了，作为一个前端开发者，似乎没有理由不去尝试它。正是带着这样的心理，笔者也开始学习<code>Flutter</code>，同时建了一个用于练习的<a href="https://github.com/SmallStoneSK/flutter_training_app">仓库</a>，后续所有代码都会托管在上面，欢迎 star，一起学习。</p><p>今天分享的是 Flutter 中最常用到的一些基础组件，它们是构成 UI 界面的基础元素：<code>容器</code>，<code>行</code>，<code>列</code>，<code>绝对定位布局</code>，<code>文本</code>，<code>图片</code>和<code>图标</code>等。</p><p><a target="_blank" rel="noopener noreferrer" href="https://camo.githubusercontent.com/b405ad5a5ed1c0ce4714d3fa5ce30f7a7146207f/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d633638643866343664366364643764622e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"><div class="sr-rd-content-center"><img class="sr-rd-content-img" src="https://camo.githubusercontent.com/b405ad5a5ed1c0ce4714d3fa5ce30f7a7146207f/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d633638643866343664366364643764622e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430" style="zoom: 0.6;"></div></a></p><h2 id="sr-toc-1">2. 基础组件</h2><h3 id="sr-toc-2">2.1 Container(容器组件)</h3><div align="center">
  <a target="_blank" rel="noopener noreferrer" href="https://camo.githubusercontent.com/df59b65a94861c4bf83c1bfc6eae4f0ea721ddc7/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d303365316661353231333263366335332e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"><div class="sr-rd-content-center"><img class="" src="https://camo.githubusercontent.com/df59b65a94861c4bf83c1bfc6eae4f0ea721ddc7/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d303365316661353231333263366335332e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"></div></a>
</div><p><code>Container</code>组件是最常用的布局组件之一，可以认为它是 web 开发中的<code>div</code>，rn 开发中的<code>View</code>。其往往可以用来控制大小、背景颜色、边框、阴影、内外边距和内容排列方式等。我们先来看下其构造函数：</p><div><pre>Container({
  Key key,
  double width,
  double height,
  this.margin,
  this.padding,
  Color color,
  this.alignment,
  BoxConstraints constraints,
  Decoration decoration,
  this.foregroundDecoration,
  this.transform,
  this.child,
})
</pre></div><h4 id="sr-toc-3">2.1.1 <code>width</code>，<code>height</code>，<code>margin</code>，<code>padding</code></h4><p>这些属性的含义和我们已经熟知的并没有区别。唯一需要注意的是，<code>margin</code>和<code>padding</code>的赋值不是一个简单的数字，因为其有<code>left</code>, <code>top</code>, <code>right</code>, <code>bottom</code>四个方向的值需要设置。<code>Flutter</code>提供了<code>EdgeInsets</code>这个类，帮助我们方便地生成四个方向的值。通常情况下，我们可能会用到<code>EdgeInsets</code>的 4 种构造方法：</p><ul>
<li><code>EdgeInsets.all(value)</code>: 用于设置 4 个方向一样的值；</li>
<li><code>EdgeInsets.only(left: val1, top: val2, right: val3, bottom: val4)</code>: 可以单独设置某个方向的值；</li>
<li><code>EdgeInsets.symmetric(horizontal: val1, vertical: val2)</code>: 用于设置水平 / 垂直方向上的值；</li>
<li><code>EdgeInsets.fromLTRB(left, top, right, bottom)</code>: 按照左上右下的顺序设置 4 个方向的值。</li>
</ul><h4 id="sr-toc-4">2.1.2 <code>color</code></h4><p>该属性的含义是背景颜色，等同于 web/rn 中的 backgroundColor。需要注意的是<code>Flutter</code>中有一个专门表示颜色的<code>Color</code>类，而非我们常用的字符串。不过我们可以非常轻松地进行转换，举个栗子：</p><p>在 web/rn 中我们会用<code>'#FF0000'</code>或<code>'red'</code>来表示红色，而在 Flutter 中，我们可以用<code>Color(0xFFFF0000)</code>或<code>Colors.red</code>来表示。</p><h4 id="sr-toc-5">2.1.3 <code>alignment</code></h4><p>该属性是用来决定<code>Container</code>组件的子组件将以何种方式进行排列（PS：再也不用为怎么居中操心了）。其可选值通常会用到：</p><ul>
<li><code>Alignment.topLeft</code>: 左上</li>
<li><code>Alignment.topCenter</code>: 上中</li>
<li><code>Alignment.topRight</code>: 右上</li>
<li><code>Alignment.centerLeft</code>: 左中</li>
<li><code>Alignment.center</code>: 居中</li>
<li><code>Alignment.centerRight</code>: 右中</li>
<li><code>Alignment.bottomLeft</code>: 左下</li>
<li><code>Alignment.bottomCenter</code>: 下中</li>
<li><code>Alignment.bottomRight</code>: 右下</li>
</ul><h4 id="sr-toc-6">2.1.4 <code>constraints</code></h4><p>在 web/rn 中我们通常会用<code>minWidth</code>/<code>maxWidth</code>/<code>minHeight</code>/<code>maxHeight</code>等属性来限制容器的宽高。在<code>Flutter</code>中，你需要使用<code>BoxConstraints</code>（盒约束）来实现该功能。</p><div><pre>// 容器的大小将被限制在[100*100 ~ 200*200]内
BoxConstraints(
  minWidth: 100,
  maxWidth: 200,
  minHeight: 100,
  maxHeight: 200,
)
</pre></div><h4 id="sr-toc-7">2.1.5 <code>decoration</code></h4><p>该属性非常强大，字面意思是装饰，因为通过它你可以设置<code>边框</code>，<code>阴影</code>，<code>渐变</code>，<code>圆角</code>等常用属性。<code>BoxDecoration</code>继承自<code>Decoration</code>类，因此我们通常会生成一个<code>BoxDecoration</code>实例来设置这些属性。</p><p><strong>1) 边框</strong></p><p>可以用<code>Border.all</code>构造函数直接生成 4 条边框，也可以用<code>Border</code>构造函数单独设置不同方向上的边框。不过令人惊讶的是官方提供的边框竟然不支持<code>虚线</code>（<a href="https://github.com/flutter/flutter/issues/4858" data-hovercard-type="issue" data-hovercard-url="/flutter/flutter/issues/4858/hovercard">issue</a> 在这里）。</p><div><pre>// 同时设置4条边框：1px粗细的黑色实线边框
BoxDecoration(
  border: Border.all(color: Colors.black, width: 1, style: BorderStyle.solid)
)

// 设置单边框：上边框为1px粗细的黑色实线边框，右边框为1px粗细的红色实线边框
BoxDecoration(
  border: Border(
    top: BorderSide(color: Colors.black, width: 1, style: BorderStyle.solid),
    right: BorderSide(color: Colors.red, width: 1, style: BorderStyle.solid),
  ),
)
</pre></div><p><strong>2) 阴影</strong></p><p>阴影属性和 web 中的<code>boxShadow</code>几乎没有区别，可以指定<code>x</code>，<code>y</code>，<code>blur</code>，<code>spread</code>，<code>color</code>等属性。</p><div><pre>BoxDecoration(
  boxShadow: [
    BoxShadow(
      offset: Offset(0, 0),
      blurRadius: 6,
      spreadRadius: 10,
      color: Color.fromARGB(20, 0, 0, 0),
    ),
  ],
)
</pre></div><p><strong>3) 渐变</strong></p><p>如果你不想容器的背景颜色是单调的，可以尝试用<code>gradient</code>属性。<code>Flutter</code>同时支持<code>线性渐变</code>和<code>径向渐变</code>：</p><div><pre>// 从左到右，红色到蓝色的线性渐变
BoxDecoration(
  gradient: LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [Colors.red, Colors.blue],
  ),
)

// 从中心向四周扩散，红色到蓝色的径向渐变
BoxDecoration(
  gradient: RadialGradient(
    center: Alignment.center,
    colors: [Colors.red, Colors.blue],
  ),
)
</pre></div><p><strong>4) 圆角</strong></p><p>通常情况下，你可能会用到<code>BorderRadius.circular</code>构造函数来同时设置 4 个角的圆角，或是<code>BorderRadius.only</code>构造函数来单独设置某几个角的圆角：</p><div><pre>// 同时设置4个角的圆角为5
BoxDecoration(
  borderRadius: BorderRadius.circular(5),
)

// 设置单圆角：左上角的圆角为5，右上角的圆角为10
BoxDecoration(
  borderRadius: BorderRadius.only(
    topLeft: Radius.circular(5),
    topRight: Radius.circular(10),
  ),
)
</pre></div><h4 id="sr-toc-8">2.1.6 <code>transform</code></h4><p><code>transform</code>属性和我们在 web/rn 中经常用到的基本也没有差别，主要包括：<code>平移</code>，<code>缩放</code>、<code>旋转</code>和<code>倾斜</code>。在 Flutter 中，封装了矩阵变换类<code>Matrix4</code>帮助我们进行变换：</p><ul>
<li><code>translationValues(x, y, z)</code>: 平移 x, y, z；</li>
<li><code>rotationX(radians)</code>: x 轴旋转 radians 弧度；</li>
<li><code>rotationY(radians)</code>: y 轴旋转 radians 弧度；</li>
<li><code>rotationZ(radians)</code>: z 轴旋转 radians 弧度；</li>
<li><code>skew(alpha, beta)</code>: x 轴倾斜 alpha 度，y 轴倾斜 beta 度；</li>
<li><code>skewX(alpha)</code>: x 轴倾斜 alpha 度；</li>
<li><code>skewY(beta)</code>: y 轴倾斜 beta 度；</li>
</ul><h4 id="sr-toc-9">2.1.7 小结</h4><p><code>Container</code>组件的属性很丰富，虽然有些用法上和 web/rn 有些许差异，但基本上大同小异，所以过渡起来也不会有什么障碍。另外，由于<code>Container</code>组件是单子节点组件，也就是只允许子节点有一个。所以在布局上，很多时候我们会用<code>Row</code>和<code>Column</code>组件进行<code>行</code>/<code>列</code>布局。</p><h3 id="sr-toc-10">2.2 Row/Column(行 / 列组件)</h3><div align="center">
  <a target="_blank" rel="noopener noreferrer" href="https://camo.githubusercontent.com/bdbffeb89e5a2caa0a5914c085e050295c47a967/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d306361353538303137343363323630632e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"><div class="sr-rd-content-center"><img class="" src="https://camo.githubusercontent.com/bdbffeb89e5a2caa0a5914c085e050295c47a967/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d306361353538303137343363323630632e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"></div></a>
</div><p><code>Row</code>和<code>Column</code>组件其实和 web/rn 中的<code>Flex布局</code>（弹性盒子）特别相似，或者我们可以就这么理解。使用<code>Flex布局</code>的同学对<code>主轴</code>和<code>次轴</code>的概念肯定都已经十分熟悉，<code>Row</code>组件的主轴就是横向，<code>Column</code>组件的主轴就是纵向。且它们的构造函数十分相似（已省略不常用属性）：</p><div><pre>Row({
  Key key,
  MainAxisAlignment mainAxisAlignment = MainAxisAlignment.start,
  CrossAxisAlignment crossAxisAlignment = CrossAxisAlignment.center,
  MainAxisSize mainAxisSize = MainAxisSize.max,
  List&lt;Widget&gt; children = const &lt;Widget&gt;[],
})

Column({
  Key key,
  MainAxisAlignment mainAxisAlignment = MainAxisAlignment.start,
  CrossAxisAlignment crossAxisAlignment = CrossAxisAlignment.center,
  MainAxisSize mainAxisSize = MainAxisSize.max,
  List&lt;Widget&gt; children = const &lt;Widget&gt;[],
})
</pre></div><h4 id="sr-toc-11">2.2.1 <code>mainAxisAlignment</code></h4><p>该属性的含义是主轴排列方式，根据上述构造函数可以知道<code>Row</code>和<code>Column</code>组件在主轴方向上默认都是从 start 开始，也就是说<code>Row</code>组件默认从左到右开始排列子组件，<code>Column</code>组件默认从上到下开始排列子组件。</p><p>当然，你还可以使用其他的可选值：</p><ul>
<li>MainAxisAlignment.start</li>
<li>MainAxisAlignment.end</li>
<li>MainAxisAlignment.center</li>
<li>MainAxisAlignment.spaceBetween</li>
<li>MainAxisAlignment.spaceAround</li>
<li>MainAxisAlignment.spaceEvenly</li>
</ul><h4 id="sr-toc-12">2.2.2 <code>crossAxisAlignment</code></h4><p>该属性的含义是次轴排列方式，根据上述构造函数可以知道<code>Row</code>和<code>Column</code>组件在次轴方向上默认都是居中。</p><p>这里有一点需要<strong>特别注意</strong>：由于<code>Column</code>组件次轴方向上（即水平）默认是居中对齐，所以水平方向上不会撑满其父容器，此时需要指定<code>CrossAxisAlignment.stretch</code>才可以。</p><p>另外，crossAxisAlignment 其他的可选值有：</p><ul>
<li>crossAxisAlignment.start</li>
<li>crossAxisAlignment.end</li>
<li>crossAxisAlignment.center</li>
<li>crossAxisAlignment.stretch</li>
<li>crossAxisAlignment.baseline</li>
</ul><h4 id="sr-toc-13">2.2.3 <code>mainAxisSize</code></h4><p>字面意思上来说，该属性指的是在主轴上的尺寸。其实就是指在主轴方向上，是包裹其内容，还是撑满其父容器。它的可选值有<code>MainAxisSize.min</code>和<code>MainAxisSize.max</code>。由于其默认值都是<code>MainAxisSize.max</code>，所以主轴方向上默认大小都是尽可能撑满父容器的。</p><h4 id="sr-toc-14">2.2.4 小结</h4><p>由于<code>Row</code>/<code>Column</code>组件和我们熟悉的<code>Flex布局</code>非常相似，所以上手起来非常容易，几乎零学习成本。</p><h3 id="sr-toc-15">2.3 Stack/Positoned(绝对定位布局组件)</h3><div align="center">
  <a target="_blank" rel="noopener noreferrer" href="https://camo.githubusercontent.com/65c5464e64374868ce3e4482f15eeda4ab1a9300/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d396334616637356435616534646663342e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"><div class="sr-rd-content-center"><img class="" src="https://camo.githubusercontent.com/65c5464e64374868ce3e4482f15eeda4ab1a9300/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d396334616637356435616534646663342e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"></div></a>
</div><p>绝对定位布局在 web/rn 开发中也是使用频率较高的一种布局方式，<code>Flutter</code>也提供了相应的组件实现，需要将<code>Stack</code>和<code>Positioned</code>组件搭配在一起使用。比如下方的这个例子就是创建了一个黄色的盒子，并且在其四个角落放置了 4 个红色的小正方形。<code>Stack</code>组件就是绝对定位的容器，<code>Positioned</code>组件通过<code>left</code>，<code>top </code>，<code>right</code>，<code>bottom</code>四个方向上的属性值来决定其在父容器中的位置。</p><div><pre>Container(
  height: 100,
  color: Colors.yellow,
  child: Stack(
    children: &lt;Widget&gt;[
      Positioned(
        left: 10,
        top: 10,
        child: Container(width: 10, height: 10, color: Colors.red),
      ),
      Positioned(
        right: 10,
        top: 10,
        child: Container(width: 10, height: 10, color: Colors.red),
      ),
      Positioned(
        left: 10,
        bottom: 10,
        child: Container(width: 10, height: 10, color: Colors.red),
      ),
      Positioned(
        right: 10,
        bottom: 10,
        child: Container(width: 10, height: 10, color: Colors.red),
      ),
    ],
  ),
)
</pre></div><h3 id="sr-toc-16">2.4 Text（文本组件）</h3><div align="center">
  <a target="_blank" rel="noopener noreferrer" href="https://camo.githubusercontent.com/8c6ba39d87c0162305ba221d30796700890bcfe8/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d626565373531333962646630353233622e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"><div class="sr-rd-content-center"><img class="" src="https://camo.githubusercontent.com/8c6ba39d87c0162305ba221d30796700890bcfe8/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d626565373531333962646630353233622e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"></div></a>
</div><p><code>Text</code>组件也是日常开发中最常用的基础组件之一，我们通常用它来展示文本信息。来看下其构造函数（已省略不常用属性）：</p><div><pre>const Text(
  this.data, {
  Key key,
  this.style,
  this.textAlign,
  this.softWrap,
  this.overflow,
  this.maxLines,
})
</pre></div><ul>
<li><code>data</code>: 显示的文本信息；</li>
<li><code>style</code>: 文本样式，<code>Flutter</code>提供了一个<code>TextStyle</code>类，最常用的<code>fontSize</code>，<code>fontWeight</code>，<code>color</code>，<code>backgroundColor</code>和<code>shadows</code>等属性都是通过它设置的；</li>
<li><code>textAlign</code>: 文字对齐方式，常用可选值有<code>TextAlign</code>的<code>left</code>，<code>right</code>，<code>center</code>和<code>justify</code>；</li>
<li><code>softWrap</code>: 文字是否换行；</li>
<li><code>overflow</code>: 当文字溢出的时候，以何种方式处理（默认直接截断）。可选值有<code>TextOverflow</code>的<code>clip</code>，<code>fade</code>，<code>ellipsis</code>和<code>visible</code>；</li>
<li><code>maxLines</code>: 当文字超过最大行数还没显示完的时候，就会根据<code>overflow</code>属性决定如何截断处理。</li>
</ul><p><code>Flutter</code>的<code>Text</code>组件足够灵活，提供了各种属性让我们定制，不过一般情况下，我们更多地只需下方几行代码就足够了：</p><div><pre>Text(
  '这是测试文本',
  style: TextStyle(
    fontSize: 13,
    fontWeight: FontWeight.bold,
    color: Color(0xFF999999),
  ),
)
</pre></div><p>除了上述的应用场景外，有时我们还会遇到<code>富文本</code>的需求（即一段文本中，可能需要不同的字体样式）。比如在一些 UI 设计中经常会遇到表示价格的时候，<code>￥</code>符号比<code>金额</code>的字号小点。对于此类需求，我们可以用<code>Flutter</code>提供的<code>Text.rich</code>构造函数来创建相应的文本组件：</p><div><pre>Text.rich(TextSpan(
  children: [
    TextSpan(
      '￥',
      style: TextStyle(
        fontSize: 12,
        color: Color(0xFFFF7528),
      ),
    ),
    TextSpan(
      '258',
      style: TextStyle(
        fontSize: 15,
        color: Color(0xFFFF7528),
      ),
    ),
  ]
))
</pre></div><h3 id="sr-toc-17">2.5 Image(图片组件)</h3><div align="center">
  <a target="_blank" rel="noopener noreferrer" href="https://camo.githubusercontent.com/2c61d89c4e73df6ae5aba8c9456be1327f1550a0/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d633238623936366337323666623931632e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"><div class="sr-rd-content-center"><img class="" src="https://camo.githubusercontent.com/2c61d89c4e73df6ae5aba8c9456be1327f1550a0/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d633238623936366337323666623931632e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"></div></a>
</div><p><code>Image</code>图片组件作为丰富内容的基础组件之一，日常开发中的使用频率也非常高。看下其构造函数（已省略不常用属性）：</p><div><pre>Image({
  Key key,
  @required this.image,
  this.width,
  this.height,
  this.color,
  this.fit,
  this.repeat = ImageRepeat.noRepeat,
})
</pre></div><ul>
<li><code>image</code>: 图片源，最常用到主要有两种（<code>AssetImage</code>和<code>NetworkImage</code>）。使用<code>AssetImage</code>之前，需要在<code>pubspec.yaml</code>文件中声明好图片资源，然后才能使用；而<code>NextworkImage</code>指定图片的网络地址即可，主要是在加载一些网络图片时会用到；</li>
<li><code>width</code>: 图片宽度；</li>
<li><code>height</code>: 图片高度；</li>
<li><code>color</code>: 图片的背景颜色，当网络图片未加载完毕之前，会显示该背景颜色；</li>
<li><code>fit</code>: 当我们希望图片根据容器大小进行适配而不是指定固定的宽高值时，可以通过该属性来实现。其可选值有<code>BoxFit</code>的<code>fill</code>，<code>contain</code>，<code>cover</code>，<code>fitWidth</code>，<code>fitHeight</code>，<code>none</code>和<code>scaleDown</code>；</li>
<li><code>repeat</code>: 决定当图片实际大小不足指定大小时是否使用重复效果。</li>
</ul><p>另外，<code>Flutter</code>还提供了<code>Image.network</code>和<code>Image.asset</code>构造函数，其实是语法糖。比如下方的两段代码结果是完全一样的：</p><div><pre>Image(
  image: NetworkImage('https://ss1.bdstatic.com/70cFuXSh_Q1YnxGkpoWK1HF6hhy/it/u=1402367109,4157195964&amp;fm=27&amp;gp=0.jpg'),
  width: 100,
  height: 100,
)

Image.network(
  'https://ss1.bdstatic.com/70cFuXSh_Q1YnxGkpoWK1HF6hhy/it/u=1402367109,4157195964&amp;fm=27&amp;gp=0.jpg',
  width: 100,
  height: 100,
)
</pre></div><h3 id="sr-toc-18">2.6 <code>Icon</code>(图标组件)</h3><div align="center">
  <a target="_blank" rel="noopener noreferrer" href="https://camo.githubusercontent.com/df6eab7e8b378b6d52b0207da1f8fbf0eccbd0c3/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d373136613931626262316463316435332e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"><div class="sr-rd-content-center"><img class="" src="https://camo.githubusercontent.com/df6eab7e8b378b6d52b0207da1f8fbf0eccbd0c3/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d373136613931626262316463316435332e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"></div></a>
</div><p><code>Icon</code>图标组件相比于图片有着放大不会失真的优势，在日常开发中也是经常会被用到。<code>Flutter</code>更是直接内置了一套<code>Material</code>风格的图标（你可以在<a href="https://api.flutter.dev/flutter/material/Icons-class.html#constants" rel="nofollow">这里</a>预览所有的图标类型）。看下构造函数：</p><div><pre>const Icon(
  this.icon, {
  Key key,
  this.size,
  this.color,
})
</pre></div><ul>
<li><code>icon</code>: 图标类型；</li>
<li><code>size</code>: 图标大小；</li>
<li><code>color</code>: 图标颜色。</li>
</ul><h2 id="sr-toc-19">3. 布局实战</h2><p>通过上一节的介绍，我们对<code>Container</code>，<code>Row</code>，<code>Column</code>，<code>Stack</code>，<code>Positioned</code>，<code>Text</code>，<code>Image</code>和<code>Icon</code>组件有了初步的认识。接下来，就让我们通过一个实际的例子来加深理解和记忆。</p><div align="center">
  <a target="_blank" rel="noopener noreferrer" href="https://camo.githubusercontent.com/cc54abdf4d9109c693a4a4fc5bbf7e280af7cbfa/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d643666663539663130323864336234622e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"><div class="sr-rd-content-center"><img class="" src="https://camo.githubusercontent.com/cc54abdf4d9109c693a4a4fc5bbf7e280af7cbfa/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d643666663539663130323864336234622e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430" height="620" style="width: auto;"></div></a>
</div><h3 id="sr-toc-20">3.1 准备工作 - 数据类型</h3><p>根据上述卡片中的内容，我们可以定义一些字段。为了规范开发流程，我们先给卡片定义一个数据类型的类，这样在后续的开发过程中也能更好地对数据进行 Mock 和管理：</p><div><pre>class PetCardViewModel {
  /// 封面地址
  final String coverUrl;

  /// 用户头像地址
  final String userImgUrl;

  /// 用户名
  final String userName;

  /// 用户描述
  final String description;

  /// 话题
  final String topic;

  /// 发布时间
  final String publishTime;

  /// 发布内容
  final String publishContent;

  /// 回复数量
  final int replies;

  /// 喜欢数量
  final int likes;

  /// 分享数量
  final int shares;

  const PetCardViewModel({
    this.coverUrl,
    this.userImgUrl,
    this.userName,
    this.description,
    this.topic,
    this.publishTime,
    this.publishContent,
    this.replies,
    this.likes,
    this.shares,
  });
}
</pre></div><h3 id="sr-toc-21">3.2 搭建骨架，布局拆分</h3><div align="center">
  <a target="_blank" rel="noopener noreferrer" href="https://camo.githubusercontent.com/03e8cd93acc329b8c7bab058a560605ca11d5e3c/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d383138653837306464666364366638332e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"><div class="sr-rd-content-center"><img class="" src="https://camo.githubusercontent.com/03e8cd93acc329b8c7bab058a560605ca11d5e3c/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d383138653837306464666364366638332e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430" style="zoom: 0.6;"></div></a>
</div><p>根据给的视觉图，我们可以将整体进行拆分，一共划分成 4 个部分：<code>Cover</code>，<code>UserInfo</code>，<code>PublishContent</code>和<code>InteractionArea</code>。为此，我们可以搭起代码的基本骨架：</p><div><pre>class PetCard extends StatelessWidget {
  final PetCardViewModel data;

  const PetCard({
    Key key,
    this.data,
  }) : super(key: key);

  Widget renderCover() {
    
  }

  Widget renderUserInfo() {
    
  }

  Widget renderPublishContent() {
  
  }

  Widget renderInteractionArea() {
   
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            blurRadius: 6,
            spreadRadius: 4,
            color: Color.fromARGB(20, 0, 0, 0),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: &lt;Widget&gt;[
          this.renderCover(),
          this.renderUserInfo(),
          this.renderPublishContent(),
          this.renderInteractionArea(),
        ],
      ),
    );
  }
}
</pre></div><h3 id="sr-toc-22">3.3 封面区域</h3><p>为了更好的凸现图片的效果，这里加了一个蒙层，所以此处刚好可以用得上<code>Stack</code>/<code>Positioned</code>布局和<code>LinearGradient</code>渐变，Dom 结构如下：</p><p><a target="_blank" rel="noopener noreferrer" href="https://camo.githubusercontent.com/1722fe4fe7492333a1df23dc8dd72b996872f632/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d656265626663353562333237656137302e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"><div class="sr-rd-content-center"><img class="" src="https://camo.githubusercontent.com/1722fe4fe7492333a1df23dc8dd72b996872f632/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d656265626663353562333237656137302e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"></div></a></p><div><pre>Widget renderCover() {
  return Stack(
    fit: StackFit.passthrough,
    children: &lt;Widget&gt;[
      ClipRRect(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(8),
          topRight: Radius.circular(8),
        ),
        child: Image.network(
          data.coverUrl,
          height: 200,
          fit: BoxFit.fitWidth,
        ),
      ),
      Positioned(
        left: 0,
        top: 100,
        right: 0,
        bottom: 0,
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Color.fromARGB(0, 0, 0, 0),
                Color.fromARGB(80, 0, 0, 0),
              ],
            ),
          ),
        ),
      ),
    ],
  );
}
</pre></div><h3 id="sr-toc-23">3.4 用户信息区域</h3><p>用户信息区域就非常适合使用<code>Row</code>和<code>Column</code>组件来进行布局，Dom 结构如下：</p><p><a target="_blank" rel="noopener noreferrer" href="https://camo.githubusercontent.com/d84922fe725417bba85eb4eab931c3795f0c89c1/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d623135353039303138646532663163652e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"><div class="sr-rd-content-center"><img class="" src="https://camo.githubusercontent.com/d84922fe725417bba85eb4eab931c3795f0c89c1/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d623135353039303138646532663163652e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"></div></a></p><div><pre>Widget renderUserInfo() {
  return Container(
    margin: EdgeInsets.only(top: 16),
    padding: EdgeInsets.symmetric(horizontal: 16),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: &lt;Widget&gt;[
        Row(
          children: &lt;Widget&gt;[
            CircleAvatar(
              radius: 20,
              backgroundColor: Color(0xFFCCCCCC),
              backgroundImage: NetworkImage(data.userImgUrl),
            ),
            Padding(padding: EdgeInsets.only(left: 8)),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: &lt;Widget&gt;[
                Text(
                  data.userName,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF333333),
                  ),
                ),
                Padding(padding: EdgeInsets.only(top: 2)),
                Text(
                  data.description,
                  style: TextStyle(
                    fontSize: 12,
                    color: Color(0xFF999999),
                  ),
                ),
              ],
            ),
          ],
        ),
        Text(
          data.publishTime,
          style: TextStyle(
            fontSize: 13,
            color: Color(0xFF999999),
          ),
        ),
      ],
    ),
  );
}
</pre></div><h3 id="sr-toc-24">3.5 发布内容区域</h3><p>通过这块区域的 UI 练习，我们可以实践<code>Container</code>组件设置不同的<code>borderRadius</code>，以及<code>Text</code>组件文本内容超出时的截断处理，Dom 结构如下：</p><p><a target="_blank" rel="noopener noreferrer" href="https://camo.githubusercontent.com/b294435613447d923dcafb8d96e6a00055c7c925/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d323837653933333639626636353235392e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"><div class="sr-rd-content-center"><img class="" src="https://camo.githubusercontent.com/b294435613447d923dcafb8d96e6a00055c7c925/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d323837653933333639626636353235392e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"></div></a></p><div><pre>Widget renderPublishContent() {
  return Container(
    margin: EdgeInsets.only(top: 16),
    padding: EdgeInsets.symmetric(horizontal: 16),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: &lt;Widget&gt;[
        Container(
          margin: EdgeInsets.only(bottom: 14),
          padding: EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(
            color: Color(0xFFFFC600),
            borderRadius: BorderRadius.only(
              topRight: Radius.circular(8),
              bottomLeft: Radius.circular(8),
              bottomRight: Radius.circular(8),
            ),
          ),
          child: Text(
            '# ${data.topic}',
            style: TextStyle(
              fontSize: 12,
              color: Colors.white,
            ),
          ),
        ),
        Text(
          data.publishContent,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.bold,
            color: Color(0xFF333333),
          ),
        ),
      ],
    ),
  );
}
</pre></div><h3 id="sr-toc-25">3.6 互动区域</h3><p>在这个模块，我们会用到<code>Icon</code>图标组件，可以控制其大小和颜色等属性，Dom 结构如下：</p><p><a target="_blank" rel="noopener noreferrer" href="https://camo.githubusercontent.com/4875f81452b9eaf636e803735adf3109b332a09f/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d383465646463623734616163633132312e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"><div class="sr-rd-content-center"><img class="" src="https://camo.githubusercontent.com/4875f81452b9eaf636e803735adf3109b332a09f/68747470733a2f2f75706c6f61642d696d616765732e6a69616e7368752e696f2f75706c6f61645f696d616765732f313939303133332d383465646463623734616163633132312e706e673f696d6167654d6f6772322f6175746f2d6f7269656e742f7374726970253743696d61676556696577322f322f772f31323430"></div></a></p><div><pre>Widget renderInteractionArea() {
  return Container(
    margin: EdgeInsets.symmetric(vertical: 16),
    padding: EdgeInsets.symmetric(horizontal: 16),
    child: Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: &lt;Widget&gt;[
        Row(
          children: &lt;Widget&gt;[
            Icon(
              Icons.message,
              size: 16,
              color: Color(0xFF999999),
            ),
            Padding(padding: EdgeInsets.only(left: 6)),
            Text(
              data.replies.toString(),
              style: TextStyle(
                fontSize: 15,
                color: Color(0xFF999999),
              ),
            ),
          ],
        ),
        Row(
          children: &lt;Widget&gt;[
            Icon(
              Icons.favorite,
              size: 16,
              color: Color(0xFFFFC600),
            ),
            Padding(padding: EdgeInsets.only(left: 6)),
            Text(
              data.likes.toString(),
              style: TextStyle(
                fontSize: 15,
                color: Color(0xFF999999),
              ),
            ),
          ],
        ),
        Row(
          children: &lt;Widget&gt;[
            Icon(
              Icons.share,
              size: 16,
              color: Color(0xFF999999),
            ),
            Padding(padding: EdgeInsets.only(left: 6)),
            Text(
              data.shares.toString(),
              style: TextStyle(
                fontSize: 15,
                color: Color(0xFF999999),
              ),
            ),
          ],
        ),
      ],
    ),
  );
}
</pre></div><h3 id="sr-toc-26">3.7 小结</h3><p>通过上面的一个例子，我们成功地把一个看起来复杂的 UI 界面一步步拆解，将之前提到的组件都用了个遍，并且最终得到了不错的效果。其实，日常开发中 90% 以上的需求都离不开上述提到的基础组件。因此，只要稍加练习，熟悉了<code>Flutter</code>中的基础组件用法，就已经算是迈出了一大步哦~</p><p>这里还有<a href="https://github.com/SmallStoneSK/flutter_training_app/blob/master/lib/basic_widgets/credit_card.dart">银行卡</a>和<a href="https://github.com/SmallStoneSK/flutter_training_app/blob/master/lib/basic_widgets/friend_circle.dart">朋友圈</a>的 UI 练习例子，由于篇幅原因就不贴代码了，可以去 <a href="https://github.com/SmallStoneSK/flutter_training_app/tree/master/lib/basic_widgets">github 仓库</a>看。</p><h2 id="sr-toc-27">4. 总结</h2><p>本文首先介绍了<code>Flutter</code>中构建 UI 界面最常用的基础组件（<code>容器</code>，<code>行</code>，<code>列</code>，<code>绝对定位布局</code>，<code>文本</code>，<code>图片</code>和<code>图标</code>）用法。接着，介绍了一个较复杂的 UI 实战例子。通过对 Dom 结构的层层拆解，前文提到过的组件得到一个综合运用，也算是巩固了前面所学的概念知识。</p><p>不过最后不得不吐槽一句：<code>Flutter</code>的嵌套真的很难受。。。如果不对 UI 布局进行模块拆分，那绝对是噩梦般的体验。而且不像 web/rn 开发样式可以单独抽离，<code>Flutter</code>这种将样式当做属性的处理方式，一眼看去真的很难理清 dom 结构，对于新接手代码的开发人员而言，需要费点时间理解。。。</p></sr-rd-content>