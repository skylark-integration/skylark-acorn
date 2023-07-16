/**
 * skylark-acorn - A version of acorn that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./whitespace"],function(t){"use strict";const{nextLineBreak:e}=t;class n{constructor(t,e){this.line=t,this.column=e}offset(t){return new n(this.line,this.column+t)}}return{Position:n,SourceLocation:class{constructor(t,e,n){this.start=e,this.end=n,null!==t.sourceFile&&(this.source=t.sourceFile)}},getLineInfo:function(t,s){for(let i=1,o=0;;){let c=e(t,o,s);if(c<0)return new n(i,s-o);++i,o=c}}}});
//# sourceMappingURL=sourcemaps/locutil.js.map
