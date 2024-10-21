# Introduction
UI for [zkWasm-protocol](https://github.com/DelphinusLab/zkWasm-protocol)

# How to use
1. Prepare artifacts
```
git clone https://github.com/DelphinusLab/zkWasm-protocol.git
cd zkWasm-protocol
npm install
npx hardhat compile
```
2. Prepare ui repo
```
cd zkWasm-protocol-ui
npm install
```
3. Modify `.env`'s `PROVIDER_URL`
- The default value `http://localhost:8545` is for local hardhat node.
- To get infura api key:
Go to https://infura.io, sign up, create a new API key in its dashboard

4. Start UI
```
npm run start
```