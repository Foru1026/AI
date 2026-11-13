import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import { CAMERA_FOV, CAMERA_START, HERO_SPLIT, currentProfile } from "../../lib/timeline.js";
import { MEDIA } from "../../config/breakpoints.ts";
import {
  ROCK_MODEL,
  SKY_DISTANCE,
  SKY_FRAGMENT,
  SKY_TEXTURE,
  SKY_VERTEX,
  bakedGeometry,
  createGroundProbe,
  rockMaterial,
  terrainLayout,
  terrainMotion,
  terrainWidthScale,
} from "../../webgl/terrain.js";

function terrainStats(layers, geometry) {
  const instances = layers.reduce((n, layer) => n + layer.matrices.length, 0);
  const bytes =
    geometry.index.array.byteLength + Object.values(geometry.attributes).reduce((n, a) => n + a.array.byteLength, 0);
  return {
    instances,
    sourceTriangles: geometry.index.count / 3,
    triangles: (instances * geometry.index.count) / 3,
    bytes: bytes + instances * 16 * 4,
    drawCalls: layers.length,
  };
}

export default function HeroTerrain({ pointer, scroll, beamContact }) {
  const { gl, size } = useThree();
  const sky = useTexture(SKY_TEXTURE);
  const rock = useGLTF(ROCK_MODEL);
  sky.colorSpace = THREE.SRGBColorSpace;

  const background = useRef();
  const foreground = useRef();
  const skyMesh = useRef();
  const meshes = useRef([]);
  const reduced = useRef(false);
  const probeTimer = useRef(0.1);
  const profile = currentProfile();

  const layers = useMemo(() => terrainLayout(profile === "desktop" ? "desktop" : "mobile"), [profile]);
  const sourceMesh = useMemo(() => {
    let found;
    rock.scene.traverse((o) => {
      if (o.isMesh && !found) found = o;
    });
    return found;
  }, [rock]);
  const geometry = useMemo(() => bakedGeometry(sourceMesh), [sourceMesh]);
  const materials = useMemo(
    () =>
      layers.map(({ name }) => rockMaterial(sourceMesh.material, name === "distant-ridge", gl.capabilities.getMaxAnisotropy())),
    [layers, sourceMesh, gl],
  );
  const probe = useMemo(createGroundProbe, []);
  const skyUniforms = useMemo(() => ({ uSky: { value: sky }, uOpacity: { value: 1 } }), [sky]);

  const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2)) * (CAMERA_START[2] - SKY_DISTANCE);
  const skyAspect = sky.image.width / sky.image.height;
  const skyWidth = Math.max((viewHeight * size.width) / size.height, viewHeight * skyAspect) * 1.035;
  const skyHeight = skyWidth / skyAspect;
  const widthScale = terrainWidthScale(profile, size.width / size.height);

  useLayoutEffect(() => {
    layers.forEach((layer, i) => {
      const mesh = meshes.current[i];
      layer.matrices.forEach((m, j) => mesh.setMatrixAt(j, m));
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingBox();
      mesh.computeBoundingSphere();
    });
    beamContact.current = probe(meshes.current);
  }, [layers, probe, beamContact]);

  useEffect(() => {
    const query = matchMedia(MEDIA.reducedMotion);
    const sync = () => {
      reduced.current = query.matches;
    };
    sync();
    query.addEventListener("change", sync);
    gl.domElement.dataset.heroTerrain = JSON.stringify({ profile, ...terrainStats(layers, geometry), skyDrawCalls: 1 });
    return () => {
      query.removeEventListener("change", sync);
      delete gl.domElement.dataset.heroTerrain;
      geometry.dispose();
      for (const { material } of materials) material.dispose();
    };
  }, [gl, layers, geometry, materials, profile]);

  useFrame((_, delta) => {
    const m = terrainMotion(scroll.current, pointer.current, reduced.current);
    const damp = (from, to) => THREE.MathUtils.damp(from, to, 3.2, Math.min(delta, 0.05));
    const bg = background.current;
    const fg = foreground.current;
    bg.visible = m.backgroundAlpha > 0.001;
    bg.position.x = damp(bg.position.x, m.backgroundX);
    bg.position.y = damp(bg.position.y, m.backgroundY);
    bg.rotation.y = damp(bg.rotation.y, m.backgroundYaw);
    fg.visible = m.foregroundAlpha > 0.001;
    fg.position.x = damp(fg.position.x, m.foregroundX);
    fg.position.y = damp(fg.position.y, m.foregroundY);
    fg.position.z = damp(fg.position.z, m.foregroundZ);
    fg.rotation.y = damp(fg.rotation.y, m.foregroundYaw);
    fg.rotation.z = damp(fg.rotation.z, m.foregroundRoll);
    const s = damp(fg.scale.y, m.foregroundScale);
    fg.scale.set(s * widthScale, s, s);
    materials.forEach(({ opacity }, i) => {
      opacity.value = layers[i].foreground ? m.foregroundAlpha : m.backgroundAlpha;
    });
    skyMesh.current.visible = m.backgroundAlpha > 0.001;
    skyUniforms.uOpacity.value = m.backgroundAlpha;
    probeTimer.current += delta;
    if (scroll.current < HERO_SPLIT && probeTimer.current >= 1 / 12) {
      probeTimer.current = 0;
      beamContact.current = probe(meshes.current);
    }
  });

  const layerMesh = (i) => (
    <instancedMesh
      key={layers[i].name}
      ref={(el) => {
        meshes.current[i] = el;
      }}
      args={[geometry, materials[i].material, layers[i].matrices.length]}
    />
  );

  return (
    <>
      <mesh ref={skyMesh} position={[0, 0.2, SKY_DISTANCE]} scale={[skyWidth, skyHeight, 1]} renderOrder={-10}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial uniforms={skyUniforms} vertexShader={SKY_VERTEX} fragmentShader={SKY_FRAGMENT} transparent depthWrite={false} />
      </mesh>
      <group ref={background} scale={[widthScale, 1, 1]}>
        {layerMesh(0)}
        {layerMesh(1)}
      </group>
      <group ref={foreground} scale={[widthScale, 1, 1]}>
        {layerMesh(2)}
      </group>
    </>
  );
}
