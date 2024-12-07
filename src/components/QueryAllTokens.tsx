import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import { QueryAllTokensProps } from '../main/props';
import { Token } from "../main/types";
import { useLogger } from '../main/logger/LoggerContext';

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
      const tokens = await proxyContract.allTokens();
      const tokenArray = tokens.map((token: Token) => ({
        tokenUid: token.token_uid.toString()
      }));

      if(tokenArray.length != 0) {
        for(let i = 0; i < tokenArray.length; i++) {
          addLog(JSON.stringify(tokenArray[i]));
        }
      } else {
        addLog("There no tokens");
      }
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