import { Injectable, HttpStatus } from '@nestjs/common';
import { Session, User, SessionStatus } from '@prisma/client';
import { DatabaseService } from '../../configs/database/database.service';
import { GenericHttpException } from '../../common/application/exceptions/generic-http-exception';
import { ERROR_MESSAGES } from '../../common/constants/error-messages.constant';
import { HelperService } from '../../common/utils/helper/helper.service';

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly helperService: HelperService,
  ) {}

  async create(
    user: User,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      // Hash the refresh token before storing (Security Best Practice)
      const hashedRefreshToken =
        await this.helperService.hashPassword(refreshToken);

      return await this.prisma.session.create({
        data: {
          userId: user.id,
          refreshToken: hashedRefreshToken,
          ipAddress: ipAddress || 'unknown',
          userAgent: userAgent || 'unknown',
          status: SessionStatus.ACTIVE,
        },
      });
    } catch (error) {
      throw new GenericHttpException(
        ERROR_MESSAGES.SESSION_CREATE_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(session: Session): Promise<void> {
    try {
      await this.prisma.session.delete({ where: { id: session.id } });
    } catch (error) {
      throw new GenericHttpException(
        ERROR_MESSAGES.SESSION_DELETE_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAllUserSessions(userId: string, currentSessionId?: string) {
    try {
      const sessions = await this.prisma.session.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });

      return sessions.map((session) => ({
        ...session,
        isCurrent: session.id === currentSessionId,
      }));
    } catch (error) {
      throw new GenericHttpException(
        ERROR_MESSAGES.SESSION_RETRIEVE_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getSessionCount(
    userId: string,
  ): Promise<{ total: number; active: number }> {
    try {
      const [total, active] = await Promise.all([
        this.prisma.session.count({
          where: { userId },
        }),
        this.prisma.session.count({
          where: { userId, status: SessionStatus.ACTIVE },
        }),
      ]);

      return { total, active };
    } catch (error) {
      throw new GenericHttpException(
        ERROR_MESSAGES.SESSION_COUNT_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async terminateAllSessions(userId: string): Promise<void> {
    try {
      await this.prisma.session.deleteMany({
        where: { userId },
      });
    } catch (error) {
      throw new GenericHttpException(
        ERROR_MESSAGES.SESSION_TERMINATE_ALL_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findByRefreshToken(
    refreshToken: string,
  ): Promise<(Session & { user: User }) | null> {
    try {
      // Get all active sessions for comparison
      const sessions = await this.prisma.session.findMany({
        where: {
          status: SessionStatus.ACTIVE,
        },
        include: {
          user: true,
        },
      });

      // Compare the provided refresh token with each hashed token
      for (const session of sessions) {
        if (session.refreshToken) {
          const isMatch = await this.helperService.comparePassword(
            refreshToken,
            session.refreshToken,
          );
          if (isMatch) {
            return session;
          }
        }
      }

      return null;
    } catch (error) {
      throw new GenericHttpException(
        ERROR_MESSAGES.SESSION_RETRIEVE_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
