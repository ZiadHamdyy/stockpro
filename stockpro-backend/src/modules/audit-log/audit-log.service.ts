import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { GetAuditLogsDto } from './dtos/get-audit-logs.dto';
import { AuditLogResponse } from './dtos/audit-log.response';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: DatabaseService) {}

  async createAuditLog(data: {
    companyId: string;
    userId: string;
    branchId?: string;
    action: string;
    targetType: string;
    targetId?: string;
    details: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        companyId: data.companyId,
        userId: data.userId,
        branchId: data.branchId,
        action: data.action,
        targetType: data.targetType,
        targetId: data.targetId,
        details: data.details,
      },
    });
  }

  async findAll(companyId: string, filters?: GetAuditLogsDto): Promise<AuditLogResponse[]> {
    const where: any = { companyId };

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters?.targetType) {
      where.targetType = filters.targetType;
    }

    if (filters?.startDate || filters?.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        // Include the entire end date
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        where.timestamp.lte = endDate;
      }
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            code: true,
            name: true,
            email: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return logs.map((log) => ({
      id: log.id, // Keep as string (UUID)
      timestamp: log.timestamp.toISOString(), // Convert Date to ISO string
      userId: log.user.code,
      userName: log.user.name || log.user.email,
      branchId: log.branchId || undefined,
      branchName: log.branch?.name,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId || undefined,
      details: log.details,
    }));
  }
}

