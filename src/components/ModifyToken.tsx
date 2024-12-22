import React from "react";
import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { useState } from 'react';
import { ModifyTokenProps } from '../main/props';
import { formatAddress, validateHexString, validateIndex, queryAllTokens } from "../main/helps";
import { useLogger } from '../main/logger/LoggerContext';

export function ModifyToken({signer, proxyAddress, actionEnabled, handleError}: ModifyTokenProps) {
  const [index, setIndex] = useState(0);
  const [manualProxyAddress, setManualProxyAddress] = useState(""); // Proxy address now user-inputted
  const [useManualProxyInput, setuseManualProxyInput] = useState(true); // Switch for manual/Auto Proxy Mode
  const [tokenAddress, setTokenAddress] = useState('');
  const { addLog, clearLogs } = useLogger();

  const handleModifyToken = async () => {
    try {
      if (!signer || !index ||!tokenAddress) {
        throw new Error("Signer, token index or token address is missing");
      }

      // Resolve Proxy address based on mode
      const resolvedProxyAddress = useManualProxyInput ? manualProxyAddress : proxyAddress;

      if (!resolvedProxyAddress) {
        throw new Error("Proxy address is missing");
      }

      clearLogs(); // Clear existing logs

      // Validate index (uint32)
      if (!validateIndex(index)) {
        throw new Error('Index must be a valid uint32 value (0 to 4294967295)');
      }

      // Check token format
      validateHexString(tokenAddress, 40);

      // Validate Proxy address
      validateHexString(resolvedProxyAddress, 40);
      const formattedProxyAddress = formatAddress(resolvedProxyAddress);
      const validProxyAddress = ethers.getAddress(formattedProxyAddress);
      addLog("Valid Proxy address: " + validProxyAddress);

      const proxyContract = new ethers.Contract(validProxyAddress, proxyArtifact.abi, signer);

      // Ensure the token address is a valid Ethereum address
      const formattedAddress = formatAddress(tokenAddress);
      const validTokenAddress = ethers.getAddress(formattedAddress);
      addLog("Valid token address: " + validTokenAddress)

      // Call the _l1_address function with the valid token address
      const l1token = await proxyContract._l1_address(validTokenAddress)
      addLog("tokenaddr: " + tokenAddress + ", l1tokenaddr(encoded): " + l1token);

      const isLocal = await proxyContract._is_local(l1token)
      if(!isLocal) {
        throw new Error("token is not a local erc token");
      }

      // Call the modifyToken function
      const tx = await proxyContract.modifyToken(index, l1token);
      addLog("Transaction sent: " + tx.hash);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      addLog("Transaction confirmed: " + receipt.hash);
      addLog("Gas used: " + receipt.gasUsed.toString());
      const statusRes = receipt.status === 1 ? "Success" : "Failure";
      addLog("Status: " + statusRes);

      // Qeury all tokens
      queryAllTokens(proxyContract, addLog);

      addLog('Token modified successfully!');
    } catch (error) {
      handleError("Error modifying token:" + error);
    }
  }

  return (
    <div>
      <h4>Modify Token</h4>

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
        <InputGroup.Text>Token Index</InputGroup.Text>
        <Form.Control
          type="number"
          value={index}
          min="0"
          onChange={(e) => setIndex(Number(e.target.value))}
          placeholder="Enter token index(uint32)"
          required
        />
      </InputGroup>

      <InputGroup className="mb-3">
        <InputGroup.Text>Token Address</InputGroup.Text>
        <Form.Control
          type="text"
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
          placeholder="Enter token Address as hex string(uint256)"
          required
        />
      </InputGroup>

      <Button className="modifyToken" variant="primary" onClick={handleModifyToken} disabled={actionEnabled}>
        Modify TOKEN
      </Button>
    </div>
  )
}