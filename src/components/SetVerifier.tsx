import React from "react";
import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { SetVerifierProps } from '../main/props';
import { useState } from 'react';
import { useLogger } from '../main/logger/LoggerContext';
import { formatAddress, validateHexString } from "../main/helps";

export function SetVerifier({signer, proxyAddress, verifierAddress, actionEnabled, handleError}: SetVerifierProps) {
  const [manualProxyAddress, setManualProxyAddress] = useState(""); // Proxy address now user-inputted
  const [manualVerifierAddress, setManualVerifierAddress] = useState(""); // Verifier address now user-inputted
  const [useManualProxyInput, setUseManualProxyInput] = useState(true); // Proxy input mode switch
  const [useManualVerifierInput, setUseManualVerifierInput] = useState(true); // Proxy input mode switch
  const { addLog, clearLogs } = useLogger();

  const handleSetVerifier = async () => {
    try {
      if (!signer) {
        throw new Error("Signer is missing");
      }

      // Resolve Proxy address based on mode
      const resolvedProxyAddress = useManualProxyInput ? manualProxyAddress : proxyAddress;

      if (!resolvedProxyAddress) {
        throw new Error("Proxy address is missing");
      }

      // Resolve Verifier address based on mode
      const resolvedVerifierAddress = useManualProxyInput ? manualVerifierAddress : verifierAddress;

      if (!resolvedVerifierAddress) {
        throw new Error("Verifier address is missing");
      }

      clearLogs(); // Clear existing logs

      // Validate Proxy address
      validateHexString(resolvedProxyAddress, 40);
      const formattedProxyAddress = formatAddress(resolvedProxyAddress);
      const validProxyAddress = ethers.getAddress(formattedProxyAddress);
      addLog("Valid Proxy address: " + validProxyAddress);

      const proxyContract = new ethers.Contract(validProxyAddress, proxyArtifact.abi, signer);

      // Validate Verifier address
      validateHexString(resolvedVerifierAddress, 40);
      const formattedVerifierAddress = formatAddress(resolvedVerifierAddress);
      const validVerifierAddress = ethers.getAddress(formattedVerifierAddress);
      addLog("Valid Verifier address: " + validVerifierAddress);

      const tx = await proxyContract.setVerifier(validVerifierAddress);
      addLog("Transaction sent: " + tx.hash);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      addLog("Transaction confirmed: " + receipt.hash);
      addLog("Gas used: " + receipt.gasUsed.toString());
      const statusRes = receipt.status === 1 ? "Success" : "Failure";
      addLog("Status: " + statusRes);

      // Qeury verifier address
      const address = await proxyContract.verifier();
      addLog("Current Verifier address: " + address);

      addLog("Verifier set successfully!");
    } catch (error) {
      handleError("Error setting verifier:" + error);
    }
  }

  return (
    <div>
      <h4>Set Verifier</h4>

      {/* Mode switch */}
      <InputGroup className="mb-3">
        <Form.Check
          type="switch"
          id="manual-auto-switch"
          label={useManualProxyInput ? "Manual Proxy Mode" : "Auto Proxy Mode"}
          checked={useManualProxyInput}
          onChange={() => setUseManualProxyInput(!useManualProxyInput)}
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

      {/* Withdraw Mode switch */}
      <InputGroup className="mb-3">
        <Form.Check
          type="switch"
          id="manual-withdraw-switch"
          label={useManualVerifierInput ? "Manual Verifier Mode" : "Auto Verifier Mode"}
          checked={useManualVerifierInput}
          onChange={() => setUseManualVerifierInput(!useManualVerifierInput)}
        />
      </InputGroup>

      {/* Input field for manual Verifier address */}
      <InputGroup className="mb-3">
        <InputGroup.Text>Verifier Address</InputGroup.Text>
        <Form.Control
          type="text"
          placeholder="Enter Verifier address as hex string"
          value={useManualVerifierInput ? manualVerifierAddress : verifierAddress || "No deployed Verifier address available"}
          onChange={(e) => setManualVerifierAddress(e.target.value)}
          disabled={!useManualVerifierInput}
          required
        />
      </InputGroup>

      {/* Set Verifier Button */}
      <Button className="setVerifier" variant="primary" onClick={handleSetVerifier} disabled={actionEnabled}>
        SET VERIFIER
      </Button>
    </div>
  )
}