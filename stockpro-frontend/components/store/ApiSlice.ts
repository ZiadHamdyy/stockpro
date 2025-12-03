import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { setCredentials, logOut, selectCurrentToken } from "./slices/auth/auth";
import { showToastExternal } from "../common/ToastProvider";

const baseQuery = fetchBaseQuery({
  baseUrl:
    (import.meta as any).env?.VITE_BASE_BACK_URL ||
    "http://localhost:4000/api/v1",
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = selectCurrentToken(getState() as any);
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  if (result?.error?.status === 401) {
    const refreshResult = await baseQuery(
      {
        url: "auth/refresh",
        method: "POST",
      },
      api,
      extraOptions,
    );

    if (refreshResult?.data) {
      const user = (api.getState() as { auth: { user: any } }).auth.user;

      const refreshData = refreshResult.data as any;

      if (refreshData.data && refreshData.data.accessToken) {
        api.dispatch(
          setCredentials({
            accessToken: refreshData.data.accessToken,
            user: refreshData.data.user || user,
          }),
        );
      } else if (refreshData.accessToken) {
        api.dispatch(
          setCredentials({
            accessToken: refreshData.accessToken,
            user: refreshData.user || user,
          }),
        );
      } else {
        api.dispatch(logOut());
        return result;
      }

      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logOut());
    }
  }

  // Global 409 handler: show Arabic message for delete conflicts
  if (result?.error?.status === 409) {
    const message = "لا يمكن الحذف لوجود بيانات مرتبطة.";
    showToastExternal(message, 'error');
  }

  return result;
};

export const apiSlice = createApi({
  baseQuery: baseQueryWithReAuth,
  tagTypes: [
    "User",
    "Role",
    "Permission",
    "Session",
    "Company",
    "Branch",
    "Store",
    "Item",
    "ItemGroup",
    "Unit",
    "StoreReceiptVoucher",
    "StoreIssueVoucher",
    "StoreTransferVoucher",
    "CurrentAccount",
    "ReceivableAccount",
    "PayableAccount",
    "Safe",
    "Bank",
    "Customer",
    "Supplier",
    "Expense",
    "ExpenseType",
    "ExpenseCode",
    "SalesInvoice",
    "PriceQuotation",
    "SalesReturn",
    "PurchaseInvoice",
    "PurchaseReturn",
    "PaymentVoucher",
    "ReceiptVoucher",
    "InternalTransfer",
    "DashboardStats",
    "MonthlyStats",
    "SalesByItemGroup",
    "IncomeStatement",
    "BalanceSheet",
    "InventoryCount",
    "AuditLog",
    "FiscalYear",
  ],
  endpoints: () => ({}),
});
