-- ============================================================================
-- Schilderen in Arnhem — add "taught_on" date to materials
-- Records the date the course/session for a material actually took place.
-- Standalone from course_dates: purely descriptive (display + sorting).
-- Run in the Supabase SQL editor (or via `supabase db push`).
-- ============================================================================

alter table public.materials
  add column if not exists taught_on date;

create index if not exists materials_taught_on_idx on public.materials(taught_on);
