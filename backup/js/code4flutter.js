 
const uiclass0 = [
    "指示器 (ActivityIndicator)",
    "提醒对话框 (AlertView)",
    "导航条 (Navigation Bar)",
    "日历 (Calendar)",
    "相机 (Camera)",
    "透明指示层 (HUD)",
    ];
const uiclass1 = [
    "图像 (Image)",
    "键盘 (Keyboard)",
    "标签 (Label)",
    "地图 (Map)",
    "菜单 (Menu)",
    "按钮 (Button)",
    "选择器 (Picker)",
];
const uiclass2 = [
    "进度条 (Progress)",
    "滚动视图 (ScrollView)",
    "分段选择 (Segment)",
    "滑杆 (Slider)",
    "状态栏 (Status Bar)",
    "开关 (Switch)",
    "选项卡 (Tab Bar)",
    "列表 (Table)",
    "文字输入框 (TextField)",
    "文字视图 (TextView)",
    "网页 (Webview)",
];


const funclass0 = [ 
"游戏引擎(Unity)",
"动画 (Animation)",
"音视频 (Audio)",
"数据库 (Database)",
"游戏引擎 (cocos2d)",
"重力感应 (CoreMotion)",
"图表 (Chart)",
"绘图 (Drawing)",
];
const funclass1=[
"电子书 (eBook)",
"手势交互 (Gesture)",
"引导页 (Intro&Guide View)",
"网络 (Networking)",
"弹出视图 (Popup View)",
"社交分享 (Socialization)",
"视图效果 (View Effects)",
"视图布局 (View Layout)",
"视图切换 (View Transition)",
"其他 (Others)",
];
 window.onload = function(){

    console.log("window.onload.....");
    new Vue({
        el:'#parentdiv',
        data:{
            ctrtitle:"控件分类",
            ctrcls:[uiclass0,uiclass1,uiclass2], 
            funtitle:"功能分类",
            funcls:[funclass0,funclass0],
        },
        mounted:function(){  
             
        },
        methods: {
               
        },
    });

 }