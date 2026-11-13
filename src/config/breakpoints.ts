/**
 * CSS layout breakpoints. Must stay in sync with the `@media` rules in tokens.css
 * and src/styles (CSS custom properties can't be used inside media queries).
 */
export const BREAKPOINTS = Object.freeze({
  tablet: 768,
  desktop: 1024,
});

export type Layout = "mobile" | "tablet" | "desktop";

export const layoutFor = (width: number): Layout =>
  width < BREAKPOINTS.tablet ? "mobile" : width < BREAKPOINTS.desktop ? "tablet" : "desktop";

/**
 * WebGL device profile, decoded from the original bundle. Unlike the CSS layout it
 * treats any coarse pointer as a tablet, and its mobile cut-off is 760 rather than 768.
 */
export type DeviceProfile = Layout;

export const PROFILE_LIMITS = Object.freeze({
  mobile: 760,
  tablet: 1024,
});

export function deviceProfile(width: number, coarse = false): DeviceProfile {
  return width <= PROFILE_LIMITS.mobile ? "mobile" : width <= PROFILE_LIMITS.tablet || coarse ? "tablet" : "desktop";
}

export const MEDIA = Object.freeze({
  mobile: `(max-width: ${BREAKPOINTS.tablet - 0.02}px)`,
  belowDesktop: `(max-width: ${BREAKPOINTS.desktop - 0.02}px)`,
  desktop: `(min-width: ${BREAKPOINTS.desktop}px)`,
  reducedMotion: "(prefers-reduced-motion: reduce)",
  finePointer: "(hover: hover) and (pointer: fine)",
  coarsePointer: "(pointer: coarse)",
});

export type MediaQuery = (typeof MEDIA)[keyof typeof MEDIA];

export const matches = (query: MediaQuery | string): boolean => matchMedia(query).matches;

export const currentProfile = (): DeviceProfile => deviceProfile(innerWidth, matches(MEDIA.coarsePointer));
