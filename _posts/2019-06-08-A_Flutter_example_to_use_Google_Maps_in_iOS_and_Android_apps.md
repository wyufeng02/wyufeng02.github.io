---
layout: post
title:  在iOS和Android应用中使用Google地图的一个例子
tag: Maps
date: 2019-06-08
---

 

## [查看Github/gerryhigh/Flutter-Google-Maps-Demo](http://github.com/gerryhigh/Flutter-Google-Maps-Demo)
## [立即下载 ️⬇️ ](https://codeload.github.com/gerryhigh/Flutter-Google-Maps-Demo/zip/master) 


 
![](https://flutterawesome.com/content/images/2018/12/Flutter-Google-Maps-Demo.jpg)
 
>
> 通过嵌入式Google Maps插件Google Maps Plugin在iOS和Android应用中使用Google地图的一个例子。
>

 
# maps_demo

A Flutter example to use [Google Maps](https://developers.google.com/maps/) in
iOS and Android apps via the embedded Google Maps plugin [Google Maps Plugin](https://github.com/flutter/plugins/tree/master/packages/google_maps_flutter) 

## Getting Started

Get an API key at <https://cloud.google.com/maps-platform/>.

### Android

Specify your API key in the application manifest `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest ...
  <application ...
    <meta-data android:name="com.google.android.geo.API_KEY"
               android:value="YOUR KEY HERE"/>
```

### iOS

Supply your API key in the application delegate `ios/Runner/AppDelegate.m`:

```objectivec
#include "AppDelegate.h"
#include "GeneratedPluginRegistrant.h"
#import "GoogleMaps/GoogleMaps.h"

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application
    didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  [GMSServices provideAPIKey:@"YOUR KEY HERE"];
  [GeneratedPluginRegistrant registerWithRegistry:self];
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}
@end
```

See screenshots below:<br><br>
<img src="https://raw.githubusercontent.com/gerryhigh/Flutter-Google-Maps-Demo/master/screen1.png" alt="Home" width="350"/>
<br><br>

<img src="https://raw.githubusercontent.com/gerryhigh/Flutter-Google-Maps-Demo/master/screen2.png" alt="Venues Page"  width="350"/>
<br><br>
<img src="https://raw.githubusercontent.com/gerryhigh/Flutter-Google-Maps-Demo/master/screen3.png" alt="Detail1"  width="350"/>
<br><br>
<img src="https://raw.githubusercontent.com/gerryhigh/Flutter-Google-Maps-Demo/master/screen4.png" alt="Venue 2"  width="350"/>
<br><br>
<img src="https://raw.githubusercontent.com/gerryhigh/Flutter-Google-Maps-Demo/master/screen5.png" alt="Detail 2"  width="350"/>

