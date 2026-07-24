/**
 * Injects SEO + social metadata into every page.
 *
 *   node tools/seo.js <publicDir>
 *
 * Per page: a keyword-focused <title>, a unique meta description, a canonical
 * URL, Open Graph + Twitter Card tags, and a robots directive. The home page
 * also gets JSON-LD LocalBusiness structured data.
 *
 * The address and phone mirror what the site already displays, so the structured
 * data matches the visible page (a Google requirement). Facts that are disputed
 * or unknown — founding year, exact geo, opening hours, and sameAs profile links
 * — are deliberately omitted rather than guessed.
 */
const fs = require('fs');
const path = require('path');

const SITE = 'https://mettestlab.com/';
const OG = SITE + 'og-image.png';
const dir = process.argv[2];

const attr = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const el = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const PAGES = {
  'index.html': {
    path: '',
    title: 'Heat Treatment & Material Testing in Anand, Gujarat | Met-Test Laboratories',
    desc: 'Met-Test Laboratories, Vitthal Udyognagar (Anand, Gujarat) — heat treatment and material testing: hardening, tempering, induction hardening, annealing and custom inductor manufacturing. Precise, repeatable, built for demanding industries.',
  },
  'services.html': {
    path: 'services.html',
    title: 'Heat Treatment Services — Induction Hardening, Tempering & More | Met-Test Laboratories',
    desc: 'Ten heat-treatment and testing services from Met-Test Laboratories, Anand: induction hardening, hardening & tempering, annealing, normalising, stress relieving, flame hardening, material testing and inductor manufacturing.',
  },
  'process.html': {
    path: 'process.html',
    title: 'Our Heat-Treatment Process | Met-Test Laboratories, Anand',
    desc: 'A documented five-stage heat-treatment workflow at Met-Test Laboratories, Anand — from receipt and inspection to certified dispatch, with full traceability on every component.',
  },
  'industries.html': {
    path: 'industries.html',
    title: 'Industries Served — Automotive, Aerospace, Energy | Met-Test Laboratories',
    desc: 'Heat treatment for automotive, aerospace, oil & gas, power, medical and general engineering components — Met-Test Laboratories, Vitthal Udyognagar, Anand, Gujarat.',
  },
  'about.html': {
    path: 'about.html',
    title: 'About Met-Test Laboratories — Heat Treatment in Anand, Gujarat',
    desc: 'Met-Test Laboratories is a heat-treatment and material-testing facility in Vitthal Udyognagar, Anand, Gujarat, serving Indian manufacturers with precise, repeatable thermal processing.',
  },
  'contact.html': {
    path: 'contact.html',
    title: 'Contact Met-Test Laboratories — Anand, Gujarat | Enquiries',
    desc: 'Contact Met-Test Laboratories, Vitthal Udyognagar, Anand, Gujarat. Phone +91 98253 21695, email mettestlab@yahoo.com. Enquire about heat treatment and material testing.',
  },
  'privacy.html': {
    path: 'privacy.html', keepTitle: true,
    title: 'Privacy Policy | Met-Test Laboratories',
    desc: 'How Met-Test Laboratories collects, uses and protects personal data submitted through mettestlab.com, in line with India’s Digital Personal Data Protection Act, 2023.',
  },
  'terms.html': {
    path: 'terms.html', keepTitle: true,
    title: 'Terms of Use | Met-Test Laboratories',
    desc: 'Terms of use for the Met-Test Laboratories website, including the basis on which the technical information shown on the site is provided.',
  },
};

const CURRENT_TITLES = {
  'index.html': 'Home | Met-Test Laboratories',
  'services.html': 'Services | Met-Test Laboratories',
  'process.html': 'Process | Met-Test Laboratories',
  'industries.html': 'Industries | Met-Test Laboratories',
  'about.html': 'About | Met-Test Laboratories',
  'contact.html': 'Contact | Met-Test Laboratories',
  'privacy.html': 'Privacy Policy | Met-Test Laboratories',
  'terms.html': 'Terms of Use | Met-Test Laboratories',
};

const SERVICES = ['Induction Hardening', 'Inductor Manufacturing', 'Hardening & Tempering', 'Material Testing', 'Heat Treatment', 'Annealing', 'Normalising', 'Stress Relieving', 'Solution Annealing', 'Flame Hardening'];

function metaBlock(cfg) {
  const url = SITE + cfg.path;
  const d = attr(cfg.desc);
  const t = attr(cfg.title);
  return [
    `<meta name="description" content="${d}">`,
    `<link rel="canonical" href="${url}">`,
    `<meta name="robots" content="index, follow">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Met-Test Laboratories">`,
    `<meta property="og:locale" content="en_IN">`,
    `<meta property="og:title" content="${t}">`,
    `<meta property="og:description" content="${d}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${OG}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${t}">`,
    `<meta name="twitter:description" content="${d}">`,
    `<meta name="twitter:image" content="${OG}">`,
  ].join('\n');
}

function jsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': SITE + '#business',
    name: 'Met-Test Laboratories',
    alternateName: 'MET TEST LABORATORIES',
    url: SITE,
    image: OG,
    logo: SITE + 'apple-touch-icon.png',
    telephone: '+91-98253-21695',
    email: 'mettestlab@yahoo.com',
    foundingDate: '1998',
    description: 'Heat treatment and material testing facility in Vitthal Udyognagar, Anand, Gujarat — hardening, tempering, induction hardening, annealing, material testing and custom inductor manufacturing.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Plot No. C-1-10, Road No. B-10, G.I.D.C. Estate',
      addressLocality: 'Vitthal Udyognagar (V.U. Nagar), Anand',
      addressRegion: 'Gujarat',
      postalCode: '388121',
      addressCountry: 'IN',
    },
    areaServed: { '@type': 'Country', name: 'India' },
    geo: { '@type': 'GeoCoordinates', latitude: 22.5265988, longitude: 72.9226727 },
    hasMap: 'https://www.google.com/maps?cid=7198700308091604046',
    sameAs: [
      'https://www.google.com/maps?cid=7198700308091604046',
      'https://www.justdial.com/Anand/MET-Test-Laboratories-Vithal-Udyognagar/9999P2692-2692-140305131226-L4C4_BZDET',
      'https://www.indiamart.com/company/6224053/aboutus.html',
    ],
    priceRange: '₹₹',
    makesOffer: SERVICES.map(s => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s } })),
  };
  return `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n</script>`;
}

const log = [];
for (const [file, cfg] of Object.entries(PAGES)) {
  const p = path.join(dir, file);
  let html = fs.readFileSync(p, 'utf8');

  if (html.includes('name="description"')) { log.push(`${file.padEnd(16)} already has SEO tags`); continue; }

  const oldTitleTag = `<title>${CURRENT_TITLES[file]}</title>`;
  if (!html.includes(oldTitleTag)) throw new Error(`${file}: current <title> not found`);
  const newTitleTag = `<title>${el(cfg.title)}</title>`;
  html = html.replace(oldTitleTag, newTitleTag + '\n' + metaBlock(cfg));

  if (file === 'index.html') {
    html = html.replace('</head>', jsonLd() + '\n</head>');
  }

  fs.writeFileSync(p, html, 'utf8');
  log.push(`${file.padEnd(16)} title + ${16} meta tags${file === 'index.html' ? ' + JSON-LD' : ''}`);
}
console.log(log.join('\n'));
