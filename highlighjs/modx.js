/**
 * MODX Revolution + Fenom + FastField
 * Highlight.js Language Definition
 *
 * Supports:
 *  • HTML
 *  • MODX Revolution Tags
 *  • Fenom Templates
 *  • FastField
 *  • Nested MODX
 *  • Output Filters
 *  • Bindings
 *
 * Designed for Highlight.js v11+
 * By daemon.devin 
 */

export default function (hljs) {

    const XML = hljs.getLanguage("xml");

    if (!XML) {
        throw new Error(
            "The MODX language requires the XML language to be registered first.");
    }

    const source = (re) =>
    re instanceof RegExp ? re.source : re;

    const either = (...values) =>
    "(?:" + values.map(source).join("|") + ")";

    const words = (list) =>
    "\\b(?:" + list.join("|") + ")\\b";

    const optional = (value) =>
    "(?:" + source(value) + ")?";

    const lookahead = (value) =>
    "(?=" + source(value) + ")";

    const lookbehind = (value) =>
    "(?<=" + source(value) + ")";

    const IDENTIFIER =
        /[A-Za-z_][A-Za-z0-9_.-]*/;

    const NUMBER =
        /\b\d+(?:\.\d+)?\b/;

    const VARIABLE =
        /\$[A-Za-z_][A-Za-z0-9_.]*/;

    const PROPERTY =
        /&[A-Za-z_][A-Za-z0-9_.-]*/;

    const FILTER =
        /:[A-Za-z_][A-Za-z0-9_-]*/;

    const PROPERTY_SET =
        /@[A-Za-z_][A-Za-z0-9_.-]*/;

    const PREFIXES = {
        tv: "\\*",
        setting: "\\+\\+",
        placeholder: "\\+",
        chunk: "\\-",
        lexicon: "%",
        link: "~",
        fastfield: "#"
    };

    // Fenom Keywords
    const FENOM_KEYWORDS = [
        "if",
        "elseif",
        "else",
        "foreach",
        "foreachelse",
        "for",
        "while",
        "switch",
        "case",
        "default",
        "break",
        "continue",
        "set",
        "unset",
        "capture",
        "block",
        "extends",
        "include",
        "insert",
        "import",
        "macro",
        "call",
        "literal",
        "ignore",
        "strip",
        "parent"
    ];

    // MODX Output Filters
    const OUTPUT_FILTERS = [
        "default",
        "empty",
        "notempty",
        "isempty",
        "isnotempty",
        "is",
        "eq",
        "neq",
        "gt",
        "gte",
        "lt",
        "lte",
        "contains",
        "icontains",
        "memberof",
        "between",
        "then",
        "else",
        "replace",
        "escape",
        "htmlentities",
        "htmlent",
        "stripTags",
        "stripString",
        "ucase",
        "lcase",
        "ucwords",
        "ucfirst",
        "reverse",
        "truncate",
        "ellipsis",
        "limit",
        "date",
        "strtotime",
        "dateformat",
        "nl2br",
        "md5",
        "sha1",
        "json_encode",
        "json_decode",
        "join",
        "split",
        "append",
        "prepend"
    ];

    let MODX_TAG;
    let FENOM_TAG;
    let BACKTICK_STRING;
    let PROPERTY_VALUE;
    let OUTPUT_FILTER;
    let FASTFIELD_TAG;

    const FENOM_COMMENT = {
        scope: "comment",
        begin: /\{\*/,
        end: /\*\}/
    };

    const OPERATOR = {
        scope: "operator",
        begin: /==|!=|<=|>=|\|\||&&|=>|=|:|\||\.|,|\+|-|\*|\/|%/
    };

    const IDENTIFIER_MODE = {
        scope: "title",
        begin: IDENTIFIER
    };

    const VARIABLE_MODE = {
        scope: "variable",
        begin: VARIABLE,
        contains: [{
                scope: "property",
                begin: /\.[A-Za-z_][A-Za-z0-9_]*/
            }
        ]
    };

    const SINGLE_QUOTE_STRING = {
        scope: "string",
        begin: /'/,
        end: /'/,
        contains: [
            hljs.BACKSLASH_ESCAPE
        ]
    };

    const DOUBLE_QUOTE_STRING = {
        scope: "string",
        begin: /"/,
        end: /"/,
        contains: [
            hljs.BACKSLASH_ESCAPE
        ]
    };

    BACKTICK_STRING = {
        scope: "string",
        begin: /`/,
        end: /`/,
        contains: [
            hljs.BACKSLASH_ESCAPE,
            MODX_TAG,
            FENOM_TAG,
            FASTFIELD_TAG
        ]
    };

    const PROPERTY_MODE = {
        scope: "attr",
        begin: PROPERTY
    };

    OUTPUT_FILTER = {
        scope: "keyword",
        begin: new RegExp(words(OUTPUT_FILTERS))
    };

    const MODX_BINDING = {
        scope: "built_in",
        begin: /@(FILE|INLINE|CHUNK|SELECT|CODE|EVAL|RESOURCE)\b/
    };

    const BOOLEAN = {
        scope: "literal",
        begin: /\b(true|false|null)\b/
    };

    let FENOM_EXPRESSION;
    let FENOM_ARGUMENTS;
    let FENOM_FUNCTION;
    let FENOM_MODIFIER;
    let FENOM_VARIABLE;
    let FENOM_BLOCK;

    FENOM_VARIABLE = {
        scope: "variable",
        begin: /\$/,
        end: /(?=[^\w.$\[\]-]|$)/,
        contains: [{
                scope: "title",
                begin: IDENTIFIER
            }, {
                scope: "property",
                begin: /\.[A-Za-z_][A-Za-z0-9_]*/
            }, {
                scope: "property",
                begin: /\[['"][^'"]+['"]\]/
            }, {
                scope: "number",
                begin: /\[\d+\]/
            }
        ]
    };

    FENOM_FUNCTION = {
        scope: "title.function",
        begin: IDENTIFIER,
        end: /\(/,
        excludeEnd: true
    };

    FENOM_MODIFIER = {
        scope: "built_in",
        begin: /\|/,
        end: /(?=[:|}\s])/,
        excludeBegin: true,
        contains: [{
                begin: IDENTIFIER
            }
        ]
    };

    FENOM_ARGUMENTS = {
        begin: /\(/,
        end: /\)/,
        contains: [
            NUMBER_MODE,
            BOOLEAN,
            VARIABLE_MODE,
            SINGLE_QUOTE_STRING,
            DOUBLE_QUOTE_STRING,
            OPERATOR,
            "self"
        ]
    };

    FENOM_EXPRESSION = {
        contains: [
            VARIABLE_MODE,
            NUMBER_MODE,
            BOOLEAN,
            IDENTIFIER_MODE,
            FENOM_FUNCTION,
            FENOM_ARGUMENTS,
            FENOM_MODIFIER,
            OPERATOR,
            SINGLE_QUOTE_STRING,
            DOUBLE_QUOTE_STRING
        ]
    };

    FENOM_BLOCK = {
        scope: "template-tag",
        begin: /\{/,
        end: /\}/,
        contains: [
            FENOM_COMMENT, {
                scope: "keyword",
                begin: new RegExp(words(FENOM_KEYWORDS))
            },
            FENOM_EXPRESSION
        ]
    };

    const FENOM_VARIABLE_BLOCK = {
        scope: "template-tag",
        begin: /\{\$/,
        end: /\}/,
        contains: [
            FENOM_VARIABLE,
            FENOM_MODIFIER,
            NUMBER_MODE,
            BOOLEAN,
            OPERATOR
        ]
    };

    const FENOM_CLOSE = {
        scope: "keyword",
        begin: /\{\/[A-Za-z]+\}/
    };

    FENOM_TAG = {
        contains: [
            FENOM_COMMENT,
            FENOM_VARIABLE_BLOCK,
            FENOM_CLOSE,
            FENOM_BLOCK
        ]
    };

    let MODX_TAG;
    let MODX_PROPERTY_VALUE;
    let MODX_PROPERTY;
    let MODX_FILTER;
    let MODX_ARGUMENT;
    let MODX_INNER;

    const MODX_OPEN = {
        scope: "punctuation",
        variants: [{
                begin: /\[\[/
            }, {
                begin: /\[\[!/
            }
        ]
    };

    const MODX_CLOSE = {
        scope: "punctuation",
        begin: /\]\]/
    };

    const TV = {
        scope: "variable",
        begin: /\*[A-Za-z_][\w.-]*/
    };

    const PLACEHOLDER = {
        scope: "variable",
        begin: /\+[A-Za-z_][\w.-]*/
    };

    const SYSTEM_SETTING = {
        scope: "built_in",
        begin: /\+\+[A-Za-z_][\w.-]*/
    };

    const LEXICON = {
        scope: "string.special",
        begin: /\%[A-Za-z0-9_.-]+/
    };

    const RESOURCE_LINK = {
        scope: "link",
        begin: /\~(?:\d+|\[\[)/
    };

    const CHUNK = {
        scope: "title.class",
        begin: /\-[A-Za-z0-9_.-]+/
    };

    const SNIPPET = {
        scope: "title.function",
        begin: /\b[A-Za-z_][A-Za-z0-9_.-]*/
    };

    MODX_PROPERTY = {
        begin: /&/,
        contains: [{
                scope: "attr",
                begin: /[A-Za-z_][A-Za-z0-9_.-]*/
            }, {
                scope: "operator",
                begin: /=/
            }
        ]
    };

    MODX_FILTER = {
        begin: /:/,
        contains: [{
                scope: "keyword",
                begin: new RegExp(words(OUTPUT_FILTERS))
            }, {
                scope: "operator",
                begin: /=/
            }
        ]
    };

    MODX_PROPERTY_VALUE = {
        begin: /=/,
        contains: [
            BACKTICK_STRING,
            NUMBER_MODE,
            BOOLEAN,
            MODX_TAG,
            FENOM_TAG
        ]
    };

    MODX_INNER = {
        contains: [
            TV,
            PLACEHOLDER,
            SYSTEM_SETTING,
            RESOURCE_LINK,
            LEXICON,
            CHUNK,
            SNIPPET,
            MODX_PROPERTY,
            MODX_PROPERTY_VALUE,
            MODX_FILTER,
            NUMBER_MODE,
            BOOLEAN,
            FENOM_TAG
        ]
    };

    MODX_TAG = {
        scope: "template-tag",
        begin: /\[\[!?/,
        end: /\]\]/,
        contains: [
            MODX_INNER
        ]
    };

    const MODX_CONTENT = {
        contains: []
    };

    MODX_TAG = {
        scope: "template-tag",
        begin: /\[\[!?/,
        end: /\]\]/,
        contains: [
            MODX_CONTENT
        ]
    };

    MODX_CONTENT.contains = [
        MODX_TAG,
        FENOM_TAG,
        FASTFIELD_TAG,
        MODX_TV,
        MODX_SETTING,
        MODX_PLACEHOLDER,
        MODX_LEXICON,
        MODX_LINK,
        MODX_CHUNK,
        MODX_SNIPPET,
        MODX_PROPERTY,
        MODX_BINDING,
        MODX_BINDING_VALUE,
        NUMBER_MODE,
        BOOLEAN,
        BACKTICK_STRING
    ];

    FASTFIELD_TAG = {
        scope: "variable",
        begin: /\[\[#/,
        end: /\]\]/,
        contains: [
            NUMBER_MODE, {
                scope: "property",
                begin: /\.[A-Za-z_][A-Za-z0-9_.]*/
            },
            MODX_TAG
        ]
    };

    const MODX_TV = {
        scope: "variable.language.modx.tv",
        begin: /\*[A-Za-z_][A-Za-z0-9_.-]*/
    };

    const MODX_SETTING = {
        scope: "variable.language.modx.setting",
        begin: /\+\+[A-Za-z_][A-Za-z0-9_.-]*/
    };

    const MODX_PLACEHOLDER = {
        scope: "variable.language.modx.placeholder",
        begin: /\+[A-Za-z_][A-Za-z0-9_.-]*/
    };

    const MODX_LEXICON = {
        scope: "string.language.modx.lexicon",
        begin: /%[A-Za-z0-9_.-]+/
    };

    const MODX_LINK = {
        scope: "symbol.language.modx.link",
        begin: /~(?:\d+|\[\[)/
    };

    const MODX_CHUNK = {
        scope: "title.class.modx.chunk",
        begin: /-[A-Za-z0-9_.-]+/
    };

    const MODX_SNIPPET = {
        scope: "title.function.modx.snippet",
        begin: /\b[A-Za-z_][A-Za-z0-9_.-]*(?=\s*(?:\?|&|\]\]))/
    };

    MODX_PROPERTY = {
        begin: /&[A-Za-z_][A-Za-z0-9_.-]*/,
        scope: "attr.modx.property"
    };

    const MODX_BINDING = {
        scope: "meta.language.modx.binding",
        begin: /@(FILE|INLINE|CHUNK|SELECT|CODE|EVAL|RESOURCE)\b/
    };

    const MODX_BINDING_VALUE = {
        begin: /(?<=@(FILE|INLINE|CHUNK|SELECT|CODE|EVAL|RESOURCE)\s+)/,
        end: /(?=&|\]\])/,
        contains: [
            MODX_TAG,
            FENOM_TAG,
            FASTFIELD_TAG,
            hljs.APOS_STRING_MODE,
            hljs.QUOTE_STRING_MODE
        ]
    };

    // HTML/XML Integration
    const MODX_HTML = hljs.inherit(XML, {
        name: "MODX",
        aliases: [
            "modx",
            "modx-revolution",
            "tpl",
            "fenom"
        ],
    });

    const MODX_TEXT = {
        begin: /(?:\[\[|{)/,
        contains: [
            MODX_TAG,
            FENOM_TAG
        ]
    };

    const MODX_ATTRIBUTE = {
        begin: /(?:\[\[|{\$)/,
        contains: [
            MODX_TAG,
            FENOM_VARIABLE_BLOCK
        ]
    };

    MODX_HTML.contains = MODX_HTML.contains.map(mode => {
        if (!mode.contains) {
            return mode;
        }
        return hljs.inherit(mode, {
            contains: [
                ...(mode.contains || []),
                MODX_TEXT,
                MODX_ATTRIBUTE
            ]
        });
    });

    MODX_HTML.relevance = 0;
    MODX_HTML.contains.unshift({
        begin: /\[\[(?:!|\*|\+|\+|~|%|-|#)/,
        relevance: 10
    }, {
        begin: /\{\$[A-Za-z_]/,
        relevance: 5
    });

    return MODX_HTML;
}
