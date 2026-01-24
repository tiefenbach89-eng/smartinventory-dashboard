-- Tabelle für Fassöle
CREATE TABLE IF NOT EXISTS barrel_oils (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Grundinformationen
  brand TEXT NOT NULL,
  viscosity TEXT NOT NULL,

  -- Erweiterte Spezifikationen (ACEA, etc.)
  acea_specs TEXT,
  approvals TEXT,
  recommendations TEXT,
  specifications TEXT,

  -- Fassdetails
  barrel_size INTEGER NOT NULL CHECK (barrel_size IN (60, 208)),
  max_capacity DECIMAL(10, 2) NOT NULL,
  current_level DECIMAL(10, 2) NOT NULL DEFAULT 0,

  -- Preisinformationen
  purchase_price DECIMAL(10, 2), -- EK-Preis gesamt
  price_per_liter DECIMAL(10, 4), -- Berechneter Literpreis

  -- Standort und Verwaltung
  location TEXT,
  purchase_date DATE,
  notes TEXT,

  -- Bild (Supabase Storage)
  image_url TEXT,
  image_path TEXT, -- Pfad im Storage

  -- Benutzer der das Fass erstellt hat
  created_by UUID REFERENCES auth.users(id),

  -- Validierung: Füllstand darf Kapazität nicht überschreiten
  CONSTRAINT valid_level CHECK (current_level >= 0 AND current_level <= max_capacity)
);

-- Tabelle für Füllstands-Historie
CREATE TABLE IF NOT EXISTS barrel_oil_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  barrel_id UUID NOT NULL REFERENCES barrel_oils(id) ON DELETE CASCADE,

  -- Änderungsdetails
  action TEXT NOT NULL CHECK (action IN ('add', 'remove', 'adjustment')),
  amount DECIMAL(10, 2) NOT NULL,
  old_level DECIMAL(10, 2) NOT NULL,
  new_level DECIMAL(10, 2) NOT NULL,

  -- Preisinformationen
  unit_price DECIMAL(10, 4), -- Preis pro Liter bei dieser Buchung
  total_cost DECIMAL(10, 2), -- Gesamtkosten (amount * unit_price)

  -- Grund und Benutzer
  reason TEXT,
  user_name TEXT,
  user_id UUID REFERENCES auth.users(id)
);

-- Index für schnellere Abfragen
CREATE INDEX IF NOT EXISTS idx_barrel_oils_brand ON barrel_oils(brand);
CREATE INDEX IF NOT EXISTS idx_barrel_oils_barrel_size ON barrel_oils(barrel_size);
CREATE INDEX IF NOT EXISTS idx_barrel_oil_history_barrel_id ON barrel_oil_history(barrel_id);
CREATE INDEX IF NOT EXISTS idx_barrel_oil_history_created_at ON barrel_oil_history(created_at DESC);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_barrel_oils_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_barrel_oils_updated_at
  BEFORE UPDATE ON barrel_oils
  FOR EACH ROW
  EXECUTE FUNCTION update_barrel_oils_updated_at();

-- RLS (Row Level Security) Policies
ALTER TABLE barrel_oils ENABLE ROW LEVEL SECURITY;
ALTER TABLE barrel_oil_history ENABLE ROW LEVEL SECURITY;

-- Jeder authentifizierte Benutzer kann Fässer lesen
CREATE POLICY "Allow authenticated users to read barrel oils"
  ON barrel_oils
  FOR SELECT
  TO authenticated
  USING (true);

-- Nur authentifizierte Benutzer können Fässer erstellen
CREATE POLICY "Allow authenticated users to insert barrel oils"
  ON barrel_oils
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Nur authentifizierte Benutzer können Fässer aktualisieren
CREATE POLICY "Allow authenticated users to update barrel oils"
  ON barrel_oils
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Nur authentifizierte Benutzer können Fässer löschen
CREATE POLICY "Allow authenticated users to delete barrel oils"
  ON barrel_oils
  FOR DELETE
  TO authenticated
  USING (true);

-- Historie: Lesen für alle authentifizierten Benutzer
CREATE POLICY "Allow authenticated users to read barrel oil history"
  ON barrel_oil_history
  FOR SELECT
  TO authenticated
  USING (true);

-- Historie: Erstellen für alle authentifizierten Benutzer
CREATE POLICY "Allow authenticated users to insert barrel oil history"
  ON barrel_oil_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =============================================================================
-- STORAGE: Bucket für Fassöl-Bilder
-- =============================================================================

-- Bucket erstellen (falls nicht vorhanden)
INSERT INTO storage.buckets (id, name, public)
VALUES ('barrel-oils', 'barrel-oils', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Authenticated users can upload barrel oil images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'barrel-oils');

CREATE POLICY "Public can view barrel oil images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'barrel-oils');

CREATE POLICY "Authenticated users can update their barrel oil images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'barrel-oils')
  WITH CHECK (bucket_id = 'barrel-oils');

CREATE POLICY "Authenticated users can delete barrel oil images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'barrel-oils');
