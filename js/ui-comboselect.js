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
        var menu=w.find('.cs cs-menu:first');
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
      filterCsInput(w.find('.cs input:first'));
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
}
