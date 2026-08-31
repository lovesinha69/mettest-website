# Met-Test Laboratories — Website

Marketing website for **Met-Test Laboratories**, a heat-treatment and
material-testing facility in Vitthal Udyognagar (V.U. Nagar), Anand, Gujarat,
India — operating since 1998.

**Live:** https://mettestlab.com

---

## What this is

A static, multi-page site. Twenty HTML pages, no framework, no bundler, no
server. Styling, the logo, the JSON-LD and all interactivity are embedded
directly in each page, so a page is a single self-contained file that works when
opened from disk.

Fonts are self-hosted in `public/fonts/`, so the site makes **no third-party
request** on load. The only external calls a visitor can trigger are the enquiry
form (Formspree) and a video embed, and the embed is click-to-load so nothing
reaches YouTube until someone presses play.

The site itself has no build step. Some of the more repetitive pages and all the
imagery are *generated* — see [Generated assets](#generated-assets) — but what
ships is whatever is sitting in `public/`.

## Quick start

```bash
git clone <your-repo-url>
cd mettest-website
npm install          # only needed for the tools in tools/
npm run serve        # http://localhost:8000
npm run audit        # static check of all 20 pages
```

`npm run serve` reproduces production routing: extensionless URLs (`/annealing`)
and the styled 404 page. Opening `public/index.html` directly also works, but
extensionless links will not resolve.

## Layout

```
.
├── public/                    # everything here is what gets served
│   ├── *.html                 # 20 pages (see below)
│   ├── _headers               # cache rules, read by Cloudflare
│   ├── _redirects             # 301s for the legacy .html URLs
│   ├── sitemap.xml            # 19 URLs (404 excluded, deliberately)
│   ├── robots.txt
│   ├── favicon.svg / .ico / apple-touch-icon.png
│   ├── og-image.png
│   ├── hero.mp4               # 2.2 MB, the one self-hosted video
│   ├── fonts/                 # self-hosted Bebas Neue + Inter
│   └── img/                   # 162 generated images
│       ├── gallery/           # About-page facility photographs
│       └── video/             # YouTube poster frames
├── tools/                     # generators, the copy round-trip, the audit
├── docs/                      # how everything works, and why
├── .github/workflows/         # CI: runs the audit on every push
├── wrangler.jsonc             # Cloudflare deploy config
├── package.json
├── README.md
└── LICENSE
```

### The pages

| Group | Pages |
|---|---|
| Core | `index` `services` `process` `industries` `about` `contact` `faq` |
| Service detail | `induction-hardening` `inductor-manufacturing` `hardening-and-tempering` `heat-treatment` `annealing` `normalising` `stress-relieving` `solution-annealing` `flame-hardening` `material-testing` |
| Legal | `privacy` `terms` |
| Error | `404` |

Each of the ten service pages carries 400–490 words, its own `<title>`,
canonical, `Service` + `BreadcrumbList` + `FAQPage` structured data, and its own
video. They exist because all ten services previously shared one URL and so
competed with each other — see [docs/seo.md](docs/seo.md).

## Scripts

| Command | What it does |
|---|---|
| `npm run serve` | Local server on :8000 with production-style routing |
| `npm run audit` | Static audit of every page — [docs/auditing.md](docs/auditing.md) |
| `npm run deploy` | `wrangler deploy` — [docs/deployment.md](docs/deployment.md) |
| `npm run build:service-pages` | Regenerate the ten service pages from `tools/service-pages.js` |
| `npm run build:process` | Regenerate the Process page |
| `npm run build:youtube` | Wire the eleven video slots from `tools/youtube.json` |
| `npm run build:gbp` | Rebuild the Google Business Profile product cards |
| `npm run copy:export` | Export all visitor-facing text to Word |
| `npm run copy:apply` | Write reviewed edits back into the HTML |

## Generated assets

Nothing binary in this repo was made by hand. Every image has a generator in
`tools/`, so any change is reproducible and shows up as a reviewable diff:

- **Leadership portraits** — crops stored as fractions of the source image
- **About photo strip** — ten facility photographs at three widths
- **Industry cards** — rewritten within per-card byte ranges, with guards
- **Video posters** — `maxresdefault` frames cached from YouTube

Details and the traps in each: [docs/media.md](docs/media.md).

## Enquiry form

The enquiry modal appears on **16 pages** and posts to Formspree, which forwards
to `mettestlab@yahoo.com`. Each page defines the endpoint near the bottom of its
inline script:

```js
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xvzewobg';
```

To repoint it, replace that URL in **all 16** files and redeploy. The endpoint is
a public URL by design, not a secret.

The success screen only appears on a real HTTP 200. Any failure shows the phone
number and email as a fallback, so an enquiry is never silently lost. If the
endpoint is ever reset to a placeholder containing `YOUR_FORM_ID`, the form
refuses to claim success at all. A hidden `_gotcha` honeypot filters spam; the
free plan covers 50 submissions a month.

## Documentation

| Doc | Covers |
|---|---|
| [deployment.md](docs/deployment.md) | Cloudflare Worker, rollback, `_headers` / `_redirects`, platform limits |
| [content-pipeline.md](docs/content-pipeline.md) | The Word round trip, and the generated pages |
| [media.md](docs/media.md) | Image pipelines and the video setup |
| [seo.md](docs/seo.md) | Indexing, structured data, and the rules to keep |
| [google-business-profile.md](docs/google-business-profile.md) | Categories, and the ten services published as Products |
| [auditing.md](docs/auditing.md) | What the audit checks |

## Two things to know before editing

1. **Do not remove `.gitattributes`.** It pins `* text=auto eol=lf`. The copy
   tools locate edits by byte anchors that contain newlines, so a checkout that
   rewrote LF to CRLF would silently break every one of them.
2. **Run `npm run audit` before you deploy.** It currently reports 0 errors and
   3 known warnings; CI fails the build on any error.

## Known gaps

Carried deliberately, not forgotten — full context in
[docs/seo.md](docs/seo.md#known-gaps):

- `_headers` and `_redirects` list only the nine original routes; the ten service
  pages are missing from both.
- `public/privacy.html` has a placeholder comment for the registered legal entity
  name and grievance officer.
- Ranjit Sinha's card still shows `mettestlab@yahoo.com`.

## Licence

All rights reserved — see [LICENSE](LICENSE). This is a commercial site for a
specific business; the code and content are not offered for reuse.

## Contact

**Met-Test Laboratories**
Plot No. C-1-10, Road No. B-10, G.I.D.C. Estate, V.U. Nagar – 388121, Dist.
Anand, Gujarat, India
Phone: +91 98253 21695 · Email: mettestlab@yahoo.com
