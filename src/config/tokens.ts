/**
 * Typed access to the design tokens. Values live only in
 * public/assets/interface/tokens.css; this module lists their names so JS reads them
 * from the cascade instead of duplicating numbers that would drift.
 */
export const TOKENS = Object.freeze({
  color: ["white", "black", "blue", "orange", "avatar-badge"],
  white: ["60", "50", "40", "20", "10"],
  gradient: ["h1", "h2", "fade"],
  font: ["display", "mono"],
  fw: ["display-light", "display-roman", "mono-light", "mono-regular", "mono-medium"],
  fs: [
    "h1", "h2", "body", "label", "fact", "body-light", "small", "button",
    "h1-mono", "h2-mono", "label-mono", "footnote-mono", "nav-mono", "body-mono",
  ],
  lh: ["none", "tight", "snug", "small"],
  ls: ["tight", "body", "mono-wide"],
  space: ["2", "4", "6", "8", "12", "16", "20", "24", "28", "32", "48", "56", "84"],
  ease: ["out", "in-out"],
  dur: ["fast", "base", "slow"],
  z: ["media", "overlay", "fade", "content", "nav", "header"],
} as const);

type Group = keyof typeof TOKENS;
type GroupToken<G extends Group> = `--${G}-${(typeof TOKENS)[G][number]}`;

export type TokenName =
  | { [G in Group]: GroupToken<G> }[Group]
  | "--grey-15"
  | "--divider"
  | "--divider-mobile"
  | "--divider-v-mobile"
  | "--gutter"
  | "--block-pad-y"
  | "--header-pad"
  | "--header-h"
  | "--logo-w"
  | "--logo-h"
  | "--scene-min-h"
  | "--fade-h"
  | "--stage-ratio"
  | "--chapter-nav-top"
  | "--blur-card"
  | "--blur-widget"
  | "--dot"
  | "--marker"
  | "--scene-fade"
  | "--media-settle"
  | "--reveal-shift"
  | "--reveal-in"
  | "--reveal-out"
  | "--reveal-delay"
  | "--reveal-stagger";

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
