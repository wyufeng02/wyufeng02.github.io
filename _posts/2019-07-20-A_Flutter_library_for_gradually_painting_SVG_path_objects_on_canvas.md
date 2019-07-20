---
layout: post
title:  绘图动画插件库
tag: [flutter代码库, SVG, Animation]
date: 2019-07-20
---

 


## [立即下载 ️⬇️ ](https://codeload.github.com/biocarl/drawing_animation/zip/master)


 
![](https://flutterawesome.com/content/images/2019/07/drawing_animation1.gif)
 
>
> 用于在画布上逐渐绘制SVG路径对象的Flutter库(绘制线动画)。
>

 
# drawing_animation [![Pub](https://img.shields.io/pub/v/drawing_animation.svg)](https://pub.dartlang.org/packages/drawing_animation)[![awesome](https://img.shields.io/badge/Awesome-Flutter-blue.svg?longCache=true&style=flat-square)](https://github.com/Solido/awesome-flutter)

|**From static SVG assets**  | | See more examples in the [showcasing app](https://github.com/biocarl/drawing_animation/tree/master/example/example_03). |
| :---             |     :---:                   |     :---:     |
| <img src="https://github.com/biocarl/img/raw/master/drawing_animation/art_egypt1.gif" width="400px"/> |<img src="https://github.com/biocarl/img/raw/master/drawing_animation/art_dino2.gif" width="400px"/> <br/> <img src="https://github.com/biocarl/img/raw/master/drawing_animation/art_order.gif" width="400px"/>   | <img src="https://github.com/biocarl/img/raw/master/drawing_animation/art_child7.gif" width="400px"/>      |
| **Dynamically created from Path objects which are animated over time** | |  |
| <img src="https://github.com/biocarl/img/raw/master/drawing_animation/met_dynamic_1.gif" width="400px"/> |*more coming soon*<br/>... | <img src="https://github.com/biocarl/img/raw/master/drawing_animation/loader_1.gif" width="400px"/>      |

渲染库公开了一个名为`AnimatedDrawing`的中央窗口小部件，它允许在类似时尚的图形中渲染SVG路径(通过`AnimatedDrawing.svg`)或Flutter Path对象(通过`AnimatedDrawing.paths`)。

##入门 -  AnimatedDrawing.svg
要开始使用`drawing_animation`包，您需要一个有效的Svg文件。
目前只支持没有转换的简单路径元素(参见[支持的SVG规范](https://github.com/biocarl/drawing_animation#supported-svg-specifications))



1. **添加依赖，在文件 `pubspec.yaml`**

```yaml
dependencies:
  drawing_animation: ^0.1.1

```

2. ** 添加 SVG 资源**
```yaml
assets:
  - assets/my_drawing.svg
```

**使用插件 **
   
可以通过两种方式启动AnimatedDrawing小部件:

例子 - 没有动画控制器(参见[Example_01](https://github.com/biocarl/drawing_animation/tree/master/example/example_01))
      默认情况下，每个动画都会无限重复。 仅在运行动画一次后，您可以使用回调在第一个动画循环完成后将`run`设置为false(请参阅字段`onFinish`)。
   
``` dart
        AnimatedDrawing.svg(
          "assets/my_drawing.svg",
          run: this.run,
          duration: new Duration(seconds: 3),
          onFinish: ()=> setState((){
            this.run  = false;
          }),
        )
```

带动画控制器(参见[Example_02](https://github.com/biocarl/drawing_animation/tree/master/example/example_02))

在大多数用例中，简化版本就足够了。 如果您希望进一步控制动画或者想要将其与其他现有动画同步，您可以考虑使用自定义[动画控制器](https://docs.flutter.io/flutter/animation/AnimationController-class.html):

  ```dart
  AnimatedDrawing.svg(
    "assets/test.svg",
    controller: this.controller,
  )
```
查看`examples`文件夹中的示例。 在使用调试模式时，似乎关闭了Paint/ Canvas的抗锯齿功能。 为了获得漂亮的结果，请使用`flutter run --release`。

## 入门 -  AnimatedDrawing.paths(仍在实验中)
通过将Path对象直接提供给窗口小部件，即使在动画期间，也可以动态更改元素。 每次状态更改时都会重建内部数据结构，因此如果`paths`中的元素数量非常高(见限制)，动画性能可能会受到影响。 不久将提供更多示例(现在请参阅 [Example_01](https://github.com/biocarl/drawing_animation/tree/master/example/example_01)and [Example_04](https://github.com/biocarl/drawing_animation/tree/master/example/example_04)).

```dart
  AnimatedDrawing.paths(
      [
     ///Path objects
      ],
      paints:[
     ///Paint objects (optional), specifies a [Paint] object for each [Path] element in `paths`.
      ],
      run: this.run,
      duration: new Duration(seconds: 3),
      onFinish: ()=> setState((){
        this.run  = false;
      }),
    )
  ```

**目前的限制:**

如上所述，对于窗口小部件的每个状态更改，都会重建路径对象的内部数据结构。 当提供的路径对象的数量很大并且定义了自定义`animationOrder`(触发对数据结构的排序操作)时，它可能导致滞后。 当通过另一个动画以60fps重建状态时(例如，在每帧处旋转路径对象)，这变得尤其明显。 关于如何优雅地解决这个问题的任何建议都非常受欢迎:-)

## 选项列表
这是越来越多的列表，包括所有可用参数及其视觉效果。

| Field            | Type                            | <pre> ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ </pre>Example<pre> ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ ‍ </pre> |
| :---             |    :---:                       |     :---:     |
| `lineAnimation` <br/><br/> *Specifies in which way the path elements are drawn to the canvas. When `allAtOnce` selected all path segments are drawn simultaneously. `oneByOne` paints every path segment one after another.* | `LineAnimation.oneByOne`        | <img src="https://github.com/biocarl/img/raw/master/drawing_animation/met_oneByOne.gif" width="200px"/>   |
|                                    | `LineAnimation.allAtOnce`       | <img src="https://github.com/biocarl/img/raw/master/drawing_animation/met_allAtOnce.gif" width="200px"/>  |
| `animationOrder` <br/><br/> *Denotes the order in which the path elements are drawn to canvas when `lineAnimation` is set to `LineAnimation.oneByOne`. When no `animationOrder` is specified it defaults to the same order specified in the Svg asset or path array (`PathOrder.original`).* | `PathOrders.original`           | <img src="https://github.com/biocarl/img/raw/master/drawing_animation/met_original.gif" width="200px"/>      |
|                                    | `PathOrders.bottomToTop`        | <img src="https://github.com/biocarl/img/raw/master/drawing_animation/met_bottomToTop.gif" width="200px"/>      |
|                                    | `PathOrders.decreasingLength`   | <img src="https://github.com/biocarl/img/raw/master/drawing_animation/met_decreasingLength.gif" width="200px"/>      |
|                                    | `PathOrders.increasingLength`   | <img src="https://github.com/biocarl/img/raw/master/drawing_animation/met_increasingLength.gif" width="200px"/>      |
|                                    | `PathOrders.leftToRight`        | <img src="https://github.com/biocarl/img/raw/master/drawing_animation/met_leftToRight.gif" width="200px"/>      |
|                                    | `PathOrders.rightToLeft`        | <img src="https://github.com/biocarl/img/raw/master/drawing_animation/met_rightToLeft.gif" width="200px"/>      |
|                                    | `PathOrders.topToBottom`        | <img src="https://github.com/biocarl/img/raw/master/drawing_animation/met_topToBottom.gif" width="200px"/>      |
| `animationCurve` <br/><br/> *Easing curves are used to adjust the rate of change of an animation over time, allowing them to speed up and slow down, rather than moving at a constant rate. See [Flutter docs](https://docs.flutter.io/flutter/animation/Curve-class.html).* | `Curves.linear`                 | <img src="https://github.com/biocarl/img/raw/master/drawing_animation/met_linear.gif" width="200px"/>       |
|                                    | `Curves.elasticOut`             | <img src="https://github.com/biocarl/img/raw/master/drawing_animation/met_elasticOut.gif" width="200px"/>       |
|                                    | `Curves.bounceInOut`            | <img src="https://github.com/biocarl/img/raw/master/drawing_animation/met_bounceInOut.gif" width="200px"/>       |
|                                    | `Curves.decelerate`             | <img src="https://github.com/biocarl/img/raw/master/drawing_animation/met_decelerate.gif" width="200px"/>       |
|                                    | **Other**            |     |
| `onFinish` <br/><br/> *Callback when one animation cycle is finished. By default every animation repeats infinitely.*|  | |
| `onPaint` <br/><br/> *Callback when a complete path is painted to the canvas. Returns with the relative index and the Path element itself.*|  | |
| `range` <br/><br/> *Start and stop a animation from a certain moment in time by defining a `AnimationRange` object.*|  | |
| `scaleToViewport` <br/><br/> *Path objects are scaled to the available viewport while maintaining the aspect ratio. Defaults to true.*|  | |

## 支持的SVG规范
     - 现在只支持路径元素(`<path d =“M3m1 ....”>`)。 我目前正在考虑添加[flutter_svg](https://pub.dartlang.org/packages/flutter_svg)作为更完整的SVG解析的依赖项。
     - 属性
      *笔画，现在只有没有alpha的Hex-Color
      *笔画宽度
      *风格，但只有上面的两个字段
     - 尚未支持转换。


## 如何使用自己的SVG文件？
许多工具可以将现有的SVG文件转换为[支持的格式](#supported-svg-specifications)。
例如使用Inkscape:
1.选择所有对象并取消组合，直到没有组为止(Ctrl + U)
2.将选择转换为路径:`Path >> Object to Path`并点击保存
3.然后使用[svgo](https://github.com/svg/svgo)或webversion [svgomg](https://jakearchibald.github.io/svgomg/)删除转换。
现在它应该工作，如果不是随便写一个问题！

## 例子:
    -  [`Example_01`](https://github.com/biocarl/drawing_animation/tree/master/example/example_01):使用AnimatedDrawing.svg和AnimatedDrawing.paths设置simplfied AnimatedDrawing
    -  [`Example_02`](https://github.com/biocarl/drawing_animation/tree/master/example/example_02):使用自定义动画控制器设置AnimatedDrawing
    -  [`Example_03`](https://github.com/biocarl/drawing_animation/tree/master/example/example_03):小型艺术展示应用程序，带有[旧书扫描]的矢量化图纸(https://www.flickr。 com/ photos/ britishlibrary)由大英图书馆提供
    -  [`Example_04`](https://github.com/biocarl/drawing_animation/tree/master/example/example_04):演示如何使用`debug`字段创建高分辨率的Gif。


## Todo

- 更好的测试覆盖率
- 改进SVG解析功能
    *圈子，矩形等
    *更好的色彩分析，包括。十六进制代码和RGB的阿尔法(A)
    *使用成熟的解析库将SVG解析逻辑替换为[flutter_svg](https://pub.dartlang.org/packages/flutter_svg)
- 提供一种覆盖`AnimatedDrawing.svg`的颜色/画笔等的方法 - 也许还可以覆盖`paint`对象？
- 定义[PathOrder]，它维护每个Path并仅相对于彼此进行排序
- 提高性能AnimatedDrawing.paths，对于每次重建，必须再次解析所有提供的路径。有没有办法检查路径对象是否相等，如小部件的键？想法:为Path实现一个代理，在命令被唤起时创建一个唯一的哈希
- 展示:以不同方式编写“drawing_animation”+ 3个cirlcles +为它添加颜色和一个gif并将其放在顶部
- 展示:使用L-Systems创建分形
-  AnimatedDrawing.paths:
    *提供某种固定边界框，因为路径和整个边界框可以动态改变(例如旋转圆形脉冲的大小)
    *也是自定义视口

## 学分

感谢[maxwellito](https://github.com/maxwellito)为他的[vivus项目](https://github.com/maxwellito/vivus)提供了这个库的初步灵感。也感谢[dnfield](https://github.com/dnfield)了解[path_parsing](https://github.com/dnfield/dart_path_parsing)库。

英国图书馆为他们用于[展示应用程序](https://github.com/biocarl/)的精彩[旧书扫描集](https://www.flickr.com/photos/britishlibrary)的信用额度drawing_animation/树/主/示例/ example_03)。

## Github主页 👉[biocarl/drawing_animation](http://github.com/biocarl/drawing_animation)