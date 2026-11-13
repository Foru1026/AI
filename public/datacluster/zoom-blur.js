import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// A single-frame radial filter: no temporal history, no framebuffer feedback.
export function createZoomBlur() {
  return new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uStrength: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `varying vec2 vUv; uniform sampler2D tDiffuse; uniform float uStrength;
      void main(){
        vec2 direction = vUv - .5;
        vec4 col = texture2D(tDiffuse, vUv)*.24;
        for(int i = 1; i <= 4; i++) {
          float offset = float(i)/4.0*uStrength;
          col += texture2D(tDiffuse, clamp(vUv - direction*offset, .001, .999))*.095;
          col += texture2D(tDiffuse, clamp(vUv + direction*offset, .001, .999))*.095;
        }
        gl_FragColor = col;
      }`,
  });
}
