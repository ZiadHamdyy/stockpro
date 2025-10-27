import { PrismaClient } from '@prisma/client';
import * as bcryptjs from 'bcryptjs';

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
      { key: 'branches_data', label: 'بيانات الفروع' },
      { key: 'stores_data', label: 'بيانات المخازن' },
      { key: 'users_data', label: 'بيانات المستخدمين' },
      { key: 'permissions', label: 'الصلاحيات' },
      {
        key: 'database',
        label: 'قاعدة البيانات',
        children: [{ key: 'database_backup', label: 'نسخة احتياطية' }],
      },
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
    ],
  },
  {
    key: 'sales',
    label: 'المبيعات',
    children: [
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
    key: 'financials',
    label: 'الحركة المالية',
    children: [
      { key: 'receipt_voucher', label: 'سند قبض' },
      { key: 'payment_voucher', label: 'سند صرف' },
    ],
  },
  {
    key: 'reports',
    label: 'التقارير',
    children: [
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
          { key: 'expense_statement_report', label: 'كشف حساب مصروفات' },
          { key: 'total_expenses_report', label: 'إجمالي المصروفات' },
          { key: 'current_account_statement_report', label: 'كشف حساب جاري' },
          {
            key: 'total_current_accounts_report',
            label: 'إجمالي الحسابات الجارية',
          },
          { key: 'safe_statement_report', label: 'كشف حساب خزينة' },
          { key: 'bank_statement_report', label: 'كشف حساب بنك' },
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
];

// Actions available for each resource
const PERMISSION_ACTIONS = [
  'read',
  'create',
  'update',
  'delete',
  'search',
  'print',
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

async function main() {
  console.log('🌱 Starting seed process...');

  // Generate comprehensive permissions for all menu items
  const permissions = generatePermissions();

  console.log('📝 Creating permissions...');
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: {
        resource_action: {
          resource: permission.resource,
          action: permission.action,
        },
      },
      update: permission,
      create: permission,
    });
  }
  console.log(`✅ Created ${permissions.length} permissions`);

  // Create roles
  const roles = [
    {
      name: 'manager',
      description: 'System administrator with full access to all features',
      isSystem: true,
    },
    {
      name: 'accountant',
      description: 'Accountant with access to financial operations',
      isSystem: true,
    },
    {
      name: 'salesperson',
      description: 'Salesperson with access to sales operations',
      isSystem: true,
    },
    {
      name: 'data_entry',
      description: 'Data entry operator with access to warehouse and items',
      isSystem: true,
    },
  ];

  console.log('👥 Creating roles...');
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: role,
      create: role,
    });
  }
  console.log(`✅ Created ${roles.length} roles`);

  // Get all created roles and permissions
  const createdRoles = await prisma.role.findMany();
  const createdPermissions = await prisma.permission.findMany();

  // Assign permissions to roles based on frontend rolePermissions map
  console.log('🔗 Assigning permissions to roles...');

  // Manager - all permissions
  const managerRole = createdRoles.find((r) => r.name === 'manager');
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
    console.log('✅ Assigned all permissions to Manager role');
  }

  // Accountant - financial operations and reports
  const accountantRole = createdRoles.find((r) => r.name === 'accountant');
  if (accountantRole) {
    const accountantPermissions = createdPermissions.filter(
      (p) =>
        p.resource === 'dashboard' ||
        p.resource === 'sales' ||
        p.resource === 'sales_invoice' ||
        p.resource === 'sales_return' ||
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
        p.resource === 'current_accounts' ||
        p.resource === 'add_current_account' ||
        p.resource === 'current_accounts_list' ||
        p.resource === 'safes' ||
        p.resource === 'banks' ||
        p.resource === 'financials' ||
        p.resource === 'receipt_voucher' ||
        p.resource === 'payment_voucher' ||
        p.resource === 'reports' ||
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
        p.resource === 'expense_statement_report' ||
        p.resource === 'total_expenses_report' ||
        p.resource === 'current_account_statement_report' ||
        p.resource === 'total_current_accounts_report' ||
        p.resource === 'safe_statement_report' ||
        p.resource === 'bank_statement_report' ||
        p.resource === 'tax_declaration_report' ||
        p.resource === 'final_accounts' ||
        p.resource === 'income_statement' ||
        p.resource === 'balance_sheet',
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
      `✅ Assigned ${accountantPermissions.length} permissions to Accountant role`,
    );
  }

  // Salesperson - sales operations and customers
  const salespersonRole = createdRoles.find((r) => r.name === 'salesperson');
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
        (p.resource === 'units' && p.action === 'read'),
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
      `✅ Assigned ${salespersonPermissions.length} permissions to Salesperson role`,
    );
  }

  // Data Entry - warehouse operations and items management
  const dataEntryRole = createdRoles.find((r) => r.name === 'data_entry');
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
        p.resource === 'store_transfer',
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
      `✅ Assigned ${dataEntryPermissions.length} permissions to Data Entry role`,
    );
  }

  // Assign default role to existing users
  console.log('👤 Assigning default role to existing users...');
  const defaultRole = createdRoles.find((r) => r.name === 'manager');
  if (defaultRole) {
    await prisma.user.updateMany({
      where: { roleId: null },
      data: { roleId: defaultRole.id },
    });
    console.log('✅ Assigned default role to existing users');
  }

  // Create default company
  console.log('🏢 Creating default company...');
  let existingCompany = await prisma.company.findFirst();
  if (!existingCompany) {
    existingCompany = await prisma.company.create({
      data: {
        name: 'اسم الشركة',
        activity: 'النشاط التجاري',
        address: 'العنوان',
        phone: '+966000000000',
        taxNumber: '000000000000003',
        commercialReg: '0000000000',
        currency: 'SAR',
        capital: 0,
        vatRate: 15,
        isVatEnabled: true,
      },
    });
    console.log('✅ Created default company');
  } else {
    console.log('✅ Company already exists');
  }

  // Get or fetch the company for branch creation
  const company = await prisma.company.findFirst();

  // Create default branch if none exists
  console.log('🏪 Creating default branch...');
  let existingBranch = await prisma.branch.findFirst();
  if (!existingBranch) {
    existingBranch = await prisma.branch.create({
      data: {
        name: 'الفرع الرئيسي',
        address: company?.address || 'العنوان',
        phone: company?.phone || '+966000000000',
        description: 'الفرع الرئيسي للشركة',
      },
    });
    console.log('✅ Created default branch');
  } else {
    console.log('✅ Branch already exists');
  }

  // Create or update default admin user
  console.log('👤 Creating/updating default admin user...');
  const existingAdmin = await prisma.user.findFirst({
    where: { email: 'admin@stockpro.com' },
  });
  
  if (!existingAdmin && existingBranch && managerRole) {
    // Hash the password using bcryptjs with 12 rounds (matching TOKEN_CONSTANTS)
    const hashedPassword = await bcryptjs.hash('Password#1', 12);
    
    await prisma.user.create({
      data: {
        email: 'admin@stockpro.com',
        name: 'مدير النظام',
        password: hashedPassword,
        emailVerified: true,
        active: true,
        roleId: managerRole.id,
        branchId: existingBranch.id,
      },
    });
    console.log('✅ Created default admin user');
    console.log('   📧 Email: admin@stockpro.com');
    console.log('   🔑 Password: Password#1');
  } else if (existingAdmin && managerRole) {
    // Ensure admin user has correct branch and role
    await prisma.user.update({
      where: { email: 'admin@stockpro.com' },
      data: {
        branchId: existingBranch.id,
        roleId: managerRole.id,
        active: true,
      },
    });
    console.log('✅ Updated default admin user');
    console.log('   📧 Email: admin@stockpro.com');
    console.log('   🔑 Password: Password#1');
  } else {
    console.log('✅ Admin user already exists');
  }

  console.log('🎉 Seed process completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed process failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
