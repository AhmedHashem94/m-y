-- Make all existing users ADMIN
update public.users set role = 'ADMIN' where role != 'ADMIN';

-- Update constraint to only allow ADMIN role
alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check check (role = 'ADMIN');

-- Update default
alter table public.users alter column role set default 'ADMIN';
