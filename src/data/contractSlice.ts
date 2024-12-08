import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from "../app/store";

interface State {
  proxyAddress: string | null;
}

const initialState: State = {
  proxyAddress: null
};

const contractSlice = createSlice({
  name: 'proxy',
  initialState,
  reducers: {
    setProxyAddress: (state, action: PayloadAction<string>) => {
      state.proxyAddress = action.payload;
    }
  },
});

export const selectProxyAddress = (state: RootState) => state.contract.proxyAddress;
export const { setProxyAddress } = contractSlice.actions;
export default contractSlice.reducer;