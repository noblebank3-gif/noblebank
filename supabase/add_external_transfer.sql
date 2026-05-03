-- Noble Trust Bank — run this in Supabase SQL Editor
-- Adds the execute_external_transfer function for outgoing bank transfers

create or replace function public.execute_external_transfer(
  p_from_account_id   uuid,
  p_user_id           uuid,
  p_amount            numeric,
  p_currency          text,
  p_description       text,
  p_reference         text    default null,
  p_counterparty      text    default null,
  p_counterparty_bank text    default null
) returns text as $$
declare
  v_from_balance numeric;
  v_ref          text;
begin
  if p_amount <= 0 then
    raise exception 'Transfer amount must be positive';
  end if;

  select balance into v_from_balance
  from public.accounts
  where id = p_from_account_id and user_id = p_user_id
  for update;

  if v_from_balance is null then
    raise exception 'Account not found or access denied';
  end if;

  if v_from_balance < p_amount then
    raise exception 'Insufficient funds';
  end if;

  v_ref := coalesce(p_reference, 'EXT-' || extract(epoch from now())::bigint::text);

  update public.accounts
  set balance = balance - p_amount
  where id = p_from_account_id;

  insert into public.transactions
    (account_id, user_id, type, category, amount, currency, description,
     status, reference, counterparty, counterparty_bank, date, processed_at)
  values
    (p_from_account_id, p_user_id, 'debit', 'transfer', p_amount, p_currency, p_description,
     'completed', v_ref, p_counterparty, p_counterparty_bank, now(), now());

  return v_ref;
end;
$$ language plpgsql security definer;
