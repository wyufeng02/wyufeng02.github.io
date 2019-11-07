---
layout: post
title: Flutter开发日记——Flutter动画&Motion Widget详解
tag: [widget]
date: 2019-11-07
---


本篇文章已授权微信公众号 `YYGeeker` 独家发布转载请标明出处

## AnimatedContainer

**1、简介**

* `AnimatedContainer`表示一个动画容器，只要更改容器的值，就能表现出对应的动画效果

**2、构造函数**

```java
AnimatedContainer({
    Key key,
    this.alignment,
    this.padding,
    Color color,
    Decoration decoration,
    this.foregroundDecoration,
    double width,
    double height,
    BoxConstraints constraints,
    this.margin,
    this.transform,
    this.child,
    Curve curve = Curves.linear,
    @required Duration duration,
})
```

* alignment
    * `alignment`表示子元素child相对于容器的对其方式
    * child在`AnimatedContainer`中默认位于居中位置
    * 用坐标表示`child`当前的aligament方式，则为(0,0)
    * 用坐标表示`AnimatedContainer`的四个顶点，则为(-1,-1)(-1,1)(1,-1)(1,1)
    * 通过`AlignmentDirectional`控制child在X、Y轴的偏移，
* padding：可以对子元素child进行内边距位置偏移
* color：容器的背景色，通过`decoration`也能设置背景色，两者不可共存
* decoration：容器的边框修饰，通过`color`也能设置背景色，两者不可共存
* foregroundDecoration：容器的前景边框修饰，在这里做边框修饰，则会挡住`decoration`或`color`的颜色
* width：容器的宽度
* height：容器的高度
* constraints：容器的大小约束，可以指定最小宽高和最大宽高，整个容器遵循这个约束
* margin：容器的外边距
* transform：容器的Matrix变换，可以进行矩阵的旋转，缩放，运算等操作
* child：子元素在容器中的位置默认是居中显示
* curve：容器的动画插值器
* duration：容器的动画时长

**3、例子**

通过定时器改变容器的大小，边框，边距等属性，让容器动起来

```dart
var time = 0;
var _color = Colors.red[200];
var _borderColor = Colors.transparent;
var _width = 200.0;
var _height = 200.0;
var _borderWidth = 0.0;
var _scaleX = 1.0;
var _scaleY = 1.0;
var _rotate = 0.0;
var _padding = 0.0;
var _margin = 0.0;
var _alignmentY = 0.0;

class WeWidgetState extends State<WeWidget> {
  WeWidgetState() {
    Timer.periodic(Duration(milliseconds: 1000), (timer) {
      setState(() {
        switch (time % 10) {
          case 0:
            _width = 300;
            _height = 100;
            break;
          case 1:
            _width = 100;
            _height = 300;
            _borderWidth = 4.0;
            _borderColor = Colors.brown[200];
            break;
          case 2:
            _borderWidth = 8.0;
            _borderColor = Colors.pink[200];
            _color = Colors.blue[200];
            break;
          case 3:
            _width = 300;
            _height = 300;
            _color = Colors.deepPurple[200];
            break;
          case 4:
            _scaleX = 0.2;
            _scaleY = 0.2;
            break;
          case 5:
            _scaleX = 0.5;
            _scaleY = 0.5;
            _rotate = math.pi / 6;
            break;
          case 6:
            _scaleX = 1.0;
            _scaleY = 1.0;
            _rotate = 0.0;
            _padding = 200.0;
            break;
          case 7:
            _padding = 0.0;
            break;
          case 8:
            _margin = 80.0;
            _alignmentY = 0.5;
            break;
          case 9:
            _margin = 0.0;
            _alignmentY = 0.0;
            break;
        }
        time++;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("day6"),
      ),
      resizeToAvoidBottomPadding: false,
      body: _buildColumn(),
    );
  }

  Widget _buildColumn() {
    return Column(
      children: <Widget>[
        AnimatedContainer(
          transform: Matrix4.identity().scaled(_scaleX, _scaleY)
            ..rotateZ(_rotate),
          alignment: AlignmentDirectional(0.0, _alignmentY),
          constraints: BoxConstraints(
            minWidth: 0.0,
            minHeight: 0.0,
            maxWidth: 500.0,
            maxHeight: 500.0,
          ),
          margin: EdgeInsets.only(left: _margin),
          padding: EdgeInsets.only(left: _padding),
          width: _width,
          height: _height,
          duration: Duration(milliseconds: 1000),
          curve: Curves.fastOutSlowIn,
          child: Icon(
            Icons.android,
            color: Colors.lightGreenAccent,
            size: 40,
          ),
          foregroundDecoration: BoxDecoration(
            border: Border.all(
              color: _borderColor,
              width: _borderWidth,
            ),
          ),
          //color 和 decoration两者不可共存
          //color: _color,
          decoration: BoxDecoration(
            color: _color,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: _color,
                offset: Offset(5.0, 5.0),
                blurRadius: 6.0,
              )
            ],
          ),
        ),
      ],
    );
  }
}
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/20191105190550672.gif)

## AnimatedCrossFade

**1、简介**

* `AnimatedCrossFade`存放着两个动画的容器，只要切换动画的状态，就能表现出对应的动画效果
* `AnimatedCrossFade`本质就是一个Stack分别存放有两个组件和两个动画

**2、构造函数**

```java
const AnimatedCrossFade({
    Key key,
    @required this.firstChild,
    @required this.secondChild,
    this.firstCurve = Curves.linear,
    this.secondCurve = Curves.linear,
    this.sizeCurve = Curves.linear,
    this.alignment = Alignment.topCenter,
    @required this.crossFadeState,
    @required this.duration,
    this.layoutBuilder = defaultLayoutBuilder,
}) 
```

* firstChild：第一个动画元素的控件
* secondChild：第二个动画元素的控件
* firstCurve：第一个动画元素的插值器
* secondCurve：第二个动画元素的插值器
* sizeCurve：动画切换时候的尺寸变化插值器
* alignment：动画在切换到第二个状态的时候，当前alignment的参数会应用在第二个动画元素中
* crossFadeState：动画当前的状态，当状态变化时，动画也会随之切换到对应的元素上
* duration：动画时长
* layoutBuilder：动画布局的构造器，可以构建两个动画元素之间的布局关系

**3、例子**

通过定时器更改变量的值，让控件切换布局，从而开启动画

```dart
var time = 0;
var _first = true;

class WeWidgetState extends State<WeWidget> {
  WeWidgetState() {
    Timer.periodic(Duration(seconds: 1), (timer) {
      setState(() {
        switch (time % 4) {
          case 0:
            _first = false;
            break;
          case 2:
            _first = true;
            break;
        }
        time++;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("day7"),
      ),
      body: _buildColumn(),
    );
  }

  Widget _buildColumn() {
    return Column(
      children: <Widget>[
        AnimatedCrossFade(
          //layoutBuilder: ,
          alignment: AlignmentDirectional(0.0, 1.0),
          duration: Duration(seconds: 1),
          firstCurve: Curves.fastOutSlowIn,
          secondCurve: Curves.fastOutSlowIn,
          sizeCurve: Curves.fastOutSlowIn,
          firstChild: FlutterLogo(
            style: FlutterLogoStyle.horizontal,
            size: 100.0,
          ),
          secondChild: FlutterLogo(
            style: FlutterLogoStyle.stacked,
            size: 200.0,
          ),
          crossFadeState:
              _first ? CrossFadeState.showFirst : CrossFadeState.showSecond,
        ),
      ],
    );
  }
}
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/20191105190600999.gif)

## Hero

**1、简介**

* Hero控件属于Android里的共享元素动画，它可以在不同的页面跳转时，复用同一个控件，且带有动画效果

**2、构造函数**

```java
const Hero({
    Key key,
    @required this.tag,
    this.createRectTween,
    this.flightShuttleBuilder,
    this.placeholderBuilder,
    this.transitionOnUserGestures = false,
    @required this.child,
})
```

* tag：共享元素的Tag
* createRectTween：定义目标从起点到终点的边界变化动画
* flightShuttleBuilder：自定义跳转时候运动轨迹动画的控件
* placeholderBuilder：自定义跳转时候的占位符
* transitionOnUserGestures：支持iOS的返回滑动手势
* child：子控件

**3、例子**

设置点击加号图标跳转到太阳图标的页面，在跳转的时候用相机快门图标做轨迹运动，同时会有加载占位符

```java
class WeWidgetState extends State<WeWidget> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("day8"),
      ),
      body: GestureDetector(
        child: _buildColumn(),
        onTap: () {
          _pushToNewPage();
        },
      ),
    );
  }

  Widget _buildColumn() {
    return Hero(
      tag: "mmm",
      transitionOnUserGestures: true,
      placeholderBuilder: (context, size, widget) {
        return CircularProgressIndicator();
      },
      flightShuttleBuilder: (flightContext, animation, flightDirection,
          fromHeroContext, toHeroContext) {
        return Icon(
          Icons.camera,
          size: 70.0,
        );
      },
      child: Icon(
        Icons.add,
        size: 70.0,
      ),
    );
  }

  void _pushToNewPage() {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (context) {
        return Scaffold(
            appBar: AppBar(
              title: Text('Hero'),
            ),
            body: Center(
              child: Hero(
                tag: "mmm",
                child: Icon(
                  Icons.wb_sunny,
                  size: 70.0,
                ),
              ),
            ));
      }),
    );
  }
}
```

## AnimatedBuilder

**1、简介**

* `AnimatedBuilder`表示一个动画的构造器，可以通过控制器去控制动画值改变，从而控制动画

**2、构造函数**

```java
AnimatedBuilder({
    Key key,
    Listenable animation,
    this.builder,
    this.child,
})
```

* animation：表示由外传递进来的动画属性值的变化
* builder：动画的控制器
* child：子控件

**3、例子**

我们可以将常用属性包装成一个控件

```java
class AnimatorTransition extends StatelessWidget {
  final Widget child;
  final Animation<num> animation;

  AnimatorTransition({this.child, this.animation});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: AnimatedBuilder(
        child: this.child,
        animation: animation,
        builder: (BuildContext context, Widget child) {
          return Container(
            height: animation.value,
            width: animation.value,
            child: child,
          );
        },
      ),
    );
  }
}
```

动画属性值的变化需要`AnimationController`来控制，通过`CurvedAnimation`设置其插值器，通过`Tween`设置其值的变化范围

```java
class WeWidgetState extends State<WeWidget>
    with SingleTickerProviderStateMixin {
    
  //尝试扩展或实现num时，除int或double之外的任何类型都是编译时错误
  Animation<num> _animation;
  AnimationController _controller;
  Animation _curve;

  @override
  void initState() {
    super.initState();

    //动画控制器
    _controller = AnimationController(
      duration: const Duration(milliseconds: 3000),
      vsync: this,
    );
    //动画插值器
    _curve = CurvedAnimation(parent: _controller, curve: Curves.fastOutSlowIn);
    //动画变化范围
    _animation = Tween(begin: 0.0, end: 300.0).animate(_curve);
    //启动动画
    _controller.forward();
  }
}
```

通过`addStatusListener`监听动画状态的变化和通过`addListener`监听动画值的变化

```java
class WeWidgetState extends State<WeWidget>
    with SingleTickerProviderStateMixin {
  //尝试扩展或实现num时，除int或double之外的任何类型都是编译时错误
  Animation<num> _animation;
  AnimationController _controller;
  Animation _curve;

  double _animationValue;
  AnimationStatus _state;

  @override
  void initState() {
    super.initState();

    //动画控制器
    _controller = AnimationController(
      duration: const Duration(milliseconds: 3000),
      vsync: this,
    );
    //动画插值器
    _curve = CurvedAnimation(parent: _controller, curve: Curves.fastOutSlowIn);
    //动画变化范围
    _animation = Tween(begin: 0.0, end: 300.0).animate(_curve)
      ..addListener(() {
        setState(() {
          //记录变化的值
          _animationValue = _animation.value;
        });
      })
      ..addStatusListener((AnimationStatus state) {
        //如果动画已完成，就反转动画
        if (state == AnimationStatus.completed) {
          _controller.reverse();
        } else if (state == AnimationStatus.dismissed) {
        //如果动画已经消失，则开始动画
          _controller.forward();
        }

        setState(() {
          _state = state;
        });
      });
    //启动动画
    _controller.forward();
  }
}
```

源代码

```java
class WeWidgetState extends State<WeWidget>
    with SingleTickerProviderStateMixin {
  //尝试扩展或实现num时，除int或double之外的任何类型都是编译时错误
  Animation<num> _animation;
  AnimationController _controller;
  Animation _curve;

  double _animationValue;
  AnimationStatus _state;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      duration: const Duration(milliseconds: 3000),
      vsync: this,
    );
    _curve = CurvedAnimation(parent: _controller, curve: Curves.fastOutSlowIn);
    _animation = Tween(begin: 0.0, end: 300.0).animate(_curve)
      ..addListener(() {
        setState(() {
          _animationValue = _animation.value;
        });
      })
      ..addStatusListener((AnimationStatus state) {
        if (state == AnimationStatus.completed) {
          _controller.reverse();
        } else if (state == AnimationStatus.dismissed) {
          _controller.forward();
        }

        setState(() {
          _state = state;
        });
      });
    _controller.forward();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("day10"),
      ),
      body: _buildColumn(),
    );
  }

  Widget _buildColumn() {
    return Column(
      children: <Widget>[
        AnimatorTransition(
          child: FlutterLogo(
            style: FlutterLogoStyle.horizontal,
          ),
          animation: _animation,
        ),
        Text("动画值：" + _animationValue.toString()),
        Text("动画状态：" + _state.toString()),
      ],
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}

class AnimatorTransition extends StatelessWidget {
  final Widget child;
  final Animation<num> animation;

  AnimatorTransition({this.child, this.animation});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: AnimatedBuilder(
        child: this.child,
        animation: animation,
        builder: (BuildContext context, Widget child) {
          return Container(
            height: animation.value,
            width: animation.value,
            child: child,
          );
        },
      ),
    );
  }
}
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/20191105190613330.gif)

## DecoratedBoxTransition

**1、简介**

* `DecoratedBoxTransition`表示一个边框动画，可以通过控制器去控制动画边框值的改变，从而控制动画边框

**2、构造函数**

```java
DecoratedBoxTransition({
    Key key,
    this.decoration,           
    this.position,             
    this.child,               
})
```

* decoration：动画属性值的变化，注意这里的类型是`Animation<Decoration>`
* position：动画的控制器
* child：子控件

**3、例子**

```java
class AnimatorTransition extends StatelessWidget {
  final Widget child;
  final Animation<Decoration> animation;

  AnimatorTransition({this.child, this.animation});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: DecoratedBoxTransition(
        position: DecorationPosition.background,
        decoration: animation,
        child: Container(
          child: this.child,
        ),
      ),
    );
  }
}
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/2019110519062947.gif)

## FadeTransition

**1、简介**

* `FadeTransition`表示一个透明度动画，可以通过控制器去控制动画透明度值的改变，从而控制动画的透明度

**2、构造函数**

```java
FadeTransition({
    Key key,
    this.opacity,
    this.alwaysIncludeSemantics,
    Widget child,
})
```

* opacity：动画属性值的变化，注意这里的类型是`Animation<num>`
* alwaysIncludeSemantics：是否包含子语义而不管不透明度
* child：子控件

**3、例子**

```java
class AnimatorTransition extends StatelessWidget {
  final Widget child;
  final Animation<num> animation;

  AnimatorTransition({this.child, this.animation});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: FadeTransition(
        //是否包含子语义而不管不透明度
        alwaysIncludeSemantics: false,
        opacity: animation,
        child: this.child,
      ),
    );
  }
}
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/20191105190637370.gif)

## PositionedTransition

**1、简介**

* `PositionedTransition`表示一个矩形位置的动画，可以通过控制器去控制动画矩形值的改变，从而控制动画的矩形位置

**2、构造函数**

```java
PositionedTransition({
    Key key,
    this.rect,
    Widget child,
})
```

* rect：动画属性值的变化，注意这里的类型是`Animation<RelativeRect>`
* child：子控件

**3、例子**

> 这里需要注意的是PositionedTransition的父控件必须是Stack

```java
class AnimatorTransition extends StatelessWidget {
  final Widget child;
  final Animation<RelativeRect> animation;

  AnimatorTransition({this.child, this.animation});

  @override
  Widget build(BuildContext context) {
    //绝对定位的动画实现, 需要Stack包裹
    return Stack(
      children: <Widget>[
        PositionedTransition(
          rect: animation,
          child: this.child,
        ),
      ],
    );
  }
}
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/20191105190649168.gif)

## RotationTransition

**1、简介**

* `RotationTransition`表示一个旋转动画，可以通过控制器去控制动画旋转值的改变，从而控制动画的旋转

**2、构造函数**

```java
RotationTransition({
    Key key,
    this.turns,
    this.alignment,
    Widget child,
})
```

* turns：动画旋转值的变化，注意这里的类型是`Animation<num>`
* alignment：旋转的锚定坐标
* child：子控件

**3、例子**

```java
class AnimatorTransition extends StatelessWidget {
  final Widget child;
  final Animation<num> animation;

  AnimatorTransition({this.child, this.animation});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: RotationTransition(
        //旋转的锚定坐标
        alignment: Alignment.center,
        turns: animation,
        child: this.child,
      ),
    );
  }
}
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/20191105190658243.gif)

## ScaleTransition

**1、简介**

* `ScaleTransition`表示一个缩放动画，可以通过控制器去控制动画缩放值的改变，从而控制动画的缩放

**2、构造函数**

```java
ScaleTransition({
    Key key,
    this.scale,
    this.alignment,
    Widget child,
})
```

* scale：动画属性值的变化，注意这里的类型是`Animation<num>`
* alignment：旋转的锚定坐标
* child：子控件

**3、例子**

```java
class AnimatorTransition extends StatelessWidget {
  final Widget child;
  final Animation<num> animation;

  AnimatorTransition({this.child, this.animation});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ScaleTransition(
        //缩放的锚定坐标
        alignment: Alignment.topLeft,
        scale: animation,
        child: this.child,
      ),
    );
  }
}
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/20191105190705801.gif)

## SizeTransition

**1、简介**

* `SizeTransition`表示一个尺寸动画，可以通过控制器去控制动画尺寸值的改变，从而控制动画的尺寸

**2、构造函数**

```java
SizeTransition({
    Key key,
    this.sizeFactor,
    this.axis,
    this.axisAlignment,
    Widget child,
})
```

* sizeFactor：动画属性值的变化，注意这里的类型是`Animation<num>`
* axis：表示动画出现的方式
    * Axis.vertical：垂直方向
    * Axis.horizontal：横轴方向
* axisAlignment：表示动画出现的原始位置偏移量，如果是在垂直方向指的是y，如果是横轴方向指的是x
* child：子控件

**3、例子**

```java
class AnimatorTransition extends StatelessWidget {
  final Widget child;
  final Animation<num> animation;
  final Axis axis;

  AnimatorTransition({this.child, this.animation, this.axis = Axis.vertical});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SizeTransition(
        axisAlignment: 2.0,
        axis: axis,
        sizeFactor: animation,
        child: this.child,
      ),
    );
  }
}
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/20191105190713365.gif)

## SlideTransition

**1、简介**

* `SlideTransition`表示一个平移动画，可以通过控制器去控制动画尺寸值的改变，从而控制动画的平移位置

**2、构造函数**

```java
SlideTransition({
    Key key,
    this.position,
    this.transformHitTests,
    this.textDirection,
    Widget child,
})
```

* position：动画属性值的变化，注意这里的类型是`Animation<Offset>`
* transformHitTests：表示点击事件是否落在动画后的控件上
* textDirection：表示动画执行的位置关系
    * TextDirection.rtl：左到右
    * TextDirection.ltr：右到左
* child：子控件

```java
class AnimatorTransition extends StatelessWidget {
  final Widget child;
  final Animation<Offset> animation;

  AnimatorTransition({this.child, this.animation});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SlideTransition(
        transformHitTests: true,
        textDirection: TextDirection.rtl,
        position: animation,
        child: this.child,
      ),
    );
  }
}
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/20191105190721646.gif)