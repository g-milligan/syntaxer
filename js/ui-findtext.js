
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
  if(findTxt.length>0){
    if(args==undefined){ args={all_tabs:false, search_mode:'default'}; }
    if(!args.hasOwnProperty('all_tabs')){ args['all_tabs']=false; }
    if(!args.hasOwnProperty('search_mode')){ args['search_mode']='default'; }
    //active tab elements, objects, and strings
    var activeTab=getTabSearchData('.');
    if(activeTab['content']!=undefined){
      if(activeTab['cm']!=undefined){
        //get the last index of something that follows regex pattern
        var lastRegexIndexOf=function(needle, stack, re){
          var li=stack.search(re); var searchon=true;
          while(li!==-1 && searchon){
            stack=stack.substring(li+needle.length);
            var next=stack.search(re);
            if(next!==-1){ li+=next+needle.length; }
            else{ searchon=false; }
          } return li;
        };
        //define the strpos function based on the search_mode
        var strpos; switch(args['search_mode']) {
          //use regex
          case 'regex': strpos=function(searchFor, inWhat, fl){ var nextIndex=-1;
            if(fl==undefined){ fl='first'; } switch(fl){
              case 'first':  break;
              case 'last':  break;
            }
          return nextIndex; }; break;
          //match whole word, within word boundaries, not a part of another word
          case 'word': strpos=function(searchFor, inWhat, fl){ var nextIndex=-1;
            var reg=new RegExp('\\b'+searchFor+'\\b');
            if(fl==undefined){ fl='first'; } switch(fl){
              case 'first':
                nextIndex=inWhat.search(reg);
              break;
              case 'last':
                nextIndex=lastRegexIndexOf(searchFor, inWhat, reg);
              break;
            }
          return nextIndex; }; break;
          //match casing
          case 'case': strpos=function(searchFor, inWhat, fl){ var nextIndex=-1;
            if(fl==undefined){ fl='first'; } switch(fl){
              case 'first': nextIndex=inWhat.indexOf(searchFor); break;
              case 'last': nextIndex=inWhat.lastIndexOf(searchFor); break;
            }
          return nextIndex; }; break;
          //default ignore casing
          default: strpos=function(searchFor, inWhat, fl){ var nextIndex=-1;
            if(fl==undefined){ fl='first'; } switch(fl){
              case 'first': nextIndex=inWhat.toLowerCase().indexOf(searchFor.toLowerCase()); break;
              case 'last': nextIndex=inWhat.toLowerCase().lastIndexOf(searchFor.toLowerCase()); break;
            }
          return nextIndex; }; break;
        }
        //select all of the found text
        var tabContent=activeTab['content'];
        //***
        var firstIndex=strpos("foo", "I went foo to the foobar and ordered foo. foobar");
        var lastIndex=strpos("foo", "I went foo to the foobar and ordered foo. foobar", 'last');
        var test='';
        //***
      }
    }
    //if searching all tabs
    if(args['all_tabs']){

    }
  }
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
