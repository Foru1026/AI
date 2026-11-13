# NODDAL — Interactions and motion

This lists every interaction found on https://noddal.xyz/ and where each one is implemented. Timing
tokens are in `DESIGN_SYSTEM.md` §12; the values below are the ones the reference uses.

## Inventory

| Behaviour | Reference timing | Implementation |
|---|---|---|
| Loading screen | Percentage counter (`.np__pct`); the page becomes interactive once the preloader phase is `done` | `public/assets/preloader/preloader.js`, `src/lib/preloader.ts` |
| Smooth scroll (wheel, touch, keys) | Lenis, 1.8s `easeOutCubic`, wheel ×0.85, touch ×1; reversing direction cancels the running animation | `src/lib/timeline.js` `scrollBy`, `keyScrollDelta` |
| Scroll snapping | 0.85s, between hero→tunnel (tablet/mobile), tunnel→glass, eye→portal, portal→footer | `snapTarget`, `createSnapper` |
| Hero scroll timeline | Camera flight, portal enter / reveal / fade by page progress | `timeline.js`, `components/hero` |
| Cube pointer parallax | `damp(…, 4.2)` towards the pointer, settles to 0 while scrolling | `ServerCube.jsx` |
| Chapter nav (sticky) | Shown in the module section; crossfades 0.35s; active item white with a 6px marker | `ChapterNav.jsx` |
| Chapter nav click | Programmatic scroll, 2s smoothstep, followed by the headline glitch | `navigateTo`, `glitch.js` |
| Headline glitch | 1000ms linear, `steps(1, end)` frames, channel flare frames | `glitch.js` |
| Logo click | Scrolls back to the top with the same 2s smoothstep | `SiteHeader.jsx`, `go()` |
| `[data-reveal]` entrance / exit | 14px travel, 0.65s in / 0.35s out, `--ease-out`, 60ms stagger | `interface.css` |
| Stat counters | Digits tick while their module is active | `ModuleBar.jsx`, `SiteInterface.jsx` `update()` |
| Custom cursor | Fades in on first pointer move (0.3s), trailing dot 0.38s with a 70ms delay, label roll 420ms `cubic-bezier(.22,1,.36,1)`, light/dark swap 0.24s; hidden on coarse pointers | `CustomCursor.jsx` |
| Footer entrance | 750ms `cubic-bezier(0.22,1,0.36,1)`, staggered 0–1200ms per element (later delays below 768px); exits in 0.25s `ease-out` | `footerDelay`, `ContactFooter.jsx` |
| Footer memory | After the first reveal in a session (`sessionStorage` `noddal:footer-entered:v1`), the footer reappears without the stagger | `footerMemory` |
| Link hover | Footer social links: `#ffffff80` → white, `color 0.2s`. Email: white 60% on hover. Chapter nav: `color 200ms` | `footer.css`, `interface.css` |
| Submit button | Hover `brightness(0.9)`; disabled while sending (opacity 0.6, `cursor: wait`) | `footer.css` |
| Focus | 1px white outline, 6px offset (4px on footer inputs) | `interface.css`, `footer.css` |
| Contact form | Native validation, then pending state, then a status message | `lib/contact.js` |

Not present in the reference, so not implemented: dropdowns, modals, carousels, page transitions
(it is a single page), and a mobile menu. "Privacy" and "Terms" in the footer are plain text, not links.

## Reduced motion

With `prefers-reduced-motion: reduce`, chapter nav and logo clicks jump without a scroll animation or
glitch, and the footer reveal and exit are instant. The behaviour matches the reference.

## Touch

On touch devices (`pointer: coarse`, `hover: none`) the custom cursor is not rendered, and Lenis
and the snapper handle the touch gestures. Hover-only styles never block a tap.

## Backend-dependent behaviour

The contact form `POST`s JSON (`name`, `email`, `phone`, honeypot `website`, `pageUrl`) to
`/api/contact` with an `Idempotency-Key` header and a 15s timeout. Success requires
`{ ok: true, id: <UUID> }`.

The production endpoint is not available locally. `vite.config.ts` provides a mock for `dev` and
`preview` that validates the payload like the client does and replies `{ ok: true, id }` after
600ms. Under the mock:

| Response | Message | Reproducible locally |
|---|---|---|
| Success | "Thank you. We’ll be in touch." | Yes |
| `invalid_input` (400/422) | "Please check your name, email and phone number." | Only by bypassing native validation |
| `rate_limited` | "Please wait a few minutes before trying again, or reach us by email." | No, the mock has no rate limiting |
| Anything else / network failure | "Couldn’t send your details. Please try again or reach us by email." | Only when the server is stopped |

Actual message delivery, spam filtering and rate limiting happen on the übernatural backend. A static
deployment needs its own `/api/contact` implementation.

## Verification

Both builds were traced side by side (scene, chapter, scroll, reveal, nav, headline, glitch, cursor,
footer and form state, sampled every 40ms). Every probe changed and settled within about 50ms of the
reference:

- Desktop 1440×900: nav clicks, logo, keyboard, wheel, cursor and the full footer form flow.
- Reduced motion: nav clicks and the footer flow.
- Mobile 390×844 with touch emulation: nav clicks and the footer flow.
- Cumulative layout shift over load plus a full scroll: 0.0004 desktop and 0.0018 mobile on both
  builds. It comes only from the stat counters changing width as their digits tick, which the
  reference does too.
