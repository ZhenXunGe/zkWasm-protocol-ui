import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import { SetVerifierProps } from '../main/props';

export function SetVerifier({signer, proxyAddress, actionEnabled, dummyVerifierAddress, handleError}: SetVerifierProps) {
  const handleSetVerifier = async () => {
    if (!signer || !proxyAddress || !dummyVerifierAddress) {
      handleError("Signer, Proxy or Dummy Verifier address is missing");
      return;
    }

    try {
      const proxyContract = new ethers.Contract(proxyAddress, proxyArtifact.abi, signer);

      const tx = await proxyContract.setVerifier(dummyVerifierAddress);
      console.log("Transaction sent:", tx.hash);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt.hash);
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Status:", receipt.status === 1 ? "Success" : "Failure");

      alert("Verifier set successfully!");
    } catch (error) {
      handleError("Error setting verifier:" + error);
    }
  }

  return (
    <div>
      <h4>Set Verifier</h4>
      <Button variant="primary" onClick={handleSetVerifier} disabled={actionEnabled}>
        SET VERIFIER
      </Button>
    </div>
  )
}