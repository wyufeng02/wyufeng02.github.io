---
layout: post
title:  Facebook和Twitter的flutter按钮登录
tag: Authentication, Button
date: 2019-06-08
---

# [Facebook和Twitter的flutter按钮登录 ](http://github.com/dmjones/flutter_auth_buttons) 



## [查看Github/dmjones/flutter_auth_buttons](http://github.com/dmjones/flutter_auth_buttons)
## [立即下载 ️⬇️ ](https://codeload.github.com/dmjones/flutter_auth_buttons/zip/master) 


 
![](https://flutterawesome.com/content/images/2019/04/flutter_auth_buttons.jpg)
 
>
> Flutter小部件库包含用于通过流行社交网络进行身份验证的按钮。
>

 
# Flutter Auth Buttons

Flutter widget library containing buttons for authenticating with popular social networks: Google, Facebook, Twitter
and Microsoft.

<img src="https://raw.githubusercontent.com/dmjones/flutter_auth_buttons/master/screenshots/example-app.png" alt="Screenshot" width="250" />

## Usage

Add `flutter_auth_buttons` to your `pubspec.yaml`, then import the Dart file:

```dart
import 'package:flutter_auth_buttons/flutter_auth_buttons.dart';
```

Use the `onPressed` attribute to capture the button press and call your authentication logic within that. To disable
the button, pass `null` or omit the attribute.

```dart
FacebookSignInButton(onPressed: () {
  // call authentication logic
});
```

Some buttons have a dark mode. Enable this with the optional parameter:

```dart
GoogleSignInButton(
  onPressed: () {/* ... */}, 
  darkMode: true, // default: false
)
```

You can adjust the border-radius of the buttons:

```dart
TwitterSignInButton(
  onPressed: () {},
  borderRadius: 10.0,
)
```

See the documentation for API details: https://pub.dartlang.org/documentation/flutter_auth_buttons/latest/.

