---
layout: post
title:  Flutter版俄罗斯方块游戏
tag: [code4flutter,flutterAwesome , Games]
date: 2019-06-10
---

 


## [立即下载 ️⬇️ ](https://codeload.github.com/GLodi/squazzle/zip/master) 


 
![](https://flutterawesome.com/content/images/2019/06/squazzle-1.jpg)
 
>
> 这个应用程序实现了Didier Boelens的BLoC方法。
>

 
# Squazzle

...a Square Puzzle Flutter game! 

The goal is to reproduce the top right pattern
on the 9 center squares with as few moves as possible.

STILL IN DEVELOPMENT 

<div align="center">
	<img src="https://raw.githubusercontent.com/GLodi/squazzle/master/gfx/screen.png" width="256"/>
</div>

## Architecture

This app implements [Didier Boelens'](https://www.didierboelens.com/2018/12/reactive-programming---streams---bloc---practical-use-cases/) approach to BLoC.

我们的想法是通过对events的控制界面来显示数据。
为了简化状态管理，我还实现了EventStates：
基于事件发出新窗口小部件状态的组合。
## Features

- 单人玩家

  该应用程序附带了500个目标字段+游戏字段组合的sql db。 一个随机的
  组合是随机选择的。
 
- 多人游戏

多人游戏由Firebase处理。 您可以在目录功能下找到Firebase项目。
仍处于开发阶段，但您可以将其复制到Firebase项目中并尝试一下。

## Github主页 👉[GLodi/squazzle](http://github.com/GLodi/squazzle)