-- Run this in the Supabase SQL Editor to make sample_employees account-specific.
-- Existing shared rows are assigned to the current legacy administrator below.

alter table public.sample_employees
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

-- Keep the existing shared employee list with the account that managed it before
-- ownership was tracked. Rows with a different known owner are left untouched.
update public.sample_employees as employee
set user_id = auth_user.id
from auth.users as auth_user
where employee.user_id is null
  and lower(auth_user.email) = 'nandkishor24714@gmail.com';

create index if not exists sample_employees_user_id_idx
  on public.sample_employees (user_id);

alter table public.sample_employees enable row level security;

-- Remove any older permissive policy that could still expose shared rows.
do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'sample_employees'
  loop
    execute format(
      'drop policy if exists %I on public.sample_employees',
      existing_policy.policyname
    );
  end loop;
end
$$;

create policy "Users can view their own employees"
  on public.sample_employees
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can add their own employees"
  on public.sample_employees
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update their own employees"
  on public.sample_employees
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete their own employees"
  on public.sample_employees
  for delete
  to authenticated
  using (user_id = auth.uid());
