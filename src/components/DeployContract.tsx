import { useMemo } from 'react';
import { ethers } from 'ethers';
import Button from 'react-bootstrap/Button';
import { useAppDispatch } from "../app/hooks";
import { useState } from 'react';
import { Action } from '@reduxjs/toolkit';
import BN from "bn.js";
import { BrowserProvider } from 'ethers';
import { DeployContractProps } from '../main/props';
import {
  setProxyAddress,
  setWithdrawAddress,
  setDummyVerifierAddress
} from '../data/contractSlice';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import withdrawArtifact from "zkWasm-protocol/artifacts/contracts/actions/Withdraw.sol/Withdraw.json";
import dummyVerifierArtifact from "zkWasm-protocol/artifacts/contracts/DummyVerifier.sol/DummyVerifier.json";

const initialRoot = new Uint8Array([166, 157, 178, 62, 35, 83, 140, 56, 9, 235, 134, 184, 20, 145, 63, 43, 245, 186, 75, 233, 43, 42, 187, 217, 104, 152, 219, 89, 125, 199, 161, 9]);
const providerUrl = process.env["REACT_APP_PROVIDER_URL"];

export function DeployContract({
  signer,
  proxyAddress,
  setActionEnabled,
  handleError
}: DeployContractProps) {
  const dispatch = useAppDispatch();
  const [deployEnabled, setDeployEnabled] = useState(false);

  // Use useMemo to make sure provider is created once
  const provider = useMemo(() => {
    // Use BrowserProvider to get browser wallet's signer
    if (window.ethereum) {
      return new BrowserProvider(window.ethereum, "any");
    } else {
      return new ethers.JsonRpcProvider(providerUrl);
    }
  }, []);

  async function deployContract(artifact: any, params: any[]) {
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

  const deployContractWithDispatch = async (artifact: any, params: bigint[], dispatchAction: (address: string) => Action) => {
    const address = await deployContract(artifact, params);
    if(address) {
      dispatch(dispatchAction(address));
    }
  }

  const handleDeploy = async () => {
    if (!signer) {
      handleError("No signer found, please connect wallet first");
      return;
    }

    if (proxyAddress) {
      handleError("Proxy contract is already deployed");
      return;
    }

    try {
      // Prepare params for Proxy contract
      const { chainId } = await provider.getNetwork();
      console.log("netid:", chainId);
      const rootBn = new BN(initialRoot, 16, "be");
      const rootBigInt = BigInt("0x" + rootBn.toString(16));

      // Deploy contracts
      await deployContractWithDispatch(proxyArtifact, [chainId, rootBigInt], setProxyAddress);
      await deployContractWithDispatch(withdrawArtifact, [], setWithdrawAddress);
      await deployContractWithDispatch(dummyVerifierArtifact, [], setDummyVerifierAddress);

      setDeployEnabled(true);
      setActionEnabled(false);
    } catch (error) {
      handleError("Error deploying contracts:" + error);
    }
  };

  return (
    <div>
      <h4>Add New Contracts</h4>
      <div className="steps">
        <Button variant="primary" onClick={handleDeploy} disabled={deployEnabled}>
          DEPLOY CONTRACT
        </Button>
      </div>
    </div>
  )
}