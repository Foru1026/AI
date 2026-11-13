import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { portalState } from "../../lib/timeline.js";

const VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAGMENT = `
  uniform float uEnter;
  uniform float uReveal;
  uniform float uExitFade;
  uniform float uTime;
  uniform float uAspect;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1,0)), f.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = .52;
    mat2 turn = mat2(.8, -.6, .6, .8);
    for (int i = 0; i < 5; i++) {
      value += noise(p) * amplitude;
      p = turn * p * 2.03 + 17.1;
      amplitude *= .48;
    }
    return value;
  }
  void main() {
    vec2 p = vUv - .5;
    p.x *= uAspect;
    float d = length(p);
    float reveal = uReveal;
    float n1 = fbm(p * 3.1 + vec2(uTime * .075, -uTime * .052));
    float n2 = fbm(p * 7.2 - vec2(uTime * .11, uTime * .07));
    float displacement = (n1 - .5) * .235 + (n2 - .5) * .075;
    float radius = mix(-.18, 1.32, reveal);
    float field = d + displacement;
    float shell = smoothstep(radius - .018, radius + .085, field);
    float edgeDistance = abs(field - radius);
    float plasma = exp(-edgeDistance * 18.0) + exp(-edgeDistance * 55.0) * 1.8;
    float filaments = pow(max(0.0, sin(n2 * 18.0 + uTime * 1.35)), 9.0) * exp(-edgeDistance * 9.0);
    float radialPulse = .82 + .18 * sin(d * 22.0 - uTime * 2.0 + n1 * 5.0);
    vec3 outer = mix(vec3(.008, .055, .24), vec3(.035, .42, 1.42), smoothstep(.08, .86, 1.0-d));
    vec3 color = outer * shell * radialPulse;
    float coreFlare = exp(-d * d * 3.6) * (1.0 - reveal);
    color += vec3(.32, .78, 1.5) * coreFlare * 2.35;
    color += vec3(.1, .72, 2.15) * plasma * (1.0 + filaments * 2.2);
    color += vec3(.82, .96, 1.0) * exp(-edgeDistance * 120.0) * 2.1;
    // A closed portal is an opaque cover; noise sculpts the opening only once the tunnel is available.
    float coverage = reveal < .0001 ? 1.0 : clamp(shell + plasma * .72 + filaments, 0.0, 1.0);
    float alpha = uEnter * uExitFade * coverage;
    if (alpha < .002) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;

export default function PlasmaPortal({ scroll }) {
  const material = useRef();
  const { size } = useThree();
  const uniforms = useMemo(
    () => ({ uEnter: { value: 0 }, uReveal: { value: 0 }, uExitFade: { value: 0 }, uTime: { value: 0 }, uAspect: { value: 1 } }),
    [],
  );

  useFrame(({ clock }) => {
    if (!material.current) return;
    const s = portalState(scroll.current);
    const u = material.current.uniforms;
    u.uEnter.value = s.enter;
    u.uReveal.value = s.reveal;
    u.uExitFade.value = s.exitFade;
    material.current.visible = s.active;
    u.uTime.value = clock.getElapsedTime();
    u.uAspect.value = size.width / Math.max(size.height, 1);
  });

  return (
    <mesh frustumCulled={false} renderOrder={1e3}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        transparent
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
