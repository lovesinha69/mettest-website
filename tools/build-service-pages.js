/**
 * Generates one page per service.
 *
 *   node tools/build-service-pages.js public
 *
 * Ten services shared /services, so a single URL was competing for ten
 * different searches. Each now has its own page, title, structured data and
 * video, with /services kept as the hub that links to them.
 *
 * The shell - head, nav, footer, enquiry modal, scripts - is lifted from an
 * existing page rather than duplicated here, so these pages cannot drift away
 * from the rest of the site when the shared regions change.
 */
const fs = require('fs');
const path = require('path');
const cfg = require('./service-pages.js');

const pubDir = process.argv[2] || 'public';
const SHELL = 'industries.html';
const BASE = 'https://mettestlab.com';
const must = (c, m) => { if (!c) throw new Error(m); };

const shell = fs.readFileSync(path.join(pubDir, SHELL), 'utf8');
const esc = s => String(s).replace(/&(?!(amp|lt|gt|quot|#\d+|mdash|rsquo|Oslash|times|deg);)/g, '&amp;')
                          .replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = s => String(s).replace(/"/g, '&quot;');
const plain = s => String(s).replace(/&amp;/g, '&').replace(/&mdash;/g, '—').replace(/&rsquo;/g, '’')
                            .replace(/&Oslash;/g, 'Ø').replace(/&times;/g, '×').replace(/&deg;/g, '°');

/* -------------------------------------------------------------- the shell */
const headEnd = shell.indexOf('<style>');
const navStart = shell.indexOf('<nav class="nav">');
const navEnd = shell.indexOf('</nav>') + 6;
const footStart = shell.indexOf('<footer');
must(headEnd > 0 && navStart > 0 && footStart > 0, 'shell landmarks not found');

const styles = shell.slice(headEnd, navStart);          // <style>…</style> + anything between
const nav = shell.slice(navStart, navEnd);
const tail = shell.slice(footStart);                    // footer + modal + scripts

/* --------------------------------------------------------------- helpers */
const eyebrow = t => `<div class="sec-eyebrow"><div class="sec-eyebrow-line"></div><span class="sec-eyebrow-text">${t}</span></div>`;

function head(s) {
  const url = `${BASE}/${s.slug}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="google-site-verification" content="dCB2xknubwbifTkm2eV2Jt1QKFeLk6wX567fDKQc4XI">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${s.title}</title>
<meta name="description" content="${attr(s.desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Met-Test Laboratories">
<meta property="og:locale" content="en_IN">
<meta property="og:title" content="${attr(s.title)}">
<meta property="og:description" content="${attr(s.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${BASE}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${attr(s.title)}">
<meta name="twitter:description" content="${attr(s.desc)}">
<meta name="twitter:image" content="${BASE}/og-image.png">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#0D0E0F">
<link rel="stylesheet" href="fonts/fonts.css">
${schema(s)}
`;
}

function schema(s) {
  const url = `${BASE}/${s.slug}`;
  const service = {
    '@context': 'https://schema.org', '@type': 'Service',
    serviceType: plain(s.name),
    name: `${plain(s.name)} — Met-Test Laboratories`,
    description: plain(s.desc),
    url,
    provider: {
      '@type': 'LocalBusiness', name: 'Met-Test Laboratories', '@id': `${BASE}/#business`,
      url: BASE, telephone: cfg.phone, email: cfg.email,
      address: { '@type': 'PostalAddress', streetAddress: 'Plot No. C-1-10, Road No. B-10, GIDC Estate',
                 addressLocality: 'Vitthal Udyognagar, Anand', addressRegion: 'Gujarat',
                 postalCode: '388121', addressCountry: 'IN' },
    },
    areaServed: [{ '@type': 'State', name: 'Gujarat' }, { '@type': 'Country', name: 'India' }],
  };
  const crumbs = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Services', item: BASE + '/services' },
      { '@type': 'ListItem', position: 3, name: plain(s.name), item: url },
    ],
  };
  const faq = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: s.faq.map(([q, a]) => ({
      '@type': 'Question', name: plain(q),
      acceptedAnswer: { '@type': 'Answer', text: plain(a) },
    })),
  };
  return [service, crumbs, faq]
    .map(o => `<script type="application/ld+json">\n${JSON.stringify(o, null, 2)}\n</script>`)
    .join('\n');
}

function body(s, all) {
  const others = all.filter(x => x.slug !== s.slug).slice(0, 4);
  return `
<div style="padding-top:2rem"><div class="sec">
  <nav class="crumbs" aria-label="Breadcrumb">
    <a href="/">Home</a><span aria-hidden="true">/</span><a href="services">Services</a><span aria-hidden="true">/</span><span aria-current="page">${esc(s.name)}</span>
  </nav>
  <div class="sec-header">
    ${eyebrow('Services')}
    <h1 class="sec-title">${esc(s.name)}</h1>
    <div class="sec-body">${esc(s.lede)}</div>
  </div>

  <div class="svc-page-grid">
    <div class="svc-page-main">
${s.sections.map(sec => `      <h2 class="svc-page-h">${esc(sec.h)}</h2>
      <p class="svc-page-p">${esc(sec.p)}</p>${sec.link ? `\n      <p class="svc-page-p"><a class="svc-page-link" href="${sec.link.href}">${esc(sec.link.text)} &rarr;</a></p>` : ''}`).join('\n')}
    </div>
    <aside class="svc-page-side">
      <div class="svc-page-card">
        <div class="svc-page-card-title">Capacity</div>
        <dl class="svc-spec">
${s.capacity.map(([k, v]) => `          <dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('\n')}
        </dl>
      </div>
      <div class="svc-page-card">
        <div class="svc-page-card-title">Send us the drawing</div>
        <p class="svc-page-card-p">Give us the material, the section and the result your specification calls for, and we will confirm before you ship.</p>
        <button type="button" class="btn-primary" onclick="openContactModal()" style="width:100%;justify-content:center;margin-top:0.75rem">Enquire</button>
        <p class="svc-page-card-p" style="margin-top:0.875rem">${esc(cfg.phone)}<br><a href="mailto:${cfg.email}" style="color:var(--accent2);text-decoration:none">${cfg.email}</a></p>
      </div>
    </aside>
  </div>

  <div class="svc-page-video">
    <div class="svc-detail-media" data-yt-id="${s.video}" data-yt-title="${attr(plain(s.name))} at Met-Test Laboratories">
      <picture class="video-poster-pic"><source type="image/webp" srcset="img/video/${s.slug === 'hardening-and-tempering' ? 'hardening-tempering' : s.slug}-640.webp 640w, img/video/${s.slug === 'hardening-and-tempering' ? 'hardening-tempering' : s.slug}-1280.webp 1280w" sizes="(max-width:860px) calc(100vw - 80px), 1180px"><img class="video-poster" src="img/video/${s.slug === 'hardening-and-tempering' ? 'hardening-tempering' : s.slug}-1280.jpg" srcset="img/video/${s.slug === 'hardening-and-tempering' ? 'hardening-tempering' : s.slug}-640.jpg 640w, img/video/${s.slug === 'hardening-and-tempering' ? 'hardening-tempering' : s.slug}-1280.jpg 1280w" sizes="(max-width:860px) calc(100vw - 80px), 1180px" width="1280" height="720" alt="" loading="lazy" decoding="async"></picture>
      <button class="svc-detail-play" type="button" aria-label="Play the ${attr(plain(s.name))} video">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
      </button>
    </div>
  </div>

  <div class="svc-page-faq">
    <h2 class="svc-page-h">Common questions</h2>
${s.faq.map(([q, a]) => `    <div class="svc-faq-item">
      <h3 class="svc-faq-q">${esc(q)}</h3>
      <p class="svc-faq-a">${esc(a)}</p>
    </div>`).join('\n')}
  </div>

  <div class="svc-page-related">
    <h2 class="svc-page-h">Related services</h2>
    <div class="svc-related-grid">
${others.map(o => `      <a class="svc-related-card" href="${o.slug}"><span class="svc-related-name">${esc(o.name)}</span><span class="svc-related-go">View &rarr;</span></a>`).join('\n')}
      <a class="svc-related-card" href="services"><span class="svc-related-name">All services</span><span class="svc-related-go">View &rarr;</span></a>
    </div>
  </div>
</div></div>
`;
}

/* ------------------------------------------------------------------- CSS */
const PAGE_CSS = `
/* --- Individual service pages --- */
.crumbs{font-size:11px;color:var(--dim);margin-bottom:1.75rem;display:flex;gap:8px;flex-wrap:wrap;align-items:center;border:0;padding:0;height:auto;background:none;position:static}
.crumbs a{color:var(--muted);text-decoration:none}
.crumbs a:hover{color:var(--accent)}
.crumbs span[aria-current]{color:var(--fg)}
.svc-page-grid{display:grid;grid-template-columns:1fr 320px;gap:3.5rem;align-items:start;margin-top:1rem}
.svc-page-h{font-family:'Bebas Neue',sans-serif;font-size:1.6rem;letter-spacing:0.04em;color:var(--fg);line-height:1.1;margin:2.25rem 0 0.75rem}
.svc-page-main .svc-page-h:first-child{margin-top:0}
.svc-page-p{font-size:13.5px;color:var(--muted);line-height:1.85;font-weight:300;margin-bottom:1rem;max-width:70ch}
.svc-page-link{color:var(--accent2);text-decoration:none;font-size:12.5px}
.svc-page-link:hover{text-decoration:underline}
.svc-page-side{display:flex;flex-direction:column;gap:0.75rem;position:sticky;top:96px}
.svc-page-card{background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:1.25rem 1.375rem}
.svc-page-card-title{font-family:'Bebas Neue',sans-serif;font-size:1.05rem;letter-spacing:0.08em;color:var(--fg);margin-bottom:0.875rem}
.svc-page-card-p{font-size:11.5px;color:var(--muted);line-height:1.7;font-weight:300;margin:0}
.svc-spec{margin:0;font-size:11.5px}
.svc-spec dt{color:var(--dim);font-weight:400;margin-top:0.625rem}
.svc-spec dt:first-child{margin-top:0}
.svc-spec dd{margin:2px 0 0;color:var(--fg);font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11.5px}
.svc-page-video{margin-top:4rem}
.svc-page-video .svc-detail-media{max-width:1180px}
.svc-page-faq{margin-top:4rem;padding-top:3rem;border-top:1px solid var(--border);max-width:74ch}
.svc-faq-item{padding:1.125rem 0;border-bottom:1px solid var(--border)}
.svc-faq-item:last-child{border-bottom:none}
.svc-faq-q{font-size:13.5px;color:var(--fg);font-weight:500;margin:0 0 0.4rem}
.svc-faq-a{font-size:13px;color:var(--muted);line-height:1.8;font-weight:300;margin:0}
.svc-page-related{margin-top:3.5rem;padding-top:3rem;border-top:1px solid var(--border)}
.svc-related-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:0.75rem;margin-top:1rem}
.svc-related-card{display:flex;justify-content:space-between;align-items:center;gap:1rem;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:1rem 1.125rem;text-decoration:none;transition:border-color .2s}
.svc-related-card:hover{border-color:var(--accent)}
.svc-related-name{font-size:12.5px;color:var(--fg);font-weight:500}
.svc-related-go{font-size:11px;color:var(--accent2);white-space:nowrap}
@media(max-width:860px){
  .svc-page-grid{grid-template-columns:1fr;gap:2.5rem}
  .svc-page-side{position:static}
}
`;

/* ------------------------------------------------------------------ build */
const styled = styles.replace('</style>', PAGE_CSS + '</style>');
must(styled !== styles, 'could not append page css');

// Mark Services as the current section in the nav.
const navHere = nav.replace('<a href="industries" class="active">', '<a href="industries">')
                   .replace('<a href="services">', '<a href="services" class="active">');
must(navHere.includes('<a href="services" class="active">'), 'could not set the active nav item');

let written = 0;
for (const s of cfg.services) {
  const page = head(s) + styled + navHere + body(s, cfg.services) + tail;
  fs.writeFileSync(path.join(pubDir, `${s.slug}.html`), page);
  written++;
  const words = body(s, cfg.services).replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  console.log(`  ${s.slug.padEnd(24)} ${String(words).padStart(4)} words   /${s.slug}`);
}
console.log(`\n${written} service page(s) written`);
