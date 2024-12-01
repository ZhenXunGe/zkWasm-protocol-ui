#!/bin/bash

# Load environment variables from .env file
export $(grep -v '^#' .env | xargs)

# Navigate to the zkWasm-protocol folder
cd node_modules/zkWasm-protocol

# Install dependencies
npm install

# Set hardhat variables using the values from the .env file
npx hardhat vars set INFURA_API_KEY $INFURA_API_KEY
npx hardhat vars set SEPOLIA_PRIVATE_KEY $SEPOLIA_PRIVATE_KEY

# Compile the contracts
npx hardhat compile
