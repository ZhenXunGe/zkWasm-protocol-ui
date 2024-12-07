import { useMemo } from 'react';
import { ethers } from 'ethers';
import Button from 'react-bootstrap/Button';
import { useAppDispatch } from "../app/hooks";
import BN from "bn.js";
import { BrowserProvider } from 'ethers';
import { DeployProxyProps } from '../main/props';
import { setProxyAddress } from '../data/contractSlice';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import { useLogger } from '../main/logger/LoggerContext';

const initialRoot = new Uint8Array([166, 157, 178, 62, 35, 83, 140, 56, 9, 235, 134, 184, 20, 145, 63, 43, 245, 186, 75, 233, 43, 42, 187, 217, 104, 152, 219, 89, 125, 199, 161, 9]);
const providerUrl = process.env["REACT_APP_PROVIDER_URL"];

export function DeployProxy({
  signer,
  proxyAddress,
  actionEnabled,
  setActionEnabled,
  setAddTXEnabled,
  handleError
}: DeployProxyProps) {
  const dispatch = useAppDispatch();
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

  async function deployContract(artifact: any, params: any[]) {
    // Get abi and bytecode
    const abi = artifact.abi;
    const bytecode = artifact.bytecode;

    addLog("Start deploying contract...");

    // Create a ContractFactory instance
    const factory = new ethers.ContractFactory(abi, bytecode, signer);
    addLog("ContractFactory created successfully, start deploying...");

    // Deploy contract
    const contract = await factory.deploy(...params);
    addLog("Transacton was sent, wait for confirm...");
    addLog("Transaction hash: " + contract.deploymentTransaction()!.hash);

    await contract.waitForDeployment();

    // Get contract address
    const address = await contract.getAddress();
    addLog("Contract deployed successfully!");
    addLog(`Contract address is: ${address}`);

    return address;
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
      addLog("netid: " + chainId);
      const rootBn = new BN(initialRoot, 16, "be");
      const rootBigInt = BigInt("0x" + rootBn.toString(16));

      const address = await deployContract(proxyArtifact, [chainId, rootBigInt]);
      if(address) {
        dispatch(setProxyAddress(address));
      }

      setActionEnabled(false);
      setAddTXEnabled(false);
    } catch (error) {
      handleError("Error deploying proxy:" + error);
    }
  };

  return (
    <div>
      <h4>Deploy Proxy</h4>
      <div className="steps">
        <Button variant="primary" onClick={handleDeploy} disabled={!actionEnabled}>
          DEPLOY PROXY
        </Button>
      </div>
    </div>
  )
}