---
layout: post
title: 使用流构建一个反应性和持久性的flutter应用程序
tag: [flutter,trans]
date: 2019-07-21 
---


# [译]使用流构建一个反应性和持久性的flutter应用程序

文章来源 https://medium.com/flutter-community/building-a-reactive-and-persistent-flutter-app-using-streams-4d6b947c5cb5

在本文中，我将使用一个简单的应用程序来演示构建一个可以更改的UI，而无需在屏幕上完全重建所有小部件。

![](https://cdn-images-1.medium.com/max/2560/1*WqOZYuVE_ksU12jnrtv-rw.jpeg)

在下面的app演示中，浮动操作按钮(FAB)显示在第一次调用构建之前初始化为零的计数器变量的值。

随着卡上的每次双击，变量的值增加1，但它不反映在FAB上，验证UI尚未重建。另一方面，第三张卡除了递增值之外调用* setState()*，提示UI重建，现在显示新的数字(三)。

![App demo](https://cdn-images-1.medium.com/max/2000/1*cJwp8ZV4SxUnSeSQ_9pEDQ.gif)* App demo *

## 架构

该应用程序遵循反应式编程的原则，并基于BLoC模式使用流进行数据传播。

![应用流程](https://cdn-images-1.medium.com/max/2520/1*cR5DwFhm-J1yqd_YOJf4ug.jpeg)*应用流程*

* UserBloc *具有从窗口小部件接收输入的流，并为侦听这些流的那些窗口小部件提供更新。我们还可以使用单独的流处理输入和输出，这样我们就可以添加逻辑以确保只有选定和处理的输入才能进入输出流。

* UserBloc *通过窗口小部件树顶部的* BlocProvider *提供给所有窗口小部件，它只是* UserBloc *的*有状态*包装器(允许处理资源，如关闭流)。

```

  @override
  Widget build(BuildContext context) {

    return MaterialApp(

      title: 'Flutter Streams',

      theme: ThemeData(
        primarySwatch: Colors.green,
      ),

      home: BlocProvider(
        bloc: UserBloc(),
        child: MyHomePage(title: 'Flutter Streams'),
        ),
    );
  }
```
 

## 代码

卡片小部件订阅了相应的流，并且onDoubleTap()方法传递给它们的bool值确定它们是否显示。如果值为false，则从UI中删除窗口小部件。
*应用程序假定客户端ID为"1"以用于说明目的，但可以替换为"client.id"。*

```
 StreamBuilder<Message>(

                  stream: bloc.outStatusOne,
                  initialData: Message(client.statusOne, 1),
                  builder: (BuildContext context, AsyncSnapshot<Message> snapshot){
                    return (snapshot.data.value == true)?

                Flexible(child: GestureDetector(

                  onDoubleTap: (){
                    bloc.sinkStatusOne.add(new Message(false, 1));
                    bloc.sinkCounter.add(null);
                    counterLocal += 1;
                    client.setStatusOne(false);
                  },

                  child: Card(
                      color: Colors.amber.shade300,
                      elevation: 16,
                      margin: EdgeInsets.symmetric(horizontal: 4, vertical: 45),

                      child: Padding(
                        padding: EdgeInsets.symmetric(vertical: 50, horizontal: 5),
                        child: Text("First Card"),)
                    )
                )): Container();

                  }),
view raw
```
 

遇到双击时，会采取两种措施。

首先，具有"false"值的* Message *对象和用户id被传递到流中。

其次，在* ClientModel *类中调用一个方法来修改* status *参数。反过来，这些方法调用数据库方法来持久化数据。
> *每当重新启动应用程序时，* StreamBuilder *会检查数据库中的现有值作为其* initialData

```
void setStatusOne(bool status){

    this.statusOne = status;

    DBProvider.db.updateClient(this);

  }
```

### 强制重建UI

到目前为止，FAB并未反映本地计数器变量的真实值。为了实现这一目标，我们必须强制重新构建小部件。

这是通过将"非反应性"卡集成到UI中来实现的。此卡(第三张卡)调用* setState()*来更改参数并刷新屏幕。

```

(client.statusThree == true)?
                GestureDetector(
                  onDoubleTap: (){
                    setState(() {
                     client.setStatusThree(false);
                     bloc.sinkCounter.add(null);
                     counter_two += 1;
                    });
                    
                  },
                  child: Card(
                      color: Colors.lightGreen.shade200,
                      elevation: 12,
                      margin: EdgeInsets.symmetric(horizontal: 10, vertical: 30),
                      child: Padding(
                        padding: EdgeInsets.symmetric(vertical: 40, horizontal: 40),
                        child: Text("Third Card"),)
                    )

                ): Container(), 
```
结果，FAB现在显示数字"3"。

### 使反制者反应

计数器也可以立即反映双击的变化。这就是* sinkCounter *的用武之地。
 
 ```


  StreamController<int> counterController = StreamController<int>.broadcast();

  StreamSink<int> get sinkCounter => counterController.sink;



  StreamController<int> counterObserverController = StreamController<int>.broadcast();

  Stream<int> get counterStream => counterObserverController.stream;  
 

 ```

创建了两个流;一个用于处理输入提示，另一个用于广播由FAB拾取的值。

* counterController *有一个监听器，它将已经存在的值递增1并将该值放入* counterObserverController *的流中。
 
 ```

UserBloc(){

    counter = 0;

    counterController.stream.listen((data){

      counter = counter + 1;

      counterObserverController.sink.add(counter);

    });

  }
view rawUserBloc_Constructor.dart hosted with ❤ by GitHub

 ```

侦听器在构造函数内部分配;已添加的值与此处计数器的用途无关，因此会被忽略。如果你看一下* onDoubleTap()*里面的方法调用，你会注意到我将* null *传递给流，原因就在于此。
  
```

floatingActionButton: StreamBuilder(

         stream: bloc.counterObserverController.stream,

         initialData: 0,

         builder: (BuildContext context, AsyncSnapshot<int> snapshot){

           return FloatingActionButton(

           onPressed: (){},

           tooltip: 'Number',

           child: Text("${snapshot.data}"),

           );

         },
       ) 
 
```

## 结论

我们已经研究了使用BLoCs和流构建UI，并演示了数据库与数据传播流的集成。

### 参考文献

[** Dart Streams基础知识](https://www.burkharts.net/apps/blog/?source=post_page---------------------------)

[** Reactive Programming  -  Streams  -  BLoC](http://ReactiveProgramming-Streams-BLoC)

[** Flutter社区(@FlutterComm)| 推特** *来自Flutter社区的最新推文(@FlutterComm)。 从www.twitter.com获取新文章和包裹的通知](https://www.twitter.com/FlutterComm)