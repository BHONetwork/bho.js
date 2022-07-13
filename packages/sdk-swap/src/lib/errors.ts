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

export class InvalidTradingPath extends defekt({
  code: "InvalidTradingPath",
  defaultMessage: "Invalid trading path",
}) {}

export class InvariantError extends defekt({ code: "InvariantError" }) {}

export type QueryContractError = OnchainError;

export type AddLiquidityError = NoConnectedSigner | InvalidTokenPair | OnchainError;

export type ApproveError = NoConnectedSigner | OnchainError;

export type RemoveLiquidityError = NoConnectedSigner | InvalidTokenPair | OnchainError;

export type SwapTokensError = NoConnectedSigner | InvalidTradingPath | OnchainError;

export type GetWBHOError = QueryContractError;

export type GetLiquidityPoolContractError = QueryContractError | InvalidTokenPair;

export type GetAllowanceError = QueryContractError;

export type GetLiquidityPoolReservesError = QueryContractError | InvalidTokenPair;

export type GetBalanceError = QueryContractError;

export type GetAmountInError = InvariantError;

export type GetAmountOutError = InvariantError;

export type GetAddLiquidityInfoError = InvariantError;