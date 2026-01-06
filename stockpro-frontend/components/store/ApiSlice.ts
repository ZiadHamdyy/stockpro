import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { setCredentials, logOut, selectCurrentToken } from "./slices/auth/auth";
import { showToastExternal } from "../common/ToastProvider";
import { getTokenExpirationState } from "../common/TokenExpirationContext";
import { translatePermissionsToArabic } from "../../utils/permissionTranslator";

// Selector to get company code from Redux state or localStorage
const selectCompanyCode = (state: any): string | null => {
  try {
    // Check Redux state first (if you add a tenant slice later)
    if (state?.tenant?.companyCode) {
      return state.tenant.companyCode;
    }
    if (state?.auth?.companyCode) {
      return state.auth.companyCode;
    }
    // Fallback to localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem("X-Company-Code");
    }
  } catch (error) {
    console.error("[ApiSlice] Error reading company code:", error);
  }
  return null;
};

// Helper function to set company code (can be called from anywhere)
export const setCompanyCode = (code: string | null) => {
  if (code) {
    localStorage.setItem("X-Company-Code", code);
  } else {
    localStorage.removeItem("X-Company-Code");
  }
  // Dispatch custom event to notify components of company switch
  window.dispatchEvent(new CustomEvent('company-switch', { detail: { code } }));
};

// Helper function to get company code
export const getCompanyCode = (): string | null => {
  return localStorage.getItem("X-Company-Code");
};

// Track if any successful API call has been made (to detect fresh page load vs active session)
let hasMadeSuccessfulCall = false;
// Track if a refresh is in progress during fresh page load
let isRefreshingOnFreshLoad = false;

// Helper functions for sessionStorage-based fresh page load detection
const FRESH_PAGE_LOAD_KEY = 'isFreshPageLoad';

const initializeFreshPageLoadFlag = () => {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    // Set flag on module load (before any API calls)
    // This will be true for fresh page loads and cleared after first successful call
    if (!sessionStorage.getItem(FRESH_PAGE_LOAD_KEY)) {
      sessionStorage.setItem(FRESH_PAGE_LOAD_KEY, 'true');
    }
  }
};

const isFreshPageLoad = (): boolean => {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    return sessionStorage.getItem(FRESH_PAGE_LOAD_KEY) === 'true';
  }
  // Fallback to module-level variable if sessionStorage is not available
  return !hasMadeSuccessfulCall;
};

const clearFreshPageLoadFlag = () => {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    sessionStorage.removeItem(FRESH_PAGE_LOAD_KEY);
  }
};

// Initialize the flag when the module loads
initializeFreshPageLoadFlag();

// Helper functions for JWT token decoding and expiration checking
interface JwtPayload {
  exp?: number; // Expiration timestamp (Unix time in seconds)
  iat?: number; // Issued at timestamp
  [key: string]: any;
}

/**
 * Decode JWT token payload without verification
 * Returns null if token is malformed or cannot be decoded
 */
const decodeJwtPayload = (token: string | null): JwtPayload | null => {
  if (!token) {
    return null;
  }

  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    // Add padding if needed (base64url may not have padding)
    const paddedPayload = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const decodedPayload = atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'));
    
    return JSON.parse(decodedPayload) as JwtPayload;
  } catch (error) {
    console.error('[ApiSlice] Error decoding JWT token:', error);
    return null;
  }
};

/**
 * Check if token expired more than specified milliseconds ago
 * Returns true if expired more than thresholdMs ago, false otherwise
 * Returns null if token cannot be decoded or has no expiration
 */
const isTokenExpiredMoreThan = (token: string | null, thresholdMs: number): boolean | null => {
  const payload = decodeJwtPayload(token);
  
  if (!payload || typeof payload.exp !== 'number') {
    return null; // Cannot determine expiration
  }

  const expirationTime = payload.exp * 1000; // Convert to milliseconds (exp is in seconds)
  const currentTime = Date.now();
  const timeSinceExpiration = currentTime - expirationTime;

  return timeSinceExpiration > thresholdMs;
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
    
    // Add company code header for multi-tenancy
    // Backend middleware checks: x-company-code header first, then falls back to JWT token
    const companyCode = selectCompanyCode(getState() as any);
    if (companyCode) {
      // Primary header that backend middleware checks first
      headers.set("x-company-code", companyCode);
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
  
  // Mark successful calls (not 401 errors) to detect active session
  if (!result?.error || result.error.status !== 401) {
    hasMadeSuccessfulCall = true;
    // Clear fresh page load flag after first successful call
    clearFreshPageLoadFlag();
  }
  
  if (result?.error?.status === 401) {
    const tokenExpirationState = getTokenExpirationState();
    
    // Check if this is a refresh request itself - if so, don't show dialog
    const isRefreshRequest = 
      typeof args === 'object' && 
      args !== null && 
      'url' in args && 
      args.url === 'auth/refresh';

    if (!isRefreshRequest) {
      // Check if dialog is already showing
      if (tokenExpirationState.isDialogOpen) {
        // Dialog is already showing, queue this request and wait
        return tokenExpirationState.queueRequest(args, api, extraOptions);
      }
      
      // Get current token from Redux state
      const currentToken = selectCurrentToken(api.getState() as any);
      
      // Check if token expired more than 10 seconds ago
      // If expired > 5 minutes ago, user likely reopened tab after expiration → logout directly
      // If expired ≤ 5 minutes ago, it's an active session → show dialog
      const tokenExpiredMoreThan = isTokenExpiredMoreThan(currentToken, 300000); // 300000 = 5 minutes
      
      // If no token exists, logout directly
      if (!currentToken) {
        api.dispatch(logOut());
        // Clear refresh token cookie
        try {
          const baseUrl =
            (import.meta as any).env?.VITE_BASE_BACK_URL ||
            "http://localhost:4000/api/v1";
          await fetch(`${baseUrl}/auth/logout`, {
            method: "DELETE",
            credentials: "include",
          });
        } catch (error) {
          // Ignore errors - we're logging out anyway
        }
        return result;
      }
      
      // If token expired more than 10 seconds ago, logout directly without dialog
      // This indicates user reopened tab after expiration
      if (tokenExpiredMoreThan === true) {
        // Reject all queued requests
        const queuedRequests = tokenExpirationState.getQueuedRequests();
        queuedRequests.forEach((req) => {
          req.reject(new Error("Token expired on page load"));
        });
        tokenExpirationState.clearQueuedRequests();
        
        // Logout directly - no dialog for tokens expired more than 10 seconds ago
        api.dispatch(logOut());
        
        // Also clear the refresh token cookie by calling logout endpoint
        try {
          const baseUrl =
            (import.meta as any).env?.VITE_BASE_BACK_URL ||
            "http://localhost:4000/api/v1";
          await fetch(`${baseUrl}/auth/logout`, {
            method: "DELETE",
            credentials: "include",
          });
        } catch (error) {
          // Ignore errors - we're logging out anyway
        }
        
        return result;
      }
      
      // If token expired ≤ 10 seconds ago or expiration cannot be determined,
      // it's likely an active session - try refresh first, then show dialog if needed
      // Check if this is a fresh page load using sessionStorage as fallback
      const isFreshPageLoadValue = isFreshPageLoad();
      
      if (isFreshPageLoadValue) {
        // If refresh is already in progress, queue this request
        if (isRefreshingOnFreshLoad) {
          return tokenExpirationState.queueRequest(args, api, extraOptions);
        }
        
        // Mark that refresh is in progress
        isRefreshingOnFreshLoad = true;
        
        // Store original request for retry after refresh
        tokenExpirationState.setOriginalRequest(args, api, extraOptions);
        
        // Try to refresh the token first
        const refreshResult = await baseQuery(
          {
            url: "auth/refresh",
            method: "POST",
          },
          api,
          extraOptions,
        );

        if (refreshResult?.data) {
          // Refresh succeeded - user reopened before expiration, continue normally
          // Clear fresh page load flag since we've successfully authenticated
          clearFreshPageLoadFlag();
          hasMadeSuccessfulCall = true;
          
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
          }

          // Retry the original request
          const originalRequest = tokenExpirationState.getOriginalRequest();
          if (originalRequest) {
            result = await baseQuery(
              originalRequest.args,
              originalRequest.api,
              originalRequest.extraOptions,
            );
            tokenExpirationState.clearOriginalRequest();
            // Flag already cleared when refresh succeeded above
          }
          
          // Retry all queued requests
          const queuedRequests = tokenExpirationState.getQueuedRequests();
          if (queuedRequests.length > 0) {
            for (const queuedRequest of queuedRequests) {
              try {
                const retryResult = await baseQuery(
                  queuedRequest.args,
                  queuedRequest.api,
                  queuedRequest.extraOptions,
                );
                queuedRequest.resolve(retryResult);
                // Flag already cleared when refresh succeeded above
              } catch (error) {
                queuedRequest.reject(error);
              }
            }
            tokenExpirationState.clearQueuedRequests();
          }
          
          isRefreshingOnFreshLoad = false;
          return result;
        } else {
          // Refresh failed - logout directly without showing dialog
          isRefreshingOnFreshLoad = false;
          tokenExpirationState.clearOriginalRequest();
          
          // Reject all queued requests
          const queuedRequests = tokenExpirationState.getQueuedRequests();
          queuedRequests.forEach((req) => {
            req.reject(new Error("Token expired on page load"));
          });
          tokenExpirationState.clearQueuedRequests();
          
          // Logout directly - no dialog for fresh page load scenarios
          api.dispatch(logOut());
          
          // Also clear the refresh token cookie by calling logout endpoint
          try {
            const baseUrl =
              (import.meta as any).env?.VITE_BASE_BACK_URL ||
              "http://localhost:4000/api/v1";
            await fetch(`${baseUrl}/auth/logout`, {
              method: "DELETE",
              credentials: "include",
            });
          } catch (error) {
            // Ignore errors - we're logging out anyway
          }
          
          return result;
        }
      }
      
      // Active session - token expired ≤ 10 seconds ago or expiration cannot be determined
      // Show dialog and wait for user choice
      tokenExpirationState.setOriginalRequest(args, api, extraOptions);
      tokenExpirationState.showDialog();
      const userChoice = await tokenExpirationState.waitForUserChoice();
      
      if (userChoice === "logout") {
        // User chose to logout - return the error
        tokenExpirationState.clearOriginalRequest();
        return result;
      }
      
      // User chose to stay logged in - proceed with refresh
      // The original request will be retried after refresh
    }

    // Try to refresh the token (for active session scenario)
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
        tokenExpirationState.clearOriginalRequest();
        return result;
      }

      // Retry the original request if it exists
      const originalRequest = tokenExpirationState.getOriginalRequest();
      if (originalRequest) {
        result = await baseQuery(
          originalRequest.args,
          originalRequest.api,
          originalRequest.extraOptions,
        );
        tokenExpirationState.clearOriginalRequest();
        // Mark as successful if retry succeeds and clear fresh page load flag
        if (!result?.error || result.error.status !== 401) {
          hasMadeSuccessfulCall = true;
          clearFreshPageLoadFlag();
        }
      }
      
      // Retry all queued requests
      const queuedRequests = tokenExpirationState.getQueuedRequests();
      if (queuedRequests.length > 0) {
        for (const queuedRequest of queuedRequests) {
          try {
            const retryResult = await baseQuery(
              queuedRequest.args,
              queuedRequest.api,
              queuedRequest.extraOptions,
            );
            queuedRequest.resolve(retryResult);
            // Mark as successful if retry succeeds and clear fresh page load flag
            if (!retryResult?.error || retryResult.error.status !== 401) {
              hasMadeSuccessfulCall = true;
              clearFreshPageLoadFlag();
            }
          } catch (error) {
            queuedRequest.reject(error);
          }
        }
        tokenExpirationState.clearQueuedRequests();
      }
      
      return result;
    } else {
      // Refresh failed
      if (!isRefreshRequest && tokenExpirationState.isDialogOpen) {
        // If dialog was shown, user already made a choice, so just return error
        // (logout was handled by context)
        tokenExpirationState.clearOriginalRequest();
        return result;
      }
      // No dialog was shown (refresh request failed), logout directly
      api.dispatch(logOut());
      tokenExpirationState.clearOriginalRequest();
      return result;
    }
  }

  // Global 409 handler: show Arabic message for delete conflicts
  if (result?.error?.status === 409) {
    const message = "لا يمكن الحذف لوجود بيانات مرتبطة.";
    showToastExternal(message, 'error');
  }

  // Global 403 handler: show detailed permission error
  if (result?.error?.status === 403) {
    const errorData = result.error.data as any;
    if (errorData?.missingPermissions && Array.isArray(errorData.missingPermissions) && errorData.missingPermissions.length > 0) {
      const missingArabic = translatePermissionsToArabic(errorData.missingPermissions);
      const message = `الصلاحيات المطلوبة غير متوفرة:\n${missingArabic.map(p => `• ${p}`).join('\n')}`;
      showToastExternal(message, 'error');
    } else {
      showToastExternal("غير مصرح لك بهذا الإجراء.", 'error');
    }
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
    "SubscriptionRequest",
    "AnnualSalesReport",
    "ItemProfitabilityReport",
    "FinancialSettings",
    "PrintSettings",
  ],
  endpoints: () => ({}),
});
