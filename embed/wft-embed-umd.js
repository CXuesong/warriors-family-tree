!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?exports.WarriorsFamilyTreeEmbed=t():e.WarriorsFamilyTreeEmbed=t()}(window,(function(){return function(e){var t={};function r(o){if(t[o])return t[o].exports;var n=t[o]={i:o,l:!1,exports:{}};return e[o].call(n.exports,n,n.exports,r),n.l=!0,n.exports}return r.m=e,r.c=t,r.d=function(e,t,o){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:o})},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var o=Object.create(null);if(r.r(o),Object.defineProperty(o,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var n in e)r.d(o,n,function(t){return e[t]}.bind(null,n));return o},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="",r(r.s=1)}([function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.defaultAppUrlStem="https://crystal-pool.github.io/warriors-family-tree/#",t.mountEmbed=function(e,r){if(!(e&&e instanceof HTMLElement))throw new TypeError("container should be an HTMLElement object.");if(r&&"object"!=typeof r)throw new TypeError("options should be an IEmbedOptions object.");var n=(r=r||{}).embedOptions||{},s=n.urlStem||t.defaultAppUrlStem,a="wft-pmt-"+Math.round(2821109907456*Math.random()).toString(36);if(r.route&&(s+=r.route),r.queryParams){var i=void 0;if("object"==typeof r.queryParams)for(var u in i=new URLSearchParams,r.queryParams){if(r.queryParams.hasOwnProperty(u))null!=(d=r.queryParams[u])&&i.append(u,d)}else i=new URLSearchParams(r.queryParams);i.set("embed","true"),i.set("pmToken",a),s+="?"+String(i)}var l=document.createElement("iframe");if(l.className="warriors-family-tree-embed "+(n.className||""),n.style)for(var u in n.style){var d;if(n.style.hasOwnProperty(u))"number"==typeof(d=n.style[u])&&(d=String(d)),l.style.setProperty(u,d)}else l.style.borderWidth="0",l.style.width="100%",l.style.transition="height 0.5s ease-out";l.allow="fullscreen",l.sandbox.add("allow-popups","allow-popups-to-escape-sandbox","allow-scripts","allow-same-origin");var p=null==n.autoResize||n.autoResize,f=new o(l,a,{observeDocumentHeight:p,scrollable:n.scrollable},(function(e){switch(e.type){case"documentHeightChanged":p&&(l.style.height=e.height+"px")}}));return l.src=s,e.appendChild(l),{dispose:function(){f.dispose(),l.remove()}}};var o=function(){function e(e,t,r,o){var n=this;this._embedFrame=e,this._messageToken=t,this._hostSettings=r,this._messageCallback=o,this._onMessage=function(e){if(e.isTrusted&&e.data&&"object"==typeof e.data&&e.data.token===n._messageToken&&"string"==typeof e.data.type){var t=e.data;switch(t.type){case"ready":n.postMessage({type:"initialize",url:location.href,revision:"d86a1050995de5a7aedf9bf34e6247bb6c717441",buildTimestamp:1572668146013,settings:n._hostSettings})}n._messageCallback(t)}},window.addEventListener("message",this._onMessage)}return e.prototype.postMessage=function(e){if(e.token||(e.token=this._messageToken),!this._embedFrame.contentWindow)throw new Error("Cannot postMessage to the embed <iframe>.");this._embedFrame.contentWindow.postMessage(e,"*")},e.prototype.dispose=function(){window.removeEventListener("message",this._onMessage)},e}()},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var o=r(0);t.mountEmbed=o.mountEmbed;var n=r(2);t.mountFamilyTree=n.mountFamilyTree},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var o=r(0);t.mountFamilyTree=function(e,t){if(!t)throw new TypeError("options argument is required.");if("object"!=typeof t)throw new TypeError("options should be an IFamilyTreeOptions object.");return o.mountEmbed(e,{route:"/familyTree/"+t.qName,queryParams:{depth:t.depth}})}}])}));
//# sourceMappingURL=wft-embed-umd.js.map