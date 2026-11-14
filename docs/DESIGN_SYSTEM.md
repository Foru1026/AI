# NODDAL — Design System

Reference: <https://noddal.xyz/> (production build + Figma "Pavel / Nikolay. Awwwards Sprint s.26",
frames 390 / 768 / 1440).

Every value below is the one implemented in `src/styles/design-system/tokens.css`. Values were
either copied from the original Figma tokens file or measured from the original production
stylesheet — nothing is approximated. Centralizing them was verified with a computed-style diff of
all 301 rendered nodes at 390×844, 891×906 and 1440×900 (three scroll positions each):
**0 differences** against the pre-refactor build.

## 1. Structure

```
src/styles/design-system/
  index.css     entry: imports fonts.css + tokens.css (first import in src/main.tsx)
  fonts.css     @font-face rules
  tokens.css    every CSS custom property (single source of truth)
src/config/tokens.ts   typed token names for TS/WebGL code (no values)
src/config/breakpoints.ts  breakpoint numbers + media queries for JS
```

Rules:

- Stylesheets reference tokens only through `var(--…)`. New raw values go into `tokens.css` first.
- `tokens.ts` holds names, never values. Read values at runtime:
  ```ts
  import { cssVar, readToken, readNumberToken } from "@/config/tokens";
  el.style.color = cssVar("--color-white");          // "var(--color-white)"
  const fade = readToken("--scene-fade");             // "0.35s"
  const gutter = readNumberToken("--space-16");       // 16
  ```
- `node _ref/check-tokens.cjs` verifies `tokens.css` and `tokens.ts` list the same names
  (currently 158 = 158).

## 2. Fonts

| Family | Files (original, from noddal.xyz) | Weights | Licence |
|---|---|---|---|
| Neue Haas Grotesk Display Pro | `NeueHaasDisplay-Light/Roman/Medium.woff2` | 400 = 45 Light, 500 = 55 Roman, 600 = 65 Medium (unused) | **Commercial (Monotype).** Not publicly licensable; files kept for local reproduction only. A public deployment needs a Monotype web licence. |
| Geist Mono | `GeistMono-Light/Regular/Medium/Bold.woff2` | 300, 400, 500, 700 | SIL Open Font License 1.1 — `public/assets/interface/fonts/GeistMono-LICENSE.txt` |

- Files live in `public/assets/interface/fonts/`. All use `font-display: swap`. The display Light
  and Roman faces plus Geist Mono Regular are preloaded in `index.html`.
- Weight numbers are the files' own weight classes, so they match Figma Dev Mode.
- Stacks: `--font-display: "Neue Haas Grotesk Display Pro", "Helvetica Neue", Arial, sans-serif`,
  `--font-mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace`.
- Quirk kept from the original: footer social links (`nav a`) declare `"Marund Tip 5200"`, which
  is never loaded, so they render in Arial.

## 3. Original assets

All assets are the originals served by noddal.xyz. No stock substitutes are used. Models, images and
contact details belong to übernatural, so use them for local reproduction only.

| Group | Path (`public/`) | Notes |
|---|---|---|
| Logo | `assets/interface/svg/logo.svg` | 137.635 × 32 (`--logo-w`, `--logo-h`) |
| Connectors | `assets/interface/svg/connector-{mobile,desktop}.svg` | Hero fact connector lines |
| Footer art | `assets/footer/brand-mark.svg`, `wordmark-{mobile,tablet,desktop}.svg`, `rule-left[-mobile/-tablet].svg`, `rule-right-{mobile,tablet,desktop}.svg`, `submit-arrow-{mobile,tablet,desktop}.svg` | One asset per breakpoint, as in the original |
| Cursor | `assets/cursor/frame.svg`, `native.css` | Bracket frame around the custom cursor |
| Textures | `assets/img/Regular-BG-2_compressed.jpg` (sky), `eye-ball-tex.png`, `glass-tunnel-fallback.png`, `glass-cards/glass-img 1–20.jpg` | |
| Portal | `assets/portal/portal.jpg`, `depth.jpg` | Colour + depth map |
| 3D | `assets/models/central-cube.glb`, `rock.glb`, `server-module.glb`, `assets/environment/studio-softboxes.hdr` | |
| Meta | `favicon.svg`, `assets/social/og-image.jpg` | |
| Preloader | `assets/preloader/preloader.{css,js}` | Original preloader |
| Datacluster | `datacluster/` (35 files) | Iframe scene, `glass.html?embedded=1` |

Paths are exposed to code through `ASSETS` in `src/config/assets.ts`.

## 4. Colour

### Brand (Figma)

| Token | Value | Use |
|---|---|---|
| `--color-white` | `#ffffff` | Text, button fill, markers |
| `--color-black` | `#000000` | Button text, fades |
| `--color-blue` | `#1f85d9` | Figma brand blue (reserved) |
| `--color-orange` | `#ff976b` | Mobile tunnel glow (reserved) |
| `--color-avatar-badge` | `#ebe3e1` | Figma "Avatar Bage" (reserved) |

### Alphas

| Token | Value | Use |
|---|---|---|
| `--white-60` | `rgba(255,255,255,.6)` | Link hover |
| `--white-50` | `rgba(255,255,255,.5)` | |
| `--white-40` | `rgba(255,255,255,.4)` | Muted text, field labels, chapter nav idle |
| `--white-20` | `rgba(255,255,255,.2)` | Stat brackets |
| `--white-10` | `rgba(255,255,255,.1)` | Glass cards (reserved) |
| `--grey-15` | `rgba(168,168,168,.15)` | Mobile social widget (reserved) |
| `--divider` | `rgba(255,255,255,.16)` | Divider (white 40% at 40% layer opacity) |
| `--divider-mobile` | `rgba(255,255,255,.12)` | |
| `--divider-v-mobile` | `rgba(255,255,255,.24)` | Vertical divider, mobile |

### Glitch channels

These colours are used in the headline and chapter-nav glitch.

| Token | Value |
|---|---|
| `--color-glitch-red` | `#ff3149` |
| `--color-glitch-cyan` | `#7ccaff` |
| `--color-glitch-blue` | `#288cff` |

### Surfaces

These are the colours painted behind the WebGL layers.

| Token | Value | Where |
|---|---|---|
| `--surface-root` | `#03070a` | `<html>` |
| `--surface-page` | `#01050a` | body, hero stage, continuation iframe |
| `--surface-tunnel` | `#00040d` | Glass tunnel canvas |
| `--color-text-root` | `#f3f8fb` | Default text outside the interface |
| `--color-tunnel-flash` | `#f5fcff` | Tunnel fallback white-out |

## 5. Gradients and background effects

| Token | Value |
|---|---|
| `--gradient-h1` | `linear-gradient(90deg, #ffffff 0%, rgba(255,255,255,.6) 100%)` |
| `--gradient-h2` | `linear-gradient(90deg, #ffffff 0%, rgba(169,169,169,.3) 100%)` |
| `--gradient-fade` | `linear-gradient(180deg, rgba(0,0,0,0) 0%, #000000 100%)`: section bottom fade |
| `--gradient-fade-top` | `linear-gradient(0deg, #0000, #000)`: section top fade |
| `--gradient-atmosphere` | `radial-gradient(circle at 50% 48%, rgba(89,175,255,.055), transparent 25%), linear-gradient(180deg, #00040838, #0003070a 42%, #0004082e 70%, #0000008c)`: blue core glow plus vignette over the hero canvas |
| `--gradient-glitch-flare` | `radial-gradient(ellipse at 35% 50%, #7ccaff40 0%, #288cff10 30%, transparent 65%), radial-gradient(ellipse at 65% 50%, #288cff60 0%, #288cff18 32%, transparent 65%)` |
| `--mask-hidden` | `radial-gradient(circle, transparent 0, transparent 100%)`: footer mask until JS sets `--footer-mask` |

Fade heights (`--fade-h`) are 30.69% on mobile (259/844), 25.3% on tablet (259/1024) and 22.222% on
desktop (200/900).

The 3D scenes (rock, cube, glass tunnel, portal, datacluster) render in WebGL and are not CSS
tokens.

## 6. Shadows and glows

| Token | Value |
|---|---|
| `--shadow-autofill` | `inset 0 0 0 100px #000`: hides the browser's autofill fill on footer inputs |
| `--glow-glitch-cyan` | `0 0 3px #7ccaff, 0 0 14px #7ccaff99, -9px 0 28px #288cff55` |
| `--glow-glitch-blue` | `0 0 3px #288cff, 0 0 16px #288cffaa, 9px 0 30px #288cff66` |
| `--blur-card` / `--blur-widget` | `27px` / `12px`: Figma background blurs (reserved) |

The original design has no box shadows on cards or buttons.

## 7. Typography

### Weights

| Token | Value |
|---|---|
| `--fw-display-light` | 400 (NHG 45 Light) |
| `--fw-display-roman` | 500 (NHG 55 Roman) |
| `--fw-mono-light` | 300 |
| `--fw-mono-regular` | 400 |
| `--fw-mono-medium` | 500 |

### Fluid roles

Each role hits its exact Figma size at 390, 768 and 1440. Between those widths it scales linearly in
two `clamp()` segments, switching at 768.

| Token | 390 | 768 | 1440 |
|---|---|---|---|
| `--fs-h1` | 44 | 54 | 80 |
| `--fs-h2` | 36 | 42 | 48 |
| `--fs-body` | 16 | 16 | 16 |
| `--fs-label` | 14 | 14 | 16 |
| `--fs-fact` | 12 | 16 | 16 |
| `--fs-body-light` | 12 | 12 | 16 |
| `--fs-small` | 12 | 12 | 12 |
| `--fs-button` | 14 | 14 | 14 |
| `--fs-h1-mono` | 16 | 16 | 20 |
| `--fs-h2-mono` | 16 | 16 | 16 |
| `--fs-label-mono` | 14 | 14 | 18 |
| `--fs-footnote-mono` | 12 | 12 | 14 |
| `--fs-nav-mono` | 12 | 12 | 14 |
| `--fs-body-mono` | 12 | 12 | 12 |

Below 390 px, H1 and H2 shrink with the 358 px text column (`(100vw − 32px) × 0.1229` and
`× 0.10056`), so the Figma line breaks never change.

### Fixed sizes

These are used in the footer, cursor and captions: `--font-size-10`, `-11`, `-12`, `-14`, `-16`,
`-36` and `-48`, each equal to its number in px.

### Line height and letter spacing

| Token | Value | | Token | Value |
|---|---|---|---|---|
| `--lh-none` | 1 | | `--ls-none` | 0 |
| `--lh-tight` | 0.9 | | `--ls-tight` | −0.02em (Figma −2%) |
| `--lh-snug` | 1.1 | | `--ls-body` | 0.02em (Figma 2%) |
| `--lh-normal` | 1.25 | | `--ls-mono-wide` | 0.2em (Figma 20%) |
| `--lh-loose` | 1.4 | | `--ls-body-fixed` | 0.32px (footer description and fields; stays 0.32px at 14px) |
| `--lh-small` | 1.45 | | | |

### Utility classes

These are defined in `src/styles/typography.css` and scoped to `.site-interface`.

| Class | Family / weight | Size | Line height | Tracking | Case |
|---|---|---|---|---|---|
| `.t-h1` | display 500 | `--fs-h1` | 1 | −2% | |
| `.t-h2` | display 500 | `--fs-h2` | 0.9 | −2% | |
| `.t-body` | display 500 | `--fs-body` | 1.1 | 2% | |
| `.t-label` | display 500 | `--fs-label` | 1.1 | −2% | upper |
| `.t-body-light` | display 400 | `--fs-body-light` | 1 | −2% | |
| `.t-small` | display 400 | `--fs-small` | 1.45 | | |
| `.t-button` | display 400 | `--fs-button` | 1 | | |
| `.t-h1-mono` | mono 300 | `--fs-h1-mono` | 0.9 | 20% | upper |
| `.t-h2-mono` | mono 400 | `--fs-h2-mono` | 1.1 | 20% | upper |
| `.t-label-mono` | mono 400 | `--fs-label-mono` | 1.1 | | upper |
| `.t-footnote-mono` | mono 400 | `--fs-footnote-mono` | 1 (1.1 from 1024) | | upper |
| `.t-body-mono` | mono 400 | `--fs-body-mono` | 1.1 | | upper |
| `.t-nav-mono` | mono 500 | `--fs-nav-mono` | 0.9 | | upper |
| `.text-gradient-h1` / `-h2` | gradient text (`background-clip: text`, 0.2em bottom padding compensated) | | | | |

## 8. Spacing, layout and containers

**Spacing scale (px):** `--space-2`, `-4`, `-6`, `-8`, `-12`, `-16`, `-20`, `-24`, `-28`, `-32`,
`-40`, `-48`, `-56`, `-64`, `-80` and `-84`. Of these, 56 and 84 are Figma values that aren't used
yet.

| Token | Value |
|---|---|
| `--gutter` | `clamp(16px, 3.619px + 3.1746vw, 28px)`: 16 at 390, 28 from 768 |
| `--block-pad-y` | 32px (28px from 1024) |
| `--header-pad` / `--header-h` | 28px / 88px |
| `--scene-min-h` / `--hero-min-h` | 600px / 620px |
| `--stage-ratio` | 0.55806 (471/844) → 0.75 (768/1024) → 1.6 (1440/900) |
| `--chapter-nav-top` | 104px → 108px from 768 (vertically centred from 1024) |
| `--dot` / `--marker` | 4px / 6px |

| Container | Value | Use |
|---|---|---|
| `--container-text` | 390px | Hero lead, scene titles |
| `--container-hint` | 358px | Portal hint on mobile |
| `--container-hint-wide` | 340px | Portal hint from tablet |
| `--container-lead` | 240px | Hero lead on desktop |
| `--container-tag` | 178px | Scene tag on desktop |
| `--container-module-title` | 300px | Module bar centre column |
| `--container-headline` | 14ch | Story headlines |
| `--container-proposal` | 682px | Footer form block on desktop |
| `--container-form-column` | 331px | Footer left column from tablet |
| `--container-footer-min` | 770px | Minimum footer row width on tablet |

## 9. Radii

| Token | Value | Use |
|---|---|---|
| `--radius-none` | 0 | Inputs, submit wrapper |
| `--radius-sm` | 4px | Submit label and arrow tile |
| `--radius-round` | 50% | Cursor dots |

All other elements in the design are square.

## 10. Breakpoints

| Token | Value | CSS query |
|---|---|---|
| `--bp-tablet` | 768px | `(min-width: 768px)` / `(max-width: 767.98px)` |
| `--bp-desktop` | 1024px | `(min-width: 1024px)` / `(max-width: 1023.98px)` |
| `--bp-narrow-max` | 374px | `(max-width: 374px)`: phones narrower than the frame |
| `--bp-short-max` | 680px | `(max-height: 680px)`: short desktops |
| `--frame-mobile` / `-tablet` / `-desktop` | 390 / 768 / 1440px | Figma design frames |

A legacy original rule also applies at `(max-width: 560px)`: `--hero-scroll-screens: 3.1` and a hero
`min-height` of 560px.

CSS variables can't be used inside `@media`, so the `--bp-*` tokens are documentation mirrors of
the literal queries. In JS, use `src/config/breakpoints.ts`, which provides `BREAKPOINTS`, `MEDIA`,
`layoutFor()` and the hooks `useLayout()` and `useMediaQuery()`. The WebGL device profile is
separate: mobile is ≤ 760 px; tablet is ≤ 1024 px or any coarse pointer (`deviceProfile()`).

## 11. Buttons and links

**Submit button (footer form):** a white label tile next to a square white arrow tile. Both tiles
have 4px radii and black text.

| Property | Value |
|---|---|
| Height | `--button-h`: 40px (48px from 1024, back to 40px at ≥1024 with `max-height: 680px`). Desktop fields use the same height. |
| Label font | `--fw-display-light` `--font-size-14` / `--lh-none` `--font-display`, tracking 0 |
| Fill / text | `--button-bg` `#fff` / `--button-fg` `#000` |
| Radius | `--button-radius` (= `--radius-sm`, 4px) |
| Arrow tile | Full height, aspect ratio 30.4853515625 / 30; arrow 10.485 × 10 (original per-breakpoint SVG) |
| Hover | `filter: var(--button-hover-filter)`, i.e. `brightness(0.9)` |
| Disabled | `opacity: var(--button-disabled-opacity)` (0.6), `cursor: wait` |

**Links:**

| Link | Idle | Hover / active | Transition |
|---|---|---|---|
| Footer social (`nav a`) | `#ffffff80`, 16px / 1.25, no underline | `--color-white` | `color 0.2s` |
| Footer email | inherits, `underline`, `text-underline-position: from-font` | `--link-hover` (white 60%) | |
| Chapter nav item | `--nav-link` (white 40%) | `--nav-link-active` (white) plus a 6px square marker | `color var(--dur-fast)` |

**Focus:** `outline: var(--focus-ring)` (1px solid #fff) with `outline-offset: var(--focus-offset)`
(6px). Footer inputs use a 4px offset.

## 12. Motion

| Token | Value | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Reveals, cursor dot |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Figma (reserved) |
| `--ease-standard` | `ease` | Scene crossfades, cursor tone |
| `--ease-exit` | `ease-out` | Footer hide |
| `--dur-fast` | 200ms | Link colour, footer settle |
| `--dur-cursor-tone` | 0.24s | Cursor light/dark swap |
| `--dur-cursor-fade` | 0.3s | Cursor show/hide |
| `--dur-cursor-dot` / `--delay-cursor-dot` | 0.38s / 70ms | Trailing cursor dot |
| `--dur-footer-hide` / `--dur-footer-reveal` | 0.25s / 0.75s | Footer content |
| `--scene-fade` | 0.35s | Scene and chapter-nav crossfade |
| `--reveal-shift` | 14px | Reveal travel distance |
| `--reveal-in` / `--reveal-out` | 0.65s / 0.35s | `[data-reveal]` enter / exit |
| `--reveal-stagger` | 60ms | Per-element delay: `calc(var(--i,0) * var(--reveal-stagger))` |

Scroll-driven motion (hero timeline, camera paths, WebGL shaders) lives in `src/lib/timeline.js`
and the scene components, not in CSS tokens. `prefers-reduced-motion` is exposed via
`useReducedMotion()`.

## 13. Z-index

| Token | Value | | Token | Value |
|---|---|---|---|---|
| `--z-base` | 0 | | `--z-content` | 3 |
| `--z-media` | 0 | | `--z-interface` | 5 |
| `--z-raised` | 1 | | `--z-nav` | 20 |
| `--z-overlay` | 1 | | `--z-header` | 50 |
| `--z-fade` | 2 | | `--z-cursor` | 100 |

## 14. Removed during centralization

- **Music:** the audio player, its sources and its assets.
- **Unused placeholder tokens:** `--media-settle`, `--reveal-delay`, `--dur-base` and `--dur-slow`.
  The reveal timings above are the values actually implemented.
- **Dead stylesheets and rules:** `subject-cards.css`, the unreferenced half of `legacy-ui.css` (the
  remainder is now `legacy.css`), the `@keyframes reveal` rule, and the grove, subject-card,
  `.scene__media`, `.pin--center` and `.from-tablet` rules. None of these matched any rendered
  element.
- `fonts.css` and `tokens.css` moved from `public/assets/interface/` into
  `src/styles/design-system/`, so Vite bundles them. `index.html` keeps only the font preloads.
