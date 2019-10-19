---
layout: post
title:  Spoiler widget for flutter
tag: [flutter代码库, Widgets]
date: 2019-10-19
---

 


## [立即下载 ️⬇️ ](https://codeload.github.com/Hecatoncheir/spoiler/zip/master) 


 
![](https://flutterawesome.com/content/images/2019/10/spoiler-3.jpg)
 
>
> Spoiler widget for flutter.
>

 
# Spoiler [![Actions Status](https://github.com/Hecatoncheir/spoiler/workflows/check/badge.svg)](https://github.com/Hecatoncheir/spoiler/actions)

Spoiler widget for flutter.


## HowTo:
```dart
child: Spoiler(
            openCurve: Curves.elasticOut,
            closeCurve: Curves.elasticIn,
            header: Text("Tools", style: TextStyle(color: Colors.white)),
            child: GameControl()
```

![Spoiler preview gif](https://raw.githubusercontent.com/Hecatoncheir/spoiler/master//preview/preview.gif)

## TODO:
 - [x] Custom header. 
 - [ ] Custom open header and custom close header.
 - [ ] On open callback with header height and child height arguments.
 - [ ] On close callback with header height and child height arguments.
 - [ ] Get only header height for spoiler in spoiler widgets.
 - [ ] Make Spoilers widget with calback that has all headers height and  all childs height.
 - [ ] Add `reverse` parameter for change order of header and child.
 - [ ] Add horizontal spoiler widget.

## Github主页 👉[Hecatoncheir/spoiler](http://github.com/Hecatoncheir/spoiler)