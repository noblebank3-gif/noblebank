-- ═══════════════════════════════════════════════════════════
--  Noble Trust Bank — Supabase Schema
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════

-- ── 1. PROFILES (extends auth.users) ────────────────────────
create table if not exists public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  first_name    text not null default '',
  last_name     text not null default '',
  email         text not null default '',
  phone         text,
  avatar        text,
  tier          text not null default 'standard' check (tier in ('standard', 'premium', 'private')),
  notifications boolean not null default true,
  two_factor    boolean not null default false,
  is_admin      boolean not null default false,
  country       text,
  joined_at     timestamptz not null default now()
);

-- ── 2. ACCOUNTS ──────────────────────────────────────────────
create table if not exists public.accounts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references public.profiles(id) on delete cascade not null,
  name           text not null,
  type           text not null check (type in ('checking', 'savings', 'investment', 'foreign')),
  balance        numeric(15,2) not null default 0,
  currency       text not null default 'USD',
  account_number text not null,
  routing_number text,
  iban           text,
  swift          text,
  is_default     boolean not null default false,
  created_at     timestamptz not null default now()
);

-- ── 3. TRANSACTIONS ──────────────────────────────────────────
create table if not exists public.transactions (
  id               uuid primary key default gen_random_uuid(),
  account_id       uuid references public.accounts(id) on delete cascade not null,
  user_id          uuid references public.profiles(id) on delete cascade not null,
  type             text not null check (type in ('credit', 'debit')),
  category         text not null check (category in (
                     'transfer','payment','deposit','withdrawal',
                     'investment','fee','salary','shopping','utilities','travel'
                   )),
  amount           numeric(15,2) not null,
  currency         text not null default 'USD',
  description      text not null,
  merchant         text,
  merchant_icon    text,
  status           text not null default 'pending' check (status in ('completed','pending','failed','processing')),
  reference        text,
  counterparty     text,
  counterparty_bank text,
  date             timestamptz not null default now(),
  processed_at     timestamptz,
  note             text
);

-- ── 4. CARDS ─────────────────────────────────────────────────
create table if not exists public.cards (
  id               uuid primary key default gen_random_uuid(),
  account_id       uuid references public.accounts(id) on delete cascade not null,
  user_id          uuid references public.profiles(id) on delete cascade not null,
  network          text not null check (network in ('visa', 'mastercard')),
  last4            text not null,
  demo_card_number text,
  demo_cvv         text,
  expiry_month     text not null,
  expiry_year      text not null,
  holder_name      text not null,
  status           text not null default 'active' check (status in ('active', 'frozen', 'expired')),
  type             text not null check (type in ('debit', 'credit')),
  spend_limit      numeric(15,2),
  spent_this_month numeric(15,2) not null default 0,
  is_virtual       boolean not null default false,
  color            text not null default 'navy' check (color in ('navy', 'gold', 'slate')),
  created_at       timestamptz not null default now()
);

-- ── 5. NOTIFICATIONS ─────────────────────────────────────────
create table if not exists public.notifications (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title   text not null,
  message text not null,
  type    text not null check (type in ('info', 'success', 'warning', 'alert')),
  read    boolean not null default false,
  date    timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════
alter table public.profiles      enable row level security;
alter table public.accounts      enable row level security;
alter table public.transactions  enable row level security;
alter table public.cards         enable row level security;
alter table public.notifications enable row level security;

-- profiles
create policy "profiles: select own"  on public.profiles for select using (auth.uid() = id);
create policy "profiles: update own"  on public.profiles for update using (auth.uid() = id);

-- accounts
create policy "accounts: select own"  on public.accounts for select using (auth.uid() = user_id);
create policy "accounts: insert own"  on public.accounts for insert with check (auth.uid() = user_id);
create policy "accounts: update own"  on public.accounts for update using (auth.uid() = user_id);

-- transactions
create policy "transactions: select own" on public.transactions for select using (auth.uid() = user_id);
create policy "transactions: insert own" on public.transactions for insert with check (auth.uid() = user_id);

-- cards
create policy "cards: select own"  on public.cards for select using (auth.uid() = user_id);
create policy "cards: insert own"  on public.cards for insert with check (auth.uid() = user_id);
create policy "cards: update own"  on public.cards for update using (auth.uid() = user_id);

-- notifications
create policy "notifications: select own" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications: update own" on public.notifications for update using (auth.uid() = user_id);
create policy "notifications: insert own" on public.notifications for insert with check (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════
--  TRIGGER: auto-create profile on signup
-- ═══════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    new.email,
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ═══════════════════════════════════════════════════════════
--  FUNCTION: atomic transfer (debit + credit + transactions)
-- ═══════════════════════════════════════════════════════════
create or replace function public.execute_transfer(
  p_from_account_id uuid,
  p_to_account_id   uuid,
  p_user_id         uuid,
  p_amount          numeric,
  p_currency        text,
  p_description     text,
  p_reference       text default null
) returns text as $$
declare
  v_from_balance numeric;
  v_to_user_id   uuid;
  v_ref          text;
begin
  if p_amount <= 0 then
    raise exception 'Transfer amount must be positive';
  end if;

  if p_from_account_id = p_to_account_id then
    raise exception 'Source and destination accounts must be different';
  end if;

  -- Verify ownership and lock the from-account row
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

  select user_id into v_to_user_id
  from public.accounts
  where id = p_to_account_id;

  if v_to_user_id is null then
    raise exception 'Destination account not found';
  end if;

  v_ref := coalesce(p_reference, 'TRF-' || extract(epoch from now())::bigint::text);

  -- Debit from-account
  update public.accounts set balance = balance - p_amount where id = p_from_account_id;

  -- Credit to-account
  update public.accounts set balance = balance + p_amount where id = p_to_account_id;

  -- Debit transaction record
  insert into public.transactions
    (account_id, user_id, type, category, amount, currency, description, status, reference, date, processed_at)
  values
    (p_from_account_id, p_user_id, 'debit', 'transfer', p_amount, p_currency, p_description, 'completed', v_ref, now(), now());

  -- Credit transaction record
  insert into public.transactions
    (account_id, user_id, type, category, amount, currency, description, status, reference, date, processed_at)
  values
    (p_to_account_id, v_to_user_id, 'credit', 'transfer', p_amount, p_currency, p_description, 'completed', v_ref, now(), now());

  return v_ref;
end;
$$ language plpgsql security definer;
