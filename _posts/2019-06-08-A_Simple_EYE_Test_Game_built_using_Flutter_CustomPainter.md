---
layout: post
title:  使用Flutter Custom Painter构建的简单EYE测试游戏
tag: Games
date: 2019-06-08
---

 


## [立即下载 ️⬇️ ](https://codeload.github.com/itzmeanjan/fCreate/zip/master) 
<p-4> 

 
![](https://flutterawesome.com/content/images/2019/04/fCreate.jpg)
 
>
> 一款简单的EYE测试游戏，由Flutter Custom Painter提供支持。
>

 
<p align="center"><img src="/logo/logotype-vertical.png"/></p>

# fCreate

A Simple EYE Test Game, powered by Flutter CustomPainter.

## Getting Started

 A simple Android Application built with :heart: using Flutter. This application is taking part in [Flutter Create Competition](https://flutter.dev/create). That's why it has limited capabilities, built using only **5112 bytes** Dart Code. And it's a Dart only application, targets *Android SDK version 28*.


## How's it working ?
  
  - Execution starts with *App()* class, which extends *StatelessWidget*.
  - As this application only targets *Android*, it's a *MaterialApp*.
  - As I'm going to add interactivity to our app, I need a *StatefulWidget*. *Home()* satisfies that need.
  - Due to code limit, I'm restricting my application to be only running in *Portrait mode*.
    ```dart
      SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
    ```
    
  - In the *build* method I'm returing a *Scaffold* Widget, which provides a sound Material Design skeleton.
  - *body* of *Scaffold* is a *Stack* widget, which is very good at handling hiding of overlapping widgets, depending upon certain criteria or user event, by using *Opacity* Widget as its parent.
  - Well I'm also using a *FloatingActionButton()*, to go to Game Widget, from Help Widget and vice versa.
    ```dart
      floatingActionButton: FloatingActionButton(
        onPressed: _e
            ? () {
                swap();
                // _tm holds a periodic Timer, which helps us to generate a new Paint widget, every 1 seconds.
                _tm = Timer.periodic(Duration(seconds: 1), (t) {
                  if (t.isActive)
                    setState(() {
                      _b = Random().nextInt(12) + 8; // _b, holds number of columns and rows, to be drawn in Paint widget
                      // which also gets updated in random fashion
                    });
                });
              }
            : () {
                swap();
                _tm.cancel(); // timer, _tm is cancelled, to avoid unnecessary periodic computational tasks.
              }, // here `e` is a boolean variable, which decides behaviour of this button
        child: Icon(_e ? Icons.play_arrow : Icons.help), // icon also gets updated
        backgroundColor: Colors.cyanAccent,
        elevation: 16,
        tooltip: _e ? 'Init' : 'Help', // tooltip text is also updated as value of `e` gets updated.
      ),
    ```
    
  - So, you've encountered a new function *swap()*, it just changes opacity value of two widgets and make them either visible or invisible.
    ```dart
      swap() {
    var tmp = _h; // simple swapping of `_h` and `_g` is done here.
    setState(() {
      _h = _g;
      _g = tmp;
      _e = !_e; // putting negation of `_e` into `_e`, helps us to change behaviour of floatingActionButton.
    });
    }
    ```
  
  - You may have already found a method called *setW()*, which is present due to implementation of *White* class in *_HomeState*.
    ```dart
      @override
    setW(int c) {
    if (!_tm.isActive)
      setState(() {
        _wh = c;
      });
    else
      _wh = c; // here I'm not interested in updating the UI too, that's why assignment is put outside of setState((){}).
      // otherwise that might collide with scheduled UI updated operation, which runs periodically using Timer, and updates CustomPaint widget.
    }
    ```
    
  - A *GestureDetector* widget is used as parent of *CustomPaint*, to handle user input event. A single tap denotes, that user selects currently shown Paint widget and wants to know whether he/ she has selected a widget which has atleast 50% white colored balls. In response to this event a *Dialog* shows up to indicate status of current selection.
    ```dart
      onTap: () {
                  if (_tm.isActive) {
                    _tm.cancel();
                    showDialog(
                        context: context,
                        builder: (cx) => Dialog(
                            elevation: 9,
                            child: Padding(
                                padding: EdgeInsets.all(16),
                                child: Text(
                                    '$_wh/${_b * _b} White Balls ${_wh >= (_b * _b) / 2 ? '\u{2714}' : '\u{2716}'}',
                                    style: TextStyle(
                                        fontSize: 25, letterSpacing: 2)))));
                  }
                },
    ```
    
  - Now if you double click on screen, cancelled timer starts running again. 
    ```dart
      
                onDoubleTap: () {
                  if (!_tm.isActive)
                    _tm = Timer.periodic(Duration(seconds: 1), (t) {
                      if (t.isActive)
                        setState(() {
                          _b = Random().nextInt(12) + 8;
                        });
                    });
                }
    ```
    
  - A center aligned widget is used a child of *Opacity*, to display help page. Changing opacity value reveals either help page or game page. Of course parent of these *Opacity* widget is *Stack* widget.
  
    ```dart
      Center(
                child: Padding(
                    padding: EdgeInsets.all(12),
                    child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: <Widget>[
                          Text('An EYE Test Game',
                              style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 3,
                                  fontSize: 30)),
                          Divider(color: Colors.white, height: 24),
                          Text(
                              'Click to reveal whether it has atleast 50% WHITE Balls. Double clicking restarts loop.',
                              maxLines: 3)
                        ])))
    ```
    
  - Lets talk about *Painter* class which subclasses *CustomPainter* and mainly takes care of painting operation to be performed in *CustomPaint* widget. *Painter*'s constructor takes two parameters, number of balls to be placed along row and column( it's a square ) and an instance of *White* class, which works as callback mechanism for updating value of white balls generated randomly during painting, stored in a variable which resides in *_HomeState* class.
  
  - As per definition of *CustomPainter*, need to override *paint()* and *shouldRepaint()* methods in *Painter*.
  
  - So, I'll be drawing some circles, for that I need an *Offset*. Position along X-axis and Y-axis is determined as follows.
  
    ```dart
    double y = size.height / (b * 2); // b is # of balls along x and y axis.
    double x = size.width / (b * 2); 
    ```
  - White ball count is determined as following one.
  
    ```dart
      w += (p.color == Colors.white) ? 1 : 0; // p variable holds instance of Paint(), which is instantiated just in previous line.
    ```
    
  - This is how circle is drawn in iterative fashion, using a while loop until we reach *size.width* along X-axis or *size.height* along Y-axis.
  
    ```dart
      canvas.drawCircle(
            Offset(x, y), min(size.height / (b * 2), size.width / (b * 2)), p); // radius of circle is decreased, so that no two circle gets overlapped.
    ```
 - In inner while loop of *paint()*, coordinate value of *x* is increased *size.width / b* in each iteration.
    ```dart
    x += size.width / b;
    ```
- Same for y too, in outer while loop.
  ```dart
  y += size.height / b;
  ```
- After drawing is done, number of white balls drawn on screen is updated, where *White* abstract class plays an role.
  ```dart
  wh.setW(w); // wh is an instance of WHite, which is passed into constructor of Painter.
  ```
  
- This is it.


## Screen Captures

 ![ScreenCapture 1](https://github.com/itzmeanjan/fCreate/blob/master/Screenshot_20190407-005819.png)
 ![ScreenCapture 2](https://github.com/itzmeanjan/fCreate/blob/master/Screenshot_20190407-005833.png)
 ![ScreenCapture 3](https://github.com/itzmeanjan/fCreate/blob/master/Screenshot_20190407-005845.png)



## Download 

 Release version of apk can be found [here](https://github.com/itzmeanjan/fCreate/blob/master/fCreate.apk).
  
## Courtesy
  
 Last but not least thanks to Flutter, Dart, Google and all other persons who're somehow associated with this project. Thanks for building such a great ecosystem.



For help getting started with Flutter, view our 
[online documentation](https://flutter.io/docs), which offers tutorials, 
samples, guidance on mobile development, and a full API reference.


Hope it was helpful :smile:

## Github主页 👉[itzmeanjan/fCreate](http://github.com/itzmeanjan/fCreate)