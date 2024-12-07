import Button from 'react-bootstrap/Button';
import { ethers, Eip1193Provider, BrowserProvider } from 'ethers';
import { useState } from 'react';
import { useAppSelector } from "../app/hooks";
import { selectProxyAddress } from '../data/contractSlice';
import {
  AddTXProps,
  AddTokenProps,
  DeployProxyProps,
  ErrorModalProps,
  ModifyTokenProps,
  QueryAllTokensProps,
  QueryExistingProxyProps,
  SetMerkleProps,
  SetSettlerProps,
  SetOwnerProps,
  SetVerifierProps,
  SetVerifierImageCommitmentsProps,
  SetWithdrawLimitProps,
  TopUpProps
} from './props';

import { ErrorModal } from "../components/ErrorModal";
import { SetOwner } from '../components/SetOwner';
import { SetMerkle } from '../components/SetMerkle';
import { SetSettler } from '../components/SetSettler';
import { SetWithdrawLimit } from '../components/SetWithdrawLimit';
import { QueryAllTokens } from '../components/QueryAllTokens';
import { AddToken } from '../components/AddToken';
import { TopUp } from '../components/TopUp';
import { SetVerifierImageCommitments } from '../components/SetVerifierImageCommitments';
import { QueryExistingProxy } from '../components/QueryExistingProxy';
import { SetVerifier } from '../components/SetVerifier';
import { AddTX } from '../components/AddTX';
import { ModifyToken } from '../components/ModifyToken';
import { DeployProxy } from '../components/DeployProxy';
import { LoggerProvider } from './logger/LoggerContext';
import { LogViewer } from './logger/LogViewer';
import "../components/style.css";

// extend window interface for ts to recognize ethereum
declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

type ComponentWithProps = {
  Component: React.ComponentType<any>;
  props:
  AddTXProps
  | AddTokenProps
  | DeployProxyProps
  | ErrorModalProps
  | ModifyTokenProps
  | QueryAllTokensProps
  | QueryExistingProxyProps
  | SetMerkleProps
  | SetSettlerProps
  | SetOwnerProps
  | SetVerifierProps
  | SetVerifierImageCommitmentsProps
  | SetWithdrawLimitProps
  | TopUpProps;
};

export function GameController() {
  const [actionEnabled, setActionEnabled] = useState(true);
  const [addTXEnabled, setAddTXEnabled] = useState(true);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null); // Store the connected signer
  const [walletConnected, setWalletConnected] = useState(false); // Track if the wallet is connected
  const [accountAddress, setAccountAddress] = useState<string | null>(null); // Store the connected account address
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const proxyAddress = useAppSelector(selectProxyAddress);

  const handleConnectWallet = async () => {
    if (window.ethereum) {
      try {
        const browserProvider = new BrowserProvider(window.ethereum, "any");
        const signer = await browserProvider.getSigner();
        setSigner(signer);  // Set the signer once
        setWalletConnected(true);  // Mark wallet as connected
        const accountAddress = await signer.getAddress();  // Get the connected account address
        setAccountAddress(accountAddress);  // Store account address
        console.log("Wallet connected:", signer, "Address:", accountAddress);
      } catch (error) {
        handleError("Error connecting wallet:" + error);
      }
    } else {
      handleError("No Ethereum wallet found");
    }
  };

  const handleCloseModal = () => setShowErrorModal(false);

  const handleError = (error: string) => {
    setShowErrorModal(true);
    setModalMessage(error);
  }

  const components: ComponentWithProps[] = [
    { Component: DeployProxy, props: { signer, proxyAddress, actionEnabled, setActionEnabled, setAddTXEnabled, handleError } },
    { Component: AddTX, props: { signer, proxyAddress, addTXEnabled, setAddTXEnabled, handleError } },
    { Component: SetVerifier, props: { signer, proxyAddress, actionEnabled, handleError } },
    { Component: SetVerifierImageCommitments, props: { signer, proxyAddress, actionEnabled, handleError } },
    { Component: AddToken, props: { signer, proxyAddress, actionEnabled, handleError } },
    { Component: ModifyToken, props: { signer, proxyAddress, actionEnabled, handleError } },
    { Component: QueryAllTokens, props: { signer, proxyAddress, actionEnabled, handleError } },
    { Component: TopUp, props: { signer, proxyAddress, actionEnabled, handleError } },
    { Component: SetOwner, props: { signer, proxyAddress, actionEnabled, handleError } },
    { Component: SetMerkle, props: { signer, proxyAddress, actionEnabled, handleError } },
    { Component: SetSettler, props: { signer, proxyAddress, actionEnabled, handleError } },
    { Component: SetWithdrawLimit, props: { signer, proxyAddress, actionEnabled, handleError } },
    { Component: QueryExistingProxy, props: { signer, handleError } }
  ];

  return (
    <>
      {!walletConnected ? (
        <Button className="connectWallet" variant="primary" onClick={handleConnectWallet}>
          CONNECT WALLET
        </Button>
      ) : (
        <>
          <p>Connected Wallet: {accountAddress}</p> {/* Display the connected account address */}
          {components.map(({ Component, props }, index) => (
            <LoggerProvider key={index}>
              <div className="steps">
                <Component {...props} />
                <LogViewer />
              </div>
            </LoggerProvider>
          ))}
        </>
      )}
      <ErrorModal
        show={showErrorModal}
        message={modalMessage}
        onClose={handleCloseModal}
      />
    </>
  )
}