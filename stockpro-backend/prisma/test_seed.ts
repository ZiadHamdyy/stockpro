import { PrismaClient } from '@prisma/client';
import * as bcryptjs from 'bcryptjs';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const prisma = new PrismaClient();

// Define MENU_ITEMS structure to match frontend
interface MenuItem {
  key: string;
  label: string;
  children?: MenuItem[];
}

const MENU_ITEMS: MenuItem[] = [
  { key: 'dashboard', label: 'الرئيسية' },
  {
    key: 'settings',
    label: 'الإعدادات',
    children: [
      { key: 'company_data', label: 'بيانات الشركة' },
      { key: 'fiscal_years', label: 'الفترات المحاسبية' },
      { key: 'branches_data', label: 'بيانات الفروع' },
      { key: 'stores_data', label: 'بيانات المخازن' },
      { key: 'users_data', label: 'بيانات المستخدمين' },
      { key: 'permissions', label: 'الصلاحيات' },
      { key: 'audit_log', label: 'سجل العمليات' },
      { key: 'print_settings', label: 'إعدادات الطباعة' },
      {
        key: 'database',
        label: 'قاعدة البيانات',
        children: [{ key: 'database_backup', label: 'نسخة احتياطية' }],
      },
    ],
  },
  {
    key: 'zatca',
    label: 'الفوترة الإلكترونية',
    children: [
      { key: 'zatca_upload', label: 'رفع الفواتير (ZATCA)' },
    ],
  },
  {
    key: 'items',
    label: 'الأصناف',
    children: [
      { key: 'add_item', label: 'إضافة صنف' },
      { key: 'items_list', label: 'قائمة الأصناف' },
      { key: 'item_groups', label: 'مجموعات الأصناف' },
      { key: 'units', label: 'الوحدات' },
    ],
  },
  {
    key: 'warehouse_operations',
    label: 'عمليات المخازن',
    children: [
      { key: 'store_receipt_voucher', label: 'إذن إضافة مخزن' },
      { key: 'store_issue_voucher', label: 'إذن صرف مخزن' },
      { key: 'store_transfer', label: 'تحويل بين المخازن' },
      { key: 'inventory_count', label: 'جرد المخزون والتسوية' },
    ],
  },
  {
    key: 'sales',
    label: 'المبيعات',
    children: [
      { key: 'pos', label: 'نقطة بيع (POS)' },
      { key: 'price_quotation', label: 'عرض أسعار' },
      { key: 'sales_invoice', label: 'فاتورة مبيعات' },
      { key: 'sales_return', label: 'مرتجع مبيعات' },
      { key: 'daily_sales', label: 'يومية المبيعات' },
      { key: 'daily_sales_returns', label: 'يومية مرتجع المبيعات' },
    ],
  },
  {
    key: 'purchases',
    label: 'المشتريات',
    children: [
      { key: 'purchase_invoice', label: 'فاتورة مشتريات' },
      { key: 'purchase_return', label: 'مرتجع مشتريات' },
      { key: 'daily_purchases', label: 'يومية المشتريات' },
      { key: 'daily_purchase_returns', label: 'يومية مرتجع المشتريات' },
    ],
  },
  {
    key: 'customers',
    label: 'العملاء',
    children: [
      { key: 'add_customer', label: 'إضافة عميل' },
      { key: 'customers_list', label: 'قائمة العملاء' },
    ],
  },
  {
    key: 'suppliers',
    label: 'الموردين',
    children: [
      { key: 'add_supplier', label: 'إضافة مورد' },
      { key: 'suppliers_list', label: 'قائمة الموردين' },
    ],
  },
  {
    key: 'general_accounts',
    label: 'الحسابات العامة',
    children: [
      {
        key: 'expenses_management',
        label: 'المصروفات',
        children: [
          { key: 'expenses_list', label: 'قائمة المصروفات' },
          { key: 'expense_codes', label: 'أكواد المصروفات' },
          { key: 'expense_types', label: 'أنواع المصروفات' },
        ],
      },
      {
        key: 'revenues_management',
        label: 'الإيرادات الأخرى',
        children: [
          { key: 'revenue_codes', label: 'أنواع الإيرادات' },
        ],
      },
      {
        key: 'current_accounts',
        label: 'الحسابات الجارية',
        children: [
          { key: 'add_current_account', label: 'إضافة حساب جاري' },
          { key: 'current_accounts_list', label: 'قائمة الحسابات الجارية' },
        ],
      },
      { key: 'safes', label: 'الخزنات' },
      { key: 'banks', label: 'البنوك' },
    ],
  },
  {
    key: 'financial_balances',
    label: 'أرصدة مالية',
    children: [
      {
        key: 'receivable_accounts',
        label: 'أرصدة مدينة اخري',
        children: [
          { key: 'add_receivable_account', label: 'اضافة حساب' },
          { key: 'receivable_accounts_list', label: 'قائمة الأرصدة' },
        ],
      },
      {
        key: 'payable_accounts',
        label: 'أرصدة دائنة اخري',
        children: [
          { key: 'add_payable_account', label: 'اضافة حساب' },
          { key: 'payable_accounts_list', label: 'قائمة الأرصدة' },
        ],
      },
    ],
  },
  {
    key: 'financials',
    label: 'الحركة المالية',
    children: [
      { key: 'receipt_voucher', label: 'سند قبض' },
      { key: 'payment_voucher', label: 'سند صرف' },
      { key: 'internal_transfers', label: 'تحويلات بينية' },
    ],
  },
  {
    key: 'reports',
    label: 'التقارير',
    children: [
      {
        key: 'financial_analysis',
        label: 'التحليل المالي الذكي',
        children: [
          { key: 'liquidity_report', label: 'مؤشر السيولة والأمان' },
          {
            key: 'financial_performance_report',
            label: 'التحليل المالي المقارن',
          },
          { key: 'item_profitability_report', label: 'تحليل ربحية الأصناف' },
          { key: 'debt_aging_report', label: 'تحليل أعمار الديون' },
          { key: 'stagnant_items_report', label: 'تحليل المخزون الراكد' },
          { key: 'vip_customers_report', label: 'كبار العملاء (VIP)' },
        ],
      },
      {
        key: 'item_reports',
        label: 'تقارير الأصناف',
        children: [
          { key: 'item_movement_report', label: 'حركة صنف' },
          { key: 'item_balance_report', label: 'أرصدة الأصناف' },
          { key: 'inventory_valuation_report', label: 'تقييم المخزون' },
        ],
      },
      {
        key: 'customer_reports',
        label: 'تقارير العملاء',
        children: [
          { key: 'customer_statement_report', label: 'كشف حساب عميل' },
          { key: 'customer_balance_report', label: 'أرصدة العملاء' },
        ],
      },
      {
        key: 'supplier_reports',
        label: 'تقارير الموردين',
        children: [
          { key: 'supplier_statement_report', label: 'كشف حساب مورد' },
          { key: 'supplier_balance_report', label: 'أرصدة الموردين' },
        ],
      },
      {
        key: 'financial_reports',
        label: 'تقارير مالية',
        children: [
          { key: 'daily_collections_report', label: 'يومية التحصيلات' },
          { key: 'daily_payments_report', label: 'يومية الصرف' },
          { key: 'daily_transfers_report', label: 'يومية التحويلات' },
          { key: 'expense_statement_report', label: 'كشف حساب مصروفات' },
          { key: 'total_expenses_report', label: 'إجمالي المصروفات' },
        ],
      },
      {
        key: 'general_accounts_reports',
        label: 'تقارير حسابات عامة',
        children: [
          { key: 'current_account_statement_report', label: 'كشف حساب جاري' },
          {
            key: 'total_current_accounts_report',
            label: 'إجمالي الحسابات الجارية',
          },
          { key: 'receivable_account_statement_report', label: 'كشف حساب مدينة' },
          {
            key: 'total_receivable_accounts_report',
            label: 'إجمالي الأرصدة المدينة',
          },
          { key: 'payable_account_statement_report', label: 'كشف حساب دائنة' },
          {
            key: 'total_payable_accounts_report',
            label: 'إجمالي الأرصدة الدائنة',
          },
        ],
      },
      {
        key: 'cash_reports',
        label: 'تقارير نقدية',
        children: [
          { key: 'safe_statement_report', label: 'كشف حساب خزينة' },
          { key: 'bank_statement_report', label: 'كشف حساب بنك' },
        ],
      },
      {
        key: 'tax_reports',
        label: 'تقارير ضريبية',
        children: [
          { key: 'vat_statement_report', label: 'كشف حساب الضريبة' },
          { key: 'tax_declaration_report', label: 'الإقرار الضريبي' },
        ],
      },
    ],
  },
  {
    key: 'final_accounts',
    label: 'الحسابات الختامية',
    children: [
      { key: 'income_statement', label: 'قائمة الدخل' },
      { key: 'balance_sheet', label: 'قائمة المركز المالي' },
    ],
  },
  {
    key: 'help_center',
    label: 'مركز المساعدة',
  },
];

// Actions available for each resource
const PERMISSION_ACTIONS = [
  'read',
  'create',
  'update',
  'delete',
  'search',
  'print',
  'post',
];

// Recursively extract all keys from menu items
function getAllKeys(items: MenuItem[]): string[] {
  return items.flatMap((item) => [
    item.key,
    ...(item.children ? getAllKeys(item.children) : []),
  ]);
}

// Generate all permissions for all resources
function generatePermissions(): Array<{
  resource: string;
  action: string;
  description: string;
}> {
  const allKeys = getAllKeys(MENU_ITEMS);
  const permissions: Array<{
    resource: string;
    action: string;
    description: string;
  }> = [];

  for (const resource of allKeys) {
    for (const action of PERMISSION_ACTIONS) {
      permissions.push({
        resource,
        action,
        description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource.replace(/_/g, ' ')}`,
      });
    }
  }

  return permissions;
}

// Reusable function to seed a single company
async function seedCompany(companyId: string, host: string, companyName: string) {
  console.log(`\n🏢 Seeding company: ${companyName} (${host})...`);

  // Generate comprehensive permissions for all menu items
  const permissions = generatePermissions();

  console.log(`📝 Creating permissions for ${host}...`);
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: {
        resource_action_companyId: {
          resource: permission.resource,
          action: permission.action,
          companyId,
        },
      },
      update: permission,
      create: {
        ...permission,
        companyId,
      },
    });
  }
  console.log(`✅ Created ${permissions.length} permissions for ${host}`);

  // Create roles
  const roles = [
    {
      name: 'مدير',
      description: 'مدير النظام مع صلاحيات كاملة للوصول إلى جميع الميزات والوظائف',
      isSystem: true,
    },
    {
      name: 'محاسب',
      description: 'محاسب مع صلاحيات الوصول إلى العمليات المالية والتقارير المحاسبية',
      isSystem: true,
    },
    {
      name: 'بائع',
      description: 'بائع مع صلاحيات الوصول إلى عمليات المبيعات والعملاء',
      isSystem: true,
    },
    {
      name: 'مدخل بيانات',
      description: 'مدخل بيانات مع صلاحيات الوصول إلى إدارة المخازن والأصناف',
      isSystem: true,
    },
  ];

  console.log(`👥 Creating roles for ${host}...`);
  for (const role of roles) {
    await prisma.role.upsert({
      where: {
        name_companyId: {
          name: role.name,
          companyId,
        },
      },
      update: role,
      create: {
        ...role,
        companyId,
      },
    });
  }
  console.log(`✅ Created ${roles.length} roles for ${host}`);

  // Get all created roles and permissions for this company
  const createdRoles = await prisma.role.findMany({
    where: { companyId },
  });
  const createdPermissions = await prisma.permission.findMany({
    where: { companyId },
  });

  // Assign permissions to roles based on frontend rolePermissions map
  console.log(`🔗 Assigning permissions to roles for ${host}...`);

  // Manager - all permissions
  const managerRole = createdRoles.find((r) => r.name === 'مدير');
  if (managerRole) {
    for (const permission of createdPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: managerRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: managerRole.id,
          permissionId: permission.id,
        },
      });
    }
    console.log(`✅ Assigned all permissions to Manager role for ${host}`);
  }

  // Accountant - financial operations and reports
  const accountantRole = createdRoles.find((r) => r.name === 'محاسب');
  if (accountantRole) {
    const accountantPermissions = createdPermissions.filter(
      (p) =>
        p.resource === 'dashboard' ||
        p.resource === 'sales' ||
        p.resource === 'pos' ||
        p.resource === 'price_quotation' ||
        p.resource === 'sales_invoice' ||
        p.resource === 'sales_return' ||
        p.resource === 'price_quotation' ||
        p.resource === 'daily_sales' ||
        p.resource === 'daily_sales_returns' ||
        p.resource === 'purchases' ||
        p.resource === 'purchase_invoice' ||
        p.resource === 'purchase_return' ||
        p.resource === 'daily_purchases' ||
        p.resource === 'daily_purchase_returns' ||
        p.resource === 'customers' ||
        p.resource === 'add_customer' ||
        p.resource === 'customers_list' ||
        p.resource === 'suppliers' ||
        p.resource === 'add_supplier' ||
        p.resource === 'suppliers_list' ||
        p.resource === 'general_accounts' ||
        p.resource === 'expenses_management' ||
        p.resource === 'expenses_list' ||
        p.resource === 'expense_codes' ||
        p.resource === 'expense_types' ||
        p.resource === 'revenues_management' ||
        p.resource === 'revenue_codes' ||
        p.resource === 'zatca' ||
        p.resource === 'zatca_upload' ||
        p.resource === 'current_accounts' ||
        p.resource === 'add_current_account' ||
        p.resource === 'current_accounts_list' ||
        p.resource === 'safes' ||
        p.resource === 'banks' ||
        p.resource === 'financials' ||
        p.resource === 'receipt_voucher' ||
        p.resource === 'payment_voucher' ||
        p.resource === 'internal_transfers' ||
        p.resource === 'reports' ||
        p.resource === 'financial_analysis' ||
        p.resource === 'liquidity_report' ||
        p.resource === 'financial_performance_report' ||
        p.resource === 'item_profitability_report' ||
        p.resource === 'debt_aging_report' ||
        p.resource === 'stagnant_items_report' ||
        p.resource === 'vip_customers_report' ||
        p.resource === 'item_reports' ||
        p.resource === 'item_movement_report' ||
        p.resource === 'item_balance_report' ||
        p.resource === 'inventory_valuation_report' ||
        p.resource === 'customer_reports' ||
        p.resource === 'customer_statement_report' ||
        p.resource === 'customer_balance_report' ||
        p.resource === 'supplier_reports' ||
        p.resource === 'supplier_statement_report' ||
        p.resource === 'supplier_balance_report' ||
        p.resource === 'financial_reports' ||
        p.resource === 'daily_collections_report' ||
        p.resource === 'daily_payments_report' ||
        p.resource === 'daily_transfers_report' ||
        p.resource === 'expense_statement_report' ||
        p.resource === 'total_expenses_report' ||
        p.resource === 'general_accounts_reports' ||
        p.resource === 'current_account_statement_report' ||
        p.resource === 'total_current_accounts_report' ||
        p.resource === 'receivable_account_statement_report' ||
        p.resource === 'total_receivable_accounts_report' ||
        p.resource === 'payable_account_statement_report' ||
        p.resource === 'total_payable_accounts_report' ||
        p.resource === 'cash_reports' ||
        p.resource === 'safe_statement_report' ||
        p.resource === 'bank_statement_report' ||
        p.resource === 'tax_reports' ||
        p.resource === 'vat_statement_report' ||
        p.resource === 'tax_declaration_report' ||
        p.resource === 'final_accounts' ||
        p.resource === 'income_statement' ||
        p.resource === 'balance_sheet' ||
        p.resource === 'help_center',
    );

    for (const permission of accountantPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: accountantRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: accountantRole.id,
          permissionId: permission.id,
        },
      });
    }
    console.log(
      `✅ Assigned ${accountantPermissions.length} permissions to Accountant role for ${host}`,
    );
  }

  // Salesperson - sales operations and customers
  const salespersonRole = createdRoles.find((r) => r.name === 'بائع');
  if (salespersonRole) {
    const salespersonPermissions = createdPermissions.filter(
      (p) =>
        p.resource === 'dashboard' ||
        p.resource === 'sales' ||
        p.resource === 'sales_invoice' ||
        p.resource === 'sales_return' ||
        p.resource === 'daily_sales' ||
        p.resource === 'daily_sales_returns' ||
        p.resource === 'customers' ||
        p.resource === 'add_customer' ||
        p.resource === 'customers_list' ||
        (p.resource === 'items' && p.action === 'read') || // Can only read items, not modify
        (p.resource === 'items_list' && p.action === 'read') ||
        (p.resource === 'item_groups' && p.action === 'read') ||
        (p.resource === 'units' && p.action === 'read') ||
        p.resource === 'help_center',
    );

    for (const permission of salespersonPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: salespersonRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: salespersonRole.id,
          permissionId: permission.id,
        },
      });
    }
    console.log(
      `✅ Assigned ${salespersonPermissions.length} permissions to Salesperson role for ${host}`,
    );
  }

  // Data Entry - warehouse operations and items management
  const dataEntryRole = createdRoles.find((r) => r.name === 'مدخل بيانات');
  if (dataEntryRole) {
    const dataEntryPermissions = createdPermissions.filter(
      (p) =>
        p.resource === 'dashboard' ||
        p.resource === 'items' ||
        p.resource === 'add_item' ||
        p.resource === 'items_list' ||
        p.resource === 'item_groups' ||
        p.resource === 'units' ||
        p.resource === 'warehouse_operations' ||
        p.resource === 'store_receipt_voucher' ||
        p.resource === 'store_issue_voucher' ||
        p.resource === 'store_transfer' ||
        p.resource === 'inventory_count' ||
        p.resource === 'help_center',
    );

    for (const permission of dataEntryPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: dataEntryRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: dataEntryRole.id,
          permissionId: permission.id,
        },
      });
    }
    console.log(
      `✅ Assigned ${dataEntryPermissions.length} permissions to Data Entry role for ${host}`,
    );
  }

  // Assign default role to existing users in this company
  console.log(`👤 Assigning default role to existing users for ${host}...`);
  const defaultRole = createdRoles.find((r) => r.name === 'مدير');
  if (defaultRole) {
    await prisma.user.updateMany({
      where: { roleId: null, companyId },
      data: { roleId: defaultRole.id },
    });
    console.log(`✅ Assigned default role to existing users for ${host}`);
  }

  // Get company data for branch creation
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  // Create default branch if none exists
  console.log(`🏪 Creating default branch for ${host}...`);
  let existingBranch = await prisma.branch.findFirst({
    where: { companyId },
  });
  if (!existingBranch) {
    const lastBranchWithCode = await prisma.branch.findFirst({
      where: { companyId },
      select: { code: true },
      orderBy: { code: 'desc' },
    });
    const nextBranchCode = (lastBranchWithCode?.code ?? 0) + 1;
    existingBranch = await prisma.branch.create({
      data: {
        code: nextBranchCode,
        name: 'الفرع الرئيسي',
        address: company?.address || 'العنوان',
        phone: company?.phone || '+966000000000',
        description: 'الفرع الرئيسي للشركة',
        companyId,
      },
    });
    console.log(`✅ Created default branch for ${host}`);
  } else {
    console.log(`✅ Branch already exists for ${host}`);
  }

  // Create expense types
  console.log(`💰 Creating expense types for ${host}...`);
  const expenseTypes = [
    {
      name: 'مصروفات تشغيلية',
      description: 'المصروفات المتعلقة بتشغيل الأعمال اليومية مثل الكهرباء والماء والإنترنت والصيانة',
    },
    {
      name: 'مصروفات تسويقية',
      description: 'المصروفات المتعلقة بالترويج والتسويق للمنتجات والخدمات مثل الإعلانات والمعارض',
    },
    {
      name: 'مصروفات إدارية',
      description: 'المصروفات المتعلقة بالإدارة العامة للشركة مثل الرواتب والمكاتب والتأمينات',
    },
    {
      name: 'مصروفات أخري',
      description: 'المصروفات الأخرى التي لا تنتمي إلى الفئات السابقة',
    },
  ];

  for (const expenseType of expenseTypes) {
    await prisma.expenseType.upsert({
      where: {
        name_companyId: {
          name: expenseType.name,
          companyId,
        },
      },
      update: expenseType,
      create: {
        ...expenseType,
        companyId,
      },
    });
  }
  console.log(`✅ Created ${expenseTypes.length} expense types for ${host}`);

  // Create or update default admin user
  console.log(`👤 Creating/updating default admin user for ${host}...`);
  const existingAdmin = await prisma.user.findUnique({
    where: {
      email_companyId: {
        email: 'admin@stockpro.com',
        companyId,
      },
    },
  });
  let adminUser = existingAdmin;
  
  if (!existingAdmin && existingBranch && managerRole) {
    // Hash the password using bcryptjs with 12 rounds (matching TOKEN_CONSTANTS)
    const hashedPassword = await bcryptjs.hash('Password#1', 12);
    // Next user code - code is unique per company, so find max within company
    const lastUserWithCode = await prisma.user.findFirst({
      where: { companyId },
      select: { code: true },
      orderBy: { code: 'desc' },
    });
    const nextUserCode = (lastUserWithCode?.code ?? 0) + 1;
    
    adminUser = await prisma.user.create({
      data: {
        code: nextUserCode,
        email: 'admin@stockpro.com',
        name: 'مدير النظام',
        password: hashedPassword,
        emailVerified: true,
        active: true,
        roleId: managerRole.id,
        branchId: existingBranch.id,
        companyId,
      },
    });
    console.log(`✅ Created default admin user for ${host}`);
    console.log(`   📧 Email: admin@stockpro.com`);
    console.log(`   🔑 Password: Password#1`);
  } else if (existingAdmin && managerRole) {
    // Ensure admin user has correct branch and role
    adminUser = await prisma.user.update({
      where: {
        email_companyId: {
          email: 'admin@stockpro.com',
          companyId,
        },
      },
      data: {
        branchId: existingBranch.id,
        roleId: managerRole.id,
        active: true,
      },
    });
    console.log(`✅ Updated default admin user for ${host}`);
    console.log(`   📧 Email: admin@stockpro.com`);
    console.log(`   🔑 Password: Password#1`);
  } else {
    console.log(`✅ Admin user already exists for ${host}`);
  }

  // Create default store for the default branch
  console.log(`🏬 Creating default store for ${host}...`);
  if (existingBranch && adminUser) {
    let existingStore = await prisma.store.findUnique({
      where: { branchId: existingBranch.id },
    });

    if (!existingStore) {
      const lastStoreWithCode = await prisma.store.findFirst({
        where: { companyId },
        select: { code: true },
        orderBy: { code: 'desc' },
      });
      const nextStoreCode = (lastStoreWithCode?.code ?? 0) + 1;

      existingStore = await prisma.store.create({
        data: {
          code: nextStoreCode,
          name: 'المخزن الرئيسي',
          address: existingBranch.address,
          phone: existingBranch.phone,
          description: 'المخزن الرئيسي للشركة',
          branchId: existingBranch.id,
          userId: adminUser.id,
          companyId,
        },
      });
      console.log(`✅ Created default store for ${host}`);
    } else {
      console.log(`✅ Store already exists for ${host}`);
    }
  } else {
    console.log(`⚠️ Skipped store creation for ${host} (branch or admin missing)`);
  }

  // Create default safe for the default branch
  console.log(`💼 Creating default safe for ${host}...`);
  if (existingBranch) {
    let existingSafe = await prisma.safe.findUnique({
      where: { branchId: existingBranch.id },
    });

    if (!existingSafe) {
      const lastSafeWithCode = await prisma.safe.findFirst({
        where: { companyId },
        select: { code: true },
        orderBy: { code: 'desc' },
      });

      let nextSafeCode = 'SF-001';
      if (lastSafeWithCode?.code) {
        const match = lastSafeWithCode.code.match(/SF-(\d+)/);
        if (match) {
          const nextNumber = parseInt(match[1], 10) + 1;
          nextSafeCode = `SF-${String(nextNumber).padStart(3, '0')}`;
        }
      }

      existingSafe = await prisma.safe.create({
        data: {
          code: nextSafeCode,
          name: 'الخزنة الرئيسية',
          branchId: existingBranch.id,
          openingBalance: 0,
          currentBalance: 0,
          companyId,
        },
      });
      console.log(`✅ Created default safe for ${host}`);
    } else {
      console.log(`✅ Safe already exists for ${host}`);
    }
  } else {
    console.log(`⚠️ Skipped safe creation for ${host} (branch missing)`);
  }

  console.log(`✅ Completed seeding for ${companyName} (${host})\n`);
}

async function main() {
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL environment variable is not set!');
    console.error('Please set DATABASE_URL in your .env file or environment variables.');
    console.error('Example: DATABASE_URL="postgresql://user:password@localhost:5432/dbname"');
    process.exit(1);
  }

  console.log('🌱 Starting test seed process for three companies...\n');

  // Define three companies
  const companies = [
    { host: 'localhost', name: 'اسم الشركة' },
    { host: 'firsthost', name: 'الشركة الأولى' },
    { host: 'secondhost', name: 'الشركة الثانية' },
  ];

  // Create or get each company and seed it
  for (const companyConfig of companies) {
    console.log(`🏢 Creating/Getting company: ${companyConfig.name} (${companyConfig.host})...`);
    
    let company = await prisma.company.findUnique({
      where: { host: companyConfig.host },
    });
    
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: companyConfig.name,
          activity: 'النشاط التجاري',
          address: 'العنوان',
          phone: '+966000000000',
          taxNumber: '000000000000003',
          commercialReg: '0000000000',
          currency: 'SAR',
          capital: 0,
          vatRate: 15,
          isVatEnabled: true,
          host: companyConfig.host,
        },
      });
      console.log(`✅ Created company: ${companyConfig.name} (${companyConfig.host})`);
    } else {
      console.log(`✅ Company already exists: ${companyConfig.name} (${companyConfig.host})`);
    }

    // Seed the company
    await seedCompany(company.id, companyConfig.host, companyConfig.name);
  }

  console.log('🎉 Test seed process completed successfully for all three companies!');
}

main()
  .catch((e) => {
    console.error('❌ Test seed process failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

