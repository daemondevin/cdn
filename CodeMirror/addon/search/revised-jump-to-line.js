// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

// Revised jump to line plugin written by Devin Gaul
// Depends on the AdvancedDialog plugin

// Defines jumpToLine command.
((mod) => {
    if (typeof exports == "object" && typeof module == "object")
        // CommonJS
        mod(require("codemirror"), require("codemirror-advanceddialog"));
    else if (typeof define == "function" && define.amd)
        // AMD
        define(["codemirror", "codemirror-advanceddialog"], mod);
    // Plain browser env
    else mod(CodeMirror);
})((CodeMirror) => {
    "use strict";

    const jumpDialog = `
<div id="find" class="ui inverted borderless mini menu">
  <div class="ui jump search item">
    <div class="ui inverted mini transparent icon input">
      <i class="running icon"></i>
      <input id="CodeMirror-jump-field" type="text" placeholder="Jump To">
    </div>
  </div>
  <div class="divider"></div>
  <button class="ui mini icon button item" data-tooltip="Jump" data-inverted="" data-position="bottom center" data-variation="mini">
    <i class="arrow right icon"></i>
  </button>
  <div class="divider"></div>
  <span class="ui info small text item">Use line:column or scroll% syntax</span>
  <button class="ui right mini icon button item" data-tooltip="Close Dialog" data-inverted="" data-position="bottom right" data-variation="mini">
    <i class="close icon"></i>
  </button>
</div>
  `;

    let getJumpBehaviour = (cm, defaultText, callback) => {
        if (!defaultText) {
            defaultText = "";
        }
        let behaviour = {
            value: defaultText,
            focus: true,
            selectValueOnOpen: true,
            closeOnEnter: true,
            closeOnBlur: true,
            callback: (inputs, e) => {
                let posStr = inputs[0].value;
                if (!posStr) return;
                jumpToLine(cm, posStr);
            },
            onInput: (inputs, e) => {
                let posStr = inputs[0].value;
                if (!posStr) {
                    return;
                }
                jumpToLine(cm, posStr);
            }
        };
        if (!!callback) {
            behaviour.callback = callback;
        }
        return behaviour;
    };

    let interpretLine = (cm, string) => {
        const num = Number(string);
        if (/^[-+]/.test(string)) return cm.getCursor().line + num;
        else return num - 1;
    };

    let jumpToLine = (cm, posStr) => {
        if (!posStr) return;

        let match;
        if (match = /^\s*([\+\-]?\d+)\s*\:\s*(\d+)\s*$/.exec(posStr)) { // jshint ignore:line
            cm.setCursor(interpretLine(cm, match[1]), Number(match[2]));
        } else if (match = /^\s*([\+\-]?\d+(\.\d+)?)\%\s*/.exec(posStr)) { // jshint ignore:line
            let line = Math.round(cm.lineCount() * Number(match[1]) / 100);
            if (/^[-+]/.test(match[1])) line = cm.getCursor().line + line + 1;
            cm.setCursor(line - 1, cur.ch);
        } else if (match = /^\s*\:?\s*([\+\-]?\d+)\s*/.exec(posStr)) { // jshint ignore:line
            cm.setCursor(interpretLine(cm, match[1]), cm.getCursor().ch);
        }
    };

    let getJumpBtnBehaviour = (cm) => {
        return {
            callback: (inputs) => {
                let posStr = inputs[0].value;
                if (!posStr) return;
                jumpToLine(cm, posStr);
            }
        };
    };

    let closeBtnBehaviour = {
        callback: null
    };

    CodeMirror.commands.jumpToLine = function(cm) {
        let closeDialog = cm.openAdvancedDialog(jumpDialog, {
            inputBehaviours: [
                getJumpBehaviour(cm, (cm.getCursor().line + 1) + ":" + cm.getCursor().ch)
            ],
            buttonBehaviours: [
                getJumpBtnBehaviour(cm),
                closeBtnBehaviour
            ],
        });
        const boundHeight = document.body.getBoundingClientRect().height,
            boundTop = cm.getWrapperElement().getBoundingClientRect().top;
        cm.getWrapperElement().style.height =
            (boundHeight - boundTop - 26) + 'px';
    };
    CodeMirror.keyMap["default"]["Alt-G"] = "jumpToLine";
});
