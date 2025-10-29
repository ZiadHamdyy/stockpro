import {
  Body,
  Controller,
  Delete,
  Get,
  Query,
  Patch,
  Param,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { UserIdResponse, UserResponse } from './dtos/response/user.response';
import { CheckEmailResponse } from './dtos/response/check-email.response';
import { UserListFilterInput } from './dtos/request/user-filter.input';
import { CheckEmailRequest } from './dtos/request/check-email.request';
import { CreateUserRequest } from './dtos/request/create-user.request';
import { UpdateUserRequest } from './dtos/request/update-user.request';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { currentUser } from '../../common/decorators/currentUser.decorator';
import type { currentUserType } from '../../common/types/current-user.type';

@Controller('users')
@UseGuards(JwtAuthenticationGuard) // Protect all endpoints by default
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAllUsers(@Query() filters: UserListFilterInput) {
    return await this.userService.getAllUsers(filters);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Serialize(UserResponse)
  async createUser(@Body() data: CreateUserRequest) {
    return await this.userService.createUser(data);
  }

  // @Get('by-email')
  // @Serialize(UserIdResponse)
  // async getUserIdByEmail(@Query('email') email: string) {
  //   return await this.userService.getVerifiedUserIdByEmail(email);
  // }

  @Patch(':id/toggle-activity')
  @HttpCode(HttpStatus.OK)
  @Serialize(UserResponse)
  async toggleUserActivity(
    @Param('id') userId: string,
    @currentUser() currentUser: currentUserType,
  ) {
    return await this.userService.toggleUserActivity(userId, currentUser.id);
  }

  @Get(':id')
  @Serialize(UserResponse)
  async getUserById(@Param('id') userId: string) {
    return await this.userService.getUserById(userId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Serialize(UserResponse)
  async updateUser(
    @Param('id') userId: string,
    @Body() data: UpdateUserRequest,
  ) {
    return await this.userService.updateUser(userId, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id') userId: string) {
    return await this.userService.deleteUser(userId);
  }

  @Get(':id/permissions')
  @HttpCode(HttpStatus.OK)
  async getUserPermissions(@Param('id') userId: string) {
    return await this.userService.getUserPermissions(userId);
  }

  // @Post('check-email')
  // @HttpCode(HttpStatus.OK)
  // @Serialize(CheckEmailResponse)
  // async checkEmail(@Body() data: CheckEmailRequest) {
  //   return await this.userService.checkEmail(data.email);
  // }
}
