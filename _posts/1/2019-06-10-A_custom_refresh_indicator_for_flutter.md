---
layout: post
title:  flutter的自定义刷新指示器
tag: [code4flutter,flutterAwesome , Refresh]
date: 2019-06-10
---

 


## [立即下载 ️⬇️ ](https://codeload.github.com/aagarwal1012/Liquid-Pull-To-Refresh/zip/master) 


 
![](https://flutterawesome.com/content/images/2019/06/Liquid-Pull-To-Refresh.jpg)
 
>
> 一个漂亮的自定义刷新指示器，提供Ramotion Pull Down to Refresh功能
>

 
<div align="center"><img src="https://github.com/aagarwal1012/Liquid-Pull-To-Refresh/blob/master/display/cover.png?raw=true"/></div>

# <div align="center">Liquid Pull To Refresh</div>
<div align="center"><p>A beautiful and custom refresh indicator for flutter highly inspired from <a href="https://dribbble.com/shots/1797373-Pull-Down-To-Refresh">Ramotion Pull Down to Refresh</a>.</p></div><br>

<div align="center">
	<a href="https://flutter.io">
    <img src="https://img.shields.io/badge/Platform-Flutter-yellow.svg"
      alt="Platform" />
  </a>
  	<a href="https://pub.dartlang.org/packages/liquid_pull_to_refresh">
    <img src="https://img.shields.io/pub/v/liquid_pull_to_refresh.svg"
      alt="Pub Package" />
  </a>
  	<a href="https://travis-ci.com/aagarwal1012/Liquid-Pull-To-Refresh">
    <img src="https://travis-ci.com/aagarwal1012/Liquid-Pull-To-Refresh.svg?token=pXLTRcXnVLpccbxqiWBi&branch=master"
      alt="Build Status" />
  </a>
  	<a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-red.svg"
      alt="License: MIT" />
  </a>
	
	
  </a>
  	<a href="https://www.paypal.me/aagarwal1012">
    <img src="https://img.shields.io/badge/Donate-PayPal-green.svg"
      alt="Donate" />
  </a>
</div><br>

# Table of contents

  * [Installing](#installing)
  * [Usage](#usage)
  * [Documentation](#documentation)
  * [Bugs or Requests](#bugs-or-requests)
  * [License](#license)

# Installing

### 1. Depend on it
Add this to your package's `pubspec.yaml` file:

```yaml
dependencies:
  liquid_pull_to_refresh: ^1.1.1
```

### 2. Install it

You can install packages from the command line:

with `pub`:

```css
$ pub get
```

with `Flutter`:

```css
$ flutter packages get
```

### 3. Import it

Now in your `Dart` code, you can use: 

```dart
import 'package:liquid_pull_to_refresh/liquid_pull_to_refresh.dart';
```


# Usage

要在flutter应用程序中添加此自定义刷新指示器，您只需将* ListView *或* GridView *包装在`LiquidPullToRefresh`中。 你还提供了`onRefresh`参数的值，这是一个刷新回调。

**注意 -  **`LiquidPullToRefresh`只能与垂直滚动视图一起使用。

例如：

```dart
LiquidPullToRefresh(
        key: _refreshIndicatorKey,	// key if you want to add
        onRefresh: _handleRefresh,	// refresh callback
        child: ListView(),		// scroll view
      );
```

如果你不想要children的不透明度转换，那么设置`showChildOpacityTransition：false`。 关于这个小部件的两种形式的预览如下： - 


<div align="center">
<table>
<thead>
<tr>
<th style="text-align:center"><code>showChildOpacityTransition: true</code></th>
<th style="text-align:center"><code>showChildOpacityTransition: false</code></th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:center"><img src="https://github.com/aagarwal1012/Liquid-Pull-To-Refresh/blob/master/display/liquid.gif?raw=true" height = "500px"/></td>
<td style="text-align:center"><img src="https://github.com/aagarwal1012/Liquid-Pull-To-Refresh/blob/master/display/liquid_false.gif?raw=true" height = "500px"/></td>
</tr>
</tbody>
</table>
</div>

# Documentation

### LiquidPullToRefresh Class

| Dart attribute                        | Datatype                    | Description                                                  |     Default Value     |
| :------------------------------------ | :-------------------------- | :----------------------------------------------------------- | :-------------------: |
| child                                 | ScrollView                  | The widget below this widget in the tree.                    |       @required       |
| onRefresh                             | RefreshCallback             | A function that's called when the refreshing of page takes place. |       @required       |
| height                                | double                      | The distance from the child's top or bottom edge to where the box will settle after the spring effect. |         100.0         |
| springAnimationDurationInMilliseconds | int                         | Duration in milliseconds of springy effect that occurs when we leave dragging after full drag. |         1000          |
| borderWidth                           | double                      | Border width of progressing circle in Progressing Indicator. |          2.0          |
| showChildOpacityTransition            | bool                        | Whether to show child opacity transition or not.             |         true          |
| color                                 | Color                       | The progress indicator's foreground color.                   | ThemeData.accentColor |
| backgroundColor                       | Color                       | The progress indicator's background color.                   | ThemeData.canvasColor |
| notificationPredicate                 | ScrollNotificationPredicate | A check that specifies whether a `ScrollNotification` should be handled by this widget. |         null          |
| scrollController                      | ScrollController            | Controls the `ScrollView` child.                             |         null          |

For help on editing package code, view the [flutter documentation](https://flutter.io/developing-packages/).

# Bugs or Requests

如果您遇到任何问题，请随意打开[issue]（https://github.com/aagarwal1012/Liquid-Pull-To-Refresh/issues/new?template=bug_report.md）。 

查阅 [Contributing.md](https://github.com/aagarwal1012/Liquid-Pull-To-Refresh/blob/master/CONTRIBUTING.md).
 

## Github主页 👉[aagarwal1012/Liquid-Pull-To-Refresh](http://github.com/aagarwal1012/Liquid-Pull-To-Refresh)