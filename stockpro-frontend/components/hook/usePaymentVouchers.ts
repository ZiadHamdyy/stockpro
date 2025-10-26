import { useState, useCallback, useEffect } from "react";
import {
  useGetPaymentVouchersQuery,
  useCreatePaymentVoucherMutation,
  useUpdatePaymentVoucherMutation,
  useDeletePaymentVoucherMutation,
  type PaymentVoucher,
  type CreatePaymentVoucherRequest,
} from "../store/slices/paymentVoucherApiSlice";
import { useGetCustomersQuery } from "../store/slices/customer/customerApiSlice";
import { useGetSuppliersQuery } from "../store/slices/supplier/supplierApiSlice";
import { useGetCurrentAccountsQuery } from "../store/slices/currentAccounts/currentAccountsApi";
import { useGetExpenseCodesQuery } from "../store/slices/expense/expenseApiSlice";
import { useGetSafesQuery } from "../store/slices/safe/safeApiSlice";
import { useGetBanksQuery } from "../store/slices/bank/bankApiSlice";
import { useToast } from "../common/ToastProvider";
import { useModal } from "../common/ModalProvider";
import { VoucherEntity } from "../../types";

export const usePaymentVouchers = () => {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isReadOnly, setIsReadOnly] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [voucherData, setVoucherData] = useState({
    number: "",
    date: new Date().toISOString().substring(0, 10),
    entity: { type: "supplier", id: null, name: "" } as VoucherEntity,
    amount: 0,
    paymentMethod: "safe" as "safe" | "bank",
    safeOrBankId: null as string | null,
    description: "",
  });

  const { showToast } = useToast();
  const { showModal } = useModal();

  // Fetch payment vouchers
  const {
    data: vouchers = [],
    isLoading: isLoadingVouchers,
    error,
    refetch,
  } = useGetPaymentVouchersQuery(searchQuery || undefined);

  // Fetch related data
  const { data: customers = [] } = useGetCustomersQuery();
  const { data: suppliers = [] } = useGetSuppliersQuery();
  const { data: currentAccounts = [] } = useGetCurrentAccountsQuery();
  const { data: expenseCodes = [] } = useGetExpenseCodesQuery();
  const { data: safes = [] } = useGetSafesQuery();
  const { data: banks = [] } = useGetBanksQuery();

  // Mutations
  const [createPaymentVoucher, { isLoading: isCreating }] =
    useCreatePaymentVoucherMutation();
  const [updatePaymentVoucher, { isLoading: isUpdating }] =
    useUpdatePaymentVoucherMutation();
  const [deletePaymentVoucher, { isLoading: isDeleting }] =
    useDeletePaymentVoucherMutation();

  const isLoading = isLoadingVouchers || isCreating || isUpdating || isDeleting;

  // Sync voucher data when currentIndex changes
  useEffect(() => {
    if (currentIndex >= 0 && vouchers[currentIndex]) {
      const v = vouchers[currentIndex];
      setVoucherData({
        number: v.code,
        date: v.date,
        entity: {
          type: v.entityType as any,
          id:
            v.customerId ||
            v.supplierId ||
            v.currentAccountId ||
            v.expenseCodeId ||
            null,
          name: v.entityName,
        },
        amount: v.amount,
        paymentMethod: v.paymentMethod as "safe" | "bank",
        safeOrBankId:
          v.paymentMethod === "safe" ? v.safeId || null : v.bankId || null,
        description: v.description || "",
      });
      setIsReadOnly(true);
    }
  }, [currentIndex, vouchers]);

  const handleNew = useCallback(() => {
    setCurrentIndex(-1);
    setVoucherData({
      number: "",
      date: new Date().toISOString().substring(0, 10),
      entity: { type: "supplier", id: null, name: "" },
      amount: 0,
      paymentMethod: "safe",
      safeOrBankId: safes.length > 0 ? safes[0].id : null,
      description: "",
    });
    setIsReadOnly(false);
  }, [safes]);

  const handleSave = useCallback(async () => {
    if (!voucherData.entity.name || voucherData.amount <= 0) {
      showToast("الرجاء تعبئة جميع الحقول المطلوبة.");
      return;
    }

    const entityId = voucherData.entity.id
      ? String(voucherData.entity.id)
      : undefined;

    // Build entity foreign key based on entity type
    const entityFields: Partial<CreatePaymentVoucherRequest> = {};
    if (voucherData.entity.type === "customer") {
      entityFields.customerId = entityId;
    } else if (voucherData.entity.type === "supplier") {
      entityFields.supplierId = entityId;
    } else if (voucherData.entity.type === "current_account") {
      entityFields.currentAccountId = entityId;
    } else if (voucherData.entity.type === "expense") {
      entityFields.expenseCodeId = entityId;
    }

    // Build payment target foreign key based on payment method
    const paymentFields: Partial<CreatePaymentVoucherRequest> = {};
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

    const payload: CreatePaymentVoucherRequest = {
      date: voucherData.date,
      entityType: voucherData.entity.type,
      amount: voucherData.amount,
      description: voucherData.description || undefined,
      paymentMethod: voucherData.paymentMethod,
      ...paymentFields,
      ...entityFields,
    };

    try {
      if (currentIndex >= 0 && vouchers[currentIndex]) {
        await updatePaymentVoucher({
          id: vouchers[currentIndex].id,
          data: payload,
        }).unwrap();
        showToast("تم تعديل السند بنجاح!");
      } else {
        await createPaymentVoucher(payload).unwrap();
        showToast("تم حفظ السند بنجاح!");
      }
      handleNew();
    } catch (error) {
      showToast("حدث خطأ أثناء حفظ السند");
      console.error("Error saving payment voucher:", error);
    }
  }, [
    voucherData,
    currentIndex,
    vouchers,
    createPaymentVoucher,
    updatePaymentVoucher,
    showToast,
    handleNew,
  ]);

  const handleEdit = useCallback(() => {
    if (currentIndex < 0) return;
    showModal({
      title: "تأكيد التعديل",
      message: "هل أنت متأكد من رغبتك في تعديل بيانات هذا السند؟",
      onConfirm: () => setIsReadOnly(false),
      type: "edit",
      showPassword: true,
    });
  }, [currentIndex, showModal]);

  const handleDelete = useCallback(() => {
    if (currentIndex < 0) return;
    showModal({
      title: "تأكيد الحذف",
      message: "هل أنت متأكد من حذف هذا السند؟",
      onConfirm: async () => {
        try {
          await deletePaymentVoucher(vouchers[currentIndex].id).unwrap();
          showToast("تم الحذف بنجاح.");
          if (vouchers.length <= 1) handleNew();
          else setCurrentIndex((prev) => Math.max(0, prev - 1));
        } catch (error) {
          showToast("حدث خطأ أثناء حذف السند");
          console.error("Error deleting payment voucher:", error);
        }
      },
      type: "delete",
      showPassword: true,
    });
  }, [
    currentIndex,
    vouchers,
    deletePaymentVoucher,
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
    expenseCodes,
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
