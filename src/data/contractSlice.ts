import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from "../app/store";

interface State {
  proxyAddress: string | null;
}

const initialState: State = {
  proxyAddress: "0xE895f6046fC7a04735D7d8D6ec5c7fCf718e9A76"
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