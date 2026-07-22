-- ============================================================================
-- Schilderen in Arnhem — material thumbnails
-- Stores the storage path of a small preview image (rendered from the PDF's
-- second slide on upload) so student tiles load a lightweight thumbnail instead
-- of fetching and rendering the whole slide deck.
-- Run in the Supabase SQL editor (or via `supabase db push`).
-- ============================================================================

alter table public.materials
  add column if not exists thumbnail_path text;
