-- Add 120L to barrel_size options
-- Drop existing constraint
ALTER TABLE barrel_oils
  DROP CONSTRAINT IF EXISTS barrel_oils_barrel_size_check;

-- Add new constraint with 120L
ALTER TABLE barrel_oils
  ADD CONSTRAINT barrel_oils_barrel_size_check
  CHECK (barrel_size IN (60, 120, 208));

-- Update comment
COMMENT ON COLUMN barrel_oils.barrel_size IS 'Barrel size in liters: 60, 120, or 208';
