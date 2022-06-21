import { ApiPromise } from "@polkadot/api";
import { AnyNumber, Result, ContractAddress } from "./types";

/**
 * Swap SDK is created to facilitate the integration with BHO Swap contracts.
 */
export class SwapSdk {
  private constructor(
    private _api: ApiPromise,
    private _routerAddr: ContractAddress,
    private _factoryAddr: ContractAddress
  ) {}

  /**
   * Initialize the SDK instance
   * @param api - Polkadot `ApiPromise` instance. Consumers should initialize this api instance beforehand.
   * @param routerAddr - BHO Swap Router contract address.
   * @param factoryAddr - BHO Swap Factory contract address.
   * @returns Returns initialized `{@link SwapSdk | Swap SDK instance}
   */
  static initialize(
    api: ApiPromise,
    routerAddr: ContractAddress,
    factoryAddr: ContractAddress
  ): SwapSdk {
    return new SwapSdk(api, routerAddr, factoryAddr);
  }
}
