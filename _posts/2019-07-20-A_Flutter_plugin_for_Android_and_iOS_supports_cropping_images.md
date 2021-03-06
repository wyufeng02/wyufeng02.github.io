---
layout: post
title:  Image Cropper 图形裁剪插件
tag: [flutter代码库, Images, Cropper]
date: 2019-07-20
---

 


## [立即下载 ️⬇️ ](https://codeload.github.com/hnvn/flutter_image_cropper/zip/master) 


 
![](https://flutterawesome.com/content/images/2019/07/Image-Cropper.jpg)
 
# Image Cropper
适用于Android和iOS的Flutter插件支持裁剪图像

[![pub package](https://img.shields.io/pub/v/image_cropper.svg)](https://pub.dartlang.org/packages/image_cropper)

<p>
	<img src="https://github.com/hnvn/flutter_image_cropper/blob/master/screenshots/android.gif?raw=true" width="250" height="443"  />
	<img src="https://github.com/hnvn/flutter_image_cropper/blob/master/screenshots/ios.gif?raw=true" width="250" height="443" />
</p>

## Installation

### Android

- Add UCropActivity into your AndroidManifest.xml

````xml
<activity
    android:name="com.yalantis.ucrop.UCropActivity"
    android:screenOrientation="portrait"
    android:theme="@style/Theme.AppCompat.Light.NoActionBar"/>
````

### iOS
-无需配置

## 例子

````dart
Future<Null> _cropImage(File imageFile) async {
    File croppedFile = await ImageCropper.cropImage(
      sourcePath: imageFile.path,
      ratioX: 1.0,
      ratioY: 1.0,
      maxWidth: 512,
      maxHeight: 512,
    );
}
````

## 参考
This plugin is based on two native libraries:

- Android: [uCrop](https://github.com/Yalantis/uCrop) created by [Yalantis](https://github.com/Yalantis)
- iOS: [TOCropViewController](https://github.com/TimOliver/TOCropViewController) created by [Tim Oliver](https://twitter.com/TimOliverAU)
## Github主页 👉[hnvn/flutter_image_cropper](http://github.com/hnvn/flutter_image_cropper)