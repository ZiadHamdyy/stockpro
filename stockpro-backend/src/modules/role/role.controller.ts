import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleRequest } from './dtos/request/create-role.request';
import { UpdateRoleRequest } from './dtos/request/update-role.request';
import { AssignPermissionsRequest } from './dtos/request/assign-permissions.request';
import { RoleResponse } from './dtos/response/role.response';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { Auth } from '../../common/decorators/auth.decorator';
import { currentUser } from '../../common/decorators/currentUser.decorator';
import { currentCompany } from '../../common/decorators/company.decorator';
import type { currentUserType } from '../../common/types/current-user.type';

@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Serialize(RoleResponse)
  @Auth({ permissions: ['permissions:create'] })
  async create(
    @Body() createRoleRequest: CreateRoleRequest,
    @currentCompany('id') companyId: string,
  ): Promise<RoleResponse> {
    return await this.roleService.create(companyId, createRoleRequest);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Serialize(RoleResponse)
  @Auth({ permissions: ['permissions:read'] })
  async findAll(): Promise<RoleResponse[]> {
    return await this.roleService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Serialize(RoleResponse)
  @Auth({ permissions: ['permissions:read'] })
  async findOne(@Param('id') id: string): Promise<RoleResponse | null> {
    return await this.roleService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Serialize(RoleResponse)
  @Auth({ permissions: ['permissions:update'] })
  async update(
    @Param('id') id: string,
    @Body() updateRoleRequest: UpdateRoleRequest,
    @currentUser() user: currentUserType,
  ): Promise<RoleResponse> {
    return await this.roleService.update(id, updateRoleRequest, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['permissions:delete'] })
  async remove(@Param('id') id: string): Promise<void> {
    return await this.roleService.remove(id);
  }

  @Post(':id/permissions')
  @HttpCode(HttpStatus.OK)
  @Serialize(RoleResponse)
  @Auth({ permissions: ['permissions:update'] })
  async assignPermissions(
    @Param('id') id: string,
    @Body() assignPermissionsRequest: AssignPermissionsRequest,
  ): Promise<RoleResponse> {
    return await this.roleService.assignPermissions(
      id,
      assignPermissionsRequest,
    );
  }

  @Delete(':roleId/permissions/:permissionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['permissions:update'] })
  async removePermission(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ): Promise<void> {
    return await this.roleService.removePermission(roleId, permissionId);
  }
}
