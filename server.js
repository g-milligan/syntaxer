var port = 8080;
var host = 'localhost';

var startProjFiles='<!-- [@project]';
var endProjFiles='[/@project] -->';
//command line arg (file to open)
var openFile=''; var file;
if(process.argv!=undefined&&process.argv.length>0){
  for(var a=0;a<process.argv.length;a++){
    //if this is a command line arg
    var arg=process.argv[a];
    if(arg.indexOf('--')===0){
      file=arg.substring(2);
      openFile='?file='+encodeURIComponent(file);
      break;
    }
  }
}
//require
var eol = require('os').EOL;
var express = require('express');
var openBrowser = require('open');
var app = express();
var fs = require('fs');
var bodyParser = require('body-parser'); //required for json post handling

//function to get a date string
var getDateStr=function(date){
  if(date==undefined){ date=new Date(); }
  var y=date.getFullYear()+'.';
  var m=(date.getMonth()+1)+'.';
  var d=date.getDate()+'.';
  var h=date.getHours()+'.';
  var min=date.getMinutes()+'.';
  var s=date.getSeconds()+'';
  return y+m+d+h+min+s;
};
var getDateFromStr=function(str){
  var date;
  if(str!=undefined){
    if(str.length>0){
      if(str.indexOf('.')!==-1){
        var parts=str.split('.');
        if(parts.length===6){
          var y=parseInt(parts[0]); var m=parseInt(parts[1]); var d=parseInt(parts[2]);
          var h=parseInt(parts[3]); var min=parseInt(parts[4]); var s=parseInt(parts[5]);
          date=new Date(y, m, d, h, min, s, 0);
        }
      }
    }
  }
  return date;
};
var getDefaultTemplateHtml=function(title){
  if(title==undefined){title='[new project]';}
  var html='';
  html+='<html>'+eol;
  html+='<head>'+eol;
  html+='<title>'+title+'</title>'+eol;
  html+='<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />'+eol;
  html+='<meta name="viewport" content="width=device-width, initial-scale=1.0" />'+eol;
  html+=''+eol;
  html+='<!-- '+eol;
  html+='GETTING STARTED TIP: '+eol;
  html+='This template file can contain little or no code... '+eol;
  html+='Because you can insert tags -- placeholders that represent code. '+eol;
  html+='Placing tags create separate tabs where you can edit code. '+eol;
  html+=''+eol;
  html+='Tab code will be rendered inline, all-together, in the same .html file. '+eol;
  html+='But while you edit, you can keep code separate (in different tabs). '+eol;
  html+=''+eol;
  html+='For example, you can place your main Javascript code into a tag -- [ main.js ] (no spaces inside brackets) then edit code inside a tab called main.js.'+eol;
  html+=''+eol;
  html+='Feel free to create many different tab-tags to help keep code separate while you edit. '+eol;
  html+='Go on and try it for yourself! '+eol;
  html+=''+eol;
  html+='Delete this message to keep your project slim and clean. '+eol;
  html+=''+eol;
  html+='--> '+eol;
  html+=''+eol;
  html+='<style name="styles" type="text/css">'+eol
  html+='/* your CSS here... */'+eol;
  html+='</style>'+eol;
  html+=''+eol;
  html+='<script name="lib" type="text/javascript">'+eol
  html+='// your script libraries here...'+eol;
  html+='</script>'+eol;
  html+=''+eol;
  html+='</head>'+eol;
  html+='<body>'+eol;
  html+=''+eol;
  html+='<canvas width="900" height="900" id="canvas">...your browser doesn\'t support canvas...</canvas>'+eol;
  html+=''+eol;
  html+='<div id="misc-data" style="display:none;">'+eol
  html+='<!-- your JSON or other misc data here... -->'+eol;
  html+='</div>'+eol;
  html+=''+eol;
  html+='<script id="v-shader" type="x-shader/x-vertex">'+eol
  html+='// your vertex shader code here...'+eol;
  html+='</script>'+eol;
  html+=''+eol;
  html+='<script id="f-shader" type="x-shader/x-fragment">'+eol
  html+='// your fragment shader code here...'+eol;
  html+='</script>'+eol;
  html+=''+eol;
  html+='<script name="main" type="text/javascript">'+eol;
  html+=''+eol;
  html+='/* initialize the webgl context as an object called "gl" */'+eol;
  html+='var canvas=document.getElementById(\'canvas\');var gl;'+eol;
  html+='if(canvas){gl=canvas.getContext(\'webgl\')||canvas.getContext(\'experimental-webgl\');}'+eol;
  html+='if(!gl){console.log(\'sorry, the gl context failed to initialize\');}'+eol;
  html+=''+eol;
  html+='// your main logic here...'+eol;
  html+=''+eol;
  html+='</script>'+eol;
  html+=''+eol;
  html+='</body>'+eol;
  html+='</html>';
  return html;
}

//get the project files from an html string, return string object
var getProjectFilesStr=function(html){
  var jsonStr;
  if(html.lastIndexOf(startProjFiles)!==-1){
    if(html.lastIndexOf(endProjFiles)!==-1){
      jsonStr=html.substring(html.lastIndexOf(startProjFiles)+startProjFiles.length);
      jsonStr=jsonStr.substring(0,jsonStr.lastIndexOf(endProjFiles));
      jsonStr=jsonStr.trim();
    }
  }
  return jsonStr;
};
//get the project files from an html string, return json object
var getProjectFilesJson=function(html){
  var json;
  var jsonStr=getProjectFilesStr(html);
  if(jsonStr!=undefined){
    json=JSON.parse(jsonStr);
  }
  return json;
};
//get the start/end token for inserted file content
var getStartToken=function(fname){
  return '['+fname+']';
};
var getEndToken=function(fname){
  return '[/'+fname+']';
};
//get the content in three parts 1) before insert content 2) insert content 3) after insert content
var getSplitContent=function(html,fname){
  var returnParts;
  //indicators for start and end of the string to insert
  var startToken=getStartToken(fname);
  var endToken=getEndToken(fname);
  //if both start and end tokens are in the file
  if(html.indexOf(startToken)!==-1){
    if(html.indexOf(endToken)!==-1){
      var startIndex=0;
      //get the string before and including the line that contains the starting insert token
      var parts=html.split(startToken);
      if(parts.length>1){
        //get the string before the content to replace
        var beforeReplace=html.substring(0,parts[0].length+startToken.length);
        var beforeNewline=html.substring(beforeReplace.length);
        beforeNewline=beforeNewline.substring(0,beforeNewline.indexOf("\n")+1);
        beforeReplace+=beforeNewline;
        //split off the string after the end token
        var moreParts=parts[1].split(endToken);
        var replaceThis=moreParts[0];
        //remove first newline
        replaceThis=replaceThis.substring(replaceThis.indexOf("\n")+1);
        //remove last newline
        replaceThis=replaceThis.substring(0,replaceThis.lastIndexOf("\n"));
        //get the string after the replaceThis string
        var afterReplace=html.substring(beforeReplace.length+replaceThis.length);
        //assemble the three parts
        returnParts=[beforeReplace,replaceThis,afterReplace];
      }
    }
  }
  return returnParts;
};
//remove <!-- [@project] ... [/@project] --> from the html string
var removeProjectFilesJson=function(html){
  //remove the project files from the htmlStr
  if(html.lastIndexOf(startProjFiles)!==-1){
    if(html.lastIndexOf(endProjFiles)!==-1){
      //remove the project files from the htmlStr
      var beforeProjFiles=html.substring(0,html.lastIndexOf(startProjFiles));
      var afterProjFiles=html.substring(html.lastIndexOf(endProjFiles)+endProjFiles.length);
      html=beforeProjFiles+afterProjFiles;
    }
  }
  return html;
};
var insertProjectFilesJson=function(html, jsonStr){
  var closeBody='</body>';
  //if there is a closing body tag in there
  if(html.indexOf(closeBody)!==-1){
    //first, make sure there is no project files json already
    html=removeProjectFilesJson(html);
    //insert the project files list string before the closing body tag
    var beforeClose=html.substring(0,html.lastIndexOf(closeBody));
    var atClose=html.substring(html.lastIndexOf(closeBody));
    if(typeof jsonStr!=='string'){
      jsonStr=JSON.stringify(jsonStr);
    }
    html=beforeClose+startProjFiles+jsonStr+endProjFiles+atClose;
  }
  return html;
};
//if there is a file path to open
if(file!==undefined&&file.trim().length>0){
  //if the file exists
  if(fs.existsSync(file)){
    //check to see if the file is a directory
    var isDir=fs.lstatSync(file).isDirectory(); var errMsg='';
    //if this file is not a directory
    if(!isDir){
      //if the path is a file (should be)
      if(fs.lstatSync(file).isFile()){
        //if the file ends in .html
        if(file.toLowerCase().lastIndexOf('.html')===file.length-'.html'.length){
          //get the file contents
          var htmlStr=fs.readFileSync(file, 'utf8');
          //if contains opening project tag
          if(htmlStr.indexOf(startProjFiles)!==-1){
            if(htmlStr.indexOf(endProjFiles)!==-1){
              //yay, valid file
            }else{ errMsg='"'+file+'" malformed. Missing "'+endProjFiles+'"'; }
          }else{ errMsg='"'+file+'" malformed. Missing "'+startProjFiles+'"'; }
        }else{ errMsg='"'+file+'" is not an HTML file, ending with ".html". Open an HTML file instead.'; }
      }else{ errMsg='"'+file+'" is not a file nor directory. Open an HTML file or a directory.'; }
    }
    //if no file errors
    if(errMsg.length<1){
      //syntaxer root
      app.use(express.static(__dirname));
      app.use( bodyParser.json() ); // to support JSON-encoded bodies
      app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
        extended: true
      }));

      if(isDir){ openFile='?dir='+encodeURIComponent(file); }

      //open url
      var url='http://' + host + ':' + port + openFile;

      var templateKey='_.html';
      var openTimestamp;

      //function that makes sure ajax requests came from this same page
      var isSameHost=function(testUrl){
        var isSame=false;
        var fromUrlNoQs=testUrl;
        if(fromUrlNoQs.indexOf('?')!==-1){
          fromUrlNoQs=fromUrlNoQs.substring(0, fromUrlNoQs.indexOf('?'));
        }
        var thisUrl=url;
        if(thisUrl.lastIndexOf('/')===thisUrl.length-'/'.length){
          thisUrl=thisUrl.substring(0,thisUrl.length-'/'.length);
        }
        if(fromUrlNoQs.lastIndexOf('/')===fromUrlNoQs.length-'/'.length){
          fromUrlNoQs=fromUrlNoQs.substring(0,fromUrlNoQs.length-'/'.length);
        }
        if(thisUrl.indexOf(fromUrlNoQs)===0){
          isSame=true;
        }
        return isSame;
      };
      //function to get qs from url
      var getQs=function(fromUrl){
        var qs={};
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
        }
        return qs;
      };
      //remove project from recent_projects.json
      var removeRecentProject=function(json, projKey){
        var path, id;
        //if project id was provided
        if(!isNaN(parseInt(projKey))){
          if(json.id.hasOwnProperty(projKey)){
            path=json.id[projKey];
          }
        //project path provided
        }else if(typeof projKey==='string'){
          path=projKey;
        }
        if(path!=undefined){
          if(json.path.hasOwnProperty(path)){
            var id=json.path[path];
            //remove path:id property
            delete json.path[path];
            //clean this project's data from the in_order arrays
            for(orderKey in json.in_order){
              if(json.in_order.hasOwnProperty(orderKey)){
                var indexOfId=json.in_order[orderKey].indexOf(id);
                if(indexOfId!==-1){
                  //remove this id from its current position in this in_order array
                  json.in_order[orderKey].splice(indexOfId, 1);
                }
              }
            }
            if(json.data.hasOwnProperty(id)){
              //remove data:id property
              delete json.data[id];
            }
            if(json.id.hasOwnProperty(id)){
              //remove id:path property
              delete json.id[id];
            }
          }
        }
        return json;
      };
      //update the recent projects data, given the project path
      var updateRecentProjects=function(projPath, args){
        var ret='error, args is undefined';
        if(args!=undefined){
          ret='error, args.type is undefined';
          if(args.hasOwnProperty('type')){
            if(!fs.existsSync('./state/')){
              //create state directory
              fs.mkdirSync('./state/');
            }
            //get the existing data, if not the first time updating the data
            var jsonStr='{"id":{},"path":{},"in_order":{"create":[],"modify":[],"open":[]},"data":{}}';
            if(fs.existsSync('./state/recent_projects.json')){
              //read the existing file contents
              jsonStr=fs.readFileSync('./state/recent_projects.json', 'utf8');
            }
            var json=JSON.parse(jsonStr);
            //function to write to the file
            var writeToDataFile=function(j){
              //write the json into the file
              var str=JSON.stringify(j);
              if(str!=undefined){
                fs.writeFileSync('./state/recent_projects.json', str);
              }
            };
            //if there is a path property in this json
            ret='error, recent_projects.json is malformed with one or more missing properties';
            if(json.hasOwnProperty('path')){
              //if there is an id property in this json
              if(json.hasOwnProperty('id')){
                if(json.hasOwnProperty('in_order')){
                  if(json.hasOwnProperty('data')){
                    var writeToFile=false;
                    //if the project's basic data is not already initialized
                    if(!json.path.hasOwnProperty(projPath)){
                      //should not have to create a new project and update the time it has been open at the same time
                      if(args.type!=='update_open_time'){
                        var maxProjects=100;
                        //get a new unique id for this project
                        var newId=Object.keys(json.id).length+1;
                        //if there are more than maxProjects
                        if(newId>maxProjects){
                          //remove the excess number of projects
                          var lowestDeletedId=-1;
                          var excessNum=newId-maxProjects;
                          for(var e=0;e<excessNum;e++){
                            //remove recent project (project that was opened the longest time ago)
                            var removeProjId=json.in_order.open[0];
                            json=removeRecentProject(json, removeProjId);
                            if(e===0 || lowestDeletedId>removeProjId){
                              //instead of going to a higher project id, recycle this old id
                              lowestDeletedId=removeProjId;
                            }
                            writeToFile=true;
                          }
                          if(lowestDeletedId>-1){
                            //instead of going to a higher project id, recycle this old lower id
                            newId=lowestDeletedId;
                          }
                        }
                        //make sure the new id is unique
                        while(json.id.hasOwnProperty(newId)){ newId++; }
                        //init the new project's data (if the path ever changes, have to update the path in two places inside recent_projects.json)
                        json.id[newId]=projPath;
                        json.path[projPath]=newId;
                        //init the ordered list of events like create, modify
                        json.in_order.create.push(newId);
                        json.in_order.modify.push(newId);
                        //init the primary data property for this project
                        var currentDate=getDateStr();
                        json.data[newId]={
                          create:currentDate, modify:currentDate,
                          last_open:currentDate, opens:0,
                          open_time_hours:0
                        };
                        //write this data
                        writeToFile=true;
                      }
                    }
                    //if this project is in the data
                    ret='error, recent_projects.json doesn\'t contain data for the path, '+projPath;
                    if(json.path.hasOwnProperty(projPath)){
                      //get the project id
                      var projId=json.path[projPath];
                      //function to update something in an in_order list
                      var updateOrder=function(which){
                        if(json.in_order.hasOwnProperty(which)){
                          //if this project id is already in the ordered array
                          var indexOfId=json.in_order[which].indexOf(projId);
                          if(indexOfId!==-1){
                            //remove this id from its current position
                            json.in_order[which].splice(indexOfId, 1);
                          }
                          //add this project id to the end of the ordered list of ids
                          json.in_order[which].push(projId);
                        }
                      }
                      //depending on the type of update
                      switch(args.type){
                        case 'open': //update this project as recently opened
                          //update the order in which this project was opened
                          updateOrder('open');
                          json.data[projId]['opens']++;
                          json.data[projId]['last_open']=getDateStr();
                          writeToFile=true;
                          break;
                        case 'update_open_time': //update the time tracking for this project being open
                          ret='error, must specify args.open_time';
                          if(args.hasOwnProperty('open_time')){
                            //get the number of hours so far
                            var hoursSoFar=json.data[projId]['open_time_hours'];
                            hoursSoFar=parseFloat(hoursSoFar);
                            //get date strings
                            var open_time=args['open_time'];
                            var current_time=getDateStr();
                            //get date objects
                            var openDate=getDateFromStr(open_time);
                            var currentDate=getDateFromStr(current_time);
                            //figure out the number of hours between the two dates
                            var hours = Math.abs(currentDate - openDate) / 36e5;
                            //add the number of hours to the total
                            hoursSoFar+=hours;
                            //round to four decimal places
                            hoursSoFar=Math.round(hoursSoFar*10000)/10000;
                            //update the number of hours
                            json.data[projId]['open_time_hours']=hoursSoFar;
                            //also update what filter/order rules are set for the recent projects list
                            if(args.hasOwnProperty('ui_project_list')){
                              if(!json.hasOwnProperty('ui_project_list')){
                                json['ui_project_list']={};
                              }
                              for(var k in args['ui_project_list']){
                                if(args['ui_project_list'].hasOwnProperty(k)){
                                  json['ui_project_list'][k]=args['ui_project_list'][k];
                                }
                              }
                            }
                            writeToFile=true;
                          }
                          break;
                        case 'modify':
                          //update the order in which this project was modified
                          updateOrder('modify');
                          json.data[projId]['modify']=getDateStr();
                          writeToFile=true;
                          break;
                        default:
                          ret='error, unkown action type, '+args.type;
                          break;
                      }
                      if(writeToFile){
                        writeToDataFile(json);
                        ret='ok';
                      }
                    }
                  }
                }
              }
            }
          }
        }
        return ret;
      };
      //create the preview index.html file
      var setPreviewIndexHtml=function(html){
        if(!fs.existsSync('./preview/')){
          //create preview directory
          fs.mkdirSync('./preview/');
        }
        //write the preview html
        fs.writeFileSync('./preview/index.html', html);
      };
      //check to see if a file or folder at the given path can be deleted
      var isAllowedDelete=function(path){
        var resJson={status:'error, no initial path provided', is_dir:false};
        path=path.trim();
        if(path.length>0){
          //if the path exists
          if(fs.existsSync(path)){
            var canDelete=false;
            //if is directory
            if(fs.lstatSync(path).isDirectory()){
              resJson['is_dir']=true;
              //read the children of the directory
              var files = fs.readdirSync(path);
              //if there are no children in the directory
              if(files.length<1){
                canDelete=true;
              }else{
                resJson['status']='error, cannot delete a directory that contains one or more sub-directories or files (must be empty to delete)';
              }
            }else{
              //is file... if ends with .html
              if(path.lastIndexOf('.html')===path.length-'.html'.length){
                canDelete=true;
              }else{
                resJson['status']='error, cannot delete any file other than .html type';
              }
            }
            if(canDelete){
              resJson['status']='ok';
            }
          }else{
            resJson['status']='error, does not exist, '+path;
          }
        }
        return resJson;
      };
      //check if a file or folder can be deleted
      app.post('/remove-recent-project-data', function(req, res){
        var fromUrl=req.headers.referer;
        //if the request came from this local site
        if(isSameHost(fromUrl)){
          var resJson={status:'error, no paths provided',paths:[]};
          if(req.body.hasOwnProperty('paths')){
            var paths=req.body.paths;
            if(fs.existsSync('./state/recent_projects.json')){
              //read the existing file contents
              var jsonStr=fs.readFileSync('./state/recent_projects.json', 'utf8');
              var json=JSON.parse(jsonStr), writeToFile=false;
              //for each path to remove
              for(var p=0;p<paths.length;p++){
                var path=paths[p];
                if(json.path.hasOwnProperty(path)){
                  //remove project data
                  json=removeRecentProject(json, path);
                  writeToFile=true;
                  resJson['paths'].push(path);
                }
              }
              //if any paths were removed
              if(writeToFile){
                var str=JSON.stringify(json);
                if(str!=undefined){
                  fs.writeFileSync('./state/recent_projects.json', str);
                  resJson['status']='ok';
                }else{
                  resJson['status']='error, failed to write malformed json to recent_projects.json';
                }
              }else{
                resJson['status']='error, recent_projects.json doesn\'t contain those paths';
              }
            }else{
              resJson['status']='error, recent_projects.json data file does not exist';
            }
          }
          res.send(JSON.stringify(resJson));
        }
      });
      //check if a file or folder can be deleted
      app.post('/is-allowed-delete', function(req, res){
        var fromUrl=req.headers.referer;
        //if the request came from this local site
        if(isSameHost(fromUrl)){
          var resJson={status:'error, no initial path provided'};
          if(req.body.hasOwnProperty('path')){
            var path=req.body.path;
            resJson=isAllowedDelete(path);
          }
          res.send(JSON.stringify(resJson));
        }
      });
      //request to delete a file or folder
      app.post('/delete-file-or-folder', function(req, res){
        var fromUrl=req.headers.referer;
        //if the request came from this local site
        if(isSameHost(fromUrl)){
          var resJson={status:'error, no initial path provided'};
          if(req.body.hasOwnProperty('path')){
            var path=req.body.path;
            resJson=isAllowedDelete(path);
            if(resJson['status']==='ok'){
              resJson['status']='error, failed to remove '+path;
              //if folder
              if(resJson['is_dir']){
                //delete the folder
                fs.rmdirSync(path);
                resJson['status']='ok';
              }else{
                //delete the file
                fs.unlinkSync(path);
                resJson['status']='ok';
              }
            }
          }
          res.send(JSON.stringify(resJson));
        }
      });
      //request to delete a file or folder
      app.post('/request-recent-projects-data', function(req, res){
        var fromUrl=req.headers.referer;
        //if the request came from this local site
        if(isSameHost(fromUrl)){
          var resJson={status:'error, recent_projects.json data doesn\'t exist'};
          if(fs.existsSync('./state/recent_projects.json')){
            //read the existing file contents
            var jsonStr=fs.readFileSync('./state/recent_projects.json', 'utf8');
            var json=JSON.parse(jsonStr);
            //make the data smaller by removing redundant path.id association
            if(json.hasOwnProperty('path')){
              delete json['path'];
            }
            //set the projects' data
            resJson['recent_projects']=json;
            resJson['status']='ok';
          }
          res.send(JSON.stringify(resJson));
        }
      });
      //request to delete a file or folder
      app.post('/request-snippets-data', function(req, res){
        var fromUrl=req.headers.referer;
        //if the request came from this local site
        if(isSameHost(fromUrl)){
          //build the filter for the path
          var resJson={status:'ok',
            fieldsets:[], type_options:[], ext_options:[], path_options:[],
            content:'', content_type:'', content_path:''};
          var snippetsRoot='./snippets/', fieldsetFile='_fieldset.xml';
          resJson['snippets_root']=snippetsRoot; resJson['fieldset_file']=fieldsetFile;
          //check to see if the file selection exists
          var type, path, ext;
          if(req.body.hasOwnProperty('type')){
            type=req.body['type'];
            if(fs.existsSync(snippetsRoot+type)){
              if(fs.lstatSync(snippetsRoot+type).isDirectory()){
                if(req.body.hasOwnProperty('ext')){
                  ext=req.body['ext'];
                  if(fs.existsSync(snippetsRoot+type+'/'+ext)){
                    if(fs.lstatSync(snippetsRoot+type+'/'+ext).isDirectory()){
                      if(req.body.hasOwnProperty('path')){
                        path=req.body['path'];
                        if(path.indexOf('/')===0){path=path.substring(1);}
                        if(fs.existsSync(snippetsRoot+type+'/'+ext+'/'+path)){
                          if(fs.lstatSync(snippetsRoot+type+'/'+ext+'/'+path).isDirectory()){
                            path=undefined;
                            resJson['status']='error, '+snippetsRoot+type+'/'+ext+'/'+path+' is not a file';
                          }
                        }else{
                          path=undefined;
                          resJson['status']='error, '+snippetsRoot+type+'/'+ext+'/'+path+' does not exist';
                        }
                      }
                    }else{
                      ext=undefined;
                      resJson['status']='error, '+snippetsRoot+type+'/'+ext+' is not a directory';
                    }
                  }else{
                    ext=undefined;
                    resJson['status']='error, '+snippetsRoot+type+'/'+ext+' does not exist';
                  }
                }
              }else{
                type=undefined;
                resJson['status']='error, '+snippetsRoot+type+' is not a directory';
              }
            }else{
              type=undefined;
              resJson['status']='error, '+snippetsRoot+type+' does not exist';
            }
          }
          //get the updated options for the 3 filter dropdowns
          var rootFiles=fs.readdirSync(snippetsRoot);
          for(var r=0;r<rootFiles.length;r++){
            //if this is a directory
            if(fs.lstatSync(snippetsRoot+rootFiles[r]).isDirectory()){
              resJson['type_options'].push(rootFiles[r]);
              if(rootFiles[r]===type){
                var extFiles=fs.readdirSync(snippetsRoot+type);
                for(var e=0;e<extFiles.length;e++){
                  //if this is a directory
                  if(fs.lstatSync(snippetsRoot+type+'/'+extFiles[e]).isDirectory()){
                    resJson['ext_options'].push(extFiles[e]);
                    if(extFiles[e]===ext){
                      var pathFiles=fs.readdirSync(snippetsRoot+type+'/'+extFiles[e]);
                      for(var p=0;p<pathFiles.length;p++){
                        //if ends in .xml
                        if(pathFiles[p].indexOf('.xml')!==-1 && pathFiles[p].lastIndexOf('.xml')===pathFiles[p].length-'.xml'.length){
                          //if not a directory
                          if(!fs.lstatSync(snippetsRoot+type+'/'+extFiles[e]+'/'+pathFiles[p]).isDirectory()){
                            //if this is a _fieldset.xml file for this extension type
                            if(pathFiles[p]===fieldsetFile){
                              resJson['fieldsets'].push(type+'/'+extFiles[e]+'/'+pathFiles[p]);
                            }else{
                              resJson['path_options'].push(pathFiles[p]);
                            }
                          }
                        }
                      }
                    }
                  }else if(extFiles[e]===fieldsetFile){
                    //if this is a _fieldset.xml file for this project type?
                    resJson['fieldsets'].push(type+'/'+extFiles[e]);
                  }
                }
              }
            }
          }
          //sort things
          resJson['fieldsets'].sort();
          resJson['type_options'].sort();
          resJson['ext_options'].sort();
          resJson['path_options'].sort();
          //if the given file selection exists in the snippets directory
          if(resJson['status']==='ok'){
            //get the data for the given snippet content file
            var fullFilePath=snippetsRoot+type+'/'+ext+'/'+path;
            resJson['content_path']=fullFilePath;
            var fileContent=fs.readFileSync(fullFilePath,'utf8');
            resJson['content']=fileContent;
            resJson['content_type']='builder-code';
            if(path===fieldsetFile){ resJson['content_type']='fieldset-code'; }
          }
          res.send(JSON.stringify(resJson));
        }
      });
      //request to pack project changes (write preview file over original project file)
      app.post('/pack-project', function(req, res){
        var fromUrl=req.headers.referer;
        //if the request came from this local site
        if(isSameHost(fromUrl)){
          var resJson={};
          if(req.body.hasOwnProperty('path')){
            //if the preview file exists
            if(fs.existsSync('./preview/index.html')){
              var path=req.body.path;
              if(fs.existsSync(path)){
                if(!fs.lstatSync(path).isDirectory()){
                  if(path.lastIndexOf('.html')===path.length-'.html'.length){
                    //read the existing preview file contents
                    var html=fs.readFileSync('./preview/index.html', 'utf8');
                    //if contains opening project tag
                    if(html.indexOf(startProjFiles)!==-1){
                      if(html.indexOf(endProjFiles)!==-1){
                        //write the changes
                        fs.writeFileSync(path, html);
                        resJson['status']='ok';
                        resJson['path']=path;
                        updateRecentProjects(path, {type:'modify'});
                      }else{
                        resJson['status']='error, malformed preview index file. Missing "'+endProjFiles+'"';
                      }
                    }else{
                      resJson['status']='error, malformed preview index file. Missing "'+startProjFiles+'"';
                    }
                  }else{
                    resJson['status']='error, cannot pack path that isn\'t type .html: '+path;
                  }
                }else{
                  resJson['status']='error, not a file - is directory: '+path;
                }
              }else{
                resJson['status']='error, project path doesn\'t exist: '+path;
              }
            }else{
              resJson['status']='error, preview-file / save-destination doesn\'t exist.';
            }
          }else{
            resJson['status']='error, no project path specified.';
          }
          res.send(JSON.stringify(resJson));
        }
      });
      //request to save project changes (write to preview index.html file)
      app.post('/save-project', function(req, res){
        var fromUrl=req.headers.referer;
        //if the request came from this local site
        if(isSameHost(fromUrl)){
          var resJson={}, numModified=0, numRemoved=0, numRenamed=0, numAdded=0;
          //if the preview file exists
          if(fs.existsSync('./preview/index.html')){
            //read the existing file contents
            var html=fs.readFileSync('./preview/index.html', 'utf8');
            //==REMOVE TAB FILES==
            if(req.body.hasOwnProperty('removed')){
              if(req.body.removed.length>0){
                //get the project json html
                var jsonStr=getProjectFilesStr(html); var json=JSON.parse(jsonStr);
                //for each tab to remove
                for(var r=0;r<req.body.removed.length;r++){
                  var remName=req.body.removed[r]; var remPath=remName;
                  //get only the file name, no path
                  if(remName.indexOf('/')!==-1){
                    remName=remName.substring(remName.lastIndexOf('/')+'/'.length);
                  }
                  //get the split parts around the embedded tabs
                  var parts=getSplitContent(html,remName);
                  if(parts!=undefined){
                    //if this file is also listed in the project's json
                    var indexOfRemPath=json['files'].indexOf(remPath);
                    if(indexOfRemPath!==-1){
                      //remove the file from the project json that's kept before closing body tag
                      json['files'].splice(indexOfRemPath, 1);
                      //remove from embedded html content
                      html=parts[0]+parts[2];
                      //don't have to remove the tags because there should be a template html content update that takes care of this
                      numRemoved++;
                    }
                  }
                }
                //if any removed
                if(numRemoved>0){
                  //replace the project HTML json with the updated version
                  html=insertProjectFilesJson(html, json);
                }
              }
            }
            //==RENAMED TAB FILES==
            if(req.body.hasOwnProperty('rename')){
              //get the project json html
              var jsonStr=getProjectFilesStr(html); var json=JSON.parse(jsonStr);
              //for each tab to rename
              for(oldPath in req.body.rename){
                if(req.body.rename.hasOwnProperty(oldPath)){
                  var newPath=req.body.rename[oldPath];
                  //get only the file name, no path
                  var oldName=oldPath;
                  if(oldName.indexOf('/')!==-1){
                    oldName=oldName.substring(oldName.lastIndexOf('/')+'/'.length);
                  }
                  //get only the file name, no path
                  var newName=newPath;
                  if(newName.indexOf('/')!==-1){
                    newName=newName.substring(newName.lastIndexOf('/')+'/'.length);
                  }
                  //get the split parts around the embedded tab
                  var parts=getSplitContent(html,oldName);
                  if(parts!=undefined){
                    //if this file is also listed in the project's json
                    var indexOfPath=json['files'].indexOf(oldPath);
                    if(indexOfPath!==-1){
                      if(oldName!==newName){
                        //validate that the old token is inside parts[0] and parts[2]
                        var oldStartToken=getStartToken(oldName);
                        if(parts[0].lastIndexOf(oldStartToken)!==-1){
                          var oldEndToken=getEndToken(oldName);
                          if(parts[2].indexOf(oldEndToken)!==-1){
                            //rename the file in the project json that's kept before closing body tag
                            json['files'][indexOfPath]=newPath;
                            //get the new tokens
                            var newStartToken=getStartToken(newName);
                            var newEndToken=getEndToken(newName);
                            //get new part chunks
                            var newStart=parts[0]; var newEnd=parts[2];
                            //replace the old token in the end chunk
                            newEnd=newEnd.replace(oldEndToken, newEndToken);
                            //replace the end token with the new version
                            var beforeOldStartToken=newStart.substring(0,newStart.lastIndexOf(oldStartToken));
                            var afterOldStartToken=newStart.substring(beforeOldStartToken.length+oldStartToken.length);
                            newStart=beforeOldStartToken+newStartToken+afterOldStartToken;
                            //put chunks back together
                            html=newStart+parts[1]+newEnd;
                            numRenamed++;
                          }
                        }
                      }
                    }
                  }
                }
              }
              //if any tabs renamed
              if(numRenamed>0){
                //replace the project HTML json with the updated version
                html=insertProjectFilesJson(html, json);
              }
            }
            //if there were any added or modified files (data with content)
            if(req.body.hasOwnProperty('files')){
              //==UPDATE TEMPLATE.HTML CONTENT==
              if(req.body.files.hasOwnProperty(templateKey)){
                if(req.body.files[templateKey].hasOwnProperty('content')){
                  numModified++;
                  //get the project json html
                  var jsonStr=getProjectFilesStr(html); var json=JSON.parse(jsonStr);
                  //save the embedded content so it can be restored
                  var restoreContent=[];
                  for(var f=0;f<json.files.length;f++){
                    var fp=json.files[f];
                    //get only the file name, no path
                    var fn=fp;
                    if(fn.indexOf('/')!==-1){
                      fn=fn.substring(fn.lastIndexOf('/')+'/'.length);
                    }
                    var parts=getSplitContent(html,fn);
                    if(parts!=undefined){
                      restoreContent.push({name:fn,content:parts[1]});
                    }
                  }
                  //reset to the updated template html (sans embedded file content)
                  var templateHtml=req.body.files[templateKey]['content'];
                  html=templateHtml;
                  //insert the embedded content back in
                  for(var e=0;e<restoreContent.length;e++){
                    var rName=restoreContent[e]['name'];
                    var rContent=restoreContent[e]['content'];
                    var parts=getSplitContent(html,rName);
                    if(parts!=undefined){
                      //restore embedded tab content
                      html=parts[0]+rContent+parts[2];
                    }
                  }
                  //insert the project json back in
                  html=insertProjectFilesJson(html, jsonStr);
                }
              }
              //==UPDATE OTHER TAB CONTENT (NOT TEMPLATE.HTML)==
              var addedFilesJson;
              for(path in req.body.files){
                if(req.body.files.hasOwnProperty(path)){
                  if(path!==templateKey){
                    //if this path key has a child content property
                    var fileJson=req.body.files[path];
                    if(fileJson.hasOwnProperty('content')){
                      var updatedContent=fileJson.content;
                      //get only the file name, no path
                      var fname=path;
                      if(fname.indexOf('/')!==-1){
                        fname=fname.substring(fname.lastIndexOf('/')+'/'.length);
                      }
                      //update the content that's embedded in the html
                      var contentParts=getSplitContent(html,fname);
                      if(contentParts!=undefined){
                        //update the html with the updatedContent
                        html=contentParts[0]+updatedContent+contentParts[2];
                        //make sure the file path is added to the project json
                        var isNewAdded=false;
                        if(addedFilesJson==undefined){ addedFilesJson=getProjectFilesJson(html); }
                        if(addedFilesJson!=undefined){
                          //there should be a files property, but if not, make sure there is
                          if(!addedFilesJson.hasOwnProperty('files')){ addedFilesJson['files']=[]; }
                          //if this file path is not already listed in the files list
                          if(addedFilesJson['files'].indexOf(path)===-1){
                            //add this file path to the project json files list
                            addedFilesJson['files'].push(path);
                            numAdded++; isNewAdded=true;
                          }
                        }
                        //if modified (not newly added)
                        if(!isNewAdded){ numModified++; }
                      }
                    }
                  }
                }
              }
              //if any new files were specified, that need to be added to the project json
              if(numAdded>0){
                //replace the project HTML json with the updated version
                html=insertProjectFilesJson(html, addedFilesJson);
              }
            }
            //WRITE MODIFICATIONS TO DISK
            if(numModified>0 || numAdded>0 || numRemoved>0 || numRenamed>0){
              //write the changes
              fs.writeFileSync('./preview/index.html', html);
            }
            resJson['status']='ok';
          }else{
            resJson['status']='error, preview-file / save-destination doesn\'t exist.';
          }
          resJson['modified']=numModified; //modified NOT added
          resJson['added']=numAdded; //added NOT modified
          resJson['removed']=numRemoved;
          resJson['renamed']=numRenamed;
          res.send(JSON.stringify(resJson));
        }
      });
      //create new project file for save-as, new or copied from existing project
      app.post('/create-new-project', function(req, res){
        var fromUrl=req.headers.referer;
        //if the request came from this local site
        if(isSameHost(fromUrl)){
          var resJson={status:'error, no initial path provided'};
          if(req.body.hasOwnProperty('path')){
            var path=req.body.path;
            if(path.lastIndexOf('/')===path.length-'/'.length){ path=path.substring(0, path.length-'/'.length); }
            path=path.trim();
            if(path.length>0){
              resJson['status']='error, no project file name provided';
              if(req.body.hasOwnProperty('file')){
                var file=req.body.file; file=file.trim();
                if(file.length>0){
                  if(file.lastIndexOf('.html')===file.length-'.html'.length){
                    if(fs.existsSync(path)){
                      if(fs.lstatSync(path).isDirectory()){
                        if(!fs.existsSync(path+'/'+file)){
                          var fromFile='', doCreate=true, newHtml='', createData={}, doCreateData=false;
                          //if creating a file based on an existing file (path)
                          if(req.body.hasOwnProperty('fromFile')){
                            fromFile=req.body.fromFile;
                            if(typeof fromFile==='string'){
                              fromFile=fromFile.trim();
                              if(fromFile.length>0){
                                //if fromFile has a valid html extension
                                if(fromFile.lastIndexOf('.html')===fromFile.length-'.html'.length){
                                  if(fs.existsSync(fromFile)){
                                    if(!fs.lstatSync(fromFile).isDirectory()){
                                      //make sure the save as file has valid contents
                                      newHtml=fs.readFileSync(fromFile, 'utf8');
                                      //if doesn't contain the project tags
                                      if(newHtml.indexOf(startProjFiles)===-1 || newHtml.indexOf(endProjFiles)===-1){
                                        resJson['status']='error, missing one or both project data tag';
                                        doCreate=false;
                                      }
                                    }else{
                                      resJson['status']='error, cannot save-as from directory, '+fromFile;
                                      doCreate=false;
                                    }
                                  }else{
                                    resJson['status']='error, cannot save-as from non-existent file, '+fromFile;
                                    doCreate=false;
                                  }
                                }else{
                                  resJson['status']='error, must save-as from .html file';
                                  doCreate=false;
                                }
                              }else{
                                resJson['status']='error, the save-as (from) file path is blank';
                                doCreate=false;
                              }
                            }
                          }else{
                            //not creating a copy based on fromFile path...

                            //if create a file that hasn't been written to disk yet
                            if(req.body.hasOwnProperty('createData')){
                              //use createData to set newHtml string
                              createData=req.body.createData;
                              if(createData.hasOwnProperty('files')){
                                if(createData['files'].hasOwnProperty(templateKey)){
                                  if(createData['files'][templateKey].hasOwnProperty('content')){
                                    doCreateData=true;
                                    //get the template html
                                    newHtml=createData['files'][templateKey]['content'];
                                    //init the project json
                                    var projName=file;
                                    if(projName.indexOf('/')!==-1){
                                      projName=projName.substring(projName.lastIndexOf('/')+'/'.length);
                                    }
                                    if(projName.indexOf('.html')!==-1){
                                      if(projName.lastIndexOf('.html')===projName.length-'.html'.length){
                                        projName=projName.substring(0, projName.lastIndexOf('.html'));
                                      }
                                    }
                                    var projJson={name:projName,files:[]};
                                    //for each tab content to insert into the template html
                                    for(key in createData['files']){
                                      if(createData['files'].hasOwnProperty(key)){
                                        //if not the template file
                                        if(key!==templateKey){
                                          if(projJson['files'].indexOf(key)===-1){
                                            projJson['files'].push(key);
                                          }
                                          var fcontent=createData['files'][key]['content'];
                                          if(fcontent.length>0){
                                            //get just the file name
                                            var name=key;
                                            if(name.indexOf('/')!==-1){
                                              name=name.substring(name.lastIndexOf('/')+'/'.length);
                                            }
                                            //put the file content into the template html
                                            var parts=getSplitContent(newHtml,name);
                                            if(parts!=undefined){
                                              //restore embedded tab content into the template html
                                              newHtml=parts[0]+fcontent+parts[2];
                                            }
                                          }
                                        }
                                      }
                                    }
                                    //insert the project json into the template html
                                    newHtml=insertProjectFilesJson(newHtml, projJson);
                                    //if the project json couldn't be inserted into the template html
                                    if(getProjectFilesStr(newHtml)==undefined){
                                      resJson['status']='error, could not place the project data... possibly missing end </body> tag?';
                                      doCreate=false;
                                    }
                                  }else{
                                    resJson['status']='error, cannot create data without "files.'+templateKey+'.content" property';
                                    doCreate=false;
                                  }
                                }else{
                                  resJson['status']='error, cannot create data without "files.'+templateKey+'" property';
                                  doCreate=false;
                                }
                              }else{
                                resJson['status']='error, cannot create data without "files" property';
                                doCreate=false;
                              }
                            }
                          }
                          //if the fromFile is good data or isn't being used
                          if(doCreate){
                            var fname=file.substring(0,file.lastIndexOf('.html'));
                            resJson['url']='http://' + host + ':' + port + '?file='+encodeURIComponent(path+'/'+file);
                            //if creating a new file that has never been saved yet (opened blank, unsaved syntaxer project)
                            if(doCreateData){
                              //create the file with the possibly modified contents
                              fs.writeFileSync(path+'/'+file, newHtml);
                              //if there is a listed open timestamp (should be)
                              if(createData.hasOwnProperty('open_time')){ //the original time the blank project was opened
                                //save the open_time so it can be accessed when the newly saved file is opened
                                openTimestamp=createData['open_time'];
                              }
                              resJson['status']='ok';
                            //if creating a new project from an existing project (save-as)
                            }else if(fromFile.length>0){
                              //change the project json data (project name)... "save as" project option
                              var json=getProjectFilesJson(newHtml);
                              if(json!=undefined){
                                //set the new project name and replace the old data with the new data
                                json['name']=fname;
                                newHtml=insertProjectFilesJson(newHtml, json);
                                //save-as file
                                fs.writeFileSync(path+'/'+file, newHtml);
                                resJson['status']='ok';
                              }else{
                                resJson['status']='error, project data json tags are malformed in the save-from project file';
                              }
                            }else if(fromFile.length<1){
                              //creating a brand new project file (that hasn't been edited yet: "new" project option)... (not save-as)
                              newHtml+=getDefaultTemplateHtml(fname);
                              //insert the project data
                              newHtml=insertProjectFilesJson(newHtml, {name:fname,files:[]});
                              //create the file with the default contents
                              fs.writeFileSync(path+'/'+file, newHtml);
                              resJson['status']='ok';
                            }
                          }
                        }else{
                          resJson['status']='error, already exists, '+path+'/'+file;
                        }
                      }else{
                        resJson['status']='error, not a directory, '+path;
                      }
                    }else{
                      resJson['status']='error, doesn\'t exist, '+path;
                    }
                  }else{
                    resJson['status']='error, file name must end with .html extension';
                  }
                }
              }
            }
          }
          res.send(JSON.stringify(resJson));
        }
      });
      //request to save project changes
      app.post('/autocomplete-project-path', function(req, res){
        var fromUrl=req.headers.referer;
        //if the request came from this local site
        if(isSameHost(fromUrl)){
          var resJson={status:'error, no initial path provided'};
          if(req.body.hasOwnProperty('path')){
            var path=req.body.path; path=path.trim();
            var dir=path; var endsWithSlash=false;
            //if ends with / like a directory
            if(dir.lastIndexOf('/')===dir.length-'/'.length){
              endsWithSlash=true;
              //get the directory and trim off the ending /
              dir=dir.substring(0,dir.lastIndexOf('/'));
            }else{
              //doesn't end with /...

              //if still contains /
              if(dir.indexOf('/')!==-1){
                //get just the directory before the last /
                dir=dir.substring(0,dir.lastIndexOf('/'));
              }
            }
            //if the directory exists
            resJson['status']='error, path, '+dir+' does not exist';
            if(fs.existsSync(dir)){
              resJson['status']='ok'; resJson['dir_complete']=[]; resJson['file_complete']=[];
              //if this is a directory, not a file
              if(fs.lstatSync(dir).isDirectory()){
                //get the text after the directory, that's incomplete
                var incomplete=path.substring(dir.length); incomplete=incomplete.trim();
                if(incomplete.indexOf('/')===0){ incomplete=incomplete.substring(1); }
                //set some return data
                resJson['directory']=dir+'/'; resJson['incomplete']=incomplete;
                //read the children of the directory
                var files = fs.readdirSync(dir); var commonOption;
                //function used to figure out what part of the incomplete text is matched by multiple options
                var setCommonOption=function(newOption){
                  if(commonOption!==''){
                    if(commonOption==undefined){
                      commonOption=newOption;
                    }else{
                      //the common option has to be the start of all options (therefore, common option can't be longer than the shortest newOption)
                      if(newOption.length<commonOption.length){
                        commonOption=commonOption.substring(0,newOption.length);
                      }
                      //if newOption doesn't start with common option
                      if(newOption.indexOf(commonOption)!==0){
                        var buildCommon='';
                        //for each letter until one letter that isn't common in newOption
                        for(var n=0;n<newOption.length;n++){
                          if(newOption[n]===commonOption[n]){
                            //this letter placement in commonOption matches up with the same letter in newOption (so far so good)
                            buildCommon+=newOption[n];
                          }else{
                            //this letter, in commonOption, is the first letter to diverge from the sequence in newOption
                            break;
                          }
                        }
                        //now commonOption is shorter, but now it is the start of newOption or it is empty
                        commonOption=buildCommon;
                      }
                    }
                  }
                };
                for(var f=0;f<files.length;f++){
                  var file=files[f];
                  //if this file name starts with the incomplete text
                  if(file.indexOf(incomplete)===0){
                    //if this file is a directory
                    if(fs.lstatSync(dir+'/'+file).isDirectory()){
                      //if the directory matches exactly
                      if(file.length===incomplete.length){
                        //if doesn't already end with slash
                        if(!endsWithSlash){
                          //add the suggestion to complete the directory with a slash
                          var option='/';
                          setCommonOption(option);
                          resJson['dir_complete'].push(option);
                        }
                      }else{
                        //directory not fully typed out...
                        var option=file.substring(incomplete.length)+'/';
                        setCommonOption(option);
                        resJson['dir_complete'].push(option);
                      }
                    }else{
                      //this file is not a directory, is a file...

                      //if this is an html file
                      if(file.lastIndexOf('.html')===file.length-'.html'.length){
                        //if contains opening and closing project tags
                        var htmlStr=fs.readFileSync(dir+'/'+file, 'utf8');
                        if(htmlStr.indexOf(startProjFiles)!==-1){
                          if(htmlStr.indexOf(endProjFiles)!==-1){
                            var option=file.substring(incomplete.length);
                            setCommonOption(option);
                            resJson['file_complete'].push(option);
                          }
                        }
                      }
                    }
                  }
                }
                //if there is a substring that will satisfy the start of all possible autocomplete options
                resJson['commonContinue']='';
                if(commonOption!=undefined){
                  if(commonOption.length>0){
                    resJson['commonContinue']=commonOption;
                  }
                }
              }
            }
          }
          res.send(JSON.stringify(resJson));
        }
      });
      //request to make a new directory
      app.post('/make-directory', function(req, res){
        var fromUrl=req.headers.referer;
        //if the request came from this local site
        if(isSameHost(fromUrl)){
          var resJson={status:'error, no initial path provided',directory:''};
          if(req.body.hasOwnProperty('path')){
            var path=req.body.path;
            if(path.length>0){
              if(req.body.hasOwnProperty('mkdir')){
                var mkdir=req.body.mkdir;
                if(mkdir.length>0){
                  if(path.lastIndexOf('/')===path.length-'/'.length){
                    path=path.substring(0, path.length-'/'.length);
                  }
                  //if the directory path exists
                  if(fs.existsSync(path)){
                    //if the path is a directory
                    if(fs.lstatSync(path).isDirectory()){
                      //if the new directory doesn't exist
                      if(!fs.existsSync(path+'/'+mkdir)){
                        //create the new directory
                        fs.mkdirSync(path+'/'+mkdir);
                        resJson['directory']=path+'/'+mkdir;
                        resJson['status']='ok';
                      }else{
                        resJson['status']='error, already exists, '+path+'/'+mkdir;
                      }
                    }else{
                      resJson['status']='error, '+path+' is not a directory';
                    }
                  }else{
                    resJson['status']='error, '+path+' does not exist';
                  }
                }else{
                  resJson['status']='error, blank new directory name';
                }
              }else{
                resJson['status']='error, new directory name not provided';
              }
            }else{
              resJson['status']='error, blank path';
            }
          }else{
            resJson['status']='error, path not provided';
          }
          res.send(JSON.stringify(resJson));
        }
      });
      //request to update the estimated amount of time that the project has been open in a browser
      app.post('/update-project-time-open', function(req, res){
        var fromUrl=req.headers.referer;
        //if the request came from this local site
        if(isSameHost(fromUrl)){
          var resJson={status:'error, no initial path provided'};
          if(req.body.hasOwnProperty('path')){
            if(req.body.hasOwnProperty('open_time')){
              var args={type:'update_open_time', open_time:req.body['open_time']};
              //also save the state of the recent projects order and filtering
              if(req.body.hasOwnProperty('ui_project_list')){
                args['ui_project_list']={};
                if(req.body['ui_project_list'].hasOwnProperty('filter_search')){
                  args['ui_project_list']['filter_search']=req.body['ui_project_list']['filter_search'];
                }
                if(req.body['ui_project_list'].hasOwnProperty('order_by')){
                  args['ui_project_list']['order_by']=req.body['ui_project_list']['order_by'];
                }
                if(req.body['ui_project_list'].hasOwnProperty('asc_desc')){
                  args['ui_project_list']['asc_desc']=req.body['ui_project_list']['asc_desc'];
                }
              }
              //update recent projects json file
              resJson['status']=updateRecentProjects(req.body['path'], args);
              //set a new open time (now) since the time, up-to now, has been updated
              resJson['open_time']=getDateStr();
            }else{
              resJson['status']='error, no start time, open_time, specified';
            }
          }
          res.send(JSON.stringify(resJson));
        }
      });
      //request to browse file system
      app.post('/browse-project-files', function(req, res){
        var fromUrl=req.headers.referer;
        //if the request came from this local site
        if(isSameHost(fromUrl)){
          var resJson={status:'error, no initial path provided'};
          if(req.body.hasOwnProperty('path')){
            var path=req.body.path;
            if(path.length<1){
              var args=getQs(fromUrl);
              if(args.hasOwnProperty('file')){
                path=args.file;
                path=decodeURIComponent(path);
                //strip off the file name to get just the directory path
                if(path.indexOf('/')!==-1){
                  path=path.substring(0, path.lastIndexOf('/'));
                }
              }else if(args.hasOwnProperty('dir')){
                path=args.dir;
                path=decodeURIComponent(path);
                //make sure the directory doesn't end with /
                if(path.lastIndexOf('/')===path.length-'/'.length){
                  path=path.substring(0, path.lastIndexOf('/'));
                }
              }
            }
            if(path.length>0){
              //if the directory path exists
              if(fs.existsSync(path)){
                //if the path does not describe a directory
                var pathFile='';
                if(!fs.lstatSync(path).isDirectory()){
                  //trim the pathFile off of the directory path
                  if(path.indexOf('/')!==-1){
                    pathFile=path.substring(path.lastIndexOf('/')+'/'.length);
                    path=path.substring(0, path.lastIndexOf(pathFile));
                  }
                  if(pathFile==='/'){pathFile='';}
                }
                resJson['status']='ok';
                if(path.lastIndexOf('/')===path.length-'/'.length){
                  path=path.substring(0, path.length-'/'.length);
                }
                resJson['path']=path;
                resJson['pathFile']=pathFile;
                resJson['files']=[];
                resJson['dirs']=[];
                resJson['filesData']={};
                //read the children of the directory
                var files = fs.readdirSync(path);
                for(var f=0;f<files.length;f++){
                  //if this is either an html file OR a directory
                  var type='file'; var isAllowed=false; var filesData={status:'',project:{}};
                  if(fs.lstatSync(path+'/'+files[f]).isDirectory()){ type='directory'; isAllowed=true; }
                  else{
                    var name=files[f];
                    if(name.indexOf('.')!==-1){
                      name=name.toLowerCase(); name=name.trim();
                      //if the file name ends with .html
                      if(name.lastIndexOf('.html')===name.length-'.html'.length){
                        isAllowed=true;
                        //read file contents to see if it contains project annotation data
                        var htmlStr=fs.readFileSync(path+'/'+files[f], 'utf8');
                        //if contains opening project tag
                        if(htmlStr.indexOf(startProjFiles)!==-1){
                          if(htmlStr.indexOf(endProjFiles)!==-1){
                            filesData['status']='ok';
                            filesData['project']=getProjectFilesJson(htmlStr);
                          }else{
                            filesData['status']='error, malformed; missing "'+endProjFiles+'"';
                          }
                        }else{
                          filesData['status']='error, malformed; missing "'+startProjFiles+'"';
                        }
                      }
                    }
                  }
                  //if either a directory OR an allowed project .html file type
                  if(isAllowed){
                    switch(type){
                      case 'file':
                        //set the return data
                        resJson['files'].push(files[f]);
                        resJson['filesData'][files[f]]=filesData;
                      break;
                      case 'directory':
                        //set the return data
                        resJson['dirs'].push(files[f]);
                      break;
                    }
                  }
                }
              }else{
                resJson['status']='error, '+path+' does not exist';
              }
            }
          }
          res.send(JSON.stringify(resJson));
        }
      });
      //request detection of the existence of a preview index.html file
      app.get('/preview-index-exists', function(req, res){
        var fromUrl=req.headers.referer;
        //if the request came from this local site
        if(isSameHost(fromUrl)){
          var ret={exists:false,href:'http://' + host + ':' + port + '/preview/index.html',status:'ok'};
          if(fs.existsSync('./preview/index.html')){
            ret['exists']=true;
          }
          //get the project HTML file path from the url
          res.send(JSON.stringify(ret));
        }
      });
      //request to open a project file
      app.get('/open-project', function(req, res){
        var fromUrl=req.headers.referer;
        //if the request came from this local site
        if(isSameHost(fromUrl)){
          var args=getQs(fromUrl);
          var resJson={isNewProject:false};
          if(args.hasOwnProperty('file')){
            //if the project file exists
            var fpath=decodeURIComponent(args.file);
            if(fs.existsSync(fpath)){
              //get the project json from the html contents
              var html=fs.readFileSync(fpath, 'utf8');
              var projJson=getProjectFilesJson(html);
              if(projJson!=undefined){
                //create the preview index.html
                setPreviewIndexHtml(html);
                //update the recent projects data
                updateRecentProjects(fpath, {type:'open'});
                //remove the project files json string from the html
                html=removeProjectFilesJson(html);
                //get the project name, if in the json
                if(projJson.hasOwnProperty('name')){
                  resJson['name']=projJson.name;
                }
                //get the project type, if in the json
                if(projJson.hasOwnProperty('type')){
                  resJson['type']=projJson['type'];
                }
                var filesJson={};
                //add the template.html file
                filesJson[templateKey]={path:fpath,content:''};
                //for each project file
                for(var f=0;f<projJson.files.length;f++){
                  var fJson={};
                  var pf=projJson.files[f];
                  var pfname=pf;
                  if(pfname.indexOf('/')!==-1){
                    pfname=pfname.substring(pfname.lastIndexOf('/')+'/'.length);
                  }
                  //if this name doesn't conflict with special template file name
                  if(templateKey!==pfname){
                    fJson['path']=pf;
                    //fJson['name']=pfname;
                    //try to get the chunk of content for this file
                    var splitContent=getSplitContent(html,pfname);
                    if(splitContent!=undefined){
                      var pfcontent=splitContent[1];
                      //get the file content
                      fJson['content']=pfcontent;
                      //remove the content from the html template string
                      html=splitContent[0]+splitContent[2];
                    }else{
                      //this project file doesn't actually have content inside the html
                      fJson['content']='';
                    }
                    filesJson[pf]=fJson;
                  }
                }
                filesJson[templateKey]['content']=html;
                resJson['files']=filesJson;
                //if this file is being opened now (not already open as an unsaved new file)
                if(openTimestamp==undefined){
                  resJson['open_time']=getDateStr();
                }else{
                  //there is a cached open_time for this file (already opened as an unsaved file)
                  resJson['open_time']=openTimestamp;
                  openTimestamp=undefined;
                }
                resJson['status']='ok';
              }else{
                //project data not in the file
                resJson['status']='error, no embedded project data';
              }
            }else{
              //project file doesn't exist
              resJson['status']='error, file does\'t exist';
            }
            //send project data back to the page
            res.send(JSON.stringify(resJson));
          //else probably opening a new, unsaved project (if there is a dir query string param in the url)
          }else if(args.hasOwnProperty('dir')){
            resJson['isNewProject']=true;
            var defaultName='[new-project]';
            var content=getDefaultTemplateHtml(defaultName);
            var filesJson={};
            filesJson[templateKey]={path:'[template]',content:content};
            resJson['name']=defaultName;
            resJson['files']=filesJson;
            resJson['open_time']=getDateStr();
            resJson['status']='ok';
            //send project data back to the page
            res.send(JSON.stringify(resJson));
          }
        }else{
          //request from unkown source... shhhh...
        }
      });

      var server = app.listen(port, function () {
        console.log('Listening at http://%s:%s', host, port);
        if(isDir){ console.log('Current directory --> ' + file); }
        else{ console.log('Editing --> ' + file); }
        console.log('Open --> '+url);

        openBrowser(url);
      });
    }else{
      console.log(errMsg);
    }
  }else{
    console.log('"'+file+'" does\'t exist.');
  }
}else{
  console.log('Open which HTML file or a directory?');
}
