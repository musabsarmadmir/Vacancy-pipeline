create extension if not exists "pgcrypto";

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  unit_number text not null,
  property_name text not null,
  address text not null,
  city text not null check (city in ('Calgary', 'Edmonton')),
  bedrooms smallint not null default 0,
  monthly_rent numeric(10,2) not null,
  status text not null default 'occupied' check (status in ('occupied', 'vacant', 'leased')),
  notice_at timestamptz,
  move_out_at timestamptz,
  listed_at timestamptz,
  first_showing_at timestamptz,
  application_at timestamptz,
  lease_signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists units_property_unit_idx on public.units(property_name, unit_number);
create index if not exists units_city_status_idx on public.units(city, status);
create index if not exists units_move_out_idx on public.units(move_out_at) where move_out_at is not null and lease_signed_at is null;

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists units_updated_at on public.units;
create trigger units_updated_at before update on public.units for each row execute function public.set_updated_at();

alter table public.units enable row level security;
create policy "authenticated users can read units" on public.units for select to authenticated using (true);
create policy "service role manages units" on public.units for all to service_role using (true) with check (true);
