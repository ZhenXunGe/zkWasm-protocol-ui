import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import { QueryAllTokensProps } from '../main/props';
import { useLogger } from '../main/logger/LoggerContext';
import { queryAllTokens } from "../main/helps";

export function QueryAllTokens({signer, proxyAddress, actionEnabled, handleError}: QueryAllTokensProps) {
  const { addLog, clearLogs } = useLogger();

  const handleQueryAllTokens = async () => {
    if (!signer || !proxyAddress) {
      handleError("Signer or Proxy address is missing");
      return;
    }

    clearLogs(); // Clear existing logs

    try {
      const proxyContract = new ethers.Contract(proxyAddress, proxyArtifact.abi, signer);
      queryAllTokens(proxyContract, addLog);
    } catch (error) {
      handleError("Error querying tokens:" + error);
    }
  }

  return (
    <div>
      <h4>Query All Tokens</h4>
      <InputGroup className="mb-3">
        <Button className="" variant="primary" onClick={handleQueryAllTokens} disabled={actionEnabled}>
          QUERY ALL TOKENS
        </Button>
      </InputGroup>
    </div>
  )
}