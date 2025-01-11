import React, { useState } from "react";
import { Alert, Modal, Button, InputGroup, Form, Spinner } from "react-bootstrap";
import { useLogger } from '../main/logger/LoggerContext';
import {
  deployContract,
  formatAddress,
  validateHexString,
  formatErrorMessage,
} from "../main/utils";
import { SetVerifierProps } from "../main/props";
import { addDummyVerifierAddress, selectDMVerifierAddressHistory } from '../data/contractSlice';
import { useAppSelector, useAppDispatch } from "../app/hooks";
import { ethers } from 'ethers';

import dummyVerifierArtifact from "zkWasm-protocol/artifacts/contracts/DummyVerifier.sol/DummyVerifier.json";

export const SetVerifierModal = ({
  show,
  onClose,
  currentProxy,
  queryProxyInfo,
  chainId,
  signer
}: SetVerifierProps) => {
  const { addLog } = useLogger();
  const [isSettingVerifier, setIsSettingVerifier] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [mode, setMode] = useState<"history" | "deploy">("history");
  const [verifierAddress, setVerifierAddress] = useState('');
  const [deployedVerifierAddress, setDeployedVerifierAddress] = useState('');
  const dmVerifierAddressHistory = useAppSelector(selectDMVerifierAddressHistory);
  const dispatch = useAppDispatch();

  const DeployVerifier = ({
    onDeploySuccess
  }: { onDeploySuccess: (address: string) => void }) => {
    const handleDeploy = async () => {
      try {
        setIsDeploying(true);
        setIsSettingVerifier(true);
        addLog("info", `Starting deployment of Verifier Contract. Plesae wait...`, `${chainId}`);
        const contractAddress = await deployContract(
          "Verifier",
          dummyVerifierArtifact,
          [],
          chainId.toString(),
          addLog,
          signer
        );
        setDeployedVerifierAddress(contractAddress);
        onDeploySuccess(contractAddress);
        dispatch(addDummyVerifierAddress(contractAddress));
        setIsDeploying(false);
        setIsSettingVerifier(false);
      } catch (error: any) {
        const err = formatErrorMessage(error);
        addLog("error", `Error deploying contracts: ${err}.`, "");
        setErrorMessage(`Error deploying contracts: ${err}.`);
      } finally {
        setIsDeploying(false);
        setIsSettingVerifier(false);
      }
    };

    return (
      <div>
        <Button variant="primary" onClick={handleDeploy} disabled={isDeploying}>
          {isDeploying ? <Spinner animation="border" size="sm" /> : 'Deploy Verifier Contract'}
        </Button>
      </div>
    );
  };

  const onConfirm = async () => {
    try {
      setErrorMessage("");
      if (!verifierAddress) {
        setErrorMessage('Please provide a Verifier Address.');
        return;
      }

      setIsSettingVerifier(true);

      // Validate Verifier address
      validateHexString(verifierAddress, 40);
      const formattedVerifierAddress = formatAddress(verifierAddress);
      const validVerifierAddress = ethers.getAddress(formattedVerifierAddress);
      addLog("contractAddr", "Valid Verifier address: " + validVerifierAddress);

      addLog("info", `Please sign the  in your wallet. This signature is required to authorize the execution of the contract function.`);
      const tx = await currentProxy!.setVerifier(validVerifierAddress);
      addLog("info", "Transaction sent")
      addLog("txhash", tx.hash, chainId);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      addLog("info", "Transaction confirmed. Gas used: " + receipt.gasUsed.toString());
      const statusRes = receipt.status === 1 ? "Success" : "Failure";
      addLog("info", "Transaction Receipt Status: " + statusRes);

      // Qeury verifier address
      const address = await currentProxy!.verifier();
      addLog("contractAddr", "Current Verifier address: " + address);

      addLog("success", "Verifier set successfully!");
      addLog("info", "Start updating latest Proxy info...");
      await queryProxyInfo();
      setVerifierAddress("");
      setIsSettingVerifier(false);
      setDeployedVerifierAddress("");
      onClose();
    } catch (error) {
      const err = formatErrorMessage(error);
      addLog("error", `Error setting Verifier: ${err}`);
      setErrorMessage(`Error setting Verifier: ${err}`);
    } finally {
      setIsSettingVerifier(false);
    }
  }

  const closeModal = () => {
    setVerifierAddress("");
    setErrorMessage("");
    setDeployedVerifierAddress("");
    onClose();
  }

  return (
    <Modal show={show} size="lg" onHide={closeModal} backdrop="static" style={{ zIndex: 1051 }}>
      <Modal.Header closeButton>
        <Modal.Title>Set Verifier</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
        <Form.Check
          type="radio"
          label="Use Existing Verifier Address"
          name="verifierMode"
          checked={mode === "history"}
          onChange={() => setMode("history")}
        />
        <Form.Check
          type="radio"
          label="Deploy New Verifier Contract"
          name="verifierMode"
          checked={mode === "deploy"}
          onChange={() => setMode("deploy")}
          className="mb-2"
        />
        {mode === 'history' && (
          <>
          <InputGroup className="mb-1">
            <InputGroup.Text>Verifier Address</InputGroup.Text>
            <Form.Control
              as="input"
              list="verifier-history-options"
              placeholder="Enter or select a valid 40-character Verifier address (e.g., 0x12...)"
              value={verifierAddress}
              onChange={(e) => setVerifierAddress(e.target.value)}
              title="You can manually enter a 40-character Verifier address or select one from the dropdown options."
            />
            <datalist id="verifier-history-options">
              {dmVerifierAddressHistory.map((address, index) => (
                <option key={index} value={address} />
              ))}
            </datalist>
          </InputGroup>
          <Form.Text className="text-muted">
            You can manually enter a 40-character Verifier address or select one from the dropdown options, which include contracts you deployed during this session of using the app.
            This session refers to the time you have this UI open.
          </Form.Text>
          </>
        )}
        {mode === 'deploy' && (
          <>
            <DeployVerifier onDeploySuccess={setVerifierAddress} />
            {deployedVerifierAddress && (
              <div className="mt-3">
                <Alert variant="success">
                  <strong>Latest Deployed Verifier Address:</strong>
                  <code>{deployedVerifierAddress}</code>
                </Alert>
              </div>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={closeModal}>
          Close
        </Button>
        <Button variant="primary" onClick={onConfirm} disabled={isSettingVerifier}>
          {isSettingVerifier ? <Spinner animation="border" size="sm" /> : "Confirm"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};