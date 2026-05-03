-- Noble Trust Bank — run this in Supabase SQL Editor
-- Resets ALL existing users: zeroes account balances and removes seed transactions.
-- Safe to run: only deletes the original hardcoded seed transactions (by reference).

-- 1. Delete seed transactions
delete from public.transactions
where reference in ('SAL-INIT', 'PMT-INIT', 'UTL-INIT', 'SHP-INIT', 'DEP-INIT');

-- 2. Zero out all account balances
update public.accounts
set balance = 0;
