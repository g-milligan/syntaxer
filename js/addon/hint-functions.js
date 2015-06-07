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
//trims non-white-space-text, or leaves it alone (if it's all white space)
function trimIfNotAllWhitespace(str){
  if(str!=undefined){
    //if NOT entirely made up of white space
    if(str.trim().length>0){
      //trim the string
      str=str.trim();
    }
  } return str;
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
  var cursorIndex=-1; //the index to which the dataAtCursor is related

  var saveDataAtCursor=function(data, forceAfterCursor, newCursorIndex){
    if(forceAfterCursor==undefined){forceAfterCursor=false;}
    //if not already beyond the cursor, or if forcing this data save
    if(!isAfterCursor || forceAfterCursor){
      if(data!=undefined){
        //if no specific cursor index is given
        if(newCursorIndex==undefined){
          //default cursor index
          cursorIndex=triggerParts.length-1;
        }else{
          //set cursor index
          cursorIndex=newCursorIndex;
        }
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
          if(callback!=undefined){callback();}
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
          if(callback!=undefined){callback();}
        }
      } return is;
    };
    //st.length<1
    var stIsBlank=function(s,callback){
      var is=false;
      //if the text may surpass the length of this key
      if(s.length<1){
        is=true; if(callback!=undefined){callback();}
      } return is;
    };
    //cycles through the keys at different levels to determine the viable autocomplete options
    var cycleThroughKeys=function(){
      var sortedKeys=[];
      //==SORT THE AUTOCOMPLETE KEYS
      for(var key in json){
        if(json.hasOwnProperty(key)){
          //if this is a key that could be an autocomplete value
          if(key.indexOf('__')!==0){
            var keyAdded=false;
            //if after the first key level
            if(levelIndex>0){
              //if st is blank, ''
              stIsBlank(st,function(){
                sortedKeys.push(key); keyAdded=true;
              });
            }
            //if st.length>key.length and st starts with key
            if(!keyAdded){
              stGtKey(key,st,function(){
                sortedKeys.push(key); keyAdded=true;
              });
            }
            //if st.length===key.length and st equals key
            if(!keyAdded){
              stEqualsKey(key,st,function(){
                sortedKeys.push(key); keyAdded=true;
              });
            }
            //if st.length<key.length and key starts with st
            if(!keyAdded){
              stLtKey(key,st,function(){
                sortedKeys.push(key); keyAdded=true;
              });
            }
          }
        }
      }
      //sort the keys
      sortedKeys=sortedKeys.sort();
      //init level flags
      var triggerTxtUpdated=false, longestContinueStr='';
      if(sortedKeys.length>0){
        //==DETERMINE NESTED/DAISY-CHAINED AUTOCOMPLETE OPTIONS==
        for(var k=sortedKeys.length-1;k>-1;k--){
          var key=sortedKeys[k];
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
            //if trigger text not already updated for this level
            if(!triggerTxtUpdated){addToTriggerText(st); triggerTxtUpdated=true;}
            //save data for the part on which the cursor has focus
            saveDataAtCursor(json[key]);
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
      //handle possible daisy chained keys AFTER the cursor position
      continueAfterCursor(longestContinueStr);
    };
    //if at the first level
    if(levelIndex===0){
      //trim the left part of the string (string is the text left of the cursor)
      st=st.trimLeft();
      //if there is text in which to search for keys
      if(st.length>0){
        //function to trim left of (and possibly including) some "leftOf" string
        var trimLeftOf=function(leftOf,includeLeftOf){
          if(includeLeftOf==undefined){includeLeftOf=false;}
          if(st.indexOf(leftOf)!==-1){
            var includeLength=0;
            if(includeLeftOf){
              includeLength=leftOf.length;
            }
            //trim off string left of the last ;
            st=st.substring(st.lastIndexOf(leftOf)+includeLength);
            st=st.trimLeft();
          }
        };
        //trim left of (and including) some strings if they exist
        trimLeftOf('=',true);
        trimLeftOf(';',true);
        //figure out where to start in the string
        var firstKeysLowestIndex=-1, earliestKey='';
        for(var key in hintsJson){
          if(hintsJson.hasOwnProperty(key)){
            if(key.indexOf('__')!==0){
              var indexOfKey=st.indexOf(key);
              if(indexOfKey>-1){
                if(firstKeysLowestIndex===-1 || indexOfKey<firstKeysLowestIndex){
                  firstKeysLowestIndex=indexOfKey;
                  earliestKey=key;
                }
              }
            }
          }
        }
        if(firstKeysLowestIndex>-1){
          //trim up to the first top-level key that appears on this line
          st=st.substring(st.indexOf(earliestKey));
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
                //if the pre (with optional white spaces) starts completeEntry
                if(completeEntry.indexOf(pre)===0){
                  //trim off pre
                  completeEntry=completeEntry.substring(pre.length);
                  //save the found pre text
                  foundPre=pre;
                //if the preTrim (no optional white spaces) starts completeEntry
                }else if(completeEntry.indexOf(preTrim)===0){
                  //trim off pre
                  completeEntry=completeEntry.substring(preTrim.length);
                  //save the found pre text
                  foundPre=preTrim;
                }
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
      var eatSt=function(eatMe, isBetweenTxt){
        var cursorPosFlag='', cursorSwap=false;
        if(eatMe!=undefined){
          //not edible if there's nothing to eat (blank text) unless...
          var isEdible=(eatMe.length>0);
          //allow blank text for between-placeholder string
          if(isBetweenTxt){ isEdible=true; }
          //add trim eatMe to trigger text (if the eatMe text is NOT isBetweenTxt; is ignoring white spaces)
          var addToTrimTriggerText=function(txt, doBiteOff){
            if(doBiteOff==undefined){doBiteOff=true;}
            var retTxt=txt;
            //if eatMe is pre text (not between text)
            if(!isBetweenTxt){
              //if txt is different from trimTxt
              var trimTxt=trimIfNotAllWhitespace(txt);
              if(trimTxt!==txt){
                //if the string does NOT start with the normal txt (with optional whitespaces)
                if(st.indexOf(txt)!==0){
                  //sanity check to make sure st starts with trimTxt (it should)
                  if(st.indexOf(trimTxt)===0){
                    retTxt=trimTxt;
                  }
                }
              }
            }
            //add trigger text (has or not has optional whitespace)
            addToTriggerText(retTxt);
            //if do bite off from the eatMe text?
            if(doBiteOff){
              //trim off the added trigger text from st
              st=st.substring(retTxt.length);
            }
            //return
            return retTxt;
          };
          //if not an empty meal, or if this is between text
          if(isEdible){
            cursorPosFlag='ateMe';
            //if left of the cursor still
            if(!isAfterCursor){
              //if moving past the cursor will happen (cursorSwap will be true)
              if(st.length<=eatMe.length){
                //if starting new part immediately after the cursor, like "|eatMe" (NOT partialEntry)
                if(st.length===0){
                  //switch to the right of the cursor, so st="eatMe..."
                  st=lineAfterCursor; isAfterCursor=true;
                  //set the starting index of the __complete format (if not already set)
                  setIndexOfComplete();
                  //add the eatMe trigger text
                  addToTrimTriggerText(eatMe);
                  cursorPosFlag='|ateMe';
                //if ending whole part immediately before the cursor, like "eatMe|" (NOT partialEntry)
                }else if(st.length===eatMe.length){
                  //set the starting index of the __complete format (if not already set)
                  setIndexOfComplete();
                  //add the eatMe trigger text
                  addToTrimTriggerText(eatMe);
                  //switch to the right of the cursor
                  isAfterCursor=true;
                  //before next line, st should now be blank so load the text right of the cursor now, so st="nextpart..."
                  st=lineAfterCursor;
                  cursorPosFlag='ateMe|';
                //the cursor splits the "eat|Me" (IS partialEntry)
                }else{
                  //get the two parts of eatMe (before and after cursor)
                  var eatBefore=eatMe.substring(0, st.length);
                  var eatAfter=eatMe.substring(st.length);
                  //set the starting index of the __complete format (if not already set)
                  setIndexOfComplete();
                  //add the eatBefore trigger text
                  addToTrimTriggerText(eatBefore, false);
                  //indicate that you had to cut the meal into partial sections
                  indicatePartialEntry();
                  //switch to the right of the cursor
                  isAfterCursor=true;
                  //add the eatAfter trigger text
                  addToTrimTriggerText(eatAfter);
                  cursorPosFlag='ate|Me';
                }
                //the cursor swap did happen (now working with text that is right of the cursor)
                cursorSwap=true;
              }
            }
            //if the meal is not finished yet
            if(!cursorSwap){
              //set the starting index of the __complete format (if not already set)
              setIndexOfComplete();
              //finish the meal
              addToTrimTriggerText(eatMe);
            }
          }
        }
        return cursorPosFlag;
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
          //save the surrounding separators
          result['left']=next['foundPre']; result['right']=post;
          if(result['left']==undefined){
            if(t===0){
              //the first dynamic placeholder doesn't have a pre, so use the previous left text
              result['left']=triggerText+postTriggerText;
            }
          }
          //if there is no breakdown in the format, (format followed so far)
          if(between==undefined){formatFollowed=false;}
          if(formatFollowed){
            pre=next['foundPre']; //if the pre (with optional whitespace) doesn't have whitespace in st
            //consume the next string part(s) in the format
            var prePosFlag=eatSt(pre, false);
            var betweenPosFlag=eatSt(between, true);
            //was the cursor found first touching the pre or between string?
            var cursorPosFlag=betweenPosFlag; var isPartialInPre=false;
            if(prePosFlag.indexOf('|')!==-1){
              cursorPosFlag=prePosFlag;
              isPartialInPre=partialEntry; //AND if the pre text has partial, like "pr|e"
            }
            //if the cursor is NOT inside pre (partialEntry)
            if(!isPartialInPre){
              //is the cursor inside the __complete format or on at the start of the __complete format, after the function?
              var cursorIsInComplete=true;
              //if this is the first time the __complete format has begun
              if(placeHolderIndex===0){
                //if the cursor is at the very left edge of the __complete format (also touching the previous part)
                if((prePosFlag+betweenPosFlag).indexOf('|')===0){
                  cursorIsInComplete=false;
                }
              }
              //if the cursor is NOT at the very left edge of the __complete format (also touching the previous part)
              if(cursorIsInComplete){
                //if any of st was consumed
                if(cursorPosFlag.length>0){
                  //if swapped to the right side of the cursor when eatSt() was processed
                  if(cursorPosFlag.indexOf('|')!==-1){
                    var startsWith='', newCursorIndex=triggerParts.length-1;
                    //if the cursor is at the end of "ateMe|"
                    if(cursorPosFlag.lastIndexOf('|')===cursorPosFlag.length-'|'.length){
                      //if the cursor is after "between|", not "pre"
                      if(betweenPosFlag.indexOf('|')!==-1){
                        //then filter options based on "between"
                        startsWith=between;
                      }else{
                        //cursor is after "pre|", not "between"
                        newCursorIndex=triggerParts.length;
                      }
                    }
                    //show the data for the current section
                    saveDataAtCursor(result, true, newCursorIndex);
                    //show some auto complete options that begin with "ateMe"
                    addCompleteOptions(result, {startsWith:startsWith});
                  }
                }
              }
            }
          }else{
            //INCOMPLETE FORMAT: there was a breakdown in the format, format not followed completely...

            //if there is one more pre string that fullfills the format... sneak it in
            if(next['foundPre']!=undefined){ eatSt(pre, false); }

            //if any part of __complete format has been written
            if(indexOfComplete>-1){
              //if writing out the format and haven't quite finished yet
              if(lineAfterCursor.trim().length<1){
                //if the dataAtCursor is not already set
                if(dataAtCursor==undefined){
                  //show the data for the current section
                  saveDataAtCursor(result, true, triggerParts.length);
                }
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
              //format not started... if this is also the first item in txtParts (first item is NOT pre, but a dynamic between)
              }else if(t===0){
                //if writing out the format and haven't quite finished yet
                if(lineAfterCursor.trim().length<1){
                  if(post==undefined){post='';}
                  //if at least one character entered for this first dynamic placeholder
                  if(st.trim().length>0){
                    //consume this between string
                    eatSt(st, true);
                    //show the data for the current section
                    saveDataAtCursor(result, true);
                  }
                  //show some auto complete options for the first dynamic placeholder (it doesn't have a pre value)
                  addCompleteOptions(result, {addAfter:post});
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
    dataAtCursor:dataAtCursor, cursorIndex:cursorIndex
  };
  ret['dataAtCursor']=getDataAtCursor(ret);
  return ret;
}
//show info like the function signature, plus summary of whatever part has focus
function showHintsInfo(aJson, editor){
  //title html
  var titleHtml='';
  var getTitleHtml=function(){
    var html='<span class="trigger-text">'; //start .trigger-text
    //detect if at the __complete format
    var atCompleteParts=false;
    var ifAtComplete=function(type, index){
      if(aJson['completeIsIn']===type){
        if(aJson['indexOfComplete']===index){
          atCompleteParts=true;
        }
      } return atCompleteParts;
    };
    //detect if at the focused part
    var getFocusClass=function(index){
      var focusClass='';
      if(aJson['cursorIndex']>-1){
        //if partial entry
        if(!atCompleteParts && aJson['partialEntry']){
          //if at the focused string left of the cursor
          if(aJson['cursorIndex']===index){
            focusClass=' l-focus';
          //if at the focused string right of the cursor
          }else if(aJson['cursorIndex']===index-1){
            focusClass=' r-focus';
          }
        }else{
          //not partial entry...
          if(aJson['cursorIndex']===index){
            focusClass=' focus';
          }
        }
      } return focusClass;
    };
    var getMoreLessTag=function(focusClass){
      var tag='';
      if(focusClass.trim()==='focus'){
        tag='<span class="more-less"><span class="more">More Info</span><span class="less">Less Info</span></span>';
      } return tag;
    };
    var partIndex=0;
    //for each trigger part
    for(var t=0;t<aJson['triggerParts'].length;t++){ var part=aJson['triggerParts'][t];
      //if NOT reached the completion format
      if(!ifAtComplete('triggerParts', t)){
        //is focus part?
        var focusClass=getFocusClass(partIndex);
        if(focusClass===' l-focus'){
          html+='<span class="focus parts">'; //start focus parts
          html+=getMoreLessTag('focus');
        }
        //part html
        html+='<span class="left'+focusClass+' part">'+getMoreLessTag(focusClass)+part+'</span>';
        if(focusClass===' r-focus'){
          html+='</span>'; //end focus parts
        }
        //next part index
        partIndex++;
      }else{
        break;
      }
    }
    //if not reached __complete format
    if(!atCompleteParts){
      //for each post trigger part
      for(var p=0;p<aJson['postTriggerParts'].length;p++){ var part=aJson['postTriggerParts'][p];
        //if NOT reached the completion format
        if(!ifAtComplete('postTriggerParts', p)){
          //is focus part?
          var focusClass=getFocusClass(partIndex);
          if(focusClass===' l-focus'){
            html+='<span class="focus parts">'; //start focus parts
            html+=getMoreLessTag('focus');
          }
          //part html
          html+='<span class="right'+focusClass+' part">'+getMoreLessTag(focusClass)+part+'</span>';
          if(focusClass===' r-focus'){
            html+='</span>'; //end focus parts
          }
          //next part index
          partIndex++;
        }else{
          break;
        }
      }
    }
    //for each __complete part
    for(var c=0;c<aJson['completeFormatParts'].length;c++){ var part=aJson['completeFormatParts'][c];
      //is focus part?
      var focusClass=getFocusClass(partIndex);
      var sideClass='left'; if(aJson['cursorIndex']<partIndex){sideClass='right';}
      //part html
      html+='<span class="'+sideClass+' complete'+focusClass+' part">'+getMoreLessTag(focusClass)+part+'</span>';
      //next part index
      partIndex++;
    }
    html+='</span>'; //end .trigger-text
    return html;
  };
  //hints body
  var bodyHtml='';
  var getBodyHtml=function(){
    var html='', hasBody=false;
    var getCursorVal=function(k){
      var v='';
      if(aJson['dataAtCursor'].hasOwnProperty(k)){
        v=aJson['dataAtCursor'][k];
        if(v==undefined){v='';}
        v=v.trim();
      } return v;
    };
    //title
    var type=getCursorVal('type'); var key=getCursorVal('key'); var title='';
    if(key.length>0 || type.length>0){
      title+='<div class="hint-title">';
      if(key.length>0){ title+='<div class="hint-key">'+key+'</div>'; }
      if(type.length>0){ title+='<div class="hint-type">'+type+'</div>'; }
      title+='</div>';
      hasBody=true;
    }
    //summary
    var summary=getCursorVal('summary'); var summaryHtml='';
    if (summary.length>0){ summaryHtml+='<div class="hint-summary">'+summary+'</div>'; hasBody=true; }
    //if there is any part of the body
    if(hasBody){
      //put it all together
      html+='<div class="hint-content">'+title+summaryHtml+'</div>';
    }
    //return
    return html;
  };
  //get some key elements
  var bodyElem=jQuery('body:first');
  var hintsInfoWrap=bodyElem.find('#hints-info:first'); hintsInfoWrap.removeClass('can-open');
  var hintsTitleElem=hintsInfoWrap.children('.info-title:first');
  var hintsBodyElem=hintsInfoWrap.children('.info-body:first');
  //if there is a __complete-format part of this line (without __complete, the hint info format will not be shown)
  if(aJson['indexOfComplete']>-1 || aJson['dataAtCursor']['hasAnnotation']){
    //get html for the hint info title
    titleHtml=getTitleHtml();
    bodyHtml=getBodyHtml();
  }
  //set the new hint info html
  hintsTitleElem.html(titleHtml);
  hintsBodyElem.html(bodyHtml);
  //hints info events
  var triggerTextElem=hintsTitleElem.children('.trigger-text:first');
  if(triggerTextElem.length>0){
    //if there was any body info...
    if(bodyHtml.length>0){
      hintsInfoWrap.addClass('can-open');
      triggerTextElem.click(function(){
        //toggle open more information menu
        if(hintsInfoWrap.hasClass('open')){
          //close
          hintsInfoWrap.removeClass('open');
          removeSplitPanelClasses(bodyElem);
        }else{
          //open
          hintsInfoWrap.addClass('open');
          bodyElem.addClass('split-2panel-rows');
          //move the scroll position if the cursor line is behind the open bottom panel
          scrollCursorToTopIfBehind(editor, hintsInfoWrap);
        }
      });
    }
  }
  //if the hints panel is open
  if(hintsInfoWrap.hasClass('open')){
    if(hintsInfoWrap.hasClass('can-open')){
      bodyElem.addClass('split-2panel-rows');
      //move the scroll position if the cursor line is behind the open bottom panel
      scrollCursorToTopIfBehind(editor, hintsInfoWrap);
    }else{
      //hints panel cannot open... remove the split panel classes
      removeSplitPanelClasses(bodyElem);
    }
  }else{
    //hints panel closed... remove the split panel classes
    removeSplitPanelClasses(bodyElem);
  }
}
//move the scroll position if the cursor line is behind the open bottom panel
function scrollCursorToTopIfBehind(editor, overlapElem){
  //scroll so that the cursor line isn't out of sight
  var cur = editor.getCursor();
  var lineNum=cur.line+1;
  var lineNumElem=getCodeMirrorLineElem(lineNum);
  if(lineNumElem!=undefined){
    var lineElem=lineNumElem.parent().parent();
    //if the info panel overlaps the line number, at all
    var overlapTop=overlapElem.offset().top;
    var lineElemTop=lineElem.offset().top;
    var lineElemBottom=lineElemTop+lineElem.outerHeight();
    //if the line drops below the overlap panel
    if(lineElemBottom>=overlapTop){
      scrollCursorLineToTop(lineElem);
    }
  }
}
//scroll the cursor line to the top of the scroll area
function scrollCursorLineToTop(lineElem){
  //how much more should the editor scroll down?
  var lineElemTop=lineElem.offset().top;
  var contentWrap=jQuery('section#file-content .content-wrap.active:first');
  var contentWrapTop=contentWrap.offset().top;
  var moreScroll=lineElemTop-contentWrapTop;
  //get current scroll top
  var scrollData=codeMirrorScroll();
  //add more scrollage
  var newScrollTop=scrollData.top+moreScroll;
  //set the new scroll top amount
  codeMirrorScroll({top:newScrollTop}, scrollData.elem);
}
//set or get the scroll of the current active editor area
function codeMirrorScroll(json, scrollElem){
  var ret;
  if(scrollElem==undefined){scrollElem=jQuery('section#file-content .content-wrap.active .CodeMirror .CodeMirror-scroll:first');}
  if(json!=undefined){
    if(json.hasOwnProperty('top')){
      scrollElem.scrollTop(json['top']);
    }
    if(json.hasOwnProperty('left')){
      scrollElem.scrollLeft(json['left']);
    }
  }
  ret={elem:scrollElem, top:scrollElem.scrollTop(), left:scrollElem.scrollLeft()};
  return ret;
}
//get the dom element for the codemirror line number
function getCodeMirrorLineElem(lineNum){
  var lineNumElems=jQuery('section#file-content .content-wrap.active .CodeMirror .CodeMirror-lines .CodeMirror-code .CodeMirror-linenumber:contains('+lineNum+')')
  var lineNumElem;
  if(lineNumElems.length>1){
    lineNumElems.each(function(){
      var txt=jQuery(this).text(); txt=txt.trim();
      if(txt===(lineNum+'').trim()){
        lineNumElem=jQuery(this);
        return false;
      }
    });
  }else if(lineNumElems.length===1){
    lineNumElem=lineNumElems;
  } return lineNumElem;
}

function removeSplitPanelClasses(bodyElem){
  if(bodyElem==undefined){bodyElem=jQuery('body:first');}
  bodyElem.removeClass('split-2panel-rows');
}
//add icons, summaries, tooltips, and sub menus to hints menu
function decorateHintsMenu(lineSplit,hintsJson,aJson){
  //if the code mirror popup exists
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
  }
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
      //get type
      var type=typeof o[k]; var setKey=k;
      switch (type) {
        case 'function':
          //function name keys will end with (
          setKey+='(';
        break;
      }
      if(!hintsJson[topKey].hasOwnProperty(setKey)){
        hintsJson[topKey][setKey]={};
      }
      //if doesn't already have type, then set type
      if(!hasKey('__type',hintsJson[topKey][setKey])){
        hintsJson[topKey][setKey]['__type']=type;
      }
    };
    //for each property in obj
    for(var key in obj){
      if(obj[key]){
        //make sure the data is set for this item
        setData(key,obj);
      }
    }
  }
}
//generic handle hints depending on hintsJson data
function handleJsonHints(editor, hintsJson, eventTrigger){
  //get the text before and after the cursor
  var lineSplit=getLineSplit(editor);
  //get the autocomplete data including the possible options and the text daisy-chain that triggered these options
  var aJson=getAutocompleteOptions(lineSplit, hintsJson, editor);
  var list=aJson['options'];
  var triggerParts=aJson['triggerParts']; //before the cursor
  var postTriggerParts=aJson['postTriggerParts']; //after the cursor
  var dataAtCursor=aJson['dataAtCursor'];
  //get the cursor position to figure out what existing text (if any) should be removed before autocomplete happens
  var cur = editor.getCursor(), curLine = editor.getLine(cur.line);
  var end = cur.ch, start = end;
  //get the string immediately before the cursor
  var lastTrigPart='';
  if(triggerParts.length>0){
    lastTrigPart=triggerParts[triggerParts.length-1];
  }
  //get the string immediately after the cursor
  var firstPostPart='';
  if(postTriggerParts.length>0){
    firstPostPart=postTriggerParts[0];
  }
  //if there is partial text that should be removed before autocomplete happens
  if(aJson['partialEntry']){
    //start at *: "*part|ial"
    start-=lastTrigPart.length;
    //end at *: "part|ial*"
    end+=firstPostPart.length;
  }
  //show info like the function signature, plus summary of whatever part has focus
  showHintsInfo(aJson, editor);
  //completion hints object
  var completion={list: list,
    from: CodeMirror.Pos(cur.line, start),
    to: CodeMirror.Pos(cur.line, end)};
  //event for showing autocomplete options
  CodeMirror.on(completion,'shown',function(){
    //if there are any option hints
    if(list.length>0){
      //add icons, and other decorative styles to dropdown hints
      decorateHintsMenu(lineSplit,hintsJson,aJson);
    }
  });
  //event for picking a hint option
  CodeMirror.on(completion,'pick',function(pickedOption){
    //if the tab key triggered the pick event for the options
    var isTabComplete=false;
    if(this.event.keyCode===9){
      //if partial entry
      if(aJson['partialEntry']){
        //if the right side of the cursor is empty, not complete
        if(firstPostPart.length<1){
          //if the autocomplete options is open
          var ul=jQuery('.CodeMirror-hints:first');
          if(ul.length>0){
            //if there's more than one option
            var lis=ul.children('li.CodeMirror-hint');
            if(lis.length>1){
              //figure out if all of the the options continue with a common string that can be tabbed into, but not fully completed
              var commonStart='', commonContinuation='';
              ul.children('li.CodeMirror-hint').each(function(){
                var li=jQuery(this); var txt=li.text();
                //remove the string that's already been written
                var continuation=txt.substring(lastTrigPart.length);
                //if this is the first option's start
                if(commonStart.length<1){
                  //set the common starting string (left of the cursor, and common to all of the current options)
                  commonStart=txt.substring(0, lastTrigPart.length);
                }
                //if this is the first option's continuation
                if(commonContinuation.length<1){
                  //set the full continuation
                  commonContinuation=continuation;
                }else{
                  //not the first continuation to process...

                  //if the common continuation is longer than this continuation
                  if(commonContinuation.length>continuation.length){
                    //the common continuation can only be as long as the shortest option
                    commonContinuation=commonContinuation.substring(0, continuation.length);
                  }
                  //if the common continuation is not the start of this continuation
                  if(continuation.indexOf(commonContinuation)!==0){
                    var newCommon='';
                    for(var c=0;c<commonContinuation.length;c++){
                      newCommon+=commonContinuation[c];
                      //if the common continuation no longer fullfills this continuation at this point
                      if(continuation.indexOf(newCommon)!==0){
                        newCommon=newCommon.substring(0, newCommon.length-1);
                        break;
                      }
                    }
                    //set the trimmed continuation string
                    commonContinuation=newCommon;
                  }
                }
                //if there is no commonContinuation string that satisfies all of the options so far
                if(commonContinuation.length<1){
                  //end the options loop
                  return false;
                }
              });
              //if there is a commonContinuation string that satisfies, but doesn't complete, options
              var tabInsertedStr='';
              if(commonContinuation.length>0){
                //insert only the part of the options that are common to all of the options (instead of the full selected option)
                tabInsertedStr=commonStart+commonContinuation;
              }else{
                //there is no possible partial completion... do nothing (cancel out input by inserting the string that's already there)
                tabInsertedStr=lastTrigPart;
              }
              //insert something for this tab press (note: this replaces the native autocomplete insert value)
              editor.replaceRange(tabInsertedStr,
                CodeMirror.Pos(completion.from.line, completion.from.ch),
                CodeMirror.Pos(completion.to.line, completion.to.ch + pickedOption.length)
              );
              //indicate that this was tab completed
              isTabComplete=true;
            }
          }
        }
      }
    }
    //if not tab completing the common part of the available options
    if(!isTabComplete){
      //if __complete format exists on this line
      if(aJson.indexOfComplete>-1){
        //if not partialEntry
        if(!aJson['partialEntry']){
          var newCur = editor.getCursor();
          var newEnd = newCur.ch, newStart = newEnd;
          //get the newLine split
          var newLineSplit=getLineSplit(editor);
          //get the picked text (added to the left side of the cursor)
          var pickedText=newLineSplit[0].substring(lineSplit[0].length);
          newStart-=pickedText.length;
          //figure out if there is a separator left of the pickedText
          var left='', needsReplace=false;
          if(dataAtCursor.hasOwnProperty('left')){
            left=trimIfNotAllWhitespace(dataAtCursor['left']);
            //if there is a pre separator
            if(left.length>0){
              //if this pre separator is NOT left of the cursor
              var leftSplit=trimIfNotAllWhitespace(lineSplit[0]);
              if(leftSplit.lastIndexOf(left)!==leftSplit.length-left.length){
                newStart-=lastTrigPart.length;
                needsReplace=true;
              }
            }
          }
          //figure out if there is a separator right of the pickedText
          var right='';
          if(dataAtCursor.hasOwnProperty('right')){
            right=trimIfNotAllWhitespace(dataAtCursor['right']);
            //if there is a post separator
            if(right.length>0){
              //if this post separator is NOT right of the cursor
              var rightSplit=trimIfNotAllWhitespace(lineSplit[1]);
              if(rightSplit.indexOf(right)!==0){
                newEnd+=firstPostPart.length;
                needsReplace=true;
              }
            }
          }
          //if the replace needs to happen
          if(needsReplace){
            editor.replaceRange(pickedText,
              CodeMirror.Pos(newCur.line, newStart),
              CodeMirror.Pos(newCur.line, newEnd)
            );
          }
        }
      }
    }
  });
  //return
  return completion;
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
//match a pattern like "something = 4;" to return "something"
function matchLeftIntegerAssign(str, defaultRet, min, max, globalFlag){
  var ret=[];
  var reg=new RegExp('(\\w+|\\w+\\.\\w+)[ ]?=[ ]?\\d+[ ]?\\;', globalFlag);
  var matches=str.match(reg);
  if(matches!=undefined){
    for(var m=0;m<matches.length;m++){
      var match=matches[m];
      if(match.indexOf('=')!==-1){
        var left=match.substring(0,match.indexOf('='));
        var right=match.substring(left.length+'='.length);
        var num=parseInt(right);
        if(!isNaN(num)){
          if(isNaN(min) || min<=num){
            if(isNaN(max) || num<=max){
              left=left.trim();
              if(ret.indexOf(left)===-1){
                ret.push(left);
              }
            }
          }
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
//surround each item in an array with pre and post text, if the item doesn't already have the pre / post
function surroundOptions(ops, pre, post){
  var newOps=[];
  for(var o=0;o<ops.length;o++){
    var op=ops[o], addPre=false, addPost=false;
    if(pre.length>0 && op.indexOf(pre)!==0){
      addPre=true;
    }
    if(post.length>0 && op.lastIndexOf(post)!==op.length-post.length){
      addPost=true;
    }
    if(addPre){ op=pre+op; }
    if(addPost){ op+=post; }
    newOps.push(op);
  }
  return newOps;
}
//if some of the array items contain "contains" as a substring, then remove the options that don't
function reduceOptionsIfSomeContain(ops, contains){
  var opsContain=[];
  contains=contains.toLowerCase();
  for(var o=0;o<ops.length;o++){
    if(ops[o].toLowerCase().indexOf(contains)!==-1){
      opsContain.push(ops[o]);
    }
  }
  if(opsContain.length>0){ ops=opsContain; }
  return ops;
}
