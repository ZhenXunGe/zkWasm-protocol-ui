
import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useState } from 'react';

interface SetSettlerProps {
  signer: ethers.JsonRpcSigner | null;
  proxyAddress: string | null,
  actionEnabled: boolean;
  setShowErrorModal: React.Dispatch<React.SetStateAction<boolean>>;
  setModalMessage: React.Dispatch<React.SetStateAction<string>>
}

export function SetSettler({signer, proxyAddress, actionEnabled, setShowErrorModal, setModalMessage}: SetSettlerProps) {
  const [newSettler, setNewSettler] = useState('');

  // Make sure the settler address is valid
  const isValidAddress = (address: string) => {
    return ethers.isAddress(address);
  };

  const handleSetSettler = async () => {
    if (!signer || !proxyAddress || !newSettler) {
      setShowErrorModal(true);
      setModalMessage("Signer, Proxy or settler address is missing");
      return;
    }

    // Validate new owner address
    if (!isValidAddress(newSettler)) {
      setShowErrorModal(true);
      setModalMessage("Invalid address. Please enter a valid Ethereum address.");
      return;
    }

    try {
      const proxyContract = new ethers.Contract(proxyAddress, proxyArtifact.abi, signer);

      const tx = await proxyContract.setSettler();
      console.log("Transaction sent:", tx.hash);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt.hash);
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Status:", receipt.status === 1 ? "Success" : "Failure");

      console.log("Settler changed successfully!");
    } catch (error) {
      setShowErrorModal(true);
      setModalMessage("Error changing settler:" + error);
    }
  }

  return (
    <div>
      <h4>Set New Settler</h4>
      <Form.Group controlId="formNewSettler">
        <Form.Control
          type="text"
          placeholder="Enter new settler address"
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