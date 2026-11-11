-- ============================================================================
-- Schilderen in Arnhem — "responded" as its own checkbox
-- Whether the owner has replied to someone is tracked separately from their
-- status, so it can be ticked for anyone. The old 'contacted' status becomes
-- 'new' with responded = true. Run in the Supabase SQL editor, after 0007.
-- ============================================================================

alter table public.course_inquiries
  add column if not exists responded boolean not null default false;

update public.course_inquiries
set responded = true
where status in ('contacted', 'converted', 'participated');

update public.course_inquiries
set status = 'new'
where status = 'contacted';
