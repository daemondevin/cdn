/**
 * MODX Hybrid (HTML + MODX Tags) for Highlight.js v11+
 */
export default function modx(hljs) {

    // MODX COMMENT TAG (highest priority)
    const MODX_COMMENT = {
        scope: 'comment',
        begin: /\[\[-/,
        end: /\]\]/,
        relevance: 10
    };

    // MODX TAG CORE
    const MODX_TAG = {
        scope: 'template-tag',
        begin: /\[\[(?!-)/, // exclude comment tags
        end: /\]\]/,
        contains: [
            // Uncached !
            {
                scope: 'meta',
                begin: /^!/
            },

            // LINK TAG [[~123]]
            {
                scope: 'link',
                begin: /~\d+/,
                relevance: 10
            },

            // LEXICON TAG [[%key]]
            {
                scope: 'quote',
                begin: /%[a-zA-Z_][\w\-]*/,
                relevance: 10
            },

            // SYSTEM SETTINGS [[++setting]]
            {
                scope: 'built_in',
                begin: /\+\+[a-zA-Z_][\w\-]*/
            },

            // CHUNKS [[$chunk]]
            {
                scope: 'title.class',
                begin: /\$[a-zA-Z_][\w\-]*/
            },

            // TV [[*tv]]
            {
                scope: 'variable',
                begin: /\*[a-zA-Z_][\w\-]*/
            },

            // PLACEHOLDER [[+placeholder]]
            {
                scope: 'variable',
                begin: /\+[a-zA-Z_][\w\-]*/
            },

            // SNIPPET / TAG NAME
            {
                scope: 'title.function',
                begin: /[a-zA-Z_][\w\-]*/,
                relevance: 5
            },

            // OUTPUT FILTERS :filter
            {
                scope: 'symbol',
                begin: /:[a-zA-Z_][\w\-]*/
            },

            // PARAMETERS &param=
            {
                scope: 'attr',
                begin: /&[a-zA-Z_][\w\-]*/,
                end: /=/,
                excludeEnd: true
            },

            // PROPERTY SETS @INLINE, @FILE
            {
                scope: 'meta-keyword',
                begin: /@[A-Z]+/
            },

            // STRINGS
            {
                scope: 'string',
                variants: [
                    { begin: /`/, end: /`/ },
                    { begin: /"/, end: /"/ }
                ]
            },

            // NUMBERS
            {
                scope: 'number',
                begin: /\b\d+\b/
            }
        ]
    };

    // HTML BASE
    const HTML = hljs.getLanguage('xml');

    return {
        name: 'MODX-HTML',
        aliases: ['modx-html', 'modx'],
        case_insensitive: true,
        contains: [
            // Comments FIRST (highest priority)
            MODX_COMMENT,

            // Then normal MODX tags
            MODX_TAG,

            // Then HTML
            ...(HTML ? HTML.contains : [])
        ]
    };
}
