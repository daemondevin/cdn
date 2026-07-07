import {MODX_OUTPUT_FILTERS} from "./constants.js";
import {words} from "./utils.js";

export default function(hljs) {
    return {
        scope: "meta",
        begin: /:/,
        end: /(?=\]\]|&|\s)/,
        contains: [
            {
                scope: "keyword",
                begin: new RegExp(words(MODX_OUTPUT_FILTERS))
            },
            {
                scope: "operator",
                begin: /=/
            },
            {
                scope: "string",
                begin: /`/,
                end: /`/,
                contains: [
                    {
                        begin: /\[\[/,
                        end: /\]\]/,
                        contains: [
                            "self"
                        ]
                    }
                ]
            }
        ]
    };
}
