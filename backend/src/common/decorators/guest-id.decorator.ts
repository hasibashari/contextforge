import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Parameter decorator to extract and sanitize `X-Guest-Id` from HTTP headers.
 * Returns a valid UUID string, or undefined if missing/invalid.
 */
export const GuestId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const rawGuestId =
      request.headers['x-guest-id'] ||
      (request.query?.guestId as string | undefined);

    if (typeof rawGuestId === 'string' && UUID_REGEX.test(rawGuestId.trim())) {
      return rawGuestId.trim();
    }

    return undefined;
  },
);
