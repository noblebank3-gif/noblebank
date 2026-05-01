-- Noble Trust Bank - onboarding policy fixes
-- Run this in Supabase SQL Editor if signup creates a user but the dashboard is empty.

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

alter table public.cards
  add column if not exists demo_card_number text,
  add column if not exists demo_cvv text;

drop policy if exists "accounts: insert own" on public.accounts;
create policy "accounts: insert own"
  on public.accounts for insert
  with check (auth.uid() = user_id);

drop policy if exists "cards: insert own" on public.cards;
create policy "cards: insert own"
  on public.cards for insert
  with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger as $onboarding$
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
$onboarding$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
