import { ethers } from 'ethers';
import { Token } from "./types";
import { LogType } from './types';
import { Action } from '@reduxjs/toolkit';

export function removeHexPrefix(value: string): string {
  return value.startsWith("0x") ? value.slice(2) : value;
}

export function formatAddress(address: string) {
  // Remove the "0x" prefix if it exists
  let cleanAddress = removeHexPrefix(address);

  // Ensure the address is 40 characters long by padding with leading zeros
  while (cleanAddress.length < 40) {
    cleanAddress = "0" + cleanAddress;
  }

  // Ensure it's exactly 40 characters
  if (cleanAddress.length !== 40) {
    throw new Error("Invalid address, cannot pad to 40 characters.");
  }

  // Re-add the "0x" prefix
  return "0x" + cleanAddress;
}

// Validate if the index is a valid uint32 (between 0 and 2^32 - 1)
export const validateIndex = (index: number) => {
  return index >= 0 && index < 2 ** 32;
};

export function validateHexString (value: string, maxLength: number = 64) {
   // Create a dynamic regular expression based on the maxLength parameter
   const regex = new RegExp(`^(0x)?[0-9a-fA-F]{1,${maxLength}}$`);

  // Check if the value is a valid hex string (optional 0x prefix)
  if (!regex.test(value)) {
    throw new Error(`Invalid input. Must be a valid hex string with up to ${maxLength} characters.`);
  }

  return null; // Return null if valid
};

export async function fetchTokens (
  proxyContract: ethers.Contract,
  addLog: (type: LogType, message: string) => void
) {
  try {
    const tokenList = await proxyContract.allTokens();
    return tokenList.map((token: Token) => "0x" + token.token_uid.toString(16));
  } catch (error) {
    const err = formatErrorMessage(error);
    addLog("error", `Failed to fetch tokens: ${err}`);
    return [];
  }
}

export const formatErrorMessage = (error: any): string => {
  const fullMessage = error.message || "Unknown error";

  const message = fullMessage.replace(/\([^)]*\)/g, "");

  if (message) {
    return message;
  } else {
    return fullMessage.Error;
  }
};

export const fetchChainName = (chains: any[], chainId: bigint): Promise<string> => {
  const chain = chains.find((c: any) => String(c.chainId) === chainId.toString());
  return chain ? chain.name : "Unknown chain name";
};

export const getExplorerUrl = (chains: any[], chainId: bigint) => {
  const chain = chains.find((chain: any) => String(chain.chainId) === chainId.toString());

  if (chain && chain.explorers && chain.explorers.length > 0) {
    return chain.explorers[0].url;
  }

  return null;
}

export const getTXUrl = (chainsState: any[], chainId: bigint, transactionHash: string) => {
  const explorerBase = getExplorerUrl(chainsState, chainId);
  return explorerBase ? `${explorerBase}/tx/${transactionHash}` : null;
}

export async function deployContract(
  name: string,
  artifact: any,
  params: bigint[],
  chainId: string,
  addLog: (type: LogType, message: string, chainId?: string) => void,
  signer: ethers.JsonRpcSigner | null
) {
  // Get abi and bytecode
  const abi = artifact.abi;
  const bytecode = artifact.bytecode;

  // Create a ContractFactory instance
  const factory = new ethers.ContractFactory(abi, bytecode, signer);

  // Deploy contract
  addLog("info", `Please sign the transaction in your wallet. This signature is required to authorize the deployment of the contract.`);
  const contract = await factory.deploy(...params);
  addLog("info", `Transaction sent for ${name}`);
  addLog("txhash", `${contract.deploymentTransaction()!.hash}`, chainId);
  await contract.waitForDeployment();

  // Get contract address
  const contractAddress = await contract.getAddress();
  addLog("success", `${name} deployed successfully.`);
  addLog("contractAddr", `The ${name} contract address is ${contractAddress}`);
  return contractAddress;
}