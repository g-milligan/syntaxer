var noRecentProjectsHtml;
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
                      //set initial order and unique project names, etc...
                      var j=getFilterOrderElems(scrollWrap);
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
      //populate the recent projects, if not already populated
      updateRecentProjectListing();
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
    var clearBtn=browseWrap.find('.nav-bar .reset-btn:last');
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
          resetNavBarInput(e);
    clearBtn.click(function(e){
      resetNavBarInput(e);
    });
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
          var orderMenu=addOrderByMenu(jQuery(this).find('.order-by-btn .order-icon:first'));
          if(orderMenu.hasClass('open')){
            setTimeout(function(){
              orderMenu.removeClass('open');
            },150);
          }else{
            orderMenu.addClass('open');
          }
        });
        orderClearBtn.click(function(){
          //***
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