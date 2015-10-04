//create or open the content menu, eg: when you press Command+I
function openContentMenu(menuType){
  //==REUSE VALUES FOR CERTAIN MENU TYPES==
  var snippetTitle='snippets';
  var snippetOnOpen=function(){
    console.log('snippet open');
  };
  var snippetOnClose=function(){
    console.log('snippet close');
  };
  //==CONFIGURE MENU TYPES==
  var menusJson={
    snippet:{
      _default:{ title:snippetTitle, onopen:snippetOnOpen, onclose:snippetOnClose }/*,
      template:{ title:snippetTitle, onopen:snippetOnOpen, onclose:snippetOnClose },
      js:{ title:snippetTitle, onopen:snippetOnOpen, onclose:snippetOnClose }*/
    }
  };
  //==CREATE OR OPEN THE MENU==
  if(menusJson.hasOwnProperty(menuType)){
    var json=menusJson[menuType];
    //get active conten div
    var divWrap=getEditorDiv(getActiveTabLi());
    //get extension for active file (if viewing a file with an extension)
    var ext=getPathExt(divWrap);
    if(ext!=undefined){
      var extKey=ext;
      if(!json.hasOwnProperty(extKey)){ extKey='_default'; }
      if(json.hasOwnProperty(extKey)){
        json=json[extKey];
        var menuBodiesWrap=divWrap.children('.content-menus:last').children('.menu-bodies:last');
        var menuBody=menuBodiesWrap.children('[name="'+menuType+'"]:first');
        //if this menuType isn't already created for this active tab
        if(menuBody.length<1){
          //create the menu
          menuBodiesWrap.append('<div name="'+menuType+'" class="menu-body"><h1>'+json['title']+'</h1><div class="scroll"></div></div>');
          menuBody=menuBodiesWrap.children('[name="'+menuType+'"]:last');
          //*** add menu content related to this insert menu
          //close handler
          menuBody[0]['contentMenuClose']=function(){
            menuBody.removeClass('active');
            menuBodiesWrap.parent().parent().removeClass('show-content-menu');
            if(json.hasOwnProperty('onclose')){
              json['onclose']();
            }
          };
          //open handler
          menuBody[0]['contentMenuOpen']=function(){
            menuBodiesWrap.parent().parent().addClass('show-content-menu');
            menuBody.parent().children('.active').removeClass('active');
            menuBody.addClass('active');
            if(json.hasOwnProperty('onopen')){
              json['onopen']();
            }
          };
          //open the menu
          menuBody[0]['contentMenuOpen']();
        }else{
          //menu body already created...

          //toggle open the menu
          if(menuBody.hasClass('active')){
            menuBody[0]['contentMenuClose']();
          }else{
            menuBody[0]['contentMenuOpen']();
          }
        }
      }
    }else{
      showNote({
        id:'cannot-open-content-menu',
        content:'View this menu with a tab open. Please open a code tab, first.',
        btns:{ cancel:{ text:'OK' } }
      });
    }
  }
}
