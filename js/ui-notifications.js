//close a popup note (similar to an alert)
function hideNote(noteWraps){
  if(noteWraps.length>0){
    //transition fade out for the wrap
    var wrap=noteWraps.eq(0).parent();
    //start fade out
    wrap.addClass('fade-out'); wrap.removeClass('active');
    setTimeout(function(){
      //fade out done
      wrap.removeClass('fade-out');
      //add the active notes
      noteWraps.filter('.active').removeClass('active');
    },300);
  }
}
//show a popup note (similar to an alert)
function showNote(args){
  if(args!=undefined){
    if(args.hasOwnProperty('id')){
      var bodyElem=jQuery('body:first');
      var wrap=bodyElem.children('section#notifications:last');
      //wrap events
      if(!wrap.hasClass('init')){
        //if the wrap is clicked
        wrap.click(function(){
          //if not hovering note content
          if(!wrap.hasClass('hover')){
            //hide open notes
            hideNote(wrap.children('.notification.active'));
          }
        });
      }
      //creating the note wrap for the first time
      var noteWrap=wrap.children('.notification[name="'+args['id']+'"]:first');
      if(noteWrap.length<1){
        wrap.append('<div class="notification" name="'+args['id']+'"><div class="content"></div></div>');
        noteWrap=wrap.children('.notification[name="'+args['id']+'"]:last');
        //hover event
        noteWrap.hover(function(){
          jQuery(this).parent().addClass('hover');
        },function(){
          jQuery(this).parent().removeClass('hover');
        });
      }
      //if a note is not fading out
      if(!wrap.hasClass('fade-out')){
        var contentDiv=noteWrap.children('.content:first');
        //update the note content
        if(args.hasOwnProperty('content')){
          contentDiv.html(args['content']);
        }
        //update the buttons
        if(args.hasOwnProperty('btns')){
          var noteBtns=noteWrap.children('.note-btns:first');
          if(noteBtns.length<1){
            noteWrap.append('<div class="note-btns"></div>');
            noteBtns=noteWrap.children('.note-btns:first');
          }
          for(btnName in args['btns']){
            if(args['btns'].hasOwnProperty(btnName)){
              var btnJson=args['btns'][btnName];
              var noteBtn=noteBtns.children('.note-btn[name="'+btnName+'"]:first');
              if(noteBtn.length<1){
                noteBtns.append('<div class="note-btn" name="'+btnName+'"></div>');
                noteBtn=noteBtns.children('.note-btn[name="'+btnName+'"]:last');
                noteBtn.click(function(){
                  //fire off the custom button action, if any
                  var doClose=true;
                  if(jQuery(this)[0].hasOwnProperty('noteBtnAction')){
                    doClose=jQuery(this)[0]['noteBtnAction'](jQuery(this));
                    if(doClose==undefined){
                      doClose=true;
                    }
                  }
                  if(doClose){
                    //close the note
                    hideNote(noteBtn.parents('.notification:first'));
                  }
                });
              }
              //set the button text
              var btnText=btnName;
              if(btnJson.hasOwnProperty('text')){
                btnText=btnJson['text'];
              }
              noteBtn.html(btnText);
              //set the button action
              if(btnJson.hasOwnProperty('action')){
                noteBtn[0]['noteBtnAction']=btnJson['action'];
              }
            }
          }
        }
        //if this note has buttons
        if(noteWrap.children('.note-btns:first').length>0){
          noteWrap.addClass('hasBtns');
        }else{
          //note doesn't have buttons
          noteWrap.removeClass('hasBtns');
          //auto fade out after a brief time
          setTimeout(function(){
            hideNote(noteWrap);
          }, 1000);
        }
        //show the wrap
        wrap.addClass('active');
        //hide other open notes
        hideNote(wrap.children('.notification.active'));
        //show this note
        noteWrap.addClass('active');
      }
    }
  }
}
//the oops function can be used to display error messages returned from ajax requests
function oops(msg){
  if(msg!=undefined && msg.length>0 && msg!=='ok'){
    console.log('Oops: '+msg);
    msg=msg.replace(/</g, '&lt;'); msg=msg.replace(/>/g, '&gt;');
    showNote({
      id:'oops-message',
      content:'Oops, something went wrong... <br />'+msg,
      btns:{
        cancel:{
          text:'OK'
        }
      }
    });
  }
}
