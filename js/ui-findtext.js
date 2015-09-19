function initTabSearchData(path, findTxt){
  var ret;
  if(path!=undefined){
    ret=getCachedSearchData(path);
    //if not already cached (must init)
    if(ret==undefined || !ret.hasOwnProperty('searches') || !ret['searches'].hasOwnProperty(findTxt)){
      //make sure the data is cached on the document object
      if(!document.hasOwnProperty('syntaxerSearchCache')){ document['syntaxerSearchCache']={}; }
      if(!document['syntaxerSearchCache'].hasOwnProperty(path)){
        var li, cm, tabContent;
        li=getTabLi(path);
        cm=getCodeMirrorObj(path);
        tabContent=getFileContent(path);
        document['syntaxerSearchCache'][path]={li: li, cm:cm, content:tabContent, previous_search:'', current_search:findTxt};
      }
      if(!document['syntaxerSearchCache'][path].hasOwnProperty('searches')){ document['syntaxerSearchCache'][path]['searches']={}; }
      document['syntaxerSearchCache'][path]['searches'][findTxt]={ pos:[], nth:0 };
      ret=document['syntaxerSearchCache'][path];
    }
    //indicate if the search term changed from last time
    setNewCurrentSearch(path, findTxt);
  }
  return ret;
}
function setNewCurrentSearch(path, findTxt){
  //if the search has changed from the previous searched text
  if(document['syntaxerSearchCache'][path]['current_search']!==findTxt){
    //make sure the previous selection is deselected
    deselectSearched(path, document['syntaxerSearchCache'][path], findTxt);
    //set the current search
    document['syntaxerSearchCache'][path]['current_search']=findTxt;
  }
}
function setNewPreviousSearch(path){
  //if the search has changed from the previous searched text
  if(document['syntaxerSearchCache'][path]['previous_search']!==document['syntaxerSearchCache'][path]['current_search']){
    //set the previous search
    document['syntaxerSearchCache'][path]['previous_search']=document['syntaxerSearchCache'][path]['current_search'];
  }
}
function getCachedSearchData(path){
	var cached;
	if(path==='.'){ path=getElemPath(path); }
	if(document.hasOwnProperty('syntaxerSearchCache')){
		if(document['syntaxerSearchCache'].hasOwnProperty(path)){
      cached=document['syntaxerSearchCache'][path];
		}
	} return cached;
}
//deselect search without deleting the cache
function deselectSearched(path, cached, searchTxt){
	if(cached==undefined){ cached=getCachedSearchData(path); }
	if(cached!=undefined){
    if(searchTxt==undefined){ searchTxt=cached['current_search']; }
    if(searchTxt===''){
      //if any text is search highlighted (shouldn't be, but make sure)
      var marks=cached['cm']['object'].getAllMarks();
      if(marks.length>0){
        for(var m=0;m<marks.length;m++){
          var mark=marks[m];
          //if this is a current_search highlight
          if(mark['className']==='cm-searching'){
            var range=mark.find();
            //aha! there is text that is highlighted as a found search match!
            searchTxt=cached['cm']['object'].getRange(range.from, range.to);
            break;
          }
        }
      }
    }
    //if there is a highlighted search range
    if(cached['searches'].hasOwnProperty(searchTxt)){
  	  var positions=cached['searches'][searchTxt]['pos'];
    	for(var p=0;p<positions.length;p++){
    		var pos=positions[p];
    		//clear the highlight marker
    		pos['marker'].clear();
    		//clear the scrollbar marker
    		pos['scrollmark'].remove();
    		//indicate deselected
    		pos['selected']=false;
    	}
      cached['current_search']='';
    }
	}
}
//prevent once: deselect/clear of the cached search
function preventSearchDataClear(path, findTxt){
	var cached=getCachedSearchData(path);
	if(cached!=undefined){
    if(findTxt==undefined){
      cached['prevent_clear']=true;
    }else{
      if(cached['searches'].hasOwnProperty(findTxt)){
        cached['searches'][findTxt]['prevent_clear']=true;
      }
    }
	}
}
//deselect search AND delete the cached data
function clearCachedSearchData(path, findTxt){
	var didClear=false;
  if(path==='.'){ path=getElemPath(path); }
	var cached=getCachedSearchData(path);
	if(cached!=undefined){
		//deselection
		deselectSearched(path);
    //check if the clear is prevented for one time
    var ifPreventClear=function(obj){
      var prevent=false;
      if(obj.hasOwnProperty('prevent_clear')){
        prevent=obj['prevent_clear'];
        obj['prevent_clear']=false; //only prevent once
      } return prevent;
    };
		//delete the data
		if(findTxt==undefined){
      //if not preventing clearing the cache
      if(!ifPreventClear(cached)){
        //clear the entire data set for the path
        delete document['syntaxerSearchCache'][path];
        didClear=true;
      }
    }else{
      //if this search term is cached
      if(cached['searches'].hasOwnProperty(findTxt)){
        //if not preventing clearing the cache
        if(!ifPreventClear(cached['searches'][findTxt])){
          //clear the dataset, for a specific search term
          delete document['syntaxerSearchCache'][path]['searches'][findTxt];
          didClear=true;
        }
      }
    }
    //if clear prevented (probably because of a replace operation)
    if(!didClear){
      //updated the changed cached content
      cached['content']=cached['cm']['object'].getValue();
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
			var cached=getCachedSearchData(currentTabPath);
			if(cached!=undefined){
        var searchTxt=cached['current_search'];
        if(cached['searches'].hasOwnProperty(searchTxt)){
  				//set cached values
  				nth=cached['searches'][searchTxt]['nth'];
  				total=cached['searches'][searchTxt]['pos'].length;
        }
			}
		}
		//if there is any cycle through data
		if(nth!=undefined){
			//set UI values
			nthEl.html(nth+''); totalEl.html(total+'');
			var totalTxt=total; if(totalTxt===0){ totalTxt='nada'; }
			totalFoundSpan.html(totalTxt+'');
			//if at the first nth
			if(nth<2){
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
//replace a position, if needed, cycle through each position relative to the cursor, select one of the positions
function getRelPositionsNearCursor(cached, currentTabPath, findTxt, replaceTxt){
  var relIndexes;
  var positions=cached['searches'][findTxt]['pos'];
  if(positions.length>0){
    relIndexes={};
    var cursor=cached['cm']['object'].getCursor();
    var selectedTxt=cached['cm']['object'].getSelection();
    var replaceRange;
    //if replacing text
    if(replaceTxt!=undefined){
      //if not trying to replace something with the same thing
      if(replaceTxt!==findTxt){
        //if the current selected text is what's being searched (wait until it's selected before doing the replace)
        if(findTxt===selectedTxt){
          var start=cached['cm']['object'].getCursor(true);
          var end=cached['cm']['object'].getCursor(false);
          replaceRange={from:start,to:end};
        }
      }
    }
    //for each position
    var index=0, replaceIndex;
    for(var p=0;p<positions.length;p++){
      var pos=positions[p];
      //if this position is selected (as a highlighted match)
      if(!pos['selected']){
        pos['selected']=true;
        //re-mark the scrollbar
        var scrollMatchData=setMatchOnScrollbar(cached['cm'], pos['line']);
        pos['scrollmark']=scrollMatchData['scrollMatch'];
        //re-highlight this position
        pos['marker']=cached['cm']['object'].markText(
          CodeMirror.Pos(pos['line'], pos['start']),
          CodeMirror.Pos(pos['line'], pos['end']),
          { className:'cm-searching', clearWhenEmpty:true }
        );
      }
      //make sure the start, end, and lines are listed correctly (should be, but make sure)
      var range=pos['marker'].find();
      pos['line']=range['from']['line'];
      pos['start']=range['from']['ch'];
      pos['end']=range['to']['ch'];
      //set this nth index for this position
      pos['nth']=index+1;
      //is this position being replaced?
      var isReplace=false;
      if(replaceRange!=undefined){
        //if replace position not already found
        if(replaceIndex==undefined){
          if(replaceRange['from']['line']===pos['line']){
            if(replaceRange['from']['ch']===pos['start']){
              if(replaceRange['to']['line']===pos['line']){
                if(replaceRange['to']['ch']===pos['end']){
                  //set the replace index
                  replaceIndex=p; isReplace=true;
                  //clear the highlight marker
                  pos['marker'].clear();
                  //clear the scrollbar marker
                  pos['scrollmark'].remove();
                  //prevent the cached search data clear from being triggered by the change event
                  preventSearchDataClear(currentTabPath);
                  //perform the replace of the position
                  cached['cm']['object'].replaceRange(replaceTxt,
                    CodeMirror.Pos(replaceRange['from']['line'], replaceRange['from']['ch']),
                    CodeMirror.Pos(replaceRange['to']['line'], replaceRange['to']['ch'])
                  );
                }
              }
            }
          }
        }
      }
      //if this position is not being replaced
      if(!isReplace){
        //is this position before, at, or after the cursor?
        var setBeforeCursor=function(){
          if(!relIndexes.hasOwnProperty('beforeCursor')){ relIndexes['beforeCursor']=[]; }
          relIndexes['beforeCursor'].push(pos);
        };
        var setAtCursor=function(){
          relIndexes['atCursor']=pos;
        };
        var setAfterCursor=function(){
          if(!relIndexes.hasOwnProperty('afterCursor')){ relIndexes['afterCursor']=[]; }
          relIndexes['afterCursor'].push(pos);
        };
        //put this position into one of three categories relative to cursor
        if(pos['line']<cursor['line']){ //before cursor
          setBeforeCursor();
        }else if(cursor['line']<pos['line']){ //after cursor
          setAfterCursor();
        }else{ //could be at cursor
          if(pos['end']<cursor['ch']){ //before cursor on the same line
            setBeforeCursor();
          }else if(cursor['ch']<pos['start']){ //after cursor on the same line
            setAfterCursor();
          }else{ //cursor is at this position
            setAtCursor();
          }
        }
        //next position index
        index++;
      }
    }
    //function to get the previous position
    relIndexes['getPrev']=function(){
      var prev;
      if(relIndexes.hasOwnProperty('beforeCursor') && relIndexes['beforeCursor'].length>0){
        prev=relIndexes['beforeCursor'][relIndexes['beforeCursor'].length-1];
      }else if(relIndexes.hasOwnProperty('afterCursor') && relIndexes['afterCursor'].length>0){
        prev=relIndexes['afterCursor'][relIndexes['afterCursor'].length-1];
      }else if(relIndexes.hasOwnProperty('atCursor')){
        prev=relIndexes['atCursor'];
      }
      return prev;
    };
    //function to get the next position
    relIndexes['getNext']=function(){
      var next;
      if(window.event.shiftKey){
        next=relIndexes.getPrev();
      }else{
        if(relIndexes.hasOwnProperty('afterCursor') && relIndexes['afterCursor'].length>0){
          next=relIndexes['afterCursor'][0];
        }else if(relIndexes.hasOwnProperty('beforeCursor') && relIndexes['beforeCursor'].length>0){
          next=relIndexes['beforeCursor'][0];
        }else if(relIndexes.hasOwnProperty('atCursor')){
          next=relIndexes['atCursor'];
        }
      }
      return next;
    };
    //function to get the next position
    relIndexes['getAtCursor']=function(){
      var ret;
      if(relIndexes.hasOwnProperty('atCursor')){
        ret=relIndexes['atCursor'];
      }else{
        ret=relIndexes.getNext();
      }
      return ret;
    };
    //set the default next position to select
    relIndexes['selectPosition']=relIndexes.getNext();
    //if a position was replaced
    if(replaceIndex!=undefined){
      //remove this position from the list
      positions.splice(replaceIndex, 1);
      //if there are no more positions left
      if(positions.length<1){
        relIndexes=undefined;
      }
    }else{ //no position was replaced...
      //if no text is selected
      if(selectedTxt==undefined || selectedTxt.length<1){
        relIndexes['selectPosition']=relIndexes.getAtCursor();
      }else{ //there is selected text...
        //if switched to a new search term, different from last search
        if(cached['previous_search']!==cached['current_search']){
          //if the search text is selected
          if(findTxt===selectedTxt){
            //instead of moving next or prev, stay on this selected position since it was just selected (switched from previous search)
            relIndexes['selectPosition']=relIndexes.getAtCursor();
          }
        }
      }
    }
  }
  return relIndexes;
}
//find and highlight searchtext
function searchTextInTab(findTxt, args, replaceTxt){
  var cached;
  if(findTxt.length>0){
  	var cycleNextNthPos=function(theNth, cur, startIndex, lineIndex){
      //is this position is BEFORE the current cursor location
      if(cur.line>=lineIndex){
        //if on the same line as the cursor
        if(cur.line===lineIndex){
          //if before the cursor on the same line
          if(cur.ch>=startIndex){
            //cycle position forward
            theNth++;
          }
        }else{
          //before the cursor line... cycle position forward
          theNth++;
        }
      } return theNth;
    };
    //get the cached data OR init a new cache
  	var currentTabPath=getElemPath('.'); var thisNth=0;
  	cached=getCachedSearchData(currentTabPath);
    //if this search term is NOT already cached for this path
  	if(cached==undefined || !cached['searches'].hasOwnProperty(findTxt)){
      if(args==undefined){ args={all_tabs:false, search_mode:'default'}; }
      if(!args.hasOwnProperty('all_tabs')){ args['all_tabs']=false; }
      if(!args.hasOwnProperty('search_mode')){ args['search_mode']='default'; }
      //active tab elements, objects, and strings
	    cached=initTabSearchData(currentTabPath, findTxt);
	    if(cached['content']!=undefined){
	      if(cached['cm']!=undefined){
	        //get the last index of something that follows regex pattern
	        var lastRegexIndexOf=function(needle, stack, re, li){
	          if(li==undefined){ li=stack.search(re); } var searchon=true; var next=li;
	          while(li!==-1 && searchon){
	            stack=stack.substring(next+needle.length); next=stack.search(re);
	            if(next!==-1){ li+=next+needle.length; }
              else{ searchon=false; }
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
	        var tabContent=cached['content'];
	        //find all of the search text positions
	        var got=strpos(findTxt, tabContent);
	        if(got['index']!==-1){
	          var currentLineIndex=0, currentCharIndex=0, currentNth=1;
	          var cursorPos=cached['cm']['object'].getCursor();
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
	            var marker=cached['cm']['object'].markText(
	              CodeMirror.Pos(currentLineIndex, start),
	              CodeMirror.Pos(currentLineIndex, end),
	              { className:'cm-searching', clearWhenEmpty:true }
	            );
	            //show a tick mark on the scrollbar for this found text position
	            var scrollMatchData=setMatchOnScrollbar(cached['cm'], currentLineIndex);
	            var scrollMatch=scrollMatchData['scrollMatch'];
	            //add this item as data related to the selected position
	            cached['searches'][findTxt]['pos'].push({
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
	          cached['searches'][findTxt]['nth']=currentNth;
	        }
	      }
	    }
    }else{
      //search data is already cached... cycle to the next position depending on cursor position

      //update the current/previous path for the cached search that already exists
      setNewCurrentSearch(currentTabPath, findTxt);
    }
    //get the searched positions relative to the cursor's position and figure out what should b e selected next
    var relPositions=getRelPositionsNearCursor(cached, currentTabPath, findTxt, replaceTxt);
    //if there are any matched positions
    if(relPositions!=undefined){
      //get the next position that needs to be selected
      var pos=relPositions['selectPosition'];
      //update the nth numbering
      cached['searches'][findTxt]['nth']=pos['nth'];
      //select the position
      cached['cm']['object'].setSelection(
        CodeMirror.Pos(pos['line'], pos['start']),
        CodeMirror.Pos(pos['line'], pos['end'])
      );
      //update the Nth / Total count in the UI
      updateSearchTextCount(pos['nth'], cached['searches'][findTxt]['pos'].length);
    }else{
      //nothing found in the search
      updateSearchTextCount(0, 0);
      //clear the cached structure
      clearCachedSearchData(currentTabPath, findTxt);
    }
    //update previous search text
    setNewPreviousSearch(currentTabPath);
  } return cached;
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
  deselectSearched('.');
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
                    deselectSearched('.');
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
          //do stuff to the searchInput when (command + f) is pressed
          var searchInput=findtextWrap.find('.search-line.l1 .field-wrap input.search-field:first');
          //set the cursor into the search field
          searchInput.focus();
          searchInput.select();
          //get the codemirror object
          var cm=getCodeMirrorObj(editorDiv);
          if(cm!=undefined){
            //if anything is selected
            var selection=cm.object.doc.getSelection(); if(selection==undefined){selection='';}
            if(selection.length>0){
              //load the selection into the find text field
              searchInput.val(selection);
              //deselect existing search (if any)
              deselectSearched('.');
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
