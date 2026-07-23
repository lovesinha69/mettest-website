# Met-Test Laboratories — Website

Multi-page marketing website for **Met-Test Laboratories**, a heat-treatment and
material-testing facility based in V.U. Nagar, Gujarat, India.

## What this is

A static, multi-page website. Each section is its own page. All styling, the logo,
the hero video, and interactivity are embedded directly in the HTML — there is no
build step, no framework, and no server needed. The only external dependency is
Google Fonts (Bebas Neue + Inter).

## Structure

```
.
├── public/               # everything here is what gets served
│   ├── favicon.svg       # browser-tab icon (modern browsers)
│   ├── favicon.ico       # 16/32/48px fallback
│   ├── apple-touch-icon.png  # 180px, iOS home screen
│   ├── fonts/            # self-hosted Bebas Neue + Inter (no Google request)
│   ├── index.html        # Home (hero + client marquee)
│   ├── services.html     # 10 heat-treatment services
│   ├── process.html      # 5-stage workflow + capabilities
│   ├── industries.html   # Industries served
│   ├── about.html        # Company story + leadership
│   ├── contact.html      # Enquiry form + contact details
│   ├── privacy.html      # Privacy policy (DPDP / IT Act)
│   └── terms.html        # Terms of use + liability disclaimer
├── wrangler.jsonc        # Cloudflare deploy config
└── README.md
```

The home page carries the embedded hero video (~3 MB); the other pages are small
(40–65 KB each). The navigation bar and footer are shared across every page.

## Running it locally

Open `public/index.html` in a browser, or serve the folder:

```bash
cd public && python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploying

Live at **https://mettestlab.com**, served by a Cloudflare Worker with static
assets (worker name: `broken-voice-4053`). To publish changes:

```bash
wrangler deploy
```

That uploads everything in `public/` and goes live in a few seconds. The custom
domain and SSL certificate stay attached across deploys — no DNS changes needed.
Requires `npm install -g wrangler` and a one-time `wrangler login`.

Cloudflare keeps previous versions, so a bad deploy can be rolled back from the
dashboard under **Workers & Pages → broken-voice-4053 → Deployments**.

## Contact form

The enquiry modal appears on all six pages and posts to **Formspree**, which
forwards submissions to `mettestlab@yahoo.com`. Each page defines the endpoint
near the bottom of its inline `<script>`:

```js
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xvzewobg';
```

To point it at a different form, replace that URL in **all six** HTML files and
redeploy. The endpoint is a public URL, not a secret — it is designed to sit in
client-side code.

The success screen only appears on a real HTTP 200 from Formspree. Any failure
shows an error with the phone number and email as a fallback, so an enquiry is
never silently lost. If the endpoint is ever reset to a placeholder containing
`YOUR_FORM_ID`, the form refuses to claim success at all.

Spam is filtered by a hidden `_gotcha` honeypot field, which Formspree discards
automatically. The free plan covers 50 submissions per month.

## Editing the copy in Word

All visitor-facing text can be reviewed and rewritten in a Word document rather
than in the HTML. The tools in `tools/` handle the round trip:

```bash
npm install cheerio docx                        # one-off
node tools/build-docx.js public Website-Copy.docx   # export every string
node tools/apply-content.js public edits.json       # write edits back
```

`build-docx.js` writes one row per string, each with a stable ID. `edits.json`
is `{ "<ID>": "<new text>" }`; `apply-content.js` re-derives the IDs from the
current HTML, so the export never goes stale — but the HTML must not be
restructured between exporting and applying.

Two details make the round trip safe:

- **Edits are spliced by byte range, not by re-serialising the DOM.** cheerio
  does not reproduce these files byte-for-byte, so rewriting the parsed tree
  would churn every file. Each string carries an anchor plus which occurrence of
  it to replace, and splices are applied back-to-front.
- **The nav, footer and enquiry form are shared.** They are byte-identical on all
  six pages, so they are exported once and written back to all six. The exporter
  verifies that they really are identical and fails loudly if they have drifted.

Line breaks (`<br>`) appear as `[br]` in the document and are re-emitted as real
tags. `&` is re-encoded to `&amp;` on write-back.

## To-do / notes

- **Placeholder content**: process step durations, founding year, leadership
  bios, and factory/industry photos/videos are placeholders awaiting real content.

## Contact

Met-Test Laboratories
Plot No. C-1-10, Road No. B-10, G.I.D.C. Estate, V.U. Nagar - 388121, Dist. Anand, Gujarat, India
Phone: +91 98253 21695 · Email: mettestlab@yahoo.com
