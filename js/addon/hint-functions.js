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
  var lineBeforeCursor=lineSplit[0]; var lineAfterCursor=lineSplit[1]; var isAfterCursor=false;

  var options=[]; //autocomplete options
  var triggerText=''; //the text that triggered the autocomplete options (left of cursor)
  var triggerParts=[]; //the split text that triggered the autocomplete options (left of cursor)
  var postTriggerText=''; //the text that can trigger autocomplete options (right of cursor)
  var postTriggerParts=[] //the split text that can trigger autocomplete options (right of cursor)
  var partialEntry=false; //is the cursor dividing an autocomplete key (as a partial key), eg: "ke | y" ? Or is the cursor after the full key, eg: "key|"
  var indexOfComplete=-1; //the index, in either postTriggerParts OR triggerParts, where the __complete format starts
  var completeIsIn=''; //does the __complete format start in postTriggerText or triggerParts

  var indicatePartialEntry=function(){
    //if not already after the cursor
    if(!isAfterCursor){
      partialEntry=true;
    }
  };

  var addToTriggerText=function(str){
    //if before the cursor
    if(!isAfterCursor){
      triggerText+=str;
      triggerParts.push(str);
    }else{
      //is after the cursor
      postTriggerText+=str;
      postTriggerParts.push(str);
    }
  };

  var setIndexOfComplete=function(){
    if(indexOfComplete===-1){
      //if before the cursor
      if(!isAfterCursor){
        indexOfComplete=triggerParts.length;
        completeIsIn='triggerParts';
      }else{
        //is after the cursor
        indexOfComplete=postTriggerParts.length;
        completeIsIn='postTriggerParts';
      }
    }
  };

  var addOption=function(newOption,partialStr,longestContinueStr){
    //if before the cursor
    if(!isAfterCursor){
      //if this option isn't already in the array
      if(options.indexOf(newOption)===-1){
        //add this option to the array
        options.push(newOption);
        //get the continuation of partialStr, that will make up newOption, eg: partialStr + afterPartialStr = newOption
        var afterPartialStr=newOption.substring(partialStr.length);
        //if lineAfterCursor already completes this option
        if(lineAfterCursor.indexOf(afterPartialStr)===0){
          //if this new continuation string is the longest, so far, in this level
          if(longestContinueStr.length<afterPartialStr.length){
            //set the new longest continuation string (that appears after the cursor)
            longestContinueStr=afterPartialStr;
          }
        }
      }
    }
    return longestContinueStr;
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

  //function to recursively get keys, where trigger parts are parsed out of the st
  var getNextKeys=function(st,json,levelIndex){
    //handle possible daisy chained keys AFTER the cursor position
    var continueAfterCursor=function(nextStr){
      //if reached the end of the left side of the cursor and there is a key to continue after the cursor
      if(nextStr.length>0){
        //if the key finished on the left side of the cursor, but continues on the right side of the cursor
        var nextKey=nextStr;
        if(partialEntry){
          // ke | y ... put the full key together
          nextKey=triggerParts[triggerParts.length-1]+nextStr;
        }
        //the json should have this key, but double check
        if(json.hasOwnProperty(nextKey)){
          //officially now after the cursor
          isAfterCursor=true;
          //completion already happened after the cursor, so forget the completion options
          options=[];
          //add the first post cursor data
          addToTriggerText(nextStr);
          //recursive call to the next daisy chain part
          var shorterKey=lineAfterCursor.substring(nextStr.length);
          getNextKeys(shorterKey,json[nextKey],levelIndex+1);
        }
      }
    };
    //st.length>key.length
    var stGtKey=function(k,s,callback){
      var is=false;
      //if the text may surpass the length of this key
      if(s.length>k.length){ is=true;
        //if key is the first part of st
        if(isPartialOf(k, s)){
          callback();
        }
      } return is;
    };
    //st.length<key.length
    var stLtKey=function(k,s,callback){
      var is=false;
      //if the text may surpass the length of this key
      if(s.length<k.length){ is=true;
        //if key is the first part of st
        if(isPartialOf(s, k)){
          callback();
        }
      } return is;
    };
    //st.length===key.length
    var stEqualsKey=function(k,s,callback){
      var is=false;
      //if the text may surpass the length of this key
      if(s.length===k.length){ is=true;
        //if key is the first part of st
        if(s.toLowerCase()===k.toLowerCase()){
          callback();
        }
      } return is;
    };
    //st.length<1
    var stIsBlank=function(s,callback){
      var is=false;
      //if the text may surpass the length of this key
      if(s.length<1){
        is=true; callback();
      } return is;
    };
    //cycles through the keys at different levels to determine the viable autocomplete options
    var cycleThroughKeys=function(){
      //not the first daisy chain level
      var triggerTxtUpdated=false; var longestContinueStr='';
      //==DETERMINE NESTED/DAISY-CHAINED AUTOCOMPLETE OPTIONS==
      for(var key in json){
        if(json.hasOwnProperty(key)){
          //if this is a key that could be an autocomplete value
          if(key.indexOf('__')!==0){

            //if after the first key level
            if(levelIndex>0){
              //if st is blank, ''
              if(stIsBlank(st,function(){
                //add autocomplete option
                longestContinueStr=addOption(key,'',longestContinueStr);
              })){continue;}
            }

            //if st.length>key.length and st starts with key
            if(stGtKey(key,st,function(){
              //if trigger text not already updated for this level
              if(!triggerTxtUpdated){addToTriggerText(key); triggerTxtUpdated=true;}
              //recursive call to the second level of possible text options
              var shorterKey=st.substring(key.length);
              getNextKeys(shorterKey,json[key],levelIndex+1);
            })){continue;}

            //if st.length===key.length and st equals key
            if(stEqualsKey(key,st,function(){
              //if trigger text not already updated for this level
              if(!triggerTxtUpdated){addToTriggerText(st); triggerTxtUpdated=true;}
              //recursive call to the second level of possible text options
              getNextKeys('',json[key],levelIndex+1);
            })){continue;}

            //if st.length<key.length and key starts with st
            if(stLtKey(key,st,function(){
              //indicate that this is a partial entry
              indicatePartialEntry();
              //if trigger text not already updated for this level
              if(!triggerTxtUpdated){addToTriggerText(st); triggerTxtUpdated=true;}
              //add autocomplete option
              longestContinueStr=addOption(key,st,longestContinueStr);
            })){continue;}

          }
        }
      }
      //handle possible daisy chained keys AFTER the cursor position
      continueAfterCursor(longestContinueStr);
    };
    //if at the first level
    if(levelIndex===0){
      //trim the left part of the string (string is the text left of the cursor)
      st=st.trimLeft();
      //if there is text in which to search for keys
      if(st.length>0){
        if(st.indexOf(';')!==-1){
          //trim off string left of the last ;
          st=st.substring(st.lastIndexOf(';')+';'.length);
          st=st.trimLeft();
        }
        //if there is STILL text in which to search for keys
        if(st.length>0){
          //recursive loop through daisy chained key levels
          cycleThroughKeys();
        }
      }
    }else if(json.hasOwnProperty('__complete')){
      //==DETERMINE AUTOCOMPLETE FORMAT==
      var addAutoCompleteOptions=function(op, postfix){
        if(postfix==undefined){postfix='';}
        if(typeof op==='string'){
          if(options.indexOf(op)===-1){
            options.push(op+postfix);
          }
        }else{
          for(var o=0;o<op.length;o++){
            if(options.indexOf(op[o])===-1){
              options.push(op[o]+postfix);
            }
          }
        }
      };
      //indicate when after the cursor
      var indicateIfAfterCursor=function(result){
        st=st.trim();
        //if not already after cursor
        if(!isAfterCursor){
          //if reached the end of the string, left of the cursor
          if(st.length<1){
            //start handling post cursor chain
            st=lineAfterCursor;
            //officially now after the cursor
            isAfterCursor=true;
            //if the data for the current item (where the cursor is located) is given
            if(result!=undefined){
              //if an options function is given
              if(result.hasOwnProperty('options')){
                //set the auto complete options for the part positioned at the cursor
                var op=result['options']();
                var post=''; if(result.hasOwnProperty('post')){post=result['post'];}
                addAutoCompleteOptions(op, post);
              }
            }
          }
        }
        //indicate where the __complete section starts within the trigger parts
        setIndexOfComplete();
      };
      //initial check for after cursor
      indicateIfAfterCursor();
      //function to consume a pre format text part
      var eatPreSt=function(frontSt){
        var followFormat=false; var trigTxt='';
        //detect if processing text after the cursor
        indicateIfAfterCursor();
        //if the st is not ended
        if(st.length>0){
          //if there is a frontSt
          if(frontSt!=undefined){
            //trim the frontSt if it's not entirely spaces
            if(frontSt.trim().length>0){
              frontSt=frontSt.trim();
            }
            //if frontSt not blank
            if(frontSt.length>0){
              //for each letter of the entry that fullfills this pre text string
              for(var f=0;f<frontSt.length;f++){
                if(st.indexOf(frontSt[f])===0){
                  //the entered text fullfills this single character of the completion format
                  trigTxt+=frontSt[f];
                  st=st.substring(1);
                }else{
                  //the entered text fails to fullfill the completion format up to this point... if SOME of the pre text was fullfilled
                  if(trigTxt.length>0){
                    //indicate that this is a partial entry
                    indicatePartialEntry();
                  }
                  //suggest to autocomplete frontSt
                  addAutoCompleteOptions(frontSt);
                  break;
                }
              }
            }
          }
        }else{
          //string is blank after cursor... so suggest to autocomplete frontSt
          addAutoCompleteOptions(frontSt);
        }
        //if any or all of the pre text is fullfilled by the text entry
        if(trigTxt.length>0){ addToTriggerText(trigTxt); }
        //if the st still follows the completion format
        if(trigTxt.length===frontSt.length){
          followFormat=true;
        }
        return followFormat;
      };
      //function to consume a pre format text part
      var skipToPost=function(skipToSt,result){
        var followFormat=false;
        //detect if processing text after the cursor
        indicateIfAfterCursor(result);
        //if the st is not ended
        if(st.length>0){
          //if there is a frontSt
          if(skipToSt!=undefined){
            var origSkipToSt=skipToSt;
            //trim the skipToSt if it's not entirely spaces
            if(skipToSt.trim().length>0){
              skipToSt=skipToSt.trim();
            }
            //if skipToSt not blank
            if(skipToSt.length>0){
              //if the string to skip to does not exist in st
              if(st.indexOf(skipToSt)===-1){
                //if not already right of the cursor
                if(!isAfterCursor){
                  //if the string AFTER the cursor contains the skipToSt
                  if(lineAfterCursor.indexOf(skipToSt)!==-1){
                    //this is an incomplete split
                    indicatePartialEntry();
                    //add the partial text
                    addToTriggerText(st); st='';
                    //indicate that the string after the cursor is being processed now
                    indicateIfAfterCursor(result);
                  }
                }
              }
              //if the string to skip to exists in st
              if(st.indexOf(skipToSt)!==-1){
                //get the string before skipToSt
                var trigTxt=st.substring(0,st.indexOf(skipToSt));
                //add this trigger text
                addToTriggerText(trigTxt);
                //trim off trigTxt from st
                st=st.substring(trigTxt.length);
                //process the postfix string too
                followFormat=eatPreSt(origSkipToSt);
              }else{
                //st doesn't contain the next skipToSt... doesn't follow the complete format
                followFormat=false;
              }
            }
          }
        }
        return followFormat;
      };
      //the general format for the auto-complete
      var completeFormat=''; var followsFormat=true; var skipAhead=false;
      //loop through the parts of the auto complete format
      for(var c=0;c<json['__complete'].length;c++){
        var part=json['__complete'][c];
        //get the first json key in this part json
        for(k in part){
          if(part.hasOwnProperty(k)){
            //get data for this completion part
            var result=part[k];
            //prefix string
            if(result.hasOwnProperty('pre')){
              var pre=result['pre'];
              if(pre.length>0){
                completeFormat+=pre;
                //if the entry so far still follows this format
                if(followsFormat){
                  //remove the pre string from the front of st
                  pre=pre.trim();
                  //if need to skip ahead
                  if(skipAhead){
                    skipAhead=false;
                    followsFormat=skipToPost(pre,result);
                  }else{
                    //consume prefix
                    followsFormat=eatPreSt(pre);
                  }
                }
              }
            }
            //placeholder name
            completeFormat+=k;
            //postfix string
            if(result.hasOwnProperty('post')){
              var post=result['post'];
              if(post.length>0){
                completeFormat+=post;
                //if the entry so far still follows this format
                if(followsFormat){
                  post=post.trim();
                  followsFormat=skipToPost(post,result);
                }
              }
            }else{
              //skip ahead for the next pre
              skipAhead=true;
            }
            //break after finding the key
            break;
          }
        }
      }

      // json['__complete'] --> array of parts to complete
      //***

    }else if(levelIndex>0){
      //recursive loop through daisy chained key levels
      cycleThroughKeys();
    }
  };

  //start getting the applicable options depending on text entry so far
  getNextKeys(lineBeforeCursor,hintsJson,0);
  //return data
  var ret={
    options:options,
    triggerText:triggerText, triggerParts:triggerParts,
    postTriggerText:postTriggerText, postTriggerParts:postTriggerParts,
    partialEntry:partialEntry,
    indexOfComplete:indexOfComplete, completeIsIn:completeIsIn
  };
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
      if(obj[key]){
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
