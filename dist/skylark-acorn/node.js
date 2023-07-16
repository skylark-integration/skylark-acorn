/**
 * skylark-acorn - A version of acorn that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./state","./locutil"],function(t,o){"use strict";const{Parser:n}=t,{SourceLocation:s}=o;class i{constructor(t,o,n){this.type="",this.start=o,this.end=0,t.options.locations&&(this.loc=new s(t,n)),t.options.directSourceFile&&(this.sourceFile=t.options.directSourceFile),t.options.ranges&&(this.range=[o,0])}}const e=n.prototype;function r(t,o,n,s){return t.type=o,t.end=n,this.options.locations&&(t.loc.end=s),this.options.ranges&&(t.range[1]=n),t}return e.startNode=function(){return new i(this,this.start,this.startLoc)},e.startNodeAt=function(t,o){return new i(this,t,o)},e.finishNode=function(t,o){return r.call(this,t,o,this.lastTokEnd,this.lastTokEndLoc)},e.finishNodeAt=function(t,o,n,s){return r.call(this,t,o,n,s)},e.copyNode=function(t){let o=new i(this,t.start,this.startLoc);for(let n in t)o[n]=t[n];return o},{Node:i}});
//# sourceMappingURL=sourcemaps/node.js.map
