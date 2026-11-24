import * as THREE from './three.module.js';

// Three segmental arches with short, flat springing points between adjacent bays.
export function archProfile(t){
  const phase=Math.min(1,Math.abs(2*((t*3)%1)-1)/.95);
  const edge=Math.sqrt(1-.91**2);
  return (Math.sqrt(1-(.91*phase)**2)-edge)/(1-edge);
}

function signMaterial(name,width,height,draw,transparent=false){
  const canvas=document.createElement('canvas');
  canvas.width=width;canvas.height=height;
  draw(canvas.getContext('2d'),width,height);
  const map=new THREE.CanvasTexture(canvas);
  map.name=name;map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=8;
  return new THREE.MeshStandardMaterial({name,map,transparent,roughness:.88,depthWrite:!transparent});
}

function bannerArtwork(c,w,h){
  c.fillStyle='#eff1e7';c.fillRect(0,0,w,h);
  // Alternating fine threads and vertical folds soften the printed vinyl.
  for(let x=0;x<w;x+=3){
    c.fillStyle='rgba(63,89,80,'+(.023+.018*Math.cos(x*.045))+')';
    c.fillRect(x,0,2,h);
  }
  c.strokeStyle='#779185';c.lineWidth=4;c.strokeRect(9,8,w-18,h-16);
  c.save();c.translate(w*.35,h*.14);c.scale(.53,.53);
  c.fillStyle='#297653';c.beginPath();c.moveTo(-52,-19);c.lineTo(-15,-40);
  c.lineTo(-15,12);c.lineTo(21,32);c.lineTo(-1,46);c.lineTo(-52,18);c.fill();
  c.fillStyle='#86aa50';c.beginPath();c.moveTo(-7,-44);c.lineTo(36,-21);
  c.lineTo(36,8);c.lineTo(9,-6);c.lineTo(9,10);c.lineTo(-7,1);c.fill();c.restore();
  c.fillStyle='#386a54';c.textAlign='left';c.font='bold 19px Arial';
  c.fillText('UNIVERSIDAD POPULAR DEL CESAR',w*.38,h*.165,w*.42);
  c.textAlign='center';c.font='bold 108px Arial';c.fillText('BIENVENIDOS',w/2,h*.62,w*.92);
  c.font='bold 41px Arial';c.fillText('COMUNIDAD UNIVERSITARIA',w/2,h*.84,w*.89);
  for(const x of [21,w/2,w-21])for(const y of [18,h-18]){
    c.fillStyle='#b6bbbb';c.beginPath();c.arc(x,y,6,0,Math.PI*2);c.fill();
    c.fillStyle='#4a5e55';c.beginPath();c.arc(x,y,2.7,0,Math.PI*2);c.fill();
  }
}

// Fine mineral grain and a low-frequency wash can still be read at street level.
function mineralMap(name,road=false){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
  const c=canvas.getContext('2d'),pixels=c.createImageData(512,512);
  let seed=34761;
  for(let y=0;y<512;y++)for(let x=0;x<512;x++){
    seed=(Math.imul(1664525,seed)+1013904223)>>>0;
    const wash=2.5*Math.sin(2*Math.PI*x/512)*Math.cos(4*Math.PI*y/512)+
      1.8*Math.sin(2*Math.PI*(4*x+3*y)/512);
    const grit=((seed/4294967296)-.5)*(road?34:19);
    const value=239+wash+grit,at=(y*512+x)*4;
    pixels.data[at]=value;pixels.data[at+1]=value-.6;pixels.data[at+2]=value-1.5;pixels.data[at+3]=255;
  }
  c.putImageData(pixels,0,0);
  const map=new THREE.CanvasTexture(canvas);
  map.name=name;map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;
  map.repeat.set(.32,.32);map.anisotropy=8;return map;
}

export function buildMainGate(kit,mat,hall,left,right,tree,palm){
  const {group,mesh,part,box,beam,cube}=kit;
  const gate=group('Entrada principal UPC');hall.add(gate);
  gate.position.copy(left).lerp(right,.5);
  const axis=right.clone().sub(left);
  gate.rotation.y=Math.atan2(-axis.z,axis.x);
  const span=axis.length(),bayWidth=span/3,half=span/2;
  const child=name=>{const g=group(name);gate.add(g);return g;};
  const coat=(name,color,metalness=0)=>new THREE.MeshStandardMaterial({name,color,metalness,roughness:metalness?.59:.90});
  const sage=coat('Acceso · estuco salvia',0xacb694);
  sage.map=mineralMap('Estuco mineral de la portada');
  const trim=coat('Acceso · cornisas de concreto claro',0xe5e0cf);
  const fineStone=coat('Acceso · columnas de concreto',0xc9c4af);
  const enamel=coat('Reja · metal marfil',0xe0e3da,.38);
  const galvanized=coat('Reja · acero de las guías',0x717770,.48);
  const green=coat('Faroles · esmalte verde profundo',0x245443,.31);
  const wornRoad=coat('Entrada · calzada de concreto gris',0x98958b);
  wornRoad.map=mineralMap('Árido fino del acceso',true);
  const joint=coat('Entrada · juntas de la calzada',0x686962);
  const stripe=coat('Entrada · pintura vial desgastada',0xdcd9c9);
  const cylinder=new THREE.CylinderGeometry(1,1,1,24);
  const headerHeight=9.61;

  for(let i=0;i<3;i++){
    const bay=child('Entrada · arco '+(i+1));
    const start=-half+i*bayWidth;
    const profile=new THREE.Shape();
    const arc=[];
    for(let j=0;j<=48;j++){
      const x=start+bayWidth*j/48,y=5.55+2.17*archProfile((i+j/48)/3);
      if(j===0)profile.moveTo(x,y);else profile.lineTo(x,y);
      arc.push(new THREE.Vector3(x,y,.28));
    }
    profile.lineTo(start+bayWidth,headerHeight);profile.lineTo(start,headerHeight);profile.closePath();
    mesh(bay,'Paño de estuco sobre el arco',new THREE.ExtrudeGeometry(profile,{depth:.86,bevelEnabled:false}),sage,[0,0,-.65]);
    mesh(bay,'Moldura curva de borde',new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arc),64,.095,9,false),trim);
  }
  box(gate,[span+.94,.22,1.18],[0,headerHeight+.06,-.17],trim);
  box(gate,[span+.86,.075,1.22],[0,headerHeight-.078,-.16],fineStone);
  for(let i=0;i<=3;i++){
    const x=-half+i*bayWidth,z=-1.00;
    part(gate,cylinder,fineStone,[.41,5.80,.41],[x,2.96,z]);
    part(gate,cylinder,trim,[.48,.26,.48],[x,5.63,z]);
    part(gate,cylinder,fineStone,[.47,.22,.47],[x,.14,z]);
    box(gate,[1.02,.31,1.72],[x,5.53,-.58],trim);
    if(i===0||i===3){
      const sign=i===0?-1:1;
      box(gate,[.58,headerHeight,.92],[x+sign*.26,headerHeight/2,-.20],trim);
    }
  }
  // A second line of piers is visible through the grille, beneath the two valleys.
  for(const x of [-bayWidth/2,bayWidth/2]){
    part(gate,cylinder,fineStone,[.37,5.83,.37],[x,2.98,-5.15]);
    part(gate,cylinder,trim,[.44,.24,.44],[x,5.85,-5.15]);
    box(gate,[.64,.26,4.46],[x,5.65,-3.07],fineStone);
  }
  const letters=signMaterial('Rótulo · Universidad Popular del Cesar',1536,96,(c,w,h)=>{
    const title='UNIVERSIDAD POPULAR DEL CESAR';
    c.font='600 60px Arial';c.fillStyle='#4b624c';c.textAlign='center';c.textBaseline='middle';
    for(let i=0;i<title.length;i++)c.fillText(title[i],(i+.5)*w/title.length,h*.53);
  },true);
  mesh(gate,'Nombre de la universidad',new THREE.PlaneGeometry(span*.73,.83),letters,[0,8.75,.224]).castShadow=false;

  const fence=child('Entrada · rejas y portillo peatonal');
  const gateZ=.84,gateHeight=2.83;
  function leaf(x1,x2,z){
    const mid=(x1+x2)/2,w=x2-x1,top=gateHeight+.08;
    for(const x of [x1,x2])box(fence,[.082,gateHeight,.093],[x,top-gateHeight/2,z],enamel);
    for(const y of [.18,.58,.80,2.01,2.22,top])box(fence,[w,.064,.076],[mid,y,z],enamel);
    const cells=Math.max(1,Math.round(w/.68));
    const rod=(ax,ay,bx,by)=>beam(fence,cube,[ax,ay,z],[bx,by,z],.037,.048,enamel);
    for(let i=0;i<cells;i++){
      const a=x1+w*i/cells,b=x1+w*(i+1)/cells,m=(a+b)/2;
      rod(a,.80,m,1.39);rod(m,1.39,b,.80);
      rod(a,2.01,m,1.44);rod(m,1.44,b,2.01);
      box(fence,[.036,1.22,.040],[a,1.405,z],enamel);
    }
    for(let i=1;i<cells*3;i++){
      const x=x1+w*i/(cells*3);
      box(fence,[.032,.67,.041],[x,2.555,z],enamel);
      box(fence,[.032,.62,.041],[x,.48,z],enamel);
    }
  }
  // One recessed pedestrian opening, like the narrow break in the reference grille.
  const walkX=-bayWidth*.68;
  for(const [a,b] of [[-half+.34,walkX-.83],[walkX+.83,-.05],[.05,half-.32]])leaf(a,b,gateZ);
  leaf(walkX+.89,walkX+2.35,gateZ-.95);
  for(const x of [-half+.20,walkX-.83,walkX+.83,.0,half-.20]){
    box(fence,[.115,gateHeight+.16,.14],[x,(gateHeight+.16)/2+.035,gateZ],enamel);
    box(fence,[.18,.21,.20],[x,.125,gateZ],galvanized);
  }
  box(fence,[span-.60,.019,.082],[0,.077,gateZ],galvanized);
  const bannerWidth=bayWidth*.94;
  const bannerX=bayWidth*.82,bannerY=1.58;
  const print=signMaterial('Lona impresa de bienvenida',1024,256,bannerArtwork);
  const fabric=new THREE.PlaneGeometry(bannerWidth,2.08,32,4);
  const points=fabric.attributes.position;
  for(let i=0;i<points.count;i++){
    const u=points.getX(i)/bannerWidth+.5,v=points.getY(i)/2.08+.5;
    points.setZ(i,.050*Math.cos(u*22)*Math.sin(v*Math.PI)+.042*Math.sin(u*Math.PI));
  }
  fabric.computeVertexNormals();
  mesh(fence,'Lona · BIENVENIDOS COMUNIDAD UNIVERSITARIA',fabric,print,[bannerX,bannerY,gateZ+.095]);
  for(const sign of [-1,1])for(const side of [-1,1]){
    const x=bannerX+sign*(bannerWidth/2-.10),y=bannerY+side*.95;
    beam(fence,cube,[x,y,gateZ+.10],[x+sign*.17,y+side*.13,gateZ],.021,.022,green);
  }

  const approach=child('Entrada · calzada, andenes y cruce');
  const center=z=>-.0058*Math.max(0,z)**2;
  // Give every strip identical stations so the curb follows the curve without gaps.
  function strip(name,leftEdge,rightEdge,z0,z1,y,material){
    const vertices=[],uv=[],indices=[],count=Math.ceil((z1-z0)/1.2);
    for(let i=0;i<=count;i++){
      const z=z0+(z1-z0)*i/count,x=center(z);
      vertices.push(x+leftEdge,y,z,x+rightEdge,y,z);
      uv.push(x+leftEdge,z,x+rightEdge,z);
      if(i){const j=(i-1)*2;indices.push(j,j+2,j+1,j+1,j+2,j+3);}
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();
    mesh(approach,name,geo,material).castShadow=false;
  }
  strip('Calzada hacia la Diagonal 21',-4.65,4.65,-3.0,25.85,.063,wornRoad);
  for(const side of [-1,1]){
    const out=side*10.65,inside=side*4.65;
    strip('Andén de acceso',Math.min(out,inside),Math.max(out,inside),-.95,27.3,.163,mat.pavement);
    for(let z=-.95;z<27.29;z+=1){
      const end=Math.min(z+1,27.3);
      beam(approach,cube,[center(z)+inside,.115,z],[center(end)+inside,.115,end],.135,.14,trim);
    }
  }
  for(const z of [2.0,7.3,12.6,17.9,23.2])
    strip('Junta de dilatación',-4.64,4.64,z,z+.022,.069,joint);
  for(let j=0;j<10;j++){
    const x=-4.23+j*.88;
    strip('Paso de cebra',x,x+.46,13.4,16.1,.072,stripe);
  }

  const landscape=child('Entrada · faroles y jardineras');
  for(const [side,z] of [[-1,4.65],[1,3.85]]){
    const x=side*(side>0?10.25:7.00);
    part(landscape,cylinder,green,[.22,.22,.22],[x,.27,z]);
    box(landscape,[.17,5.00,.19],[x,2.77,z],green);
    box(landscape,[1.40,.19,.31],[x+side*.61,5.16,z],green);
    box(landscape,[.95,.048,.23],[x+side*.80,5.038,z],trim);
  }
  for(const [x,z,h,r] of [[-10.45,2.9,5.7,2.5],[10.9,1.0,5.0,2.15]]){
    part(landscape,cylinder,fineStone,[1.02,.16,1.02],[x,.177,z]);
    part(landscape,cylinder,mat.dirt,[.90,.025,.90],[x,.268,z]);
    tree(x,z,h,r,.28,landscape);
  }
  for(const [x,z,r] of [[-10.3,8.0,1.35],[9.5,5.3,1.15]]){
    part(landscape,cylinder,fineStone,[.86,.14,.86],[x,.18,z]);
    part(landscape,cylinder,mat.dirt,[.75,.03,.75],[x,.257,z]);
    palm(x,z,.9,r,.27,landscape);
  }
  return gate;
}
