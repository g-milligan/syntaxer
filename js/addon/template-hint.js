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
          case '//': afterTabName=''; break;
          default:
            if(beforeTabName.length<1){
              var closeTag='', hasSurroundTags=false;
              //loop through each line before this one until reaching the opening HTML tag
              for(var u=newCur.line-1;u>-1;u--){
                var upLine=editor.getLine(u);
                if(upLine.indexOf('<')!==-1){
                  if(upLine.indexOf('</')!==-1){
                    break;
                  }else{
                    upLine=upLine.toLowerCase();
                    if(upLine.indexOf('<script')!==-1){closeTag='</script>'; break;}
                    else if(upLine.indexOf('<style')!==-1){closeTag='</style>'; break;}
                  }
                }
              }
              if(closeTag.length>0){
                //confirm the correct closing HTML tag appears after the cursor position
                var lineCount=editor.lineCount();
                for(var d=newCur.line+1;d<lineCount;d++){
                  var downLine=editor.getLine(d);
                  if(downLine.indexOf(closeTag)!==-1){
                    hasSurroundTags=true; break;
                  }else if(downLine.indexOf('<')!==-1){ break; }
                }
              }
              if(hasSurroundTags){
                //choose a type of comment based on the surrounding HTML tag element
                switch(closeTag){
                  case '</script>': beforeTabName='/*'; afterTabName=' */'; break;
                  case '</style>': beforeTabName='/*'; afterTabName=' */'; break;
                }
              }
              //not surrounded by <style> or <script> ?
              if(beforeTabName.length<1){
                //must be inside plain html
                beforeTabName='<!--'; afterTabName=' -->';
              }
            }
            break;
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
