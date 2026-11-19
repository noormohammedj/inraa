/* fitcheq prototype: shared sample data + state store.
   Every figure here is sample data for the preview. Dates are relative to today so the demo stays current. */
(function () {
  const FQ = (window.FQ = window.FQ || {});

  // ---------- date helpers ----------
  const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const key = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const parse = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rnd = (s) => (hash(s) % 10000) / 10000;
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fmtDate = (d, withYear) => d.getDate() + ' ' + MO[d.getMonth()] + (withYear ? ' ' + d.getFullYear() : '');
  const inr = (n) => '\u20b9' + Math.round(n).toLocaleString('en-IN');
  const isoWeek = (d) => { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return Math.ceil(((t - y0) / 86400000 + 1) / 7); };
  const T = today0();
  FQ.util = { today0, addDays, key, parse, hash, rnd, WD, MO, fmtDate, inr, isoWeek, T };

  // ---------- food library (kcal, protein g) ----------
  const F = {
    breakfast: [
      ['Moong dal chilla \u00d72, mint chutney', 310, 18, 'veg'],
      ['Vegetable poha with peanuts, 1 bowl', 330, 9, 'veg'],
      ['Ragi dosa \u00d72, sambar', 340, 11, 'veg'],
      ['Idli \u00d73, sambar, coconut chutney 1 tbsp', 360, 12, 'veg'],
      ['Oats upma with vegetables', 300, 10, 'veg'],
      ['Egg-white omelette (4 whites), 2 multigrain toast', 320, 24, 'egg'],
      ['Masala omelette (2 eggs), 1 phulka', 330, 17, 'egg'],
      ['Paneer bhurji 80 g, 1 phulka', 380, 22, 'veg'],
    ],
    midmorning: [
      ['Buttermilk 250 ml, 1 apple', 140, 5, 'veg'],
      ['Sprouts chaat, 1 cup', 160, 10, 'veg'],
      ['Greek yogurt 150 g, berries', 170, 14, 'veg'],
      ['Roasted chana 30 g, green tea', 130, 7, 'veg'],
      ['Boiled eggs \u00d72', 140, 12, 'egg'],
      ['Whey, 1 scoop in water', 120, 24, 'veg'],
    ],
    lunch: [
      ['Brown rice 1 cup, rajma, cucumber salad', 520, 20, 'veg'],
      ['2 phulka, palak paneer, dal, salad', 560, 26, 'veg'],
      ['Foxtail millet pongal, sambar, beans poriyal', 480, 15, 'veg'],
      ['Soya chunk pulao, cucumber raita', 500, 30, 'veg'],
      ['Grilled chicken 150 g, 1 cup rice, rasam, poriyal', 560, 42, 'nonveg'],
      ['Fish curry 150 g, 1 cup red rice, cabbage thoran', 540, 36, 'nonveg'],
      ['Egg curry (2 eggs), 2 phulka, salad', 500, 22, 'egg'],
    ],
    snack: [
      ['Roasted makhana, 1 cup, black coffee', 120, 4, 'veg'],
      ['Fruit bowl: papaya, guava', 120, 2, 'veg'],
      ['Paneer tikka 80 g', 210, 16, 'veg'],
      ['Chickpea sundal, 1 cup', 180, 9, 'veg'],
      ['Chicken tikka 100 g', 180, 26, 'nonveg'],
    ],
    dinner: [
      ['2 phulka, mixed dal, bhindi sabzi', 430, 16, 'veg'],
      ['Grilled paneer 100 g, saut\u00e9ed vegetables', 400, 24, 'veg'],
      ['Tofu stir-fry with quinoa', 420, 24, 'veg'],
      ['Ragi mudde, keerai kootu', 380, 12, 'veg'],
      ['Egg bhurji (3 eggs), 1 phulka, salad', 400, 24, 'egg'],
      ['Clear chicken soup, grilled chicken 120 g, salad', 380, 38, 'nonveg'],
      ['Tandoori fish 150 g, saut\u00e9ed greens', 360, 34, 'nonveg'],
    ],
  };
  const MEALS = [
    { id: 'breakfast', name: 'Breakfast', time: '8:00' },
    { id: 'midmorning', name: 'Mid-morning', time: '11:00' },
    { id: 'lunch', name: 'Lunch', time: '13:30' },
    { id: 'snack', name: 'Evening snack', time: '17:00' },
    { id: 'dinner', name: 'Dinner', time: '20:30' },
  ];
  const GAIN_EXTRA = { breakfast: ['Banana, 1', 105, 1], lunch: ['Extra phulka, 1', 90, 3], snack: ['Peanut butter 1 tbsp on toast', 190, 7], dinner: ['Curd, 1 cup', 120, 8] };
  const NOTES = {
    lose: ['Keep oil to 2 tsp for the whole day.', 'Drink 500 ml water before lunch.', 'No sugar in tea or coffee today.', 'Walk 10 minutes after dinner.', 'Swap white rice for millet if eating out.'],
    gain: ['Do not skip the post-workout meal.', 'Eat within 60 minutes of training.', 'Add a fist of rice if you trained legs.', 'Sleep 8 hours; growth happens in recovery.'],
    recomp: ['Protein at every meal.', 'Carbs around your workout, lighter at night.', 'Track steps: aim for 8,000.'],
  };
  const allowed = (diet, tag) => tag === 'veg' || (tag === 'egg' && diet !== 'veg') || (tag === 'nonveg' && diet === 'nonveg');

  // ---------- workouts ----------
  const EX = {
    fullA: ['Full-body strength A', [['Goblet squat', '4 \u00d7 10'], ['Dumbbell bench press', '4 \u00d7 10'], ['Seated cable row', '3 \u00d7 12'], ['Romanian deadlift', '3 \u00d7 10'], ['Plank', '3 \u00d7 40 s']]],
    hiit: ['HIIT 30 + core', [['Assault bike sprints', '10 \u00d7 20 s on / 40 s off'], ['Kettlebell swings', '4 \u00d7 15'], ['Burpees', '3 \u00d7 10'], ['Dead bug', '3 \u00d7 12 / side']]],
    lowerWalk: ['Lower body + incline walk', [['Leg press', '4 \u00d7 12'], ['Walking lunges', '3 \u00d7 12 / leg'], ['Leg curl', '3 \u00d7 12'], ['Incline treadmill walk', '20 min at 10%']]],
    mobility: ['Active recovery', [['Mobility flow', '15 min'], ['Foam rolling', '10 min'], ['Easy cycling', '15 min']]],
    upper: ['Upper body strength', [['Lat pulldown', '4 \u00d7 10'], ['Incline dumbbell press', '4 \u00d7 10'], ['Cable face pull', '3 \u00d7 15'], ['Dumbbell curl + triceps pushdown', '3 \u00d7 12 each']]],
    circuit: ['Kettlebell + rower circuit', [['Rower', '500 m \u00d7 4'], ['Kettlebell clean & press', '4 \u00d7 8 / side'], ['Box step-ups', '3 \u00d7 10 / leg'], ['Farmer carry', '4 \u00d7 30 m']]],
    push: ['Push: chest, shoulders, triceps', [['Barbell bench press', '5 \u00d7 5'], ['Seated dumbbell press', '4 \u00d7 8'], ['Cable fly', '3 \u00d7 12'], ['Dips (assisted)', '3 \u00d7 8']]],
    pull: ['Pull: back, biceps', [['Deadlift', '5 \u00d7 5'], ['Pull-ups (band)', '4 \u00d7 6'], ['Chest-supported row', '4 \u00d7 10'], ['Hammer curl', '3 \u00d7 12']]],
    legs: ['Legs', [['Back squat', '5 \u00d7 5'], ['Bulgarian split squat', '3 \u00d7 8 / leg'], ['Leg extension', '3 \u00d7 12'], ['Standing calf raise', '4 \u00d7 15']]],
    lower: ['Lower: hinge focus', [['Trap-bar deadlift', '4 \u00d7 6'], ['Hip thrust', '4 \u00d7 10'], ['Leg curl', '3 \u00d7 12'], ['Hanging knee raise', '3 \u00d7 12']]],
    rest: ['Rest day', [['Sleep 7\u20138 hours', ''], ['8,000 steps', '']]],
  };
  const SPLIT = {
    lose: ['rest', 'fullA', 'hiit', 'lowerWalk', 'mobility', 'upper', 'circuit'],
    recomp: ['rest', 'upper', 'lowerWalk', 'hiit', 'fullA', 'mobility', 'circuit'],
    gain: ['rest', 'push', 'pull', 'legs', 'rest', 'upper', 'lower'],
  };

  // ---------- seed ----------
  function seed() {
    const trainers = [
      { id: 't1', name: 'Priya Raman', role: 'Head coach \u00b7 Fat loss & nutrition', exp: 9, certs: ['ACE Certified Personal Trainer', 'Precision Nutrition L1'], spec: ['Fat loss', 'Diet planning', 'Women\u2019s strength'], slots: '6:00\u201310:00 \u00b7 17:00\u201320:00', phone: '+91 90000 11001', hue: 212 },
      { id: 't2', name: 'Karthik Selvam', role: 'Strength coach', exp: 7, certs: ['NSCA-CPT', 'Powerlifting coach L1'], spec: ['Muscle gain', 'Powerlifting', 'Technique'], slots: '7:00\u201311:00 \u00b7 18:00\u201321:00', phone: '+91 90000 11002', hue: 24 },
      { id: 't3', name: 'Fathima Noor', role: 'Functional & women\u2019s training', exp: 5, certs: ['ACE Group Fitness', 'Pre/postnatal fitness'], spec: ['Recomposition', 'Mobility', 'Postnatal'], slots: '6:30\u20139:30 \u00b7 16:30\u201319:30', phone: '+91 90000 11003', hue: 330 },
      { id: 't4', name: 'Rohan D\u2019Souza', role: 'HIIT & conditioning', exp: 6, certs: ['ISSA CPT', 'Kettlebell instructor'], spec: ['Conditioning', 'Heavy fat loss', 'Endurance'], slots: '5:30\u20139:00 \u00b7 18:00\u201321:30', phone: '+91 90000 11004', hue: 150 },
    ];
    const M = (id, name, age, g, h, goal, diet, pt, sw, cw, tw, weeks, adh, plan, fee, dueIn, meas) => ({ id, name, age, gender: g, height: h, goal, diet, pt, startWeight: sw, current: cw, target: tw, weeks, adh, membership: { plan, fee, dueIn }, meas, phone: '+91 98' + String(hash(id) % 100000000).padStart(8, '0') });
    const members = [
      M('m1', 'Arjun Mehta', 31, 'M', 176, 'lose', 'nonveg', 't1', 92.4, 86.1, 78.0, 12, 0.84, 'Quarterly', 7500, 8, { waist: [101, 94], fat: [29, 25.5] }),
      M('m2', 'Meera Iyer', 26, 'F', 162, 'gain', 'veg', 't2', 52.0, 54.3, 58.0, 14, 0.9, 'Half-yearly', 13500, 41, { waist: [66, 67], fat: [24, 23] }),
      M('m3', 'Sameer Khan', 38, 'M', 180, 'lose', 'nonveg', 't4', 104.8, 97.2, 88.0, 16, 0.76, 'Annual', 24000, 120, { waist: [112, 104], fat: [34, 30.5] }),
      M('m4', 'Divya Krishnan', 34, 'F', 165, 'recomp', 'veg', 't3', 68.5, 65.9, 62.0, 10, 0.81, 'Quarterly', 7500, 3, { waist: [84, 79], fat: [33, 29] }),
      M('m5', 'Rahul Nair', 23, 'M', 172, 'gain', 'egg', 't2', 64.0, 66.1, 70.0, 9, 0.72, 'Monthly', 2800, -2, { waist: [76, 77], fat: [15, 15] }),
      M('m6', 'Ananya Gupta', 29, 'F', 160, 'lose', 'veg', 't1', 74.2, 71.0, 65.0, 8, 0.88, 'Quarterly', 7500, 22, { waist: [88, 83], fat: [35, 32] }),
      M('m7', 'Vikram Rao', 45, 'M', 170, 'lose', 'nonveg', 't4', 88.0, 87.4, 80.0, 6, 0.46, 'Monthly', 2800, 1, { waist: [99, 98], fat: [30, 29.5] }),
      M('m8', 'Sneha Pillai', 27, 'F', 158, 'lose', 'veg', 't3', 61.0, 59.2, 56.0, 7, 0.79, 'Half-yearly', 13500, 60, { waist: [78, 74], fat: [30, 28] }),
    ];
    members.forEach(planFor);

    const classes = [
      { id: 'c1', name: 'Morning HIIT', trainer: 't4', days: [1, 3, 5], time: '06:30', dur: 45, cap: 20, booked: 16, room: 'Studio A' },
      { id: 'c2', name: 'Strength basics', trainer: 't2', days: [1, 2, 4, 6], time: '07:30', dur: 60, cap: 12, booked: 9, room: 'Free-weights floor' },
      { id: 'c3', name: 'Women\u2019s strength', trainer: 't3', days: [2, 4, 6], time: '09:00', dur: 50, cap: 14, booked: 11, room: 'Studio A' },
      { id: 'c4', name: 'Mobility & core', trainer: 't3', days: [0, 1, 3, 5], time: '17:00', dur: 40, cap: 18, booked: 7, room: 'Studio B' },
      { id: 'c5', name: 'Kettlebell circuit', trainer: 't4', days: [1, 2, 3, 4, 5], time: '18:30', dur: 45, cap: 16, booked: 15, room: 'Functional zone' },
      { id: 'c6', name: 'Spin 40', trainer: 't1', days: [0, 2, 4, 6], time: '19:30', dur: 40, cap: 15, booked: 10, room: 'Cycle studio' },
      { id: 'c7', name: 'Weekend bootcamp', trainer: 't1', days: [0, 6], time: '08:00', dur: 60, cap: 25, booked: 18, room: 'Terrace' },
    ];
    const equipment = [
      { id: 'e1', name: 'Assault air bike', cat: 'Cardio', qty: 4, status: 'new', brand: 'Assault Fitness', added: key(addDays(T, -6)), note: 'Cardio bay, near the window' },
      { id: 'e2', name: 'Commercial treadmill', cat: 'Cardio', qty: 8, status: 'ok', brand: 'Life Fitness', added: '2024-03-02', note: 'Incline up to 15%' },
      { id: 'e3', name: 'Concept2 rower', cat: 'Cardio', qty: 3, status: 'ok', brand: 'Concept2', added: '2024-03-02', note: '' },
      { id: 'e4', name: 'Spin bikes', cat: 'Cardio', qty: 15, status: 'ok', brand: 'Keiser', added: '2024-07-15', note: 'Cycle studio' },
      { id: 'e5', name: 'Power rack', cat: 'Strength', qty: 4, status: 'ok', brand: 'Rogue', added: '2024-03-02', note: 'With safety arms' },
      { id: 'e6', name: 'Olympic barbells + bumper plates', cat: 'Strength', qty: 6, status: 'ok', brand: 'Eleiko', added: '2024-03-02', note: '20 kg and 15 kg bars' },
      { id: 'e7', name: 'Dumbbells 2.5\u201350 kg', cat: 'Strength', qty: 1, status: 'ok', brand: 'Hammer Strength', added: '2024-03-02', note: 'Full rack, pairs' },
      { id: 'e8', name: 'Cable crossover', cat: 'Machines', qty: 2, status: 'maint', brand: 'Technogym', added: '2024-03-02', note: 'Left pulley cable being replaced' },
      { id: 'e9', name: 'Leg press 45\u00b0', cat: 'Machines', qty: 2, status: 'ok', brand: 'Hammer Strength', added: '2024-03-02', note: '' },
      { id: 'e10', name: 'Lat pulldown / seated row', cat: 'Machines', qty: 2, status: 'ok', brand: 'Technogym', added: '2024-03-02', note: '' },
      { id: 'e11', name: 'Kettlebells 8\u201332 kg', cat: 'Functional', qty: 24, status: 'ok', brand: 'Rogue', added: '2024-05-10', note: '' },
      { id: 'e12', name: 'Plyo boxes, battle ropes, sleds', cat: 'Functional', qty: 1, status: 'ok', brand: 'Mixed', added: '2024-05-10', note: 'Turf lane' },
    ];
    const formats = [
      { id: 'w1', name: 'HIIT', len: '30\u201345 min', level: 'High', desc: 'Short intervals on bikes, rowers and kettlebells. Rest ratio set by the coach.' },
      { id: 'w2', name: 'Strength (5\u00d75)', len: '60 min', level: 'Medium', desc: 'Compound lifts with progressive overload, logged set by set.' },
      { id: 'w3', name: 'Push / Pull / Legs', len: '60\u201375 min', level: 'Medium', desc: 'Body-part split for muscle gain, six days a week.' },
      { id: 'w4', name: 'Functional circuit', len: '45 min', level: 'Medium', desc: 'Stations on the turf: sled, carries, box work, ropes.' },
      { id: 'w5', name: 'Mobility & recovery', len: '30\u201340 min', level: 'Low', desc: 'Joint prep, stretching and foam rolling. Good for rest days.' },
    ];
    const promotions = [
      { id: 'p1', title: 'Winter Shred 30', body: 'A 30-day team challenge starting 1 December. Top three transformations win a free quarter.', tag: 'Challenge', ends: key(addDays(T, 14)), audience: 'all' },
      { id: 'p2', title: 'Bring a friend, get 15 days free', body: 'Your friend trains free for a week. You get 15 days added when they join.', tag: 'Referral', ends: key(addDays(T, 30)), audience: 'all' },
      { id: 'p3', title: 'New: 4 Assault air bikes', body: 'Now in the cardio bay. Ask Rohan for a 10-minute intro.', tag: 'Equipment', ends: key(addDays(T, 7)), audience: 'all' },
    ];
    const gym = {
      name: 'Firm Fit Factory',
      about: 'Strength floor, functional turf, cycle studio and personal coaching.',
      address: 'Add your address in the owner console',
      phone: '+91 90000 11000',
      hours: { weekdays: '5:30 \u2013 22:30', saturday: '6:00 \u2013 21:00', sunday: '7:00 \u2013 13:00' },
      amenities: ['Showers & lockers', 'Body composition scan', 'Parking', 'Protein bar'],
    };
    const st = { v: 3, seededOn: key(T), gym, trainers, members, classes, equipment, formats, promotions, logs: {}, wlogs: {}, bookings: {}, diet: {}, notices: {}, invoices: {} };
    // seed logs for the last 14 days + this morning
    members.forEach((m) => {
      st.logs[m.id] = {}; st.wlogs[m.id] = {};
      for (let i = 14; i >= 0; i--) {
        const d = addDays(T, -i), k = key(d);
        st.logs[m.id][k] = {};
        MEALS.forEach((ml, j) => {
          if (i === 0 && j > 0) return;
          st.logs[m.id][k][ml.id] = rnd(m.id + k + ml.id) < m.adh ? 'done' : 'skip';
        });
        if (i > 0 && SPLIT[m.goal][d.getDay()] !== 'rest') st.wlogs[m.id][k] = rnd(m.id + k + 'w') < m.adh + 0.05 ? 'done' : 'skip';
      }
      st.invoices[m.id] = { status: m.membership.dueIn < 0 ? 'overdue' : 'due', due: key(addDays(T, m.membership.dueIn)) };
      st.notices[m.id] = [
        { id: 'n1', kind: 'bill', title: 'Membership renews on ' + fmtDate(addDays(T, m.membership.dueIn)), body: inr(m.membership.fee) + ' for your ' + m.membership.plan.toLowerCase() + ' plan.', when: 'Today' },
        { id: 'n2', kind: 'coach', title: trainers.find((t) => t.id === m.pt).name.split(' ')[0] + ' uploaded week ' + isoWeek(T) + ' diet', body: 'Your plan for this week is ready in Diet.', when: 'Mon' },
      ];
    });
    st.bookings.m1 = { c5: true };
    return st;
  }

  function planFor(m) {
    const base = m.gender === 'F' ? 1650 : 2100;
    const g = m.goal;
    m.plan = {
      kcal: g === 'gain' ? base + 450 : g === 'recomp' ? base - 150 : base - 300,
      protein: Math.round(m.current * (g === 'lose' ? 1.6 : 1.8)),
      deficit: g === 'gain' ? -300 : g === 'recomp' ? 300 : 500,
      burn: g === 'gain' ? 250 : 380,
      sessions: g === 'gain' ? 5 : 6,
    };
    return m;
  }
  FQ.planFor = planFor;

  // ---------- derived data ----------
  FQ.MEALS = MEALS;
  FQ.dayMeals = function (st, m, d) {
    const k = key(d);
    const ov = (st.diet[m.id] || {})[k] || {};
    return MEALS.map((ml, j) => {
      if (ov[ml.id]) return Object.assign({}, ml, ov[ml.id], { custom: true });
      const pool = F[ml.id].filter((f) => allowed(m.diet, f[3]));
      const pick = pool[hash(m.id + k + ml.id) % pool.length];
      const items = [pick[0]]; let kc = pick[1], p = pick[2];
      if (m.goal === 'gain' && GAIN_EXTRA[ml.id]) { const x = GAIN_EXTRA[ml.id]; items.push(x[0]); kc += x[1]; p += x[2]; }
      return Object.assign({}, ml, { items, kcal: kc, protein: p });
    });
  };
  FQ.dayNote = (m, d) => { const n = NOTES[m.goal]; return n[hash(m.id + key(d)) % n.length]; };
  FQ.workoutFor = function (m, d) {
    const id = SPLIT[m.goal][d.getDay()];
    const w = EX[id];
    return { id, name: w[0], items: w[1], rest: id === 'rest' };
  };
  FQ.history = function (m) {
    const pts = []; const n = m.weeks;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const ease = 1 - Math.pow(1 - t, 1.25);
      let w = m.startWeight + (m.current - m.startWeight) * ease;
      if (i > 0 && i < n) w += (rnd(m.id + 'h' + i) - 0.5) * 0.7;
      pts.push({ d: addDays(T, -(n - i) * 7), w: Math.round(w * 10) / 10 });
    }
    return pts;
  };
  FQ.adherence = function (st, m, days) {
    days = days || 14; let done = 0, tot = 0;
    for (let i = 1; i <= days; i++) {
      const l = (st.logs[m.id] || {})[key(addDays(T, -i))] || {};
      Object.values(l).forEach((v) => { tot++; if (v === 'done') done++; });
    }
    return tot ? done / tot : m.adh;
  };
  FQ.streak = function (st, m) {
    let s = 0;
    for (let i = 1; i < 60; i++) {
      const l = (st.logs[m.id] || {})[key(addDays(T, -i))];
      if (!l) break;
      const done = Object.values(l).filter((v) => v === 'done').length;
      if (done >= 4) s++; else break;
    }
    return s;
  };
  // kg per week at adherence a (0..1); negative = loss
  FQ.weekly = function (m, a) {
    if (m.goal === 'gain') return 0.3 * a - 0.12 * (1 - a);
    const p = m.plan;
    const deficit = p.deficit + (p.burn * p.sessions) / 7;
    const eff = a * deficit - (1 - a) * 260;
    return -(eff * 7) / 7700;
  };
  FQ.eta = function (m, a) {
    const wk = FQ.weekly(m, a); const gap = m.target - m.current;
    if (Math.abs(gap) < 0.05) return { weeks: 0, date: T };
    if (!wk || Math.sign(wk) !== Math.sign(gap)) return null;
    const weeks = gap / wk; if (weeks > 104) return null;
    return { weeks, date: addDays(T, Math.round(weeks * 7)) };
  };
  FQ.goalLabel = (g) => ({ lose: 'Fat loss', gain: 'Muscle gain', recomp: 'Recomposition' })[g];
  FQ.dietLabel = (d) => ({ veg: 'Vegetarian', egg: 'Eggetarian', nonveg: 'Non-vegetarian' })[d];
  FQ.initials = (n) => n.split(/\s+/).map((x) => x[0]).slice(0, 2).join('').toUpperCase();

  // ---------- store ----------
  const LS = 'fitcheq.demo.v3';
  let state = null;
  FQ.state = function () {
    if (state) return state;
    try { const raw = localStorage.getItem(LS); if (raw) { const s = JSON.parse(raw); if (s && s.v === 3 && s.seededOn === key(T)) state = s; } } catch (e) {}
    if (!state) state = seed();
    return state;
  };
  const subs = [];
  FQ.subscribe = (fn) => { subs.push(fn); };
  FQ.save = function (source) {
    try { localStorage.setItem(LS, JSON.stringify(state)); } catch (e) {}
    subs.forEach((fn) => { try { fn(source); } catch (e) { console.error(e); } });
  };
  FQ.reset = function () { try { localStorage.removeItem(LS); } catch (e) {} state = seed(); FQ.save(null); };
  window.addEventListener('storage', (e) => {
    if (e.key !== LS || !e.newValue) return;
    try { state = JSON.parse(e.newValue); subs.forEach((fn) => fn(null)); } catch (err) {}
  });

  // ---------- small shared bits ----------
  FQ.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const I = {
    today: '<path d="M4 7h16M4 7v12h16V7M4 7l1.5-3h13L20 7M8 3v3M16 3v3"/><path d="M8 12h3v3H8z"/>',
    diet: '<path d="M12 21c-4.5 0-8-3.6-8-8.5C4 8 7 5 10.5 6c.9.3 1.6.3 3 0C17 5 20 8 20 12.5 20 17.4 16.5 21 12 21z"/><path d="M12 6c0-2 1-3.2 3-3.5"/>',
    progress: '<path d="M4 19V5M4 19h16"/><path d="M7 15l4-4 3 3 5-6"/>',
    gym: '<path d="M3 10v4M6 7v10M18 7v10M21 10v4M6 12h12"/>',
    me: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    check: '<path d="M5 12.5l4.2 4.2L19 7"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    pin: '<path d="M12 21s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/>',
    bell: '<path d="M6 16V11a6 6 0 1112 0v5l2 2H4l2-2zM10 21h4"/>',
    bill: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z"/><path d="M9 8h6M9 12h6"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
    flame: '<path d="M12 22c4 0 7-2.7 7-7 0-4-3-6.5-4-10-2 2-3 4-3 6-1-1-2-2-2.5-4C7 9 5 11.5 5 15c0 4.3 3 7 7 7z"/>',
    chev: '<path d="M9 6l6 6-6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5M16 4.5a3.5 3.5 0 010 7M18 15c2 .7 3 2.3 3.5 5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    dumbbell: '<path d="M3 10v4M6 7v10M18 7v10M21 10v4M6 12h12"/>',
    megaphone: '<path d="M3 10v4l11 5V5L3 10zM14 8a4 4 0 010 8M6 15l1 5h3l-1-4"/>',
    home: '<path d="M3 11l9-7 9 7v9H3z"/><path d="M9 20v-6h6v6"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  };
  FQ.icon = (n, cls) => '<svg class="' + (cls || 'ic') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (I[n] || '') + '</svg>';

  // weight chart: history (solid) + projection (dashed) + target line. Colours via CSS classes.
  FQ.chart = function (m, a, opt) {
    opt = opt || {};
    const W = opt.w || 330, H = opt.h || 180, padL = 34, padR = 12, padT = 14, padB = 24;
    const hist = FQ.history(m);
    const wk = FQ.weekly(m, a);
    const eta = FQ.eta(m, a);
    const projWeeks = Math.min(eta ? Math.ceil(eta.weeks) : 16, 26) || 4;
    const proj = [{ d: T, w: m.current }];
    for (let i = 1; i <= projWeeks; i++) {
      let w = m.current + wk * i;
      if ((wk < 0 && w < m.target) || (wk > 0 && w > m.target)) w = m.target;
      proj.push({ d: addDays(T, i * 7), w });
    }
    const all = hist.concat(proj);
    const t0 = hist[0].d.getTime(), t1 = proj[proj.length - 1].d.getTime();
    let lo = Math.min(...all.map((p) => p.w), m.target), hi = Math.max(...all.map((p) => p.w), m.target);
    lo = Math.floor(lo - 1); hi = Math.ceil(hi + 1);
    const step = hi - lo > 16 ? 5 : hi - lo > 8 ? 2 : 1;
    lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step;
    const x = (d) => padL + ((d.getTime() - t0) / (t1 - t0)) * (W - padL - padR);
    const y = (w) => padT + ((hi - w) / (hi - lo)) * (H - padT - padB);
    let g = '';
    for (let v = lo; v <= hi; v += step) g += '<line class="ch-grid" x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="ch-ax" x="' + (padL - 6) + '" y="' + (y(v) + 3.5) + '" text-anchor="end">' + v + '</text>';
    const path = (pts) => pts.map((p, i) => (i ? 'L' : 'M') + x(p.d).toFixed(1) + ' ' + y(p.w).toFixed(1)).join(' ');
    const area = path(hist) + ' L' + x(hist[hist.length - 1].d).toFixed(1) + ' ' + (H - padB) + ' L' + x(hist[0].d).toFixed(1) + ' ' + (H - padB) + ' Z';
    const ty = y(m.target);
    const xl = [[hist[0].d, 'start'], [T, 'middle'], [proj[proj.length - 1].d, 'end']].map((p) => '<text class="ch-ax" x="' + x(p[0]) + '" y="' + (H - 6) + '" text-anchor="' + p[1] + '">' + (p[0] === T ? 'Today' : fmtDate(p[0])) + '</text>').join('');
    const end = proj[proj.length - 1];
    return '<svg class="fq-chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Weight history and projection">' + g +
      '<line class="ch-target" x1="' + padL + '" x2="' + (W - padR) + '" y1="' + ty + '" y2="' + ty + '"/>' +
      '<text class="ch-tlabel" x="' + (padL + 4) + '" y="' + (ty - 5) + '">Target ' + m.target.toFixed(1) + '</text>' +
      '<path class="ch-area" d="' + area + '"/>' +
      '<path class="ch-line" d="' + path(hist) + '"/>' +
      '<path class="ch-proj" d="' + path(proj) + '"/>' +
      '<circle class="ch-dot" cx="' + x(T) + '" cy="' + y(m.current) + '" r="4.5"/>' +
      '<circle class="ch-end" cx="' + x(end.d) + '" cy="' + y(end.w) + '" r="3.5"/>' + xl + '</svg>';
  };
})();
