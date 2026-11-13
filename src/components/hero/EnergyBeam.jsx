import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { portalState } from "../../lib/timeline.js";

const BEAM = "#59AFFF";
const additive = { transparent: true, blending: THREE.AdditiveBlending, depthTest: true, depthWrite: false, toneMapped: false };
const PARTICLES = 620;

function RisingParticles() {
  const points = useRef();
  const data = useMemo(() => {
    const positions = new Float32Array(PARTICLES * 3);
    const speeds = new Float32Array(PARTICLES);
    for (let i = 0; i < PARTICLES; i++) {
      const y = Math.random() * 15 - 7.5;
      const r = 0.035 + Math.pow(Math.random(), 3) * 0.42;
      const a = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(a) * r - 0.1;
      speeds[i] = 0.35 + Math.random() * 1.15;
    }
    return { positions, speeds };
  }, []);

  useFrame((_, delta) => {
    if (!points.current) return;
    const attr = points.current.geometry.attributes.position;
    for (let i = 0; i < PARTICLES; i++) {
      attr.array[i * 3 + 1] += data.speeds[i] * delta;
      if (attr.array[i * 3 + 1] > 7.5) attr.array[i * 3 + 1] = -7.5;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={BEAM} size={0.046} sizeAttenuation opacity={0.92} {...additive} />
    </points>
  );
}

function BeamHaze() {
  const uniforms = useMemo(() => ({ uColor: { value: new THREE.Color(BEAM) } }), []);
  return (
    <mesh position={[0, 0, -0.28]}>
      <planeGeometry args={[1.5, 15]} />
      <shaderMaterial
        uniforms={uniforms}
        {...additive}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 uColor;
          varying vec2 vUv;
          void main() {
            float x = abs(vUv.x - .5) * 2.0;
            float softCore = exp(-x * x * 26.0);
            float halo = exp(-x * x * 4.2);
            float wideMist = exp(-x * x * 1.15);
            float cap = smoothstep(0.0, .055, vUv.y) * smoothstep(0.0, .055, 1.0 - vUv.y);
            float alpha = (softCore * .34 + halo * .095 + wideMist * .022) * cap;
            gl_FragColor = vec4(uColor, alpha);
          }
        `}
      />
    </mesh>
  );
}

// [radius, z, segments, color, opacity]
const LAYERS = [
  [0.06, -0.17, 24, "#dcecff", 0.84],
  [0.16, -0.2, 24, BEAM, 0.07],
  [0.38, -0.22, 24, BEAM, 0.018],
  [0.72, -0.24, 24, BEAM, 0.005],
];

export default function EnergyBeam({ scroll, beamContact }) {
  const root = useRef();
  const column = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = 0.86 + Math.sin(t * 2.6) * 0.11 + Math.sin(t * 7.1) * 0.025;
    if (!root.current) return;
    root.current.scale.x = root.current.scale.z = pulse;
    root.current.visible = portalState(scroll.current).geometryVisible;
    const ground = THREE.MathUtils.clamp(beamContact.current, -7.5, 7.4);
    column.current.position.y = (7.5 + ground) / 2;
    column.current.scale.y = (7.5 - ground) / 15;
  });

  return (
    <group ref={root}>
      <group ref={column}>
        <mesh position={[0, 0, -0.15]}>
          <cylinderGeometry args={[0.022, 0.022, 15, 20]} />
          <meshBasicMaterial color="#ffffff" depthTest toneMapped={false} />
        </mesh>
        {LAYERS.map(([radius, z, segments, color, opacity]) => (
          <mesh key={radius} position={[0, 0, z]}>
            <cylinderGeometry args={[radius, radius, 15, segments]} />
            <meshBasicMaterial color={color} opacity={opacity} {...additive} />
          </mesh>
        ))}
        <BeamHaze />
        <RisingParticles />
      </group>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.12]}>
        <torusGeometry args={[0.44, 0.018, 10, 72]} />
        <meshBasicMaterial color={BEAM} opacity={0.7} {...additive} />
      </mesh>
      <pointLight position={[0, 0, 1]} color={BEAM} intensity={20} distance={6} decay={2} />
    </group>
  );
}
