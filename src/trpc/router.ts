import { router } from './init';
import { newsletterRouter } from './newsletter';

export const appRouter = router({
  newsletter: newsletterRouter,
});

export type AppRouter = typeof appRouter;
