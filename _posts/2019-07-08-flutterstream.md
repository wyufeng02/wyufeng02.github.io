---
layout: post
title:  Flutter完整开发实战详解(十一、全面深入理解Stream)
tag: [flutter,stream]
date: 2019-07-08
---

<div data-v-4f8894a8="" data-id="5cc2bc3fe51d456e4c4c0077" itemprop="articleBody" class="article-content"><p>作为系列文章的第十一篇，本篇将非常全面带你了解 Flutter 中最关键的设计之一，深入原理帮助你理解 Stream 全家桶，这也许是目前 Flutter 中最全面的 Stream 分析了。</p>
<blockquote>
<p>前文：</p>
<ul>
<li><a target="_blank" href="https://juejin.im/post/5b631d326fb9a04fce524db2" rel="">一、 Dart语言和Flutter基础</a></li>
<li><a target="_blank" href="https://juejin.im/post/5b685a2a5188251ac22b71c0" rel="">二、 快速开发实战篇</a></li>
<li><a target="_blank" href="https://juejin.im/post/5b6fd4dc6fb9a0099e711162" rel="">三、 打包与填坑篇</a></li>
<li><a target="_blank" href="https://juejin.im/post/5b79767ff265da435450a873" rel="">四、 Redux、主题、国际化</a></li>
<li><a target="_blank" href="https://juejin.im/post/5bc450dff265da0a951f032b" rel="">五、 深入探索</a></li>
<li><a target="_blank" href="https://juejin.im/post/5c7e853151882549664b0543" rel="">六、 深入Widget原理</a></li>
<li><a target="_blank" href="https://juejin.im/post/5c8c6ef7e51d450ba7233f51" rel="">七、 深入布局原理</a></li>
<li><a target="_blank" href="https://juejin.im/post/5c9e328251882567b91e1cfb" rel="">八、 实用技巧与填坑</a></li>
<li><a target="_blank" href="https://juejin.im/post/5ca0e0aff265da309728659a" rel="">九、 深入绘制原理</a></li>
<li><a target="_blank" href="https://juejin.im/post/5cb1896ce51d456e63760449" rel="">十、 深入图片加载流程</a></li>
</ul>
</blockquote>
<h2 class="heading" data-id="heading-0">一、Stream 由浅入深</h2>
<p><code>Stream</code> 在 Flutter 是属于非常关键的概念，在 Flutter 中，状态管理除了 <code>InheritedWidget</code> 之外，无论 <code>rxdart</code>，<code>Bloc</code> 模式，<code>flutter_redux</code> ，<code>fish_redux</code> 都离不开 <code>Stream</code> 的封装，而事实上 <code>Stream</code> 并不是 Flutter 中特有的，而是 Dart 中自带的逻辑。</p>
<p>通俗来说，<code>Stream</code> 就是事件流或者管道，事件流相信大家并不陌生，简单的说就是：<strong>基于事件流驱动设计代码，然后监听订阅事件，并针对事件变换处理响应</strong>。</p>
<p>而在 Flutter 中，整个 <code>Stream</code> 设计外部暴露的对象主要如下图，主要包含了 <code>StreamController</code> 、<code>Sink</code> 、<code>Stream</code> 、<code>StreamSubscription</code> 四个对象。</p>
<p></p><figure><img alt="图片要换" class="lazyload inited loaded" data-src="https://user-gold-cdn.xitu.io/2019/4/26/16a58739c5854037?imageView2/0/w/1280/h/960/format/webp/ignore-error/1" data-width="1240" data-height="635" src="https://user-gold-cdn.xitu.io/2019/4/26/16a58739c5854037?imageView2/0/w/1280/h/960/format/webp/ignore-error/1"><figcaption></figcaption></figure><p></p>
<h4 class="heading" data-id="heading-1">1、Stream 的简单使用</h4>
<p>如下代码所示，<code>Stream</code> 的使用并不复杂，一般我们只需要：</p>
<ul>
<li>创建 <code>StreamController</code> ，</li>
<li>然后获取 <code>StreamSink</code> 用做事件入口，</li>
<li>获取 <code>Stream</code> 对象用于监听，</li>
<li>并且通过监听得到 <code>StreamSubscription</code> 管理事件订阅，最后在不需要时关闭即可，看起来是不是很简单？</li>
</ul>
<pre><code class="hljs bash copyable" lang="bash">class DataBloc {
  ///定义一个Controller
  StreamController&lt;List&lt;String&gt;&gt; _dataController = StreamController&lt;List&lt;String&gt;&gt;();
  ///获取 StreamSink 做 add 入口
  StreamSink&lt;List&lt;String&gt;&gt; get _dataSink =&gt; _dataController.sink;
  ///获取 Stream 用于监听
  Stream&lt;List&lt;String&gt;&gt; get _dataStream =&gt; _dataController.stream;
  ///事件订阅对象
  StreamSubscription _dataSubscription;

  <span class="hljs-function"><span class="hljs-title">init</span></span>() {
    ///监听事件
    _dataSubscription = _dataStream.listen((value){
      ///<span class="hljs-keyword">do</span> change
    });
    ///改变事件
    _dataSink.add([<span class="hljs-string">"first"</span>, <span class="hljs-string">"second"</span>, <span class="hljs-string">"three"</span>, <span class="hljs-string">"more"</span>]);

  }

  <span class="hljs-function"><span class="hljs-title">close</span></span>() {
    ///关闭
    _dataSubscription.cancel();
    _dataController.close();
  }
}
<span class="copy-code-btn">复制代码</span></code></pre><p>在设置好监听后，之后每次有事件变化时， <code>listen</code> 内的方法就会被调用，同时你还可以通过操作符对 <code>Stream</code> 进行变换处理。</p>
<p>如下代码所示，是不是一股 <code>rx</code> 风扑面而来？</p>
<pre><code class="hljs bash copyable" lang="bash">_dataStream.where(<span class="hljs-built_in">test</span>).map(convert).transform(streamTransformer).listen(onData);
<span class="copy-code-btn">复制代码</span></code></pre><p>而在 Flutter 中， 最后结合 <code>StreamBuilder</code> , 就可以完成 <strong>基于事件流的异步状态控件</strong> 了！</p>
<pre><code class="hljs bash copyable" lang="bash">StreamBuilder&lt;List&lt;String&gt;&gt;(
    stream: dataStream,
    initialData: [<span class="hljs-string">"none"</span>],
    ///这里的 snapshot 是数据快照的意思
    builder: (BuildContext context, AsyncSnapshot&lt;List&lt;String&gt;&gt; snapshot) {
      ///获取到数据，为所欲为的更新 UI
      var data = snapshot.data;
      <span class="hljs-built_in">return</span> Container();
    });

<span class="copy-code-btn">复制代码</span></code></pre><p>那么问题来了，<strong>它们内部究竟是如果实现的呢？原理是什么？各自的作用是什么？都有哪些特性呢？后面我们将开始深入解析这个逻辑</strong> 。</p>
<h4 class="heading" data-id="heading-2">2、Stream 四天王</h4>
<p>从上面我们知道，在 Flutter 中使用 <code>Stream</code> 主要有四个对象，那么这四个对象是如何“勾搭”在一起的？他们各自又担任什么责职呢？</p>
<p>首先如下图，我们可以从进阶版的流程图上看出 整个 <code>Stream</code> 的内部工作流程。</p>
<p></p><figure><img class="lazyload inited loaded" data-src="https://user-gold-cdn.xitu.io/2019/4/26/16a58739c5790604?imageView2/0/w/1280/h/960/format/webp/ignore-error/1" data-width="1240" data-height="936" src="https://user-gold-cdn.xitu.io/2019/4/26/16a58739c5790604?imageView2/0/w/1280/h/960/format/webp/ignore-error/1"><figcaption></figcaption></figure><p></p>
<p>Flutter中 <code>Stream</code> 、<code>StreamController</code> 、<code>StreamSink</code> 和 <code>StreamSubscription</code> 都是 <code>abstract</code> 对象，他们对外抽象出接口，而内部实现对象大部分都是 <code>_</code> 开头的如 <code>_SyncStreamController</code> 、<code>ControllerStream</code> 等私有类，在这基础上整个流程概括起来就是：</p>
<p><strong>有一个事件源叫 <code>Stream</code>，为了方便控制 <code>Stream</code> ，官方提供了使用 <code>StreamController</code> 作为管理；同时它对外提供了 <code>StreamSink</code> 对象作为事件输入口，可通过 <code>sink</code> 属性访问; 又提供 <code>stream</code> 属性提供 <code>Stream</code> 对象的监听和变换，最后得到的 <code>StreamSubscription</code> 可以管理事件的订阅。</strong></p>
<p>所以我们可以总结出：</p>
<ul>
<li>StreamController ：如类名描述，用于整个 <code>Stream</code> 过程的控制，提供各类接口用于创建各种事件流。</li>
<li>StreamSink：一般作为事件的入口，提供如 <code>add</code> ， <code>addStream</code> 等。</li>
<li>Stream：事件源本身，一般可用于监听事件或者对事件进行转换，如 <code>listen</code> 、 <code>where</code> 。</li>
<li>StreamSubscription：事件订阅后的对象，表面上用于管理订阅过等各类操作，如 <code>cacenl</code> 、<code>pause</code> ，同时在内部也是事件的中转关键。</li>
</ul>
<p>回到 <code>Stream</code> 的工作流程上，在上图中我们知道， 通过 <code>StreamSink.add</code> 添加一个事件时， 事件最后会回调到 <code>listen</code> 中的 <code>onData</code> 方法，这个过程是通过 <code>zone.runUnaryGuarded</code> 执行的，这里 <code>zone.runUnaryGuarded</code> 是什么作用后面再说，我们需要知道这个  <code>onData</code> 是怎么来的？</p>
<p></p><figure><img alt="image.png" class="lazyload inited loaded" data-src="https://user-gold-cdn.xitu.io/2019/4/26/16a58739dcdbeb15?imageView2/0/w/1280/h/960/format/webp/ignore-error/1" data-width="1240" data-height="709" src="https://user-gold-cdn.xitu.io/2019/4/26/16a58739dcdbeb15?imageView2/0/w/1280/h/960/format/webp/ignore-error/1"><figcaption></figcaption></figure><p></p>
<p>如上图，通过源码我们知道：</p>
<ul>
<li>
<p>1、<code>Stream</code> 在 <code>listen</code> 的时候传入了 <code>onData</code> 回调，这个回调会传入到 <code>StreamSubscription</code> 中，之后通过 <code>zone.registerUnaryCallback</code> 注册得到 <code>_onData</code> 对象( <em>不是前面的 <code>onData</code> 回调哦</em> )。</p>
</li>
<li>
<p>2、<code>StreamSink</code> 在添加事件是，会执行到  <code>StreamSubscription</code> 中的 <code>_sendData</code> 方法，然后通过 <code>_zone.runUnaryGuarded(_onData, data);</code> 执行 1 中得到的 <code>_onData</code> 对象，触发 <code>listen</code> 时传入的回调方法。</p>
</li>
</ul>
<p>可以看出整个流程都是和 <code>StreamSubscription</code> 相关的，现在我们已经知道从 <strong>事件入口到事件出口</strong> 的整个流程时怎么运作的，那么这个过程是**怎么异步执行的呢？其中频繁出现的 <code>zone</code> 是什么？</p>
<h4 class="heading" data-id="heading-3">3、线程</h4>
<p>首先我们需要知道，Stream 是怎么实现异步的？</p>
<p>这就需要说到 Dart 中的异步实现逻辑了，因为 Dart 是 <strong>单线程应用</strong> ，和大多数单线程应用一样，Dart 是以 <strong>消息循环机制</strong> 来运行的，而这里面主要包含两个任务队列，一个是 <strong>microtask</strong> 内部队列，一个是 <strong>event</strong> 外部队列，而 <em>microtask</em> 的优先级又高于 <em>event</em> 。</p>
<p>默认的在 Dart 中，如 <em>点击、滑动、IO、绘制事件</em> 等事件都属于 <strong>event</strong> 外部队列，<strong>microtask</strong> 内部队列主要是由 Dart 内部产生，而 <code>Stream</code> 中的执行异步的模式就是 <code>scheduleMicrotask</code> 了。</p>
<blockquote>
<p>因为 <em>microtask</em> 的优先级又高于 <em>event</em> ，所以如果 <em>microtask</em> 太多就可能会对触摸、绘制等外部事件造成阻塞卡顿哦。</p>
</blockquote>
<p><strong>如下图，就是 Stream 内部在执行异步操作过程执行流程：</strong></p>
<p></p><figure><img class="lazyload inited loaded" data-src="https://user-gold-cdn.xitu.io/2019/4/26/16a58739dce57e4d?imageView2/0/w/1280/h/960/format/webp/ignore-error/1" data-width="774" data-height="281" src="https://user-gold-cdn.xitu.io/2019/4/26/16a58739dce57e4d?imageView2/0/w/1280/h/960/format/webp/ignore-error/1"><figcaption></figcaption></figure><p></p>
<h4 class="heading" data-id="heading-4">4、Zone</h4>
<p>那么 <code>Zone</code> 又是什么？它是哪里来的？</p>
<p>在上一篇章中说过，因为 Dart 中 <code>Future</code> 之类的异步操作是无法被当前代码 <code>try/cacth</code> 的，而在 Dart 中你可以给执行对象指定一个 <code>Zone</code>，类似提供一个<strong>沙箱环境</strong> ，而在这个沙箱内，你就可以全部可以捕获、拦截或修改一些代码行为，比如所有未被处理的异常。</p>
<p>那么项目中默认的 <code>Zone</code> 是怎么来的？在 Flutter 中，<strong>Dart 中的 <code>Zone</code> 启动是在 <code>_runMainZoned</code> 方法</strong> ，如下代码所示 <code>_runMainZoned</code> 的 <code>@pragma("vm:entry-point")</code> 注解表示该方式是给 Engine 调用的，到这里我们知道了 <code>Zone</code> 是怎么来的了。</p>
<pre><code class="hljs bash copyable" lang="bash">///Dart 中

@pragma(<span class="hljs-string">'vm:entry-point'</span>)
// ignore: unused_element
void _runMainZoned(Function startMainIsolateFunction, Function userMainFunction) {
  startMainIsolateFunction((){
    runZoned&lt;Future&lt;void&gt;&gt;(····);
  }, null);
}

///C++ 中
<span class="hljs-keyword">if</span> (tonic::LogIfError(tonic::DartInvokeField(
          Dart_LookupLibrary(tonic::ToDart(<span class="hljs-string">"dart:ui"</span>)), <span class="hljs-string">"_runMainZoned"</span>,
          {start_main_isolate_function, user_entrypoint_function}))) {
    FML_LOG(ERROR) &lt;&lt; <span class="hljs-string">"Could not invoke the main entrypoint."</span>;
    <span class="hljs-built_in">return</span> <span class="hljs-literal">false</span>;
}

<span class="copy-code-btn">复制代码</span></code></pre><p>那么 <code>zone.runUnaryGuarded</code> 的作用是什么？相较于 <code>scheduleMicrotask</code> 的异步操作，官方的解释是：<strong>在此区域中使用参数执行给定操作并捕获同步错误。</strong> 类似的还有 <code>runUnary</code> 、 <code>runBinaryGuarded</code> 等，所以我们知道前面提到的 <code>zone.runUnaryGuarded</code> 就是 <strong>Flutter 在运行的这个 zone 里执行已经注册的 <code>_onData</code>，并捕获异常</strong>。</p>
<h4 class="heading" data-id="heading-5">5、异步和同步</h4>
<p>前面我们说了 <code>Stream</code> 的内部执行流程，那么同步和异步操作时又有什么区别？具体实现时怎么样的呢？</p>
<p>我们以默认 <code>Stream</code> 流程为例子， <code>StreamController</code> 的工厂创建可以通过 <code>sync</code> 指定同步还是异步，默认是异步模式的。 而无论异步还是同步，他们都是继承了 <code>_StreamController</code> 对象，区别还是在于 <code>mixins</code> 的是哪个 <strong><code>_EventDispatch</code></strong> 实现：</p>
<ul>
<li>
<p><code>_AsyncStreamControllerDispatch</code></p>
</li>
<li>
<p><code>_SyncStreamControllerDispatch</code></p>
</li>
</ul>
<p>上面这两个 <code>_EventDispatch</code> 最大的不同就是在调用 <code>sendData</code> 提交事件时，是直接调用 <code>StreamSubscription</code> 的 <code>_add</code> 方法，还是调用 <code>_addPending(new _DelayedData&lt;T&gt;(data));</code> 方法的区别。</p>
<p>如下图， <strong>异步执行的逻辑就是上面说过的 <code>scheduleMicrotask</code>， 在 <code>_StreamImplEvents</code> 中 <code>scheduleMicrotask</code> 执行后，会调用 <code>_DelayedData</code> 的 <code>perform</code> ，最后通过 <code>_sendData</code> 触发 <code>StreamSubscription</code> 去回调数据 。</strong></p>
<p></p><figure><img class="lazyload inited loaded" data-src="https://user-gold-cdn.xitu.io/2019/4/26/16a58739ca04ae63?imageView2/0/w/1280/h/960/format/webp/ignore-error/1" data-width="1080" data-height="349" src="https://user-gold-cdn.xitu.io/2019/4/26/16a58739ca04ae63?imageView2/0/w/1280/h/960/format/webp/ignore-error/1"><figcaption></figcaption></figure><p></p>
<h4 class="heading" data-id="heading-6">6、广播和非广播。</h4>
<p>在 <code>Stream</code> 中又非为广播和非广播模式，如果是广播模式中，<code>StreamControlle</code> 的实现是由如下所示实现的，他们的基础关系如下图所示：</p>
<ul>
<li>
<p><code>_SyncBroadcastStreamController</code></p>
</li>
<li>
<p><code>_AsyncBroadcastStreamController</code></p>
</li>
</ul>
<p></p><figure><img alt="i" class="lazyload inited loaded" data-src="https://user-gold-cdn.xitu.io/2019/4/26/16a58739d049b070?imageView2/0/w/1280/h/960/format/webp/ignore-error/1" data-width="1240" data-height="406" src="https://user-gold-cdn.xitu.io/2019/4/26/16a58739d049b070?imageView2/0/w/1280/h/960/format/webp/ignore-error/1"><figcaption></figcaption></figure><p></p>
<p>广播和非广播的区别在于调用 <code>_createSubscription</code> 时，内部对接口类 <code>_StreamControllerLifecycle</code> 的实现，同时它们的差异在于：</p>
<ul>
<li>
<p>在 <code>_StreamController</code> 里判断了如果 <code>Stream</code> 是 <code>_isInitialState</code> 的，也就是订阅过的，就直接报错 <em>"Stream has already been listened to."</em> ，只有未订阅的才创建 <code>StreamSubscription</code> 。</p>
</li>
<li>
<p>在 <code>_BroadcastStreamController</code> 中，<code>_isInitialState</code>  的判断被去掉了，取而代之的是 <code>isClosed</code> 判断，并且在广播中, <code>_sendData</code> 是一个 <code>forEach</code> 执行：</p>
</li>
</ul>
<pre><code class="hljs bash copyable" lang="bash">  _forEachListener((_BufferingStreamSubscription&lt;T&gt; subscription) {
      subscription._add(data);
    });
<span class="copy-code-btn">复制代码</span></code></pre><h4 class="heading" data-id="heading-7">7、Stream 变换</h4>
<p><code>Stream</code> 是支持变换处理的，针对 <code>Stream</code> 我们可以经过多次变化来得到我们需要的结果。那么这些变化是怎么实现的呢？</p>
<p>如下图所示，一般操作符变换的 <code>Stream</code> 实现类，都是继承了 <code>_ForwardingStream</code> , 在它的内部的<code>_ForwardingStreamSubscription</code> 里，会通过上一个 <code>Pre A Stream</code> 的 <code>listen</code> 添加 <code>_handleData</code> 回调，之后在回调里再次调用新的 <code>Current B Stream</code> 的 <code>_handleData</code> 。</p>
<p>所以事件变化的本质就是，<strong>变换都是对 <code>Stream</code> 的  <code>listen</code> 嵌套调用组成的。</strong></p>
<p></p><figure><img class="lazyload inited loaded" data-src="https://user-gold-cdn.xitu.io/2019/4/26/16a5873a302cb7f1?imageView2/0/w/1280/h/960/format/webp/ignore-error/1" data-width="1240" data-height="625" src="https://user-gold-cdn.xitu.io/2019/4/26/16a5873a302cb7f1?imageView2/0/w/1280/h/960/format/webp/ignore-error/1"><figcaption></figcaption></figure><p></p>
<p>同时 <code>Stream</code> 还有转换为 <code>Future</code> , 如 <code>firstWhere</code> 、 <code>elementAt</code> 、 <code>reduce</code> 等操作符方法，基本都是创建一个内部 <code>_Future</code> 实例，然后再 <code>listen</code> 的回调用调用 <code>Future</code> 方法返回。</p>
<h2 class="heading" data-id="heading-8">二、StreamBuilder</h2>
<p>如下代码所示, 在 Flutter 中通过 <code>StreamBuilder</code> 构建 Widget ，只需提供一个 <code>Stream</code> 实例即可，其中 <code>AsyncSnapshot</code> 对象为数据快照，通过 <code>data</code> 缓存了当前数据和状态，那 <code>StreamBuilder</code> 是如何与 <code>Stream</code> 关联起来的呢？</p>
<pre><code class="hljs bash copyable" lang="bash">StreamBuilder&lt;List&lt;String&gt;&gt;(
    stream: dataStream,
    initialData: [<span class="hljs-string">"none"</span>],
    ///这里的 snapshot 是数据快照的意思
    builder: (BuildContext context, AsyncSnapshot&lt;List&lt;String&gt;&gt; snapshot) {
      ///获取到数据，为所欲为的更新 UI
      var data = snapshot.data;
      <span class="hljs-built_in">return</span> Container();
    });

<span class="copy-code-btn">复制代码</span></code></pre><p></p><figure><img class="lazyload inited loaded" data-src="https://user-gold-cdn.xitu.io/2019/4/26/16a5873a428dbf09?imageView2/0/w/1280/h/960/format/webp/ignore-error/1" data-width="859" data-height="676" src="https://user-gold-cdn.xitu.io/2019/4/26/16a5873a428dbf09?imageView2/0/w/1280/h/960/format/webp/ignore-error/1"><figcaption></figcaption></figure><p></p>
<p>如上图所示， <code>StreamBuilder</code> 的调用逻辑主要在 <code>_StreamBuilderBaseState</code> 中，<code>_StreamBuilderBaseState</code> 在 <code>initState</code> 、<code>didUpdateWidget</code> 中会调用 <code>_subscribe</code> 方法，从而调用 <code>Stream</code> 的 <code>listen</code>，然后通过 <code>setState</code> 更新UI，就是这么简单有木有？</p>
<blockquote>
<p>我们常用的 <code>setState</code>  中其实是调用了 <code>markNeedsBuild</code> ，<code>markNeedsBuild</code> 内部标记 <code>element</code> 为 <code>diry</code> ，然后在下一帧 <code>WidgetsBinding.drawFrame</code> 才会被绘制，这可以看出 <code>setState</code> 并不是立即生效的哦。</p>
</blockquote>
<h2 class="heading" data-id="heading-9">三、rxdart</h2>
<p>其实无论从订阅或者变换都可以看出， Dart 中的 <code>Stream</code> 已经自带了类似 <code>rx</code> 的效果，但是为了让 <code>rx</code> 的用户们更方便的使用，ReactiveX 就封装了 <code>rxdart</code> 来满足用户的熟悉感，如下图所示为它们的对应关系：</p>
<p></p><figure><img class="lazyload inited loaded" data-src="https://user-gold-cdn.xitu.io/2019/4/26/16a5873a2e62ea07?imageView2/0/w/1280/h/960/format/webp/ignore-error/1" data-width="502" data-height="254" src="https://user-gold-cdn.xitu.io/2019/4/26/16a5873a2e62ea07?imageView2/0/w/1280/h/960/format/webp/ignore-error/1"><figcaption></figcaption></figure><p></p>
<p>在  <code>rxdart</code> 中， <code>Observable</code> 是一个 <code>Stream</code>，而 <code>Subject</code> 继承了 <code>Observable</code> 也是一个 <code>Stream</code>，并且 <code>Subject</code> 实现了 <code>StreamController</code> 的接口，所以它也具有 Controller 的作用。</p>
<p>如下代码所示是 <code>rxdart</code> 的简单使用，可以看出它屏蔽了外界需要对 <code>StreamSubscription</code> 和 <code>StreamSink</code> 等的认知，更符合 <code>rx</code> 历史用户的理解。</p>
<pre><code class="hljs bash copyable" lang="bash">final subject = PublishSubject&lt;String&gt;();

subject.stream.listen(observerA);
subject.add(<span class="hljs-string">"AAAA1"</span>);
subject.add(<span class="hljs-string">"AAAA2"</span>));

subject.stream.listen(observeB);
subject.add(<span class="hljs-string">"BBBB1"</span>);
subject.close();
<span class="copy-code-btn">复制代码</span></code></pre><p>这里我们简单分析下，以上方代码为例，</p>
<ul>
<li>
<p><code>PublishSubject</code> 内部实际创建是创建了一个广播 <code>StreamController&lt;T&gt;.broadcast</code> 。</p>
</li>
<li>
<p>当我们调用 <code>add</code> 或者 <code>addStream</code> 时，最终会调用到的还是我们创建的 <code>StreamController.add</code>。</p>
</li>
<li>
<p>当我们调用 <code>onListen</code> 时，也是将回调设置到 <code>StreamController</code> 中。</p>
</li>
<li>
<p><code>rxdart</code> 在做变换时，我们获取到的 <code>Observable</code> 就是 this，也就是 <code>PublishSubject</code> 自身这个 <code>Stream</code> ，而 <code>Observable</code> 一系列的变换，也是基于创建时传入的 <code>stream</code> 对象，比如：</p>
</li>
</ul>
<pre><code class="hljs bash copyable" lang="bash">  @override
  Observable&lt;S&gt; asyncMap&lt;S&gt;(FutureOr&lt;S&gt; convert(T value)) =&gt;
      Observable&lt;S&gt;(_stream.asyncMap(convert));
<span class="copy-code-btn">复制代码</span></code></pre><p>所以我们可以看出来，<code>rxdart</code>  只是对 <code>Stream</code> 进行了概念变换，变成了我们熟悉的对象和操作符，而这也是为什么 <code>rxdart</code> 可以在 <code>StreamBuilder</code> 中直接使用的原因。</p>
<p><strong>所以，到这里你对 Flutter 中 Stream 有全面的理解了没？</strong></p>
<blockquote>
<p>自此，第十一篇终于结束了！(///▽///)</p>
</blockquote>
<h3 class="heading" data-id="heading-10">资源推荐</h3>
<ul>
<li>Github ： <a target="_blank" href="https://link.juejin.im?target=https%3A%2F%2Fgithub.com%2FCarGuo" rel="nofollow noopener noreferrer">github.com/CarGuo</a></li>
<li>本文代码 ：<a target="_blank" href="https://link.juejin.im?target=https%3A%2F%2Fgithub.com%2FCarGuo%2FGSYGithubAppFlutter" rel="nofollow noopener noreferrer">github.com/CarGuo/GSYG…</a></li>
</ul>
<h5 class="heading" data-id="heading-11">完整开源项目推荐：</h5>
<ul>
<li><a target="_blank" href="https://link.juejin.im?target=https%3A%2F%2Fgithub.com%2FCarGuo%2FGSYGithubAppFlutter" rel="nofollow noopener noreferrer">GSYGithubApp Flutter</a></li>
<li><a target="_blank" href="https://link.juejin.im?target=https%3A%2F%2Fgithub.com%2FCarGuo%2FGSYGithubApp" rel="nofollow noopener noreferrer">GSYGithubApp React Native</a></li>
<li><a target="_blank" href="https://link.juejin.im?target=https%3A%2F%2Fgithub.com%2FCarGuo%2FGSYGithubAppWeex" rel="nofollow noopener noreferrer">GSYGithubAppWeex</a></li>
</ul>
<h5 class="heading" data-id="heading-12">文章</h5>
<p><a target="_blank" href="https://juejin.im/post/5b631d326fb9a04fce524db2" rel="">《Flutter完整开发实战详解(一、Dart语言和Flutter基础)》</a></p>
<p><a target="_blank" href="https://juejin.im/post/5b685a2a5188251ac22b71c0" rel="">《Flutter完整开发实战详解(二、 快速开发实战篇)》</a></p>
<p><a target="_blank" href="https://juejin.im/post/5b6fd4dc6fb9a0099e711162" rel="">《Flutter完整开发实战详解(三、 打包与填坑篇)》</a></p>
<p><a target="_blank" href="https://juejin.im/post/5b79767ff265da435450a873" rel="">《Flutter完整开发实战详解(四、Redux、主题、国际化)》</a></p>
<p><a target="_blank" href="https://juejin.im/post/5bc450dff265da0a951f032b" rel="">《Flutter完整开发实战详解(五、 深入探索)》</a></p>
<p><a target="_blank" href="https://juejin.im/post/5c7e853151882549664b0543" rel="">《Flutter完整开发实战详解(六、 深入Widget原理)》</a></p>
<p><a target="_blank" href="https://juejin.im/post/5c8c6ef7e51d450ba7233f51" rel="">《Flutter完整开发实战详解(七、 深入布局原理)》</a></p>
<p><a target="_blank" href="https://juejin.im/post/5c9e328251882567b91e1cfb" rel="">《Flutter完整开发实战详解(八、 实用技巧与填坑)》</a></p>
<p><a target="_blank" href="https://juejin.im/post/5ca0e0aff265da309728659a" rel="">《Flutter完整开发实战详解(九、 深入绘制原理)》</a></p>
<p><a target="_blank" href="https://juejin.im/post/5cb1896ce51d456e63760449" rel="">《Flutter完整开发实战详解(十、 深入图片加载流程)》</a></p>
<p><a target="_blank" href="https://juejin.im/post/5cc2acf86fb9a0321f042041" rel="">《Flutter完整开发实战详解(十一、全面深入理解Stream)》</a></p>
<p><a target="_blank" href="https://juejin.im/post/5b6064a0f265da0f8b2fc89d" rel="">《跨平台项目开源项目推荐》</a></p>
<p><a target="_blank" href="https://juejin.im/post/5b395eb96fb9a00e556123ef" rel="">《移动端跨平台开发的深度解析》</a></p>
<p><a target="_blank" href="https://juejin.im/post/5cb34404f265da0384127fcd" rel="">《React Native 的未来与React Hooks》</a></p>
</div>