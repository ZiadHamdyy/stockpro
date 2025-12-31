import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateBranchDto } from './dtos/create-branch.dto';
import { UpdateBranchDto } from './dtos/update-branch.dto';
import { SubscriptionService } from '../subscription/subscription.service';
import { SafeService } from '../safe/safe.service';
import { StoreService } from '../store/store.service';

@Injectable()
export class BranchService {
  private readonly logger = new Logger(BranchService.name);

  constructor(
    private readonly prisma: DatabaseService,
    private readonly subscriptionService: SubscriptionService,
    private readonly safeService: SafeService,
    private readonly storeService: StoreService,
  ) {}

  async create(companyId: string, createBranchDto: CreateBranchDto) {
    // Check subscription limit
    await this.subscriptionService.enforceLimitOrThrow(companyId, 'branches');

    // Determine next sequential code (starting from 1, company-scoped)
    const last = await this.prisma.branch.findFirst({
      where: { companyId },
      select: { code: true },
      orderBy: { code: 'desc' },
    });
    const nextCode = (last?.code ?? 0) + 1;

    const branch = await this.prisma.branch.create({
      data: { ...createBranchDto, companyId, code: nextCode },
      include: {
        stores: {
          include: {
            user: true,
          },
        },
      },
    });

    // Automatically create Safe with the same name as the branch
    try {
      await this.safeService.create(companyId, {
        name: createBranchDto.name,
        branchId: branch.id,
        openingBalance: 0,
      });
      this.logger.log(`Safe created automatically for branch: ${branch.name}`);
    } catch (error) {
      this.logger.error(
        `Failed to create Safe for branch ${branch.name}: ${error.message}`,
        error.stack,
      );
      // Continue even if Safe creation fails
    }

    // Automatically create Store with the same name as the branch
    try {
      // Get the first user from the company for Store creation
      const firstUser = await this.prisma.user.findFirst({
        where: { companyId },
        orderBy: { createdAt: 'asc' },
      });

      if (!firstUser) {
        this.logger.warn(
          `No users found for company ${companyId}. Skipping Store creation for branch: ${branch.name}`,
        );
      } else {
        await this.storeService.create(companyId, {
          name: createBranchDto.name,
          branchId: branch.id,
          userId: firstUser.id,
          address: createBranchDto.address,
          phone: createBranchDto.phone,
          description: createBranchDto.description,
        });
        this.logger.log(`Store created automatically for branch: ${branch.name}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to create Store for branch ${branch.name}: ${error.message}`,
        error.stack,
      );
      // Continue even if Store creation fails
    }

    // Return the branch with updated stores relation
    return this.prisma.branch.findUnique({
      where: { id: branch.id },
      include: {
        stores: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findAll(companyId: string) {
    return this.prisma.branch.findMany({
      where: { companyId },
      include: {
        stores: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findOne(companyId: string, id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id_companyId: { id, companyId } },
      include: {
        stores: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return branch;
  }

  async update(companyId: string, id: string, updateBranchDto: UpdateBranchDto) {
    await this.findOne(companyId, id);

    return this.prisma.branch.update({
      where: { id },
      data: updateBranchDto,
      include: {
        stores: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);

    return this.prisma.branch.delete({
      where: { id },
    });
  }
}
