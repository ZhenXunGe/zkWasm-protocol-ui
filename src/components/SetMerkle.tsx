import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { useState } from 'react';
import { SetMerkleProps } from '../main/props';
import { removeHexPrefix, validateHexString } from "../main/helps";
import { useLogger } from '../main/logger/LoggerContext';

export function SetMerkle({signer, proxyAddress, actionEnabled, handleError}: SetMerkleProps) {
  const [newRoot, setNewRoot] = useState('');
  const { addLog, clearLogs } = useLogger();

  const handleSetMerkle = async () => {
    if (!signer || !proxyAddress || !newRoot) {
      handleError("Signer, Proxy address or new root is missing");
      return;
    }

    clearLogs(); // Clear existing logs

    try {
      validateHexString(newRoot);

      const proxyContract = new ethers.Contract(proxyAddress, proxyArtifact.abi, signer);

      const merkleBeforeSet = await proxyContract.merkle_root()
      addLog("merkle root before set merkle: " + merkleBeforeSet);

      // If newRoot starts with "0x", remove "0x"
      const rootNoPrefix = removeHexPrefix(newRoot);

      // Convert hex string to BigInt
      const rootBigInt = BigInt("0x" + rootNoPrefix);

      const tx = await proxyContract.setMerkle(rootBigInt);
      addLog("Transaction sent: " + tx.hash);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      addLog("Transaction confirmed: " + receipt.hash);
      addLog("Gas used: " + receipt.gasUsed.toString());
      let statueRes = receipt.status === 1 ? "Success" : "Failure";
      addLog("Status: " + statueRes);

      // Query current merkle root
      const proxyInfo = await proxyContract.getProxyInfo().catch(() => {
        // proxyContract.getProxyInfo is a view function
        // if throw error, maybe the address is not belong to Proxy
        handleError("Error querying existing Proxy: The address may not belong to a Proxy contract");
        return;
      });
      addLog("merkle root after set merkle:: " + proxyInfo.merkle_root);

      addLog("Root changed successfully!");
    } catch (error) {
      handleError("Error changing root:" + error);
    }
  }

  return (
    <div>
      <h4>Set Merkle</h4>
      <InputGroup className="mb-3">
        <Button className="setMerkle" variant="primary" onClick={handleSetMerkle} disabled={actionEnabled}>
          SET MERKLE
        </Button>
        <Form.Control
          type="text"
          placeholder="Enter new root as hex string(uint256)"
          value={newRoot}
          onChange={(e) => setNewRoot(e.target.value)}
          required
        />
      </InputGroup>
    </div>
  )
}