import React, { useState } from "react";
import { Alert, Modal, Button, InputGroup, Form, Spinner } from "react-bootstrap";
import { useLogger } from '../main/logger/LoggerContext';
import {
  deployContract,
  formatAddress,
  validateHexString,
  formatErrorMessage,
} from "../main/utils";
import { AddTXProps } from "../main/props";
import { addWithdrawAddress, selectWithdrawAddressHistory } from '../data/contractSlice';
import { useAppSelector, useAppDispatch } from "../app/hooks";
import { ethers } from 'ethers';
import withdrawArtifact from "zkWasm-protocol/artifacts/contracts/actions/Withdraw.sol/Withdraw.json";

export const AddTXModal = ({
  show,
  onClose,
  currentProxy,
  queryProxyInfo,
  chainId,
  signer
}: AddTXProps) => {
  const { addLog } = useLogger();
  const [isAddingTX, setIsAddingTX] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [mode, setMode] = useState<"history" | "deploy">("history");
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [deployedWithdrawAddress, setDeployedWithdrawAddress] = useState('');
  const withdrawAddressHistory = useAppSelector(selectWithdrawAddressHistory);
  const dispatch = useAppDispatch();

  const DeployWithdraw = ({
    onDeploySuccess
  }: { onDeploySuccess: (address: string) => void }) => {
    const handleDeploy = async () => {
      try {
        setErrorMessage("");
        setIsDeploying(true);
        setIsAddingTX(true);
        addLog("info", `Starting deployment of Withdraw Contract. Plesae wait...`, `${chainId}`);
        const contractAddress = await deployContract(
          "Withdraw",
          withdrawArtifact,
          [],
          chainId.toString(),
          addLog,
          signer
        );
        setDeployedWithdrawAddress(contractAddress);
        onDeploySuccess(contractAddress);
        dispatch(addWithdrawAddress(contractAddress));
        setIsDeploying(false);
        setIsAddingTX(false);
      } catch (error: any) {
        const err = formatErrorMessage(error);
        addLog("error", `Error deploying contracts: ${err}.`, "");
        setErrorMessage(`Error deploying contracts: ${err}.`);
      } finally {
        setIsDeploying(false);
        setIsAddingTX(false);
      }
    };

    return (
      <div>
        <Button variant="primary" onClick={handleDeploy} disabled={isDeploying}>
          {isDeploying ? <Spinner animation="border" size="sm" /> : 'Deploy Withdraw Contract'}
        </Button>
      </div>
    );
  };

  const onConfirm = async () => {
    try {
      setErrorMessage("");
      if (!withdrawAddress) {
        setErrorMessage('Please provide a Withdraw Address.');
        return;
      }

      setIsAddingTX(true);

      // Validate Withdraw address
      validateHexString(withdrawAddress, 40);
      const formattedWihdrawAddress = formatAddress(withdrawAddress);
      const validWithdrawAddress = ethers.getAddress(formattedWihdrawAddress);
      addLog("contractAddr", "Valid Withdraw address: " + validWithdrawAddress);

      // Excute Proxy contract's addTransaction
      addLog("info", `Please sign the transaction in your wallet. This signature is required to authorize the execution of the contract function.`);
      const tx = await currentProxy!.addTransaction(validWithdrawAddress, true);
      addLog("info", "Transaction sent")
      addLog("txhash", tx.hash, chainId);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      addLog("info", "Transaction confirmed. Gas used: " + receipt.gasUsed.toString());
      const statusRes = receipt.status === 1 ? "Success" : "Failure";
      addLog("info", "Transaction Receipt Status: " + statusRes);

      // Qeury transaction address
      const address = await currentProxy!._get_transaction(0n); //opcode of withdraw is 0x0
      addLog("contractAddr", "Current transaction address: " + address);

      addLog("success", "Transaction added successfully!");
      addLog("info", "Start updating latest Proxy info...");
      await queryProxyInfo();
      setIsAddingTX(false);
      setDeployedWithdrawAddress("");
      onClose();
    } catch (error) {
      const err = formatErrorMessage(error);
      addLog("error", `Error Adding Transaction: ${err}`);
      setErrorMessage(`Error Adding Transaction: ${err}`);
    } finally {
      setIsAddingTX(false);
    }
  }

  const closeModal = () => {
    setErrorMessage("");
    setDeployedWithdrawAddress("");
    onClose();
  }

  return (
    <Modal show={show} size="lg" onHide={closeModal} backdrop="static" style={{ zIndex: 1051 }}>
      <Modal.Header closeButton>
        <Modal.Title>Add Transaction</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
        <Form.Check
          type="radio"
          label="Use Existing Withdraw Address"
          name="txMode"
          checked={mode === "history"}
          onChange={() => setMode("history")}
        />
        <Form.Check
          type="radio"
          label="Deploy New Withdraw Contract"
          name="txMode"
          checked={mode === "deploy"}
          onChange={() => setMode("deploy")}
          className="mb-2"
        />
        {mode === 'history' && (
        <>
          <InputGroup className="mb-1">
            <InputGroup.Text>Withdraw Address</InputGroup.Text>
            <Form.Control
              as="input"
              list="withdraw-history-options"
              placeholder="Enter or select a valid 40-character Withdraw address (e.g., 0x12...)"
              value={withdrawAddress}
              onChange={(e) => setWithdrawAddress(e.target.value)}
              title="You can manually enter a 40-character Verifier address or select one from the dropdown options."
            />
            <datalist id="withdraw-history-options">
              {withdrawAddressHistory.map((address, index) => (
                <option key={index} value={address} />
              ))}
            </datalist>
          </InputGroup>
          <Form.Text className="text-muted">
            You can manually enter a 40-character Withdraw address or select one from the dropdown options, which include contracts you deployed during this session of using the app.
            This session refers to the time you have this UI open.
          </Form.Text>
        </>
        )}
        {mode === 'deploy' && (
          <>
            <DeployWithdraw onDeploySuccess={setWithdrawAddress} />
            {deployedWithdrawAddress && (
              <div className="mt-3">
                <Alert variant="success">
                  <strong>Latest Deployed Withdraw Address:</strong>
                  <code>{deployedWithdrawAddress}</code>
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
        <Button variant="primary" onClick={onConfirm} disabled={isAddingTX}>
          {isAddingTX ? <Spinner animation="border" size="sm" /> : "Confirm"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};