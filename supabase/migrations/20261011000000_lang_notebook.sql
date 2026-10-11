-- Language per user + a richer private notebook for the teacher.

alter table public.profiles add column if not exists lang text not null default 'en' check (lang in ('en', 'es'));
update public.profiles set lang = 'es' where role = 'teacher';

alter table public.insights add column if not exists practice text not null default '';
alter table public.insights add column if not exists homework text not null default '';

-- Users may change their own name and language (nothing else).
revoke update on public.profiles from authenticated;
grant update (name, lang) on public.profiles to authenticated;

-- New accounts: teachers always get Spanish; students get the language they picked at sign-up.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare teacher public.teacher_emails;
begin
  select * into teacher from public.teacher_emails where lower(email) = lower(new.email);
  insert into public.profiles (id, role, name, email, lang)
  values (
    new.id,
    case when teacher.email is not null then 'teacher' else 'student' end,
    coalesce(teacher.name, new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    case when teacher.email is not null then 'es'
         when new.raw_user_meta_data->>'lang' in ('en', 'es') then new.raw_user_meta_data->>'lang'
         else 'en' end
  )
  on conflict (id) do nothing;
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
