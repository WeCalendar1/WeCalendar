-- Fix: "Database error saving new user" on signup
-- Run this in Supabase → SQL Editor (do NOT re-run the full init migration)

-- Allow auth to insert the matching profile row
grant usage on schema public to postgres, anon, authenticated, service_role, supabase_auth_admin;

grant select, insert, update on table public.profiles to postgres, service_role, supabase_auth_admin;
grant select, update on table public.profiles to authenticated;

-- Safer profile-on-signup trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      nullif(split_part(coalesce(new.email, ''), '@', 1), '')
    )
  )
  on conflict (id) do update
    set display_name = coalesce(
      excluded.display_name,
      public.profiles.display_name
    );

  return new;
end;
$$;

alter function public.handle_new_user() owner to postgres;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
