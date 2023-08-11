define([
    './identifier',
    './tokentype',
    './whitespace',
    './options',
    './util',
    './scopeflags'
], function (m_identifier, m_tokentype, m_whitespace, m_options, m_util, m_scopeflags) {
    'use strict';
    const {reservedWords, keywords} = m_identifier;
    const {types : tt} = m_tokentype;

    const {lineBreak} = m_whitespace;
    const {getOptions} = m_options;
    const {wordsRegexp} = m_util;
    const {SCOPE_TOP, SCOPE_FUNCTION, SCOPE_ASYNC, SCOPE_GENERATOR, SCOPE_SUPER, SCOPE_DIRECT_SUPER, SCOPE_CLASS_STATIC_BLOCK} = m_scopeflags;
    class Parser {
        constructor(options, input, startPos) {
            this.options = options = getOptions(options);
            this.sourceFile = options.sourceFile;
            this.keywords = wordsRegexp(keywords[options.ecmaVersion >= 6 ? 6 : options.sourceType === 'module' ? '5module' : 5]);
            let reserved = '';
            if (options.allowReserved !== true) {
                reserved = reservedWords[options.ecmaVersion >= 6 ? 6 : options.ecmaVersion === 5 ? 5 : 3];
                if (options.sourceType === 'module')
                    reserved += ' await';
            }
            this.reservedWords = wordsRegexp(reserved);
            let reservedStrict = (reserved ? reserved + ' ' : '') + reservedWords.strict;
            this.reservedWordsStrict = wordsRegexp(reservedStrict);
            this.reservedWordsStrictBind = wordsRegexp(reservedStrict + ' ' + reservedWords.strictBind);
            this.input = String(input);
            this.containsEsc = false;
            if (startPos) {
                this.pos = startPos;
                this.lineStart = this.input.lastIndexOf('\n', startPos - 1) + 1;
                this.curLine = this.input.slice(0, this.lineStart).split(lineBreak).length;
            } else {
                this.pos = this.lineStart = 0;
                this.curLine = 1;
            }
            this.type = tt.eof;
            this.value = null;
            this.start = this.end = this.pos;
            this.startLoc = this.endLoc = this.curPosition();
            this.lastTokEndLoc = this.lastTokStartLoc = null;
            this.lastTokStart = this.lastTokEnd = this.pos;
            this.context = this.initialContext();
            this.exprAllowed = true;
            this.inModule = options.sourceType === 'module';
            this.strict = this.inModule || this.strictDirective(this.pos);
            this.potentialArrowAt = -1;
            this.potentialArrowInForAwait = false;
            this.yieldPos = this.awaitPos = this.awaitIdentPos = 0;
            this.labels = [];
            this.undefinedExports = Object.create(null);
            if (this.pos === 0 && options.allowHashBang && this.input.slice(0, 2) === '#!')
                this.skipLineComment(2);
            this.scopeStack = [];
            this.enterScope(SCOPE_TOP);
            this.regexpState = null;
            this.privateNameStack = [];
        }
        parse() {
            let node = this.options.program || this.startNode();
            this.nextToken();
            return this.parseTopLevel(node);
        }
        get inFunction() {
            return (this.currentVarScope().flags & SCOPE_FUNCTION) > 0;
        }
        get inGenerator() {
            return (this.currentVarScope().flags & SCOPE_GENERATOR) > 0 && !this.currentVarScope().inClassFieldInit;
        }
        get inAsync() {
            return (this.currentVarScope().flags & SCOPE_ASYNC) > 0 && !this.currentVarScope().inClassFieldInit;
        }
        get canAwait() {
            for (let i = this.scopeStack.length - 1; i >= 0; i--) {
                let scope = this.scopeStack[i];
                if (scope.inClassFieldInit || scope.flags & SCOPE_CLASS_STATIC_BLOCK)
                    return false;
                if (scope.flags & SCOPE_FUNCTION)
                    return (scope.flags & SCOPE_ASYNC) > 0;
            }
            return this.inModule && this.options.ecmaVersion >= 13 || this.options.allowAwaitOutsideFunction;
        }
        get allowSuper() {
            const {flags, inClassFieldInit} = this.currentThisScope();
            return (flags & SCOPE_SUPER) > 0 || inClassFieldInit || this.options.allowSuperOutsideMethod;
        }
        get allowDirectSuper() {
            return (this.currentThisScope().flags & SCOPE_DIRECT_SUPER) > 0;
        }
        get treatFunctionsAsVar() {
            return this.treatFunctionsAsVarInScope(this.currentScope());
        }
        get allowNewDotTarget() {
            const {flags, inClassFieldInit} = this.currentThisScope();
            return (flags & (SCOPE_FUNCTION | SCOPE_CLASS_STATIC_BLOCK)) > 0 || inClassFieldInit;
        }
        get inClassStaticBlock() {
            return (this.currentVarScope().flags & SCOPE_CLASS_STATIC_BLOCK) > 0;
        }
        static extend(...plugins) {
            let cls = this;
            for (let i = 0; i < plugins.length; i++)
                cls = plugins[i](cls);
            return cls;
        }
        static parse(input, options) {
            return new this(options, input).parse();
        }
        static parseExpressionAt(input, pos, options) {
            let parser = new this(options, input, pos);
            parser.nextToken();
            return parser.parseExpression();
        }
        static tokenizer(input, options) {
            return new this(options, input);
        }
    }
    return { Parser: Parser };
});