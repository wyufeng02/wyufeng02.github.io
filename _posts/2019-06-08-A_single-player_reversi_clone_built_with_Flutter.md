---
layout: post
title:  使用Flutter构建的单人双向反转克隆
tag: Games
date: 2019-06-08
---

 

## [查看Github/RedBrogdon/flutterflip](http://github.com/RedBrogdon/flutterflip)
## [立即下载 ️⬇️ ](https://codeload.github.com/RedBrogdon/flutterflip/zip/master) 


 
![](https://flutterawesome.com/content/images/2018/10/flutterflip.jpg)
 
>
> flutter翻译的公共回购，一个用Flutter构建的反转克隆。
>

 
# flutterflip

A single-player reversi clone built with [Flutter](https://flutter.io),
which compiles for both Android and iOS. The user plays as black, and
the CPU will make moves as white in response. The move search only goes
4-5 plies ahead, so it's not that sophisticated, but puts up a
reasonable fight.

![Screenshot](https://i.imgur.com/A96Hdcr.png)

## Why this exists

This was written as an exercise to help me ramp up on Flutter, and it's
intended to be an open source example. The tech used includes:

* [Streams](https://www.dartlang.org/tutorials/language/streams)!
* Dart [Isolates](https://api.dartlang.org/stable/1.24.3/dart-isolate/dart-isolate-library.html)
* Implicit animations like [AnimatedOpacity](https://docs.flutter.io/flutter/widgets/AnimatedOpacity-class.html)
  and [AnimatedContainer](https://docs.flutter.io/flutter/widgets/AnimatedContainer-class.html).

If you spot a bug, feel free to file an issue report. I haven't tested
this on very many screen sizes, so it's likely to break on small
devices.
