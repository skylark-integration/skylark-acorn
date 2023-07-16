/**
 * skylark-acorn - A version of acorn that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./state","./parseutil","./statement","./lval","./expression","./location","./scope","./options","./locutil","./node","./tokentype","./tokentype","./tokentype","./tokencontext","./tokencontext","./identifier","./tokenize","./whitespace"],function(e,t,n,o,i,r,s,a,k,p,c,f){"use strict";const{Parser:d}=e,{defaultOptions:u}=t,{Position:T,SourceLocation:l,getLineInfo:I}=n,{Node:y}=o,{TokenType:C}=i,{TokContext:x}=a,{isIdentifierChar:w,isIdentifierStart:L}=p,{Token:S}=c,{isNewLine:h,lineBreak:B,lineBreakG:N,nonASCIIwhitespace:P}=f;return d.acorn={Parser:d,version:"8.10.0",defaultOptions:u,Position:T,SourceLocation:l,getLineInfo:I,Node:y,TokenType:C,tokTypes:r,keywordTypes:s,TokContext:x,tokContexts:k,isIdentifierChar:w,isIdentifierStart:L,Token:S,isNewLine:h,lineBreak:B,lineBreakG:N,nonASCIIwhitespace:P},{version:"8.10.0",Parser:d,defaultOptions:u,Position:T,SourceLocation:l,getLineInfo:I,Node:y,TokenType:C,tokTypes:r,keywordTypes:s,TokContext:x,tokContexts:k,isIdentifierChar:w,isIdentifierStart:L,Token:S,isNewLine:h,lineBreak:B,lineBreakG:N,nonASCIIwhitespace:P,parse:function(e,t){return d.parse(e,t)},parseExpressionAt:function(e,t,n){return d.parseExpressionAt(e,t,n)},tokenizer:function(e,t){return d.tokenizer(e,t)}}});
//# sourceMappingURL=sourcemaps/main.js.map
