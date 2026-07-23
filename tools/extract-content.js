/**
 * Extracts every visitor-facing string from the site into a stable, ordered map.
 *
 * The same walk builds the review .docx and applies edits back, so IDs are
 * deterministic: they come from document order, not a stored counter.
 *
 * Write-back is done by exact string replacement on the raw file text, never by
 * re-serialising the DOM — cheerio does not round-trip these files byte-for-byte
 * (it rewrites void tags and attribute quoting), which would produce a huge
 * spurious diff on every edit. Each item therefore carries a `search` string
 * that appears verbatim in the source, plus which occurrence of it to replace.
 *
 * Text split by <br> inside one element is merged into a single editable string
 * with the line breaks shown as ⏎, so headings read as one line in the document.
 *
 *   node tools/extract-content.js <publicDir> [outJson]
 */
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Marker shown in the review document where the HTML has a <br>. Deliberately
// plain ASCII: arrow glyphs render as boxes in some Word fonts.
const BR = '[br]';

const PAGES = [
  { file: 'index.html', name: 'Home', code: 'HOME' },
  { file: 'services.html', name: 'Services', code: 'SVC' },
  { file: 'process.html', name: 'Process', code: 'PROC' },
  { file: 'industries.html', name: 'Industries', code: 'IND' },
  { file: 'about.html', name: 'About', code: 'ABOUT' },
  { file: 'contact.html', name: 'Contact', code: 'CONTACT' },
];

// Regions duplicated verbatim on every page.
const SHARED_SELECTORS = [
  { sel: 'nav.nav', label: 'Navigation bar' },
  { sel: 'footer.footer', label: 'Footer' },
  { sel: '#contactModal', label: 'Enquiry form (pop-up)' },
];

const SKIP_TAGS = new Set(['script', 'style', 'svg', 'noscript']);
const ATTRS = ['placeholder', 'alt', 'aria-label'];

const load = html => cheerio.load(html, { decodeEntities: false });
const norm = s => s.replace(/\s+/g, ' ').trim();

function inShared($, el) {
  return SHARED_SELECTORS.some(({ sel }) => $(el).closest(sel).length > 0);
}

/** Human-readable label for where a string lives. */
function describe($, el) {
  const parts = [];
  const $el = $(el);

  const sec = $el.closest('.sec, .hero');
  const secTitle = norm(sec.find('.sec-title, h1, h2').first().text());
  if (secTitle) parts.push(secTitle.slice(0, 44));

  const card = $el.closest('.svc-detail, .leader-card, .ind-card, .process-step, .stat, .contact-card, .cert-card, .value-card');
  if (card.length) {
    const t = norm(card.find('.svc-detail-title, .leader-name, .ind-title, .process-name, h3, h4').first().text());
    if (t) parts.push(t.slice(0, 36));
  }

  const cls = ((el.attribs && el.attribs.class) || '').split(/\s+/)[0];
  parts.push(cls ? `${el.name}.${cls}` : el.name);
  return parts.join(' › ');
}

/**
 * Walks `root`, emitting one item per run of consecutive text/<br> children.
 * Returns items without IDs; the caller assigns those.
 */
function collect($, root, { skipShared = false } = {}) {
  const items = [];

  const emitRun = (run, parent) => {
    const rawParts = run.map(n => (n.type === 'text' ? n.data : $.html(n)));
    const raw = rawParts.join('');
    if (!/[A-Za-z0-9]/.test(raw)) return; // whitespace / punctuation only

    // Displayed form: <br> becomes a visible marker, whitespace collapses.
    const display = norm(
      rawParts.map(p => (/^<br\s*\/?>$/i.test(p.trim()) ? ` ${BR} ` : p)).join('')
    );
    if (!display) return;

    items.push({
      kind: 'text',
      attr: null,
      raw,
      text: display,
      search: `>${raw}<`,
      where: describe($, parent),
    });
  };

  const walk = el => {
    if (el.type === 'tag') {
      if (SKIP_TAGS.has(el.name)) return;
      if (skipShared && inShared($, el)) return;
      for (const a of ATTRS) {
        const v = el.attribs && el.attribs[a];
        if (v && /[A-Za-z0-9]/.test(v)) {
          items.push({
            kind: 'attr',
            attr: a,
            raw: v,
            text: norm(v),
            search: `${a}="${v}"`,
            where: describe($, el),
          });
        }
      }
    }

    const kids = el.children || [];
    let run = [];
    for (const c of kids) {
      const isRunNode = c.type === 'text' || (c.type === 'tag' && c.name === 'br');
      if (isRunNode) {
        run.push(c);
        continue;
      }
      if (run.length) { emitRun(run, el); run = []; }
      walk(c);
    }
    if (run.length) emitRun(run, el);
  };

  const rootEl = root[0];
  if (rootEl) walk(rootEl);
  return items;
}

/**
 * cheerio decodes entities when reading node data even with decodeEntities:false,
 * so a string it hands back may not appear literally in the source (`&` vs
 * `&amp;`). Try the plausible source spellings and keep whichever is really there.
 */
function candidates(search) {
  const enc = search.replace(/&(?!amp;|lt;|gt;|quot;|#\d+;)/g, '&amp;');
  return enc === search ? [search] : [enc, search];
}

/** Number of times `needle` appears in `hay` before offset `end`. */
function countBefore(hay, needle, end) {
  let n = 0, i = 0;
  for (;;) {
    i = hay.indexOf(needle, i);
    if (i === -1 || i >= end) return n;
    n++; i += needle.length;
  }
}

/**
 * Assign each item the occurrence index of its anchor within the file.
 *
 * The index must be counted against real positions in the file, not against the
 * sequence of collected items: when only part of the page is collected (the
 * shared regions), page content in between also contributes occurrences and
 * would otherwise shift every later index. Items arrive in document order, so
 * a forward-only cursor locates each one unambiguously.
 */
function indexOccurrences(items, fileText, label) {
  let cursor = 0;
  for (const it of items) {
    let resolved = null, at = -1;
    for (const c of candidates(it.search)) {
      const i = fileText.indexOf(c, cursor);
      if (i !== -1) { resolved = c; at = i; break; }
    }
    if (resolved === null) {
      throw new Error(
        `${label}: no anchor found at or after offset ${cursor} for ${JSON.stringify(it.search.slice(0, 90))}`
      );
    }
    it.search = resolved;
    it.offset = at;
    it.occurrence = countBefore(fileText, resolved, at);
    cursor = at + resolved.length;
  }
}

function extract(dir) {
  const groups = [];
  const firstFile = PAGES[0].file;
  const firstHtml = fs.readFileSync(path.join(dir, firstFile), 'utf8');
  const $first = load(firstHtml);

  // ---- Shared regions ----
  // A shared string's occurrence index differs per page: page content sitting
  // between the nav and the footer can repeat the same string, shifting it. So
  // resolve anchors separately against every file rather than reusing the
  // first page's indices, and confirm the regions really are identical.
  const sharedByFile = new Map();
  for (const p of PAGES) {
    const html = fs.readFileSync(path.join(dir, p.file), 'utf8');
    const $p = load(html);
    const items = [];
    for (const { sel, label } of SHARED_SELECTORS) {
      const root = $p(sel);
      if (!root.length) throw new Error(`${p.file}: shared selector not found: ${sel}`);
      collect($p, root).forEach(i => { i.group = label; items.push(i); });
    }
    indexOccurrences(items, html, p.file);
    sharedByFile.set(p.file, items);
  }

  const reference = sharedByFile.get(firstFile);
  for (const p of PAGES.slice(1)) {
    const other = sharedByFile.get(p.file);
    if (other.length !== reference.length) {
      throw new Error(`${p.file}: shared regions have ${other.length} strings, ${firstFile} has ${reference.length}`);
    }
    other.forEach((it, i) => {
      if (it.text !== reference[i].text) {
        throw new Error(`${p.file}: shared string ${i} differs — ${JSON.stringify(it.text)} vs ${JSON.stringify(reference[i].text)}`);
      }
    });
  }

  // Carry every file's anchor on the reference item, for write-back.
  reference.forEach((it, i) => {
    it.anchors = {};
    for (const p of PAGES) {
      const o = sharedByFile.get(p.file)[i];
      it.anchors[p.file] = { search: o.search, occurrence: o.occurrence };
    }
  });

  for (const { label } of SHARED_SELECTORS) {
    groups.push({
      id: 'SHARED', scope: 'shared', label,
      files: PAGES.map(p => p.file),
      items: reference.filter(i => i.group === label),
    });
  }

  // ---- Per-page content ----
  for (const p of PAGES) {
    const html = fs.readFileSync(path.join(dir, p.file), 'utf8');
    const $ = load(html);

    const titleRaw = $('title').first().html();
    const items = [
      {
        kind: 'title', attr: null, raw: titleRaw, text: norm(titleRaw),
        search: `<title>${titleRaw}</title>`, where: 'Browser tab title', group: p.name,
      },
      ...collect($, $('body'), { skipShared: true }).map(i => ({ ...i, group: p.name })),
    ];
    indexOccurrences(items, html, p.file);
    items.forEach(i => { i.anchors = { [p.file]: { search: i.search, occurrence: i.occurrence } }; });
    groups.push({ id: p.code, scope: 'page', label: p.name, files: [p.file], items });
  }

  // ---- Deterministic IDs ----
  let n = 0;
  for (const g of groups) if (g.scope === 'shared') g.items.forEach(i => { i.id = `SHARED-${String(++n).padStart(3, '0')}`; });
  for (const g of groups) if (g.scope === 'page') g.items.forEach((i, k) => { i.id = `${g.id}-${String(k + 1).padStart(3, '0')}`; });

  return groups;
}

function main() {
  const dir = process.argv[2];
  const outJson = process.argv[3];
  const groups = extract(dir);
  const total = groups.reduce((a, g) => a + g.items.length, 0);
  if (outJson) fs.writeFileSync(outJson, JSON.stringify({ generated: new Date().toISOString(), groups }, null, 2), 'utf8');
  console.log(`Extracted ${total} strings — all search anchors verified present in source`);
  for (const g of groups) console.log(`  ${String(g.items.length).padStart(4)}  ${g.scope === 'shared' ? '[shared] ' : ''}${g.label}`);
}

if (require.main === module) main();
module.exports = { extract, PAGES, SHARED_SELECTORS, BR };
