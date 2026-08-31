/**
 * Static audit of every page: structure, links, assets, metadata, a11y.
 * Reports only; fixes nothing.
 */
const fs = require('fs');
const path = require('path');

const DIR = 'public';
const pages = fs.readdirSync(DIR).filter(f => f.endsWith('.html')).sort();
const findings = [];
const add = (sev, page, what) => findings.push({ sev, page, what });

// Routes the site actually serves (extensionless, plus the .html forms)
const routes = new Set();
for (const p of pages) {
  routes.add(p);
  routes.add(p.replace(/\.html$/, ''));
}
routes.add('/'); routes.add('');

const html = {};
for (const p of pages) html[p] = fs.readFileSync(path.join(DIR, p), 'utf8');

for (const p of pages) {
  const h = html[p];

  /* ---- tag balance ---- */
  for (const t of ['div', 'section', 'p', 'span', 'a', 'button', 'ul', 'ol', 'li',
                   'picture', 'video', 'figure', 'table', 'tr', 'td', 'th', 'script',
                   'svg', 'form', 'label', 'select', 'textarea', 'h1', 'h2', 'h3']) {
    const o = (h.match(new RegExp(`<${t}\\b`, 'g')) || []).length;
    const c = (h.match(new RegExp(`</${t}>`, 'g')) || []).length;
    if (o !== c) add('ERROR', p, `<${t}> unbalanced: ${o} open / ${c} close`);
  }

  /* ---- duplicate ids ---- */
  const ids = [...h.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  const dupes = ids.filter((v, i) => ids.indexOf(v) !== i);
  [...new Set(dupes)].forEach(d => add('ERROR', p, `duplicate id "${d}"`));

  /* ---- headings ---- */
  const h1 = (h.match(/<h1\b/g) || []).length;
  if (h1 !== 1) add('ERROR', p, `${h1} <h1> elements (expected exactly 1)`);

  /* ---- inline JS parses ---- */
  for (const m of h.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
    try { new Function(m[1]); } catch (e) { add('ERROR', p, `inline script: ${e.message}`); }
  }
  /* ---- JSON-LD ---- */
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch (e) { add('ERROR', p, `JSON-LD: ${e.message}`); }
  }

  /* ---- internal links ---- */
  for (const m of h.matchAll(/href="([^"]+)"/g)) {
    const href = m[1];
    if (/^(https?:|mailto:|tel:|#|data:)/.test(href)) continue;
    const [file, frag] = href.split('#');
    if (file && !routes.has(file) && !fs.existsSync(path.join(DIR, file))) {
      add('ERROR', p, `link target missing: ${href}`);
      continue;
    }
    if (frag) {
      const target = file ? (routes.has(file + '.html') ? file + '.html' : file) : p;
      const th = html[target] || html[target + '.html'];
      if (th && !th.includes(`id="${frag}"`)) add('ERROR', p, `anchor not found: ${href}`);
    }
  }

  /* ---- asset references ---- */
  for (const m of h.matchAll(/(?:src|srcset)="([^"]+)"/g)) {
    for (const part of m[1].split(',')) {
      const u = part.trim().split(/\s+/)[0];
      if (!u || /^(https?:|data:|\/\/)/.test(u)) continue;
      if (!fs.existsSync(path.join(DIR, u))) add('ERROR', p, `asset missing: ${u}`);
    }
  }
  for (const m of h.matchAll(/url\(([^)]+)\)/g)) {
    const u = m[1].replace(/['"]/g, '').trim();
    if (!u || /^(https?:|data:)/.test(u)) continue;
    if (!fs.existsSync(path.join(DIR, u))) add('ERROR', p, `css asset missing: ${u}`);
  }

  /* ---- images ---- */
  for (const m of h.matchAll(/<img\b([^>]*)>/g)) {
    const tag = m[1];
    if (!/\salt=/.test(tag)) add('ERROR', p, `<img> without alt: ${tag.slice(0, 70)}`);
    if (!/\swidth=/.test(tag) || !/\sheight=/.test(tag)) {
      const src = (tag.match(/src="([^"]*)"/) || [])[1] || '?';
      add('WARN', p, `<img> without width/height (layout shift): ${src}`);
    }
  }

  /* ---- buttons and links need a name ---- */
  for (const m of h.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
    const [, attrs, inner] = m;
    const text = inner.replace(/<[^>]+>/g, '').trim();
    if (!text && !/aria-label=/.test(attrs)) add('ERROR', p, `<button> with no accessible name: ${attrs.slice(0, 60)}`);
  }
  for (const m of h.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
    const [, attrs, inner] = m;
    const text = inner.replace(/<[^>]+>/g, '').trim();
    if (!text && !/aria-label=/.test(attrs)) add('ERROR', p, `<a> with no accessible name: ${attrs.slice(0, 60)}`);
  }

  /* ---- form controls need labels ---- */
  for (const m of h.matchAll(/<(input|select|textarea)\b([^>]*)>/g)) {
    const attrs = m[2];
    const type = (attrs.match(/type="([^"]*)"/) || [])[1] || 'text';
    if (['hidden', 'submit', 'button'].includes(type)) continue;
    const id = (attrs.match(/id="([^"]*)"/) || [])[1];
    const labelled = id && h.includes(`for="${id}"`);
    if (!labelled && !/aria-label/.test(attrs)) add('ERROR', p, `<${m[1]}> unlabelled: ${attrs.slice(0, 60)}`);
  }

  /* ---- metadata ---- */
  const title = (h.match(/<title>([^<]*)<\/title>/) || [])[1];
  if (!title) add('ERROR', p, 'no <title>');
  else if (title.length > 65) add('WARN', p, `title ${title.length} chars (Google truncates ~60): ${title.slice(0, 50)}...`);
  const desc = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  if (!desc) add('ERROR', p, 'no meta description');
  else if (desc.length > 165) add('WARN', p, `meta description ${desc.length} chars (truncates ~160)`);
  if (!/rel="canonical"/.test(h)) add('WARN', p, 'no canonical link');
  if (!/name="viewport"/.test(h)) add('ERROR', p, 'no viewport meta');
  if (!/<html[^>]*\slang=/.test(h)) add('ERROR', p, 'no lang on <html>');
  if (!/<meta charset=/i.test(h)) add('ERROR', p, 'no charset');

  /* ---- stray placeholders / leftovers ---- */
  if (/TODO|FIXME|XXX|lorem ipsum/i.test(h)) add('WARN', p, 'placeholder text (TODO/lorem) present');
  if (/<!--\s*[A-Z][^>]{0,80}(name|placeholder|replace)[^>]*-->/i.test(h)) {
    const c = (h.match(/<!--[\s\S]*?-->/g) || []).filter(x => /replace|placeholder|your |TODO/i.test(x));
    c.forEach(x => add('WARN', p, `comment placeholder: ${x.replace(/\s+/g, ' ').slice(0, 90)}`));
  }
  if (/src=""|href=""/.test(h)) {
    const n = (h.match(/src=""|href=""/g) || []).length;
    add('WARN', p, `${n} empty src/href attribute(s) - browsers re-request the page for these`);
  }

  /* ---- encoding ---- */
  if (/â€|Ã©|Ã¢|â€™/.test(h)) add('ERROR', p, 'mojibake (double-encoded UTF-8)');
  const cr = (fs.readFileSync(path.join(DIR, p), 'latin1').match(/\r/g) || []).length;
  if (cr) add('ERROR', p, `${cr} CR bytes (CRLF) - breaks the copy tooling anchors`);
}

/* ---- cross-page consistency ---- */
const crypto = require('crypto');
const sha = s => crypto.createHash('sha1').update(s).digest('hex').slice(0, 10);
const region = (h, start, end) => { const i = h.indexOf(start); if (i === -1) return null; const j = h.indexOf(end, i); return j === -1 ? null : h.slice(i, j); };

for (const [name, start, end] of [
  ['nav', '<nav class="nav">', '</nav>'],
  ['footer', '<footer class="footer">', '</footer>'],
]) {
  const byHash = {};
  for (const p of pages) {
    const r = region(html[p], start, end);
    if (!r) { add('WARN', p, `no ${name} region`); continue; }
    (byHash[sha(r)] ||= []).push(p);
  }
  const groups = Object.entries(byHash);
  if (groups.length > 1) {
    // the active-page marker legitimately differs; compare with it stripped
    const norm = {};
    for (const p of pages) {
      const r = region(html[p], start, end);
      if (r) (norm[sha(r.replace(/ class="active"/g, ''))] ||= []).push(p);
    }
    if (Object.keys(norm).length > 1) {
      add('ERROR', 'ALL', `${name} differs across pages: ` +
        Object.values(norm).map(g => g.join('+')).join('  VS  '));
    }
  }
}

/* ---- sitemap ---- */
const smPath = path.join(DIR, 'sitemap.xml');
if (!fs.existsSync(smPath)) add('ERROR', 'sitemap.xml', 'missing');
else {
  const sm = fs.readFileSync(smPath, 'utf8');
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  const listed = new Set(locs.map(u => u.replace(/^https?:\/\/[^/]+\//, '').replace(/\/$/, '')));
  for (const p of pages) {
    const route = p.replace(/\.html$/, '');
    if (['404'].includes(route)) continue;
    const key = route === 'index' ? '' : route;
    if (!listed.has(key)) add('WARN', 'sitemap.xml', `does not list /${key}`);
  }
  for (const u of locs) if (!/^https:\/\/mettestlab\.com/.test(u)) add('ERROR', 'sitemap.xml', `odd URL: ${u}`);
}

/* ---- report ---- */
const errors = findings.filter(f => f.sev === 'ERROR');
const warns = findings.filter(f => f.sev === 'WARN');
for (const group of [['ERRORS', errors], ['WARNINGS', warns]]) {
  console.log(`\n=== ${group[0]} (${group[1].length}) ===`);
  if (!group[1].length) console.log('  none');
  for (const f of group[1]) console.log(`  [${f.page}] ${f.what}`);
}
console.log(`\n${pages.length} pages audited`);
