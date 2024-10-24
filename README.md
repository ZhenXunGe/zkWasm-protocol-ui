# Introduction
UI for [zkWasm-protocol](https://github.com/DelphinusLab/zkWasm-protocol)

# How to use
1. Prepare artifacts
```
git clone https://github.com/DelphinusLab/zkWasm-protocol.git
cd zkWasm-protocol
npm install
npx hardhat vars set INFURA_API_KEY
npx hardhat vars set SEPOLIA_PRIVATE_KEY
npx hardhat compile
```

`INFURA_API_KEY` and `SEPOLIA_PRIVATE_KEY` are configuration variables.
Assume `c123456d3aab45a4b692739e7d4811bc` is your Infura API key and `0xe1336538174201795c5b0b4a90123456c060386751684c0ce8eefa003e312345` is your private key.

In `zkWasm-protocol`, run:
```
npx hardhat vars set INFURA_API_KEY c123456d3aab45a4b692739e7d4811bc
npx hardhat vars set SEPOLIA_PRIVATE_KEY0xe1336538174201795c5b0b4a90123456c060386751684c0ce8eefa003e312345
```
- To get infura api key:
Go to https://infura.io, sign up, create a new API key in its dashboard
- To get sepolia private key:
To export your private key from Coinbase Wallet, go to Settings > Developer Settings > Show private key. To export your private key from Metamask, open Metamask and go to Account Details > Export Private Key. NEVER put real Ether into testing accounts

2. Prepare ui repo
```
cd zkWasm-protocol-ui
npm install
```
3. Modify `.env`'s `REACT_APP_PROVIDER_URL`
- To get infura api key:
Go to https://infura.io, sign up, create a new API key in its dashboard

4. Start UI
```
npm run start
```