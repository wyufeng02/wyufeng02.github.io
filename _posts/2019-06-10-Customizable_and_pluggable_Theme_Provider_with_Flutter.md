---
layout: post
title:  主题切换插件
tag: [code4flutter,flutterAwesome , Theme]
date: 2019-06-10
---

 


## [立即下载 ️⬇️ ](https://codeload.github.com/kdsuneraavinash/theme_provider/zip/master) 


 
![](https://flutterawesome.com/content/images/2019/06/theme_provider.jpg)
 
>
> 易于使用，可定制的主题插件
>

 
# theme_provider

[![Codemagic build status](https://api.codemagic.io/apps/5cfb60390824820019d5af6b/5cfb60390824820019d5af6a/status_badge.svg)](https://codemagic.io/apps/5cfb60390824820019d5af6b/5cfb60390824820019d5af6a/latest_build)
[![Pub Package](https://img.shields.io/pub/v/theme_provider.svg)](https://pub.dartlang.org/packages/theme_provider)

易于使用，可定制的主题提供商。
** 开发中 **

| Basic Usage           | Dialog Box           |
|:-------------:|:-------------:|
| ![Record](https://raw.githubusercontent.com/kdsuneraavinash/theme_provider/master/next.gif) | ![Record](https://raw.githubusercontent.com/kdsuneraavinash/theme_provider/master/select.gif) |

## 使用方法

```yaml
dependencies:
  theme_provider: ^0.1.0
```

run packages get and import it

```dart
import 'package:theme_provider/theme_provider.dart';
```

## Usage

例子

```dart
class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ThemeProvider(
      builder: (theme) => MaterialApp(
        home: HomePage(),
        theme: theme,
      ),
    );
  }
}
```

Provide additional themes like this:

```dart
class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ThemeProvider(
      themes: [
        AppTheme.light(), // This is standard light theme
        AppTheme.dark(), // This is standard dark theme
        AppTheme(
          id: "custom_theme", // Id (or name) of the theme(Has to be unique)
          data: ThemeData(
            primaryColor: Colors.black,
            accentColor: Colors.red,
          ),
        ),
      ],
      builder: (theme) => MaterialApp(
        home: HomePage(),
        theme: theme,
      ),
    );
  }
}
```

To change the theme:

```dart
 ThemeProvider.controllerOf(context).nextTheme();
 // Or
 ThemeProvider.controllerOf(context).setTheme(THEME_ID);
```

Access current `AppTheme`

```dart
 ThemeProvider.themeOf(context)
```

Access theme data:

```dart
 ThemeProvider.themeOf(context).data
 // or
 Theme.of(context)
```

### Passing Additional Options

这也可用于传递与主题相关的其他数据。 使用`options`传递应该与主题相关联的其他数据。
例如：如果特定按钮上的字体颜色发生更改，则创建一个类来封装该值。

```dart
  class ThemeOptions{
    final Color specificButtonColor;
    ThemeOptions(this.specificButtonColor);
  }
```

  Then provide the options with the theme.

  ```dart
class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ThemeProvider(
      themes: themes: [
          AppTheme<ThemeOptions>(
              data: ThemeData.light(),
              options: ThemeOptions(Colors.blue),
          ),
          AppTheme<ThemeOptions>(
              data: ThemeData.dark(),
              options: ThemeOptions(Colors.red),
          ),
        ],
        builder: (theme) => MaterialApp(
          home: HomePage(),
          theme: theme,
        ),
    );
  }
}
  ```

Then the option can be retrieved as,

```dart
ThemeProvider.optionsOf<ThemeOptions>(context).specificButtonColor
```
 

### 保存主题

要保存主题，只需将`saveThemesOnChange`作为`true`传递。
这将确保将主题保存到磁盘。

### 加载已保存的主题

`defaultThemeId`将用于确定初始主题。
但您可以使用以下命令加载以前的主题：

```dart
 ThemeProvider.controllerOf(context).loadThemeFromDisk();
```
**警告：从磁盘加载会导致您的应用刷新（这可能会导致闪烁）**
因此，建议您使用此功能，显示启动画面或使用与主题无关的启动画面
因此用户无法看到刷新。

示例：可以设计登录屏幕，使其在所有屏幕中看起来都相同。
因此，当主题加载时，用户将不会注意到它。
然后其他屏幕可以是主题。


## Additional Widgets

### Theme Cycle Widget

`IconButton` to be added to `AppBar` to cycle to next theme.

```dart
Scaffold(
  appBar: AppBar(
    title: Text("Example App"),
    actions: [CycleThemeIconButton()]
  ),
),
```

### Theme Selecting Dialog

`SimpleDialog` to let the user select the theme.
Many elements in this dialog is customizable.

```dart
showDialog(context: context, builder: (_) => ThemeDialog())
```

## TODO

-  [x]添加下一个主题命令
-  [x]添加主题循环小部件
-  [x]按主题ID添加主题选择
-  [x]添加主题选择和预览小部件
-  [x]坚持当前选定的主题
-  [x]添加单元测试和示例
-  [x]删除提供程序依赖项

## Getting Started

For help getting started with Flutter, view our online [documentation](https://flutter.io/).

For help on editing package code, view the [documentation](https://flutter.io/developing-packages/).

## Github主页 👉[kdsuneraavinash/theme_provider](http://github.com/kdsuneraavinash/theme_provider)