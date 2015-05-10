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
           "__tooltip": ""
        },
        "BLEND": {
           "__type": "",
           "__tooltip": ""
        },
        "COLOR_ATTACHMENT0": {
           "__type": "",
           "__tooltip": ""
        },
        "COLOR_BUFFER_BIT": {
           "__type": "",
           "__tooltip": ""
        },
        "COMPILE_STATUS": {
           "__type": "",
           "__tooltip": ""
        },
        "DEPTH_ATTACHMENT": {
           "__type": "",
           "__tooltip": ""
        },
        "DEPTH_BUFFER_BIT": {
           "__type": "",
           "__tooltip": ""
        },
        "DEPTH_COMPONENT16": {
           "__type": "",
           "__tooltip": ""
        },
        "DEPTH_TEST": {
           "__type": "",
           "__tooltip": ""
        },
        "ELEMENT_ARRAY_BUFFER": {
           "__type": "",
           "__tooltip": ""
        },
        "FLOAT": {
           "__type": "",
           "__tooltip": ""
        },
        "FRAGMENT_SHADER": {
           "__type": "",
           "__tooltip": ""
        },
        "FRAMEBUFFER": {
           "__type": "",
           "__tooltip": ""
        },
        "LINEAR": {
           "__type": "",
           "__tooltip": ""
        },
        "LINEAR_MIPMAP_NEAREST": {
           "__type": "",
           "__tooltip": ""
        },
        "LINK_STATUS": {
           "__type": "",
           "__tooltip": ""
        },
        "NEAREST": {
           "__type": "",
           "__tooltip": ""
        },
        "ONE": {
           "__type": "",
           "__tooltip": ""
        },
        "RENDERBUFFER": {
           "__type": "",
           "__tooltip": ""
        },
        "RGBA": {
           "__type": "",
           "__tooltip": ""
        },
        "SRC_ALPHA": {
           "__type": "",
           "__tooltip": ""
        },
        "STATIC_DRAW": {
           "__type": "",
           "__tooltip": ""
        },
        "STREAM_DRAW": {
           "__type": "",
           "__tooltip": ""
        },
        "TEXTURE0": {
           "__type": "",
           "__tooltip": ""
        },
        "TEXTURE1": {
           "__type": "",
           "__tooltip": ""
        },
        "TEXTURE_2D": {
           "__type": "",
           "__tooltip": ""
        },
        "TEXTURE_MAG_FILTER": {
           "__type": "",
           "__tooltip": ""
        },
        "TEXTURE_MIN_FILTER": {
           "__type": "",
           "__tooltip": ""
        },
        "TRIANGLES": {
           "__type": "",
           "__tooltip": ""
        },
        "TRIANGLE_STRIP": {
           "__type": "",
           "__tooltip": ""
        },
        "UNPACK_FLIP_Y_WEBGL": {
           "__type": "",
           "__tooltip": ""
        },
        "UNSIGNED_BYTE": {
           "__type": "",
           "__tooltip": ""
        },
        "UNSIGNED_SHORT": {
           "__type": "",
           "__tooltip": ""
        },
        "VERTEX_SHADER": {
           "__type": "",
           "__tooltip": ""
        },
        "activeTexture": {
           "__type": "",
           "__tooltip": ""
        },
        "attachShader": {
           "__type": "",
           "__tooltip": ""
        },
        "bindBuffer": {
           "__type": "",
           "__tooltip": ""
        },
        "bindFramebuffer": {
           "__type": "",
           "__tooltip": ""
        },
        "bindRenderbuffer": {
           "__type": "",
           "__tooltip": ""
        },
        "bindTexture": {
           "__type": "",
           "__tooltip": ""
        },
        "blendFunc": {
           "__type": "",
           "__tooltip": ""
        },
        "bufferData": {
           "__type": "",
           "__tooltip": ""
        },
        "clear": {
           "__type": "",
           "__tooltip": ""
        },
        "clearColor": {
           "__type": "",
           "__tooltip": ""
        },
        "compileShader": {
           "__type": "",
           "__tooltip": ""
        },
        "createBuffer": {
           "__type": "",
           "__tooltip": ""
        },
        "createFramebuffer": {
           "__type": "",
           "__tooltip": ""
        },
        "createProgram": {
           "__type": "",
           "__tooltip": ""
        },
        "createRenderbuffer": {
           "__type": "",
           "__tooltip": ""
        },
        "createShader": {
           "__type": "",
           "__tooltip": ""
        },
        "createTexture": {
           "__type": "",
           "__tooltip": ""
        },
        "disable": {
           "__type": "",
           "__tooltip": ""
        },
        "drawArrays": {
           "__type": "",
           "__tooltip": ""
        },
        "drawElements": {
           "__type": "",
           "__tooltip": ""
        },
        "enable": {
           "__type": "",
           "__tooltip": ""
        },
        "enableVertexAttribArray": {
           "__type": "",
           "__tooltip": ""
        },
        "framebufferRenderbuffer": {
           "__type": "",
           "__tooltip": ""
        },
        "framebufferTexture2D": {
           "__type": "",
           "__tooltip": ""
        },
        "generateMipmap": {
           "__type": "",
           "__tooltip": ""
        },
        "getAttribLocation": {
           "__type": "",
           "__tooltip": ""
        },
        "getProgramParameter": {
           "__type": "",
           "__tooltip": ""
        },
        "getShaderInfoLog": {
           "__type": "",
           "__tooltip": ""
        },
        "getShaderParameter": {
           "__type": "",
           "__tooltip": ""
        },
        "getUniformLocation": {
           "__type": "",
           "__tooltip": ""
        },
        "linkProgram": {
           "__type": "",
           "__tooltip": ""
        },
        "pixelStorei": {
           "__type": "",
           "__tooltip": ""
        },
        "renderbufferStorage": {
           "__type": "",
           "__tooltip": ""
        },
        "shaderSource": {
           "__type": "",
           "__tooltip": ""
        },
        "texImage2D": {
           "__type": "",
           "__tooltip": ""
        },
        "texParameteri": {
           "__type": "",
           "__tooltip": ""
        },
        "uniform1f": {
           "__type": "",
           "__tooltip": ""
        },
        "uniform1i": {
           "__type": "",
           "__tooltip": ""
        },
        "uniform3f": {
           "__type": "",
           "__tooltip": ""
        },
        "uniform3fv": {
           "__type": "",
           "__tooltip": ""
        },
        "uniformMatrix3fv": {
           "__type": "",
           "__tooltip": ""
        },
        "uniformMatrix4fv": {
           "__type": "",
           "__tooltip": ""
        },
        "useProgram": {
           "__type": "",
           "__tooltip": ""
        },
        "vertexAttribPointer": {
           "__type": "",
           "__tooltip": ""
        },
        "viewport": {
           "__type": "",
           "__tooltip": ""
        }
     }
  };

  CodeMirror.registerHelper("hint", "gljs", function(editor, options) {
    return handleJsonHints(editor, gljshints);
  });
});
