---
sidebar_position: 4
---

# Add liquidity

## Determine desired amount

Before providing liquidity, it is important to know what is the current [mid price](../reference/glossary#mid-price) of the liquidity pool so that you can determine the desired amount of two tokens to provide liquidity. First, we need to get current liquidity pool reserves.

```typescript
// For PSP22 Pair
const [reserveA, reserveB] = await sdk.getLiquidityPoolReserves(tokenA, tokenB).unwrapOrThrow();
const amountADesired = new BN(1_000);
const amountBDesired = amountADesired.mul(reserveA).div(reserveB);

// For BHO-PSP22 Pair
const [reserveBHO, reserveB] = await sdk.getLiquidityPoolReserves("BHO", tokenB).unwrapOrThrow();
```

## Provide liquidity

SDK supports providing liquidity for a pair of PSP22 tokens. But first, you need to ensure that the SDK (router contract) has permission to spend your tokens on your behalf to the liquidity pool.

SDK supplies the API to query the allowance in case you want to check if users already approved the SDK,

```typescript
const tokenAddr = "nvmrRQYzkBScPeWAkGm3HJfvg7XgwsSM2Y3cnz2AaHN2G11AW";
const usrAddr = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

const allowance = (await sdk.getAllowance(tokenAddr, usrAddr)).unwrapOrThrow();
```

Users can approve the SDK by,

```typescript
import { MAX_U128 } from "@bho-network/sdk-swap";

const tokenAddr = "nvmrRQYzkBScPeWAkGm3HJfvg7XgwsSM2Y3cnz2AaHN2G11AW";

// You can approve any amount here.
(await sdk.approve(token, MAX_U128)).unwrapOrThrow();
```

:::caution
It's up to you to supply any allowance. If you approve just a small amount enough for several transactions, you may need to approve multiple times in the future and may cost more transaction fee in the long run. However, it is more secured than just one big approval in case the contract is compromised. Evaluate the trade-off and use with your own risk.
:::

To provide liquidity, you need to provide token ss58 encoded address as well as the desired amount of liquidity that you intent to provide.

```typescript
// Amount can be a string, BN, a number or even a hex string.
// In general, it will accept "like" values of Codec number.
const amountA = 10_000;
const amountB = "1000";

try {
  // `Result` is returned by most of SDK APIs. Please read Basics for more information.
  const result = await sdk.addLiquidity(tokenA, tokenB, amountA, amountB);

  // Check and log recoverable errors.
  if (result.hasError()) {
    console.log(`Add liquidity failed: ${result.error.message}`);
  }
} catch (ex: unknown) {
  // Check and log unexpected errors here
}
```

To provide liquidity between native BHO token and PSP22 tokens, you can use a special address `BHO`

```typescript
(await sdk.addLiquidity("BHO", tokenB, amountBHO, amountB)).unwrapOrThrow();
```

:::caution
Executed mid price (mid price when transaction is executed) maybe different from the desired mid price you calculated and supply to the SDK. Due to this, BHO Swap also allows users to specify the limit on the mid price that the users willing to accept, otherwise, the transaction is reverted. Checkout the SDK API Reference for this advanced use-case.
:::
