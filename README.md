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
│   ├── index.html        # Home (hero + client marquee)
│   ├── services.html     # 10 heat-treatment services
│   ├── process.html      # 5-stage workflow + capabilities
│   ├── industries.html   # Industries served
│   ├── about.html        # Company story + leadership
│   └── contact.html      # Enquiry form + contact details
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
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';
```

To connect it, create a form at [formspree.io](https://formspree.io) with
`mettestlab@yahoo.com` as the recipient, then replace `YOUR_FORM_ID` in **all
six** HTML files and redeploy. The endpoint is a public URL, not a secret — it
is designed to sit in client-side code.

Until a real form ID is set, the form does **not** show a success message. It
tells the visitor it isn't connected and points them at the phone number and
email address instead, so no enquiry is ever silently lost.

Spam is filtered by a hidden `_gotcha` honeypot field, which Formspree discards
automatically. The free plan covers 50 submissions per month.

## To-do / notes

- **Placeholder content**: process step durations, founding year, leadership
  bios, and factory/industry photos/videos are placeholders awaiting real content.

## Contact

Met-Test Laboratories
Plot No. C-1-10, Road No. B-10, G.I.D.C. Estate, V.U. Nagar - 388121, Dist. Anand, Gujarat, India
Phone: +91 98253 21695 · Email: mettestlab@yahoo.com
