---
sidebar_position: 1
---

# Installation

## Pre-requisites

`BHO Swap SDK` requires some `polkadot.js` libraries to function. `BHO Swap SDK` declares these dependencies as `peerDependencies` instead of direct `dependencies` in `package.json`. This helps the SDK to use these dependencies already installed by developers to avoid duplication. However, if you haven't installed these dependencies yet, you can install them by using these commands.

:::caution
You need to ensure `polkadot.js` libraries should have the same version to avoid duplication.
:::

### Install `@polkadot/api`

You can install `@polkadot/api` through npm.

```
npm install @polkadot/api@^8.9.1
```

or yarn

```
yarn add @polkadot/api@^8.9.1
```

:::caution
We require `@polkadot/api` to be at least `v8.9.1`. If you already installed older version, you can update the package or using new version package alongside the old version package.
:::

### Install `@polkadot/api-contract`

You can install `@polkadot/api-contract` through npm.

```
npm install @polkadot/api-contract@^8.9.1
```

or yarn

```
yarn add @polkadot/api-contract@^8.9.1
```

:::caution
We require `@polkadot/api-contract` to be at least `v8.9.1` because it supports **ink! ABI V3**. Therefore, you should update the package in all circumstances.
:::

## Installation

Now we can install the `BHO Swap SDK` through npm

```
npm install @bho-network/sdk-swap
```

or yarn

```
yarn add @bho-network/sdk-swap
```
