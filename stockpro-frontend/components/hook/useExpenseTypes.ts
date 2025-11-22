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

  // Define the order of expense types
  const expenseTypeOrder = [
    'مصروفات تشغيلية',
    'مصروفات تسويقية',
    'مصروفات إدارية',
    'مصروفات ادارية', // Handle both spellings (إ vs ا)
    'مصروفات اخري',
  ];

  // Filtered and sorted expense types based on search query
  const filteredExpenseTypes = useMemo(() => {
    let filtered = expenseTypes;
    
    // Apply search filter if query exists
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = expenseTypes.filter(
        (type) =>
          type.name.toLowerCase().includes(query) ||
          (type.description && type.description.toLowerCase().includes(query)),
      );
    }
    
    // Sort by predefined order
    return [...filtered].sort((a, b) => {
      const getOrderIndex = (name: string): number => {
        // Normalize name for comparison (handle both spellings of ادارية)
        const normalizedName = name.replace(/[إا]دارية/g, 'ادارية');
        
        // Try exact match first
        for (let i = 0; i < expenseTypeOrder.length; i++) {
          const normalizedOrder = expenseTypeOrder[i].replace(/[إا]دارية/g, 'ادارية');
          if (normalizedName === normalizedOrder || name === expenseTypeOrder[i]) {
            return i;
          }
        }
        
        // Try partial match (includes check)
        for (let i = 0; i < expenseTypeOrder.length; i++) {
          if (name.includes(expenseTypeOrder[i]) || expenseTypeOrder[i].includes(name)) {
            return i;
          }
        }
        
        return -1; // Not found in order list
      };
      
      const indexA = getOrderIndex(a.name);
      const indexB = getOrderIndex(b.name);
      
      // If both are in the order list, sort by their position
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // If only A is in the list, A comes first
      if (indexA !== -1) return -1;
      // If only B is in the list, B comes first
      if (indexB !== -1) return 1;
      // If neither is in the list, maintain original order
      return 0;
    });
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
            showToast("حدث خطأ أثناء حذف النوع", 'error');
            console.error("Error deleting expense type:", error);
          }
        },
        type: "delete",
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
          'error',
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
