---
layout: post
title:  手把手教你futter engine内存泄漏
tag: flutter engine
date: 2019-05-29 
---

## Flutter/engine 修复版介绍

tags: `flutter` `engine` `memory` `leak` `fix` `natoto`

### 最近更新
0520 更新flutter 1.5内存引用问题 
0305 更新flutter 1.2内存引用问题 
[demo地址](https://github.com/Natoto/flutterOnExistApp/tree/flutter1.2)

>
>团队在0.9.4 版本解决了一系列循环引用，但是代码不能上传，由于flutter和engine的限制，必须flutter版本号和engine的commit号要保持一致，提交了将导致commit号不一致的问题，导致运行失败，官方号称1.0解决了循环引用，下载了一看，令人失望，还是没有彻底解决，于是决定`自己动手,丰衣足食` ，经过了几天痛苦的下载编译，调试，测试，终于把内存降下来了。

欢迎关注
姊妹篇[《手把手教你编译Flutter engine》](https://www.jianshu.com/p/6519ed563fcc)

##  官方flutter的大麻烦
google团队的大bug,个人认为内存是很重要的，尤其是集成到现有app中的方式。

https://github.com/flutter/flutter/issues/24714
https://github.com/flutter/flutter/issues/23231
https://github.com/flutter/flutter/issues/25255
https://github.com/flutter/engine/pull/6879
https://github.com/flutter/flutter/issues/16995

![image.png](https://user-gold-cdn.xitu.io/2018/12/27/167ef447d3eb51e3?w=1240&h=415&f=png&s=170082)

![image.png](https://user-gold-cdn.xitu.io/2018/12/27/167ef447d3dca246?w=1240&h=489&f=png&s=171304)



flutter 1.0 解决了FlutterViewController的循环引用问题，但是把循环引用的问题转嫁到了FlutterEngine上面，下面手把手教你如何解决1.0的循环引用。

 

## 如何找到内存泄漏

### 为什么google难以解决
由于整个FlutterEngine是用MRC的方式编写，所以内存管理比较困难，每个变量生成retain，都需要被release，如果一个实例retain了两次，只release一次，也会导致无法释放，如果设置了autorelease，就有可能提前释放，导致badasses，访问野指针。

客观原因，一般的应用只会创建一个flutter应用，或者干脆就直接都是flutter应用，不释放就不释放，多点内存也无所谓，不影响崩溃，不影响使用，所以google照常发布1.0版。

### 现状
每次进去都会新增几十M然而当退出flutterViewController的时候，内存仅仅下降2m左右，还有几十兆保留在内存中。下降的部分就是flutterviewcontroller，从程序运行到了dealloc可以证明。


### 修改结果

![这是修改后的文件](https://user-gold-cdn.xitu.io/2018/12/27/167ef447d4025af7?w=1240&h=812&f=png&s=344297)

修改后的framework下载列表
* 1.0版engine arm64 debug下载 [https://github.com/Natoto/flutterOnExistApp/blob/multiflutter/flutterOnExistApp/Resources/Flutter.framework.zip](https://github.com/Natoto/flutterOnExistApp/blob/multiflutter/flutterOnExistApp/Resources/Flutter.framework.zip)
 
*  其他版本打包发布github 地址
[https://github.com/Natoto/fixFlutterEngine](https://github.com/Natoto/fixFlutterEngine)

下面将一步步带领大家找到循环引用，解决循环引用，这一步可能比较繁琐，如果不愿看推理过程，可以直接跳到文末获取构建后的framework。

###  使用flutterViewController

```
/**
* 加载boundle资源
*/
- (void)handleBoundleResource {    
    NSString * path = [[NSBundle mainBundle] pathForResource:@"flutter_assets" ofType:@""];
    NSURL * url = [NSURL URLWithString:path];
    FlutterDartProject * dart = [[FlutterDartProject alloc] init];
    if (!self.engine) {
        FlutterEngine * engine = [[FlutterEngine alloc] initWithName:path.lastPathComponent project:dart];
        [engine runWithEntrypoint:nil];
        self.engine = engine;
    }
    FlutterViewController* flutterViewController = [[FlutterViewController alloc] initWithEngine:self.engine nibName:nil bundle:nil];    
    [GeneratedPluginRegistrant registerWithRegistry:flutterViewController];    
    [self addBackButton:flutterViewController]; 
     [flutterViewController setInitialRoute:@"route1"];
    [self presentViewController:flutterViewController animated:YES completion:nil];    
}
```

`flutterEngine`, flutter官方推荐方式是自己管理flutterEngine，然后flutterviewcontroller是可以独自创建和释放，`FlutterEngine`是新1.0引进，用于管理所有的metchodChannel，就是维护所有的方法消息，生命周期等作用。也是要解决它的引用问题。
执行`engine runwithEntrypoint`可以启动engine vm。

`FlutterDartProject` 用于配置启动参数，默认可以直接new，或者从bundle启动，找boundle下面的的flutter_assets文件夹，或直接导入App.framework

`FlutterViewController `用来显示flutter工程的，所有的界面都是在其上面渲染出来的。跟普通的UIViewController一样，可以present出来，或者push出来。

###   Flutter的入口
plugin是flutter的入口，这个入口可以连接flutter和原生代码
比如自带的`GeneratedPluginRegistrant`，将flutter工程中用到的插件都集中注册到原生

```
@implementation GeneratedPluginRegistrant

+ (void)registerWithRegistry:(NSObject<FlutterPluginRegistry>*)registry {
  [FlutterWebviewPlugin registerWithRegistrar:[registry registrarForPlugin:@"FlutterWebviewPlugin"]];
  [FLTPathProviderPlugin registerWithRegistrar:[registry registrarForPlugin:@"FLTPathProviderPlugin"]];
  [FLTSharedPreferencesPlugin registerWithRegistrar:[registry registrarForPlugin:@"FLTSharedPreferencesPlugin"]];
}

@end

```

介绍上面两个是为了找到断点入口

### 如何设flutter断点 
为了方便调试，可以在编译现有工程的时候替换flutter.framework
具体做法是在build phases 中创建一个脚本，用自己编译的engine中的flutter.framework替换 .ios/engine/Flutter.framework

![替换脚本](https://user-gold-cdn.xitu.io/2018/12/27/167ef447d44c5139?w=1192&h=407&f=png&s=97547)

替换完之后则可以设置symbol断点了，如下

![设置断点](https://user-gold-cdn.xitu.io/2018/12/27/167ef447d4364ea6?w=1240&h=455&f=png&s=132205)

或者用lldb命令设置断点 `br xxxx`  [lldb传送门](https://objccn.io/issue-19-2/)

### 几个疑点
从目前的情况来看engine没有被释放，就是`FlutterEngine.mm` `FlutterChannel.mm` 和 `PluginRegister`直接的关系混乱了
有两点情况
1. 互相引用
2. 内部引用没有release
3. 多次retain
4.  block是否使用的__block引用
5. 主动destory
6. 编译，看dealloc
从0.9.4经验来看，需要手动destory一下，destory完成这个类中变量的release
以上五个过程需要不断的循环重试，过程比较长。。

方法论说完了，下面直接说我的几天试错结果。共计10个文件，核心的地方贴一下
 
![maybesetupPlatformViewChannels](https://user-gold-cdn.xitu.io/2018/12/27/167ef447d44334c7?w=1232&h=832&f=png&s=171137)
 
`maybesetupPlatformViewChannels`在flutterengine里面，启动默认平台changnle和方法回调

![image.png](https://user-gold-cdn.xitu.io/2018/12/27/167ef44802eec349?w=1240&h=1175&f=png&s=568340)

重心，FlutterChannel.mm里面 `FlutterMethodChannel`，flutter每个plugin的方法都会经过通过register注册一个channel，然而，messger是register，不应该被持有或autorelease的，所以这样做是会造成提前释放或无法释放的

对应于其他的channel也是用了messager，会有相同的问题。改造这些基本上就能解除大循环了。

###   总结engine的大循环引用

![循环引用示例](https://user-gold-cdn.xitu.io/2018/12/27/167ef4480586affb?w=1240&h=518&f=png&s=145477)



## 如何使用
有两种方法
1.   替换flutter里面的framework
路径如下
 `/Users/boo/Documents/flutter/bin/cache/artifacts/engine/ios`
不用担心是否会破坏之前发flutter.framework，如果想用回官方的直接解压同文件夹里面的.zip文件即可

2. 工程中用zip，解压成framework替换掉真正从官方复制过来的flutter.framework
适用于 arm64真机

工程配置添加sh脚本

```
#R.replace.engine
cd "${SRCROOT}/flutterOnExistApp/Resources/"
  
unzip -u Flutter.framework.zip

cp -rf "${SRCROOT}/flutterOnExistApp/Resources/Flutter.framework" "${SRCROOT}/myflutter/.ios/Flutter/engine"

```

![image.png](https://user-gold-cdn.xitu.io/2018/12/27/167ef448096a58a5?w=1011&h=297&f=png&s=57345)


## 修改后代码

修改的文件放在`1.0engine修改的文件`，可以直接替换使用并构建自己的framework

* 1.0 修改的代码地址 [https://github.com/Natoto/flutterOnExistApp/tree/multiflutter/1.0engine%E4%BF%AE%E6%94%B9%E7%9A%84%E6%96%87%E4%BB%B6](https://github.com/Natoto/flutterOnExistApp/tree/multiflutter/1.0engine%E4%BF%AE%E6%94%B9%E7%9A%84%E6%96%87%E4%BB%B6)
* github demo 工程
[https://github.com/Natoto/flutterOnExistApp/tree/multiflutter](https://github.com/Natoto/flutterOnExistApp/tree/multiflutter)


* 1.0版engine arm64 debug下载 [https://github.com/Natoto/flutterOnExistApp/blob/multiflutter/flutterOnExistApp/Resources/Flutter.framework.zip](https://github.com/Natoto/flutterOnExistApp/blob/multiflutter/flutterOnExistApp/Resources/Flutter.framework.zip)
 ### 打包framework

看一下构建后结果

![engine的文件大小](https://user-gold-cdn.xitu.io/2018/12/27/167ef4480ebe8321?w=200&h=305&f=png&s=43452)


![一种模式的工程大小](https://user-gold-cdn.xitu.io/2018/12/27/167ef44816ee0b56?w=250&h=249&f=png&s=46663)

如构建debug版的engine如下路径或生产一个framework，这个通过执行`all.wxworkspace`生成的，注意arm架构，如果选target是真机，则会生成arm64架构framework
`/Users/boo/Documents/engine/src/out/ios_debug/Flutter.framework`

这个可以直接替换掉工程中原有的framework

构建release framework类似。
详细步骤可以参考[《手把手教你编译Flutter engine》](https://www.jianshu.com/p/6519ed563fcc)
 
 
 
 ---
 
 ### Flutter技术积累相关链接

[flutter多实例实战 by共田君](https://juejin.im/post/5c6e84156fb9a049a5718047)

[一行代码教你解决FlutterPlatformViews内存泄露 by 
AShawn ](https://juejin.im/post/5c6e6dd5f265da2dcf62821f)

[手把手教你在Flutter项目优雅的使用ORM数据库 by 
williamwen1986](https://juejin.im/post/5c45c72d6fb9a049d81c2b4c)

 [flutter通用基础库flutter\_luakit_plugin  by 
williamwen1986](https://juejin.im/post/5c34597651882523d3200c98) 

 [github - flutter\_luakit\_plugin使用例子  by 
williamwen1986](https://github.com/williamwen1986/flutter_luakit_demo) 
 
 [手把手教你编译Flutter engine by 共田君](https://juejin.im/post/5c24acd5f265da6164141236 ) 
 
 [手把手教你解决 Flutter engine 内存泄漏 by 共田君](https://juejin.im/post/5c24ad306fb9a049d2361cff) 
  
 [github - 编译产物下载 修复内存泄漏后的flutter engine（可直接使用）by 共田君](https://github.com/Natoto/fixFlutterEngine)</font>
 
 [github demo - 修复内存泄漏后的flutter engine by 共田君](https://github.com/Natoto/flutterOnExistApp/tree/multiflutter) 
 