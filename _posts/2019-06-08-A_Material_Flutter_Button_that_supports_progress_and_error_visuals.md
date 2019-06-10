---
layout: post
title:  一个Material Flutter Button，支持进度和错误视觉效果
tag: Button, Progress, Material Design
date: 2019-06-08
---

 


## [立即下载 ️⬇️ ](https://codeload.github.com/halilozercan/ProgressButton/zip/master) 
<p-7> 

 
![](https://flutterawesome.com/content/images/2019/02/progress_button.jpg)
 
>
> 
>

 
# progress_button

A Material Flutter Button that supports progress and error visuals

## Getting Started

ProgressButton is designed to be easy to use and customizable. Without going into much detail, you can see a demo and example code below. What more do you need from a single class package??

- First, add dependency to your pubspec.yaml
```yaml
dependencies:
  progress_button: ^0.0.2
```

- Second, add progress button to your widget tree
```dart
val progressButton = ProgressButton(
    child: Text("Login"),
    onPressed: VoidCallback,
    buttonState: ButtonState.normal,
    backgroundColor: Theme.of(context).primaryColor,
    progressColor: Theme.of(context).primaryColor,
);
```

Of course you can change the buttonState anytime you want by using StreamBuilders and such. ProgressButton reacts accordingly to changes.

![Demo 1](/demo1.gif?raw=true)

![Demo 2](/demo2.gif?raw=true)
## Github主页 👉[halilozercan/ProgressButton](http://github.com/halilozercan/ProgressButton)