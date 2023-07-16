/**
 * skylark-acorn - A version of acorn that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./tokentype","./state","./whitespace"],function(t,e,i){"use strict";const{Parser:s}=e,{lineBreak:n,skipWhiteSpace:r}=i,o=s.prototype,a=/^(?:'((?:\\.|[^'\\])*?)'|"((?:\\.|[^"\\])*?)")/;o.strictDirective=function(t){if(this.options.ecmaVersion<5)return!1;for(;;){r.lastIndex=t,t+=r.exec(this.input)[0].length;let e=a.exec(this.input.slice(t));if(!e)return!1;if("use strict"===(e[1]||e[2])){r.lastIndex=t+e[0].length;let i=r.exec(this.input),s=i.index+i[0].length,o=this.input.charAt(s);return";"===o||"}"===o||n.test(i[0])&&!(/[(`.[+\-/*%<>=,?^&]/.test(o)||"!"===o&&"="===this.input.charAt(s+1))}t+=e[0].length,r.lastIndex=t,t+=r.exec(this.input)[0].length,";"===this.input[t]&&t++}},o.eat=function(t){return this.type===t&&(this.next(),!0)},o.isContextual=function(e){return this.type===t.name&&this.value===e&&!this.containsEsc},o.eatContextual=function(t){return!!this.isContextual(t)&&(this.next(),!0)},o.expectContextual=function(t){this.eatContextual(t)||this.unexpected()},o.canInsertSemicolon=function(){return this.type===t.eof||this.type===t.braceR||n.test(this.input.slice(this.lastTokEnd,this.start))},o.insertSemicolon=function(){if(this.canInsertSemicolon())return this.options.onInsertedSemicolon&&this.options.onInsertedSemicolon(this.lastTokEnd,this.lastTokEndLoc),!0},o.semicolon=function(){this.eat(t.semi)||this.insertSemicolon()||this.unexpected()},o.afterTrailingComma=function(t,e){if(this.type===t)return this.options.onTrailingComma&&this.options.onTrailingComma(this.lastTokStart,this.lastTokStartLoc),e||this.next(),!0},o.expect=function(t){this.eat(t)||this.unexpected()},o.unexpected=function(t){this.raise(null!=t?t:this.start,"Unexpected token")};return o.checkPatternErrors=function(t,e){if(!t)return;t.trailingComma>-1&&this.raiseRecoverable(t.trailingComma,"Comma is not permitted after the rest element");let i=e?t.parenthesizedAssign:t.parenthesizedBind;i>-1&&this.raiseRecoverable(i,e?"Assigning to rvalue":"Parenthesized pattern")},o.checkExpressionErrors=function(t,e){if(!t)return!1;let{shorthandAssign:i,doubleProto:s}=t;if(!e)return i>=0||s>=0;i>=0&&this.raise(i,"Shorthand property assignments are valid only in destructuring patterns"),s>=0&&this.raiseRecoverable(s,"Redefinition of __proto__ property")},o.checkYieldAwaitInDefaultParams=function(){this.yieldPos&&(!this.awaitPos||this.yieldPos<this.awaitPos)&&this.raise(this.yieldPos,"Yield expression cannot be a default value"),this.awaitPos&&this.raise(this.awaitPos,"Await expression cannot be a default value")},o.isSimpleAssignTarget=function(t){return"ParenthesizedExpression"===t.type?this.isSimpleAssignTarget(t.expression):"Identifier"===t.type||"MemberExpression"===t.type},{DestructuringErrors:class{constructor(){this.shorthandAssign=this.trailingComma=this.parenthesizedAssign=this.parenthesizedBind=this.doubleProto=-1}}}});
//# sourceMappingURL=sourcemaps/parseutil.js.map