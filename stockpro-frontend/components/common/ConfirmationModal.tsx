import React, { useState } from "react";

interface ConfirmationModalProps {
  title: string;
  message: string;
  onConfirm: (password?: string) => void | Promise<void>;
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
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await Promise.resolve(onConfirm());
    } catch (error) {
      // Error handling is done in the parent component
      console.error("Error in confirmation:", error);
    } finally {
      setIsSubmitting(false);
      // Close the modal after the request is done
      onCancel();
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
              disabled={isSubmitting}
              className={`px-8 py-2 text-white rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${selectedTheme.button}`}
            >
              {isSubmitting ? "جاري المعالجة..." : "تأكيد"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
