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
  Query,
  Request,
} from '@nestjs/common';
import { InternalTransferService } from './internal-transfer.service';
import { CreateInternalTransferRequest } from './dtos/request/create-internal-transfer.request';
import { UpdateInternalTransferRequest } from './dtos/request/update-internal-transfer.request';
import { InternalTransferResponse } from './dtos/response/internal-transfer.response';
import { Auth } from '../../common/decorators/auth.decorator';
import { currentCompany } from '../../common/decorators/company.decorator';

@Controller('internal-transfers')
export class InternalTransferController {
  constructor(
    private readonly internalTransferService: InternalTransferService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth({ permissions: ['internal_transfers:create'] })
  async createInternalTransfer(
    @Body() createDto: CreateInternalTransferRequest,
    @Request() req: any,
    @currentCompany('id') companyId: string,
  ): Promise<InternalTransferResponse> {
    return this.internalTransferService.createInternalTransfer(
      companyId,
      createDto,
      req.user.id,
    );
  }

  @Get()
  @Auth({ permissions: ['internal_transfers:read'] })
  async findAllInternalTransfers(
    @currentCompany('id') companyId: string,
    @Query('search') search?: string,
  ): Promise<InternalTransferResponse[]> {
    return this.internalTransferService.findAllInternalTransfers(companyId, search);
  }

  @Get(':id')
  @Auth({ permissions: ['internal_transfers:read'] })
  async findOneInternalTransfer(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<InternalTransferResponse> {
    return this.internalTransferService.findOneInternalTransfer(companyId, id);
  }

  @Patch(':id')
  @Auth({ permissions: ['internal_transfers:update'] })
  async updateInternalTransfer(
    @Param('id') id: string,
    @Body() updateDto: UpdateInternalTransferRequest,
    @currentCompany('id') companyId: string,
  ): Promise<InternalTransferResponse> {
    return this.internalTransferService.updateInternalTransfer(companyId, id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['internal_transfers:delete'] })
  async removeInternalTransfer(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<void> {
    return this.internalTransferService.removeInternalTransfer(companyId, id);
  }
}
