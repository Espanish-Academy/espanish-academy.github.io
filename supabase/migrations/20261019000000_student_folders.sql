-- Each student can have their own Google Drive folder (exercises, presentations), shown in their section.
create table if not exists public.student_folders (
  student_id uuid primary key references public.profiles on delete cascade,
  folder_id text not null check (char_length(folder_id) between 10 and 100 and folder_id ~ '^[A-Za-z0-9_-]+$'),
  updated_at timestamptz not null default now()
);
alter table public.student_folders enable row level security;

drop policy if exists sf_select on public.student_folders;
create policy sf_select on public.student_folders for select to authenticated
  using (student_id = (select auth.uid()) or public.is_teacher());
drop policy if exists sf_teacher on public.student_folders;
create policy sf_teacher on public.student_folders for all to authenticated
  using (public.is_teacher()) with check (public.is_teacher());
