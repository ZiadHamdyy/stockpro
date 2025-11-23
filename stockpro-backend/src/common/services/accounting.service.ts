import { BadRequestException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

type TxClient =
  | Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >
  | Prisma.TransactionClient;

export type PaymentTargetType = 'safe' | 'bank';
type Kind =
  | 'sales-invoice'
  | 'sales-return'
  | 'purchase-invoice'
  | 'purchase-return'
  | 'receipt-voucher'
  | 'payment-voucher'
  | 'internal-transfer-in'
  | 'internal-transfer-out';

export class AccountingService {
  static async applyImpact(options: {
    kind: Kind;
    amount: number;
    paymentTargetType: PaymentTargetType;
    branchId?: string | null;
    safeId?: string | null;
    bankId?: string | null;
    tx: TxClient;
  }): Promise<void> {
    const { kind, amount, paymentTargetType, branchId, safeId, bankId, tx } =
      options;
    if (amount === 0) {
      return;
    }

    const delta = AccountingService.signFor(kind) * amount;

    if (paymentTargetType === 'safe') {
      const safe = await AccountingService.resolveSafe(tx, safeId, branchId);
      await (tx as any).safe.update({
        where: { id: safe.id },
        data: { currentBalance: { increment: delta } },
      });
    } else if (paymentTargetType === 'bank') {
      const bank = await AccountingService.resolveBank(tx, bankId);
      await (tx as any).bank.update({
        where: { id: bank.id },
        data: { currentBalance: { increment: delta } },
      });
    } else {
      throw new Error(
        `Unsupported payment target type: ${String(paymentTargetType)}`,
      );
    }
  }

  static async reverseImpact(options: {
    kind: Kind;
    amount: number;
    paymentTargetType: PaymentTargetType;
    branchId?: string | null;
    safeId?: string | null;
    bankId?: string | null;
    tx: TxClient;
  }): Promise<void> {
    const inverseKind = AccountingService.inverse(options.kind);
    return AccountingService.applyImpact({ ...options, kind: inverseKind });
  }

  private static async resolveSafe(
    tx: TxClient,
    safeId?: string | null,
    branchId?: string | null,
  ) {
    if (safeId) {
      const safe = await (tx as any).safe.findUnique({ where: { id: safeId } });
      if (!safe) {
        throw new Error('Safe not found for provided id');
      }
      return safe;
    }
    if (branchId) {
      const safe = await (tx as any).safe.findUnique({ where: { branchId } });
      if (!safe) {
        throw new BadRequestException(
          'لا توجد خزنة مرتبطة بهذا الفرع، يرجى مراجعة إعدادات الفروع.',
        );
      }
      return safe;
    }
    throw new Error('Either safeId or branchId must be provided for safe ops');
  }

  private static async resolveBank(tx: TxClient, bankId?: string | null) {
    if (!bankId) {
      throw new Error('Bank is required for bank payments');
    }
    const bank = await (tx as any).bank.findUnique({ where: { id: bankId } });
    if (!bank) {
      throw new Error('Bank not found');
    }
    return bank;
  }

  private static signFor(kind: Kind): number {
    switch (kind) {
      case 'sales-invoice':
      case 'purchase-return':
      case 'receipt-voucher':
      case 'internal-transfer-in':
        return 1;
      case 'sales-return':
      case 'purchase-invoice':
      case 'payment-voucher':
      case 'internal-transfer-out':
        return -1;
      default:
        return 0;
    }
  }

  private static inverse(kind: Kind): Kind {
    switch (kind) {
      case 'sales-invoice':
        return 'sales-return';
      case 'sales-return':
        return 'sales-invoice';
      case 'purchase-invoice':
        return 'purchase-return';
      case 'purchase-return':
        return 'purchase-invoice';
      case 'receipt-voucher':
        return 'payment-voucher';
      case 'payment-voucher':
        return 'receipt-voucher';
      case 'internal-transfer-in':
        return 'internal-transfer-out';
      case 'internal-transfer-out':
        return 'internal-transfer-in';
      default:
        return kind;
    }
  }
}
