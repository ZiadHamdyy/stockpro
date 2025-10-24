import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateStoreTransferVoucherDto } from './dtos/create-store-transfer-voucher.dto';
import { UpdateStoreTransferVoucherDto } from './dtos/update-store-transfer-voucher.dto';

@Injectable()
export class StoreTransferVoucherService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(createStoreTransferVoucherDto: CreateStoreTransferVoucherDto) {
    const { items, ...voucherData } = createStoreTransferVoucherDto;

    // Generate voucher number
    const voucherNumber = await this.generateVoucherNumber();

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

    return this.prisma.storeTransferVoucher.create({
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
        fromStore: {
          include: {
            branch: true,
          },
        },
        toStore: {
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

  async findAll() {
    return this.prisma.storeTransferVoucher.findMany({
      include: {
        fromStore: {
          include: {
            branch: true,
          },
        },
        toStore: {
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
    const voucher = await this.prisma.storeTransferVoucher.findUnique({
      where: { id },
      include: {
        fromStore: {
          include: {
            branch: true,
          },
        },
        toStore: {
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
      throw new NotFoundException('Store transfer voucher not found');
    }

    return voucher;
  }

  async update(id: string, updateStoreTransferVoucherDto: UpdateStoreTransferVoucherDto) {
    const { items, ...voucherData } = updateStoreTransferVoucherDto;

    // Check if voucher exists
    await this.findOne(id);

    // Calculate total amount if items are provided
    const totalAmount = items 
      ? items.reduce((sum, item) => sum + item.totalPrice, 0)
      : undefined;

    return this.prisma.storeTransferVoucher.update({
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
        fromStore: {
          include: {
            branch: true,
          },
        },
        toStore: {
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

    return this.prisma.storeTransferVoucher.delete({
      where: { id },
    });
  }

  private async generateVoucherNumber(): Promise<string> {
    const count = await this.prisma.storeTransferVoucher.count();
    return `STV-${String(count + 1).padStart(6, '0')}`;
  }
}

