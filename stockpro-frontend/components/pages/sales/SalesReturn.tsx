import React, { useState, useEffect, useRef, useMemo } from "react";
import DataTableModal from "../../common/DataTableModal";
import DocumentHeader from "../../common/DocumentHeader";
import PermissionWrapper from "../../common/PermissionWrapper";
import {
  PdfIcon,
  ListIcon,
  PrintIcon,
  SearchIcon,
  TrashIcon,
} from "../../icons";
import { tafqeet } from "../../../utils/tafqeet";
import type {
  CompanyInfo,
  InvoiceItem,
  Customer,
  User,
  Safe,
  Bank,
} from "../../../types";
import SalesReturnPrintPreview from "./SalesReturnPrintPreview";
import { useModal } from "../../common/ModalProvider";
import { useToast } from "../../common/ToastProvider";
import { showApiErrorToast } from "../../../utils/errorToast";
import { formatMoney } from "../../../utils/formatting";
import {
  useGetSalesReturnsQuery,
  useCreateSalesReturnMutation,
  useUpdateSalesReturnMutation,
  useDeleteSalesReturnMutation,
} from "../../store/slices/salesReturn/salesReturnApiSlice";
import { useGetCustomersQuery } from "../../store/slices/customer/customerApiSlice";
import { useGetItemsQuery } from "../../store/slices/items/itemsApi";
import { useGetStoresQuery } from "../../store/slices/store/storeApi";
import { useGetBanksQuery } from "../../store/slices/bank/bankApiSlice";
import { useGetSafesQuery } from "../../store/slices/safe/safeApiSlice";
import { useGetCompanyQuery } from "../../store/slices/companyApiSlice";
import { useGetSalesInvoicesQuery } from "../../store/slices/salesInvoice/salesInvoiceApiSlice";
import { guardPrint } from "../../utils/printGuard";
import {
  Actions,
  Resources,
  buildPermission,
} from "../../../enums/permissions.enum";
import { useUserPermissions } from "../../hook/usePermissions";

type SelectableItem = {
  id: string;
  name: string;
  unit: string;
  salePrice: number;
  purchasePrice: number;
  stock: number;
  salePriceIncludesTax?: boolean;
};

type ReturnRow = InvoiceItem & {
  salePriceIncludesTax?: boolean;
};

interface SalesReturnProps {
  title: string;
  currentUser: User | null;
  viewingId: string | number | null;
  onClearViewingId: () => void;
}

const SalesReturn: React.FC<SalesReturnProps> = ({
  title,
  currentUser,
  viewingId,
  onClearViewingId,
}) => {
  // Redux hooks
  const { data: allReturns = [], isLoading: returnsLoading } =
    useGetSalesReturnsQuery();
  const { hasPermission } = useUserPermissions();
  
  // Helper function to get user's branch ID
  const getUserBranchId = (user: User | null): string | null => {
    if (!user) return null;
    if (user.branchId) return user.branchId;
    const branch = (user as any)?.branch;
    if (typeof branch === "string") return branch;
    if (branch && typeof branch === "object") return branch.id || null;
    return null;
  };

  const extractBranchName = (value: any): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      return value.name || value.title || "";
    }
    return "";
  };

  const getUserBranchName = (user: User | null): string => {
    if (!user) return "";
    if ((user as any)?.branchName) return (user as any).branchName;
    return extractBranchName((user as any)?.branch);
  };
  
  // Get current user's branch ID
  const userBranchId = getUserBranchId(currentUser);
  const canSearchAllBranches = useMemo(
    () =>
      hasPermission(buildPermission(Resources.SALES_RETURN, Actions.SEARCH)),
    [hasPermission],
  );
  
  // Filter returns: show only current branch if user doesn't have SEARCH permission
  const returns = useMemo(() => {
    return allReturns.filter((returnRecord: any) => {
      // Filter by current branch if user doesn't have SEARCH permission
      const returnBranchId = returnRecord.branch?.id || returnRecord.branchId;
      if (!canSearchAllBranches && userBranchId && returnBranchId !== userBranchId) return false;
      
      return true;
    });
  }, [allReturns, canSearchAllBranches, userBranchId]);
  const [createSalesReturn, { isLoading: isCreating }] =
    useCreateSalesReturnMutation();
  const [updateSalesReturn, { isLoading: isUpdating }] =
    useUpdateSalesReturnMutation();
  const [deleteSalesReturn, { isLoading: isDeleting }] =
    useDeleteSalesReturnMutation();

  const { data: customers = [] } = useGetCustomersQuery();
  const { data: banks = [] } = useGetBanksQuery();
  const { data: safes = [] } = useGetSafesQuery();
  const { data: company } = useGetCompanyQuery();
  const { data: salesInvoices = [] } = useGetSalesInvoicesQuery();
  const { data: stores = [] } = useGetStoresQuery();

  // Filter safes by current user's branch
  const filteredSafes =
    !canSearchAllBranches && userBranchId
      ? safes.filter((safe) => safe.branchId === userBranchId)
      : safes;
  
  // Get store for current user's branch
  const userStore = stores.find((store) => store.branchId === userBranchId);
  
  // Get items with store-specific balances
  const itemsQueryParams =
    !canSearchAllBranches && userStore ? { storeId: userStore.id } : undefined;
  const { data: items = [] } = useGetItemsQuery(itemsQueryParams);

  // Company-level sale price includes tax setting
  const salePriceIncludesTaxSetting = (() => {
    const stored = localStorage.getItem('salePriceIncludesTax');
    return stored ? JSON.parse(stored) : false;
  })();

  // Transform data for component
  const allItems: SelectableItem[] = (items as any[]).map((item) => ({
    id: item.code,
    name: item.name,
    unit: item.unit.name,
    salePrice: item.salePrice,
    purchasePrice: item.purchasePrice,
    stock: item.stock,
    barcode: item.barcode,
    salePriceIncludesTax:
      typeof item.salePriceIncludesTax === "boolean"
        ? item.salePriceIncludesTax
        : salePriceIncludesTaxSetting,
  }));

  const allCustomers: Customer[] = customers.map((customer) => ({
    id: customer.id,
    code: customer.code,
    name: customer.name,
    commercialReg: customer.commercialReg,
    taxNumber: customer.taxNumber,
    nationalAddress: customer.nationalAddress,
    phone: customer.phone,
    openingBalance: customer.openingBalance,
    currentBalance: customer.currentBalance,
  }));

  const companyInfo: CompanyInfo = company || {
    name: "",
    activity: "",
    address: "",
    phone: "",
    taxNumber: "",
    commercialReg: "",
    currency: "SAR",
    logo: null,
    capital: 0,
    vatRate: 15,
    isVatEnabled: true,
  };

  const vatRate = company?.vatRate || 15;
  const isVatEnabled = company?.isVatEnabled || false;
  const createEmptyItem = (): ReturnRow => ({
    id: "",
    name: "",
    unit: "",
    qty: 1,
    price: 0,
    taxAmount: 0,
    total: 0,
    salePriceIncludesTax: salePriceIncludesTaxSetting,
  });

  const [returnItems, setReturnItems] = useState<ReturnRow[]>(
    Array(6).fill(null).map(createEmptyItem),
  );
  const [totals, setTotals] = useState({
    subtotal: 0,
    discount: 0,
    tax: 0,
    net: 0,
  });
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "credit">("cash");
  const [invoiceDetails, setInvoiceDetails] = useState({
    invoiceNumber: "",
    invoiceDate: new Date().toISOString().substring(0, 10),
  });
  const [invoiceNotes, setInvoiceNotes] = useState<string>("");
  const [returnBranchId, setReturnBranchId] = useState<string | null>(null);
  const [safeBranchName, setSafeBranchName] = useState<string>(
    () => getUserBranchName(currentUser),
  );
  const [isReadOnly, setIsReadOnly] = useState(true);
  const [paymentTargetType, setPaymentTargetType] = useState<"safe" | "bank">(
    "safe",
  );
  const [paymentTargetId, setPaymentTargetId] = useState<string | null>(null);
  const { showModal } = useModal();
  const { showToast } = useToast();

  const [customerQuery, setCustomerQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const customerRef = useRef<HTMLDivElement>(null);

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
  const tableInputSizerRef = useRef<HTMLSpanElement | null>(null);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const justSavedRef = useRef(false); // Flag to prevent resetting state after save
  const shouldOpenPreviewRef = useRef(false); // Flag to indicate we want to open preview after data is set
  const [previewData, setPreviewData] = useState<{
    companyInfo: CompanyInfo;
    vatRate: number;
    isVatEnabled: boolean;
    items: ReturnRow[];
    totals: { subtotal: number; discount: number; tax: number; net: number };
    paymentMethod: "cash" | "credit";
    customer: {
      id: string;
      name: string;
      address?: string;
      taxNumber?: string;
      commercialReg?: string;
    } | null;
    details: {
      invoiceNumber: string;
      invoiceDate: string;
      userName: string;
      branchName: string;
      notes?: string;
    };
  } | null>(null);
  const [originalReturnVatEnabled, setOriginalReturnVatEnabled] =
    useState<boolean>(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [invoiceQuery, setInvoiceQuery] = useState("");
  const [isInvoiceDropdownOpen, setIsInvoiceDropdownOpen] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [sourceInvoiceQtyById, setSourceInvoiceQtyById] = useState<Record<string, number>>({});
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const resolvedBranchName = safeBranchName || getUserBranchName(currentUser);

  const effectiveVatEnabled = currentIndex >= 0 ? originalReturnVatEnabled : isVatEnabled;

  const computeLineAmounts = (
    qty: number | string,
    price: number | string,
    includesTax: boolean,
    vatEnabled: boolean,
    vatRatePercent: number,
  ) => {
    const quantity = Number(qty) || 0;
    const unitPrice = Number(price) || 0;
    const baseAmount = quantity * unitPrice;

    if (!vatEnabled || vatRatePercent <= 0) {
      return { total: baseAmount, taxAmount: 0 };
    }

    if (includesTax) {
      // When price includes tax: net = total / (1 + taxRate), tax = total - net
      const net = baseAmount / (1 + vatRatePercent / 100);
      const taxAmount = baseAmount - net;
      return { total: baseAmount, taxAmount };
    }

    // When price excludes tax: tax = base * taxRate, total = base + tax
    const taxAmount = baseAmount * (vatRatePercent / 100);
    const total = baseAmount + taxAmount;
    return { total, taxAmount };
  };

  const assignLineAmounts = (item: ReturnRow) => {
    const includesTax =
      typeof item.salePriceIncludesTax === "boolean"
        ? item.salePriceIncludesTax
        : salePriceIncludesTaxSetting;
    const { total, taxAmount } = computeLineAmounts(
      item.qty,
      item.price,
      includesTax,
      effectiveVatEnabled,
      vatRate,
    );
    return {
      ...item,
      total,
      taxAmount: effectiveVatEnabled ? taxAmount : 0,
    };
  };

  const hasPrintableItems = useMemo(
    () =>
      returnItems.some(
        (item) => item.id && item.name && Number(item.qty) > 0,
      ),
    [returnItems],
  );

  const canPrintExistingReturn = useMemo(
    () => currentIndex >= 0 && isReadOnly,
    [currentIndex, isReadOnly],
  );
  const isExistingReturn = currentIndex >= 0;

  // Show tax column when viewing/editing existing return OR when VAT is enabled for new returns
  const shouldShowTaxColumn = currentIndex >= 0 || isVatEnabled;

  const handleOpenPreview = () => {
    if (!canPrintExistingReturn) {
      showToast("لا يمكن الطباعة إلا بعد تحميل مستند محفوظ.", "error");
      return;
    }

    guardPrint({
      hasData: hasPrintableItems,
      showToast,
      onAllowed: () => setIsPreviewOpen(true),
    });
  };

  const filteredCustomers = customerQuery
    ? allCustomers.filter((c) =>
        c.name.toLowerCase().includes(customerQuery.toLowerCase()),
      )
    : allCustomers;

  const filteredInvoices = invoiceQuery
    ? salesInvoices.filter((inv) =>
        inv.code.toLowerCase().includes(invoiceQuery.toLowerCase()),
      )
    : salesInvoices;

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

  const handleNew = () => {
    setCurrentIndex(-1);
    setReturnItems(Array(6).fill(null).map(createEmptyItem));
    setTotals({ subtotal: 0, discount: 0, tax: 0, net: 0 });
    setPaymentMethod("cash");
    setInvoiceDetails({
      invoiceNumber: "", // Backend will generate this
      invoiceDate: new Date().toISOString().substring(0, 10),
    });
    setSelectedCustomer(null);
    setCustomerQuery("");
    setSelectedInvoiceId(null);
    setInvoiceQuery("");
    setPaymentTargetType("safe");
    // For safes, we don't need paymentTargetId (we send branchId instead)
    setPaymentTargetId(null);
    const defaultBranchId =
      currentUser?.branchId ||
      (typeof currentUser?.branch === "string"
        ? currentUser.branch
        : (currentUser?.branch as any)?.id) ||
      null;
    setReturnBranchId(defaultBranchId);
    setSafeBranchName(getUserBranchName(currentUser));
    setInvoiceNotes("");
    setPreviewData(null); // Clear preview data
    setIsReadOnly(false);
    setOriginalReturnVatEnabled(false);
  };

  useEffect(() => {
    if (viewingId && returns.length > 0) {
      // Use flexible comparison to handle both string and number IDs
      const index = returns.findIndex((ret) => 
        String(ret.id) === String(viewingId) || ret.id === viewingId
      );
      if (index !== -1) {
        setCurrentIndex(index);
      } else {
        showToast(`المرتجع رقم ${viewingId} غير موجود.`, 'error');
      }
      onClearViewingId();
    }
  }, [viewingId, returns, onClearViewingId, showToast]);

  useEffect(() => {
    if (currentIndex >= 0 && returns[currentIndex]) {
      const ret = returns[currentIndex];
      // Convert date to yyyy-MM-dd format for date input
      const formattedDate = ret.date ? new Date(ret.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      setInvoiceDetails({ invoiceNumber: ret.code, invoiceDate: formattedDate });
      setSelectedCustomer(
        ret.customer ? { id: ret.customer.id, name: ret.customer.name } : null,
      );
      setCustomerQuery(ret.customer?.name || "");
      const returnLineItems = ret.items as ReturnRow[];
      const normalizedItems = returnLineItems.map((item) => ({
        ...item,
        salePriceIncludesTax: Boolean((item as any).salePriceIncludesTax),
      }));
      setReturnItems(normalizedItems);
      setTotals({
        subtotal: ret.subtotal,
        discount: ret.discount,
        tax: ret.tax,
        net: ret.net,
      });
      const originalVatEnabled =
        ret.tax > 0 ||
        returnLineItems.some((item) => (item.taxAmount || 0) > 0);
      setOriginalReturnVatEnabled(originalVatEnabled);
      setPaymentMethod(ret.paymentMethod);
      setPaymentTargetType(ret.paymentTargetType || "safe");
      setPaymentTargetId(ret.paymentTargetId || null);
      setReturnBranchId(ret.branch?.id || ret.branchId || null);
      const branchNameFromReturn = extractBranchName(ret.branch) || ret.branchName || "";
      setSafeBranchName(branchNameFromReturn || getUserBranchName(currentUser));
      setInvoiceNotes((ret as any).notes || "");
      setIsReadOnly(true);
      justSavedRef.current = false; // Clear the flag after loading return
    } else if (!justSavedRef.current) {
      // Only call handleNew if we haven't just saved
      handleNew();
    }
  }, [currentIndex, returns]);

  useEffect(() => {
    const sizer = document.createElement("span");
    sizer.style.position = "absolute";
    sizer.style.top = "-9999px";
    sizer.style.left = "-9999px";
    sizer.style.visibility = "hidden";
    sizer.style.whiteSpace = "pre";
    sizer.className = "font-sans text-base";
    document.body.appendChild(sizer);
    tableInputSizerRef.current = sizer;
    return () => {
      if (sizer.parentNode) sizer.parentNode.removeChild(sizer);
    };
  }, []);

  const autosizeInput = (input: HTMLInputElement | null) => {
    if (input && tableInputSizerRef.current) {
      tableInputSizerRef.current.textContent = input.value || input.placeholder;
      const newWidth = tableInputSizerRef.current.offsetWidth + 24;
      input.style.width = `${Math.max(80, newWidth)}px`;
    }
  };

  useEffect(() => {
    if (focusIndex !== null && nameInputRefs.current[focusIndex]) {
      nameInputRefs.current[focusIndex]?.focus();
      setFocusIndex(null); // Reset after focusing
    }
  }, [focusIndex]);

  // Open preview when previewData is set and we have a flag to open it
  useEffect(() => {
    if (shouldOpenPreviewRef.current && previewData && previewData.items.length > 0) {
      setIsPreviewOpen(true);
      shouldOpenPreviewRef.current = false; // Reset flag
    }
  }, [previewData]);

  useEffect(() => {
    if (currentIndex >= 0) return;
    setReturnItems((prev) =>
      prev.map((item) => {
        const recalculated = assignLineAmounts(item);
        const currentTotal = Number(item.total) || 0;
        const currentTax = Number(item.taxAmount) || 0;
        if (
          currentTotal === recalculated.total &&
          currentTax === recalculated.taxAmount
        ) {
          return item;
        }
        return recalculated;
      }),
    );
  }, [currentIndex, effectiveVatEnabled, vatRate, salePriceIncludesTaxSetting]);

  useEffect(() => {
    returnItems.forEach((_, index) => {
      autosizeInput(qtyInputRefs.current[index]);
      autosizeInput(priceInputRefs.current[index]);
    });
  }, [returnItems]);

  useEffect(() => {
    const taxTotal = effectiveVatEnabled
      ? returnItems.reduce(
          (acc, item) => acc + (Number(item.taxAmount) || 0),
          0,
        )
      : 0;
    const subtotal = returnItems.reduce((acc, item) => {
      const lineTotal = Number(item.total) || 0;
      const lineTax = effectiveVatEnabled ? Number(item.taxAmount) || 0 : 0;
      return acc + (lineTotal - lineTax);
    }, 0);
    const discount = totals.discount;
    setTotals((prev) => ({
      ...prev,
      subtotal,
      tax: taxTotal,
      net: subtotal + taxTotal - discount,
    }));
  }, [returnItems, effectiveVatEnabled, totals.discount]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        itemSearchRef.current &&
        !itemSearchRef.current.contains(event.target as Node)
      )
        setActiveItemSearch(null);
      if (
        customerRef.current &&
        !customerRef.current.contains(event.target as Node)
      )
        setIsCustomerDropdownOpen(false);
      if (
        invoiceRef.current &&
        !invoiceRef.current.contains(event.target as Node)
      )
        setIsInvoiceDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeItemSearch) setHighlightedIndex(-1);
  }, [activeItemSearch]);

  // Auto-select first bank when payment target type is "bank"
  useEffect(() => {
    if (paymentTargetType === "bank" && !isReadOnly) {
      // Reset paymentTargetId if it doesn't belong to a bank
      const isValidBank = paymentTargetId && banks.some((bank) => bank.id === paymentTargetId);
      if (!isValidBank && banks.length > 0) {
        setPaymentTargetId(banks[0].id);
      } else if (!isValidBank) {
        setPaymentTargetId(null);
      }
    } else if (paymentTargetType === "safe" && !isReadOnly) {
      // For safes, we don't need paymentTargetId anymore (we send branchId instead)
      setPaymentTargetId(null);
    }
  }, [paymentTargetType, banks, paymentTargetId, isReadOnly]);

  const handleAddItem = () => {
    const newIndex = returnItems.length;
    setReturnItems((prevItems) => [...prevItems, createEmptyItem()]);
    setFocusIndex(newIndex);
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: any,
  ) => {
    const newItems = [...returnItems];
    let item = { ...newItems[index], [field]: value };

    if (field === "name") setActiveItemSearch({ index, query: value });

    // If an invoice is selected, prevent items not in that invoice
    if (field === "id" && selectedInvoiceId) {
      const enteredId = String(value || "").trim();
      if (enteredId && sourceInvoiceQtyById[enteredId] == null) {
        showToast("هذا الصنف غير موجود في الفاتورة المختارة.", 'error');
        // Revert the change
        item = { ...newItems[index] };
      }
    }

    if (field === "qty" || field === "price") {
      let qty = parseFloat(item.qty as any) || 0;
      const price = parseFloat(item.price as any) || 0;
      // Clamp quantity to max allowed from source invoice
      // Check sum of all rows with the same item ID
      if (selectedInvoiceId && item.id) {
        const maxAllowed = sourceInvoiceQtyById[item.id] ?? Number.POSITIVE_INFINITY;
        // Calculate sum of quantities for all other rows with the same item ID
        const sumOfOtherRowsWithSameItem = newItems.reduce((sum, it, idx) => {
          if (idx !== index && it.id === item.id && it.id) {
            return sum + (parseFloat(it.qty as any) || 0);
          }
          return sum;
        }, 0);
        // Calculate remaining allowed quantity
        const remainingAllowed = maxAllowed - sumOfOtherRowsWithSameItem;
        if (qty > remainingAllowed) {
          qty = Math.max(0, remainingAllowed);
          item.qty = qty;
          showToast("لا يمكن إرجاع كمية أكبر من الموجودة في الفاتورة.", 'error');
        }
      }
      item.qty = qty;
      item.price = price;
      item = assignLineAmounts(item);
    }
    newItems[index] = item;
    setReturnItems(newItems);
  };

  const handleSelectItem = (index: number, selectedItem: SelectableItem) => {
    // Block selecting items not in the selected invoice
    if (selectedInvoiceId && sourceInvoiceQtyById[selectedItem.id] == null) {
      showToast("هذا الصنف غير موجود في الفاتورة المختارة.");
      return;
    }
    const newItems = [...returnItems];
    const currentItem = newItems[index];
    let initialQty = currentItem.qty || 1;
    
    // Validate quantity against sum of all rows with same item ID
    if (selectedInvoiceId && selectedItem.id) {
      const maxAllowed = sourceInvoiceQtyById[selectedItem.id] ?? Number.POSITIVE_INFINITY;
      // Calculate sum of quantities for all other rows with the same item ID
      const sumOfOtherRowsWithSameItem = newItems.reduce((sum, it, idx) => {
        if (idx !== index && it.id === selectedItem.id && it.id) {
          return sum + (parseFloat(it.qty as any) || 0);
        }
        return sum;
      }, 0);
      // Calculate remaining allowed quantity
      const remainingAllowed = maxAllowed - sumOfOtherRowsWithSameItem;
      if (initialQty > remainingAllowed) {
        initialQty = Math.max(0, remainingAllowed);
        if (initialQty < (currentItem.qty || 1)) {
          showToast("لا يمكن إرجاع كمية أكبر من الموجودة في الفاتورة.", 'error');
        }
      }
    }
    
    const salePriceIncludesTaxValue =
      typeof selectedItem.salePriceIncludesTax === "boolean"
        ? selectedItem.salePriceIncludesTax
        : salePriceIncludesTaxSetting;
    let item: ReturnRow = {
      ...currentItem,
      id: selectedItem.id,
      name: selectedItem.name,
      unit: selectedItem.unit,
      qty: initialQty,
      price: selectedItem.salePrice,
      salePriceIncludesTax: Boolean(salePriceIncludesTaxValue),
    };
    item = assignLineAmounts(item);
    newItems[index] = item;
    setReturnItems(newItems);
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
    field: "qty" | "price",
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (field === "qty") {
        const priceInput = priceInputRefs.current[index];
        priceInput?.focus();
        // Select text after focus to allow immediate typing
        setTimeout(() => priceInput?.select(), 0);
      } else if (field === "price") {
        if (index === returnItems.length - 1) {
          handleAddItem();
        } else {
          nameInputRefs.current[index + 1]?.focus();
        }
      }
    }
  };

  const handleRemoveItem = (index: number) => {
    const newItems = returnItems.filter((_, i) => i !== index);
    while (newItems.length < 6) {
      newItems.push(createEmptyItem());
    }
    setReturnItems(newItems);
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer({ id: customer.id.toString(), name: customer.name });
    setCustomerQuery(customer.name);
    setIsCustomerDropdownOpen(false);
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
        const qtyInput = qtyInputRefs.current[activeItemSearch.index];
        qtyInput?.focus();
        setTimeout(() => qtyInput?.select(), 0);
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
    const finalItems = returnItems.filter((i) => i.id && i.name && i.qty > 0);

    if (finalItems.length === 0) {
      showToast("الرجاء إضافة صنف واحد على الأقل للمرتجع.", 'error');
      return;
    }
    try {
      // Get branch ID from current user - use it as paymentTargetId when payment target is "safe"
      const userBranchId =
        currentUser?.branchId ||
        (typeof currentUser?.branch === "string"
          ? currentUser.branch
          : (currentUser?.branch as any)?.id);
      const safeBranchId = userBranchId || returnBranchId;

      if (paymentMethod === "cash" && paymentTargetType === "safe" && !safeBranchId) {
        showToast("لا يمكن حفظ مرتجع نقدي بدون تحديد فرع مرتبط بالخزنة.", "error");
        return;
      }
      
      const returnData = {
        customerId: selectedCustomer?.id,
        date: invoiceDetails.invoiceDate,
        items: finalItems.map((item) => ({
          id: item.id,
          name: item.name,
          unit: item.unit,
          qty: item.qty,
          price: item.price,
          taxAmount: item.taxAmount || 0,
          total: item.total || 0,
          salePriceIncludesTax: Boolean(item.salePriceIncludesTax),
        })),
        discount: totals.discount,
        paymentMethod,
        // For credit returns, do NOT send any safe/bank info
        paymentTargetType:
          paymentMethod === "cash" ? paymentTargetType : null,
        // When payment target is "safe", send branch ID as paymentTargetId
        // When payment target is "bank", send bank ID as paymentTargetId
        paymentTargetId:
          paymentMethod === "cash"
            ? (paymentTargetType === "safe"
                ? safeBranchId?.toString() || null
                : paymentTargetId?.toString() || null)
            : null,
        notes: invoiceNotes || "",
      };

      // Prepare customer data for preview
      const fullCustomer = selectedCustomer
        ? (customers as any[]).find((c) => c.id === selectedCustomer.id)
        : null;
      const printCustomer = selectedCustomer
        ? {
            id: selectedCustomer.id,
            name: selectedCustomer.name,
            address: fullCustomer?.nationalAddress || fullCustomer?.address || undefined,
            taxNumber: fullCustomer?.taxNumber || undefined,
            commercialReg: fullCustomer?.commercialReg || undefined,
          }
        : null;

      if (currentIndex >= 0 && returns[currentIndex]) {
        // Update existing return
        await updateSalesReturn({
          id: returns[currentIndex].id,
          data: returnData,
        }).unwrap();
        showToast("تم تحديث المرتجع بنجاح!");
        setIsReadOnly(true);
        
        // Store preview data in state before opening preview
        const previewDataToStore = {
          companyInfo,
          vatRate,
          isVatEnabled: effectiveVatEnabled,
          items: finalItems.map((item) => ({
            ...item,
            salePriceIncludesTax: Boolean(item.salePriceIncludesTax),
          })),
          totals,
          paymentMethod,
          customer: printCustomer,
          details: {
            ...invoiceDetails,
            userName: currentUser?.fullName || "غير محدد",
            branchName:
              typeof currentUser?.branch === "string"
                ? currentUser.branch
                : (currentUser?.branch as any)?.name || "غير محدد",
            notes: invoiceNotes || undefined,
          },
        };
        
        // Set preview data and flag to open preview
        // useEffect will open preview once data is set
        shouldOpenPreviewRef.current = true;
        setPreviewData(previewDataToStore);
      } else {
        // Create new return
        const savedReturn = await createSalesReturn(returnData).unwrap();
        showToast("تم حفظ المرتجع بنجاح!");
        
        // Set flag to prevent useEffect from resetting state
        justSavedRef.current = true;
        
        // Update invoice details with the saved return data (especially return number)
        // Convert date to yyyy-MM-dd format for date input
        const formattedDate = savedReturn.date ? new Date(savedReturn.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        const updatedInvoiceDetails = {
          invoiceNumber: savedReturn.code,
          invoiceDate: formattedDate,
        };
        setInvoiceDetails(updatedInvoiceDetails);
        
        // Store preview data in state before opening preview
        // This ensures the preview has data even if state is reset by useEffect
        const previewDataToStore = {
          companyInfo,
          vatRate,
          isVatEnabled: effectiveVatEnabled,
          items: finalItems.map((item) => ({
            ...item,
            salePriceIncludesTax: Boolean(item.salePriceIncludesTax),
          })),
          totals,
          paymentMethod,
          customer: printCustomer,
          details: {
            ...updatedInvoiceDetails,
            userName: currentUser?.fullName || "غير محدد",
            branchName:
              typeof currentUser?.branch === "string"
                ? currentUser.branch
                : (currentUser?.branch as any)?.name || "غير محدد",
            notes: invoiceNotes || undefined,
          },
        };
        
        setIsReadOnly(true);
        
        // Set preview data and flag to open preview
        // useEffect will open preview once data is set
        shouldOpenPreviewRef.current = true;
        setPreviewData(previewDataToStore);
        
        // Wait for return list to refresh, then find and load the saved return
        // This ensures the return is properly tracked for navigation
        setTimeout(() => {
          const savedIndex = returns.findIndex(
            (ret) => ret.id === savedReturn.id
          );
          if (savedIndex >= 0) {
            setCurrentIndex(savedIndex);
          } else {
            // If return not found, clear flag (preview already open with stored data)
            justSavedRef.current = false;
          }
        }, 300);
      }
    } catch (error) {
      showApiErrorToast(error as any);
    }
  };

  const handleEdit = () => {
    if (currentIndex < 0) return;
    showModal({
      title: "تأكيد التعديل",
      message: "هل أنت متأكد من رغبتك في تعديل بيانات هذا المرتجع؟",
      onConfirm: () => setIsReadOnly(false),
      type: "edit",
    });
  };

  const handleDelete = () => {
    if (currentIndex === -1) {
      showToast("لا يمكن حذف مرتجع جديد لم يتم حفظه.", 'error');
      return;
    }
    showModal({
      title: "تأكيد الحذف",
      message: "هل أنت متأكد من حذف هذا المرتجع؟",
      onConfirm: async () => {
        try {
          await deleteSalesReturn(returns[currentIndex].id).unwrap();
          showToast("تم الحذف بنجاح.");
          if (returns.length <= 1) {
            handleNew();
          } else {
            setCurrentIndex((prev) => Math.max(0, prev - 1));
          }
        } catch (error) {
          showApiErrorToast(error as any);
        }
      },
      type: "delete",
    });
  };

  const navigate = (index: number) => {
    if (returns.length > 0) {
      setCurrentIndex(Math.max(0, Math.min(returns.length - 1, index)));
    }
  };

  const navigateBy = (direction: "first" | "prev" | "next" | "last") => {
    if (!Array.isArray(returns) || returns.length === 0) return;

    let newIndex = currentIndex;
    switch (direction) {
      case "first":
        newIndex = 0;
        break;
      case "last":
        newIndex = returns.length - 1;
        break;
      case "next":
        newIndex = currentIndex === -1 ? 0 : Math.min(returns.length - 1, currentIndex + 1);
        break;
      case "prev":
        newIndex = currentIndex === -1 ? returns.length - 1 : Math.max(0, currentIndex - 1);
        break;
    }
    setCurrentIndex(newIndex);
  };

  const handleSelectReturnFromSearch = (row: { id: string }) => {
    const index = returns.findIndex((ret) => ret.id === row.id);
    if (index > -1) {
      setCurrentIndex(index);
    }
    setIsSearchModalOpen(false);
  };

  const handleSelectInvoice = (invoice: { code: string }) => {
    const inv = salesInvoices.find((s) => s.code === invoice.code);
    if (!inv) return;
    const qtyMap: Record<string, number> = {};
    (inv.items || []).forEach((it) => {
      qtyMap[it.id] = (qtyMap[it.id] || 0) + (it.qty || 0);
    });
    setSourceInvoiceQtyById(qtyMap);
    setSelectedInvoiceId(inv.code);
    setInvoiceQuery(inv.code);
    setInvoiceDetails({ invoiceNumber: inv.code, invoiceDate: (inv.date || "").slice(0, 10) });
    if (inv.customer) {
      setSelectedCustomer({ id: inv.customer.id, name: inv.customer.name });
      setCustomerQuery(inv.customer.name);
    }
    const mappedItems = (inv.items || []).map((it) => {
      const salePriceIncludesTax = Boolean(
        (it as any).salePriceIncludesTax ?? salePriceIncludesTaxSetting,
      );
      const qty = Math.min(it.qty, qtyMap[it.id] ?? it.qty);
      const baseItem: ReturnRow = {
        id: it.id,
        name: it.name,
        unit: it.unit,
        qty,
        price: it.price,
        taxAmount: Number((it as any).taxAmount) || 0,
        total: Number((it as any).total) || qty * it.price,
        salePriceIncludesTax,
      };
      return assignLineAmounts(baseItem);
    });
    setReturnItems(mappedItems);
    setIsInvoiceDropdownOpen(false);
    setIsReadOnly(false);
  };

  const handleSearchInvoice = (invoiceCode: string) => {
    if (!invoiceCode) return;
    const inv = salesInvoices.find((s) => s.code === invoiceCode);
    if (!inv) return;
    handleSelectInvoice({ code: invoiceCode });
  };

  const inputStyle =
    "block w-full bg-brand-blue-bg border-2 border-brand-blue rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue py-3 px-4 disabled:bg-gray-200 disabled:cursor-not-allowed";
  const tableInputStyle =
    "text-center bg-transparent focus:outline-none focus:ring-1 focus:ring-brand-blue rounded p-1 disabled:bg-transparent";

  return (
    <>
      <style>{`
        @media print {
          .no-print-delete-col { display: none !important; }
        }
      `}</style>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="border-2 border-brand-blue rounded-lg mb-4">
          <DocumentHeader companyInfo={companyInfo} />
        </div>

        <div className="border-2 border-brand-blue rounded-lg">
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-4 border-b-2 border-dashed border-gray-300 pb-2 text-brand-dark">
              {title}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="md:col-span-1">
                <div className="relative bg-brand-blue-bg border-2 border-brand-blue rounded-md p-1 flex items-center">
                  <button
                    onClick={() => setPaymentMethod("cash")}
                    className={`w-1/2 py-2 rounded ${paymentMethod === "cash" ? "bg-brand-blue text-white shadow" : "text-gray-600"} transition-all duration-200`}
                    disabled={isReadOnly}
                  >
                    نقداً
                  </button>
                  <button
                    onClick={() => setPaymentMethod("credit")}
                    className={`w-1/2 py-2 rounded ${paymentMethod === "credit" ? "bg-brand-blue text-white shadow" : "text-gray-600"} transition-all duration-200`}
                    disabled={isReadOnly}
                  >
                    آجل
                  </button>
                </div>
              </div>
              <input
                type="text"
                placeholder="رقم المرتجع"
                className={inputStyle}
                value={invoiceDetails.invoiceNumber}
                onChange={(e) =>
                  setInvoiceDetails({
                    ...invoiceDetails,
                    invoiceNumber: e.target.value,
                  })
                }
                readOnly={true} // Always read-only, backend generates the code
                disabled={true}
              />
              <input
                type="date"
                className={inputStyle}
                value={invoiceDetails.invoiceDate}
                onChange={(e) =>
                  setInvoiceDetails({
                    ...invoiceDetails,
                    invoiceDate: e.target.value,
                  })
                }
                disabled={isReadOnly}
              />
              <div className="relative" ref={customerRef}>
                <input
                  type="text"
                  placeholder="ابحث عن عميل..."
                  className={inputStyle}
                  value={customerQuery}
                  onChange={(e) => {
                    setCustomerQuery(e.target.value);
                    setIsCustomerDropdownOpen(true);
                    setSelectedCustomer(null);
                  }}
                  onFocus={() => setIsCustomerDropdownOpen(true)}
                  disabled={isReadOnly}
                />
                {isCustomerDropdownOpen && !isReadOnly && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className="p-2 cursor-pointer hover:bg-brand-blue-bg"
                      >
                        {customer.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {paymentMethod === "cash" && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">
                <div className="relative" ref={invoiceRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    اختر الفاتورة
                  </label>
                  <input
                    type="text"
                    placeholder="ابحث عن فاتورة..."
                    className={inputStyle}
                    value={invoiceQuery}
                    onChange={(e) => {
                      setInvoiceQuery(e.target.value);
                      setIsInvoiceDropdownOpen(true);
                      setSelectedInvoiceId(null);
                    }}
                    onFocus={() => setIsInvoiceDropdownOpen(true)}
                    disabled={isReadOnly}
                  />
                  {isInvoiceDropdownOpen && !isReadOnly && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredInvoices.length > 0 ? (
                        filteredInvoices.map((invoice) => (
                          <div
                            key={invoice.id}
                            onClick={() => handleSelectInvoice(invoice)}
                            className="p-2 cursor-pointer hover:bg-brand-blue-bg"
                          >
                            {invoice.code}
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-gray-500 text-center">
                          لا توجد فواتير
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="md:col-start-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    نوع الدفع
                  </label>
                  <select
                    value={paymentTargetType}
                    onChange={(e) =>
                      setPaymentTargetType(e.target.value as "safe" | "bank")
                    }
                    className={inputStyle}
                    disabled={isReadOnly}
                  >
                    <option value="safe">خزنة</option>
                    <option value="bank">بنك</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {paymentTargetType === "safe"
                      ? "اختر الخزنة"
                      : "اختر البنك"}
                  </label>
                  {paymentTargetType === "safe" ? (
                    <input
                      type="text"
                      value={resolvedBranchName}
                      className={inputStyle}
                      disabled={true}
                      readOnly
                    />
                  ) : (
                    <select
                      value={paymentTargetId || ""}
                      onChange={(e) => setPaymentTargetId(e.target.value || null)}
                      className={inputStyle}
                      disabled={isReadOnly}
                    >
                      <option value="">اختر...</option>
                      {banks.map((target) => (
                        <option key={target.id} value={target.id}>
                          {target.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto my-4 border-2 border-brand-blue rounded-lg">
          <table className="min-w-full border-collapse">
            <thead className="bg-brand-blue text-white">
              <tr>
                <th className="px-2 py-3 w-10 text-center text-sm font-semibold uppercase border border-blue-300">
                  م
                </th>
                <th className="px-2 py-3 w-24 text-right text-sm font-semibold uppercase border border-blue-300">
                  رقم الصنف
                </th>
                <th className="px-2 py-3 w-2/5 text-right text-sm font-semibold uppercase border border-blue-300">
                  الصنف
                </th>
                <th className="px-2 py-3 w-20 text-center text-sm font-semibold uppercase border border-blue-300">
                  الوحدة
                </th>
                <th
                  className="px-2 py-3 text-center text-sm font-semibold uppercase border border-blue-300"
                  style={{ minWidth: "100px" }}
                >
                  الكمية
                </th>
                <th
                  className="px-2 py-3 text-center text-sm font-semibold uppercase border border-blue-300"
                  style={{ minWidth: "100px" }}
                >
                  السعر
                </th>
                {shouldShowTaxColumn && (
                  <th className="px-2 py-3 w-36 text-center text-sm font-semibold uppercase border border-blue-300">
                    الضريبة {effectiveVatEnabled ? `(%${vatRate})` : '(%0)'}
                  </th>
                )}
                <th className="px-2 py-3 w-36 text-center text-sm font-semibold uppercase border border-blue-300">
                  الاجمالي
                </th>
                <th className="px-2 py-3 w-16 text-center border border-blue-300 no-print-delete-col"></th>
              </tr>
            </thead>
            <tbody ref={itemSearchRef} className="divide-y divide-gray-300">
              {returnItems.map((item, index) => (
                <tr
                  key={index}
                  className="hover:bg-brand-blue-bg transition-colors duration-150"
                >
                  <td className="p-2 align-middle text-center border-x border-gray-300">
                    {index + 1}
                  </td>
                  <td className="p-2 align-middle border-x border-gray-300">
                    <input
                      type="text"
                      value={item.id}
                      onChange={(e) =>
                        handleItemChange(index, "id", e.target.value)
                      }
                      className={tableInputStyle + " w-full"}
                      disabled={isReadOnly}
                    />
                  </td>
                  <td className="p-2 align-middle relative border-x border-gray-300">
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
                        className="p-1 text-gray-400 hover:text-brand-blue"
                        disabled={isReadOnly}
                      >
                        <ListIcon className="w-5 h-5" />
                      </button>
                    </div>
                    {activeItemSearch &&
                      activeItemSearch.index === index &&
                      filteredItems.length > 0 &&
                      !isReadOnly && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {filteredItems.map((result, idx) => (
                            <div
                              key={result.id}
                              onClick={() => handleSelectItem(index, result)}
                              className={`p-2 cursor-pointer ${idx === highlightedIndex ? "bg-brand-blue text-white" : "hover:bg-brand-blue-bg"}`}
                              onMouseEnter={() => setHighlightedIndex(idx)}
                            >
                              {result.name} ({result.id})
                            </div>
                          ))}
                        </div>
                      )}
                  </td>
                  <td className="p-2 align-middle border-x border-gray-300">
                    <input
                      type="text"
                      value={item.unit}
                      readOnly
                      className={tableInputStyle + " w-full"}
                      disabled
                    />
                  </td>
                  <td className="p-2 align-middle border-x border-gray-300">
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => {
                        handleItemChange(
                          index,
                          "qty",
                          parseFloat(e.target.value),
                        );
                        autosizeInput(e.target);
                      }}
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(e) => handleTableKeyDown(e, index, "qty")}
                      ref={(el) => {
                        if (el) qtyInputRefs.current[index] = el;
                      }}
                      className={tableInputStyle}
                      disabled={isReadOnly}
                    />
                  </td>
                  <td className="p-2 align-middle border-x border-gray-300">
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => {
                        handleItemChange(
                          index,
                          "price",
                          parseFloat(e.target.value),
                        );
                        autosizeInput(e.target);
                      }}
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(e) => handleTableKeyDown(e, index, "price")}
                      ref={(el) => {
                        if (el) priceInputRefs.current[index] = el;
                      }}
                      className={tableInputStyle}
                      disabled={isReadOnly}
                    />
                  </td>
                  {shouldShowTaxColumn && (
                    <td className="p-2 align-middle text-center border-x border-gray-300">
                      {formatMoney(effectiveVatEnabled ? item.taxAmount : 0)}
                    </td>
                  )}
                  <td className="p-2 align-middle text-center border-x border-gray-300">
                    {formatMoney(item.total)}
                  </td>
                  <td className="p-2 align-middle text-center border-x border-gray-300 no-print-delete-col">
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-500 p-1 rounded-full hover:bg-red-100 hover:text-red-700 disabled:text-gray-400 disabled:hover:bg-transparent"
                      disabled={isReadOnly}
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          onClick={handleAddItem}
          className="mb-4 px-4 py-2 bg-gray-200 text-brand-dark rounded-md hover:bg-gray-300 font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
          disabled={isReadOnly}
        >
          اضافة سطر
        </button>

        <div className="bg-gray-50 -mx-6 -mb-6 mt-4 p-6 rounded-b-lg">
          <div className="flex justify-between items-start">
            <div className="w-1/2 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">
                  ملاحظات المرتجع / معلومات إضافية عن العميل:
                </label>
                <textarea
                  className="w-full p-3 border-2 border-brand-blue rounded-md bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  rows={4}
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  disabled={isReadOnly}
                ></textarea>
              </div>
              <div className="mt-2 pt-4 text-center text-sm text-gray-600 font-semibold border-t-2 border-dashed border-gray-300 mr-4">
                استلمت البضاعة كاملة و بجودة سليمة
              </div>
            </div>
            <div className="w-full md:w-2/5">
              <div className="border-2 border-brand-blue rounded-lg bg-white shadow-inner">
                <div className="flex justify-between p-3">
                  <span className="font-semibold text-gray-600">
                    الاجمالي قبل الضريبة
                  </span>
                  <span className="font-bold text-lg text-brand-dark">
                    {formatMoney(totals.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 border-t-2 border-dashed border-gray-200">
                  <span className="font-semibold text-gray-600">خصم</span>
                  <input
                    type="number"
                    value={totals.discount}
                    onChange={(e) =>
                      setTotals({
                        ...totals,
                        discount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-28 text-left p-1 rounded border-2 border-gray-600 bg-gray-700 text-white focus:ring-brand-blue focus:border-brand-blue font-bold"
                    disabled={isReadOnly}
                  />
                </div>
                {effectiveVatEnabled && (
                  <div className="flex justify-between p-3 border-t-2 border-dashed border-gray-200">
                    <span className="font-semibold text-gray-600">
                      إجمالي الضريبة ({vatRate}%)
                    </span>
                    <span className="font-bold text-lg text-brand-dark">
                      {formatMoney(totals.tax)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xl text-brand-dark bg-brand-blue-bg p-4 border-t-4 border-brand-blue rounded-b-md">
                  <span>الصافي</span>
                  <span>{formatMoney(totals.net)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-300">
            <div className="bg-brand-blue-bg p-3 rounded-md text-center text-brand-dark font-semibold">
              {tafqeet(totals.net, companyInfo.currency)}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t-2 border-gray-200 flex flex-col items-center space-y-4">
            <div className="flex justify-center gap-2 flex-wrap">
              <PermissionWrapper
                requiredPermission={buildPermission(
                  Resources.SALES_RETURN,
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
                  Resources.SALES_RETURN,
                  isExistingReturn ? Actions.UPDATE : Actions.CREATE,
                )}
              >
                <button
                  onClick={handleSave}
                  disabled={isReadOnly}
                  className="px-4 py-2 bg-brand-green text-white rounded-md hover:bg-green-700 font-semibold disabled:bg-gray-400"
                >
                  حفظ
                </button>
              </PermissionWrapper>
              <PermissionWrapper
                requiredPermission={buildPermission(
                  Resources.SALES_RETURN,
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
                  Resources.SALES_RETURN,
                  Actions.DELETE,
                )}
              >
                <button
                  onClick={handleDelete}
                  disabled={currentIndex < 0}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-semibold disabled:bg-gray-400"
                >
                  حذف
                </button>
              </PermissionWrapper>
              <PermissionWrapper
                requiredPermission={buildPermission(
                  Resources.SALES_RETURN,
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
                  Resources.SALES_RETURN,
                  Actions.PRINT,
                )}
              >
                <button
                  onClick={handleOpenPreview}
                  className="px-4 py-2 bg-gray-200 text-brand-dark rounded-md hover:bg-gray-300 font-semibold flex items-center"
                >
                  <PrintIcon className="mr-2 w-5 h-5" /> معاينة وطباعة
                </button>
              </PermissionWrapper>
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => navigateBy("first")}
                disabled={(returns.length === 0) || currentIndex === 0}
                className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                الأول
              </button>
              <button
                onClick={() => navigateBy("prev")}
                disabled={(returns.length === 0) || currentIndex === 0}
                className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                السابق
              </button>
              <div className="px-4 py-2 bg-brand-blue-bg border-2 border-brand-blue rounded-md">
                <span className="font-bold">
                  {currentIndex > -1
                    ? `${currentIndex + 1} / ${returns.length}`
                    : `جديد`}
                </span>
              </div>
              <button
                onClick={() => navigateBy("next")}
                disabled={(returns.length === 0) || currentIndex === returns.length - 1}
                className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                التالي
              </button>
              <button
                onClick={() => navigateBy("last")}
                disabled={(returns.length === 0) || currentIndex === returns.length - 1}
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
          { Header: "سعر البيع", accessor: "salePrice" },
          { Header: "سعر الشراء", accessor: "purchasePrice" },
        ]}
        data={allItems}
        onSelectRow={handleSelectItemFromModal}
      />
      <DataTableModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        title="بحث عن مرتجع مبيعات"
        columns={[
          { Header: "الرقم", accessor: "code" },
          { Header: "التاريخ", accessor: "date" },
          { Header: "العميل", accessor: "customer" },
          { Header: "الصافي", accessor: "total" },
        ]}
        data={returns.map((ret) => ({
          id: ret.id,
          code: ret.code,
          date: ret.date
            ? new Date(ret.date).toISOString().substring(0, 10)
            : "-",
          customer: ret.customer?.name || "-",
          total: formatMoney(ret.net),
        }))}
        onSelectRow={handleSelectReturnFromSearch}
        colorTheme="blue"
      />
      {(() => {
        // Use preview data from state if available, otherwise use current state
        const dataToPreview = previewData || (() => {
          const fullCustomer = selectedCustomer
            ? (customers as any[]).find((c) => c.id === selectedCustomer.id)
            : null;
          const printCustomer = selectedCustomer
            ? {
                id: selectedCustomer.id,
                name: selectedCustomer.name,
                address: fullCustomer?.nationalAddress || fullCustomer?.address || undefined,
                taxNumber: fullCustomer?.taxNumber || undefined,
                commercialReg: fullCustomer?.commercialReg || undefined,
              }
            : null;
          return {
            companyInfo,
            vatRate,
            isVatEnabled: effectiveVatEnabled,
            items: returnItems.filter((i) => i.id && i.name && i.qty > 0),
            totals,
            paymentMethod,
            customer: printCustomer,
            details: {
              ...invoiceDetails,
              userName: currentUser?.fullName || "غير محدد",
              branchName:
                typeof currentUser?.branch === "string"
                  ? currentUser.branch
                  : (currentUser?.branch as any)?.name || "غير محدد",
              notes: invoiceNotes || undefined,
            },
          };
        })();
        
        // Only render preview if we have data
        if (!isPreviewOpen || !dataToPreview || dataToPreview.items.length === 0) {
          return null;
        }
        
        return (
          <SalesReturnPrintPreview
            isOpen={isPreviewOpen}
            onClose={() => {
              setIsPreviewOpen(false);
              setPreviewData(null); // Clear preview data when closing
              shouldOpenPreviewRef.current = false; // Reset flag
              handleNew();
            }}
            isReturn={true}
            invoiceData={dataToPreview}
          />
        );
      })()}
    </>
  );
};

export default SalesReturn;
