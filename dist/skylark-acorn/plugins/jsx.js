/**
 * skylark-acorn - A version of acorn that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define([],function(){const t={quot:'"',amp:"&",apos:"'",lt:"<",gt:">",nbsp:" ",iexcl:"¡",cent:"¢",pound:"£",curren:"¤",yen:"¥",brvbar:"¦",sect:"§",uml:"¨",copy:"©",ordf:"ª",laquo:"«",not:"¬",shy:"­",reg:"®",macr:"¯",deg:"°",plusmn:"±",sup2:"²",sup3:"³",acute:"´",micro:"µ",para:"¶",middot:"·",cedil:"¸",sup1:"¹",ordm:"º",raquo:"»",frac14:"¼",frac12:"½",frac34:"¾",iquest:"¿",Agrave:"À",Aacute:"Á",Acirc:"Â",Atilde:"Ã",Auml:"Ä",Aring:"Å",AElig:"Æ",Ccedil:"Ç",Egrave:"È",Eacute:"É",Ecirc:"Ê",Euml:"Ë",Igrave:"Ì",Iacute:"Í",Icirc:"Î",Iuml:"Ï",ETH:"Ð",Ntilde:"Ñ",Ograve:"Ò",Oacute:"Ó",Ocirc:"Ô",Otilde:"Õ",Ouml:"Ö",times:"×",Oslash:"Ø",Ugrave:"Ù",Uacute:"Ú",Ucirc:"Û",Uuml:"Ü",Yacute:"Ý",THORN:"Þ",szlig:"ß",agrave:"à",aacute:"á",acirc:"â",atilde:"ã",auml:"ä",aring:"å",aelig:"æ",ccedil:"ç",egrave:"è",eacute:"é",ecirc:"ê",euml:"ë",igrave:"ì",iacute:"í",icirc:"î",iuml:"ï",eth:"ð",ntilde:"ñ",ograve:"ò",oacute:"ó",ocirc:"ô",otilde:"õ",ouml:"ö",divide:"÷",oslash:"ø",ugrave:"ù",uacute:"ú",ucirc:"û",uuml:"ü",yacute:"ý",thorn:"þ",yuml:"ÿ",OElig:"Œ",oelig:"œ",Scaron:"Š",scaron:"š",Yuml:"Ÿ",fnof:"ƒ",circ:"ˆ",tilde:"˜",Alpha:"Α",Beta:"Β",Gamma:"Γ",Delta:"Δ",Epsilon:"Ε",Zeta:"Ζ",Eta:"Η",Theta:"Θ",Iota:"Ι",Kappa:"Κ",Lambda:"Λ",Mu:"Μ",Nu:"Ν",Xi:"Ξ",Omicron:"Ο",Pi:"Π",Rho:"Ρ",Sigma:"Σ",Tau:"Τ",Upsilon:"Υ",Phi:"Φ",Chi:"Χ",Psi:"Ψ",Omega:"Ω",alpha:"α",beta:"β",gamma:"γ",delta:"δ",epsilon:"ε",zeta:"ζ",eta:"η",theta:"θ",iota:"ι",kappa:"κ",lambda:"λ",mu:"μ",nu:"ν",xi:"ξ",omicron:"ο",pi:"π",rho:"ρ",sigmaf:"ς",sigma:"σ",tau:"τ",upsilon:"υ",phi:"φ",chi:"χ",psi:"ψ",omega:"ω",thetasym:"ϑ",upsih:"ϒ",piv:"ϖ",ensp:" ",emsp:" ",thinsp:" ",zwnj:"‌",zwj:"‍",lrm:"‎",rlm:"‏",ndash:"–",mdash:"—",lsquo:"‘",rsquo:"’",sbquo:"‚",ldquo:"“",rdquo:"”",bdquo:"„",dagger:"†",Dagger:"‡",bull:"•",hellip:"…",permil:"‰",prime:"′",Prime:"″",lsaquo:"‹",rsaquo:"›",oline:"‾",frasl:"⁄",euro:"€",image:"ℑ",weierp:"℘",real:"ℜ",trade:"™",alefsym:"ℵ",larr:"←",uarr:"↑",rarr:"→",darr:"↓",harr:"↔",crarr:"↵",lArr:"⇐",uArr:"⇑",rArr:"⇒",dArr:"⇓",hArr:"⇔",forall:"∀",part:"∂",exist:"∃",empty:"∅",nabla:"∇",isin:"∈",notin:"∉",ni:"∋",prod:"∏",sum:"∑",minus:"−",lowast:"∗",radic:"√",prop:"∝",infin:"∞",ang:"∠",and:"∧",or:"∨",cap:"∩",cup:"∪",int:"∫",there4:"∴",sim:"∼",cong:"≅",asymp:"≈",ne:"≠",equiv:"≡",le:"≤",ge:"≥",sub:"⊂",sup:"⊃",nsub:"⊄",sube:"⊆",supe:"⊇",oplus:"⊕",otimes:"⊗",perp:"⊥",sdot:"⋅",lceil:"⌈",rceil:"⌉",lfloor:"⌊",rfloor:"⌋",lang:"〈",rang:"〉",loz:"◊",spades:"♠",clubs:"♣",hearts:"♥",diams:"♦"},e=/^[\da-fA-F]+$/,s=/^\d+$/,i=new WeakMap;function r(t){t=t.Parser.acorn||t;let e=i.get(t);if(!e){const s=t.tokTypes,r=t.TokContext,a=t.TokenType,n=new r("<tag",!1),o=new r("</tag",!1),h=new r("<tag>...</tag>",!0,!0),p={tc_oTag:n,tc_cTag:o,tc_expr:h},l={jsxName:new a("jsxName"),jsxText:new a("jsxText",{beforeExpr:!0}),jsxTagStart:new a("jsxTagStart",{startsExpr:!0}),jsxTagEnd:new a("jsxTagEnd")};l.jsxTagStart.updateContext=function(){this.context.push(h),this.context.push(n),this.exprAllowed=!1},l.jsxTagEnd.updateContext=function(t){let e=this.context.pop();e===n&&t===s.slash||e===o?(this.context.pop(),this.exprAllowed=this.curContext()===h):this.exprAllowed=!0},e={tokContexts:p,tokTypes:l},i.set(t,e)}return e}function a(t){return t?"JSXIdentifier"===t.type?t.name:"JSXNamespacedName"===t.type?t.namespace.name+":"+t.name.name:"JSXMemberExpression"===t.type?a(t.object)+"."+a(t.property):void 0:t}function n(i){return i=i||{},function(n){return function(i,n){const o=n.acorn||require("acorn"),h=r(o),p=o.tokTypes,l=h.tokTypes,u=o.tokContexts,c=h.tokContexts.tc_oTag,d=h.tokContexts.tc_cTag,x=h.tokContexts.tc_expr,m=o.isNewLine,g=o.isIdentifierStart,f=o.isIdentifierChar;return class extends n{static get acornJsx(){return h}jsx_readToken(){let t="",e=this.pos;for(;;){this.pos>=this.input.length&&this.raise(this.start,"Unterminated JSX contents");let s=this.input.charCodeAt(this.pos);switch(s){case 60:case 123:return this.pos===this.start?60===s&&this.exprAllowed?(++this.pos,this.finishToken(l.jsxTagStart)):this.getTokenFromCode(s):(t+=this.input.slice(e,this.pos),this.finishToken(l.jsxText,t));case 38:t+=this.input.slice(e,this.pos),t+=this.jsx_readEntity(),e=this.pos;break;case 62:case 125:this.raise(this.pos,"Unexpected token `"+this.input[this.pos]+"`. Did you mean `"+(62===s?"&gt;":"&rbrace;")+'` or `{"'+this.input[this.pos]+'"}`?');default:m(s)?(t+=this.input.slice(e,this.pos),t+=this.jsx_readNewLine(!0),e=this.pos):++this.pos}}}jsx_readNewLine(t){let e,s=this.input.charCodeAt(this.pos);return++this.pos,13===s&&10===this.input.charCodeAt(this.pos)?(++this.pos,e=t?"\n":"\r\n"):e=String.fromCharCode(s),this.options.locations&&(++this.curLine,this.lineStart=this.pos),e}jsx_readString(t){let e="",s=++this.pos;for(;;){this.pos>=this.input.length&&this.raise(this.start,"Unterminated string constant");let i=this.input.charCodeAt(this.pos);if(i===t)break;38===i?(e+=this.input.slice(s,this.pos),e+=this.jsx_readEntity(),s=this.pos):m(i)?(e+=this.input.slice(s,this.pos),e+=this.jsx_readNewLine(!1),s=this.pos):++this.pos}return e+=this.input.slice(s,this.pos++),this.finishToken(p.string,e)}jsx_readEntity(){let i,r="",a=0,n=this.input[this.pos];"&"!==n&&this.raise(this.pos,"Entity must start with an ampersand");let o=++this.pos;for(;this.pos<this.input.length&&a++<10;){if(";"===(n=this.input[this.pos++])){"#"===r[0]?"x"===r[1]?(r=r.substr(2),e.test(r)&&(i=String.fromCharCode(parseInt(r,16)))):(r=r.substr(1),s.test(r)&&(i=String.fromCharCode(parseInt(r,10)))):i=t[r];break}r+=n}return i||(this.pos=o,"&")}jsx_readWord(){let t,e=this.pos;do{t=this.input.charCodeAt(++this.pos)}while(f(t)||45===t);return this.finishToken(l.jsxName,this.input.slice(e,this.pos))}jsx_parseIdentifier(){let t=this.startNode();return this.type===l.jsxName?t.name=this.value:this.type.keyword?t.name=this.type.keyword:this.unexpected(),this.next(),this.finishNode(t,"JSXIdentifier")}jsx_parseNamespacedName(){let t=this.start,e=this.startLoc,s=this.jsx_parseIdentifier();if(!i.allowNamespaces||!this.eat(p.colon))return s;var r=this.startNodeAt(t,e);return r.namespace=s,r.name=this.jsx_parseIdentifier(),this.finishNode(r,"JSXNamespacedName")}jsx_parseElementName(){if(this.type===l.jsxTagEnd)return"";let t=this.start,e=this.startLoc,s=this.jsx_parseNamespacedName();for(this.type!==p.dot||"JSXNamespacedName"!==s.type||i.allowNamespacedObjects||this.unexpected();this.eat(p.dot);){let i=this.startNodeAt(t,e);i.object=s,i.property=this.jsx_parseIdentifier(),s=this.finishNode(i,"JSXMemberExpression")}return s}jsx_parseAttributeValue(){switch(this.type){case p.braceL:let t=this.jsx_parseExpressionContainer();return"JSXEmptyExpression"===t.expression.type&&this.raise(t.start,"JSX attributes must only be assigned a non-empty expression"),t;case l.jsxTagStart:case p.string:return this.parseExprAtom();default:this.raise(this.start,"JSX value should be either an expression or a quoted JSX text")}}jsx_parseEmptyExpression(){let t=this.startNodeAt(this.lastTokEnd,this.lastTokEndLoc);return this.finishNodeAt(t,"JSXEmptyExpression",this.start,this.startLoc)}jsx_parseExpressionContainer(){let t=this.startNode();return this.next(),t.expression=this.type===p.braceR?this.jsx_parseEmptyExpression():this.parseExpression(),this.expect(p.braceR),this.finishNode(t,"JSXExpressionContainer")}jsx_parseAttribute(){let t=this.startNode();return this.eat(p.braceL)?(this.expect(p.ellipsis),t.argument=this.parseMaybeAssign(),this.expect(p.braceR),this.finishNode(t,"JSXSpreadAttribute")):(t.name=this.jsx_parseNamespacedName(),t.value=this.eat(p.eq)?this.jsx_parseAttributeValue():null,this.finishNode(t,"JSXAttribute"))}jsx_parseOpeningElementAt(t,e){let s=this.startNodeAt(t,e);s.attributes=[];let i=this.jsx_parseElementName();for(i&&(s.name=i);this.type!==p.slash&&this.type!==l.jsxTagEnd;)s.attributes.push(this.jsx_parseAttribute());return s.selfClosing=this.eat(p.slash),this.expect(l.jsxTagEnd),this.finishNode(s,i?"JSXOpeningElement":"JSXOpeningFragment")}jsx_parseClosingElementAt(t,e){let s=this.startNodeAt(t,e),i=this.jsx_parseElementName();return i&&(s.name=i),this.expect(l.jsxTagEnd),this.finishNode(s,i?"JSXClosingElement":"JSXClosingFragment")}jsx_parseElementAt(t,e){let s=this.startNodeAt(t,e),i=[],r=this.jsx_parseOpeningElementAt(t,e),n=null;if(!r.selfClosing){t:for(;;)switch(this.type){case l.jsxTagStart:if(t=this.start,e=this.startLoc,this.next(),this.eat(p.slash)){n=this.jsx_parseClosingElementAt(t,e);break t}i.push(this.jsx_parseElementAt(t,e));break;case l.jsxText:i.push(this.parseExprAtom());break;case p.braceL:i.push(this.jsx_parseExpressionContainer());break;default:this.unexpected()}a(n.name)!==a(r.name)&&this.raise(n.start,"Expected corresponding JSX closing tag for <"+a(r.name)+">")}let o=r.name?"Element":"Fragment";return s["opening"+o]=r,s["closing"+o]=n,s.children=i,this.type===p.relational&&"<"===this.value&&this.raise(this.start,"Adjacent JSX elements must be wrapped in an enclosing tag"),this.finishNode(s,"JSX"+o)}jsx_parseText(){let t=this.parseLiteral(this.value);return t.type="JSXText",t}jsx_parseElement(){let t=this.start,e=this.startLoc;return this.next(),this.jsx_parseElementAt(t,e)}parseExprAtom(t){return this.type===l.jsxText?this.jsx_parseText():this.type===l.jsxTagStart?this.jsx_parseElement():super.parseExprAtom(t)}readToken(t){let e=this.curContext();if(e===x)return this.jsx_readToken();if(e===c||e===d){if(g(t))return this.jsx_readWord();if(62==t)return++this.pos,this.finishToken(l.jsxTagEnd);if((34===t||39===t)&&e==c)return this.jsx_readString(t)}return 60===t&&this.exprAllowed&&33!==this.input.charCodeAt(this.pos+1)?(++this.pos,this.finishToken(l.jsxTagStart)):super.readToken(t)}updateContext(t){if(this.type==p.braceL){var e=this.curContext();e==c?this.context.push(u.b_expr):e==x?this.context.push(u.b_tmpl):super.updateContext(t),this.exprAllowed=!0}else{if(this.type!==p.slash||t!==l.jsxTagStart)return super.updateContext(t);this.context.length-=2,this.context.push(d),this.exprAllowed=!1}}}}({allowNamespaces:!1!==i.allowNamespaces,allowNamespacedObjects:!!i.allowNamespacedObjects},n)}}return Object.defineProperty(n,"tokTypes",{get:function(){return r(require("acorn")).tokTypes},configurable:!0,enumerable:!0}),n});
//# sourceMappingURL=../sourcemaps/plugins/jsx.js.map