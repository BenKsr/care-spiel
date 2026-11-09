# Die unsichtbare Uhr

Ein Mehrspieler-Spiel über Care-Arbeit von 1850 bis heute, für etwa 8 bis 24 Personen und rund 30 Minuten. Gespielt wird mit Beamer (Spielleitung) und Handys.

Jede Person verteilt pro Runde 16 wache Stunden auf Erwerbsarbeit, Care daheim, Care gegen Lohn und Erholung. Die Rangliste am Beamer zählt nur Einkommen. Die Care-Stunden werden mitgeschrieben und erst in der Bilanz gezeigt.

## Ablauf (ca. 30 Minuten)

1. **Prolog am Beamer (2 Min.)**: vier Folien zum Durchklicken. Einstiegsfrage, was Care-Arbeit ist, wie man spielt, und die Regel: gezählt wird nur Geld. Die Handys zeigen eine Kurzfassung und am Ende den eigenen Haushalt.
2. **Vier Tage, je ca. 5 Min.**:
   - *Epochen-Intro*: Szene und eine Zeitzeugin (fiktive, historisch typische Figur mit Hintergrund-Quelle). Am Handy sieht man Rolle und Haushalt.
   - *Entscheidungsmoment*: Jede Person bekommt ein Dilemma passend zu ihrer Rolle. Die Wahl verplant Stunden fest oder verändert Geld, Care-Bedarf oder Wohlbefinden.
   - *Stunden verteilen*: „Tag beginnen“ startet einen 90-Sekunden-Timer.
   - *Auswertung*: Haushaltsbuch und Rangliste.
3. **Bilanz in fünf Schritten**: offizielle Rangliste, was nicht gezählt wurde, Wohlbefinden der Haushalte, echte Zahlen (Statistik Austria, ILO), Diskussion. Am Handy bekommt jede Person eine persönliche Bilanzkarte.

| Runde | Epoche | Neue Regel |
|---|---|---|
| 1 | 1850 · Das ganze Haus | Care zählt zur Hälfte als Produktion |
| 2 | 1910 · Getrennte Sphären | Hausfrau ohne Erwerbsarbeit, Dienstmädchen, reiche Haushalte kaufen Care zu |
| 3 | 1975 · Lohn für Hausarbeit | Streik möglich, Abstimmung über Lohn für Hausarbeit |
| 4 | 2026 · Doppelschicht und Care-Ketten | Öffentliche Kinderbetreuung, 24h-Betreuerin aus einem anderen Haushalt |


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

- `story.js` – alle Erzähltexte: Prolog, Szenen, Zeitzeuginnen, Entscheidungsmomente, echte Zahlen mit Quellen. Hier lassen sich Texte ohne Programmierkenntnisse ändern.
- `game.js` – Epochen, Rollen, Ereignisse, Auswertung. Hier lassen sich Löhne und Regeln anpassen.
- `server.js` – Webserver und Echtzeitverbindung (Socket.IO)
- `public/index.html`, `public/player.js` – Handy-Ansicht
- `public/leitung.html`, `public/host.js` – Spielleitung
- `public/style.css` – gemeinsames Design

## Tipps für die Spielleitung

- Die Zeitzeugin kurz vorlesen, dann „Tag beginnen · 90 Sek.“ drücken. Am Handy läuft der Countdown mit.
- Wer die Karte nicht abgibt, spielt mit dem aktuellen Entwurf.
- Nach jeder Runde kurz auf die Tabelle zeigen: Wo fehlt Care, wer hat gekauft, wer steht oben auf der Rangliste?
- Lade die Leitungsseite nicht in einem privaten Fenster, sonst geht nach einem Neuladen die Spielleitung verloren.
