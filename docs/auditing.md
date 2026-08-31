# The audit

```bash
npm run audit                 # audits public/
node tools/audit.js <dir>     # or any other directory
```

Reports only; it never edits a file. Run it after any content or template change.

## What it checks

- Tag balance and duplicate `id`s
- Dead internal links, and links to assets that do not exist
- `alt` text on images, accessible names on buttons and links
- Form controls have labels — accepting `<label for>`, implicit `<label>`
  wrapping, and `aria-label`/`aria-labelledby`, and skipping `aria-hidden`
  controls such as the spam honeypot
- `<title>` and meta description present and within sensible lengths
- Canonical present, and sitemap coverage
- Heading hierarchy
- CRLF line endings (which would break the byte anchors used by the copy tools)
- Nav and footer identical across every page that shares them

## Current result

```
=== ERRORS (0) ===
=== WARNINGS (3) ===
  [404.html] no canonical link
  [about.html] <img> without width/height (layout shift)
  [privacy.html] comment placeholder: OWNER TO CONFIRM ...
20 pages audited
```

The 404 warning is expected — an error page should not claim a canonical.
The other two are genuine and listed in [seo.md](seo.md#still-outstanding-owner-actions).

## A caution about the label check

The label rule previously understood only `<label for="x">`, so it reported the
consent checkbox on all 16 form pages as unlabelled, and demanded a label on the
`aria-hidden` spam honeypot — where adding one would have been a defect, not a
fix. That was 32 false errors, which is exactly how a checker gets ignored.

If you extend the audit, add a fixture with a control that genuinely *is*
unlabelled and confirm the check still fails on it. A rule that reports nothing
is indistinguishable from a rule that is broken.
