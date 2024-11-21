
import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useState } from 'react';

interface AddTokenProps {
  signer: ethers.JsonRpcSigner | null;
  proxyAddress: string | null,
  actionEnabled: boolean;
  setShowErrorModal: React.Dispatch<React.SetStateAction<boolean>>;
  setModalMessage: React.Dispatch<React.SetStateAction<string>>
}

export function AddToken({signer, proxyAddress, actionEnabled, setShowErrorModal, setModalMessage}: AddTokenProps) {
  const [token, setToken] = useState("");

  const handleAddToken = async () => {
    if (!signer || !proxyAddress || !token) {
      setShowErrorModal(true);
      setModalMessage("Signer, Proxy address or token is missing");
      return;
    }

    try {
      const proxyContract = new ethers.Contract(proxyAddress, proxyArtifact.abi, signer);

      // Check token format
      if (!/^(0x)?[0-9a-fA-F]+$/.test(token)) {
        throw new Error("Invalid token. Must be a valid hex string.");
      }

      const tx = await proxyContract.addToken(BigInt(token));
      console.log("Transaction sent:", tx.hash);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt.hash);
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Status:", receipt.status === 1 ? "Success" : "Failure");

      console.log("Token added successfully!");
    } catch (error) {
      setShowErrorModal(true);
      setModalMessage("Error adding token:" + error);
    }
  }

  return (
    <div>
      <h4>Add Token</h4>
      <Form.Group controlId="formToken">
        <Form.Control
          type="text"
          placeholder="Enter token as hex string"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          required
        />
      </Form.Group>
      <Button className="addToken" variant="primary" onClick={handleAddToken} disabled={actionEnabled}>
        ADD TOKEN
      </Button>
    </div>
  )
}