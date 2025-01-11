import React, { useState } from "react";
import { Alert, Modal, Button, InputGroup, Form, Spinner } from "react-bootstrap";
import { useLogger } from '../main/logger/LoggerContext';
import { formatErrorMessage } from "../main/utils";
import { ethers } from 'ethers';
import { SetSettlerModalProps } from "../main/props";

export const SetSettlerModal: React.FC<SetSettlerModalProps> = ({
  show,
  onClose,
  currentProxy,
  queryProxyInfo,
  chainId
}) => {
  const { addLog } = useLogger();
  const [newSettler, setNewSettler] = useState('');
  const [isSettingSettler, setIsSettingSettler] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const onConfirm = async () => {
    try {
      setErrorMessage("");
      if (!newSettler) {
        throw new Error("Settler address is missing");
      }

      setIsSettingSettler(true);

      // Validate new settler address
      const cleanedNewSettler = newSettler.trim();
      if (!ethers.isAddress(cleanedNewSettler)) {
        throw new Error("Invalid address. Please enter a valid Ethereum address.");
      }

      addLog("info", `Please sign the transaction in your wallet. This signature is required to authorize the execution of the contract function.`);
      const tx = await currentProxy.setSettler(newSettler);
      addLog("info", "Transaction sent")
      addLog("txhash", tx.hash, chainId);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      addLog("info", "Transaction confirmed. Gas used: " + receipt.gasUsed.toString());
      const statusRes = receipt.status === 1 ? "Success" : "Failure";
      addLog("info", "Transaction Receipt Status: " + statusRes);

      // Query current settler
      const settlerAfterSet = await currentProxy.getSettler();
      addLog("contractAddr", "Settler address after set: " + settlerAfterSet.owner);

      addLog("success", "Settler changed successfully!");
      addLog("info", "Start updating latest Proxy info...");
      await queryProxyInfo();
      setNewSettler("");
      setIsSettingSettler(false);
      onClose();
    } catch (error) {
      const err = formatErrorMessage(error);
      addLog("error", `Error changing settler: ${err}`);
      setErrorMessage(`Error changing settler: ${err}`);
    } finally {
      setIsSettingSettler(false);
    }
  }

  const closeModal = () => {
    setNewSettler("");
    setErrorMessage("");
    onClose();
  }

  return (
    <Modal show={show} backdrop="static" onHide={closeModal}>
      <Modal.Header closeButton>
        <Modal.Title>Set Settler</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
        <InputGroup className="mb-3">
          <Form.Control
            type="text"
            placeholder="Enter a valid 40-character ethereum address (e.g., 0x12...)"
            value={newSettler}
            onChange={(e) => setNewSettler(e.target.value)}
            required
          />
        </InputGroup>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={closeModal}>
          Close
        </Button>
        <Button variant="primary" onClick={onConfirm} disabled={isSettingSettler}>
          {isSettingSettler ? <Spinner animation="border" size="sm" /> : "Confirm"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};