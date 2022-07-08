---
sidebar_position: 1
---

# Overview

BHO Swap is an Automated Market Maker (AMM) Decentralized Exchange (DEX). BHO Swap follows UniswapV2 protocol so that users coming from similar DEXs will have similar experience on BHO Swap.

BHO Swap SDK is the SDK to simplify developers workflow and helps them to interact with the BHO Swap seemlessly. This allows developers in BHO Network ecosystem to write and focus on their application features without worrying about how to interact with the underlying smart contracts.

Currently, BHO Swap SDK only supports Javascript. The decision is made due to:

- It is very likely that most developers will look for Javascript SDK first since it is the most popular language for web applications (both UIs and backend systems).
- We want to inherit from the work of **Polkadot Javascript Library** (i.e `@polkadot/api`, `@polkadot/api-contract`,...) since it is the most matured client library for Substrate-based blockchain.

## Supported environments

`BHO Swap SDK` is built using `tsc` with target module `module: commonjs`. Thus, it should work in both:

- Browser environment with the help of transpiling, bundling tool. i,e. Babel, Webpack, Rollup,...
- Node.js environment.

Throughout the documentation, we will use ES2015 (ES6) module `import` syntax since currently it is used by most modern web applications.

## Goal

The goal of this documentation is to:

- Provide a quick guide on how to use _**BHO Swap SDK**_ for common use-cases.
- Provide SDK reference for developers to leverage full capabilities of _**BHO Swap SDK**_ for any use-cases.

### Contributing

We're opened for feedbacks as well as new feature proposals. You can contribute by submitting new github issues in our [Github repository](https://github.com/BHONetwork/bho.js/issues).
