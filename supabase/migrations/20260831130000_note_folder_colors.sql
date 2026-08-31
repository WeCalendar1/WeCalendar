-- Folder color for visual differentiation (Google Drive–style presets)

alter table public.note_folders
  add column if not exists color text not null default '#80868B';
