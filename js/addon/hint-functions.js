//get the line string before and after the cursor
function getLineSplit(editor){
  var cur=editor.getCursor();
  var cIndex=cur.ch;
  var lIndex=cur.line;
  var lStr=editor.getLine(lIndex);
  var preStr=lStr.substring(0, cIndex);
  var aftStr=lStr.substring(cIndex);
  return [preStr,aftStr];
}
function getAutocompleteOptions(lineBeforeCursor,hintsJson){
  var options=[];
  var getNextKeys=function(st,json,index){
    //figure out which start keys are in the str
    for(var key in json){
      if(json.hasOwnProperty(key)){
        if(key.indexOf('__')!==0){
          //this keyword follows the previous keyword?
          var isChained=false;
          if(index===0){
            if(st.indexOf(key)!==-1){
              isChained=true;
            }
          }else{
            if(st.indexOf(key)===0){
              isChained=true;
            }else{
              if(st.length<key.length){
                //if this st is incomplete and could be completed as this key
                if(key.indexOf(st)===0){
                  options.push(key);
                }
              }
            }
          }
          if(isChained){
            //remove this keyword from the string
            var shorterStr=st;
            shorterStr=shorterStr.substring(shorterStr.indexOf(key)+key.length);
            //if not at the cursor
            if(shorterStr.length>0){
              //recursive call
              getNextKeys(shorterStr,json[key],index+1);
            }else{
              //at the cursor... get each of the possible next items
              for(var subKey in json[key]){
                if(json[key].hasOwnProperty(subKey)){
                  if(subKey.indexOf('__')!==0){
                    options.push(subKey);
                  }
                }
              }
            }
          }
        }
      }
    }
  };
  getNextKeys(lineBeforeCursor,hintsJson,0);
  return options;
}
