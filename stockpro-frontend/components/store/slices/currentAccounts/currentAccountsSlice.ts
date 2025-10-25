import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CurrentAccount } from "./currentAccountsApi";

interface CurrentAccountsState {
  currentAccounts: CurrentAccount[];
  selectedAccount: CurrentAccount | null;
  loading: boolean;
  error: string | null;
}

const initialState: CurrentAccountsState = {
  currentAccounts: [],
  selectedAccount: null,
  loading: false,
  error: null,
};

const currentAccountsSlice = createSlice({
  name: "currentAccounts",
  initialState,
  reducers: {
    setCurrentAccounts: (state, action: PayloadAction<CurrentAccount[]>) => {
      state.currentAccounts = action.payload;
    },
    setSelectedAccount: (
      state,
      action: PayloadAction<CurrentAccount | null>,
    ) => {
      state.selectedAccount = action.payload;
    },
    addCurrentAccount: (state, action: PayloadAction<CurrentAccount>) => {
      state.currentAccounts.push(action.payload);
    },
    updateCurrentAccount: (state, action: PayloadAction<CurrentAccount>) => {
      const index = state.currentAccounts.findIndex(
        (account) => account.id === action.payload.id,
      );
      if (index !== -1) {
        state.currentAccounts[index] = action.payload;
      }
    },
    removeCurrentAccount: (state, action: PayloadAction<string>) => {
      state.currentAccounts = state.currentAccounts.filter(
        (account) => account.id !== action.payload,
      );
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setCurrentAccounts,
  setSelectedAccount,
  addCurrentAccount,
  updateCurrentAccount,
  removeCurrentAccount,
  setLoading,
  setError,
  clearError,
} = currentAccountsSlice.actions;

export default currentAccountsSlice.reducer;
