/**
 * skylark-acorn - A version of acorn that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./state","./locutil"],function(t,i){"use strict";const{Parser:o}=t,{Position:e,getLineInfo:n}=i,s=o.prototype;s.raise=function(t,i){let o=n(this.input,t);i+=" ("+o.line+":"+o.column+")";let e=new SyntaxError(i);throw e.pos=t,e.loc=o,e.raisedAt=this.pos,e},s.raiseRecoverable=s.raise,s.curPosition=function(){if(this.options.locations)return new e(this.curLine,this.pos-this.lineStart)}});
//# sourceMappingURL=sourcemaps/location.js.map
