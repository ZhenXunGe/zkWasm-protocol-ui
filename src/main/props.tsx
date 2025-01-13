import { ethers } from 'ethers';
import { Log, LogType } from './types';

export interface AddTXProps {
  show: boolean;
  onClose: () => void;
  currentProxy: ethers.Contract;
  queryProxyInfo: () => Promise<void>;
  chainId: string;
  signer: ethers.JsonRpcSigner | null;
}

export interface AddTokenProps {
  show: boolean;
  onClose: () => void;
  currentProxy: ethers.Contract;
  queryProxyInfo: () => Promise<void>;
  chainId: string;
}

export interface ErrorModalProps {
  show: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

export interface ModifyTokenProps {
  show: boolean;
  onClose: () => void;
  currentProxy: ethers.Contract;
  queryProxyInfo: () => Promise<void>;
  chainId: string;
  tokenIndex: number | null;
}

export interface QueryAllTokensProps {
  signer: ethers.JsonRpcSigner | null;
  proxyAddress: string | null;
  actionEnabled: boolean;
}

export interface QueryExistingProxyProps {
  signer: ethers.JsonRpcSigner | null;
  addLog: (type: LogType, message: string, chainId?: string) => void;
}

export interface SetMerkleModalProps {
  show: boolean;
  onClose: () => void;
  currentProxy: ethers.Contract;
  queryProxyInfo: () => Promise<void>;
  chainId: string;
}

export interface SetSettlerModalProps {
  show: boolean;
  onClose: () => void;
  currentProxy: ethers.Contract;
  queryProxyInfo: () => Promise<void>;
  chainId: string
}

export interface SetOwnerModalProps {
  show: boolean;
  onClose: () => void;
  currentProxy: ethers.Contract;
  queryProxyInfo: () => Promise<void>;
  chainId: string;
}

export interface SetVerifierImgCommitModalProps {
  show: boolean;
  onClose: () => void;
  currentProxy: ethers.Contract;
  queryProxyInfo: () => Promise<void>;
  chainId: string;
}

export interface TopUpProps {
  show: boolean;
  onClose: () => void;
  currentProxy: ethers.Contract;
  proxyAddress: string | null;
  signer: ethers.Signer | null;
  chainId: string;
  tokenIndex: number | null;
}

export interface LoggerContextProps {
  logs: Log[];
  addLog: (type: LogType, message: string, chainId?: string) => void;
  clearLogs: () => void;
}

export interface SetWithdrawLimitProps {
  show: boolean;
  onClose: () => void;
  currentProxy: ethers.Contract;
  queryProxyInfo: () => Promise<void>;
  chainId: string;
}

export interface TokenListProps {
  show: boolean;
  onClose: () => void;
  currentProxy: ethers.Contract;
  tokenList: string[];
  proxyAddress: string | null;
  queryProxyInfo: () => Promise<void>;
  chainId: string;
  signer:  ethers.JsonRpcSigner | null;
}

export interface SetVerifierProps {
  show: boolean;
  onClose: () => void;
  currentProxy: ethers.Contract;
  queryProxyInfo: () => Promise<void>;
  chainId: string;
  signer:  ethers.JsonRpcSigner | null;
}