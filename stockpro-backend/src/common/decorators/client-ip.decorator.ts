import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const clientIp = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();

    // Check for IP in various headers (in order of preference)
    const forwarded = request.headers['x-forwarded-for'];
    const realIp = request.headers['x-real-ip'];
    const cfConnectingIp = request.headers['cf-connecting-ip'];
    const remoteAddress =
      request.connection?.remoteAddress || request.socket?.remoteAddress;

    // If x-forwarded-for exists, get the first IP (client IP)
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    // Check other headers
    if (realIp) {
      return realIp;
    }

    if (cfConnectingIp) {
      return cfConnectingIp;
    }

    // Fallback to connection remote address
    if (remoteAddress) {
      // Remove IPv6 prefix if present
      return remoteAddress.replace(/^::ffff:/, '');
    }

    // Default fallback
    return 'unknown';
  },
);
