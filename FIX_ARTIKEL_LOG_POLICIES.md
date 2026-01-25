# Fix: Artikel Log RLS Policy Error

## Problem
Bei Ein- und Ausbuchungen erscheint die Fehlermeldung: "new row violates row-level security policy for table 'artikel_log'", obwohl die Buchung funktioniert.

## Ursache
Fehlende RLS (Row Level Security) Policies für INSERT, UPDATE, DELETE Operationen auf der `artikel_log` Tabelle.

## Lösung

### Option 1: Über Supabase Dashboard SQL Editor (Empfohlen)

1. Gehen Sie zu **SQL Editor** im Supabase Dashboard
2. Führen Sie folgendes SQL aus:

```sql
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

-- Allow authenticated users to update artikel_log
CREATE POLICY "Allow authenticated users to update artikel_log"
  ON artikel_log
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete artikel_log
CREATE POLICY "Allow authenticated users to delete artikel_log"
  ON artikel_log
  FOR DELETE
  TO authenticated
  USING (true);
```

3. Klicken Sie auf **Run**

### Option 2: Supabase CLI

```bash
npx supabase db push
```

## Testen

Nach dem Hinzufügen der Policies:

1. Gehen Sie zu **Produkte** Seite
2. Buchen Sie einen Artikel ein oder aus
3. Die Buchung sollte ohne Fehlermeldung funktionieren

## Hinweis

Diese Policies erlauben allen authentifizierten Benutzern das Lesen, Schreiben und Löschen von Log-Einträgen. Die App-Logik kontrolliert, wer welche Aktionen durchführen darf (Employee kann nur ausbuchen, Manager/Admin können ein- und ausbuchen).
