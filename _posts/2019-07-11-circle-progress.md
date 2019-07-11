---
layout: post
title:  使用自定义圆形进度与画板 flutter圆形进度条
tag: [flutter,进度条]
date: 2019-07-11
---

文章来源： https://mightytechno.com/flutter-circle-progress-using-custom-painter/

 <div class="entry-content clr" itemprop="text"><p><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">有多个使用案例，我们需要使用圈子进度，如显示健身进度，每周完成进度等。</font></font></p><p><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">您可以使用CustomPaint小部件在几分钟内在Flutter中实现循环进度，并为CustomPainter类提供自定义实现。</font></font></p><h3><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">结构体</font></font></h3><p><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">在进入编码之前，我们需要考虑结构。</font><font style="vertical-align: inherit;">在这里，我们需要展示以下内容</font></font></p><ul><li><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">显示文本进度</font></font></li><li><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">显示代表填充背景的完整圆圈</font></font></li><li><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">显示显示当前进度的Arc</font></font></li><li><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">显示进度时添加动画</font></font></li></ul><h3><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">履行</font></font></h3><h4><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">CustomPainter</font></font></h4><p><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">在Scaffold体内，包裹我们的自定义小部件将允许在屏幕中央显示进度。</font></font></p><p><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">然后，您可以提供</font></font><strong><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">CustomPaint</font></font></strong><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">作为子窗口小部件。</font><font style="vertical-align: inherit;">在这里，您需要显示文本小部件之外的进度。</font><font style="vertical-align: inherit;">因此，您需要将CustomPainter小部件作为</font></font><strong><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">foregroundPainter</font></font></strong><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">传递</font><font style="vertical-align: inherit;">。</font></font></p><p><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">然后，您需要创建一个CustomProgress。</font><font style="vertical-align: inherit;">要在动画发生时更改进度，我们需要将进度传递给窗口小部件。</font></font></p><p><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">正如我上面提到的，我们有两个圆圈来显示进度和实际进度的基础。</font><font style="vertical-align: inherit;">为此，您需要创建一个两个绘制对象来绘制“完整圆”和“绘制圆弧”。</font><font style="vertical-align: inherit;">检查此代码。</font></font></p><pre class=" language-dart"><code class=" language-dart">
<span class="token keyword">class</span> <span class="token class-name">CircleProgress</span> <span class="token keyword">extends</span> <span class="token class-name">CustomPainter</span><span class="token punctuation">{</span><font></font>
<font></font>
  double currentProgress<span class="token punctuation">;</span><font></font>
<font></font>
  <span class="token function">CircleProgress</span><span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">.</span>currentProgress<span class="token punctuation">)</span><span class="token punctuation">;</span><font></font>
<font></font>
  <span class="token metadata symbol">@override</span>
  <span class="token keyword">void</span> <span class="token function">paint</span><span class="token punctuation">(</span>Canvas canvas<span class="token punctuation">,</span> Size size<span class="token punctuation">)</span> <span class="token punctuation">{</span><font></font>
<font></font>
    <span class="token comment">//this is base circle</span>
    Paint outerCircle <span class="token operator">=</span> <span class="token function">Paint</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
        <span class="token punctuation">.</span><span class="token punctuation">.</span>strokeWidth <span class="token operator">=</span> <span class="token number">10</span>
        <span class="token punctuation">.</span><span class="token punctuation">.</span>color <span class="token operator">=</span> Colors<span class="token punctuation">.</span>black
        <span class="token punctuation">.</span><span class="token punctuation">.</span>style <span class="token operator">=</span> PaintingStyle<span class="token punctuation">.</span>stroke<span class="token punctuation">;</span><font></font>
<font></font>
    Paint completeArc <span class="token operator">=</span> <span class="token function">Paint</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
      <span class="token punctuation">.</span><span class="token punctuation">.</span>strokeWidth <span class="token operator">=</span> <span class="token number">10</span>
      <span class="token punctuation">.</span><span class="token punctuation">.</span>color <span class="token operator">=</span> Colors<span class="token punctuation">.</span>redAccent
      <span class="token punctuation">.</span><span class="token punctuation">.</span>style <span class="token operator">=</span> PaintingStyle<span class="token punctuation">.</span>stroke
      <span class="token punctuation">.</span><span class="token punctuation">.</span>strokeCap  <span class="token operator">=</span> StrokeCap<span class="token punctuation">.</span>round<span class="token punctuation">;</span><font></font>
<font></font>
    Offset center <span class="token operator">=</span> <span class="token function">Offset</span><span class="token punctuation">(</span>size<span class="token punctuation">.</span>width<span class="token operator">/</span><span class="token number">2</span><span class="token punctuation">,</span> size<span class="token punctuation">.</span>height<span class="token operator">/</span><span class="token number">2</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    double radius <span class="token operator">=</span> <span class="token function">min</span><span class="token punctuation">(</span>size<span class="token punctuation">.</span>width<span class="token operator">/</span><span class="token number">2</span><span class="token punctuation">,</span>size<span class="token punctuation">.</span>height<span class="token operator">/</span><span class="token number">2</span><span class="token punctuation">)</span> <span class="token operator">-</span> <span class="token number">10</span><span class="token punctuation">;</span><font></font>
<font></font>
    canvas<span class="token punctuation">.</span><span class="token function">drawCircle</span><span class="token punctuation">(</span>center<span class="token punctuation">,</span> radius<span class="token punctuation">,</span> outerCircle<span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// this draws main outer circle</span><font></font>
<font></font>
    double angle <span class="token operator">=</span> <span class="token number">2</span> <span class="token operator">*</span> pi <span class="token operator">*</span> <span class="token punctuation">(</span>currentProgress<span class="token operator">/</span><span class="token number">100</span><span class="token punctuation">)</span><span class="token punctuation">;</span><font></font>
<font></font>
    canvas<span class="token punctuation">.</span><span class="token function">drawArc</span><span class="token punctuation">(</span>Rect<span class="token punctuation">.</span><span class="token function">fromCircle</span><span class="token punctuation">(</span>center<span class="token punctuation">:</span> center<span class="token punctuation">,</span>radius<span class="token punctuation">:</span> radius<span class="token punctuation">)</span><span class="token punctuation">,</span> <span class="token operator">-</span>pi<span class="token operator">/</span><span class="token number">2</span><span class="token punctuation">,</span> angle<span class="token punctuation">,</span> <span class="token boolean">false</span><span class="token punctuation">,</span> completeArc<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><font></font>
<font></font>
  <span class="token metadata symbol">@override</span>
  bool <span class="token function">shouldRepaint</span><span class="token punctuation">(</span>CustomPainter oldDelegate<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token comment">// TODO: implement shouldRepaint</span>
    <span class="token keyword">return</span> <span class="token boolean">true</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><p><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">现在基本实现完成了。</font><font style="vertical-align: inherit;">接下来我们可以添加一个动画来使这个更酷。</font></font></p><h3><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">动画</font></font></h3><p>In here you can use tween animation to start from 0 and end in the percentage which you want to show on the progress. Then you can assign the current animation value to the text and you can pass that as a parameter to CircleProgress class.</p><pre class=" language-dart"><code class=" language-dart">
<span class="token keyword">class</span> <span class="token class-name">_CircleProgressState</span> <span class="token keyword">extends</span> <span class="token class-name">State</span> <span class="token keyword">with</span> SingleTickerProviderStateMixin <span class="token punctuation">{</span><font></font>
<font></font>
  AnimationController progressController<span class="token punctuation">;</span>
  Animation animation<span class="token punctuation">;</span><font></font>
<font></font>
  <span class="token metadata symbol">@override</span>
  <span class="token keyword">void</span> <span class="token function">initState</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token comment">// TODO: implement initState</span>
    <span class="token keyword">super</span><span class="token punctuation">.</span><span class="token function">initState</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    progressController <span class="token operator">=</span> <span class="token function">AnimationController</span><span class="token punctuation">(</span>vsync<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">,</span>duration<span class="token punctuation">:</span> <span class="token function">Duration</span><span class="token punctuation">(</span>milliseconds<span class="token punctuation">:</span> <span class="token number">1000</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    animation <span class="token operator">=</span> <span class="token function">Tween</span><span class="token punctuation">(</span>begin<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>end<span class="token punctuation">:</span> <span class="token number">80</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">animate</span><span class="token punctuation">(</span>progressController<span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token function">addListener</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">{</span>
      <span class="token function">setState</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span><font></font>
<font></font>
      <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><font></font>
<font></font>
  <span class="token metadata symbol">@override</span>
  Widget <span class="token function">build</span><span class="token punctuation">(</span>BuildContext context<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token function">Scaffold</span><span class="token punctuation">(</span>
      appBar<span class="token punctuation">:</span> <span class="token function">AppBar</span><span class="token punctuation">(</span>
        title<span class="token punctuation">:</span> <span class="token function">Text</span><span class="token punctuation">(</span>widget<span class="token punctuation">.</span>title<span class="token punctuation">)</span><span class="token punctuation">,</span>
      <span class="token punctuation">)</span><span class="token punctuation">,</span>
      body<span class="token punctuation">:</span> <span class="token function">Center</span><span class="token punctuation">(</span>
        child<span class="token punctuation">:</span> <span class="token function">CustomPaint</span><span class="token punctuation">(</span><font></font>
<font></font>
          foregroundPainter<span class="token punctuation">:</span> <span class="token function">CircleProgress</span><span class="token punctuation">(</span>animation<span class="token punctuation">.</span>value<span class="token punctuation">)</span><span class="token punctuation">,</span> <span class="token comment">// this will add custom painter after child</span>
          child<span class="token punctuation">:</span> <span class="token function">Container</span><span class="token punctuation">(</span>
            width<span class="token punctuation">:</span> <span class="token number">200</span><span class="token punctuation">,</span>
            height<span class="token punctuation">:</span> <span class="token number">200</span><span class="token punctuation">,</span>
            child<span class="token punctuation">:</span> <span class="token function">GestureDetector</span><span class="token punctuation">(</span>
                onTap<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">{</span>
                  <span class="token keyword">if</span><span class="token punctuation">(</span>animation<span class="token punctuation">.</span>value <span class="token operator">==</span> <span class="token number">80</span><span class="token punctuation">)</span><span class="token punctuation">{</span>
                    progressController<span class="token punctuation">.</span><span class="token function">reverse</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
                  <span class="token punctuation">}</span><span class="token keyword">else</span> <span class="token punctuation">{</span>
                    progressController<span class="token punctuation">.</span><span class="token function">forward</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
                  <span class="token punctuation">}</span>
                <span class="token punctuation">}</span><span class="token punctuation">,</span>
                child<span class="token punctuation">:</span> <span class="token function">Center</span><span class="token punctuation">(</span>child<span class="token punctuation">:</span> <span class="token function">Text</span><span class="token punctuation">(</span><span class="token string">"${animation.value.toInt()}%"</span><span class="token punctuation">,</span>style<span class="token punctuation">:</span> <span class="token function">TextStyle</span><span class="token punctuation">(</span>
                  fontSize<span class="token punctuation">:</span> <span class="token number">30</span><span class="token punctuation">,</span>
                  fontWeight<span class="token punctuation">:</span> FontWeight<span class="token punctuation">.</span>bold
                <span class="token punctuation">)</span><span class="token punctuation">,</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
          <span class="token punctuation">)</span><span class="token punctuation">,</span>
        <span class="token punctuation">)</span><span class="token punctuation">,</span><font></font>
<font></font>
      <span class="token punctuation">)</span><span class="token punctuation">,</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><p>Check the Video</p>

<iframe title="动画的flutter径向进展 - 一步一步" width="600" height="340" src="https://www.youtube.com/embed/3J5FR2H5FDk?feature=oembed" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen=""></iframe></div></div></figure></div>
