import * as THREE from 'three';

// SAT on actual oriented slab bounds, including the surface content planes.
// Unlike the original soft spheres, thin plates cannot slip through each other.
const delta = new THREE.Vector3(), cross = new THREE.Vector3(), separation = new THREE.Vector3();
const inverse = new THREE.Quaternion();
let smallest;
function testAxis(axis, a, b) {
  const length = axis.length();
  if (length < 1e-7) return true;
  axis.divideScalar(length);
  const ra = a.half[0]*Math.abs(axis.dot(a.axes[0])) + a.half[1]*Math.abs(axis.dot(a.axes[1])) + a.half[2]*Math.abs(axis.dot(a.axes[2]));
  const rb = b.half[0]*Math.abs(axis.dot(b.axes[0])) + b.half[1]*Math.abs(axis.dot(b.axes[1])) + b.half[2]*Math.abs(axis.dot(b.axes[2]));
  const projection = delta.dot(axis), overlap = ra + rb - Math.abs(projection);
  if (overlap <= 0) return false;
  if (overlap < smallest) { smallest = overlap; separation.copy(axis).multiplyScalar(projection < 0 ? -1 : 1); }
  return true;
}
function penetration(a, b) {
  delta.copy(b.position).sub(a.position);
  if (delta.lengthSq() >= (a.radius + b.radius)**2) return 0;
  smallest = Infinity;
  for (let i = 0; i < 3; i++) {
    if (!testAxis(cross.copy(a.axes[i]), a, b) || !testAxis(cross.copy(b.axes[i]), a, b)) return 0;
  }
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    if (!testAxis(cross.crossVectors(a.axes[i], b.axes[j]), a, b)) return 0;
  }
  return smallest;
}
function body(mesh, dt) {
  const p = mesh.userData;
  const b = p.collisionBody ||= {
    mesh, position: new THREE.Vector3(), quaternion: new THREE.Quaternion(),
    axes: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], half: [0,0,0],
    safePosition: new THREE.Vector3(), safeQuaternion: new THREE.Quaternion(), safeScale: new THREE.Vector3(), hasSafe: false,
  };
  p.sep.multiplyScalar(Math.exp(-dt*4));
  b.position.copy(p.wp).add(p.sep);
  mesh.getWorldQuaternion(b.quaternion);
  b.axes[0].set(1,0,0).applyQuaternion(b.quaternion);
  b.axes[1].set(0,1,0).applyQuaternion(b.quaternion);
  b.axes[2].set(0,0,1).applyQuaternion(b.quaternion);
  b.half[0] = p.size[0]*mesh.scale.x*.5 + .006;
  b.half[1] = p.size[1]*mesh.scale.y*.5 + .006;
  b.half[2] = p.size[2]*mesh.scale.z*.5 + .006;
  b.radius = Math.hypot(...b.half);
  return b;
}
export function resolveGlassBodies(meshes, dt) {
  const active = meshes.filter(m => m.visible).map(m => body(m, dt));
  const passes = active.every(b => b.hasSafe) ? 16 : 48;
  for (let pass = 0; pass < passes; pass++) {
    let largest = 0;
    for (let i = 0; i < active.length; i++) for (let j = i + 1; j < active.length; j++) {
      const a = active[i], b = active[j], overlap = penetration(a, b);
      if (overlap <= 0) continue;
      largest = Math.max(largest, overlap);
      const step = (overlap + 1e-5)*.501;
      a.position.addScaledVector(separation, -step);
      b.position.addScaledVector(separation, step);
    }
    if (largest < 1e-5) break;
  }
  let remaining = 0;
  for (let i = 0; i < active.length; i++) for (let j = i + 1; j < active.length; j++) remaining = Math.max(remaining, penetration(active[i], active[j]));
  const safe = remaining < 1e-5;
  // Reject an unresolved motion step; never show a frame crossing solid plates.
  for (const b of active) {
    const p = b.mesh.userData;
    if (!safe && b.hasSafe) { b.position.copy(b.safePosition); b.quaternion.copy(b.safeQuaternion); b.mesh.scale.copy(b.safeScale); }
    else if (safe) { b.safePosition.copy(b.position); b.safeQuaternion.copy(b.quaternion); b.safeScale.copy(b.mesh.scale); b.hasSafe = true; }
    p.sep.copy(b.position).sub(p.wp);
    p.wp.copy(b.position);
    b.mesh.parent.getWorldQuaternion(inverse).invert();
    b.mesh.quaternion.copy(inverse).multiply(b.quaternion);
  }
  return { remaining, held: !safe };
}
