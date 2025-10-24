import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  ReactNode,
} from "react";
import ConfirmationModal from "./ConfirmationModal";

interface ModalOptions {
  title: string;
  message: string;
  onConfirm: (password?: string) => void;
  type?: "edit" | "delete" | "info";
  showPassword?: boolean;
}

interface ModalContextType {
  showModal: (options: ModalOptions) => void;
  hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [modalOptions, setModalOptions] = useState<ModalOptions | null>(null);

  const showModal = useCallback((options: ModalOptions) => {
    setModalOptions({ type: "info", ...options });
  }, []);

  const hideModal = useCallback(() => {
    setModalOptions(null);
  }, []);

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      {modalOptions && (
        <ConfirmationModal
          {...modalOptions}
          onCancel={hideModal}
          type={modalOptions.type ?? "info"}
        />
      )}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};
