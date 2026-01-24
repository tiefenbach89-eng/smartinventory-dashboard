# Fassöle-Verwaltung - Setup Anleitung

## Übersicht

Die Fassöle-Verwaltung ermöglicht es Ihnen, 208L und 60L Fässer zu erfassen und zu verwalten. Sie können:

- Fässer mit allen wichtigen Informationen anlegen (Marke, Viskosität, Freigaben, etc.)
- Visuelle Füllstandsanzeige sehen
- Öl hinzufügen oder entnehmen per Button
- Bilder hochladen
- Historie der Füllstandsänderungen verfolgen

## Datenbank-Setup

### 1. Migration ausführen

Die SQL-Migration befindet sich in: `supabase/migrations/20260121_create_barrel_oils.sql`

**Option A: Über Supabase Dashboard**
1. Öffnen Sie Ihr Supabase-Projekt im Browser
2. Gehen Sie zu "SQL Editor"
3. Kopieren Sie den Inhalt der SQL-Datei
4. Führen Sie das SQL aus

**Option B: Über Supabase CLI**
```bash
supabase db push
```

### 2. Datenbank-Struktur

Die Migration erstellt zwei Tabellen:

#### `barrel_oils`
- Speichert alle Fässer mit ihren Details
- Felder: brand, viscosity, approvals, specifications, barrel_size, max_capacity, current_level, location, purchase_date, notes, image_url
- Validierung: current_level darf max_capacity nicht überschreiten

#### `barrel_oil_history`
- Speichert alle Füllstandsänderungen
- Felder: barrel_id, action (add/remove), amount, old_level, new_level, reason, user_name
- Automatische Timestamps

## Verwendung

### Navigation

Die neue "Fassöle" Option erscheint automatisch in der Sidebar zwischen "Produkte" und "Konten".

### Fass hinzufügen

1. Klicken Sie auf "Fass hinzufügen"
2. Füllen Sie die Pflichtfelder aus:
   - Marke (z.B. Castrol, Shell, Mobil)
   - Viskosität (z.B. 5W-30, 10W-40)
   - Fassgröße (60L oder 208L)
3. Optional weitere Details:
   - Freigaben (z.B. API SN, ACEA C3)
   - Spezifikationen
   - Standort
   - Kaufdatum
   - Notizen
   - Bild-URL
4. Klicken Sie auf "Speichern"

### Öl hinzufügen/entnehmen

1. Auf der Fass-Karte klicken Sie auf "Öl hinzufügen" oder "Öl entnehmen"
2. Geben Sie die Menge in Litern ein
3. Optional: Grund angeben (z.B. "Nachfüllung", "Ölwechsel")
4. Klicken Sie auf "Bestätigen"

Die Änderung wird automatisch in der Historie gespeichert.

### Visuelle Füllstandsanzeige

Jede Fass-Karte zeigt:
- **Grün**: > 50% voll
- **Orange**: 20-50% voll
- **Rot**: < 20% voll (Nachfüllung empfohlen)

## Mehrsprachigkeit

Die Fassöle-Verwaltung unterstützt:
- 🇩🇪 Deutsch
- 🇬🇧 English
- 🇹🇷 Türkçe

Die Sprache wechselt automatisch basierend auf den Benutzereinstellungen.

## Berechtigungen

- **Lesen**: Alle authentifizierten Benutzer können Fässer sehen
- **Erstellen/Bearbeiten/Löschen**: Alle authentifizierten Benutzer
- **Historie**: Alle Änderungen werden mit Benutzername und Zeitstempel protokolliert

## Technische Details

### Komponenten
- **Page**: `src/app/dashboard/barrel-oils/page.tsx`
- **Migration**: `supabase/migrations/20260121_create_barrel_oils.sql`
- **Übersetzungen**:
  - `i18n/messages/de.json`
  - `i18n/messages/en.json`
  - `i18n/messages/tr.json`

### Features
- ✅ Responsive Design (Mobile & Desktop)
- ✅ Echtzeit-Updates über Supabase
- ✅ Automatische Historie-Protokollierung
- ✅ Validierung (Füllstand kann Kapazität nicht überschreiten)
- ✅ Visuelle Fortschrittsbalken
- ✅ Image-Upload Support
- ✅ Dark/Light Mode Support

## Troubleshooting

### Fehler: "Tabelle existiert nicht"
→ Führen Sie die Migration aus (siehe Schritt 1)

### Fehler: "Permission denied"
→ Überprüfen Sie die RLS-Policies in Supabase

### Füllstand-Validierung schlägt fehl
→ Stellen Sie sicher, dass current_level <= max_capacity ist

## Support

Bei Fragen oder Problemen:
1. Überprüfen Sie die Browser-Konsole auf Fehler
2. Überprüfen Sie die Supabase-Logs
3. Stellen Sie sicher, dass die Migration erfolgreich war
