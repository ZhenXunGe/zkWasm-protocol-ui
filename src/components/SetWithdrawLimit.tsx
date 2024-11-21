
import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useState } from 'react';

interface SetWithdrawLimitProps {
  signer: ethers.JsonRpcSigner | null;
  proxyAddress: string | null,
  actionEnabled: boolean;
  setShowErrorModal: React.Dispatch<React.SetStateAction<boolean>>;
  setModalMessage: React.Dispatch<React.SetStateAction<string>>
}

export function SetWithdrawLimit({signer, proxyAddress, actionEnabled, setShowErrorModal, setModalMessage}: SetWithdrawLimitProps) {
  const [withdrawLimit, setWithdrawLimit] = useState('');

  const validateWithdrawLimit = (value: string) => {
    if (!/^(0x)?[0-9a-fA-F]{1,64}$/.test(value)) {
      return "Invalid withdrawLimit. Must be a valid hex string.";
    }
    return null;
  };

  const handleSetWithdrawLimit = async () => {
    if (!signer || !proxyAddress || !withdrawLimit) {
      setShowErrorModal(true);
      setModalMessage("Signer, Proxy address or withdrawLimit is missing");
      return;
    }

    const errorMessage = validateWithdrawLimit(withdrawLimit);
    if (errorMessage) {
      setShowErrorModal(true);
      setModalMessage(errorMessage);
      return;
    }

    try {
      const proxyContract = new ethers.Contract(proxyAddress, proxyArtifact.abi, signer);

      // If withdrawLimit starts with "0x", remove "0x"
      const withdrawLimitNoPrefix = withdrawLimit.startsWith("0x") ? withdrawLimit.slice(2) : withdrawLimit;

      // Convert hex string to BigInt
      const withdrawLimitBigInt = BigInt("0x" + withdrawLimitNoPrefix);

      const tx = await proxyContract.setWithdrawLimit(withdrawLimitBigInt);
      console.log("Transaction sent:", tx.hash);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt.hash);
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Status:", receipt.status === 1 ? "Success" : "Failure");

      console.log("withdrawLimit changed successfully!");
    } catch (error) {
      setShowErrorModal(true);
      setModalMessage("Error changing withdrawLimit:" + error);
    }
  }

  return (
    <div>
      <h4>Set Withdraw Limit</h4>
      <Form.Group controlId="formMerkle">
        <Form.Control
          type="text"
          placeholder="Enter max withdraw amount per settle"
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