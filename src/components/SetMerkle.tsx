import React from "react";
import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { useState } from 'react';
import { SetMerkleProps } from '../main/props';
import { formatAddress, removeHexPrefix, validateHexString } from "../main/helps";
import { useLogger } from '../main/logger/LoggerContext';

export function SetMerkle({signer, proxyAddress, actionEnabled, handleError}: SetMerkleProps) {
  const [newRoot, setNewRoot] = useState('');
  const [manualProxyAddress, setManualProxyAddress] = useState(""); // Proxy address now user-inputted
  const [useManualProxyInput, setuseManualProxyInput] = useState(true); // Switch for manual/Auto Proxy Mode
  const { addLog, clearLogs } = useLogger();

  const handleSetMerkle = async () => {
    try {
      if (!signer || !newRoot) {
        throw new Error("Signer or new root is missing");
      }

      // Resolve Proxy address based on mode
      const resolvedProxyAddress = useManualProxyInput ? manualProxyAddress : proxyAddress;

      if (!resolvedProxyAddress) {
        throw new Error("Proxy address is missing");
      }

      clearLogs(); // Clear existing logs

      validateHexString(newRoot);

      // Validate Proxy address
      validateHexString(resolvedProxyAddress, 40);
      const formattedProxyAddress = formatAddress(resolvedProxyAddress);
      const validProxyAddress = ethers.getAddress(formattedProxyAddress);
      addLog("Valid Proxy address: " + validProxyAddress);

      const proxyContract = new ethers.Contract(validProxyAddress, proxyArtifact.abi, signer);

      const merkleBeforeSet = await proxyContract.merkle_root()
      addLog("merkle root before set merkle: " + merkleBeforeSet);

      // If newRoot starts with "0x", remove "0x"
      const rootNoPrefix = removeHexPrefix(newRoot);

      // Convert hex string to BigInt
      const rootBigInt = BigInt("0x" + rootNoPrefix);

      const tx = await proxyContract.setMerkle(rootBigInt);
      addLog("Transaction sent: " + tx.hash);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      addLog("Transaction confirmed: " + receipt.hash);
      addLog("Gas used: " + receipt.gasUsed.toString());
      const statusRes = receipt.status === 1 ? "Success" : "Failure";
      addLog("Status: " + statusRes);

      // Query current merkle root
      const proxyInfo = await proxyContract.getProxyInfo().catch(() => {
        // proxyContract.getProxyInfo is a view function
        // if throw error, maybe the address is not belong to Proxy
        throw new Error("Error querying existing Proxy: The address may not belong to a Proxy contract");
      });
      addLog("merkle root after set merkle:: " + proxyInfo.merkle_root);

      addLog("Root changed successfully!");
    } catch (error) {
      handleError("Error changing root:" + error);
    }
  }

  return (
    <div>
      <h4>Set Merkle</h4>

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
        <InputGroup.Text>Merkle Root</InputGroup.Text>
        <Form.Control
          type="text"
          placeholder="Enter new root as hex string(uint256)"
          value={newRoot}
          onChange={(e) => setNewRoot(e.target.value)}
          required
        />
      </InputGroup>

      <Button className="setMerkle" variant="primary" onClick={handleSetMerkle} disabled={actionEnabled}>
        SET MERKLE
      </Button>
    </div>
  )
}