-- Security hardening from Supabase advisors.
-- The trigger function never needs to be called through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
-- is_teacher() is only needed by signed-in users (inside RLS policies).
revoke execute on function public.is_teacher() from public, anon;
grant execute on function public.is_teacher() to authenticated;
