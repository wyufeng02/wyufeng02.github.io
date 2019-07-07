---
layout: post
title:  自适应卡的flutter实现
tag: [flutter, Cards]
date: 2019-07-07
---
 

## [立即下载 ️⬇️ ](https://codeload.github.com/neohelden/Flutter-AdaptiveCards/zip/master) 


 
![](https://flutterawesome.com/content/images/2019/06/Adaptive-Cards-for-Flutter.jpg?raw=true)
 
>
> 自适应卡的flutter实现。
>

  

# Adaptive Cards for Flutter

A Flutter implementation of Adaptive Cards.

### Installing

Put this into your `pubspec.yaml`
```yml
dependencies:
  flutter_adaptive_cards:
    git:
      url: https://github.com/neohelden/Flutter-AdaptiveCards
```

## Using

Using Adaptive Cards in Flutter coudn't be simpler: All you need is the `AdaptiveCard` widget.

There are several constructors which handle data loading from different sources.

`AdaptiveCard.network` takes a url to download the payload and display it.
`AdaptiveCard.asset` takes an asset path to load the payload from the local data.
`AdaptiveCard.memory` takes a map (which can be obtained but decoding a string using the json class) and displays it.

An example:

```dart
AdaptiveCard.network(
  placeholder: Text("Loading, please wait"),
  url: "www.someUrlThatPoints.To/A.json",
  hostConfigPath: "assets/host_config.json",
  onSubmit: (map) {
    // Send to server or handle locally
  },
  onOpenUrl: (url) {
    // Open url using the browser or handle differently
  },
  // If this is set, a button will appear next to each adaptive card which when clicked shows the payload.
  // NOTE: this will only be shown in debug mode, this attribute does change nothing for realease builds.
  // This is very useful for debugging purposes
  showDebugJson: true,
  // If you have not implemented explicit dark theme, Adaptive Cards will try to approximate its colors to match the dark theme
  // so the contrast and color meaning stays the same.
  // Turn this off, if you want to have full control over the colors when using the dark theme.
  // NOTE: This is currently still under development
  approximateDarkThemeColors: true,
);
```


## Running the tests

Simply type 
```sh
flutter test
```

and to update the golden files run 

```sh
flutter test --update-goldens test/sample_golden_test.dart
```
This updates the golden files for the sample cards.

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Authors

* **Norbert Kozsir** (@Norbert515) – *Initial work*, Head of Flutter development @Neohelden

See also the list of [contributors](https://github.com/neohelden/flutter_adaptive_cards/contributors) who participated in this project.

## About this project
We decided to build a Flutter implementation of Adaptive Cards because we believe in the future of both technologies. With Flutter, we found an exciting framework for ultra-fast and cross-platform UI development. And with Adaptive Cards, we can combine that with an industry standard for exchanging card content in a structured way. At Neohelden, we're building on both of these technologies with our AI-assistant for business – and you can learn more about why we built this in our [blog-post on the release of our Adaptive Cards in Flutter library](https://neohelden.com/blog/tech/using-adaptive-cards-in-flutter/).
 

## Github主页 👉[neohelden/Flutter-AdaptiveCards](http://github.com/neohelden/Flutter-AdaptiveCards)