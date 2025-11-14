import { useState, useCallback, useMemo } from "react";
import {
  useGetSafesQuery,
  useCreateSafeMutation,
  useUpdateSafeMutation,
  useDeleteSafeMutation,
  type CreateSafeRequest,
} from "../store/slices/safe/safeApiSlice";
import type { Safe } from "../../types";
import { useToast } from "../common/ToastProvider";
import { useModal } from "../common/ModalProvider";

export const useSafes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [safeToEdit, setSafeToEdit] = useState<Safe | null>(null);
  const { showToast } = useToast();
  const { showModal } = useModal();

  // Fetch safes with optional search
  const {
    data: safes = [],
    isLoading,
    error,
    refetch,
  } = useGetSafesQuery(searchQuery || undefined);

  const [createSafe, { isLoading: isCreating }] = useCreateSafeMutation();
  const [updateSafe, { isLoading: isUpdating }] = useUpdateSafeMutation();
  const [deleteSafe, { isLoading: isDeleting }] = useDeleteSafeMutation();

  // Filtered safes based on search query
  const filteredSafes = useMemo(() => {
    if (!searchQuery) return safes;
    const query = searchQuery.toLowerCase();
    return safes.filter(
      (safe) =>
        safe.name.toLowerCase().includes(query) ||
        safe.branchName.toLowerCase().includes(query) ||
        safe.code.toLowerCase().includes(query),
    );
  }, [safes, searchQuery]);

  const handleOpenModal = useCallback((safe: Safe | null = null) => {
    setSafeToEdit(safe);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSafeToEdit(null);
  }, []);

  const handleEditClick = useCallback(
    (safe: Safe) => {
      showModal({
        title: "تأكيد التعديل",
        message: "هل أنت متأكد من رغبتك في تعديل بيانات هذه الخزنة؟",
        onConfirm: () => handleOpenModal(safe),
        type: "edit",
        showPassword: true,
      });
    },
    [showModal, handleOpenModal],
  );

  const handleDeleteClick = useCallback(
    (safe: Safe) => {
      showModal({
        title: "تأكيد الحذف",
        message: `هل أنت متأكد من حذف الخزنة "${safe.name}"؟`,
        onConfirm: async () => {
          try {
            await deleteSafe(safe.id).unwrap();
            showToast("تم حذف الخزنة بنجاح");
          } catch (error) {
            showToast("حدث خطأ أثناء حذف الخزنة", 'error');
            console.error("Error deleting safe:", error);
          }
        },
        type: "delete",
        showPassword: true,
      });
    },
    [showModal, deleteSafe, showToast],
  );

  const handleSave = useCallback(
    async (safeData: Partial<Safe>) => {
      try {
        if (safeToEdit) {
          // Update existing safe
          await updateSafe({
            id: safeToEdit.id,
            data: {
              name: safeData.name,
              branchId: safeData.branchId,
              openingBalance: safeData.openingBalance,
            },
          }).unwrap();
          showToast("تم تعديل الخزنة بنجاح");
        } else {
          // Create new safe
          const createData: CreateSafeRequest = {
            name: safeData.name!,
            branchId: safeData.branchId!,
            openingBalance: safeData.openingBalance || 0,
          };
          await createSafe(createData).unwrap();
          showToast("تم إضافة الخزنة بنجاح");
        }
        handleCloseModal();
      } catch (error) {
        showToast(
          safeToEdit
            ? "حدث خطأ أثناء تعديل الخزنة"
            : "حدث خطأ أثناء إضافة الخزنة",
          'error',
        );
        console.error("Error saving safe:", error);
      }
    },
    [safeToEdit, createSafe, updateSafe, showToast, handleCloseModal],
  );

  return {
    safes: filteredSafes,
    isLoading: isLoading || isCreating || isUpdating || isDeleting,
    error,
    searchQuery,
    setSearchQuery,
    isModalOpen,
    safeToEdit,
    handleOpenModal,
    handleCloseModal,
    handleEditClick,
    handleDeleteClick,
    handleSave,
    refetch,
  };
};
