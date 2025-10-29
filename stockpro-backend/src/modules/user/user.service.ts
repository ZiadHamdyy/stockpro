import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { GenericHttpException } from '../../common/application/exceptions/generic-http-exception';
import { HttpStatus } from '@nestjs/common';
import { CreateUserRequest } from './dtos/request/create-user.request';
import { UpdateUserRequest } from './dtos/request/update-user.request.js';
import { UserListFilterInput } from './dtos/request/user-filter.input';
import { HelperService } from '../../common/utils/helper/helper.service';
import { ERROR_MESSAGES } from '../../common/constants/error-messages.constant';
import { base64ToBuffer, bufferToDataUri } from '../../common/utils/image-converter';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly helperService: HelperService,
  ) {}

  /**
   * Converts user data from database format to response format
   * Converts Buffer image to base64 data URI
   */
  private convertUserForResponse(user: any) {
    return {
      ...user,
      image: user.image ? bufferToDataUri(user.image) : null,
    };
  }

  async getAllUsers(filters?: UserListFilterInput) {
    const {
      search,
      page = 1,
      limit = 8,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters || {};

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { role: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const skip = (page - 1) * limit;

    const total = await this.prisma.user.count({ where });
    const users = await this.prisma.user.findMany({
      where,
      include: {
        role: true,
        branch: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    return {
      data: users.map(user => this.convertUserForResponse(user)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async createUser(data: CreateUserRequest) {
    // Check if user already exists
    await this.errorIfUserExists(data.email);

    // Get default role (manager)
    const defaultRole = await this.prisma.role.findFirst({
      where: { name: 'manager' },
    });

    // Create user directly with hashed password
    const user = await this.prisma.user.create({
      data: {
        image: data.image ? base64ToBuffer(data.image) : null,
        email: data.email,
        password: await this.helperService.hashPassword(data.password),
        name: data.name,
        emailVerified: true,
        active: true,
        roleId: data.roleId ?? defaultRole?.id,
        branchId: data.branchId,
      },
      include: {
        role: true,
        branch: true,
      },
    });

    return this.convertUserForResponse(user);
  }

  async getVerifiedUserIdByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (!user)
      throw new GenericHttpException(
        ERROR_MESSAGES.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    return { id: user.id };
  }

  async getLoginUserOrError({ email }: { email: string }) {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (!user)
      throw new GenericHttpException(
        ERROR_MESSAGES.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    if (!user.active)
      throw new GenericHttpException(
        ERROR_MESSAGES.USER_BLOCKED,
        HttpStatus.FORBIDDEN,
      );
    return user;
  }

  async toggleUserActivity(userId: string, currentUserId: string) {
    // Check if user exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!existingUser) {
      throw new GenericHttpException(
        ERROR_MESSAGES.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    // Prevent users from deactivating themselves
    if (userId === currentUserId) {
      throw new GenericHttpException(
        ERROR_MESSAGES.CANNOT_DEACTIVATE_OWN_ACCOUNT,
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { active: !existingUser.active },
    });
    return user;
  }

  async deleteUser(userId: string) {
    // Check if user exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        id: userId,
      },
      include: {
        Session: true,
      },
    });

    if (!existingUser) {
      throw new GenericHttpException(
        ERROR_MESSAGES.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    // Delete related sessions first
    await this.prisma.session.deleteMany({
      where: { userId },
    });

    // Delete the user
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { success: true };
  }

  async errorIfUserExists(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (user)
      throw new GenericHttpException(
        ERROR_MESSAGES.USER_ALREADY_EXISTS,
        HttpStatus.CONFLICT,
      );
  }

  async checkEmail(email: string) {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          email: email,
          active: true,
        },
      });

      if (!user) {
        return {
          success: false,
          user: null,
        };
      }

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      };
    } catch (error) {
      throw new GenericHttpException(
        ERROR_MESSAGES.EMAIL_CHECK_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        branch: true,
      },
    });

    if (!user) {
      throw new GenericHttpException(
        ERROR_MESSAGES.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.convertUserForResponse(user);
  }

  async updateUser(userId: string, data: UpdateUserRequest) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new GenericHttpException(
        ERROR_MESSAGES.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if email is being changed and if new email already exists
    if (data.email && data.email !== existingUser.email) {
      await this.errorIfUserExists(data.email);
    }

    const updateData: any = {};

    if (data.image !== undefined) {
      updateData.image = data.image ? base64ToBuffer(data.image) : null;
    }
    if (data.email !== undefined) {
      updateData.email = data.email;
    }
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.branchId !== undefined) {
      updateData.branchId = data.branchId;
    }

    // Only update password if provided
    if (data.password) {
      updateData.password = await this.helperService.hashPassword(
        data.password,
      );
    }

    if (data.roleId) {
      updateData.roleId = data.roleId;
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        role: true,
        branch: true,
      },
    });

    return this.convertUserForResponse(user);
  }

  async getUserPermissions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.role) {
      return [];
    }

    return user.role.rolePermissions.map((rp) => rp.permission);
  }
}
