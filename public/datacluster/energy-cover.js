// Shared by the final portal → footer and the preloader → hero.
export const ENERGY_COVER_VERTEX = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
export const ENERGY_COVER_FRAGMENT = `varying vec2 vUv;uniform float uFill,uOpen,uTime,uAspect;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
  void main(){vec2 p=(vUv-.5)*vec2(uAspect,1.);float n=noise(p*12.+uTime*.12)*.055+noise(p*30.-uTime*.2)*.023;
    float d=length(p)+n;float extent=length(vec2(uAspect,1.))*.55;float radius=uOpen*(extent+.2);
    float hole=1.-smoothstep(radius-.06,radius+.065,d);if(uOpen<.001)hole=0.;
    float edge=exp(-abs(d-radius)*38.);float flood=uFill>.999?1.:smoothstep(d-.15,d+.28,uFill*(extent+.4));
    float alpha=flood*(1.-hole);vec3 color=mix(vec3(.12,.52,1.),vec3(1.),clamp(uFill+edge*.55,0.,1.));
    color+=vec3(.12,.3,.4)*edge;gl_FragColor=vec4(color,alpha);}`;
