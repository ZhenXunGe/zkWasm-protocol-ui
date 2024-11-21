
import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useState } from 'react';

interface SetVerifierImageCommitmentsProps {
  signer: ethers.JsonRpcSigner | null;
  proxyAddress: string | null,
  actionEnabled: boolean;
  setShowErrorModal: React.Dispatch<React.SetStateAction<boolean>>;
  setModalMessage: React.Dispatch<React.SetStateAction<string>>
}

export function SetVerifierImageCommitments({signer, proxyAddress, actionEnabled, setShowErrorModal, setModalMessage}: SetVerifierImageCommitmentsProps) {
  const [newRoot, setNewRoot] = useState('');

  const validateMerkleRoot = (value: string) => {
    if (!/^(0x)?[0-9a-fA-F]{1,64}$/.test(value)) {
      return "Invalid Merkle root. Must be a valid hex string.";
    }
    return null;
  };

  const handleSetMerkle = async () => {
    if (!signer || !proxyAddress || !newRoot) {
      setShowErrorModal(true);
      setModalMessage("Signer, Proxy address or new root is missing");
      return;
    }

    const errorMessage = validateMerkleRoot(newRoot);
    if (errorMessage) {
      setShowErrorModal(true);
      setModalMessage(errorMessage);
      return;
    }

    try {
      const proxyContract = new ethers.Contract(proxyAddress, proxyArtifact.abi, signer);

      // If newRoot starts with "0x", remove "0x"
      const rootNoPrefix = newRoot.startsWith("0x") ? newRoot.slice(2) : newRoot;

      // Convert hex string to BigInt
      const rootBigInt = BigInt("0x" + rootNoPrefix);

      const tx = await proxyContract.setMerkle(rootBigInt);
      console.log("Transaction sent:", tx.hash);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt.hash);
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Status:", receipt.status === 1 ? "Success" : "Failure");

      console.log("Root changed successfully!");
    } catch (error) {
      setShowErrorModal(true);
      setModalMessage("Error changing root:" + error);
    }
  }

  return (
    <div>
      <h4>Set Merkle</h4>
      <form onSubmit={handleSubmit}>
    <label htmlFor="commitment1">Commitment 1</label>
    <input 
        type="number" 
        id="commitment1" 
        value={commitment1} 
        onChange={(e) => setCommitment1(e.target.value)} 
        required
    />
    
    <label htmlFor="commitment2">Commitment 2</label>
    <input 
        type="number" 
        id="commitment2" 
        value={commitment2} 
        onChange={(e) => setCommitment2(e.target.value)} 
        required
    />
    
    <label htmlFor="commitment3">Commitment 3</label>
    <input 
        type="number" 
        id="commitment3" 
        value={commitment3} 
        onChange={(e) => setCommitment3(e.target.value)} 
        required
    />
    
    <button type="submit">Set Commitments</button>
</form>
      <Button className="setMerkle" variant="primary" onClick={handleSetMerkle} disabled={actionEnabled}>
        SET MERKLE
      </Button>
    </div>
  )
}