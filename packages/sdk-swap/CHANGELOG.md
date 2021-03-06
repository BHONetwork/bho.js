# @bho-network/sdk-swap

## 0.3.1

## 0.3.0

### Minor Changes

- 8ce2096: Try CI

## 0.2.0

### Minor Changes

- 1d26b90: All packages use the same version

## 0.1.0

### Minor Changes

- 9c6a104: Add `getRemoveLiquidityInfo`
- c40f41a: Add `getTotalSupply`
- 6d56c5e: Add `getAddLiquidityInfo` API

### Patch Changes

- 29903a4: Ensure shares minted for first liquidity provider must greater than MINIMUM_LIQUIDITY in `getAddLiquidityInfo`

## 0.0.4

### Patch Changes

- 94ecfb1: export constants

## 0.0.3

### Patch Changes

- 4eec24d: `getLiquidityPoolContract` will return `null` if the pool not existed yet.
- 4eec24d: `getLiquidityPoolReserves` will return (0,0) for not existed pool.

## 0.0.2

### Patch Changes

- 6109e00: Change `getWBHO` sdk call return type
- e532035: Add `swap_tokens_for_exact_tokens` sdk call
- 5b122a0: Initialize functions for sdk
- 7d5b6d8: Add `getAmountIn` sdk call
- a61202c: Add `remove_liquidity` sdk call
- b15b79b: Change `getAllowance` sdk call return type
- cf7772e: Add `getBalance` sdk call
- accbef3: Add `getLiquidityPoolReserves` sdk call
- 4ef8b1a: Change `getLiquidityPoolContract` sdk call return type
- 513015e: Add `add_liquidity` sdk call
- 656b586: feat(sdk-swap): add sdk initialization
- e532035: Add `swap_exact_tokens_for_tokens` sdk call
- 6ed3189: Add `getAmountOut` sdk call
