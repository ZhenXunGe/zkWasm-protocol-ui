import React, { useState } from "react";
import { Alert, Modal, Button, InputGroup, Form, Spinner } from "react-bootstrap";
import { useLogger } from '../main/logger/LoggerContext';
import { formatErrorMessage } from "../main/utils";
import { ethers } from 'ethers';
import { SetOwnerModalProps } from "../main/props";

export const SetOwnerModal: React.FC<SetOwnerModalProps> = ({
  show,
  onClose,
  currentProxy,
  queryProxyInfo,
  chainId
}) => {
  const { addLog } = useLogger();
  const [newOwner, setNewOwner] = useState('');
  const [isSettingNewOwner, setIsSettingNewOwner] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const onConfirm = async () => {
    try {
      setErrorMessage("");
      if (!newOwner) {
        throw new Error("Owner address is missing");
      }

      // Validate new owner address
      const cleanedNewOwner = newOwner.trim();
      if (!ethers.isAddress(cleanedNewOwner)) {
        throw new Error("Invalid address. Please enter a valid Ethereum address.");
      }

      setIsSettingNewOwner(true);
      setErrorMessage("");

      // Query current owner
      const infoBeforeSet = await currentProxy.getProxyInfo();
      addLog("contractAddr", "Owner address before set: " + infoBeforeSet.owner);

      const tx = await currentProxy.setOwner(newOwner);
      addLog("info", "Transaction sent");
      addLog("txhash", tx.hash, chainId);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      addLog("info", "Transaction confirmed. Gas used: " + receipt.gasUsed.toString());
      const statusRes = receipt.status === 1 ? "Success" : "Failure";
      addLog("info", "Status: " + statusRes);

      // Query current owner
      const infoAfterSet = await currentProxy.getProxyInfo();
      addLog("contractAddr", "Owner address after set: " + infoAfterSet.owner);

      addLog("success", "Owner changed successfully!");
      await queryProxyInfo();
      setIsSettingNewOwner(false);
      onClose();
    } catch (error) {
      const err = formatErrorMessage(error);
      addLog("error", `Error changing owner: ${err}`);
      setErrorMessage(`Error changing owner: ${err}`);
    } finally {
      setIsSettingNewOwner(false);
    }
  }

  const closeModal = () => {
    setNewOwner("");
    setErrorMessage("");
    onClose();
  }

  return (
    <Modal show={show} onHide={closeModal}>
      <Modal.Header closeButton>
        <Modal.Title>Set Owner Address</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
        <InputGroup className="mb-3">
          <Form.Control
            type="text"
            placeholder="Enter a valid 40-character ethereum address (e.g., 0x12...)"
            value={newOwner}
            onChange={(e) => setNewOwner(e.target.value)}
            required
          />
        </InputGroup>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={closeModal}>
          Close
        </Button>
        <Button variant="primary" onClick={onConfirm} disabled={isSettingNewOwner}>
          {isSettingNewOwner ? <Spinner animation="border" size="sm" /> : "Confirm"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};