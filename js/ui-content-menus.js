//init content menu wrapper and default functionality like drag-resizing, etc...
function initContentMenus(wrap){
  //create a placeholder for the content menus
  wrap.append('<div class="content-menus"></div>');
  var subMenus=wrap.children('.content-menus:last');
  subMenus.append('<div class="menu-bodies"></div>');
  subMenus.append('<div class="menu-btns"><div class="btn-split-panels">'+svgPanels+'</div><div title="back to code" class="btn-cancel"></div></div>');
  subMenus.append('<div class="drag-resize"></div>');
  var dragResize=subMenus.children('.drag-resize:last');
  var btnsWrap=subMenus.children('.menu-btns:first');
  var btnSplitPanels=btnsWrap.children('.btn-split-panels:first');
  btnSplitPanels.append('<div class="dropdown"><div name="top" class="top"></div><div name="right" class="right"></div><div name="bottom" class="bottom"></div><div name="left" class="left"></div><div name="center" class="center"></div></div>');
  var dropdownPanels=btnSplitPanels.children('.dropdown:first');
  var btnCancel=btnsWrap.children('.btn-cancel:first');
  //standard content menu events
  draggy(dragResize.parents('#file-content:first'), dragResize, {
    direction:function(wrap, handle, args){
      var dir=[]; var cwrap=handle.parents('.content-wrap:first');
      if(cwrap.hasClass('content-menu-top') || cwrap.hasClass('content-menu-bottom')){ dir.push('up'); dir.push('down'); }
      if(cwrap.hasClass('content-menu-left') || cwrap.hasClass('content-menu-right')){ dir.push('left'); dir.push('right'); }
      return dir;
    },
    boundary:function(wrap, handle, args){
      var bounds={}; var cwrap=handle.parents('.content-wrap:first');
      if(cwrap.hasClass('content-menu-top') || cwrap.hasClass('content-menu-bottom')){
        bounds['padding-top']=200; bounds['padding-bottom']=200;
      }
      if(cwrap.hasClass('content-menu-left') || cwrap.hasClass('content-menu-right')){
        bounds['padding-left']=200; bounds['padding-right']=200;
      }
      return bounds;
    },
    mouseup:function(result, wrap, handle, args){
      var cwrap=handle.parents('.content-wrap:first'); var leftOrTop;
      if(result['move'].indexOf('right')!==-1){
        cwrap[0]['leftSplitPanelPercent']=result['percent_left']; leftOrTop='left';
      }else if(result['move'].indexOf('left')!==-1){
        cwrap[0]['leftSplitPanelPercent']=result['percent_left']; leftOrTop='left';
      }else if(result['move'].indexOf('down')!==-1){
        cwrap[0]['topSplitPanelPercent']=result['percent_top']; leftOrTop='top';
      }else if(result['move'].indexOf('up')!==-1){
        cwrap[0]['topSplitPanelPercent']=result['percent_top']; leftOrTop='top';
      }
      setContentMenuDragPercent(cwrap);
    }
  });
  btnSplitPanels.hover(function(){
    jQuery(this).addClass('open');
  },function(){
    jQuery(this).removeClass('open');
  });
  dropdownPanels.children().click(function(){
    var panelSplitType=jQuery(this).attr('name');
    var splitClass='content-menu-'+panelSplitType;
    var cwrap=jQuery(this).parents('.content-wrap:first');
    if(!cwrap.hasClass(splitClass)){
      cwrap.removeClass('content-menu-top').removeClass('content-menu-right').removeClass('content-menu-bottom').removeClass('content-menu-left').removeClass('content-menu-center');
      cwrap.addClass(splitClass); cwrap[0]['currentSplitPanelClass']=splitClass;
      setContentMenuDragPercent(cwrap);
      var ddlBtn=jQuery(this).parent().parent();
      setTimeout(function(){
        ddlBtn.removeClass('open');
      },200);
    }
  });
  btnCancel.click(function(){
    var divWrap=getEditorDiv(getActiveTabLi());
    var divActive=divWrap.children('.content-menus:last').children('.menu-bodies:first').children('.active:first');
    if(divActive.length>0){
      divActive[0]['contentMenuClose']();
    }
  });
}

//set the drag panel percent
function setContentMenuDragPercent(cwrap){
  //clear the previous set percentages
  var cMen=cwrap.children('.content-menus:last');
  cwrap.css({width:'',height:''});
  cMen.css({width:'',left:'',height:'',top:''});
  //find left or top
  var leftOrTop;
  if(cwrap.hasClass('content-menu-left') || cwrap.hasClass('content-menu-right')){ leftOrTop='left'; }
  else if(cwrap.hasClass('content-menu-top') || cwrap.hasClass('content-menu-bottom')){ leftOrTop='top'; }
  //if there is a set percent for this orientation
  if(cwrap[0].hasOwnProperty(leftOrTop+'SplitPanelPercent')){
    var contentPercent=cwrap[0][leftOrTop+'SplitPanelPercent'];
    var codePercent=100-contentPercent;
    switch(leftOrTop){
      case 'left':
        //invert content/code widths if the content is on the right side
        if(cwrap.hasClass('content-menu-right')){ codePercent=contentPercent; contentPercent=codePercent-100; }
        //set the code width
        cwrap.css({width:codePercent+'%'});
        //calcluate the percentage width of the content area, which would fill up the remaining area
        var cwrapWidth=cwrap.outerWidth();
        var fullWidth=cwrapWidth/(.01*codePercent);
        var contentWidthPx=fullWidth-cwrapWidth;
        var relContentPercent=contentWidthPx/cwrapWidth;
        relContentPercent*=100;
        //set the percent left/right
        if(cwrap.hasClass('content-menu-left')){ cMen.css({left:'-'+relContentPercent+'%'}); }
        else{ cMen.css({right:'-'+relContentPercent+'%'}); }
        //set calculated percentage width
        cMen.css({width:relContentPercent+'%'});
        break;
      case 'top':
        //invert content/code widths if the content is on the bottom side
        if(cwrap.hasClass('content-menu-bottom')){ codePercent=contentPercent; contentPercent=codePercent-100; }
        //set the code height
        cwrap.css({height:codePercent+'%'});
        //calcluate the percentage height of the content area, which would fill up the remaining area
        var cwrapHeight=cwrap.outerHeight();
        var fullHeight=cwrapHeight/(.01*codePercent);
        var contentHeightPx=fullHeight-cwrapHeight;
        var relContentPercent=contentHeightPx/cwrapHeight;
        relContentPercent*=100;
        //set the percent top/bottom
        if(cwrap.hasClass('content-menu-top')){ cMen.css({top:'-'+relContentPercent+'%'}); }
        else{ cMen.css({bottom:'-'+relContentPercent+'%'}); }
        //set calculated percentage height
        cMen.css({height:relContentPercent+'%'});
        break;
    }
  }
}

//define the data for a unique content menu
function defineContentMenu(menuType, data){
  if(!document.hasOwnProperty('ui_content_menus')){
    document['ui_content_menus']={};
  }
  if(!document['ui_content_menus'].hasOwnProperty(menuType)){
    document['ui_content_menus'][menuType]={};
    if(data!=undefined){
      var addDataProperty=function(ext, propName){
        if(data[ext].hasOwnProperty(propName)){
          document['ui_content_menus'][menuType][ext][propName]=data[ext][propName];
        }
      };
      for(ext in data){
        if(data.hasOwnProperty(ext)){
          //make sure this extension property is defined, eg: _default, js, template, etc...
          if(!document['ui_content_menus'][menuType].hasOwnProperty(ext)){
            document['ui_content_menus'][menuType][ext]={};
          }
          //set all of the allowed data properties for a content menu
          addDataProperty(ext, 'title');
          addDataProperty(ext, 'oncreate');
          addDataProperty(ext, 'onopen');
          addDataProperty(ext, 'onclose');
        }
      }
    }
  }
}

//create or open the content menu, eg: when you press Command+I
function openContentMenu(menuType){
  //==CREATE OR OPEN THE MENU==
  if(document['ui_content_menus'].hasOwnProperty(menuType)){
    var json=document['ui_content_menus'][menuType];
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
          //add menu content related to this insert menu
          json['oncreate'](menuBody.children('.scroll:last'));
          //close handler
          menuBody[0]['contentMenuClose']=function(){
            menuBody.removeClass('active');
            menuBodiesWrap.parent().parent().removeClass('show-content-menu');
            divWrap.removeClass(divWrap[0]['currentSplitPanelClass']);
            divWrap.css({width:'',height:''});
            divWrap.children('.content-menus:last').css({width:'',left:'',height:'',top:''});
            if(json.hasOwnProperty('onclose')){
              json['onclose']();
            }
          };
          //open handler
          menuBody[0]['contentMenuOpen']=function(){
            //close other extra windows, like findtext
            var uiWins=uiWindows(); uiWins['close']('findtext');
            //open content menu
            menuBodiesWrap.parent().parent().addClass('show-content-menu');
            menuBody.parent().children('.active').removeClass('active');
            divWrap.addClass(divWrap[0]['currentSplitPanelClass']);
            setContentMenuDragPercent(divWrap);
            menuBody.addClass('active');
            if(json.hasOwnProperty('onopen')){
              json['onopen']();
            }
          };
          //open the menu
          menuBody[0]['contentMenuOpen']();
          //set the content menu split panel class
          if(!divWrap.hasClass('content-menu-top')
            && !divWrap.hasClass('content-menu-right')
            && !divWrap.hasClass('content-menu-bottom')
            && !divWrap.hasClass('content-menu-left')){
              divWrap.addClass('content-menu-center');
              divWrap[0]['currentSplitPanelClass']='content-menu-center';
          }
        }else{
          //menu body already created...

          //toggle open the menu
          if(menuBody.hasClass('active')){
            menuBody[0]['contentMenuClose']();
          }else{
            menuBody[0]['contentMenuOpen']();
          }
        }
        //close the hints info, if it is showing
        var hintsInfoWrap=jQuery('#hints-info:first');
        if(hintsInfoWrap.hasClass('open')){
          hintsInfoWrap.find('.info-title .trigger-text').click();
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
