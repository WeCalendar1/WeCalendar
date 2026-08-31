-- Only bump notes.updated_at when title or content changes (not folder moves, pins, etc.)

create or replace function public.set_notes_updated_at_on_content_change()
returns trigger
language plpgsql
as $$
begin
  if new.title is distinct from old.title
     or new.content is distinct from old.content then
    new.updated_at = now();
  else
    new.updated_at = old.updated_at;
  end if;
  return new;
end;
$$;

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_notes_updated_at_on_content_change();
