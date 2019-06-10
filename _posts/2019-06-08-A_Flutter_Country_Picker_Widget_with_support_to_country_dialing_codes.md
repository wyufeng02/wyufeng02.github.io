---
layout: post
title:  一个Flutter Country Picker Widget，支持国家拨号代码
tag: Picker, Country
date: 2019-06-08
---

 


## [立即下载 ️⬇️ ](https://codeload.github.com/biessek/flutter_country_picker/zip/master) 
<p-6> 

 
![](https://flutterawesome.com/content/images/2019/02/flutter_country_pickerx.jpg)
 
>
> 一个Flutter Country Picker Widget，支持国家拨号代码。
>

 
[![Pub](https://img.shields.io/badge/Pub-0.1.4-orange.svg?style=flat-square)](https://pub.dartlang.org/packages/flutter_country_picker)

# flutter_country_picker
A Flutter Country Picker Widget with support to country dialing codes

<img src="https://github.com/biessek/flutter_country_picker/blob/master/example/img/1.png?raw=true" width="200"/>  
<img src="https://github.com/biessek/flutter_country_picker/blob/master/example/img/2.png?raw=true" width="200"/>

## Usage

Add the CountryPicker widget in your layout and use the `onChanged` callback.  
[Full example](https://github.com/biessek/flutter_country_picker/tree/master/example)

 ```dart

// Option to show what to display of the selected country when 'dense' is false,
// Only displays country's flag when dense is true.


  @override
  Widget build(BuildContext context) {
    return new Scaffold(
      appBar: new AppBar(
        title: Text('Flutter Country Picker Demo'),
      ),
      body: new Center(
        child: CountryPicker(
          dense: false,
          showFlag: true,  //displays flag, true by default
          showDialingCode: false, //displays dialing code, false by default
          showName: true, //displays country name, true by default
          onChanged: (Country country) {
            setState(() {
              _selected = country;
            });
          },
          selectedCountry: _selected,
        ),
      ),
    );
  }

 ```

## Github主页 👉[biessek/flutter_country_picker](http://github.com/biessek/flutter_country_picker)