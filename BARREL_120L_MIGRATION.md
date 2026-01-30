# 120L Barrel Size Migration

## Beschreibung
Diese Migration fügt **120 Liter** als neue Fassgröße zur `barrel_oils` Tabelle hinzu.

## Änderungen
- Erweitert die `barrel_size` CHECK Constraint um `120`
- Ermöglicht das Speichern von 120L Fässern (bisher nur 60L und 208L)

## Manuelle Ausführung

### Option 1: Supabase Dashboard (Empfohlen)
1. Gehe zum [Supabase Dashboard](https://supabase.com/dashboard)
2. Wähle dein Projekt aus
3. Navigiere zu **SQL Editor**
4. Kopiere den folgenden SQL-Code und führe ihn aus:

```sql
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
```

5. Klicke auf **Run** (oder drücke `Cmd/Ctrl + Enter`)

### Option 2: Lokale Supabase CLI
```bash
npx supabase migration up --db-url "postgresql://..."
```

## Verifizierung

Nach der Migration solltest du Fässer mit 120L Größe erstellen und bearbeiten können, ohne einen Fehler zu erhalten.

Du kannst die Constraint überprüfen mit:
```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'barrel_oils'::regclass
  AND conname = 'barrel_oils_barrel_size_check';
```

## Rollback

Falls du die Änderung rückgängig machen möchtest:
```sql
ALTER TABLE barrel_oils
  DROP CONSTRAINT IF EXISTS barrel_oils_barrel_size_check;

ALTER TABLE barrel_oils
  ADD CONSTRAINT barrel_oils_barrel_size_check
  CHECK (barrel_size IN (60, 208));
```
