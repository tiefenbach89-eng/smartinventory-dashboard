-- Add supplier and article number fields to barrel_oils
ALTER TABLE barrel_oils ADD COLUMN IF NOT EXISTS supplier TEXT;
ALTER TABLE barrel_oils ADD COLUMN IF NOT EXISTS article_number TEXT;
ALTER TABLE barrel_oils ADD COLUMN IF NOT EXISTS last_price NUMERIC(10, 4);

COMMENT ON COLUMN barrel_oils.supplier IS 'Supplier/Lieferant (e.g. Stahlgruber, STAKIS)';
COMMENT ON COLUMN barrel_oils.article_number IS 'Article number for ordering';
COMMENT ON COLUMN barrel_oils.last_price IS 'Last purchase price per liter';
