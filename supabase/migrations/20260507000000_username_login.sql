-- Switch login identifier from email to username, reset to a single admin user (mariam)

delete from public.users;

drop index if exists public.idx_users_email;

alter table public.users add column if not exists username text;
alter table public.users drop column if exists email;
alter table public.users alter column username set not null;

create unique index idx_users_username on public.users(username);

-- Seed the only admin account; password "447700" hashed with Node bcrypt ($2b$10)
insert into public.users (name, username, password, role)
values (
  'Mariam',
  'mariam',
  '$2b$10$w0Wjis03LBhrehQ8ktIG0.H9JX2anbufvBXA4O0S2uodKlAOJtUVu',
  'ADMIN'
);
