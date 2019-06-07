---
layout: post
title:  Kotlin Multiplatform Kotlin应用程序的flutter克隆
tag: Apps
date: 2019-06-08
---

# [Kotlin Multiplatform Kotlin应用程序的flutter克隆 ](http://github.com/worldline-spain/flutter_votlin_app) 



## [查看Github/worldline-spain/flutter_votlin_app](http://github.com/worldline-spain/flutter_votlin_app)
## [立即下载 ️⬇️ ](https://codeload.github.com/worldline-spain/flutter_votlin_app/zip/master) 


 
![](https://flutterawesome.com/content/images/2018/12/Flutter-Votlin-App.jpg)
 
>
> Kotlin multiplatform很棒，但Flutter可以是一个很棒的选择！
>

 
# Flutter Votlin App

Flutter clone of Kotlin Multiplatform Votlin App -> https://github.com/sergiocasero/votlin-app

Kotlin multiplatform is great, but Flutter can be a fantastic alternative!

This is a small petshop with a master/detail structure. It lists the talks from Extremadura Digital Day event.

![image](https://raw.githubusercontent.com/worldline-spain/flutter_votlin_app/master/art/talk_list.png) ![image](https://raw.githubusercontent.com/worldline-spain/flutter_votlin_app/master/art/talk_detail.png)

## Getting Started with Flutter

For help getting started with Flutter, view the online
[documentation](https://flutter.io/).

If you want to find how amazing is Flutter, take a look at this repo -> https://github.com/Solido/awesome-flutter

## Project architecture
There are some architectures and patterns that are followed by the great community of Flutter:
- Redux
- Bloc pattern
- Scope Model
- Inherited Widget
- Model View Controller
- Model View Intent

A great resource related to flutter architectures -> https://github.com/brianegan/flutter_architecture_samples

Flutter community, for some reason, by the moment, is ignoring Clean Architecture...
so, why not give a oportunity to clean architecture in flutter?

This project try to follow the clean architecture structure.
Some related resources:

http://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html

https://fernandocejas.com/2014/09/03/architecting-android-the-clean-way/

## Architecture branches

To experiment with project architecture, we are going to implement different approaches in different branches

| Branch        | Description   | 
| ------------- | ------------- |
| architecture/multiple_packages_mvp | Multiple packages, model view presenter | 
| architecture/multiple_packages_scoped_model | Multiple packages, scoped model|
| architecture/multiple_packages_stream_builder | Multiple packages, stream builder|

### TODO branches
  - Single package architecture
  - FutureBuilder
  - States Rebuilder package

## But... is Clean Architecture the best architecture for Flutter?
Absolutely not. This is only a petshop project for experiment with Clean Architecture and with Flutter framework.
We don't know what is the best architecture for Flutter. The only way to find it is experimenting!

## Animation branches

To experiment with animations, we are going to create different branches

| Branch        | Description   | 
| ------------- | ------------- |
| animations/animated_builder | Experiment with animated builder widget | 

### TODO branches
  - Flare
  - Lottie

# How to build and run

## Building the code

* Use your favorite IDE. Flutter supports different IDE
* If you don't have Flutter installed, follow the official docs: https://flutter.io/docs/get-started/install
* If your IDE shows some errors, don't forget to execute command `flutter packages get` in domain and data modules

## Running the Android app

We have created some kind of flavors in flutter app, inspired by [this post](https://medium.com/@salvatoregiordanoo/flavoring-flutter-392aaa875f36)

Actually, we have added configuration for each flavor in [data layer](/flutter_votlin_app/data/lib/core/config)

Probably we can find better ways, but this is only the beginning.

To run the android app:

* Execute `flutter run lib/<main_file>`. For instance, to run mock flavor, execute `flutter run lib/main-mock.dart`.
* If you execute `flutter run`, mock flavor is executed
 
| Flavor        | Description   | Main file          |
| ------------- | ------------- | ------------- |
| MOCK | Offline version, mocked with a json file | main-mock.dart |
| LOCALHOST_EMULATOR | Online version, against localhost, running in the emulator. Json server required| main-localhost_emulator.dart |

## Running the iOS app
TODO
 
## Running the backend
Mock flavor does not backend, because we get the information from hardcoded json.

### MOCK
No backend required, we get the information from hardcoded json

### LOCALHOST
* Install [node](https://nodejs.org/) and [json-server](https://github.com/typicode/json-server)
* Copy [this file](/flutter_votlin_app/data/backend/schedule.json) to arbitrary folder
* Run `./json-server schedule.json`

## Running tests
TODO

## Thanks to:
 
* Thanks to @sergioch23 and @Dany4794, take a look to Votlin app -> https://github.com/sergiocasero/votlin-app
* Thanks to @GDGBarcelona and its organizers, [Flutter meetups in Barcelona are really helpful](https://www.meetup.com/es-ES/GDG-Barcelona/)
* Thanks to great people from Flutter Community: 
    - @brianegan -> https://github.com/brianegan
    - @norbertkozsir -> https://github.com/Norbert515
    - @ThomasBurkhartB -> https://github.com/escamoteur
    - @DidierBoelens -> https://github.com/boeledi
    - @SergiAndReplace -> https://github.com/sergiandreplace
  
## Contributing 
Feel free to open issues or make a pull request. All contributions are welcome!
