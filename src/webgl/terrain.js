import * as THREE from "three";

const { degToRad, clamp, smoothstep } = THREE.MathUtils;

// Each rock: [position, scale, euler degrees].
const LAYERS = [
  {
    name: "distant-ridge",
    rocks: [
      [[-38, -9.8, -32], [15, 14, 13], [8, -18, -9]],
      [[-24, -8.9, -28], [12, 13, 12], [-8, 30, 5]],
      [[-13, -10.4, -32], [13, 12, 13], [4, 82, -6]],
      [[2, -11.8, -37], [15, 12, 15], [-5, 120, 4]],
      [[17, -10, -31], [13, 13, 12], [7, -65, -6]],
      [[29, -9.5, -30], [12, 14, 15], [-8, 8, 9]],
      [[40, -10, -35], [15, 15, 15], [4, 58, -6]],
    ],
  },
  {
    name: "valley-massifs",
    rocks: [
      [[-15, -5.4, -12], [7, 9, 9], [4, -35, -12]],
      [[-10.5, -4, -10], [5.5, 8.5, 8], [-6, 65, -9]],
      [[-6.9, -3.1, -9], [4.1, 7.1, 7], [5, -18, -11]],
      [[-4.5, -3.5, -7], [2.7, 6.6, 6], [8, 35, -8]],
      [[-7.8, -4.6, -3.4], [4.6, 6, 6.5], [-12, 92, 8]],
      [[-4.5, -3.6, -0.9], [3.4, 4.8, 5], [6, -42, -8]],
      [[-12, -5.9, -1], [6, 6.5, 8], [-8, 20, 6]],
      [[15, -5.2, -12], [7, 9, 9], [-4, 24, 10]],
      [[10.5, -4.2, -10], [5.4, 8.5, 8], [7, -65, 8]],
      [[7, -3.3, -8], [4.5, 7.3, 6], [-5, 18, 12]],
      [[4.9, -3.7, -6.5], [2.8, 6.4, 6], [8, -40, 8]],
      [[8.2, -4.9, -3], [4.5, 6.8, 6.5], [12, -90, -8]],
      [[4.7, -3.7, -0.6], [3.6, 4.8, 5], [-6, 44, 8]],
      [[12.5, -5.8, 0], [6, 6, 8], [6, -20, -8]],
      [[0, -3.9, -4], [15, 1.6, 18], [0, 0, 0]],
      [[0, -2.7, -0.4], [3.5, 1.9, 4], [0, 12, 0]],
    ],
  },
  {
    name: "foreground-stone",
    foreground: true,
    rocks: [
      [[-5.2, -3, 3.1], [3.8, 3.5, 4], [8, 55, -6]],
      [[-3.6, -2.9, 3], [2.8, 2.7, 3.4], [-8, -28, -9]],
      [[4.9, -3, 3.2], [3.7, 3.6, 4], [-8, -48, 8]],
      [[3.4, -2.85, 3.1], [2.6, 2.7, 3.4], [6, 30, 8]],
      [[0.2, -1.2, 3.1], [2.2, 0.85, 2.8], [0, -12, -3]],
    ],
  },
];

export function terrainLayout(profile = "desktop") {
  if (!["desktop", "mobile"].includes(profile)) throw new RangeError(`Unknown terrain profile: ${profile}`);
  const skip = profile === "mobile" ? [[0, 6], [0, 1, 6, 7, 8, 13], [0]] : [[], [], []];
  return LAYERS.map((layer, i) => ({
    name: layer.name,
    foreground: !!layer.foreground,
    matrices: layer.rocks
      .filter((_, j) => !skip[i].includes(j))
      .map(([p, s, r]) =>
        new THREE.Matrix4().compose(
          new THREE.Vector3(...p),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(...r.map(degToRad))),
          new THREE.Vector3(...s),
        ),
      ),
  }));
}

export const terrainWidthScale = (profile, aspect) => (profile === "desktop" ? clamp(aspect / (16 / 9), 0.25, 1.4) : 1);

export function bakedGeometry(mesh) {
  mesh.updateWorldMatrix(true, false);
  const geometry = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

export function rockMaterial(source, distant, maxAnisotropy) {
  const material = source.clone();
  material.name = distant ? "photogrammetric-distant-rock" : "photogrammetric-basalt";
  material.color.set(distant ? "#84909b" : "#929ba5");
  material.roughness = 0.94;
  material.metalness = 0;
  material.normalScale.set(0.85, 0.85);
  material.aoMapIntensity = 0.8;
  material.envMapIntensity = 0.2;
  material.transparent = false;
  material.opacity = 1;
  material.depthTest = true;
  material.depthWrite = true;
  const coverage = { value: 1 };
  const rimColor = { value: new THREE.Color("#59AFFF") };
  const rimStrength = { value: distant ? 0.55 : 1.45 };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uRockCoverage = coverage;
    shader.uniforms.uRockRimColor = rimColor;
    shader.uniforms.uRockRimStrength = rimStrength;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `
      #include <common>
      varying vec3 vRockWorldPosition;
    `,
      )
      .replace(
        "#include <worldpos_vertex>",
        `
      #include <worldpos_vertex>
      vec4 rockPosition = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        rockPosition = instanceMatrix * rockPosition;
      #endif
      vRockWorldPosition = (modelMatrix * rockPosition).xyz;
    `,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `
      #include <common>
      uniform float uRockCoverage;
      uniform vec3 uRockRimColor;
      uniform float uRockRimStrength;
      varying vec3 vRockWorldPosition;
    `,
      )
      .replace(
        "#include <clipping_planes_fragment>",
        `
      #include <clipping_planes_fragment>
      float coverageNoise = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(.06711056, .00583715))));
      if (uRockCoverage < coverageNoise) discard;
    `,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `
      #include <emissivemap_fragment>
      vec3 rockWorldNormal = inverseTransformDirection(normal, viewMatrix);
      vec3 coreOffset = vec3(0.0, .2, 0.0) - vRockWorldPosition;
      vec3 towardsCore = coreOffset * inversesqrt(max(dot(coreOffset, coreOffset), .0001));
      vec3 rockView = vViewPosition * inversesqrt(max(dot(vViewPosition, vViewPosition), .0001));
      // pow(negative, fractional) is undefined and can poison bloom with NaN, so clamp both ends.
      float grazing = pow(clamp(1.0 - dot(normal, rockView), 0.0, 1.0), 1.6);
      float coreFacing = .35 + .65 * clamp(dot(rockWorldNormal, towardsCore), 0.0, 1.0);
      float stoneDetail = .55 + .45 * clamp(dot(diffuseColor.rgb, vec3(.2126, .7152, .0722)) * 3.0, 0.0, 1.0);
      totalEmissiveRadiance += uRockRimColor * uRockRimStrength * grazing * coreFacing * stoneDetail;
    `,
      );
  };
  material.customProgramCacheKey = () => "hero-rock-opaque-coverage-blue-rim-finite-v3";
  for (const map of [material.map, material.normalMap, material.roughnessMap]) {
    if (map) map.anisotropy = Math.min(4, maxAnisotropy);
  }
  return { material, opacity: coverage };
}

// Returns a function that finds the terrain height under the beam (x=0, z=-0.15).
export function createGroundProbe() {
  const ray = new THREE.Raycaster(new THREE.Vector3(0, 8, -0.15), new THREE.Vector3(0, -1, 0), 0, 30);
  const hits = [];
  return (meshes) => {
    let top = -7.5;
    for (const mesh of meshes) {
      if (!mesh || !mesh.parent.visible) continue;
      mesh.updateWorldMatrix(true, false);
      hits.length = 0;
      mesh.raycast(ray, hits);
      for (const hit of hits) top = Math.max(top, hit.point.y);
    }
    return top + 0.035;
  };
}

export function terrainMotion(page, pointer, reduced = false) {
  const k = reduced ? 0 : clamp(pointer.z, 0, 1);
  const x = k ? clamp(pointer.x, -1, 1) * k : 0;
  const y = k ? clamp(pointer.y, -1, 1) * k : 0;
  return {
    backgroundAlpha: 1 - smoothstep(page, 0.34, 0.545),
    foregroundAlpha: 1 - smoothstep(page, 0.34, 0.475),
    backgroundX: -x * 0.1,
    backgroundY: -y * 0.05,
    backgroundYaw: -x * 0.0035,
    foregroundX: -x * 0.16,
    foregroundY: -y * 0.075,
    foregroundZ: 0,
    foregroundYaw: -x * 0.008,
    foregroundRoll: y * 0.004,
    foregroundScale: 1,
  };
}

export const SKY_TEXTURE = "/assets/img/Regular-BG-2_compressed.jpg";
export const ROCK_MODEL = "/assets/rocks/rock.glb";
export const SKY_DISTANCE = -76;
export const SKY_VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
export const SKY_FRAGMENT = `
  uniform sampler2D uSky;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    vec3 color = texture2D(uSky, vUv).rgb;
    color *= mix(.53, .76, smoothstep(.0, .72, vUv.y));
    gl_FragColor = vec4(color, uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
