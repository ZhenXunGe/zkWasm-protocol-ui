import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useState } from 'react';
import { AddTokenProps } from '../main/props';
import { formatAddress, validateHexString } from "../main/helps";

export function AddToken({signer, proxyAddress, actionEnabled, handleError}: AddTokenProps) {
  const [tokenAddress, setTokenAddress] = useState("");

  const handleAddToken = async () => {
    if (!signer || !proxyAddress || !tokenAddress) {
      handleError("Signer, Proxy address or tokenAddress is missing");
      return;
    }

    try {
      const proxyContract = new ethers.Contract(proxyAddress, proxyArtifact.abi, signer);

      // Check token format
      validateHexString(tokenAddress, 40);

      // Ensure the token address is a valid Ethereum address
      let formattedAddress = formatAddress(tokenAddress);
      const validTokenAddress = ethers.getAddress(formattedAddress);
      console.log("Valid Address:", validTokenAddress)

      // Call the _l1_address function with the valid token address
      const l1token = await proxyContract._l1_address(validTokenAddress)
      console.log("tokenaddr, l1tokenaddr(encoded)", tokenAddress, l1token);

      const isLocal = await proxyContract._is_local(l1token)
      if(!isLocal) {
        throw new Error("token is not a local erc token");
      }

      const tx = await proxyContract.addToken(l1token);
      console.log("Transaction sent:", tx.hash);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt.hash);
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Status:", receipt.status === 1 ? "Success" : "Failure");

      alert("Token added successfully!");
    } catch (error) {
      handleError("Error adding token:" + error);
    }
  }

  return (
    <div>
      <h4>Add Token</h4>
      <Form.Group controlId="formToken">
        <Form.Control
          type="text"
          placeholder="Enter tokenAddress as hex string(uint256)"
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
          required
        />
      </Form.Group>
      <Button className="addToken" variant="primary" onClick={handleAddToken} disabled={actionEnabled}>
        ADD TOKEN
      </Button>
    </div>
  )
}