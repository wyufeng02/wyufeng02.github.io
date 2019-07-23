

---
layout: post
title:  inhertedWidget和它的兄弟们
tag: [flutter]
date: 2019-07-22
categories:
- note
---

## 0x00 概念介绍

简单一点说
>
> * inhertedWiget 是一个wiget，跟其他wiget不一样的地方是，他可以在他所持有的child中共享自己的数据。如Theme。
> * 应用场景：app的复杂度越来越大，对于数据之间的传递，如果都是根据dic或者model作为wiget内部的参数传递，是不友好的方式。正常的想法，此时应该有个数据中心，或eventbus，用于数据传递和取用，而在flutter中是inhertwiget
> * 实现： 内部实现数据更新，自动通知的方式，从而自动刷新界面
> *  写法： 见demo


对于赶时间的同学看到这里就可以回去搬砖了。下面留给还有五分钟时间浏览的同学。


google 在`flutter wiget of the week` 中介绍 `inheritedWiget`， 短短的两个简短的视频，让人看到了flutter的用心，外语一般的我也能把概念看得个大概。但是对于真正使用其上手开发的同学总觉得离实际开发距离有点远，还是得编写一下例子才能理解更深一点。

作为一名高效的搬砖工，先看看它说了啥

## 0x01 前情提要


![img](http://code4flutter.oss-cn-beijing.aliyuncs.com/imgs/inhertwiget_0.png)

![img](http://code4flutter.oss-cn-beijing.aliyuncs.com/imgs/inhertwiget_01.png)


当您的应用变得更大时，您的小部件树,变得更复杂，传递和访问数据,会变得很麻烦。 
如果你有四个或五个小部件一个接一个地嵌套, 并且您需要从顶部获取一些数据，

在底部，您将它添加到所有这些构造函数中,以及所有这些构建方法。 
  
我只是想到达树来获取数据。 幸运的是，有一个小部件类型允许这样。 它叫做InheritedWidget。 
 
## 0x02 使用方式

当您将此小部件放入树中时， 你可以从它下面的任何小部件中获得对它的引用。 这就是我们称之为InheritedWidget的原因。 
 
想想一下家谱。 
 
例如，我继承了我的大鼻子，来自我父亲和祖父。 在家谱中他们都高于我， 所以我可以继承他们。 

所以要明确，这不是继承的，如在类层次结构中但继承，在小部件层次结构中。 
 
让我们看看我们如何实现其中一个继承的小部件。 我们将创建一个名为inherited notes的类
 
extends InheritedWidget。 
 
我们需要我们的小部件接受至少一个参数， 那是孩子。 这已经是一个有效的InheritedWidget， 
 
但它没用。 让我们给它一个鼻子。 在这种情况下，鼻子将是鼻子的图像资产。 
 
我们只是将它添加为InheritedWidget的一个字段。 现在我们继承了鼻子的任何后代
 
可以在其构建方法中访问它，通过调用精确类型的上下文点InheritWidget。 
 
通过使用您的自定义类型调用此方法，你告诉Flutter，InheritedWidget 
 
从构建上下文开始向上移动树，并寻找与该类型匹配的小部件。 
 
但为了使事情更简单，更易读，InheritedWidgets通常包含一个名为的静态方法， 
 
它为您调用InheritWidget的精确类型方法。 
 
现在我们可以在后代重写我们的代码，读取上下文的InheritedNose点，这很好。 
 
如果复杂的业务似乎很熟悉， 这是因为Flutter框架本身使用它。 
 
例如，您可能知道获得的方式，材料应用的全球主题， 
 
你做上下文的主题点。 主题实际上是一种InheritedWidget。 
 
Scaffold，Focus Scope等等也是如此。 
 
 ## 注意点

关于InheritedWidget的一件事，是`不可改变的`。 这就是我们的图像资产最终是智能的原因。 
 
您只能替换InheritedWidget的字段,通过`重建`整个小部件。 记在脑子里。 
 
许多InheritedWidgets将保持不变,对于应用程序的整个生命周期，这没关系。 

## 应用场景

但事实是某些事情是最终的, 只是意味着它`无法重新分配`。 这并不意味着它不能在内部改变。 

例如，您可以附加服务对象而不是值,到InheritedWidget。 

它可以是数据库的包装器， 您的Web API的代理或资产提供者。 

服务对象可以有自己的内部状态。 它可以启动网络呼叫，任何事情。 
 
在我们的情况下，不提供任何服务，各种鼻子相关的服务。 
 
InheritedNose小部件的每个后代，可以轻松掌握服务
 
通过InheritedNose上下文点。 它可以调用它上面的方法 -  总而言之，InheritedWidget非常简洁。 
 
它允许您从树中的上面的方式访问状态。 
  


参考 [文档](https://api.flutter.dev/flutter/widgets/InheritedWidget-class.html)

http://mo.dbxdb.com/setting.html