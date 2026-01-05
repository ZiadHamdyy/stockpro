import React, { useState, useMemo, useEffect, useRef } from 'react';
import type {
  Item,
  ItemGroup,
  InvoiceItem,
  User,
  Customer,
  CompanyInfo,
} from '../../../../types';
import {
  BarcodeIcon,
  UserIcon,
  LogOutIcon,
  PlusIcon,
  XIcon,
  GridIcon,
  MaximizeIcon,
  UsersIcon,
  BriefcaseIcon,
  FileTextIcon,
} from '../../../icons';
import { useToast } from '../../../common/ToastProvider';
import { formatNumber, formatMoney } from '../../../../utils/formatting';
import InvoicePrintPreview from '../InvoicePrintPreview';
import { useAppSelector } from '../../../store/hooks';
import PermissionWrapper from '../../../common/PermissionWrapper';
import { Resources, Actions, buildPermission } from '../../../../enums/permissions.enum';
import { useUserPermissions } from '../../../hook/usePermissions';
import {
  useGetItemsQuery,
  useGetItemGroupsQuery,
} from '../../../store/slices/items/itemsApi';
import { useGetCustomersQuery } from '../../../store/slices/customer/customerApiSlice';
import { useGetSafesQuery } from '../../../store/slices/safe/safeApiSlice';
import { useGetBanksQuery } from '../../../store/slices/bank/bankApiSlice';
import { useGetCompanyQuery } from '../../../store/slices/companyApiSlice';
import { useGetStoresQuery } from '../../../store/slices/store/storeApi';
import { useGetFinancialSettingsQuery } from '../../../store/slices/financialSettings/financialSettingsApi';
import { TaxPolicy } from '../../settings/financial-system/types';
import {
  useCreateSalesInvoiceMutation,
  useGetSalesInvoicesQuery,
  useGetSalesInvoiceByIdQuery,
  type CreateSalesInvoiceRequest,
  type SalesInvoice,
} from '../../../store/slices/salesInvoice/salesInvoiceApiSlice';
import { showApiErrorToast } from '../../../../utils/errorToast';
import DataTableModal from '../../../common/DataTableModal';
import POSSidebar from './POSSidebar';
import ProductGrid from './ProductGrid';
import Cart from './Cart';
import PaymentModal from './PaymentModal';

type POSProps = {
  title?: string;
};

// Interface for Invoice Tab
interface InvoiceTab {
  id: number;
  name: string;
  items: InvoiceItem[];
  timestamp: Date;
}

const getUserBranchId = (user: User | null): string | null => {
  if (!user) return null;
  return (user as any)?.branchId || (user as any)?.branch || null;
};

// Compute line amounts with tax logic (supports price includes tax)
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
    const net = baseAmount / (1 + vatRatePercent / 100);
    const taxAmount = baseAmount - net;
    return { total: baseAmount, taxAmount };
  }

  const taxAmount = baseAmount * (vatRatePercent / 100);
  const total = baseAmount + taxAmount;
  return { total, taxAmount };
};

const POS: React.FC<POSProps> = () => {
  const currentUser = useAppSelector((state) => state.auth.user);

  // --- Data from API / Redux ---
  const { data: company } = useGetCompanyQuery();
  const vatRate = company?.vatRate ?? 0;
  const isVatEnabled = company?.isVatEnabled ?? false;
  const companyInfo: CompanyInfo = {
    name: company?.name ?? "",
    activity: company?.activity ?? "",
    address: company?.address ?? "",
    phone: company?.phone ?? "",
    taxNumber: company?.taxNumber ?? "",
    commercialReg: (company as any)?.commercialReg ?? "",
    currency: company?.currency ?? "SAR",
    logo: (company as any)?.logo ?? null,
    capital: (company as any)?.capital ?? 0,
    vatRate,
    isVatEnabled,
  };

  const { data: stores = [] } = useGetStoresQuery();
  const { hasPermission } = useUserPermissions();
  const userBranchId = getUserBranchId(currentUser);
  const userStore = stores.find((store) => store.branchId === userBranchId);
  const canSearchAllBranches = useMemo(
    () =>
      hasPermission(buildPermission(Resources.SALES_INVOICE, Actions.SEARCH)),
    [hasPermission],
  );

  // Invoice search and retrieval
  const { data: allInvoices = [] } = useGetSalesInvoicesQuery();
  const filteredInvoices = useMemo(() => {
    return allInvoices.filter((invoice: SalesInvoice) => {
      const invoiceBranchId = invoice.branch?.id || invoice.branchId;
      if (!canSearchAllBranches && userBranchId && invoiceBranchId !== userBranchId) return false;
      return true;
    });
  }, [allInvoices, canSearchAllBranches, userBranchId]);

  const { data: itemsData = [] } = useGetItemsQuery(
    !canSearchAllBranches && userStore ? { storeId: userStore.id } : undefined,
  );
  const { data: itemGroupsData = [] } = useGetItemGroupsQuery(undefined);
  const { data: customersData = [] } = useGetCustomersQuery();
  const { data: safesData = [] } = useGetSafesQuery();
  const { data: banks = [] } = useGetBanksQuery();

  const filteredSafes = useMemo(
    () =>
      !canSearchAllBranches && userBranchId
        ? safesData.filter((safe) => safe.branchId === userBranchId)
        : safesData,
    [canSearchAllBranches, safesData, userBranchId],
  );

  // Read salePriceIncludesTax setting from Redux
  const { data: financialSettings } = useGetFinancialSettingsQuery();
  const salePriceIncludesTaxSetting = financialSettings?.taxPolicy === TaxPolicy.INCLUSIVE || false;

  const items: Item[] = useMemo(
    () =>
      (itemsData as any[]).map((item) => ({
        id: item.id ?? item.code ?? 0,
        code: item.code ?? String(item.id ?? ""),
        barcode: item.barcode ?? "",
        name: item.name ?? "",
        group:
          item.group?.name || item.group?.title || item.groupName || "غير مصنف",
        unit: item.unit?.name || item.unitName || item.unit || "",
        purchasePrice: Number(item.purchasePrice ?? item.cost ?? 0),
        salePrice: Number(item.salePrice ?? item.price ?? 0),
        stock: Number(item.stock ?? item.balance ?? 0),
        reorderLimit: item.reorderLimit ?? 0,
        salePriceIncludesTax:
          typeof item.salePriceIncludesTax === "boolean"
            ? item.salePriceIncludesTax
            : salePriceIncludesTaxSetting,
      })),
    [itemsData, salePriceIncludesTaxSetting],
  );

  const itemGroups: ItemGroup[] = useMemo(
    () =>
      (itemGroupsData as any[]).map((group) => ({
        id: group.id ?? group.code ?? 0,
        name: group.name ?? group.title ?? "",
      })),
    [itemGroupsData],
  );

  const customers: Customer[] = useMemo(
    () =>
      (customersData as any[]).map((cust) => ({
        id: cust.id?.toString() ?? "",
        code: cust.code ?? "",
        name: cust.name ?? "",
        commercialReg: cust.commercialReg ?? "",
        taxNumber: cust.taxNumber ?? "",
        nationalAddress: cust.nationalAddress ?? "",
        phone: cust.phone ?? "",
        openingBalance: Number(cust.openingBalance ?? 0),
        creditLimit: Number(cust.creditLimit ?? 0),
        currentBalance: Number(cust.currentBalance ?? 0),
      })),
    [customersData],
  );

  const [createSalesInvoice, { isLoading: isCreatingInvoice }] =
    useCreateSalesInvoiceMutation();

  // --- State ---
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState("");
  
  // Multi-Tab State
  const [tabs, setTabs] = useState<InvoiceTab[]>([
    { id: 1, name: 'فاتورة 1', items: [], timestamp: new Date() }
  ]);
  const [activeTabId, setActiveTabId] = useState<number>(1);
  const [nextTabId, setNextTabId] = useState<number>(2);

  // UI State
  const [showProductGrid, setShowProductGrid] = useState<boolean>(true);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  
  // Header Form State
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [customerType, setCustomerType] = useState('cash');
  const [customerQuery, setCustomerQuery] = useState("");
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const customerRef = useRef<HTMLDivElement>(null);
  const customerInputRef = useRef<HTMLInputElement>(null);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPriceCheckOpen, setIsPriceCheckOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [priceCheckItem, setPriceCheckItem] = useState<Item | null>(null);
  const [isInvoiceSearchModalOpen, setIsInvoiceSearchModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  // Fetch selected invoice details
  const { data: selectedInvoice, isLoading: isLoadingInvoice } = useGetSalesInvoiceByIdQuery(
    selectedInvoiceId || '',
    { skip: !selectedInvoiceId }
  );
  
  // Payment state
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [cardBankId, setCardBankId] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState(
    `POS-${Date.now().toString().slice(-6)}`,
  );

  // AI State (optional - can be removed if not needed)
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<any>(null);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Derived State (Helper to get current cart)
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const cartItems = activeTab.items;

  const filteredCustomers = useMemo(
    () =>
      customerQuery
        ? customers.filter((c) =>
            c.name.toLowerCase().includes(customerQuery.toLowerCase())
          )
        : customers,
    [customerQuery, customers],
  );

  const { showToast } = useToast();

  // --- Effects ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-focus barcode search field on page load
  useEffect(() => {
    // Small delay to ensure the input is rendered
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (paymentMethod === "card") {
      const defaultBankId = banks[0]?.id ? banks[0].id.toString() : null;
      setCardBankId((prev) => prev ?? defaultBankId);
    }
  }, [paymentMethod, banks]);

  // Update customer field when viewing saved invoice with customer
  useEffect(() => {
    if (selectedInvoiceId && selectedInvoice?.customer) {
      setSelectedCustomer({
        id: selectedInvoice.customer.id,
        name: selectedInvoice.customer.name,
      });
      setCustomerQuery(selectedInvoice.customer.name);
      // Set customer type based on payment method
      if (selectedInvoice.paymentMethod === "credit") {
        setCustomerType("credit");
      } else {
        setCustomerType("cash");
      }
    } else if (selectedInvoiceId && selectedInvoice && !selectedInvoice.customer) {
      // Clear customer if invoice has no customer
      setSelectedCustomer(null);
      setCustomerQuery("");
    }
  }, [selectedInvoiceId, selectedInvoice]);


  useEffect(() => {
    const updateDropdownPosition = () => {
      if (customerInputRef.current) {
        const rect = customerInputRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        customerRef.current &&
        !customerRef.current.contains(event.target as Node)
      ) {
        setIsCustomerDropdownOpen(false);
      }
    };

    if (isCustomerDropdownOpen) {
      updateDropdownPosition();
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", updateDropdownPosition, true);
      window.addEventListener("resize", updateDropdownPosition);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", updateDropdownPosition, true);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [isCustomerDropdownOpen]);

  // Filter Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.barcode && item.barcode.includes(searchQuery));
      const matchesCategory =
        activeCategory === "all" || item.group === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, activeCategory]);

  // --- Cart Logic ---
  const addToCart = (item: Item) => {
    if (isPriceCheckOpen) {
      setPriceCheckItem(item);
      return;
    }

    const itemSalePriceIncludesTax = 
      typeof (item as any).salePriceIncludesTax === "boolean"
        ? (item as any).salePriceIncludesTax
        : salePriceIncludesTaxSetting;

    setTabs((prev) => {
      const updatedTabs = prev.map(tab => {
        if (tab.id === activeTabId) {
          const existing = tab.items.find((i) => i.id === item.code);

          if (existing) {
            const newQty = existing.qty + 1;
            const { total, taxAmount } = computeLineAmounts(
              newQty,
              item.salePrice,
              Boolean((existing as any).salePriceIncludesTax ?? itemSalePriceIncludesTax),
              isVatEnabled,
              vatRate,
            );

            return {
              ...tab,
              items: tab.items.map((i) =>
                i.id === item.code
                  ? {
                      ...i,
                      qty: newQty,
                      total,
                      taxAmount,
                      salePriceIncludesTax: (existing as any).salePriceIncludesTax ?? itemSalePriceIncludesTax,
                    }
                  : i
              ),
            };
          }

          const { total, taxAmount } = computeLineAmounts(
            1,
            item.salePrice,
            itemSalePriceIncludesTax,
            isVatEnabled,
            vatRate,
          );

          return {
            ...tab,
            items: [
              ...tab.items,
              {
                id: item.code,
                name: item.name,
                unit: item.unit,
                qty: 1,
                price: item.salePrice,
                taxAmount,
                total,
                salePriceIncludesTax: itemSalePriceIncludesTax,
              } as InvoiceItem & { salePriceIncludesTax?: boolean },
            ],
          };
        }
        return tab;
      });
      return updatedTabs;
    });
    setAiInsight(null);
  };

  const updateQty = (id: string, delta: number) => {
    setTabs((prev) =>
      prev.map(tab => {
        if (tab.id === activeTabId) {
          return {
            ...tab,
            items: tab.items.map((item) => {
              if (item.id === id) {
                const newQty = item.qty + delta;
                if (newQty === 0) return item;

                const { total, taxAmount } = computeLineAmounts(
                  newQty,
                  item.price,
                  Boolean((item as any).salePriceIncludesTax ?? salePriceIncludesTaxSetting),
                  isVatEnabled,
                  vatRate,
                );

                return {
                  ...item,
                  qty: newQty,
                  total,
                  taxAmount,
                };
              }
              return item;
            }),
          };
        }
        return tab;
      })
    );
  };

  const updatePrice = (id: string, newPrice: number) => {
    setTabs((prev) =>
      prev.map(tab => {
        if (tab.id === activeTabId) {
          return {
            ...tab,
            items: tab.items.map((item) => {
              if (item.id === id) {
                const { total, taxAmount } = computeLineAmounts(
                  item.qty,
                  newPrice,
                  Boolean((item as any).salePriceIncludesTax ?? salePriceIncludesTaxSetting),
                  isVatEnabled,
                  vatRate,
                );

                return {
                  ...item,
                  price: newPrice,
                  total,
                  taxAmount,
                };
              }
              return item;
            }),
          };
        }
        return tab;
      })
    );
  };

  const removeFromCart = (id: string) => {
    setTabs((prev) =>
      prev.map(tab => {
        if (tab.id === activeTabId) {
          return {
            ...tab,
            items: tab.items.filter((i) => i.id !== id),
          };
        }
        return tab;
      })
    );
  };

  const totals = useMemo(() => {
    const tax = isVatEnabled
      ? cartItems.reduce((sum, i) => sum + (Number(i.taxAmount) || 0), 0)
      : 0;
    
    const subtotal = cartItems.reduce((acc, item) => {
      const lineTotal = Number(item.total) || 0;
      const lineTax = isVatEnabled ? Number(item.taxAmount) || 0 : 0;
      return acc + (lineTotal - lineTax);
    }, 0);
    
    const net = subtotal + tax - discount;
    return { subtotal, tax, discount, net };
  }, [cartItems, isVatEnabled, discount]);

  // Compute invoice totals when viewing saved invoice
  const invoiceTotals = useMemo(() => {
    if (!selectedInvoice) {
      return totals;
    }
    return {
      subtotal: selectedInvoice.subtotal || 0,
      tax: selectedInvoice.tax || 0,
      discount: selectedInvoice.discount || 0,
      net: selectedInvoice.net || 0,
    };
  }, [selectedInvoice, totals]);

  // Determine which items to display in cart
  const displayItems = useMemo(() => {
    if (selectedInvoiceId && selectedInvoice) {
      // Map invoice items to ensure taxAmount is always present
      return (selectedInvoice.items || []).map((item) => ({
        ...item,
        taxAmount: item.taxAmount ?? 0,
        total: item.total ?? 0,
      }));
    }
    return cartItems;
  }, [selectedInvoiceId, selectedInvoice, cartItems]);

  // Determine if viewing saved invoice
  const isViewingSavedInvoice = Boolean(selectedInvoiceId && selectedInvoice);

  // Tab Management
  const handleNewTab = () => {
    const newTab: InvoiceTab = {
      id: nextTabId,
      name: `فاتورة ${nextTabId}`,
      items: [],
      timestamp: new Date()
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(nextTabId);
    setNextTabId(prev => prev + 1);
    setAiInsight(null);
    // Auto-focus barcode search field when creating new invoice
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: number) => {
    e.stopPropagation();
    const newTabs = tabs.filter(t => t.id !== tabId);
    
    if (newTabs.length === 0) {
      // All tabs closed - create a new empty one (start from beginning)
      const newTab: InvoiceTab = {
        id: 1,
        name: 'فاتورة 1',
        items: [],
        timestamp: new Date()
      };
      setTabs([newTab]);
      setActiveTabId(1);
      setNextTabId(2);
      setAiInsight(null);
    } else {
      // Switch to another tab
      setTabs(newTabs);
      if (activeTabId === tabId) {
        // If we closed the active tab, switch to the last tab in the list
        setActiveTabId(newTabs[newTabs.length - 1].id);
      }
    }
    // Auto-focus barcode search field after closing tab
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredItems.length === 1) {
      addToCart(filteredItems[0]);
      setSearchQuery('');
      // Keep focus on search field after adding item
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  };

  const handleFunctionClick = (key: string) => {
    if (key === 'F3') handleNewTab();
    if (key === 'F4' || key === 'F5') {
      if (cartItems.length > 0) {
        setPaymentAmount(Math.abs(totals.net).toString());
        setPaymentModalOpen(true);
      }
    }
    if (key === 'F1') { 
      searchInputRef.current?.focus(); 
    }
    if (key === 'F8') window.print();
    if (key === 'F9') {
      if (cartItems.length > 0) {
        if(confirm('حذف السطر الأخير؟')) {
          removeFromCart(cartItems[cartItems.length-1].id);
        }
      }
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer({ id: customer.id.toString(), name: customer.name });
    setCustomerQuery(customer.name);
    setIsCustomerDropdownOpen(false);
    // Don't automatically change customer type - allow customer selection for both cash and credit
  };

  const handleSelectInvoiceFromSearch = (row: any) => {
    setSelectedInvoiceId(row.id);
    setIsInvoiceSearchModalOpen(false);
    // Preview will open automatically when invoice loads (via useEffect)
  };

  const handlePrintSavedInvoice = () => {
    if (selectedInvoiceId && selectedInvoice) {
      setIsPreviewOpen(true);
    }
  };

  // Transform SalesInvoice to InvoicePrintPreview format
  const transformInvoiceForPreview = (invoice: SalesInvoice | undefined) => {
    if (!invoice) return null;

    return {
      companyInfo: companyInfo,
      vatRate,
      isVatEnabled,
      items: (invoice.items || []).map((item) => ({
        ...item,
        taxAmount: item.taxAmount ?? 0,
        total: item.total ?? 0,
      })),
      totals: {
        subtotal: invoice.subtotal || 0,
        discount: invoice.discount || 0,
        tax: invoice.tax || 0,
        net: invoice.net || 0,
      },
      paymentMethod: invoice.paymentMethod || "cash",
      customer: invoice.customer
        ? {
            id: invoice.customer.id,
            name: invoice.customer.name,
          }
        : null,
      details: {
        invoiceNumber: invoice.code || "",
        invoiceDate: invoice.date ? invoice.date.substring(0, 10) : new Date().toISOString().substring(0, 10),
        userName: invoice.user?.name || currentUser?.fullName || "Cashier",
        branchName: invoice.branch?.name || (currentUser as any)?.branch?.name || currentUser?.branch || "Main",
        notes: invoice.notes || "",
      },
      zatcaUuid: invoice.zatcaUuid,
      zatcaSequentialNumber: invoice.zatcaSequentialNumber,
      zatcaStatus: invoice.zatcaStatus,
      zatcaIssueDateTime: invoice.zatcaIssueDateTime,
      zatcaHash: invoice.zatcaHash,
    };
  };

  // Compute preview data with useMemo to ensure consistent structure
  const previewInvoiceData = useMemo(() => {
    if (selectedInvoiceId && selectedInvoice) {
      const transformed = transformInvoiceForPreview(selectedInvoice);
      if (transformed) return transformed;
    }
    
    // Default to current cart data
    return {
      companyInfo: companyInfo,
      vatRate,
      isVatEnabled,
      items: cartItems,
      totals,
      paymentMethod: paymentMethod === "card" ? "cash" : paymentMethod,
      customer: selectedCustomer,
      details: {
        invoiceNumber,
        invoiceDate: new Date().toISOString().substring(0, 10),
        userName: currentUser?.fullName || "Cashier",
        branchName:
          (currentUser as any)?.branch?.name ||
          currentUser?.branch ||
          "Main",
      },
    };
  }, [
    selectedInvoiceId,
    selectedInvoice,
    companyInfo,
    vatRate,
    isVatEnabled,
    cartItems,
    totals,
    paymentMethod,
    selectedCustomer,
    invoiceNumber,
    currentUser,
  ]);

  const handleAIAnalyze = async () => {
    // Optional: Implement AI analysis if needed
    if (cartItems.length === 0) return;
    setIsAnalyzing(true);
    // Placeholder for AI analysis
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 1000);
  };

  const handlePaymentComplete = async (paymentData: {
    paymentMode: 'safe' | 'bank' | 'split';
    paymentTargetType: 'safe' | 'bank' | null;
    paymentTargetId: string | null;
    isSplitPayment: boolean;
    splitCashAmount?: number;
    splitBankAmount?: number;
    splitSafeId?: string | null;
    splitBankId?: string | null;
    bankTransactionType?: 'POS' | 'TRANSFER';
    createNewInvoice?: boolean;
  }) => {
    if (cartItems.length === 0) return;

    // Validate customer selection for credit customers
    if (customerType === "credit" && !selectedCustomer) {
      showToast("الرجاء اختيار العميل للفواتير الآجلة.", "error");
      return;
    }

    const safeBranchId = userBranchId;

    // For cash: send null if no customer selected, otherwise send customer ID
    // For credit: customer is required (already validated above)
    const customerId = customerType === "cash" && !selectedCustomer
      ? null
      : (selectedCustomer ? selectedCustomer.id : null);

    const payload: CreateSalesInvoiceRequest = {
      customerId: customerId || undefined,
      date: new Date().toISOString().substring(0, 10),
      items: cartItems.map((i) => ({
        id: i.id,
        name: i.name,
        unit: i.unit,
        qty: i.qty,
        price: i.price,
        taxAmount: i.taxAmount,
        total: i.total,
        salePriceIncludesTax: Boolean((i as any).salePriceIncludesTax ?? salePriceIncludesTaxSetting),
      })),
      discount,
      paymentMethod: customerType === "credit" ? "credit" : "cash",
      // For credit invoices, do NOT send any safe/bank info
      paymentTargetType: customerType === "credit" ? null : paymentData.paymentTargetType,
      // For credit invoices, paymentTargetId should be null
      paymentTargetId: customerType === "credit" ? null : paymentData.paymentTargetId,
      bankTransactionType: customerType === "credit" ? undefined : paymentData.bankTransactionType,
      notes,
    };

    // Add split payment fields if split payment
    if (customerType === "cash" && paymentData.isSplitPayment) {
      payload.isSplitPayment = true;
      payload.splitCashAmount = paymentData.splitCashAmount;
      payload.splitBankAmount = paymentData.splitBankAmount;
      payload.splitSafeId = paymentData.splitSafeId;
      payload.splitBankId = paymentData.splitBankId;
      payload.bankTransactionType = paymentData.bankTransactionType;
    }

    try {
      const created = await createSalesInvoice(payload).unwrap();
      if (created?.code) {
        setInvoiceNumber(created.code);
      }

      // If createNewInvoice flag is set, create a new tab instead of clearing/resetting
      if (paymentData.createNewInvoice) {
        // Remove the completed tab and create a new one
        const completedTabId = activeTabId;
        const updatedTabs = tabs.filter(t => t.id !== completedTabId);
        
        // Create a new invoice tab
        const newTab: InvoiceTab = {
          id: nextTabId,
          name: `فاتورة ${nextTabId}`,
          items: [],
          timestamp: new Date()
        };
        
        // Add the new tab and set it as active in one operation
        setTabs([...updatedTabs, newTab]);
        setActiveTabId(nextTabId);
        setNextTabId(prev => prev + 1);
      } else {
        // Normal flow: clear current tab or remove it
        if (tabs.length > 1) {
          const newTabs = tabs.filter(t => t.id !== activeTabId);
          setTabs(newTabs);
          setActiveTabId(newTabs[0].id);
        } else {
          setTabs(prev => prev.map(t => ({ ...t, items: [] })));
        }
      }
      
      setDiscount(0);
      setSearchQuery("");
      setNotes("");
      setSelectedCustomer(null);
      setCustomerType("cash");
      setCustomerQuery("");
      setIsCustomerDropdownOpen(false);
      setPaymentMethod("cash");
      setCardBankId(banks[0]?.id ? banks[0].id.toString() : null);
      setPaymentModalOpen(false);
      showToast("تم إصدار الفاتورة بنجاح");
      
      // Auto-focus barcode search field after payment completion
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } catch (error: any) {
      showApiErrorToast(error);
    }
  };


  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle F3 if payment modal is open (let PaymentModal handle it)
      if (e.key === 'F3' && !isPaymentModalOpen) {
        handleNewTab();
      }
      if (e.key === 'F4') if (cartItems.length > 0) {
        setPaymentAmount(Math.abs(totals.net).toString());
        setPaymentModalOpen(true);
      }
      if (e.key === 'F1') { 
        e.preventDefault(); 
        searchInputRef.current?.focus(); 
      }
      if (e.key === 'F9') if (cartItems.length > 0) { 
        if(confirm('حذف السطر الأخير؟')) removeFromCart(cartItems[cartItems.length-1].id); 
      }
      if (e.key === 'Escape') {
        if (isPaymentModalOpen) {
          setPaymentModalOpen(false);
        } else {
          // Close current tab logic
          const newTabs = tabs.filter(t => t.id !== activeTabId);
          
          if (newTabs.length === 0) {
            // All tabs closed - create a new empty one (start from beginning)
            const newTab: InvoiceTab = {
              id: 1,
              name: 'فاتورة 1',
              items: [],
              timestamp: new Date()
            };
            setTabs([newTab]);
            setActiveTabId(1);
            setNextTabId(2);
            setAiInsight(null);
          } else {
            // Switch to another tab
            setTabs(newTabs);
            setActiveTabId(newTabs[newTabs.length - 1].id);
          }
          // Auto-focus barcode search field after closing tab
          setTimeout(() => {
            searchInputRef.current?.focus();
          }, 100);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems, activeTabId, tabs, totals, isPaymentModalOpen, nextTabId]);

  return (
    <div className="flex flex-col bg-brand-blue-bg font-sans text-sm overflow-hidden -m-6" style={{ height: 'calc(100vh - 4rem)' }}>
        
      {/* TOP HEADER - BRAND BLUE THEME (matching sidebar) */}
      <div className="bg-brand-blue p-3 border-b-4 border-gold-500 shadow-xl z-30 flex flex-col gap-2 h-auto relative overflow-visible flex-shrink-0">
        {/* Operational Fields Row */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar px-1 pt-1 relative overflow-visible w-full">
          
            <div className="flex flex-col flex-shrink-0 relative w-40">
              <div className="flex items-center gap-2 mb-1">
                <UsersIcon className="w-[14px] h-[14px] text-gold-400" />
                <span className="text-[10px] text-blue-200 font-medium">نوع العميل</span>
              </div>
              <div className="relative bg-blue-900 border-2 border-blue-700 rounded-md p-1 flex items-center w-full">
                <button
                  onClick={() => {
                    setCustomerType("cash");
                    // Keep the selected customer name in the query if exists
                    if (selectedCustomer) {
                      setCustomerQuery(selectedCustomer.name);
                    } else {
                      setCustomerQuery("");
                    }
                    setIsCustomerDropdownOpen(false);
                  }}
                  className={`w-1/2 py-2 rounded text-xs font-bold transition-all duration-200 ${
                    customerType === "cash" 
                      ? "bg-blue-700 text-white shadow" 
                      : "text-white opacity-70"
                  }`}
                >
                  عميل نقدي
                </button>
                <button
                  onClick={() => {
                    setCustomerType("credit");
                    if (selectedCustomer) {
                      setCustomerQuery(selectedCustomer.name);
                    } else {
                      setCustomerQuery("");
                    }
                    setIsCustomerDropdownOpen(false);
                  }}
                  className={`w-1/2 py-2 rounded text-xs font-bold transition-all duration-200 ${
                    customerType === "credit" 
                      ? "bg-blue-700 text-white shadow" 
                      : "text-white opacity-70"
                  }`}
                >
                  عميل آجل
                </button>
              </div>
            </div>

          <PermissionWrapper
            requiredPermission={buildPermission(
              Resources.SALES_INVOICE,
              Actions.READ
            )}
            fallback={
              <div className="flex flex-col flex-shrink-0 relative w-[300px]">
                <div className="flex items-center gap-2 mb-1">
                  <UserIcon className="w-[14px] h-[14px] text-gold-400" />
                <span className="text-[10px] text-blue-200 font-medium">العميل</span>
              </div>
              <div className="h-9 w-full bg-blue-900/30 border border-blue-700 rounded flex items-center px-2 shadow-inner hover:border-gold-400/50 transition-colors">
                  <span className="text-white font-bold text-xs opacity-50">{selectedCustomer?.name || "-- عميل عام --"}</span>
                </div>
              </div>
            }
          >
            <div className="flex flex-col flex-shrink-0 relative w-[250px]" ref={customerRef}>
              <div className="flex items-center gap-2 mb-1">
                <UserIcon className="w-[14px] h-[14px] text-gold-400" />
                <span className="text-[10px] text-blue-200 font-medium">العميل</span>
              </div>
              <div className="relative h-9 w-full bg-blue-900/30 border border-blue-700 rounded flex items-center px-2 shadow-inner hover:border-gold-400/50 transition-colors">
                <input
                  ref={customerInputRef}
                  type="text"
                  placeholder={customerType === 'cash' ? "ابحث عن عميل (اختياري)..." : "ابحث عن عميل..."}
                  className="bg-transparent w-full text-white font-bold outline-none cursor-pointer text-xs placeholder-white/50 border-none focus:ring-0"
                  value={customerQuery}
                  onChange={(e) => {
                    setCustomerQuery(e.target.value);
                    setIsCustomerDropdownOpen(true);
                    setSelectedCustomer(null);
                  }}
                  onFocus={() => {
                    setIsCustomerDropdownOpen(true);
                    setTimeout(() => {
                      if (customerInputRef.current) {
                        const rect = customerInputRef.current.getBoundingClientRect();
                        setDropdownPosition({
                          top: rect.bottom + window.scrollY + 4,
                          left: rect.left + window.scrollX,
                          width: rect.width,
                        });
                      }
                    }, 0);
                  }}
                />
                {isCustomerDropdownOpen && (
                  <div 
                    className="fixed z-[9999] bg-blue-900 border-2 border-blue-700 rounded-md shadow-lg max-h-60 overflow-y-auto"
                    style={{
                      top: `${dropdownPosition.top}px`,
                      left: `${dropdownPosition.left}px`,
                      width: `${dropdownPosition.width}px`,
                    }}
                  >
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className="p-2 cursor-pointer hover:bg-blue-700 text-white text-xs"
                      >
                        {customer.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </PermissionWrapper>
          
          {/* Search Bar - Smaller size */}
          <PermissionWrapper
            requiredPermission={buildPermission(
              Resources.SALES_INVOICE,
              Actions.SEARCH
            )}
            fallback={
              <div className="flex flex-col flex-1 mx-2">
                <div className="flex items-center gap-2 mb-1">
                  <BarcodeIcon className="w-[14px] h-[14px] text-gold-400" />
                  <span className="text-[10px] text-blue-200 font-medium">البحث</span>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-blue-300">
                    <BarcodeIcon className="w-4 h-4" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="بحث غير متاح"
                    className="block w-full rounded border border-blue-700 pl-8 pr-8 py-1.5 bg-blue-900/30 text-white shadow-inner opacity-50 cursor-not-allowed text-xs font-bold h-9"
                    disabled
                  />
                </div>
              </div>
            }
          >
            <div className="flex flex-col flex-1 mx-2">
              <div className="flex items-center gap-2 mb-1">
                <BarcodeIcon className="w-[14px] h-[14px] text-gold-400" />
                <span className="text-[10px] text-blue-200 font-medium">البحث</span>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-blue-300 group-focus-within:text-gold-400 transition-colors">
                  <BarcodeIcon className="w-4 h-4" />
                </div>
                <input 
                  ref={searchInputRef}
                  type="text" 
                  placeholder="مسح الباركود أو البحث عن صنف (F1)"
                  className="block w-full rounded border border-blue-700 pl-8 pr-8 py-1.5 bg-blue-900/30 text-white shadow-inner focus:border-gold-400 focus:ring-0 transition-all font-bold placeholder-blue-300 text-xs h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
              </div>
            </div>
          </PermissionWrapper>

          {/* Date and Time - After Search Bar with White Background */}
          <div className="flex flex-col w-[280px]">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-blue-200 font-medium">التاريخ والوقت</span>
            </div>
            <div className="bg-white rounded border-2 border-gold-400 shadow-lg px-4 py-2 flex items-center justify-center gap-3">
              {(() => {
                const formatDateTime = (date: Date) => {
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  let hours = date.getHours();
                  const ampm = hours >= 12 ? 'PM' : 'AM';
                  hours = hours % 12;
                  hours = hours ? hours : 12; // the hour '0' should be '12'
                  const minutes = String(date.getMinutes()).padStart(2, '0');
                  const seconds = String(date.getSeconds()).padStart(2, '0');
                  return {
                    date: `${year}-${month}-${day}`,
                    time: `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`
                  };
                };
                const { date, time } = formatDateTime(currentTime);
                return (
                  <>
                    <div className="text-2xl font-mono font-extrabold text-brand-blue text-center">{time}</div>
                    <div className="text-xs font-mono text-brand-blue/70">{date}</div>
                  </>
                );
              })()}
            </div>
          </div>
          
          {/* Previous Invoices Button */}
          <PermissionWrapper
            requiredPermission={buildPermission(
              Resources.SALES_INVOICE,
              Actions.READ
            )}
            fallback={null}
          >
            <div className="flex flex-col flex-shrink-0">
              <div className="flex items-center gap-2 mb-1">
                <FileTextIcon className="w-[14px] h-[14px] text-gold-400" />
                <span className="text-[10px] text-blue-200 font-medium">الفواتير</span>
              </div>
              <button 
                onClick={() => setIsInvoiceSearchModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded border transition-all shadow-sm h-9 bg-blue-700 text-blue-200 border-blue-600 hover:text-white hover:bg-blue-600"
              >
                <FileTextIcon className="w-4 h-4" />
                <span className="text-xs">الفواتير السابقة</span>
              </button>
            </div>
          </PermissionWrapper>

          {/* Grid Toggle */}
          <div className="flex flex-col flex-shrink-0">
            <div className="flex items-center gap-2 mb-1">
              <GridIcon className="w-[14px] h-[14px] text-gold-400" />
              <span className="text-[10px] text-blue-200 font-medium">الأصناف</span>
            </div>
            <button 
              onClick={() => setShowProductGrid(!showProductGrid)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-all shadow-sm h-9 ${!showProductGrid ? 'bg-gold-500 text-blue-900 border-gold-600 font-bold' : 'bg-blue-700 text-blue-200 border-blue-600 hover:text-white'}`}
            >
              {showProductGrid ? <GridIcon className="w-4 h-4" /> : <MaximizeIcon className="w-4 h-4" />}
              <span className="text-xs">{showProductGrid ? 'إخفاء الأصناف' : 'إظهار الأصناف'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="flex flex-1 overflow-hidden p-4 gap-4 relative z-0 min-h-0">
        
        {/* RIGHT: Function Sidebar */}
        {/* <div className="w-56 h-full shadow-2xl rounded-lg overflow-hidden bg-royal-700 order-1 flex flex-col">
          <POSSidebar onFunctionClick={handleFunctionClick} />
        </div> */}

        {/* CENTER: Invoice Table (Tabs + Table) */}
        <div className="flex-1 flex flex-col gap-0 order-2 overflow-hidden shadow-xl rounded-lg border border-blue-200 bg-white relative z-0 min-h-0">
          
          {/* TABS HEADER */}
          <div className="flex items-end gap-1 px-2 pt-2 bg-blue-100 border-b border-blue-200 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              <div 
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`
                  relative group flex items-center gap-2 px-5 py-1 rounded-t-lg cursor-pointer select-none transition-all
                  ${activeTabId === tab.id 
                    ? 'bg-white text-blue-900 shadow-[0_-2px_5px_rgba(0,0,0,0.05)] z-10 border-t-4 border-brand-blue font-bold' 
                    : 'bg-blue-200/50 text-blue-700 hover:bg-blue-200 hover:text-blue-900 mt-1 border-t-4 border-transparent'}
                `}
                style={{ minWidth: '140px' }}
              >
                <div className="flex flex-col pt-1">
                  <span className="text-xs">{tab.name}</span>
                  <span className="text-[10px] opacity-70 font-mono">#{tab.id}</span>
                </div>
                
                <button 
                  onClick={(e) => handleCloseTab(e, tab.id)}
                  className={`mr-auto ml-[-15px] p-1 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 ${activeTabId === tab.id ? 'opacity-100' : ''}`}
                >
                  <XIcon className="w-3 h-3" />
                </button>
              </div>
            ))}
            
            {/* New Tab Button */}
            <button 
              onClick={handleNewTab}
              className="mb-1 ml-1 p-2 rounded-lg bg-blue-300 text-blue-800 hover:bg-blue-400 hover:text-white shadow-sm transition-all"
              title="فاتورة جديدة"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>

          {/* TABLE CONTAINER */}
          <div className="flex-1 relative z-0 overflow-hidden">
            <Cart 
              cartItems={displayItems}
              onUpdateQuantity={updateQty}
              onUpdatePrice={updatePrice}
              onRemoveItem={removeFromCart}
              onAnalyze={handleAIAnalyze}
              subtotal={invoiceTotals.subtotal}
              tax={invoiceTotals.tax}
              total={invoiceTotals.net}
              isAnalyzing={isAnalyzing}
              aiInsight={aiInsight}
              discount={invoiceTotals.discount}
              vatRate={vatRate}
              currency={companyInfo.currency}
              onOpenPayment={() => setPaymentModalOpen(true)}
              isViewingSavedInvoice={isViewingSavedInvoice}
              onPrint={handlePrintSavedInvoice}
            />
          </div>
        </div>

        {/* LEFT: Product Catalog (Conditional) */}
        {showProductGrid && (
          <div className="w-[28%] flex flex-col shadow-xl rounded-lg overflow-hidden border border-blue-200 bg-white order-3 animate-fade-in-right min-h-0">
            <ProductGrid 
              items={filteredItems} 
              onAdd={addToCart}
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
              itemGroups={itemGroups}
            />
          </div>
        )}

      </div>

      {/* MODAL */}
      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        total={totals.net}
        subtotal={totals.subtotal}
        tax={totals.tax}
        cartItems={cartItems}
        onComplete={handlePaymentComplete}
        onNewInvoice={handleNewTab}
        banks={banks}
        currentUser={currentUser}
        safes={safesData}
        filteredSafes={filteredSafes}
      />

      {/* CUSTOMER MODAL */}
      {isCustomerModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsCustomerModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800">
              <UserIcon className="w-6 h-6" /> اختيار عميل
            </h3>
            <div className="max-h-80 overflow-y-auto space-y-2 mb-4 pr-1">
              <div
                onClick={() => {
                  setSelectedCustomer(null);
                  setCustomerType("cash");
                  setCustomerQuery("");
                  setIsCustomerDropdownOpen(false);
                  setIsCustomerModalOpen(false);
                }}
                className="p-3 rounded-lg border border-gray-200 hover:bg-blue-50 cursor-pointer flex justify-between items-center font-bold"
              >
                <span>عميل نقدي (افتراضي)</span>
                {!selectedCustomer && (
                  <span className="text-brand-blue">✓</span>
                )}
              </div>
              {customers?.map((cust) => (
                <div
                  key={cust.id}
                  onClick={() => {
                    setSelectedCustomer({
                      id: cust.id.toString(),
                      name: cust.name,
                    });
                    // Don't automatically change customer type - allow selecting customer for both cash and credit
                    setCustomerQuery(cust.name);
                    setIsCustomerDropdownOpen(false);
                    setIsCustomerModalOpen(false);
                  }}
                  className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center transition-colors ${selectedCustomer?.id === cust.id.toString() ? "bg-blue-50 border-brand-blue text-blue-800" : "border-gray-200 hover:bg-gray-50"}`}
                >
                  <div>
                    <p className="font-bold">{cust.name}</p>
                    <p className="text-xs text-gray-500">{cust.phone}</p>
                  </div>
                  {selectedCustomer?.id === cust.id.toString() && (
                    <span className="text-brand-blue">✓</span>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setIsCustomerModalOpen(false)}
              className="w-full py-2 bg-gray-200 rounded-lg font-bold text-gray-700 hover:bg-gray-300"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* PRICE CHECK MODAL */}
      {isPriceCheckOpen && (
        <div
          className="fixed inset-0 bg-purple-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsPriceCheckOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🏷️</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              فحص السعر
            </h2>
            <p className="text-slate-500 mb-6">
              قم بمسح الباركود أو اختيار منتج لمعرفة السعر
            </p>

            {priceCheckItem ? (
              <div className="bg-purple-50 p-6 rounded-xl border-2 border-purple-100 mb-6 animate-pop-in">
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  {priceCheckItem.name}
                </h3>
                <p className="text-4xl font-black text-purple-600 mb-1">
                  {formatNumber(priceCheckItem.salePrice)}
                </p>
                <p className="text-sm font-bold text-purple-400 uppercase tracking-widest">
                  SAR
                </p>
                <div className="mt-4 pt-4 border-t border-purple-200 flex justify-between text-sm">
                  <span className="text-slate-500">المخزون المتوفر:</span>
                  <span className="font-bold text-slate-800">
                    {priceCheckItem.stock} {priceCheckItem.unit}
                  </span>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 mb-6 bg-slate-50">
                <p className="text-slate-400 font-medium">بانتظار المسح...</p>
              </div>
            )}

            <button
              onClick={() => {
                setIsPriceCheckOpen(false);
                setPriceCheckItem(null);
              }}
              className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Invoice Search Modal */}
      <DataTableModal
        isOpen={isInvoiceSearchModalOpen}
        onClose={() => setIsInvoiceSearchModalOpen(false)}
        title="بحث عن فاتورة مبيعات"
        columns={[
          { Header: "الرقم", accessor: "code" },
          { Header: "التاريخ", accessor: "date" },
          { Header: "العميل", accessor: "customer" },
          { Header: "الصافي", accessor: "total" },
        ]}
        data={filteredInvoices
          .sort((a, b) => {
            // Sort by date in descending order (newest first)
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            // If dates are equal, sort by createdAt (newest first)
            if (dateA === dateB) {
              const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return createdB - createdA;
            }
            return dateB - dateA;
          })
          .map((inv) => ({
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

      {/* Invoice Print Preview - Show selected invoice or current cart */}
      {(() => {
        // Only render preview if we have data and it's open
        // Since InvoicePrintPreview has an early return that causes hook order issues,
        // we only render it when isOpen would be true, and always pass isOpen={true}
        if (!isPreviewOpen || !previewInvoiceData || previewInvoiceData.items.length === 0) {
          return null;
        }
        
        return (
          <InvoicePrintPreview
            isOpen={true}
            onClose={() => {
              setIsPreviewOpen(false);
              setSelectedInvoiceId(null); // Reset selected invoice when closing
            }}
            invoiceData={previewInvoiceData}
            printSettings={{
              template: "thermal",
              showLogo: true,
              showTaxNumber: true,
              showAddress: true,
              headerText: "فاتورة ضريبية مبسطة",
              footerText: "شكراً لزيارتكم",
              termsText: "",
            }}
          />
        );
      })()}
    </div>
  );
};

export default POS;
