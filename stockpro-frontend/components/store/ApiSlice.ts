import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { setCredentials, logOut, selectCurrentToken } from "./slices/auth/auth";
import { showToastExternal } from "../common/ToastProvider";

// Selector to get host override from Redux state or localStorage
const selectHostOverride = (state: any): string | null => {
  try {
    // Check Redux state first (if you add a tenant slice later)
    if (state?.tenant?.hostOverride) {
      return state.tenant.hostOverride;
    }
    if (state?.auth?.hostOverride) {
      return state.auth.hostOverride;
    }
    // Fallback to localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem("X-Override-Host");
    }
  } catch (error) {
    console.error("[ApiSlice] Error reading host override:", error);
  }
  return null;
};

// Helper function to set host override (can be called from anywhere)
export const setHostOverride = (host: string | null) => {
  if (host) {
    localStorage.setItem("X-Override-Host", host);
  } else {
    localStorage.removeItem("X-Override-Host");
  }
  // Dispatch custom event to notify components of company switch
  window.dispatchEvent(new CustomEvent('company-switch', { detail: { host } }));
};

// Helper function to get host override
export const getHostOverride = (): string | null => {
  return localStorage.getItem("X-Override-Host");
};

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
    
    // Add host override header for multi-tenancy simulation
    // Backend middleware checks: x-company-host, host, x-forwarded-host, x-host
    const hostOverride = selectHostOverride(getState() as any);
    if (hostOverride) {
      // Primary header that backend middleware checks first
      headers.set("x-company-host", hostOverride);
      
      // Debug logging (remove in production)
      if (import.meta.env.DEV) {
        console.log("[ApiSlice] Host override headers set:", {
          "x-company-host": hostOverride,
        });
      }
    } else {
      // Debug logging when no host override is set
      if (import.meta.env.DEV) {
        console.log("[ApiSlice] No host override set - headers will not include tenant info");
      }
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
    "Notification",
    "Subscription",
    "AnnualSalesReport",
  ],
  endpoints: () => ({}),
});
