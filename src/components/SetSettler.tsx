import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useState } from 'react';
import { SetSettlerProps } from '../main/props';

export function SetSettler({signer, proxyAddress, actionEnabled, handleError}: SetSettlerProps) {
  const [newSettler, setNewSettler] = useState('');

  const handleSetSettler = async () => {
    if (!signer || !proxyAddress || !newSettler) {
      handleError("Signer, Proxy or settler address is missing");
      return;
    }

    // Validate new settler address
    if (!ethers.isAddress(newSettler)) {
      handleError("Invalid address. Please enter a valid Ethereum address.");
      return;
    }

    try {
      const proxyContract = new ethers.Contract(proxyAddress, proxyArtifact.abi, signer);

      const tx = await proxyContract.setSettler(newSettler);
      console.log("Transaction sent:", tx.hash);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt.hash);
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Status:", receipt.status === 1 ? "Success" : "Failure");

      alert("Settler changed successfully!");
    } catch (error) {
      handleError("Error changing settler:" + error);
    }
  }

  return (
    <div>
      <h4>Set New Settler</h4>
      <Form.Group controlId="formNewSettler">
        <Form.Control
          type="text"
          placeholder="Enter new settler address as hex string"
          value={newSettler}
          onChange={(e) => setNewSettler(e.target.value)}
          required
        />
      </Form.Group>
      <Button className="setSettler" variant="primary" onClick={handleSetSettler} disabled={actionEnabled}>
        SET Settler
      </Button>
    </div>
  )
}