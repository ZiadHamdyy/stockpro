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
  | 'purchase-return';

export class AccountingService {
  static async applyImpact(options: {
    kind: Kind;
    amount: number;
    paymentTargetType: PaymentTargetType;
    branchId?: string | null;
    bankId?: string | null;
    tx: TxClient;
  }): Promise<void> {
    const { kind, amount, paymentTargetType, branchId, bankId, tx } = options;
    if (amount === 0) return;

    const sign = AccountingService.signFor(kind);
    const delta = amount * sign;

    if (paymentTargetType === 'safe') {
      if (!branchId) throw new Error('Branch is required for safe payments');
      const safe = await (tx as any).safe.findUnique({ where: { branchId } });
      if (!safe) throw new Error('No safe found for branch');
      await (tx as any).safe.update({
        where: { id: safe.id },
        data: { currentBalance: { increment: delta } },
      });
    } else if (paymentTargetType === 'bank') {
      if (!bankId) throw new Error('Bank is required for bank payments');
      await (tx as any).bank.update({
        where: { id: bankId },
        data: { currentBalance: { increment: delta } },
      });
    }
  }

  static async reverseImpact(options: {
    kind: Kind;
    amount: number;
    paymentTargetType: PaymentTargetType;
    branchId?: string | null;
    bankId?: string | null;
    tx: TxClient;
  }): Promise<void> {
    const inverseKind = AccountingService.inverse(options.kind);
    return AccountingService.applyImpact({ ...options, kind: inverseKind });
  }

  private static signFor(kind: Kind): number {
    switch (kind) {
      case 'sales-invoice':
        return 1; // increase
      case 'sales-return':
        return -1; // decrease
      case 'purchase-invoice':
        return -1; // decrease
      case 'purchase-return':
        return 1; // increase
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
      default:
        return kind;
    }
  }
}
