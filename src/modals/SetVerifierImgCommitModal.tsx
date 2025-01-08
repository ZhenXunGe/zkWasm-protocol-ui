import React, { useState } from "react";
import { Alert, Modal, Button, InputGroup, Form, Spinner } from "react-bootstrap";
import { removeHexPrefix } from "../main/utils";
import { useLogger } from '../main/logger/LoggerContext';
import { formatErrorMessage, validateHexString } from "../main/utils";
import { SetVerifierImgCommitModalProps } from "../main/props";

export const SetVerifierImgCommitModal: React.FC<SetVerifierImgCommitModalProps> = ({
  show,
  onClose,
  currentProxy,
  queryProxyInfo,
  chainId
}) => {
  const { addLog } = useLogger();
  const [commitment1, setCommitment1] = useState('');
  const [commitment2, setCommitment2] = useState('');
  const [commitment3, setCommitment3] = useState('');
  const [isSettingCommit, setIsSettingCommit] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const onConfirm = async () => {
    try {
      setErrorMessage("");
      if (!commitment1 || !commitment2 || !commitment3) {
        throw new Error("Commitment is missing");
      }

      if (
        BigInt("0x" + removeHexPrefix(commitment1.trim())) === 0n ||
        BigInt("0x" + removeHexPrefix(commitment2.trim())) === 0n ||
        BigInt("0x" + removeHexPrefix(commitment3.trim())) === 0n
      ) {
        throw new Error("Commitment cannot be 0");
      }
      
      setIsSettingCommit(true);
      setErrorMessage("");

      const cleanedCommitment1 = commitment1.trim();
      const cleanedCommitment2 = commitment2.trim();
      const cleanedCommitment3 = commitment3.trim();
      validateHexString(cleanedCommitment1);
      validateHexString(cleanedCommitment2);
      validateHexString(cleanedCommitment3);

      const commitments = [
        BigInt("0x" + removeHexPrefix(cleanedCommitment1)),
        BigInt("0x" + removeHexPrefix(cleanedCommitment2)),
        BigInt("0x" + removeHexPrefix(cleanedCommitment3)),
      ];
      const tx = await currentProxy.setVerifierImageCommitments(commitments);
      addLog("info", "Transaction sent");
      addLog("txhash", tx.hash, chainId);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      addLog("info", "Transaction confirmed. Gas used: " + receipt.gasUsed.toString());
      const statusRes = receipt.status === 1 ? "Success" : "Failure";
      addLog("info", "Status: " + statusRes);

      // Qeury zk_image_commitments
      const commitments1 = await currentProxy.zk_image_commitments(0);
      const commitments2 = await currentProxy.zk_image_commitments(1);
      const commitments3 = await currentProxy.zk_image_commitments(2);
      addLog("info", `Current zk_image_commitments: [${commitments1}, ${commitments2}, ${commitments3}]`);

      addLog("success", "Commitments set successfully!");
      await queryProxyInfo();
      setIsSettingCommit(false);
      onClose();
    } catch (error) {
      const err = formatErrorMessage(error);
      addLog("error", `Error setting Verifier image commitments: ${err}`);
      setErrorMessage(`Error setting Verifier image commitments: ${err}`);
    } finally {
      setIsSettingCommit(false);
    }
  }

  const closeModal = () => {
    setCommitment1("");
    setCommitment2("");
    setCommitment3("");
    setErrorMessage("");
    onClose();
  }

  return (
    <Modal show={show} onHide={closeModal}>
      <Modal.Header closeButton>
        <Modal.Title>Set Verifier Image Commitments</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
        <InputGroup className="mb-3">
          <Form.Control
            type="text"
            placeholder="Enter Commitment1 as uint256 hexadecimal (e.g., 0x12...)"
            value={commitment1}
            onChange={(e) => setCommitment1(e.target.value)}
            required
          />
        </InputGroup>
        <InputGroup className="mb-3">
          <Form.Control
            type="text"
            placeholder="Enter Commitment2 as uint256 hexadecimal (e.g., 0x12...)"
            value={commitment2}
            onChange={(e) => setCommitment2(e.target.value)}
            required
          />
        </InputGroup>
        <InputGroup className="mb-3">
          <Form.Control
            type="text"
            placeholder="Enter Commitment3 as uint256 hexadecimal (e.g., 0x12...)"
            value={commitment3}
            onChange={(e) => setCommitment3(e.target.value)}
            required
          />
        </InputGroup>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={closeModal}>
          Close
        </Button>
        <Button variant="primary" onClick={onConfirm} disabled={isSettingCommit}>
          {isSettingCommit ? <Spinner animation="border" size="sm" /> : "Confirm"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};