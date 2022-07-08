"use strict";(self.webpackChunk_bho_network_docs=self.webpackChunk_bho_network_docs||[]).push([[94],{876:(e,t,r)=>{r.d(t,{Zo:()=>p,kt:()=>h});var i=r(2784);function o(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function n(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);t&&(i=i.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,i)}return r}function a(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?n(Object(r),!0).forEach((function(t){o(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):n(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function s(e,t){if(null==e)return{};var r,i,o=function(e,t){if(null==e)return{};var r,i,o={},n=Object.keys(e);for(i=0;i<n.length;i++)r=n[i],t.indexOf(r)>=0||(o[r]=e[r]);return o}(e,t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);for(i=0;i<n.length;i++)r=n[i],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(o[r]=e[r])}return o}var l=i.createContext({}),c=function(e){var t=i.useContext(l),r=t;return e&&(r="function"==typeof e?e(t):a(a({},t),e)),r},p=function(e){var t=c(e.components);return i.createElement(l.Provider,{value:t},e.children)},d={inlineCode:"code",wrapper:function(e){var t=e.children;return i.createElement(i.Fragment,{},t)}},u=i.forwardRef((function(e,t){var r=e.components,o=e.mdxType,n=e.originalType,l=e.parentName,p=s(e,["components","mdxType","originalType","parentName"]),u=c(r),h=o,y=u["".concat(l,".").concat(h)]||u[h]||d[h]||n;return r?i.createElement(y,a(a({ref:t},p),{},{components:r})):i.createElement(y,a({ref:t},p))}));function h(e,t){var r=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var n=r.length,a=new Array(n);a[0]=u;var s={};for(var l in t)hasOwnProperty.call(t,l)&&(s[l]=t[l]);s.originalType=e,s.mdxType="string"==typeof e?e:o,a[1]=s;for(var c=2;c<n;c++)a[c]=r[c];return i.createElement.apply(null,a)}return i.createElement.apply(null,r)}u.displayName="MDXCreateElement"},518:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>l,contentTitle:()=>a,default:()=>d,frontMatter:()=>n,metadata:()=>s,toc:()=>c});var i=r(7896),o=(r(2784),r(876));const n={sidebar_position:1},a="Glossary",s={unversionedId:"swap-sdk/reference/glossary",id:"swap-sdk/reference/glossary",title:"Glossary",description:"In this section, we will go through some terminology related to BHO Swap which can help you understand better how BHO Swap works under the hood so you can use the SDK as you intend to.",source:"@site/docs/swap-sdk/reference/glossary.md",sourceDirName:"swap-sdk/reference",slug:"/swap-sdk/reference/glossary",permalink:"/bho.js/docs/swap-sdk/reference/glossary",draft:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/swap-sdk/reference/glossary.md",tags:[],version:"current",sidebarPosition:1,frontMatter:{sidebar_position:1},sidebar:"tutorialSidebar",previous:{title:"Swap",permalink:"/bho.js/docs/swap-sdk/getting-started/swap"}},l={},c=[{value:"Liquidity pool",id:"liquidity-pool",level:3},{value:"Market price (market rate)",id:"market-price",level:3},{value:"Mid price (mid rate)",id:"mid-price",level:3},{value:"Liquidity provider token (LP-Token)",id:"liquidity-provider-token-lp-token",level:3}],p={toc:c};function d(e){let{components:t,...r}=e;return(0,o.kt)("wrapper",(0,i.Z)({},p,r,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"glossary"},"Glossary"),(0,o.kt)("p",null,"In this section, we will go through some terminology related to BHO Swap which can help you understand better how BHO Swap works under the hood so you can use the SDK as you intend to."),(0,o.kt)("h3",{id:"liquidity-pool"},"Liquidity pool"),(0,o.kt)("p",null,"In Automated Market Maker (AMM) model, trading between two particular assets requires a liquidity pool and the exchange rate is determined automatically by the ",(0,o.kt)("strong",{parentName:"p"},"constant product formula"),". Users provide liquidity by supplying both assets into the pools. They are called ",(0,o.kt)("strong",{parentName:"p"},"liquidity providers"),". Liquidity amount of each asset maintained in liquidity pool is called ",(0,o.kt)("strong",{parentName:"p"},"liquidity reserve"),"."),(0,o.kt)("h3",{id:"market-price"},"Market price (market rate)"),(0,o.kt)("p",null,"Market price is the actual rate between two assets when the exchange executes. We can calculate the market price given the trade size and liquidity pool status using ",(0,o.kt)("strong",{parentName:"p"},"constant product formula"),". We refer to the market price when the transaction is executed on the blockchain as ",(0,o.kt)("strong",{parentName:"p"},"executed market price (executed price)")," to distinguish with the market price calculated by clients, i.e, market price displayed in the UI,..."),(0,o.kt)("h3",{id:"mid-price"},"Mid price (mid rate)"),(0,o.kt)("p",null,"Mid price is the rate between reserves of assets in the liquidity pool. Specifically, it is calculated by ",(0,o.kt)("inlineCode",{parentName:"p"},"midPrice = reserveB/reserveA or midPrice = reserveA/reserveB"),". Mid price does not reflects the market price for a trade. However, it is used as a rate for users to provide liquidity to the pool. We refer to the mid price when the transaction is executed on the blockchain as ",(0,o.kt)("strong",{parentName:"p"},"executed mid price")," to distinguish with the mid price calculated by clients, i.e, mid price displayed in the UI,..."),(0,o.kt)("h3",{id:"liquidity-provider-token-lp-token"},"Liquidity provider token (LP-Token)"),(0,o.kt)("p",null,"Liquidity providers are users providing liquidity to liquidity pool. LP-Token is a PSP22 token minted to user based on how much user supply to the pool. Each pool will have their own LP-Token. Think of LP-Token as pool shares proving how much user has contributed into the pool and later can be burnt by users to withdraw corresponding amount of assets. LP-Token holders also benefits from the swap fee of a trade, which is ",(0,o.kt)("inlineCode",{parentName:"p"},"0.25%")," in BHO Swap."))}d.isMDXComponent=!0}}]);