'use strict';

/*
 * Die unsichtbare Uhr – Spiellogik
 * Jede Runde ist ein Tag in einer Epoche. Jede Person verteilt 16 wache Stunden.
 * Die offizielle Rangliste zählt nur Einkommen. Care-Arbeit wird mitgeschrieben,
 * aber erst am Ende gezeigt.
 */

const HOURS = 16;
const EXHAUSTION_LIMIT = 4; // weniger Erholung als das -> nächste Runde erschöpft

const EPOCHS = [
  {
    id: 'ganzes-haus',
    year: '1850',
    title: 'Das ganze Haus',
    place: 'Bauernhof im Waldviertel',
    history: [
      'Bis weit ins 19. Jahrhundert sind Wohnen, Wirtschaften und Versorgen in bäuerlichen und handwerklichen Haushalten nicht getrennt. Zum Haushalt gehören Eltern, Kinder, Alte, Mägde und Knechte.',
      'Kochen, Pflegen, Kinder hüten und Feldarbeit sind Teile derselben Wirtschaft. Der Begriff „Hausarbeit“ als eigene, unbezahlte Sphäre existiert so noch nicht.'
    ],
    rule: 'Care-Stunden zählen zur Hälfte auch als Produktion des Hofes.',
    careProd: 0.5,
    publicCare: 0,
    market: false,
    strike: false,
    roles: [
      { name: 'Bauer', desc: 'Feld, Vieh, Markt.', wage: 2, maxE: 16, maxC: 16 },
      { name: 'Bäuerin', desc: 'Stall, Garten, Küche, Kinder – alles am Hof.', wage: 2, maxE: 16, maxC: 16 },
      { name: 'Magd', desc: 'Lebt mit am Hof, bekommt Kost, Logis und wenig Lohn.', wage: 1.5, maxE: 16, maxC: 16 },
      { name: 'Altbäuerin', desc: 'Hat den Hof übergeben, hilft, wo sie kann.', wage: 1, maxE: 8, maxC: 16 }
    ],
    events: [
      { text: 'Ein Kind hat Fieber.', hours: 6 },
      { text: 'Geburt im Haus.', hours: 10 },
      { text: 'Waschtag am Bach.', hours: 4 },
      { text: 'Der Großvater ist bettlägerig.', hours: 8 },
      { text: 'Ein ruhiger Tag.', hours: 0 },
      { text: 'Schlachttag: alles muss verarbeitet werden.', hours: 5 }
    ]
  },
  {
    id: 'sphaeren',
    year: '1910',
    title: 'Getrennte Sphären',
    place: 'Wien, Zinshaus in der Vorstadt',
    history: [
      'Mit der Industrialisierung wandert die Erwerbsarbeit in Fabrik und Büro. Das bürgerliche Ideal teilt die Welt: der Mann als Ernährer draußen, die Frau als Hausfrau drinnen.',
      'Wer es sich leisten kann, lagert Hausarbeit aus. In Wien arbeiten um 1900 zehntausende Dienstmädchen, viele aus Böhmen und Mähren, oft mit sehr langen Arbeitstagen und ohne geregelte Freizeit.'
    ],
    rule: 'Die Hausfrau darf höchstens 3 Stunden Heimarbeit machen. Das Dienstmädchen arbeitet gegen Lohn in fremden Haushalten. Haushalte mit Geld kaufen fehlende Care-Stunden zu.',
    careProd: 0,
    publicCare: 0,
    market: true,
    strike: false,
    roles: [
      { name: 'Fabrikarbeiter', desc: '11-Stunden-Schicht in der Ottakringer Fabrik.', wage: 4, maxE: 16, maxC: 2 },
      { name: 'Hausfrau', desc: 'Zuständig für alles daheim. Erwerbsarbeit nur als Heimarbeit.', wage: 1, maxE: 3, maxC: 16 },
      { name: 'Dienstmädchen', desc: 'Arbeitet und wohnt bei einer fremden Familie. Für die eigene bleibt wenig.', wage: 0, maxE: 0, maxC: 4, canB: true, wageB: 1.5 },
      { name: 'Näherin', desc: 'Akkordarbeit in der Werkstatt.', wage: 2.5, maxE: 16, maxC: 16 }
    ],
    events: [
      { text: 'Typhus in der Nachbarschaft.', hours: 6 },
      { text: 'Großer Waschtag in der Waschküche.', hours: 5 },
      { text: 'Ein Neugeborenes ist da.', hours: 10 },
      { text: 'Ein Bettgeher wohnt mit – Wäsche und Essen für eine Person mehr.', hours: 3 },
      { text: 'Ein ruhiger Tag.', hours: 0 },
      { text: 'Die Schwiegermutter liegt krank im Kabinett.', hours: 7 }
    ]
  },
  {
    id: 'lohn',
    year: '1975',
    title: 'Lohn für Hausarbeit',
    place: 'Wien, Gemeindebau',
    history: [
      '1972 startet in Padua die Kampagne „Wages for Housework“, getragen unter anderem von Selma James, Mariarosa Dalla Costa und Silvia Federici. Ihr Argument: Hausarbeit ist Arbeit, ohne die keine Fabrik läuft.',
      'Am 24. Oktober 1975 legen in Island die meisten Frauen bezahlte und unbezahlte Arbeit nieder, das Land steht still. In Österreich beendet die Familienrechtsreform Mitte der 1970er das Leitbild des Mannes als Familienoberhaupt.'
    ],
    rule: 'Heute kannst du streiken: keine Erwerbsarbeit, keine Care-Arbeit. Und ihr stimmt ab, ob in der nächsten Epoche Lohn für Hausarbeit gilt.',
    careProd: 0,
    publicCare: 0,
    market: false,
    strike: true,
    vote: true,
    roles: [
      { name: 'Angestellter', desc: 'Bürojob, 40-Stunden-Woche.', wage: 6, maxE: 16, maxC: 16 },
      { name: 'Hausfrau mit Teilzeitjob', desc: 'Vormittags Verkauf, nachmittags Familie.', wage: 4, maxE: 6, maxC: 16 },
      { name: 'Verkäuferin', desc: 'Vollzeit im Konsum.', wage: 4, maxE: 16, maxC: 16 },
      { name: 'Student', desc: 'Jobbt nebenbei, wohnt noch daheim.', wage: 3, maxE: 16, maxC: 16 }
    ],
    events: [
      { text: 'Masern im Kindergarten.', hours: 6 },
      { text: 'Die Schwiegermutter zieht ein.', hours: 8 },
      { text: 'Elternsprechtag.', hours: 2 },
      { text: 'Ein ruhiger Tag.', hours: 0 },
      { text: 'Umzug in eine größere Wohnung.', hours: 5 },
      { text: 'Der Opa braucht Hilfe beim Einkaufen und Waschen.', hours: 4 }
    ]
  },
  {
    id: 'ketten',
    year: '2026',
    title: 'Doppelschicht und Care-Ketten',
    place: 'Wien und 800 Kilometer weiter östlich',
    history: [
      'Arlie Hochschild beschreibt 1989 die „zweite Schicht“: Frauen sind erwerbstätig und erledigen danach weiterhin den Großteil der Hausarbeit. 2000 prägt sie den Begriff der globalen Care-Ketten.',
      'Österreich legalisiert 2007 die 24-Stunden-Betreuung. Betreuerinnen kommen vor allem aus Rumänien und der Slowakei, meist im Wechsel von mehreren Wochen. Ihre eigenen Familien müssen dann andere versorgen.'
    ],
    rule: 'Alle dürfen erwerbstätig sein. Jeder Haushalt bekommt 4 Stunden öffentliche Kinderbetreuung. Fehlende Care kann eingekauft werden: von der 24h-Betreuerin aus einem anderen Haushalt.',
    careProd: 0,
    publicCare: 4,
    market: true,
    strike: false,
    roles: [
      { name: 'Managerin', desc: 'Lange Tage, gutes Gehalt.', wage: 10, maxE: 16, maxC: 16 },
      { name: 'Pflegekraft', desc: 'Schichtdienst im Spital. Bezahlte Care, schlecht bezahlt.', wage: 5, maxE: 16, maxC: 16, eIsCare: true },
      { name: 'Lieferfahrer', desc: 'Plattformarbeit, bezahlt pro Fahrt.', wage: 4, maxE: 16, maxC: 16 },
      { name: '24h-Betreuerin', desc: 'Betreut eine Wiener Seniorin. Die eigene Familie ist 800 km entfernt.', wage: 0, maxE: 0, maxC: 2, canB: true, wageB: 3 }
    ],
    events: [
      { text: 'Schließtag im Kindergarten.', hours: 6 },
      { text: 'Die Mutter braucht nach einem Sturz Pflege.', hours: 10 },
      { text: 'Kind krank, Videokonferenz um 9.', hours: 5 },
      { text: 'Elternabend und zwei Arzttermine.', hours: 3 },
      { text: 'Ein ruhiger Tag.', hours: 0 },
      { text: 'Der Vater wird dement, Termine beim Pflegegeld-Amt.', hours: 7 }
    ]
  }
];

const HOUSEHOLDS = [
  { name: 'Hietzing', mult: 1.5 },
  { name: 'Ottakring', mult: 0.75 },
  { name: 'Josefstadt', mult: 1.2 },
  { name: 'Favoriten', mult: 0.7 },
  { name: 'Wieden', mult: 1.0 },
  { name: 'Simmering', mult: 0.85 }
];

const WFH_PAY = 2;   // Lohn pro Care-Stunde, falls beschlossen
const WFH_TAX = 0.2; // Steuer auf Erwerbseinkommen zur Finanzierung

function classLabel(m) {
  if (m >= 1.3) return 'gut situiert';
  if (m >= 0.95) return 'mittel';
  return 'knapp bei Kasse';
}

const r1 = (x) => Math.round(x * 10) / 10;
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function createGame(code, hostKey) {
  return {
    code,
    hostKey,
    phase: 'lobby', // lobby | play | result | final
    round: -1,
    players: {},
    order: [],
    households: [],
    history: [],
    wagesForHousework: false,
    vote: null,
    finalStep: 0,
    timerEnd: null,
    createdAt: Date.now()
  };
}

function addPlayer(g, id, name) {
  if (g.players[id]) {
    g.players[id].name = name || g.players[id].name;
    return g.players[id];
  }
  const p = {
    id,
    name: String(name || 'Gast').slice(0, 24),
    household: null,
    seat: 0,
    connected: true,
    draft: { E: 8, C: 4, B: 0 },
    submitted: false,
    strike: false,
    vote: null,
    exhausted: false,
    totals: { income: 0, work: 0, care: 0, paidCare: 0, rest: 0, careValue: 0 },
    rounds: []
  };
  g.players[id] = p;
  g.order.push(id);
  // Spätankömmling nach Spielstart: in kleinsten Haushalt setzen
  if (g.phase !== 'lobby' && g.households.length) {
    const hh = g.households.slice().sort((a, b) => a.members.length - b.members.length)[0];
    p.household = hh.id;
    p.seat = hh.members.length;
    hh.members.push(id);
    if (g.phase === 'play') preparePlayer(g, p);
  }
  return p;
}

function removePlayer(g, id) {
  const p = g.players[id];
  if (!p) return;
  if (p.household !== null) {
    const hh = g.households[p.household];
    hh.members = hh.members.filter((m) => m !== id);
  }
  delete g.players[id];
  g.order = g.order.filter((x) => x !== id);
}

function roleFor(g, p) {
  const ep = EPOCHS[g.round];
  return ep.roles[(p.seat + g.round) % ep.roles.length];
}

function defaultDraft(role) {
  const B = role.canB ? 9 : 0;
  const E = Math.min(role.maxE, 8);
  const C = Math.min(role.maxC, Math.max(0, Math.min(4, HOURS - B - E - 3)));
  return sanitize({ E, C, B }, role);
}

function sanitize(a, role) {
  const toInt = (v) => Math.max(0, Math.floor(Number(v) || 0));
  let E = Math.min(toInt(a && a.E), role.maxE);
  let C = Math.min(toInt(a && a.C), role.maxC);
  let B = role.canB ? toInt(a && a.B) : 0;
  let over = E + C + B - HOURS;
  if (over > 0) { const d = Math.min(B, over); B -= d; over -= d; }
  if (over > 0) { const d = Math.min(E, over); E -= d; over -= d; }
  if (over > 0) { const d = Math.min(C, over); C -= d; over -= d; }
  return { E, C, B };
}

function startGame(g) {
  const ids = shuffle(g.order);
  const n = ids.length;
  const H = Math.max(1, Math.min(HOUSEHOLDS.length, Math.round(n / 4)));
  g.households = HOUSEHOLDS.slice(0, H).map((h, i) => ({
    id: i,
    name: h.name,
    mult: h.mult,
    label: classLabel(h.mult),
    members: [],
    kasse: r1(10 * h.mult),
    wb: 100,
    event: null,
    need: 0,
    wbLog: [100]
  }));
  ids.forEach((id, i) => {
    const hh = g.households[i % H];
    const p = g.players[id];
    p.household = hh.id;
    p.seat = hh.members.length;
    hh.members.push(id);
  });
  g.round = 0;
  beginRound(g);
}

function preparePlayer(g, p) {
  const role = roleFor(g, p);
  p.draft = defaultDraft(role);
  p.submitted = false;
  p.strike = false;
  if (EPOCHS[g.round].vote) p.vote = null;
}

function beginRound(g) {
  const ep = EPOCHS[g.round];
  const evs = shuffle(ep.events);
  g.households.forEach((hh, i) => {
    hh.event = evs[i % evs.length];
    hh.need = Math.round(3.5 * Math.max(1, hh.members.length)) + hh.event.hours;
  });
  g.order.forEach((id) => preparePlayer(g, g.players[id]));
  g.phase = 'play';
  g.timerEnd = null;
}

function resolveRound(g) {
  const ep = EPOCHS[g.round];
  const wfh = g.round === 3 && g.wagesForHousework;
  const res = {
    round: g.round,
    epochId: ep.id,
    players: {},
    households: {},
    strikers: 0,
    pool: 0,
    poolSold: 0,
    wfh,
    vote: null
  };

  // 1) Einzelpersonen: Stunden, Einkommen
  g.order.forEach((id) => {
    const p = g.players[id];
    if (p.household === null) return;
    const hh = g.households[p.household];
    const role = roleFor(g, p);
    const a = sanitize(p.draft, role);
    const strike = !!(ep.strike && p.strike);
    if (strike) { a.E = 0; a.C = 0; a.B = 0; res.strikers++; }
    const R = HOURS - a.E - a.C - a.B;
    const prod = (0.4 + 0.6 * hh.wb / 100) * (p.exhausted ? 0.75 : 1);
    const wage = role.wage * hh.mult;
    const incomeE = a.E * wage * prod;
    let income = incomeE;
    if (ep.careProd) income += a.C * role.wage * hh.mult * ep.careProd * prod;
    let tax = 0;
    let carePay = 0;
    if (wfh) {
      tax = incomeE * WFH_TAX;
      carePay = a.C * WFH_PAY;
      income = income - tax + carePay;
    }
    res.players[id] = {
      name: p.name,
      household: hh.id,
      role: role.name,
      E: a.E, C: a.C, B: a.B, R,
      Bsold: 0,
      buyer: null,
      strike,
      wasExhausted: p.exhausted,
      prod: r1(prod),
      income,
      tax: r1(tax),
      carePay: r1(carePay),
      eIsCare: !!role.eIsCare,
      wageB: role.wageB || 0
    };
    hh.kasse += income;
    if (a.B > 0) res.pool += a.B;
  });

  // 2) Haushalte: eigener Bedarf
  g.households.forEach((hh) => {
    const own = hh.members.reduce((s, id) => s + (res.players[id] ? res.players[id].C : 0), 0);
    res.households[hh.id] = {
      name: hh.name,
      need: hh.need,
      event: hh.event.text,
      own,
      public: ep.publicCare,
      bought: 0,
      spent: 0,
      deficit: Math.max(0, hh.need - own - ep.publicCare),
      surplus: Math.max(0, own + ep.publicCare - hh.need),
      wbBefore: hh.wb
    };
  });

  // 3) Markt: Haushalte mit Geld kaufen Care-Stunden von Personen aus anderen Haushalten
  if (ep.market) {
    const providers = g.order
      .filter((id) => res.players[id] && res.players[id].B > 0)
      .map((id) => ({ id, left: res.players[id].B }));
    const buyers = g.households
      .filter((hh) => res.households[hh.id].deficit > 0)
      .sort((a, b) => b.kasse - a.kasse);
    buyers.forEach((hh) => {
      const h = res.households[hh.id];
      for (const prov of providers) {
        if (h.deficit <= 0) break;
        if (prov.left <= 0) continue;
        const pr = res.players[prov.id];
        if (pr.household === hh.id) continue;
        const price = pr.wageB;
        const affordable = Math.floor(hh.kasse / price);
        const take = Math.min(h.deficit, prov.left, affordable);
        if (take <= 0) continue;
        const cost = take * price;
        hh.kasse -= cost;
        g.households[pr.household].kasse += cost;
        pr.income += cost;
        pr.Bsold += take;
        pr.buyer = hh.name;
        prov.left -= take;
        h.bought += take;
        h.spent += cost;
        h.deficit -= take;
        res.poolSold += take;
      }
    });
  }

  // 4) Wohlbefinden
  g.households.forEach((hh) => {
    const h = res.households[hh.id];
    if (h.deficit > 0) hh.wb -= h.deficit * 4;
    else hh.wb += 5 + Math.min(10, h.surplus * 2);
    hh.wb = Math.max(0, Math.min(100, Math.round(hh.wb)));
    hh.wbLog.push(hh.wb);
    hh.kasse = r1(hh.kasse);
    h.wbAfter = hh.wb;
    h.kasse = hh.kasse;
  });

  // 5) Spielerstatistik fortschreiben
  g.order.forEach((id) => {
    const p = g.players[id];
    const pr = res.players[id];
    if (!pr) return;
    pr.income = r1(pr.income);
    const paid = pr.Bsold + (pr.eIsCare ? pr.E : 0);
    p.totals.income = r1(p.totals.income + pr.income);
    p.totals.work += pr.E;
    p.totals.care += pr.C;
    p.totals.paidCare += paid;
    p.totals.rest += pr.R;
    p.exhausted = pr.R < EXHAUSTION_LIMIT;
    pr.nowExhausted = p.exhausted;
    p.rounds.push(pr);
  });

  // 6) Abstimmung
  if (ep.vote) {
    let yes = 0, no = 0;
    g.order.forEach((id) => {
      const v = g.players[id].vote;
      if (v === true) yes++;
      else if (v === false) no++;
    });
    g.wagesForHousework = yes > no;
    g.vote = { yes, no, abstain: g.order.length - yes - no, passed: g.wagesForHousework };
    res.vote = g.vote;
  }

  g.history.push(res);
  g.phase = 'result';
  g.timerEnd = null;
  return res;
}

function nextRound(g) {
  if (g.round >= EPOCHS.length - 1) {
    g.phase = 'final';
    g.finalStep = 0;
    return;
  }
  g.round++;
  beginRound(g);
}

/* ---------- Ansichten ---------- */

function epochPublic(ep) {
  if (!ep) return null;
  return {
    id: ep.id, year: ep.year, title: ep.title, place: ep.place,
    history: ep.history, rule: ep.rule, strike: !!ep.strike, vote: !!ep.vote,
    market: ep.market, publicCare: ep.publicCare, careProd: ep.careProd
  };
}

function householdPublic(g, hh) {
  return {
    id: hh.id, name: hh.name, label: hh.label, mult: hh.mult,
    members: hh.members.map((id) => ({ id, name: g.players[id] ? g.players[id].name : '?' })),
    kasse: r1(hh.kasse), wb: hh.wb, wbLog: hh.wbLog,
    event: hh.event, need: hh.need
  };
}

function hostView(g) {
  const ep = EPOCHS[g.round];
  return {
    code: g.code,
    phase: g.phase,
    round: g.round,
    rounds: EPOCHS.length,
    epoch: epochPublic(ep),
    epochs: EPOCHS.map(epochPublic),
    players: g.order.map((id) => {
      const p = g.players[id];
      return {
        id, name: p.name, household: p.household, connected: p.connected,
        submitted: p.submitted, role: g.round >= 0 && p.household !== null ? roleFor(g, p).name : null,
        totals: p.totals, rounds: p.rounds
      };
    }),
    households: g.households.map((hh) => householdPublic(g, hh)),
    last: g.history[g.history.length - 1] || null,
    history: g.phase === 'final' ? g.history : undefined,
    wagesForHousework: g.wagesForHousework,
    vote: g.vote,
    finalStep: g.finalStep,
    timerEnd: g.timerEnd
  };
}

function playerView(g, id) {
  const p = g.players[id];
  if (!p) return { phase: 'gone' };
  const ep = EPOCHS[g.round];
  const hh = p.household !== null ? g.households[p.household] : null;
  const role = ep && hh ? roleFor(g, p) : null;
  const last = g.history[g.history.length - 1];
  return {
    code: g.code,
    phase: g.phase,
    round: g.round,
    rounds: EPOCHS.length,
    hours: HOURS,
    exhaustionLimit: EXHAUSTION_LIMIT,
    epoch: epochPublic(ep),
    wagesForHousework: g.wagesForHousework && g.round === 3,
    me: {
      id: p.id, name: p.name, draft: p.draft, submitted: p.submitted,
      strike: p.strike, vote: p.vote, exhausted: p.exhausted,
      totals: g.phase === 'final' ? p.totals : undefined
    },
    role,
    household: hh ? householdPublic(g, hh) : null,
    result: g.phase === 'result' && last && last.players[id]
      ? { me: last.players[id], household: last.households[p.household], vote: last.vote, strikers: last.strikers }
      : null,
    finalStep: g.finalStep,
    timerEnd: g.timerEnd
  };
}

module.exports = {
  EPOCHS, HOURS, createGame, addPlayer, removePlayer, startGame, resolveRound,
  nextRound, sanitize, roleFor, hostView, playerView
};
