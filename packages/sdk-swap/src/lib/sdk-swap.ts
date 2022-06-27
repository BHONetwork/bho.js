import { ApiPromise } from "@polkadot/api";
import { Abi, ContractPromise } from "@polkadot/api-contract";
import { decodeAddress } from "@polkadot/keyring";
import { u8aEq, logger } from "@polkadot/util";
import * as defekt from "defekt";
import BN from "bn.js";

import { AnyNumber, Result, Address, KeyringPair, errors, SdkCallOptions } from "./types";
import { MAX_U64 } from "./constants";
import {
  getErrorStrFromDispatchError,
  getOnchainErrorFromContractCallOutcome,
  getOnchainErrorFromSubmittableResult,
  submitContractTx,
} from "./utils";
import { ApproveError, InvalidTokenPair, NoConnectedSigner, RemoveLiquidityError } from "./errors";

import bhoSwapFactoryAbiJson from "../fixtures/abi/bho_swap_factory_contract.json";
import bhoSwapRouterAbiJson from "../fixtures/abi/bho_swap_router_contract.json";
import psp22AbiJson from "../fixtures/abi/psp22_token_contract.json";
import bhoSwapPairAbiJson from "../fixtures/abi/bho_swap_pair_contract.json";

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
   * Get token allowance of router contract
   * @param token - PSP22 token address
   * @param user - User address
   */
  async getAllowance(token: Address, user: Address): Promise<BN | null> {
    const l = logger("@bho-network/sdk-swap/getAllowance");

    const tokenContract = new ContractPromise(this._api, psp22AbiJson, token);
    const { result, output } = await tokenContract.query["psp22::allowance"](
      user,
      { value: 0, gasLimit: -1 },
      user,
      token
    );

    if (result.isOk) {
      l.log(`allowance: ${output?.toString()}`);
      return new BN(output?.toString() || 0);
    }
    return null;
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
  ): Promise<ContractPromise | null> {
    const l = logger("@bho-network/sdk-swap/getLiquidityPoolContract");
    if (tokenA === "BHO" && tokenB === "BHO") {
      return null;
    }
    if (
      tokenA !== "BHO" &&
      tokenB !== "BHO" &&
      u8aEq(decodeAddress(tokenA), decodeAddress(tokenB))
    ) {
      return null;
    }

    let token0Addr: string = tokenA;
    let token1Addr: string = tokenB;

    if (tokenA === "BHO" || tokenB === "BHO") {
      const { result, output } = await this._routerContract.query["bhoSwapRouter::wbho"](
        this._routerContract.address,
        { value: 0, gasLimit: -1 }
      );
      if (result.isOk) {
        if (output) {
          token0Addr = output.toString();
          l.log(`WBHO address: ${token0Addr}`);
          if (tokenA === "BHO") {
            token1Addr = tokenB;
          } else {
            token1Addr = tokenA;
          }
        } else {
          return null;
        }
      } else {
        return null;
      }
    }

    const { result, output } = await this._factoryContract.query["bhoSwapFactory::pairByToken"](
      this._factoryContract.address,
      { value: 0, gasLimit: -1 },
      token0Addr,
      token1Addr
    );

    if (result.isOk) {
      if (output) {
        l.log(`Liquidity Pool address: ${output.toString()}`);
        return new ContractPromise(this._api, bhoSwapPairAbiJson, output.toString());
      }
    }
    return null;
  }
}
