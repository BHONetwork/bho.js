import { ApiPromise } from "@polkadot/api";
import { Abi, ContractPromise } from "@polkadot/api-contract";
import { decodeAddress } from "@polkadot/keyring";
import { u8aEq, logger } from "@polkadot/util";
import * as defekt from "defekt";
import BN from "bn.js";
import "@polkadot/api-augment/substrate";

import {
  AnyNumber,
  Result,
  Address,
  KeyringPair,
  errors,
  SdkCallOptions,
  RateEstimateOptions,
} from "./types";
import { MAX_U64, MINIMUM_LIQUIDITY } from "./constants";
import {
  computePriceImpact,
  sqrt,
  submitContractQuery,
  submitContractTx,
  validateTokensPair,
} from "./utils";
import {
  ApproveError,
  GetAddLiquidityInfoError,
  GetAllowanceError,
  GetAmountInError,
  GetAmountOutError,
  GetBalanceError,
  GetLiquidityPoolContractError,
  GetLiquidityPoolReservesError,
  GetRemoveLiquidityInfoError,
  GetTotalSupplyError,
  GetWBHOError,
  InvalidTokenPair,
  InvalidTradingPath,
  InvariantError,
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
   * @returns Returns a tuple of `(reserveA, reserveB)` if the liquidity pool is valid.
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

    if (poolContract == null) {
      return defekt.value([new BN(0), new BN(0)]);
    }

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
  ): Promise<Result<ContractPromise | null, GetLiquidityPoolContractError>> {
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
      if (!Array.isArray(output)) {
        if (output.isEmpty) {
          l.log("Liquidity pool contract not found");
          return defekt.value(null as any);
        }
        l.log(`Liquidity Pool address: ${output.toString()}`);
        return defekt.value(
          new ContractPromise(this._api, bhoSwapPairAbiJson, output.toString()) as any
        );
      }
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

  /**
   * Get balance of a user by a token.
   *
   * @param token - Token address or "BHO".
   * @param user - User address.
   */
  async getBalance(token: Address | "BHO", user: Address): Promise<Result<BN, GetBalanceError>> {
    if (token === "BHO") {
      const info = await this._api.query.system.account(user);
      return defekt.value(new BN(info.data.free.toString()));
    }
    const psp22Contract = new ContractPromise(this._api, psp22AbiJson, token);
    const queryResult = await submitContractQuery(
      this._api,
      psp22Contract,
      user,
      { value: 0, gasLimit: -1 },
      "psp22::balanceOf",
      [user]
    );

    if (queryResult.hasError()) {
      return defekt.error(queryResult.error);
    }

    const { value: output } = queryResult;
    if (output) {
      return defekt.value(new BN(output.toString()));
    }

    throw new Error("Balance not found");
  }

  /**
   * Calculate amount of input token based on:
   * - Amount of output token.
   * - Reserve of input token.
   * - Reserve of output token.
   *
   * @remarks Because the executed rate could be different from what users specify,
   * this sdk call should only be used as an estimation only.
   *
   * @param amountOut - Amount of output tokens users want to receive.
   * @param reserveIn - Reserve of input token
   * @param reserveOut - Reserve of output token
   * @param rateEstOptions - Extra options (i.e slippage) to calculate final result.
   *
   * @returns Returns `(amountIn, amountInMax, fee, priceImpact)`.
   * - `amountIn` is the amount of input token users must sell to receive exact `amountOut`.
   * It is calculated based on the `constant product` formula with parameters `amountOut`, `reserveIn`, `reserveOut`.
   * - `amountInMax` is the maximum amount of input token users willing to sell to receive exact `amountOut`.
   * This is useful for users to specify their acceptable rate range when executed rate is different from users's specified rate.
   * It is calculated based on `amountIn` and slippage.
   * - `fee` is trading fee measured in input token.
   * - `priceImpact`is the price impact of this trade in the form of fraction `[numerator, denominator]`.
   */
  getAmountIn(
    amountOut: AnyNumber,
    reserveIn: AnyNumber,
    reserveOut: AnyNumber,
    rateEstOptions: RateEstimateOptions = { slippage: 0 }
  ): Result<{ amountIn: BN; amountInMax: BN; fee: BN; priceImpact: [BN, BN] }, GetAmountInError> {
    const _amountOut = new BN(amountOut.toString());
    const _reserveIn = new BN(reserveIn.toString());
    const _reserveOut = new BN(reserveOut.toString());

    if (_amountOut.lten(0)) {
      return defekt.error(new InvariantError({ message: "Insufficient output amount" }));
    }
    if (_reserveIn.lten(0) || _reserveOut.lten(0)) {
      return defekt.error(new InvariantError({ message: "Insufficient liquidity" }));
    }

    const numerator = _reserveIn.mul(_amountOut).muln(1000);
    const denominator = _reserveOut.sub(_amountOut).muln(997);
    const amountIn = numerator.div(denominator).addn(1);
    const amountInMax = amountIn.add(amountIn.muln(rateEstOptions.slippage).divn(10_000));
    const fee = this.getProtocolFee(amountIn);
    const priceImpact = computePriceImpact(_reserveIn, _reserveOut, amountIn, _amountOut);

    return defekt.value({ amountIn, amountInMax, fee, priceImpact });
  }

  /**
   * Calculate amount of output token based on:
   * - Amount of input token.
   * - Reserve of input token.
   * - Reserve of output token.
   *
   * @remarks Because the executed rate could be different from what users specify,
   * this sdk call should only be used as an estimation only.
   *
   * @param amountIn - Amount of input tokens users willing to sell.
   * @param reserveIn - Reserve of input token
   * @param reserveOut - Reserve of output token
   * @param rateEstOptions - Extra options (i.e slippage) to calculate final result.
   *
   * @returns Returns `(amountOut, amountOutMin, fee, priceImpact)`.
   * - `amountOut` is the exact amount of output token users will receive corresponding to `amountIn`.
   * It is calculated based on the `constant product` formula with parameters `amountIn`, `reserveIn`, `reserveOut`.
   * - `amountOutMin` is the minimum amount of output token users willing to receive.
   * This is useful for users to specify their acceptable rate range when executed rate is different from users's specified rate.
   * It is calculated based on `amountOut` and slippage.
   * - `fee` is trading fee measured in input token.
   * - `priceImpact`is the price impact of this trade in the form of fraction `[numerator, denominator]`.
   */
  getAmountOut(
    amountIn: AnyNumber,
    reserveIn: AnyNumber,
    reserveOut: AnyNumber,
    rateEstOptions: RateEstimateOptions = { slippage: 0 }
  ): Result<
    { amountOut: BN; amountOutMin: BN; fee: BN; priceImpact: [BN, BN] },
    GetAmountOutError
  > {
    const _amountIn = new BN(amountIn.toString());
    const _reserveIn = new BN(reserveIn.toString());
    const _reserveOut = new BN(reserveOut.toString());

    if (_amountIn.lten(0)) {
      return defekt.error(new InvariantError({ message: "Insufficient output amount" }));
    }
    if (_reserveIn.lten(0) || _reserveOut.lten(0)) {
      return defekt.error(new InvariantError({ message: "Insufficient liquidity" }));
    }

    const amountInWithFee = _amountIn.muln(997);
    const numerator = amountInWithFee.mul(_reserveOut);
    const denominator = _reserveIn.muln(1000).add(amountInWithFee);
    const amountOut = numerator.div(denominator);
    const amountOutMin = amountOut.sub(amountOut.muln(rateEstOptions.slippage).divn(10_000));
    const fee = this.getProtocolFee(_amountIn);
    const priceImpact = computePriceImpact(_reserveIn, _reserveOut, _amountIn, amountOut);

    return defekt.value({ amountOut, amountOutMin, fee, priceImpact });
  }

  getProtocolFee(amountIn: AnyNumber): BN {
    const _amountIn = new BN(amountIn.toString());
    return _amountIn.muln(30).divn(10_000);
  }

  /**
   * It is useful for users to have "estimated" information given their intents to add liquidity.
   * These information can be fed to `Add liquidity API`.
   *
   * @remarks If both `amountA` and `amountB` are specified, then:
   * 1. `amountA` is used if `reserveB/reserveA` is smaller than `amountB/amountA`.
   * 2. Otherwise, `amountB` is used.
   *
   * @param amountA - Amount of token A users want to provide liquidity.
   * Use `null` if you want `amountADesired` is determined by `amountB`.
   * @param amountB - Amount of token B users want to provide liquidity.
   * Use `null` if you want `amountBDesired` is determined by `amountA`.
   * @param reserveA - Reserve of token A in the pool.
   * @param reserveB - Reserve of token B in the pool.
   * @param rateEstOptions - Extra options (i.e slippage) to calculate final result.
   *
   * @returns
   * - `sharesAmountReceived` is the amount of LP-token users should receive.
   * - `sharesAmountBurned` is the amount of LP-tokens burnt due to first liquidity provider.
   * - `amountADesired` is the amount of token A users should deposit to the pool by the current mid price users specify.
   * - `amountBDesired` is the amount of token B users should deposit to the pool by the current mid price users specify.
   * - `amountAMin` is the amount of token A users can use to limit acceptable mid price range due to slippage.
   * - `amountBMin` is the amount of token B users can use to limit acceptable mid price range due to slippage.
   */
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
  > {
    const _reserveA = new BN(reserveA.toString());
    const _reserveB = new BN(reserveB.toString());
    const _sharesTotalSupply = new BN(sharesTotalSupply.toString());

    if (_reserveA.isZero() && _reserveB.isZero()) {
      if (!_sharesTotalSupply.isZero()) {
        return defekt.error(new InvariantError("Shares total supply should be zero"));
      }

      // First liquidity provider
      if (amountA == null || amountB == null) {
        return defekt.error(new InvariantError("Amount desired must not null"));
      }

      const _amountA = new BN(amountA.toString());
      const _amountB = new BN(amountB.toString());

      if (_amountA.isZero() || _amountB.isZero()) {
        return defekt.error(new InvariantError("Amount desired must not zero"));
      }

      const sharesAmount = sqrt(_amountA.mul(_amountB));
      if (sharesAmount.lte(MINIMUM_LIQUIDITY)) {
        return defekt.error(new InvariantError("Shares minted less than minimum liquidity"));
      }
      const sharesAmountReceived = sharesAmount.sub(MINIMUM_LIQUIDITY);
      const sharesAmountBurned = MINIMUM_LIQUIDITY;

      return defekt.value({
        sharesAmountReceived,
        sharesAmountBurned,
        amountADesired: _amountA,
        amountBDesired: _amountB,
        amountAMin: _amountA,
        amountBMin: _amountB,
      });
    } else if (_reserveA.isZero() || _reserveB.isZero() || _sharesTotalSupply.isZero()) {
      // The pool already exists, but invalid parameters being passed.
      return defekt.error(new InvariantError("Reserves or Shares total supply must not be zero"));
    } else {
      if (amountA == null && amountB == null) {
        return defekt.error(new InvariantError("Only one token amount can be null"));
      } else {
        let _amount: BN;
        let _reserve: BN;
        let _otherReserve: BN;
        let _isAmountOfA: boolean;
        if (amountA != null && amountB != null) {
          // Both amountA and amountB is provided, we need to choose one of them.
          const _amountA = new BN(amountA.toString());
          const _amountB = new BN(amountB.toString());

          const sharesA = _amountA.mul(_sharesTotalSupply).div(_reserveA);
          const sharesB = _amountB.mul(_sharesTotalSupply).div(_reserveB);

          if (sharesA.lte(sharesB)) {
            _amount = _amountA;
            _isAmountOfA = true;
            _reserve = _reserveA;
            _otherReserve = _reserveB;
          } else {
            _amount = _amountB;
            _isAmountOfA = false;
            _reserve = _reserveB;
            _otherReserve = _reserveA;
          }
        } else {
          // Either amountA or amountB is null
          if (amountA != null) {
            const _amountA = new BN(amountA.toString());
            _amount = _amountA;
            _isAmountOfA = true;
            _reserve = _reserveA;
            _otherReserve = _reserveB;
          } else {
            const _amountB = new BN(amountB!.toString());
            _amount = _amountB;
            _isAmountOfA = false;
            _reserve = _reserveB;
            _otherReserve = _reserveA;
          }
        }
        const sharesAmountReceived = _amount.mul(_sharesTotalSupply).div(_reserve);
        const otherAmountDesired = _amount.mul(_otherReserve).div(_reserve);
        const amountMin = _amount.sub(_amount.muln(rateEstOptions.slippage).divn(10_000));
        const otherAmountMin = otherAmountDesired.sub(
          otherAmountDesired.muln(rateEstOptions.slippage).divn(10_000)
        );

        return defekt.value({
          sharesAmountReceived,
          sharesAmountBurned: new BN(0),
          amountADesired: _isAmountOfA ? _amount : otherAmountDesired,
          amountBDesired: _isAmountOfA ? otherAmountDesired : _amount,
          amountAMin: _isAmountOfA ? amountMin : otherAmountMin,
          amountBMin: _isAmountOfA ? otherAmountMin : amountMin,
        });
      }
    }
  }

  /**
   * It is useful for users to have "estimated" information given their intents to remove liquidity.
   * These information can be fed to `Remove liquidity API`.
   *
   * @param sharesAmount - Amount of LP-token users want to remove.
   * @param sharesTotalSupply - Total supply of LP-token.
   * @param reserveA - Reserve of token A in the pool.
   * @param reserveB - Reserve of token B in the pool.
   * @param rateEstOptions - Extra options (i.e slippage) to calculate final result.
   *
   * @returns
   * - `amountAReceived` is the amount of token A users should receive after remove liquidity.
   * - `amountBReceived` is the amount of token B users should receive after remove liquidity.
   * - `amountAMin` is the amount of token A users willing to receive at worst due to slippage.
   * - `amountBMin` is the amount of token B users willing to receive at worst due to slippage.
   */
  getRemoveLiquidityInfo(
    sharesAmount: AnyNumber,
    sharesTotalSupply: AnyNumber,
    reserveA: AnyNumber,
    reserveB: AnyNumber,
    rateEstOptions: RateEstimateOptions = { slippage: 0 }
  ): Result<
    { amountAReceived: BN; amountBReceived: BN; amountAMin: BN; amountBMin: BN },
    GetRemoveLiquidityInfoError
  > {
    const _reserveA = new BN(reserveA.toString());
    const _reserveB = new BN(reserveB.toString());
    const _sharesAmount = new BN(sharesAmount.toString());
    const _sharesTotalSupply = new BN(sharesTotalSupply.toString());

    if (
      _reserveA.isZero() ||
      _reserveB.isZero() ||
      _sharesAmount.isZero() ||
      _sharesTotalSupply.isZero()
    ) {
      return defekt.error(
        new InvariantError("Shares/Shares total supply/Reserves must not be zero")
      );
    }

    const amountAReceived = _sharesAmount.mul(_reserveA).div(_sharesTotalSupply);
    const amountBReceived = _sharesAmount.mul(_reserveB).div(_sharesTotalSupply);
    const amountAMin = amountAReceived.sub(
      amountAReceived.muln(rateEstOptions.slippage).divn(10_000)
    );
    const amountBMin = amountBReceived.sub(
      amountBReceived.muln(rateEstOptions.slippage).divn(10_000)
    );

    return defekt.value({ amountAReceived, amountBReceived, amountAMin, amountBMin });
  }

  /**
   * Get total supply of a PSP22 token.
   *
   * @param token - PSP22 Token address
   */
  async getTotalSupply(token: Address): Promise<Result<BN, GetTotalSupplyError>> {
    const psp22Contract = new ContractPromise(this._api, psp22AbiJson, token);
    const queryResult = await submitContractQuery(
      this._api,
      psp22Contract,
      this._routerContract.address.toString(),
      { value: 0, gasLimit: -1 },
      "psp22::totalSupply",
      []
    );

    if (queryResult.hasError()) {
      return defekt.error(queryResult.error);
    }

    const { value: output } = queryResult;
    if (output) {
      return defekt.value(new BN(output.toString()));
    }

    throw new Error("Total supply not found");
  }
}
