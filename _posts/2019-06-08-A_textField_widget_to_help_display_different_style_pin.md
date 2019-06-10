---
layout: post
title:  A textField widget to help display different style pin
tag: code4flutter,flutter code , Textfield, Pin, Password
date: 2019-06-08
---

 


## [立即下载 ️⬇️ ](https://codeload.github.com/TinoGuo/pin_input_text_field/zip/master) 


 
![](https://flutterawesome.com/content/images/2019/05/pininputtext.jpg)
 
>
> PinInputTextField is a TextField widget to help display different style pin.
>

 
[![pub package](https://img.shields.io/pub/v/pin_input_text_field.svg)](https://pub.dartlang.org/packages/pin_input_text_field)

# pin_input_text_field

[中文版点我](./README_CN.md)
PinInputTextField is a TextField widget to help display different style pin.

## Example

### Decoration

UnderlineDecoration

![](https://raw.githubusercontent.com/TinoGuo/pin_input_text_field/master/gifs/underline.gif)


BoxLooseDecoration

![](https://raw.githubusercontent.com/TinoGuo/pin_input_text_field/master/gifs/boxloose.gif)


BoxTightDecoration

![](https://raw.githubusercontent.com/TinoGuo/pin_input_text_field/master/gifs/boxtight.gif)

## Installing
Install the latest version from [pub](https://pub.dartlang.org/packages/pin_input_text_field).

## Usage

### Attributes
Customizable attributes for PinInputTextField
<table>
    <th>Attribute Name</th>
    <th>Example Value</th>
    <th>Description</th>
    <tr>
        <td>pinLength</td>
        <td>6</td>
        <td>The max length of pin, the default is 6</td>
    </tr>
    <tr>
        <td>onSubmit</td>
        <td>(String pin){}</td>
        <td>The callback will execute when user click done, sometimes is not working in Android.</td>
    </tr>
    <tr>
        <td>decoration</td>
        <td>BoxLooseDecoration</td>
        <td>Decorate the pin, there are 3 inside styles, the default is BoxLooseDecoration</td>
    </tr>
    <tr>
        <td>inputFormatters</td>
        <td>WhitelistingTextInputFormatter.digitsOnly</td>
        <td>Just like TextField's inputFormatter, the default is WhitelistingTextInputFormatter.digitsOnly</td>
    </tr>
    <tr>
        <td>keyboardType</td>
        <td>TextInputType.phone</td>
        <td>Just like TextField's keyboardType, the default is TextInputType.phone</td>
    </tr>
    <tr>
        <td>pinEditingController</td>
        <td>PinEditingController</td>
        <td>Controls the pin being edited. If null, this widget will create its own PinEditingController</td>
    </tr>
    <tr>
        <td>autoFocus</td>
        <td>false</td>
        <td>Same as TextField's autoFocus, the default is false</td>
    </tr>
    <tr>
        <td>focusNode</td>
        <td>FocusNode</td>
        <td>Same as TextField's focusNode</td>
    </tr>
    <tr>
        <td>textInputAction</td>
        <td>TextInputAction.done</td>
        <td>Same as TextField's textInputAction, not working in digit mode.</td>
    </tr>
    <tr>
        <td>enabled</td>
        <td>true</td>
        <td>Same as TextField's enabled, the default is true</td>
    </tr>
</table>

### ObscureStyle

```
/// Determine whether replace [obscureText] with number.
final bool isTextObscure;
/// The display text when [isTextObscure] is true
final String obscureText;
```

## Known Issue

The `PinEditingController` listener will execute more than once in some situations, you can filter some duplicate values in your code. 
## Github主页 👉[TinoGuo/pin_input_text_field](http://github.com/TinoGuo/pin_input_text_field)