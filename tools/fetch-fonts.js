/**
 * Self-hosts the Google Fonts the site uses, so no visitor data is sent to
 * Google. Fetches the Google CSS (as a modern browser, to get woff2), keeps
 * only the `latin` subset — which covers every glyph on this site, including
 * em dash, curly quotes, middle dot and bullet — downloads those woff2 files
 * into public/fonts/, and writes a local fonts.css with same-directory
 * (relative) URLs so it works on file:// and in production alike.
 *
 *   node tools/fetch-fonts.js <publicDir>
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const CSS_URL = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600&display=swap';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const get = (url, binary = false) => new Promise((res, rej) => {
  https.get(url, { headers: { 'User-Agent': UA } }, r => {
    if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
      r.resume(); return res(get(r.headers.location, binary));
    }
    if (r.statusCode !== 200) { r.resume(); return rej(new Error(`${url} -> ${r.statusCode}`)); }
    const chunks = [];
    r.on('data', c => chunks.push(c));
    r.on('end', () => res(binary ? Buffer.concat(chunks) : Buffer.concat(chunks).toString('utf8')));
  }).on('error', rej);
});

const slug = (fam, weight) => fam.toLowerCase().replace(/[^a-z0-9]+/g, '') + '-' + weight + '.woff2';

(async () => {
  const outDir = path.join(process.argv[2], 'fonts');
  fs.mkdirSync(outDir, { recursive: true });

  const css = await get(CSS_URL);

  // Split into (subset-comment, @font-face-block) pairs.
  const parts = css.split(/\/\*\s*([^*]+?)\s*\*\//).slice(1); // [label, block, label, block, ...]
  const kept = [];
  for (let i = 0; i < parts.length; i += 2) {
    const label = parts[i].trim();
    const block = parts[i + 1] || '';
    if (label !== 'latin') continue;
    const fam = (block.match(/font-family:\s*'([^']+)'/) || [])[1];
    const weight = (block.match(/font-weight:\s*(\d+)/) || [])[1];
    const url = (block.match(/src:\s*url\(([^)]+)\)/) || [])[1];
    const range = (block.match(/unicode-range:\s*([^;]+);/) || [])[1];
    if (!fam || !weight || !url) throw new Error(`could not parse @font-face for label ${label}`);
    kept.push({ fam, weight, url, range: range && range.trim() });
  }

  if (!kept.length) throw new Error('no latin @font-face blocks found');

  const cssOut = [];
  for (const f of kept) {
    const file = slug(f.fam, f.weight);
    const buf = await get(f.url, true);
    fs.writeFileSync(path.join(outDir, file), buf);
    cssOut.push(
      `@font-face{font-family:'${f.fam}';font-style:normal;font-weight:${f.weight};font-display:swap;` +
      `src:url("${file}") format("woff2");` +
      (f.range ? `unicode-range:${f.range};` : '') + `}`
    );
    console.log(`  ${file.padEnd(20)} ${(buf.length / 1024).toFixed(1)} KB  ${f.fam} ${f.weight}`);
  }

  fs.writeFileSync(path.join(outDir, 'fonts.css'), cssOut.join('\n') + '\n', 'utf8');
  console.log(`\nwrote public/fonts/fonts.css (${kept.length} faces)`);
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
