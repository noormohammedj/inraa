/* Inraa site behaviour: contact links from config, product sections, the business picker and the proposal flow. */
(function () {
  const C = window.INRAA, A = window.RFPAgent, $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const check = '<svg><use href="#i-check"/></svg>';
  const ICON = { plotskart: 'i-plot', mandapkart: 'i-hall', fitcheq: 'i-gym' };

  // ---------- contact details ----------
  const tel = 'tel:+91' + C.phone;
  const wa = (text) => 'https://wa.me/' + C.whatsapp + (text ? '?text=' + encodeURIComponent(text) : '');
  const mail = (subject, body) => 'mailto:' + C.email + '?subject=' + encodeURIComponent(subject || 'Enquiry from inraasolution.com') + (body ? '&body=' + encodeURIComponent(body.slice(0, 1600)) : '');
  $$('[data-tel]').forEach((a) => { a.href = tel; if (!a.textContent.trim()) a.textContent = C.phoneDisplay; });
  $$('[data-tel-text]').forEach((s) => (s.textContent = C.phoneDisplay));
  $$('[data-email-text]').forEach((s) => (s.textContent = C.email));
  $$('[data-hours]').forEach((s) => (s.textContent = C.hours));
  $$('[data-wa]').forEach((a) => (a.href = wa('Hi Inraa team, I would like to discuss a solution for my business.')));
  $$('[data-mail]').forEach((a) => (a.href = mail()));
  $$('[data-plink]').forEach((a) => { const p = C.products[a.dataset.plink]; a.href = p.url; a.target = '_blank'; a.rel = 'noopener'; });
  $('#yr').textContent = new Date().getFullYear();

  // ---------- product sections ----------
  $$('[data-product]').forEach((el) => {
    const k = el.dataset.product, p = C.products[k], ext = /^https?:/.test(p.url);
    el.innerHTML = '<div class="phead"><span class="ico"><svg><use href="#' + ICON[k] + '"/></svg></span><div><h3>' + esc(p.name) + '</h3><small>' + esc(p.tagline) + '</small></div></div>' +
      '<p>' + esc(p.summary) + '</p><ul>' + p.points.map((x) => '<li>' + check + '<span>' + esc(x) + '</span></li>').join('') + '</ul>' +
      '<div class="price"><b>' + esc(p.price) + '</b> · prices before GST</div>' +
      '<div class="acts"><a class="btn red" href="' + esc(p.url) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>Visit ' + esc(p.name) + '</a><a class="more" href="#start" data-pick="' + k + '">Is it right for me</a></div>';
  });

  // plotskart mock map
  (function () {
    const m = $('#plotmap'); if (!m) return; let h = '', n = 1;
    const pat = 'aabsaaab sabaasaa r aasbaaba babaasaa r aaasbbaa saabaasa';
    for (const ch of pat.replace(/ /g, '')) {
      if (ch === 'r') { h += '<i class="r"></i>'; continue; }
      h += '<i class="' + ch + (n === 19 ? ' sel' : '') + '">' + (n + 23) + '</i>'; n++;
    }
    m.innerHTML = h;
  })();
  // mandapkart mock calendar
  (function () {
    const c = $('#cal'); if (!c) return;
    let h = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => '<span class="h">' + d + '</span>').join('');
    const booked = [3, 4, 10, 11, 17, 24, 25], peak = [12, 18, 19, 26];
    h += '<i></i><i></i>';
    for (let d = 1; d <= 26; d++) h += '<i class="' + (d === 20 ? 'sel' : booked.includes(d) ? 'bk' : peak.includes(d) ? 'pk' : '') + '">' + d + '</i>';
    c.innerHTML = h;
  })();
  // fitcheq: the real member app, loaded from the Fitcheq site and playing a short demo
  function loadFitcheq(done) {
    const base = C.fitcheqUrl, el = $('#fq-live'); if (!el) return;
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = base + 'app.css'; document.head.appendChild(css);
    const files = ['data.js', 'app.js', 'demo.js']; let i = 0;
    (function next() {
      if (i >= files.length) return done();
      const sc = document.createElement('script'); sc.src = base + files[i++]; sc.onload = next;
      sc.onerror = () => { el.closest('.stage').innerHTML = '<a class="btn out" style="margin:auto" href="' + esc(base) + '" target="_blank" rel="noopener">Open the Fitcheq demo</a>'; };
      document.body.appendChild(sc);
    })();
  }
  loadFitcheq(function () {
    const el = $('#fq-live'); if (!el || !window.FQApp) return;
    const app = FQApp.mount(el, { member: 'm1', screen: 'today' });
    if (!window.FQDemo) return;
    const k0 = FQ.util.key(FQ.util.T);
    FQDemo.play({ frame: el.parentElement,
      onReset() { const s = FQ.state(); (s.logs.m1 = s.logs.m1 || {})[k0] = {}; app.set({ screen: 'today', dayOff: 0, adh: null }); },
      steps: [
        { wait: 1400 },
        { tap: '[data-act="mlog"][data-meal="breakfast"][data-v="done"]', wait: 700 },
        { tap: '[data-act="mlog"][data-meal="midmorning"][data-v="done"]', wait: 1200 },
        { tap: '[data-go="diet"]', wait: 1400 },
        { tap: '[data-act="day"][data-o="1"]', wait: 1400 },
        { tap: '[data-go="progress"]', wait: 900 },
        { scroll: '[data-sec="whatif"]', wait: 300 },
        { slide: ['.fa-range', 100], wait: 1800, hide: true },
      ] });
  });

  // ---------- business picker ----------
  const keys = Object.keys(C.products);
  $('#choices').innerHTML = keys.map((k) => { const p = C.products[k]; return '<button type="button" class="choice" data-choice="' + k + '"><svg class="ico"><use href="#' + ICON[k] + '"/></svg><b>' + esc(p.for) + '</b><span>' + esc(p.pick) + '. ' + esc(p.name) + ' is built for you.</span><em>' + esc(p.name) + '</em></button>'; }).join('') +
    '<button type="button" class="choice" data-choice="custom"><svg class="ico"><use href="#i-idea"/></svg><b>Something else</b><span>Describe your problem and get a proposal with a price.</span><em>Custom solution</em></button>';

  let current = null, rfp = null;
  function pick(k, scroll) {
    current = k;
    $$('.choice').forEach((b) => b.classList.toggle('on', b.dataset.choice === k));
    $('#p-product').hidden = k === 'custom'; $('#p-custom').hidden = k !== 'custom';
    $('#rfp-out').innerHTML = ''; $('#prop-out').innerHTML = '';
    if (k !== 'custom') renderProduct(k); else steps(1);
    if (scroll) (k === 'custom' ? $('#p-custom') : $('#p-product')).scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  $('#choices').addEventListener('click', (e) => { const b = e.target.closest('[data-choice]'); if (b) pick(b.dataset.choice, true); });
  document.addEventListener('click', (e) => { const a = e.target.closest('[data-pick]'); if (!a) return; e.preventDefault(); $('#start').scrollIntoView({ behavior: 'smooth' }); setTimeout(() => pick(a.dataset.pick, true), 350); });

  function renderProduct(k) {
    const p = C.products[k], ext = /^https?:/.test(p.url), unit = p.yearly ? '/year' : '/month';
    $('#p-product').innerHTML = '<div class="two"><div><span class="tag">Recommended for you</span><h3 style="margin-top:6px">' + esc(p.name) + ': ' + esc(p.tagline.toLowerCase()) + '</h3><p class="lead" style="font-size:16px;margin-top:10px">' + esc(p.summary) + '</p><ul class="fitlist">' + p.points.map((x) => '<li>' + check + '<span>' + esc(x) + '</span></li>').join('') + '</ul></div>' +
      '<div><div class="plans"><div class="pl"><span>Plan</span><span>Price</span></div>' + p.plans.map((x) => '<div class="pl"><span>' + esc(x[0]) + ' <span style="color:var(--z-muted);font-size:13px">· ' + esc(x[2]) + '</span></span><b>' + (x[1] ? A.inr(x[1]) + unit : 'Free') + '</b></div>').join('') + '</div><p style="font-size:13.5px;color:var(--z-muted);margin:10px 0 0">Prices before 18% GST.</p></div></div>' +
      '<div class="acts"><a class="btn red" href="' + esc(p.url) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>Visit ' + esc(p.name) + '</a><button type="button" class="btn out" id="pp-gen">Get a written proposal</button><a class="more" href="#start" data-pick="custom">My needs are different</a></div>';
    $('#pp-gen').addEventListener('click', () => {
      const html = A.productProposalHTML(k, { biz: '' });
      showProposal(html, p.name + ' proposal', 'I am interested in ' + p.name + '.');
    });
  }

  // ---------- custom flow ----------
  function steps(n) { $$('#steps3 span').forEach((s, i) => { s.className = i + 1 < n ? 'ok' : i + 1 === n ? 'on' : ''; }); }
  $$('[data-ex]').forEach((b) => b.addEventListener('click', () => { $('#c-problem').value = A.EXAMPLES[b.dataset.ex]; $('#c-problem').focus(); }));
  $('#f-custom').addEventListener('submit', (e) => {
    e.preventDefault();
    const problem = $('#c-problem').value.trim(), err = $('#c-err');
    if (problem.split(/\s+/).length < 8) { err.hidden = false; err.textContent = 'Please describe the problem in at least a sentence or two, so the requirements make sense.'; $('#c-problem').focus(); return; }
    err.hidden = true;
    rfp = A.analyse({ name: $('#c-name').value, biz: $('#c-biz').value, problem });
    renderRFP(); steps(2);
    $('#rfp-out').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  function renderRFP() {
    $('#prop-out').innerHTML = '';
    $('#rfp-out').innerHTML = '<div class="doc" id="rfp">' + A.rfpHTML(rfp) + '</div><div class="docbar"><button type="button" class="btn out" id="rfp-edit">Edit my description</button><button type="button" class="btn red" id="rfp-go">Create the proposal</button></div>';
    $('#modchips').addEventListener('click', (e) => {
      const b = e.target.closest('[data-mod]'); if (!b || b.disabled) return;
      const id = b.dataset.mod, i = rfp.modules.indexOf(id);
      if (i >= 0) rfp.modules.splice(i, 1); else rfp.modules.push(id);
      b.classList.toggle('on', i < 0);
    });
    $('#rfp-edit').addEventListener('click', () => { $('#p-custom').scrollIntoView({ behavior: 'smooth' }); $('#c-problem').focus({ preventScroll: true }); });
    $('#rfp-go').addEventListener('click', makeProposal);
  }

  async function makeProposal() {
    steps(3);
    $('#prop-out').innerHTML = '<div class="doc"><span class="busy"><i></i>Writing the technical and commercial proposal…</span></div>';
    $('#prop-out').scrollIntoView({ behavior: 'smooth', block: 'start' });
    let html = A.proposalHTML(rfp), note = '';
    if (C.aiEndpoint) {
      try { const ai = await A.aiRewrite(rfp); if (ai) html = ai + '<hr style="margin:28px 0;border:0;border-top:1px solid #e6e6e6"><details><summary style="cursor:pointer;color:#226db4">Show the full costing table</summary>' + A.proposalHTML(rfp) + '</details>'; }
      catch (err) { note = '<p class="note">The AI writer could not be reached, so this version comes from our standard proposal engine. The figures are the same.</p>'; }
    } else { await new Promise((r) => setTimeout(r, 700)); }
    const e = A.estimate(rfp);
    showProposal(note + html, 'Proposal ' + rfp.id + ' for ' + rfp.biz, 'Proposal ' + rfp.id + ' for ' + rfp.biz + ': ' + A.inr(e.price) + ' build or ' + A.inr(e.subMonthly) + '/month, about ' + e.weeks + ' weeks.');
  }

  function showProposal(html, subject, oneLine) {
    $('#prop-out').innerHTML = '<div class="doc" id="proposal">' + html + '</div>' +
      '<div class="docbar"><button type="button" class="btn out" id="pr-copy">Copy text</button><button type="button" class="btn out" id="pr-print">Download PDF</button></div>' +
      '<div class="closing"><div><h3>Happy with this? Let’s talk.</h3><p>Call or message ' + esc(C.phoneDisplay) + ', or email ' + esc(C.email) + '. Quote ' + esc(subject.split(' for ')[0]) + ' and we’ll have it open.</p></div>' +
      '<div class="acts"><a class="btn red" href="' + tel + '">Call the team</a><a class="btn green" href="' + wa('Hi Inraa team. ' + oneLine + ' Can we schedule a call?') + '" target="_blank" rel="noopener">WhatsApp</a><a class="btn out" style="background:transparent;color:#fff;border-color:#fff" id="pr-mail" href="#">Email us</a></div></div>';
    const text = A.plainText(html);
    $('#pr-mail').href = mail(subject, 'Hi Inraa team,\n\n' + oneLine + '\n\nPlease get in touch to discuss.\n\n' + (rfp && current === 'custom' ? 'My description:\n' + rfp.problem + '\n\n' : '') + 'Thanks');
    $('#pr-copy').addEventListener('click', async (ev) => {
      try { await navigator.clipboard.writeText(text); ev.target.textContent = 'Copied'; }
      catch (err) { const r = document.createRange(); r.selectNodeContents($('#proposal')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); ev.target.textContent = 'Selected, press Ctrl+C'; }
      setTimeout(() => (ev.target.textContent = 'Copy text'), 2200);
    });
    $('#pr-print').addEventListener('click', () => window.print());
  }

  // open a section from the URL, e.g. inraasolution.com/#custom
  const h = location.hash.slice(1);
  if (h === 'custom' || keys.includes(h)) setTimeout(() => { $('#start').scrollIntoView(); pick(h, false); }, 200);
})();
