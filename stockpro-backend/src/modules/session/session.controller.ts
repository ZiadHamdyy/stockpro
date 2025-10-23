import {
  Controller,
  Get,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { SessionService } from './session.service';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { currentUser } from '../../common/decorators/currentUser.decorator';
import type { currentUserType } from '../../common/types/current-user.type';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import {
  SessionListResponse,
  SessionInfo,
} from './dto/responses/session-list.response';

@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get()
  @UseGuards(JwtAuthenticationGuard)
  @Serialize(SessionListResponse, SessionInfo)
  @HttpCode(HttpStatus.OK)
  async getAllSessions(@currentUser() user: currentUserType) {
    const sessions = await this.sessionService.getAllUserSessions(
      user.id,
      user.session?.id,
    );
    const meta = await this.sessionService.getSessionCount(user.id);

    return {
      success: true,
      message: 'Sessions retrieved successfully',
      data: sessions,
      meta,
    };
  }
}
