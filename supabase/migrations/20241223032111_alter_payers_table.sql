-- Add organization_id to PAYERS table
ALTER TABLE PAYERS
ADD COLUMN organization_id INTEGER REFERENCES ORGANIZATIONS(organization_id);

-- Create a composite unique constraint for phone_number within an organization
ALTER TABLE PAYERS
ADD CONSTRAINT unique_phone_per_organization UNIQUE (phone_number, organization_id);

-- Remove any existing constraint on phone_number if it exists
ALTER TABLE PAYERS
DROP CONSTRAINT IF EXISTS payers_phone_number_key;
