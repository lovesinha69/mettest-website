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

## Known gaps

These are real and currently unfixed. They were introduced when the ten service
pages were added and both platform files were left listing only the original nine
routes.

1. **`public/_redirects` misses the ten service pages.** `/annealing.html` and
   the other nine still answer with the platform's 307 rather than a 301. Low
   impact — nothing links to those `.html` forms and they were never indexed —
   but it is the same defect the file exists to fix.
2. **`public/_headers` misses the ten service pages.** Their HTML is not forced
   to revalidate, so after a deploy an edge or browser cache can serve a stale
   service page for longer than the other nine.

Both are a one-line-per-route addition to the respective file, followed by
`npm run deploy`. They were left alone deliberately so that packaging this
repository did not change live site behaviour.

## Still outstanding (owner actions)

- Resubmit the 19-URL sitemap in Search Console and request indexing for the ten
  service URLs.
- `public/privacy.html` still contains an HTML comment placeholder for the
  registered legal entity name and the named grievance officer.
- Certification badges are worded "capabilities aligned to". If the certificates
  are actually held, restate them as held.
- Ranjit Sinha's card still shows `mettestlab@yahoo.com`.
- The client marquee names 21 real companies — worth confirming they are happy to
  be listed.
- Founding year is wrong on Justdial and IndiaMART (they say 2014; it is 1998).
