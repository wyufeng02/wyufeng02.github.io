---
layout: post
title:  一个Flutter包，用于通过模拟视图选择最后七个日期和时间
tag: Datepicker, Time, Picker
date: 2019-06-08
---

# [一个Flutter包，用于通过模拟视图选择最后七个日期和时间 ](http://github.com/Sheikhsoft/analog_time_picker) 



## [查看Github/Sheikhsoft/analog_time_picker](http://github.com/Sheikhsoft/analog_time_picker)
## [立即下载 ️⬇️ ](https://codeload.github.com/Sheikhsoft/analog_time_picker/zip/master) 


 
![](https://flutterawesome.com/content/images/2019/04/analog_time_picker.jpg)
 
>
> 适用于iOS和Android的Flutter软件包，可通过模拟视图选择最后七个日期和时间。
>

 
# analog_time_picker package for Flutter

[![pub package](https://img.shields.io/pub/v/analog_time_picker.svg)](https://pub.dartlang.org/packages/lanalog_time_picker)

A Flutter package for iOS and Android for picking last seven dates and time with analog view.
## Demo
<img src="http://sheikhsoft.com/screensort/analog_time_picker.gif" width="340" height="640" title="Screen Shoot"/>


## Installation

First, add `analog_time_picker` as a [dependency in your pubspec.yaml file](https://flutter.io/platform-plugins/).

### iOS

No configuration required - the plugin should work out of the box.

### Android

No configuration required - the plugin should work out of the box.

### Code for the analog day time picker

``` dart
import 'package:analog_time_picker/analog_time_picker.dart';


class AnalogDayPick extends StatelessWidget{
 Map<String, DateTime> _dateTime = new Map();
 
  @override
  Widget build(BuildContext context) {
    return AnalogTimePicker(
                           onChanged: getDayTime,
                         );
  }
 void getDayTime(Map value) {
     _dateTime = value;
   }
}
```

### Code for the Full page Analog day time picker widget

``` dart
import 'package:analog_time_picker/full_page_analog_time_picker.dart';

class FullPageClock extends StatelessWidget {
  final Map mapData;
  const FullPageClock({Key key, this.mapData}) : super(key: key);
  @override
  Widget build(BuildContext context) {
    return FullPageAnalogTimePicker(
      mapData: mapData,     
      route: "/sixth",
    );
  }
}
```
