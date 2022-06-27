import { Registry, ISubmittableResult } from "@polkadot/types/types";
import { DispatchError } from "@polkadot/types/interfaces";
import { ContractCallOutcome, ContractOptions } from "@polkadot/api-contract/types";
import * as defekt from "defekt";
import { ApiPromise } from "@polkadot/api";
import { Logger } from "@polkadot/util/types";

import * as errors from "./errors";
import { KeyringPair, Result, SdkCallOptions } from "./types";
import { ContractPromise } from "@polkadot/api-contract";

export function getErrorStrFromDispatchError(registry: Registry, error: DispatchError) {
  if (error.isModule) {
    const decoded = registry.findMetaError(error.asModule);
    const { docs, method, section } = decoded;

    return `${section}.${method}: ${docs.join(" ")}`;
  } else {
    return error.toString();
  }
}

export function getOnchainErrorFromContractCallOutcome(
  registry: Registry,
  result: ContractCallOutcome
): errors.OnchainError | undefined {
  if (result.result.isErr) {
    return new errors.OnchainError({
      message: getErrorStrFromDispatchError(registry, result.result.asErr),
      data: result.result.asErr,
    });
  } else if (result.result.isOk && result.result.asOk.flags.isRevert) {
    return new errors.OnchainError({
      message: result.output?.toString(),
      data: result.output,
    });
  }
  return;
}

export function getOnchainErrorFromSubmittableResult(
  registry: Registry,
  result: ISubmittableResult
): errors.OnchainError | undefined {
  if (result.dispatchError) {
    return new errors.OnchainError({
      message: getErrorStrFromDispatchError(registry, result.dispatchError!),
      data: result.dispatchError,
    });
  }
  return;
}

export async function submitContractTx(
  api: ApiPromise,
  contract: ContractPromise,
  signer: KeyringPair,
  contractOptions: ContractOptions,
  message: string,
  params: any[],
  sdkCallOptions: SdkCallOptions,
  l: Logger
): Promise<Result<undefined, errors.OnchainError>> {
  return new Promise(async (resolve, reject) => {
    try {
      const queryResult = await contract.query[message](signer.address, contractOptions, ...params);

      const onchainError = getOnchainErrorFromContractCallOutcome(api.registry, queryResult);
      if (onchainError) {
        l.error(`Onchain error: ${onchainError.message}`);
        return resolve(defekt.error(onchainError));
      }

      const unsub = await contract.tx[message](contractOptions, ...params).signAndSend(
        signer,
        (result) => {
          if (result.status.isInBlock || result.status.isFinalized) {
            const onchainError = getOnchainErrorFromSubmittableResult(api.registry, result);
            if (onchainError) {
              unsub();
              return resolve(defekt.error(onchainError));
            }

            if (
              (sdkCallOptions.resolveStatus === "isInBlock" && result.status.isInBlock) ||
              (sdkCallOptions.resolveStatus === "isFinalized" && result.status.isFinalized)
            ) {
              unsub();
              return resolve(defekt.value());
            }
          }
        }
      );
    } catch (error) {
      l.error(`Unexpected error ${error}`);
      return reject(error);
    }
  });
}
