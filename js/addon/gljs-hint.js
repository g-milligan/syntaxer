(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  //matchLeftFuncAssign(str,'defaultAutoCompleteVarName','functionName','g'?)

  //WEBGL JAVASCRIPT HINTS

  var gljshints={
    "gtest.":{"test":{}},
   "gl.": {
      "activeTexture": {
         "__type": "function",
         "();": {}
      },
      "attachShader": {
         "__type": "function",
         "__%":{
           program:function(){
             var str=getTabContents({include_ext:['js'],has_some:['gl.createProgram']});
             return matchLeftFuncAssign(str,'program','gl\\.createProgram','g');}
         },
         "(__%program,": {
           "__%":{
             shader:function(){
               var str=getTabContents({include_ext:['js'],has_some:['getShader']});
               return matchLeftFuncAssign(str,'shader','getShader','g');}
           },
           " __%shader);":{}
         }
      },
      "bindAttribLocation": {
         "__type": "function",
         "();": {}
      },
      "bindBuffer": {
         "__type": "function",
         "(gl.ARRAY_BUFFER,": {
           "__%":{
             buffer:function(){
               var str=getTabContents({include_ext:['js'],has_some:['gl.createBuffer']});
               return matchLeftFuncAssign(str,'buffer','gl\\.createBuffer','g');}
           },
           " __%buffer);":{}
         }
      },
      "bindFramebuffer": {
         "__type": "function",
         "();": {}
      },
      "bindRenderbuffer": {
         "__type": "function",
         "();": {}
      },
      "bindTexture": {
         "__type": "function",
         "();": {}
      },
      "blendColor": {
         "__type": "function",
         "();": {}
      },
      "blendEquation": {
         "__type": "function",
         "();": {}
      },
      "blendEquationSeparate": {
         "__type": "function",
         "();": {}
      },
      "blendFunc": {
         "__type": "function",
         "();": {}
      },
      "blendFuncSeparate": {
         "__type": "function",
         "();": {}
      },
      "bufferData": {
         "__type": "function",
         "(gl.ARRAY_BUFFER,": {
           "__%":{
             vertices:function(){
               var str=getTabContents({include_ext:['js']});
               return matchLeftArrayAssign(str, '/*vertices*/', 'g');
             }
           },
           " new Float32Array(__%vertices),":{
             " gl.STATIC_DRAW);":{}
           }
         }
      },
      "bufferSubData": {
         "__type": "function",
         "();": {}
      },
      "checkFramebufferStatus": {
         "__type": "function",
         "();": {}
      },
      "clear": {
         "__type": "function",
         "(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);": {}
      },
      "clearColor": {
         "__type": "function",
         "();": {}
      },
      "clearDepth": {
         "__type": "function",
         "();": {}
      },
      "clearStencil": {
         "__type": "function",
         "();": {}
      },
      "colorMask": {
         "__type": "function",
         "();": {}
      },
      "compileShader": {
         "__type": "function",
         "();": {}
      },
      "compressedTexImage2D": {
         "__type": "function",
         "();": {}
      },
      "compressedTexSubImage2D": {
         "__type": "function",
         "();": {}
      },
      "copyTexImage2D": {
         "__type": "function",
         "();": {}
      },
      "copyTexSubImage2D": {
         "__type": "function",
         "();": {}
      },
      "createBuffer": {
         "__type": "function",
         "();": {}
      },
      "createFramebuffer": {
         "__type": "function",
         "();": {}
      },
      "createProgram": {
         "__type": "function",
         "();": {}
      },
      "createRenderbuffer": {
         "__type": "function",
         "();": {}
      },
      "createShader": {
         "__type": "function",
         "();": {}
      },
      "createTexture": {
         "__type": "function",
         "();": {}
      },
      "cullFace": {
         "__type": "function",
         "();": {}
      },
      "deleteBuffer": {
         "__type": "function",
         "();": {}
      },
      "deleteFramebuffer": {
         "__type": "function",
         "();": {}
      },
      "deleteProgram": {
         "__type": "function",
         "();": {}
      },
      "deleteRenderbuffer": {
         "__type": "function",
         "();": {}
      },
      "deleteShader": {
         "__type": "function",
         "();": {}
      },
      "deleteTexture": {
         "__type": "function",
         "();": {}
      },
      "depthFunc": {
         "__type": "function",
         "();": {}
      },
      "depthMask": {
         "__type": "function",
         "();": {}
      },
      "depthRange": {
         "__type": "function",
         "();": {}
      },
      "detachShader": {
         "__type": "function",
         "();": {}
      },
      "disable": {
         "__type": "function",
         "();": {}
      },
      "disableVertexAttribArray": {
         "__type": "function",
         "();": {}
      },
      "drawArrays": {
         "__type": "function",
         "();": {}
      },
      "drawElements": {
         "__type": "function",
         "();": {}
      },
      "enable": {
         "__type": "function",
         "();": {}
      },
      "enableVertexAttribArray": {
         "__type": "function",
         "__%":{
           attrPointer:function(){
             var str=getTabContents({include_ext:['js'],has_some:['gl.getAttribLocation']});
             return matchLeftFuncAssign(str,'attrPointer','gl\\.getAttribLocation','g');}
         },
         "(__%attrPointer);":{}
      },
      "finish": {
         "__type": "function",
         "();": {}
      },
      "flush": {
         "__type": "function",
         "();": {}
      },
      "framebufferRenderbuffer": {
         "__type": "function",
         "();": {}
      },
      "framebufferTexture2D": {
         "__type": "function",
         "();": {}
      },
      "frontFace": {
         "__type": "function",
         "();": {}
      },
      "generateMipmap": {
         "__type": "function",
         "();": {}
      },
      "getActiveAttrib": {
         "__type": "function",
         "();": {}
      },
      "getActiveUniform": {
         "__type": "function",
         "();": {}
      },
      "getAttachedShaders": {
         "__type": "function",
         "();": {}
      },
      "getAttribLocation": {
         "__type": "function",
         "__%":{
           program:function(){
             var str=getTabContents({include_ext:['js'],has_some:['gl.createProgram']});
             return matchLeftFuncAssign(str,'program','gl\\.createProgram','g');}
         },
         "(__%program,":{
           "__%":{
             vertAttr:function(){
               var str=getTabContents({include_ext:['vert','frag'],has_some:['attribute']});
               return matchFieldName(str, 'vertAttr', 'attribute', 'g');
             }
           },
           " \"__%vertAttr\");":{}
         }
      },
      "getBufferParameter": {
         "__type": "function",
         "();": {}
      },
      "getContextAttributes": {
         "__type": "function",
         "();": {}
      },
      "getError": {
         "__type": "function",
         "();": {}
      },
      "getExtension": {
         "__type": "function",
         "();": {}
      },
      "getFramebufferAttachmentParameter": {
         "__type": "function",
         "();": {}
      },
      "getParameter": {
         "__type": "function",
         "();": {}
      },
      "getProgramParameter": {
         "__type": "function",
         "__%":{
           program:function(){
             var str=getTabContents({include_ext:['js'],has_some:['gl.createProgram']});
             return matchLeftFuncAssign(str,'program','gl\\.createProgram','g');}
         },
         "(__%program,": {
           " gl.LINK_STATUS);":{}
         }
      },
      "getProgramInfoLog": {
         "__type": "function",
         "();": {}
      },
      "getRenderbufferParameter": {
         "__type": "function",
         "();": {}
      },
      "getShaderParameter": {
         "__type": "function",
         "();": {}
      },
      "getShaderInfoLog": {
         "__type": "function",
         "();": {}
      },
      "getShaderPrecisionFormat": {
         "__type": "function",
         "();": {}
      },
      "getShaderSource": {
         "__type": "function",
         "();": {}
      },
      "getSupportedExtensions": {
         "__type": "function",
         "();": {}
      },
      "getTexParameter": {
         "__type": "function",
         "();": {}
      },
      "getUniform": {
         "__type": "function",
         "();": {}
      },
      "getUniformLocation": {
         "__type": "function",
         "__%":{
           program:function(){
             var str=getTabContents({include_ext:['js'],has_some:['gl.createProgram']});
             return matchLeftFuncAssign(str,'program','gl\\.createProgram','g');}
         },
         "(__%program,":{
           "__%":{
             uniformField:function(){
               var str=getTabContents({include_ext:['vert','frag'],has_some:['uniform']});
               return matchFieldName(str, 'uniformField', 'uniform', 'g');
             }
           },
           " \"__%uniformField\");":{}
         }
      },
      "getVertexAttrib": {
         "__type": "function",
         "();": {}
      },
      "getVertexAttribOffset": {
         "__type": "function",
         "();": {}
      },
      "hint": {
         "__type": "function",
         "();": {}
      },
      "isBuffer": {
         "__type": "function",
         "();": {}
      },
      "isContextLost": {
         "__type": "function",
         "();": {}
      },
      "isEnabled": {
         "__type": "function",
         "();": {}
      },
      "isFramebuffer": {
         "__type": "function",
         "();": {}
      },
      "isProgram": {
         "__type": "function",
         "();": {}
      },
      "isRenderbuffer": {
         "__type": "function",
         "();": {}
      },
      "isShader": {
         "__type": "function",
         "();": {}
      },
      "isTexture": {
         "__type": "function",
         "();": {}
      },
      "lineWidth": {
         "__type": "function",
         "();": {}
      },
      "linkProgram": {
         "__type": "function",
         "__%":{
           program:function(){
             var str=getTabContents({include_ext:['js'],has_some:['gl.createProgram']});
             return matchLeftFuncAssign(str,'program','gl\\.createProgram','g');}
         },
         "(__%program);": {}
      },
      "pixelStorei": {
         "__type": "function",
         "();": {}
      },
      "polygonOffset": {
         "__type": "function",
         "();": {}
      },
      "readPixels": {
         "__type": "function",
         "();": {}
      },
      "renderbufferStorage": {
         "__type": "function",
         "();": {}
      },
      "sampleCoverage": {
         "__type": "function",
         "();": {}
      },
      "scissor": {
         "__type": "function",
         "();": {}
      },
      "shaderSource": {
         "__type": "function",
         "();": {}
      },
      "stencilFunc": {
         "__type": "function",
         "();": {}
      },
      "stencilFuncSeparate": {
         "__type": "function",
         "();": {}
      },
      "stencilMask": {
         "__type": "function",
         "();": {}
      },
      "stencilMaskSeparate": {
         "__type": "function",
         "();": {}
      },
      "stencilOp": {
         "__type": "function",
         "();": {}
      },
      "stencilOpSeparate": {
         "__type": "function",
         "();": {}
      },
      "texParameterf": {
         "__type": "function",
         "();": {}
      },
      "texParameteri": {
         "__type": "function",
         "();": {}
      },
      "texImage2D": {
         "__type": "function",
         "();": {}
      },
      "texSubImage2D": {
         "__type": "function",
         "();": {}
      },
      "uniform1f": {
         "__type": "function",
         "();": {}
      },
      "uniform1fv": {
         "__type": "function",
         "();": {}
      },
      "uniform1i": {
         "__type": "function",
         "();": {}
      },
      "uniform1iv": {
         "__type": "function",
         "();": {}
      },
      "uniform2f": {
         "__type": "function",
         "();": {}
      },
      "uniform2fv": {
         "__type": "function",
         "();": {}
      },
      "uniform2i": {
         "__type": "function",
         "();": {}
      },
      "uniform2iv": {
         "__type": "function",
         "();": {}
      },
      "uniform3f": {
         "__type": "function",
         "();": {}
      },
      "uniform3fv": {
         "__type": "function",
         "();": {}
      },
      "uniform3i": {
         "__type": "function",
         "();": {}
      },
      "uniform3iv": {
         "__type": "function",
         "();": {}
      },
      "uniform4f": {
         "__type": "function",
         "();": {}
      },
      "uniform4fv": {
         "__type": "function",
         "();": {}
      },
      "uniform4i": {
         "__type": "function",
         "();": {}
      },
      "uniform4iv": {
         "__type": "function",
         "();": {}
      },
      "uniformMatrix2fv": {
         "__type": "function",
         "();": {}
      },
      "uniformMatrix3fv": {
         "__type": "function",
         "();": {}
      },
      "uniformMatrix4fv": {
         "__type": "function",
         "();": {}
      },
      "useProgram": {
         "__type": "function",
         "__%":{
           program:function(){
             var str=getTabContents({include_ext:['js'],has_some:['gl.createProgram']});
             return matchLeftFuncAssign(str,'program','gl\\.createProgram','g');}
         },
         "(__%program);": {}
      },
      "validateProgram": {
         "__type": "function",
         "();": {}
      },
      "vertexAttrib1f": {
         "__type": "function",
         "();": {}
      },
      "vertexAttrib1fv": {
         "__type": "function",
         "();": {}
      },
      "vertexAttrib2f": {
         "__type": "function",
         "();": {}
      },
      "vertexAttrib2fv": {
         "__type": "function",
         "();": {}
      },
      "vertexAttrib3f": {
         "__type": "function",
         "();": {}
      },
      "vertexAttrib3fv": {
         "__type": "function",
         "();": {}
      },
      "vertexAttrib4f": {
         "__type": "function",
         "();": {}
      },
      "vertexAttrib4fv": {
         "__type": "function",
         "();": {}
      },
      "vertexAttribPointer": {
         "__type": "function",
         "__complete":[
           {pointer:{
             options:function(){
               var str=getTabContents({include_ext:['js'],has_some:['gl.getAttribLocation']});
               return matchLeftFuncAssign(str,'pointer','gl\\.getAttribLocation','g');
             },
             pre:'(', post:', ', type: 'number',
             summary: 'Index of target attribute in the buffer bound to gl.ARRAY_BUFFER'
           }},
           {itemSize:{
             options:function(){
               var str=getTabContents({include_ext:['js']});
               return ['/*itemSize*/'];
             },
             post:', ', type: 'number',
             summary: 'The number of components per attribute. Must be 1,2,3,or 4. Default is 4.'
           }},
           {dataType:{
             options:function(){
               return ['gl.FLOAT','gl.FIXED'];
             },
             post:', ', type: 'number',
             summary: 'Specifies the data type of each component in the array.'
           }},
           {normalize:{
             options:function(){
               return ['false','true'];
             },
             post:', ', type: 'boolean',
             summary: 'FALSE = Values are converted to fixed point values when accessed. TRUE = Values are normalized when accessed.'
           }},
           {stride:{
             options:function(){
               return ['0'];
             },
             post:', ', type: 'number',
             summary: 'Specifies the offset in bytes between the beginning of consecutive vertex attributes. Default value is 0, maximum is 255. Must be a multiple of type.'
           }},
           {offset:{
             options:function(){
               return ['0'];
             },
             post:');', type: 'number',
             summary: 'Specifies an offset in bytes of the first component of the first vertex attribute in the array. Default is 0 which means that vertex attributes are tightly packed. Must be a multiple of type.'
           }}
         ]
      },
      "viewport": {
         "__type": "function",
         "(0, 0, canvas.clientWidth, canvas.clientHeight);": {}
      }
    }
  };

  CodeMirror.registerHelper("hint", "gljs", function(editor, options) {
    //==NATIVE CONTEXT OBJECT HINTS==
    //if these hints aren't already added
    if(!hasJsonHintsKey('gl.',gljshints)){
      //get a real webgl context object
      var canvas=document.createElement('canvas');
      var ctx=canvas.getContext('webgl')||canvas.getContext('experimental-webgl');
      //+++ctx=Object.getPrototypeOf(ctx);
      //add items that are found on a real gl object
      addJsonHints('gl.', ctx, gljshints);
    }
    //create the hints and any information related to the current code-line chain
    return handleJsonHints(editor, gljshints);
  });
});
