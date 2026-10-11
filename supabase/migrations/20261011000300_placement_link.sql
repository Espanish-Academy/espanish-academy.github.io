-- A level check can be linked to a student, so nothing is lost when the person later creates an account.

alter table public.placement_results add column if not exists student_id uuid references public.profiles on delete set null;

-- Automatic link: if the contact written in the level check is the email used to sign up, connect them.
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
  update public.placement_results set student_id = new.id
   where student_id is null and lower(btrim(contact)) = lower(new.email);
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
