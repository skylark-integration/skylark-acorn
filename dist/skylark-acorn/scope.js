/**
 * skylark-acorn - A version of acorn that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./state","./scopeflags"],function(e,t){"use strict";const{Parser:s}=e,{SCOPE_VAR:i,SCOPE_FUNCTION:n,SCOPE_TOP:c,SCOPE_ARROW:a,SCOPE_SIMPLE_CATCH:o,BIND_LEXICAL:l,BIND_SIMPLE_CATCH:r,BIND_FUNCTION:f}=t,h=s.prototype;h.enterScope=function(e){this.scopeStack.push(new class{constructor(e){this.flags=e,this.var=[],this.lexical=[],this.functions=[],this.inClassFieldInit=!1}}(e))},h.exitScope=function(){this.scopeStack.pop()},h.treatFunctionsAsVarInScope=function(e){return e.flags&n||!this.inModule&&e.flags&c},h.declareName=function(e,t,s){let n=!1;if(t===l){const t=this.currentScope();n=t.lexical.indexOf(e)>-1||t.functions.indexOf(e)>-1||t.var.indexOf(e)>-1,t.lexical.push(e),this.inModule&&t.flags&c&&delete this.undefinedExports[e]}else if(t===r){this.currentScope().lexical.push(e)}else if(t===f){const t=this.currentScope();n=this.treatFunctionsAsVar?t.lexical.indexOf(e)>-1:t.lexical.indexOf(e)>-1||t.var.indexOf(e)>-1,t.functions.push(e)}else for(let t=this.scopeStack.length-1;t>=0;--t){const s=this.scopeStack[t];if(s.lexical.indexOf(e)>-1&&!(s.flags&o&&s.lexical[0]===e)||!this.treatFunctionsAsVarInScope(s)&&s.functions.indexOf(e)>-1){n=!0;break}if(s.var.push(e),this.inModule&&s.flags&c&&delete this.undefinedExports[e],s.flags&i)break}n&&this.raiseRecoverable(s,`Identifier '${e}' has already been declared`)},h.checkLocalExport=function(e){-1===this.scopeStack[0].lexical.indexOf(e.name)&&-1===this.scopeStack[0].var.indexOf(e.name)&&(this.undefinedExports[e.name]=e)},h.currentScope=function(){return this.scopeStack[this.scopeStack.length-1]},h.currentVarScope=function(){for(let e=this.scopeStack.length-1;;e--){let t=this.scopeStack[e];if(t.flags&i)return t}},h.currentThisScope=function(){for(let e=this.scopeStack.length-1;;e--){let t=this.scopeStack[e];if(t.flags&i&&!(t.flags&a))return t}}});
//# sourceMappingURL=sourcemaps/scope.js.map