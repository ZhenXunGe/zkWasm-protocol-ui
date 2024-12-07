import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { useState } from 'react';
import { SetOwnerProps } from '../main/props';
import { useLogger } from '../main/logger/LoggerContext';

export function SetOwner({signer, proxyAddress, actionEnabled, handleError}: SetOwnerProps) {
  const [newOwner, setNewOwner] = useState('');
  const { addLog } = useLogger();

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
      addLog("Transaction sent: " + tx.hash);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      addLog("Transaction confirmed: " + receipt.hash);
      addLog("Gas used: " + receipt.gasUsed.toString());
      let statueRes = receipt.status === 1 ? "Success" : "Failure";
      addLog("Status: " + statueRes);

      alert("Owner changed successfully!");
    } catch (error) {
      handleError("Error changing owner:" + error);
    }
  }

  return (
    <div>
      <h4>Set New Owner</h4>
      <InputGroup className="mb-3">
        <Button variant="primary" onClick={handleSetOwner} disabled={actionEnabled}>
          SET OWNER
        </Button>
        <Form.Control
          type="text"
          placeholder="Enter new owner address as hex string"
          value={newOwner}
          onChange={(e) => setNewOwner(e.target.value)}
          required
        />
      </InputGroup>
    </div>
  )
}
