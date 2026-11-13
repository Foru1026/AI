// Entrance is timed by the existing scene clock; approach/exit stay on Lenis.
// No wheel lock, queued input, extra RAF or setTimeout playback loop.
export const PORTAL = Object.freeze({
  aspect: 2752 / 1536, centre: [.002, 0], radius: .319, logoSize: .225,
  desktopParticles: 24500, tabletParticles: 17500, mobileParticles: 11375, desktopStreams: 1000, mobileStreams: 400,
  rayCount: 8, rayBranches: 4, raySegments: 64, ringSegments: 256,
  sparkCount: 1, sparkBranches: 3, sparkSegments: 64, sparkDuration: .46, sparkPause: .35,
  hoverRadius: .64, parallax: .0132, holdStart: .54, holdEnd: .76,
  introDuration: 3.6, uiStart: .18, uiEnd: .40, coreStart: .40, overloadStart: .50, overloadEnd: .89,
  image: '../assets/portal/portal.jpg', depth: '../assets/portal/depth.jpg',
});
export const clamp = x => Math.max(0, Math.min(1, x));
export const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t*t*t*(t*(t*6 - 15) + 10);
};
export function portalState(progress, reduced = false, elapsed = 0) {
  const p = clamp(progress), dive = smooth(PORTAL.holdEnd, .997, p);
  // A fast skip/reverse entry into the covered dive needs a complete mark.
  // Ordinary entrance needs no further scrolling, even at progress .00001.
  const intro=Math.max(clamp(elapsed/PORTAL.introDuration),smooth(.68,PORTAL.holdEnd,p));
  const core=smooth(PORTAL.coreStart,PORTAL.overloadStart,dive),overload=smooth(PORTAL.overloadStart,PORTAL.overloadEnd,dive);
  return { reveal: smooth(.05, .32, intro), charge: smooth(.20, .68, intro),
    uiOpacity: smooth(PORTAL.uiStart, PORTAL.uiEnd, intro),
    assembly: smooth(.32, 1, intro), dive, core, overload,
    zoom: 1 + (reduced ? 5 : 26)*dive*dive*dive,
    phase: overload>0?'overload':p>=PORTAL.holdEnd?'dive':intro<.05?'darkness':intro<.32?'reveal':intro<1?'assembly':'hold' };
}
export function createPortalPlayback() {
  let active=false,elapsed=0,lastTime=null;
  return {
    setActive(value){if(value!==active){active=value;elapsed=0;lastTime=null;}},
    update(progress,time,reduced=false){
      if(active){
        if(lastTime!==null)elapsed+=Math.max(0,Math.min(.25,time-lastTime));
        lastTime=time;
        // Once formed (including a return from the footer), never unassemble
        // while scrubbing backwards in the same portal visit.
        elapsed=Math.max(elapsed,smooth(.68,PORTAL.holdEnd,progress)*PORTAL.introDuration);
      }
      return portalState(progress,reduced,elapsed);
    },
  };
}
export function portalFraming(aspect) {
  // Portrait keeps the whole circular opening, rather than cropping both sides.
  const height = Math.max(1.04, 1.10 / Math.max(.1, aspect));
  return { width: height*aspect, height };
}
export function portalPointer(pointer, aspect, zoom = 1) {
  const frame = portalFraming(aspect);
  return { x: pointer.x*frame.width/(2*zoom) + PORTAL.centre[0], y: pointer.y*frame.height/(2*zoom) + PORTAL.centre[1] };
}
export function sparkEnvelope(age, duration) {
  // Strike the entire path in 25 ms, then leave a soft, stationary afterimage.
  // No slowly flying tail or continuous emission while the pointer is still.
  const done = age >= duration || age < 0;
  return { travel: smooth(0, .025, age),
    alpha: done ? 0 : smooth(0, .012, age)*(1 - smooth(.035, duration, age)), done };
}
