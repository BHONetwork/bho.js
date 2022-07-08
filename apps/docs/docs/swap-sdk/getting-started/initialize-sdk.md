---
sidebar_position: 3
---

# Initialize SDK

First, we started by import the SDK class from `@bho-network/sdk-swap`

```typescript
import { SwapSDK, KeyringPair } from "@bho-network/sdk-swap";
```

To use the SDK, we must initialize it

```typescript
import { ApiPromise } from "@polkadot/api";

// It's your responsibility to initiate ApiPromise instance yourself.
let api: ApiPromise;

const routerContractAddress = "nvngUvEtEPGeFSXeuY8EYxNW4wDtFkLfxhnZbTosFwbC5zxjZ";
const factoryContractAddress = "nvmPvMT56YPEs9LsiSHqfYabQf6J2SULHxEBw6gbHCzGMf18c";

// You should have user's keypair in someway.
let userKeypair: KeyringPair;

const sdk = SwapSDK.initialize(api, routerContractAddress, factoryContractAddress, userKeypair);
```

`userKeypair` is optional when intialize the SDK, you don't have to provide it in the first place. This is useful since you may want to initialize the SDK first but don't have the keypair at the time. However, some sdk calls require this keypair to query data, sign and submit transactions to the blockchain. You can provide it later through `connect()`.

```typescript
// `connect()` returns a new sdk instance, and you should use this instance instead of the old one.
const newSdk = sdk.connect(userKeypair);
```

It's pretty much it, now you can use the sdk instance to interact with BHO Swap.
