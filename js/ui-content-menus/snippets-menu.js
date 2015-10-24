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
        //***
      }
    }
  });
});
