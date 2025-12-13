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
import { PermissionService } from './permission.service';
import { CreatePermissionRequest } from './dtos/request/create-permission.request';
import { UpdatePermissionRequest } from './dtos/request/update-permission.request';
import { PermissionResponse } from './dtos/response/permission.response';
import { PermissionsGroupedResponse } from './dtos/response/permissions-grouped.response';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { Auth } from '../../common/decorators/auth.decorator';
import { currentCompany } from '../../common/decorators/company.decorator';

@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Serialize(PermissionResponse)
  @Auth({ permissions: ['permissions:create'] })
  async create(
    @Body() createPermissionRequest: CreatePermissionRequest,
    @currentCompany('id') companyId: string,
  ): Promise<PermissionResponse> {
    return await this.permissionService.create(companyId, createPermissionRequest);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Serialize(PermissionResponse)
  @Auth({ permissions: ['permissions:read'] })
  async findAll(@currentCompany('id') companyId: string): Promise<PermissionResponse[]> {
    return await this.permissionService.findAll(companyId);
  }

  @Get('grouped')
  @HttpCode(HttpStatus.OK)
  @Serialize(PermissionsGroupedResponse)
  @Auth({ permissions: ['permissions:read'] })
  async findAllGrouped(@currentCompany('id') companyId: string): Promise<PermissionsGroupedResponse[]> {
    return await this.permissionService.findAllGrouped(companyId);
  }

  @Get('resource/:resource')
  @HttpCode(HttpStatus.OK)
  @Serialize(PermissionResponse)
  @Auth({ permissions: ['permissions:read'] })
  async findByResource(
    @Param('resource') resource: string,
    @currentCompany('id') companyId: string,
  ): Promise<PermissionResponse[]> {
    return await this.permissionService.findByResource(companyId, resource);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Serialize(PermissionResponse)
  @Auth({ permissions: ['permissions:read'] })
  async findOne(@Param('id') id: string, @currentCompany('id') companyId: string): Promise<PermissionResponse | null> {
    return await this.permissionService.findOne(companyId, id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Serialize(PermissionResponse)
  @Auth({ permissions: ['permissions:update'] })
  async update(
    @Param('id') id: string,
    @Body() updatePermissionRequest: UpdatePermissionRequest,
    @currentCompany('id') companyId: string,
  ): Promise<PermissionResponse> {
    return await this.permissionService.update(companyId, id, updatePermissionRequest);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['permissions:delete'] })
  async remove(@Param('id') id: string, @currentCompany('id') companyId: string): Promise<void> {
    return await this.permissionService.remove(companyId, id);
  }
}
