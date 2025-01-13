import React, { useState } from "react";
import { Alert, Modal, Button, InputGroup, Form, Spinner } from "react-bootstrap";
import { removeHexPrefix } from "../main/utils";
import { useLogger } from '../main/logger/LoggerContext';
import { formatErrorMessage, validateHexString } from "../main/utils";
import { SetMerkleModalProps } from "../main/props";

export const SetMerkleModal: React.FC<SetMerkleModalProps> = ({
  show,
  onClose,
  currentProxy,
  queryProxyInfo,
  chainId
}) => {
  const { addLog } = useLogger();
  const [newRoot, setNewRoot] = useState('');
  const [isSettingMerkle, setIsSettingMerkle] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const onConfirm = async () => {
    try {
      setErrorMessage("");
      if (!newRoot) {
        throw new Error("New root is missing");
      }

      setIsSettingMerkle(true);
      setErrorMessage("");

      validateHexString(newRoot);

      const merkleBeforeSet = await currentProxy.merkle_root()
      addLog("info", "merkle root before set merkle: 0x" + merkleBeforeSet.toString(16));

      // If newRoot starts with "0x", remove "0x"
      const cleanedNewRoot = newRoot.trim();
      const rootNoPrefix = removeHexPrefix(cleanedNewRoot);

      // Convert hex string to BigInt
      const rootBigInt = BigInt("0x" + rootNoPrefix);

      addLog("info", `Please sign the transaction in your wallet. This signature is required to authorize the execution of the contract function.`);
      const tx = await currentProxy.setMerkle(rootBigInt);
      addLog("info", "Transaction sent.");
      addLog("txhash", tx.hash, chainId);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      addLog("info", "Transaction confirmed. Gas used: " + receipt.gasUsed.toString());
      const statusRes = receipt.status === 1 ? "Success" : "Failure";
      addLog("info", "Transaction Receipt Status: " + statusRes);

      // Query current merkle root
      const proxyInfo = await currentProxy.getProxyInfo();
      addLog("info", "merkle root after set merkle: 0x" + proxyInfo.merkle_root.toString(16));

      addLog("success", "Root changed successfully!");
      addLog("info", "Start updating latest Proxy info...");
      await queryProxyInfo();
      setNewRoot("");
      setIsSettingMerkle(false);
      onClose();
    } catch (error) {
      const err = formatErrorMessage(error);
      addLog("error", `Error changing root: ${err}`);
      setErrorMessage(`Error changing root: ${err}`);
    } finally {
      setIsSettingMerkle(false);
    }
  }

  const closeModal = () => {
    setNewRoot("");
    setErrorMessage("");
    onClose();
  }

  return (
    <Modal show={show} backdrop="static" onHide={closeModal}>
      <Modal.Header closeButton>
        <Modal.Title>Set Merkle Root</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
        <InputGroup className="mb-3">
          <Form.Control
            type="text"
            placeholder="Enter new root as uint256 hexadecimal (e.g., 0x12...)"
            value={newRoot}
            onChange={(e) => setNewRoot(e.target.value)}
            required
          />
        </InputGroup>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={closeModal}>
          Close
        </Button>
        <Button variant="primary" onClick={onConfirm} disabled={isSettingMerkle}>
          {isSettingMerkle ? <Spinner animation="border" size="sm" /> : "Confirm"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};