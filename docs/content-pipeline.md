# Editing content

There are two ways copy gets changed, and they solve different problems.

## 1. The Word round trip — for reviewing all visitor-facing text

Every string on the site can be exported to a Word document, edited by someone
who has never seen HTML, and written back.

```bash
npm install                                  # once
npm run copy:export                          # -> Website-Copy.docx
# ...edit, then express the changes as edits.json: { "<ID>": "<new text>" }
npm run copy:apply                           # writes them back into public/
```

`build-docx.js` writes one row per string, each with a stable ID.
`apply-content.js` re-derives those IDs from the current HTML, so an export can
never silently go stale — **but the HTML must not be restructured between
exporting and applying.**

Two details make this safe:

- **Edits are spliced by byte range, not by re-serialising the DOM.** cheerio
  does not reproduce these files byte-for-byte, so writing the parsed tree back
  would churn every file and produce an unreviewable diff. Each string carries an
  anchor plus which occurrence of it to replace, and splices are applied
  back-to-front so earlier offsets stay valid.
- **The nav, footer and enquiry form are shared.** They are byte-identical across
  the pages that carry them, so they are exported once and written back to all of
  them. The exporter verifies they really are identical and fails loudly if they
  have drifted.

Line breaks (`<br>`) appear as `[br]` in the document and are re-emitted as real
tags. `&` is re-encoded to `&amp;` on write-back.

> Because edits are located by byte anchors that contain newlines, a checkout
> that rewrote LF to CRLF would break every anchor. `.gitattributes` pins
> `* text=auto eol=lf` to prevent exactly that. Do not remove it.

## 2. Generated pages — for anything with structure

Some pages are too repetitive to hand-maintain, so they have a generator in
`tools/` and a data file beside it. Edit the **data**, re-run the generator, and
review the diff.

| Page(s) | Data | Generator |
|---|---|---|
| The ten service pages | `tools/service-pages.js` | `npm run build:service-pages` |
| Process page | inline in generator | `npm run build:process` |
| Video embeds (11 slots) | `tools/youtube.json` | `npm run build:youtube` |
| GBP product cards | `tools/gbp-products.json` | `npm run build:gbp` |

### Service pages

`tools/service-pages.js` holds the content for all ten. `build-service-pages.js`
lifts the shared shell — head, nav, footer, enquiry modal, scripts — out of
`industries.html` rather than keeping its own copy, so the shared regions can
never drift away from the hand-written pages. It emits `Service`,
`BreadcrumbList` and `FAQPage` JSON-LD per page.

The header comment in `service-pages.js` draws a line that matters legally:

- **Process facts** — what annealing does, why tempering follows hardening.
  Standard metallurgy, true of anyone doing the work.
- **Capability claims** — furnace sizes, the 30,000 litre quench, the 40 tonne
  UTM. These are Met-Test's own published figures.

Nothing in there claims an approval, accreditation or customer that the company
has not already published. Keep it that way when editing.

## After any content change

```bash
npm run audit
```

See [auditing.md](auditing.md).
