/**
 * Gives the Process page its substance.
 *
 *   node tools/build-process-page.js public
 *
 * The page animated well but said almost nothing - five stages, one sentence
 * each. This deepens those five and adds four sections built from the company
 * profile's own plant and machinery data:
 *
 *   - a thermal cycle curve, so the visitor can see what a treatment actually is
 *   - the furnace table, which answers "will my part fit"
 *   - the inspection instruments, which is what makes the test stage credible
 *   - what leaves with the parts
 *
 * Idempotent: re-running detects its own output and changes nothing.
 */
const fs = require('fs');
const path = require('path');

const dir = process.argv[2] || 'public';
const p = path.join(dir, 'process.html');
let h = fs.readFileSync(p, 'utf8');
const must = (c, m) => { if (!c) throw new Error(m); };

/* ------------------------------------------------ 1. deepen the five steps */
const STEPS = [
  ['Parts logged, photographed, and dimensionally verified on arrival.',
   'Every consignment is logged against its job card, photographed, and checked for dimensions, surface condition and transit damage before it is accepted. Material grade is confirmed against your documentation.'],
  ['Metallurgists define the thermal recipe and QA checkpoints.',
   'A metallurgist sets the cycle for your grade and section thickness: austenitising temperature, soak time, quench medium and tempering schedule. Fixturing and load orientation are planned to control distortion, and the QA checkpoints are agreed before the furnace is loaded.'],
  ['Real-time temperature and atmosphere monitoring throughout.',
   'The load is charged to whichever furnace suits its size, then held, quenched and tempered to the cycle set at review. Temperature is monitored throughout, and furnace, cycle and operator are recorded against the job card.'],
  ['Hardness, NDT, and mechanical confirmation to spec.',
   'Hardness is verified on the treated part. Ultrasonic, magnetic particle or dye penetrant inspection is applied where the specification calls for it, and mechanical properties are confirmed on the 40 tonne universal testing machine.'],
  ['QA report, CoC, and full traceability package issued.',
   'Results are compiled into a QA report and certificate of conformity, tied to the job card so the batch stays traceable after it leaves. Parts are then packed and released for collection or delivery.'],
];
let deepened = 0;
for (const [from, to] of STEPS) {
  const a = `<div class="process-desc">${from}</div>`;
  if (h.includes(a)) { h = h.replace(a, `<div class="process-desc">${to}</div>`); deepened++; }
  else must(h.includes(`<div class="process-desc">${to}</div>`), `step copy not found: ${from.slice(0, 40)}`);
}

/* --------------------------------------------------- 2. the furnace count */
const OLD_COUNT = '<div class="stat-num" data-target="12" data-suffix="+">';
if (h.includes(OLD_COUNT)) h = h.replace(OLD_COUNT, '<div class="stat-num" data-target="15" data-suffix="+">');
else must(h.includes('data-target="15"'), 'furnace stat not found');

/* ------------------------------------------------------------------- CSS */
const CSS_ANCHOR = ".process-capabilities-title{font-family:'Bebas Neue',sans-serif;font-size:1.75rem;letter-spacing:0.04em;color:var(--fg);line-height:1.1}";
const CSS = `
/* --- Process page detail sections --- */
.pc-sec{margin-top:4.5rem;padding-top:3.5rem;border-top:1px solid var(--border)}
.pc-head{margin-bottom:2rem;max-width:640px}
.pc-title{font-family:'Bebas Neue',sans-serif;font-size:1.75rem;letter-spacing:0.04em;color:var(--fg);line-height:1.1;margin-top:0.75rem}
.pc-body{font-size:13px;color:var(--muted);line-height:1.75;font-weight:300;margin-top:0.75rem}
.pc-note{font-size:11px;color:var(--dim);line-height:1.6;font-weight:300;margin-top:1rem}

/* Thermal cycle diagram. The curve is drawn by animating stroke-dashoffset,
   which only touches the paint, so it stays off the layout path. */
.cycle-wrap{background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:1.5rem 1.25rem 1rem;overflow-x:auto}
.cycle-svg{display:block;width:100%;min-width:560px;height:auto}
.cycle-grid{stroke:var(--border);stroke-width:1}
.cycle-axis{stroke:var(--dim);stroke-width:1}
.cycle-tick{fill:var(--dim);font-size:11px;font-family:'JetBrains Mono',ui-monospace,monospace}
.cycle-curve{fill:none;stroke:var(--accent);stroke-width:2.5;stroke-linejoin:round;stroke-linecap:round}
.cycle-phase{fill:var(--muted);font-size:11px;letter-spacing:0.14em;text-transform:uppercase;font-weight:600}
.cycle-phase-line{stroke:var(--border);stroke-width:1;stroke-dasharray:3 4}
.cycle-anno{fill:var(--fg);font-size:11.5px}
.cycle-anno-sub{fill:var(--dim);font-size:10.5px}
.cycle-dot{fill:var(--accent)}
.cycle-leader{fill:none;stroke:var(--dim);stroke-width:1}
.cycle-legend{font-size:10.5px;color:var(--dim);margin-top:0.75rem;letter-spacing:0.02em}
.cycle-fade{opacity:0;transition:opacity .5s ease}
.cycle-wrap.is-drawn .cycle-fade{opacity:1}

/* Furnace table */
.cap-scroll{overflow-x:auto;border:1px solid var(--border);border-radius:6px;background:var(--surface2)}
.cap-table{border-collapse:collapse;width:100%;min-width:620px;font-size:13px}
.cap-table th,.cap-table td{text-align:left;padding:0.85rem 1.1rem;border-bottom:1px solid var(--border)}
.cap-table thead th{font-family:'Bebas Neue',sans-serif;font-weight:400;font-size:12px;letter-spacing:0.14em;color:var(--muted);white-space:nowrap}
.cap-table tbody tr:last-child td{border-bottom:none}
.cap-table td{color:var(--muted);font-weight:300}
.cap-table td:first-child{color:var(--fg);font-weight:500}
.cap-dim{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12.5px;white-space:nowrap;font-variant-numeric:tabular-nums}
.cap-units{font-variant-numeric:tabular-nums;color:var(--accent);font-weight:600}

/* Supporting plant, instruments, and what ships out */
.pc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:0.75rem;margin-top:1rem}
.pc-card{background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:1.1rem 1.25rem}
.pc-card-name{font-size:12.5px;color:var(--fg);font-weight:500;margin-bottom:3px}
.pc-card-detail{font-size:11.5px;color:var(--muted);font-weight:300;line-height:1.6}
.pc-card-spec{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11.5px;color:var(--accent2);margin-top:5px;font-variant-numeric:tabular-nums}
@media(max-width:520px){
  .pc-sec{margin-top:3.5rem;padding-top:2.5rem}
  .cycle-wrap{padding:1rem 0.75rem 0.75rem}
}`;
if (!h.includes('.cycle-curve{')) {
  must(h.includes(CSS_ANCHOR), 'process-capabilities-title css anchor not found');
  h = h.replace(CSS_ANCHOR, CSS_ANCHOR + CSS);
}

/* ---------------------------------------------------------------- markup */
const eyebrow = (t) => `<div class="sec-eyebrow"><div class="sec-eyebrow-line"></div><span class="sec-eyebrow-text">${t}</span></div>`;

// Plot geometry: 0 C sits on the baseline, 1000 C at the top of the frame.
const X0 = 76, X1 = 968, YB = 320, YT = 44;
const y = (c) => +(YB - c * (YB - YT) / 1000).toFixed(1);
const GRID = [200, 400, 600, 800, 1000];
const PTS = [[76, 30], [300, 850], [470, 850], [520, 60], [565, 60], [700, 560], [855, 560], [968, 90]];
const PHASES = [['Ramp', 188], ['Soak', 385], ['Quench', 517], ['Temper', 710], ['Cool', 911]];
const DIVIDERS = [300, 470, 565, 855];

const curveD = PTS.map((pt, i) => `${i ? 'L' : 'M'}${pt[0]},${y(pt[1])}`).join(' ');

const CYCLE = `
  <div class="pc-sec" id="thermal-cycle">
    <div class="pc-head">
      ${eyebrow('Inside the furnace')}
      <div class="pc-title">A treatment is a sequence, not a heat.</div>
      <div class="pc-body">Hardening and tempering is a controlled path through temperature and time. Temperatures and hold times change with the grade and the section thickness; the stages do not. This is the shape of a typical cycle.</div>
    </div>
    <div class="cycle-wrap" id="cycleWrap">
      <svg class="cycle-svg" viewBox="0 0 1000 400" role="img" aria-label="Temperature against time for a typical hardening and tempering cycle: a ramp to around 850 degrees Celsius, a soak at temperature, an oil quench to near ambient, a ramp to around 560 degrees for tempering, a temper soak, then cooling in air.">
        ${GRID.map(c => `<line class="cycle-grid" x1="${X0}" y1="${y(c)}" x2="${X1}" y2="${y(c)}"/>`).join('\n        ')}
        ${GRID.map(c => `<text class="cycle-tick" x="${X0 - 10}" y="${y(c) + 4}" text-anchor="end">${c}</text>`).join('\n        ')}
        <text class="cycle-tick" x="${X0 - 10}" y="${YB + 4}" text-anchor="end">0</text>
        <line class="cycle-axis" x1="${X0}" y1="${YT - 8}" x2="${X0}" y2="${YB}"/>
        <line class="cycle-axis" x1="${X0}" y1="${YB}" x2="${X1}" y2="${YB}"/>
        <text class="cycle-tick" x="${X0 - 10}" y="${YT - 16}" text-anchor="end">°C</text>
        ${DIVIDERS.map(x => `<line class="cycle-phase-line cycle-fade" x1="${x}" y1="${YT - 8}" x2="${x}" y2="${YB}"/>`).join('\n        ')}
        <path class="cycle-curve" id="cycleCurve" d="${curveD}"/>
        <g class="cycle-fade">
          <circle class="cycle-dot" cx="385" cy="${y(850)}" r="3.5"/>
          <text class="cycle-anno" x="385" y="${y(850) - 26}" text-anchor="middle">Austenitising</text>
          <text class="cycle-anno-sub" x="385" y="${y(850) - 12}" text-anchor="middle">hold at temperature</text>
          <circle class="cycle-dot" cx="520" cy="${y(60)}" r="3.5"/>
          <path class="cycle-leader" d="M446,258 L470,258 L512,297"/>
          <text class="cycle-anno" x="440" y="249" text-anchor="end">Oil quench</text>
          <text class="cycle-anno-sub" x="440" y="263" text-anchor="end">30,000 litre tank</text>
          <circle class="cycle-dot" cx="777" cy="${y(560)}" r="3.5"/>
          <text class="cycle-anno" x="777" y="${y(560) - 26}" text-anchor="middle">Tempering</text>
          <text class="cycle-anno-sub" x="777" y="${y(560) - 12}" text-anchor="middle">hardness brought to spec</text>
        </g>
        ${PHASES.map(([label, x]) => `<text class="cycle-phase cycle-fade" x="${x}" y="${YB + 30}" text-anchor="middle">${label}</text>`).join('\n        ')}
        <text class="cycle-tick cycle-fade" x="${X1}" y="${YB + 56}" text-anchor="end">time →</text>
      </svg>
      <div class="cycle-legend">Illustrative. Your cycle is set at engineering review against the grade, section thickness and the specification you supply.</div>
    </div>
  </div>
`;

const FURNACES = [
  ['Pit furnace', 'Ø1300 × 1500 mm deep', '1200 °C', 'Electric', 3],
  ['Pit furnace', 'Ø900 × 1200 mm deep', '1200 °C', 'Electric', 1],
  ['Pit furnace', 'Ø800 × 1000 mm deep', '1200 °C', 'Electric', 4],
  ['Box furnace', '6000 × 2500 × 2000 mm', '1200 °C', 'Gas fired', 2],
  ['Box furnace', '1200 × 1200 × 2000 mm', '1200 °C', 'Gas fired', 5],
];
const PLANT = [
  ['Quench tank', 'Oil, for hardening and case work', '30,000 litres'],
  ['Overhead cranes', 'Electric travelling, two units', '5 tonne each'],
  ['Induction hardening machine', 'For shafts, journals and wear faces', 'Ø700 × 1500 mm'],
];

const CAPACITY = `
  <div class="pc-sec" id="capacity">
    <div class="pc-head">
      ${eyebrow('Plant and capacity')}
      <div class="pc-title">Will your part fit?</div>
      <div class="pc-body">Fifteen furnaces across five configurations. The largest box furnace takes components up to six metres long; the deepest pit furnace takes a metre and a half of vertical section.</div>
    </div>
    <div class="cap-scroll">
      <table class="cap-table">
        <thead><tr><th>Furnace</th><th>Working dimensions</th><th>Max temperature</th><th>Heating</th><th>Units</th></tr></thead>
        <tbody>
${FURNACES.map(([n, d, t, hh, u]) => `          <tr><td>${n}</td><td class="cap-dim">${d}</td><td class="cap-dim">${t}</td><td>${hh}</td><td class="cap-units">${u}</td></tr>`).join('\n')}
        </tbody>
      </table>
    </div>
    <div class="pc-grid">
${PLANT.map(([n, d, s]) => `      <div class="pc-card"><div class="pc-card-name">${n}</div><div class="pc-card-detail">${d}</div><div class="pc-card-spec">${s}</div></div>`).join('\n')}
    </div>
    <div class="pc-note">Working dimensions are the usable envelope inside the furnace. If your component is close to a limit, send the drawing and we will confirm before you ship.</div>
  </div>
`;

const INSTRUMENTS = [
  ['Universal testing machine', 'Tensile and mechanical property confirmation', '40 tonne'],
  ['Brinell hardness tester', 'Bulk hardness on castings and forgings', 'to 3 tonne'],
  ['Rockwell hardness tester', 'Hardness on finished and case-hardened work', 'to 500 kg'],
  ['Dynamic hardness testers', 'Portable verification on the floor, two units', 'DHT-6'],
  ['Poldi hardness tester', 'Portable comparison testing on large sections', ''],
  ['Ultrasonic flaw detector', 'Sub-surface defects and internal soundness', 'Einstein-II DGS'],
  ['Magnetic particle inspection', 'Surface and near-surface cracks in ferrous work', 'Magnaflux Y2'],
  ['Dye penetrant inspection', 'Surface-breaking defects on finished components', ''],
];

const TESTING = `
  <div class="pc-sec" id="instruments">
    <div class="pc-head">
      ${eyebrow('Test and validate')}
      <div class="pc-title">Every figure on a certificate traces back to an instrument.</div>
      <div class="pc-body">Hardness is checked on every batch. Non-destructive inspection is applied where your specification calls for it, in-house, on the equipment below.</div>
    </div>
    <div class="pc-grid">
${INSTRUMENTS.map(([n, d, s]) => `      <div class="pc-card"><div class="pc-card-name">${n}</div><div class="pc-card-detail">${d}</div>${s ? `<div class="pc-card-spec">${s}</div>` : ''}</div>`).join('\n')}
    </div>
  </div>
`;

const DELIVERABLES = [
  ['QA and test report', 'Measured hardness and the results of every test performed on the batch.'],
  ['Certificate of conformity', 'The treatment carried out, stated against the specification you supplied.'],
  ['Traceability record', 'The job card tying the batch to its furnace, cycle and operator.'],
];

const OUTPUT = `
  <div class="pc-sec" id="deliverables">
    <div class="pc-head">
      ${eyebrow('Certify and dispatch')}
      <div class="pc-title">What leaves with your parts.</div>
      <div class="pc-body">Treated components are only half of it. Every batch is released with the paperwork that lets you put it into production, and that record stays on file afterwards.</div>
    </div>
    <div class="pc-grid">
${DELIVERABLES.map(([n, d]) => `      <div class="pc-card"><div class="pc-card-name">${n}</div><div class="pc-card-detail">${d}</div></div>`).join('\n')}
    </div>
    <div class="pc-note">Need a specific certificate format, a witnessed test, or third-party inspection? Ask at enquiry and it is built into the job card.</div>
  </div>
`;

const INSERT_AT = '\n  <div class="process-capabilities">';
if (!h.includes('id="thermal-cycle"')) {
  must(h.includes(INSERT_AT), 'process-capabilities block not found');
  h = h.replace(INSERT_AT, '\n' + CYCLE + CAPACITY + TESTING + OUTPUT + INSERT_AT);
}

/* -------------------------------------------------------------------- JS */
const JS_MARK = '// Thermal cycle: draw the curve once it scrolls into view.';
const JS = `<script>
${JS_MARK}
// stroke-dashoffset only affects painting, so the draw stays off the main
// thread's layout work. Reduced motion gets the finished curve immediately.
(function(){
  var wrap = document.getElementById('cycleWrap');
  var curve = document.getElementById('cycleCurve');
  if (!wrap || !curve || !curve.getTotalLength) return;

  var len = curve.getTotalLength();
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (still) { wrap.classList.add('is-drawn'); return; }

  curve.style.strokeDasharray = len;
  curve.style.strokeDashoffset = len;

  function draw(){
    curve.style.transition = 'stroke-dashoffset 2.2s cubic-bezier(.22,.7,.3,1)';
    curve.style.strokeDashoffset = '0';
    // Labels and callouts arrive as the line reaches them rather than all at once.
    setTimeout(function(){ wrap.classList.add('is-drawn'); }, 700);
  }

  if ('IntersectionObserver' in window) {
    var seen = false;
    new IntersectionObserver(function(entries, o){
      entries.forEach(function(e){
        if (e.isIntersecting && !seen) { seen = true; draw(); o.disconnect(); }
      });
    }, { threshold: 0.25 }).observe(wrap);
  } else {
    draw();
  }
})();
</script>
`;
if (!h.includes(JS_MARK)) {
  const anchor = '<script>function toggleNav()';
  must(h.includes(anchor), 'toggleNav anchor not found');
  h = h.replace(anchor, JS + '\n' + anchor);
}

fs.writeFileSync(p, h);
console.log(`five stages deepened (${deepened} rewritten)`);
console.log('added: thermal cycle curve, furnace capacity table, instruments, deliverables');
console.log(`furnace stat now reads 15`);
