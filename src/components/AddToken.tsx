import React from "react";
import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { useState } from 'react';
import { AddTokenProps } from '../main/props';
import { formatAddress, validateHexString, queryAllTokens } from "../main/helps";
import { useLogger } from '../main/logger/LoggerContext';

export function AddToken({ signer, proxyAddress, actionEnabled, handleError }: AddTokenProps) {
  const [tokenAddress, setTokenAddress] = useState("");
  const [manualProxyAddress, setManualProxyAddress] = useState(""); // Proxy address now user-inputted
  const [useManualProxyInput, setuseManualProxyInput] = useState(true); // Switch for manual/Auto Proxy Mode
  const { addLog, clearLogs } = useLogger();

  const handleAddToken = async () => {
    try {
      if (!signer || !tokenAddress) {
        throw new Error("Signer or tokenAddress is missing");
      }

      // Resolve Proxy address based on mode
      const resolvedProxyAddress = useManualProxyInput ? manualProxyAddress : proxyAddress;

      if (!resolvedProxyAddress) {
        throw new Error("Proxy address is missing");
      }

      clearLogs(); // Clear existing logs

      // Validate Proxy address
      validateHexString(resolvedProxyAddress, 40);
      const formattedProxyAddress = formatAddress(resolvedProxyAddress);
      const validProxyAddress = ethers.getAddress(formattedProxyAddress);
      addLog("Valid Proxy address: " + validProxyAddress);

      const proxyContract = new ethers.Contract(validProxyAddress, proxyArtifact.abi, signer);

      // Validate token address
      validateHexString(tokenAddress, 40);
      const formattedAddress = formatAddress(tokenAddress);
      const validTokenAddress = ethers.getAddress(formattedAddress);
      addLog("Valid token address: " + validTokenAddress);

      // Call the _l1_address function with the valid token address
      const l1token = await proxyContract._l1_address(validTokenAddress);
      addLog("tokenaddr: " + tokenAddress + ", l1tokenaddr(encoded): " + l1token);

      const isLocal = await proxyContract._is_local(l1token);
      if (!isLocal) {
        throw new Error("Token is not a local ERC token");
      }

      const tx = await proxyContract.addToken(l1token);
      addLog("Transaction sent: " + tx.hash);

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      addLog("Transaction confirmed: " + receipt.hash);
      addLog("Gas used: " + receipt.gasUsed.toString());
      const statusRes = receipt.status === 1 ? "Success" : "Failure";
      addLog("Status: " + statusRes);

      // Query all tokens
      queryAllTokens(proxyContract, addLog);

      addLog("Token added successfully!");
    } catch (error) {
      handleError("Error adding token: " + error);
    }
  };

  return (
    <div>
      <h4>Add Token</h4>

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

      {/* Input field for token address */}
      <InputGroup className="mb-3">
        <InputGroup.Text>Token Address</InputGroup.Text>
        <Form.Control
          type="text"
          placeholder="Enter token address as hex string(uint256)"
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
          required
        />
      </InputGroup>

      {/* Add Token Button */}
      <Button className="addToken" variant="primary" onClick={handleAddToken} disabled={actionEnabled}>
        ADD TOKEN
      </Button>
    </div>
  );
}