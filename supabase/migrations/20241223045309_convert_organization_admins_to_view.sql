-- Drop the existing organization_admins table
drop table if exists organization_admins;

-- Create the organization_admins view
create or replace view organization_admins as
select 
  organization_id,
  created_by as profile_id
from organizations
where created_by is not null;

-- Set up RLS (Row Level Security) for the view
alter view organization_admins set (security_invoker = true);

-- Create policies for the view
create policy "Users can view organization admins"
  on organization_admins for select
  using (true);  -- Anyone can view admins 