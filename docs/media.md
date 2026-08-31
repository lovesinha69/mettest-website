# Images and video

Every binary in `public/img/` is generated from an original by a script in
`tools/`. Nothing is hand-cropped, so any change is reproducible and reviewable.

All image tools use [sharp](https://sharp.pixelplumbing.com/) and share the same
rules:

- `.rotate()` first, so an EXIF-rotated original is not silently cropped sideways
- Lanczos3 resampling, `withoutEnlargement` so nothing is upscaled
- WebP at q92 plus a JPEG fallback at q90 (4:4:4, mozjpeg)
- Explicit `width`/`height` on every `<img>` so the page does not shift as it loads

## Leadership portraits

`tools/build-leader-photos.js` with `tools/leader-photos.json`.

Crops are stored as **fractions of the upright image**, not pixels, so they stay
correct if a source photo is ever re-exported at a different resolution:

```json
{ "side": 1, "left": 0, "top": 0.0993 }
```

`top` is what controls headroom. The four portraits were re-cropped once to cut
dead space above the heads; raising `top` moves the crop window down the source
image. All four are matched to the same visual scale.

Sources live outside the repo (they are unedited camera originals). Pass the
folder as the second argument:

```bash
node tools/build-leader-photos.js public "<folder of originals>"
```

## About-page photo strip

`tools/build-about-gallery.js` with `tools/about-gallery-captions.json`.
Ten facility photographs at 240 / 480 / 2400 px.

The strip took four passes to stop it juddering on desktop, and each fix is load
bearing:

1. A `mask-image` gradient forced the browser to re-rasterise the strip every
   frame — replaced with static `::before` / `::after` gradients.
2. The track was never promoted to its own compositor layer — fixed with
   `translate3d` plus `backface-visibility`.
3. Tiles were `loading="lazy"` **and** clipped, so 0 of 20 ever loaded — switched
   to eager loading on intersection with a 400 px `rootMargin`.
4. Tile widths were computed from `100cqw`, landing on fractional pixels
   (111.704 px on a display at DPR 1.198) and forcing sub-pixel resampling every
   frame — replaced with a fixed `--tile` of 137 px / 68 px.

Removing `container-type` for step 4 then let the grid blow out to 2892 px, which
`.about-story-body { min-width: 0 }` contains. If you touch this strip, re-check
all five things.

## Industry cards

`tools/build-industry-images.js`. Six cards, each rewritten within its **own byte
range**, with an assertion that the card still contains exactly one `ind-title`:

```js
must((card.match(/ind-title/g) || []).length === 1);
```

That guard exists because an earlier document-wide regex matched the start of one
card to the end of another and destroyed four of them. Keep the per-card ranges.

Icons are inlined SVG. Use literal Unicode characters, not HTML entities —
`&rarr;` and `&Oslash;` are undefined in standalone SVG and break parsing.

## Video

Eleven videos, all on YouTube, wired in by `tools/build-youtube.js` from
`tools/youtube.json`.

```bash
npm run build:youtube               # wire all slots
node tools/build-youtube.js public --refresh <slot>   # re-pull one thumbnail
node tools/build-youtube.js public --refresh all
```

Channel: https://www.youtube.com/@mettestlab (`UC5HmQJGyCzb7hE4HUA9DA_A`)

Why YouTube rather than self-hosting:

- Cloudflare's static assets **do not support HTTP `Range`**, so a self-hosted
  video cannot be seeked — it can only play from the start.
- Cloudflare Stream bills per minute of delivery with **no spend cap**, so a
  scripted request flood is an uncapped bill.
- Cloudflare's CDN terms restrict serving externally-hosted video on non-Enterprise
  plans.

Embeds use `youtube-nocookie.com` with `rel=0` and a click-to-load poster, so no
YouTube request is made until a visitor actually presses play.

Posters are the `maxresdefault` thumbnails, cached into `public/img/video/`. If
you change a thumbnail on YouTube, the site keeps serving the cached copy until
you re-run `--refresh` for that slot.

`hero.mp4` (2.2 MB) is the one self-hosted video: short, muted, autoplaying, and
never seeked, so the missing `Range` support does not matter.

### The shared play button

Six pages share one handler that accepts three sources — a local file, a
Cloudflare Stream UID, or a YouTube ID — and hides the button only if all three
are absent:

```js
if (!hasFile && !hasStream && !hasYouTube) { playBtn.classList.add('hidden'); return; }
playBtn.classList.remove('hidden');
```

That final line matters: the button ships with `class="... hidden"` in the HTML,
so a handler that only ever *adds* the class leaves the video unplayable forever.
