jQuery(document).ready(function(){
  //create the snippets content menu
  defineContentMenu('snippet', {
    _default:{
      title:'snippets',
      onopen:function(scrollWrap){
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
        //get the body element
        var bodyEl=jQuery('body:first');
        var projectType=bodyEl.attr('project_type');
        //ajax to get the real dropdown options from the file system
        requestSnippetsData({type:'webgl', ext:'js', path:'main.xml'}, function(data){
          //***
          var test='';
        });
      },
      onclose:function(scrollWrap){
        console.log('snippet close yeah ;)');
      },
      oncreate:function(scrollWrap){
        scrollWrap.append('<div class="snippet-header"></div><div class="snippet-scroll"></div>');
        var snippetHeader=scrollWrap.children('.snippet-header:first');
        var snippetScroll=scrollWrap.children('.snippet-scroll:last');
        snippetHeader.append('<div class="comboselect" name="project-type"></div><div class="comboselect" name="snippet-file"></div><div class="comboselect" name="code-type"></div>');
        var defaultSelectVal='[select]', defaultSelectText='[select]';
        snippetHeader.children().each(function(){
          switch(jQuery(this).attr('name')){
            case 'project-type':
              initComboSelect(jQuery(this), {
                options:[
                  {value:defaultSelectVal, text:defaultSelectText},
                  {value:'test', text:'test'},
                  {value:'hello', text:'hi!'},
                  {value:'goobye', text:'bye!'}
                ]
              });
              break;
            case 'snippet-file':
              initComboSelect(jQuery(this), {
                options:[
                  {value:defaultSelectVal, text:defaultSelectText}
                ]
              });
              break;
            case 'code-type':
              initComboSelect(jQuery(this), {
                options:[
                  {value:defaultSelectVal, text:defaultSelectText}
                ]
              });
              break;
          }
        });
        //***
      }
    }
  });
});
