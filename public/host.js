(function () {
  'use strict';

  const socket = io();
  const root = document.getElementById('app');
  const main = root.querySelector('main');
  const dock = root.querySelector('.dock');
  const mast = root.querySelector('.masthead');

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  let S = null;
  let session = null; // { code, key }
  let confirmEnd = false;
  let timerHandle = null;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => (Math.round(n * 10) / 10).toLocaleString('de-AT', { maximumFractionDigits: 1 });
  const joinUrl = () => `${location.origin}/?code=${S ? S.code : ''}`;

  function act(action, value) {
    if (!session) return;
    socket.emit('host:action', { code: session.code, key: session.key, action, value }, (res) => {
      if (res && !res.ok && res.error) toast(res.error);
    });
  }

  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2800);
  }

  socket.on('connect', () => {
    try { session = JSON.parse(store.get('uhr:host') || 'null'); } catch (e) { session = null; }
    if (!session) return renderIntro();
    socket.emit('host:resume', session, (res) => {
      if (!res || !res.ok) { store.del('uhr:host'); session = null; renderIntro(); }
    });
  });
  socket.on('host:state', (s) => { S = s; render(); });
  socket.on('host:ended', () => { store.del('uhr:host'); session = null; S = null; renderIntro(); });

  /* ---------- Bausteine ---------- */

  function masthead() {
    if (!S) { mast.innerHTML = `<span class="brand">Die unsichtbare Uhr</span><span class="label">Spielleitung</span>`; return; }
    const day = S.round >= 0 && S.phase !== 'final' ? `Tag ${S.round + 1} von ${S.rounds}` : S.phase === 'final' ? 'Bilanz' : 'Wartesaal';
    mast.innerHTML = `
      <span class="brand">Die unsichtbare Uhr</span>
      <span class="meta"><span>${day}</span><span>${S.players.length} dabei</span><span>Code <span class="code">${esc(S.code)}</span></span></span>`;
  }

  function clockSVG() {
    // 24-Stunden-Zifferblatt: 8 Std. Schlaf, Rest des Tages in Erwerb, Care, Erholung
    const cx = 200, cy = 200, r = 150;
    const seg = (from, to, color, w) => {
      const a0 = (from / 24) * 2 * Math.PI - Math.PI / 2, a1 = (to / 24) * 2 * Math.PI - Math.PI / 2;
      const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0), x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      const large = to - from > 12 ? 1 : 0;
      return `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="butt"/>`;
    };
    let ticks = '';
    for (let h = 0; h < 24; h++) {
      const a = (h / 24) * 2 * Math.PI - Math.PI / 2;
      const r0 = h % 6 === 0 ? 112 : 120;
      ticks += `<line x1="${(cx + r0 * Math.cos(a)).toFixed(1)}" y1="${(cy + r0 * Math.sin(a)).toFixed(1)}" x2="${(cx + 128 * Math.cos(a)).toFixed(1)}" y2="${(cy + 128 * Math.sin(a)).toFixed(1)}" stroke="var(--ink)" stroke-width="${h % 6 === 0 ? 3 : 1.5}"/>`;
    }
    const nums = [0, 6, 12, 18].map((h) => {
      const a = (h / 24) * 2 * Math.PI - Math.PI / 2;
      return `<text x="${(cx + 95 * Math.cos(a)).toFixed(1)}" y="${(cy + 95 * Math.sin(a) + 6).toFixed(1)}" text-anchor="middle" font-family="Courier Prime, monospace" font-size="18" font-weight="700" fill="var(--ink)">${h}</text>`;
    }).join('');
    return `<svg class="clock" viewBox="0 0 400 400" role="img" aria-label="Zifferblatt mit Erwerbs-, Care- und Ruhezeiten eines Tages">
      <circle cx="${cx}" cy="${cy}" r="178" fill="var(--card)" stroke="var(--rule-strong)" stroke-width="1"/>
      ${seg(22, 30, 'var(--rule)', 26)}
      ${seg(6, 8, 'var(--care)', 26)}
      ${seg(8, 16, 'var(--work)', 26)}
      ${seg(16, 20, 'var(--care)', 26)}
      ${seg(20, 22, 'var(--rest)', 26)}
      ${ticks}${nums}
      <line x1="${cx}" y1="${cy}" x2="${cx + 70}" y2="${cy - 40}" stroke="var(--stamp)" stroke-width="4" stroke-linecap="round"/>
      <circle cx="${cx}" cy="${cy}" r="7" fill="var(--stamp)"/>
    </svg>`;
  }

  /* ---------- Ansichten ---------- */

  function renderIntro() {
    S = null;
    masthead();
    main.innerHTML = `
      <section class="intro">
        <div>
          <span class="label">Ein Mehrspieler-Spiel über Care-Arbeit · 1850 bis heute</span>
          <h1>Die unsichtbare<br>Uhr</h1>
          <p class="sub">Vier Tage, vier Epochen, 16 wache Stunden pro Person. Die Rangliste zählt Einkommen. Was sie nicht zählt, kommt am Ende auf den Tisch.</p>
        </div>
        ${clockSVG()}
      </section>`;
    dock.innerHTML = `<div class="left"><span class="label">Für 8 bis 24 Personen · etwa 60 Minuten</span></div>
      <div class="right"><button class="btn stamp" id="create">Neues Spiel anlegen</button></div>`;
  }

  function renderLobby() {
    const url = joinUrl();
    main.innerHTML = `
      <section class="lobby">
        <div class="card joinbox">
          <span class="label">Mitspielen am Handy</span>
          <div class="bigcode">${esc(S.code)}</div>
          <div class="url">${esc(url.replace(/^https?:\/\//, '').replace(/\/\?code=.*/, ''))}</div>
          <div class="qr" id="qr" aria-label="QR-Code zum Beitreten"></div>
        </div>
        <div class="roster">
          <h2>Im Wartesaal · <span class="num">${S.players.length}</span></h2>
          <div class="chips">
            ${S.players.length ? S.players.map((p) => `<span class="chip ${p.connected ? '' : 'off'}">${esc(p.name)}<button type="button" data-kick="${esc(p.id)}" aria-label="${esc(p.name)} entfernen">×</button></span>`).join('') : '<p style="color:var(--muted)">Noch niemand da. Teilt den Code oder scannt den QR-Code.</p>'}
          </div>
          <p style="margin-top:22px;color:var(--ink-2);max-width:52ch">Beim Start werden alle zufällig auf Haushalte in Wiener Bezirken verteilt, etwa vier Personen pro Haushalt. Die Haushalte sind unterschiedlich wohlhabend.</p>
        </div>
      </section>`;
    const qrEl = document.getElementById('qr');
    if (window.QRCode) {
      try { new QRCode(qrEl, { text: url, width: 200, height: 200, colorDark: '#18202c', colorLight: '#f4f5ef' }); } catch (e) { qrEl.hidden = true; }
    } else qrEl.hidden = true;
    dock.innerHTML = `
      <div class="left">${endControl()}</div>
      <div class="right"><button class="btn stamp" id="start" ${S.players.length ? '' : 'disabled'}>Haushalte bilden und starten</button></div>`;
  }

  function hhCards(withSubmit) {
    return `<div class="hhgrid">${S.households.map((h) => {
      const wbc = h.wb >= 70 ? '' : h.wb >= 40 ? 'mid' : 'low';
      const people = h.members.map((m) => {
        const p = S.players.find((x) => x.id === m.id);
        if (!p) return '';
        return `<div class="p"><span class="dot ${withSubmit && p.submitted ? 'done' : ''}"></span><span>${esc(p.name)}</span><span class="role">${esc(p.role || '')}</span></div>`;
      }).join('');
      return `<article class="card hhcard">
        <header><strong>${esc(h.name)}</strong><span class="pill neutral">${esc(h.label)}</span></header>
        ${h.event ? `<div class="event">${esc(h.event.text)} Bedarf: <b>${h.need} Std.</b></div>` : ''}
        <div><div class="label" style="display:flex;justify-content:space-between"><span>Wohlbefinden</span><span class="num">${h.wb}</span></div><div class="meter ${wbc}"><i style="width:${h.wb}%"></i></div></div>
        <div class="people">${people}</div>
      </article>`;
    }).join('')}</div>`;
  }

  function renderPlay() {
    const e = S.epoch;
    const done = S.players.filter((p) => p.submitted).length;
    main.innerHTML = `
      <section class="stage">
        <div class="era">
          <div class="year">${esc(e.year)}</div>
          <h1>${esc(e.title)}</h1>
          <div class="place">${esc(e.place)}</div>
          <div class="history">${e.history.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
          <div class="rulebox"><span class="label">Spielregel heute</span><p>${esc(e.rule)}</p>
          ${S.round === 3 && S.wagesForHousework ? '<p style="margin-top:8px"><b>Beschlossen:</b> Care-Stunden daheim werden mit 2 bezahlt, finanziert über 20 % Steuer auf Erwerbseinkommen.</p>' : ''}</div>
        </div>
        <div>
          <div class="section-h"><h2 style="font-size:1.6rem">Die Haushalte heute</h2><span class="label">● = Karte abgegeben</span></div>
          ${hhCards(true)}
        </div>
      </section>`;
    dock.innerHTML = `
      <div class="left">
        <span class="count"><b>${done}</b> von ${S.players.length} Karten abgegeben</span>
        <span id="timer" class="count" style="color:var(--alert)"></span>
        <button class="btn ghost small" data-timer="90">90 Sek.</button>
        <button class="btn ghost small" data-timer="180">3 Min.</button>
        ${S.timerEnd ? '<button class="btn ghost small" data-timer="0">Timer aus</button>' : ''}
      </div>
      <div class="right">${endControl()}<button class="btn stamp" id="resolve">Tag auswerten</button></div>`;
    startTimer();
  }

  function renderResult() {
    const L = S.last;
    const e = S.epoch;
    const rows = S.households.map((h) => {
      const r = L.households[h.id];
      return `<tr>
        <td>${esc(h.name)}</td>
        <td>${r.need}</td>
        <td class="care">${r.own}</td>
        ${e.publicCare ? `<td>${r.public}</td>` : ''}
        ${e.market ? `<td>${r.bought}${r.spent ? ` <small>(−${fmt(r.spent)})</small>` : ''}</td>` : ''}
        <td class="${r.deficit > 0 ? 'miss' : ''}">${r.deficit || '–'}</td>
        <td>${r.wbBefore} → ${r.wbAfter}</td>
        <td>${fmt(r.kasse)}</td>
      </tr>`;
    }).join('');

    const ranked = S.players.slice().sort((a, b) => b.totals.income - a.totals.income).slice(0, 10);
    const hhName = (id) => (S.households[id] ? S.households[id].name : '');

    const callouts = [];
    const totalCare = Object.values(L.players).reduce((s, p) => s + p.C, 0);
    const totalWork = Object.values(L.players).reduce((s, p) => s + p.E, 0);
    callouts.push(`<div class="callout care">Heute: <b class="num">${totalWork}</b> Stunden Erwerbsarbeit und <b class="num">${totalCare}</b> Stunden unbezahlte Care. Auf der Rangliste rechts steht nur das eine.</div>`);
    if (e.market) callouts.push(`<div class="callout">Care-Markt: <b class="num">${L.pool}</b> Stunden angeboten, <b class="num">${L.poolSold}</b> gekauft. Gekauft haben zuerst die Haushalte mit dem meisten Geld.</div>`);
    if (e.careProd) callouts.push(`<div class="callout">Am Hof zählte Care noch zur Hälfte als Produktion. Ab morgen nicht mehr.</div>`);
    if (e.strike) callouts.push(`<div class="callout bad"><b class="num">${L.strikers}</b> Personen haben gestreikt.</div>`);
    if (L.vote) callouts.push(`<div class="callout">Lohn für Hausarbeit: <b class="num">${L.vote.yes}</b> dafür, <b class="num">${L.vote.no}</b> dagegen. <b>${L.vote.passed ? 'Angenommen, gilt ab morgen.' : 'Abgelehnt.'}</b></div>`);
    const missing = Object.values(L.households).filter((h) => h.deficit > 0).length;
    if (missing) callouts.push(`<div class="callout bad">In <b class="num">${missing}</b> Haushalt${missing > 1 ? 'en' : ''} ist Care liegen geblieben. Dort sinkt morgen auch die Produktivität.</div>`);

    main.innerHTML = `
      <section class="results">
        <div>
          <div class="section-h"><h2>${esc(e.year)} · Haushaltsbuch</h2><span class="label">Stunden Care</span></div>
          <div class="tablewrap"><table class="ledger">
            <thead><tr><th>Haushalt</th><th>Bedarf</th><th>Selbst</th>${e.publicCare ? '<th>Öffentlich</th>' : ''}${e.market ? '<th>Gekauft</th>' : ''}<th>Fehlt</th><th>Wohlbefinden</th><th>Kasse</th></tr></thead>
            <tbody>${rows}</tbody>
          </table></div>
          <div class="callouts">${callouts.join('')}</div>
        </div>
        <div>
          <div class="section-h"><h2>Rangliste</h2><span class="label">Einkommen gesamt</span></div>
          <ol class="rank">${ranked.map((p) => `<li><span class="n">${esc(p.name)}<small>${esc(hhName(p.household))}</small></span><span class="v">${fmt(p.totals.income)}</span></li>`).join('')}</ol>
        </div>
      </section>`;
    const lastDay = S.round >= S.rounds - 1;
    dock.innerHTML = `
      <div class="left"><span class="label">Kurz besprechen, dann weiter</span></div>
      <div class="right">${endControl()}<button class="btn stamp" id="next">${lastDay ? 'Zur Bilanz' : `Weiter nach ${esc(S.epochs[S.round + 1].year)}`}</button></div>`;
  }

  function renderFinal() {
    const step = S.finalStep;
    const P = S.players.slice().sort((a, b) => b.totals.income - a.totals.income);
    const gdp = P.reduce((s, p) => s + p.totals.income, 0);
    const care = P.reduce((s, p) => s + p.totals.care, 0);
    const paid = P.reduce((s, p) => s + p.totals.paidCare, 0);
    const CARE_PRICE = 5;
    const titles = ['Die offizielle Bilanz', 'Was nicht gezählt wurde', 'Wie es den Haushalten ging', 'Zur Diskussion'];
    let body = '';

    if (step === 0) {
      body = `
        <div class="final-h"><h1>${titles[0]}</h1><p>So sieht die Wirtschaft aus, wenn man nur misst, was bezahlt wurde. Wie das Bruttoinlandsprodukt.</p></div>
        <div class="totals"><div class="t"><span class="label">Gesamteinkommen aller</span><b>${fmt(gdp)}</b></div></div>
        <ol class="rank" style="max-width:820px">${P.map((p) => `<li><span class="n">${esc(p.name)}<small>${esc(S.households[p.household] ? S.households[p.household].name : '')}</small></span><span class="v">${fmt(p.totals.income)}</span></li>`).join('')}</ol>`;
    } else if (step === 1) {
      const maxI = Math.max(1, ...P.map((p) => p.totals.income));
      const maxC = Math.max(1, ...P.map((p) => p.totals.care));
      const k = Math.min(5, Math.floor(P.length / 2));
      const avg = (arr) => arr.length ? arr.reduce((s, p) => s + p.totals.care, 0) / arr.length : 0;
      const top = avg(P.slice(0, k)), bottom = avg(P.slice(-k));
      body = `
        <div class="final-h"><h1>${titles[1]}</h1><p>Dieselbe Liste, dieselbe Reihenfolge. Daneben die Stunden, die niemand bezahlt hat.</p></div>
        <div class="totals">
          <div class="t"><span class="label">Gesamteinkommen</span><b>${fmt(gdp)}</b></div>
          <div class="t care"><span class="label">Unbezahlte Care-Stunden</span><b>${care}</b></div>
          <div class="t care"><span class="label">Wert zum Lohn einer Pflegekraft (5 / Std.)</span><b>${fmt(care * CARE_PRICE)}</b></div>
          <div class="t"><span class="label">Bezahlte Care-Stunden</span><b>${paid}</b></div>
        </div>
        ${k > 0 ? `<div class="callout care" style="margin-bottom:14px">Die ${k} Bestverdienenden haben im Schnitt <b class="num">${fmt(top)}</b> Stunden unbezahlte Care geleistet, die ${k} am schlechtesten Bezahlten <b class="num">${fmt(bottom)}</b>.</div>` : ''}
        <div class="bars">
          <div class="b head"><span>Person</span><span>Einkommen</span><span>Unbezahlte Care</span></div>
          ${P.map((p) => `<div class="b"><span class="nm">${esc(p.name)}</span>
            <span class="bar inc"><i style="width:${(p.totals.income / maxI) * 85}%"></i><span>${fmt(p.totals.income)}</span></span>
            <span class="bar care"><i style="width:${(p.totals.care / maxC) * 85}%"></i><span>${p.totals.care} Std.</span></span></div>`).join('')}
        </div>`;
    } else if (step === 2) {
      const H = S.history || [];
      const labels = ['Start'].concat(S.epochs.map((e) => e.year));
      body = `
        <div class="final-h"><h1>${titles[2]}</h1><p>Wohlbefinden der Haushalte über die vier Tage, dazu wie viele Care-Stunden sie zugekauft haben.</p></div>
        <div class="wbgrid">${S.households.map((h) => {
          const pts = h.wbLog;
          const W = 300, Hh = 110, pad = 18;
          const x = (i) => pad + (i * (W - 2 * pad)) / Math.max(1, labels.length - 1);
          const y = (v) => 10 + (1 - v / 100) * (Hh - 34);
          const line = pts.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
          const area = `${line} L${x(pts.length - 1).toFixed(1)} ${y(0).toFixed(1)} L${x(0).toFixed(1)} ${y(0).toFixed(1)} Z`;
          const bought = H.reduce((s, r) => s + (r.households[h.id] ? r.households[h.id].bought : 0), 0);
          const missed = H.reduce((s, r) => s + (r.households[h.id] ? r.households[h.id].deficit : 0), 0);
          return `<article class="card wbcard">
            <header style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><strong style="font-family:var(--f-display);font-variation-settings:'wdth' 72;font-size:1.3rem;text-transform:uppercase">${esc(h.name)}</strong><span class="pill neutral">${esc(h.label)}</span></header>
            <svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Wohlbefinden von ${esc(h.name)}: ${pts.join(', ')}">
              <line x1="${pad}" x2="${W - pad}" y1="${y(50)}" y2="${y(50)}" stroke="var(--rule)" stroke-dasharray="3 4"/>
              <line x1="${pad}" x2="${W - pad}" y1="${y(0)}" y2="${y(0)}" stroke="var(--rule-strong)"/>
              <path d="${area}" fill="var(--care-soft)"/>
              <path d="${line}" fill="none" stroke="var(--ink)" stroke-width="2.5"/>
              ${pts.map((v, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="${i === pts.length - 1 ? 4.5 : 3}" fill="${i === pts.length - 1 ? 'var(--stamp)' : 'var(--ink)'}"/>`).join('')}
              ${labels.slice(0, pts.length).map((l, i) => `<text x="${x(i).toFixed(1)}" y="${Hh - 4}" text-anchor="middle" font-family="Courier Prime, monospace" font-size="11" fill="var(--muted)">${l}</text>`).join('')}
            </svg>
            <div class="kv" style="display:grid;grid-template-columns:1fr auto;gap:2px 10px;font-size:.92rem">
              <span>Zugekaufte Care</span><span class="num">${bought} Std.</span>
              <span>Liegen geblieben</span><span class="num" style="color:${missed ? 'var(--alert)' : 'inherit'}">${missed} Std.</span>
              <span>Kasse am Ende</span><span class="num">${fmt(h.kasse)}</span>
            </div>
          </article>`;
        }).join('')}</div>`;
    } else {
      body = `
        <div class="final-h"><h1>${titles[3]}</h1></div>
        <section class="discuss">
          <ul class="questions">
            <li>Wer hat Care übernommen, obwohl es keine Punkte brachte? Warum?</li>
            <li>Was hätte sich geändert, wenn Care-Stunden auf der Rangliste gezählt hätten?</li>
            <li>Wohin ist die Care-Arbeit gewandert, als reiche Haushalte sie zukaufen konnten?</li>
            <li>Was ist zwischen 1850 und 2026 wirklich anders geworden, und was hat sich nur verschoben?</li>
          </ul>
          <ol class="timeline">
            <li><b>1850</b>Das „ganze Haus“: Produktion und Versorgung unter einem Dach.</li>
            <li><b>1900</b>Getrennte Sphären, bürgerliches Hausfrauenideal, Dienstmädchen in Wien.</li>
            <li><b>1972</b>Kampagne „Wages for Housework“ in Padua.</li>
            <li><b>1975</b>Frauenstreik in Island. Familienrechtsreform in Österreich.</li>
            <li><b>1989</b>Arlie Hochschild: <i>The Second Shift</i>.</li>
            <li><b>2000</b>Hochschild: globale Care-Ketten.</li>
            <li><b>2007</b>Österreich legalisiert die 24-Stunden-Betreuung.</li>
            <li><b>2020</b>Pandemie: Care-Berufe gelten als „systemrelevant“, Betreuerinnen werden per Sonderzug geholt.</li>
          </ol>
        </section>`;
    }

    main.innerHTML = `<section>${body}</section>`;
    dock.innerHTML = `
      <div class="left">
        ${step > 0 ? `<button class="btn ghost small" data-step="${step - 1}">Zurück</button>` : ''}
        <span class="label">${step + 1} / 4 · ${titles[step]}</span>
      </div>
      <div class="right">${endControl()}${step < 3 ? `<button class="btn stamp" data-step="${step + 1}">${titles[step + 1]}</button>` : ''}</div>`;
  }

  function endControl() {
    if (confirmEnd) {
      return `<span class="confirm"><span class="label" style="color:var(--alert)">Spiel wirklich beenden?</span><button class="btn small" id="endYes">Beenden</button><button class="btn ghost small" id="endNo">Abbrechen</button></span>`;
    }
    return `<button class="btn ghost small" id="end">Spiel beenden</button>`;
  }

  function render() {
    masthead();
    if (!S) return renderIntro();
    if (S.phase === 'lobby') return renderLobby();
    if (S.phase === 'play') return renderPlay();
    if (S.phase === 'result') return renderResult();
    if (S.phase === 'final') return renderFinal();
  }

  function startTimer() {
    clearInterval(timerHandle);
    const el = document.getElementById('timer');
    if (!el) return;
    if (!S.timerEnd) { el.textContent = ''; return; }
    const tick = () => {
      const left = Math.max(0, Math.round((S.timerEnd - Date.now()) / 1000));
      el.textContent = `⏱ ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
      if (!left) { clearInterval(timerHandle); el.textContent = 'Zeit ist um'; }
    };
    tick();
    timerHandle = setInterval(tick, 500);
  }

  /* ---------- Klicks ---------- */

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.id === 'create') {
      b.disabled = true;
      socket.emit('host:create', null, (res) => {
        if (res && res.ok) {
          session = { code: res.code, key: res.key };
          store.set('uhr:host', JSON.stringify(session));
        } else { b.disabled = false; toast('Das Spiel konnte nicht angelegt werden.'); }
      });
    } else if (b.id === 'start') act('start');
    else if (b.id === 'resolve') act('resolve');
    else if (b.id === 'next') act('next');
    else if (b.dataset.timer !== undefined) act('timer', Number(b.dataset.timer));
    else if (b.dataset.step !== undefined) act('finalStep', Number(b.dataset.step));
    else if (b.dataset.kick) act('kick', b.dataset.kick);
    else if (b.id === 'end') { confirmEnd = true; render(); }
    else if (b.id === 'endNo') { confirmEnd = false; render(); }
    else if (b.id === 'endYes') { confirmEnd = false; act('end'); }
  });

  renderIntro();
})();
