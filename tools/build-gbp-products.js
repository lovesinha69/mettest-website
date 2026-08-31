/**
 * Regenerates the ten Google Business Profile product cards.
 *
 * Google has no Services field for this profile's category ("Metal heat
 * treating service"), so the ten services are published through Products
 * instead. A photo is mandatory on every product - the field carries no
 * asterisk, but publishing without one is rejected.
 *
 * The source images are the YouTube poster frames already in public/img/video,
 * which are 16:9. Google crops a product card towards square, which would slice
 * the title off the left of each frame. So each card is rebuilt as a 1200x1200
 * square: the frame at full width, centred, over a blurred darkened copy of
 * itself. Nothing important can be cropped away because nothing important is
 * near an edge.
 *
 * Output is generated, so it is not committed. Run: npm run build:gbp
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC = 'public/img/video';
const OUT = 'build/gbp-products';
const SIZE = 1200;
const FRAME_H = 675;               // 1200 wide at 16:9
const TOP = Math.round((SIZE - FRAME_H) / 2);

const entries = JSON.parse(fs.readFileSync(path.join(__dirname, 'gbp-products.json'), 'utf8'));
const must = (c, m) => { if (!c) throw new Error(m); };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  must(entries.length === 10, `expected 10 entries, got ${entries.length}`);

  for (const e of entries) {
    const src = path.join(SRC, `${e.img}-1280.jpg`);
    must(fs.existsSync(src), `missing source frame: ${src}`);

    const bg = await sharp(src)
      .resize(SIZE, SIZE, { fit: 'cover', position: 'centre' })
      .blur(28).modulate({ brightness: 0.5 }).toBuffer();
    const fg = await sharp(src)
      .resize(SIZE, FRAME_H, { fit: 'fill', kernel: 'lanczos3' }).toBuffer();

    const out = path.join(OUT, `${e.img}.jpg`);
    await sharp(bg)
      .composite([{ input: fg, top: TOP, left: 0 }])
      .jpeg({ quality: 92, chromaSubsampling: '4:4:4', mozjpeg: true })
      .toFile(out);

    const kb = (fs.statSync(out).size / 1024).toFixed(0);
    must(kb > 10 && kb < 5120, `${out} is ${kb} KB, outside Google's 10 KB - 5 MB range`);
    console.log(`  ${e.name.padEnd(24)} ${SIZE}x${SIZE}  ${kb} KB`);
  }

  console.log(`\n${entries.length} cards written to ${OUT}/`);
})();
