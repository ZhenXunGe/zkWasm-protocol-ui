import { ethers } from 'ethers';

export interface AddTXProps {
  signer: ethers.JsonRpcSigner | null;
  proxyAddress: string | null;
  addTXEnabled: boolean;
  setAddTXEnabled:  React.Dispatch<React.SetStateAction<boolean>>;
  handleError: (error: string) => void;
}

export interface AddTokenProps {
  signer: ethers.JsonRpcSigner | null;
  proxyAddress: string | null,
  actionEnabled: boolean;
  handleError: (error: string) => void;
}

export interface DeployProxyProps {
  signer: ethers.JsonRpcSigner | null;
  proxyAddress: string | null;
  actionEnabled: boolean;
  setActionEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setAddTXEnabled:  React.Dispatch<React.SetStateAction<boolean>>;
  handleError: (error: string) => void;
}

export interface ErrorModalProps {
  show: boolean;
  message: string;
  onClose: () => void;
}

export interface ModifyTokenProps {
  signer: ethers.JsonRpcSigner | null;
  proxyAddress: string | null,
  actionEnabled: boolean;
  handleError: (error: string) => void;
}

export interface QueryAllTokensProps {
  signer: ethers.JsonRpcSigner | null;
  proxyAddress: string | null,
  actionEnabled: boolean;
  handleError: (error: string) => void;
}

export interface QueryExistingProxyProps {
  signer: ethers.JsonRpcSigner | null;
  handleError: (error: string) => void;
}

export interface SetMerkleProps {
  signer: ethers.JsonRpcSigner | null;
  proxyAddress: string | null,
  actionEnabled: boolean;
  handleError: (error: string) => void;
}

export interface SetSettlerProps {
  signer: ethers.JsonRpcSigner | null;
  proxyAddress: string | null,
  actionEnabled: boolean;
  handleError: (error: string) => void;
}

export interface SetOwnerProps {
  signer: ethers.JsonRpcSigner | null;
  proxyAddress: string | null,
  actionEnabled: boolean;
  handleError: (error: string) => void;
}

export interface SetVerifierProps {
  signer: ethers.JsonRpcSigner | null;
  proxyAddress: string | null;
  actionEnabled: boolean;
  handleError: (error: string) => void;
}

export interface SetVerifierImageCommitmentsProps {
  signer: ethers.JsonRpcSigner | null;
  proxyAddress: string | null,
  actionEnabled: boolean;
  handleError: (error: string) => void;
}

export interface SetWithdrawLimitProps {
  signer: ethers.JsonRpcSigner | null;
  proxyAddress: string | null,
  actionEnabled: boolean;
  handleError: (error: string) => void;
}

export interface TopUpProps {
  signer: ethers.JsonRpcSigner | null;
  proxyAddress: string | null;
  actionEnabled: boolean;
  handleError: (error: string) => void;
}