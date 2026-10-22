-- Adds email verification to the account status, and lets someone abandon an unfinished sign-up.
--
-- Status (see 20261021120000_email_account_status.sql for the original):
--   'none'        no account
--   'unverified'  a sign-up code was sent but never entered (email not confirmed)
--   'incomplete'  email verified, but sign-up never finished (no password yet)
--   'active'      verified and has a password: a real, usable account

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
        when coalesce(u.encrypted_password, '') = '' then 'incomplete'
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

-- Deletes the caller's own account, but only while sign-up is unfinished (no password yet).
-- Used when someone is under the minimum age: their bare, email-only account is removed.
-- profiles rows cascade from auth.users.
create function public.delete_unfinished_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users
  where id = (select auth.uid())
    and coalesce(encrypted_password, '') = '';
$$;

revoke execute on function public.delete_unfinished_account() from public, anon;
grant execute on function public.delete_unfinished_account() to authenticated;
