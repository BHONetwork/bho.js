---
sidebar_position: 6
---

# Swap

There are two cases that the SDK supports for swapping.

:::caution
Eventhough BHO Swap already supports trading route through multiple tokens (users need to specify their trading route), the SDK currently only supports for a trade between two tokens.
:::

## Swap exact tokens for tokens

This API is used for cases that users want to sell exact amount of input token to receive at least minimum amount of output token as the executed market price might be different from the market price you calculate in the client.

Hence, you first need to estimate the approriate minimum output amount. Luckily, SDK provides an utility to calculate exact and minimum output amount based on trade information and slippage.

```typescript
const [reserveIn, reserveOut] = (
  await sdk.getLiquidityPoolReserves(tokenInAddr, tokenOutAddr)
).unwrapOrThrow();

// You can specify slippage also, it is measured in basis point (bp)
// meaning that 10 bp = 0.1%.
const { amountOut, amountOutMin } = (
  await sdk.getAmountOut(amountIn, reserveIn, reserveOut, { slippage: 10 })
).unwrapOrThrow();
```

Then you can swap

```typescript
await sdk.swapExactTokensForTokens(amountIn, amountOutMin, [tokenInAddr, tokenOutAddr]);
```

## Swap tokens for exact tokens

This API is used for cases that users want to buy exact amount of output tokens with willing to sell maximum amount of input token at worst.

First, you also need to estimate the appropriate maximum input amount.

```typescript
const [reserveIn, reserveOut] = (
  await sdk.getLiquidityPoolReserves(tokenInAddr, tokenOutAddr)
).unwrapOrThrow();

// You can specify slippage also, it is measured in basis point (bp)
// meaning that 10 bp = 0.1%.
const { amountIn, amountInMax } = (
  await sdk.getAmountIn(amountOut, reserveIn, reserveOut, { slippage: 10 })
).unwrapOrThrow();
```

Then you can swap

```typescript
await sdk.swapTokensForExactTokens(amountOut, amountInMax, [tokenInAddr, tokenOutAddr]);
```

:::caution
Although these utilities helps you to calculate a market price for a trade based on given reserves of liquidity pool and trade size, it's up to you to provide those parameters. Hence, if a swap fails, you should playaround with those parameters to match your expectation.
:::
