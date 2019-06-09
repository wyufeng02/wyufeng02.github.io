---
layout: post
title:  一个好看的底部导航动画
tag: Navigation, Tabbar
date: 2019-06-08
---

 

## [查看Github/pedromassango/bottom_navy_bar](http://github.com/pedromassango/bottom_navy_bar)
## [立即下载 ️⬇️ ](https://codeload.github.com/pedromassango/bottom_navy_bar/zip/master) 


 
![](https://flutterawesome.com/content/images/2019/05/BottomNavyBar.jpg)
 
>
> 一个好看的动画底部导航。
>

 
# BottomNavyBar

A beautiful and animated bottom navigation. The navigation bar use your current theme, but you are free to customize it.

## Fix
Support setState to change BottomNavyBar's _selectindex,just copy bottom_navy_bar.dart into your project

## Preview

![FanBottomNavyBar Gif](https://raw.githubusercontent.com/pedromassango/bottom_navy_bar/master/navy.gif)
 
## PageView

![Fix Gif](https://github.com/pedromassango/bottom_navy_bar/raw/master/fix.gif)
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
**iconSize** - the item icon's size<br/>
**items** - navigation items, required more than one item and less than six<br/>
**selectedIndex** - the current item index. Use this to change the selected item. Default to zero<br/>
**onItemSelected** - required to listen when a item is tapped it provide the selected item's index<br/>
**backgroundColor** - the navigation bar's background color
**showElevation** - if false the appBar's elevation will be removed

### BottomNavyBarItem
**activeColor** - the active item's background and text color<br/>
**inactiveColor** - the inactive item's icon color<br/>

