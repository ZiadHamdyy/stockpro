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
  Customer,
  User,
  Safe,
  Bank,
} from "../../../types";
import InvoicePrintPreview from "./InvoicePrintPreview";
import { useModal } from "../../common/ModalProvider";
import { useToast } from "../../common/ToastProvider";
import BarcodeScannerModal from "../../common/BarcodeScannerModal";
import {
  useGetSalesInvoicesQuery,
  useCreateSalesInvoiceMutation,
  useUpdateSalesInvoiceMutation,
  useDeleteSalesInvoiceMutation,
} from "../../store/slices/salesInvoice/salesInvoiceApiSlice";
import { useGetCustomersQuery } from "../../store/slices/customer/customerApiSlice";
import { useGetItemsQuery } from "../../store/slices/items/itemsApi";
import { useGetBanksQuery } from "../../store/slices/bank/bankApiSlice";
import { useGetSafesQuery } from "../../store/slices/safe/safeApiSlice";
import { useGetCompanyQuery } from "../../store/slices/companyApiSlice";
import { useGetStoresQuery } from "../../store/slices/store/storeApi";
import { showApiErrorToast } from "../../../utils/errorToast";
import { formatMoney } from "../../../utils/formatting";
import { guardPrint } from "../../utils/printGuard";
import {
  Actions,
  Resources,
  buildPermission,
} from "../../../enums/permissions.enum";

type SelectableItem = {
  id: string;
  name: string;
  unit: string;
  salePrice: number;
  purchasePrice: number;
  stock: number;
  type: 'STOCKED' | 'SERVICE';
  barcode?: string;
  salePriceIncludesTax?: boolean;
};

type InvoiceRow = InvoiceItem & {
  salePriceIncludesTax?: boolean;
};

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

interface SalesInvoiceProps {
  title: string;
  currentUser: User | null;
  viewingId: string | number | null;
  onClearViewingId: () => void;
}

const SalesInvoice: React.FC<SalesInvoiceProps> = ({
  title,
  currentUser,
  viewingId,
  onClearViewingId,
}) => {
  // Redux hooks
  const { data: invoices = [], isLoading: invoicesLoading } =
    useGetSalesInvoicesQuery();
  const [createSalesInvoice, { isLoading: isCreating }] =
    useCreateSalesInvoiceMutation();
  const [updateSalesInvoice, { isLoading: isUpdating }] =
    useUpdateSalesInvoiceMutation();
  const [deleteSalesInvoice, { isLoading: isDeleting }] =
    useDeleteSalesInvoiceMutation();

  const { data: customers = [] } = useGetCustomersQuery();
  const { data: banks = [] } = useGetBanksQuery();
  const { data: safes = [] } = useGetSafesQuery();
  const { data: company } = useGetCompanyQuery();
  const { data: stores = [] } = useGetStoresQuery();
  
  // Get store for current user's branch
  const userBranchId = currentUser?.branchId || currentUser?.branch;
  const userStore = stores.find((store) => store.branchId === userBranchId);
  
  // Get items with store-specific balances
  const { data: items = [] } = useGetItemsQuery(userStore ? { storeId: userStore.id } : undefined);

  // Filter safes by current user's branch
  const filteredSafes = userBranchId
    ? safes.filter((safe) => safe.branchId === userBranchId)
    : safes;

  // Read allowSellingLessThanStock setting from localStorage
  const allowSellingLessThanStock = (() => {
    const stored = localStorage.getItem('allowSellingLessThanStock');
    return stored ? JSON.parse(stored) : false;
  })();

  // Read salePriceIncludesTax setting from localStorage
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
    type: item.type || 'STOCKED',
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
  const createEmptyItem = (): InvoiceRow => ({
    id: "",
    name: "",
    unit: "",
    qty: 1,
    price: 0,
    taxAmount: 0,
    total: 0,
    salePriceIncludesTax: salePriceIncludesTaxSetting,
  });

  const [invoiceItems, setInvoiceItems] = useState<InvoiceRow[]>(
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
  const [invoiceBranchId, setInvoiceBranchId] = useState<string | null>(null);
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
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const justSavedRef = useRef(false); // Flag to prevent resetting state after save
  const shouldOpenPreviewRef = useRef(false); // Flag to indicate we want to open preview after data is set
  const [previewData, setPreviewData] = useState<{
    vatRate: number;
    isVatEnabled: boolean;
    items: InvoiceRow[];
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
    };
  } | null>(null);

  const [focusIndex, setFocusIndex] = useState<number | null>(null);

  const hasPrintableItems = useMemo(
    () =>
      invoiceItems.some(
        (item) => item.id && item.name && Number(item.qty) > 0,
      ),
    [invoiceItems],
  );

  const canPrintExistingInvoice = useMemo(
    () => currentIndex >= 0 && isReadOnly,
    [currentIndex, isReadOnly],
  );
  const isExistingInvoice = currentIndex >= 0;

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
  const [originalInvoiceVatEnabled, setOriginalInvoiceVatEnabled] = useState<boolean>(false);

  // Use original invoice VAT status if editing existing invoice, otherwise use current company setting
  const effectiveVatEnabled = currentIndex >= 0 ? originalInvoiceVatEnabled : isVatEnabled;

  const assignLineAmounts = (item: InvoiceRow) => {
    const { total, taxAmount } = computeLineAmounts(
      item.qty,
      item.price,
      Boolean(item.salePriceIncludesTax),
      effectiveVatEnabled,
      vatRate,
    );
    item.total = total;
    item.taxAmount = taxAmount;
    return item;
  };

  const filteredCustomers = customerQuery
    ? allCustomers.filter((c) =>
        c.name.toLowerCase().includes(customerQuery.toLowerCase()),
      )
    : allCustomers;

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
    setInvoiceItems(Array(6).fill(null).map(createEmptyItem));
    setTotals({ subtotal: 0, discount: 0, tax: 0, net: 0 });
    setPaymentMethod("cash");
    setInvoiceDetails({
      invoiceNumber: "", // Backend will generate this
      invoiceDate: new Date().toISOString().substring(0, 10),
    });
    setSelectedCustomer(null);
    setCustomerQuery("");
    setPaymentTargetType("safe");
    // For safes, we don't need paymentTargetId (we send branchId instead)
    setPaymentTargetId(null);
    const defaultBranchId =
      currentUser?.branchId ||
      (typeof currentUser?.branch === "string"
        ? currentUser.branch
        : (currentUser?.branch as any)?.id) ||
      null;
    setInvoiceBranchId(defaultBranchId);
    setOriginalInvoiceVatEnabled(false); // Reset for new invoices
    setIsReadOnly(false);
    setPreviewData(null); // Clear preview data
  };

  useEffect(() => {
    if (viewingId && invoices.length > 0) {
      // Use flexible comparison to handle both string and number IDs
      const index = invoices.findIndex((inv) => 
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

  useEffect(() => {
    if (currentIndex >= 0 && invoices[currentIndex]) {
      const inv = invoices[currentIndex];
      // Convert date to yyyy-MM-dd format for date input
      const formattedDate = inv.date ? new Date(inv.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      setInvoiceDetails({ invoiceNumber: inv.code, invoiceDate: formattedDate });
      setSelectedCustomer(
        inv.customer ? { id: inv.customer.id, name: inv.customer.name } : null,
      );
      // Show "عميل نقدي" when editing cash invoice without customer
      setCustomerQuery(inv.customer?.name || (inv.paymentMethod === "cash" && !inv.customer ? "عميل نقدي" : ""));
      const normalizedItems = (inv.items as InvoiceRow[]).map((item) => ({
        ...item,
        salePriceIncludesTax: Boolean(item.salePriceIncludesTax),
      }));
      setInvoiceItems(normalizedItems);
      setTotals({
        subtotal: inv.subtotal,
        discount: inv.discount,
        tax: inv.tax,
        net: inv.net,
      });
      // Determine original VAT status from invoice data
      // If invoice has tax > 0 or any items have taxAmount > 0, VAT was enabled
      const invoiceItems = inv.items as InvoiceRow[];
      const originalVatEnabled = inv.tax > 0 || invoiceItems.some((item: InvoiceRow) => (item.taxAmount || 0) > 0);
      setOriginalInvoiceVatEnabled(originalVatEnabled);
      setPaymentMethod(inv.paymentMethod);
      setPaymentTargetType(inv.paymentTargetType || "safe");
      setPaymentTargetId(inv.paymentTargetId || null);
      setInvoiceBranchId(inv.branch?.id || inv.branchId || null);
      setIsReadOnly(true);
      justSavedRef.current = false; // Clear the flag after loading invoice
    } else if (!justSavedRef.current) {
      // Only call handleNew if we haven't just saved
      handleNew();
    }
  }, [currentIndex, invoices]);

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
    setInvoiceItems((prev) =>
      prev.map((item) => {
        const { total, taxAmount } = computeLineAmounts(
          item.qty,
          item.price,
          Boolean(item.salePriceIncludesTax),
          effectiveVatEnabled,
          vatRate,
        );
        const currentTotal = Number(item.total) || 0;
        const currentTax = Number(item.taxAmount) || 0;
        if (currentTotal === total && currentTax === taxAmount) {
          return item;
        }
        return { ...item, total, taxAmount };
      }),
    );
  }, [currentIndex, effectiveVatEnabled, vatRate]);

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
    invoiceItems.forEach((_, index) => {
      autosizeInput(qtyInputRefs.current[index]);
      autosizeInput(priceInputRefs.current[index]);
    });
  }, [invoiceItems]);

  useEffect(() => {
    const taxTotal = effectiveVatEnabled
      ? invoiceItems.reduce(
          (acc, item) => acc + (Number(item.taxAmount) || 0),
          0,
        )
      : 0;
    const subtotal = invoiceItems.reduce((acc, item) => {
      const lineTotal = Number(item.total) || 0;
      const lineTax = effectiveVatEnabled ? Number(item.taxAmount) || 0 : 0;
      return acc + (lineTotal - lineTax);
    }, 0);
    setTotals((prev) => {
      const net = subtotal + taxTotal - prev.discount;
      return { ...prev, subtotal, tax: taxTotal, net };
    });
  }, [invoiceItems, effectiveVatEnabled]);

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

  const handleAddItemAndFocus = () => {
    const newIndex = invoiceItems.length;
    setInvoiceItems((prevItems) => [...prevItems, createEmptyItem()]);
    setFocusIndex(newIndex);
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceRow,
    value: any,
  ) => {
    const newItems = [...invoiceItems];
    let item = { ...newItems[index], [field]: value };

    if (field === "name") setActiveItemSearch({ index, query: value });

    if (field === "qty" || field === "price") {
      item = assignLineAmounts(item);
    }
    newItems[index] = item;
    setInvoiceItems(newItems);
  };

  const handleSelectItem = (index: number, selectedItem: SelectableItem) => {
    const newItems = [...invoiceItems];
    const currentItem = newItems[index];
    const salePriceIncludesTaxValue =
      typeof selectedItem.salePriceIncludesTax === "boolean"
        ? selectedItem.salePriceIncludesTax
        : salePriceIncludesTaxSetting;
    const item = {
      ...currentItem,
      id: selectedItem.id,
      name: selectedItem.name,
      unit: selectedItem.unit,
      qty: currentItem.qty || 1,
      price: selectedItem.salePrice,
      salePriceIncludesTax: Boolean(salePriceIncludesTaxValue),
    };
    assignLineAmounts(item);
    newItems[index] = item;
    setInvoiceItems(newItems);
    setActiveItemSearch(null);
    setHighlightedIndex(-1);
    setTimeout(() => {
      qtyInputRefs.current[index]?.focus();
      qtyInputRefs.current[index]?.select();
    }, 0);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = invoiceItems.filter((_, i) => i !== index);
    // If this leaves less than 6 rows, add empty ones to maintain the minimum
    while (newItems.length < 6) {
      newItems.push(createEmptyItem());
    }
    setInvoiceItems(newItems);
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

  const handleTableKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
    field: "qty" | "price",
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (field === "qty") {
        priceInputRefs.current[index]?.focus();
      } else if (field === "price") {
        if (index === invoiceItems.length - 1) {
          handleAddItemAndFocus();
        } else {
          nameInputRefs.current[index + 1]?.focus();
        }
      }
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

  const handleScanSuccess = (barcode: string) => {
    const foundItem = allItems.find((item) => item.barcode === barcode);
    if (foundItem) {
      const emptyRowIndex = invoiceItems.findIndex((i) => !i.id && !i.name);
      const indexToFill =
        emptyRowIndex !== -1 ? emptyRowIndex : invoiceItems.length;

      const newItems = [...invoiceItems];
      if (emptyRowIndex === -1) {
        newItems.push(createEmptyItem());
      }

      const salePriceIncludesTaxValue =
        typeof foundItem.salePriceIncludesTax === "boolean"
          ? foundItem.salePriceIncludesTax
          : salePriceIncludesTaxSetting;
      const item = {
        ...newItems[indexToFill],
        id: foundItem.id,
        name: foundItem.name,
        unit: foundItem.unit,
        qty: 1,
        price: foundItem.salePrice,
        salePriceIncludesTax: Boolean(salePriceIncludesTaxValue),
      };
      assignLineAmounts(item);
      newItems[indexToFill] = item;

      setInvoiceItems(newItems);
      showToast(`تم إضافة الصنف: ${foundItem.name}`);
    } else {
      showToast("الصنف غير موجود. لم يتم العثور على باركود مطابق.", 'error');
    }
  };

  const handleSave = async () => {
    const finalItems = invoiceItems.filter((i) => i.id && i.name && i.qty > 0);

    if (finalItems.length === 0) {
      showToast("الرجاء إضافة صنف واحد على الأقل للفاتورة.", 'error');
      return;
    }

    if (paymentMethod === "credit" && !selectedCustomer) {
      showToast("الرجاء اختيار العميل للفواتير الآجلة.", 'error');
      return;
    }

    // Validate stock for STOCKED items if allowSellingLessThanStock is false
    if (!allowSellingLessThanStock) {
      for (const item of finalItems) {
        const itemInfo = allItems.find((i) => i.id === item.id);
        // Only validate stock for STOCKED items, skip SERVICE items
        if (itemInfo && itemInfo.type === 'STOCKED') {
          if (itemInfo.stock < item.qty) {
            showToast(`الرصيد غير كافي لهذا الصنف: ${item.name}`, 'error');
            return;
          }
        }
      }
    }

    try {
      // For cash payments without a customer, pass null (backend will handle default)
      // Get branch ID from current user - use it as paymentTargetId when payment target is "safe"
      const userBranchId =
        currentUser?.branchId ||
        (typeof currentUser?.branch === "string"
          ? currentUser.branch
          : (currentUser?.branch as any)?.id);
      const safeBranchId = userBranchId || invoiceBranchId;

      if (paymentMethod === "cash" && paymentTargetType === "safe" && !safeBranchId) {
        showToast("لا يمكن حفظ فاتورة نقدية بدون تحديد فرع مرتبط بالخزنة.", "error");
        return;
      }
      
      const invoiceData = {
        customerId: paymentMethod === "cash" && !selectedCustomer 
          ? null 
          : selectedCustomer?.id,
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
        notes: "",
        allowInsufficientStock: allowSellingLessThanStock,
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

      if (currentIndex >= 0 && invoices[currentIndex]) {
        // Update existing invoice
        await updateSalesInvoice({
          id: invoices[currentIndex].id,
          data: invoiceData,
        }).unwrap();
        showToast("تم تحديث الفاتورة بنجاح!");
        setIsReadOnly(true);
        
        // Store preview data in state before opening preview
        const previewDataToStore = {
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
            branchName: currentUser?.branch || "غير محدد",
          },
        };
        
        // Set preview data and flag to open preview
        // useEffect will open preview once data is set
        shouldOpenPreviewRef.current = true;
        setPreviewData(previewDataToStore);
      } else {
        // Create new invoice
        const savedInvoice = await createSalesInvoice(invoiceData).unwrap();
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
            branchName: currentUser?.branch || "غير محدد",
          },
        };
        
        setIsReadOnly(true);
        
        // Set preview data and flag to open preview
        // useEffect will open preview once data is set
        shouldOpenPreviewRef.current = true;
        setPreviewData(previewDataToStore);
        
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
      message: "هل أنت متأكد من رغبتك في تعديل بيانات هذه الفاتورة؟",
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
          await deleteSalesInvoice(invoices[currentIndex].id).unwrap();
          showToast("تم الحذف بنجاح.");
          if ((invoices as any[]).length <= 1) {
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
    if ((invoices as any[]).length > 0) {
      setCurrentIndex(
        Math.max(0, Math.min((invoices as any[]).length - 1, index)),
      );
    }
  };

  const navigateBy = (direction: "first" | "prev" | "next" | "last") => {
    const list = invoices as any[];
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
    const index = (invoices as any[]).findIndex((inv) => inv.id === row.id);
    if (index > -1) {
      setCurrentIndex(index);
    }
    setIsSearchModalOpen(false);
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
                placeholder="رقم الفاتورة"
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
                      value={typeof currentUser?.branch === 'string' 
                        ? currentUser.branch 
                        : (currentUser?.branch as any)?.name || currentUser?.branch || ""}
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
              {invoiceItems.map((item, index) => (
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
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={handleAddItemAndFocus}
            className="px-4 py-2 bg-gray-200 text-brand-dark rounded-md hover:bg-gray-300 font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={isReadOnly}
          >
            اضافة سطر
          </button>
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={isReadOnly}
          >
            <BarcodeIcon className="w-5 h-5" />
            <span>مسح باركود</span>
          </button>
        </div>

        <div className="bg-gray-50 -mx-6 -mb-6 mt-4 p-6 rounded-b-lg">
          <div className="flex justify-between items-start">
            <div className="w-1/2">
              <div className="mt-6 pt-4 text-center text-sm text-gray-600 font-semibold border-t-2 border-dashed border-gray-300 mr-4">
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
                    onChange={(e) => {
                      const discount = parseFloat(e.target.value) || 0;
                      setTotals((prev) => {
                        const net = prev.subtotal + prev.tax - discount;
                        return { ...prev, discount, net };
                      });
                    }}
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
                  Resources.SALES_INVOICE,
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
                  Resources.SALES_INVOICE,
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
              <PermissionWrapper
                requiredPermission={buildPermission(
                  Resources.SALES_INVOICE,
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
                  Resources.SALES_INVOICE,
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
                  Resources.SALES_INVOICE,
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
                  Resources.SALES_INVOICE,
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
                disabled={((invoices as any[]).length === 0) || currentIndex === 0}
                className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                الأول
              </button>
              <button
                onClick={() => navigateBy("prev")}
                disabled={((invoices as any[]).length === 0) || currentIndex === 0}
                className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                السابق
              </button>
              <div className="px-4 py-2 bg-brand-blue-bg border-2 border-brand-blue rounded-md">
                <span className="font-bold">
                  {currentIndex > -1
                    ? `${currentIndex + 1} / ${(invoices as any[]).length}`
                    : `جديد`}
                </span>
              </div>
              <button
                onClick={() => navigateBy("next")}
                disabled={((invoices as any[]).length === 0) || currentIndex === (invoices as any[]).length - 1}
                className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                التالي
              </button>
              <button
                onClick={() => navigateBy("last")}
                disabled={((invoices as any[]).length === 0) || currentIndex === (invoices as any[]).length - 1}
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
        title="بحث عن فاتورة مبيعات"
        columns={[
          { Header: "الرقم", accessor: "code" },
          { Header: "التاريخ", accessor: "date" },
          { Header: "العميل", accessor: "customer" },
          { Header: "الصافي", accessor: "total" },
        ]}
        data={invoices.map((inv) => ({
          id: inv.id,
          code: inv.code,
          date: inv.date
            ? new Date(inv.date).toISOString().substring(0, 10)
            : "-",
          customer: inv.customer?.name || "-",
          total: formatMoney(inv.net),
        }))}
        onSelectRow={handleSelectInvoiceFromSearch}
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
            vatRate,
            isVatEnabled: effectiveVatEnabled,
            items: invoiceItems.filter((i) => i.id && i.name && i.qty > 0),
            totals,
            paymentMethod,
            customer: printCustomer,
            details: {
              ...invoiceDetails,
              userName: currentUser?.fullName || "غير محدد",
              branchName: currentUser?.branch || "غير محدد",
            },
          };
        })();
        
        // Only render preview if we have data
        if (!isPreviewOpen || !dataToPreview || dataToPreview.items.length === 0) {
          return null;
        }
        
        return (
          <InvoicePrintPreview
            isOpen={isPreviewOpen}
            onClose={() => {
              setIsPreviewOpen(false);
              setPreviewData(null); // Clear preview data when closing
              shouldOpenPreviewRef.current = false; // Reset flag
              handleNew();
            }}
            invoiceData={dataToPreview}
          />
        );
      })()}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </>
  );
};

export default SalesInvoice;
