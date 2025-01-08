import React, { useMemo, useState } from "react";
import BN from "bn.js";
import { ethers } from 'ethers';
import { BrowserProvider } from 'ethers';
import { Spinner, Button, Row, Col } from 'react-bootstrap';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Action } from '@reduxjs/toolkit';
import { setProxyAddress, setWithdrawAddress, setDummyVerifierAddress, selectChains } from '../data/contractSlice';
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { DeployContractProps } from '../main/props';
import { formatErrorMessage } from '../main/utils';
import { fetchChainName } from '../main/utils';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import withdrawArtifact from "zkWasm-protocol/artifacts/contracts/actions/Withdraw.sol/Withdraw.json";
import dummyVerifierArtifact from "zkWasm-protocol/artifacts/contracts/DummyVerifier.sol/DummyVerifier.json";

const initialRoot = new Uint8Array([166, 157, 178, 62, 35, 83, 140, 56, 9, 235, 134, 184, 20, 145, 63, 43, 245, 186, 75, 233, 43, 42, 187, 217, 104, 152, 219, 89, 125, 199, 161, 9]);
const providerUrl = process.env["REACT_APP_PROVIDER_URL"];

export const DeployContract = ({
  signer,
  proxyAddress,
  withdrawAddress,
  verifierAddress,
  setActiveTab,
  addLog
}: DeployContractProps) => {
  const dispatch = useAppDispatch();
  const [deploying, setDeploying] = useState(false);
  const chains = useAppSelector(selectChains);

  // Use useMemo to make sure provider is created once
  const provider = useMemo(() => {
    // Use BrowserProvider to get browser wallet's signer
    if (window.ethereum) {
      return new BrowserProvider(window.ethereum, "any");
    } else {
      return new ethers.JsonRpcProvider(providerUrl);
    }
  }, []);

  async function deployContract(name: string, artifact: any, params: bigint[], dispatchAction: (address: string) => Action, chainId: string) {
    // Get abi and bytecode
    const abi = artifact.abi;
    const bytecode = artifact.bytecode;

    // Create a ContractFactory instance
    const factory = new ethers.ContractFactory(abi, bytecode, signer);
    addLog("info", "ContractFactory created successfully...");

    // Deploy contract
    const contract = await factory.deploy(...params);
    addLog("info", `Transaction sent for ${name}`);
    addLog("txhash", `${contract.deploymentTransaction()!.hash}`, chainId);
    await contract.waitForDeployment();

    // Get contract address
    const address = await contract.getAddress();

    addLog("success", `${name} deployed successfully.`);
    addLog("contractAddr", `The ${name} contract address is ${address}`);

    dispatch(dispatchAction(address));
  }

  const deployAllContracts = async (chainId: bigint, rootBigInt: bigint) => {
    const contracts = [
      { name: "Proxy", artifact: proxyArtifact, params: [chainId, rootBigInt], dispatchAction: setProxyAddress },
      { name: "Withdraw", artifact: withdrawArtifact, params: [], dispatchAction: setWithdrawAddress },
      { name: "Verifier", artifact: dummyVerifierArtifact, params: [], dispatchAction: setDummyVerifierAddress}
    ];

    for (const contract of contracts) {
      if ((contract.name === "Proxy" && proxyAddress) ||
          (contract.name === "Withdraw" && withdrawAddress) ||
          (contract.name === "Verifier" && verifierAddress)
        ) {
        addLog("info", `${contract.name} already deployed, skipping.`, `${chainId}`);
        continue;
      }
      try {
        addLog("info", `Starting deployment of ${contract.name}. Plesae wait...`, `${chainId}`);
        await deployContract(
          contract.name,
          contract.artifact,
          contract.params,
          contract.dispatchAction,
          chainId.toString()
        );
      } catch (error) {
        const err = formatErrorMessage(error);
        throw new Error(`Failed to deploy ${contract.name}: ${err}`);
      }
    }
  };

  const handleDeploy = async () => {
    try {
      if (!signer) {
        throw new Error("Please connect your wallet before submitting any requests!");
      }

      setDeploying(true);

      // Prepare params for Proxy contract
      const { chainId } = await provider.getNetwork();
      const chainName = await fetchChainName(chains.chains, chainId);
      addLog("info", `chainId:, ${chainId}(chain name: ${chainName})`, `${chainId}`);
      const rootBn = new BN(initialRoot, 16, "be");
      const rootBigInt = BigInt("0x" + rootBn.toString(16));

      await deployAllContracts(chainId, rootBigInt);

      addLog("success", "All contracts deployed successfully!", `${chainId}`);
      setActiveTab("existing");
      setDeploying(false);
    } catch (error: any) {
      const err = formatErrorMessage(error);
      addLog("error", `Error deploying contracts: ${err}. Clicking the "Start Deploy Contracts" button again will resume deployment from the failed contract.`, "");
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="deploy-container">
      <Row className="mb-3">
        <Col xs={4} className="text-center">
          <div className={`${proxyAddress ? 'active' : ''}`}>
            <h4>Step 1</h4>
            <p>Deploy Proxy Contract</p>
          </div>
        </Col>
        <Col xs={4} className="text-center">
          <div className={`${withdrawAddress ? 'active' : ''}`}>
            <h4>Step 2</h4>
            <p>Deploy Withdraw Contract</p>
          </div>
        </Col>
        <Col xs={4} className="text-center">
          <div className={`${verifierAddress ? 'active' : ''}`}>
            <h4>Step 3</h4>
            <p>Deploy DummyVerifier Contract</p>
          </div>
        </Col>
      </Row>

      {/* deploy button */}
      <Button
        onClick={handleDeploy}
        disabled={deploying || (!!proxyAddress && !!withdrawAddress && !!verifierAddress)}
        variant={deploying ? "secondary" : "primary"}
        className="w-100 mb-4"
      >
        {deploying ? <Spinner animation="border" size="sm" /> : "Start Deploy Contracts"}      </Button>

      <div className="address-container mt-4">
        <div className="mb-3">
          <strong>Proxy address: </strong>
          {proxyAddress || 'not deployed'}
          <CopyToClipboard text={proxyAddress || ''}>
            <Button variant="outline-secondary" className="copyButton">Copy</Button>
          </CopyToClipboard>
        </div>
        <div className="mb-3">
          <strong>Withdraw address: </strong>
          {withdrawAddress || 'not deployed'}
          <CopyToClipboard text={withdrawAddress || ''}>
            <Button variant="outline-secondary" className="copyButton">Copy</Button>
          </CopyToClipboard>
        </div>
        <div className="mb-3">
          <strong>Verifier address: </strong>
          {verifierAddress || 'not deployed'}
          <CopyToClipboard text={verifierAddress || ''}>
            <Button variant="outline-secondary" className="copyButton">Copy</Button>
          </CopyToClipboard>
        </div>
      </div>
    </div>
  );
};
