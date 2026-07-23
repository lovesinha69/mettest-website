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

## To-do / notes

- **Contact form**: the enquiry form does not send anywhere yet — connect it to a
  backend (e.g. Formspree) to deliver submissions by email.
- **Placeholder content**: process step durations, founding year, leadership
  names/bios, and factory/industry photos/videos are placeholders awaiting real content.

## Contact

Met-Test Laboratories
Plot No. C-1-10, Road No. B-10, G.I.D.C. Estate, V.U. Nagar - 388121, Dist. Anand, Gujarat, India
Phone: +91 98253 21695 · Email: mettestlab@yahoo.com
