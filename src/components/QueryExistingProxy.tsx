import React, { useState } from "react";
import { ethers } from 'ethers';
import { FaHandPointer } from "react-icons/fa";
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import { QueryExistingProxyProps } from '../main/props';
import { ProxyContent } from "../main/types";
import { formatAddress, validateHexString } from "../main/utils";
import { fetchChainName, formatErrorMessage } from '../main/utils';
import { Button, Form, InputGroup, Spinner, Table } from "react-bootstrap";
import { SetWithdrawLimitModal } from "../modals/SetWithdrawLimitModal";
import { TokenListModal } from "../modals/TokenListModal";
import { fetchTokens } from "../main/utils";
import { SetMerkleModal } from "../modals/SetMerkleModal";
import { SetOwnerModal } from "../modals/SetOwnerModal";
import { SetSettlerModal } from "../modals/SetSettlerModal";
import { SetVerifierImgCommitModal } from "../modals/SetVerifierImgCommitModal";
import { useAppSelector } from "../app/hooks";
import { selectChains } from "../data/contractSlice";

export function QueryExistingProxy({
  signer,
  proxyAddress,
  withdrawAddress,
  verifierAddress,
  setActiveTab,
  addLog
}: QueryExistingProxyProps) {
  const [manualProxyAddress, setManualProxyAddress] = useState(""); // Proxy address now user-inputted
  const [useManualProxyInput, setuseManualProxyInput] = useState(false); // Switch for manual/Auto Proxy Mode
  const [manualVerifierAddress, setManualVerifierAddress] = useState(""); // Verifier address now user-inputted
  const [useManualVerifierInput, setUseManualVerifierInput] = useState(false); // Switch for manual/Auto Verifier Mode
  const [manualWithdrawAddress, setManualWithdrawAddress] = useState(""); // Withdraw address now user-inputted
  const [useManualWithdrawInput, setUseManualWithdrawInput] = useState(false); // Switch for manual/Auto Withdraw Mode

  const [proxyContent, setProxyContent] = useState<ProxyContent | null>(null); // Store query results
  const [isLoading, setIsLoading] = useState(false);
  const [showWithdrawLimitModal, setShowWithdrawLimitModal] = useState(false);
  const [showTokenListModal, setShowTokenListModal] = useState(false);
  const [showSetMerkleModal, setShowSetMerkleModal] = useState(false);
  const [showSetOwnerModal, setShowSetOwnerModal] = useState(false);
  const [showSetSettlerModal, setShowSetSettlerModal] = useState(false);
  const [showSetVerifierImgCommitModal, setShowSetVerifierImgCommitModal] = useState(false);
  const [currentProxy, setCurrentProxyContract] = useState<ethers.Contract | null>(null);
  const [tokenList, setTokenList] = useState<string[]>([]);
  const [isSettingVerifier, setIsSettingVerifier] = useState(false);
  const [isAddingTX, setIsAddingTX] = useState(false);
  const chainsState = useAppSelector(selectChains);

  const handleAddTX = async () => {
    try {
      // Resolve Withdraw address based on mode
      const resolvedWithdrawAddress = useManualWithdrawInput ? manualWithdrawAddress.trim(): withdrawAddress;
      if (!resolvedWithdrawAddress) throw new Error("Withdraw address is missing");

      setIsAddingTX(true);

      // Validate Withdraw address
      validateHexString(resolvedWithdrawAddress, 40);
      const formattedWihdrawAddress = formatAddress(resolvedWithdrawAddress);
      const validWithdrawAddress = ethers.getAddress(formattedWihdrawAddress);
      addLog("contractAddr", "Valid Withdraw address: " + validWithdrawAddress);

      // Excute Proxy contract's addTransaction
      const tx = await currentProxy!.addTransaction(validWithdrawAddress, true);
      addLog("info", "Transaction sent")
      addLog("txhash", tx.hash, proxyContent!.chain_id.toString());

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      addLog("info", "Transaction confirmed. Gas used: " + receipt.gasUsed.toString());
      const statusRes = receipt.status === 1 ? "Success" : "Failure";
      addLog("info", "Status: " + statusRes);

      // Qeury transaction address
      const address = await currentProxy!._get_transaction(0n); //opcode of withdraw is 0x0
      addLog("contractAddr", "Current transaction address: " + address);

      addLog("success", "Transaction added successfully!");
      queryProxyInfo();
      setIsAddingTX(false);
    } catch (error) {
      const err = formatErrorMessage(error);
      addLog("error", `Error adding transaction: ${err}`);
    } finally {
      setIsAddingTX(false);
    }
  }

  const handleSetVerifier = async () => {
    try {
      // Resolve Verifier address based on mode
      const resolvedVerifierAddress = useManualVerifierInput ? manualVerifierAddress.trim() : verifierAddress;
      if (!resolvedVerifierAddress) throw new Error("Verifier address is missing");

      setIsSettingVerifier(true);

      // Validate Verifier address
      validateHexString(resolvedVerifierAddress, 40);
      const formattedVerifierAddress = formatAddress(resolvedVerifierAddress);
      const validVerifierAddress = ethers.getAddress(formattedVerifierAddress);
      addLog("contractAddr", "Valid Verifier address: " + validVerifierAddress);

      const tx = await currentProxy!.setVerifier(validVerifierAddress);
      addLog("info", "Transaction sent")
      addLog("txhash", tx.hash, proxyContent!.chain_id.toString());

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      addLog("info", "Transaction confirmed. Gas used: " + receipt.gasUsed.toString());
      const statusRes = receipt.status === 1 ? "Success" : "Failure";
      addLog("info", "Status: " + statusRes);

      // Qeury verifier address
      const address = await currentProxy!.verifier();
      addLog("contractAddr", "Current Verifier address: " + address);

      addLog("success", "Verifier set successfully!");
      queryProxyInfo();
      setIsSettingVerifier(false);
    } catch (error) {
      const err = formatErrorMessage(error);
      addLog("error", `Error setting verifier: ${err}`);
    } finally {
      setIsSettingVerifier(false);
    }
  }

  const queryProxyInfo = async () => {
    try {
      if (!signer) {
        throw new Error("Please connect your wallet before submitting any requests!");
      }

      // Resolve Proxy address based on mode
      const resolvedProxyAddress = useManualProxyInput ? manualProxyAddress.trim() : proxyAddress;
      if (!resolvedProxyAddress) throw new Error("Proxy address is missing");

      setIsLoading(true);

      // Validate Proxy address
      validateHexString(resolvedProxyAddress, 40);
      const formattedProxyAddress = formatAddress(resolvedProxyAddress);
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
          console.log("End of transactions array");
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
        chainName,
        withdrawLimit: etherWithdrawLimit,
        transactions,
        settler: BigInt(settler),
        zk_image_commitments: zkImageCommitmentsStr,
        chain_id: proxyInfo.chain_id,
        amount_token: proxyInfo.amount_token,
        amount_pool: proxyInfo.amount_pool,
        owner: proxyInfo.owner,
        merkle_root: proxyInfo.merkle_root,
        rid: proxyInfo.rid,
        verifier: proxyInfo.verifier,
      });

      setCurrentProxyContract(proxyContract);
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
      <p>Use the toggle switch to switch between:</p>
      <ul>
        <li><strong>Manual Mode</strong>: Enter the existing contract address manually.</li>
        <li>
          <strong>Auto Mode</strong>: Use the contract address generated during the deployment
          process in the <span className="startTip" onClick={() => setActiveTab("start")}>Start from Scratch</span> panel.
        </li>
      </ul>

      {/* Mode switch */}
      <InputGroup>
        <Form.Check
          type="switch"
          id="manual-auto-switch"
          label={useManualProxyInput ? "Manual Proxy Mode 🔧" : "Auto Proxy Mode 🚀"}
          checked={useManualProxyInput}
          onChange={() => setuseManualProxyInput(!useManualProxyInput)}
          style={{ cursor: "pointer", fontWeight: "bold", color: "#007bff" }}
          title="Click to toggle between Manual and Auto modes"
        />
      </InputGroup>
      <FaHandPointer
        className="pointer-icon"
        title="Click to toggle between Manual and Auto modes"
      />

      {/* Input field for manual Proxy address */}
      <InputGroup className="mb-3">
        <InputGroup.Text>Proxy Address</InputGroup.Text>
        <Form.Control
          type="text"
          placeholder="Enter a valid 40-character Proxy address (e.g., 0x12...)"
          value={useManualProxyInput ? manualProxyAddress : proxyAddress || "No deployed Proxy address available. Go to 'Start from Scratch' panel to deploy Proxy contract."}
          onChange={(e) => setManualProxyAddress(e.target.value)}
          disabled={!useManualProxyInput}
          required
        />
      </InputGroup>

      {/* Withdraw Mode switch */}
      <InputGroup>
        <Form.Check
          type="switch"
          id="manual-withdraw-switch"
          label={useManualWithdrawInput ? "Manual Withdraw Mode 🔧" : "Auto Withdraw Mode 🚀"}
          checked={useManualWithdrawInput}
          onChange={() => setUseManualWithdrawInput(!useManualWithdrawInput)}
          style={{ cursor: "pointer", fontWeight: "bold", color: "#007bff" }}
          title="Click to toggle between Manual and Auto modes"
        />
      </InputGroup>
      <FaHandPointer
        className="pointer-icon"
        title="Click to toggle between Manual and Auto modes"
      />

      {/* Input field for manual Withdraw address */}
      <InputGroup className="mb-3">
        <InputGroup.Text>Withdraw Address</InputGroup.Text>
        <Form.Control
          type="text"
          placeholder="Enter a valid 40-character Withdraw address (e.g., 0x12...)"
          value={useManualWithdrawInput ? manualWithdrawAddress : withdrawAddress || "No deployed Withdraw address available. Go to 'Start from Scratch' panel to deploy Withdraw contract."}
          onChange={(e) => setManualWithdrawAddress(e.target.value)}
          disabled={!useManualWithdrawInput}
          required
        />
      </InputGroup>

      {/* Mode switch */}
      <InputGroup>
        <Form.Check
          type="switch"
          id="manual-verifier-switch"
          label={useManualVerifierInput ? "Manual Verifier Mode 🔧" : "Auto Verifier Mode 🚀"}
          checked={useManualVerifierInput}
          onChange={() => setUseManualVerifierInput(!useManualVerifierInput)}
          style={{ cursor: "pointer", fontWeight: "bold", color: "#007bff" }}
          title="Click to toggle between Manual and Auto modes"
        />
      </InputGroup>
      <FaHandPointer
        className="pointer-icon"
        title="Click to toggle between Manual and Auto modes"
      />

      {/* Input field for manual Verifier address */}
      <InputGroup className="mb-3">
        <InputGroup.Text>Verifier Address</InputGroup.Text>
        <Form.Control
          type="text"
          placeholder="Enter a valid 40-character Verifier address (e.g., 0x12...)"
          value={useManualVerifierInput ? manualVerifierAddress : verifierAddress || "No deployed Verifier address available. Go to 'Start from Scratch' panel to deploy Verifier contract."}
          onChange={(e) => setManualVerifierAddress(e.target.value)}
          disabled={!useManualVerifierInput}
          required
        />
      </InputGroup>

      {/* Query Button */}
      <Button variant="primary" onClick={queryProxyInfo} disabled={isLoading}>
        {isLoading ? <Spinner animation="border" size="sm" /> : "QUERY EXISTING PROXY"}
      </Button>

      {/* Proxy Content Table */}
      {proxyContent && (
      <>
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
              <td>Chain ID</td>
              <td className="tableValue">{proxyContent.chain_id.toString()}</td>
              <td className="tableAct"><span style={{ color: "#ccc" }}>N/A</span></td>
            </tr>
            <tr>
              <td>Chain Name</td>
              <td className="tableValue">{proxyContent.chainName}</td>
              <td className="tableAct"><span style={{ color: "#ccc" }}>N/A</span></td>
            </tr>
            <tr>
              <td>Rid(This shows how many times the contract has been settled)</td>
              <td className="tableValue">{proxyContent.rid.toString()}</td>
              <td className="tableAct"><span style={{ color: "#ccc" }}>N/A</span></td>
            </tr>
            <tr>
              <td>Token Amount</td>
              <td className="tableValue">
                { proxyContent.amount_token.toString() !== "0" ? proxyContent.amount_token.toString() : "No Tokens Available"}
              </td>
              <td className="tableAct"><span style={{ color: "#ccc" }}>N/A</span></td>
            </tr>
            <tr>
              <td>Pool Amount</td>
              <td className="tableValue">
                { proxyContent.amount_pool.toString() !== "0" ? proxyContent.amount_pool.toString() : "No Pools Available"}
              </td>
              <td className="tableAct"><span style={{ color: "#ccc" }}>N/A</span></td>
            </tr>
            <tr>
              <td>Token List</td>
              <td className="tableValue">
                {tokenList.length > 0 ? `${tokenList.length} Tokens Available` : "No Tokens Available"}
              </td>
              <td className="tableAct">
                <Button variant="primary" size="sm" className="me-2" onClick={() => setShowTokenListModal(true)}>
                  View Tokens
                </Button>
              </td>
            </tr>
            <tr>
              <td>Transactions</td>
              <td className="tableValue">
                {proxyContent.transactions.length !== 0 ? proxyContent.transactions : "No Transactions Available"}
              </td>
              <td className="tableAct">
                <Button variant="primary" size="sm" onClick={handleAddTX} disabled={isAddingTX || proxyContent.transactions.length !== 0}>
                  {isAddingTX ? <Spinner animation="border" size="sm" /> : "Add TX"}
                </Button>
              </td>
            </tr>
            <tr>
              <td>Withdraw Limit</td>
              <td className="tableValue">{proxyContent.withdrawLimit} ETH</td>
              <td className="tableAct">
                <Button variant="primary" size="sm" onClick={() => setShowWithdrawLimitModal(true)}>
                  Set Limit
                </Button>
              </td>
            </tr>
            <tr>
              <td>Owner</td>
              <td className="tableValue">{proxyContent.owner.toString(16)}</td>
              <td className="tableAct">
                <Button variant="primary" size="sm"  onClick={() => setShowSetOwnerModal(true)}>Set Owner</Button>
              </td>
            </tr>
            <tr>
              <td>Merkle Root</td>
              <td className="tableValue">0x{proxyContent.merkle_root.toString(16)}</td>
              <td className="tableAct">
                <Button variant="primary" size="sm" onClick={() => setShowSetMerkleModal(true)}>
                  Set Root
                </Button>
              </td>
            </tr>
            <tr>
              <td>Settler</td>
              <td className="tableValue">
                { proxyContent.settler !== 0n ? "0X" + proxyContent.settler.toString(16) : "No Settler Available"}
              </td>
              <td className="tableAct">
                <Button variant="primary" size="sm"  onClick={() => setShowSetSettlerModal(true)}>
                  Set Settler
                </Button>
              </td>
            </tr>
            <tr>
              <td>Verifier Address</td>
              <td className="tableValue">
              { proxyContent.verifier.toString(16) !== "0" ? "0x" + proxyContent.verifier.toString(16) : "No Verifier Available"}
              </td>
              <td className="tableAct">
                <Button variant="primary" size="sm"  onClick={handleSetVerifier} disabled={isSettingVerifier}>
                  {isSettingVerifier ? <Spinner animation="border" size="sm" /> : "Set Verifier"}
                </Button>
              </td>
            </tr>
            <tr>
              <td>Verifier Image Commitments</td>
              <td className="tableValue">
              {proxyContent.zk_image_commitments[0] !== "0" ? (
                <ul>
                  {proxyContent.zk_image_commitments.map((commitment, index) => {
                    //if(commitment)
                    return (
                      <li key={index}>Commitment {index + 1}: {commitment}</li>
                    )})
                  }
                </ul>
              ) : (
                "No Commitments Available"
              )}
              </td>
              <td className="tableAct">
                <Button variant="primary" size="sm"  onClick={() => setShowSetVerifierImgCommitModal(true)}>
                  Set Commitments
                </Button>
              </td>
            </tr>
          </tbody>
        </Table>

        <SetWithdrawLimitModal
          show={showWithdrawLimitModal}
          onClose={() => setShowWithdrawLimitModal(false)}
          currentProxy={currentProxy!}
          queryProxyInfo = {queryProxyInfo}
          chainId={proxyContent!.chain_id.toString()}
        />
        <TokenListModal
          show={showTokenListModal}
          onClose={() => setShowTokenListModal(false)}
          currentProxy={currentProxy!}
          tokenList={tokenList}
          proxyAddress={proxyAddress}
          signer={signer}
          queryProxyInfo = {queryProxyInfo}
          chainId={proxyContent!.chain_id.toString()}
        />
        <SetMerkleModal
          show={showSetMerkleModal}
          onClose={() => setShowSetMerkleModal(false)}
          currentProxy={currentProxy!}
          queryProxyInfo = {queryProxyInfo}
          chainId={proxyContent!.chain_id.toString()}
        />
        <SetOwnerModal
          show={showSetOwnerModal}
          onClose={() => setShowSetOwnerModal(false)}
          currentProxy={currentProxy!}
          queryProxyInfo = {queryProxyInfo}
          chainId={proxyContent!.chain_id.toString()}
        />
        <SetSettlerModal
          show={showSetSettlerModal}
          onClose={() => setShowSetSettlerModal(false)}
          currentProxy={currentProxy!}
          queryProxyInfo = {queryProxyInfo}
          chainId={proxyContent!.chain_id.toString()}
        />
        <SetVerifierImgCommitModal
          show={showSetVerifierImgCommitModal}
          onClose={() => setShowSetVerifierImgCommitModal(false)}
          currentProxy={currentProxy!}
          queryProxyInfo = {queryProxyInfo}
          chainId={proxyContent!.chain_id.toString()}
        />
      </>
      )}
    </div>
  );
}