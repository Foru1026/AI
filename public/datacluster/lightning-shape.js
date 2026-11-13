// Seeded, multi-scale midpoint displacement. Broad bends and fine fractures
// share exact endpoints; forks really start on their parent, not beside it.
function randomFor(seed) {
  return () => {
    let t=seed+=0x6D2B79F5;
    t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);
    return ((t^(t>>>14))>>>0)/4294967296;
  };
}

function displacedPath(start, end, segments, roughness, random) {
  const points=new Float32Array((segments+1)*2);
  points.set(start,0);points.set(end,segments*2);
  let amplitude=Math.hypot(end[0]-start[0],end[1]-start[1])*roughness;
  for(let span=segments;span>1;span/=2) {
    for(let from=0;from<segments;from+=span) {
      const to=from+span,mid=from+span/2;
      const dx=points[to*2]-points[from*2],dy=points[to*2+1]-points[from*2+1],d=Math.hypot(dx,dy)||1;
      const bend=(random()*2-1)*amplitude,drift=(random()*2-1)*amplitude*.18;
      points[mid*2]=(points[from*2]+points[to*2])*.5-dy/d*bend+dx/d*drift;
      points[mid*2+1]=(points[from*2+1]+points[to*2+1])*.5+dx/d*bend+dy/d*drift;
    }
    amplitude*=.53;
  }
  return points;
}

export function lightningPaths(start, end, seed, {segments=64, branches=4, roughness=.23}={}) {
  if(segments<4||(segments&(segments-1)))throw new Error('Lightning segments must be a power of two');
  const random=randomFor(seed),length=Math.hypot(end[0]-start[0],end[1]-start[1]);
  const paths=[{points:displacedPath(start,end,segments,roughness,random),weight:1,width:1,parent:-1,root:0}];
  for(let i=0;i<branches;i++) {
    // Occasional secondary fork adds hierarchy rather than parallel ribbons.
    const parent=i===branches-1&&i>1?1:0;
    const path=paths[parent].points,root=Math.floor(segments*(.18+random()*.56));
    const origin=[path[root*2],path[root*2+1]],before=Math.max(0,root-2),after=Math.min(segments,root+2);
    const heading=Math.atan2(path[after*2+1]-path[before*2+1],path[after*2]-path[before*2]);
    const angle=heading+(random()<.5?-1:1)*(.45+random()*1.15);
    const reach=length*(parent===0?.12+random()*.26:.055+random()*.095);
    const target=[origin[0]+Math.cos(angle)*reach,origin[1]+Math.sin(angle)*reach];
    paths.push({points:displacedPath(origin,target,segments,.28,random),
      weight:parent===0?.32+random()*.30:.18,width:parent===0?.42+random()*.23:.32,parent,root});
  }
  return paths;
}

export function energyRingPath(radius, seed, segments=256) {
  const random=randomFor(seed),coarse=Float32Array.from({length:16},()=>random()*2-1);
  const points=new Float32Array((segments+1)*2);
  for(let i=0;i<segments;i++) {
    const angle=i/segments*Math.PI*2,c=i/segments*coarse.length,k=Math.floor(c),t=c-k;
    const deviation=(coarse[k]*(1-t)+coarse[(k+1)%coarse.length]*t)*.0015+(random()-.5)*.0016;
    points[i*2]=Math.cos(angle)*(radius+deviation);points[i*2+1]=Math.sin(angle)*(radius+deviation);
  }
  points.set(points.subarray(0,2),segments*2);
  return points;
}
