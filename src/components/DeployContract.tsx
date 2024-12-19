import React from "react";
import { useMemo, useState } from 'react';
import { ethers } from 'ethers';
import Button from 'react-bootstrap/Button';
import { useAppDispatch } from "../app/hooks";
import BN from "bn.js";
import { BrowserProvider } from 'ethers';
import { Action } from '@reduxjs/toolkit';
import { DeployContractProps } from '../main/props';
import {
  setProxyAddress,
  setWithdrawAddress,
  setDummyVerifierAddress
} from '../data/contractSlice';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import withdrawArtifact from "zkWasm-protocol/artifacts/contracts/actions/Withdraw.sol/Withdraw.json";
import dummyVerifierArtifact from "zkWasm-protocol/artifacts/contracts/DummyVerifier.sol/DummyVerifier.json";
import { useLogger } from '../main/logger/LoggerContext';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Alert from 'react-bootstrap/Alert';
import { LogViewer } from '../main/logger/LogViewer';

const initialRoot = new Uint8Array([166, 157, 178, 62, 35, 83, 140, 56, 9, 235, 134, 184, 20, 145, 63, 43, 245, 186, 75, 233, 43, 42, 187, 217, 104, 152, 219, 89, 125, 199, 161, 9]);
const providerUrl = process.env["REACT_APP_PROVIDER_URL"];

export const DeployContract = ({
  signer,
  proxyAddress,
  setActionEnabled,
  setAddTXEnabled,
  handleError
}: DeployContractProps) => {
  const dispatch = useAppDispatch();
  const [progress, setProgress] = useState(0);
  const [deployStatus, setDeployStatus] = useState<{ name: string; status: string }[]>([]);
  const [alreadyDeployed] = useState<Set<string>>(new Set());
  const { addLog } = useLogger();

  // Use useMemo to make sure provider is created once
  const provider = useMemo(() => {
    // Use BrowserProvider to get browser wallet's signer
    if (window.ethereum) {
      return new BrowserProvider(window.ethereum, "any");
    } else {
      return new ethers.JsonRpcProvider(providerUrl);
    }
  }, []);

  async function deployContract(name: string, artifact: any, params: bigint[], dispatchAction: (address: string) => Action) {
    // Get abi and bytecode
    const abi = artifact.abi;
    const bytecode = artifact.bytecode;

    // Create a ContractFactory instance
    const factory = new ethers.ContractFactory(abi, bytecode, signer);
    addLog("ContractFactory created successfully...");

    // Deploy contract
    const contract = await factory.deploy(...params);
    addLog(`Transaction sent for ${name}: ${contract.deploymentTransaction()!.hash}`);

    await contract.waitForDeployment();

    // Get contract address
    const address = await contract.getAddress();

    addLog(`${name} deployed successfully at ${address}`);

    dispatch(dispatchAction(address));
  }

  const deployAllContracts = async (chainId: bigint, rootBigInt: bigint) => {
    const contracts = [
      { name: "Proxy", artifact: proxyArtifact, params: [chainId, rootBigInt], dispatchAction: setProxyAddress },
      { name: "Withdraw", artifact: withdrawArtifact, params: [], dispatchAction: setWithdrawAddress },
      { name: "Verifier", artifact: dummyVerifierArtifact, params: [], dispatchAction: setDummyVerifierAddress}
    ];
  
    const results: { name: string; status: string }[] = [];

    for (const contract of contracts) {
      if (alreadyDeployed.has(contract.name)) {
        addLog(`${contract.name} already deployed, skipping.`);
        results.push({ name: contract.name, status: "Already Deployed" });
        continue;
      }
      try {
        addLog(`Starting deployment of ${contract.name}...`);
        await deployContract(
          contract.name,
          contract.artifact,
          contract.params,
          contract.dispatchAction
        ); // Deploy contract
        results.push({ name: contract.name, status: "Deployed" });
        alreadyDeployed.add(contract.name);
      } catch (error) {
        addLog(`Failed to deploy ${contract.name}: ${String(error)}`);
        results.push({ name: contract.name, status: "Failed" });
        break; // Stop further deployment if critical error occurs
      }
    }
  
    return results;
  };

  const handleDeploy = async () => {
    try {
      if (!signer) {
        throw new Error("Signer is not available. Please connect your wallet.");
      }

      if (proxyAddress) {
        throw new Error("Proxy contract is already deployed");
      }

      // Prepare params for Proxy contract
      const { chainId } = await provider.getNetwork();
      addLog(`netid:, ${chainId}`);
      const rootBn = new BN(initialRoot, 16, "be");
      const rootBigInt = BigInt("0x" + rootBn.toString(16));

      addLog("Starting deployment of contracts...");

      // Reset progress and deployment status
      setProgress(0);
      setDeployStatus([]);

      const results = await deployAllContracts(chainId, rootBigInt);
      setDeployStatus(results);

      const successCount = results.filter((res) => res.status === "Deployed").length;
      setProgress((successCount / results.length) * 100);

      // If there were failures, inform the user
      if (results.some((res) => res.status === "Failed")) {
        throw new Error("Some contracts failed to deploy. Check the logs for details.");
      } else {
        setActionEnabled(false);
        setAddTXEnabled(false);
        addLog("All contracts deployed successfully!");
      }
    } catch (error) {
      handleError("Error deploying contracts:" + error);
    }
  };

  return (
    <div>
      {/* User Guide Section */}
      <Alert variant="info">
        <p><strong>User Guide:</strong></p>
        <ul>
          <li>Click the &quot;DEPLOY CONTRACTS&quot; button to start deploying all contracts sequentially.</li>
          <li>The deployment sequence includes:
            <ul>
              <li>1. Deploy the Proxy contract</li>
              <li>2. Deploy the Withdraw contract</li>
              <li>3. Deploy the DummyVerifier contract</li>
            </ul>
          </li>
          <li>The progress bar will update as contracts are deployed.</li>
          <li>If any deployment fails, you will see an error message and can check the logs for details.</li>
          <li>Ensure your wallet has enough funds for gas fees before starting.</li>
          <li>If a contract fails, clicking the button again will resume deployment from the failed contract.</li>
        </ul>
      </Alert>

      {/* Deployment Button */}
      <Button onClick={handleDeploy} disabled={progress === 100} variant="primary">
        DEPLOY CONTRACTS
      </Button>

      {/* Progress Bar */}
      <ProgressBar now={progress} label={`${progress}%`} className="mt-3" />

      {/* Deployment Status List */}
      <h5 className="mt-3">Deployment Status:</h5>
      <ul>
        {deployStatus.map((contract) => (
          <li key={contract.name}>
            {contract.name}: <strong>{contract.status}</strong>
          </li>
        ))}
      </ul>

      {/* Additional Notes Section */}
      <Alert variant="warning" className="mt-3">
        <p><strong>Additional Considerations:</strong></p>
        <ul>
          <li>If a contract fails, deployment of subsequent contracts will stop to avoid dependency issues.</li>
          <li>Switch to the appropriate network (e.g., Mainnet, Testnet) as required before deployment.</li>
          <li>If you encounter gas-related issues, ensure your wallet has sufficient funds.</li>
          <li>For transactions stuck in &quot;pending&quot;, consider manually canceling them via your wallet.</li>
        </ul>
      </Alert>
      <LogViewer />
    </div>
  );
};
