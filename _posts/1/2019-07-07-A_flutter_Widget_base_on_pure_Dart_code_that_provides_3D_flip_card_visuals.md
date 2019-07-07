---
layout: post
title:  基于纯Dart代码的flutter小工具，提供3D翻转卡视觉效果
tag: [flutter, Flip]
date: 2019-07-07
---

 


## [立即下载 ️⬇️ ](https://codeload.github.com/WosLovesLife/flutter_flip_view/zip/master) 


 
![](https://flutterawesome.com/content/images/2019/06/flipview_customlayoutx.gif)
 
>
> 这是一个基于纯Dart代码的flutterWidget，提供3D翻转卡视觉效果。
>

 
# flutter_flip_view

This is a flutter Widget base on pure Dart code that provides 3D flip card visuals.

![simplecard](https://raw.githubusercontent.com/WosLovesLife/flutter_flip_view/master/screenshots/flipview_simple_card.gif)

![customlayout](https://raw.githubusercontent.com/WosLovesLife/flutter_flip_view/master/screenshots/flipview_customlayout.gif)

# Get start
add package in your pubspec.yaml
```
dependencies:
   flutter_flip_view: ^latest_version
```

This is a simple usage
```
import 'package:flutter_flip_view/flutter_flip_view.dart';

FlipView(
  animationController: _curvedAnimation,
  front: Container(
    width: 300,
    height: 500,
    color: Colors.amber,
    alignment: Alignment.center,
    child: Text('Front'),
  ),
  back: Container(
    width: 300,
    height: 500,
    color: Colors.blueGrey,
    alignment: Alignment.center,
    child: Text('Back'),
  ),
)
```

You can get more usage case in [main.dart](example/lib/main.dart) and [custom_layout_example.dart](example/lib/custom_layout_example.dart)


## Getting Started

This project is a starting point for a Flutter
[plug-in package](https://flutter.io/developing-packages/),
a specialized package that includes platform-specific implementation code for
Android and/or iOS.

For help getting started with Flutter, view our 
[online documentation](https://flutter.io/docs), which offers tutorials, 
samples, guidance on mobile development, and a full API reference.

## Github主页 👉[WosLovesLife/flutter_flip_view](http://github.com/WosLovesLife/flutter_flip_view)