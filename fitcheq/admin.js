/* fitcheq owner console. FQAdmin.mount(el, { view }) */
(function () {
  const FQ = window.FQ, U = FQ.util, ic = FQ.icon, esc = FQ.esc;
  let uid = 0;

  function mount(root, opts) {
    opts = opts || {};
    const id = 'adm' + ++uid;
    const v = { view: opts.view || 'overview', drawer: null, q: '', filter: 'all', dietMember: 'm1', week: 0, edit: null, toast: null };
    root.classList.add('fq-admin');
    const S = () => FQ.state();
    const tr = (tid) => S().trainers.find((t) => t.id === tid) || S().trainers[0];
    const av = (name, hue) => '<span class="ad-av">' + FQ.initials(name) + '</span>';
    const meter = (a) => '<span class="ad-meter"><i><b class="' + (a < 0.6 ? 'lo' : a < 0.75 ? 'mid' : '') + '" style="width:' + Math.round(a * 100) + '%"></b></i>' + Math.round(a * 100) + '%</span>';
    const daysTo = (k) => Math.round((U.parse(k) - U.T) / 86400000);
    const save = () => FQ.save(id);
    function toast(t) { v.toast = t; render(); clearTimeout(v._t); v._t = setTimeout(() => { v.toast = null; render(); }, 2200); }
    function notify(mid, n) { const st = S(); (st.notices[mid] = st.notices[mid] || []).push(Object.assign({ id: 'n' + Date.now() + Math.random(), when: 'Now' }, n)); }
    const invState = (m) => { const i = S().invoices[m.id] || { status: 'due', due: U.key(U.T) }; if (i.status !== 'paid' && daysTo(i.due) < 0) return Object.assign({}, i, { status: 'overdue' }); return i; };

    const NAV = [
      ['overview', 'Overview', 'home'], ['members', 'Members', 'users'], ['trainers', 'Trainers', 'star'], ['sessions', 'Sessions', 'calendar'],
      ['diet', 'Diet plans', 'diet'], ['workouts', 'Workout formats', 'list'], ['equipment', 'Equipment', 'dumbbell'],
      ['promos', 'Promotions', 'megaphone'], ['billing', 'Billing', 'bill'], ['gym', 'Gym profile', 'settings'],
    ];
    const head = (t, p, actions) => '<div class="ad-head"><div><h1>' + t + '</h1>' + (p ? '<p>' + p + '</p>' : '') + '</div>' + (actions ? '<div class="ad-btns">' + actions + '</div>' : '') + '</div>';

    // ---------- views ----------
    function overview() {
      const st = S(), ms = st.members;
      const adh = ms.map((m) => FQ.adherence(st, m)); const avg = adh.reduce((a, b) => a + b, 0) / ms.length;
      const lost = ms.filter((m) => m.goal !== 'gain').reduce((s, m) => s + (m.startWeight - m.current), 0);
      const gained = ms.filter((m) => m.goal === 'gain').reduce((s, m) => s + (m.current - m.startWeight), 0);
      const dues = ms.filter((m) => { const i = invState(m); return i.status !== 'paid' && daysTo(i.due) <= 7; });
      const duesAmt = dues.reduce((s, m) => s + m.membership.fee, 0);
      const attn = ms.map((m, i) => ({ m, a: adh[i], inv: invState(m) })).filter((x) => x.a < 0.6 || x.inv.status === 'overdue' || (x.inv.status !== 'paid' && daysTo(x.inv.due) <= 3));
      const wd = U.T.getDay(); const cls = st.classes.filter((c) => c.days.includes(wd)).sort((a, b) => a.time.localeCompare(b.time));
      const bars = []; for (let i = 6; i >= 0; i--) { const d = U.addDays(U.T, -i), k = U.key(d); let dn = 0, t = 0; ms.forEach((m) => { const l = (st.logs[m.id] || {})[k] || {}; Object.values(l).forEach((x) => { t++; if (x === 'done') dn++; }); }); bars.push({ d, p: t ? dn / t : 0, today: i === 0 }); }
      return head('Good to see you', U.WD[wd] + 'day, ' + U.fmtDate(U.T, true) + ' \u00b7 ' + esc(st.gym.name), '<button class="ad-btn" data-go="promos">' + ic('megaphone') + 'New promotion</button><button class="ad-btn pri" data-act="drawer" data-v="addMember">' + ic('plus') + 'Add member</button>') +
        '<div class="ad-kpis">' +
        '<div class="ad-kpi"><span>Active members</span><b>' + ms.length + '</b><small>' + st.trainers.length + ' coaches on the floor</small></div>' +
        '<div class="ad-kpi"><span>Diet followed, last 14 days</span><b>' + Math.round(avg * 100) + '%</b><small class="' + (avg >= 0.75 ? 'up' : 'dn') + '">' + (avg >= 0.75 ? 'On track' : 'Below the 75% goal') + '</small></div>' +
        '<div class="ad-kpi"><span>Weight lost by members</span><b>' + lost.toFixed(1) + ' kg</b><small class="up">+' + gained.toFixed(1) + ' kg gained by muscle-gain members</small></div>' +
        '<div class="ad-kpi"><span>Dues in the next 7 days</span><b>' + U.inr(duesAmt) + '</b><small class="' + (dues.length ? 'dn' : '') + '">' + dues.length + ' members</small></div></div>' +
        '<div class="ad-grid2"><div style="display:flex;flex-direction:column;gap:16px;min-width:0">' +
        '<section class="ad-panel"><header><h3>Needs attention</h3><span>' + attn.length + ' members</span></header><div class="ad-list">' +
        (attn.length ? attn.map((x) => '<button class="ad-li" style="text-align:left;width:100%" data-act="drawer" data-v="member" data-id="' + x.m.id + '">' + av(x.m.name, tr(x.m.pt).hue) + '<div class="g"><b>' + esc(x.m.name) + '</b><small>' + esc(tr(x.m.pt).name) + ' \u00b7 ' + FQ.goalLabel(x.m.goal) + '</small></div>' +
          (x.a < 0.6 ? '<span class="ad-pill no">Diet ' + Math.round(x.a * 100) + '%</span>' : '') + (x.inv.status === 'overdue' ? '<span class="ad-pill no">Overdue</span>' : x.inv.status !== 'paid' && daysTo(x.inv.due) <= 3 ? '<span class="ad-pill wa">Due in ' + daysTo(x.inv.due) + 'd</span>' : '') + ic('chev') + '</button>').join('') : '<div class="ad-empty">Everyone is on track.</div>') + '</div></section>' +
        '<section class="ad-panel"><header><h3>Coach load</h3><span>Members and how well they follow the plan</span></header><div class="ad-tablewrap"><table class="ad-table"><thead><tr><th>Coach</th><th class="r">Members</th><th>Diet followed</th><th class="r">Kg moved</th></tr></thead><tbody>' +
        st.trainers.map((t) => { const mine = ms.filter((m) => m.pt === t.id); const a = mine.length ? mine.reduce((s, m) => s + FQ.adherence(st, m), 0) / mine.length : 0; const kg = mine.reduce((s, m) => s + Math.abs(m.current - m.startWeight), 0); return '<tr><td><span class="ad-who">' + av(t.name, t.hue) + esc(t.name) + '</span></td><td class="r">' + mine.length + '</td><td>' + (mine.length ? meter(a) : '\u2014') + '</td><td class="r">' + kg.toFixed(1) + '</td></tr>'; }).join('') + '</tbody></table></div></section></div>' +
        '<div style="display:flex;flex-direction:column;gap:16px;min-width:0"><section class="ad-panel"><header><h3>Meals followed, whole gym</h3><span>Last 7 days</span></header><div class="ad-bars">' +
        bars.map((b) => '<div><em>' + Math.round(b.p * 100) + '%</em><i style="height:' + Math.max(4, b.p * 80) + 'px;' + (b.today ? 'opacity:.45' : '') + '"></i><span>' + (b.today ? 'Today' : U.WD[b.d.getDay()]) + '</span></div>').join('') + '</div></section>' +
        '<section class="ad-panel"><header><h3>Today\u2019s sessions</h3><span>' + cls.length + ' scheduled</span></header><div class="ad-list">' +
        cls.map((c) => { const bk = c.booked + Object.values(st.bookings).filter((b) => b[c.id]).length; return '<div class="ad-li"><b style="font-family:var(--display);width:48px;font-variant-numeric:tabular-nums">' + c.time + '</b><div class="g"><b>' + esc(c.name) + '</b><small>' + esc(tr(c.trainer).name) + ' \u00b7 ' + esc(c.room) + '</small></div><span class="ad-pill ' + (bk >= c.cap ? 'no' : bk / c.cap > 0.8 ? 'wa' : 'ok') + '">' + Math.min(bk, c.cap) + '/' + c.cap + '</span></div>'; }).join('') + '</div></section></div></div>';
    }

    function members() {
      const st = S(); const q = v.q.toLowerCase();
      const rows = st.members.filter((m) => (!q || m.name.toLowerCase().includes(q)) && (v.filter === 'all' || m.goal === v.filter || (v.filter === 'risk' && FQ.adherence(st, m) < 0.6)));
      return head('Members', st.members.length + ' active \u00b7 tap a row for progress and projections', '<button class="ad-btn pri" data-act="drawer" data-v="addMember">' + ic('plus') + 'Add member</button>') +
        '<div class="ad-toolbar"><div class="ad-filter">' + [['all', 'All'], ['lose', 'Fat loss'], ['gain', 'Muscle gain'], ['recomp', 'Recomposition'], ['risk', 'Below 60%']].map((f) => '<button class="' + (v.filter === f[0] ? 'on' : '') + '" data-act="filter" data-v="' + f[0] + '">' + f[1] + '</button>').join('') + '</div>' +
        '<label class="ad-search">' + ic('search') + '<input id="' + id + '-q" placeholder="Search members" value="' + esc(v.q) + '"></label></div>' +
        '<section class="ad-panel"><div class="ad-tablewrap"><table class="ad-table"><thead><tr><th>Member</th><th>Coach</th><th>Goal</th><th class="r">Start</th><th class="r">Now</th><th class="r">Target</th><th>Diet followed</th><th>30-day forecast</th><th>Renewal</th></tr></thead><tbody>' +
        (rows.length ? rows.map((m) => { const a = FQ.adherence(st, m), f = FQ.weekly(m, a) * 30 / 7, inv = invState(m); return '<tr class="click" data-act="drawer" data-v="member" data-id="' + m.id + '"><td><span class="ad-who">' + av(m.name, tr(m.pt).hue) + '<span>' + esc(m.name) + '<small>' + m.age + ' \u00b7 ' + FQ.dietLabel(m.diet) + '</small></span></span></td><td>' + esc(tr(m.pt).name) + '</td><td>' + FQ.goalLabel(m.goal) + '</td><td class="r">' + m.startWeight.toFixed(1) + '</td><td class="r"><b>' + m.current.toFixed(1) + '</b></td><td class="r">' + m.target.toFixed(1) + '</td><td>' + meter(a) + '</td><td>' + (f < 0 ? '\u2212' : '+') + Math.abs(f).toFixed(1) + ' kg</td><td>' + (inv.status === 'paid' ? '<span class="ad-pill ok">Paid</span>' : inv.status === 'overdue' ? '<span class="ad-pill no">Overdue</span>' : '<span class="ad-pill ' + (daysTo(inv.due) <= 7 ? 'wa' : '') + '">' + U.fmtDate(U.parse(inv.due)) + '</span>') + '</td></tr>'; }).join('') : '<tr><td colspan="9" class="ad-empty">No members match.</td></tr>') + '</tbody></table></div></section>';
    }

    function trainers() {
      const st = S();
      return head('Trainers', st.trainers.length + ' coaches', '<button class="ad-btn pri" data-act="drawer" data-v="addTrainer">' + ic('plus') + 'Add trainer</button>') +
        '<div class="ad-cards">' + st.trainers.map((t) => { const mine = st.members.filter((m) => m.pt === t.id); return '<div class="ad-card"><div class="ad-who">' + av(t.name, t.hue) + '<div><h4>' + esc(t.name) + '</h4><div class="sub">' + esc(t.role) + '</div></div></div><div class="ad-tags">' + t.spec.map((s) => '<span class="ad-pill ac">' + esc(s) + '</span>').join('') + '</div><dl class="ad-kv"><dt>Experience</dt><dd>' + t.exp + ' yrs</dd><dt>Certified</dt><dd>' + t.certs.map(esc).join(', ') + '</dd><dt>Slots</dt><dd>' + esc(t.slots) + '</dd><dt>Phone</dt><dd>' + esc(t.phone) + '</dd><dt>Members</dt><dd>' + mine.length + '</dd><dt>Classes</dt><dd>' + st.classes.filter((c) => c.trainer === t.id).length + ' a week</dd></dl></div>'; }).join('') + '</div>';
    }

    function sessions() {
      const st = S(); const order = [1, 2, 3, 4, 5, 6, 0]; const times = [...new Set(st.classes.map((c) => c.time))].sort();
      let g = '<div class="hd"></div>' + order.map((d) => '<div class="hd ' + (d === U.T.getDay() ? 'today' : '') + '">' + U.WD[d] + '</div>').join('');
      times.forEach((t) => { g += '<div class="tm">' + t + '</div>' + order.map((d) => '<div>' + st.classes.filter((c) => c.time === t && c.days.includes(d)).map((c) => '<div class="ad-slot ' + (c.booked >= c.cap ? 'full' : '') + '"><b>' + esc(c.name) + '</b><span>' + esc(tr(c.trainer).name.split(' ')[0]) + ' \u00b7 ' + c.dur + 'm \u00b7 ' + c.booked + '/' + c.cap + '</span></div>').join('') + '</div>').join(''); });
      return head('Sessions', st.classes.length + ' classes, ' + st.classes.reduce((s, c) => s + c.days.length, 0) + ' slots a week. Members book from the app.', '<button class="ad-btn pri" data-act="drawer" data-v="addSession">' + ic('plus') + 'New session</button>') +
        '<section class="ad-panel"><div class="ad-tablewrap"><div class="ad-tt">' + g + '</div></div></section>';
    }

    function weekDates() { const d = U.T, mon = U.addDays(d, -((d.getDay() + 6) % 7) + v.week * 7); return [0, 1, 2, 3, 4, 5, 6].map((i) => U.addDays(mon, i)); }
    function diet() {
      const st = S(), m = st.members.find((x) => x.id === v.dietMember) || st.members[0], days = weekDates();
      const meals = days.map((d) => FQ.dayMeals(st, m, d));
      let g = '<div class="hd">Meal</div>' + days.map((d) => '<div class="hd" style="' + (U.key(d) === U.key(U.T) ? 'color:var(--accent)' : '') + '">' + U.WD[d.getDay()] + ' ' + d.getDate() + '</div>').join('');
      FQ.MEALS.forEach((ml, j) => {
        g += '<div class="ml">' + ml.name + '<small>' + ml.time + '</small></div>';
        days.forEach((d, i) => {
          const x = meals[i][j], k = U.key(d), ed = v.edit && v.edit.k === k && v.edit.meal === ml.id;
          g += '<div>' + (ed ? '<div class="ad-cell edited"><textarea id="' + id + '-ta">' + esc(x.items.join('\n')) + '</textarea><div class="kc"><input id="' + id + '-kc" type="number" value="' + x.kcal + '" aria-label="kcal"><input id="' + id + '-pr" type="number" value="' + x.protein + '" aria-label="protein"></div><div class="kc"><button class="ad-btn sm pri" data-act="cellsave">Save</button><button class="ad-btn sm" data-act="cellcancel">Cancel</button></div></div>'
            : '<button class="ad-cell ' + (x.custom ? 'edited' : '') + '" data-act="cell" data-k="' + k + '" data-meal="' + ml.id + '">' + esc(x.items.join(' + ')) + '<small>' + x.kcal + ' kcal \u00b7 ' + x.protein + ' g</small></button>') + '</div>';
        });
      });
      g += '<div class="ml">Total</div>' + meals.map((dm) => '<div style="font-weight:700;font-variant-numeric:tabular-nums">' + dm.reduce((s, x) => s + x.kcal, 0) + ' kcal<small style="display:block;color:var(--muted);font-weight:500">' + dm.reduce((s, x) => s + x.protein, 0) + ' g protein</small></div>').join('');
      return head('Diet plans', 'One chart per member, per week. Click any cell to edit it. Members see changes immediately.', '<label class="ad-btn" style="cursor:pointer">' + ic('upload') + 'Upload chart (CSV)<input id="' + id + '-csv" type="file" accept=".csv,text/csv" hidden></label><button class="ad-btn pri" data-act="publish">Publish week ' + U.isoWeek(days[0]) + ' to ' + esc(m.name.split(' ')[0]) + '</button>') +
        '<div class="ad-toolbar"><div class="ad-filter">' + st.members.map((x) => '<button class="' + (x.id === m.id ? 'on' : '') + '" data-act="dm" data-v="' + x.id + '">' + esc(x.name.split(' ')[0]) + '</button>').join('') + '</div>' +
        '<div class="ad-filter"><button class="' + (v.week === 0 ? 'on' : '') + '" data-act="wk" data-v="0">This week</button><button class="' + (v.week === 1 ? 'on' : '') + '" data-act="wk" data-v="1">Next week</button></div></div>' +
        '<p style="margin:0 0 12px;color:var(--muted);font-size:13px">' + esc(m.name) + ' \u00b7 ' + FQ.goalLabel(m.goal) + ' \u00b7 ' + FQ.dietLabel(m.diet) + ' \u00b7 target ' + m.plan.kcal + ' kcal, ' + m.plan.protein + ' g protein \u00b7 coach ' + esc(tr(m.pt).name) + '</p>' +
        '<section class="ad-panel"><div class="ad-tablewrap"><div class="ad-diet">' + g + '</div></div></section>' +
        '<p style="color:var(--faint);font-size:12px;margin-top:10px">CSV columns: <code>day, meal, items, kcal, protein</code>. Day is Mon\u2013Sun, meal is breakfast / midmorning / lunch / snack / dinner, items separated by \u201c+\u201d.</p>';
    }

    function workouts() {
      const st = S();
      return head('Workout formats', 'The formats your coaches program. Members see these in the Gym tab.', '<button class="ad-btn pri" data-act="drawer" data-v="addFormat">' + ic('plus') + 'Add format</button>') +
        '<div class="ad-cards">' + st.formats.map((f) => '<div class="ad-card"><h4>' + esc(f.name) + '</h4><div class="ad-tags"><span class="ad-pill">' + esc(f.len) + '</span><span class="ad-pill ' + (f.level === 'High' ? 'no' : f.level === 'Low' ? 'ok' : 'wa') + '">' + esc(f.level) + ' intensity</span></div><div class="sub">' + esc(f.desc) + '</div></div>').join('') + '</div>';
    }

    function equipment() {
      const st = S();
      return head('Equipment', st.equipment.reduce((s, e) => s + e.qty, 0) + ' pieces across ' + st.equipment.length + ' types', '<button class="ad-btn pri" data-act="drawer" data-v="addEquip">' + ic('plus') + 'Add equipment</button>') +
        '<section class="ad-panel"><div class="ad-tablewrap"><table class="ad-table"><thead><tr><th>Equipment</th><th>Category</th><th>Brand</th><th class="r">Qty</th><th>Added</th><th>Status</th><th></th></tr></thead><tbody>' +
        st.equipment.map((e) => '<tr><td><b>' + esc(e.name) + '</b>' + (e.note ? '<small style="display:block;color:var(--muted)">' + esc(e.note) + '</small>' : '') + '</td><td>' + esc(e.cat) + '</td><td>' + esc(e.brand) + '</td><td class="r">' + e.qty + '</td><td>' + U.fmtDate(U.parse(e.added), true) + '</td><td>' + (e.status === 'new' ? '<span class="ad-pill ac">New</span>' : e.status === 'maint' ? '<span class="ad-pill wa">Maintenance</span>' : '<span class="ad-pill ok">In service</span>') + '</td><td class="r"><button class="ad-btn sm" data-act="eqtoggle" data-id="' + e.id + '">' + (e.status === 'maint' ? 'Back in service' : 'Send to maintenance') + '</button></td></tr>').join('') + '</tbody></table></div></section>';
    }

    function promos() {
      const st = S();
      return head('Promotions', 'Shown on every member\u2019s Today screen and in their notifications.', '<button class="ad-btn pri" data-act="drawer" data-v="addPromo">' + ic('plus') + 'New promotion</button>') +
        '<div class="ad-cards">' + st.promotions.map((p, i) => '<div class="ad-card"><div class="ad-tags"><span class="ad-pill no">' + esc(p.tag) + '</span>' + (i === 0 ? '<span class="ad-pill ac">Featured on Today</span>' : '') + '</div><h4>' + esc(p.title) + '</h4><div class="sub">' + esc(p.body) + '</div><div class="sub">Until ' + U.fmtDate(U.parse(p.ends), true) + ' \u00b7 ' + (p.audience === 'all' ? 'All members' : FQ.goalLabel(p.audience) + ' members') + '</div><div class="ad-btns">' + (i ? '<button class="ad-btn sm" data-act="feature" data-id="' + p.id + '">Feature</button>' : '') + '<button class="ad-btn sm" data-act="unpromo" data-id="' + p.id + '">End now</button></div></div>').join('') + '</div>';
    }

    function billing() {
      const st = S(); const rows = st.members.map((m) => ({ m, i: invState(m) }));
      const pend = rows.filter((r) => r.i.status !== 'paid'), over = rows.filter((r) => r.i.status === 'overdue');
      return head('Billing', 'Renewals, reminders and early-payment discounts.', '') +
        '<div class="ad-kpis"><div class="ad-kpi"><span>Pending</span><b>' + U.inr(pend.reduce((s, r) => s + r.m.membership.fee, 0)) + '</b><small>' + pend.length + ' invoices</small></div><div class="ad-kpi"><span>Overdue</span><b>' + U.inr(over.reduce((s, r) => s + r.m.membership.fee, 0)) + '</b><small class="dn">' + over.length + ' members</small></div><div class="ad-kpi"><span>Paid this cycle</span><b>' + rows.filter((r) => r.i.status === 'paid').length + '</b><small>members</small></div><div class="ad-kpi"><span>Early-pay discount</span><b>5%</b><small>7+ days before due date</small></div></div>' +
        '<section class="ad-panel"><div class="ad-tablewrap"><table class="ad-table"><thead><tr><th>Member</th><th>Plan</th><th class="r">Amount</th><th>Due</th><th>Status</th><th class="r"></th></tr></thead><tbody>' +
        rows.sort((a, b) => a.i.due.localeCompare(b.i.due)).map((r) => { const dd = daysTo(r.i.due); return '<tr><td><span class="ad-who">' + av(r.m.name, tr(r.m.pt).hue) + esc(r.m.name) + '</span></td><td>' + esc(r.m.membership.plan) + '</td><td class="r">' + U.inr(r.m.membership.fee) + '</td><td>' + U.fmtDate(U.parse(r.i.due), true) + '</td><td>' + (r.i.status === 'paid' ? '<span class="ad-pill ok">Paid</span>' : r.i.status === 'overdue' ? '<span class="ad-pill no">Overdue ' + -dd + 'd</span>' : dd >= 7 ? '<span class="ad-pill ac">Early-pay open</span>' : '<span class="ad-pill wa">Due in ' + dd + 'd</span>') + '</td><td class="r">' + (r.i.status === 'paid' ? '' : '<span class="ad-btns" style="justify-content:flex-end"><button class="ad-btn sm" data-act="remind" data-id="' + r.m.id + '">' + ic('bell') + 'Remind</button><button class="ad-btn sm" data-act="markpaid" data-id="' + r.m.id + '">Mark paid</button></span>') + '</td></tr>'; }).join('') + '</tbody></table></div></section>';
    }

    function gym() {
      const g = S().gym;
      return head('Gym profile', 'What members see in the Gym tab.', '') +
        '<section class="ad-panel" style="max-width:640px;padding:4px 18px 18px"><form class="ad-form" data-form="gym">' +
        '<label class="full">Gym name<input name="name" value="' + esc(g.name) + '" required></label><label class="full">About<input name="about" value="' + esc(g.about) + '"></label><label class="full">Address<input name="address" value="' + esc(g.address) + '"></label><label>Phone<input name="phone" value="' + esc(g.phone) + '"></label><label>Mon\u2013Fri hours<input name="weekdays" value="' + esc(g.hours.weekdays) + '"></label><label>Saturday<input name="saturday" value="' + esc(g.hours.saturday) + '"></label><label>Sunday<input name="sunday" value="' + esc(g.hours.sunday) + '"></label>' +
        '<div class="acts"><button type="button" class="ad-btn" data-act="reset">Reset demo data</button><button class="ad-btn pri">Save profile</button></div></form></section>';
    }

    // ---------- drawers ----------
    const opt = (arr, sel) => arr.map((o) => '<option value="' + o[0] + '"' + (o[0] === sel ? ' selected' : '') + '>' + o[1] + '</option>').join('');
    function drawer() {
      const st = S(), d = v.drawer; if (!d) return '';
      let body = '';
      if (d.t === 'member') {
        const m = st.members.find((x) => x.id === d.id); if (!m) return '';
        const a = FQ.adherence(st, m), e100 = FQ.eta(m, 1), ea = FQ.eta(m, a);
        body = '<div class="ad-detail"><div class="ad-who">' + av(m.name, tr(m.pt).hue) + '<div><h2>' + esc(m.name) + '</h2><div style="color:var(--muted)">' + FQ.goalLabel(m.goal) + ' \u00b7 ' + esc(tr(m.pt).name) + ' \u00b7 ' + m.membership.plan + '</div></div></div>' +
          '<div class="stats"><div><span>Start</span><b>' + m.startWeight.toFixed(1) + '</b></div><div><span>Now</span><b>' + m.current.toFixed(1) + '</b></div><div><span>Target</span><b>' + m.target.toFixed(1) + '</b></div></div>' +
          FQ.chart(m, a, { w: 400, h: 190 }) +
          '<dl class="ad-kv" style="margin-top:14px"><dt>Diet followed (14 days)</dt><dd>' + meter(a) + '</dd><dt>Forecast, next 30 days</dt><dd>' + (FQ.weekly(m, a) < 0 ? '\u2212' : '+') + Math.abs(FQ.weekly(m, a) * 30 / 7).toFixed(1) + ' kg at current pace</dd><dt>If they follow 100%</dt><dd>' + (FQ.weekly(m, 1) < 0 ? '\u2212' : '+') + Math.abs(FQ.weekly(m, 1) * 30 / 7).toFixed(1) + ' kg a month</dd><dt>Target date at 100%</dt><dd>' + (e100 ? U.fmtDate(e100.date, true) : '\u2014') + '</dd><dt>Target date at current pace</dt><dd>' + (ea ? U.fmtDate(ea.date, true) : 'Not reached') + '</dd><dt>Calories / protein</dt><dd>' + m.plan.kcal + ' kcal \u00b7 ' + m.plan.protein + ' g</dd><dt>Diet</dt><dd>' + FQ.dietLabel(m.diet) + '</dd><dt>Age \u00b7 height</dt><dd>' + m.age + ' \u00b7 ' + m.height + ' cm</dd><dt>Phone</dt><dd>' + esc(m.phone) + '</dd><dt>Waist</dt><dd>' + m.meas.waist[0] + ' \u2192 ' + m.meas.waist[1] + ' cm</dd><dt>Body fat</dt><dd>' + m.meas.fat[0] + ' \u2192 ' + m.meas.fat[1] + '%</dd></dl>' +
          '<form class="ad-form" data-form="weigh" style="grid-template-columns:1fr auto;align-items:end"><label>Record today\u2019s weight (kg)<input name="w" type="number" step="0.1" value="' + m.current.toFixed(1) + '"></label><button class="ad-btn">Save</button></form>' +
          '<div class="ad-btns" style="margin-top:16px"><button class="ad-btn" data-act="editdiet" data-id="' + m.id + '">' + ic('diet') + 'Edit diet</button><a class="ad-btn" href="member.html#' + m.id + '" target="_blank" rel="noopener" style="text-decoration:none">Open their app</a></div></div>';
      }
      if (d.t === 'addMember') body = '<h2>Add member</h2><p style="color:var(--muted);margin:0">They get a login link on WhatsApp and see their plan straight away.</p><form class="ad-form" data-form="member">' +
        '<label class="full">Full name<input name="name" required placeholder="e.g. Karan Malhotra"></label><label>Phone<input name="phone" required placeholder="+91"></label><label>Age<input name="age" type="number" value="30" min="12" max="90"></label><label>Gender<select name="gender">' + opt([['M', 'Male'], ['F', 'Female'], ['O', 'Other']]) + '</select></label><label>Height (cm)<input name="height" type="number" value="170"></label>' +
        '<label>Weight today (kg)<input name="sw" type="number" step="0.1" value="80" required></label><label>Target weight (kg)<input name="tw" type="number" step="0.1" value="72" required></label><label>Goal<select name="goal">' + opt([['lose', 'Fat loss'], ['gain', 'Muscle gain'], ['recomp', 'Recomposition']]) + '</select></label><label>Diet<select name="diet">' + opt([['veg', 'Vegetarian'], ['egg', 'Eggetarian'], ['nonveg', 'Non-vegetarian']]) + '</select></label>' +
        '<label>Personal trainer<select name="pt">' + opt(st.trainers.map((t) => [t.id, t.name])) + '</select></label><label>Plan<select name="plan">' + opt([['Monthly', 'Monthly \u00b7 \u20b92,800'], ['Quarterly', 'Quarterly \u00b7 \u20b97,500'], ['Half-yearly', 'Half-yearly \u00b7 \u20b913,500'], ['Annual', 'Annual \u00b7 \u20b924,000']], 'Quarterly') + '</select></label>' +
        '<div class="acts"><button type="button" class="ad-btn" data-act="close">Cancel</button><button class="ad-btn pri">Add member</button></div></form>';
      if (d.t === 'addTrainer') body = '<h2>Add trainer</h2><form class="ad-form" data-form="trainer"><label class="full">Name<input name="name" required></label><label class="full">Role<input name="role" placeholder="e.g. Strength coach" required></label><label>Experience (years)<input name="exp" type="number" value="3"></label><label>Phone<input name="phone" placeholder="+91"></label><label class="full">Certifications (comma separated)<input name="certs" placeholder="ACE CPT, ISSA Nutrition"></label><label class="full">Specialities (comma separated)<input name="spec" placeholder="Fat loss, Mobility"></label><label class="full">Floor hours<input name="slots" placeholder="6:00\u201310:00 \u00b7 17:00\u201320:00"></label><div class="acts"><button type="button" class="ad-btn" data-act="close">Cancel</button><button class="ad-btn pri">Add trainer</button></div></form>';
      if (d.t === 'addSession') body = '<h2>New session</h2><form class="ad-form" data-form="session"><label class="full">Session name<input name="name" required placeholder="e.g. Sunrise yoga"></label><label>Coach<select name="trainer">' + opt(st.trainers.map((t) => [t.id, t.name])) + '</select></label><label>Room<input name="room" value="Studio A"></label><label>Start time<input name="time" type="time" value="07:00" required></label><label>Duration (min)<input name="dur" type="number" value="45"></label><label>Capacity<input name="cap" type="number" value="15"></label><label class="full">Days<span style="display:flex;gap:8px;flex-wrap:wrap;font-weight:500;color:var(--fg)">' + [1, 2, 3, 4, 5, 6, 0].map((x) => '<span style="display:inline-flex;gap:4px;align-items:center"><input type="checkbox" name="d' + x + '" style="height:auto"' + (x >= 1 && x <= 5 ? ' checked' : '') + '>' + U.WD[x] + '</span>').join('') + '</span></label><div class="acts"><button type="button" class="ad-btn" data-act="close">Cancel</button><button class="ad-btn pri">Add to timetable</button></div></form>';
      if (d.t === 'addFormat') body = '<h2>Add workout format</h2><form class="ad-form" data-form="format"><label class="full">Name<input name="name" required></label><label>Length<input name="len" value="45 min"></label><label>Intensity<select name="level">' + opt([['Low', 'Low'], ['Medium', 'Medium'], ['High', 'High']], 'Medium') + '</select></label><label class="full">Description<textarea name="desc"></textarea></label><div class="acts"><button type="button" class="ad-btn" data-act="close">Cancel</button><button class="ad-btn pri">Add format</button></div></form>';
      if (d.t === 'addEquip') body = '<h2>Add equipment</h2><form class="ad-form" data-form="equip"><label class="full">Name<input name="name" required placeholder="e.g. Hack squat machine"></label><label>Category<select name="cat">' + opt([['Cardio', 'Cardio'], ['Strength', 'Strength'], ['Machines', 'Machines'], ['Functional', 'Functional']]) + '</select></label><label>Quantity<input name="qty" type="number" value="1" min="1"></label><label>Brand<input name="brand"></label><label>Status<select name="status">' + opt([['new', 'New'], ['ok', 'In service'], ['maint', 'Maintenance']]) + '</select></label><label class="full">Note for members<input name="note" placeholder="Where it is, how to use it"></label><label class="full" style="flex-direction:row;align-items:center;gap:8px;color:var(--fg)"><input type="checkbox" name="announce" checked style="height:auto"> Announce it to members</label><div class="acts"><button type="button" class="ad-btn" data-act="close">Cancel</button><button class="ad-btn pri">Add equipment</button></div></form>';
      if (d.t === 'addPromo') body = '<h2>New promotion</h2><form class="ad-form" data-form="promo"><label class="full">Headline<input name="title" required placeholder="e.g. New Year: 2 months free on annual"></label><label class="full">Details<textarea name="body" required></textarea></label><label>Label<input name="tag" value="Offer"></label><label>Ends on<input name="ends" type="date" value="' + U.key(U.addDays(U.T, 14)) + '"></label><label class="full">Who sees it<select name="audience">' + opt([['all', 'All members'], ['lose', 'Fat-loss members'], ['gain', 'Muscle-gain members'], ['recomp', 'Recomposition members']]) + '</select></label><div class="acts"><button type="button" class="ad-btn" data-act="close">Cancel</button><button class="ad-btn pri">Send to members</button></div></form>';
      return '<div class="ad-drawer" data-act="close"><section data-stop="1">' + body + '</section></div>';
    }

    function render() {
      const view = { overview, members, trainers, sessions, diet, workouts, equipment, promos, billing, gym }[v.view] || overview;
      const st = S();
      const main = root.querySelector('.ad-main'); const keep = main && main.dataset.v === v.view ? main.scrollTop : 0;
      const focusQ = document.activeElement && document.activeElement.id === id + '-q';
      const counts = { members: st.members.length, trainers: st.trainers.length, sessions: st.classes.length, equipment: st.equipment.length, promos: st.promotions.length };
      root.innerHTML = '<aside class="ad-side"><div class="ad-brand">fitcheq<span>.</span></div><div class="ad-gym">' + esc(st.gym.name) + ' \u00b7 Owner</div>' +
        NAV.map((n) => '<button class="ad-nav ' + (v.view === n[0] ? 'on' : '') + '" data-go="' + n[0] + '">' + ic(n[2]) + n[1] + (counts[n[0]] ? '<span class="ct">' + counts[n[0]] + '</span>' : '') + '</button>').join('') +
        '<div class="foot">Preview with sample data</div></aside><main class="ad-main" data-v="' + v.view + '">' + view() + '</main>' + drawer() + (v.toast ? '<div class="ad-toast" role="status">' + esc(v.toast) + '</div>' : '');
      const nm = root.querySelector('.ad-main'); nm.scrollTop = keep;
      if (focusQ) { const q = root.querySelector('#' + id + '-q'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
      const ta = root.querySelector('#' + id + '-ta'); if (ta) ta.focus();
    }

    // ---------- events ----------
    root.addEventListener('click', (e) => {
      const st = S();
      const go = e.target.closest('[data-go]');
      if (go && root.contains(go)) { v.view = go.dataset.go; v.drawer = null; v.edit = null; render(); root.querySelector('.ad-main').scrollTop = 0; return; }
      const b = e.target.closest('[data-act]'); if (!b || !root.contains(b)) return;
      if (b.dataset.act === 'close' && e.target.closest('[data-stop]') && !e.target.closest('button')) return;
      const a = b.dataset.act, did = b.dataset.id;
      if (a === 'drawer') { v.drawer = { t: b.dataset.v, id: did }; render(); }
      else if (a === 'close') { v.drawer = null; render(); }
      else if (a === 'filter') { v.filter = b.dataset.v; render(); }
      else if (a === 'dm') { v.dietMember = b.dataset.v; v.edit = null; render(); }
      else if (a === 'wk') { v.week = +b.dataset.v; v.edit = null; render(); }
      else if (a === 'cell') { v.edit = { k: b.dataset.k, meal: b.dataset.meal }; render(); }
      else if (a === 'cellcancel') { v.edit = null; render(); }
      else if (a === 'cellsave') {
        const items = root.querySelector('#' + id + '-ta').value.split('\n').map((s) => s.trim()).filter(Boolean);
        const D = (st.diet[v.dietMember] = st.diet[v.dietMember] || {}); const day = (D[v.edit.k] = D[v.edit.k] || {});
        day[v.edit.meal] = { items: items.length ? items : ['\u2014'], kcal: +root.querySelector('#' + id + '-kc').value || 0, protein: +root.querySelector('#' + id + '-pr').value || 0 };
        v.edit = null; save(); toast('Meal updated');
      } else if (a === 'publish') {
        const m = st.members.find((x) => x.id === v.dietMember); const wk = U.isoWeek(weekDates()[0]);
        notify(m.id, { kind: 'coach', title: tr(m.pt).name.split(' ')[0] + ' uploaded week ' + wk + ' diet', body: 'Your plan for ' + (v.week ? 'next' : 'this') + ' week is ready in Diet.' });
        save(); toast('Week ' + wk + ' sent to ' + m.name.split(' ')[0] + '\u2019s app');
      } else if (a === 'editdiet') { v.dietMember = did; v.view = 'diet'; v.drawer = null; render(); }
      else if (a === 'eqtoggle') { const eq = st.equipment.find((x) => x.id === did); eq.status = eq.status === 'maint' ? 'ok' : 'maint'; save(); toast(eq.name + (eq.status === 'maint' ? ' marked for maintenance' : ' back in service')); }
      else if (a === 'unpromo') { st.promotions = st.promotions.filter((p) => p.id !== did); save(); toast('Promotion ended'); }
      else if (a === 'feature') { const i = st.promotions.findIndex((p) => p.id === did); st.promotions.unshift(st.promotions.splice(i, 1)[0]); save(); toast('Now featured on members\u2019 Today screen'); }
      else if (a === 'remind') { const m = st.members.find((x) => x.id === did); const i = invState(m); notify(did, { kind: 'bill', title: 'Reminder: ' + U.inr(m.membership.fee) + ' due ' + U.fmtDate(U.parse(i.due)), body: daysTo(i.due) >= 7 ? 'Pay a week early and save 5%.' : 'Pay at the desk or by UPI in the app.' }); save(); toast('Reminder sent to ' + m.name.split(' ')[0] + '\u2019s app'); }
      else if (a === 'markpaid') { const m = st.members.find((x) => x.id === did); const days = { Monthly: 30, Quarterly: 91, 'Half-yearly': 182, Annual: 365 }[m.membership.plan] || 30; st.invoices[did] = { status: 'paid', due: U.key(U.addDays(U.parse(st.invoices[did].due), days)) }; save(); toast('Payment recorded for ' + m.name.split(' ')[0]); }
      else if (a === 'reset') { FQ.reset(); v.drawer = null; toast('Demo data reset'); }
    });
    root.addEventListener('input', (e) => { if (e.target.id === id + '-q') { v.q = e.target.value; render(); } });
    root.addEventListener('change', (e) => {
      if (e.target.id !== id + '-csv' || !e.target.files[0]) return;
      const rd = new FileReader();
      rd.onload = () => {
        const st = S(), days = weekDates(), lines = String(rd.result).split(/\r?\n/).filter((l) => l.trim());
        const D = (st.diet[v.dietMember] = st.diet[v.dietMember] || {}); let n = 0;
        lines.forEach((l, i) => {
          const c = l.split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
          if (i === 0 && /day/i.test(c[0])) return;
          const di = U.WD.findIndex((w) => c[0] && c[0].slice(0, 3).toLowerCase() === w.toLowerCase()); if (di < 0) return;
          const date = days.find((d) => d.getDay() === di); const meal = (c[1] || '').toLowerCase().replace(/[^a-z]/g, '');
          const mid = FQ.MEALS.find((x) => x.id === meal || x.name.toLowerCase().replace(/[^a-z]/g, '') === meal); if (!mid) return;
          const k = U.key(date); (D[k] = D[k] || {})[mid.id] = { items: (c[2] || '').split('+').map((s) => s.trim()).filter(Boolean), kcal: +c[3] || 0, protein: +c[4] || 0 }; n++;
        });
        save(); toast(n ? n + ' meals imported' : 'No rows matched the format below');
      };
      rd.readAsText(e.target.files[0]);
    });
    root.addEventListener('submit', (e) => {
      e.preventDefault();
      const st = S(), f = e.target, fd = Object.fromEntries(new FormData(f).entries()), t = f.dataset.form;
      if (t === 'member') {
        const fee = { Monthly: 2800, Quarterly: 7500, 'Half-yearly': 13500, Annual: 24000 }[fd.plan];
        const dd = { Monthly: 30, Quarterly: 91, 'Half-yearly': 182, Annual: 365 }[fd.plan];
        const m = FQ.planFor({ id: 'm' + Date.now(), name: fd.name.trim(), phone: fd.phone, age: +fd.age, gender: fd.gender, height: +fd.height, goal: fd.goal, diet: fd.diet, pt: fd.pt, startWeight: +fd.sw, current: +fd.sw, target: +fd.tw, weeks: 1, adh: 0.8, membership: { plan: fd.plan, fee, dueIn: dd }, meas: { waist: ['\u2014', '\u2014'], fat: ['\u2014', '\u2014'] } });
        st.members.unshift(m); st.logs[m.id] = {}; st.wlogs[m.id] = {};
        st.invoices[m.id] = { status: 'due', due: U.key(U.addDays(U.T, dd)) };
        st.notices[m.id] = [{ id: 'n1', kind: 'coach', title: 'Welcome to ' + st.gym.name, body: tr(m.pt).name + ' is your coach. Your first week of meals is ready.', when: 'Now' }];
        v.drawer = { t: 'member', id: m.id }; save(); toast(m.name + ' added');
      } else if (t === 'trainer') {
        st.trainers.push({ id: 't' + Date.now(), name: fd.name, role: fd.role, exp: +fd.exp || 0, certs: (fd.certs || '').split(',').map((s) => s.trim()).filter(Boolean), spec: (fd.spec || '').split(',').map((s) => s.trim()).filter(Boolean), slots: fd.slots || '\u2014', phone: fd.phone || '\u2014', hue: FQ.util.hash(fd.name) % 360 });
        v.drawer = null; save(); toast(fd.name + ' added to the team');
      } else if (t === 'session') {
        const days = [0, 1, 2, 3, 4, 5, 6].filter((x) => fd['d' + x]);
        st.classes.push({ id: 'c' + Date.now(), name: fd.name, trainer: fd.trainer, days: days.length ? days : [U.T.getDay()], time: fd.time, dur: +fd.dur, cap: +fd.cap, booked: 0, room: fd.room });
        v.drawer = null; save(); toast(fd.name + ' is on the timetable');
      } else if (t === 'format') { st.formats.push({ id: 'w' + Date.now(), name: fd.name, len: fd.len, level: fd.level, desc: fd.desc }); v.drawer = null; save(); toast('Format added'); }
      else if (t === 'equip') {
        st.equipment.unshift({ id: 'e' + Date.now(), name: fd.name, cat: fd.cat, qty: +fd.qty || 1, brand: fd.brand || '\u2014', status: fd.status, added: U.key(U.T), note: fd.note || '' });
        if (fd.announce) st.members.forEach((m) => notify(m.id, { kind: 'coach', title: 'New at the gym: ' + fd.name, body: fd.note || 'Ask a coach for a quick intro.' }));
        v.drawer = null; save(); toast(fd.name + ' added' + (fd.announce ? ' and announced' : ''));
      } else if (t === 'promo') {
        const p = { id: 'p' + Date.now(), title: fd.title, body: fd.body, tag: fd.tag || 'Offer', ends: fd.ends, audience: fd.audience };
        st.promotions.unshift(p);
        st.members.filter((m) => p.audience === 'all' || m.goal === p.audience).forEach((m) => notify(m.id, { kind: 'promo', title: p.title, body: p.body }));
        v.drawer = null; save(); toast('Sent to members\u2019 apps');
      } else if (t === 'gym') {
        Object.assign(st.gym, { name: fd.name, about: fd.about, address: fd.address, phone: fd.phone, hours: { weekdays: fd.weekdays, saturday: fd.saturday, sunday: fd.sunday } });
        save(); toast('Profile saved');
      } else if (t === 'weigh') {
        const m = st.members.find((x) => x.id === v.drawer.id); const w = +fd.w; if (w > 20) { m.current = Math.round(w * 10) / 10; save(); toast('Weight recorded: ' + m.current + ' kg'); }
      }
    });
    FQ.subscribe((src) => { if (src !== id) render(); });
    if (window.ResizeObserver) new ResizeObserver(() => root.classList.toggle('narrow', root.clientWidth < 820)).observe(root);
    render();
    return { set(o) { Object.assign(v, o); render(); } };
  }
  window.FQAdmin = { mount };
})();
