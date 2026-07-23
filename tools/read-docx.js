/**
 * Reads the edited review .docx back into { ID: text }.
 *
 *   node tools/read-docx.js <file.docx> [out.json]
 *
 * Word fragments a single visible string across many <w:t> runs (revision ids,
 * spell-check state), so text is joined per paragraph, and paragraphs are joined
 * per cell — a stray Enter inside a cell must not split one string into two.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const cheerio = require('cheerio');

const ID_RE = /^[A-Z]+-\d{3}$/;

function unzipDocx(docx) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'docx-'));
  // Expand-Archive insists on a .zip extension.
  const zip = path.join(dir, 'pkg.zip');
  fs.copyFileSync(docx, zip);
  execFileSync('powershell', ['-NoProfile', '-Command',
    `Expand-Archive -LiteralPath '${zip}' -DestinationPath '${dir}' -Force`], { stdio: 'pipe' });
  return dir;
}

function read(docx) {
  const dir = unzipDocx(docx);
  const xml = fs.readFileSync(path.join(dir, 'word', 'document.xml'), 'utf8');
  fs.rmSync(dir, { recursive: true, force: true });

  const $ = cheerio.load(xml, { xmlMode: true });

  const paraText = pEl => {
    // Word can emit <w:br/> inside a paragraph; treat it as a space.
    let out = '';
    $(pEl).find('w\\:t, w\\:br, w\\:tab').each((_, n) => {
      const tag = (n.tagName || n.name || '').toLowerCase();
      out += tag === 'w:t' ? $(n).text() : ' ';
    });
    return out;
  };

  const cellText = tcEl => {
    const paras = $(tcEl).children('w\\:p').toArray().map(paraText);
    return paras.join(' ').replace(/\s+/g, ' ').trim();
  };

  const rows = [];
  $('w\\:tr').each((_, tr) => {
    const cells = $(tr).children('w\\:tc').toArray();
    if (cells.length !== 2) return;               // divider row (merged cell)
    const idCellParas = $(cells[0]).children('w\\:p').toArray().map(paraText)
      .map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
    const id = idCellParas[0] || '';
    if (!ID_RE.test(id)) return;                  // header row or stray content
    rows.push({ id, text: cellText(cells[1]) });
  });

  const map = {};
  const dupes = [];
  for (const r of rows) {
    if (map[r.id] !== undefined && map[r.id] !== r.text) dupes.push(r.id);
    map[r.id] = r.text;
  }
  return { map, count: rows.length, dupes };
}

if (require.main === module) {
  const { map, count, dupes } = read(process.argv[2]);
  if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(map, null, 2), 'utf8');
  console.log(`Read ${count} rows, ${Object.keys(map).length} unique IDs`);
  if (dupes.length) console.log(`WARNING duplicate IDs with differing text: ${dupes.join(', ')}`);
}

module.exports = { read };
