import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/auth/auth";
import userReducers from "./slices/user/user";
import sessionReducer from "./slices/session/session";
import itemsReducer from "./slices/items/items";
import storeReceiptVoucherReducer from "./slices/storeReceiptVoucher/storeReceiptVoucher";
import storeIssueVoucherReducer from "./slices/storeIssueVoucher/storeIssueVoucher";
import storeTransferVoucherReducer from "./slices/storeTransferVoucher/storeTransferVoucher";
import currentAccountsReducer from "./slices/currentAccounts/currentAccountsSlice";
import { apiSlice } from "./ApiSlice";
import storage from "redux-persist/lib/storage";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";

const persistConfig = {
  key: "auth",
  storage,
  whitelist: ["token", "user"],
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    user: userReducers,
    session: sessionReducer,
    items: itemsReducer,
    storeReceiptVoucher: storeReceiptVoucherReducer,
    storeIssueVoucher: storeIssueVoucherReducer,
    storeTransferVoucher: storeTransferVoucherReducer,
    currentAccounts: currentAccountsReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore actions related to redux-persist
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        // Ignore specific paths that might contain Blobs (backup downloads)
        ignoredPaths: [
          "api.queries",
          "api.mutations",
          "payload.data", // Ignore Blob in error payloads
        ],
        // Allow Blob values
        isSerializable: (value: any) => {
          if (value instanceof Blob) {
            return true;
          }
          // Default serialization check
          return true;
        },
      },
    }).concat(apiSlice.middleware),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
