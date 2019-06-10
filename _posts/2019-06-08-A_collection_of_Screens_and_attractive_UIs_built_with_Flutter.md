---
layout: post
title:  屏幕和吸引力的集合与Flutter建立
tag: Login Screen, Loading
date: 2019-06-08
---

 


## [立即下载 ️⬇️ ](https://codeload.github.com/samarthagarwal/FlutterScreens/zip/master) 


 
![](https://flutterawesome.com/content/images/2018/12/FlutterScreens.jpg)
 
>
> 屏幕和吸引力的集合使用Flutter构建，可以在您的应用程序中使用。
>

 
# Flutter Screens

A collection of Login Screens, Buttons, Loaders and Widgets with attractive UIs, built with Flutter, ready to be used in your applications.

###### Last Update: Added Rating Widget

## Screenshots And Usage

## Rating

![Screenshots on iOS](https://raw.githubusercontent.com/samarthagarwal/FlutterScreens/master/./screenshots/rating.gif)

## Loaders

![Screenshots on iOS](https://raw.githubusercontent.com/samarthagarwal/FlutterScreens/master/./screenshots/loaders.gif)

#### ColorLoaders

| ![Screenshot](https://raw.githubusercontent.com/samarthagarwal/FlutterScreens/master/./screenshots/color_loader.gif) Color Loader 1 | ![Screenshot](https://raw.githubusercontent.com/samarthagarwal/FlutterScreens/master/./screenshots/color_loader_2.gif) Color Loader 2 | ![Screenshot](https://raw.githubusercontent.com/samarthagarwal/FlutterScreens/master/./screenshots/color_loader_3.gif) Color Loader 3 |
|-----------------------------------------------|-----------------------------------------------|-----------------------------------------------|
| ![Screenshot](https://raw.githubusercontent.com/samarthagarwal/FlutterScreens/master/./screenshots/color_loader_4.gif) Color Loader 4 | ![Screenshot](https://raw.githubusercontent.com/samarthagarwal/FlutterScreens/master/./screenshots/color_loader_5.gif) Color Loader 5 |                                               |

#### FlipLoaders
_Example #1_
```
FlipLoader(
  loaderBackground: Colors.red,
  iconColor: Colors.white,
  icon: Icons.email,
  animationType: "full_flip"),
```
_Example #2_
```
FlipLoader(
  loaderBackground: Colors.blueAccent,
  iconColor: Colors.orangeAccent,
  icon: Icons.subway,
  animationType: "half_flip",
  rotateIcon: true,
),
```
_Example #3_
```
FlipLoader(
  loaderBackground: Colors.green,
  iconColor: Colors.white,
  icon: Icons.wifi,
  animationType: "half_flip",
  shape: "circle",
  rotateIcon: false,
),
```
___
###### I am working on more loaders. These loaders will also be updated. Thanks to [jakeleveroni](https://github.com/jakeleveroni) for parameterizing the FlipLoader. 
___

## Buttons

![Screenshots on iOS](https://raw.githubusercontent.com/samarthagarwal/FlutterScreens/master/./screenshots/buttons1.png)


#### Simple Round Button

```
SimpleRoundButton(
    backgroundColor: Colors.redAccent,
    buttonText: Text("LOGIN", 
        style: TextStyle(
            color: Colors.white
        ),
    ),
    textColor: Colors.white,
)
```

#### Simple Round Icon Button 

```
SimpleRoundIconButton(
    backgroundColor: Colors.orangeAccent,
    buttonText: Text("SEND EMAIL", 
        style: TextStyle(
            color: Colors.white
        ),
    ),        
    textColor: Colors.white,
    icon: Icon(Icons.email),
)
```

#### Simple Round Icon Only Button 
```
SimpleRoundOnlyIconButton(
  backgroundColor: Colors.blueAccent,
  icon: Icon(Icons.phone),
  iconAlignment: Alignment.center,
)
```
___
##Login Screens

### Login Screen 1

![Screenshots on Android and iOS](https://raw.githubusercontent.com/samarthagarwal/FlutterScreens/master/./screenshots/login_screen_1.png)

##### Usage

```
Container(
	child: LoginScreen1(
	primaryColor: Color(0xFF4aa0d5),
	backgroundColor: Colors.white,
	backgroundImage: new AssetImage("assets/images/full-bloom.png"),
    ),
)
```

 ### Login Screen 2

 ![Screenshots on Android and iOS](https://raw.githubusercontent.com/samarthagarwal/FlutterScreens/master/./screenshots/login_screen_2.png)

 ##### Usage

 ```
 Container(
 	child: LoginScreen2(
        backgroundColor1: Color(0xFF444152),
        backgroundColor2: Color(0xFF6f6c7d),
        highlightColor: Color(0xfff65aa3),
        foregroundColor: Colors.white,
        logo: new AssetImage("assets/images/full-bloom.png"),
        ),
    )
 ```

   ### Login Screen 3

   ![Screenshots on Android and iOS](https://raw.githubusercontent.com/samarthagarwal/FlutterScreens/master/./screenshots/login_screen_3.gif)

   ##### Usage

   ```
   Container(
   		child: LoginScreen3(),
   )
   ```

  ## Contribution and Donation

  Feel free to contribute. If you like the project and want to donate, [click here](https://www.paypal.me/samarthagarwal).

## Github主页 👉[samarthagarwal/FlutterScreens](http://github.com/samarthagarwal/FlutterScreens)