(function () {
  'use strict';

  const app = document.getElementById('app');
  const socket = io();
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  let state = null;
  let draft = null;     // lokale Planung { E, C, B }
  let strike = false;
  let vote = null;
  let draftKey = null;  // Runde, für die der Entwurf gilt
  let joinError = '';
  let timerHandle = null;

  const params = new URLSearchParams(location.search);
  let code = (params.get('code') || store.get('uhr:code') || '').toUpperCase();

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => (Math.round(n * 10) / 10).toLocaleString('de-AT', { minimumFractionDigits: 0, maximumFractionDigits: 1 });

  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }

  function tryResume() {
    const id = code && store.get('uhr:pid:' + code);
    if (!id) return renderJoin();
    socket.emit('player:join', { code, playerId: id }, (res) => {
      if (!res || !res.ok) { store.del('uhr:pid:' + code); renderJoin(); }
    });
  }

  socket.on('connect', tryResume);
  socket.on('player:state', (s) => {
    if (s.phase === 'gone') {
      store.del('uhr:pid:' + code);
      state = null;
      joinError = 'Das Spiel wurde beendet oder du wurdest entfernt.';
      return renderJoin();
    }
    state = s;
    const key = s.round + ':' + s.phase;
    if (s.phase === 'play' && draftKey !== key) {
      draftKey = key;
      draft = Object.assign({}, s.me.draft);
      strike = !!s.me.strike;
      vote = s.me.vote;
    }
    render();
  });

  /* ---------- Beitritt ---------- */

  function renderJoin() {
    app.innerHTML = `
      <section class="card join">
        <span class="label">Ein Spiel über Care-Arbeit, 1850 bis heute</span>
        <h1>Die unsichtbare Uhr</h1>
        <p class="lede">Du hast 16 wache Stunden am Tag. Wie du sie verteilst, entscheidest du. Was davon gezählt wird, entscheidet das Spiel.</p>
        <form id="joinForm" novalidate style="display:flex;flex-direction:column;gap:18px">
          <label><span class="label">Spielcode</span>
            <input class="field codefield" id="code" name="code" maxlength="4" autocomplete="off" autocapitalize="characters" value="${esc(code)}" placeholder="ABCD" required>
          </label>
          <label><span class="label">Dein Name</span>
            <input class="field" id="name" name="name" maxlength="24" autocomplete="given-name" placeholder="Vorname" required>
          </label>
          <p class="err" id="err">${esc(joinError)}</p>
          <button class="btn block" type="submit">Mitspielen</button>
        </form>
      </section>`;
    document.getElementById('joinForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const c = document.getElementById('code').value.trim().toUpperCase();
      const n = document.getElementById('name').value.trim();
      const err = document.getElementById('err');
      if (c.length !== 4) { err.textContent = 'Der Spielcode hat vier Buchstaben.'; return; }
      if (!n) { err.textContent = 'Bitte gib einen Namen ein.'; return; }
      socket.emit('player:join', { code: c, name: n }, (res) => {
        if (!res || !res.ok) { err.textContent = (res && res.error) || 'Beitritt hat nicht geklappt.'; return; }
        code = res.code;
        joinError = '';
        store.set('uhr:code', code);
        store.set('uhr:pid:' + code, res.playerId);
      });
    });
  }

  /* ---------- Hauptansicht ---------- */

  function topbar() {
    const s = state;
    const r = s.round >= 0 ? `Tag ${s.round + 1}/${s.rounds}` : 'Wartesaal';
    return `<header class="topbar"><span class="brand">Die unsichtbare Uhr</span><span class="who">${esc(s.me.name)} · ${r} · ${esc(s.code)}</span></header>`;
  }

  function epochBand() {
    const e = state.epoch;
    if (!e) return '';
    return `<div class="epoch"><span class="year">${esc(e.year)}</span><h2>${esc(e.title)}</h2><span class="place">${esc(e.place)}</span></div>`;
  }

  function householdCard(showEvent) {
    const h = state.household;
    if (!h) return '';
    const wbClass = h.wb >= 70 ? '' : h.wb >= 40 ? 'mid' : 'low';
    const others = h.members.filter((m) => m.id !== state.me.id).map((m) => esc(m.name)).join(', ') || 'niemand sonst';
    return `
      <section class="card hh">
        <div class="hh-head"><strong>Haushalt ${esc(h.name)}</strong><span class="pill neutral">${esc(h.label)}</span></div>
        ${showEvent && h.event ? `<div class="event">${esc(h.event.text)} Heute braucht euer Haushalt <b>${h.need} Std.</b> Care.</div>` : ''}
        <div><div class="label" style="display:flex;justify-content:space-between"><span>Wohlbefinden</span><span class="num">${h.wb}/100</span></div>
        <div class="meter ${wbClass}"><i style="width:${h.wb}%"></i></div></div>
        <p class="members">Mit dir: ${others}</p>
      </section>`;
  }

  function cellsHTML(a, isStrike) {
    let out = '';
    const rest = state.hours - a.E - a.C - a.B;
    const seq = isStrike ? Array(state.hours).fill('S') :
      [].concat(Array(a.E).fill('E'), Array(a.C).fill('C'), Array(a.B).fill('B'), Array(Math.max(0, rest)).fill('R'));
    seq.forEach((k) => { out += `<span class="cell ${k}"></span>`; });
    let scale = '';
    for (let i = 0; i < state.hours; i++) scale += `<span>${(6 + i) % 24}</span>`;
    return `<div class="hours" aria-hidden="true">${out}</div><div class="hour-scale" aria-hidden="true">${scale}</div>`;
  }

  function stepRow(key, title, sub, max) {
    const total = draft.E + draft.C + draft.B;
    const v = draft[key];
    const locked = state.me.submitted || strike;
    return `
      <div class="row">
        <div class="what"><b><span class="swatch ${key}"></span>${title}</b><small>${sub}</small></div>
        <div class="stepper">
          <button type="button" data-step="${key}" data-d="-1" aria-label="${title}: eine Stunde weniger" ${locked || v <= 0 ? 'disabled' : ''}>−</button>
          <output aria-label="${title} in Stunden">${v}</output>
          <button type="button" data-step="${key}" data-d="1" aria-label="${title}: eine Stunde mehr" ${locked || v >= max || total >= state.hours ? 'disabled' : ''}>+</button>
        </div>
      </div>`;
  }

  function renderPlay() {
    const s = state;
    const role = s.role;
    const mult = s.household ? s.household.mult : 1;
    const wage = fmt(role.wage * mult);
    const rest = s.hours - draft.E - draft.C - draft.B;
    const ep = s.epoch;

    const facts = [];
    if (role.maxE > 0) facts.push(`Lohn ${wage} / Std.`);
    if (role.maxE === 0) facts.push('keine eigene Erwerbsarbeit');
    else if (role.maxE < 16) facts.push(`höchstens ${role.maxE} Std. Erwerb`);
    if (role.maxC < 16) facts.push(`höchstens ${role.maxC} Std. Care daheim`);
    if (role.canB) facts.push(`Care gegen Lohn: ${fmt(role.wageB)} / Std.`);

    let rows = '';
    if (role.maxE > 0) rows += stepRow('E', role.eIsCare ? 'Erwerbsarbeit (Pflege)' : 'Erwerbsarbeit', role.eIsCare ? 'Bezahlte Care im Spital. Bringt Lohn.' : 'Bringt Lohn. Zählt auf der Rangliste.', role.maxE);
    if (role.maxC > 0) rows += stepRow('C', 'Care daheim', ep.careProd ? 'Für den eigenen Haushalt. Zählt hier halb als Produktion.' : (s.wagesForHousework ? 'Für den eigenen Haushalt. Wird jetzt mit 2 / Std. bezahlt.' : 'Für den eigenen Haushalt. Bringt kein Geld.'), role.maxC);
    if (role.canB) rows += stepRow('B', 'Care gegen Lohn', 'In einem fremden Haushalt. Bezahlt wird nur, wenn dich jemand braucht und zahlen kann.', 16);

    const restLow = rest < s.exhaustionLimit;

    let choice = '';
    if (ep.strike || ep.vote) {
      choice = `
        <section class="card choice">
          ${ep.strike ? `<h3>Streikst du heute?</h3>
          <p style="font-size:.92rem;color:var(--ink-2)">Wer streikt, macht heute weder Erwerbs- noch Care-Arbeit.</p>
          <div class="toggle" role="group" aria-label="Streik">
            <button type="button" data-strike="0" aria-pressed="${!strike}" ${s.me.submitted ? 'disabled' : ''}>Ich arbeite</button>
            <button type="button" data-strike="1" aria-pressed="${strike}" ${s.me.submitted ? 'disabled' : ''}>Ich streike</button>
          </div>` : ''}
          ${ep.vote ? `<h3 style="margin-top:6px">Lohn für Hausarbeit?</h3>
          <p style="font-size:.92rem;color:var(--ink-2)">Ab der nächsten Epoche: jede Care-Stunde daheim wird mit 2 bezahlt, finanziert über 20 % Steuer auf Erwerbseinkommen.</p>
          <div class="toggle" role="group" aria-label="Abstimmung">
            <button type="button" data-vote="1" aria-pressed="${vote === true}" ${s.me.submitted ? 'disabled' : ''}>Dafür</button>
            <button type="button" data-vote="0" aria-pressed="${vote === false}" ${s.me.submitted ? 'disabled' : ''}>Dagegen</button>
          </div>` : ''}
        </section>`;
    }

    const timer = s.timerEnd ? `<span class="timer" id="timer"></span>` : '';

    app.innerHTML = `
      ${topbar()}
      ${epochBand()}
      <section class="card role">
        <span class="label">Deine Rolle heute</span>
        <h3>${esc(role.name)}</h3>
        <p>${esc(role.desc)}</p>
        <div class="facts">${facts.map((f) => `<span>${esc(f)}</span>`).join('')}</div>
        ${s.me.exhausted ? `<span class="stamp-mark" style="color:var(--alert);border-color:var(--alert)">erschöpft</span>` : ''}
      </section>
      ${s.me.exhausted ? `<p class="warn">Du hast gestern zu wenig Erholung gehabt. Heute schaffst du nur drei Viertel.</p>` : ''}
      ${householdCard(true)}
      ${choice}
      <section class="card planner">
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><span class="label">Dein Tag · 6 bis 22 Uhr</span>${timer}</div>
        ${cellsHTML(draft, strike)}
        <div class="legend"><span><span class="swatch E"></span>Erwerb</span><span><span class="swatch C"></span>Care daheim</span>${role.canB ? '<span><span class="swatch B"></span>Care gegen Lohn</span>' : ''}<span><span class="swatch R"></span>Erholung</span></div>
        ${strike ? `<p class="note" style="border:0;padding:0">Du streikst. Alle 16 Stunden bleiben heute liegen.</p>` : `
        <div class="rows">
          ${rows}
          <div class="row">
            <div class="what"><b><span class="swatch R"></span>Erholung</b><small>Was übrig bleibt. Unter ${s.exhaustionLimit} Std. bist du morgen erschöpft.</small></div>
            <span class="rest-val ${restLow ? 'low' : ''}">${rest}</span>
          </div>
        </div>`}
      </section>
      ${s.me.submitted ? `
        <section class="card submitted">
          <span class="stamp-mark">Gestempelt</span>
          <p>Deine Karte ist abgegeben. Bis die Runde schließt, kannst du sie noch ändern.</p>
          <button class="btn ghost small" type="button" id="edit">Karte ändern</button>
        </section>` : `
        <button class="btn block stamp" type="button" id="submit" ${ep.vote && vote === null ? 'disabled' : ''}>Stechkarte abgeben</button>
        ${ep.vote && vote === null ? '<p class="warn" style="text-align:center">Bitte stimm zuerst ab.</p>' : ''}`}
    `;
    startTimer();
  }

  function renderResult() {
    const r = state.result;
    if (!r) return renderWait('Auswertung', 'Schau nach vorne.');
    const me = r.me, h = r.household;
    const notes = [];
    if (me.strike) notes.push('Du hast gestreikt. Dein Haushalt musste ohne dich auskommen.');
    if (me.B > 0) notes.push(me.Bsold > 0 ? `Haushalt ${esc(me.buyer)} hat ${me.Bsold} deiner Stunden gekauft.` : 'Niemand hat deine Care-Stunden gekauft. Dafür gab es kein Geld.');
    if (me.B > 0 && me.Bsold < me.B && me.Bsold > 0) notes.push(`${me.B - me.Bsold} Stunden blieben unbezahlt.`);
    if (h.bought > 0) notes.push(`Dein Haushalt hat ${h.bought} Care-Stunden eingekauft.`);
    if (h.deficit > 0) notes.push(`${h.deficit} Stunden Care sind liegen geblieben. Das Wohlbefinden ist auf ${h.wbAfter} gefallen.`);
    else notes.push('Euer Haushalt war heute versorgt.');
    if (me.nowExhausted) notes.push('Du bist morgen erschöpft.');
    if (r.vote) notes.push(`Abstimmung über Lohn für Hausarbeit: ${r.vote.yes} dafür, ${r.vote.no} dagegen. ${r.vote.passed ? 'Angenommen.' : 'Abgelehnt.'}`);

    app.innerHTML = `
      ${topbar()}
      ${epochBand()}
      <section class="card result">
        <span class="label">Dein Einkommen heute</span>
        <span class="big">${fmt(me.income)}</span>
        ${cellsHTML({ E: me.E, C: me.C, B: me.B }, me.strike)}
        <div class="kv">
          <span>Erwerbsarbeit</span><span>${me.E} Std.</span>
          <span>Care daheim</span><span>${me.C} Std.</span>
          ${me.B ? `<span>Care gegen Lohn</span><span>${me.Bsold}/${me.B} Std.</span>` : ''}
          <span>Erholung</span><span>${me.R} Std.</span>
          ${me.tax ? `<span>Steuer</span><span>−${fmt(me.tax)}</span>` : ''}
          ${me.carePay ? `<span>Lohn für Hausarbeit</span><span>+${fmt(me.carePay)}</span>` : ''}
        </div>
        <div class="note">${notes.map((n) => `<p>${n}</p>`).join('')}</div>
      </section>
      ${householdCard(false)}
      <p class="label" style="text-align:center">Die Spielleitung startet gleich den nächsten Tag</p>`;
  }

  function renderFinal() {
    const t = state.me.totals;
    if (state.finalStep < 1 || !t) return renderWait('Die Bilanz', 'Schau auf den Beamer.');
    app.innerHTML = `
      ${topbar()}
      <section class="card result">
        <span class="label">Deine vier Tage</span>
        <div class="kv">
          <span>Einkommen gesamt</span><span>${fmt(t.income)}</span>
          <span>Erwerbsarbeit</span><span>${t.work} Std.</span>
          <span>Unbezahlte Care</span><span>${t.care} Std.</span>
          <span>Bezahlte Care</span><span>${t.paidCare} Std.</span>
          <span>Erholung</span><span>${t.rest} Std.</span>
        </div>
        <p class="note">Die Rangliste hat nur die erste Zeile gesehen.</p>
      </section>
      <p class="label" style="text-align:center">Danke fürs Mitspielen</p>`;
  }

  function renderWait(title, sub) {
    app.innerHTML = `
      ${topbar()}
      <section class="card wait">
        <div class="tick" aria-hidden="true"></div>
        <h2>${esc(title)}</h2>
        <p>${esc(sub)}</p>
      </section>
      ${state.household ? householdCard(false) : ''}`;
  }

  function render() {
    if (!state) return renderJoin();
    if (state.phase === 'lobby') return renderWait('Du bist dabei', 'Sobald alle da sind, teilt die Spielleitung euch in Haushalte ein.');
    if (state.phase === 'play') return renderPlay();
    if (state.phase === 'result') return renderResult();
    if (state.phase === 'final') return renderFinal();
  }

  /* ---------- Interaktion ---------- */

  let draftTimer = null;
  function sendDraft() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => socket.emit('player:draft', { alloc: draft, strike, vote }), 250);
  }

  app.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || !state) return;
    if (b.dataset.step) {
      const k = b.dataset.step, d = Number(b.dataset.d);
      const role = state.role;
      const max = k === 'E' ? role.maxE : k === 'C' ? role.maxC : 16;
      const total = draft.E + draft.C + draft.B;
      const next = draft[k] + d;
      if (next < 0 || next > max || (d > 0 && total >= state.hours)) return;
      draft[k] = next;
      sendDraft();
      renderPlay();
    } else if (b.dataset.strike) {
      strike = b.dataset.strike === '1';
      sendDraft();
      renderPlay();
    } else if (b.dataset.vote) {
      vote = b.dataset.vote === '1';
      sendDraft();
      renderPlay();
    } else if (b.id === 'submit') {
      b.disabled = true;
      socket.emit('player:submit', { alloc: draft, strike, vote, submitted: true }, (res) => {
        if (!res || !res.ok) toast((res && res.error) || 'Abgeben hat nicht geklappt. Versuch es noch einmal.');
      });
    } else if (b.id === 'edit') {
      socket.emit('player:submit', { alloc: draft, strike, vote, submitted: false });
    }
  });

  function startTimer() {
    clearInterval(timerHandle);
    const el = document.getElementById('timer');
    if (!el || !state.timerEnd) return;
    const tick = () => {
      const left = Math.max(0, Math.round((state.timerEnd - Date.now()) / 1000));
      el.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
      if (!left) clearInterval(timerHandle);
    };
    tick();
    timerHandle = setInterval(tick, 500);
  }

  renderJoin();
})();
