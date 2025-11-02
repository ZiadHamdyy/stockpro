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
        throw new BadRequestException(
          'Cannot transfer from and to the same account',
        );
      }
    }

    // Validate sender has sufficient balance
    const senderBalance = await this.calculateCurrentBalance(
      data.fromType as 'safe' | 'bank',
      data.fromType === 'safe' ? data.fromSafeId! : data.fromBankId!,
    );

    if (senderBalance < data.amount) {
      const accountName =
        data.fromType === 'safe'
          ? (await this.prisma.safe.findUnique({ where: { id: data.fromSafeId! } }))?.name
          : (await this.prisma.bank.findUnique({ where: { id: data.fromBankId! } }))?.name;
      throw new ConflictException(
        `الرصيد غير كافي في ${accountName || 'الحساب المرسل'}. الرصيد الحالي: ${senderBalance.toFixed(2)}`,
      );
    }

    // Ensure only the correct ID is set based on type
    const transferData: any = {
      code,
      date: new Date(data.date),
      fromType: data.fromType,
      toType: data.toType,
      amount: data.amount,
      description: data.description,
      userId,
      branchId: data.branchId,
    };

    if (data.fromType === 'safe') {
      transferData.fromSafeId = data.fromSafeId;
      transferData.fromBankId = null;
    } else {
      transferData.fromBankId = data.fromBankId;
      transferData.fromSafeId = null;
    }

    if (data.toType === 'safe') {
      transferData.toSafeId = data.toSafeId;
      transferData.toBankId = null;
    } else {
      transferData.toBankId = data.toBankId;
      transferData.toSafeId = null;
    }

    const internalTransfer = await this.prisma.internalTransfer.create({
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

    return this.mapToResponse(internalTransfer);
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
      orderBy: { date: 'desc' },
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
      const existing = await this.prisma.internalTransfer.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException('Internal transfer not found');
      }

      // Determine the new sender account (from)
      const newFromType = data.fromType || existing.fromType;
      const newFromId =
        newFromType === 'safe'
          ? data.fromSafeId || existing.fromSafeId
          : data.fromBankId || existing.fromBankId;

      const newAmount = data.amount !== undefined ? data.amount : existing.amount;

      // Determine if sender changed
      const senderChanged =
        newFromType !== existing.fromType ||
        (newFromType === 'safe'
          ? newFromId !== existing.fromSafeId
          : newFromId !== existing.fromBankId);

      // Calculate balance EXCLUDING the existing transfer we're about to update
      // This gives us the balance as if this transfer never existed
      let senderBalance = await this.calculateCurrentBalance(
        newFromType as 'safe' | 'bank',
        newFromId!,
        id, // Exclude this transfer from calculation
      );

      // Now we have the balance without this transfer
      // We need to check if adding the new amount would be valid
      // No need to add back old amount since we excluded the transfer entirely

      // Validate sufficient balance for new amount
      if (senderBalance < newAmount) {
        const accountName =
          newFromType === 'safe'
            ? (await this.prisma.safe.findUnique({ where: { id: newFromId! } }))?.name
            : (await this.prisma.bank.findUnique({ where: { id: newFromId! } }))?.name;
        throw new ConflictException(
          `الرصيد غير كافي في ${accountName || 'الحساب المرسل'}. الرصيد المتاح: ${senderBalance.toFixed(2)}`,
        );
      }

      const updateData: any = { ...data };

      if (data.date) {
        updateData.date = new Date(data.date);
      }

      // Validate from/to if both types are being updated
      if (data.fromType && data.toType) {
        if (
          data.fromType === data.toType &&
          ((data.fromType === 'safe' && data.fromSafeId === data.toSafeId) ||
            (data.fromType === 'bank' && data.fromBankId === data.toBankId))
        ) {
          throw new BadRequestException(
            'Cannot transfer from and to the same account',
          );
        }
      } else if (data.fromType) {
        // Only fromType changed, validate against existing toType
        const toType = data.toType || existing.toType;
        if (
          data.fromType === toType &&
          ((data.fromType === 'safe' &&
            data.fromSafeId === (data.toSafeId || existing.toSafeId)) ||
            (data.fromType === 'bank' &&
              data.fromBankId === (data.toBankId || existing.toBankId)))
        ) {
          throw new BadRequestException(
            'Cannot transfer from and to the same account',
          );
        }
      } else if (data.toType) {
        // Only toType changed, validate against existing fromType
        const fromType = existing.fromType;
        if (
          fromType === data.toType &&
          ((fromType === 'safe' &&
            (data.fromSafeId || existing.fromSafeId) === data.toSafeId) ||
            (fromType === 'bank' &&
              (data.fromBankId || existing.fromBankId) === data.toBankId))
        ) {
          throw new BadRequestException(
            'Cannot transfer from and to the same account',
          );
        }
      }

      // Handle polymorphic fields
      if (data.fromType === 'safe') {
        updateData.fromSafeId = data.fromSafeId;
        if (data.fromSafeId) {
          updateData.fromBankId = null;
        }
      } else if (data.fromType === 'bank') {
        updateData.fromBankId = data.fromBankId;
        if (data.fromBankId) {
          updateData.fromSafeId = null;
        }
      }

      if (data.toType === 'safe') {
        updateData.toSafeId = data.toSafeId;
        if (data.toSafeId) {
          updateData.toBankId = null;
        }
      } else if (data.toType === 'bank') {
        updateData.toBankId = data.toBankId;
        if (data.toBankId) {
          updateData.toSafeId = null;
        }
      }

      const internalTransfer = await this.prisma.internalTransfer.update({
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

      return this.mapToResponse(internalTransfer);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new NotFoundException('Internal transfer not found');
    }
  }

  async removeInternalTransfer(id: string): Promise<void> {
    try {
      await this.prisma.internalTransfer.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException('Internal transfer not found');
    }
  }

  // ==================== Private Helper Methods ====================

  /**
   * Calculate current balance for a safe or bank account
   * Balance = openingBalance + receipts - payments - outgoing transfers + incoming transfers
   * @param excludeTransferId - Optional transfer ID to exclude from calculation (for update scenarios)
   */
  private async calculateCurrentBalance(
    accountType: 'safe' | 'bank',
    accountId: string,
    excludeTransferId?: string,
  ): Promise<number> {
    let openingBalance = 0;

    if (accountType === 'safe') {
      const safe = await this.prisma.safe.findUnique({
        where: { id: accountId },
      });
      if (!safe) {
        throw new NotFoundException('Safe not found');
      }
      openingBalance = safe.openingBalance;
    } else {
      const bank = await this.prisma.bank.findUnique({
        where: { id: accountId },
      });
      if (!bank) {
        throw new NotFoundException('Bank not found');
      }
      openingBalance = bank.openingBalance;
    }

    // Sum receipt vouchers (money coming in)
    const receiptVouchers = await this.prisma.receiptVoucher.aggregate({
      where: {
        paymentMethod: accountType,
        ...(accountType === 'safe'
          ? { safeId: accountId }
          : { bankId: accountId }),
      },
      _sum: {
        amount: true,
      },
    });

    // Sum payment vouchers (money going out)
    const paymentVouchers = await this.prisma.paymentVoucher.aggregate({
      where: {
        paymentMethod: accountType,
        ...(accountType === 'safe'
          ? { safeId: accountId }
          : { bankId: accountId }),
      },
      _sum: {
        amount: true,
      },
    });

    // Sum outgoing internal transfers (money going out)
    const outgoingTransfers = await this.prisma.internalTransfer.aggregate({
      where: {
        fromType: accountType,
        ...(accountType === 'safe'
          ? { fromSafeId: accountId }
          : { fromBankId: accountId }),
        ...(excludeTransferId ? { id: { not: excludeTransferId } } : {}),
      },
      _sum: {
        amount: true,
      },
    });

    // Sum incoming internal transfers (money coming in)
    const incomingTransfers = await this.prisma.internalTransfer.aggregate({
      where: {
        toType: accountType,
        ...(accountType === 'safe'
          ? { toSafeId: accountId }
          : { toBankId: accountId }),
        ...(excludeTransferId ? { id: { not: excludeTransferId } } : {}),
      },
      _sum: {
        amount: true,
      },
    });

    const receipts = receiptVouchers._sum.amount || 0;
    const payments = paymentVouchers._sum.amount || 0;
    const outgoing = outgoingTransfers._sum.amount || 0;
    const incoming = incomingTransfers._sum.amount || 0;

    return openingBalance + receipts - payments - outgoing + incoming;
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

