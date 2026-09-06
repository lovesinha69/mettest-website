# Indexing and search

## The problem this solved

Two separate faults were costing the site visibility.

**1. Ten services shared one URL.** `services.html` described all ten in about
570 words total, so one page was competing for ten different searches and could
only ever rank strongly for one of them. Each service now has its own page, its
own `<title>`, its own 400–490 words and its own structured data.

**2. Google reported "Page with redirect".** The sitemap, `robots.txt` and every
internal link were clean — the cause was the platform answering the old `.html`
URLs with a **307 Temporary** redirect, which tells a crawler to keep the old URL
and re-check it indefinitely. `public/_redirects` replaces those with 301s. Each
was verified as a single hop, with every canonical still returning 200.

## Current state

| | |
|---|---|
| Pages | 20 (`404.html` is intentionally excluded from the sitemap) |
| Sitemap URLs | 19 |
| Canonical tags | 19 (not on `404.html`, correctly) |
| Open Graph images | 20 |
| Internal links | ~660 |

### Structured data

| Type | Where |
|---|---|
| `LocalBusiness` | 11 pages |
| `BreadcrumbList` | 18 pages |
| `Service` | 12 pages |
| `FAQPage` | 11 pages |
| `ItemList` | `services.html` — the service catalogue, each item linking to its own page |

The `LocalBusiness` block on the home page carries `makesOffer`, and each offer
now carries the `url` of its service page, so the ten service names are things
Google can follow rather than loose strings.

## Rules to keep

- **One canonical per page**, extensionless (`/annealing`, never `/annealing.html`).
- **Never** let `workers.dev` or preview URLs serve the site — see
  [deployment.md](deployment.md#two-settings-that-matter-for-search).
- New page ⇒ add it to `public/sitemap.xml`, give it a canonical, and add it to
  `_headers` and `_redirects`.
- Re-run `npm run audit` after any change; it checks canonicals, sitemap
  coverage, metadata lengths and dead internal links.

## Routing is generated, not maintained

Every legacy URL form answers with a **301**, never a 307. This matters more
than it sounds: a 307 is *temporary*, which tells a crawler to keep the old URL
on file and re-check it indefinitely. That is what populates Search Console's
"Page with redirect" report.

`public/_redirects` and `public/_headers` are both produced by
`tools/build-routing.js` from the pages present in `public/`, covering:

| Form | Example | Answers |
|---|---|---|
| `.html` | `/annealing.html` | 301 → `/annealing` |
| trailing slash | `/annealing/` | 301 → `/annealing` |
| `/index`, `/index/` | | 301 → `/` |

Add a page, run `npm run build:routing`, and both files pick it up. They were
previously hand-maintained and fell behind when the ten service pages were
added, leaving all ten on a 307.

### A note on "Page with redirect"

It is **not an error**, and it must not be "validated". It is Google reporting
that a URL redirects, so it indexed the target instead — which is the intended
outcome. Clicking *Validate Fix* asks Google to confirm the URLs **no longer
redirect**; since they always will, that validation fails every time by design.

## Still outstanding

- Resubmit the 19-URL sitemap in Search Console and request indexing for the ten
  service URLs.
- `public/privacy.html` carries a TODO comment for the registered legal entity
  name and the named grievance officer.
- Ranjit Sinha's leadership card still shows `mettestlab@yahoo.com` rather than
  his own address.
- Directory listings on Justdial and IndiaMART give the founding year as 2014; it
  is 1998.
