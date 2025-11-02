import { useState, useCallback, useMemo } from "react";
import {
  useGetBanksQuery,
  useCreateBankMutation,
  useUpdateBankMutation,
  useDeleteBankMutation,
  type Bank,
  type CreateBankRequest,
} from "../store/slices/bank/bankApiSlice";
import { useToast } from "../common/ToastProvider";
import { useModal } from "../common/ModalProvider";

export const useBanks = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bankToEdit, setBankToEdit] = useState<Bank | null>(null);
  const { showToast } = useToast();
  const { showModal } = useModal();

  // Fetch banks with optional search
  const {
    data: banks = [],
    isLoading,
    error,
    refetch,
  } = useGetBanksQuery(searchQuery || undefined);

  const [createBank, { isLoading: isCreating }] = useCreateBankMutation();
  const [updateBank, { isLoading: isUpdating }] = useUpdateBankMutation();
  const [deleteBank, { isLoading: isDeleting }] = useDeleteBankMutation();

  // Filtered banks based on search query
  const filteredBanks = useMemo(() => {
    if (!searchQuery) return banks;
    const query = searchQuery.toLowerCase();
    return banks.filter(
      (bank) =>
        bank.name.toLowerCase().includes(query) ||
        bank.accountNumber.toLowerCase().includes(query) ||
        bank.iban.toLowerCase().includes(query) ||
        bank.code.toLowerCase().includes(query),
    );
  }, [banks, searchQuery]);

  const handleOpenModal = useCallback((bank: Bank | null = null) => {
    setBankToEdit(bank);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setBankToEdit(null);
  }, []);

  const handleEditClick = useCallback(
    (bank: Bank) => {
      showModal({
        title: "تأكيد التعديل",
        message: "هل أنت متأكد من رغبتك في تعديل بيانات هذا البنك؟",
        onConfirm: () => handleOpenModal(bank),
        type: "edit",
        showPassword: true,
      });
    },
    [showModal, handleOpenModal],
  );

  const handleDeleteClick = useCallback(
    (bank: Bank) => {
      showModal({
        title: "تأكيد الحذف",
        message: `هل أنت متأكد من حذف البنك "${bank.name}"؟`,
        onConfirm: async () => {
          try {
            await deleteBank(bank.id).unwrap();
            showToast("تم حذف البنك بنجاح");
          } catch (error) {
            showToast("حدث خطأ أثناء حذف البنك", 'error');
            console.error("Error deleting bank:", error);
          }
        },
        type: "delete",
        showPassword: true,
      });
    },
    [showModal, deleteBank, showToast],
  );

  const handleSave = useCallback(
    async (bankData: Partial<Bank>) => {
      try {
        if (bankToEdit) {
          // Update existing bank
          await updateBank({
            id: bankToEdit.id,
            data: {
              name: bankData.name,
              accountNumber: bankData.accountNumber,
              iban: bankData.iban,
              openingBalance: bankData.openingBalance,
            },
          }).unwrap();
          showToast("تم تعديل البنك بنجاح");
        } else {
          // Create new bank
          const createData: CreateBankRequest = {
            name: bankData.name!,
            accountNumber: bankData.accountNumber!,
            iban: bankData.iban!,
            openingBalance: bankData.openingBalance || 0,
          };
          await createBank(createData).unwrap();
          showToast("تم إضافة البنك بنجاح");
        }
        handleCloseModal();
      } catch (error) {
        showToast(
          bankToEdit
            ? "حدث خطأ أثناء تعديل البنك"
            : "حدث خطأ أثناء إضافة البنك",
          'error',
        );
        console.error("Error saving bank:", error);
      }
    },
    [bankToEdit, createBank, updateBank, showToast, handleCloseModal],
  );

  return {
    banks: filteredBanks,
    isLoading: isLoading || isCreating || isUpdating || isDeleting,
    error,
    searchQuery,
    setSearchQuery,
    isModalOpen,
    bankToEdit,
    handleOpenModal,
    handleCloseModal,
    handleEditClick,
    handleDeleteClick,
    handleSave,
    refetch,
  };
};
