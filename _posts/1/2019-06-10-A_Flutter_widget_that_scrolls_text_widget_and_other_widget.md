---
layout: post
title:  Marquee控件(走马灯)
tag: [code4flutter,flutterAwesome , Widgets, Marquee]
date: 2019-06-10
---

 


## [立即下载 ️⬇️ ](https://codeload.github.com/yousifk/marquee_widget/zip/master) 


 
![](https://flutterawesome.com/content/images/2019/06/marquee_widget.jpg)
 
>
> 一个Flutter widget，支持从右到左滚动Widget Text和其他Widget。
>

 
# marquee_widget

一个Flutter小部件，它使用支持的RTL滚动Widget Text和其他Widget。 提供许多自定义，包括自定义滚动方向和速度，在每一轮之后暂停并指定自定义持续时间和曲线以加速和减速。


- [Pub Package](https://pub.dartlang.org/packages/marquee_widget)
- [GitHub Repository](https://github.com/yousifk/marquee_widget)

## Usage


![](https://raw.githubusercontent.com/yousifk/marquee_widget/master/Image/screenShot.gif)


![](https://youtu.be/nhRpEIibKJQ)


This is a minimalistic example:

```dart
Marquee(
  child:Text( 'This project is a starting point for a Dart package, a library module containing code that can be shared easily across multiple Flutter or Dart projects. '),
)
```

And here's a piece of code that makes full use of the marquee's
customizability:

set Width and Height 
with Continer()

```dart
Marquee(
  child:Text( 'This project is a starting point for a Dart package'),
  scrollAxis: Axis.horizontal,
  textDirection : TextDirection.rtl,
  animationDuration: Duration(seconds: 1),
  backDuration: Duration(milliseconds: 5000),
  pauseDuration: Duration(milliseconds: 2500),
)
```











Exmpale


```dart
GridView.count(
        crossAxisCount: 2,
        childAspectRatio: 0.7,
        children: <Widget>[
          GridTile(
            child: Card(
              child: Column(
                children: <Widget>[
                  Expanded(
                      child: Image.network(
                    "https://i.pinimg.com/564x/9d/a6/36/9da636b9e60ea40b18921b0053b7d486.jpg",
                    fit: BoxFit.fitHeight,
                  )),
                  Marquee(
                      child: Text(
                    "Flutter is a free and open source Google mobile UI ",
                    style: TextStyle(fontSize: 16),
                  )),
                ],
              ),
            ),
          ),
          GridTile(
            child: Card(
              child: Column(
                children: <Widget>[
                  Expanded(
                      child: Image.network(
                    "https://cdn-images-1.medium.com/max/1000/1*upTyVPOfBb0c4o1r57C9_w.png",
                    fit: BoxFit.fitHeight,
                  )),
                  Marquee(
                      child: Text(
                    "Flutter is a free and open source Google mobile UI ",
                    style: TextStyle(fontSize: 16),
                  )),
                ],
              ),
            ),
          ),
          GridTile(
            child: Card(
              child: Column(
                children: <Widget>[
                  Expanded(
                      child: Marquee(
                          child: Container(
                              width: 1000,
                              child: Image.network(
                                "https://i.pinimg.com/564x/9d/a6/36/9da636b9e60ea40b18921b0053b7d486.jpg",
                                fit: BoxFit.fitWidth,
                              )))),
                  Marquee(
                      child: Text(
                    "Flutter is a free and open source Google mobile UI ",
                    style: TextStyle(fontSize: 16),
                  )),
                ],
              ),
            ),
          ),
          GridTile(
            child: Card(
              child: Column(
                children: <Widget>[
                  Marquee(
                      child: Container(width: 1000,
                        child: Column(
                    children: <Widget>[
                        Marquee(
                            child: Container(
                                width: 1000,height: 260,
                                child: Image.network(
                                  "https://cdn-images-1.medium.com/max/1000/1*upTyVPOfBb0c4o1r57C9_w.png",
                                  fit: BoxFit.fitWidth,
                                ))),
                        Text(
                          "Flutter is a free and open source Google mobile UI ",
                          style: TextStyle(fontSize: 16),
                        ),
                    ],
                  ),
                      )),
                ],
              ),
            ),
          ),
        ],
      ),
```


 
## Github主页 👉[yousifk/marquee_widget](http://github.com/yousifk/marquee_widget)