import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { useState } from 'react';
import { SetSettlerProps } from '../main/props';
import { useLogger } from '../main/logger/LoggerContext';

export function SetSettler({signer, proxyAddress, actionEnabled, handleError}: SetSettlerProps) {
  const [newSettler, setNewSettler] = useState('');
  const { addLog, clearLogs } = useLogger();

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

    clearLogs(); // Clear existing logs

    try {
      const proxyContract = new ethers.Contract(proxyAddress, proxyArtifact.abi, signer);

      const tx = await proxyContract.setSettler(newSettler);
      addLog("Transaction sent: " + tx.hash);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      addLog("Transaction confirmed: " + receipt.hash);
      addLog("Gas used: " + receipt.gasUsed.toString());
      let statueRes = receipt.status === 1 ? "Success" : "Failure";
      addLog("Status: " + statueRes);

      addLog("Settler changed successfully!");
    } catch (error) {
      handleError("Error changing settler:" + error);
    }
  }

  return (
    <div>
      <h4>Set New Settler</h4>
      <InputGroup className="mb-3">
        <Button variant="primary" onClick={handleSetSettler} disabled={actionEnabled}>
          SET Settler
        </Button>
        <Form.Control
          type="text"
          placeholder="Enter new settler address as hex string"
          value={newSettler}
          onChange={(e) => setNewSettler(e.target.value)}
          required
        />
      </InputGroup>
    </div>
  )
}