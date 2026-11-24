import * as THREE from './three.module.js';

export const westCourtCenter=[182,228];
// The open end (+Z) points toward Carrera 30 in the annotated view.
export const westCourtBearing=-Math.PI/2+.08;
export const westCourtRightBlock={x:22,z:2.85,w:17.1,d:27.4,floors:4,floor:3.70,bays:4,podium:true};

// Clone after the kit has populated the group with its instanced AC parts.
export function addRightACPlatform(court){
  const right=court.getObjectByName('Andén de los aires').clone(true);
  right.name='Andén derecho de los aires';
  right.position.set(13.34,0,0);
  right.scale.x=-1;
  court.add(right);
}

function rng(seed) {
  return () => ((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
}

export function buildWestCourt({group,box,part,beam,mesh,cube},mat,leafSpray) {
  const court=group('Patio occidental · claro arbolado');
  court.userData={reference:'Reconstrucción del patio abierto de la foto. Medidas y alzados aproximados.'};
  // Seat the furniture and planters on the continuous paving from site.js.
  court.position.y=-.033;
  function section(name){
    const child=group(name);
    court.add(child);
    return child;
  }
  const ground=section('Patio occidental · jardineras');
  const trees=section('Patio occidental · árboles maduros');
  const seats=section('Patio occidental · mesas y bancos de concreto');
  const chairs=section('Patio occidental · sillas de hierro');
  const platform=section('Andén de los aires');
  // The wall edge is local X=0. Positive X points toward the seats.
  platform.position.set(-14.70,0,5.10);
  const equipment=group('Patio occidental · equipos de aire acondicionado');
  platform.add(equipment);
  const coat=(name,color,options={})=>new THREE.MeshStandardMaterial({
    name:'Patio occidental · '+name,color,roughness:.89,...options
  });
  const stone=coat('concreto envejecido',0x949183);
  const soil=coat('tierra',0x7a6b53);
  const soilShade=coat('tierra sombreada',0x635b47);
  const moss=coat('musgo',0x5e6649);
  const darkMetal=coat('acero gris',0x555a56,{metalness:.36});
  const acSteel=coat('carcasa gris clara',0xb5bcb7,{metalness:.25});
  const coil=coat('intercambiadores de aire',0x5f7378,{metalness:.22});
  const trunk=[0x68533e,0x8b7454,0x786044].map((color,i)=>coat('corteza '+(i+1),color));
  const concrete=coat('hormigón de mesas',0xc6c5b5,{map:mat.serviceConcrete.map});
  const seatStone=coat('bancos de piedra',0xe4e2d2,{map:mat.serviceConcrete.map});
  const random=rng(328);
  const tapered=new THREE.CylinderGeometry(.74,1,1,9);
  const leaf=new THREE.IcosahedronGeometry(1,1);
  const cylinder=new THREE.CylinderGeometry(1,1,1,18);

  function rim(cx,cz,w,d,r,name,height=.34){
    const shape=new THREE.Shape();
    shape.moveTo(-w/2+r,-d/2);
    shape.lineTo(w/2-r,-d/2);
    shape.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);
    shape.lineTo(w/2,d/2-r);
    shape.quadraticCurveTo(w/2,d/2,w/2-r,d/2);
    shape.lineTo(-w/2+r,d/2);
    shape.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);
    shape.lineTo(-w/2,-d/2+r);
    shape.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);
    const base=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:true,bevelSize:.045,
      bevelThickness:.033,bevelSegments:1,curveSegments:8});
    base.rotateX(-Math.PI/2);
    mesh(ground,name,base,stone,[cx,.071,cz]);
    const fill=new THREE.ShapeGeometry(shape);
    fill.rotateX(-Math.PI/2);
    fill.scale((w-.24)/w,1,(d-.24)/d);
    const soilY=height+.11;
    mesh(ground,'Tierra de la jardinera',fill,soil,[cx,soilY,cz]).castShadow=false;
    for(let i=0;i<32;i++){
      const x=(random()-.5)*(w-.45),z=(random()-.5)*(d-.55);
      part(ground,leaf,i%4?soilShade:moss,[.19+.27*random(),.016,.17+.26*random()],
        [cx+x,soilY-.001,cz+z],[0,random()*6.28,0],false);
    }
  }
  rim(-2.65,5.15,1.55,1.70,.21,'Alcorque junto a las mesas del fondo',.035);
  rim(-2.84,12.76,1.95,1.80,.25,'Alcorque junto a las mesas del centro',.035);
  rim(-7.7,13.15,4.68,4.30,.86,'Jardinera del árbol principal');

  function matureTree(x,z,base,height,crown,hero=false){
    const lean=hero?-.26:.16;
    const origin=[x,base,z];
    const mid=[x+lean*.35,base+height*.24,z-.12];
    const head=[x+lean,base+height*(hero?.43:.49),z+.21];
    const trunkRadius=hero?.63:.36;
    beam(trees,tapered,origin,mid,trunkRadius,trunkRadius*1.10,trunk[0]);
    beam(trees,tapered,mid,head,trunkRadius*.78,trunkRadius*.82,trunk[2]);
    for(let i=0;i<(hero?10:5);i++){
      const a=i*2.39996,length=(.55+.69*random())*(hero?1.42:.86);
      const root=[x+Math.cos(a)*length,base+.027,z+Math.sin(a)*length];
      const top=[x+Math.cos(a)*trunkRadius*.35,base+.62+random()*.49,z+Math.sin(a)*trunkRadius*.35];
      beam(trees,tapered,root,top,.105+random()*.08,.11+random()*.09,trunk[i%3]);
    }
    const count=hero?13:10;
    for(let i=0;i<count;i++){
      const a=i*2.39996,b=a+.31;
      const radius=crown*(.3+random()*.44);
      const depth=hero && Math.sin(b)<0?.60:1;
      const fork=[head[0]+Math.cos(a)*radius*.42,base+height*(.62+random()*.15),head[2]+Math.sin(a)*radius*.43*depth];
      const end=[head[0]+Math.cos(b)*radius,base+height*(.73+random()*.21),head[2]+Math.sin(b)*radius*depth];
      const branchStart=[head[0]*.78+mid[0]*.22,head[1]-(i%4)*.35,head[2]];
      beam(trees,tapered,branchStart,fork,trunkRadius*(.33+random()*.21),trunkRadius*.38,trunk[i%3]);
      beam(trees,tapered,fork,end,trunkRadius*.16,trunkRadius*.18,trunk[(i+1)%3]);
      const r=crown*(.23+random()*.15);
      leafSpray(trees,end,r*1.13,depth,a);
      for(let j=0;j<15;j++){
        const t=j*2.39996+a,spread=r*(.35+.48*random());
        const point=[end[0]+Math.cos(t)*spread,end[1]+(random()-.37)*r*.73,end[2]+Math.sin(t)*spread*depth];
        leafSpray(trees,point,r*(.44+random()*.32),depth,t);
      }
      if(hero && i%3===0){
        const hanging=[fork[0]+(random()-.5)*.28,base+height*.1,fork[2]+(random()-.5)*.44];
        beam(trees,tapered,fork,hanging,.017+random()*.021,.019,trunk[1],false);
      }
    }
  }
  matureTree(-7.7,13.15,.45,15.15,6.65,true);
  matureTree(-2.84,12.76,.145,8.2,5.32);
  matureTree(-9.2,17.65,.053,10.7,6.45);
  matureTree(-2.65,5.15,.145,6.1,3.65);

  // Thick cast slabs with two flared pedestals match the furniture in the courtyard.
  const floorY=.052;
  const pedestal=new THREE.CylinderGeometry(.71,1,1,4,1,false,Math.PI/4);
  function stoneSlab(x,z,yaw,isTable=false){
    const w=isTable?1.76:1.60,d=isTable?.80:.43,top=isTable?.77:.46;
    const slab=isTable?.106:.088, rotate={rotate:[0,yaw,0]};
    box(seats,[w,slab,d],[x,floorY+top-slab/2,z],seatStone,rotate);
    box(seats,[w-.08,.038,d-.055],[x,floorY+top-slab-.019,z],concrete,rotate);
    const footHeight=.077,legHeight=top-slab-.038-footHeight;
    for(const side of [-1,1]){
      const offset=side*(w/2-.32),px=x+offset*Math.cos(yaw),pz=z-offset*Math.sin(yaw);
      box(seats,[.36,footHeight,d*.85],[px,floorY+footHeight/2,pz],concrete,rotate);
      part(seats,pedestal,concrete,[.216,legHeight,d*.48],[px,floorY+footHeight+legHeight/2,pz],[0,yaw,0]);
    }
  }

  const iron=coat('hierro pintado',0x414940,{metalness:.36});
  const slat=coat('listones de las sillas',0x56584a,{metalness:.22});
  function sideRail(points,radius){
    const path=new THREE.CatmullRomCurve3(points.map(([z,y])=>new THREE.Vector3(0,y,z)));
    return new THREE.TubeGeometry(path,24,radius,7,false);
  }
  const chairFrame=sideRail([[-.285,.019],[-.237,.25],[-.198,.443],[.07,.452],[.209,.48],[.271,.73],[.312,.89]],.018);
  const rearLeg=sideRail([[.20,.46],[.188,.27],[.262,.019]],.017);
  const arm=sideRail([[-.157,.454],[-.189,.58],[-.225,.64],[-.194,.678],[-.141,.675],[.10,.648],[.247,.661]],.014);
  function ironChair(x,z,yaw){
    const c=Math.cos(yaw),s=Math.sin(yaw);
    const point=(dx,y,dz)=>[x+c*dx+s*dz,floorY+y,z-s*dx+c*dz];
    for(const dx of [-.25,.25]){
      for(const rail of [chairFrame,rearLeg,arm]) part(chairs,rail,iron,[1,1,1],point(dx,0,0),[0,yaw,0]);
    }
    for(let i=0;i<5;i++) box(chairs,[.52,.032,.066],point(0,.449,-.165+i*.081),slat,{rotate:[0,yaw,0]});
    const tilt=new THREE.Quaternion().setFromEuler(new THREE.Euler(.25,yaw,0,'YXZ'));
    for(let i=0;i<4;i++) part(chairs,cube,slat,[.53,.062,.030],point(0,.55+i*.089,.226+i*.023),tilt);
  }
  for(const [index,[x,z,yaw]] of [[1.30,3.32,-.04],[.92,7.25,.08],[1.40,11.22,-.055],[.70,15.28,.045]].entries()){
    const c=Math.cos(yaw),s=Math.sin(yaw);
    stoneSlab(x,z,yaw,true);
    for(const side of [-1,1]) stoneSlab(x+s*side*.88,z+c*side*.88,yaw);
    const chairSide=index%2===0?-1:1;
    ironChair(x+c*1.24*chairSide,z-s*1.24*chairSide,yaw+chairSide*Math.PI/2);
    if(index===1 || index===3) ironChair(x-c*1.31*chairSide,z+s*1.31*chairSide,yaw-chairSide*Math.PI/2+.12);
  }
  for(const [x,z,a] of [[-3.96,7.52,1.48],[-3.92,10.52,1.63],[-2.94,15.61,.14]]) stoneSlab(x,z,a);

  // Draw in X/-Z so the extrusion becomes vertical after rotation.
  function platformOutline(inset){
    const side=1.78-inset,frontSide=2.85-inset,wall=inset;
    const nose=11.68-inset,back=-6.51+inset,rad=.86-inset;
    const shape=new THREE.Shape();
    shape.moveTo(side,-back);
    shape.lineTo(side,-2.5);
    shape.bezierCurveTo(side,-4.5,frontSide,-6,frontSide,-8.1);
    shape.lineTo(frontSide,-nose+rad);
    shape.quadraticCurveTo(frontSide,-nose,frontSide-rad,-nose);
    shape.lineTo(wall+.28,-nose);
    shape.quadraticCurveTo(wall,-nose,wall,-nose+.28);
    shape.lineTo(wall,-back);
    shape.closePath();
    return shape;
  }
  const deckY=.285;
  const face=mat.serviceConcrete;
  const top=face.clone();
  top.name='Andén · hormigón terroso';
  top.color.setHex(0xd6c9ae);
  function deckMesh(name,shape,base,depth,surface){
    const geometry=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:14});
    const uv=geometry.attributes.uv;
    for(let i=0;i<uv.count;i++) uv.setXY(i,uv.getX(i)/1.65,uv.getY(i)/1.65);
    geometry.rotateX(-Math.PI/2);
    return mesh(platform,name,geometry,surface,[0,base,0]);
  }
  deckMesh('Base continua bajo la fila de aires',platformOutline(0),.049,deckY-.049,[top,face]);
  const kerb=platformOutline(0);
  kerb.holes.push(new THREE.Path(platformOutline(.115).getPoints(14).reverse()));
  deckMesh('Bordillo continuo con remate curvo',kerb,deckY,.043,face);

  // A flush inspection cover and scattered grass grow in the exposed front end.
  const patchRng=rng(2197);
  const greenMetal=coat('tapa de registro',0x505b4f,{metalness:.33});
  part(platform,cylinder,darkMetal,[.31,.015,.31],[1.73,deckY+.008,10.04]);
  part(platform,cylinder,greenMetal,[.275,.012,.275],[1.73,deckY+.018,10.04]);
  for(const dx of [-.13,.13]) box(platform,[.025,.007,.056],[1.73+dx,deckY+.026,10.04],darkMetal);
  const grassVertices=[],grassColors=[];
  const grassShades=[0x67653a,0x7d7951,0x657240,0x9b965e].map(hex=>new THREE.Color(hex));
  for(const [cx,cz,radius] of [[2.16,10.64,.42],[1.07,10.38,.41],[.73,8.58,.50],[1.92,9.62,.26],[2.19,7.65,.19],[1.39,2.1,.19],[1.31,-2.15,.18]]){
    for(let i=0;i<32;i++){
      const a=patchRng()*Math.PI*2,d=Math.sqrt(patchRng())*radius;
      const x=cx+Math.cos(a)*d,z=cz+Math.sin(a)*d;
      for(let blade=0;blade<4;blade++){
        const t=patchRng()*Math.PI*2,w=.007+patchRng()*.010,h=.035+patchRng()*.087;
        const dx=Math.cos(t)*w,dz=Math.sin(t)*w;
        grassVertices.push(x-dx,deckY,z-dz,x+dx,deckY,z+dz,x+dz*2,deckY+h,z-dx*2);
        const color=grassShades[Math.floor(patchRng()*grassShades.length)];
        for(let j=0;j<3;j++) grassColors.push(color.r,color.g,color.b);
      }
    }
  }
  const blades=new THREE.BufferGeometry();
  blades.setAttribute('position',new THREE.Float32BufferAttribute(grassVertices,3));
  blades.setAttribute('color',new THREE.Float32BufferAttribute(grassColors,3));
  blades.computeVertexNormals();
  mesh(platform,'Pasto disperso en el andén',blades,coat('pasto ralo',0xffffff,{vertexColors:true,side:THREE.DoubleSide})).castShadow=false;

  function condenser(x,z,size){
    const h=.69*size,w=.52*size,d=.90*size;
    const footHeight=.09,bottom=deckY+footHeight;
    for(const side of [-1,1]) box(equipment,[w*.77,footHeight,.105],[x,deckY+footHeight/2,z+side*d*.34],darkMetal);
    box(equipment,[w,h,d],[x,bottom+h/2,z],acSteel);
    box(equipment,[.022,h*.76,d*.86],[x+w/2+.014,bottom+h/2,z],coil);
    for(let i=0;i<11;i++){
      box(equipment,[.028,.017,d*.85],[x+w/2+.025,bottom+h*(.14+.072*i),z],acSteel,{shadow:false});
    }
  }
  for(const [i,z] of [7.05,5.87,4.56,2.94,1.7,.17,-1.06,-2.33,-4.1,-5.41].entries()){
    condenser(.86-(i%2)*.12,z,1+(i%3)*.09);
  }
  return court;
}
