function initTabSearchData(path, findTxt){
  var ret=getCachedSearchData(path, findTxt);
  if(ret==undefined){
	  var li, cm, tabContent;
	  if(path!=undefined){
	    li=getTabLi(path);
	    cm=getCodeMirrorObj(path);
	    cm['foundMatchPositionInfo']={pos:[],nth:0,searched:findTxt};
	    tabContent=getFileContent(path);
	    ret={ path: path, li: li, cm:cm, content:tabContent };
	    //make sure the data is cached on the document object
	    if(!document.hasOwnProperty('foundMatchPositionInfo')){ document['foundMatchPositionInfo']={}; }
	    if(!document['foundMatchPositionInfo'].hasOwnProperty(path)){ document['foundMatchPositionInfo'][path]={}; }
	    document['foundMatchPositionInfo'][path][findTxt]=ret;
	  }
  } return ret;
}
function getCachedSearchData(path, findTxt){
	var cached;
	if(path==='.'){ path=getElemPath(path); }
	if(document.hasOwnProperty('foundMatchPositionInfo')){
		if(document['foundMatchPositionInfo'].hasOwnProperty(path)){
			if(findTxt==undefined){
				cached=document['foundMatchPositionInfo'][path];
			}else{
				if(document['foundMatchPositionInfo'][path].hasOwnProperty(findTxt)){
					cached=document['foundMatchPositionInfo'][path][findTxt];
				}
			}
		}
	} return cached;
}
//deselect search without deleting the cache
function deselectSearched(path, findTxt){
	if(findTxt==undefined){
		var searchInput=jQuery('#file-content .findtext-wrap .search-line .field-wrap input.search-field:first');
		findTxt=searchInput[0]['previousSubmittedTxt'];
	}
	var cached=getCachedSearchData(path, findTxt);
	if(cached!=undefined){
		if(cached.hasOwnProperty('cm')){
			if(cached['cm'].hasOwnProperty('foundMatchPositionInfo')){
				var positions=cached['cm']['foundMatchPositionInfo']['pos'];
				for(var p=0;p<positions.length;p++){
					var pos=positions[p];
					//clear the highlight marker
					pos['marker'].clear();
					//clear the scrollbar marker
					pos['scrollmark'].remove();
					//indicate deselected
					pos['selected']=false;
				}
			}
		}
	}
}
//prevent once: deselect/clear of the cached search
function preventSearchDataClear(path, findTxt){
	var cached=getCachedSearchData(path, findTxt);
	if(cached!=undefined){
		cached['prevent_clear']=true;
	}
}
//deselect search AND delete the cached data
function clearCachedSearchData(path, findTxt){
	var didClear=false;
  if(path==='.'){ path=getElemPath(path); }
	var cached=getCachedSearchData(path, findTxt);
	if(cached!=undefined){
		var preventClear=false;
		if(cached.hasOwnProperty('prevent_clear')){ preventClear=cached['prevent_clear']; }
		//if allow clear
		if(!preventClear){
			//deselection
			deselectSearched(path, findTxt);
			//delete the data
			if(findTxt==undefined){
        delete document['foundMatchPositionInfo'][path];
      }else{
        delete document['foundMatchPositionInfo'][path][findTxt];
      }
			didClear=true;
		}else{
			//prevent the prevent_clear again
			cached['prevent_clear']=false;
		}
	} return didClear;
}
function updateSearchTextCount(nth, total){
	var fieldWrap=jQuery('#file-content .findtext-wrap .search-line .field-wrap:first');
	if(fieldWrap.length>0){
		var searchInput=fieldWrap.children('input.search-field:first');
		var countWrap=fieldWrap.children('.count:last');
		var totalFoundWrap=countWrap.children('.found:first');
		var totalFoundSpan=totalFoundWrap.children('span:last');
		var cycleWrap=countWrap.children('.cycle-through:last');
		var nthEl=cycleWrap.children('.nth:first');
		var totalEl=cycleWrap.children('.total:last');
		//get the cached nth and total if they were not passed as args
		if(nth==undefined || total==undefined){
			var currentTabPath=getElemPath('.');
			var cachedData=getCachedSearchData(currentTabPath, searchInput.val());
			if(cachedData!=undefined){
				//set cached values
				nth=cachedData['cm']['foundMatchPositionInfo']['nth'];
				total=cachedData['cm']['foundMatchPositionInfo']['pos'].length;
			}
		}
		//if there is any cycle through data
		if(nth!=undefined){
			//set UI values
			nthEl.html(nth+''); totalEl.html(total+'');
			var totalTxt=total; if(totalTxt===0){ totalTxt='nada'; }
			totalFoundSpan.html(totalTxt+'');
			//if at the first nth
			if(nth===0){
				totalFoundWrap.addClass('active'); cycleWrap.removeClass('active');
			}else{
				//not at the first nth
				totalFoundWrap.removeClass('active'); cycleWrap.addClass('active');
			}
		}else{
			//no current cycle through data... hide the count
			totalFoundWrap.removeClass('active'); cycleWrap.removeClass('active');
		}
	}
}
//find and highlight searchtext
function searchTextInTab(findTxt, args, replaceTxt){
  var activeTab;
  if(findTxt.length>0){
  	var cycleNextNthPos=function(theNth, cur, startIndex, lineIndex){
		//is this position is BEFORE the current cursor location
        if(cur.line>=lineIndex){
        		if(cur.line===lineIndex){
        			//if before the cursor on the same line
        			if(cur.ch>=startIndex){
        				//cycle position forward
    					theNth++; }
        		}else{
        			//cycle position forward
    				theNth++; }
        } return theNth;
  	};
  	var currentTabPath=getElemPath('.'); var thisNth=0;
  	activeTab=getCachedSearchData(currentTabPath, findTxt);
  	if(activeTab==undefined){
    		if(args==undefined){ args={all_tabs:false, search_mode:'default'}; }
    		if(!args.hasOwnProperty('all_tabs')){ args['all_tabs']=false; }
    		if(!args.hasOwnProperty('search_mode')){ args['search_mode']='default'; }
    		//active tab elements, objects, and strings
	    activeTab=initTabSearchData(currentTabPath, findTxt);
	    if(activeTab['content']!=undefined){
	      if(activeTab['cm']!=undefined){
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
	            var reg=new RegExp(searchFor);
              var matches=inWhat.match(reg);
              if(matches!=undefined){ if(matches.length>0){ searchWhat=matches[0];
	            if(fl==undefined){ fl='first'; } switch(fl){
	              case 'first': nextIndex=matches['index']; break;
	              case 'last': nextIndex=lastRegexIndexOf(searchWhat, inWhat, reg, matches['index']); break;
	            } } }
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
	          var currentLineIndex=0, currentCharIndex=0, currentNth=1;
	          var cursorPos=activeTab['cm']['object'].getCursor();
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
	            var scrollMatchData=setMatchOnScrollbar(activeTab['cm'], currentLineIndex);
	            var scrollMatch=scrollMatchData['scrollMatch'];
	            //add this item as data related to the selected position
	            activeTab['cm']['foundMatchPositionInfo']['pos'].push({
	              line:currentLineIndex, start:start, end:end,
	              marker:marker, scrollmark:scrollMatch, selected:true
	            });
	            //update the nth position number if this line/ch is still before the current cursor line/ch
	            currentNth=cycleNextNthPos(currentNth, cursorPos, start, currentLineIndex);
	            //remove the text up to this point
	            tabContent=tabContent.substring(got['index']+got['txt'].length);
	            //count those removed characters
	            currentCharIndex+=got['txt'].length;
	            //get the next index position, if exists
	            got=strpos(findTxt, tabContent);
	          }
	          //set the current nth position in the cycle
	          activeTab['cm']['foundMatchPositionInfo']['nth']=currentNth;
	        }
	      }
	    }
    }else{
    		//search data is already cached... cycle to the next position depending on cursor position

    		var thisNth=activeTab['cm']['foundMatchPositionInfo']['nth'];
    		var positions=activeTab['cm']['foundMatchPositionInfo']['pos'];
    		if(positions.length>0){
	    		var nth=1; var prevNth=nth;
	    		var cursorPos=activeTab['cm']['object'].getCursor(); var continueNextNth=true;
			for(var p=0;p<positions.length;p++){
				var pos=positions[p];
				//if still not cycled past the cursor position
				if(continueNextNth){
		            //update the nth position number if this line/ch is still before the current cursor line/ch
		            nth=cycleNextNthPos(nth, cursorPos, pos['start'], pos['line']);
		            if(nth===prevNth){ continueNextNth=false; }
		            else{ prevNth=nth; }
		        }
		        //make sure this position is marked and has the scrollbar mark
		        if(!pos['selected']){
		        		pos['selected']=true;
		        		//re-mark the scrollbar
		        		var scrollMatchData=setMatchOnScrollbar(activeTab['cm'], pos['line']);
		        		pos['scrollmark']=scrollMatchData['scrollMatch'];
		            //re-highlight this position
		            pos['marker']=activeTab['cm']['object'].markText(
		              CodeMirror.Pos(pos['line'], pos['start']),
		              CodeMirror.Pos(pos['line'], pos['end']),
		              { className:'cm-searching', clearWhenEmpty:true }
		            );
		        }else{
		        		//if no next nth number to increment AND the correct text is selected
		        		if(!continueNextNth){
		        			break; //no need to continue looping through the positions
		        		}
		        }
			}
			//this line causes the first found string to be highlighted twice
			if(thisNth===0 && nth===2){ nth--; }
			//set the new nth position
			if(nth>positions.length){ nth=0; }
			activeTab['cm']['foundMatchPositionInfo']['nth']=nth;
		}else{
			//no found matches
			activeTab['cm']['foundMatchPositionInfo']['nth']=0;
		}
    }
    //get the positions list
    var positions=activeTab['cm']['foundMatchPositionInfo']['pos'];
    var nth=activeTab['cm']['foundMatchPositionInfo']['nth'];
    //if replacing one of the text positions
    if(replaceTxt!=undefined){
    		if(replaceTxt!==findTxt){
			//if the current selected text is what's being searched (wait until it's selected before doing the replace)
			if(findTxt===activeTab['cm']['object'].getSelection()){
				//subtract one nth counted item number
				nth--; if(nth<0){ nth=0; }
				activeTab['cm']['foundMatchPositionInfo']['nth']=nth;
				//get the position to replace
				var nthIndex=thisNth-1; if(nthIndex<0){ nthIndex=0; }
				var replacePos=positions[nthIndex];
				//clear the highlight marker
				replacePos['marker'].clear();
				//clear the scrollbar marker
				replacePos['scrollmark'].remove();
				//prevent the cached search data clear from being triggered by the change event
				preventSearchDataClear(currentTabPath);
				//perform the replace of the position
				activeTab['cm']['object'].replaceRange(replaceTxt,
					CodeMirror.Pos(replacePos['line'], replacePos['start']),
					CodeMirror.Pos(replacePos['line'], replacePos['end'])
				);
				var replaceLine=replacePos['line'];
				//remove this position from the list
				positions.splice(nthIndex, 1);
				//if there are any positions AFTER the replaced position
				if(nth<=positions.length){
					var charDiff=replaceTxt.length-findTxt.length;
					if(charDiff!==0){
						//loop through and adjust the character position of highlighted text on the same line
						for(var a=nthIndex;a<positions.length;a++){
							//if this is on the same line of the replace
							if(positions[a]['line']===replaceLine){
								positions[a]['start']+=charDiff; positions[a]['end']+=charDiff;
							}else{ break; }
						}
					}
				}
			}
		}
    }
    //select one of the positions in the search list
    if(positions.length>0){
    		var nthIndex=nth;
        //make sure the nthIndex is within the range of indexes
    		if(nthIndex!==0){ nthIndex--; }
        if(nthIndex>=positions.length){ nthIndex=positions.length-1; }
        //get the position for this index
    		var pos=positions[nthIndex];
	    		//select the position
	    		activeTab['cm']['object'].setSelection(
	    			CodeMirror.Pos(pos['line'], pos['start']),
	    			CodeMirror.Pos(pos['line'], pos['end'])
	    		);
	    		//update the Nth / Total count in the UI
	    		updateSearchTextCount(nthIndex+1, positions.length);
    }else{
    		//nothing found in the search
    		updateSearchTextCount(0, 0);
    		//clear the cached structure
    		clearCachedSearchData(currentTabPath, findTxt);
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
  var scrollMatch, alreadyExists=false;
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
  }else{ alreadyExists=true; }
  return {scrollMatch:scrollMatch, alreadyExists:alreadyExists};
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
                    deselectSearched('.', jQuery(this)[0]['previousSubmittedTxt']);
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
                //clear the search cache so that new search rules can replace the old
                clearCachedSearchData('.', searchInput[0]['previousSubmittedTxt']);
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
              var searchData=searchTextInTab(searchTextVal, args, replaceTextVal);
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
