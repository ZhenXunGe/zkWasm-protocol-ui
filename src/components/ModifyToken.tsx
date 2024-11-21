import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { useState } from 'react';
import { ModifyTokenProps } from '../main/props';
import { formatAddress, validateHexString } from "../main/helps";

// Validate if the index is a valid uint32 (between 0 and 2^32 - 1)
const validateIndex = (index: number) => {
  return index >= 0 && index < 2 ** 32;
};

export function ModifyToken({signer, proxyAddress, actionEnabled, handleError}: ModifyTokenProps) {
  const [index, setIndex] = useState(0);
  const [tokenAddress, setTokenAddress] = useState('');

  const handleModifyToken = async () => {
    if (!signer || !proxyAddress || !tokenAddress) {
      handleError("Signer, Proxy address, token index or tokenUid is missing");
      return;
    }

    try {
      // Validate index (uint32)
      if (!validateIndex(index)) {
        throw new Error('Index must be a valid uint32 value (0 to 4294967295)');
      }

      // Check token format
      validateHexString(tokenAddress, 40);

      const proxyContract = new ethers.Contract(proxyAddress, proxyArtifact.abi, signer);

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

      // Call the modifyToken function
      const tx = await proxyContract.modifyToken(index, l1token);
      console.log("Transaction sent:", tx.hash);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt.hash);
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Status:", receipt.status === 1 ? "Success" : "Failure");

      alert('Token successfully modified!');
    } catch (error) {
      handleError("Error adding token:" + error);
    }
  }

  return (
    <div>
      <h4>Modify Token</h4>
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
          placeholder="Enter tokenAddress as hex string(uint256)"
          required
        />
      </InputGroup>
      <Button className="addToken" variant="primary" onClick={handleModifyToken} disabled={actionEnabled}>
        Modify TOKEN
      </Button>
    </div>
  )
}