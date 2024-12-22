import React from "react";
import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { useState } from 'react';
import { SetVerifierImageCommitmentsProps } from '../main/props';
import { formatAddress, removeHexPrefix, validateHexString } from "../main/helps";
import { useLogger } from '../main/logger/LoggerContext';

export function SetVerifierImageCommitments({signer, proxyAddress, actionEnabled, handleError}: SetVerifierImageCommitmentsProps) {
  const [commitment1, setCommitment1] = useState('');
  const [commitment2, setCommitment2] = useState('');
  const [commitment3, setCommitment3] = useState('');
  const [manualProxyAddress, setManualProxyAddress] = useState(""); // Proxy address now user-inputted
  const [useManualProxyInput, setuseManualProxyInput] = useState(true); // Switch for manual/Auto Proxy Mode
  const { addLog, clearLogs } = useLogger();

  const handleSetCommitments = async () => {
    try {
      if (!signer || !commitment1 || !commitment2 || !commitment3) {
        throw new Error("Signer or commitment is missing");
      }

      // Resolve Proxy address based on mode
      const resolvedProxyAddress = useManualProxyInput ? manualProxyAddress : proxyAddress;

      if (!resolvedProxyAddress) {
        throw new Error("Proxy address is missing");
      }

      clearLogs(); // Clear existing logs

      validateHexString(commitment1);
      validateHexString(commitment2);
      validateHexString(commitment3);

      // Validate Proxy address
      validateHexString(resolvedProxyAddress, 40);
      const formattedProxyAddress = formatAddress(resolvedProxyAddress);
      const validProxyAddress = ethers.getAddress(formattedProxyAddress);
      addLog("Valid Proxy address: " + validProxyAddress);

      const proxyContract = new ethers.Contract(validProxyAddress, proxyArtifact.abi, signer);

      const commitments = [
        BigInt("0x" + removeHexPrefix(commitment1)),
        BigInt("0x" + removeHexPrefix(commitment2)),
        BigInt("0x" + removeHexPrefix(commitment3)),
      ];
      const tx = await proxyContract.setVerifierImageCommitments(commitments);
      addLog("Transaction sent: " + tx.hash);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      addLog("Transaction confirmed: " + receipt.hash);
      addLog("Gas used: " + receipt.gasUsed.toString());
      const statusRes = receipt.status === 1 ? "Success" : "Failure";
      addLog("Status: " + statusRes);

      // Qeury zk_image_commitments
      const commitments1 = await proxyContract.zk_image_commitments(0);
      const commitments2 = await proxyContract.zk_image_commitments(1);
      const commitments3 = await proxyContract.zk_image_commitments(2);
      addLog(`Current zk_image_commitments: [${commitments1}, ${commitments2}, ${commitments3}]`);

      addLog("Commitments set successfully!");
    } catch (error) {
      handleError("Error changing root:" + error);
    }
  };

  return (
    <div>
      <h4>Set Verifier Image Commitments</h4>

      {/* Mode switch */}
      <InputGroup className="mb-3">
        <Form.Check
          type="switch"
          id="manual-auto-switch"
          label={useManualProxyInput ? "Manual Proxy Mode" : "Auto Proxy Mode"}
          checked={useManualProxyInput}
          onChange={() => setuseManualProxyInput(!useManualProxyInput)}
        />
      </InputGroup>

      {/* Input field for manual Proxy address */}
      <InputGroup className="mb-3">
        <InputGroup.Text>Proxy Address</InputGroup.Text>
        <Form.Control
          type="text"
          placeholder="Enter Proxy address as hex string"
          value={useManualProxyInput ? manualProxyAddress : proxyAddress || "No deployed Proxy address available"}
          onChange={(e) => setManualProxyAddress(e.target.value)}
          disabled={!useManualProxyInput}
          required
        />
      </InputGroup>

      <InputGroup className="mb-3">
        <InputGroup.Text>Commitment 1</InputGroup.Text>
        <Form.Control
          type="text"
          placeholder="Enter Commitment 1 as hex string(uint256)"
          value={commitment1}
          onChange={(e) => setCommitment1(e.target.value)}
          required
        />
      </InputGroup>

      <InputGroup className="mb-3">
        <InputGroup.Text>Commitment 2</InputGroup.Text>
        <Form.Control
          type="text"
          placeholder="Enter Commitment 2 as hex string(uint256)"
          value={commitment2}
          onChange={(e) => setCommitment2(e.target.value)}
          required
        />
      </InputGroup>

      <InputGroup className="mb-3">
        <InputGroup.Text>Commitment 3</InputGroup.Text>
        <Form.Control
          type="text"
          placeholder="Enter Commitment 3 as hex string(uint256)"
          value={commitment3}
          onChange={(e) => setCommitment3(e.target.value)}
          required
        />
      </InputGroup>

      <div>
        <Button className="setVerifierImgCom" variant="primary" onClick={handleSetCommitments} disabled={actionEnabled}>
          SET VERIFIER IMAGE COMMITMENTS
        </Button>
      </div>
    </div>
  )
}