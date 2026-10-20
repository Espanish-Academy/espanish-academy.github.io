-- Presence: when each student opens the app, how long they stay, and whether they are online now.
-- Only times are stored (never what the student looks at). The student is told about it in "My profile".

create table if not exists public.presence_sessions (
  id uuid primary key,
  user_id uuid not null references public.profiles on delete cascade,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index if not exists presence_user_idx on public.presence_sessions (user_id, started_at desc);
alter table public.presence_sessions enable row level security;
drop policy if exists presence_teacher on public.presence_sessions;
create policy presence_teacher on public.presence_sessions for select to authenticated using (public.is_teacher());
-- No insert/update policies: the app writes only through presence_ping below.

-- The app calls this every ~30 s while it is open and visible. Server time is used, so wrong phone clocks do not matter.
create or replace function public.presence_ping(p_session uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  insert into public.presence_sessions (id, user_id) values (p_session, auth.uid())
  on conflict (id) do update set last_seen_at = now() where presence_sessions.user_id = auth.uid();
end $$;
revoke execute on function public.presence_ping(uuid) from public, anon;
grant execute on function public.presence_ping(uuid) to authenticated;

-- Teacher only: one row per student.
create or replace function public.presence_overview()
returns table (student_id uuid, last_seen_at timestamptz, online boolean, minutes_today int, minutes_week int)
language sql stable security definer set search_path = public as $$
  select p.id,
         max(s.last_seen_at),
         coalesce(max(s.last_seen_at) > now() - interval '90 seconds', false),
         coalesce(round(sum(extract(epoch from (s.last_seen_at - s.started_at)) / 60) filter (where s.started_at >= (date_trunc('day', now() at time zone 'Europe/Madrid') at time zone 'Europe/Madrid')))::int, 0),
         coalesce(round(sum(extract(epoch from (s.last_seen_at - s.started_at)) / 60) filter (where s.started_at >= now() - interval '7 days'))::int, 0)
  from public.profiles p
  left join public.presence_sessions s on s.user_id = p.id
  where p.role = 'student' and public.is_teacher()
  group by p.id
$$;
revoke execute on function public.presence_overview() from public, anon;
grant execute on function public.presence_overview() to authenticated;

-- Teacher only: the latest visits of one student.
create or replace function public.presence_sessions_of(p_student uuid, p_limit int default 12)
returns table (started_at timestamptz, last_seen_at timestamptz, minutes int, ended boolean)
language sql stable security definer set search_path = public as $$
  select s.started_at, s.last_seen_at,
         round(extract(epoch from (s.last_seen_at - s.started_at)) / 60)::int,
         s.last_seen_at < now() - interval '90 seconds'
  from public.presence_sessions s
  where s.user_id = p_student and public.is_teacher()
  order by s.started_at desc
  limit least(coalesce(p_limit, 12), 50)
$$;
revoke execute on function public.presence_sessions_of(uuid, int) from public, anon;
grant execute on function public.presence_sessions_of(uuid, int) to authenticated;

-- Keep three months of history.
do $$ begin perform cron.unschedule('espanish-presence-cleanup'); exception when others then null; end $$;
select cron.schedule('espanish-presence-cleanup', '17 3 * * *', $$delete from public.presence_sessions where started_at < now() - interval '90 days'$$);
