import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import Form from 'react-bootstrap/Form';
import { AddTXProps } from '../main/props';
import { useState } from 'react';
import { useLogger } from '../main/logger/LoggerContext';

export function AddTX({signer, proxyAddress, addTXEnabled, setAddTXEnabled, handleError}: AddTXProps) {
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const { addLog } = useLogger();

  const handleAddTX = async () => {
    if (!signer || !proxyAddress || !withdrawAddress) {
      handleError("Signer, Proxy or Withdraw address is missing");
      return;
    }

    // Validate withdraw address
    if (!ethers.isAddress(withdrawAddress)) {
      handleError("Invalid address. Please enter a valid Ethereum address.");
      return;
    }

    try {
      const proxyContract = new ethers.Contract(proxyAddress, proxyArtifact.abi, signer);

      // Excute Proxy contract's addTransaction
      const tx = await proxyContract.addTransaction(withdrawAddress, true);
      addLog("Transaction sent: " + tx.hash);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      addLog("Transaction confirmed: " + receipt.hash);
      addLog("Gas used: " + receipt.gasUsed.toString());
      let statueRes = receipt.status === 1 ? "Success" : "Failure";
      addLog("Status: " + statueRes);

      // Qeury transaction address
      const address = await proxyContract._get_transaction(0n); //opcode of withdraw is 0x0
      addLog("Current transaction address: " + address);

      setAddTXEnabled(true);

      addLog("Transaction added successfully!");
    } catch (error) {
      handleError("Error adding transaction:" + error);
    }
  }

  return (
    <>
      <h4>Add Transaction</h4>
      <InputGroup className="mb-3">
        <Button variant="primary" onClick={handleAddTX} disabled={addTXEnabled}>
          ADDTX
        </Button>
        <Form.Control
          type="text"
          placeholder="Enter withdraw address as hex string"
          value={withdrawAddress}
          onChange={(e) => setWithdrawAddress(e.target.value)}
          required
        />
      </InputGroup>
    </>
  )
}