import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreatePayableAccountRequest } from './dtos/request/create-payable-account.request';
import { UpdatePayableAccountRequest } from './dtos/request/update-payable-account.request';
import { PayableAccountResponse } from './dtos/response/payable-account.response';

@Injectable()
export class PayableAccountService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(dto: CreatePayableAccountRequest): Promise<PayableAccountResponse> {
    const last = await this.prisma.payableAccount.findFirst({ orderBy: { code: 'desc' } });
    const lastNum = last ? parseInt(last.code.replace('PA-', ''), 10) || 0 : 0;
    const code = `PA-${String(lastNum + 1).padStart(3, '0')}`;

    const entity = await this.prisma.payableAccount.create({
      data: { name: dto.name, openingBalance: dto.openingBalance ?? 0, code },
    });
    return this.map(entity);
  }

  async findAll(): Promise<PayableAccountResponse[]> {
    const rows = await this.prisma.payableAccount.findMany({ orderBy: { code: 'asc' } });
    return rows.map(this.map);
  }

  async findOne(id: string): Promise<PayableAccountResponse> {
    const entity = await this.prisma.payableAccount.findUnique({ where: { id } });
    if (!entity) throw new NotFoundException('Payable account not found');
    return this.map(entity);
  }

  async findByCode(code: string): Promise<PayableAccountResponse> {
    const entity = await this.prisma.payableAccount.findUnique({ where: { code } });
    if (!entity) throw new NotFoundException('Payable account not found');
    return this.map(entity);
  }

  async update(id: string, dto: UpdatePayableAccountRequest): Promise<PayableAccountResponse> {
    const exists = await this.prisma.payableAccount.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Payable account not found');
    const entity = await this.prisma.payableAccount.update({ where: { id }, data: dto });
    return this.map(entity);
  }

  async remove(id: string): Promise<void> {
    const exists = await this.prisma.payableAccount.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Payable account not found');
    await this.prisma.payableAccount.delete({ where: { id } });
  }

  private map = (entity: any): PayableAccountResponse => ({
    id: entity.id,
    code: entity.code,
    name: entity.name,
    openingBalance: entity.openingBalance,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  });
}


