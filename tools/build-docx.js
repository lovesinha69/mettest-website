/**
 * Builds the copy-review .docx from the extracted content map.
 *
 *   node tools/build-docx.js <publicDir> <out.docx>
 */
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, HeadingLevel, AlignmentType, PageBreak,
} = require('docx');
const { extract, BR } = require('./extract-content.js');

// US Letter, 0.6" margins -> 7.3" of usable width.
const PAGE = { width: 12240, height: 15840 };
const MARGIN = 864;
const CONTENT_W = PAGE.width - MARGIN * 2;
const COL = [3050, CONTENT_W - 3050];

const INK = '1A1C1F';
const MUTED = '6B7075';
const ACCENT = 'C8102E';
const RULE = 'D6D8DA';
const HEAD_BG = 'F2F3F4';

const cellBorders = {
  top: { style: BorderStyle.SINGLE, size: 2, color: RULE },
  bottom: { style: BorderStyle.SINGLE, size: 2, color: RULE },
  left: { style: BorderStyle.SINGLE, size: 2, color: RULE },
  right: { style: BorderStyle.SINGLE, size: 2, color: RULE },
};

const p = (runs, opts = {}) => new Paragraph({ children: runs, ...opts });
const t = (text, opts = {}) => new TextRun({ text, font: 'Calibri', ...opts });

function cell(children, width, shading) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: cellBorders,
    margins: { top: 90, bottom: 90, left: 130, right: 130 },
    shading: shading ? { type: ShadingType.CLEAR, fill: shading, color: 'auto' } : undefined,
    children,
  });
}

function headerRow() {
  return new TableRow({
    tableHeader: true,
    children: [
      cell([p([t('ID / where it appears', { bold: true, size: 17, color: INK })])], COL[0], HEAD_BG),
      cell([p([t('Text — edit this column', { bold: true, size: 17, color: INK })])], COL[1], HEAD_BG),
    ],
  });
}

function itemRow(item) {
  // Show only the part of the location the section divider doesn't already say.
  const detail = [item.card, item.element].filter(Boolean).join(' › ');
  const kindNote = item.kind === 'attr' ? `${item.attr} — tooltip / screen-reader label` : null;

  const left = [
    p([t(item.id, { bold: true, size: 16, color: ACCENT, font: 'Consolas' })], { spacing: { after: 20 } }),
    p([t(detail || item.where, { size: 14, color: MUTED, italics: true })]),
  ];
  if (kindNote) left.push(p([t(kindNote, { size: 14, color: MUTED })], { spacing: { before: 20 } }));

  return new TableRow({
    children: [
      cell(left, COL[0]),
      cell([p([t(item.text, { size: 19, color: INK })])], COL[1]),
    ],
  });
}

/** Full-width divider naming the on-page section the following rows belong to. */
function dividerRow(label) {
  return new TableRow({
    children: [
      new TableCell({
        columnSpan: 2,
        width: { size: CONTENT_W, type: WidthType.DXA },
        borders: cellBorders,
        margins: { top: 110, bottom: 90, left: 130, right: 130 },
        shading: { type: ShadingType.CLEAR, fill: 'FAF7F7', color: 'auto' },
        children: [p([t(label, { bold: true, size: 17, color: ACCENT })])],
      }),
    ],
  });
}

/** One table for the whole page: a single header, sections marked by dividers. */
function contentTable(items, { dividers = true } = {}) {
  const rows = [headerRow()];
  let current = Symbol('none');
  for (const item of items) {
    const sec = item.section || null;
    if (dividers && sec !== current) {
      current = sec;
      if (sec) rows.push(dividerRow(sec));
    }
    rows.push(itemRow(item));
  }
  return new Table({
    columnWidths: COL,
    width: { size: CONTENT_W, type: WidthType.DXA },
    rows,
  });
}

function build(groups) {
  const kids = [];

  // ---- Cover ----
  kids.push(
    p([t('Met-Test Laboratories', { bold: true, size: 44, color: INK })], { spacing: { after: 60 } }),
    p([t('Website copy — full text for review', { size: 26, color: ACCENT })], { spacing: { after: 40 } }),
    p([t(`mettestlab.com · ${new Date().toISOString().slice(0, 10)} · ${groups.reduce((a, g) => a + g.items.length, 0)} strings`, { size: 18, color: MUTED })],
      { spacing: { after: 320 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: RULE, space: 8 } } }),
  );

  kids.push(p([t('How to use this document', { bold: true, size: 24, color: INK })], { spacing: { before: 200, after: 120 } }));
  const rules = [
    ['Edit the right-hand column only.', 'That is the text visitors see. Rewrite it however you like.'],
    ['Never change the ID.', 'The pink code in the left column is how each line is matched back to the website. If an ID is altered or deleted, that line cannot be applied.'],
    ['Leave rows you do not want changed exactly as they are.', 'Untouched rows are skipped, so there is no need to delete them.'],
    [`${BR} marks a line break.`, `It is where the text wraps to a new line on screen. Move it, delete it, or add another to change where the line breaks.`],
    ['Part 1 applies to every page.', 'The navigation, footer and enquiry form are repeated on all six pages, so they are listed once. Editing them changes all six.'],
    ['Do not add or delete rows.', 'To remove text from the site, tell me which ID rather than blanking the cell.'],
  ];
  for (const [head, body] of rules) {
    kids.push(p([
      t('•  ', { size: 19, color: ACCENT, bold: true }),
      t(head + ' ', { size: 19, color: INK, bold: true }),
      t(body, { size: 19, color: MUTED }),
    ], { spacing: { after: 90 }, indent: { left: 180, hanging: 180 } }));
  }
  kids.push(p([t('Send the edited file back and the changes go live in one step.', { size: 19, color: INK, italics: true })], { spacing: { before: 140 } }));

  kids.push(p([new PageBreak()]));

  // ---- Part 1: shared ----
  const shared = groups.filter(g => g.scope === 'shared');
  kids.push(
    p([t('Part 1 — Repeated on every page', { bold: true, size: 30, color: INK })], { heading: HeadingLevel.HEADING_1, spacing: { after: 60 } }),
    p([t('These blocks are identical on all six pages. One edit here updates the whole site.', { size: 19, color: MUTED })], { spacing: { after: 200 } }),
  );
  for (const g of shared) {
    kids.push(p([t(g.label, { bold: true, size: 24, color: ACCENT })], { heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 100 } }));
    kids.push(contentTable(g.items, { dividers: false }));
  }

  // ---- Part 2: pages ----
  kids.push(p([new PageBreak()]));
  kids.push(
    p([t('Part 2 — Page by page', { bold: true, size: 30, color: INK })], { heading: HeadingLevel.HEADING_1, spacing: { after: 60 } }),
    p([t('Content unique to each page, in the order it appears on screen.', { size: 19, color: MUTED })], { spacing: { after: 200 } }),
  );

  const pages = groups.filter(g => g.scope === 'page');
  pages.forEach((g, i) => {
    if (i > 0) kids.push(p([new PageBreak()]));
    kids.push(p([
      t(`${g.label} page`, { bold: true, size: 26, color: INK }),
      t(`   ${g.files[0]} · ${g.items.length} strings`, { size: 17, color: MUTED }),
    ], { heading: HeadingLevel.HEADING_2, spacing: { before: 120, after: 120 } }));

    kids.push(contentTable(g.items));
  });

  return new Document({
    creator: 'Met-Test Laboratories',
    title: 'Met-Test Laboratories — Website Copy',
    description: 'Full website text for review and editing',
    styles: { default: { document: { run: { font: 'Calibri', size: 19, color: INK } } } },
    sections: [{
      properties: { page: { size: PAGE, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } },
      children: kids,
    }],
  });
}

async function main() {
  const dir = process.argv[2];
  const out = process.argv[3];
  const groups = extract(dir);
  const buf = await Packer.toBuffer(build(groups));
  fs.writeFileSync(out, buf);
  console.log(`Wrote ${out} (${(buf.length / 1024).toFixed(0)} KB, ${groups.reduce((a, g) => a + g.items.length, 0)} strings)`);
}

if (require.main === module) main();
