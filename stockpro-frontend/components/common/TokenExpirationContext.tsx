import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import TokenExpirationDialog from "./TokenExpirationDialog";
import { useAppDispatch } from "../store/hooks";
import { logOut } from "../store/slices/auth/auth";
import { store } from "../store/store";

interface QueuedRequest {
  args: any;
  api: any;
  extraOptions: any;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

// Global state for token expiration handling (accessible from ApiSlice)
interface TokenExpirationState {
  isDialogOpen: boolean;
  queuedRequests: QueuedRequest[];
  originalRequest: QueuedRequest | null;
  userChoicePromise: {
    resolve: (choice: "stay" | "logout") => void;
    reject: (error: any) => void;
  } | null;
  showDialog: () => void;
  setOriginalRequest: (args: any, api: any, extraOptions: any) => void;
  queueRequest: (args: any, api: any, extraOptions: any) => Promise<any>;
  waitForUserChoice: () => Promise<"stay" | "logout">;
  handleUserChoice: (choice: "stay" | "logout") => void;
  getQueuedRequests: () => QueuedRequest[];
  getOriginalRequest: () => QueuedRequest | null;
  clearQueuedRequests: () => void;
  clearOriginalRequest: () => void;
}

const createTokenExpirationState = (): TokenExpirationState => {
  let isDialogOpen = false;
  let queuedRequests: QueuedRequest[] = [];
  let originalRequest: QueuedRequest | null = null;
  let userChoicePromise: {
    resolve: (choice: "stay" | "logout") => void;
    reject: (error: any) => void;
  } | null = null;

  const showDialog = () => {
    if (!isDialogOpen && !userChoicePromise) {
      isDialogOpen = true;
      // Trigger React state update via custom event
      window.dispatchEvent(new CustomEvent("token-expiration-dialog-open"));
    }
  };

  const setOriginalRequest = (args: any, api: any, extraOptions: any) => {
    originalRequest = { args, api, extraOptions, resolve: () => {}, reject: () => {} };
  };

  const queueRequest = (
    args: any,
    api: any,
    extraOptions: any,
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      queuedRequests.push({ args, api, extraOptions, resolve, reject });
      showDialog();
    });
  };

  const waitForUserChoice = (): Promise<"stay" | "logout"> => {
    return new Promise((resolve, reject) => {
      userChoicePromise = { resolve, reject };
    });
  };

  const handleUserChoice = (choice: "stay" | "logout") => {
    if (userChoicePromise) {
      userChoicePromise.resolve(choice);
      userChoicePromise = null;
    }
    isDialogOpen = false;
    window.dispatchEvent(new CustomEvent("token-expiration-dialog-close"));
  };

  const getQueuedRequests = () => {
    return [...queuedRequests];
  };

  const getOriginalRequest = () => {
    return originalRequest;
  };

  const clearQueuedRequests = () => {
    queuedRequests = [];
  };

  const clearOriginalRequest = () => {
    originalRequest = null;
  };

  return {
    get isDialogOpen() {
      return isDialogOpen;
    },
    get queuedRequests() {
      return queuedRequests;
    },
    get originalRequest() {
      return originalRequest;
    },
    get userChoicePromise() {
      return userChoicePromise;
    },
    showDialog,
    setOriginalRequest,
    queueRequest,
    waitForUserChoice,
    handleUserChoice,
    getQueuedRequests,
    getOriginalRequest,
    clearQueuedRequests,
    clearOriginalRequest,
  };
};

// Global instance
const tokenExpirationState = createTokenExpirationState();

// Export for use in ApiSlice
export const getTokenExpirationState = () => tokenExpirationState;

interface TokenExpirationContextType {
  isDialogOpen: boolean;
}

const TokenExpirationContext = createContext<
  TokenExpirationContextType | undefined
>(undefined);

export const useTokenExpiration = () => {
  const context = useContext(TokenExpirationContext);
  if (!context) {
    throw new Error(
      "useTokenExpiration must be used within TokenExpirationProvider",
    );
  }
  return context;
};

interface TokenExpirationProviderProps {
  children: ReactNode;
}

export const TokenExpirationProvider: React.FC<
  TokenExpirationProviderProps
> = ({ children }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const dispatch = useAppDispatch();

  // Listen for dialog open/close events
  React.useEffect(() => {
    const handleDialogOpen = () => {
      setIsDialogOpen(true);
    };
    const handleDialogClose = () => {
      setIsDialogOpen(false);
    };

    window.addEventListener("token-expiration-dialog-open", handleDialogOpen);
    window.addEventListener("token-expiration-dialog-close", handleDialogClose);

    return () => {
      window.removeEventListener(
        "token-expiration-dialog-open",
        handleDialogOpen,
      );
      window.removeEventListener(
        "token-expiration-dialog-close",
        handleDialogClose,
      );
    };
  }, []);

  const handleStayLoggedIn = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      tokenExpirationState.handleUserChoice("stay");
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  const handleLogOut = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      tokenExpirationState.handleUserChoice("logout");

      // Call logout endpoint to delete session and clear cookie
      // Use fetch directly to avoid circular dependency with authApi
      try {
        const baseUrl =
          (import.meta as any).env?.VITE_BASE_BACK_URL ||
          "http://localhost:4000/api/v1";
        await fetch(`${baseUrl}/auth/logout`, {
          method: "DELETE",
          credentials: "include",
        });
      } catch (error) {
        console.error("Logout API call failed:", error);
      }

      // Clear Redux state
      dispatch(logOut());

      // Reset API state - use dynamic import to avoid circular dependency
      try {
        const { apiSlice } = await import("../store/ApiSlice");
        store.dispatch(apiSlice.util.resetApiState());
      } catch (error) {
        console.error("Failed to reset API state:", error);
      }

      // Reject all queued requests
      const requests = tokenExpirationState.getQueuedRequests();
      requests.forEach((req) => {
        req.reject(new Error("User logged out"));
      });
      tokenExpirationState.clearQueuedRequests();
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, dispatch]);

  return (
    <TokenExpirationContext.Provider value={{ isDialogOpen }}>
      {children}
      <TokenExpirationDialog
        isOpen={isDialogOpen}
        onStayLoggedIn={handleStayLoggedIn}
        onLogOut={handleLogOut}
      />
    </TokenExpirationContext.Provider>
  );
};

