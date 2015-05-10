//get the line string before and after the cursor
function getLineSplit(editor){
  var cur=editor.getCursor();
  var cIndex=cur.ch;
  var lIndex=cur.line;
  var lStr=editor.getLine(lIndex);
  var preStr=lStr.substring(0, cIndex);
  var aftStr=lStr.substring(cIndex);
  return [preStr,aftStr];
}
function getAutocompleteOptions(lineBeforeCursor,hintsJson){
  var options=[]; var triggerText=''; var triggerParts=[]; var partialEntry=false;
  var getNextKeys=function(st,json,index){
    //figure out which start keys are in the str
    var partialIndex=0;
    for(var key in json){
      if(json.hasOwnProperty(key)){
        if(key.indexOf('__')!==0){
          //this keyword follows the previous keyword?
          var isChained=false;
          if(index===0){
            if(st.indexOf(key)!==-1){
              isChained=true;
              triggerText+=key;
              triggerParts.push(key);
            }
          }else{
            if(st.indexOf(key)===0){
              isChained=true;
            }else{
              if(st.length<key.length){
                //if this st is incomplete and could be completed as this key
                if(key.indexOf(st)===0){
                  options.push(key);
                  //if this is the first item in this level
                  if(partialIndex===0){
                    triggerText+=st;
                    triggerParts.push(st);
                    partialEntry=true;
                  }
                  //next partial option
                  partialIndex++;
                }
              }
            }
          }
          if(isChained){
            //remove this keyword from the string
            var shorterStr=st;
            shorterStr=shorterStr.substring(shorterStr.indexOf(key)+key.length);
            //if not at the cursor
            if(shorterStr.length>0){
              //recursive call
              getNextKeys(shorterStr,json[key],index+1);
            }else{
              //at the cursor... get each of the possible next items
              for(var subKey in json[key]){
                if(json[key].hasOwnProperty(subKey)){
                  if(subKey.indexOf('__')!==0){
                    options.push(subKey);
                  }
                }
              }
            }
          }
        }
      }
    }
  };
  //start getting the applicable options depending on text entry so far
  getNextKeys(lineBeforeCursor,hintsJson,0);
  //if there are any options available
  if(options.length>0){
    //add blank choice end (prevents auto writing the option if there is only one choice)
    options.push('');
  }
  var ret={options:options, triggerText:triggerText, triggerParts:triggerParts, partialEntry:partialEntry};
  return ret;
}
//generic handle hints depending on hintsJson data
function handleJsonHints(editor, hintsJson){
  //get the autocomplete data including the possible options and the text that triggered these options
  var lineSplit=getLineSplit(editor);
  var aJson=getAutocompleteOptions(lineSplit[0], hintsJson);
  var list=aJson['options'];
  var triggerParts=aJson['triggerParts'];
  //get the cursor position to figure out what existing text (if any) should be removed before autocomplete happens
  var cur = editor.getCursor(), curLine = editor.getLine(cur.line);
  var end = cur.ch, start = end;
  //if there is partial text that should be removed before autocomplete happens
  if(aJson['partialEntry']){
    //if there are any daisy-chained keywords, "parts"
    if(triggerParts.length>0){
      //get the last daisy chained word in the series
      var lastPart=triggerParts[triggerParts.length-1];
      //delete this word before writing it again in the editor
      start-=lastPart.length;
    }
  }
  //return
  return {list: list,
    from: CodeMirror.Pos(cur.line, start),
    to: CodeMirror.Pos(cur.line, end)};
}
