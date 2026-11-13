import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { BloomEffect, BlendFunction, Effect, EffectAttribute } from "postprocessing";
import { LENS_GLSL, applyLens, lensAmount, lensUniforms } from "../../lib/timeline.js";

// 1 while the camera is outside the cube, fading to 0 as it flies into the core.
export const heroWarmth = (page) => 1 - THREE.MathUtils.smoothstep(page, 0.305, 0.475);

const WARM = Object.freeze({ warm: Object.freeze([1, 0.04, 0.04]), cool: Object.freeze([0.18, 0.1, 1]), strength: 0.85 });

const WARM_LENS_GLSL = `
  vec4 heroWarmLens(sampler2D image, vec2 uv, vec4 original, float amount, float aspect) {
    if (amount < .00001 && abs(uDistortion) < .00001) return original;
    vec2 radial = (uv - uCentre) * vec2(aspect, 1.0);
    float radius = length(radial);
    vec2 direction = radial / max(radius, .00001);
    vec2 warped = uCentre + (uv - uCentre) * (1.0 + uDistortion * radius * radius / (1.0 + radius * radius));
    vec2 shift = direction * amount * .02 * pow(smoothstep(.02, .9, radius), uFalloff) / vec2(aspect, 1.0);
    vec2 lo = vec2(.0001), hi = vec2(.9999);
    // One coherent full-RGB base sample, so green cannot be left behind between red/blue edges.
    vec3 base = texture2D(image, clamp(warped, lo, hi)).rgb;
    vec3 warmTap = mix(texture2D(image, clamp(warped + shift * uChannels.r, lo, hi)).rgb,
      texture2D(image, clamp(warped + shift * uChannels.r * .5, lo, hi)).rgb, uSoftness);
    vec3 coolTap = mix(texture2D(image, clamp(warped + shift * uChannels.b, lo, hi)).rgb,
      texture2D(image, clamp(warped + shift * uChannels.b * .5, lo, hi)).rgb, uSoftness);
    vec3 weights = vec3(.2126, .7152, .0722);
    float baseLuma = dot(base, weights);
    // Positive edge energy only; subtracting per channel would recreate green/yellow fringes.
    float warm = max(0.0, dot(warmTap, weights) - baseLuma) * ${WARM.strength};
    float cool = max(0.0, dot(coolTap, weights) - baseLuma) * ${WARM.strength};
    vec3 color = base + warm * vec3(${WARM.warm.join(", ")})
      + cool * vec3(${WARM.cool.join(", ")});
    return vec4(color, original.a);
  }
`;

const COLD = Object.freeze([0.5, 0.72, 1]);
const BLOOM = Object.freeze({ mipmapBlur: true, intensity: 2.72, luminanceThreshold: 1.05, luminanceSmoothing: 0.2 });
const BLOOM_GLSL = `
  #ifdef FRAMEBUFFER_PRECISION_HIGH
    uniform mediump sampler2D map;
  #else
    uniform lowp sampler2D map;
  #endif
  uniform float intensity, uHeroBloom;
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec4 halo = texture2D(map, uv) * intensity;
    vec3 cold = min(halo.rgb, halo.b * vec3(${COLD.join(", ")}));
    outputColor = vec4(mix(halo.rgb, cold, uHeroBloom), halo.a);
  }
`;

export function HeroBloom({ scroll }) {
  const effect = useMemo(() => {
    const bloom = new BloomEffect({ ...BLOOM, blendFunction: BlendFunction.ADD });
    bloom.uniforms.set("uHeroBloom", new THREE.Uniform(1));
    bloom.setFragmentShader(BLOOM_GLSL);
    return bloom;
  }, []);

  useFrame(() => {
    effect.uniforms.get("uHeroBloom").value = heroWarmth(scroll.current);
  });
  useEffect(() => () => effect.dispose(), [effect]);

  return <primitive object={effect} dispose={null} />;
}

export function LateralLens({ motion, optics, scroll }) {
  const { size } = useThree();
  const reduced = useMemo(() => matchMedia("(prefers-reduced-motion: reduce)"), []);
  const effect = useMemo(
    () =>
      new Effect(
        "NodalLateralLens",
        `
    uniform float uAmount, uAspect, uHeroWarm;
    ${LENS_GLSL}
    ${WARM_LENS_GLSL}
    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
      if (uHeroWarm > .9999) {
        outputColor = heroWarmLens(inputBuffer, uv, inputColor, uAmount, uAspect);
      } else if (uHeroWarm < .0001) {
        outputColor = nodalLens(inputBuffer, uv, inputColor, uAmount, uAspect);
      } else {
        outputColor = mix(nodalLens(inputBuffer, uv, inputColor, uAmount, uAspect),
          heroWarmLens(inputBuffer, uv, inputColor, uAmount, uAspect), uHeroWarm);
      }
    }
  `,
        {
          blendFunction: BlendFunction.NORMAL,
          attributes: EffectAttribute.CONVOLUTION,
          uniforms: new Map(Object.entries({ ...lensUniforms(THREE), uHeroWarm: { value: 1 } })),
        },
      ),
    [],
  );

  useFrame((_, delta) => {
    const amount = effect.uniforms.get("uAmount");
    amount.value = lensAmount(amount.value, motion.current, Math.min(delta, 0.05), reduced.matches, optics.current);
    applyLens(effect.uniforms, optics.current, reduced.matches);
    effect.uniforms.get("uAspect").value = size.width / Math.max(1, size.height);
    effect.uniforms.get("uHeroWarm").value = heroWarmth(scroll.current);
  });
  useEffect(() => () => effect.dispose(), [effect]);

  return <primitive object={effect} dispose={null} />;
}
