import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateInternalTransferRequest } from './dtos/request/create-internal-transfer.request';
import { UpdateInternalTransferRequest } from './dtos/request/update-internal-transfer.request';
import { InternalTransferResponse } from './dtos/response/internal-transfer.response';
import { AccountingService } from '../../common/services/accounting.service';
import { FiscalYearService } from '../fiscal-year/fiscal-year.service';

@Injectable()
export class InternalTransferService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly fiscalYearService: FiscalYearService,
  ) {}

  // ==================== CRUD Operations ====================

  async createInternalTransfer(
    data: CreateInternalTransferRequest,
    userId: string,
  ): Promise<InternalTransferResponse> {
    // Check financial period status
    const transferDate = new Date(data.date);
    
    // Check if there is an open period for this date
    const hasOpenPeriod = await this.fiscalYearService.hasOpenPeriodForDate(transferDate);
    if (!hasOpenPeriod) {
      throw new ForbiddenException('لا يمكن إنشاء تحويل داخلي: لا توجد فترة محاسبية مفتوحة لهذا التاريخ');
    }

    // Check if date is in a closed period
    const isInClosedPeriod = await this.fiscalYearService.isDateInClosedPeriod(transferDate);
    if (isInClosedPeriod) {
      throw new ForbiddenException('لا يمكن إنشاء تحويل داخلي: الفترة المحاسبية مغلقة');
    }

    const code = await this.generateNextCode();

    // Validate that from and to are different
    if (data.fromType === data.toType) {
      if (
        (data.fromType === 'safe' && data.fromSafeId === data.toSafeId) ||
        (data.fromType === 'bank' && data.fromBankId === data.toBankId)
      ) {
        throw new BadRequestException(
          'Cannot transfer from and to the same account',
        );
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Validate sender has sufficient current balance and apply outbound impact
      if (data.fromType === 'safe') {
        if (!data.fromSafeId) throw new NotFoundException('Safe not found');
        const sender = await tx.safe.findUnique({
          where: { id: data.fromSafeId },
        });
        if (!sender) throw new NotFoundException('Safe not found');
        if ((sender as any).currentBalance < data.amount) {
          throw new ConflictException(`الرصيد غير كافي في ${sender.name}`);
        }
        await AccountingService.applyImpact({
          kind: 'internal-transfer-out',
          amount: data.amount,
          paymentTargetType: 'safe',
          branchId: sender.branchId,
          safeId: sender.id,
          tx,
        });
      } else {
        if (!data.fromBankId) throw new NotFoundException('Bank not found');
        const sender = await tx.bank.findUnique({
          where: { id: data.fromBankId },
        });
        if (!sender) throw new NotFoundException('Bank not found');
        if ((sender as any).currentBalance < data.amount) {
          throw new ConflictException(`الرصيد غير كافي في ${sender.name}`);
        }
        await AccountingService.applyImpact({
          kind: 'internal-transfer-out',
          amount: data.amount,
          paymentTargetType: 'bank',
          bankId: sender.id,
          tx,
        });
      }

      // Credit receiver
      if (data.toType === 'safe') {
        if (!data.toSafeId) throw new NotFoundException('Safe not found');
        const receiver = await tx.safe.findUnique({
          where: { id: data.toSafeId },
        });
        if (!receiver) throw new NotFoundException('Safe not found');
        await AccountingService.applyImpact({
          kind: 'internal-transfer-in',
          amount: data.amount,
          paymentTargetType: 'safe',
          branchId: receiver.branchId,
          safeId: receiver.id,
          tx,
        });
      } else {
        if (!data.toBankId) throw new NotFoundException('Bank not found');
        const receiver = await tx.bank.findUnique({
          where: { id: data.toBankId },
        });
        if (!receiver) throw new NotFoundException('Bank not found');
        await AccountingService.applyImpact({
          kind: 'internal-transfer-in',
          amount: data.amount,
          paymentTargetType: 'bank',
          bankId: receiver.id,
          tx,
        });
      }

      // Create transfer
      const transferData: any = {
        code,
        date: new Date(data.date),
        fromType: data.fromType,
        toType: data.toType,
        amount: data.amount,
        description: data.description,
        userId,
        branchId: data.branchId,
        fromSafeId: data.fromType === 'safe' ? data.fromSafeId! : null,
        fromBankId: data.fromType === 'bank' ? data.fromBankId! : null,
        toSafeId: data.toType === 'safe' ? data.toSafeId! : null,
        toBankId: data.toType === 'bank' ? data.toBankId! : null,
      };

      const internalTransfer = await tx.internalTransfer.create({
        data: transferData,
        include: {
          user: true,
          branch: true,
          fromSafe: true,
          fromBank: true,
          toSafe: true,
          toBank: true,
        },
      });
      return internalTransfer;
    });

    return this.mapToResponse(result);
  }

  async findAllInternalTransfers(
    search?: string,
  ): Promise<InternalTransferResponse[]> {
    const where = search
      ? {
          OR: [
            { code: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const transfers = await this.prisma.internalTransfer.findMany({
      where,
      include: {
        user: true,
        branch: true,
        fromSafe: true,
        fromBank: true,
        toSafe: true,
        toBank: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return transfers.map((transfer) => this.mapToResponse(transfer));
  }

  async findOneInternalTransfer(id: string): Promise<InternalTransferResponse> {
    const internalTransfer = await this.prisma.internalTransfer.findUnique({
      where: { id },
      include: {
        user: true,
        branch: true,
        fromSafe: true,
        fromBank: true,
        toSafe: true,
        toBank: true,
      },
    });

    if (!internalTransfer) {
      throw new NotFoundException('Internal transfer not found');
    }

    return this.mapToResponse(internalTransfer);
  }

  async updateInternalTransfer(
    id: string,
    data: UpdateInternalTransferRequest,
  ): Promise<InternalTransferResponse> {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.internalTransfer.findUnique({
          where: { id },
        });
        if (!existing) {
          throw new NotFoundException('Internal transfer not found');
        }

        // Reverse previous effect
        if (existing.fromType === 'safe' && existing.fromSafeId) {
          const safe = await tx.safe.findUnique({
            where: { id: existing.fromSafeId },
          });
          if (!safe) throw new NotFoundException('Safe not found');
          await AccountingService.reverseImpact({
            kind: 'internal-transfer-out',
            amount: existing.amount,
            paymentTargetType: 'safe',
            branchId: safe.branchId,
            safeId: existing.fromSafeId,
            tx,
          });
        } else if (existing.fromType === 'bank' && existing.fromBankId) {
          await AccountingService.reverseImpact({
            kind: 'internal-transfer-out',
            amount: existing.amount,
            paymentTargetType: 'bank',
            bankId: existing.fromBankId,
            tx,
          });
        }
        if (existing.toType === 'safe' && existing.toSafeId) {
          const safe = await tx.safe.findUnique({
            where: { id: existing.toSafeId },
          });
          if (!safe) throw new NotFoundException('Safe not found');
          await AccountingService.reverseImpact({
            kind: 'internal-transfer-in',
            amount: existing.amount,
            paymentTargetType: 'safe',
            branchId: safe.branchId,
            safeId: existing.toSafeId,
            tx,
          });
        } else if (existing.toType === 'bank' && existing.toBankId) {
          await AccountingService.reverseImpact({
            kind: 'internal-transfer-in',
            amount: existing.amount,
            paymentTargetType: 'bank',
            bankId: existing.toBankId,
            tx,
          });
        }

        // Determine new values
        const newFromType = data.fromType || existing.fromType;
        const newToType = data.toType || existing.toType;
        const newAmount =
          data.amount !== undefined ? data.amount : existing.amount;
        const newFromSafeId =
          newFromType === 'safe'
            ? data.fromSafeId || existing.fromSafeId
            : null;
        const newFromBankId =
          newFromType === 'bank'
            ? data.fromBankId || existing.fromBankId
            : null;
        const newToSafeId =
          newToType === 'safe' ? data.toSafeId || existing.toSafeId : null;
        const newToBankId =
          newToType === 'bank' ? data.toBankId || existing.toBankId : null;

        // Validate from != to
        if (
          newFromType === newToType &&
          ((newFromType === 'safe' && newFromSafeId === newToSafeId) ||
            (newFromType === 'bank' && newFromBankId === newToBankId))
        ) {
          throw new BadRequestException(
            'Cannot transfer from and to the same account',
          );
        }

        // Validate sender balance and apply outbound impact
        if (newFromType === 'safe') {
          if (!newFromSafeId) throw new NotFoundException('Safe not found');
          const sender = await tx.safe.findUnique({
            where: { id: newFromSafeId },
          });
          if (!sender) throw new NotFoundException('Safe not found');
          if ((sender as any).currentBalance < newAmount) {
            throw new ConflictException(`الرصيد غير كافي في ${sender.name}`);
          }
          await AccountingService.applyImpact({
            kind: 'internal-transfer-out',
            amount: newAmount,
            paymentTargetType: 'safe',
            branchId: sender.branchId,
            safeId: newFromSafeId,
            tx,
          });
        } else {
          if (!newFromBankId) throw new NotFoundException('Bank not found');
          const sender = await tx.bank.findUnique({
            where: { id: newFromBankId },
          });
          if (!sender) throw new NotFoundException('Bank not found');
          if ((sender as any).currentBalance < newAmount) {
            throw new ConflictException(`الرصيد غير كافي في ${sender.name}`);
          }
          await AccountingService.applyImpact({
            kind: 'internal-transfer-out',
            amount: newAmount,
            paymentTargetType: 'bank',
            bankId: newFromBankId,
            tx,
          });
        }

        // Credit receiver with inbound impact
        if (newToType === 'safe') {
          if (!newToSafeId) throw new NotFoundException('Safe not found');
          const receiver = await tx.safe.findUnique({
            where: { id: newToSafeId },
          });
          if (!receiver) throw new NotFoundException('Safe not found');
          await AccountingService.applyImpact({
            kind: 'internal-transfer-in',
            amount: newAmount,
            paymentTargetType: 'safe',
            branchId: receiver.branchId,
            safeId: newToSafeId,
            tx,
          });
        } else {
          if (!newToBankId) throw new NotFoundException('Bank not found');
          const receiver = await tx.bank.findUnique({
            where: { id: newToBankId },
          });
          if (!receiver) throw new NotFoundException('Bank not found');
          await AccountingService.applyImpact({
            kind: 'internal-transfer-in',
            amount: newAmount,
            paymentTargetType: 'bank',
            bankId: newToBankId,
            tx,
          });
        }

        const updateData: any = {
          ...data,
          date: data.date ? new Date(data.date) : undefined,
          fromType: newFromType,
          toType: newToType,
          fromSafeId: newFromSafeId,
          fromBankId: newFromBankId,
          toSafeId: newToSafeId,
          toBankId: newToBankId,
          amount: newAmount,
        };

        const updated = await tx.internalTransfer.update({
          where: { id },
          data: updateData,
          include: {
            user: true,
            branch: true,
            fromSafe: true,
            fromBank: true,
            toSafe: true,
            toBank: true,
          },
        });

        return updated;
      });

      return this.mapToResponse(result);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new NotFoundException('Internal transfer not found');
    }
  }

  async removeInternalTransfer(id: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const existing = await tx.internalTransfer.findUnique({
          where: { id },
        });
        if (!existing)
          throw new NotFoundException('Internal transfer not found');

        // Reverse effect
        if (existing.fromType === 'safe' && existing.fromSafeId) {
          const safe = await tx.safe.findUnique({
            where: { id: existing.fromSafeId },
          });
          if (!safe) throw new NotFoundException('Safe not found');
          await AccountingService.reverseImpact({
            kind: 'internal-transfer-out',
            amount: existing.amount,
            paymentTargetType: 'safe',
            branchId: safe.branchId,
            safeId: existing.fromSafeId,
            tx,
          });
        } else if (existing.fromType === 'bank' && existing.fromBankId) {
          await AccountingService.reverseImpact({
            kind: 'internal-transfer-out',
            amount: existing.amount,
            paymentTargetType: 'bank',
            bankId: existing.fromBankId,
            tx,
          });
        }
        if (existing.toType === 'safe' && existing.toSafeId) {
          const safe = await tx.safe.findUnique({
            where: { id: existing.toSafeId },
          });
          if (!safe) throw new NotFoundException('Safe not found');
          await AccountingService.reverseImpact({
            kind: 'internal-transfer-in',
            amount: existing.amount,
            paymentTargetType: 'safe',
            branchId: safe.branchId,
            safeId: existing.toSafeId,
            tx,
          });
        } else if (existing.toType === 'bank' && existing.toBankId) {
          await AccountingService.reverseImpact({
            kind: 'internal-transfer-in',
            amount: existing.amount,
            paymentTargetType: 'bank',
            bankId: existing.toBankId,
            tx,
          });
        }

        await tx.internalTransfer.delete({ where: { id } });
      });
    } catch (error) {
      throw new NotFoundException('Internal transfer not found');
    }
  }

  // ==================== Private Helper Methods ====================

  // Historical recalculation kept for admin tooling if needed
  private async calculateCurrentBalance(
    accountType: 'safe' | 'bank',
    accountId: string,
  ): Promise<number> {
    if (accountType === 'safe') {
      const safe = await this.prisma.safe.findUnique({
        where: { id: accountId },
      });
      if (!safe) throw new NotFoundException('Safe not found');
      return (safe as any).currentBalance ?? 0;
    } else {
      const bank = await this.prisma.bank.findUnique({
        where: { id: accountId },
      });
      if (!bank) throw new NotFoundException('Bank not found');
      return (bank as any).currentBalance ?? 0;
    }
  }

  private async generateNextCode(): Promise<string> {
    const lastTransfer = await this.prisma.internalTransfer.findFirst({
      orderBy: { code: 'desc' },
    });

    if (!lastTransfer) {
      return 'INT-001';
    }

    const match = lastTransfer.code.match(/INT-(\d+)/);
    if (!match) {
      return 'INT-001';
    }

    const nextNumber = parseInt(match[1], 10) + 1;
    return `INT-${String(nextNumber).padStart(3, '0')}`;
  }

  private mapToResponse(transfer: any): InternalTransferResponse {
    return {
      id: transfer.id,
      code: transfer.code,
      date: transfer.date,
      amount: transfer.amount,
      description: transfer.description,
      fromType: transfer.fromType,
      fromSafeId: transfer.fromSafeId,
      fromBankId: transfer.fromBankId,
      toType: transfer.toType,
      toSafeId: transfer.toSafeId,
      toBankId: transfer.toBankId,
      userId: transfer.userId,
      branchId: transfer.branchId,
      fromSafe: transfer.fromSafe,
      fromBank: transfer.fromBank,
      toSafe: transfer.toSafe,
      toBank: transfer.toBank,
      createdAt: transfer.createdAt,
      updatedAt: transfer.updatedAt,
    };
  }
}
