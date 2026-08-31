/**
 * Wires the eleven YouTube videos into their slots.
 *
 *   node tools/build-youtube.js public
 *
 * Nothing from YouTube loads until somebody presses play. Each box shows a
 * still image served from this domain, and the player iframe is built on click.
 * A plain embed would pull roughly a megabyte of Google script into the page on
 * load - ten of them on the services page - and would set tracking cookies on
 * every visitor whether or not they ever watched anything.
 *
 * The still is YouTube's own thumbnail, downloaded here and re-encoded, so even
 * that is not a third-party request.
 *
 * Idempotent: re-running rewrites the same markup and skips downloads it has.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const pubDir = process.argv[2] || 'public';
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'youtube.json'), 'utf8'));
const outDir = path.join(pubDir, 'img', 'video');
fs.mkdirSync(outDir, { recursive: true });

const must = (c, m) => { if (!c) throw new Error(m); };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// The box renders 572px wide, so 1280 covers a 2x display with room over.
const WIDTHS = [640, 1280];

/* ------------------------------------------------------------ thumbnails */
async function poster(id, slug) {
  const have = WIDTHS.every(w => fs.existsSync(path.join(outDir, `${slug}-${w}.webp`)));
  if (have) return 'cached';

  // maxres only exists if the upload was HD; hq always does.
  let buf = null, from = '';
  for (const name of ['maxresdefault', 'hqdefault']) {
    const r = await fetch(`https://img.youtube.com/vi/${id}/${name}.jpg`);
    if (!r.ok) continue;
    const b = Buffer.from(await r.arrayBuffer());
    // YouTube answers 200 with a small grey placeholder when a size is missing.
    if (b.length < 3000) continue;
    buf = b; from = name; break;
  }
  must(buf, `${slug}: no usable thumbnail for ${id}`);

  for (const w of WIDTHS) {
    const base = sharp(buf).resize({ width: w, withoutEnlargement: true, kernel: sharp.kernel.lanczos3 });
    await base.clone().webp({ quality: 90, effort: 5 }).toFile(path.join(outDir, `${slug}-${w}.webp`));
    await base.clone().jpeg({ quality: 88, chromaSubsampling: '4:4:4', mozjpeg: true, progressive: true })
      .toFile(path.join(outDir, `${slug}-${w}.jpg`));
  }
  return from;
}

/* ----------------------------------------------------------------- slots */
function mediaRange(html, slot) {
  let at;
  if (slot === 'about-story') {
    at = html.indexOf('<div class="about-story-media"');
  } else {
    const sec = html.indexOf(`id="${slot}"`);
    if (sec === -1) return null;
    at = html.indexOf('<div class="svc-detail-media"', sec);
  }
  if (at === -1) return null;
  // The About block sits two spaces shallower than the service blocks, so it
  // is not looking for the same closing string.
  const close = slot === 'about-story' ? '\n    </div>' : '\n      </div>';
  const end = html.indexOf(close, at);
  must(end !== -1, `${slot}: media block never closes`);
  return [at, end];
}

(async () => {
  /* --- CSS: the poster fills the box under the play button, the player over it */
  const CSS = '\n.video-poster{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;z-index:1}';
  for (const [file, anchor] of [
    ['services.html', '.svc-detail-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1}'],
    ['about.html',    '.about-story-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1}'],
  ]) {
    const p = path.join(pubDir, file);
    let h = fs.readFileSync(p, 'utf8');
    if (h.includes('.video-poster{')) continue;
    must(h.includes(anchor), `${file}: video css anchor not found`);
    fs.writeFileSync(p, h.replace(anchor, anchor + CSS));
    console.log(`  ${file} poster css added`);
  }

  /* --- one slot at a time */
  let wired = 0, kb = 0;
  for (const [slot, v] of Object.entries(cfg.videos)) {
    const slug = slot.replace(/^svc-/, '');
    const src = await poster(v.id, slug);
    kb += WIDTHS.reduce((a, w) => a + fs.statSync(path.join(outDir, `${slug}-${w}.webp`)).size / 1024, 0);

    const file = slot === 'about-story' ? 'about.html' : 'services.html';
    const p = path.join(pubDir, file);
    let h = fs.readFileSync(p, 'utf8');
    const range = mediaRange(h, slot);
    must(range, `${slot}: slot not found in ${file}`);
    let [start, end] = range;
    let block = h.slice(start, end);

    if (block.includes(`data-yt-id="${v.id}"`)) { console.log(`  ${slot.padEnd(26)} already wired`); continue; }

    // A previous video in this slot leaves its marker and poster behind.
    block = block.replace(/ data-yt-id="[^"]*"/, '').replace(/ data-yt-title="[^"]*"/, '')
                 .replace(/\n\s*<picture class="video-poster-pic">[\s\S]*?<\/picture>/, '');

    block = block.replace(/^<div class="(svc-detail-media|about-story-media)"/,
      `<div class="$1" data-yt-id="${v.id}" data-yt-title="${esc(v.title)}"`);

    const set = ext => WIDTHS.map(w => `img/video/${slug}-${w}.${ext} ${w}w`).join(', ');
    const sizes = '(max-width:860px) calc(100vw - 80px), 572px';
    const pic =
`\n        <picture class="video-poster-pic"><source type="image/webp" srcset="${set('webp')}" sizes="${sizes}"><img class="video-poster" src="img/video/${slug}-1280.jpg" srcset="${set('jpg')}" sizes="${sizes}" width="1280" height="720" alt="" loading="lazy" decoding="async"></picture>`;
    block = block.replace(/(\n\s*<video )/, pic + '$1');

    h = h.slice(0, start) + block + h.slice(end);
    fs.writeFileSync(p, h);
    wired++;
    console.log(`  ${slot.padEnd(26)} ${v.id}  poster from ${src}`);
  }

  console.log(`\n${wired} slot(s) wired, ${(kb / 1024).toFixed(2)} MB of posters generated`);
  console.log('nothing loads from YouTube until a visitor presses play');
})().catch(e => { console.error(e.message); process.exit(1); });
