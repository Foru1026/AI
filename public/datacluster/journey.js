import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { journeyState } from './journey-timeline.js';
import { createEnergyPortal } from './energy-portal.js';
import { ENERGY_COVER_VERTEX, ENERGY_COVER_FRAGMENT } from './energy-cover.js';

const clamp = x => Math.max(0, Math.min(1, x));
const ease = (a, b, x) => { const t = clamp((x-a)/(b-a)); return t*t*t*(t*(t*6-15)+10); };
const lerp = THREE.MathUtils.lerp;
const blue = new THREE.Color('#59AFFF');
const temp = new THREE.Object3D();
function instances(group, geometry, material, items) {
  const mesh = new THREE.InstancedMesh(geometry, material, items.length);
  items.forEach((item, i) => {
    temp.position.fromArray(item.p); temp.rotation.set(0, item.angle || 0, 0); temp.scale.fromArray(item.s || [1,1,1]);
    temp.updateMatrix(); mesh.setMatrixAt(i, temp.matrix);
    if (item.color) mesh.setColorAt(i, new THREE.Color(item.color));
  });
  mesh.instanceMatrix.needsUpdate = true; group.add(mesh); return mesh;
}
function atmosphere(scene) {
  scene.background = new THREE.Color('#02050b');
  scene.add(new THREE.HemisphereLight('#7596bd', '#080e1b', .7));
  const moon = new THREE.DirectionalLight('#a6c8ee', 2.1); moon.position.set(-18, 28, 12); scene.add(moon);
  const rim = new THREE.DirectionalLight('#2978bf', .6); rim.position.set(25, 8, -25); scene.add(rim);
  scene.fog = new THREE.Fog('#060c18', 75, 160);
}
function shadowTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d'), gradient = ctx.createRadialGradient(32,32,5,32,32,31);
  gradient.addColorStop(0,'rgba(0,0,0,.85)'); gradient.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle = gradient; ctx.fillRect(0,0,64,64);
  return new THREE.CanvasTexture(canvas);
}
function roofGeometry() {
  const vertices = [-.5,0,-.5, .5,0,-.5, 0,.65,-.5, -.5,0,.5, .5,0,.5, 0,.65,.5];
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geo.setIndex([0,2,1,3,4,5,0,3,5,0,5,2,1,2,5,1,5,4,0,1,4,0,4,3]);
  const flat=geo.toNonIndexed();flat.computeVertexNormals();geo.dispose();return flat;
}
function terrainGeometry() {
  const geo = new THREE.PlaneGeometry(240,240,96,96); geo.rotateX(-Math.PI/2);
  const pos = geo.attributes.position;
  for (let i=0;i<pos.count;i++) {
    const x=pos.getX(i), z=pos.getZ(i), r=Math.hypot(x,z+12), a=Math.atan2(z+12,x);
    const ridge=Math.max(0,Math.sin(a*9.0+1.5)*.35+Math.sin(a*17.0)*.16+.65);
    const detail=(Math.sin(x*.7+z*.3)*.65+Math.cos(z*.9-x*.4)*.5)*ease(35,55,r);
    const height=12*Math.exp(-(((r-64)/18)**2))*ridge + detail + Math.sin(x*.18)*Math.cos(z*.22)*.45*ease(30,50,r);
    pos.setY(i,height);
  }
  geo.computeVertexNormals(); return geo;
}
function ribbon(group, points, shared, delay=0) {
  const curve = new THREE.CatmullRomCurve3(points);
  const geometry = new THREE.TubeGeometry(curve, Math.min(180,points.length*4), .024, 4, false);
  const uniforms = { uTime: shared.time, uProgress: shared.progress, uDelay:{value:delay}, uGlow:{value:1} };
  const material = new THREE.ShaderMaterial({ uniforms, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
    vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec2 vUv; uniform float uTime,uProgress,uDelay,uGlow;
      void main(){ float head=clamp((uProgress-uDelay)/(1.-uDelay),0.,1.);
        float visible=1.-smoothstep(head-.02,head+.015,vUv.x);
        float pulse=.75+.25*sin(vUv.x*70.-uTime*6.);
        vec3 tint=mix(vec3(.025,.28,1.),vec3(.20,.68,1.),step(.5,uGlow));
        gl_FragColor=vec4(tint*(1.8+pulse*1.4)*uGlow,visible*.9); }` });
  group.add(new THREE.Mesh(geometry,material));
  const auraGeometry = new THREE.TubeGeometry(curve, Math.min(140,points.length*3), .12, 4, false);
  const aura=material.clone(); aura.uniforms={...uniforms,uGlow:{value:.11}}; group.add(new THREE.Mesh(auraGeometry,aura));
}

function createStreet() {
  const scene = new THREE.Scene(); atmosphere(scene);
  const camera = new THREE.PerspectiveCamera(34,1,.025,260);
  const ground = new THREE.Mesh(terrainGeometry(),new THREE.MeshStandardMaterial({color:'#162035',roughness:.94})); scene.add(ground);
  const roadMat=new THREE.MeshStandardMaterial({color:'#171e2d',roughness:.7,metalness:.12});
  const road=new THREE.Mesh(new THREE.RingGeometry(10,14,96),roadMat); road.rotation.x=-Math.PI/2; road.position.set(0,.03,-12); scene.add(road);
  const entry=new THREE.Mesh(new THREE.PlaneGeometry(4,43),roadMat); entry.rotation.x=-Math.PI/2; entry.position.set(0,.031,22.5); scene.add(entry);
  const curbMat=new THREE.MeshStandardMaterial({color:'#475266',roughness:.76});
  const box=new THREE.BoxGeometry(1,1,1), walls=[], roofs=[], trims=[], chimneys=[], fences=[], lamps=[];
  const homes=[], windows=[];
  const wallMat=new THREE.MeshStandardMaterial({color:'#2c384a',roughness:.82});
  const roofMat=new THREE.MeshStandardMaterial({color:'#44536b',roughness:.64,metalness:.18});
  const trimMat=new THREE.MeshStandardMaterial({color:'#63718b',roughness:.55});
  const darkMat=new THREE.MeshStandardMaterial({color:'#0b1525',roughness:.8});
  const shadowMat=new THREE.MeshBasicMaterial({map:shadowTexture(),transparent:true,depthWrite:false});
  const shared={time:{value:0},progress:{value:0}};
  const energy=new THREE.Group(); scene.add(energy);
  const energyLights=Array.from({length:3},()=>{const light=new THREE.PointLight('#168eff',0,18,1.4);scene.add(light);return light;});
  const transform=(home,p)=>new THREE.Vector3(...p).applyAxisAngle(new THREE.Vector3(0,1,0),home.angle).add(home.position);
  for(let i=0;i<11;i++) {
    const theta=.55+i*(Math.PI*2-1.1)/10, x=Math.sin(theta)*22,z=-12+Math.cos(theta)*22;
    const angle=Math.atan2(-x,-12-z), h=2.7+(i%3)*.12, w=5.2+(i%2)*.45, d=4.1;
    const home={position:new THREE.Vector3(x,0,z),angle,theta,h,w,d}; homes.push(home);
    walls.push({p:[x,h/2,z],s:[w,h,d],angle,color:i%3===0?'#27364a':'#334055'});
    roofs.push({p:[x,h,z],s:[w+.6,2.15,d+.65],angle});
    chimneys.push({p:transform(home,[-1.5,h+1.6,-.6]).toArray(),s:[.45,1.4,.45],angle});
    const lawn=new THREE.Mesh(new THREE.PlaneGeometry(w+3,d+6),shadowMat); lawn.rotation.x=-Math.PI/2; lawn.rotation.z=-angle; lawn.position.set(x,.04,z); scene.add(lawn);
    const addBox=(p,s,collection=trims)=>collection.push({p:transform(home,p).toArray(),s,angle});
    addBox([0,.48,d/2+.04],[.8,1.55,.1]);
    addBox([0,2.35,d/2+.65],[2.5,.12,1.5]);
    addBox([-1.05,1.05,d/2+1.2],[.12,2.1,.12]);addBox([1.05,1.05,d/2+1.2],[.12,2.1,.12]);
    addBox([0,.12,d/2+1],[2.8,.24,2.1]);
    // Siding, sill/eave trims and shutters share the existing instance batches.
    for(let sy=.3;sy<h;sy+=.28) addBox([0,sy,d/2+.015],[w,.012,.018]);
    addBox([0,h-.06,d/2+.10],[w+.15,.09,.2]);
    addBox([0,1.1,d/2+.065],[.64,1.9,.05],chimneys);
    for(const wx of [-w*.3,w*.3]) {
      const material=new THREE.MeshBasicMaterial({color:new THREE.Color('#3d91c9').multiplyScalar(.25),toneMapped:false});
      const window=new THREE.Mesh(new THREE.PlaneGeometry(.9,.93),material); window.position.copy(transform(home,[wx,1.6,d/2+.058]));window.rotation.y=angle;scene.add(window);
      windows.push({mesh:window,home:i});
      addBox([wx,1.6,d/2+.07],[.06,1.0,.065]);addBox([wx,1.6,d/2+.07],[.94,.055,.065]);
      for(const yy of [1.09,2.1]) addBox([wx,yy,d/2+.03],[1.05,.065,.12]);
      for(const side of [-1,1]) addBox([wx+side*.59,1.6,d/2+.015],[.18,1.04,.075],chimneys);
    }
    for(const side of [-1,1]) for(let j=0;j<15;j++) addBox([side*(w/2+1.2),.5,-d/2-1+j*.48],[.07,1.0,.08],fences);
    for(const side of [-1,1]) for(const y of [.3,.7]) addBox([side*(w/2+1.2),y,.8],[.06,.06,d+3],fences);
    const branch=[]; const begin=new THREE.Vector3(Math.sin(theta)*12,.15,-12+Math.cos(theta)*12);
    const end=windows[windows.length-2].mesh.position;
    for(let j=0;j<=25;j++){const t=j/25;const p=begin.clone().lerp(end,t);p.x+=Math.sin(j*2.1+i)*.09*Math.sin(Math.PI*t);p.y+=Math.sin(j*1.7)*.1*Math.sin(Math.PI*t);branch.push(p);}
    ribbon(energy,branch,shared,.28+i*.035);
    lamps.push({p:[Math.sin(theta)*14.7,1.9,-12+Math.cos(theta)*14.7],s:[.06,3.8,.06]});
  }
  instances(scene,box,wallMat,walls); instances(scene,roofGeometry(),roofMat,roofs);
  instances(scene,box,trimMat,trims); instances(scene,box,darkMat,chimneys.concat(fences,lamps));
  const circle=[];
  for(let i=0;i<=100;i++){const a=i/100*Math.PI*2;circle.push(new THREE.Vector3(Math.sin(a)*12+Math.sin(i*2.3)*.075,.16,-12+Math.cos(a)*12));}
  ribbon(energy,[new THREE.Vector3(0,.15,45),new THREE.Vector3(.08,.15,24),new THREE.Vector3(-.1,.16,8),...circle],shared);
  const destination=windows[8].mesh.position.clone();
  const normal=new THREE.Vector3(0,0,1).applyAxisAngle(new THREE.Vector3(0,1,0),homes[4].angle);
  const start=new THREE.Vector3(0,18,42), overview=new THREE.Vector3(0,13,31), end=destination.clone().addScaledVector(normal,1.05);
  const look=new THREE.Vector3();
  return {scene,camera,update(p,time,mouse){
    shared.time.value=time; shared.progress.value=ease(.035,.7,p);
    windows.forEach(({mesh,home})=>{const lit=ease(.25+home*.025,.37+home*.025,p);mesh.material.color.set('#59AFFF').multiplyScalar(lerp(.2,5.5,lit));});
    const head=shared.progress.value*Math.PI*2;
    energyLights[0].position.set(Math.sin(head)*12,1,-12+Math.cos(head)*12);energyLights[0].intensity=18*ease(.08,.25,p);
    for(let i=1;i<3;i++){energyLights[i].position.copy(windows[i*8].mesh.position);energyLights[i].position.y+=.8;energyLights[i].intensity=9*ease(.3,.65,p);}
    const drift=ease(0,.55,p), dive=ease(.58,.96,p);
    camera.position.copy(start).lerp(overview,drift).lerp(end,dive);
    camera.position.x+=mouse.x*.35*(1-dive); camera.position.y+=mouse.y*.2*(1-dive);
    look.set(0,.5,-12).lerp(destination,dive); camera.lookAt(look);
  }};
}

function screenPhoto(texture) {
  const material=new THREE.ShaderMaterial({uniforms:{uImage:{value:texture},uAspect:{value:1},uZoom:{value:1}},depthTest:false,depthWrite:false,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,1.,1.);}',
    fragmentShader:`varying vec2 vUv;uniform sampler2D uImage;uniform float uAspect,uZoom;
      void main(){vec2 span=uAspect>1.6?vec2(1.,1.6/uAspect):vec2(uAspect/1.6,1.);
        vec2 q=.5+(vUv-.5)*span/uZoom;q.y*=.5;gl_FragColor=vec4(texture2D(uImage,q).rgb,1.);}`});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);mesh.frustumCulled=false;mesh.renderOrder=-100;return mesh;
}
function createPortal(texture) {
  const scene=new THREE.Scene();scene.background=new THREE.Color('#020710');
  const camera=new THREE.PerspectiveCamera(34,1,.025,100);
  const backdrop=screenPhoto(texture);scene.add(backdrop);
  const group=new THREE.Group();group.position.set(0,2.1,0);scene.add(group);
  const material=new THREE.MeshPhysicalMaterial({color:'#8ae2ff',roughness:.14,metalness:.12,clearcoat:1,emissive:'#249cff',emissiveIntensity:1.5});
  const logo=new THREE.Group();logo.rotation.z=-Math.PI/4;logo.scale.setScalar(2.15);group.add(logo);
  for(const [x,y,w,h] of [[-.43,.08,.72,1.7],[.43,.52,.72,.72],[.43,-.38,.72,.72]]) {
    const mesh=new THREE.Mesh(new RoundedBoxGeometry(w,h,.22,2,.09),material);mesh.position.set(x,y,.05);logo.add(mesh);
  }
  const shared={time:{value:0},progress:{value:1}};
  for(let i=0;i<8;i++) {
    const angle=i/8*Math.PI*2,points=[];
    for(let j=0;j<32;j++){const t=j/31,r=5.8*(1-t),a=angle+Math.sin(j*.6+i)*.035;
      points.push(new THREE.Vector3(Math.cos(a)*r,Math.sin(a)*r,Math.sin(j*.7)*.06));}
    ribbon(group,points,shared);
  }
  const ring=new THREE.Mesh(new THREE.TorusGeometry(5.8,.02,5,120),new THREE.MeshBasicMaterial({color:blue,transparent:true,opacity:.25})); group.add(ring);
  const light=new THREE.PointLight('#a7eeff',18,15,1.7);light.position.set(-2,4,4);scene.add(light);
  return {scene,camera,update(p,time,mouse){
    const dive=ease(.38,.96,p); camera.position.set(mouse.x*.22*(1-dive),2.1+mouse.y*.14*(1-dive),lerp(24,.65,dive));camera.lookAt(0,2.1,0);
    shared.time.value=time;backdrop.material.uniforms.uAspect.value=camera.aspect;backdrop.material.uniforms.uZoom.value=lerp(1,18,dive);
    material.emissiveIntensity=1.5+Math.sin(time*1.5)*.08+dive*3;
    logo.rotation.y=Math.sin(time*.45)*.035*(1-dive);
  }};
}
function energyCover() {
  const material=new THREE.ShaderMaterial({uniforms:{uFill:{value:0},uOpen:{value:0},uTime:{value:0},uAspect:{value:1}},transparent:true,depthTest:false,depthWrite:false,
    vertexShader:ENERGY_COVER_VERTEX, fragmentShader:ENERGY_COVER_FRAGMENT});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);mesh.frustumCulled=false;mesh.renderOrder=20000;return mesh;
}

export async function createJourney(renderer) {
  // Eye → darkness → depth-map energy portal → HTML contact footer.
  // Legacy sequence files remain a backup, but are neither imported nor fetched.
  const portal=await createEnergyPortal(renderer);
  // The parent React layer owns all footer content. Only the existing aperture
  // is rendered here: no particle geometry, extra context, UI or asset loading.
  const footer={scene:new THREE.Scene(),camera:new THREE.PerspectiveCamera(34,1,.025,100),update(){return {};}};
  footer.scene.background=new THREE.Color('#000000');
  const cover=energyCover(),scenes=[portal,footer];
  // The pupil is a live window onto the portal: rendered at reduced size, only
  // while the eye dive needs it. Half float keeps the energy ring above 1 for bloom.
  const previewTarget=new THREE.WebGLRenderTarget(2,2,{type:THREE.HalfFloatType});
  const preview=previewTarget.texture;
  const previewScale=()=>Math.min(.6,1280/Math.max(1,innerWidth));
  const capturePreview=()=>{
    const s=previewScale(),w=Math.max(2,Math.round(innerWidth*s)),h=Math.max(2,Math.round(innerHeight*s));
    if(previewTarget.width!==w||previewTarget.height!==h)previewTarget.setSize(w,h);
  };
  capturePreview();
  const renderPreview=(amount,time,mouse,pr)=>{
    capturePreview();
    portal.preview(amount,time,mouse,Math.max(1,pr*previewScale()));
    const coverShown=cover.visible;cover.visible=false;
    const previous=renderer.getRenderTarget();
    renderer.setRenderTarget(previewTarget);renderer.render(portal.scene,portal.camera);renderer.setRenderTarget(previous);
    cover.visible=coverShown;
  };
  return {preview,get previewAspect(){return innerWidth/innerHeight;},capturePreview,renderPreview,scenes,setActive:value=>portal.setActive(value),
    update(p,time,mouse,pr){
    const {index,local,fill,open,blur}=journeyState(p);
    const shot=scenes[index];
    if(shot.camera.aspect!==innerWidth/innerHeight){shot.camera.aspect=innerWidth/innerHeight;shot.camera.updateProjectionMatrix();}
    portal.setActive(shot===portal);
    const presentation=shot.update(local,time,mouse,pr);
    cover.material.uniforms.uFill.value=fill;cover.material.uniforms.uOpen.value=open;cover.material.uniforms.uTime.value=time;cover.material.uniforms.uAspect.value=innerWidth/innerHeight;
    cover.visible=fill>.001;if(cover.parent!==shot.scene)shot.scene.add(cover);
    return {scene:shot.scene,camera:shot.camera,blur,bloom:shot===portal ? presentation.bloom : 0};
  },dispose(){portal.dispose();previewTarget.dispose();cover.geometry.dispose();cover.material.dispose();}};
}
