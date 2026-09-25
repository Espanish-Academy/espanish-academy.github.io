-- Espanish — database schema.
-- Run once in Supabase → SQL Editor. Safe to re-run.
-- Teachers are listed (by email) in public.teacher_emails — add them once, outside git:
--   insert into public.teacher_emails (email, name) values ('teacher@example.com', 'Profe');
-- Anyone signing up with a listed email becomes a teacher automatically.

-- ───────────── Profiles ─────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null default 'student' check (role in ('teacher', 'student')),
  name text not null default '',
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.teacher_emails (
  email text primary key,
  name text
);
alter table public.teacher_emails enable row level security; -- no policies: invisible to app users

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare teacher public.teacher_emails;
begin
  select * into teacher from public.teacher_emails where lower(email) = lower(new.email);
  insert into public.profiles (id, role, name, email)
  values (
    new.id,
    case when teacher.email is not null then 'teacher' else 'student' end,
    coalesce(teacher.name, new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_teacher() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher')
$$;

-- ───────────── Tables ─────────────
create table if not exists public.questionnaires (
  student_id uuid primary key references public.profiles on delete cascade,
  answers jsonb not null default '{}',
  completed_at timestamptz
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles on delete cascade,
  sender_id uuid not null references public.profiles on delete cascade,
  text text not null default '',
  image_url text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists messages_student_idx on public.messages (student_id, created_at);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles on delete cascade,
  starts_at timestamptz not null,
  duration_min int not null default 60,
  status text not null default 'planned' check (status in ('planned', 'done', 'cancelled')),
  title text not null default '',
  topics jsonb not null default '[]',
  vocab jsonb not null default '[]',
  summary text not null default '',
  materials jsonb not null default '[]',
  recording_url text
);

-- Teacher-only notes. Students can never read this table.
create table if not exists public.lesson_notes (
  lesson_id uuid primary key references public.lessons on delete cascade,
  student_id uuid not null references public.profiles on delete cascade,
  mood int,
  struggles jsonb not null default '[]',
  skip jsonb not null default '[]',
  work_on jsonb not null default '[]',
  private_text text not null default ''
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles on delete cascade,
  lesson_id uuid references public.lessons on delete set null,
  kind text not null default 'homework' check (kind in ('homework', 'exercise', 'exam')),
  title text not null default '',
  instructions text not null default '',
  due_at timestamptz,
  attachments jsonb not null default '[]',
  questions jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null unique references public.tasks on delete cascade,
  student_id uuid not null references public.profiles on delete cascade,
  answers jsonb not null default '{}',
  text_answer text not null default '',
  attachments jsonb not null default '[]',
  score int,
  total int,
  submitted_at timestamptz not null default now(),
  feedback text
);

-- Teacher-only portfolio notes per student.
create table if not exists public.insights (
  student_id uuid primary key references public.profiles on delete cascade,
  notes text not null default '',
  next_lesson text not null default '',
  updated_at timestamptz not null default now()
);

-- ───────────── Row level security ─────────────
alter table public.profiles enable row level security;
alter table public.questionnaires enable row level security;
alter table public.messages enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_notes enable row level security;
alter table public.tasks enable row level security;
alter table public.submissions enable row level security;
alter table public.insights enable row level security;

-- Profiles: see yourself, the teacher, and (if teacher) everyone. Only the name is editable.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or role = 'teacher' or public.is_teacher());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update using (id = auth.uid() or public.is_teacher());
revoke update on public.profiles from authenticated;
grant update (name) on public.profiles to authenticated;

-- Questionnaire: the student fills their own; the teacher reads all.
drop policy if exists q_all on public.questionnaires;
create policy q_all on public.questionnaires for all
  using (student_id = auth.uid() or public.is_teacher())
  with check (student_id = auth.uid() or public.is_teacher());

-- Messages: one conversation per student, between that student and the teacher.
drop policy if exists m_select on public.messages;
create policy m_select on public.messages for select using (student_id = auth.uid() or public.is_teacher());
drop policy if exists m_insert on public.messages;
create policy m_insert on public.messages for insert
  with check (sender_id = auth.uid() and (student_id = auth.uid() or public.is_teacher()));
drop policy if exists m_update on public.messages;
create policy m_update on public.messages for update using (student_id = auth.uid() or public.is_teacher());

-- Lessons and tasks: students read their own, the teacher manages them.
drop policy if exists l_select on public.lessons;
create policy l_select on public.lessons for select using (student_id = auth.uid() or public.is_teacher());
drop policy if exists l_write on public.lessons;
create policy l_write on public.lessons for all using (public.is_teacher()) with check (public.is_teacher());

drop policy if exists t_select on public.tasks;
create policy t_select on public.tasks for select using (student_id = auth.uid() or public.is_teacher());
drop policy if exists t_write on public.tasks;
create policy t_write on public.tasks for all using (public.is_teacher()) with check (public.is_teacher());

-- Submissions: the student hands in, the teacher reads and adds feedback.
drop policy if exists s_all on public.submissions;
create policy s_all on public.submissions for all
  using (student_id = auth.uid() or public.is_teacher())
  with check (student_id = auth.uid() or public.is_teacher());

-- Private teacher areas.
drop policy if exists n_teacher on public.lesson_notes;
create policy n_teacher on public.lesson_notes for all using (public.is_teacher()) with check (public.is_teacher());
drop policy if exists i_teacher on public.insights;
create policy i_teacher on public.insights for all using (public.is_teacher()) with check (public.is_teacher());

-- ───────────── Realtime (live chat and updates) ─────────────
do $$
declare t text;
begin
  foreach t in array array['messages', 'lessons', 'tasks', 'submissions'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ───────────── File storage (photos, PDFs) ─────────────
-- Files get random, unguessable names. The bucket is public-read so images load quickly.
insert into storage.buckets (id, name, public) values ('files', 'files', true) on conflict (id) do nothing;
drop policy if exists files_insert on storage.objects;
create policy files_insert on storage.objects for insert to authenticated with check (bucket_id = 'files');
drop policy if exists files_select on storage.objects;
create policy files_select on storage.objects for select using (bucket_id = 'files');
