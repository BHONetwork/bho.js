import type { AnyNumber } from "@polkadot/types/types";

export type { AnyNumber } from "@polkadot/types/types";
export type { Result } from "defekt";
export type Address = string | `0x${string}`;
export type { KeyringPair } from "@polkadot/keyring/types";

export * as errors from "./errors";

export type SdkCallOptions = {
  /**
   * The status of submitted transaction determine when SDK call should complete.
   * `isInBlock` means when transaction is included in a block, the SDK call's promise will be resolved.
   * `isFinalized` means when transaction is finalized, the SDK call's promise will be resolved.
   */
  resolveStatus: "isInBlock" | "isFinalized";
};
