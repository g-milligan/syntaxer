function findTextInTab(findTxt, args){
  var ret;
  if(findTxt.length>0){
    if(args==undefined){ args={all_tabs:false, search_mode:'default'}; }
    if(!args.hasOwnProperty('all_tabs')){ args['all_tabs']=false; }
    if(!args.hasOwnProperty('search_mode')){ args['search_mode']='default'; }
    //function to find all text matches in one tab
    var setTabTextMatches=function(tab){
      var tabPath=tab.attr('path');
      //if this tab has content
      var tabContent=getFileContent(tabPath);
      if(tabContent!=undefined){
        //depending on the search_mode
        if(tabContent.length>0){
          //loop find next lineIndex of text
          var lineIndex=0, positions=[];
          var findNextLinePositions=function(){
            var nextIndex=tabContent.indexOf(findTxt);
            if(nextIndex>-1){
              var position={line:-1,start:-1,end:-1};
              //get the lineIndex where this search text is found
              var ls=tabContent.substring(0, nextIndex+findTxt.length);
              ls=ls.trimRight();
              var lastLine=ls; if(lastLine.indexOf('\n')!==-1){ lastLine=lastLine.substring(lastLine.lastIndexOf('\n')+1); }
              lastLine=lastLine.substring(0, lastLine.indexOf(findTxt)); //characters in the last line, before the findTxt
              ls=ls.split('\n'); lineIndex+=(ls.length-1);
              position['line']=lineIndex; //set the line index
              tabContent=tabContent.substring(nextIndex+findTxt.length); //remove the parsed string up to this line, and including findTxt
              //get the character index where this search text is found
              position['start']=lastLine.length;
              position['end']=position['start']+findTxt.length;
              positions.push(position);
              //get the remaining instances of findTxt, in this line, if any
              var remainingLine=tabContent; var indexOfNl=remainingLine.indexOf('\n');
              if(indexOfNl!==-1){
                remainingLine=remainingLine.substring(0, indexOfNl);
              }
              //if there more instances of findTxt in this same line
              var nextStartIndex=remainingLine.indexOf(findTxt);
              if(nextStartIndex!==-1){
                var start=position['start'];
                while(nextStartIndex!==-1){
                  //get the next position in the same line
                  start+=nextStartIndex+findTxt.length;
                  var pos={line:position['line'], start:start, end:start+findTxt.length};
                  positions.push(pos);
                  //consume the found text in the line
                  remainingLine=remainingLine.substring(nextStartIndex+findTxt.length);
                  //get the next index, if there is another instance within this same line
                  nextStartIndex=remainingLine.indexOf(findTxt);
                }
              }
              //remove remainingLine from tabContent
              if(indexOfNl!==-1){
                tabContent=tabContent.substring(indexOfNl+1);
                lineIndex++; //next line counting
              }else{
                //no more lines
                tabContent='';
              }
            }
            return nextIndex;
          };
          //depending on the search_mode
          switch(args['search_mode']){
            case 'regex':
              //***
              break;
            case 'word':
              //***
              break;
            case 'case':
              //find all positions of the search text, within this tab
              var ni=-3; while(ni!==-1 && ni!=undefined){
                ni=findNextLinePositions();
              }
              break;
            default:
              //case insensitive
              findTxt=findTxt.toLowerCase(); tabContent=tabContent.toLowerCase();
              //find all positions of the search text, within this tab
              var ni=-3; while(ni!==-1 && ni!=undefined){
                ni=findNextLinePositions();
              }
              break;
          }
          //if this tab contained any findTxt instances
          if(positions.length>0){
            if(ret==undefined){ ret={}; }
            //put the found positions for this tabPath into the ret object
            ret[tabPath]=positions;
          }
        }
      }
    };
    //if searching all tabs
    if(args['all_tabs']){
      //for each tab
      jQuery('#tabs:first').children('ul:first').children('li[path]').each(function(){
        //set found text in this tab
        setTabTextMatches(jQuery(this));
      });
    }else{
      //only search the current active tab
      var activeTabLi=getActiveTabLi();
      if(activeTabLi.length>0){
        //set found text in the active tab
        setTabTextMatches(activeTabLi);
      }
    }
  }
  return ret;
}
//hide the findtext panel
function hideFindText(){
  jQuery('body:first').removeClass('findtext-open');
}
//init/show the findtext panel
function showFindText(){
  var didShow=false;
  //if any tab is open at all
  var activeTabLi=getActiveTabLi();
  if(activeTabLi.length>0){
    var editorDiv=getEditorDiv(activeTabLi);
    if(editorDiv.length>0){
      //if a lightbox isn't open
      var bodyElem=jQuery('body:first');
      if(!bodyElem.hasClass('lightbox-open')){
        //if a notification isn't showing
        if(!jQuery('#notifications:last').hasClass('active')){
          bodyElem.addClass('findtext-open');
          //if doesn't have findtext html yet
          var fileContentWrap=editorDiv.parent();
          var findtextWrap=fileContentWrap.children('.findtext-wrap:last');
          if(findtextWrap.length<1){
            //create the html for the search/replace text
            fileContentWrap.append('<div class="findtext-wrap"></div>'); findtextWrap=fileContentWrap.children('.findtext-wrap:last');
            findtextWrap.append('<div class="search-line l1"></div>'); findtextWrap.append('<div class="search-line l2"></div>');
            var searchLine1=findtextWrap.children('.l1:first'); var searchLine2=findtextWrap.children('.l2:last');
            searchLine1.append('<div class="field-wrap"></div><div class="btns-wrap"></div>');
            var searchFieldWrap=searchLine1.children('.field-wrap:first'); var searchBtnsWrap=searchLine1.children('.btns-wrap:last');
            searchBtnsWrap.append('<div class="main-btn"><div class="find-btn">Find</div></div><div class="sub-btns"><div name="regex" title="use regex" class="regex-toggle toggle-group">.*</div><div name="case" title="match case" class="match-case-toggle toggle-group">Aa</div><div name="word" title="whole word" class="whole-word-toggle toggle-group">[word]</div><div name="all-tabs" title="search all tabs" class="all-files-toggle"></div></div>');
            var findBtn=searchBtnsWrap.find('.main-btn .find-btn:first');
            var regexBtn=searchBtnsWrap.find('.sub-btns .regex-toggle:first');
            var matchCaseBtn=searchBtnsWrap.find('.sub-btns .match-case-toggle:first');
            var wholeWordBtn=searchBtnsWrap.find('.sub-btns .whole-word-toggle:first');
            var allFilesBtn=searchBtnsWrap.find('.sub-btns .all-files-toggle:first'); allFilesBtn.html(svgFiles);
            searchLine2.append('<div class="field-wrap"></div><div class="btns-wrap"></div>');
            var replaceFieldWrap=searchLine2.children('.field-wrap:first'); var replaceBtnsWrap=searchLine2.children('.btns-wrap:last');
            replaceBtnsWrap.append('<div class="main-btn"><div class="replace-btn">Replace</div></div><div class="sub-btns"><div class="replace-all-btn">Replace All</div></div>');
            var replaceBtn=replaceBtnsWrap.find('.main-btn .replace-btn:first');
            var replaceAllBtn=replaceBtnsWrap.find('.sub-btns .replace-all-btn:first');
            searchFieldWrap.append('<input type="text" class="search-field default" value="Find something:" /><div class="count"></div>');
            var searchInput=searchFieldWrap.children('.search-field:first');
            replaceFieldWrap.append('<input type="text" class="replace-field default" value="Replace something:" /><div class="count"></div>');
            var replaceInput=replaceFieldWrap.children('.replace-field:first');
            //attach events for the search replace text
            var setStandardInputEvents=function(inp){
              var defaultTxt=inp.attr('value'); if(defaultTxt==undefined){defaultTxt='';}
              inp[0]['defaultHelpText']=defaultTxt;
              var handleFocus=function(i){
                if(i[0]['defaultHelpText'].trim()===i.val().trim()){
                  i.val('');
                }
                i.removeClass('default'); i.addClass('focus');
              };
              var handleBlur=function(i){
                i.removeClass('focus');
                if(i.val().trim()===''){
                  i.val(i[0]['defaultHelpText']);
                  i.addClass('default');
                }
              };
              inp.focus(function(e){ handleFocus(jQuery(this)); });
              //inp.click(function(e){ e.stopPropagation(); handleFocus(jQuery(this)); });
              inp.blur(function(e){ handleBlur(jQuery(this)); });
              inp.keydown(function(e){
                switch(e.keyCode){
                  case 13: //enter key
                    e.preventDefault(); e.stopPropagation();
                    var mainBtn=jQuery(this).parents('.search-line:first').children('.btns-wrap:last').children('.main-btn:first').children('div:first');
                    mainBtn.click();
                    break;
                  case 27: //esc key
                    e.preventDefault(); e.stopPropagation();
                    if(jQuery(this).val().trim()===''){
                      hideFindText();
                    }else{
                      jQuery(this).val('');
                    }
                    break;
                }
              });
            };
            setStandardInputEvents(searchInput); setStandardInputEvents(replaceInput);
            //toggle buttons
            var setStandardToggleBtnEvents=function(btn){
              btn.click(function(){
                if(!jQuery(this).hasClass('toggle-on')){
                  if(jQuery(this).hasClass('toggle-group')){
                    jQuery(this).parent().children('.toggle-on.toggle-group').removeClass('toggle-on');
                  }
                  jQuery(this).addClass('toggle-on');
                }else{
                  jQuery(this).removeClass('toggle-on');
                }
                jQuery(this).parents('.search-line:first').find('.field-wrap input:first').focus();
              });
            };
            setStandardToggleBtnEvents(regexBtn); setStandardToggleBtnEvents(matchCaseBtn); setStandardToggleBtnEvents(wholeWordBtn);
            setStandardToggleBtnEvents(allFilesBtn);
            //find text
            var getSearchtextArgs=function(){
              //get search mode
              var search_mode='default';
              var search_modeEl=searchBtnsWrap.find('.sub-btns .toggle-on.toggle-group:first');
              if(search_modeEl.length>0){ search_mode=search_modeEl.attr('name'); }
              //get search all tabs?
              var all_tabs=false;
              if(allFilesBtn.hasClass('toggle-on')){ all_tabs=true; }
              //args
              var args={search_mode:search_mode, all_tabs:all_tabs}; return args;
            };
            findBtn.click(function(){
              if(!searchInput.hasClass('default')){
                //search based on the args
                var args=getSearchtextArgs();
                var found=findTextInTab(searchInput.val(), args);
                //***
              }
              searchInput.focus();
            });
            //replace button
            replaceBtn.click(function(){

              //***
              replaceInput.focus();
            });
            //replace all button
            replaceAllBtn.click(function(){
              //***
              replaceInput.focus();
            });
          }
          //do stuff to the searchInput when the findText panel first opens
          var searchInput=findtextWrap.find('.search-line.l1 .field-wrap input.search-field:first');
          var cm=getCodeMirrorObj(editorDiv);
          if(cm!=undefined){
            //if anything is selected
            var selection=cm.object.doc.getSelection(); if(selection==undefined){selection='';}
            if(selection.length>0){
              //load the selection into the find text field
              searchInput.val(selection);
            }
          }
          //set the cursor into the search field
          searchInput.focus();
          //indicate that the customer searchtext panel is now showing
          didShow=true;
        }
      }
    }
  }
  return didShow;
}
