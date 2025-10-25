import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateCurrentAccountRequest } from './dtos/request/create-current-account.request';
import { UpdateCurrentAccountRequest } from './dtos/request/update-current-account.request';
import { CurrentAccountResponse } from './dtos/response/current-account.response';

@Injectable()
export class CurrentAccountService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(createCurrentAccountDto: CreateCurrentAccountRequest): Promise<CurrentAccountResponse> {
    // Generate the next code
    const lastAccount = await this.prisma.currentAccount.findFirst({
      orderBy: { code: 'desc' },
    });

    let nextCodeNumber = 1;
    if (lastAccount) {
      const lastCodeNumber = parseInt(lastAccount.code.replace('CA-', ''), 10) || 0;
      nextCodeNumber = lastCodeNumber + 1;
    }

    const code = `CA-${String(nextCodeNumber).padStart(3, '0')}`;

    const currentAccount = await this.prisma.currentAccount.create({
      data: {
        ...createCurrentAccountDto,
        code,
      },
    });

    return this.mapToResponse(currentAccount);
  }

  async findAll(): Promise<CurrentAccountResponse[]> {
    const currentAccounts = await this.prisma.currentAccount.findMany({
      orderBy: { code: 'asc' },
    });

    return currentAccounts.map(account => this.mapToResponse(account));
  }

  async findOne(id: string): Promise<CurrentAccountResponse> {
    const currentAccount = await this.prisma.currentAccount.findUnique({
      where: { id },
    });

    if (!currentAccount) {
      throw new NotFoundException('Current account not found');
    }

    return this.mapToResponse(currentAccount);
  }

  async findByCode(code: string): Promise<CurrentAccountResponse> {
    const currentAccount = await this.prisma.currentAccount.findUnique({
      where: { code },
    });

    if (!currentAccount) {
      throw new NotFoundException('Current account not found');
    }

    return this.mapToResponse(currentAccount);
  }

  async update(id: string, updateCurrentAccountDto: UpdateCurrentAccountRequest): Promise<CurrentAccountResponse> {
    const existingAccount = await this.prisma.currentAccount.findUnique({
      where: { id },
    });

    if (!existingAccount) {
      throw new NotFoundException('Current account not found');
    }

    const currentAccount = await this.prisma.currentAccount.update({
      where: { id },
      data: updateCurrentAccountDto,
    });

    return this.mapToResponse(currentAccount);
  }

  async remove(id: string): Promise<void> {
    const existingAccount = await this.prisma.currentAccount.findUnique({
      where: { id },
    });

    if (!existingAccount) {
      throw new NotFoundException('Current account not found');
    }

    await this.prisma.currentAccount.delete({
      where: { id },
    });
  }

  private mapToResponse(currentAccount: any): CurrentAccountResponse {
    return {
      id: currentAccount.id,
      code: currentAccount.code,
      name: currentAccount.name,
      type: currentAccount.type,
      openingBalance: currentAccount.openingBalance,
      createdAt: currentAccount.createdAt,
      updatedAt: currentAccount.updatedAt,
    };
  }
}
