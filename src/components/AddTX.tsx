import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import { AddTXProps } from '../main/props';

export function AddTX({signer, proxyAddress, actionEnabled, withdrawAddress, handleError}: AddTXProps) {
  const handleAddTX = async () => {
    if (!signer || !proxyAddress || !withdrawAddress) {
      handleError("Signer, Proxy or Withdraw address is missing");
      return;
    }

    try {
      const proxyContract = new ethers.Contract(proxyAddress, proxyArtifact.abi, signer);

      // Excute Proxy contract's addTransaction
      const tx = await proxyContract.addTransaction(withdrawAddress, true);
      console.log("Transaction sent:", tx.hash);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt.hash);
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Status:", receipt.status === 1 ? "Success" : "Failure");

      alert("Transaction added successfully!");
    } catch (error) {
      handleError("Error adding transaction:" + error);
    }
  }

  return (
    <>
      <h4>Add Transaction</h4>
      <Button variant="primary" onClick={handleAddTX} disabled={actionEnabled}>
        ADDTX
      </Button>
    </>
  )
}