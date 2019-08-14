require(["gitbook", "jQuery"], function(gitbook, $) {

    var root = (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]);

    gitbook.events.bind("start", function(e, config){
    });

    gitbook.events.bind("page.change", function(e){
        _hmt.push(['_trackEvent', location.pathname, 'page.change', '', '']);
    });

    var _hmt = _hmt || [];
    (function() {
    var hm = document.createElement("script");
    hm.src = "https://hm.baidu.com/hm.js?426f1e4464116c54060fd43355f14f53";
    var s = document.getElementsByTagName("script")[0]; 
    s.parentNode.insertBefore(hm, s);
    })();

});
