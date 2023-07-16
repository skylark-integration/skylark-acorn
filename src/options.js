define([
    './util',
    './locutil'
], function (m_util, m_locutil) {
    'use strict';
    const {hasOwn, isArray} = m_util;
    const {SourceLocation} = m_locutil;
    const defaultOptions = {
        ecmaVersion: null,
        sourceType: 'script',
        onInsertedSemicolon: null,
        onTrailingComma: null,
        allowReserved: null,
        allowReturnOutsideFunction: false,
        allowImportExportEverywhere: false,
        allowAwaitOutsideFunction: null,
        allowSuperOutsideMethod: null,
        allowHashBang: false,
        checkPrivateFields: true,
        locations: false,
        onToken: null,
        onComment: null,
        ranges: false,
        program: null,
        sourceFile: null,
        directSourceFile: null,
        preserveParens: false
    };
    let warnedAboutEcmaVersion = false;
    function getOptions(opts) {
        let options = {};
        for (let opt in defaultOptions)
            options[opt] = opts && hasOwn(opts, opt) ? opts[opt] : defaultOptions[opt];
        if (options.ecmaVersion === 'latest') {
            options.ecmaVersion = 100000000;
        } else if (options.ecmaVersion == null) {
            if (!warnedAboutEcmaVersion && typeof console === 'object' && console.warn) {
                warnedAboutEcmaVersion = true;
                console.warn('Since Acorn 8.0.0, options.ecmaVersion is required.\nDefaulting to 2020, but this will stop working in the future.');
            }
            options.ecmaVersion = 11;
        } else if (options.ecmaVersion >= 2015) {
            options.ecmaVersion -= 2009;
        }
        if (options.allowReserved == null)
            options.allowReserved = options.ecmaVersion < 5;
        if (!opts || opts.allowHashBang == null)
            options.allowHashBang = options.ecmaVersion >= 14;
        if (isArray(options.onToken)) {
            let tokens = options.onToken;
            options.onToken = token => tokens.push(token);
        }
        if (isArray(options.onComment))
            options.onComment = pushComment(options, options.onComment);
        return options;
    }
    function pushComment(options, array) {
        return function (block, text, start, end, startLoc, endLoc) {
            let comment = {
                type: block ? 'Block' : 'Line',
                value: text,
                start: start,
                end: end
            };
            if (options.locations)
                comment.loc = new SourceLocation(this, startLoc, endLoc);
            if (options.ranges)
                comment.range = [
                    start,
                    end
                ];
            array.push(comment);
        };
    }
    return {
        defaultOptions: defaultOptions,
        getOptions: getOptions
    };
});