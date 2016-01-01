jQuery(document).ready(function(){
  var defaultSelectVal='[select]', defaultSelectText='[select]';
  //the main function that handles updating all of the snippets content
  var updateSnippetsContent=function(scrollWrap){
    //get the snippet select dropdowns
    var snippetHeader=scrollWrap.children('.snippet-header:first');
    var projectSelect, fileSelect, extSelect;
    snippetHeader.children().each(function(){
      switch(jQuery(this).attr('name')){
        case 'project-type': projectSelect=jQuery(this); break;
        case 'snippet-file': fileSelect=jQuery(this); break;
        case 'code-type': extSelect=jQuery(this); break;
      }
    });
    //get the current selected items in the dropdowns
    var projOption=projectSelect[0]['getSelectedItem']();
    var fileOption=fileSelect[0]['getSelectedItem']();
    var extOption=extSelect[0]['getSelectedItem']();
    //get the body element
    var bodyEl=jQuery('body:first');
    var projectType=bodyEl.attr('project_type');
    var type='', ext='', path='';
    //set the project type to send to the server
    if(projectType!=undefined && projectType.length>0 && projectType!=='unknown'){ type=projectType; }
    else if(projOption.attr('name')!==defaultSelectVal){ type=projOption.attr('name'); }
    //set the ext to send to the server
    if(extOption.attr('name')!==defaultSelectVal){ ext=extOption.attr('name'); }
    //set the snippet path to send to the server
    if(fileOption.attr('name')!==defaultSelectVal){ path=fileOption.attr('name'); }
    //ajax to get the real dropdown options from the file system
    requestSnippetsData({type:type, ext:ext, path:path}, function(data){
      //clear out the previous dropdown values
      projectSelect[0]['removeItem'](projectSelect.find('.cs .cs-menu .option').not(':first'));
      fileSelect[0]['removeItem'](fileSelect.find('.cs .cs-menu .option').not(':first'));
      extSelect[0]['removeItem'](extSelect.find('.cs .cs-menu .option').not(':first'));
      //update the dropdown options with the the actual file system data
      var updateDropdown=function(array, selectMenu){
        if(data[array].length>0){
          var m=selectMenu.find('.cs .cs-menu:first');
          for(var t=0;t<data[array].length;t++){
            var v=data[array][t]; selectMenu[0]['addItem']({text:v,value:v}, m);
          }
        }
      };
      updateDropdown('type_options', projectSelect);
      updateDropdown('path_options', fileSelect);
      updateDropdown('ext_options', extSelect);
      //restore the previously selected items
      var restoreSelection=function(selectMenu, selOption){
        if(!selectMenu[0]['selectItem'](selOption, undefined, false)){
          //this selected item no longer exists in the filesystem... so select the first option instead
          var m=selectMenu.find('.cs .cs-menu:first');
          selectMenu[0]['selectItem'](m.children('.option:first'), m, false);
        }
      };
      restoreSelection(projectSelect, projOption);
      restoreSelection(fileSelect, fileOption);
      restoreSelection(extSelect, extOption);
      //if the status is ok to show file content
      if(data['status']==='ok'){
        //***
      }else{
        //***
      }
    });
  };
  //create the snippets content menu
  defineContentMenu('snippet', {
    _default:{
      title:'snippets',
      onopen:function(scrollWrap){
        //update the snippets content when the panel is opened
        updateSnippetsContent(scrollWrap);
      },
      onclose:function(scrollWrap){
        console.log('snippet close yeah ;)');
      },
      oncreate:function(scrollWrap){
        scrollWrap.append('<div class="snippet-header"></div><div class="snippet-scroll"></div>');
        var snippetHeader=scrollWrap.children('.snippet-header:first');
        var snippetScroll=scrollWrap.children('.snippet-scroll:last');
        snippetHeader.append('<div class="comboselect" name="project-type"></div><div class="comboselect" name="code-type"></div><div class="comboselect" name="snippet-file"></div>');
        snippetHeader.children().each(function(){
          switch(jQuery(this).attr('name')){
            case 'project-type':
              initComboSelect(jQuery(this), {
                options:[
                  {value:defaultSelectVal, text:defaultSelectText}
                ],
                onchange:function(selOption, val){
                  //on change, the body attribute should be updated with correct project type
                  var bodyEl=jQuery('body:first');
                  if(val===defaultSelectText){ val='unknown'; }
                  bodyEl.attr('project_type', val);
                  updateSnippetsContent(scrollWrap);
                }
              });
              break;
            case 'snippet-file':
              initComboSelect(jQuery(this), {
                options:[
                  {value:defaultSelectVal, text:defaultSelectText}
                ],
                onchange:function(selOption, val){
                  //on change causes an ajax request to update snippet content
                  updateSnippetsContent(scrollWrap);
                }
              });
              break;
            case 'code-type':
              initComboSelect(jQuery(this), {
                options:[
                  {value:defaultSelectVal, text:defaultSelectText}
                ],
                onchange:function(selOption, val){
                  //on change causes an ajax request to update snippet file selection
                  updateSnippetsContent(scrollWrap);
                }
              });
              break;
          }
        });
        //***
      }
    }
  });
});
