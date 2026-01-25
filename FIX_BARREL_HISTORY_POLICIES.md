# Fix: Barrel Oil History Edit/Delete nicht möglich

## Problem
Das Bearbeiten und Löschen von Barrel Oil History-Einträgen funktioniert nicht, obwohl eine Erfolgsmeldung angezeigt wird.

## Ursache
Fehlende RLS (Row Level Security) Policies für UPDATE und DELETE Operationen auf der `barrel_oil_history` Tabelle.

## Lösung

### Option 1: Über Supabase Dashboard (Empfohlen)

1. Gehen Sie zu Ihrem Supabase Dashboard: https://supabase.com/dashboard
2. Wählen Sie Ihr Projekt aus
3. Navigieren Sie zu **Database** → **Policies**
4. Suchen Sie nach der Tabelle `barrel_oil_history`
5. Fügen Sie folgende zwei Policies hinzu:

#### Policy 1: Update Permission
- **Name**: `Allow authenticated users to update barrel oil history`
- **Command**: `UPDATE`
- **Target roles**: `authenticated`
- **USING expression**: `true`
- **WITH CHECK expression**: `true`

#### Policy 2: Delete Permission
- **Name**: `Allow authenticated users to delete barrel oil history`
- **Command**: `DELETE`
- **Target roles**: `authenticated`
- **USING expression**: `true`

### Option 2: SQL Editor (Schneller)

1. Gehen Sie zu **SQL Editor** im Supabase Dashboard
2. Führen Sie folgendes SQL aus:

\`\`\`sql
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
\`\`\`

3. Klicken Sie auf **Run** oder **F5**

### Option 3: Supabase CLI (falls konfiguriert)

Wenn Sie die Supabase CLI eingerichtet haben:

\`\`\`bash
npx supabase db push
\`\`\`

Die Migration `20260125_add_barrel_history_update_delete_policies.sql` wird automatisch ausgeführt.

## Testen

Nach dem Hinzufügen der Policies:

1. Gehen Sie zu **Barrel Oils** Seite
2. Öffnen Sie die Historie eines Ölfasses
3. Versuchen Sie, einen Eintrag zu bearbeiten oder zu löschen
4. Die Änderungen sollten jetzt erfolgreich gespeichert werden

## Hinweis

Diese Policies erlauben allen authentifizierten Benutzern das Bearbeiten und Löschen von History-Einträgen. Falls Sie die Berechtigungen einschränken möchten (z.B. nur Admins), können Sie die USING-Bedingungen entsprechend anpassen.
