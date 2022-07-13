---
sidebar_position: 2
---

# SDK API Reference

## Read-only APIs

### getLiquidityPoolContract

```typescript
async getLiquidityPoolContract(
    tokenA: Address | "BHO",
    tokenB: Address | "BHO"
): Promise<Result<ContractPromise | null, GetLiquidityPoolContractError>>
```

Returns instance of `@polkadot/api-contract::ContractPromise` if specified liquidity pool exists, otherwise `null` is returned.

### getLiquidityPoolReserves

```typescript
async getLiquidityPoolReserves(
    tokenA: Address | "BHO",
    tokenB: Address | "BHO"
): Promise<Result<[BN, BN], GetLiquidityPoolReservesError>>
```

Get reserves of a liquidity pool determined by two tokens. Returns `[0,0]` if a liquidity pool not exists.

### getWBHO

```typescript
async getWBHO(): Promise<Result<ContractPromise, GetWBHOError>>
```

Returns `@polkadot/api-contract::ContractPromise` of `WBHO`.

### getAllowance

```typescript
async getAllowance(token: Address, user: Address): Promise<Result<BN, GetAllowanceError>>
```

Get token allowance of the SDK approved by user.

:::caution
This API maybe moved to different SDK package related to BHO Assets in later iteration.
:::

### getBalance

```typescript
async getBalance(token: Address | "BHO", user: Address): Promise<Result<BN, GetBalanceError>>
```

Get token balance of a user.

:::caution
This API maybe moved to different SDK package related to BHO Assets in later iteration.
:::

### getAmountIn

```typescript
getAmountIn(
    amountOut: AnyNumber,
    reserveIn: AnyNumber,
    reserveOut: AnyNumber,
    rateEstOptions: RateEstimateOptions = { slippage: 0 }
  ): Result<{ amountIn: BN; amountInMax: BN; fee: BN; priceImpact: [BN, BN] }, GetAmountInError>
```

Calculate amount of input token based on given trade information.

| **Parameter name**        | **Parameter type**       | **Description**                                                                                                                                                |
| ------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `amountOut`               | `string`, `number`, `BN` | Exact amount of output token users want to receive.                                                                                                            |
| `reserveIn`               | `string`, `number`, `BN` | Reserve of input token in liquidity pool.                                                                                                                      |
| `reserveOut`              | `string`, `number`, `BN` | Reserve of output token in liquidity pool.                                                                                                                     |
| `rateEstOptions.slippage` | `number`                 | Slippage (in basis points, `1 bp = 0.01%`) users willing to accept. Default to 0.                                                                              |
| `amountIn`                | `BN`                     | Exact amount of input token users must sell to receive `amountOut`.                                                                                            |
| `amountInMax`             | `BN`                     | Maximum amount of input token users willing to sell at worst due to slippage.                                                                                  |
| `fee`                     | `BN`                     | Fee of a trade in input token.                                                                                                                                 |
| `priceImpact`             | `[BN, BN]`               | Price impact of a trade represented in the form of `[numerator, denominator]`. You can calculate price impact percentage by `(numerator * 100) / denominator`. |

### getAmountOut

```typescript
getAmountOut(
    amountIn: AnyNumber,
    reserveIn: AnyNumber,
    reserveOut: AnyNumber,
    rateEstOptions: RateEstimateOptions = { slippage: 0 }
  ): Result<
    { amountOut: BN; amountOutMin: BN; fee: BN; priceImpact: [BN, BN] },
    GetAmountOutError
  >
```

Calculate amount of output token based on given trade information.

| **Parameter name**        | **Parameter type**       | **Description**                                                                                                                                                |
| ------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `amountIn`                | `string`, `number`, `BN` | Exact amount of input token users want to sell.                                                                                                                |
| `reserveIn`               | `string`, `number`, `BN` | Reserve of input token in liquidity pool.                                                                                                                      |
| `reserveOut`              | `string`, `number`, `BN` | Reserve of output token in liquidity pool.                                                                                                                     |
| `rateEstOptions.slippage` | `number`                 | Slippage (in basis points, `1 bp = 0.01%`) users willing to accept. Default to 0.                                                                              |
| `amountOut`               | `BN`                     | Exact amount of output token users will receive corresponding to `amountIn`.                                                                                   |
| `amountOutMin`            | `BN`                     | Minimum amount of output token users willing to receive at worst due to slippage.                                                                              |
| `fee`                     | `BN`                     | Fee of a trade in input token.                                                                                                                                 |
| `priceImpact`             | `[BN, BN]`               | Price impact of a trade represented in the form of `[numerator, denominator]`. You can calculate price impact percentage by `(numerator * 100) / denominator`. |

### getProtocolFee

```typescript
getProtocolFee(amountIn: AnyNumber): BN
```

Returns protocol fee of BHO Swap based on amount of input token.

### getTotalSupply

```typescript
async getTotalSupply(token: Address): Promise<Result<BN, GetTotalSupplyError>>
```

Returns total supply of PSP22 token

:::caution
This API maybe moved to different SDK package related to BHO Assets in later iteration.
:::

### getAddLiquidityInfo

```typescript
getAddLiquidityInfo(
    amountA: AnyNumber | null,
    amountB: AnyNumber | null,
    reserveA: AnyNumber,
    reserveB: AnyNumber,
    sharesTotalSupply: AnyNumber,
    rateEstOptions: RateEstimateOptions = { slippage: 0 }
  ): Result<
    {
      sharesAmountReceived: BN;
      sharesAmountBurned: BN;
      amountADesired: BN;
      amountBDesired: BN;
      amountAMin: BN;
      amountBMin: BN;
    },
    GetAddLiquidityInfoError
  >
```

It is useful for users to have "estimated" information given their intents to add liquidity. These information can be fed to [Add Liquidity API](#addliquidity) later.

| **Parameter name**        | **Parameter type**               | **Description**                                                                                                        |
| ------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `amountA`                 | `string`, `number`, `BN`, `null` | Amount of token A users want to provide liquidity. Use `null` if you want `amountADesired` is determined by `amountB`. |
| `amountB`                 | `string`, `number`, `BN`, `null` | Amount of token B users want to provide liquidity. Use `null` if you want `amountBDesired` is determined by `amountA`. |
| `reserveA`                | `string`, `number`, `BN`         | Reserve of token A in the pool. This is used to determine current mid price observed by users.                         |
| `reserveB`                | `string`, `number`, `BN`         | Reserve of token B in the pool. This is used to determine current mid price observed by users.                         |
| `sharesTotalSupply`       | `string`, `number`, `BN`         | Current total supply of corresponding LP-Token observed by users.                                                      |
| `rateEstOptions.slippage` | `number`                         | Slippage in basis points (bp).                                                                                         |
| `sharesAmountReceived`    | `BN`                             | Amount of LP-Token users should receive.                                                                               |
| `sharesAmountBurned`      | `BN`                             | Amount of LP-Tokens burned due to first liquidity provider.                                                            |
| `amountADesired`          | `BN`                             | Amount of token A users should provide liquidity with respect to the mid price observed by them.                       |
| `amountBDesired`          | `BN`                             | Amount of token B users should provide liquidity with respect to the mid price observed by them.                       |
| `amountAMin`              | `BN`                             | Amount of token A users can use to limit acceptable mid price range due to slippage.                                   |
| `amountBMin`              | `BN`                             | Amount of token B users can use to limit acceptable mid price range due to slippage.                                   |

:::caution
If both `amountA` and `amountB` are supplied, we choose one of them to determine the other as the rule described in [Add Liquidity API](#addliquidity).
:::

### getRemoveLiquidityInfo

```typescript
getRemoveLiquidityInfo(
    sharesAmount: AnyNumber,
    sharesTotalSupply: AnyNumber,
    reserveA: AnyNumber,
    reserveB: AnyNumber,
    rateEstOptions: RateEstimateOptions = { slippage: 0 }
  ): Result<
    { amountAReceived: BN; amountBReceived: BN; amountAMin: BN; amountBMin: BN },
    GetRemoveLiquidityInfoError
  >
```

It is useful for users to have "estimated" information given their intents to remove liquidity. These information can be fed to [Remove Liquidity API](#removeliquidity) later.

| **Parameter name**        | **Parameter type**       | **Description**                                                                                |
| ------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------- |
| `sharesAmount`            | `string`, `number`, `BN` | Amount of LP-Token users want to burn to remove corresponding liquidity from the pool.         |
| `sharesTotalSupply`       | `string`, `number`, `BN` | Current total supply of LP-Token observed by users.                                            |
| `reserveA`                | `string`, `number`, `BN` | Reserve of token A in the pool. This is used to determine current mid price observed by users. |
| `reserveB`                | `string`, `number`, `BN` | Reserve of token B in the pool. This is used to determine current mid price observed by users. |
| `rateEstOptions.slippage` | `number`                 | Slippage in basis points (bp).                                                                 |
| `amountARecevied`         | `BN`                     | Amount of token A users should receive according to the mid price they observe.                |
| `amountBDesired`          | `BN`                     | Amount of token B users should receive according to the mid price they observe.                |
| `amountAMin`              | `BN`                     | Amount of token A users willing to receive at worst due to slippage.                           |
| `amountBMin`              | `BN`                     | Amount of token B users willing to receive at worst due to slippage.                           |

## Mutatable APIs

### addLiquidity

```typescript
async addLiquidity(
    tokenA: Address | "BHO",
    tokenB: Address | "BHO",
    amountADesired: AnyNumber,
    amountBDesired: AnyNumber,
    amountAMin: AnyNumber = 0,
    amountBMin: AnyNumber = 0,
    to?: Address,
    deadline: AnyNumber = MAX_U64,
    options: SdkCallOptions = { resolveStatus: "isInBlock" }
): Promise<Result<undefined, errors.AddLiquidityError>>
```

Add liquidity to liquidity pool

When users add liquidity for a pool, they are allowed to specify the amount of token A and token B they desire to provide. They are specified under parameters `amountADesired` and `amountBDesired`. However, at execution time, the pool ratio `A/B or B/A` might be different.

Hence, the DEX will try to pick either `amountADesired` or `amountBDesired` to calculate the other token's amount
based on the `amountADesired/amountBDesired` ratio and `A/B` ratio.
To be specific:

- If `amountADesired/amountBDesired >= A/B`, we use `amountBDesired` to determine amount A.
- Otherwise, we use `amountADesired` to determine amount B.

For some users, they may want to specify the lower limit on the amount so that the executed mid price is in their acceptable range, otherwise, the transaction should revert. BHO Swap supports this through `amountAMin` and `amountBMin`.

| **Parameter name** | **Parameter type**       | **Description**                                                                                                                                    |
| ------------------ | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tokenA`           | `string`, `"BHO"`        | Token A address or `"BHO"`                                                                                                                         |
| `tokenB`           | `string`, `"BHO"`        | Token B address or `"BHO"`                                                                                                                         |
| `amountADesired`   | `string`, `number`, `BN` | Amount of token A users desire to add liquidity if `B/A price <= amountBDesired/amountADesired (A depreciates)`.                                   |
| `amountBDesired`   | `string`, `number`, `BN` | Amount of token B users desire to add liquidity if `A/B price <= amountADesired/amountBDesired (B depreciates)`.                                   |
| `amountAMin`       | `string`, `number`, `BN` | Bounds the extent to which the `B/A` price can go up before the transaction reverts. Must be `<= amountADesried`. For most users, defaults to `0`. |
| `amountBMin`       | `string`, `number`, `BN` | Bounds the extent to which `A/B` price can go up before the transaction reverts. Must be `<= amountBDesired`. For most users, defaults to `0`.     |
| `to`               | `string`                 | Address that will receive LP-Tokens. Defaults to connected signer.                                                                                 |
| `deadline`         | `BN`                     | Unix timestamp (in seconds) after which the transaction will revert. Maximum limit is `MAX_U64`. Defaults to `MAX_U64`.                            |
| `options`          | `SdkCallOptions`         | Check out [SDK Call Options](../getting-started/design#mutable-sdk-api)                                                                            |

### removeLiquidity

```typescript
async removeLiquidity(
    tokenA: Address | "BHO",
    tokenB: Address | "BHO",
    liquidity: AnyNumber,
    amountAMin: AnyNumber = 0,
    amountBMin: AnyNumber = 0,
    to?: Address,
    deadline: AnyNumber = MAX_U64,
    options: SdkCallOptions = { resolveStatus: "isInBlock" }
): Promise<Result<undefined, RemoveLiquidityError>>
```

| **Parameter name** | **Parameter type**       | **Description**                                                                                                                                |
| ------------------ | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `tokenA`           | `string`, `"BHO"`        | Token A address or `"BHO"`                                                                                                                     |
| `tokenB`           | `string`, `"BHO"`        | Token B address or `"BHO"`                                                                                                                     |
| `liquidity`        | `string`, `number`, `BN` | Amount of LP-Token users want to burn to withdraw corresponding tokens.                                                                        |
| `amountAMin`       | `string`, `number`, `BN` | Minimum amount of token A users willing to receive. Defaults to `0`, meaning that users willing to remove liquidity whatever the mid price is. |
| `amountBMin`       | `string`, `number`, `BN` | Minimum amount of token B users willing to receive. Defaults to `0`, meaning that users willing to remove liquidity whatever the mid price is. |
| `to`               | `string`                 | Address that will receive withdrawn tokens. Defaults to connected signer.                                                                      |
| `deadline`         | `BN`                     | Unix timestamp (in seconds) after which the transaction will revert. Maximum limit is `MAX_U64`. Defaults to `MAX_U64`.                        |
| `options`          | `SdkCallOptions`         | Check out [SDK Call Options](../getting-started/design#mutable-sdk-api)                                                                        |

### swapExactTokensForTokens

```typescript
async swapExactTokensForTokens(
    amountIn: AnyNumber,
    amountOutMin: AnyNumber,
    path: (Address | "BHO")[],
    to?: Address,
    deadline: AnyNumber = MAX_U64,
    sdkCallOptions: SdkCallOptions = { resolveStatus: "isInBlock" }
): Promise<Result<undefined, SwapTokensError>>
```

Swap exact `amountIn` of input token to receive at least `amountOutMin` of output token.

### swapTokensForExactTokens

```typescript
async swapTokensForExactTokens(
    amountOut: AnyNumber,
    amountInMax: AnyNumber,
    path: (Address | "BHO")[],
    to?: Address,
    deadline: AnyNumber = MAX_U64,
    sdkCallOptions: SdkCallOptions = { resolveStatus: "isInBlock" }
): Promise<Result<undefined, SwapTokensError>>
```

Buy exact `amountOut` of output token with at worst `amountInMax` of input token.

### approve

```typescript
async approve(
    token: Address,
    amount: AnyNumber,
    options: SdkCallOptions = { resolveStatus: "isInBlock" }
): Promise<Result<undefined, ApproveError>>
```

Approve SDK to spend token allowance on behalf of connected signer.

:::caution
This API maybe moved to different SDK package related to BHO Assets in later iteration.
:::
