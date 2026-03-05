-- ── Users ─────────────────────────────────────────────────

create table public.users (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null unique,
  password   text not null,
  role       text not null default 'SELLER' check (role in ('ADMIN','SELLER')),
  created_at timestamptz not null default now()
);

create unique index idx_users_email on public.users(email);

alter table public.users enable row level security;

-- Only the service role (API backend) can manage users
-- No public access to the users table
create policy "users_service_role_all" on public.users
  for all using (auth.role() = 'service_role');
