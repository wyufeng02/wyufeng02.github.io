---
layout: post
title:  flutter区别其他语言的特性
tag: [flutter]
date: 2019-07-22
categories:
- note
---


# flutter区别于其他语言的新特性

一图说明
![fluttertop.dev](http://code4flutter.oss-cn-beijing.aliyuncs.com/imgs/flutter特性.png)


##	skia

c++开发、性能彪悍的2d图形引擎
	前身为向量绘图软件
在图形转换、文字渲染、位图渲染方面表现卓越，并提供了开发者友好的API
android官方渲染引擎，flutter android sdk无需内嵌skia引擎，而ios需要内嵌，用于替代 coregraphics、core animate core text。所以打包体积大
底层渲染统一保证了上层开发接口和功能的统一，不用担心平台相关的渲染特性，ios、android渲染效果完全一致

##	dart

选择dart的原因， Dart语言开发组就在隔壁
快速在语法层面落实
如选JavaScript，必须经过各种委员会和浏览器提供商漫长的决议
同时支持AOT、JIT，具有运行速度快，执行性能好的特点
jit 即时编译  支持hot reload
aot 事前编译，使用与发布阶段，代码性能和用户体验更好
Dart避免了抢占式调度和共享内存，可以在没有锁的情况下进行对象分配和垃圾回收（isolate）

##	三层架构

### embedder 操作系统适配层
	实现渲染surface设置 线程设置、平台插件等平台相关特性的适配

### engine层 
  
	包括skia dart 和text 实现渲染引擎、文字排版、事件处理、和dart运行时功能
	Skia和text为上传接口提供底层渲染和排版的能力
	Engine将其组合，从生产的数据中实现视图渲染

### framework层
*	dart实现的ui sdk

		包括动画、图形绘制、手势识别等功能
		提供固定样式、material、cupertino 两种视觉风格ui组件库
*	控件树 widget tree

		渲染对象树
		过程：布局、绘制、合成、渲染
*	布局

		深度优先遍历渲染对象树
		子渲染对象收到父对象布局约束参数决定自己大小
		父对象决定子渲染对象位置，完成布局
		布局边界：在边界内渲染对象发生布局变化不影响边界外的渲染对象
*	绘制

		绘制过程也是深度优先遍历，总算先绘制自身再绘制子节点
		重绘边界、在重绘边界内，flutter强制切换新的图层，这样避免边界内外的相互影响，避免无关内容至于同一图层引起不必要的重绘
*	合成、渲染

		多图层渲染、可能出现大量渲染内容的重复绘制，需要先进行一次图层的合成，根据所有图层大小层级，透明度等规则计算最终的显示效果，将相同的图层归类合并，简化渲染树，提供渲染效率
		合并完成，将几何图层交由skia引擎加工成二维图形数据，最终交由gpu渲染、完成界面展示