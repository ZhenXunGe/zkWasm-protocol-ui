import React, { useState } from "react";
import { Alert, Modal, Button, InputGroup, Form, Spinner } from "react-bootstrap";
import { formatErrorMessage, removeHexPrefix } from "../main/utils";
import { useLogger } from '../main/logger/LoggerContext';
import { SetWithdrawLimitProps } from "../main/props";

export const SetWithdrawLimitModal: React.FC<SetWithdrawLimitProps> = ({
  show,
  onClose,
  currentProxy,
  queryProxyInfo,
  chainId
}) => {
  const { addLog } = useLogger();
  const [withdrawLimit, setWithdrawLimit] = useState('');
  const [isSettingLimit, setIsSettingLimit] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const onConfirm = async () => {
    try {
      setErrorMessage("");
      if (!withdrawLimit) {
        throw new Error("WithdrawLimit is missing");
      }

      setIsSettingLimit(true);
      setErrorMessage("");

      // Query current withdrawLimit
      const amountBeforeSet = await currentProxy.withdrawLimit();
      addLog("info", "withdrawLimit before set withdrawLimit: " + amountBeforeSet);

      // If withdrawLimit starts with "0x", remove "0x"
      const cleanedWithdrawLimit = withdrawLimit.trim();
      const withdrawLimitNoPrefix =  removeHexPrefix(cleanedWithdrawLimit);

      // Convert hex string to BigInt
      const weiMultiplier = BigInt("1000000000000000000");
      const withdrawLimitBigInt = BigInt("0x" + withdrawLimitNoPrefix) * weiMultiplier;

      addLog("info", `Please sign the transaction in your wallet. This signature is required to authorize the execution of the contract function.`);
      const tx = await currentProxy.setWithdrawLimit(withdrawLimitBigInt);
      addLog("info", "Transaction sent");
      addLog("txhash", tx.hash, chainId);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      addLog("info", "Transaction confirmed. Gas used: " + receipt.gasUsed.toString());
      const statusRes = receipt.status === 1 ? "Success" : "Failure";
      addLog("info", "Transaction Receipt Status: " + statusRes);

      // Query current withdrawLimit
      const amountAfterSet = await currentProxy.withdrawLimit();
      addLog("info", "withdrawLimit after set withdrawLimit: : " + amountAfterSet);

      addLog("success", "withdrawLimit changed successfully!");
      addLog("info", "Start updating latest Proxy info...");
      await queryProxyInfo();
      setWithdrawLimit("");
      setIsSettingLimit(false);
      onClose();
    } catch (error) {
      const err = formatErrorMessage(error);
      addLog("error", `Error changing withdrawLimit: ${err}`);
      setErrorMessage(`Error changing withdrawLimit: ${err}`);
    } finally {
      setIsSettingLimit(false);
    }
  }

  const closeModal = () => {
    setWithdrawLimit("");
    setErrorMessage("");
    onClose();
  }

  return (
    <Modal show={show} backdrop="static" onHide={closeModal}>
      <Modal.Header closeButton>
        <Modal.Title>Set Withdraw Limit</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
        <InputGroup className="mb-3">
          <Form.Control
            type="text"
            placeholder="Enter withdraw limit as uint256 hexadecimal"
            value={withdrawLimit}
            onChange={(e) => setWithdrawLimit(e.target.value)}
            required
          />
        </InputGroup>
        <Alert variant="info">
          Withdraw limit should be entered in ETH (1 ETH = 10<sup>18</sup> Wei).
        </Alert>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={closeModal}>
          Close
        </Button>
        <Button variant="primary" onClick={onConfirm} disabled={isSettingLimit}>
          {isSettingLimit ? <Spinner animation="border" size="sm" /> : "Confirm"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};