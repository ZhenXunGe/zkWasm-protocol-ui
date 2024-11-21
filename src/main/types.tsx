export interface TopUpEvent {
  name: string;
  token: string;
  account: string;
  pid1: string;
  pid2: string;
  amount: string;
}

export interface WithDrawEvent {
  name: string;
  l1token: string;
  l1account: string;
  amount: string;
}

export interface SettledEvent {
  name: string;
  sender: string;
  merkle_root: string;
  new_merkle_root: string;
  rid: string;
  sideEffectCalled: string;
}

export type EventType = TopUpEvent | WithDrawEvent | SettledEvent;

export interface ProxyInfo {
  chain_id: bigint,
  amount_token: bigint,
  amount_pool: bigint,
  owner: string,
  merkle_root: bigint,
  rid: bigint,
  verifier: bigint
}

export interface Token {
  token_uid: bigint;
}