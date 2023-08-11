/**
 * skylark-acorn - A version of acorn that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./state","./parseutil","./statement","./lval","./expression","./location","./scope","./options","./locutil","./node","./tokentype","./tokencontext","./identifier","./tokenize","./whitespace"],function(e,n,t,o,i,r,s,a,k,p,c,d,f,u,T){"use strict";const{Parser:l}=e,{defaultOptions:I}=a,{Position:y,SourceLocation:C,getLineInfo:w}=k,{Node:x}=p,{TokenType:L,types:S,keywords:h}=c,{TokContext:B,types:N}=d,{isIdentifierChar:P,isIdentifierStart:A}=f,{Token:g}=u,{isNewLine:v,lineBreak:z,lineBreakG:G,nonASCIIwhitespace:O}=T;return l.acorn={Parser:l,version:"8.10.0",defaultOptions:I,Position:y,SourceLocation:C,getLineInfo:w,Node:x,TokenType:L,tokTypes:S,keywordTypes:h,TokContext:B,tokContexts:N,isIdentifierChar:P,isIdentifierStart:A,Token:g,isNewLine:v,lineBreak:z,lineBreakG:G,nonASCIIwhitespace:O},{version:"8.10.0",Parser:l,defaultOptions:I,Position:y,SourceLocation:C,getLineInfo:w,Node:x,TokenType:L,tokTypes:S,keywordTypes:h,TokContext:B,tokContexts:N,isIdentifierChar:P,isIdentifierStart:A,Token:g,isNewLine:v,lineBreak:z,lineBreakG:G,nonASCIIwhitespace:O,parse:function(e,n){return l.parse(e,n)},parseExpressionAt:function(e,n,t){return l.parseExpressionAt(e,n,t)},tokenizer:function(e,n){return l.tokenizer(e,n)}}});
//# sourceMappingURL=sourcemaps/main.js.map
