import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { BalanceSheetResponse } from './dtos/response/balance-sheet.response';
import { IncomeStatementService } from '../income-statement/income-statement.service';

@Injectable()
export class BalanceSheetService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly incomeStatementService: IncomeStatementService,
  ) {}

  async getBalanceSheet(
    startDate: string,
    endDate: string,
  ): Promise<BalanceSheetResponse> {
    const targetDate = new Date(endDate);
    targetDate.setHours(23, 59, 59, 999);

    const cashInSafes = await this.calculateCashInSafes(targetDate);
    const cashInBanks = await this.calculateCashInBanks(targetDate);
    const receivables = await this.calculateReceivables(targetDate);
    const otherReceivables = await this.calculateOtherReceivables(targetDate);
    const inventory = await this.calculateInventoryValue(endDate);
    const totalAssets =
      cashInSafes + cashInBanks + receivables + otherReceivables + inventory;

    const payables = await this.calculatePayables(targetDate);
    const otherPayables = await this.calculateOtherPayables(targetDate);
    const vatPayable = await this.calculateVatPayable(targetDate);
    const totalLiabilities = payables + otherPayables + vatPayable;

    const capital = await this.getCapital();
    const partnersBalance = await this.calculatePartnersBalance(targetDate);
    const retainedEarnings = await this.calculateNetProfit(startDate, endDate);
    const totalEquity = capital + partnersBalance + retainedEarnings;

    // Get company currency
    const company = await this.prisma.company.findFirst();
    const currency = company?.currency || 'SAR';

    return {
      cashInSafes,
      cashInBanks,
      receivables,
      otherReceivables,
      inventory,
      totalAssets,
      payables,
      otherPayables,
      vatPayable,
      totalLiabilities,
      capital,
      partnersBalance,
      retainedEarnings,
      totalEquity,
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      currency,
    };
  }

  private async calculateCashInSafes(endDate: Date): Promise<number> {
    // Get all safes across all branches
    const safes = await this.prisma.safe.findMany();

    let totalBalance = 0;

    for (const safe of safes) {
      let balance = safe.openingBalance || 0;

      // Add ReceiptVouchers (incoming)
      const receiptVouchers = await this.prisma.receiptVoucher.aggregate({
        where: {
          paymentMethod: 'safe',
          safeId: safe.id,
          date: {
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      });
      balance += receiptVouchers._sum.amount || 0;

      // Subtract PaymentVouchers (outgoing)
      const paymentVouchers = await this.prisma.paymentVoucher.aggregate({
        where: {
          paymentMethod: 'safe',
          safeId: safe.id,
          date: {
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      });
      balance -= paymentVouchers._sum.amount || 0;

      // Subtract InternalTransfers from safe (outgoing)
      const transfersFrom = await this.prisma.internalTransfer.aggregate({
        where: {
          fromType: 'safe',
          fromSafeId: safe.id,
          date: {
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      });
      balance -= transfersFrom._sum.amount || 0;

      // Add InternalTransfers to safe (incoming)
      const transfersTo = await this.prisma.internalTransfer.aggregate({
        where: {
          toType: 'safe',
          toSafeId: safe.id,
          date: {
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      });
      balance += transfersTo._sum.amount || 0;

      // Add SalesInvoices (cash payments to safe)
      // Regular payments (non-split)
      const salesInvoices = await this.prisma.salesInvoice.aggregate({
        where: {
          paymentMethod: 'cash',
          paymentTargetType: 'safe',
          safeId: safe.id,
          isSplitPayment: false,
          date: {
            lte: endDate,
          },
        },
        _sum: {
          net: true,
        },
      });
      balance += salesInvoices._sum.net || 0;

      // Split payment sales invoices (cash portion to this safe)
      const splitSalesInvoices = await this.prisma.salesInvoice.findMany({
        where: {
          paymentMethod: 'cash',
          isSplitPayment: true,
          splitSafeId: safe.id,
          date: {
            lte: endDate,
          },
        },
        select: {
          splitCashAmount: true,
        },
      });
      const splitCashTotal = splitSalesInvoices.reduce(
        (sum, inv) => sum + (inv.splitCashAmount || 0),
        0,
      );
      balance += splitCashTotal;

      // Subtract SalesReturns (cash refunds from safe)
      const salesReturns = await this.prisma.salesReturn.aggregate({
        where: {
          paymentMethod: 'cash',
          paymentTargetType: 'safe',
          safeId: safe.id,
          date: {
            lte: endDate,
          },
        },
        _sum: {
          net: true,
        },
      });
      balance -= salesReturns._sum.net || 0;

      // Subtract PurchaseInvoices (cash payments from safe)
      const purchaseInvoices = await this.prisma.purchaseInvoice.aggregate({
        where: {
          paymentMethod: 'cash',
          paymentTargetType: 'safe',
          safeId: safe.id,
          date: {
            lte: endDate,
          },
        },
        _sum: {
          net: true,
        },
      });
      balance -= purchaseInvoices._sum.net || 0;

      // Add PurchaseReturns (cash refunds to safe)
      const purchaseReturns = await this.prisma.purchaseReturn.aggregate({
        where: {
          paymentMethod: 'cash',
          paymentTargetType: 'safe',
          safeId: safe.id,
          date: {
            lte: endDate,
          },
        },
        _sum: {
          net: true,
        },
      });
      balance += purchaseReturns._sum.net || 0;

      totalBalance += balance;
    }

    return totalBalance;
  }

  private async calculateCashInBanks(endDate: Date): Promise<number> {
    // Get all banks
    const banks = await this.prisma.bank.findMany();

    let totalBalance = 0;

    for (const bank of banks) {
      let balance = bank.openingBalance || 0;

      // Add ReceiptVouchers (incoming)
      const receiptVouchers = await this.prisma.receiptVoucher.aggregate({
        where: {
          paymentMethod: 'bank',
          bankId: bank.id,
          date: {
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      });
      balance += receiptVouchers._sum.amount || 0;

      // Subtract PaymentVouchers (outgoing)
      const paymentVouchers = await this.prisma.paymentVoucher.aggregate({
        where: {
          paymentMethod: 'bank',
          bankId: bank.id,
          date: {
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      });
      balance -= paymentVouchers._sum.amount || 0;

      // Subtract InternalTransfers from bank (outgoing)
      const transfersFrom = await this.prisma.internalTransfer.aggregate({
        where: {
          fromType: 'bank',
          fromBankId: bank.id,
          date: {
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      });
      balance -= transfersFrom._sum.amount || 0;

      // Add InternalTransfers to bank (incoming)
      const transfersTo = await this.prisma.internalTransfer.aggregate({
        where: {
          toType: 'bank',
          toBankId: bank.id,
          date: {
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      });
      balance += transfersTo._sum.amount || 0;

      // Add SalesInvoices (cash payments to bank)
      // Regular payments (non-split)
      const salesInvoices = await this.prisma.salesInvoice.aggregate({
        where: {
          paymentMethod: 'cash',
          paymentTargetType: 'bank',
          bankId: bank.id,
          isSplitPayment: false,
          date: {
            lte: endDate,
          },
        },
        _sum: {
          net: true,
        },
      });
      balance += salesInvoices._sum.net || 0;

      // Split payment sales invoices (bank portion to this bank)
      const splitSalesInvoices = await this.prisma.salesInvoice.findMany({
        where: {
          paymentMethod: 'cash',
          isSplitPayment: true,
          splitBankId: bank.id,
          date: {
            lte: endDate,
          },
        },
        select: {
          splitBankAmount: true,
        },
      });
      const splitBankTotal = splitSalesInvoices.reduce(
        (sum, inv) => sum + (inv.splitBankAmount || 0),
        0,
      );
      balance += splitBankTotal;

      // Subtract SalesReturns (cash refunds from bank)
      const salesReturns = await this.prisma.salesReturn.aggregate({
        where: {
          paymentMethod: 'cash',
          paymentTargetType: 'bank',
          bankId: bank.id,
          date: {
            lte: endDate,
          },
        },
        _sum: {
          net: true,
        },
      });
      balance -= salesReturns._sum.net || 0;

      // Subtract PurchaseInvoices (cash payments from bank)
      const purchaseInvoices = await this.prisma.purchaseInvoice.aggregate({
        where: {
          paymentMethod: 'cash',
          paymentTargetType: 'bank',
          bankId: bank.id,
          date: {
            lte: endDate,
          },
        },
        _sum: {
          net: true,
        },
      });
      balance -= purchaseInvoices._sum.net || 0;

      // Add PurchaseReturns (cash refunds to bank)
      const purchaseReturns = await this.prisma.purchaseReturn.aggregate({
        where: {
          paymentMethod: 'cash',
          paymentTargetType: 'bank',
          bankId: bank.id,
          date: {
            lte: endDate,
          },
        },
        _sum: {
          net: true,
        },
      });
      balance += purchaseReturns._sum.net || 0;

      totalBalance += balance;
    }

    return totalBalance;
  }

  private async calculateReceivables(endDate: Date): Promise<number> {
    // Get all customers
    const customers = await this.prisma.customer.findMany();

    let totalBalance = 0;

    for (const customer of customers) {
      let balance = customer.openingBalance || 0;

      // Add SalesInvoices (credit sales - increases what customer owes)
      const salesInvoices = await this.prisma.salesInvoice.aggregate({
        where: {
          customerId: customer.id,
          paymentMethod: 'credit',
          date: {
            lte: endDate,
          },
        },
        _sum: {
          net: true,
        },
      });
      balance += salesInvoices._sum.net || 0;

      // Subtract SalesReturns (credit returns - decreases what customer owes)
      const salesReturns = await this.prisma.salesReturn.aggregate({
        where: {
          customerId: customer.id,
          paymentMethod: 'credit',
          date: {
            lte: endDate,
          },
        },
        _sum: {
          net: true,
        },
      });
      balance -= salesReturns._sum.net || 0;

      // Add PaymentVouchers (refunds to customer - increases what customer owes)
      const paymentVouchers = await this.prisma.paymentVoucher.aggregate({
        where: {
          entityType: 'customer',
          customerId: customer.id,
          date: {
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      });
      balance += paymentVouchers._sum.amount || 0;

      // Subtract ReceiptVouchers (payments from customer - decreases what customer owes)
      const receiptVouchers = await this.prisma.receiptVoucher.aggregate({
        where: {
          entityType: 'customer',
          customerId: customer.id,
          date: {
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      });
      balance -= receiptVouchers._sum.amount || 0;

      totalBalance += balance;
    }

    return totalBalance;
  }

  private async calculateOtherReceivables(endDate: Date): Promise<number> {
    // Get all receivable accounts
    const receivableAccounts = await this.prisma.receivableAccount.findMany();

    let totalBalance = 0;

    for (const account of receivableAccounts) {
      let balance = account.openingBalance || 0;

      // Add PaymentVouchers (debit - increases balance)
      const paymentVouchers = await this.prisma.paymentVoucher.aggregate({
        where: {
          entityType: 'receivable_account',
          receivableAccountId: account.id,
          date: {
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      });
      balance += paymentVouchers._sum.amount || 0;

      // Subtract ReceiptVouchers (credit - decreases balance)
      const receiptVouchers = await this.prisma.receiptVoucher.aggregate({
        where: {
          entityType: 'receivable_account',
          receivableAccountId: account.id,
          date: {
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      });
      balance -= receiptVouchers._sum.amount || 0;

      totalBalance += balance;
    }

    return totalBalance;
  }

  private async calculateInventoryValue(targetDate: string): Promise<number> {
    const targetDateTime = new Date(targetDate);
    targetDateTime.setHours(23, 59, 59, 999);

    // Get all items (only STOCKED items)
    const items = await this.prisma.item.findMany({
      where: {
        type: 'STOCKED',
      },
    });

    let totalValue = 0;

    for (const item of items) {
      // Calculate inventory balance at target date across all stores
      const balance = await this.calculateItemBalanceAtDate(
        item.id,
        item.code,
        targetDateTime,
      );

      if (balance > 0) {
        // Find the last purchase price before or on the target date
        const lastPurchasePrice = await this.getLastPurchasePriceBeforeDate(
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

  /**
   * Calculate the total inventory balance for an item at a specific date
   * across all stores
   */
  private async calculateItemBalanceAtDate(
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

    // Add quantities from StoreReceiptVouchers (before or on target date)
    const storeReceiptVouchers = await this.prisma.storeReceiptVoucher.findMany(
      {
        where: {
          date: {
            lte: targetDate,
          },
        },
        include: {
          items: {
            where: {
              itemId,
            },
          },
        },
      },
    );

    for (const voucher of storeReceiptVouchers) {
      for (const voucherItem of voucher.items) {
        balance += voucherItem.quantity || 0;
      }
    }

    // Subtract quantities from SalesInvoices (before or on target date)
    const salesInvoices = await this.prisma.salesInvoice.findMany({
      where: {
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

    // Subtract quantities from StoreIssueVouchers (before or on target date)
    const storeIssueVouchers = await this.prisma.storeIssueVoucher.findMany({
      where: {
        date: {
          lte: targetDate,
        },
      },
      include: {
        items: {
          where: {
            itemId,
          },
        },
      },
    });

    for (const voucher of storeIssueVouchers) {
      for (const voucherItem of voucher.items) {
        balance -= voucherItem.quantity || 0;
      }
    }

    // Note: Store transfers don't affect total inventory balance
    // (they just move items between stores)

    return Math.max(0, balance); // Ensure non-negative balance
  }

  /**
   * Get the last purchase price for an item before or on a specific date
   * Searches purchase invoices in descending date order to find the most recent purchase
   * @param itemCode - The item code to find the purchase price for
   * @param targetDate - The date to search up to (inclusive)
   * @returns The last purchase price before or on the target date, or null if not found
   */
  private async getLastPurchasePriceBeforeDate(
    itemCode: string,
    targetDate: Date,
  ): Promise<number | null> {
    // Get all purchase invoices before or on target date, ordered by date descending
    const purchaseInvoices = await this.prisma.purchaseInvoice.findMany({
      where: {
        date: {
          lte: targetDate,
        },
      },
      select: {
        date: true,
        items: true,
      },
      orderBy: {
        date: 'desc', // Most recent first
      },
    });

    // Find the most recent purchase price for this item
    for (const inv of purchaseInvoices) {
      const items = inv.items as any[];
      for (const invItem of items) {
        if (invItem.id === itemCode && invItem.price) {
          return invItem.price;
        }
      }
    }

    return null; // No purchase found before this date
  }

  private async calculatePayables(endDate: Date): Promise<number> {
    // Get all suppliers
    const suppliers = await this.prisma.supplier.findMany();

    let totalBalance = 0;

    for (const supplier of suppliers) {
      const opening = supplier.openingBalance || 0;

      // Get all PurchaseInvoices (increases what we owe - credit)
      const purchaseInvoices = await this.prisma.purchaseInvoice.aggregate({
        where: {
          supplierId: supplier.id,
          date: {
            lte: endDate,
          },
        },
        _sum: {
          net: true,
        },
      });
      const totalCredit = purchaseInvoices._sum.net || 0;

      // Get all PurchaseReturns (decreases what we owe - debit)
      const purchaseReturns = await this.prisma.purchaseReturn.aggregate({
        where: {
          supplierId: supplier.id,
          date: {
            lte: endDate,
          },
        },
        _sum: {
          net: true,
        },
      });
      const totalReturns = purchaseReturns._sum.net || 0;

      // Get PaymentVouchers (payments to supplier - decreases what we owe - debit)
      const paymentVouchers = await this.prisma.paymentVoucher.aggregate({
        where: {
          entityType: 'supplier',
          supplierId: supplier.id,
          date: {
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      });
      const totalPayments = paymentVouchers._sum.amount || 0;

      // Get ReceiptVouchers (receipts from supplier - decreases what we owe - debit)
      const receiptVouchers = await this.prisma.receiptVoucher.aggregate({
        where: {
          entityType: 'supplier',
          supplierId: supplier.id,
          date: {
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      });
      const totalReceipts = receiptVouchers._sum.amount || 0;

      // Calculate balance using the same formula as SupplierBalanceReport
      // Total Debit: purchase returns, payment vouchers, receipt vouchers (all decrease what we owe)
      const totalDebit = totalReturns + totalPayments + totalReceipts;
      // Total Credit: purchase invoices (increases what we owe)
      // Balance = Beginning Balance + Total Debit - Total Credit
      const balance = opening + totalDebit - totalCredit;

      totalBalance += balance;
    }

    return totalBalance;
  }

  private async calculateOtherPayables(endDate: Date): Promise<number> {
    // Get all payable accounts
    const payableAccounts = await this.prisma.payableAccount.findMany();

    let totalBalance = 0;

    for (const account of payableAccounts) {
      let balance = account.openingBalance || 0;

      // Add PaymentVouchers (debit - increases what we owe)
      const paymentVouchers = await this.prisma.paymentVoucher.aggregate({
        where: {
          entityType: 'payable_account',
          payableAccountId: account.id,
          date: {
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      });
      balance += paymentVouchers._sum.amount || 0;

      // Subtract ReceiptVouchers (credit - decreases what we owe)
      const receiptVouchers = await this.prisma.receiptVoucher.aggregate({
        where: {
          entityType: 'payable_account',
          payableAccountId: account.id,
          date: {
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      });
      balance -= receiptVouchers._sum.amount || 0;

      totalBalance += balance;
    }

    return totalBalance;
  }

  private async calculateVatPayable(endDate: Date): Promise<number> {
    // Get company VAT settings
    const company = await this.prisma.company.findFirst();
    const isVatEnabled = company?.isVatEnabled || false;
    const vatRate = company?.vatRate || 0;

    if (!isVatEnabled || vatRate <= 0) {
      return 0;
    }

    // Calculate Output VAT (VAT collected on sales)
    // Sum tax from SalesInvoices (before or on endDate)
    const salesInvoicesTax = await this.prisma.salesInvoice.aggregate({
      where: {
        date: {
          lte: endDate,
        },
      },
      _sum: {
        tax: true,
      },
    });
    const outputVat = salesInvoicesTax._sum.tax || 0;

    // Subtract tax from SalesReturns (before or on endDate)
    const salesReturnsTax = await this.prisma.salesReturn.aggregate({
      where: {
        date: {
          lte: endDate,
        },
      },
      _sum: {
        tax: true,
      },
    });
    const netOutputVat = outputVat - (salesReturnsTax._sum.tax || 0);

    // Calculate Input VAT (VAT paid on purchases)
    // Sum tax from PurchaseInvoices (before or on endDate)
    const purchaseInvoicesTax = await this.prisma.purchaseInvoice.aggregate({
      where: {
        date: {
          lte: endDate,
        },
      },
      _sum: {
        tax: true,
      },
    });

    // Sum taxable expenses (payment vouchers with expense codes, before or on endDate)
    // These are considered as input VAT
    const taxableExpenses = await this.prisma.paymentVoucher.aggregate({
      where: {
        entityType: {
          in: ['expense', 'expense-Type'],
        },
        expenseCodeId: {
          not: null,
        },
        date: {
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const inputVatFromPurchases = purchaseInvoicesTax._sum.tax || 0;
    const inputVatFromExpenses = taxableExpenses._sum.amount || 0;
    const totalInputVat = inputVatFromPurchases + inputVatFromExpenses;

    // Subtract tax from PurchaseReturns (before or on endDate)
    const purchaseReturnsTax = await this.prisma.purchaseReturn.aggregate({
      where: {
        date: {
          lte: endDate,
        },
      },
      _sum: {
        tax: true,
      },
    });
    const netInputVat = totalInputVat - (purchaseReturnsTax._sum.tax || 0);

    // VAT Payable = Output VAT - Input VAT
    // Positive means we owe VAT (liability), negative means we have VAT credit
    const vatPayable = netOutputVat - netInputVat;

    return vatPayable;
  }

  private async calculatePartnersBalance(endDate: Date): Promise<number> {
    // Get all current accounts
    const currentAccounts = await this.prisma.currentAccount.findMany();

    let totalBalance = 0;

    for (const account of currentAccounts) {
      let balance = account.openingBalance || 0;

      // Add PaymentVouchers (debit - increases balance)
      const paymentVouchers = await this.prisma.paymentVoucher.aggregate({
        where: {
          entityType: 'current_account',
          currentAccountId: account.id,
          date: {
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      });
      balance += paymentVouchers._sum.amount || 0;

      // Subtract ReceiptVouchers (credit - decreases balance)
      const receiptVouchers = await this.prisma.receiptVoucher.aggregate({
        where: {
          entityType: 'current_account',
          currentAccountId: account.id,
          date: {
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      });
      balance -= receiptVouchers._sum.amount || 0;

      totalBalance += balance;
    }

    return totalBalance;
  }

  private async calculateNetProfit(
    startDate: string,
    endDate: string,
  ): Promise<number> {
    // Get net profit from income statement for the period
    const incomeStatement =
      await this.incomeStatementService.getIncomeStatement(startDate, endDate);
    return incomeStatement.netProfit || 0;
  }

  private async getCapital(): Promise<number> {
    const company = await this.prisma.company.findFirst();
    return company?.capital || 0;
  }
}
