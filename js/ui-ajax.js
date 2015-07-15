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

                });
                iframe.load(function(){
                  //callback function (if any provided)
                  if(callback!=undefined){ callback(iframe[0]); }
                });
              }
            }
            bodyElem.removeClass('loading-preview-iframe');
          }else{
            //returned errors...
            //*** display json.status
          }
        }
      }
      xmlhttp.open("GET","/preview-index-exists",true);
      xmlhttp.send();
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
      }else{
        //returned errors...
        //*** display json.status
      }
    }
  }
  xmlhttp.open("GET","/open-project",true);
  xmlhttp.send();
}
function saveProject(){
  //if there are any project changes
  var bodyElem=jQuery('body:first');
  if(bodyElem.hasClass('has-changes')){
    bodyElem.removeClass('has-changes');
    //build the save data
    var saveData={files:{}};
    var contentWrap=jQuery('#file-content:first');
    //each tab that has changes
    jQuery('nav#tabs ul li.has-changes[path]').each(function(){
      var li=jQuery(this); li.removeClass('has-changes');
      var path=li.attr('path');
      //get the codemirror object
      var cDiv=contentWrap.children('div.content-wrap[path="'+path+'"]:first');
      var cm=cDiv[0]['codeMirror'];
      if(cm!=undefined){
        //set the json values for the changes
        if(li.hasClass('template')){ path='_.html'; }
        saveData['files'][path]={};
        saveData['files'][path]['content']=cm['object']['doc'].getValue();
      }
    });
    // construct an HTTP request
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/save-project', true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    xhr.onloadend=function(res){
      //if the server responded with ok status
      var res=JSON.parse(this.responseText);
      if(res.status==='ok'){
        //if any tab content was saved
        if(res.count>0){
          //refresh preview window, if open
          refreshPreviewWindow();
        }
      }
    };
    // send the collected data as JSON
    xhr.send(JSON.stringify(saveData));
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
    };
    if(requestedPath==undefined){
      requestedPath='';
    }
    var send={path:requestedPath};
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
function createNewProject(path, file, callback, fromFile){
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
