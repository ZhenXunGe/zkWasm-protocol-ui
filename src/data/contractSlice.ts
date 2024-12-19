import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from "../app/store";

interface State {
  proxyAddress: string | null;
  withdrawAddress: string | null;
  dummyVerifierAddress: string | null;
}

const initialState: State = {
  proxyAddress: null,
  withdrawAddress: null,
  dummyVerifierAddress: null
};

const contractSlice = createSlice({
  name: 'proxy',
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
});

export const selectProxyAddress = (state: RootState) => state.contract.proxyAddress;
export const selectWithdrawAddress = (state: RootState) => state.contract.withdrawAddress;
export const selectDummyVerifierAddress = (state: RootState) => state.contract.dummyVerifierAddress;
export const { setProxyAddress, setWithdrawAddress, setDummyVerifierAddress } = contractSlice.actions;
export default contractSlice.reducer;