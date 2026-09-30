-- Run once in the Supabase SQL Editor. Never expose server sessions via the Data API.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.member_sessions (
  sid varchar not null primary key,
  sess json not null,
  expire timestamp(6) not null
);
create index if not exists member_sessions_expire_idx on private.member_sessions (expire);
alter table private.member_sessions enable row level security;
revoke all on private.member_sessions from public, anon, authenticated;
-- Supabase Auth already persists users in auth.users. Its UUID is the member ID.
-- No password or parallel user database is created here. Notebook records are out of scope.
commit;
