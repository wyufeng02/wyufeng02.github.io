---
layout: post
title:  一个天气应用程序，用于学习如何在Flutter中使用Canvas和Animation
tag: Templates, Weather
date: 2019-06-08
---

 

## [查看Github/alessandroaime/Weather](http://github.com/alessandroaime/Weather)
## [立即下载 ️⬇️ ](https://codeload.github.com/alessandroaime/Weather/zip/master) 


 
![](https://flutterawesome.com/content/images/2018/10/Weather.jpg)
 
>
> 天气应用程序，以学习如何使用Alessandro Aime的Canvas和Animation。
>

 
# Weather

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Quick Disclaimer

I removed my private OpenWeather API key from the repo, if you want to get the weather forecast use your own in the `openweather_api.dart` file (more info at [https://openweathermap.org/appid](https://openweathermap.org/appid)).

## Back to the app

*I started from scatch with Flutter and Dart two weeks ago (2018/02/02), a refactoring is needed due to the ugliness of the current code since my main purpose is/was to learn them at first.*

The idea behind this weather application (currently only the login page) is to learn how to use Canvas and Animation in Flutter.

It all started from an [inspirational mockup](https://dribbble.com/shots/2695917-Weather-Login-App) two days ago, and here's the *current* result:

![test](https://raw.githubusercontent.com/alessandroaime/Weather/master/./README/comparison.jpg)

The background has been entirely coded (see [`header_painter.dart`](https://github.com/alessandroaime/Weather/blob/master/lib/header_painter.dart)) except for the deer image, which has been **temporarily** appended using the `Stack` widget rather than painting it.

Enjoy it!

