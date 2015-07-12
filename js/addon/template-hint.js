(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  //TEMPLATE SCAFFOLD HINTS

  var temhints={
  };

  CodeMirror.registerHelper("hint", "template", function(editor, options) {
    //['=',';'] = an array of characters to consume up to in the line left of the cursor, BEFORE trying to match a hint info chain pattern
    return handleJsonHints(editor, temhints, options.eventTrigger, ['>']);
  });
});
