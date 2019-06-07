---
layout: post
title:  flutter翻转卡
tag: Cards
date: 2019-06-08
---

# [flutter翻转卡 ](http://github.com/fedeoo/flip_card) 



## [查看Github/fedeoo/flip_card](http://github.com/fedeoo/flip_card)
## [立即下载 ️⬇️ ](https://codeload.github.com/fedeoo/flip_card/zip/master) 


 
![](https://flutterawesome.com/content/images/2018/11/flip_card.gif)
 
>
> flutter翻转卡。
>

 
# flip_card

A component that provides flip card animation. It could be used for hide and show details of a product.

<p>
<img src="https://github.com/fedeoo/flip_card/blob/master/screenshots/flip-h.gif?raw=true&v1" width="320" />
<img src="https://github.com/fedeoo/flip_card/blob/master/screenshots/flip-v.gif?raw=true&v1" width="320" />
</p>

## How to use


````dart
import 'package:flip_card/flip_card.dart';
````

Create a flip card. The card will flip when touched

```dart
FlipCard(
  direction: FlipDirection.HORIZONTAL, // default
  front: Container(
        child: Text('Front'),
    ),
    back: Container(
        child: Text('Back'),
    ),
);
```

You can also configure the card to only flip when desired by using a `GlobalKey` to
toggle the cards:
```dart
GlobalKey<FlipCardState> cardKey = GlobalKey<FlipCardState>();

@override
Widget build(BuildContext context) {
  return FlipCard(
    key: cardKey,
    flipOnTouch: false,
    front: Container(
      child: RaisedButton(
        onPressed: () => cardKey.currentState.toggleCard(),
        child: Text('Toggle'),
      ),
    ),
    back: Container(
      child: Text('Back'),
    ),
  );
}
```


