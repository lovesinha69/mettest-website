/**
 * Rebuilds the FAQPage structured data on faq.html from the visible Q&A.
 *
 *   node tools/sync-faq-schema.js <publicDir>
 *
 * The copy round-trip deliberately ignores <script> contents, so a text edit
 * applied to the page would otherwise leave the JSON-LD holding the old
 * wording. Google requires FAQPage markup to match the visible content, so the
 * schema is regenerated from the DOM rather than maintained by hand.
 *
 * Run this after tools/apply-content.js whenever FAQ copy changes.
 */
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const dir = process.argv[2];
const p = path.join(dir, 'faq.html');
let html = fs.readFileSync(p, 'utf8');

const $ = cheerio.load(html, { decodeEntities: false });
const norm = s => s.replace(/\s+/g, ' ').trim();

const qa = $('.faq-item').toArray().map(el => {
  const q = norm($(el).find('.faq-q').text());
  const a = norm($(el).find('.faq-a').text());
  if (!q || !a) throw new Error('faq-item missing question or answer text');
  return [q, a];
});
if (!qa.length) throw new Error('no .faq-item found on faq.html');

const ld = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': 'https://mettestlab.com/faq#faq',
  mainEntity: qa.map(([q, a]) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

const block = `<script type="application/ld+json">\n${JSON.stringify(ld, null, 2)}\n</script>`;
const re = /<script type="application\/ld\+json">[\s\S]*?<\/script>/;
if (!re.test(html)) throw new Error('faq.html: no JSON-LD block to replace');

const before = html;
html = html.replace(re, block);
JSON.parse(block.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '').trim()); // validate

if (html === before) {
  console.log(`FAQ schema already in sync (${qa.length} Q&A)`);
} else {
  fs.writeFileSync(p, html, 'utf8');
  console.log(`FAQ schema rebuilt from visible content (${qa.length} Q&A)`);
}
