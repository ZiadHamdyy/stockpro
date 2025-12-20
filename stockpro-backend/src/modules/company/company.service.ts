import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { UpsertCompanyRequest } from './dtos/request/upsert-company.request';
import { CompanyResponse } from './dtos/response/company.response';
import {
  base64ToBuffer,
  bufferToDataUri,
} from '../../common/utils/image-converter';
import * as bcryptjs from 'bcryptjs';

// Define MENU_ITEMS structure for permission generation
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
      { key: 'financial_system', label: 'إعدادات النظام المالي' },
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
          { key: 'annual_sales_report', label: 'تقرير المبيعات السنوي' },
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
          { key: 'revenue_statement_report', label: 'كشف حساب إيرادات' },
          { key: 'total_revenues_report', label: 'إجمالي الإيرادات' },
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
          { key: 'total_cash_report', label: 'إجمالي النقدية' },
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

@Injectable()
export class CompanyService {
  constructor(
    private readonly prisma: DatabaseService,
  ) {}

  async getCompany(companyId: string): Promise<CompanyResponse> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company data not found');
    }

    return this.mapToResponse(company);
  }

  async getAllCompanies(): Promise<CompanyResponse[]> {
    const companies = await this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return companies.map((company) => this.mapToResponse(company));
  }

  async createCompany(data: UpsertCompanyRequest): Promise<CompanyResponse> {
    // Host is required for creating a new company
    if (!data.host) {
      throw new NotFoundException('Host is required when creating a new company');
    }

    // Check if host already exists
    const existingCompany = await this.prisma.company.findUnique({
      where: { host: data.host },
    });

    if (existingCompany) {
      throw new NotFoundException(
        `Company with host ${data.host} already exists`,
      );
    }

    // Prepare data with logo conversion
    const companyData = {
      ...data,
      host: data.host, // Ensure host is explicitly set
      logo: data.logo ? base64ToBuffer(data.logo) : null,
    };

    const company = await this.prisma.company.create({
      data: companyData,
    });

    return this.mapToResponse(company);
  }

  async findByHost(host: string) {
    const company = await this.prisma.company.findUnique({
      where: { host },
    });

    if (!company) {
      throw new NotFoundException(`Company not found for host: ${host}`);
    }

    return company;
  }

  async findFirstCompany() {
    const company = await this.prisma.company.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!company) {
      throw new NotFoundException('No company found');
    }

    return company;
  }

  async upsertCompany(companyId: string, data: UpsertCompanyRequest): Promise<CompanyResponse> {
    // Try to find existing company
    const existingCompany = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    // Prepare data with logo conversion
    const companyData = {
      ...data,
      logo: data.logo ? base64ToBuffer(data.logo) : null,
    };

    let company;

    if (existingCompany) {
      // Update existing company
      // If host is being changed, check if new host is available
      if (data.host && data.host !== existingCompany.host) {
        const hostExists = await this.prisma.company.findUnique({
          where: { host: data.host },
        });
        if (hostExists) {
          throw new NotFoundException(
            `Company with host ${data.host} already exists`,
          );
        }
      }

      company = await this.prisma.company.update({
        where: { id: companyId },
        data: companyData,
      });
    } else {
      // Create new company - host is required for new companies
      if (!data.host) {
        throw new NotFoundException('Host is required when creating a new company');
      }
      company = await this.prisma.company.create({
        data: {
          ...companyData,
          host: data.host,
        },
      });
    }

    return this.mapToResponse(company);
  }

  async createCompanyWithSeed(host: string, planType: 'BASIC' | 'GROWTH' | 'BUSINESS' = 'BASIC'): Promise<CompanyResponse> {
    // Normalize host to lowercase
    const normalizedHost = host.toLowerCase().trim();

    // Validate host format (alphanumeric, dots, hyphens allowed)
    if (!/^[a-z0-9.-]+$/.test(normalizedHost)) {
      throw new NotFoundException(
        'Host must contain only lowercase letters, numbers, dots, and hyphens',
      );
    }

    // Check if host already exists
    const existingCompany = await this.prisma.company.findUnique({
      where: { host: normalizedHost },
    });

    if (existingCompany) {
      throw new NotFoundException(
        `Company with host ${normalizedHost} already exists`,
      );
    }

    // Create company with default data (matching seed.ts pattern)
    const company = await this.prisma.company.create({
      data: {
        name: 'اسم الشركة',
        activity: 'النشاط التجاري',
        address: 'العنوان',
        phone: '+966000000000',
        taxNumber: '000000000000000',
        commercialReg: '0000000000',
        currency: 'SAR',
        capital: 0,
        vatRate: 15,
        isVatEnabled: true,
        host: normalizedHost,
      },
    });

    // Seed all company data
    await this.seedCompanyData(company.id, normalizedHost, company.name);

    // Create subscription with selected plan
    await this.prisma.subscription.create({
      data: {
        companyId: company.id,
        planType: planType,
        status: 'ACTIVE',
      },
    });

    return this.mapToResponse(company);
  }

  private async seedCompanyData(
    companyId: string,
    host: string,
    companyName: string,
  ): Promise<void> {
    // Generate comprehensive permissions for all menu items
    const permissions = generatePermissions();

    // Create permissions
    for (const permission of permissions) {
      await this.prisma.permission.upsert({
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

    for (const role of roles) {
      await this.prisma.role.upsert({
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

    // Get all created roles and permissions
    const createdRoles = await this.prisma.role.findMany({
      where: { companyId },
    });
    const createdPermissions = await this.prisma.permission.findMany({
      where: { companyId },
    });

    // Assign permissions to roles
    const managerRole = createdRoles.find((r) => r.name === 'مدير');
    if (managerRole) {
      for (const permission of createdPermissions) {
        await this.prisma.rolePermission.upsert({
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
          p.resource === 'annual_sales_report' ||
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
          p.resource === 'revenue_statement_report' ||
          p.resource === 'total_revenues_report' ||
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
          p.resource === 'total_cash_report' ||
          p.resource === 'tax_reports' ||
          p.resource === 'vat_statement_report' ||
          p.resource === 'tax_declaration_report' ||
          p.resource === 'final_accounts' ||
          p.resource === 'income_statement' ||
          p.resource === 'balance_sheet' ||
          p.resource === 'help_center',
      );

      for (const permission of accountantPermissions) {
        await this.prisma.rolePermission.upsert({
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
          (p.resource === 'items' && p.action === 'read') ||
          (p.resource === 'items_list' && p.action === 'read') ||
          (p.resource === 'item_groups' && p.action === 'read') ||
          (p.resource === 'units' && p.action === 'read') ||
          p.resource === 'help_center',
      );

      for (const permission of salespersonPermissions) {
        await this.prisma.rolePermission.upsert({
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
        await this.prisma.rolePermission.upsert({
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
    }

    // Get company data for branch creation
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    // Create default branch
    let existingBranch = await this.prisma.branch.findFirst({
      where: { companyId },
    });
    if (!existingBranch) {
      const lastBranchWithCode = await this.prisma.branch.findFirst({
        where: { companyId },
        select: { code: true },
        orderBy: { code: 'desc' },
      });
      const nextBranchCode = (lastBranchWithCode?.code ?? 0) + 1;
      existingBranch = await this.prisma.branch.create({
        data: {
          code: nextBranchCode,
          name: 'الفرع الرئيسي',
          address: company?.address || 'العنوان',
          phone: company?.phone || '+966000000000',
          description: 'الفرع الرئيسي للشركة',
          companyId,
        },
      });
    }

    // Create expense types
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
      await this.prisma.expenseType.upsert({
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

    // Create default admin user
    if (existingBranch && managerRole) {
      const existingAdmin = await this.prisma.user.findUnique({
        where: {
          email_companyId: {
            email: 'admin@stockpro.com',
            companyId,
          },
        },
      });

      if (!existingAdmin) {
        const hashedPassword = await bcryptjs.hash('Password#1', 12);
        const lastUserWithCode = await this.prisma.user.findFirst({
          where: { companyId },
          select: { code: true },
          orderBy: { code: 'desc' },
        });
        const nextUserCode = (lastUserWithCode?.code ?? 0) + 1;

        const adminUser = await this.prisma.user.create({
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

        // Create default store
        const existingStore = await this.prisma.store.findUnique({
          where: { branchId: existingBranch.id },
        });

        if (!existingStore) {
          const lastStoreWithCode = await this.prisma.store.findFirst({
            where: { companyId },
            select: { code: true },
            orderBy: { code: 'desc' },
          });
          const nextStoreCode = (lastStoreWithCode?.code ?? 0) + 1;

          await this.prisma.store.create({
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
        }

        // Create default safe
        const existingSafe = await this.prisma.safe.findUnique({
          where: { branchId: existingBranch.id },
        });

        if (!existingSafe) {
          const lastSafeWithCode = await this.prisma.safe.findFirst({
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

          await this.prisma.safe.create({
            data: {
              code: nextSafeCode,
              name: 'الخزنة الرئيسية',
              branchId: existingBranch.id,
              openingBalance: 0,
              currentBalance: 0,
              companyId,
            },
          });
        }
      }
    }
  }

  private mapToResponse(company: any): CompanyResponse {
    return {
      id: company.id,
      name: company.name,
      activity: company.activity,
      address: company.address,
      phone: company.phone,
      taxNumber: company.taxNumber,
      commercialReg: company.commercialReg,
      currency: company.currency,
      capital: company.capital,
      vatRate: company.vatRate,
      isVatEnabled: company.isVatEnabled,
      logo: company.logo ? bufferToDataUri(company.logo) : null,
      host: company.host,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }
}
