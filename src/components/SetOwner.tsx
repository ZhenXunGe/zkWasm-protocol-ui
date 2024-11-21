
import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useState } from 'react';

interface SetOwnerProps {
  signer: ethers.JsonRpcSigner | null;
  proxyAddress: string | null,
  actionEnabled: boolean;
  setShowErrorModal: React.Dispatch<React.SetStateAction<boolean>>;
  setModalMessage: React.Dispatch<React.SetStateAction<string>>
}

export function SetOwner({signer, proxyAddress, actionEnabled, setShowErrorModal, setModalMessage}: SetOwnerProps) {
  const [newOwner, setNewOwner] = useState('');

  // Make sure the owner address is valid
  const isValidAddress = (address: string) => {
    return ethers.isAddress(address);
  };

  const handleSetOwner = async () => {
    if (!signer || !proxyAddress || !newOwner) {
      setShowErrorModal(true);
      setModalMessage("Signer, Proxy or new owner address is missing");
      return;
    }

    // Validate new owner address
    if (!isValidAddress(newOwner)) {
      setShowErrorModal(true);
      setModalMessage("Invalid address. Please enter a valid Ethereum address.");
      return;
    }

    try {
      const proxyContract = new ethers.Contract(proxyAddress, proxyArtifact.abi, signer);

      const tx = await proxyContract.setOwner();
      console.log("Transaction sent:", tx.hash);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt.hash);
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Status:", receipt.status === 1 ? "Success" : "Failure");

      console.log("Owner changed successfully!");
    } catch (error) {
      setShowErrorModal(true);
      setModalMessage("Error changing owner:" + error);
    }
  }

  return (
    <div>
      <h4>Set New Owner</h4>
      <Form.Group controlId="formNewOwner">
        <Form.Control
          type="text"
          placeholder="Enter new owner address"
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
