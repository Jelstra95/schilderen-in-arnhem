-- ============================================================================
-- Schilderen in Arnhem — initial schema
-- Run in the Supabase SQL editor (or via `supabase db push`).
-- ============================================================================

-- Extensions ----------------------------------------------------------------
create extension if not exists "pgcrypto";

-- Enums ---------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('admin', 'participant');
exception when duplicate_object then null; end $$;

do $$ begin
  create type course_status as enum ('open', 'closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type enrollment_status as enum ('pending', 'confirmed', 'cancelled');
exception when duplicate_object then null; end $$;

-- Tables --------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role not null default 'participant',
  full_name   text,
  email       text,
  created_at  timestamptz not null default now()
);

create table if not exists public.course_dates (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  location    text,
  capacity    integer not null default 8 check (capacity >= 0),
  status      course_status not null default 'open',
  created_at  timestamptz not null default now()
);

create table if not exists public.enrollments (
  id              uuid primary key default gen_random_uuid(),
  course_date_id  uuid not null references public.course_dates(id) on delete cascade,
  user_id         uuid references public.profiles(id) on delete set null,
  full_name       text not null,
  email           text not null,
  phone           text,
  status          enrollment_status not null default 'pending',
  notes           text,
  created_at      timestamptz not null default now()
);
create index if not exists enrollments_course_date_idx on public.enrollments(course_date_id);
create index if not exists enrollments_user_idx on public.enrollments(user_id);

create table if not exists public.materials (
  id              uuid primary key default gen_random_uuid(),
  course_date_id  uuid references public.course_dates(id) on delete cascade,
  title           text not null,
  storage_path    text not null,
  mime_type       text not null,
  size_bytes      bigint,
  created_at      timestamptz not null default now()
);
create index if not exists materials_course_date_idx on public.materials(course_date_id);

-- Helper: is the current user an admin? (SECURITY DEFINER avoids RLS recursion)
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Availability view: exposes only aggregate counts, never enrollment PII.
create or replace view public.course_dates_availability as
  select
    cd.*,
    coalesce(e.reserved, 0)::int as reserved,
    greatest(cd.capacity - coalesce(e.reserved, 0), 0)::int as available
  from public.course_dates cd
  left join (
    select course_date_id, count(*) as reserved
    from public.enrollments
    where status in ('pending', 'confirmed')
    group by course_date_id
  ) e on e.course_date_id = cd.id;

-- Atomic reservation: locks the date row, checks capacity, inserts a pending
-- enrollment. SECURITY DEFINER so the public can reserve without table access.
create or replace function public.reserve_spot(
  p_course_date_id uuid,
  p_full_name text,
  p_email text,
  p_phone text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity int;
  v_status   course_status;
  v_reserved int;
  v_id       uuid;
begin
  select capacity, status into v_capacity, v_status
  from public.course_dates
  where id = p_course_date_id
  for update;

  if not found then
    raise exception 'COURSE_DATE_NOT_FOUND';
  end if;
  if v_status <> 'open' then
    raise exception 'COURSE_DATE_CLOSED';
  end if;

  select count(*) into v_reserved
  from public.enrollments
  where course_date_id = p_course_date_id
    and status in ('pending', 'confirmed');

  if v_reserved >= v_capacity then
    raise exception 'NO_SPOTS_AVAILABLE';
  end if;

  insert into public.enrollments (course_date_id, full_name, email, phone, status)
  values (p_course_date_id, p_full_name, p_email, p_phone, 'pending')
  returning id into v_id;

  return v_id;
end;
$$;

-- Create a profile automatically when an auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', null),
    'participant'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles     enable row level security;
alter table public.course_dates enable row level security;
alter table public.enrollments  enable row level security;
alter table public.materials    enable row level security;

-- profiles ------------------------------------------------------------------
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

-- course_dates --------------------------------------------------------------
drop policy if exists "course_dates_public_read" on public.course_dates;
create policy "course_dates_public_read" on public.course_dates
  for select using (true);

drop policy if exists "course_dates_admin_write" on public.course_dates;
create policy "course_dates_admin_write" on public.course_dates
  for all using (public.is_admin()) with check (public.is_admin());

-- enrollments ---------------------------------------------------------------
drop policy if exists "enrollments_select_own_or_admin" on public.enrollments;
create policy "enrollments_select_own_or_admin" on public.enrollments
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "enrollments_admin_insert" on public.enrollments;
create policy "enrollments_admin_insert" on public.enrollments
  for insert with check (public.is_admin());

-- Participants may update their own enrollment (used to cancel).
drop policy if exists "enrollments_update_own_or_admin" on public.enrollments;
create policy "enrollments_update_own_or_admin" on public.enrollments
  for update using (user_id = auth.uid() or public.is_admin());

drop policy if exists "enrollments_admin_delete" on public.enrollments;
create policy "enrollments_admin_delete" on public.enrollments
  for delete using (public.is_admin());

-- materials -----------------------------------------------------------------
-- Confirmed participants of the relevant date (or general material) + admins.
drop policy if exists "materials_select_confirmed_or_admin" on public.materials;
create policy "materials_select_confirmed_or_admin" on public.materials
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.enrollments e
      where e.user_id = auth.uid()
        and e.status = 'confirmed'
        and (materials.course_date_id is null or e.course_date_id = materials.course_date_id)
    )
  );

drop policy if exists "materials_admin_write" on public.materials;
create policy "materials_admin_write" on public.materials
  for all using (public.is_admin()) with check (public.is_admin());

-- Grants --------------------------------------------------------------------
grant select on public.course_dates_availability to anon, authenticated;
grant execute on function public.reserve_spot(uuid, text, text, text) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- ============================================================================
-- Private storage bucket for course materials (PDFs / slides).
-- Accessed exclusively through the server with the service-role key, so no
-- public storage policies are granted — the bucket stays fully private.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('course-materials', 'course-materials', false)
on conflict (id) do nothing;

-- ============================================================================
-- After creating your own admin user (via Supabase Auth or the app), promote
-- it once with:
--   update public.profiles set role = 'admin' where email = 'you@example.com';
-- ============================================================================
