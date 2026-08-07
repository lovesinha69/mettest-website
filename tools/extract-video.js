/**
 * Moves the hero video out of index.html into a real file.
 *
 *   node tools/extract-video.js <publicDir>
 *
 * The video was embedded as a base64 data: URI, which meant the browser had to
 * download ~2.2 MB of HTML before it could render anything, and base64 barely
 * compresses (1.3x vs ~4x for the rest of the markup). As an external file the
 * HTML drops to ~50 KB and renders immediately while the video streams in.
 */
const fs = require('fs');
const path = require('path');

const dir = process.argv[2];
const p = path.join(dir, 'index.html');
let html = fs.readFileSync(p, 'utf8');

const m = html.match(/<source src="data:video\/mp4;base64,([A-Za-z0-9+/=]+)" type="video\/mp4">/);
if (!m) {
  if (html.includes('src="hero.mp4"')) { console.log('already extracted'); process.exit(0); }
  throw new Error('inline video source not found');
}

const b64 = m[1];
const buf = Buffer.from(b64, 'base64');
const outFile = path.join(dir, 'hero.mp4');
fs.writeFileSync(outFile, buf);

// Swap the data URI for the file. preload="metadata" so the browser fetches
// only what it needs to start, rather than racing the rest of the page.
html = html.replace(m[0], '<source src="hero.mp4" type="video/mp4">');

const before = fs.statSync(p).size;
fs.writeFileSync(p, html);
const after = fs.statSync(p).size;

console.log(`hero.mp4        ${(buf.length / 1024 / 1024).toFixed(2)} MB`);
console.log(`index.html      ${(before / 1024 / 1024).toFixed(2)} MB -> ${(after / 1024).toFixed(1)} KB`);
console.log(`base64 overhead removed: ${((b64.length - buf.length) / 1024).toFixed(0)} KB`);
