import React from "react";
import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { useState } from 'react';
import { SetSettlerProps } from '../main/props';
import { useLogger } from '../main/logger/LoggerContext';
import { formatAddress, validateHexString } from "../main/helps";

export function SetSettler({signer, proxyAddress, actionEnabled, handleError}: SetSettlerProps) {
  const [newSettler, setNewSettler] = useState('');
  const [manualProxyAddress, setManualProxyAddress] = useState(""); // Proxy address now user-inputted
  const [useManualInput, setUseManualInput] = useState(true); // Switch for manual/auto mode
  const { addLog, clearLogs } = useLogger();

  const handleSetSettler = async () => {
    try {
      if (!signer || !newSettler) {
        throw new Error("Signer or settler address is missing");
      }

      // Validate new settler address
      if (!ethers.isAddress(newSettler)) {
        throw new Error("Invalid address. Please enter a valid Ethereum address.");
      }

      // Resolve Proxy address based on mode
      const resolvedProxyAddress = useManualInput ? proxyAddress : manualProxyAddress;

      if (!resolvedProxyAddress) {
        throw new Error("Proxy address is missing");
      }

      clearLogs(); // Clear existing logs

      // Validate Proxy address
      validateHexString(resolvedProxyAddress, 40);
      const formattedProxyAddress = formatAddress(resolvedProxyAddress);
      const validProxyAddress = ethers.getAddress(formattedProxyAddress);
      addLog("Valid proxy Address: " + validProxyAddress);

      const proxyContract = new ethers.Contract(validProxyAddress, proxyArtifact.abi, signer);

      const tx = await proxyContract.setSettler(newSettler);
      addLog("Transaction sent: " + tx.hash);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      addLog("Transaction confirmed: " + receipt.hash);
      addLog("Gas used: " + receipt.gasUsed.toString());
      const statusRes = receipt.status === 1 ? "Success" : "Failure";
      addLog("Status: " + statusRes);

      addLog("Settler changed successfully!");
    } catch (error) {
      handleError("Error changing settler:" + error);
    }
  }

  return (
    <div>
      <h4>Set New Settler</h4>

      {/* Mode switch */}
      <InputGroup className="mb-3">
        <Form.Check
          type="switch"
          id="manual-auto-switch"
          label={useManualInput ? "Manual Mode" : "Auto Mode"}
          checked={useManualInput}
          onChange={() => setUseManualInput(!useManualInput)}
        />
      </InputGroup>

      {/* Input field for manual Proxy address */}
      {useManualInput && (
        <InputGroup className="mb-3">
          <Form.Control
            type="text"
            placeholder="Enter Proxy address as hex string"
            value={manualProxyAddress}
            onChange={(e) => setManualProxyAddress(e.target.value)}
            required
          />
        </InputGroup>
      )}

      <InputGroup className="mb-3">
        <Button variant="primary" onClick={handleSetSettler} disabled={actionEnabled}>
          SET Settler
        </Button>
        <Form.Control
          type="text"
          placeholder="Enter new settler address as hex string"
          value={newSettler}
          onChange={(e) => setNewSettler(e.target.value)}
          required
        />
      </InputGroup>
    </div>
  )
}