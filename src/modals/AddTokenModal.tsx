import React, { useState } from "react";
import { Alert, Modal, Button, InputGroup, Form, Spinner } from "react-bootstrap";
import { useLogger } from '../main/logger/LoggerContext';
import { formatAddress, validateHexString, formatErrorMessage } from "../main/utils";
import { ethers } from 'ethers';
import { AddTokenProps } from "../main/props";

export const AddTokenModal: React.FC<AddTokenProps> = ({
  show,
  onClose,
  currentProxy,
  queryProxyInfo,
  chainId
}) => {
  const { addLog } = useLogger();
  const [tokenAddress, setTokenAddress] = useState('');
  const [isAddingToken, setIsAddingToken] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const onConfirm = async () => {
    try {
      setErrorMessage("");
      if (!tokenAddress) {
        throw new Error("Token address is missing");
      }

      setIsAddingToken(true);

      // Validate token address
      const cleanedTokenAddress = tokenAddress.trim();
      validateHexString(cleanedTokenAddress, 40);
      const formattedAddress = formatAddress(cleanedTokenAddress);
      const validTokenAddress = ethers.getAddress(formattedAddress);
      addLog("contractAddr", "Valid token address: " + validTokenAddress);

      // Call the _l1_address function with the valid token address
      const l1token = await currentProxy._l1_address(validTokenAddress);

      const isLocal = await currentProxy._is_local(l1token);
      if (!isLocal) {
        throw new Error("Token is not a local ERC token");
      }

      const tx = await currentProxy.addToken(l1token);
      addLog("info", "Transaction sent")
      addLog("txhash", tx.hash, chainId);

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      addLog("info", "ransaction confirmed. Gas used: " + receipt.gasUsed.toString());
      const statusRes = receipt.status === 1 ? "Success" : "Failure";
      addLog("info", "Status: " + statusRes);

      addLog("success", "Token added successfully!");
      await queryProxyInfo();
      setIsAddingToken(false);
      onClose();
    } catch (error) {
      const err = formatErrorMessage(error);
      addLog("error", `Error adding token: ${err}`);
      setErrorMessage(`Error adding token: ${err}`);
    } finally {
      setIsAddingToken(false);
    }
  }

  const closeModal = () => {
    setTokenAddress('');
    setErrorMessage("");
    onClose();
  }

  return (
    <Modal show={show} onHide={closeModal} backdrop="static" style={{ zIndex: 1051 }}>
      <Modal.Header closeButton>
        <Modal.Title>Add Token</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
        <InputGroup className="mb-3">
          <Form.Control
            type="text"
            placeholder="Enter token Address as uint256 hexadecimal (e.g., 0x12...)"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            required
          />
        </InputGroup>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={closeModal}>
          Close
        </Button>
        <Button variant="primary" onClick={onConfirm} disabled={isAddingToken}>
          {isAddingToken ? <Spinner animation="border" size="sm" /> : "Confirm"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};