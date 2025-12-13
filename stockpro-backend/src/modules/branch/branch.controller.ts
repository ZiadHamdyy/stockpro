import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { BranchService } from './branch.service';
import { CreateBranchDto } from './dtos/create-branch.dto';
import { UpdateBranchDto } from './dtos/update-branch.dto';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { currentCompany } from '../../common/decorators/company.decorator';

@Controller('branches')
@UseGuards(JwtAuthenticationGuard)
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Post()
  create(
    @Body() createBranchDto: CreateBranchDto,
    @currentCompany('id') companyId: string,
  ) {
    return this.branchService.create(companyId, createBranchDto);
  }

  @Get()
  findAll(@currentCompany('id') companyId: string) {
    return this.branchService.findAll(companyId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ) {
    return this.branchService.findOne(companyId, id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBranchDto: UpdateBranchDto,
    @currentCompany('id') companyId: string,
  ) {
    return this.branchService.update(companyId, id, updateBranchDto);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ) {
    return this.branchService.remove(companyId, id);
  }
}
