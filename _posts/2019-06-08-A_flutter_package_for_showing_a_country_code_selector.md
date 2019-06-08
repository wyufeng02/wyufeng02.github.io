---
layout: post
title:  用于显示国家/地区代码选择器的flutter包
tag: Picker, Country
date: 2019-06-08
---

 

## [查看Github/imtoori/CountryCodePicker](http://github.com/imtoori/CountryCodePicker)
## [立即下载 ️⬇️ ](https://codeload.github.com/imtoori/CountryCodePicker/zip/master) 


 
![](https://flutterawesome.com/content/images/2019/03/country_code_pickerc.jpg)
 
>
> 用于显示国家/地区代码选择器的flutter包。
>

 
[![Pub](https://img.shields.io/badge/Pub-1.1.5-orange.svg)](https://pub.dartlang.org/packages/country_code_picker)

# country_code_picker

A flutter package for showing a country code selector.

<img src="https://raw.githubusercontent.com/Salvatore-Giordano/CountryCodePicker/master/screenshots/screen1.png" width="240"/>
<img src="https://raw.githubusercontent.com/Salvatore-Giordano/CountryCodePicker/master/screenshots/screen2.png" width="240"/>

## Usage

Just put the component in your application setting the onChanged callback.

```dart

@override
 Widget build(BuildContext context) => new Scaffold(
     body: new Center(
       child: new CountryCodePicker(
         onChanged: print,
         // Initial selection and favorite can be one of code ('IT') OR dial_code('+39')
         initialSelection: 'IT',
         favorite: ['+39','FR'],
         // optional. Shows only country name and flag
         showCountryOnly: false,
         // optional. Shows only country name and flag when popup is closed.
         showOnlyCountryCodeWhenClosed: false,
         // optional. aligns the flag and the Text left
         alignLeft: false,
       ),
     ),
 );

```

Note: Your onChanged function can be any function of the type shown below:

```dart
(CountryCode)->dynamic

```

Example:

```dart

void _onCountryChange(CountryCode countryCode) {
    //Todo : manipulate the selected country code here
    print("New Country selected: " + countryCode.toString());
  }

```

## Contributions

Contributions of any kind are more than welcome! Feel free to fork and improve country_code_picker in any way you want, make a pull request, or open an issue.

