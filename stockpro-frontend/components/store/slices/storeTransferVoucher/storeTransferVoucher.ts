import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { StoreTransferVoucher } from "./storeTransferVoucherApi";

interface StoreTransferVoucherState {
  vouchers: StoreTransferVoucher[];
  isLoading: boolean;
  error: string | null;
}

const initialState: StoreTransferVoucherState = {
  vouchers: [],
  isLoading: false,
  error: null,
};

const storeTransferVoucherSlice = createSlice({
  name: "storeTransferVoucher",
  initialState,
  reducers: {
    setStoreTransferVouchers: (state, action: PayloadAction<StoreTransferVoucher[]>) => {
      state.vouchers = action.payload;
    },
    addStoreTransferVoucher: (state, action: PayloadAction<StoreTransferVoucher>) => {
      state.vouchers.push(action.payload);
    },
    updateStoreTransferVoucher: (state, action: PayloadAction<StoreTransferVoucher>) => {
      const index = state.vouchers.findIndex(v => v.id === action.payload.id);
      if (index !== -1) {
        state.vouchers[index] = action.payload;
      }
    },
    removeStoreTransferVoucher: (state, action: PayloadAction<string>) => {
      state.vouchers = state.vouchers.filter(v => v.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setStoreTransferVouchers,
  addStoreTransferVoucher,
  updateStoreTransferVoucher,
  removeStoreTransferVoucher,
  setLoading,
  setError,
} = storeTransferVoucherSlice.actions;

export default storeTransferVoucherSlice.reducer;

