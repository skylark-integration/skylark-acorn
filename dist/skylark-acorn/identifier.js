/**
 * skylark-acorn - A version of acorn that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./generated/astralIdentifierCodes","./generated/astralIdentifierStartCodes","./generated/nonASCIIidentifierChars","./generated/nonASCIIidentifierStartChars"],function(e,t,r,n){"use strict";const i="break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this",a={5:i,"5module":i+" export import",6:i+" const class extends export import super"},o=new RegExp("["+n+"]"),s=new RegExp("["+n+r+"]");function c(e,t){let r=65536;for(let n=0;n<t.length;n+=2){if((r+=t[n])>e)return!1;if((r+=t[n+1])>=e)return!0}return!1}return{reservedWords:{3:"abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile",5:"class enum extends super const export import",6:"enum",strict:"implements interface let package private protected public static yield",strictBind:"eval arguments"},keywords:a,keywordRelationalOperator:/^in(stanceof)?$/,isIdentifierStart:function(e,r){return e<65?36===e:e<91||(e<97?95===e:e<123||(e<=65535?e>=170&&o.test(String.fromCharCode(e)):!1!==r&&c(e,t)))},isIdentifierChar:function(r,n){return r<48?36===r:r<58||!(r<65)&&(r<91||(r<97?95===r:r<123||(r<=65535?r>=170&&s.test(String.fromCharCode(r)):!1!==n&&(c(r,t)||c(r,e)))))}}});
//# sourceMappingURL=sourcemaps/identifier.js.map
