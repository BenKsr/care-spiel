# Die unsichtbare Uhr

Ein Mehrspieler-Spiel über Care-Arbeit von 1850 bis heute, für etwa 8 bis 24 Personen und rund 60 Minuten.

Jede Person verteilt pro Runde 16 wache Stunden auf Erwerbsarbeit, Care daheim, Care gegen Lohn und Erholung. Die Rangliste am Beamer zählt nur Einkommen. Die Care-Stunden werden mitgeschrieben und erst in der Bilanz gezeigt.

## Ablauf

| Runde | Epoche | Neue Regel |
|---|---|---|
| 1 | 1850 · Das ganze Haus | Care zählt zur Hälfte als Produktion |
| 2 | 1910 · Getrennte Sphären | Hausfrau ohne Erwerbsarbeit, Dienstmädchen, reiche Haushalte kaufen Care zu |
| 3 | 1975 · Lohn für Hausarbeit | Streik möglich, Abstimmung über Lohn für Hausarbeit |
| 4 | 2026 · Doppelschicht und Care-Ketten | Öffentliche Kinderbetreuung, 24h-Betreuerin aus einem anderen Haushalt |

Danach folgt die Bilanz in vier Schritten: offizielle Rangliste, was nicht gezählt wurde, Wohlbefinden der Haushalte, Diskussionsfragen mit Zeitleiste.

**Mechanik in Kürze**
- 5 Haushalte in Wiener Bezirken, unterschiedlich wohlhabend. Rollen rotieren jede Runde.
- Jeder Haushalt hat einen Care-Bedarf, der durch Ereignisse steigt.
- Fehlende Care senkt das Wohlbefinden, und das senkt in der nächsten Runde die Produktivität aller im Haushalt.
- Unter 4 Stunden Erholung ist man am nächsten Tag erschöpft und schafft nur drei Viertel.
- Auf dem Care-Markt kaufen die Haushalte mit dem meisten Geld zuerst.

## Lokal starten

Voraussetzung: Node.js 18 oder neuer.

```bash
npm install
npm start
```

- Spielleitung (Beamer): http://localhost:3000/leitung
- Mitspielen (Handy): http://localhost:3000

Für ein Spiel im Kurs muss die App online sein, damit alle Handys sie erreichen.

## Kostenlos online stellen (Render)

1. Den Ordner als Repository auf GitHub hochladen.
2. Auf https://render.com mit GitHub anmelden, „New“ → „Web Service“ wählen und das Repository auswählen.
3. Einstellungen: Runtime **Node**, Build Command `npm install`, Start Command `npm start`, Plan **Free**.
4. Nach dem Deploy bekommst du eine Adresse wie `https://die-unsichtbare-uhr.onrender.com`.
   - Beamer: `…/leitung`
   - Handys: Code oder QR-Code vom Beamer

**Wichtig:** Der kostenlose Plan schläft nach etwa 15 Minuten ohne Nutzung ein. Öffne die Seite 2–3 Minuten vor Kursbeginn, dann ist sie wach. Der Spielstand liegt nur im Arbeitsspeicher. Ein Neustart des Servers beendet das laufende Spiel.

## Dateien

- `game.js` – Epochen, Rollen, Ereignisse, Auswertung. Hier lassen sich Löhne, Texte und Regeln anpassen.
- `server.js` – Webserver und Echtzeitverbindung (Socket.IO)
- `public/index.html`, `public/player.js` – Handy-Ansicht
- `public/leitung.html`, `public/host.js` – Spielleitung
- `public/style.css` – gemeinsames Design

## Tipps für die Spielleitung

- Pro Runde reichen 2–3 Minuten zum Verteilen. Mit den Timer-Knöpfen läuft am Handy ein Countdown mit.
- Wer die Karte nicht abgibt, spielt mit dem aktuellen Entwurf.
- Nach jeder Runde kurz auf die Tabelle zeigen: Wo fehlt Care, wer hat gekauft, wer steht oben auf der Rangliste?
- Lade die Leitungsseite nicht in einem privaten Fenster, sonst geht nach einem Neuladen die Spielleitung verloren.
