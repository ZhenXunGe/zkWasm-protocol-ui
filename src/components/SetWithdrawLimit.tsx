import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { useState } from 'react';
import { SetWithdrawLimitProps } from '../main/props';
import { removeHexPrefix, validateHexString } from "../main/helps";
import { useLogger } from '../main/logger/LoggerContext';

export function SetWithdrawLimit({signer, proxyAddress, actionEnabled, handleError}: SetWithdrawLimitProps) {
  const [withdrawLimit, setWithdrawLimit] = useState('');
  const { addLog, clearLogs } = useLogger();

  const handleSetWithdrawLimit = async () => {
    if (!signer || !proxyAddress || !withdrawLimit) {
      handleError("Signer, Proxy address or withdrawLimit is missing");
      return;
    }

    clearLogs(); // Clear existing logs

    try {
      validateHexString(withdrawLimit);

      const proxyContract = new ethers.Contract(proxyAddress, proxyArtifact.abi, signer);

      // Query current withdrawLimit
      const amountBeforeSet = await proxyContract.withdrawLimit();
      addLog("withdrawLimit before set withdrawLimit: " + amountBeforeSet);

      // If withdrawLimit starts with "0x", remove "0x"
      const withdrawLimitNoPrefix =  removeHexPrefix(withdrawLimit);

      // Convert hex string to BigInt
      const withdrawLimitBigInt = BigInt("0x" + withdrawLimitNoPrefix);

      const tx = await proxyContract.setWithdrawLimit(withdrawLimitBigInt);
      addLog("Transaction sent: " + tx.hash);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      addLog("Transaction confirmed: " + receipt.hash);
      addLog("Gas used: " + receipt.gasUsed.toString());
      let statueRes = receipt.status === 1 ? "Success" : "Failure";
      addLog("Status: " + statueRes);

      // Query current withdrawLimit
      const amountAfterSet = await proxyContract.withdrawLimit();
      addLog("withdrawLimit after set withdrawLimit: : " + amountAfterSet);

      addLog("withdrawLimit changed successfully!");
    } catch (error) {
      handleError("Error changing withdrawLimit:" + error);
    }
  }

  return (
    <div>
      <h4>Set Withdraw Limit</h4>
      <InputGroup className="mb-3">
        <Button variant="primary" onClick={handleSetWithdrawLimit} disabled={actionEnabled}>
          SET Withdraw Limit
        </Button>
        <Form.Control
          type="text"
          placeholder="Enter max withdraw amount per settle as hex string(uint256)"
          value={withdrawLimit}
          onChange={(e) => setWithdrawLimit(e.target.value)}
          required
        />
      </InputGroup>
    </div>
  )
}