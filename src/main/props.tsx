import { ethers } from 'ethers';
import { Log, LogType } from './types';

export interface AddTXProps {
  signer: ethers.JsonRpcSigner | null;
  proxyAddress: string | null;
  withdrawAddress: string | null;
}

export interface AddTokenProps {
  show: boolean;
  onClose: () => void;
  currentProxy: ethers.Contract;
  queryProxyInfo: () => Promise<void>;
  chainId: string;
}

export interface DeployContractProps {
  signer: ethers.JsonRpcSigner | null;
  proxyAddress: string | null;
  withdrawAddress: string | null;
  verifierAddress: string | null;
  setActiveTab: React.Dispatch<React.SetStateAction<"existing" | "start" | null>>;
  addLog: (type: LogType, message: string, chainId?: string) => void;
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
  proxyAddress: string | null;
  withdrawAddress: string | null;
  verifierAddress: string | null;
  setActiveTab: React.Dispatch<React.SetStateAction<"existing" | "start" | null>>;
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
  queryProxyInfo: () => Promise<void>;
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

export interface TokenListModalProps {
  show: boolean;
  onClose: () => void;
  currentProxy: ethers.Contract;
  tokenList: string[];
  proxyAddress: string | null;
  signer: ethers.Signer | null;
  queryProxyInfo: () => Promise<void>;
  chainId: string;
}