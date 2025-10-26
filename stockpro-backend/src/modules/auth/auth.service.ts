import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { SignupRequest } from './dtos/request/signup.request';
import { TokenPayload } from '../../common/types/auth-token-payload.type';
import { HelperService } from '../../common/utils/helper/helper.service';
import { DatabaseService } from '../../configs/database/database.service';
import { Session, User } from '@prisma/client';
import { GenericHttpException } from '../../common/application/exceptions/generic-http-exception';
import { ERROR_MESSAGES, TOKEN_CONSTANTS } from '../../common/constants';
import { SessionService } from '../session/session.service';
import { EmailService } from '../../common/services/email.service';
import { ForgotPasswordRequest } from './dtos/request/forgot-password.request';
import { VerifyForgotPasswordRequest } from './dtos/request/verify-forgot-password.request';
import { ResetPasswordRequest } from './dtos/request/reset-password.request';
import { UpdatePasswordRequest } from './dtos/request/update-password.request';
import type { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly helperService: HelperService,
    private readonly prisma: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
    private readonly emailService: EmailService,
  ) {}

  async signup(request: SignupRequest) {
    const { email, password, name, image } = request;
    await this.userService.errorIfUserExists(email);

    // Get the first available branch (or create a default one if none exists)
    let branch = await this.prisma.branch.findFirst();
    if (!branch) {
      branch = await this.prisma.branch.create({
        data: {
          name: 'Default Branch',
          address: 'Default Address',
          phone: 'Default Phone',
          description: 'Default branch for new users',
        },
      });
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        password: await this.helperService.hashPassword(password),
        name: name || email.split('@')[0],
        image,
        active: true,
        emailVerified: false, // Set to false - requires email verification
        branchId: branch.id,
      },
    });

    // Generate email verification OTP
    const otp = Math.floor(
      TOKEN_CONSTANTS.OTP.MIN_VALUE +
        Math.random() *
          (TOKEN_CONSTANTS.OTP.MAX_VALUE - TOKEN_CONSTANTS.OTP.MIN_VALUE + 1),
    ).toString();
    const otpHash = await this.helperService.hashPassword(otp);
    const otpExpiresAt = new Date(
      Date.now() + TOKEN_CONSTANTS.OTP.EXPIRES_IN_MS,
    );

    // Create email verification OTP record
    await this.prisma.otp.create({
      data: {
        userId: user.id,
        otpHash,
        otpExpiresAt,
        otpVerified: false,
        type: 'EMAIL_VERIFICATION',
      },
    });

    // Send email verification OTP
    await this.emailService.sendEmailVerificationOtp(
      email,
      otp,
      TOKEN_CONSTANTS.OTP.EXPIRES_IN_MINUTES,
    );

    return user;
  }

  async validateUser(email: string, password: string) {
    // Find user without throwing errors to prevent info leakage
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    // Return generic error for all cases: not found, inactive, no password, wrong password
    if (!user || !user.active || !user.password) {
      throw new GenericHttpException(
        ERROR_MESSAGES.INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Verify password
    const isPasswordValid = await this.helperService.comparePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new GenericHttpException(
        ERROR_MESSAGES.INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Format user with permissions
    return {
      ...user,
      permissions: user.role?.rolePermissions?.map((rp) => rp.permission) || [],
    };
  }

  async login(user: User, ipAddress?: string, userAgent?: string) {
    // Check if user already has an active session with the same IP and user agent
    if (ipAddress && userAgent) {
      const existingSession = await this.prisma.session.findFirst({
        where: {
          userId: user.id,
          ipAddress: ipAddress,
          userAgent: userAgent,
          status: 'ACTIVE',
        },
      });

      if (existingSession) {
        // Delete the existing session and create a new one
        await this.prisma.session.delete({
          where: { id: existingSession.id },
        });
      }
    }

    // Generate refresh token first
    const refreshToken = this.generateRefreshToken({
      userId: user.id,
      sessionId: 'temp', // Will be replaced after session creation
    });

    // Create session with refresh token (hashed in DB)
    const session = await this.sessionService.create(
      user,
      refreshToken,
      ipAddress,
      userAgent,
    );

    // Return tokens and user (refreshToken for cookie, accessToken for response)
    return await this.appendAuthTokenToResponse(user, session, refreshToken);
  }

  async loginWithCookie(
    user: User,
    ipAddress: string,
    userAgent: string,
    response: Response,
  ) {
    const result = await this.login(user, ipAddress, userAgent);

    // Set HttpOnly cookie for refresh token
    this.setRefreshTokenCookie(response, result.refreshToken);

    return result;
  }

  async appendAuthTokenToResponse(
    user: User & { permissions?: any[] },
    session: Session,
    refreshToken: string,
  ) {
    const accessToken = this.generateAccessToken({
      userId: user.id,
      sessionId: session.id,
    });

    // Load user with role and permissions
    const userWithRole = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        branch: true,
      },
    });

    // Format permissions array for response
    const formattedUser = userWithRole
      ? {
          ...userWithRole,
          role: userWithRole.role
            ? {
                ...userWithRole.role,
                permissions:
                  userWithRole.role.rolePermissions?.map(
                    (rp) => rp.permission,
                  ) || [],
              }
            : null,
        }
      : user;

    // Return both tokens internally - controller will use refreshToken for cookie
    // Serializer will only expose accessToken and user in response body
    return {
      user: formattedUser,
      accessToken,
      refreshToken, // For HttpOnly cookie only (not serialized in response)
    };
  }

  private generateAccessToken(payload: TokenPayload): string {
    return this.jwtService.sign(payload, {
      expiresIn: TOKEN_CONSTANTS.ACCESS_TOKEN.EXPIRES_IN,
    });
  }

  private generateRefreshToken(payload: TokenPayload): string {
    return this.jwtService.sign(payload, {
      expiresIn: TOKEN_CONSTANTS.REFRESH_TOKEN.EXPIRES_IN,
    });
  }

  async refreshTokens(refreshToken: string) {
    try {
      // Verify the refresh token (already verified by guard, but verify again for security)
      const payload = this.jwtService.verify<TokenPayload>(refreshToken);

      // Find the session with this refresh token
      const session =
        await this.sessionService.findByRefreshToken(refreshToken);

      if (!session || session.userId !== payload.userId) {
        // If session not found or user ID doesn't match, delete the session
        if (session) {
          await this.sessionService.remove(session);
        }
        throw new GenericHttpException(
          ERROR_MESSAGES.INVALID_REFRESH_TOKEN,
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Check if user is still active
      if (!session.user.active) {
        // If user is blocked, delete the session
        await this.sessionService.remove(session);
        throw new GenericHttpException(
          ERROR_MESSAGES.USER_BLOCKED,
          HttpStatus.FORBIDDEN,
        );
      }

      // Generate ONLY new access token (refresh token remains the same)
      const newAccessToken = this.generateAccessToken({
        userId: session.userId,
        sessionId: session.id,
      });

      // Return only the new access token
      // Refresh token stays the same and doesn't need to be updated in DB
      return {
        accessToken: newAccessToken,
      };
    } catch (error) {
      if (error instanceof GenericHttpException) {
        throw error;
      }
      throw new GenericHttpException(
        ERROR_MESSAGES.TOKEN_REFRESH_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async refreshTokensWithCookie(refreshToken: string, response: Response) {
    try {
      const result = await this.refreshTokens(refreshToken);

      // No need to update the refresh token cookie since it remains the same
      // The refresh token stays valid until it expires or user logs out

      return result;
    } catch (error) {
      // If refresh fails (e.g., expired token), clear the refresh token cookie
      this.clearRefreshTokenCookie(response);
      throw error;
    }
  }

  async logout(user: User, sessionId?: string) {
    try {
      if (sessionId) {
        // Delete specific session
        await this.prisma.session.delete({
          where: { id: sessionId, userId: user.id },
        });
      } else {
        // Delete all sessions for the user (sign out from all devices)
        await this.prisma.session.deleteMany({
          where: { userId: user.id },
        });
      }

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch {
      throw new GenericHttpException(
        ERROR_MESSAGES.LOGOUT_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async logoutWithCookie(
    user: User,
    sessionId: string | undefined,
    response: Response,
  ) {
    const result = await this.logout(user, sessionId);

    // Clear refresh token cookie
    this.clearRefreshTokenCookie(response);

    return result;
  }

  async logoutAllWithCookie(user: User, response: Response) {
    const result = await this.logout(user);

    // Clear refresh token cookie
    this.clearRefreshTokenCookie(response);

    return result;
  }

  // Public helper methods for cookie management
  setRefreshTokenCookie(response: Response, refreshToken: string): void {
    response.cookie(TOKEN_CONSTANTS.COOKIE.REFRESH_TOKEN_NAME, refreshToken, {
      httpOnly: TOKEN_CONSTANTS.COOKIE.HTTP_ONLY,
      secure: TOKEN_CONSTANTS.COOKIE.SECURE,
      sameSite: TOKEN_CONSTANTS.COOKIE.SAME_SITE,
      // No maxAge - persistent cookie (no expiration)
      path: TOKEN_CONSTANTS.COOKIE.PATH,
    });
  }

  private clearRefreshTokenCookie(response: Response): void {
    response.clearCookie(TOKEN_CONSTANTS.COOKIE.REFRESH_TOKEN_NAME);
  }

  // Password Recovery Methods
  async forgotPassword(request: ForgotPasswordRequest) {
    const { email } = request;

    try {
      // Find user by email (silently fail if not found to prevent email enumeration)
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      // Always return success message even if user not found (security best practice)
      if (!user) {
        return {
          success: true,
          message: ERROR_MESSAGES.OTP_SENT_SUCCESS,
        };
      }

      // Generate 6-digit OTP
      const otp = Math.floor(
        TOKEN_CONSTANTS.OTP.MIN_VALUE +
          Math.random() *
            (TOKEN_CONSTANTS.OTP.MAX_VALUE - TOKEN_CONSTANTS.OTP.MIN_VALUE + 1),
      ).toString();

      // Hash OTP
      const otpHash = await this.helperService.hashPassword(otp);

      // Set expiration time (10 minutes from now)
      const otpExpiresAt = new Date(
        Date.now() + TOKEN_CONSTANTS.OTP.EXPIRES_IN_MS,
      );

      // Delete any existing OTP records for this user
      await this.prisma.otp.deleteMany({
        where: { userId: user.id },
      });

      // Create new OTP record
      await this.prisma.otp.create({
        data: {
          userId: user.id,
          otpHash,
          otpExpiresAt,
          otpVerified: false,
          type: 'PASSWORD_RESET',
        },
      });

      // Send OTP email
      await this.emailService.sendOtpEmail(
        email,
        otp,
        TOKEN_CONSTANTS.OTP.EXPIRES_IN_MINUTES,
      );

      return {
        success: true,
        message: ERROR_MESSAGES.OTP_SENT_SUCCESS,
      };
    } catch (error) {
      // Log error but return generic success message to prevent email enumeration
      console.error('Forgot password error:', error);
      return {
        success: true,
        message: ERROR_MESSAGES.OTP_SENT_SUCCESS,
      };
    }
  }

  async verifyForgotPassword(request: VerifyForgotPasswordRequest) {
    const { email, otp } = request;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // If user not found
    if (!user) {
      throw new GenericHttpException(
        ERROR_MESSAGES.INVALID_OR_EXPIRED_OTP,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Find the most recent OTP record for this user
    const otpRecord = await this.prisma.otp.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    // If no OTP record found
    if (!otpRecord) {
      throw new GenericHttpException(
        ERROR_MESSAGES.INVALID_OR_EXPIRED_OTP,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check if OTP expired
    if (new Date() > otpRecord.otpExpiresAt) {
      // Delete expired OTP record
      await this.prisma.otp.delete({
        where: { id: otpRecord.id },
      });

      throw new GenericHttpException(
        ERROR_MESSAGES.INVALID_OR_EXPIRED_OTP,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Verify OTP
    const isOtpValid = await this.helperService.comparePassword(
      otp,
      otpRecord.otpHash,
    );

    if (!isOtpValid) {
      throw new GenericHttpException(
        ERROR_MESSAGES.INVALID_OR_EXPIRED_OTP,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Mark OTP as verified
    await this.prisma.otp.update({
      where: { id: otpRecord.id },
      data: {
        otpVerified: true,
      },
    });

    return {
      success: true,
      message: ERROR_MESSAGES.OTP_VERIFIED_SUCCESS,
    };
  }

  async resetPassword(request: ResetPasswordRequest) {
    const { email, newPassword } = request;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // If user not found
    if (!user) {
      throw new GenericHttpException(
        ERROR_MESSAGES.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    // Find the most recent OTP record for this user
    const otpRecord = await this.prisma.otp.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    // Check if OTP record exists
    if (!otpRecord) {
      throw new GenericHttpException(
        ERROR_MESSAGES.OTP_NOT_VERIFIED,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check if OTP was verified
    if (!otpRecord.otpVerified) {
      throw new GenericHttpException(
        ERROR_MESSAGES.OTP_NOT_VERIFIED,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check if OTP expired
    if (new Date() > otpRecord.otpExpiresAt) {
      // Delete expired OTP record
      await this.prisma.otp.delete({
        where: { id: otpRecord.id },
      });

      throw new GenericHttpException(
        ERROR_MESSAGES.INVALID_OR_EXPIRED_OTP,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Hash new password
    const hashedPassword = await this.helperService.hashPassword(newPassword);

    // Update password
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    // Delete the used OTP record
    await this.prisma.otp.delete({
      where: { id: otpRecord.id },
    });

    // Optional: Invalidate all existing sessions for security
    await this.prisma.session.deleteMany({
      where: { userId: user.id },
    });

    return {
      success: true,
      message: ERROR_MESSAGES.PASSWORD_RESET_SUCCESS,
    };
  }

  async updatePassword(user: User, request: UpdatePasswordRequest) {
    const { oldPassword, newPassword } = request;

    try {
      // Check if user has a password (should always be true for logged-in users)
      if (!user.password) {
        throw new GenericHttpException(
          ERROR_MESSAGES.USER_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      // Verify old password
      const isOldPasswordValid = await this.helperService.comparePassword(
        oldPassword,
        user.password,
      );

      if (!isOldPasswordValid) {
        throw new GenericHttpException(
          ERROR_MESSAGES.OLD_PASSWORD_INCORRECT,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check if new password is different from old password
      if (oldPassword === newPassword) {
        throw new GenericHttpException(
          ERROR_MESSAGES.NEW_PASSWORD_SAME_AS_OLD,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Hash new password
      const hashedNewPassword =
        await this.helperService.hashPassword(newPassword);

      // Update password
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedNewPassword,
        },
      });

      // Optional: Invalidate all existing sessions for security
      // This forces the user to log in again with the new password
      await this.prisma.session.deleteMany({
        where: { userId: user.id },
      });

      return {
        success: true,
        message: ERROR_MESSAGES.PASSWORD_UPDATE_SUCCESS,
      };
    } catch (error) {
      if (error instanceof GenericHttpException) {
        throw error;
      }
      throw new GenericHttpException(
        ERROR_MESSAGES.PASSWORD_UPDATE_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Email Verification Methods
  async resendVerificationCode(request: { email: string }) {
    const { email } = request;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // If user not found
    if (!user) {
      throw new GenericHttpException(
        ERROR_MESSAGES.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if email is already verified
    if (user.emailVerified) {
      throw new GenericHttpException(
        ERROR_MESSAGES.EMAIL_ALREADY_VERIFIED,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Delete any existing email verification OTP records for this user
    await this.prisma.otp.deleteMany({
      where: {
        userId: user.id,
        type: 'EMAIL_VERIFICATION',
      },
    });

    // Generate new email verification OTP
    const otp = Math.floor(
      TOKEN_CONSTANTS.OTP.MIN_VALUE +
        Math.random() *
          (TOKEN_CONSTANTS.OTP.MAX_VALUE - TOKEN_CONSTANTS.OTP.MIN_VALUE + 1),
    ).toString();
    const otpHash = await this.helperService.hashPassword(otp);
    const otpExpiresAt = new Date(
      Date.now() + TOKEN_CONSTANTS.OTP.EXPIRES_IN_MS,
    );

    // Create new email verification OTP record
    await this.prisma.otp.create({
      data: {
        userId: user.id,
        otpHash,
        otpExpiresAt,
        otpVerified: false,
        type: 'EMAIL_VERIFICATION',
      },
    });

    // Send email verification OTP
    await this.emailService.sendEmailVerificationOtp(
      email,
      otp,
      TOKEN_CONSTANTS.OTP.EXPIRES_IN_MINUTES,
    );

    return {
      success: true,
      message: ERROR_MESSAGES.VERIFICATION_CODE_RESENT,
    };
  }

  async resendForgotPasswordCode(request: { email: string }) {
    const { email } = request;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // If user not found
    if (!user) {
      throw new GenericHttpException(
        ERROR_MESSAGES.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    // Delete any existing password reset OTP records for this user
    await this.prisma.otp.deleteMany({
      where: {
        userId: user.id,
        type: 'PASSWORD_RESET',
      },
    });

    // Generate new password reset OTP
    const otp = Math.floor(
      TOKEN_CONSTANTS.OTP.MIN_VALUE +
        Math.random() *
          (TOKEN_CONSTANTS.OTP.MAX_VALUE - TOKEN_CONSTANTS.OTP.MIN_VALUE + 1),
    ).toString();
    const otpHash = await this.helperService.hashPassword(otp);
    const otpExpiresAt = new Date(
      Date.now() + TOKEN_CONSTANTS.OTP.EXPIRES_IN_MS,
    );

    // Create new password reset OTP record
    await this.prisma.otp.create({
      data: {
        userId: user.id,
        otpHash,
        otpExpiresAt,
        otpVerified: false,
        type: 'PASSWORD_RESET',
      },
    });

    // Send password reset OTP
    await this.emailService.sendOtpEmail(
      email,
      otp,
      TOKEN_CONSTANTS.OTP.EXPIRES_IN_MINUTES,
    );

    return {
      success: true,
      message: ERROR_MESSAGES.FORGOT_PASSWORD_CODE_RESENT,
    };
  }

  async verifyEmail(
    request: { email: string; otp: string },
    ipAddress?: string,
    userAgent?: string,
    response?: any,
  ) {
    const { email, otp } = request;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // If user not found
    if (!user) {
      throw new GenericHttpException(
        ERROR_MESSAGES.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return { user };
    }

    // Find the most recent email verification OTP record for this user
    const otpRecord = await this.prisma.otp.findFirst({
      where: {
        userId: user.id,
        type: 'EMAIL_VERIFICATION',
        otpVerified: false, // Ensure OTP hasn't been used already
      },
      orderBy: { createdAt: 'desc' },
    });

    // If no OTP record found
    if (!otpRecord) {
      throw new GenericHttpException(
        ERROR_MESSAGES.INVALID_OR_EXPIRED_OTP,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check if OTP expired
    if (new Date() > otpRecord.otpExpiresAt) {
      // Delete expired OTP record
      await this.prisma.otp.delete({
        where: { id: otpRecord.id },
      });

      throw new GenericHttpException(
        ERROR_MESSAGES.INVALID_OR_EXPIRED_OTP,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Verify OTP
    const isOtpValid = await this.helperService.comparePassword(
      otp,
      otpRecord.otpHash,
    );

    if (!isOtpValid) {
      throw new GenericHttpException(
        ERROR_MESSAGES.INVALID_OR_EXPIRED_OTP,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Mark email as verified and delete the OTP record in a transaction
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
      },
    });

    // Delete the OTP record immediately after verification
    await this.prisma.otp.delete({
      where: { id: otpRecord.id },
    });

    // Create session and log user in
    if (ipAddress && userAgent) {
      return await this.loginWithCookie(
        updatedUser,
        ipAddress,
        userAgent,
        response,
      );
    }

    // If no session creation, return user without tokens (same as login structure)
    return {
      user: updatedUser,
    };
  }
}
