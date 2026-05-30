import { neon } from '@neondatabase/serverless';
import type { NewsletterSubscriber } from './schema';

export type { NewsletterSubscriber } from './schema';
export type { SubscriberStatus } from './schema';

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(url);
}

export async function insertSubscriber(
  email: string,
  sourcePage: string,
  consentTextVersion: string,
): Promise<NewsletterSubscriber> {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO newsletter_subscribers (email, source_page, consent_text_version)
    VALUES (${email}, ${sourcePage}, ${consentTextVersion})
    ON CONFLICT (email) DO UPDATE SET
      updated_at = now(),
      status = 'active'
    RETURNING *
  `;
  return rows[0] as NewsletterSubscriber;
}

export async function countRecentSubscribeAttempts(
  ip: string,
  windowMinutes: number,
): Promise<number> {
  const sql = getDb();
  const rows = await sql`
    SELECT count(*)::int AS count
    FROM newsletter_subscribe_attempts
    WHERE ip = ${ip}
      AND created_at >= now() - make_interval(mins => ${windowMinutes})
  `;
  return (rows[0]?.count as number) ?? 0;
}

export async function recordSubscribeAttempt(ip: string): Promise<void> {
  const sql = getDb();
  await sql`
    INSERT INTO newsletter_subscribe_attempts (ip)
    VALUES (${ip})
  `;
}

export async function findSubscriberByEmail(
  email: string,
): Promise<NewsletterSubscriber | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT * FROM newsletter_subscribers WHERE email = ${email}
  `;
  return (rows[0] as NewsletterSubscriber) ?? null;
}

export async function listSubscribers(
  search?: string,
  limit = 50,
  offset = 0,
): Promise<NewsletterSubscriber[]> {
  const sql = getDb();
  if (search) {
    const pattern = `%${search}%`;
    return (await sql`
      SELECT * FROM newsletter_subscribers
      WHERE email ILIKE ${pattern}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `) as NewsletterSubscriber[];
  }
  return (await sql`
    SELECT * FROM newsletter_subscribers
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `) as NewsletterSubscriber[];
}

export async function exportSubscribers(): Promise<NewsletterSubscriber[]> {
  const sql = getDb();
  return (await sql`
    SELECT * FROM newsletter_subscribers
    WHERE status = 'active'
    ORDER BY created_at DESC
  `) as NewsletterSubscriber[];
}
