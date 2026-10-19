-- Files and folders from the teacher's Google Drive, filed under a category in one student's section.
create table if not exists public.student_materials (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles on delete cascade,
  category text not null check (category in ('exercises', 'exams', 'homework', 'presentations', 'theory', 'videos', 'songs')),
  drive_id text not null check (char_length(drive_id) between 10 and 100),
  name text not null check (char_length(name) between 1 and 200),
  mime_type text,
  url text not null check (url like 'https://%'),
  created_at timestamptz not null default now()
);
create index if not exists student_materials_student_idx on public.student_materials (student_id, created_at);
alter table public.student_materials enable row level security;

drop policy if exists sm_select on public.student_materials;
create policy sm_select on public.student_materials for select to authenticated
  using (student_id = (select auth.uid()) or public.is_teacher());
drop policy if exists sm_teacher on public.student_materials;
create policy sm_teacher on public.student_materials for all to authenticated
  using (public.is_teacher()) with check (public.is_teacher());

-- Tell the student when something new is filed for them.
create or replace function private.on_material() returns trigger language plpgsql security definer set search_path = public, private as $$
begin perform private.notify('material', jsonb_build_object('id', new.id)); return new; end $$;
revoke execute on function private.on_material() from public, anon, authenticated;
drop trigger if exists notify_material on public.student_materials;
create trigger notify_material after insert on public.student_materials for each row execute function private.on_material();
