define([
    './tokentype',
    './state',
    './whitespace'
], function (m_tokentype, m_state, m_whitespace) {
    'use strict';
    const {types : tt} = m_tokentype;

    const {Parser} = m_state;
    const {lineBreak, skipWhiteSpace} = m_whitespace;
    const pp = Parser.prototype;
    const literal = /^(?:'((?:\\.|[^'\\])*?)'|"((?:\\.|[^"\\])*?)")/;
    pp.strictDirective = function (start) {
        if (this.options.ecmaVersion < 5)
            return false;
        for (;;) {
            skipWhiteSpace.lastIndex = start;
            start += skipWhiteSpace.exec(this.input)[0].length;
            let match = literal.exec(this.input.slice(start));
            if (!match)
                return false;
            if ((match[1] || match[2]) === 'use strict') {
                skipWhiteSpace.lastIndex = start + match[0].length;
                let spaceAfter = skipWhiteSpace.exec(this.input), end = spaceAfter.index + spaceAfter[0].length;
                let next = this.input.charAt(end);
                return next === ';' || next === '}' || lineBreak.test(spaceAfter[0]) && !(/[(`.[+\-/*%<>=,?^&]/.test(next) || next === '!' && this.input.charAt(end + 1) === '=');
            }
            start += match[0].length;
            skipWhiteSpace.lastIndex = start;
            start += skipWhiteSpace.exec(this.input)[0].length;
            if (this.input[start] === ';')
                start++;
        }
    };
    pp.eat = function (type) {
        if (this.type === type) {
            this.next();
            return true;
        } else {
            return false;
        }
    };
    pp.isContextual = function (name) {
        return this.type === tt.name && this.value === name && !this.containsEsc;
    };
    pp.eatContextual = function (name) {
        if (!this.isContextual(name))
            return false;
        this.next();
        return true;
    };
    pp.expectContextual = function (name) {
        if (!this.eatContextual(name))
            this.unexpected();
    };
    pp.canInsertSemicolon = function () {
        return this.type === tt.eof || this.type === tt.braceR || lineBreak.test(this.input.slice(this.lastTokEnd, this.start));
    };
    pp.insertSemicolon = function () {
        if (this.canInsertSemicolon()) {
            if (this.options.onInsertedSemicolon)
                this.options.onInsertedSemicolon(this.lastTokEnd, this.lastTokEndLoc);
            return true;
        }
    };
    pp.semicolon = function () {
        if (!this.eat(tt.semi) && !this.insertSemicolon())
            this.unexpected();
    };
    pp.afterTrailingComma = function (tokType, notNext) {
        if (this.type === tokType) {
            if (this.options.onTrailingComma)
                this.options.onTrailingComma(this.lastTokStart, this.lastTokStartLoc);
            if (!notNext)
                this.next();
            return true;
        }
    };
    pp.expect = function (type) {
        this.eat(type) || this.unexpected();
    };
    pp.unexpected = function (pos) {
        this.raise(pos != null ? pos : this.start, 'Unexpected token');
    };
    class DestructuringErrors {
        constructor() {
            this.shorthandAssign = this.trailingComma = this.parenthesizedAssign = this.parenthesizedBind = this.doubleProto = -1;
        }
    }
    pp.checkPatternErrors = function (refDestructuringErrors, isAssign) {
        if (!refDestructuringErrors)
            return;
        if (refDestructuringErrors.trailingComma > -1)
            this.raiseRecoverable(refDestructuringErrors.trailingComma, 'Comma is not permitted after the rest element');
        let parens = isAssign ? refDestructuringErrors.parenthesizedAssign : refDestructuringErrors.parenthesizedBind;
        if (parens > -1)
            this.raiseRecoverable(parens, isAssign ? 'Assigning to rvalue' : 'Parenthesized pattern');
    };
    pp.checkExpressionErrors = function (refDestructuringErrors, andThrow) {
        if (!refDestructuringErrors)
            return false;
        let {shorthandAssign, doubleProto} = refDestructuringErrors;
        if (!andThrow)
            return shorthandAssign >= 0 || doubleProto >= 0;
        if (shorthandAssign >= 0)
            this.raise(shorthandAssign, 'Shorthand property assignments are valid only in destructuring patterns');
        if (doubleProto >= 0)
            this.raiseRecoverable(doubleProto, 'Redefinition of __proto__ property');
    };
    pp.checkYieldAwaitInDefaultParams = function () {
        if (this.yieldPos && (!this.awaitPos || this.yieldPos < this.awaitPos))
            this.raise(this.yieldPos, 'Yield expression cannot be a default value');
        if (this.awaitPos)
            this.raise(this.awaitPos, 'Await expression cannot be a default value');
    };
    pp.isSimpleAssignTarget = function (expr) {
        if (expr.type === 'ParenthesizedExpression')
            return this.isSimpleAssignTarget(expr.expression);
        return expr.type === 'Identifier' || expr.type === 'MemberExpression';
    };
    return { DestructuringErrors: DestructuringErrors };
});