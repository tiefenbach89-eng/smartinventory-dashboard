# Fassöle-Verwaltung - Vollständige Feature-Dokumentation

## Übersicht

Die erweiterte Fassöle-Verwaltung bietet umfassende Funktionen zur professionellen Verwaltung von 208L und 60L Fassölen in Ihrer Werkstatt.

## ✨ Alle Features

### 1. 📸 Drag & Drop Bildupload
- **Supabase Storage Integration**: Bilder werden sicher in Supabase Storage gespeichert
- **Drag & Drop**: Einfaches Hochladen per Drag & Drop oder Klick
- **Unterstützte Formate**: PNG, JPG, JPEG, WEBP
- **Maximale Größe**: 5MB
- **Automatische Validierung**: Dateityp und Größe werden geprüft
- **Preview**: Sofortige Vorschau des hochgeladenen Bildes
- **Löschen**: Bilder können jederzeit entfernt werden

### 2. 📋 Erweiterte Spezifikationen
- **ACEA Spezifikationen**: z.B. ACEA C2, C3
- **Freigaben**: z.B. PSA B71 2312-2022
- **Empfehlungen**: z.B. Fiat 9.55535-DS1 / 9.55535-GS1
- **Zusätzliche Spezifikationen**: Freitextfeld für weitere Details

### 3. 💰 Automatische Preisberechnung
- **EK-Preis (Einkaufspreis)**: Gesamtpreis des Fasses eingeben
- **Automatischer Literpreis**: Wird automatisch berechnet (EK-Preis / Kapazität)
- **Anzeige auf Karte**: Literpreis wird prominent auf der Fass-Karte angezeigt
- **4 Dezimalstellen**: Präzise Preisberechnung auf 0.0001 Euro

### 4. 🔗 Ölwegweiser Links
Direkte Links zu den Online-Ölwegweisern der großen Hersteller:
- **MPM**: Mehrsprachig (DE/EN/TR)
- **Castrol**: Mehrsprachig (DE/EN/TR)
- **Shell**: Mehrsprachig (DE/EN/TR)
- **Liqui Moly**: Mehrsprachig (DE/EN/TR)

Die Links öffnen sich automatisch in der richtigen Sprache basierend auf den Benutzereinstellungen.

### 5. 💵 Preis-Tracking bei Buchungen
**Beim Öl Hinzufügen:**
- Menge in Litern eingeben
- Aktuellen Preis pro Liter eingeben
- **Automatische Berechnung**: Gesamtkosten werden angezeigt
- **Speicherung**: Alle Preise werden in der Historie gespeichert

**Beim Öl Entnehmen:**
- Menge in Litern eingeben
- Preis pro Liter eingeben (für Kostenverfolgung)
- **Wertberechnung**: Zeigt den Wert des entnommenen Öls

### 6. 📊 Umfassende Historie
**Historie-Dialog mit drei Ansichten:**

#### Alle Buchungen
- Chronologische Auflistung aller Zu- und Entnahmen
- Übersichtskarten für:
  - **Gesamte Zubuchungen**: Liter + Euro
  - **Gesamte Entnahmen**: Liter + Euro

#### Nur Zubuchungen
- Gefilterte Ansicht aller Ölzufuhr
- **Summierung**:
  - Gesamte Liter
  - Gesamte Kosten in Euro
  - Anzahl der Transaktionen

#### Nur Entnahmen
- Gefilterte Ansicht aller Ölentnahmen
- **Summierung**:
  - Gesamte Liter
  - Gesamter Wert in Euro
  - Anzahl der Transaktionen

**Jeder Eintrag zeigt:**
- ✅ Menge in Litern (mit 2 Dezimalstellen)
- ✅ Preis pro Liter (mit 4 Dezimalstellen)
- ✅ Gesamtkosten in Euro
- ✅ Datum und Uhrzeit
- ✅ Benutzer (Name oder E-Mail)
- ✅ Grund (optional)
- ✅ Füllstand vorher → nachher

**Grafische Aufbereitung:**
- 🟢 Grüne Icons für Zubuchungen (TrendingUp)
- 🔴 Rote Icons für Entnahmen (TrendingDown)
- 📊 Summenkarten mit großen Zahlen
- 🎨 Farbcodierte Unterscheidung

### 7. 👤 Benutzer-Tracking
- **Automatisch**: Jede Buchung wird mit dem aktuellen Benutzer verknüpft
- **Name oder E-Mail**: Anzeige des Vollnamens wenn verfügbar, sonst E-Mail
- **User-ID**: Verknüpfung mit auth.users für vollständige Nachverfolgbarkeit

### 8. 🎨 Benutzerfreundliches Design
- **Moderne Karten**: CardModern-Komponenten mit Glasmorphismus
- **Responsive**: Perfekt auf Mobile, Tablet und Desktop
- **Dark/Light Mode**: Vollständige Unterstützung beider Themes
- **Farbcodierter Füllstand**:
  - 🟢 Grün: > 50%
  - 🟠 Orange: 20-50%
  - 🔴 Rot: < 20%
- **Fortschrittsbalken**: Visueller Füllstand mit Prozentanzeige
- **Badges**: Fassgröße prominent angezeigt

### 9. 🌍 Vollständige Mehrsprachigkeit
- **Deutsch**: Vollständig übersetzt
- **English**: Vollständig übersetzt
- **Türkçe**: Vollständig übersetzt
- **Dynamische Sprach wahl**: Automatischer Sprachwechsel
- **Ölwegweiser**: Links passen sich der Sprache an

## 🗄️ Datenbank-Struktur

### Tabelle: barrel_oils
```sql
- id (UUID)
- brand (TEXT) - Marke
- viscosity (TEXT) - Viskosität
- acea_specs (TEXT) - ACEA Spezifikationen
- approvals (TEXT) - Freigaben
- recommendations (TEXT) - Empfehlungen
- specifications (TEXT) - Weitere Spezifikationen
- barrel_size (INTEGER) - 60 oder 208
- max_capacity (DECIMAL) - Maximale Kapazität
- current_level (DECIMAL) - Aktueller Füllstand
- purchase_price (DECIMAL) - EK-Preis gesamt
- price_per_liter (DECIMAL) - Berechneter Literpreis
- location (TEXT) - Standort
- purchase_date (DATE) - Kaufdatum
- notes (TEXT) - Notizen
- image_url (TEXT) - Public URL des Bildes
- image_path (TEXT) - Storage-Pfad
- created_by (UUID) - Ersteller
- created_at, updated_at
```

### Tabelle: barrel_oil_history
```sql
- id (UUID)
- barrel_id (UUID) - Referenz zu barrel_oils
- action (TEXT) - 'add' oder 'remove'
- amount (DECIMAL) - Menge in Litern
- old_level (DECIMAL) - Füllstand vorher
- new_level (DECIMAL) - Füllstand nachher
- unit_price (DECIMAL) - Preis pro Liter
- total_cost (DECIMAL) - Gesamtkosten
- reason (TEXT) - Grund
- user_name (TEXT) - Name des Benutzers
- user_id (UUID) - User-ID
- created_at
```

### Storage Bucket: barrel-oils
- **Public Read**: Bilder sind öffentlich abrufbar
- **Authenticated Write**: Nur eingeloggte Benutzer können hochladen
- **Policies**: Vollständige RLS-Sicherheit

## 🚀 Verwendung

### Fass hinzufügen
1. **"Fass hinzufügen"** Button klicken
2. **Bild hochladen**: Per Drag & Drop oder Klick
3. **Grunddaten**:
   - Marke (z.B. Castrol)
   - Viskosität (z.B. 5W-30)
   - Fassgröße (60L oder 208L)
4. **Spezifikationen**:
   - ACEA (z.B. C2)
   - Freigaben (z.B. PSA B71 2312)
   - Empfehlungen (z.B. Fiat 9.55535-DS1)
5. **Preise**:
   - EK-Preis eingeben
   - Literpreis wird automatisch berechnet
6. **Füllstand**: Aktuellen Füllstand eingeben
7. **Optional**: Standort, Kaufdatum, Notizen

### Öl hinzufügen
1. **"Öl hinzufügen"** Button auf der Fass-Karte
2. **Menge** eingeben (z.B. 20 Liter)
3. **Preis pro Liter** eingeben
4. **Gesamtkosten** werden angezeigt
5. **Grund** optional angeben (z.B. "Nachfüllung vom Lieferanten")
6. **Bestätigen**

→ Buchung wird in der Historie gespeichert mit allen Details

### Öl entnehmen
1. **"Öl entnehmen"** Button auf der Fass-Karte
2. **Menge** eingeben (z.B. 5 Liter)
3. **Preis pro Liter** eingeben (für Wertberechnung)
4. **Grund** angeben (z.B. "Ölwechsel Kundenfahrzeug XY")
5. **Bestätigen**

→ Entnahme wird in der Historie gespeichert

### Historie anzeigen
1. **"Historie"** Button auf der Fass-Karte
2. **Tabs wählen**:
   - **Alle**: Komplette Historie
   - **Zubuchungen**: Nur Hinzufügungen
   - **Entnahmen**: Nur Entnahmen
3. **Analyse**:
   - Gesamtsummen in Liter und Euro
   - Einzelne Transaktionen mit allen Details
   - Zeitlicher Verlauf

### Ölwegweiser nutzen
- **Links oben** auf der Seite
- **Buttons** für MPM, Castrol, Shell, Liqui Moly
- **Automatisch** in der richtigen Sprache
- **Neues Fenster** öffnet sich

## 💡 Best Practices

1. **Regelmäßige Erfassung**: Tragen Sie Zu- und Entnahmen sofort ein
2. **Preise aktualisieren**: Geben Sie immer den aktuellen Preis an
3. **Gründe angeben**: Hilft bei der späteren Nachvollziehbarkeit
4. **Bilder verwenden**: Erleichtert die Identifikation
5. **Historie prüfen**: Regelmäßig Bestandsbewegungen kontrollieren

## 🔒 Sicherheit

- **RLS Policies**: Zugriffskontrolle auf Datenbank-Ebene
- **Authenticated Only**: Nur eingeloggte Benutzer haben Zugriff
- **Benutzer-Tracking**: Alle Änderungen werden protokolliert
- **Storage Policies**: Bilder sind geschützt
- **Validierung**: Alle Eingaben werden validiert

## 📱 Responsive Design

- **Mobile**: Optimiert für Smartphone-Nutzung
- **Tablet**: Perfekt auf iPad und Android Tablets
- **Desktop**: Volle Feature-Nutzung auf großen Bildschirmen
- **Touch-optimiert**: Große Buttons, einfache Bedienung

## 🎯 Vorteile

✅ **Überblick**: Immer wissen, wie viel Öl verfügbar ist
✅ **Kostenkontrolle**: Genaue Verfolgung aller Kosten
✅ **Bestandsführung**: Automatische Historie aller Bewegungen
✅ **Nachbestellung**: Rechtzeitig erkennen, wann nachbestellt werden muss
✅ **Nachverfolgbarkeit**: Vollständige Dokumentation
✅ **Compliance**: Erfüllung von Dokumentationspflichten
✅ **Effizienz**: Schneller Zugriff auf alle Informationen

## 🔧 Technische Details

**Frontend:**
- React 19
- Next.js 16
- TypeScript
- Tailwind CSS
- Shadcn/ui Components
- react-dropzone für Drag & Drop
- Recharts für Visualisierungen

**Backend:**
- Supabase (PostgreSQL)
- Supabase Storage
- Row Level Security (RLS)
- Real-time Updates

**Features:**
- Server Components
- Client Components
- API Routes
- Real-time Subscriptions
- Image Upload & Management
