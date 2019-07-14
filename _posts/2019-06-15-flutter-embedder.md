---
layout: post
title:  flutter底层原理和embedder的隐忧
tag: [flutter engine]
date: 2019-06-15
---

 # flutter底层原理和embedder的隐忧

从Flutter
technical-overview基本架构来说framework是使用最频繁的，但是对于engine和embedder确是flutter的底层，支持整个flutter的运行

* 本文图片参考于闲鱼文章
* 架构图参考[flutter.dev](https://link.juejin.im/?target=https://flutter.dev/docs/resources/technical-overview)



![](https://user-gold-cdn.xitu.io/2019/6/15/16b5b64545ea5113)
 



flutter 有三个学习层次，framework，engine，embedder
上层的framework负责ui相关的事情，动画，widget，绘图，手势，基础库
engine层次c++实现，支持flutter相关的渲染，线程管理，平台事件。
 

engine里面有个内存泄漏，flutter官方一直没有解决，可以出门左转找到解决方案《手把手教你解决flutter内存泄漏》。一句话就是，flutter在处理flutter
method channel和register与engine之间持有关系比较混乱，存在一个比较大的循环引用。

![](https://user-gold-cdn.xitu.io/2019/6/15/16b5b61aaad058c3)


embedder 为engine提供四个task runner，将引擎移植到平台的中间层代码 渲染设置，原生插件，打包，线程管理，事件循环交互操作

在shell.cc里面可以看到，四个runner包括 ui runner gpu runner、io runner、platform runner

* ui runner负责绑定渲染相关的操作，如通知engine有帧渲染，等待下一个vsync，对创建的widget进行layout并生成layer
tree，更新layer tree信息，通知处理native plugin信息，如timer，microtask，异步io操作

* gpu runner是用于执行gpu指令，负责将layer
tree提供的信息转换为平台可执行的gpu指令，负责绘制gpu资源的管理，包括framebuffer，surface、texture、buffers

* io runner是处理图片数据，为gpu渲染做准备，比如读取磁盘压缩图片的格式，将解压成gpu能处理的格式，并传给gpu，因其比较消耗性能所以单独开一个线程。

* platform runner，所有接口调用都使用该接口，长时间卡顿将会被watchdog强杀。

runner的实现策略，ios、android平台启动时为ui，gpu，io runner各自创建一个线程，但是共享platform runner和线程
Fushia,为ui，gpu，io，platform各自创建一个线程。



![](https://user-gold-cdn.xitu.io/2019/6/15/16b5b630686912a0)



isolate 是dart
vm自己管理，engine无法访问，它是对actor并发模式的实现，运行中程序由一个或多个actor组成，这些actor就是isolate。

原意是隔离的意思，表示没有共享内存和并发，逻辑上隔离，按顺序执行，不用担心死锁的问题。
isolate直接的通信方式只能通过port，消息传递异步，与普通线程最大的区别就是没有共享内存。
实现的步骤有，初始化isolate数据结构，初始化堆内存，进入对应所在的线程运行isolate，配置port，配置消息处理机制，配置debugger，将isolate注册到全局监控器。

与runner的关系，isolate是dart vm自己管理，engine无法访问。 如对于ui
runner来说，isolate通过dart的c++调用能力，将ui渲染任务提交到ui
runner，这样可以跟engine相关模块进行交互，ui相关的任务被提交到ui
runner也给isolate一些事件通知，所以isolate同时处理app和native plugin的任务 对于gpu
rnnner来说，isloate将dart的c++调用能力把gpu指令提交给gpu runner，把layer
tree信息转换为gpu指令，这些都是通过isolate来执行的

> 

分享一个坑，emmberdder里面有一个fml weakptr会造成四个task
runner在reset的时候释放，但是不会把指针置空，会在一定几率下关闭flutterviewcontroller，造成崩溃，因为访问了野指针，fml的实现使用了uniqueptr智能指针，如果控制不好，这个应该后期会给flutter带来比较大的崩溃率。

测试代码


以上代码是google工程师提供的测试代码，autoreleasepool中包括了flutter和engine的创建，然后自动释放，然后在释放之后重新调用sendmessage的方法，此时会有一个访问野指针的崩溃。
对于engine的改写就需要在释放的时候防止对内部方法的访问



![](https://user-gold-cdn.xitu.io/2019/6/15/16b5b7e6cca95542?imageView2/0/w/1280/h/960/format/webp/ignore-error/1) 



这样可以防止释放时候崩溃，但是对于根本的原因是fml内部实现的问题，如上所说，释放完成而指针变成了悬空指针。

engine的第二个隐患，在shell.cc访问weakptr一定会得到一个不为空的指针，即使是在engine或platformview释放的时候，以下是它的实现代码



![](https://user-gold-cdn.xitu.io/2019/6/15/16b5b82d301bf985?imageView2/0/w/1280/h/960/format/webp/ignore-error/1) 





![](https://user-gold-cdn.xitu.io/2019/6/15/16b5b82144b3e46a)




粗略算了一下，四个taskrunner的getweakptr方法的实现都有隐患，归根到底还是fml的实现问题，悬空指针没有解决，这些都会造成野指针访问内存的崩溃。



![](https://user-gold-cdn.xitu.io/2019/6/15/16b5b8481e4553f9) 



* 本文[demo](https://link.juejin.im/?target=https://github.com/Natoto/flutterOnExistApp)
[github.com/Natoto/flut…](https://link.juejin.im/?target=https://github.com/Natoto/flutterOnExistApp)
* 【flutter engine 开发】QQ群号:217429001
 