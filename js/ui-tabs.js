//very important function to init the code mirror editor for a given file path
function setCodemirrorContent(fpath,textarea,callback){
  var wrap=textarea.parent();
  //get just the extension from the file path
  var ext=fpath;
  if(ext.indexOf('.')!==-1){
    ext=ext.substring(ext.lastIndexOf('.')+'.'.length);
  }else{ext='';}
  ext=ext.toLowerCase();
  //which codemirror mode to use based on the file path extension
  var mode=''; var hintType;
  switch(ext){
    case 'js': mode='javascript'; hintType='gljs'; break;
    case 'html': mode='htmlmixed';
      var tabLi=jQuery('nav#tabs').children('ul:first').children('li[path="'+fpath+'"]:first');
      if(tabLi.hasClass('template')){
        hintType="template";
      }
    break;
    case 'frag': mode='webglslfrag'; break;
    case 'vert': mode='webglslvert'; break;
    case 'txt': mode=''; break;
    case 'json': mode='javascript'; break;
    case 'css': mode='css'; break;
    default:
      break;
  }
  //set the codemirror config options
  var config={};
  config['value']=textarea.val();
  config['lineNumbers']=true;
  config['extraKeys']={
    'Ctrl-Space':'autocomplete'
  };
  config['styleActiveLine']=true;
  if(mode.length>0){
    config['mode']=mode;
  }
  //init the editor textarea
  var myCodeMirror = CodeMirror(function(el) {
    //textarea.removeClass('raw');
    textarea[0].parentNode.replaceChild(el, textarea[0]);
  },config);
  myCodeMirror['myHintType']=hintType;
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
    }
  };
  //codemirror editor events
  myCodeMirror.on('beforeChange', function(instance, object){
    var tabLi=jQuery('nav#tabs').children('ul:first').children('li[path="'+fpath+'"]:first');
    //if this is the template tab li
    if(tabLi.hasClass('template')){
      //reset the tab code indicator data
      myCodeMirror['didEditTabText']=false;
      myCodeMirror['tabNameAtCursorBeforeEdit']=undefined;
      if(!myCodeMirror.hasOwnProperty('tabNamesBeforeEdit')){
        //get the list of tab names embedded in the file BEFORE the edit
        myCodeMirror['tabNamesBeforeEdit']=getOrderedTabNames();
      }
      //if the line (that contains the cursor) also may have a template tab name
      var lineIndex=instance.doc.getCursor().line;
      if(editTextIsTabEmbed(instance, lineIndex)){
        //get the tab name at the cursor location, if any
        myCodeMirror['tabNameAtCursorBeforeEdit']=getTabNameAtLine(instance, lineIndex);
      }
      //if this is delete
      if(object.origin==='+delete' || object.origin==='cut'){
        //indicate if embed code for a tab got edited
        var didEdit=editTextIsTabEmbed(instance, object.from.line, object.to.line);
        myCodeMirror['didEditTabText']=didEdit;
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
      //if not delete
      if(object.origin!=='+delete' && object.origin!=='cut'){
        //indicate if embed code for a tab got edited
        var didEdit=editTextIsTabEmbed(instance, object.from.line, object.to.line);
        myCodeMirror['didEditTabText']=didEdit;
      }
      //if tab text was edited
      if(myCodeMirror['didEditTabText']){
        //get the tab name on the line where the cursor is located
        var nameBeforeEdit=myCodeMirror['tabNameAtCursorBeforeEdit'];
        var lineIndex=instance.doc.getCursor().line;
        var tabName=getTabNameAtLine(instance, lineIndex);
        //auto-align the corresponding tag with the changed tag name
        alignLinkedTabName(instance, lineIndex);
        //get the list of all tab names that appear in the html
        var tabNamesBeforeEdit=myCodeMirror['tabNamesBeforeEdit'];
        var tabNames=getOrderedTabNames();
        myCodeMirror['tabNamesBeforeEdit']=tabNames; //for the next edit
        //if no tab was removed nor added
        var autoCompleteTab=false;
        if(tabNamesBeforeEdit.length===tabNames.length){
          autoCompleteTab=true;
          if(nameBeforeEdit!=undefined){
            //if a tab name could be teased out of the current cursor line and it's different than the tabName before edit
            if(tabName!=undefined){
              //if the tabName is different from the previous tabName
              if(tabName!==nameBeforeEdit){
                autoCompleteTab=false;
                //does this tab name appear more than once?
                var appearsCount=0;
                for(var n=0;n<tabNamesBeforeEdit.length;n++){
                  if(tabNamesBeforeEdit[n]===nameBeforeEdit){
                    appearsCount++;
                  }
                }
                //if this tab name appears twice or more
                if(appearsCount>1){
                  //if this modified tabName is no longer appearing more than once
                  if(tabNamesBeforeEdit.indexOf(tabName)===-1){
                    //create a new tab for the tabName that is now unique
                    addFileTab(tabName,undefined,undefined,true);
                  }
                }else{
                  //set the new tab name
                  setTabPath(nameBeforeEdit, tabName);
                }
              }
            }
          }
        //if a tab was removed
        }else if(tabNamesBeforeEdit.length>tabNames.length){
          //get all of the tab names that have been removed
          var removedTabNames=[]; var numRemoved=tabNamesBeforeEdit.length-tabNames.length;
          for(var t=0;t<tabNamesBeforeEdit.length;t++){
            var tname=tabNamesBeforeEdit[t];
            if(tabNames.indexOf(tname)===-1){
              removedTabNames.push(tname);
              removeTab(tname);
              if(removedTabNames.length===numRemoved){
                break;
              }
            }
          }
        //if a tab was added
        }else if(tabNamesBeforeEdit.length<tabNames.length){
          //get all of the tab names that have been added
          var addedTabNames=[]; var numAdded=tabNames.length-tabNamesBeforeEdit.length;
          for(var t=0;t<tabNames.length;t++){
            var tname=tabNames[t];
            if(tabNamesBeforeEdit.indexOf(tname)===-1){
              addedTabNames.push(tname);
              addFileTab(tname,undefined,undefined,true);
              if(addedTabNames.length===numAdded){
                break;
              }
            }
          }
        }
        //no tabs removed, added or modified
        if(autoCompleteTab){
          //if the line is the start of a tab name placeholder
          var suggestHint=false;
          var curLine=instance.doc.getLine(lineIndex);
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
      if(!myCodeMirror.hasOwnProperty('tabNamesBeforeEdit')){
        //get the list of tab names embedded in the file BEFORE the edit
        myCodeMirror['tabNamesBeforeEdit']=getOrderedTabNames();
      }
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
    callback(myCodeMirror, mode);
  }
}
//remove a tab
function removeTab(tabName){
  var tabLi=jQuery('body:first').children('nav#tabs:first').children('ul:first').children('li[path$="/'+tabName+'"]:first');
  if(tabLi.length<1){
    tabLi=jQuery('body:first').children('nav#tabs:first').children('ul:first').children('li[path="'+tabName+'"]:first');
  }
  if(tabLi.length>0){
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
function setTabPath(oldname, newname){
  //update the tab name
  var tabLi=jQuery('body:first').children('nav#tabs:first').children('ul:first').children('li[path$="/'+oldname+'"]:first');
  if(tabLi.length<1){
    tabLi=jQuery('body:first').children('nav#tabs:first').children('ul:first').children('li[path="'+oldname+'"]:first');
  }
  if(tabLi.length>0){
    //get the new path
    var oldpath=tabLi.attr('path');
    var div=getEditorDiv(oldpath);
    var newpath=oldpath;
    if(newpath.indexOf('/')!==-1){
      newpath=newpath.substring(0,newpath.lastIndexOf('/')+'/'.length);
    }
    newpath+=newname;
    //modify the tab html
    tabLi.removeClass('removed-tab');
    tabLi.addClass('modified-path');
    tabLi.removeClass('pending-save');
    if(tabLi.attr('old_path')==undefined){
      tabLi.attr('old_path',oldpath);
    }else{
      //if reverting back to the original path after changing it
      if(newpath===tabLi.attr('old_path')){
        //remove the indicator that the path changed
        tabLi.attr('old_path','');
        tabLi.removeAttr('old_path');
        tabLi.removeClass('modified-path');
      }
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
          //*** create the add tab method
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
    }
  }else{
    //this tab already exists
    tabLi.removeClass('removed-tab');
  }
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
