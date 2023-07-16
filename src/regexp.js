define([
    './identifier',
    './state',
    './unicode-property-data',
    './util'
], function (m_identifier, m_state, UNICODE_PROPERTY_VALUES, m_util) {
    'use strict';
    const {isIdentifierStart, isIdentifierChar} = m_identifier;
    const {Parser} = m_state;
    const {hasOwn, codePointToString} = m_util;
    const pp = Parser.prototype;
    class RegExpValidationState {
        constructor(parser) {
            this.parser = parser;
            this.validFlags = `gim${ parser.options.ecmaVersion >= 6 ? 'uy' : '' }${ parser.options.ecmaVersion >= 9 ? 's' : '' }${ parser.options.ecmaVersion >= 13 ? 'd' : '' }${ parser.options.ecmaVersion >= 15 ? 'v' : '' }`;
            this.unicodeProperties = UNICODE_PROPERTY_VALUES[parser.options.ecmaVersion >= 14 ? 14 : parser.options.ecmaVersion];
            this.source = '';
            this.flags = '';
            this.start = 0;
            this.switchU = false;
            this.switchV = false;
            this.switchN = false;
            this.pos = 0;
            this.lastIntValue = 0;
            this.lastStringValue = '';
            this.lastAssertionIsQuantifiable = false;
            this.numCapturingParens = 0;
            this.maxBackReference = 0;
            this.groupNames = [];
            this.backReferenceNames = [];
        }
        reset(start, pattern, flags) {
            const unicodeSets = flags.indexOf('v') !== -1;
            const unicode = flags.indexOf('u') !== -1;
            this.start = start | 0;
            this.source = pattern + '';
            this.flags = flags;
            if (unicodeSets && this.parser.options.ecmaVersion >= 15) {
                this.switchU = true;
                this.switchV = true;
                this.switchN = true;
            } else {
                this.switchU = unicode && this.parser.options.ecmaVersion >= 6;
                this.switchV = false;
                this.switchN = unicode && this.parser.options.ecmaVersion >= 9;
            }
        }
        raise(message) {
            this.parser.raiseRecoverable(this.start, `Invalid regular expression: /${ this.source }/: ${ message }`);
        }
        at(i, forceU = false) {
            const s = this.source;
            const l = s.length;
            if (i >= l) {
                return -1;
            }
            const c = s.charCodeAt(i);
            if (!(forceU || this.switchU) || c <= 55295 || c >= 57344 || i + 1 >= l) {
                return c;
            }
            const next = s.charCodeAt(i + 1);
            return next >= 56320 && next <= 57343 ? (c << 10) + next - 56613888 : c;
        }
        nextIndex(i, forceU = false) {
            const s = this.source;
            const l = s.length;
            if (i >= l) {
                return l;
            }
            let c = s.charCodeAt(i), next;
            if (!(forceU || this.switchU) || c <= 55295 || c >= 57344 || i + 1 >= l || (next = s.charCodeAt(i + 1)) < 56320 || next > 57343) {
                return i + 1;
            }
            return i + 2;
        }
        current(forceU = false) {
            return this.at(this.pos, forceU);
        }
        lookahead(forceU = false) {
            return this.at(this.nextIndex(this.pos, forceU), forceU);
        }
        advance(forceU = false) {
            this.pos = this.nextIndex(this.pos, forceU);
        }
        eat(ch, forceU = false) {
            if (this.current(forceU) === ch) {
                this.advance(forceU);
                return true;
            }
            return false;
        }
        eatChars(chs, forceU = false) {
            let pos = this.pos;
            for (const ch of chs) {
                const current = this.at(pos, forceU);
                if (current === -1 || current !== ch) {
                    return false;
                }
                pos = this.nextIndex(pos, forceU);
            }
            this.pos = pos;
            return true;
        }
    }
    pp.validateRegExpFlags = function (state) {
        const validFlags = state.validFlags;
        const flags = state.flags;
        let u = false;
        let v = false;
        for (let i = 0; i < flags.length; i++) {
            const flag = flags.charAt(i);
            if (validFlags.indexOf(flag) === -1) {
                this.raise(state.start, 'Invalid regular expression flag');
            }
            if (flags.indexOf(flag, i + 1) > -1) {
                this.raise(state.start, 'Duplicate regular expression flag');
            }
            if (flag === 'u')
                u = true;
            if (flag === 'v')
                v = true;
        }
        if (this.options.ecmaVersion >= 15 && u && v) {
            this.raise(state.start, 'Invalid regular expression flag');
        }
    };
    pp.validateRegExpPattern = function (state) {
        this.regexp_pattern(state);
        if (!state.switchN && this.options.ecmaVersion >= 9 && state.groupNames.length > 0) {
            state.switchN = true;
            this.regexp_pattern(state);
        }
    };
    pp.regexp_pattern = function (state) {
        state.pos = 0;
        state.lastIntValue = 0;
        state.lastStringValue = '';
        state.lastAssertionIsQuantifiable = false;
        state.numCapturingParens = 0;
        state.maxBackReference = 0;
        state.groupNames.length = 0;
        state.backReferenceNames.length = 0;
        this.regexp_disjunction(state);
        if (state.pos !== state.source.length) {
            if (state.eat(41)) {
                state.raise("Unmatched ')'");
            }
            if (state.eat(93) || state.eat(125)) {
                state.raise('Lone quantifier brackets');
            }
        }
        if (state.maxBackReference > state.numCapturingParens) {
            state.raise('Invalid escape');
        }
        for (const name of state.backReferenceNames) {
            if (state.groupNames.indexOf(name) === -1) {
                state.raise('Invalid named capture referenced');
            }
        }
    };
    pp.regexp_disjunction = function (state) {
        this.regexp_alternative(state);
        while (state.eat(124)) {
            this.regexp_alternative(state);
        }
        if (this.regexp_eatQuantifier(state, true)) {
            state.raise('Nothing to repeat');
        }
        if (state.eat(123)) {
            state.raise('Lone quantifier brackets');
        }
    };
    pp.regexp_alternative = function (state) {
        while (state.pos < state.source.length && this.regexp_eatTerm(state));
    };
    pp.regexp_eatTerm = function (state) {
        if (this.regexp_eatAssertion(state)) {
            if (state.lastAssertionIsQuantifiable && this.regexp_eatQuantifier(state)) {
                if (state.switchU) {
                    state.raise('Invalid quantifier');
                }
            }
            return true;
        }
        if (state.switchU ? this.regexp_eatAtom(state) : this.regexp_eatExtendedAtom(state)) {
            this.regexp_eatQuantifier(state);
            return true;
        }
        return false;
    };
    pp.regexp_eatAssertion = function (state) {
        const start = state.pos;
        state.lastAssertionIsQuantifiable = false;
        if (state.eat(94) || state.eat(36)) {
            return true;
        }
        if (state.eat(92)) {
            if (state.eat(66) || state.eat(98)) {
                return true;
            }
            state.pos = start;
        }
        if (state.eat(40) && state.eat(63)) {
            let lookbehind = false;
            if (this.options.ecmaVersion >= 9) {
                lookbehind = state.eat(60);
            }
            if (state.eat(61) || state.eat(33)) {
                this.regexp_disjunction(state);
                if (!state.eat(41)) {
                    state.raise('Unterminated group');
                }
                state.lastAssertionIsQuantifiable = !lookbehind;
                return true;
            }
        }
        state.pos = start;
        return false;
    };
    pp.regexp_eatQuantifier = function (state, noError = false) {
        if (this.regexp_eatQuantifierPrefix(state, noError)) {
            state.eat(63);
            return true;
        }
        return false;
    };
    pp.regexp_eatQuantifierPrefix = function (state, noError) {
        return state.eat(42) || state.eat(43) || state.eat(63) || this.regexp_eatBracedQuantifier(state, noError);
    };
    pp.regexp_eatBracedQuantifier = function (state, noError) {
        const start = state.pos;
        if (state.eat(123)) {
            let min = 0, max = -1;
            if (this.regexp_eatDecimalDigits(state)) {
                min = state.lastIntValue;
                if (state.eat(44) && this.regexp_eatDecimalDigits(state)) {
                    max = state.lastIntValue;
                }
                if (state.eat(125)) {
                    if (max !== -1 && max < min && !noError) {
                        state.raise('numbers out of order in {} quantifier');
                    }
                    return true;
                }
            }
            if (state.switchU && !noError) {
                state.raise('Incomplete quantifier');
            }
            state.pos = start;
        }
        return false;
    };
    pp.regexp_eatAtom = function (state) {
        return this.regexp_eatPatternCharacters(state) || state.eat(46) || this.regexp_eatReverseSolidusAtomEscape(state) || this.regexp_eatCharacterClass(state) || this.regexp_eatUncapturingGroup(state) || this.regexp_eatCapturingGroup(state);
    };
    pp.regexp_eatReverseSolidusAtomEscape = function (state) {
        const start = state.pos;
        if (state.eat(92)) {
            if (this.regexp_eatAtomEscape(state)) {
                return true;
            }
            state.pos = start;
        }
        return false;
    };
    pp.regexp_eatUncapturingGroup = function (state) {
        const start = state.pos;
        if (state.eat(40)) {
            if (state.eat(63) && state.eat(58)) {
                this.regexp_disjunction(state);
                if (state.eat(41)) {
                    return true;
                }
                state.raise('Unterminated group');
            }
            state.pos = start;
        }
        return false;
    };
    pp.regexp_eatCapturingGroup = function (state) {
        if (state.eat(40)) {
            if (this.options.ecmaVersion >= 9) {
                this.regexp_groupSpecifier(state);
            } else if (state.current() === 63) {
                state.raise('Invalid group');
            }
            this.regexp_disjunction(state);
            if (state.eat(41)) {
                state.numCapturingParens += 1;
                return true;
            }
            state.raise('Unterminated group');
        }
        return false;
    };
    pp.regexp_eatExtendedAtom = function (state) {
        return state.eat(46) || this.regexp_eatReverseSolidusAtomEscape(state) || this.regexp_eatCharacterClass(state) || this.regexp_eatUncapturingGroup(state) || this.regexp_eatCapturingGroup(state) || this.regexp_eatInvalidBracedQuantifier(state) || this.regexp_eatExtendedPatternCharacter(state);
    };
    pp.regexp_eatInvalidBracedQuantifier = function (state) {
        if (this.regexp_eatBracedQuantifier(state, true)) {
            state.raise('Nothing to repeat');
        }
        return false;
    };
    pp.regexp_eatSyntaxCharacter = function (state) {
        const ch = state.current();
        if (isSyntaxCharacter(ch)) {
            state.lastIntValue = ch;
            state.advance();
            return true;
        }
        return false;
    };
    function isSyntaxCharacter(ch) {
        return ch === 36 || ch >= 40 && ch <= 43 || ch === 46 || ch === 63 || ch >= 91 && ch <= 94 || ch >= 123 && ch <= 125;
    }
    pp.regexp_eatPatternCharacters = function (state) {
        const start = state.pos;
        let ch = 0;
        while ((ch = state.current()) !== -1 && !isSyntaxCharacter(ch)) {
            state.advance();
        }
        return state.pos !== start;
    };
    pp.regexp_eatExtendedPatternCharacter = function (state) {
        const ch = state.current();
        if (ch !== -1 && ch !== 36 && !(ch >= 40 && ch <= 43) && ch !== 46 && ch !== 63 && ch !== 91 && ch !== 94 && ch !== 124) {
            state.advance();
            return true;
        }
        return false;
    };
    pp.regexp_groupSpecifier = function (state) {
        if (state.eat(63)) {
            if (this.regexp_eatGroupName(state)) {
                if (state.groupNames.indexOf(state.lastStringValue) !== -1) {
                    state.raise('Duplicate capture group name');
                }
                state.groupNames.push(state.lastStringValue);
                return;
            }
            state.raise('Invalid group');
        }
    };
    pp.regexp_eatGroupName = function (state) {
        state.lastStringValue = '';
        if (state.eat(60)) {
            if (this.regexp_eatRegExpIdentifierName(state) && state.eat(62)) {
                return true;
            }
            state.raise('Invalid capture group name');
        }
        return false;
    };
    pp.regexp_eatRegExpIdentifierName = function (state) {
        state.lastStringValue = '';
        if (this.regexp_eatRegExpIdentifierStart(state)) {
            state.lastStringValue += codePointToString(state.lastIntValue);
            while (this.regexp_eatRegExpIdentifierPart(state)) {
                state.lastStringValue += codePointToString(state.lastIntValue);
            }
            return true;
        }
        return false;
    };
    pp.regexp_eatRegExpIdentifierStart = function (state) {
        const start = state.pos;
        const forceU = this.options.ecmaVersion >= 11;
        let ch = state.current(forceU);
        state.advance(forceU);
        if (ch === 92 && this.regexp_eatRegExpUnicodeEscapeSequence(state, forceU)) {
            ch = state.lastIntValue;
        }
        if (isRegExpIdentifierStart(ch)) {
            state.lastIntValue = ch;
            return true;
        }
        state.pos = start;
        return false;
    };
    function isRegExpIdentifierStart(ch) {
        return isIdentifierStart(ch, true) || ch === 36 || ch === 95;
    }
    pp.regexp_eatRegExpIdentifierPart = function (state) {
        const start = state.pos;
        const forceU = this.options.ecmaVersion >= 11;
        let ch = state.current(forceU);
        state.advance(forceU);
        if (ch === 92 && this.regexp_eatRegExpUnicodeEscapeSequence(state, forceU)) {
            ch = state.lastIntValue;
        }
        if (isRegExpIdentifierPart(ch)) {
            state.lastIntValue = ch;
            return true;
        }
        state.pos = start;
        return false;
    };
    function isRegExpIdentifierPart(ch) {
        return isIdentifierChar(ch, true) || ch === 36 || ch === 95 || ch === 8204 || ch === 8205;
    }
    pp.regexp_eatAtomEscape = function (state) {
        if (this.regexp_eatBackReference(state) || this.regexp_eatCharacterClassEscape(state) || this.regexp_eatCharacterEscape(state) || state.switchN && this.regexp_eatKGroupName(state)) {
            return true;
        }
        if (state.switchU) {
            if (state.current() === 99) {
                state.raise('Invalid unicode escape');
            }
            state.raise('Invalid escape');
        }
        return false;
    };
    pp.regexp_eatBackReference = function (state) {
        const start = state.pos;
        if (this.regexp_eatDecimalEscape(state)) {
            const n = state.lastIntValue;
            if (state.switchU) {
                if (n > state.maxBackReference) {
                    state.maxBackReference = n;
                }
                return true;
            }
            if (n <= state.numCapturingParens) {
                return true;
            }
            state.pos = start;
        }
        return false;
    };
    pp.regexp_eatKGroupName = function (state) {
        if (state.eat(107)) {
            if (this.regexp_eatGroupName(state)) {
                state.backReferenceNames.push(state.lastStringValue);
                return true;
            }
            state.raise('Invalid named reference');
        }
        return false;
    };
    pp.regexp_eatCharacterEscape = function (state) {
        return this.regexp_eatControlEscape(state) || this.regexp_eatCControlLetter(state) || this.regexp_eatZero(state) || this.regexp_eatHexEscapeSequence(state) || this.regexp_eatRegExpUnicodeEscapeSequence(state, false) || !state.switchU && this.regexp_eatLegacyOctalEscapeSequence(state) || this.regexp_eatIdentityEscape(state);
    };
    pp.regexp_eatCControlLetter = function (state) {
        const start = state.pos;
        if (state.eat(99)) {
            if (this.regexp_eatControlLetter(state)) {
                return true;
            }
            state.pos = start;
        }
        return false;
    };
    pp.regexp_eatZero = function (state) {
        if (state.current() === 48 && !isDecimalDigit(state.lookahead())) {
            state.lastIntValue = 0;
            state.advance();
            return true;
        }
        return false;
    };
    pp.regexp_eatControlEscape = function (state) {
        const ch = state.current();
        if (ch === 116) {
            state.lastIntValue = 9;
            state.advance();
            return true;
        }
        if (ch === 110) {
            state.lastIntValue = 10;
            state.advance();
            return true;
        }
        if (ch === 118) {
            state.lastIntValue = 11;
            state.advance();
            return true;
        }
        if (ch === 102) {
            state.lastIntValue = 12;
            state.advance();
            return true;
        }
        if (ch === 114) {
            state.lastIntValue = 13;
            state.advance();
            return true;
        }
        return false;
    };
    pp.regexp_eatControlLetter = function (state) {
        const ch = state.current();
        if (isControlLetter(ch)) {
            state.lastIntValue = ch % 32;
            state.advance();
            return true;
        }
        return false;
    };
    function isControlLetter(ch) {
        return ch >= 65 && ch <= 90 || ch >= 97 && ch <= 122;
    }
    pp.regexp_eatRegExpUnicodeEscapeSequence = function (state, forceU = false) {
        const start = state.pos;
        const switchU = forceU || state.switchU;
        if (state.eat(117)) {
            if (this.regexp_eatFixedHexDigits(state, 4)) {
                const lead = state.lastIntValue;
                if (switchU && lead >= 55296 && lead <= 56319) {
                    const leadSurrogateEnd = state.pos;
                    if (state.eat(92) && state.eat(117) && this.regexp_eatFixedHexDigits(state, 4)) {
                        const trail = state.lastIntValue;
                        if (trail >= 56320 && trail <= 57343) {
                            state.lastIntValue = (lead - 55296) * 1024 + (trail - 56320) + 65536;
                            return true;
                        }
                    }
                    state.pos = leadSurrogateEnd;
                    state.lastIntValue = lead;
                }
                return true;
            }
            if (switchU && state.eat(123) && this.regexp_eatHexDigits(state) && state.eat(125) && isValidUnicode(state.lastIntValue)) {
                return true;
            }
            if (switchU) {
                state.raise('Invalid unicode escape');
            }
            state.pos = start;
        }
        return false;
    };
    function isValidUnicode(ch) {
        return ch >= 0 && ch <= 1114111;
    }
    pp.regexp_eatIdentityEscape = function (state) {
        if (state.switchU) {
            if (this.regexp_eatSyntaxCharacter(state)) {
                return true;
            }
            if (state.eat(47)) {
                state.lastIntValue = 47;
                return true;
            }
            return false;
        }
        const ch = state.current();
        if (ch !== 99 && (!state.switchN || ch !== 107)) {
            state.lastIntValue = ch;
            state.advance();
            return true;
        }
        return false;
    };
    pp.regexp_eatDecimalEscape = function (state) {
        state.lastIntValue = 0;
        let ch = state.current();
        if (ch >= 49 && ch <= 57) {
            do {
                state.lastIntValue = 10 * state.lastIntValue + (ch - 48);
                state.advance();
            } while ((ch = state.current()) >= 48 && ch <= 57);
            return true;
        }
        return false;
    };
    const CharSetNone = 0;
    const CharSetOk = 1;
    const CharSetString = 2;
    pp.regexp_eatCharacterClassEscape = function (state) {
        const ch = state.current();
        if (isCharacterClassEscape(ch)) {
            state.lastIntValue = -1;
            state.advance();
            return CharSetOk;
        }
        let negate = false;
        if (state.switchU && this.options.ecmaVersion >= 9 && ((negate = ch === 80) || ch === 112)) {
            state.lastIntValue = -1;
            state.advance();
            let result;
            if (state.eat(123) && (result = this.regexp_eatUnicodePropertyValueExpression(state)) && state.eat(125)) {
                if (negate && result === CharSetString)
                    state.raise('Invalid property name');
                return result;
            }
            state.raise('Invalid property name');
        }
        return CharSetNone;
    };
    function isCharacterClassEscape(ch) {
        return ch === 100 || ch === 68 || ch === 115 || ch === 83 || ch === 119 || ch === 87;
    }
    pp.regexp_eatUnicodePropertyValueExpression = function (state) {
        const start = state.pos;
        if (this.regexp_eatUnicodePropertyName(state) && state.eat(61)) {
            const name = state.lastStringValue;
            if (this.regexp_eatUnicodePropertyValue(state)) {
                const value = state.lastStringValue;
                this.regexp_validateUnicodePropertyNameAndValue(state, name, value);
                return CharSetOk;
            }
        }
        state.pos = start;
        if (this.regexp_eatLoneUnicodePropertyNameOrValue(state)) {
            const nameOrValue = state.lastStringValue;
            return this.regexp_validateUnicodePropertyNameOrValue(state, nameOrValue);
        }
        return CharSetNone;
    };
    pp.regexp_validateUnicodePropertyNameAndValue = function (state, name, value) {
        if (!hasOwn(state.unicodeProperties.nonBinary, name))
            state.raise('Invalid property name');
        if (!state.unicodeProperties.nonBinary[name].test(value))
            state.raise('Invalid property value');
    };
    pp.regexp_validateUnicodePropertyNameOrValue = function (state, nameOrValue) {
        if (state.unicodeProperties.binary.test(nameOrValue))
            return CharSetOk;
        if (state.switchV && state.unicodeProperties.binaryOfStrings.test(nameOrValue))
            return CharSetString;
        state.raise('Invalid property name');
    };
    pp.regexp_eatUnicodePropertyName = function (state) {
        let ch = 0;
        state.lastStringValue = '';
        while (isUnicodePropertyNameCharacter(ch = state.current())) {
            state.lastStringValue += codePointToString(ch);
            state.advance();
        }
        return state.lastStringValue !== '';
    };
    function isUnicodePropertyNameCharacter(ch) {
        return isControlLetter(ch) || ch === 95;
    }
    pp.regexp_eatUnicodePropertyValue = function (state) {
        let ch = 0;
        state.lastStringValue = '';
        while (isUnicodePropertyValueCharacter(ch = state.current())) {
            state.lastStringValue += codePointToString(ch);
            state.advance();
        }
        return state.lastStringValue !== '';
    };
    function isUnicodePropertyValueCharacter(ch) {
        return isUnicodePropertyNameCharacter(ch) || isDecimalDigit(ch);
    }
    pp.regexp_eatLoneUnicodePropertyNameOrValue = function (state) {
        return this.regexp_eatUnicodePropertyValue(state);
    };
    pp.regexp_eatCharacterClass = function (state) {
        if (state.eat(91)) {
            const negate = state.eat(94);
            const result = this.regexp_classContents(state);
            if (!state.eat(93))
                state.raise('Unterminated character class');
            if (negate && result === CharSetString)
                state.raise('Negated character class may contain strings');
            return true;
        }
        return false;
    };
    pp.regexp_classContents = function (state) {
        if (state.current() === 93)
            return CharSetOk;
        if (state.switchV)
            return this.regexp_classSetExpression(state);
        this.regexp_nonEmptyClassRanges(state);
        return CharSetOk;
    };
    pp.regexp_nonEmptyClassRanges = function (state) {
        while (this.regexp_eatClassAtom(state)) {
            const left = state.lastIntValue;
            if (state.eat(45) && this.regexp_eatClassAtom(state)) {
                const right = state.lastIntValue;
                if (state.switchU && (left === -1 || right === -1)) {
                    state.raise('Invalid character class');
                }
                if (left !== -1 && right !== -1 && left > right) {
                    state.raise('Range out of order in character class');
                }
            }
        }
    };
    pp.regexp_eatClassAtom = function (state) {
        const start = state.pos;
        if (state.eat(92)) {
            if (this.regexp_eatClassEscape(state)) {
                return true;
            }
            if (state.switchU) {
                const ch = state.current();
                if (ch === 99 || isOctalDigit(ch)) {
                    state.raise('Invalid class escape');
                }
                state.raise('Invalid escape');
            }
            state.pos = start;
        }
        const ch = state.current();
        if (ch !== 93) {
            state.lastIntValue = ch;
            state.advance();
            return true;
        }
        return false;
    };
    pp.regexp_eatClassEscape = function (state) {
        const start = state.pos;
        if (state.eat(98)) {
            state.lastIntValue = 8;
            return true;
        }
        if (state.switchU && state.eat(45)) {
            state.lastIntValue = 45;
            return true;
        }
        if (!state.switchU && state.eat(99)) {
            if (this.regexp_eatClassControlLetter(state)) {
                return true;
            }
            state.pos = start;
        }
        return this.regexp_eatCharacterClassEscape(state) || this.regexp_eatCharacterEscape(state);
    };
    pp.regexp_classSetExpression = function (state) {
        let result = CharSetOk, subResult;
        if (this.regexp_eatClassSetRange(state)) {
        } else if (subResult = this.regexp_eatClassSetOperand(state)) {
            if (subResult === CharSetString)
                result = CharSetString;
            const start = state.pos;
            while (state.eatChars([
                    38,
                    38
                ])) {
                if (state.current() !== 38 && (subResult = this.regexp_eatClassSetOperand(state))) {
                    if (subResult !== CharSetString)
                        result = CharSetOk;
                    continue;
                }
                state.raise('Invalid character in character class');
            }
            if (start !== state.pos)
                return result;
            while (state.eatChars([
                    45,
                    45
                ])) {
                if (this.regexp_eatClassSetOperand(state))
                    continue;
                state.raise('Invalid character in character class');
            }
            if (start !== state.pos)
                return result;
        } else {
            state.raise('Invalid character in character class');
        }
        for (;;) {
            if (this.regexp_eatClassSetRange(state))
                continue;
            subResult = this.regexp_eatClassSetOperand(state);
            if (!subResult)
                return result;
            if (subResult === CharSetString)
                result = CharSetString;
        }
    };
    pp.regexp_eatClassSetRange = function (state) {
        const start = state.pos;
        if (this.regexp_eatClassSetCharacter(state)) {
            const left = state.lastIntValue;
            if (state.eat(45) && this.regexp_eatClassSetCharacter(state)) {
                const right = state.lastIntValue;
                if (left !== -1 && right !== -1 && left > right) {
                    state.raise('Range out of order in character class');
                }
                return true;
            }
            state.pos = start;
        }
        return false;
    };
    pp.regexp_eatClassSetOperand = function (state) {
        if (this.regexp_eatClassSetCharacter(state))
            return CharSetOk;
        return this.regexp_eatClassStringDisjunction(state) || this.regexp_eatNestedClass(state);
    };
    pp.regexp_eatNestedClass = function (state) {
        const start = state.pos;
        if (state.eat(91)) {
            const negate = state.eat(94);
            const result = this.regexp_classContents(state);
            if (state.eat(93)) {
                if (negate && result === CharSetString) {
                    state.raise('Negated character class may contain strings');
                }
                return result;
            }
            state.pos = start;
        }
        if (state.eat(92)) {
            const result = this.regexp_eatCharacterClassEscape(state);
            if (result) {
                return result;
            }
            state.pos = start;
        }
        return null;
    };
    pp.regexp_eatClassStringDisjunction = function (state) {
        const start = state.pos;
        if (state.eatChars([
                92,
                113
            ])) {
            if (state.eat(123)) {
                const result = this.regexp_classStringDisjunctionContents(state);
                if (state.eat(125)) {
                    return result;
                }
            } else {
                state.raise('Invalid escape');
            }
            state.pos = start;
        }
        return null;
    };
    pp.regexp_classStringDisjunctionContents = function (state) {
        let result = this.regexp_classString(state);
        while (state.eat(124)) {
            if (this.regexp_classString(state) === CharSetString)
                result = CharSetString;
        }
        return result;
    };
    pp.regexp_classString = function (state) {
        let count = 0;
        while (this.regexp_eatClassSetCharacter(state))
            count++;
        return count === 1 ? CharSetOk : CharSetString;
    };
    pp.regexp_eatClassSetCharacter = function (state) {
        const start = state.pos;
        if (state.eat(92)) {
            if (this.regexp_eatCharacterEscape(state) || this.regexp_eatClassSetReservedPunctuator(state)) {
                return true;
            }
            if (state.eat(98)) {
                state.lastIntValue = 8;
                return true;
            }
            state.pos = start;
            return false;
        }
        const ch = state.current();
        if (ch < 0 || ch === state.lookahead() && isClassSetReservedDoublePunctuatorCharacter(ch))
            return false;
        if (isClassSetSyntaxCharacter(ch))
            return false;
        state.advance();
        state.lastIntValue = ch;
        return true;
    };
    function isClassSetReservedDoublePunctuatorCharacter(ch) {
        return ch === 33 || ch >= 35 && ch <= 38 || ch >= 42 && ch <= 44 || ch === 46 || ch >= 58 && ch <= 64 || ch === 94 || ch === 96 || ch === 126;
    }
    function isClassSetSyntaxCharacter(ch) {
        return ch === 40 || ch === 41 || ch === 45 || ch === 47 || ch >= 91 && ch <= 93 || ch >= 123 && ch <= 125;
    }
    pp.regexp_eatClassSetReservedPunctuator = function (state) {
        const ch = state.current();
        if (isClassSetReservedPunctuator(ch)) {
            state.lastIntValue = ch;
            state.advance();
            return true;
        }
        return false;
    };
    function isClassSetReservedPunctuator(ch) {
        return ch === 33 || ch === 35 || ch === 37 || ch === 38 || ch === 44 || ch === 45 || ch >= 58 && ch <= 62 || ch === 64 || ch === 96 || ch === 126;
    }
    pp.regexp_eatClassControlLetter = function (state) {
        const ch = state.current();
        if (isDecimalDigit(ch) || ch === 95) {
            state.lastIntValue = ch % 32;
            state.advance();
            return true;
        }
        return false;
    };
    pp.regexp_eatHexEscapeSequence = function (state) {
        const start = state.pos;
        if (state.eat(120)) {
            if (this.regexp_eatFixedHexDigits(state, 2)) {
                return true;
            }
            if (state.switchU) {
                state.raise('Invalid escape');
            }
            state.pos = start;
        }
        return false;
    };
    pp.regexp_eatDecimalDigits = function (state) {
        const start = state.pos;
        let ch = 0;
        state.lastIntValue = 0;
        while (isDecimalDigit(ch = state.current())) {
            state.lastIntValue = 10 * state.lastIntValue + (ch - 48);
            state.advance();
        }
        return state.pos !== start;
    };
    function isDecimalDigit(ch) {
        return ch >= 48 && ch <= 57;
    }
    pp.regexp_eatHexDigits = function (state) {
        const start = state.pos;
        let ch = 0;
        state.lastIntValue = 0;
        while (isHexDigit(ch = state.current())) {
            state.lastIntValue = 16 * state.lastIntValue + hexToInt(ch);
            state.advance();
        }
        return state.pos !== start;
    };
    function isHexDigit(ch) {
        return ch >= 48 && ch <= 57 || ch >= 65 && ch <= 70 || ch >= 97 && ch <= 102;
    }
    function hexToInt(ch) {
        if (ch >= 65 && ch <= 70) {
            return 10 + (ch - 65);
        }
        if (ch >= 97 && ch <= 102) {
            return 10 + (ch - 97);
        }
        return ch - 48;
    }
    pp.regexp_eatLegacyOctalEscapeSequence = function (state) {
        if (this.regexp_eatOctalDigit(state)) {
            const n1 = state.lastIntValue;
            if (this.regexp_eatOctalDigit(state)) {
                const n2 = state.lastIntValue;
                if (n1 <= 3 && this.regexp_eatOctalDigit(state)) {
                    state.lastIntValue = n1 * 64 + n2 * 8 + state.lastIntValue;
                } else {
                    state.lastIntValue = n1 * 8 + n2;
                }
            } else {
                state.lastIntValue = n1;
            }
            return true;
        }
        return false;
    };
    pp.regexp_eatOctalDigit = function (state) {
        const ch = state.current();
        if (isOctalDigit(ch)) {
            state.lastIntValue = ch - 48;
            state.advance();
            return true;
        }
        state.lastIntValue = 0;
        return false;
    };
    function isOctalDigit(ch) {
        return ch >= 48 && ch <= 55;
    }
    pp.regexp_eatFixedHexDigits = function (state, length) {
        const start = state.pos;
        state.lastIntValue = 0;
        for (let i = 0; i < length; ++i) {
            const ch = state.current();
            if (!isHexDigit(ch)) {
                state.pos = start;
                return false;
            }
            state.lastIntValue = 16 * state.lastIntValue + hexToInt(ch);
            state.advance();
        }
        return true;
    };
    return { RegExpValidationState: RegExpValidationState };
});