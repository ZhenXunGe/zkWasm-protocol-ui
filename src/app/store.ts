import { configureStore } from '@reduxjs/toolkit';
import contractReducer from '../data/contractSlice';

const store = configureStore({
  reducer: {
    contract: contractReducer,
  },
});

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;