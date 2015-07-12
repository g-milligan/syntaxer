(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  //TEMPLATE SCAFFOLD HINTS

  var temhints={
    'type="':{
      "__type": "attribute",
      "__summary":"Defines the type of an HTML element",
      "__complete":[
        {value:{
          options:function(){
            return ['text/css'];
          },
          post:"\"",type:"attribute value",
          summary:"The type of the HTML element"
        }}
      ]
    }
  };

  CodeMirror.registerHelper("hint", "template", function(editor, options) {
    var completion;
    if(editor['suggestTabNameHint']){
      var itemTxt='<finish tab name placeholder>';
      var list=[itemTxt];
      //current cursor position data
      var cur = editor.getCursor(), curLine = editor.getLine(cur.line);
      var end = cur.ch, start = end;
      //completion list info
      completion={list: list,
        from: CodeMirror.Pos(cur.line, start),
        to: CodeMirror.Pos(cur.line, end)};
      //event for picking a hint option
      CodeMirror.on(completion,'pick',function(pickedOption){
        //get the range to replace (replace itemTxt)
        var newCur = editor.getCursor();
        var line=editor.getLine(newCur.line);
        var tabName=line.substring(line.indexOf('[')+'['.length);
        var tabNameLength=tabName.length-itemTxt.length;
        tabName=tabName.substring(0, tabNameLength);
        //get the comments around the tab placeholder
        var beforeTabName=line.substring(0, line.indexOf('['));
        beforeTabName=beforeTabName.trim();
        var afterTabName="";
        switch(beforeTabName){
          case '/*': afterTabName=' */'; break;
          case '<!--': afterTabName=' -->'; break;
        }
        if(beforeTabName.length>0){beforeTabName+=' ';}
        //build the autocomplete format
        var format="";
        format+=beforeTabName+'['+tabName+']'+afterTabName+'\n\n';
        format+=beforeTabName+'[/'+tabName+']'+afterTabName;
        //set the tab name syntax tags
        editor.replaceRange(format,
          CodeMirror.Pos(newCur.line, 0),
          CodeMirror.Pos(newCur.line, line.length)
        );
      });
    }else{
      //['=',';'] = an array of characters to consume up to in the line left of the cursor, BEFORE trying to match a hint info chain pattern
      completion=handleJsonHints(editor, temhints, options.eventTrigger, ['>']);
    }
    return completion;
  });
});
