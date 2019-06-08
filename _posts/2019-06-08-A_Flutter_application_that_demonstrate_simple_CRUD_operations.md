---
layout: post
title:  一个展示简单CRUD操作的Flutter应用程序
tag: Apps
date: 2019-06-08
---

 

## [查看Github/ibhavikmakwana/cricket_team](http://github.com/ibhavikmakwana/cricket_team)
## [立即下载 ️⬇️ ](https://codeload.github.com/ibhavikmakwana/cricket_team/zip/master) 


 
![](https://flutterawesome.com/content/images/2018/12/Cricket-Team.jpg)
 
>
> Flutter应用程序，演示使用Firebase云数据库进行简单的CRUD操作。
>

 
# Cricket Team
[![Say Thanks!](https://img.shields.io/badge/Say%20Thanks-!-1EAEDB.svg)](https://saythanks.io/to/ibhavikmakwana) 

A Flutter application that demonstrate simple CRUD operations with Firebase cloud database.

# Preview

| Home | Empty | Swipe |
| ------------------ | --------------------------- | ------------------ |
| <img src="https://raw.githubusercontent.com/ibhavikmakwana/cricket_team/master/preview/list.jpg" height="400" alt="Screenshot"/>  | <img src="./preview/empty.jpg" height="400" alt="Screenshot"/> | <img src="./preview/swipe.jpg" height="400" alt="Screenshot"/> |

| Add Player | Update Player |
| ------------------ | --------------------------- |
| <img src="https://raw.githubusercontent.com/ibhavikmakwana/cricket_team/master/preview/add.jpg" height="400" alt="Screenshot"/>  | <img src="./preview/update.jpg" height="400" alt="Screenshot"/> |


## Add Firebase to your app

1. Create a Firebase project. Check out the [Firebase](https://firebase.google.com/docs/flutter/setup) documentation for setting up the firebase in your flutter application.
2. Create a new Firebase console project
3. Add [Cloud Firestore](https://pub.dartlang.org/packages/cloud_firestore) to the project in the pubspec.yaml
4. Drop the created *google-services.json* in *android/app*

## Gradles

Changes to the *android/build.gradle*:

```
buildscript {
        repositories {
            ...
        }

        dependencies {
            ...
            classpath 'com.google.gms:google-services:3.2.1' // Google Services plugin
        }
    }
```

And then we have the *android/app/build.gradle*:

```
//bottom of file
apply plugin: 'com.google.gms.google-services'
```

## iOS CocoaPods

Google services use CocoaPods to install and manage dependencies. Open a terminal window and navigate to the location of the Xcode project for your app.

1. Create a Podfile if you don't have one:

```pod init```

2. Open your Podfile and add:

```pod 'Firebase/Core'```

3. Save the file and run:

```pod install```

4. Add initialization code

```
import UIKit
import Firebase // import the firebase

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

  var window: UIWindow?

  func application(_ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplicationLaunchOptionsKey: Any]?)
    -> Bool {
    FirebaseApp.configure() //configure the firebase
    return true
  }
}
```


## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Lab: Write your first Flutter app](https://flutter.io/docs/get-started/codelab)
- [Cookbook: Useful Flutter samples](https://flutter.io/docs/cookbook)

For help getting started with Flutter, view our 
[online documentation](https://flutter.io/docs), which offers tutorials, 
samples, guidance on mobile development, and a full API reference.

## Contribute
1. Fork the the project
2. Create your feature branch (git checkout -b my-new-feature)
3. Make required changes and commit (git commit -am 'Add some feature')
4. Push to the branch (git push origin my-new-feature)
5. Create new Pull Request

## Questions?🤔

Hit me on

<a href="https://twitter.com/ibhavikmakwana"><img src="./icons/twitter-icon.png?raw=true" width="60"/></a>
<a href="https://medium.com/@ibhavikmakwana"><img src="./icons/medium-icon.png?raw=true" width="60"/></a>
<a href="https://www.linkedin.com/in/ibhavikmakwana/"><img src="./icons/linkedin-icon.png?raw=true" width="60"/></a>

