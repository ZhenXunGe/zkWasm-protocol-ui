import React, { useMemo, useState } from "react";
import { ethers, BrowserProvider } from 'ethers';
import { QueryExistingProxyProps } from '../main/props';
import { ProxyContent } from "../main/types";
import { formatAddress, validateHexString } from "../main/utils";
import { fetchChainName, formatErrorMessage } from '../main/utils';
import { Button, Form, Alert, InputGroup, Spinner, Table } from "react-bootstrap";
import { SetWithdrawLimitModal } from "../modals/SetWithdrawLimitModal";
import { TokenList } from "./TokenList";
import { deployContract, fetchTokens } from "../main/utils";
import { SetMerkleModal } from "../modals/SetMerkleModal";
import { AddTokenModal } from "../modals/AddTokenModal";
import { SetOwnerModal } from "../modals/SetOwnerModal";
import { SetSettlerModal } from "../modals/SetSettlerModal";
import { SetVerifierImgCommitModal } from "../modals/SetVerifierImgCommitModal";
import { SetVerifierModal } from "../modals/SetVerifierModal";
import { useAppSelector, useAppDispatch } from "../app/hooks";
import { addProxyAddress, selectChains } from "../data/contractSlice";
import { AddTXModal } from "../modals/AddTXModal";
import { selectProxyAddressHistory } from "../data/contractSlice";
import BN from "bn.js";
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";

const initialRoot = new Uint8Array([166, 157, 178, 62, 35, 83, 140, 56, 9, 235, 134, 184, 20, 145, 63, 43, 245, 186, 75, 233, 43, 42, 187, 217, 104, 152, 219, 89, 125, 199, 161, 9]);
const providerUrl = process.env["REACT_APP_PROVIDER_URL"];

export function QueryExistingProxy({
  signer,
  addLog
}: QueryExistingProxyProps) {
  const [proxyContent, setProxyContent] = useState<ProxyContent | null>(null); // Store query results
  const [isLoading, setIsLoading] = useState(false);
  const [showWithdrawLimitModal, setShowWithdrawLimitModal] = useState(false);
  const [showTokenListModal, setShowTokenListModal] = useState(false);
  const [showAddTokenModal, setShowAddTokenModal] = useState(false);
  const [showSetMerkleModal, setShowSetMerkleModal] = useState(false);
  const [showSetOwnerModal, setShowSetOwnerModal] = useState(false);
  const [showSetSettlerModal, setShowSetSettlerModal] = useState(false);
  const [showSetVerifierImgCommitModal, setShowSetVerifierImgCommitModal] = useState(false);
  const [showSetVerifierModal, setShowSetVerifierModal] = useState(false);
  const [showAddTXModal, setShowAddTXModal] = useState(false);
  const [currentProxy, setCurrentProxy] = useState<ethers.Contract | null>(null);
  const [tokenList, setTokenList] = useState<string[]>([]);
  const [proxyAddress, setProxyAddress] = useState('');
  const [mode, setMode] = useState<"history" | "deploy">("history");
  const [deployedProxyAddress, setDeployedProxyAddress] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const chainsState = useAppSelector(selectChains);
  const proxyAddressHistory = useAppSelector(selectProxyAddressHistory);
  const dispatch = useAppDispatch();

  // Use useMemo to make sure provider is created once
  const provider = useMemo(() => {
    // Use BrowserProvider to get browser wallet's signer
    if (window.ethereum) {
      return new BrowserProvider(window.ethereum, "any");
    } else {
      return new ethers.JsonRpcProvider(providerUrl);
    }
  }, []);

  const DeployProxy = ({
    onDeploySuccess
  }: { onDeploySuccess: (address: string) => void }) => {
    const handleDeploy = async () => {
      try {
        if (!signer) {
          throw new Error("Please connect your wallet before submitting any requests!");
        }
        setIsDeploying(true);

        // Prepare params for Proxy contract
        const { chainId } = await provider.getNetwork();
        const chainName = await fetchChainName(chainsState.chains, chainId);
        addLog("info", `chainId:, ${chainId}(chain name: ${chainName})`, `${chainId}`);
        const rootBn = new BN(initialRoot, 16, "be");
        const rootBigInt = BigInt("0x" + rootBn.toString(16));

        addLog("info", `Starting deployment of Proxy contract. Plesae wait...`, `${chainId}`);
        const contractAddress = await deployContract(
          "Proxy",
          proxyArtifact,
          [chainId, rootBigInt],
          chainId.toString(),
          addLog,
          signer
        );
        setDeployedProxyAddress(contractAddress);
        onDeploySuccess(contractAddress);
        dispatch(addProxyAddress(contractAddress));
        setIsDeploying(false);
        setProxyContent(null);
        addLog("info", `Click the "Query Existing Proxy" button to continue.`, `${chainId}`);
      } catch (error: any) {
        const err = formatErrorMessage(error);
        addLog("error", `Error deploying contracts: ${err}.`, "");
      } finally {
        setIsDeploying(false);
      }
    };

    return (
      <div>
        <Button variant="primary" onClick={handleDeploy} disabled={isDeploying}>
          {isDeploying ? <Spinner animation="border" size="sm" /> : 'Deploy Proxy Contract'}
        </Button>
      </div>
    );
  };

  const queryProxyInfo = async () => {
    try {
      if (!signer) {
        throw new Error("Please connect your wallet before submitting any requests!");
      }

      setIsLoading(true);

      // Validate Proxy address
      validateHexString(proxyAddress, 40);
      const formattedProxyAddress = formatAddress(proxyAddress);
      const validProxyAddress = ethers.getAddress(formattedProxyAddress);
      addLog("contractAddr", "Valid Proxy address: " + validProxyAddress);

      // Get proxy info
      const proxyContract = new ethers.Contract(validProxyAddress, proxyArtifact.abi, signer);
      const proxyInfo = await proxyContract.getProxyInfo().catch(() => {
        // proxyContract.getProxyInfo is a view function
        // if throw error, maybe the address is not belong to Proxy
        throw new Error("The address may not belong to a Proxy contract");
      });
      const chainName = await fetchChainName(chainsState.chains, proxyInfo.chain_id);
      const withdrawLimit = await proxyContract.withdrawLimit();
      const etherWithdrawLimit = ethers.formatEther(withdrawLimit);

      // Get transactions
      let i = 0;
      let transactions = [];
      while (true) {
        try {
          let transaction = await proxyContract._get_transaction(i);
          transactions.push(transaction.toString(16));
          i++;
        } catch (error) {
          break;
        }
      }

      // Get Verifier Image Commitments
      const commitCount = 3;
      const zk_image_commitments = [];
      for (let i = 0; i < commitCount; i++) {
        const zk_image_commitment = await proxyContract.zk_image_commitments(i);
        zk_image_commitments.push(zk_image_commitment);
      }
      const zkImageCommitmentsStr = zk_image_commitments.map((txn: bigint) => txn.toString());

      const settler = await proxyContract.getSettler();

      setProxyContent({
        proxyAddress: validProxyAddress,
        chainName,
        withdrawLimit: etherWithdrawLimit,
        transactions,
        settler: settler,
        zk_image_commitments: zkImageCommitmentsStr,
        chain_id: proxyInfo.chain_id,
        amount_token: proxyInfo.amount_token,
        owner: proxyInfo.owner,
        merkle_root: proxyInfo.merkle_root,
        rid: proxyInfo.rid,
        verifier: proxyInfo.verifier,
      });

      setCurrentProxy(proxyContract);
      fetchTokens(proxyContract, addLog).then((tokens) => {
        setTokenList(tokens);
      });

      addLog("success", "Proxy info retrieved successfully!");
    } catch (error: any) {
      let err = formatErrorMessage(error);
      addLog("error", `Error querying existing Proxy: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Step 1 */}
      <div className="step">
        <h5>Step 1: Select Proxy Address</h5>
        <p>
          A Proxy Address is a unique identifier that represents the smart contract Proxy deployed on the blockchain.
          It allows users and applications to interact with the Proxy contract and perform various actions such as querying data or executing functions.
        </p>
        <p>
          Select <strong>Use Existing Proxy Address</strong> and provide the address in the input field,
          or select <strong>Deploy New Proxy Contract</strong> by clicking the
          <strong> Deploy Proxy Contract</strong> button to deploy a new Proxy contract.
        </p>
        <Form className="mb-2">
          <Form.Check
            type="radio"
            label="Use Existing Proxy Address"
            name="txMode"
            checked={mode === "history"}
            onChange={() => setMode("history")}
          />
          <Form.Check
            type="radio"
            label="Deploy New Proxy Contract"
            name="txMode"
            checked={mode === "deploy"}
            onChange={() => setMode("deploy")}
            className="mb-2"
          />
          {mode === 'history' && (
            <>
              <InputGroup className="mb-1">
                <InputGroup.Text>Proxy Address</InputGroup.Text>
                <Form.Control
                  as="input"
                  list="proxy-history-options"
                  placeholder="Enter or select a valid 40-character Proxy address (e.g., 0x12...)"
                  value={proxyAddress}
                  onChange={(e) => {
                    setProxyAddress(e.target.value);
                    setProxyContent(null);
                  }}
                  title="You can manually enter a 40-character Proxy address or select one from the dropdown options."
                />
                <datalist id="proxy-history-options">
                  {proxyAddressHistory.map((address, index) => (
                    <option key={index} value={address} />
                  ))}
                </datalist>
              </InputGroup>
              <Form.Text className="tip">
                You can manually enter a 40-character Proxy address or select one from the dropdown options, which include contracts you deployed during this session of using the app.
                This session refers to the time you have this UI open.
              </Form.Text>
            </>
          )}
          {mode === 'deploy' && (
            <>
              <DeployProxy onDeploySuccess={setProxyAddress} />
              {deployedProxyAddress && (
                <div className="mt-3">
                  <Alert variant="success">
                    <strong>Latest Deployed Proxy Address:</strong>
                    <code>{deployedProxyAddress}</code>
                  </Alert>
                </div>
              )}
            </>
          )}
        </Form>
      </div>

      {/* Step 2 */}
      <div className="step mt-4">
      <h5>Step 2: Query Proxy Info</h5>
        <p>
          Click the <strong>Query Existing Proxy</strong> button to fetch details of the selected or
          deployed proxy.
        </p>
        <div title={!proxyAddress ? "Please select Proxy address in step 1" : ""}>
          <Button variant="primary" onClick={queryProxyInfo} disabled={isLoading || !proxyAddress}>
            {isLoading ? <Spinner animation="border" size="sm" /> : "Query Existing Proxy"}
          </Button>
          {!proxyAddress && <p className="mt-2">Please select Proxy address in step 1</p>}
        </div>
      </div>

      {/* Step 3 */}
      <div className="step mt-4">
        <h5>Step 3: Perform Actions in Info Table</h5>
        <p>
          All subsequent actions can be performed directly in the <strong>Info Table</strong> based
          on the query results.
        </p>
        {/* Info Table placeholder */}
        {proxyContent ? (
          <>
            <h5>Proxy Info (Current Address: {proxyContent.proxyAddress || 'N/A'})</h5>
            <Table striped bordered hover className="mt-3 proxyContentTable">
              <thead>
                <tr>
                  <th>Field</th>
                  <th className="tableValue">Value</th>
                  <th className="tableAct">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="tableField">Chain ID</td>
                  <td className="tableValue">{proxyContent.chain_id.toString()}</td>
                  <td className="tableAct"><span style={{ color: "#ccc" }}>N/A</span></td>
                </tr>
                <tr>
                  <td className="tableField">Chain Name</td>
                  <td className="tableValue">{proxyContent.chainName}</td>
                  <td className="tableAct"><span style={{ color: "#ccc" }}>N/A</span></td>
                </tr>
                <tr>
                  <td className="tableField">Owner</td>
                  <td className="tableValue">{proxyContent.owner.toString(16)}</td>
                  <td className="tableAct">
                    <Button variant="primary" size="sm" onClick={() => setShowSetOwnerModal(true)}>Set Owner</Button>
                  </td>
                </tr>
                <tr>
                  <td className="tableField">Settler</td>
                  <td className="tableValue">
                    {Number(proxyContent.settler) !== 0 ? proxyContent.settler.toString() : "No Settler Available"}
                  </td>
                  <td className="tableAct">
                    <Button variant="primary" size="sm" onClick={() => setShowSetSettlerModal(true)}>
                      Set Settler
                    </Button>
                  </td>
                </tr>
                <tr>
                  <td className="tableField">Merkle Root</td>
                  <td className="tableValue">0x{proxyContent.merkle_root.toString(16)}</td>
                  <td className="tableAct">
                    <Button variant="primary" size="sm" onClick={() => setShowSetMerkleModal(true)}>
                      Set Root
                    </Button>
                  </td>
                </tr>
                <tr>
                  <td className="tableField">Verifier Address</td>
                  <td className="tableValue">
                    {Number(proxyContent.verifier) !== 0 ? "0x" + proxyContent.verifier.toString(16) : "No Verifier Available"}
                  </td>
                  <td className="tableAct">
                    <Button variant="primary" size="sm" onClick={() => setShowSetVerifierModal(true)}>
                      Set Verifier
                    </Button>
                  </td>
                </tr>
                <tr>
                  <td className="tableField">Rid(This shows how many times the contract has been settled)</td>
                  <td className="tableValue">{proxyContent.rid.toString()}</td>
                  <td className="tableAct"><span style={{ color: "#ccc" }}>N/A</span></td>
                </tr>
                <tr>
                  <td className="tableField">Withdraw Limit</td>
                  <td className="tableValue">{proxyContent.withdrawLimit} ETH</td>
                  <td className="tableAct">
                    <Button variant="primary" size="sm" onClick={() => setShowWithdrawLimitModal(true)}>
                      Set Limit
                    </Button>
                  </td>
                </tr>
                <tr>
                  <td className="tableField">Verifier Image Commitments</td>
                  <td className="tableValue">
                    {proxyContent.zk_image_commitments[0] !== "0" ? (
                      <ul>
                        {proxyContent.zk_image_commitments.map((commitment, index) => {
                          return (
                            <li key={index}>Commitment {index + 1}: {commitment}</li>
                          )
                        })
                        }
                      </ul>
                    ) : (
                      "No Commitments Available"
                    )}
                  </td>
                  <td className="tableAct">
                    <Button variant="primary" size="sm" onClick={() => setShowSetVerifierImgCommitModal(true)}>
                      Set Commitments
                    </Button>
                  </td>
                </tr>
                <tr>
                  <td className="tableField">Transactions</td>
                  <td className="tableValue">
                    {proxyContent.transactions.length !== 0 ? proxyContent.transactions : "No Transactions Available"}
                  </td>
                  <td className="tableAct">
                    {proxyContent.transactions.length !== 0 ? (
                      <div title="Add TX can only be executed once.">
                        <Button variant="primary" size="sm" onClick={() => setShowAddTXModal(true)} disabled>
                          Add TX
                        </Button>
                      </div>
                    ) : (
                      <Button variant="primary" size="sm" onClick={() => setShowAddTXModal(true)} title="Add TX can only be executed once.">
                        Add TX
                      </Button>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="tableField">Token Amount</td>
                  <td className="tableValue">
                    {proxyContent.amount_token.toString()}
                  </td>
                  <td className="tableAct"><span style={{ color: "#ccc" }}>N/A</span></td>
                </tr>
                <tr>
                  <td className="tableField">Token List</td>
                  <td className="tableValue">
                    <TokenList
                      show={showTokenListModal}
                      onClose={() => setShowTokenListModal(false)}
                      currentProxy={currentProxy!}
                      tokenList={tokenList}
                      proxyAddress={proxyAddress}
                      signer={signer}
                      queryProxyInfo={queryProxyInfo}
                      chainId={proxyContent!.chain_id.toString()}
                    />
                  </td>
                  <td className="tableAct">
                    <Button
                      variant="primary"
                      size="sm"
                      className="me-2"
                      onClick={() => setShowAddTokenModal(true)}>
                      Add Token
                    </Button>
                  </td>
                </tr>
              </tbody>
            </Table>

            <SetWithdrawLimitModal
              show={showWithdrawLimitModal}
              onClose={() => setShowWithdrawLimitModal(false)}
              currentProxy={currentProxy!}
              queryProxyInfo={queryProxyInfo}
              chainId={proxyContent!.chain_id.toString()}
            />
            <SetMerkleModal
              show={showSetMerkleModal}
              onClose={() => setShowSetMerkleModal(false)}
              currentProxy={currentProxy!}
              queryProxyInfo={queryProxyInfo}
              chainId={proxyContent!.chain_id.toString()}
            />
            <SetOwnerModal
              show={showSetOwnerModal}
              onClose={() => setShowSetOwnerModal(false)}
              currentProxy={currentProxy!}
              queryProxyInfo={queryProxyInfo}
              chainId={proxyContent!.chain_id.toString()}
            />
            <SetSettlerModal
              show={showSetSettlerModal}
              onClose={() => setShowSetSettlerModal(false)}
              currentProxy={currentProxy!}
              queryProxyInfo={queryProxyInfo}
              chainId={proxyContent!.chain_id.toString()}
            />
            <SetVerifierImgCommitModal
              show={showSetVerifierImgCommitModal}
              onClose={() => setShowSetVerifierImgCommitModal(false)}
              currentProxy={currentProxy!}
              queryProxyInfo={queryProxyInfo}
              chainId={proxyContent!.chain_id.toString()}
            />
            <AddTokenModal
              show={showAddTokenModal}
              onClose={() => setShowAddTokenModal(false)}
              currentProxy={currentProxy!}
              queryProxyInfo={queryProxyInfo}
              chainId={proxyContent!.chain_id.toString()}
            />
            <SetVerifierModal
              show={showSetVerifierModal}
              onClose={() => setShowSetVerifierModal(false)}
              currentProxy={currentProxy!}
              queryProxyInfo={queryProxyInfo}
              chainId={proxyContent!.chain_id.toString()}
              signer={signer}
            />
            <AddTXModal
              show={showAddTXModal}
              onClose={() => setShowAddTXModal(false)}
              currentProxy={currentProxy!}
              queryProxyInfo={queryProxyInfo}
              chainId={proxyContent!.chain_id.toString()}
              signer={signer}
            />
          </>
        ) : <div>Click "Query Existing Proxy" in step 2 to fetch data for the new Proxy address</div>}
      </div>
    </div>
  );
}