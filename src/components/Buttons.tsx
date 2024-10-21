import React from 'react';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import "./button.css";
import { ethers } from 'ethers';
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

const providerUrl = process.env["PROVIDER_URL"];
const initialRoot = new Uint8Array([166, 157, 178, 62, 35, 83, 140, 56, 9, 235, 134, 184, 20, 145, 63, 43, 245, 186, 75, 233, 43, 42, 187, 217, 104, 152, 219, 89, 125, 199, 161, 9]);

export function Buttons() {
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();

  const proxyAddress = useAppSelector(selectProxyAddress);
  const withdrawAddress = useAppSelector(selectWithdrawAddress);
  const dummyVerifierAddress = useAppSelector(selectDummyVerifierAddress);

  // Use useMemo to make sure provider is created once
  const provider = useMemo(() => new ethers.JsonRpcProvider(providerUrl), []);

  async function deployContract(artifact: any, params: any[] = []) {
    // Get abi and bytecode
    const abi = artifact.abi;
    const bytecode = artifact.bytecode;
  
    // Create a ContractFactory instance
    const signer = await provider.getSigner();
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
    if (proxyAddress) {
      console.error("Proxy contract is already deployed");
      return;
    }

    setLoading(true);
    try {
      // Prepare params for Proxy contract
      const { chainId } = await provider.getNetwork()
      console.log("netid:", chainId);
      const rootBn = new BN(initialRoot, 16, "be");
      const rootBigInt = BigInt("0x" + rootBn.toString(16));

      // Deploy Proxy
      const proxyAddress = await deployContract(proxyArtifact, [chainId, rootBigInt]);
      dispatch(setProxyAddress(proxyAddress));

      // Deploy Withdraw
      const withdrawAddress = await deployContract(withdrawArtifact);
      dispatch(setWithdrawAddress(withdrawAddress));

      // Deploy DummyVerifier
      const dummyVerifierAddress = await deployContract(dummyVerifierArtifact);
      dispatch(setDummyVerifierAddress(dummyVerifierAddress));

      setLoading(false);
    } catch (error) {
      console.error("Error deploying contracts:", error);
    }
  };

  const handleAddTX = async () => {
    if (!proxyAddress || !withdrawAddress) {
      console.error("Proxy or Withdraw address is missing");
      return;
    }

    setLoading(true);
    try {
      const signer = await provider.getSigner();
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

      setLoading(false);
    } catch (error) {
      console.error("Error adding transaction:", error);
    }
  }

  const handleSetVerifier = async () => {
    if (!proxyAddress || !dummyVerifierAddress) {
      console.error("Proxy or Dummy Verifier address is missing");
      return;
    }

    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const proxyContract = new ethers.Contract(proxyAddress, proxyArtifact.abi, signer);

      const tx = await proxyContract.setVerifier(dummyVerifierAddress);
      console.log("Transaction sent:", tx.hash);

      // Wait the transaction confirmed
      const receipt = await tx.wait(); 
      console.log("Transaction confirmed:", receipt.hash);
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Status:", receipt.status === 1 ? "Success" : "Failure");


      console.log("Verifier set successfully!");

      setLoading(false);
    } catch (error) {
      console.error("Error setting verifier:", error);
    }
  }

  return (
    <>
      <div className="steps">
        <div className="sequence">&#9312;</div>
        <Button variant="primary" onClick={handleDeploy} disabled={loading}>
          DEPLOY CONTRACT
        </Button>
      </div>
      <div className="steps">
        <div className="sequence">&#9313;</div>
        <Button variant="primary" onClick={handleAddTX} disabled={loading}>
          ADDTX
        </Button>
      </div>
      <div className="steps">
        <div className="sequence">&#9314;</div>
        <Button variant="primary" onClick={handleSetVerifier}>
          SET VERIFIER
        </Button>
      </div>
    </>
  )
}