# AdBlue Migration

## Beschreibung
Diese Migration fügt **AdBlue** als neuen Flüssigkeitstyp zur `barrel_oils` Tabelle hinzu.

## Änderungen
- Erweitert die `liquid_type` CHECK Constraint um `'adblue'`
- Ermöglicht das Speichern von AdBlue-Kanistern in der Flüssigkeitsverwaltung

## Manuelle Ausführung

### Option 1: Supabase Dashboard (Empfohlen)
1. Gehe zum [Supabase Dashboard](https://supabase.com/dashboard)
2. Wähle dein Projekt aus
3. Navigiere zu **SQL Editor**
4. Kopiere den folgenden SQL-Code und führe ihn aus:

```sql
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
```

5. Klicke auf **Run** (oder drücke `Cmd/Ctrl + Enter`)

### Option 2: Lokale Supabase CLI
```bash
npx supabase migration up --db-url "postgresql://..."
```

## Verifizierung

Nach der Migration solltest du in der Flüssigkeitsverwaltung die Option "AdBlue (Kanister)" auswählen können.

Du kannst die Constraint überprüfen mit:
```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'barrel_oils'::regclass
  AND conname = 'barrel_oils_liquid_type_check';
```

## Rollback

Falls du die Änderung rückgängig machen möchtest:
```sql
ALTER TABLE barrel_oils
  DROP CONSTRAINT IF EXISTS barrel_oils_liquid_type_check;

ALTER TABLE barrel_oils
  ADD CONSTRAINT barrel_oils_liquid_type_check
  CHECK (liquid_type IN ('oil', 'windshield_washer', 'distilled_water'));
```
