/* Inraa RFP agent.
   1. analyse(): reads a plain-language problem statement and writes a structured requirement document (RFP).
   2. propose(): turns the RFP into a technical and commercial proposal with effort, timeline and price.
   Runs entirely in the browser. If INRAA.aiEndpoint is set, the site can ask that worker to rewrite the
   proposal text with Claude; the numbers always come from the model below so pricing stays consistent. */
(function () {
  const CFG = () => window.INRAA || {};
  const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const round = (n, to) => Math.round(n / to) * to;

  // ---------- delivery model (edit here to re-price everything) ----------
  const RATE = {
    dayRate: 6500,          // ₹ per engineer-day, AI-assisted senior engineer
    qa: 0.15,               // testing and review, share of build days
    pm: 0.10,               // project management, share of build days
    contingency: 0.10,      // buffer for unknowns
    daysPerWeek: 4,         // productive build days per calendar week for a 2-person squad
    gst: 0.18,
  };

  // Modules the agent can recognise. days = AI-assisted build effort.
  const MODULES = [
    { id: 'auth', name: 'Sign-in, roles and permissions', days: 2.5, core: true, desc: 'Phone OTP or email sign-in, owner / staff / customer roles, access rules per role.' },
    { id: 'admin', name: 'Owner dashboard (web)', days: 4, core: true, desc: 'One screen for the owner: key numbers, lists, search, filters and export to Excel.' },
    { id: 'mobile', name: 'Mobile app (Android + iPhone)', days: 6, re: /\b(app|android|ios|iphone|mobile|phone app|play ?store)\b/, desc: 'One codebase published to Play Store and App Store, with push notifications.' },
    { id: 'portal', name: 'Customer website / portal', days: 4, re: /\b(website|portal|online|customers? can|self.?service|landing page)\b/, desc: 'Public pages and a customer login to view, request and track.' },
    { id: 'booking', name: 'Booking and scheduling', days: 5, re: /\b(book|booking|appointment|slot|schedul|reserv|calendar|table)/, desc: 'Slots and calendars, double-booking checks, reschedule and cancel, reminders.' },
    { id: 'orders', name: 'Online ordering and cart', days: 6, re: /\b(order|cart|checkout|menu|catalog|e-?commerce|shop online|sell online)/, desc: 'Catalogue, cart, order status from placed to delivered, kitchen or store view.' },
    { id: 'inventory', name: 'Stock and inventory', days: 5, re: /\b(stock|inventory|warehouse|sku|raw material|godown|reorder)/, desc: 'Items, stock in and out, low-stock alerts, batch and expiry where needed.' },
    { id: 'billing', name: 'Billing, GST invoices and payments', days: 4.5, re: /\b(bill|invoice|gst|payment|upi|razorpay|paytm|fees|collect|receipt|dues)/, desc: 'GST invoices and receipts, UPI and card through your payment gateway, dues tracking.' },
    { id: 'crm', name: 'Leads and customer follow-up', days: 4, re: /\b(lead|enquir|inquir|follow.?up|crm|prospect|sales team|pipeline|customer list)/, desc: 'Lead capture, stages, follow-up tasks and history for every customer.' },
    { id: 'notify', name: 'WhatsApp, SMS and email alerts', days: 3, re: /\b(whatsapp|sms|reminder|notif|alert|message customers|email)/, desc: 'Templates, automatic reminders and broadcast messages through WhatsApp Cloud API and SMS.' },
    { id: 'staff', name: 'Staff, attendance and payroll', days: 5, re: /\b(staff|employee|attendance|payroll|salary|shift|technician|worker)/, desc: 'Staff records, attendance by app or QR, shifts, salary and commission sheets.' },
    { id: 'delivery', name: 'Delivery and field tracking', days: 6, re: /\b(deliver|dispatch|route|driver|rider|logistic|fleet|track(ing)? (the )?(order|vehicle|van)|field)/, desc: 'Assign jobs to drivers or field staff, live status, proof of delivery with photo.' },
    { id: 'docs', name: 'Documents and records', days: 3, re: /\b(document|kyc|file|upload|record|report card|certificate|prescription)/, desc: 'Upload, store and share documents per customer with access control.' },
    { id: 'reports', name: 'Reports and analytics', days: 3.5, re: /\b(report|analytic|dashboard|mis|insight|daily sales|profit|track (sales|revenue)|see .* per)/, desc: 'Daily, monthly and per-branch reports, charts and scheduled email reports.' },
    { id: 'branches', name: 'Multi-branch support', days: 3, re: /\b(branch|branches|outlet|locations|franchise|centres|centers|stores)\b/, desc: 'Separate data per branch with a combined view for the owner.' },
    { id: 'integr', name: 'Integrations (Tally, Sheets, existing tools)', days: 3, re: /\b(tally|zoho|sheet|excel|erp|integrat|api|busy software|marg)/, desc: 'Two-way sync or exports with the tools you already use.' },
    { id: 'ai_docs', name: 'AI document reading', days: 5, ai: true, re: /\b(scan|ocr|read (the )?(bill|invoice|document|form)|extract|handwrit|photo of)/, desc: 'Claude or GPT reads photos and PDFs into structured data; a person confirms before saving.' },
    { id: 'ai_chat', name: 'AI assistant for customers or staff', days: 4.5, ai: true, re: /\b(chat ?bot|assistant|answer (customer )?questions|ai agent|faq|support bot|auto.?reply)/, desc: 'A Claude- or GPT-powered assistant on WhatsApp or the website, grounded on your own data.' },
    { id: 'ai_insight', name: 'AI insights and forecasts', days: 4, ai: true, re: /\b(predict|forecast|recommend|suggest|ai\b|smart|insight)/, desc: 'Weekly summaries, demand hints and recommendations written by an LLM from your numbers.' },
    { id: 'offline', name: 'Works offline', days: 3, re: /\b(offline|no internet|poor network|low network)/, desc: 'Keeps working without internet and syncs when the connection returns.' },
    { id: 'feedback', name: 'Feedback and reviews', days: 2, re: /\b(feedback|review|rating|survey|complain)/, desc: 'Collect ratings after each visit or order, flag unhappy customers to the owner.' },
  ];

  const RESULTS = {
    admin: ['Owner sees the day’s numbers without calling anyone', 'Owner dashboard opened daily'],
    mobile: ['Customers and staff use one app instead of calls and paper', 'Share of work done in the app'],
    portal: ['Customers help themselves online, day or night', 'Requests received outside office hours'],
    booking: ['No double bookings and fewer no-shows', 'No-show rate, double bookings per month'],
    orders: ['Orders taken around the clock without a phone call', 'Orders placed online per day'],
    inventory: ['Fewer stock-outs and less dead stock', 'Stock-out days per month'],
    billing: ['Payments collected faster, with every rupee on record', 'Days to collect, pending dues'],
    crm: ['No lead forgotten; every enquiry followed up', 'Enquiry-to-sale conversion'],
    notify: ['Reminders and updates go out by themselves, no calls needed', 'Staff hours spent on reminder calls'],
    staff: ['Attendance and salaries without registers or disputes', 'Hours spent on payroll each month'],
    delivery: ['Customers know where their order is without calling', '“Where is my order” calls per day'],
    docs: ['Any record found in seconds, from any phone', 'Time to find a document'],
    reports: ['Decisions made on today’s numbers, not last month’s', 'Reports produced without manual work'],
    branches: ['Every branch run the same way, compared side by side', 'Branch performance gap'],
    integr: ['No double entry between systems', 'Hours of data entry saved'],
    ai_docs: ['Bills and forms typed in by AI, checked by a person', 'Minutes per document'],
    ai_chat: ['Common questions answered instantly, 24 hours a day', 'Questions answered without staff'],
    ai_insight: ['Weekly advice written from your own numbers', 'Actions taken from insights'],
    offline: ['Work never stops when the internet does', 'Hours lost to network issues'],
    feedback: ['Unhappy customers caught before they leave', 'Repeat-customer rate'],
  };

  const INDUSTRIES = [
    ['Restaurant and food', /\b(restaurant|cafe|kitchen|food|hotel|bakery|cloud kitchen|catering)/],
    ['Healthcare clinic', /\b(clinic|doctor|patient|hospital|dental|pharmacy|diagnostic|lab)/],
    ['Education and coaching', /\b(school|college|coaching|tuition|student|class|course|academy|institute)/],
    ['Retail and wholesale', /\b(shop|store|retail|wholesale|distribut|supermarket|boutique|showroom)/],
    ['Logistics and delivery', /\b(logistic|courier|transport|delivery|fleet|truck)/],
    ['Manufacturing', /\b(factory|manufactur|production|plant|machine)/],
    ['Salon and wellness', /\b(salon|spa|parlour|parlor|beauty|wellness)/],
    ['Real estate', /\b(plot|flat|apartment|real estate|builder|developer|layout)/],
    ['Events and venues', /\b(mahal|mandap|hall|venue|wedding|event)/],
    ['Fitness', /\b(gym|fitness|trainer|yoga|studio)/],
    ['Temple, trust or NGO', /\b(temple|trust|ngo|donat|charity|church|mosque)/],
    ['Professional services', /\b(agency|consult|ca firm|law|accounting|service centre|repair)/],
  ];

  const EXAMPLES = {
    clinic: 'We are a 2-doctor dental clinic in Coimbatore. Patients call to book and we write appointments in a notebook, so we get double bookings and no-shows. We want online booking, WhatsApp reminders, patient records with X-ray uploads and GST bills. Around 40 patients a day.',
    school: 'I run a coaching centre with 3 branches and about 600 students. Fees are collected in cash and UPI and tracked in Excel. Parents keep calling to ask about attendance and test marks. We need an app for parents, attendance by QR, fee reminders on WhatsApp and branch-wise reports.',
    retail: 'We have 2 hardware shops. Stock is counted by hand and we often run out of fast items. Billing is on a desktop software that does not talk to Tally. We want stock in and out on phone, low-stock alerts, GST billing and daily sales per shop. Would like AI to read supplier invoice photos.',
    logistics: 'We deliver building materials with 12 trucks. Orders come on phone and WhatsApp, drivers call the office for every address, and customers ask where their load is. We need order booking, driver app with route and photo proof of delivery, and live tracking link for customers.',
  };

  function detectScale(t) {
    const nums = [...t.matchAll(/(\d[\d,]*)\s*(\+|plus)?\s*(students|members|customers|patients|users|staff|employees|orders|clients|people|families|trucks|drivers|branches|outlets|shops|stores|centres|centers|doctors|a day|per day|daily)/g)].map((m) => ({ n: +m[1].replace(/,/g, ''), w: m[3] }));
    let users = 0, branches = 1;
    const perDay = t.match(/(\d[\d,]*)\s*(patients|customers|orders|visitors|students|clients)\s*(a|per|every)\s*day/);
    if (perDay) users = +perDay[1].replace(/,/g, '') * 25;
    nums.forEach((x) => {
      if (/branch|outlet|shop|store|centre|center/.test(x.w)) branches = Math.max(branches, x.n);
      else if (/a day|per day|daily/.test(x.w)) users = Math.max(users, x.n * 25);
      else users = Math.max(users, x.n);
    });
    const words = { two: 2, three: 3, four: 4, five: 5, six: 6, ten: 10 };
    const wb = t.match(/\b(two|three|four|five|six|ten)\s+(branches|outlets|shops|stores|centres|centers|restaurants|clinics)/);
    if (wb) branches = Math.max(branches, words[wb[1]]);
    const tier = users > 2000 || branches > 5 ? 'L' : users > 300 || branches > 1 ? 'M' : 'S';
    return { users, branches, tier };
  }

  function sentences(t) { return t.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter((s) => s.length > 3); }

  function analyse(input) {
    const raw = (input.problem || '').trim();
    const t = raw.toLowerCase();
    const industry = (INDUSTRIES.find((i) => i[1].test(t)) || ['General business'])[0];
    const scale = detectScale(t);
    let mods = MODULES.filter((m) => m.core || (m.re && m.re.test(t))).map((m) => m.id);
    if (scale.branches > 1 && !mods.includes('branches')) mods.push('branches');
    if (mods.length <= 2) mods.push('crm', 'notify', 'reports');
    if (mods.includes('ai_docs') || mods.includes('ai_chat')) mods = mods.filter((m) => m !== 'ai_insight' || /forecast|predict|recommend/.test(t));
    const pains = sentences(raw).filter((s) => /\b(miss|lose|lost|confus|manual|excel|notebook|paper|cash|call|calls|delay|late|double|no.?show|can.?t|cannot|don.?t know|hard|time|mistake|error|wrong)/i.test(s)).slice(0, 4);
    const wants = sentences(raw).filter((s) => /\b(want|need|would like|should|looking for|wish|must|plan to)/i.test(s)).slice(0, 5);
    const roles = ['Owner / admin'];
    if (/staff|employee|team|technician|driver|teacher|doctor|trainer|sales/.test(t)) roles.push('Staff' + (/driver/.test(t) ? ' and drivers' : /teacher/.test(t) ? ' and teachers' : /doctor/.test(t) ? ' and doctors' : ''));
    if (/customer|patient|student|parent|member|client|famil|buyer/.test(t)) roles.push(/patient/.test(t) ? 'Patients' : /parent|student/.test(t) ? 'Students and parents' : 'Customers');
    const d0 = new Date(), id = 'IN-' + String(d0.getFullYear()).slice(2) + String(d0.getMonth() + 1).padStart(2, '0') + String(d0.getDate()).padStart(2, '0') + '-' + String(Math.abs(hash(raw)) % 1000).padStart(3, '0');
    return { id, date: new Date(), name: (input.name || '').trim(), biz: (input.biz || '').trim() || 'Your business', problem: raw, industry, scale, modules: mods, pains, wants, roles, product: input.product || null };
  }
  function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }

  function estimate(rfp) {
    const mods = MODULES.filter((m) => rfp.modules.includes(m.id));
    const sizeF = rfp.scale.tier === 'L' ? 1.25 : rfp.scale.tier === 'M' ? 1.1 : 1;
    const build = mods.map((m) => ({ m, days: Math.round(m.days * sizeF * 2) / 2 }));
    const buildDays = build.reduce((s, x) => s + x.days, 0);
    const discovery = Math.max(3, Math.round(buildDays * 0.12 * 2) / 2);
    const qa = Math.round(buildDays * RATE.qa * 2) / 2, pm = Math.round(buildDays * RATE.pm * 2) / 2;
    const cont = Math.round((buildDays + discovery + qa + pm) * RATE.contingency * 2) / 2;
    const days = buildDays + discovery + qa + pm + cont;
    const price = round(days * RATE.dayRate, 1000) - 1;
    const weeks = Math.max(4, Math.ceil((buildDays + qa) / RATE.daysPerWeek) + 2);
    const ai = mods.some((m) => m.ai);
    const hosting = { S: 1500, M: 3500, L: 8000 }[rfp.scale.tier];
    const support = Math.max(3000, round(price * 0.015, 500));
    const aiRun = ai ? { S: 1500, M: 4000, L: 10000 }[rfp.scale.tier] : 0;
    const monthly = hosting + support + aiRun;
    const subMonthly = round(price / 18 + monthly, 100) - 1;
    return { build, buildDays, discovery, qa, pm, cont, days, price, weeks, ai, hosting, support, aiRun, monthly, subMonthly, amc: round(price * 0.18, 1000) };
  }

  // ---------- RFP document ----------
  function rfpHTML(rfp) {
    const sc = rfp.scale;
    return '<div class="dhead"><div><span class="tag">Requirement document (RFP)</span><h2>' + esc(rfp.biz) + '</h2></div><div class="meta">Ref ' + rfp.id + '<br>' + rfp.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) + (rfp.name ? '<br>Prepared for ' + esc(rfp.name) : '') + '</div></div>' +
      '<h3>1. Background</h3><p>' + esc(rfp.problem) + '</p>' +
      '<h3>2. Problems to solve</h3>' + (rfp.pains.length ? '<ul>' + rfp.pains.map((p) => '<li>' + esc(p) + '</li>').join('') + '</ul>' : '<p>Day-to-day work is handled manually and the owner lacks a single view of operations.</p>') +
      '<h3>3. Objectives</h3><ul>' + (rfp.wants.length ? rfp.wants.map((w) => '<li>' + esc(w) + '</li>').join('') : '') + '<li>Replace manual records with one system the whole team uses.</li><li>Give the owner live numbers without asking anyone.</li></ul>' +
      '<h3>4. Results expected</h3><ul>' + rfp.modules.filter((m) => RESULTS[m]).map((m) => '<li>' + esc(RESULTS[m][0]) + '</li>').join('') + '</ul>' +
      '<h3>5. Business profile</h3><div class="tbl"><table><tbody><tr><th>Industry</th><td>' + esc(rfp.industry) + '</td></tr><tr><th>Users of the system</th><td>' + rfp.roles.map(esc).join(', ') + '</td></tr><tr><th>Scale</th><td>' + (sc.users ? '~' + sc.users.toLocaleString('en-IN') + ' customers or records' : 'Not stated, assumed under 300') + ' · ' + sc.branches + ' location' + (sc.branches > 1 ? 's' : '') + '</td></tr></tbody></table></div>' +
      '<h3>6. Scope: modules required</h3><p>We detected these from your description. Tick or untick any of them, then create the proposal.</p>' +
      '<div class="chips" id="modchips">' + MODULES.map((m) => '<button type="button" class="chip' + (rfp.modules.includes(m.id) ? ' on' : '') + '" data-mod="' + m.id + '"' + (m.core ? ' disabled title="Always included"' : '') + '>' + esc(m.name) + '</button>').join('') + '</div>' +
      '<h3>7. Non-functional requirements</h3><ul><li>Works on phone and desktop browsers; mobile app if listed above.</li><li>Data hosted in India, daily backups, role-based access.</li><li>Pages load in under 2 seconds on 4G.</li><li>English first; Tamil or Hindi labels on request.</li></ul>' +
      '<h3>8. Questions for our call</h3><ul><li>Which tools or spreadsheets do you use today, and should data move across?</li><li>Who will approve designs and test the system on your side?</li><li>Any date you must go live by?</li></ul>';
  }

  // ---------- Proposal document ----------
  function proposalHTML(rfp) {
    const C = CFG(), e = estimate(rfp), mods = e.build;
    const dt = rfp.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const valid = new Date(rfp.date.getTime() + 30 * 864e5).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const w = e.weeks, p1 = Math.max(1, Math.round(w * 0.15)), p3 = Math.max(1, Math.round(w * 0.2));
    const p2 = w - p1 - p3 - 1;
    const stack = ['<b>Web and mobile:</b> React with TypeScript; the same code runs in the browser and ships to Android and iPhone through Capacitor.',
      '<b>Backend:</b> Supabase (PostgreSQL, row-level security, edge functions) in the Mumbai region.',
      '<b>Payments:</b> Razorpay or your existing gateway for UPI and cards; GST invoices generated by the system.',
      '<b>Messaging:</b> Meta WhatsApp Cloud API and MSG91 SMS, sent from your own business number.'];
    if (e.ai) stack.push('<b>AI:</b> Anthropic Claude (primary) or OpenAI ChatGPT through their business APIs. No model is trained on your data.');
    const plan = [['Discovery and design', p1, 'Workshops, screen designs in Figma, final scope signed off'], ['Build', p2, 'Weekly demos on a test link; you try features as they land'], ['Testing (UAT)', p3, 'Your team tests with real data; we fix what you find'], ['Go-live', 1, 'Store submission, data migration, staff training']];
    return '<div class="dhead"><div><span class="tag">Result plan · technical and commercial proposal</span><h2>' + esc(rfp.biz) + '</h2></div><div class="meta">Ref ' + rfp.id + '-P<br>' + dt + '<br>Valid until ' + valid + '</div></div>' +
      '<p><b>From:</b> ' + esc(C.company) + ' · ' + esc(C.phoneDisplay) + ' · ' + esc(C.email) + (rfp.name ? '<br><b>To:</b> ' + esc(rfp.name) + ', ' + esc(rfp.biz) : '') + '</p>' +

      '<h3>1. Summary</h3><p>Inraa works as Result as a Service: we build, run and improve the system, and report the result to you every month. We propose a ' + (rfp.modules.includes('mobile') ? 'web and mobile' : 'web') + ' system for ' + esc(rfp.biz) + ' (' + esc(rfp.industry.toLowerCase()) + ') covering ' + mods.length + ' modules. It replaces manual work with one shared system for ' + rfp.roles.map((r) => r.toLowerCase()).join(', ') + '. Delivery takes about <b>' + w + ' weeks</b> for a fixed price of <b>' + inr(e.price) + '</b> plus GST, or <b>' + inr(e.subMonthly) + ' a month</b> with no upfront payment.</p>' +

      '<h3>2. Results we will deliver</h3><p>We agree the starting number for each of these in the first week, then report it every month.</p><div class="tbl"><table><thead><tr><th>Result</th><th>How we measure it</th></tr></thead><tbody>' + mods.filter((x) => RESULTS[x.m.id]).map((x) => '<tr><td>' + esc(RESULTS[x.m.id][0]) + '</td><td>' + esc(RESULTS[x.m.id][1]) + '</td></tr>').join('') + '</tbody></table></div>' +
      '<div class="note">Cost cut: manual calls, registers and spreadsheets replaced by automation. Revenue protected: bookings, payments and follow-ups keep happening when you are away.</div>' +
      '<h3>3. Technical proposal</h3><h4>3.1 Scope of work</h4><div class="tbl"><table><thead><tr><th>Module</th><th>What you get</th></tr></thead><tbody>' + mods.map((x) => '<tr><td>' + esc(x.m.name) + '</td><td>' + esc(x.m.desc) + '</td></tr>').join('') + '</tbody></table></div>' +
      '<h4>3.2 Architecture</h4><ul>' + stack.map((s) => '<li>' + s + '</li>').join('') + '</ul>' +
      '<h4>3.3 How we deliver</h4><p>A squad of one senior engineer and one reviewer/tester, working with AI coding assistants (Claude and ChatGPT) for code, tests and documentation. Every change is reviewed by a person before it reaches your test link. This is why the effort below is lower than a traditional team’s.</p>' +
      '<h4>3.4 Timeline</h4><div class="tbl"><table><thead><tr><th>Phase</th><th class="r">Weeks</th><th>Outcome</th></tr></thead><tbody>' + plan.map((r) => '<tr><td>' + r[0] + '</td><td class="r">' + r[1] + '</td><td>' + r[2] + '</td></tr>').join('') + '<tr class="tot"><td>Total</td><td class="r">' + w + '</td><td></td></tr></tbody></table></div>' +
      '<h4>3.5 What we use, and what we don’t</h4><ul>' +
      '<li>AI features call third-party models (Anthropic Claude, OpenAI ChatGPT) over their APIs. Text or images sent for AI processing are handled by those providers under their business terms, which do not train on API data.</li>' +
      '<li>We do not train custom AI models, run GPUs on your premises or promise 100% AI accuracy. AI results that affect money, health or legal records are shown to a person to confirm.</li>' +
      '<li>We do not supply hardware (biometric devices, printers, GPS units); we integrate with standard devices you buy.</li>' +
      '<li>Uptime target 99.5%, backed by our cloud providers. Support during ' + esc(C.hours) + '; urgent production issues are picked up the same day.</li>' +
      '<li>Play Store and App Store developer accounts are in your name; store fees (about ₹2,100 once for Google and ₹8,300 a year for Apple) are paid by you.</li></ul>' +

      '<h3>4. Commercial proposal</h3><h4>4.1 Effort</h4><div class="tbl"><table><thead><tr><th>Item</th><th class="r">Days</th><th class="r">Amount</th></tr></thead><tbody>' +
      '<tr><td>Discovery and design</td><td class="r">' + e.discovery + '</td><td class="r">' + inr(e.discovery * RATE.dayRate) + '</td></tr>' +
      mods.map((x) => '<tr><td>' + esc(x.m.name) + '</td><td class="r">' + x.days + '</td><td class="r">' + inr(x.days * RATE.dayRate) + '</td></tr>').join('') +
      '<tr><td>Testing and review</td><td class="r">' + e.qa + '</td><td class="r">' + inr(e.qa * RATE.dayRate) + '</td></tr>' +
      '<tr><td>Project management</td><td class="r">' + e.pm + '</td><td class="r">' + inr(e.pm * RATE.dayRate) + '</td></tr>' +
      '<tr><td>Contingency (10%)</td><td class="r">' + e.cont + '</td><td class="r">' + inr(e.cont * RATE.dayRate) + '</td></tr>' +
      '<tr class="tot"><td>Total</td><td class="r">' + e.days + '</td><td class="r">' + inr(e.price) + '</td></tr></tbody></table></div>' +
      '<p style="font-size:13.5px;color:#666">Day rate ' + inr(RATE.dayRate) + ' for an AI-assisted senior engineer. Prices exclude 18% GST.</p>' +
      '<h4>4.2 Choose how to pay</h4><div class="opt">' +
      '<div><div class="lbl">Option A · Own it</div><div class="big">' + inr(e.price) + '</div><div>one-time build, plus ' + inr(e.monthly) + '/month to run</div><ul><li>30% on signing</li><li>40% when the build is on the test link</li><li>30% on go-live</li><li>Source code handed over to you</li></ul></div>' +
      '<div><div class="lbl">Option B · Result subscription</div><div class="big">' + inr(e.subMonthly) + '<span style="font-size:15px">/month</span></div><div>no upfront payment, everything included</div><ul><li>24-month minimum term</li><li>Hosting, support, updates and monthly result report included</li><li>Buy out the code any time after 12 months</li><li>First month paid on signing</li></ul></div></div>' +
      '<h4>4.3 Monthly result service (Option A)</h4><div class="tbl"><table><tbody><tr><td>Cloud hosting, backups and monitoring</td><td class="r">' + inr(e.hosting) + '</td></tr><tr><td>Result service: support, fixes, improvements and monthly result report</td><td class="r">' + inr(e.support) + '</td></tr>' + (e.ai ? '<tr><td>AI usage (Claude / ChatGPT API), estimate, billed at actuals</td><td class="r">' + inr(e.aiRun) + '</td></tr>' : '') + '<tr class="tot"><td>Per month</td><td class="r">' + inr(e.monthly) + '</td></tr></tbody></table></div>' +
      '<div class="note">WhatsApp messages are billed at Meta’s published rates and payment-gateway fees by the gateway; both go to your own accounts. New features after go-live are quoted at the same day rate.</div>' +
      '<h4>4.4 Year one at a glance</h4><div class="tbl"><table><tbody><tr><td>Option A: build + 12 months running</td><td class="r">' + inr(e.price + e.monthly * 12) + '</td></tr><tr><td>Option B: 12 months subscription</td><td class="r">' + inr(e.subMonthly * 12) + '</td></tr><tr><td>With GST (Option A)</td><td class="r">' + inr((e.price + e.monthly * 12) * (1 + RATE.gst)) + '</td></tr></tbody></table></div>' +
      '<h3>5. Next steps</h3><ol><li>A 30-minute call to walk through this proposal and the open questions.</li><li>We confirm scope and send the agreement.</li><li>Kick-off within 7 days of signing.</li></ol>' +
      '<p style="margin-top:22px;font-size:13.5px;color:#666">This proposal was drafted by Inraa’s proposal agent from your description and will be confirmed by our team on the call.</p>';
  }

  function productProposalHTML(key, input) {
    const C = CFG(), p = C.products[key];
    const dt = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const unit = p.yearly ? '/year' : '/month';
    return '<div class="dhead"><div><span class="tag">Result plan</span><h2>' + esc(p.name) + ' for ' + esc(input.biz || 'your business') + '</h2></div><div class="meta">' + dt + '<br>Valid for 30 days</div></div>' +
      '<h3>1. The result for you</h3><ul>' + p.results.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul><h3>How it works</h3><p>' + esc(p.summary) + '</p><ul>' + p.points.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
      '<h3>2. Plans</h3><div class="tbl"><table><thead><tr><th>Plan</th><th>Includes</th><th class="r">Price</th></tr></thead><tbody>' + p.plans.map((x) => '<tr><td>' + esc(x[0]) + '</td><td>' + esc(x[2]) + '</td><td class="r">' + (x[1] ? inr(x[1]) + unit : 'Free') + '</td></tr>').join('') + '</tbody></table></div>' +
      (p.setup ? '<p>One-time setup and data import: ' + inr(p.setup) + '. Prices exclude 18% GST. Paying yearly upfront saves up to 20%.</p>' : '<p>No setup fee and zero commission on bookings. Prices exclude 18% GST.</p>') +
      '<h3>3. Need changes?</h3><p>If you need features beyond the standard product, describe them under “Something else” and our agent will cost them separately at our standard day rate of ' + inr(RATE.dayRate) + '.</p>' +
      '<h3>4. Next steps</h3><ol><li>Try it: <a href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.url.replace(/^https?:\/\//, '')) + '</a></li><li>A short call to set up your account.</li><li>Live the same week.</li></ol>';
  }

  function plainText(html) {
    const d = document.createElement('div'); d.innerHTML = html.replace(/<\/(p|h\d|li|tr|div)>/g, '\n').replace(/<td[^>]*>/g, ' | ');
    return d.textContent.replace(/\n{3,}/g, '\n\n').trim();
  }

  // Minimal Markdown renderer for the optional AI worker's output.
  function md(s) {
    const lines = esc(s).split('\n'); let out = '', list = null, table = [];
    const inline = (x) => x.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>');
    const flushList = () => { if (list) { out += '</' + list + '>'; list = null; } };
    const flushTable = () => { if (!table.length) return; const rows = table.filter((r) => !/^\s*\|?\s*:?-{2,}/.test(r)); out += '<div class="tbl"><table>' + rows.map((r, i) => '<tr>' + r.replace(/^\||\|$/g, '').split('|').map((c) => (i ? '<td>' : '<th>') + inline(c.trim()) + (i ? '</td>' : '</th>')).join('') + '</tr>').join('') + '</table></div>'; table = []; };
    lines.forEach((l) => {
      if (/^\s*\|/.test(l)) { flushList(); table.push(l.trim()); return; } flushTable();
      let m;
      if ((m = l.match(/^(#{1,4})\s+(.*)/))) { flushList(); const n = Math.min(4, m[1].length + 1); out += '<h' + n + '>' + inline(m[2]) + '</h' + n + '>'; }
      else if ((m = l.match(/^\s*[-*]\s+(.*)/))) { if (list !== 'ul') { flushList(); out += '<ul>'; list = 'ul'; } out += '<li>' + inline(m[1]) + '</li>'; }
      else if ((m = l.match(/^\s*\d+[.)]\s+(.*)/))) { if (list !== 'ol') { flushList(); out += '<ol>'; list = 'ol'; } out += '<li>' + inline(m[1]) + '</li>'; }
      else if (l.trim()) { flushList(); out += '<p>' + inline(l) + '</p>'; }
      else flushList();
    });
    flushList(); flushTable(); return out;
  }

  async function aiRewrite(rfp) {
    const url = CFG().aiEndpoint; if (!url) return null;
    const e = estimate(rfp);
    const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
      business: rfp.biz, contact: rfp.name, industry: rfp.industry, problem: rfp.problem,
      modules: e.build.map((x) => ({ name: x.m.name, days: x.days })), totals: { days: e.days, price: e.price, weeks: e.weeks, monthly: e.monthly, subscription: e.subMonthly, dayRate: RATE.dayRate },
      company: { name: CFG().company, phone: CFG().phoneDisplay, email: CFG().email },
    }) });
    if (!res.ok) throw new Error('AI service returned ' + res.status);
    const j = await res.json();
    return j.markdown ? md(j.markdown) : null;
  }

  window.RFPAgent = { analyse, estimate, rfpHTML, proposalHTML, productProposalHTML, plainText, aiRewrite, EXAMPLES, MODULES, RATE, inr };
})();
