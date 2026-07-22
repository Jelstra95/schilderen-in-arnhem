-- ============================================================================
-- Schilderen in Arnhem — participant access period
-- Adds a per-participant membership window (start/end date) + phone to
-- profiles, and switches material visibility from enrollment-based to
-- period-based: a participant sees undated "general" material plus any material
-- whose `taught_on` date falls inside their window. Admins always see all.
-- Run in the Supabase SQL editor (or via `supabase db push`).
-- ============================================================================

alter table public.profiles
  add column if not exists phone            text,
  add column if not exists access_starts_on date,
  add column if not exists access_ends_on   date;

-- Preserve access for participants created before this migration: treat their
-- signup date as their start date. (Open-ended — no end date.) Admins can
-- widen/narrow this afterwards.
update public.profiles
  set access_starts_on = created_at::date
  where role = 'participant' and access_starts_on is null;

-- Material visibility ---------------------------------------------------------
-- Replaces the enrollment-based policy. A row is visible to:
--   • admins (always), or
--   • any signed-in user, when the material is undated (general handouts), or
--   • a participant whose access window contains the material's taught_on date.
drop policy if exists "materials_select_confirmed_or_admin" on public.materials;
drop policy if exists "materials_select_window_or_admin" on public.materials;
create policy "materials_select_window_or_admin" on public.materials
  for select using (
    public.is_admin()
    or (
      auth.uid() is not null
      and (
        materials.taught_on is null
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
            and p.access_starts_on is not null
            and materials.taught_on >= p.access_starts_on
            and (p.access_ends_on is null or materials.taught_on <= p.access_ends_on)
        )
      )
    )
  );
