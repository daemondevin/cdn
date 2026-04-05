/**
 * A hybrid highlight.js language definition for both MODX Revolution
 * and HTML with support for Fenom syntax and fastField tags.
 *
 * Covers:
 *   [[snippet]]              — snippets & cached calls
 *   [[!snippet]]             — uncached calls
 *   [[-comment]]             — MODX comments
 *   [[*tv]]                  — template variables
 *   [[+placeholder]]         — placeholders
 *   [[$chunk]]               — chunks
 *   [[++setting]]            — system settings
 *   [[~id]]                  — links / resource URLs
 *   [[%key]]                 — lexicon strings
 *   [[#field]]               — fastField syntax
 *   &param=`value`           — tag parameters
 *   :filter=`value`          — output filters / modifiers
 *   @INLINE / @CODE / @FILE  — inline chunk binding prefixes
 *   @TEMPLATE / @BINDING     — inline chunk binding prefixes
 *   {{+placeholder}}         — pdoTools fenom placeholders
 *   {{$chunk}}               — pdoTools fenom chunks
 *   {%key%}                  — pdoTools lexicon strings
 *   [PropertySet]            — property set syntax
 *   <tag>                    — HTML syntax
 *
 * @param {HLJSApi} hljs
 * @returns {LanguageDefinition}
 */
/*! `modx` grammar compiled for Highlight.js */
(() => {
    var modx = (() => {
        "use strict";
        return modx => {
            // Backtick string:  `any content`
            const BACKTICK_STRING = {
                scope: 'string',
                begin: /`/,
                end: /`/,
                contains: [], // no inner highlighting — content is literal
            };

            // Output modifier / filter chain:  :modifier  or  :modifier=`value`
            // e.g.  :default=`none`  :htmlent  :nl2br
            const OUTPUT_FILTER = {
                scope: 'built_in',
                begin: /:[a-zA-Z_][a-zA-Z0-9_]*/,
                end: /(?=\s*(?:&|\?|:|\]\]|$))/,
                contains: [BACKTICK_STRING],
            };

            // Tag parameter:  &name=`value`
            const PARAMETER = {
                scope: 'attr',
                begin: /&[a-zA-Z_][a-zA-Z0-9_-]*/,
                end: /(?=\s*(?:&|\?|:|\]\]|$))/,
                contains: [{
                        scope: 'operator',
                        match: /=/,
                    },
                    BACKTICK_STRING,
                ],
            };

            // Property set:  [MySet]  — appended to a tag name before params
            const PROPERTY_SET = {
                scope: 'meta',
                begin: /\[/,
                end: /\]/,
                contains: [{
                        scope: 'meta string',
                        match: /[a-zA-Z_][a-zA-Z0-9_-]*/,
                    },
                ],
            };

            // Inline binding prefix (used inside backtick values or as chunk prefix)
            // @INLINE  @CODE  @FILE  @TEMPLATE  @BINDING
            const BINDING_PREFIX = {
                scope: 'keyword',
                match: /@(?:INLINE|CODE|FILE|TEMPLATE|BINDING)\b/,
            };

            // Shared param/filter block used inside most tags
            const TAG_BODY_CONTAINS = [
                OUTPUT_FILTER,
                PARAMETER,
                PROPERTY_SET,
                BINDING_PREFIX,
                BACKTICK_STRING,
            ];

            // MODX comment tag  [[-  comment  ]]
            // Recognised before all other tags so it takes priority.
            const COMMENT_TAG = {
                scope: 'comment',
                begin: /\[\[\s*-/,
                end: /\]\]/,
                contains: [
                    hljs.inherit(hljs.COMMENT(), {
                        scope: 'comment'
                    }),
                ],
            };

            // Tag-type sigils
            // These appear immediately after [[ or [[! and identify what kind of tag
            // we're in. We colour them as punctuation so they're distinct from names.
            const makeSigil = (pattern) => ({
                scope: 'punctuation',
                match: pattern,
            });

            /**
             * Build a MODX tag mode.
             *
             * @param {string}       beginPattern   regex string for the opening bracket + sigil
             * @param {string}       nameScope      hljs scope for the tag name token
             * @param {RegExp}       namePattern    regex for the tag name
             * @param {object[]}     extraContains  any extra modes before the name
             */
            const makeTag = (beginPattern, nameScope, namePattern, extraContains = []) => ({
                scope: 'template-tag',
                begin: beginPattern,
                end: /\]\]/,
                beginScope: 'punctuation',
                endScope: 'punctuation',
                contains: [
                    // Uncached marker ! — styled as keyword so it stands out
                    {
                        scope: 'keyword',
                        match: /!/,
                    },
                    ...extraContains,
                    // Tag name / identifier
                    {
                        scope: nameScope,
                        match: namePattern,
                    },
                    ...TAG_BODY_CONTAINS,
                ],
            });

            // TV: [[*tv]]  [[!*tv]]
            const TV_TAG = makeTag(
                    /\[\[!?\s*\*/,
                    'variable', // [[*tvName]]
                    /[a-zA-Z_][a-zA-Z0-9_-]*/);

            // Placeholder: [[+key]]  [[!+key]]
            const PLACEHOLDER_TAG = makeTag(
                    /\[\[!?\s*\+/,
                    'symbol', // [[+placeholder]]
                    /[a-zA-Z_][a-zA-Z0-9_.+-]*/);

            // Chunk: [[$chunk]]  [[!$chunk]]
            const CHUNK_TAG = makeTag(
                    /\[\[!?\s*\$/,
                    'title.class', // [[$chunkName]]
                    /[a-zA-Z_][a-zA-Z0-9_-]*/,
                    [BINDING_PREFIX]// [[$@INLINE `...`]] pattern
                );

            // System setting: [[++setting]]  [[!++setting]]
            const SETTING_TAG = makeTag(
                    /\[\[!?\s*\+\+/,
                    'variable.constant', // [[++system.setting]]
                    /[a-zA-Z_][a-zA-Z0-9_.+-]*/);

            // Link / URL: [[~id]]  [[!~id]]  [[~[[*id]]]]
            const LINK_TAG = makeTag(
                    /\[\[!?\s*~/,
                    'number', // [[~42]]  [[~[[*id]]]]
                    /[\d]+|(?=[[\]])/// numeric id or nested tag
                );

            // Lexicon: [[%key]]  [[!%key]]
            const LEXICON_TAG = makeTag(
                    /\[\[!?\s*%/,
                    'string', // [[%error.not_found]]
                    /[a-zA-Z_][a-zA-Z0-9_.+-]*/);

            // fastField: [[#field]]  [[#id.field]]  [[#[[*id]].field]]
            const FASTFIELD_TAG = makeTag(
                    /\[\[!?\s*#/,
                    'attribute', // [[#pagetitle]]  [[#42.content]]
                    /[\d]*\.?[a-zA-Z_][a-zA-Z0-9_-]*/);

            // Snippet / general tag: [[SnippetName]]  [[!SnippetName]]
            // This is the catch-all; must come last so sigil-prefixed tags take priority.
            const SNIPPET_TAG = makeTag(
                    /\[\[!?\s*/,
                    'title.function', // [[snippetName]]
                    /[a-zA-Z_][a-zA-Z0-9_-]*/);

            // pdoTools / Fenom tag syntax
            // pdoTools introduces a Fenom template engine with its own tag wrappers.
            //
            // {$var}  — fenom variable
            const FENOM_VAR = {
                scope: 'template-variable',
                begin: /\{\$/,
                end: /\}/,
                beginScope: 'punctuation',
                endScope: 'punctuation',
                contains: [{
                        scope: 'variable',
                        match: /[a-zA-Z_][a-zA-Z0-9_.[\]'"-]*/,
                    },
                    OUTPUT_FILTER,
                ],
            };

            // {{+placeholder}}  — pdoTools placeholder (double-brace)
            const PDO_PLACEHOLDER = {
                scope: 'template-tag',
                begin: /\{\{\+/,
                end: /\}\}/,
                beginScope: 'punctuation',
                endScope: 'punctuation',
                contains: [{
                        scope: 'symbol',
                        match: /[a-zA-Z_][a-zA-Z0-9_.+-]*/,
                    },
                    OUTPUT_FILTER,
                    BACKTICK_STRING,
                ],
            };

            // {{$chunk}}  — pdoTools chunk call (double-brace)
            const PDO_CHUNK = {
                scope: 'template-tag',
                begin: /\{\{\$/,
                end: /\}\}/,
                beginScope: 'punctuation',
                endScope: 'punctuation',
                contains: [{
                        scope: 'title.class',
                        match: /[a-zA-Z_][a-zA-Z0-9_-]*/,
                    },
                    PARAMETER,
                    BACKTICK_STRING,
                ],
            };

            // {%key | default%}  — pdoTools lexicon string
            const PDO_LEXICON = {
                scope: 'template-tag',
                begin: /\{%/,
                end: /%\}/,
                beginScope: 'punctuation',
                endScope: 'punctuation',
                contains: [{
                        scope: 'string',
                        match: /[a-zA-Z_][a-zA-Z0-9_.+-]*/,
                    },
                ],
            };

            // {if}, {foreach}, {extends}, {block}, etc. — Fenom control tags
            // Styled as keyword so they're clearly distinct from data tags.
            const FENOM_CONTROL = {
                scope: 'keyword',
                begin: /\{(?:if|elseif|else|foreach|for|switch|case|default|break|continue|return|extends|block|use|capture|filter|set|unset|include|insert|cycle|macro|call)\b/,
                end: /\}/,
                contains: [
                    BACKTICK_STRING, {
                        scope: 'variable',
                        match: /\$[a-zA-Z_][a-zA-Z0-9_.]*/,
                    },
                    hljs.NUMBER_MODE,
                ],
            };

            // {* fenom comment *}
            const FENOM_COMMENT = {
                scope: 'comment',
                begin: /\{\*/,
                end: /\*\}/,
            };

            // HTML BASE
            const HTML = hljs.getLanguage('xml');

            // Language definition
            return {
                name: 'MODX',
                aliases: ['modx', 'modx-tag', 'modx-html'],
                case_insensitive: false,
                contains: [
                    // Comments must come first — highest priority
                    COMMENT_TAG,
                    FENOM_COMMENT,

                    // Sigil-prefixed MODX tags (specific → general)
                    SETTING_TAG, // [[++  must precede PLACEHOLDER_TAG ([[+)
                    TV_TAG, // [[*
                    PLACEHOLDER_TAG, // [[+
                    CHUNK_TAG, // [[$
                    LINK_TAG, // [[~
                    LEXICON_TAG, // [[%
                    FASTFIELD_TAG, // [[#
                    SNIPPET_TAG, // [[  (catch-all, must be last)

                    // pdoTools / Fenom
                    FENOM_CONTROL,
                    FENOM_VAR,
                    PDO_PLACEHOLDER, // {{+  must precede PDO_CHUNK ({{$)
                    PDO_CHUNK, // {{$
                    PDO_LEXICON, // {%...%}

                    // Binding prefixes that appear outside a tag context
                    // (e.g. in a chunk's source field or inline template)
                    BINDING_PREFIX,

                    // Then HTML
                    ...(HTML ? HTML.contains : [])
                ],
            };
        }
    })();
    hljs.registerLanguage("modx", modx)
})();
