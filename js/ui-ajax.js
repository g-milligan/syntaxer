function loadPreviewIFrame(callback){
  //if the preview index iframe hasn't already been created
  var bodyElem=jQuery('body:first');
  var iframe=bodyElem.children('iframe#preview-index-iframe:first');
  if(iframe.length<1){
    //if not already in the process of loading the preview iframe
    if(!bodyElem.hasClass('loading-preview-iframe')){
      bodyElem.addClass('loading-preview-iframe');
      //ping the file to see if it's there
      var xmlhttp = new XMLHttpRequest();
      xmlhttp.onreadystatechange=function(){
        if (xmlhttp.readyState==4 && xmlhttp.status==200){
          var str=xmlhttp.responseText;
          var json=JSON.parse(str);
          //if no errors
          if(json.status==='ok'){
            if(json.hasOwnProperty('exists')){
              //if the /preview/index.html file exists
              if(json['exists']){
                //prepend the iframe to the stage
                bodyElem.prepend('<iframe id="preview-index-iframe" src="'+json['href']+'"></iframe>');
                var iframe=bodyElem.children('iframe#preview-index-iframe:first');
                iframe.error(function(){
                  oops('The preview-index-iframe, used to provide access to autocomplete data elements, failed to load.');
                });
                iframe.load(function(){
                  //callback function (if any provided)
                  if(callback!=undefined){ callback(iframe[0]); }
                });
              }
            }
            bodyElem.removeClass('loading-preview-iframe');
          }else{
            //returned errors... show error message
            oops(json['status']);
          }
        }
      }
      //send post
      xmlhttp.open("GET","/preview-index-exists",true);
      xmlhttp.send();
    }
  }
}
//update the estimated amount of time this project has been open
function updateProjectTimeOpen(callback){
  //if the preview index iframe hasn't already been created
  var bodyElem=jQuery('body:first');
  var open_time=bodyElem.attr('open_time'); if(open_time==undefined){ open_time=''; }
  if(open_time.length>0){
    var temLi=getTemplateTabLi();
    if(temLi.length>0){
      var path=temLi.attr('path'); if(path==undefined){path='';}
      if(path.length>0){
        // construct an HTTP request
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/update-project-time-open', true);
        xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
        xhr.onloadend=function(res){
          //if the server responded with ok status
          var res=JSON.parse(this.responseText);
          if(res.status==='ok'){
            if(res.hasOwnProperty('open_time')){
              //set the updated open time
              var bodyElem=jQuery('body:first');
              bodyElem.attr('open_time', res['open_time']);
              //callback, if any
              if(callback!=undefined){
                callback(res);
              }
            }
          }else{
            //returned errors... show error message
            oops(res['status']);
          }
        }
        //save the current order/filter rule state for recent projects
        var j=getFilterOrderElems(bodyElem.find('#lightbox #open-project .box-content .recent-projects .scroll:first'));
        var orderRules=getFilterOrderRules(j);
        // send the collected data as JSON
        var send={path:path, open_time:open_time, ui_project_list:orderRules};
        xhr.send(JSON.stringify(send));
      }
    }
  }
}
function openProjectFile(){
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange=function(){
    if (xmlhttp.readyState==4 && xmlhttp.status==200){
      clearProject();
      var str=xmlhttp.responseText;
      var json=JSON.parse(str);
      //if no errors
      if(json.status==='ok'){
        //for each project embedded "file"
        if(json.hasOwnProperty('files')){
          for(path in json.files){
            if(json.files.hasOwnProperty(path)){
              var fileJson=json.files[path];
              if(fileJson.hasOwnProperty('content')){
                if(fileJson.hasOwnProperty('path')){
                  var isTemplateFile=false;
                  if(path==='_.html'){isTemplateFile=true;}
                  //add the project file tab to the UI
                  addFileTab(fileJson.path,fileJson.content,isTemplateFile);
                }
              }
            }
          }
        }
        //mark the time that the project was opened
        var bodyEl=jQuery('body:first');
        if(json.hasOwnProperty('open_time')){
          bodyEl.attr('open_time', json['open_time']);
        }
        //mark the type of the project, if one is set
        if(json.hasOwnProperty('type')){
          bodyEl.attr('project_type', json['type']);
        }else{
          bodyEl.attr('project_type', 'unknown');
        }
      }else{
        //returned errors... show error message
        oops(json['status']);
      }
    }
  }
  xmlhttp.open("GET","/open-project",true);
  xmlhttp.send();
}
//remove an array of project paths (and related data) from recent_projects.json
function removeRecentProjectData(paths, callback){
  if(paths!=undefined && paths.length>0){
    // construct an HTTP request
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/remove-recent-project-data', true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    xhr.onloadend=function(res){
      //if the server responded with ok status
      var res=JSON.parse(this.responseText);
      if(res.status==='ok'){
        //callback, if any
        if(callback!=undefined){
          callback(res);
        }
      }
    }
    // send the collected data as JSON
    var send={paths:paths};
    xhr.send(JSON.stringify(send));
  }
}
//save/update the preview
function saveProject(callback){
  var qs=getQs();
  if(qs.hasOwnProperty('file')){
    //if there are any project changes
    var bodyElem=jQuery('body:first');
    if(bodyElem.hasClass('has-changes')){
      //get the unsaved data that needs saving
      var saveData=getUnsavedTabChangesData();
      // construct an HTTP request
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/save-project', true);
      xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
      xhr.onloadend=function(res){
        //if the server responded with ok status
        var res=JSON.parse(this.responseText);
        if(res.status==='ok'){
          //if any tab content was saved
          if(res.modified>0 || res.added>0 || res.removed>0 || res.renamed>0){
            //refresh preview window, if open
            refreshPreviewWindow();
            //remove unsaved marker classes
            clearUnsavedTabChanges();
            //if there is a callback function
            if(callback!=undefined){
              callback(res);
            }
          }
        }else{
          //returned errors... show error message
          oops(res['status']);
        }
      };
      // send the collected data as JSON
      xhr.send(JSON.stringify(saveData));
    }
  }else{
    //the file value isn't in the URL's query string...

    //if the dir value is in the URL's query string
    if(qs.hasOwnProperty('dir')){
      //this is probably a new un-saved project, so do save-as instead of save
      saveAsProjectBrowse();
    }
  }
}
//commit the preview changes to the project file (real save)
function packProject(callback){
  var qs=getQs();
  if(qs.hasOwnProperty('file')){
    var bodyElem=jQuery('body:first');
    //function to pack up the project file with the new changes
    var doPack=function(){
      if(jQuery('body:first').hasClass('pending-pack')){
        //if there is a template path
        var temLi=getTemplateTabLi(); var temPath=temLi.attr('path');
        if(temPath!=undefined && temPath.length>0){
          // construct an HTTP request
          var xhr = new XMLHttpRequest();
          xhr.open('POST', '/pack-project', true);
          xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
          xhr.onloadend=function(res){
            //if the server responded with ok status
            var res=JSON.parse(this.responseText);
            if(res.status==='ok'){
              jQuery('body:first').removeClass('pending-pack');
              //flash success message
              showNote({
                id:'project-packed',
                content:'Project packed <br />'+res['path']
              });
              //if there is a callback function
              if(callback!=undefined){
                callback(res);
              }
            }else{
              //show error message
              oops(res['status']);
            }
          };
          // send the collected data as JSON
          var sendData={path:temPath};
          xhr.send(JSON.stringify(sendData));
        }
      }else{
        //flash message
        showNote({
          id:'project-packed',
          content:'Already packed... no new changes'
        });
      }
    };
    //if there are any project changes (not yet saved to the preview)
    if(bodyElem.hasClass('has-changes')){
      //make sure the preview is updated, before packing changes into the project
      saveProject(doPack);
    }else{
      //no changed that haven't already been saved to the preview...
      doPack();
    }
  }else{
    //the file value isn't in the URL's query string...

    //if the dir value is in the URL's query string
    if(qs.hasOwnProperty('dir')){
      //this is probably a new un-saved project, so do save-as instead of save
      saveAsProjectBrowse();
    }
  }
}
//request the file system folders and files for the current directory
function requestProjectFiles(callback,requestedPath){
  if(callback!=undefined){
    // construct an HTTP request
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/browse-project-files', true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    xhr.onloadend=function(res){
      //if the server responded with ok status
      var res=JSON.parse(this.responseText);
      callback(res);
      //show error message if something went wrong
      if(res['status']!=='ok'){
        oops(res['status']);
      }
    };
    if(requestedPath==undefined){
      requestedPath='';
    }
    var send={path:requestedPath};
    // send the collected data as JSON
    xhr.send(JSON.stringify(send));
  }
}
//request the recent projects json data
function requestRecentProjectsData(callback){
  if(callback!=undefined){
    // construct an HTTP request
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/request-recent-projects-data', true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    xhr.onloadend=function(res){
      //if the server responded with ok status
      var res=JSON.parse(this.responseText);
      callback(res);
    };
    var send={};
    // send the collected data as JSON
    xhr.send(JSON.stringify(send));
  }
}
//try to autocomplete a project path based on file system
function autocompleteProjectPath(path, callback){
  if(path!=undefined){
    if(callback!=undefined){
      // construct an HTTP request
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/autocomplete-project-path', true);
      xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
      xhr.onloadend=function(res){
        //if the server responded with ok status
        var res=JSON.parse(this.responseText);
        callback(res);
      };
      var send={path:path};
      // send the collected data as JSON
      xhr.send(JSON.stringify(send));
    }
  }
}
//create a new project
function createNewProject(path, file, callback, fromFile, createData){
  if(callback!=undefined){
    if(file!=undefined){
      if(path!=undefined){
        path=path.trim(); file=file.trim();
        if(path.length>0 && file.length>0){
          // construct an HTTP request
          var xhr = new XMLHttpRequest();
          xhr.open('POST', '/create-new-project', true);
          xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
          xhr.onloadend=function(res){
            //if the server responded with ok status
            var res=JSON.parse(this.responseText);
            callback(res);
          };
          var send={path:path,file:file};
          if(fromFile!=undefined){
            send['fromFile']=fromFile;
          }else{
            send['createData']=createData;
          }
          // send the collected data as JSON
          xhr.send(JSON.stringify(send));
        }
      }
    }
  }
}
//try to autocomplete a project path based on file system
function browserMakeDirectory(path, mkdir, callback){
  if(callback!=undefined){
    if(mkdir!=undefined){
      if(path!=undefined){
        path=path.trim(); mkdir=mkdir.trim();
        if(path.length>0 && mkdir.length>0){
          // construct an HTTP request
          var xhr = new XMLHttpRequest();
          xhr.open('POST', '/make-directory', true);
          xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
          xhr.onloadend=function(res){
            //if the server responded with ok status
            var res=JSON.parse(this.responseText);
            callback(res);
          };
          var send={path:path,mkdir:mkdir};
          // send the collected data as JSON
          xhr.send(JSON.stringify(send));
        }
      }
    }
  }
}
//check to see if deleting a given path is allowed
function browserIsAllowedDelete(path, callback){
  if(callback!=undefined){
    if(path!=undefined){
      path=path.trim();
      if(path.length>0){
        // construct an HTTP request
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/is-allowed-delete', true);
        xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
        xhr.onloadend=function(res){
          //if the server responded with ok status
          var res=JSON.parse(this.responseText);
          callback(res);
        };
        var send={path:path};
        // send the collected data as JSON
        xhr.send(JSON.stringify(send));
      }
    }
  }
}
//delete a file or folder if it can be deleted
function browserDeleteFileOrFolder(path, callback){
  if(callback!=undefined){
    if(path!=undefined){
      path=path.trim();
      if(path.length>0){
        // construct an HTTP request
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/delete-file-or-folder', true);
        xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
        xhr.onloadend=function(res){
          //if the server responded with ok status
          var res=JSON.parse(this.responseText);
          callback(res);
        };
        var send={path:path};
        // send the collected data as JSON
        xhr.send(JSON.stringify(send));
      }
    }
  }
}
//get snippet data
function requestSnippetsData(args, callback){
  if(args!=undefined){
    var send={};
    //type/path/ext correspond to the three dropdowns that filter snippet menu data
    if(args.hasOwnProperty('type')){ send['type']=args['type']; } //eg: webgl
    if(args.hasOwnProperty('path')){ send['path']=args['path']; } //eg: js/main.xml
    if(args.hasOwnProperty('ext')){ send['ext']=args['ext']; } //eg: .*, .js, .frag
    // construct an HTTP request
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/request-snippets-data', true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    xhr.onloadend=function(res){
      //if the server responded with ok status
      var res=JSON.parse(this.responseText);
      if(callback!=undefined){
        callback(res);
      }
    };
    // send the collected data as JSON
    xhr.send(JSON.stringify(send));
  }
}
