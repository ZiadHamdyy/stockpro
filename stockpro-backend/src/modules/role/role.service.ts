import { Injectable, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateRoleRequest } from './dtos/request/create-role.request';
import { UpdateRoleRequest } from './dtos/request/update-role.request';
import { AssignPermissionsRequest } from './dtos/request/assign-permissions.request';
import { RoleResponse } from './dtos/response/role.response';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(createRoleRequest: CreateRoleRequest): Promise<RoleResponse> {
    const role = await this.prisma.role.create({
      data: createRoleRequest,
    });

    return role;
  }

  async findAll(): Promise<RoleResponse[]> {
    const roles = await this.prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return roles.map(role => ({
      ...role,
      permissions: role.rolePermissions.map((rp) => rp.permission),
    })) as RoleResponse[];
  }

  async findOne(id: string): Promise<RoleResponse | null> {
    const role = await this.prisma.role.findUnique({
      where: { id },
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

  async findOneByName(name: string): Promise<RoleResponse | null> {
    const role = await this.prisma.role.findUnique({
      where: { name },
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
    id: string,
    updateRoleRequest: UpdateRoleRequest,
  ): Promise<RoleResponse> {
    // Check if it's a system role and prevent certain updates
    const existingRole = await this.prisma.role.findUnique({
      where: { id },
    });

    if (existingRole?.isSystem && updateRoleRequest.isSystem === false) {
      throw new ForbiddenException('Cannot modify system role');
    }

    const role = await this.prisma.role.update({
      where: { id },
      data: updateRoleRequest,
    });

    return role;
  }

  async remove(id: string): Promise<void> {
    // Check if it's a system role
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (role?.isSystem) {
      throw new ForbiddenException('Cannot delete system role');
    }

    await this.prisma.role.delete({
      where: { id },
    });
  }

  async assignPermissions(
    id: string,
    assignPermissionsRequest: AssignPermissionsRequest,
  ): Promise<RoleResponse> {
    const { permissionIds } = assignPermissionsRequest;

    // Remove existing permissions
    await this.prisma.rolePermission.deleteMany({
      where: { roleId: id },
    });

    // Add new permissions
    const rolePermissions = permissionIds.map((permissionId) => ({
      roleId: id,
      permissionId,
    }));

    await this.prisma.rolePermission.createMany({
      data: rolePermissions,
    });

    return this.findOne(id) as Promise<RoleResponse>;
  }

  async removePermission(roleId: string, permissionId: string): Promise<void> {
    await this.prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });
  }
}
