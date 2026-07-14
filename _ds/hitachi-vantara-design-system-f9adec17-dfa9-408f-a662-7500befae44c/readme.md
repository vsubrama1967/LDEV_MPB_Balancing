# Hitachi Vantara — Design System

A brand design system for **Hitachi Vantara**, the data-infrastructure company
behind the VSP One storage platform (Block, File, Object, SDS and Cloud). The
brand voice is enterprise, confident and outcome-driven, centered on a single
hero color — **Hitachi red** — over a disciplined black / white / gray base.

This system gives design agents the tokens, components, assets and full-screen
references needed to produce on-brand slides, marketing pages and product UI.

## Sources

Everything here was reverse-engineered from one provided asset:

- `uploads/Hitachi Vantara PPT Template 16x9 12Feb2026.pptx` — the official
  16:9 PowerPoint master (47 slides, 67 slide layouts). Colors, fonts, the
  HITACHI wordmark, graphic textures, photography and the line-icon + VSP One
  icon libraries were all extracted from it and curated into `assets/`.

No product UI source code, website source, or Figma file was provided. The
marketing-web UI kit is therefore a brand *application* of this system, not a
pixel copy of a live product (see caveats below).

The template references the **Hitachi Brand Portal** (`brand.hitachi.com`) and
the **Hitachi Vantara Image Library** as the canonical sources for production
assets and licensed fonts.

---

## Content Fundamentals

**Voice.** Corporate, declarative and benefit-led. The brand speaks as
"we"/Hitachi Vantara to a "you" that is an enterprise buyer. Sentences are
plain and active: short claims followed by the mechanism. Example from the
template: *"It takes both partnership and innovation to drive transformation.
Whether it's transformation of our own business or accelerating a sustainable
future for all, we are delivering real impact and value to society."*

**Themes.** Recurring vocabulary: *transformation, sustainability,
decarbonization, data-driven society, mission-critical, productivity,
real impact and value to society, partnership, innovation.* Sustainability and
"a data-driven and sustainable society" are central, not decorative.

**Casing.** Sentence case for headlines and UI ("Achieving a data-driven and
sustainable society"). The wordmark **HITACHI** is the only all-caps lockup.
Short uppercase overlines/eyebrows with wide tracking label sections
("DATA INFRASTRUCTURE", "SECTION 02"). Avoid Title Case in headlines.

**Numbers.** Big, rounded, suffixed impact figures are a signature device —
`$13B+`, `120+`, `68%` — always set large and in red. Lead charts with red as
the single most important data point; supporting series use the data palette.

**Confidentiality.** Decks carry a standing line: *"CONFIDENTIAL — For use by
Hitachi Vantara employees and other audiences under NDA only,"* and a copyright
line *"© Hitachi Vantara LLC [year]. All rights reserved."*

**Emoji.** None. The brand never uses emoji. Iconography is the line-icon set.

---

## Visual Foundations

**Color.** One hero: **Hitachi Red 1 `#FA000F`** (with deeper `#CC0000`).
Everything else is a near-monochrome ramp from `#FFFFFF` through six grays to
brand black `#0C0C0C`. Red is used sparingly and with intent — CTAs, the
accent rule, the lead data point, big stats — never as a wash behind text. A
broader **data-visualization palette** (orange/yellow/green/teal/blue/purple/
pink, each in tint/mid/dark) exists strictly for charts. Red tints and shades
(`tint-20…60`, `dark-20/40`) drive hover/press and soft surfaces. See
`tokens/colors.css`.

**Type.** Brand face is **Hitachi Sans** (proprietary). This system ships
**Hanken Grotesk** (Google Fonts) as the nearest free substitute plus **IBM
Plex Mono** for data/code — see the caveat below. Display and dividers are very
heavy (ExtraBold 800) and large (64–80px), tightly tracked (`-0.02em`).
Headings are Bold; body is Regular at 16–18px with generous 1.5–1.65 line
height. The uppercase overline (11px / 600 / 0.08em) labels sections.

**Backgrounds.** The signature motif is the **graphic texture** — smooth,
flowing ribbon gradients photographed as imagery, in three families: red
(covers, closings), black (quotes, moody sections) and light (subtle white).
Used full-bleed behind covers and dividers. Photography is enterprise and
slightly desaturated: data centers, manufacturing floors, engineers, plus warm
landscapes and gray dotted world maps. Headshots are circular.

**The red rule.** A short heavy red bar (≈48×4px) sits under headings and
section labels as the brand's punctuation mark (`.hv-rule`, `--border-w-accent`).
Cards may carry it as a top edge (`Card accent`).

**Shape & depth.** Squared-off and flat. Corners are tight (`radius-sm` 4px is
the workhorse; nothing rounder than 10px on containers). Shadows are soft,
neutral and low (no colored glows); most surfaces use a hairline gray border
instead of elevation. No gradients in UI chrome (gradients live only in the
photographic textures).

**Motion.** Quick and clean: 120–280ms, standard ease `cubic-bezier(.2,0,.1,1)`,
no bounce. Hover = subtle background/-border shift (red darkens via `dark-20`;
neutrals go to `gray-1`); press = a further darken (`dark-40`) — not a scale.
Focus = a 2px black border + a soft red-halftone ring on inputs.

**Cards.** White, 1px `gray-2` border, `radius-md` (6px), little or no shadow by
default; optional red top rule for emphasis; hover lifts to `shadow-md`.

---

## Iconography

- **Line pictograms** — the template's icon library is a single, consistent set
  of **stroke-only icons** (≈1.5px stroke, square-ish corners, on a 49×49 grid),
  black by default. 67 of them are curated into `assets/icons/` with semantic
  names (e.g. `server-rack`, `cloud-network`, `ai-sync`, `sustainability`,
  `analytics`, `handshake`). They were converted to `stroke="currentColor"` so
  they recolor by CSS `color` — use black on light, white on dark, or red as an
  accent. The brand guidance: change the *Shape Outline* color only (red or
  white); never fill them.
- **Product marks** — VSP One product icons (Block, File, Object, Cloud, etc.)
  are in `assets/icons/product/` as full-color SVGs; do not recolor these.
- **No emoji, no unicode glyphs** as icons. Small inline UI affordances
  (chevrons, checks, close ×) are drawn as tiny inline SVGs inside components.
- The full icon library (200+ marks) and licensed assets live on the Hitachi
  Brand Portal; this system ships a representative working subset.

---

## File index

- `styles.css` — root entry point (consumers link this); `@import` list only.
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `effects.css`,
  `fonts.css` (webfont imports), `base.css` (element + type-role styles).
- `components/`
  - `core/` — `Button`, `IconButton`, `Badge`, `Card`
  - `forms/` — `Input`, `Select`, `Checkbox`, `Switch`
  - `feedback/` — `Alert`, `Stat`
  - `navigation/` — `Tabs`
  - Each: `<Name>.jsx` + `.d.ts` + `.prompt.md`; one `*.card.html` per group.
- `slides/` — eight faithful template slide recreations (Slides cards, 1280×720):
  cover, divider, agenda, stats, quote, content-image, three-column, closing.
- `ui_kits/`
  - `marketing-web/` — full marketing landing page composed from the system.
  - `vsp-one-console/` — original brand-faithful storage-management console
    (dashboard + volumes). Not a recreation of the real product (no source given).
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing, Brand).
- `assets/` — `logos/`, `backgrounds/` (textures), `photos/`, `icons/` (+`product/`).
- `SKILL.md` — Agent Skill manifest for downloadable use.

Component namespace (for `@dsCard` / kit HTML):
`window.HitachiVantaraDesignSystem_f9adec`.

---

## Caveats

- **Fonts substituted.** Hitachi Sans is proprietary and was shipped in the
  PPTX only as obfuscated, subset embeds — not licensable to ship here. The
  system uses **Hanken Grotesk** as the nearest free match. Replace the
  `@font-face`/family references in `tokens/fonts.css` + `typography.css` with
  licensed Hitachi Sans webfonts for production.
- **Color typo corrections.** Two values in the source palette were obvious
  typos and were corrected: *Yellow 3* → `#967E00`, *Blue 1* → `#96C5FD`.
- **Marketing-web is a brand application,** not a copy of the live site (no
  source provided).
- **Icon subset.** 67 of 200+ line icons were curated; ask if you need more.
