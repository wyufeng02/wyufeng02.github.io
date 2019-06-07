---
layout: post
title:  Flutter app bar和搜索小部件集成
tag: Search
date: 2019-06-08
---

# [Flutter app bar和搜索小部件集成 ](http://github.com/tomwyr/loader-search-bar) 



## [查看Github/tomwyr/loader-search-bar](http://github.com/tomwyr/loader-search-bar)
## [立即下载 ️⬇️ ](https://codeload.github.com/tomwyr/loader-search-bar/zip/master) 


 
![](https://flutterawesome.com/content/images/2018/11/Loader-SearchBar.jpg)
 
>
> Flutter小部件将搜索字段功能集成到应用栏中，允许接收查询更改回调并自动将新数据集加载到ListView中。
>

 
# Loader SearchBar

## This package's been discontinued
Due to a *hacky* way this widget uses to display search results, it's become difficult to maintain and add new features.
While it won't be developed anymore, you can still fork/use it in your Flutter project. 
As a replacement, take a look at Flutter framework [showSearch](https://docs.flutter.io/flutter/material/showSearch.html) method or other [community packages](https://pub.dartlang.org/flutter/packages?q=search).

[![pub package](https://img.shields.io/pub/v/loader_search_bar.svg)](https://pub.dartlang.org/packages/loader_search_bar)

Flutter widget integrating search field feature into app bar, allowing to receive query change callbacks and automatically load new data set into ListView. It replaces standard AppBar widget and **needs to be placed underneath Scaffold** element in the widget tree to work properly.

![Loader SearchBar demo](https://thumbs.gfycat.com/HealthyAmbitiousImpala-max-14mb.gif)

## Getting started
To start using SearchBar insert it in place of an AppBar element in the Scaffold widget. Regardless of the use case, **defaultBar** named argument has to be specified, which basically is a widget that will be displayed whenever SearchBar is not in activated state:
```Dart
@override
Widget build(BuildContext context) {
   return Scaffold(
     appBar: SearchBar(
       defaultBar: AppBar(
         leading: IconButton(
           icon: Icon(Icons.menu),
           onPressed: _openDrawer,
         ),
         title: Text('Default app bar title'),
       ),
       ...
     ),
     body: _body,
     drawer: _drawer,
   );
}
```

## Optional attributes
 - searchHint - hint string being displayed until user inputs any text,
 - initialQuery - query value displayed for the first time in search field,
 - iconified - boolean value indicating way of representing non-activated SearchBar:
   - *true* if widget should be showed as an action item in *defaultBar*,
   - *false* if widget should be merged with *defaultBar* (only leading icon of the default widget and search input field are displayed in such case),
 - autofocus - boolean value determining if search text field should get focus whenever it becomes visible,
 - autoActive - ,
 - attrs - SearchBarAttrs class instance allowing to specify part of exact values used during widget building (e.g. search bar colors, text size, border radius),
 - controller - SearchBarController object that provides a way of interacing with current state of the widget,
 - searchItem - defining how to build and position search item widget in app bar,
 - overlayStyle - status bar overlay brightness applied when widget is activated.

## Query callbacks
To get notified about user input specify *onQueryChanged* and/or *onQuerySubmitted* callback functions that receive current query string as an argument:
```Dart
appBar: SearchBar(
   ...
   onQueryChanged: (query) => _handleQueryChanged(context, query),
   onQuerySubmitted: (query) => _handleQuerySubmitted(context, query),
),
```

## QuerySetLoader
By passing QuerySetLoader object as an argument one can additionally benefit from search results being automatically built as ListView widget whenever search query changes:
```Dart
appBar: SearchBar(
  ...
  loader: QuerySetLoader<Item>(
     querySetCall: _getItemListForQuery,
     itemBuilder: _buildItemWidget,
     loadOnEachChange: true,
     animateChanges: true,
  ),
),

List<Item> _getItemListForQuery(String query) { ... }

Widget _buildItemWidget(Item item) { ... }
```

 - *querySetCall* - function transforming search query into list of items being then rendered in ListView (required),
 - *itemBuilder* - function creating Widget object for received item, called during ListView building for each element of the results set (required),
 - *loadOnEachChange* - boolean value indicating whether *querySetCall* should be triggered on each query change; if *false* query set is loaded once user submits query,
 - *animateChanges* - determines whether ListView's insert and remove operations should be animated.

## SearchItem
Specifying this parameter allows to customize how search item should be built and positioned in app bar. It can be either *action* or *menu* widget. No matter which of these two is picked, two constructor arguments can be passed:
- builder - function receiving current `BuildContext` and returning `Widget` for *action* or `PopupMenuItem` for *menu* item,
- gravity - can be one of `SearchItemGravity` values: *start*, *end* or *exactly*.
If no arguments are passed, SearchBar will create default item which is search action icon with *start* gravity.

**SearchItem.action**

<img src="https://pictr.com/images/2018/09/05/0x1ZMQ.png" width="384" alt="Search action item"/>

```Dart
appBar: SearchBar(
  // ...
  searchItem: SearchItem.action(
    builder: (_) => Padding(
      padding: EdgeInsets.all(12.0),
      child: Icon(
        Icons.find_in_page,
        color: Colors.indigoAccent,
      ),
    ),
    gravity: SearchItemGravity.exactly(1),
  ),
)
```

**SearchItem.menu**

<img src="https://pictr.com/images/2018/09/05/0x1mBD.png" width="384" alt="Search menu item"/>

```Dart
appBar: SearchBar(
  // ...
  searchItem: SearchItem.menu(
    builder: (_) => PopupMenuItem(
      child: Text("Search  🔍"),
      value: "search",
    ),
    gravity: SearchItemGravity.end,
  ),
)
```

Also, bear in mind that **SearchBar will prevent built item widget from receiving tap events** and will begin search action rather than that.  

