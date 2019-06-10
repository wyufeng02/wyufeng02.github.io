---
layout: post
title:  带有条纹支付插件集成的flutter插件
tag: Cards, Payment
date: 2019-06-08
---

 


## [立即下载 ️⬇️ ](https://codeload.github.com/jonasbark/flutter_stripe_payment/zip/master) 
<p-7> 

 
![](https://flutterawesome.com/content/images/2019/02/stripe_payment.jpg)
 
>
> 一个flutter插件，用于集成iOS和Android的条带插件。
>

 
# stripe_payment

A flutter plugin to integrate the stripe plugin for iOS and Android. Currently only adding a credit card as source is implemented.

<img src="https://github.com/jonasbark/flutter_stripe_payment/raw/master/screenshot_android.png" width="300"/>
<img src="https://github.com/jonasbark/flutter_stripe_payment/raw/master/screenshot_ios.png" width="300"/>

## Android

**Please be aware that your main activity must extend from FlutterFragmentActivity. Otherwise the Android dialog would've looked very nasty.**

Include this into your project's android/gradle.properties file
```properties
android.useAndroidX=true
android.enableJetifier=true
```

## Usage

To set your publishable key set:
```dart
import 'package:stripe_payment/stripe_payment.dart';
StripeSource.setPublishableKey("pk_test");
```
from somewhere in your code, e.g. your main.dart file.

To open the dialog:
```dart
StripeSource.addSource().then((String token) {
    print(token); //your stripe card source token
});
```

## TODO

- [ ] better error handling
- [ ] internationalization
- [ ] more stripe library implementations?

## Github主页 👉[jonasbark/flutter_stripe_payment](http://github.com/jonasbark/flutter_stripe_payment)