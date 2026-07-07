import FastField from "./fastfield.js";
import OutputFilters from "./output-filters.js";

export default function (hljs, fenom) {

    const OUTPUT_FILTERS = OutputFilters(hljs);
    const FASTFIELD = FastField(hljs);

    const BACKTICK_STRING = {
        scope: "string",
        begin: /`/,
        end: /`/,
        contains: []
    };

    const NUMBER = {
        scope: "number",
        begin: /\b\d+\b/
    };

    const PROPERTY = {
        scope: "attr",
        begin: /&[A-Za-z_][\w.-]*/
    };

    const PROPERTY_SET = {
        scope: "type",
        begin: /@[A-Za-z_][\w.-]*/
    };

    const OPERATOR = {
        scope: "operator",
        begin: /=/
    };

    const TAG = {
        scope: "template-tag",
        begin: /\[\[/,
        end: /\]\]/,
        contains: []
    };

    const PREFIX = {
        scope: "symbol",
        variants: [
            { begin: /\*/ }, // TV
            { begin: /\+/ }, // System Setting
            { begin: /~/ }, // Link
            { begin: /%/ }, // Lexicon
            { begin: /\$/ }, // Placeholder
            { begin: /-/ }, // Chunk
            { begin: /#/ }, // FastField
        ]
    };

    const CACHE = {
        scope: "meta",
        variants: [
            { begin: /\[\[/ },
            { begin: /\[\[!/ }
        ]
    };

    const IDENTIFIER = {
        scope: "title",
        begin: /[A-Za-z_][\w.-]*/
    };

    const LINK = {
        scope: "number",
        begin: /~\d+/
    };

    const TV = {
        scope: "variable",
        begin: /\*[A-Za-z_][\w.-]*/
    };

    const PLACEHOLDER = {
        scope: "variable",
        begin: /\$[A-Za-z_][\w.-]*/
    };

    const LEXICON = {
        scope: "string",
        begin: /%[A-Za-z0-9_.-]+/
    };

    const SYSTEM_SETTING = {
        scope: "built_in",
        begin: /\+\+[A-Za-z0-9_.-]+/
    };

    const CHUNK = {
        scope: "title.class",
        begin: /-[A-Za-z0-9_.-]+/
    };

    BACKTICK_STRING.contains.push(
        TAG,
        FASTFIELD,
        fenom
    );

    const PROPERTY_VALUE = {
        begin: /=/,
        contains: [
            OPERATOR,
            BACKTICK_STRING,
            TAG,
            FASTFIELD,
            fenom,
            NUMBER
        ]
    };

    TAG.contains.push(
        CACHE,
        PREFIX,
        LINK,
        TV,
        PLACEHOLDER,
        SYSTEM_SETTING,
        LEXICON,
        CHUNK,
        PROPERTY_SET,
        IDENTIFIER,
        PROPERTY,
        PROPERTY_VALUE,
        OUTPUT_FILTERS,
        NUMBER,
        FASTFIELD,
        fenom,
        "self"
    );
    return TAG;
}
