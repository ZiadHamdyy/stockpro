import { useState, useCallback, useEffect } from "react";
import {
  useGetReceiptVouchersQuery,
  useCreateReceiptVoucherMutation,
  useUpdateReceiptVoucherMutation,
  useDeleteReceiptVoucherMutation,
  type ReceiptVoucher,
  type CreateReceiptVoucherRequest,
} from "../store/slices/receiptVoucherApiSlice";
import { useGetCustomersQuery } from "../store/slices/customer/customerApiSlice";
import { useGetSuppliersQuery } from "../store/slices/supplier/supplierApiSlice";
import { useGetCurrentAccountsQuery } from "../store/slices/currentAccounts/currentAccountsApi";
import { useGetSafesQuery } from "../store/slices/safe/safeApiSlice";
import { useGetBanksQuery } from "../store/slices/bank/bankApiSlice";
import { useToast } from "../common/ToastProvider";
import { useModal } from "../common/ModalProvider";
import { VoucherEntity } from "../../types";
import { showApiErrorToast } from "../../utils/errorToast";
import { useAuth } from "./Auth";

export const useReceiptVouchers = () => {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [voucherData, setVoucherData] = useState({
    number: "",
    date: new Date().toISOString().substring(0, 10),
    entity: { type: "customer", id: null, name: "" } as VoucherEntity,
    amount: "" as any,
    paymentMethod: "safe" as "safe" | "bank",
    safeOrBankId: null as string | null,
    description: "",
  });

  const { showToast } = useToast();
  const { showModal } = useModal();
  const { User } = useAuth();

  // Fetch receipt vouchers
  const {
    data: vouchers = [],
    isLoading: isLoadingVouchers,
    error,
    refetch,
  } = useGetReceiptVouchersQuery(searchQuery || undefined);

  // Fetch related data
  const { data: customers = [] } = useGetCustomersQuery();
  const { data: suppliers = [] } = useGetSuppliersQuery();
  const { data: currentAccounts = [] } = useGetCurrentAccountsQuery();
  const { data: safes = [] } = useGetSafesQuery();
  const { data: banks = [] } = useGetBanksQuery();

  // Mutations
  const [createReceiptVoucher, { isLoading: isCreating }] =
    useCreateReceiptVoucherMutation();
  const [updateReceiptVoucher, { isLoading: isUpdating }] =
    useUpdateReceiptVoucherMutation();
  const [deleteReceiptVoucher, { isLoading: isDeleting }] =
    useDeleteReceiptVoucherMutation();

  const isLoading = isLoadingVouchers || isCreating || isUpdating || isDeleting;

  // Helper function to format date to yyyy-MM-dd
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return new Date().toISOString().substring(0, 10);
    // If it's already in yyyy-MM-dd format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    // If it's an ISO string, extract the date part
    return dateString.substring(0, 10);
  };

  // Sync voucher data when currentIndex changes
  useEffect(() => {
    // Wait for vouchers to load before syncing
    if (isLoadingVouchers) return;
    
    if (currentIndex >= 0 && vouchers.length > 0 && vouchers[currentIndex]) {
      const v = vouchers[currentIndex];
      setVoucherData({
        number: v.code,
        date: formatDateForInput(v.date),
        entity: {
          type: v.entityType as any,
          id:
            v.customerId ||
            v.supplierId ||
            v.currentAccountId ||
            v.receivableAccountId ||
            v.payableAccountId ||
            null,
          name: v.entityName,
        },
        amount: v.amount === 0 || v.amount === null ? ("" as any) : v.amount,
        paymentMethod: v.paymentMethod as "safe" | "bank",
        safeOrBankId:
          v.paymentMethod === "safe" ? v.safeId || null : v.bankId || null,
        description: v.description || "",
      });
      setIsReadOnly(true);
    } else if (currentIndex === -1) {
      // Ensure new mode is editable
      setIsReadOnly(false);
    }
  }, [currentIndex, vouchers, isLoadingVouchers]);

  const handleNew = useCallback(() => {
    setCurrentIndex(-1);
    setVoucherData({
      number: "",
      date: new Date().toISOString().substring(0, 10),
      entity: { type: "customer", id: null, name: "" },
      amount: "" as any,
      paymentMethod: "safe",
      safeOrBankId: safes.length > 0 ? safes[0].id : null,
      description: "",
    });
    setIsReadOnly(false);
  }, [safes]);

  const handleSave = useCallback(async () => {
    // Normalize amount to number before validation
    const amountValue =
      typeof voucherData.amount === "string"
        ? parseFloat(voucherData.amount) || 0
        : voucherData.amount || 0;

    if (!voucherData.entity.name || amountValue <= 0) {
      showToast("الرجاء تعبئة جميع الحقول المطلوبة.", 'error');
      return null;
    }

    // Build entity foreign key based on entity type
    const entityFields: Partial<CreateReceiptVoucherRequest> = {};
    if (voucherData.entity.type === "customer") {
      const entityId = voucherData.entity.id ? String(voucherData.entity.id) : undefined;
      entityFields.customerId = entityId;
    } else if (voucherData.entity.type === "supplier") {
      const entityId = voucherData.entity.id ? String(voucherData.entity.id) : undefined;
      entityFields.supplierId = entityId;
    } else if (voucherData.entity.type === "current_account") {
      const entityId = voucherData.entity.id ? String(voucherData.entity.id) : undefined;
      entityFields.currentAccountId = entityId;
    } else if (voucherData.entity.type === "receivable_account") {
      const entityId = voucherData.entity.id ? String(voucherData.entity.id) : undefined;
      entityFields.receivableAccountId = entityId;
    } else if (voucherData.entity.type === "payable_account") {
      const entityId = voucherData.entity.id ? String(voucherData.entity.id) : undefined;
      entityFields.payableAccountId = entityId;
    }

    // Build payment target foreign key based on payment method
    const paymentFields: Partial<CreateReceiptVoucherRequest> = {};
    if (voucherData.paymentMethod === "safe" && voucherData.safeOrBankId) {
      paymentFields.safeId = voucherData.safeOrBankId;
      paymentFields.bankId = undefined;
    } else if (
      voucherData.paymentMethod === "bank" &&
      voucherData.safeOrBankId
    ) {
      paymentFields.bankId = voucherData.safeOrBankId;
      paymentFields.safeId = undefined;
    }

    // Get branchId from User
    const branchId = User?.branchId || 
      (typeof User?.branch === 'string' ? User.branch : (User?.branch as any)?.id);

    const payload: CreateReceiptVoucherRequest = {
      date: voucherData.date,
      entityType: voucherData.entity.type,
      amount: amountValue,
      description: voucherData.description || undefined,
      paymentMethod: voucherData.paymentMethod,
      ...paymentFields,
      ...entityFields,
      ...(branchId ? { branchId } : {}),
    };

    try {
      if (currentIndex >= 0 && vouchers[currentIndex]) {
        const updated = await updateReceiptVoucher({
          id: vouchers[currentIndex].id,
          data: payload,
        }).unwrap();
        showToast("تم تعديل السند بنجاح!");
        setIsReadOnly(true);
        // Keep current data for preview
        return updated;
      } else {
        const saved = await createReceiptVoucher(payload).unwrap();
        showToast("تم حفظ السند بنجاح!");
        setIsReadOnly(true);
        // Return saved voucher directly for preview
        return saved;
      }
    } catch (error) {
      showApiErrorToast(error as any);
      console.error("Error saving receipt voucher:", error);
      return null;
    }
  }, [
    voucherData,
    currentIndex,
    vouchers,
    createReceiptVoucher,
    updateReceiptVoucher,
    showToast,
    User,
  ]);

  const handleEdit = useCallback(() => {
    if (currentIndex < 0) return;
    showModal({
      title: "تأكيد التعديل",
      message: "هل أنت متأكد من رغبتك في تعديل بيانات هذا السند؟",
      onConfirm: () => setIsReadOnly(false),
      type: "edit",
    });
  }, [currentIndex, showModal]);

  const handleDelete = useCallback(() => {
    if (currentIndex < 0) return;
    showModal({
      title: "تأكيد الحذف",
      message: "هل أنت متأكد من حذف هذا السند؟",
      onConfirm: async () => {
        try {
          await deleteReceiptVoucher(vouchers[currentIndex].id).unwrap();
          showToast("تم الحذف بنجاح.");
          if (vouchers.length <= 1) handleNew();
          else setCurrentIndex((prev) => Math.max(0, prev - 1));
        } catch (error) {
          showApiErrorToast(error as any);
          console.error("Error deleting receipt voucher:", error);
        }
      },
      type: "delete",
    });
  }, [
    currentIndex,
    vouchers,
    deleteReceiptVoucher,
    showToast,
    handleNew,
    showModal,
  ]);

  const navigate = useCallback(
    (index: number) => {
      if (vouchers.length > 0) {
        setCurrentIndex(Math.max(0, Math.min(vouchers.length - 1, index)));
      }
    },
    [vouchers.length],
  );

  return {
    vouchers,
    customers,
    suppliers,
    currentAccounts,
    safes,
    banks,
    isLoading,
    error,
    currentIndex,
    voucherData,
    setVoucherData,
    isReadOnly,
    setIsReadOnly,
    handleNew,
    handleSave,
    handleEdit,
    handleDelete,
    navigate,
    setCurrentIndex,
    refetch,
  };
};
