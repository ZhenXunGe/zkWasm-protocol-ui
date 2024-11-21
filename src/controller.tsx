import React from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import "./components/style.css";
import { ethers, Eip1193Provider, BrowserProvider } from 'ethers';
import { useState, useMemo } from 'react';
import { BN } from "bn.js";
import { useAppSelector, useAppDispatch } from "./app/hooks";
import {
  setProxyAddress,
  setWithdrawAddress,
  setDummyVerifierAddress,
  selectProxyAddress,
  selectWithdrawAddress,
  selectDummyVerifierAddress
} from './data/contractSlice';
import { ErrorModal } from "./components/ErrorModal";
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import withdrawArtifact from "zkWasm-protocol/artifacts/contracts/actions/Withdraw.sol/Withdraw.json";
import dummyVerifierArtifact from "zkWasm-protocol/artifacts/contracts/DummyVerifier.sol/DummyVerifier.json";
import { SetOwner } from './components/SetOwner';
import { SetMerkle } from './components/SetMerkle';
import { SetSettler } from './components/SetSettler';
import { SetWithdrawLimit } from './components/SetWithdrawLimit';
import { QueryAllTokens } from './components/QueryAllTokens';
import { AddToken } from './components/AddToken';
import { TopUp } from './components/TopUp';
import { SetVerifierImageCommitments } from './components/SetVerifierImageCommitments';
const providerUrl = process.env["REACT_APP_PROVIDER_URL"];
const initialRoot = new Uint8Array([166, 157, 178, 62, 35, 83, 140, 56, 9, 235, 134, 184, 20, 145, 63, 43, 245, 186, 75, 233, 43, 42, 187, 217, 104, 152, 219, 89, 125, 199, 161, 9]);

// extend window interface for ts to recognize ethereum
declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

interface ProxyInfo {
  chain_id: bigint,
  amount_token: bigint,
  amount_pool: bigint,
  owner: string,
  merkle_root: bigint,
  rid: bigint,
  verifier: bigint
}

export function Buttons() {
  const [deployEnabled, setDeployEnabled] = useState(false);
  const [addTxEnabled, setAddTxEnabled] = useState(false);
  const [actionEnabled, setActionEnabled] = useState(true);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null); // Store the connected signer
  const [walletConnected, setWalletConnected] = useState(false); // Track if the wallet is connected
  const [accountAddress, setAccountAddress] = useState<string | null>(null); // Store the connected account address
  const [queryAddress, setQueryAddress] = useState('');
  const [proxyInfo, setProxyInfo] = useState<ProxyInfo>();
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const dispatch = useAppDispatch();
  const proxyAddress = useAppSelector(selectProxyAddress);
  const withdrawAddress = useAppSelector(selectWithdrawAddress);
  const dummyVerifierAddress = useAppSelector(selectDummyVerifierAddress);

  // Use useMemo to make sure provider is created once
  const provider = useMemo(() => {
    // Use BrowserProvider to get browser wallet's signer
    if (window.ethereum) {
      return new BrowserProvider(window.ethereum, "any");
    } else {
      return new ethers.JsonRpcProvider(providerUrl);
    }
  }, []);

  const handleConnectWallet = async () => {
    if (window.ethereum) {
      try {
        const browserProvider = new BrowserProvider(window.ethereum, "any");
        const signer = await browserProvider.getSigner();
        setSigner(signer);  // Set the signer once
        setWalletConnected(true);  // Mark wallet as connected
        const accountAddress = await signer.getAddress();  // Get the connected account address
        setAccountAddress(accountAddress);  // Store account address
        console.log("Wallet connected:", signer, "Address:", accountAddress);
      } catch (error) {
        setShowErrorModal(true);
        setModalMessage("Error connecting wallet:" + error);
      }
    } else {
      setShowErrorModal(true);
      setModalMessage("No Ethereum wallet found");
    }
  };

  async function deployContract(artifact: any, params: any[] = []) {
    if (!signer) {
      setShowErrorModal(true);
      setModalMessage("No signer found, please connect wallet first");
      return;
    }

    // Get abi and bytecode
    const abi = artifact.abi;
    const bytecode = artifact.bytecode;

    // Create a ContractFactory instance
    const factory = new ethers.ContractFactory(abi, bytecode, signer);

    // Deploy contract
    const contract = await factory.deploy(...params);
    await contract.waitForDeployment();

    // Get contract address
    const address = await contract.getAddress();
    console.log(`Contract deployed at: ${address}`);

    return address;
  }

  const handleDeploy = async () => {
    if (!signer) {
      setShowErrorModal(true);
      setModalMessage("No signer found, please connect wallet first");
      return;
    }

    if (proxyAddress) {
      setShowErrorModal(true);
      setModalMessage("Proxy contract is already deployed");
      return;
    }

    try {
      // Prepare params for Proxy contract
      const { chainId } = await provider.getNetwork();
      console.log("netid:", chainId);
      const rootBn = new BN(initialRoot, 16, "be");
      const rootBigInt = BigInt("0x" + rootBn.toString(16));

      // Deploy Proxy
      const proxyAddress = await deployContract(proxyArtifact, [chainId, rootBigInt]);
      dispatch(setProxyAddress(proxyAddress!));

      // Deploy Withdraw
      const withdrawAddress = await deployContract(withdrawArtifact);
      dispatch(setWithdrawAddress(withdrawAddress!));

      // Deploy DummyVerifier
      const dummyVerifierAddress = await deployContract(dummyVerifierArtifact);
      dispatch(setDummyVerifierAddress(dummyVerifierAddress!));

      setDeployEnabled(true);
      setActionEnabled(false);
    } catch (error) {
      setShowErrorModal(true);
      setModalMessage("Error deploying contracts:" + error);
    }
  };

  const handleAddTX = async () => {
    if (!signer || !proxyAddress || !withdrawAddress) {
      setShowErrorModal(true);
      setModalMessage("Signer, Proxy or Withdraw address is missing");
      return;
    }

    try {
      const proxyContract = new ethers.Contract(proxyAddress, proxyArtifact.abi, signer);

      // Excute Proxy contract's addTransaction
      const tx = await proxyContract.addTransaction(withdrawAddress, true);
      console.log("Transaction sent:", tx.hash);

      // Wait the transaction confirmed
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt.hash);
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Status:", receipt.status === 1 ? "Success" : "Failure");

      console.log("Transaction added successfully!");
      setAddTxEnabled(true);
    } catch (error) {
      setShowErrorModal(true);
      setModalMessage("Error adding transaction:" + error);
    }
  }

  const handleSetVerifier = async () => {
    if (!signer || !proxyAddress || !dummyVerifierAddress) {
      setShowErrorModal(true);
      setModalMessage("Signer, Proxy or Dummy Verifier address is missing");
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

      console.log("Verifier set successfully!");
    } catch (error) {
      setShowErrorModal(true);
      setModalMessage("Error setting verifier:" + error);
    }
  }

  const handleChange = (event: any) => {
    setQueryAddress(event.target.value);
  };

  const handleCloseModal = () => setShowErrorModal(false);

  const queryProxyInfo = async () => {
    setProxyInfo(undefined);

    if (!signer || !queryAddress) {
      setShowErrorModal(true);
      setModalMessage("Signer or query address is missing");
      return;
    }

    try {
      const proxyContract = new ethers.Contract(queryAddress, proxyArtifact.abi, signer);
      const proxyInfo = await proxyContract.getProxyInfo();
      setProxyInfo(proxyInfo);
    } catch (error) {
      setShowErrorModal(true);
      setModalMessage(String(error));
    }
  }

  return (
    <>
      {!walletConnected ? (
        <Button className="connectWallet" variant="primary" onClick={handleConnectWallet}>
          CONNECT WALLET
        </Button>
      ) : (
        <>
          <p>Connected Wallet: {accountAddress}</p> {/* Display the connected account address */}
          <div>
            <h2>Add New Contracts</h2>
            <div className="steps">
              <Button variant="primary" onClick={handleDeploy} disabled={deployEnabled}>
                DEPLOY CONTRACT
              </Button>
            </div>
            <h3>Contract Actions</h3>
            <div className="steps">
              <Button variant="primary" onClick={handleAddTX} disabled={actionEnabled}>
                ADDTX
              </Button>
            </div>
            <div className="steps">
              <Button variant="primary" onClick={handleSetVerifier} disabled={actionEnabled}>
                SET VERIFIER
              </Button>
            </div>
            <div className="steps">
              <Button variant="primary" onClick={handleSetVerifier} disabled={actionEnabled}>
                SET VERIFIER IMAGE COMMITMENTS
              </Button>
            </div>
          </div>
          <div className="steps">
            <SetVerifierImageCommitments
              signer={signer}
              proxyAddress={proxyAddress}
              actionEnabled={actionEnabled}
              setShowErrorModal={setShowErrorModal}
              setModalMessage={setModalMessage}
            />
          </div>
          <div className="steps">
            <AddToken
              signer={signer}
              proxyAddress={proxyAddress}
              actionEnabled={actionEnabled}
              setShowErrorModal={setShowErrorModal}
              setModalMessage={setModalMessage}
            />
          </div>
          <div className="steps">
            <TopUp
              signer={signer}
              proxyAddress={proxyAddress}
              actionEnabled={actionEnabled}
              setShowErrorModal={setShowErrorModal}
              setModalMessage={setModalMessage}
            />
          </div>
          <div className="steps">
            <SetOwner
              signer={signer}
              proxyAddress={proxyAddress}
              actionEnabled={actionEnabled}
              setShowErrorModal={setShowErrorModal}
              setModalMessage={setModalMessage}
            />
          </div>
          <div className="steps">
            <SetMerkle
              signer={signer}
              proxyAddress={proxyAddress}
              actionEnabled={actionEnabled}
              setShowErrorModal={setShowErrorModal}
              setModalMessage={setModalMessage}
            />
          </div>
          <div className="steps">
            <SetSettler
              signer={signer}
              proxyAddress={proxyAddress}
              actionEnabled={actionEnabled}
              setShowErrorModal={setShowErrorModal}
              setModalMessage={setModalMessage}
            />
          </div>
          <div className="steps">
            <SetWithdrawLimit
              signer={signer}
              proxyAddress={proxyAddress}
              actionEnabled={actionEnabled}
              setShowErrorModal={setShowErrorModal}
              setModalMessage={setModalMessage}
            />
          </div>
          <div className="steps">
            <QueryAllTokens
              signer={signer}
              proxyAddress={proxyAddress}
              actionEnabled={actionEnabled}
              setShowErrorModal={setShowErrorModal}
              setModalMessage={setModalMessage}
            />
          </div>
          <div>
            <h2>Query Existing Proxy</h2>
            <InputGroup className="mb-3">
              <Button variant="primary" onClick={queryProxyInfo}>
                QUERY
              </Button>
              <Form.Control
                placeholder="Proxy Address"
                aria-label="QueryAddress"
                aria-describedby="basic-addon1"
                value={queryAddress}
                onChange={handleChange}
                className="queryAddress"
              />
            </InputGroup>
            {proxyInfo ? (
              <div className="proxyInfo">
                <p><strong>Chain ID:</strong> {proxyInfo.chain_id.toString()}</p>
                <p><strong>Amount Token:</strong> {proxyInfo.amount_token.toString()}</p>
                <p><strong>Amount Pool:</strong> {proxyInfo.amount_pool.toString()}</p>
                <p><strong>Owner:</strong> {proxyInfo.owner}</p>
                <p><strong>Merkle Root:</strong> {proxyInfo.merkle_root.toString()}</p>
                <p><strong>RID:</strong> {proxyInfo.rid.toString()}</p>
                <p><strong>Verifier:</strong> {proxyInfo.verifier.toString()}</p>
              </div>
            ) : (
              <div className="proxyInfo">
              </div>
            )}
          </div>
        </>
      )}
      <ErrorModal
        show={showErrorModal}
        onClose={handleCloseModal}
        message={modalMessage}
      />
    </>
  )
}