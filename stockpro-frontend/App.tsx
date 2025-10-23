import { useState, useCallback, useMemo, useEffect } from 'react';
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

// Simplified role-based permissions
const rolePermissions: Record<string, string[]> = {
    'مدير': ['all'], // Manager has all permissions
    'محاسب': [
        'dashboard',
        'sales', 'purchases', 'customers', 'suppliers', 'financials',
        'reports', 'final_accounts'
    ],
    'بائع': [
        'dashboard', 'sales_invoice', 'sales_return', 'daily_sales',
        'add_customer', 'customers_list'
    ],
    'مدخل بيانات': [
        'dashboard', 'items', 'warehouse_operations'
    ]
};


const AppContent = () => {
    // Redux state
    const dispatch = useAppDispatch();
    const { Token, User, isAuthed } = useAuth();
    const isLoggedIn = isAuthed;
    const currentUser = User;
    const [sendLogOut] = useSendLogOutMutation();
    
    // Local state
    const [activePage, setActivePage] = useState('dashboard');
    const [pageTitle, setPageTitle] = useState('الرئيسية');
    
    // Compute user permissions from Redux store (persistent)
    const userPermissions = useMemo(() => {
        if (currentUser && currentUser.permissionGroup) {
            const permissions = rolePermissions[currentUser.permissionGroup] || [];
            console.log('User permissions computed:', { currentUser, permissionGroup: currentUser.permissionGroup, permissions });
            return permissions;
        }
        console.log('Using default permissions - no user or permissionGroup');
        return ['all']; // Default permissions for testing
    }, [currentUser]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [viewingId, setViewingId] = useState<string | number | null>(null);
    const { showToast } = useToast();

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


    const handleNavigation = useCallback((key: string, label: string, id: number | null = null) => {
        if (key === 'database_backup') {
            handleBackup();
            return;
        }
        setActivePage(key);
        setPageTitle(label);
        setEditingId(id);
        setViewingId(null);
    }, [handleBackup]);
    
    const handleViewRecord = useCallback((pageKey: string, pageLabel: string, recordId: string | number) => {
        setActivePage(pageKey);
        setPageTitle(pageLabel);
        setViewingId(recordId);
        setEditingId(null);
    }, []);

    const handleAddExpense = (expense: Omit<Expense, 'id' | 'code'>) => {
        const nextCodeNumber = expenses.length > 0 ? Math.max(...expenses.map(e => parseInt(e.code.split('-')[1]) || 0)) + 1 : 1;
        const newCode = `MSR-${String(nextCodeNumber).padStart(3, '0')}`;
        setExpenses(prev => [...prev, { ...expense, id: Date.now(), code: newCode } as Expense]);
    };

    const renderPage = () => {
        switch (activePage) {
            case 'dashboard': return <Dashboard title={pageTitle} />;
            // Settings
            case 'company_data': return <CompanyData title={pageTitle} vatRate={vatRate} setVatRate={setVatRate} isVatEnabled={isVatEnabled} setIsVatEnabled={setIsVatEnabled} companyInfo={companyInfo} setCompanyInfo={setCompanyInfo} onGoHome={() => handleNavigation('dashboard', 'الرئيسية')} />;
            case 'branches_data': return <BranchesData title={pageTitle} branches={branches} onSave={(branch) => setBranches(prev => branch.id ? prev.map(b => b.id === branch.id ? branch : b) : [...prev, { ...branch, id: Date.now() }])} onDelete={(id) => setBranches(prev => prev.filter(b => b.id !== id))} />;
            case 'stores_data': return <StoresData title={pageTitle} stores={stores} branches={branches} users={users} onSave={(store) => setStores(prev => store.id ? prev.map(w => w.id === store.id ? store : w) : [...prev, { ...store, id: Date.now() }])} onDelete={(id) => setStores(prev => prev.filter(w => w.id !== id))} />;
            case 'users_data': return <UsersData title={pageTitle} users={users} branches={branches} onSave={(user) => setUsers(prev => user.id ? prev.map(u => u.id === user.id ? user : u) : [...prev, { ...user, id: Date.now() }])} onDelete={(id) => setUsers(prev => prev.filter(u => u.id !== id))} />;
            case 'permissions': return <Permissions title={pageTitle} />;
            // Items
            case 'add_item': return <AddItem title={pageTitle} editingId={editingId} items={items} onSave={(item) => setItems(prev => 'id' in item && item.id ? prev.map(i => i.id === item.id ? item : i) : [...prev, { ...item, id: Date.now(), code: (Math.max(...prev.map(i => parseInt(i.code, 10) || 0)) + 1).toString() } as Item])} onDelete={(id) => { setItems(prev => prev.filter(i => i.id !== id)); handleNavigation('items_list', 'قائمة الأصناف'); }} itemGroups={itemGroups} units={units} onNavigate={handleNavigation} />;
            case 'items_list': return <ItemsList title={pageTitle} items={itemsWithLiveStock} onAddNew={() => handleNavigation('add_item', 'إضافة صنف')} onEdit={(id) => handleNavigation('add_item', `تعديل صنف #${id}`, id)} onDelete={(id) => setItems(prev => prev.filter(i => i.id !== id))} />;
            case 'item_groups': return <ItemGroups title={pageTitle} groups={itemGroups} onSave={(group) => setItemGroups(prev => group.id ? prev.map(g => g.id === group.id ? group : g) : [...prev, { ...group, id: Date.now() }])} onDelete={(id) => setItemGroups(prev => prev.filter(g => g.id !== id))} />;
            case 'units': return <Units title={pageTitle} units={units} onSave={(unit) => setUnits(prev => unit.id ? prev.map(u => u.id === unit.id ? unit : u) : [...prev, { ...unit, id: Date.now() }])} onDelete={(id) => setUnits(prev => prev.filter(u => u.id !== id))} />;
            // Warehouse Operations
            case 'store_receipt_voucher': return <StoreReceiptVoucher title={pageTitle} companyInfo={companyInfo} items={itemsWithLiveStock.map(i => ({id: i.code, name: i.name, unit: i.unit, stock: i.stock}))} branches={branches} vouchers={storeReceiptVouchers} onSave={(v) => setStoreReceiptVouchers(prev => prev.find(i => i.id === v.id) ? prev.map(i => i.id === v.id ? v : i) : [...prev, v])} onDelete={(id) => setStoreReceiptVouchers(prev => prev.filter(v => v.id !== id))} />;
            case 'store_issue_voucher': return <StoreIssueVoucher title={pageTitle} companyInfo={companyInfo} items={itemsWithLiveStock.map(i => ({id: i.code, name: i.name, unit: i.unit, stock: i.stock}))} branches={branches} vouchers={storeIssueVouchers} onSave={(v) => setStoreIssueVouchers(prev => prev.find(i => i.id === v.id) ? prev.map(i => i.id === v.id ? v : i) : [...prev, v])} onDelete={(id) => setStoreIssueVouchers(prev => prev.filter(v => v.id !== id))} />;
            case 'store_transfer': return <StoreTransfer title={pageTitle} companyInfo={companyInfo} items={itemsWithLiveStock.map(i => ({id: i.code, name: i.name, unit: i.unit, stock: i.stock}))} stores={stores} vouchers={storeTransferVouchers} onSave={(v) => setStoreTransferVouchers(prev => prev.find(i => i.id === v.id) ? prev.map(i => i.id === v.id ? v : i) : [...prev, v])} onDelete={(id) => setStoreTransferVouchers(prev => prev.filter(v => v.id !== id))} />;
            // Sales
            case 'sales_invoice': return <SalesInvoice title={pageTitle} vatRate={vatRate} isVatEnabled={isVatEnabled} companyInfo={companyInfo} items={itemsWithLiveStock.map(i => ({id: i.code, name: i.name, unit: i.unit, price: i.salePrice, stock: i.stock, barcode: i.barcode}))} customers={customers} invoices={salesInvoices} onSave={(inv) => setSalesInvoices(prev => prev.find(i => i.id === inv.id) ? prev.map(i => i.id === inv.id ? inv : i) : [...prev, inv])} onDelete={(id) => setSalesInvoices(prev => prev.filter(i => i.id !== id))} currentUser={currentUser} viewingId={viewingId} onClearViewingId={() => setViewingId(null)} safes={safes} banks={banks} />;
            case 'sales_return': return <SalesReturn title={pageTitle} vatRate={vatRate} isVatEnabled={isVatEnabled} companyInfo={companyInfo} items={itemsWithLiveStock.map(i => ({id: i.code, name: i.name, unit: i.unit, price: i.salePrice, stock: i.stock, barcode: i.barcode}))} customers={customers} invoices={salesReturns} onSave={(inv) => setSalesReturns(prev => prev.find(i => i.id === inv.id) ? prev.map(i => i.id === inv.id ? inv : i) : [...prev, inv])} onDelete={(id) => setSalesReturns(prev => prev.filter(i => i.id !== id))} currentUser={currentUser} viewingId={viewingId} onClearViewingId={() => setViewingId(null)} safes={safes} banks={banks} />;
            case 'daily_sales': return <DailySales title={pageTitle} companyInfo={companyInfo} salesInvoices={salesInvoices} />;
            case 'daily_sales_returns': return <DailySalesReturns title={pageTitle} companyInfo={companyInfo} salesReturns={salesReturns} />;
            // Purchases
            case 'purchase_invoice': return <PurchaseInvoice title={pageTitle} vatRate={vatRate} isVatEnabled={isVatEnabled} companyInfo={companyInfo} items={itemsWithLiveStock.map(i => ({id: i.code, name: i.name, unit: i.unit, price: i.purchasePrice, stock: i.stock, barcode: i.barcode}))} suppliers={suppliers} invoices={purchaseInvoices} onSave={(inv) => setPurchaseInvoices(prev => prev.find(i => i.id === inv.id) ? prev.map(i => i.id === inv.id ? inv : i) : [...prev, inv])} onDelete={(id) => setPurchaseInvoices(prev => prev.filter(i => i.id !== id))} currentUser={currentUser} viewingId={viewingId} onClearViewingId={() => setViewingId(null)} setItems={setItems} safes={safes} banks={banks} />;
            case 'purchase_return': return <PurchaseReturn title={pageTitle} vatRate={vatRate} isVatEnabled={isVatEnabled} companyInfo={companyInfo} items={itemsWithLiveStock.map(i => ({id: i.code, name: i.name, unit: i.unit, price: i.purchasePrice, stock: i.stock, barcode: i.barcode}))} suppliers={suppliers} invoices={purchaseReturns} onSave={(inv) => setPurchaseReturns(prev => prev.find(i => i.id === inv.id) ? prev.map(i => i.id === inv.id ? inv : i) : [...prev, inv])} onDelete={(id) => setPurchaseReturns(prev => prev.filter(i => i.id !== id))} currentUser={currentUser} viewingId={viewingId} onClearViewingId={() => setViewingId(null)} safes={safes} banks={banks} />;
            case 'daily_purchases': return <DailyPurchases title={pageTitle} companyInfo={companyInfo} purchaseInvoices={purchaseInvoices} />;
            case 'daily_purchase_returns': return <DailyPurchaseReturns title={pageTitle} companyInfo={companyInfo} purchaseReturns={purchaseReturns} />;
            // Customers
            case 'add_customer': return <AddCustomer title={pageTitle} editingId={editingId} customers={customers} onSave={(customer) => setCustomers(prev => 'id' in customer && customer.id ? prev.map(c => c.id === customer.id ? customer : c) : [...prev, { ...customer, id: Date.now() }])} onDelete={(id) => { setCustomers(prev => prev.filter(c => c.id !== id)); handleNavigation('customers_list', 'قائمة العملاء'); }} onNavigate={handleNavigation}/>;
            case 'customers_list': return <CustomersList title={pageTitle} customers={customers} onNavigate={handleNavigation} onDelete={(id) => setCustomers(prev => prev.filter(c => c.id !== id))} companyInfo={companyInfo} />;
            // Suppliers
            case 'add_supplier': return <AddSupplier title={pageTitle} editingId={editingId} suppliers={suppliers} onSave={(supplier) => setSuppliers(prev => 'id' in supplier && supplier.id ? prev.map(s => s.id === supplier.id ? supplier : s) : [...prev, { ...supplier, id: Date.now() }])} onDelete={(id) => { setSuppliers(prev => prev.filter(s => s.id !== id)); handleNavigation('suppliers_list', 'قائمة الموردين'); }} onNavigate={handleNavigation} />;
            case 'suppliers_list': return <SuppliersList title={pageTitle} suppliers={suppliers} onNavigate={handleNavigation} onDelete={(id) => setSuppliers(prev => prev.filter(s => s.id !== id))} companyInfo={companyInfo} />;
            // Financials
            case 'receipt_voucher': return <ReceiptVoucher title={pageTitle} companyInfo={companyInfo} vouchers={receiptVouchers} onSave={(v) => setReceiptVouchers(prev => prev.find(i => i.id === v.id) ? prev.map(i => i.id === v.id ? v : i) : [...prev, v])} onDelete={(id) => setReceiptVouchers(prev => prev.filter(v => v.id !== id))} customers={customers} suppliers={suppliers} currentAccounts={currentAccounts} currentUser={currentUser} safes={safes} banks={banks} viewingId={viewingId} onClearViewingId={() => setViewingId(null)} />;
            case 'payment_voucher': return <PaymentVoucher title={pageTitle} companyInfo={companyInfo} vouchers={paymentVouchers} onSave={(v) => setPaymentVouchers(prev => prev.find(i => i.id === v.id) ? prev.map(i => i.id === v.id ? v : i) : [...prev, v])} onDelete={(id) => setPaymentVouchers(prev => prev.filter(v => v.id !== id))} customers={customers} suppliers={suppliers} currentAccounts={currentAccounts} currentUser={currentUser} expenseCodes={expenseCodes} onAddExpense={handleAddExpense} safes={safes} banks={banks} viewingId={viewingId} onClearViewingId={() => setViewingId(null)} />;
            case 'expenses_list': return <ExpensesList title={pageTitle} expenses={expenses} onDelete={(id) => setExpenses(prev => prev.filter(e => e.id !== id))} />;
            case 'expense_codes': return <ExpenseCodes title={pageTitle} codes={expenseCodes} expenseTypes={expenseTypes} onSave={(code) => setExpenseCodes(prev => code.id ? prev.map(c => c.id === code.id ? code : c) : [...prev, { ...code, id: Date.now() }])} onDelete={(id) => setExpenseCodes(prev => prev.filter(c => c.id !== id))} />;
            case 'expense_types': return <ExpenseTypes title={pageTitle} types={expenseTypes} onSave={(type) => setExpenseTypes(prev => type.id ? prev.map(t => t.id === type.id ? type : t) : [...prev, { ...type, id: Date.now() }])} onDelete={(id) => setExpenseTypes(prev => prev.filter(t => t.id !== id))} />;
            case 'add_current_account': return <AddCurrentAccount title={pageTitle} editingId={editingId} accounts={currentAccounts} onSave={(acc) => setCurrentAccounts(prev => 'id' in acc && acc.id ? prev.map(a => a.id === acc.id ? acc : a) : [...prev, { ...acc, id: Date.now() }])} onDelete={(id) => { setCurrentAccounts(prev => prev.filter(a => a.id !== id)); handleNavigation('current_accounts_list', 'قائمة الحسابات الجارية'); }} onNavigate={handleNavigation} />;
            case 'current_accounts_list': return <CurrentAccountsList title={pageTitle} accounts={currentAccounts} onAddNew={() => handleNavigation('add_current_account', 'إضافة حساب جاري')} onEdit={(id) => handleNavigation('add_current_account', `تعديل حساب #${id}`, id)} onDelete={(id) => setCurrentAccounts(prev => prev.filter(a => a.id !== id))} />;
            case 'safes': return <Safes title={pageTitle} safes={safes} branches={branches} onSave={(safe) => setSafes(prev => safe.id ? prev.map(s => s.id === safe.id ? safe : s) : [...prev, { ...safe, id: Date.now() }])} onDelete={(id) => setSafes(prev => prev.filter(s => s.id !== id))} />;
            case 'banks': return <Banks title={pageTitle} banks={banks} onSave={(bank) => setBanks(prev => bank.id ? prev.map(b => b.id === bank.id ? bank : b) : [...prev, { ...bank, id: Date.now() }])} onDelete={(id) => setBanks(prev => prev.filter(b => b.id !== id))} />;
            // Reports
            case 'item_movement_report': return <ItemMovementReport title={pageTitle} companyInfo={companyInfo} items={items} salesInvoices={salesInvoices} purchaseInvoices={purchaseInvoices} salesReturns={salesReturns} purchaseReturns={purchaseReturns} storeReceiptVouchers={storeReceiptVouchers} storeIssueVouchers={storeIssueVouchers} storeTransferVouchers={storeTransferVouchers} onNavigate={handleViewRecord} currentUser={currentUser} branches={branches} stores={stores} />;
            case 'item_balance_report': return <ItemBalanceReport title={pageTitle} companyInfo={companyInfo} items={items} branches={branches} currentUser={currentUser} salesInvoices={salesInvoices} salesReturns={salesReturns} purchaseInvoices={purchaseInvoices} purchaseReturns={purchaseReturns} storeReceiptVouchers={storeReceiptVouchers} storeIssueVouchers={storeIssueVouchers} storeTransferVouchers={storeTransferVouchers} stores={stores} />;
            case 'inventory_valuation_report': return <InventoryValuationReport title={pageTitle} companyInfo={companyInfo} items={items} branches={branches} currentUser={currentUser} salesInvoices={salesInvoices} salesReturns={salesReturns} purchaseInvoices={purchaseInvoices} purchaseReturns={purchaseReturns} storeReceiptVouchers={storeReceiptVouchers} storeIssueVouchers={storeIssueVouchers} storeTransferVouchers={storeTransferVouchers} stores={stores} />;
            case 'customer_statement_report': return <CustomerStatementReport title={pageTitle} companyInfo={companyInfo} customers={customers} onNavigate={handleViewRecord} currentUser={currentUser} salesInvoices={salesInvoices} salesReturns={salesReturns} receiptVouchers={receiptVouchers} paymentVouchers={paymentVouchers} />;
            case 'customer_balance_report': return <CustomerBalanceReport title={pageTitle} companyInfo={companyInfo} customers={customers} salesInvoices={salesInvoices} salesReturns={salesReturns} receiptVouchers={receiptVouchers} paymentVouchers={paymentVouchers} branches={branches} currentUser={currentUser} />;
            case 'supplier_statement_report': return <SupplierStatementReport title={pageTitle} companyInfo={companyInfo} suppliers={suppliers} onNavigate={handleViewRecord} currentUser={currentUser} purchaseInvoices={purchaseInvoices} purchaseReturns={purchaseReturns} receiptVouchers={receiptVouchers} paymentVouchers={paymentVouchers} />;
            case 'supplier_balance_report': return <SupplierBalanceReport title={pageTitle} companyInfo={companyInfo} suppliers={suppliers} purchaseInvoices={purchaseInvoices} purchaseReturns={purchaseReturns} paymentVouchers={paymentVouchers} receiptVouchers={receiptVouchers} branches={branches} currentUser={currentUser} />;
            case 'daily_collections_report': return <DailyCollectionsReport title={pageTitle} companyInfo={companyInfo} receiptVouchers={receiptVouchers} currentUser={currentUser} />;
            case 'daily_payments_report': return <DailyPaymentsReport title={pageTitle} companyInfo={companyInfo} paymentVouchers={paymentVouchers} currentUser={currentUser} />;
            case 'expense_statement_report': return <ExpenseStatementReport title={pageTitle} companyInfo={companyInfo} expenseCodes={expenseCodes} paymentVouchers={paymentVouchers} currentUser={currentUser} />;
            case 'total_expenses_report': return <TotalExpensesReport title={pageTitle} companyInfo={companyInfo} paymentVouchers={paymentVouchers} currentUser={currentUser} />;
            case 'current_account_statement_report': return <CurrentAccountStatementReport title={pageTitle} companyInfo={companyInfo} currentAccounts={currentAccounts} receiptVouchers={receiptVouchers} paymentVouchers={paymentVouchers} currentUser={currentUser} />;
            case 'total_current_accounts_report': return <TotalCurrentAccountsReport title={pageTitle} companyInfo={companyInfo} currentUser={currentUser} />;
            case 'safe_statement_report': return <SafeStatementReport title={pageTitle} companyInfo={companyInfo} safes={safes} receiptVouchers={receiptVouchers} paymentVouchers={paymentVouchers} currentUser={currentUser} />;
            case 'bank_statement_report': return <BankStatementReport title={pageTitle} companyInfo={companyInfo} banks={banks} receiptVouchers={receiptVouchers} paymentVouchers={paymentVouchers} currentUser={currentUser} />;
            case 'tax_declaration_report': return <TaxDeclarationReport title={pageTitle} companyInfo={companyInfo} salesInvoices={salesInvoices} salesReturns={salesReturns} purchaseInvoices={purchaseInvoices} purchaseReturns={purchaseReturns} branches={branches} currentUser={currentUser} />;
            // Final Accounts
            case 'income_statement': return <IncomeStatement title={pageTitle} companyInfo={companyInfo} salesInvoices={salesInvoices} salesReturns={salesReturns} purchaseInvoices={purchaseInvoices} purchaseReturns={purchaseReturns} items={items} paymentVouchers={paymentVouchers} expenseCodes={expenseCodes} storeReceiptVouchers={storeReceiptVouchers} storeIssueVouchers={storeIssueVouchers} />;
            case 'balance_sheet': return <BalanceSheet title={pageTitle} companyInfo={companyInfo} safes={safes} banks={banks} customers={customers} suppliers={suppliers} items={items} salesInvoices={salesInvoices} salesReturns={salesReturns} purchaseInvoices={purchaseInvoices} purchaseReturns={purchaseReturns} receiptVouchers={receiptVouchers} paymentVouchers={paymentVouchers} expenses={expenses} expenseTypes={expenseTypes} currentUser={currentUser} storeReceiptVouchers={storeReceiptVouchers} storeIssueVouchers={storeIssueVouchers} currentAccounts={currentAccounts} />;
            default: return <Placeholder title={pageTitle} />;
        }
    };

    if (!isLoggedIn) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <div className="flex h-screen bg-brand-bg font-sans" dir="rtl">
            <Sidebar onMenuSelect={handleNavigation} searchTerm={searchTerm} userPermissions={userPermissions} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header title={pageTitle} currentUser={currentUser} onLogout={handleLogout} searchTerm={searchTerm} setSearchTerm={setSearchTerm} notifications={notifications} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-brand-bg p-6">
                    {renderPage()}
                </main>
            </div>
        </div>
    );
}

const AppWrapper = () => (
    <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
            <ToastProvider>
                <ModalProvider>
                    <AppContent />
                </ModalProvider>
                <Toast />
            </ToastProvider>
        </PersistGate>
    </Provider>
);

export default AppWrapper;