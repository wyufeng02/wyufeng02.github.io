---
layout: post
title:  基于Google Docs颜色选择器的Flutter颜色选择器
tag: Color, Material Design
date: 2019-06-08
---

# [基于Google Docs颜色选择器的Flutter颜色选择器 ](http://github.com/long1eu/material_pickers) 



## [查看Github/long1eu/material_pickers](http://github.com/long1eu/material_pickers)
## [立即下载 ️⬇️ ](https://codeload.github.com/long1eu/material_pickers/zip/master) 


 
![](https://flutterawesome.com/content/images/2018/09/Material-ColorPicker.png)
 
>
> Flutter的颜色选择器，基于Google Docs颜色选择器。
>

 
# Material ColorPicker

Color picker for Flutter, based on the Google Docs color picker.

![alt text](https://raw.githubusercontent.com/long1eu/material_color_picker/master/res/extras/demo.png)

## Getting Started

You can embed into your material app or use it on a Dialog like this:

    Future<Color> askedToLead() async => await showDialog(
        context: context,
        child: new SimpleDialog(
          title: const Text('Select color'),
          children: <Widget>[
            new ColorPicker(
              type: MaterialType.transparency,
              onColor: (color) {
                Navigator.pop(context, color);
              },
              currentColor: startColor,
            ),
          ],
        ),
      );

For help getting started with Flutter, view our online [documentation](http://flutter.io/).

