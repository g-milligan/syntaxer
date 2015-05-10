(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  //WEBGL JAVASCRIPT HINTS

  var gljshints={
     "gl.": {
        "ARRAY_BUFFER": {
           "__type": "",
           "__summary": ""
        },
        "COLOR_BUFFER_BIT": {
           "__type": "",
           "__summary": ""
        },
        "DEPTH_BUFFER_BIT": {
           "__type": "",
           "__summary": ""
        },
        "DEPTH_TEST": {
           "__type": "",
           "__summary": ""
        },
        "FLOAT": {
           "__type": "",
           "__summary": ""
        },
        "LINK_STATUS": {
           "__type": "",
           "__summary": ""
        },
        "STATIC_DRAW": {
           "__type": "",
           "__summary": ""
        },
        "TRIANGLES": {
           "__type": "",
           "__summary": ""
        },
        "TRIANGLE_STRIP": {
           "__type": "",
           "__summary": ""
        },
        "attachShader": {
           "__type": "",
           "__summary": ""
        },
        "bindBuffer": {
           "__type": "",
           "__summary": ""
        },
        "bufferData": {
           "__type": "",
           "__summary": ""
        },
        "clear": {
           "__type": "",
           "__summary": ""
        },
        "clearColor": {
           "__type": "",
           "__summary": ""
        },
        "createBuffer": {
           "__type": "",
           "__summary": ""
        },
        "createProgram": {
           "__type": "",
           "__summary": ""
        },
        "drawArrays": {
           "__type": "",
           "__summary": "draw stuff"
        },
        "enable": {
           "__type": "",
           "__summary": ""
        },
        "enableVertexAttribArray": {
           "__type": "",
           "__summary": ""
        },
        "getAttribLocation": {
           "__type": "",
           "__summary": ""
        },
        "getProgramParameter": {
           "__type": "",
           "__summary": ""
        },
        "getUniformLocation": {
           "__type": "",
           "__summary": ""
        },
        "linkProgram": {
           "__type": "",
           "__summary": ""
        },
        "uniformMatrix4fv": {
           "__type": "",
           "__summary": ""
        },
        "useProgram": {
           "__type": "",
           "__summary": ""
        },
        "vertexAttribPointer": {
           "__type": "",
           "__summary": ""
        },
        "viewport": {
           "__type": "",
           "__summary": ""
        }
     }
  };

  CodeMirror.registerHelper("hint", "gljs", function(editor, options) {
    //init return vars
    //var list=["gl","getProgramParameter","graphics","getShader","getAttribLocation","getUniformLocation","green","get","getElementById"];
    //get the line before and after the cursor
    var lineSplit=getLineSplit(editor);
    var list=getAutocompleteOptions(lineSplit[0], gljshints);

    var cur = editor.getCursor(), curLine = editor.getLine(cur.line);
    var end = cur.ch, start = end;

    //return
    return {list: list,
      from: CodeMirror.Pos(cur.line, start),
      to: CodeMirror.Pos(cur.line, end)};
  });
});
