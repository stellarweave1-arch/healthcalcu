/* SmartCalc Hub — script.js (premium redesign, same functionality) */
(function () {
  'use strict';

  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile nav
  const nav = document.querySelector('.main-nav');
  const navBtn = document.querySelector('.nav-toggle');
  navBtn?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    navBtn.setAttribute('aria-expanded', String(open));
  });
  document.querySelectorAll('.nav-list a').forEach((a) => {
    a.addEventListener('click', () => nav.classList.remove('open'));
  });

  // Tabs
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('[data-panel]');
  function showPanel(name) {
    tabs.forEach((t) => {
      const active = t.dataset.tab === name;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', String(active));
    });
    panels.forEach((p) => {
      const match = p.dataset.panel === name;
      p.hidden = !match;
    });
  }
  tabs.forEach((t) => t.addEventListener('click', () => showPanel(t.dataset.tab)));

  const validHashes = ['bmi', 'calorie', 'height', 'grade'];
  const initial = location.hash.replace('#', '');
  if (validHashes.includes(initial)) showPanel(initial);
  window.addEventListener('hashchange', () => {
    const h = location.hash.replace('#', '');
    if (validHashes.includes(h)) showPanel(h);
  });

  // Helpers
  const $ = (id) => document.getElementById(id);
  const num = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : NaN;
  };
  const setErr = (el, msg) => { if (el) el.textContent = msg || ''; };

  /* ---------- BMI ---------- */
  const bmiUnits = $('bmi-units');
  const metricEls = document.querySelectorAll('.metric-only');
  const imperialEls = document.querySelectorAll('.imperial-only');
  function syncBmiUnits() {
    const metric = bmiUnits.value === 'metric';
    metricEls.forEach((e) => (e.hidden = !metric));
    imperialEls.forEach((e) => (e.hidden = metric));
    $('bmi-weight').placeholder = metric ? 'e.g. 70' : 'e.g. 154';
  }
  bmiUnits.addEventListener('change', syncBmiUnits);
  syncBmiUnits();

  function bmiCategory(bmi) {
    if (bmi < 18.5) return { tag: 'Underweight', note: 'Consider a balanced diet to reach a healthy weight range.' };
    if (bmi < 25)   return { tag: 'Healthy',     note: "You're within the healthy weight range — keep it up." };
    if (bmi < 30)   return { tag: 'Overweight',  note: 'Small lifestyle adjustments can move you toward a healthy range.' };
    return { tag: 'Obese', note: 'Consider speaking with a healthcare professional for personalized guidance.' };
  }

  $('bmi-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const err = $('bmi-err'); setErr(err, '');
    const metric = bmiUnits.value === 'metric';
    let w = num($('bmi-weight').value), hM;

    if (metric) {
      const hCm = num($('bmi-height-cm').value);
      if (!w || w <= 0 || !hCm || hCm <= 0) return setErr(err, 'Please enter valid weight and height.');
      hM = hCm / 100;
    } else {
      const ft = num($('bmi-height-ft').value);
      const inch = num($('bmi-height-in').value) || 0;
      if (!w || w <= 0 || !ft || ft <= 0) return setErr(err, 'Please enter valid weight and height.');
      w = w * 0.453592;
      hM = (ft * 12 + inch) * 0.0254;
    }
    const bmi = w / (hM * hM);
    if (!Number.isFinite(bmi) || bmi <= 0) return setErr(err, 'Could not compute BMI. Check your inputs.');
    const cat = bmiCategory(bmi);
    $('bmi-value').textContent = bmi.toFixed(1);
    $('bmi-category').textContent = cat.tag;
    $('bmi-note').textContent = cat.note;

    // Position marker across 15–40 scale
    const marker = $('bmi-marker');
    if (marker) {
      const clamped = Math.max(15, Math.min(40, bmi));
      const pct = ((clamped - 15) / (40 - 15)) * 100;
      marker.style.left = pct + '%';
    }
    const res = $('bmi-result'); res.hidden = false;
  });

  /* ---------- Calorie ---------- */
  $('cal-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const err = $('cal-err'); setErr(err, '');
    const age = num($('cal-age').value);
    const gender = $('cal-gender').value;
    const h = num($('cal-height').value);
    const w = num($('cal-weight').value);
    const act = num($('cal-activity').value);
    if (!age || !h || !w || age < 10 || age > 100 || h < 50 || w < 1) {
      return setErr(err, 'Please fill all fields with realistic values.');
    }
    const bmr = gender === 'male'
      ? (10 * w + 6.25 * h - 5 * age + 5)
      : (10 * w + 6.25 * h - 5 * age - 161);
    const maint = bmr * act;
    const loss = maint - 500;
    const gain = maint + 500;
    animateNumber($('cal-loss'),  Math.round(loss));
    animateNumber($('cal-maint'), Math.round(maint));
    animateNumber($('cal-gain'),  Math.round(gain));
    const res = $('cal-result'); res.hidden = false;
  });

  /* ---------- Height Predictor ---------- */
  $('ht-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const err = $('ht-err'); setErr(err, '');
    const age = num($('ht-age').value);
    const gender = $('ht-gender').value;
    const mom = num($('ht-mom').value);
    const dad = num($('ht-dad').value);
    if (!age || age < 2 || age > 18) return setErr(err, 'Please enter a child age between 2 and 18.');
    if (!mom || !dad || mom < 100 || dad < 100) return setErr(err, 'Please enter valid parent heights in cm.');
    const estimate = gender === 'male'
      ? (mom + dad + 13) / 2
      : (mom + dad - 13) / 2;
    $('ht-value').textContent = estimate.toFixed(1);
    const res = $('ht-result'); res.hidden = false;
  });

  /* ---------- Grade ---------- */
  const grRows = $('gr-rows');
  function addRow() {
    const row = document.createElement('div');
    row.className = 'gr-row';
    row.innerHTML = `
      <input type="text" placeholder="e.g. Quiz 1" class="gr-name" />
      <input type="number" placeholder="0–100" class="gr-grade" min="0" max="100" step="0.01" />
      <input type="number" placeholder="0–100" class="gr-weight" min="0" max="100" step="0.01" />
      <button type="button" class="icon-btn gr-remove" aria-label="Remove row">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
      </button>`;
    grRows.appendChild(row);
  }
  $('gr-add').addEventListener('click', addRow);
  grRows.addEventListener('click', (e) => {
    const btn = e.target.closest('.gr-remove');
    if (btn && grRows.children.length > 1) btn.closest('.gr-row').remove();
  });

  function letterGrade(p) {
    if (p >= 93) return 'A';
    if (p >= 90) return 'A-';
    if (p >= 87) return 'B+';
    if (p >= 83) return 'B';
    if (p >= 80) return 'B-';
    if (p >= 77) return 'C+';
    if (p >= 73) return 'C';
    if (p >= 70) return 'C-';
    if (p >= 67) return 'D+';
    if (p >= 63) return 'D';
    if (p >= 60) return 'D-';
    return 'F';
  }
  function gpa4(p) {
    if (p >= 93) return 4.0;
    if (p >= 90) return 3.7;
    if (p >= 87) return 3.3;
    if (p >= 83) return 3.0;
    if (p >= 80) return 2.7;
    if (p >= 77) return 2.3;
    if (p >= 73) return 2.0;
    if (p >= 70) return 1.7;
    if (p >= 67) return 1.3;
    if (p >= 63) return 1.0;
    if (p >= 60) return 0.7;
    return 0.0;
  }

  $('gr-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const err = $('gr-err'); setErr(err, '');
    const rows = grRows.querySelectorAll('.gr-row');
    let totalW = 0, sum = 0, anyWeight = false, simpleCount = 0, simpleSum = 0, valid = 0;

    for (const r of rows) {
      const g = num(r.querySelector('.gr-grade').value);
      const w = num(r.querySelector('.gr-weight').value);
      if (!Number.isFinite(g)) continue;
      if (g < 0 || g > 100) return setErr(err, 'Grades must be between 0 and 100.');
      valid++;
      if (Number.isFinite(w) && w > 0) {
        if (w > 100) return setErr(err, 'Weights must be between 0 and 100.');
        anyWeight = true;
        totalW += w;
        sum += g * w;
      } else {
        simpleCount++;
        simpleSum += g;
      }
    }
    if (valid === 0) return setErr(err, 'Please enter at least one grade.');

    let pct;
    if (anyWeight) {
      if (simpleCount > 0) {
        const remaining = Math.max(0, 100 - totalW);
        if (remaining > 0) {
          const share = remaining / simpleCount;
          sum += simpleSum * share;
          totalW += remaining;
        }
      }
      pct = sum / totalW;
    } else {
      pct = simpleSum / simpleCount;
    }
    $('gr-pct').textContent = pct.toFixed(2);
    $('gr-letter').textContent = letterGrade(pct);
    $('gr-gpa').textContent = gpa4(pct).toFixed(1);
    const res = $('gr-result'); res.hidden = false;
  });

  /* ---------- Contact ---------- */
  $('contact-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const err = $('c-err'), ok = $('c-ok');
    setErr(err, ''); ok.textContent = '';
    const name = $('c-name').value.trim();
    const email = $('c-email').value.trim();
    const msg = $('c-msg').value.trim();
    if (!name || !email || !msg) return setErr(err, 'Please fill in all fields.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErr(err, 'Please enter a valid email.');
    ok.textContent = 'Thanks — your message has been received (demo form).';
    e.target.reset();
  });

  /* ---------- Number animation ---------- */
  function animateNumber(el, target) {
    if (!el) return;
    const start = parseInt(el.textContent.replace(/[^\d-]/g, ''), 10) || 0;
    const duration = 600;
    const t0 = performance.now();
    function step(now) {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(start + (target - start) * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- Reveal on scroll ---------- */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.style.animation = 'floatIn .7s ease both';
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.feat, .section-head, .strip').forEach((el) => io.observe(el));
  }
})();
