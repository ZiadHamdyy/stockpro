import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateStoreIssueVoucherDto } from './dtos/create-store-issue-voucher.dto';
import { UpdateStoreIssueVoucherDto } from './dtos/update-store-issue-voucher.dto';

@Injectable()
export class StoreIssueVoucherService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(createStoreIssueVoucherDto: CreateStoreIssueVoucherDto) {
    const { items, ...voucherData } = createStoreIssueVoucherDto;

    // Generate voucher number
    const voucherNumber = await this.generateVoucherNumber();

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

    return this.prisma.storeIssueVoucher.create({
      data: {
        ...voucherData,
        voucherNumber,
        totalAmount,
        items: {
          create: items.map(item => ({
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            itemId: item.itemId,
          })),
        },
      },
      include: {
        store: true,
        user: true,
        items: {
          include: {
            item: {
              include: {
                group: true,
                unit: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.storeIssueVoucher.findMany({
      include: {
        store: {
          include: {
            branch: true,
          },
        },
        user: true,
        items: {
          include: {
            item: {
              include: {
                group: true,
                unit: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const voucher = await this.prisma.storeIssueVoucher.findUnique({
      where: { id },
      include: {
        store: {
          include: {
            branch: true,
          },
        },
        user: true,
        items: {
          include: {
            item: {
              include: {
                group: true,
                unit: true,
              },
            },
          },
        },
      },
    });

    if (!voucher) {
      throw new NotFoundException('Store issue voucher not found');
    }

    return voucher;
  }

  async update(id: string, updateStoreIssueVoucherDto: UpdateStoreIssueVoucherDto) {
    const { items, ...voucherData } = updateStoreIssueVoucherDto;

    // Check if voucher exists
    await this.findOne(id);

    // Calculate total amount if items are provided
    const totalAmount = items 
      ? items.reduce((sum, item) => sum + item.totalPrice, 0)
      : undefined;

    return this.prisma.storeIssueVoucher.update({
      where: { id },
      data: {
        ...voucherData,
        ...(totalAmount !== undefined && { totalAmount }),
        ...(items && {
          items: {
            deleteMany: {},
            create: items.map(item => ({
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              itemId: item.itemId,
            })),
          },
        }),
      },
      include: {
        store: {
          include: {
            branch: true,
          },
        },
        user: true,
        items: {
          include: {
            item: {
              include: {
                group: true,
                unit: true,
              },
            },
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.storeIssueVoucher.delete({
      where: { id },
    });
  }

  private async generateVoucherNumber(): Promise<string> {
    const count = await this.prisma.storeIssueVoucher.count();
    return `SIV-${String(count + 1).padStart(6, '0')}`;
  }
}

