-- Public Spanish level check: anyone can submit a result (no account needed); only the teacher can read it.

create table if not exists public.placement_results (
  id uuid primary key,
  name text not null check (char_length(name) between 1 and 80),
  contact text check (char_length(contact) <= 120),
  goal text check (char_length(goal) <= 600),
  answers jsonb not null default '[]' check (pg_column_size(answers) < 20000),
  scores jsonb not null default '[]' check (pg_column_size(scores) < 500),
  level text not null check (level in ('A0', 'A1', 'A2', 'B1')),
  created_at timestamptz not null default now(),
  seen_at timestamptz
);
alter table public.placement_results enable row level security;

drop policy if exists placement_insert on public.placement_results;
create policy placement_insert on public.placement_results for insert to anon, authenticated
  with check (seen_at is null);
drop policy if exists placement_teacher on public.placement_results;
create policy placement_teacher on public.placement_results for all to authenticated
  using (public.is_teacher()) with check (public.is_teacher());

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'placement_results') then
    alter publication supabase_realtime add table public.placement_results;
  end if;
end $$;

-- Tell the teacher straight away.
create or replace function private.on_placement() returns trigger language plpgsql security definer set search_path = public, private as $$
begin perform private.notify('placement', jsonb_build_object('id', new.id)); return new; end $$;
revoke execute on function private.on_placement() from public, anon, authenticated;
drop trigger if exists notify_placement on public.placement_results;
create trigger notify_placement after insert on public.placement_results for each row execute function private.on_placement();
