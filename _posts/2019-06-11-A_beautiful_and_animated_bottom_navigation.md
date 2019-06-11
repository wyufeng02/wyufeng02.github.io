---
layout: post
title:  自定义底部导航动画
tag: [Navigation, Tabbar]
date: 2019-06-11
---

 


## [立即下载 ️⬇️ ](https://codeload.github.com/pedromassango/bottom_navy_bar/zip/master) 


 
![aa](https://raw.githubusercontent.com/pedromassango/bottom_navy_bar/master/navy.gif)

 
>
> 自定义底部导航动画
>

 
# BottomNavyBar
 
一个美丽的动画底部导航。 导航栏使用您当前的主题，但您可以自由定制它。

## Fix
支持setState更改BottomNavyBar的_selectindex，只需将bottom_navy_bar.dart复制到项目中
 
## PageView

![Fix Gif](https://raw.githubusercontent.com/pedromassango/bottom_navy_bar/master/fix.gif "Fix")
## Getting Started

Add the plugin:

```yaml
dependencies:
  ...
  bottom_navy_bar: ^3.0.0
```

## Basic Usage

Adding the widget

```dart
bottomNavigationBar: BottomNavyBar(
   selectedIndex: _selectedIndex,
   showElevation: true, // use this to remove appBar's elevation
   onItemSelected: (index) => setState(() {
              _selectedIndex = index;
              _pageController.animateToPage(index,
                  duration: Duration(milliseconds: 300), curve: Curves.ease);
    }),
   items: [
     BottomNavyBarItem(
       icon: Icon(Icons.apps),
       title: Text('Home'),
       activeColor: Colors.red,
     ),
     BottomNavyBarItem(
         icon: Icon(Icons.people),
         title: Text('Users'),
         activeColor: Colors.purpleAccent
     ),
     BottomNavyBarItem(
         icon: Icon(Icons.message),
         title: Text('Messages'),
         activeColor: Colors.pink
     ),
     BottomNavyBarItem(
         icon: Icon(Icons.settings),
         title: Text('Settings'),
         activeColor: Colors.blue
     ),
   ],
)
```

## Customization (Optional)

### BottomNavyBar

** iconSize **  - 项目图标的大小<br/>
**项目**  - 导航项目，需要多个项目且少于6个
** selectedIndex **  - 当前项目索引。 使用此选项可更改所选项目。 默认为零<br/>
** onItemSelected **  - 在点击项目时需要监听它提供所选项目的索引<br/>
** backgroundColor **  - 导航栏的背景颜色
** showElevation **  - 如果为false，将删除appBar的高程


### BottomNavyBarItem

** activeColor **  - 活动项目的背景和文本颜色<br/>
** inactiveColor **  - 非活动项目的图标颜色<br/>

## Github主页 👉[pedromassango/bottom_navy_bar](http://github.com/pedromassango/bottom_navy_bar)