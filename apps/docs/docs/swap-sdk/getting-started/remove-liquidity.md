---
sidebar_position: 5
---

# Remove liquidity

In most cases, you need to approve the SDK to burn LP-Tokens on behalf of users before we can remove liquidity.

```typescript
import { MAX_U128 } from "@bho-network/sdk-swap";

// You can also use a special address "BHO".
const poolContract = (await sdk.getPoolContract(tokenAAddr, tokenBAddr)).unwrapOrThrow();

// You can query LP-Token allowance
const allowance = (
  await sdk.getAllowance(poolContract.address.toString(), userAddr)
).unwrapOrThrow();

// Approve the SDK
(await sdk.approve(poolContract.address.toString(), MAX_U128)).unwrapOrThrow();
```

Then, we can remove liquidity

```typescript
const lpTokenAmount = (
  await sdk.getBalance(poolContract.address.toString(), userAddr)
).unwrapOrThrow();

(await sdk.removeLiquidity(tokenAAddr, tokenBAddr, lpTokenAmount)).unwrapOrThrow();
```
