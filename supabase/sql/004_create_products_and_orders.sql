-- Creates database tables and RLS policies for storefront products and orders.
-- Run this in the Supabase SQL editor after the existing profile scripts.

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

create table if not exists public.products (
  id text primary key,
  name text not null,
  club_or_nation text not null,
  variant text not null,
  season_label text not null,
  year integer not null check (year >= 1900),
  price numeric(10, 2) not null check (price >= 0),
  image_url text,
  image_theme text not null default 'theme-classic',
  era text not null check (era in ('1990s', '2000s', '2010s', 'All eras')),
  league text not null default 'Storefront Collection',
  description text not null default '',
  authenticity text not null default 'Verified',
  condition text not null default 'Excellent',
  status text not null default 'active' check (status in ('active')),
  tags jsonb not null default '[]'::jsonb,
  available_sizes jsonb not null default '["S","M","L","XL"]'::jsonb,
  is_featured boolean not null default false,
  free_shipping boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint products_tags_is_array check (jsonb_typeof(tags) = 'array'),
  constraint products_available_sizes_is_array check (jsonb_typeof(available_sizes) = 'array')
);

create table if not exists public.orders (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  shipping_address text not null,
  items jsonb not null default '[]'::jsonb,
  total numeric(10, 2) not null check (total >= 0),
  payment_status text not null check (payment_status in ('awaiting_approval', 'paid')),
  status text not null check (status in ('pending', 'shipped', 'completed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint orders_items_is_array check (jsonb_typeof(items) = 'array')
);

create index if not exists products_created_at_idx on public.products (created_at desc);
create index if not exists products_year_idx on public.products (year desc);
create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_payment_status_idx on public.orders (payment_status);

create or replace function public.set_products_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.set_orders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row
execute function public.set_products_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row
execute function public.set_orders_updated_at();

alter table public.products enable row level security;
alter table public.orders enable row level security;

drop policy if exists "Anyone can view active products" on public.products;
create policy "Anyone can view active products"
on public.products
for select
to anon, authenticated
using (status = 'active');

drop policy if exists "Admins can insert products" on public.products;
create policy "Admins can insert products"
on public.products
for insert
to authenticated
with check (public.is_admin_user());

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products"
on public.products
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
on public.products
for delete
to authenticated
using (public.is_admin_user());

drop policy if exists "Users can view their own orders" on public.orders;
create policy "Users can view their own orders"
on public.orders
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins can view all orders" on public.orders;
create policy "Admins can view all orders"
on public.orders
for select
to authenticated
using (public.is_admin_user());

drop policy if exists "Users can create their own orders" on public.orders;
create policy "Users can create their own orders"
on public.orders
for insert
to authenticated
with check (
  auth.uid() = user_id
  and payment_status = 'awaiting_approval'
  and status = 'pending'
);

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders"
on public.orders
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Admins can delete orders" on public.orders;
create policy "Admins can delete orders"
on public.orders
for delete
to authenticated
using (public.is_admin_user());

comment on table public.products is 'Storefront jerseys managed from the admin portal.';
comment on table public.orders is 'Customer checkout orders including embedded line items.';
comment on function public.is_admin_user() is 'Returns true when the signed-in user has an active admin profile.';
