-- Add AdBlue to liquid_type options
-- Drop existing constraint
ALTER TABLE barrel_oils
  DROP CONSTRAINT IF EXISTS barrel_oils_liquid_type_check;

-- Add new constraint with AdBlue
ALTER TABLE barrel_oils
  ADD CONSTRAINT barrel_oils_liquid_type_check
  CHECK (liquid_type IN ('oil', 'windshield_washer', 'distilled_water', 'adblue'));

-- Update comment
COMMENT ON COLUMN barrel_oils.liquid_type IS 'Type of liquid: oil, windshield_washer, distilled_water, adblue';
