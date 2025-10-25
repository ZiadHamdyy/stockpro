import { useState, useCallback, useMemo } from "react";
import {
  useGetExpenseCodesQuery,
  useCreateExpenseCodeMutation,
  useUpdateExpenseCodeMutation,
  useDeleteExpenseCodeMutation,
  type ExpenseCode,
  type CreateExpenseCodeRequest,
} from "../store/slices/expense/expenseApiSlice";
import { useGetExpenseTypesQuery } from "../store/slices/expense/expenseApiSlice";
import { useToast } from "../common/ToastProvider";
import { useModal } from "../common/ModalProvider";

export const useExpenseCodes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseCodeToEdit, setExpenseCodeToEdit] =
    useState<ExpenseCode | null>(null);
  const { showToast } = useToast();
  const { showModal } = useModal();

  // Fetch expense codes with optional search
  const {
    data: expenseCodes = [],
    isLoading: isLoadingCodes,
    error,
    refetch,
  } = useGetExpenseCodesQuery(searchQuery || undefined);

  // Fetch expense types for the dropdown
  const { data: expenseTypes = [] } = useGetExpenseTypesQuery();

  const [createExpenseCode, { isLoading: isCreating }] =
    useCreateExpenseCodeMutation();
  const [updateExpenseCode, { isLoading: isUpdating }] =
    useUpdateExpenseCodeMutation();
  const [deleteExpenseCode, { isLoading: isDeleting }] =
    useDeleteExpenseCodeMutation();

  // Filtered expense codes based on search query
  const filteredExpenseCodes = useMemo(() => {
    if (!searchQuery) return expenseCodes;
    const query = searchQuery.toLowerCase();
    return expenseCodes.filter(
      (code) =>
        code.name.toLowerCase().includes(query) ||
        code.code.toLowerCase().includes(query) ||
        (code.description && code.description.toLowerCase().includes(query)) ||
        (code.expenseType &&
          code.expenseType.name.toLowerCase().includes(query)),
    );
  }, [expenseCodes, searchQuery]);

  const handleOpenModal = useCallback(
    (expenseCode: ExpenseCode | null = null) => {
      setExpenseCodeToEdit(expenseCode);
      setIsModalOpen(true);
    },
    [],
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setExpenseCodeToEdit(null);
  }, []);

  const handleEditClick = useCallback(
    (expenseCode: ExpenseCode) => {
      showModal({
        title: "تأكيد التعديل",
        message: "هل أنت متأكد من رغبتك في تعديل بيانات هذا البند؟",
        onConfirm: () => handleOpenModal(expenseCode),
        type: "edit",
        showPassword: true,
      });
    },
    [showModal, handleOpenModal],
  );

  const handleDeleteClick = useCallback(
    (expenseCode: ExpenseCode) => {
      showModal({
        title: "تأكيد الحذف",
        message: `هل أنت متأكد من حذف البند "${expenseCode.name}"؟`,
        onConfirm: async () => {
          try {
            await deleteExpenseCode(expenseCode.id).unwrap();
            showToast("تم حذف البند بنجاح");
          } catch (error) {
            showToast("حدث خطأ أثناء حذف البند");
            console.error("Error deleting expense code:", error);
          }
        },
        type: "delete",
        showPassword: true,
      });
    },
    [showModal, deleteExpenseCode, showToast],
  );

  const handleSave = useCallback(
    async (data: {
      name: string;
      expenseTypeId: string;
      description?: string;
    }) => {
      try {
        if (expenseCodeToEdit) {
          // Update existing expense code
          await updateExpenseCode({
            id: expenseCodeToEdit.id,
            data: {
              name: data.name,
              expenseTypeId: data.expenseTypeId,
              description: data.description,
            },
          }).unwrap();
          showToast("تم تعديل البند بنجاح");
        } else {
          // Create new expense code
          const createData: CreateExpenseCodeRequest = {
            name: data.name,
            expenseTypeId: data.expenseTypeId,
            description: data.description,
          };
          await createExpenseCode(createData).unwrap();
          showToast("تم إضافة البند بنجاح");
        }
        handleCloseModal();
      } catch (error) {
        showToast(
          expenseCodeToEdit
            ? "حدث خطأ أثناء تعديل البند"
            : "حدث خطأ أثناء إضافة البند",
        );
        console.error("Error saving expense code:", error);
      }
    },
    [
      expenseCodeToEdit,
      createExpenseCode,
      updateExpenseCode,
      showToast,
      handleCloseModal,
    ],
  );

  return {
    expenseCodes: filteredExpenseCodes,
    expenseTypes,
    isLoading: isLoadingCodes || isCreating || isUpdating || isDeleting,
    error,
    searchQuery,
    setSearchQuery,
    isModalOpen,
    expenseCodeToEdit,
    handleOpenModal,
    handleCloseModal,
    handleEditClick,
    handleDeleteClick,
    handleSave,
    refetch,
  };
};
