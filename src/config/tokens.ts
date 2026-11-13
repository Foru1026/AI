/**
 * Typed access to the design tokens. Values live only in
 * src/styles/design-system/tokens.css; this module lists their names so JS reads them
 * from the cascade instead of duplicating numbers that would drift.
 */
export const TOKENS = Object.freeze({
  bp: ["tablet", "desktop", "narrow-max", "short-max"],
  frame: ["mobile", "tablet", "desktop"],
  color: [
    "white", "black", "blue", "orange", "avatar-badge",
    "glitch-red", "glitch-cyan", "glitch-blue", "text-root", "tunnel-flash",
  ],
  surface: ["root", "page", "tunnel"],
  white: ["60", "50", "40", "20", "10"],
  divider: ["mobile", "v-mobile"],
  gradient: ["h1", "h2", "fade", "fade-top", "atmosphere", "glitch-flare"],
  shadow: ["autofill"],
  glow: ["glitch-cyan", "glitch-blue"],
  font: ["display", "mono"],
  fw: ["display-light", "display-roman", "mono-light", "mono-regular", "mono-medium"],
  "font-size": ["10", "11", "12", "14", "16", "36", "48"],
  fs: [
    "h1", "h2", "body", "label", "fact", "body-light", "small", "button",
    "h1-mono", "h2-mono", "label-mono", "footnote-mono", "nav-mono", "body-mono",
  ],
  lh: ["none", "tight", "snug", "normal", "small", "loose"],
  ls: ["none", "tight", "body", "mono-wide"],
  space: ["2", "4", "6", "8", "12", "16", "20", "24", "28", "32", "40", "48", "56", "64", "80", "84"],
  header: ["pad", "h"],
  logo: ["w", "h"],
  container: [
    "text", "hint", "hint-wide", "lead", "tag", "module-title",
    "headline", "proposal", "form-column", "footer-min",
  ],
  radius: ["none", "sm", "round"],
  blur: ["card", "widget"],
  focus: ["ring", "offset"],
  button: ["h", "bg", "fg", "radius", "hover-filter", "disabled-opacity"],
  link: ["hover"],
  "nav-link": ["active"],
  ease: ["out", "in-out", "standard", "exit"],
  dur: ["fast", "cursor-tone", "cursor-fade", "cursor-dot", "footer-hide", "footer-reveal"],
  delay: ["cursor-dot"],
  reveal: ["shift", "in", "out", "stagger"],
  z: ["base", "raised", "media", "overlay", "fade", "content", "interface", "nav", "header", "cursor"],
} as const);

type Group = keyof typeof TOKENS;
type GroupToken<G extends Group> = `--${G}-${(typeof TOKENS)[G][number]}`;

export type TokenName =
  | { [G in Group]: GroupToken<G> }[Group]
  | "--grey-15"
  | "--divider"
  | "--mask-hidden"
  | "--gutter"
  | "--block-pad-y"
  | "--scene-min-h"
  | "--hero-min-h"
  | "--fade-h"
  | "--stage-ratio"
  | "--chapter-nav-top"
  | "--dot"
  | "--marker"
  | "--nav-link"
  | "--scene-fade";

/** `var(--token)` for inline styles, so token names stay type-checked. */
export const cssVar = (name: TokenName, fallback?: string): string =>
  fallback === undefined ? `var(${name})` : `var(${name}, ${fallback})`;

/** Resolved token value at the current viewport (tokens change at the breakpoints). */
export function readToken(name: TokenName, element: Element = document.documentElement): string {
  return getComputedStyle(element).getPropertyValue(name).trim();
}

/** Numeric token value: `px`, `ms`, `s` (as ms) and unitless numbers. */
export function readNumberToken(name: TokenName, element?: Element): number {
  const raw = readToken(name, element);
  const value = parseFloat(raw);
  return raw.endsWith("ms") ? value : raw.endsWith("s") ? value * 1000 : value;
}
