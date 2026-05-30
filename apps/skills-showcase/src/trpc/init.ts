import { initTRPC, TRPCError } from '@trpc/server';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { z } from 'zod';
import { SESSION_COOKIE_NAME, verifySessionToken } from './session';

export async function createContext(opts: FetchCreateContextFnOptions) {
  const cookieHeader = opts.req.headers.get('cookie') ?? '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [key, ...rest] = c.trim().split('=');
      return [key, rest.join('=')];
    }),
  );
  const sessionToken = cookies[SESSION_COOKIE_NAME] ?? null;
  const forwardedFor = opts.req.headers.get('x-forwarded-for');
  const ip =
    forwardedFor?.split(',')[0]?.trim() ||
    opts.req.headers.get('x-real-ip')?.trim() ||
    'unknown';
  return { sessionToken, ip, resHeaders: opts.resHeaders };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const secret = process.env.NEWSLETTER_ADMIN_SECRET;
  if (!secret || !ctx.sessionToken || !verifySessionToken(ctx.sessionToken, secret)) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx });
});

export { z };
