// Lenis supplies one temporal curve; scene choreography remains distance-driven.
export const GLASS_SCROLL_SCREENS = 13.4;
export const GLASS_DISASSEMBLY_END = .10;

export function glassScrollProgress(screens) {
  return Math.max(0, Math.min(1, screens/GLASS_SCROLL_SCREENS));
}
export function glassFlightProgress(partA) {
  // First the cube visibly comes apart in front of a stationary camera. These
  // gestures drive the plates, not an inert timer or a queued scroll hold.
  const start = GLASS_DISASSEMBLY_END*1.5;
  const t = Math.max(0, Math.min(1, (partA-start)/(1-start)));
  // Integrate a smooth velocity ramp: no jump in speed when disassembly ends.
  const ramp = .12, u = Math.min(1, t/ramp);
  const launch = t < ramp ? ramp*(u**6 - 3*u**5 + 2.5*u**4) : t-ramp*.5;
  const travel = launch/(1-ramp*.5);
  return travel*travel*(3-2*travel)*.35 + travel*.65;
}
export const glassChapter = progress => progress < .36 ? 'code' : progress < .70 ? 'images' : 'tracking';
