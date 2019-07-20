---
layout: post
title:  widget 中的state到底是什么
tag: [flutter,state]
date: 2019-07-20
categories:
- note
---

## 0x00 无状态组件和状态组件

wiget是fltter界面开发中的基础控件，如同ios中的uiview这种地位，所谓万物皆wiget。

wiget有分为statelessWidget和statefulWidget，这两者是什么区别呢。一句话就是说statelessWiget用来展示无状态的视图，而statefulWiget用来展示可交互的，动态的视图。 

到此基本的结论已经出来了，那么state究竟是怎么实现状态的更新的？

## 0x01 UI编程范式

iOS和安卓开发采用的是命令式编程范式，而flutter、前端的VUE，小程序开发采用的是声明式。

如 ios

```
UILable * lable  = [UILable new];
label.text = "hello world";
```
这就是命令式，直接对控件中的属性进行精准高效的赋值控制。

然而flutter如下

```

class BgChangeView extends StatefulWidget {
  @override
  _BgChangeViewState createState() => _BgChangeViewState();
  Color color = Colors.red;
}

class _BgChangeViewState extends State<BgChangeView> {
  int count = 10;

  void _incrementCounter() {
    setState(() {
      count = count>255 ? 0 :count + 10;
      widget.color = Color.fromARGB(count, 0x00, 0xff, 0xff);
      print("state refresh count ${count}");

    });
  }
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 100,
      height: 100,
      child: RaisedButton(onPressed: _incrementCounter,
        color: widget.color,
      ),
    );
  }
}

```

![flutterdev.top](http://code4flutter.oss-cn-beijing.aliyuncs.com/imgs/wiget_state_rebuild_demo.png)

将color指定给raisebutton，color在state中更新了，从而更新了raisebuttom的背景颜色


## 0x02 如何实现

state是表示视图的状态，当setState触发当前视图及其子视图的销毁重建，从父视图到子视图，从上到下的顺序重建。

![flutterdev.top](http://code4flutter.oss-cn-beijing.aliyuncs.com/imgs/wiget_state_rebuild.png)


猜测内部state的实现

其实state是负责销毁重建的，在重建的过程中重新对wiget树一级级生成，并把外部的数据重新对wiget进行赋值操作，因为内部机制小部件重建的效率很高，几乎肉眼看不到它销毁的过程，但是如果对于root视图频繁进行state的操作，会带来很大的性能开销，卡顿，cpu，gpu使用率过高等情况。这也是声明式编程一个弊端。使用中需要进来避免过多的setState的操作。

flutter engine内部当然会优化这部分的性能，每次重建之后之前申请的wiget或randerobject使用的空间不会一个个的清空释放，而是采取一直`滑动压缩`的方式进行清理。如下图所示

![code4fluttter](http://code4flutter.oss-cn-beijing.aliyuncs.com/imgs/dart_gc.png)


* flutter将内存区域分为两部分，活跃空间和不活跃空间
* 用户使用app，flutter在活跃空间不断申请内存空间
* 直到获取空间分配满了
* 检查活跃空间中活跃的对象，将活跃的和其所依赖的对象一并标志
* 在app空闲时将活跃的对象移动到不活跃区域，此时活跃的对象中间没有不活跃的区域了
* 将不活跃的区域和活跃区域交换状态




参考文章
>
* flutter核心技术实战 https://time.geekbang.org/column/article/108576
* flutter内存技术 http://www.helloted.com/flutter/2019/05/13/DartRuntime/