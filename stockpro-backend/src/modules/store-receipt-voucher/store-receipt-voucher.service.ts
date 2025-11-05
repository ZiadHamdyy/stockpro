import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateStoreReceiptVoucherDto } from './dtos/create-store-receipt-voucher.dto';
import { UpdateStoreReceiptVoucherDto } from './dtos/update-store-receipt-voucher.dto';

@Injectable()
export class StoreReceiptVoucherService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(createStoreReceiptVoucherDto: CreateStoreReceiptVoucherDto) {
    const { items, ...voucherData } = createStoreReceiptVoucherDto;

    // Validate quantities are positive
    for (const item of items) {
      if (item.quantity <= 0) {
        throw new BadRequestException(
          `Quantity must be greater than zero for item ${item.itemId}`,
        );
      }
    }

    // Generate voucher number
    const voucherNumber = await this.generateVoucherNumber();

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

    // Receipt operations don't need stock validation - can add any item, any quantity
    return this.prisma.storeReceiptVoucher.create({
      data: {
        ...voucherData,
        voucherNumber,
        totalAmount,
        items: {
          create: items.map((item) => ({
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
    return this.prisma.storeReceiptVoucher.findMany({
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
        createdAt: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const voucher = await this.prisma.storeReceiptVoucher.findUnique({
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
      throw new NotFoundException('Store receipt voucher not found');
    }

    return voucher;
  }

  async update(
    id: string,
    updateStoreReceiptVoucherDto: UpdateStoreReceiptVoucherDto,
  ) {
    const { items, ...voucherData } = updateStoreReceiptVoucherDto;

    // Check if voucher exists
    await this.findOne(id);

    // Validate quantities are positive if items provided
    if (items) {
      for (const item of items) {
        if (item.quantity <= 0) {
          throw new BadRequestException(
            `Quantity must be greater than zero for item ${item.itemId}`,
          );
        }
      }
    }

    // Calculate total amount if items are provided
    const totalAmount = items
      ? items.reduce((sum, item) => sum + item.totalPrice, 0)
      : undefined;

    // Receipt operations don't need stock validation
    return this.prisma.storeReceiptVoucher.update({
      where: { id },
      data: {
        ...voucherData,
        ...(totalAmount !== undefined && { totalAmount }),
        ...(items && {
          items: {
            deleteMany: {},
            create: items.map((item) => ({
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

    return this.prisma.storeReceiptVoucher.delete({
      where: { id },
    });
  }

  private async generateVoucherNumber(): Promise<string> {
    const count = await this.prisma.storeReceiptVoucher.count();
    return `SRV-${String(count + 1).padStart(6, '0')}`;
  }
}
