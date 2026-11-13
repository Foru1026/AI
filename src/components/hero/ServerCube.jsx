import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { cameraFlight, coreTargetY, currentProfile, portalState, heroCubeScale } from "../../lib/timeline.js";

const { smoothstep, damp, clamp, lerp } = THREE.MathUtils;
export const MODEL_DIR = "/assets/";
const SPACING = 1.72;

const MODULE_POSITIONS = [];
for (const x of [-SPACING, 0, SPACING])
  for (const y of [-SPACING, 0, SPACING])
    for (const z of [-SPACING, 0, SPACING])
      if ((x || y || z) && !(x === 0 && y === 0 && z === SPACING)) MODULE_POSITIONS.push([x, y, z]);

// Critically damped spring with a lag stage, so modules overshoot slightly differently.
function createSpring(position, index) {
  const unit = ((index * 47) % 101) / 100;
  return { lag: [...position], value: [...position], rate: 6.5 + unit * 1.3 };
}
function stepSpring(spring, x, y, z, delta) {
  const dt = Math.min(0.05, Math.max(0, delta));
  if (dt === 0) return;
  const k = spring.rate * dt;
  const decay = Math.exp(-k);
  for (let i = 0; i < 3; i++) {
    const target = i === 0 ? x : i === 1 ? y : z;
    const lag = spring.lag[i];
    spring.value[i] = target + (spring.value[i] - target + k * (lag - target)) * decay;
    spring.lag[i] = target + (lag - target) * decay;
  }
}

function ServerModule({ position, pointer, index, scale = 1 }) {
  const { scene } = useGLTF(`${MODEL_DIR}Server-part-2.glb`);
  const model = useMemo(() => scene.clone(true), [scene]);
  const group = useRef();
  const spring = useMemo(() => createSpring(position, index), [position, index]);
  const seed = useMemo(() => {
    const unit = ((index * 47) % 101) / 100;
    return { unit, angle: unit * Math.PI * 2 };
  }, [index]);

  useFrame((_, delta) => {
    if (!group.current) return;
    const [px, py, pz] = position;
    const p = pointer.current;
    const cursorX = p.x * 3.25;
    const cursorY = p.y * 2.45;
    const screenX = px + pz * 0.34;
    const screenY = py - pz * 0.11;
    const dx = cursorX - screenX;
    const dy = cursorY - screenY;
    const dist = Math.max(0.001, Math.hypot(dx, dy));
    const influence = Math.exp(-(dist * dist) / 3.9) * p.z;
    const weight = (0.3 + (index % 3) * 0.025) / 0.35;
    const rightSide = Math.max(p.x, 0) * p.z;
    const rightColumn = smoothstep(screenX, -0.15, 2.25);
    const boost = rightSide * rightColumn * influence;
    const push = influence * 0.34 * weight * (1 + boost * 1.15);
    const radial = Math.max(0.001, Math.hypot(px, py));
    const spread = influence * 0.09 * weight;
    const depth = pz / 1.72;
    const swirl = influence * (depth * 0.12 + Math.sin(seed.angle) * 0.035);
    const offsetX = (dx / dist) * push + (px / radial) * spread + (-dy / dist) * swirl + boost * (0.13 + seed.unit * 0.045);
    const offsetY = (dy / dist) * push + (py / radial) * spread + (dx / dist) * swirl;
    const maxX = 0.15 + boost * 0.16;
    const x = px + clamp(offsetX, -0.15, maxX);
    const y = py + clamp(offsetY, -0.15, 0.15);
    const z = pz + clamp(influence * (0.18 + seed.unit * 0.08) + boost * 0.13, 0, 0.36);
    group.current.rotation.x = damp(group.current.rotation.x, 0, 5.2, delta);
    group.current.rotation.y = damp(group.current.rotation.y, Math.PI, 5.2, delta);
    group.current.rotation.z = damp(group.current.rotation.z, 0, 5.2, delta);
    stepSpring(spring, x, y, z, delta);
    group.current.position.set(spring.value[0], spring.value[1], spring.value[2]);
  });

  return (
    <group ref={group} position={position}>
      <primitive object={model} scale={scale} />
    </group>
  );
}

function CentralCube() {
  const { scene } = useGLTF(`${MODEL_DIR}Central-cube.glb`);
  const model = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={model} scale={1.02} />;
}

export default function ServerCube({ pointer, scroll }) {
  const group = useRef();
  const { size } = useThree();
  const scale = heroCubeScale(size.width, currentProfile());
  const baseY = coreTargetY(size.height);

  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    const page = scroll.current;
    const settle = smoothstep(page, 0.025, 0.25);
    const { flight } = cameraFlight(page, baseY);
    const yaw = Math.sin(t * 0.23) * 0.018 + pointer.current.x * 0.022;
    const pitch = Math.sin(t * 0.31) * 0.012 - pointer.current.y * 0.018;
    group.current.rotation.y = damp(group.current.rotation.y, lerp(-0.37 + yaw, 0, settle), 4.2, delta);
    group.current.rotation.x = damp(group.current.rotation.x, lerp(-0.29 + pitch, 0, settle), 4.2, delta);
    group.current.position.y = damp(group.current.position.y, baseY + Math.sin(t * 0.65) * 0.04 * (1 - flight), 4, delta);
    group.current.visible = portalState(page).geometryVisible;
  });

  return (
    <group ref={group} position={[0, baseY, 0]} scale={scale}>
      <CentralCube />
      {MODULE_POSITIONS.map((position, i) => (
        <ServerModule key={i} position={position} pointer={pointer} index={i} scale={0.74} />
      ))}
      <pointLight color="#59AFFF" intensity={15} distance={7} decay={2} />
      <pointLight position={[0, -3.7, 2.4]} color="#59AFFF" intensity={11} distance={8} decay={2} />
    </group>
  );
}

useGLTF.preload(`${MODEL_DIR}Server-part-2.glb`);
useGLTF.preload(`${MODEL_DIR}Central-cube.glb`);
