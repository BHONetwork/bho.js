"use strict";(self.webpackChunk_bho_network_docs=self.webpackChunk_bho_network_docs||[]).push([[222],{876:(e,t,a)=>{a.d(t,{Zo:()=>d,kt:()=>u});var n=a(2784);function i(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function o(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),a.push.apply(a,n)}return a}function r(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{};t%2?o(Object(a),!0).forEach((function(t){i(e,t,a[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(a)):o(Object(a)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(a,t))}))}return e}function l(e,t){if(null==e)return{};var a,n,i=function(e,t){if(null==e)return{};var a,n,i={},o=Object.keys(e);for(n=0;n<o.length;n++)a=o[n],t.indexOf(a)>=0||(i[a]=e[a]);return i}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(n=0;n<o.length;n++)a=o[n],t.indexOf(a)>=0||Object.prototype.propertyIsEnumerable.call(e,a)&&(i[a]=e[a])}return i}var p=n.createContext({}),s=function(e){var t=n.useContext(p),a=t;return e&&(a="function"==typeof e?e(t):r(r({},t),e)),a},d=function(e){var t=s(e.components);return n.createElement(p.Provider,{value:t},e.children)},c={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},m=n.forwardRef((function(e,t){var a=e.components,i=e.mdxType,o=e.originalType,p=e.parentName,d=l(e,["components","mdxType","originalType","parentName"]),m=s(a),u=i,k=m["".concat(p,".").concat(u)]||m[u]||c[u]||o;return a?n.createElement(k,r(r({ref:t},d),{},{components:a})):n.createElement(k,r({ref:t},d))}));function u(e,t){var a=arguments,i=t&&t.mdxType;if("string"==typeof e||i){var o=a.length,r=new Array(o);r[0]=m;var l={};for(var p in t)hasOwnProperty.call(t,p)&&(l[p]=t[p]);l.originalType=e,l.mdxType="string"==typeof e?e:i,r[1]=l;for(var s=2;s<o;s++)r[s]=a[s];return n.createElement.apply(null,r)}return n.createElement.apply(null,a)}m.displayName="MDXCreateElement"},1212:(e,t,a)=>{a.r(t),a.d(t,{assets:()=>p,contentTitle:()=>r,default:()=>c,frontMatter:()=>o,metadata:()=>l,toc:()=>s});var n=a(7896),i=(a(2784),a(876));const o={sidebar_position:1},r="Installation",l={unversionedId:"swap-sdk/getting-started/installation",id:"swap-sdk/getting-started/installation",title:"Installation",description:"Pre-requisites",source:"@site/docs/swap-sdk/getting-started/installation.md",sourceDirName:"swap-sdk/getting-started",slug:"/swap-sdk/getting-started/installation",permalink:"bho.js/docs/swap-sdk/getting-started/installation",draft:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/swap-sdk/getting-started/installation.md",tags:[],version:"current",sidebarPosition:1,frontMatter:{sidebar_position:1},sidebar:"tutorialSidebar",previous:{title:"Overview",permalink:"bho.js/docs/swap-sdk/overview"},next:{title:"Design",permalink:"bho.js/docs/swap-sdk/getting-started/design"}},p={},s=[{value:"Pre-requisites",id:"pre-requisites",level:2},{value:"Install <code>@polkadot/api</code>",id:"install-polkadotapi",level:3},{value:"Install <code>@polkadot/api-contract</code>",id:"install-polkadotapi-contract",level:3},{value:"Installation",id:"installation-1",level:2}],d={toc:s};function c(e){let{components:t,...a}=e;return(0,i.kt)("wrapper",(0,n.Z)({},d,a,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("h1",{id:"installation"},"Installation"),(0,i.kt)("h2",{id:"pre-requisites"},"Pre-requisites"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"BHO Swap SDK")," requires some ",(0,i.kt)("inlineCode",{parentName:"p"},"polkadot.js")," libraries to function. ",(0,i.kt)("inlineCode",{parentName:"p"},"BHO Swap SDK")," declares these dependencies as ",(0,i.kt)("inlineCode",{parentName:"p"},"peerDependencies")," instead of direct ",(0,i.kt)("inlineCode",{parentName:"p"},"dependencies")," in ",(0,i.kt)("inlineCode",{parentName:"p"},"package.json"),". This helps the SDK to use these dependencies already installed by developers to avoid duplication. However, if you haven't installed these dependencies yet, you can install them by using these commands."),(0,i.kt)("div",{className:"admonition admonition-caution alert alert--warning"},(0,i.kt)("div",{parentName:"div",className:"admonition-heading"},(0,i.kt)("h5",{parentName:"div"},(0,i.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,i.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"16",height:"16",viewBox:"0 0 16 16"},(0,i.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M8.893 1.5c-.183-.31-.52-.5-.887-.5s-.703.19-.886.5L.138 13.499a.98.98 0 0 0 0 1.001c.193.31.53.501.886.501h13.964c.367 0 .704-.19.877-.5a1.03 1.03 0 0 0 .01-1.002L8.893 1.5zm.133 11.497H6.987v-2.003h2.039v2.003zm0-3.004H6.987V5.987h2.039v4.006z"}))),"caution")),(0,i.kt)("div",{parentName:"div",className:"admonition-content"},(0,i.kt)("p",{parentName:"div"},"You need to ensure ",(0,i.kt)("inlineCode",{parentName:"p"},"polkadot.js")," libraries should have the same version to avoid duplication."))),(0,i.kt)("h3",{id:"install-polkadotapi"},"Install ",(0,i.kt)("inlineCode",{parentName:"h3"},"@polkadot/api")),(0,i.kt)("p",null,"You can install ",(0,i.kt)("inlineCode",{parentName:"p"},"@polkadot/api")," through npm."),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre"},"npm install @polkadot/api@^8.9.1\n")),(0,i.kt)("p",null,"or yarn"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre"},"yarn add @polkadot/api@^8.9.1\n")),(0,i.kt)("div",{className:"admonition admonition-caution alert alert--warning"},(0,i.kt)("div",{parentName:"div",className:"admonition-heading"},(0,i.kt)("h5",{parentName:"div"},(0,i.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,i.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"16",height:"16",viewBox:"0 0 16 16"},(0,i.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M8.893 1.5c-.183-.31-.52-.5-.887-.5s-.703.19-.886.5L.138 13.499a.98.98 0 0 0 0 1.001c.193.31.53.501.886.501h13.964c.367 0 .704-.19.877-.5a1.03 1.03 0 0 0 .01-1.002L8.893 1.5zm.133 11.497H6.987v-2.003h2.039v2.003zm0-3.004H6.987V5.987h2.039v4.006z"}))),"caution")),(0,i.kt)("div",{parentName:"div",className:"admonition-content"},(0,i.kt)("p",{parentName:"div"},"We require ",(0,i.kt)("inlineCode",{parentName:"p"},"@polkadot/api")," to be at least ",(0,i.kt)("inlineCode",{parentName:"p"},"v8.9.1"),". If you already installed older version, you can update the package or using new version package alongside the old version package."))),(0,i.kt)("h3",{id:"install-polkadotapi-contract"},"Install ",(0,i.kt)("inlineCode",{parentName:"h3"},"@polkadot/api-contract")),(0,i.kt)("p",null,"You can install ",(0,i.kt)("inlineCode",{parentName:"p"},"@polkadot/api-contract")," through npm."),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre"},"npm install @polkadot/api-contract@^8.9.1\n")),(0,i.kt)("p",null,"or yarn"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre"},"yarn add @polkadot/api-contract@^8.9.1\n")),(0,i.kt)("div",{className:"admonition admonition-caution alert alert--warning"},(0,i.kt)("div",{parentName:"div",className:"admonition-heading"},(0,i.kt)("h5",{parentName:"div"},(0,i.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,i.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"16",height:"16",viewBox:"0 0 16 16"},(0,i.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M8.893 1.5c-.183-.31-.52-.5-.887-.5s-.703.19-.886.5L.138 13.499a.98.98 0 0 0 0 1.001c.193.31.53.501.886.501h13.964c.367 0 .704-.19.877-.5a1.03 1.03 0 0 0 .01-1.002L8.893 1.5zm.133 11.497H6.987v-2.003h2.039v2.003zm0-3.004H6.987V5.987h2.039v4.006z"}))),"caution")),(0,i.kt)("div",{parentName:"div",className:"admonition-content"},(0,i.kt)("p",{parentName:"div"},"We require ",(0,i.kt)("inlineCode",{parentName:"p"},"@polkadot/api-contract")," to be at least ",(0,i.kt)("inlineCode",{parentName:"p"},"v8.9.1")," because it supports ",(0,i.kt)("strong",{parentName:"p"},"ink! ABI V3"),". Therefore, you should update the package in all circumstances."))),(0,i.kt)("h2",{id:"installation-1"},"Installation"),(0,i.kt)("p",null,"Now we can install the ",(0,i.kt)("inlineCode",{parentName:"p"},"BHO Swap SDK")," through npm"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre"},"npm install @bho-network/sdk-swap\n")),(0,i.kt)("p",null,"or yarn"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre"},"yarn add @bho-network/sdk-swap\n")))}c.isMDXComponent=!0}}]);