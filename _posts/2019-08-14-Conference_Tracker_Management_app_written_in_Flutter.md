---
layout: post
title:  Conference Tracker Management app written in Flutter
tag: [flutter代码库, Miscellaneous]
date: 2019-08-14
---

 


## [立即下载 ️⬇️ ](https://codeload.github.com/lesliearkorful/conference-tracker-management/zip/master) 


 
![](https://flutterawesome.com/content/images/2019/07/conference-tracker-management.jpg)
 
>
> This is a Flutter project for tracking conferences and generating a schedule from input. The conference has multiple tracks each of which has a morning and afternoon session.
>

 
# Conference Tracker Management

This is a Flutter project for tracking conferences and generating a schedule from input.
The conference has multiple tracks each of which has a morning and afternoon session.
Each session contains multiple talks.
Morning sessions begin at 9am and must finish by 12 noon, for lunch.
Afternoon sessions begin at 1pm and must finish in time for the networking event.
The networking event can start no earlier than 4:00 and no later than 5:00.
No talk title has numbers in it.
All talk lengths are either in minutes (not hours) or lightning (5 minutes).


## Getting Started

- You need to have the [Flutter SDK installed.](https://flutter.dev/docs/get-started/install)
- Clone this repository on your computer with the following command:
```
git clone https://github.com/lesliearkorful/conference-tracker-management.git
```
- Depending on the configuration you chose from the Flutter installation documentation, start a debug session and have a live preview of the app.

## Dependencies
This project uses the [rxDart package](https://pub.dev/packages/rxdart) for streams.
The `flutter_test` package is pre-installed in Flutter for running widget tests.
```yaml
dependencies:
  rxdart: ^0.22.0

dev_dependencies:
  flutter_test:
    sdk: flutter
```
## Testing
To run tests (widget testing precisely), run the following command (by terminal) in the root folder. 
```
flutter test
```
## Screenshots
Screenshots of the four screens of the app.

<table>
  <tr>
    <td>
      <img src="https://github.com/lesliearkorful/conference-tracker-management/blob/master/screenshots/01-all-conferences.png?raw=true" />
    </td>
    <td>
      <img src="https://github.com/lesliearkorful/conference-tracker-management/blob/master/screenshots/03-new-talk.png?raw=true" />
    </td>
  </tr>
  <tr>
    <td>
      <img src="https://github.com/lesliearkorful/conference-tracker-management/blob/master/screenshots/02-edit-talk.png?raw=true" />
    </td>
    <td>
      <img src="https://github.com/lesliearkorful/conference-tracker-management/blob/master/screenshots/04-generated-schedule.png?raw=true" />
    </td>
  </tr>
</table>
For help getting started with Flutter, view our
[online documentation](https://flutter.dev/docs), which offers tutorials,
samples, guidance on mobile development, and a full API reference.

## Github主页 👉[lesliearkorful/conference-tracker-management](http://github.com/lesliearkorful/conference-tracker-management)