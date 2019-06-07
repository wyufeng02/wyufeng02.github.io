---
layout: post
title:  包提供了一种在Flutter项目中添加微光效果的简便方法
tag: Animation
date: 2019-06-08
---

# [包提供了一种在Flutter项目中添加微光效果的简便方法 ](http://github.com/hnvn/flutter_shimmer) 



## [查看Github/hnvn/flutter_shimmer](http://github.com/hnvn/flutter_shimmer)
## [立即下载 ️⬇️ ](https://codeload.github.com/hnvn/flutter_shimmer/zip/master) 


 
![](https://flutterawesome.com/content/images/2019/01/Shimmer.jpg)
 
>
> 包提供了一种在Flutter项目中添加微光效果的简便方法。
>

 
# Shimmer

[![pub package](https://img.shields.io/pub/v/shimmer.svg)](https://pub.dartlang.org/packages/shimmer) [![Build Status](https://travis-ci.org/hnvn/flutter_shimmer.svg?branch=master)](https://travis-ci.org/hnvn/flutter_shimmer)

A package provides an easy way to add shimmer effect in Flutter project

<p>
    <img src="https://github.com/hnvn/flutter_shimmer/blob/master/screenshots/loading_list.gif?raw=true"/>
    <img src="https://github.com/hnvn/flutter_shimmer/blob/master/screenshots/slide_to_unlock.gif?raw=true"/>
</p>

## How to use

```dart
import 'package:shimmer/shimmer.dart';

```

```dart
SizedBox(
  width: 200.0,
  height: 100.0,
  child: Shimmer.fromColors(
    baseColor: Colors.red,
    highlightColor: Colors.yellow,
    child: Text(
      'Shimmer',
      textAlign: TextAlign.center,
      style: TextStyle(
        fontSize: 40.0,
        fontWeight:
        FontWeight.bold,
      ),
    ),
  ),
);

```
