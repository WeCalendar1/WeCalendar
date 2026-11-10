-- =============================================================================
-- WeCalendar — Table Grants for public.calendar_syncs
-- Migration: 20261109160000_calendar_syncs_grants.sql
--
-- Grants SELECT, INSERT, UPDATE, DELETE on public.calendar_syncs to authenticated
-- (relying on the owner-only RLS policies created in 20261108210000_calendar_sync.sql).
-- =============================================================================

revoke all on public.calendar_syncs from public, anon;
grant select, insert, update, delete on public.calendar_syncs to authenticated;

