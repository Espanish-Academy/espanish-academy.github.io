-- The level check also collects the "about you" answers (why, how they like to learn, interests…).
alter table public.placement_results add column if not exists profile jsonb not null default '{}' check (pg_column_size(profile) < 20000);

-- When the person signs up, their level-check answers pre-fill the questionnaire (they only answer what is missing).
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
  insert into public.questionnaires (student_id, answers)
    select new.id, p.profile from public.placement_results p
     where p.student_id = new.id and p.profile <> '{}'::jsonb
     order by p.created_at desc limit 1
  on conflict (student_id) do nothing;
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
