import { get } from 'env-var';
import * as jwt from 'jsonwebtoken';

export interface ResetTokenPayload {
  userId: string;
  organizationId: string;
  type: 'password_reset';
}

export class TokenHelper {
  static generateResetToken(userId: string, organizationId: string): string {
    const payload: ResetTokenPayload = {
      userId,
      organizationId,
      type: 'password_reset',
    };

    return jwt.sign(payload, get('JWT_SECRET').required().asString(), {
      algorithm: 'HS256',
      expiresIn: '1h',
    });
  }

  static verifyResetToken(token: string): ResetTokenPayload {
    try {
      const decoded = jwt.verify(
        token,
        get('JWT_SECRET').required().asString(),
      ) as ResetTokenPayload;

      if (
        !decoded.userId ||
        !decoded.organizationId ||
        decoded.type !== 'password_reset'
      ) {
        throw new Error('Invalid token payload');
      }

      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}
