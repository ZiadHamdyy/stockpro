import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  PrintSettings,
} from "../../../types";
import InvoicePrintPreview from "./InvoicePrintPreview";
import { useModal } from "../../common/ModalProvider";
import { useToast } from "../../common/ToastProvider";
import BarcodeScannerModal from "../../common/BarcodeScannerModal";
import ItemContextBar from "../../common/ItemContextBar";
import CreditEntityBalanceBar from "../../common/CreditEntityBalanceBar";
import {
  useGetSalesInvoicesQuery,
  useCreateSalesInvoiceMutation,
  useUpdateSalesInvoiceMutation,
  useDeleteSalesInvoiceMutation,
} from "../../store/slices/salesInvoice/salesInvoiceApiSlice";
import { useGetCustomersQuery } from "../../store/slices/customer/customerApiSlice";
import { useGetItemsQuery, itemsApiSlice } from "../../store/slices/items/itemsApi";
import { useAppDispatch } from "../../store/hooks";
import { useGetBanksQuery } from "../../store/slices/bank/bankApiSlice";
import { useGetSafesQuery } from "../../store/slices/safe/safeApiSlice";
import { useGetCompanyQuery } from "../../store/slices/companyApiSlice";
import { useGetStoresQuery, useGetAllStoreItemsQuery } from "../../store/slices/store/storeApi";
import { useGetPriceQuotationByIdQuery } from "../../store/slices/priceQuotation/priceQuotationApiSlice";
import { useGetBranchesQuery } from "../../store/slices/branch/branchApi";
import { useGetStoreReceiptVouchersQuery } from "../../store/slices/storeReceiptVoucher/storeReceiptVoucherApi";
import { useGetStoreIssueVouchersQuery } from "../../store/slices/storeIssueVoucher/storeIssueVoucherApi";
import { useGetStoreTransferVouchersQuery } from "../../store/slices/storeTransferVoucher/storeTransferVoucherApi";
import { useGetPurchaseInvoicesQuery } from "../../store/slices/purchaseInvoice/purchaseInvoiceApiSlice";
import { useGetPurchaseReturnsQuery } from "../../store/slices/purchaseReturn/purchaseReturnApiSlice";
import { useGetSalesReturnsQuery } from "../../store/slices/salesReturn/salesReturnApiSlice";
import { useGetFiscalYearsQuery } from "../../store/slices/fiscalYear/fiscalYearApiSlice";
import { useGetFinancialSettingsQuery } from "../../store/slices/financialSettings/financialSettingsApi";
import { TaxPolicy } from "../settings/financial-system/types";
import { showApiErrorToast } from "../../../utils/errorToast";
import { formatMoney } from "../../../utils/formatting";
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

interface SalesInvoiceProps {
  title: string;
  currentUser: User | null;
  viewingId: string | number | null;
  onClearViewingId: () => void;
  prefillQuotationId?: string | null;
  onClearPrefillQuotation?: () => void;
  printSettings: PrintSettings;
}

const SalesInvoice: React.FC<SalesInvoiceProps> = ({
  title,
  currentUser,
  viewingId,
  onClearViewingId,
  prefillQuotationId,
  onClearPrefillQuotation,
  printSettings,
}) => {
  // Redux hooks
  const dispatch = useAppDispatch();
  const { data: allInvoices = [], isLoading: invoicesLoading } =
    useGetSalesInvoicesQuery();
  const { hasPermission } = useUserPermissions();
  
  // Get current user's branch ID
  const userBranchId = getUserBranchId(currentUser);
  const canSearchAllBranches = useMemo(
    () =>
      hasPermission(buildPermission(Resources.SALES_INVOICE, Actions.SEARCH)),
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
  const { data: fiscalYears = [] } = useGetFiscalYearsQuery();
  
  // Get store for current user's branch
  const userStore = stores.find((store) => store.branchId === userBranchId);
  
  // Get items with store-specific balances (skip branch restriction if search permission exists)
  const itemsQueryParams =
    !canSearchAllBranches && userStore ? { storeId: userStore.id } : undefined;
  const { data: items = [], refetch: refetchItems } = useGetItemsQuery(itemsQueryParams);

  // Get data for ItemContextBar
  const { data: branches = [] } = useGetBranchesQuery();
  const { data: storeItems = [] } = useGetAllStoreItemsQuery();
  const { data: storeReceiptVouchers = [] } = useGetStoreReceiptVouchersQuery();
  const { data: storeIssueVouchers = [] } = useGetStoreIssueVouchersQuery();
  const { data: storeTransferVouchers = [] } = useGetStoreTransferVouchersQuery();
  const { data: purchaseInvoices = [] } = useGetPurchaseInvoicesQuery();
  const { data: purchaseReturns = [] } = useGetPurchaseReturnsQuery();
  const { data: salesReturns = [] } = useGetSalesReturnsQuery();

  // Filter safes by current user's branch
  const filteredSafes =
    !canSearchAllBranches && userBranchId
      ? safes.filter((safe) => safe.branchId === userBranchId)
      : safes;

  type CreditLimitControl = 'BLOCK' | 'APPROVAL';

  // Read financial settings from Redux
  const { data: financialSettings } = useGetFinancialSettingsQuery();
  
  const creditLimitControl: CreditLimitControl = financialSettings?.creditLimitControl || 'BLOCK';
  const allowSellingLessThanStock = financialSettings?.allowNegativeStock || false;
  const salePriceIncludesTaxSetting = financialSettings?.taxPolicy === TaxPolicy.INCLUSIVE || false;
  const allowSellingLessThanCost = financialSettings?.allowSellingBelowCost || false;

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
    creditLimit: (customer as any).creditLimit ?? 0,
    currentBalance: customer.currentBalance,
  }));

  // Helper function to normalize dates for comparison
  const normalizeDate = useMemo(
    () => (date: any): string => {
      if (!date) return "";
      if (typeof date === "string") {
        const parsed = new Date(date);
        if (!Number.isNaN(parsed.getTime())) {
          return parsed.toISOString().substring(0, 10);
        }
        return date.substring(0, 10);
      }
      if (date instanceof Date) {
        return date.toISOString().substring(0, 10);
      }
      return "";
    },
    []
  );

  // Helper function to get last purchase price before or on a reference date
  const getLastPurchasePriceBeforeDate = useCallback((itemCode: string, referenceDate: string): number | null => {
    const normalizedReferenceDate = normalizeDate(referenceDate);
    if (!normalizedReferenceDate) return null;

    // Get all purchase invoices up to the reference date, sorted by date descending
    const relevantInvoices = (purchaseInvoices as any[])
      .filter((inv) => {
        const txDate = normalizeDate(inv.date) || normalizeDate((inv as any).invoiceDate);
        return txDate && txDate <= normalizedReferenceDate;
      })
      .sort((a, b) => {
        const dateA = normalizeDate(a.date) || normalizeDate((a as any).invoiceDate) || "";
        const dateB = normalizeDate(b.date) || normalizeDate((b as any).invoiceDate) || "";
        return dateB.localeCompare(dateA); // Descending order
      });

    // Find the most recent purchase price for this item
    for (const inv of relevantInvoices) {
      const items = Array.isArray(inv.items) ? inv.items : [];
      for (const invItem of items) {
        if (invItem.id === itemCode && invItem.price) {
          return invItem.price;
        }
      }
    }

    return null;
  }, [purchaseInvoices, normalizeDate]);

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
  const [bankTransactionType, setBankTransactionType] = useState<"POS" | "TRANSFER">("POS");
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitCashAmount, setSplitCashAmount] = useState(0);
  const [splitBankAmount, setSplitBankAmount] = useState(0);
  const [splitSafeId, setSplitSafeId] = useState<string | null>(null);
  const [splitBankId, setSplitBankId] = useState<string | null>(null);
  const { showModal } = useModal();
  const { showToast } = useToast();
  const [isPrefillingFromQuotation, setIsPrefillingFromQuotation] = useState(false);
  const {
    data: quotationPrefillData,
    isFetching: isQuotationPrefillLoading,
  } = useGetPriceQuotationByIdQuery(prefillQuotationId ?? "", {
    skip: !prefillQuotationId,
  });

  const [customerQuery, setCustomerQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const customerRef = useRef<HTMLDivElement>(null);
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
  const dropdownItemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const justSavedRef = useRef(false); // Flag to prevent resetting state after save
  const shouldOpenPreviewRef = useRef(false); // Flag to indicate we want to open preview after data is set
  const justPrefilledFromQuotationRef = useRef(false); // Flag to prevent totals recalculation after prefilling
  const [previewData, setPreviewData] = useState<{
    companyInfo: CompanyInfo;
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
    zatcaUuid?: string;
    zatcaSequentialNumber?: number;
    zatcaStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    zatcaIssueDateTime?: string;
    zatcaHash?: string;
    printSettings?: PrintSettings;
  } | null>(null);

  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const [focusedQtyIndex, setFocusedQtyIndex] = useState<number | null>(null);
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

  // Get current balance for selected customer
  const selectedCustomerBalance = useMemo(() => {
    if (!selectedCustomer) return 0;
    const customer = allCustomers.find((c) => String(c.id) === String(selectedCustomer.id));
    return customer?.currentBalance || 0;
  }, [selectedCustomer, allCustomers]);

  // Hide balance bar when customer is deselected
  useEffect(() => {
    if (!selectedCustomer) {
      setShowBalanceBar(false);
    }
  }, [selectedCustomer]);

  // Invalidate stock and prices when component mounts or when balance bar is shown
  useEffect(() => {
    // Invalidate Item tag to refetch stock and prices
    dispatch(itemsApiSlice.util.invalidateTags(["Item"]));
    // Also refetch items directly to ensure fresh data
    refetchItems();
  }, [dispatch, refetchItems, showBalanceBar]);

  const focusedItemData = useMemo(() => {
    if (focusedQtyIndex !== null && invoiceItems[focusedQtyIndex] && invoiceItems[focusedQtyIndex].id) {
      return allItems.find((i) => i.id === invoiceItems[focusedQtyIndex].id);
    }
    return null;
  }, [focusedQtyIndex, invoiceItems, allItems]);

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

  // Include invoice's safe in the list if viewing an invoice (even if from different branch)
  // This includes both regular safe (safeId) and split payment safe (splitSafeId)
  const safesForSelection = useMemo(() => {
    const result = [...filteredSafes];
    const addedIds = new Set(result.map(s => s.id));
    
    if (currentIndex >= 0 && invoices[currentIndex]) {
      const inv = invoices[currentIndex];
      const invoiceSafeId = (inv as any).safeId;
      const invoiceSplitSafeId = (inv as any).splitSafeId;
      
      // Add regular safe if not already in list
      if (invoiceSafeId && !addedIds.has(invoiceSafeId)) {
        const invoiceSafe = safes.find(s => s.id === invoiceSafeId);
        if (invoiceSafe) {
          result.unshift(invoiceSafe);
          addedIds.add(invoiceSafeId);
        }
      }
      
      // Add split payment safe if not already in list
      if (invoiceSplitSafeId && !addedIds.has(invoiceSplitSafeId)) {
        const invoiceSplitSafe = safes.find(s => s.id === invoiceSplitSafeId);
        if (invoiceSplitSafe) {
          result.unshift(invoiceSplitSafe);
          addedIds.add(invoiceSplitSafeId);
        }
      }
    }
    return result;
  }, [filteredSafes, currentIndex, invoices, safes]);

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
    // Auto-select first safe from current branch for cash payments
    // Backend requires paymentTargetId to be set, even though it finds the safe by branchId
    setPaymentTargetId(
      filteredSafes.length > 0 
        ? filteredSafes[0].id 
        : (getUserBranchId(currentUser) || "")
    );
    setBankTransactionType("POS");
    setIsSplitPayment(false);
    setSplitCashAmount(0);
    setSplitBankAmount(0);
    setSplitSafeId(filteredSafes.length > 0 ? filteredSafes[0].id : null);
    setSplitBankId(banks.length > 0 ? banks[0].id : null);
    const defaultBranchId = getUserBranchId(currentUser);
    setInvoiceBranchId(defaultBranchId);
    setSafeBranchName(getUserBranchName(currentUser));
    setInvoiceNotes("");
    setOriginalInvoiceVatEnabled(false); // Reset for new invoices
    setIsReadOnly(false);
    setPreviewData(null); // Clear preview data
    shouldOpenPreviewRef.current = false; // Reset preview flag
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
    if (currentIndex >= 0 && invoices[currentIndex]) {
      const inv = invoices[currentIndex];
      // Convert date to yyyy-MM-dd format for date input
      const formattedDate = inv.date ? new Date(inv.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      setInvoiceDetails({ invoiceNumber: inv.code, invoiceDate: formattedDate });
      setSelectedCustomer(
        inv.customer ? { id: inv.customer.id, name: inv.customer.name } : null,
      );
      // For saved invoices: if there is a customer name (linked or stored) show it, otherwise show \"عميل نقدي\"
      const storedCustomerName = (inv as any).customerName as string | undefined;
      setCustomerQuery(
        inv.customer?.name ||
          (storedCustomerName && storedCustomerName.trim()) ||
          "عميل نقدي",
      );
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
      setInvoiceNotes((inv as any).notes || "");
      setInvoiceNotes((inv as any).notes || "");
      // Determine original VAT status from invoice data
      // If invoice has tax > 0 or any items have taxAmount > 0, VAT was enabled
      const invoiceItems = inv.items as InvoiceRow[];
      const originalVatEnabled = inv.tax > 0 || invoiceItems.some((item: InvoiceRow) => (item.taxAmount || 0) > 0);
      setOriginalInvoiceVatEnabled(originalVatEnabled);
      setPaymentMethod(inv.paymentMethod);
      setPaymentTargetType(inv.paymentTargetType || "safe");
      // For safe payments, use safeId from invoice if available, otherwise use paymentTargetId
      const safeIdFromInvoice = (inv as any).safeId || inv.paymentTargetId || null;
      setPaymentTargetId(
        inv.paymentTargetType === "safe" 
          ? safeIdFromInvoice 
          : (inv.paymentTargetId || null)
      );
      setBankTransactionType((inv as any).bankTransactionType || "POS");
      setIsSplitPayment((inv as any).isSplitPayment || false);
      setSplitCashAmount((inv as any).splitCashAmount || 0);
      setSplitBankAmount((inv as any).splitBankAmount || 0);
      setSplitSafeId((inv as any).splitSafeId || null);
      setSplitBankId((inv as any).splitBankId || null);
      const { id: branchIdFromInvoice, name: branchNameFromInvoice } =
        getInvoiceBranchMeta(inv);
      setInvoiceBranchId(branchIdFromInvoice);
      setSafeBranchName(branchNameFromInvoice || getUserBranchName(currentUser));
      setIsReadOnly(true);
      justSavedRef.current = false; // Clear the flag after loading invoice
      shouldOpenPreviewRef.current = false; // Reset preview flag when loading existing
    } else if (!justSavedRef.current && !isPrefillingFromQuotation) {
      // Only call handleNew if we haven't just saved
      handleNew();
    }
  }, [currentIndex, invoices, currentUser, isPrefillingFromQuotation]);
  useEffect(() => {
    if (!prefillQuotationId || !quotationPrefillData || isQuotationPrefillLoading) {
      return;
    }

    setIsPrefillingFromQuotation(true);
    const quotation = quotationPrefillData;
    const quoteItems = Array.isArray(quotation.items)
      ? (quotation.items as InvoiceItem[])
      : [];

    const mappedItems: InvoiceRow[] = quoteItems.map((item) => {
      // In PriceQuotation, item.total is the base amount (qty * price), not base + tax
      // In SalesInvoice, when salePriceIncludesTax is false, item.total should be base + tax
      const baseAmount = Number(item.total) || (Number(item.qty) || 0) * (Number(item.price) || 0);
      const taxAmount = Number(item.taxAmount) || 0;
      const totalWithTax = baseAmount + taxAmount;
      return {
        id: item.id,
        name: item.name,
        unit: item.unit,
        qty: Number(item.qty) || 0,
        price: Number(item.price) || 0,
        taxAmount: taxAmount,
        total: totalWithTax,
        salePriceIncludesTax: false,
      };
    });

    while (mappedItems.length < 6) {
      mappedItems.push(createEmptyItem());
    }

    setCurrentIndex(-1);
    setInvoiceItems(mappedItems);
    setTotals({
      subtotal: quotation.totals?.subtotal ?? 0,
      discount: quotation.totals?.discount ?? 0,
      tax: quotation.totals?.tax ?? 0,
      net: quotation.totals?.net ?? 0,
    });
    const customerPayload = quotation.customer
      ? { id: quotation.customer.id, name: quotation.customer.name }
      : null;
    setSelectedCustomer(customerPayload);
    setCustomerQuery(customerPayload?.name || "");
    setInvoiceDetails({
      invoiceNumber: "",
      invoiceDate: quotation.date
        ? quotation.date.substring(0, 10)
        : new Date().toISOString().substring(0, 10),
    });
    setPaymentMethod("cash");
    setPaymentTargetType("safe");
    // Auto-select first safe from current branch for cash payments
    setPaymentTargetId(
      filteredSafes.length > 0 
        ? filteredSafes[0].id 
        : (getUserBranchId(currentUser) || "")
    );
    setBankTransactionType("POS");
    setIsSplitPayment(false);
    setSplitCashAmount(0);
    setSplitBankAmount(0);
    setSplitSafeId(filteredSafes.length > 0 ? filteredSafes[0].id : null);
    setSplitBankId(banks.length > 0 ? banks[0].id : null);
    setInvoiceBranchId(getUserBranchId(currentUser));
    setSafeBranchName(getUserBranchName(currentUser));
    setInvoiceNotes("");
    setIsReadOnly(false);
    setPreviewData(null);
    justSavedRef.current = false;
    justPrefilledFromQuotationRef.current = true; // Mark that we just prefilled
    showToast("تم تحميل بيانات عرض السعر إلى الفاتورة. راجعها ثم احفظ.");
    onClearPrefillQuotation?.();
    setIsPrefillingFromQuotation(false);
  }, [
    prefillQuotationId,
    quotationPrefillData,
    isQuotationPrefillLoading,
    currentUser,
    onClearPrefillQuotation,
    setInvoiceBranchId,
    setSafeBranchName,
    showToast,
  ]);

  useEffect(() => {
    if (currentIndex >= 0) return;
    setInvoiceBranchId(getUserBranchId(currentUser));
    setSafeBranchName(getUserBranchName(currentUser));
  }, [currentIndex, currentUser]);

  useEffect(() => {
    if (focusIndex !== null && nameInputRefs.current[focusIndex]) {
      nameInputRefs.current[focusIndex]?.focus();
      setFocusIndex(null); // Reset after focusing
    }
  }, [focusIndex]);

  // Open preview when previewData is set and we have a flag to open it
  // The flag is only set to true after saving, so this ensures preview opens automatically after save
  useEffect(() => {
    if (shouldOpenPreviewRef.current && previewData && previewData.items.length > 0) {
      setIsPreviewOpen(true);
      shouldOpenPreviewRef.current = false; // Reset flag
    }
  }, [previewData]);

  useEffect(() => {
    // Skip recalculation when prefilling from quotation to preserve original prices
    if (currentIndex >= 0 || isPrefillingFromQuotation) return;
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
  }, [currentIndex, effectiveVatEnabled, vatRate, isPrefillingFromQuotation]);

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
    // Skip totals recalculation when prefilling from quotation to preserve original totals
    if (isPrefillingFromQuotation) return;
    
    // Skip recalculation immediately after prefilling to preserve quotation totals
    if (justPrefilledFromQuotationRef.current) {
      justPrefilledFromQuotationRef.current = false; // Clear flag after first skip
      return;
    }
    
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
  }, [invoiceItems, effectiveVatEnabled, isPrefillingFromQuotation]);

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
        balanceBarRef.current &&
        !balanceBarRef.current.contains(event.target as Node) &&
        !customerRef.current?.contains(event.target as Node)
      )
        setShowBalanceBar(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeItemSearch) setHighlightedIndex(-1);
  }, [activeItemSearch]);

  // Scroll highlighted item into view when navigating with arrow keys
  useEffect(() => {
    if (
      activeItemSearch &&
      highlightedIndex >= 0 &&
      highlightedIndex < dropdownItemRefs.current.length
    ) {
      const highlightedElement = dropdownItemRefs.current[highlightedIndex];
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [highlightedIndex, activeItemSearch]);

  // Auto-select first bank when payment target type is "bank"
  // Auto-select first safe when payment target type is "safe" and cash is selected
  useEffect(() => {
    if (paymentTargetType === "bank" && !isReadOnly) {
      // Reset paymentTargetId if it doesn't belong to a bank
      const isValidBank = paymentTargetId && banks.some((bank) => bank.id === paymentTargetId);
      if (!isValidBank && banks.length > 0) {
        setPaymentTargetId(banks[0].id);
      } else if (!isValidBank) {
        setPaymentTargetId(null);
      }
    } else if (paymentTargetType === "safe" && !isReadOnly && paymentMethod === "cash") {
      // For safes with cash payment, auto-select the first safe from current branch
      // Backend requires paymentTargetId to be set, even though it finds the safe by branchId
      if (filteredSafes.length > 0) {
        // Set to first safe ID to pass validation (backend will use branchId to find the safe)
        setPaymentTargetId(filteredSafes[0].id);
      } else {
        // If no safes available, set to branch ID as fallback to pass validation
        setPaymentTargetId(userBranchId || invoiceBranchId || "");
      }
    }
  }, [paymentTargetType, banks, paymentTargetId, isReadOnly, paymentMethod, filteredSafes, userBranchId, invoiceBranchId]);

  // Auto-select safe when switching to cash payment
  useEffect(() => {
    if (paymentMethod === "cash" && paymentTargetType === "safe" && !isReadOnly) {
      if (filteredSafes.length > 0 && (!paymentTargetId || !filteredSafes.some(s => s.id === paymentTargetId))) {
        setPaymentTargetId(filteredSafes[0].id);
      } else if (filteredSafes.length === 0 && !paymentTargetId) {
        // Fallback to branch ID if no safes available
        setPaymentTargetId(userBranchId || invoiceBranchId || "");
      }
    }
  }, [paymentMethod, paymentTargetType, isReadOnly, filteredSafes, paymentTargetId, userBranchId, invoiceBranchId]);

  // Auto-update split amounts when net total changes
  useEffect(() => {
    if (!isReadOnly && isSplitPayment && totals.net > 0) {
      setSplitCashAmount(totals.net);
      setSplitBankAmount(0);
    }
  }, [totals.net, isSplitPayment, isReadOnly]);

  // Ensure safe and bank IDs are set when split payment is enabled
  useEffect(() => {
    if (!isReadOnly && isSplitPayment) {
      if (!splitSafeId && filteredSafes.length > 0) {
        setSplitSafeId(filteredSafes[0].id);
      }
      if (!splitBankId && banks.length > 0) {
        setSplitBankId(banks[0].id);
      }
    }
  }, [isSplitPayment, isReadOnly, splitSafeId, splitBankId, filteredSafes, banks]);

  const handleSplitAmountChange = (type: "cash" | "bank", value: string) => {
    const val = parseFloat(value) || 0;
    if (type === "cash") {
      setSplitCashAmount(val);
      setSplitBankAmount(Math.max(0, parseFloat((totals.net - val).toFixed(2))));
    } else {
      setSplitBankAmount(val);
      setSplitCashAmount(Math.max(0, parseFloat((totals.net - val).toFixed(2))));
    }
  };

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
    if (focusedQtyIndex === index) setFocusedQtyIndex(null);
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer({ id: customer.id.toString(), name: customer.name });
    setCustomerQuery(customer.name);
    setIsCustomerDropdownOpen(false);
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

  const handleTableKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
    field: "id" | "qty" | "price",
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
      // Only treat as barcode if it looks like a reasonable code and matches an item barcode
      if (scannedValue.length >= 4) {
        const matchedItem = allItems.find(
          (item) =>
            item.barcode &&
            item.barcode.trim().toLowerCase() ===
              scannedValue.toLowerCase(),
        );

        if (matchedItem) {
          e.preventDefault();
          // Clear the current cell value from invoiceItems
          setInvoiceItems((prev) => {
            const next = [...prev];
            const current = next[index] || createEmptyItem();
            next[index] = {
              ...current,
              [field]: field === "qty" || field === "price" ? 0 : "",
            };
            return next;
          });
          // Route the scanned barcode through the normal handler
          handleScanSuccess(scannedValue);
          return;
        }
      }
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (field === "id") {
        nameInputRefs.current[index]?.focus();
      } else if (field === "qty") {
        const priceInput = priceInputRefs.current[index];
        priceInput?.focus();
        // Select text after focus to allow immediate typing
        setTimeout(() => priceInput?.select(), 0);
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
          // Clear the name in the current row
          setInvoiceItems((prev) => {
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
        // After selecting item, move to qty field
        setTimeout(() => {
          qtyInputRefs.current[activeItemSearch.index]?.focus();
          qtyInputRefs.current[activeItemSearch.index]?.select();
        }, 0);
      } else if (filteredItems.length === 0) {
        // No search results, move to qty field
        const qtyInput = qtyInputRefs.current[activeItemSearch.index];
        qtyInput?.focus();
        setTimeout(() => qtyInput?.select(), 0);
      } else {
        // Has results but nothing highlighted, move to qty field
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
      showToast(`الصنف غير موجود. الباركود: ${trimmedBarcode}`, 'error');
    }
  };

  // Extract the actual save logic into a separate function
  const performSave = async () => {
    const finalItems = invoiceItems.filter((i) => i.id && i.name && i.qty > 0);

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
      // For cash payments without a customer, pass null (backend will handle default)
      // Get branch ID from current user - use it as paymentTargetId when payment target is "safe"
      const safeBranchId = invoiceBranchId || userBranchId;

      if (paymentMethod === "cash" && paymentTargetType === "safe" && !safeBranchId) {
        showToast("لا يمكن حفظ فاتورة نقدية بدون تحديد فرع مرتبط بالخزنة.", "error");
        return;
      }
      
      const invoiceData: any = {
        customerId:
          paymentMethod === "cash" && !selectedCustomer
            ? null
            : selectedCustomer?.id,
        customerName:
          paymentMethod === "cash" && !selectedCustomer
            ? customerQuery.trim() || undefined
            : undefined,
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
        // When payment target is "safe", send safe ID (backend will find safe by branchId)
        // When payment target is "bank", send bank ID as paymentTargetId
        paymentTargetId:
          paymentMethod === "cash"
            ? (paymentTargetType === "safe"
                ? paymentTargetId?.toString() || safeBranchId?.toString() || null
                : paymentTargetId?.toString() || null)
            : null,
        notes: invoiceNotes || "",
        allowInsufficientStock: allowSellingLessThanStock,
      };

      // Add split payment fields if cash payment
      if (paymentMethod === "cash") {
        if (isSplitPayment) {
          invoiceData.isSplitPayment = true;
          invoiceData.splitCashAmount = splitCashAmount;
          invoiceData.splitBankAmount = splitBankAmount;
          invoiceData.splitSafeId = splitSafeId;
          invoiceData.splitBankId = splitBankId;
          invoiceData.bankTransactionType = bankTransactionType;
        } else {
          invoiceData.paymentTargetType = paymentTargetType;
          invoiceData.paymentTargetId = paymentTargetId;
          if (paymentTargetType === "bank") {
            invoiceData.bankTransactionType = bankTransactionType;
          }
        }
      }

      // Prepare customer data for preview
      const fullCustomer = selectedCustomer
        ? (customers as any[]).find((c) => c.id === selectedCustomer.id)
        : null;
      const printCustomer = selectedCustomer
        ? {
            id: selectedCustomer.id,
            name: selectedCustomer.name,
            address:
              fullCustomer?.nationalAddress ||
              fullCustomer?.address ||
              undefined,
            taxNumber: fullCustomer?.taxNumber || undefined,
            commercialReg: fullCustomer?.commercialReg || undefined,
          }
        : customerQuery.trim()
        ? {
            id: "",
            name: customerQuery.trim(),
          }
        : null;

      if (currentIndex >= 0 && invoices[currentIndex]) {
        // Update existing invoice
        const updatedInvoice = await updateSalesInvoice({
          id: invoices[currentIndex].id,
          data: invoiceData,
        }).unwrap();
        showToast("تم تحديث الفاتورة بنجاح!");
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
            userName: currentUser?.name || currentUser?.fullName || "غير محدد",
            branchName: resolvedBranchName || "غير محدد",
            notes: invoiceNotes || undefined,
          },
          zatcaUuid: updatedInvoice?.zatcaUuid,
          zatcaSequentialNumber: updatedInvoice?.zatcaSequentialNumber,
          zatcaStatus: updatedInvoice?.zatcaStatus,
          zatcaIssueDateTime: updatedInvoice?.zatcaIssueDateTime,
          zatcaHash: updatedInvoice?.zatcaHash,
          printSettings,
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
            userName: currentUser?.name || currentUser?.fullName || "غير محدد",
            branchName: resolvedBranchName || "غير محدد",
            notes: invoiceNotes || undefined,
          },
          zatcaUuid: savedInvoice?.zatcaUuid,
          zatcaSequentialNumber: savedInvoice?.zatcaSequentialNumber,
          zatcaStatus: savedInvoice?.zatcaStatus,
          zatcaIssueDateTime: savedInvoice?.zatcaIssueDateTime,
          zatcaHash: savedInvoice?.zatcaHash,
          printSettings,
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

    // Validate split payment if enabled
    if (paymentMethod === "cash" && isSplitPayment) {
      const totalSplit = splitCashAmount + splitBankAmount;
      if (Math.abs(totalSplit - totals.net) > 0.1) {
        showToast(`مجموع المبالغ لا يساوي صافي الفاتورة.`, 'error');
        return;
      }
      if (!splitSafeId || splitSafeId === "" || !splitBankId || splitBankId === "") {
        showToast('الرجاء اختيار الخزنة والبنك لعملية الدفع المجزأة.', 'error');
        return;
      }
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

    // Validate sale price against cost (last purchase price if available, otherwise item's purchasePrice)
    // when selling below cost is NOT allowed
    if (!allowSellingLessThanCost) {
      for (const item of finalItems) {
        const lastPurchasePrice = getLastPurchasePriceBeforeDate(
          item.id,
          invoiceDetails.invoiceDate,
        );

        // Fallback to item's stored purchasePrice if there is no purchase history
        const itemInfo = allItems.find((i) => i.id === item.id);
        const fallbackPurchasePrice =
          itemInfo && typeof itemInfo.purchasePrice === "number"
            ? itemInfo.purchasePrice
            : null;

        // Effective cost: prefer last purchase price, otherwise stored purchasePrice
        const effectiveCost =
          lastPurchasePrice !== null ? lastPurchasePrice : fallbackPurchasePrice;

        // If we have a cost reference and sale price is less than it, prevent the sale
        if (effectiveCost !== null && item.price < effectiveCost) {
          showToast(
            `لا يمكن البيع: سعر البيع (${formatMoney(
              item.price,
            )}) أقل من تكلفة الشراء (${formatMoney(
              effectiveCost,
            )}) للصنف: ${item.name}`,
            "error",
          );
          return;
        }
      }
    }

    // Enforce customer credit limit for CREDIT invoices based on financial policy
    if (paymentMethod === "credit" && selectedCustomer) {
      const fullCustomer = (customers as any[]).find(
        (c) => String(c.id) === String(selectedCustomer.id),
      );

      const creditLimit = fullCustomer?.creditLimit ?? 0;

      // Only enforce when a positive credit limit is defined
      if (creditLimit > 0) {
        const existingNet =
          currentIndex >= 0 && invoices[currentIndex]
            ? Number(invoices[currentIndex].net) || 0
            : 0;

        // currentBalance is assumed to already include existing invoices (including this one if editing)
        const currentBalance = Number(fullCustomer?.currentBalance) || 0;
        const netDelta = totals.net - existingNet;
        const positiveDelta = netDelta > 0 ? netDelta : 0;
        const projectedBalance = currentBalance + positiveDelta;

        if (projectedBalance - creditLimit > 0.01) {
          const exceededBy = projectedBalance - creditLimit;
          
          // Handle different credit limit control modes
          if (creditLimitControl === "BLOCK") {
            // BLOCK mode: Prevent invoice creation
            showToast(
              `لا يمكن إصدار فاتورة آجل: سيتجاوز رصيد العميل حد الائتمان المسموح به.\n` +
                `حد الائتمان: ${formatMoney(creditLimit)} | ` +
                `الرصيد بعد الفاتورة: ${formatMoney(projectedBalance)} | ` +
                `قيمة التجاوز: ${formatMoney(exceededBy)}.`,
              "error",
            );
            return;
          } else if (creditLimitControl === "APPROVAL") {
            // APPROVAL mode: Show confirmation dialog
            showModal({
              title: "تجاوز حد الائتمان",
              message: `سيتم تجاوز حد الائتمان للعميل.\n\n` +
                `حد الائتمان: ${formatMoney(creditLimit)}\n` +
                `الرصيد الحالي: ${formatMoney(currentBalance)}\n` +
                `الرصيد بعد الفاتورة: ${formatMoney(projectedBalance)}\n` +
                `قيمة التجاوز: ${formatMoney(exceededBy)}\n\n` +
                `هل تريد المتابعة مع الموافقة الإدارية؟`,
              type: "info",
              onConfirm: async () => {
                // User confirmed, proceed with save
                await performSave();
              },
            });
            return;
          }
        }
      }
    }

    // All validations passed, proceed with save
    await performSave();
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
          [class*="ItemContextBar"], [id*="ItemContextBar"] { display: none !important; }
        }
      `}</style>
      <div className="bg-white p-6 rounded-lg shadow pb-24">
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
                  onFocus={() => {
                    setIsCustomerDropdownOpen(true);
                    if (selectedCustomer && !isReadOnly) {
                      setShowBalanceBar(true);
                    }
                  }}
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
              <div className="space-y-4 mb-4">
                {/* Checkbox and Payment Logic Container */}
                <div className="flex flex-col gap-0">
                  <div className="flex items-center gap-3 pb-2">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSplitPayment}
                        onChange={(e) => {
                          if (isReadOnly) return;
                          setIsSplitPayment(e.target.checked);
                          if (e.target.checked) {
                            setSplitCashAmount(totals.net);
                            setSplitBankAmount(0);
                            // Set default safe and bank if not already set
                            if (!splitSafeId && filteredSafes.length > 0) {
                              setSplitSafeId(filteredSafes[0].id);
                            }
                            if (!splitBankId && banks.length > 0) {
                              setSplitBankId(banks[0].id);
                            }
                          }
                        }}
                        className="sr-only peer"
                        disabled={isReadOnly}
                      />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
                      <span className="ms-3 text-sm font-bold text-gray-700">
                        تجزئة الدفع (نقدي + بنك)
                      </span>
                    </label>
                  </div>
                  {/* Split Payment UI - Compact 50% Width */}
                  {isSplitPayment ? (
                    <div className="w-full md:w-7/12 min-w-[320px] animate-fade-in-down origin-top">
                      <div className="bg-slate-600 text-white rounded-lg p-2 shadow-md border border-slate-500">
                        <div className="grid grid-cols-2 gap-4">
                          {/* Bank Part */}
                          <div className="p-2 bg-slate-500/40 rounded-md border border-slate-400/30">
                            <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-400/30 h-8">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.6)]"></div>
                                <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                                  البنكي (BANK)
                                </span>
                              </div>
                              <div className="flex bg-slate-700 rounded p-0.5 border border-slate-500/50">
                                <button
                                  onClick={() => setBankTransactionType("POS")}
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${
                                    bankTransactionType === "POS"
                                      ? "bg-blue-600 text-white shadow"
                                      : "text-slate-300 hover:text-white"
                                  }`}
                                  disabled={isReadOnly}
                                >
                                  POS
                                </button>
                                <button
                                  onClick={() =>
                                    setBankTransactionType("TRANSFER")
                                  }
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${
                                    bankTransactionType === "TRANSFER"
                                      ? "bg-blue-600 text-white shadow"
                                      : "text-slate-300 hover:text-white"
                                  }`}
                                  disabled={isReadOnly}
                                >
                                  تحويل
                                </button>
                              </div>
                            </div>
                            <div className="flex gap-2 items-center h-8">
                              <div className="flex-1">
                                <select
                                  className="w-full h-8 px-1 rounded-sm border-0 bg-white text-slate-900 text-xs focus:ring-1 focus:ring-blue-400 outline-none shadow-sm font-semibold"
                                  value={splitBankId || ""}
                                  onChange={(e) =>
                                    setSplitBankId(e.target.value ? e.target.value : null)
                                  }
                                  disabled={isReadOnly}
                                >
                                  <option value="">اختر البنك...</option>
                                  {banks.map((b) => (
                                    <option key={b.id} value={b.id}>
                                      {b.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="w-24">
                                <input
                                  type="number"
                                  className="w-full h-8 px-1 rounded-sm border-0 bg-white text-slate-900 font-bold text-sm focus:ring-1 focus:ring-blue-400 placeholder-slate-400 outline-none shadow-sm text-center"
                                  value={splitBankAmount}
                                  onChange={(e) =>
                                    handleSplitAmountChange("bank", e.target.value)
                                  }
                                  disabled={isReadOnly}
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                          </div>
                          {/* Cash Part */}
                          <div className="p-2 bg-slate-500/40 rounded-md border border-slate-400/30">
                            <div className="flex items-center justify-end mb-1 pb-1 border-b border-slate-400/30 h-8">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                                  النقدي (CASH)
                                </span>
                                <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]"></div>
                              </div>
                            </div>
                            <div className="flex gap-2 items-center h-8">
                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={getSafeNameForBranch}
                                  className="w-full h-8 px-1 rounded-sm border-0 bg-white text-slate-900 text-xs focus:ring-1 focus:ring-blue-400 outline-none shadow-sm font-semibold"
                                  disabled={true}
                                  readOnly
                                />
                              </div>
                              <div className="w-24">
                                <input
                                  type="number"
                                  className="w-full h-8 px-1 rounded-sm border-0 bg-white text-slate-900 font-bold text-sm focus:ring-1 focus:ring-blue-400 placeholder-slate-400 outline-none shadow-sm text-center"
                                  value={splitCashAmount}
                                  onChange={(e) =>
                                    handleSplitAmountChange("cash", e.target.value)
                                  }
                                  disabled={isReadOnly}
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mt-2">
                      <div className="md:col-start-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          نوع الدفع
                        </label>
                        <select
                          value={paymentTargetType}
                          onChange={(e) =>
                            setPaymentTargetType(
                              e.target.value as "safe" | "bank"
                            )
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
                            onChange={(e) =>
                              setPaymentTargetId(e.target.value || null)
                            }
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
                      {paymentTargetType === "bank" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            طريقة التحويل
                          </label>
                          <div className="relative bg-brand-blue-bg border-2 border-brand-blue rounded-md p-1 flex items-center">
                            <button
                              onClick={() => setBankTransactionType("POS")}
                              className={`w-1/2 py-2 rounded text-sm font-semibold ${
                                bankTransactionType === "POS"
                                  ? "bg-brand-blue text-white shadow"
                                  : "text-gray-600"
                              } transition-all duration-200`}
                              disabled={isReadOnly}
                            >
                              نقاط بيع
                            </button>
                            <button
                              onClick={() => setBankTransactionType("TRANSFER")}
                              className={`w-1/2 py-2 rounded text-sm font-semibold ${
                                bankTransactionType === "TRANSFER"
                                  ? "bg-brand-blue text-white shadow"
                                  : "text-gray-600"
                              } transition-all duration-200`}
                              disabled={isReadOnly}
                            >
                              تحويل
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
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
                      onKeyDown={(e) => handleTableKeyDown(e, index, "id")}
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
                              ref={(el) => {
                                if (el) dropdownItemRefs.current[idx] = el;
                              }}
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
                      onFocus={(e) => {
                        setFocusedQtyIndex(index);
                        e.target.select();
                      }}
                      onBlur={() => setTimeout(() => setFocusedQtyIndex(null), 200)}
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
            <div className="w-1/2 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">
                  ملاحظات الفاتورة / معلومات إضافية عن العميل:
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
              {!isInvoiceInClosedPeriod && (
                <>
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
                </>
              )}
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
        const dataToPreview = (previewData as
          | {
              companyInfo: CompanyInfo;
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
              zatcaUuid?: string;
              zatcaSequentialNumber?: number;
              zatcaStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED';
              zatcaIssueDateTime?: string;
              zatcaHash?: string;
            }
          | null) || (() => {
          const fullCustomer = selectedCustomer
            ? (customers as any[]).find((c) => c.id === selectedCustomer.id)
            : null;
          const printCustomer = selectedCustomer
            ? {
                id: selectedCustomer.id,
                name: selectedCustomer.name,
                address:
                  fullCustomer?.nationalAddress ||
                  fullCustomer?.address ||
                  undefined,
                taxNumber: fullCustomer?.taxNumber || undefined,
                commercialReg: fullCustomer?.commercialReg || undefined,
              }
            : customerQuery.trim()
            ? {
                id: "",
                name: customerQuery.trim(),
              }
            : null;
          // Get current invoice if viewing existing one
          const currentInvoice = currentIndex >= 0 ? invoices[currentIndex] : null;
          
          return {
            companyInfo,
            vatRate,
            isVatEnabled: effectiveVatEnabled,
            items: invoiceItems.filter((i) => i.id && i.name && i.qty > 0),
            totals,
            paymentMethod,
            customer: printCustomer,
            details: {
              ...invoiceDetails,
              userName: currentUser?.name || currentUser?.fullName || "غير محدد",
              branchName: resolvedBranchName || "غير محدد",
              notes: invoiceNotes || undefined,
            },
            // Include ZATCA fields from current invoice if available
            zatcaUuid: currentInvoice?.zatcaUuid,
            zatcaSequentialNumber: currentInvoice?.zatcaSequentialNumber,
            zatcaStatus: currentInvoice?.zatcaStatus,
            zatcaIssueDateTime: currentInvoice?.zatcaIssueDateTime,
            zatcaHash: currentInvoice?.zatcaHash,
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
              if (shouldResetOnClose) {
                handleNew();
                setShouldResetOnClose(false);
              }
            }}
            invoiceData={dataToPreview}
            printSettings={printSettings}
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
            onClose={() => setFocusedQtyIndex(null)}
          />
        </div>
      )}
      {showBalanceBar && selectedCustomer && (
        <div ref={balanceBarRef}>
          <CreditEntityBalanceBar
            entityName={selectedCustomer.name}
            currentBalance={selectedCustomerBalance}
            theme="blue"
            entityType="customer"
            onClose={() => setShowBalanceBar(false)}
          />
        </div>
      )}
    </>
  );
};

export default SalesInvoice;
