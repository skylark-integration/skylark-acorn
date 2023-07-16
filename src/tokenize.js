define([
    './identifier',
    './tokentype',
    './tokentype',
    './state',
    './locutil',
    './regexp',
    './whitespace',
    './util'
], function (m_identifier, tt, keywordTypes, m_state, m_locutil, m_regexp, m_whitespace, m_util) {
    'use strict';
    const {isIdentifierStart, isIdentifierChar} = m_identifier;
    const {Parser} = m_state;
    const {SourceLocation} = m_locutil;
    const {RegExpValidationState} = m_regexp;
    const {lineBreak, nextLineBreak, isNewLine, nonASCIIwhitespace} = m_whitespace;
    const {codePointToString} = m_util;
    class Token {
        constructor(p) {
            this.type = p.type;
            this.value = p.value;
            this.start = p.start;
            this.end = p.end;
            if (p.options.locations)
                this.loc = new SourceLocation(p, p.startLoc, p.endLoc);
            if (p.options.ranges)
                this.range = [
                    p.start,
                    p.end
                ];
        }
    }
    const pp = Parser.prototype;
    pp.next = function (ignoreEscapeSequenceInKeyword) {
        if (!ignoreEscapeSequenceInKeyword && this.type.keyword && this.containsEsc)
            this.raiseRecoverable(this.start, 'Escape sequence in keyword ' + this.type.keyword);
        if (this.options.onToken)
            this.options.onToken(new Token(this));
        this.lastTokEnd = this.end;
        this.lastTokStart = this.start;
        this.lastTokEndLoc = this.endLoc;
        this.lastTokStartLoc = this.startLoc;
        this.nextToken();
    };
    pp.getToken = function () {
        this.next();
        return new Token(this);
    };
    if (typeof Symbol !== 'undefined')
        pp[Symbol.iterator] = function () {
            return {
                next: () => {
                    let token = this.getToken();
                    return {
                        done: token.type === tt.eof,
                        value: token
                    };
                }
            };
        };
    pp.nextToken = function () {
        let curContext = this.curContext();
        if (!curContext || !curContext.preserveSpace)
            this.skipSpace();
        this.start = this.pos;
        if (this.options.locations)
            this.startLoc = this.curPosition();
        if (this.pos >= this.input.length)
            return this.finishToken(tt.eof);
        if (curContext.override)
            return curContext.override(this);
        else
            this.readToken(this.fullCharCodeAtPos());
    };
    pp.readToken = function (code) {
        if (isIdentifierStart(code, this.options.ecmaVersion >= 6) || code === 92)
            return this.readWord();
        return this.getTokenFromCode(code);
    };
    pp.fullCharCodeAtPos = function () {
        let code = this.input.charCodeAt(this.pos);
        if (code <= 55295 || code >= 56320)
            return code;
        let next = this.input.charCodeAt(this.pos + 1);
        return next <= 56319 || next >= 57344 ? code : (code << 10) + next - 56613888;
    };
    pp.skipBlockComment = function () {
        let startLoc = this.options.onComment && this.curPosition();
        let start = this.pos, end = this.input.indexOf('*/', this.pos += 2);
        if (end === -1)
            this.raise(this.pos - 2, 'Unterminated comment');
        this.pos = end + 2;
        if (this.options.locations) {
            for (let nextBreak, pos = start; (nextBreak = nextLineBreak(this.input, pos, this.pos)) > -1;) {
                ++this.curLine;
                pos = this.lineStart = nextBreak;
            }
        }
        if (this.options.onComment)
            this.options.onComment(true, this.input.slice(start + 2, end), start, this.pos, startLoc, this.curPosition());
    };
    pp.skipLineComment = function (startSkip) {
        let start = this.pos;
        let startLoc = this.options.onComment && this.curPosition();
        let ch = this.input.charCodeAt(this.pos += startSkip);
        while (this.pos < this.input.length && !isNewLine(ch)) {
            ch = this.input.charCodeAt(++this.pos);
        }
        if (this.options.onComment)
            this.options.onComment(false, this.input.slice(start + startSkip, this.pos), start, this.pos, startLoc, this.curPosition());
    };
    pp.skipSpace = function () {
        loop:
            while (this.pos < this.input.length) {
                let ch = this.input.charCodeAt(this.pos);
                switch (ch) {
                case 32:
                case 160:
                    ++this.pos;
                    break;
                case 13:
                    if (this.input.charCodeAt(this.pos + 1) === 10) {
                        ++this.pos;
                    }
                case 10:
                case 8232:
                case 8233:
                    ++this.pos;
                    if (this.options.locations) {
                        ++this.curLine;
                        this.lineStart = this.pos;
                    }
                    break;
                case 47:
                    switch (this.input.charCodeAt(this.pos + 1)) {
                    case 42:
                        this.skipBlockComment();
                        break;
                    case 47:
                        this.skipLineComment(2);
                        break;
                    default:
                        break loop;
                    }
                    break;
                default:
                    if (ch > 8 && ch < 14 || ch >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(ch))) {
                        ++this.pos;
                    } else {
                        break loop;
                    }
                }
            }
    };
    pp.finishToken = function (type, val) {
        this.end = this.pos;
        if (this.options.locations)
            this.endLoc = this.curPosition();
        let prevType = this.type;
        this.type = type;
        this.value = val;
        this.updateContext(prevType);
    };
    pp.readToken_dot = function () {
        let next = this.input.charCodeAt(this.pos + 1);
        if (next >= 48 && next <= 57)
            return this.readNumber(true);
        let next2 = this.input.charCodeAt(this.pos + 2);
        if (this.options.ecmaVersion >= 6 && next === 46 && next2 === 46) {
            this.pos += 3;
            return this.finishToken(tt.ellipsis);
        } else {
            ++this.pos;
            return this.finishToken(tt.dot);
        }
    };
    pp.readToken_slash = function () {
        let next = this.input.charCodeAt(this.pos + 1);
        if (this.exprAllowed) {
            ++this.pos;
            return this.readRegexp();
        }
        if (next === 61)
            return this.finishOp(tt.assign, 2);
        return this.finishOp(tt.slash, 1);
    };
    pp.readToken_mult_modulo_exp = function (code) {
        let next = this.input.charCodeAt(this.pos + 1);
        let size = 1;
        let tokentype = code === 42 ? tt.star : tt.modulo;
        if (this.options.ecmaVersion >= 7 && code === 42 && next === 42) {
            ++size;
            tokentype = tt.starstar;
            next = this.input.charCodeAt(this.pos + 2);
        }
        if (next === 61)
            return this.finishOp(tt.assign, size + 1);
        return this.finishOp(tokentype, size);
    };
    pp.readToken_pipe_amp = function (code) {
        let next = this.input.charCodeAt(this.pos + 1);
        if (next === code) {
            if (this.options.ecmaVersion >= 12) {
                let next2 = this.input.charCodeAt(this.pos + 2);
                if (next2 === 61)
                    return this.finishOp(tt.assign, 3);
            }
            return this.finishOp(code === 124 ? tt.logicalOR : tt.logicalAND, 2);
        }
        if (next === 61)
            return this.finishOp(tt.assign, 2);
        return this.finishOp(code === 124 ? tt.bitwiseOR : tt.bitwiseAND, 1);
    };
    pp.readToken_caret = function () {
        let next = this.input.charCodeAt(this.pos + 1);
        if (next === 61)
            return this.finishOp(tt.assign, 2);
        return this.finishOp(tt.bitwiseXOR, 1);
    };
    pp.readToken_plus_min = function (code) {
        let next = this.input.charCodeAt(this.pos + 1);
        if (next === code) {
            if (next === 45 && !this.inModule && this.input.charCodeAt(this.pos + 2) === 62 && (this.lastTokEnd === 0 || lineBreak.test(this.input.slice(this.lastTokEnd, this.pos)))) {
                this.skipLineComment(3);
                this.skipSpace();
                return this.nextToken();
            }
            return this.finishOp(tt.incDec, 2);
        }
        if (next === 61)
            return this.finishOp(tt.assign, 2);
        return this.finishOp(tt.plusMin, 1);
    };
    pp.readToken_lt_gt = function (code) {
        let next = this.input.charCodeAt(this.pos + 1);
        let size = 1;
        if (next === code) {
            size = code === 62 && this.input.charCodeAt(this.pos + 2) === 62 ? 3 : 2;
            if (this.input.charCodeAt(this.pos + size) === 61)
                return this.finishOp(tt.assign, size + 1);
            return this.finishOp(tt.bitShift, size);
        }
        if (next === 33 && code === 60 && !this.inModule && this.input.charCodeAt(this.pos + 2) === 45 && this.input.charCodeAt(this.pos + 3) === 45) {
            this.skipLineComment(4);
            this.skipSpace();
            return this.nextToken();
        }
        if (next === 61)
            size = 2;
        return this.finishOp(tt.relational, size);
    };
    pp.readToken_eq_excl = function (code) {
        let next = this.input.charCodeAt(this.pos + 1);
        if (next === 61)
            return this.finishOp(tt.equality, this.input.charCodeAt(this.pos + 2) === 61 ? 3 : 2);
        if (code === 61 && next === 62 && this.options.ecmaVersion >= 6) {
            this.pos += 2;
            return this.finishToken(tt.arrow);
        }
        return this.finishOp(code === 61 ? tt.eq : tt.prefix, 1);
    };
    pp.readToken_question = function () {
        const ecmaVersion = this.options.ecmaVersion;
        if (ecmaVersion >= 11) {
            let next = this.input.charCodeAt(this.pos + 1);
            if (next === 46) {
                let next2 = this.input.charCodeAt(this.pos + 2);
                if (next2 < 48 || next2 > 57)
                    return this.finishOp(tt.questionDot, 2);
            }
            if (next === 63) {
                if (ecmaVersion >= 12) {
                    let next2 = this.input.charCodeAt(this.pos + 2);
                    if (next2 === 61)
                        return this.finishOp(tt.assign, 3);
                }
                return this.finishOp(tt.coalesce, 2);
            }
        }
        return this.finishOp(tt.question, 1);
    };
    pp.readToken_numberSign = function () {
        const ecmaVersion = this.options.ecmaVersion;
        let code = 35;
        if (ecmaVersion >= 13) {
            ++this.pos;
            code = this.fullCharCodeAtPos();
            if (isIdentifierStart(code, true) || code === 92) {
                return this.finishToken(tt.privateId, this.readWord1());
            }
        }
        this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "'");
    };
    pp.getTokenFromCode = function (code) {
        switch (code) {
        case 46:
            return this.readToken_dot();
        case 40:
            ++this.pos;
            return this.finishToken(tt.parenL);
        case 41:
            ++this.pos;
            return this.finishToken(tt.parenR);
        case 59:
            ++this.pos;
            return this.finishToken(tt.semi);
        case 44:
            ++this.pos;
            return this.finishToken(tt.comma);
        case 91:
            ++this.pos;
            return this.finishToken(tt.bracketL);
        case 93:
            ++this.pos;
            return this.finishToken(tt.bracketR);
        case 123:
            ++this.pos;
            return this.finishToken(tt.braceL);
        case 125:
            ++this.pos;
            return this.finishToken(tt.braceR);
        case 58:
            ++this.pos;
            return this.finishToken(tt.colon);
        case 96:
            if (this.options.ecmaVersion < 6)
                break;
            ++this.pos;
            return this.finishToken(tt.backQuote);
        case 48:
            let next = this.input.charCodeAt(this.pos + 1);
            if (next === 120 || next === 88)
                return this.readRadixNumber(16);
            if (this.options.ecmaVersion >= 6) {
                if (next === 111 || next === 79)
                    return this.readRadixNumber(8);
                if (next === 98 || next === 66)
                    return this.readRadixNumber(2);
            }
        case 49:
        case 50:
        case 51:
        case 52:
        case 53:
        case 54:
        case 55:
        case 56:
        case 57:
            return this.readNumber(false);
        case 34:
        case 39:
            return this.readString(code);
        case 47:
            return this.readToken_slash();
        case 37:
        case 42:
            return this.readToken_mult_modulo_exp(code);
        case 124:
        case 38:
            return this.readToken_pipe_amp(code);
        case 94:
            return this.readToken_caret();
        case 43:
        case 45:
            return this.readToken_plus_min(code);
        case 60:
        case 62:
            return this.readToken_lt_gt(code);
        case 61:
        case 33:
            return this.readToken_eq_excl(code);
        case 63:
            return this.readToken_question();
        case 126:
            return this.finishOp(tt.prefix, 1);
        case 35:
            return this.readToken_numberSign();
        }
        this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "'");
    };
    pp.finishOp = function (type, size) {
        let str = this.input.slice(this.pos, this.pos + size);
        this.pos += size;
        return this.finishToken(type, str);
    };
    pp.readRegexp = function () {
        let escaped, inClass, start = this.pos;
        for (;;) {
            if (this.pos >= this.input.length)
                this.raise(start, 'Unterminated regular expression');
            let ch = this.input.charAt(this.pos);
            if (lineBreak.test(ch))
                this.raise(start, 'Unterminated regular expression');
            if (!escaped) {
                if (ch === '[')
                    inClass = true;
                else if (ch === ']' && inClass)
                    inClass = false;
                else if (ch === '/' && !inClass)
                    break;
                escaped = ch === '\\';
            } else
                escaped = false;
            ++this.pos;
        }
        let pattern = this.input.slice(start, this.pos);
        ++this.pos;
        let flagsStart = this.pos;
        let flags = this.readWord1();
        if (this.containsEsc)
            this.unexpected(flagsStart);
        const state = this.regexpState || (this.regexpState = new RegExpValidationState(this));
        state.reset(start, pattern, flags);
        this.validateRegExpFlags(state);
        this.validateRegExpPattern(state);
        let value = null;
        try {
            value = new RegExp(pattern, flags);
        } catch (e) {
        }
        return this.finishToken(tt.regexp, {
            pattern,
            flags,
            value
        });
    };
    pp.readInt = function (radix, len, maybeLegacyOctalNumericLiteral) {
        const allowSeparators = this.options.ecmaVersion >= 12 && len === undefined;
        const isLegacyOctalNumericLiteral = maybeLegacyOctalNumericLiteral && this.input.charCodeAt(this.pos) === 48;
        let start = this.pos, total = 0, lastCode = 0;
        for (let i = 0, e = len == null ? Infinity : len; i < e; ++i, ++this.pos) {
            let code = this.input.charCodeAt(this.pos), val;
            if (allowSeparators && code === 95) {
                if (isLegacyOctalNumericLiteral)
                    this.raiseRecoverable(this.pos, 'Numeric separator is not allowed in legacy octal numeric literals');
                if (lastCode === 95)
                    this.raiseRecoverable(this.pos, 'Numeric separator must be exactly one underscore');
                if (i === 0)
                    this.raiseRecoverable(this.pos, 'Numeric separator is not allowed at the first of digits');
                lastCode = code;
                continue;
            }
            if (code >= 97)
                val = code - 97 + 10;
            else if (code >= 65)
                val = code - 65 + 10;
            else if (code >= 48 && code <= 57)
                val = code - 48;
            else
                val = Infinity;
            if (val >= radix)
                break;
            lastCode = code;
            total = total * radix + val;
        }
        if (allowSeparators && lastCode === 95)
            this.raiseRecoverable(this.pos - 1, 'Numeric separator is not allowed at the last of digits');
        if (this.pos === start || len != null && this.pos - start !== len)
            return null;
        return total;
    };
    function stringToNumber(str, isLegacyOctalNumericLiteral) {
        if (isLegacyOctalNumericLiteral) {
            return parseInt(str, 8);
        }
        return parseFloat(str.replace(/_/g, ''));
    }
    function stringToBigInt(str) {
        if (typeof BigInt !== 'function') {
            return null;
        }
        return BigInt(str.replace(/_/g, ''));
    }
    pp.readRadixNumber = function (radix) {
        let start = this.pos;
        this.pos += 2;
        let val = this.readInt(radix);
        if (val == null)
            this.raise(this.start + 2, 'Expected number in radix ' + radix);
        if (this.options.ecmaVersion >= 11 && this.input.charCodeAt(this.pos) === 110) {
            val = stringToBigInt(this.input.slice(start, this.pos));
            ++this.pos;
        } else if (isIdentifierStart(this.fullCharCodeAtPos()))
            this.raise(this.pos, 'Identifier directly after number');
        return this.finishToken(tt.num, val);
    };
    pp.readNumber = function (startsWithDot) {
        let start = this.pos;
        if (!startsWithDot && this.readInt(10, undefined, true) === null)
            this.raise(start, 'Invalid number');
        let octal = this.pos - start >= 2 && this.input.charCodeAt(start) === 48;
        if (octal && this.strict)
            this.raise(start, 'Invalid number');
        let next = this.input.charCodeAt(this.pos);
        if (!octal && !startsWithDot && this.options.ecmaVersion >= 11 && next === 110) {
            let val = stringToBigInt(this.input.slice(start, this.pos));
            ++this.pos;
            if (isIdentifierStart(this.fullCharCodeAtPos()))
                this.raise(this.pos, 'Identifier directly after number');
            return this.finishToken(tt.num, val);
        }
        if (octal && /[89]/.test(this.input.slice(start, this.pos)))
            octal = false;
        if (next === 46 && !octal) {
            ++this.pos;
            this.readInt(10);
            next = this.input.charCodeAt(this.pos);
        }
        if ((next === 69 || next === 101) && !octal) {
            next = this.input.charCodeAt(++this.pos);
            if (next === 43 || next === 45)
                ++this.pos;
            if (this.readInt(10) === null)
                this.raise(start, 'Invalid number');
        }
        if (isIdentifierStart(this.fullCharCodeAtPos()))
            this.raise(this.pos, 'Identifier directly after number');
        let val = stringToNumber(this.input.slice(start, this.pos), octal);
        return this.finishToken(tt.num, val);
    };
    pp.readCodePoint = function () {
        let ch = this.input.charCodeAt(this.pos), code;
        if (ch === 123) {
            if (this.options.ecmaVersion < 6)
                this.unexpected();
            let codePos = ++this.pos;
            code = this.readHexChar(this.input.indexOf('}', this.pos) - this.pos);
            ++this.pos;
            if (code > 1114111)
                this.invalidStringToken(codePos, 'Code point out of bounds');
        } else {
            code = this.readHexChar(4);
        }
        return code;
    };
    pp.readString = function (quote) {
        let out = '', chunkStart = ++this.pos;
        for (;;) {
            if (this.pos >= this.input.length)
                this.raise(this.start, 'Unterminated string constant');
            let ch = this.input.charCodeAt(this.pos);
            if (ch === quote)
                break;
            if (ch === 92) {
                out += this.input.slice(chunkStart, this.pos);
                out += this.readEscapedChar(false);
                chunkStart = this.pos;
            } else if (ch === 8232 || ch === 8233) {
                if (this.options.ecmaVersion < 10)
                    this.raise(this.start, 'Unterminated string constant');
                ++this.pos;
                if (this.options.locations) {
                    this.curLine++;
                    this.lineStart = this.pos;
                }
            } else {
                if (isNewLine(ch))
                    this.raise(this.start, 'Unterminated string constant');
                ++this.pos;
            }
        }
        out += this.input.slice(chunkStart, this.pos++);
        return this.finishToken(tt.string, out);
    };
    const INVALID_TEMPLATE_ESCAPE_ERROR = {};
    pp.tryReadTemplateToken = function () {
        this.inTemplateElement = true;
        try {
            this.readTmplToken();
        } catch (err) {
            if (err === INVALID_TEMPLATE_ESCAPE_ERROR) {
                this.readInvalidTemplateToken();
            } else {
                throw err;
            }
        }
        this.inTemplateElement = false;
    };
    pp.invalidStringToken = function (position, message) {
        if (this.inTemplateElement && this.options.ecmaVersion >= 9) {
            throw INVALID_TEMPLATE_ESCAPE_ERROR;
        } else {
            this.raise(position, message);
        }
    };
    pp.readTmplToken = function () {
        let out = '', chunkStart = this.pos;
        for (;;) {
            if (this.pos >= this.input.length)
                this.raise(this.start, 'Unterminated template');
            let ch = this.input.charCodeAt(this.pos);
            if (ch === 96 || ch === 36 && this.input.charCodeAt(this.pos + 1) === 123) {
                if (this.pos === this.start && (this.type === tt.template || this.type === tt.invalidTemplate)) {
                    if (ch === 36) {
                        this.pos += 2;
                        return this.finishToken(tt.dollarBraceL);
                    } else {
                        ++this.pos;
                        return this.finishToken(tt.backQuote);
                    }
                }
                out += this.input.slice(chunkStart, this.pos);
                return this.finishToken(tt.template, out);
            }
            if (ch === 92) {
                out += this.input.slice(chunkStart, this.pos);
                out += this.readEscapedChar(true);
                chunkStart = this.pos;
            } else if (isNewLine(ch)) {
                out += this.input.slice(chunkStart, this.pos);
                ++this.pos;
                switch (ch) {
                case 13:
                    if (this.input.charCodeAt(this.pos) === 10)
                        ++this.pos;
                case 10:
                    out += '\n';
                    break;
                default:
                    out += String.fromCharCode(ch);
                    break;
                }
                if (this.options.locations) {
                    ++this.curLine;
                    this.lineStart = this.pos;
                }
                chunkStart = this.pos;
            } else {
                ++this.pos;
            }
        }
    };
    pp.readInvalidTemplateToken = function () {
        for (; this.pos < this.input.length; this.pos++) {
            switch (this.input[this.pos]) {
            case '\\':
                ++this.pos;
                break;
            case '$':
                if (this.input[this.pos + 1] !== '{') {
                    break;
                }
            case '`':
                return this.finishToken(tt.invalidTemplate, this.input.slice(this.start, this.pos));
            }
        }
        this.raise(this.start, 'Unterminated template');
    };
    pp.readEscapedChar = function (inTemplate) {
        let ch = this.input.charCodeAt(++this.pos);
        ++this.pos;
        switch (ch) {
        case 110:
            return '\n';
        case 114:
            return '\r';
        case 120:
            return String.fromCharCode(this.readHexChar(2));
        case 117:
            return codePointToString(this.readCodePoint());
        case 116:
            return '\t';
        case 98:
            return '\b';
        case 118:
            return '\x0B';
        case 102:
            return '\f';
        case 13:
            if (this.input.charCodeAt(this.pos) === 10)
                ++this.pos;
        case 10:
            if (this.options.locations) {
                this.lineStart = this.pos;
                ++this.curLine;
            }
            return '';
        case 56:
        case 57:
            if (this.strict) {
                this.invalidStringToken(this.pos - 1, 'Invalid escape sequence');
            }
            if (inTemplate) {
                const codePos = this.pos - 1;
                this.invalidStringToken(codePos, 'Invalid escape sequence in template string');
            }
        default:
            if (ch >= 48 && ch <= 55) {
                let octalStr = this.input.substr(this.pos - 1, 3).match(/^[0-7]+/)[0];
                let octal = parseInt(octalStr, 8);
                if (octal > 255) {
                    octalStr = octalStr.slice(0, -1);
                    octal = parseInt(octalStr, 8);
                }
                this.pos += octalStr.length - 1;
                ch = this.input.charCodeAt(this.pos);
                if ((octalStr !== '0' || ch === 56 || ch === 57) && (this.strict || inTemplate)) {
                    this.invalidStringToken(this.pos - 1 - octalStr.length, inTemplate ? 'Octal literal in template string' : 'Octal literal in strict mode');
                }
                return String.fromCharCode(octal);
            }
            if (isNewLine(ch)) {
                return '';
            }
            return String.fromCharCode(ch);
        }
    };
    pp.readHexChar = function (len) {
        let codePos = this.pos;
        let n = this.readInt(16, len);
        if (n === null)
            this.invalidStringToken(codePos, 'Bad character escape sequence');
        return n;
    };
    pp.readWord1 = function () {
        this.containsEsc = false;
        let word = '', first = true, chunkStart = this.pos;
        let astral = this.options.ecmaVersion >= 6;
        while (this.pos < this.input.length) {
            let ch = this.fullCharCodeAtPos();
            if (isIdentifierChar(ch, astral)) {
                this.pos += ch <= 65535 ? 1 : 2;
            } else if (ch === 92) {
                this.containsEsc = true;
                word += this.input.slice(chunkStart, this.pos);
                let escStart = this.pos;
                if (this.input.charCodeAt(++this.pos) !== 117)
                    this.invalidStringToken(this.pos, 'Expecting Unicode escape sequence \\uXXXX');
                ++this.pos;
                let esc = this.readCodePoint();
                if (!(first ? isIdentifierStart : isIdentifierChar)(esc, astral))
                    this.invalidStringToken(escStart, 'Invalid Unicode escape');
                word += codePointToString(esc);
                chunkStart = this.pos;
            } else {
                break;
            }
            first = false;
        }
        return word + this.input.slice(chunkStart, this.pos);
    };
    pp.readWord = function () {
        let word = this.readWord1();
        let type = tt.name;
        if (this.keywords.test(word)) {
            type = keywordTypes[word];
        }
        return this.finishToken(type, word);
    };
    return { Token: Token };
});