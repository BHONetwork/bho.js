"use strict";(self.webpackChunk_bho_network_docs=self.webpackChunk_bho_network_docs||[]).push([[158],{876:(e,t,n)=>{n.d(t,{Zo:()=>c,kt:()=>m});var a=n(2784);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function s(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function i(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},o=Object.keys(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var p=a.createContext({}),u=function(e){var t=a.useContext(p),n=t;return e&&(n="function"==typeof e?e(t):s(s({},t),e)),n},c=function(e){var t=u(e.components);return a.createElement(p.Provider,{value:t},e.children)},l={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},d=a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,o=e.originalType,p=e.parentName,c=i(e,["components","mdxType","originalType","parentName"]),d=u(n),m=r,k=d["".concat(p,".").concat(m)]||d[m]||l[m]||o;return n?a.createElement(k,s(s({ref:t},c),{},{components:n})):a.createElement(k,s({ref:t},c))}));function m(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var o=n.length,s=new Array(o);s[0]=d;var i={};for(var p in t)hasOwnProperty.call(t,p)&&(i[p]=t[p]);i.originalType=e,i.mdxType="string"==typeof e?e:r,s[1]=i;for(var u=2;u<o;u++)s[u]=n[u];return a.createElement.apply(null,s)}return a.createElement.apply(null,n)}d.displayName="MDXCreateElement"},5430:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>p,contentTitle:()=>s,default:()=>l,frontMatter:()=>o,metadata:()=>i,toc:()=>u});var a=n(7896),r=(n(2784),n(876));const o={sidebar_position:6},s="Swap",i={unversionedId:"swap-sdk/getting-started/swap",id:"swap-sdk/getting-started/swap",title:"Swap",description:"There are two cases that the SDK supports for swapping.",source:"@site/docs/swap-sdk/getting-started/swap.md",sourceDirName:"swap-sdk/getting-started",slug:"/swap-sdk/getting-started/swap",permalink:"bho.js/docs/swap-sdk/getting-started/swap",draft:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/swap-sdk/getting-started/swap.md",tags:[],version:"current",sidebarPosition:6,frontMatter:{sidebar_position:6},sidebar:"tutorialSidebar",previous:{title:"Remove liquidity",permalink:"bho.js/docs/swap-sdk/getting-started/remove-liquidity"},next:{title:"Glossary",permalink:"bho.js/docs/swap-sdk/reference/glossary"}},p={},u=[{value:"Swap exact tokens for tokens",id:"swap-exact-tokens-for-tokens",level:2},{value:"Swap tokens for exact tokens",id:"swap-tokens-for-exact-tokens",level:2}],c={toc:u};function l(e){let{components:t,...n}=e;return(0,r.kt)("wrapper",(0,a.Z)({},c,n,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("h1",{id:"swap"},"Swap"),(0,r.kt)("p",null,"There are two cases that the SDK supports for swapping."),(0,r.kt)("div",{className:"admonition admonition-caution alert alert--warning"},(0,r.kt)("div",{parentName:"div",className:"admonition-heading"},(0,r.kt)("h5",{parentName:"div"},(0,r.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,r.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"16",height:"16",viewBox:"0 0 16 16"},(0,r.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M8.893 1.5c-.183-.31-.52-.5-.887-.5s-.703.19-.886.5L.138 13.499a.98.98 0 0 0 0 1.001c.193.31.53.501.886.501h13.964c.367 0 .704-.19.877-.5a1.03 1.03 0 0 0 .01-1.002L8.893 1.5zm.133 11.497H6.987v-2.003h2.039v2.003zm0-3.004H6.987V5.987h2.039v4.006z"}))),"caution")),(0,r.kt)("div",{parentName:"div",className:"admonition-content"},(0,r.kt)("p",{parentName:"div"},"Eventhough BHO Swap already supports trading route through multiple tokens (users need to specify their trading route), the SDK currently only supports for a trade between two tokens."))),(0,r.kt)("h2",{id:"swap-exact-tokens-for-tokens"},"Swap exact tokens for tokens"),(0,r.kt)("p",null,"This API is used for cases that users want to sell exact amount of input token to receive at least minimum amount of output token as the executed market price might be different from the market price you calculate in the client."),(0,r.kt)("p",null,"Hence, you first need to estimate the approriate minimum output amount. Luckily, SDK provides an utility to calculate exact and minimum output amount based on trade information and slippage."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-typescript"},"const [reserveIn, reserveOut] = (\n  await sdk.getLiquidityPoolReserves(tokenInAddr, tokenOutAddr)\n).unwrapOrThrow();\n\n// You can specify slippage also, it is measured in basis point (bp)\n// meaning that 10 bp = 0.1%.\nconst { amountOut, amountOutMin } = (\n  await sdk.getAmountOut(amountIn, reserveIn, reserveOut, { slippage: 10 })\n).unwrapOrThrow();\n")),(0,r.kt)("p",null,"Then you can swap"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-typescript"},"await sdk.swapExactTokensForTokens(amountIn, amountOutMin, [tokenInAddr, tokenOutAddr]);\n")),(0,r.kt)("h2",{id:"swap-tokens-for-exact-tokens"},"Swap tokens for exact tokens"),(0,r.kt)("p",null,"This API is used for cases that users want to buy exact amount of output tokens with willing to sell maximum amount of input token at worst."),(0,r.kt)("p",null,"First, you also need to estimate the appropriate maximum input amount."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-typescript"},"const [reserveIn, reserveOut] = (\n  await sdk.getLiquidityPoolReserves(tokenInAddr, tokenOutAddr)\n).unwrapOrThrow();\n\n// You can specify slippage also, it is measured in basis point (bp)\n// meaning that 10 bp = 0.1%.\nconst { amountIn, amountInMax } = (\n  await sdk.getAmountIn(amountOut, reserveIn, reserveOut, { slippage: 10 })\n).unwrapOrThrow();\n")),(0,r.kt)("p",null,"Then you can swap"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-typescript"},"await sdk.swapTokensForExactTokens(amountOut, amountInMax, [tokenInAddr, tokenOutAddr]);\n")),(0,r.kt)("div",{className:"admonition admonition-caution alert alert--warning"},(0,r.kt)("div",{parentName:"div",className:"admonition-heading"},(0,r.kt)("h5",{parentName:"div"},(0,r.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,r.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"16",height:"16",viewBox:"0 0 16 16"},(0,r.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M8.893 1.5c-.183-.31-.52-.5-.887-.5s-.703.19-.886.5L.138 13.499a.98.98 0 0 0 0 1.001c.193.31.53.501.886.501h13.964c.367 0 .704-.19.877-.5a1.03 1.03 0 0 0 .01-1.002L8.893 1.5zm.133 11.497H6.987v-2.003h2.039v2.003zm0-3.004H6.987V5.987h2.039v4.006z"}))),"caution")),(0,r.kt)("div",{parentName:"div",className:"admonition-content"},(0,r.kt)("p",{parentName:"div"},"Although these utilities helps you to calculate a market price for a trade based on given reserves of liquidity pool and trade size, it's up to you to provide those parameters. Hence, if a swap fails, you should playaround with those parameters to match your expectation."))))}l.isMDXComponent=!0}}]);