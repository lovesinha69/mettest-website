/**
 * Wires Cloudflare Stream videos into their slots.
 *
 *   node tools/apply-stream.js <publicDir>
 *
 * Reads tools/stream.json and, for every slot with a uid, marks that media
 * block with data-stream-uid and drops in Stream's own generated thumbnail as
 * the still shown before Play is pressed. The click handler in the pages turns
 * that into a player on click.
 *
 * Slots with an empty uid are left alone, so this can be run repeatedly as
 * videos arrive one at a time. It is also idempotent: re-running with the same
 * config changes nothing.
 */
const fs = require('fs');
const path = require('path');

const dir = process.argv[2];
if (!dir) { console.error('usage: node tools/apply-stream.js <publicDir>'); process.exit(1); }

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'stream.json'), 'utf8'));
const code = (cfg.customerCode || '').trim();

const filled = Object.entries(cfg.videos).filter(([, v]) => (v.uid || '').trim());
if (!code) {
  console.error('stream.json has no customerCode yet - nothing to wire in.');
  console.error('Find it in the Stream dashboard: embed URLs read customer-<CODE>.cloudflarestream.com');
  process.exit(1);
}
if (!filled.length) { console.error('stream.json has no video uids yet - nothing to wire in.'); process.exit(1); }

/** Byte range of the media block belonging to `slot`. */
function mediaRange(html, slot) {
  let anchor;
  if (slot === 'about-story') {
    anchor = html.indexOf('<div class="about-story-media"');
  } else {
    // The media block is the first one inside the section carrying this id.
    const sec = html.indexOf(`id="${slot}"`);
    if (sec === -1) return null;
    anchor = html.indexOf('<div class="svc-detail-media"', sec);
  }
  if (anchor === -1) return null;
  const end = html.indexOf('\n      </div>', anchor);
  if (end === -1) throw new Error(`${slot}: media block never closes`);
  return [anchor, end];
}

// --- data-stream-code on <html>, so the handler can build embed URLs.
let codeApplied = 0;
for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.html'))) {
  const p = path.join(dir, file);
  let h = fs.readFileSync(p, 'utf8');
  const want = `<html lang="en" data-stream-code="${code}">`;
  if (h.includes(want)) continue;
  const existing = h.match(/<html lang="en"[^>]*>/);
  if (!existing) throw new Error(`${file}: <html> tag not found`);
  h = h.replace(existing[0], want);
  fs.writeFileSync(p, h);
  codeApplied++;
}
console.log(`customer code applied to ${codeApplied} page(s)`);

// --- one slot at a time
let wired = 0;
for (const [slot, v] of filled) {
  const file = slot === 'about-story' ? 'about.html' : 'services.html';
  const p = path.join(dir, file);
  let h = fs.readFileSync(p, 'utf8');

  const range = mediaRange(h, slot);
  if (!range) { console.log(`  ${slot.padEnd(28)} SLOT NOT FOUND in ${file}`); continue; }
  let [start, end] = range;
  let block = h.slice(start, end);

  if (block.includes(`data-stream-uid="${v.uid}"`)) {
    console.log(`  ${slot.padEnd(28)} already wired`);
    continue;
  }
  if (block.includes('data-stream-uid=')) {
    // A different video was here before; drop the old marker and poster.
    block = block.replace(/ data-stream-uid="[^"]*"/, '').replace(/ data-stream-title="[^"]*"/, '');
    block = block.replace(/\n\s*<img class="stream-poster"[^>]*>/, '');
  }

  const title = (v.title || 'Met-Test Laboratories video').replace(/"/g, '&quot;');
  block = block.replace(
    /^<div class="(svc-detail-media|about-story-media)"/,
    `<div class="$1" data-stream-uid="${v.uid}" data-stream-title="${title}"`
  );

  // Stream generates the still for us, so there is no poster file to manage.
  const poster = `\n        <img class="stream-poster" src="https://customer-${code}.cloudflarestream.com/${v.uid}/thumbnails/thumbnail.jpg?time=3s&amp;height=600" alt="" loading="lazy" decoding="async">`;
  block = block.replace(/(\n\s*<video )/, poster + '$1');

  h = h.slice(0, start) + block + h.slice(end);
  fs.writeFileSync(p, h);
  wired++;
  console.log(`  ${slot.padEnd(28)} -> ${v.uid}`);
}

// --- the poster sits above the placeholder gradient, below the player.
const CSS = '\n.stream-poster{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1;display:block}';
for (const [file, anchor] of [
  ['services.html', '.stream-frame{position:absolute;inset:0;width:100%;height:100%;border:0;z-index:3}'],
  ['about.html',    '.stream-frame{position:absolute;inset:0;width:100%;height:100%;border:0;z-index:3}'],
]) {
  const p = path.join(dir, file);
  let h = fs.readFileSync(p, 'utf8');
  if (h.includes('.stream-poster{')) continue;
  if (!h.includes(anchor)) throw new Error(`${file}: stream-frame css missing - run the handler update first`);
  fs.writeFileSync(p, h.replace(anchor, anchor + CSS));
  console.log(`  ${file} stream-poster css added`);
}

console.log(`\n${wired} slot(s) wired to Cloudflare Stream.`);
