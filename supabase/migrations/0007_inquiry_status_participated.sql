-- ============================================================================
-- Schilderen in Arnhem — "participated" status
-- A participant moves from "converted" (aangemeld) to "participated"
-- (deelgenomen) once they have taken part in the course. Placed before
-- 'archived' so the admin list keeps archived people at the bottom.
-- Run in the Supabase SQL editor (or via `supabase db push`), after 0006.
-- ============================================================================

alter type inquiry_status add value if not exists 'participated' before 'archived';
