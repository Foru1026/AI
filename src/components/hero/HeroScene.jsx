import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import HeroCamera from "./HeroCamera.jsx";
import HeroTerrain from "./HeroTerrain.jsx";
import ServerCube from "./ServerCube.jsx";
import { ASSETS } from "../../config/assets.ts";
import EnergyBeam from "./EnergyBeam.jsx";
import PlasmaPortal from "./PlasmaPortal.jsx";
import { HeroBloom, LateralLens } from "./HeroEffects.jsx";

// Compiles shaders and waits a few frames so the first paint is warm.
function ShaderWarmup({ onReady }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    let cancelled = false;
    let frame = 0;
    const nextFrame = () =>
      new Promise((resolve) => {
        frame = requestAnimationFrame(resolve);
      });
    (async () => {
      try {
        if (gl.compileAsync) await gl.compileAsync(scene, camera);
        else gl.compile(scene, camera);
      } catch {
        gl.compile(scene, camera);
      }
      for (let i = 0; i < 2; i++) await nextFrame();
      if (!cancelled) onReady();
    })();
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [camera, gl, onReady, scene]);
  return null;
}

export default function HeroScene({ pointer, scroll, motion, optics, onReady, loadExtras = false }) {
  const rimLight = useRef();
  const sideLight = useRef();
  const beamContact = useRef(-2.1);
  const [cubeReady, setCubeReady] = useState(false);

  const onCubeReady = useCallback(() => {
    setCubeReady(true);
    onReady();
  }, [onReady]);

  useFrame(() => {
    const k = 1 - THREE.MathUtils.smoothstep(scroll.current, 0.45, 0.56);
    if (rimLight.current) rimLight.current.intensity = 1.85 * k;
    if (sideLight.current) sideLight.current.intensity = 5.5 * k;
  });

  return (
    <>
      <HeroCamera scroll={scroll} />
      <ambientLight intensity={0.32} color="#7b9ab0" />
      <directionalLight position={[-3, 5, 6]} intensity={1.4} color="#9ccfff" />
      <directionalLight position={[4, -2, 3]} intensity={0.75} color="#0f76ff" />
      <directionalLight ref={rimLight} position={[7, 3, -5]} intensity={1.85} color="#59AFFF" />
      <pointLight ref={sideLight} position={[4.2, 1.1, -3.4]} intensity={5.5} distance={8.5} decay={2} color="#59AFFF" />
      {/* Cube unlocks the site; rock + HDR wait so they do not steal bandwidth. */}
      <Suspense fallback={null}>
        <ServerCube pointer={pointer} scroll={scroll} />
        <ShaderWarmup onReady={onCubeReady} />
      </Suspense>
      {cubeReady && (
        <Suspense fallback={null}>
          <HeroTerrain pointer={pointer} scroll={scroll} beamContact={beamContact} />
        </Suspense>
      )}
      {loadExtras && (
        <Suspense fallback={null}>
          <Environment files={ASSETS.environment.studio} background={false} />
        </Suspense>
      )}
      <EnergyBeam scroll={scroll} beamContact={beamContact} />
      <PlasmaPortal scroll={scroll} />
      <EffectComposer multisampling={0}>
        <HeroBloom scroll={scroll} />
        <LateralLens motion={motion} optics={optics} scroll={scroll} />
        <Noise opacity={0.022} />
        <Vignette eskil={false} offset={0.16} darkness={0.58} />
      </EffectComposer>
    </>
  );
}
