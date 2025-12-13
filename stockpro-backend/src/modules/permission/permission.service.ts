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
    companyId: string,
    createPermissionRequest: CreatePermissionRequest,
  ): Promise<PermissionResponse> {
    const permission = await this.prisma.permission.create({
      data: {
        ...createPermissionRequest,
        companyId,
      },
    });

    return permission;
  }

  async findAll(companyId: string): Promise<PermissionResponse[]> {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
      where: { companyId },
    });

    return permissions;
  }

  async findAllGrouped(companyId: string): Promise<PermissionsGroupedResponse[]> {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
      where: { companyId },
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

  async findOne(companyId: string, id: string): Promise<PermissionResponse | null> {
    const permission = await this.prisma.permission.findUnique({
      where: { id_companyId: { id, companyId } },
    });

    return permission;
  }

  async update(
    companyId: string,
    id: string,
    updatePermissionRequest: UpdatePermissionRequest,
  ): Promise<PermissionResponse> {
    const permission = await this.prisma.permission.update({
      where: { id_companyId: { id, companyId } },
      data: updatePermissionRequest,
    });

    return permission;
  }

  async remove(companyId: string, id: string): Promise<void> {
    await this.prisma.permission.delete({
      where: { id_companyId: { id, companyId } },
    });
  }

  async findByResource(companyId: string, resource: string): Promise<PermissionResponse[]> {
    const permissions = await this.prisma.permission.findMany({
      where: { resource, companyId },
      orderBy: { action: 'asc' },
    });

    return permissions;
  }
}
