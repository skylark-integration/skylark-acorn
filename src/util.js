define(function () {
    'use strict';
    const {hasOwnProperty, toString} = Object.prototype;
    const hasOwn = Object.hasOwn || ((obj, propName) => hasOwnProperty.call(obj, propName));
    const isArray = Array.isArray || (obj => toString.call(obj) === '[object Array]');
    function wordsRegexp(words) {
        return new RegExp('^(?:' + words.replace(/ /g, '|') + ')$');
    }
    function codePointToString(code) {
        if (code <= 65535)
            return String.fromCharCode(code);
        code -= 65536;
        return String.fromCharCode((code >> 10) + 55296, (code & 1023) + 56320);
    }
    const loneSurrogate = /[\uD800-\uDFFF]/u;
    return {
        hasOwn: hasOwn,
        isArray: isArray,
        wordsRegexp: wordsRegexp,
        codePointToString: codePointToString,
        loneSurrogate: loneSurrogate
    };
});