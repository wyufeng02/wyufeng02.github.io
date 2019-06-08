---
layout: post
title:  Flutter的登录按钮助手库
tag: Button, SignIn
date: 2019-06-08
---

 

## [查看Github/ZaynJarvis/Flutter-Sign-in-Button](http://github.com/ZaynJarvis/Flutter-Sign-in-Button)
## [立即下载 ️⬇️ ](https://codeload.github.com/ZaynJarvis/Flutter-Sign-in-Button/zip/master) 


 
![](https://flutterawesome.com/content/images/2018/11/Flutter-Sign-in-Button.jpg)
 
>
> 适用于iOS和Android的Flutter插件，用于为不同的社交媒体帐户生成登录按钮。
>

 
A Flutter plugin for iOS and Android for generating signin buttons for different social media account.

> Feedback and Pull Requests are most welcome!

## Installation

Add to pubspec.yaml.

```yaml
dependencies:
  ...
  flutter_signin_button: ^0.2.8
```

## Usage Example

import flutter_signin_button.dart

```dart
import 'package:flutter_signin_button/flutter_signin_button.dart';
```

### For built-in buttons.

```dart
SignInButton(
  Buttons.Google,
  onPressed: () {},
)

// with custom text
SignInButton(
  Buttons.Google,
  text: "Sign up with Google",
  onPressed: () {},
)
```

### For mini buttons.

```dart
SignInButton(
  Buttons.Facebook,
  mini: true,
  onPressed: () {},
)
```

### For self-build buttons.

```dart
SignInButtonBuilder(
  text: 'Sign in with Email',
  icon: Icons.email,
  onPressed: () {},
  backgroundColor: Colors.blueGrey[700],
)
```

### Built-in Buttons contain

```dart
enum Buttons {
  Email,
  Google,
  Facebook,
  GitHub,
  LinkedIn,
  Pinterest,
  Tumblr,
  Twitter
}
```

<img src="https://i.pinimg.com/564x/64/2e/a4/642ea46654d3b0dff12bebafe288ba89.jpg" width="300"/>

**Refer to example folder and the source code for more information.**

