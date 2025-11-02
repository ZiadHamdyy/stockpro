import React from "react";
import { useToast } from "./ToastProvider";

const Toast: React.FC = () => {
  const { isToastVisible, toastMessage, toastType, hideToast } = useToast();

  if (!isToastVisible) {
    return null;
  }

  const bgColor = toastType === 'error' ? 'bg-red-500' : 'bg-brand-green';

  return (
    <div
      className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] px-6 py-3 rounded-md shadow-lg ${bgColor} text-white text-lg font-semibold animate-fade-in-out`}
      role="alert"
      aria-live="assertive"
    >
      {toastMessage}
    </div>
  );
};

// Add keyframes for animation in index.html or a global CSS file
const styles = `
@keyframes fadeInOut {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
  15% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  85% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
}
.animate-fade-in-out {
  animation: fadeInOut 3s ease-in-out forwards;
}
`;

// Inject styles into the head
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default Toast;
