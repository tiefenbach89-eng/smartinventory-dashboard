-- Add missing UPDATE and DELETE policies for barrel_oil_history table
-- These policies allow authenticated users to edit and delete history entries

-- Allow authenticated users to update barrel oil history
CREATE POLICY "Allow authenticated users to update barrel oil history"
  ON barrel_oil_history
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete barrel oil history
CREATE POLICY "Allow authenticated users to delete barrel oil history"
  ON barrel_oil_history
  FOR DELETE
  TO authenticated
  USING (true);
