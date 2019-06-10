---
layout: post
title:  用于跳转到系统设置的Flutter插件
tag: Miscellaneous
date: 2019-06-08
---

 

## [查看Github/Edward608/system_setting](http://github.com/Edward608/system_setting)
## [立即下载 ️⬇️ ](https://codeload.github.com/Edward608/system_setting/zip/master) 


 
![](https://flutterawesome.com/content/images/2018/11/system_setting.jpg)
 
>
> 用于跳转到系统设置的Flutter插件。
>

 
# system_setting

[![pub package](https://raw.githubusercontent.com/Edward608/system_setting/master/version_image.svg)](https://pub.dartlang.org/packages/system_setting)

A Flutter plugin for jumping to system settings. 

For Android, this plugin currently support jumping to WiFi, Bluetooth and App Notification setting. 
Other setting path will be added soon.

For iOS, this plugin only opens the app setting screen `Settings` application, as using url schemes to open inner setting path is a violation of Apple's regulations. 
Using url scheme to open settings can also leads to possible App Store rejection.

If you can find any workaround or enhancement, pull requests are always welcome.

## Usage

To use this plugin, add `system_setting` as a [dependency in your pubspec.yaml file](https://flutter.io/platform-plugins/).

For iOS, `SettingTarget` will not have any effect. It will always go to app setting.

### Example

```dart
import 'package:flutter/material.dart';
import 'packages:system_setting/system_setting.dart';

void main() => runApp(MaterialApp(
      home: Scaffold(
        body: Center(
          child: RaisedButton(
            onPressed: _jumpToSetting,
            child: Text('Goto setting'),
          ),
        ),
      ),
    ));

_jumpToSetting() {
  SystemSetting.goto(SettingTarget.WIFI);
}
```
