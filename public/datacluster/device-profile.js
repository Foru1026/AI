// Also covers landscape iPads wider than the usual tablet CSS breakpoint.
// A normal desktop keeps all its approved distances, geometry and quality.
export function deviceProfile(width, coarse = false) {
  if (width <= 760) return 'mobile';
  return width <= 1024 || coarse ? 'tablet' : 'desktop';
}
export const viewportProfile = () => deviceProfile(innerWidth, matchMedia('(pointer: coarse)').matches);
