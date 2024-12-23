-- Create the notification type enum
create type notification_type as enum ('payment', 'system', 'organization');

-- Create the notifications table
create table notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  message text not null,
  type notification_type not null,
  read boolean default false,
  data jsonb,  -- For storing flexible metadata like payment amount, org name, etc
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better query performance
create index notifications_user_id_idx on notifications(user_id);
create index notifications_read_idx on notifications(read);
create index notifications_created_at_idx on notifications(created_at desc);

-- Set up RLS (Row Level Security)
alter table notifications enable row level security;

-- Create policies
create policy "Users can view their own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "System can insert notifications"
  on notifications for insert
  with check (true);  -- Allow system to create notifications for any user

create policy "Users can update their own notifications"
  on notifications for update
  using (auth.uid() = user_id);
