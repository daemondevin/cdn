export default function(hljs) {
    return {
        scope: "template-tag",
        begin: /\[\[#/,
        end: /\]\]/,
        contains: [
            {
                scope: "number",
                begin: /\d+/
            },
            {
                scope: "property",
                begin: /\.[A-Za-z_][\w.]*/
            },
            {
                scope: "operator",
                begin: /:/
            },
            {
                scope: "string",
                begin: /`/,
                end: /`/
            },
            "self"
        ]
    };
}
