---
layout: post
title:  动态化方案MXFlutter分析和DynamicWidget对比
tag: 动态化
date: 2019-06-11
categories:
- note
---

## 0x00 起源

动态化方案早先是flutter在2019的工作之一，但是后来的消息又取消了这个任务。然而市面上也有不少方案可以间接实现动态化，总体来说是比较中国化的。

怎么说是中国化呢？
## 0x01 基于配置下发方式

说的就是[dynamicwidget](https://github.com/dengyin2000/dynamic_widget)方案，算是比较直观的一种方式了，简单来说就是把json转map 通过解析map  转成对应的wiget树，这么一个工具，由于所有的元素都是wiget，里面的属性也是差不多的，也可以单独对一个一个的widget如 image，scrollview，text，input等做对应的解析。

由于json配置是可以下发的，所以可以做到动态化

## 0x02 基于js转ui

[MXFlutter](https://github.com/Natoto/MXFlutter)

可以实现服务端下发js，在终端通过JavaScriptCore解析dsl，映射到对应dart对象中去，如wiget或者animate等

## 0x03 优缺点

实现成本对比上，js方案需要对于基本上所有的对象做一次映射，dynamic方案会简单。

性能上，在动态化上面都可以实现，但是在性能上面，内存上面，js方案问题会比较大，从介绍上说原本40m左右打包出来会额外多出40m达到80m的级别。
dynamicwiget方案会比较简单，对于简单的活动页比较适合。

扩展性上，js的灵活性更大，dynamicwiget对于逻辑上的扩展比较差，停留在ui层面


工具侧，比如代码提示，调试工具，构建打包，脚本，社区服务，这些都不是很成熟。

## 0x04 后期

在flutter官方没有出动态化方案之前，说明官方对动态化是比较谨慎的，flutter本身开发效率就很高，hotreload足够最快的检测出问题了，如果用json写代码，用js写界面，没有足够好的工具侧的支持很难达到同等级别的开发效率，开发的产出的风险，崩溃，内存这些都是很严重的。

但是vip和qq团队的尝试，对于其他开发者是一个学习借鉴的过程，意义都很大。

对于热更方案你怎么看呢？请在下面留言吧~~


