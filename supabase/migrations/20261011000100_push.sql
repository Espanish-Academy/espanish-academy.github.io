-- Push notifications: device subscriptions, server-side triggers and scheduled reminders.

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- One row per device that agreed to receive notifications.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
drop policy if exists push_own on public.push_subscriptions;
create policy push_own on public.push_subscriptions for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Reminder bookkeeping so nobody is notified twice.
alter table public.lessons add column if not exists reminded_day boolean not null default false;
alter table public.lessons add column if not exists reminded_hour boolean not null default false;
alter table public.tasks add column if not exists due_reminded boolean not null default false;

-- Private config (function URL + shared secret). The `private` schema is not exposed through the API.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.config (key text primary key, value text not null);

create or replace function private.notify(kind text, payload jsonb) returns void
language plpgsql security definer set search_path = public, private as $$
declare fn_url text; secret text;
begin
  select value into fn_url from private.config where key = 'notify_url';
  select value into secret from private.config where key = 'notify_secret';
  if fn_url is null or secret is null then return; end if;
  perform net.http_post(
    url := fn_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-notify-secret', secret),
    body := jsonb_build_object('kind', kind) || payload
  );
exception when others then
  null; -- a failed notification must never block saving a message or a task
end $$;

create or replace function private.on_message() returns trigger language plpgsql security definer set search_path = public, private as $$
begin perform private.notify('message', jsonb_build_object('id', new.id)); return new; end $$;
create or replace function private.on_task() returns trigger language plpgsql security definer set search_path = public, private as $$
begin perform private.notify('task', jsonb_build_object('id', new.id)); return new; end $$;
create or replace function private.on_submission() returns trigger language plpgsql security definer set search_path = public, private as $$
begin
  if tg_op = 'INSERT' or new.submitted_at is distinct from old.submitted_at then
    perform private.notify('submission', jsonb_build_object('id', new.id));
  elsif coalesce(new.feedback, '') <> '' and new.feedback is distinct from old.feedback then
    perform private.notify('feedback', jsonb_build_object('id', new.id));
  end if;
  return new;
end $$;

drop trigger if exists notify_message on public.messages;
create trigger notify_message after insert on public.messages for each row execute function private.on_message();
drop trigger if exists notify_task on public.tasks;
create trigger notify_task after insert on public.tasks for each row execute function private.on_task();
drop trigger if exists notify_submission on public.submissions;
create trigger notify_submission after insert or update on public.submissions for each row execute function private.on_submission();

-- Runs every 10 minutes: class reminders (about a day and an hour before) and homework due within a day.
create or replace function private.send_reminders() returns void language plpgsql security definer set search_path = public, private as $$
declare r record;
begin
  for r in select id from public.lessons
           where status = 'planned' and not reminded_day
             and starts_at <= now() + interval '24 hours' and starts_at > now() + interval '2 hours' loop
    update public.lessons set reminded_day = true where id = r.id;
    perform private.notify('class_reminder', jsonb_build_object('id', r.id, 'when', 'day'));
  end loop;
  for r in select id from public.lessons
           where status = 'planned' and not reminded_hour
             and starts_at <= now() + interval '65 minutes' and starts_at > now() loop
    update public.lessons set reminded_hour = true, reminded_day = true where id = r.id;
    perform private.notify('class_reminder', jsonb_build_object('id', r.id, 'when', 'hour'));
  end loop;
  for r in select t.id from public.tasks t
           where not t.due_reminded and t.due_at is not null
             and t.due_at <= now() + interval '24 hours' and t.due_at > now()
             and not exists (select 1 from public.submissions s where s.task_id = t.id) loop
    update public.tasks set due_reminded = true where id = r.id;
    perform private.notify('due', jsonb_build_object('id', r.id));
  end loop;
end $$;

do $$ begin
  perform cron.unschedule('espanish-reminders');
exception when others then null;
end $$;
select cron.schedule('espanish-reminders', '*/10 * * * *', 'select private.send_reminders()');

-- None of these helpers should be callable through the public API.
revoke execute on function private.notify(text, jsonb), private.on_message(), private.on_task(), private.on_submission(), private.send_reminders() from public, anon, authenticated;
