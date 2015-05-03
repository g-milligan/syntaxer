jQuery(document).ready(function(){
  //init the editor textarea
  var myCodeMirror = CodeMirror(document.body, {
    value: "function myScript(){return 100;}\n",
    lineNumbers:true,
    mode:  "javascript"
  });

});
