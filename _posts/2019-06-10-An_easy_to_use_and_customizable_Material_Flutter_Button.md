---
layout: post
title:  flutter可定制的进度按钮
tag: [code4flutter,flutterAwesome , Button, Progress, Material Design]
date: 2019-06-10
---



## [立即下载 ️⬇️ ](https://codeload.github.com/jiangyang5157/flutter_progress_button/zip/master) 


 
![](https://flutterawesome.com/content/images/2019/06/flutter_progress_button.jpg)
 
>
> flutter progress按钮是一个免费的开源（MIT许可证）Material Flutter Button，支持各种按钮样式需求。
>

 
# flutter_progress_button

![GitHub repo size](https://img.shields.io/github/repo-size/jiangyang5157/flutter_progress_button.svg)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/jiangyang5157/flutter_progress_button.svg)
![GitHub top language](https://img.shields.io/github/languages/top/jiangyang5157/flutter_progress_button.svg)
[![GitHub issues](https://img.shields.io/github/issues/jiangyang5157/flutter_progress_button.svg)](https://github.com/jiangyang5157/flutter_progress_button/issues)
[![GitHub license](https://img.shields.io/github/license/jiangyang5157/flutter_progress_button.svg)](https://github.com/jiangyang5157/flutter_progress_button/blob/master/LICENSE)

 
<img src="https://github.com/jiangyang5157/flutter_progress_button/blob/master/example/assets/example.gif?raw=true" width="600"/>


## 开始

### **这里添加依赖**

Add this to your package's pubspec.yaml file:

```yaml
flutter_progress_button: '^0.6.4'
```

### **Install it**

You can install packages from the command line:

```
$ flutter pub get
```

Alternatively, your editor might support flutter pub get.

### **Import it**

Now in your Dart code, you can use:

```dart
import 'package:flutter_progress_button/flutter_progress_button.dart';

```

## How to use

Add `ProgressButton` to your widget tree:

```dart
ProgressButton(
    normalWidget: const Text('I am a button'),
    progressWidget: const CircularProgressIndicator(),
    width: 196,
    height: 40,
    onPressed: () async {
        int score = await Future.delayed(
            const Duration(milliseconds: 3000), () => 42);
        // After [onPressed], it will trigger animation running backwards, from end to beginning
        return () {
        // Optional returns is returning a VoidCallback that will be called
        // after the animation is stopped at the beginning.
        // A best practice would be to do time-consuming task in [onPressed],
        // and do page navigation in the returned VoidCallback.
        // So that user won't missed out the reverse animation.
        };
    },
),
```

## 资源

可以在git中找到此库的源代码和示例：

```
$ git clone https://github.com/jiangyang5157/flutter_progress_button.git
```

## Github主页 👉[jiangyang5157/flutter_progress_button](http://github.com/jiangyang5157/flutter_progress_button)