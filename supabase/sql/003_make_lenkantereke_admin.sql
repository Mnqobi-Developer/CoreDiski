alter table public.profiles
add column if not exists role text not null default 'customer'
check (role in ('admin', 'customer'));

update public.profiles
set role = 'admin'
where lower(email) = lower('Lenkantereke25@gmail.com');

update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where lower(email) = lower('Lenkantereke25@gmail.com');
