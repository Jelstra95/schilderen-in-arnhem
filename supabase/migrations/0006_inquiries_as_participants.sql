-- ============================================================================
-- Schilderen in Arnhem — one list for inquiries and participants
-- An inquiry row now follows a person all the way through: from the public
-- /inschrijven form to a participant with an account. It gains a link to the
-- participant's profile and a private notes field for the owner (payment
-- agreements and the like). Existing participant accounts are linked to their
-- inquiry, or get one, so everyone shows up in the single admin overview.
-- Run in the Supabase SQL editor (or via `supabase db push`).
-- ============================================================================

alter table public.course_inquiries
  add column if not exists user_id     uuid references public.profiles(id) on delete set null,
  add column if not exists admin_notes text;

-- Participants added by hand may not have a day preference.
alter table public.course_inquiries alter column day_preference drop not null;

-- One inquiry per participant account.
create unique index if not exists course_inquiries_user_id_key
  on public.course_inquiries(user_id) where user_id is not null;

-- Link each existing participant to their most recent inquiry with the same
-- email address, and mark that inquiry as converted.
update public.course_inquiries ci
set user_id = p.id, status = 'converted'
from public.profiles p
where p.role = 'participant'
  and p.email is not null
  and ci.user_id is null
  and ci.id = (
    select c2.id from public.course_inquiries c2
    where lower(c2.email) = lower(p.email)
    order by c2.created_at desc
    limit 1
  )
  and not exists (
    select 1 from public.course_inquiries c3 where c3.user_id = p.id
  );

-- Participants without any inquiry get one, so they appear in the overview.
insert into public.course_inquiries
  (full_name, email, phone, day_preference, status, user_id, created_at)
select
  coalesce(nullif(p.full_name, ''), p.email, ''),
  coalesce(p.email, ''),
  p.phone,
  null,
  'converted',
  p.id,
  p.created_at
from public.profiles p
where p.role = 'participant'
  and not exists (
    select 1 from public.course_inquiries ci where ci.user_id = p.id
  );
