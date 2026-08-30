/**
 * Prepares the four leadership portraits for the About page.
 *
 *   node tools/build-leader-photos.js "<sourceDir>" <publicDir>
 *
 * The cards are square, so every photo needs a crop. Centre-cropping is wrong
 * for most of them - Ranjit is seated to the right of a wide desk shot, and a
 * centred square on a standing portrait cuts the head off - so each crop is
 * given explicitly, expressed as fractions of the displayed image.
 *
 * Two of the source files carry EXIF orientation 8 (rotate 90 CCW), so .rotate()
 * runs first and every fraction below refers to the image as it looks upright.
 *
 * Quality is kept high: no upscaling, Lanczos3 resampling, WebP q92 and JPEG
 * q90 with no chroma subsampling.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const srcDir = process.argv[2];
const pubDir = process.argv[3];
if (!srcDir || !pubDir) { console.error('usage: node tools/build-leader-photos.js "<sourceDir>" <publicDir>'); process.exit(1); }
const outDir = path.join(pubDir, 'img');
fs.mkdirSync(outDir, { recursive: true });

// side/left/top are fractions of the upright image; side is a fraction of its height,
// except where the image is portrait, where it is a fraction of the width.
// Love Sinha's source is a 546px web-sized image, not a camera original, so his
// crop is fixed at the full width - anything tighter throws away resolution he
// cannot get back. The other three are cropped out to match HIS scale instead
// of the reverse: their sources are 7008px, so a wider crop uses more of the
// frame and costs them nothing.
//
// The two studio portraits bottom out around 45% because their subjects already
// fill a 4672px-wide frame; that is as loose as they go without padding.
const PEOPLE = [
  {
    slug: 'ranjit-sinha', file: 'DSC05498.JPG',
    // Wide office shot, so there is room to open right out to 40%.
    side: 1841 / 4672, left: 3495 / 7008, top: 635 / 4672,
    alt: 'Ranjit Sinha, Founder and CEO of Met-Test Laboratories',
  },
  {
    slug: 'laxman-prasad-singh', file: 'DSC05554.JPG',
    // Full frame width: the loosest square this portrait allows.
    side: 1, left: 0, top: 0,
    alt: 'Laxman Prasad Singh, Metallurgical Engineer at Met-Test Laboratories',
  },
  {
    slug: 'animesh-kumar', file: 'DSC05530.JPG',
    side: 1, left: 0, top: 0,
    alt: 'Animesh Kumar, NDT Engineer at Met-Test Laboratories',
  },
  {
    slug: 'love-sinha', file: 'thumbnail.jpeg thumbnail (1).jpeg',
    // Full 546px width - every pixel the source has. Shifted down slightly so
    // his headroom sits with the others rather than well above them.
    side: 1, left: 0, top: 303 / 1181,
    alt: 'Love Sinha, IT Administrator at Met-Test Laboratories',
  },
];

const WIDTHS = [320, 640, 960];

(async () => {
  const report = [];
  for (const p of PEOPLE) {
    const src = path.join(srcDir, p.file);
    if (!fs.existsSync(src)) throw new Error(`missing source: ${src}`);

    const upright = sharp(src).rotate();
    const m = await upright.metadata();
    const W = m.orientation >= 5 ? m.height : m.width;   // dimensions once upright
    const H = m.orientation >= 5 ? m.width : m.height;

    const side = Math.round(p.side * (W < H ? W : H));
    const square = Math.min(side, W, H);
    const left = Math.max(0, Math.min(Math.round(p.left * W), W - square));
    const top = Math.max(0, Math.min(Math.round(p.top * H), H - square));

    const row = { slug: p.slug, source: `${W}x${H}`, crop: `${square}px at ${left},${top}`, files: [] };

    for (const w of WIDTHS) {
      if (w > square) continue;                          // never upscale
      const base = sharp(src).rotate()
        .extract({ left, top, width: square, height: square })
        .resize({ width: w, kernel: sharp.kernel.lanczos3 });

      const wp = path.join(outDir, `${p.slug}-${w}.webp`);
      await base.clone().webp({ quality: 92, effort: 5 }).toFile(wp);
      const jp = path.join(outDir, `${p.slug}-${w}.jpg`);
      await base.clone().jpeg({ quality: 90, chromaSubsampling: '4:4:4', mozjpeg: true, progressive: true }).toFile(jp);

      row.files.push({ w, webpKB: +(fs.statSync(wp).size / 1024).toFixed(0), jpgKB: +(fs.statSync(jp).size / 1024).toFixed(0) });
    }

    // If the source could not reach the largest width, emit its true maximum
    // so the srcset never promises resolution the file does not have.
    if (!row.files.some(f => f.w === WIDTHS[WIDTHS.length - 1]) && square > row.files[row.files.length - 1].w) {
      const w = square;
      const base = sharp(src).rotate().extract({ left, top, width: square, height: square });
      const wp = path.join(outDir, `${p.slug}-${w}.webp`);
      await base.clone().webp({ quality: 92, effort: 5 }).toFile(wp);
      const jp = path.join(outDir, `${p.slug}-${w}.jpg`);
      await base.clone().jpeg({ quality: 90, chromaSubsampling: '4:4:4', mozjpeg: true, progressive: true }).toFile(jp);
      row.files.push({ w, webpKB: +(fs.statSync(wp).size / 1024).toFixed(0), jpgKB: +(fs.statSync(jp).size / 1024).toFixed(0), capped: true });
    }

    report.push(row);
  }

  for (const r of report) {
    console.log(`${r.slug.padEnd(20)} src ${r.source.padEnd(11)} crop ${r.crop}`);
    console.log('  ' + r.files.map(f => `${f.w}w webp:${f.webpKB}KB jpg:${f.jpgKB}KB${f.capped ? ' (source max)' : ''}`).join('  |  '));
  }
  fs.writeFileSync(path.join(__dirname, 'leader-photos.json'),
    JSON.stringify(report.map(r => ({ slug: r.slug, widths: r.files.map(f => f.w) })), null, 2));
  console.log('\nwidths written to tools/leader-photos.json');
})().catch(e => { console.error(e); process.exit(1); });
