export const FenomComment = {
    scope: "comment",
    begin: /\{\*/,
    end: /\*\}/
};

export const FenomVariable = {
    scope: "variable",
    begin: /\{\$/,
    end: /\}/,
    contains: [
        {
            scope: "property",
            begin: /\.[A-Za-z_][A-Za-z0-9_]*/
        },
        {
            scope: "operator",
            begin: /\|/
        },
        {
            scope: "built_in",
            begin: /[A-Za-z_][A-Za-z0-9_]*/
        }
    ]
};
