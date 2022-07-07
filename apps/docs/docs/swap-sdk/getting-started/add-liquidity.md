---
sidebar_position: 4
---

# Add liquidity

SDK supports providing liquidity for a pair of PSP22 tokens. You need to provide token ss58 encoded address as well as the amount of liquidity that you intent to provide.

```typescript
const tokenA = "nvmrRQYzkBScPeWAkGm3HJfvg7XgwsSM2Y3cnz2AaHN2G11AW";
const tokenB = "nvnr4FtGBDwxs9gtKNRDxgtpXUYFgA5KUi5McBy3na4yMJXSU";

// Amount can be a string, BN, a number or even a hex string. In general, it will accept "like" values of Codec number.
const amountA = 10_000;
const amountB = "1000";

const result = await sdk.addLiquidity(tokenA, tokenB, amountA, amountB);

if (result.hasError()) {
  console.log(`Add liquidity failed: ${result.error.message} `);
}
```
