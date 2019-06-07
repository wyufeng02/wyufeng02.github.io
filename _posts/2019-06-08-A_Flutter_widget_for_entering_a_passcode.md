---
layout: post
title:  用于输入密码的Flutter小部件
tag: Password, Pin
date: 2019-06-08
---

# [用于输入密码的Flutter小部件 ](http://github.com/deven98/passcode) 



## [查看Github/deven98/passcode](http://github.com/deven98/passcode)
## [立即下载 ️⬇️ ](https://codeload.github.com/deven98/passcode/zip/master) 


 
![](https://flutterawesome.com/content/images/2018/11/passcode.jpg)
 
>
> 用于输入密码的Flutter小部件。
>

 
# passcode

A Flutter widget for entering a passcode.

![alt text](https://github.com/deven98/passcode/blob/master/screenshot_1.png)

This widget allows you to customise number of characters, background and border colors and obscure text.

![alt text](https://github.com/deven98/passcode/blob/master/screenshot_2.png)

## Example

    import 'package:flutter/material.dart';
    import 'package:passcode/passcode.dart';

    void main() => runApp(MyApp());

    class MyApp extends StatelessWidget {
      @override
      Widget build(BuildContext context) {
        return MaterialApp(
          home: Scaffold(
            appBar: AppBar(),
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: <Widget>[
                  PasscodeTextField(
                    onTextChanged: (passcode) {
                      print(passcode);
                    },
                    totalCharacters: 4,
                    borderColor: Colors.black,
                    passcodeType: PasscodeType.number,
                  ),
                ],
              ),
            ),
          ),
        );
      }
    }

## Getting Started

For help getting started with Flutter, view our online [documentation](https://flutter.io/).

For help on editing package code, view the [documentation](https://flutter.io/developing-packages/).

