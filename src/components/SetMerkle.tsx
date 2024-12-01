import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useState } from 'react';
import { SetMerkleProps } from '../main/props';
import { removeHexPrefix, validateHexString } from "../main/helps";

export function SetMerkle({signer, proxyAddress, actionEnabled, handleError}: SetMerkleProps) {
  const [newRoot, setNewRoot] = useState('');

  const handleSetMerkle = async () => {
    if (!signer || !proxyAddress || !newRoot) {
      handleError("Signer, Proxy address or new root is missing");
      return;
    }

    try {
      validateHexString(newRoot);

      const proxyContract = new ethers.Contract(proxyAddress, proxyArtifact.abi, signer);

      // If newRoot starts with "0x", remove "0x"
      const rootNoPrefix = removeHexPrefix(newRoot);

      // Convert hex string to BigInt
      const rootBigInt = BigInt("0x" + rootNoPrefix);

      const tx = await proxyContract.setMerkle(rootBigInt);
      console.log("Transaction sent:", tx.hash);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt.hash);
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Status:", receipt.status === 1 ? "Success" : "Failure");

      alert("Root changed successfully!");
    } catch (error) {
      handleError("Error changing root:" + error);
    }
  }

  return (
    <div>
      <h4>Set Merkle</h4>
      <Form.Group controlId="formMerkle">
        <Form.Control
          type="text"
          placeholder="Enter new root as hex string(uint256)"
          value={newRoot}
          onChange={(e) => setNewRoot(e.target.value)}
          required
        />
      </Form.Group>
      <Button className="setMerkle" variant="primary" onClick={handleSetMerkle} disabled={actionEnabled}>
        SET MERKLE
      </Button>
    </div>
  )
}