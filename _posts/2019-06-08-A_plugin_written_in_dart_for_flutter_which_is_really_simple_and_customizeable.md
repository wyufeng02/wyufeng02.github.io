---
layout: post
title:  一个用飞镖写的插件，用于flutter，非常简单和可定制
tag: Counter
date: 2019-06-08
---

# [一个用飞镖写的插件，用于flutter，非常简单和可定制 ](http://github.com/salmaanahmed/flutterCounter) 



## [查看Github/salmaanahmed/flutterCounter](http://github.com/salmaanahmed/flutterCounter)
## [立即下载 ️⬇️ ](https://codeload.github.com/salmaanahmed/flutterCounter/zip/master) 


 
![](https://flutterawesome.com/content/images/2018/12/Flutter-Counter.jpg)
 
>
> Flutter Counter是一个用飞镖写的插件，用于flutter，非常简单和可定制。
>

 
# Flutter Counter (iOS & Android)

# Description
Flutter Counter is a plugin written in dart for flutter which is really simple and customizeable.
Create it like any other widget, add params according to your need and presto!
You have got the highly customizeable counter with callbacks.
Zero boilerplate!

<br>
<img height="400" src="https://github.com/salmaanahmed/flutterCounter/blob/master/screenshots/gif-counter-control.gif" />
<br>

# Getting Started
Create this widget as you do with other widgets
```dart
Counter(
  initialValue: _defaultValue,
  minValue: 0,
  maxValue: 10,
  step: 0.5,
  decimalPlaces: 1,
  onChanged: (value) { // get the latest value from here
    setState(() {
      _defaultValue = value;
    });
  },
),
```

# Constructor Options
There are some required values and other are for the customization
``` dart
  @required num initialValue    // default value
  @required this.minValue       // minimum value
  @required this.maxValue       // maximum value
  @required this.onChanged      // callback
  @required this.decimalPlaces  // decimal places you want to show the value of
  this.color                    // color of the buttons
  this.textStyle                // text style which displays the value
  this.step = 1                 // step you want to set to change value
  this.buttonSize = 25          // if you want to change size of button
```

Beautify your widget with provided customization. You can also change color and size of both buttons and text.
Very simple to implement and looks awesome. You can find more details in sample app.

# Contributions and Licence
```FlutterCounter``` is available under the MIT license. See the [LICENSE](https://github.com/salmaanahmed/SAExpandableButton/blob/master/LICENCE.txt) file for more info.

Pull requests are welcome! The best contributions will consist of substitutions or configurations for classes/methods known to block the main thread during a typical app lifecycle.

I would love to know if you are using Counter in your app, send an email to [Salmaan Ahmed](mailto:salmaan.ahmed@hotmail.com)

