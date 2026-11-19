/* fitcheq auto demo: plays scripted taps inside a live app, like a screen recording.
   FQDemo.play({ frame, steps, list, onReset }) \u2014 frame is the element that holds the app (scaled or not). */
(function () {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function play(o) {
    const frame = o.frame;
    frame.style.position = frame.style.position || 'relative';
    const dot = document.createElement('div'); dot.className = 'fq-tapdot'; frame.appendChild(dot);
    let visible = false, paused = 0, running = false;
    const scale = () => frame.getBoundingClientRect().width / frame.offsetWidth || 1;
    const items = o.list ? [...o.list.querySelectorAll('[data-step]')] : [];
    function mark(i) { items.forEach((li, j) => li.classList.toggle('on', j === i)); }

    async function waitTurn() { while (!visible || Date.now() < paused) await sleep(300); }
    function scrollerOf(el) { let p = el.parentElement; while (p && p !== frame) { const s = getComputedStyle(p).overflowY; if ((s === 'auto' || s === 'scroll') && p.scrollHeight > p.clientHeight) return p; p = p.parentElement; } return null; }
    async function reveal(el) {
      const sc = scrollerOf(el); if (!sc) return;
      const k = scale(), r = el.getBoundingClientRect(), sr = sc.getBoundingClientRect();
      const top = (r.top - sr.top) / k, h = r.height / k;
      if (top < 40 || top + h > sc.clientHeight - 40) { sc.scrollTo({ top: Math.max(0, sc.scrollTop + top - sc.clientHeight * 0.35), behavior: reduce ? 'auto' : 'smooth' }); await sleep(650); }
    }
    function moveDot(el) {
      const k = scale(), r = el.getBoundingClientRect(), fr = frame.getBoundingClientRect();
      dot.style.left = (r.left - fr.left + r.width / 2) / k + 'px'; dot.style.top = (r.top - fr.top + r.height / 2) / k + 'px';
      dot.classList.add('show');
    }
    async function tap(sel) {
      const el = typeof sel === 'function' ? sel() : frame.querySelector(sel); if (!el) return;
      await reveal(el); moveDot(el); await sleep(500);
      dot.classList.remove('press'); void dot.offsetWidth; dot.classList.add('press');
      await sleep(160); el.dispatchEvent(new MouseEvent('click', { bubbles: true })); await sleep(250);
    }
    async function slide(sel, to) {
      const el = frame.querySelector(sel); if (!el) return;
      await reveal(el); moveDot(el); await sleep(350);
      const from = +el.value, n = 24;
      for (let i = 1; i <= n; i++) {
        const cur = frame.querySelector(sel); if (!cur) return;
        cur.value = Math.round(from + (to - from) * (i / n)); cur.dispatchEvent(new Event('input', { bubbles: true }));
        const k = scale(), r = cur.getBoundingClientRect(), fr = frame.getBoundingClientRect();
        const p = (cur.value - cur.min) / (cur.max - cur.min);
        dot.style.transition = 'none'; dot.style.left = (r.left - fr.left + 13 * k + p * (r.width - 26 * k)) / k + 'px'; dot.style.top = (r.top - fr.top + r.height / 2) / k + 'px';
        await sleep(45);
      }
      dot.style.transition = '';
    }
    async function scrollTo(sel) {
      const el = frame.querySelector(sel); if (!el) return;
      const sc = scrollerOf(el) || frame.querySelector('.fa-scroll,.ad-main'); if (!sc) return;
      const k = scale(), top = (el.getBoundingClientRect().top - sc.getBoundingClientRect().top) / k;
      sc.scrollTo({ top: Math.max(0, sc.scrollTop + top - 20), behavior: reduce ? 'auto' : 'smooth' }); await sleep(700);
    }

    async function loop() {
      if (running) return; running = true;
      for (;;) {
        await waitTurn();
        if (o.onReset) o.onReset();
        dot.classList.remove('show');
        for (let i = 0; i < o.steps.length; i++) {
          const s = o.steps[i];
          await waitTurn();
          if (s.mark != null) mark(s.mark);
          if (s.tap) await tap(s.tap);
          if (s.slide) await slide(s.slide[0], s.slide[1]);
          if (s.scroll) await scrollTo(s.scroll);
          if (s.top) { const sc = frame.querySelector(s.top); if (sc) sc.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); await sleep(500); }
          if (s.fn) s.fn();
          if (s.hide) dot.classList.remove('show');
          await sleep(s.wait || 900);
        }
        dot.classList.remove('show');
        await sleep(1500);
      }
    }
    // a real person touching the device pauses the demo
    frame.addEventListener('pointerdown', (e) => { if (e.isTrusted) { paused = Date.now() + 12000; dot.classList.remove('show'); } }, true);
    frame.addEventListener('wheel', () => { paused = Date.now() + 12000; }, { passive: true, capture: true });
    items.forEach((li, i) => li.addEventListener('click', () => { paused = 0; }));
    if ('IntersectionObserver' in window) new IntersectionObserver((es) => es.forEach((e) => { visible = e.isIntersecting; }), { threshold: 0.35 }).observe(frame);
    else visible = true;
    loop();
  }
  window.FQDemo = { play };
})();
