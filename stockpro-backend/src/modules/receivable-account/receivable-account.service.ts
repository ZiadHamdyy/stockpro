import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateReceivableAccountRequest } from './dtos/request/create-receivable-account.request';
import { UpdateReceivableAccountRequest } from './dtos/request/update-receivable-account.request';
import { ReceivableAccountResponse } from './dtos/response/receivable-account.response';

@Injectable()
export class ReceivableAccountService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(
    dto: CreateReceivableAccountRequest,
  ): Promise<ReceivableAccountResponse> {
    const last = await this.prisma.receivableAccount.findFirst({
      orderBy: { code: 'desc' },
    });
    const lastNum = last ? parseInt(last.code.replace('RA-', ''), 10) || 0 : 0;
    const code = `RA-${String(lastNum + 1).padStart(3, '0')}`;

    const entity = await this.prisma.receivableAccount.create({
      data: {
        name: dto.name,
        openingBalance: dto.openingBalance ?? 0,
        currentBalance: dto.openingBalance ?? 0,
        code,
      },
    });
    return this.map(entity);
  }

  async findAll(): Promise<ReceivableAccountResponse[]> {
    const rows = await this.prisma.receivableAccount.findMany({
      orderBy: { code: 'asc' },
    });
    return rows.map(this.map);
  }

  async findOne(id: string): Promise<ReceivableAccountResponse> {
    const entity = await this.prisma.receivableAccount.findUnique({
      where: { id },
    });
    if (!entity) throw new NotFoundException('Receivable account not found');
    return this.map(entity);
  }

  async findByCode(code: string): Promise<ReceivableAccountResponse> {
    const entity = await this.prisma.receivableAccount.findUnique({
      where: { code },
    });
    if (!entity) throw new NotFoundException('Receivable account not found');
    return this.map(entity);
  }

  async update(
    id: string,
    dto: UpdateReceivableAccountRequest,
  ): Promise<ReceivableAccountResponse> {
    const exists = await this.prisma.receivableAccount.findUnique({
      where: { id },
    });
    if (!exists) throw new NotFoundException('Receivable account not found');
    const entity = await this.prisma.receivableAccount.update({
      where: { id },
      data: dto,
    });
    return this.map(entity);
  }

  async remove(id: string): Promise<void> {
    const exists = await this.prisma.receivableAccount.findUnique({
      where: { id },
    });
    if (!exists) throw new NotFoundException('Receivable account not found');
    await this.prisma.receivableAccount.delete({ where: { id } });
  }

  private map = (entity: any): ReceivableAccountResponse => ({
    id: entity.id,
    code: entity.code,
    name: entity.name,
    openingBalance: entity.openingBalance,
    currentBalance: entity.currentBalance,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  });
}
