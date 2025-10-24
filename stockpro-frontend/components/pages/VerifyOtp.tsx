import React, { useState, useRef, useEffect } from "react";
import {
  useVerifyForgotPasswordOtpMutation,
  useResendForgotPasswordOtpMutation,
} from "../store/slices/auth/authApi";
import { useToast } from "../common/ToastProvider";

interface VerifyOtpProps {
  email: string;
  onNavigate: (page: string) => void;
}

const VerifyOtp: React.FC<VerifyOtpProps> = ({ email, onNavigate }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const { showToast } = useToast();
  const [verifyOtp] = useVerifyForgotPasswordOtpMutation();
  const [resendOtp] = useResendForgotPasswordOtpMutation();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
    // Start initial countdown when component loads
    setResendCountdown(60);
  }, []);

  // Countdown effect
  useEffect(() => {
    if (resendCountdown > 0) {
      countdownRef.current = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
    }
    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, [resendCountdown]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    // Handle pasting - if value is longer than 1, it's likely a paste
    if (value.length > 1) {
      const pastedDigits = value.replace(/\D/g, "").slice(0, 6); // Only numbers, max 6 digits
      const newOtp = [...otp];

      // Fill the OTP array with pasted digits
      for (let i = 0; i < pastedDigits.length && i < 6; i++) {
        newOtp[i] = pastedDigits[i];
      }
      setOtp(newOtp);

      // Focus on the next empty field or the last field
      const nextEmptyIndex = pastedDigits.length < 6 ? pastedDigits.length : 5;
      if (inputRefs.current[nextEmptyIndex]) {
        inputRefs.current[nextEmptyIndex].focus();
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const pastedDigits = pastedData.replace(/\D/g, "").slice(0, 6); // Only numbers, max 6 digits

    if (pastedDigits.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedDigits.length && i < 6; i++) {
        newOtp[i] = pastedDigits[i];
      }
      setOtp(newOtp);

      // Focus on the next empty field or the last field
      const nextEmptyIndex = pastedDigits.length < 6 ? pastedDigits.length : 5;
      if (inputRefs.current[nextEmptyIndex]) {
        inputRefs.current[nextEmptyIndex].focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      showToast("يرجى إدخال رمز التحقق المكون من 6 أرقام");
      return;
    }

    setIsLoading(true);
    try {
      await verifyOtp({ email, otp: otpCode }).unwrap();
      showToast("تم التحقق من الرمز بنجاح");
      onNavigate("reset-password");
    } catch (error: any) {
      console.error("Verify OTP error:", error);
      showToast("رمز التحقق غير صحيح");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await resendOtp({ email }).unwrap();
      showToast("تم إرسال رمز جديد إلى بريدك الإلكتروني");
      setOtp(["", "", "", "", "", ""]);
      setResendCountdown(60); // Start 60-second countdown
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      showToast("حدث خطأ في إرسال الرمز");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-brand-dark">
            التحقق من الرمز
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            أدخل رمز التحقق المكون من 6 أرقام المرسل إلى
          </p>
          <p className="text-center text-sm font-medium text-brand-blue">
            {email}
          </p>
          <p className="text-center text-xs text-gray-500 mt-2">
            يمكنك لصق الرمز مباشرة في أي حقل
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div
            className="flex justify-center space-x-2 space-x-reverse"
            dir="ltr"
          >
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-12 text-center text-xl font-bold border-2 border-brand-blue rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue bg-brand-blue-bg"
                dir="ltr"
                style={{ direction: "ltr" }}
              />
            ))}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || otp.join("").length !== 6}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-blue hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "جاري التحقق..." : "تحقق من الرمز"}
            </button>
          </div>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending || resendCountdown > 0}
              className="text-brand-blue hover:text-blue-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending
                ? "جاري الإرسال..."
                : resendCountdown > 0
                  ? `إعادة إرسال الرمز (${resendCountdown} ثانية)`
                  : "إعادة إرسال الرمز"}
            </button>
            <div>
              <button
                type="button"
                onClick={() => onNavigate("forgot-password")}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                العودة لتغيير البريد الإلكتروني
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtp;
