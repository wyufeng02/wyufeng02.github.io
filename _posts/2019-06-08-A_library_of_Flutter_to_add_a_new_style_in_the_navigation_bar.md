---
layout: post
title:  Flutter库可在导航栏中添加新样式
tag: Navigation
date: 2019-06-08
---

 


## [立即下载 ️⬇️ ](https://codeload.github.com/TioCoding/flutter_navigation_dot_bar/zip/master) 


 
![](https://flutterawesome.com/content/images/2018/12/Navigation-Dot-Bar.jpg)
 
>
> 一个Flutter库，它添加了一个具有更好风格的BottomNavigationBar。
>

 
# Navigation Dot Bar

Una libreria de Flutter, el cual agrega un BottomNavigationBar con un mejor estilo. Inspirada en la aplicacion "Reflectly"

![20181111_230822](https://user-images.githubusercontent.com/22163898/48326755-02bf8480-e609-11e8-8825-b81750ea9dfc.gif)

## Como usarlo

Agregue la dependencia a su proyecto, editando el archivo pubspec.yaml.

````
  dependencies:
    navigation_dot_bar: ^0.1.3
````
Importar la libreria a tu proyecto:
````
import 'package:navigation_dot_bar/navigation_dot_bar.dart';
````
Usalo de manera sencilla con BottomNavigationDotBar:
````dart
Scaffold(
  appBar: AppBar( title: Text("Demo Bottom Navigation Bar")),
  body: Container(),
  bottomNavigationBar: BottomNavigationDotBar ( // Usar -> "BottomNavigationDotBar"
      items: <BottomNavigationDotBarItem>[
        BottomNavigationDotBarItem(icon: Icons.map, onTap: () { /* Cualquier funcion - [abrir nueva venta] */ }),
        BottomNavigationDotBarItem(icon: Icons.alarm_add, onTap: () { /* Cualquier funcion - [abrir nueva venta] */ }),
        BottomNavigationDotBarItem(icon: Icons.timer, onTap: () { /* Cualquier funcion - [abrir nueva venta] */ }),
        ...
        ..
        .
      ]
  ),
)
````

## Github主页 👉[TioCoding/flutter_navigation_dot_bar](http://github.com/TioCoding/flutter_navigation_dot_bar)