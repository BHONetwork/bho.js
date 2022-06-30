import { ApiPromise } from "@polkadot/api";
import { Abi, ContractPromise } from "@polkadot/api-contract";
import { decodeAddress } from "@polkadot/keyring";
import { u8aEq, logger } from "@polkadot/util";
import * as defekt from "defekt";
import BN from "bn.js";

import { AnyNumber, Result, Address, KeyringPair, errors, SdkCallOptions } from "./types";
import { MAX_U64 } from "./constants";
import { submitContractQuery, submitContractTx, validateTokensPair } from "./utils";
import {
  ApproveError,
  GetAllowanceError,
  GetLiquidityPoolContractError,
  GetLiquidityPoolReservesError,
  GetWBHOError,
  InvalidTokenPair,
  InvalidTradingPath,
  NoConnectedSigner,
  OnchainError,
  QueryContractError,
  RemoveLiquidityError,
  SwapTokensError,
} from "./errors";

import bhoSwapFactoryAbiJson from "../fixtures/abi/bho_swap_factory_contract.json";
import bhoSwapRouterAbiJson from "../fixtures/abi/bho_swap_router_contract.json";
import psp22AbiJson from "../fixtures/abi/psp22_token_contract.json";
import bhoSwapPairAbiJson from "../fixtures/abi/bho_swap_pair_contract.json";
import wbhoAbiJson from "../fixtures/abi/wbho_contract.json";

/**
 * Swap SDK is created to facilitate the integration with BHO Swap contracts.
 */
export class SwapSdk {
  private _routerContract: ContractPromise;
  private _factoryContract: ContractPromise;
  private _routerAbi: Abi;
  private _factoryAbi: Abi;

  private constructor(
    private _api: ApiPromise,
    private _routerAddr: Address,
    private _factoryAddr: Address,
    private _signer: KeyringPair | null | undefined
  ) {
    this._routerAbi = new Abi(bhoSwapRouterAbiJson);
    this._factoryAbi = new Abi(bhoSwapFactoryAbiJson);
    this._routerContract = new ContractPromise(this._api, this._routerAbi, this._routerAddr);
    this._factoryContract = new ContractPromise(this._api, this._factoryAbi, this._factoryAddr);
  }

  /**
   * Initialize the SDK instance
   * @param api - Polkadot `ApiPromise` instance. Consumers should initialize this api instance beforehand.
   * @param routerAddr - BHO Swap Router contract address.
   * @param factoryAddr - BHO Swap Factory contract address.
   * @param signer - Initial signer for contract execution. It is the user's keypair.
   * @returns Returns initialized `{@link SwapSdk | Swap SDK instance}
   */
  static initialize(
    api: ApiPromise,
    routerAddr: Address,
    factoryAddr: Address,
    signer: KeyringPair | null | undefined
  ): SwapSdk {
    return new SwapSdk(api, routerAddr, factoryAddr, signer);
  }

  /**
   * Connect new signer to the SDK.
   * @param signer - New signer for contract execution.
   * @returns Create new SDK instance with given signer.
   */
  connect(signer: KeyringPair): SwapSdk {
    return SwapSdk.initialize(this._api, this._routerAddr, this._factoryAddr, signer);
  }

  /**
   * Add liquidity to liquidity pool of a token pair.
   *
   * @remarks When users add liquidity for a pool, they are allowed to specify the maximum amount of token A and token B they desire to provide.
   * They are specified under parameters `amountADesired` and `amountBDesired`. However, at execution time, the pool ratio `A/B or B/A` might be different.
   * Hence, the DEX will try to pick either `amountADesired` or `amountBDesired` to calculate the other token's amount
   * based on the `amountADesired/amountBDesired` ratio and `A/B` ratio.
   * To be specific:
   *  - If `amountADesired/amountBDesired >= A/B`, we use `amountBDesired` to determine amount A.
   *  - Otherwise, we use `amountADesired` to determine amount B.
   *
   * At execution time, one token's deposited amount will be determined by the other token's deposited amount based on the pool ratio.
   * For some users, they may want to specify the lower limit on the derived amount so that the executed price is in their acceptable range,
   * otherwise, the transaction should revert.
   *
   * Before calling this function, users should approve allowance for router contract if they haven't.
   * This can be done by calling `SwapSdk::approve()`.
   *
   * @param tokenA - Token A contract address or "BHO".
   * @param tokenB - Token B contract address or "BHO".
   * @param amountADesired - Maximum amount of token A to add as liquidity as users desire.
   * @param amountBDesired - Maximum amount of token B to add as liquidity as users desire.
   * @param amountAMin - Minimum amount of token A corresponding to the pool ratio, users willing to provide liquidity.
   * Must be `<= amountADesired`. Should be set to `0` for most users.
   * @param amountBMin - Minimum amount of token B corresponding to the pool ratio, users willing to provide liquidity.
   * Must be `<= amountBDesired`. Should be set to `0` for most users.
   * @param to - The recipient of minted LP (Liquidity Pool) token. Default to current signer.
   * @param deadline - Deadline (timestamp in second) to execute transaction before it is rejected. Default to `u64::MAX`.
   */
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
  ): Promise<Result<undefined, errors.AddLiquidityError>> {
    if (tokenA === "BHO" && tokenB === "BHO") {
      return defekt.error(new errors.InvalidTokenPair());
    }

    if (tokenA === "BHO" || tokenB === "BHO") {
      if (tokenA === "BHO") {
        return this._addLiquidityBHO(
          tokenB,
          amountBDesired,
          amountADesired,
          amountBMin,
          amountAMin,
          to,
          deadline,
          options
        );
      } else {
        return this._addLiquidityBHO(
          tokenA,
          amountADesired,
          amountBDesired,
          amountAMin,
          amountBMin,
          to,
          deadline,
          options
        );
      }
    } else {
      return this._addLiquidity(
        tokenA,
        tokenB,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        to,
        deadline,
        options
      );
    }
  }

  private async _addLiquidity(
    tokenA: Address,
    tokenB: Address,
    amountADesired: AnyNumber,
    amountBDesired: AnyNumber,
    amountAMin: AnyNumber = 0,
    amountBMin: AnyNumber = 0,
    to?: Address,
    deadline: AnyNumber = MAX_U64,
    options: SdkCallOptions = { resolveStatus: "isInBlock" }
  ): Promise<Result<undefined, errors.AddLiquidityError>> {
    const l = logger("@bho-network/sdk-swap/_addLiquidity");
    return new Promise(async (resolve, reject) => {
      if (this._signer == null) {
        l.error("No connected signer");
        return resolve(defekt.error(new errors.NoConnectedSigner()));
      }

      if (u8aEq(decodeAddress(tokenA), decodeAddress(tokenB))) {
        l.error("Invalid token pair");
        return resolve(defekt.error(new errors.InvalidTokenPair()));
      }

      return resolve(
        submitContractTx(
          this._api,
          this._routerContract,
          this._signer,
          { value: 0, gasLimit: -1 },
          "bhoSwapRouter::addLiquidity",
          [
            tokenA,
            tokenB,
            amountADesired,
            amountBDesired,
            amountAMin,
            amountBMin,
            to ?? this._signer.address,
            deadline,
          ],
          options,
          l
        )
      );
    });
  }

  private async _addLiquidityBHO(
    token: Address,
    amountTokenDesired: AnyNumber,
    amountBHODesired: AnyNumber,
    amountTokenMin: AnyNumber = 0,
    amountBHOMin: AnyNumber = 0,
    to?: Address,
    deadline: AnyNumber = MAX_U64,
    options: SdkCallOptions = { resolveStatus: "isInBlock" }
  ): Promise<Result<undefined, errors.AddLiquidityError>> {
    const l = logger("@bho-network/sdk-swap/_addLiquidityBHO");
    return new Promise(async (resolve, reject) => {
      if (this._signer == null) {
        l.error("No connected signer");
        return resolve(defekt.error(new errors.NoConnectedSigner()));
      }

      return resolve(
        submitContractTx(
          this._api,
          this._routerContract,
          this._signer,
          { value: amountBHODesired.toString(), gasLimit: -1 },
          "bhoSwapRouter::addLiquidityBho",
          [
            token,
            amountTokenDesired,
            amountTokenMin,
            amountBHOMin,
            to ?? this._signer.address,
            deadline,
          ],
          options,
          l
        )
      );
    });
  }

  /**
   * This SDK call allows users to remove their liquidity for specific pool.
   *
   * @remarks Before calling this function, users should approve allowance for router contract if they haven't.
   * This can be done by calling `SwapSdk::approve()` with liquidity pool contract fetched from `SwapSdk::getLiquidityPoolContract()`.
   *
   * @param tokenA - Token A contract address or "BHO".
   * @param tokenB  - Token B contract address or "BHO".
   * @param liquidity - Amount of LP shares used for withdraw two tokens.
   * @param amountAMin - Minimum withdrawn amount of token A users willing to receive.
   * @param amountBMin - Minimum withdrawn amount of token B users willing to receive.
   * @param to - The recipient of withdrawn tokens. Default to current signer.
   * @param deadline - Deadline (timestamp in second) to execute transaction before it is rejected. Default to `u64::MAX`.
   */
  async removeLiquidity(
    tokenA: Address | "BHO",
    tokenB: Address | "BHO",
    liquidity: AnyNumber,
    amountAMin: AnyNumber = 0,
    amountBMin: AnyNumber = 0,
    to?: Address,
    deadline: AnyNumber = MAX_U64,
    options: SdkCallOptions = { resolveStatus: "isInBlock" }
  ): Promise<Result<undefined, RemoveLiquidityError>> {
    const l = logger("@bho-network/sdk-swap/removeLiquidity");
    if (this._signer == null) {
      l.error("No connected signer");
      return defekt.error(new NoConnectedSigner());
    }
    if (tokenA === "BHO" && tokenB === "BHO") {
      l.error("Invalid token pair");
      return defekt.error(new InvalidTokenPair());
    }
    if (
      tokenA !== "BHO" &&
      tokenB !== "BHO" &&
      u8aEq(decodeAddress(tokenA), decodeAddress(tokenB))
    ) {
      l.error("Invalid token pair");
      return defekt.error(new InvalidTokenPair());
    }

    if (tokenA === "BHO" || tokenB === "BHO") {
      let token = tokenA === "BHO" ? tokenB : tokenA;
      let amountTokenMin = tokenA === "BHO" ? amountBMin : amountAMin;
      let amountBHOMin = tokenA === "BHO" ? amountAMin : amountBMin;

      return submitContractTx(
        this._api,
        this._routerContract,
        this._signer,
        {
          value: 0,
          gasLimit: -1,
        },
        "bhoSwapRouter::removeLiquidityBho",
        [token, liquidity, amountTokenMin, amountBHOMin, to ?? this._signer.address, deadline],
        options,
        l
      );
    } else {
      return submitContractTx(
        this._api,
        this._routerContract,
        this._signer,
        {
          value: 0,
          gasLimit: -1,
        },
        "bhoSwapRouter::removeLiquidity",
        [tokenA, tokenB, liquidity, amountAMin, amountBMin, to ?? this._signer.address, deadline],
        options,
        l
      );
    }
  }

  /**
   * Swap exact amount of input token to receive output token with the amount calculated at execution time.
   * The output token amount can have lower limit specified by `amountOutMin`. This allows users to state
   * the worst executed rate they willing to accept.
   *
   * Currently, we only support trading route with 2 tokens.
   *
   * @param amountIn - Exact amount of input token.
   * @param amountOutMin - Minimum amount of output token users willing to receive.
   * @param path - The trading route. Each element is a token address or "BHO".
   * @param to - Recipient of swap output token.
   * @param deadline - Deadline (timestamp in second) to execute a transaction before it is reverted.
   */
  async swapExactTokensForTokens(
    amountIn: AnyNumber,
    amountOutMin: AnyNumber,
    path: (Address | "BHO")[],
    to?: Address,
    deadline: AnyNumber = MAX_U64,
    sdkCallOptions: SdkCallOptions = { resolveStatus: "isInBlock" }
  ): Promise<Result<undefined, SwapTokensError>> {
    const l = logger("@bho-network/sdk-swap/swap_exact_tokens_for_tokens");

    if (this._signer == null) {
      l.error("No connected signer");
      return defekt.error(new NoConnectedSigner());
    }
    if (path.length !== 2) {
      l.error("Only support swapping between 2 tokens");
      return defekt.error(new InvalidTradingPath());
    }

    if (path[0] === "BHO") {
      const wbhoContract = (await this.getWBHO()).unwrapOrThrow((err) => {
        const errStr = `WBHO contract not found, ${err.message}`;
        l.error(errStr);
        return new Error(errStr);
      });

      return submitContractTx(
        this._api,
        this._routerContract,
        this._signer,
        { value: amountIn, gasLimit: -1 },
        "bhoSwapRouter::swapExactBhoForTokens",
        [
          amountOutMin,
          [wbhoContract.address, ...path.slice(1)],
          to ?? this._signer.address,
          deadline,
        ],
        sdkCallOptions,
        l
      );
    }

    if (path[path.length - 1] === "BHO") {
      const wbhoContract = (await this.getWBHO()).unwrapOrThrow((err) => {
        const errStr = `WBHO contract not found, ${err.message}`;
        l.error(errStr);
        return new Error(errStr);
      });

      return submitContractTx(
        this._api,
        this._routerContract,
        this._signer,
        { value: 0, gasLimit: -1 },
        "bhoSwapRouter::swapExactTokensForBho",
        [
          amountIn,
          amountOutMin,
          [...path.slice(0, path.length - 1), wbhoContract.address],
          to ?? this._signer.address,
          deadline,
        ],
        sdkCallOptions,
        l
      );
    }

    return submitContractTx(
      this._api,
      this._routerContract,
      this._signer,
      { value: 0, gasLimit: -1 },
      "bhoSwapRouter::swapExactTokensForTokens",
      [amountIn, amountOutMin, [...path], to ?? this._signer.address, deadline],
      sdkCallOptions,
      l
    );
  }

  /**
   * Swap amount of input token that calculated at execution time to receive exact amount of output token.
   * The maximum amount of input token can be specified by `amountInMax`. This allows users to specify the maximum amount
   * that users willing to pay when the transaction is executed.
   *
   * Currently, we only support trading route with 2 tokens.
   * @param amountOut - Exact amount of output token users want to receive.
   * @param amountInMax - Maxmium amount of input token users willing to pay.
   * @param path - Trading route.
   * @param to - Recipient of output token.
   * @param deadline - Deadline (timestamp in second) to execute the transaction before it is reverted.
   * @returns
   */
  async swapTokensForExactTokens(
    amountOut: AnyNumber,
    amountInMax: AnyNumber,
    path: (Address | "BHO")[],
    to?: Address,
    deadline: AnyNumber = MAX_U64,
    sdkCallOptions: SdkCallOptions = { resolveStatus: "isInBlock" }
  ): Promise<Result<undefined, SwapTokensError>> {
    const l = logger("@bho-network/sdk-swap/swap_tokens_for_exact_tokens");
    if (this._signer == null) {
      l.error("No connected signer");
      return defekt.error(new NoConnectedSigner());
    }
    if (path.length !== 2) {
      l.error("Only support swapping between 2 tokens");
      return defekt.error(new InvalidTradingPath());
    }

    if (path[0] === "BHO") {
      const wbhoContract = (await this.getWBHO()).unwrapOrThrow((err) => {
        const errStr = `WBHO contract not found, ${err.message}`;
        l.error(errStr);
        return new Error(errStr);
      });

      return submitContractTx(
        this._api,
        this._routerContract,
        this._signer,
        { value: amountInMax, gasLimit: -1 },
        "bhoSwapRouter::swapBhoForExactTokens",
        [amountOut, [wbhoContract.address, ...path.slice(1)], to ?? this._signer.address, deadline],
        sdkCallOptions,
        l
      );
    }
    if (path[path.length - 1] === "BHO") {
      const wbhoContract = (await this.getWBHO()).unwrapOrThrow((err) => {
        const errStr = `WBHO contract not found, ${err.message}`;
        l.error(errStr);
        return new Error(errStr);
      });

      return submitContractTx(
        this._api,
        this._routerContract,
        this._signer,
        { value: 0, gasLimit: -1 },
        "bhoSwapRouter::swapTokensForExactBho",
        [
          amountOut,
          amountInMax,
          [...path.slice(0, path.length - 1), wbhoContract.address],
          to ?? this._signer.address,
          deadline,
        ],
        sdkCallOptions,
        l
      );
    }

    return submitContractTx(
      this._api,
      this._routerContract,
      this._signer,
      { value: 0, gasLimit: -1 },
      "bhoSwapRouter::swapTokensForExactTokens",
      [amountOut, amountInMax, [...path], to ?? this._signer.address, deadline],
      sdkCallOptions,
      l
    );
  }

  /**
   * Get liquidity pool reserves of a token pair.
   *
   * @param tokenA - token A address or "BHO".
   * @param tokenB - token B address or "BHO".
   * @param subscriber - a function to subscribe to reserves changes. Subscription only takes effect if the liquidity pool is valid.
   * @returns Returns a tuple of `(reserveA, reserveB)` if the liquidity pool is valid, otherwise `null`.
   */
  async getLiquidityPoolReserves(
    tokenA: Address | "BHO",
    tokenB: Address | "BHO"
  ): Promise<Result<[BN, BN], GetLiquidityPoolReservesError>> {
    const l = logger("@bho-network/sdk-swap/getLiquidityPoolReserves");
    if (!validateTokensPair(tokenA, tokenB)) {
      l.error("Invalid token pair");
      return defekt.error(new InvalidTokenPair());
    }

    let poolContractResult = await this.getLiquidityPoolContract(tokenA, tokenB);
    if (poolContractResult.hasError()) return defekt.error(poolContractResult.error);
    const poolContract = poolContractResult.value;

    const reservesQueryResult = await submitContractQuery(
      this._api,
      poolContract,
      this._routerContract.address.toString(),
      { value: 0, gasLimit: -1 },
      "bhoSwapPair::getReserves",
      []
    );
    if (reservesQueryResult.hasError()) {
      l.error(reservesQueryResult.error.message);
      return defekt.error(reservesQueryResult.error);
    }

    const token0QueryResult = await submitContractQuery(
      this._api,
      poolContract,
      this._routerContract.address.toString(),
      { value: 0, gasLimit: -1 },
      "bhoSwapPair::token0",
      []
    );
    if (token0QueryResult.hasError()) {
      l.error(token0QueryResult.error.message);
      return defekt.error(token0QueryResult.error);
    }

    let _tokenA = tokenA;
    if (_tokenA === "BHO") {
      const wbhoQueryResult = await this.getWBHO();
      if (wbhoQueryResult.hasError()) {
        l.error(wbhoQueryResult.error.message);
        return defekt.error(wbhoQueryResult.error);
      }
      _tokenA = wbhoQueryResult.value.address.toString();
    }

    const reservesOutput = reservesQueryResult.value;
    const token0Output = token0QueryResult.value;
    if (reservesOutput && token0Output) {
      if (Array.isArray(reservesOutput)) {
        if (u8aEq(decodeAddress(token0Output.toString()), decodeAddress(_tokenA))) {
          return defekt.value([
            new BN(reservesOutput[0].toString()),
            new BN(reservesOutput[1].toString()),
          ]);
        } else {
          return defekt.value([
            new BN(reservesOutput[1].toString()),
            new BN(reservesOutput[0].toString()),
          ]);
        }
      }
    }

    throw new Error("Liquidity pool reserves not found");
  }

  /**
   * Get token allowance of router contract
   * @param token - PSP22 token address
   * @param user - User address
   */
  async getAllowance(token: Address, user: Address): Promise<Result<BN, GetAllowanceError>> {
    const l = logger("@bho-network/sdk-swap/getAllowance");

    const tokenContract = new ContractPromise(this._api, psp22AbiJson, token);

    const queryResult = await submitContractQuery(
      this._api,
      tokenContract,
      user,
      { value: 0, gasLimit: -1 },
      "psp22::allowance",
      [user, this._routerContract.address]
    );

    if (queryResult.hasError()) {
      return defekt.error(queryResult.error);
    }

    const { value: output } = queryResult;

    if (output) {
      l.log(`allowance: ${output?.toString()}`);
      return defekt.value(new BN(output?.toString() || 0));
    }

    throw new Error("Allowance not found");
  }

  /**
   * Users need to perform allowance approval for router contract before using BHO Swap features
   * @param token - PSP22 token to approve
   * @param amount - Allowance
   * @param options - `SdkCallOptions`
   * @returns
   */
  async approve(
    token: Address,
    amount: AnyNumber,
    options: SdkCallOptions = { resolveStatus: "isInBlock" }
  ): Promise<Result<undefined, ApproveError>> {
    return new Promise(async (resolve, reject) => {
      const l = logger("@bho-network/sdk-swap/approve");

      if (this._signer == null) {
        l.error("No connected signer");
        return resolve(defekt.error(new NoConnectedSigner()));
      }

      const tokenContract = new ContractPromise(this._api, psp22AbiJson, token);

      return resolve(
        submitContractTx(
          this._api,
          tokenContract,
          this._signer,
          { value: 0, gasLimit: -1 },
          "psp22::approve",
          [this._routerContract.address, amount],
          options,
          l
        )
      );
    });
  }

  /**
   * Get LP share contract of a token pair.
   *
   * @param tokenA - token A address or "BHO".
   * @param tokenB - token B address or "BHO".
   */
  async getLiquidityPoolContract(
    tokenA: Address | "BHO",
    tokenB: Address | "BHO"
  ): Promise<Result<ContractPromise, GetLiquidityPoolContractError>> {
    const l = logger("@bho-network/sdk-swap/getLiquidityPoolContract");

    if (!validateTokensPair(tokenA, tokenB)) {
      return defekt.error(new errors.InvalidTokenPair());
    }

    let token0Addr: string = tokenA;
    let token1Addr: string = tokenB;

    if (tokenA === "BHO" || tokenB === "BHO") {
      const wbhoContract = (await this.getWBHO()).unwrapOrThrow((err) => {
        const errStr = `WBHO contract not found, ${err.message}`;
        l.error(errStr);
        return new Error(errStr);
      });

      token0Addr = wbhoContract.address.toString();
      if (tokenA === "BHO") {
        token1Addr = tokenB;
      } else {
        token1Addr = tokenA;
      }
    }

    const queryResult = await submitContractQuery(
      this._api,
      this._factoryContract,
      this._factoryContract.address.toString(),
      { value: 0, gasLimit: -1 },
      "bhoSwapFactory::pairByToken",
      [token0Addr, token1Addr]
    );

    if (queryResult.hasError()) {
      l.error(queryResult.error.message);
      return defekt.error(queryResult.error);
    }

    const { value: output } = queryResult;
    if (output) {
      l.log(`Liquidity Pool address: ${queryResult.value?.toString()}`);
      return defekt.value(new ContractPromise(this._api, bhoSwapPairAbiJson, output.toString()));
    }

    throw new Error("Liquidity Pool contract not found");
  }

  /**
   * Get WBHO contract
   */
  async getWBHO(): Promise<Result<ContractPromise, GetWBHOError>> {
    const l = logger("@bho-network/sdk-swap/get_WBHO");

    const queryResult = await submitContractQuery(
      this._api,
      this._routerContract,
      this._routerContract.address.toString(),
      { value: 0, gasLimit: -1 },
      "bhoSwapRouter::wbho",
      []
    );

    if (queryResult.hasError()) {
      return defekt.error(queryResult.error);
    }

    let wbhoAddr = queryResult.value?.toString();
    if (wbhoAddr) {
      l.log(`WBHO address: ${wbhoAddr}`);
      return defekt.value(new ContractPromise(this._api, wbhoAbiJson, wbhoAddr));
    }

    throw new Error("WBHO contract not found");
  }
}
