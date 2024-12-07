import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { SetVerifierProps } from '../main/props';
import { useState } from 'react';
import { useLogger } from '../main/logger/LoggerContext';

export function SetVerifier({signer, proxyAddress, actionEnabled, handleError}: SetVerifierProps) {
  const [verifier, setVerifier] = useState('');
  const { addLog, clearLogs } = useLogger();

  const handleSetVerifier = async () => {
    if (!signer || !proxyAddress || !verifier) {
      handleError("Signer, Proxy or verifier address is missing");
      return;
    }

    // Validate verifier address
    if (!ethers.isAddress(verifier)) {
      handleError("Invalid address. Please enter a valid Ethereum address.");
      return;
    }

    clearLogs(); // Clear existing logs

    try {
      const proxyContract = new ethers.Contract(proxyAddress, proxyArtifact.abi, signer);

      const tx = await proxyContract.setVerifier(verifier);
      addLog("Transaction sent: " + tx.hash);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      addLog("Transaction confirmed: " + receipt.hash);
      addLog("Gas used: " + receipt.gasUsed.toString());
      let statueRes = receipt.status === 1 ? "Success" : "Failure";
      addLog("Status: " + statueRes);

      // Qeury verifier address
      const address = await proxyContract.verifier();
      addLog("Current verifier address: " + address);

      addLog("Verifier set successfully!");
    } catch (error) {
      handleError("Error setting verifier:" + error);
    }
  }

  return (
    <div>
      <h4>Set Verifier</h4>
      <InputGroup className="mb-3">
        <Button variant="primary" onClick={handleSetVerifier} disabled={actionEnabled}>
          SET VERIFIER
        </Button>
        <Form.Control
          type="text"
          placeholder="Enter verifier address as hex string"
          value={verifier}
          onChange={(e) => setVerifier(e.target.value)}
          required
        />
      </InputGroup>
    </div>
  )
}