import * as THREE from './three.module.js';
import {buildMainGate,archProfile} from './main-gate.js';

export const pavilionDoor={x:32.36,width:4.42,height:2.84};
const V=(x,y,z)=>new THREE.Vector3(x,y,z);

// u runs across the vault. t walks from the brick pavilion to the rotunda.
// The first flashing wraps the brick corner; the last follows the elliptical eave.
export function buildCoveredLink(kit,mat,pavilion,round,road,person,tree,palm){
  const {group,part,mesh,beam,cube}=kit;
  const hall=group('Cubierta clara de acceso');
  function first(u){
    const corner=.30;
    let x=38.45,z=30.68;
    if(u<=0)x=pavilionDoor.x+(pavilionDoor.x-15.90)*u;
    else if(u<=corner)x=pavilionDoor.x+(x-pavilionDoor.x)*u/corner;
    else z+=(41.50-z)*(u-corner)/(1-corner);
    return pavilion.localToWorld(V(x,0,z));
  }
  function last(u){
    const x=u*8.70;
    return round.localToWorld(V(x,0,Math.sqrt(19.32**2-x*x)));
  }
  const direction=last(0).sub(first(0)).normalize(),across=V(-direction.z,0,direction.x);
  const left=first(-1),right=first(1);
  function plan(u,t){
    // Only the abutment follows the masonry corner. Regularise the transverse
    // sections into smooth arches as the roof leaves the facade.
    const straight=left.clone().lerp(right,(u+1)/2);
    return straight.lerp(first(u),1-smooth((t-.24)/.52)).lerp(last(u),t)
      .addScaledVector(across,(4.30*u-2.00)*Math.sin(Math.PI*t));
  }
  const smooth=t=>{const s=THREE.MathUtils.clamp(t,0,1);return s*s*(3-2*s);};
  const streetLeft=first(1),streetRight=last(1);
  const streetAxis=streetRight.clone().sub(streetLeft);
  const spanSq=streetAxis.lengthSq();
  function top(u,t,offset=0){
    // The street eave is straight. The inner edge still follows both buildings.
    const street=streetLeft.clone().lerp(streetRight,t);
    const corrected=plan(u,t).addScaledVector(street.sub(plan(1,t)),smooth((u-.10)/.90));
    const inner=1-smooth((u-.52)/.48);
    const endFlashing=1-smooth(t/.07)*smooth((1-t)/.07);
    const eave=5.75+inner*THREE.MathUtils.lerp(.48,THREE.MathUtils.lerp(7.08,6.46,t)-5.75,endFlashing);
    const acrossGate=THREE.MathUtils.clamp(corrected.clone().sub(streetLeft).dot(streetAxis)/spanSq,0,1);
    const bayShape=THREE.MathUtils.lerp(archProfile(acrossGate),archProfile(t),endFlashing);
    corrected.y=eave+(2.17+.13*inner)*bayShape+offset;
    return corrected;
  }
  const painted=(name,color,metalness=.15)=>new THREE.MeshStandardMaterial({name,color,metalness,roughness:.58});
  const sheet=painted('Bóveda · chapa marfil',0xd9d8cb,.24);
  const soffit=painted('Bóveda · intradós',0x706e63);
  const aluminum=painted('Bóveda · juntas de aluminio',0xc5c6b9,.29);
  const steel=painted('Bóveda · acero verde grisáceo',0x536d60,.32);
  const stripe=painted('Paso · bandas peatonales',0xe6ddc7,0);
  const tCount=96,uCount=40,positions=[],indices=[];
  // Closed shell with a separate, shadow-casting underside.
  for(const dy of [0,-.19])for(let j=0;j<=tCount;j++)for(let i=0;i<=uCount;i++)
    positions.push(...top(i*2/uCount-1,j/tCount,dy).toArray());
  const offset=(uCount+1)*(tCount+1),shell=new THREE.BufferGeometry();
  function quad(a,b,c,d){indices.push(a,b,d,b,c,d);}
  for(let side=0;side<2;side++){
    const start=indices.length;
    for(let j=0;j<tCount;j++)for(let i=0;i<uCount;i++){
      const a=side*offset+j*(uCount+1)+i,b=a+1,c=a+uCount+2,d=a+uCount+1;
      if(side===0)quad(a,b,c,d);else quad(d,c,b,a);
    }
    shell.addGroup(start,indices.length-start,side);
  }
  const rim=indices.length;
  const edge=(a,b)=>quad(b,a,a+offset,b+offset);
  for(let i=0;i<uCount;i++){edge(i,i+1);edge(offset-1-i,offset-2-i);}
  for(let j=0;j<tCount;j++){
    const a=j*(uCount+1),b=a+uCount+1;edge(b,a);edge(a+uCount,b+uCount);
  }
  shell.addGroup(rim,indices.length-rim,2);
  shell.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));shell.setIndex(indices);shell.computeVertexNormals();
  mesh(hall,'Cubierta abovedada de acceso',shell,[sheet,soffit,aluminum]);

  function rail(name,point,count,radius,material){
    const curve=new THREE.CatmullRomCurve3(Array.from({length:count+1},(_,i)=>point(i/count)));
    mesh(hall,name,new THREE.TubeGeometry(curve,count*2,radius,8,false),material);
  }
  for(let i=0;i<=30;i++)
    rail('Nervio de la chapa',s=>top(2*s-1,i/30,.016),22,.025,aluminum);
  // Purlins under the sheets run into the campus. Curved ribs cross all three bays.
  const purlin=painted('Pórtico · correas galvanizadas',0x8c8d80,.35);
  for(let i=0;i<=21;i++)
    rail('Correa longitudinal',s=>top(2*s-1,i/21,-.23),20,i%7===0?.13:.065,purlin);
  for(const u of [-1,-.65,-.30,.05,.40,.73,.98])
    rail('Cercha curva de las tres naves',t=>top(u,t,-.28),96,.095,steel);
  const roadSamples=road.getPoints(260);
  const nearRoad=(p,d)=>roadSamples.some(v=>(v.x-p.x)**2+(v.z-p.z)**2<d*d);
  const column=new THREE.CylinderGeometry(.16,.20,1,14);
  for(const t of [0,1/3,2/3,1]){
    const cap=top(-.90,t,-.34);
    if(nearRoad(cap,3.22))continue;
    const foot=cap.clone();foot.y=.23;
    beam(hall,column,foot.toArray(),cap.toArray(),1,1,steel);
    part(hall,cube,mat.structure,[.62,.22,.62],[foot.x,.135,foot.z]);
    const fork=cap.clone();fork.y-=.98;
    beam(hall,cube,fork.toArray(),top(-.74,t,-.30).toArray(),.14,.14,steel);
  }

  // A flush raised crossing preserves the internal lane. At the rotunda a
  // shallow ramp meets the existing threshold, including the last door reveal.
  function footPoint(side,t){
    const lip=pavilion.localToWorld(V(pavilionDoor.x+side*2.17,0,30.68)).sub(first(0));
    const offset=lip.lerp(across.clone().multiplyScalar(side*3.08),smooth(t/.14));
    const door=round.localToWorld(V(side*2.95,0,19.35)).sub(last(0));
    const p=plan(0,t).add(offset.lerp(door,smooth((t-.82)/.18)));
    p.y=.064+.155*smooth((t-.81)/.16);
    return p;
  }
  function floorStrip(name,t0,t1,material,dy=0){
    const vertices=[],faces=[],n=Math.max(1,Math.ceil((t1-t0)*60));
    for(let i=0;i<=n;i++)for(const side of [-1,1]){
      const p=footPoint(side,t0+(t1-t0)*i/n);vertices.push(p.x,p.y+dy,p.z);
    }
    for(let i=0;i<n;i++){const a=i*2;faces.push(a,a+1,a+2,a+1,a+3,a+2);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(faces);
    g.computeVertexNormals();const slab=mesh(hall,name,g,material);slab.castShadow=false;
  }
  floorStrip('Camino entre las dos puertas',0,1,mat.pavement);
  for(let i=2;i<43;i++){
    const t=i/44;
    if(nearRoad(plan(0,t),2.72))floorStrip('Franja del cruce',t,t+.010,stripe,.004);
  }
  for(const [i,t,side,yaw] of [[0,.25,.55,.65],[1,.31,.72,-2.4],[2,.76,-.55,2.1]]){
    const figure=group('Estudiante bajo la bóveda '+(i+1));
    hall.add(figure);figure.position.copy(footPoint(side,t));figure.rotation.y=yaw;
    person(0,0,i,i%2?1:-1,figure);
  }
  buildMainGate(kit,mat,hall,streetLeft,streetRight,tree,palm);
  return hall;
}
