-- Add dilution_ratio field to barrel_oils table
ALTER TABLE barrel_oils ADD COLUMN IF NOT EXISTS dilution_ratio TEXT DEFAULT NULL;

-- Add check constraint for valid dilution ratios
ALTER TABLE barrel_oils
  DROP CONSTRAINT IF EXISTS barrel_oils_dilution_ratio_check;

ALTER TABLE barrel_oils
  ADD CONSTRAINT barrel_oils_dilution_ratio_check
  CHECK (dilution_ratio IN (NULL, 'none', '1:1', '1:2', '1:3', '1:4', '1:5'));

COMMENT ON COLUMN barrel_oils.dilution_ratio IS 'Dilution ratio for concentrates: none (pure), 1:1, 1:2, 1:3, 1:4, 1:5';
