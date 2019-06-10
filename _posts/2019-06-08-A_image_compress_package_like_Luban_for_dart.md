---
layout: post
title:  像鲁班这样的图像压缩包用于飞镖
tag: Images
date: 2019-06-08
---

 


## [立即下载 ️⬇️ ](https://codeload.github.com/crazecoder/flutter_luban/zip/master) 
<p-6> 

 
![](https://flutterawesome.com/content/images/2019/02/flutter_luban.jpg)
 
>
> 像鲁班这样的图像压缩包用于飞镖。
>

 
# flutter_luban
[![pub package](https://img.shields.io/pub/v/flutter_luban.svg)](https://pub.dartlang.org/packages/flutter_luban)

A image compress package like [Luban](https://github.com/Curzibn/Luban) for dart base on [image](https://github.com/brendan-duncan/image).This library are no system platform constraints.

### Example
```dart
   CompressObject compressObject = CompressObject(
         imageFile:imageFile, //image
         path:tempDir.path, //compress to path
         quality: 85,//first compress quality, default 80
         step: 9,//compress quality step, The bigger the fast, Smaller is more accurate, default 6
         mode: CompressMode.LARGE2SMALL,//default AUTO
       );
    Luban.compressImage(compressObject).then((_path) {
        setState(() {
          print(_path);
        });
    });
```
![](https://github.com/crazecoder/flutter_luban/blob/62bae66c5d067db82117038c6bb8bac2d54e14f9/screenshot/test.png?raw=true)

## Github主页 👉[crazecoder/flutter_luban](http://github.com/crazecoder/flutter_luban)