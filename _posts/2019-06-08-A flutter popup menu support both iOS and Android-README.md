---
layout: post
title:  A flutter popup menu support both iOS and Android
tag: Menu, Popup
date: 2019-06-08
---

# [A flutter popup menu support both iOS and Android](http://github.com/chinabrant/popup_menu) 

![](https://flutterawesome.com/content/images/2019/06/popup_menux.jpg)
 
> This project was writed with pure dart code，which means it's support both iOS and Android.

 
<img src="popupmenu.png" >

[![pub package](https://github.com/chinabrant/popup_menuhttps://img.shields.io/badge/pub-v1.0.1-blue.svg?raw=true)](https://pub.dev/packages/popup_menu)

This project was writed with pure dart code，which means it's support both iOS and Android.

# ScreenShot
<img src="https://github.com/chinabrant/popup_menu/blob/master/01.png" width="20%"><img src="https://github.com/chinabrant/popup_menu/blob/master/02.png" width="20%"><img src="https://github.com/chinabrant/popup_menu/blob/master/03.png" width="20%">

# How To Use


You can find the demo at the 'example' folder.

First, you should set the context at somewhere in you code. Like below:
```dart
PopupMenu.context = context;
```
```dart
PopupMenu menu = PopupMenu(
      items: [
        MenuItem(title: 'Copy', image: Image.asset('assets/copy.png')), 
        MenuItem(title: 'Home', image: Icon(Icons.home, color: Colors.white,)), 
        MenuItem(title: 'Mail', image: Icon(Icons.mail, color: Colors.white,)), 
        MenuItem(title: 'Power', image: Icon(Icons.power, color: Colors.white,)),
        MenuItem(title: 'Setting', image: Icon(Icons.settings, color: Colors.white,)), 
        MenuItem(title: 'Traffic', image: Icon(Icons.traffic, color: Colors.white,))], 
      onClickMenu: onClickMenu, 
      onDismiss: onDismiss);

menu.show(rect: rect);
```

or

```dart
PopupMenu menu = PopupMenu(
        // backgroundColor: Colors.teal,
        // lineColor: Colors.tealAccent,
        // maxColumn: 2,
        items: [
          MenuItem(title: 'Copy', image: Image.asset('assets/copy.png')),
          MenuItem(
              title: 'Home',
              // textStyle: TextStyle(fontSize: 10.0, color: Colors.tealAccent),
              image: Icon(
                Icons.home,
                color: Colors.white,
              )),
          MenuItem(
              title: 'Mail',
              image: Icon(
                Icons.mail,
                color: Colors.white,
              )),
          MenuItem(
              title: 'Power',
              image: Icon(
                Icons.power,
                color: Colors.white,
              )),
          MenuItem(
              title: 'Setting',
              image: Icon(
                Icons.settings,
                color: Colors.white,
              )),
          MenuItem(
              title: 'PopupMenu',
              image: Icon(
                Icons.menu,
                color: Colors.white,
              ))
        ],
        onClickMenu: onClickMenu,
        onDismiss: onDismiss);
    menu.show(widgetKey: btnKey2);
```

