import { ApiPromise } from "@polkadot/api";
import { Abi, ContractPromise } from "@polkadot/api-contract";
import { AnyNumber, Result, Address, KeyringPair } from "./types";

import bhoSwapFactoryAbiJson from "../abi/bho_swap_factory_contract.json";
import bhoSwapRouterAbiJson from "../abi/bho_swap_router_contract.json";

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
