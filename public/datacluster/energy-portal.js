import * as THREE from 'three';
import { logoShapes, seededRandom } from './particle-logo.js';
import { PORTAL, clamp, createPortalPlayback, portalFraming, portalPointer, portalState, sparkEnvelope } from './portal-timeline.js';
import { lightningPaths, energyRingPath } from './lightning-shape.js';
import { viewportProfile } from './device-profile.js';

const vertex = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  imageScale = `vec2(${PORTAL.aspect.toFixed(8)},1.)`,
  centre = `vec2(${PORTAL.centre[0]},${PORTAL.centre[1].toFixed(4)})`;
// All overlays use the same image-space/depth displacement as the photograph.
// The small inverse approximation is within a fraction of a pixel at this gain.
const depthWarp = `uniform sampler2D uDepth;uniform vec2 uPointer;
  vec2 depthWarp(vec2 p){float d=texture2D(uDepth,.5+p/${imageScale}).r;
    return p-uPointer*${PORTAL.parallax}*(d-.05)*${imageScale};}`;

async function loadTexture(url, color, renderer, maxWidth) {
  // Ordinary HTML images: one normal Y upload flip, no ImageBitmap ambiguity.
  const image = new Image(); image.src = url; await image.decode();
  let source=image;
  const width=Math.min(maxWidth,renderer.capabilities.maxTextureSize);
  if(image.naturalWidth>width){
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=Math.round(image.naturalHeight*width/image.naturalWidth);
    canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);source=canvas;
  }
  const texture = new THREE.Texture(source); texture.colorSpace = color;
  texture.minFilter = texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false; texture.needsUpdate = true;
  renderer.initTexture(texture); return texture;
}

export function samplePortalMark(shapes, count) {
  const random = seededRandom(7108), triangles = []; let total = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), ab = new THREE.Vector3(), ac = new THREE.Vector3();
  for (const shape of shapes) {
    const geometry = new THREE.ExtrudeGeometry(shape, {depth: 2.6, steps: 1, curveSegments: 12,
      bevelEnabled: true, bevelSize: .35, bevelThickness: .35, bevelSegments: 2});
    geometry.translate(-15, -16, -1.3); geometry.scale(PORTAL.logoSize/32, -PORTAL.logoSize/32, PORTAL.logoSize/32);
    const p = geometry.attributes.position;
    for (let i=0; i<p.count; i+=3) {
      a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i+1); c.fromBufferAttribute(p, i+2);
      total += ab.subVectors(b,a).cross(ac.subVectors(c,a)).length()*.5;
      triangles.push({ end: total, vertices: [...a.toArray(), ...b.toArray(), ...c.toArray()] });
    }
    geometry.dispose();
  }
  if (!total) throw new Error('NODDAL mark has no particle surface');
  const position = new Float32Array(count*3), origin = new Float32Array(count*3), seed = new Float32Array(count);
  for (let i=0; i<count; i++) {
    const pick = random()*total; let lo=0, hi=triangles.length-1;
    while(lo<hi){const mid=(lo+hi)>>1;if(triangles[mid].end<pick)lo=mid+1;else hi=mid;}
    const v=triangles[lo].vertices, r=Math.sqrt(random()), s=random(), weights=[1-r,r*(1-s),r*s];
    for(let axis=0;axis<3;axis++)position[i*3+axis]=v[axis]*weights[0]+v[axis+3]*weights[1]+v[axis+6]*weights[2];
    position[i*3]+=PORTAL.centre[0];position[i*3+1]+=PORTAL.centre[1];
    const angle=(i%PORTAL.rayCount)/PORTAL.rayCount*Math.PI*2 + (random()-.5)*.045;
    origin[i*3]=Math.cos(angle)*PORTAL.radius+PORTAL.centre[0]; origin[i*3+1]=Math.sin(angle)*PORTAL.radius+PORTAL.centre[1];
    origin[i*3+2]=.015; seed[i]=random();
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(position,3));
  geometry.setAttribute('aOrigin',new THREE.BufferAttribute(origin,3));
  geometry.setAttribute('aSeed',new THREE.BufferAttribute(seed,1)); return geometry;
}

function pointMaterial(uniforms, streams = false) {
  return new THREE.ShaderMaterial({uniforms, transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader: `${depthWarp}
      attribute vec3 aOrigin;attribute float aSeed;uniform float uAssembly,uCharge,uTime,uPR,uReveal,uMotion,uZoom,uCore,uOverload;
      varying float vAlpha,vLight;
      void main(){
        float t=clamp((uAssembly-aSeed*.22)/.78,0.,1.);t=t*t*(3.-2.*t);
        ${streams ? 't=fract(aSeed+uTime*.19*uMotion);' : ''}
        vec3 p=mix(aOrigin,position,t);
        p.xy+=vec2(sin(aSeed*73.+t*16.),cos(aSeed*97.+t*13.))*sin(t*3.14159)*.016;
        p.xy=depthWarp(p.xy);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
        gl_PointSize=clamp((.9+aSeed*1.6)*uPR*sqrt(uZoom),1.,7.*uPR);
        // More surface samples, not 75% more exposure/bloom.
        vAlpha=uReveal*${streams ? 'uCharge*sin(t*3.14159)*.42' : '.72*smoothstep(aSeed*.22,aSeed*.22+.035,uAssembly)*(.12+.88*t)'};
        // The continuous silhouette halo owns the soft glow. Keep individual
        // samples quieter so random edge clusters do not produce bright teeth.
        vLight=${streams ? '1.' : '1.05+aSeed*.35+.06*sin(uTime*1.2+aSeed*54.)*uMotion'};
        ${streams ? `if(aSeed<0.){p=aOrigin;p.xy=depthWarp(p.xy);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
          gl_PointSize=22.*uPR*sqrt(uZoom);vAlpha=uReveal*uCharge*.85;vLight=2.;}` : ''}
        // The solid energy silhouette takes over before individual samples
        // are enlarged. No point-size explosion during the final close-up.
        vLight*=1.+uOverload*1.5;vAlpha*=1.-uCore;
      }`,
    fragmentShader:`varying float vAlpha,vLight;void main(){float r=length(gl_PointCoord-.5);
      float a=exp(-r*r*18.)*(1.-smoothstep(.34,.5,r))*vAlpha;
      gl_FragColor=vec4(vec3(.30,.85,1.8)*vLight,a);}`});
}

export function portalMarkGlow(shapes, uniforms) {
  // Three rounded, 45-degree tiles from the actual emblem. Derive their local
  // bounds once; a single small analytical quad gives a continuous smooth halo
  // instead of increasing full-screen bloom resolution or particle density.
  const scale=PORTAL.logoSize/32,centres=[],bounds=[],span=PORTAL.logoSize*1.8;
  for(const shape of shapes){
    const box=new THREE.Box2();
    for(const point of shape.getPoints(24)){
      const x=(point.x-15)*scale,y=(16-point.y)*scale;
      box.expandByPoint(new THREE.Vector2((x+y)*Math.SQRT1_2,(y-x)*Math.SQRT1_2));
    }
    centres.push(box.getCenter(new THREE.Vector2()));
    bounds.push(box.getSize(new THREE.Vector2()).multiplyScalar(.5));
  }
  if(centres.length!==3)throw new Error('Portal glow requires the three emblem tiles');
  const material=new THREE.ShaderMaterial({
    uniforms:{...uniforms,uGlowCentres:{value:centres},uGlowBounds:{value:bounds}},
    transparent:true,depthTest:false,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`${depthWarp}varying vec2 vGlow;
      void main(){vGlow=position.xy-${centre};vec3 p=position;p.xy=depthWarp(p.xy);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader:`varying vec2 vGlow;uniform vec2 uGlowCentres[3],uGlowBounds[3];uniform float uReveal,uAssembly,uCore;
      float tile(vec2 p,vec2 c,vec2 b){float radius=${(1.9514*scale).toFixed(8)};
        vec2 q=abs(p-c)-b+radius;return length(max(q,0.))+min(max(q.x,q.y),0.)-radius;}
      void main(){vec2 q=vec2(vGlow.x+vGlow.y,vGlow.y-vGlow.x)*.70710678;
        float d=min(tile(q,uGlowCentres[0],uGlowBounds[0]),min(tile(q,uGlowCentres[1],uGlowBounds[1]),tile(q,uGlowCentres[2],uGlowBounds[2])));
        float outside=max(d,0.);
        float halo=(exp(-pow(outside/.011,2.))*.24+exp(-pow(outside/.029,2.))*.12)*smoothstep(-.003,.003,d);
        // Feather the finite quad too, so it cannot reveal a square boundary.
        float edge=1.-smoothstep(${(span*.40).toFixed(8)},${(span*.49).toFixed(8)},max(abs(vGlow.x),abs(vGlow.y)));
        gl_FragColor=vec4(vec3(.18,.65,1.4),halo*edge*uReveal*smoothstep(.65,1.,uAssembly)*(1.-uCore));}`,
  });
  const geometry=new THREE.PlaneGeometry(span,span);geometry.translate(PORTAL.centre[0],PORTAL.centre[1],.025);
  const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;mesh.renderOrder=1;mesh.visible=false;return mesh;
}

export function portalEnergyCore(shapes,uniforms) {
  // Only revealed during approach/overload, never in the particle inspection.
  // One tiny vector silhouette fills holes in the glowing mark at close range.
  const geometry=new THREE.ShapeGeometry(shapes,12);
  geometry.translate(-15,-16,0);geometry.scale(PORTAL.logoSize/32,-PORTAL.logoSize/32,1);
  geometry.translate(PORTAL.centre[0],PORTAL.centre[1],.04);
  const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthTest:false,depthWrite:false,
    blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
    vertexShader:`${depthWarp}void main(){vec3 p=position;p.xy=depthWarp(p.xy);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader:'uniform float uCore,uOverload,uReveal;void main(){gl_FragColor=vec4(vec3(.9,1.05,1.3)*(1.+uOverload*1.4),uCore*uReveal);}'});
  const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;mesh.renderOrder=2;mesh.visible=false;return mesh;
}

// Each path is one tapered ribbon: a thin white core and a wider blue halo in
// the same draw call. Normals follow the actual fractures, not a radial axis.
export function lightningBatch(uniforms, count, segments, mode) {
  const nodes=segments+1,vertices=count*nodes*2,geometry=new THREE.BufferGeometry(),indices=[];
  for(const [name,size] of [['position',3],['aNormal',2],['aAlong',1],['aSide',1],['aWeight',1],['aWidth',1],['aBirth',1],['aLife',1]])
    geometry.setAttribute(name,new THREE.BufferAttribute(new Float32Array(vertices*size),size).setUsage(THREE.DynamicDrawUsage));
  const a=geometry.attributes;
  for(let b=0;b<count;b++)for(let j=0;j<nodes;j++){
    const i=(b*nodes+j)*2;a.aSide.setX(i,-1);a.aSide.setX(i+1,1);
    a.aAlong.setX(i,j/segments);a.aAlong.setX(i+1,j/segments);
    if(j<segments)indices.push(i,i+1,i+2,i+1,i+3,i+2);
  }
  geometry.setIndex(indices);
  const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
    vertexShader:`${depthWarp}
      attribute vec2 aNormal;attribute float aAlong,aSide,aWeight,aWidth,aBirth,aLife;uniform float uTime,uZoom;
      varying float vAlong,vSide,vWeight,vAge,vLife;
      void main(){vec3 p=position;p.xy+=aNormal*aSide*aWidth/sqrt(uZoom);
        p.xy=depthWarp(p.xy);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
        vAlong=aAlong;vSide=aSide;vWeight=aWeight;vAge=uTime-aBirth;vLife=aLife;}`,
    fragmentShader:`varying float vAlong,vSide,vWeight,vAge,vLife;uniform float uCharge,uReveal,uTime,uMotion,uCore;
      float ease(float a,float b,float x){float t=clamp((x-a)/(b-a),0.,1.);return t*t*t*(t*(t*6.-15.)+10.);}
      void main(){float gain;
        ${mode==='cursor' ? `gain=ease(0.,.012,vAge)*(1.-ease(.035,vLife,vAge));
          gain*=1.-smoothstep(ease(0.,.025,vAge)-.02,ease(0.,.025,vAge)+.02,vAlong);` : mode==='ring' ? `
          float hot=pow(.5+.5*sin(vAlong*18.84956-uTime*2.6*uMotion),14.);
          gain=(.55+.45*hot)*smoothstep(0.,.18,uCharge);` : `
          float pulse=.24+.76*(1.-ease(.018,vLife,vAge));
          gain=mix(.65,pulse,uMotion)*smoothstep(0.,.05,uCharge);
          float head=clamp(uCharge*1.25,0.,1.);
          gain*=1.-smoothstep(head-.025,head+.025,vAlong);`}
        float core=exp(-vSide*vSide*42.),halo=exp(-vSide*vSide*3.5);
        vec3 colour=mix(vec3(.035,.43,1.55),vec3(.8,1.25,1.65),core);
        gl_FragColor=vec4(colour,halo*vWeight*gain*uReveal*(1.-uCore));}`});
  const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;
  return {mesh,
    write(slot,path,{birth=0,life=1,width=.0055,z=.015,offset=[0,0],ring=false}={}){
      const points=path.points,weight=path.weight??1,thickness=path.width??1;
      if(points.length!==nodes*2)throw new Error('Lightning path exceeds its fixed ribbon slot');
      for(let j=0;j<nodes;j++){
        const before=ring?(j+segments-1)%segments:Math.max(0,j-1),after=ring?(j+1)%segments:Math.min(segments,j+1);
        const dx=points[after*2]-points[before*2],dy=points[after*2+1]-points[before*2+1],d=Math.hypot(dx,dy)||1,t=j/segments;
        const taper=ring?1:(path.parent<0?.65+.35*Math.sin(t*Math.PI):Math.pow(1-t,.7));
        for(let k=0;k<2;k++){
          const i=(slot*nodes+j)*2+k;
          a.position.setXYZ(i,points[j*2]+offset[0],points[j*2+1]+offset[1],z);
          a.aNormal.setXY(i,-dy/d,dx/d);a.aWidth.setX(i,width*thickness*taper);
          a.aWeight.setX(i,weight*(ring||path.parent<0?1:Math.pow(1-t,.65)));
          a.aBirth.setX(i,birth);a.aLife.setX(i,life);
        }
      }
    },
    upload(){for(const name of ['position','aNormal','aWeight','aWidth','aBirth','aLife'])a[name].needsUpdate=true;},
  };
}

function energyRays(uniforms,targets,mobile) {
  const segments=mobile?32:PORTAL.raySegments,branches=mobile?2:PORTAL.rayBranches;
  const batch=lightningBatch(uniforms,PORTAL.rayCount*(branches+1),segments,'ray'),random=seededRandom(712);
  const bolts=Array.from({length:PORTAL.rayCount},(_,index)=>({index,nextAt:0,life:.7+random()*.6}));
  let started=false;
  function refresh(b,time){
    const angle=b.index/PORTAL.rayCount*Math.PI*2;
    const start=[Math.cos(angle)*PORTAL.radius+PORTAL.centre[0],Math.sin(angle)*PORTAL.radius+PORTAL.centre[1]];
    // Every bolt terminates on a real filled tile, not the empty emblem centre.
    const point=Math.floor(random()*targets.count),end=[targets.getX(point),targets.getY(point)];
    const paths=lightningPaths(start,end,Math.floor(random()*0x7fffffff),{segments,branches,roughness:.16+random()*.16});
    b.life=.62+random()*.72;b.nextAt=time+b.life;
    paths.forEach((path,i)=>batch.write(b.index*(branches+1)+i,path,{birth:time,life:b.life,width:.005+random()*.0015}));
  }
  bolts.forEach(b=>refresh(b,0));batch.upload();
  return {mesh:batch.mesh,update(time,charged,reduced){
    if(!charged||reduced)return;
    let changed=false;
    if(!started){
      // De-phase the eight ports: no whole-ring synchronized flashing.
      bolts.forEach(b=>refresh(b,time-random()*.5));started=true;changed=true;
    }else for(const b of bolts)if(time>=b.nextAt){refresh(b,time-random()*.035);changed=true;}
    if(changed)batch.upload();
  }};
}

function energyRing(uniforms,mobile) {
  const segments=mobile?128:PORTAL.ringSegments,batch=lightningBatch(uniforms,2,segments,'ring');
  for(let i=0;i<2;i++)batch.write(i,{points:energyRingPath(PORTAL.radius-i*.003,920+i,segments),weight:i?.34:.90},
    {width:i?.0032:.005,offset:PORTAL.centre,ring:true});
  batch.upload();return batch.mesh;
}

export function cursorSparks(uniforms) {
  // One pooled strike. Paths only upload at ignition, never while they fade.
  const batch=lightningBatch(uniforms,PORTAL.sparkCount*(PORTAL.sparkBranches+1),PORTAL.sparkSegments,'cursor');
  batch.mesh.visible=false;
  const random=seededRandom(339);let birth=-99,nextAt=0,strikes=0;
  return {mesh:batch.mesh,get strikes(){return strikes;},
    reset(){birth=-99;nextAt=0;strikes=0;batch.mesh.visible=false;},
    update(time,target,active){
      if(active&&time>=nextAt){
        birth=time;strikes++;nextAt=time+PORTAL.sparkDuration+PORTAL.sparkPause+random()*PORTAL.sparkPause*.12;
        const angle=Math.atan2(target.y-PORTAL.centre[1],target.x-PORTAL.centre[0])+(random()<.5?-1:1)*(.25+random()*.55);
        const start=[Math.cos(angle)*PORTAL.radius+PORTAL.centre[0],Math.sin(angle)*PORTAL.radius+PORTAL.centre[1]];
        const paths=lightningPaths(start,[target.x,target.y],Math.floor(random()*0x7fffffff),
          {segments:PORTAL.sparkSegments,branches:PORTAL.sparkBranches,roughness:.21});
        paths.forEach((path,i)=>batch.write(i,path,{birth,life:PORTAL.sparkDuration,width:.006,z:.07}));batch.upload();
      }
      const state=sparkEnvelope(time-birth,PORTAL.sparkDuration);
      batch.mesh.visible=!state.done;return state.done?0:1;
    }};
}

export async function createEnergyPortal(renderer) {
  const profile=viewportProfile(),mobile=profile!=='desktop',reduced=matchMedia('(prefers-reduced-motion: reduce)');
  // Resolution/particle budgets follow the viewport; interaction follows the
  // input device. A narrow desktop Chrome window is not a touch-only device.
  const hover=matchMedia('(hover: hover) and (pointer: fine)');
  const [image,depth,logoResponse]=await Promise.all([
    loadTexture(PORTAL.image,THREE.SRGBColorSpace,renderer,mobile?1536:2752),loadTexture(PORTAL.depth,THREE.NoColorSpace,renderer,mobile?1536:2752),
    fetch('../assets/interface/svg/logo.svg'),
  ]);
  if(!logoResponse.ok)throw new Error(`NODDAL logo: HTTP ${logoResponse.status}`);
  // Only the three emblem paths, never the wordmark paths following them.
  const shapes=logoShapes(await logoResponse.text()).slice(0,3);
  const uniforms={uImage:{value:image},uDepth:{value:depth},uPointer:{value:new THREE.Vector2()},
    uReveal:{value:0},uCharge:{value:0},uAssembly:{value:0},uCore:{value:0},uOverload:{value:0},uTime:{value:0},uPR:{value:1},uZoom:{value:1},uMotion:{value:1}};
  const scene=new THREE.Scene();scene.background=new THREE.Color('#000000');
  const camera=new THREE.OrthographicCamera(-1,1,1,-1,.01,10);camera.position.set(PORTAL.centre[0],PORTAL.centre[1],2);
  const photograph=new THREE.Mesh(new THREE.PlaneGeometry(PORTAL.aspect,1),new THREE.ShaderMaterial({uniforms,depthWrite:false,
    vertexShader:vertex,
    fragmentShader:`varying vec2 vUv;uniform sampler2D uImage,uDepth;uniform vec2 uPointer;uniform float uReveal,uCharge,uAssembly,uOverload;
      void main(){vec2 shift=uPointer*${PORTAL.parallax};vec2 uv=vUv;
        float d=texture2D(uDepth,uv).r;uv=vUv+shift*(d-.05);
        d=texture2D(uDepth,uv).r;uv=vUv+shift*(d-.05);
        vec3 base=texture2D(uImage,clamp(uv,.001,.999)).rgb;
        vec2 p=(uv-.5)*${imageScale}-${centre};float r=length(p);
        float ring=exp(-pow((r-${PORTAL.radius})*30.,2.));
        float aura=exp(-dot(p,p)*23.);float floorLight=exp(-pow(p.x*4.,2.)-pow((p.y+.42)*16.,2.));
        // Depth-aware relighting of the supplied raster, not a claim of 3D shadows.
        float light=uCharge*(ring*.65+aura*.15)+uAssembly*(aura*.35+floorLight*.45);
        base*=1.+light*7.;base+=vec3(.025,.22,.65)*light*(.07+d*.23);
        float rim=ring*uCharge*.013;
        vec3 colour=(base+vec3(.08,.5,1.3)*rim)*uReveal;
        // A growing white energy pool centred on the tile we approach. It is
        // part of the existing photo pass, not another fullscreen render target.
        float radius=mix(.025,.24,uOverload);
        float burn=1.-smoothstep(radius*.35,radius,length(p-vec2(-.031,.032)));
        colour=mix(colour,vec3(1.4,1.45,1.5),burn*smoothstep(0.,.9,uOverload));
        gl_FragColor=vec4(colour,1.);}` }));
  photograph.position.z=-.15;scene.add(photograph);
  const markGeometry=samplePortalMark(shapes,PORTAL[`${profile}Particles`]);
  const ring=energyRing(uniforms,mobile),rays=energyRays(uniforms,markGeometry.attributes.position,mobile);scene.add(ring,rays.mesh);
  const mark=new THREE.Points(markGeometry,pointMaterial(uniforms));mark.frustumCulled=false;scene.add(mark);
  const glow=portalMarkGlow(shapes,uniforms);scene.add(glow);
  const core=portalEnergyCore(shapes,uniforms);scene.add(core);
  const streamsGeometry=samplePortalMark(shapes,mobile?PORTAL.mobileStreams:PORTAL.desktopStreams);
  // Eight bright injection points share the stream draw call, not eight sprites.
  for(let i=0;i<PORTAL.rayCount;i++){
    const angle=i/PORTAL.rayCount*Math.PI*2;
    streamsGeometry.attributes.aOrigin.setXYZ(i,Math.cos(angle)*PORTAL.radius+PORTAL.centre[0],Math.sin(angle)*PORTAL.radius+PORTAL.centre[1],.015);
    streamsGeometry.attributes.aSeed.setX(i,-1);
  }
  const streams=new THREE.Points(streamsGeometry,pointMaterial(uniforms,true));streams.frustumCulled=false;scene.add(streams);
  const sparks=cursorSparks(uniforms);scene.add(sparks.mesh);
  const playback=createPortalPlayback();let active=false,lastPhase='',lastUi=-1;
  // How far the pupil preview formed the portal (0..1); the live shot resumes from there.
  let primed=0,entranceFloor=0;
  renderer.domElement.dataset.portalParticles=String(markGeometry.attributes.position.count);
  const apply=(state,entrance,time,mouse,pr)=>{
    const frame=portalFraming(innerWidth/innerHeight);
    camera.left=-frame.width/2;camera.right=frame.width/2;camera.top=frame.height/2;camera.bottom=-frame.height/2;
    camera.zoom=state.zoom;camera.updateProjectionMatrix();
    // The emblem's geometric centre is a gap. Aim into its brightest long
    // tile during the dive, not into the black space between the three tiles.
    camera.position.x=PORTAL.centre[0]-.031*state.dive;camera.position.y=PORTAL.centre[1]+.032*state.dive;
    uniforms.uPointer.value.set(reduced.matches||!hover.matches?0:mouse.x,reduced.matches||!hover.matches?0:mouse.y);
    uniforms.uReveal.value=state.reveal*entrance;uniforms.uCharge.value=state.charge;uniforms.uAssembly.value=state.assembly;
    uniforms.uCore.value=state.core;uniforms.uOverload.value=state.overload;
    uniforms.uTime.value=time;uniforms.uPR.value=pr;uniforms.uZoom.value=state.zoom;uniforms.uMotion.value=reduced.matches?0:1;
    mark.visible=state.assembly>0&&state.core<1;
    glow.visible=state.assembly>.65&&state.core<1;
    ring.visible=rays.mesh.visible=streams.visible=state.charge>0&&state.core<1;
    core.visible=state.core>0;
    rays.update(time,rays.mesh.visible,reduced.matches);
  };
  return {scene,camera,
    setActive(value){
      if(value===active)return;
      active=value;entranceFloor=value?primed:0;
      playback.setActive(value,value?primed*PORTAL.introDuration:0);sparks.reset();lastUi=-1;
    },
    // The world seen through the pupil: the same entrance, driven by the dive
    // instead of the clock. No host messages, sparks or playback side effects.
    preview(amount,time,mouse,pr){
      primed=clamp(amount);
      apply(portalState(0,reduced.matches,primed*PORTAL.introDuration),1,time,mouse,pr);
      sparks.mesh.visible=false;
    },
    update(p,time,mouse,pr){
      const state=playback.update(p,time,reduced.matches);
      // A short reversible darkness shutter joins the pupil to the timed
      // reveal on every device, including the desktop covered-passage finish.
      // After a pupil preview the world is already lit, so it must not blink out.
      const entrance=Math.max(THREE.MathUtils.smoothstep(p,0,.055),entranceFloor);
      apply(state,entrance,time,mouse,pr);
      const target=portalPointer({x:mouse.tx??mouse.x,y:mouse.ty??mouse.y},innerWidth/innerHeight,state.zoom);
      const distance=Math.hypot(target.x-PORTAL.centre[0],target.y-PORTAL.centre[1]);
      const enabled=hover.matches&&!reduced.matches&&mouse.on&&state.assembly>.45&&state.dive<.2&&distance>.08&&distance<PORTAL.hoverRadius;
      const live=sparks.update(time,target,enabled);
      renderer.domElement.dataset.portalSparks=String(live);
      renderer.domElement.dataset.portalStrikes=String(sparks.strikes);
      // UI reads the actual entrance clock, even with scroll completely still.
      // Send only changed opacity/phase, not a perpetual second per-frame stream.
      const uiOpacity=Math.round(state.uiOpacity*entrance*1000)/1000;
      if(lastPhase!==state.phase||lastUi!==uiOpacity){lastPhase=state.phase;lastUi=uiOpacity;document.body.dataset.portalPhase=state.phase;window.NodalHost?.send('portal-state',{phase:state.phase,uiOpacity});}
      return {...state,bloom:.48*state.charge+.16*state.overload};
    },
    dispose(){for(const mesh of [photograph,ring,rays.mesh,mark,glow,core,streams,sparks.mesh]){mesh.geometry.dispose();mesh.material.dispose();}image.dispose();depth.dispose();},
  };
}
