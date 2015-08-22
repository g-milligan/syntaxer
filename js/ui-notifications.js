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
      //show the next queued note, if any
      showNextQueuNote(wrap);
    },300);
  }
}
function showNextQueuNote(wrap){
  //if a note is not fading out
  if(!wrap.hasClass('fade-out') && !wrap.hasClass('active')){
    if(wrap[0]['showNoteQueu'].length>0){
      var currentArgs=wrap[0]['showNoteQueu'][0];
      //creating the note wrap for the first time ?
      var noteWrap=wrap.children('.notification[name="'+currentArgs['id']+'"]:first');
      if(noteWrap.length<1){
        wrap.append('<div class="notification" name="'+currentArgs['id']+'"><div class="content"></div></div>');
        noteWrap=wrap.children('.notification[name="'+currentArgs['id']+'"]:last');
        //hover event
        noteWrap.hover(function(){
          jQuery(this).parent().addClass('hover');
        },function(){
          jQuery(this).parent().removeClass('hover');
        });
      }
      //get the content div
      var contentDiv=noteWrap.children('.content:first');
      //update the note content
      if(currentArgs.hasOwnProperty('content')){
        contentDiv.html(currentArgs['content']);
      }
      //update the buttons
      if(currentArgs.hasOwnProperty('btns')){
        var noteBtns=noteWrap.children('.note-btns:first');
        if(noteBtns.length<1){
          noteWrap.append('<div class="note-btns"></div>');
          noteBtns=noteWrap.children('.note-btns:first');
        }
        for(btnName in currentArgs['btns']){
          if(currentArgs['btns'].hasOwnProperty(btnName)){
            var btnJson=currentArgs['btns'][btnName];
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
      //show this note
      noteWrap.addClass('active');
      //remove from the notes-to-show queu
      wrap[0]['showNoteQueu'].splice(0,1);
    }
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
        wrap.addClass('init');
        //if the wrap is clicked
        wrap.click(function(e){
          e.preventDefault(); e.stopPropagation();
          //if not hovering note content
          if(!wrap.hasClass('hover')){
            //hide open notes
            hideNote(wrap.children('.notification.active'));
          }
        });
      }
      //add note to queu of notes to display
      if(!wrap[0].hasOwnProperty('showNoteQueu')){
        wrap[0]['showNoteQueu']=[];
      }
      wrap[0]['showNoteQueu'].push(args);
      //show the next note in the queu
      showNextQueuNote(wrap);
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
