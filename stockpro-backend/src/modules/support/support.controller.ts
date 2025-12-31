import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateSupportTicketDto } from './dtos/create-support-ticket.dto';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { Auth } from '../../common/decorators/auth.decorator';
import { currentUser } from '../../common/decorators/currentUser.decorator';
import { currentCompany } from '../../common/decorators/company.decorator';
import type { currentUserType } from '../../common/types/current-user.type';

@Controller('support')
@UseGuards(JwtAuthenticationGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('ticket')
  @HttpCode(HttpStatus.OK)
  @Auth() // No specific permissions required - all authenticated users can create support tickets
  async createSupportTicket(
    @currentCompany('id') companyId: string,
    @currentUser() user: currentUserType,
    @Body() createSupportTicketDto: CreateSupportTicketDto,
  ): Promise<{ message: string }> {
    await this.supportService.createSupportTicket(
      companyId,
      user,
      createSupportTicketDto,
    );
    return { message: 'تم إرسال التذكرة بنجاح' };
  }
}

