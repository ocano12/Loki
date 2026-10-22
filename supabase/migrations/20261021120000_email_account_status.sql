-- Tells the auth screens what kind of account (if any) an email has, so they can guide people:
--   'none'       no account          → sign up (login / reset say "no account with that email")
--   'incomplete' started sign-up but never set a password → finish signing up
--   'active'     finished account    → log in (sign-up says "you already have an account")
--
-- Tradeoff: this reveals whether an email is registered (as Instagram/Yelp sign-up and login do).
-- Add sign-up CAPTCHA before launch to limit automated probing.

create function public.email_account_status(p_email text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select case when coalesce(u.encrypted_password, '') <> '' then 'active' else 'incomplete' end
      from auth.users u
      where lower(u.email) = lower(trim(p_email))
        and u.deleted_at is null
      limit 1
    ),
    'none'
  );
$$;

revoke execute on function public.email_account_status(text) from public;
grant execute on function public.email_account_status(text) to anon, authenticated;
