import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { useState } from 'react';
import { AddTokenProps } from '../main/props';
import { formatAddress, validateHexString, queryAllTokens } from "../main/helps";
import { useLogger } from '../main/logger/LoggerContext';

export function AddToken({signer, proxyAddress, actionEnabled, handleError}: AddTokenProps) {
  const [tokenAddress, setTokenAddress] = useState("");
  const { addLog, clearLogs } = useLogger();

  const handleAddToken = async () => {
    if (!signer || !proxyAddress || !tokenAddress) {
      handleError("Signer, Proxy address or tokenAddress is missing");
      return;
    }

    clearLogs(); // Clear existing logs

    try {
      const proxyContract = new ethers.Contract(proxyAddress, proxyArtifact.abi, signer);

      // Check token format
      validateHexString(tokenAddress, 40);

      // Ensure the token address is a valid Ethereum address
      let formattedAddress = formatAddress(tokenAddress);
      const validTokenAddress = ethers.getAddress(formattedAddress);
      addLog("Valid tokenAddress: " + validTokenAddress)

      // Call the _l1_address function with the valid token address
      const l1token = await proxyContract._l1_address(validTokenAddress)
      addLog("tokenaddr: " + tokenAddress + ", l1tokenaddr(encoded): " + l1token);

      const isLocal = await proxyContract._is_local(l1token)
      if(!isLocal) {
        throw new Error("token is not a local erc token");
      }

      const tx = await proxyContract.addToken(l1token);
      addLog("Transaction sent: " + tx.hash);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      addLog("Transaction confirmed: " + receipt.hash);
      addLog("Gas used: " + receipt.gasUsed.toString());
      let statueRes = receipt.status === 1 ? "Success" : "Failure";
      addLog("Status: " + statueRes);

      // Qeury all tokens
      queryAllTokens(proxyContract, addLog);

      addLog("Token added successfully!");
    } catch (error) {
      handleError("Error adding token:" + error);
    }
  }

  return (
    <div>
      <h4>Add Token</h4>
      <InputGroup className="mb-3">
        <Button className="addToken" variant="primary" onClick={handleAddToken} disabled={actionEnabled}>
          ADD TOKEN
        </Button>
        <Form.Control
          type="text"
          placeholder="Enter tokenAddress as hex string(uint256)"
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
          required
        />
      </InputGroup>
    </div>
  )
}