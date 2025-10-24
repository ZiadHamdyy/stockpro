import React, { createContext, useState, useContext, useCallback } from "react";

interface ToastContextType {
  showToast: (message: string) => void;
  hideToast: () => void;
  toastMessage: string;
  isToastVisible: boolean;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setIsToastVisible(true);
    setTimeout(() => {
      setIsToastVisible(false);
    }, 3000); // Hide after 3 seconds
  }, []);

  const hideToast = useCallback(() => {
    setIsToastVisible(false);
  }, []);

  return (
    <ToastContext.Provider
      value={{ showToast, hideToast, toastMessage, isToastVisible }}
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
