import { TRPCError } from '@trpc/server';
import { insertSubscriber, listSubscribers, exportSubscribers } from '@/db';
import { router, publicProcedure, protectedProcedure, z } from './init';
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  createSessionToken,
  safeSecretEqual,
} from './session';

export const newsletterRouter = router({
  subscribe: publicProcedure
    .input(
      z.object({
        email: z.email(),
        sourcePage: z.string(),
        consentTextVersion: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        await insertSubscriber(input.email, input.sourcePage, input.consentTextVersion);
        return { success: true as const };
      } catch {
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

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
