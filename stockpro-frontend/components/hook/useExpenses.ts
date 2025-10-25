import { useState, useCallback, useMemo } from "react";
import {
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  type Expense,
  type CreateExpenseRequest,
} from "../store/slices/expense/expenseApiSlice";
import { useGetExpenseCodesQuery } from "../store/slices/expense/expenseApiSlice";
import { useToast } from "../common/ToastProvider";
import { useModal } from "../common/ModalProvider";

export const useExpenses = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const { showToast } = useToast();
  const { showModal } = useModal();

  // Fetch expenses with optional search
  const {
    data: expenses = [],
    isLoading: isLoadingExpenses,
    error,
    refetch,
  } = useGetExpensesQuery(searchQuery || undefined);

  // Fetch expense codes for the dropdown
  const { data: expenseCodes = [] } = useGetExpenseCodesQuery();

  const [createExpense, { isLoading: isCreating }] = useCreateExpenseMutation();
  const [updateExpense, { isLoading: isUpdating }] = useUpdateExpenseMutation();
  const [deleteExpense, { isLoading: isDeleting }] = useDeleteExpenseMutation();

  // Filtered expenses based on search query
  const filteredExpenses = useMemo(() => {
    if (!searchQuery) return expenses;
    const query = searchQuery.toLowerCase();
    return expenses.filter(
      (expense) =>
        expense.code.toLowerCase().includes(query) ||
        (expense.description &&
          expense.description.toLowerCase().includes(query)) ||
        (expense.expenseCode &&
          expense.expenseCode.name.toLowerCase().includes(query)),
    );
  }, [expenses, searchQuery]);

  const handleDeleteClick = useCallback(
    (expense: Expense) => {
      showModal({
        title: "تأكيد الحذف",
        message: `هل أنت متأكد من حذف المصروف رقم "${expense.code}"؟`,
        onConfirm: async () => {
          try {
            await deleteExpense(expense.id).unwrap();
            showToast("تم حذف المصروف بنجاح");
          } catch (error) {
            showToast("حدث خطأ أثناء حذف المصروف");
            console.error("Error deleting expense:", error);
          }
        },
        type: "delete",
      });
    },
    [showModal, deleteExpense, showToast],
  );

  const handleCreate = useCallback(
    async (data: {
      date: string;
      expenseCodeId: string;
      description?: string;
    }) => {
      try {
        const createData: CreateExpenseRequest = {
          date: data.date,
          expenseCodeId: data.expenseCodeId,
          description: data.description,
        };
        await createExpense(createData).unwrap();
        showToast("تم إضافة المصروف بنجاح");
      } catch (error) {
        showToast("حدث خطأ أثناء إضافة المصروف");
        console.error("Error creating expense:", error);
      }
    },
    [createExpense, showToast],
  );

  const handleUpdate = useCallback(
    async (
      id: string,
      data: {
        date?: string;
        expenseCodeId?: string;
        description?: string;
      },
    ) => {
      try {
        await updateExpense({ id, data }).unwrap();
        showToast("تم تعديل المصروف بنجاح");
      } catch (error) {
        showToast("حدث خطأ أثناء تعديل المصروف");
        console.error("Error updating expense:", error);
      }
    },
    [updateExpense, showToast],
  );

  const handleOpenModal = (expense?: Expense) => {
    setExpenseToEdit(expense || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setExpenseToEdit(null);
  };

  const handleEditClick = (expense: Expense) => {
    showModal({
      title: "تأكيد التعديل",
      message: "هل أنت متأكد من رغبتك في تعديل بيانات هذا المصروف؟",
      onConfirm: () => handleOpenModal(expense),
      type: "edit",
      showPassword: true,
    });
  };

  const handleSave = async (data: {
    date: string;
    expenseCodeId: string;
    description?: string;
  }) => {
    if (expenseToEdit) {
      await handleUpdate(expenseToEdit.id, data);
    } else {
      await handleCreate(data);
    }
    handleCloseModal();
  };

  return {
    expenses: filteredExpenses,
    expenseCodes,
    isLoading: isLoadingExpenses || isCreating || isUpdating || isDeleting,
    error,
    searchQuery,
    setSearchQuery,
    isModalOpen,
    expenseToEdit,
    handleOpenModal,
    handleCloseModal,
    handleEditClick,
    handleDeleteClick,
    handleSave,
    refetch,
  };
};
