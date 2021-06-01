  
// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

// Revised search plugin written by Jamie Morris
// Modified for use with Fomantic-UI by Devin Gaul

// Define search commands. Depends on advanceddialog.js
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

    const replaceDialog = `
<div id="replace" class="ui inverted borderless mini menu">
  <div class="ui find search item">
    <div class="ui inverted mini transparent icon input">
      <input id="CodeMirror-find-field" type="text" placeholder="Find">
    </div>
  </div>
  <div class="divider"></div>
  <div class="ui replace search item">
    <div class="ui inverted mini transparent icon input">
      <input id="CodeMirror-replace-field" type="text" placeholder="Replace">
    </div>
  </div>
  <div class="divider"></div>
  <button class="ui mini icon button item" data-tooltip="Previous" data-inverted="" data-position="bottom center" data-variation="mini">
    <i class="arrow left icon"></i>
  </button>
  <div class="divider"></div>
  <button class="ui mini icon button item" data-tooltip="Next" data-inverted="" data-position="bottom center" data-variation="mini">
    <i class="arrow right icon"></i>
  </button>
  <div class="divider"></div>
  <button class="ui mini icon button item" data-tooltip="Replace" data-inverted="" data-position="bottom center" data-variation="mini">
    <i class="redo icon"></i>
  </button>
  <div class="divider"></div>
  <button class="ui mini icon button item" data-tooltip="Replace All" data-inverted="" data-position="bottom center" data-variation="mini">
    <i class="sync icon"></i>
  </button>
  <div class="divider"></div>
  <span class="ui CodeMirror-search-count info small text item"></span>
  <button class="ui right mini icon button item" data-tooltip="Close Dialog" data-inverted="" data-position="bottom right" data-variation="mini">
    <i class="close icon"></i>
  </button>
</div>
  `;

    const findDialog = `
<div id="find" class="ui inverted borderless mini menu">
  <div class="ui find search item">
    <div class="ui inverted mini transparent icon input">
      <input id="CodeMirror-find-field" type="text" placeholder="Find">
    </div>
  </div>
  <div class="divider"></div>
  <button class="ui mini icon button item" data-tooltip="Previous" data-inverted="" data-position="bottom center" data-variation="mini">
    <i class="arrow left icon"></i>
  </button>
  <div class="divider"></div>
  <button class="ui mini icon button item" data-tooltip="Next" data-inverted="" data-position="bottom center" data-variation="mini">
    <i class="arrow right icon"></i>
  </button>
  <div class="divider"></div>
  <span class="ui CodeMirror-search-count info small text item"></span>
  <button class="ui right mini icon button item" data-tooltip="Close Dialog" data-inverted="" data-position="bottom right" data-variation="mini">
    <i class="close icon"></i>
  </button>
</div>
  `;

    let numMatches = 0;
    let searchOverlay = (query, caseInsensitive) => {
        if (typeof query == "string")
            query = new RegExp(
                query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"),
                caseInsensitive ? "gi" : "g"
            );
        else if (!query.global)
            query = new RegExp(query.source, query.ignoreCase ? "gi" : "g");

        return {
            token: (stream) => {
                query.lastIndex = stream.pos;
                const match = query.exec(stream.string);
                if (match && match.index === stream.pos) {
                    stream.pos += match[0].length || 1;
                    return "searching";
                } else if (match) {
                    stream.pos = match.index;
                } else {
                    stream.skipToEnd();
                }
            }
        };
    };

    function SearchState() {
        this.posFrom = this.posTo = this.lastQuery = this.query = null;
        this.overlay = null;
    }

    let getSearchState = (cm) => {
        return cm.state.search || (cm.state.search = new SearchState());
    };

    let queryCaseInsensitive = (query) => {
        return typeof query == "string" && query === query.toLowerCase();
    };

    let getSearchCursor = (cm, query, pos) => {
        // Heuristic: if the query string is all lowercase, do a case insensitive search.
        return cm.getSearchCursor(
            parseQuery(query),
            pos,
            queryCaseInsensitive(query)
        );
    };

    let parseString = (string) => {
        return string.replace(/\\(.)/g, (_, ch) => {
            if (ch === "n") return "\n";
            if (ch === "r") return "\r";
            return ch;
        });
    };

    let parseQuery = (query) => {
        if (query.exec) {
            return query;
        }
        const isRE = query.indexOf("/") === 0 && query.lastIndexOf("/") > 0;
        if (!!isRE) {
            try {
                let matches = query.match(/^\/(.*)\/([a-z]*)$/);
                query = new RegExp(
                    matches[1],
                    matches[2].indexOf("i") === -1 ? "" : "i"
                );
            } catch (e) {} // Not a regular expression after all, do a string search
        } else {
            query = parseString(query);
        }
        if (typeof query == "string" ? query === "" : query.test(""))
            query = /x^/;
        return query;
    };

    let startSearch = (cm, state, query) => {
        if (!query || query === "") return;
        state.queryText = query;
        state.query = parseQuery(query);
        cm.removeOverlay(state.overlay, queryCaseInsensitive(state.query));
        state.overlay = searchOverlay(
            state.query,
            queryCaseInsensitive(state.query)
        );
        cm.addOverlay(state.overlay);
        if (cm.showMatchesOnScrollbar) {
            if (state.annotate) {
                state.annotate.clear();
                state.annotate = null;
            }
            state.annotate = cm.showMatchesOnScrollbar(
                state.query,
                queryCaseInsensitive(state.query)
            );
        }
    };

    let doSearch = (cm, query, reverse, moveToNext) => {
        const hiding = null;
        const state = getSearchState(cm);
        if (query !== state.queryText) {
            startSearch(cm, state, query);
            state.posFrom = state.posTo = cm.getCursor();
        }
        if (moveToNext || moveToNext === undefined) {
            findNext(cm, reverse || false);
        }
        updateCount(cm);
    };

    let clearSearch = (cm) => {
        cm.operation(() => {
            const state = getSearchState(cm);
            state.lastQuery = state.query;
            if (!state.query) return;
            state.query = state.queryText = null;
            cm.removeOverlay(state.overlay);
            if (state.annotate) {
                state.annotate.clear();
                state.annotate = null;
            }
        });
    };

    let findNext = (cm, reverse, callback) => {
        cm.operation(() => {
            const state = getSearchState(cm);
            let cursor = getSearchCursor(
                cm,
                state.query,
                reverse ? state.posFrom : state.posTo
            );
            if (!cursor.find(reverse)) {
                cursor = getSearchCursor(
                    cm,
                    state.query,
                    reverse ? CodeMirror.Pos(cm.lastLine()) : CodeMirror.Pos(cm.firstLine(), 0)
                );
                if (!cursor.find(reverse)) return;
            }
            cm.setSelection(cursor.from(), cursor.to());
            cm.scrollIntoView(
                {
                    from: cursor.from(),
                    to: cursor.to()
                },
                20
            );
            state.posFrom = cursor.from();
            state.posTo = cursor.to();
            if (callback) callback(cursor.from(), cursor.to());
        });
    };

    let replaceNext = (cm, query, text) => {
        let cursor = getSearchCursor(cm, query, cm.getCursor("from"));
        let start = cursor.from();
        let match = cursor.findNext();
        if (!match) {
            cursor = getSearchCursor(cm, query);
            match = cursor.findNext();
            if (
                !match ||
                (start &&
                    cursor.from().line === start.line &&
                    cursor.from().ch === start.ch)
            )
                return;
        }
        cm.setSelection(cursor.from(), cursor.to());
        cm.scrollIntoView({
            from: cursor.from(),
            to: cursor.to()
        });
        cursor.replace(
            typeof query === "string" ? text : text.replace(/\$(\d)/g, (_, i) => {
                return match[i];
            })
        );
    };

    let replaceAll = (cm, query, text) => {
        cm.operation(() => {
            for (let cursor = getSearchCursor(cm, query); cursor.findNext(); ) {
                if (typeof query != "string") {
                    const match = cm
                        .getRange(cursor.from(), cursor.to())
                        .match(query);
                    cursor.replace(
                        text.replace(/\$(\d)/g, (_, i) => {
                            return match[i];
                        })
                    );
                } else cursor.replace(text);
            }
        });
    };

    let closeSearchCallback = (cm, state) => {
        if (state.annotate) {
            state.annotate.clear();
            state.annotate = null;
        }
        clearSearch(cm);
    };

    let getOnReadOnlyCallback = (callback) => {
        let closeFindDialogOnReadOnly = (cm, opt) => {
            if (opt === "readOnly" && !!cm.getOption("readOnly")) {
                callback();
                cm.off("optionChange", closeFindDialogOnReadOnly);
            }
        };
        return closeFindDialogOnReadOnly;
    };

    let updateCount = (cm) => {
        let state = getSearchState(cm);
        let value = cm.getDoc().getValue();
        let globalQuery;
        let queryText = state.queryText;

        if (!queryText || queryText === "") {
            resetCount(cm);
            return;
        }

        while (queryText.charAt(queryText.length - 1) === "\\") {
            queryText = queryText.substring(0, queryText.lastIndexOf("\\"));
        }

        if (typeof state.query === "string") {
            globalQuery = new RegExp(queryText, "ig");
        } else {
            globalQuery = new RegExp(
                state.query.source,
                state.query.flags + "g"
            );
        }

        let matches = value.match(globalQuery);
        let count = matches ? matches.length : 0;

        cm
            .getWrapperElement()
            .parentNode.querySelector(
            ".CodeMirror-search-count"
        ).innerHTML = count === 1 ? "1 match found." : count + " matches found.";
    };

    let resetCount = (cm) => {
        cm
            .getWrapperElement()
            .parentNode.querySelector(".CodeMirror-search-count").innerHTML =
            "";
    };

    let getFindBehaviour = (cm, defaultText, callback) => {
        if (!defaultText) {
            defaultText = "";
        }
        let behaviour = {
            value: defaultText,
            focus: true,
            selectValueOnOpen: true,
            closeOnEnter: false,
            closeOnBlur: false,
            callback: (inputs, e) => {
                let query = inputs[0].value;
                if (!query) return;
                doSearch(cm, query, !!e.shiftKey);
            },
            onInput: (inputs, e) => {
                let query = inputs[0].value;
                if (!query) {
                    resetCount(cm);
                    clearSearch(cm);
                    return;
                }
                doSearch(cm, query, !!e.shiftKey, false);
            }
        };
        if (!!callback) {
            behaviour.callback = callback;
        }
        return behaviour;
    };

    let getFindPrevBtnBehaviour = (cm) => {
        return {
            callback: (inputs) => {
                let query = inputs[0].value;
                if (!query) return;
                doSearch(cm, query, true);
            }
        };
    };

    let getFindNextBtnBehaviour = (cm) => {
        return {
            callback: (inputs) => {
                let query = inputs[0].value;
                if (!query) return;
                doSearch(cm, query, false);
            }
        };
    };

    let closeBtnBehaviour = {
        callback: null
    };

    CodeMirror.commands.find = (cm) => {
        if (cm.getOption("readOnly")) return;
        clearSearch(cm);
        let state = getSearchState(cm);
        const query = cm.getSelection() || getSearchState(cm).lastQuery;
        let closeDialog = cm.openAdvancedDialog(findDialog, {
            inputBehaviours: [getFindBehaviour(cm, query)],
            buttonBehaviours: [
                getFindPrevBtnBehaviour(cm),
                getFindNextBtnBehaviour(cm),
                closeBtnBehaviour
            ],
            onClose: () => {
                closeSearchCallback(cm, state);
            }
        });

        cm.on("optionChange", getOnReadOnlyCallback(closeDialog));
        startSearch(cm, state, query);
        updateCount(cm);

        const boundHeight = document.body.getBoundingClientRect().height,
            boundTop = cm.getWrapperElement().getBoundingClientRect().top;
        cm.getWrapperElement().style.height =
            (boundHeight - boundTop - 26) + 'px';

    };

    CodeMirror.commands.replace = (cm, all) => {
        if (cm.getOption("readOnly")) return;
        clearSearch(cm);

        let replaceNextCallback = (inputs) => {
            let query = parseQuery(inputs[0].value);
            let text = parseString(inputs[1].value);
            if (!query) return;
            replaceNext(cm, query, text);
            doSearch(cm, query);
        };

        let state = getSearchState(cm);
        let query = cm.getSelection() || state.lastQuery;
        let closeDialog = cm.openAdvancedDialog(replaceDialog, {
            inputBehaviours: [
                getFindBehaviour(cm, query, (inputs) => {
                    inputs[1].focus();
                    inputs[1].select();
                }),
                {
                    closeOnEnter: false,
                    closeOnBlur: false,
                    callback: replaceNextCallback
                }
            ],
            buttonBehaviours: [
                getFindPrevBtnBehaviour(cm),
                getFindNextBtnBehaviour(cm),
                {
                    callback: replaceNextCallback
                },
                {
                    callback: (inputs) => {
                        // Replace all
                        let query = parseQuery(inputs[0].value);
                        let text = parseString(inputs[1].value);
                        if (!query) return;
                        replaceAll(cm, query, text);
                    }
                },
                closeBtnBehaviour
            ],
            onClose: () => {
                closeSearchCallback(cm, state);
            }
        });

        cm.on("optionChange", getOnReadOnlyCallback(closeDialog));
        startSearch(cm, state, query);
        updateCount(cm);

        const boundHeight = document.body.getBoundingClientRect().height,
            boundTop = cm.getWrapperElement().getBoundingClientRect().top;
        cm.getWrapperElement().style.height =
            (boundHeight - boundTop - 26) + 'px';

    };
});
