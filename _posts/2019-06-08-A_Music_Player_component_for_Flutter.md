---
layout: post
title:  Flutter的音乐播放器组件
tag: Music Player, Templates
date: 2019-06-08
---

# [Flutter的音乐播放器组件 ](http://github.com/thosakwe/flutter_music_player) 



## [查看Github/thosakwe/flutter_music_player](http://github.com/thosakwe/flutter_music_player)
## [立即下载 ️⬇️ ](https://codeload.github.com/thosakwe/flutter_music_player/zip/master) 


 
![](https://flutterawesome.com/content/images/2018/10/music_player.jpg)
 
>
> Flutter的音乐播放器组件（即Spotify，Apple Music等）
>

 
# music_player
![Fullscreen screenshot](https://raw.githubusercontent.com/thosakwe/flutter_music_player/master/screenshots/fullscreen.png)

A music player component for Flutter (i.e. Spotify, Apple Music, etc.).

This is ready-to-go for embedding in a music-playing application.
It supports seeking, as well as having callbacks for
skipping, shuffling, and looping.

## Installation
This package is not yet on Pub (I haven't figured out how to test it),
so in the meantime:

```yaml
dependencies:
  flutter: sdk
  music_player:
    git: https://github.com/thosakwe/flutter_music_player.git
```

## Usage
```dart
class MyWidget extends StatelessWidget {
    @override
    build(BuildContext context) {
        return new MusicPlayer(
            onError: (e) {
                Scaffold.of(context).showSnackBar(
                    new SnackBar(
                        content: new Text(e),
                    ),
                );
            },
            onSkipPrevious: () {},
            onSkipNext: () {},
            onCompleted: () {},
            onLoopChanged: (loop) {
                setState(() => this.loopKind = loop);
            },
            onShuffleChanged: (loop) {
                setState(() => this.shuffle = loop);
            },
            key: musicPlayerKey,
            textColor: Colors.white,
            loop: loopKind,
            shuffle: shuffle,
            url: mp3Url,
            title: const Text(
                'BBC',
                textAlign: TextAlign.center,
                textScaleFactor: 1.5,
                style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                ),
            ),
            subtitle: const Text(
                'JAY Z - Holy Grail',
                textAlign: TextAlign.center,
                style: const TextStyle(
                    color: Colors.white,
                ),
            ),
        );
    }
}

