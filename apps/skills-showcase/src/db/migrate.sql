create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null default 'active',
  source_page text not null,
  consent_text_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists newsletter_subscribers_status_idx
  on newsletter_subscribers (status);

create index if not exists newsletter_subscribers_created_at_idx
  on newsletter_subscribers (created_at desc);

create table if not exists newsletter_subscribe_attempts (
  id bigserial primary key,
  ip text not null,
  created_at timestamptz not null default now()
);

create index if not exists newsletter_subscribe_attempts_ip_created_idx
  on newsletter_subscribe_attempts (ip, created_at);
