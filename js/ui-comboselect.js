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
    switch(e.keyCode){
      case 13: //enter key
        e.preventDefault(); e.stopPropagation();

        break;
      case 27: //esc key
        e.preventDefault(); e.stopPropagation();

        break;
      case 40: //down key
        e.preventDefault(); e.stopPropagation();

        break;
      case 38: //up key
        e.preventDefault(); e.stopPropagation();

        break;
    }
  });
  //select option method
  csWrap[0]['selectItem']=function(val, menu){
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
      if(csWrap.hasClass('cs-open')){
        var b=menu.parent().children('.cs-btn:first');
        setTimeout(function(){
          b.click();
        },100);
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
      option.click(function(){ csWrap[0]['selectItem'](jQuery(this)); });
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
