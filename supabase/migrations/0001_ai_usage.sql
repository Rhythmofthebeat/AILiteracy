-- AI Literacy Academy — usage tracking for the edge function rate limiter.
-- Run automatically via `supabase db push`, or paste into the SQL editor once.

create table if not exists ai_usage (
  user_key text not null,
  day      date not null,
  count    int  not null default 0,
  primary key (user_key, day)
);

-- Only the service role (the ai-tutor edge function) touches this table.
alter table ai_usage enable row level security;
