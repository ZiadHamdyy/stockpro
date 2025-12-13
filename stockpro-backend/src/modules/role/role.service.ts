import {
  Injectable,
  ForbiddenException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateRoleRequest } from './dtos/request/create-role.request';
import { UpdateRoleRequest } from './dtos/request/update-role.request';
import { AssignPermissionsRequest } from './dtos/request/assign-permissions.request';
import { RoleResponse } from './dtos/response/role.response';
import type { IContextAuthService } from '../../common/application/context/context-auth.interface';
import { IContextAuthServiceToken } from '../../common/application/context/context-auth.interface';

@Injectable()
export class RoleService {
  constructor(
    private readonly prisma: DatabaseService,
    @Inject(IContextAuthServiceToken)
    private readonly authService: IContextAuthService,
  ) {}

  async create(companyId: string, createRoleRequest: CreateRoleRequest): Promise<RoleResponse> {
    // Prevent creating a role with the name "مدير" (manager)
    if (createRoleRequest.name === 'مدير') {
      throw new ConflictException('لا يمكن إنشاء دور باسم مدير');
    }

    const role = await this.prisma.role.create({
      data: {
        ...createRoleRequest,
        companyId,
      },
    });

    return role;
  }

  async findAll(companyId: string): Promise<RoleResponse[]> {
    const roles = await this.prisma.role.findMany({
      orderBy: { name: 'asc' },
      where: { companyId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return roles.map((role) => ({
      ...role,
      permissions: role.rolePermissions.map((rp) => rp.permission),
    })) as RoleResponse[];
  }

  async findOne(companyId: string, id: string): Promise<RoleResponse | null> {
    const role = await this.prisma.role.findUnique({
      where: { id_companyId: { id, companyId } },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      return null;
    }

    return {
      ...role,
      permissions: role.rolePermissions.map((rp) => rp.permission),
    } as RoleResponse;
  }

  async findOneByName(companyId: string, name: string): Promise<RoleResponse | null> {
    const role = await this.prisma.role.findUnique({
      where: { name_companyId: { name, companyId: companyId } },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      return null;
    }

    return {
      ...role,
      permissions: role.rolePermissions.map((rp) => rp.permission),
    } as RoleResponse;
  }

  async update(
    companyId: string,
    id: string,
    updateRoleRequest: UpdateRoleRequest,
    user?: any,
  ): Promise<RoleResponse> {
    // Check if it's a system role and prevent certain updates
    const existingRole = await this.prisma.role.findUnique({
      where: { id_companyId: { id, companyId } },
      include: { rolePermissions: { include: { permission: true } } },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // The @Auth decorator already ensures the user has 'permissions:update' permission
    // So if they reach here, they have the permission and can edit system roles
    // Only prevent changing isSystem from true to false for non-managers
    const isManager = user?.role?.name === 'مدير';
    if (
      existingRole?.isSystem &&
      updateRoleRequest.isSystem === false &&
      !isManager
    ) {
      throw new ForbiddenException('Cannot modify system role flag');
    }

    const role = await this.prisma.role.update({
      where: { id_companyId: { id, companyId } },
      data: updateRoleRequest,
    });

    return role;
  }

  async remove(companyId: string, id: string): Promise<void> {
    // Check if role exists
    const role = await this.prisma.role.findUnique({
      where: { id_companyId: { id, companyId } },
    });

    if (!role) {
      throw new ForbiddenException('Role not found');
    }

    // Prevent deleting the manager role "مدير" - cannot be deleted
    if (role.name === 'مدير') {
      throw new ConflictException('لا يمكن حذف دور المدير');
    }

    // Check if role has any users assigned
    const usersCount = await this.prisma.user.count({
      where: { roleId: id, companyId },
    });

    if (usersCount > 0) {
      throw new ConflictException(
        'لا يمكن حذف الدور لوجود مستخدمين مرتبطين به',
      );
    }

    // Delete the role
    await this.prisma.role.delete({
      where: { id_companyId: { id, companyId } },
    });
  }

  async assignPermissions(
    companyId: string,
    id: string,
    assignPermissionsRequest: AssignPermissionsRequest,
  ): Promise<RoleResponse> {
    const { permissionIds } = assignPermissionsRequest;

    await this.prisma.$transaction(async (tx) => {
      // Get the role to check if it's manager
      const role = await tx.role.findUnique({
        where: { id_companyId: { id, companyId } },
      });

      if (!role) {
        throw new ForbiddenException('Role not found');
      }

      // Get all permissions for the 'permissions' resource
      const permissionsResourcePermissions = await tx.permission.findMany({
        where: { resource: 'permissions', companyId },
      });

      const permissionsResourcePermissionIds =
        permissionsResourcePermissions.map((p) => p.id);

      // If this is the manager role, ensure all permissions resource permissions are included
      const finalPermissionIds = [...permissionIds];
      if (role.name === 'مدير') {
        permissionsResourcePermissionIds.forEach((permId) => {
          if (!finalPermissionIds.includes(permId)) {
            finalPermissionIds.push(permId);
          }
        });
      }

      // Remove existing permissions
      // Note: RolePermission doesn't have companyId, but we've already verified the role belongs to the company
      await tx.rolePermission.deleteMany({
        where: { roleId: id },
      });

      // Add new permissions
      const rolePermissions = finalPermissionIds.map((permissionId) => ({
        roleId: id,
        permissionId,
      }));

      await tx.rolePermission.createMany({
        data: rolePermissions,
      });

      // Immediately revoke sessions for users assigned to this role so they must re-login.
      const usersWithRole = await tx.user.findMany({
        where: { roleId: id, companyId },
        select: { id: true },
      });

      if (usersWithRole.length) {
        await tx.session.deleteMany({
          where: {
            userId: {
              in: usersWithRole.map((user) => user.id),
            },
          },
        });
      }
    });

    return this.findOne(companyId, id) as Promise<RoleResponse>;
  }

  async removePermission(companyId: string, roleId: string, permissionId: string): Promise<void> {
    // Verify the role belongs to the company first
    const role = await this.prisma.role.findUnique({
      where: { id_companyId: { id: roleId, companyId } },
    });

    if (!role) {
      throw new ForbiddenException('Role not found');
    }

    // Delete the role permission using the roleId_permissionId unique constraint
    await this.prisma.rolePermission.delete({
      where: { roleId_permissionId: { roleId, permissionId } },
    });
  }
}
