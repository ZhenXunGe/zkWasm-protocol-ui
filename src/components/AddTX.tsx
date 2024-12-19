import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import Form from 'react-bootstrap/Form';
import { AddTXProps } from '../main/props';
import { useState } from 'react';
import { useLogger } from '../main/logger/LoggerContext';
import { formatAddress, validateHexString } from "../main/helps";

export function AddTX({signer, proxyAddress, withdrawAddress, addTXEnabled, setAddTXEnabled, handleError}: AddTXProps) {
  const [manualWithdrawAddress, setManualWithdrawAddress] = useState(""); // Withdraw address now user-inputted
  const [manualProxyAddress, setManualProxyAddress] = useState(""); // Proxy address now user-inputted
  const [useManualProxyInput, setUseManualProxyInput] = useState(true); // Proxy input mode switch
  const [useManualWithdrawInput, setUseManualWithdrawInput] = useState(true); // Withdraw input mode switch
  const { addLog } = useLogger();

  const handleAddTX = async () => {
    if (!signer) {
      handleError("Signer is missing");
      return;
    }

    // Resolve Proxy address based on mode
    const resolvedProxyAddress = useManualProxyInput  ? proxyAddress : manualProxyAddress;

    if (!resolvedProxyAddress) {
      handleError("Proxy address is missing");
      return;
    }

    // Resolve Withdraw address based on mode
    const resolvedWithdrawAddress = useManualWithdrawInput ? withdrawAddress : manualWithdrawAddress;

    if (!resolvedWithdrawAddress) {
      handleError("Withdraw address is missing");
      return;
    }

    try {
      // Validate Proxy address
      validateHexString(resolvedProxyAddress, 40);
      const formattedProxyAddress = formatAddress(resolvedProxyAddress);
      const validProxyAddress = ethers.getAddress(formattedProxyAddress);
      addLog("Valid proxy Address: " + validProxyAddress);

      const proxyContract = new ethers.Contract(validProxyAddress, proxyArtifact.abi, signer);

       // Validate Withdraw address
       validateHexString(resolvedWithdrawAddress, 40);
       const formattedWihdrawAddress = formatAddress(resolvedWithdrawAddress);
       const validWithdrawAddress = ethers.getAddress(formattedWihdrawAddress);
       addLog("Valid Withdraw Address: " + validWithdrawAddress);

      // Excute Proxy contract's addTransaction
      const tx = await proxyContract.addTransaction(validWithdrawAddress, true);
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

      {/* Mode switch */}
      <InputGroup className="mb-3">
        <Form.Check
          type="switch"
          id="manual-auto-switch"
          label={useManualProxyInput ? "Manual Mode" : "Auto Mode"}
          checked={useManualProxyInput}
          onChange={() => setUseManualProxyInput(!useManualProxyInput)}
        />
      </InputGroup>

      {/* Input field for manual Proxy address */}
      {useManualProxyInput && (
        <InputGroup className="mb-3">
          <Form.Control
            type="text"
            placeholder="Enter Proxy address as hex string"
            value={manualProxyAddress}
            onChange={(e) => setManualProxyAddress(e.target.value)}
            required
          />
        </InputGroup>
      )}

      {/* Withdraw Mode switch */}
      <InputGroup className="mb-3">
        <Form.Check
          type="switch"
          id="manual-withdraw-switch"
          label={useManualWithdrawInput ? "Manual Withdraw Mode" : "Auto Withdraw Mode"}
          checked={useManualWithdrawInput}
          onChange={() => setUseManualWithdrawInput(!useManualWithdrawInput)}
        />
      </InputGroup>

      {/* Input field for manual Withdraw address */}
      {useManualWithdrawInput && (
        <InputGroup className="mb-3">
          <Form.Control
            type="text"
            placeholder="Enter Withdraw address as hex string"
            value={manualWithdrawAddress}
            onChange={(e) => setManualWithdrawAddress(e.target.value)}
            required
          />
        </InputGroup>
      )}

      {/* Add TX Button */}
      <Button className="addTX" variant="primary" onClick={handleAddTX} disabled={addTXEnabled}>
        ADD TX
      </Button>
    </>
  )
}