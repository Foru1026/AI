// Shared by both Three versions. Parameters are live uniforms, not shader defines:
// tuning cannot trigger a compile or resize while a scene is visible.
export const LENS = Object.freeze({ base: .7, moving: 1.7, centre: Object.freeze([.49, .5]),
  channels: Object.freeze([.8, .03, -.5]), distortion: -.04, softness: .6, falloff: 1.3 });
const finite = (value, fallback, lo, hi) => Number.isFinite(value) ? Math.max(lo, Math.min(hi, value)) : fallback;
export function normalizeLens(value = {}) {
  const base = finite(value?.base, LENS.base, 0, 1.5);
  return { base, moving: finite(value?.moving, LENS.moving, base, 2),
    centre: LENS.centre.map((v, i) => finite(value?.centre?.[i], v, 0, 1)),
    channels: LENS.channels.map((v, i) => finite(value?.channels?.[i], v, -2, 2)),
    distortion: finite(value?.distortion, LENS.distortion, -.35, .35),
    softness: finite(value?.softness, LENS.softness, 0, 1), falloff: finite(value?.falloff, LENS.falloff, .3, 3) };
}
export function createLensUniforms(THREE) {
  return { uAmount: { value: LENS.base }, uAspect: { value: 1 },
    uCentre: { value: new THREE.Vector2(...LENS.centre) }, uChannels: { value: new THREE.Vector3(...LENS.channels) },
    uDistortion: { value: LENS.distortion }, uSoftness: { value: LENS.softness }, uFalloff: { value: LENS.falloff } };
}
export function applyLensSettings(uniforms, settings, reducedMotion = false) {
  const u = key => uniforms instanceof Map ? uniforms.get(key) : uniforms[key];
  u('uCentre').value.set(...settings.centre); u('uChannels').value.set(...settings.channels);
  u('uDistortion').value = reducedMotion ? 0 : settings.distortion;
  u('uSoftness').value = settings.softness; u('uFalloff').value = settings.falloff;
}
export function lensAmount(current, speed, dt, reducedMotion = false, settings = LENS) {
  const target = reducedMotion ? 0 : settings.base + (settings.moving - settings.base)*Math.min(1, Math.abs(speed)/1.2);
  return current + (target - current)*(1 - Math.exp(-Math.max(0, dt)*(target > current ? 14 : 5)));
}

// Height-relative radial RGB separation stays consistent across DPR and aspect
// ratios. Two taps per displaced channel soften the fringe without frame history.
export const CHROMATIC_LENS_GLSL = `
  uniform vec2 uCentre;
  uniform vec3 uChannels;
  uniform float uDistortion, uSoftness, uFalloff;
  vec4 nodalLens(sampler2D image, vec2 uv, vec4 centreColor, float amount, float aspect) {
    if (amount < .00001 && abs(uDistortion) < .00001) return centreColor;
    vec2 radial = (uv - uCentre)*vec2(aspect, 1.0);
    float radius = length(radial);
    vec2 direction = radial/max(radius, .00001);
    vec2 warped = uCentre + (uv - uCentre)*(1.0 + uDistortion*radius*radius/(1.0 + radius*radius));
    vec2 shift = direction*amount*.02*pow(smoothstep(.02, .9, radius), uFalloff)/vec2(aspect, 1.0);
    vec2 lo = vec2(.0001), hi = vec2(.9999);
    float red = mix(texture2D(image, clamp(warped + shift*uChannels.r, lo, hi)).r,
      texture2D(image, clamp(warped + shift*uChannels.r*.5, lo, hi)).r, uSoftness);
    float green = centreColor.g;
    if (abs(uChannels.g) > .00001 || abs(uDistortion) > .00001) {
      green = mix(texture2D(image, clamp(warped + shift*uChannels.g, lo, hi)).g,
        texture2D(image, clamp(warped + shift*uChannels.g*.5, lo, hi)).g, uSoftness);
    }
    float blue = mix(texture2D(image, clamp(warped + shift*uChannels.b, lo, hi)).b,
      texture2D(image, clamp(warped + shift*uChannels.b*.5, lo, hi)).b, uSoftness);
    return vec4(red, green, blue, centreColor.a);
  }
`;
