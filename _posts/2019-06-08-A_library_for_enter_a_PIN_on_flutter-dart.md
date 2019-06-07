---
layout: post
title:  用于在flutter-dart上输入PIN的库
tag: Pin, Textfield
date: 2019-06-08
---

# [用于在flutter-dart上输入PIN的库 ](http://github.com/nsi4927/flutter-pinbox) 



## [查看Github/nsi4927/flutter-pinbox](http://github.com/nsi4927/flutter-pinbox)
## [立即下载 ️⬇️ ](https://codeload.github.com/nsi4927/flutter-pinbox/zip/master) 


 
![](https://flutterawesome.com/content/images/2019/05/flutter-pinbox.jpg)
 
>
> 这是一个用于在flutter/飞镖上输入PIN的库。
>

 
# flutter-pinbox
This is a library for enter a PIN on flutter/dart. You can enter one digit per textField box.

# The detail
The library locate at path lib/pinbox.dart.
You can use function pinBoxs to create a pin boxes. 
The function will return array of Widget class that contain many Pinbox.
<br/><br/>

<b>Function</b><br/>
<b>pinBoxs</b>(double width, List<TextEditingController> cons,
    Color boxColor, Color textColor, BuildContext context, bool show)
    
<b>width</b> = Width of one pin box<br/>
<b>cons</b> = Array of TextEditingController for each pin box<br/>
<b>boxColor</b> = color of pin box<br/>
<b>textColor</b> = color of text in pin box<br/>
<b>context</b> = BuildContext of the App<br/>
<b>show</b> = display digit to user or not (true => show, false => not show)


# Example
You can see the example of usage in path /lib/main.dart.
After you run the file you will get the result as two pictures below.


![image](https://github.com/nsi4927/flutter-pinbox/blob/master/imgs/PinBoxDemo1.png?raw=true)
![image](https://github.com/nsi4927/flutter-pinbox/blob/master/imgs/PinBoxDemo2.png?raw=true)
![image](https://github.com/nsi4927/flutter-pinbox/blob/master/imgs/PinBoxDemo3.png?raw=true)

