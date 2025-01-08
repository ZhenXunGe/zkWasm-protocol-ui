import React, { useState } from "react";
import { Alert, Modal, Button, InputGroup, Form, Spinner } from "react-bootstrap";
import { useLogger } from '../main/logger/LoggerContext';
import { formatErrorMessage } from "../main/utils";
import { ethers } from 'ethers';
import { validateHexString } from "../main/utils";
import { formatAddress } from "../main/utils";
import { ModifyTokenProps } from "../main/props";

export const ModifyTokenModal: React.FC<ModifyTokenProps> = ({
  show,
  onClose,
  currentProxy,
  queryProxyInfo,
  chainId,
  tokenIndex
}) => {
  const { addLog } = useLogger();
  const [tokenAddress, setTokenAddress] = useState('');
  const [isModifyingToken, setIsModifyingToken] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const onConfirm = async () => {
    try {
      setErrorMessage("");
      if (!tokenAddress) {
        throw new Error("Token address is missing");
      }

      validateHexString(tokenAddress, 40);
      
      setIsModifyingToken(true);

      // Ensure the token address is a valid Ethereum address
      const formattedAddress = formatAddress(tokenAddress);
      const validTokenAddress = ethers.getAddress(formattedAddress);
      addLog("contractAddr", "Valid token address: " + validTokenAddress)

      // Call the _l1_address function with the valid token address
      const l1token = await currentProxy._l1_address(validTokenAddress)

      const isLocal = await currentProxy._is_local(l1token)
      if(!isLocal) {
        throw new Error("token is not a local erc token");
      }

      // Call the modifyToken function
      const tx = await currentProxy.modifyToken(tokenIndex, l1token);
      addLog("info", "Transaction sent");
      addLog("txhash", tx.hash, chainId);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      addLog("info", "Transaction confirmed. Gas used: " + receipt.gasUsed.toString());
      const statusRes = receipt.status === 1 ? "Success" : "Failure";
      addLog("info", "Status: " + statusRes);

      addLog("success", 'Token modified successfully!');
      await queryProxyInfo();
      setIsModifyingToken(false);
      onClose();
    } catch (error) {
      const err = formatErrorMessage(error);
      addLog("error", `Error modifying token: ${err}`);
      setErrorMessage(`Error modifying token: ${err}`);
    } finally {
      setIsModifyingToken(false);
    }
  }

  const closeModal = () => {
    setTokenAddress('');
    setErrorMessage('');
    onClose();
  }

  return (
    <Modal show={show} onHide={closeModal} backdrop={"static"} style={{ zIndex: 1051 }}>
      <Modal.Header closeButton>
        <Modal.Title>Modify Token</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
        <InputGroup className="mb-3">
          <Form.Control
            type="text"
            placeholder="Enter token Address as uint256 hexadecimal (e.g., 0x12..)"
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
        <Button variant="primary" onClick={onConfirm} disabled={isModifyingToken}>
          {isModifyingToken ? <Spinner animation="border" size="sm" /> : "Confirm"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};