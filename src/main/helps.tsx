import { ethers } from 'ethers';
import { Token } from "./types";

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

export function validateHexString (value: string, maxLength: number = 64) {
   // Create a dynamic regular expression based on the maxLength parameter
   const regex = new RegExp(`^(0x)?[0-9a-fA-F]{1,${maxLength}}$`);

  // Check if the value is a valid hex string (optional 0x prefix)
  if (!regex.test(value)) {
    throw new Error(`Invalid input. Must be a valid hex string with up to ${maxLength} characters.`);
  }

  return null; // Return null if valid
};

export async function queryAllTokens(
  proxyContract: ethers.Contract,
  addLog: (message: string) => void
) {
  const tokens = await proxyContract.allTokens();
  const tokenArray = tokens.map((token: Token) => ({
    tokenUid: token.token_uid.toString()
  }));
  addLog("All tokens:");
  if(tokenArray.length !== 0) {
    for(let i = 0; i < tokenArray.length; i++) {
      addLog(JSON.stringify(tokenArray[i]));
    }
  } else {
    addLog("There no tokens");
  }
}