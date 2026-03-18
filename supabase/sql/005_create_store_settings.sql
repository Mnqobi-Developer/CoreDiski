alter table public.profiles
add column if not exists is_active boolean not null default true;

update public.profiles
set is_active = true
where is_active is null;

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and coalesce(is_active, true) = true
  );
$$;

create table if not exists public.store_settings (
  id text primary key,
  store_name text not null default 'Core Diski',
  support_email text not null default 'corediski@gmail.com',
  support_phone text not null default '+27 71 000 0000',
  currency text not null default 'ZAR' check (currency in ('ZAR', 'USD', 'EUR', 'GBP')),
  tax_rate numeric(6, 2) not null default 0 check (tax_rate >= 0),
  flat_shipping_rate numeric(10, 2) not null default 75 check (flat_shipping_rate >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 1),
  maintenance_mode boolean not null default false,
  require_newsletter_double_opt_in boolean not null default false,
  send_admin_notifications boolean not null default true,
  last_updated_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references auth.users (id) on delete set null
);

insert into public.store_settings (
  id,
  store_name,
  support_email,
  support_phone,
  currency,
  tax_rate,
  flat_shipping_rate,
  low_stock_threshold,
  maintenance_mode,
  require_newsletter_double_opt_in,
  send_admin_notifications
)
values (
  'core-diski',
  'Core Diski',
  'corediski@gmail.com',
  '+27 71 000 0000',
  'ZAR',
  0,
  75,
  5,
  false,
  false,
  true
)
on conflict (id) do nothing;

create or replace function public.set_store_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists store_settings_set_updated_at on public.store_settings;
create trigger store_settings_set_updated_at
before update on public.store_settings
for each row
execute function public.set_store_settings_updated_at();

grant usage on schema public to anon, authenticated;
grant select on table public.store_settings to anon, authenticated;
grant insert, update on table public.store_settings to authenticated;

alter table public.store_settings enable row level security;

drop policy if exists "Anyone can view store settings" on public.store_settings;
create policy "Anyone can view store settings"
on public.store_settings
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can insert store settings" on public.store_settings;
create policy "Admins can insert store settings"
on public.store_settings
for insert
to authenticated
with check (public.is_admin_user());

drop policy if exists "Admins can update store settings" on public.store_settings;
create policy "Admins can update store settings"
on public.store_settings
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());
