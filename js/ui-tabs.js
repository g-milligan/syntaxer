//parse the template html to get all of the tab names in the order in which the appear in the template html
//getOrderedTabNames also tries to match every single valid file tag with a tag and decides
//if some tabs should be modified, removed, or added depending on the syntax tags written into the template
function getOrderedTabNames(temContent){
  var ret;
  //get the big template content string, if not passed as arg
  if(temContent==undefined){
    var temTabLi=getTemplateTabLi();
    if(temTabLi.length>0){
      temContent=getFileContent(temTabLi);
    }
  }
  //if template content string is available
  if(temContent!=undefined){
    var matches=temContent.match(/\[(.*?)\]/g); var prevMatch='', prevMatchTag='';
    if(matches!=undefined && matches.length>0){
      var tabsUl=jQuery('nav#tabs:first').children('ul:first');
      if(tabsUl.length>0){
        tabsUl.children('li[path]').not('.template').addClass('unmatched');
        var anyChanges=false, modifiedIndexes={}, addedIndexes={}, removedNames=[], nameIndexes={}, lineIndexes={}, extIndexes={}, dataArray=[];
        //add to the modified indexes json
        var setModifiedIndex=function(json){
          anyChanges=true;
          if(!modifiedIndexes.hasOwnProperty(json.lineIndex)){
            modifiedIndexes[json.lineIndex]=[];
          }
          if(modifiedIndexes[json.lineIndex].indexOf(json.arrayDataIndex)===-1){
            modifiedIndexes[json.lineIndex].push(json.arrayDataIndex);
          }
        };
        //add to the added indexes json
        var setAddedIndex=function(json){
          anyChanges=true;
          if(!addedIndexes.hasOwnProperty(json.lineIndex)){
            addedIndexes[json.lineIndex]=[];
          }
          if(addedIndexes[json.lineIndex].indexOf(json.arrayDataIndex)===-1){
            addedIndexes[json.lineIndex].push(json.arrayDataIndex);
          }
        };
        //add to the removed names
        var setRemovedName=function(path){
          anyChanges=true;
          if(removedNames.indexOf(path)===-1){
            removedNames.push(path);
          }
        };
        //function to get the line index of a [tab]
        var lineIndex=0, linesStr=temContent;
        var getLineIndexOfTab=function(startTab){
          //get the line index where this tag is found
          var ls=linesStr.substring(0, linesStr.indexOf(startTab)+startTab.length);
          ls=ls.trimRight(); ls=ls.split('\n'); lineIndex+=(ls.length-1);
          linesStr=linesStr.substring(linesStr.indexOf(startTab)); //remove the parsed string up to this point
          return lineIndex;
        };
        //function to get the previous line index of an li element
        var getPrevIndexOfLi=function(li){
          //capture the previous line index, if any (default to -1)
          var prevLineIndex=li.attr('line'); if(prevLineIndex==undefined){ prevLineIndex=''; } prevLineIndex=prevLineIndex.trim();
          if(prevLineIndex.length<1){ prevLineIndex=-1; }
          else{ prevLineIndex=parseInt(prevLineIndex); }
          if(isNaN(prevLineIndex)){ prevLineIndex=-1; }
          return prevLineIndex;
        };
        //function to group tab li with json data from the syntax tag
        var groupTabLiWIthTag=function(li, json){
          if(li!=undefined && li.length>0){
            //update tab data json
            json['tabLi']=li;
            json['prevLineIndex']=getPrevIndexOfLi(li);
            var span=li.children('span:first');
            var spanname=span.text(); spanname=spanname.trim();
            if(spanname!==json.name){
              json['prevName']=spanname;
              setTabPath(li, json.name);
              //indicate modification
              setModifiedIndex(json);
            }
            //update li
            li.removeClass('unmatched');
            li.removeClass('removed-tab');
            if(json['prevLineIndex']!==json['lineIndex']){
              li.attr('line', json['lineIndex']);
            }
          } return json;
        };
        //for each matched [tabName] tag
        var unmatchedByName=[];
        for(var m=0;m<matches.length;m++){
          var match=matches[m];
          var matchTag=match;
          match=match.substring('['.length);
          match=match.substring(0, match.length-']'.length);
          if(match.trim().indexOf('/')===0){
            if(prevMatch.trim()===match.substring(match.indexOf('/')+'/'.length).trim()){
              //init the tab data json
              var ext=getExtension(prevMatch);
              var tabData={name:prevMatch, prevName:prevMatch, ext:ext, isDuplicate:true, lineIndex:-1, prevLineIndex:-1, arrayDataIndex:dataArray.length};
              if(!extIndexes.hasOwnProperty(ext)){
                extIndexes[ext]=[];
              }
              extIndexes[ext].push(dataArray.length);
              //get basic data like the line index
              tabData['lineIndex']=getLineIndexOfTab(prevMatchTag);
              lineIndexes[tabData['lineIndex']]=dataArray.length;
              //if not duplicate name
              if(!nameIndexes.hasOwnProperty(prevMatch)){
                tabData['isDuplicate']=false;
                nameIndexes[prevMatch]=[dataArray.length];
                //try to get the tab li element for this line (based on the matched name)
                var tabLi=tabsUl.children('li[path$="/'+prevMatch+'"].unmatched:first');
                if(tabLi.length<1){ var tabLi=tabsUl.children('li[path="'+prevMatch+'"].unmatched:first'); }
                if(tabLi.length>0){
                  tabLi.removeClass('duplicate');
                  //yay, a tab li exists with this name
                  tabData=groupTabLiWIthTag(tabLi, tabData);
                }else{
                  //will have to find a different way to link a tab li with this syntax tag...
                  unmatchedByName.push(tabData);
                }
              }else{
                //this is a duplicate name
                dataArray[nameIndexes[prevMatch][0]]['isDuplicate']=true; //set the first name as duplicate
                nameIndexes[prevMatch].push(dataArray.length); //add another name index to the list
                //add the duplicate class
                var dupLi=tabsUl.children('li[path$="/'+prevMatch+'"]');
                if(dupLi.length<1){ var dupLi=tabsUl.children('li[path="'+prevMatch+'"]'); }
                if(dupLi.length>0){ dupLi.addClass('duplicate'); dupLi.removeClass('unmatched'); }
              }
              //add the data to the array
              dataArray.push(tabData);
            }
          }
          prevMatch=match;
          prevMatchTag=matchTag;
        }
        //function to set the tab data in the dataArray
        var setTabDataInArray=function(data){
          //for each instance of this name in the dataArray
          for(var i=0;i<nameIndexes[data.name].length;i++){
            var arrayIndex=nameIndexes[data.name][i];
            //set the data with the tab li info
            dataArray[arrayIndex]=data;
          }
        };
        //for each unmatched name (matching by name failed, but now let's try to match by line index)
        var unmatchedByLine=[];
        for(var n=0;n<unmatchedByName.length;n++){
          var tabData=unmatchedByName[n];
          //try to get the tab li element for this line (based on the matched line index)
          var tabLi=tabsUl.children('li[path][line="'+tabData.lineIndex+'"].unmatched:first');
          if(tabLi.length>0){
            if(tabData['isDuplicate']){
              tabLi.addClass('duplicate');
            }
            //yay, a tab li exists with this line index
            tabData=groupTabLiWIthTag(tabLi, tabData);
            //set the data into the dataArray
            setTabDataInArray(tabData);
          }else{
            //this syntax tag couldn't be matched to a tab by line number either...
            unmatchedByLine.push(tabData);
          }
        }
        //function to create a new tab
        var createNewTabElement=function(data){
          if(!data['isDuplicate']){
            //create the new tab
            var newLi=addFileTab(data.name,undefined,undefined,true);
            if(newLi!=undefined && newLi.length>0){
              //yay, a tab li exists with this line index
              data=groupTabLiWIthTag(newLi, data);
              //set the data into the dataArray
              setTabDataInArray(data);
              //indicate the added change
              setAddedIndex(data);
            }
          }
        };
        //function to remove tab li
        var removeTabElement=function(li){
          setRemovedName(li.attr('path'));
          removeTab(li);
        };
        //if there are any unmatched tabs
        if(tabsUl.children('li[path].unmatched').length>0){
          //if there are also any unmatched syntax tags
          if(unmatchedByLine.length>0){
            //function to set the li/data grouping that was matched together by a shared extension
            var extLookup={}, extUnmatchedCount=0;
            var groupExtLookupWithTag=function(tli, extension, index){
              var data=extLookup[extension][index];
              //yay, a tab li exists with this extension's data
              data=groupTabLiWIthTag(tli, data);
              //set the data into the dataArray
              setTabDataInArray(data);
              //remove this extension item from extLookup
              extLookup[extension].splice(index,1);
              extUnmatchedCount--;
            };
            //index the unmatched syntax tags by their extension
            for(var e=0;e<unmatchedByLine.length;e++){
              if(!extLookup.hasOwnProperty(unmatchedByLine[e].ext)){
                extLookup[unmatchedByLine[e].ext]=[];
              } extLookup[unmatchedByLine[e].ext].push(unmatchedByLine[e]);
              extUnmatchedCount++;
            }
            //for each unmatched tab
            tabsUl.children('li[path].unmatched').each(function(){
              var li=jQuery(this); var path=li.attr('path');
              var ext=getExtension(path);
              if(extLookup.hasOwnProperty(ext)){
                if(extLookup[ext].length===1){
                  //match this tab up with this syntax tag that has the same extension
                  groupExtLookupWithTag(li,ext,0);
                }else if(extLookup[ext].length>1){
                  //if the tab has a line index number attribute...
                  var line=li.attr('line'); if(line==undefined){line='';} line=line.trim();
                  if(line.length<1){line=-1;}else{line=parseInt(line);}
                  if(isNaN(line)){line=-1;}
                  if(line>-1){
                    //find the closest line number
                    var smallestDiff=-1, bestIndex=-1;
                    var setBestIndexCandidate=function(i,thisLine){
                      var breakLoop=false, diff=-1;
                      if(thisLine===line){ diff=0; breakLoop=true; }
                      else if(thisLine>line){ diff=thisLine-line; }
                      else if(thisLine<line){ diff=line-thisLine; }
                      if(bestIndex===-1 || diff<smallestDiff){
                        smallestDiff=diff; bestIndex=i;
                      } return breakLoop;
                    };
                    for(var s=0;s<extLookup[ext].length;s++){
                      //is this tag's index the closest to the tab's index so far?
                      if(setBestIndexCandidate(s, extLookup[ext][s].lineIndex)){ break; }
                    }
                    //match this tab up with the unmatched tag, that has the same extension, and the closest line index
                    if(bestIndex>-1){ groupExtLookupWithTag(li,ext,bestIndex); }
                  }else{
                    //tab doesn't have a line index number attribute...
                    //just match this tab up with the first unmatched tag, with the same extension
                    groupExtLookupWithTag(li,ext,0);
                  }
                }
              }
            });
            //compile remaining unmatched syntax tags, just pair any unmatched tab with an unmatched tag, if any remain
            if(extUnmatchedCount>0){
              for(ext in extLookup){
                if(extLookup.hasOwnProperty(ext)){
                  for(var e=0;e<extLookup[ext].length;e++){
                    //if there is an unmatched tab left
                    var leftoverLi=tabsUl.children('li[path].unmatched:first');
                    if(leftoverLi.length>0){
                      //yay, a tab li was paired with this syntax tag by default
                      var data=groupTabLiWIthTag(leftoverLi, extLookup[ext][e]);
                      //set the data into the dataArray
                      setTabDataInArray(extLookup[ext][e]);
                    }else{
                      //no unmatched tabs left... so create this as a new tab
                      createNewTabElement(extLookup[ext][e]);
                    }
                  }
                }
              }
            }
          }
          //if there are only unmatched tabs remaining, but no unmatched syntax tags to pair with anymore... remove the remaining unmatched tabs
          tabsUl.children('li[path].unmatched').not('.removed-tab').each(function(){
            removeTabElement(jQuery(this));
          });
        //no unmatched tabs, but there are extra syntax tags
        }else if(unmatchedByLine.length>0){
          for(var u=0;u<unmatchedByLine.length;u++){
            createNewTabElement(unmatchedByLine[u]);
          }
        }
        //build return json
        ret={
          anyChanges:anyChanges,
          modifiedIndexes:modifiedIndexes,
          addedIndexes:addedIndexes,
          removedNames:removedNames,
          nameIndexes:nameIndexes,
          lineIndexes:lineIndexes,
          extIndexes:extIndexes,
          dataArray:dataArray
        }
      }
    }
  } return ret;
}
//get data for a specific type of extension
function getExtensionData(ext){
  ext=ext.toLowerCase();
  //which codemirror mode to use based on the file path extension
  var mode='', dirPath='/'; var hintType;
  switch(ext){
    case 'js': mode='javascript'; hintType='gljs'; dirPath='js/'; break;
    case 'html': mode='htmlmixed'; dirPath='html/'; break;
    case 'template': mode='htmlmixed'; hintType='template'; dirPath=''; break;
    case 'frag': mode='webglslfrag'; dirPath='glsl/'; break;
    case 'vert': mode='webglslvert'; dirPath='glsl/'; break;
    case 'txt': mode=''; dirPath='txt/'; break;
    case 'json': mode='javascript'; dirPath='json/'; break;
    case 'css': mode='css'; dirPath='css/'; break;
    default:
      break;
  }
  return {mode:mode, hintType:hintType, dirPath:dirPath};
}
//get extension string
function getExtension(nameOrPath){
  //get just the extension from the file path
  var ext=nameOrPath;
  if(ext.indexOf('.')!==-1){
    ext=ext.substring(ext.lastIndexOf('.')+'.'.length);
    ext=ext.trim(); ext=ext.toLowerCase();
  }else{ext='';}
  return ext;
}
//very important function to init the code mirror editor for a given file path
function setCodemirrorContent(fpath,textarea,callback){
  var wrap=textarea.parent();
  //get just the extension from the file path
  var ext=getExtension(fpath);
  //if this is the main template file
  var tabLi=jQuery('nav#tabs').children('ul:first').children('li[path="'+fpath+'"]:first');
  if(tabLi.hasClass('template')){
    ext="template";
    //parse the tab tags (set the line attributes on the tabs)
    var tagData=getOrderedTabNames(textarea.val());
  }
  //get data for a specific type of extension
  var extData=getExtensionData(ext);
  //set the codemirror config options
  var config={};
  config['value']=textarea.val();
  config['lineNumbers']=true;
  config['extraKeys']={
    'Ctrl-Space':'autocomplete'
  };
  config['styleActiveLine']=true;
  if(extData.mode.length>0){
    config['mode']=extData.mode;
  }
  //init the editor textarea
  var myCodeMirror = CodeMirror(function(el) {
    //textarea.removeClass('raw');
    textarea[0].parentNode.replaceChild(el, textarea[0]);
  },config);
  myCodeMirror['myHintType']=extData.hintType;
  //get the edited string and check to see if it could influence tabs
  var editTextIsTabEmbed=function(instance, fromLine, toLine){
    var editTabTxt=false;
    if(toLine==undefined){toLine=fromLine;}
    //get the text from the "from" line to the "to" line
    var editTxt='';
    for(var i=fromLine;i<=toLine;i++){
      editTxt+=instance.doc.getLine(i)+'\n';
    }
    editTxt=editTxt.trim();
    //if the edit text contains one of the embed tag characters
    if(editTxt.indexOf('[')!==-1){ editTabTxt=true; }
    else if(editTxt.indexOf(']')!==-1){ editTabTxt=true; }
    return editTabTxt;
  };
  //given a line index, return just the [tab-name] of the line
  var getTabNameAtLine=function(instance, lineIndex){
    var ret;
    //get the name line
    var nameLine;
    if(typeof lineIndex==='string'){ nameLine=lineIndex; }
    else{ nameLine=instance.doc.getLine(lineIndex); }
    //get the name from the nameLine
    if(nameLine.indexOf('[')!==-1){
      nameLine=nameLine.substring(nameLine.indexOf('[')+'['.length);
      if(nameLine.indexOf(']')!==-1){
        nameLine=nameLine.substring(0,nameLine.indexOf(']'));
        nameLine=nameLine.trim();
        if(nameLine.indexOf('/')===0){
          nameLine=nameLine.substring('/'.length);
          nameLine=nameLine.trim();
        }
        ret=nameLine;
      }
    }
    return ret;
  };
  //indicate if this line contains a [start] or [/end] tab
  var isStartOrEndTabLine=function(lineStr){
    var startOrEnd;
    if(lineStr.indexOf('[')!==-1){
      lineStr=lineStr.substring(lineStr.indexOf('[')+'['.length);
      if(lineStr.indexOf(']')!==-1){
        lineStr=lineStr.substring(0,lineStr.indexOf(']'));
        lineStr=lineStr.trim();
        if(lineStr.indexOf('/')===0){
          startOrEnd='end';
        }else{
          startOrEnd='start';
        }
      }
    }
    return startOrEnd;
  };
  //given the index of a line that contains a [tab] or [/tab] retrieve information about it's sibling [/tab] or [tab]
  var getLinkedTabNameLine=function(instance, lineIndex){
    var ret;
    //get the full cursor line and figure out if it's the end or start tag for a tab name
    var thisLine=instance.doc.getLine(lineIndex);
    var startOrEnd=isStartOrEndTabLine(thisLine);
    if(startOrEnd!=undefined){
      var otherLineIndex=lineIndex;
      switch(startOrEnd){
        case 'start': otherLineIndex+=2; break;
        case 'end': otherLineIndex-=2; break;
      }
      var otherLine=instance.doc.getLine(otherLineIndex);
      if(otherLine!=undefined){
        //if the other tag for this tab is the opposite for this tag
        var otherStartOrEnd=isStartOrEndTabLine(otherLine);
        if(otherStartOrEnd!=undefined){
          if(otherStartOrEnd!==startOrEnd){
            var tabName=getTabNameAtLine(instance, thisLine);
            if(tabName!=undefined){
              var otherTabName=getTabNameAtLine(instance, otherLine);
              if(otherTabName!=undefined){
                var tabNameIndex=thisLine.indexOf('[')+'['.length;
                var otherTabNameIndex=otherLine.indexOf('[')+'['.length;
                switch(startOrEnd){
                  case 'start': otherTabNameIndex+='/'.length; break;
                  case 'end': tabNameIndex+='/'.length; break;
                }
                //return data
                ret={
                  lineIndex:lineIndex, thisLine:thisLine, startOrEnd:startOrEnd, tabNameIndex:tabNameIndex, tabName:tabName,
                  otherLineIndex:otherLineIndex, otherLine:otherLine, otherStartOrEnd:otherStartOrEnd, otherTabNameIndex:otherTabNameIndex, otherTabName:otherTabName
                };
              }
            }
          }
        }
      }
    }
    return ret;
  };
  //when one tab name is changed, the corresponding tab tag should be auto-updated
  var alignLinkedTabName=function(instance, lineIndex){
    var j=getLinkedTabNameLine(instance, lineIndex);
    if(j!=undefined){
      //if the names are out of sync
      if(j.tabName!==j.otherTabName){
        var replace, replaceWith;
        switch(j.otherStartOrEnd){
          case 'start': replace='['+j.otherTabName+']'; replaceWith='['+j.tabName+']'; break;
          case 'end': replace='[/'+j.otherTabName+']'; replaceWith='[/'+j.tabName+']'; break;
        }
        //get the updated line
        var newLine=j.otherLine.replace(replace, replaceWith);
        //update the linked line
        instance.doc.replaceRange(newLine,
          CodeMirror.Pos(j.otherLineIndex, 0),
          CodeMirror.Pos(j.otherLineIndex, j.otherLine.length)
        );
      }
    } return j;
  };
  //codemirror editor events
  myCodeMirror.on('beforeChange', function(instance, object){
    var tabLi=jQuery('nav#tabs').children('ul:first').children('li[path="'+fpath+'"]:first');
    //if this is the template tab li
    if(tabLi.hasClass('template')){
      //reset the tab code indicator data
      myCodeMirror['didEditPossibleTabLine']=false;
      //if this is delete
      if(object.origin==='+delete' || object.origin==='cut'){
        //indicate if embed code for a tab got edited
        var didEdit=editTextIsTabEmbed(instance, object.from.line, object.to.line);
        myCodeMirror['didEditPossibleTabLine']=didEdit;
      }
    }
  });
  myCodeMirror.on('change', function(instance, object){
    //indicate unsaved change
    jQuery('body:first').addClass('has-changes');
    var tabLi=jQuery('nav#tabs').children('ul:first').children('li[path="'+fpath+'"]:first');
    tabLi.addClass('has-changes');
    //if this is the template tab li
    if(tabLi.hasClass('template')){
      //if not delete (already considered in the beforeChange event)
      if(object.origin!=='+delete' && object.origin!=='cut'){
        //indicate if embed code for a tab got edited
        var didEdit=editTextIsTabEmbed(instance, object.from.line, object.to.line);
        myCodeMirror['didEditPossibleTabLine']=didEdit;
      }
      //if tab text was edited
      if(myCodeMirror['didEditPossibleTabLine']){
        //get the tab name on the line where the cursor is located
        var curLineIndex=instance.doc.getCursor().line;
        //auto-align the corresponding tag with the changed tag name
        alignLinkedTabName(instance, curLineIndex);
        //get the list of all tab names that appear in the html (and update tabs based on written tags)
        var tabs=getOrderedTabNames();
        //if any tab edits were made, like add, remove, modify
        if(!tabs.anyChanges){
          //no tabs removed, added or modified...

          //if the line is the start of a tab name placeholder
          var suggestHint=false;
          var curLine=instance.doc.getLine(curLineIndex);
          if(curLine.indexOf('[')!==-1){
            curLine=curLine.substring(curLine.indexOf('[')+'['.length);
            //if the line ends with [
            if(curLine.length<1){ suggestHint=true; }
            else{
              //there is text after [...

              //if there are no spaces
              var whiteSpaceChars=curLine.match(/\s/gi);
              if(whiteSpaceChars==undefined || whiteSpaceChars.length<1){
                //if there are no illegal characters in the name
                var allowedChars=curLine.match(/\w|\.|-/gi);
                if(allowedChars!=undefined && allowedChars.length===curLine.length){
                  suggestHint=true;
                }
              }
            }
          }
          //show the tab placeholder completion hint?
          myCodeMirror['suggestTabNameHint']=suggestHint;
        }
      }
    }
    //autocomplete
    if(myCodeMirror['myHintType']){
      //show the hints dropdown
      myCodeMirror.showHint({
        eventTrigger:'change',
        completeSingle:false, //auto-complete when only one option remains?
        closeOnUnfocus:true, //close options dropdown when lose focus?
        hint:CodeMirror.hint[myCodeMirror['myHintType']] //what hints list?
      });
    }
  });
  //when mouse cursor position changes
  myCodeMirror.on('cursorActivity', function(instance, object){
    //autocomplete
    if(myCodeMirror['myHintType']){
      //show the hints dropdown
      myCodeMirror.showHint({
        eventTrigger:'cursorActivity',
        completeSingle:false, //auto-complete when only one option remains?
        closeOnUnfocus:true, //close options dropdown when lose focus?
        hint:CodeMirror.hint[myCodeMirror['myHintType']] //what hints list?
      });
    }
    //if this is the template tab li
    var temLi=jQuery('nav#tabs').children('ul:first').children('li.template.active:first');
    if(temLi.length>0){
      myCodeMirror['suggestTabNameHint']=false;
      //if the cursor is on one line that is paired with another tab tag
      var lineIndex=instance.doc.getCursor().line
      var json=getLinkedTabNameLine(instance, lineIndex);
      if(json!=undefined){
        var markTabName=function(lineIndex, charStartIndex, charEndIndex){
          //highlight marker for the tab name
          var marker=instance.doc.markText(
            CodeMirror.Pos(lineIndex, charStartIndex),
            CodeMirror.Pos(lineIndex, charEndIndex),
            { className:'hint-focus', clearWhenEmpty:true }
          );
          //push this marker into an array so it can be cleared when the cursor moves
          if(!myCodeMirror.hasOwnProperty('hintFocusMarkers') || myCodeMirror['hintFocusMarkers']==undefined){ myCodeMirror['hintFocusMarkers']=[]; }
          myCodeMirror['hintFocusMarkers'].push(marker);
        };
        //highlight the start/end tags for the tag name
        markTabName(json.lineIndex, json.tabNameIndex, json.tabNameIndex+json.tabName.length);
        markTabName(json.otherLineIndex, json.otherTabNameIndex, json.otherTabNameIndex+json.otherTabName.length);
      }
    }
  });
  //create a placeholder for the content menus
  wrap.append('<div class="content-menus"></div>');
  var subMenus=wrap.children('.content-menus:last');
  subMenus.append('<div class="menu-bodies"></div>');
  subMenus.append('<div class="menu-btns"><div title="back to code" class="btn-cancel"></div></div>');
  var btnsWrap=subMenus.children('.menu-btns:first');
  var btnCancel=btnsWrap.children('.btn-cancel:first');
  //standard content menu events
  btnCancel.click(function(){
    var divWrap=getEditorDiv(getActiveTabLi());
    var divActive=divWrap.children('.content-menus:last').children('.menu-bodies:first').children('.active:first');
    if(divActive.length>0){
      divActive[0]['contentMenuClose']();
    }
  });
  //callback function
  if(callback!=undefined){
    callback(myCodeMirror, extData.mode);
  }
}
//remove a tab
function removeTab(tabLi){
  if(tabLi!=undefined && tabLi.length>0){
    tabLi.addClass('removed-tab');
    //if this tab was never saved to the file
    if(tabLi.hasClass('pending-save')){
      //then just remove the elements; no lost work there, probably
      var tabpath=tabLi.attr('path');
      tabLi.remove();
      var div=getEditorDiv(tabpath);
      if(div!=undefined){
        div.remove();
      }
    }
  }
}
//update the name of a tab
function setTabPath(tabLi, newname){
  //update the tab name
  if(tabLi!=undefined && tabLi.length>0){
    //get the new path
    var oldpath=tabLi.attr('path');
    var div=getEditorDiv(oldpath);
    var newpath=oldpath;
    if(newpath.indexOf('/')!==-1){
      newpath=newpath.substring(0,newpath.lastIndexOf('/')+'/'.length);
      newpath+=newname;
    }else{
      newpath=newname;
    }
    //modify the tab html
    tabLi.removeClass('removed-tab');
    tabLi.addClass('modified-path');
    if(tabLi.attr('old_path')==undefined){
      tabLi.attr('old_path',oldpath);
    }
    //if reverting back to the original path after changing it
    if(newpath===tabLi.attr('old_path')){
      //remove the indicator that the path changed
      tabLi.attr('old_path','');
      tabLi.removeAttr('old_path');
      tabLi.removeClass('modified-path');
    }
    tabLi.attr('path',newpath);
    tabLi.attr('title',newpath);
    if(newname.length<1){
      tabLi.addClass('empty-name');
      tabLi.children('span:first').html('&nbsp;');
    }else{
      tabLi.removeClass('empty-name');
      tabLi.children('span:first').html(newname);
    }
    //modify the content div html
    if(div!=undefined){
      div.attr('path',newpath);
    }
  }
}
function addFileTab(fpath,fcontent,isTemplateFile,isPendingSave){
  if(fcontent==undefined){fcontent='';}
  if(isTemplateFile==undefined){isTemplateFile=false;}
  if(isPendingSave==undefined){isPendingSave=false;}
  //if this tab doesn't already exist as a removed tab (also fpath could be just the name)
  var tabLi=jQuery('body:first').children('nav#tabs:first').children('ul:first').children('li[path$="/'+fpath+'"].removed-tab:first');
  if(tabLi.length<1){
    tabLi=jQuery('body:first').children('nav#tabs:first').children('ul:first').children('li[path="'+fpath+'"].removed-tab:first');
  }
  if(tabLi.length<1){
    //get just the name without the path
    var fname=fpath;
    if(fname.indexOf('/')!==-1){
      fname=fname.substring(fname.lastIndexOf('/')+'/'.length);
    }else{
      //the fpath is just a file name... add a file path before the name
      var ext=getExtension(fpath);
      var extData=getExtensionData(ext);
      fpath=extData.dirPath+fname;
    }
    //get key elements
    var tabsWrap=jQuery('#tabs:first');
    var ul=tabsWrap.children('ul:first');
    var filterBox;
    //init the ul list if not already init
    if(ul.length<1){
      tabsWrap.append('<ul><li name="_filter">'+getFilterInputStr('search tabs')+'</li></ul>');
      ul=tabsWrap.children('ul:first');
      var filterLi=ul.children('li:first');
      filterBox=filterLi.children('span.filter-box:first');
    }else{
      filterBox=ul.children('li[name="_filter"]:first').children('span.filter-box:first');
    }
    //create the tab, if not exists already
    if(ul.children('li[path="'+fpath+'"]:first').length<1){
      ul.append('<li title="'+fpath+'" path="'+fpath+'"><span>'+fname+'</span></li>');
      var newLi=ul.children('li:last');
      if(isTemplateFile){
        newLi.addClass('template');
      }
      if(isPendingSave){
        newLi.addClass('pending-save');
      }
      //create the content for this tab
      var contentWrap=jQuery('section#file-content:first');
      if(contentWrap.children('div[path="'+fpath+'"]:first').length<1){
        contentWrap.append('<div class="content-wrap" path="'+fpath+'"></div>');
        var wrap=contentWrap.children('div:last');
        wrap.append('<textarea class="raw"></textarea>');
        var textarea=wrap.children('textarea:last');
        textarea.val(fcontent);
        if(isTemplateFile){
          wrap.addClass('template');
        }
      }
      var showTabContent=function(cWrap,cDiv,tabLi){
        cWrap.children('div[path]').removeClass('active');
        cDiv.addClass('active');
        tabLi.parent().children('li').not('li[name="_filter"]').removeClass('active');
        tabLi.addClass('active');
      };
      var newSpan=newLi.children('span:first');
      newSpan.click(function(e){
        var tLi=jQuery(this).parent();
        var path=tLi.attr('path');
        var cWrap=jQuery('section#file-content:first');
        var cDiv=cWrap.children('div[path="'+path+'"]:first');
        if(cDiv.length>0){
          //if the textarea isn't codemirrored yet
          var cta=cDiv.children('textarea.raw:first');
          if(cta.length>0){
            //show the content after codemirror does its thing
            showTabContent(cWrap,cDiv,tLi);
            //codemirror the code
            setCodemirrorContent(path,cta,function(myCodeMirror,mode){
              //save the code mirror objects in the div property list
              cDiv[0]['codeMirror']={object:myCodeMirror,mode:mode};
            });
          }else{
            //already code mirrored... show this content for this tab
            showTabContent(cWrap,cDiv,tLi);
          }
        }
      });
      tabLi=newLi;
    }
  }else{
    //this tab already exists
    tabLi.removeClass('removed-tab');
  }
  if(tabLi.length<1){ tabLi=undefined; }
  return tabLi;
}
//related to the tab filter/search
function getFilterInputStr(defaultTxt){
  if(defaultTxt==undefined){defaultTxt='filter';}
  var html='';
  html+='<span class="filter-box">';
  html+='<input type="text" value="'+defaultTxt+'" />';
  html+='<span class="filter-btn"></span>';
  html+='</span>';
  return html;
}
//related to the tab filter/search
function addFilterBoxItem(filterBox,itemJson){
  if(filterBox.hasClass('filter-box')){
    var ul=filterBox.children('ul.filter-items:last');
    if(ul.length<1){
      filterBox.append('<ul class="filter-items"></ul>');
      ul=filterBox.children('ul.filter-items:last');
    }
    if(itemJson.hasOwnProperty('val')){
      if(itemJson.hasOwnProperty('txt')){
        ul.append('<li val="'+val+'">'+txt+'</li>');
        var li=ul.children('li:last');
        //item click action
        if(itemJson.hasOwnProperty('_action')){
          var actionEvent=itemJson['_action'];
          li[0]['itemClickAction']=actionEvent;
        }
        //init the onchange event for the filter box
        if(!filterBox[0].hasOwnProperty('filterChangeAction')){
          //set the filter change action for this filter-box
          filterBox[0]['filterChangeAction']=function(trigger){
            //if trigger is selecting a dropdown item
            switch(trigger[0].tagName.toLowerCase()){
              case 'li':
                //***
                //execute additional trigger action if any custom _action is assigned
                if(trigger[0].hasOwnProperty('itemClickAction')){
                  trigger[0]['itemClickAction'](trigger);
                }
                break;
              case 'input':
                //***
                break;
            }
          };
          //set input events
          var input=filterBox.children('input:first');
          //***
        }
        //bind the new li trigger
        li.click(function(){
          filterBox[0]['filterChangeAction'](jQuery(this));
        });
      }
    }
  }
}
