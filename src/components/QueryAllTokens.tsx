import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import Form from 'react-bootstrap/Form';
import { QueryAllTokensProps } from '../main/props';
import { useLogger } from '../main/logger/LoggerContext';
import { formatAddress, validateHexString, queryAllTokens } from "../main/helps";
import { useState } from 'react';

export function QueryAllTokens({signer, proxyAddress, actionEnabled, handleError}: QueryAllTokensProps) {
  const [manualProxyAddress, setManualProxyAddress] = useState(""); // Proxy address now user-inputted
  const [useManualInput, setUseManualInput] = useState(true); // Switch for manual/auto mode
  const { addLog, clearLogs } = useLogger();

  const handleQueryAllTokens = async () => {
    if (!signer) {
      handleError("Signer is missing");
      return;
    }

    // Resolve Proxy address based on mode
    const resolvedProxyAddress = useManualInput ? proxyAddress : manualProxyAddress;

    if (!resolvedProxyAddress) {
      handleError("Proxy address is missing");
      return;
    }

    clearLogs(); // Clear existing logs

    try {
      // Validate Proxy address
      validateHexString(resolvedProxyAddress, 40);
      const formattedProxyAddress = formatAddress(resolvedProxyAddress);
      const validProxyAddress = ethers.getAddress(formattedProxyAddress);
      addLog("Valid proxy Address: " + validProxyAddress);

      const proxyContract = new ethers.Contract(validProxyAddress, proxyArtifact.abi, signer);
      queryAllTokens(proxyContract, addLog);
    } catch (error) {
      handleError("Error querying tokens:" + error);
    }
  }

  return (
    <div>
      <h4>Query All Tokens</h4>

      {/* Mode switch */}
      <InputGroup className="mb-3">
        <Form.Check
          type="switch"
          id="manual-auto-switch"
          label={useManualInput ? "Manual Mode" : "Auto Mode"}
          checked={useManualInput}
          onChange={() => setUseManualInput(!useManualInput)}
        />
      </InputGroup>

      {/* Input field for manual Proxy address */}
      {useManualInput && (
        <InputGroup className="mb-3">
          <Form.Control
            type="text"
            placeholder="Enter Proxy address as hex string"
            value={manualProxyAddress}
            onChange={(e) => setManualProxyAddress(e.target.value)}
            required
          />
        </InputGroup>
      )}

      <InputGroup className="mb-3">
        <Button className="" variant="primary" onClick={handleQueryAllTokens} disabled={actionEnabled}>
          QUERY ALL TOKENS
        </Button>
      </InputGroup>
    </div>
  )
}