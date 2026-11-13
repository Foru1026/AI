const clamp = value => Math.max(0, Math.min(1, value));
// Canonical render timeline: keep every scene/white-mask boundary unchanged.
export const JOURNEY_PORTAL_SCREENS = 4.4;
export const JOURNEY_SOCIAL_SCREENS = 1.2;
export const JOURNEY_SCROLL_SCREENS = JOURNEY_PORTAL_SCREENS + JOURNEY_SOCIAL_SCREENS;
export const JOURNEY_PORTAL_END = JOURNEY_PORTAL_SCREENS / JOURNEY_SCROLL_SCREENS;
// Latest desktop tuning: double the previous shortened route; keep the already
// approved phone/tablet distance. Stationary 3.6-second assembly is unchanged.
export const journeyPortalScreens = (profile = 'desktop') => JOURNEY_PORTAL_SCREENS * (profile === 'desktop' ? 2 : 1) / 3;
export const journeyScrollScreens = profile => journeyPortalScreens(profile) + JOURNEY_SOCIAL_SCREENS;
export function journeyScrollProgress(screens, profile = 'desktop') {
  const portalScreens = journeyPortalScreens(profile);
  // Keep the canonical scene boundary/animations; shorten only the physical
  // scroll distance. Forward AND reverse scrubbing use the identical mapping.
  return clamp(screens <= portalScreens ? screens / portalScreens * JOURNEY_PORTAL_END
    : JOURNEY_PORTAL_END + (screens - portalScreens) / JOURNEY_SOCIAL_SCREENS * (1 - JOURNEY_PORTAL_END));
}
const smooth = (a, b, value) => {
  const t = clamp((value - a) / (b - a));
  return t*t*t*(t*(t*6 - 15) + 10);
};

// Pure, reversible scroll state. Both sides of a scene boundary are fully
// covered, so neither scrubbing direction can expose a raw scene switch.
export function journeyState(progress) {
  const p = clamp(progress);
  let index, local, fill = 0, open = 0;
  if (p < JOURNEY_PORTAL_END) {
    // Automatic entrance / reading hold / scroll-driven dive live in portal-timeline.
    // Physical scroll is mapped into this unchanged canonical scene timeline.
    index = 0; local = p / JOURNEY_PORTAL_END; fill = smooth(.94, .997, local);
  } else {
    index = 1; local = (p - JOURNEY_PORTAL_END) / (1 - JOURNEY_PORTAL_END);
    fill = 1 - smooth(.28, .42, local); open = smooth(0, .38, local);
  }
  return { index, local, fill, open,
    blur: index === 1 ? 0 : .014*smooth(.94, .975, local)*(1 - smooth(.99, 1, local)) };
}
