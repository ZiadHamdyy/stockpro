import { useState, useCallback, useMemo } from "react";
import {
  useGetExpenseTypesQuery,
  useCreateExpenseTypeMutation,
  useUpdateExpenseTypeMutation,
  useDeleteExpenseTypeMutation,
  type ExpenseType,
  type CreateExpenseTypeRequest,
} from "../store/slices/expense/expenseApiSlice";
import { useToast } from "../common/ToastProvider";
import { useModal } from "../common/ModalProvider";

export const useExpenseTypes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseTypeToEdit, setExpenseTypeToEdit] =
    useState<ExpenseType | null>(null);
  const { showToast } = useToast();
  const { showModal } = useModal();

  // Fetch expense types with optional search
  const {
    data: expenseTypes = [],
    isLoading,
    error,
    refetch,
  } = useGetExpenseTypesQuery(searchQuery || undefined);

  const [createExpenseType, { isLoading: isCreating }] =
    useCreateExpenseTypeMutation();
  const [updateExpenseType, { isLoading: isUpdating }] =
    useUpdateExpenseTypeMutation();
  const [deleteExpenseType, { isLoading: isDeleting }] =
    useDeleteExpenseTypeMutation();

  // Filtered expense types based on search query
  const filteredExpenseTypes = useMemo(() => {
    if (!searchQuery) return expenseTypes;
    const query = searchQuery.toLowerCase();
    return expenseTypes.filter(
      (type) =>
        type.name.toLowerCase().includes(query) ||
        (type.description && type.description.toLowerCase().includes(query)),
    );
  }, [expenseTypes, searchQuery]);

  const handleOpenModal = useCallback(
    (expenseType: ExpenseType | null = null) => {
      setExpenseTypeToEdit(expenseType);
      setIsModalOpen(true);
    },
    [],
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setExpenseTypeToEdit(null);
  }, []);

  const handleEditClick = useCallback(
    (expenseType: ExpenseType) => {
      showModal({
        title: "تأكيد التعديل",
        message: "هل أنت متأكد من رغبتك في تعديل بيانات هذا النوع؟",
        onConfirm: () => handleOpenModal(expenseType),
        type: "edit",
        showPassword: true,
      });
    },
    [showModal, handleOpenModal],
  );

  const handleDeleteClick = useCallback(
    (expenseType: ExpenseType) => {
      showModal({
        title: "تأكيد الحذف",
        message: `هل أنت متأكد من حذف النوع "${expenseType.name}"؟`,
        onConfirm: async () => {
          try {
            await deleteExpenseType(expenseType.id).unwrap();
            showToast("تم حذف النوع بنجاح");
          } catch (error) {
            showToast("حدث خطأ أثناء حذف النوع");
            console.error("Error deleting expense type:", error);
          }
        },
        type: "delete",
        showPassword: true,
      });
    },
    [showModal, deleteExpenseType, showToast],
  );

  const handleSave = useCallback(
    async (data: { name: string; description?: string }) => {
      try {
        if (expenseTypeToEdit) {
          // Update existing expense type
          await updateExpenseType({
            id: expenseTypeToEdit.id,
            data: {
              name: data.name,
              description: data.description,
            },
          }).unwrap();
          showToast("تم تعديل النوع بنجاح");
        } else {
          // Create new expense type
          const createData: CreateExpenseTypeRequest = {
            name: data.name,
            description: data.description,
          };
          await createExpenseType(createData).unwrap();
          showToast("تم إضافة النوع بنجاح");
        }
        handleCloseModal();
      } catch (error) {
        showToast(
          expenseTypeToEdit
            ? "حدث خطأ أثناء تعديل النوع"
            : "حدث خطأ أثناء إضافة النوع",
        );
        console.error("Error saving expense type:", error);
      }
    },
    [
      expenseTypeToEdit,
      createExpenseType,
      updateExpenseType,
      showToast,
      handleCloseModal,
    ],
  );

  return {
    expenseTypes: filteredExpenseTypes,
    isLoading: isLoading || isCreating || isUpdating || isDeleting,
    error,
    searchQuery,
    setSearchQuery,
    isModalOpen,
    expenseTypeToEdit,
    handleOpenModal,
    handleCloseModal,
    handleEditClick,
    handleDeleteClick,
    handleSave,
    refetch,
  };
};
