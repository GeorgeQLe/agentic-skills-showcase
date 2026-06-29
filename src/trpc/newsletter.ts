/**
 * Newsletter subscription (public) and admin CRUD (protected) endpoints.
 */
import { TRPCError } from '@trpc/server';
import {
  insertSubscriber,
  listSubscribers,
  exportSubscribers,
  countRecentSubscribeAttempts,
  recordSubscribeAttempt,
} from '@/db';
import { router, publicProcedure, protectedProcedure, z } from './init';
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  createSessionToken,
  safeSecretEqual,
} from './session';

// Per-IP sliding window stored in the database rather than in-memory,
// because serverless instances don't share memory across invocations.
const SUBSCRIBE_RATE_LIMIT_WINDOW_MINUTES = 10;
const SUBSCRIBE_RATE_LIMIT_MAX_ATTEMPTS = 5;

export const newsletterRouter = router({
  subscribe: publicProcedure
    .input(
      z.object({
        email: z.email(),
        sourcePage: z.string(),
        consentTextVersion: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const recent = await countRecentSubscribeAttempts(
        ctx.ip,
        SUBSCRIBE_RATE_LIMIT_WINDOW_MINUTES,
      );
      if (recent >= SUBSCRIBE_RATE_LIMIT_MAX_ATTEMPTS) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many subscription attempts. Please try again later.',
        });
      }
      try {
        await recordSubscribeAttempt(ctx.ip);
        await insertSubscriber(input.email, input.sourcePage, input.consentTextVersion);
        return { success: true as const };
      } catch (err) {
        if (err instanceof TRPCError) {
          throw err;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Unable to process subscription. Please try again.',
        });
      }
    }),

  adminLogin: publicProcedure
    .input(z.object({ secret: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const expected = process.env.NEWSLETTER_ADMIN_SECRET;
      if (!expected || !safeSecretEqual(input.secret, expected)) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid secret.' });
      }
      const token = createSessionToken(expected);
      ctx.resHeaders.set(
        'Set-Cookie',
        `${SESSION_COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Strict; Secure; Max-Age=${SESSION_TTL_MS / 1000}`,
      );
      return { success: true as const };
    }),

  adminList: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          limit: z.number().int().min(1).max(200).optional(),
          offset: z.number().int().min(0).optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      return listSubscribers(input?.search, input?.limit, input?.offset);
    }),

  adminExport: protectedProcedure.query(async () => {
    const subscribers = await exportSubscribers();
    const header = 'id,email,status,source_page,consent_text_version,created_at,updated_at';
    const rows = subscribers.map(
      (s) =>
        `${s.id},${csvEscape(s.email)},${s.status},${csvEscape(s.source_page)},${csvEscape(s.consent_text_version)},${s.created_at.toISOString()},${s.updated_at.toISOString()}`,
    );
    return [header, ...rows].join('\n');
  }),
});

// Hand-rolled instead of pulling a CSV library - single-use, three-line
// implementation; a library would be heavier than the function itself.
function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
