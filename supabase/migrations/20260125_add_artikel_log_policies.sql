-- Add missing RLS policies for artikel_log table
-- This fixes the "new row violates row-level security policy" error

-- Allow authenticated users to insert into artikel_log
CREATE POLICY "Allow authenticated users to insert artikel_log"
  ON artikel_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to read artikel_log
CREATE POLICY "Allow authenticated users to read artikel_log"
  ON artikel_log
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to update artikel_log (for corrections)
CREATE POLICY "Allow authenticated users to update artikel_log"
  ON artikel_log
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete artikel_log (admins only via app logic)
CREATE POLICY "Allow authenticated users to delete artikel_log"
  ON artikel_log
  FOR DELETE
  TO authenticated
  USING (true);
