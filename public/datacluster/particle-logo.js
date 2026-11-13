import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { LOGO, socialIndex } from './social-config.js';

export function logoShapes(source) {
  const { paths } = new SVGLoader().parse(source);
  // SVGLoader also visits mask geometry. The LinkedIn SVG's white rectangular
  // mask is NOT a visible logo face; admitting it would fill all three cutouts.
  return paths.filter(path=>{
    for(let node=path.userData.node;node;node=node.parentNode) {
      if(['mask','defs','clipPath'].includes(node.nodeName)) return false;
    }
    return path.userData.style.fill!=='none';
  }).flatMap(path=>SVGLoader.createShapes(path));
}

export function seededRandom(seed) {
  return ()=>{
    let t=seed+=0x6D2B79F5;
    t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);
    return ((t^(t>>>14))>>>0)/4294967296;
  };
}

// The renderable result contains points only. The temporary solid extrusions
// supply caps, bevels, inner hole walls and a small amount of true inner volume.
export function sampleExtrusion(shapes, count, seed=42) {
  const random=seededRandom(seed), scale=LOGO.size/LOGO.extent;
  const solids=shapes.map(shape=>{
    const geo=new THREE.ExtrudeGeometry(shape,{depth:LOGO.depth,steps:1,curveSegments:24,
      bevelEnabled:true,bevelSegments:3,bevelSize:LOGO.bevel,bevelThickness:LOGO.bevel});
    geo.translate(-LOGO.extent/2,-LOGO.extent/2,-LOGO.depth/2);
    geo.scale(scale,-scale,scale);return geo;
  });
  const triangles=[], caps=[];let area=0,capArea=0;
  const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),ab=new THREE.Vector3(),ac=new THREE.Vector3();
  for(const geo of solids) {
    const p=geo.attributes.position,n=geo.attributes.normal;
    for(let i=0;i<p.count;i+=3) {
      a.fromBufferAttribute(p,i);b.fromBufferAttribute(p,i+1);c.fromBufferAttribute(p,i+2);
      const triangleArea=ab.subVectors(b,a).cross(ac.subVectors(c,a)).length()*.5;
      if(triangleArea<1e-10) continue;
      const side=Math.abs(n.getZ(i))<.95;
      area+=triangleArea*(side?2.6:1);triangles.push({p,n,i,end:area});
      if(n.getZ(i)>.999) {capArea+=triangleArea;caps.push({p,n,i,end:capArea});}
    }
  }
  if(!area||!capArea) throw new Error('Social SVG has no extrudable filled surface');
  function pick(list,total) {
    const value=random()*total;let lo=0,hi=list.length-1;
    while(lo<hi){const mid=(lo+hi)>>1;if(list[mid].end<value)lo=mid+1;else hi=mid;}
    return list[lo];
  }
  const position=new Float32Array(count*3),normal=new Float32Array(count*3),scatter=new Float32Array(count*3);
  const seeds=new Float32Array(count),layers=new Float32Array(count),stats={front:0,back:0,wall:0,volume:0};
  const direction=new THREE.Vector3();
  for(let j=0;j<count;j++) {
    const interior=random()<.16,tri=interior?pick(caps,capArea):pick(triangles,area);
    const r=Math.sqrt(random()),s=random(),weights=[1-r,r*(1-s),r*s];
    for(let axis=0;axis<3;axis++) {
      let p=0,n=0;
      for(let k=0;k<3;k++){p+=tri.p.array[(tri.i+k)*3+axis]*weights[k];n+=tri.n.array[(tri.i+k)*3+axis]*weights[k];}
      position[j*3+axis]=p;normal[j*3+axis]=n;
    }
    if(interior){position[j*3+2]=(random()-.5)*LOGO.depth*scale;layers[j]=1;stats.volume++;}
    else if(normal[j*3+2]>.95)stats.front++;
    else if(normal[j*3+2]<-.95)stats.back++;
    else stats.wall++;
    direction.set(random()*2-1,random()*2-1,random()*2-1).normalize();direction.toArray(scatter,j*3);
    seeds[j]=random();
  }
  solids.forEach(geo=>geo.dispose());
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(position,3));
  geometry.setAttribute('aNormal',new THREE.BufferAttribute(normal,3));
  geometry.setAttribute('aScatter',new THREE.BufferAttribute(scatter,3));
  geometry.setAttribute('aSeed',new THREE.BufferAttribute(seeds,1));
  geometry.setAttribute('aInterior',new THREE.BufferAttribute(layers,1));
  geometry.userData.stats=stats;geometry.computeBoundingSphere();return geometry;
}

export function morphWeight(progress,seed) {
  const t=Math.max(0,Math.min(1,(progress-seed*.14)/.86));
  return t*t*(3-2*t);
}

// One persistent Points object: every particle travels from its current pose
// to the matching point in the selected SVG. Buffer uploads happen on a click,
// never in the frame loop. Retargeting snapshots the exact shader pose so rapid
// clicks/reversals do not pop back to the previous completed logo.
export function createLogoMorph(geometries,initial=1) {
  const targets=geometries.map(geo=>({
    position:geo.attributes.position.array,
    normal:geo.attributes.aNormal.array,
    interior:geo.attributes.aInterior.array,
  }));
  const count=geometries[initial].attributes.position.count;
  if(geometries.some(geo=>geo.attributes.position.count!==count))throw new Error('Particle morph targets must have the same count');
  const geometry=new THREE.BufferGeometry(),base=geometries[initial];
  for(const name of ['position','aNormal','aScatter','aSeed','aInterior'])geometry.setAttribute(name,base.attributes[name].clone());
  geometry.setAttribute('aTarget',base.attributes.position.clone());
  geometry.setAttribute('aTargetNormal',base.attributes.aNormal.clone());
  geometry.setAttribute('aTargetInterior',base.attributes.aInterior.clone());
  for(const name of ['position','aNormal','aInterior','aTarget','aTargetNormal','aTargetInterior'])geometry.attributes[name].setUsage(THREE.DynamicDrawUsage);
  geometry.computeBoundingSphere();
  geometries.forEach(geo=>geo.dispose());
  let selected=socialIndex(initial),started=0,animating=false;
  const progress=time=>animating?Math.max(0,Math.min(1,(time-started)/LOGO.morphSeconds)):1;
  const a=geometry.attributes;
  return {geometry,
    get selected(){return selected;},
    get storageBytes(){return targets.reduce((sum,t)=>sum+t.position.byteLength+t.normal.byteLength+t.interior.byteLength,0)+Object.values(a).reduce((sum,attr)=>sum+attr.array.byteLength,0);},
    progress,
    select(index,time=0,reduced=false){
      const next=socialIndex(index);if(next===selected)return false;
      const current=progress(time),target=targets[next];
      for(let i=0;i<count;i++) {
        const seed=a.aSeed.array[i],w=morphWeight(current,seed),arc=Math.sin(Math.PI*w)*(.22+seed*.28);
        for(let axis=0;axis<3;axis++) {
          const j=i*3+axis;
          a.position.array[j]=a.position.array[j]*(1-w)+a.aTarget.array[j]*w+a.aScatter.array[j]*arc;
          a.aNormal.array[j]=a.aNormal.array[j]*(1-w)+a.aTargetNormal.array[j]*w;
        }
        a.aInterior.array[i]=a.aInterior.array[i]*(1-w)+a.aTargetInterior.array[i]*w;
      }
      a.aTarget.array.set(target.position);a.aTargetNormal.array.set(target.normal);a.aTargetInterior.array.set(target.interior);
      if(reduced){a.position.array.set(target.position);a.aNormal.array.set(target.normal);a.aInterior.array.set(target.interior);}
      for(const name of ['position','aNormal','aInterior','aTarget','aTargetNormal','aTargetInterior'])a[name].needsUpdate=true;
      selected=next;started=time;animating=!reduced;return true;
    },
  };
}

export const PARTICLE_VERTEX = `
  attribute vec3 aNormal,aScatter,aTarget,aTargetNormal;attribute float aSeed,aInterior,aTargetInterior;
  uniform float uTime,uPR,uAspect,uHover,uMorph,uMotion,uScatter;
  uniform vec2 uPointer;varying float vBrightness,vAlpha;
  void main(){
    float phase=clamp((uMorph-aSeed*.14)/.86,0.,1.);
    float morph=phase*phase*(3.-2.*phase);
    vec3 p=mix(position,aTarget,morph);
    p+=aScatter*sin(3.141592653589793*morph)*(.22+aSeed*.28);
    float interior=mix(aInterior,aTargetInterior,morph);
    vec4 base=modelViewMatrix*vec4(p,1.);vec4 clip=projectionMatrix*base;
    vec2 delta=(clip.xy/clip.w-uPointer)*vec2(uAspect,1.);
    float force=exp(-dot(delta,delta)/.058)*uHover*uMotion;
    vec3 chaotic=aScatter*(.85+aSeed*1.3);
    chaotic+=vec3(sin(uTime*1.05+aSeed*73.),cos(uTime*.83+aSeed*53.),sin(uTime*.71+aSeed*91.))*.23;
    p+=chaotic*force*1.35*uScatter;
    p.xy+=normalize(p.xy+vec2(.001))*force*.35*uScatter;
    p+=aScatter*sin(uTime*.6+aSeed*40.)*.008*uMotion;
    vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
    gl_PointSize=clamp((.95+aSeed*1.35)*uPR*14.2/-mv.z, .8, 4.5*uPR);
    vec3 n=normalize(normalMatrix*mix(aNormal,aTargetNormal,morph)+vec3(.00001));
    float light=.33+.62*max(dot(n,normalize(vec3(-.65,.8,.7))),0.);
    float edge=pow(1.-abs(dot(n,normalize(-base.xyz))),2.);
    vBrightness=(light+edge*.34)*mix(1.,.4,interior)*(.72+aSeed*.55);
    vAlpha=mix(1.,.35,interior);
  }`;
export const PARTICLE_FRAGMENT = `
  varying float vBrightness,vAlpha;
  void main(){
    float r=length(gl_PointCoord-.5);
    float alpha=(1.-smoothstep(.12,.5,r))*vAlpha;
    gl_FragColor=vec4(vec3(.055,.48,1.28)*vBrightness,alpha);
  }`;
