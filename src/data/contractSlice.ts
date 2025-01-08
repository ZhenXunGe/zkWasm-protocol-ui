import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from "../app/store";

export interface ChainsState {
  chains: any[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

interface State {
  proxyAddress: string | null;
  withdrawAddress: string | null;
  dummyVerifierAddress: string | null;
  chains: ChainsState;
}

const initialState: State = {
  proxyAddress: null,
  withdrawAddress: null,
  dummyVerifierAddress: null,
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
    setWithdrawAddress: (state, action: PayloadAction<string>) => {
      state.withdrawAddress = action.payload;
    },
    setDummyVerifierAddress: (state, action: PayloadAction<string>) => {
      state.dummyVerifierAddress = action.payload;
    },
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
export const selectWithdrawAddress = (state: RootState) => state.contract.withdrawAddress;
export const selectDummyVerifierAddress = (state: RootState) => state.contract.dummyVerifierAddress;
export const selectChains = (state: RootState) => state.contract.chains;
export const { setProxyAddress, setWithdrawAddress, setDummyVerifierAddress } = contractSlice.actions;
export default contractSlice.reducer;