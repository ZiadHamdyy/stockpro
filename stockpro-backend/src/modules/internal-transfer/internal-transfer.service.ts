import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateInternalTransferRequest } from './dtos/request/create-internal-transfer.request';
import { UpdateInternalTransferRequest } from './dtos/request/update-internal-transfer.request';
import { InternalTransferResponse } from './dtos/response/internal-transfer.response';

@Injectable()
export class InternalTransferService {
  constructor(private readonly prisma: DatabaseService) {}

  // ==================== CRUD Operations ====================

  async createInternalTransfer(
    data: CreateInternalTransferRequest,
    userId: string,
  ): Promise<InternalTransferResponse> {
    const code = await this.generateNextCode();

    // Validate that from and to are different
    if (data.fromType === data.toType) {
      if (
        (data.fromType === 'safe' && data.fromSafeId === data.toSafeId) ||
        (data.fromType === 'bank' && data.fromBankId === data.toBankId)
      ) {
        throw new BadRequestException('Cannot transfer from and to the same account');
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Validate sender has sufficient current balance
      if (data.fromType === 'safe') {
        const sender = await tx.safe.findUnique({ where: { id: data.fromSafeId! } });
        if (!sender) throw new NotFoundException('Safe not found');
        if ((sender as any).currentBalance < data.amount) {
          throw new ConflictException(`الرصيد غير كافي في ${sender.name}`);
        }
        await tx.safe.update({
          where: { id: data.fromSafeId! },
          data: { currentBalance: { decrement: data.amount } } as any,
        });
      } else {
        const sender = await tx.bank.findUnique({ where: { id: data.fromBankId! } });
        if (!sender) throw new NotFoundException('Bank not found');
        if ((sender as any).currentBalance < data.amount) {
          throw new ConflictException(`الرصيد غير كافي في ${sender.name}`);
        }
        await tx.bank.update({
          where: { id: data.fromBankId! },
          data: { currentBalance: { decrement: data.amount } } as any,
        });
      }

      // Credit receiver
      if (data.toType === 'safe') {
        await tx.safe.update({
          where: { id: data.toSafeId! },
          data: { currentBalance: { increment: data.amount } } as any,
        });
      } else {
        await tx.bank.update({
          where: { id: data.toBankId! },
          data: { currentBalance: { increment: data.amount } } as any,
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
        const existing = await tx.internalTransfer.findUnique({ where: { id } });
        if (!existing) {
          throw new NotFoundException('Internal transfer not found');
        }

        // Reverse previous effect
        if (existing.fromType === 'safe' && existing.fromSafeId) {
          await tx.safe.update({
            where: { id: existing.fromSafeId },
            data: { currentBalance: { increment: existing.amount } } as any,
          });
        } else if (existing.fromType === 'bank' && existing.fromBankId) {
          await tx.bank.update({
            where: { id: existing.fromBankId },
            data: { currentBalance: { increment: existing.amount } } as any,
          });
        }
        if (existing.toType === 'safe' && existing.toSafeId) {
          await tx.safe.update({
            where: { id: existing.toSafeId },
            data: { currentBalance: { decrement: existing.amount } } as any,
          });
        } else if (existing.toType === 'bank' && existing.toBankId) {
          await tx.bank.update({
            where: { id: existing.toBankId },
            data: { currentBalance: { decrement: existing.amount } } as any,
          });
        }

        // Determine new values
        const newFromType = data.fromType || existing.fromType;
        const newToType = data.toType || existing.toType;
        const newAmount = data.amount !== undefined ? data.amount : existing.amount;
        const newFromSafeId = newFromType === 'safe' ? (data.fromSafeId || existing.fromSafeId) : null;
        const newFromBankId = newFromType === 'bank' ? (data.fromBankId || existing.fromBankId) : null;
        const newToSafeId = newToType === 'safe' ? (data.toSafeId || existing.toSafeId) : null;
        const newToBankId = newToType === 'bank' ? (data.toBankId || existing.toBankId) : null;

        // Validate from != to
        if (
          newFromType === newToType &&
          ((newFromType === 'safe' && newFromSafeId === newToSafeId) ||
            (newFromType === 'bank' && newFromBankId === newToBankId))
        ) {
          throw new BadRequestException('Cannot transfer from and to the same account');
        }

        // Validate sender balance
        if (newFromType === 'safe') {
          const sender = await tx.safe.findUnique({ where: { id: newFromSafeId! } });
          if (!sender) throw new NotFoundException('Safe not found');
          if ((sender as any).currentBalance < newAmount) {
            throw new ConflictException(`الرصيد غير كافي في ${sender.name}`);
          }
          await tx.safe.update({ where: { id: newFromSafeId! }, data: { currentBalance: { decrement: newAmount } } as any });
        } else {
          const sender = await tx.bank.findUnique({ where: { id: newFromBankId! } });
          if (!sender) throw new NotFoundException('Bank not found');
          if ((sender as any).currentBalance < newAmount) {
            throw new ConflictException(`الرصيد غير كافي في ${sender.name}`);
          }
          await tx.bank.update({ where: { id: newFromBankId! }, data: { currentBalance: { decrement: newAmount } } as any });
        }

        // Credit receiver
        if (newToType === 'safe') {
          await tx.safe.update({ where: { id: newToSafeId! }, data: { currentBalance: { increment: newAmount } } as any });
        } else {
          await tx.bank.update({ where: { id: newToBankId! }, data: { currentBalance: { increment: newAmount } } as any });
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
          include: { user: true, branch: true, fromSafe: true, fromBank: true, toSafe: true, toBank: true },
        });

        return updated;
      });

      return this.mapToResponse(result);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
      }
      throw new NotFoundException('Internal transfer not found');
    }
  }

  async removeInternalTransfer(id: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const existing = await tx.internalTransfer.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Internal transfer not found');

        // Reverse effect
        if (existing.fromType === 'safe' && existing.fromSafeId) {
          await tx.safe.update({ where: { id: existing.fromSafeId }, data: { currentBalance: { increment: existing.amount } } as any });
        } else if (existing.fromType === 'bank' && existing.fromBankId) {
          await tx.bank.update({ where: { id: existing.fromBankId }, data: { currentBalance: { increment: existing.amount } } as any });
        }
        if (existing.toType === 'safe' && existing.toSafeId) {
          await tx.safe.update({ where: { id: existing.toSafeId }, data: { currentBalance: { decrement: existing.amount } } as any });
        } else if (existing.toType === 'bank' && existing.toBankId) {
          await tx.bank.update({ where: { id: existing.toBankId }, data: { currentBalance: { decrement: existing.amount } } as any });
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
      const safe = await this.prisma.safe.findUnique({ where: { id: accountId } });
      if (!safe) throw new NotFoundException('Safe not found');
      return (safe as any).currentBalance ?? 0;
    } else {
      const bank = await this.prisma.bank.findUnique({ where: { id: accountId } });
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

