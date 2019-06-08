---
layout: post
title:  可用于以货币形式输入值的flutter窗口小部件包
tag: Input, Forms, Textfield
date: 2019-06-08
---

 

## [查看Github/fadhly-permata/flutter_moneytextfieldform](http://github.com/fadhly-permata/flutter_moneytextfieldform)
## [立即下载 ️⬇️ ](https://codeload.github.com/fadhly-permata/flutter_moneytextfieldform/zip/master) 


 
![](https://flutterawesome.com/content/images/2019/02/flutter_moneytextfieldform.jpg)
 
>
> Money TextFormField是一种flutter的小部件包，可以通过实时显示输出格式，以货币的形式输入值。
>

 
# MoneyTextFormField

> `MoneyTextFormField` is one of the flutter widget packages that can be used to input values in the form of currencies, by displaying the output format in realtime.
>
> This widget uses the `FlutterMoneyFormatter` package as a basic engine that has a very powerful ability to format currencies.
>
> [![latest version](https://img.shields.io/pub/v/moneytextformfield.svg?style=plastic&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAQAAAC1QeVaAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QA/4ePzL8AAAAHdElNRQfjAg8HMDMbfsHaAAABSUlEQVQY0y2LsUvUYRyHn+/7fe2uVMIz4hcnin+BFCrdZq1BQ1MN4VJxY7MoRLg7OGQ0NPkfiIOYBbYpiUO0VSQ15UFxHHf8fu/7cTif9XkeEz/54TO5qX4xtmJP8mZ8vR+vpt/q4gU3QitP3Iwr9fdhyerhPjZ7cBZH9Rf75ldSp11tXKsnZYHlEDvrt9dO4/dkjwjF6tde43M5GjGBlGoxrNtainGOsef9RqsMIyfUEZg8V1pVslf+crL3dup6EW6ZOMMRGEbmnmqh07bpkLEB89xhgMFQo8dRy4AZMGAe+EINkAEp2B6QhvHw7nOJ+9Fuq2guNsvKDaNiBvGLkUTQuf8Pd3e6U+MLKnGAkmkyf8xN/+zAeuFBKt+FZ6qGmux+tP3xw0TFGz7ZoffRlqQkSSolvRCK8Skmz9lpE3lIl0CiUfUix34BalOOAMgIffsAAAAldEVYdGRhdGU6Y3JlYXRlADIwMTktMDItMTVUMDc6NDg6NTEtMDU6MDCMNC56AAAAJXRFWHRkYXRlOm1vZGlmeQAyMDE5LTAyLTE1VDA3OjQ4OjUxLTA1OjAw/WmWxgAAAABJRU5ErkJggg==)](https://pub.dartlang.org/packages/moneytextformfield)
> [![last commit](https://img.shields.io/github/last-commit/fadhly-permata/flutter_moneytextfieldform.svg?style=plastic&logo=github)](https://github.com/fadhly-permata/flutter_moneytextfieldform)
> [![License](https://img.shields.io/badge/license-BSD-blue.svg?style=plastic&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAMAAAAolt3jAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAACPVBMVEXLy9UAAADLy9Tn7ubo7+bh5+Lb397b397i6OLc4N/f4+Df5ODc4N/i5+Li5+Lk6ePj6ePf4uAAAFbo7ubn7uU5F3re4eDw9+ru9unk6uTu9unOztbLy9XQ0NfMzNXKydTLytXLytTKydPMzNXPz9fNzdbIyNPY29zZ3N3Z3N3Y29zb397b397Y29zZ3N3Z3N3Y29zIyNPNzdW/vM3Y29zc4N/c4N/c4N/c4N/c4N/c4N/c4N/c39/c4N/X29zAvM3b397c4N/b397b3t7b397b397b39/b397b3t7b39/c4N/b397b39/b397b39/a3t7c4N/c4N/a3t7b397b397b39/b39/b39/b39/b397b4N7b39/b397b39/b39/b397c4N/b397b397b397c4N/U19vb4N7b39/U1tvc4N/b397b397b397c4N/c4N/c4N/b397b4N7b39/b39/c4N/c4N/a3d7b397b397b397a3d7b4N7b39/a3d7b397b397b397a3d7T1NnU1trQ0dfb4N7b39/Q0dfU1trT1NnQ0dfT1NnR09jT1drT1drb4N7b39/T1trU1trR09jT1dnQ0NfNztbR0tjb397c4N/c4N/c4N/c4N/c4N/b39/NztbHx9LPz9fNzdXP0Nfb397b397b397b397b397b397b397b397FxNHJydTOztbPz9fMzNXNzdbOztbOztbLy9XLy9XNzdXMzNXPz9fc4N/c4N/c4N/c4N/c4N////9bn80kAAAAuXRSTlMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMEAQAAAQQDBAQRGBYQZ2cQFhgRBAQCC9T7+vr///r71AsCI+pwN0Hg4EE3cOsjlE+PBdbVBY5PlVxvZWfa2WdlcFvKXVFYwAjU0wjAWFFdy7D7sNfXsfuwC3u7gxDX1hCDu3sLAwAE1tUEAAMECAYGCNPSCAYGCAQDBqrv/f3x/MsEAwQEBmihl5OTmJ98AwQEAwQEAQAAAAMEAzPoO4QAAAABYktHRL6k3IPDAAAAB3RJTUUH4wIPByY17oXROAAAAN1JREFUCNcB0gAt/wAdHh8AIAEBAQEhAiIjJAAlJicoKSorLC0uLzAxMgAzNDU2Nzg5Ojs3PD0+PwADQEFCQ0RFRkdISUpLBAAFTE1OTwZQUQdSU1RVCABWVwlYWQpaWwtcXQxeXwBgYWJjZGVmZ2hpamtsbQBuuW+6cA1xcg5zu3S8dQB2d3h5eg97fBB9fn+AgQCCEYMShBOFhhSHFYgWiQCKi4yNjhePkBiRkpOUlQCWlxmYvZmam5ydnp+goQCioxqkpaanqKmqq6ytrgCvsLGyG7MBAbQctba3uPQxRmBOIi5hAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDE5LTAyLTE1VDA3OjM4OjUzLTA1OjAwMpAq0AAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxOS0wMi0xNVQwNzozODo1My0wNTowMEPNkmwAAAAASUVORK5CYII=)](https://github.com/fadhly-permata/flutter_moneytextfieldform/blob/master/LICENSE)


#### Dependencies :
[![intl](https://img.shields.io/pub/vpre/flutter_money_formatter.svg?label=FlutterMoneyFormatter&colorA=gray&colorB=green&style=plastic)](https://pub.dartlang.org/packages/flutter_money_formatter)


---

# Install

For complete steps in installing `MoneyTextFormField` you can see in the [**Installation Guide**](https://pub.dartlang.org/packages/moneytextformfield#-installing-tab-).


# Usage

The following is the simplest example of using `MoneyTextFormField`:

```dart
import 'package:moneytextformfield/moneytextformfield.dart';

  /// ... some lines of code ...
  MoneyTextFormField(
    settings: MoneyTextFormFieldSettings()
  )
  /// ... some lines of code ...
```

For those of you who have not yet understood how to implement the widget package, you can use the following code in the `main.dart` file on your Flutter project:


```dart
import 'package:flutter/material.dart';
import 'package:moneytextformfield/moneytextformfield.dart';

void main() => runApp(MyApp());

class MyApp extends StatefulWidget {
  @override
  _MyAppState createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  TextEditingController mycontroller = TextEditingController();

  @override
  void initState() {  
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(
          title: const Text('MoneyTextFormField Demo'),
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: () => print(mycontroller.text),
          child: Icon(Icons.save),
        ),
        body: Column(
          children: <Widget>[
            /// Begin of :> MoneyTextFormField
            MoneyTextFormField(
              settings: MoneyTextFormFieldSettings(
                controller: mycontroller
              )
            )
            /// End of :> MoneyTextFormField
          ]
        )
      )
    );
  }
}
```

From the above code it will look more or less like the following:

> ![MoneyTextFormField](https://raw.githubusercontent.com/fadhly-permata/flutter_moneytextfieldform/master/doc/mtff-full-format.gif)
>
> Figure 1: Using full format

By doing a little modification, you will get the following results:

> ![MoneyTextFormField](https://raw.githubusercontent.com/fadhly-permata/flutter_moneytextfieldform/master/doc/mtff-compact-format.gif)
>
> Figure 2: Using compact format

Referring to the example code above, to retrieve the value inputted by the user, you can get it through the `mycontroller.text` as in the `onPressed` event in the `FloatingActionButton` widget.

---

# Configurations
For now, `MoneyTextFormField` only uses one property to configure the display of that object, the `settings` property that has a data type is an instance of `MoneyTextFormFieldSettings`. 


## MoneyTextFormFieldSettings

| Name                          | Data Type     | Description |
| ----------------------------- | ------------- | ----------- |
| `controller`                  | `TextEditingController`                   | A [controller](https://docs.flutter.io/flutter/widgets/TextEditingController-class.html) for an editable text field. |
| `validator`                   | `FormFieldValidator<String>`              | An optional method that validates an input. Returns an error string to display if the input is invalid, or null otherwise. |
| `inputFormatters`             | `List<TextInputFormatter>`                | A [TextInputFormatter](https://docs.flutter.io/flutter/services/TextInputFormatter-class.html) can be optionally injected to provide as-you-type validation and formatting of the text being edited. |
| `onChanged`                   | `void`                                    | An optional method that register a closure to be called when the object changes. |
| `moneyFormatSettings`         | `MoneyFormatSettings`                     | [See here](#MoneyFormatSettings) |
| `appearanceSettings`          | `AppearanceSettings`                      | [See here](#appearancesettings) |
| `enabled`                     | `bool`                                    | Whether the form is able to receive user input. |

>> **Tips:** 
>>
>> No need to initialize the value in `controller.text`, because the value will be ignored. the `controller` property is only intended to capture the value inputted by the user.

>> **Notes:**
>>
>> The value contained in `controller.text` is exactly the same as the one inputted by the user and has a `String` data type. If you want to get results in the same format, you can use the `FlutterMoneyFormatter` package which is also used by `MoneyTextFormField`.
>>
>>> [See detailed information about `FlutterMoneyFormatter`.](https://pub.dartlang.org/packages/flutter_money_formatter)


## AppearanceSettings

| Name                          | Data Type           | Description |
| ----------------------------- | ------------------- | ----------- |
| `labelText`                   | `String`            | Text that describes the input field. Default value is `'Amount'` |
| `hintText`                    | `String`            | Text that suggests what sort of input the field accepts. |
| `icon`                        | `Widget`            | An icon to show before the input field and outside of the decoration's container. |
| `labelStyle`                  | `TextStyle`         | The style to use for the `labelText` when the label is above (i.e., vertically adjacent to) the input field. |
| `inputStyle`                  | `TextStyle`         | The style to use for the input field. |
| `formattedStyle`              | `TextStyle`         | The style to use for the formatted output text. |
| `errorStyle`                  | `TextStyle`         | The style to use for the `errorText` |
| `padding`                     | `EdgeInsetGeometry` | The amount of space by which to inset the widget |


## MoneyFormatSettings
| Name                          | Data Type             | Description |
| ----------------------------- | --------------------- | ----------- |
| `amount`                      | `double`              | Decimal value that will be used when initializing the widget. Default value is `0.00`. |
| `fractionDigits`              | `int`                 | The fraction digits that will be used on formatted output. Default value is `2`. |
| `currencySymbol`              | `String`              | The symbol that will be used on formatted output. Default value is `'$'` (dollar sign). |
| `thousandSeparator`           | `String`              | The character that will be used as thousand separator on formatted output. Default value is `','` (comma).  |
| `decimalSeparator`            | `String`              | The character that will be used as decimal separator on formatted output. Default value is `'.'` (dot). |
| `symbolAndNumberSeparator`    | `String`              | The character that will be used as separator between symbol and number. Default value is `' '` (space). |
| `displayFormat`               | `MoneyDisplayFormat`  | [See here](#MoneyDisplayFormat) |


## MoneyDisplayFormat
`MoneyDisplayFormat` is an enum object with values such as the following:

| Name                  | Description |
| --------------------- | ----------- |
| nonSymbol             | Used to display currency values in full format and without a currency symbol. |
| symbolOnLeft          | Used to display currency values in full format with currency symbols on the left. |
| symbolOnRight         | Used to display currency values in full format with currency symbols on the right. |
| compactNonSymbol      | Used to display currency values in a short format and without a currency symbol. |
| compactSymbolOnLeft   | Used to display currency values in a short format with a currency symbol on the left. |
| compactSymbolOnRight  | Used to display currency values in a short format with a currency symbol on the right. |

---

## Demo

For more complete samples, you can grab it from the [example directory](https://github.com/fadhly-permata/flutter_moneytextfieldform/tree/master/example).

## Our Other Package

See our [other packages here](https://pub.dartlang.org/flutter/packages?q=email%3Afadhly.permata%40gmail.com).

## Help Me

If you find any issues, bugs, have questions, or want to request a new features you can [do it here](https://github.com/fadhly-permata/flutter_moneytextfieldform/issues). You can also help me to improve features or fix some issues by [forking this project via Github](https://github.com/fadhly-permata/flutter_moneytextfieldform)

## Change Log

Are you curious about the changes that occur in each version? [See here for detailed informations](https://pub.dartlang.org/packages/moneytextformfield#-changelog-tab-).

---

# License

```text
Copyright (c) 2019, Fadhly Permata <fadhly.permata@gmail.com>
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

The views and conclusions contained in the software and documentation are those
of the authors and should not be interpreted as representing official policies,
either expressed or implied, of the MoneyTextFormField project.
```
