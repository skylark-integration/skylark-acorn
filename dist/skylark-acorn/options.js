/**
 * skylark-acorn - A version of acorn that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./util","./locutil"],function(e,n){"use strict";const{hasOwn:o,isArray:l}=e,{SourceLocation:t}=n,r={ecmaVersion:null,sourceType:"script",onInsertedSemicolon:null,onTrailingComma:null,allowReserved:null,allowReturnOutsideFunction:!1,allowImportExportEverywhere:!1,allowAwaitOutsideFunction:null,allowSuperOutsideMethod:null,allowHashBang:!1,checkPrivateFields:!0,locations:!1,onToken:null,onComment:null,ranges:!1,program:null,sourceFile:null,directSourceFile:null,preserveParens:!1};let i=!1;return{defaultOptions:r,getOptions:function(e){let n={};for(let l in r)n[l]=e&&o(e,l)?e[l]:r[l];if("latest"===n.ecmaVersion?n.ecmaVersion=1e8:null==n.ecmaVersion?(!i&&"object"==typeof console&&console.warn&&(i=!0,console.warn("Since Acorn 8.0.0, options.ecmaVersion is required.\nDefaulting to 2020, but this will stop working in the future.")),n.ecmaVersion=11):n.ecmaVersion>=2015&&(n.ecmaVersion-=2009),null==n.allowReserved&&(n.allowReserved=n.ecmaVersion<5),e&&null!=e.allowHashBang||(n.allowHashBang=n.ecmaVersion>=14),l(n.onToken)){let e=n.onToken;n.onToken=(n=>e.push(n))}return l(n.onComment)&&(n.onComment=function(e,n){return function(o,l,r,i,s,a){let u={type:o?"Block":"Line",value:l,start:r,end:i};e.locations&&(u.loc=new t(this,s,a)),e.ranges&&(u.range=[r,i]),n.push(u)}}(n,n.onComment)),n}}});
//# sourceMappingURL=sourcemaps/options.js.map
