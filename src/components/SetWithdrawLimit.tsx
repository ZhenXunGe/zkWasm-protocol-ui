import React from "react";
import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { useState } from 'react';
import { SetWithdrawLimitProps } from '../main/props';
import { formatAddress,removeHexPrefix, validateHexString } from "../main/helps";
import { useLogger } from '../main/logger/LoggerContext';

export function SetWithdrawLimit({signer, proxyAddress, actionEnabled, handleError}: SetWithdrawLimitProps) {
  const [withdrawLimit, setWithdrawLimit] = useState('');
  const [manualProxyAddress, setManualProxyAddress] = useState(""); // Proxy address now user-inputted
  const [useManualProxyInput, setuseManualProxyInput] = useState(true); // Switch for manual/Auto Proxy Mode
  const { addLog, clearLogs } = useLogger();

  const handleSetWithdrawLimit = async () => {
    try {
      if (!signer || !withdrawLimit) {
        throw new Error("Signer or withdrawLimit is missing");
      }

      // Resolve Proxy address based on mode
      const resolvedProxyAddress = useManualProxyInput ? manualProxyAddress : proxyAddress;

      if (!resolvedProxyAddress) {
        throw new Error("Proxy address is missing");
      }

      clearLogs(); // Clear existing logs

      validateHexString(withdrawLimit);

      // Validate Proxy address
      validateHexString(resolvedProxyAddress, 40);
      const formattedProxyAddress = formatAddress(resolvedProxyAddress);
      const validProxyAddress = ethers.getAddress(formattedProxyAddress);
      addLog("Valid Proxy address: " + validProxyAddress);

      const proxyContract = new ethers.Contract(validProxyAddress, proxyArtifact.abi, signer);

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
      const statusRes = receipt.status === 1 ? "Success" : "Failure";
      addLog("Status: " + statusRes);

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

      {/* Mode switch */}
      <InputGroup className="mb-3">
        <Form.Check
          type="switch"
          id="manual-auto-switch"
          label={useManualProxyInput ? "Manual Proxy Mode" : "Auto Proxy Mode"}
          checked={useManualProxyInput}
          onChange={() => setuseManualProxyInput(!useManualProxyInput)}
        />
      </InputGroup>

      {/* Input field for manual Proxy address */}
      <InputGroup className="mb-3">
        <InputGroup.Text>Proxy Address</InputGroup.Text>
        <Form.Control
          type="text"
          placeholder="Enter Proxy address as hex string"
          value={useManualProxyInput ? manualProxyAddress : proxyAddress || "No deployed Proxy address available"}
          onChange={(e) => setManualProxyAddress(e.target.value)}
          disabled={!useManualProxyInput}
          required
        />
      </InputGroup>

      <InputGroup className="mb-3">
        <InputGroup.Text>Withdraw Limit</InputGroup.Text>
        <Form.Control
          type="text"
          placeholder="Enter max withdraw amount per settle as hex string(uint256)"
          value={withdrawLimit}
          onChange={(e) => setWithdrawLimit(e.target.value)}
          required
        />
      </InputGroup>

      <Button variant="primary" className="setWithdrawLimit" onClick={handleSetWithdrawLimit} disabled={actionEnabled}>
        SET Withdraw Limit
      </Button>
    </div>
  )
}