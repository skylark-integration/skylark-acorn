define([
    './state',
    './scopeflags'
], function (m_state, m_scopeflags) {
    'use strict';
    const {Parser} = m_state;
    const {SCOPE_VAR, SCOPE_FUNCTION, SCOPE_TOP, SCOPE_ARROW, SCOPE_SIMPLE_CATCH, BIND_LEXICAL, BIND_SIMPLE_CATCH, BIND_FUNCTION} = m_scopeflags;
    const pp = Parser.prototype;
    class Scope {
        constructor(flags) {
            this.flags = flags;
            this.var = [];
            this.lexical = [];
            this.functions = [];
            this.inClassFieldInit = false;
        }
    }
    pp.enterScope = function (flags) {
        this.scopeStack.push(new Scope(flags));
    };
    pp.exitScope = function () {
        this.scopeStack.pop();
    };
    pp.treatFunctionsAsVarInScope = function (scope) {
        return scope.flags & SCOPE_FUNCTION || !this.inModule && scope.flags & SCOPE_TOP;
    };
    pp.declareName = function (name, bindingType, pos) {
        let redeclared = false;
        if (bindingType === BIND_LEXICAL) {
            const scope = this.currentScope();
            redeclared = scope.lexical.indexOf(name) > -1 || scope.functions.indexOf(name) > -1 || scope.var.indexOf(name) > -1;
            scope.lexical.push(name);
            if (this.inModule && scope.flags & SCOPE_TOP)
                delete this.undefinedExports[name];
        } else if (bindingType === BIND_SIMPLE_CATCH) {
            const scope = this.currentScope();
            scope.lexical.push(name);
        } else if (bindingType === BIND_FUNCTION) {
            const scope = this.currentScope();
            if (this.treatFunctionsAsVar)
                redeclared = scope.lexical.indexOf(name) > -1;
            else
                redeclared = scope.lexical.indexOf(name) > -1 || scope.var.indexOf(name) > -1;
            scope.functions.push(name);
        } else {
            for (let i = this.scopeStack.length - 1; i >= 0; --i) {
                const scope = this.scopeStack[i];
                if (scope.lexical.indexOf(name) > -1 && !(scope.flags & SCOPE_SIMPLE_CATCH && scope.lexical[0] === name) || !this.treatFunctionsAsVarInScope(scope) && scope.functions.indexOf(name) > -1) {
                    redeclared = true;
                    break;
                }
                scope.var.push(name);
                if (this.inModule && scope.flags & SCOPE_TOP)
                    delete this.undefinedExports[name];
                if (scope.flags & SCOPE_VAR)
                    break;
            }
        }
        if (redeclared)
            this.raiseRecoverable(pos, `Identifier '${ name }' has already been declared`);
    };
    pp.checkLocalExport = function (id) {
        if (this.scopeStack[0].lexical.indexOf(id.name) === -1 && this.scopeStack[0].var.indexOf(id.name) === -1) {
            this.undefinedExports[id.name] = id;
        }
    };
    pp.currentScope = function () {
        return this.scopeStack[this.scopeStack.length - 1];
    };
    pp.currentVarScope = function () {
        for (let i = this.scopeStack.length - 1;; i--) {
            let scope = this.scopeStack[i];
            if (scope.flags & SCOPE_VAR)
                return scope;
        }
    };
    pp.currentThisScope = function () {
        for (let i = this.scopeStack.length - 1;; i--) {
            let scope = this.scopeStack[i];
            if (scope.flags & SCOPE_VAR && !(scope.flags & SCOPE_ARROW))
                return scope;
        }
    };
});