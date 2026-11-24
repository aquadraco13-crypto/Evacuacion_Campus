import * as THREE from './three.module.js';

// Metres in the plaza elevation: +x is to the right from I, +z towards I.
// The origin is the middle of the existing passage, on the east face of A.
export function buildBlockAFront(kit,mat,texture,tree,palm,leafSpray,building,door){
  const {group,part,mesh,box,beam,cube}=kit;
  const front=group('Frente del Bloque I hacia el Bloque A');
  front.position.copy(building.localToWorld(new THREE.Vector3(door.x,0,door.z)));
  front.rotation.y=building.rotation.y+Math.PI/2;
  function section(name,parent=front){const s=group(name);parent.add(s);return s;}
  const facade=section('Bloque A · fachada de la plaza');
  const plaza=section('Explanada ajardinada frente al Bloque I');
  const planting=section('Arbolado y sotobosque de las jardineras',plaza);
  const surface=(name,color,extra={})=>new THREE.MeshStandardMaterial({name,color,roughness:.86,...extra});
  const ochre=surface('Bloque A · ladrillo miel',0xffffff,{map:texture('Ladrillo ocre del Bloque A',512,256,(c,w,h,r)=>{
    c.fillStyle='#aa875e';c.fillRect(0,0,w,h);
    const tones=['#d7a25e','#daaa6b','#dfa967','#c89962','#d6a26a','#d4a065','#daa66d'];
    for(let row=0;row<16;row++)for(let col=-1;col<8;col++){
      const x=col*64+(row%2)*32,y=row*16;
      c.fillStyle=tones[Math.floor(r()*tones.length)];c.fillRect(x+1,y+1,62.8,14.8);
      c.fillStyle='rgba(248,216,164,.19)';c.fillRect(x+1,y+1,62.4,1.5);
    }
  },10)});
  const brickUV={repeat:[2.26,1.16]};
  const soffit=surface('Galerías · cielo raso cálido',0xc39e77);
  const pier=surface('Galerías · pilares marfil',0xddc9a1);
  const cap=surface('Galerías · albardilla de concreto',0xc1c7b4);
  const rails=[0x4b9d99,0x90b28f,0x72aaa0].map((c,i)=>surface('Galerías · antepecho '+(i+1),c));
  const glass=surface('Bloque A · vidrio en sombra',0x35464a,{roughness:.38,metalness:.16});
  const ivory=surface('Bloque A · perfilería',0xbcb7a3,{metalness:.25});
  const frame=surface('Bloque A · marco oscuro',0x414b49);
  const luminaire=surface('Galerías · difusor opalino',0xffeed1,{emissive:0xe8c998,emissiveIntensity:.22});
  const cylinder=new THREE.CylinderGeometry(1,1,1,20);
  function brick(parent,x,y,z,w,h,d){box(parent,[w,h,d],[x,y,z],ochre,brickUV);}
  function window(parent,x,y,z,w,h){
    box(parent,[w,h,.085],[x,y,z],frame);
    box(parent,[w-.10,h-.10,.045],[x,y,z+.06],glass);
    box(parent,[.037,h-.055,.04],[x,y,z+.089],ivory);
    box(parent,[w+.12,.065,.16],[x,y-h/2,z+.04],cap);
  }

  // Shared outline for the tiled platforms, thick curved parapets and their caps.
  const left=-11.70,elbow=-4.80,right=5.15,radiusX=elbow-left;
  function rim(inset){
    const pts=[];
    for(let i=0;i<=28;i++){
      const a=Math.PI-(Math.PI/2)*i/28;
      pts.push([elbow+(radiusX-inset)*Math.cos(a),-.24+(4.85-inset)*Math.sin(a)]);
    }
    pts.push([right,4.61-inset]);return pts;
  }
  function plate(parent,name,loop,y,h,material){
    const shape=new THREE.Shape(loop.map(([x,z])=>new THREE.Vector2(x,-z)));
    const g=new THREE.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false});
    g.rotateX(-Math.PI/2);mesh(parent,name,g,material,[0,y,0]);
  }
  const edge=rim(0);
  const back=-1.54,floorLoop=[[left,back],...edge,[right,back]];
  for(const [i,y] of [3.49,6.46,9.43].entries()){
    const deck=section('Bloque A · galería curva '+(i+1),facade);
    plate(deck,'Losa curva',floorLoop,y,.20,soffit);
    plate(deck,'Baldosas de la galería',floorLoop,y+.20,.02,mat.pavement);
    plate(deck,'Antepecho macizo',edge.concat(rim(.24).reverse()),y+.17,.91,rails[i]);
    plate(deck,'Remate de galería',rim(-.032).concat(rim(.275).reverse()),y+1.08,.062,cap);
    // Low return where the curved end meets the short side of the building.
    box(deck,[.24,.94,1.30],[left+.12,y+.67,-.89],rails[i]);
    for(const [q,z] of [[-10.65,.95],[-6.3,3.42],[-1.0,3.82],[4.15,3.82]]){
      box(deck,[.39,2.79,.42],[q,y+1.59,z],pier);
      part(deck,cylinder,luminaire,[.14,.022,.14],[q+.6,y-.012,z-.48]);
    }
    brick(deck,(left+right)/2,y+1.52,back-.08,right-left,3.03,.18);
    for(const q of [-10.3,-5.0,.75]){
      box(deck,[1.09,2.13,.09],[q,y+1.32,back+.065],mat.door);
      window(deck,q+1.83,y+1.72,back+.04,1.82,1.07);
    }
  }
  for(const q of [-18.45,-12.0,12.15]){
    box(facade,[.55,3.48,.58],[q,1.75,1.68],pier);
    box(facade,[.65,.19,.68],[q,.12,1.68],cap);
  }
  // The storey of narrow windows above the shaded galleries has a square brow.
  const browLeft=left-.83,browWidth=right-browLeft+.09,browX=browLeft+browWidth/2;
  box(facade,[browWidth,.28,6.62],[browX,12.40,1.31],soffit);
  brick(facade,browX,13.61,2.82,browWidth,2.20,.24);
  brick(facade,browLeft+.11,13.61,.05,.22,2.20,5.64);
  box(facade,[browWidth,.14,5.71],[browX,14.60,.04],cap);
  box(facade,[browWidth,.11,.22],[browX,14.74,2.83],cap);
  for(let j=0;j<5;j++)window(facade,-10.52+j*3.50,13.60,2.992,1.22,1.38);
  const wingZ=-2.85;
  brick(facade,-17.03,9.14,wingZ,10.66,11.18,.31);
  brick(facade,-11.78,9.14,(wingZ+back)/2,.22,11.18,back-wingZ+.30);
  for(const y of [5.11,8.23,11.21,13.63])for(const q of [-20.15,-16.55,-13.45])
    window(facade,q,y,wingZ+.18,1.36,1.17);
  // The tower stands on the outer jamb; the covered ground-floor passage runs underneath.
  brick(facade,8.7,9.21,2.07,7.10,11.48,4.94);
  brick(facade,12.36,1.74,1.96,.53,3.47,4.66);
  brick(facade,15.94,9.12,-.10,7.41,11.25,.33);
  for(const y of [4.96,8.04,11.17,13.44])for(const q of [14.31,17.15])
    window(facade,q,y,.095,1.22,1.30);
  for(const y of [5.04,8.03,11.15])window(facade,8.24,y,4.61,1.03,1.34);
  brick(facade,8.95,15.62,.48,5.73,1.43,4.01);
  box(facade,[5.94,.12,4.18],[8.95,16.37,.48],cap);
  // Lobby bays flank the broad existing opening to the western court.
  for(const [lo,hi] of [[-22.22,-11.62],[12.75,19.50]]){
    const x=(lo+hi)/2,w=hi-lo;
    brick(facade,x,1.78,.25,w,3.43,.17);
    box(facade,[w,.25,.22],[x,.165,.27],cap);
    const n=w>8?3:2,bay=(w-.92)/n;
    for(let i=0;i<n;i++){
      const bx=lo+.46+(i+.5)*bay;
      window(facade,bx,1.53,.37,bay-.27,2.43);
      box(facade,[bay-.37,.095,.08],[bx,2.34,.47],ivory);
    }
  }

  function pave(w,d,x,z,y){
    box(plaza,[w,.095,d],[x,y-.0475,z],mat.pavement,{shadow:false});
  }
  const plazaStart=4.2, plazaDepth=30, bedStart=plazaStart+plazaDepth, bedDepth=26;
  const walkX=-4.8, passageWidth=16.4;
  const outerLeft=-19.75, outerRight=10.50;
  const bedMid=bedStart+bedDepth/2;
  pave(46,plazaDepth,-9.5,plazaStart+plazaDepth/2,.047);
  pave(outerRight-outerLeft,bedDepth,(outerLeft+outerRight)/2,bedMid,.047);
  const glaze=surface('Jardineras · cerámica verde botella',0x295e52,{roughness:.36});
  const soil=surface('Jardineras · mantillo',0x61533d,{map:mat.serviceConcrete.map});
  const plantingFloor=.36;
  const bounds=[[outerLeft,walkX-passageWidth/2],[walkX+passageWidth/2,outerRight]];
  for(const [lo,hi] of bounds){
    const x=(lo+hi)/2,z=bedMid,w=hi-lo,d=bedDepth;
    box(plaza,[w-.20,.12,d-.20],[x,plantingFloor-.06,z],soil,{repeat:[2.6,2.6]});
    for(const q of [lo+.10,hi-.10]){
      box(plaza,[.20,.36,d],[q,.223,z],mat.brick,{repeat:[2.43,1.44]});
      box(plaza,[.26,.082,d+.05],[q,.445,z],glaze);
    }
    for(const s of [-1,1]){
      const dz=z+s*(d-.20)/2;
      box(plaza,[w-.40,.36,.20],[x,.223,dz],mat.brick,{repeat:[2.43,1.44]});
      box(plaza,[w-.40,.082,.26],[x,.445,dz],glaze);
    }
  }
  for(const [q,z,h,r] of [[-16.65,40.14,6.6,3.25],[-15.17,48.54,11.3,4.85],[-17.75,57.40,10,4.2],
    [7.70,39.75,7.8,3.7],[5.70,48.21,13.3,5.05],[9.10,56.28,10.8,4.25]]){
    tree(q,z,h,r,plantingFloor,planting);
  }
  for(const [q,z,h,r] of [[-14.35,51.35,12.8,3.3],[5.85,52.47,11.8,3.05]])
    palm(q,z,h,r,plantingFloor,planting);
  // Stemless, arching blades keep the understory open beneath the mature crowns.
  const blade=new THREE.BufferGeometry();
  blade.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,-.075,.33,.14,0,.39,.16,.075,.33,.14,
    -.08,.48,.4,0,.53,.42,.075,.48,.4,0,.39,.83],3));
  blade.setIndex([0,1,2,0,2,3,1,4,5,1,5,2,2,5,6,2,6,3,4,7,5,5,7,6]);blade.computeVertexNormals();
  const green=[0x547542,0x709050,0x3e623b].map(c=>surface('Hojas del sotobosque',c,{side:THREE.DoubleSide}));
  const wood=surface('Jardineras · ramas',0x70624e);
  const stalk=new THREE.CylinderGeometry(.63,1,1,8);
  for(const [k,[lo,hi]] of bounds.entries())for(let i=0;i<12;i++){
    const q=lo+1.16+(.5+.5*Math.sin(3.15+k*2+i*5.39))*(hi-lo-2.32);
    const z=bedStart+1.35+i*(bedDepth-2.7)/11,s=.61+.29*(1+Math.sin(i*3.18+k));
    for(let j=0;j<4;j++){
      const a=j*2.4+i,tip=[q+.34*s*Math.cos(a),plantingFloor+s*(.76+.17*Math.cos(j+i)),z+.34*s*Math.sin(a)];
      beam(planting,stalk,[q,plantingFloor,z],tip,.033*s,.033*s,wood);
      leafSpray(planting,tip,s*(.53+.11*(j%3)),1,a);
    }
  }
  for(const [k,[lo,hi]] of bounds.entries())for(let i=0;i<26;i++){
    const q=lo+.85+(.5+.5*Math.sin(1.96*i+.78*k))*(hi-lo-1.70),z=bedStart+1.22+i*(bedDepth-2.44)/25;
    for(let j=0;j<8;j++){
      const s=.36+.55*(.5+.5*Math.cos(i*7.34+j*4.36));
      part(planting,blade,green[(i+j)%3],[s,s,s],[q,plantingFloor,z],[.23*Math.cos(i+j),i*.98+j*2.399,.09],false);
    }
  }
  const iron=surface('Farol · acero grafito',0x353836,{metalness:.32});
  const lamp=section('Farol del paseo',plaza);lamp.position.set(-9.1,.047,54.55);lamp.scale.set(.72,.69,.75);
  box(lamp,[.34,.12,.35],[0,.06,0],iron);
  for(const x of [-.12,.12])for(const z of [-.12,.12])part(lamp,cylinder,ivory,[.018,.028,.018],[x,.14,z]);
  box(lamp,[.10,4.22,.115],[0,2.21,0],iron);
  beam(lamp,cube,[0,4.25,0],[.62,4.19,0],.12,.15,iron);
  box(lamp,[.45,.095,.21],[.56,4.16,0],iron);
  box(lamp,[.37,.017,.15],[.56,4.107,0],luminaire);

  const disc=section('Plataforma circular enlosada',plaza);disc.position.set(-1.7,.047,52.13);
  const rose=surface('Plataforma · baldosa rosada',0xb78f84);
  const stone=surface('Plataforma · canto envejecido',0x847b6c,{map:mat.serviceConcrete.map});
  const round=new THREE.CylinderGeometry(1,1,1,80),radius=1.18;
  part(disc,round,stone,[radius,.235,radius],[0,.1175,0]);
  part(disc,round,rose,[radius-.012,.045,radius-.012],[0,.252,0]);
  for(const a of [-.84,-.42,0,.42,.84]){
    const chord=2*Math.sqrt((radius-.018)**2-a*a);
    box(disc,[.009,.004,chord],[a,.276,0],stone);
    box(disc,[chord,.004,.009],[0,.276,a],stone);
  }
  box(disc,[.44,.022,.39],[-.38,.29,.20],iron);
  box(disc,[.412,.012,.362],[-.38,.306,.20],cap);
  box(disc,[.085,.009,.018],[-.38,.316,.30],iron);
  return front;
}
