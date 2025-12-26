import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import { DatabaseService } from '../../configs/database/database.service';
import { Prisma } from '@prisma/client';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  // List of all tables with companyId field (in dependency order for proper restore)
  private readonly tenantTables = [
    'Company',
    'Role',
    'Permission',
    'RolePermission',
    'ItemGroup',
    'Unit',
    'Branch',
    'User',
    'Store',
    'Bank',
    'Safe',
    'Customer',
    'Supplier',
    'Item',
    'CurrentAccount',
    'ReceivableAccount',
    'PayableAccount',
    'ExpenseType',
    'ExpenseCode',
    'RevenueCode',
    'Expense',
    'FiscalYear',
    'SalesInvoice',
    'SalesReturn',
    'PurchaseInvoice',
    'PurchaseReturn',
    'PaymentVoucher',
    'ReceiptVoucher',
    'InternalTransfer',
    'PriceQuotation',
    'StoreReceiptVoucher',
    'StoreIssueVoucher',
    'StoreTransferVoucher',
    'StoreReceiptVoucherItem',
    'StoreIssueVoucherItem',
    'StoreTransferVoucherItem',
    'StoreItem',
    'InventoryCount',
    'InventoryCountItem',
    'AuditLog',
    'Notification',
    'Subscription',
  ];

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: DatabaseService,
  ) {}

  async createBackup(companyId: string, companyCode: string): Promise<Buffer> {
    this.logger.log(
      `Creating backup for company: ${companyCode} (${companyId})`,
    );

    try {
      // Step 1: Export database schema
      const schema = await this.exportSchema();

      // Step 2: Export company-specific data
      const data = await this.exportCompanyData(companyId);

      // Step 3: Combine schema and data
      const backupContent = this.combineBackupParts(schema, data, companyCode);

      this.logger.log(
        `Backup created successfully for company: ${companyCode}`,
      );

      return Buffer.from(backupContent, 'utf-8');
    } catch (error) {
      this.logger.error('Failed to create backup', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create database backup: ${errorMessage}`);
    }
  }

  private async exportSchema(): Promise<string> {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not configured');
    }

    const url = new URL(databaseUrl);
    const host = url.hostname;
    const port = url.port || '5432';
    const username = url.username;
    const database = url.pathname.slice(1); // Remove leading '/'
    const password = url.password;

    // Build pg_dump command for schema only
    const command = `pg_dump --host=${host} --port=${port} --username=${username} --dbname=${database} --no-password --schema-only --no-owner --no-acl`;

    this.logger.log('Exporting database schema...');

    try {
      const { stdout } = await execAsync(command, {
        env: {
          ...process.env,
          PGPASSWORD: password,
        },
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      return stdout;
    } catch (error) {
      this.logger.error('Failed to export schema', error);
      throw error;
    }
  }

  private async exportCompanyData(companyId: string): Promise<string> {
    this.logger.log(`Exporting data for company: ${companyId}`);

    const sqlParts: string[] = [];

    // Add transaction wrapper
    sqlParts.push('BEGIN;');
    sqlParts.push('');

    // Export data for each table
    for (const tableName of this.tenantTables) {
      try {
        const tableData = await this.exportTableData(tableName, companyId);
        if (tableData) {
          sqlParts.push(`-- Data for table: ${tableName}`);
          sqlParts.push(tableData);
          sqlParts.push('');
        }
      } catch (error) {
        this.logger.warn(
          `Failed to export data for table ${tableName}: ${error.message}`,
        );
        // Continue with other tables
      }
    }

    // Close transaction
    sqlParts.push('COMMIT;');

    return sqlParts.join('\n');
  }

  private async exportTableData(
    tableName: string,
    companyId: string,
  ): Promise<string> {
    try {
      // Special handling for Company table - export the company itself
      if (tableName === 'Company') {
        const company = await this.prisma.company.findUnique({
          where: { id: companyId },
        });

        if (!company) {
          this.logger.warn(`Company not found: ${companyId}`);
          return '';
        }

        return this.generateInsertStatement('Company', company);
      }

      // For Subscription table, use companyId as the unique key
      if (tableName === 'Subscription') {
        const subscription = await this.prisma.subscription.findUnique({
          where: { companyId },
        });

        if (!subscription) {
          return '';
        }

        return this.generateInsertStatement('Subscription', subscription);
      }

      // For RolePermission, we need to filter through Role
      if (tableName === 'RolePermission') {
        const roles = await this.prisma.role.findMany({
          where: { companyId },
          select: { id: true },
        });

        if (roles.length === 0) {
          return '';
        }

        const roleIds = roles.map((r) => r.id);
        const rolePermissions = await this.prisma.rolePermission.findMany({
          where: {
            roleId: { in: roleIds },
          },
        });

        if (rolePermissions.length === 0) {
          return '';
        }

        return rolePermissions
          .map((rp) => this.generateInsertStatement('RolePermission', rp))
          .join('\n');
      }

      // For tables linked through other tables (StoreItem, StoreReceiptVoucherItem, etc.)
      if (
        [
          'StoreItem',
          'StoreReceiptVoucherItem',
          'StoreIssueVoucherItem',
          'StoreTransferVoucherItem',
          'InventoryCountItem',
        ].includes(tableName)
      ) {
        return await this.exportRelatedTableData(tableName, companyId);
      }

      // For Session and Otp, filter through User
      if (tableName === 'Session' || tableName === 'Otp') {
        return await this.exportRelatedTableData(tableName, companyId);
      }

      // For all other tables, use companyId directly
      const modelName = this.getPrismaModelName(tableName);
      const records = await (this.prisma as any)[modelName].findMany({
        where: { companyId },
      });

      if (records.length === 0) {
        return '';
      }

      return records
        .map((record: any) =>
          this.generateInsertStatement(tableName, record),
        )
        .join('\n');
    } catch (error) {
      this.logger.error(
        `Error exporting table ${tableName}: ${error.message}`,
      );
      return '';
    }
  }

  private async exportRelatedTableData(
    tableName: string,
    companyId: string,
  ): Promise<string> {
    const modelName = this.getPrismaModelName(tableName);

    // StoreItem: filter through Store
    if (tableName === 'StoreItem') {
      const stores = await this.prisma.store.findMany({
        where: { companyId },
        select: { id: true },
      });

      if (stores.length === 0) {
        return '';
      }

      const storeIds = stores.map((s) => s.id);
      const records = await (this.prisma as any)[modelName].findMany({
        where: {
          storeId: { in: storeIds },
        },
      });

      if (records.length === 0) {
        return '';
      }

      return records
        .map((record: any) =>
          this.generateInsertStatement(tableName, record),
        )
        .join('\n');
    }

    // StoreReceiptVoucherItem: filter through StoreReceiptVoucher
    if (tableName === 'StoreReceiptVoucherItem') {
      const vouchers = await this.prisma.storeReceiptVoucher.findMany({
        where: { companyId },
        select: { id: true },
      });

      if (vouchers.length === 0) {
        return '';
      }

      const voucherIds = vouchers.map((v) => v.id);
      const records = await (this.prisma as any)[modelName].findMany({
        where: {
          voucherId: { in: voucherIds },
        },
      });

      if (records.length === 0) {
        return '';
      }

      return records
        .map((record: any) =>
          this.generateInsertStatement(tableName, record),
        )
        .join('\n');
    }

    // StoreIssueVoucherItem: filter through StoreIssueVoucher
    if (tableName === 'StoreIssueVoucherItem') {
      const vouchers = await this.prisma.storeIssueVoucher.findMany({
        where: { companyId },
        select: { id: true },
      });

      if (vouchers.length === 0) {
        return '';
      }

      const voucherIds = vouchers.map((v) => v.id);
      const records = await (this.prisma as any)[modelName].findMany({
        where: {
          voucherId: { in: voucherIds },
        },
      });

      if (records.length === 0) {
        return '';
      }

      return records
        .map((record: any) =>
          this.generateInsertStatement(tableName, record),
        )
        .join('\n');
    }

    // StoreTransferVoucherItem: filter through StoreTransferVoucher
    if (tableName === 'StoreTransferVoucherItem') {
      const vouchers = await this.prisma.storeTransferVoucher.findMany({
        where: { companyId },
        select: { id: true },
      });

      if (vouchers.length === 0) {
        return '';
      }

      const voucherIds = vouchers.map((v) => v.id);
      const records = await (this.prisma as any)[modelName].findMany({
        where: {
          voucherId: { in: voucherIds },
        },
      });

      if (records.length === 0) {
        return '';
      }

      return records
        .map((record: any) =>
          this.generateInsertStatement(tableName, record),
        )
        .join('\n');
    }

    // InventoryCountItem: filter through InventoryCount
    if (tableName === 'InventoryCountItem') {
      const counts = await this.prisma.inventoryCount.findMany({
        where: { companyId },
        select: { id: true },
      });

      if (counts.length === 0) {
        return '';
      }

      const countIds = counts.map((c) => c.id);
      const records = await (this.prisma as any)[modelName].findMany({
        where: {
          inventoryCountId: { in: countIds },
        },
      });

      if (records.length === 0) {
        return '';
      }

      return records
        .map((record: any) =>
          this.generateInsertStatement(tableName, record),
        )
        .join('\n');
    }

    // Session: filter through User
    if (tableName === 'Session') {
      const users = await this.prisma.user.findMany({
        where: { companyId },
        select: { id: true },
      });

      if (users.length === 0) {
        return '';
      }

      const userIds = users.map((u) => u.id);
      const records = await (this.prisma as any)[modelName].findMany({
        where: {
          userId: { in: userIds },
        },
      });

      if (records.length === 0) {
        return '';
      }

      return records
        .map((record: any) =>
          this.generateInsertStatement(tableName, record),
        )
        .join('\n');
    }

    // Otp: filter through User
    if (tableName === 'Otp') {
      const users = await this.prisma.user.findMany({
        where: { companyId },
        select: { id: true },
      });

      if (users.length === 0) {
        return '';
      }

      const userIds = users.map((u) => u.id);
      const records = await (this.prisma as any)[modelName].findMany({
        where: {
          userId: { in: userIds },
        },
      });

      if (records.length === 0) {
        return '';
      }

      return records
        .map((record: any) =>
          this.generateInsertStatement(tableName, record),
        )
        .join('\n');
    }

    return '';
  }

  private generateInsertStatement(tableName: string, record: any): string {
    const columns: string[] = [];
    const values: string[] = [];

    for (const [key, value] of Object.entries(record)) {
      // Skip Prisma internal fields
      if (key.startsWith('_')) {
        continue;
      }

      columns.push(`"${key}"`);

      if (value === null) {
        values.push('NULL');
      } else if (value instanceof Date) {
        values.push(`'${value.toISOString()}'`);
      } else if (typeof value === 'boolean') {
        values.push(value ? 'true' : 'false');
      } else if (typeof value === 'number') {
        values.push(String(value));
      } else if (typeof value === 'string') {
        // Escape single quotes in strings
        const escaped = value.replace(/'/g, "''");
        values.push(`'${escaped}'`);
      } else if (Buffer.isBuffer(value)) {
        // Handle binary data (e.g., logo, image)
        const hex = value.toString('hex');
        values.push(`'\\x${hex}'`);
      } else if (typeof value === 'object' && value !== null) {
        // Handle JSON fields - use PostgreSQL JSON type casting
        const jsonStr = JSON.stringify(value).replace(/'/g, "''");
        values.push(`'${jsonStr}'::jsonb`);
      } else {
        values.push(`'${String(value)}'`);
      }
    }

    return `INSERT INTO "${tableName}" (${columns.join(', ')}) VALUES (${values.join(', ')});`;
  }

  private combineBackupParts(
    schema: string,
    data: string,
    companyCode: string,
  ): string {
    const parts: string[] = [];

    // Add header comment
    parts.push('-- StockPro Multi-Tenant Backup');
    parts.push(`-- Company Code: ${companyCode}`);
    parts.push(`-- Generated: ${new Date().toISOString()}`);
    parts.push('');
    parts.push('-- ============================================');
    parts.push('-- DATABASE SCHEMA');
    parts.push('-- ============================================');
    parts.push('');
    parts.push(schema);
    parts.push('');
    parts.push('-- ============================================');
    parts.push('-- COMPANY DATA');
    parts.push('-- ============================================');
    parts.push('');
    parts.push(data);

    return parts.join('\n');
  }

  private getPrismaModelName(modelName: string): string {
    // Prisma converts PascalCase model names to camelCase
    // First letter lowercase, rest stays the same
    return modelName.charAt(0).toLowerCase() + modelName.slice(1);
  }

  getBackupFilename(companyCode: string): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19);
    return `stockpro_backup_${companyCode}_${timestamp}.sql`;
  }
}
