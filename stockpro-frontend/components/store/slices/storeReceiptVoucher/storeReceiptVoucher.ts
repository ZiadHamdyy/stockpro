import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { StoreReceiptVoucher } from "./storeReceiptVoucherApi";

interface StoreReceiptVoucherState {
  vouchers: StoreReceiptVoucher[];
  isLoading: boolean;
  error: string | null;
}

const initialState: StoreReceiptVoucherState = {
  vouchers: [],
  isLoading: false,
  error: null,
};

const storeReceiptVoucherSlice = createSlice({
  name: "storeReceiptVoucher",
  initialState,
  reducers: {
    setStoreReceiptVouchers: (
      state,
      action: PayloadAction<StoreReceiptVoucher[]>,
    ) => {
      state.vouchers = action.payload;
    },
    addStoreReceiptVoucher: (
      state,
      action: PayloadAction<StoreReceiptVoucher>,
    ) => {
      state.vouchers.push(action.payload);
    },
    updateStoreReceiptVoucher: (
      state,
      action: PayloadAction<StoreReceiptVoucher>,
    ) => {
      const index = state.vouchers.findIndex((v) => v.id === action.payload.id);
      if (index !== -1) {
        state.vouchers[index] = action.payload;
      }
    },
    removeStoreReceiptVoucher: (state, action: PayloadAction<string>) => {
      state.vouchers = state.vouchers.filter((v) => v.id !== action.payload);
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
  setStoreReceiptVouchers,
  addStoreReceiptVoucher,
  updateStoreReceiptVoucher,
  removeStoreReceiptVoucher,
  setLoading,
  setError,
} = storeReceiptVoucherSlice.actions;

export default storeReceiptVoucherSlice.reducer;
