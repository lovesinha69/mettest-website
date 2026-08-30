/**
 * Builds the revolving photo strip on the About page.
 *
 *   node tools/build-about-gallery.js "<sourceDir>" public
 *
 * Every image in <sourceDir> becomes one thumbnail, in filename order. Each is
 * produced twice:
 *
 *   480px square  the thumbnail - the strip renders it at 137px, so this
 *                 stays sharp past a 3x display
 *   1600px long   the enlarged view opened on click, uncropped
 *
 * Alt text comes from the filename, so name the files for what they show
 * ("furnace-line.jpg" -> "Furnace line"). tools/about-gallery-captions.json can
 * override any of them.
 *
 * With more than four photos the strip becomes a carousel and the photos are
 * emitted twice so the loop has no seam. With four or fewer it stays the static
 * grid, because a carousel that never leaves the screen only jitters.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const srcDir = process.argv[2];
const pubDir = process.argv[3];
if (!srcDir || !pubDir) { console.error('usage: node tools/build-about-gallery.js "<sourceDir>" <publicDir>'); process.exit(1); }

const outDir = path.join(pubDir, 'img', 'gallery');
fs.mkdirSync(outDir, { recursive: true });

const CAPTIONS = (() => {
  const f = path.join(__dirname, 'about-gallery-captions.json');
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {};
})();

// The strip renders a thumb at 137px on desktop but only 68px on a phone, so
// two widths are produced and the browser takes the one that fits. One size
// would mean phones downloading four times the pixels they can show.
const THUMBS = [240, 480];
const THUMB = 480;
// The viewer shows a photo up to ~1100px wide, so 1600 would be under-resolved
// on a 2x display. 2400 covers it with headroom; it is only ever fetched when
// somebody actually clicks a thumbnail.
const FULL = 2400;
const SPEED = 35;    // pixels per second the strip travels

const slugify = s => s.toLowerCase().replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const titleise = s => {
  const t = s.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

(async () => {
  const files = fs.readdirSync(srcDir)
    .filter(f => /\.(jpe?g|png|webp|tiff?)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  if (!files.length) throw new Error(`no images found in ${srcDir}`);

  const photos = [];
  let bytes = 0;

  for (const file of files) {
    const slug = slugify(file);
    const entry = CAPTIONS[file] || CAPTIONS[slug];
    const alt = (typeof entry === 'string' ? entry : entry && entry.alt) || titleise(file);
    // `attention` frames most photos well, but it chases brightness - a lit
    // background can pull the crop off the subject - so a crop can be given.
    const crop = entry && entry.crop;
    const src = path.join(srcDir, file);

    // Square thumbnail. `attention` picks the busiest region rather than the
    // middle, which frames machinery and faces far better than a centre crop.
    // Explicit crops are fractions of the upright image.
    let region = null;
    if (crop) {
      const m0 = await sharp(src).rotate().resize(20000, null, { withoutEnlargement: true }).toBuffer({ resolveWithObject: true }).then(r => r.info);
      const W = m0.width, H = m0.height;
      const side = Math.min(Math.round(crop.side * Math.min(W, H)), W, H);
      region = { width: side, height: side,
                 left: Math.max(0, Math.min(Math.round(crop.left * W), W - side)),
                 top:  Math.max(0, Math.min(Math.round(crop.top  * H), H - side)) };
    }

    for (const w of THUMBS) {
      const t = region
        ? sharp(src).rotate().extract(region).resize(w, w, { kernel: sharp.kernel.lanczos3 })
        : sharp(src).rotate().resize(w, w, { fit: 'cover', position: sharp.strategy.attention, kernel: sharp.kernel.lanczos3 });
      await t.clone().webp({ quality: 92, effort: 5 }).toFile(path.join(outDir, `${slug}-${w}.webp`));
      await t.clone().jpeg({ quality: 90, chromaSubsampling: '4:4:4', mozjpeg: true, progressive: true }).toFile(path.join(outDir, `${slug}-${w}.jpg`));
    }

    // Full view, uncropped, never upscaled.
    const f = sharp(src).rotate().resize({ width: FULL, height: FULL, fit: 'inside', withoutEnlargement: true, kernel: sharp.kernel.lanczos3 });
    await f.clone().jpeg({ quality: 90, chromaSubsampling: '4:4:4', mozjpeg: true, progressive: true }).toFile(path.join(outDir, `${slug}-${FULL}.jpg`));
    await f.clone().webp({ quality: 92, effort: 5 }).toFile(path.join(outDir, `${slug}-${FULL}.webp`));

    const kb = n => fs.statSync(path.join(outDir, n)).size / 1024;
    bytes += THUMBS.reduce((a,w)=>a+kb(`${slug}-${w}.webp`)+kb(`${slug}-${w}.jpg`),0) + kb(`${slug}-${FULL}.jpg`) + kb(`${slug}-${FULL}.webp`);
    photos.push({ slug, alt });
    console.log(`  ${file.padEnd(34)} -> ${slug}  thumb ${kb(`${slug}-240.webp`).toFixed(0)}/${kb(`${slug}-480.webp`).toFixed(0)}KB  full ${kb(`${slug}-${FULL}.webp`).toFixed(0)}KB webp / ${kb(`${slug}-${FULL}.jpg`).toFixed(0)}KB jpg`);
  }

  // --- markup
  const carousel = photos.length > 4;
  // Measured: a thumb is 137px on desktop and a quarter of the strip below that.
  const SIZES = '(max-width:860px) calc(25vw - 26px), 137px';
  const srcset = (p, ext) => THUMBS.map(w => `img/gallery/${p.slug}-${w}.${ext} ${w}w`).join(', ');
  // Clones are hidden from assistive tech, so they must also be unreachable by
  // keyboard - a focusable element inside aria-hidden is an ARIA violation, and
  // it would make a keyboard user tab through every photo twice.
  const thumb = (p, i, clone) =>
`<button class="about-photo-thumb" type="button"${clone ? ' tabindex="-1"' : ''} data-index="${i}" data-full="img/gallery/${p.slug}-${FULL}.webp" data-full-jpg="img/gallery/${p.slug}-${FULL}.jpg" data-alt="${esc(p.alt)}" aria-label="Enlarge photo: ${esc(p.alt)}">
            <picture><source type="image/webp" srcset="${srcset(p,'webp')}" sizes="${SIZES}"><img src="img/gallery/${p.slug}-${THUMB}.jpg" srcset="${srcset(p,'jpg')}" sizes="${SIZES}" width="${THUMB}" height="${THUMB}" alt="${clone ? '' : esc(p.alt)}" loading="lazy" decoding="async"></picture>
          </button>`;

  const once = photos.map((p, i) => thumb(p, i, false)).join('\n          ');
  // A second copy of the same photos is what makes the loop seamless.
  const track = carousel
    ? `${once}\n          <span class="about-photo-clones" aria-hidden="true" style="display:contents">${photos.map((p, i) => thumb(p, i, true)).join('\n          ')}</span>`
    : once;

  const seconds = Math.round(photos.length * 145 / SPEED);
  const stripOpen = carousel
    ? `<div class="about-photo-strip is-carousel" id="aboutGallery" style="--revolve:${seconds}s">`
    : `<div class="about-photo-strip" id="aboutGallery">`;

  const p = path.join(pubDir, 'about.html');
  let h = fs.readFileSync(p, 'utf8');
  const startRe = /<div class="about-photo-strip[^>]*id="aboutGallery"[^>]*>/;
  if (!startRe.test(h)) throw new Error('about.html: gallery strip not found - run the carousel install first');
  const start = h.search(startRe);
  // The strip's own closing tag, at six spaces of indent. The track inside it
  // closes at eight and the thumbnails at ten, so this matches only the strip.
  const endMark = '\n      </div>';
  const closeAt = h.indexOf(endMark, start);
  if (closeAt === -1) throw new Error('about.html: gallery strip never closes');
  const end = closeAt + endMark.length;

  h = h.slice(0, start)
    + stripOpen + '\n        <div class="about-photo-track">\n          ' + track + '\n        </div>\n      </div>'
    + h.slice(end);
  fs.writeFileSync(p, h);

  console.log(`\n${photos.length} photo(s), ${(bytes / 1024).toFixed(1)} MB generated`);
  console.log(carousel
    ? `strip revolves: one full cycle every ${seconds}s`
    : `strip stays a static grid (a carousel needs more than four photos)`);
  const sum = (w) => photos.reduce((a, p) => a + fs.statSync(path.join(outDir, `${p.slug}-${w}.webp`)).size / 1024, 0);
  console.log(`thumbnails per view: ~${sum(240).toFixed(0)} KB on a phone, ~${sum(480).toFixed(0)} KB on a 2x desktop`);
})().catch(e => { console.error(e.message); process.exit(1); });
