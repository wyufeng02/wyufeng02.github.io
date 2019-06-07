---
layout: post
title:  构建PageView的页面指示器
tag: Navigation, Swipe
date: 2019-06-08
---

# [构建PageView的页面指示器 ](http://github.com/leocavalcante/page_view_indicator) 



## [查看Github/leocavalcante/page_view_indicator](http://github.com/leocavalcante/page_view_indicator)
## [立即下载 ️⬇️ ](https://codeload.github.com/leocavalcante/page_view_indicator/zip/master) 


 
![](https://flutterawesome.com/content/images/2018/10/page_view_indicator.jpg)
 
>
> 为PageView构建指示标记。
>

 
# PageViewIndicator [![Pub Package](https://img.shields.io/pub/v/page_view_indicator.svg)](https://pub.dartlang.org/packages/page_view_indicator)
Builds indication marks for PageView.

## Import
```dart
import 'package:page_view_indicator/page_view_indicator.dart';
```

## Usage

### Default Material behavior
```dart
return PageViewIndicator(
  pageIndexNotifier: pageIndexNotifier,
  length: length,
  normalBuilder: (animationController, index) => Circle(
        size: 8.0,
        color: Colors.black87,
      ),
  highlightedBuilder: (animationController, index) => ScaleTransition(
        scale: CurvedAnimation(
          parent: animationController,
          curve: Curves.ease,
        ),
        child: Circle(
          size: 12.0,
          color: Colors.black45,
        ),
      ),
);
```
![Example 1](https://raw.githubusercontent.com/leocavalcante/page_view_indicator/master/example1.gif)

---

### Custom animations
```dart
return PageViewIndicator(
  pageIndexNotifier: pageIndexNotifier,
  length: length,
  normalBuilder: (animationController, index) => Circle(
        size: 8.0,
        color: Colors.black87,
      ),
  highlightedBuilder: (animationController, index) => ScaleTransition(
        scale: CurvedAnimation(
          parent: animationController,
          curve: Curves.ease,
        ),
        child: Circle(
          size: 8.0,
          color: Colors.white,
        ),
      ),
);
```
![Example 2](https://raw.githubusercontent.com/leocavalcante/page_view_indicator/master/example2.gif)

---

### Custom icons
It's not just about dots!
```dart
return PageViewIndicator(
  pageIndexNotifier: pageIndexNotifier,
  length: length,
  normalBuilder: (animationController, index) => ScaleTransition(
        scale: CurvedAnimation(
          parent: animationController,
          curve: Curves.ease,
        ),
        child: Icon(
          Icons.favorite,
          color: Colors.black87,
        ),
      ),
  highlightedBuilder: (animationController, index) => ScaleTransition(
        scale: CurvedAnimation(
          parent: animationController,
          curve: Curves.ease,
        ),
        child: Icon(
          Icons.star,
          color: Colors.white,
        ),
      ),
);
```
![Example 3](https://raw.githubusercontent.com/leocavalcante/page_view_indicator/master/example3.gif)

### Changing the space bettwen the indicators

You can change the padding around the indicators using the `indicatorPadding` property:

```dart
return PageViewIndicator(
  pageIndexNotifier: pageIndexNotifier,
  length: length,
  indicatorPadding: const EdgeInsets.all(4.0)
  ...
```

Default is `const EdgeInsets.all(8.0)`.

