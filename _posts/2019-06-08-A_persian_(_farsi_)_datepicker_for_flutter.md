---
layout: post
title:  A persian ( farsi ) datepicker for flutter
tag: code4flutter,flutter code , Calendar, Picker, Datepicker
date: 2019-06-08
---

 


## [立即下载 ️⬇️ ](https://codeload.github.com/Ali-Azmoud/persian_datepicker/zip/master) 


 
![](https://flutterawesome.com/content/images/2019/01/ersian_datepicker.jpg)
 
>
> A persian ( farsi ) datepicker for flutter.
>

 
# Persian DatePicker & DateTime Manipulation
A persian ( farsi ) datepicker for flutter.  

to see an example of date conversion and manipulation, refer to `DateTime` section in this page.


### Usage

A simple example with a TextField which turns into a datepicker

**main.dart**

```dart

import 'package:flutter/material.dart';
import 'package:persian_datepicker/persian_datepicker.dart';


void main() {
  runApp(Home());
}

class Home extends StatefulWidget {
  @override
  HomeState createState() {
    return new HomeState();
  }
}

class HomeState extends State<Home> {

  // our text controller
  final TextEditingController textEditingController = TextEditingController();

  PersianDatePickerWidget persianDatePicker;

  @override
  void initState() {

    /*Simple DatePicker*/
    persianDatePicker = PersianDatePicker(
      controller: textEditingController,
//      datetime: '1397/06/09',
    ).init();

    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: Text('دیت پیکر ساده'),),
        body: Builder(builder: (BuildContext context) {


          return Container(
            child: TextField(
              enableInteractiveSelection: false, // *** this is important to prevent user interactive selection ***
              onTap: () {
                FocusScope.of(context).requestFocus(new FocusNode()); // to prevent opening default keyboard
                showModalBottomSheet(
                    context: context,
                    builder: (BuildContext context) {
                      return persianDatePicker;
                    });
              },
              controller: textEditingController,
            ),
          );



        }),
      ),
    );
  }
}

```

### HOW IT LOOKS

**Simple DatePicker**

![](https://raw.githubusercontent.com/Ali-Azmoud/persian_datepicker/master/simple.gif)

<br>
<br>
<br>
<br>

**Range DatePicker**

```dart
/*Range DatePicker*/
persianDatePicker = PersianDatePicker(
  controller: textEditingController,
  rangeDatePicker: true,
  // datetime: '1397/06/09',
  // finishDatetime: '1397/06/15',
).init();

```

![](https://raw.githubusercontent.com/Ali-Azmoud/persian_datepicker/master/range.gif)

<br>
<br>
<br>
<br>

**Inline DatePicker**

```dart
/*Inline DatePicker*/
persianDatePicker = PersianDatePicker(
  controller: textEditingController,
  datetime: '1397/06/19',
).init();


....


return Column(
  children: <Widget>[
    // Simple Date Picker
    Container(
      child: persianDatePicker, // just pass `persianDatePicker` variable as child with no ( )
    ),
    
    // you can omit TextField when using datepicker as inline
    TextField(
      enableInteractiveSelection: false,
      controller: textEditingController,
    ),
  ],
);
```

![](https://raw.githubusercontent.com/Ali-Azmoud/persian_datepicker/master/inline.gif)

<br>
<br>
<br>
<br>

**Customized DatePicker**

You can customize datepicker as you wish, there are a lot of options to set, below code is just a few of them.

```dart
/*Customized DatePicker*/
persianDatePicker = PersianDatePicker(
    controller: textEditingController,
    outputFormat: 'YYYY/MM/DD',
    datetime: '1397/08/29',
    finishDatetime: '1397/08/30',
    daysBorderWidth: 3,
    weekCaptionsBackgroundColor: Colors.red,
    headerBackgroundColor: Colors.blue.withOpacity(0.5),
    headerTextStyle: TextStyle(color: Colors.blue, fontSize: 17),
    headerTodayIcon: Icon(Icons.access_alarm, size: 15,),
    datePickerHeight: 280
).init();
```

![](https://raw.githubusercontent.com/Ali-Azmoud/persian_datepicker/master/customized.PNG)


<br>
<br>
<br>


```dart
/*Customized Font Family ( Farsi Digits )*/
persianDatePicker = PersianDatePicker(
    controller: textEditingController,
    farsiDigits: true
).init();
```

Or if you have a font which supports farsi digits then you can simply pass the font name and everything would be ok  

اگر فونتی در برنامه استفاده کرده اید که قابلیت نمایش اعداد فارسی را دارد تنها لازم است اسم فونت را به دیت پیکر بدهید

```dart
/*Customized Font Family ( Farsi Digits )*/
persianDatePicker = PersianDatePicker(
    controller: textEditingController,
    fontFamily: 'Vazir' // here I used Vazir font
).init();
```

![](https://raw.githubusercontent.com/Ali-Azmoud/persian_datepicker/master/font-family-vazir.PNG)


You can make day blocks rounded by using `dayBlockRadius` option

![](https://raw.githubusercontent.com/Ali-Azmoud/persian_datepicker/master/rounded.PNG)



<br>
<br>
<br>


### Events

`onChange`: fires after tapping on a day. It has two arguments, `oldText` and `newText` which represents the value of datepicker before-tap and after-tap respectively.

```dart
persianDatePicker = PersianDatePicker(
  controller: textEditingController,
  onChange: (String oldText, String newText) {
    print(oldText);
    print(newText);
  }
).init();
```


<br>
<br>
<br>
<hr>
<br>


### DateTime

in order to use `PersianDateTime` methods, you need to add following line into your file.  

```dart
import 'package:persian_datepicker/persian_datetime.dart';
```

You can now use following methods with `PersianDateTime` instances  
**implemented methods:**  

* toJalaali( format ) // see output formats  
* toGregorian( format ) // see output formats    
* isAfter  
* isBefore  
* difference  
* isEqual  
* add  
* subtract


All above methods work on `persian ( farsi )` dates. if you want to work with `gregorian` datetime use Dart DateTime class

```dart
PersianDateTime persianDate1 = PersianDateTime(jalaaliDateTime: '1397/06/09'); // default is now
/*
  persianDate1 contains following properties

  jalaaliYear               1397
  jalaaliMonth              6
  jalaaliDay                9
  jalaaliShortYear          97
  jalaaliZeroLeadingMonth   06
  jalaaliZeroLeadingDay     09
  jalaaliMonthName          شهریور

  gregorianYear             2018
  gregorianMonth            8
  gregorianDay              31
  gregorianShortYear        18
  gregorianZeroLeadingDay   31
  gregorianZeroLeadingMonth 08
  gregorianMonthName        October
  gregorianShortMonthName   Oct

  datetime                  Dart DateTime class of current persian date

 */
print(persianDate1.toGregorian()); // 2018-08-31
print(persianDate1.datetime); // 2018-08-31 00:00:00.000


PersianDateTime persianDate2 = persianDate1.add(Duration(days: 10));
print(persianDate2.isBefore(persianDate1)); // false
print(persianDate2.isAfter(persianDate1)); // true
print(persianDate2.difference(persianDate1).inDays); // 10
print(persianDate2.difference(persianDate1).inHours); // 240

PersianDateTime persianDate3 = PersianDateTime(); // default is now
print(persianDate3.isEqual(persianDate1)); // false



// you can accept date as gregorian using `.fromGregorian` constructor. it will automatically convert into jalaali date
PersianDateTime persianDate3 = PersianDateTime.fromGregorian(); // default is now
print(persianDate3.toJalaali(format: 'YYYY/MM/DD')); // 1397/11/19

```



<br>
<br>
<br>
<br>

### Output formats

`YYYY` full year  
`YY` 2 digits year  
`MMMM` full month name  ( **doesn't work in datepicker** )  
`MMM` short month name ( this only works in gregorian dates and also **doesn't work in datepicker** )  
`MM` leading zero month digit  
`M` month without leading zero  
`DD` leading zero day digit  
`D` day without leading zero 


<br>
<br>
<br>
<br>



### Important Notes نکات مهم

up to this version all output dates are in persian.  

تا این نسخه تمام تاریخ های خروجی پارسی(جلالی) هستند


`rangeSeparator` and your custom date separator should not be equal, otherwise datepicker will return null  

مقدار ورودی `rangeSeparator` و جداکننده ای که برای فرمت خروجی انتخاب کرده اید نباید یکی باشند در این صورت دیت پیکر خروجی `جداکننده های محدوده و خروجی مشابه هستند` برمیگرداند

<br>

Persian **input** dates must respect `YYYY/MM/DD` format. output format is up to you  
Gregorian **input** dates must respect `YYYY-MM-DD` format. output format is persian and up to you    

فرمت تاریخ های ورودی که پارسی (جلالی) هستند **باید** بصورت 
`YYYY/MM/DD`
باشد. فرمت خروجی به دلخواه شماست  

فرمت تاریخ های ورودی که میلادی هستند **باید** بصورت
`YYYY-MM-DD`
باشد. فرمت تاریخ خروجی، پارسی و به دلخواه شما خواهد بود

<br>

### Version 1.3 features

  /// حداکثر تاریخی که میتوان در دیت پیکر انتخاب کرد
  String maxDatetime;

  /// حداقل تاریخی که میتوان در دیت پیکر انتخاب کرد
  String minDatetime;

  /// حداکثر فاصله ای که تاریخ شروع و تاریخ پایان میتوانند نسبت به یکدیگر داشته باشند
  Duration maxSpan;

  /// حداقل فاصله ای که تاریخ شروع و تاریخ پایان میتوانند نسبت به یکدیگر داشته باشند
  Duration minSpan;
  
  
in order to update these options programmatically you can use `update` method, like so

```dart
...

  FlatButton(
      onPressed: () {
        minSpan = Duration(days: 10);
        setState(() {
          
          
          // here you can update the options
          persianDatePicker.update(
              minSpan: minSpan,
              minDatetime: '1397/12/19',
              maxDatetime: '1397/12/29');



        });
      },
      child: Container(
        child: Text('Update Datepicker'),
      ),
  )

...
```



### Examples
You can find the full example in the Git Repository, example directory

## Github主页 👉[Ali-Azmoud/persian_datepicker](http://github.com/Ali-Azmoud/persian_datepicker)