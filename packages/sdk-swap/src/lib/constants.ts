import BN from "bn.js";

export const MAX_U64 = new BN(2).pow(new BN(64)).subn(1);
