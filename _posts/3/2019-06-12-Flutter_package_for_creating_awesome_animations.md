---
layout: post
title:  动画 | flutter package
tag: [Animation]
date: 2019-06-12
---



## [立即下载 ️⬇️ ](https://codeload.github.com/felixblaschke/simple_animations/zip/master) 


 
![](https://flutterawesome.com/content/images/2019/05/hello-flutter.gif)
 
>
> 简单动画是Flutter的一个软件包，它通过简化创建动画的方式来提高动画效率。
>

 
# Simple Animations

[![Awesome Flutter](https://img.shields.io/badge/Awesome-Flutter-blue.svg?longCache=true&style=flat-square)](https://github.com/Solido/awesome-flutter)
[![Build status](https://dev.azure.com/felix0418/Simple%20Animations/_apis/build/status/CI%20Testing)](https://dev.azure.com/felix0418/Simple%20Animations/_build/latest?definitionId=1)
[![Pub](https://img.shields.io/pub/v/simple_animations.svg)](https://pub.dartlang.org/packages/simple_animations)

Simple Animations is a package for Flutter to boost your animation
productivity by simplifying the way to create animations.

## Project goal

Flutter拥有强大而灵活的动画功能基础。

但是，即使是小动画也会感觉**和**爆炸**你的代码库。
**动画**是Flutter最需要的**方面之一**
很难掌握。

**简单动画**的目标是解决这个问题

 -  **简化**创建**自定义动画**的方式，
 - 轻松地将开发人员放入动画主题中，
 - 提供大量**文档**和**示例**。
 - 
## Getting started

There are multiple ways to get started:

- [Dive into the documentation](https://github.com/felixblaschke/simple_animations/blob/master/documentation/README.md)
- [Try the Example App of *simple_animations*](https://github.com/felixblaschke/simple_animations_example_app)
- [Read articles and tutorials about using *simple_animations*](https://github.com/felixblaschke/simple_animations/blob/master/documentation/ARTICLES.md)

## Examples

### Typewriter Box


This custom animation seems simple but it's rather complex:

![hello-flutter-example](https://raw.githubusercontent.com/felixblaschke/simple_animations_documentation_assets/master/examples/hello-flutter.gif)

It's *combining* a **staggered animation sequence** with an **enduring animation**:

- *At the beginning* it animates the **height** of a box. After that it increases the **width**.
- *While increasing the width* a typewriter-like **animated underscore** appears and persists.
- *Shortly before the width reaches it's final size*, it starts to **type-write a text**.

*With traditional Flutter animation classes this will end in a huge 
StatefulWidget with multiple AnimationController, Tweens and all that 
initState and onDispose overhead.*

With **simple_animation** you can do it **stateless** just by using
some fancy **ControlledAnimation** widgets.

The whole animation just takes about **60 lines of code** while 
maintaining **readability**. *(You can find the [source code here](https://github.com/felixblaschke/simple_animations_example_app/blob/master/lib/examples/typewriter_box.dart). 
I only counted the lines that are responsible for the animation.)*


### Pub Example Tab

This is the example from the [example page (pub.dartlang.org)](https://pub.dartlang.org/packages/simple_animations#-example-tab-):

![pub-example-tab](https://raw.githubusercontent.com/felixblaschke/simple_animations_documentation_assets/master/examples/pub-example.gif)


### Example App

You find these and other examples in [Example App](https://github.com/felixblaschke/simple_animations_example_app).

![fancy-background](https://cdn-images-1.medium.com/max/1040/1*5H-XkZeZ1LW7nqH1leDshg.gif)

![fade-in](https://cdn-images-1.medium.com/max/1040/1*f9_TgZaAe24EalcD0qERwA.gif)
## Github主页 👉[felixblaschke/simple_animations](http://github.com/felixblaschke/simple_animations)