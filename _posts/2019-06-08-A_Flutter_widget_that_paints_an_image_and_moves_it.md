---
layout: post
title:  一个Flutter小部件，用于绘制图像并移动它
tag: Images
date: 2019-06-08
---

# [一个Flutter小部件，用于绘制图像并移动它 ](http://github.com/pulyaevskiy/parallax-image) 



## [查看Github/pulyaevskiy/parallax-image](http://github.com/pulyaevskiy/parallax-image)
## [立即下载 ️⬇️ ](https://codeload.github.com/pulyaevskiy/parallax-image/zip/master) 


 
![](https://flutterawesome.com/content/images/2018/09/parallax-imagae.gif)
 
>
> 一个Flutter小部件，它绘制图像并以比主滚动内容更慢的速度移动它。
>

 
A Flutter widget that paints an image and moves it at a slower speed than the 
main scrolling content.

![demo.gif](demo.gif)

## Installation

Add dependency to your `pubspec.yaml`:

```yaml
dependencies:
  parallax_image: [latest version]
```

## Usage

`ParallaxImage` can be used with any `Scrollable` (`ListView` for instance).
When created, it subscribes to scroll updates on nearest `Scrollable` ancestor.
It is also possible to specify custom `ScrollController` in which case this
widget subscribes to updates on `ScrollController.position` (assumes that
controller is attached to only one `Scrollable`).

```dart
class MyWidget extends StatefulWidget {
  @override
  MyWidgetState createState() => new MyWidgetState();
}

class MyWidgetState extends State<MyWidget> {
  final _controller = new ScrollController();

  @override
  Widget build(BuildContext context) {
    return new ListView(controller: _controller, children: [
      new ParallaxImage(
        image: new AssetImage('images/january.jpg'),
        // Extent of this widget in scroll direction.
        // In this case it is vertical scroll so extent defines
        // the height of this widget.
        // The image is scaled with BoxFit.fitWidth which makes it
        // occupy full width of this widget.
        // After image is scaled it should normally have height greater
        // than this value to allow for parallax effect to be
        // visible.
        extent: 100.0,
        // Optionally specify child widget.
        child: new Text('January'),
        // Optinally specify scroll controller.
        controller: _controller,
      ),
      // ...add more list items
    ]);
  }
}
```

See `example/` folder for a complete demo.

## Features and bugs

Please file feature requests and bugs at the [issue tracker][issue_tracker].

[issue_tracker]: https://github.com/pulyaevskiy/parallax-image/issues

