import { useState, useCallback, useMemo } from "react";
import {
  useGetCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  type Customer,
  type CreateCustomerRequest,
} from "../store/slices/customer/customerApiSlice";
import { useToast } from "../common/ToastProvider";
import { showApiErrorToast } from "../../utils/errorToast";
import { useModal } from "../common/ModalProvider";

export const useCustomers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const { showToast } = useToast();
  const { showModal } = useModal();

  // Fetch customers with optional search
  const {
    data: customers = [],
    isLoading,
    error,
    refetch,
  } = useGetCustomersQuery(searchQuery || undefined);

  const [createCustomer, { isLoading: isCreating }] =
    useCreateCustomerMutation();
  const [updateCustomer, { isLoading: isUpdating }] =
    useUpdateCustomerMutation();
  const [deleteCustomer, { isLoading: isDeleting }] =
    useDeleteCustomerMutation();

  // Filtered customers based on search query
  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    const query = searchQuery.toLowerCase();
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.code.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query) ||
        customer.taxNumber.toLowerCase().includes(query),
    );
  }, [customers, searchQuery]);

  const handleOpenModal = useCallback((customer: Customer | null = null) => {
    setCustomerToEdit(customer);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setCustomerToEdit(null);
  }, []);

  const handleEditClick = useCallback(
    (customer: Customer) => {
      showModal({
        title: "تأكيد التعديل",
        message: "هل أنت متأكد من رغبتك في تعديل بيانات هذا العميل؟",
        onConfirm: () => handleOpenModal(customer),
        type: "edit",
        showPassword: true,
      });
    },
    [showModal, handleOpenModal],
  );

  const handleDeleteClick = useCallback(
    (customer: Customer) => {
      showModal({
        title: "تأكيد الحذف",
        message: `هل أنت متأكد من حذف العميل "${customer.name}"؟`,
        onConfirm: async () => {
          try {
            await deleteCustomer(customer.id).unwrap();
            showToast("تم حذف العميل بنجاح");
          } catch (error) {
            showApiErrorToast(error);
            console.error("Error deleting customer:", error);
          }
        },
        type: "delete",
        showPassword: true,
      });
    },
    [showModal, deleteCustomer, showToast],
  );

  const handleSave = useCallback(
    async (customerData: Partial<Customer>, editingId?: string) => {
      // Check if we're updating an existing customer (has id property or editingId provided)
      const isUpdate = !!(
        customerToEdit ||
        editingId ||
        ("id" in customerData && customerData.id)
      );
      const customerId =
        editingId || customerToEdit?.id || (customerData.id as string);

      try {
        if (isUpdate && customerId) {
          // Update existing customer
          await updateCustomer({
            id: customerId,
            data: {
              name: customerData.name,
              commercialReg: customerData.commercialReg,
              taxNumber: customerData.taxNumber,
              nationalAddress: customerData.nationalAddress,
              phone: customerData.phone,
              openingBalance: customerData.openingBalance,
            },
          }).unwrap();
          showToast("تم تعديل العميل بنجاح");
        } else {
          // Create new customer
          const createData: CreateCustomerRequest = {
            name: customerData.name!,
            commercialReg: customerData.commercialReg!,
            taxNumber: customerData.taxNumber!,
            nationalAddress: customerData.nationalAddress!,
            phone: customerData.phone!,
            openingBalance: customerData.openingBalance || 0,
          };
          await createCustomer(createData).unwrap();
          showToast("تم إضافة العميل بنجاح");
        }
        handleCloseModal();
      } catch (error) {
        showToast(
          isUpdate
            ? "حدث خطأ أثناء تعديل العميل"
            : "حدث خطأ أثناء إضافة العميل",
          'error',
        );
        console.error("Error saving customer:", error);
      }
    },
    [
      customerToEdit,
      createCustomer,
      updateCustomer,
      showToast,
      handleCloseModal,
    ],
  );

  return {
    customers: filteredCustomers,
    isLoading: isLoading || isCreating || isUpdating || isDeleting,
    error,
    searchQuery,
    setSearchQuery,
    isModalOpen,
    customerToEdit,
    handleOpenModal,
    handleCloseModal,
    handleEditClick,
    handleDeleteClick,
    handleSave,
    refetch,
  };
};
