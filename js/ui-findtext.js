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
            searchBtnsWrap.append('<div class="main-btn"><div class="find-btn">Find</div></div><div class="sub-btns"><div title="use regex" class="regex-toggle">.*</div><div title="match case" class="match-case-toggle">Aa</div><div title="whole word" class="whole-word-toggle">[word]</div></div>');
            var findBtn=searchBtnsWrap.find('.main-btn .find-btn:first');
            var regexBtn=searchBtnsWrap.find('.sub-btns .regex-toggle:first');
            var matchCaseBtn=searchBtnsWrap.find('.sub-btns .match-case-toggle:first');
            var wholeWordBtn=searchBtnsWrap.find('.sub-btns .whole-word-toggle:first');
            searchLine2.append('<div class="field-wrap"></div><div class="btns-wrap"></div>');
            var replaceFieldWrap=searchLine2.children('.field-wrap:first'); var replaceBtnsWrap=searchLine2.children('.btns-wrap:last');
            replaceBtnsWrap.append('<div class="main-btn"><div class="replace-btn">Replace</div></div><div class="sub-btns"><div class="replace-all-btn">Replace All</div></div>');
            var replaceBtn=searchBtnsWrap.find('.main-btn .replace-btn:first');
            var replaceAllBtn=searchBtnsWrap.find('.sub-btns .replace-all-btn:first');
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
            //*** more events
          }
          //do stuff to the searchInput when the findText panel first opens
          var searchInput=findtextWrap.find('.search-line.l1 .field-wrap input.search-field:first');
          
          searchInput.focus();
          //indicate that the customer searchtext panel is now showing
          didShow=true;
        }
      }
    }
  }
  return didShow;
}
