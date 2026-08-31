# Google Business Profile

The profile is the single biggest lever on local search for a business like this,
and it is managed entirely through Google's own UI — nothing here deploys to it.
This file records what is set and why, so the reasoning is not lost.

**Profile:** Met-Test Laboratories · Vitthal Udyognagar, Anand, Gujarat · Verified

## Categories

| Category | Role |
|---|---|
| Metal heat treating service | **Primary** |
| Metal fabricator | Secondary |

Only one secondary category is set, deliberately. Google's picker also offers
Industrial engineer, Engineering consultant, Metal finisher, Metal industry
suppliers and similar. They were all rejected: they describe work the company
does not do, and a wrong category pulls the wrong enquiries and can trigger a
suspension review. "Metal fabricator" is accurate because induction coils are
designed and brazed in-house.

## The ten services are published as Products, not Services

**Google does not offer a Services field for this profile.** That was verified
five ways:

1. `Edit profile → Business information` has only About / Contact / Location /
   Hours / More — no Services tab, re-checked after a full reload.
2. The profile action row offers "Edit products", not "Edit services".
3. The public Maps profile has only Overview / Reviews / About.
4. The profile-completion wizard never suggests adding services.
5. Nothing in the overflow menu.

Service-list availability is gated by category and country; for "Metal heat
treating service" in India, Google exposes **Products** instead. The ten services
are therefore published as ten product entries.

### What is published

Data lives in [`tools/gbp-products.json`](../tools/gbp-products.json) — the
authoritative copy for all ten, matching the wording on each service page.

| Product category | Items |
|---|---|
| Heat Treatment Services | Induction Hardening, Hardening & Tempering, Heat Treatment, Annealing, Normalising, Stress Relieving, Solution Annealing, Flame Hardening |
| Testing & Inductor Manufacturing | Inductor Manufacturing, Material Testing |

Every entry carries a description and a **landing-page link to its own URL on
mettestlab.com** — ten links from a Google-owned surface into the ten service
pages.

### Images

**A photo is mandatory on every product.** The field carries no asterisk, but
publishing without one is rejected with "Add a product photo".

```bash
npm run build:gbp        # -> build/gbp-products/*.jpg
```

The sources are the YouTube poster frames in `public/img/video/`, which are 16:9.
Google crops a product card towards square, which would slice the title off the
left of every frame — so each card is rebuilt as a 1200×1200 square: the full
frame centred over a blurred, darkened copy of itself. Nothing important sits
near an edge, so nothing important can be cropped away.

Upload by hand: **Edit products → the product → Select a photo.**

> **Note on one image.** The Stress Relieving frame has a swastika painted on the
> furnace door. In an Indian works that is the ordinary auspicious marking, but
> this listing is visible worldwide to people who will not have that context.
> It was published as supplied, deliberately. To swap it, use the furnace-interior
> shot from `public/img/gallery/` instead.

## Outstanding owner actions

- Add a storefront photo (the only step the completion wizard still asks for).
- Reply to the reviews — 3.2★ from 9, including four 1★ with no owner response.
  Owner replies are a ranking and conversion signal; unanswered 1★ reviews are
  the single worst thing on the profile.
- The profile lists the opening date as 1998, which is correct. Justdial and
  IndiaMART both say 2014 and should be corrected.
