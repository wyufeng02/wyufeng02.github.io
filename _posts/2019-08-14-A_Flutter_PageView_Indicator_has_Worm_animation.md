---
layout: post
title:  A Flutter PageView Indicator has Worm animation
tag: [flutter代码库, Animation, Swipe]
date: 2019-08-14
---

 


## [立即下载 ️⬇️ ](https://codeload.github.com/phuchuynhStrong/worm_indicator/zip/master) 


 
![](https://flutterawesome.com/content/images/2019/08/worm_indicator.jpg)
 
>
> A pageview indicator.
>

 
# Worm Indicator

A Flutter PageView indicator insprired by worm animation. It can be easily integrated with any Flutter PageView. Pull requests are welcome

## Features

- Use with PageView to display scroll progress

## Getting Started

Make sure you add the lib dependency in your flutter project.

```
dependencies:
  worm_indicator: 0.2.0
```

Then you should run `flutter packages get` to update your packages in your IDE.

## Example Project

Checkout the project inside `example` folder.

Screenshot:

![screenshot](https://github.com/phuchuynhStrong/worm_indicator/raw/master/example.gif "Screenshots")

## Usage

`Circle` and `Square` `DotShape` need size. `Rectangle` `DotShape` need width and height.

```
WormIndicator(
  length: 3,
  controller: _controller,
  shape: Shape(
    size: 16,
    spacing: 8,
    shape: DotShape.Circle  // Similar for Square
  ),
),
```

```
WormIndicator(
  length: 3,
  controller: _controller,
  shape: Shape(
    width: 16,
    height: 24,
    spacing: 8,
    shape: DotShape.Rectangle
  ),
),
```

Properties:

|Name|Usage|Type|
|---|---|---|
|`length`| Number of dots |`int`|
|`controller`| PageView controller |`PageController`|
|`shape`| Shape of dots |`Shape`|
|`color`| Color of normal dots |`Color`|
|`indicatorColor`| Color of current active dot |`Color`|

Shape Constructor:

|Name|Usage|Type|
|---|---|---|
|`width`| Width of dot (required if shape is Rectange)|`double`|
|`height`| Height of dot (required if shape is Rectange)|`double`|
|`size`| Size of dot (required if shape is Circle or Square)|`double`|
|`spacing`| Spacing between dots |`double`|
|`shape`| Shape of dots. One of Circle, Rectangle and Square |`DotShape`|

## Support

Email me at `phuchuynh.strong@gmail.com` for any support needed

## Github主页 👉[phuchuynhStrong/worm_indicator](http://github.com/phuchuynhStrong/worm_indicator)