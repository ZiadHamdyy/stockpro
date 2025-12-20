import React, { useState, useEffect, useRef, useCallback } from "react";

interface TokenExpirationDialogProps {
  isOpen: boolean;
  onStayLoggedIn: () => void | Promise<void>;
  onLogOut: () => void | Promise<void>;
}

const TokenExpirationDialog: React.FC<TokenExpirationDialogProps> = ({
  isOpen,
  onStayLoggedIn,
  onLogOut,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(10);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogOut = useCallback(async () => {
    if (isProcessing) return;
    // Clear timers
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsProcessing(true);
    try {
      await Promise.resolve(onLogOut());
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, onLogOut]);

  // Auto-logout timer: 10 seconds
  useEffect(() => {
    if (isOpen && !isProcessing) {
      setTimeRemaining(10);
      
      // Countdown interval
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Time's up, trigger logout
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            handleLogOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Cleanup on unmount or when dialog closes
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    } else {
      // Clear timers when dialog closes or processing starts
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  }, [isOpen, isProcessing, handleLogOut]);

  const handleStayLoggedIn = async () => {
    if (isProcessing) return;
    // Clear timers
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsProcessing(true);
    try {
      await Promise.resolve(onStayLoggedIn());
    } catch (error) {
      console.error("Error staying logged in:", error);
    } finally {
      setIsProcessing(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-[9999] flex justify-center items-center p-4"
      // Prevent closing by clicking outside - user must choose
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md bg-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            انتهت صلاحية الجلسة
          </h2>
          <p className="text-gray-600 mb-6 whitespace-pre-line">
            انتهت صلاحية جلسة تسجيل الدخول الخاصة بك. هل تريد البقاء مسجلاً الدخول؟
          </p>
          <p className="text-sm text-red-600 mb-4 font-semibold">
            سيتم تسجيل الخروج تلقائياً خلال {timeRemaining} ثانية
          </p>

          <div className="flex justify-center gap-4">
            <button
              onClick={handleLogOut}
              disabled={isProcessing}
              className="px-8 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? "جاري المعالجة..." : "تسجيل الخروج"}
            </button>
            <button
              onClick={handleStayLoggedIn}
              disabled={isProcessing}
              className="px-8 py-2 bg-brand-blue hover:bg-blue-800 text-white rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? "جاري المعالجة..." : "البقاء مسجلاً الدخول"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenExpirationDialog;

