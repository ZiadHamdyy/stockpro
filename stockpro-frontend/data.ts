import type { Branch, Store, User, ItemGroup, Unit, Item, Customer, Supplier, ExpenseCode, Expense, ExpenseType, CurrentAccount, Safe, Bank, Invoice, Voucher, StoreReceiptVoucher, StoreIssueVoucher, StoreTransferVoucher } from './types';

export const initialBranches: Branch[] = [
    { id: 1, name: 'الفرع الرئيسي', address: 'شارع الملك فهد، الرياض', phone: '011-1234567' },
    { id: 2, name: 'فرع جدة', address: 'طريق الملك عبدالعزيز، جدة', phone: '012-7654321' },
    { id: 3, name: 'فرع الدمام', address: 'شارع الأمير محمد بن فهد، الدمام', phone: '013-9876543' },
];

export const initialStores: Store[] = [
    { id: 1, name: 'المخزن المركزي', branch: 'الفرع الرئيسي', manager: 'مدير النظام' },
    { id: 2, name: 'مخزن جدة', branch: 'فرع جدة', manager: 'فاطمة الزهراء' },
    { id: 3, name: 'مخزن الدمام', branch: 'فرع الدمام', manager: 'سارة خالد' },
];

export const initialUsers: User[] = [
    { id: 1, name: 'مدير النظام', email: 'admin@example.com', avatar: null },
    { id: 2, name: 'علي حسن', email: 'ali.hassan@example.com', avatar: null },
    { id: 3, name: 'فاطمة الزهراء', email: 'fatima.z@example.com', avatar: null },
    { id: 4, name: 'سارة خالد', email: 'sara.khalid@example.com', avatar: null },
];

export const initialItemGroups: ItemGroup[] = [
    { id: 1, name: 'الكترونيات' },
    { id: 2, name: 'أثاث' },
    { id: 3, name: 'مستلزمات مكتبية' },
    { id: 4, name: 'اكسسوارات' },
];

export const initialUnits: Unit[] = [
    { id: 1, name: 'حبة' },
    { id: 2, name: 'قطعة' },
    { id: 3, name: 'كرتون' },
    { id: 4, name: 'رزمه' },
];

export const initialItems: Item[] = [
    { id: 1, code: '101', barcode: '6281073740337', name: 'لابتوب ديل', group: 'الكترونيات', unit: 'حبة', purchasePrice: 4200, salePrice: 4500, stock: 50, reorderLimit: 20 },
    { id: 2, code: '102', barcode: '8806091028376', name: 'شاشة سامسونج', group: 'الكترونيات', unit: 'حبة', purchasePrice: 1100, salePrice: 1200, stock: 15, reorderLimit: 30 },
    { id: 3, code: '201', barcode: '4005176884328', name: 'طاولة مكتب', group: 'أثاث', unit: 'قطعة', purchasePrice: 550, salePrice: 600, stock: 80, reorderLimit: 25 },
    { id: 4, code: '301', barcode: '0718103283754', name: 'ورق طباعة A4', group: 'مستلزمات مكتبية', unit: 'رزمه', purchasePrice: 20, salePrice: 25, stock: 1000, reorderLimit: 200 },
    { id: 5, code: '103', barcode: '097855142562', name: 'ماوس لاسلكي', group: 'اكسسوارات', unit: 'حبة', purchasePrice: 120, salePrice: 150, stock: 300, reorderLimit: 100 },
];

export const initialCustomers: Customer[] = [
    { id: 1, code: 'C001', name: 'العميل الأول', commercialReg: '1010000001', taxNumber: '3000000001', nationalAddress: 'address 1', phone: '0501234567', openingBalance: 5000 },
    { id: 2, code: 'C002', name: 'شركة الأمل للتجارة', commercialReg: '1010000002', taxNumber: '3000000002', nationalAddress: 'address 2', phone: '0557654321', openingBalance: 10000 },
    { id: 3, code: 'C003', name: 'مؤسسة النجاح', commercialReg: '1010000003', taxNumber: '3000000003', nationalAddress: 'address 3', phone: '0539876543', openingBalance: 0 },
];

export const initialSuppliers: Supplier[] = [
    { id: 1, code: 'S001', name: 'المورد الأول', commercialReg: '2010000001', taxNumber: '3000000004', nationalAddress: 'address 4', phone: '0501112222', openingBalance: -8000 },
    { id: 2, code: 'S002', name: 'شركة التوريدات الحديثة', commercialReg: '2010000002', taxNumber: '3000000005', nationalAddress: 'address 5', phone: '0553334444', openingBalance: -15000 },
    { id: 3, code: 'S003', name: 'مؤسسة الإمداد', commercialReg: '2010000003', taxNumber: '3000000006', nationalAddress: 'address 6', phone: '0535556666', openingBalance: 0 },
];

export const initialExpenseCodes: ExpenseCode[] = [
    { id: 1, code: 'EXP-ADM-01', name: 'رواتب وأجور', type: 'مصاريف إدارية' },
    { id: 2, code: 'EXP-GEN-01', name: 'إيجارات', type: 'مصاريف عمومية' },
    { id: 3, code: 'EXP-GEN-02', name: 'كهرباء ومياه', type: 'مصاريف عمومية' },
    { id: 4, code: 'EXP-MKT-01', name: 'حملات إعلانية', type: 'مصاريف تسويقية' },
];

export const initialExpenses: Expense[] = [
    { id: 1, code: 'MSR-001', date: '2024-07-01', expenseCodeId: 1, expenseCode: 'EXP-ADM-01', expenseCodeName: 'رواتب وأجور', expenseCodeType: 'مصاريف إدارية', amount: 25000, description: 'رواتب شهر يونيو' },
    { id: 2, code: 'MSR-002', date: '2024-07-05', expenseCodeId: 2, expenseCode: 'EXP-GEN-01', expenseCodeName: 'إيجارات', expenseCodeType: 'مصاريف عمومية', amount: 10000, description: 'إيجار المكتب' },
    { id: 3, code: 'MSR-003', date: '2024-07-10', expenseCodeId: 3, expenseCode: 'EXP-GEN-02', expenseCodeName: 'كهرباء ومياه', expenseCodeType: 'مصاريف عمومية', amount: 1500, description: 'فاتورة الكهرباء' },
];

export const initialExpenseTypes: ExpenseType[] = [
    { id: 1, name: 'مصاريف إدارية' },
    { id: 2, name: 'مصاريف عمومية' },
    { id: 3, name: 'مصاريف تسويقية' },
    { id: 4, name: 'مصاريف تشغيلية' },
];

export const initialCurrentAccounts: CurrentAccount[] = [
    { id: 1, code: 'CA-001', name: 'جاري الشريك أ', type: 'شريك', openingBalance: 0 },
    { id: 2, code: 'CA-002', name: 'جاري الشريك ب', type: 'شريك', openingBalance: 15000 },
    { id: 3, code: 'CA-003', name: 'سلفة موظف', type: 'سلفة', openingBalance: 0 },
];

export const initialSafes: Safe[] = [
    { id: 1, code: 'SF-001', name: 'الخزنة الرئيسية', branch: 'الفرع الرئيسي', openingBalance: 100000 },
    { id: 2, code: 'SF-002', name: 'خزنة فرع جدة', branch: 'فرع جدة', openingBalance: 50000 },
];

export const initialBanks: Bank[] = [
    { id: 1, code: 'BK-001', name: 'بنك الراجحي', accountNumber: '123456789012', iban: 'SA0380000000123456789012', openingBalance: 500000 },
    { id: 2, code: 'BK-002', name: 'البنك الأهلي السعودي', accountNumber: '987654321098', iban: 'SA0310000000987654321098', openingBalance: 250000 },
];

export const initialSalesInvoices: Invoice[] = [
    {
        id: 'INV-00123',
        date: '2024-04-01',
        customerOrSupplier: { id: '1', name: 'العميل الأول' },
        items: [
            { id: '101', name: 'لابتوب ديل', unit: 'حبة', qty: 1, price: 4500, taxAmount: 675, total: 4500 },
            { id: '103', name: 'ماوس لاسلكي', unit: 'حبة', qty: 2, price: 150, taxAmount: 45, total: 300 }
        ],
        totals: { subtotal: 4800, discount: 0, tax: 720, net: 5520 },
        paymentMethod: 'credit',
        paymentTerms: 30,
        userName: 'مدير النظام',
        branchName: 'الفرع الرئيسي'
    },
];

export const initialSalesReturns: Invoice[] = [
    {
        id: 'RTN-00045',
        date: '2024-05-20',
        customerOrSupplier: { id: '1', name: 'العميل الأول' },
        items: [{ id: '103', name: 'ماوس لاسلكي', unit: 'حبة', qty: 1, price: 150, taxAmount: 22.5, total: 150 }],
        totals: { subtotal: 600, discount: 0, tax: 90, net: 690 },
        paymentMethod: 'credit',
        paymentTerms: 30,
        userName: 'مدير النظام',
        branchName: 'الفرع الرئيسي'
    }
];
export const initialPurchaseInvoices: Invoice[] = [
    {
        id: 'PUR-00088',
        date: '2024-05-02',
        customerOrSupplier: { id: '1', name: 'المورد الأول' },
        items: [],
        totals: { subtotal: 2113.04, discount: 0, tax: 316.96, net: 2430 },
        paymentMethod: 'credit',
        paymentTerms: 60,
        userName: 'مدير النظام',
        branchName: 'الفرع الرئيسي'
    }
];
export const initialPurchaseReturns: Invoice[] = [
    {
        id: 'PRTN-00012',
        date: '2024-05-21',
        customerOrSupplier: { id: '1', name: 'المورد الأول' },
        items: [],
        totals: { subtotal: 350, discount: 0, tax: 52.50, net: 402.50 },
        paymentMethod: 'credit',
        paymentTerms: 30,
        userName: 'مدير النظام',
        branchName: 'الفرع الرئيسي'
    }
];

export const initialReceiptVouchers: Voucher[] = [
    { id: 'RCV-00050', type: 'receipt', date: '2024-05-15', entity: { type: 'customer', id: 1, name: 'العميل الأول' }, amount: 5000, description: 'دفعة من حساب فاتورة INV-00123', paymentMethod: 'safe', safeOrBankId: 1, userName: 'مدير النظام', branchName: 'الفرع الرئيسي' },
    { id: 'RCV-00051', type: 'receipt', date: '2024-05-15', entity: { type: 'current_account', id: 2, name: 'جاري الشريك ب' }, amount: 50000, description: 'إيداع في الحساب الجاري', paymentMethod: 'bank', safeOrBankId: 1, userName: 'مدير النظام', branchName: 'الفرع الرئيسي' }
];
export const initialPaymentVouchers: Voucher[] = [
    { id: 'PAY-00032', type: 'payment', date: '2024-05-16', entity: { type: 'supplier', id: 1, name: 'المورد الأول' }, amount: 8000, description: 'دفعة من حساب فاتورة', paymentMethod: 'safe', safeOrBankId: 1, userName: 'مدير النظام', branchName: 'الفرع الرئيسي' },
    { id: 'PAY-00033', type: 'payment', date: '2024-05-01', entity: { type: 'current_account', id: 1, name: 'جاري الشريك أ' }, amount: 10000, description: 'سحب شخصي', paymentMethod: 'safe', safeOrBankId: 1, userName: 'مدير النظام', branchName: 'الفرع الرئيسي' }
];

export const initialStoreReceiptVouchers: StoreReceiptVoucher[] = [
    {
        id: 'SRV-00001',
        date: '2024-07-25',
        branch: 'الفرع الرئيسي',
        items: [
            { id: '101', name: 'لابتوب ديل', unit: 'حبة', qty: 10 },
            { id: '102', name: 'شاشة سامسونج', unit: 'حبة', qty: 20 },
        ]
    },
    {
        id: 'SRV-00002',
        date: '2024-07-26',
        branch: 'فرع جدة',
        items: [
            { id: '201', name: 'طاولة مكتب', unit: 'قطعة', qty: 15 },
        ]
    }
];

export const initialStoreIssueVouchers: StoreIssueVoucher[] = [
    {
        id: 'SIV-00001',
        date: '2024-07-28',
        branch: 'الفرع الرئيسي',
        items: [
            { id: '103', name: 'ماوس لاسلكي', unit: 'حبة', qty: 5 },
        ]
    }
];

export const initialStoreTransferVouchers: StoreTransferVoucher[] = [
    {
        id: 'STV-00001',
        date: '2024-07-29',
        fromStore: 'المخزن المركزي',
        toStore: 'مخزن جدة',
        items: [
            { id: '301', name: 'ورق طباعة A4', unit: 'رزمه', qty: 50 },
        ]
    }
];