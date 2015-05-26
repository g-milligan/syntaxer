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
  var completeFormatTxt=''; //like triggerText, exept this is exclusively for the __complete format, not what's actually entered text
  var completeFormatParts=[]; //like triggerParts, exept this is exclusively for the __complete format, not what's actually entered text
  var dataAtCursor; //json data for the triggerPart, at the cursor

  var saveDataAtCursor=function(data){
    //if not already beyond the cursor
    if(!isAfterCursor){
      if(data!=undefined){
        //set the latest json level
        dataAtCursor=data;
      }
    }
  };

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

  var addOption=function(newOption,partialStr,longestContinueStr,jsonData){
    //if before the cursor
    if(!isAfterCursor){
      //if this option could complete the current text
      if(isPartialOf(partialStr+lineAfterCursor, newOption) || isPartialOf(newOption, partialStr+lineAfterCursor)){
        //only show options when at the end of the line
        if(lineAfterCursor.trim().length<1){
          //if this option isn't already in the array
          if(options.indexOf(newOption)===-1){
            //add this option to the array
            options.push(newOption);
          }
        }
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
          //if finished with left side
          if(st.length<1){
            //left of cursor data: save data for the part on which the cursor has focus
            saveDataAtCursor(json);
          }else{
            //left + right of cursor data: save data for the part on which the cursor has focus
            saveDataAtCursor(json[nextKey]);
          }
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
    var stLtKey=function(k,s,callback){ return stGtKey(s,k,callback); };
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
                longestContinueStr=addOption(key,'',longestContinueStr,json[key]);
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
              //save data for the part on which the cursor has focus
              saveDataAtCursor(json[key]);
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
              longestContinueStr=addOption(key,st,longestContinueStr,json[key]);
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

      //handle basic placeholder format, not including what's actually written
      var txtParts=[]; var dynamicPlaceholder='</__%__/>';
      var setPlaceholderFormat=function(result){
        //add to the format template for the __complete data
        var addToCompleteFormat=function(formatTxt){
          if(formatTxt.length>0){
            completeFormatTxt+=formatTxt; completeFormatParts.push(formatTxt);
          }
        };
        //build the txt parts used to parse out the actual entered text
        var addToTxtParts=function(part){
          txtParts.push(part);
        };
        //prefix string
        if(result.hasOwnProperty('pre')){
          addToCompleteFormat(result['pre']); addToTxtParts(result['pre']);
        }
        //placeholder name
        addToCompleteFormat(result['key']); addToTxtParts(dynamicPlaceholder);
        //postfix string
        if(result.hasOwnProperty('post')){
          addToCompleteFormat(result['post']); addToTxtParts(result['post']);
        }
      };
      //loop through the parts of the auto complete format
      var results=[];
      for(var c=0;c<json['__complete'].length;c++){
        var part=json['__complete'][c];
        //get the first json key in this part json
        for(k in part){
          if(part.hasOwnProperty(k)){
            //get data for this completion part
            var result=part[k]; result['key']=k; results.push(result);
            //handle basic placeholder format, not including what's actually written
            setPlaceholderFormat(result);
            //break after finding the key
            break;
          }
        }
      }
      //trims non-white-space-text, or leaves it alone (if it's all white space)
      var trimIfNotAllWhitespace=function(str){
        //if NOT entirely made up of white space
        if(str.trim().length>0){
          //trim the string
          str=str.trim();
        } return str;
      };
      //get an item from txtParts at the given index
      var getNonDynamicAtIndex=function(index){
        var str='';
        //if this text part is not a dynamic placeholder
        if(txtParts[index]!==dynamicPlaceholder){
          str=txtParts[index];
        } return str;
      };
      //get the next chunk of text between the next pre and post, returns undefined if the __complete format is not followed
      var completeEntry=st+lineAfterCursor;
      var getNextBetween=function(pre, post){
        var between; var foundPre;
        //if not already reached the end of the entry
        if(completeEntry.length>0){
          //if there is either a separator before or after this dynamicPlaceholder
          if(pre.length>0 || post.length>0){
            completeEntry=completeEntry.trimLeft();
            //if pre is in the correct spot
            var preTrim=trimIfNotAllWhitespace(pre);
            if(preTrim.length<1 || completeEntry.indexOf(preTrim)===0){
              //if pre is not empty
              if(preTrim.length>0){
                //trim off pre
                completeEntry=completeEntry.substring(pre.length);
                //save the found pre text
                foundPre=pre;
              }
              //if post is in there
              var postTrim=trimIfNotAllWhitespace(post);
              if(postTrim.length<1 || completeEntry.indexOf(postTrim)!==-1){
                //if there is no post
                if(postTrim.length<1){
                  //end of the line
                  between=completeEntry; completeEntry='';
                //if there is post
                }else if(completeEntry.indexOf(postTrim)!==-1){
                  //get text before the post
                  between=completeEntry.substring(0, completeEntry.indexOf(postTrim));
                  //trim off between
                  completeEntry=completeEntry.substring(between.length);
                }
              }
            }
          }
        } return {between:between, foundPre:foundPre};
      };
      var addCompleteOptions=function(result, args){
        if(result!=undefined){
          if(args==undefined){args={};}
          if(!args.hasOwnProperty('startsWith')){args['startsWith']='';}
          if(!args.hasOwnProperty('addAfter')){args['addAfter']='';}
          var optionsArray=[];
          //if using the options function
          if(result.hasOwnProperty('options')){
            optionsArray=result['options']();
          }else{
            //result should be an array
            optionsArray=result;
          }
          //filtering options
          options=[];
          for(var o=0;o<optionsArray.length;o++){
            var aop=optionsArray[o];
            if(args['startsWith']==='' || isPartialOf(args['startsWith'], aop)){
              options.push(aop+args['addAfter']);
            }
          }
        }
      };
      //process the next part called eatMe, which follows the __complete format. result is the json data (eg: options) for this text part
      var eatSt=function(eatMe, isBetweenTxt, result){
        var cursorSwap=false;
        if(eatMe!=undefined){
          //not edible if there's nothing to eat (blank text) unless...
          var isEdible=(eatMe.length>0);
          //allow blank text for between-placeholder
          if(isBetweenTxt){ isEdible=true; }
          //if not an empty meal, or if this is between text
          if(isEdible){
            var consumed=false;
            //if left of the cursor still
            if(!isAfterCursor){
              //if eatMe is too big (or just right) for st to eat (if moving past the cursor will happen)
              if(st.length<eatMe.length){
                //if not already reached the end of the left string
                if(st.length>0){
                  //set the starting index of the __complete format (if not already set)
                  setIndexOfComplete();
                  //consume what you can, left of the cursor
                  addToTriggerText(st);
                }
                //subtract what's already finished from what's remaining
                eatMe=eatMe.substring(st.length);
                //set the data belonging to the part that is focused by the cursor
                saveDataAtCursor(result);
                //switch to the right of the cursor
                st=lineAfterCursor; isAfterCursor=true; cursorSwap=true;
                //if not already finished off eatMe
                if(eatMe.length>0){
                  //finish the remaining part of this meal
                  addToTriggerText(eatMe); st=st.substring(eatMe.length);
                  //indicate that you had to cut the meal into partial sections
                  indicatePartialEntry();
                  //show unfiltered auto complete options
                  addCompleteOptions(result);
                }
                //meal finished
                consumed=true;
              }
            }
            //set the starting index of the __complete format (if not already set)
            setIndexOfComplete();
            //if the meal is not finished yet
            if(!consumed){
              //finish the meal
              addToTriggerText(eatMe); st=st.substring(eatMe.length);
              //if left of the cursor still
              if(!isAfterCursor){
                //but not when this eatMe function is called next time...
                if(st.length<1){
                  //set the data belonging to the part that is focused by the cursor
                  saveDataAtCursor(result);
                  //show auto complete options (cursor is at right edge of part)
                  addCompleteOptions(result, {startsWith:eatMe});
                }
              }
            }
          }
        }
        return cursorSwap;
      };
      //for each text part in the __complete format
      var formatFollowed=true; var placeHolderIndex=0; var lastNonPhIndex=-1;
      for(var t=0;t<txtParts.length;t++){
        //if this is a dynamic placeholder part
        if(txtParts[t]===dynamicPlaceholder){
          lastNonPhIndex=-1;
          //get the json data for this text part
          var result=results[placeHolderIndex];
          //figure out if there is a separator BEFORE this dynamicPlaceholder
          var pre=''; //if not the first text part
          if(t>0){ pre=getNonDynamicAtIndex(t-1); }
          //figure out if there is a separator AFTER this dynamicPlaceholder
          var post=''; //if not the last text part
          if(t+1!==txtParts.length){ post=getNonDynamicAtIndex(t+1); }
          //get whatever is between the pre and post
          var next=getNextBetween(pre, post);
          var between=next['between'];
          //if there is no breakdown in the format, (format followed so far)
          if(between==undefined){formatFollowed=false;}
          if(formatFollowed){
            //consume the next string part(s) in the format
            eatSt(pre, false); eatSt(between, true, result);
          }else{
            //INCOMPLETE FORMAT: there was a breakdown in the format, format not followed completely...

            //if there is one more pre string that fullfills the format... sneak it in
            if(next['foundPre']!=undefined){ eatSt(pre, false); }

            //if any part of __complete format has been written
            if(indexOfComplete>-1){
              //if writing out the format and haven't quite finished yet
              if(lineAfterCursor.trim().length<1){
                //show the data for the current section
                saveDataAtCursor(result);
                //add anything after each option?
                var addAfter='';
                if(result.hasOwnProperty('post')){ addAfter=result['post']; }
                //show some auto complete options
                addCompleteOptions(result, {startsWith:st, addAfter:addAfter});
              }
            }else{
              //format not started... suggest the first part of the __complete format
              if(pre.length>0){
                //if writing out the format and haven't quite finished yet
                if(lineAfterCursor.trim().length<1){
                  //show some auto complete options
                  addCompleteOptions([pre]);
                }
              }
            }
            //quit at this point; the format is no longer followed
            break;
          }
          //next placeholder index
          placeHolderIndex++;
        }else{
          //not a placeholder... remember the last Non-placeholder index
          lastNonPhIndex=t;
        }
      }
      //if the format was completely followed
      if(formatFollowed){
        //if there is a final, non-placeholder format part to consume
        if(lastNonPhIndex>-1){
          var pre=txtParts[lastNonPhIndex]; var next=getNextBetween(pre, '');
          //if there is one more pre string that fullfills the format... sneak it in
          if(next['foundPre']!=undefined){ eatSt(pre, false); }
        }
      }

    }else if(levelIndex>0){
      //recursive loop through daisy chained key levels
      cycleThroughKeys();
    }
  };

  //start getting the applicable options depending on text entry so far
  getNextKeys(lineBeforeCursor,hintsJson,0);

  //get the summary, type, etc of the data
  var getDataAtCursor=function(aJson){
    var dataJson={hasAnnotation:false,type:'',key:'',summary:'',options:aJson['options']};
    if(aJson.hasOwnProperty('dataAtCursor')){
      if(aJson['dataAtCursor']!=undefined){
        var prefix='';
        //if the cursor is not inside a __complete format
        if(aJson['completeIsIn']!=='triggerParts'){
          //then all the data items should begin with __
          prefix='__';
          //set the key
          var lastBeforeCur='', firstAfterCur='';
          if(aJson['triggerParts'].length>0){
            lastBeforeCur=aJson['triggerParts'][aJson['triggerParts'].length-1];
          }
          if(aJson['postTriggerParts'].length>0){
            firstAfterCur=aJson['postTriggerParts'][0];
          }
          if(aJson['partialEntry']){
            dataJson['key']=lastBeforeCur+firstAfterCur;
          }else{
            //not partial entry
            dataJson['key']=lastBeforeCur;
          }
        }
        //for each viable data item (annotation data)
        for(var key in aJson['dataAtCursor']){
          if(aJson['dataAtCursor'].hasOwnProperty(key)){
            if(key.indexOf(prefix)===0){
              if(key!=='__complete'&&key!=='options'){
                //get value
                var val=aJson['dataAtCursor'][key];
                //value not blank?
                if(val!=undefined){
                  if(typeof val==='string'){
                    if(val.length>0){
                      dataJson['hasAnnotation']=true;
                    }
                  }else{
                    dataJson['hasAnnotation']=true;
                  }
                }
                //if value not blank
                if(dataJson['hasAnnotation']){
                  //set the viable data item into the return object
                  dataJson[key.replace(prefix,'')]=val;
                }
              }
            }
          }
        }
      }
    }
    return dataJson;
  };

  //return data
  var ret={
    options:options,
    triggerText:triggerText, triggerParts:triggerParts,
    postTriggerText:postTriggerText, postTriggerParts:postTriggerParts,
    partialEntry:partialEntry,
    indexOfComplete:indexOfComplete, completeIsIn:completeIsIn,
    completeFormatTxt:completeFormatTxt, completeFormatParts:completeFormatParts,
    dataAtCursor:dataAtCursor
  };
  ret['dataAtCursor']=getDataAtCursor(ret);
  return ret;
}
//show info like the function signature, plus summary of whatever part has focus
function showHintsInfo(aJson){
  console.log(aJson['dataAtCursor']);
  //title html
  var titleHtml='';
  var getTitleHtml=function(){
    var html='';
    /*//is this part a substring in the __complete format?
    var isInCompleteFormat=false, completeFormatIndex=-1, finishedFormat=false;
    var isCompletePart=function(leftOrRight,index){
      //if not already in the __complete format parts
      if(!isInCompleteFormat){
        //which side of the cursor?
        var currentPartsName='';
        switch (leftOrRight) {
          case 'left': currentPartsName='triggerParts'; break;
          case 'right': currentPartsName='postTriggerParts'; break;
        }
        if(currentPartsName.length>0){
          if(aJson['completeIsIn']===currentPartsName){
            if(index===aJson['indexOfComplete']){
              isInCompleteFormat=true;
            }
          }
        }
      }
      //if at the __complete format
      if(isInCompleteFormat){
        //next complete format index
        completeFormatIndex++;
        //reached the end of the complete format?
        if(completeFormatIndex+1===aJson['completeFormatParts'].length){
          finishedFormat=true;
        }
      }
      return isInCompleteFormat;
    };
    //for each part left of the cursor
    for(var l=0;l<aJson['triggerParts'].length;l++){
      if(!finishedFormat){
        var part=aJson['triggerParts'][l];
        //indicate if entered the parts inside the __complete format
        var completeClass='';
        if(isCompletePart('left',l)){
          completeClass=' complete';
          part=aJson['completeFormatParts'][completeFormatIndex];
        }
        //if first part
        if(l===0){
          html+='<span class="left-side">'; //start .left-side
        }
        //if last part
        if(finishedFormat || l+1===aJson['triggerParts'].length){
          html+='<span class="focus part'+completeClass+'">'+part+'</span>'; //focus part
          html+='</span>'; //end .left-side
        }else{
          //not last in left side...
          html+='<span class="part'+completeClass+'">'+part+'</span>'; //part
        }
      }else{
        break;}
    }
    //for each part right of the cursor
    for(var r=0;r<aJson['postTriggerParts'].length;r++){
      if(!finishedFormat){
        var part=aJson['postTriggerParts'][r];
        //indicate if entered the parts inside the __complete format
        var completeClass='';
        if(isCompletePart('right',r)){
          completeClass=' complete';
          part=aJson['completeFormatParts'][completeFormatIndex];
        }
        //if first part
        var focusClass='';
        if(r===0){
          html+='<span class="right-side">'; //start .right-side
          //if partialEntry
          if(aJson['partialEntry']){
            focusClass='focus ';
          }
        }
        html+='<span class="'+focusClass+'part'+completeClass+'">'+part+'</span>'; //part
        //if last part
        if(finishedFormat || r+1===aJson['postTriggerParts'].length){
          html+='</span>'; //end .right-side
        }
      }else{
        break;}
    }
    //if any text was entered
    if(html.length>0){
      html='<span class="trigger-text">'+html+'</span>';
    }*/
    return html;
  };
  titleHtml=getTitleHtml();
  jQuery('#hints-info:first').children('.info-title:first').html(titleHtml);
  //***
}
//add icons, summaries, tooltips, and sub menus to hints menu
var decorate_hints_menu_timeout;
function decorateHintsMenu(lineSplit,hintsJson,aJson,tries){
  if(tries==undefined){tries=0;}
  //delay so that the hints menu will be open
  clearTimeout(decorate_hints_menu_timeout);
  decorate_hints_menu_timeout=setTimeout(function(){
    var ul=jQuery('.CodeMirror-hints:first');
    if(ul.length>0){
      //***
      /*//get the json values for these option items (same level)
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
                console.log(summary);
              }
            }
          }
          //decorate one hint item
          var itemJson=json[liTxt];
          decorateHintItem(itemJson,li);
        }
      });*/
    }else{
      if(tries<20){
        //recursive try again
        decorateHintsMenu(lineSplit,hintsJson,aJson,tries+1);
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
  //get the text before and after the cursor
  var lineSplit=getLineSplit(editor);
  //get the autocomplete data including the possible options and the text daisy-chain that triggered these options
  var aJson=getAutocompleteOptions(lineSplit, hintsJson, editor);
  var list=aJson['options'];
  var triggerParts=aJson['triggerParts']; //before the cursor
  var postTriggerParts=aJson['postTriggerParts']; //after the cursor
  //get the cursor position to figure out what existing text (if any) should be removed before autocomplete happens
  var cur = editor.getCursor(), curLine = editor.getLine(cur.line);
  var end = cur.ch, start = end;
  //if there is partial text that should be removed before autocomplete happens
  if(aJson['partialEntry']){
    //if there are any daisy-chained keywords, "parts" before the cursor
    if(triggerParts.length>0){
      //start at what point before the cursor?
      start-=triggerParts[triggerParts.length-1].length;
      //if there are any daisy chained-parts after the cursor
      if(postTriggerParts.length>0){
        //start at what point after the cursor?
        end+=postTriggerParts[0].length;
      }
    }
  }
  //show info like the function signature, plus summary of whatever part has focus
  showHintsInfo(aJson);
  //if there are any option hints
  if(list.length>0){
    //add icons, and other decorative styles to dropdown hints
    decorateHintsMenu(lineSplit,hintsJson,aJson);
  }
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
