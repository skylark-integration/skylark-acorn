define([
    './tokentype',
    './state',
    './util',
    './scopeflags'
], function (tt, m_state, m_util, m_scopeflags) {
    'use strict';
    const {Parser} = m_state;
    const {hasOwn} = m_util;
    const {BIND_NONE, BIND_OUTSIDE, BIND_LEXICAL} = m_scopeflags;
    const pp = Parser.prototype;
    pp.toAssignable = function (node, isBinding, refDestructuringErrors) {
        if (this.options.ecmaVersion >= 6 && node) {
            switch (node.type) {
            case 'Identifier':
                if (this.inAsync && node.name === 'await')
                    this.raise(node.start, "Cannot use 'await' as identifier inside an async function");
                break;
            case 'ObjectPattern':
            case 'ArrayPattern':
            case 'AssignmentPattern':
            case 'RestElement':
                break;
            case 'ObjectExpression':
                node.type = 'ObjectPattern';
                if (refDestructuringErrors)
                    this.checkPatternErrors(refDestructuringErrors, true);
                for (let prop of node.properties) {
                    this.toAssignable(prop, isBinding);
                    if (prop.type === 'RestElement' && (prop.argument.type === 'ArrayPattern' || prop.argument.type === 'ObjectPattern')) {
                        this.raise(prop.argument.start, 'Unexpected token');
                    }
                }
                break;
            case 'Property':
                if (node.kind !== 'init')
                    this.raise(node.key.start, "Object pattern can't contain getter or setter");
                this.toAssignable(node.value, isBinding);
                break;
            case 'ArrayExpression':
                node.type = 'ArrayPattern';
                if (refDestructuringErrors)
                    this.checkPatternErrors(refDestructuringErrors, true);
                this.toAssignableList(node.elements, isBinding);
                break;
            case 'SpreadElement':
                node.type = 'RestElement';
                this.toAssignable(node.argument, isBinding);
                if (node.argument.type === 'AssignmentPattern')
                    this.raise(node.argument.start, 'Rest elements cannot have a default value');
                break;
            case 'AssignmentExpression':
                if (node.operator !== '=')
                    this.raise(node.left.end, "Only '=' operator can be used for specifying default value.");
                node.type = 'AssignmentPattern';
                delete node.operator;
                this.toAssignable(node.left, isBinding);
                break;
            case 'ParenthesizedExpression':
                this.toAssignable(node.expression, isBinding, refDestructuringErrors);
                break;
            case 'ChainExpression':
                this.raiseRecoverable(node.start, 'Optional chaining cannot appear in left-hand side');
                break;
            case 'MemberExpression':
                if (!isBinding)
                    break;
            default:
                this.raise(node.start, 'Assigning to rvalue');
            }
        } else if (refDestructuringErrors)
            this.checkPatternErrors(refDestructuringErrors, true);
        return node;
    };
    pp.toAssignableList = function (exprList, isBinding) {
        let end = exprList.length;
        for (let i = 0; i < end; i++) {
            let elt = exprList[i];
            if (elt)
                this.toAssignable(elt, isBinding);
        }
        if (end) {
            let last = exprList[end - 1];
            if (this.options.ecmaVersion === 6 && isBinding && last && last.type === 'RestElement' && last.argument.type !== 'Identifier')
                this.unexpected(last.argument.start);
        }
        return exprList;
    };
    pp.parseSpread = function (refDestructuringErrors) {
        let node = this.startNode();
        this.next();
        node.argument = this.parseMaybeAssign(false, refDestructuringErrors);
        return this.finishNode(node, 'SpreadElement');
    };
    pp.parseRestBinding = function () {
        let node = this.startNode();
        this.next();
        if (this.options.ecmaVersion === 6 && this.type !== tt.name)
            this.unexpected();
        node.argument = this.parseBindingAtom();
        return this.finishNode(node, 'RestElement');
    };
    pp.parseBindingAtom = function () {
        if (this.options.ecmaVersion >= 6) {
            switch (this.type) {
            case tt.bracketL:
                let node = this.startNode();
                this.next();
                node.elements = this.parseBindingList(tt.bracketR, true, true);
                return this.finishNode(node, 'ArrayPattern');
            case tt.braceL:
                return this.parseObj(true);
            }
        }
        return this.parseIdent();
    };
    pp.parseBindingList = function (close, allowEmpty, allowTrailingComma, allowModifiers) {
        let elts = [], first = true;
        while (!this.eat(close)) {
            if (first)
                first = false;
            else
                this.expect(tt.comma);
            if (allowEmpty && this.type === tt.comma) {
                elts.push(null);
            } else if (allowTrailingComma && this.afterTrailingComma(close)) {
                break;
            } else if (this.type === tt.ellipsis) {
                let rest = this.parseRestBinding();
                this.parseBindingListItem(rest);
                elts.push(rest);
                if (this.type === tt.comma)
                    this.raiseRecoverable(this.start, 'Comma is not permitted after the rest element');
                this.expect(close);
                break;
            } else {
                elts.push(this.parseAssignableListItem(allowModifiers));
            }
        }
        return elts;
    };
    pp.parseAssignableListItem = function (allowModifiers) {
        let elem = this.parseMaybeDefault(this.start, this.startLoc);
        this.parseBindingListItem(elem);
        return elem;
    };
    pp.parseBindingListItem = function (param) {
        return param;
    };
    pp.parseMaybeDefault = function (startPos, startLoc, left) {
        left = left || this.parseBindingAtom();
        if (this.options.ecmaVersion < 6 || !this.eat(tt.eq))
            return left;
        let node = this.startNodeAt(startPos, startLoc);
        node.left = left;
        node.right = this.parseMaybeAssign();
        return this.finishNode(node, 'AssignmentPattern');
    };
    pp.checkLValSimple = function (expr, bindingType = BIND_NONE, checkClashes) {
        const isBind = bindingType !== BIND_NONE;
        switch (expr.type) {
        case 'Identifier':
            if (this.strict && this.reservedWordsStrictBind.test(expr.name))
                this.raiseRecoverable(expr.start, (isBind ? 'Binding ' : 'Assigning to ') + expr.name + ' in strict mode');
            if (isBind) {
                if (bindingType === BIND_LEXICAL && expr.name === 'let')
                    this.raiseRecoverable(expr.start, 'let is disallowed as a lexically bound name');
                if (checkClashes) {
                    if (hasOwn(checkClashes, expr.name))
                        this.raiseRecoverable(expr.start, 'Argument name clash');
                    checkClashes[expr.name] = true;
                }
                if (bindingType !== BIND_OUTSIDE)
                    this.declareName(expr.name, bindingType, expr.start);
            }
            break;
        case 'ChainExpression':
            this.raiseRecoverable(expr.start, 'Optional chaining cannot appear in left-hand side');
            break;
        case 'MemberExpression':
            if (isBind)
                this.raiseRecoverable(expr.start, 'Binding member expression');
            break;
        case 'ParenthesizedExpression':
            if (isBind)
                this.raiseRecoverable(expr.start, 'Binding parenthesized expression');
            return this.checkLValSimple(expr.expression, bindingType, checkClashes);
        default:
            this.raise(expr.start, (isBind ? 'Binding' : 'Assigning to') + ' rvalue');
        }
    };
    pp.checkLValPattern = function (expr, bindingType = BIND_NONE, checkClashes) {
        switch (expr.type) {
        case 'ObjectPattern':
            for (let prop of expr.properties) {
                this.checkLValInnerPattern(prop, bindingType, checkClashes);
            }
            break;
        case 'ArrayPattern':
            for (let elem of expr.elements) {
                if (elem)
                    this.checkLValInnerPattern(elem, bindingType, checkClashes);
            }
            break;
        default:
            this.checkLValSimple(expr, bindingType, checkClashes);
        }
    };
    pp.checkLValInnerPattern = function (expr, bindingType = BIND_NONE, checkClashes) {
        switch (expr.type) {
        case 'Property':
            this.checkLValInnerPattern(expr.value, bindingType, checkClashes);
            break;
        case 'AssignmentPattern':
            this.checkLValPattern(expr.left, bindingType, checkClashes);
            break;
        case 'RestElement':
            this.checkLValPattern(expr.argument, bindingType, checkClashes);
            break;
        default:
            this.checkLValPattern(expr, bindingType, checkClashes);
        }
    };
});