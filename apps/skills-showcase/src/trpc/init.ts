import { initTRPC, TRPCError } from '@trpc/server';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { z } from 'zod';

export async function createContext(opts: FetchCreateContextFnOptions) {
  const cookieHeader = opts.req.headers.get('cookie') ?? '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [key, ...rest] = c.trim().split('=');
      return [key, rest.join('=')];
    }),
  );
  const sessionToken = cookies['newsletter_admin_session'] ?? null;
  return { sessionToken, resHeaders: opts.resHeaders };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const secret = process.env.NEWSLETTER_ADMIN_SECRET;
  if (!secret || ctx.sessionToken !== secret) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx });
});

export { z };
