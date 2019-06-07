---
layout: post
title:  用于使用相机读取QR码的Flutter插件
tag: QRCode
date: 2019-06-08
---

# [用于使用相机读取QR码的Flutter插件 ](http://github.com/bcko/flutter_qrcode_reader) 



## [查看Github/bcko/flutter_qrcode_reader](http://github.com/bcko/flutter_qrcode_reader)
## [立即下载 ️⬇️ ](https://codeload.github.com/bcko/flutter_qrcode_reader/zip/master) 


 
![](https://flutterawesome.com/content/images/2018/10/Flutter-qrcode-reader.jpg)
 
>
> Flutter的QR Code Reader插件。
>

 
# QRCode Reader plugin for Flutter

A Flutter plugin for reading QR Codes with the camera.

### Example

``` dart
import 'package:qrcode_reader/qrcode_reader.dart';
```

``` dart
Future<String> futureString = new QRCodeReader()
               .setAutoFocusIntervalInMs(200) // default 5000
               .setForceAutoFocus(true) // default false
               .setTorchEnabled(true) // default false
               .setHandlePermissions(true) // default true
               .setExecuteAfterPermissionGranted(true) // default true
               .setFrontCamera(false) // default false
               .scan();
```

These options are Android only (with the exception of setFrontCamera(bool)), this is the simplest way of plugin usage:
``` dart
Future<String> futureString = new QRCodeReader().scan();
```

