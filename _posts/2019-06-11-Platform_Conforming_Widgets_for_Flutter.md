---
layout: post
title:  flutter平台常用插件
tag: [Widgets]
date: 2019-06-11
---

 


## [立即下载 ️⬇️ ](https://codeload.github.com/fuzz-productions/platty/zip/master) 


 
![](https://flutterawesome.com/content/images/2019/05/alert_page.jpg)
 
>
> Flutter不会尝试为特定平台提供熟悉的插件（与React Native，和其他跨平台工具不同）。
>

 
# platty

flutter的平台插件

Flutter不会尝试为特定平台提供熟悉的小部件（与React Native，离子和其他跨平台工具不同）。
这对于在所有平台上进行统一渲染，最大限度地提高灵活性以及消除一整类错误和完成的测试具有巨大的好处
每个平台。 虽然这很棒，但很多场景我们都希望我们的应用看起来像Android或iOS应用。
Platty允许您以最小的努力和最大程度的控制来呈现iOS（Cupertino）和Android（Material）之类的小部件
API。

不再需要检查渲染块内的平台来渲染`CupertinoButton`或`FlatButton`，让`platty`为你做逻辑！
想要在您的应用中使用解析为特定于平台的UI的底部标签吗？ 没问题！


## Widgets

List of Widget Files:

[Alerts](/lib/src/widgets/alert.dart)

[Back Button](/lib/src/widgets/back_button.dart)

[Buttons](/lib/src/widgets/button.dart)

[Navigation Bars](/lib/src/widgets/navigation_bar.dart)

[Progress](/lib/src/widgets/progress.dart)

[Routing](/lib/src/widgets/routing.dart)

[Scaffold](/lib/src/widgets/scaffold.dart)

[Slider](/lib/src/widgets/slider.dart)

[Switch](/lib/src/widgets/switches.dart)

[TabView](/lib/src/widgets/tabs.dart)


## Getting Started

Use platty to unify render-specific APIs for you. The library utilizes the `BuildContext` theming APIs to propagate platform 
information into the Widgets.

By default, all widgets conform to the default `TargetPlatform`. It looks up the `Theme.of(context).platform` for its default.
Also, all widgets provide a `renderPlatform` prop that allows you to choose which one to render (if you wish).

Replace `MaterialApp` and `CupertinoApp` with `PlatformApp`:

```dart

class MyApp extends StatelessWidget {
  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return PlatformApp(
      title: 'Flutter Demo',
      // specify our app theme here. We do the leg work of bridging it to Cupertino.
      unifiedTheme: ThemeData(
            primarySwatch: Colors.lightBlue,
            bottomAppBarColor: Colors.red,
          ),
      home: ExamplePage(),
    );
  }
}

```

`PlatformApp` unifies all of the same properties between `MaterialApp` and `CupertinoApp` to allow both instances of widgets in the hiearchy and 
switching styling based on platform.

Now you replace widgets that are included in this library with their "P" counterparts:

`Button`/`CupertinoButton` -> `PButton`

![Material Raised Button](https://raw.githubusercontent.com/fuzz-productions/platty/master//screenshots/materialbutton.png)
![Cupertino Button](https://raw.githubusercontent.com/fuzz-productions/platty/master//screenshots/cupertinobutton.png)

[Source](/example/lib/button_page.dart)

`FlatButton`/`CupertinoButton` -> `PFlatButton`

![Material Flat Button](https://raw.githubusercontent.com/fuzz-productions/platty/master//screenshots/androidflat.png)
![Cupertino Flat Button](https://raw.githubusercontent.com/fuzz-productions/platty/master//screenshots/iosflat.png)

[Source](/example/lib/button_page.dart)

`AppBar`/`CupertinoNavigationBar` -> `PNavigationBar`

![Android Nav](https://raw.githubusercontent.com/fuzz-productions/platty/master//screenshots/androidnav.png)
![iOS Nav](https://raw.githubusercontent.com/fuzz-productions/platty/master//screenshots/iosnav.png)

[Source](/example/lib/navigation_bar_page.dart)

`SliverAppBar`/`CupertinoSliverNavigationBar` -> `PSliverNavigationBar`

`Slider`/`CupertinoSlider` -> `PSlider`

![Sliders](https://raw.githubusercontent.com/fuzz-productions/platty/master//screenshots/sliders.png)

[Source](/example/lib/sliders_page.dart)

`Switch`/`CupertinoSwitch` -> `PSwitch`

![Switch](https://raw.githubusercontent.com/fuzz-productions/platty/master//screenshots/switches.png)

[Source](/example/lib/switches_page.dart)

`BottomNavigationBar`/`CupertinoTabBar` -> `PTabBar`

![Bottom Navigation Android](https://raw.githubusercontent.com/fuzz-productions/platty/master//screenshots/androidtabs.png)
![Bottom Navigation iOS](https://raw.githubusercontent.com/fuzz-productions/platty/master//screenshots/iostabs.png)

[Source](/example/lib/tabs_page.dart)

`Scaffold`/`CupertinoScaffold` -> `PScaffold`

`CircularProgressIndicator`/`CupertinoActivityIndicator` -> `PActivityIndicator`

![Progress](https://raw.githubusercontent.com/fuzz-productions/platty/master//screenshots/progress.png)

[Source](/example/lib/progress_page.dart)

`BackButton`/`CupertinoNavigationBarBackButton` -> `PBackButton`

`AlertDialog`/`CupertinoAlertDialog` -> `PAlertDialog`

![Android Alert](https://raw.githubusercontent.com/fuzz-productions/platty/master//screenshots/androidalert.png)
![Ios Alert](https://raw.githubusercontent.com/fuzz-productions/platty/master//screenshots/iosalert.png)

[Source](/example/lib/alert_page.dart)

### Properties Specific to a platform have a prefix
Any widgets that have ios-only or android-only counterparts, they are prefixed to `android`/`ios` accordingly:

For example `PButton`, `androidShape` applies to `RaisedButton.shape` property. It does not exist on a `CupertinoButton`. 
However `CupertinoButton` has a `borderRadius` and `pressedOpacity`. Those two props become `iosBorderRadius` and `iosPressedOpacity`.

## Helpers

This library bundles a few standard functions to easily return code that is unique for each platform. Instead of checking  
and switching on the result of `Theme.of(context).targetPlatform`, utilize the following methods:

### Specific Platform Instance

To have a specific `P`-Widget utilize a specific platform theme only, such as Material or Cupertino, you can wrap
it in a `PTheme` instance:

```dart
PTheme(
  data: PThemeData(
    platform: TargetPlatform.android,  // or iOS
    child: child,
  ),
);
```

Or, more simply, utilize helper method:
```dart
PTheme.ios(child);
PTheme.android(child);
```


Also, all `P`-widgets and methods allow you to override the `PTheme` with a `renderPlatform` parameter in their constructor 
or calling method:
```dart
PButton("Hello Android", 
  renderPlatform: TargetPlatform.Android,
)
```
This will swap the rendering over to `Material` widgets for this specific widget.

__Note__: Wrapping a widget with the `PTheme` will propagate that instance down the widget hierarchy and is thus preferred than 
manually specifying the `renderPlatform` for each individual widget. 

### Creating Your Own Platform-Adapting Widgets

We can extend upon the logic included in this library to build our own, powerful platform-adapting widgets.
Included in the library is the `PlatformAdaptingWidget` base class, which inherits from `StatelessWidget`.


```dart
class SamplePlatformWidget extends PlatformAdaptingWidget {
  final Color color;

  SamplePlatformWidget({Key key, @required this.color, TargetPlatform renderPlatform}) // should allow consumers to choose TargetPlatform
      : super(key: key, renderPlatform: renderPlatform);

  /// Render a material widget here. Most Material widgets require a Material Theme instance above it.
  @override
  get renderMaterial => (BuildContext context) {
        return BackButton(
          color: color,
        );
      };

  /// Render a cupertino widget here.
  @override
  get renderCupertino => (BuildContext context) {
        return CupertinoNavigationBarBackButton(
          color: color,
        );
      };
  
  /// Render a fuchsia widget here. (defaults to material)
    @override
    get renderFuchsia => (BuildContext context) {
          return BackButton(
            color: color,
          );
        };
}
```

### Platform-specific logic

This library comes with a few standard ways to implement behavior based on platform.
You can utilize `platformWrap`, which allows you to specify a `child`, and on 1 or all platforms, wrap it 
with another widget:

```dart
platformWrap(
      context,
      child: PButton(
        padding: EdgeInsets.all(0.0),
        child: Text(title),
        color: Colors.red,
        onPressed: () {
          Navigator.push(context, PlatformRoute.of(context, builder: page));
        },
      ),
      renderCupertino: (context, child) => Padding(
            padding: EdgeInsets.only(bottom: 8.0),
            child: child,
          ),
    );
```
You can specify any of `renderCupertino`, `renderMaterial`, or `renderFuschia` (or none). 
Any render methods not specified default to the `child`.

Also, `platformSelect` is a helper that enables returning different objects based on platform in a unified way.
In our `PlatformAdaptingWidget`, we utilize it to return a different widget based on platform. You can use it to return any 
return type based on platform:
```dart

Column(
  children: [
    platformSelect(context, 
      renderMaterial: (context) => Text("I am android"),
      renderCupertino: (context) => Text("I am iOS"),
      renderFuchsia: (context) => Text("I am FUCHSIA")) 
  ],
),

```

`renderMaterial` and `renderCupertino` are required. `renderFuchsia` defaults to material.

or you can return a non-widget too:
```dart
Column(
  children: [
    Text(platformSelect(context, 
      renderMaterial: (context) => "I am android"),
      renderCupertino: (context) => "I am iOS",
      renderFuchsia: (context) => "I am FUCHSIA")) 
  ],
),

```

## Github主页 👉[fuzz-productions/platty](http://github.com/fuzz-productions/platty)