import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { UpsertCompanyRequest } from './dtos/request/upsert-company.request';
import { CompanyResponse } from './dtos/response/company.response';
import {
  base64ToBuffer,
  bufferToDataUri,
} from '../../common/utils/image-converter';
import { filterPermissionsByPlan } from '../../common/utils/permission-filter.util';
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
      { key: 'subscription_data', label: 'بيانات الاشتراك' },
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
      { key: 'audit_trail', label: 'ميزان المراجعة' },
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

  /**
   * Generate a unique 6-8 digit company code
   */
  private async generateUniqueCode(): Promise<string> {
    let code: string;
    let exists: boolean;
    const minCode = 100000; // 6 digits
    const maxCode = 99999999; // 8 digits

    do {
      // Generate random length between 6-8 digits
      const length = Math.floor(Math.random() * 3) + 6; // 6, 7, or 8
      const randomNum = Math.floor(Math.random() * (maxCode - minCode + 1)) + minCode;
      code = randomNum.toString().padStart(length, '0').slice(0, length);

      // Check if code already exists
      const existing = await this.prisma.company.findUnique({
        where: { code },
      });
      exists = !!existing;
    } while (exists);

    return code;
  }

  /**
   * Validate company code format (6-8 digits)
   */
  private validateCode(code: string): boolean {
    return /^\d{6,8}$/.test(code);
  }

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
    // Generate code if not provided
    let code = data.code;
    if (!code) {
      code = await this.generateUniqueCode();
    } else {
      // Validate code format
      if (!this.validateCode(code)) {
        throw new NotFoundException(
          'Company code must be 6-8 digits',
        );
      }

      // Check if code already exists
      const existingCompany = await this.prisma.company.findUnique({
        where: { code },
      });

      if (existingCompany) {
        throw new NotFoundException(
          `Company with code ${code} already exists`,
        );
      }
    }

    // Prepare data with logo conversion
    const companyData = {
      ...data,
      code,
      logo: data.logo ? base64ToBuffer(data.logo) : null,
    };

    // Remove host from data if present
    delete (companyData as any).host;

    const company = await this.prisma.company.create({
      data: companyData,
    });

    return this.mapToResponse(company);
  }

  async findByCode(code: string) {
    if (!this.validateCode(code)) {
      throw new NotFoundException(`Invalid company code format: ${code}`);
    }

    const company = await this.prisma.company.findUnique({
      where: { code },
    });

    if (!company) {
      throw new NotFoundException(`Company not found for code: ${code}`);
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
    const companyData: any = {
      ...data,
      logo: data.logo ? base64ToBuffer(data.logo) : null,
    };

    // Remove host if present
    delete companyData.host;

    let company;

    if (existingCompany) {
      // Update existing company
      // If code is being changed, check if new code is available
      if (data.code && data.code !== existingCompany.code) {
        if (!this.validateCode(data.code)) {
          throw new NotFoundException(
            'Company code must be 6-8 digits',
          );
        }
        const codeExists = await this.prisma.company.findUnique({
          where: { code: data.code },
        });
        if (codeExists) {
          throw new NotFoundException(
            `Company with code ${data.code} already exists`,
          );
        }
        companyData.code = data.code;
      }

      company = await this.prisma.company.update({
        where: { id: companyId },
        data: companyData,
      });
    } else {
      // Create new company - generate code if not provided
      if (!data.code) {
        companyData.code = await this.generateUniqueCode();
      } else {
        if (!this.validateCode(data.code)) {
          throw new NotFoundException('Company code must be 6-8 digits');
        }
        const codeExists = await this.prisma.company.findUnique({
          where: { code: data.code },
        });
        if (codeExists) {
          throw new NotFoundException(
            `Company with code ${data.code} already exists`,
          );
        }
        companyData.code = data.code;
      }

      company = await this.prisma.company.create({
        data: companyData,
      });
    }

    return this.mapToResponse(company);
  }

  async getFinancialSettings(companyId: string): Promise<any> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { financialSettings: true },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Return default settings if none exist
    if (!company.financialSettings) {
      return this.getDefaultFinancialSettings();
    }

    return company.financialSettings;
  }

  async updateFinancialSettings(companyId: string, financialSettings: any): Promise<any> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Merge with existing settings to preserve any fields not being updated
    const existingSettings = company.financialSettings || this.getDefaultFinancialSettings();
    const mergedSettings = {
      ...existingSettings,
      ...financialSettings,
    };

    await this.prisma.company.update({
      where: { id: companyId },
      data: { financialSettings: mergedSettings },
    });

    return mergedSettings;
  }

  private getDefaultFinancialSettings(): any {
    return {
      taxPolicy: 'EXCLUSIVE',
      defaultTaxRate: 15,
      baseCurrency: 'SAR',
      enableMultiCurrency: false,
      roundingMethod: 'NEAREST_0_05',
      inventoryValuationMethod: 'WEIGHTED_AVERAGE',
      cogsMethod: 'WEIGHTED_AVERAGE',
      autoUpdateSalePriceOnPurchase: false,
      defaultMarginPercentage: 25,
      lockPostedPeriods: true,
      closingDate: new Date().toISOString().split('T')[0],
      preventDuplicateSupplierRef: true,
      creditLimitControl: 'BLOCK',
      minMarginControl: 'BLOCK',
      allowSellingBelowCost: false,
      maxCashTransactionLimit: 5000,
      requireCostCenterForExpenses: true,
      allowNegativeStock: false,
      reserveStockOnOrder: true,
      maxDiscountPercentage: 15,
      requireManagerApprovalForDiscount: true,
      activePriceLists: { 'أساسي': true, 'جملة': false, 'كبار العملاء (VIP)': true },
    };
  }

  async createCompanyWithSeed(
    code?: string,
    planType: 'BASIC' | 'GROWTH' | 'BUSINESS' = 'BASIC',
    startDate?: Date,
    endDate?: Date,
  ): Promise<CompanyResponse> {
    // Generate code if not provided
    let companyCode = code;
    if (!companyCode) {
      companyCode = await this.generateUniqueCode();
    } else {
      // Validate code format
      if (!this.validateCode(companyCode)) {
        throw new NotFoundException(
          'Company code must be 6-8 digits',
        );
      }

      // Check if code already exists
      const existingCompany = await this.prisma.company.findUnique({
        where: { code: companyCode },
      });

      if (existingCompany) {
        throw new NotFoundException(
          `Company with code ${companyCode} already exists`,
        );
      }
    }

    // Validate dates if provided
    if (startDate && endDate) {
      if (endDate <= startDate) {
        throw new BadRequestException(
          'End date must be after start date',
        );
      }
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
        code: companyCode,
      },
    });

    // Create subscription with selected plan and dates
    await this.prisma.subscription.create({
      data: {
        companyId: company.id,
        planType: planType,
        status: 'ACTIVE',
        startDate: startDate || new Date(),
        endDate: endDate || null,
      },
    });

    // Seed all company data (after subscription is created so planType is available)
    await this.seedCompanyData(company.id, companyCode, company.name, planType);

    return this.mapToResponse(company);
  }

  private async seedCompanyData(
    companyId: string,
    companyCode: string,
    companyName: string,
    planType: 'BASIC' | 'GROWTH' | 'BUSINESS' = 'BASIC',
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
    const allPermissions = await this.prisma.permission.findMany({
      where: { companyId },
    });

    // Filter permissions based on plan
    const allowedPermissions = filterPermissionsByPlan(
      allPermissions,
      planType,
    );

    // Assign permissions to roles (only allowed permissions)
    const managerRole = createdRoles.find((r) => r.name === 'مدير');
    if (managerRole) {
      for (const permission of allowedPermissions) {
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
      const accountantPermissions = allowedPermissions.filter(
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
      const salespersonPermissions = allowedPermissions.filter(
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
      const dataEntryPermissions = allowedPermissions.filter(
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
        // const existingSafe = await this.prisma.safe.findUnique({
        //   where: { branchId: existingBranch.id },
        // });

        // if (!existingSafe) {
        //   const lastSafeWithCode = await this.prisma.safe.findFirst({
        //     where: { companyId },
        //     select: { code: true },
        //     orderBy: { code: 'desc' },
        //   });

        //   let nextSafeCode = 'SF-001';
        //   if (lastSafeWithCode?.code) {
        //     const match = lastSafeWithCode.code.match(/SF-(\d+)/);
        //     if (match) {
        //       const nextNumber = parseInt(match[1], 10) + 1;
        //       nextSafeCode = `SF-${String(nextNumber).padStart(3, '0')}`;
        //     }
        //   }

        //   await this.prisma.safe.create({
        //     data: {
        //       code: nextSafeCode,
        //       name: 'الخزنة الرئيسية',
        //       branchId: existingBranch.id,
        //       openingBalance: 0,
        //       currentBalance: 0,
        //       companyId,
        //     },
        //   });
        // }
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
      code: company.code,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      financialSettings: company.financialSettings || null,
      printSettings: company.printSettings || null,
    };
  }

  async getPrintSettings(companyId: string): Promise<any> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { printSettings: true },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Return null if no settings exist (frontend will handle defaults)
    return company.printSettings;
  }

  async updatePrintSettings(companyId: string, printSettings: any): Promise<any> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    await this.prisma.company.update({
      where: { id: companyId },
      data: { printSettings },
    });

    return printSettings;
  }

  async deleteCompany(companyId: string): Promise<void> {
    // Verify company exists
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Use transaction to ensure atomicity
    await this.prisma.$transaction(async (tx) => {
      // 1. Get IDs of vouchers and inventory counts for deleting their items
      const storeReceiptVouchers = await tx.storeReceiptVoucher.findMany({
        where: { companyId },
        select: { id: true },
      });
      const storeReceiptVoucherIds = storeReceiptVouchers.map((v) => v.id);

      const storeIssueVouchers = await tx.storeIssueVoucher.findMany({
        where: { companyId },
        select: { id: true },
      });
      const storeIssueVoucherIds = storeIssueVouchers.map((v) => v.id);

      const storeTransferVouchers = await tx.storeTransferVoucher.findMany({
        where: { companyId },
        select: { id: true },
      });
      const storeTransferVoucherIds = storeTransferVouchers.map((v) => v.id);

      const inventoryCounts = await tx.inventoryCount.findMany({
        where: { companyId },
        select: { id: true },
      });
      const inventoryCountIds = inventoryCounts.map((ic) => ic.id);

      // Delete child records (voucher items, inventory items)
      if (storeReceiptVoucherIds.length > 0) {
        await tx.storeReceiptVoucherItem.deleteMany({
          where: {
            voucherId: { in: storeReceiptVoucherIds },
          },
        });
      }

      if (storeIssueVoucherIds.length > 0) {
        await tx.storeIssueVoucherItem.deleteMany({
          where: {
            voucherId: { in: storeIssueVoucherIds },
          },
        });
      }

      if (storeTransferVoucherIds.length > 0) {
        await tx.storeTransferVoucherItem.deleteMany({
          where: {
            voucherId: { in: storeTransferVoucherIds },
          },
        });
      }

      if (inventoryCountIds.length > 0) {
        await tx.inventoryCountItem.deleteMany({
          where: {
            inventoryCountId: { in: inventoryCountIds },
          },
        });
      }

      // 2. Get store IDs and delete store items
      const stores = await tx.store.findMany({
        where: { companyId },
        select: { id: true },
      });
      const storeIds = stores.map((s) => s.id);

      if (storeIds.length > 0) {
        await tx.storeItem.deleteMany({
          where: {
            storeId: { in: storeIds },
          },
        });
      }

      // 3. Delete transactional records
      await tx.storeReceiptVoucher.deleteMany({
        where: { companyId },
      });

      await tx.storeIssueVoucher.deleteMany({
        where: { companyId },
      });

      await tx.storeTransferVoucher.deleteMany({
        where: { companyId },
      });

      await tx.inventoryCount.deleteMany({
        where: { companyId },
      });

      // 4. Delete financial transactions
      await tx.salesInvoice.deleteMany({
        where: { companyId },
      });

      await tx.salesReturn.deleteMany({
        where: { companyId },
      });

      await tx.purchaseInvoice.deleteMany({
        where: { companyId },
      });

      await tx.purchaseReturn.deleteMany({
        where: { companyId },
      });

      await tx.paymentVoucher.deleteMany({
        where: { companyId },
      });

      await tx.receiptVoucher.deleteMany({
        where: { companyId },
      });

      await tx.internalTransfer.deleteMany({
        where: { companyId },
      });

      await tx.priceQuotation.deleteMany({
        where: { companyId },
      });

      // 5. Delete master data
      await tx.item.deleteMany({
        where: { companyId },
      });

      await tx.itemGroup.deleteMany({
        where: { companyId },
      });

      await tx.unit.deleteMany({
        where: { companyId },
      });

      await tx.customer.deleteMany({
        where: { companyId },
      });

      await tx.supplier.deleteMany({
        where: { companyId },
      });

      await tx.currentAccount.deleteMany({
        where: { companyId },
      });

      await tx.receivableAccount.deleteMany({
        where: { companyId },
      });

      await tx.payableAccount.deleteMany({
        where: { companyId },
      });

      // 6. Delete configuration data
      await tx.expense.deleteMany({
        where: { companyId },
      });

      await tx.expenseCode.deleteMany({
        where: { companyId },
      });

      await tx.expenseType.deleteMany({
        where: { companyId },
      });

      await tx.revenueCode.deleteMany({
        where: { companyId },
      });

      await tx.fiscalYear.deleteMany({
        where: { companyId },
      });

      // 7. Delete company structure that references branches (before branches)
      // Delete stores (they reference branches and users, but we delete them first)
      await tx.store.deleteMany({
        where: { companyId },
      });

      // Delete safes (they reference branches)
      await tx.safe.deleteMany({
        where: { companyId },
      });

      // Delete banks (no branch dependency)
      await tx.bank.deleteMany({
        where: { companyId },
      });

      // 8. Delete users and auth data (users reference branches, so delete before branches)
      // First get all user IDs for this company
      const users = await tx.user.findMany({
        where: { companyId },
        select: { id: true },
      });

      const userIds = users.map((u) => u.id);

      if (userIds.length > 0) {
        await tx.session.deleteMany({
          where: { userId: { in: userIds } },
        });

        await tx.otp.deleteMany({
          where: { userId: { in: userIds } },
        });
      }

      // Delete role permissions - get role IDs first
      const roles = await tx.role.findMany({
        where: { companyId },
        select: { id: true },
      });
      const roleIds = roles.map((r) => r.id);

      if (roleIds.length > 0) {
        await tx.rolePermission.deleteMany({
          where: {
            roleId: { in: roleIds },
          },
        });
      }

      // Delete users (must be before branches since users reference branches)
      await tx.user.deleteMany({
        where: { companyId },
      });

      // Delete roles
      await tx.role.deleteMany({
        where: { companyId },
      });

      // Delete permissions
      await tx.permission.deleteMany({
        where: { companyId },
      });

      // 9. Delete branches (after all references are removed)
      await tx.branch.deleteMany({
        where: { companyId },
      });

      // 9. Delete system data
      await tx.notification.deleteMany({
        where: { companyId },
      });

      await tx.auditLog.deleteMany({
        where: { companyId },
      });

      // Delete subscription
      await tx.subscription.deleteMany({
        where: { companyId },
      });

      // 10. Finally delete the company
      await tx.company.delete({
        where: { id: companyId },
      });
    });
  }
}
