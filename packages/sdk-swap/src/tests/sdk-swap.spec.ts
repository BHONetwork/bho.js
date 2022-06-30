import { ApiPromise, WsProvider } from "@polkadot/api";
import { CodePromise, ContractPromise, Abi, BlueprintPromise } from "@polkadot/api-contract";
import { Keyring } from "@polkadot/keyring";
import { mnemonicGenerate } from "@polkadot/util-crypto";
import { compactAddLength } from "@polkadot/util";
import "@polkadot/api-augment/substrate";
import BN from "bn.js";
import fs from "fs";
import path from "path";
import * as defekt from "defekt";

import { SwapSdk } from "../lib/sdk-swap";
import { Address, AnyNumber, KeyringPair } from "../lib/types";
import { ContractOptions } from "@polkadot/api-contract/types";
import { InvalidTokenPair, OnchainError } from "../lib/errors";
import { MAX_U128 } from "../lib/constants";

const factoryWasmBlob = fs.readFileSync(
  path.join(__dirname, "../fixtures/wasm/bho_swap_factory_contract.wasm")
);
const routerWasmBlob = fs.readFileSync(
  path.join(__dirname, "../fixtures/wasm/bho_swap_router_contract.wasm")
);
const pairWasmBlob = fs.readFileSync(
  path.join(__dirname, "../fixtures/wasm/bho_swap_pair_contract.wasm")
);
const psp22WasmBlob = fs.readFileSync(
  path.join(__dirname, "../fixtures/wasm/psp22_token_contract.wasm")
);
const wbhoWasmBlob = fs.readFileSync(path.join(__dirname, "../fixtures/wasm/wbho_contract.wasm"));

const factoryAbi = new Abi(require("../fixtures/abi/bho_swap_factory_contract.json"));
const routerAbi = new Abi(require("../fixtures/abi/bho_swap_router_contract.json"));
const pairAbi = new Abi(require("../fixtures/abi/bho_swap_pair_contract.json"));
const psp22Abi = new Abi(require("../fixtures/abi/psp22_token_contract.json"));
const wbhoAbi = new Abi(require("../fixtures/abi/wbho_contract.json"));

const keyring = new Keyring({ type: "sr25519" });
const GAS_LIMIT = "400000000000";
const TOTAL_SUPPLY_A = new BN(1_000_000_000).mul(new BN(10).pow(new BN(18)));
const TOTAL_SUPPLY_B = new BN(1_000_000_000).mul(new BN(10).pow(new BN(18)));

function expandToDecimals(num: number, decimals: number) {
  return new BN(num).mul(new BN(10).pow(new BN(decimals)));
}

async function createBlueprint(code: CodePromise, keypair: KeyringPair): Promise<BlueprintPromise> {
  return new Promise(async (resolve, reject) => {
    const codeInfoResult = await code.api.query.contracts.codeStorage(
      code.abi.info.source.wasmHash
    );
    if (codeInfoResult.isSome) {
      return resolve(
        new BlueprintPromise(code.api as any, code.abi, code.abi.info.source.wasmHash)
      );
    }

    const unsub = await code.api.tx.contracts
      .uploadCode(compactAddLength(code.code), null)
      .signAndSend(keypair, (result) => {
        const contractName = code.abi.info.contract.name.toString();
        if (result.status.isInBlock) {
          if (result.dispatchError) {
            const { dispatchError } = result;
            if (dispatchError.isModule) {
              console.error(
                `Upload ${contractName} code error: `,
                dispatchError.asModule.toString()
              );
            } else {
              console.error(`Upload ${contractName} code error: `, dispatchError.toString());
            }
            reject(dispatchError);
          } else {
            resolve((result as any).blueprint);
          }
          unsub();
        }
      });
  });
}

async function createContract(
  blueprint: BlueprintPromise,
  keypair: KeyringPair,
  constructor: string,
  options: ContractOptions,
  ...params: any[]
): Promise<ContractPromise> {
  return new Promise(async (resolve, reject) => {
    const unsub = await blueprint.tx[constructor](options, ...params).signAndSend(
      keypair,
      (result) => {
        const contractName = blueprint.abi.info.contract.name.toString();
        if (result.status.isInBlock) {
          if (result.dispatchError) {
            const { dispatchError } = result;
            if (dispatchError.isModule) {
              console.error(
                `Instantiate ${contractName} error: `,
                dispatchError.asModule.toString()
              );
            } else {
              console.error(`Instantiate ${contractName} error: `, dispatchError.toString());
            }
            reject(dispatchError);
          } else {
            resolve((result as any).contract);
          }
          unsub();
        }
      }
    );
  });
}

describe("SwapSDK", () => {
  let aliceKeyPair: KeyringPair;
  let feeToSetter: KeyringPair;
  let api: ApiPromise;
  let factoryContract: ContractPromise;
  let routerContract: ContractPromise;
  let pairContract: ContractPromise;
  let tokenAContract: ContractPromise;
  let tokenBContract: ContractPromise;
  let wbhoContract: ContractPromise;

  beforeEach(async () => {
    api = await ApiPromise.create({ provider: new WsProvider("ws://localhost:9944") });
    aliceKeyPair = keyring.addFromUri("//Alice");
    feeToSetter = keyring.addFromUri(mnemonicGenerate());

    const factoryCode = new CodePromise(api, factoryAbi, factoryWasmBlob);
    const routerCode = new CodePromise(api, routerAbi, routerWasmBlob);
    const pairCode = new CodePromise(api, pairAbi, pairWasmBlob);
    const psp22Code = new CodePromise(api, psp22Abi, psp22WasmBlob);
    const wbhoCode = new CodePromise(api, wbhoAbi, wbhoWasmBlob);

    const pairBlueprint = await createBlueprint(pairCode, aliceKeyPair);
    const factoryBlueprint = await createBlueprint(factoryCode, aliceKeyPair);
    const routerBlueprint = await createBlueprint(routerCode, aliceKeyPair);
    const psp22Blueprint = await createBlueprint(psp22Code, aliceKeyPair);
    const wbhoBlueprint = await createBlueprint(wbhoCode, aliceKeyPair);

    factoryContract = await createContract(
      factoryBlueprint,
      aliceKeyPair,
      "new",
      { gasLimit: GAS_LIMIT },
      feeToSetter.address,
      pairBlueprint.codeHash
    );
    wbhoContract = await createContract(wbhoBlueprint, aliceKeyPair, "new", {
      gasLimit: GAS_LIMIT,
    });
    routerContract = await createContract(
      routerBlueprint,
      aliceKeyPair,
      "new",
      {
        gasLimit: GAS_LIMIT,
      },
      factoryContract.address,
      wbhoContract.address
    );
    tokenAContract = await createContract(
      psp22Blueprint,
      aliceKeyPair,
      "new",
      {
        gasLimit: GAS_LIMIT,
      },
      "Token A",
      "TOKENA",
      18,
      TOTAL_SUPPLY_A
    );
    tokenBContract = await createContract(
      psp22Blueprint,
      aliceKeyPair,
      "new",
      {
        gasLimit: GAS_LIMIT,
      },
      "Token B",
      "TOKENB",
      18,
      TOTAL_SUPPLY_B
    );
  });

  afterEach(async () => {
    await api.disconnect();
  });

  describe("SwapSDK::addLiquidity", () => {
    it("Should return Err for invalid pair", async () => {
      const sdk = SwapSdk.initialize(
        api,
        routerContract.address.toString(),
        factoryContract.address.toString(),
        aliceKeyPair
      );

      const sameTokenResult = await sdk.addLiquidity(
        tokenAContract.address.toString(),
        tokenAContract.address.toString(),
        0,
        0
      );

      expect(sameTokenResult.hasError()).toBeTruthy();
      if (sameTokenResult.hasError()) {
        expect(defekt.isCustomError(sameTokenResult.error, InvalidTokenPair)).toBeTruthy();
      }

      const sameBHOResult = await sdk.addLiquidity("BHO", "BHO", 0, 0);
      expect(sameBHOResult.hasError()).toBeTruthy();
      if (sameBHOResult.hasError()) {
        expect(defekt.isCustomError(sameBHOResult.error, InvalidTokenPair)).toBeTruthy();
      }
    });

    it("Should work for PSP22 pair", async () => {
      const sdk = SwapSdk.initialize(
        api,
        routerContract.address.toString(),
        factoryContract.address.toString(),
        aliceKeyPair
      );

      let addLiqResult = await sdk.addLiquidity(
        tokenAContract.address.toString(),
        tokenBContract.address.toString(),
        0,
        0
      );
      expect(addLiqResult.hasError()).toBeTruthy();
      if (addLiqResult.hasError()) {
        expect(defekt.isCustomError(addLiqResult.error, OnchainError)).toBeTruthy();
      }

      const tokenALiquidity = expandToDecimals(1_000, 18);
      const tokenBLiquidity = expandToDecimals(1_000, 18);

      let approveResult = await sdk.approve(tokenAContract.address.toString(), tokenALiquidity);
      expect(approveResult.hasValue()).toBeTruthy();
      approveResult = await sdk.approve(tokenBContract.address.toString(), tokenBLiquidity);
      expect(approveResult.hasValue()).toBeTruthy();

      addLiqResult = await sdk.addLiquidity(
        tokenAContract.address.toString(),
        tokenBContract.address.toString(),
        tokenALiquidity,
        tokenBLiquidity
      );
      expect(addLiqResult.hasValue()).toBeTruthy();
    });

    it("Should work for BHO-PSP22 pair", async () => {
      const sdk = SwapSdk.initialize(
        api,
        routerContract.address.toString(),
        factoryContract.address.toString(),
        aliceKeyPair
      );

      let addLiqResult = await sdk.addLiquidity("BHO", tokenAContract.address.toString(), 0, 0);
      expect(addLiqResult.hasError()).toBeTruthy();

      const bhoLiq = expandToDecimals(1_000, 18);
      const tokenALiq = expandToDecimals(1_000, 18);
      const tokenBLiq = expandToDecimals(1_000, 18);

      // Try to add liquidity BHO-TokenA
      let approveResult = await sdk.approve(tokenAContract.address.toString(), tokenALiq);
      expect(approveResult.hasValue()).toBeTruthy();
      addLiqResult = await sdk.addLiquidity(
        "BHO",
        tokenAContract.address.toString(),
        bhoLiq,
        tokenALiq
      );
      expect(addLiqResult.hasValue()).toBeTruthy();

      // Try to add liquidity TokenB-BHO
      approveResult = await sdk.approve(tokenBContract.address.toString(), tokenBLiq);
      expect(approveResult.hasValue()).toBeTruthy();
      addLiqResult = await sdk.addLiquidity(
        tokenBContract.address.toString(),
        "BHO",
        tokenBLiq,
        bhoLiq
      );
      expect(addLiqResult.hasValue()).toBeTruthy();
    });
  });

  async function addLiquidity(
    sdk: SwapSdk,
    tokenA: Address | "BHO",
    tokenB: Address | "BHO",
    amountA: AnyNumber,
    amountB: AnyNumber
  ) {
    if (tokenA !== "BHO") {
      await sdk.approve(tokenA, amountA);
    }
    if (tokenB !== "BHO") {
      await sdk.approve(tokenB, amountB);
    }

    const addLiqResult = await sdk.addLiquidity(tokenA, tokenB, amountA, amountB);
    expect(addLiqResult.hasValue()).toBeTruthy();
  }

  describe("SwapSDK::removeLiquidity", () => {
    it("Should return Err for invalid pair", async () => {
      const sdk = SwapSdk.initialize(
        api,
        routerContract.address.toString(),
        factoryContract.address.toString(),
        aliceKeyPair
      );

      const sameTokenResult = await sdk.removeLiquidity(
        tokenAContract.address.toString(),
        tokenAContract.address.toString(),
        0
      );

      expect(sameTokenResult.hasError()).toBeTruthy();
      if (sameTokenResult.hasError()) {
        expect(defekt.isCustomError(sameTokenResult.error, InvalidTokenPair)).toBeTruthy();
      }

      const sameBHOResult = await sdk.removeLiquidity("BHO", "BHO", 0);
      expect(sameBHOResult.hasError()).toBeTruthy();
      if (sameBHOResult.hasError()) {
        expect(defekt.isCustomError(sameBHOResult.error, InvalidTokenPair)).toBeTruthy();
      }
    });

    it("Should work for valid pair", async () => {
      const sdk = SwapSdk.initialize(
        api,
        routerContract.address.toString(),
        factoryContract.address.toString(),
        aliceKeyPair
      );

      const tokenALiquidity = expandToDecimals(1_000, 18);
      const tokenBLiquidity = expandToDecimals(1_000, 18);

      // For PSP22 pair
      await addLiquidity(
        sdk,
        tokenAContract.address.toString(),
        tokenBContract.address.toString(),
        tokenALiquidity,
        tokenBLiquidity
      );
      let removeLiqResult = await sdk.removeLiquidity(
        tokenAContract.address.toString(),
        tokenBContract.address.toString(),
        tokenALiquidity.subn(1000)
      );
      expect(removeLiqResult.hasError()).toBeTruthy();
      let pairContract = (
        await sdk.getLiquidityPoolContract(
          tokenAContract.address.toString(),
          tokenBContract.address.toString()
        )
      ).unwrapOrThrow();
      expect(pairContract).not.toEqual(null);
      await sdk.approve(pairContract!.address.toString(), tokenALiquidity.subn(1000));
      removeLiqResult = await sdk.removeLiquidity(
        tokenAContract.address.toString(),
        tokenBContract.address.toString(),
        tokenALiquidity.subn(1000)
      );
      expect(removeLiqResult.hasValue()).toBeTruthy();

      // For BHO-PSP22 Pair
      const bhoLiquidity = expandToDecimals(1_000, 18);
      await addLiquidity(
        sdk,
        "BHO",
        tokenBContract.address.toString(),
        bhoLiquidity,
        tokenBLiquidity
      );
      removeLiqResult = await sdk.removeLiquidity(
        "BHO",
        tokenBContract.address.toString(),
        bhoLiquidity.subn(1000)
      );
      expect(removeLiqResult.hasError()).toBeTruthy();
      pairContract = (
        await sdk.getLiquidityPoolContract("BHO", tokenBContract.address.toString())
      ).unwrapOrThrow();
      expect(pairContract).not.toEqual(null);
      await sdk.approve(pairContract!.address.toString(), bhoLiquidity.subn(1000));
      removeLiqResult = await sdk.removeLiquidity(
        "BHO",
        tokenBContract.address.toString(),
        bhoLiquidity.subn(1000)
      );
      expect(removeLiqResult.hasValue()).toBeTruthy();
    });
  });

  describe("SwapSdk::swapExactTokensForTokens", () => {
    it("Should work for BHO -> PSP22", async () => {
      const sdk = SwapSdk.initialize(
        api,
        routerContract.address.toString(),
        factoryContract.address.toString(),
        aliceKeyPair
      );

      const bhoLiquidity = expandToDecimals(1_000_000, 18);
      const tokenALiquidity = expandToDecimals(1_000_000, 18);

      await addLiquidity(
        sdk,
        "BHO",
        tokenAContract.address.toString(),
        bhoLiquidity,
        tokenALiquidity
      );

      const swapAmount = expandToDecimals(1_000, 18);
      const swapResult = await sdk.swapExactTokensForTokens(swapAmount, 0, [
        "BHO",
        tokenAContract.address.toString(),
      ]);
      expect(swapResult.hasValue()).toBeTruthy();
    });

    it("Should work for PSP22 -> BHO", async () => {
      const sdk = SwapSdk.initialize(
        api,
        routerContract.address.toString(),
        factoryContract.address.toString(),
        aliceKeyPair
      );

      const bhoLiquidity = expandToDecimals(1_000_000, 18);
      const tokenALiquidity = expandToDecimals(1_000_000, 18);

      await addLiquidity(
        sdk,
        "BHO",
        tokenAContract.address.toString(),
        bhoLiquidity,
        tokenALiquidity
      );

      const swapAmount = expandToDecimals(1_000, 18);
      await sdk.approve(tokenAContract.address.toString(), swapAmount);
      const swapResult = await sdk.swapExactTokensForTokens(swapAmount, 0, [
        tokenAContract.address.toString(),
        "BHO",
      ]);
      expect(swapResult.hasValue()).toBeTruthy();
    });

    it("Should work for PSP22 -> PSP22", async () => {
      const sdk = SwapSdk.initialize(
        api,
        routerContract.address.toString(),
        factoryContract.address.toString(),
        aliceKeyPair
      );

      const tokenALiquidity = expandToDecimals(1_000_000, 18);
      const tokenBLiquidity = expandToDecimals(1_000_000, 18);

      await addLiquidity(
        sdk,
        tokenBContract.address.toString(),
        tokenAContract.address.toString(),
        tokenBLiquidity,
        tokenALiquidity
      );

      const swapAmount = expandToDecimals(1_000, 18);
      await sdk.approve(tokenAContract.address.toString(), swapAmount);
      const swapResult = await sdk.swapExactTokensForTokens(swapAmount, 0, [
        tokenAContract.address.toString(),
        tokenBContract.address.toString(),
      ]);
      expect(swapResult.hasValue()).toBeTruthy();
    });
  });

  describe("SwapSdk::swapTokensForExactTokens", () => {
    it("Should work for BHO -> PSP22", async () => {
      const sdk = SwapSdk.initialize(
        api,
        routerContract.address.toString(),
        factoryContract.address.toString(),
        aliceKeyPair
      );

      const bhoLiquidity = expandToDecimals(1_000_000, 18);
      const tokenALiquidity = expandToDecimals(1_000_000, 18);

      await addLiquidity(
        sdk,
        "BHO",
        tokenAContract.address.toString(),
        bhoLiquidity,
        tokenALiquidity
      );

      const outputAmount = expandToDecimals(1_000, 18);
      const swapAmount = expandToDecimals(10_000, 18);
      const swapResult = await sdk.swapTokensForExactTokens(outputAmount, swapAmount, [
        "BHO",
        tokenAContract.address.toString(),
      ]);
      expect(swapResult.hasValue()).toBeTruthy();
    });

    it("Should work for PSP22 -> BHO", async () => {
      const sdk = SwapSdk.initialize(
        api,
        routerContract.address.toString(),
        factoryContract.address.toString(),
        aliceKeyPair
      );

      const bhoLiquidity = expandToDecimals(1_000_000, 18);
      const tokenALiquidity = expandToDecimals(1_000_000, 18);

      await addLiquidity(
        sdk,
        "BHO",
        tokenAContract.address.toString(),
        bhoLiquidity,
        tokenALiquidity
      );

      const outputAmount = expandToDecimals(1_000, 18);
      const swapAmount = expandToDecimals(10_000, 18);
      await sdk.approve(tokenAContract.address.toString(), swapAmount);
      const swapResult = await sdk.swapTokensForExactTokens(outputAmount, swapAmount, [
        tokenAContract.address.toString(),
        "BHO",
      ]);
      expect(swapResult.hasValue()).toBeTruthy();
    });

    it("Should work for PSP22 -> PSP22", async () => {
      const sdk = SwapSdk.initialize(
        api,
        routerContract.address.toString(),
        factoryContract.address.toString(),
        aliceKeyPair
      );

      const tokenALiquidity = expandToDecimals(1_000_000, 18);
      const tokenBLiquidity = expandToDecimals(1_000_000, 18);

      await addLiquidity(
        sdk,
        tokenBContract.address.toString(),
        tokenAContract.address.toString(),
        tokenBLiquidity,
        tokenALiquidity
      );

      const outputAmount = expandToDecimals(1_000, 18);
      const swapAmount = expandToDecimals(10_000, 18);
      await sdk.approve(tokenAContract.address.toString(), swapAmount);
      const swapResult = await sdk.swapTokensForExactTokens(outputAmount, swapAmount, [
        tokenAContract.address.toString(),
        tokenBContract.address.toString(),
      ]);
      expect(swapResult.hasValue()).toBeTruthy();
    });
  });

  describe("SwapSdk::getLiquidityPoolReserves", () => {
    it("Should work PSP22-PSP22", async () => {
      const sdk = SwapSdk.initialize(
        api,
        routerContract.address.toString(),
        factoryContract.address.toString(),
        aliceKeyPair
      );

      const tokenALiq = expandToDecimals(1_000, 18);
      const tokenBLiq = expandToDecimals(2_000, 18);

      await addLiquidity(
        sdk,
        tokenAContract.address.toString(),
        tokenBContract.address.toString(),
        tokenALiq,
        tokenBLiq
      );

      let result = await sdk.getLiquidityPoolReserves(
        tokenAContract.address.toString(),
        tokenBContract.address.toString()
      );
      expect(result.hasValue()).toBeTruthy();
      if (result.hasValue()) {
        expect(result.value[0].toString()).toEqual(tokenALiq.toString());
        expect(result.value[1].toString()).toEqual(tokenBLiq.toString());
      }

      result = await sdk.getLiquidityPoolReserves(
        tokenBContract.address.toString(),
        tokenAContract.address.toString()
      );
      expect(result.hasValue()).toBeTruthy();
      if (result.hasValue()) {
        expect(result.value[0].toString()).toEqual(tokenBLiq.toString());
        expect(result.value[1].toString()).toEqual(tokenALiq.toString());
      }
    });

    it("Should work BHO-PSP22", async () => {
      const sdk = SwapSdk.initialize(
        api,
        routerContract.address.toString(),
        factoryContract.address.toString(),
        aliceKeyPair
      );

      const bhoLiq = expandToDecimals(1_000, 18);
      const tokenBLiq = expandToDecimals(2_000, 18);

      await addLiquidity(sdk, "BHO", tokenBContract.address.toString(), bhoLiq, tokenBLiq);

      let result = await sdk.getLiquidityPoolReserves("BHO", tokenBContract.address.toString());
      expect(result.hasValue()).toBeTruthy();
      if (result.hasValue()) {
        expect(result.value[0].toString()).toEqual(bhoLiq.toString());
        expect(result.value[1].toString()).toEqual(tokenBLiq.toString());
      }

      result = await sdk.getLiquidityPoolReserves(tokenBContract.address.toString(), "BHO");
      expect(result.hasValue()).toBeTruthy();
      if (result.hasValue()) {
        expect(result.value[0].toString()).toEqual(tokenBLiq.toString());
        expect(result.value[1].toString()).toEqual(bhoLiq.toString());
      }
    });
  });

  describe("SwapSdk::getBalance", () => {
    it("Should work", async () => {
      const sdk = SwapSdk.initialize(
        api,
        routerContract.address.toString(),
        factoryContract.address.toString(),
        aliceKeyPair
      );
      const someUser = keyring.createFromUri(mnemonicGenerate());

      const bhoBalance = expandToDecimals(100, 18);
      await api.tx.balances.transfer(someUser.address, bhoBalance).signAndSend(aliceKeyPair);

      let queryResult = await sdk.getBalance("BHO", someUser.address.toString());
      expect(queryResult.hasValue()).toBeTruthy();
      if (queryResult.hasValue()) {
        expect(queryResult.value.toString()).toEqual(bhoBalance.toString());
      }

      queryResult = await sdk.getBalance(
        tokenAContract.address.toString(),
        aliceKeyPair.address.toString()
      );
      expect(queryResult.hasValue()).toBeTruthy();
      if (queryResult.hasValue()) {
        expect(queryResult.value.toString()).toEqual(TOTAL_SUPPLY_A.toString());
      }

      queryResult = await sdk.getBalance(
        tokenBContract.address.toString(),
        aliceKeyPair.address.toString()
      );
      expect(queryResult.hasValue()).toBeTruthy();
      if (queryResult.hasValue()) {
        expect(queryResult.value.toString()).toEqual(TOTAL_SUPPLY_B.toString());
      }
    });
  });
});
