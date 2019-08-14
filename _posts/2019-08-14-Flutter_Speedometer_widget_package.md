---
layout: post
title:  Flutter Speedometer widget package
tag: [flutter代码库, Widgets]
date: 2019-08-14
---

 


## [立即下载 ️⬇️ ](https://codeload.github.com/ltdangkhoa/Flutter-Speedometer/zip/master) 


 
![](https://flutterawesome.com/content/images/2019/08/flutter_speedometer.jpg)
 
>
> Flutter Speedometer widget package.
>

 
# flutter_speedometer

[Flutter](https://flutter.io) Speedometer widget package

![](https://raw.githubusercontent.com/ltdangkhoa/Flutter-Speedometer/master/flutter_speedometer_2.png)

### Getting Started

In order to use this package, do import
```dart
import 'package:flutter_speedometer/flutter_speedometer.dart';
```

Basic implementation can be done like below code:
```dart
import 'package:flutter/material.dart';
import 'package:flutter_speedometer/flutter_speedometer.dart';

void main() {
  runApp(
    Center(
      child: Speedometer(
        size: 250,
        minValue: 0,
        maxValue: 180,
        currentValue: 76,
        warningValue: 150,
        displayText: 'mph',
      ),
    ),
  );
}
```

### Example App
You can find more examples from [Example App](example)


### API
In this table, you can find all attributes provided by this package:

| Attribute           | Default value                     | Description |
| ------------------- | --------------------------------- | ----------- |
| size                | 200                               | Min value to be displayed   |
| minValue            | 0                                 | Min value to be displayed   |
| maxValue            | 100                               | Max value to be displayed   |
| currentValue        | 0                                 | Set the current value       |
| warningValue        | 80                                | Set the current value       |

### Objects
```dart
class Speedometer {

    final double size;
    final int minValue;
    final int maxValue;
    final int currentValue;
    final int warningValue;
    final Color backgroundColor;
    final Color meterColor;
    final Color warningColor;
    final Color kimColor;
    final TextStyle displayNumericStyle;
    final String displayText;
    final TextStyle displayTextStyle;
}
 ```


### Feedback

Feel free to [leave any feedback](https://github.com/ltdangkhoa/Flutter-Speedometer/issues) for helping support this package 🍻 

## Github主页 👉[ltdangkhoa/Flutter-Speedometer](http://github.com/ltdangkhoa/Flutter-Speedometer)