import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { StoreIssueVoucher } from "./storeIssueVoucherApi";

interface StoreIssueVoucherState {
  vouchers: StoreIssueVoucher[];
  isLoading: boolean;
  error: string | null;
}

const initialState: StoreIssueVoucherState = {
  vouchers: [],
  isLoading: false,
  error: null,
};

const storeIssueVoucherSlice = createSlice({
  name: "storeIssueVoucher",
  initialState,
  reducers: {
    setStoreIssueVouchers: (state, action: PayloadAction<StoreIssueVoucher[]>) => {
      state.vouchers = action.payload;
    },
    addStoreIssueVoucher: (state, action: PayloadAction<StoreIssueVoucher>) => {
      state.vouchers.push(action.payload);
    },
    updateStoreIssueVoucher: (state, action: PayloadAction<StoreIssueVoucher>) => {
      const index = state.vouchers.findIndex(v => v.id === action.payload.id);
      if (index !== -1) {
        state.vouchers[index] = action.payload;
      }
    },
    removeStoreIssueVoucher: (state, action: PayloadAction<string>) => {
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
  setStoreIssueVouchers,
  addStoreIssueVoucher,
  updateStoreIssueVoucher,
  removeStoreIssueVoucher,
  setLoading,
  setError,
} = storeIssueVoucherSlice.actions;

export default storeIssueVoucherSlice.reducer;

