import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed process...');

  // Create comprehensive permissions for all menu items
  const permissions = [
    // Dashboard
    { resource: 'dashboard', action: 'read', description: 'View dashboard' },
    {
      resource: 'dashboard',
      action: 'create',
      description: 'Create dashboard items',
    },
    {
      resource: 'dashboard',
      action: 'update',
      description: 'Update dashboard',
    },
    {
      resource: 'dashboard',
      action: 'delete',
      description: 'Delete dashboard items',
    },
    {
      resource: 'dashboard',
      action: 'search',
      description: 'Search dashboard',
    },
    { resource: 'dashboard', action: 'print', description: 'Print dashboard' },

    // Settings Module
    { resource: 'settings', action: 'read', description: 'View settings' },
    { resource: 'settings', action: 'create', description: 'Create settings' },
    { resource: 'settings', action: 'update', description: 'Update settings' },
    { resource: 'settings', action: 'delete', description: 'Delete settings' },
    { resource: 'settings', action: 'search', description: 'Search settings' },
    { resource: 'settings', action: 'print', description: 'Print settings' },

    // Company Data
    {
      resource: 'company_data',
      action: 'read',
      description: 'View company data',
    },
    {
      resource: 'company_data',
      action: 'create',
      description: 'Create company data',
    },
    {
      resource: 'company_data',
      action: 'update',
      description: 'Update company data',
    },
    {
      resource: 'company_data',
      action: 'delete',
      description: 'Delete company data',
    },
    {
      resource: 'company_data',
      action: 'search',
      description: 'Search company data',
    },
    {
      resource: 'company_data',
      action: 'print',
      description: 'Print company data',
    },

    // Branches Data
    {
      resource: 'branches_data',
      action: 'read',
      description: 'View branches data',
    },
    {
      resource: 'branches_data',
      action: 'create',
      description: 'Create branches data',
    },
    {
      resource: 'branches_data',
      action: 'update',
      description: 'Update branches data',
    },
    {
      resource: 'branches_data',
      action: 'delete',
      description: 'Delete branches data',
    },
    {
      resource: 'branches_data',
      action: 'search',
      description: 'Search branches data',
    },
    {
      resource: 'branches_data',
      action: 'print',
      description: 'Print branches data',
    },

    // Stores Data
    {
      resource: 'stores_data',
      action: 'read',
      description: 'View stores data',
    },
    {
      resource: 'stores_data',
      action: 'create',
      description: 'Create stores data',
    },
    {
      resource: 'stores_data',
      action: 'update',
      description: 'Update stores data',
    },
    {
      resource: 'stores_data',
      action: 'delete',
      description: 'Delete stores data',
    },
    {
      resource: 'stores_data',
      action: 'search',
      description: 'Search stores data',
    },
    {
      resource: 'stores_data',
      action: 'print',
      description: 'Print stores data',
    },

    // Users Data
    { resource: 'users_data', action: 'read', description: 'View users data' },
    {
      resource: 'users_data',
      action: 'create',
      description: 'Create users data',
    },
    {
      resource: 'users_data',
      action: 'update',
      description: 'Update users data',
    },
    {
      resource: 'users_data',
      action: 'delete',
      description: 'Delete users data',
    },
    {
      resource: 'users_data',
      action: 'search',
      description: 'Search users data',
    },
    {
      resource: 'users_data',
      action: 'print',
      description: 'Print users data',
    },

    // Permissions
    {
      resource: 'permissions',
      action: 'read',
      description: 'View permissions',
    },
    {
      resource: 'permissions',
      action: 'create',
      description: 'Create permissions',
    },
    {
      resource: 'permissions',
      action: 'update',
      description: 'Update permissions',
    },
    {
      resource: 'permissions',
      action: 'delete',
      description: 'Delete permissions',
    },
    {
      resource: 'permissions',
      action: 'search',
      description: 'Search permissions',
    },
    {
      resource: 'permissions',
      action: 'print',
      description: 'Print permissions',
    },

    // Roles
    {
      resource: 'roles',
      action: 'read',
      description: 'View roles',
    },
    {
      resource: 'roles',
      action: 'create',
      description: 'Create roles',
    },
    {
      resource: 'roles',
      action: 'update',
      description: 'Update roles',
    },
    {
      resource: 'roles',
      action: 'delete',
      description: 'Delete roles',
    },
    {
      resource: 'roles',
      action: 'search',
      description: 'Search roles',
    },
    {
      resource: 'roles',
      action: 'print',
      description: 'Print roles',
    },

    // Database
    { resource: 'database', action: 'read', description: 'View database' },
    { resource: 'database', action: 'create', description: 'Create database' },
    { resource: 'database', action: 'update', description: 'Update database' },
    { resource: 'database', action: 'delete', description: 'Delete database' },
    { resource: 'database', action: 'search', description: 'Search database' },
    { resource: 'database', action: 'print', description: 'Print database' },

    // Database Backup
    {
      resource: 'database_backup',
      action: 'read',
      description: 'View database backup',
    },
    {
      resource: 'database_backup',
      action: 'create',
      description: 'Create database backup',
    },
    {
      resource: 'database_backup',
      action: 'update',
      description: 'Update database backup',
    },
    {
      resource: 'database_backup',
      action: 'delete',
      description: 'Delete database backup',
    },
    {
      resource: 'database_backup',
      action: 'search',
      description: 'Search database backup',
    },
    {
      resource: 'database_backup',
      action: 'print',
      description: 'Print database backup',
    },

    // Items Module
    { resource: 'items', action: 'read', description: 'View items' },
    { resource: 'items', action: 'create', description: 'Create items' },
    { resource: 'items', action: 'update', description: 'Update items' },
    { resource: 'items', action: 'delete', description: 'Delete items' },
    { resource: 'items', action: 'search', description: 'Search items' },
    { resource: 'items', action: 'print', description: 'Print items' },

    // Add Item
    { resource: 'add_item', action: 'read', description: 'View add item' },
    { resource: 'add_item', action: 'create', description: 'Create add item' },
    { resource: 'add_item', action: 'update', description: 'Update add item' },
    { resource: 'add_item', action: 'delete', description: 'Delete add item' },
    { resource: 'add_item', action: 'search', description: 'Search add item' },
    { resource: 'add_item', action: 'print', description: 'Print add item' },

    // Items List
    { resource: 'items_list', action: 'read', description: 'View items list' },
    {
      resource: 'items_list',
      action: 'create',
      description: 'Create items list',
    },
    {
      resource: 'items_list',
      action: 'update',
      description: 'Update items list',
    },
    {
      resource: 'items_list',
      action: 'delete',
      description: 'Delete items list',
    },
    {
      resource: 'items_list',
      action: 'search',
      description: 'Search items list',
    },
    {
      resource: 'items_list',
      action: 'print',
      description: 'Print items list',
    },

    // Item Groups
    {
      resource: 'item_groups',
      action: 'read',
      description: 'View item groups',
    },
    {
      resource: 'item_groups',
      action: 'create',
      description: 'Create item groups',
    },
    {
      resource: 'item_groups',
      action: 'update',
      description: 'Update item groups',
    },
    {
      resource: 'item_groups',
      action: 'delete',
      description: 'Delete item groups',
    },
    {
      resource: 'item_groups',
      action: 'search',
      description: 'Search item groups',
    },
    {
      resource: 'item_groups',
      action: 'print',
      description: 'Print item groups',
    },

    // Units
    { resource: 'units', action: 'read', description: 'View units' },
    { resource: 'units', action: 'create', description: 'Create units' },
    { resource: 'units', action: 'update', description: 'Update units' },
    { resource: 'units', action: 'delete', description: 'Delete units' },
    { resource: 'units', action: 'search', description: 'Search units' },
    { resource: 'units', action: 'print', description: 'Print units' },

    // Warehouse Operations Module
    {
      resource: 'warehouse_operations',
      action: 'read',
      description: 'View warehouse operations',
    },
    {
      resource: 'warehouse_operations',
      action: 'create',
      description: 'Create warehouse operations',
    },
    {
      resource: 'warehouse_operations',
      action: 'update',
      description: 'Update warehouse operations',
    },
    {
      resource: 'warehouse_operations',
      action: 'delete',
      description: 'Delete warehouse operations',
    },
    {
      resource: 'warehouse_operations',
      action: 'search',
      description: 'Search warehouse operations',
    },
    {
      resource: 'warehouse_operations',
      action: 'print',
      description: 'Print warehouse operations',
    },

    // Store Receipt Voucher
    {
      resource: 'store_receipt_voucher',
      action: 'read',
      description: 'View store receipt vouchers',
    },
    {
      resource: 'store_receipt_voucher',
      action: 'create',
      description: 'Create store receipt vouchers',
    },
    {
      resource: 'store_receipt_voucher',
      action: 'update',
      description: 'Update store receipt vouchers',
    },
    {
      resource: 'store_receipt_voucher',
      action: 'delete',
      description: 'Delete store receipt vouchers',
    },
    {
      resource: 'store_receipt_voucher',
      action: 'search',
      description: 'Search store receipt vouchers',
    },
    {
      resource: 'store_receipt_voucher',
      action: 'print',
      description: 'Print store receipt vouchers',
    },

    // Store Issue Voucher
    {
      resource: 'store_issue_voucher',
      action: 'read',
      description: 'View store issue vouchers',
    },
    {
      resource: 'store_issue_voucher',
      action: 'create',
      description: 'Create store issue vouchers',
    },
    {
      resource: 'store_issue_voucher',
      action: 'update',
      description: 'Update store issue vouchers',
    },
    {
      resource: 'store_issue_voucher',
      action: 'delete',
      description: 'Delete store issue vouchers',
    },
    {
      resource: 'store_issue_voucher',
      action: 'search',
      description: 'Search store issue vouchers',
    },
    {
      resource: 'store_issue_voucher',
      action: 'print',
      description: 'Print store issue vouchers',
    },

    // Store Transfer
    {
      resource: 'store_transfer',
      action: 'read',
      description: 'View store transfers',
    },
    {
      resource: 'store_transfer',
      action: 'create',
      description: 'Create store transfers',
    },
    {
      resource: 'store_transfer',
      action: 'update',
      description: 'Update store transfers',
    },
    {
      resource: 'store_transfer',
      action: 'delete',
      description: 'Delete store transfers',
    },
    {
      resource: 'store_transfer',
      action: 'search',
      description: 'Search store transfers',
    },
    {
      resource: 'store_transfer',
      action: 'print',
      description: 'Print store transfers',
    },

    // Sales Module
    { resource: 'sales', action: 'read', description: 'View sales module' },
    { resource: 'sales', action: 'create', description: 'Create sales' },
    { resource: 'sales', action: 'update', description: 'Update sales' },
    { resource: 'sales', action: 'delete', description: 'Delete sales' },
    { resource: 'sales', action: 'search', description: 'Search sales' },
    { resource: 'sales', action: 'print', description: 'Print sales' },

    // Sales Invoice
    {
      resource: 'sales_invoice',
      action: 'read',
      description: 'View sales invoices',
    },
    {
      resource: 'sales_invoice',
      action: 'create',
      description: 'Create sales invoices',
    },
    {
      resource: 'sales_invoice',
      action: 'update',
      description: 'Update sales invoices',
    },
    {
      resource: 'sales_invoice',
      action: 'delete',
      description: 'Delete sales invoices',
    },
    {
      resource: 'sales_invoice',
      action: 'search',
      description: 'Search sales invoices',
    },
    {
      resource: 'sales_invoice',
      action: 'print',
      description: 'Print sales invoices',
    },

    // Sales Return
    {
      resource: 'sales_return',
      action: 'read',
      description: 'View sales returns',
    },
    {
      resource: 'sales_return',
      action: 'create',
      description: 'Create sales returns',
    },
    {
      resource: 'sales_return',
      action: 'update',
      description: 'Update sales returns',
    },
    {
      resource: 'sales_return',
      action: 'delete',
      description: 'Delete sales returns',
    },
    {
      resource: 'sales_return',
      action: 'search',
      description: 'Search sales returns',
    },
    {
      resource: 'sales_return',
      action: 'print',
      description: 'Print sales returns',
    },

    // Daily Sales
    {
      resource: 'daily_sales',
      action: 'read',
      description: 'View daily sales',
    },
    {
      resource: 'daily_sales',
      action: 'create',
      description: 'Create daily sales',
    },
    {
      resource: 'daily_sales',
      action: 'update',
      description: 'Update daily sales',
    },
    {
      resource: 'daily_sales',
      action: 'delete',
      description: 'Delete daily sales',
    },
    {
      resource: 'daily_sales',
      action: 'search',
      description: 'Search daily sales',
    },
    {
      resource: 'daily_sales',
      action: 'print',
      description: 'Print daily sales',
    },

    // Daily Sales Returns
    {
      resource: 'daily_sales_returns',
      action: 'read',
      description: 'View daily sales returns',
    },
    {
      resource: 'daily_sales_returns',
      action: 'create',
      description: 'Create daily sales returns',
    },
    {
      resource: 'daily_sales_returns',
      action: 'update',
      description: 'Update daily sales returns',
    },
    {
      resource: 'daily_sales_returns',
      action: 'delete',
      description: 'Delete daily sales returns',
    },
    {
      resource: 'daily_sales_returns',
      action: 'search',
      description: 'Search daily sales returns',
    },
    {
      resource: 'daily_sales_returns',
      action: 'print',
      description: 'Print daily sales returns',
    },

    // Purchases Module
    {
      resource: 'purchases',
      action: 'read',
      description: 'View purchases module',
    },
    {
      resource: 'purchases',
      action: 'create',
      description: 'Create purchases',
    },
    {
      resource: 'purchases',
      action: 'update',
      description: 'Update purchases',
    },
    {
      resource: 'purchases',
      action: 'delete',
      description: 'Delete purchases',
    },
    {
      resource: 'purchases',
      action: 'search',
      description: 'Search purchases',
    },
    { resource: 'purchases', action: 'print', description: 'Print purchases' },

    // Purchase Invoice
    {
      resource: 'purchase_invoice',
      action: 'read',
      description: 'View purchase invoices',
    },
    {
      resource: 'purchase_invoice',
      action: 'create',
      description: 'Create purchase invoices',
    },
    {
      resource: 'purchase_invoice',
      action: 'update',
      description: 'Update purchase invoices',
    },
    {
      resource: 'purchase_invoice',
      action: 'delete',
      description: 'Delete purchase invoices',
    },
    {
      resource: 'purchase_invoice',
      action: 'search',
      description: 'Search purchase invoices',
    },
    {
      resource: 'purchase_invoice',
      action: 'print',
      description: 'Print purchase invoices',
    },

    // Purchase Return
    {
      resource: 'purchase_return',
      action: 'read',
      description: 'View purchase returns',
    },
    {
      resource: 'purchase_return',
      action: 'create',
      description: 'Create purchase returns',
    },
    {
      resource: 'purchase_return',
      action: 'update',
      description: 'Update purchase returns',
    },
    {
      resource: 'purchase_return',
      action: 'delete',
      description: 'Delete purchase returns',
    },
    {
      resource: 'purchase_return',
      action: 'search',
      description: 'Search purchase returns',
    },
    {
      resource: 'purchase_return',
      action: 'print',
      description: 'Print purchase returns',
    },

    // Daily Purchases
    {
      resource: 'daily_purchases',
      action: 'read',
      description: 'View daily purchases',
    },
    {
      resource: 'daily_purchases',
      action: 'create',
      description: 'Create daily purchases',
    },
    {
      resource: 'daily_purchases',
      action: 'update',
      description: 'Update daily purchases',
    },
    {
      resource: 'daily_purchases',
      action: 'delete',
      description: 'Delete daily purchases',
    },
    {
      resource: 'daily_purchases',
      action: 'search',
      description: 'Search daily purchases',
    },
    {
      resource: 'daily_purchases',
      action: 'print',
      description: 'Print daily purchases',
    },

    // Daily Purchase Returns
    {
      resource: 'daily_purchase_returns',
      action: 'read',
      description: 'View daily purchase returns',
    },
    {
      resource: 'daily_purchase_returns',
      action: 'create',
      description: 'Create daily purchase returns',
    },
    {
      resource: 'daily_purchase_returns',
      action: 'update',
      description: 'Update daily purchase returns',
    },
    {
      resource: 'daily_purchase_returns',
      action: 'delete',
      description: 'Delete daily purchase returns',
    },
    {
      resource: 'daily_purchase_returns',
      action: 'search',
      description: 'Search daily purchase returns',
    },
    {
      resource: 'daily_purchase_returns',
      action: 'print',
      description: 'Print daily purchase returns',
    },

    // Customers Module
    { resource: 'customers', action: 'read', description: 'View customers' },
    {
      resource: 'customers',
      action: 'create',
      description: 'Create customers',
    },
    {
      resource: 'customers',
      action: 'update',
      description: 'Update customers',
    },
    {
      resource: 'customers',
      action: 'delete',
      description: 'Delete customers',
    },
    {
      resource: 'customers',
      action: 'search',
      description: 'Search customers',
    },
    { resource: 'customers', action: 'print', description: 'Print customers' },

    // Add Customer
    {
      resource: 'add_customer',
      action: 'read',
      description: 'View add customer',
    },
    {
      resource: 'add_customer',
      action: 'create',
      description: 'Create add customer',
    },
    {
      resource: 'add_customer',
      action: 'update',
      description: 'Update add customer',
    },
    {
      resource: 'add_customer',
      action: 'delete',
      description: 'Delete add customer',
    },
    {
      resource: 'add_customer',
      action: 'search',
      description: 'Search add customer',
    },
    {
      resource: 'add_customer',
      action: 'print',
      description: 'Print add customer',
    },

    // Customers List
    {
      resource: 'customers_list',
      action: 'read',
      description: 'View customers list',
    },
    {
      resource: 'customers_list',
      action: 'create',
      description: 'Create customers list',
    },
    {
      resource: 'customers_list',
      action: 'update',
      description: 'Update customers list',
    },
    {
      resource: 'customers_list',
      action: 'delete',
      description: 'Delete customers list',
    },
    {
      resource: 'customers_list',
      action: 'search',
      description: 'Search customers list',
    },
    {
      resource: 'customers_list',
      action: 'print',
      description: 'Print customers list',
    },

    // Suppliers Module
    { resource: 'suppliers', action: 'read', description: 'View suppliers' },
    {
      resource: 'suppliers',
      action: 'create',
      description: 'Create suppliers',
    },
    {
      resource: 'suppliers',
      action: 'update',
      description: 'Update suppliers',
    },
    {
      resource: 'suppliers',
      action: 'delete',
      description: 'Delete suppliers',
    },
    {
      resource: 'suppliers',
      action: 'search',
      description: 'Search suppliers',
    },
    { resource: 'suppliers', action: 'print', description: 'Print suppliers' },

    // Add Supplier
    {
      resource: 'add_supplier',
      action: 'read',
      description: 'View add supplier',
    },
    {
      resource: 'add_supplier',
      action: 'create',
      description: 'Create add supplier',
    },
    {
      resource: 'add_supplier',
      action: 'update',
      description: 'Update add supplier',
    },
    {
      resource: 'add_supplier',
      action: 'delete',
      description: 'Delete add supplier',
    },
    {
      resource: 'add_supplier',
      action: 'search',
      description: 'Search add supplier',
    },
    {
      resource: 'add_supplier',
      action: 'print',
      description: 'Print add supplier',
    },

    // Suppliers List
    {
      resource: 'suppliers_list',
      action: 'read',
      description: 'View suppliers list',
    },
    {
      resource: 'suppliers_list',
      action: 'create',
      description: 'Create suppliers list',
    },
    {
      resource: 'suppliers_list',
      action: 'update',
      description: 'Update suppliers list',
    },
    {
      resource: 'suppliers_list',
      action: 'delete',
      description: 'Delete suppliers list',
    },
    {
      resource: 'suppliers_list',
      action: 'search',
      description: 'Search suppliers list',
    },
    {
      resource: 'suppliers_list',
      action: 'print',
      description: 'Print suppliers list',
    },

    // General Accounts Module
    {
      resource: 'general_accounts',
      action: 'read',
      description: 'View general accounts',
    },
    {
      resource: 'general_accounts',
      action: 'create',
      description: 'Create general accounts',
    },
    {
      resource: 'general_accounts',
      action: 'update',
      description: 'Update general accounts',
    },
    {
      resource: 'general_accounts',
      action: 'delete',
      description: 'Delete general accounts',
    },
    {
      resource: 'general_accounts',
      action: 'search',
      description: 'Search general accounts',
    },
    {
      resource: 'general_accounts',
      action: 'print',
      description: 'Print general accounts',
    },

    // Expenses Management
    {
      resource: 'expenses_management',
      action: 'read',
      description: 'View expenses management',
    },
    {
      resource: 'expenses_management',
      action: 'create',
      description: 'Create expenses management',
    },
    {
      resource: 'expenses_management',
      action: 'update',
      description: 'Update expenses management',
    },
    {
      resource: 'expenses_management',
      action: 'delete',
      description: 'Delete expenses management',
    },
    {
      resource: 'expenses_management',
      action: 'search',
      description: 'Search expenses management',
    },
    {
      resource: 'expenses_management',
      action: 'print',
      description: 'Print expenses management',
    },

    // Expenses List
    {
      resource: 'expenses_list',
      action: 'read',
      description: 'View expenses list',
    },
    {
      resource: 'expenses_list',
      action: 'create',
      description: 'Create expenses list',
    },
    {
      resource: 'expenses_list',
      action: 'update',
      description: 'Update expenses list',
    },
    {
      resource: 'expenses_list',
      action: 'delete',
      description: 'Delete expenses list',
    },
    {
      resource: 'expenses_list',
      action: 'search',
      description: 'Search expenses list',
    },
    {
      resource: 'expenses_list',
      action: 'print',
      description: 'Print expenses list',
    },

    // Expense Codes
    {
      resource: 'expense_codes',
      action: 'read',
      description: 'View expense codes',
    },
    {
      resource: 'expense_codes',
      action: 'create',
      description: 'Create expense codes',
    },
    {
      resource: 'expense_codes',
      action: 'update',
      description: 'Update expense codes',
    },
    {
      resource: 'expense_codes',
      action: 'delete',
      description: 'Delete expense codes',
    },
    {
      resource: 'expense_codes',
      action: 'search',
      description: 'Search expense codes',
    },
    {
      resource: 'expense_codes',
      action: 'print',
      description: 'Print expense codes',
    },

    // Expense Types
    {
      resource: 'expense_types',
      action: 'read',
      description: 'View expense types',
    },
    {
      resource: 'expense_types',
      action: 'create',
      description: 'Create expense types',
    },
    {
      resource: 'expense_types',
      action: 'update',
      description: 'Update expense types',
    },
    {
      resource: 'expense_types',
      action: 'delete',
      description: 'Delete expense types',
    },
    {
      resource: 'expense_types',
      action: 'search',
      description: 'Search expense types',
    },
    {
      resource: 'expense_types',
      action: 'print',
      description: 'Print expense types',
    },

    // Current Accounts
    {
      resource: 'current_accounts',
      action: 'read',
      description: 'View current accounts',
    },
    {
      resource: 'current_accounts',
      action: 'create',
      description: 'Create current accounts',
    },
    {
      resource: 'current_accounts',
      action: 'update',
      description: 'Update current accounts',
    },
    {
      resource: 'current_accounts',
      action: 'delete',
      description: 'Delete current accounts',
    },
    {
      resource: 'current_accounts',
      action: 'search',
      description: 'Search current accounts',
    },
    {
      resource: 'current_accounts',
      action: 'print',
      description: 'Print current accounts',
    },

    // Add Current Account
    {
      resource: 'add_current_account',
      action: 'read',
      description: 'View add current account',
    },
    {
      resource: 'add_current_account',
      action: 'create',
      description: 'Create add current account',
    },
    {
      resource: 'add_current_account',
      action: 'update',
      description: 'Update add current account',
    },
    {
      resource: 'add_current_account',
      action: 'delete',
      description: 'Delete add current account',
    },
    {
      resource: 'add_current_account',
      action: 'search',
      description: 'Search add current account',
    },
    {
      resource: 'add_current_account',
      action: 'print',
      description: 'Print add current account',
    },

    // Current Accounts List
    {
      resource: 'current_accounts_list',
      action: 'read',
      description: 'View current accounts list',
    },
    {
      resource: 'current_accounts_list',
      action: 'create',
      description: 'Create current accounts list',
    },
    {
      resource: 'current_accounts_list',
      action: 'update',
      description: 'Update current accounts list',
    },
    {
      resource: 'current_accounts_list',
      action: 'delete',
      description: 'Delete current accounts list',
    },
    {
      resource: 'current_accounts_list',
      action: 'search',
      description: 'Search current accounts list',
    },
    {
      resource: 'current_accounts_list',
      action: 'print',
      description: 'Print current accounts list',
    },

    // Safes
    { resource: 'safes', action: 'read', description: 'View safes' },
    { resource: 'safes', action: 'create', description: 'Create safes' },
    { resource: 'safes', action: 'update', description: 'Update safes' },
    { resource: 'safes', action: 'delete', description: 'Delete safes' },
    { resource: 'safes', action: 'search', description: 'Search safes' },
    { resource: 'safes', action: 'print', description: 'Print safes' },

    // Banks
    { resource: 'banks', action: 'read', description: 'View banks' },
    { resource: 'banks', action: 'create', description: 'Create banks' },
    { resource: 'banks', action: 'update', description: 'Update banks' },
    { resource: 'banks', action: 'delete', description: 'Delete banks' },
    { resource: 'banks', action: 'search', description: 'Search banks' },
    { resource: 'banks', action: 'print', description: 'Print banks' },

    // Financials Module
    { resource: 'financials', action: 'read', description: 'View financials' },
    {
      resource: 'financials',
      action: 'create',
      description: 'Create financials',
    },
    {
      resource: 'financials',
      action: 'update',
      description: 'Update financials',
    },
    {
      resource: 'financials',
      action: 'delete',
      description: 'Delete financials',
    },
    {
      resource: 'financials',
      action: 'search',
      description: 'Search financials',
    },
    {
      resource: 'financials',
      action: 'print',
      description: 'Print financials',
    },

    // Receipt Voucher
    {
      resource: 'receipt_voucher',
      action: 'read',
      description: 'View receipt vouchers',
    },
    {
      resource: 'receipt_voucher',
      action: 'create',
      description: 'Create receipt vouchers',
    },
    {
      resource: 'receipt_voucher',
      action: 'update',
      description: 'Update receipt vouchers',
    },
    {
      resource: 'receipt_voucher',
      action: 'delete',
      description: 'Delete receipt vouchers',
    },
    {
      resource: 'receipt_voucher',
      action: 'search',
      description: 'Search receipt vouchers',
    },
    {
      resource: 'receipt_voucher',
      action: 'print',
      description: 'Print receipt vouchers',
    },

    // Payment Voucher
    {
      resource: 'payment_voucher',
      action: 'read',
      description: 'View payment vouchers',
    },
    {
      resource: 'payment_voucher',
      action: 'create',
      description: 'Create payment vouchers',
    },
    {
      resource: 'payment_voucher',
      action: 'update',
      description: 'Update payment vouchers',
    },
    {
      resource: 'payment_voucher',
      action: 'delete',
      description: 'Delete payment vouchers',
    },
    {
      resource: 'payment_voucher',
      action: 'search',
      description: 'Search payment vouchers',
    },
    {
      resource: 'payment_voucher',
      action: 'print',
      description: 'Print payment vouchers',
    },

    // Reports Module
    { resource: 'reports', action: 'read', description: 'View reports' },
    { resource: 'reports', action: 'create', description: 'Create reports' },
    { resource: 'reports', action: 'update', description: 'Update reports' },
    { resource: 'reports', action: 'delete', description: 'Delete reports' },
    { resource: 'reports', action: 'search', description: 'Search reports' },
    { resource: 'reports', action: 'print', description: 'Print reports' },

    // Item Reports
    {
      resource: 'item_reports',
      action: 'read',
      description: 'View item reports',
    },
    {
      resource: 'item_reports',
      action: 'create',
      description: 'Create item reports',
    },
    {
      resource: 'item_reports',
      action: 'update',
      description: 'Update item reports',
    },
    {
      resource: 'item_reports',
      action: 'delete',
      description: 'Delete item reports',
    },
    {
      resource: 'item_reports',
      action: 'search',
      description: 'Search item reports',
    },
    {
      resource: 'item_reports',
      action: 'print',
      description: 'Print item reports',
    },

    // Item Movement Report
    {
      resource: 'item_movement_report',
      action: 'read',
      description: 'View item movement report',
    },
    {
      resource: 'item_movement_report',
      action: 'create',
      description: 'Create item movement report',
    },
    {
      resource: 'item_movement_report',
      action: 'update',
      description: 'Update item movement report',
    },
    {
      resource: 'item_movement_report',
      action: 'delete',
      description: 'Delete item movement report',
    },
    {
      resource: 'item_movement_report',
      action: 'search',
      description: 'Search item movement report',
    },
    {
      resource: 'item_movement_report',
      action: 'print',
      description: 'Print item movement report',
    },

    // Item Balance Report
    {
      resource: 'item_balance_report',
      action: 'read',
      description: 'View item balance report',
    },
    {
      resource: 'item_balance_report',
      action: 'create',
      description: 'Create item balance report',
    },
    {
      resource: 'item_balance_report',
      action: 'update',
      description: 'Update item balance report',
    },
    {
      resource: 'item_balance_report',
      action: 'delete',
      description: 'Delete item balance report',
    },
    {
      resource: 'item_balance_report',
      action: 'search',
      description: 'Search item balance report',
    },
    {
      resource: 'item_balance_report',
      action: 'print',
      description: 'Print item balance report',
    },

    // Inventory Valuation Report
    {
      resource: 'inventory_valuation_report',
      action: 'read',
      description: 'View inventory valuation report',
    },
    {
      resource: 'inventory_valuation_report',
      action: 'create',
      description: 'Create inventory valuation report',
    },
    {
      resource: 'inventory_valuation_report',
      action: 'update',
      description: 'Update inventory valuation report',
    },
    {
      resource: 'inventory_valuation_report',
      action: 'delete',
      description: 'Delete inventory valuation report',
    },
    {
      resource: 'inventory_valuation_report',
      action: 'search',
      description: 'Search inventory valuation report',
    },
    {
      resource: 'inventory_valuation_report',
      action: 'print',
      description: 'Print inventory valuation report',
    },

    // Customer Reports
    {
      resource: 'customer_reports',
      action: 'read',
      description: 'View customer reports',
    },
    {
      resource: 'customer_reports',
      action: 'create',
      description: 'Create customer reports',
    },
    {
      resource: 'customer_reports',
      action: 'update',
      description: 'Update customer reports',
    },
    {
      resource: 'customer_reports',
      action: 'delete',
      description: 'Delete customer reports',
    },
    {
      resource: 'customer_reports',
      action: 'search',
      description: 'Search customer reports',
    },
    {
      resource: 'customer_reports',
      action: 'print',
      description: 'Print customer reports',
    },

    // Customer Statement Report
    {
      resource: 'customer_statement_report',
      action: 'read',
      description: 'View customer statement report',
    },
    {
      resource: 'customer_statement_report',
      action: 'create',
      description: 'Create customer statement report',
    },
    {
      resource: 'customer_statement_report',
      action: 'update',
      description: 'Update customer statement report',
    },
    {
      resource: 'customer_statement_report',
      action: 'delete',
      description: 'Delete customer statement report',
    },
    {
      resource: 'customer_statement_report',
      action: 'search',
      description: 'Search customer statement report',
    },
    {
      resource: 'customer_statement_report',
      action: 'print',
      description: 'Print customer statement report',
    },

    // Customer Balance Report
    {
      resource: 'customer_balance_report',
      action: 'read',
      description: 'View customer balance report',
    },
    {
      resource: 'customer_balance_report',
      action: 'create',
      description: 'Create customer balance report',
    },
    {
      resource: 'customer_balance_report',
      action: 'update',
      description: 'Update customer balance report',
    },
    {
      resource: 'customer_balance_report',
      action: 'delete',
      description: 'Delete customer balance report',
    },
    {
      resource: 'customer_balance_report',
      action: 'search',
      description: 'Search customer balance report',
    },
    {
      resource: 'customer_balance_report',
      action: 'print',
      description: 'Print customer balance report',
    },

    // Supplier Reports
    {
      resource: 'supplier_reports',
      action: 'read',
      description: 'View supplier reports',
    },
    {
      resource: 'supplier_reports',
      action: 'create',
      description: 'Create supplier reports',
    },
    {
      resource: 'supplier_reports',
      action: 'update',
      description: 'Update supplier reports',
    },
    {
      resource: 'supplier_reports',
      action: 'delete',
      description: 'Delete supplier reports',
    },
    {
      resource: 'supplier_reports',
      action: 'search',
      description: 'Search supplier reports',
    },
    {
      resource: 'supplier_reports',
      action: 'print',
      description: 'Print supplier reports',
    },

    // Supplier Statement Report
    {
      resource: 'supplier_statement_report',
      action: 'read',
      description: 'View supplier statement report',
    },
    {
      resource: 'supplier_statement_report',
      action: 'create',
      description: 'Create supplier statement report',
    },
    {
      resource: 'supplier_statement_report',
      action: 'update',
      description: 'Update supplier statement report',
    },
    {
      resource: 'supplier_statement_report',
      action: 'delete',
      description: 'Delete supplier statement report',
    },
    {
      resource: 'supplier_statement_report',
      action: 'search',
      description: 'Search supplier statement report',
    },
    {
      resource: 'supplier_statement_report',
      action: 'print',
      description: 'Print supplier statement report',
    },

    // Supplier Balance Report
    {
      resource: 'supplier_balance_report',
      action: 'read',
      description: 'View supplier balance report',
    },
    {
      resource: 'supplier_balance_report',
      action: 'create',
      description: 'Create supplier balance report',
    },
    {
      resource: 'supplier_balance_report',
      action: 'update',
      description: 'Update supplier balance report',
    },
    {
      resource: 'supplier_balance_report',
      action: 'delete',
      description: 'Delete supplier balance report',
    },
    {
      resource: 'supplier_balance_report',
      action: 'search',
      description: 'Search supplier balance report',
    },
    {
      resource: 'supplier_balance_report',
      action: 'print',
      description: 'Print supplier balance report',
    },

    // Financial Reports
    {
      resource: 'financial_reports',
      action: 'read',
      description: 'View financial reports',
    },
    {
      resource: 'financial_reports',
      action: 'create',
      description: 'Create financial reports',
    },
    {
      resource: 'financial_reports',
      action: 'update',
      description: 'Update financial reports',
    },
    {
      resource: 'financial_reports',
      action: 'delete',
      description: 'Delete financial reports',
    },
    {
      resource: 'financial_reports',
      action: 'search',
      description: 'Search financial reports',
    },
    {
      resource: 'financial_reports',
      action: 'print',
      description: 'Print financial reports',
    },

    // Daily Collections Report
    {
      resource: 'daily_collections_report',
      action: 'read',
      description: 'View daily collections report',
    },
    {
      resource: 'daily_collections_report',
      action: 'create',
      description: 'Create daily collections report',
    },
    {
      resource: 'daily_collections_report',
      action: 'update',
      description: 'Update daily collections report',
    },
    {
      resource: 'daily_collections_report',
      action: 'delete',
      description: 'Delete daily collections report',
    },
    {
      resource: 'daily_collections_report',
      action: 'search',
      description: 'Search daily collections report',
    },
    {
      resource: 'daily_collections_report',
      action: 'print',
      description: 'Print daily collections report',
    },

    // Daily Payments Report
    {
      resource: 'daily_payments_report',
      action: 'read',
      description: 'View daily payments report',
    },
    {
      resource: 'daily_payments_report',
      action: 'create',
      description: 'Create daily payments report',
    },
    {
      resource: 'daily_payments_report',
      action: 'update',
      description: 'Update daily payments report',
    },
    {
      resource: 'daily_payments_report',
      action: 'delete',
      description: 'Delete daily payments report',
    },
    {
      resource: 'daily_payments_report',
      action: 'search',
      description: 'Search daily payments report',
    },
    {
      resource: 'daily_payments_report',
      action: 'print',
      description: 'Print daily payments report',
    },

    // Expense Statement Report
    {
      resource: 'expense_statement_report',
      action: 'read',
      description: 'View expense statement report',
    },
    {
      resource: 'expense_statement_report',
      action: 'create',
      description: 'Create expense statement report',
    },
    {
      resource: 'expense_statement_report',
      action: 'update',
      description: 'Update expense statement report',
    },
    {
      resource: 'expense_statement_report',
      action: 'delete',
      description: 'Delete expense statement report',
    },
    {
      resource: 'expense_statement_report',
      action: 'search',
      description: 'Search expense statement report',
    },
    {
      resource: 'expense_statement_report',
      action: 'print',
      description: 'Print expense statement report',
    },

    // Total Expenses Report
    {
      resource: 'total_expenses_report',
      action: 'read',
      description: 'View total expenses report',
    },
    {
      resource: 'total_expenses_report',
      action: 'create',
      description: 'Create total expenses report',
    },
    {
      resource: 'total_expenses_report',
      action: 'update',
      description: 'Update total expenses report',
    },
    {
      resource: 'total_expenses_report',
      action: 'delete',
      description: 'Delete total expenses report',
    },
    {
      resource: 'total_expenses_report',
      action: 'search',
      description: 'Search total expenses report',
    },
    {
      resource: 'total_expenses_report',
      action: 'print',
      description: 'Print total expenses report',
    },

    // Current Account Statement Report
    {
      resource: 'current_account_statement_report',
      action: 'read',
      description: 'View current account statement report',
    },
    {
      resource: 'current_account_statement_report',
      action: 'create',
      description: 'Create current account statement report',
    },
    {
      resource: 'current_account_statement_report',
      action: 'update',
      description: 'Update current account statement report',
    },
    {
      resource: 'current_account_statement_report',
      action: 'delete',
      description: 'Delete current account statement report',
    },
    {
      resource: 'current_account_statement_report',
      action: 'search',
      description: 'Search current account statement report',
    },
    {
      resource: 'current_account_statement_report',
      action: 'print',
      description: 'Print current account statement report',
    },

    // Total Current Accounts Report
    {
      resource: 'total_current_accounts_report',
      action: 'read',
      description: 'View total current accounts report',
    },
    {
      resource: 'total_current_accounts_report',
      action: 'create',
      description: 'Create total current accounts report',
    },
    {
      resource: 'total_current_accounts_report',
      action: 'update',
      description: 'Update total current accounts report',
    },
    {
      resource: 'total_current_accounts_report',
      action: 'delete',
      description: 'Delete total current accounts report',
    },
    {
      resource: 'total_current_accounts_report',
      action: 'search',
      description: 'Search total current accounts report',
    },
    {
      resource: 'total_current_accounts_report',
      action: 'print',
      description: 'Print total current accounts report',
    },

    // Safe Statement Report
    {
      resource: 'safe_statement_report',
      action: 'read',
      description: 'View safe statement report',
    },
    {
      resource: 'safe_statement_report',
      action: 'create',
      description: 'Create safe statement report',
    },
    {
      resource: 'safe_statement_report',
      action: 'update',
      description: 'Update safe statement report',
    },
    {
      resource: 'safe_statement_report',
      action: 'delete',
      description: 'Delete safe statement report',
    },
    {
      resource: 'safe_statement_report',
      action: 'search',
      description: 'Search safe statement report',
    },
    {
      resource: 'safe_statement_report',
      action: 'print',
      description: 'Print safe statement report',
    },

    // Bank Statement Report
    {
      resource: 'bank_statement_report',
      action: 'read',
      description: 'View bank statement report',
    },
    {
      resource: 'bank_statement_report',
      action: 'create',
      description: 'Create bank statement report',
    },
    {
      resource: 'bank_statement_report',
      action: 'update',
      description: 'Update bank statement report',
    },
    {
      resource: 'bank_statement_report',
      action: 'delete',
      description: 'Delete bank statement report',
    },
    {
      resource: 'bank_statement_report',
      action: 'search',
      description: 'Search bank statement report',
    },
    {
      resource: 'bank_statement_report',
      action: 'print',
      description: 'Print bank statement report',
    },

    // Tax Declaration Report
    {
      resource: 'tax_declaration_report',
      action: 'read',
      description: 'View tax declaration report',
    },
    {
      resource: 'tax_declaration_report',
      action: 'create',
      description: 'Create tax declaration report',
    },
    {
      resource: 'tax_declaration_report',
      action: 'update',
      description: 'Update tax declaration report',
    },
    {
      resource: 'tax_declaration_report',
      action: 'delete',
      description: 'Delete tax declaration report',
    },
    {
      resource: 'tax_declaration_report',
      action: 'search',
      description: 'Search tax declaration report',
    },
    {
      resource: 'tax_declaration_report',
      action: 'print',
      description: 'Print tax declaration report',
    },

    // Final Accounts Module
    {
      resource: 'final_accounts',
      action: 'read',
      description: 'View final accounts',
    },
    {
      resource: 'final_accounts',
      action: 'create',
      description: 'Create final accounts',
    },
    {
      resource: 'final_accounts',
      action: 'update',
      description: 'Update final accounts',
    },
    {
      resource: 'final_accounts',
      action: 'delete',
      description: 'Delete final accounts',
    },
    {
      resource: 'final_accounts',
      action: 'search',
      description: 'Search final accounts',
    },
    {
      resource: 'final_accounts',
      action: 'print',
      description: 'Print final accounts',
    },

    // Income Statement
    {
      resource: 'income_statement',
      action: 'read',
      description: 'View income statement',
    },
    {
      resource: 'income_statement',
      action: 'create',
      description: 'Create income statement',
    },
    {
      resource: 'income_statement',
      action: 'update',
      description: 'Update income statement',
    },
    {
      resource: 'income_statement',
      action: 'delete',
      description: 'Delete income statement',
    },
    {
      resource: 'income_statement',
      action: 'search',
      description: 'Search income statement',
    },
    {
      resource: 'income_statement',
      action: 'print',
      description: 'Print income statement',
    },

    // Balance Sheet
    {
      resource: 'balance_sheet',
      action: 'read',
      description: 'View balance sheet',
    },
    {
      resource: 'balance_sheet',
      action: 'create',
      description: 'Create balance sheet',
    },
    {
      resource: 'balance_sheet',
      action: 'update',
      description: 'Update balance sheet',
    },
    {
      resource: 'balance_sheet',
      action: 'delete',
      description: 'Delete balance sheet',
    },
    {
      resource: 'balance_sheet',
      action: 'search',
      description: 'Search balance sheet',
    },
    {
      resource: 'balance_sheet',
      action: 'print',
      description: 'Print balance sheet',
    },

    // Customers
    {
      resource: 'customers',
      action: 'read',
      description: 'View customers module',
    },
    {
      resource: 'customers',
      action: 'create',
      description: 'Create customers',
    },
    { resource: 'customers', action: 'read', description: 'View customers' },
    {
      resource: 'customers',
      action: 'update',
      description: 'Update customers',
    },
    {
      resource: 'customers',
      action: 'delete',
      description: 'Delete customers',
    },

    // Suppliers
    {
      resource: 'suppliers',
      action: 'read',
      description: 'View suppliers module',
    },
    {
      resource: 'suppliers',
      action: 'create',
      description: 'Create suppliers',
    },
    { resource: 'suppliers', action: 'read', description: 'View suppliers' },
    {
      resource: 'suppliers',
      action: 'update',
      description: 'Update suppliers',
    },
    {
      resource: 'suppliers',
      action: 'delete',
      description: 'Delete suppliers',
    },

    // Financials
    {
      resource: 'financials',
      action: 'read',
      description: 'View financials module',
    },
    {
      resource: 'receipt_voucher',
      action: 'create',
      description: 'Create receipt voucher',
    },
    {
      resource: 'receipt_voucher',
      action: 'read',
      description: 'View receipt vouchers',
    },
    {
      resource: 'receipt_voucher',
      action: 'update',
      description: 'Update receipt vouchers',
    },
    {
      resource: 'receipt_voucher',
      action: 'delete',
      description: 'Delete receipt vouchers',
    },
    {
      resource: 'payment_voucher',
      action: 'create',
      description: 'Create payment voucher',
    },
    {
      resource: 'payment_voucher',
      action: 'read',
      description: 'View payment vouchers',
    },
    {
      resource: 'payment_voucher',
      action: 'update',
      description: 'Update payment vouchers',
    },
    {
      resource: 'payment_voucher',
      action: 'delete',
      description: 'Delete payment vouchers',
    },
    { resource: 'expenses', action: 'read', description: 'View expenses' },
    { resource: 'expenses', action: 'create', description: 'Create expenses' },
    { resource: 'expenses', action: 'update', description: 'Update expenses' },
    { resource: 'expenses', action: 'delete', description: 'Delete expenses' },
    { resource: 'expenses', action: 'search', description: 'Search expenses' },
    { resource: 'expenses', action: 'print', description: 'Print expenses' },
    {
      resource: 'current_accounts',
      action: 'read',
      description: 'View current accounts',
    },
    {
      resource: 'current_accounts',
      action: 'create',
      description: 'Create current accounts',
    },
    {
      resource: 'current_accounts',
      action: 'update',
      description: 'Update current accounts',
    },
    {
      resource: 'current_accounts',
      action: 'delete',
      description: 'Delete current accounts',
    },
    {
      resource: 'current_accounts',
      action: 'search',
      description: 'Search current accounts',
    },
    {
      resource: 'current_accounts',
      action: 'print',
      description: 'Print current accounts',
    },
    { resource: 'safes', action: 'read', description: 'View safes' },
    { resource: 'safes', action: 'create', description: 'Create safes' },
    { resource: 'safes', action: 'update', description: 'Update safes' },
    { resource: 'safes', action: 'delete', description: 'Delete safes' },
    { resource: 'safes', action: 'search', description: 'Search safes' },
    { resource: 'safes', action: 'print', description: 'Print safes' },
    { resource: 'banks', action: 'read', description: 'View banks' },
    { resource: 'banks', action: 'create', description: 'Create banks' },
    { resource: 'banks', action: 'update', description: 'Update banks' },
    { resource: 'banks', action: 'delete', description: 'Delete banks' },
    { resource: 'banks', action: 'search', description: 'Search banks' },
    { resource: 'banks', action: 'print', description: 'Print banks' },

    // Reports
    { resource: 'reports', action: 'read', description: 'View reports module' },
    {
      resource: 'item_reports',
      action: 'read',
      description: 'View item reports',
    },
    {
      resource: 'customer_reports',
      action: 'read',
      description: 'View customer reports',
    },
    {
      resource: 'supplier_reports',
      action: 'read',
      description: 'View supplier reports',
    },
    {
      resource: 'financial_reports',
      action: 'read',
      description: 'View financial reports',
    },

    // Final Accounts
    {
      resource: 'final_accounts',
      action: 'read',
      description: 'View final accounts',
    },
    {
      resource: 'income_statement',
      action: 'read',
      description: 'View income statement',
    },
    {
      resource: 'balance_sheet',
      action: 'read',
      description: 'View balance sheet',
    },

    // Settings
    { resource: 'settings', action: 'read', description: 'View settings' },
    {
      resource: 'company_data',
      action: 'read',
      description: 'View company data',
    },
    {
      resource: 'company_data',
      action: 'create',
      description: 'Create company data',
    },
    {
      resource: 'company_data',
      action: 'update',
      description: 'Update company data',
    },
    {
      resource: 'company_data',
      action: 'delete',
      description: 'Delete company data',
    },
    {
      resource: 'company_data',
      action: 'search',
      description: 'Search company data',
    },
    {
      resource: 'company_data',
      action: 'print',
      description: 'Print company data',
    },
    { resource: 'branches', action: 'read', description: 'View branches' },
    { resource: 'branches', action: 'create', description: 'Create branches' },
    { resource: 'branches', action: 'update', description: 'Update branches' },
    { resource: 'branches', action: 'delete', description: 'Delete branches' },
    { resource: 'branches', action: 'search', description: 'Search branches' },
    { resource: 'branches', action: 'print', description: 'Print branches' },
    { resource: 'stores', action: 'read', description: 'View stores' },
    { resource: 'stores', action: 'create', description: 'Create stores' },
    { resource: 'stores', action: 'update', description: 'Update stores' },
    { resource: 'stores', action: 'delete', description: 'Delete stores' },
    { resource: 'stores', action: 'search', description: 'Search stores' },
    { resource: 'stores', action: 'print', description: 'Print stores' },
    { resource: 'users', action: 'read', description: 'View users' },
    { resource: 'users', action: 'create', description: 'Create users' },
    { resource: 'users', action: 'update', description: 'Update users' },
    { resource: 'users', action: 'delete', description: 'Delete users' },
    { resource: 'users', action: 'search', description: 'Search users' },
    { resource: 'users', action: 'print', description: 'Print users' },
    {
      resource: 'permissions',
      action: 'read',
      description: 'View permissions',
    },
    {
      resource: 'permissions',
      action: 'create',
      description: 'Create permissions',
    },
    {
      resource: 'permissions',
      action: 'update',
      description: 'Update permissions',
    },
    {
      resource: 'permissions',
      action: 'delete',
      description: 'Delete permissions',
    },
    {
      resource: 'permissions',
      action: 'search',
      description: 'Search permissions',
    },
    {
      resource: 'permissions',
      action: 'print',
      description: 'Print permissions',
    },
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
