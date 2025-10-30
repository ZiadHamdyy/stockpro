import React, { useCallback, useMemo, useState } from "react";
import { LockIcon } from "../icons";
import { useToast } from "./ToastProvider";
import { useVerifyPasswordMutation } from "../store/slices/auth/authApi";

interface ConfirmationModalProps {
  title: string;
  message: string;
  onConfirm: (password?: string) => void;
  onCancel: () => void;
  type: "edit" | "delete" | "info";
  showPassword?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  title,
  message,
  onConfirm,
  onCancel,
  type,
  showPassword,
}) => {
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = (useToast() as any) || {};
  const [verifyPassword] = useVerifyPasswordMutation();

  const handleConfirm = async () => {
    if (showPassword) {
      if (!password || isSubmitting) return;
      setIsSubmitting(true);
      try {
        await verifyPassword({ password }).unwrap();
        // Success: inform parent and close modal
        onConfirm();
        onCancel();
      } catch (err: any) {
        if (showToast) {
          const status = err?.status || err?.originalStatus;
          if (status === 400 || status === 401 || status === 404) {
            showToast("كلمة المرور غير صحيحة");
          } else {
            showToast("حدث خطأ أثناء التحقق. حاول مرة أخرى");
          }
        }
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // No password required, just inform parent
      onConfirm();
    }
  };

  const colors = {
    edit: {
      bg: "bg-blue-100",
      button: "bg-brand-blue hover:bg-blue-800 focus:ring-brand-blue",
      title: "text-brand-blue",
    },
    delete: {
      bg: "bg-red-100",
      button: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
      title: "text-red-600",
    },
    info: {
      bg: "bg-gray-100",
      button: "bg-gray-600 hover:bg-gray-700 focus:ring-gray-500",
      title: "text-gray-800",
    },
  };

  const selectedTheme = colors[type] || colors.info;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={() => {
        if (!isSubmitting) onCancel();
      }}
    >
      <div
        className={`bg-white rounded-lg shadow-xl w-full max-w-md ${selectedTheme.bg}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <h2 className={`text-2xl font-bold mb-4 ${selectedTheme.title}`}>
            {title}
          </h2>
          <p className="text-gray-600 mb-6">{message}</p>

          {showPassword && (
            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1 text-right"
              >
                الرقم السري للتأكيد
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <LockIcon className="h-5 w-5 text-gray-400" />
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleConfirm();
                    }
                  }}
                  className="w-full pr-10 pl-4 py-3 bg-white border-2 border-gray-300 rounded-md text-brand-blue placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          <div className="flex justify-center gap-4">
            <button
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-8 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              إلغاء
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting || (showPassword ? password.length === 0 : false)}
              className={`px-8 py-2 text-white rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${selectedTheme.button}`}
            >
              {isSubmitting ? "جاري التحقق..." : "تأكيد"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
