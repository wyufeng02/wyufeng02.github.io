---
layout: post
title:  使用Flutter创建一个反射灵感的幻灯片
tag: Slide
date: 2019-06-08
---

 


## [立即下载 ️⬇️ ](https://codeload.github.com/ReeceRose/Reflecty-Slideshow/zip/master) 
<p-5> 

 
![](https://flutterawesome.com/content/images/2019/03/Reflecty-Slideshowc.gif)
 
>
> 使用Flutter创建一个反射灵感的幻灯片。
>

 
# Reflecty Slideshow

A Reflectly inspired slideshow create using Flutter.

![Showing off navigation of slides](https://static.reecerose.com/images/projects/reflecty-slideshow/navigate.gif)

![Showing off firebase updates](https://static.reecerose.com/images/projects/reflecty-slideshow/update.gif)

## Setup Project

```bash
git clone https://github.com/ReeceRose/Reflecty-Slideshow.git
cd Reflecty-Slideshow
flutter packages get
```

## Setup Firebase

This project relies on Firebase to load stories. Firebase allows us to use streams so stories can update stories and see the changes instanly even without restarting/reloading the application.  In order to get this project working you'll need to follow the tutorial [here](https://firebase.google.com/docs/flutter/setup).

From your projects Firebase dashboard, click 'Database' and select Firestore. Add a new collection named 'stories'. Add a new document with the following structure...

![Firestore structure](https://static.reecerose.com/images/projects/reflecty-slideshow/structure.png)

Fill in the above form with the appropriate data. Document ID can be left alone since it is a auto-id field.

## Run project

```bash
flutter run
```
## Github主页 👉[ReeceRose/Reflecty-Slideshow](http://github.com/ReeceRose/Reflecty-Slideshow)