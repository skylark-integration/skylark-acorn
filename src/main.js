define([
    './state',
    './parseutil',
    './statement',
    './lval',
    './expression',
    './location',
    './scope',
    './options',
    './locutil',
    './node',
    './tokentype',
    './tokentype',
    './tokentype',
    './tokencontext',
    './tokencontext',
    './identifier',
    './tokenize',
    './whitespace'
], function (m_state, m_options, m_locutil, m_node, m_tokentype, tokTypes, keywordTypes, m_tokencontext, tokContexts, m_identifier, m_tokenize, m_whitespace) {
    'use strict';
    const {Parser} = m_state;
    const {defaultOptions} = m_options;
    const {Position, SourceLocation, getLineInfo} = m_locutil;
    const {Node} = m_node;
    const {TokenType} = m_tokentype;
    const {TokContext} = m_tokencontext;
    const {isIdentifierChar, isIdentifierStart} = m_identifier;
    const {Token} = m_tokenize;
    const {isNewLine, lineBreak, lineBreakG, nonASCIIwhitespace} = m_whitespace;
    const version = '8.10.0';
    Parser.acorn = {
        Parser,
        version,
        defaultOptions,
        Position,
        SourceLocation,
        getLineInfo,
        Node,
        TokenType,
        tokTypes,
        keywordTypes,
        TokContext,
        tokContexts,
        isIdentifierChar,
        isIdentifierStart,
        Token,
        isNewLine,
        lineBreak,
        lineBreakG,
        nonASCIIwhitespace
    };
    function parse(input, options) {
        return Parser.parse(input, options);
    }
    function parseExpressionAt(input, pos, options) {
        return Parser.parseExpressionAt(input, pos, options);
    }
    function tokenizer(input, options) {
        return Parser.tokenizer(input, options);
    }
    return {
        version: version,
        Parser,
        defaultOptions,
        Position,
        SourceLocation,
        getLineInfo,
        Node,
        TokenType,
        tokTypes,
        keywordTypes,
        TokContext,
        tokContexts,
        isIdentifierChar,
        isIdentifierStart,
        Token,
        isNewLine,
        lineBreak,
        lineBreakG,
        nonASCIIwhitespace,
        parse: parse,
        parseExpressionAt: parseExpressionAt,
        tokenizer: tokenizer
    };
});