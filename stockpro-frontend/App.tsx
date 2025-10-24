import { useState, useCallback, useMemo, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './components/store/store';
import { useAppDispatch } from './components/store/hooks';
import { useAuth } from './components/hook/Auth';
import { useSendLogOutMutation } from './components/store/slices/auth/authApi';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './components/pages/Dashboard';
import Placeholder from './components/pages/Placeholder';
import Login from './components/pages/Login';
import CompanyData from './components/pages/settings/CompanyData';
import BranchesData from './components/pages/settings/BranchesData';
import StoresData from './components/pages/settings/StoresData';
import UsersData from './components/pages/settings/UsersData';
import Permissions from './components/pages/settings/Permissions';
import AddItem from './components/pages/items/AddItem';
import ItemsList from './components/pages/items/ItemsList';
import ItemGroups from './components/pages/items/ItemGroups';
import Units from './components/pages/items/Units';
import StoreReceiptVoucher from './components/pages/warehouse/StoreReceiptVoucher';
import StoreIssueVoucher from './components/pages/warehouse/StoreIssueVoucher';
import StoreTransfer from './components/pages/warehouse/StoreTransfer';
import SalesInvoice from './components/pages/sales/SalesInvoice';
import SalesReturn from './components/pages/sales/SalesReturn';
import DailySales from './components/pages/sales/DailySales';
import DailySalesReturns from './components/pages/sales/DailySalesReturns';
import PurchaseInvoice from './components/pages/purchases/PurchaseInvoice';
import PurchaseReturn from './components/pages/purchases/PurchaseReturn';
import DailyPurchases from './components/pages/purchases/DailyPurchases';
import DailyPurchaseReturns from './components/pages/purchases/DailyPurchaseReturns';
import AddCustomer from './components/pages/customers/AddCustomer';
import CustomersList from './components/pages/customers/CustomersList';
import AddSupplier from './components/pages/suppliers/AddSupplier';
import SuppliersList from './components/pages/suppliers/SuppliersList';
import ReceiptVoucher from './components/pages/financials/ReceiptVoucher';
import PaymentVoucher from './components/pages/financials/PaymentVoucher';
import ExpensesList from './components/pages/financials/ExpensesList';
import ExpenseCodes from './components/pages/financials/ExpenseCodes';
import ExpenseTypes from './components/pages/financials/ExpenseTypes';
import AddCurrentAccount from './components/pages/financials/AddCurrentAccount';
import CurrentAccountsList from './components/pages/financials/CurrentAccountsList';
import Safes from './components/pages/financials/Safes';
import Banks from './components/pages/financials/Banks';
import ItemMovementReport from './components/pages/reports/items/ItemMovementReport';
import ItemBalanceReport from './components/pages/reports/items/ItemBalanceReport';
import InventoryValuationReport from './components/pages/reports/items/InventoryValuationReport';
import CustomerStatementReport from './components/pages/reports/customers/CustomerStatementReport';
import CustomerBalanceReport from './components/pages/reports/customers/CustomerBalanceReport';
import SupplierStatementReport from './components/pages/reports/suppliers/SupplierStatementReport';
import SupplierBalanceReport from './components/pages/reports/suppliers/SupplierBalanceReport';
import DailyCollectionsReport from './components/pages/reports/financials/DailyCollectionsReport';
import DailyPaymentsReport from './components/pages/reports/financials/DailyPaymentsReport';
import ExpenseStatementReport from './components/pages/reports/financials/ExpenseStatementReport';
import TotalExpensesReport from './components/pages/reports/financials/TotalExpensesReport';
import CurrentAccountStatementReport from './components/pages/reports/financials/CurrentAccountStatementReport';
import TotalCurrentAccountsReport from './components/pages/reports/financials/TotalCurrentAccountsReport';
import SafeStatementReport from './components/pages/reports/financials/SafeStatementReport';
import BankStatementReport from './components/pages/reports/financials/BankStatementReport';
import TaxDeclarationReport from './components/pages/reports/financials/TaxDeclarationReport';
import IncomeStatement from './components/pages/final_accounts/IncomeStatement';
import BalanceSheet from './components/pages/final_accounts/BalanceSheet';

import { initialBranches, initialStores, initialItemGroups, initialUnits, initialItems, initialCustomers, initialSuppliers, initialExpenseCodes, initialExpenses, initialExpenseTypes, initialCurrentAccounts, initialSafes, initialBanks, initialSalesInvoices, initialSalesReturns, initialPurchaseInvoices, initialPurchaseReturns, initialReceiptVouchers, initialPaymentVouchers, initialStoreReceiptVouchers, initialStoreIssueVouchers, initialStoreTransferVouchers } from './data';
// FIX: Aliased StoreIssueVoucher type to avoid name collision with component.
import type { Branch, CompanyInfo, Store, User, ItemGroup, Unit, Item, Customer, Supplier, ExpenseCode, Expense, ExpenseType, CurrentAccount, Safe, Bank, Invoice, Voucher, StoreReceiptVoucher as StoreReceiptVoucherType, StoreIssueVoucher as StoreIssueVoucherType, StoreTransferVoucher, Notification } from './types';
import { ToastProvider, useToast } from './components/common/ToastProvider';
import { ModalProvider } from './components/common/ModalProvider';
import Toast from './components/common/Toast';
import ProtectedRoute from './components/common/ProtectedRoute';
import { routeConfig, getLabelByPath } from './routes/routeConfig';
import { getPermissionSet } from './utils/permissions';
import type { Permission } from './types';
import { useLocation } from 'react-router-dom';

// Simplified role-based permissions
const rolePermissions: Record<string, string[]> = {
    'مدير': ['all'], // Manager has all permissions
    'محاسب': [
        'dashboard',
        'sales', 'purchases', 'customers', 'suppliers', 'financials',
        'reports', 'final_accounts',
        'items', 'add_item', 'items_list', 'item_groups', 'units'
    ],
    'بائع': [
        'dashboard', 'sales_invoice', 'sales_return', 'daily_sales',
        'add_customer', 'customers_list'
    ],
    'مدخل بيانات': [
        'dashboard', 'items', 'warehouse_operations',
        'add_item', 'items_list', 'item_groups', 'units',
        'store_receipt_voucher', 'store_issue_voucher', 'store_transfer'
    ]
};


const AppContent = () => {
    const location = useLocation();
    const currentPageTitle = getLabelByPath(location.pathname);
    
    // Redux state
    const dispatch = useAppDispatch();
    const { Token, User, isAuthed } = useAuth();
    const isLoggedIn = isAuthed;
    const currentUser = User;
    const [sendLogOut] = useSendLogOutMutation();
    
    // Local state
    const [searchTerm, setSearchTerm] = useState('');
    const { showToast } = useToast();
    
    // Compute user permissions from Redux store (persistent)
    const userPermissions = useMemo(() => {
        if (currentUser?.role?.permissions) {
            const permissions: Permission[] = currentUser.role.permissions;
            const permissionSet = getPermissionSet(permissions);
            // Convert to array of permission strings for backward compatibility with filterByPermissions
            return Array.from(permissionSet);
        }
        return ['all']; // Default permissions for testing
    }, [currentUser]);

    // App state
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({ name: 'StockPro Inc.', activity: 'Trading', address: '123 Business Bay, Riyadh', phone: '920000000', taxNumber: '300123456700003', commercialReg: '1010123456', currency: 'SAR', logo: null, capital: 150000 });
    const [vatRate, setVatRate] = useState(15);
    const [isVatEnabled, setIsVatEnabled] = useState(true);
    const [branches, setBranches] = useState<Branch[]>(initialBranches);
    const [stores, setStores] = useState<Store[]>(initialStores);
    const [users, setUsers] = useState<User[]>([]);
    const [itemGroups, setItemGroups] = useState<ItemGroup[]>(initialItemGroups);
    const [units, setUnits] = useState<Unit[]>(initialUnits);
    const [items, setItems] = useState<Item[]>(initialItems);
    const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
    const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
    const [expenseCodes, setExpenseCodes] = useState<ExpenseCode[]>(initialExpenseCodes);
    const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>(initialExpenseTypes);
    const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
    const [currentAccounts, setCurrentAccounts] = useState<CurrentAccount[]>(initialCurrentAccounts);
    const [safes, setSafes] = useState<Safe[]>(initialSafes);
    const [banks, setBanks] = useState<Bank[]>(initialBanks);
    const [salesInvoices, setSalesInvoices] = useState<Invoice[]>(initialSalesInvoices);
    const [salesReturns, setSalesReturns] = useState<Invoice[]>(initialSalesReturns);
    const [purchaseInvoices, setPurchaseInvoices] = useState<Invoice[]>(initialPurchaseInvoices);
    const [purchaseReturns, setPurchaseReturns] = useState<Invoice[]>(initialPurchaseReturns);
    const [receiptVouchers, setReceiptVouchers] = useState<Voucher[]>(initialReceiptVouchers);
    const [paymentVouchers, setPaymentVouchers] = useState<Voucher[]>(initialPaymentVouchers);
    const [storeReceiptVouchers, setStoreReceiptVouchers] = useState<StoreReceiptVoucherType[]>(initialStoreReceiptVouchers);
    // FIX: Used aliased StoreIssueVoucherType to resolve name collision.
    const [storeIssueVouchers, setStoreIssueVouchers] = useState<StoreIssueVoucherType[]>(initialStoreIssueVouchers);
    const [storeTransferVouchers, setStoreTransferVouchers] = useState<StoreTransferVoucher[]>(initialStoreTransferVouchers);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const itemBalances = useMemo(() => {
        const balances = new Map<string, number>();
        items.forEach(item => {
            let balance = item.stock;
            
            const processItems = (txList: any[], factor: number) => {
                txList.forEach((tx: any) => {
                    (tx.items || []).forEach((i: { id: string; qty: number; }) => {
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

            storeTransferVouchers.forEach(v => {
                v.items.forEach(i => {
                    if (i.id === item.code) {
                        // Transfers are neutral for total stock balance
                    }
                });
            });

            balances.set(item.code, balance);
        });
        return balances;
    }, [items, purchaseInvoices, salesReturns, storeReceiptVouchers, salesInvoices, purchaseReturns, storeIssueVouchers, storeTransferVouchers]);

    const itemsWithLiveStock = useMemo(() => 
        items.map(i => ({...i, stock: itemBalances.get(i.code) ?? 0})), 
    [items, itemBalances]);

    useEffect(() => {
        const newNotifications: Notification[] = [];
        const now = new Date();

        // 1. Check for low stock
        itemsWithLiveStock.forEach(item => {
            if (item.stock <= item.reorderLimit) {
                newNotifications.push({
                    id: `stock-${item.id}`,
                    type: 'stock',
                    message: `المخزون منخفض للصنف "${item.name}". الرصيد الحالي: ${item.stock}`,
                    date: now.toISOString(),
                    relatedId: item.id
                });
            }
        });

        // 2. Check for overdue invoices
        const checkOverdue = (invoice: Invoice, type: 'sales' | 'purchase') => {
            if (invoice.paymentMethod === 'credit' && invoice.paymentTerms) {
                const dueDate = new Date(invoice.date);
                dueDate.setDate(dueDate.getDate() + invoice.paymentTerms);
                if (dueDate < now) {
                    const message = type === 'sales'
                        ? `فاتورة المبيعات #${invoice.id} للعميل "${invoice.customerOrSupplier?.name}" مستحقة.`
                        : `فاتورة المشتريات #${invoice.id} من المورد "${invoice.customerOrSupplier?.name}" مستحقة.`;
                    newNotifications.push({
                        id: `invoice-${type}-${invoice.id}`,
                        type: 'invoice',
                        message: message,
                        date: now.toISOString(),
                        relatedId: invoice.id
                    });
                }
            }
        };

        salesInvoices.forEach(inv => checkOverdue(inv, 'sales'));
        purchaseInvoices.forEach(inv => checkOverdue(inv, 'purchase'));

        setNotifications(newNotifications);
    }, [itemsWithLiveStock, salesInvoices, purchaseInvoices]);


    const handleLogin = async (email: string, password: string) => {
        // RTK Query handles the login automatically in the Login component
        // This function is called after successful login to set up local state
        showToast(`مرحباً بك، ${currentUser?.name || 'مستخدم'}`);
    };

    const handleLogout = async () => {
        try {
            await sendLogOut(undefined).unwrap();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleBackup = useCallback(() => {
        const backupData = {
            companyInfo, vatRate, isVatEnabled, branches, stores, users, itemGroups, units, items, customers, suppliers,
            expenseCodes, expenseTypes, expenses, currentAccounts, safes, banks, salesInvoices, salesReturns,
            purchaseInvoices, purchaseReturns, receiptVouchers, paymentVouchers, storeReceiptVouchers,
            storeIssueVouchers, storeTransferVouchers
        };
        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stockpro_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('تم إنشاء نسخة احتياطية بنجاح.');
    }, [
        companyInfo, vatRate, isVatEnabled, branches, stores, users, itemGroups, units, items, customers, suppliers,
        expenseCodes, expenseTypes, expenses, currentAccounts, safes, banks, salesInvoices, salesReturns,
        purchaseInvoices, purchaseReturns, receiptVouchers, paymentVouchers, storeReceiptVouchers,
        storeIssueVouchers, storeTransferVouchers, showToast
    ]);


    const handleAddExpense = (expense: Omit<Expense, 'id' | 'code'>) => {
        const nextCodeNumber = expenses.length > 0 ? Math.max(...expenses.map(e => parseInt(e.code.split('-')[1]) || 0)) + 1 : 1;
        const newCode = `MSR-${String(nextCodeNumber).padStart(3, '0')}`;
        setExpenses(prev => [...prev, { ...expense, id: Date.now(), code: newCode } as Expense]);
    };

    if (!isLoggedIn) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <div className="flex h-screen bg-brand-bg font-sans" dir="rtl">
            <Sidebar searchTerm={searchTerm} userPermissions={userPermissions} onDatabaseBackup={handleBackup} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header currentUser={currentUser} onLogout={handleLogout} searchTerm={searchTerm} setSearchTerm={setSearchTerm} notifications={notifications} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-brand-bg p-6">
                    <Routes>
                        {/* Login */}
                        <Route path="/login" element={<Login onLogin={handleLogin} />} />
                        
                        {/* Dashboard */}
                        <Route path="/dashboard" element={
                            <ProtectedRoute requiredPermission="dashboard-read">
                                <Dashboard title="الرئيسية" />
                            </ProtectedRoute>
                        } />
                        
                        {/* Settings */}
                        <Route path="/settings/company-data" element={
                            <ProtectedRoute requiredPermission="company_data-read">
                                <CompanyData title={currentPageTitle} />
                            </ProtectedRoute>
                        } />
                        <Route path="/settings/branches-data" element={
                            <ProtectedRoute requiredPermission="branches_data-read">
                                <BranchesData title={currentPageTitle} branches={branches} onSave={(branch) => setBranches(prev => branch.id ? prev.map(b => b.id === branch.id ? branch : b) : [...prev, { ...branch, id: Date.now() }])} onDelete={(id) => setBranches(prev => prev.filter(b => b.id !== id))} />
                            </ProtectedRoute>
                        } />
                        <Route path="/settings/stores-data" element={
                            <ProtectedRoute requiredPermission="stores_data-read">
                                <StoresData title={currentPageTitle} stores={stores} branches={branches} users={users} onSave={(store) => setStores(prev => store.id ? prev.map(w => w.id === store.id ? store : w) : [...prev, { ...store, id: Date.now() }])} onDelete={(id) => setStores(prev => prev.filter(w => w.id !== id))} />
                            </ProtectedRoute>
                        } />
                        <Route path="/settings/users-data" element={
                            <ProtectedRoute requiredPermission="users_data-read">
                                <UsersData title={currentPageTitle} users={users} branches={branches} onSave={(user) => setUsers(prev => user.id ? prev.map(u => u.id === user.id ? user : u) : [...prev, { ...user, id: Date.now() }])} onDelete={(id) => setUsers(prev => prev.filter(u => u.id !== id))} />
                            </ProtectedRoute>
                        } />
                        <Route path="/settings/permissions" element={
                            <ProtectedRoute requiredPermission="permissions-update">
                                <Permissions title={currentPageTitle} />
                            </ProtectedRoute>
                        } />
                        
                        {/* Items */}
                        <Route path="/items/add" element={
                            <ProtectedRoute requiredPermission="add_item-read">
                                <AddItem title={currentPageTitle} editingId={null} onNavigate={() => {}} />
                            </ProtectedRoute>
                        } />
                        <Route path="/items/list" element={
                            <ProtectedRoute requiredPermission="items_list-read">
                                <ItemsList title={currentPageTitle} onNavigate={() => {}} />
                            </ProtectedRoute>
                        } />
                        <Route path="/items/groups" element={
                            <ProtectedRoute requiredPermission="item_groups-read">
                                <ItemGroups title={currentPageTitle} />
                            </ProtectedRoute>
                        } />
                        <Route path="/items/units" element={
                            <ProtectedRoute requiredPermission="units-read">
                                <Units title={currentPageTitle} />
                            </ProtectedRoute>
                        } />
                        
                        {/* Warehouse Operations */}
                        <Route path="/warehouse/receipt-voucher" element={
                            <ProtectedRoute requiredPermission="store_receipt_voucher-read">
                                <StoreReceiptVoucher title={currentPageTitle} companyInfo={companyInfo} items={itemsWithLiveStock.map(i => ({id: i.code, name: i.name, unit: i.unit, stock: i.stock}))} branches={branches} vouchers={storeReceiptVouchers} onSave={(v) => setStoreReceiptVouchers(prev => prev.find(i => i.id === v.id) ? prev.map(i => i.id === v.id ? v : i) : [...prev, v])} onDelete={(id) => setStoreReceiptVouchers(prev => prev.filter(v => v.id !== id))} />
                            </ProtectedRoute>
                        } />
                        <Route path="/warehouse/issue-voucher" element={
                            <ProtectedRoute requiredPermission="store_issue_voucher-read">
                                <StoreIssueVoucher title={currentPageTitle} companyInfo={companyInfo} items={itemsWithLiveStock.map(i => ({id: i.code, name: i.name, unit: i.unit, stock: i.stock}))} branches={branches} vouchers={storeIssueVouchers} onSave={(v) => setStoreIssueVouchers(prev => prev.find(i => i.id === v.id) ? prev.map(i => i.id === v.id ? v : i) : [...prev, v])} onDelete={(id) => setStoreIssueVouchers(prev => prev.filter(v => v.id !== id))} />
                            </ProtectedRoute>
                        } />
                        <Route path="/warehouse/transfer" element={
                            <ProtectedRoute requiredPermission="store_transfer-read">
                                <StoreTransfer title={currentPageTitle} companyInfo={companyInfo} items={itemsWithLiveStock.map(i => ({id: i.code, name: i.name, unit: i.unit, stock: i.stock}))} stores={stores} vouchers={storeTransferVouchers} onSave={(v) => setStoreTransferVouchers(prev => prev.find(i => i.id === v.id) ? prev.map(i => i.id === v.id ? v : i) : [...prev, v])} onDelete={(id) => setStoreTransferVouchers(prev => prev.filter(v => v.id !== id))} />
                            </ProtectedRoute>
                        } />
                        
                        {/* Sales */}
                        <Route path="/sales/invoice" element={
                            <ProtectedRoute requiredPermission="sales_invoice-read">
                                <SalesInvoice title={currentPageTitle} vatRate={vatRate} isVatEnabled={isVatEnabled} companyInfo={companyInfo} items={itemsWithLiveStock.map(i => ({id: i.code, name: i.name, unit: i.unit, price: i.salePrice, stock: i.stock, barcode: i.barcode}))} customers={customers} invoices={salesInvoices} onSave={(inv) => setSalesInvoices(prev => prev.find(i => i.id === inv.id) ? prev.map(i => i.id === inv.id ? inv : i) : [...prev, inv])} onDelete={(id) => setSalesInvoices(prev => prev.filter(i => i.id !== id))} currentUser={currentUser} viewingId={null} onClearViewingId={() => {}} safes={safes} banks={banks} />
                            </ProtectedRoute>
                        } />
                        <Route path="/sales/return" element={
                            <ProtectedRoute requiredPermission="sales_return-read">
                                <SalesReturn title={currentPageTitle} vatRate={vatRate} isVatEnabled={isVatEnabled} companyInfo={companyInfo} items={itemsWithLiveStock.map(i => ({id: i.code, name: i.name, unit: i.unit, price: i.salePrice, stock: i.stock, barcode: i.barcode}))} customers={customers} invoices={salesReturns} onSave={(inv) => setSalesReturns(prev => prev.find(i => i.id === inv.id) ? prev.map(i => i.id === inv.id ? inv : i) : [...prev, inv])} onDelete={(id) => setSalesReturns(prev => prev.filter(i => i.id !== id))} currentUser={currentUser} viewingId={null} onClearViewingId={() => {}} safes={safes} banks={banks} />
                            </ProtectedRoute>
                        } />
                        <Route path="/sales/daily" element={
                            <ProtectedRoute requiredPermission="daily_sales-read">
                                <DailySales title={currentPageTitle} companyInfo={companyInfo} salesInvoices={salesInvoices} />
                            </ProtectedRoute>
                        } />
                        <Route path="/sales/daily-returns" element={
                            <ProtectedRoute requiredPermission="daily_sales_returns-read">
                                <DailySalesReturns title={currentPageTitle} companyInfo={companyInfo} salesReturns={salesReturns} />
                            </ProtectedRoute>
                        } />
                        
                        {/* Purchases */}
                        <Route path="/purchases/invoice" element={
                            <ProtectedRoute requiredPermission="purchase_invoice-read">
                                <PurchaseInvoice title={currentPageTitle} vatRate={vatRate} isVatEnabled={isVatEnabled} companyInfo={companyInfo} items={itemsWithLiveStock.map(i => ({id: i.code, name: i.name, unit: i.unit, price: i.purchasePrice, stock: i.stock, barcode: i.barcode}))} suppliers={suppliers} invoices={purchaseInvoices} onSave={(inv) => setPurchaseInvoices(prev => prev.find(i => i.id === inv.id) ? prev.map(i => i.id === inv.id ? inv : i) : [...prev, inv])} onDelete={(id) => setPurchaseInvoices(prev => prev.filter(i => i.id !== id))} currentUser={currentUser} viewingId={null} onClearViewingId={() => {}} setItems={setItems} safes={safes} banks={banks} />
                            </ProtectedRoute>
                        } />
                        <Route path="/purchases/return" element={
                            <ProtectedRoute requiredPermission="purchase_return-read">
                                <PurchaseReturn title={currentPageTitle} vatRate={vatRate} isVatEnabled={isVatEnabled} companyInfo={companyInfo} items={itemsWithLiveStock.map(i => ({id: i.code, name: i.name, unit: i.unit, price: i.purchasePrice, stock: i.stock, barcode: i.barcode}))} suppliers={suppliers} invoices={purchaseReturns} onSave={(inv) => setPurchaseReturns(prev => prev.find(i => i.id === inv.id) ? prev.map(i => i.id === inv.id ? inv : i) : [...prev, inv])} onDelete={(id) => setPurchaseReturns(prev => prev.filter(i => i.id !== id))} currentUser={currentUser} viewingId={null} onClearViewingId={() => {}} safes={safes} banks={banks} />
                            </ProtectedRoute>
                        } />
                        <Route path="/purchases/daily" element={
                            <ProtectedRoute requiredPermission="daily_purchases-read">
                                <DailyPurchases title={currentPageTitle} companyInfo={companyInfo} purchaseInvoices={purchaseInvoices} />
                            </ProtectedRoute>
                        } />
                        <Route path="/purchases/daily-returns" element={
                            <ProtectedRoute requiredPermission="daily_purchase_returns-read">
                                <DailyPurchaseReturns title={currentPageTitle} companyInfo={companyInfo} purchaseReturns={purchaseReturns} />
                            </ProtectedRoute>
                        } />
                        
                        {/* Root and catch-all */}
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}

const AppWrapper = () => (
    <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
            <BrowserRouter>
                <ToastProvider>
                    <ModalProvider>
                        <AppContent />
                    </ModalProvider>
                    <Toast />
                </ToastProvider>
            </BrowserRouter>
        </PersistGate>
    </Provider>
);

export default AppWrapper;