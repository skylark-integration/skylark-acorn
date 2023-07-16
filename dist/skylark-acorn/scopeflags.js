/**
 * skylark-acorn - A version of acorn that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(function(){"use strict";const C=2,_=4,E=8;return{SCOPE_TOP:1,SCOPE_FUNCTION:C,SCOPE_ASYNC:_,SCOPE_GENERATOR:E,SCOPE_ARROW:16,SCOPE_SIMPLE_CATCH:32,SCOPE_SUPER:64,SCOPE_DIRECT_SUPER:128,SCOPE_CLASS_STATIC_BLOCK:256,SCOPE_VAR:257|C,functionFlags:function(S,O){return C|(S?_:0)|(O?E:0)},BIND_NONE:0,BIND_VAR:1,BIND_LEXICAL:2,BIND_FUNCTION:3,BIND_SIMPLE_CATCH:4,BIND_OUTSIDE:5}});
//# sourceMappingURL=sourcemaps/scopeflags.js.map
