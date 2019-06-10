---
layout: post
title:  flutter日期范围选择器使用对话窗口在移动设备上选择日期范围
tag: Calendar, Picker, Dialog
date: 2019-06-08
---

 

## [查看Github/anicdh/date_range_picker](http://github.com/anicdh/date_range_picker)
## [立即下载 ️⬇️ ](https://codeload.github.com/anicdh/date_range_picker/zip/master) 


 
![](https://flutterawesome.com/content/images/2018/11/Date-Range-Picker.jpg)
 
>
> flutter日期范围选择器使用对话窗口在移动设备上选择日期范围。
>

 
<a href="https://stackoverflow.com/questions/tagged/flutter?sort=votes">
   <img alt="Awesome Flutter" src="https://img.shields.io/badge/Awesome-Flutter-blue.svg?longCache=true&style=flat-square"/>
</a> <a href="https://pub.dartlang.org/packages/date_range_picker"><img alt="pub version" src="https://img.shields.io/pub/v/date_range_picker.svg?style=flat-square"/></a>

# Date Range Picker

Flutter date range pickers use a dialog window to select a range of date on mobile.

## Demo

![](https://raw.githubusercontent.com/anicdh/date_range_picker/master/demo.gif)

## Getting Started

### Installation

Add to `pubspec.yaml` in `dependencies` 

```
  date_range_picker: ^1.0.5
```

### Usage
```
import 'package:date_range_picker/date_range_picker.dart' as DateRagePicker;
...
new MaterialButton(
    color: Colors.deepOrangeAccent,
    onPressed: () async {
      final List<DateTime> picked = await DateRagePicker.showDatePicker(
          context: context,
          initialFirstDate: new DateTime.now(),
          initialLastDate: (new DateTime.now()).add(new Duration(days: 7)),
          firstDate: new DateTime(2015),
          lastDate: new DateTime(2020)
      );
      if (picked != null && picked.length == 2) {
          print(picked);
      }
    },
    child: new Text("Pick date range")
)
```

