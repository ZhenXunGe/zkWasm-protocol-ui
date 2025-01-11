import React, { useEffect } from "react";
import { ethers, Eip1193Provider, BrowserProvider } from 'ethers';
import { useState } from 'react';
import { Button, Row, Col, Alert } from "react-bootstrap";
import { useAppDispatch } from "../app/hooks";
import { fetchChains } from '../data/contractSlice';
import { QueryExistingProxy } from '../components/QueryExistingProxy';
import { ErrorModal } from '../modals/ErrorModal';
import { formatErrorMessage } from '../main/utils';
import { LogViewer } from '../main/logger/LogViewer';
import { useLogger } from '../main/logger/LoggerContext';
import "../components/style.css";

// extend window interface for ts to recognize ethereum
declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export function GameController() {
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null); // Store the connected signer
  const [walletConnected, setWalletConnected] = useState(false); // Track if the wallet is connected
  const [accountAddress, setAccountAddress] = useState<string | null>(null); // Store the connected account address
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const dispatch = useAppDispatch();
  const { addLog } = useLogger();

  useEffect(() => {
    const fetchData = async () => {
      dispatch(fetchChains());
    };
    fetchData();
  }, [dispatch]);

  const handleConnectWallet = async () => {
    if (isConnecting) return;
    setIsConnecting(true);

    if (window.ethereum) {
      try {
        const browserProvider = new BrowserProvider(window.ethereum, "any");
        const signer = await browserProvider.getSigner();
        setSigner(signer);  // Set the signer once
        setWalletConnected(true);  // Mark wallet as connected
        const accountAddress = await signer.getAddress();  // Get the connected account address
        setAccountAddress(accountAddress);  // Store account address
      } catch (error: any) {
        if (error.code === -32002) {
          alert("Please check your wallet extension for a pending connection request.");
          setErrorMessage(`Please check your wallet extension for a pending connection request.`);
        } else {
          const err = formatErrorMessage(error);
          setErrorMessage(`Error connecting wallet: ${err}`);
        }
        setShowErrorModal(true);
      }
    } else {
      setErrorMessage("No Ethereum wallet found");
      setShowErrorModal(true);
    }
  };

  return (
      <Row>
        <Col xs={9}>
          {!walletConnected ? (
            <Alert variant="warning">
              You need to connect your wallet to use this feature！
              <Button
                variant="outline-primary"
                onClick={handleConnectWallet}
                disabled={isConnecting}
                className="ml-2"
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            </Alert>
          ) : (
            <p>Wallet Address: {accountAddress}</p>
          )}
          <ErrorModal
            show={showErrorModal}
            onClose={() => setShowErrorModal(false)}
            title="Error"
            message={errorMessage}
          />
          <QueryExistingProxy
            signer={signer}
            addLog={addLog}
          />
        </Col>
        <Col xs={3}>
            <LogViewer />
        </Col>
      </Row>
  )
}