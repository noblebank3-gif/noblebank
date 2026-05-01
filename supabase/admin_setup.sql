-- Noble Trust Bank - super admin setup
-- Run this in Supabase SQL Editor after supabase/schema.sql.
-- Create the auth user noblebank3@gmail.com separately in Supabase Auth,
-- then run this script to grant the admin flag and admin-only RPC access.

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

alter table public.cards
  add column if not exists demo_card_number text,
  add column if not exists demo_cvv text;

update public.profiles
set is_admin = true, tier = 'private'
where lower(email) = 'noblebank3@gmail.com';

create or replace function public.is_current_admin()
returns boolean
language sql
security definer
set search_path = public
as $admin$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_admin = true
  );
$admin$;

create or replace function public.require_current_admin()
returns void
language plpgsql
security definer
set search_path = public
as $admin$
begin
  if not public.is_current_admin() then
    raise exception 'Admin access required';
  end if;
end;
$admin$;

create or replace function public.admin_get_users()
returns table (
  id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  avatar text,
  tier text,
  notifications boolean,
  two_factor boolean,
  country text,
  joined_at timestamptz,
  is_admin boolean,
  account_count bigint,
  total_balance numeric,
  last_activity timestamptz
)
language plpgsql
security definer
set search_path = public
as $admin$
begin
  perform public.require_current_admin();

  return query
  select
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.phone,
    p.avatar,
    p.tier,
    p.notifications,
    p.two_factor,
    p.country,
    p.joined_at,
    p.is_admin,
    coalesce(account_totals.account_count, 0) as account_count,
    coalesce(account_totals.total_balance, 0) as total_balance,
    activity.last_activity
  from public.profiles p
  left join lateral (
    select
      count(*) as account_count,
      coalesce(sum(balance), 0) as total_balance
    from public.accounts
    where user_id = p.id
  ) account_totals on true
  left join lateral (
    select max(date) as last_activity
    from public.transactions
    where user_id = p.id
  ) activity on true
  order by p.joined_at desc;
end;
$admin$;

create or replace function public.admin_get_user_accounts(p_user_id uuid)
returns setof public.accounts
language plpgsql
security definer
set search_path = public
as $admin$
begin
  perform public.require_current_admin();

  return query
  select *
  from public.accounts
  where user_id = p_user_id
  order by created_at asc;
end;
$admin$;

create or replace function public.admin_get_user_transactions(p_user_id uuid, p_limit integer default 50)
returns setof public.transactions
language plpgsql
security definer
set search_path = public
as $admin$
begin
  perform public.require_current_admin();

  return query
  select *
  from public.transactions
  where user_id = p_user_id
  order by date desc
  limit greatest(1, least(coalesce(p_limit, 50), 200));
end;
$admin$;

create or replace function public.admin_get_user_cards(p_user_id uuid)
returns setof public.cards
language plpgsql
security definer
set search_path = public
as $admin$
begin
  perform public.require_current_admin();

  return query
  select *
  from public.cards
  where user_id = p_user_id
  order by created_at asc;
end;
$admin$;

create or replace function public.admin_update_account_balance(
  p_account_id uuid,
  p_balance numeric,
  p_note text default null
)
returns public.accounts
language plpgsql
security definer
set search_path = public
as $admin$
declare
  v_account public.accounts;
  v_old_balance numeric;
  v_delta numeric;
begin
  perform public.require_current_admin();

  if p_balance < 0 then
    raise exception 'Balance cannot be negative';
  end if;

  select *
  into v_account
  from public.accounts
  where id = p_account_id
  for update;

  if v_account.id is null then
    raise exception 'Account not found';
  end if;

  v_old_balance := v_account.balance;
  v_delta := p_balance - v_old_balance;

  update public.accounts
  set balance = p_balance
  where id = p_account_id
  returning * into v_account;

  if v_delta <> 0 then
    insert into public.transactions (
      account_id,
      user_id,
      type,
      category,
      amount,
      currency,
      description,
      merchant,
      status,
      reference,
      date,
      processed_at,
      note
    )
    values (
      v_account.id,
      v_account.user_id,
      case when v_delta > 0 then 'credit' else 'debit' end,
      case when v_delta > 0 then 'deposit' else 'withdrawal' end,
      abs(v_delta),
      v_account.currency,
      'Admin balance adjustment',
      'Noble Trust Bank',
      'completed',
      'ADM-' || extract(epoch from now())::bigint::text,
      now(),
      now(),
      coalesce(p_note, 'Updated by super admin')
    );

  end if;

  return v_account;
end;
$admin$;
