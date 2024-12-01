import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useState } from 'react';
import { SetOwnerProps } from '../main/props';

export function SetOwner({signer, proxyAddress, actionEnabled, handleError}: SetOwnerProps) {
  const [newOwner, setNewOwner] = useState('');

  const handleSetOwner = async () => {
    if (!signer || !proxyAddress || !newOwner) {
      handleError("Signer, Proxy or new owner address is missing");
      return;
    }

    // Validate new owner address
    if (!ethers.isAddress(newOwner)) {
      handleError("Invalid address. Please enter a valid Ethereum address.");
      return;
    }

    try {
      const proxyContract = new ethers.Contract(proxyAddress, proxyArtifact.abi, signer);

      const tx = await proxyContract.setOwner(newOwner);
      console.log("Transaction sent:", tx.hash);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt.hash);
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Status:", receipt.status === 1 ? "Success" : "Failure");

      alert("Owner changed successfully!");
    } catch (error) {
      handleError("Error changing owner:" + error);
    }
  }

  return (
    <div>
      <h4>Set New Owner</h4>
      <Form.Group controlId="formNewOwner">
        <Form.Control
          type="text"
          placeholder="Enter new owner address as hex string"
          value={newOwner}
          onChange={(e) => setNewOwner(e.target.value)}
          required
        />
      </Form.Group>
      <Button className="setOwner" variant="primary" onClick={handleSetOwner} disabled={actionEnabled}>
        SET OWNER
      </Button>
    </div>
  )
}
