import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreatePermissionRequest } from './dtos/request/create-permission.request';
import { UpdatePermissionRequest } from './dtos/request/update-permission.request';
import { PermissionResponse } from './dtos/response/permission.response';
import { PermissionsGroupedResponse } from './dtos/response/permissions-grouped.response';

@Injectable()
export class PermissionService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(
    createPermissionRequest: CreatePermissionRequest,
  ): Promise<PermissionResponse> {
    const permission = await this.prisma.permission.create({
      data: createPermissionRequest,
    });

    return permission;
  }

  async findAll(): Promise<PermissionResponse[]> {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });

    return permissions;
  }

  async findAllGrouped(): Promise<PermissionsGroupedResponse[]> {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });

    // Group permissions by resource
    const groupedPermissions = permissions.reduce((acc, permission) => {
      const existingResource = acc.find(
        (group) => group.resource === permission.resource,
      );

      if (existingResource) {
        existingResource.permissions.push(permission);
      } else {
        acc.push({
          resource: permission.resource,
          permissions: [permission],
        });
      }

      return acc;
    }, [] as PermissionsGroupedResponse[]);

    return groupedPermissions;
  }

  async findOne(id: string): Promise<PermissionResponse | null> {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    return permission;
  }

  async update(
    id: string,
    updatePermissionRequest: UpdatePermissionRequest,
  ): Promise<PermissionResponse> {
    const permission = await this.prisma.permission.update({
      where: { id },
      data: updatePermissionRequest,
    });

    return permission;
  }

  async remove(id: string): Promise<void> {
    await this.prisma.permission.delete({
      where: { id },
    });
  }

  async findByResource(resource: string): Promise<PermissionResponse[]> {
    const permissions = await this.prisma.permission.findMany({
      where: { resource },
      orderBy: { action: 'asc' },
    });

    return permissions;
  }
}
