var svgDir='<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512"><path d="M357.84 398.577l61.104-162.945h-264.784l-61.104 162.945zM133.792 215.264l-40.736 183.312v-264.784h91.655l40.736 40.736h132.393v40.736z"></path></svg>';
var svgFile='<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 384 512"><path d="M161.448 215.264l-50.92 50.92 50.92 50.92 20.368-20.368-30.552-30.552 30.552-30.552-20.368-20.368zM202.184 235.632l30.552 30.552-30.552 30.552 20.368 20.368 50.92-50.92-50.92-50.92-20.368 20.368zM253.104 113.424h-183.312v285.152h244.417v-224.048l-61.104-61.104zM293.84 378.209h-203.68v-244.417h142.577l61.104 61.104v183.312z"></path></svg>';

//gets a query string json from the url
function getQs(){
  var qs={};
  var fromUrl=document.location.href;
  if(fromUrl.indexOf('?')!==-1){
    fromUrl=fromUrl.substring(fromUrl.indexOf('?')+'?'.length);
    var qsArray=fromUrl.split('&');
    for(var q=0;q<qsArray.length;q++){
      var qsStr=qsArray[q];
      var keyVal=qsStr.split('=');
      if(keyVal.length>1){
        var key=keyVal[0].trim();
        var val=keyVal[1].trim();
        qs[key]=val;
      }
    }
  } return qs;
}
function getActiveTabLi(){
  return jQuery('#tabs:first').children('ul:first').children('li.active[path]:first');
}
function getTemplateTabLi(){
  return jQuery('#tabs:first').children('ul:first').children('li.template:first');
}
function getElemPath(arg){
  var path;
  if(arg!=undefined){
    if(typeof arg==='string'){
      path=arg;
      if(path!=='.'){
        //make sure this is a real path and not just a random string
        if(jQuery('#tabs > ul > li[path="'+path+'"]:first').length<1){path=undefined;}
      }else{
        //get the current active for '.'
        var li=getActiveTabLi();
        path=li.attr('path');
        if(path!=undefined){
          path=path.trim();
          if(path.length<1){path=undefined;}
        }
      }
    }else if(arg.attr){
      //if this element doesn't have a path attribute
      path=arg.attr('path');
      if(path==undefined){path='';}
      if(path.length<1){
        //if a parent element has a path attribute
        var parent=arg.parents('[path]:first');
        if(parent.length>0){
          path=parent.attr('path');
        }else{
          //no path associated with this element
          path=undefined;
        }
      }
    }
  }
  return path;
}
function getPathName(which){
  var name;
  var path=getElemPath(which);
  if(path!=undefined){
    name=path;
    if(name.indexOf('/')!==-1){
      name=name.substring(name.lastIndexOf('/')+'/'.length);
    }
  }
  return name;
}
function getEditorDiv(which){
  var div;
  var path=getElemPath(which);
  if(path!=undefined){
    div=jQuery('#file-content:first').children('div[path="'+path+'"]:first');
    if(div.length<1){
      div=undefined;
    }
  }
  return div;
}
function getCodeMirrorObj(which){
  var cm;
  //if there is a codemirror object for this
  var div=getEditorDiv(which);
  if(div!=undefined){
    if(div[0].hasOwnProperty('codeMirror')){
      cm=div[0]['codeMirror'];
    }
  }
  return cm;
}
function getPathExt(which){
  var ext;
  var path=getElemPath(which);
  if(path!=undefined){
    ext=path;
    if(ext.indexOf('.')!==-1){
      ext=ext.substring(ext.lastIndexOf('.')+'.'.length);
    } ext=ext.toLowerCase(); ext=ext.trim();
    if(ext==='html'){
      var tabLi=getTabLi(path);
      if(tabLi.hasClass('template')){
        ext='template';
      }
    }
  }
  return ext;
}
function getTabLi(which){
  var li;
  var path=getElemPath(which);
  if(path!=undefined){
    li=jQuery('#tabs:first').children('ul:first').children('li[path="'+path+'"]:first');
    if(li.length<1){
      li=undefined;
    }
  }
  return li;
}
//get the current editor code for a tab
function getFileContent(which){
  var content;
  var div=getEditorDiv(which);
  if(div!=undefined){
    //if the code mirror editor is initialized for this div
    if(div[0].hasOwnProperty('codeMirror')){
      content=div[0]['codeMirror']['object'].getValue();
    }else{
      //code mirror not initialized, so just get the content from the textarea
      var ta=div.children('textarea.raw:first');
      if(ta.length>0){
        content=ta.val();
      }
    }
  }
  return content;
}
//get the ordered file contents (from the editor)
function getFileContents(json){
  var data=[];
  var temLi=getTemplateTabLi();
  if(temLi.length>0){
    var temPath=getElemPath(temLi);
    if(temPath!=undefined){
      //function to make sure a file contains one or more strings
      var hasSome=function(cont){
        var include=false;
        if(json.hasOwnProperty('has_some') && json.has_some.length>0){
          if(cont!=undefined){
            for(var c=0;c<json.has_some.length;c++){
              if(cont.indexOf(json.has_some[c])!==-1){
                include=true;
                break;
              }
            }
          }
        }else{
          include=true;
        }
        return include;
      };
      //function to make sure a file contains one or more strings
      var hasAll=function(cont){
        var include=true;
        if(json.hasOwnProperty('has_all') && json.has_all.length>0){
          if(cont!=undefined){
            for(var c=0;c<json.has_all.length;c++){
              if(cont.indexOf(json.has_all[c])===-1){
                include=false;
                break;
              }
            }
          }else{
            include=false;
          }
        }
        return include;
      };
      var stopBefore=function(which){
        var stopNow=false;
        if(json!=undefined){
          if(json.hasOwnProperty('stop_before')){
            var name=getPathName(which);
            var stopName=json['stop_before'];
            if(stopName==='.'){
              stopName=getPathName('.');
            }
            if(stopName===name){
              stopNow=true;
            }
          }
        }
        return stopNow;
      };
      var stopAfter=function(which){
        var stopNow=false;
        if(json!=undefined){
          if(json.hasOwnProperty('stop_after')){
            var name=getPathName(which);
            var stopName=json['stop_after'];
            if(stopName==='.'){
              stopName=getPathName('.');
            }
            if(stopName===name){
              stopNow=true;
            }
          }
        }
        return stopNow;
      };
      //function to decide if this file's data should be included in return
      var includeData=function(which){
        //include file data based on include exclude rules
        var include=true;
        if(json!=undefined){
          var ext=getPathExt(which);
          if(json.hasOwnProperty('include_ext')){
            include=false;
            if(json['include_ext'].indexOf(ext)!==-1){
              include=true;
            }
          }
          if(json.hasOwnProperty('exclude_ext')){
            if(json['exclude_ext'].indexOf(ext)!==-1){
              include=false;
            }
          }
        }
        return include;
      };
      if(!stopBefore(temPath)){
        //get the template.html content
        var temContent=getFileContent(temPath);
        if(includeData(temPath)){
          if(hasAll(temContent)){
            if(hasSome(temContent)){
              data.push({path:temPath, content:temContent});
            }
          }
        }
        if(!stopAfter(temPath)){
          var tabsUl=jQuery('#tabs:first').children('ul:first');
          //get all of the potential file names between [...] TRIANGLE_STRIP
          var matches=temContent.match(/\[(.*?)\]/g); var prevMatch='';
          for(var m=0;m<matches.length;m++){
            var match=matches[m];
            match=match.substring('['.length);
            match=match.substring(0, match.length-']'.length);
            var prevPath='';
            if(match.trim().indexOf('/')===0){
              if(prevMatch.trim()===match.substring(match.indexOf('/')+'/'.length).trim()){
                //get the tab with this file name
                var li=tabsUl.children('li[path$="'+prevMatch+'"]:first');
                var liPath=getElemPath(li); prevPath=liPath;
                if(liPath!=undefined){
                  if(!stopBefore(liPath)){
                    //include this tab's file data?
                    if(includeData(liPath,liContent)){
                      var liContent=getFileContent(liPath);
                      if(hasAll(liContent)){
                        if(hasSome(liContent)){
                          data.push({path:liPath, content:liContent});
                        }
                      }
                    }
                  }else{
                    break;
                  }
                }
              }
            }
            prevMatch=match;
            if(stopAfter(prevPath)){
              break;
            }
          }
        }
      }
    }
  }
  return data;
}
