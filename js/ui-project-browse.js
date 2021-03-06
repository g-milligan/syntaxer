var noRecentProjectsHtml;
//function to scroll a selected browse file li item into view if it's not already in view
function scrollToBrowseFileLi(li,callback){
  if(li!=undefined){
    if(li.length>0){
      var liTop=li.offset().top;
      var liBottom=liTop+li.outerHeight();
      var scrollWrap=li.parents('.scroll:first');
      var boundTop=scrollWrap.offset().top;
      var boundBottom=boundTop+scrollWrap.outerHeight();
      var diff=0;
      if(liTop<boundTop){
        diff=liTop-boundTop;
      }else if(liBottom>boundBottom){
        diff=liBottom-boundBottom;
      }
      //if need to adjust scroll
      if(diff!==0){
        //get the new scroll top position
        var newTop=scrollWrap.scrollTop()+diff;
        //animate the scroll to the adjusted scroll amount
        scrollWrap.animate({
          scrollTop: newTop
        }, 100,
        function(){
          //finished animate
          if(callback!=undefined){
            callback();
          }
        });
      }
    }
  }
}
//select an li element for a file in the browse window
function selectBrowseFileLi(fileLi){
  if(fileLi!=undefined){
    if(fileLi.length>0){
      //set the selected class
      fileLi.parent().children('.selected').removeClass('selected');
      fileLi.addClass('selected');
      var navBarInput=fileLi.parents('.box-col.browse:first').find('.nav-bar input.path:first');
      navBarInput.val(fileLi.attr('path'));
      toggleNavBarEditClass(navBarInput);
      navBarInput.focus();
      //make sure the selected item is in scroll view
      scrollToBrowseFileLi(fileLi);
      //update the open button
      toggleBrowseOpenButton(fileLi);
    }
  }
}
//toggle disable/enable the delete button for the file browser
function toggleBrowseDeleteButton(browseWrap){
  if(browseWrap.attr('mode')==='new'){
    var deleteBtn=browseWrap.find('.edit-btns .edit-btn.delete:first');
    var selLi=browseWrap.find('.scroll ul.files li.selected:first');
    if(selLi.length>0){
      deleteBtn.removeClass('disabled');
    }else{
      deleteBtn.addClass('disabled');
    }
  }
}
//function to ignore trailing slash, trim, etc... so two paths can be compared as same location
function sanitizeProjectBrowsePath(pstr){
  if(pstr==undefined){pstr='';} pstr=pstr.trim();
  if(pstr.lastIndexOf('/')===pstr.length-'/'.length){
    pstr=pstr.substring(0, pstr.length-'/'.length);
  } return pstr;
}
//checks if there is anything wrong with the new file name (in the new project dialog box)
function validateNewProjectNameDialog(){
  var ret={status:'error, new-project dialog box is not open'};
  var box=jQuery('body section#lightbox .box.open:first');
  if(box.length>0){
    var browseWrap=box.find('.box-col.browse[mode="new"]:first');
    if(browseWrap.length>0){
      ret['status']='error, the browse path in the nav-bar differs from the current open directory';
      //get status icon
      var editInputWrap=browseWrap.find('.edit-btns .edit-input:first');
      var statIconsWrap=editInputWrap.find('.status-icon:first');
      statIconsWrap.children('.active').removeClass('active');
      statIconsWrap.children('.default-icon').addClass('active');
      //function to set the invalid entry icon
      var setInvalidIcon=function(){
        statIconsWrap.children('.active').removeClass('active');
        statIconsWrap.children('.invalid-icon').addClass('active');
      };
      //get nav bar stuff
      var navBarInput=browseWrap.find('.nav-bar input.path:first');
      var shownPath=sanitizeProjectBrowsePath(navBarInput.val());
      //if an .html file isn't in the shown path (shouldn't be in this 'new' mode, but make sure anyway)
      if(shownPath.lastIndexOf('.html')!==shownPath.length-'.html'.length){
        //if shown path is the current path (not being edited)
        if(!navBarInput.hasClass('edit-path')){
          //double check (should pass if the edit-path class isn't on the input
          var currentPath=sanitizeProjectBrowsePath(navBarInput[0]['currentBrowsePath']);
          if(shownPath===currentPath){
            //confirmed, the current directory path is loaded in the explorer list...
            var newFileInput=browseWrap.find('.edit-btns .edit-input .input input:first');
            var newFileName=newFileInput.val();
            if(newFileName==undefined){newFileName='';} newFileName=newFileName.trim();
            //if not blank
            if(newFileName.length>0){
              //if the file name doesn't contain weird characters
              if(encodeURIComponent(newFileName)===newFileName){
                //if the file name doesn't contain spaces
                if(newFileName.replace(/^\s+|\s+$/g, '')===newFileName){
                  //if the file name doesn't contain other illegal characters
                  if(newFileName.indexOf("*")===-1 && newFileName.indexOf("!")===-1 && newFileName.indexOf("(")===-1 && newFileName.indexOf(")")===-1 && newFileName.indexOf("~")===-1 && newFileName.indexOf("'")===-1){
                    //if the user didn't write .html at the end of the file name (.html extension is assumed)
                    if(newFileName.indexOf('.html')===-1 || newFileName.toLowerCase().lastIndexOf('.html')!==newFileName.length-'.html'.length){
                      var scrollWrap=browseWrap.find('.scroll:first');
                      var path=currentPath+'/'+newFileName+'.html';
                      var existingLi=scrollWrap.find('ul.files li[path="'+path+'"]:first');
                      //if a file with this name doesn't already exist
                      if(existingLi.length<1){
                        ret['status']='ok';
                        statIconsWrap.children('.active').removeClass('active');
                        statIconsWrap.children('.valid-icon').addClass('active');
                      }else{
                        ret['status']='error, already exists: '+path;
                        setInvalidIcon();
                      }
                    }else{
                      //redundant .html.html extension for the file name...
                      ret['status']='error, redundant .html.html extension for the file name';
                      setInvalidIcon();
                    }
                  }else{
                    //file name contains spaces
                    ret['status']='error, file name must not contain illegal characters';
                    setInvalidIcon();
                  }
                }else{
                  //file name contains spaces
                  ret['status']='error, file name cannot contain spaces';
                  setInvalidIcon();
                }
              }else{
                //file name contains weird characters...
                ret['status']='error, file name must not contain illegal characters';
                setInvalidIcon();
              }
            }else{
              //blank new file name...
              ret['status']='error, blank file name';
            }
          }
        }
      }
      //set the status message
      var statMsgWrap=editInputWrap.children('.status-msg:first');
      if(statMsgWrap.length<1){
        editInputWrap.append('<div class="status-msg"></div>');
        statMsgWrap=editInputWrap.children('.status-msg:first');
      }
      statMsgWrap.html(ret['status']);
      if(ret['status']!=='ok'){
        statMsgWrap.addClass('error');
        statMsgWrap.removeClass('ok');
      }else{
        statMsgWrap.removeClass('show');
        statMsgWrap.addClass('ok');
        statMsgWrap.removeClass('error');
      }
    }
  }
  return ret;
}
//toggle showing that there have been edits to the nav bar path
function toggleNavBarEditClass(navBar){
  //if the path in the input box isn't the current path
  var currentBrowsePath=sanitizeProjectBrowsePath(navBar[0]['currentBrowsePath']);
  var pathVal=sanitizeProjectBrowsePath(navBar.val());
  if(currentBrowsePath!==pathVal){
    navBar.addClass('edit-path');
  }else{
    //the path in the input box is the current path
    navBar.removeClass('edit-path');
  }
}
//enable/disable the open button based on if all conditions are met for the open button to be enabled
function toggleBrowseOpenButton(liClick){
  var openBtn;
  //get the ok button
  var box=jQuery('body section#lightbox .box.open:first');
  if(box.length>0){
    var browseWrap=box.find('.box-col.browse:first');
    var scrollWrap=browseWrap.find('.scroll:first');
    var boxBtns=box.children('.box-btns');
    openBtn=boxBtns.children('.box-btn.open:last');
    //no project file selected until proven otherwise
    openBtn.addClass('disabled');
    //depending on the browse explorer mode...
    var browseMode=browseWrap.attr('mode');
    switch(browseMode){
      case 'open': //open file mode
        //if no li is provided
        if(liClick==undefined){
          //find a selected file (if any)
          liClick=scrollWrap.find('ul.files > .ok.file.selected:first');
        }
        //if there is any selected file
        if(liClick.length>0){
          if(liClick.hasClass('file')){
            if(liClick.hasClass('ok')){
              //enable the open project button with correct project path
              var selFile=liClick.attr('path');
              var url=document.location.href;
              if(url.indexOf('?')!==-1){
                url=url.substring(0,url.lastIndexOf('?'));
              }
              url+='?file='+encodeURIComponent(selFile);
              openBtn.attr('href',url);
              openBtn.removeClass('disabled');
              //make sure the selected liClick file is scrolled in view
              scrollToBrowseFileLi(liClick);
            }
          }
        }
      break;
      case 'new': //new file mode
        var stat=validateNewProjectNameDialog();
        if(stat['status']==='ok'){
          openBtn.removeClass('disabled');
        }
        //disable/enable the delete button
        toggleBrowseDeleteButton(browseWrap);
      break;
    }
  }
  return openBtn;
}
//show the recent projects listing
function updateRecentProjectListing(){
  var box=jQuery('body section#lightbox .box.open:first');
  //if the recent projects data hasn't already been linked to this lightbox
  if(!box[0].hasOwnProperty('recentProjectsData')){
    var recentProjWrap=box.find('.box-content .recent-projects:first');
    //if a lightbox, that has recent projects, is open
    if(recentProjWrap.length>0){
      var scrollWrap=recentProjWrap.find('.scroll:first');
      //if the recent projects are not already loaded
      if(scrollWrap.find('p.msg.no-recent:first').length>0){
        //request the recent projects' data
        requestRecentProjectsData(function(data){
          if(data['status']==='ok'){
            if(data.hasOwnProperty('recent_projects')){
              if(data['recent_projects'].hasOwnProperty('id')){
                if(data['recent_projects'].hasOwnProperty('data')){
                  if(data['recent_projects'].hasOwnProperty('in_order')){
                    //link the recent projects data to this lightbox
                    box[0]['recentProjectsData']=data['recent_projects'];
                    var temLi=getTemplateTabLi(); var currentProjPath=temLi.attr('path');
                    var html='', projIndex=0;
                    //get data part html format
                    var getDataDivPart=function(keyName, contentJson){
                      var theHtml='';
                      if(contentJson.length>0){
                        var rowsClass='two-rows'
                        if(contentJson.length===1){ rowsClass='one-row'; }
                        theHtml+='<div class="data-part '+rowsClass+'" name="'+keyName+'">'; //start data part
                        for(var r=0;r<contentJson.length;r++){
                          if(r<2){
                            theHtml+='<div class="data-row">';
                            var rowData=contentJson[r];
                            if(rowData.hasOwnProperty('row')){
                              theHtml+=rowData['row'];
                            }else{
                              if(rowData.hasOwnProperty('label')){
                                theHtml+='<div class="lab">';
                                theHtml+=rowData['label'];
                                theHtml+='</div>';
                              }
                              if(rowData.hasOwnProperty('value')){
                                theHtml+='<div class="val">';
                                if(typeof rowData['value']==='number'){
                                  rowData['value']+='';
                                }
                                if(typeof rowData['value']!=='string'){
                                  theHtml+=getFormattedDate(rowData['value']);
                                }else{
                                  theHtml+=rowData['value'];
                                }
                                theHtml+='</div>';
                              }
                            }
                            theHtml+='</div>';
                          }else{
                            break;
                          }
                        }
                        theHtml+='</div>'; //end data part
                      }
                      return theHtml;
                    };
                    //for each recent project
                    for(projId in box[0]['recentProjectsData']['id']){
                      if(box[0]['recentProjectsData']['id'].hasOwnProperty(projId)){
                        var projPath=box[0]['recentProjectsData']['id'][projId];
                        //if this isn't the current open project (current project doesn't show up in recent projects listing)
                        if(projPath!==currentProjPath){
                          //get just the file name, no path
                          var fname=projPath;
                          if(fname.lastIndexOf('/')!==-1){
                            fname=fname.substring(fname.lastIndexOf('/')+'/'.length);
                          }
                          //put the html into the page
                          html+='<div id="rp_'+projId+'" class="recent-project" name="'+fname+'">'; //start div.recent-project
                          html+='<div class="lbl"><div class="num">'+(projIndex+1)+'</div><div class="check"></div></div>';
                          html+='<div class="pane">'; //start div.pane
                          html+='<div class="title" title="'+projPath+'">'; //start div.title
                          html+='<div class="unique-name">'+fname+'</div>';
                          html+='<div class="open-btn">'+svgOpen+'</div>';
                          html+='</div>'; //end div.title
                          html+='<div class="data">'; //start div.data
                          if(box[0]['recentProjectsData']['data'].hasOwnProperty(projId)){
                            var projData=box[0]['recentProjectsData']['data'][projId];
                            html+=getDataDivPart('create',
                              [{
                                label:'created',
                                value:getDateFromStr(projData['create'])
                              }]
                            );
                            html+=getDataDivPart('modify',
                              [{
                                label:'modified',
                                value:getDateFromStr(projData['modify'])
                              }]
                            );
                            html+=getDataDivPart('open',
                              [{
                                label:'last open',
                                value:getDateFromStr(projData['last_open'])
                              },{
                                label:'opens',
                                value:projData['opens']
                              }]
                            );
                            html+=getDataDivPart('open_time_hours',
                              [{
                                row:'<div class="time-bar"><div class="fill-bar"></div></div>'
                              },{
                                label:'open (hours)',
                                value:projData['open_time_hours']
                              }]
                            );
                          }
                          html+='</div>'; //end div.data
                          html+='</div>'; //end div.pane
                          html+='</div>'; //end div.recent-project
                          //next project index
                          projIndex++;
                        }
                      }
                    }
                    //if there are any recent projects in the list
                    if(html.length>0){
                      //save the html that displays when there are no recent projects
                      if(noRecentProjectsHtml==undefined){
                        noRecentProjectsHtml=scrollWrap.html();
                      }
                      //set the project list items in the scroll area
                      scrollWrap.html(html);
                      //for each recent project
                      scrollWrap.children('.recent-project').each(function(){
                        var divRecentProj=jQuery(this);
                        var divLbl=divRecentProj.children('.lbl:first');
                        //select check event
                        divLbl.click(function(){
                          //get key elements
                          var dwrap=jQuery(this).parents('.recent-project:first');
                          var parentBox=dwrap.parents('.box:first');
                          var removeBtn=parentBox.find('.box-btns .box-btn.remove-recent:first');
                          //toggle select class
                          if(dwrap.hasClass('selected')){ dwrap.removeClass('selected'); }
                          else{ dwrap.addClass('selected'); }
                          //if any selected
                          if(dwrap.parent().children('.selected').length>0){
                            //remove deselected class from the remove-projects button
                            removeBtn.removeClass('disabled');
                          }else{
                            //add deselected class from the remove-projects button
                            removeBtn.addClass('disabled');
                          }
                        });
                        var divPane=divRecentProj.children('.pane:first')
                        var divTitle=divPane.children('.title:first');
                        //open project event
                        divTitle.click(function(){
                          var navPath=sanitizeProjectBrowsePath(jQuery(this).attr('title'));
                          var parentBox=jQuery(this).parents('.box:first');
                          var openBtn=parentBox.find('.box-btns .box-btn.open:first');
                          //browse to the current directory again to refresh
                          updateProjectBrowse(navPath,openBtn['okButtonAction']);
                        });
                      });
                      //get the filter/order controls
                      var j=getFilterOrderElems(scrollWrap);
                      //restore the saved ui list state, if there is a saved state
                      if(box[0]['recentProjectsData'].hasOwnProperty('ui_project_list')){
                        var ui_project_list=box[0]['recentProjectsData']['ui_project_list'];
                        if(ui_project_list.hasOwnProperty('filter_search')){
                          j.inp.val(ui_project_list['filter_search']);
                        }
                        if(ui_project_list.hasOwnProperty('order_by')){
                          var orderByIco=j.orderIconBtn.children('.icon[name="'+ui_project_list['order_by']+'"]:first');
                          if(orderByIco.length>0){
                            j.orderIconBtn.children('.icon.active').removeClass('active');
                            orderByIco.addClass('active');
                          }
                        }
                        if(ui_project_list.hasOwnProperty('asc_desc')){
                          switch(ui_project_list['asc_desc']){
                            case 'asc': j.ascDescBtn.removeClass('desc'); j.ascDescBtn.addClass('asc'); break;
                            case 'desc': j.ascDescBtn.removeClass('asc'); j.ascDescBtn.addClass('desc'); break;
                          }
                        }
                      }
                      //set initial order and unique project names, etc...
                      var orderRules=getFilterOrderRules(j);
                      reorderRecentProjects(j.scrollW, orderRules);
                    }
                  }
                }
              }
            }
          }
        });
      }
    }
  }
}
//update the browse path for the project browse dialag box
function updateProjectBrowse(path,okButtonAction){
  if(path==undefined){path='';}
  requestProjectFiles(function(data){
    var box=jQuery('body section#lightbox .box.open:first');
    var browseWrap=box.find('.box-col.browse:first');
    var navBarInput=browseWrap.find('.nav-bar input.path:first');
    var scrollWrap=browseWrap.find('.scroll:first');
    if(data.status==='ok'){
      //make sure the alert class isn't preventing scrolling
      scrollWrap.removeClass('alert');
      //set the focus on the nav bar when the dialog box first opens or navigates to a new directory
      navBarInput.focus();
      //function to open a project
      var clickBrowseLi=function(e,liClick){
        e.preventDefault();
        //select the file li
        selectBrowseFileLi(liClick);
        //toggle enable disable open project button
        var openBtn=toggleBrowseOpenButton(liClick);
        //is double click?
        var isDoubleClick=liClick.hasClass('click');
        if(!isDoubleClick){
          liClick.addClass('click');
          setTimeout(function(){
            liClick.removeClass('click');
          },180);
        }
        //if file clicked (not directory)
        if(liClick.hasClass('file')){
          if(isDoubleClick){
            if(okButtonAction!=undefined){
              if(!openBtn.hasClass('disabled')){
                okButtonAction(openBtn);
              }
            }
          }
        }else{
          //directory clicked...
          if(isDoubleClick){
            //follow the directory path
            var followPath=liClick.attr('path');
            updateProjectBrowse(followPath,okButtonAction);
          }
        }
      };
      //set the path
      var setPath=data.path+'/';
      if(browseWrap.attr('mode')!=='new'){
        setPath+=data.pathFile;
      }
      navBarInput.val(setPath);
      navBarInput[0]['currentBrowsePath']=setPath;
      navBarInput.removeClass('edit-path');
      //clear browser contents
      scrollWrap.html('');
      //if there are any directories or folders
      if(data.dirs.length>0 || data.files.length>0){
        var html='<ul class="files">';
        //for each directory
        var dirs=data.dirs.sort();
        for(var d=0;d<dirs.length;d++){
          var dir=dirs[d];
          html+='<li class="dir" path="'+data.path+'/'+dir+'">';
          html+='<span class="icon">'+svgDir+'</span>';
          html+='<span class="txt">'+dir+'</span>';
          html+='</li>';
        }
        //get the current project file from the url
        var currentFile='';
        var qs=getQs();
        if(qs.hasOwnProperty('file')){
          currentFile=decodeURIComponent(qs.file);
        }
        //for each file
        var files=data.files.sort();
        for(var f=0;f<files.length;f++){
          var file=files[f]; var fileData=data.filesData[file];
          var statusClass='ok '; if(fileData.status!=='ok'){ statusClass='invalid '; }
          var fpath=data.path+'/'+file;
          var currentClass='', selectClass='';
          if(currentFile===fpath){currentClass='current ';}
          else if(file===data.pathFile){selectClass='selected ';}
          html+='<li class="'+statusClass+currentClass+selectClass+'file" path="'+fpath+'">';
          html+='<span class="icon">'+svgFile+'</span>';
          html+='<span class="txt">'+file+'</span>';
          html+='</li>';
        }
        html+='</ul>';
        //set the html
        scrollWrap.html(html);
        //file events
        scrollWrap.find('ul.files > li').not('.invalid').not('.current').each(function(){
          jQuery(this).click(function(e){
            clickBrowseLi(e,jQuery(this));
          });
        });
      }else{
        scrollWrap.html('<p class="msg">folder empty...</p>');
      }
      //populate the recent projects, if not already populated
      updateRecentProjectListing();
    }else{
      //something wrong with the data.status
      navBarInput.addClass('err-path');
      setTimeout(function(){
        navBarInput.removeClass('err-path');
      },180);
    }
    //decide if the open project button should be enabled
    toggleBrowseOpenButton();
    //make sure the file that has the same path as the nav bar is scrolled into view
    var navInputLi=scrollWrap.find('li[path="'+data.path+'/'+data.pathFile+'"]:first');
    scrollToBrowseFileLi(navInputLi);
  }, path);
}
//open/create an alert-type sub menu for the file browser
function openBrowseAlert(box, alertName, className, bodyHtml, initAction, openAction, cancelAction, okAction){
  var browseWrap=box.find('.box-col.browse:first');
  var scrollWrap=browseWrap.find('.scroll:first');
  //function to close the new folder alert
  var defaultCancelAction=function(alertWrap){
    alertWrap.removeClass('show');
    alertWrap.parents('.scroll:first').removeClass('alert');
    cancelAction(alertWrap);
  };
  //function for the ok button code
  var defaultOkAction=function(alertWrap){
    //if the ok button isn't disabled
    if(!alertWrap.find('.alert-content .alert-btns .alert-btn.ok:first').hasClass('disabled')){
      if(okAction(alertWrap)){
        defaultCancelAction(alertWrap);
      }
    }
  };
  //if the new folder dialog isn't already initialized
  var newAlertWrap=scrollWrap.children('.'+className+':last');
  if(newAlertWrap.length<1){
    //initialize the new folder dialog
    scrollWrap.append('<div class="browse-alert '+className+'"></div>');
    newAlertWrap=scrollWrap.children('.'+className+':last');
    newAlertWrap.append('<div class="alert-content"></div>');
    var alertContent=newAlertWrap.children('.alert-content:first');
    alertContent.append('<h1>'+alertName+'</h1>');
    alertContent.append('<div class="alert-body"></div>');
    var alertBody=alertContent.children('.alert-body:first');
    alertBody.append(bodyHtml);
    alertContent.append('<div class="alert-btns"><div class="alert-btn cancel">Cancel</div><div class="alert-btn ok">OK</div></div>');
    var alertBtns=alertContent.children('.alert-btns:first');
    var cancelBtn=alertBtns.children('.alert-btn.cancel:first');
    var okBtn=alertBtns.children('.alert-btn.ok:first');
    //new folder events
    okBtn.click(function(){
      defaultOkAction(jQuery(this).parents('.browse-alert:first'));
    });
    cancelBtn.click(function(){
      defaultCancelAction(jQuery(this).parents('.browse-alert:first'));
    });
    //init action
    initAction(newAlertWrap, cancelBtn, okBtn);
  }
  //toggle show/hide the browse alert box
  var browseAlertWrap=scrollWrap.children('.browse-alert.'+className+':first');
  if(browseAlertWrap.hasClass('show')){
    defaultCancelAction(browseAlertWrap);
  }else{
    scrollWrap.scrollTop(0);
    scrollWrap.children('.browse-alert.show').removeClass('show');
    browseAlertWrap.addClass('show');
    scrollWrap.addClass('alert');
    openAction(newAlertWrap);
  }
}
//show an alert (within the lightbox) related to some sort of error
function errMsgAlert(box,className,errMsg,errTitle){
  if(errTitle==undefined){errTitle='Oops...';}
  //create the alert functionality and controls
  openBrowseAlert(box, errTitle, className,
    '<p>Something went wrong:</p><p>'+errMsg+'</p>', //alert body html
    function(alertWrap, cancelBtn, okBtn){ //when the alert loads for the first time
      cancelBtn.css('display','none');
    },
    function(alertWrap){ //when this alert is opened

    },function(alertWrap){ //when this alert cancels

    },function(alertWrap){ //ok button action
      return true;
    }
  );
}
//delete file or folder dialog box alert
function deleteFileOrFolderAlert(box){
  //create the alert functionality and controls
  openBrowseAlert(box, 'Delete?', 'delete-file-or-folder',
    '<div class="areyousure"><p>Are you sure you want to delete? This cannot be undone.</p> <p class="msg"></p> <p class="confirm"><input name="yessure" class="yessure" type="checkbox" /> Yes! I\'m sure!</p></div>', //alert body html
    function(alertWrap, cancelBtn, okBtn){ //when the alert loads for the first time
      var okBtn=alertWrap.find('.alert-content .alert-btns .alert-btn.ok:first');
      var chk=alertWrap.find('.alert-content .alert-body .yessure:first');
      chk.change(function(){
        if(jQuery(this).is(':checked')){
          okBtn.removeClass('disabled');
        }else{
          okBtn.addClass('disabled');
        }
      });
    },
    function(alertWrap){ //when this alert is opened
      var okBtn=alertWrap.find('.alert-content .alert-btns .alert-btn.ok:first');
      var chk=alertWrap.find('.alert-content .alert-body .yessure:first');
      var areyousureCtls=alertWrap.find('.alert-content .alert-body .areyousure:first');
      alertWrap.find('.alert-content .alert-body > .error-msg:last').remove();
      areyousureCtls.css('display','none');
      okBtn.css('display','none');
      var pathMsg=areyousureCtls.find('.msg:first');
      var scrollWrap=alertWrap.parents('.scroll:first');
      var selLi=scrollWrap.find('ul.files li.selected:first');
      chk.attr('checked',false);
      okBtn.addClass('disabled');
      pathMsg.html('');
      //confirm if the selected path can be deleted
      browserIsAllowedDelete(selLi.attr('path'), function(data){
        if(data['status']==='ok'){
          //set the path that can be deleted
          pathMsg.html(selLi.attr('path'));
          areyousureCtls.css('display','');
          okBtn.css('display','');
        }else{
          //print the error status, reason for not being able to delete this file or folder
          alertWrap.find('.alert-content .alert-body').append('<div class="error-msg"><p>'+selLi.attr('path')+'</p><p class="msg">'+data['status']+'</p></div>');
        }
      });
    },function(alertWrap){ //when this alert cancels

    },function(alertWrap){ //ok button action
      var isValid=false;
      var okBtn=alertWrap.find('.alert-content .alert-btns .alert-btn.ok:first');
      if(!okBtn.hasClass('disabled')){
        isValid=true;
        var pathMsg=alertWrap.find('.alert-content .alert-body .areyousure .msg:first');
        var delPath=pathMsg.html(); delPath=sanitizeProjectBrowsePath(delPath);
        //delete a file or folder if it can be deleted
        browserDeleteFileOrFolder(delPath, function(data){
          var box=alertWrap.parents('.box:first');
          var navBarInput=box.find('.box-content .box-col.browse .nav-bar input.path:first');
          var currentBrowsePath=sanitizeProjectBrowsePath(navBarInput[0]['currentBrowsePath']);
          var openBtn=box.find('.box-btns .box-btn.open:first');
          //browse to the current directory again to refresh
          updateProjectBrowse(currentBrowsePath,openBtn['okButtonAction']);
        });
      }
      return isValid;
    }
  );
}
//create new folder in the file system, from the browse box
function openNewFolderInput(box){
  //function to validate the new folder name
  var validateFolder=function(input, okBtn){
    var validDir=false;
    var dir=input.val(); dir=dir.trim();
    var errMsgWrap=input.parent().children('.msg:last');
    errMsgWrap.html('');
    if(dir.length>0){
      //if the file name doesn't contain weird characters
      if(encodeURIComponent(dir)===dir){
        //if the file name doesn't contain spaces
        if(dir.replace(/^\s+|\s+$/g, '')===dir){
          //if the file name doesn't contain '
          if(dir.indexOf("*")===-1 && dir.indexOf("!")===-1 && dir.indexOf("(")===-1 && dir.indexOf(")")===-1 && dir.indexOf("~")===-1 && dir.indexOf("'")===-1){
            //if the user didn't write .html at the end of the file name (.html extension is assumed)
            if(dir.indexOf('.html')===-1 || dir.toLowerCase().lastIndexOf('.html')!==dir.length-'.html'.length){
              var scrollWrap=input.parents('.scroll:first');
              var filesUl=scrollWrap.children('ul.files:first');
              var duplicateDirs=filesUl.children('li.dir[path$="/'+dir+'"], li.dir[path$="/'+dir+'/"]');
              if(duplicateDirs.length<1){
                validDir=true;
              }else{
                errMsgWrap.html('Already exists, '+duplicateDirs.eq(0).attr('path'));
              }
            }else{
              errMsgWrap.html('Please exclude .html from the end of the directory name');
            }
          }else{
            errMsgWrap.html('Please exclude all illegal characters');
          }
        }else{
          errMsgWrap.html('Please exclude spaces from the directory name');
        }
      }else{
        errMsgWrap.html('Please exclude illegal characters from the directory name');
      }
    }else{
      errMsgWrap.html('Please type a directory name');
    }
    if(validDir){
      okBtn.removeClass('disabled');
    }else{
      okBtn.addClass('disabled');
    }
    return validDir;
  };
  //create the alert functionality and controls
  openBrowseAlert(box, 'New Folder', 'new-folder',
    '<p class="newPath"></p><input name="new-folder" class="new-folder" type="text" /><p class="msg"></p>', //alert body html
    function(alertWrap, cancelBtn, okBtn){ //when the alert loads for the first time
      var input=alertWrap.find('.alert-content .alert-body input.new-folder:first');
      input.keydown(function(e){
        switch(e.keyCode){
          case 13: //enter key
            e.preventDefault(); e.stopPropagation();
            okBtn.click();
            break;
          case 27: //esc key
            e.preventDefault(); e.stopPropagation();
            cancelBtn.click();
            break;
        }
      });
      input.keyup(function(e){
        validateFolder(jQuery(this), okBtn);
      });
    },
    function(alertWrap){ //when this alert is opened
      var newDirInput=alertWrap.find('.alert-content .alert-body input.new-folder:first');
      var browseWrap=alertWrap.parents('.box-col.browse:first');
      var navBarInput=browseWrap.find('.nav-bar input.path:first');
      var currentBrowsePath=sanitizeProjectBrowsePath(navBarInput[0]['currentBrowsePath']);
      var newPathP=alertWrap.find('.alert-content .alert-body .newPath:first');
      newPathP.html(currentBrowsePath);
      var msgWrap=alertWrap.find('.alert-content .alert-body .msg:first');
      msgWrap.html('');
      newDirInput.val(''); newDirInput.focus();
      var okBtn=alertWrap.find('.alert-content .alert-btns .alert-btn.ok:first');
      okBtn.addClass('disabled');
    },function(alertWrap){ //when this alert cancels

    },function(alertWrap){ //ok button action
      var input=alertWrap.find('.alert-content .alert-body input.new-folder:first');
      input.focus();
      var isValid=false;
      var okBtn=alertWrap.find('.alert-content .alert-btns .alert-btn.ok:first');
      if(validateFolder(input, okBtn)){
        //post to the server to create the new directory
        var newPathP=alertWrap.find('.alert-content .alert-body .newPath:first');
        var currentBrowsePath=sanitizeProjectBrowsePath(newPathP.html());
        browserMakeDirectory(currentBrowsePath,input.val(),function(data){
          if(data['status']==='ok'){
            var box=alertWrap.parents('.box:first');
            var openBtn=box.find('.box-btns .box-btn.open:first');
            //browse to the directory once it's created
            updateProjectBrowse(data['directory'],openBtn['okButtonAction']);
          }
        });
        isValid=true;
      }
      return isValid;
    }
  );
}
//reorder the recent projects listing depending on the order, or after items are removed
function reorderRecentProjects(scrollWrap, orderBy){
  if(scrollWrap.length>0){
    //function to check if this project has a unique file name
    var uniqueNames=[];
    var checkIfUniqueName=function(recentProjDiv){
      var nameEl=recentProjDiv.find('.pane .title .unique-name:first');
      var projName=nameEl.text();
      if(uniqueNames.indexOf(projName)!==-1){ recentProjDiv.addClass('duplicate-name'); }
      else{ uniqueNames.push(projName); }
    };
    //function to set the correct sequence number
    var divIndex=0, isAlt=false;
    var updateNumber=function(recentProjDiv){
      if(!recentProjDiv.hasClass('hide')){
        if(isAlt){
          isAlt=false; recentProjDiv.addClass('alt');
        }else{
          isAlt=true; recentProjDiv.removeClass('alt');
        }
        var numEl=recentProjDiv.find('.lbl .num:first');
        numEl.text((divIndex+1)+'');
        divIndex++;
      }
    };
    //reset no matches message
    scrollWrap.children('p.no-match.msg:last').remove();
    //if there are no recent projects
    var recentProjWrap=scrollWrap.parents('.box-col.recent-projects:first');
    var recentProjDivs=scrollWrap.children('.recent-project');
    if(recentProjDivs.length<1){
      //show the no recent projects message
      scrollWrap.html(noRecentProjectsHtml);
      //indicate with a class (allows space for filter controls)
      recentProjWrap.removeClass('has-projects').removeClass('show-filters');
    }else{
      //there are one or more recent projects...

      //indicate with a class (allows space for filter controls)
      recentProjWrap.addClass('has-projects');
      if(recentProjDivs.length>1){ recentProjWrap.addClass('show-filters'); }
      else{ recentProjWrap.removeClass('show-filters'); }
      //if no args to set a specific order
      if(orderBy==undefined){
        //for each recent project div
        recentProjDivs.each(function(){
          //make sure the numbering is correct for the existing order
          updateNumber(jQuery(this));
          //indicate duplicate name
          checkIfUniqueName(jQuery(this));
        });
      }else{
        //order by a specific set of rules, orderBy...
        var filter_search, order_by, asc_desc;
        if(orderBy.hasOwnProperty('filter_search')){
          filter_search=orderBy['filter_search']; filter_search=filter_search.trim();
          filter_search=filter_search.toLowerCase();
        }
        if(orderBy.hasOwnProperty('order_by')){
          order_by=orderBy['order_by']; order_by=order_by.trim();
        }
        if(orderBy.hasOwnProperty('asc_desc')){
          asc_desc=orderBy['asc_desc']; asc_desc=asc_desc.trim();
        }
        //if reordering
        if(order_by!=undefined){
          var box=scrollWrap.parents('.box:first');
          var rpData=box[0]['recentProjectsData'];
          //reorder the list depending on the in_order array
          var inOrderReorder=function(keyName){
            //loop the correct order for these ids
            for(var c=0;c<rpData['in_order'][keyName].length;c++){
              var id=rpData['in_order'][keyName][c];
              var rp=scrollWrap.children('#rp_'+id+':first');
              var dataPane=rp.find('.pane .data:first');
              dataPane.attr('name',keyName);
              dataPane.children('.data-part.active').removeClass('active');
              dataPane.children('.data-part[name="'+keyName+'"]:first').addClass('active');
              //asc
              if(asc_desc==='asc'){
                scrollWrap.append(rp);
              }else{
                //desc
                scrollWrap.prepend(rp);
              }
            }
            recentProjDivs=scrollWrap.children('.recent-project');
          };
          switch(order_by){
            case 'create': inOrderReorder('create'); break;
            case 'modify': inOrderReorder('modify'); break;
            case 'open': inOrderReorder('open'); break;
            case 'open_time_hours':
              //if the sorted order for open_time_hours has not already been established
              if(!rpData['in_order'].hasOwnProperty('open_time_hours')){
                //create the in_order list for open_time_hours
                var ids=[], sortedVals=[], mostHours=-1;
                recentProjDivs.each(function(){
                  var id=jQuery(this).attr('id');
                  id=id.substring(id.indexOf('_')+'_'.length);
                  var hoursEl=jQuery(this).find('.pane .data .data-part[name="open_time_hours"]:first').find('.val:last');
                  var fillBarEl=jQuery(this).find('.pane .data .data-part[name="open_time_hours"]:first').find('.time-bar .fill-bar:first');
                  var hours=hoursEl.text(); hours=parseFloat(hours);
                  fillBarEl.attr('name',hours+'');
                  if(hours>mostHours){ mostHours=hours; }
                  //insert the value into the sorted position
                  if(sortedVals.length<1){ sortedVals.push(hours); ids.push(id); }
                  else{
                    for(var n=0;n<sortedVals.length;n++){
                      if(hours<=sortedVals[n]){
                        //found correct position for the insert
                        sortedVals.splice(n, 0, hours);
                        ids.splice(n, 0, id); break;
                      }else if(n+1===sortedVals.length){
                        //found correct position for the insert
                        sortedVals.push(hours);
                        ids.push(id); break;
                      }
                    }
                  }
                });
                //set the sorted id's that match the correct open time
                box[0]['recentProjectsData']['in_order']['open_time_hours']=ids;
                if(mostHours>-1){
                  //set the bar width percentages
                  recentProjDivs.each(function(){
                    var fillBarEl=jQuery(this).find('.pane .data .data-part[name="open_time_hours"]:first').find('.time-bar .fill-bar:first');
                    var hours=fillBarEl.attr('name'); hours=parseFloat(hours);
                    fillBarEl.removeAttr('name');
                    var percent=hours/mostHours*100;
                    fillBarEl.css('width',percent+'%');
                  });
                }
              }
              inOrderReorder('open_time_hours');
              break;
          }
          //for each recent project div to reorder
        }
        //for each recent project div
        recentProjDivs.each(function(){
          //reset
          jQuery(this).removeClass('hide');
          //filter out projects that don't have the search string in their path
          if(filter_search!=undefined){
            if(filter_search.length>0){
              var titleEl=jQuery(this).find('.pane .title:first');
              var title=titleEl.attr('title'); title=title.trim(); title=title.toLowerCase();
              if(title.indexOf(filter_search)===-1){
                jQuery(this).addClass('hide');
              }
            }
          }
          //make sure the numbering is correct for the existing order
          updateNumber(jQuery(this));
          //indicate duplicate name
          checkIfUniqueName(jQuery(this));
        });
      }
    }
    //add no match message
    if(scrollWrap.children('.recent-project').length>0){
      if(scrollWrap.children('.recent-project').not('.hide').length<1){
        scrollWrap.append('<p class="no-match msg">No search results. Clear the search...</p>');
      }
    }
    //add last class
    scrollWrap.children('.recent-project.last').removeClass('last');
    scrollWrap.children('.recent-project').not('.hide').filter(':last').addClass('last');
    //if there any projects with duplicate listed file names
    if(scrollWrap.children('.recent-project.duplicate-name').length>0){
      //use unique names instead of duplicate names, by showing more of the file path
      scrollWrap.children('.recent-project.duplicate-name').each(function(){
        jQuery(this).removeClass('duplicate-name');
        //if not already updated this name
        if(!jQuery(this).hasClass('updated-name')){
          var nameEl=jQuery(this).find('.pane .title .unique-name:first');
          var name=nameEl.text();
          //find all name elements that contain this text
          var nameEls=scrollWrap.find('.recent-project .pane .title .unique-name:contains("'+name+'")');
          nameEls.each(function(){
            var thisName=jQuery(this).text();
            if(thisName===name){
              var titleEl=jQuery(this).parents('.title:first');
              var uniquePath=titleEl.attr('title'); jQuery(this).attr('name',uniquePath);
              jQuery(this).addClass('making-unique');
              titleEl.parents('.recent-project:first').addClass('updated-name');
            }
          });
          //update the text
          var updateNameEls=scrollWrap.find('.recent-project .pane .title .unique-name.making-unique');
          updateNameEls.each(function(){
            jQuery(this).removeClass('making-unique');
            var fullPath=jQuery(this).attr('name');
            fullPath=fullPath.split('/'); var uniqueEnd='';
            //keep adding to the path until it's unique
            for(var p=fullPath.length-1;p>-1;p--){
              uniqueEnd='/'+fullPath[p]+uniqueEnd;
              //if this ending part of the full path is unique
              if(updateNameEls.filter('[name$="'+uniqueEnd+'"]').length===1){
                jQuery(this).text(uniqueEnd); break;
              }
            }
          });
          updateNameEls.attr('name',''); updateNameEls.removeAttr('name');
        }
      });
      scrollWrap.children('.recent-project.updated-name').removeClass('updated-name');
    }
  }
};
//function to get the dynamic order items menu html
function addOrderByMenu(wrap, evts){
  var menu=wrap.children('.order-by-menu:last');
  if(menu.length<1){
    var recentW=wrap.parents('.box-col.recent-projects:first');
    var orderBar=recentW.find('.filter .order .bar:first');
    var orderIconBtn=orderBar.find('.order-btn .order-by-btn .order-icon:first');
    if(orderIconBtn.length>0){
      wrap.append('<div class="order-by-menu"><div class="close"></div></div>');
      menu=wrap.children('.order-by-menu:last');
      //close button
      var closeBtn=menu.children('.close:first');
      closeBtn.click(function(e){
        e.preventDefault(); e.stopPropagation();
        jQuery(this).parent().removeClass('open');
      });
      //for each menu option
      orderIconBtn.children('.icon').each(function(){
        //create the option's html
        var optionTitle=jQuery(this).attr('title'); if(optionTitle==undefined){optionTitle='';}
        var optionSvg=jQuery(this).html();
        var optionName=jQuery(this).attr('name');
        var activeClass=''; if(jQuery(this).hasClass('active')){ activeClass=' active'; }
        var html='';
        html+='<div class="option'+activeClass+'" name="'+optionName+'">'; //start option
        html+='<div class="ic">'; //start icon
        html+=optionSvg;
        html+='</div>'; //end icon
        html+='<div class="label">'; //start label
        html+=optionTitle;
        html+='</div>'; //end label
        html+='</div>'; //end option
        menu.append(html);
        //add events to the menu option
        var menuOption=menu.children('.option:last');
        menuOption.click(function(){
          if(!jQuery(this).hasClass('active')){
            //option active class
            jQuery(this).parent().children('.option.active').removeClass('active');
            jQuery(this).addClass('active');
            //button active class
            var selName=jQuery(this).attr('name');
            var rpW=jQuery(this).parents('.box-col.recent-projects:first');
            var icoWrap=rpW.find('.filter .order .bar:first').find('.order-btn .order-by-btn .order-icon:first');
            icoWrap.children('.icon.active').removeClass('active');
            icoWrap.children('.icon[name="'+selName+'"]:first').addClass('active');
            //additional click callback
            if(evts!=undefined){
              if(evts.hasOwnProperty('option')){
                if(evts['option'].hasOwnProperty('click')){
                  evts['option']['click'](jQuery(this));
                }
              }
            }
            //reorder the recent projects
            var j=getFilterOrderElems(rpW.find('.scroll:first'));
            var orderRules=getFilterOrderRules(j);
            reorderRecentProjects(j.scrollW, orderRules);
          }
        });
        if(evts!=undefined){
          if(evts.hasOwnProperty('option')){
            menuOption.hover(function(){
              if(evts['option'].hasOwnProperty('hover_on')){
                evts['option']['hover_on'](jQuery(this));
              }
            },function(){
              if(evts['option'].hasOwnProperty('hover_off')){
                evts['option']['hover_off'](jQuery(this));
              }
            });
          }
        }
      });
    }else{
      menu=undefined;
    }
  }
  return menu;
}
//function to gather up the elements that decide how to filter/order recent projects
function getFilterOrderElems(el){
  var recentW=el.parents('.box-col.recent-projects:first');
  var inp=recentW.find('.filter .search input.search-recent-project:first');
  var orderBar=recentW.find('.filter .order .bar:first');
  var orderIconBtn=orderBar.find('.order-btn .order-by-btn .order-icon:first');
  var ascDescBtn=orderBar.children('.asc-desc-btn:last');
  var scrollW=recentW.children('.scroll:last');
  return {
    recentW:recentW,
    inp:inp,
    scrollW:scrollW,
    orderIconBtn:orderIconBtn,
    ascDescBtn:ascDescBtn
  }
}
//function to create the recent project filter/order rules based on the element controls
function getFilterOrderRules(j){
  var activeOrderIcon=j.orderIconBtn.children('.icon.active:first');
  var activeOrderName=activeOrderIcon.attr('name');
  //asc/desc
  var asc_desc='asc';
  if(j.ascDescBtn.hasClass('desc')){
    asc_desc='desc';
  }
  //return
  return {
    filter_search:j.inp.val(),
    asc_desc:asc_desc,
    order_by:activeOrderName
  };
}
//add the events to nav-bar, project file explorer, open button controls
function initProjectBrowseEvents(box,okButtonAction){
  var browseWrap=box.find('.box-col.browse:first');
  if(!box.hasClass('evs')){
    //init browse events
    box.addClass('evs');
    var navBarInput=browseWrap.find('.nav-bar input.path:first');
    var upDirBtn=browseWrap.find('.up-dir-btn:last');
    var clearBtn=browseWrap.find('.nav-bar .reset-btn:last');
    var scrollWrap=browseWrap.find('.scroll:first');
    var openBtn=box.children('.box-btns:last').children('.box-btn.open:last');
    //function to get the next file li element to select when using the up/down arrow keys
    var getArrowNextItem=function(upDown){
      var nextLi;
      //if there is more than one item to toggle
      if(scrollWrap.find('ul.files li').not('.invalid').not('.current').length>1){
        //depending on moving up or down...
        var getNext=function(){}; var getEnd=function(){}; var getOtherEnd=function(){};
        switch(upDown){
          case 'up':
            getNext=function(el){return el.prev('li:first');};
            getEnd=function(){return scrollWrap.find('ul.files li').not('.invalid').not('.current').eq(0);};
            getOtherEnd=function(){return scrollWrap.find('ul.files li').not('.invalid').not('.current').filter(':last');};
            break;
          case 'down':
            getNext=function(el){return el.next('li:first');};
            getEnd=function(){return scrollWrap.find('ul.files li').not('.invalid').not('.current').filter(':last');};
            getOtherEnd=function(){return scrollWrap.find('ul.files li').not('.invalid').not('.current').eq(0);};
            break;
        }
        //get the selected item
        var selLi=scrollWrap.find('ul.files li.selected:first');
        //if no item is selected
        if(selLi.length<1){
          //get the end item by default
          selLi=getEnd();
        }
        //if there are any items at all
        if(selLi.length>0){
          //while not found a next non invalid li
          var continueSearch=true; nextLi=selLi;
          while(continueSearch){
            nextLi=getNext(nextLi);
            if(nextLi.length>0){
              //if item is not invalid
              if(!nextLi.hasClass('invalid') && !nextLi.hasClass('current')){
                //end search
                continueSearch=false;
              }
            }else{
              //no more items, reached end... loop back around to the other end
              nextLi=getOtherEnd();
              //if item at the other end is not invalid
              if(!nextLi.hasClass('invalid') && !nextLi.hasClass('current')){
                //end search
                continueSearch=false;
              }
            }
          }
        }
      }
      return nextLi;
    };
    //reset esc input text
    var resetNavBarInput=function(e){
      e.preventDefault(); e.stopPropagation();
      if(navBarInput[0].hasOwnProperty('currentBrowsePath')){
        //reset to the current directory
        var currentDirPath=navBarInput[0]['currentBrowsePath'];
        navBarInput.val(currentDirPath);
        navBarInput.removeClass('edit-path');
        //deselect selected files and update the open button enable state
        scrollWrap.find('ul.files li.selected').removeClass('selected');
        toggleBrowseOpenButton();
        navBarInput.focus();
      }
    };
    //keydown event
    navBarInput.keydown(function(e){
      //depending on which key pressed
      switch(e.keyCode){
        case 38: //up arrow
          e.preventDefault(); e.stopPropagation();
          var nextLi=getArrowNextItem('up'); selectBrowseFileLi(nextLi);
          break;
        case 40: //down arrow
          e.preventDefault(); e.stopPropagation();
          var nextLi=getArrowNextItem('down'); selectBrowseFileLi(nextLi);
          break;
        case 13: //enter key
          e.preventDefault(); e.stopPropagation();
          var newBrowsePath=sanitizeProjectBrowsePath(navBarInput.val());
          var doOpenFile=false;
          if(navBarInput[0].hasOwnProperty('currentBrowsePath')){
            var currentBrowsePath=sanitizeProjectBrowsePath(navBarInput[0]['currentBrowsePath']);
            if(currentBrowsePath===newBrowsePath){
              //if there is a selected file
              var selLi=scrollWrap.find('ul.files li.ok.file.selected:first');
              if(selLi.length>0){
                //if the selected file has this path that is in the nav bar
                if(selLi.attr('path')===currentBrowsePath){
                  if(!openBtn.hasClass('disabled')){
                    doOpenFile=true;
                  }
                }
              }
            }
          }
          //if open the project file
          if(doOpenFile){
            if(!openBtn.hasClass('disabled')){
              //open the project by hitting the enter key after the project file is already selected
              okButtonAction(openBtn);
            }
          }else{
            //don't open a project file, just navigate to a file/folder in the browse window
            navBarInput.val(newBrowsePath);
            updateProjectBrowse(newBrowsePath,okButtonAction);
          }
        break;
        case 9: //tab key
          e.preventDefault(); e.stopPropagation();
          var cursorIsAtEnd=function(){
            var isAtEnd=false;
            //if text NOT selected
            if(navBarInput[0].selectionStart===navBarInput[0].selectionEnd){
              var currentVal=navBarInput.val();
              //if the text length equals the caret position index
              if(currentVal.length===navBarInput[0].selectionStart){
                isAtEnd=true;
              }
            } return isAtEnd;
          };
          //if the cursor is at the end of the input text
          if(cursorIsAtEnd()){
            var completeThis=navBarInput.val();
            //if the shift key is held
            if(e.shiftKey){
              var upOneDir=completeThis;
              if(upOneDir.lastIndexOf('/')===upOneDir.length-'/'.length){
                upOneDir=upOneDir.substring(0,upOneDir.length-'/'.length);
              }
              if(upOneDir.indexOf('/')!==-1){
                upOneDir=upOneDir.substring(0, upOneDir.lastIndexOf('/') + '/'.length);
              }
              //if there is any change
              if(upOneDir!==completeThis){
                //set the new path (up one directory)
                navBarInput.val(upOneDir);
              }
            }else{
              //shift key NOT held along with the tab key...
              autocompleteProjectPath(completeThis, function(data){
                if(data.status==='ok'){
                  if(data.commonContinue.length>0){
                    navBarInput.val(completeThis + data.commonContinue);
                  }else{
                    //there are either no autocomplete options... or more than one...

                    //if there are no autocomplete options
                    if((data.file_complete.length + data.dir_complete.length)<1){
                      navBarInput.addClass('err-path');
                      setTimeout(function(){
                        navBarInput.removeClass('err-path');
                      },180);
                    }else{
                      //there is more than one autocomplete option...
                    }
                  }
                }
              });
            }
          }else{
            //cursor NOT at the end of the input text... deny autocomplete
            navBarInput.addClass('err-path');
            setTimeout(function(){
              navBarInput.removeClass('err-path');
            },180);
          }
        break;
        case 27: //esc key
          resetNavBarInput(e);
        break;
      }
    });
    navBarInput.keyup(function(e){
      //decide if the nav bar should show modification highlight
      toggleNavBarEditClass(jQuery(this));
      //decide if the open button should be enabled or not
      toggleBrowseOpenButton();
    });
    navBarInput.blur(function(){
      var current=jQuery(this).val();
      if(current.trim().length<1){
        if(jQuery(this)[0].hasOwnProperty('currentBrowsePath')){
          //reset to the current directory
          var currentDirPath=jQuery(this)[0]['currentBrowsePath'];
          jQuery(this).val(currentDirPath);
          jQuery(this).removeClass('edit-path');
        }
      }
      //decide if the open button should be enabled or not
      toggleBrowseOpenButton();
    });
    clearBtn.click(function(e){
      resetNavBarInput(e);
    });
    upDirBtn.click(function(e){
      var input=jQuery(this).parent().children('input.path:first');
      if(input[0].hasOwnProperty('currentBrowsePath')){
        //reset to the current directory
        var currentDirPath=input[0]['currentBrowsePath'];
        input.val(currentDirPath);
        input.removeClass('edit-path');
        if(currentDirPath.lastIndexOf('/')===currentDirPath.length-'/'.length){
          currentDirPath=currentDirPath.substring(0, currentDirPath.length-'/'.length);
        }
        if(currentDirPath.indexOf('/')!==-1){
          if(currentDirPath.length>'/'.length){
            var upDirPath=currentDirPath.substring(0, currentDirPath.lastIndexOf('/'));
            updateProjectBrowse(upDirPath,okButtonAction);
          }
        }
      }
      //decide if the open button should be enabled or not
      toggleBrowseOpenButton();
    });
    openBtn['okButtonAction']=okButtonAction;
    openBtn.click(function(e){
      var ret=true;
      if(jQuery(this).hasClass('disabled')){
        e.preventDefault();
        ret=false;
      }else{
        //if the ok button is not an a link (the a link will follow a url and doesn't need to fire the action)
        if(jQuery(this)[0].tagName.toLowerCase()!=='a'){
          //fire the action event
          okButtonAction(jQuery(this));
        }
      } return ret;
    });
    //if this file explorer is in new-file mode
    var browseModeKey=browseWrap.attr('mode');
    switch(browseModeKey){
      case 'new':
        var editBtnsWrap=browseWrap.children('.edit-btns:first');
        var deleteBtn=editBtnsWrap.children('.edit-btn.delete:first');
        var newDirBtn=editBtnsWrap.children('.edit-btn.new-folder:first');
        var newFileInput=editBtnsWrap.find('.edit-input .input input:first');
        //edit folder structure - button events
        deleteBtn.click(function(e){
          if(!jQuery(this).hasClass('disabled')){
            //alert "are you sure delete"
            deleteFileOrFolderAlert(box);
          }
        });
        newDirBtn.click(function(e){
          if(!jQuery(this).hasClass('disabled')){
            //create new folder
            openNewFolderInput(box);
          }
        });
        //new file input events
        newFileInput.blur(function(e){
          //decide if the open button should be enabled or not
          toggleBrowseOpenButton();
        });
        newFileInput.keyup(function(e){
          //decide if the open button should be enabled or not
          toggleBrowseOpenButton();
        });
        newFileInput.keydown(function(e){
          //depending on which key pressed
          switch(e.keyCode){
            case 38: //up arrow
              e.preventDefault(); e.stopPropagation();
              var nextLi=getArrowNextItem('up'); selectBrowseFileLi(nextLi);
              break;
            case 40: //down arrow
              e.preventDefault(); e.stopPropagation();
              var nextLi=getArrowNextItem('down'); selectBrowseFileLi(nextLi);
              break;
            case 13: //enter key
              e.preventDefault(); e.stopPropagation();
              var stat=validateNewProjectNameDialog();
              if(stat['status']==='ok'){
                //fire the action event
                okButtonAction(openBtn);
              }else{
                //show the problem status
                var statMsgWrap=editBtnsWrap.find('.edit-input .status-msg:first');
                statMsgWrap.addClass('show');
              }
              break;
            case 27: //esc key
              e.preventDefault(); e.stopPropagation();
              jQuery(this).val('');
              break;
          }
        });
        break;
      case 'open':
        var removeBtn=box.find('.box-btns .box-btn.remove-recent:first');
        //remove recent project button click event
        removeBtn.click(function(){
          if(!jQuery(this).hasClass('disabled')){
            var recentScrollWrap=jQuery(this).parents('.box:first').find('.box-content .box-col.recent-projects .scroll:first');
            if(recentScrollWrap.length>0){
              var removePaths=[];
              recentScrollWrap.children('.recent-project.selected').each(function(){
                var removePath=jQuery(this).find('.pane .title:first').attr('title');
                removePaths.push(removePath);
              });
              if(removePaths.length>0){
                //remove the list of selected projects from recent_projects.json
                removeRecentProjectData(removePaths, function(data){
                  if(data['status']==='ok'){
                    //no remove these projects from the UI
                    recentScrollWrap.children('.recent-project.selected').each(function(){
                      var removePath=jQuery(this).find('.pane .title:first').attr('title');
                      //if this path was removed from the .json
                      if(data['paths'].indexOf(removePath)!==-1){
                        jQuery(this).addClass('remove-this');
                      }
                    });
                    //remove from recent projects from the ui
                    recentScrollWrap.children('.remove-this').remove();
                    //update the numbering
                    var j=getFilterOrderElems(recentScrollWrap);
                    var orderRules=getFilterOrderRules(j);
                    reorderRecentProjects(j.scrollW, orderRules);
                  }
                });
              }
            }
          }
        });
        //get elements from the recent projects filter
        var filterWrap=box.find('.recent-projects .filter:first');
        var searchWrap=filterWrap.children('.search:first');
        var orderWrap=filterWrap.children('.order:first');
        var searchInput=searchWrap.find('.bar input.search-recent-project:first');
        var searchClearBtn=searchWrap.children('.reset-btn:last');
        var orderClearBtn=orderWrap.children('.reset-btn:last');
        var searchBtn=searchWrap.find('.bar .icon-btn:first');
        var orderIconBtn=orderWrap.find('.bar .icon-btn:first');
        var orderBtn=orderWrap.find('.bar .order-btn:first');
        var selectedOrderIcons=orderBtn.find('.order-by-btn .order-icon:first');
        var ascDescBtn=orderWrap.find('.bar .asc-desc-btn:first');
        var ascBtn=ascDescBtn.children('.asc:first');
        var descBtn=ascDescBtn.children('.desc:first');
        //add some svg button images
        searchBtn.html(svgSearch); orderIconBtn.html(svgOrder); ascBtn.html(svgAscend); descBtn.html(svgDescend);
        selectedOrderIcons.children('.icon[name="create"]:first').html(svgCreate);
        selectedOrderIcons.children('.icon[name="modify"]:first').html(svgEdit);
        selectedOrderIcons.children('.icon[name="open"]:last').html(svgOpen);
        selectedOrderIcons.children('.icon[name="open_time_hours"]:last').html(svgTime);
        //init events for the recent projects filter
        ascDescBtn.click(function(){
          var j=getFilterOrderElems(jQuery(this));
          if(j.ascDescBtn.hasClass('asc')){
            j.ascDescBtn.removeClass('asc');
            j.ascDescBtn.addClass('desc');
          }else{
            j.ascDescBtn.addClass('asc');
            j.ascDescBtn.removeClass('desc');
          }
          var orderRules=getFilterOrderRules(j);
          reorderRecentProjects(j.scrollW, orderRules);
        });
        orderBtn.click(function(){
          if(!jQuery(this).parents('.order:first').children('.reset-btn:last').hasClass('click')){
            var orderMenu=addOrderByMenu(jQuery(this).find('.order-by-btn .order-icon:first'));
            if(orderMenu.hasClass('open')){
              setTimeout(function(){
                orderMenu.removeClass('open');
              },150);
            }else{
              orderMenu.addClass('open');
            }
          }
        });
        orderClearBtn.click(function(e){
          e.preventDefault(); e.stopPropagation();
          jQuery(this).addClass('click');
          var clrBtn=jQuery(this);
          setTimeout(function(){
            clrBtn.removeClass('click');
          },300);
          var bar=jQuery(this).parent().children('.bar:first');
          var order=bar.find('.order-btn .order-by-btn .order-icon:first');
          var defaultOrderIco=order.children('.icon.default:first');
          if(defaultOrderIco.length>0){
            var defaultOrderName=defaultOrderIco.attr('name');
            addOrderByMenu(order);
            order.find('.order-by-menu .option[name="'+defaultOrderName+'"]:first').click();
          }
          var adBtn=bar.children('.asc-desc-btn:first');
          var defAdBtn=adBtn.children('.default:first');
          if(defAdBtn.length>0){
            if(defAdBtn.hasClass('desc')){
              adBtn.removeClass('asc').addClass('desc');
            }else{
              adBtn.removeClass('desc').addClass('asc');
            }
          }
        });
        searchClearBtn.click(function(){
          var j=getFilterOrderElems(jQuery(this));
          j.inp.val(''); j.inp.focus();
          var orderRules=getFilterOrderRules(j);
          reorderRecentProjects(j.scrollW, orderRules);
        });
        searchBtn.click(function(){
          var j=getFilterOrderElems(jQuery(this));
          j.inp.focus();
          var orderRules=getFilterOrderRules(j);
          reorderRecentProjects(j.scrollW, orderRules);
        });
        searchInput.keydown(function(e){
          switch(e.keyCode){
            case 13: //enter key
              e.preventDefault(); e.stopPropagation();
              searchBtn.click();
              break;
            case 27: //esc key
              e.preventDefault(); e.stopPropagation();
              searchClearBtn.click();
              break;
          }
        });
        break;
    }
  }
  //if this file explorer is in new-file mode
  if(browseWrap.attr('mode')==='new'){
    var editBtnsWrap=browseWrap.children('.edit-btns:first');
    var newFileInput=editBtnsWrap.find('.edit-input .input input:first');
    //clear any existing file name
    newFileInput.val('');
  }
}
//open project browse dialog box
function openProjectBrowse(){
  //get the open project browse box
  var box=jQuery('body section#lightbox #open-project:first');
  //define the ok button action, what should happen when you click ok
  var okButtonAction=function(openBtn){
    var url=openBtn.attr('href');
    document.location.href=url;
  };
  //init the project explorer controls, if not already init
  initProjectBrowseEvents(box,okButtonAction);
  //open the project browse lightbox
  openLightBox('open-project',function(box){
    //update the project browse items
    updateProjectBrowse('',okButtonAction);
  });
}
//open either the save as or new project dialog box
function browseEditDialog(dialogId){
  //get the open project browse box
  var box=jQuery('body section#lightbox #'+dialogId+':first');
  //define the ok button action, what should happen when you click ok
  var okButtonAction=function(openBtn){
    var boxWrap=openBtn.parents('.box:first');
    var inputProjName=boxWrap.find('.box-content .box-col.browse .edit-btns .edit-input .input input.project-file-name:first');
    var newProjName=sanitizeProjectBrowsePath(inputProjName.val());
    if(newProjName.length>0){
      newProjName+='.html';
      var navBarInput=boxWrap.find('.box-content .box-col.browse .nav-bar input.path:first');
      if(navBarInput[0].hasOwnProperty('currentBrowsePath')){
        var currentBrowsePath=sanitizeProjectBrowsePath(navBarInput[0]['currentBrowsePath']);
        //if this is ok button for save-as action
        var createFrom, createData;
        if(dialogId==='saveas-project'){
          //if a saved project file is in the qs file path (if not a new unsaved project)
          var qs=getQs();
          if(qs.hasOwnProperty('file')){
            //get the path to save-as from
            var temLi=getTemplateTabLi();
            createFrom=getElemPath(temLi);
          //if this is probably a new unsaved file
          }else if(qs.hasOwnProperty('dir')){
            //get the unsaved data for this project's tabs
            createData=getUnsavedTabChangesData();
          }
        }
        //create the new project with a request to the server
        createNewProject(currentBrowsePath, newProjName, function(data){
          //done creating the new file
          if(data['status']==='ok'){
            //open the new project
            document.location.href=data['url'];
          }else{
            //show error message for the attempt to create the new project
            errMsgAlert(boxWrap,'project-create-fail-alert',data['status']);
          }
        },createFrom,createData);
      }
    }
  };
  //init the project explorer controls, if not already init
  initProjectBrowseEvents(box,okButtonAction);
  //open the project browse lightbox
  openLightBox(dialogId,function(box){
    //update the project browse items
    updateProjectBrowse('',okButtonAction);
  });
}
//open the save as dialog box
function saveAsProjectBrowse(){
  browseEditDialog('saveas-project');
}
//open NEW project dialog box
function newProjectBrowse(){
  browseEditDialog('new-project');
}
