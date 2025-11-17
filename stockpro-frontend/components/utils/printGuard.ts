import type { ToastType } from "../common/ToastProvider";

type ShowToastFn = (message: string, type?: ToastType) => void;

interface PrintGuardOptions {
  hasData: boolean;
  showToast: ShowToastFn;
  onAllowed: () => void;
  emptyMessage?: string;
}

const DEFAULT_EMPTY_MESSAGE = "لا توجد بيانات للطباعة";

export const guardPrint = ({
  hasData,
  showToast,
  onAllowed,
  emptyMessage = DEFAULT_EMPTY_MESSAGE,
}: PrintGuardOptions) => {
  if (!hasData) {
    showToast(emptyMessage, "error");
    return;
  }

  onAllowed();
};

