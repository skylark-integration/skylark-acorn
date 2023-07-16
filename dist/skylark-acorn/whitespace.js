/**
 * skylark-acorn - A version of acorn that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(function(){"use strict";const e=/\r\n?|\n|\u2028|\u2029/;function n(e){return 10===e||13===e||8232===e||8233===e}return{lineBreak:e,lineBreakG:new RegExp(e.source,"g"),isNewLine:n,nextLineBreak:function(e,t,u=e.length){for(let r=t;r<u;r++){let t=e.charCodeAt(r);if(n(t))return r<u-1&&13===t&&10===e.charCodeAt(r+1)?r+2:r+1}return-1},nonASCIIwhitespace:/[\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff]/,skipWhiteSpace:/(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g}});
//# sourceMappingURL=sourcemaps/whitespace.js.map
