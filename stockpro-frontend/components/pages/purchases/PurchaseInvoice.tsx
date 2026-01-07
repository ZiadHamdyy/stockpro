import React, { useState, useEffect, useRef, useMemo } from "react";
import DataTableModal from "../../common/DataTableModal";
import DocumentHeader from "../../common/DocumentHeader";
import PermissionWrapper from "../../common/PermissionWrapper";
import {
  BarcodeIcon,
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
  Supplier,
  Invoice,
  User,
  Item,
  Safe,
  Bank,
} from "../../../types";
import PurchaseInvoicePrintPreview from "./PurchaseInvoicePrintPreview";
import { useModal } from "../../common/ModalProvider";
import { useToast } from "../../common/ToastProvider";
import { showApiErrorToast } from "../../../utils/errorToast";
import { formatMoney } from "../../../utils/formatting";
import BarcodeScannerModal from "../../common/BarcodeScannerModal";
import CreditEntityBalanceBar from "../../common/CreditEntityBalanceBar";
import {
  useGetPurchaseInvoicesQuery,
  useCreatePurchaseInvoiceMutation,
  useUpdatePurchaseInvoiceMutation,
  useDeletePurchaseInvoiceMutation,
} from "../../store/slices/purchaseInvoice/purchaseInvoiceApiSlice";
import { useGetSuppliersQuery } from "../../store/slices/supplier/supplierApiSlice";
import { useGetItemsQuery, itemsApiSlice } from "../../store/slices/items/itemsApi";
import { useAppDispatch } from "../../store/hooks";
import { useGetBanksQuery } from "../../store/slices/bank/bankApiSlice";
import { useGetSafesQuery } from "../../store/slices/safe/safeApiSlice";
import { useGetCompanyQuery } from "../../store/slices/companyApiSlice";
import { useGetStoresQuery } from "../../store/slices/store/storeApi";
import { useGetFiscalYearsQuery } from "../../store/slices/fiscalYear/fiscalYearApiSlice";
import {
  Actions,
  Resources,
  buildPermission,
} from "../../../enums/permissions.enum";
import { useUserPermissions } from "../../hook/usePermissions";
import { guardPrint } from "../../utils/printGuard";

type SelectableItem = {
  id: string;
  name: string;
  unit: string;
  salePrice: number;
  purchasePrice: number;
  stock: number;
  barcode?: string;
};

const extractBranchName = (value: any): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return value.name || value.title || "";
  }
  return "";
};

const getUserBranchId = (user: User | null): string | null => {
  if (!user) return null;
  if (user.branchId) return user.branchId;
  const branch = (user as any)?.branch;
  if (typeof branch === "string") return branch;
  if (branch && typeof branch === "object") return branch.id || null;
  return null;
};

const getUserBranchName = (user: User | null): string => {
  if (!user) return "";
  if ((user as any)?.branchName) return (user as any).branchName;
  return extractBranchName((user as any)?.branch);
};

interface PurchaseInvoiceProps {
  title: string;
  currentUser: User | null;
  viewingId: string | number | null;
  onClearViewingId: () => void;
}

const PurchaseInvoice: React.FC<PurchaseInvoiceProps> = ({
  title,
  currentUser,
  viewingId,
  onClearViewingId,
}) => {
  // Redux hooks
  const dispatch = useAppDispatch();
  const { data: allInvoices = [] } = useGetPurchaseInvoicesQuery();
  const { hasPermission } = useUserPermissions();
  
  // Get current user's branch ID
  const userBranchId = getUserBranchId(currentUser);
  const canSearchAllBranches = useMemo(
    () =>
      hasPermission(buildPermission(Resources.PURCHASE_INVOICE, Actions.SEARCH)),
    [hasPermission],
  );
  
  // Filter invoices: show only current branch if user doesn't have SEARCH permission
  const invoices = useMemo(() => {
    return allInvoices.filter((invoice: any) => {
      // Filter by current branch if user doesn't have SEARCH permission
      const invoiceBranchId = invoice.branch?.id || invoice.branchId;
      if (!canSearchAllBranches && userBranchId && invoiceBranchId !== userBranchId) return false;
      
      return true;
    });
  }, [allInvoices, canSearchAllBranches, userBranchId]);
  const [createPurchaseInvoice] = useCreatePurchaseInvoiceMutation();
  const [updatePurchaseInvoice] = useUpdatePurchaseInvoiceMutation();
  const [deletePurchaseInvoice] = useDeletePurchaseInvoiceMutation();
  const { data: suppliers = [] } = useGetSuppliersQuery();
  const { data: banks = [] } = useGetBanksQuery();
  const { data: safes = [] } = useGetSafesQuery();
  const { data: company } = useGetCompanyQuery();
  const { data: stores = [] } = useGetStoresQuery();
  const { data: fiscalYears = [] } = useGetFiscalYearsQuery();
  
  // Get store for current user's branch
  const userStore = stores.find((store) => store.branchId === userBranchId);
  
  // Get items with store-specific balances (skip branch restriction if search permission exists)
  const itemsQueryParams =
    !canSearchAllBranches && userStore ? { storeId: userStore.id } : undefined;
  const { data: items = [], refetch: refetchItems } = useGetItemsQuery(itemsQueryParams);

  // Transform data
  const allItems: SelectableItem[] = (items as any[]).map((item) => ({
    id: item.code,
    name: item.name,
    unit: item.unit.name,
    salePrice: item.salePrice,
    purchasePrice: item.purchasePrice,
    stock: item.stock,
    barcode: item.barcode,
  }));

  const allSuppliers: Supplier[] = suppliers.map((supplier) => ({
    id: supplier.id,
    code: supplier.code,
    name: supplier.name,
    commercialReg: supplier.commercialReg,
    taxNumber: supplier.taxNumber,
    nationalAddress: supplier.nationalAddress,
    phone: supplier.phone,
    openingBalance: supplier.openingBalance,
    currentBalance: supplier.currentBalance,
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
    isVatEnabled: false,
  };

  const vatRate = company?.vatRate || 15;
  const isVatEnabled = company?.isVatEnabled || false;
  const createEmptyItem = (): InvoiceItem => ({
    id: "",
    name: "",
    unit: "",
    qty: 1,
    price: 0,
    taxAmount: 0,
    total: 0,
  });

const getInvoiceBranchMeta = (invoice: any) => {
  if (!invoice) return { id: null, name: "" };
  const id =
    invoice.branch?.id ||
    invoice.branchId ||
    (invoice.paymentTargetType === "safe" ? invoice.paymentTargetId : null) ||
    null;
  const name =
    extractBranchName(invoice.branch) ||
    invoice.branchName ||
    "";
  return { id, name };
};

  const [purchaseItems, setPurchaseItems] = useState<InvoiceItem[]>(
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
  const [invoiceBranchId, setInvoiceBranchId] = useState<string | null>(null);
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

  const [supplierQuery, setSupplierQuery] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const supplierRef = useRef<HTMLDivElement>(null);
  const balanceBarRef = useRef<HTMLDivElement>(null);

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
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const justSavedRef = useRef(false); // Flag to prevent resetting state after save
  const shouldOpenPreviewRef = useRef(false); // Flag to indicate we want to open preview after data is set
  const [previewData, setPreviewData] = useState<{
    vatRate: number;
    isVatEnabled: boolean;
    items: InvoiceItem[];
    totals: { subtotal: number; discount: number; tax: number; net: number };
    paymentMethod: "cash" | "credit";
    supplier: {
      id: string;
      name: string;
      address?: string;
      taxNumber?: string;
    } | null;
    details: {
      invoiceNumber: string;
      invoiceDate: string;
      userName: string | { name: string };
      branchName: string | { name: string };
      notes?: string;
    };
  } | null>(null);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const [showBalanceBar, setShowBalanceBar] = useState(false);
  const [shouldResetOnClose, setShouldResetOnClose] = useState(false);
  const resolvedBranchName = safeBranchName || getUserBranchName(currentUser);
  
  // Get safe name for current branch
  const getSafeNameForBranch = useMemo(() => {
    const targetBranchId = invoiceBranchId || userBranchId;
    if (!targetBranchId) return "";
    const branchSafe = safes.find((s) => s.branchId === targetBranchId);
    return branchSafe?.name || "";
  }, [invoiceBranchId, userBranchId, safes]);

  // Get current balance for selected supplier
  const selectedSupplierBalance = useMemo(() => {
    if (!selectedSupplier) return 0;
    const supplier = allSuppliers.find((s) => String(s.id) === String(selectedSupplier.id));
    return supplier?.currentBalance || 0;
  }, [selectedSupplier, allSuppliers]);

  // Hide balance bar when supplier is deselected
  useEffect(() => {
    if (!selectedSupplier) {
      setShowBalanceBar(false);
    }
  }, [selectedSupplier]);

  // Invalidate stock and prices when component mounts or when balance bar is shown
  useEffect(() => {
    // Invalidate Item tag to refetch stock and prices
    dispatch(itemsApiSlice.util.invalidateTags(["Item"]));
    // Also refetch items directly to ensure fresh data
    refetchItems();
  }, [dispatch, refetchItems, showBalanceBar]);

  const hasPrintableItems = useMemo(
    () =>
      purchaseItems.some(
        (item) => item.id && item.name && Number(item.qty) > 0,
      ),
    [purchaseItems],
  );

  const canPrintExistingInvoice = useMemo(
    () => currentIndex >= 0 && isReadOnly,
    [currentIndex, isReadOnly],
  );
  const isExistingInvoice = currentIndex >= 0;

  // Check if current invoice is in a closed period
  const isInvoiceInClosedPeriod = useMemo(() => {
    if (currentIndex < 0 || !invoices[currentIndex]) return false;
    const invoice = invoices[currentIndex];
    const invoiceDate = invoice.date ? new Date(invoice.date) : null;
    if (!invoiceDate) return false;
    
    return fiscalYears.some(fy => {
      if (fy.status !== 'CLOSED') return false;
      const startDate = new Date(fy.startDate);
      const endDate = new Date(fy.endDate);
      return invoiceDate >= startDate && invoiceDate <= endDate;
    });
  }, [currentIndex, invoices, fiscalYears]);

  // Show tax column when viewing/editing existing invoice OR when VAT is enabled for new invoices
  const shouldShowTaxColumn = currentIndex >= 0 || isVatEnabled;

  const handleOpenPreview = () => {
    if (!canPrintExistingInvoice) {
      showToast("لا يمكن الطباعة إلا بعد تحميل مستند محفوظ.", "error");
      return;
    }

    guardPrint({
      hasData: hasPrintableItems,
      showToast,
      onAllowed: () => setIsPreviewOpen(true),
    });
  };

  const filteredSuppliers = supplierQuery
    ? allSuppliers.filter((s) =>
        s.name.toLowerCase().includes(supplierQuery.toLowerCase()),
      )
    : allSuppliers;

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
    setPurchaseItems(Array(6).fill(null).map(createEmptyItem));
    setTotals({ subtotal: 0, discount: 0, tax: 0, net: 0 });
    setPaymentMethod("cash");
    setInvoiceDetails({
      invoiceNumber: "", // Backend will generate the code
      invoiceDate: new Date().toISOString().substring(0, 10),
    });
    setSelectedSupplier(null);
    setSupplierQuery("");
    setPaymentTargetType("safe");
    // For safes, we don't need paymentTargetId (we send branchId instead)
    setPaymentTargetId(null);
    const defaultBranchId = getUserBranchId(currentUser);
    setInvoiceBranchId(defaultBranchId);
    setSafeBranchName(getUserBranchName(currentUser));
    setInvoiceNotes("");
    setIsReadOnly(false);
    setPreviewData(null); // Clear preview data
    shouldOpenPreviewRef.current = false; // Reset preview flag
  };

  useEffect(() => {
    if (viewingId && invoices.length > 0) {
      // Use flexible comparison to handle both string and number IDs
      const index = (invoices || []).findIndex((inv) => 
        String(inv.id) === String(viewingId) || inv.id === viewingId
      );
      if (index !== -1) {
        setCurrentIndex(index);
      } else {
        showToast(`الفاتورة رقم ${viewingId} غير موجودة.`, 'error');
      }
      onClearViewingId();
    }
  }, [viewingId, invoices, onClearViewingId, showToast]);

  // Auto-focus barcode input field
  useEffect(() => {
    if (!isReadOnly && !isPreviewOpen && !isSearchModalOpen) {
      const timer = setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isReadOnly, isPreviewOpen, isSearchModalOpen]);

  useEffect(() => {
    if (currentIndex >= 0 && (invoices || [])[currentIndex]) {
      const inv = (invoices || [])[currentIndex];
      // Convert date to yyyy-MM-dd format for date input
      const formattedDate = inv.date ? new Date(inv.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      setInvoiceDetails({ invoiceNumber: inv.code, invoiceDate: formattedDate });
      setSelectedSupplier(
        inv.supplier ? { id: inv.supplier.id, name: inv.supplier.name } : null,
      );
      // Show "مورد نقدي" when editing cash invoice without supplier
      setSupplierQuery(inv.supplier?.name || (inv.paymentMethod === "cash" && !inv.supplier ? "مورد نقدي" : ""));
      setPurchaseItems(inv.items as InvoiceItem[]);
      setTotals({
        subtotal: inv.subtotal,
        discount: inv.discount,
        tax: inv.tax,
        net: inv.net,
      });
      setPaymentMethod(inv.paymentMethod);
      setPaymentTargetType(inv.paymentTargetType || "safe");
      setPaymentTargetId(inv.paymentTargetId || null);
      const { id: branchIdFromInvoice, name: branchNameFromInvoice } =
        getInvoiceBranchMeta(inv);
      setInvoiceBranchId(branchIdFromInvoice);
      setSafeBranchName(branchNameFromInvoice || getUserBranchName(currentUser));
      setInvoiceNotes((inv as any).notes || "");
      setIsReadOnly(true);
      justSavedRef.current = false; // Clear the flag after loading invoice
      shouldOpenPreviewRef.current = false; // Reset preview flag when loading existing
    } else if (!justSavedRef.current) {
      // Only call handleNew if we haven't just saved
      handleNew();
    }
  }, [currentIndex, invoices, currentUser]);

  useEffect(() => {
    if (currentIndex >= 0) return;
    setInvoiceBranchId(getUserBranchId(currentUser));
    setSafeBranchName(getUserBranchName(currentUser));
  }, [currentIndex, currentUser]);

  // Open preview when previewData is set and we have a flag to open it
  // The flag is only set to true after saving, so this ensures preview opens automatically after save
  useEffect(() => {
    if (shouldOpenPreviewRef.current && previewData && previewData.items.length > 0) {
      setIsPreviewOpen(true);
      shouldOpenPreviewRef.current = false; // Reset flag
    }
  }, [previewData]);

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

  useEffect(() => {
    purchaseItems.forEach((_, index) => {
      autosizeInput(qtyInputRefs.current[index]);
      autosizeInput(priceInputRefs.current[index]);
    });
  }, [purchaseItems]);

  useEffect(() => {
    const subtotal = purchaseItems.reduce(
      (acc, item) => acc + item.qty * item.price,
      0,
    );
    const taxTotal = isVatEnabled
      ? purchaseItems.reduce((acc, item) => acc + item.taxAmount, 0)
      : 0;
    const net = subtotal + taxTotal - totals.discount;
    setTotals((prev) => ({ ...prev, subtotal, tax: taxTotal, net }));
  }, [purchaseItems, totals.discount, isVatEnabled]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        itemSearchRef.current &&
        !itemSearchRef.current.contains(event.target as Node)
      )
        setActiveItemSearch(null);
      if (
        supplierRef.current &&
        !supplierRef.current.contains(event.target as Node)
      )
        setIsSupplierDropdownOpen(false);
      if (
        balanceBarRef.current &&
        !balanceBarRef.current.contains(event.target as Node) &&
        !supplierRef.current?.contains(event.target as Node)
      )
        setShowBalanceBar(false);
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
    const newIndex = purchaseItems.length;
    setPurchaseItems((prevItems) => [...prevItems, createEmptyItem()]);
    setFocusIndex(newIndex);
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: any,
  ) => {
    const newItems = [...purchaseItems];
    let item = { ...newItems[index], [field]: value };

    if (field === "name") setActiveItemSearch({ index, query: value });

    if (field === "qty" || field === "price") {
      const qty = parseFloat(item.qty as any) || 0;
      const price = parseFloat(item.price as any) || 0;
      const total = qty * price;
      item.total = total;
      item.taxAmount = isVatEnabled ? total * (vatRate / 100) : 0;
    }
    newItems[index] = item;
    setPurchaseItems(newItems);
  };

  const handleSelectItem = (index: number, selectedItem: SelectableItem) => {
    const newItems = [...purchaseItems];
    const currentItem = newItems[index];
    const item = {
      ...currentItem,
      id: selectedItem.id,
      name: selectedItem.name,
      unit: selectedItem.unit,
      qty: currentItem.qty || 1,
      price: selectedItem.purchasePrice,
    };
    const total = item.qty * (item.price || 0);
    item.total = total;
    item.taxAmount = isVatEnabled ? total * (vatRate / 100) : 0;
    newItems[index] = item;
    setPurchaseItems(newItems);
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
    // Intercept hardware barcode scans that happen while a table field is focused.
    // Many scanners type the full barcode then send Enter. If that happens here,
    // we treat the current field value as a barcode and route it through the
    // normal barcode handling so the item is added safely and the field is cleared.
    if (
      e.key === "Enter" &&
      !isReadOnly &&
      e.currentTarget &&
      typeof e.currentTarget.value === "string"
    ) {
      const scannedValue = e.currentTarget.value.trim();
      if (scannedValue.length >= 4) {
        const matchedItem = allItems.find(
          (item) =>
            item.barcode &&
            item.barcode.trim().toLowerCase() ===
              scannedValue.toLowerCase(),
        );

        if (matchedItem) {
          e.preventDefault();
          setPurchaseItems((prev) => {
            const next = [...prev];
            const current = next[index] || createEmptyItem();
            next[index] = {
              ...current,
              [field]: field === "qty" || field === "price" ? 0 : "",
            };
            return next;
          });
          handleScanSuccess(scannedValue);
          return;
        }
      }
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (field === "qty") {
        const priceInput = priceInputRefs.current[index];
        priceInput?.focus();
        // Select text after focus to allow immediate typing
        setTimeout(() => priceInput?.select(), 0);
      } else if (field === "price") {
        if (index === purchaseItems.length - 1) {
          handleAddItem();
        } else {
          nameInputRefs.current[index + 1]?.focus();
        }
      }
    }
  };

  const handleRemoveItem = (index: number) => {
    const newItems = purchaseItems.filter((_, i) => i !== index);
    while (newItems.length < 6) {
      newItems.push(createEmptyItem());
    }
    setPurchaseItems(newItems);
  };

  const handleSelectSupplier = (supplier: Supplier) => {
    setSelectedSupplier({ id: supplier.id.toString(), name: supplier.name });
    setSupplierQuery(supplier.name);
    setIsSupplierDropdownOpen(false);
    if (!isReadOnly) {
      setShowBalanceBar(true);
    }
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

    // Intercept hardware barcode scans that happen while the item name field is focused.
    // If user scans a barcode into the name field, capture it on Enter, add the item,
    // and clear the field so the barcode text does not remain there.
    if (
      e.key === "Enter" &&
      !isReadOnly &&
      e.currentTarget &&
      typeof e.currentTarget.value === "string"
    ) {
      const scannedValue = e.currentTarget.value.trim();
      if (scannedValue.length >= 4) {
        const matchedItem = allItems.find(
          (item) =>
            item.barcode &&
            item.barcode.trim().toLowerCase() ===
              scannedValue.toLowerCase(),
        );

        if (matchedItem) {
          e.preventDefault();
          const rowIndex = activeItemSearch.index;
          setPurchaseItems((prev) => {
            const next = [...prev];
            const current = next[rowIndex] || createEmptyItem();
            next[rowIndex] = {
              ...current,
              name: "",
            };
            return next;
          });
          setActiveItemSearch(null);
          handleScanSuccess(scannedValue);
          return;
        }
      }
    }

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

  const handleScanSuccess = (barcode: string) => {
    const trimmedBarcode = barcode.trim();
    if (!trimmedBarcode) {
      showToast("الرجاء إدخال باركود صحيح.", 'error');
      return;
    }

    const foundItem = allItems.find((item) => {
      if (!item.barcode) return false;
      return item.barcode.trim().toLowerCase() === trimmedBarcode.toLowerCase();
    });

    if (foundItem) {
      const emptyRowIndex = purchaseItems.findIndex((i) => !i.id && !i.name);
      const indexToFill =
        emptyRowIndex !== -1 ? emptyRowIndex : purchaseItems.length;

      const newItems = [...purchaseItems];
      if (emptyRowIndex === -1) {
        newItems.push(createEmptyItem());
      }

      const item = {
        ...newItems[indexToFill],
        id: foundItem.id,
        name: foundItem.name,
        unit: foundItem.unit,
        qty: 1,
        price: foundItem.purchasePrice,
      };
      const total = item.qty * (item.price || 0);
      item.total = total;
      item.taxAmount = isVatEnabled ? total * (vatRate / 100) : 0;
      newItems[indexToFill] = item;

      setPurchaseItems(newItems);

      showToast(`تم إضافة الصنف: ${foundItem.name}`);
    } else {
      showToast(`الصنف غير موجود. الباركود: ${trimmedBarcode}`, 'error');
    }
  };

  const handleSave = async () => {
    const finalItems = purchaseItems.filter((i) => i.id && i.name && i.qty > 0);

    if (finalItems.length === 0) {
      showToast("الرجاء إضافة صنف واحد على الأقل للفاتورة.", 'error');
      return;
    }

    if (paymentMethod === "credit" && !selectedSupplier) {
      showToast("الرجاء اختيار المورد للفواتير الآجلة.", 'error');
      return;
    }

    // Validate safe balance for cash payments with safe as payment target
    if (paymentMethod === "cash" && paymentTargetType === "safe") {
      const targetBranchId = invoiceBranchId || userBranchId;
      const branchSafe = targetBranchId
        ? safes.find((s) => s.branchId === targetBranchId)
        : null;
      if (
        branchSafe &&
        branchSafe.currentBalance !== undefined &&
        branchSafe.currentBalance < totals.net
      ) {
        showToast("الرصيد غير كافي في الخزنة.", 'error');
        return;
      }
    }

    // Validate that the invoice date has an open period (only for new invoices)
    if (currentIndex < 0 && invoiceDetails.invoiceDate) {
      const invoiceDate = new Date(invoiceDetails.invoiceDate);
      const hasOpenPeriod = fiscalYears.some(fy => {
        if (fy.status !== 'OPEN') return false;
        const startDate = new Date(fy.startDate);
        const endDate = new Date(fy.endDate);
        return invoiceDate >= startDate && invoiceDate <= endDate;
      });
      
      if (!hasOpenPeriod) {
        showToast("لا يمكن إنشاء الفاتورة: لا توجد فترة محاسبية مفتوحة لهذا التاريخ", 'error');
        return;
      }
    }

    try {
      // For cash payments without a supplier, pass null (backend will handle default)
      const safeBranchId = invoiceBranchId || userBranchId;
      if (paymentMethod === "cash" && paymentTargetType === "safe" && !safeBranchId) {
        showToast("لا يمكن حفظ فاتورة نقدية بدون تحديد فرع مرتبط بالخزنة.", "error");
        return;
      }
      
      const invoiceData = {
        supplierId: paymentMethod === "cash" && !selectedSupplier 
          ? null 
          : selectedSupplier?.id,
        date: invoiceDetails.invoiceDate,
        items: finalItems.map((item) => ({
          id: item.id,
          name: item.name,
          unit: item.unit,
          qty: item.qty,
          price: item.price,
          taxAmount: item.taxAmount || 0,
          total: item.total || 0,
        })),
        discount: totals.discount,
        paymentMethod,
        // For credit invoices, do NOT send any safe/bank info
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

      // Prepare supplier data for preview
      const fullSupplier = selectedSupplier
        ? (suppliers as any[]).find((s) => s.id === selectedSupplier.id)
        : null;
      const printSupplier = selectedSupplier
        ? {
            id: selectedSupplier.id,
            name: selectedSupplier.name,
            address: fullSupplier?.nationalAddress || fullSupplier?.address || undefined,
            taxNumber: fullSupplier?.taxNumber || undefined,
          }
        : null;

      if (currentIndex >= 0 && (invoices || [])[currentIndex]) {
        // Update existing invoice
        await updatePurchaseInvoice({
          id: (invoices || [])[currentIndex].id,
          data: invoiceData,
        }).unwrap();
        showToast("تم تحديث الفاتورة بنجاح!");
        setIsReadOnly(true);
        
        // Store preview data in state before opening preview
        const previewDataToStore = {
          vatRate,
          isVatEnabled,
          items: finalItems,
          totals,
          paymentMethod,
          supplier: printSupplier,
          details: {
            ...invoiceDetails,
            userName: currentUser?.fullName || "غير محدد",
            branchName: resolvedBranchName || "غير محدد",
            notes: invoiceNotes || undefined,
          },
        };
        
        // Set preview data and flag to open preview
        // useEffect will open preview once data is set
        shouldOpenPreviewRef.current = true;
        setPreviewData(previewDataToStore);
      } else {
        // Create new invoice
        const savedInvoice = await createPurchaseInvoice(invoiceData).unwrap();
        showToast("تم حفظ الفاتورة بنجاح!");
        
        // Set flag to prevent useEffect from resetting state
        justSavedRef.current = true;
        
        // Update invoice details with the saved invoice data (especially invoice number)
        // Convert date to yyyy-MM-dd format for date input
        const formattedDate = savedInvoice.date ? new Date(savedInvoice.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        const updatedInvoiceDetails = {
          invoiceNumber: savedInvoice.code,
          invoiceDate: formattedDate,
        };
        setInvoiceDetails(updatedInvoiceDetails);
        
        // Store preview data in state before opening preview
        // This ensures the preview has data even if state is reset by useEffect
        const previewDataToStore = {
          vatRate,
          isVatEnabled,
          items: finalItems,
          totals,
          paymentMethod,
          supplier: printSupplier,
          details: {
            ...updatedInvoiceDetails,
            userName: currentUser?.fullName || "غير محدد",
            branchName: resolvedBranchName || "غير محدد",
            notes: invoiceNotes || undefined,
          },
        };
        
        setIsReadOnly(true);
        
        // Set preview data and flag to open preview
        // useEffect will open preview once data is set
        shouldOpenPreviewRef.current = true;
        setPreviewData(previewDataToStore);
        setShouldResetOnClose(true);
        
        // Wait for invoice list to refresh, then find and load the saved invoice
        // This ensures the invoice is properly tracked for navigation
        setTimeout(() => {
          const savedIndex = (invoices as any[]).findIndex(
            (inv) => inv.id === savedInvoice.id
          );
          if (savedIndex >= 0) {
            setCurrentIndex(savedIndex);
          } else {
            // If invoice not found, clear flag (preview already open with stored data)
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
      message:
        "هل أنت متأكد من رغبتك في تعديل بيانات هذه الفاتورة؟ لا يمكن تعديل الكميات بعد الحفظ.",
      onConfirm: () => setIsReadOnly(false),
      type: "edit",
    });
  };

  const handleDelete = () => {
    if (currentIndex === -1) {
      showToast("لا يمكن حذف فاتورة جديدة لم يتم حفظها.", 'error');
      return;
    }
    showModal({
      title: "تأكيد الحذف",
      message: "هل أنت متأكد من حذف هذه الفاتورة؟",
      onConfirm: async () => {
        try {
          await deletePurchaseInvoice(
            (invoices || [])[currentIndex].id,
          ).unwrap();
          showToast("تم الحذف بنجاح.");
          if ((invoices || []).length <= 1) {
            handleNew();
          } else {
            setCurrentIndex((prev) => Math.max(0, prev - 1));
          }
        } catch (error) {
          showToast("حدث خطأ أثناء الحذف", 'error');
        }
      },
      type: "delete",
    });
  };

  const navigate = (index: number) => {
    if ((invoices || []).length > 0) {
      setCurrentIndex(
        Math.max(0, Math.min((invoices || []).length - 1, index)),
      );
    }
  };

  const navigateBy = (direction: "first" | "prev" | "next" | "last") => {
    const list = invoices || [];
    if (!Array.isArray(list) || list.length === 0) return;

    let newIndex = currentIndex;
    switch (direction) {
      case "first":
        newIndex = 0;
        break;
      case "last":
        newIndex = list.length - 1;
        break;
      case "next":
        newIndex = currentIndex === -1 ? 0 : Math.min(list.length - 1, currentIndex + 1);
        break;
      case "prev":
        newIndex = currentIndex === -1 ? list.length - 1 : Math.max(0, currentIndex - 1);
        break;
    }
    setCurrentIndex(newIndex);
  };

  const handleSelectInvoiceFromSearch = (row: { id: string }) => {
    const index = (invoices || []).findIndex((inv) => inv.id === row.id);
    if (index > -1) {
      setCurrentIndex(index);
    }
    setIsSearchModalOpen(false);
  };

  const inputStyle =
    "block w-full bg-brand-green-bg border-2 border-brand-green rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green py-3 px-4 disabled:bg-gray-200 disabled:cursor-not-allowed";
  const tableInputStyle =
    "text-center bg-transparent focus:outline-none focus:ring-1 focus:ring-brand-green rounded p-1 disabled:bg-transparent";

  return (
    <>
      <style>{`
        @media print {
          .no-print-delete-col { display: none !important; }
        }
      `}</style>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="border-2 border-brand-green rounded-lg mb-4">
          <DocumentHeader companyInfo={companyInfo} />
        </div>

        <div className="border-2 border-brand-green rounded-lg">
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-4 border-b-2 border-dashed border-gray-300 pb-2 text-brand-dark">
              {title}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="md:col-span-1">
                <div className="relative bg-brand-green-bg border-2 border-brand-green rounded-md p-1 flex items-center">
                  <button
                    onClick={() => setPaymentMethod("cash")}
                    className={`w-1/2 py-2 rounded ${paymentMethod === "cash" ? "bg-brand-green text-white shadow" : "text-gray-600"} transition-all duration-200`}
                    disabled={isReadOnly}
                  >
                    نقداً
                  </button>
                  <button
                    onClick={() => setPaymentMethod("credit")}
                    className={`w-1/2 py-2 rounded ${paymentMethod === "credit" ? "bg-brand-green text-white shadow" : "text-gray-600"} transition-all duration-200`}
                    disabled={isReadOnly}
                  >
                    آجل
                  </button>
                </div>
              </div>
              <input
                type="text"
                placeholder="رقم الفاتورة"
                className={inputStyle}
                value={invoiceDetails.invoiceNumber}
                onChange={(e) =>
                  setInvoiceDetails({
                    ...invoiceDetails,
                    invoiceNumber: e.target.value,
                  })
                }
                readOnly={true}
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
              <div className="relative" ref={supplierRef}>
                <input
                  type="text"
                  placeholder="ابحث عن مورد..."
                  className={inputStyle}
                  value={supplierQuery}
                  onChange={(e) => {
                    setSupplierQuery(e.target.value);
                    setIsSupplierDropdownOpen(true);
                    setSelectedSupplier(null);
                  }}
                  onFocus={() => {
                    setIsSupplierDropdownOpen(true);
                    if (selectedSupplier && !isReadOnly) {
                      setShowBalanceBar(true);
                    }
                  }}
                  disabled={isReadOnly}
                />
                {isSupplierDropdownOpen && !isReadOnly && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredSuppliers.map((supplier) => (
                      <div
                        key={supplier.id}
                        onClick={() => handleSelectSupplier(supplier)}
                        className="p-2 cursor-pointer hover:bg-brand-green-bg"
                      >
                        {supplier.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {paymentMethod === "cash" && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">
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
                      value={getSafeNameForBranch}
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

        <div className="overflow-x-auto my-4 border-2 border-brand-green rounded-lg">
          <table className="min-w-full border-collapse">
            <thead className="bg-brand-green text-white">
              <tr>
                <th className="px-2 py-3 w-10 text-center text-sm font-semibold uppercase border border-green-300">
                  م
                </th>
                <th className="px-2 py-3 w-24 text-right text-sm font-semibold uppercase border border-green-300">
                  رقم الصنف
                </th>
                <th className="px-2 py-3 w-2/5 text-right text-sm font-semibold uppercase border border-green-300">
                  الصنف
                </th>
                <th className="px-2 py-3 w-20 text-center text-sm font-semibold uppercase border border-green-300">
                  الوحدة
                </th>
                <th
                  className="px-2 py-3 text-center text-sm font-semibold uppercase border border-green-300"
                  style={{ minWidth: "100px" }}
                >
                  الكمية
                </th>
                <th
                  className="px-2 py-3 text-center text-sm font-semibold uppercase border border-green-300"
                  style={{ minWidth: "100px" }}
                >
                  السعر
                </th>
                {shouldShowTaxColumn && (
                  <th className="px-2 py-3 w-36 text-center text-sm font-semibold uppercase border border-green-300">
                    الضريبة {isVatEnabled ? `(%${vatRate})` : '(%0)'}
                  </th>
                )}
                <th className="px-2 py-3 w-36 text-center text-sm font-semibold uppercase border border-green-300">
                  الاجمالي
                </th>
                <th className="px-2 py-3 w-16 text-center border border-green-300 no-print-delete-col"></th>
              </tr>
            </thead>
            <tbody ref={itemSearchRef} className="divide-y divide-gray-300">
              {purchaseItems.map((item, index) => (
                <tr
                  key={index}
                  className="hover:bg-brand-green-bg transition-colors duration-150"
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
                        className="p-1 text-gray-400 hover:text-brand-green"
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
                              className={`p-2 cursor-pointer ${idx === highlightedIndex ? "bg-brand-green text-white" : "hover:bg-brand-green-bg"}`}
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
                      {formatMoney(isVatEnabled ? item.taxAmount || 0 : 0)}
                    </td>
                  )}
                  <td className="p-2 align-middle text-center border-x border-gray-300">
                    {formatMoney(item.total || 0)}
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
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={handleAddItem}
            className="px-4 py-2 bg-gray-200 text-brand-dark rounded-md hover:bg-gray-300 font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={isReadOnly}
          >
            اضافة سطر
          </button>
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="px-4 py-2 bg-brand-green text-white rounded-md hover:bg-green-700 font-semibold flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={isReadOnly}
          >
            <BarcodeIcon className="w-5 h-5" />
            <span>مسح باركود</span>
          </button>
        </div>

        <div className="bg-gray-50 -mx-6 -mb-6 mt-4 p-6 rounded-b-lg">
          <div className="flex justify-between items-start">
            <div className="w-1/2 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">
                  ملاحظات الفاتورة / معلومات إضافية عن المورد:
                </label>
                <textarea
                  className="w-full p-3 border-2 border-brand-green rounded-md bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-brand-green"
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
              <div className="border-2 border-brand-green rounded-lg bg-white shadow-inner">
                <div className="flex justify-between p-3">
                  <span className="font-semibold text-gray-600">
                    الاجمالي قبل الضريبة
                  </span>
                  <span className="font-bold text-lg text-brand-dark">
                    {formatMoney(totals.subtotal || 0)}
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
                    className="w-28 text-left p-1 rounded border-2 border-gray-600 bg-gray-700 text-white focus:ring-brand-green focus:border-brand-green font-bold"
                    disabled={isReadOnly}
                  />
                </div>
                {isVatEnabled && (
                  <div className="flex justify-between p-3 border-t-2 border-dashed border-gray-200">
                    <span className="font-semibold text-gray-600">
                      إجمالي الضريبة ({vatRate}%)
                    </span>
                    <span className="font-bold text-lg text-brand-dark">
                      {formatMoney(totals.tax || 0)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xl text-brand-dark bg-brand-green-bg p-4 border-t-4 border-brand-green rounded-b-md">
                  <span>الصافي</span>
                  <span>{formatMoney(totals.net || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-300">
            <div className="bg-brand-green-bg p-3 rounded-md text-center text-brand-dark font-semibold">
              {tafqeet(totals.net, companyInfo.currency)}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t-2 border-gray-200 flex flex-col items-center space-y-4">
            <div className="flex justify-center gap-2 flex-wrap">
              <PermissionWrapper
                requiredPermission={buildPermission(
                  Resources.PURCHASE_INVOICE,
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
                  Resources.PURCHASE_INVOICE,
                  isExistingInvoice ? Actions.UPDATE : Actions.CREATE,
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
              {!isInvoiceInClosedPeriod && (
                <>
                  <PermissionWrapper
                    requiredPermission={buildPermission(
                      Resources.PURCHASE_INVOICE,
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
                      Resources.PURCHASE_INVOICE,
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
                </>
              )}
              <PermissionWrapper
                requiredPermission={buildPermission(
                  Resources.PURCHASE_INVOICE,
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
                  Resources.PURCHASE_INVOICE,
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
                disabled={((invoices || []).length === 0) || currentIndex === 0}
                className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                الأول
              </button>
              <button
                onClick={() => navigateBy("prev")}
                disabled={((invoices || []).length === 0) || currentIndex === 0}
                className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                السابق
              </button>
              <div className="px-4 py-2 bg-brand-green-bg border-2 border-brand-green rounded-md">
                <span className="font-bold">
                  {currentIndex > -1
                    ? `${currentIndex + 1} / ${(invoices || []).length}`
                    : `جديد`}
                </span>
              </div>
              <button
                onClick={() => navigateBy("next")}
                disabled={((invoices || []).length === 0) || currentIndex === (invoices || []).length - 1}
                className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                التالي
              </button>
              <button
                onClick={() => navigateBy("last")}
                disabled={((invoices || []).length === 0) || currentIndex === (invoices || []).length - 1}
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
          { Header: "الكود", accessor: "id" },
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
        title="بحث عن فاتورة مشتريات"
        columns={[
          { Header: "الرقم", accessor: "code" },
          { Header: "التاريخ", accessor: "date" },
          { Header: "المورد", accessor: "supplier" },
          { Header: "الصافي", accessor: "total" },
        ]}
        data={(invoices || []).map((inv) => ({
          id: inv.id,
          code: inv.code,
          date: inv.date
            ? new Date(inv.date).toISOString().substring(0, 10)
            : "-",
          supplier: inv.supplier?.name || "-",
          total: formatMoney(inv.net || 0),
        }))}
        onSelectRow={handleSelectInvoiceFromSearch}
        colorTheme="green"
      />
      {(() => {
        // Use preview data from state if available, otherwise use current state
        const dataToPreview = previewData || (() => {
          const fullSupplier = selectedSupplier
            ? (suppliers as any[]).find((s) => s.id === selectedSupplier.id)
            : null;
          const printSupplier = selectedSupplier
            ? {
                id: selectedSupplier.id,
                name: selectedSupplier.name,
                address: fullSupplier?.nationalAddress || fullSupplier?.address || undefined,
                taxNumber: fullSupplier?.taxNumber || undefined,
              }
            : null;
          return {
            vatRate,
            isVatEnabled,
            items: purchaseItems.filter((i) => i.id && i.name && i.qty > 0),
            totals,
            paymentMethod,
            supplier: printSupplier,
            details: {
              ...invoiceDetails,
              userName: currentUser?.fullName || "غير محدد",
              branchName: resolvedBranchName || "غير محدد",
              notes: invoiceNotes || undefined,
            },
          };
        })();
        
        // Only render preview if we have data
        if (!isPreviewOpen || !dataToPreview || dataToPreview.items.length === 0) {
          return null;
        }
        
        return (
          <PurchaseInvoicePrintPreview
            isOpen={isPreviewOpen}
            onClose={() => {
              setIsPreviewOpen(false);
              setPreviewData(null); // Clear preview data when closing
              shouldOpenPreviewRef.current = false; // Reset flag
              if (shouldResetOnClose) {
                handleNew();
                setShouldResetOnClose(false);
              }
            }}
            invoiceData={dataToPreview}
          />
        );
      })()}
      {/* Hidden barcode input field for external barcode scanner */}
      <input
        ref={barcodeInputRef}
        type="text"
        value={barcodeInput}
        onChange={(e) => setBarcodeInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && barcodeInput.trim() && !isReadOnly) {
            e.preventDefault();
            handleScanSuccess(barcodeInput.trim());
            setBarcodeInput('');
            // Refocus after processing
            setTimeout(() => {
              barcodeInputRef.current?.focus();
            }, 50);
          }
        }}
        tabIndex={-1}
        className="absolute opacity-0 pointer-events-none"
        style={{ position: 'fixed', left: '-9999px', width: '1px', height: '1px' }}
        autoFocus={!isReadOnly}
      />
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
      {showBalanceBar && selectedSupplier && (
        <div ref={balanceBarRef}>
          <CreditEntityBalanceBar
            entityName={selectedSupplier.name}
            currentBalance={selectedSupplierBalance}
            theme="green"
            entityType="supplier"
            onClose={() => setShowBalanceBar(false)}
          />
        </div>
      )}
    </>
  );
};

export default PurchaseInvoice;
