import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useState } from 'react';
import { SetWithdrawLimitProps } from '../main/props';
import { removeHexPrefix, validateHexString } from "../main/helps";

export function SetWithdrawLimit({signer, proxyAddress, actionEnabled, handleError}: SetWithdrawLimitProps) {
  const [withdrawLimit, setWithdrawLimit] = useState('');

  const handleSetWithdrawLimit = async () => {
    if (!signer || !proxyAddress || !withdrawLimit) {
      handleError("Signer, Proxy address or withdrawLimit is missing");
      return;
    }

    try {
      validateHexString(withdrawLimit);

      const proxyContract = new ethers.Contract(proxyAddress, proxyArtifact.abi, signer);

      // If withdrawLimit starts with "0x", remove "0x"
      const withdrawLimitNoPrefix =  removeHexPrefix(withdrawLimit);

      // Convert hex string to BigInt
      const withdrawLimitBigInt = BigInt("0x" + withdrawLimitNoPrefix);

      const tx = await proxyContract.setWithdrawLimit(withdrawLimitBigInt);
      console.log("Transaction sent:", tx.hash);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt.hash);
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Status:", receipt.status === 1 ? "Success" : "Failure");

      alert("withdrawLimit changed successfully!");
    } catch (error) {
      handleError("Error changing withdrawLimit:" + error);
    }
  }

  return (
    <div>
      <h4>Set Withdraw Limit</h4>
      <Form.Group controlId="formMerkle">
        <Form.Control
          type="text"
          placeholder="Enter max withdraw amount per settle as hex string(uint256)"
          value={withdrawLimit}
          onChange={(e) => setWithdrawLimit(e.target.value)}
          required
        />
      </Form.Group>
      <Button className="setWithdrawLimit" variant="primary" onClick={handleSetWithdrawLimit} disabled={actionEnabled}>
        SET Withdraw Limit
      </Button>
    </div>
  )
}