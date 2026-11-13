export const EYE_ARRIVAL = Object.freeze({ start: .56, end: .675 });
const smooth = (a, b, value) => {
  const t = Math.max(0, Math.min(1, (value - a)/(b - a)));
  return t*t*t*(t*(t*6 - 15) + 10);
};

export function eyeArrival(progress) {
  return smooth(EYE_ARRIVAL.start, EYE_ARRIVAL.end, progress);
}
export function pupilAppearanceTime(previous, opacity, now) {
  // A visible iris, not merely a mesh whose opacity has just risen above zero.
  if (opacity <= .01) return null;
  return previous === null && opacity >= .55 ? now : previous;
}
export function pupilRadius(progress, sinceAppearance, proximity = 1) {
  // Stay narrow throughout the dark fade-in; then open visibly over 2.4 seconds
  // even when paused. Only the final dive can force it open during fast scrubbing.
  const open = Math.max(smooth(.25, 2.65, sinceAppearance)*Math.max(0, Math.min(1, proximity)), smooth(.79, .84, progress));
  return .1 + (.32 - .1)*open;
}

export function pupilPointerProximity(pointer, centre, aspect = 1) {
  // Pixel-proportional distance across the ENTIRE viewport, not a hover radius
  // around the iris. Normalise against the furthest screen corner so even
  // movement outside the eye continues changing the pupil, on any aspect ratio.
  const distance = Math.hypot((pointer.x - centre.x)*aspect, pointer.y - centre.y);
  const reach = Math.hypot((1 + Math.abs(centre.x))*aspect, 1 + Math.abs(centre.y));
  return 1 - Math.max(0, Math.min(1, distance/Math.max(.001, reach)));
}
export function smoothPupilRadius(current, target, dt) {
  return current + (target - current)*(1 - Math.exp(-Math.max(0, dt)*7));
}

export function pupilPreviewBlend(coverage) {
  // Fit the first frame inside the pupil while the eye is still far away.
  // Only its actual projected size, not an independent scroll clock, can
  // enlarge the preview toward screen-space. Match the next scene before the
  // pupil covers every viewport corner (the fullscreen handoff starts at 1.02).
  return smooth(.12, 1, coverage);
}
