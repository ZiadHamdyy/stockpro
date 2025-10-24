import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateBankRequest } from './dtos/request/create-bank.request';
import { UpdateBankRequest } from './dtos/request/update-bank.request';
import { BankResponse } from './dtos/response/bank.response';

@Injectable()
export class BankService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(data: CreateBankRequest): Promise<BankResponse> {
    const code = await this.generateNextCode();

    const bank = await this.prisma.bank.create({
      data: {
        ...data,
        code,
        openingBalance: data.openingBalance || 0,
      },
    });

    return this.mapToResponse(bank);
  }

  async findAll(search?: string): Promise<BankResponse[]> {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            {
              accountNumber: { contains: search, mode: 'insensitive' as const },
            },
            { iban: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const banks = await this.prisma.bank.findMany({
      where,
      orderBy: { code: 'asc' },
    });

    return banks.map((bank) => this.mapToResponse(bank));
  }

  async findOne(id: string): Promise<BankResponse> {
    const bank = await this.prisma.bank.findUnique({
      where: { id },
    });

    if (!bank) {
      throw new NotFoundException('Bank not found');
    }

    return this.mapToResponse(bank);
  }

  async findByCode(code: string): Promise<BankResponse> {
    const bank = await this.prisma.bank.findUnique({
      where: { code },
    });

    if (!bank) {
      throw new NotFoundException('Bank not found');
    }

    return this.mapToResponse(bank);
  }

  async update(id: string, data: UpdateBankRequest): Promise<BankResponse> {
    try {
      const bank = await this.prisma.bank.update({
        where: { id },
        data,
      });

      return this.mapToResponse(bank);
    } catch (error) {
      throw new NotFoundException('Bank not found');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.bank.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException('Bank not found');
    }
  }

  private async generateNextCode(): Promise<string> {
    const lastBank = await this.prisma.bank.findFirst({
      orderBy: { code: 'desc' },
    });

    if (!lastBank) {
      return 'BK-001';
    }

    const match = lastBank.code.match(/BK-(\d+)/);
    if (!match) {
      return 'BK-001';
    }

    const nextNumber = parseInt(match[1], 10) + 1;
    return `BK-${String(nextNumber).padStart(3, '0')}`;
  }

  private mapToResponse(bank: any): BankResponse {
    return {
      id: bank.id,
      code: bank.code,
      name: bank.name,
      accountNumber: bank.accountNumber,
      iban: bank.iban,
      openingBalance: bank.openingBalance,
      createdAt: bank.createdAt,
      updatedAt: bank.updatedAt,
    };
  }
}
