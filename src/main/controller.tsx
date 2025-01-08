import React, { useEffect } from "react";
import { ethers, Eip1193Provider, BrowserProvider } from 'ethers';
import { useState } from 'react';
import { Button, Row, Col, Card, Alert, Tab } from "react-bootstrap";
import { useAppSelector, useAppDispatch } from "../app/hooks";
import { selectProxyAddress, selectWithdrawAddress, selectDummyVerifierAddress, fetchChains } from '../data/contractSlice';
import { QueryExistingProxy } from '../components/QueryExistingProxy';
import { DeployContract } from '../components/DeployContract';
import { ErrorModal } from '../modals/ErrorModal';
import "../components/style.css";
import { formatErrorMessage } from '../main/utils';
import { LogViewer } from '../main/logger/LogViewer';
import { useLogger } from '../main/logger/LoggerContext';

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
  const [activeTab, setActiveTab] = useState<"start" | "existing" | null>(null); // Tracks active panel
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const proxyAddress = useAppSelector(selectProxyAddress);
  const withdrawAddress = useAppSelector(selectWithdrawAddress);
  const verifierAddress = useAppSelector(selectDummyVerifierAddress);
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

          <div className="container">
            {/* Global Decision Section */}
            {!activeTab && (
              <Card className="mb-4" border="light">
                <Card.Header as="h5">Choose an Option</Card.Header>
                <Card.Body>
                  <p>Would you like to start from scratch or use an existing contract?</p>
                  <div className="d-flex gap-2">
                    <Button variant="primary" onClick={() => setActiveTab("start")}>
                      Start from Scratch
                    </Button>
                    <Button variant="primary" onClick={() => setActiveTab("existing")}>
                      Using Existing Contract Address
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Main Panels */}
            {activeTab && (
              <Tab.Container activeKey={activeTab} onSelect={(tab) => setActiveTab(tab as "start" | "existing")}>
                <Tab.Content>
                  {/* Start from Scratch Panel */}
                  <Tab.Pane eventKey="start">
                    <Card border="light">
                      <Card.Header as="h5">Start from Scratch</Card.Header>
                      <Card.Body>
                        <Button variant="secondary" className="ms-2 right-button" onClick={() => setActiveTab(null)}>
                          Back to Options
                        </Button>
                          <div className="steps">
                            <DeployContract
                              signer={signer}
                              proxyAddress={proxyAddress}
                              withdrawAddress={withdrawAddress}
                              verifierAddress={verifierAddress}
                              setActiveTab={setActiveTab}
                              addLog={addLog}
                            / >
                          </div>
                      </Card.Body>
                    </Card>
                  </Tab.Pane>

                  {/* Enter Contract Address Panel */}
                  <Tab.Pane eventKey="existing">
                    <Card border="light">
                      <Card.Header as="h5">Using Existing Contract Address</Card.Header>
                      <Card.Body>
                        <Button variant="secondary" className="ms-2 right-button" onClick={() => setActiveTab(null)}>
                          Back to Options
                        </Button>
                          <div className="steps">
                            <QueryExistingProxy
                              signer={signer}
                              proxyAddress={proxyAddress}
                              withdrawAddress={withdrawAddress}
                              verifierAddress={verifierAddress}
                              setActiveTab={setActiveTab}
                              addLog={addLog}
                            />
                          </div>
                      </Card.Body>
                    </Card>
                  </Tab.Pane>
                </Tab.Content>
              </Tab.Container>
            )}
          </div>
        </Col>
        <Col xs={3}>
            <LogViewer />
        </Col>
      </Row>
  )
}