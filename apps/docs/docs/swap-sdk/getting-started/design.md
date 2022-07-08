---
sidebar_position: 2
---

# Design

It is essential to grasp the basics and general rules of how SDK API is designed so that you can predict and use the SDK API easier.

## SDK API Return Type

As substrate-based blockchain developers, we use rust mainly in our daily tasks. One of the most important utilities when handle error with rust is `Result`.

`Result` is an enum with two variants: `Success` or `Failure` to present a result of an operation. The motivation for `Result` is that it allows us to seperate between **expected errors (recoverable errors)** and **unexpected errors (unrecoverable errors)**. Not only with rust applications, it's also considered the best practice to have in error handling in any application in any language.

We decide to bring `Result` into our Javascript SDKs because of its benefits. Luckily, there's already a Javascript library having the API similar what we have in rust. It is [defekt](https://github.com/thenativeweb/defekt#using-result). We re-export `Result` of `defekt` in our SDKs or you can import it directly from `defekt`.

Most of our SDK APIs return `Result`.

## SDK API Error Type

To make errors returned by our SDK APIs predictable, usable and unified, we decide to use `defekt` to define [custom errors types](https://github.com/thenativeweb/defekt#creating-custom-errors) for SDK APIs. Therefore, you should check out `defekt` to get to know the basics of `defekt` custom errors and utilities to work with them.

## Mutable SDK API

Mutable SDK API is SDK API attempting to change the state by submitting the transaction to the blockchain. Usually, these APIs are asynchronous and it's only resolved when the transaction is included in a block or it is finalized. By default, the SDK API is resolved when transaction is included in a block. However, you can change this behavior through `SdkCallOptions` parameter when using these APIs.

## Big number

Same as `polkadot.js` library. We use `BN` from `bn.js` to represent big unsigned integer. Therefore, most of our SDK APIs will work with `BN`.
