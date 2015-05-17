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
function getAutocompleteOptions(lineSplit,hintsJson,editor){
  var lineBeforeCursor=lineSplit[0]; var lineAfterCursor=lineSplit[1];
  var options=[]; var triggerText=''; var triggerParts=[]; var partialEntry=false;
  //*** save pre-dynamic autocomplete history so it can be deleted later?
  //function to replace dynamic values in keys





  /*var insertDynamicStr=function(str,jsonItem){
    var strs=[];
    var origStr=str;
    //if there are dynamic values in this string
    if(str.indexOf('__%')!==-1){
      //dynamic functions for this json (if any)
      var dynFuncs;
      if(jsonItem.hasOwnProperty('__%')){
        dynFuncs=jsonItem['__%'];
      }
      if(dynFuncs!=undefined){
        for(d in dynFuncs){
          if(dynFuncs.hasOwnProperty(d)){
            if(str.indexOf('__%'+d)!==-1){
              //get the dynamic value, if any
              var results=dynFuncs[d](editor);
              if(results!=undefined){
                //convert string to one-item array
                if(typeof results==='string'){
                  results=[results];
                }
                //for each different dynamic result
                var re=new RegExp('__%'+d,'g');
                for(var r=0;r<results.length;r++){
                  var resultStr=str;
                  //replace placeholder with result
                  resultStr=resultStr.replace(re,results[r]);
                  //if no more __%
                  if(resultStr.indexOf('__%')===-1){
                    //add this dynamic option to the json (to allow daisy chain after this dynamic option)
                    if(!jsonItem.hasOwnProperty(resultStr)){
                      jsonItem[resultStr]=jsonItem[origStr];
                      if(strs.indexOf(resultStr)===-1){
                        strs.push(resultStr);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }else{
      //no dynamic __%values in this str...

      //if no strings were added to the list
      if(strs.length<1){
        strs.push(str);
      }
    }
    return strs;
  };*/


  var addOption=function(newOption){
    if(options.indexOf(newOption)===-1){
      options.push(newOption);
    }
  };

  var addToTriggerText=function(str){
    triggerText+=str;
    triggerParts.push(str);
  };

  var isPartialOf=function(part, full){
    var is=false;
    //if part is at the start of full
    if(full.toLowerCase().indexOf(part.toLowerCase())===0){
      if(part.length<full.length){
        is=true;
      }
    }
    return is;
  };


  /*//function to recursively get keys, where trigger parts are parsed out of the st
  var getNextKeys=function(st,json,levelIndex){
    //figure out which start keys are in the str
    var partialIndex=0;
    for(var key in json){
      if(json.hasOwnProperty(key)){
        //if this is a key that could be an autocomplete value
        if(key.indexOf('__')!==0){
          //if this is the first level in the daisy chain of keywords
          var isChained=false;
          if(levelIndex===0){
            if(st.toLowerCase().indexOf(key.toLowerCase())!==-1){
              isChained=true;
              triggerText+=key;
              triggerParts.push(key);
              //remove string left of the first key (in case the first key appears more than once in one line)
              st=st.substring(st.toLowerCase().indexOf(key.toLowerCase()));
            }
          }else{
            //not first level in the word daisy-chain... if ***
            if(st.toLowerCase().indexOf(key.toLowerCase())===0){
              isChained=true;
              triggerText+=key;
              triggerParts.push(key);
            }else{
              if(st.length<key.length){
                //if this st is incomplete and could be completed as this key
                if(key.toLowerCase().indexOf(st.toLowerCase())===0){
                  addOption(key);
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
            shorterStr=shorterStr.substring(shorterStr.toLowerCase().indexOf(key.toLowerCase())+key.length);
            //if not at the cursor
            if(shorterStr.length>0){
              //recursive call
              getNextKeys(shorterStr,json[key],levelIndex+1);
            }else{
              //at the cursor... get each of the possible next items
              for(var subKey in json[key]){
                if(json[key].hasOwnProperty(subKey)){
                  if(subKey.indexOf('__')!==0){
                    addOption(subKey);
                  }
                }
              }
            }
          }
        }
      }
    }
  };*/

  //function to recursively get keys, where trigger parts are parsed out of the st
  var getNextKeys=function(st,json,levelIndex){
    if(levelIndex===0){
      //trim the left part of the string (string is the text left of the cursor)
      st=st.trimLeft();
      //if there is text in which to search for keys
      if(st.length>0){
        var triggerTxtUpdated=false;
        //==SELECT FIRST LEVEL KEYS==
        for(var key in json){
          if(json.hasOwnProperty(key)){
            //if this is a key that could be an autocomplete value
            if(key.indexOf('__')!==0){
              //if the text may surpass the length of this key
              if(st.length>key.length){
                //if key is the first part of st
                if(isPartialOf(key, st)){
                  //recursive call to the second level of possible text options



                  //*** this is where there could be a dead-end for triggerParts, etc... loop through possible keys? in json[key]???



                  var shorterKey=st.substring(key.length);
                  getNextKeys(shorterKey,json[key],levelIndex+1);
                }
              //if the text could match the key exactly
              }else if(st.length===key.length){
                if(st.toLowerCase()===key.toLowerCase()){
                  //recursive call to the second level of possible text options
                  getNextKeys('',json[key],levelIndex+1);
                  //if trigger text not already updated for this level
                  if(!triggerTxtUpdated){
                    addToTriggerText(st); triggerTxtUpdated=true;
                  }
                }
              //if the text may be an incomplete (partial-entry) of a key
              }else if(st.length<key.length){
                //if st is the first part of key
                if(isPartialOf(st, key)){
                  //add autocomplete option
                  addOption(key);
                  partialEntry=true;
                  //if trigger text not already updated for this level
                  if(!triggerTxtUpdated){
                    addToTriggerText(st); triggerTxtUpdated=true;
                  }
                }
              }
            }
          }
        }
      }
    }else{
      //==SELECT SUB LEVEL KEYS==
      for(var key in json){
        if(json.hasOwnProperty(key)){
          //if this is a key that could be an autocomplete value
          if(key.indexOf('__')!==0){
            //if reached the end of the string, left of the cursor
            if(st.length<1){
              //add autocomplete option
              addOption(key);
            }
            //if the text may surpass the length of this key
            else if(st.length>key.length){
              //if key is the first part of st
              if(isPartialOf(key, st)){
                //***
              }
            //if the text could match the key exactly
            }else if(st.length===key.length){
              if(st.toLowerCase()===key.toLowerCase()){
                //***
              }
            //if the text may be an incomplete (partial-entry) of a key
            }else if(st.length<key.length){
              //if st is the first part of key
              if(isPartialOf(st, key)){
                //***
              }
            }
          }
        }
      }
    }
  };




  //start getting the applicable options depending on text entry so far
  getNextKeys(lineBeforeCursor,hintsJson,0);
  //return data
  var ret={options:options, triggerText:triggerText, triggerParts:triggerParts, partialEntry:partialEntry};
  return ret;
}
//add icons, summaries, tooltips, and sub menus to hints menu
var decorate_hints_menu_timeout;
function decorateHintsMenu(aJson,hintsJson,tries){
  if(tries==undefined){tries=0;}
  //delay so that the hints menu will be open
  clearTimeout(decorate_hints_menu_timeout);
  decorate_hints_menu_timeout=setTimeout(function(){
    var ul=jQuery('.CodeMirror-hints:first');
    if(ul.length>0){
      //get the json values for these option items (same level)
      var triggerParts=aJson['triggerParts'];
      var json=hintsJson;
      for(var p=0;p<triggerParts.length;p++){
        //if last trigger part
        if(p+1===triggerParts.length){
          //if the last part is NOT incomplete
          if(!aJson['partialEntry']){
            json=json[triggerParts[p]];
          }
        }else{
          //not last trigger part
          json=json[triggerParts[p]];
        }
      };
      //for each option in the dropdown
      var isFirst=true;
      ul.children('li.CodeMirror-hint').each(function(){
        var li=jQuery(this);
        var liTxt=li.text();
        if(json.hasOwnProperty(liTxt)){
          //if this is the first hint item to decorate
          if(isFirst){
            isFirst=false;
            //add help summary for all items, if available
            if(json.hasOwnProperty('__summary')){
              var summary=json['__summary'].trim();
              if(summary.length>0){
                console.log(summary); //***
              }
            }
          }
          //decorate one hint item
          var itemJson=json[liTxt];
          decorateHintItem(itemJson,li);
        }
      });
    }else{
      if(tries<20){
        //recursive try again
        decorateHintsMenu(aJson,hintsJson,tries+1);
      }
    }
  },10);
}
//decorate one hint item
function decorateHintItem(itemJson,li){
  var propExists=function(name){
    var exists=false;
    if(itemJson.hasOwnProperty('__type')){
      if(itemJson['__type'].length>0){
        exists=true;
      }
    }
    return exists;
  };
  if(propExists('__type')){
    li.addClass('type_'+itemJson['__type']);
    li.attr('option_type',itemJson['__type']);
    li.attr('title',itemJson['__type']);
  }
}
//get the key that indicates if the native object properties have already been loaded into autocomplete
function getJsonHintsKey(key){
  return '__'+key+'_hints';
}
//check for the key that indicates if the native object properties have already been loaded into autocomplete
function hasJsonHintsKey(key,hintsJson){
  var has=false;
  //if these hints aren't already added
  key=getJsonHintsKey(key);
  if(hintsJson.hasOwnProperty(key)){
    has=hintsJson[key];
  }
  return has;
}
//add the properties and functions of obj to the hintsJson
function addJsonHints(addKey, obj, hintsJson){
  //if these hints aren't already added
  if(!hasJsonHintsKey(addKey,hintsJson)){
    var topKey=addKey;
    addKey=getJsonHintsKey(addKey);
    //init hintsJson
    hintsJson[addKey]=true;
    if(!hintsJson.hasOwnProperty(topKey)){
      hintsJson[topKey]={};
    }
    //check if a json property is filled out, non-empty
    var hasKey=function(k,o){
      var has=false;
      if(o.hasOwnProperty(k)){
        if(typeof o[k]==='string'){
          if(o[k].trim().length>0){
            has=true;
          }
        }else{
          has=true;
        }
      }
      return has;
    };
    //set json item data
    var setData=function(k,o){
      //if doesn't already have type
      if(!hasKey('__type',hintsJson[topKey][k])){
        //set type
        var type=typeof o[k];
        hintsJson[topKey][k]['__type']=type;
        //depending on the type
        switch (type) {
          case 'function':
            //get the funciton signature
            var funcStr=o[k].toString();
            var sig=funcStr;
            if(sig.indexOf('(')!==-1){
              sig=sig.substring(sig.indexOf('(')+'('.length);
            }
            if(sig.indexOf('{')!==-1){
              sig=sig.substring(0,sig.indexOf('{'));
            }
            if(sig.lastIndexOf(')')!==-1){
              sig=sig.substring(0, sig.lastIndexOf(')'));
            }
            sig=sig.trim();
            //most likely sig will be an empty string because native functions don't list their args
            hintsJson[topKey][k]['('+sig+');']={};
            break;
        }
      }
    };
    //for each property in obj
    for(var key in obj){
      if(obj.hasOwnProperty(key)){
        //if this property isn't already in hintsJson
        if(!hintsJson[topKey].hasOwnProperty(key)){
          //init the json for this item
          hintsJson[topKey][key]={};
        }
        //make sure the data is set for this item
        setData(key,obj);
      }
    }
  }
}
//generic handle hints depending on hintsJson data
function handleJsonHints(editor, hintsJson){
  //get the autocomplete data including the possible options and the text that triggered these options
  var lineSplit=getLineSplit(editor);
  var aJson=getAutocompleteOptions(lineSplit, hintsJson, editor);
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
  //add icons, summaries, tooltips, and sub menus to hints menu
  decorateHintsMenu(aJson,hintsJson);
  //return
  return {list: list,
    from: CodeMirror.Pos(cur.line, start),
    to: CodeMirror.Pos(cur.line, end)};
}
function getTabContents(json){
  //get the code string, editorValue, to parse in order to find autocomplete values
  var editorValue='';
  //get the selected files' contents
  var filesData=getFileContents(json);
  for(var f=0;f<filesData.length;f++){
    //append this file's data to this editorValue string
    editorValue+=filesData[f]['content'];
  }
  return editorValue;
}
//match a pattern like "shaderProgram = gl.createProgram();" to return "shaderProgram"
function matchLeftFuncAssign(str, defaultRet, funcName, globalFlag){
  var ret=[];
  var reg=new RegExp('(\\w+|\\w+\\.\\w+)[ ]?=[ ]?'+funcName+'[ ]?\\(', globalFlag);
  var matches=str.match(reg);
  if(matches!=undefined){
    for(var m=0;m<matches.length;m++){
      var match=matches[m];
      if(match.indexOf('=')!==-1){
        match=match.substring(0,match.indexOf('='));
        match=match.trim();
        if(ret.indexOf(match)===-1){
          ret.push(match);
        }
      }
    }
  }
  if(ret.length<1){ret=[defaultRet];}
  return ret;
}

//match a pattern like "vertices = [" to return "vertices"
function matchLeftArrayAssign(str, defaultRet, globalFlag){
  var ret=[];
  var reg=new RegExp('(\\w+|\\w+\\.\\w+)[ ]?=[ |\\n]?\\[', globalFlag);
  var matches=str.match(reg);
  if(matches!=undefined){
    for(var m=0;m<matches.length;m++){
      var match=matches[m];
      if(match.indexOf('=')!==-1){
        match=match.substring(0,match.indexOf('='));
        match=match.trim();
        if(ret.indexOf(match)===-1){
          ret.push(match);
        }
      }
    }
  }
  if(ret.length<1){ret=[defaultRet];}
  return ret;
}

//match a pattern like "attribute vec3 aVertexPosition;" to return "aVertexPosition"
function matchFieldName(str, defaultRet, fieldType, globalFlag){
  var ret=[];
  var reg=new RegExp(fieldType+' [\\w ](.*);', globalFlag);
  var matches=str.match(reg);
  if(matches!=undefined){
    for(var m=0;m<matches.length;m++){
      var match=matches[m];
      if(match.indexOf(' ')!==-1){
        if(match.indexOf(';')!==-1){
          match=match.substring(0,match.indexOf(';'));
          match=match.trim();
          var sp=match.split(' ');
          match=sp[sp.length-1];
          match=match.trim();
          if(ret.indexOf(match)===-1){
            ret.push(match);
          }
        }
      }
    }
  }
  if(ret.length<1){ret=[defaultRet];}
  return ret;
}
