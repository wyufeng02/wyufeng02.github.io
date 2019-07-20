---
layout: post
title:  
tag: [flutter代码库, Templates, Apps]
date: 2019-07-20
---

 


## [立即下载 ️⬇️ ](https://codeload.github.com/robertodoering/harpy/zip/master) 


 
![](https://flutterawesome.com/content/images/2019/07/harpy.jpg)
 
>
> Harpy是一款功能丰富的Twitter体验，适用于内置于Flutter的Android和iOS。
>

 
# Harpy

Harpy is a feature rich twitter experience for Android and iOS built in [Flutter](https://flutter.dev/).

Currently still in development.

Showcase
---
###### (Subject to change)

| Login | Setup |
| :---: | :---: |
| `login_screen.dart` | `setup_screen.dart` |
| ![Harpy Login](https://raw.githubusercontent.com/robertodoering/harpy/master/media/harpy_login.gif)  | ![Harpy Setup](https://raw.githubusercontent.com/robertodoering/harpy/master/media/harpy_setup.gif)  |

Development / Setup
---

- Twitter API Key
	- Create a yaml file `app_config.yaml` in `assets/config/` with the key and secret.
		```yaml
		twitter:
		  consumerKey: <key>
		  consumerSecret: <secret>
		```

- To generate json_serializable models:
`flutter packages pub run build_runner build`


## Github主页 👉[robertodoering/harpy](http://github.com/robertodoering/harpy)