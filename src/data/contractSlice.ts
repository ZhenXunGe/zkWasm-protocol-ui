import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from "../app/store";

export interface ChainsState {
  chains: any[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

interface State {
  proxyAddress: string | null;
  withdrawAddressHistory: string[];
  dmVerifierAddressHistory: string[];
  proxyAddressHistory: string[];
  chains: ChainsState;
}

const initialState: State = {
  proxyAddress: null,
  withdrawAddressHistory: [],
  dmVerifierAddressHistory: [],
  proxyAddressHistory: [],
  chains: {
    chains: [],
    status: "idle",
    error: null,
  }
};

export const fetchChains = createAsyncThunk("chains/fetchChains", async () => {
  const response = await fetch("https://chainid.network/chains.json");
  const data = await response.json();
  return data;
});

const contractSlice = createSlice({
  name: 'contract',
  initialState,
  reducers: {
    setProxyAddress: (state, action: PayloadAction<string>) => {
      state.proxyAddress = action.payload;
    },
    addWithdrawAddress: (state, action: PayloadAction<string>) => {
      state.withdrawAddressHistory.push(action.payload);
    },
    addDummyVerifierAddress: (state, action: PayloadAction<string>) => {
      state.dmVerifierAddressHistory.push(action.payload);
    },
    addProxyAddress: (state, action: PayloadAction<string>) => {
      state.proxyAddressHistory.push(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChains.pending, (state) => {
        state.chains.status = "loading";
        state.chains.error = null;
      })
      .addCase(fetchChains.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.chains.status = "succeeded";
        state.chains.chains = action.payload;
      })
      .addCase(fetchChains.rejected, (state, action) => {
        state.chains.status = "failed";
        state.chains.error = action.error.message || "Failed to fetch chains data";
      });
  },
});

export const selectProxyAddress = (state: RootState) => state.contract.proxyAddress;
export const selectWithdrawAddressHistory = (state: RootState) => state.contract.withdrawAddressHistory;
export const selectDMVerifierAddressHistory = (state: RootState) => state.contract.dmVerifierAddressHistory;
export const selectProxyAddressHistory = (state: RootState) => state.contract.proxyAddressHistory;
export const selectChains = (state: RootState) => state.contract.chains;
export const { setProxyAddress, addWithdrawAddress, addDummyVerifierAddress, addProxyAddress } = contractSlice.actions;
export default contractSlice.reducer;