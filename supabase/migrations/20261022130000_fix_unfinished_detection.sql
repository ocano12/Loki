-- Fix: "unfinished sign-up" can't be detected by a missing password. When Supabase creates an
-- account through an email code it assigns a random password, so every verified account looked
-- 'active'. Use the sign-up flags the app sets in user metadata instead:
--   signup_pending = true        set when the code is verified, cleared on the final Sign up tap
--   onboarding_complete = false  same meaning, from the app's earlier sign-up flow

create or replace function public.email_account_status(p_email text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select case
        when u.email_confirmed_at is null then 'unverified'
        when u.raw_user_meta_data ->> 'signup_pending' = 'true'
          or u.raw_user_meta_data ->> 'onboarding_complete' = 'false' then 'incomplete'
        else 'active'
      end
      from auth.users u
      where lower(u.email) = lower(trim(p_email))
        and u.deleted_at is null
      limit 1
    ),
    'none'
  );
$$;

-- Deletes the caller's own account, but only while sign-up is unfinished.
-- (The flag is user-editable, but this only ever deletes the caller's own account.)
create or replace function public.delete_unfinished_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users
  where id = (select auth.uid())
    and (
      raw_user_meta_data ->> 'signup_pending' = 'true'
      or raw_user_meta_data ->> 'onboarding_complete' = 'false'
    );
$$;
