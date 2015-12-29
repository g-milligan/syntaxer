function initComboSelect(csWrap, args){
  csWrap.addClass('comboselect');
  csWrap.html('<div class="cs"><input type="text" /><div class="cs-menu"></div><span class="cs-btn"></span></div>');
  var cs=csWrap.children('.cs:first');
  var input=cs.children('input:first');
  var btn=cs.children('.cs-btn:last');
  var filterCsInput=function(i){
    var val=i.val(); val=val.trim();
    if(val.length>0){
      var w=i.parents('.comboselect:first');
      w.removeClass('filtered-options');
      if(w.hasClass('cs-open')){
        var menu=w.find('.cs .cs-menu:first');
        val=val.toLowerCase();
        menu.find('.option').each(function(){
          i.removeClass('filtered');
          var txt=i.text(); txt=txt.trim(); txt=txt.toLowerCase();
          if(txt===val){
            i.addClass('filtered');
            w.addClass('filtered-options');
          }
        });
      }
    }
  };
  btn.click(function(){
    var w=jQuery(this).parents('.comboselect:first');

    if(w.hasClass('cs-open')){
      w.removeClass('cs-open');
    }else{
      jQuery('.comboselect.cs-open .cs > .cs-btn').click();
      w.addClass('cs-open');
      var i=w.find('.cs input:first');
      filterCsInput(i);
      i.focus();
    }
  });
  csWrap.mousedown(function(e){
    e.preventDefault(); e.stopPropagation();
  });
  if(!document.hasOwnProperty('close_comboselect_event') || !document['close_comboselect_event']){
      document['close_comboselect_event']=true;
      jQuery(document).mousedown(function(){
        jQuery('.comboselect.cs-open .cs-btn').click();
      });
  }
  input.keyup(function(){
    filterCsInput(jQuery(this));
  });
  input.focus(function(){
    var w=jQuery(this).parents('.comboselect:first');
    if(!w.hasClass('cs-open')){
      var b=w.find('.cs > .cs-btn:first');
      b.click();
    }
  });
  input.click(function(){
    var w=jQuery(this).parents('.comboselect:first');
    if(w.hasClass('cs-open')){
      var b=w.find('.cs > .cs-btn:first');
      b.click();
    }else{
      jQuery(this).focus();
    }
  });
  input.keydown(function(e){
    var i=jQuery(this);
    var getElems=function(){
      var c=i.parent();
      var w=c.parent();
      var menu=c.children('.cs-menu:first');
      var b=c.children('.cs-btn:last');
      return {wrap:w, cs:c, menu:menu, btn:b};
    };
    var enterOrEsc=function(e){
      e.preventDefault(); e.stopPropagation();
      var els=getElems();
      if(els['wrap'].hasClass('cs-open')){
        var selOption=els['menu'].children('.option.selected:first');
        if(selOption.length>0){
          selOption.children('span:first').click();
        }
      }else{
        els['btn'].click();
      }
    };
    var arrowNext=function(e, getNext, lastSelector){
      e.preventDefault(); e.stopPropagation();
      var els=getElems();
      if(els['wrap'].hasClass('cs-open')){
        if(els['menu'].children('.option').length>1){
          var selOption=els['menu'].children('.option.selected:first');
          var nextOption=getNext(selOption);
          if(nextOption.length<1){
            nextOption=els['menu'].children(lastSelector);
          }
          csWrap[0]['selectItem'](nextOption, els['menu'], false);
        }
      }else{
        els['btn'].click();
      }
    };
    switch(e.keyCode){
      case 13: //enter key
        enterOrEsc(e); break;
      case 27: //esc key
        enterOrEsc(e); break;
      case 40: //down key
        arrowNext(e, function(sopt){ return sopt.next('.option:first'); }, '.option:first'); break;
      case 38: //up key
        arrowNext(e, function(sopt){ return sopt.prev('.option:first'); }, '.option:last'); break;
    }
  });
  //select option method
  csWrap[0]['selectItem']=function(val, menu, closeMenu){
    if(closeMenu==undefined){ closeMenu=true; }
    if(menu==undefined){ menu=csWrap.find('.cs .cs-menu:first'); }
    var option=val;
    if(typeof val==='string'){ option=menu.find('.option[name="'+val+'"]:first'); }
    else{ val=option.attr('name'); }
    if(option.length>0){
      menu.children('.option.selected').removeClass('selected');
      option.addClass('selected');
      var i=csWrap.find('.cs input:first');
      i.val(option.text());
      i.focus();
      //close menu
      if(closeMenu){
        if(csWrap.hasClass('cs-open')){
          var b=menu.parent().children('.cs-btn:first');
          setTimeout(function(){
            b.click();
          },100);
        }
      }
    }
  };
  //add item method
  csWrap[0]['addItem']=function(params, menu){
    var val='', text='';
    if(params.hasOwnProperty('value')){ val=params['value']; }
    if(params.hasOwnProperty('text')){ text=params['text']; }
    if(menu==undefined){ menu=csWrap.find('.cs .cs-menu:first'); }
    var existingOption=menu.find('.option[name="'+val+'"]:first');
    if(existingOption.length<1){
      menu.append('<div class="option" name="'+val+'"><span>'+text+'</span></div>');
      var option=menu.children('.option:last');
      option.children('span:first').click(function(){ csWrap[0]['selectItem'](jQuery(this).parent()); });
    } return menu;
  };
  //remove item method
  csWrap[0]['removeItem']=function(vals){
    var removeVals=[];
    if(typeof vals==='string'){ removeVals.push(vals); }
    else{ removeVals=vals; }
    if(removeVals.length>0){
      if(removeVals.remove){
        removeVals.remove();
      }else{
        var menu=w.find('.cs .cs-menu:first');
        for(var r=0;r<removeVals.length;r++){
          var val=removeVals[r];
          var option=menu.find('.option[name="'+val+'"]:first');
          if(option.length>0){ option.remove(); }
        }
      }
    }
  };
  //if any args were given
  if(args!=undefined){
    //add options
    if(args.hasOwnProperty('options')){
      if(args['options'].length>0){
        var menu, firstOpt;
        for(var p=0;p<args['options'].length;p++){
          var opt=args['options'][p];
          menu=csWrap[0]['addItem'](opt,menu);
          //get the first option
          if(firstOpt==undefined || firstOpt.length<1){
            firstOpt=menu.children('.option:first');
          }
        }
        //select the first option
        csWrap[0]['selectItem'](firstOpt, menu);
      }
    }
  }
}