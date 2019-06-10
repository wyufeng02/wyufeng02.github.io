---
layout: post
title:  手把手教你编译Flutter engine
tag: flutter engine
date: 2019-05-29 
---



![一图说明](https://user-gold-cdn.xitu.io/2018/12/27/167ef431a0b6cfa6?w=1240&h=698&f=png&s=178451)

欢迎关注姊妹篇[《手把手教你解决flutter engine内存泄漏》](https://www.jianshu.com/p/49126e9af764)

flutter已经到了1.5了，小伙伴还没有使用的赶紧试试吧，如果想更深入的把玩，可以尝试编译一下官方的flutter engine，地址在 https://github.com/flutter/engine

### 为什么要编译engine
1. 学习
2. 改造
第二篇会介绍怎么样改造engine来解决内存泄漏问题，满足自己业务需求。

### 事前准备
* 机器，linux，mac，或windows
*  git 命令
*  IDE , android stuido或xcode，如需编译x86模拟器版还需xcode9.4版本
* ssh客户端，用户github身份验证
* python，默认自带
* gclient 注意要经常更新 [安装地址👉](http://commondatastorage.googleapis.com/chrome-infra-docs/flat/depot_tools/docs/html/depot_tools_tutorial.html#_setting_up)
*  也可以直接使用命令安装`depot_tools`
```
$ git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git
$ export PATH=$PATH:/path/to/depot_tools
```
* python --version 需要2.7版本
### 如何编
#### 1. 下载
* 1.1 从官网fork工程到自己工程，https://github.com/flutter/engine
* 1.2  配置ssh秘钥  [https://help.github.com/articles/generating-ssh-keys/](https://help.github.com/articles/generating-ssh-keys/)
* 1.3 在flutter工程的同级目录执行 `gclone xxx`,  xxx为你自己fork后的engine地址，为了后面方便 
* 1.4 在engine目录创建`.gclient`文件  ,执行
```
$ vim .gclient
```
内容为
```
solutions = [
  {
    "managed": False,
    "name": "src/flutter",
    "url": "git@github.com:<your_name_here>/engine.git",
    "custom_deps": {},
    "deps_file": "DEPS",
    "safesync_url": "",
  },
]
```

* 1.5    切换到engine目录


```
$ cd engine
```

* 1.6 获取Flutter所依赖的所有源代码，时间超长，大概一个半小时

```
$ gclient sync
```

* 1.7  进入src/flutter目录，拉取操作



```
$ cd src/flutter
$ git remote add upstream git@github.com:flutter/engine.git
$ git pull upstream master
```
后面的操作不要看官方的了，最好的文档已经江湖失传了，仅此一篇

#### 2 回滚
*  2.1   找到当前flutter对应的engine版本
类似

```
$  cat /Users/boo/Documents/flutter/bin/internal/engine.version 
```

如1.5.4 hot fix版的engine版本号，这是一个commit号

```
52c7a1e849a170be4b2b2fe34142ca2c0a6fea1f
```

* 2.2 回滚当时提交版本
执行命令
``` 
bogon:src boo$ git reset --hard 52c7a1e849a170be4b2b2fe34142ca2c0a6fea1f 
HEAD is now at 52c7a1 Fix dart/create_updated_flutter_deps script so it actually updates flutter/DEPS. (#175)

```

查看当前版本号

```
$  git rev-parse HEAD
```

只同步指定commit版本命令


```
gclient sync --with_branch_heads --with_tags  
```

#### 3. 创建engine工程
编译选项具体可以参考 [https://github.com/Natoto/flutterOnExistApp/wiki/%E5%B8%B8%E7%94%A8%E7%BC%96%E8%AF%91%E5%91%BD%E4%BB%A4](https://github.com/Natoto/flutterOnExistApp/wiki/%E5%B8%B8%E7%94%A8%E7%BC%96%E8%AF%91%E5%91%BD%E4%BB%A4)

以ios为例 

生成ios设备用的未经编译的工程
```
$ ./flutter/tools/gn --ios --unoptimized
```
生成ios设备用的工程，不带符号表
```
./flutter/tools/gn --ios
```

生成release工程 
```
$ ./flutter/tools/gn --ios --runtime-mode=release
```

生成模拟器版本工程
```
./flutter/tools/gn --ios --simulator 
```

生成模拟器用的未优化版本
```
./flutter/tools/gn --ios --simulator --unoptimized  
```

也可以可以指定cpu
```
./flutter/tools/gn --runtime-mode=release --ios --ios-cpu=arm64
```

#### 4. 编译
一种编译模式三千多个文件，大概一个半小时

编译relase工程 
```
$ ninja -C out/ios_release
```

编译设备用debug模式
```
 ninja -C out/ios_debug && ninja -C out/host_debug
```

编译设备用debug模式,带符号
```
 ninja -C out/ios_debug_unopt && ninja -C out/host_debug_unopt
```
编译模拟器用debug模式

```
 ninja -C out/ios_debug_sim_unopt && ninja -C out/host_debug_unopt
```

### 如何用
经过漫长的编译之后，终于可以看到产物了，flutter.framework
就是对应模式的产物
有两种使用方法，一边开发一边测试，或无需修改，直接使用
1.  在工程中使用
```
flutter run --local-engine-src-path /Users/boo/Documents/engine/src --local-engine=ios_debug_unopt
```

2. 直接拷贝替换掉flutter目录里面的engine就可以立即使用了
`/Users/boo/Documents/flutter/bin/cache/artifacts/engine `



 ---
 
 ### Flutter技术积累相关链接

[一行代码教你解决FlutterPlatformViews内存泄露 by 
AShawn ](https://juejin.im/post/5c6e6dd5f265da2dcf62821f)

[手把手教你在Flutter项目优雅的使用ORM数据库 by 
williamwen1986](https://juejin.im/post/5c45c72d6fb9a049d81c2b4c)

 [flutter通用基础库flutter\_luakit_plugin  by 
williamwen1986](https://juejin.im/post/5c34597651882523d3200c98) 

 [github - flutter\_luakit\_plugin使用例子  by 
williamwen1986](https://github.com/williamwen1986/flutter_luakit_demo) 
 
 [手把手教你编译Flutter engine by 共田君](https://juejin.im/post/5c24acd5f265da6164141236 ) 
 
 [手把手教你解决 Flutter engine 内存泄漏 by 共田君](https://juejin.im/post/5c24ad306fb9a049d2361cff) 
  
 [github - 编译产物下载 修复内存泄漏后的flutter engine（可直接使用）by 共田君](https://github.com/Natoto/fixFlutterEngine)</font>
 
 [github demo - 修复内存泄漏后的flutter engine by 共田君](https://github.com/Natoto/flutterOnExistApp/tree/multiflutter) 
 