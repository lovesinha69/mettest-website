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

const THUMB = 480;   // rendered at 137px, so good past 3x
const FULL = 1600;   // the enlarged view
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
    const alt = CAPTIONS[file] || CAPTIONS[slug] || titleise(file);
    const src = path.join(srcDir, file);

    // Square thumbnail. `attention` picks the busiest region rather than the
    // middle, which frames machinery and faces far better than a centre crop.
    const t = sharp(src).rotate().resize(THUMB, THUMB, { fit: 'cover', position: sharp.strategy.attention, kernel: sharp.kernel.lanczos3 });
    await t.clone().webp({ quality: 92, effort: 5 }).toFile(path.join(outDir, `${slug}-${THUMB}.webp`));
    await t.clone().jpeg({ quality: 90, chromaSubsampling: '4:4:4', mozjpeg: true, progressive: true }).toFile(path.join(outDir, `${slug}-${THUMB}.jpg`));

    // Full view, uncropped, never upscaled.
    const f = sharp(src).rotate().resize({ width: FULL, height: FULL, fit: 'inside', withoutEnlargement: true, kernel: sharp.kernel.lanczos3 });
    await f.clone().jpeg({ quality: 90, chromaSubsampling: '4:4:4', mozjpeg: true, progressive: true }).toFile(path.join(outDir, `${slug}-${FULL}.jpg`));

    const kb = n => fs.statSync(path.join(outDir, n)).size / 1024;
    bytes += kb(`${slug}-${THUMB}.webp`) + kb(`${slug}-${THUMB}.jpg`) + kb(`${slug}-${FULL}.jpg`);
    photos.push({ slug, alt });
    console.log(`  ${file.padEnd(34)} -> ${slug}  thumb ${kb(`${slug}-${THUMB}.webp`).toFixed(0)}KB  full ${kb(`${slug}-${FULL}.jpg`).toFixed(0)}KB`);
  }

  // --- markup
  const carousel = photos.length > 4;
  // Clones are hidden from assistive tech, so they must also be unreachable by
  // keyboard - a focusable element inside aria-hidden is an ARIA violation, and
  // it would make a keyboard user tab through every photo twice.
  const thumb = (p, i, clone) =>
`<button class="about-photo-thumb" type="button"${clone ? ' tabindex="-1"' : ''} data-index="${i}" data-full="img/gallery/${p.slug}-${FULL}.jpg" data-alt="${esc(p.alt)}" aria-label="Enlarge photo: ${esc(p.alt)}">
            <picture><source type="image/webp" srcset="img/gallery/${p.slug}-${THUMB}.webp"><img src="img/gallery/${p.slug}-${THUMB}.jpg" width="${THUMB}" height="${THUMB}" alt="${clone ? '' : esc(p.alt)}" loading="lazy" decoding="async"></picture>
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
  const endMark = '\n      <div class="about-photo-caption">';
  const end = h.indexOf(endMark, start);
  if (end === -1) throw new Error('about.html: gallery caption not found');

  h = h.slice(0, start)
    + stripOpen + '\n        <div class="about-photo-track">\n          ' + track + '\n        </div>\n      </div>'
    + h.slice(end);
  fs.writeFileSync(p, h);

  console.log(`\n${photos.length} photo(s), ${(bytes / 1024).toFixed(1)} MB generated`);
  console.log(carousel
    ? `strip revolves: one full cycle every ${seconds}s`
    : `strip stays a static grid (a carousel needs more than four photos)`);
  const perView = photos.length * (fs.statSync(path.join(outDir, `${photos[0].slug}-${THUMB}.webp`)).size / 1024);
  console.log(`thumbnails the About page loads: ~${perView.toFixed(0)} KB${carousel ? ' (each photo is fetched once, the loop reuses it)' : ''}`);
})().catch(e => { console.error(e.message); process.exit(1); });
