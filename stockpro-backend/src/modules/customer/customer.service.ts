import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateCustomerRequest } from './dtos/request/create-customer.request';
import { UpdateCustomerRequest } from './dtos/request/update-customer.request';
import { CustomerResponse } from './dtos/response/customer.response';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(data: CreateCustomerRequest): Promise<CustomerResponse> {
    const code = await this.generateNextCode();
    const openingBalance = data.openingBalance || 0;

    const customer = await this.prisma.customer.create({
      data: {
        ...data,
        code,
        openingBalance,
        currentBalance: openingBalance, // Initialize currentBalance from openingBalance
      },
    });

    return this.mapToResponse(customer);
  }

  async findAll(search?: string): Promise<CustomerResponse[]> {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { code: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
            { taxNumber: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const customers = await this.prisma.customer.findMany({
      where,
      orderBy: { code: 'asc' },
    });

    return customers.map((customer) => this.mapToResponse(customer));
  }

  async findOne(id: string): Promise<CustomerResponse> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return this.mapToResponse(customer);
  }

  async findByCode(code: string): Promise<CustomerResponse> {
    const customer = await this.prisma.customer.findUnique({
      where: { code },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return this.mapToResponse(customer);
  }

  async update(
    id: string,
    data: UpdateCustomerRequest,
  ): Promise<CustomerResponse> {
    try {
      // If openingBalance is being updated, adjust currentBalance accordingly
      if (data.openingBalance !== undefined) {
        const existingCustomer = await this.prisma.customer.findUnique({
          where: { id },
        });
        
        if (existingCustomer) {
          const openingBalanceDiff = data.openingBalance - existingCustomer.openingBalance;
          const customer = await this.prisma.customer.update({
            where: { id },
            data: {
              ...data,
              currentBalance: {
                increment: openingBalanceDiff, // Adjust currentBalance by the difference
              },
            },
          });

          return this.mapToResponse(customer);
        }
      }

      const customer = await this.prisma.customer.update({
        where: { id },
        data,
      });

      return this.mapToResponse(customer);
    } catch (error) {
      throw new NotFoundException('Customer not found');
    }
  }

  async remove(id: string): Promise<void> {
    // Prevent deletion if there are related transactions
    const [salesCount, returnsCount, paymentVouchersCount, receiptVouchersCount] =
      await Promise.all([
        this.prisma.salesInvoice.count({ where: { customerId: id } }),
        this.prisma.salesReturn.count({ where: { customerId: id } }),
        this.prisma.paymentVoucher.count({ where: { customerId: id } }),
        this.prisma.receiptVoucher.count({ where: { customerId: id } }),
      ]);

    if (
      salesCount +
        returnsCount +
        paymentVouchersCount +
        receiptVouchersCount >
      0
    ) {
      throw new ConflictException('لا يمكن الحذف لوجود بيانات مرتبطة.');
    }

    try {
      await this.prisma.customer.delete({ where: { id } });
    } catch (error: any) {
      // Prisma: record not found
      if (error?.code === 'P2025') {
        throw new NotFoundException('Customer not found');
      }
      // Prisma: foreign key constraint failed (fallback)
      if (error?.code === 'P2003') {
        throw new ConflictException('لا يمكن الحذف لوجود بيانات مرتبطة.');
      }
      throw error;
    }
  }

  private async generateNextCode(): Promise<string> {
    const lastCustomer = await this.prisma.customer.findFirst({
      orderBy: { code: 'desc' },
    });

    if (!lastCustomer) {
      return 'CUS-001';
    }

    const match = lastCustomer.code.match(/CUS-(\d+)/);
    if (!match) {
      return 'CUS-001';
    }

    const nextNumber = parseInt(match[1], 10) + 1;
    return `CUS-${String(nextNumber).padStart(3, '0')}`;
  }

  private mapToResponse(customer: any): CustomerResponse {
    return {
      id: customer.id,
      code: customer.code,
      name: customer.name,
      commercialReg: customer.commercialReg,
      taxNumber: customer.taxNumber,
      nationalAddress: customer.nationalAddress,
      phone: customer.phone,
      openingBalance: customer.openingBalance,
      currentBalance: customer.currentBalance,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }
}
