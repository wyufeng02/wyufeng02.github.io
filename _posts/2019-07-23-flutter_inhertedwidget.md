---
layout: post
title:  InhertedWidget和它的继承者们
tag: [flutter]
date: 2019-07-22
categories:
- note
---

## 0x00 概念介绍

简单一点说
>
> * inhertedwidget 是一个widget，跟其他widget不一样的地方是，他可以在他所持有的child中共享自己的数据。如Theme。
> * 应用场景：app的复杂度越来越大，对于数据之间的传递，如果都是根据dic或者model作为widget内部的参数传递，是不友好的方式。正常的想法，此时应该有个数据中心，或eventbus，用于数据传递和取用，而在flutter中是inhertwidget
> * 实现： 内部实现数据更新，自动通知的方式，从而自动刷新界面
> *  写法： 见下面例子


对于赶时间的同学看到这里就可以回去搬砖了。下面留给还有五分钟时间浏览的同学。


google 在`flutter widget of the week` 中介绍 `inheritedwidget`， 短短的两个简短的视频，让人看到了flutter的用心，外语一般的我也能把概念看得个大概。但是对于真正使用其上手开发的同学总觉得离实际开发距离有点远，还是得编写一下例子才能理解更深一点。

作为一名高效的搬砖工，先看看它说了啥

## 0x01 前情提要
 
![code4flutter](http://code4flutter.oss-cn-beijing.aliyuncs.com/imgs/inhertwiget_01.png)

当应用变得更大时，小部件树,变得更复杂，传递和访问数据,会变得很麻烦。 
如果你有四个或五个小部件一个接一个地嵌套, 并且您需要从顶部获取一些数据。将它添加到所有这些构造函数中,以及所有这些构建方法。 
  
然而我只是想到达widget来获取数据。 不想一级一级传递数据。怎么办？幸运的是，有一个小部件类型允许这样。 它叫做InheritedWidget。 


![inherted_notify](http://code4flutter.oss-cn-beijing.aliyuncs.com/imgs/inherted_notify.png)

## 0x02 使用方式

### 创建一个InhertWidget

 ```dart
 class FrogColor extends InheritedWidget {
   const FrogColor({
     Key key,
     @required this.color,
     @required Widget child,
   }) : assert(color != null),
        assert(child != null),
        super(key: key, child: child);

   final Color color;

   static FrogColor of(BuildContext context) {
     return context.inheritFromWidgetOfExactType(FrogColor) as FrogColor;
   }

   @override
   bool updateShouldNotify(FrogColor old) => color != old.color;
 }
 ```

### 创建子WidgetA B

```dart

class TestWidgetA extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final inheritedContext = FrogColor.of(context);
    return new Padding(
        padding: const EdgeInsets.only(left: 10.0, top: 10.0, right: 10.0),
        child: Container(
          color: inheritedContext.color,
          height: 100,
          width: 100,
          child: Text('第一个widget'),
        ));
  }
}


class TestWidgetB extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final inheritedContext = FrogColor.of(context);
    return new Padding(
        padding: const EdgeInsets.only(left: 10.0, top: 10.0, right: 10.0),
        child: Container(
          color: inheritedContext.color,
          height: 50,
          width: 50,
          child: Text('第二个widget'),
        ));
  }
}
```

### 创建带状态的widgetC

```
class TestWidgetC extends StatefulWidget {
  TestWidgetC({Key key}) : super(key: key);

  _TestWidgetCState createState() => _TestWidgetCState();
}

class _TestWidgetCState extends State<TestWidgetC> {
 

  @override
  Widget build(BuildContext context) {
     final inheritedContext = FrogColor.of(context);
    // print(" 重建c CCC ");
    return Container(
        child: Container(
      color: inheritedContext.color,
      height: 200,
      width: 200,
      child: prefix0.Column(
        children: <Widget>[
          Text("第三个widget"),        
        ],
      ),
    ));
  }

  @override
  void didChangeDependencies() {
    print(" 更改依赖 CCC ");
    super.didChangeDependencies();
  }
}
```

### 组装

```

class MyHomePage extends StatefulWidget {
  MyHomePage({Key key, this.title}) : super(key: key);

  final String title;
  @override
  _MyHomePageState createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  int _counter = 0;
  Color color = Color.fromARGB(0, 0xff, 0xdd, 0xdd);
  Color color2 = Color.fromARGB(0, 0xff, 0xdd, 0xdd);

  void _incrementCounter() {
    setState(() {
      _counter = (_counter + 20) % 255;
      Color color = Color.fromARGB(_counter, 0xff, 0xdd, 0xdd);
      this.color = color;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            Text(
              'You have pushed the button this many times:',
            ),
            Text(
              '$_counter',
              style: Theme.of(context).textTheme.display1,
            ),
            new FrogColor(
              color: this.color,
              color2: this.color2,
              child: Column(
                children: <Widget>[
                  new TestWidgetA(),
                  new TestWidgetB(),
                  new TestWidgetC()
                ],
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _incrementCounter,
        tooltip: 'Increment',
        child: Icon(Icons.add),
      ),
    );
  }
}

```

本段代码实现了点击+号，数字增加，并且两个widget的颜色加深

效果图如下

![code4flutter](http://code4flutter.oss-cn-beijing.aliyuncs.com/imgs/inherted_demos.gif)

 
## 0x02 使用建议

###  InheritedWidgets通常包含一个名为的静态方法 of

它为您调用InheritWidget的精确类型方法。 

```
   static FrogColor of(BuildContext context) {
     return context.inheritFromWidgetOfExactType(FrogColor) as FrogColor;
   }
```

### final 不可变性

例子中FrogColor 里面的color就是一个final类型，不可以改变
  
只能替换InheritedWidget的字段,通过`重建`整个widget 树。 这个很重要!!! 只是意味着它`无法重新分配`。 但是并不意味着它不能在内部改变。 

### didChangeDependencies 改变时机

inhertedwidget改变了就会触发，didChangeDependencies，对于耗时操作的业务如网络请求来说可以放置这里。

从上例中可以做个试验，在widgetC中移除 `FrogColor.of(context)` 这句话，可以看到，颜色不好随着按钮点击变色，另外也不会调用`didChangeDependencies` 这个方法了。但是widgetc还是会走build方法。

可以印证两点，widget会重建，但是state不会重建，didChangeDespendice方法调用的时机是其依赖的上下文内容改变。


## 0x03 应用场景

* Theme实际上是一种InheritedWidget。 Scaffold，Focus Scope等等也是如此。 

* 附加服务对象到InheritedWidget。 如开发数据库的包装器

* Web API的代理或资产提供者。 服务对象可以有自己的内部状态。 它可以启动网络呼叫，任何事情。 


## 0x04 继承者们

### 老大，InheritedNotifier

继承自Inhertedwidget，其值可以是被监听的，并且只要值发送通知就会通知依赖者。

使用场景有 `ChangeNotifier`或`ValueNotifier`


``` 
abstract class InheritedNotifier<T extends Listenable> extends InheritedWidget {

  const InheritedNotifier({
    Key key,
    this.notifier,
    @required Widget child,
  }) : assert(child != null),
       super(key: key, child: child);
 
  @override
  bool updateShouldNotify(InheritedNotifier<T> oldWidget) {
    return oldWidget.notifier != notifier;
  }

  @override
  _InheritedNotifierElement<T> createElement() => _InheritedNotifierElement<T>(this);
}
```

### 老二， InheritedModel

继承自 Inertedwidget的，允许客户端订阅值的子部分的更改。

就比InertedWidget多了一个必要方法`updateShouldNotifyDependent`，表示可以根据，部分内容的改变发送依赖变更通知。

```
class ABModel extends InheritedModel<String> {
  ABModel({this.a, this.b, Widget child}) : super(child: child);

  final int a;
  final int b;

  @override
  bool updateShouldNotify(ABModel old) {
    return a != old.a || b != old.b;
  }

  @override
  bool updateShouldNotifyDependent(ABModel old, Set<String> aspects) {
    return (a != old.a && aspects.contains('a')) ||
        (b != old.b && aspects.contains('b'));
  }
  // ...
}
```

一图说明

![inhertedmodel](http://code4flutter.oss-cn-beijing.aliyuncs.com/imgs/inhertedmodel.png)


参考 

[inhertedwidget 文档](https://api.flutter.dev/flutter/widgets/InheritedWidget-class.html)
 

### 原创不易，版权所有，转载请备注 [code4flutter.com](https://code4flutter.com)

