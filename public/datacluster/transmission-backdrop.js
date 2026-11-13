import * as THREE from 'three';

// A background for the refraction capture only, not the final scene or the
// studio environment. Keep the coloured environment reflections independent.
export function createTransmissionBackdrop(camera, isTransmissionTarget) {
  const material = new THREE.MeshBasicMaterial({
    color: 0x000000, toneMapped: false, fog: false,
    depthWrite: false, depthTest: false,
  });
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  backdrop.name = 'Glass-only black backdrop';
  backdrop.position.z = -30;
  backdrop.renderOrder = -10;
  backdrop.frustumCulled = false;
  backdrop.onBeforeRender = renderer => {
    material.colorWrite = Boolean(isTransmissionTarget(renderer.getRenderTarget()));
    // Cover the whole refraction view even on ultrawide screens or after a
    // resize. As a camera child, it stays behind the glass throughout the flight.
    const halfHeight = -backdrop.position.z*Math.tan(THREE.MathUtils.degToRad(camera.getEffectiveFOV()/2));
    backdrop.scale.set(halfHeight*camera.aspect*1.05, halfHeight*1.05, 1);
  };
  camera.add(backdrop);
  return backdrop;
}
