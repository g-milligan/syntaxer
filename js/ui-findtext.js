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
            searchBtnsWrap.append('<div class="main-btn"><div class="find-btn"></div></div><div class="sub-btns"><div class="regex-toggle"></div><div class="match-case-toggle"></div><div class="whole-word-toggle"></div></div>');
            var findBtn=searchBtnsWrap.find('.main-btn .find-btn:first');
            var regexBtn=searchBtnsWrap.find('.sub-btns .regex-toggle:first');
            var matchCaseBtn=searchBtnsWrap.find('.sub-btns .match-case-toggle:first');
            var wholeWordBtn=searchBtnsWrap.find('.sub-btns .whole-word-toggle:first');
            searchLine2.append('<div class="field-wrap"></div><div class="btns-wrap"></div>');
            var replaceFieldWrap=searchLine2.children('.field-wrap:first'); var replaceBtnsWrap=searchLine2.children('.btns-wrap:last');
            replaceBtnsWrap.append('<div class="main-btn"><div class="replace-btn"></div></div><div class="sub-btns"><div class="replace-all-btn"></div></div>');
            var replaceBtn=searchBtnsWrap.find('.main-btn .replace-btn:first');
            var replaceAllBtn=searchBtnsWrap.find('.sub-btns .replace-all-btn:first');
            searchFieldWrap.append('<input type="text" class="search-field" /><div class="count"></div>');
            var searchInput=searchFieldWrap.children('.search-field:first');
            replaceFieldWrap.append('<input type="text" class="replace-field" /><div class="count"></div>');
            var replaceInput=replaceFieldWrap.children('.replace-field:first');
            //attach events for the search replace text
            //***
          }
          didShow=true;
        }
      }
    }
  }
  return didShow;
}
