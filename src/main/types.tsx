export interface Token {
  token_uid: bigint;
}

export interface ProxyContent {
  proxyAddress: string;
  chainName: string;
  withdrawLimit: string;
  chain_id: bigint;
  amount_token: bigint;
  owner: bigint;
  merkle_root: bigint;
  rid: bigint;
  verifier: bigint;
  transactions: string[];
  settler: bigint;
  zk_image_commitments: string[];
}

export type LogType = "success" | "error" | "info" | "contractAddr" | "txhash";

export interface Log {
  time: string;
  type: LogType;
  message: string;
  chainId?: string;
}