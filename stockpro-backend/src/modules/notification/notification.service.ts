import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateNotificationDto } from './dtos/create-notification.dto';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(companyId: string, createNotificationDto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        ...createNotificationDto,
        companyId,
      },
    });
  }

  async createForStoreUsers(
    companyId: string,
    storeId: string,
    type: string,
    message: string,
    relatedId?: string,
  ) {
    try {
      // Get store to find branch
      const store = await this.prisma.store.findUnique({
        where: { id: storeId },
        select: { branchId: true, companyId: true },
      });

      if (!store || store.companyId !== companyId) {
        console.error(`Store with id ${storeId} not found or doesn't belong to company ${companyId}`);
        return [];
      }

      // Get all users in the same branch as the store
      const users = await this.prisma.user.findMany({
        where: {
          companyId,
          branchId: store.branchId,
          active: true,
        },
        select: { id: true },
      });

      if (users.length === 0) {
        console.warn(`No active users found in branch ${store.branchId} for store ${storeId}`);
        return [];
      }

      // Create notifications for all users in the branch
      const notifications = await Promise.all(
        users.map((user) =>
          this.prisma.notification.create({
            data: {
              userId: user.id,
              type,
              message,
              relatedId,
              companyId,
            },
          }),
        ),
      );

      console.log(`Created ${notifications.length} notifications for store ${storeId} (branch ${store.branchId})`);
      return notifications;
    } catch (error) {
      console.error(`Error creating notifications for store ${storeId}:`, error);
      // Don't throw - we don't want notification failures to break the transfer creation
      return [];
    }
  }

  async findAll(companyId: string, userId: string) {
    return this.prisma.notification.findMany({
      where: {
        companyId,
        userId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        storeTransferVoucher: {
          include: {
            fromStore: true,
            toStore: true,
          },
        },
      },
    });
  }

  async getUnreadCount(companyId: string, userId: string) {
    return this.prisma.notification.count({
      where: {
        companyId,
        userId,
        read: false,
      },
    });
  }

  async markAsRead(companyId: string, id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        id,
        companyId,
        userId, // Ensure user can only mark their own notifications as read
      },
      data: {
        read: true,
      },
    });
  }

  async markAllAsRead(companyId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        companyId,
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
  }
}


