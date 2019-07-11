---
layout: post
title:  做一个酷炫的flutter tab
tag: [flutter,tab]
date: 2019-07-11
---
 
 
 文章来源： [https://mightytechno.com/flutter-boring-tab-to-cool-tab/](https://mightytechno.com/flutter-boring-tab-to-cool-tab/)
 
 <article id="post-807"><header class="entry-header clr">
 
 flutter提供的默认选项卡样式有点无聊。</font><font style="vertical-align: inherit;">但它并没有说我们无法自定义标签的外观和感觉。</font></font></p><p><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">通过更改选项卡指示器可以实现最佳和轻松的自定义。</font><font style="vertical-align: inherit;">在本文中，我将向您展示如何为我们的下一个应用添加5种不同的标签样式。</font></font></p><p><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">首先，我们需要创建一个基本选项卡。</font><font style="vertical-align: inherit;">在这里，我使用DefaultTabController。您可以将DefaultTabController分配给MaterialApp小部件的home参数。</font><font style="vertical-align: inherit;">对于DefaultTabController的子项，您可以将Scaffold与appbar和body一起使用。</font><font style="vertical-align: inherit;">对于appBar，您可以指定Appbar小部件以使标题成为标签的一部分。</font><font style="vertical-align: inherit;">对于正文，您可以添加带有3个子窗口小部件的TabBarView窗口小部件，以在单击选项卡时显示该项目。</font></font></p><p><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">检查默认选项卡的完整代码。</font></font></p><pre class=" language-dart"><code class=" language-dart">
<span class="token function">DefaultTabController</span><span class="token punctuation">(</span>
        length<span class="token punctuation">:</span> <span class="token number">3</span><span class="token punctuation">,</span>
        child<span class="token punctuation">:</span> <span class="token function">Scaffold</span><span class="token punctuation">(</span>
          appBar<span class="token punctuation">:</span> <span class="token function">AppBar</span><span class="token punctuation">(</span>
            elevation<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
            bottom<span class="token punctuation">:</span> <span class="token function">TabBar</span><span class="token punctuation">(</span>indicatorSize<span class="token punctuation">:</span> TabBarIndicatorSize<span class="token punctuation">.</span>label<span class="token punctuation">,</span> tabs<span class="token punctuation">:</span> <span class="token punctuation">[</span>
              <span class="token function">Tab</span><span class="token punctuation">(</span>
                child<span class="token punctuation">:</span> <span class="token function">Align</span><span class="token punctuation">(</span>
                  alignment<span class="token punctuation">:</span> Alignment<span class="token punctuation">.</span>center<span class="token punctuation">,</span>
                  child<span class="token punctuation">:</span> <span class="token function">Text</span><span class="token punctuation">(</span><span class="token string">"APPS"</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                <span class="token punctuation">)</span><span class="token punctuation">,</span>
              <span class="token punctuation">)</span><span class="token punctuation">,</span>
              <span class="token function">Tab</span><span class="token punctuation">(</span>
                child<span class="token punctuation">:</span> <span class="token function">Align</span><span class="token punctuation">(</span>
                  alignment<span class="token punctuation">:</span> Alignment<span class="token punctuation">.</span>center<span class="token punctuation">,</span>
                  child<span class="token punctuation">:</span> <span class="token function">Text</span><span class="token punctuation">(</span><span class="token string">"MOVIES"</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                <span class="token punctuation">)</span><span class="token punctuation">,</span>
              <span class="token punctuation">)</span><span class="token punctuation">,</span>
              <span class="token function">Tab</span><span class="token punctuation">(</span>
                child<span class="token punctuation">:</span> <span class="token function">Align</span><span class="token punctuation">(</span>
                  alignment<span class="token punctuation">:</span> Alignment<span class="token punctuation">.</span>center<span class="token punctuation">,</span>
                  child<span class="token punctuation">:</span> <span class="token function">Text</span><span class="token punctuation">(</span><span class="token string">"GAMES"</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                <span class="token punctuation">)</span><span class="token punctuation">,</span>
              <span class="token punctuation">)</span><span class="token punctuation">,</span>
            <span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
          <span class="token punctuation">)</span><span class="token punctuation">,</span>
          body<span class="token punctuation">:</span> <span class="token function">TabBarView</span><span class="token punctuation">(</span>children<span class="token punctuation">:</span> <span class="token punctuation">[</span>
            <span class="token function">Icon</span><span class="token punctuation">(</span>Icons<span class="token punctuation">.</span>apps<span class="token punctuation">)</span><span class="token punctuation">,</span>
            <span class="token function">Icon</span><span class="token punctuation">(</span>Icons<span class="token punctuation">.</span>movie<span class="token punctuation">)</span><span class="token punctuation">,</span>
            <span class="token function">Icon</span><span class="token punctuation">(</span>Icons<span class="token punctuation">.</span>games<span class="token punctuation">)</span><span class="token punctuation">,</span>
          <span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
        <span class="token punctuation">)</span>
    <span class="token punctuation">)</span>
</code>
</pre><h2><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">1.Round Corners</font></font></h2><p><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">在这里，我们将向选项卡指示器添加圆角样式。</font><font style="vertical-align: inherit;">首先，我将简要介绍一下我们要修改的参数。</font></font></p><ul><li><strong><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">unselectedLabelColor</font></font></strong><font style="vertical-align: inherit;"><font style="vertical-align: inherit;"> - 指示符不存在的标签的颜色。</font><font style="vertical-align: inherit;">基本上，尚未选择的指标。</font></font><br><strong><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">indicatorSize</font></font></strong><font style="vertical-align: inherit;"><font style="vertical-align: inherit;"> - 选定的指标大小。</font><font style="vertical-align: inherit;">我们可以添加两个值来指示标签宽度或标签宽度。</font></font><br><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">指标 - 这是我们要为指标</font></font><br><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">标签</font><font style="vertical-align: inherit;">指定自定义样式的地方</font><font style="vertical-align: inherit;">- 这将包含标签标题列表。</font><font style="vertical-align: inherit;">在这里，我们可以为每个标签页添加额外的样式。</font></font></li></ul><p><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">圆角样式可以通过添加带有borderRadius 50的BoxDecoration来完成。</font></font></p><p><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">然后我将为每个标签页添加一个红色边框。</font><font style="vertical-align: inherit;">当您选择选项卡时，它将填充红色。</font><font style="vertical-align: inherit;">如果您对边框不感兴趣，可以删除添加零件的边框并保持简洁。</font></font></p><figure class="wp-block-image is-resized"><img src="https://mightytechno.com/wp-content/uploads/2019/07/Screen-Shot-2019-07-09-at-5.51.01-PM-1.png" data-src="https://mightytechno.com/wp-content/uploads/2019/07/Screen-Shot-2019-07-09-at-5.51.01-PM-1.png" alt="扑圆角标签" class="wp-image-859 lazy-loaded" width="512" height="102" data-srcset="" sizes="(max-width: 512px) 100vw, 512px" srcset="https://mightytechno.com/wp-content/uploads/2019/07/Screen-Shot-2019-07-09-at-5.51.01-PM-1.png 682w, https://mightytechno.com/wp-content/uploads/2019/07/Screen-Shot-2019-07-09-at-5.51.01-PM-1-300x60.png 300w, https://mightytechno.com/wp-content/uploads/2019/07/Screen-Shot-2019-07-09-at-5.51.01-PM-1-560x112.png 560w"><noscript><img src="https://mightytechno.com/wp-content/uploads/2019/07/Screen-Shot-2019-07-09-at-5.51.01-PM-1.png"/></noscript></figure><pre class=" language-dart"><code class=" language-dart">
<span class="token function">DefaultTabController</span><span class="token punctuation">(</span>
      length<span class="token punctuation">:</span> <span class="token number">3</span><span class="token punctuation">,</span>
      child<span class="token punctuation">:</span> <span class="token function">Scaffold</span><span class="token punctuation">(</span>
        appBar<span class="token punctuation">:</span> <span class="token function">AppBar</span><span class="token punctuation">(</span>
          backgroundColor<span class="token punctuation">:</span> Colors<span class="token punctuation">.</span>white<span class="token punctuation">,</span>
          elevation<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
          bottom<span class="token punctuation">:</span> <span class="token function">TabBar</span><span class="token punctuation">(</span>
              unselectedLabelColor<span class="token punctuation">:</span> Colors<span class="token punctuation">.</span>redAccent<span class="token punctuation">,</span>
              indicatorSize<span class="token punctuation">:</span> TabBarIndicatorSize<span class="token punctuation">.</span>label<span class="token punctuation">,</span>
              indicator<span class="token punctuation">:</span> <span class="token function">BoxDecoration</span><span class="token punctuation">(</span>
                  borderRadius<span class="token punctuation">:</span> BorderRadius<span class="token punctuation">.</span><span class="token function">circular</span><span class="token punctuation">(</span><span class="token number">50</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                  color<span class="token punctuation">:</span> Colors<span class="token punctuation">.</span>redAccent<span class="token punctuation">)</span><span class="token punctuation">,</span>
              tabs<span class="token punctuation">:</span> <span class="token punctuation">[</span>
                <span class="token function">Tab</span><span class="token punctuation">(</span>
                  child<span class="token punctuation">:</span> <span class="token function">Container</span><span class="token punctuation">(</span>
                    decoration<span class="token punctuation">:</span> <span class="token function">BoxDecoration</span><span class="token punctuation">(</span>
                        borderRadius<span class="token punctuation">:</span> BorderRadius<span class="token punctuation">.</span><span class="token function">circular</span><span class="token punctuation">(</span><span class="token number">50</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                        border<span class="token punctuation">:</span> Border<span class="token punctuation">.</span><span class="token function">all</span><span class="token punctuation">(</span>color<span class="token punctuation">:</span> Colors<span class="token punctuation">.</span>redAccent<span class="token punctuation">,</span> width<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                    child<span class="token punctuation">:</span> <span class="token function">Align</span><span class="token punctuation">(</span>
                      alignment<span class="token punctuation">:</span> Alignment<span class="token punctuation">.</span>center<span class="token punctuation">,</span>
                      child<span class="token punctuation">:</span> <span class="token function">Text</span><span class="token punctuation">(</span><span class="token string">"APPS"</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                    <span class="token punctuation">)</span><span class="token punctuation">,</span>
                  <span class="token punctuation">)</span><span class="token punctuation">,</span>
                <span class="token punctuation">)</span><span class="token punctuation">,</span>
                <span class="token function">Tab</span><span class="token punctuation">(</span>
                  child<span class="token punctuation">:</span> <span class="token function">Container</span><span class="token punctuation">(</span>
                    decoration<span class="token punctuation">:</span> <span class="token function">BoxDecoration</span><span class="token punctuation">(</span>
                        borderRadius<span class="token punctuation">:</span> BorderRadius<span class="token punctuation">.</span><span class="token function">circular</span><span class="token punctuation">(</span><span class="token number">50</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                        border<span class="token punctuation">:</span> Border<span class="token punctuation">.</span><span class="token function">all</span><span class="token punctuation">(</span>color<span class="token punctuation">:</span> Colors<span class="token punctuation">.</span>redAccent<span class="token punctuation">,</span> width<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                    child<span class="token punctuation">:</span> <span class="token function">Align</span><span class="token punctuation">(</span>
                      alignment<span class="token punctuation">:</span> Alignment<span class="token punctuation">.</span>center<span class="token punctuation">,</span>
                      child<span class="token punctuation">:</span> <span class="token function">Text</span><span class="token punctuation">(</span><span class="token string">"MOVIES"</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                    <span class="token punctuation">)</span><span class="token punctuation">,</span>
                  <span class="token punctuation">)</span><span class="token punctuation">,</span>
                <span class="token punctuation">)</span><span class="token punctuation">,</span>
                <span class="token function">Tab</span><span class="token punctuation">(</span>
                  child<span class="token punctuation">:</span> <span class="token function">Container</span><span class="token punctuation">(</span>
                    decoration<span class="token punctuation">:</span> <span class="token function">BoxDecoration</span><span class="token punctuation">(</span>
                        borderRadius<span class="token punctuation">:</span> BorderRadius<span class="token punctuation">.</span><span class="token function">circular</span><span class="token punctuation">(</span><span class="token number">50</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                        border<span class="token punctuation">:</span> Border<span class="token punctuation">.</span><span class="token function">all</span><span class="token punctuation">(</span>color<span class="token punctuation">:</span> Colors<span class="token punctuation">.</span>redAccent<span class="token punctuation">,</span> width<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                    child<span class="token punctuation">:</span> <span class="token function">Align</span><span class="token punctuation">(</span>
                      alignment<span class="token punctuation">:</span> Alignment<span class="token punctuation">.</span>center<span class="token punctuation">,</span>
                      child<span class="token punctuation">:</span> <span class="token function">Text</span><span class="token punctuation">(</span><span class="token string">"GAMES"</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                    <span class="token punctuation">)</span><span class="token punctuation">,</span>
                  <span class="token punctuation">)</span><span class="token punctuation">,</span>
                <span class="token punctuation">)</span><span class="token punctuation">,</span>
              <span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
        <span class="token punctuation">)</span><span class="token punctuation">,</span>
        body<span class="token punctuation">:</span> <span class="token function">TabBarView</span><span class="token punctuation">(</span>children<span class="token punctuation">:</span> <span class="token punctuation">[</span>
          <span class="token function">Icon</span><span class="token punctuation">(</span>Icons<span class="token punctuation">.</span>apps<span class="token punctuation">)</span><span class="token punctuation">,</span>
          <span class="token function">Icon</span><span class="token punctuation">(</span>Icons<span class="token punctuation">.</span>movie<span class="token punctuation">)</span><span class="token punctuation">,</span>
          <span class="token function">Icon</span><span class="token punctuation">(</span>Icons<span class="token punctuation">.</span>games<span class="token punctuation">)</span><span class="token punctuation">,</span>
        <span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
      <span class="token punctuation">)</span><span class="token punctuation">)</span>
</code></pre><h2><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">2.具有渐变的圆角</font></font></h2><p>In here I removed the style which I was added to each tab. After that added a gradient to BoxDecoration. In here I used LinearGradient with two colours. You can change the gradient-based on your preferences.</p><figure class="wp-block-image"><img src="https://mightytechno.com/wp-content/uploads/2019/07/Screen-Shot-2019-07-09-at-5.50.40-PM.png" data-src="https://mightytechno.com/wp-content/uploads/2019/07/Screen-Shot-2019-07-09-at-5.50.40-PM.png" alt="用渐变标签飘动圆角" class="wp-image-860 lazy-loaded" data-srcset="" sizes="(max-width: 688px) 100vw, 688px" srcset="https://mightytechno.com/wp-content/uploads/2019/07/Screen-Shot-2019-07-09-at-5.50.40-PM.png 688w, https://mightytechno.com/wp-content/uploads/2019/07/Screen-Shot-2019-07-09-at-5.50.40-PM-300x51.png 300w, https://mightytechno.com/wp-content/uploads/2019/07/Screen-Shot-2019-07-09-at-5.50.40-PM-560x94.png 560w"><noscript><img src="https://mightytechno.com/wp-content/uploads/2019/07/Screen-Shot-2019-07-09-at-5.50.40-PM.png"/></noscript></figure><pre class=" language-dart"><code class=" language-dart">
<span class="token function">DefaultTabController</span><span class="token punctuation">(</span>
        length<span class="token punctuation">:</span> <span class="token number">3</span><span class="token punctuation">,</span>
        child<span class="token punctuation">:</span> <span class="token function">Scaffold</span><span class="token punctuation">(</span>
          appBar<span class="token punctuation">:</span> <span class="token function">AppBar</span><span class="token punctuation">(</span>
            backgroundColor<span class="token punctuation">:</span> Colors<span class="token punctuation">.</span>white<span class="token punctuation">,</span>
            elevation<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
            bottom<span class="token punctuation">:</span> <span class="token function">TabBar</span><span class="token punctuation">(</span>
                unselectedLabelColor<span class="token punctuation">:</span> Colors<span class="token punctuation">.</span>redAccent<span class="token punctuation">,</span>
                indicatorSize<span class="token punctuation">:</span> TabBarIndicatorSize<span class="token punctuation">.</span>tab<span class="token punctuation">,</span>
                indicator<span class="token punctuation">:</span> <span class="token function">BoxDecoration</span><span class="token punctuation">(</span>
                    gradient<span class="token punctuation">:</span> <span class="token function">LinearGradient</span><span class="token punctuation">(</span>
                        colors<span class="token punctuation">:</span> <span class="token punctuation">[</span>Colors<span class="token punctuation">.</span>redAccent<span class="token punctuation">,</span> Colors<span class="token punctuation">.</span>orangeAccent<span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                    borderRadius<span class="token punctuation">:</span> BorderRadius<span class="token punctuation">.</span><span class="token function">circular</span><span class="token punctuation">(</span><span class="token number">50</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                    color<span class="token punctuation">:</span> Colors<span class="token punctuation">.</span>redAccent<span class="token punctuation">)</span><span class="token punctuation">,</span>
                tabs<span class="token punctuation">:</span> <span class="token punctuation">[</span>
                  <span class="token function">Tab</span><span class="token punctuation">(</span>
                    child<span class="token punctuation">:</span> <span class="token function">Align</span><span class="token punctuation">(</span>
                      alignment<span class="token punctuation">:</span> Alignment<span class="token punctuation">.</span>center<span class="token punctuation">,</span>
                      child<span class="token punctuation">:</span> <span class="token function">Text</span><span class="token punctuation">(</span><span class="token string">"APPS"</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                    <span class="token punctuation">)</span><span class="token punctuation">,</span>
                  <span class="token punctuation">)</span><span class="token punctuation">,</span>
                  <span class="token function">Tab</span><span class="token punctuation">(</span>
                    child<span class="token punctuation">:</span> <span class="token function">Align</span><span class="token punctuation">(</span>
                      alignment<span class="token punctuation">:</span> Alignment<span class="token punctuation">.</span>center<span class="token punctuation">,</span>
                      child<span class="token punctuation">:</span> <span class="token function">Text</span><span class="token punctuation">(</span><span class="token string">"MOVIES"</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                    <span class="token punctuation">)</span><span class="token punctuation">,</span>
                  <span class="token punctuation">)</span><span class="token punctuation">,</span>
                  <span class="token function">Tab</span><span class="token punctuation">(</span>
                    child<span class="token punctuation">:</span> <span class="token function">Align</span><span class="token punctuation">(</span>
                      alignment<span class="token punctuation">:</span> Alignment<span class="token punctuation">.</span>center<span class="token punctuation">,</span>
                      child<span class="token punctuation">:</span> <span class="token function">Text</span><span class="token punctuation">(</span><span class="token string">"GAMES"</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                    <span class="token punctuation">)</span><span class="token punctuation">,</span>
                  <span class="token punctuation">)</span><span class="token punctuation">,</span>
                <span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
          <span class="token punctuation">)</span><span class="token punctuation">,</span>
          body<span class="token punctuation">:</span> <span class="token function">TabBarView</span><span class="token punctuation">(</span>children<span class="token punctuation">:</span> <span class="token punctuation">[</span>
            <span class="token function">Icon</span><span class="token punctuation">(</span>Icons<span class="token punctuation">.</span>apps<span class="token punctuation">)</span><span class="token punctuation">,</span>
            <span class="token function">Icon</span><span class="token punctuation">(</span>Icons<span class="token punctuation">.</span>movie<span class="token punctuation">)</span><span class="token punctuation">,</span>
            <span class="token function">Icon</span><span class="token punctuation">(</span>Icons<span class="token punctuation">.</span>games<span class="token punctuation">)</span><span class="token punctuation">,</span>
          <span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
        <span class="token punctuation">)</span>
     <span class="token punctuation">)</span>
</code></pre><h2>3.Square Style</h2><p>Square style can be done by changing small code in the previous one. BorderRadius of the boxDecoration can be changed by adding 10 for both leftTop and rightTop. Then I change the appbar backgroundColor to the red to make it look better.</p><figure class="wp-block-image"><img src="https://mightytechno.com/wp-content/uploads/2019/07/Screen-Shot-2019-07-09-at-6.00.44-PM.png" data-src="https://mightytechno.com/wp-content/uploads/2019/07/Screen-Shot-2019-07-09-at-6.00.44-PM.png" alt="扑方形标签样式" class="wp-image-861 lazy-loaded" data-srcset="" sizes="(max-width: 682px) 100vw, 682px" srcset="https://mightytechno.com/wp-content/uploads/2019/07/Screen-Shot-2019-07-09-at-6.00.44-PM.png 682w, https://mightytechno.com/wp-content/uploads/2019/07/Screen-Shot-2019-07-09-at-6.00.44-PM-300x77.png 300w, https://mightytechno.com/wp-content/uploads/2019/07/Screen-Shot-2019-07-09-at-6.00.44-PM-560x145.png 560w"><noscript><img src="https://mightytechno.com/wp-content/uploads/2019/07/Screen-Shot-2019-07-09-at-6.00.44-PM.png"/></noscript></figure><pre class=" language-dart"><code class=" language-dart">


<span class="token function">DefaultTabController</span><span class="token punctuation">(</span>
        length<span class="token punctuation">:</span> <span class="token number">3</span><span class="token punctuation">,</span>
        child<span class="token punctuation">:</span> <span class="token function">Scaffold</span><span class="token punctuation">(</span>
          appBar<span class="token punctuation">:</span> <span class="token function">AppBar</span><span class="token punctuation">(</span>
            backgroundColor<span class="token punctuation">:</span> Colors<span class="token punctuation">.</span>redAccent<span class="token punctuation">,</span>
            elevation<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
            bottom<span class="token punctuation">:</span> <span class="token function">TabBar</span><span class="token punctuation">(</span>
                labelColor<span class="token punctuation">:</span> Colors<span class="token punctuation">.</span>redAccent<span class="token punctuation">,</span>
                unselectedLabelColor<span class="token punctuation">:</span> Colors<span class="token punctuation">.</span>white<span class="token punctuation">,</span>
                indicatorSize<span class="token punctuation">:</span> TabBarIndicatorSize<span class="token punctuation">.</span>label<span class="token punctuation">,</span>
                indicator<span class="token punctuation">:</span> <span class="token function">BoxDecoration</span><span class="token punctuation">(</span>
                    borderRadius<span class="token punctuation">:</span> BorderRadius<span class="token punctuation">.</span><span class="token function">only</span><span class="token punctuation">(</span>
                        topLeft<span class="token punctuation">:</span> Radius<span class="token punctuation">.</span><span class="token function">circular</span><span class="token punctuation">(</span><span class="token number">10</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                        topRight<span class="token punctuation">:</span> Radius<span class="token punctuation">.</span><span class="token function">circular</span><span class="token punctuation">(</span><span class="token number">10</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                    color<span class="token punctuation">:</span> Colors<span class="token punctuation">.</span>white<span class="token punctuation">)</span><span class="token punctuation">,</span>
                tabs<span class="token punctuation">:</span> <span class="token punctuation">[</span>
                  <span class="token function">Tab</span><span class="token punctuation">(</span>
                    child<span class="token punctuation">:</span> <span class="token function">Align</span><span class="token punctuation">(</span>
                      alignment<span class="token punctuation">:</span> Alignment<span class="token punctuation">.</span>center<span class="token punctuation">,</span>
                      child<span class="token punctuation">:</span> <span class="token function">Text</span><span class="token punctuation">(</span><span class="token string">"APPS"</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                    <span class="token punctuation">)</span><span class="token punctuation">,</span>
                  <span class="token punctuation">)</span><span class="token punctuation">,</span>
                  <span class="token function">Tab</span><span class="token punctuation">(</span>
                    child<span class="token punctuation">:</span> <span class="token function">Align</span><span class="token punctuation">(</span>
                      alignment<span class="token punctuation">:</span> Alignment<span class="token punctuation">.</span>center<span class="token punctuation">,</span>
                      child<span class="token punctuation">:</span> <span class="token function">Text</span><span class="token punctuation">(</span><span class="token string">"MOVIES"</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                    <span class="token punctuation">)</span><span class="token punctuation">,</span>
                  <span class="token punctuation">)</span><span class="token punctuation">,</span>
                  <span class="token function">Tab</span><span class="token punctuation">(</span>
                    child<span class="token punctuation">:</span> <span class="token function">Align</span><span class="token punctuation">(</span>
                      alignment<span class="token punctuation">:</span> Alignment<span class="token punctuation">.</span>center<span class="token punctuation">,</span>
                      child<span class="token punctuation">:</span> <span class="token function">Text</span><span class="token punctuation">(</span><span class="token string">"GAMES"</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                    <span class="token punctuation">)</span><span class="token punctuation">,</span>
                  <span class="token punctuation">)</span><span class="token punctuation">,</span>
                <span class="token punctuation">]</span>
            <span class="token punctuation">)</span><span class="token punctuation">,</span>
          <span class="token punctuation">)</span><span class="token punctuation">,</span>
          body<span class="token punctuation">:</span> <span class="token function">TabBarView</span><span class="token punctuation">(</span>children<span class="token punctuation">:</span> <span class="token punctuation">[</span>
            <span class="token function">Icon</span><span class="token punctuation">(</span>Icons<span class="token punctuation">.</span>apps<span class="token punctuation">)</span><span class="token punctuation">,</span>
            <span class="token function">Icon</span><span class="token punctuation">(</span>Icons<span class="token punctuation">.</span>movie<span class="token punctuation">)</span><span class="token punctuation">,</span>
            <span class="token function">Icon</span><span class="token punctuation">(</span>Icons<span class="token punctuation">.</span>games<span class="token punctuation">)</span><span class="token punctuation">,</span>
          <span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
        <span class="token punctuation">)</span>
     <span class="token punctuation">)</span>
</code></pre><h2>4.Diamond Style</h2><p>Diamond tab style can be done by adding ShapeDecoration with BeveledRectangleBorder for the shape parameter.BeveledRectangleBorder will allow you to add flatten corner instead of round corners.</p><blockquote class="wp-block-quote"><p>The line segments that connect the rectangle’s four sides will begin and at locations offset by the corresponding border radius, but not farther than the side’s center. If all the border radii exceed the sides’ half widths/heights the resulting shape is diamond made by connecting the centers of the sides.</p><cite>BeveledRectangleBorder – flutter.dev</cite></blockquote><p>In here I used borderRadius as 10 to make it look like this.</p><figure class="wp-block-image"><img src="https://mightytechno.com/wp-content/uploads/2019/07/Screen-Shot-2019-07-09-at-6.12.28-PM.png" data-src="https://mightytechno.com/wp-content/uploads/2019/07/Screen-Shot-2019-07-09-at-6.12.28-PM.png" alt="扑动钻石标签造型" class="wp-image-862 lazy-loaded" data-srcset="" sizes="(max-width: 682px) 100vw, 682px" srcset="https://mightytechno.com/wp-content/uploads/2019/07/Screen-Shot-2019-07-09-at-6.12.28-PM.png 682w, https://mightytechno.com/wp-content/uploads/2019/07/Screen-Shot-2019-07-09-at-6.12.28-PM-300x69.png 300w, https://mightytechno.com/wp-content/uploads/2019/07/Screen-Shot-2019-07-09-at-6.12.28-PM-560x128.png 560w"><noscript><img src="https://mightytechno.com/wp-content/uploads/2019/07/Screen-Shot-2019-07-09-at-6.12.28-PM.png"/></noscript></figure><pre class=" language-dart"><code class=" language-dart">
<span class="token function">DefaultTabController</span><span class="token punctuation">(</span>
        length<span class="token punctuation">:</span> <span class="token number">3</span><span class="token punctuation">,</span>
        child<span class="token punctuation">:</span> <span class="token function">Scaffold</span><span class="token punctuation">(</span>
          appBar<span class="token punctuation">:</span> <span class="token function">AppBar</span><span class="token punctuation">(</span>
            backgroundColor<span class="token punctuation">:</span> Colors<span class="token punctuation">.</span>white<span class="token punctuation">,</span>
            elevation<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
            bottom<span class="token punctuation">:</span> <span class="token function">TabBar</span><span class="token punctuation">(</span>
                unselectedLabelColor<span class="token punctuation">:</span> Colors<span class="token punctuation">.</span>redAccent<span class="token punctuation">,</span>
                indicatorPadding<span class="token punctuation">:</span> EdgeInsets<span class="token punctuation">.</span><span class="token function">only</span><span class="token punctuation">(</span>left<span class="token punctuation">:</span> <span class="token number">30</span><span class="token punctuation">,</span> right<span class="token punctuation">:</span> <span class="token number">30</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                indicator<span class="token punctuation">:</span> <span class="token function">ShapeDecoration</span><span class="token punctuation">(</span>
                    color<span class="token punctuation">:</span> Colors<span class="token punctuation">.</span>redAccent<span class="token punctuation">,</span>
                    shape<span class="token punctuation">:</span> <span class="token function">BeveledRectangleBorder</span><span class="token punctuation">(</span>
                        borderRadius<span class="token punctuation">:</span> BorderRadius<span class="token punctuation">.</span><span class="token function">circular</span><span class="token punctuation">(</span><span class="token number">10</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                        side<span class="token punctuation">:</span> <span class="token function">BorderSide</span><span class="token punctuation">(</span>
                          color<span class="token punctuation">:</span> Colors<span class="token punctuation">.</span>redAccent<span class="token punctuation">,</span>
                        <span class="token punctuation">)</span>
                    <span class="token punctuation">)</span>
                <span class="token punctuation">)</span><span class="token punctuation">,</span>
                tabs<span class="token punctuation">:</span> <span class="token punctuation">[</span>
                  <span class="token function">Tab</span><span class="token punctuation">(</span>
                    child<span class="token punctuation">:</span> <span class="token function">Align</span><span class="token punctuation">(</span>
                      alignment<span class="token punctuation">:</span> Alignment<span class="token punctuation">.</span>center<span class="token punctuation">,</span>
                      child<span class="token punctuation">:</span> <span class="token function">Text</span><span class="token punctuation">(</span><span class="token string">"APPS"</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                    <span class="token punctuation">)</span><span class="token punctuation">,</span>
                  <span class="token punctuation">)</span><span class="token punctuation">,</span>
                  <span class="token function">Tab</span><span class="token punctuation">(</span>
                    child<span class="token punctuation">:</span> <span class="token function">Align</span><span class="token punctuation">(</span>
                      alignment<span class="token punctuation">:</span> Alignment<span class="token punctuation">.</span>center<span class="token punctuation">,</span>
                      child<span class="token punctuation">:</span> <span class="token function">Text</span><span class="token punctuation">(</span><span class="token string">"MOVIES"</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                    <span class="token punctuation">)</span><span class="token punctuation">,</span>
                  <span class="token punctuation">)</span><span class="token punctuation">,</span>
                  <span class="token function">Tab</span><span class="token punctuation">(</span>
                    child<span class="token punctuation">:</span> <span class="token function">Align</span><span class="token punctuation">(</span>
                      alignment<span class="token punctuation">:</span> Alignment<span class="token punctuation">.</span>center<span class="token punctuation">,</span>
                      child<span class="token punctuation">:</span> <span class="token function">Text</span><span class="token punctuation">(</span><span class="token string">"GAMES"</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                    <span class="token punctuation">)</span><span class="token punctuation">,</span>
                  <span class="token punctuation">)</span><span class="token punctuation">,</span>
                <span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
          <span class="token punctuation">)</span><span class="token punctuation">,</span>
          body<span class="token punctuation">:</span> <span class="token function">TabBarView</span><span class="token punctuation">(</span>children<span class="token punctuation">:</span> <span class="token punctuation">[</span>
            <span class="token function">Icon</span><span class="token punctuation">(</span>Icons<span class="token punctuation">.</span>apps<span class="token punctuation">)</span><span class="token punctuation">,</span>
            <span class="token function">Icon</span><span class="token punctuation">(</span>Icons<span class="token punctuation">.</span>movie<span class="token punctuation">)</span><span class="token punctuation">,</span>
            <span class="token function">Icon</span><span class="token punctuation">(</span>Icons<span class="token punctuation">.</span>games<span class="token punctuation">)</span><span class="token punctuation">,</span>
          <span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
        <span class="token punctuation">)</span>
     <span class="token punctuation">)</span>
</code></pre><h2>5.Diamond Style 2</h2><p>Likewise, by changing the borderRadius of the BeveledRectangleBorder, you can achieve different styles. In here I used borderRadius as 20. You can try different styles by changing this borderRadius value.</p><figure class="wp-block-image"><img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" data-src="https://mightytechno.com/wp-content/uploads/2019/07/Screen-Shot-2019-07-09-at-6.12.41-PM.png" alt="扑动钻石标签造型" class="wp-image-863" data-srcset="https://mightytechno.com/wp-content/uploads/2019/07/Screen-Shot-2019-07-09-at-6.12.41-PM.png 682w, https://mightytechno.com/wp-content/uploads/2019/07/Screen-Shot-2019-07-09-at-6.12.41-PM-300x59.png 300w, https://mightytechno.com/wp-content/uploads/2019/07/Screen-Shot-2019-07-09-at-6.12.41-PM-560x110.png 560w" sizes="(max-width: 682px) 100vw, 682px"><noscript><img src="https://mightytechno.com/wp-content/uploads/2019/07/Screen-Shot-2019-07-09-at-6.12.41-PM.png"/></noscript></figure><pre class=" language-dart"><code class=" language-dart">
<span class="token function">DefaultTabController</span><span class="token punctuation">(</span>
        length<span class="token punctuation">:</span> <span class="token number">3</span><span class="token punctuation">,</span>
        child<span class="token punctuation">:</span> <span class="token function">Scaffold</span><span class="token punctuation">(</span>
          appBar<span class="token punctuation">:</span> <span class="token function">AppBar</span><span class="token punctuation">(</span>
            backgroundColor<span class="token punctuation">:</span> Colors<span class="token punctuation">.</span>white<span class="token punctuation">,</span>
            elevation<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
            bottom<span class="token punctuation">:</span> <span class="token function">TabBar</span><span class="token punctuation">(</span>
                unselectedLabelColor<span class="token punctuation">:</span> Colors<span class="token punctuation">.</span>redAccent<span class="token punctuation">,</span>
                indicatorPadding<span class="token punctuation">:</span> EdgeInsets<span class="token punctuation">.</span><span class="token function">only</span><span class="token punctuation">(</span>left<span class="token punctuation">:</span> <span class="token number">30</span><span class="token punctuation">,</span> right<span class="token punctuation">:</span> <span class="token number">30</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                indicator<span class="token punctuation">:</span> <span class="token function">ShapeDecoration</span><span class="token punctuation">(</span>
                    color<span class="token punctuation">:</span> Colors<span class="token punctuation">.</span>redAccent<span class="token punctuation">,</span>
                    shape<span class="token punctuation">:</span> <span class="token function">BeveledRectangleBorder</span><span class="token punctuation">(</span>
                        borderRadius<span class="token punctuation">:</span> BorderRadius<span class="token punctuation">.</span><span class="token function">circular</span><span class="token punctuation">(</span><span class="token number">20</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                        side<span class="token punctuation">:</span> <span class="token function">BorderSide</span><span class="token punctuation">(</span>
                          color<span class="token punctuation">:</span> Colors<span class="token punctuation">.</span>redAccent<span class="token punctuation">,</span>
                        <span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                tabs<span class="token punctuation">:</span> <span class="token punctuation">[</span>
                  <span class="token function">Tab</span><span class="token punctuation">(</span>
                    child<span class="token punctuation">:</span> <span class="token function">Align</span><span class="token punctuation">(</span>
                      alignment<span class="token punctuation">:</span> Alignment<span class="token punctuation">.</span>center<span class="token punctuation">,</span>
                      child<span class="token punctuation">:</span> <span class="token function">Text</span><span class="token punctuation">(</span><span class="token string">"APPS"</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                    <span class="token punctuation">)</span><span class="token punctuation">,</span>
                  <span class="token punctuation">)</span><span class="token punctuation">,</span>
                  <span class="token function">Tab</span><span class="token punctuation">(</span>
                    child<span class="token punctuation">:</span> <span class="token function">Align</span><span class="token punctuation">(</span>
                      alignment<span class="token punctuation">:</span> Alignment<span class="token punctuation">.</span>center<span class="token punctuation">,</span>
                      child<span class="token punctuation">:</span> <span class="token function">Text</span><span class="token punctuation">(</span><span class="token string">"MOVIES"</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                    <span class="token punctuation">)</span><span class="token punctuation">,</span>
                  <span class="token punctuation">)</span><span class="token punctuation">,</span>
                  <span class="token function">Tab</span><span class="token punctuation">(</span>
                    child<span class="token punctuation">:</span> <span class="token function">Align</span><span class="token punctuation">(</span>
                      alignment<span class="token punctuation">:</span> Alignment<span class="token punctuation">.</span>center<span class="token punctuation">,</span>
                      child<span class="token punctuation">:</span> <span class="token function">Text</span><span class="token punctuation">(</span><span class="token string">"GAMES"</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                    <span class="token punctuation">)</span><span class="token punctuation">,</span>
                  <span class="token punctuation">)</span><span class="token punctuation">,</span>
                <span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
          <span class="token punctuation">)</span><span class="token punctuation">,</span>
          body<span class="token punctuation">:</span> <span class="token function">TabBarView</span><span class="token punctuation">(</span>children<span class="token punctuation">:</span> <span class="token punctuation">[</span>
            <span class="token function">Icon</span><span class="token punctuation">(</span>Icons<span class="token punctuation">.</span>apps<span class="token punctuation">)</span><span class="token punctuation">,</span>
            <span class="token function">Icon</span><span class="token punctuation">(</span>Icons<span class="token punctuation">.</span>movie<span class="token punctuation">)</span><span class="token punctuation">,</span>
            <span class="token function">Icon</span><span class="token punctuation">(</span>Icons<span class="token punctuation">.</span>games<span class="token punctuation">)</span><span class="token punctuation">,</span>
          <span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
        <span class="token punctuation">)</span>
     <span class="token punctuation">)</span>
</code></pre><p>I hope you get a better understanding of how to change the tab style by a few lines of code. If you are like to watch this in action, please watch the video mentioned below. Don’t forget to <strong>subscribe my channel</strong> <img draggable="false" class="emoji" alt="🤗" src="https://s.w.org/images/core/emoji/12.0.0-1/svg/1f917.svg"></p><figure class="wp-block-embed-youtube wp-block-embed is-type-video is-provider-youtube wp-embed-aspect-4-3 wp-has-aspect-ratio"><div class="wp-block-embed__wrapper"><div class="oceanwp-oembed-wrap clr"><iframe title="Flutter应用程序的5种不同选项卡样式" width="1200" height="900" src="https://www.youtube.com/embed/Vnd0yvCkdNA?feature=oembed" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen=""></iframe></div></div></figure><h3><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">参考</font></font></h3><p><a href="https://flutter.dev/docs/cookbook/design/tabs"><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">https://flutter.dev/docs/cookbook/design/tabs</font></font></a></p><p><a href="https://api.flutter.dev/flutter/painting/BeveledRectangleBorder-class.html"><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">https://api.flutter.dev/flutter/painting/BeveledRectangleBorder-class.html</font></font></a></p> 
 