import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import DataTableModal from "../../common/DataTableModal";
import { ListIcon, PrintIcon, SearchIcon, TrashIcon, BarcodeIcon } from "../../icons";
import PermissionWrapper from "../../common/PermissionWrapper";
import {
  Resources,
  Actions,
  buildPermission,
} from "../../../enums/permissions.enum";
import type {
  CompanyInfo,
  StoreVoucherItem,
  Branch,
  StoreIssueVoucher as StoreIssueVoucherType,
} from "../../../types";
import type { User } from "../../store/slices/user/userApi";
import { useModal } from "../../common/ModalProvider.tsx";
import { useToast } from "../../common/ToastProvider.tsx";
import BarcodeScannerModal from "../../common/BarcodeScannerModal";
import { guardPrint } from "../../utils/printGuard";
import { showApiErrorToast } from "../../../utils/errorToast";
import { RootState } from "../../store/store";
import { useGetCompanyQuery } from "../../store/slices/companyApiSlice";
import { useGetBranchesQuery } from "../../store/slices/branch/branchApi";
import { useGetStoresQuery } from "../../store/slices/store/storeApi";
import { useGetItemsQuery } from "../../store/slices/items/itemsApi";
import {
  useGetStoreIssueVouchersQuery,
  useCreateStoreIssueVoucherMutation,
  useUpdateStoreIssueVoucherMutation,
  useDeleteStoreIssueVoucherMutation,
} from "../../store/slices/storeIssueVoucher/storeIssueVoucherApi";
import { useUserPermissions } from "../../hook/usePermissions";
import { useLazyGetStoreItemBalanceQuery } from "../../store/slices/store/storeApi";

type SelectableItem = {
  id: string;
  name: string;
  unit: string;
  stock: number;
  code: string;
  purchasePrice: number;
  barcode?: string;
};

interface StoreIssueVoucherProps {
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

const StoreIssueVoucher: React.FC<StoreIssueVoucherProps> = ({ title }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Redux API hooks
  const { data: companyInfo } = useGetCompanyQuery();
  const { data: branches = [] } = useGetBranchesQuery();
  const { data: stores = [] } = useGetStoresQuery();
  const { data: allVouchers = [], isLoading: isLoadingVouchers, refetch: refetchVouchers } =
    useGetStoreIssueVouchersQuery();
  const { hasPermission } = useUserPermissions();
  
  // Get current user from auth state
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  // Get current user's branch ID
  const userBranchId = getUserBranchId(currentUser);
  const canSearchAllBranches = useMemo(
    () =>
      hasPermission(
        buildPermission(Resources.STORE_ISSUE_VOUCHER, Actions.SEARCH),
      ),
    [hasPermission],
  );
  
  // Filter vouchers: exclude system-generated ones, and show only current branch + current user
  const vouchers = useMemo(() => {
    return allVouchers.filter((v: any) => {
      // Filter out system-generated vouchers (marked with [نظام] in notes)
      const notes = v.notes || "";
      if (notes.includes("[نظام]")) return false;
      
      // Filter by current branch
      const voucherBranchId = v.store?.branch?.id;
      if (!canSearchAllBranches && userBranchId && voucherBranchId !== userBranchId) return false;
      
      // Filter by current user
      const voucherUserId = v.user?.id || v.userId;
      if (!canSearchAllBranches && currentUser?.id && voucherUserId !== currentUser.id) return false;
      
      return true;
    });
  }, [allVouchers, canSearchAllBranches, userBranchId, currentUser?.id]);
  const [createVoucher, { isLoading: isCreating }] =
    useCreateStoreIssueVoucherMutation();
  const [updateVoucher, { isLoading: isUpdating }] =
    useUpdateStoreIssueVoucherMutation();
  const [deleteVoucher, { isLoading: isDeleting }] =
    useDeleteStoreIssueVoucherMutation();
  const [getStoreItemBalance] = useLazyGetStoreItemBalanceQuery();

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
    branch: "",
    notes: "",
  });
  const isExistingVoucher = Boolean(voucherDetails.id);
  
  // Get store from selected branch
  const selectedBranch = useMemo(() => 
    branches.find(b => b.name === voucherDetails.branch),
    [branches, voucherDetails.branch]
  );
  const userBranch = useMemo(
    () => branches.find((b) => b.id === userBranchId),
    [branches, userBranchId],
  );
  const selectedStore = useMemo(() => 
    stores.find(s => s.branchId === selectedBranch?.id),
    [stores, selectedBranch?.id]
  );
  
  const { data: itemsData = [] } = useGetItemsQuery(selectedStore ? { storeId: selectedStore.id } : undefined);

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
        barcode: item.barcode || undefined,
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

  const nameInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const qtyInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const priceInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const handleNewRef = useRef<(() => void) | undefined>(undefined);

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
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
      branch: userBranch?.name || branches[0]?.name || "",
      notes: "",
    });
    setIsReadOnly(false);
  }, [branches, userBranch?.name]);

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
        branch: v.store?.branch?.name || "",
        notes: v.notes || "",
      });
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
        branch: userBranch?.name || branches[0]?.name || "",
        notes: "",
      });
      setIsReadOnly(false);
    }
  }, [currentIndex, vouchers, isLoadingVouchers, branches, userBranch?.name]);

  // Ensure branch defaults to current user's branch when available for new vouchers
  useEffect(() => {
    if (currentIndex !== -1) return;
    if (!userBranch?.name && !branches[0]?.name) return;

    setVoucherDetails((prev) => {
      if (prev.branch) return prev;
      return {
        ...prev,
        branch: userBranch?.name || branches[0]?.name || "",
      };
    });
  }, [currentIndex, userBranch?.name, branches]);

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
    setTimeout(() => {
      qtyInputRefs.current[index]?.focus();
      qtyInputRefs.current[index]?.select();
    }, 0);
  };

  const handleTableKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
    field?: "code" | "qty" | "price",
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (field === "code") {
        nameInputRefs.current[index]?.focus();
      } else if (field === "qty") {
        priceInputRefs.current[index]?.focus();
      } else if (field === "price") {
        if (index === items.length - 1) {
          handleAddItem();
        } else {
          nameInputRefs.current[index + 1]?.focus();
        }
      } else {
        // Default behavior for backward compatibility
        if (index === items.length - 1) {
          handleAddItem();
        } else {
          nameInputRefs.current[index + 1]?.focus();
        }
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

  const handleScanSuccess = (barcode: string) => {
    const foundItem = allItems.find((item) => item.barcode === barcode);
    if (foundItem) {
      const emptyRowIndex = items.findIndex((i) => !i.id && !i.name);
      const indexToFill = emptyRowIndex !== -1 ? emptyRowIndex : items.length;

      const newItems = [...items];
      if (emptyRowIndex === -1) {
        newItems.push({
          id: "",
          name: "",
          unit: "",
          qty: 1,
          code: "",
          price: 0,
        });
      }

      const defaultPrice =
        typeof foundItem.purchasePrice === "number"
          ? foundItem.purchasePrice
          : 0;
      const item = {
        ...newItems[indexToFill],
        id: foundItem.id,
        name: foundItem.name,
        unit: foundItem.unit,
        qty: 1,
        code: foundItem.code || "",
        price: defaultPrice,
      };
      newItems[indexToFill] = item;
      setItems(newItems);
      showToast(`تم إضافة الصنف: ${foundItem.name}`);
      setTimeout(() => {
        qtyInputRefs.current[indexToFill]?.focus();
        qtyInputRefs.current[indexToFill]?.select();
      }, 0);
    } else {
      showToast("الصنف غير موجود. لم يتم العثور على باركود مطابق.", 'error');
    }
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
        // After selecting item, move to qty field
        setTimeout(() => {
          qtyInputRefs.current[activeItemSearch.index]?.focus();
          qtyInputRefs.current[activeItemSearch.index]?.select();
        }, 0);
      } else if (filteredItems.length === 0) {
        // No search results, move to qty field
        qtyInputRefs.current[activeItemSearch.index]?.focus();
      } else {
        // Has results but nothing highlighted, move to qty field
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
    // Filter out empty rows (both id and name are missing)
    const filledItems = items.filter(i => i.id || i.name);

    if (filledItems.length === 0 || filledItems.some(i => !i.id || !i.name)) {
      showToast("لا يمكن حفظ إذن فارغ أو يحتوي على أسطر غير مكتملة.", 'error');
      return;
    }

    // Find branch and store
    const branch = branches.find((b) => b.name === voucherDetails.branch);
    if (!branch) {
      showToast("يرجى اختيار فرع صحيح.", 'error');
      return;
    }

    // Find store for the selected branch
    const store = stores.find((s) => s.branchId === branch.id);
    if (!store) {
      showToast("لا يوجد مخزن متاح في هذا الفرع.", 'error');
      return;
    }

    try {
      if (!currentUser?.id) {
        showToast("يرجى تسجيل الدخول أولاً.", 'error');
        return;
      }

      // Transform items to API format with proper pricing, use filledItems
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

      // Validate stock for each item before creating/updating
      const storeId = store.id;
      for (const item of filledItems) {
        if (!item.id) continue;
        
        try {
          const balanceResult = await getStoreItemBalance({
            storeId,
            itemId: item.id,
          }).unwrap();
          
          if (!balanceResult.existsInStore) {
            const itemName = allItems.find(i => i.id === item.id)?.name || item.name || 'هذا العنصر';
            showToast(
              `${itemName} غير موجود في المخزن. لا يمكن إصدار عناصر غير موجودة في المخزن.`,
              'error'
            );
            return;
          }
          
          if (balanceResult.availableQty < (item.qty || 1)) {
            const itemName = allItems.find(i => i.id === item.id)?.name || item.name || 'هذا العنصر';
            showToast(
              `الكمية المتاحة لـ ${itemName} غير كافية. المتاح: ${balanceResult.availableQty}، المطلوب: ${item.qty || 1}`,
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
        storeId,
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
        
        showToast("تم تحديث الإذن بنجاح!");
        
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
        
        showToast("تم حفظ الإذن بنجاح!");
        
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
      message: "هل أنت متأكد من رغبتك في تعديل بيانات هذا الإذن؟",
      onConfirm: () => setIsReadOnly(false),
      type: "edit",
    });
  };

  const handleDelete = () => {
    if (currentIndex === -1) return;
    showModal({
      title: "تأكيد الحذف",
      message: "هل أنت متأكد من حذف هذا الإذن؟",
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
    "block w-full bg-brand-green-bg border-2 border-brand-green rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green py-3 px-4 disabled:bg-gray-200 disabled:cursor-not-allowed";
  const tableInputStyle =
    "text-center bg-transparent focus:outline-none focus:ring-1 focus:ring-brand-green rounded p-1 w-full disabled:bg-transparent";
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

  if (!companyInfo || isLoadingVouchers) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-lg">جاري تحميل البيانات...</div>
      </div>
    );
  }

  return (
    <>
      <style>{`@media print { .no-print { display: none !important; } .no-print-select { display: none !important; } .no-print-date { display: none !important; } .no-print-delete-col { display: none !important; } [role="alert"] { display: none !important; } .empty-row { display: none !important; } .print-only-branch { display: block !important; } .print-only-date { display: block !important; } .print-only-user { display: block !important; } .voucher-header-container { padding: 0.25rem !important; margin-bottom: 0.25rem !important; border-width: 1px !important; } .voucher-header-title { margin-bottom: 0.25rem !important; font-size: 1rem !important; padding-bottom: 0.125rem !important; } .voucher-header-grid { grid-template-columns: repeat(4, 1fr) !important; gap: 0.25rem !important; margin-bottom: 0.25rem !important; } .voucher-header-grid input, .voucher-header-grid select { padding: 0.125rem 0.25rem !important; font-size: 0.7rem !important; margin: 0 !important; } .voucher-header-grid input.bg-gray-200, .voucher-header-grid input:disabled { background-color: white !important; color: black !important; opacity: 1 !important; -webkit-text-fill-color: black !important; } .voucher-header-grid select { appearance: none !important; -webkit-appearance: none !important; -moz-appearance: none !important; background: transparent !important; border: none !important; border-bottom: 1px solid transparent !important; background-image: none !important; cursor: default !important; } } @media screen { .print-only-branch { display: none !important; } .print-only-date { display: none !important; } .print-only-user { display: none !important; } }`}</style>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="border-2 border-brand-green rounded-lg mb-4">
          <DocumentHeader companyInfo={companyInfo} />
        </div>

        <div className="border-2 border-brand-green rounded-lg mb-4 voucher-header-container">
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-4 border-b-2 border-dashed border-gray-300 pb-2 text-brand-dark voucher-header-title">
              {title}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 voucher-header-grid">
              <input
                type="text"
                placeholder=""
                className={inputStyle + " bg-gray-200"}
                value={voucherDetails.id || ""}
                readOnly
                disabled
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
                value={voucherDetails.branch || userBranch?.name || ""}
                readOnly
                disabled
              />
              <input
                type="text"
                className={inputStyle + " bg-gray-200 print-only-user"}
                value={
                  currentIndex >= 0 && vouchers[currentIndex]
                    ? vouchers[currentIndex]?.user?.name || currentUser?.name || currentUser?.fullName || ""
                    : currentUser?.name || currentUser?.fullName || ""
                }
                readOnly
                disabled
              />
            </div>
          </div>
        </div>

        {voucherDetails.notes && (
          <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-yellow-800 min-w-fit">ملاحظات:</span>
              <p className="text-yellow-900 flex-1 whitespace-pre-wrap">{voucherDetails.notes}</p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto my-4 border-2 border-brand-green rounded-lg">
          <table className="min-w-full">
            <thead className="bg-brand-green">
              <tr className="divide-x divide-green-400">
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
                  className={`divide-x divide-gray-200 border-b border-gray-200 last:border-b-0 hover:bg-brand-green-bg transition-colors duration-150 ${isEmptyRow ? 'empty-row' : ''}`}
                >
                  <td className="p-2 align-middle text-center">{index + 1}</td>
                  <td className="p-2 align-middle">
                    <input
                      type="text"
                      value={item.code || ""}
                      onChange={(e) =>
                        handleItemChange(index, "code", e.target.value)
                      }
                      onKeyDown={(e) => handleTableKeyDown(e, index, "code")}
                      className={tableInputStyle}
                      disabled={isReadOnly}
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
                        onFocus={() =>
                          setActiveItemSearch({ index, query: item.name })
                        }
                        onKeyDown={handleItemSearchKeyDown}
                        ref={(el) => {
                          if (el) nameInputRefs.current[index] = el;
                        }}
                        className="bg-transparent w-full focus:outline-none p-1"
                        disabled={isReadOnly}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItemIndex(index);
                          setIsItemModalOpen(true);
                        }}
                        className="p-1 text-gray-400 hover:text-brand-green"
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
                              className={`p-2 cursor-pointer ${idx === highlightedIndex ? "bg-brand-green text-white" : "hover:bg-brand-green-bg"}`}
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
                      onKeyDown={(e) => handleTableKeyDown(e, index, "qty")}
                      ref={(el) => {
                        if (el) qtyInputRefs.current[index] = el;
                      }}
                      className={tableInputStyle}
                      disabled={isReadOnly}
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
                      onKeyDown={(e) => handleTableKeyDown(e, index, "price")}
                      ref={(el) => {
                        if (el) priceInputRefs.current[index] = el;
                      }}
                      className={tableInputStyle}
                      disabled={isReadOnly}
                    />
                  </td>
                  <td className="p-2 align-middle text-center font-semibold text-brand-dark">
                    {isEmptyRow ? "" : formatCurrency(rowTotal)}
                  </td>
                  <td className="p-2 align-middle text-center no-print-delete-col">
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-500 p-1 rounded-full hover:bg-red-100 hover:text-red-700 disabled:text-gray-400 disabled:hover:bg-transparent"
                      disabled={isReadOnly}
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-brand-green-bg border-t border-brand-green text-brand-dark font-semibold">
                <td colSpan={8} className="px-4 py-3 text-left">
                  إجمالي القيمة: {formatCurrency(grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="no-print mb-4 flex gap-2">
          <PermissionWrapper
            requiredPermission={buildPermission(
              Resources.STORE_ISSUE_VOUCHER,
              Actions.CREATE,
            )}
          >
            <button
              onClick={handleAddItem}
              className="px-4 py-2 bg-gray-200 text-brand-dark rounded-md hover:bg-gray-300 font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
              disabled={isReadOnly}
            >
              اضافة سطر
            </button>
          </PermissionWrapper>
          <PermissionWrapper
            requiredPermission={buildPermission(
              Resources.STORE_ISSUE_VOUCHER,
              Actions.CREATE,
            )}
          >
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={isReadOnly}
            >
              <BarcodeIcon className="w-5 h-5" />
              <span>مسح باركود</span>
            </button>
          </PermissionWrapper>
        </div>

        <div className="bg-gray-50 -mx-6 -mb-6 mt-4 p-6 rounded-b-lg">
          <div className="flex justify-around items-center mt-8 text-center text-sm font-semibold">
            <div>
              <p>أمين المخزن</p>
              <p className="mt-12">..............................</p>
            </div>
            <div>
              <p>المستلم</p>
              <p className="mt-12">..............................</p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t-2 border-gray-200 flex flex-col items-center space-y-4 no-print">
            <div className="flex justify-center gap-2 flex-wrap">
              <PermissionWrapper
                requiredPermission={buildPermission(
                  Resources.STORE_ISSUE_VOUCHER,
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
                  Resources.STORE_ISSUE_VOUCHER,
                  isExistingVoucher ? Actions.UPDATE : Actions.CREATE,
                )}
              >
                <button
                  onClick={handleSave}
                  disabled={
                    isReadOnly || items.length === 0 || isCreating || isUpdating
                  }
                  className="px-4 py-2 bg-brand-green text-white rounded-md hover:bg-green-700 font-semibold disabled:bg-gray-400"
                >
                  {isCreating || isUpdating ? "جاري الحفظ..." : "حفظ"}
                </button>
              </PermissionWrapper>
              <PermissionWrapper
                requiredPermission={buildPermission(
                  Resources.STORE_ISSUE_VOUCHER,
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
                  Resources.STORE_ISSUE_VOUCHER,
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
              <PermissionWrapper
                requiredPermission={buildPermission(
                  Resources.STORE_ISSUE_VOUCHER,
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
                  Resources.STORE_ISSUE_VOUCHER,
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
              <div className="px-4 py-2 bg-brand-green-bg border-2 border-brand-green rounded-md">
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
        title="بحث عن إذن صرف"
        columns={[
          { Header: "الرقم", accessor: "voucherNumber" },
          { Header: "التاريخ", accessor: "date" },
          { Header: "الفرع", accessor: "branch" },
        ]}
        data={vouchers.map((v) => ({
          ...v,
          branch: v.store?.branch?.name || "-",
          date: v.date
            ? new Date(v.date).toISOString().substring(0, 10)
            : "-",
        }))}
        onSelectRow={handleSelectVoucherFromSearch}
        colorTheme="green"
      />
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </>
  );
};

export default StoreIssueVoucher;
