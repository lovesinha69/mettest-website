/**
 * Prepares the industry photos for the web.
 *
 *   node tools/build-industry-images.js <sourceDir> <publicDir>
 *
 * The cards render at roughly 418x280 CSS pixels, so the originals (up to
 * 7952px wide, 17 MB total) carry far more pixels than any screen can show.
 * Each photo is resized to three widths and encoded as WebP and JPEG:
 *
 *   640w   phones
 *   1280w  desktop cards on a 2x display
 *   1920w  large / high-DPR displays, with headroom
 *
 * Quality is set high enough to be visually indistinguishable from the source
 * at these sizes (WebP q92 / JPEG q90, no chroma subsampling, Lanczos3
 * resampling). The browser downloads exactly one file per card.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const srcDir = process.argv[2];
const pubDir = process.argv[3];
const outDir = path.join(pubDir, 'img');
fs.mkdirSync(outDir, { recursive: true });

// source filename -> output slug (matches the card order on industries.html)
const MAP = {
  'Automotive.jpg': 'automotive',
  'Railway.jpg': 'railway',
  'Oil&Gas.jpg': 'oil-gas',
  'Power&Energy.jpg': 'power-energy',
  'Sprocket.jpg': 'sprocket',
  'General Engineering.jpg': 'general-engineering',
};

const WIDTHS = [640, 1280, 1920];

(async () => {
  let srcTotal = 0, outTotal = 0;
  const report = [];

  for (const [file, slug] of Object.entries(MAP)) {
    const src = path.join(srcDir, file);
    if (!fs.existsSync(src)) throw new Error(`missing source: ${src}`);
    srcTotal += fs.statSync(src).size;

    const meta = await sharp(src).metadata();
    const row = { slug, source: `${meta.width}x${meta.height}`, srcMB: (fs.statSync(src).size / 1024 / 1024).toFixed(2), out: [] };

    for (const w of WIDTHS) {
      // Never upscale: if the source is narrower, keep its own width.
      const target = Math.min(w, meta.width);
      const base = sharp(src).rotate().resize({ width: target, kernel: sharp.kernel.lanczos3, withoutEnlargement: true });

      const webpPath = path.join(outDir, `${slug}-${w}.webp`);
      await base.clone().webp({ quality: 92, effort: 5 }).toFile(webpPath);

      const jpgPath = path.join(outDir, `${slug}-${w}.jpg`);
      await base.clone().jpeg({ quality: 90, chromaSubsampling: '4:4:4', mozjpeg: true, progressive: true }).toFile(jpgPath);

      const wKB = fs.statSync(webpPath).size / 1024;
      const jKB = fs.statSync(jpgPath).size / 1024;
      outTotal += fs.statSync(webpPath).size + fs.statSync(jpgPath).size;
      row.out.push(`${w}w webp:${wKB.toFixed(0)}KB jpg:${jKB.toFixed(0)}KB`);
    }

    // record the intrinsic ratio of the 1280 variant for width/height attrs
    const m2 = await sharp(path.join(outDir, `${slug}-1280.jpg`)).metadata();
    row.dims1280 = `${m2.width}x${m2.height}`;
    report.push(row);
  }

  for (const r of report) {
    console.log(`${r.slug.padEnd(20)} src ${r.source.padEnd(11)} ${r.srcMB}MB  ->  1280 ${r.dims1280}`);
    console.log(`  ${r.out.join('  |  ')}`);
  }
  console.log(`\nsource total: ${(srcTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`generated total (all sizes+formats): ${(outTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`typical page cost (6 cards, one 1280 webp each): see 1280w webp figures above`);
})().catch(e => { console.error(e); process.exit(1); });
