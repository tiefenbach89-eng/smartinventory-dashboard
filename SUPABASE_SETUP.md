# Supabase Setup Anleitung

## Schritt 1: Supabase-Zugangsdaten abrufen

1. Öffnen Sie Ihr Supabase-Dashboard: https://supabase.com/dashboard
2. Wählen Sie Ihr Projekt aus (oder erstellen Sie ein neues)
3. Gehen Sie zu: **Settings** → **API**
4. Kopieren Sie folgende Werte:
   - **Project URL** (z.B. `https://abcdefghijklmnop.supabase.co`)
   - **anon/public key** (ein langer JWT-Token)

## Schritt 2: .env.local Datei erstellen

1. Erstellen Sie eine neue Datei im Projektverzeichnis: `.env.local`
2. Fügen Sie folgende Zeilen ein:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ihre-projekt-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ihr-anon-key-hier
```

3. Ersetzen Sie die Werte mit Ihren echten Supabase-Zugangsdaten

**Beispiel:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xyzabcdef123456.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emFiY2RlZjEyMzQ1NiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE5MTU2MDAwMDB9.abcdefghijklmnopqrstuvwxyz1234567890
```

## Schritt 3: Datenbank-Migrationen ausführen

Nachdem Sie die `.env.local` Datei erstellt haben, führen Sie die SQL-Migrationen aus:

### Option A: Über Supabase Dashboard (Empfohlen)
1. Gehen Sie zu: **SQL Editor** in Ihrem Supabase-Dashboard
2. Öffnen Sie die Datei: `supabase/migrations/20260121_create_barrel_oils.sql`
3. Kopieren Sie den gesamten Inhalt
4. Fügen Sie ihn in den SQL Editor ein
5. Klicken Sie auf **Run**

### Option B: Über Supabase CLI
```bash
# Supabase CLI installieren (falls noch nicht geschehen)
npm install -g supabase

# Login
supabase login

# Migration ausführen
supabase db push
```

## Schritt 4: Server neu starten

Nachdem Sie die `.env.local` Datei erstellt haben, müssen Sie den Development-Server neu starten:

```bash
# Server stoppen (Strg+C im Terminal)
# Dann neu starten:
npm run dev
```

Der Server sollte nun ohne Fehler auf http://localhost:3000 laufen.

## Schritt 5: Anmelden und testen

1. Öffnen Sie http://localhost:3000 im Browser
2. Melden Sie sich an (oder registrieren Sie sich)
3. Klicken Sie auf "Fassöle" in der Sidebar
4. Fügen Sie Ihr erstes Fass hinzu

## Troubleshooting

### Fehler: "Your project's URL and Key are required"
→ Die `.env.local` Datei wurde nicht erstellt oder die Werte sind falsch
→ Überprüfen Sie, dass die Datei im Hauptverzeichnis liegt (nicht in einem Unterordner)
→ Starten Sie den Server neu nach dem Erstellen der Datei

### Fehler: "Invalid API key"
→ Der anon key ist falsch oder abgelaufen
→ Kopieren Sie den Key erneut aus dem Supabase-Dashboard

### Fehler: "Failed to fetch"
→ Die Project URL ist falsch
→ Überprüfen Sie, dass die URL mit `https://` beginnt und `.supabase.co` endet

### Datenbank-Tabellen fehlen
→ Die Migration wurde nicht ausgeführt
→ Führen Sie die SQL-Migration manuell über den SQL Editor aus

## Sicherheit

⚠️ **Wichtig:**
- Committen Sie die `.env.local` Datei **NIEMALS** in Git
- Die Datei ist bereits in `.gitignore` eingetragen
- Teilen Sie Ihre Keys niemals öffentlich

## Weitere Hilfe

- Supabase Dokumentation: https://supabase.com/docs
- API Settings: https://supabase.com/dashboard/project/_/settings/api
- SQL Editor: https://supabase.com/dashboard/project/_/sql
