---
layout: post
title:  A Flutter package that help you create a verification input
tag: code4flutter,flutter code , Input, Verification
date: 2019-06-08
---

 


## [立即下载 ️⬇️ ](https://codeload.github.com/tinylife-io/flutter_verification_code_input/zip/master) 


 
![](https://flutterawesome.com/content/images/2019/01/flutter_verification_code_input.jpg)
 
>
> Verify code input. You can create a verify code input.
>

 
# flutter_verification_code_input

- A Flutter package that help you create a verification input.

## Installing

```yaml
dependencies:
  flutter:
    sdk: flutter
  flutter_verification_code_input:
      git:
        url: git://github.com/tinylife-io/flutter_verification_code_input.git
```

```dart
import'package:flutter_verification_code_input/flutter_verification_code_input.dart';
```

## Usage

```dart
  VerificationCodeInput(
      keyboardType: TextInputType.number,
      length: 4,
      onCompleted: (String value) {
        //...
        print(value);
      },
  )
```

## Showcase


![Showcase|100x100, 10%](show_case.gif)



## Github主页 👉[tinylife-io/flutter_verification_code_input](http://github.com/tinylife-io/flutter_verification_code_input)