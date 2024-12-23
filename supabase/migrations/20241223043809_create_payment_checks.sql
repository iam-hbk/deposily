-- Create the payment_checks table to track when payments were last checked
create table payment_checks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  organization_id uuid references organizations(organization_id) not null,
  last_checked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, organization_id)
);

-- Set up RLS
alter table payment_checks enable row level security;

-- Create policies
create policy "Users can view their own payment checks"
  on payment_checks for select
  using (auth.uid() = user_id);

create policy "Users can update their own payment checks"
  on payment_checks for update
  using (auth.uid() = user_id);

create policy "Users can insert their own payment checks"
  on payment_checks for insert
  with check (auth.uid() = user_id); 