# Deployment

The site is a static-asset Cloudflare Worker. There is no build step for the
site itself: whatever is in `public/` is what gets served.

- **Live:** https://mettestlab.com
- **Worker name:** `broken-voice-4053`
- **Config:** [`wrangler.jsonc`](../wrangler.jsonc)

## Publishing

```bash
npm install -g wrangler   # once
wrangler login            # once
npm run deploy            # wrangler deploy
```

Everything in `public/` is uploaded and live within a few seconds. The custom
domain and its TLS certificate stay attached across deploys, so no DNS change is
ever needed.

## Rolling back

Cloudflare keeps previous versions. In the dashboard:
**Workers & Pages → broken-voice-4053 → Deployments →** pick a prior version and
promote it.

## Two settings that matter for search

`wrangler.jsonc` sets both deliberately:

```jsonc
"workers_dev": false,
"preview_urls": false,
```

Without these, Cloudflare also serves the whole site on `*.workers.dev` and on
per-deploy preview URLs. That publishes duplicate copies of every page on
hostnames nobody links to, which splits ranking signals between them and the
real domain.

`"not_found_handling": "404-page"` makes unknown paths render the styled
`public/404.html` instead of an empty white page with no way back into the site.

## Redirects and headers

Two plain-text files in `public/` are read by the platform, not by the browser.

**`public/_redirects`** turns the old `.html` URLs into 301s:

```
/services.html   /services   301
```

This exists because the platform's built-in `html_handling` answers those URLs
with a **307 Temporary Redirect**, and "temporary" tells a crawler to keep the
old URL on file and re-check it forever. Google Search Console reported these as
"Page with redirect". A 301 tells the crawler the move is permanent, so the old
URL is dropped and its link equity moves to the canonical one. Entries in
`_redirects` take precedence over the platform default.

**`public/_headers`** makes HTML revalidate so a deploy is seen immediately
rather than served stale from an edge or browser cache. It names each HTML route
explicitly rather than using a catch-all `/*`, because Cloudflare concatenates
every matching rule and a catch-all would also strip caching from fonts and
images.

> **Known gap.** Both files list only the nine original routes. The ten service
> pages added later are missing from both, so `/annealing.html` still answers
> with a 307 rather than a 301, and service-page HTML is not forced to
> revalidate. See [seo.md](seo.md#known-gaps).

## Platform limits worth knowing

| Limit | Value | Why it shaped this project |
|---|---|---|
| Max file size | 25 MiB | Fine for `hero.mp4` (2.2 MB) |
| Max files | 20,000 (free) | 224 tracked files, no concern |
| HTTP `Range` requests | **not supported** | A long video cannot be seeked, which is why the eleven service videos are on YouTube rather than served from here |
