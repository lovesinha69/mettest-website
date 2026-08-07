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
  { file: 'faq.html', name: 'FAQ', code: 'FAQ' },
];

// Shared regions are scoped to the files that actually contain them, which is
// NOT the same as the list of pages whose body copy is editable above.
//
// The nav and footer also appear on privacy, terms and 404. Those pages carry
// no editable marketing copy, but a nav or footer edit must still reach them or
// the site would drift out of sync. The enquiry modal, by contrast, only exists
// on the six pages that embed it — the FAQ page links to /contact instead.
const ALL_HTML = [
  'index.html', 'services.html', 'process.html', 'industries.html', 'about.html',
  'contact.html', 'faq.html', 'privacy.html', 'terms.html', '404.html',
];
const FORM_PAGES = ['index.html', 'services.html', 'process.html', 'industries.html', 'about.html', 'contact.html'];

// Regions duplicated verbatim on every page.
const SHARED_SELECTORS = [
  { sel: 'nav.nav', label: 'Navigation bar', pages: ALL_HTML },
  { sel: 'footer.footer', label: 'Footer', pages: ALL_HTML },
  { sel: '#contactModal', label: 'Enquiry form (pop-up)', pages: FORM_PAGES },
];

/** Files a shared region appears on. */
const filesFor = s => s.pages;

const SKIP_TAGS = new Set(['script', 'style', 'svg', 'noscript']);
const ATTRS = ['placeholder', 'alt', 'aria-label'];

const load = html => cheerio.load(html, { decodeEntities: false });
const norm = s => s.replace(/\s+/g, ' ').trim();

function inShared($, el) {
  return SHARED_SELECTORS.some(({ sel }) => $(el).closest(sel).length > 0);
}

const decodeEnts = s => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#3[49];/g, "'")
  .replace(/&amp;/g, '&');

/** Text of an element with <br> read as a space, so labels don't run words together. */
function labelText($sel) {
  if (!$sel.length) return '';
  const html = $sel.first().html() || '';
  return norm(decodeEnts(html.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')));
}

/**
 * Structured description of where a string lives.
 *
 * `section` is passed in rather than derived from ancestors: pages wrap their
 * sections inconsistently (.sec, .sec-alt, .sec-alt-inner, or nothing), and
 * several logical sections share one wrapper. The small eyebrow label above
 * each block is the reliable marker, so the walker tracks the most recent one.
 */
function describe($, el, section) {
  const $el = $(el);

  const cardEl = $el.closest('.svc-detail, .leader-card, .ind-card, .process-step, .stat, .contact-card, .cert-card, .value-card');
  const card = cardEl.length
    ? labelText(cardEl.find('.svc-detail-title, .leader-name, .ind-title, .process-name, h3, h4')).slice(0, 36) || null
    : null;

  const cls = ((el.attribs && el.attribs.class) || '').split(/\s+/)[0];
  const element = cls ? `${el.name}.${cls}` : el.name;

  return {
    section,
    card,
    element,
    where: [section, card, element].filter(Boolean).join(' › '),
  };
}

/**
 * Walks `root`, emitting one item per run of consecutive text/<br> children.
 * Returns items without IDs; the caller assigns those.
 */
function collect($, root, { skipShared = false } = {}) {
  const items = [];
  // Most recent section label seen in document order (see describe()).
  let section = null;

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
      ...describe($, parent, section),
    });
  };

  const walk = el => {
    // Guard on the tag name, not el.type: domhandler types <script> as 'script'
    // and <style> as 'style' rather than 'tag', so a type-gated check would let
    // their contents through as ordinary text.
    if (el.name && SKIP_TAGS.has(el.name)) return;

    if (el.type === 'tag') {
      if (skipShared && inShared($, el)) return;

      const classes = ((el.attribs && el.attribs.class) || '').split(/\s+/);
      if (classes.includes('sec-eyebrow-text') || classes.includes('hero-eyebrow-text')) {
        section = labelText($(el)) || section;
      }

      for (const a of ATTRS) {
        const v = el.attribs && el.attribs[a];
        if (v && /[A-Za-z0-9]/.test(v)) {
          items.push({
            kind: 'attr',
            attr: a,
            raw: v,
            text: norm(v),
            search: `${a}="${v}"`,
            ...describe($, el, section),
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
  // Extract each shared region separately, across only the files that carry it.
  const referenceBySel = new Map();   // sel -> reference items (from its first file)
  for (const s of SHARED_SELECTORS) {
    const files = filesFor(s);
    const perFile = new Map();
    for (const file of files) {
      const html = fs.readFileSync(path.join(dir, file), 'utf8');
      const $p = load(html);
      const root = $p(s.sel);
      if (!root.length) throw new Error(`${file}: shared selector not found: ${s.sel}`);
      const items = collect($p, root);
      items.forEach(i => { i.group = s.label; });
      indexOccurrences(items, html, file);
      perFile.set(file, items);
    }

    const ref = perFile.get(files[0]);
    for (const file of files.slice(1)) {
      const other = perFile.get(file);
      if (other.length !== ref.length) {
        throw new Error(`${file}: "${s.label}" has ${other.length} strings, ${files[0]} has ${ref.length}`);
      }
      other.forEach((it, i) => {
        if (it.text !== ref[i].text) {
          throw new Error(`${file}: "${s.label}" string ${i} differs — ${JSON.stringify(it.text)} vs ${JSON.stringify(ref[i].text)}`);
        }
      });
    }

    // Carry each file's anchor on the reference item, for write-back.
    ref.forEach((it, i) => {
      it.anchors = {};
      for (const file of files) {
        const o = perFile.get(file)[i];
        it.anchors[file] = { search: o.search, occurrence: o.occurrence };
      }
    });
    referenceBySel.set(s.sel, ref);
  }
  const reference = SHARED_SELECTORS.flatMap(s => referenceBySel.get(s.sel));

  for (const s of SHARED_SELECTORS) {
    groups.push({
      id: 'SHARED', scope: 'shared', label: s.label,
      files: filesFor(s),
      items: reference.filter(i => i.group === s.label),
    });
  }

  // ---- Per-page content ----
  for (const p of PAGES) {
    const html = fs.readFileSync(path.join(dir, p.file), 'utf8');
    const $ = load(html);

    const titleRaw = $('title').first().html();
    const items = [
      {
        // Show the title decoded ("&"), not as raw source ("&amp;"). cheerio
        // decodes text nodes but .html() does not, and write-back re-encodes —
        // so displaying the raw form would double-encode any edited title.
        kind: 'title', attr: null, raw: titleRaw, text: norm(decodeEnts(titleRaw)),
        search: `<title>${titleRaw}</title>`,
        section: null, card: null, element: 'title', where: 'Browser tab title',
        group: p.name,
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
