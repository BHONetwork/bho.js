---
sidebar_position: 1
---

# Glossary

In this section, we will go through some terminology related to BHO Swap which can help you understand better how BHO Swap works under the hood so you can use the SDK as you intend to.

### Liquidity pool

In Automated Market Maker (AMM) model, trading between two particular assets requires a liquidity pool and the exchange rate is determined automatically by the **constant product formula**. Users provide liquidity by supplying both assets into the pools. They are called **liquidity providers**. Liquidity amount of each asset maintained in liquidity pool is called **liquidity reserve**.

### Market price (market rate) {#market-price}

Market price is the actual rate between two assets when the exchange executes. We can calculate the market price given the trade size and liquidity pool status using **constant product formula**. We refer to the market price when the transaction is executed on the blockchain as **executed market price (executed price)** to distinguish with the market price calculated by clients, i.e, market price displayed in the UI,...

### Mid price (mid rate) {#mid-price}

Mid price is the rate between reserves of assets in the liquidity pool. Specifically, it is calculated by `midPrice = reserveB/reserveA or midPrice = reserveA/reserveB`. Mid price does not reflects the market price for a trade. However, it is used as a rate for users to provide liquidity to the pool. We refer to the mid price when the transaction is executed on the blockchain as **executed mid price** to distinguish with the mid price calculated by clients, i.e, mid price displayed in the UI,...
