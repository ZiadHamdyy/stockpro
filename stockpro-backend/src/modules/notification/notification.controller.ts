import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { Auth } from '../../common/decorators/auth.decorator';
import { currentUser } from '../../common/decorators/currentUser.decorator';
import type { currentUserType } from '../../common/types/current-user.type';

@Controller('notifications')
@UseGuards(JwtAuthenticationGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @Auth() // No specific permissions required - users can only see their own notifications
  findAll(@currentUser() user: currentUserType) {
    return this.notificationService.findAll(user.id);
  }

  @Get('unread-count')
  @Auth() // No specific permissions required - users can only see their own unread count
  getUnreadCount(@currentUser() user: currentUserType) {
    return this.notificationService.getUnreadCount(user.id);
  }

  @Patch(':id/read')
  @Auth() // No specific permissions required - users can only mark their own notifications as read
  markAsRead(@Param('id') id: string, @currentUser() user: currentUserType) {
    return this.notificationService.markAsRead(id, user.id);
  }

  @Patch('read-all')
  @Auth() // No specific permissions required - users can only mark their own notifications as read
  markAllAsRead(@currentUser() user: currentUserType) {
    return this.notificationService.markAllAsRead(user.id);
  }
}


