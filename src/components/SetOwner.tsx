import React from "react";
import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { useState } from 'react';
import { SetOwnerProps } from '../main/props';
import { useLogger } from '../main/logger/LoggerContext';
import { formatAddress, validateHexString } from "../main/helps";

export function SetOwner({signer, proxyAddress, actionEnabled, handleError}: SetOwnerProps) {
  const [newOwner, setNewOwner] = useState('');
  const [manualProxyAddress, setManualProxyAddress] = useState(""); // Proxy address now user-inputted
  const [useManualInput, setUseManualInput] = useState(true); // Switch for manual/auto mode
  const { addLog, clearLogs } = useLogger();

  const handleSetOwner = async () => {
    try {
      if (!signer || !newOwner) {
        throw new Error("Signer or new owner address is missing");
      }

      // Validate new owner address
      if (!ethers.isAddress(newOwner)) {
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

      // Query current owner
      const infoBeforeSet = await proxyContract.getProxyInfo().catch(() => {
        // proxyContract.getProxyInfo is a view function
        // if throw error, maybe the address is not belong to Proxy
        throw new Error("Error querying existing Proxy: The address may not belong to a Proxy contract");
      });
      addLog("owner address before set: " + infoBeforeSet.owner);

      const tx = await proxyContract.setOwner(newOwner);
      addLog("Transaction sent: " + tx.hash);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      addLog("Transaction confirmed: " + receipt.hash);
      addLog("Gas used: " + receipt.gasUsed.toString());
      const statusRes = receipt.status === 1 ? "Success" : "Failure";
      addLog("Status: " + statusRes);

      // Query current owner
      const infoAfterSet = await proxyContract.getProxyInfo().catch(() => {
        // proxyContract.getProxyInfo is a view function
        // if throw error, maybe the address is not belong to Proxy
        throw new Error("Error querying existing Proxy: The address may not belong to a Proxy contract");
      });
      addLog("owner address after set: " + infoAfterSet.owner);

      addLog("Owner changed successfully!");
    } catch (error) {
      handleError("Error changing owner:" + error);
    }
  }

  return (
    <div>
      <h4>Set New Owner</h4>

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
        <Button variant="primary" onClick={handleSetOwner} disabled={actionEnabled}>
          SET OWNER
        </Button>
        <Form.Control
          type="text"
          placeholder="Enter new owner address as hex string"
          value={newOwner}
          onChange={(e) => setNewOwner(e.target.value)}
          required
        />
      </InputGroup>
    </div>
  )
}
