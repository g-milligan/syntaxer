jQuery(document).ready(function(){
  //create the snippets content menu
  defineContentMenu('snippet', {
    _default:{
      title:'snippets',
      onopen:function(){
        console.log('snippet open yah!');
      },
      onclose:function(){
        console.log('snippet close yeah ;)');
      },
      oncreate:function(scrollWrap){
        scrollWrap.append('<div class="snippet-header"></div><div class="snippet-scroll"></div>');
        var snippetHeader=scrollWrap.children('.snippet-header:first');
        var snippetScroll=scrollWrap.children('.snippet-scroll:last');
        snippetHeader.append('<div class="comboselect" name="project-type"></div><div class="comboselect" name="snippet-file"></div><div class="comboselect" name="code-type"></div>');
        snippetHeader.children().each(function(){
          switch(jQuery(this).attr('name')){
            case 'project-type':
              initComboSelect(jQuery(this), {

              });
              break;
            case 'snippet-file':
              initComboSelect(jQuery(this), {

              });
              break;
            case 'code-type':
              initComboSelect(jQuery(this), {

              });
              break;
          }
        });
        //***
      }
    }
  });
});
