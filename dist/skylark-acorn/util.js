/**
 * skylark-acorn - A version of acorn that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(function(){"use strict";const{hasOwnProperty:r,toString:e}=Object.prototype;return{hasOwn:Object.hasOwn||((e,t)=>r.call(e,t)),isArray:Array.isArray||(r=>"[object Array]"===e.call(r)),wordsRegexp:function(r){return new RegExp("^(?:"+r.replace(/ /g,"|")+")$")},codePointToString:function(r){return r<=65535?String.fromCharCode(r):(r-=65536,String.fromCharCode(55296+(r>>10),56320+(1023&r)))},loneSurrogate:/[\uD800-\uDFFF]/u}});
//# sourceMappingURL=sourcemaps/util.js.map
