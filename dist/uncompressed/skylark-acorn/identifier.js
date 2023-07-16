define([
    './generated/astralIdentifierCodes',
    './generated/astralIdentifierStartCodes',
    './generated/nonASCIIidentifierChars',
    './generated/nonASCIIidentifierStartChars'
], function (astralIdentifierCodes, astralIdentifierStartCodes, nonASCIIidentifierChars, nonASCIIidentifierStartChars) {
    'use strict';
    const reservedWords = {
        3: 'abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile',
        5: 'class enum extends super const export import',
        6: 'enum',
        strict: 'implements interface let package private protected public static yield',
        strictBind: 'eval arguments'
    };
    const ecma5AndLessKeywords = 'break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this';
    const keywords = {
        5: ecma5AndLessKeywords,
        '5module': ecma5AndLessKeywords + ' export import',
        6: ecma5AndLessKeywords + ' const class extends export import super'
    };
    const keywordRelationalOperator = /^in(stanceof)?$/;
    const nonASCIIidentifierStart = new RegExp('[' + nonASCIIidentifierStartChars + ']');
    const nonASCIIidentifier = new RegExp('[' + nonASCIIidentifierStartChars + nonASCIIidentifierChars + ']');
    function isInAstralSet(code, set) {
        let pos = 65536;
        for (let i = 0; i < set.length; i += 2) {
            pos += set[i];
            if (pos > code)
                return false;
            pos += set[i + 1];
            if (pos >= code)
                return true;
        }
        return false;
    }
    function isIdentifierStart(code, astral) {
        if (code < 65)
            return code === 36;
        if (code < 91)
            return true;
        if (code < 97)
            return code === 95;
        if (code < 123)
            return true;
        if (code <= 65535)
            return code >= 170 && nonASCIIidentifierStart.test(String.fromCharCode(code));
        if (astral === false)
            return false;
        return isInAstralSet(code, astralIdentifierStartCodes);
    }
    function isIdentifierChar(code, astral) {
        if (code < 48)
            return code === 36;
        if (code < 58)
            return true;
        if (code < 65)
            return false;
        if (code < 91)
            return true;
        if (code < 97)
            return code === 95;
        if (code < 123)
            return true;
        if (code <= 65535)
            return code >= 170 && nonASCIIidentifier.test(String.fromCharCode(code));
        if (astral === false)
            return false;
        return isInAstralSet(code, astralIdentifierStartCodes) || isInAstralSet(code, astralIdentifierCodes);
    }
    return {
        reservedWords: reservedWords,
        keywords: keywords,
        keywordRelationalOperator: keywordRelationalOperator,
        isIdentifierStart: isIdentifierStart,
        isIdentifierChar: isIdentifierChar
    };
});