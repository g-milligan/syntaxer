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
var express = require('express');
var openBrowser = require('open');
var app = express();
var fs = require('fs');
var bodyParser = require('body-parser'); //required for json post handling

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
    html=beforeClose+startProjFiles+jsonStr+endProjFiles+atClose;
  }
  return html;
};
//if there is a file path to open
if(file!==undefined&&file.trim().length>0){
  //if the file exists
  if(fs.existsSync(file)){
    //if this is a file not a directory
    if(fs.lstatSync(file).isFile()){
      //if the file ends in .html
      if(file.toLowerCase().lastIndexOf('.html')===file.length-'.html'.length){
        //get the file contents
        var htmlStr=fs.readFileSync(file, 'utf8');
        //if contains opening project tag
        if(htmlStr.indexOf(startProjFiles)!==-1){
          if(htmlStr.indexOf(endProjFiles)!==-1){
            //syntaxer root
            app.use(express.static(__dirname));
            app.use( bodyParser.json() ); // to support JSON-encoded bodies
            app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
              extended: true
            }));

            //open url
            var url='http://' + host + ':' + port + openFile;

            //function that makes sure ajax requests came from this same page
            var isSameHost=function(testUrl){
              var isSame=false;
              var fromUrlNoQs=testUrl;
              if(fromUrlNoQs.indexOf('?')!==-1){
                fromUrlNoQs=fromUrlNoQs.substring(0, fromUrlNoQs.indexOf('?'));
              }
              var thisUrl=url;
              if(thisUrl.lastIndexOf('/')==thisUrl.length-'/'.length){
                thisUrl=thisUrl.substring(0,thisUrl.length-'/'.length);
              }
              if(fromUrlNoQs.lastIndexOf('/')==fromUrlNoQs.length-'/'.length){
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

            //create the preview index.html file
            var setPreviewIndexHtml=function(html){
              if(!fs.existsSync('./preview/')){
                //create dist directory
                fs.mkdirSync('./preview/');
              }
              //write the preview html
              fs.writeFileSync('./preview/index.html', html);
            };
            //request to save project changes
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
                      path=decodeURIComponent(args.file);
                      if(path.indexOf('/')!==-1){
                        path=path.substring(0, path.lastIndexOf('/'));
                      }
                    }
                  }
                  if(path.length>0){
                    //if the directory path exists
                    if(fs.existsSync(path)){
                      resJson['status']='ok';
                      resJson['path']=path;
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
                      resJson['status']='error, "'+path+'" doesn\'t exist';
                    }
                  }
                }
                res.send(JSON.stringify(resJson));
              }
            });
            //request to save project changes
            app.post('/save-project', function(req, res){
              var fromUrl=req.headers.referer;
              //if the request came from this local site
              if(isSameHost(fromUrl)){
                var resJson={}; var numSaved=0;
                //if the preview file exists
                if(fs.existsSync('./preview/index.html')){
                  //read the existing file contents
                  var html=fs.readFileSync('./preview/index.html', 'utf8');
                  //update the html if the template.html layout was modified
                  if(req.body.files.hasOwnProperty('_.html')){
                    if(req.body.files['_.html'].hasOwnProperty('content')){
                      numSaved++;
                      //get the project json html
                      var jsonStr=getProjectFilesStr(html);
                      var json=JSON.parse(jsonStr);
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
                      var templateHtml=req.body.files['_.html']['content'];
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
                  //for each file to save
                  for(path in req.body.files){
                    if(req.body.files.hasOwnProperty(path)){
                      if(path!=='_.html'){
                        var fileJson=req.body.files[path];
                        if(fileJson.hasOwnProperty('content')){
                          numSaved++; var updatedContent=fileJson.content;
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
                          }
                        }
                      }
                    }
                  }
                  //if any files were modified
                  if(numSaved>0){
                    /*var plur='s';
                    if(numSaved===1){
                      plur='';
                    }
                    console.log('Saving (' + numSaved + ') embedded tab-section'+plur+'...');*/
                    //write the changes
                    fs.writeFileSync('./preview/index.html', html);
                  }
                  resJson['status']='ok';
                }else{
                  resJson['status']='error, preview-file / save-destination doesn\'t exist.';
                }
                resJson['count']=numSaved;
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
                if(args.hasOwnProperty('file')){
                  var resJson={};
                  //if the project file exists
                  var fpath=decodeURIComponent(args.file);
                  if(fs.existsSync(fpath)){
                    //get the project json from the html contents
                    var html=fs.readFileSync(fpath, 'utf8');
                    var projJson=getProjectFilesJson(html);
                    if(projJson!=undefined){
                      //create the preview index.html
                      setPreviewIndexHtml(html);
                      //remove the project files json string from the html
                      html=removeProjectFilesJson(html);
                      //get the project name, if in the json
                      if(projJson.hasOwnProperty('name')){
                        resJson['name']=projJson.name;
                      }
                      var filesJson={};
                      //add the template.html file
                      var templateFileKey='_.html';
                      filesJson[templateFileKey]={path:fpath,content:''};
                      //for each project file
                      for(var f=0;f<projJson.files.length;f++){
                        var fJson={};
                        var pf=projJson.files[f];
                        var pfname=pf;
                        if(pfname.indexOf('/')!==-1){
                          pfname=pfname.substring(pfname.lastIndexOf('/')+'/'.length);
                        }
                        //if this name doesn't conflict with special template file name
                        if(templateFileKey!==pfname){
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
                      filesJson[templateFileKey]['content']=html;
                      resJson['files']=filesJson;
                      resJson['status']='ok';
                    }else{
                      //project data not in the file
                      resJson['status']='error, no embedded project data';
                    }
                  }else{
                    //project file doesn't exist
                    resJson['status']='error, file does\'t exist';
                  }
                  //get the project HTML file path from the url
                  res.send(JSON.stringify(resJson));
                }
              }else{
                //request from unkown source... shhhh...
              }
            });

            var server = app.listen(port, function () {
              console.log('Listening at http://%s:%s', host, port);
              console.log('Editing --> ' + file);
              console.log('Open --> '+url);

              openBrowser(url);
            });

          }else{
            console.log('"'+file+'" malformed. Missing "'+endProjFiles+'"');
          }
        }else{
          console.log('"'+file+'" malformed. Missing "'+startProjFiles+'"');
        }
      }else{
        console.log('"'+file+'" is not an HTML file, ending with ".html". Open an HTML file instead.');
      }
    }else{
      console.log('"'+file+'" is not a file. Open an HTML file instead.');
    }
  }else{
    console.log('"'+file+'" does\'t exist.');
  }
}else{
  console.log('Open which HTML file?');
}
