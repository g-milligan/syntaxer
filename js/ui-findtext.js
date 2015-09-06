
function getTabSearchData(which){
  var path=getElemPath(which);
  var li, cm, tabContent;
  if(path!=undefined){
    li=getTabLi(path);
    cm=getCodeMirrorObj(path);
    tabContent=getFileContent(path);
  } return { path: path, li: li, cm:cm, content:tabContent };
}
//find and highlight searchtext
function findTextInTab(findTxt, args){
  var activeTab;
  if(findTxt.length>0){
    if(args==undefined){ args={all_tabs:false, search_mode:'default'}; }
    if(!args.hasOwnProperty('all_tabs')){ args['all_tabs']=false; }
    if(!args.hasOwnProperty('search_mode')){ args['search_mode']='default'; }
    //active tab elements, objects, and strings
    activeTab=getTabSearchData('.');
    if(activeTab['content']!=undefined){
      if(activeTab['cm']!=undefined){
        if(!activeTab['cm'].hasOwnProperty('foundMatchPositionInfo')){ activeTab['cm']['foundMatchPositionInfo']={pos:[],nth:0}; }
        else{ activeTab['cm']['foundMatchPositionInfo']['pos']=[]; }
        //get the last index of something that follows regex pattern
        var lastRegexIndexOf=function(needle, stack, re, li){
          if(li==undefined){ li=stack.search(re); } var searchon=true; var next=li;
          while(li!==-1 && searchon){
            stack=stack.substring(next+needle.length); next=stack.search(re);
            if(next!==-1){ li+=next+needle.length; }else{
              searchon=false; }
          } return li;
        };
        //define the strpos function based on the search_mode
        var strpos; switch(args['search_mode']) {
          //use regex
          case 'regex': strpos=function(searchFor, inWhat, fl){ var nextIndex=-1, searchWhat='';
            //searchFor=regexEscape(searchFor);
            var reg=new RegExp(searchFor);
            if(fl==undefined){ fl='first'; } switch(fl){
              case 'first': nextIndex=inWhat.search(reg); break;
              case 'last':
                var matches=inWhat.match(reg);
                if(matches!=undefined){ if(matches.length>0){
                    searchWhat=matches[0];
                    nextIndex=lastRegexIndexOf(matches[0], inWhat, reg, matches['index']);
                } }
              break;
            }
          return {txt:searchWhat, index:nextIndex}; }; break;
          //match whole word, within word boundaries, not a part of another word
          case 'word': strpos=function(searchFor, inWhat, fl){ var nextIndex=-1, searchWhat=searchFor;
            var reg=new RegExp('\\b'+searchFor+'\\b');
            if(fl==undefined){ fl='first'; } switch(fl){
              case 'first': nextIndex=inWhat.search(reg); break;
              case 'last': nextIndex=lastRegexIndexOf(searchFor, inWhat, reg); break;
            }
          return {txt:searchWhat, index:nextIndex}; }; break;
          //match casing
          case 'case': strpos=function(searchFor, inWhat, fl){ var nextIndex=-1, searchWhat=searchFor;
            if(fl==undefined){ fl='first'; } switch(fl){
              case 'first': nextIndex=inWhat.indexOf(searchFor); break;
              case 'last': nextIndex=inWhat.lastIndexOf(searchFor); break;
            }
          return {txt:searchWhat, index:nextIndex}; }; break;
          //default ignore casing
          default: strpos=function(searchFor, inWhat, fl){ var nextIndex=-1, searchWhat=searchFor;
            if(fl==undefined){ fl='first'; } switch(fl){
              case 'first': nextIndex=inWhat.toLowerCase().indexOf(searchFor.toLowerCase()); break;
              case 'last': nextIndex=inWhat.toLowerCase().lastIndexOf(searchFor.toLowerCase()); break;
            }
          return {txt:searchWhat, index:nextIndex}; }; break;
        }
        //get the tab content to begin trimming it away in order to find all of the search text positions
        var tabContent=activeTab['content'];
        //find all of the search text positions
        var got=strpos(findTxt, tabContent);
        if(got['index']!==-1){
          var currentLineIndex=0, currentCharIndex=0;
          //while there is a next position
          while(got['index']!==-1){
            //get the string before the got position
            var beforeGot=tabContent.substring(0, got['index']); var lastLineBeforeGot=beforeGot;
            //if there are any newlines before this position
            if(beforeGot.indexOf('\n')!==-1){
              //reset the char index count (for this line)
              currentCharIndex=0;
              //count the number of lines before this position
              var beforeLines=beforeGot.split('\n');
              currentLineIndex+=beforeLines.length-1;
              lastLineBeforeGot=beforeLines[beforeLines.length-1];
            }
            //count the next set of characters on this line
            currentCharIndex+=lastLineBeforeGot.length;
            //count the number of characters that appear before the got position, on the same line
            var start=currentCharIndex; var end=start+got['txt'].length;
            //highlight this found position
            var marker=activeTab['cm']['object'].markText(
              CodeMirror.Pos(currentLineIndex, start),
              CodeMirror.Pos(currentLineIndex, end),
              { className:'cm-searching', clearWhenEmpty:true }
            );
            //show a tick mark on the scrollbar for this found text position
            var scrollMatch=setMatchOnScrollbar(activeTab['cm'], currentLineIndex);
            //add this item as data related to the selected position
            activeTab['cm']['foundMatchPositionInfo']['pos'].push({
              line:currentLineIndex, start:start, end:end,
              marker:marker, scrollmark:scrollMatch
            });
            //remove the text up to this point
            tabContent=tabContent.substring(got['index']+got['txt'].length);
            //count those removed characters
            currentCharIndex+=got['txt'].length;
            //get the next index position, if exists
            got=strpos(findTxt, tabContent);
          }
        }
      }
    }
  } return activeTab;
}
//move the found text position on scrollbar
function moveMatchOnScrollbar(cm, fromLine, toLine){
  //get the scrollbar element
  var wrap=cm['object'].getWrapperElement(); wrap=jQuery(wrap);
  var matchesWrap=wrap.children('.search-matches:last');
  if(matchesWrap.length<0){
    scrollMatch=matchesWrap.children('.search-match[line="'+fromLine+'"]:first');
    if(scrollMatch.length>0){
      if(toLine==undefined){ toLine=fromLine; }
      //get the number of lines
      var numLines=cm['object']['doc'].lineCount();
      //get percent position of the match
      var linePercent=toLine/numLines*100;
      //update the match position
      scrollMatch.css('top',linePercent+'%'); scrollMatch.attr('line', toLine);
      //update width of matches
      var width=wrap.find('.CodeMirror-vscrollbar:first').outerWidth();
      if(width<10){ width=10; } matchesWrap.children('.search-match').css('width', width+'px');
    }
  }
}
//show the found text position on scrollbar
function setMatchOnScrollbar(cm, line){
  var scrollMatch;
  //get the scrollbar element
  var wrap=cm['object'].getWrapperElement(); wrap=jQuery(wrap);
  var matchesWrap=wrap.children('.search-matches:last');
  if(matchesWrap.length<1){
    wrap.append('<div class="search-matches"></div>');
    matchesWrap=wrap.children('.search-matches:last');
  }
  //if this line isn't already matched on the scrollbar
  scrollMatch=matchesWrap.children('.search-match[line="'+line+'"]:first');
  if(scrollMatch.length<1){
    //get the number of lines
    var numLines=cm['object']['doc'].lineCount();
    //get percent position of the match
    var linePercent=line/numLines*100;
    matchesWrap.append('<div style="top:'+linePercent+'%;" class="search-match" line="'+line+'"></div>');
    scrollMatch=matchesWrap.children('.search-match[line="'+line+'"]:last');
    //update width of matches
    var width=wrap.find('.CodeMirror-vscrollbar:first').outerWidth();
    if(width<10){ width=10; } matchesWrap.children('.search-match').css('width', width+'px');
  }
  return scrollMatch;
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
          //open the dialog
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
            searchBtnsWrap.append('<div class="main-btn"><div class="find-btn">Find</div></div><div class="sub-btns"><div name="regex" title="use regex" class="regex-toggle toggle-group">.*</div><div name="case" title="match case" class="match-case-toggle toggle-group">Aa</div><div name="word" title="whole word" class="whole-word-toggle toggle-group">[word]</div></div>');
            var findBtn=searchBtnsWrap.find('.main-btn .find-btn:first');
            var regexBtn=searchBtnsWrap.find('.sub-btns .regex-toggle:first');
            var matchCaseBtn=searchBtnsWrap.find('.sub-btns .match-case-toggle:first');
            var wholeWordBtn=searchBtnsWrap.find('.sub-btns .whole-word-toggle:first');
            //var allFilesBtn=searchBtnsWrap.find('.sub-btns .all-files-toggle:first'); allFilesBtn.html(svgFiles);
            searchLine2.append('<div class="field-wrap"></div><div class="btns-wrap"></div>');
            var replaceFieldWrap=searchLine2.children('.field-wrap:first'); var replaceBtnsWrap=searchLine2.children('.btns-wrap:last');
            replaceBtnsWrap.append('<div class="main-btn"><div class="replace-btn">Replace</div></div><div class="sub-btns"><div class="replace-all-btn">Replace All</div></div>');
            var replaceBtn=replaceBtnsWrap.find('.main-btn .replace-btn:first');
            var replaceAllBtn=replaceBtnsWrap.find('.sub-btns .replace-all-btn:first');
            searchFieldWrap.append('<input type="text" class="search-field default" value="Find something:" /><div class="count"></div>');
            var searchInput=searchFieldWrap.children('.search-field:first');
            var searchCount=searchFieldWrap.children('.count:last');
            searchCount.append('<div class="found">Found <span></span></div>');
            searchCount.append('<div class="cycle-through"><span class="nth"></span><span class="total"></span></div>');
            var searchFoundCount=searchCount.find('.found span:first');
            var cycleThroughEl=searchCount.children('.cycle-through:first');
            replaceFieldWrap.append('<input type="text" class="replace-field default" value="Replace something:" /><div class="count"></div>');
            var replaceInput=replaceFieldWrap.children('.replace-field:first');
            var replaceCount=replaceFieldWrap.children('.count:last');
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
                i.parent().find('.count .active').removeClass('active');
                i.parent().find('.cycle-through.active').removeClass('active');
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
              inp.keyup(function(e){
                if(jQuery(this).val()!==jQuery(this)[0]['previousSubmittedTxt']){
                  jQuery(this).parent().find('.count .active').removeClass('active');
                  jQuery(this).parent().find('.cycle-through.active').removeClass('active');
                  //if this is the find text input
                  if(jQuery(this).hasClass('search-field')){
                    //deselect previous highlights, if any
                    //***
                  }
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
            //setStandardToggleBtnEvents(allFilesBtn);
            //find text
            var getSearchtextArgs=function(){
              //get search mode
              var search_mode='default';
              var search_modeEl=searchBtnsWrap.find('.sub-btns .toggle-on.toggle-group:first');
              if(search_modeEl.length>0){ search_mode=search_modeEl.attr('name'); }
              //get search all tabs?
              var all_tabs=false;
              //if(allFilesBtn.hasClass('toggle-on')){ all_tabs=true; }
              //args
              var args={search_mode:search_mode, all_tabs:all_tabs}; return args;
            };
            //cycle through each found search value
            var cycleSearch=function(searchTextVal, replaceTextVal){
              //search based on the args
              var args=getSearchtextArgs();
              var found=findTextInTab(searchTextVal, args);
              searchInput[0]['previousSubmittedTxt']=searchTextVal;
              //***
            };
            //find action
            findBtn.click(function(){
              if(!searchInput.hasClass('default')){
                cycleSearch(searchInput.val());
              }
              searchInput.focus();
            });
            //replace button
            replaceBtn.click(function(){
              if(!searchInput.hasClass('default')){
                if(!replaceInput.hasClass('default')){
                  cycleSearch(searchInput.val(), replaceInput.val());
                }else{
                  cycleSearch(searchInput.val(), '');
                }
              }
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
          //set the cursor into the search field
          searchInput.focus();
          //get the codemirror object
          var cm=getCodeMirrorObj(editorDiv);
          if(cm!=undefined){
            //if anything is selected
            var selection=cm.object.doc.getSelection(); if(selection==undefined){selection='';}
            if(selection.length>0){
              //load the selection into the find text field
              searchInput.val(selection);
              //immediate search
              findtextWrap.find('.search-line.l1 .btns-wrap .main-btn .find-btn:first').click();
            }
          }
          //indicate that the customer searchtext panel is now showing
          didShow=true;
        }
      }
    }
  }
  return didShow;
}
