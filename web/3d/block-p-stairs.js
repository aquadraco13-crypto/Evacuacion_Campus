import * as THREE from './three.module.js';

// Local coordinates of the stair at the left end of the open gallery.
export const stairP={x:-13.52,z:-2.52,inner:.75,outer:2.72,opening:2.82,
  rise:3.55,floor:.135,steps:22,landingHalf:.60};
const entry=-Math.PI/2;
const start=entry+stairP.landingHalf,end=entry+2*Math.PI-stairP.landingHalf;
const pitch=(end-start)/stairP.steps;
const point=(r,a,y)=>[r*Math.cos(a),y,r*Math.sin(a)];

export function wellSlab(thickness){
  // This slab spans the left wing and the left end of the rear bar. One opening
  // across that joint avoids a hidden strip of floor cutting through the stair.
  const outline=new THREE.Shape([[-17,-11],[-10,-11],[-10,13],[-17,13]].map(p=>new THREE.Vector2(...p)));
  const hole=new THREE.Path();
  hole.absarc(stairP.x,-stairP.z,stairP.opening,0,Math.PI*2,true);
  outline.holes.push(hole);
  const g=new THREE.ExtrudeGeometry(outline,{depth:thickness,bevelEnabled:false,curveSegments:64});
  g.rotateX(-Math.PI/2);
  const {position,uv}=g.attributes;
  for(let i=0;i<uv.count;i++)uv.setXY(i,position.getX(i)/2.56,-position.getZ(i)/2.56);
  return g;
}

// Each sector has a level walking surface, a real riser and a sloping soffit.
function sector(inner,outer,a0,a1,top,bottom0,bottom1,segments){
  const positions=[],indices=[];
  function quad(a,b,c,d){
    const n=positions.length/3;
    positions.push(...a,...b,...c,...d);indices.push(n,n+1,n+2,n,n+2,n+3);
  }
  for(let i=0;i<segments;i++){
    const a=a0+(a1-a0)*i/segments,b=a0+(a1-a0)*(i+1)/segments;
    const lo=bottom0+(bottom1-bottom0)*i/segments,hi=bottom0+(bottom1-bottom0)*(i+1)/segments;
    const it=point(inner,a,top),ot=point(outer,a,top),jt=point(inner,b,top),pt=point(outer,b,top);
    const ib=point(inner,a,lo),ob=point(outer,a,lo),jb=point(inner,b,hi),pb=point(outer,b,hi);
    quad(it,jt,pt,ot);quad(ib,ob,pb,jb);
    quad(ot,pt,pb,ob);quad(it,ib,jb,jt);
    if(i===0)quad(it,ot,ob,ib);
    if(i===segments-1)quad(jt,jb,pb,pt);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setIndex(indices);g.computeVertexNormals();return g;
}

function curvedRail(r,a,b,from,to,radius){
  const curve=new THREE.Curve();
  curve.getPoint=(t,v=new THREE.Vector3())=>v.fromArray(point(r,a+(b-a)*t,from+(to-from)*t));
  return new THREE.TubeGeometry(curve,Math.max(14,Math.ceil((b-a)*20)),radius,8,false);
}

export function furnishStair(kit,child,levels){
  const s=stairP,dy=s.rise/s.steps,unit=[1,1,1];
  const material=(name,color,settings={})=>new THREE.MeshStandardMaterial({
    name:'Escalera P · '+name,color,roughness:.67,...settings
  });
  const ivory=material('peldaños blancos',0xf3f0e7);
  const enamel=material('acero lacado blanco',0xe6e8e4,{roughness:.37,metalness:.22});
  const grip=material('banda mineral',0xb8bab3);
  const metal=material('pasamanos satinado',0xd2d7d3,{metalness:.55,roughness:.33});
  const tread=sector(s.inner,s.outer,0,pitch,dy,-.19,dy-.19,5);
  const nosing=sector(s.inner+.07,s.outer-.07,.012,.027,dy+.002,dy-.001,dy-.001,2);
  const landing=sector(s.inner,s.opening+.004,entry-s.landingHalf,start,0,-.19,-.19,36);
  const post=new THREE.CylinderGeometry(1,1,1,10);

  for(let i=0;i<levels.length;i++){
    const stop=child('Bloque P · Descanso '+(i+1),levels[i]);
    stop.position.set(s.x,s.floor,s.z);
    if(i>0)kit.mesh(stop,'Rellano a nivel del pasillo',landing,ivory);
    function guard(parent,r,a,b,h,n,outerDeck=false){
      for(const [offset,rad,finish] of [[1.00,.043,metal],[.51,.018,enamel],[.74,.016,enamel]]){
        kit.mesh(parent,'Baranda curva',curvedRail(r,a,b,offset,h+offset,rad),finish);
      }
      for(let j=0;j<=n;j++){
        const t=j/n,ang=a+(b-a)*t,base=h*t;
        const bottom=h>0?Math.min(s.steps,Math.floor(t*s.steps+1e-7)+1)*dy:0;
        const height=base+1-bottom;
        kit.part(parent,post,enamel,[outerDeck?.024:.021,height,outerDeck?.024:.021],point(r,ang,bottom+height/2));
      }
    }
    guard(stop,s.inner+.043,entry-s.landingHalf,start,0,4);
    if(i>0)guard(stop,s.opening+.047,start,end,0,24,true);
    if(i===levels.length-1)continue;

    const flight=child('Bloque P · Escalera '+(i+1)+' a '+(i+2),levels[i]);
    flight.position.copy(stop.position);
    for(let j=0;j<s.steps;j++){
      const rotation=[0,-(start+j*pitch),0],at=[0,j*dy,0];
      kit.part(flight,tread,ivory,unit,at,rotation);
      kit.part(flight,nosing,grip,unit,at,rotation,false);
    }
    guard(flight,s.inner+.043,start,end,s.rise,s.steps);
    guard(flight,s.outer-.043,start,end,s.rise,2*s.steps);
  }
}
