import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed process...');

  // Create permissions
  const permissions = [
    // Dashboard
    { resource: 'dashboard', action: 'view', description: 'View dashboard' },
    
    // Sales
    { resource: 'sales', action: 'view', description: 'View sales module' },
    { resource: 'sales_invoice', action: 'create', description: 'Create sales invoice' },
    { resource: 'sales_invoice', action: 'read', description: 'View sales invoices' },
    { resource: 'sales_invoice', action: 'update', description: 'Update sales invoices' },
    { resource: 'sales_invoice', action: 'delete', description: 'Delete sales invoices' },
    { resource: 'sales_return', action: 'create', description: 'Create sales return' },
    { resource: 'sales_return', action: 'read', description: 'View sales returns' },
    { resource: 'sales_return', action: 'update', description: 'Update sales returns' },
    { resource: 'sales_return', action: 'delete', description: 'Delete sales returns' },
    { resource: 'daily_sales', action: 'view', description: 'View daily sales reports' },
    { resource: 'daily_sales_returns', action: 'view', description: 'View daily sales returns reports' },
    
    // Purchases
    { resource: 'purchases', action: 'view', description: 'View purchases module' },
    { resource: 'purchase_invoice', action: 'create', description: 'Create purchase invoice' },
    { resource: 'purchase_invoice', action: 'read', description: 'View purchase invoices' },
    { resource: 'purchase_invoice', action: 'update', description: 'Update purchase invoices' },
    { resource: 'purchase_invoice', action: 'delete', description: 'Delete purchase invoices' },
    { resource: 'purchase_return', action: 'create', description: 'Create purchase return' },
    { resource: 'purchase_return', action: 'read', description: 'View purchase returns' },
    { resource: 'purchase_return', action: 'update', description: 'Update purchase returns' },
    { resource: 'purchase_return', action: 'delete', description: 'Delete purchase returns' },
    { resource: 'daily_purchases', action: 'view', description: 'View daily purchases reports' },
    { resource: 'daily_purchase_returns', action: 'view', description: 'View daily purchase returns reports' },
    
    // Items
    { resource: 'items', action: 'view', description: 'View items module' },
    { resource: 'items', action: 'create', description: 'Create items' },
    { resource: 'items', action: 'read', description: 'View items' },
    { resource: 'items', action: 'update', description: 'Update items' },
    { resource: 'items', action: 'delete', description: 'Delete items' },
    { resource: 'item_groups', action: 'manage', description: 'Manage item groups' },
    { resource: 'units', action: 'manage', description: 'Manage units' },
    
    // Warehouse Operations
    { resource: 'warehouse', action: 'view', description: 'View warehouse operations' },
    { resource: 'store_receipt_voucher', action: 'create', description: 'Create store receipt voucher' },
    { resource: 'store_receipt_voucher', action: 'read', description: 'View store receipt vouchers' },
    { resource: 'store_receipt_voucher', action: 'update', description: 'Update store receipt vouchers' },
    { resource: 'store_receipt_voucher', action: 'delete', description: 'Delete store receipt vouchers' },
    { resource: 'store_issue_voucher', action: 'create', description: 'Create store issue voucher' },
    { resource: 'store_issue_voucher', action: 'read', description: 'View store issue vouchers' },
    { resource: 'store_issue_voucher', action: 'update', description: 'Update store issue vouchers' },
    { resource: 'store_issue_voucher', action: 'delete', description: 'Delete store issue vouchers' },
    { resource: 'store_transfer', action: 'create', description: 'Create store transfer' },
    { resource: 'store_transfer', action: 'read', description: 'View store transfers' },
    { resource: 'store_transfer', action: 'update', description: 'Update store transfers' },
    { resource: 'store_transfer', action: 'delete', description: 'Delete store transfers' },
    
    // Customers
    { resource: 'customers', action: 'view', description: 'View customers module' },
    { resource: 'customers', action: 'create', description: 'Create customers' },
    { resource: 'customers', action: 'read', description: 'View customers' },
    { resource: 'customers', action: 'update', description: 'Update customers' },
    { resource: 'customers', action: 'delete', description: 'Delete customers' },
    
    // Suppliers
    { resource: 'suppliers', action: 'view', description: 'View suppliers module' },
    { resource: 'suppliers', action: 'create', description: 'Create suppliers' },
    { resource: 'suppliers', action: 'read', description: 'View suppliers' },
    { resource: 'suppliers', action: 'update', description: 'Update suppliers' },
    { resource: 'suppliers', action: 'delete', description: 'Delete suppliers' },
    
    // Financials
    { resource: 'financials', action: 'view', description: 'View financials module' },
    { resource: 'receipt_voucher', action: 'create', description: 'Create receipt voucher' },
    { resource: 'receipt_voucher', action: 'read', description: 'View receipt vouchers' },
    { resource: 'receipt_voucher', action: 'update', description: 'Update receipt vouchers' },
    { resource: 'receipt_voucher', action: 'delete', description: 'Delete receipt vouchers' },
    { resource: 'payment_voucher', action: 'create', description: 'Create payment voucher' },
    { resource: 'payment_voucher', action: 'read', description: 'View payment vouchers' },
    { resource: 'payment_voucher', action: 'update', description: 'Update payment vouchers' },
    { resource: 'payment_voucher', action: 'delete', description: 'Delete payment vouchers' },
    { resource: 'expenses', action: 'manage', description: 'Manage expenses' },
    { resource: 'current_accounts', action: 'manage', description: 'Manage current accounts' },
    { resource: 'safes', action: 'manage', description: 'Manage safes' },
    { resource: 'banks', action: 'manage', description: 'Manage banks' },
    
    // Reports
    { resource: 'reports', action: 'view', description: 'View reports module' },
    { resource: 'item_reports', action: 'view', description: 'View item reports' },
    { resource: 'customer_reports', action: 'view', description: 'View customer reports' },
    { resource: 'supplier_reports', action: 'view', description: 'View supplier reports' },
    { resource: 'financial_reports', action: 'view', description: 'View financial reports' },
    
    // Final Accounts
    { resource: 'final_accounts', action: 'view', description: 'View final accounts' },
    { resource: 'income_statement', action: 'view', description: 'View income statement' },
    { resource: 'balance_sheet', action: 'view', description: 'View balance sheet' },
    
    // Settings
    { resource: 'settings', action: 'view', description: 'View settings' },
    { resource: 'company_data', action: 'manage', description: 'Manage company data' },
    { resource: 'branches', action: 'manage', description: 'Manage branches' },
    { resource: 'stores', action: 'manage', description: 'Manage stores' },
    { resource: 'users', action: 'manage', description: 'Manage users' },
    { resource: 'permissions', action: 'manage', description: 'Manage permissions' },
    { resource: 'roles', action: 'manage', description: 'Manage roles' },
  ];

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
  const managerRole = createdRoles.find(r => r.name === 'manager');
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

  // Accountant - financial operations
  const accountantRole = createdRoles.find(r => r.name === 'accountant');
  if (accountantRole) {
    const accountantPermissions = createdPermissions.filter(p => 
      p.resource === 'dashboard' ||
      p.resource === 'sales' || p.resource === 'sales_invoice' || p.resource === 'sales_return' || 
      p.resource === 'daily_sales' || p.resource === 'daily_sales_returns' ||
      p.resource === 'purchases' || p.resource === 'purchase_invoice' || p.resource === 'purchase_return' ||
      p.resource === 'daily_purchases' || p.resource === 'daily_purchase_returns' ||
      p.resource === 'customers' || p.resource === 'suppliers' ||
      p.resource === 'financials' || p.resource === 'receipt_voucher' || p.resource === 'payment_voucher' ||
      p.resource === 'expenses' || p.resource === 'current_accounts' || p.resource === 'safes' || p.resource === 'banks' ||
      p.resource === 'reports' || p.resource === 'financial_reports' ||
      p.resource === 'final_accounts' || p.resource === 'income_statement' || p.resource === 'balance_sheet'
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
    console.log(`✅ Assigned ${accountantPermissions.length} permissions to Accountant role`);
  }

  // Salesperson - sales operations
  const salespersonRole = createdRoles.find(r => r.name === 'salesperson');
  if (salespersonRole) {
    const salespersonPermissions = createdPermissions.filter(p => 
      p.resource === 'dashboard' ||
      p.resource === 'sales_invoice' || p.resource === 'sales_return' || p.resource === 'daily_sales' ||
      p.resource === 'customers' ||
      p.resource === 'items' && p.action === 'read' // Can only read items, not modify
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
    console.log(`✅ Assigned ${salespersonPermissions.length} permissions to Salesperson role`);
  }

  // Data Entry - warehouse and items
  const dataEntryRole = createdRoles.find(r => r.name === 'data_entry');
  if (dataEntryRole) {
    const dataEntryPermissions = createdPermissions.filter(p => 
      p.resource === 'dashboard' ||
      p.resource === 'items' ||
      p.resource === 'warehouse' || p.resource === 'store_receipt_voucher' || 
      p.resource === 'store_issue_voucher' || p.resource === 'store_transfer' ||
      p.resource === 'item_groups' || p.resource === 'units'
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
    console.log(`✅ Assigned ${dataEntryPermissions.length} permissions to Data Entry role`);
  }

  // Assign default role to existing users
  console.log('👤 Assigning default role to existing users...');
  const defaultRole = createdRoles.find(r => r.name === 'manager');
  if (defaultRole) {
    await prisma.user.updateMany({
      where: { roleId: null },
      data: { roleId: defaultRole.id },
    });
    console.log('✅ Assigned default role to existing users');
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
