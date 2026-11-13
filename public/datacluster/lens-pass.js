import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import * as THREE from 'three';
import { CHROMATIC_LENS_GLSL, createLensUniforms } from './chromatic-lens.js';

export function createLensPass() {
  return new ShaderPass({
    uniforms: { tDiffuse: { value: null }, ...createLensUniforms(THREE) },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uAmount, uAspect; varying vec2 vUv;
      ${CHROMATIC_LENS_GLSL}
      void main(){ vec4 centreColor = texture2D(tDiffuse, vUv);
        gl_FragColor = nodalLens(tDiffuse, vUv, centreColor, uAmount, uAspect); }`,
  });
}
