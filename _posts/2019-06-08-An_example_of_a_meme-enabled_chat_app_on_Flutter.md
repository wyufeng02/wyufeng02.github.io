---
layout: post
title:  Flutter上启用meme的聊天应用程序示例
tag: Chat
date: 2019-06-08
---

# [Flutter上启用meme的聊天应用程序示例 ](http://github.com/efortuna/memechat) 



## [查看Github/efortuna/memechat](http://github.com/efortuna/memechat)
## [立即下载 ️⬇️ ](https://codeload.github.com/efortuna/memechat/zip/master) 


 
![](https://flutterawesome.com/content/images/2018/10/MemeChat.jpg)
 
>
> 使用Firebase，Google登录和设备相机集成的Flutter上启用meme的聊天应用的示例。
>

 
# MemeChat
An example of a meme-enabled chat app on Flutter, using Firebase, Google Sign In, and device camera integration. 

MemeChat contains platform-specific elements for Android and iOS.

## Flutter and Firebase Setup
1. Follow the installation instructions on www.flutter.io to install Flutter.
2. You'll need to create a Firebase instance. Follow the instructions at https://console.firebase.google.com.
3. Once your Firebase instance is created, you'll need to enable anonymous and Google authentication.
    - Go to the Firebase Console for your new instance.
    - Click "Authentication" in the left-hand menu
    - Click the "sign-in method" tab
    - Click "anonymous" and enable it
    - Click "Google" and enable it
4. Next, click "Database" in the left-hand menu.  Create a real-time database and start in test mode. Click "Enable".
5. Finally, click "Storage" in the left-hand menu.  Enable it.

## Android Setup
1. Create an app within your Firebase instance for Android, with package name com.yourcompany.memechat 
2. Follow instructions to download google-services.json, and place it into `memechat/android/app/`
3. Run the following command to get your SHA-1 key:
```
keytool -exportcert -list -v \
-alias androiddebugkey -keystore ~/.android/debug.keystore
```
4. In the Firebase console, in the settings of your Android app, add your SHA-1 key by clicking "Add Fingerprint".

## iOS Setup
1. Create an app within your Firebase instance for iOS, with package name com.yourcompany.memechat
2. Follow instructions to download GoogleService-Info.plist, and place it into `memechat/ios/Runner`
3. Open `memechat/ios/Runner/Info.plist`. Locate the CFBundleURLSchemes key. The second item in the array value of this key is specific to the Firebase instance. Replace it with the value for REVERSED_CLIENT_ID from GoogleService-Info.plist

## Run the App
MemeChat can be run like any other Flutter app, either through the IntelliJ UI or through running the following command from within the MemeChat directory:

```
flutter run
```

