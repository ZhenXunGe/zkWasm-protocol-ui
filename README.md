# Introduction
UI for [zkWasm-protocol](https://github.com/DelphinusLab/zkWasm-protocol)

# How to use
1. Modify the `.env` file
- To get infura api key for `REACT_APP_PROVIDER_URL` and `INFURA_API_KEY`:
Go to https://infura.io, sign up, create a new API key in its dashboard
- To get sepolia private key for `SEPOLIA_PRIVATE_KEY`:
To export your private key from Coinbase Wallet, go to Settings > Developer Settings > Show private key. To export your private key from Metamask, open Metamask and go to Account Details > Export Private Key. NEVER put real Ether into testing accounts

2. Install dependencies and prepare artifacts in `zkWasm-protocol`
```
npm install
```

The `prepare` script in `package.json` generates artifacts in `zkWasm-protocol`.

3. Start UI
```
npm run start
```

# Live Demo
The project is deployed and accessible at: [https://zkwasm-protocol-ui.vercel.app/](https://zkwasm-protocol-ui.vercel.app/)