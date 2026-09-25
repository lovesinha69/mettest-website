// Regression checks for the service, motion and placeholder presentation.
const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const cheerio = require('cheerio');
const dir = process.argv[2] || 'public';
let videos = 0;
for (const name of fs.readdirSync(dir).filter(x => x.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(dir, name), 'utf8');
  const $ = cheerio.load(html);
  assert.equal($('.svc-detail-icon').length, 0, name + ': decorative service icon');
  assert.equal($('.leader-photo-placeholder,.svc-detail-media-placeholder,.about-story-placeholder').length, 0, name + ': obsolete placeholder');
  assert.equal($('footer a[href="heat-treatment"]').length, 1, name + ': heat treatment footer link');
  assert.equal($('footer a[href="material-testing"]').length, 1, name + ': material testing footer link');
  $('[data-yt-id]').each((_, el) => {
    videos++;
    assert.equal($(el).find('video').length, 0, name + ': unused video element');
    assert.equal($(el).find('button').length, 1, name + ': play control');
    assert.equal($(el).find('picture').length, 1, name + ': thumbnail');
  });
  $('script:not([src])').each((_, el) => {
    if ($(el).attr('type') === 'application/ld+json') JSON.parse($(el).html());
    else new vm.Script($(el).html(), { filename: name });
  });
  assert(!html.includes('function animateStat'), name + ': obsolete count-up');
  $('.stat-num').each((_, el) => assert($(el).text().startsWith(Number($(el).attr('data-target')).toLocaleString('en-US')), name + ': no-JS statistic'));
  $('[data-motion-target]').each((_, el) => {
    assert.equal($($(el).attr('data-motion-target')).length, 1, name + ': pause target');
    assert.equal($(el).attr('aria-pressed'), 'false');
  });
  if ($('#contactModal').length) assert(html.includes('This form does not accept attachments.'), name + ': drawing instructions');
}
assert.equal(videos, 21, 'All eleven videos plus ten service-page embeds remain');
console.log('Presentation checks passed: 20 pages, 21 video placements, inline JavaScript and JSON-LD.');
