import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import {
  AuditTrialResponse,
  TrialBalanceEntry,
} from './dtos/response/audit-trial.response';
import { IncomeStatementService } from '../income-statement/income-statement.service';

@Injectable()
export class AuditTrialService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly incomeStatementService: IncomeStatementService,
  ) {}

  async getAuditTrial(
    companyId: string,
    startDate: string,
    endDate: string,
  ): Promise<AuditTrialResponse> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const dayBeforeStart = new Date(start);
    dayBeforeStart.setDate(dayBeforeStart.getDate() - 1);
    dayBeforeStart.setHours(23, 59, 59, 999);

    const entries: TrialBalanceEntry[] = [];

    // ASSETS
    // 1. Cash in Safes
    const cashInSafes = await this.calculateCashInSafes(
      companyId,
      dayBeforeStart,
      start,
      end,
    );
    entries.push(cashInSafes);

    // 2. Cash in Banks
    const cashInBanks = await this.calculateCashInBanks(
      companyId,
      dayBeforeStart,
      start,
      end,
    );
    entries.push(cashInBanks);

    // 3. Customers (Receivables)
    const customers = await this.calculateCustomers(
      companyId,
      dayBeforeStart,
      start,
      end,
    );
    entries.push(customers);

    // 4. Other Receivables
    const otherReceivables = await this.calculateOtherReceivables(
      companyId,
      dayBeforeStart,
      start,
      end,
    );
    entries.push(otherReceivables);

    // 5. Inventory
    const inventory = await this.calculateInventory(
      companyId,
      dayBeforeStart,
      start,
      end,
    );
    entries.push(inventory);

    // LIABILITIES
    // 6. Suppliers (Payables)
    const suppliers = await this.calculateSuppliers(
      companyId,
      dayBeforeStart,
      start,
      end,
    );
    entries.push(suppliers);

    // 7. Other Payables
    const otherPayables = await this.calculateOtherPayables(
      companyId,
      dayBeforeStart,
      start,
      end,
    );
    entries.push(otherPayables);

    // 8. VAT Payable
    const vatPayable = await this.calculateVatPayable(
      companyId,
      dayBeforeStart,
      start,
      end,
    );
    entries.push(vatPayable);

    // EQUITY
    // 9. Capital
    const capital = await this.calculateCapital(
      companyId,
      dayBeforeStart,
      start,
      end,
    );
    entries.push(capital);

    // 10. Partners Balance (Current Accounts)
    const partnersBalance = await this.calculatePartnersBalance(
      companyId,
      dayBeforeStart,
      start,
      end,
    );
    entries.push(partnersBalance);

    // 11. Retained Earnings
    const retainedEarnings = await this.calculateRetainedEarnings(
      companyId,
      dayBeforeStart,
      start,
      end,
    );
    entries.push(retainedEarnings);

    // REVENUE
    // 12. Sales
    const sales = await this.calculateSales(
      companyId,
      dayBeforeStart,
      start,
      end,
    );
    entries.push(sales);

    // 13. Sales Returns (negative revenue)
    const salesReturns = await this.calculateSalesReturns(
      companyId,
      dayBeforeStart,
      start,
      end,
    );
    entries.push(salesReturns);

    // 14. Other Revenues
    const otherRevenues = await this.calculateOtherRevenues(
      companyId,
      dayBeforeStart,
      start,
      end,
    );
    entries.push(otherRevenues);

    // EXPENSES
    // 15. Purchases
    const purchases = await this.calculatePurchases(
      companyId,
      dayBeforeStart,
      start,
      end,
    );
    entries.push(purchases);

    // 16. Purchase Returns (negative expense)
    const purchaseReturns = await this.calculatePurchaseReturns(
      companyId,
      dayBeforeStart,
      start,
      end,
    );
    entries.push(purchaseReturns);

    // 17. Expenses by Type
    const expensesByType = await this.calculateExpensesByType(
      companyId,
      dayBeforeStart,
      start,
      end,
    );
    entries.push(...expensesByType);

    // Get company currency
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    const currency = company?.currency || 'SAR';

    return {
      entries,
      currency,
    };
  }

  private async calculateCashInSafes(
    companyId: string,
    dayBeforeStart: Date,
    startDate: Date,
    endDate: Date,
  ): Promise<TrialBalanceEntry> {
    const safes = await this.prisma.safe.findMany({
      where: { companyId },
    });

    let openingDebit = 0;
    let openingCredit = 0;
    let periodDebit = 0;
    let periodCredit = 0;

    for (const safe of safes) {
      // Opening balance (before startDate)
      let opening = safe.openingBalance || 0;

      // Receipt vouchers before start
      const receiptsBefore = await this.prisma.receiptVoucher.aggregate({
        where: {
          companyId,
          paymentMethod: 'safe',
          safeId: safe.id,
          date: { lte: dayBeforeStart },
        },
        _sum: { amount: true },
      });
      opening += receiptsBefore._sum.amount || 0;

      // Payment vouchers before start
      const paymentsBefore = await this.prisma.paymentVoucher.aggregate({
        where: {
          companyId,
          paymentMethod: 'safe',
          safeId: safe.id,
          date: { lte: dayBeforeStart },
        },
        _sum: { amount: true },
      });
      opening -= paymentsBefore._sum.amount || 0;

      // Internal transfers before start
      const transfersFromBefore = await this.prisma.internalTransfer.aggregate({
        where: {
          companyId,
          fromType: 'safe',
          fromSafeId: safe.id,
          date: { lte: dayBeforeStart },
        },
        _sum: { amount: true },
      });
      opening -= transfersFromBefore._sum.amount || 0;

      const transfersToBefore = await this.prisma.internalTransfer.aggregate({
        where: {
          companyId,
          toType: 'safe',
          toSafeId: safe.id,
          date: { lte: dayBeforeStart },
        },
        _sum: { amount: true },
      });
      opening += transfersToBefore._sum.amount || 0;

      // Sales invoices before start
      const salesBefore = await this.prisma.salesInvoice.aggregate({
        where: {
          companyId,
          paymentMethod: 'cash',
          paymentTargetType: 'safe',
          safeId: safe.id,
          isSplitPayment: false,
          date: { lte: dayBeforeStart },
        },
        _sum: { net: true },
      });
      opening += salesBefore._sum.net || 0;

      // Split sales before start
      const splitSalesBefore = await this.prisma.salesInvoice.findMany({
        where: {
          companyId,
          paymentMethod: 'cash',
          isSplitPayment: true,
          splitSafeId: safe.id,
          date: { lte: dayBeforeStart },
        },
        select: { splitCashAmount: true },
      });
      opening += splitSalesBefore.reduce(
        (sum, inv) => sum + (inv.splitCashAmount || 0),
        0,
      );

      // Sales returns before start
      const salesReturnsBefore = await this.prisma.salesReturn.aggregate({
        where: {
          companyId,
          paymentMethod: 'cash',
          paymentTargetType: 'safe',
          safeId: safe.id,
          date: { lte: dayBeforeStart },
        },
        _sum: { net: true },
      });
      opening -= salesReturnsBefore._sum.net || 0;

      // Purchase invoices before start
      const purchasesBefore = await this.prisma.purchaseInvoice.aggregate({
        where: {
          companyId,
          paymentMethod: 'cash',
          paymentTargetType: 'safe',
          safeId: safe.id,
          date: { lte: dayBeforeStart },
        },
        _sum: { net: true },
      });
      opening -= purchasesBefore._sum.net || 0;

      // Purchase returns before start
      const purchaseReturnsBefore = await this.prisma.purchaseReturn.aggregate({
        where: {
          companyId,
          paymentMethod: 'cash',
          paymentTargetType: 'safe',
          safeId: safe.id,
          date: { lte: dayBeforeStart },
        },
        _sum: { net: true },
      });
      opening += purchaseReturnsBefore._sum.net || 0;

      if (opening > 0) {
        openingDebit += opening;
      } else {
        openingCredit += Math.abs(opening);
      }

      // Period movements (between start and end)
      // Receipt vouchers in period
      const receiptsPeriod = await this.prisma.receiptVoucher.aggregate({
        where: {
          companyId,
          paymentMethod: 'safe',
          safeId: safe.id,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      });
      periodDebit += receiptsPeriod._sum.amount || 0;

      // Payment vouchers in period
      const paymentsPeriod = await this.prisma.paymentVoucher.aggregate({
        where: {
          companyId,
          paymentMethod: 'safe',
          safeId: safe.id,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      });
      periodCredit += paymentsPeriod._sum.amount || 0;

      // Internal transfers in period
      const transfersFromPeriod = await this.prisma.internalTransfer.aggregate({
        where: {
          companyId,
          fromType: 'safe',
          fromSafeId: safe.id,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      });
      periodCredit += transfersFromPeriod._sum.amount || 0;

      const transfersToPeriod = await this.prisma.internalTransfer.aggregate({
        where: {
          companyId,
          toType: 'safe',
          toSafeId: safe.id,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      });
      periodDebit += transfersToPeriod._sum.amount || 0;

      // Sales invoices in period
      const salesPeriod = await this.prisma.salesInvoice.aggregate({
        where: {
          companyId,
          paymentMethod: 'cash',
          paymentTargetType: 'safe',
          safeId: safe.id,
          isSplitPayment: false,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { net: true },
      });
      periodDebit += salesPeriod._sum.net || 0;

      // Split sales in period
      const splitSalesPeriod = await this.prisma.salesInvoice.findMany({
        where: {
          companyId,
          paymentMethod: 'cash',
          isSplitPayment: true,
          splitSafeId: safe.id,
          date: { gte: startDate, lte: endDate },
        },
        select: { splitCashAmount: true },
      });
      periodDebit += splitSalesPeriod.reduce(
        (sum, inv) => sum + (inv.splitCashAmount || 0),
        0,
      );

      // Sales returns in period
      const salesReturnsPeriod = await this.prisma.salesReturn.aggregate({
        where: {
          companyId,
          paymentMethod: 'cash',
          paymentTargetType: 'safe',
          safeId: safe.id,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { net: true },
      });
      periodCredit += salesReturnsPeriod._sum.net || 0;

      // Purchase invoices in period
      const purchasesPeriod = await this.prisma.purchaseInvoice.aggregate({
        where: {
          companyId,
          paymentMethod: 'cash',
          paymentTargetType: 'safe',
          safeId: safe.id,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { net: true },
      });
      periodCredit += purchasesPeriod._sum.net || 0;

      // Purchase returns in period
      const purchaseReturnsPeriod = await this.prisma.purchaseReturn.aggregate({
        where: {
          companyId,
          paymentMethod: 'cash',
          paymentTargetType: 'safe',
          safeId: safe.id,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { net: true },
      });
      periodDebit += purchaseReturnsPeriod._sum.net || 0;
    }

    const closingDebit = openingDebit + periodDebit - periodCredit;
    const closingCredit = closingDebit < 0 ? Math.abs(closingDebit) : 0;
    const finalClosingDebit = closingDebit > 0 ? closingDebit : 0;

    return {
      id: '1101',
      accountCode: '1101',
      accountName: 'النقدية',
      category: 'Assets',
      openingBalanceDebit: openingDebit,
      openingBalanceCredit: openingCredit,
      periodDebit,
      periodCredit,
      closingBalanceDebit: finalClosingDebit,
      closingBalanceCredit: closingCredit,
    };
  }

  private async calculateCashInBanks(
    companyId: string,
    dayBeforeStart: Date,
    startDate: Date,
    endDate: Date,
  ): Promise<TrialBalanceEntry> {
    const banks = await this.prisma.bank.findMany({
      where: { companyId },
    });

    let openingDebit = 0;
    let openingCredit = 0;
    let periodDebit = 0;
    let periodCredit = 0;

    for (const bank of banks) {
      // Opening balance
      let opening = bank.openingBalance || 0;

      // Receipt vouchers before start
      const receiptsBefore = await this.prisma.receiptVoucher.aggregate({
        where: {
          companyId,
          paymentMethod: 'bank',
          bankId: bank.id,
          date: { lte: dayBeforeStart },
        },
        _sum: { amount: true },
      });
      opening += receiptsBefore._sum.amount || 0;

      // Payment vouchers before start
      const paymentsBefore = await this.prisma.paymentVoucher.aggregate({
        where: {
          companyId,
          paymentMethod: 'bank',
          bankId: bank.id,
          date: { lte: dayBeforeStart },
        },
        _sum: { amount: true },
      });
      opening -= paymentsBefore._sum.amount || 0;

      // Internal transfers before start
      const transfersFromBefore = await this.prisma.internalTransfer.aggregate({
        where: {
          companyId,
          fromType: 'bank',
          fromBankId: bank.id,
          date: { lte: dayBeforeStart },
        },
        _sum: { amount: true },
      });
      opening -= transfersFromBefore._sum.amount || 0;

      const transfersToBefore = await this.prisma.internalTransfer.aggregate({
        where: {
          companyId,
          toType: 'bank',
          toBankId: bank.id,
          date: { lte: dayBeforeStart },
        },
        _sum: { amount: true },
      });
      opening += transfersToBefore._sum.amount || 0;

      // Sales invoices before start
      const salesBefore = await this.prisma.salesInvoice.aggregate({
        where: {
          companyId,
          paymentMethod: 'cash',
          paymentTargetType: 'bank',
          bankId: bank.id,
          isSplitPayment: false,
          date: { lte: dayBeforeStart },
        },
        _sum: { net: true },
      });
      opening += salesBefore._sum.net || 0;

      // Split sales before start
      const splitSalesBefore = await this.prisma.salesInvoice.findMany({
        where: {
          companyId,
          paymentMethod: 'cash',
          isSplitPayment: true,
          splitBankId: bank.id,
          date: { lte: dayBeforeStart },
        },
        select: { splitBankAmount: true },
      });
      opening += splitSalesBefore.reduce(
        (sum, inv) => sum + (inv.splitBankAmount || 0),
        0,
      );

      // Sales returns before start
      const salesReturnsBefore = await this.prisma.salesReturn.aggregate({
        where: {
          companyId,
          paymentMethod: 'cash',
          paymentTargetType: 'bank',
          bankId: bank.id,
          date: { lte: dayBeforeStart },
        },
        _sum: { net: true },
      });
      opening -= salesReturnsBefore._sum.net || 0;

      // Purchase invoices before start
      const purchasesBefore = await this.prisma.purchaseInvoice.aggregate({
        where: {
          companyId,
          paymentMethod: 'cash',
          paymentTargetType: 'bank',
          bankId: bank.id,
          date: { lte: dayBeforeStart },
        },
        _sum: { net: true },
      });
      opening -= purchasesBefore._sum.net || 0;

      // Purchase returns before start
      const purchaseReturnsBefore = await this.prisma.purchaseReturn.aggregate({
        where: {
          companyId,
          paymentMethod: 'cash',
          paymentTargetType: 'bank',
          bankId: bank.id,
          date: { lte: dayBeforeStart },
        },
        _sum: { net: true },
      });
      opening += purchaseReturnsBefore._sum.net || 0;

      if (opening > 0) {
        openingDebit += opening;
      } else {
        openingCredit += Math.abs(opening);
      }

      // Period movements
      const receiptsPeriod = await this.prisma.receiptVoucher.aggregate({
        where: {
          companyId,
          paymentMethod: 'bank',
          bankId: bank.id,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      });
      periodDebit += receiptsPeriod._sum.amount || 0;

      const paymentsPeriod = await this.prisma.paymentVoucher.aggregate({
        where: {
          companyId,
          paymentMethod: 'bank',
          bankId: bank.id,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      });
      periodCredit += paymentsPeriod._sum.amount || 0;

      const transfersFromPeriod = await this.prisma.internalTransfer.aggregate({
        where: {
          companyId,
          fromType: 'bank',
          fromBankId: bank.id,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      });
      periodCredit += transfersFromPeriod._sum.amount || 0;

      const transfersToPeriod = await this.prisma.internalTransfer.aggregate({
        where: {
          companyId,
          toType: 'bank',
          toBankId: bank.id,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      });
      periodDebit += transfersToPeriod._sum.amount || 0;

      const salesPeriod = await this.prisma.salesInvoice.aggregate({
        where: {
          companyId,
          paymentMethod: 'cash',
          paymentTargetType: 'bank',
          bankId: bank.id,
          isSplitPayment: false,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { net: true },
      });
      periodDebit += salesPeriod._sum.net || 0;

      const splitSalesPeriod = await this.prisma.salesInvoice.findMany({
        where: {
          companyId,
          paymentMethod: 'cash',
          isSplitPayment: true,
          splitBankId: bank.id,
          date: { gte: startDate, lte: endDate },
        },
        select: { splitBankAmount: true },
      });
      periodDebit += splitSalesPeriod.reduce(
        (sum, inv) => sum + (inv.splitBankAmount || 0),
        0,
      );

      const salesReturnsPeriod = await this.prisma.salesReturn.aggregate({
        where: {
          companyId,
          paymentMethod: 'cash',
          paymentTargetType: 'bank',
          bankId: bank.id,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { net: true },
      });
      periodCredit += salesReturnsPeriod._sum.net || 0;

      const purchasesPeriod = await this.prisma.purchaseInvoice.aggregate({
        where: {
          companyId,
          paymentMethod: 'cash',
          paymentTargetType: 'bank',
          bankId: bank.id,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { net: true },
      });
      periodCredit += purchasesPeriod._sum.net || 0;

      const purchaseReturnsPeriod = await this.prisma.purchaseReturn.aggregate({
        where: {
          companyId,
          paymentMethod: 'cash',
          paymentTargetType: 'bank',
          bankId: bank.id,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { net: true },
      });
      periodDebit += purchaseReturnsPeriod._sum.net || 0;
    }

    const closingDebit = openingDebit + periodDebit - periodCredit;
    const closingCredit = closingDebit < 0 ? Math.abs(closingDebit) : 0;
    const finalClosingDebit = closingDebit > 0 ? closingDebit : 0;

    return {
      id: '1102',
      accountCode: '1102',
      accountName: 'البنوك',
      category: 'Assets',
      openingBalanceDebit: openingDebit,
      openingBalanceCredit: openingCredit,
      periodDebit,
      periodCredit,
      closingBalanceDebit: finalClosingDebit,
      closingBalanceCredit: closingCredit,
    };
  }

  private async calculateCustomers(
    companyId: string,
    dayBeforeStart: Date,
    startDate: Date,
    endDate: Date,
  ): Promise<TrialBalanceEntry> {
    const customers = await this.prisma.customer.findMany({
      where: { companyId },
    });

    let openingDebit = 0;
    let openingCredit = 0;
    let periodDebit = 0;
    let periodCredit = 0;

    for (const customer of customers) {
      // Opening balance from credit sales before start
      const creditSalesBefore = await this.prisma.salesInvoice.aggregate({
        where: {
          companyId,
          customerId: customer.id,
          paymentMethod: 'credit',
          date: { lte: dayBeforeStart },
        },
        _sum: { net: true },
      });
      const salesBefore = creditSalesBefore._sum.net || 0;

      // Credit sales returns before start
      const creditReturnsBefore = await this.prisma.salesReturn.aggregate({
        where: {
          companyId,
          customerId: customer.id,
          paymentMethod: 'credit',
          date: { lte: dayBeforeStart },
        },
        _sum: { net: true },
      });
      const returnsBefore = creditReturnsBefore._sum.net || 0;

      // Receipt vouchers before start (payments from customer)
      const receiptsBefore = await this.prisma.receiptVoucher.aggregate({
        where: {
          companyId,
          customerId: customer.id,
          date: { lte: dayBeforeStart },
        },
        _sum: { amount: true },
      });
      const receipts = receiptsBefore._sum.amount || 0;

      const opening = salesBefore - returnsBefore - receipts;
      if (opening > 0) {
        openingDebit += opening;
      } else {
        openingCredit += Math.abs(opening);
      }

      // Period movements
      const creditSalesPeriod = await this.prisma.salesInvoice.aggregate({
        where: {
          companyId,
          customerId: customer.id,
          paymentMethod: 'credit',
          date: { gte: startDate, lte: endDate },
        },
        _sum: { net: true },
      });
      periodDebit += creditSalesPeriod._sum.net || 0;

      const creditReturnsPeriod = await this.prisma.salesReturn.aggregate({
        where: {
          companyId,
          customerId: customer.id,
          paymentMethod: 'credit',
          date: { gte: startDate, lte: endDate },
        },
        _sum: { net: true },
      });
      periodCredit += creditReturnsPeriod._sum.net || 0;

      const receiptsPeriod = await this.prisma.receiptVoucher.aggregate({
        where: {
          companyId,
          customerId: customer.id,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      });
      periodCredit += receiptsPeriod._sum.amount || 0;
    }

    const closingDebit = openingDebit + periodDebit - periodCredit;
    const closingCredit = closingDebit < 0 ? Math.abs(closingDebit) : 0;
    const finalClosingDebit = closingDebit > 0 ? closingDebit : 0;

    return {
      id: '1201',
      accountCode: '1201',
      accountName: 'العملاء',
      category: 'Assets',
      openingBalanceDebit: openingDebit,
      openingBalanceCredit: openingCredit,
      periodDebit,
      periodCredit,
      closingBalanceDebit: finalClosingDebit,
      closingBalanceCredit: closingCredit,
    };
  }

  private async calculateOtherReceivables(
    companyId: string,
    dayBeforeStart: Date,
    startDate: Date,
    endDate: Date,
  ): Promise<TrialBalanceEntry> {
    const receivableAccounts = await this.prisma.receivableAccount.findMany({
      where: { companyId },
    });

    let openingDebit = 0;
    let openingCredit = 0;
    let periodDebit = 0;
    let periodCredit = 0;

    for (const account of receivableAccounts) {
      let opening = account.openingBalance || 0;

      // Receipt vouchers before start
      const receiptsBefore = await this.prisma.receiptVoucher.aggregate({
        where: {
          companyId,
          receivableAccountId: account.id,
          date: { lte: dayBeforeStart },
        },
        _sum: { amount: true },
      });
      opening -= receiptsBefore._sum.amount || 0;

      // Payment vouchers before start
      const paymentsBefore = await this.prisma.paymentVoucher.aggregate({
        where: {
          companyId,
          receivableAccountId: account.id,
          date: { lte: dayBeforeStart },
        },
        _sum: { amount: true },
      });
      opening += paymentsBefore._sum.amount || 0;

      if (opening > 0) {
        openingDebit += opening;
      } else {
        openingCredit += Math.abs(opening);
      }

      // Period movements
      const receiptsPeriod = await this.prisma.receiptVoucher.aggregate({
        where: {
          companyId,
          receivableAccountId: account.id,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      });
      periodCredit += receiptsPeriod._sum.amount || 0;

      const paymentsPeriod = await this.prisma.paymentVoucher.aggregate({
        where: {
          companyId,
          receivableAccountId: account.id,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      });
      periodDebit += paymentsPeriod._sum.amount || 0;
    }

    const closingDebit = openingDebit + periodDebit - periodCredit;
    const closingCredit = closingDebit < 0 ? Math.abs(closingDebit) : 0;
    const finalClosingDebit = closingDebit > 0 ? closingDebit : 0;

    return {
      id: '1202',
      accountCode: '1202',
      accountName: 'ارصدة مدينة اخري',
      category: 'Assets',
      openingBalanceDebit: openingDebit,
      openingBalanceCredit: openingCredit,
      periodDebit,
      periodCredit,
      closingBalanceDebit: finalClosingDebit,
      closingBalanceCredit: closingCredit,
    };
  }

  private async calculateInventory(
    companyId: string,
    dayBeforeStart: Date,
    startDate: Date,
    endDate: Date,
  ): Promise<TrialBalanceEntry> {
    // Opening inventory (at day before start)
    const openingInventory = await this.calculateInventoryValue(
      companyId,
      dayBeforeStart.toISOString().split('T')[0],
    );

    // Closing inventory (at end date)
    const closingInventory = await this.calculateInventoryValue(
      companyId,
      endDate.toISOString().split('T')[0],
    );

    // Period movements: purchases - sales (COGS)
    // Note: items is a Json field, not a relation
    const purchases = await this.prisma.purchaseInvoice.findMany({
      where: {
        companyId,
        date: { gte: startDate, lte: endDate },
      },
      select: {
        items: true,
      },
    });

    const sales = await this.prisma.salesInvoice.findMany({
      where: {
        companyId,
        date: { gte: startDate, lte: endDate },
      },
      select: {
        items: true,
      },
    });

    // Calculate period debit (purchases) and credit (sales)
    let periodDebit = 0;
    let periodCredit = 0;

    for (const purchase of purchases) {
      if (purchase.items && typeof purchase.items === 'object') {
        const items = Array.isArray(purchase.items) ? purchase.items : [];
        for (const item of items) {
          const itemObj = item as any;
          periodDebit += itemObj.totalPrice || itemObj.total || 0;
        }
      }
    }

    for (const sale of sales) {
      if (sale.items && typeof sale.items === 'object') {
        const items = Array.isArray(sale.items) ? sale.items : [];
        for (const item of items) {
          const itemObj = item as any;
          periodCredit += itemObj.totalPrice || itemObj.total || 0;
        }
      }
    }

    const openingDebit = openingInventory > 0 ? openingInventory : 0;
    const openingCredit = openingInventory < 0 ? Math.abs(openingInventory) : 0;

    const closingDebit = closingInventory > 0 ? closingInventory : 0;
    const closingCredit = closingInventory < 0 ? Math.abs(closingInventory) : 0;

    return {
      id: '1301',
      accountCode: '1301',
      accountName: 'مخزون البضاعة',
      category: 'Assets',
      openingBalanceDebit: openingDebit,
      openingBalanceCredit: openingCredit,
      periodDebit,
      periodCredit,
      closingBalanceDebit: closingDebit,
      closingBalanceCredit: closingCredit,
    };
  }

  private async calculateSuppliers(
    companyId: string,
    dayBeforeStart: Date,
    startDate: Date,
    endDate: Date,
  ): Promise<TrialBalanceEntry> {
    const suppliers = await this.prisma.supplier.findMany({
      where: { companyId },
    });

    let openingDebit = 0;
    let openingCredit = 0;
    let periodDebit = 0;
    let periodCredit = 0;

    for (const supplier of suppliers) {
      // Opening balance from credit purchases before start
      const creditPurchasesBefore = await this.prisma.purchaseInvoice.aggregate({
        where: {
          companyId,
          supplierId: supplier.id,
          paymentMethod: 'credit',
          date: { lte: dayBeforeStart },
        },
        _sum: { net: true },
      });
      const purchasesBefore = creditPurchasesBefore._sum.net || 0;

      // Credit purchase returns before start
      const creditReturnsBefore = await this.prisma.purchaseReturn.aggregate({
        where: {
          companyId,
          supplierId: supplier.id,
          paymentMethod: 'credit',
          date: { lte: dayBeforeStart },
        },
        _sum: { net: true },
      });
      const returnsBefore = creditReturnsBefore._sum.net || 0;

      // Payment vouchers before start (payments to supplier)
      const paymentsBefore = await this.prisma.paymentVoucher.aggregate({
        where: {
          companyId,
          supplierId: supplier.id,
          date: { lte: dayBeforeStart },
        },
        _sum: { amount: true },
      });
      const payments = paymentsBefore._sum.amount || 0;

      const opening = purchasesBefore - returnsBefore - payments;
      if (opening > 0) {
        openingCredit += opening; // We owe them
      } else {
        openingDebit += Math.abs(opening);
      }

      // Period movements
      const creditPurchasesPeriod = await this.prisma.purchaseInvoice.aggregate({
        where: {
          companyId,
          supplierId: supplier.id,
          paymentMethod: 'credit',
          date: { gte: startDate, lte: endDate },
        },
        _sum: { net: true },
      });
      periodCredit += creditPurchasesPeriod._sum.net || 0;

      const creditReturnsPeriod = await this.prisma.purchaseReturn.aggregate({
        where: {
          companyId,
          supplierId: supplier.id,
          paymentMethod: 'credit',
          date: { gte: startDate, lte: endDate },
        },
        _sum: { net: true },
      });
      periodDebit += creditReturnsPeriod._sum.net || 0;

      const paymentsPeriod = await this.prisma.paymentVoucher.aggregate({
        where: {
          companyId,
          supplierId: supplier.id,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      });
      periodDebit += paymentsPeriod._sum.amount || 0;
    }

    const closingCredit = openingCredit + periodCredit - periodDebit;
    const closingDebit = closingCredit < 0 ? Math.abs(closingCredit) : 0;
    const finalClosingCredit = closingCredit > 0 ? closingCredit : 0;

    return {
      id: '2101',
      accountCode: '2101',
      accountName: 'الموردين',
      category: 'Liabilities',
      openingBalanceDebit: openingDebit,
      openingBalanceCredit: openingCredit,
      periodDebit,
      periodCredit,
      closingBalanceDebit: closingDebit,
      closingBalanceCredit: finalClosingCredit,
    };
  }

  private async calculateOtherPayables(
    companyId: string,
    dayBeforeStart: Date,
    startDate: Date,
    endDate: Date,
  ): Promise<TrialBalanceEntry> {
    const payableAccounts = await this.prisma.payableAccount.findMany({
      where: { companyId },
    });

    let openingDebit = 0;
    let openingCredit = 0;
    let periodDebit = 0;
    let periodCredit = 0;

    for (const account of payableAccounts) {
      let opening = account.openingBalance || 0;

      // Receipt vouchers before start
      const receiptsBefore = await this.prisma.receiptVoucher.aggregate({
        where: {
          companyId,
          payableAccountId: account.id,
          date: { lte: dayBeforeStart },
        },
        _sum: { amount: true },
      });
      opening += receiptsBefore._sum.amount || 0;

      // Payment vouchers before start
      const paymentsBefore = await this.prisma.paymentVoucher.aggregate({
        where: {
          companyId,
          payableAccountId: account.id,
          date: { lte: dayBeforeStart },
        },
        _sum: { amount: true },
      });
      opening -= paymentsBefore._sum.amount || 0;

      if (opening > 0) {
        openingCredit += opening;
      } else {
        openingDebit += Math.abs(opening);
      }

      // Period movements
      const receiptsPeriod = await this.prisma.receiptVoucher.aggregate({
        where: {
          companyId,
          payableAccountId: account.id,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      });
      periodCredit += receiptsPeriod._sum.amount || 0;

      const paymentsPeriod = await this.prisma.paymentVoucher.aggregate({
        where: {
          companyId,
          payableAccountId: account.id,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      });
      periodDebit += paymentsPeriod._sum.amount || 0;
    }

    const closingCredit = openingCredit + periodCredit - periodDebit;
    const closingDebit = closingCredit < 0 ? Math.abs(closingCredit) : 0;
    const finalClosingCredit = closingCredit > 0 ? closingCredit : 0;

    return {
      id: '2102',
      accountCode: '2102',
      accountName: 'ارصدة دائنة اخري',
      category: 'Liabilities',
      openingBalanceDebit: openingDebit,
      openingBalanceCredit: openingCredit,
      periodDebit,
      periodCredit,
      closingBalanceDebit: closingDebit,
      closingBalanceCredit: finalClosingCredit,
    };
  }

  private async calculateVatPayable(
    companyId: string,
    dayBeforeStart: Date,
    startDate: Date,
    endDate: Date,
  ): Promise<TrialBalanceEntry> {
    // Calculate VAT from sales and purchases
    // Opening VAT (before start)
    const salesBefore = await this.prisma.salesInvoice.aggregate({
      where: {
        companyId,
        date: { lte: dayBeforeStart },
      },
      _sum: { tax: true },
    });
    const salesTaxBefore = salesBefore._sum.tax || 0;

    const salesReturnsBefore = await this.prisma.salesReturn.aggregate({
      where: {
        companyId,
        date: { lte: dayBeforeStart },
      },
      _sum: { tax: true },
    });
    const salesReturnsTaxBefore = salesReturnsBefore._sum.tax || 0;

    const purchasesBefore = await this.prisma.purchaseInvoice.aggregate({
      where: {
        companyId,
        date: { lte: dayBeforeStart },
      },
      _sum: { tax: true },
    });
    const purchaseTaxBefore = purchasesBefore._sum.tax || 0;

    const purchaseReturnsBefore = await this.prisma.purchaseReturn.aggregate({
      where: {
        companyId,
        date: { lte: dayBeforeStart },
      },
      _sum: { tax: true },
    });
    const purchaseReturnsTaxBefore = purchaseReturnsBefore._sum.tax || 0;

    const openingVat =
      salesTaxBefore -
      salesReturnsTaxBefore -
      purchaseTaxBefore +
      purchaseReturnsTaxBefore;

    const openingCredit = openingVat > 0 ? openingVat : 0;
    const openingDebit = openingVat < 0 ? Math.abs(openingVat) : 0;

    // Period movements
    const salesPeriod = await this.prisma.salesInvoice.aggregate({
      where: {
        companyId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { tax: true },
    });
    const salesTaxPeriod = salesPeriod._sum.tax || 0;

    const salesReturnsPeriod = await this.prisma.salesReturn.aggregate({
      where: {
        companyId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { tax: true },
    });
    const salesReturnsTaxPeriod = salesReturnsPeriod._sum.tax || 0;

    const purchasesPeriod = await this.prisma.purchaseInvoice.aggregate({
      where: {
        companyId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { tax: true },
    });
    const purchaseTaxPeriod = purchasesPeriod._sum.tax || 0;

    const purchaseReturnsPeriod = await this.prisma.purchaseReturn.aggregate({
      where: {
        companyId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { tax: true },
    });
    const purchaseReturnsTaxPeriod = purchaseReturnsPeriod._sum.tax || 0;

    const periodCredit =
      salesTaxPeriod - salesReturnsTaxPeriod - purchaseTaxPeriod + purchaseReturnsTaxPeriod;

    const closingCredit = openingCredit + periodCredit;
    const closingDebit = 0;

    return {
      id: '2201',
      accountCode: '2201',
      accountName: 'ضريبة القيمة المضافة',
      category: 'Liabilities',
      openingBalanceDebit: openingDebit,
      openingBalanceCredit: openingCredit,
      periodDebit: 0,
      periodCredit,
      closingBalanceDebit: closingDebit,
      closingBalanceCredit: closingCredit,
    };
  }

  private async calculateCapital(
    companyId: string,
    dayBeforeStart: Date,
    startDate: Date,
    endDate: Date,
  ): Promise<TrialBalanceEntry> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    const capital = company?.capital || 0;

    return {
      id: '3101',
      accountCode: '3101',
      accountName: 'راس المال',
      category: 'Equity',
      openingBalanceDebit: 0,
      openingBalanceCredit: capital,
      periodDebit: 0,
      periodCredit: 0,
      closingBalanceDebit: 0,
      closingBalanceCredit: capital,
    };
  }

  private async calculatePartnersBalance(
    companyId: string,
    dayBeforeStart: Date,
    startDate: Date,
    endDate: Date,
  ): Promise<TrialBalanceEntry> {
    const currentAccounts = await this.prisma.currentAccount.findMany({
      where: { companyId },
    });

    let openingDebit = 0;
    let openingCredit = 0;
    let periodDebit = 0;
    let periodCredit = 0;

    for (const account of currentAccounts) {
      let opening = account.openingBalance || 0;

      // Receipt vouchers before start
      const receiptsBefore = await this.prisma.receiptVoucher.aggregate({
        where: {
          companyId,
          currentAccountId: account.id,
          date: { lte: dayBeforeStart },
        },
        _sum: { amount: true },
      });
      opening -= receiptsBefore._sum.amount || 0;

      // Payment vouchers before start
      const paymentsBefore = await this.prisma.paymentVoucher.aggregate({
        where: {
          companyId,
          currentAccountId: account.id,
          date: { lte: dayBeforeStart },
        },
        _sum: { amount: true },
      });
      opening += paymentsBefore._sum.amount || 0;

      if (opening > 0) {
        openingCredit += opening;
      } else {
        openingDebit += Math.abs(opening);
      }

      // Period movements
      const receiptsPeriod = await this.prisma.receiptVoucher.aggregate({
        where: {
          companyId,
          currentAccountId: account.id,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      });
      periodDebit += receiptsPeriod._sum.amount || 0;

      const paymentsPeriod = await this.prisma.paymentVoucher.aggregate({
        where: {
          companyId,
          currentAccountId: account.id,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      });
      periodCredit += paymentsPeriod._sum.amount || 0;
    }

    const closingCredit = openingCredit + periodCredit - periodDebit;
    const closingDebit = closingCredit < 0 ? Math.abs(closingCredit) : 0;
    const finalClosingCredit = closingCredit > 0 ? closingCredit : 0;

    return {
      id: '3201',
      accountCode: '3201',
      accountName: 'جاري الشركاء',
      category: 'Equity',
      openingBalanceDebit: openingDebit,
      openingBalanceCredit: openingCredit,
      periodDebit,
      periodCredit,
      closingBalanceDebit: closingDebit,
      closingBalanceCredit: finalClosingCredit,
    };
  }

  private async calculateRetainedEarnings(
    companyId: string,
    dayBeforeStart: Date,
    startDate: Date,
    endDate: Date,
  ): Promise<TrialBalanceEntry> {
    // Retained earnings = net profit from income statement
    // Opening = net profit before start date
    const openingNetProfit = await this.incomeStatementService.getIncomeStatement(
      companyId,
      '2000-01-01',
      dayBeforeStart.toISOString().split('T')[0],
    );
    const opening = openingNetProfit.netProfit || 0;

    // Period = net profit in period
    const periodNetProfit = await this.incomeStatementService.getIncomeStatement(
      companyId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
    );
    const period = periodNetProfit.netProfit || 0;

    const openingCredit = opening > 0 ? opening : 0;
    const openingDebit = opening < 0 ? Math.abs(opening) : 0;

    const periodCredit = period > 0 ? period : 0;
    const periodDebit = period < 0 ? Math.abs(period) : 0;

    const closingCredit = openingCredit + periodCredit - periodDebit;
    const closingDebit = closingCredit < 0 ? Math.abs(closingCredit) : 0;
    const finalClosingCredit = closingCredit > 0 ? closingCredit : 0;

    return {
      id: '3301',
      accountCode: '3301',
      accountName: 'الارباح و الخسائر المبقاه',
      category: 'Equity',
      openingBalanceDebit: openingDebit,
      openingBalanceCredit: openingCredit,
      periodDebit,
      periodCredit,
      closingBalanceDebit: closingDebit,
      closingBalanceCredit: finalClosingCredit,
    };
  }

  private async calculateSales(
    companyId: string,
    dayBeforeStart: Date,
    startDate: Date,
    endDate: Date,
  ): Promise<TrialBalanceEntry> {
    // Opening = 0 (revenue accounts reset each period)
    // Period = sales in period
    const salesPeriod = await this.prisma.salesInvoice.aggregate({
      where: {
        companyId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { subtotal: true },
    });

    const periodCredit = salesPeriod._sum.subtotal || 0;

    return {
      id: '4101',
      accountCode: '4101',
      accountName: 'المبيعات',
      category: 'Revenue',
      openingBalanceDebit: 0,
      openingBalanceCredit: 0,
      periodDebit: 0,
      periodCredit,
      closingBalanceDebit: 0,
      closingBalanceCredit: periodCredit,
    };
  }

  private async calculateSalesReturns(
    companyId: string,
    dayBeforeStart: Date,
    startDate: Date,
    endDate: Date,
  ): Promise<TrialBalanceEntry> {
    // Sales returns are negative revenue (debit)
    const salesReturnsPeriod = await this.prisma.salesReturn.aggregate({
      where: {
        companyId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { subtotal: true },
    });

    const periodDebit = salesReturnsPeriod._sum.subtotal || 0;

    return {
      id: '4102',
      accountCode: '4102',
      accountName: 'مرتجع المبيعات',
      category: 'Revenue',
      openingBalanceDebit: 0,
      openingBalanceCredit: 0,
      periodDebit,
      periodCredit: 0,
      closingBalanceDebit: periodDebit,
      closingBalanceCredit: 0,
    };
  }

  private async calculateOtherRevenues(
    companyId: string,
    dayBeforeStart: Date,
    startDate: Date,
    endDate: Date,
  ): Promise<TrialBalanceEntry> {
    // Revenue codes are used in ReceiptVouchers (incoming money)
    const receiptVouchers = await this.prisma.receiptVoucher.findMany({
      where: {
        companyId,
        revenueCodeId: { not: null },
        date: { gte: startDate, lte: endDate },
      },
      select: {
        amount: true,
      },
    });

    const periodCredit = receiptVouchers.reduce(
      (sum, v) => sum + (v.amount || 0),
      0,
    );

    return {
      id: '4201',
      accountCode: '4201',
      accountName: 'ايرادات اخري',
      category: 'Revenue',
      openingBalanceDebit: 0,
      openingBalanceCredit: 0,
      periodDebit: 0,
      periodCredit,
      closingBalanceDebit: 0,
      closingBalanceCredit: periodCredit,
    };
  }

  private async calculatePurchases(
    companyId: string,
    dayBeforeStart: Date,
    startDate: Date,
    endDate: Date,
  ): Promise<TrialBalanceEntry> {
    // Purchases are expenses (debit)
    const purchasesPeriod = await this.prisma.purchaseInvoice.aggregate({
      where: {
        companyId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { subtotal: true },
    });

    const periodDebit = purchasesPeriod._sum.subtotal || 0;

    return {
      id: '5101',
      accountCode: '5101',
      accountName: 'المشتريات',
      category: 'Expenses',
      openingBalanceDebit: 0,
      openingBalanceCredit: 0,
      periodDebit,
      periodCredit: 0,
      closingBalanceDebit: periodDebit,
      closingBalanceCredit: 0,
    };
  }

  private async calculatePurchaseReturns(
    companyId: string,
    dayBeforeStart: Date,
    startDate: Date,
    endDate: Date,
  ): Promise<TrialBalanceEntry> {
    // Purchase returns are negative expenses (credit)
    const purchaseReturnsPeriod = await this.prisma.purchaseReturn.aggregate({
      where: {
        companyId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { subtotal: true },
    });

    const periodCredit = purchaseReturnsPeriod._sum.subtotal || 0;

    return {
      id: '5102',
      accountCode: '5102',
      accountName: 'مرتجع المشتريات',
      category: 'Expenses',
      openingBalanceDebit: 0,
      openingBalanceCredit: 0,
      periodDebit: 0,
      periodCredit,
      closingBalanceDebit: 0,
      closingBalanceCredit: periodCredit,
    };
  }

  private async calculateExpensesByType(
    companyId: string,
    dayBeforeStart: Date,
    startDate: Date,
    endDate: Date,
  ): Promise<TrialBalanceEntry[]> {
    const expenseTypes = await this.prisma.expenseType.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });

    const entries: TrialBalanceEntry[] = [];
    let codeCounter = 5201;

    for (const expenseType of expenseTypes) {
      // Get all expense codes for this expense type
      const expenseCodes = await this.prisma.expenseCode.findMany({
        where: {
          companyId,
          expenseTypeId: expenseType.id,
        },
        select: { id: true },
      });

      const expenseCodeIds = expenseCodes.map((ec) => ec.id);

      // Expenses are tracked through PaymentVouchers with expenseCodeId
      const paymentVouchers = await this.prisma.paymentVoucher.findMany({
        where: {
          companyId,
          expenseCodeId: { in: expenseCodeIds },
          date: { gte: startDate, lte: endDate },
        },
        select: { amount: true },
      });

      const periodDebit = paymentVouchers.reduce(
        (sum, v) => sum + (v.amount || 0),
        0,
      );

      entries.push({
        id: `expense-${expenseType.id}`,
        accountCode: String(codeCounter++),
        accountName: expenseType.name,
        category: 'Expenses',
        openingBalanceDebit: 0,
        openingBalanceCredit: 0,
        periodDebit,
        periodCredit: 0,
        closingBalanceDebit: periodDebit,
        closingBalanceCredit: 0,
      });
    }

    return entries;
  }

  private async calculateInventoryValue(companyId: string, targetDate: string): Promise<number> {
    const targetDateTime = new Date(targetDate);
    targetDateTime.setHours(23, 59, 59, 999);

    // Get all items (only STOCKED items)
    const items = await this.prisma.item.findMany({
      where: {
        companyId,
        type: 'STOCKED',
      },
    });

    let totalValue = 0;

    for (const item of items) {
      // Calculate inventory balance at target date across all stores
      const balance = await this.calculateItemBalanceAtDate(
        companyId,
        item.id,
        item.code,
        targetDateTime,
      );

      if (balance > 0) {
        // Find the last purchase price before or on the target date
        const lastPurchasePrice = await this.getLastPurchasePriceBeforeDate(
          companyId,
          item.code,
          targetDateTime,
        );

        // Use last purchase price if found, otherwise fall back to item's current purchase price
        const price = lastPurchasePrice || item.purchasePrice || 0;

        totalValue += balance * price;
      }
    }

    return totalValue;
  }

  private async calculateItemBalanceAtDate(
    companyId: string,
    itemId: string,
    itemCode: string,
    targetDate: Date,
  ): Promise<number> {
    // Start with opening balances from all StoreItems
    const storeItems = await this.prisma.storeItem.findMany({
      where: {
        itemId,
      },
    });

    let balance = storeItems.reduce(
      (sum, si) => sum + (si.openingBalance || 0),
      0,
    );

    // Add quantities from PurchaseInvoices (before or on target date)
    const purchaseInvoices = await this.prisma.purchaseInvoice.findMany({
      where: {
        companyId,
        date: {
          lte: targetDate,
        },
      },
      select: {
        items: true,
      },
    });

    for (const inv of purchaseInvoices) {
      const items = inv.items as any[];
      for (const invItem of items) {
        if (invItem.id === itemCode) {
          balance += invItem.qty || 0;
        }
      }
    }

    // Add quantities from SalesReturns (before or on target date)
    const salesReturns = await this.prisma.salesReturn.findMany({
      where: {
        companyId,
        date: {
          lte: targetDate,
        },
      },
      select: {
        items: true,
      },
    });

    for (const ret of salesReturns) {
      const items = ret.items as any[];
      for (const retItem of items) {
        if (retItem.id === itemCode) {
          balance += retItem.qty || 0;
        }
      }
    }

    // Subtract quantities from SalesInvoices (before or on target date)
    const salesInvoices = await this.prisma.salesInvoice.findMany({
      where: {
        companyId,
        date: {
          lte: targetDate,
        },
      },
      select: {
        items: true,
      },
    });

    for (const inv of salesInvoices) {
      const items = inv.items as any[];
      for (const invItem of items) {
        if (invItem.id === itemCode) {
          balance -= invItem.qty || 0;
        }
      }
    }

    // Subtract quantities from PurchaseReturns (before or on target date)
    const purchaseReturns = await this.prisma.purchaseReturn.findMany({
      where: {
        companyId,
        date: {
          lte: targetDate,
        },
      },
      select: {
        items: true,
      },
    });

    for (const ret of purchaseReturns) {
      const items = ret.items as any[];
      for (const retItem of items) {
        if (retItem.id === itemCode) {
          balance -= retItem.qty || 0;
        }
      }
    }

    // Add store receipt vouchers
    const storeReceipts = await this.prisma.storeReceiptVoucher.findMany({
      where: {
        companyId,
        date: {
          lte: targetDate,
        },
      },
      include: {
        items: {
          where: { itemId },
        },
      },
    });

    balance += storeReceipts.reduce(
      (sum, v) =>
        sum + v.items.reduce((itemSum, i) => itemSum + (i.quantity || 0), 0),
      0,
    );

    // Subtract store issue vouchers
    const storeIssues = await this.prisma.storeIssueVoucher.findMany({
      where: {
        companyId,
        date: {
          lte: targetDate,
        },
      },
      include: {
        items: {
          where: { itemId },
        },
      },
    });

    balance -= storeIssues.reduce(
      (sum, v) =>
        sum + v.items.reduce((itemSum, i) => itemSum + (i.quantity || 0), 0),
      0,
    );

    // Add incoming transfers
    const incomingTransfers = await this.prisma.storeTransferVoucher.findMany({
      where: {
        companyId,
        date: {
          lte: targetDate,
        },
      },
      include: {
        items: {
          where: { itemId },
        },
      },
    });

    balance += incomingTransfers.reduce(
      (sum, v) =>
        sum + v.items.reduce((itemSum, i) => itemSum + (i.quantity || 0), 0),
      0,
    );

    // Subtract outgoing transfers
    const outgoingTransfers = await this.prisma.storeTransferVoucher.findMany({
      where: {
        companyId,
        date: {
          lte: targetDate,
        },
      },
      include: {
        items: {
          where: { itemId },
        },
      },
    });

    balance -= outgoingTransfers.reduce(
      (sum, v) =>
        sum + v.items.reduce((itemSum, i) => itemSum + (i.quantity || 0), 0),
      0,
    );

    return balance;
  }

  private async getLastPurchasePriceBeforeDate(
    companyId: string,
    itemCode: string,
    targetDate: Date,
  ): Promise<number | null> {
    const purchaseInvoice = await this.prisma.purchaseInvoice.findFirst({
      where: {
        companyId,
        date: {
          lte: targetDate,
        },
      },
      select: {
        items: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    if (!purchaseInvoice) {
      return null;
    }

    const items = purchaseInvoice.items as any[];
    for (const item of items) {
      if (item.id === itemCode) {
        return item.unitPrice || null;
      }
    }

    return null;
  }
}

