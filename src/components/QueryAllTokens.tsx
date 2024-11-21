
import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useState } from 'react';

interface QueryAllTokensProps {
  signer: ethers.JsonRpcSigner | null;
  proxyAddress: string | null,
  actionEnabled: boolean;
  setShowErrorModal: React.Dispatch<React.SetStateAction<boolean>>;
  setModalMessage: React.Dispatch<React.SetStateAction<string>>
}

interface Token {
  token_uid: bigint;
}

export function QueryAllTokens({signer, proxyAddress, actionEnabled, setShowErrorModal, setModalMessage}: QueryAllTokensProps) {
  const [tokens, setTokens] = useState("");

  const handleQueryAllTokens = async () => {
    if (!signer || !proxyAddress) {
      setShowErrorModal(true);
      setModalMessage("Signer or Proxy address is missing");
      return;
    }

    try {
      const proxyContract = new ethers.Contract(proxyAddress, proxyArtifact.abi, signer);
      const tokens = await proxyContract.allTokens();
      const tokenArray = tokens.map((token: Token) => ({
        tokenUid: token.token_uid
      }));
      const formattedTokens = JSON.stringify(tokenArray, null, 2);
      setTokens(formattedTokens);
    } catch (error) {
      setShowErrorModal(true);
      setModalMessage("Error querying tokens:" + error);
    }
  }

  return (
    <div>
      <h4>Query All Tokens</h4>
      <Form.Group controlId="formTokens" className="mt-3">
        <Form.Control
          as="textarea"
          rows={10}
          value={tokens}
          readOnly
          placeholder="Token information will appear here after querying..."
        />
      </Form.Group>
      <Button className="queryAllTokens" variant="primary" onClick={handleQueryAllTokens} disabled={actionEnabled}>
        QUERY ALL TOKENS
      </Button>
    </div>
  )
}