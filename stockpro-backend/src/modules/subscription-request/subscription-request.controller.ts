import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionRequestService } from './subscription-request.service';
import { CreateSubscriptionRequestDto } from './dtos/request/create-subscription-request.request';
import { UpdateSubscriptionRequestStatusDto } from './dtos/request/update-subscription-request-status.request';
import { SubscriptionRequestResponseDto } from './dtos/response/subscription-request.response';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { Auth } from '../../common/decorators/auth.decorator';
import { SubscriptionRequestStatus } from '@prisma/client';

@Controller('subscription-requests')
export class SubscriptionRequestController {
  constructor(
    private readonly subscriptionRequestService: SubscriptionRequestService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  // Public endpoint - no authentication required
  async create(
    @Body() createDto: CreateSubscriptionRequestDto,
  ): Promise<SubscriptionRequestResponseDto> {
    return this.subscriptionRequestService.create(createDto);
  }

  @Get()
  @UseGuards(JwtAuthenticationGuard)
  @Auth({ permissions: ['subscription:read'] })
  async findAll(
    @Query('status') status?: SubscriptionRequestStatus,
  ): Promise<SubscriptionRequestResponseDto[]> {
    return this.subscriptionRequestService.findAll(status);
  }

  @Get(':id')
  @UseGuards(JwtAuthenticationGuard)
  @Auth({ permissions: ['subscription:read'] })
  async findOne(
    @Param('id') id: string,
  ): Promise<SubscriptionRequestResponseDto> {
    return this.subscriptionRequestService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthenticationGuard)
  @Auth({ permissions: ['subscription:update'] })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateSubscriptionRequestStatusDto,
  ): Promise<SubscriptionRequestResponseDto> {
    return this.subscriptionRequestService.updateStatus(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthenticationGuard)
  @Auth({ permissions: ['subscription:update'] })
  async delete(@Param('id') id: string): Promise<void> {
    return this.subscriptionRequestService.delete(id);
  }
}

