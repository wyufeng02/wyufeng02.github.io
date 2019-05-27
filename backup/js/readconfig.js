
  function ReadText(){
    var arr=GetHeader("a.txt").split("\r\n");
    for(var i=0;i<arr.length;i++){
    // alert（"第"+（i+1）+"行数据为："+arr[i]);
      console.log("row:"+arr[i]);
    }
  }
 