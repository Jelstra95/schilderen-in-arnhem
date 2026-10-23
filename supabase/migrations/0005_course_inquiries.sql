-- ============================================================================
-- Schilderen in Arnhem — course_inquiries
-- Durable record of submissions from the public /inschrijven form.
-- Separate from `enrollments` (which bind to a specific course_date): an
-- inquiry only expresses a day-of-week preference and is converted to an
-- enrollment manually once the owner replies.
-- ============================================================================

do $$ begin
  create type inquiry_status as enum ('new', 'contacted', 'converted', 'archived');
exception when duplicate_object then null; end $$;

create table if not exists public.course_inquiries (
  id             uuid primary key default gen_random_uuid(),
  full_name      text not null,
  email          text not null,
  phone          text,
  day_preference text not null,
  notes          text,
  status         inquiry_status not null default 'new',
  created_at     timestamptz not null default now()
);

create index if not exists course_inquiries_created_at_idx
  on public.course_inquiries(created_at desc);
create index if not exists course_inquiries_status_idx
  on public.course_inquiries(status);

-- RLS: anon cannot read/write directly. The /api/inquiries route inserts via
-- the service-role client (same pattern as /api/admin routes) so we never
-- expose a public write path to the table. Admins can see everything.
alter table public.course_inquiries enable row level security;

drop policy if exists "course_inquiries_admin_all" on public.course_inquiries;
create policy "course_inquiries_admin_all" on public.course_inquiries
  for all using (public.is_admin()) with check (public.is_admin());
