import * as THREE from 'three';

// Actual PBR sphere: the studio reflects on the pale sclera, not a photograph.
// Only the small pupil is an opening onto the next scene.
export function createEyeMaterial(texture, irisRadius, irisTexture) {
  const uniforms = {
    uDestination: { value: texture }, uT: { value: 0 }, uPupil: { value: .32 },
    uDive: { value: 0 }, uPreviewBlend: { value: 0 }, uOpen: { value: 0 }, uResolution: { value: new THREE.Vector2(1, 1) },
    uImageAspect: { value: 1.6 },
    uIris: { value: irisTexture },
  };
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: .105, metalness: 0, clearcoat: 1,
    clearcoatRoughness: .045, ior: 1.38, specularIntensity: .75,
    envMapIntensity: .75, fog: false,
  });
  material.uniforms = uniforms;
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vEyeNormal;')
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nvEyeNormal = normal;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `
      #include <common>
      varying vec3 vEyeNormal;
      uniform sampler2D uDestination, uIris;
      uniform vec2 uResolution;
      uniform float uImageAspect, uT, uPupil, uDive, uPreviewBlend, uOpen;
      float eyeHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
      float eyeNoise(vec2 p) {
        vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
        return mix(mix(eyeHash(i), eyeHash(i + vec2(1,0)), f.x), mix(eyeHash(i + vec2(0,1)), eyeHash(i + 1.0), f.x), f.y);
      }
      vec2 destinationUV(vec2 uv) {
        float aspect = uResolution.x / uResolution.y;
        vec2 span = aspect > uImageAspect ? vec2(1.0, uImageAspect/aspect) : vec2(aspect/uImageAspect, 1.0);
        return .5 + (uv - .5)*span;
      }
    `).replace('#include <map_fragment>', `
      #include <map_fragment>
      vec3 en = normalize(vEyeNormal);
      float er = length(en.xy) / ${irisRadius.toFixed(4)};
      float angle = atan(en.y, en.x);
      float front = smoothstep(.1, .5, en.z);
      float iris = (1.0 - smoothstep(.97, 1.035, er))*front;
      // Use the supplied iris verbatim. No procedural neon ring or replacement
      // fibres. Clamp to its circular artwork so transparent corners never leak.
      vec2 irisXY = en.xy / ${irisRadius.toFixed(4)};
      irisXY /= max(1.0, length(irisXY)/.995);
      vec4 irisSample = texture2D(uIris, .5 + irisXY*.5);
      vec3 irisColor = irisSample.rgb;
      iris *= irisSample.a;
      float veins = eyeNoise(vec2(cos(angle), sin(angle))*30.0 + er*13.0);
      vec3 sclera = mix(vec3(.52, .69, .79), vec3(.73, .85, .9), smoothstep(-.6, .9, en.y));
      sclera *= .97 + .03*veins;
      vec3 eyeColor = mix(sclera, irisColor, iris);
      float pupil = (1.0 - smoothstep(uPupil - .006, uPupil + .014, er))*front;
      vec2 localUV = .5 + en.xy / (${irisRadius.toFixed(4)}*uPupil)*.5;
      // Seen through the pupil the world bulges like a lens and slowly turns;
      // both relax to a flat, still view as the preview grows to screen space.
      vec2 lensQ = localUV - .5;
      float lens = 1.0 - uPreviewBlend;
      float lensSpin = .35*lens*(1.0 - uOpen)*(1.0 - 2.0*dot(lensQ, lensQ));
      lensQ = mat2(cos(lensSpin), -sin(lensSpin), sin(lensSpin), cos(lensSpin))*lensQ;
      lensQ *= mix(1.0, .72 + 1.12*dot(lensQ, lensQ), lens);
      localUV = .5 + lensQ;
      vec2 viewUV = gl_FragCoord.xy / uResolution;
      // The round pupil shows a square crop of the frame, so the world keeps
      // its true proportions on portrait and landscape screens alike.
      vec2 squareSpan = uImageAspect < 1.0 ? vec2(1.0, uImageAspect) : vec2(1.0/uImageAspect, 1.0);
      vec2 imageUV = mix(.5 + (localUV - .5)*squareSpan, destinationUV(viewUV), uPreviewBlend);
      vec3 beyond = texture2D(uDestination, clamp(imageUV, .001, .999)).rgb;
      // A thin energy rim traces the pupil while the world is forming inside it.
      float pupilRim = exp(-pow((er - uPupil)/.016, 2.0))*front*uOpen*(1.0 - uPreviewBlend);
      eyeColor = mix(eyeColor, beyond*.14, pupil);
      diffuseColor.rgb *= eyeColor;
    `).replace('#include <emissivemap_fragment>', `
      #include <emissivemap_fragment>
      totalEmissiveRadiance += irisColor*.1*iris*(1.0 - pupil);
      // The landscape is self-lit only through the pupil. The sclera stays opaque.
      totalEmissiveRadiance += beyond*mix(.45, 1.0, uDive)*smoothstep(0.0, .35, uOpen)*pupil;
      totalEmissiveRadiance += vec3(.12, .5, 1.25)*pupilRim*(.6 + .4*sin(uT*2.4 + angle*3.0));
    `);
  };
  material.customProgramCacheKey = () => 'nodal-pupil-eye-supplied-iris-v6';
  return material;
}

export function createDestinationScreen(texture) {
  const material = new THREE.ShaderMaterial({
    uniforms: { uImage: { value: texture }, uAlpha: { value: 0 }, uAspect: { value: 1 }, uImageAspect: { value: 1.6 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `varying vec2 vUv; uniform sampler2D uImage; uniform float uAlpha, uAspect, uImageAspect;
      void main(){
        vec2 span = uAspect > uImageAspect ? vec2(1., uImageAspect/uAspect) : vec2(uAspect/uImageAspect, 1.);
        gl_FragColor = vec4(texture2D(uImage, .5 + (vUv - .5)*span).rgb, uAlpha);
      }`,
    transparent: true, depthTest: false, depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  mesh.frustumCulled = false; mesh.renderOrder = 10000; mesh.visible = false;
  return mesh;
}
