import BN from "bn.js";

export const MAX_U64 = new BN(2).pow(new BN(64)).subn(1);
export const MAX_U128 = new BN(2).pow(new BN(128)).subn(1);
