import { useState, useCallback, useMemo, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./components/store/store";
import { useAppDispatch } from "./components/store/hooks";
import { useAuth } from "./components/hook/Auth";
import { useSendLogOutMutation } from "./components/store/slices/auth/authApi";
import { useLazyDownloadBackupQuery } from "./components/store/slices/backupApiSlice";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import { TitleProvider } from "./components/context/TitleContext";
import Dashboard from "./components/pages/Dashboard";
import Placeholder from "./components/pages/Placeholder";
import Login from "./components/pages/Login";
import CompanyData from "./components/pages/settings/CompanyData";
import BranchesData from "./components/pages/settings/BranchesData";
import StoresData from "./components/pages/settings/StoresData";
import UsersData from "./components/pages/settings/UsersData";
import Permissions from "./components/pages/settings/Permissions";
import AddItem from "./components/pages/items/AddItem";
import ItemsList from "./components/pages/items/ItemsList";
import ItemGroups from "./components/pages/items/ItemGroups";
import Units from "./components/pages/items/Units";
import StoreReceiptVoucher from "./components/pages/warehouse/StoreReceiptVoucher";
import StoreIssueVoucher from "./components/pages/warehouse/StoreIssueVoucher";
import StoreTransfer from "./components/pages/warehouse/StoreTransfer";
import SalesInvoice from "./components/pages/sales/SalesInvoice";
import SalesReturn from "./components/pages/sales/SalesReturn";
import DailySales from "./components/pages/sales/DailySales";
import DailySalesReturns from "./components/pages/sales/DailySalesReturns";
import PurchaseInvoice from "./components/pages/purchases/PurchaseInvoice";
import PurchaseReturn from "./components/pages/purchases/PurchaseReturn";
import DailyPurchases from "./components/pages/purchases/DailyPurchases";
import DailyPurchaseReturns from "./components/pages/purchases/DailyPurchaseReturns";
import AddCustomer from "./components/pages/customers/AddCustomer";
import CustomersList from "./components/pages/customers/CustomersList";
import AddSupplier from "./components/pages/suppliers/AddSupplier";
import SuppliersList from "./components/pages/suppliers/SuppliersList";
import ReceiptVoucher from "./components/pages/financials/ReceiptVoucher";
import PaymentVoucher from "./components/pages/financials/PaymentVoucher";
import InternalTransfers from "./components/pages/financials/InternalTransfers";
import ExpensesList from "./components/pages/financials/ExpensesList";
import ExpenseCodes from "./components/pages/financials/ExpenseCodes";
import ExpenseTypes from "./components/pages/financials/ExpenseTypes";
import AddCurrentAccount from "./components/pages/financials/AddCurrentAccount";
import CurrentAccountsList from "./components/pages/financials/CurrentAccountsList";
import AddReceivableAccount from "./components/pages/financials/AddReceivableAccount";
import ReceivableAccountsList from "./components/pages/financials/ReceivableAccountsList";
import AddPayableAccount from "./components/pages/financials/AddPayableAccount";
import PayableAccountsList from "./components/pages/financials/PayableAccountsList";
import Safes from "./components/pages/financials/Safes";
import Banks from "./components/pages/financials/Banks";
import ItemMovementReport from "./components/pages/reports/items/ItemMovementReport";
import ItemBalanceReport from "./components/pages/reports/items/ItemBalanceReport";
import InventoryValuationReport from "./components/pages/reports/items/InventoryValuationReport";
import CustomerStatementReport from "./components/pages/reports/customers/CustomerStatementReport";
import CustomerBalanceReport from "./components/pages/reports/customers/CustomerBalanceReport";
import SupplierStatementReport from "./components/pages/reports/suppliers/SupplierStatementReport";
import SupplierBalanceReport from "./components/pages/reports/suppliers/SupplierBalanceReport";
import DailyCollectionsReport from "./components/pages/reports/financials/DailyCollectionsReport";
import DailyPaymentsReport from "./components/pages/reports/financials/DailyPaymentsReport";
import DailyTransfersReport from "./components/pages/reports/financials/DailyTransfersReport";
import ExpenseStatementReport from "./components/pages/reports/financials/ExpenseStatementReport";
import TotalExpensesReport from "./components/pages/reports/financials/TotalExpensesReport";
import CurrentAccountStatementReport from "./components/pages/reports/financials/CurrentAccountStatementReport";
import TotalCurrentAccountsReport from "./components/pages/reports/financials/TotalCurrentAccountsReport";
import ReceivableAccountStatementReport from "./components/pages/reports/financials/ReceivableAccountStatementReport";
import TotalReceivableAccountsReport from "./components/pages/reports/financials/TotalReceivableAccountsReport";
import PayableAccountStatementReport from "./components/pages/reports/financials/PayableAccountStatementReport";
import TotalPayableAccountsReport from "./components/pages/reports/financials/TotalPayableAccountsReport";
import SafeStatementReport from "./components/pages/reports/financials/SafeStatementReport";
import BankStatementReport from "./components/pages/reports/financials/BankStatementReport";
import TaxDeclarationReport from "./components/pages/reports/financials/TaxDeclarationReport";
import VATStatementReport from "./components/pages/reports/financials/VATStatementReport";
import IncomeStatement from "./components/pages/final_accounts/IncomeStatement";
import BalanceSheet from "./components/pages/final_accounts/BalanceSheet";

import {
  initialBranches,
  initialStores,
  initialItemGroups,
  initialUnits,
  initialItems,
  initialCustomers,
  initialSuppliers,
  initialExpenseCodes,
  initialExpenses,
  initialExpenseTypes,
  initialCurrentAccounts,
  initialSafes,
  initialBanks,
  initialSalesInvoices,
  initialSalesReturns,
  initialPurchaseInvoices,
  initialPurchaseReturns,
  initialReceiptVouchers,
  initialPaymentVouchers,
  initialStoreReceiptVouchers,
  initialStoreIssueVouchers,
  initialStoreTransferVouchers,
} from "./data";
// FIX: Aliased StoreIssueVoucher type to avoid name collision with component.
import type {
  Branch,
  CompanyInfo,
  Store,
  User,
  ItemGroup,
  Unit,
  Item,
  Customer,
  Supplier,
  ExpenseCode,
  Expense,
  ExpenseType,
  CurrentAccount,
  Safe,
  Bank,
  Invoice,
  Voucher,
  StoreReceiptVoucher as StoreReceiptVoucherType,
  StoreIssueVoucher as StoreIssueVoucherType,
  StoreTransferVoucher,
  Notification,
} from "./types";
import { ToastProvider, useToast } from "./components/common/ToastProvider";
import { ModalProvider } from "./components/common/ModalProvider";
import Toast from "./components/common/Toast";
import { getLabelByPath } from "./routes/routeConfig";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { getPermissionSet } from "./utils/permissions";

// Simplified role-based permissions
const rolePermissions: Record<string, string[]> = {
  مدير: ["all"], // Manager has all permissions
  محاسب: [
    "dashboard",
    "sales",
    "purchases",
    "customers",
    "suppliers",
    "financials",
    "reports",
    "final_accounts",
    "items",
    "add_item",
    "items_list",
    "item_groups",
    "units",
  ],
  بائع: [
    "dashboard",
    "sales_invoice",
    "sales_return",
    "daily_sales",
    "add_customer",
    "customers_list",
  ],
  "مدخل بيانات": [
    "dashboard",
    "items",
    "warehouse_operations",
    "add_item",
    "items_list",
    "item_groups",
    "units",
    "store_receipt_voucher",
    "store_issue_voucher",
    "store_transfer",
  ],
};

// Wrapper component to handle URL-based editing for AddCustomer
const AddCustomerWrapper = ({
  title,
  companyInfo,
}: {
  title: string;
  companyInfo: CompanyInfo;
}) => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  return (
    <AddCustomer
      title={title}
      editingId={id || null}
      onNavigate={(key, label, editingId) => {
        if (key === "add_customer") {
          navigate(
            editingId ? `/customers/add/${editingId}` : "/customers/add",
          );
        } else if (key === "customers_list") {
          navigate("/customers/list");
        }
      }}
    />
  );
};

// Wrapper component to handle URL-based editing for AddSupplier
const AddSupplierWrapper = ({
  title,
  companyInfo,
}: {
  title: string;
  companyInfo: CompanyInfo;
}) => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  return (
    <AddSupplier
      title={title}
      editingId={id || null}
      onNavigate={(key, label, editingId) => {
        if (key === "add_supplier") {
          navigate(
            editingId ? `/suppliers/add/${editingId}` : "/suppliers/add",
          );
        } else if (key === "suppliers_list") {
          navigate("/suppliers/list");
        }
      }}
    />
  );
};

// Wrapper component to handle URL-based editing for AddCurrentAccount
const AddCurrentAccountWrapper = ({
  title,
  onNavigate,
}: {
  title: string;
  onNavigate: (key: string, label: string, id?: string | null) => void;
}) => {
  const { id } = useParams<{ id?: string }>();

  return (
    <AddCurrentAccount
      title={title}
      editingId={id || null}
      onNavigate={onNavigate}
    />
  );
};

// Wrapper component to handle URL-based viewing for SalesInvoice
const SalesInvoiceWrapper = ({
  title,
  currentUser,
}: {
  title: string;
  currentUser: User | null;
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const invoiceId = searchParams.get("invoiceId");
  const [viewingId, setViewingId] = useState<string | number | null>(null);

  useEffect(() => {
    if (invoiceId) {
      // Convert to number if it's a numeric string, otherwise keep as string
      const id = isNaN(Number(invoiceId)) ? invoiceId : Number(invoiceId);
      setViewingId(id);
      // Remove the query param after setting viewingId
      searchParams.delete("invoiceId");
      setSearchParams(searchParams, { replace: true });
    }
  }, [invoiceId, searchParams, setSearchParams]);

  const handleClearViewingId = () => {
    setViewingId(null);
  };

  return (
    <SalesInvoice
      title={title}
      currentUser={currentUser}
      viewingId={viewingId}
      onClearViewingId={handleClearViewingId}
    />
  );
};

// Wrapper component to handle URL-based viewing for SalesReturn
const SalesReturnWrapper = ({
  title,
  currentUser,
}: {
  title: string;
  currentUser: User | null;
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const returnId = searchParams.get("returnId");
  const [viewingId, setViewingId] = useState<string | number | null>(null);

  useEffect(() => {
    if (returnId) {
      // Convert to number if it's a numeric string, otherwise keep as string
      const id = isNaN(Number(returnId)) ? returnId : Number(returnId);
      setViewingId(id);
      // Remove the query param after setting viewingId
      searchParams.delete("returnId");
      setSearchParams(searchParams, { replace: true });
    }
  }, [returnId, searchParams, setSearchParams]);

  const handleClearViewingId = () => {
    setViewingId(null);
  };

  return (
    <SalesReturn
      title={title}
      currentUser={currentUser}
      viewingId={viewingId}
      onClearViewingId={handleClearViewingId}
    />
  );
};

// Wrapper component to handle URL-based viewing for PurchaseInvoice
const PurchaseInvoiceWrapper = ({
  title,
  currentUser,
}: {
  title: string;
  currentUser: User | null;
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const invoiceId = searchParams.get("invoiceId");
  const [viewingId, setViewingId] = useState<string | number | null>(null);

  useEffect(() => {
    if (invoiceId) {
      // Convert to number if it's a numeric string, otherwise keep as string
      const id = isNaN(Number(invoiceId)) ? invoiceId : Number(invoiceId);
      setViewingId(id);
      // Remove the query param after setting viewingId
      searchParams.delete("invoiceId");
      setSearchParams(searchParams, { replace: true });
    }
  }, [invoiceId, searchParams, setSearchParams]);

  const handleClearViewingId = () => {
    setViewingId(null);
  };

  return (
    <PurchaseInvoice
      title={title}
      currentUser={currentUser}
      viewingId={viewingId}
      onClearViewingId={handleClearViewingId}
    />
  );
};

// Wrapper component to handle URL-based viewing for PurchaseReturn
const PurchaseReturnWrapper = ({
  title,
  currentUser,
}: {
  title: string;
  currentUser: User | null;
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const returnId = searchParams.get("returnId");
  const [viewingId, setViewingId] = useState<string | number | null>(null);

  useEffect(() => {
    if (returnId) {
      // Convert to number if it's a numeric string, otherwise keep as string
      const id = isNaN(Number(returnId)) ? returnId : Number(returnId);
      setViewingId(id);
      // Remove the query param after setting viewingId
      searchParams.delete("returnId");
      setSearchParams(searchParams, { replace: true });
    }
  }, [returnId, searchParams, setSearchParams]);

  const handleClearViewingId = () => {
    setViewingId(null);
  };

  return (
    <PurchaseReturn
      title={title}
      currentUser={currentUser}
      viewingId={viewingId}
      onClearViewingId={handleClearViewingId}
    />
  );
};

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPageTitle = getLabelByPath(location.pathname);

  // Redux state
  const dispatch = useAppDispatch();
  const { Token, User, isAuthed } = useAuth();
  const isLoggedIn = isAuthed;
  const currentUser = User;
  const [sendLogOut] = useSendLogOutMutation();

  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const { showToast } = useToast();

  // Compute user permissions from Redux store (persistent)
  const userPermissions = useMemo(() => {
    if (currentUser?.role?.permissions) {
      const permissions = currentUser.role.permissions;
      const permissionSet = getPermissionSet(permissions);
      // Convert to array of permission strings for backward compatibility with filterByPermissions
      return Array.from(permissionSet);
    }
    return ["all"]; // Default permissions for testing
  }, [currentUser]);

  // App state
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: "StockPro Inc.",
    activity: "Trading",
    address: "123 Business Bay, Riyadh",
    phone: "920000000",
    taxNumber: "300123456700003",
    commercialReg: "1010123456",
    currency: "SAR",
    logo: null,
    capital: 150000,
    vatRate: 15,
    isVatEnabled: true,
  });
  const [vatRate, setVatRate] = useState(15);
  const [isVatEnabled, setIsVatEnabled] = useState(true);
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [stores, setStores] = useState<Store[]>(initialStores);
  const [itemGroups, setItemGroups] = useState<ItemGroup[]>(initialItemGroups);
  const [units, setUnits] = useState<Unit[]>(initialUnits);
  const [items, setItems] = useState<Item[]>(initialItems);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [expenseCodes, setExpenseCodes] =
    useState<ExpenseCode[]>(initialExpenseCodes);
  const [expenseTypes, setExpenseTypes] =
    useState<ExpenseType[]>(initialExpenseTypes);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [currentAccounts, setCurrentAccounts] = useState<CurrentAccount[]>(
    initialCurrentAccounts,
  );
  const [safes, setSafes] = useState<Safe[]>(initialSafes);
  const [banks, setBanks] = useState<Bank[]>(initialBanks);
  const [salesInvoices, setSalesInvoices] =
    useState<Invoice[]>(initialSalesInvoices);
  const [salesReturns, setSalesReturns] =
    useState<Invoice[]>(initialSalesReturns);
  const [purchaseInvoices, setPurchaseInvoices] = useState<Invoice[]>(
    initialPurchaseInvoices,
  );
  const [purchaseReturns, setPurchaseReturns] = useState<Invoice[]>(
    initialPurchaseReturns,
  );
  const [receiptVouchers, setReceiptVouchers] = useState<Voucher[]>(
    initialReceiptVouchers,
  );
  const [paymentVouchers, setPaymentVouchers] = useState<Voucher[]>(
    initialPaymentVouchers,
  );
  const [storeReceiptVouchers, setStoreReceiptVouchers] = useState<
    StoreReceiptVoucherType[]
  >(initialStoreReceiptVouchers);
  // FIX: Used aliased StoreIssueVoucherType to resolve name collision.
  const [storeIssueVouchers, setStoreIssueVouchers] = useState<
    StoreIssueVoucherType[]
  >(initialStoreIssueVouchers);
  const [storeTransferVouchers, setStoreTransferVouchers] = useState<
    StoreTransferVoucher[]
  >(initialStoreTransferVouchers);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const itemBalances = useMemo(() => {
    const balances = new Map<string, number>();
    items.forEach((item) => {
      let balance = item.stock;

      const processItems = (txList: any[], factor: number) => {
        txList.forEach((tx: any) => {
          (tx.items || []).forEach((i: { id: string; qty: number }) => {
            if (i.id === item.code) balance += i.qty * factor;
          });
        });
      };

      processItems(purchaseInvoices, 1);
      processItems(salesReturns, 1);
      processItems(storeReceiptVouchers, 1);
      processItems(salesInvoices, -1);
      processItems(purchaseReturns, -1);
      processItems(storeIssueVouchers, -1);

      storeTransferVouchers.forEach((v) => {
        v.items.forEach((i) => {
          if (i.id === item.code) {
            // Transfers are neutral for total stock balance
          }
        });
      });

      balances.set(item.code, balance);
    });
    return balances;
  }, [
    items,
    purchaseInvoices,
    salesReturns,
    storeReceiptVouchers,
    salesInvoices,
    purchaseReturns,
    storeIssueVouchers,
    storeTransferVouchers,
  ]);

  const itemsWithLiveStock = useMemo(
    () => items.map((i) => ({ ...i, stock: itemBalances.get(i.code) ?? 0 })),
    [items, itemBalances],
  );

  useEffect(() => {
    const newNotifications: Notification[] = [];
    const now = new Date();

    // 1. Check for low stock
    itemsWithLiveStock.forEach((item) => {
      if (item.stock <= item.reorderLimit) {
        newNotifications.push({
          id: `stock-${item.id}`,
          type: "stock",
          message: `المخزون منخفض للصنف "${item.name}". الرصيد الحالي: ${item.stock}`,
          date: now.toISOString(),
          relatedId: item.id,
        });
      }
    });

    // 2. Check for overdue invoices
    const checkOverdue = (invoice: Invoice, type: "sales" | "purchase") => {
      if (invoice.paymentMethod === "credit" && invoice.paymentTerms) {
        const dueDate = new Date(invoice.date);
        dueDate.setDate(dueDate.getDate() + invoice.paymentTerms);
        if (dueDate < now) {
          const message =
            type === "sales"
              ? `فاتورة المبيعات #${invoice.id} للعميل "${invoice.customerOrSupplier?.name}" مستحقة.`
              : `فاتورة المشتريات #${invoice.id} من المورد "${invoice.customerOrSupplier?.name}" مستحقة.`;
          newNotifications.push({
            id: `invoice-${type}-${invoice.id}`,
            type: "invoice",
            message: message,
            date: now.toISOString(),
            relatedId: invoice.id,
          });
        }
      }
    };

    salesInvoices.forEach((inv) => checkOverdue(inv, "sales"));
    purchaseInvoices.forEach((inv) => checkOverdue(inv, "purchase"));

    setNotifications(newNotifications);
  }, [itemsWithLiveStock, salesInvoices, purchaseInvoices]);

  const handleLogin = async (
    email: string,
    password: string,
    userData?: any,
  ) => {
    // RTK Query handles the login automatically in the Login component
    // This function is called after successful login to set up local state
    const userName =
      userData?.name ||
      userData?.firstName ||
      currentUser?.name ||
      currentUser?.firstName ||
      email ||
      "مستخدم";
    showToast(`مرحباً بك، ${userName}`);
  };

  const handleLogout = async () => {
    try {
      await sendLogOut(undefined).unwrap();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const [downloadBackup] = useLazyDownloadBackupQuery();

  const handleBackup = useCallback(async () => {
    try {
      const { data: blob } = await downloadBackup();

      if (!blob) {
        showToast("فشل إنشاء النسخة الاحتياطية. يرجى المحاولة مرة أخرى.");
        return;
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Generate filename with timestamp
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19);
      a.download = `stockpro_backup_${timestamp}.sql`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast("تم إنشاء نسخة احتياطية بنجاح.");
    } catch (error) {
      console.error("Backup error:", error);
      showToast("فشل إنشاء النسخة الاحتياطية. يرجى المحاولة مرة أخرى.");
    }
  }, [downloadBackup, showToast]);

  const handleAddExpense = (expense: Omit<Expense, "id" | "code">) => {
    const nextCodeNumber =
      expenses.length > 0
        ? Math.max(
            ...expenses.map((e) => parseInt(e.code.split("-")[1]) || 0),
          ) + 1
        : 1;
    const newCode = `MSR-${String(nextCodeNumber).padStart(3, "0")}`;
    setExpenses((prev) => [
      ...prev,
      { ...expense, id: Date.now(), code: newCode } as Expense,
    ]);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-brand-bg font-sans" dir="rtl">
      <Sidebar
        searchTerm={searchTerm}
        userPermissions={userPermissions}
        onDatabaseBackup={handleBackup}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          currentUser={currentUser}
          onLogout={handleLogout}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-brand-bg p-6">
          <Routes>
            {/* Login */}
            <Route path="/login" element={<Login onLogin={handleLogin} />} />

            {/* Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredPermission="dashboard-read">
                  <Dashboard title="الرئيسية" />
                </ProtectedRoute>
              }
            />

            {/* Settings */}
            <Route
              path="/settings/company-data"
              element={
                <ProtectedRoute requiredPermission="company_data-read">
                  <CompanyData title={currentPageTitle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/branches-data"
              element={
                <ProtectedRoute requiredPermission="branches_data-read">
                  <BranchesData title={currentPageTitle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/stores-data"
              element={
                <ProtectedRoute requiredPermission="stores_data-read">
                  <StoresData title={currentPageTitle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/users-data"
              element={
                <ProtectedRoute requiredPermission="users_data-read">
                  <UsersData title={currentPageTitle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/permissions"
              element={
                <ProtectedRoute requiredPermission="permissions-read">
                  <Permissions title={currentPageTitle} />
                </ProtectedRoute>
              }
            />

            {/* Items */}
            <Route
              path="/items/add"
              element={
                <ProtectedRoute requiredPermission="add_item-read">
                  <AddItem title={currentPageTitle} editingId={null} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/items/add/:id"
              element={
                <ProtectedRoute requiredPermission="add_item-read">
                  <AddItem title={currentPageTitle} editingId={null} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/items/list"
              element={
                <ProtectedRoute requiredPermission="items_list-read">
                  <ItemsList title={currentPageTitle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/items/groups"
              element={
                <ProtectedRoute requiredPermission="item_groups-read">
                  <ItemGroups title={currentPageTitle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/items/units"
              element={
                <ProtectedRoute requiredPermission="units-read">
                  <Units title={currentPageTitle} />
                </ProtectedRoute>
              }
            />

            {/* Warehouse Operations */}
            <Route
              path="/warehouse/receipt-voucher"
              element={
                <ProtectedRoute requiredPermission="store_receipt_voucher-read">
                  <StoreReceiptVoucher title={currentPageTitle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/warehouse/issue-voucher"
              element={
                <ProtectedRoute requiredPermission="store_issue_voucher-read">
                  <StoreIssueVoucher title={currentPageTitle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/warehouse/transfer"
              element={
                <ProtectedRoute requiredPermission="store_transfer-read">
                  <StoreTransfer title={currentPageTitle} />
                </ProtectedRoute>
              }
            />

            {/* Sales */}
            <Route
              path="/sales/invoice"
              element={
                <ProtectedRoute requiredPermission="sales_invoice-read">
                  <SalesInvoiceWrapper
                    title={currentPageTitle}
                    currentUser={currentUser}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales/return"
              element={
                <ProtectedRoute requiredPermission="sales_return-read">
                  <SalesReturnWrapper
                    title={currentPageTitle}
                    currentUser={currentUser}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales/daily"
              element={
                <ProtectedRoute requiredPermission="daily_sales-read">
                  <DailySales title={currentPageTitle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales/daily-returns"
              element={
                <ProtectedRoute requiredPermission="daily_sales_returns-read">
                  <DailySalesReturns title={currentPageTitle} />
                </ProtectedRoute>
              }
            />

            {/* Purchases */}
            <Route
              path="/purchases/invoice"
              element={
                <ProtectedRoute requiredPermission="purchase_invoice-read">
                  <PurchaseInvoiceWrapper
                    title={currentPageTitle}
                    currentUser={currentUser}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchases/return"
              element={
                <ProtectedRoute requiredPermission="purchase_return-read">
                  <PurchaseReturnWrapper
                    title={currentPageTitle}
                    currentUser={currentUser}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchases/daily"
              element={
                <ProtectedRoute requiredPermission="daily_purchases-read">
                  <DailyPurchases title={currentPageTitle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchases/daily-returns"
              element={
                <ProtectedRoute requiredPermission="daily_purchase_returns-read">
                  <DailyPurchaseReturns title={currentPageTitle} />
                </ProtectedRoute>
              }
            />

            {/* Customers */}
            <Route
              path="/customers/add/:id?"
              element={
                <ProtectedRoute requiredPermission="add_customer-read">
                  <AddCustomerWrapper
                    title={currentPageTitle}
                    companyInfo={companyInfo}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers/list"
              element={
                <ProtectedRoute requiredPermission="customers_list-read">
                  <CustomersList
                    title={currentPageTitle}
                    onNavigate={(key, label, id) => {
                      if (key === "add_customer") {
                        navigate(
                          id ? `/customers/add/${id}` : "/customers/add",
                        );
                      } else if (key === "customers_list") {
                        navigate("/customers/list");
                      }
                    }}
                    companyInfo={companyInfo}
                  />
                </ProtectedRoute>
              }
            />

            {/* Suppliers */}
            <Route
              path="/suppliers/add/:id?"
              element={
                <ProtectedRoute requiredPermission="add_supplier-read">
                  <AddSupplierWrapper
                    title={currentPageTitle}
                    companyInfo={companyInfo}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/suppliers/list"
              element={
                <ProtectedRoute requiredPermission="suppliers_list-read">
                  <SuppliersList
                    title={currentPageTitle}
                    onNavigate={(key, label, id) => {
                      if (key === "add_supplier") {
                        navigate(
                          id ? `/suppliers/add/${id}` : "/suppliers/add",
                        );
                      } else if (key === "suppliers_list") {
                        navigate("/suppliers/list");
                      }
                    }}
                    companyInfo={companyInfo}
                  />
                </ProtectedRoute>
              }
            />

            {/* Financials */}
            <Route
              path="/financials/receipt-voucher"
              element={
                <ProtectedRoute requiredPermission="receipt_voucher-read">
                  <ReceiptVoucher title={currentPageTitle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/financials/payment-voucher"
              element={
                <ProtectedRoute requiredPermission="payment_voucher-read">
                  <PaymentVoucher title={currentPageTitle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/financials/internal-transfers"
              element={
                <ProtectedRoute requiredPermission="internal_transfers-read">
                  <InternalTransfers title={currentPageTitle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/financials/expenses/list"
              element={
                <ProtectedRoute requiredPermission="expenses_list-read">
                  <ExpensesList title={currentPageTitle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/financials/expenses-list"
              element={
                <ProtectedRoute requiredPermission="expenses_list-read">
                  <ExpensesList title={currentPageTitle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/financials/expenses/codes"
              element={
                <ProtectedRoute requiredPermission="expense_codes-read">
                  <ExpenseCodes title={currentPageTitle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/financials/expense-codes"
              element={
                <ProtectedRoute requiredPermission="expense_codes-read">
                  <ExpenseCodes title={currentPageTitle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/financials/expenses/types"
              element={
                <ProtectedRoute requiredPermission="expense_types-read">
                  <ExpenseTypes title={currentPageTitle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/financials/expense-types"
              element={
                <ProtectedRoute requiredPermission="expense_types-read">
                  <ExpenseTypes title={currentPageTitle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/financials/current-accounts/add"
              element={
                <ProtectedRoute requiredPermission="add_current_account-read">
                  <AddCurrentAccount
                    title={currentPageTitle}
                    editingId={null}
                    onNavigate={(key, label, id) => {
                      if (key === "current_accounts_list") {
                        navigate("/financials/current-accounts/list");
                      } else if (key === "add_current_account" && id) {
                        navigate(`/financials/current-accounts/add/${id}`);
                      }
                    }}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/financials/current-accounts/add/:id"
              element={
                <ProtectedRoute requiredPermission="add_current_account-read">
                  <AddCurrentAccountWrapper
                    title={currentPageTitle}
                    onNavigate={(key, label, newId) => {
                      if (key === "current_accounts_list") {
                        navigate("/financials/current-accounts/list");
                      } else if (key === "add_current_account" && newId) {
                        navigate(`/financials/current-accounts/add/${newId}`);
                      }
                    }}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/financials/add-current-account"
              element={
                <ProtectedRoute requiredPermission="add_current_account-read">
                  <AddCurrentAccount
                    title={currentPageTitle}
                    editingId={null}
                    onNavigate={(key, label, id) => {
                      if (key === "current_accounts_list") {
                        navigate("/financials/current-accounts/list");
                      } else if (key === "add_current_account" && id) {
                        navigate(`/financials/current-accounts/add/${id}`);
                      }
                    }}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/financials/current-accounts/list"
              element={
                <ProtectedRoute requiredPermission="current_accounts_list-read">
                  <CurrentAccountsList title={currentPageTitle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/financials/receivable-accounts/add"
              element={
                <ProtectedRoute requiredPermission="add_receivable_account-read">
                  <AddReceivableAccount title={currentPageTitle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/financials/receivable-accounts/add/:id"
              element={
                <ProtectedRoute requiredPermission="add_receivable_account-read">
                  <AddReceivableAccount title={currentPageTitle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/financials/receivable-accounts/list"
              element={
                <ProtectedRoute requiredPermission="receivable_accounts_list-read">
                  <ReceivableAccountsList title={currentPageTitle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/financials/payable-accounts/add"
              element={
                <ProtectedRoute requiredPermission="add_payable_account-read">
                  <AddPayableAccount title={currentPageTitle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/financials/payable-accounts/add/:id"
              element={
                <ProtectedRoute requiredPermission="add_payable_account-read">
                  <AddPayableAccount title={currentPageTitle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/financials/payable-accounts/list"
              element={
                <ProtectedRoute requiredPermission="payable_accounts_list-read">
                  <PayableAccountsList title={currentPageTitle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/financials/safes"
              element={
                <ProtectedRoute requiredPermission="safes-read">
                  <Safes title={currentPageTitle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/financials/banks"
              element={
                <ProtectedRoute requiredPermission="banks-read">
                  <Banks title={currentPageTitle} />
                </ProtectedRoute>
              }
            />

            {/* Reports */}
            <Route
              path="/reports/items/movement"
              element={
                <ProtectedRoute requiredPermission="item_movement_report-read">
                  <ItemMovementReport
                    title={currentPageTitle}
                    companyInfo={companyInfo}
                    onNavigate={(key, label, id) => {
                      if (key === "store_issue_voucher" && id) {
                        navigate(`/warehouse/issue-voucher?voucherId=${id}`);
                      } else if (key === "store_receipt_voucher" && id) {
                        navigate(`/warehouse/receipt-voucher?voucherId=${id}`);
                      } else if (key === "store_transfer" && id) {
                        navigate(`/warehouse/transfer?voucherId=${id}`);
                      } else if (key === "sales_invoice" && id) {
                        navigate(`/sales/invoice?invoiceId=${id}`);
                      } else if (key === "sales_return" && id) {
                        navigate(`/sales/return?returnId=${id}`);
                      } else if (key === "purchase_invoice" && id) {
                        navigate(`/purchases/invoice?invoiceId=${id}`);
                      } else if (key === "purchase_return" && id) {
                        navigate(`/purchases/return?returnId=${id}`);
                      }
                    }}
                    currentUser={currentUser}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/items/balance"
              element={
                <ProtectedRoute requiredPermission="item_balance_report-read">
                  <ItemBalanceReport
                    title={currentPageTitle}
                    companyInfo={companyInfo}
                    currentUser={currentUser}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/items/valuation"
              element={
                <ProtectedRoute requiredPermission="inventory_valuation_report-read">
                  <InventoryValuationReport
                    title={currentPageTitle}
                    companyInfo={companyInfo}
                    currentUser={currentUser}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/items/inventory-valuation"
              element={
                <ProtectedRoute requiredPermission="inventory_valuation_report-read">
                  <InventoryValuationReport
                    title={currentPageTitle}
                    companyInfo={companyInfo}
                    currentUser={currentUser}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/customers/statement"
              element={
                <ProtectedRoute requiredPermission="customer_statement_report-read">
                  <CustomerStatementReport
                    title={currentPageTitle}
                    companyInfo={companyInfo}
                    onNavigate={(key, label, id) => {
                      if (key === "sales_invoice" && id) {
                        navigate(`/sales/invoice?invoiceId=${id}`);
                      } else if (key === "sales_return" && id) {
                        navigate(`/sales/return?returnId=${id}`);
                      } else if (key === "receipt_voucher" && id) {
                        navigate(`/financials/receipt-voucher?voucherId=${id}`);
                      } else if (key === "payment_voucher" && id) {
                        navigate(`/financials/payment-voucher?voucherId=${id}`);
                      }
                    }}
                    currentUser={currentUser}
                    receiptVouchers={receiptVouchers}
                    paymentVouchers={paymentVouchers}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/customers/balance"
              element={
                <ProtectedRoute requiredPermission="customer_balance_report-read">
                  <CustomerBalanceReport
                    title={currentPageTitle}
                    companyInfo={companyInfo}
                    receiptVouchers={receiptVouchers}
                    paymentVouchers={paymentVouchers}
                    currentUser={currentUser}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/suppliers/statement"
              element={
                <ProtectedRoute requiredPermission="supplier_statement_report-read">
                  <SupplierStatementReport
                    title={currentPageTitle}
                    companyInfo={companyInfo}
                    onNavigate={(key, label, id) => {
                      if (key === "purchase_invoice" && id) {
                        navigate(`/purchases/invoice?invoiceId=${id}`);
                      } else if (key === "purchase_return" && id) {
                        navigate(`/purchases/return?returnId=${id}`);
                      } else if (key === "receipt_voucher" && id) {
                        navigate(`/financials/receipt-voucher?voucherId=${id}`);
                      } else if (key === "payment_voucher" && id) {
                        navigate(`/financials/payment-voucher?voucherId=${id}`);
                      }
                    }}
                    currentUser={currentUser}
                    receiptVouchers={receiptVouchers}
                    paymentVouchers={paymentVouchers}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/suppliers/balance"
              element={
                <ProtectedRoute requiredPermission="supplier_balance_report-read">
                  <SupplierBalanceReport
                    title={currentPageTitle}
                    companyInfo={companyInfo}
                    receiptVouchers={receiptVouchers}
                    paymentVouchers={paymentVouchers}
                    currentUser={currentUser}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/financials/daily-collections"
              element={
                <ProtectedRoute requiredPermission="daily_collections_report-read">
                  <DailyCollectionsReport
                    title={currentPageTitle}
                    companyInfo={companyInfo}
                    currentUser={currentUser}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/financials/daily-payments"
              element={
                <ProtectedRoute requiredPermission="daily_payments_report-read">
                  <DailyPaymentsReport
                    title={currentPageTitle}
                    companyInfo={companyInfo}
                    currentUser={currentUser}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/financials/daily-transfers"
              element={
                <ProtectedRoute requiredPermission="daily_transfers_report-read">
                  <DailyTransfersReport
                    title={currentPageTitle}
                    companyInfo={companyInfo}
                    currentUser={currentUser}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/financials/expense-statement"
              element={
                <ProtectedRoute requiredPermission="expense_statement_report-read">
                  <ExpenseStatementReport
                    title={currentPageTitle}
                    companyInfo={companyInfo}
                    currentUser={currentUser}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/financials/total-expenses"
              element={
                <ProtectedRoute requiredPermission="total_expenses_report-read">
                  <TotalExpensesReport
                    title={currentPageTitle}
                    companyInfo={companyInfo}
                    currentUser={currentUser}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/financials/current-account-statement"
              element={
                <ProtectedRoute requiredPermission="current_account_statement_report-read">
                  <CurrentAccountStatementReport
                    title={currentPageTitle}
                    companyInfo={companyInfo}
                    receiptVouchers={receiptVouchers}
                    paymentVouchers={paymentVouchers}
                    currentUser={currentUser}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/financials/total-current-accounts"
              element={
                <ProtectedRoute requiredPermission="total_current_accounts_report-read">
                  <TotalCurrentAccountsReport
                    title={currentPageTitle}
                    companyInfo={companyInfo}
                    currentUser={currentUser}
                    receiptVouchers={receiptVouchers}
                    paymentVouchers={paymentVouchers}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/financials/receivable-account-statement"
              element={
                <ProtectedRoute requiredPermission="receivable_account_statement_report-read">
                  <ReceivableAccountStatementReport
                    title={currentPageTitle}
                    companyInfo={companyInfo}
                    receiptVouchers={receiptVouchers}
                    paymentVouchers={paymentVouchers}
                    currentUser={currentUser}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/financials/total-receivable-accounts"
              element={
                <ProtectedRoute requiredPermission="total_receivable_accounts_report-read">
                  <TotalReceivableAccountsReport
                    title={currentPageTitle}
                    companyInfo={companyInfo}
                    currentUser={currentUser}
                    receiptVouchers={receiptVouchers}
                    paymentVouchers={paymentVouchers}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/financials/payable-account-statement"
              element={
                <ProtectedRoute requiredPermission="payable_account_statement_report-read">
                  <PayableAccountStatementReport
                    title={currentPageTitle}
                    companyInfo={companyInfo}
                    receiptVouchers={receiptVouchers}
                    paymentVouchers={paymentVouchers}
                    currentUser={currentUser}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/financials/total-payable-accounts"
              element={
                <ProtectedRoute requiredPermission="total_payable_accounts_report-read">
                  <TotalPayableAccountsReport
                    title={currentPageTitle}
                    companyInfo={companyInfo}
                    currentUser={currentUser}
                    receiptVouchers={receiptVouchers}
                    paymentVouchers={paymentVouchers}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/financials/safe-statement"
              element={
                <ProtectedRoute requiredPermission="safe_statement_report-read">
                  <SafeStatementReport
                    title={currentPageTitle}
                    companyInfo={companyInfo}
                    receiptVouchers={receiptVouchers}
                    paymentVouchers={paymentVouchers}
                    currentUser={currentUser}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/financials/bank-statement"
              element={
                <ProtectedRoute requiredPermission="bank_statement_report-read">
                  <BankStatementReport
                    title={currentPageTitle}
                    companyInfo={companyInfo}
                    receiptVouchers={receiptVouchers}
                    paymentVouchers={paymentVouchers}
                    currentUser={currentUser}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/financials/tax-declaration"
              element={
                <ProtectedRoute requiredPermission="tax_declaration_report-read">
                  <TaxDeclarationReport
                    title={currentPageTitle}
                    companyInfo={companyInfo}
                    currentUser={currentUser}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/financials/vat-statement"
              element={
                <ProtectedRoute requiredPermission="vat_statement_report-read">
                  <VATStatementReport
                    title={currentPageTitle}
                    companyInfo={companyInfo}
                    currentUser={currentUser}
                  />
                </ProtectedRoute>
              }
            />

            {/* Final Accounts */}
            <Route
              path="/final-accounts/income-statement"
              element={
                <ProtectedRoute requiredPermission="income_statement-read">
                  <IncomeStatement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/final-accounts/balance-sheet"
              element={
                <ProtectedRoute requiredPermission="balance_sheet-read">
                  <BalanceSheet />
                </ProtectedRoute>
              }
            />

            {/* Root and catch-all */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const AppWrapper = () => (
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <BrowserRouter>
        <TitleProvider>
          <ToastProvider>
            <ModalProvider>
              <AppContent />
            </ModalProvider>
            <Toast />
          </ToastProvider>
        </TitleProvider>
      </BrowserRouter>
    </PersistGate>
  </Provider>
);

export default AppWrapper;
