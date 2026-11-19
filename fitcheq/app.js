/* fitcheq member app. FQApp.mount(el, { member, screen }) renders a live, tappable app into el. */
(function () {
  const FQ = window.FQ, U = FQ.util, ic = FQ.icon, esc = FQ.esc;
  let uid = 0;

  function mount(root, opts) {
    opts = opts || {};
    const id = 'app' + ++uid;
    const v = { screen: opts.screen || 'today', mid: opts.member || 'm1', dayOff: 0, adh: null, gymTab: 'coach', sheet: null, toast: null };
    root.classList.add('fq-app');

    const S = () => FQ.state();
    const me = () => S().members.find((m) => m.id === v.mid) || S().members[0];
    const trainer = (tid) => S().trainers.find((t) => t.id === tid) || S().trainers[0];
    const first = (n) => n.split(' ')[0];
    const av = (name, lg) => '<span class="fa-av' + (lg ? ' lg' : '') + '">' + FQ.initials(name) + '</span>';
    const chk = (s, meal) => '<button class="fa-chk ' + (s === 'done' ? 'on' : '') + '" data-act="mlog" data-meal="' + meal + '" data-v="done" aria-label="Mark as eaten">' + ic('check') + '</button>';
    const skip = (s, meal) => '<button class="fa-skip ' + (s === 'skip' ? 'on' : '') + '" data-act="mlog" data-meal="' + meal + '" data-v="skip">' + (s === 'skip' ? 'Skipped' : 'Skip') + '</button>';

    function toast(msg) { v.toast = msg; render(); clearTimeout(v._tt); v._tt = setTimeout(() => { v.toast = null; render(); }, 1600); }
    const save = () => FQ.save(id);

    // ---------- Today ----------
    function today() {
      const st = S(), m = me(), d = U.T, k = U.key(d), meals = FQ.dayMeals(st, m, d);
      const log = (st.logs[m.id] || {})[k] || {};
      const done = meals.filter((x) => log[x.id] === 'done');
      const kcal = done.reduce((s, x) => s + x.kcal, 0);
      const wo = FQ.workoutFor(m, d), wl = (st.wlogs[m.id] || {})[k];
      const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
      const classes = st.classes.filter((c) => c.days.includes(d.getDay())).sort((a, b) => a.time.localeCompare(b.time));
      const bk = st.bookings[m.id] || {};
      const promo = st.promotions[0];
      return '<div class="fa-top"><span>' + U.WD[d.getDay()] + 'day, ' + U.fmtDate(d) + '</span><button class="link" data-go="me">' + esc(first(m.name)) + '</button></div>' +
        '<h1 class="fa-h1">Today</h1>' +
        '<div class="fa-summary"><div><b>' + done.length + '/' + meals.length + '</b><span>Meals</span></div><div><b>' + kcal + '</b><span>of ' + m.plan.kcal + ' kcal</span></div><div><b>' + (wo.rest ? 'Rest' : wl === 'done' ? 'Done' : wl === 'skip' ? 'Skipped' : 'To do') + '</b><span>Workout</span></div></div>' +

        '<div class="fa-sec">Meals<span>Tick when you eat it</span></div><div class="fa-group" data-sec="meals">' +
        meals.map((x) => { const s = log[x.id]; return '<div class="fa-row ind fa-meal ' + (s || '') + '">' + chk(s, x.id) + '<div class="fa-grow"><div class="ttl">' + esc(x.name) + '<span class="tm">' + x.time + '</span></div><div class="fa-sub">' + esc(x.items.join(' + ')) + '</div></div>' + skip(s, x.id) + '</div>'; }).join('') + '</div>' +

        '<div class="fa-sec">Workout<span>' + esc(trainer(m.pt).name) + '</span></div><div class="fa-group" data-sec="workout"><div class="fa-wohead"><b>' + esc(wo.name) + '</b>' + (wl ? ' <span class="fa-tag ' + (wl === 'done' ? 'ok' : 'no') + '">' + (wl === 'done' ? 'Done' : 'Skipped') + '</span>' : '') + '</div>' +
        wo.items.map((e) => '<div class="fa-ex"><span>' + esc(e[0]) + '</span><span>' + esc(e[1]) + '</span></div>').join('') + '</div>' +
        (wo.rest ? '' : '<div class="fa-btns"><button class="fa-btn ' + (wl === 'done' ? 'done' : 'go') + '" data-act="wlog" data-v="done">' + (wl === 'done' ? ic('check') + 'Workout done' : 'Finish workout') + '</button><button class="fa-btn ' + (wl === 'skip' ? 'skipped' : '') + '" style="flex:0 0 96px" data-act="wlog" data-v="skip">' + (wl === 'skip' ? 'Skipped' : 'Skip') + '</button></div>') +

        '<div class="fa-sec">Classes today</div><div class="fa-group" data-sec="classes">' +
        classes.map((c) => {
          const [h, mi] = c.time.split(':').map(Number), past = h * 60 + mi < nowMin, on = bk[c.id], left = c.cap - c.booked - (on ? 1 : 0);
          return '<div class="fa-row"><div style="width:46px;font-weight:600;font-variant-numeric:tabular-nums' + (past ? ';color:var(--faint)' : '') + '">' + c.time + '</div><div class="fa-grow"><div class="ttl"' + (past ? ' style="color:var(--faint)"' : '') + '>' + esc(c.name) + '</div><div class="fa-sub">' + esc(first(trainer(c.trainer).name)) + ' \u00b7 ' + c.dur + ' min \u00b7 ' + (left <= 0 ? 'Full' : left + ' spots') + '</div></div>' +
            (past ? '<span class="fa-sub">Over</span>' : '<button class="fa-pill ' + (on ? 'on' : '') + '" data-act="book" data-c="' + c.id + '"' + (left <= 0 && !on ? ' disabled' : '') + '>' + (on ? 'Booked' : 'Book') + '</button>') + '</div>';
        }).join('') + '</div>' +
        (promo ? '<div class="fa-sec">From the gym</div><button class="fa-promo" data-go="me"><div class="k">' + esc(promo.tag) + '</div><div class="h">' + esc(promo.title) + '</div><p>' + esc(promo.body) + '</p></button>' : '');
    }

    // ---------- Diet ----------
    function diet() {
      const st = S(), m = me(), t = trainer(m.pt);
      const sel = U.addDays(U.T, v.dayOff), k = U.key(sel), meals = FQ.dayMeals(st, m, sel);
      const L = st.logs[m.id] || {}, log = L[k] || {};
      let days = '';
      for (let i = -3; i <= 3; i++) {
        const d = U.addDays(U.T, i), l = L[U.key(d)] || {}, n = Object.values(l).filter((x) => x === 'done').length, tot = Object.keys(l).length;
        const dot = i > 0 || !tot ? '' : n >= 4 ? 'ok' : n >= 3 ? 'mid' : i < 0 ? 'no' : '';
        days += '<button class="fa-day ' + (i === v.dayOff ? 'sel ' : '') + (i === 0 ? 'today' : '') + '" data-act="day" data-o="' + i + '"><span>' + U.WD[d.getDay()][0] + '</span><b>' + d.getDate() + '</b><i class="' + dot + '"></i></button>';
      }
      const tk = meals.reduce((s, x) => s + x.kcal, 0), tp = meals.reduce((s, x) => s + x.protein, 0);
      const future = v.dayOff > 0;
      const followed = meals.filter((x) => log[x.id] === 'done').length;
      const label = v.dayOff === 0 ? 'Today' : v.dayOff === -1 ? 'Yesterday' : v.dayOff === 1 ? 'Tomorrow' : U.WD[sel.getDay()] + 'day ' + sel.getDate();
      return '<div class="fa-top"><span>Week ' + U.isoWeek(U.T) + ' \u00b7 ' + esc(FQ.dietLabel(m.diet)) + '</span></div><h1 class="fa-h1">Diet</h1>' +
        '<div class="fa-days">' + days + '</div>' +
        '<div class="fa-dayhead"><b>' + label + '</b><span class="fa-sub">' + (future ? 'Coming up' : followed + ' of 5 followed') + '</span></div>' +
        '<div class="fa-macro"><span><b>' + tk + '</b> kcal</span><span><b>' + tp + ' g</b> protein</span><span>Set by ' + esc(first(t.name)) + '</span></div>' +
        '<div class="fa-group" data-sec="dmeals">' + meals.map((x) => {
          const s = log[x.id];
          return '<div class="fa-dmeal ' + (s || '') + '">' + (future ? '<span class="fa-up"></span>' : chk(s, x.id)) + '<div class="fa-grow"><div class="ttl" style="font-weight:600">' + esc(x.name) + ' <span class="fa-sub">' + x.time + ' \u00b7 ' + x.kcal + ' kcal</span></div><ul>' + x.items.map((i) => '<li>' + esc(i) + '</li>').join('') + '</ul></div>' + (future ? '' : skip(s, x.id)) + '</div>';
        }).join('') + '</div>' +
        '<div class="fa-coachnote"><b>' + esc(first(t.name)) + ' says:</b> ' + esc(FQ.dayNote(m, sel)) + '</div>';
    }

    // ---------- Progress ----------
    function progress() {
      const st = S(), m = me();
      const real = Math.round(FQ.adherence(st, m) * 100) / 100;
      const a = v.adh == null ? real : v.adh;
      const moved = m.current - m.startWeight, span = m.target - m.startWeight;
      const pct = Math.max(0, Math.min(100, (moved / span) * 100));
      const wk = []; for (let i = 6; i >= 0; i--) { const d = U.addDays(U.T, -i), l = (st.logs[m.id] || {})[U.key(d)] || {}; wk.push({ d, n: Object.values(l).filter((x) => x === 'done').length }); }
      return '<div class="fa-top"><span>' + esc(FQ.goalLabel(m.goal)) + ' \u00b7 week ' + m.weeks + '</span></div><h1 class="fa-h1">Progress</h1>' +
        '<div class="fa-three" data-sec="three"><div><span>Start</span><b>' + m.startWeight.toFixed(1) + '<small> kg</small></b></div><div><span>Now</span><b>' + m.current.toFixed(1) + '<small> kg</small></b></div><div><span>Target</span><b>' + m.target.toFixed(1) + '<small> kg</small></b></div></div>' +
        '<div class="fa-bar"><i style="width:' + pct + '%"></i></div><div class="fa-barlbl"><span><b>' + (moved < 0 ? '\u2212' : '+') + Math.abs(moved).toFixed(1) + ' kg</b> so far</span><span>' + Math.round(pct) + '% there</span></div>' +
        '<div class="fa-sec">Weight</div><div class="fa-chartbox" data-slot="chart">' + FQ.chart(m, a) + '<div class="fa-legend"><span><i></i>Weigh-ins</span><span><i class="d"></i>Projected</span><span><i class="t"></i>Target</span></div></div>' +
        '<div class="fa-sec">What if?</div><div class="fa-whatif" data-sec="whatif">' + whatif(m, a, real) + '</div>' +
        '<div class="fa-sec">Meals followed this week</div><div class="fa-group"><div class="fa-weekbars">' + wk.map((x) => '<div><i class="' + (x.n < 3 ? 'lo' : '') + '" style="height:' + Math.max(4, (x.n / 5) * 56) + 'px"></i><span>' + U.WD[x.d.getDay()][0] + '</span></div>').join('') + '</div></div>' +
        '<div class="fa-sec">Body check-in</div><div class="fa-group"><div class="fa-row"><span class="fa-grow">Waist</span><span class="r">' + m.meas.waist[0] + ' \u2192 <b style="color:var(--fg)">' + m.meas.waist[1] + ' cm</b></span></div><div class="fa-row"><span class="fa-grow">Body fat</span><span class="r">' + m.meas.fat[0] + ' \u2192 <b style="color:var(--fg)">' + m.meas.fat[1] + '%</b></span></div></div>' +
        '<p class="fa-disc">Estimates from your calorie plan and logged days. A guide, not medical advice.</p>';
    }
    function whatif(m, a, real) {
      const range = '<input class="fa-range" id="' + id + '-adh" type="range" min="30" max="100" step="1" value="' + Math.round(a * 100) + '" style="--p:' + ((a * 100 - 30) / 70 * 100) + '%" aria-label="Days you follow the plan">';
      const head = '<div class="q">If I follow the plan <b>' + Math.round(a * 100) + '%</b> of days</div>';
      const out = () => {
        const m30 = FQ.weekly(m, a) * 30 / 7, eta = FQ.eta(m, a);
        const rows = [[1, 'Every day'], [real, 'My pace now'], [0.5, 'Half the days']];
        return '<div class="fa-result"><div class="big">' + (m30 < 0 ? 'Lose ' : 'Gain ') + '<b>' + Math.abs(m30).toFixed(1) + ' kg</b> in 30 days</div><div class="fa-sub">' + (eta ? 'Reach ' + m.target.toFixed(0) + ' kg on <b style="color:var(--fg)">' + U.fmtDate(eta.date, true) + '</b>' : 'At this pace you won\u2019t reach ' + m.target.toFixed(0) + ' kg') + '</div></div>' +
          '<table class="fa-cmp"><tbody>' + rows.map((r) => { const e = FQ.eta(m, r[0]), w = FQ.weekly(m, r[0]) * 30 / 7; return '<tr class="' + (Math.abs(r[0] - a) < 0.005 ? 'me' : '') + '"><td>' + r[1] + ' \u00b7 ' + Math.round(r[0] * 100) + '%</td><td>' + (w < 0 ? '\u2212' : '+') + Math.abs(w).toFixed(1) + ' kg/mo</td><td>' + (e ? U.fmtDate(e.date) : '\u2014') + '</td></tr>'; }).join('') + '</tbody></table>';
      };
      if (whatif.outOnly) return { head, out: out() };
      return '<div data-slot="whead">' + head + '</div>' + range + '<div data-slot="wout">' + out() + '</div>';
    }

    // ---------- Gym ----------
    function gym() {
      const st = S(), m = me(), t = trainer(m.pt), g = st.gym;
      const wd = new Date().getDay();
      const hrs = wd === 0 ? g.hours.sunday : wd === 6 ? g.hours.saturday : g.hours.weekdays;
      const tabs = [['coach', 'My coach'], ['team', 'Trainers'], ['eq', 'Equipment'], ['fmt', 'Formats']];
      let body = '';
      if (v.gymTab === 'coach') body = '<div class="fa-group"><div class="fa-row">' + av(t.name, true) + '<div class="fa-grow"><div class="ttl" style="font-size:17px">' + esc(t.name) + '</div><div class="fa-sub">' + esc(t.role) + '</div></div></div>' +
        '<div class="fa-row"><span class="fa-grow">Experience</span><span class="r">' + t.exp + ' years</span></div>' +
        '<div class="fa-row"><span class="fa-grow">Certified</span><span class="r">' + t.certs.map(esc).join('<br>') + '</span></div>' +
        '<div class="fa-row"><span class="fa-grow">Good at</span><span class="r">' + t.spec.map(esc).join(', ') + '</span></div>' +
        '<div class="fa-row"><span class="fa-grow">On the floor</span><span class="r">' + esc(t.slots) + '</span></div>' +
        '<div class="fa-row"><span class="fa-grow">WhatsApp</span><span class="r" style="user-select:all">' + esc(t.phone) + '</span></div></div>' +
        '<div class="fa-btns"><button class="fa-btn dark" data-act="sheet" data-v="pt">Book a check-in</button></div>';
      if (v.gymTab === 'team') body = '<div class="fa-group">' + st.trainers.map((c) => '<div class="fa-row">' + av(c.name) + '<div class="fa-grow"><div class="ttl">' + esc(c.name) + '</div><div class="fa-sub">' + esc(c.role) + ' \u00b7 ' + c.exp + ' yrs</div></div></div>').join('') + '</div>';
      if (v.gymTab === 'eq') {
        const cats = [...new Set(st.equipment.map((e) => e.cat))];
        body = cats.map((c) => '<div class="fa-sec" style="margin-top:12px">' + esc(c) + '</div><div class="fa-group">' + st.equipment.filter((e) => e.cat === c).map((e) => '<div class="fa-row"><div class="fa-grow"><div class="ttl">' + esc(e.name) + '</div><div class="fa-sub">' + e.qty + ' \u00b7 ' + esc(e.brand) + (e.note ? ' \u00b7 ' + esc(e.note) : '') + '</div></div>' + (e.status === 'new' ? '<span class="fa-tag ok">New</span>' : e.status === 'maint' ? '<span class="fa-tag wa">Under repair</span>' : '') + '</div>').join('') + '</div>').join('');
      }
      if (v.gymTab === 'fmt') body = '<div class="fa-group">' + st.formats.map((f) => '<div class="fa-row"><div class="fa-grow"><div class="ttl">' + esc(f.name) + '</div><div class="fa-sub">' + esc(f.desc) + '</div></div><span class="r">' + esc(f.len) + '</span></div>').join('') + '</div>';
      return '<div class="fa-top"><span class="fa-open">Open now \u00b7 ' + hrs + '</span></div><h1 class="fa-h1">' + esc(g.name) + '</h1>' +
        '<div class="fa-group" style="margin-top:10px"><div class="fa-row"><span class="fa-grow">Address</span><span class="r">' + esc(g.address) + '</span></div><div class="fa-row"><span class="fa-grow">Phone</span><span class="r" style="user-select:all">' + esc(g.phone) + '</span></div><div class="fa-row"><span class="fa-grow">Hours</span><span class="r">Mon\u2013Fri ' + g.hours.weekdays + '<br>Sat ' + g.hours.saturday + ' \u00b7 Sun ' + g.hours.sunday + '</span></div></div>' +
        '<div class="fa-seg">' + tabs.map((x) => '<button class="' + (v.gymTab === x[0] ? 'on' : '') + '" data-act="gtab" data-v="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>' + body;
    }

    // ---------- Account ----------
    function account() {
      const st = S(), m = me(), inv = st.invoices[m.id] || {}, due = U.parse(inv.due || U.key(U.T));
      const daysLeft = Math.round((due - U.T) / 86400000), early = daysLeft >= 7, paid = inv.status === 'paid', over = !paid && daysLeft < 0;
      const promos = st.promotions.filter((p) => p.audience === 'all' || p.audience === m.goal);
      const notes = (st.notices[m.id] || []).slice().reverse();
      return '<div class="fa-top"><span>' + esc(m.phone) + '</span></div><h1 class="fa-h1">' + esc(m.name) + '</h1>' +
        '<div class="fa-sec">Membership</div><div class="fa-group" data-sec="bill"><div class="fa-row"><span class="fa-grow">Plan</span><span class="r">' + esc(m.membership.plan) + '</span></div><div class="fa-row"><span class="fa-grow">Coach</span><span class="r">' + esc(trainer(m.pt).name) + '</span></div>' +
        '<div class="fa-row"><span class="fa-grow">' + (paid ? 'Paid until' : 'Next bill') + '</span><span class="r">' + U.fmtDate(due, true) + '</span></div>' +
        (paid ? '' : '<div class="fa-row"><span class="fa-grow">Amount</span><span class="r"><b style="color:var(--fg)">' + U.inr(m.membership.fee * (early ? 0.95 : 1)) + '</b>' + (early ? ' <s>' + U.inr(m.membership.fee) + '</s>' : '') + '</span></div>') + '</div>' +
        (paid ? '<div class="fa-btns"><div class="fa-btn done">' + ic('check') + 'Paid. Thank you.</div></div>' :
          '<p class="fa-sub" style="margin:8px 4px 0">' + (over ? '<span style="color:var(--skip);font-weight:600">Overdue by ' + -daysLeft + ' days.</span> ' : '') + (early ? 'Pay a week early and save 5%.' : 'Due in ' + Math.max(0, daysLeft) + ' days.') + '</p><div class="fa-btns"><button class="fa-btn dark" data-act="sheet" data-v="pay">Pay ' + U.inr(m.membership.fee * (early ? 0.95 : 1)) + '</button></div>') +
        '<div class="fa-sec">Offers</div><div class="fa-group">' + promos.map((p) => '<div class="fa-row"><div class="fa-grow"><div class="ttl">' + esc(p.title) + '</div><div class="fa-sub">' + esc(p.body) + '</div><div class="fa-sub" style="margin-top:3px">Until ' + U.fmtDate(U.parse(p.ends)) + '</div></div></div>').join('') + '</div>' +
        '<div class="fa-sec">Notifications</div><div class="fa-group">' + notes.map((n) => '<div class="fa-row"><div class="fa-grow"><div class="ttl">' + esc(n.title) + '</div><div class="fa-sub">' + esc(n.body) + '</div></div><span class="r" style="font-size:12px">' + esc(n.when) + '</span></div>').join('') + '</div>';
    }

    function sheet() {
      const m = me();
      if (v.sheet === 'pay') return '<div class="fa-sheet" data-act="close"><div data-stop="1"><h3>Pay by UPI</h3><p class="fa-sub">In the live app this opens your UPI app with the amount filled in.</p><div class="fa-btns"><button class="fa-btn" data-act="close">Not now</button><button class="fa-btn dark" data-act="paid">Mark as paid (demo)</button></div></div></div>';
      if (v.sheet === 'pt') { const t = trainer(m.pt); return '<div class="fa-sheet" data-act="close"><div data-stop="1"><h3>Check-in with ' + esc(first(t.name)) + '</h3><p class="fa-sub">' + esc(first(t.name)) + ' records weight, waist and body fat.</p><div class="fa-group" style="margin-top:12px">' + ['Tomorrow 7:00', 'Tomorrow 18:30', U.WD[U.addDays(U.T, 2).getDay()] + ' 8:00'].map((s) => '<button class="fa-row" style="width:100%" data-act="ptbook" data-v="' + s + '"><span class="fa-grow">' + s + '</span>' + ic('chev', 'ic chev') + '</button>').join('') + '</div><div class="fa-btns"><button class="fa-btn" data-act="close">Close</button></div></div></div>'; }
      return '';
    }

    function render() {
      const sc = { today, diet, progress, gym, me: account }[v.screen] || today;
      const old = root.querySelector('.fa-scroll');
      const keep = old && old.dataset.screen === v.screen ? old.scrollTop : 0;
      const now = new Date(), st = S(), m = me();
      const unread = (st.notices[m.id] || []).filter((n) => !n.read).length;
      const tabs = [['today', 'Today', 'today'], ['diet', 'Diet', 'diet'], ['progress', 'Progress', 'progress'], ['gym', 'Gym', 'gym'], ['me', 'Account', 'me']];
      root.innerHTML = '<div class="fa-status"><span>' + now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0') + '</span><span><i></i></span></div>' +
        '<div class="fa-scroll" data-screen="' + v.screen + '">' + sc() + '</div>' +
        '<nav class="fa-tabs">' + tabs.map((t) => '<button class="' + (v.screen === t[0] ? 'on' : '') + '" data-go="' + t[0] + '">' + ic(t[2]) + t[1] + (t[0] === 'me' && unread && v.screen !== 'me' ? '<span class="badge">' + unread + '</span>' : '') + '</button>').join('') + '</nav>' +
        sheet() + (v.toast ? '<div class="fa-toast" role="status">' + esc(v.toast) + '</div>' : '');
      const ns = root.querySelector('.fa-scroll'); if (ns) ns.scrollTop = keep;
    }

    root.addEventListener('click', (e) => {
      const st = S(), m = me();
      const go = e.target.closest('[data-go]');
      if (go && root.contains(go)) {
        v.screen = go.dataset.go; v.sheet = null;
        if (v.screen === 'me') (st.notices[m.id] || []).forEach((n) => (n.read = true));
        render(); const s = root.querySelector('.fa-scroll'); if (s) s.scrollTop = 0; return;
      }
      const b = e.target.closest('[data-act]');
      if (!b || !root.contains(b)) return;
      if (b.dataset.act === 'close' && e.target.closest('[data-stop]') && !e.target.closest('button')) return;
      const a = b.dataset.act;
      if (a === 'mlog') {
        const k = U.key(U.addDays(U.T, v.screen === 'diet' ? v.dayOff : 0));
        const L = (st.logs[m.id] = st.logs[m.id] || {}), day = (L[k] = L[k] || {});
        if (day[b.dataset.meal] === b.dataset.v) delete day[b.dataset.meal]; else day[b.dataset.meal] = b.dataset.v;
        save(); render();
      } else if (a === 'wlog') {
        const W = (st.wlogs[m.id] = st.wlogs[m.id] || {}), k = U.key(U.T);
        if (W[k] === b.dataset.v) delete W[k]; else W[k] = b.dataset.v;
        save(); render(); if (W[k]) toast(W[k] === 'done' ? 'Workout saved' : 'Marked as skipped');
      } else if (a === 'book') {
        const B = (st.bookings[m.id] = st.bookings[m.id] || {}); B[b.dataset.c] = !B[b.dataset.c]; save(); render(); toast(B[b.dataset.c] ? 'You\u2019re booked' : 'Booking cancelled');
      } else if (a === 'day') { v.dayOff = +b.dataset.o; render(); }
      else if (a === 'gtab') { v.gymTab = b.dataset.v; render(); }
      else if (a === 'sheet') { v.sheet = b.dataset.v; render(); }
      else if (a === 'close') { v.sheet = null; render(); }
      else if (a === 'paid') { const days = { Monthly: 30, Quarterly: 91, 'Half-yearly': 182, Annual: 365 }[m.membership.plan] || 30; st.invoices[m.id] = { status: 'paid', due: U.key(U.addDays(U.parse(st.invoices[m.id].due), days)) }; v.sheet = null; save(); render(); toast('Payment recorded'); }
      else if (a === 'ptbook') { v.sheet = null; (st.notices[m.id] = st.notices[m.id] || []).push({ id: 'n' + Date.now(), kind: 'coach', title: 'Check-in booked: ' + b.dataset.v, body: 'With ' + trainer(m.pt).name + '.', when: 'Now', read: true }); save(); render(); toast('Check-in booked'); }
    });
    root.addEventListener('input', (e) => {
      if (!e.target.classList.contains('fa-range')) return;
      v.adh = +e.target.value / 100;
      const m = me(), real = Math.round(FQ.adherence(S(), m) * 100) / 100;
      const c = root.querySelector('[data-slot="chart"]'); if (c) c.firstElementChild.outerHTML = FQ.chart(m, v.adh);
      whatif.outOnly = true; const parts = whatif(m, v.adh, real); whatif.outOnly = false;
      root.querySelector('[data-slot="whead"]').innerHTML = parts.head;
      root.querySelector('[data-slot="wout"]').innerHTML = parts.out;
      e.target.style.setProperty('--p', ((v.adh * 100 - 30) / 70 * 100) + '%');
    });
    FQ.subscribe((src) => { if (src !== id) render(); });
    render();
    return { root, set(o) { Object.assign(v, o); render(); }, get member() { return v.mid; }, get view() { return v; } };
  }
  window.FQApp = { mount };
})();
