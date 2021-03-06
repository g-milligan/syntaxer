(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  //reused to get shader program object autocomplete options, for different __complete formats
  var getProgramOptions=function(){
    var str=getTabContents({include_ext:['js'],has_some:['gl.createProgram']});
    var ops=matchLeftFuncAssign(str,'program','gl\\.createProgram','g');
    return ops.sort();
  };


  //WEBGL JAVASCRIPT HINTS

  var gljshints={
   "gl.": {
      "__type":"object",
      "__summary":"The WebGLRenderingContext is the primary object used for interacting with webgl graphics. The context provides access to many native WebGL properties and methods.",
      "activeTexture(": {
         "__type": "function",
         ")": {}
      },
      "attachShader(": {
         "__type": "function",
         "__summary":"Attaches a WebGLShader object to a WebGLProgram object.",
         "__complete":[
           {program:{
             options: getProgramOptions,
             post:', ', type: 'object',
             summary: 'The WebGLProgram object created using the createProgram method.'
           }},
           {shader:{
             options:function(){
               var str=getTabContents({include_ext:['js'],has_some:['getShader']});
               var ops=matchLeftFuncAssign(str,'shader','getShader','g');
               return ops.sort();
             },
             post:')', type: 'object',
             summary: 'The WebGLShader object to attach.'
           }}
         ]
      },
      "bindAttribLocation(": {
         "__type": "function",
         ")": {}
      },
      "bindBuffer(": {
         "__type": "function",
         "__summary":"Associates a buffer with a buffer target.",
         "__complete":[
           {target:{
             options:function(){
               return ['gl.ARRAY_BUFFER','gl.ELEMENT_ARRAY_BUFFER'];
             },
             post:', ', type: 'number',
             summary: 'The target associated with the buffer object.'
           }},
           {buffer:{
             options:function(){
               var str=getTabContents({include_ext:['js'],has_some:['gl.createBuffer']});
               var ops=matchLeftFuncAssign(str,'buffer','gl\\.createBuffer','g');
               return ops.sort();
             },
             post:')', type: 'object',
             summary: 'A WebGLBuffer object to bind to target.'
           }}
         ]
      },
      "bindFramebuffer(": {
         "__type": "function",
         ")": {}
      },
      "bindRenderbuffer(": {
         "__type": "function",
         ")": {}
      },
      "bindTexture(": {
         "__type": "function",
         ")": {}
      },
      "blendColor(": {
         "__type": "function",
         ")": {}
      },
      "blendEquation(": {
         "__type": "function",
         ")": {}
      },
      "blendEquationSeparate(": {
         "__type": "function",
         ")": {}
      },
      "blendFunc(": {
         "__type": "function",
         ")": {}
      },
      "blendFuncSeparate(": {
         "__type": "function",
         ")": {}
      },
      "bufferData(": {
         "__type": "function",
         "__summary":"Creates a buffer in memory and initializes it with array data. If no array is provided, the contents of the buffer is initialized to 0.",
         "__complete":[
           {target:{
             options:function(){
               return ['gl.ARRAY_BUFFER','gl.ELEMENT_ARRAY_BUFFER'];
             },
             post:', ', type: 'number',
             summary: 'The target associated with the buffer object.'
           }},
           {sizeOrData:{
             options:function(){
               var str=getTabContents({include_ext:['js']});
               var ops=matchLeftArrayAssign(str,'vertices','g');
               ops=surroundOptions(ops.sort(), 'new Float32Array(', ')');
               return ops;
             },
             post:', ', type: 'number | ArrayBuffer',
             summary: '<strong>ArrayBuffer</strong>, An array of data points, or, <strong>number</strong>, the size of the buffer to initialize.'
           }},
           {usage:{
             options:function(){
               return ['gl.STATIC_DRAW','gl.DYNAMIC_DRAW','gl.STREAM_DRAW'];
             },
             post:')', type: 'number',
             summary: '<strong>gl.STATIC_DRAW</strong> The data store contents are modified once, and used many times as the source for WebGL drawing commands. <br /><strong>gl.DYNAMIC_DRAW</strong> The data store contents are repeatedly respecified, and used many times as the source for WebGL drawing commands. <br /><strong>gl.STREAM_DRAW</strong> The data store contents are specified once, and used occasionally as the source of a WebGL drawing command.'
           }}
         ]
      },
      "bufferSubData(": {
         "__type": "function",
         ")": {}
      },
      "checkFramebufferStatus(": {
         "__type": "function",
         ")": {}
      },
      "clear(": {
         "__type": "function",
         "__summary":"Sets all pixels in a specific buffer to the same value.",
         "__complete":[
           {mask:{
             options:function(){
               return [
                 'gl.DEPTH_BUFFER_BIT','gl.COLOR_BUFFER_BIT','gl.STENCIL_BUFFER_BIT',
                 'gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT', 'gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT',
                 'gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT',
                 'gl.STENCIL_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT'
              ];
             },
             post:')', type: 'number',
             summary: 'Pass one or more buffer bits in order to write to the related buffer. You can pass more than one value by separating each value with \'|\'. <br />For example: gl.clear(<strong>gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT</strong>);'
           }}
         ]
      },
      "clearColor(": {
         "__type": "function",
         "__summary":"Specifies color values to be used by the clear method to clear the color buffer.",
         "__complete":[
           {red:{
             options:function(){
               return ['0.0','0.1','0.2','0.3','0.4','0.5','0.6','0.7','0.8','0.9','1.0'];
             },
             post:', ', type: 'number',
             summary: 'The red component.'
           }},
           {blue:{
             options:function(){
               return ['0.0','0.1','0.2','0.3','0.4','0.5','0.6','0.7','0.8','0.9','1.0'];
             },
             post:', ', type: 'number',
             summary: 'The blue component.'
           }},
           {green:{
             options:function(){
               return ['0.0','0.1','0.2','0.3','0.4','0.5','0.6','0.7','0.8','0.9','1.0'];
             },
             post:', ', type: 'number',
             summary: 'The green component.'
           }},
           {alpha:{
             options:function(){
               return ['0.0','0.1','0.2','0.3','0.4','0.5','0.6','0.7','0.8','0.9','1.0'];
             },
             post:')', type: 'number',
             summary: 'The transparency component.'
           }}
         ]
      },
      "clearDepth(": {
         "__type": "function",
         ")": {}
      },
      "clearStencil(": {
         "__type": "function",
         ")": {}
      },
      "colorMask(": {
         "__type": "function",
         ")": {}
      },
      "compileShader(": {
         "__type": "function",
         ")": {}
      },
      "compressedTexImage2D(": {
         "__type": "function",
         ")": {}
      },
      "compressedTexSubImage2D(": {
         "__type": "function",
         ")": {}
      },
      "copyTexImage2D(": {
         "__type": "function",
         ")": {}
      },
      "copyTexSubImage2D(": {
         "__type": "function",
         ")": {}
      },
      "createBuffer(": {
         "__type": "function",
         ")": {}
      },
      "createFramebuffer(": {
         "__type": "function",
         ")": {}
      },
      "createProgram(": {
         "__type": "function",
         ")": {}
      },
      "createRenderbuffer(": {
         "__type": "function",
         ")": {}
      },
      "createShader(": {
         "__type": "function",
         ")": {}
      },
      "createTexture(": {
         "__type": "function",
         ")": {}
      },
      "cullFace(": {
         "__type": "function",
         ")": {}
      },
      "deleteBuffer(": {
         "__type": "function",
         ")": {}
      },
      "deleteFramebuffer(": {
         "__type": "function",
         ")": {}
      },
      "deleteProgram(": {
         "__type": "function",
         ")": {}
      },
      "deleteRenderbuffer(": {
         "__type": "function",
         ")": {}
      },
      "deleteShader(": {
         "__type": "function",
         ")": {}
      },
      "deleteTexture(": {
         "__type": "function",
         ")": {}
      },
      "depthFunc(": {
         "__type": "function",
         ")": {}
      },
      "depthMask(": {
         "__type": "function",
         ")": {}
      },
      "depthRange(": {
         "__type": "function",
         ")": {}
      },
      "detachShader(": {
         "__type": "function",
         ")": {}
      },
      "disable(": {
         "__type": "function",
         ")": {}
      },
      "disableVertexAttribArray(": {
         "__type": "function",
         ")": {}
      },
      "drawArrays(": {
         "__type": "function",
         "__summary":"Render geometric primitives from bound and enabled vertex data.",
         "__complete":[
           {mode:{
             options:function(){
               return [
                 'gl.POINTS','gl.LINES','gl.LINE_STRIP',
                 'gl.LINE_LOOP','gl.TRIANGLES','gl.TRIANGLE_STRIP',
                 'gl.TRIANGLE_FAN'
              ];
             },
             post:", ",type:"number",
             summary:"Specifies the kind of geometric primitives to render from a given set of vertex attributes."
           }},
           {first:{
             options:function(){
               return ['0'];
             },
             post:", ",type:"number",
             summary:"The first element to render in the array of vector points."
           }},
           {count:{
             options:function(){
               var str=getTabContents({include_ext:['js'],has_some:['gl.createBuffer']});
               var ops=matchLeftIntegerAssign(str,'4',1,4,'g');
               ops=reduceOptionsIfSomeContain(ops, 'numItems');
               return ops.sort();
             },
             post:")",type:"number",
             summary:"The number of vector points to render. For example, a triangle would be 3."
           }}
         ]
      },
      "drawElements(": {
         "__type": "function",
         ")": {}
      },
      "enable(": {
         "__type": "function",
         "__summary":"Turns on specific WebGL capabilities for this context.",
         "__complete":[
           {capability:{
             options:function(){
               return ['gl.BLEND','gl.DEPTH_TEST','gl.CULL_FACE','gl.POLYGON_OFFSET_FILL','gl.SCISSOR_TEST'];
             },
             post:")",type:"number",
             summary:"The capability to enable."
           }}
         ]
      },
      "enableVertexAttribArray(": {
         "__type": "function",
         "__summary":"Turns on a vertex attribute at a specific index position in a vertex attribute array.",
         "__complete":[
           {pointer:{
             options:function(){
               var str=getTabContents({include_ext:['js'],has_some:['gl.getAttribLocation']});
               var ops=matchLeftFuncAssign(str,'attrPointer','gl\\.getAttribLocation','g');
               return ops.sort();
             },
             post:")",type:"number",
             summary:"Index of the vertex attribute to enable."
           }}
         ]
      },
      "finish(": {
         "__type": "function",
         ")": {}
      },
      "flush(": {
         "__type": "function",
         ")": {}
      },
      "framebufferRenderbuffer(": {
         "__type": "function",
         ")": {}
      },
      "framebufferTexture2D(": {
         "__type": "function",
         ")": {}
      },
      "frontFace(": {
         "__type": "function",
         ")": {}
      },
      "generateMipmap(": {
         "__type": "function",
         ")": {}
      },
      "getActiveAttrib(": {
         "__type": "function",
         ")": {}
      },
      "getActiveUniform(": {
         "__type": "function",
         ")": {}
      },
      "getAttachedShaders(": {
         "__type": "function",
         ")": {}
      },
      "getAttribLocation(": {
         "__type": "function",
         "__summary":"Returns an index to the location in a program of a named attribute variable.",
         "__complete":[
           {program:{
             options: getProgramOptions,
             post:", ",type:"object",
             summary:"The program object."
           }},
           {attrName:{
             options:function(){
               var str=getTabContents({include_ext:['vert','frag'],has_some:['attribute']});
               var ops=matchFieldName(str, 'attrName', 'attribute', 'g');
               ops=surroundOptions(ops,'"','"');
               return ops.sort();
             },
             post:")",type:"string",
             summary:"The name of the attribute variable, as it appears in the shader program."
           }}
         ]
      },
      "getBufferParameter(": {
         "__type": "function",
         ")": {}
      },
      "getContextAttributes(": {
         "__type": "function",
         ")": {}
      },
      "getError(": {
         "__type": "function",
         ")": {}
      },
      "getExtension(": {
         "__type": "function",
         ")": {}
      },
      "getFramebufferAttachmentParameter(": {
         "__type": "function",
         ")": {}
      },
      "getParameter(": {
         "__type": "function",
         ")": {}
      },
      "getProgramParameter(": {
         "__type": "function",
         "__summary":"Returns the value of the program parameter that corresponds to a supplied pname for a given program, or null if an error occurs.",
         "__complete":[
           {program:{
             options: getProgramOptions,
             post:", ",type:"object",
             summary:"The program object to query for pname."
           }},
           {pname:{
             options:function(){
               return [
                 'gl.DELETE_STATUS','gl.LINK_STATUS','gl.VALIDATE_STATUS',
                 'gl.ATTACHED_SHADERS','gl.ACTIVE_ATTRIBUTES','gl.ACTIVE_UNIFORMS'
              ];
             },
             post:")",type:"number",
             summary:"The parameter constant."
           }}
         ]
      },
      "getProgramInfoLog(": {
         "__type": "function",
         ")": {}
      },
      "getRenderbufferParameter(": {
         "__type": "function",
         ")": {}
      },
      "getShaderParameter(": {
         "__type": "function",
         ")": {}
      },
      "getShaderInfoLog(": {
         "__type": "function",
         ")": {}
      },
      "getShaderPrecisionFormat(": {
         "__type": "function",
         ")": {}
      },
      "getShaderSource(": {
         "__type": "function",
         ")": {}
      },
      "getSupportedExtensions(": {
         "__type": "function",
         ")": {}
      },
      "getTexParameter(": {
         "__type": "function",
         ")": {}
      },
      "getUniform(": {
         "__type": "function",
         ")": {}
      },
      "getUniformLocation(": {
         "__type": "function",
         "__summary":"Returns a WebGLUniformLocation object for the location of a uniform variable within a WebGLProgram object.",
         "__complete":[
           {program:{
             options: getProgramOptions,
             post:", ",type:"object",
             summary:"The program object to query."
           }},
           {uniformName:{
             options:function(){
               var str=getTabContents({include_ext:['vert','frag'],has_some:['uniform']});
               var ops=matchFieldName(str, 'uniformName', 'uniform', 'g');
               ops=surroundOptions(ops,'"','"');
               return ops.sort();
             },
             post:")",type:"string",
             summary:"A string containing the name of the uniform variable, as it appears in the shader code."
           }}
         ]
      },
      "getVertexAttrib(": {
         "__type": "function",
         ")": {}
      },
      "getVertexAttribOffset(": {
         "__type": "function",
         ")": {}
      },
      "hint(": {
         "__type": "function",
         ")": {}
      },
      "isBuffer(": {
         "__type": "function",
         ")": {}
      },
      "isContextLost(": {
         "__type": "function",
         ")": {}
      },
      "isEnabled(": {
         "__type": "function",
         ")": {}
      },
      "isFramebuffer(": {
         "__type": "function",
         ")": {}
      },
      "isProgram(": {
         "__type": "function",
         ")": {}
      },
      "isRenderbuffer(": {
         "__type": "function",
         ")": {}
      },
      "isShader(": {
         "__type": "function",
         ")": {}
      },
      "isTexture(": {
         "__type": "function",
         ")": {}
      },
      "lineWidth(": {
         "__type": "function",
         ")": {}
      },
      "linkProgram(": {
         "__type": "function",
         "__summary":"Links an attached vertex shader and an attached fragment shader to a program so it can be used by the graphics processing unit (GPU).",
         "__complete":[
           {program:{
             options: getProgramOptions,
             post:")",type:"object",
             summary:"The program object to link."
           }}
         ]
      },
      "pixelStorei(": {
         "__type": "function",
         ")": {}
      },
      "polygonOffset(": {
         "__type": "function",
         ")": {}
      },
      "readPixels(": {
         "__type": "function",
         ")": {}
      },
      "renderbufferStorage(": {
         "__type": "function",
         ")": {}
      },
      "sampleCoverage(": {
         "__type": "function",
         ")": {}
      },
      "scissor(": {
         "__type": "function",
         ")": {}
      },
      "shaderSource(": {
         "__type": "function",
         ")": {}
      },
      "stencilFunc(": {
         "__type": "function",
         ")": {}
      },
      "stencilFuncSeparate(": {
         "__type": "function",
         ")": {}
      },
      "stencilMask(": {
         "__type": "function",
         ")": {}
      },
      "stencilMaskSeparate(": {
         "__type": "function",
         ")": {}
      },
      "stencilOp(": {
         "__type": "function",
         ")": {}
      },
      "stencilOpSeparate(": {
         "__type": "function",
         ")": {}
      },
      "texParameterf(": {
         "__type": "function",
         ")": {}
      },
      "texParameteri(": {
         "__type": "function",
         ")": {}
      },
      "texImage2D(": {
         "__type": "function",
         ")": {}
      },
      "texSubImage2D(": {
         "__type": "function",
         ")": {}
      },
      "uniform1f(": {
         "__type": "function",
         ")": {}
      },
      "uniform1fv(": {
         "__type": "function",
         ")": {}
      },
      "uniform1i(": {
         "__type": "function",
         ")": {}
      },
      "uniform1iv(": {
         "__type": "function",
         ")": {}
      },
      "uniform2f(": {
         "__type": "function",
         ")": {}
      },
      "uniform2fv(": {
         "__type": "function",
         ")": {}
      },
      "uniform2i(": {
         "__type": "function",
         ")": {}
      },
      "uniform2iv(": {
         "__type": "function",
         ")": {}
      },
      "uniform3f(": {
         "__type": "function",
         ")": {}
      },
      "uniform3fv(": {
         "__type": "function",
         ")": {}
      },
      "uniform3i(": {
         "__type": "function",
         ")": {}
      },
      "uniform3iv(": {
         "__type": "function",
         ")": {}
      },
      "uniform4f(": {
         "__type": "function",
         ")": {}
      },
      "uniform4fv(": {
         "__type": "function",
         ")": {}
      },
      "uniform4i(": {
         "__type": "function",
         ")": {}
      },
      "uniform4iv(": {
         "__type": "function",
         ")": {}
      },
      "uniformMatrix2fv(": {
         "__type": "function",
         ")": {}
      },
      "uniformMatrix3fv(": {
         "__type": "function",
         ")": {}
      },
      "uniformMatrix4fv(": {
         "__type": "function",
         "__summary":"Sets values for a 4x4 floating point vector matrix into a uniform location as a matrix or a matrix array.",
         "__complete":[
           {location:{
             options:function(){
               var str=getTabContents({include_ext:['js'],has_some:['gl.getUniformLocation']});
               var ops=matchLeftFuncAssign(str,'location','gl\\.getUniformLocation','g');
               return ops.sort();
             },
             post:", ",type:"WebGLUniformLocation",
             summary:"The location of uniform variable to be updated. Locate set by <strong>getUniformLocation</strong>."
           }},
           {transpose:{
             options:function(){
               return ['false','true'];
             },
             post:", ",type:"boolean",
             summary:"Sets whether to transpose the matrix as the values are loaded into the uniform variable. Must be set to gl.FALSE."
           }},
           {value:{
             options:function(){
               //var str=getTabContents({include_ext:['js'],has_some:['mat4.create('],});
               var str=getFileContent('.');
               var ops=matchLeftFuncAssign(str,'location','mat4\\.create','g');
               return ops.sort();
             },
             post:")",type:"Float32Array",
             summary:"An array of float values representing one or more 4x4 matrices."
           }}
         ]
      },
      "useProgram(": {
         "__type": "function",
         "__summary":"Set the program object to use for rendering.",
         "__complete":[
           {program:{
             options: getProgramOptions,
             post:")",type:"object",
             summary:"The program object."
           }}
         ]
      },
      "validateProgram(": {
         "__type": "function",
         ")": {}
      },
      "vertexAttrib1f(": {
         "__type": "function",
         ")": {}
      },
      "vertexAttrib1fv(": {
         "__type": "function",
         ")": {}
      },
      "vertexAttrib2f(": {
         "__type": "function",
         ")": {}
      },
      "vertexAttrib2fv(": {
         "__type": "function",
         ")": {}
      },
      "vertexAttrib3f(": {
         "__type": "function",
         ")": {}
      },
      "vertexAttrib3fv(": {
         "__type": "function",
         ")": {}
      },
      "vertexAttrib4f(": {
         "__type": "function",
         ")": {}
      },
      "vertexAttrib4fv(": {
         "__type": "function",
         ")": {}
      },
      "vertexAttribPointer(": {
         "__type": "function",
         "__summary":"The first argument is a pointer value, linked to a shader program field; used to tell the shader program to update one of its fields values.",
         "__complete":[
           {pointer:{
             options:function(){
               var str=getTabContents({include_ext:['js'],has_some:['gl.getAttribLocation']});
               var ops=matchLeftFuncAssign(str,'pointer','gl\\.getAttribLocation','g');
               return ops.sort();
             },
             post:', ', type: 'number',
             summary: 'Index of target attribute in the buffer bound to gl.ARRAY_BUFFER'
           }},
           {itemSize:{
             options:function(){
               var str=getTabContents({include_ext:['js'],has_some:['gl.createBuffer']});
               var ops=matchLeftIntegerAssign(str,'4',1,4,'g');
               ops=reduceOptionsIfSomeContain(ops, 'itemSize');
               return ops.sort();
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
             post:')', type: 'number',
             summary: 'Specifies an offset in bytes of the first component of the first vertex attribute in the array. Default is 0 which means that vertex attributes are tightly packed. Must be a multiple of type.'
           }}
         ]
      },
      "viewport(": {
         "__type": "function",
         "__summary":"Represents a rectangular viewable area that contains the rendering results of the drawing buffer.",
         "__complete":[
           {x:{
             options:function(){
               return ['0'];
             },
             post:', ', type: 'number',
             summary: 'The horizontal component of the viewport origin. Default is 0.'
           }},
           {y:{
             options:function(){
               return ['0'];
             },
             post:', ', type: 'number',
             summary: 'The vertical component of the viewport origin. Default is 0.'
           }},
           {width:{
             options:function(){
               return ['canvas.clientWidth'];
             },
             post:', ', type: 'number',
             summary: 'The width of the viewport. Default equals the width of the parent canvas (width).'
           }},
           {height:{
             options:function(){
               return ['canvas.clientHeight'];
             },
             post:')', type: 'number',
             summary: 'The height of the viewport. Default equals the height of the parent canvas (height).'
           }}
         ]
      }
    }
  };

  CodeMirror.registerHelper("hint", "gljs", function(editor, options) {
    //==NATIVE CONTEXT OBJECT HINTS==

    //load (if not already loaded) the actual preview/index.html into an iframe so that its window properties can be added to autocomplete
    loadPreviewIFrame(function(iframe){
      if(iframe.contentWindow){
        var addProps=function(prop,postFix){
          if(postFix==undefined){ postFix=''; }
          if(!hasJsonHintsKey(prop+postFix,gljshints)){
            if(iframe.contentWindow.hasOwnProperty(prop)){
              addJsonHints(prop+postFix, iframe.contentWindow[prop], gljshints);
            }
          }
        };
        addProps('vec3','.');
        addProps('mat3','.');
        addProps('mat4','.');
        addProps('quat4','.');
      }
    });
    //if these hints aren't already added
    if(!hasJsonHintsKey('gl.',gljshints)){
      //get a real webgl context object
      var canvas=document.createElement('canvas');
      var ctx=canvas.getContext('webgl')||canvas.getContext('experimental-webgl');
      //+++ctx=Object.getPrototypeOf(ctx);
      //add items that are found on a real gl object
      addJsonHints('gl.', ctx, gljshints);
    }
    //['=',';'] = an array of characters to consume up to in the line left of the cursor, BEFORE trying to match a hint info chain pattern
    return handleJsonHints(editor, gljshints, options.eventTrigger, ['=',';']);
  });
});
