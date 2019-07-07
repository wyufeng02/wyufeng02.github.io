---
layout: post
title:  调试抽屉菜单 
tag: [Drawer, Dev Tools]
date: 2019-06-12
---

 


## [立即下载 ️⬇️ ](https://codeload.github.com/sergiandreplace/flutter_debug_drawer/zip/master) 


 
![](https://flutterawesome.com/content/images/2019/04/flutter_debug_drawerx.jpg)
 
>
> 调试抽屉菜单，以便更好地开发。
>

 
# flutter_debug_drawer

A debug drawer menu for better development. This is an initial release with very few functionalities.

This project is heavily inspired on a similar project for Android (https://github.com/palaima/DebugDrawer)

<img src="https://raw.githubusercontent.com/sergiandreplace/flutter_debug_drawer/master/readme/screenshot.jpg" alt="Screenshot" width="400"/>


## Getting Started

Include the last version of the library in your `pubspec.yaml`:

```
    dependencies:
        flutter_debug_drawer: 0.1.1+1
```

Now, you can customize your debug drawer adding it to your main application object:

```
class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter debug drawer demo',
      builder: DebugDrawerBuilder.build(modules: [
        PlatformModule(),
        MediaQueryModule(),
      ]),
      home: MyHomePage(),
    );
  }
}
```

Right now, only PlatformModule and MediaQueryModule are availables. More will come soon.


## Github主页 👉[sergiandreplace/flutter_debug_drawer](http://github.com/sergiandreplace/flutter_debug_drawer)