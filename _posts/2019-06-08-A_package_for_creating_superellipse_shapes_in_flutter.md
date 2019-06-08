---
layout: post
title:  用于在flutter中创建超椭圆形状的包
tag: Shapes
date: 2019-06-08
---

 

## [查看Github/Salby/superellipse_shape](http://github.com/Salby/superellipse_shape)
## [立即下载 ️⬇️ ](https://codeload.github.com/Salby/superellipse_shape/zip/master) 


 
![](https://flutterawesome.com/content/images/2019/01/Superellipse-Shape.jpg)
 
>
> 用于在flutter中创建超椭圆形状的包。
>

 
# Superellipse Shape

![Superellipses in flutter!](https://i.imgur.com/HbfbgBL.png)

A package for creating superellipse shapes in flutter.

```dart
class SuperellipseDemo extends StatelessWidget {

  @override
  Widget build(BuildContext context) {
    
    return Material(
      color: Colors.blueAccent[400],
      shape: SuperellipseShape(
        borderRadius: BorderRadius.circular(28.0),
      ), // SuperellipseShape
      child: Container(
        width: 100.0,
        height: 100.0,
      ), // Container
    ); // Material

  }

}
```

