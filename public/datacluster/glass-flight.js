// Shared, distance-driven flight pose. Scrubbing back follows the same path.
const clamp = x => Math.max(0, Math.min(1, x));
const smooth = (a, b, x) => {
  const t = clamp((x - a)/(b - a));
  return t*t*t*(t*(t*6 - 15) + 10);
};

export function cardFlightRotation(distance, phase, roll, time) {
  const incoming = smooth(12, 26, distance);
  const outgoing = 1 - smooth(3, 8, distance);
  const sign = Math.sin(phase*1.7) < 0 ? -1 : 1;
  const yaw = .5 + .22*(.5 + .5*Math.sin(phase*2.1));
  const pitch = .14*Math.sin(phase*2.7) + .1;
  const active = Math.max(incoming, outgoing);
  return {
    pitch: pitch*(incoming - .85*outgoing),
    yaw: sign*yaw*(incoming - 1.05*outgoing),
    roll: roll*(incoming + .55*outgoing) + Math.sin(time*.25 + phase)*.07*active,
  };
}

// 30% more points, still rendered with one draw call and no CPU particle loop.
export const STAR_COUNTS = Object.freeze({ desktop: 2730, mobile: 1040 });
export const STAR_VERTEX_SHADER = `
  attribute float aPhase, aSize;
  uniform float uTime, uPR, uCameraZ;
  varying float vA;
  void main(){
    // Positive world-Z drift approaches the camera. Wrapping uses the camera's
    // current position, so stars never run out during the long scroll shot.
    float speed = 2.4 + aPhase*2.0;
    float depth = mod(uCameraZ - position.z - uTime*speed, 120.0);
    vec3 p = position;
    p.z = uCameraZ - depth;
    vec4 mv = modelViewMatrix*vec4(p, 1.0);
    gl_Position = projectionMatrix*mv;
    float d = -mv.z;
    float tw = .6 + .4*sin(uTime*(.5 + fract(aPhase*7.0)*1.5) + aPhase*6.2832);
    float flash = pow(max(0.0, sin(uTime*.23 + aPhase*57.0)), 60.0);
    // Both ends fade to zero before a star wraps: no visible teleport or flash.
    float fade = (1.0 - smoothstep(78.0, 120.0, d))*smoothstep(2.0, 8.0, d);
    vA = (tw*.9 + flash*1.4)*fade;
    gl_PointSize = aSize*uPR*clamp(16.0/max(d, .1), .9, 1.8)*(1.0 + flash*1.2);
  }
`;
