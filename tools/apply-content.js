/**
 * Applies edited copy back into the HTML.
 *
 *   node tools/apply-content.js <publicDir> <edits.json> [--dry-run]
 *
 * `edits.json` is { "<ID>": "<new text>" } using the IDs from the review
 * document. IDs are re-derived from the current HTML on every run, so the map
 * is never stale — but that also means the HTML must not have been restructured
 * between exporting the document and applying it.
 *
 * Edits are located as byte ranges against the original file text and then
 * spliced back-to-front, so two edits sharing the same anchor string cannot
 * shift each other's positions.
 */
const fs = require('fs');
const path = require('path');
const { extract, BR } = require('./extract-content.js');

const escapeText = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttr = s => escapeText(s).replace(/"/g, '&quot;');

/** Byte offset of the nth (0-based) occurrence of `needle`, or -1. */
function nthIndexOf(hay, needle, n) {
  let i = -1;
  for (let k = 0; k <= n; k++) {
    i = hay.indexOf(needle, i + 1);
    if (i === -1) return -1;
  }
  return i;
}

/** Rebuild an item's source form from the edited text. */
function renderReplacement(item, newText) {
  if (item.kind === 'attr') {
    return `${item.attr}="${escapeAttr(newText)}"`;
  }
  if (item.kind === 'title') {
    return `<title>${escapeText(newText)}</title>`;
  }
  // Text run: keep the source's surrounding whitespace so indentation survives.
  const lead = (item.raw.match(/^\s*/) || [''])[0];
  const trail = (item.raw.match(/\s*$/) || [''])[0];
  // Split on the literal marker (it contains regex metacharacters, so no RegExp).
  const body = escapeText(newText)
    .split(BR)
    .map(s => s.trim())
    .join('<br>');
  return `>${lead}${body}${trail}<`;
}

function main() {
  const dir = process.argv[2];
  const editsPath = process.argv[3];
  const dryRun = process.argv.includes('--dry-run');

  const edits = JSON.parse(fs.readFileSync(editsPath, 'utf8'));
  const groups = extract(dir);

  const byId = new Map();
  for (const g of groups) for (const it of g.items) byId.set(it.id, it);

  const unknown = Object.keys(edits).filter(id => !byId.has(id));
  if (unknown.length) throw new Error(`unknown IDs: ${unknown.join(', ')}`);

  // Bucket planned splices per file.
  const planned = new Map(); // file -> [{start,end,replacement,id}]
  let changed = 0, skipped = 0;

  for (const [id, newTextRaw] of Object.entries(edits)) {
    const item = byId.get(id);
    const newText = String(newTextRaw).replace(/\s+/g, ' ').trim();
    if (newText === item.text) { skipped++; continue; }
    if (!newText) throw new Error(`${id}: empty replacement text — refusing to blank a string`);
    changed++;

    for (const [file, anchor] of Object.entries(item.anchors)) {
      const full = path.join(dir, file);
      const text = fs.readFileSync(full, 'utf8');
      const start = nthIndexOf(text, anchor.search, anchor.occurrence);
      if (start === -1) throw new Error(`${id}: anchor not found in ${file}`);
      if (!planned.has(file)) planned.set(file, []);
      planned.get(file).push({
        start,
        end: start + anchor.search.length,
        replacement: renderReplacement(item, newText),
        id,
        before: item.text,
        after: newText,
      });
    }
  }

  const summary = [];
  for (const [file, splices] of planned) {
    splices.sort((a, b) => a.start - b.start);
    for (let i = 1; i < splices.length; i++) {
      if (splices[i].start < splices[i - 1].end) {
        throw new Error(`${file}: overlapping edits (${splices[i - 1].id} / ${splices[i].id})`);
      }
    }
    const full = path.join(dir, file);
    let text = fs.readFileSync(full, 'utf8');
    for (const s of [...splices].reverse()) {
      text = text.slice(0, s.start) + s.replacement + text.slice(s.end);
    }
    if (!dryRun) fs.writeFileSync(full, text, 'utf8');
    summary.push(`  ${file.padEnd(17)} ${splices.length} edit(s)`);
  }

  console.log(`${dryRun ? '[dry run] ' : ''}${changed} string(s) changed, ${skipped} unchanged`);
  console.log(summary.join('\n') || '  (no files touched)');
  for (const [, splices] of planned) {
    for (const s of splices) {
      console.log(`   ${s.id}: ${JSON.stringify(s.before.slice(0, 60))} -> ${JSON.stringify(s.after.slice(0, 60))}`);
    }
    break; // one file's worth is enough detail; shared edits repeat per file
  }
}

if (require.main === module) main();
module.exports = { renderReplacement, nthIndexOf };
