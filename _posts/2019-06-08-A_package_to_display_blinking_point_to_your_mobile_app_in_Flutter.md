---
layout: post
title:  用于在Flutter中向移动应用程序显示闪烁点的程序包
tag: Animation
date: 2019-06-08
---

# [用于在Flutter中向移动应用程序显示闪烁点的程序包 ](http://github.com/Aleadinglight/Flutter-Blinking-Point) 



## [查看Github/Aleadinglight/Flutter-Blinking-Point](http://github.com/Aleadinglight/Flutter-Blinking-Point)
## [立即下载 ️⬇️ ](https://codeload.github.com/Aleadinglight/Flutter-Blinking-Point/zip/master) 


 
![](https://flutterawesome.com/content/images/2018/11/Flutter-Blinking-Pointx.gif)
 
>
> 轻松为Flutter项目创建闪烁点。
>

 
# Blinking point

Easy way to create a blinking point for your Flutter project.

## Installation

Add this to your package's pubspec.yaml file:

```yaml
dependencies:
  blinking_point: ^1.0.0+6
```

## Usage

Import the file.

```dart
import 'package:blinking_point/blinking_point.dart';
```

Calling the point: 

```dart
new BlinkingPoint(
    xCoor: 100.0, // The x coordinate of the point
    yCoor: 500.0, // The y coordinate of the point
    pointColor: Colors.red, // The color of the point
    pointSize: 10.0, // The size of the point
);
```

## Demo

![Demo](https://raw.githubusercontent.com/Aleadinglight/Flutter-Blinking-Point/master/../master/blinking.gif)
