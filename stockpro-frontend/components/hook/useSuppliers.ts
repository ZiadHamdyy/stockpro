import { useState, useCallback, useMemo } from "react";
import {
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  type Supplier,
  type CreateSupplierRequest,
} from "../store/slices/supplier/supplierApiSlice";
import { useToast } from "../common/ToastProvider";
import { useModal } from "../common/ModalProvider";
import { showApiErrorToast } from "../../utils/errorToast";

export const useSuppliers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
  const { showToast } = useToast();
  const { showModal } = useModal();

  // Fetch suppliers with optional search
  const {
    data: suppliers = [],
    isLoading,
    error,
    refetch,
  } = useGetSuppliersQuery(searchQuery || undefined);

  const [createSupplier, { isLoading: isCreating }] =
    useCreateSupplierMutation();
  const [updateSupplier, { isLoading: isUpdating }] =
    useUpdateSupplierMutation();
  const [deleteSupplier, { isLoading: isDeleting }] =
    useDeleteSupplierMutation();

  // Filtered suppliers based on search query
  const filteredSuppliers = useMemo(() => {
    if (!searchQuery) return suppliers;
    const query = searchQuery.toLowerCase();
    return suppliers.filter(
      (supplier) =>
        supplier.name.toLowerCase().includes(query) ||
        supplier.code.toLowerCase().includes(query) ||
        supplier.phone.toLowerCase().includes(query) ||
        supplier.taxNumber.toLowerCase().includes(query),
    );
  }, [suppliers, searchQuery]);

  const handleOpenModal = useCallback((supplier: Supplier | null = null) => {
    setSupplierToEdit(supplier);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSupplierToEdit(null);
  }, []);

  const handleEditClick = useCallback(
    (supplier: Supplier) => {
      showModal({
        title: "تأكيد التعديل",
        message: "هل أنت متأكد من رغبتك في تعديل بيانات هذا المورد؟",
        onConfirm: () => handleOpenModal(supplier),
        type: "edit",
        showPassword: true,
      });
    },
    [showModal, handleOpenModal],
  );

  const handleDeleteClick = useCallback(
    (supplier: Supplier) => {
      showModal({
        title: "تأكيد الحذف",
        message: `هل أنت متأكد من حذف المورد "${supplier.name}"؟`,
        onConfirm: async () => {
          try {
            await deleteSupplier(supplier.id).unwrap();
            showToast("تم حذف المورد بنجاح");
          } catch (error) {
            showApiErrorToast(error);
            console.error("Error deleting supplier:", error);
          }
        },
        type: "delete",
        showPassword: true,
      });
    },
    [showModal, deleteSupplier, showToast],
  );

  const handleSave = useCallback(
    async (supplierData: Partial<Supplier>, editingId?: string) => {
      // Check if we're updating an existing supplier (has id property or editingId provided)
      const isUpdate = !!(
        supplierToEdit ||
        editingId ||
        ("id" in supplierData && supplierData.id)
      );
      const supplierId =
        editingId || supplierToEdit?.id || (supplierData.id as string);

      try {
        if (isUpdate && supplierId) {
          // Update existing supplier
          await updateSupplier({
            id: supplierId,
            data: {
              name: supplierData.name,
              commercialReg: supplierData.commercialReg,
              taxNumber: supplierData.taxNumber,
              nationalAddress: supplierData.nationalAddress,
              phone: supplierData.phone,
              openingBalance: supplierData.openingBalance,
            },
          }).unwrap();
          showToast("تم تعديل المورد بنجاح");
        } else {
          // Create new supplier
          const createData: CreateSupplierRequest = {
            name: supplierData.name!,
            commercialReg: supplierData.commercialReg!,
            taxNumber: supplierData.taxNumber!,
            nationalAddress: supplierData.nationalAddress!,
            phone: supplierData.phone!,
            openingBalance: supplierData.openingBalance || 0,
          };
          await createSupplier(createData).unwrap();
          showToast("تم إضافة المورد بنجاح");
        }
        handleCloseModal();
      } catch (error) {
        showToast(
          isUpdate
            ? "حدث خطأ أثناء تعديل المورد"
            : "حدث خطأ أثناء إضافة المورد",
        );
        console.error("Error saving supplier:", error);
      }
    },
    [
      supplierToEdit,
      createSupplier,
      updateSupplier,
      showToast,
      handleCloseModal,
    ],
  );

  return {
    suppliers: filteredSuppliers,
    isLoading: isLoading || isCreating || isUpdating || isDeleting,
    error,
    searchQuery,
    setSearchQuery,
    isModalOpen,
    supplierToEdit,
    handleOpenModal,
    handleCloseModal,
    handleEditClick,
    handleDeleteClick,
    handleSave,
    refetch,
  };
};
