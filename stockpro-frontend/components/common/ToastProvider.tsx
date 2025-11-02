import React, { createContext, useState, useContext, useCallback } from "react";

export type ToastType = 'success' | 'error';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
  toastMessage: string;
  toastType: ToastType;
  isToastVisible: boolean;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>('success');

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setIsToastVisible(true);
    setTimeout(() => {
      setIsToastVisible(false);
    }, 3000); // Hide after 3 seconds
  }, []);

  const hideToast = useCallback(() => {
    setIsToastVisible(false);
  }, []);

  // Register global trigger on each render to keep reference fresh
  registerExternalToast(showToast);

  return (
    <ToastContext.Provider
      value={{ showToast, hideToast, toastMessage, toastType, isToastVisible }}
    >
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

// Global, non-hook toast trigger for usage outside React components (e.g., RTK baseQuery)
let externalShowToast: ((message: string, type?: ToastType) => void) | null = null;

export const registerExternalToast = (showFn: (message: string, type?: ToastType) => void) => {
  externalShowToast = showFn;
};

export const showToastExternal = (message: string, type: ToastType = 'success') => {
  try {
    if (typeof externalShowToast === "function") {
      externalShowToast(message, type);
      return true;
    }
  } catch (_) {}
  return false;
};
