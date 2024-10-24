import React from 'react';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import "./button.css";
import { ethers, Eip1193Provider, BrowserProvider } from 'ethers';
import { useEffect, useState, useMemo } from 'react';
import { BN } from "bn.js";
import { useAppSelector, useAppDispatch } from "../app/hooks";
import {
  setProxyAddress,
  setWithdrawAddress,
  setDummyVerifierAddress,
  selectProxyAddress,
  selectWithdrawAddress,
  selectDummyVerifierAddress
} from '../data/contractSlice';

import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import withdrawArtifact from "zkWasm-protocol/artifacts/contracts/actions/Withdraw.sol/Withdraw.json";
import dummyVerifierArtifact from "zkWasm-protocol/artifacts/contracts/DummyVerifier.sol/DummyVerifier.json";

const providerUrl = process.env["REACT_APP_PROVIDER_URL"];
const initialRoot = new Uint8Array([166, 157, 178, 62, 35, 83, 140, 56, 9, 235, 134, 184, 20, 145, 63, 43, 245, 186, 75, 233, 43, 42, 187, 217, 104, 152, 219, 89, 125, 199, 161, 9]);

// extend window interface for ts to recognize ethereum
declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export function Buttons() {
  const [deployEnabled, setDeployEnabled] = useState(false);
  const [addTxEnabled, setAddTxEnabled] = useState(true);
  const [verifierEnabled, setVerifierEnabled] = useState(true);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null); // Store the connected signer
  const [walletConnected, setWalletConnected] = useState(false); // Track if the wallet is connected
  const [accountAddress, setAccountAddress] = useState<string | null>(null); // Store the connected account address

  const dispatch = useAppDispatch();
  const proxyAddress = useAppSelector(selectProxyAddress);
  const withdrawAddress = useAppSelector(selectWithdrawAddress);
  const dummyVerifierAddress = useAppSelector(selectDummyVerifierAddress);

  // Use useMemo to make sure provider is created once
  const provider = useMemo(() => {
    // Use Web3Provider to get browser wallet's signer
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
        console.error("Error connecting wallet:", error);
      }
    } else {
      console.error("No Ethereum wallet found");
    }
  };

  async function deployContract(artifact: any, params: any[] = []) {
    if (!signer) {
      console.error("No signer found, please connect wallet first");
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
      console.error("No signer found, please connect wallet first");
      return;
    }

    if (proxyAddress) {
      console.error("Proxy contract is already deployed");
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
      setAddTxEnabled(false);
    } catch (error) {
      console.error("Error deploying contracts:", error);
    }
  };

  const handleAddTX = async () => {
    if (!signer || !proxyAddress || !withdrawAddress) {
      console.error("Signer, Proxy or Withdraw address is missing");
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
      setVerifierEnabled(false);
    } catch (error) {
      console.error("Error adding transaction:", error);
    }
  }

  const handleSetVerifier = async () => {
    if (!signer || !proxyAddress || !dummyVerifierAddress) {
      console.error("Signer, Proxy or Dummy Verifier address is missing");
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

      setVerifierEnabled(true);
    } catch (error) {
      console.error("Error setting verifier:", error);
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
          <div className="steps">
            <div className="sequence">&#9312;</div>
            <Button variant="primary" onClick={handleDeploy} disabled={deployEnabled}>
              DEPLOY CONTRACT
            </Button>
          </div>
          <div className="steps">
            <div className="sequence">&#9313;</div>
            <Button variant="primary" onClick={handleAddTX} disabled={addTxEnabled}>
              ADDTX
            </Button>
          </div>
          <div className="steps">
            <div className="sequence">&#9314;</div>
            <Button variant="primary" onClick={handleSetVerifier} disabled={verifierEnabled}>
              SET VERIFIER
            </Button>
          </div>
        </>
      )}
    </>
  )
}