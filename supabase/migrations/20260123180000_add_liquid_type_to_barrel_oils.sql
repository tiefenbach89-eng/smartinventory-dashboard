-- Add liquid_type field to barrel_oils table
ALTER TABLE barrel_oils ADD COLUMN IF NOT EXISTS liquid_type TEXT DEFAULT 'oil';

-- Add check constraint for valid liquid types
ALTER TABLE barrel_oils
  DROP CONSTRAINT IF EXISTS barrel_oils_liquid_type_check;

ALTER TABLE barrel_oils
  ADD CONSTRAINT barrel_oils_liquid_type_check
  CHECK (liquid_type IN ('oil', 'windshield_washer', 'distilled_water'));

COMMENT ON COLUMN barrel_oils.liquid_type IS 'Type of liquid: oil, windshield_washer, distilled_water';

-- Add EAN field to barrel_oils table
ALTER TABLE barrel_oils ADD COLUMN IF NOT EXISTS ean TEXT DEFAULT NULL;

COMMENT ON COLUMN barrel_oils.ean IS 'EAN barcode number for the product';

-- Update existing records to have 'oil' as default
UPDATE barrel_oils SET liquid_type = 'oil' WHERE liquid_type IS NULL;
