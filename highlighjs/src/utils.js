export function words(list) {
    return "\\b(" + list.join("|") + ")\\b";
}

export function identifier() {
    return "[A-Za-z_][A-Za-z0-9_.-]*";
}

export function variablePrefix() {
    return "(?:\\*|\\+|\\~|\\%|\\$|\\-|#)";
}

export function recursive(mode) {
    mode.contains ??= [];
    mode.contains.push("self");
    return mode;
}
