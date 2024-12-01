import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import { useState } from 'react';
import { SetVerifierImageCommitmentsProps } from '../main/props';
import { removeHexPrefix, validateHexString } from "../main/helps";

export function SetVerifierImageCommitments({signer, proxyAddress, actionEnabled, handleError}: SetVerifierImageCommitmentsProps) {
  const [commitment1, setCommitment1] = useState('');
  const [commitment2, setCommitment2] = useState('');
  const [commitment3, setCommitment3] = useState('');

  const handleSetCommitments = async () => {
    if (!signer || !proxyAddress || !commitment1 || !commitment2 || !commitment3) {
      handleError("Signer, Proxy address or commitment is missing");
      return;
    }

    try {
      validateHexString(commitment1);
      validateHexString(commitment2);
      validateHexString(commitment3);

      const proxyContract = new ethers.Contract(proxyAddress, proxyArtifact.abi, signer);

      const commitments = [
        BigInt("0x" + removeHexPrefix(commitment1)),
        BigInt("0x" + removeHexPrefix(commitment2)),
        BigInt("0x" + removeHexPrefix(commitment3)),
      ];
      const tx = await proxyContract.setVerifierImageCommitments(commitments);
      console.log("Transaction sent:", tx.hash);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt.hash);
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Status:", receipt.status === 1 ? "Success" : "Failure");

      alert("Commitments set successfully!");
    } catch (error) {
      handleError("Error changing root:" + error);
    }
  };

  return (
    <div>
      <h4>SET VERIFIER IMAGE COMMITMENTS</h4>
      <div className="setCommitments">
        <label htmlFor="commitment1">Commitment 1</label>
        <input
          type="string"
          id="commitment1"
          value={commitment1}
          onChange={(e) => setCommitment1(e.target.value)}
          placeholder="Enter hex string(uint256)"
          required
        />
      </div>
      <div className="setCommitments">
        <label htmlFor="commitment2">Commitment 2</label>
        <input
          type="string"
          id="commitment2"
          value={commitment2}
          onChange={(e) => setCommitment2(e.target.value)}
          placeholder="Enter hex string(uint256)"
          required
        />
      </div>
      <div className="setCommitments">
        <label htmlFor="commitment3">Commitment 3</label>
        <input
          type="string"
          id="commitment3"
          value={commitment3}
          onChange={(e) => setCommitment3(e.target.value)}
          placeholder="Enter hex string(uint256)"
          required
        />
      </div>

      <div>
        <Button className="setMerkle" variant="primary" onClick={handleSetCommitments} disabled={actionEnabled}>
          SET VERIFIER IMAGE COMMITMENTS
        </Button>
      </div>
    </div>
  )
}