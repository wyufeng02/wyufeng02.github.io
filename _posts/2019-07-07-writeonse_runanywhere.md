---
layout: post
title:  使用flutter + Kotlin 一次编写，任意运行
tag: [flutter, Location, Maps,UI]
date: 2019-07-08
---


<div data-v-4f8894a8="" data-id="5d20a2e06fb9a07efe2dde1c" itemprop="articleBody" class="article-content simpread-focus-highlight" style="z-index: 2147483646; overflow: visible; position: relative;"><blockquote>
<p>本文同步自个人博客<a target="_blank" href="https://link.juejin.im?target=https%3A%2F%2Flittlegnal.github.io%2F2019-07-06%2Fkmpp-flutter" rel="nofollow noopener noreferrer">Flutter + Kotlin Multiplatform, Write Once Run Anywhere</a>，转载请注明出处。</p>
</blockquote>
<h2 class="heading" data-id="heading-0">Motivation</h2>
<p><a target="_blank" href="https://link.juejin.im?target=https%3A%2F%2Fflutter.dev%2F" rel="nofollow noopener noreferrer">Flutter</a>是Google 2017年推出的跨平台框架，拥有<strong>Fast Development</strong>，<strong>Expressive and Flexible UI</strong>，<strong>Native Performance</strong>等特点。Flutter使用<a target="_blank" href="https://link.juejin.im?target=https%3A%2F%2Fdart.dev%2F" rel="nofollow noopener noreferrer">Dart</a>作为开发语言，Android和iOS项目可以共用一套Dart代码，很多人迫不及待的尝试，包括我，但在学习的过程中，同时在思考以下的问题：</p>
<ul>
<li>
<p>Flutter很优秀，但相对来说还比较新，目前并不是所有的第三方SDK支持Flutter（特别是在国内），所以在使用第三方SDK时很多时候需要我们编写原生代码集成逻辑，需要Android和iOS分别编写不同的集成代码。</p>
</li>
<li>
<p>项目要集成Flutter，一次性替换所有页面有点不太实际，但是部分页面集成的时候，会面临需要将数据库操作等公用逻辑使用Dart重写一遍的问题，因为原生的逻辑在其他的页面也需要用到，没办法做到只保留Dart的实现代码，所以很容易出现一套逻辑需要提供不同平台的实现如：<code>Dao.kt</code>， <code>Dao.swift</code>， <code>Dao.dart</code>。当然可以使用Flutter提供的<code>MethodChannel</code>/<code>FlutterMethodChannel</code>来直接调用原生代码的逻辑，但是如果数据库操作逻辑需要修改的时候，我们依然要同时修改不同平台的代码逻辑。</p>
</li>
<li>
<p>项目组里有內部的SDK，同时提供给不同项目（Android和iOS）使用，但是一些App需要集成Flutter，就需要SDK分别提供Flutter/Android/iOS的代码实现，这时需要同时维护三个SDK反而增加了SDK维护者的维护和实现成本。</p>
</li>
</ul>
<p>所以，最后可以把问题归结为原生代码无法复用，导致我们需要为不同平台提供同一代码逻辑实现。那么有没有能让原生代码复用的框架，答案是肯定的，<a target="_blank" href="https://link.juejin.im?target=https%3A%2F%2Fkotlinlang.org%2Fdocs%2Freference%2Fmultiplatform.html" rel="nofollow noopener noreferrer">Kotlin Multiplatform</a>是Kotlin的一个功能（目前还在实验性阶段），其目标就是使用Kotlin：<em>Sharing code between platforms</em>。</p>
<p>于是我有一个大胆的想法，同时使用Flutter和Kotlin Multiplatform，虽然使用不同的语言（Dart/Kotlin），但不同平台共用一套代码逻辑实现。使用Kotlin Multiplatform编写公用逻辑，然后在Android/iOS上使用<code>MethodChannel</code>/<code>FlutterMethodChannel</code>供Flutter调用公用逻辑。</p>
<p></p><figure><img alt="kmpp+flutter" class="lazyload inited loaded" data-src="https://user-gold-cdn.xitu.io/2019/7/8/16bcfc8a51c700e4?imageView2/0/w/1280/h/960/format/webp/ignore-error/1" data-width="1115" data-height="1280" src="https://user-gold-cdn.xitu.io/2019/7/8/16bcfc8a51c700e4?imageView2/0/w/1280/h/960/format/webp/ignore-error/1"><figcaption></figcaption></figure><p></p>
<p>接下来以实现公用的数据库操作逻辑为例，来简单描述如何使用Flutter和Kotlin Multiplatform达到<em>Write Once Run Anywhere</em>。</p>
<p><em>接下来的内容需要读者对Flutter和Kotlin Multiplatform有所了解。</em></p>
<h2 class="heading" data-id="heading-1">Kotlin Multiplatform</h2>
<p>我们使用<a target="_blank" href="https://link.juejin.im?target=https%3A%2F%2Fgithub.com%2Fsquare%2Fsqldelight" rel="nofollow noopener noreferrer">Sqldelight</a>实现公用的数据库操作逻辑，然后通过<a target="_blank" href="https://link.juejin.im?target=https%3A%2F%2Fgithub.com%2FKotlin%2Fkotlinx.serialization" rel="nofollow noopener noreferrer">kotlinx.serialization</a>把查询结果序列化为json字符串，通过<code>MethodChannel</code>/<code>FlutterMethodChannel</code>传递到Flutter中使用。</p>
<p>Flutter的目录结构如下面所示：</p>
<pre><code class="hljs bash copyable" lang="bash">|
|__android
|  |__app
|__ios
|__lib
|__test
<span class="copy-code-btn">复制代码</span></code></pre><p>其中<code>android</code>目录下是一个完整的Gradle项目，参照官方文档<a target="_blank" href="https://link.juejin.im?target=https%3A%2F%2Fkotlinlang.org%2Fdocs%2Ftutorials%2Fnative%2Fmpp-ios-android.html" rel="nofollow noopener noreferrer">Multiplatform Project: iOS and Android</a>，我们在<code>android</code>目录下创建一个<code>common</code> module，来存放公用的代码逻辑。</p>
<h3 class="heading" data-id="heading-2">Gradle脚本</h3>
<pre><code class="hljs gradle copyable" lang="gradle">apply plugin: <span class="hljs-string">'org.jetbrains.kotlin.multiplatform'</span>
apply plugin: <span class="hljs-string">'com.squareup.sqldelight'</span>
apply plugin: <span class="hljs-string">'kotlinx-serialization'</span>

sqldelight {
    AccountingDB {
        packageName = <span class="hljs-string">"com.littlegnal.accountingmultiplatform"</span>
    }
}

kotlin {
    <span class="hljs-keyword">sourceSets</span> {
        commonMain.<span class="hljs-keyword">dependencies</span> {
            implementation deps.kotlin.stdlib.stdlib
            implementation deps.kotlin.serialiaztion.<span class="hljs-keyword">runtime</span>.common
            implementation deps.kotlin.coroutines.common
        }

        androidMain.<span class="hljs-keyword">dependencies</span> {
            implementation deps.kotlin.stdlib.stdlib
            implementation deps.sqldelight.runtimejvm
            implementation deps.kotlin.serialiaztion.<span class="hljs-keyword">runtime</span>.<span class="hljs-keyword">runtime</span>
            implementation deps.kotlin.coroutines.android
        }

        iosMain.<span class="hljs-keyword">dependencies</span> {
            implementation deps.kotlin.stdlib.stdlib
            implementation deps.sqldelight.driver.ios
            implementation deps.kotlin.serialiaztion.<span class="hljs-keyword">runtime</span>.<span class="hljs-keyword">native</span>
            implementation deps.kotlin.coroutines.<span class="hljs-keyword">native</span>
        }
    }

    targets {
        fromPreset(presets.jvm, <span class="hljs-string">'android'</span>)
        <span class="hljs-keyword">final</span> <span class="hljs-keyword">def</span> iOSTarget = System.getenv(<span class="hljs-string">'SDK_NAME'</span>)?.startsWith(<span class="hljs-string">"iphoneos"</span>) \
                              ? presets.iosArm64 : presets.iosX64

        fromPreset(iOSTarget, <span class="hljs-string">'ios'</span>) {
            binaries {
                framework(<span class="hljs-string">'common'</span>)
            }
        }
    }
}

<span class="hljs-comment">// workaround for https://youtrack.jetbrains.com/issue/KT-27170</span>
<span class="hljs-keyword">configurations</span> {
    compileClasspath
}

<span class="hljs-keyword">task</span> packForXCode(type: Sync) {
    <span class="hljs-keyword">final</span> <span class="hljs-keyword">File</span> frameworkDir = <span class="hljs-keyword">new</span> <span class="hljs-keyword">File</span>(buildDir, <span class="hljs-string">"xcode-frameworks"</span>)
    <span class="hljs-keyword">final</span> String mode = <span class="hljs-keyword">project</span>.findProperty(<span class="hljs-string">"XCODE_CONFIGURATION"</span>)?.toUpperCase() ?: <span class="hljs-string">'DEBUG'</span>
    <span class="hljs-keyword">final</span> <span class="hljs-keyword">def</span> framework = kotlin.targets.ios.binaries.getFramework(<span class="hljs-string">"common"</span>, mode)

    inputs.property <span class="hljs-string">"mode"</span>, mode
    dependsOn framework.linkTask

    <span class="hljs-keyword">from</span> { framework.outputFile.parentFile }
    <span class="hljs-keyword">into</span> frameworkDir

    <span class="hljs-keyword">doLast</span> {
        <span class="hljs-keyword">new</span> <span class="hljs-keyword">File</span>(frameworkDir, <span class="hljs-string">'gradlew'</span>).with {
            text = <span class="hljs-string">"#!/bin/bash\nexport 'JAVA_HOME=${System.getProperty("</span>java.home<span class="hljs-string">")}'\ncd '${rootProject.rootDir}'\n./gradlew \$@\n"</span>
            setExecutable(<span class="hljs-keyword">true</span>)
        }
    }
}
tasks.build.dependsOn packForXCode
<span class="copy-code-btn">复制代码</span></code></pre><h3 class="heading" data-id="heading-3">实现<code>AccountingRepository</code></h3>
<p>在<code>common</code> module下创建<code>commonMain</code>目录，并在<code>commonMain</code>目录下创建<code>AccountingRepository</code>类用于封装数据库操作逻辑（这里不需要关心代码实现细节，只是简单的查询数据库结果，然后序列化为json字符串）。</p>
<pre><code class="hljs kotlin copyable" lang="kotlin"><span class="hljs-class"><span class="hljs-keyword">class</span> <span class="hljs-title">AccountingRepository</span></span>(<span class="hljs-keyword">private</span> <span class="hljs-keyword">val</span> accountingDB: AccountingDB) {

  <span class="hljs-keyword">private</span> <span class="hljs-keyword">val</span> json: Json <span class="hljs-keyword">by</span> lazy {
    Json(JsonConfiguration.Stable)
  }

  ...

  <span class="hljs-function"><span class="hljs-keyword">fun</span> <span class="hljs-title">getMonthTotalAmount</span><span class="hljs-params">(yearAndMonthList: <span class="hljs-type">List</span>&lt;<span class="hljs-type">String</span>&gt;)</span></span>: String {
    <span class="hljs-keyword">val</span> list = mutableListOf&lt;GetMonthTotalAmount&gt;()
        .apply {
          <span class="hljs-keyword">for</span> (yearAndMonth <span class="hljs-keyword">in</span> yearAndMonthList) {
            <span class="hljs-keyword">val</span> r = accountingDB.accountingDBQueries
                .getMonthTotalAmount(yearAndMonth)
                .executeAsOneOrNull()

            <span class="hljs-keyword">if</span> (r?.total != <span class="hljs-literal">null</span> &amp;&amp; r.yearMonth != <span class="hljs-literal">null</span>) {
              add(r)
            }
          }
        }
        .map {
          it.toGetMonthTotalAmountSerialization()
        }

    <span class="hljs-keyword">return</span> json.stringify(GetMonthTotalAmountSerialization.serializer().list, list)
  }
  
  <span class="hljs-function"><span class="hljs-keyword">fun</span> <span class="hljs-title">getGroupingMonthTotalAmount</span><span class="hljs-params">(yearAndMonth: <span class="hljs-type">String</span>)</span></span>: String {
    <span class="hljs-keyword">val</span> list = accountingDB.accountingDBQueries
        .getGroupingMonthTotalAmount(yearAndMonth)
        .executeAsList()
        .map {
          it.toGetGroupingMonthTotalAmountSerialization()
        }
    <span class="hljs-keyword">return</span> json.stringify(GetGroupingMonthTotalAmountSerialization.serializer().list, list)
  }
}
<span class="copy-code-btn">复制代码</span></code></pre><p>到这里我们已经实现了公用的数据库操作逻辑，但是为了Android/iOS更加简单的调用数据库操作逻辑，我们把<code>MethodChannel#setMethodCallHandler</code>/<code>FlutterMethodChannel#setMethodCallHandler</code>中的调用逻辑进行简单的封装：</p>
<pre><code class="hljs kotlin copyable" lang="kotlin">const <span class="hljs-keyword">val</span> SQLDELIGHT_CHANNEL = <span class="hljs-string">"com.littlegnal.accountingmultiplatform/sqldelight"</span>

<span class="hljs-class"><span class="hljs-keyword">class</span> <span class="hljs-title">SqlDelightManager</span></span>(
  <span class="hljs-keyword">private</span> <span class="hljs-keyword">val</span> accountingRepository: AccountingRepository
) : CoroutineScope {

  ...

  <span class="hljs-function"><span class="hljs-keyword">fun</span> <span class="hljs-title">methodCall</span><span class="hljs-params">(method: <span class="hljs-type">String</span>, arguments: <span class="hljs-type">Map</span>&lt;<span class="hljs-type">String</span>, Any&gt;, result: (<span class="hljs-type">Any</span>)</span></span> -&gt; <span class="hljs-built_in">Unit</span>) {
    launch(coroutineContext) {
      <span class="hljs-keyword">when</span> (method) {
        ...

        <span class="hljs-string">"getMonthTotalAmount"</span> -&gt; {
          <span class="hljs-meta">@Suppress(<span class="hljs-meta-string">"UNCHECKED_CAST"</span>)</span> <span class="hljs-keyword">val</span> yearAndMonthList: List&lt;String&gt; =
            arguments[<span class="hljs-string">"yearAndMonthList"</span>] <span class="hljs-keyword">as</span>? List&lt;String&gt; ?: emptyList()
          <span class="hljs-keyword">val</span> r = accountingRepository.getMonthTotalAmount(yearAndMonthList)
          result(r)
        }
        <span class="hljs-string">"getGroupingMonthTotalAmount"</span> -&gt; {
          <span class="hljs-keyword">val</span> yearAndMonth: String = arguments[<span class="hljs-string">"yearAndMonth"</span>] <span class="hljs-keyword">as</span>? String ?: <span class="hljs-string">""</span>
          <span class="hljs-keyword">val</span> r = accountingRepository.getGroupingMonthTotalAmount(yearAndMonth)
          result(r)
        }
      }
    }
  }
}
<span class="copy-code-btn">复制代码</span></code></pre><p>因为<code>MethodChannel#setMethodHandler</code>中<code>Result</code>和<code>FlutterMethodChannel#setMethodHandler</code>中<code>FlutterResult</code>对象不一样，所以我们在<code>SqlDelightManager#methodCall</code>定义<code>result</code> function以回调的形式让外部处理。</p>
<h3 class="heading" data-id="heading-4">在Android使用<code>SqlDelightManager</code></h3>
<p>在Android项目使用<code>SqlDelightManager</code>，参考官方文档<a target="_blank" href="https://link.juejin.im?target=https%3A%2F%2Fkotlinlang.org%2Fdocs%2Ftutorials%2Fnative%2Fmpp-ios-android.html" rel="nofollow noopener noreferrer">Multiplatform Project: iOS and Android</a>，我们需要先在<code>app</code>目录下添加对<code>common</code> module的依赖：</p>
<pre><code class="hljs gradle copyable" lang="gradle">implementation <span class="hljs-keyword">project</span>(<span class="hljs-string">":common"</span>)
<span class="copy-code-btn">复制代码</span></code></pre><p>参照官方文档<a target="_blank" href="https://link.juejin.im?target=https%3A%2F%2Fflutter.dev%2Fdocs%2Fdevelopment%2Fplatform-integration%2Fplatform-channels" rel="nofollow noopener noreferrer">Writing custom platform-specific code</a>，我们在<code>MainActivity</code>实现<code>MethodChannel</code>并调用<code>SqlDelightManager#methodCall</code>:</p>
<pre><code class="hljs kotlin copyable" lang="kotlin"><span class="hljs-class"><span class="hljs-keyword">class</span> <span class="hljs-title">MainActivity</span>: <span class="hljs-type">FlutterActivity</span></span>() {

  <span class="hljs-keyword">private</span> <span class="hljs-keyword">val</span> sqlDelightManager <span class="hljs-keyword">by</span> lazy {
    <span class="hljs-keyword">val</span> accountingRepository = AccountingRepository(Db.getInstance(applicationContext))
    SqlDelightManager(accountingRepository)
  }

  <span class="hljs-keyword">override</span> <span class="hljs-function"><span class="hljs-keyword">fun</span> <span class="hljs-title">onCreate</span><span class="hljs-params">(savedInstanceState: <span class="hljs-type">Bundle</span>?)</span></span> {
    <span class="hljs-keyword">super</span>.onCreate(savedInstanceState)
    GeneratedPluginRegistrant.registerWith(<span class="hljs-keyword">this</span>)

    MethodChannel(flutterView, SQLDELIGHT_CHANNEL).setMethodCallHandler { methodCall, result -&gt;
      <span class="hljs-meta">@Suppress(<span class="hljs-meta-string">"UNCHECKED_CAST"</span>)</span>
      <span class="hljs-keyword">val</span> args = methodCall.arguments <span class="hljs-keyword">as</span>? Map&lt;String, Any&gt; ?: emptyMap()
      sqlDelightManager.methodCall(methodCall.method, args) {
        result.success(it)
      }
    }
  }

  ...
}
<span class="copy-code-btn">复制代码</span></code></pre><h3 class="heading" data-id="heading-5">在iOS使用<code>SqlDelightManager</code></h3>
<p>继续参考<a target="_blank" href="https://link.juejin.im?target=https%3A%2F%2Fkotlinlang.org%2Fdocs%2Ftutorials%2Fnative%2Fmpp-ios-android.html" rel="nofollow noopener noreferrer">Multiplatform Project: iOS and Android</a>，让Xcode项目识别<code>common</code> module的代码，主要把<code>common</code> module生成的frameworks添加Xcode项目中，我简单总结为以下步骤：</p>
<ul>
<li>运行<code>./gradlew :common:build</code>，生成<em>iOS frameworks</em></li>
<li><em>General</em> -&gt; 添加<em>Embedded Binaries</em></li>
<li><em>Build Setting</em> -&gt; 添加<em>Framework Search Paths</em></li>
<li><em>Build Phases</em> -&gt; 添加<em>Run Script</em></li>
</ul>
<p>有一点跟官方文档不同的是，frameworks的存放目录不一样，因为Flutter项目结构把<code>android</code>项目的<code>build</code>文件路径放到根目录，所以frameworks的路径应该是<code>$(SRCROOT)/../build/xcode-frameworks</code>。可以查看<code>android/build.gradle</code>:</p>
<pre><code class="hljs gradle copyable" lang="gradle">rootProject.buildDir = <span class="hljs-string">'../build'</span>
<span class="hljs-keyword">subprojects</span> {
    <span class="hljs-keyword">project</span>.buildDir = <span class="hljs-string">"${rootProject.buildDir}/${project.name}"</span>
}
<span class="copy-code-btn">复制代码</span></code></pre><p>这几步完成之后就可以在Swift里面调用<code>common</code> module的Kotlin代码了。参照官方文档<a target="_blank" href="https://link.juejin.im?target=https%3A%2F%2Fflutter.dev%2Fdocs%2Fdevelopment%2Fplatform-integration%2Fplatform-channels" rel="nofollow noopener noreferrer">Writing custom platform-specific code</a>，我们在<code>AppDelegate.swift</code>实现<code>FlutterMethodChannel</code>并调用<code>SqlDelightManager#methodCall</code>（Swift代码全是靠Google搜出来的XD）：</p>
<pre><code class="hljs swift copyable" lang="swift"><span class="hljs-meta">@UIApplicationMain</span>
<span class="hljs-meta">@objc</span> <span class="hljs-class"><span class="hljs-keyword">class</span> <span class="hljs-title">AppDelegate</span>: <span class="hljs-title">FlutterAppDelegate</span> </span>{
    <span class="hljs-built_in">lazy</span> <span class="hljs-keyword">var</span> sqlDelightManager: <span class="hljs-type">SqlDelightManager</span> = {
        <span class="hljs-type">Db</span>().defaultDriver()
        <span class="hljs-keyword">let</span> accountingRepository = <span class="hljs-type">AccountingRepository</span>(accountingDB: <span class="hljs-type">Db</span>().instance)
        <span class="hljs-keyword">return</span> <span class="hljs-type">SqlDelightManager</span>(accountingRepository: accountingRepository)
    }()
    
    <span class="hljs-keyword">override</span> <span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-title">application</span><span class="hljs-params">(
        <span class="hljs-number">_</span> application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplicationLaunchOptionsKey: Any]?
    )</span></span> -&gt; <span class="hljs-type">Bool</span> {
    <span class="hljs-keyword">let</span> controller: <span class="hljs-type">FlutterViewController</span> = window?.rootViewController <span class="hljs-keyword">as</span>! <span class="hljs-type">FlutterViewController</span>

    <span class="hljs-keyword">let</span> sqlDelightChannel = <span class="hljs-type">FlutterMethodChannel</span>(
        name: <span class="hljs-type">SqlDelightManagerKt</span>.<span class="hljs-type">SQLDELIGHT_CHANNEL</span>,
        binaryMessenger: controller)

    sqlDelightChannel.setMethodCallHandler({
        [<span class="hljs-keyword">weak</span> <span class="hljs-keyword">self</span>] (methodCall: <span class="hljs-type">FlutterMethodCall</span>, flutterResult: @escaping <span class="hljs-type">FlutterResult</span>) -&gt; <span class="hljs-type">Void</span> <span class="hljs-keyword">in</span>
        <span class="hljs-keyword">let</span> args = methodCall.arguments <span class="hljs-keyword">as</span>? [<span class="hljs-type">String</span>: <span class="hljs-type">Any</span>] ?? [:]
        
        <span class="hljs-keyword">self</span>?.sqlDelightManager.methodCall(
            method: methodCall.method,
            arguments: args,
            result: {(r: <span class="hljs-type">Any</span>) -&gt; <span class="hljs-type">KotlinUnit</span> <span class="hljs-keyword">in</span>
                flutterResult(r)
                <span class="hljs-keyword">return</span> <span class="hljs-type">KotlinUnit</span>()
            })
    })

    <span class="hljs-type">GeneratedPluginRegistrant</span>.register(with: <span class="hljs-keyword">self</span>)
        <span class="hljs-keyword">return</span> <span class="hljs-keyword">super</span>.application(application, didFinishLaunchingWithOptions: launchOptions)
    }
    
    ...
}
<span class="copy-code-btn">复制代码</span></code></pre><p>可以看到，除了<code>MethodChannel</code>/<code>FlutterMethodChannel</code>对象不同以及Kotlin/Swift语法不同，我们调用的是同一方法<code>SqlDelightManager#methodCall</code>，并不需要分别在Android/iOS上实现同一套逻辑。</p>
<p>到这里我们已经使用了Kotlin Multiplatform实现原生代码复用了，然后我们只需在Flutter使用<code>MethodChannel</code>调用相应的方法就可以了。</p>
<h2 class="heading" data-id="heading-6">Flutter</h2>
<p>同样的我们在Flutter中也实现<code>AccountingRepository</code>类封装数据库操作逻辑：</p>
<pre><code class="hljs dart copyable" lang="dart"><span class="hljs-class"><span class="hljs-keyword">class</span> <span class="hljs-title">AccountingRepository</span> </span>{
  <span class="hljs-keyword">static</span> <span class="hljs-keyword">const</span> _platform =
      <span class="hljs-keyword">const</span> MethodChannel(<span class="hljs-string">"com.littlegnal.accountingmultiplatform/sqldelight"</span>);

  ...

  Future&lt;BuiltList&lt;TotalExpensesOfMonth&gt;&gt; getMonthTotalAmount(
      [<span class="hljs-built_in">DateTime</span> latestMonth]) <span class="hljs-keyword">async</span> {
    <span class="hljs-keyword">var</span> dateTime = latestMonth ?? <span class="hljs-built_in">DateTime</span>.now();
    <span class="hljs-keyword">var</span> yearMonthList = <span class="hljs-built_in">List</span>&lt;<span class="hljs-built_in">String</span>&gt;();
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">var</span> i = <span class="hljs-number">0</span>; i &lt;= <span class="hljs-number">6</span>; i++) {
      <span class="hljs-keyword">var</span> d = <span class="hljs-built_in">DateTime</span>(dateTime.year, dateTime.month - i, <span class="hljs-number">1</span>);
      yearMonthList.add(_yearMonthFormat.format(d));
    }

    <span class="hljs-keyword">var</span> arguments = {<span class="hljs-string">"yearAndMonthList"</span>: yearMonthList};
    <span class="hljs-keyword">var</span> result = <span class="hljs-keyword">await</span> _platform.invokeMethod(<span class="hljs-string">"getMonthTotalAmount"</span>, arguments);

    <span class="hljs-keyword">return</span> deserializeListOf&lt;TotalExpensesOfMonth&gt;(jsonDecode(result));
  }

  Future&lt;BuiltList&lt;TotalExpensesOfGroupingTag&gt;&gt; getGroupingTagOfLatestMonth(
      <span class="hljs-built_in">DateTime</span> latestMonth) <span class="hljs-keyword">async</span> {
    <span class="hljs-keyword">return</span> getGroupingMonthTotalAmount(latestMonth);
  }

  Future&lt;BuiltList&lt;TotalExpensesOfGroupingTag&gt;&gt; getGroupingMonthTotalAmount(
      <span class="hljs-built_in">DateTime</span> dateTime) <span class="hljs-keyword">async</span> {
    <span class="hljs-keyword">var</span> arguments = {<span class="hljs-string">"yearAndMonth"</span>: _yearMonthFormat.format(dateTime)};
    <span class="hljs-keyword">var</span> result =
        <span class="hljs-keyword">await</span> _platform.invokeMethod(<span class="hljs-string">"getGroupingMonthTotalAmount"</span>, arguments);

    <span class="hljs-keyword">return</span> deserializeListOf&lt;TotalExpensesOfGroupingTag&gt;(jsonDecode(result));
  }
}
<span class="copy-code-btn">复制代码</span></code></pre><p>简单使用<a target="_blank" href="https://link.juejin.im?target=https%3A%2F%2Fflutter.dev%2Fdocs%2Fdevelopment%2Fdata-and-backend%2Fstate-mgmt%2Foptions%23bloc--rx" rel="nofollow noopener noreferrer">BLoC</a>来调用<code>AccountingRepository</code>的方法：</p>
<pre><code class="hljs dart copyable" lang="dart"><span class="hljs-class"><span class="hljs-keyword">class</span> <span class="hljs-title">SummaryBloc</span> </span>{
  SummaryBloc(<span class="hljs-keyword">this</span>._db);

  <span class="hljs-keyword">final</span> AccountingRepository _db;

  <span class="hljs-keyword">final</span> _summaryChartDataSubject =
      BehaviorSubject&lt;SummaryChartData&gt;.seeded(...);
  <span class="hljs-keyword">final</span> _summaryListSubject =
      BehaviorSubject&lt;BuiltList&lt;SummaryListItem&gt;&gt;.seeded(BuiltList());

  Stream&lt;SummaryChartData&gt; <span class="hljs-keyword">get</span> summaryChartData =&gt;
      _summaryChartDataSubject.stream;

  Stream&lt;BuiltList&lt;SummaryListItem&gt;&gt; <span class="hljs-keyword">get</span> summaryList =&gt;
      _summaryListSubject.stream;

  ...

  Future&lt;<span class="hljs-built_in">Null</span>&gt; getGroupingTagOfLatestMonth({<span class="hljs-built_in">DateTime</span> dateTime}) <span class="hljs-keyword">async</span> {
    <span class="hljs-keyword">var</span> list =
        <span class="hljs-keyword">await</span> _db.getGroupingTagOfLatestMonth(dateTime ?? <span class="hljs-built_in">DateTime</span>.now());
    _summaryListSubject.sink.add(_createSummaryList(list));
  }

  Future&lt;<span class="hljs-built_in">Null</span>&gt; getMonthTotalAmount({<span class="hljs-built_in">DateTime</span> dateTime}) <span class="hljs-keyword">async</span> {
    ...
    <span class="hljs-keyword">var</span> result = <span class="hljs-keyword">await</span> _db.getMonthTotalAmount(dateTime);

    ...

    _summaryChartDataSubject.sink.add(...);
  }

  ...

<span class="copy-code-btn">复制代码</span></code></pre><p>在Widget中使用BLoC：</p>
<pre><code class="hljs dart copyable" lang="dart"><span class="hljs-class"><span class="hljs-keyword">class</span> <span class="hljs-title">SummaryPage</span> <span class="hljs-keyword">extends</span> <span class="hljs-title">StatefulWidget</span> </span>{
  <span class="hljs-meta">@override</span>
  State&lt;StatefulWidget&gt; createState() =&gt; _SummaryPageState();
}

<span class="hljs-class"><span class="hljs-keyword">class</span> <span class="hljs-title">_SummaryPageState</span> <span class="hljs-keyword">extends</span> <span class="hljs-title">State</span>&lt;<span class="hljs-title">SummaryPage</span>&gt; </span>{
  <span class="hljs-keyword">final</span> _summaryBloc = SummaryBloc(AccountingRepository.db);

  ...

  <span class="hljs-meta">@override</span>
  Widget build(BuildContext context) {
    <span class="hljs-keyword">return</span> Scaffold(
      ...

      body: Column(
        children: &lt;Widget&gt;[
          Divider(
            height: <span class="hljs-number">1.0</span>,
          ),
          Container(
            color: Colors.white,
            padding: EdgeInsets.only(bottom: <span class="hljs-number">10</span>),
            child: StreamBuilder(
              stream: _summaryBloc.summaryChartData,
              builder: (BuildContext context,
                  AsyncSnapshot&lt;SummaryChartData&gt; snapshot) {
                ...
              },
            ),
          ),
          Expanded(
            child: StreamBuilder(
              stream: _summaryBloc.summaryList,
              builder: (BuildContext context,
                  AsyncSnapshot&lt;BuiltList&lt;SummaryListItem&gt;&gt; snapshot) {
                ...
              },
            ),
          )
        ],
      ),
    );
  }
}

<span class="copy-code-btn">复制代码</span></code></pre><p>完结撒花，最后我们来看看项目的运行效果：</p>
<table>
<thead>
<tr>
<th style="text-align:center">Android</th>
<th style="text-align:center">iOS</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:center"><figure><img alt="android" class="lazyload inited" data-src="https://user-gold-cdn.xitu.io/2019/7/8/16bcfc8a51b30e03?imageslim" data-width="360" data-height="640" src="data:image/svg+xml;utf8,<?xml version=&quot;1.0&quot;?><svg xmlns=&quot;http://www.w3.org/2000/svg&quot; version=&quot;1.1&quot; width=&quot;360&quot; height=&quot;640&quot;></svg>"><figcaption></figcaption></figure></td>
<td style="text-align:center"><figure><img alt="ios" class="lazyload inited" data-src="https://user-gold-cdn.xitu.io/2019/7/8/16bcfc8a535cc30f?imageslim" data-width="360" data-height="779" src="data:image/svg+xml;utf8,<?xml version=&quot;1.0&quot;?><svg xmlns=&quot;http://www.w3.org/2000/svg&quot; version=&quot;1.1&quot; width=&quot;360&quot; height=&quot;779&quot;></svg>"><figcaption></figcaption></figure></td>
</tr>
</tbody>
</table>
<h2 class="heading" data-id="heading-7">Unit Test</h2>
<p>为了保证代码质量和逻辑正确性Unit Test是必不可少的，对于<code>common</code> module代码，我们只要在<code>commonTest</code>中写一套Unit Test就可以了，当然有时候我们需要为不同平台编写不同的测试用例。在<a target="_blank" href="https://link.juejin.im?target=https%3A%2F%2Fgithub.com%2FlittleGnAl%2Faccounting-multiplatform%2Ftree%2Flittlegnal%2Fblog-kmpp-flutter" rel="nofollow noopener noreferrer">Demo</a>里我主要使用<a target="_blank" href="https://link.juejin.im?target=https%3A%2F%2Fgithub.com%2Fmockk%2Fmockk" rel="nofollow noopener noreferrer">MockK</a>来mock数据，但是遇到一些问题，在Kotlin/Native无法识别<code>MockK</code>的引用。对于这个问题，我提了一个<a target="_blank" href="https://link.juejin.im?target=https%3A%2F%2Fgithub.com%2Fmockk%2Fmockk%2Fissues%2F322" rel="nofollow noopener noreferrer">issue</a>，目前还在处理中。</p>
<h2 class="heading" data-id="heading-8">TL;DR</h2>
<p>跨平台这个话题在现在已经是老生常谈了，很多公司很多团队都希望使用跨平台技术来提高开发效率，降低人力成本，但开发的过程中会发现踩的坑越来越多，很多时候并没有达到当初的预期，个人认为跨平台的最大目标是代码复用，<em>Write Once Run Anywhere</em>，让多端的开发者共同实现和维护同一代码逻辑，减少沟通导致实现的差异和多端代码实现导致的差异，使代码更加健壮便于维护。</p>
<p>本文简单演示了如何使用Flutter和Kotlin Multiplatform来达到<em>Write Once Run Anywhere</em>的效果。个人认为Kotlin Multiplatform有很大的前景，Kotlin Multiplatform还支持JS平台，所以公用的代码理论上还能提供给小程序使用（希望有机会验证这个猜想）。在今年的Google IO上Google发布了下一代UI开发框架<a target="_blank" href="https://link.juejin.im?target=https%3A%2F%2Fdeveloper.android.com%2Fjetpack%2Fcompose" rel="nofollow noopener noreferrer">Jetpack Compose</a>，苹果开发者大会上苹果为我们带来了<a target="_blank" href="https://link.juejin.im?target=https%3A%2F%2Fdeveloper.apple.com%2Fxcode%2Fswiftui%2F" rel="nofollow noopener noreferrer">SwiftUI</a>，这意味着如果把这2个框架的API统一起来，我们可以使用Kotlin来编写拥有Native性能的跨平台的代码。<a target="_blank" href="https://link.juejin.im?target=https%3A%2F%2Fgithub.com%2FlittleGnAl%2Faccounting-multiplatform%2Ftree%2Flittlegnal%2Fblog-kmpp-flutter" rel="nofollow noopener noreferrer">Demo</a>已经上传到github，感兴趣的可以clone下来研究（虽然写的很烂）。有问题可以在github上提issue。Have Fun！</p>
</div>