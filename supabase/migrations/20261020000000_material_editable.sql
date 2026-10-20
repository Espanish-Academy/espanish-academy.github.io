-- A material can be an editable personal copy the student fills in (the teacher corrects it in the same document).
alter table public.student_materials add column if not exists editable boolean not null default false;
