import { defekt } from "defekt";

export class OnchainError extends defekt({ code: "OnChainError" }) {}

export class NoConnectedSigner extends defekt({
  code: "NoConnectedSigner",
  defaultMessage: "No connected signer",
}) {}

export class InvalidTokenPair extends defekt({
  code: "InvalidTokenPair",
  defaultMessage: "Invalid token pair",
}) {}

export type AddLiquidityError = NoConnectedSigner | InvalidTokenPair | OnchainError;

export type ApproveError = NoConnectedSigner | OnchainError;

export type RemoveLiquidityError = NoConnectedSigner | InvalidTokenPair | OnchainError;
