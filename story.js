'use strict';

/*
 * Die unsichtbare Uhr – Erzählinhalte
 * Hier stehen alle Texte, die man ohne Programmierkenntnisse anpassen kann:
 * Prolog, Szenen, Zeitzeuginnen, Entscheidungsmomente und echte Zahlen.
 *
 * Wirkungen eines Entscheidungsmoments (effect):
 *   hours: { n, kind, label }  Stunden, die fest verplant sind.
 *          kind: 'E' bezahlte Arbeit, 'C' Care für den eigenen Haushalt,
 *                'O' unbezahlte Care für andere (zählt nirgends),
 *                'F' anderes Unbezahltes (z. B. Versammlung)
 *   money: Geld, das dazu kommt oder abgeht
 *   need:  zusätzlicher Care-Bedarf im eigenen Haushalt (Stunden)
 *   wb:    Änderung des Wohlbefindens im eigenen Haushalt
 *   tired: true = morgen erschöpft
 */

const PROLOG = [
  {
    kicker: 'Bevor es losgeht',
    title: 'Wer hat dich heute versorgt?',
    body: [
      'Wer hat heute Frühstück gemacht, die Wäsche gewaschen, die Großmutter angerufen, an den Arzttermin gedacht?',
      'Denk kurz an eine Person. Wurde sie dafür bezahlt?'
    ],
    short: 'Denk an eine Person, die dich heute versorgt hat. Wurde sie dafür bezahlt?'
  },
  {
    kicker: 'Worum es geht',
    title: 'Care-Arbeit',
    body: [
      'Kochen, putzen, Kinder großziehen, Kranke pflegen, Alte begleiten, trösten, organisieren. Ohne diese Arbeit läuft keine Fabrik und kein Büro.',
      'Manchmal wird sie bezahlt, als Beruf in Pflege oder Haushalt. Meistens nicht.'
    ],
    items: ['Kochen und Putzen', 'Kinder betreuen', 'Kranke und Alte pflegen', 'Organisieren und Mitdenken'],
    short: 'Care-Arbeit heißt: kochen, putzen, Kinder betreuen, pflegen, organisieren. Meistens unbezahlt.'
  },
  {
    kicker: 'So spielst du',
    title: 'Deine 16 Stunden',
    body: [
      'Ihr spielt vier Tage in vier Epochen. Jeden Tag verteilst du am Handy deine 16 wachen Stunden.',
      'Dein Haushalt braucht jeden Tag eine bestimmte Menge Care. Fehlt sie, sinkt das Wohlbefinden, und morgen arbeiten alle schlechter. Wer sich unter 4 Stunden erholt, ist am nächsten Tag erschöpft.',
      'Vor jedem Tag triffst du eine Entscheidung, die zu deiner Rolle passt.'
    ],
    legend: true,
    short: 'Jeden Tag: erst eine Entscheidung, dann 16 Stunden verteilen. Achte auf deinen Haushalt und deine Erholung.'
  },
  {
    kicker: 'Die Regel des Spiels',
    title: 'Gezählt wird nur Geld',
    body: [
      'Die Rangliste am Beamer zeigt nur das Einkommen. So wie das Bruttoinlandsprodukt.',
      'Alles andere schreibt das Spiel still mit. Am Ende kommt es auf den Tisch.'
    ],
    timeline: true,
    short: 'Die Rangliste zählt nur Geld. Alles andere wird still mitgeschrieben und am Ende gezeigt.'
  }
];

const STORY = {
  'ganzes-haus': {
    scene: 'Es ist halb fünf Uhr früh im Waldviertel. Im Stall brüllen die Kühe, in der Stube ist das Feuer aus. Kein Mensch fragt, was hier Arbeit ist und was Familie. Alles muss gemacht werden.',
    witness: {
      name: 'Theresia',
      age: 62,
      who: 'Altbäuerin bei Zwettl',
      quote: 'Ich hab den Hof vor drei Jahren meinem Sohn übergeben. Seitdem schlaf ich in der Kammer neben der Küche. Ich koch, ich hüt die Kleinen, ich sitz bei den Kranken. Bezahlt hat mich nie wer. Aber gegessen haben alle.',
      background: 'Bis ins 19. Jahrhundert war der bäuerliche Haushalt Wohn- und Wirtschaftsgemeinschaft zugleich. Der Historiker Otto Brunner hat dafür den Begriff „das ganze Haus“ geprägt.'
    },
    dilemmas: [
      {
        q: 'Ein Viehhändler kommt vorbei. Er nimmt dich mit zum Markt nach Zwettl, dort kannst du gut verkaufen.',
        options: [
          { label: 'Zum Markt fahren', effect: { hours: { n: 4, kind: 'E', label: 'Markt in Zwettl' }, money: 2 }, text: 'Du verkaufst zwei Kälber. Daheim fehlt eine Hand.' },
          { label: 'Am Hof bleiben', effect: { hours: { n: 2, kind: 'C', label: 'Holz für den Herd' } }, text: 'Du hackst Holz für Herd und Waschkessel. Das sieht niemand als Arbeit.' }
        ]
      },
      {
        q: 'Die Nachbarin liegt in den Wehen und schickt ihre Tochter nach dir.',
        options: [
          { label: 'Hinübergehen', effect: { hours: { n: 3, kind: 'O', label: 'Geburtshilfe nebenan' } }, text: 'Du hilfst drei Stunden bei der Geburt. Im eigenen Haus bleibt das liegen.' },
          { label: 'Am Hof bleiben', effect: { wb: -6 }, text: 'Im Dorf wird geredet. Morgen schaut niemand bei euch vorbei, wenn ihr Hilfe braucht.' }
        ]
      },
      {
        q: 'Die Bäuerin sagt, du kannst am Sonntag deine kranke Mutter im Nachbardorf besuchen.',
        options: [
          { label: 'Zur Mutter gehen', effect: { hours: { n: 4, kind: 'O', label: 'Besuch bei der Mutter' } }, text: 'Du wäscht deine Mutter und kochst für sie. Diese Stunden zählt kein Hof.' },
          { label: 'Am Hof bleiben', effect: { hours: { n: 2, kind: 'E', label: 'Extra-Dienst im Stall' }, wb: 3 }, text: 'Die Bäuerin ist zufrieden. Deine Mutter bleibt allein.' }
        ]
      },
      {
        q: 'Die Jungen wollen aufs Feld. Die drei Enkelkinder sollen den ganzen Tag bei dir bleiben.',
        options: [
          { label: 'Ja, ich nehm sie', effect: { hours: { n: 4, kind: 'C', label: 'Enkelkinder hüten' } }, text: 'Dein Rücken schmerzt, aber die Ernte kommt ein.' },
          { label: 'Nein, mein Rücken', effect: { need: 3 }, text: 'Jemand anderer muss die Kinder nehmen. Euer Haushalt braucht heute 3 Stunden mehr Care.' }
        ]
      }
    ]
  },

  sphaeren: {
    scene: 'Wien, ein Zinshaus in Ottakring, sechs Uhr früh. Die Fabriksirene heult. In der Bassena am Gang steht schon die erste Frau mit dem Wasserkübel. In der Josefstadt läutet eine gnädige Frau nach ihrem Dienstmädchen.',
    witness: {
      name: 'Marie',
      age: 19,
      who: 'Dienstmädchen aus Mähren, in der Josefstadt',
      quote: 'Um fünf heiz ich den Ofen, um zehn in der Nacht putz ich die Schuhe. Ein freier Nachmittag alle zwei Wochen, wenn die gnädige Frau gut aufgelegt ist. Mein Lohn geht zur Hälfte nach Haus. Meine eigene Mutter hab ich seit einem Jahr nicht gesehen.',
      background: 'Um 1900 arbeiteten in Wien zehntausende Dienstmädchen, viele aus Böhmen und Mähren. Ein eigenes Arbeitsrecht mit geregelter Freizeit brachte erst das Hausgehilfengesetz von 1920.'
    },
    dilemmas: [
      {
        q: 'Der Vorarbeiter bietet dir eine Sonntagsschicht an. Gut bezahlt, aber dann gibt es keinen freien Tag.',
        options: [
          { label: 'Schicht annehmen', effect: { hours: { n: 4, kind: 'E', label: 'Sonntagsschicht' }, tired: true }, text: 'Mehr Lohn diese Woche. Morgen bist du erschöpft.' },
          { label: 'Mit den Kindern in den Prater', effect: { hours: { n: 2, kind: 'C', label: 'Prater mit den Kindern' }, wb: 5 }, text: 'Die Kinder reden noch tagelang davon. In der Kasse fehlt nichts, aber es kommt auch nichts dazu.' }
        ]
      },
      {
        q: 'Eine Nachbarin bringt Heimarbeit: Knöpfe annähen, bezahlt pro Stück. Die Wäsche ist aber noch nicht gemacht.',
        options: [
          { label: 'Heimarbeit annehmen', effect: { hours: { n: 3, kind: 'E', label: 'Knöpfe annähen' }, need: 2 }, text: 'Ein paar Kreuzer mehr. Die Wäsche wartet bis morgen, der Bedarf steigt um 2 Stunden.' },
          { label: 'Erst die Wäsche', effect: { hours: { n: 3, kind: 'C', label: 'Waschküche' } }, text: 'Drei Stunden an der Waschrumpel. Niemand zahlt dafür.' }
        ]
      },
      {
        q: 'Ein Brief von deiner Schwester aus Mähren: Die Mutter ist krank und kann nicht mehr arbeiten.',
        options: [
          { label: 'Geld nach Hause schicken', effect: { money: -3 }, text: 'Du schickst ihr fast einen Wochenlohn. Für dich bleibt wenig.' },
          { label: 'Nichts schicken', effect: { wb: -8 }, text: 'Du behältst dein Geld. Zu Hause sorgt sich niemand um die Mutter. Dein Haushalt leidet mit.' }
        ]
      },
      {
        q: 'Großer Auftrag für Uniformen: Wer bis Mitternacht bleibt, bekommt einen Zuschlag.',
        options: [
          { label: 'Bis Mitternacht nähen', effect: { hours: { n: 3, kind: 'E', label: 'Nachtarbeit' }, money: 2, tired: true }, text: 'Zuschlag kassiert. Deine Augen brennen, morgen bist du erschöpft.' },
          { label: 'Pünktlich heimgehen', effect: { hours: { n: 2, kind: 'C', label: 'Abendessen kochen' } }, text: 'Du kochst für alle. Die Meisterin merkt sich, wer früh gegangen ist.' }
        ]
      }
    ]
  },

  lohn: {
    scene: 'Wien-Favoriten, Gemeindebau, Oktober 1975. Im Radio kommt eine Meldung aus Island: Dort haben fast alle Frauen einen Tag lang die Arbeit niedergelegt, das ganze Land steht still. Am Küchentisch wird diskutiert.',
    witness: {
      name: 'Gerti',
      age: 34,
      who: 'Verkäuferin im Konsum, Favoriten',
      quote: 'Vormittags steh ich an der Kassa, nachmittags in der Küche. Wenn ich sag, ich hab heut viel gearbeitet, meint mein Mann nur die Kassa. In Island, hör ich, haben die Frauen einfach aufgehört. Da hat man auf einmal gesehen, wer alles macht.',
      background: 'Am 24. Oktober 1975 legten in Island rund 90 Prozent der Frauen bezahlte und unbezahlte Arbeit nieder. Seit 1972 forderte die Kampagne „Wages for Housework“ Lohn für Hausarbeit. In Österreich beendete die Familienrechtsreform 1975 das Leitbild des Mannes als Familienoberhaupt.'
    },
    dilemmas: [
      {
        q: 'Deine Frau will wieder Vollzeit arbeiten. Übernimmst du das Abholen vom Kindergarten?',
        options: [
          { label: 'Ja, ich hol ab', effect: { hours: { n: 3, kind: 'C', label: 'Kindergarten und Einkauf' }, money: -2 }, text: 'Keine Überstunden mehr für dich. Im Büro schaut man dich schief an.' },
          { label: 'Nein, das geht nicht', effect: { wb: -6 }, text: 'Deine Frau bleibt bei Teilzeit. Die Stimmung daheim ist angespannt.' }
        ]
      },
      {
        q: 'Die Kolleginnen laden zu einer Frauenversammlung am Abend ein. Thema: Lohn für Hausarbeit.',
        options: [
          { label: 'Zur Versammlung', effect: { hours: { n: 2, kind: 'F', label: 'Frauenversammlung' } }, text: 'Zwei Stunden reden, streiten, Pläne machen. Bezahlt wird das nicht, aber es verändert was.' },
          { label: 'Daheim bleiben', effect: { hours: { n: 2, kind: 'C', label: 'Abwasch und Hausaufgaben' } }, text: 'Du machst den Abwasch und hilfst bei den Hausaufgaben. Wie immer.' }
        ]
      },
      {
        q: 'Der Filialleiter fragt, ob du am Samstag länger bleibst. Die Kinder wären dann allein.',
        options: [
          { label: 'Länger bleiben', effect: { hours: { n: 3, kind: 'E', label: 'Samstagsdienst' }, need: 2 }, text: 'Mehr Lohn. Die Kinder sind allein, der Haushalt braucht 2 Stunden mehr Care.' },
          { label: 'Ablehnen', effect: { money: -2 }, text: 'Er sagt nichts. Bei der nächsten Gehaltsrunde wirst du übergangen.' }
        ]
      },
      {
        q: 'Die Oma braucht jemanden, der mit ihr zum Arzt geht. Morgen hast du eine Prüfung.',
        options: [
          { label: 'Mit der Oma gehen', effect: { hours: { n: 3, kind: 'C', label: 'Arztbesuch mit der Oma' } }, text: 'Drei Stunden im Wartezimmer. Die Oma ist froh, du lernst in der Nacht.' },
          { label: 'Für die Prüfung lernen', effect: { need: 3 }, text: 'Jemand anderer im Haushalt muss einspringen. Der Bedarf steigt um 3 Stunden.' }
        ]
      }
    ]
  },

  ketten: {
    scene: 'Wien, heute. Eine Managerin beantwortet um 6:40 Uhr E-Mails, während die Kinder frühstücken. 800 Kilometer weiter östlich bringt eine Großmutter ihre Enkelin zur Schule, weil deren Mutter in Wien eine fremde alte Frau pflegt.',
    witness: {
      name: 'Ioana',
      age: 51,
      who: '24-Stunden-Betreuerin aus Suceava, Rumänien',
      quote: 'Zwei Wochen bin ich in Wien bei Frau Hofer, zwei Wochen daheim. Ich kenn ihre Tabletten auswendig, ihre Lieblingslieder auch. Meine Tochter seh ich am Handy. Wenn sie weint, kann ich nur zuhören. Meine Mutter passt auf sie auf. Wer passt auf meine Mutter auf?',
      background: 'Österreich hat die 24-Stunden-Betreuung 2007 legalisiert. Mehr als vier Fünftel der Betreuerinnen kommen aus Rumänien und der Slowakei. Arlie Hochschild nennt solche Verkettungen „globale Care-Ketten“.'
    },
    dilemmas: [
      {
        q: 'Um 17 Uhr ist ein Call mit New York. Zur selben Zeit hat deine Tochter ihre Schulaufführung.',
        options: [
          { label: 'Den Call machen', effect: { money: 4, wb: -6 }, text: 'Der Deal steht. Deine Tochter hat dich im Publikum gesucht.' },
          { label: 'Zur Aufführung', effect: { hours: { n: 2, kind: 'C', label: 'Schulaufführung' }, money: -3 }, text: 'Du sitzt in der ersten Reihe. Beim Bonus wird das vermerkt.' }
        ]
      },
      {
        q: 'Die Station ist unterbesetzt. Die Stationsleitung bittet dich, einen Zusatzdienst zu übernehmen.',
        options: [
          { label: 'Zusatzdienst machen', effect: { hours: { n: 4, kind: 'E', label: 'Zusatzdienst' }, tired: true }, text: 'Die Patientinnen sind versorgt. Morgen bist du erschöpft.' },
          { label: 'Nein sagen', effect: { wb: 3 }, text: 'Eine Kollegin übernimmt. Morgen fehlt sie bei sich zu Hause.' }
        ]
      },
      {
        q: 'Es regnet, die App zahlt heute einen Zuschlag. Dein Vater wartet darauf, dass du mit ihm einkaufen gehst.',
        options: [
          { label: 'Fahren, solange es Zuschlag gibt', effect: { hours: { n: 3, kind: 'E', label: 'Zuschlagsfahrten' }, money: 2, need: 2 }, text: 'Mehr Geld. Dein Vater wartet, der Haushalt braucht 2 Stunden mehr Care.' },
          { label: 'Mit dem Vater einkaufen', effect: { hours: { n: 2, kind: 'C', label: 'Einkauf mit dem Vater' } }, text: 'Ihr geht gemeinsam. Die App zeigt dich als „inaktiv“.' }
        ]
      },
      {
        q: 'Videoanruf: Deine Tochter weint. Die Agentur fragt, ob du zwei Wochen verlängerst.',
        options: [
          { label: 'Verlängern', effect: { money: 4, wb: -10 }, text: 'Mehr Geld für die Familie. Deine Tochter fragt nicht mehr, wann du kommst.' },
          { label: 'Nach Hause fahren', effect: { money: -4, wb: 5 }, text: 'Du fährst heim. Die Agentur schickt eine andere Frau, dir fehlt ein halber Monatslohn.' }
        ]
      }
    ]
  }
};

/* Echte Zahlen für die Bilanz. Jede Zahl mit Quelle. */
const FACTS = {
  austria: {
    title: 'Österreich, 2021/22',
    women: { unpaid: '3:58', paid: '2,2' },
    men: { unpaid: '2:26', paid: '3,6' },
    careHours: { women: 3.6, men: 2.1 },
    note: 'Durchschnitt pro Tag, alle Personen ab 10 Jahren, Montag bis Sonntag. Unbezahlte Arbeit in Std:Min, Erwerbstätigkeit in Stunden.',
    source: 'Statistik Austria, Zeitverwendungserhebung 2021/22'
  },
  world: {
    hours: '16,4 Mrd.',
    share: '76,2 %',
    text: 'Stunden unbezahlte Care-Arbeit werden weltweit jeden Tag geleistet. Das entspricht zwei Milliarden Menschen, die acht Stunden täglich ohne Lohn arbeiten.',
    shareText: 'davon leisten Frauen, mehr als dreimal so viel wie Männer.',
    source: 'ILO, Care work and care jobs for the future of decent work (2018)'
  },
  chains: {
    value: 'über 80 %',
    text: 'der 24-Stunden-Betreuerinnen in Österreich kommen aus Rumänien und der Slowakei.',
    source: 'APA nach Daten der Wirtschaftskammer'
  }
};

module.exports = { PROLOG, STORY, FACTS };
