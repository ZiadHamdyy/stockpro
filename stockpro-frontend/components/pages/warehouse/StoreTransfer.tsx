import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import DataTableModal from "../../common/DataTableModal";
import { ListIcon, PrintIcon, SearchIcon, TrashIcon } from "../../icons";
import PermissionWrapper from "../../common/PermissionWrapper";
import {
  Resources,
  Actions,
  buildPermission,
} from "../../../enums/permissions.enum";
import type {
  CompanyInfo,
  StoreVoucherItem,
  Store,
  StoreTransferVoucher,
} from "../../../types";
import { useModal } from "../../common/ModalProvider.tsx";
import { useToast } from "../../common/ToastProvider.tsx";
import { guardPrint } from "../../utils/printGuard";
import { showApiErrorToast } from "../../../utils/errorToast";
import { RootState } from "../../store/store";
import { useGetCompanyQuery } from "../../store/slices/companyApiSlice";
import { useGetBranchesQuery } from "../../store/slices/branch/branchApi";
import { useGetStoresQuery, useGetAllStoreItemsQuery } from "../../store/slices/store/storeApi";
import { useGetItemsQuery } from "../../store/slices/items/itemsApi";
import {
  useGetStoreTransferVouchersQuery,
  useCreateStoreTransferVoucherMutation,
  useUpdateStoreTransferVoucherMutation,
  useDeleteStoreTransferVoucherMutation,
  useAcceptStoreTransferVoucherMutation,
  useRejectStoreTransferVoucherMutation,
} from "../../store/slices/storeTransferVoucher/storeTransferVoucherApi";
import { useGetUnreadCountQuery } from "../../store/slices/notification/notificationApi";
import type { User } from "../../store/slices/user/userApi";
import { useLazyGetStoreItemBalanceQuery } from "../../store/slices/store/storeApi";
import { useGetStoreReceiptVouchersQuery } from "../../store/slices/storeReceiptVoucher/storeReceiptVoucherApi";
import { useGetStoreIssueVouchersQuery } from "../../store/slices/storeIssueVoucher/storeIssueVoucherApi";
import { useGetPurchaseInvoicesQuery } from "../../store/slices/purchaseInvoice/purchaseInvoiceApiSlice";
import { useGetPurchaseReturnsQuery } from "../../store/slices/purchaseReturn/purchaseReturnApiSlice";
import { useGetSalesReturnsQuery } from "../../store/slices/salesReturn/salesReturnApiSlice";
import { useGetSalesInvoicesQuery } from "../../store/slices/salesInvoice/salesInvoiceApiSlice";
import ItemContextBar, { SelectableItem as ItemContextBarSelectableItem } from "../../common/ItemContextBar";

type SelectableItem = {
  id: string;
  name: string;
  unit: string;
  stock: number;
  code: string;
  purchasePrice: number;
  salePrice?: number;
};

interface StoreTransferProps {
  title: string;
}

// Helper function to get user's branch ID
const getUserBranchId = (user: User | null): string | null => {
  if (!user) return null;
  if (user.branchId) return user.branchId;
  const branch = (user as any)?.branch;
  if (typeof branch === "string") return branch;
  if (branch && typeof branch === "object") return branch.id || null;
  return null;
};

const DocumentHeader: React.FC<{ companyInfo: CompanyInfo }> = ({
  companyInfo,
}) => (
  <div className="flex justify-between items-start p-4 bg-white">
    <div className="flex items-center gap-4">
      {companyInfo.logo && (
        <img
          src={companyInfo.logo}
          alt="Company Logo"
          className="h-20 w-auto object-contain"
        />
      )}
      <div>
        <h2 className="text-2xl font-bold text-brand-dark">
          {companyInfo.name}
        </h2>
        <p className="text-sm text-gray-600">{companyInfo.address}</p>
        <p className="text-sm text-gray-600">هاتف: {companyInfo.phone}</p>
      </div>
    </div>
    <div className="text-left text-sm">
      <p>
        <span className="font-semibold">الرقم الضريبي:</span>{" "}
        {companyInfo.taxNumber}
      </p>
      <p>
        <span className="font-semibold">السجل التجاري:</span>{" "}
        {companyInfo.commercialReg}
      </p>
    </div>
  </div>
);

const StoreTransfer: React.FC<StoreTransferProps> = ({ title }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Redux API hooks
  const { data: companyInfo } = useGetCompanyQuery();
  const { data: branches = [] } = useGetBranchesQuery();
  const { data: stores = [] } = useGetStoresQuery();
  const { data: vouchers = [], isLoading: isLoadingVouchers, refetch: refetchVouchers } =
    useGetStoreTransferVouchersQuery();
  const [createVoucher, { isLoading: isCreating }] =
    useCreateStoreTransferVoucherMutation();
  const [updateVoucher, { isLoading: isUpdating }] =
    useUpdateStoreTransferVoucherMutation();
  const [deleteVoucher, { isLoading: isDeleting }] =
    useDeleteStoreTransferVoucherMutation();
  const [acceptVoucher, { isLoading: isAccepting }] =
    useAcceptStoreTransferVoucherMutation();
  const [rejectVoucher, { isLoading: isRejecting }] =
    useRejectStoreTransferVoucherMutation();
  const [getStoreItemBalance] = useLazyGetStoreItemBalanceQuery();
  const { data: unreadCount = 0 } = useGetUnreadCountQuery();

  // Get data for ItemContextBar
  const { data: storeItems = [] } = useGetAllStoreItemsQuery();
  const { data: storeReceiptVouchers = [] } = useGetStoreReceiptVouchersQuery();
  const { data: storeIssueVouchers = [] } = useGetStoreIssueVouchersQuery();
  // Reuse vouchers from above instead of fetching again
  const storeTransferVouchers = vouchers;
  const { data: purchaseInvoices = [] } = useGetPurchaseInvoicesQuery();
  const { data: purchaseReturns = [] } = useGetPurchaseReturnsQuery();
  const { data: salesReturns = [] } = useGetSalesReturnsQuery();
  const { data: invoices = [] } = useGetSalesInvoicesQuery();

  // Get current user from auth state
  const currentUser = useSelector((state: RootState) => state.auth.user);

  // Get current user's store
  const userBranchId = getUserBranchId(currentUser);
  const userStore = useMemo(() => 
    stores.find((store) => store.branchId === userBranchId),
    [stores, userBranchId]
  );

  const getEmptyItems = (count: number = 5): StoreVoucherItem[] =>
    Array.from({ length: count }, () => ({
      id: "",
      name: "",
      unit: "",
      qty: 1,
      code: "",
      price: 0,
    }));

  const [items, setItems] = useState<StoreVoucherItem[]>(getEmptyItems());
  const [voucherDetails, setVoucherDetails] = useState({
    id: "",
    date: new Date().toISOString().substring(0, 10),
    fromStore: userStore?.name || "",
    toStore: stores.length > 1 ? stores[1].name : "",
  });
  const isExistingVoucher = Boolean(voucherDetails.id);
  
  // Get store from selected fromStore
  const fromStore = useMemo(() => 
    stores.find(s => s.name === voucherDetails.fromStore),
    [stores, voucherDetails.fromStore]
  );
  
  const { data: itemsData = [] } = useGetItemsQuery(fromStore ? { storeId: fromStore.id } : undefined);

  // Transform items to match the expected format
  const allItems: SelectableItem[] = Array.isArray(itemsData)
    ? itemsData.map((item: any) => ({
        id: item.id,
        name: item.name,
        unit: item.unit?.name || "",
        stock: item.stock || 0,
        code: item.code || "",
        purchasePrice:
          typeof item.lastPurchasePrice === "number"
            ? item.lastPurchasePrice
            : item.purchasePrice || 0,
        salePrice: item.salePrice || 0, // Include salePrice for ItemContextBar
      }))
    : [];
  
  const [isReadOnly, setIsReadOnly] = useState(true);
  const { showModal } = useModal();
  const { showToast } = useToast();

  const [activeItemSearch, setActiveItemSearch] = useState<{
    index: number;
    query: string;
  } | null>(null);
  const itemSearchRef = useRef<HTMLTableSectionElement>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [focusedItemIndex, setFocusedItemIndex] = useState<number | null>(null);

  const nameInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const qtyInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const handleNewRef = useRef<(() => void) | undefined>(undefined);

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);

  const hasPrintableItems = useMemo(
    () => items.some((item) => item.id || item.name),
    [items],
  );

  const canPrintExistingVoucher = useMemo(
    () => currentIndex >= 0 && isReadOnly,
    [currentIndex, isReadOnly],
  );

  const handlePrint = useCallback(() => {
    if (!canPrintExistingVoucher) {
      showToast("لا يمكن الطباعة إلا بعد تحميل مستند محفوظ.", "error");
      return;
    }

    guardPrint({
      hasData: hasPrintableItems,
      showToast,
      onAllowed: () => window.print(),
    });
  }, [canPrintExistingVoucher, hasPrintableItems, showToast]);

  const filteredItems =
    activeItemSearch && typeof activeItemSearch.query === "string"
      ? allItems.filter(
          (item) =>
            (item.name &&
              item.name
                .toLowerCase()
                .includes(activeItemSearch.query.toLowerCase())) ||
            (item.id &&
              typeof item.id === "string" &&
              item.id
                .toLowerCase()
                .includes(activeItemSearch.query.toLowerCase())),
        )
      : [];

  const handleNew = useCallback(() => {
    setCurrentIndex(-1);
    setItems(getEmptyItems());
    setVoucherDetails({
      id: "", // Will be generated by backend
      date: new Date().toISOString().substring(0, 10),
      fromStore: userStore?.name || "",
      toStore: stores.length > 1 ? stores[1].name : "",
    });
    setIsReadOnly(false);
  }, [stores, userStore]);

  // Keep ref updated with latest handleNew
  useEffect(() => {
    handleNewRef.current = handleNew;
  }, [handleNew]);

  // Handle voucherId from URL query params
  useEffect(() => {
    const voucherId = searchParams.get("voucherId");
    if (voucherId && vouchers.length > 0 && !isLoadingVouchers) {
      // Use flexible comparison to handle both string and number IDs
      const index = vouchers.findIndex(
        (v) => 
          String(v.id) === String(voucherId) || 
          v.id === voucherId ||
          String(v.voucherNumber) === String(voucherId) || 
          v.voucherNumber === voucherId
      );
      if (index !== -1 && index !== currentIndex) {
        setCurrentIndex(index);
        // Remove the query param after setting the index
        searchParams.delete("voucherId");
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [vouchers, isLoadingVouchers, searchParams, setSearchParams, currentIndex]);

  useEffect(() => {
    if (currentIndex >= 0 && vouchers[currentIndex]) {
      const v = vouchers[currentIndex];
      setVoucherDetails({
        id: v.voucherNumber || v.id,
        date: v.date
          ? new Date(v.date).toISOString().substring(0, 10)
          : new Date().toISOString().substring(0, 10),
        fromStore: userStore?.name || v.fromStore?.name || "",
        toStore: v.toStore?.name || "",
      });
      // Set read-only based on status - only pending transfers can be edited by sender
      // Receiving store users can accept/reject pending transfers
      const isPending = v.status === 'PENDING';
      const isReceivingStore = userStore && v.toStore?.id === userStore.id;
      setIsReadOnly(!isPending || (isPending && isReceivingStore));
      // Transform API items to component format
      const transformedItems: StoreVoucherItem[] = v.items.map((item: any) => ({
        id: item.itemId || item.id || "",
        name: item.item?.name || "",
        unit: item.item?.unit?.name || "",
        qty: item.quantity || 1,
        code: item.item?.code || "",
        price:
          typeof item.unitPrice === "number"
            ? item.unitPrice
            : typeof item.price === "number"
            ? item.price
            : 0,
      }));
      setItems(transformedItems);
      setIsReadOnly(true);
    } else if (currentIndex === -1 && !isLoadingVouchers) {
      // Only initialize "new" mode when vouchers have loaded
      setItems(getEmptyItems());
      setVoucherDetails({
        id: "", // Will be generated by backend
        date: new Date().toISOString().substring(0, 10),
        fromStore: userStore?.name || "",
        toStore: stores.length > 1 ? stores[1].name : "",
      });
      setIsReadOnly(false);
    }
  }, [currentIndex, vouchers, isLoadingVouchers, stores, userStore]);

  // Always keep fromStore synced with userStore when creating new vouchers
  useEffect(() => {
    if (currentIndex === -1 && userStore && voucherDetails.fromStore !== userStore.name) {
      setVoucherDetails((prev) => ({
        ...prev,
        fromStore: userStore.name,
      }));
    }
  }, [currentIndex, userStore, voucherDetails.fromStore]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        itemSearchRef.current &&
        !itemSearchRef.current.contains(event.target as Node)
      ) {
        setActiveItemSearch(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (focusIndex !== null && nameInputRefs.current[focusIndex]) {
      nameInputRefs.current[focusIndex]?.focus();
      setFocusIndex(null); // Reset after focusing
    }
  }, [focusIndex]);

  useEffect(() => {
    if (activeItemSearch) setHighlightedIndex(-1);
  }, [activeItemSearch]);

  useEffect(() => {
    const handleAfterPrint = () => {
      if (handleNewRef.current) {
        handleNewRef.current();
      }
    };

    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  const handleAddItem = () => {
    const newIndex = items.length;
    setItems((prevItems) => [
      ...prevItems,
      { id: "", name: "", unit: "", qty: 1, code: "", price: 0 },
    ]);
    setFocusIndex(newIndex);
  };

  const handleItemChange = (
    index: number,
    field: keyof StoreVoucherItem,
    value: any,
  ) => {
    const newItems = [...items];
    let item = { ...newItems[index], [field]: value };

    if (field === "name") setActiveItemSearch({ index, query: value });
    if (field === "qty") {
      const parsedQty = parseFloat(value);
      item.qty = !Number.isNaN(parsedQty) && parsedQty >= 0 ? parsedQty : 1;
    }
    if (field === "price") {
      const parsedPrice = parseFloat(value);
      item.price = !Number.isNaN(parsedPrice) && parsedPrice >= 0 ? parsedPrice : 0;
    }

    newItems[index] = item;
    setItems(newItems);
  };

  const handleSelectItem = (index: number, selectedItem: SelectableItem) => {
    const newItems = [...items];
    const currentItem = newItems[index];
    const defaultPrice =
      typeof selectedItem.purchasePrice === "number"
        ? selectedItem.purchasePrice
        : currentItem.price || 0;
    const item = {
      ...currentItem,
      ...selectedItem,
      qty: currentItem.qty || 1,
      code: selectedItem.code || "",
      price: defaultPrice,
    };
    newItems[index] = item;
    setItems(newItems);
    setActiveItemSearch(null);
    setHighlightedIndex(-1);
    setFocusedItemIndex(index);
    setTimeout(() => {
      qtyInputRefs.current[index]?.focus();
      qtyInputRefs.current[index]?.select();
    }, 0);
  };

  const handleTableKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (index === items.length - 1) {
        handleAddItem();
      } else {
        nameInputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSelectItemFromModal = (selectedItem: SelectableItem) => {
    if (editingItemIndex === null) return;
    handleSelectItem(editingItemIndex, selectedItem);
    setIsItemModalOpen(false);
    setEditingItemIndex(null);
  };

  const handleItemSearchKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (!activeItemSearch) return;

    if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex > -1 && filteredItems[highlightedIndex]) {
        handleSelectItem(
          activeItemSearch.index,
          filteredItems[highlightedIndex],
        );
      } else {
        qtyInputRefs.current[activeItemSearch.index]?.focus();
      }
      return;
    }

    if (filteredItems.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % filteredItems.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex(
          (prev) => (prev - 1 + filteredItems.length) % filteredItems.length,
        );
        break;
      case "Escape":
        e.preventDefault();
        setActiveItemSearch(null);
        break;
      default:
        break;
    }
  };

  const handleSave = async () => {
    // Only use filled/valid item rows
    const filledItems = items.filter(i => i.id || i.name);

    if (filledItems.length === 0 || filledItems.some((i) => !i.id || !i.name)) {
      showToast("لا يمكن حفظ سند فارغ أو يحتوي على أسطر غير مكتملة.", 'error');
      return;
    }
    if (voucherDetails.fromStore === voucherDetails.toStore) {
      showToast("لا يمكن التحويل من وإلى نفس المخزن.", 'error');
      return;
    }

    // Find store IDs
    const fromStore = stores.find((s) => s.name === voucherDetails.fromStore);
    const toStore = stores.find((s) => s.name === voucherDetails.toStore);

    if (!fromStore || !toStore) {
      showToast("يرجى اختيار مخزن صحيح.", 'error');
      return;
    }

    // Validate that current user's store is in either fromStore or toStore
    if (!userStore) {
      showToast("لا يمكن إنشاء أو تعديل سند التحويل. يجب أن يكون مخزنك الحالي موجوداً في أحد الحقول (من مخزن أو إلى مخزن).", 'error');
      return;
    }

    const isUserStoreInFromStore = fromStore.id === userStore.id;
    const isUserStoreInToStore = toStore.id === userStore.id;

    if (!isUserStoreInFromStore && !isUserStoreInToStore) {
      showToast("لا يمكن إنشاء أو تعديل سند التحويل. يجب أن يكون مخزنك الحالي موجوداً في أحد الحقول (من مخزن أو إلى مخزن).", 'error');
      return;
    }

    try {
      if (!currentUser?.id) {
        showToast("يرجى تسجيل الدخول أولاً.", 'error');
        return;
      }

      // Transform only filledItems to API format with proper pricing
      const apiItems = filledItems.map((item) => {
        const itemData = allItems.find((i) => i.id === item.id);
        const unitPrice =
          typeof item.price === "number"
            ? item.price
            : itemData?.purchasePrice || 0;
        const quantity = Number(item.qty) || 0;
        const totalPrice = unitPrice * quantity;
        return {
          itemId: item.id,
          quantity: quantity,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
        };
      });

      // Validate stock in fromStore for each item before creating/updating
      for (const item of filledItems) {
        if (!item.id) continue;
        
        try {
          const balanceResult = await getStoreItemBalance({
            storeId: fromStore.id,
            itemId: item.id,
          }).unwrap();
          
          if (!balanceResult.existsInStore) {
            const itemName = allItems.find(i => i.id === item.id)?.name || item.name || 'هذا العنصر';
            showToast(
              `${itemName} غير موجود في المخزن المصدر. لا يمكن تحويل عناصر غير موجودة في المخزن.`,
              'error'
            );
            return;
          }
          
          if (balanceResult.availableQty < (item.qty || 1)) {
            const itemName = allItems.find(i => i.id === item.id)?.name || item.name || 'هذا العنصر';
            showToast(
              `الكمية المتاحة لـ ${itemName} في المخزن المصدر غير كافية. المتاح: ${balanceResult.availableQty}، المطلوب: ${item.qty || 1}`,
              'error'
            );
            return;
          }
        } catch (error: any) {
          console.error('Error checking stock:', error);
          showToast(
            `خطأ في التحقق من المخزون للعنصر. يرجى المحاولة مرة أخرى.`,
            'error'
          );
          return;
        }
      }

      const voucherData = {
        fromStoreId: fromStore.id,
        toStoreId: toStore.id,
        userId: currentUser.id,
        items: apiItems,
      };

      if (
        voucherDetails.id &&
        vouchers.find((v) => v.id === voucherDetails.id || v.voucherNumber === voucherDetails.id)
      ) {
        // Update existing voucher
        const voucherId = vouchers.find((v) => v.id === voucherDetails.id || v.voucherNumber === voucherDetails.id)?.id || voucherDetails.id;
        const updatedVoucher = await updateVoucher({
          id: voucherId,
          data: voucherData,
        }).unwrap().catch((error: any) => {
          showApiErrorToast(error);
          throw error;
        });
        
        // Refetch vouchers to get updated data
        const updatedVouchers = await refetchVouchers();
        if (updatedVouchers.data) {
          const voucherIndex = updatedVouchers.data.findIndex(
            (v) => v.id === updatedVoucher.id || v.voucherNumber === updatedVoucher.voucherNumber
          );
          if (voucherIndex !== -1) {
            setCurrentIndex(voucherIndex);
          }
        }
        
        showToast("تم تحديث السند بنجاح!");
        
        // Wait for state to update, then print
        requestAnimationFrame(() => {
          setTimeout(() => {
            window.print();
          }, 300);
        });
      } else {
        // Create new voucher
        const newVoucher = await createVoucher(voucherData).unwrap().catch((error: any) => {
          showApiErrorToast(error);
          throw error;
        });
        
        // Refetch vouchers to get the new voucher in the list
        const refetchedData = await refetchVouchers();
        
        // Find the newly created voucher in the refetched list
        if (refetchedData.data) {
          const voucherIndex = refetchedData.data.findIndex(
            (v) => v.id === newVoucher.id || v.voucherNumber === newVoucher.voucherNumber
          );
          if (voucherIndex !== -1) {
            // Set the current index to display the saved voucher
            setCurrentIndex(voucherIndex);
          }
        }
        
        showToast("تم حفظ السند بنجاح!");
        
        // Wait for state to update (useEffect will run and populate the form), then print
        // Use requestAnimationFrame to wait for React to render, then additional timeout for data to populate
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTimeout(() => {
              window.print();
            }, 300);
          });
        });
      }
    } catch (error) {
      console.error("Error saving voucher:", error);
      // Error already shown by showApiErrorToast in catch blocks above
    }
  };

  const handleEdit = () => {
    if (currentIndex < 0) return;
    showModal({
      title: "تأكيد التعديل",
      message: "هل أنت متأكد من رغبتك في تعديل بيانات هذا السند؟",
      onConfirm: () => setIsReadOnly(false),
      type: "edit",
    });
  };

  const handleDelete = () => {
    if (currentIndex === -1) return;
    showModal({
      title: "تأكيد الحذف",
      message: "هل أنت متأكد من حذف هذا السند؟",
      onConfirm: async () => {
        try {
          await deleteVoucher(vouchers[currentIndex].id).unwrap();
          showToast("تم الحذف بنجاح.");
          if (vouchers.length <= 1) handleNew();
          else setCurrentIndex((prev) => Math.max(0, prev - 1));
        } catch (error) {
          console.error("Error deleting voucher:", error);
          showApiErrorToast(error);
        }
      },
      type: "delete",
    });
  };

  const handleAccept = async () => {
    if (currentIndex < 0) return;
    const voucher = vouchers[currentIndex];
    if (!voucher || voucher.status !== 'PENDING') {
      showToast("لا يمكن قبول هذا التحويل", 'error');
      return;
    }
    if (!userStore || voucher.toStore?.id !== userStore.id) {
      showToast("يمكنك فقط قبول التحويلات المرسلة إلى مخزنك", 'error');
      return;
    }
    try {
      await acceptVoucher(voucher.id).unwrap();
      showToast("تم قبول التحويل بنجاح!");
      await refetchVouchers();
    } catch (error) {
      console.error("Error accepting transfer:", error);
      showApiErrorToast(error);
    }
  };

  const handleReject = async () => {
    if (currentIndex < 0) return;
    const voucher = vouchers[currentIndex];
    if (!voucher || voucher.status !== 'PENDING') {
      showToast("لا يمكن رفض هذا التحويل", 'error');
      return;
    }
    if (!userStore || voucher.toStore?.id !== userStore.id) {
      showToast("يمكنك فقط رفض التحويلات المرسلة إلى مخزنك", 'error');
      return;
    }
    showModal({
      title: "تأكيد الرفض",
      message: "هل أنت متأكد من رفض هذا التحويل؟",
      onConfirm: async () => {
        try {
          await rejectVoucher(voucher.id).unwrap();
          showToast("تم رفض التحويل بنجاح.");
          await refetchVouchers();
        } catch (error) {
          console.error("Error rejecting transfer:", error);
          showApiErrorToast(error);
        }
      },
      type: "delete",
    });
  };

  const navigate = (index: number) => {
    if (vouchers.length > 0) {
      setCurrentIndex(Math.max(0, Math.min(vouchers.length - 1, index)));
    }
  };

  const navigateBy = (direction: "first" | "prev" | "next" | "last") => {
    if (!Array.isArray(vouchers) || vouchers.length === 0) return;

    let newIndex = currentIndex;
    switch (direction) {
      case "first":
        newIndex = 0;
        break;
      case "last":
        newIndex = vouchers.length - 1;
        break;
      case "next":
        newIndex = currentIndex === -1 ? 0 : Math.min(vouchers.length - 1, currentIndex + 1);
        break;
      case "prev":
        newIndex = currentIndex === -1 ? vouchers.length - 1 : Math.max(0, currentIndex - 1);
        break;
    }
    setCurrentIndex(newIndex);
  };

  const handleSelectVoucherFromSearch = (row: {
    id: string;
    voucherNumber?: string;
  }) => {
    const index = vouchers.findIndex((v) => v.id === row.id);
    if (index > -1) setCurrentIndex(index);
    setIsSearchModalOpen(false);
  };

  const inputStyle =
    "block w-full bg-yellow-100 border-2 border-amber-500 rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 py-3 px-4 disabled:bg-gray-200 disabled:cursor-not-allowed";
  const tableInputStyle =
    "text-center bg-transparent focus:outline-none focus:ring-1 focus:ring-amber-500 rounded p-1 w-full disabled:bg-transparent";
  const formatCurrency = useCallback(
    (value: number) =>
      value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [],
  );
  const grandTotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          (Number(item.qty) || 0) * (Number(item.price) || 0),
        0,
      ),
    [items],
  );

  // Compute focused item data for ItemContextBar
  const focusedItemData = useMemo<ItemContextBarSelectableItem | null>(() => {
    if (focusedItemIndex !== null && items[focusedItemIndex] && items[focusedItemIndex].id) {
      const item = items[focusedItemIndex];
      const itemData = allItems.find((i) => i.id === item.id);
      if (itemData) {
        return {
          id: itemData.code || item.code || itemData.id, // Use code as id for ItemContextBar
          name: itemData.name,
          unit: itemData.unit,
          salePrice: itemData.salePrice || 0,
          purchasePrice: itemData.purchasePrice || 0,
          stock: itemData.stock || 0,
          type: 'STOCKED' as const,
        };
      }
    }
    return null;
  }, [focusedItemIndex, items, allItems]);

  if (!companyInfo || isLoadingVouchers) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-lg">جاري تحميل البيانات...</div>
      </div>
    );
  }

  return (
    <>
      <style>{`@media print { .no-print { display: none !important; } .no-print-select { display: none !important; } .no-print-date { display: none !important; } .no-print-delete-col { display: none !important; } [role="alert"] { display: none !important; } .empty-row { display: none !important; } .print-only-date { display: block !important; } .print-only-fromstore { display: block !important; } .print-only-tostore { display: block !important; } .print-only-status { display: block !important; } .voucher-header-container { padding: 0.25rem !important; margin-bottom: 0.25rem !important; border-width: 1px !important; } .voucher-header-title { margin-bottom: 0.25rem !important; font-size: 1rem !important; padding-bottom: 0.125rem !important; } .voucher-header-grid { grid-template-columns: repeat(4, 1fr) !important; gap: 0.25rem !important; margin-bottom: 0.25rem !important; } .voucher-header-grid input, .voucher-header-grid select { padding: 0.125rem 0.25rem !important; font-size: 0.7rem !important; margin: 0 !important; } .voucher-header-grid input.bg-gray-200, .voucher-header-grid input:disabled, .voucher-header-grid select:disabled { background-color: white !important; color: black !important; opacity: 1 !important; -webkit-text-fill-color: black !important; } .voucher-header-grid select { appearance: none !important; -webkit-appearance: none !important; -moz-appearance: none !important; background: transparent !important; border: none !important; border-bottom: 1px solid transparent !important; background-image: none !important; cursor: default !important; } } @media screen { .print-only-date { display: none !important; } .print-only-fromstore { display: none !important; } .print-only-tostore { display: none !important; } .print-only-status { display: none !important; } }`}</style>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="border-2 border-amber-500 rounded-lg mb-4">
          <DocumentHeader companyInfo={companyInfo} />
        </div>

        <div className="border-2 border-amber-500 rounded-lg mb-4 voucher-header-container">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold border-b-2 border-dashed border-gray-300 pb-2 text-brand-dark voucher-header-title">
                {title}
              </h1>
              {currentIndex >= 0 && vouchers[currentIndex] && (
                <>
                  <div className="flex items-center gap-2 no-print">
                    {vouchers[currentIndex].status === 'PENDING' && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                        قيد الانتظار
                      </span>
                    )}
                    {vouchers[currentIndex].status === 'ACCEPTED' && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                        مقبول
                      </span>
                    )}
                    {vouchers[currentIndex].status === 'REJECTED' && (
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                        مرفوض
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 print-only-status">
                    {vouchers[currentIndex].status === 'PENDING' && (
                      <span className="px-2 py-1 text-yellow-800 text-xs font-semibold border border-yellow-800">
                        قيد الانتظار
                      </span>
                    )}
                    {vouchers[currentIndex].status === 'ACCEPTED' && (
                      <span className="px-2 py-1 text-green-800 text-xs font-semibold border border-green-800">
                        مقبول
                      </span>
                    )}
                    {vouchers[currentIndex].status === 'REJECTED' && (
                      <span className="px-2 py-1 text-red-800 text-xs font-semibold border border-red-800">
                        مرفوض
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 voucher-header-grid">
              <input
                type="text"
                placeholder=""
                className={inputStyle + " bg-gray-200"}
                value={voucherDetails.id}
                readOnly
              />
              {isReadOnly ? (
                <input
                  type="text"
                  className={inputStyle + " bg-gray-200"}
                  value={voucherDetails.date || ""}
                  readOnly
                  disabled
                />
              ) : (
                <>
                  <input
                    type="date"
                    className={inputStyle + " no-print-date"}
                    value={voucherDetails.date}
                    onChange={(e) =>
                      setVoucherDetails({ ...voucherDetails, date: e.target.value })
                    }
                    disabled={!userStore}
                    title={!userStore ? "يجب أن يكون لديك مخزن مرتبط بحسابك" : ""}
                  />
                  <input
                    type="text"
                    className={inputStyle + " bg-gray-200 print-only-date"}
                    value={voucherDetails.date || ""}
                    readOnly
                    disabled
                  />
                </>
              )}
              <input
                type="text"
                className={inputStyle + " bg-gray-200"}
                value={voucherDetails.fromStore || ""}
                readOnly
                disabled
                title="مخزنك الحالي (غير قابل للتغيير)"
              />
              {isReadOnly ? (
                <input
                  type="text"
                  className={inputStyle + " bg-gray-200"}
                  value={voucherDetails.toStore || ""}
                  readOnly
                  disabled
                />
              ) : (
                <>
                  <select
                    className={inputStyle + " no-print-select"}
                    value={voucherDetails.toStore}
                    onChange={(e) =>
                      setVoucherDetails({
                        ...voucherDetails,
                        toStore: e.target.value,
                      })
                    }
                    disabled={!userStore}
                    title={!userStore ? "يجب أن يكون لديك مخزن مرتبط بحسابك" : ""}
                  >
                    <option value="" disabled>
                      إلى مخزن...
                    </option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className={inputStyle + " bg-gray-200 print-only-tostore"}
                    value={voucherDetails.toStore || ""}
                    readOnly
                    disabled
                  />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto my-4 border-2 border-amber-500 rounded-lg">
          <table className="min-w-full">
            <thead className="bg-amber-500">
              <tr className="divide-x divide-amber-400">
                <th className="px-2 py-3 w-10 text-center text-sm font-semibold text-white uppercase">
                  م
                </th>
                <th className="px-2 py-3 w-32 text-right text-sm font-semibold text-white uppercase">
                  رقم الصنف
                </th>
                <th className="px-2 py-3 w-2/5 text-right text-sm font-semibold text-white uppercase">
                  الصنف
                </th>
                <th className="px-2 py-3 w-32 text-center text-sm font-semibold text-white uppercase">
                  الوحدة
                </th>
                <th className="px-2 py-3 w-32 text-center text-sm font-semibold text-white uppercase">
                  الكمية
                </th>
                <th className="px-2 py-3 w-32 text-center text-sm font-semibold text-white uppercase">
                  السعر
                </th>
                <th className="px-2 py-3 w-32 text-center text-sm font-semibold text-white uppercase">
                  الإجمالي
                </th>
                <th className="px-2 py-3 w-16 text-center no-print-delete-col"></th>
              </tr>
            </thead>
            <tbody ref={itemSearchRef}>
              {items.map((item, index) => {
                const isEmptyRow = !item.id && !item.name;
                const rowTotal =
                  (Number(item.qty) || 0) * (Number(item.price) || 0);
                return (
                <tr
                  key={index}
                  className={`divide-x divide-gray-200 border-b border-gray-200 last:border-b-0 hover:bg-yellow-100 transition-colors duration-150 ${isEmptyRow ? 'empty-row' : ''}`}
                >
                  <td className="p-2 align-middle text-center">{index + 1}</td>
                  <td className="p-2 align-middle">
                    <input
                      type="text"
                      value={item.code || ""}
                      onChange={(e) =>
                        handleItemChange(index, "code", e.target.value)
                      }
                      className={tableInputStyle}
                      disabled={isReadOnly || !userStore}
                      title={!userStore ? "يجب أن يكون لديك مخزن مرتبط بحسابك" : ""}
                    />
                  </td>
                  <td className="p-2 align-middle relative">
                    <div className="flex items-center">
                      <input
                        type="text"
                        placeholder="ابحث عن صنف..."
                        value={item.name}
                        onChange={(e) =>
                          handleItemChange(index, "name", e.target.value)
                        }
                        onFocus={() => {
                          setActiveItemSearch({ index, query: item.name });
                          setFocusedItemIndex(index);
                        }}
                        onKeyDown={handleItemSearchKeyDown}
                        ref={(el) => {
                          if (el) nameInputRefs.current[index] = el;
                        }}
                        className="bg-transparent w-full focus:outline-none p-1"
                        disabled={isReadOnly || !userStore}
                        title={!userStore ? "يجب أن يكون لديك مخزن مرتبط بحسابك" : ""}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItemIndex(index);
                          setIsItemModalOpen(true);
                        }}
                        className="p-1 text-gray-400 hover:text-amber-600"
                        disabled={isReadOnly}
                      >
                        <ListIcon className="no-print w-5 h-5" />
                      </button>
                    </div>
                    {activeItemSearch?.index === index &&
                      filteredItems.length > 0 &&
                      !isReadOnly && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {filteredItems.map((result, idx) => (
                            <div
                              key={result.id}
                              onClick={() => handleSelectItem(index, result)}
                              className={`p-2 cursor-pointer ${idx === highlightedIndex ? "bg-amber-500 text-white" : "hover:bg-yellow-100"}`}
                              onMouseEnter={() => setHighlightedIndex(idx)}
                            >
                              {result.name} ({result.code})
                            </div>
                          ))}
                        </div>
                      )}
                  </td>
                  <td className="p-2 align-middle">
                    <input
                      type="text"
                      value={item.unit}
                      readOnly
                      className={tableInputStyle}
                      disabled
                    />
                  </td>
                  <td className="p-2 align-middle">
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) =>
                        handleItemChange(index, "qty", e.target.value)
                      }
                      onFocus={() => setFocusedItemIndex(index)}
                      onKeyDown={(e) => handleTableKeyDown(e, index)}
                      ref={(el) => {
                        if (el) qtyInputRefs.current[index] = el;
                      }}
                      className={tableInputStyle}
                      disabled={isReadOnly || !userStore}
                      title={!userStore ? "يجب أن يكون لديك مخزن مرتبط بحسابك" : ""}
                    />
                  </td>
                  <td className="p-2 align-middle">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price ?? 0}
                      onChange={(e) =>
                        handleItemChange(index, "price", e.target.value)
                      }
                      className={tableInputStyle}
                      disabled={isReadOnly || !userStore}
                      title={!userStore ? "يجب أن يكون لديك مخزن مرتبط بحسابك" : ""}
                    />
                  </td>
                  <td className="p-2 align-middle text-center font-semibold text-brand-dark">
                    {isEmptyRow ? "" : formatCurrency(rowTotal)}
                  </td>
                  <td className="p-2 align-middle text-center no-print-delete-col">
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-500 p-1 rounded-full hover:bg-red-100 hover:text-red-700 disabled:text-gray-400 disabled:hover:bg-transparent"
                      disabled={isReadOnly || !userStore}
                      title={!userStore ? "يجب أن يكون لديك مخزن مرتبط بحسابك" : ""}
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-yellow-100 border-t border-amber-500 text-brand-dark font-semibold">
                <td colSpan={8} className="px-4 py-3 text-left">
                  إجمالي القيمة: {formatCurrency(grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <PermissionWrapper
          requiredPermission={buildPermission(
            Resources.STORE_TRANSFER,
            Actions.CREATE,
          )}
        >
          <button
            onClick={handleAddItem}
            className="no-print mb-4 px-4 py-2 bg-gray-200 text-brand-dark rounded-md hover:bg-gray-300 font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={isReadOnly || !userStore}
            title={!userStore ? "يجب أن يكون لديك مخزن مرتبط بحسابك" : ""}
          >
            اضافة سطر
          </button>
        </PermissionWrapper>

        <div className="bg-gray-50 -mx-6 -mb-6 mt-4 p-6 rounded-b-lg">
          <div className="flex justify-around items-center mt-8 text-center text-sm font-semibold">
            <div>
              <p>أمين المخزن (المُرسِل)</p>
              <p className="mt-12">..............................</p>
            </div>
            <div>
              <p>أمين المخزن (المُستلِم)</p>
              <p className="mt-12">..............................</p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t-2 border-gray-200 flex flex-col items-center space-y-4 no-print">
            <div className="flex justify-center gap-2 flex-wrap">
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.STORE_TRANSFER,
                Actions.CREATE,
              )}
            >
                <button
                  onClick={handleNew}
                  className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold"
                >
                  جديد
                </button>
              </PermissionWrapper>
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.STORE_TRANSFER,
                isExistingVoucher ? Actions.UPDATE : Actions.CREATE,
              )}
            >
                <button
                  onClick={handleSave}
                  disabled={
                    isReadOnly || items.length === 0 || isCreating || isUpdating || !userStore
                  }
                  className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 font-semibold disabled:bg-gray-400"
                  title={!userStore ? "يجب أن يكون لديك مخزن مرتبط بحسابك" : ""}
                >
                  {isCreating || isUpdating ? "جاري الحفظ..." : "حفظ"}
                </button>
              </PermissionWrapper>
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.STORE_TRANSFER,
                Actions.UPDATE,
              )}
            >
                <button
                  onClick={handleEdit}
                  disabled={currentIndex < 0 || !isReadOnly}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 font-semibold disabled:bg-gray-400"
                >
                  تعديل
                </button>
              </PermissionWrapper>
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.STORE_TRANSFER,
                Actions.DELETE,
              )}
            >
                <button
                  onClick={handleDelete}
                  disabled={currentIndex < 0 || isDeleting}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-semibold disabled:bg-gray-400"
                >
                  {isDeleting ? "جاري الحذف..." : "حذف"}
                </button>
              </PermissionWrapper>
            {currentIndex >= 0 && vouchers[currentIndex] && 
             vouchers[currentIndex].status === 'PENDING' &&
             userStore && 
             vouchers[currentIndex].toStore?.id === userStore.id && (
              <>
                <button
                  onClick={handleAccept}
                  disabled={isAccepting}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 font-semibold disabled:bg-gray-400"
                >
                  {isAccepting ? "جاري القبول..." : "قبول"}
                </button>
                <button
                  onClick={handleReject}
                  disabled={isRejecting}
                  className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 font-semibold disabled:bg-gray-400"
                >
                  {isRejecting ? "جاري الرفض..." : "رفض"}
                </button>
              </>
            )}
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.STORE_TRANSFER,
                Actions.SEARCH,
              )}
            >
                <button
                  onClick={() => setIsSearchModalOpen(true)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-semibold"
                >
                  بحث
                </button>
              </PermissionWrapper>
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.STORE_TRANSFER,
                Actions.PRINT,
              )}
            >
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-gray-200 text-brand-dark rounded-md hover:bg-gray-300 font-semibold flex items-center"
                >
                  <PrintIcon className="mr-2 w-5 h-5" /> طباعة
                </button>
              </PermissionWrapper>
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => navigateBy("first")}
                disabled={(Array.isArray(vouchers) ? vouchers.length === 0 : true) || currentIndex === 0}
                className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                الأول
              </button>
              <button
                onClick={() => navigateBy("prev")}
                disabled={(Array.isArray(vouchers) ? vouchers.length === 0 : true) || currentIndex === 0}
                className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                السابق
              </button>
              <div className="px-4 py-2 bg-yellow-100 border-2 border-amber-500 rounded-md">
                <span className="font-bold">
                  {currentIndex > -1
                    ? `${currentIndex + 1} / ${vouchers.length}`
                    : `جديد`}
                </span>
              </div>
              <button
                onClick={() => navigateBy("next")}
                disabled={(Array.isArray(vouchers) ? vouchers.length === 0 : true) || currentIndex === vouchers.length - 1}
                className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                التالي
              </button>
              <button
                onClick={() => navigateBy("last")}
                disabled={(Array.isArray(vouchers) ? vouchers.length === 0 : true) || currentIndex === vouchers.length - 1}
                className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                الأخير
              </button>
            </div>
          </div>
        </div>
      </div>
      <DataTableModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title="قائمة الأصناف"
        columns={[
          { Header: "الكود", accessor: "code" },
          { Header: "الاسم", accessor: "name" },
          { Header: "الرصيد", accessor: "stock" },
          { Header: "الوحدة", accessor: "unit" },
        ]}
        data={allItems}
        onSelectRow={handleSelectItemFromModal}
      />
      <DataTableModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        title="بحث عن سند تحويل"
        columns={[
          { Header: "الرقم", accessor: "voucherNumber" },
          { Header: "التاريخ", accessor: "date" },
          { Header: "من مخزن", accessor: "fromStore" },
          { Header: "إلى مخزن", accessor: "toStore" },
        ]}
        data={vouchers.map((v) => ({
          ...v,
          fromStore: v.fromStore?.name || "-",
          toStore: v.toStore?.name || "-",
          date: v.date
            ? new Date(v.date).toISOString().substring(0, 10)
            : "-",
        }))}
        onSelectRow={handleSelectVoucherFromSearch}
        colorTheme="amber"
      />
      {focusedItemData && (
        <div className="no-print">
          <ItemContextBar
            item={focusedItemData}
            stores={stores}
            branches={branches}
            storeReceiptVouchers={storeReceiptVouchers}
            storeIssueVouchers={storeIssueVouchers}
            storeTransferVouchers={storeTransferVouchers}
            purchaseInvoices={purchaseInvoices}
            purchaseReturns={purchaseReturns}
            salesReturns={salesReturns}
            invoices={invoices}
            storeItems={storeItems}
          />
        </div>
      )}
    </>
  );
};

export default StoreTransfer;
