import { useState, useCallback, useEffect, useMemo } from "react";
import {
  useGetInternalTransfersQuery,
  useCreateInternalTransferMutation,
  useUpdateInternalTransferMutation,
  useDeleteInternalTransferMutation,
  type InternalTransfer,
  type CreateInternalTransferRequest,
} from "../store/slices/internalTransferApiSlice";
import { useGetSafesQuery } from "../store/slices/safe/safeApiSlice";
import { useGetBanksQuery } from "../store/slices/bank/bankApiSlice";
import { useToast } from "../common/ToastProvider";
import { useModal } from "../common/ModalProvider";
import { useAuth } from "./Auth";

export const useInternalTransfers = () => {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isReadOnly, setIsReadOnly] = useState(false); // Start in create mode by default
  const [searchQuery, setSearchQuery] = useState("");
  const [transferData, setTransferData] = useState({
    number: "",
    date: new Date().toISOString().substring(0, 10),
    fromType: "safe" as "safe" | "bank",
    fromId: null as string | null,
    toType: "bank" as "safe" | "bank",
    toId: null as string | null,
    amount: "" as any,
    description: "",
  });

  const { showToast } = useToast();
  const { showModal } = useModal();
  const { User } = useAuth();
  const branchId =
    User?.branchId ||
    (typeof User?.branch === "string" ? User.branch : (User?.branch as any)?.id);

  // Fetch internal transfers
  const {
    data: vouchers = [],
    isLoading: isLoadingVouchers,
    error,
    refetch,
  } = useGetInternalTransfersQuery(searchQuery || undefined);

  // Fetch related data
  const { data: safes = [] } = useGetSafesQuery();
  const { data: banks = [] } = useGetBanksQuery();

  const branchSafes = useMemo(() => {
    if (!branchId) return safes;
    return safes.filter((s) => String(s.branchId) === String(branchId));
  }, [branchId, safes]);

  // Mutations
  const [createInternalTransfer, { isLoading: isCreating }] =
    useCreateInternalTransferMutation();
  const [updateInternalTransfer, { isLoading: isUpdating }] =
    useUpdateInternalTransferMutation();
  const [deleteInternalTransfer, { isLoading: isDeleting }] =
    useDeleteInternalTransferMutation();

  const isLoading = isLoadingVouchers || isCreating || isUpdating || isDeleting;

  // Helper function to format date to yyyy-MM-dd
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return new Date().toISOString().substring(0, 10);
    // If it's already in yyyy-MM-dd format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    // If it's an ISO string, extract the date part
    return dateString.substring(0, 10);
  };

  // Sync transfer data when currentIndex changes
  useEffect(() => {
    // Wait for vouchers to load before syncing
    if (isLoadingVouchers) return;
    
    if (currentIndex >= 0 && vouchers.length > 0 && vouchers[currentIndex]) {
      const v = vouchers[currentIndex];
      setTransferData({
        number: v.code,
        date: formatDateForInput(v.date),
        fromType: v.fromType as "safe" | "bank",
        fromId:
          v.fromType === "safe" ? v.fromSafeId || null : v.fromBankId || null,
        toType: v.toType as "safe" | "bank",
        toId: v.toType === "safe" ? v.toSafeId || null : v.toBankId || null,
        amount: v.amount === 0 || v.amount === null ? ("" as any) : v.amount,
        description: v.description || "",
      });
      setIsReadOnly(true); // Switch to edit mode when viewing existing voucher
    } else if (currentIndex === -1 && !isLoadingVouchers) {
      // Only initialize "new" mode when vouchers have loaded
      setTransferData({
        number: "",
        date: new Date().toISOString().substring(0, 10),
        fromType: "safe",
        fromId: null,
        toType: "bank",
        toId: null,
        amount: "",
        description: "",
      });
      setIsReadOnly(false); // Stay in create mode
    }
  }, [currentIndex, vouchers, isLoadingVouchers]);

  const handleNew = useCallback(() => {
    setCurrentIndex(-1);
    setTransferData({
      number: "",
      date: new Date().toISOString().substring(0, 10),
      fromType: "safe",
      fromId: branchSafes.length > 0 ? branchSafes[0].id : null,
      toType: "bank",
      toId: banks.length > 0 ? banks[0].id : null,
      amount: "",
      description: "",
    });
    setIsReadOnly(false);
  }, [branchSafes, banks]);

  useEffect(() => {
    if (transferData.fromType !== "safe") return;
    const defaultSafeId = branchSafes[0]?.id || null;
    const hasCurrentSafe = branchSafes.some(
      (safe) => safe.id === transferData.fromId,
    );

    if (!hasCurrentSafe && transferData.fromId !== defaultSafeId) {
      setTransferData((prev) => ({ ...prev, fromId: defaultSafeId }));
    }
  }, [branchSafes, transferData.fromType, transferData.fromId]);

  useEffect(() => {
    if (transferData.toType !== "safe") return;
    const defaultSafeId = branchSafes[0]?.id || null;
    const hasCurrentSafe = branchSafes.some(
      (safe) => safe.id === transferData.toId,
    );

    if (!hasCurrentSafe && transferData.toId !== defaultSafeId) {
      setTransferData((prev) => ({ ...prev, toId: defaultSafeId }));
    }
  }, [branchSafes, transferData.toType, transferData.toId]);

  const handleSave = useCallback(async () => {
    // Normalize amount to number before validation
    const amountValue =
      typeof transferData.amount === "string"
        ? parseFloat(transferData.amount) || 0
        : transferData.amount || 0;

    if (!transferData.fromId || !transferData.toId) {
      showToast("يرجى اختيار الحساب المصدر والوجهة", "error");
      return null;
    }

    if (
      transferData.fromId === transferData.toId &&
      transferData.fromType === transferData.toType
    ) {
      showToast("لا يمكن التحويل لنفس الحساب", "error");
      return null;
    }

    if (amountValue <= 0) {
      showToast("يرجى إدخال مبلغ صحيح", "error");
      return null;
    }

    // Get branchId from User
    const branchId = User?.branchId || 
      (typeof User?.branch === 'string' ? User.branch : (User?.branch as any)?.id);

    const payload: CreateInternalTransferRequest = {
      date: transferData.date,
      fromType: transferData.fromType,
      fromSafeId: transferData.fromType === "safe" ? transferData.fromId : undefined,
      fromBankId: transferData.fromType === "bank" ? transferData.fromId : undefined,
      toType: transferData.toType,
      toSafeId: transferData.toType === "safe" ? transferData.toId : undefined,
      toBankId: transferData.toType === "bank" ? transferData.toId : undefined,
      amount: amountValue,
      description: transferData.description || undefined,
      ...(branchId ? { branchId } : {}),
    };

    try {
      if (currentIndex >= 0 && vouchers[currentIndex]) {
        const updated = await updateInternalTransfer({
          id: vouchers[currentIndex].id,
          data: payload,
        }).unwrap();
        showToast("تم تعديل السند بنجاح!", "success");
        setIsReadOnly(true);
        return updated;
      } else {
        const saved = await createInternalTransfer(payload).unwrap();
        showToast("تم حفظ السند بنجاح!", "success");
        setIsReadOnly(true);
        return saved;
      }
    } catch (error: any) {
      // Handle insufficient balance error (409 Conflict)
      if (error?.status === 409 || error?.data?.statusCode === 409) {
        showToast("الرصيد غير كافي في الحساب المرسل", "error");
        console.error("Insufficient balance error:", error);
        return null;
      }
      
      // Handle other errors
      showToast("حدث خطأ أثناء حفظ السند", "error");
      console.error("Error saving internal transfer:", error);
      return null;
    }
  }, [
    transferData,
    currentIndex,
    vouchers,
    createInternalTransfer,
    updateInternalTransfer,
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
          await deleteInternalTransfer(vouchers[currentIndex].id).unwrap();
          showToast("تم الحذف بنجاح.", "success");
          if (vouchers.length <= 1) handleNew();
          else setCurrentIndex((prev) => Math.max(0, prev - 1));
        } catch (error) {
          showToast("حدث خطأ أثناء حذف السند", "error");
          console.error("Error deleting internal transfer:", error);
        }
      },
      type: "delete",
    });
  }, [
    currentIndex,
    vouchers,
    deleteInternalTransfer,
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
    safes,
    branchSafes,
    banks,
    isLoading,
    error,
    currentIndex,
    transferData,
    setTransferData,
    isReadOnly,
    setIsReadOnly,
    handleNew,
    handleSave,
    handleEdit,
    handleDelete,
    navigate,
    setCurrentIndex,
    refetch,
    isCreating,
    isUpdating,
    isDeleting,
  };
};

