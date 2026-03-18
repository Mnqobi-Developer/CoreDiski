alter table public.profiles
add column if not exists role text not null default 'customer'
check (role in ('admin', 'customer'));

comment on column public.profiles.role is 'Application role used for storefront vs admin portal access.';

update public.profiles
set role = 'customer'
where role is null;

-- Replace the email below with your real admin email(s) before running.
update public.profiles
set role = 'admin'
where email in (
  'replace-with-admin@example.com'
);
