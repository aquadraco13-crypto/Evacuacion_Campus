import * as THREE from './three.module.js';
import {createVegetation} from './vegetation.js';
import {makePassages} from './hallways.js';
import {academicEntry,entryZ} from './academic-entry.js';
import {buildMonument,monumentCenter,monumentBearing} from './monument.js';
import {buildSite,fitGroup,sitePoint} from './site.js';
import {pavilionDoor} from './covered-link.js';
import {buildBlockI} from './block-i.js';
import {blockPBearing,blockPCenter,buildBlockP} from './block-p.js';
import {buildCafe} from './block-i-cafe.js';
import {buildBlockAFront} from './block-a-front.js';
import {addRightACPlatform,buildWestCourt,westCourtBearing,westCourtCenter,westCourtRightBlock} from './west-court.js';
import {buildBlockACafe,cafeACenter,cafeABearing} from './block-a-cafe.js';

function seededRandom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function texture(name, width, height, paint, grain = 0) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', {willReadFrequently: grain > 0});
  const random = seededRandom(467);
  paint(context, width, height, random);
  if (grain) {
    const image = context.getImageData(0, 0, width, height);
    for (let i = 0; i < image.data.length; i += 4) {
      const amount = (random() - .5) * grain;
      for (let channel = 0; channel < 3; channel++) image.data[i + channel] += amount;
    }
    context.putImageData(image, 0, 0);
  }
  const map = new THREE.CanvasTexture(canvas);
  map.name = name;
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 8;
  return map;
}

function pigment(context, width, height, random, colors, amount, count, size) {
  context.globalAlpha = amount;
  for (let i = 0; i < count; i++) {
    const radius = .7 + random() ** 2 * size;
    context.fillStyle = colors[i % colors.length];
    context.beginPath();
    context.ellipse(random()*width, random()*height, radius, radius*(.3+random()*.7), random()*6, 0, 2*Math.PI);
    context.fill();
  }
  context.globalAlpha = 1;
}

function weatheredConcreteMap(){
  return texture('Árido y pátina del andén',512,512,(ctx,w,h,random)=>{
    // Periodic noise preserves the aggregate scale along the entire curb.
    const layers=[4,12,40].map(n=>{
      const values=Array.from({length:n*n},()=>random()-.5);
      return (u,v)=>{
        const x=u*n,y=v*n,i=Math.floor(x),j=Math.floor(y);
        const fx=x-i,fy=y-j;
        const a=fx*fx*(3-2*fx),b=fy*fy*(3-2*fy);
        const at=(dx,dy)=>values[((j+dy)%n)*n+(i+dx)%n];
        return (1-b)*((1-a)*at(0,0)+a*at(1,0))+b*((1-a)*at(0,1)+a*at(1,1));
      };
    });
    const pixels=ctx.createImageData(w,h);
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){
      const u=x/w,v=y/h;
      const grain=random();
      const tone=157+76*layers[0](u,v)+46*layers[1](u,v)+39*layers[2](u,v)
        +(grain-.5)*40+(grain>.96?38:0);
      const i=4*(y*w+x);
      pixels.data[i]=tone+7; pixels.data[i+1]=tone+3; pixels.data[i+2]=tone-5; pixels.data[i+3]=255;
    }
    ctx.putImageData(pixels,0,0);
  });
}

function brickMap() {
  return texture('Mampostería de ladrillo', 768, 384, (c,w,h,r) => {
    const brick = ['#ad6c51','#a7674f','#bb7a5b','#b6775b','#b27459','#be8064','#b17155','#a86752'];
    c.fillStyle = '#896755';
    c.fillRect(0,0,w,h);
    for (let y = 0; y < 18; y++) {
      for (let x = 0; x < 9; x++) {
        const left = x*w/9 + (y%2)*w/18;
        const top = y*h/18;
        const shade = brick[Math.floor(r()*brick.length)];
        for (const u of [left,left-w]) {
          c.fillStyle = shade;
          c.fillRect(u+1.2,top+1,w/9-2,h/18-1.6);
          c.fillStyle = '#eab69455';
          c.fillRect(u+1.8,top+1,w/9-3,1);
        }
      }
    }
    pigment(c,w,h,r,['#594631','#f1c2a5'],.10,2400,7);
  },16);
}

function squarePavers() {
  return texture('Pavimento del paseo I–A',768,768,(c,w,h,r)=>{
    c.fillStyle='#a57f77';c.fillRect(0,0,w,h);
    const colors=['#85827b','#797770','#807e76','#89867e'];
    for(let j=0;j<2;j++)for(let i=0;i<2;i++){
      const x=i*384,y=j*384;
      c.fillStyle='#655e55';c.fillRect(x+15,y+15,354,354);
      c.fillStyle=colors[j*2+i];c.fillRect(x+17,y+17,350,350);
      c.save();c.beginPath();c.rect(x+17,y+17,350,350);c.clip();
      for(let k=0;k<25;k++){
        const px=x+r()*384,py=y+r()*384,sz=10+r()*64;
        const g=c.createRadialGradient(px,py,0,px,py,sz);
        g.addColorStop(0,k%3?'rgba(55,50,44,.12)':'rgba(208,196,174,.12)');
        g.addColorStop(1,'rgba(100,94,83,0)');c.fillStyle=g;c.fillRect(px-sz,py-sz,2*sz,2*sz);
      }
      c.restore();
      for(let k=0;k<480;k++){
        c.fillStyle=k%2?'rgba(206,200,181,.23)':'rgba(58,53,48,.22)';
        c.fillRect(x+18+r()*346,y+18+r()*346,1+r()*1.8,1+r()*1.8);
      }
      c.strokeStyle='rgba(78,68,60,.58)';c.lineWidth=1.4;
      for(let k=0;k<3;k++){
        c.beginPath();c.moveTo(x+k*128,y-15);c.lineTo(x+k*128+.8,y+15);
        c.moveTo(x-15,y+k*128);c.lineTo(x+15,y+k*128+.6);c.stroke();
      }
    }
    c.strokeStyle='rgba(75,69,60,.48)';c.lineWidth=1.5;
    c.beginPath();c.moveTo(368,290);c.lineTo(330,277);c.lineTo(312,283);c.lineTo(288,270);c.stroke();
  },19);
}

// Bake a single metric UV grid after the buildings and paths have their final transforms.
// Baked UVs keep the same joint positions in Three.js and in the exported GLB.
function alignPaving(root,pavement){
  root.updateMatrixWorld(true);
  const patches=[];
  root.traverse(o=>{if(o.isMesh && o.material===pavement)patches.push(o);});
  const instance=new THREE.Matrix4(),world=new THREE.Vector3();
  const repeat=4.58,cos=Math.cos(.08),sin=Math.sin(.08);
  function project(geometry,matrix){
    const pos=geometry.attributes.position;
    const uv=new THREE.Float32BufferAttribute(new Float32Array(2*pos.count),2);
    for(let i=0;i<pos.count;i++){
      world.fromBufferAttribute(pos,i).applyMatrix4(matrix);
      uv.setXY(i,(cos*world.x-sin*world.z)/repeat,(sin*world.x+cos*world.z)/repeat);
    }
    geometry.setAttribute('uv',uv);
  }
  for(const patch of patches){
    if(!patch.isInstancedMesh){
      patch.geometry=patch.geometry.clone();
      project(patch.geometry,patch.matrixWorld);
      continue;
    }
    for(let i=0;i<patch.count;i++){
      patch.getMatrixAt(i,instance);
      const geometry=patch.geometry.clone().applyMatrix4(instance);
      project(geometry,patch.matrixWorld);
      const slab=new THREE.Mesh(geometry,pavement);
      slab.applyMatrix4(patch.matrix);
      slab.name=patch.name;
      slab.castShadow=patch.castShadow;
      slab.receiveShadow=patch.receiveShadow;
      patch.parent.add(slab);
    }
    patch.removeFromParent();
  }
}

function tileMap() {
  return texture('Baldosa de corredor',512,512,(c,w,h,r) => {
    c.fillStyle='#a08675';
    c.fillRect(0,0,w,h);
    for(let y=0;y<8;y++) for(let x=0;x<8;x++) {
      c.fillStyle=['#8b584a','#875546','#956050','#915c50','#956052'][Math.floor(r()*5)];
      c.fillRect(x*64+1,y*64+1,62,62);
    }
  },12);
}

function grassMap() {
  return texture('Jardín',512,512,(c,w,h,r)=>{
    c.fillStyle='#698349';
    c.fillRect(0,0,w,h);
    pigment(c,w,h,r,['#9eab67','#506433','#52653f','#9aa054','#aeb765'],.16,3400,34);
    pigment(c,w,h,r,['#b5c37b','#3a4b2c'],.16,21000,2);
  },19);
}

function roofMap() {
  return texture('Lámina verde acanalada',512,256,(c,w,h)=>{
    c.fillStyle='#64847e';
    c.fillRect(0,0,w,h);
    const span=w/24;
    for(let i=0;i<24;i++){
      const x=i*span;
      c.fillStyle='#88aaa4';
      c.fillRect(x,0,3,h);
      c.fillStyle='#4f706a';
      c.fillRect(x+3,0,2,h);
    }
    c.fillStyle='#c2c8ad44';
    c.fillRect(0,0,w,3);
    c.fillRect(0,h/2,w,2);
  },9);
}

function material(name,color,map=null,options={}) {
  return new THREE.MeshStandardMaterial({name,color,map,roughness:.86,...options});
}

function kit(root) {
  const batches = new Map();
  const boxCache = new Map();
  const cube = new THREE.BoxGeometry(1,1,1);
  const vector = new THREE.Vector3();
  const up = new THREE.Vector3(0,1,0);
  const pose = new THREE.Object3D();

  function group(name) {
    const parent = new THREE.Group();
    parent.name = name;
    root.add(parent);
    batches.set(parent,new Map());
    return parent;
  }

  function part(parent, geometry, surface, size, position, rotation, shadows=true) {
    const pool = batches.get(parent);
    const key = geometry.id + '/' + surface.id + '/' + shadows;
    if(!pool.has(key)) pool.set(key,{geometry,surface,shadows,matrices:[]});
    pose.position.set(...position);
    pose.scale.set(...size);
    if(rotation?.isQuaternion) pose.quaternion.copy(rotation);
    else pose.rotation.set(...(rotation || [0,0,0]));
    pose.updateMatrix();
    pool.get(key).matrices.push(pose.matrix.clone());
  }

  function mesh(parent,name,geometry,surface,position=[0,0,0]) {
    const object = new THREE.Mesh(geometry,surface);
    object.name=name;
    object.castShadow=true;
    object.receiveShadow=true;
    object.position.set(...position);
    parent.add(object);
    return object;
  }

  function box(parent,size,position,surface,{repeat=null,rotate=null,shadow=true}={}) {
    let geometry=cube;
    if(repeat){
      const key = size.join('/') + ':' + repeat.join('/');
      if(!boxCache.has(key)){
        const [w,h,d]=size, [u,v]=repeat;
        const g=cube.clone();
        const scales=[[d/u,h/v],[d/u,h/v],[w/u,d/v],[w/u,d/v],[w/u,h/v],[w/u,h/v]];
        const a=g.attributes.uv;
        for(let i=0;i<24;i++) {
          const [s,t]=scales[Math.floor(i/4)];
          a.setXY(i,a.getX(i)*s,a.getY(i)*t);
        }
        boxCache.set(key,g);
      }
      geometry=boxCache.get(key);
    }
    part(parent,geometry,surface,size,position,rotate,shadow);
  }

  function beam(parent,geometry,a,b,x,z,surface,shadow=true) {
    vector.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
    const length=vector.length();
    const rotation=new THREE.Quaternion().setFromUnitVectors(up,vector.normalize());
    part(parent,geometry,surface,[x,length,z],a.map((value,i)=>(value+b[i])/2),rotation,shadow);
  }

  function finish() {
    for(const [parent,pool] of batches) for(const {geometry,surface,shadows,matrices} of pool.values()){
      const object=new THREE.InstancedMesh(geometry,surface,matrices.length);
      object.name=surface.name;
      matrices.forEach((matrix,i)=>object.setMatrixAt(i,matrix));
      object.castShadow=shadows;
      object.receiveShadow=true;
      object.computeBoundingBox();
      object.computeBoundingSphere();
      parent.add(object);
    }
  }

  return {group,part,mesh,box,beam,finish,cube};
}

function extrudedPolygon(points, depth) {
  const shape=new THREE.Shape();
  points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:10});
}

export function buildCampus() {
  const root = new THREE.Group();
  root.name='Universidad Popular del Cesar · Sede Sabanas';
  root.userData={units:'m',scope:'Sede Sabanas, con los cuatro pisos del Bloque I y el sector ampliado del Bloque P. Perímetro, escala y cinco niveles de P estimados.'};
  const random=seededRandom(2011);
  const sceneKit=kit(root);
  const {group,part,mesh,box,beam,finish,cube}=sceneKit;
  const {tree,crown:leafSpray}=createVegetation(sceneKit,texture);
  const brickUV={repeat:[2.43,1.44]};
  const mat={
    brick:material('Ladrillo naranja',0xffffff,brickMap()),
    pavement:material('Pavimento UPC · losas grises con bandas rosadas',0xffffff,squarePavers()),
    serviceConcrete:material('Andén · concreto con árido expuesto',0xaaa599,weatheredConcreteMap()),
    tile:material('Baldosa',0xffffff,tileMap()),
    grass:material('Césped',0xffffff,grassMap()),
    roof:material('Cubierta verde acanalada',0xffffff,roofMap(),{side:THREE.DoubleSide,roughness:.68,metalness:.17}),
    trim:material('Canto de cubierta',0x9eb6ab),
    rails:material('Antepechos verdes',0x7b9b89),
    teal:material('Estuco turquesa',0x62978c),
    pine:material('Acero verde profundo',0x34574b),
    lip:material('Borde verde de jardinera',0x307955),
    glass:material('Vidrio oscuro',0x273738,null,{roughness:.38,metalness:.19}),
    frame:material('Marcos oscuros',0x3a4139),
    dark:material('Fondo de abertura',0x3e493a),
    door:material('Puertas verdes',0x3f6250),
    structure:material('Concreto estructural',0xb9b5a2),
    ivory:material('Cantos claros',0xe0decd),
    skirting:material('Zócalo terracota',0x955b50),
    dirt:material('Tierra de jardín',0x72624f),
    base:material('Canto de maqueta',0x314b41),
    barkPalm:material('Fibra de palma',0x8b856d),
    table:material('Mesas de piedra',0xaaa48f),
    bench:material('Bancas',0x78685c),
    red:material('Faroles rojos',0xa94d41)
  };
  const leaf=['#34572f','#466937','#547b3c','#668946','#72944d','#81a058'].map(hex=>material('Follaje '+hex,hex));
  const palmLeaf=['#477039','#578443','#708c46','#839952'].map(hex=>material('Palma '+hex,hex,null,{side:THREE.DoubleSide}));
  const ringWood=material('Palmera · cicatrices del estípite',0x77725f);
  const crownShaft=material('Palmera · vaina del cogollo',0x748143);
  const cylinder=new THREE.CylinderGeometry(1,1,1,10);
  const leaves=new THREE.IcosahedronGeometry(1,1);
  const sphere=new THREE.SphereGeometry(1,10,7);

  function brickBlock(parent,{x,z,w,d,floors=4,floor=3.65,bays=8,narrow=false,rear=true,podium=false,passage=null,backDoor=null,entry=null,plazaGalleries=false}) {
    const total=floors*floor;
    const wall=.34;
    const gap=narrow?.55:.68;
    const sideCount=Math.max(2,Math.round(d/4.1));
    function besidePassage(span,segment){
      const left=passage.center-passage.width/2;
      const right=passage.center+passage.width/2;
      segment((left-span/2)/2,left+span/2);
      segment((right+span/2)/2,span/2-right);
    }
    function facade(side,span,run,count) {
      const size=span/count;
      const opening=size*gap;
      const openingHeight=narrow?1.36:1.63;
      const sill=1.05;
      const head=floor-sill-openingHeight;
      const isFront=side==='front'||side==='back';
      const sign=(side==='front'||side==='right')?1:-1;
      const panel=(s,y,length,height,depth,inset=0,surface=mat.brick)=>{
        const dimensions=isFront?[length,height,depth]:[depth,height,length];
        const location=isFront?[x+s,y,z+sign*(run/2-inset)]:[x+sign*(run/2-inset),y,z+s];
        box(parent,dimensions,location,surface,surface===mat.brick?brickUV:undefined);
      };
      function place(s,y,length,height,depth,inset=0,surface=mat.brick){
        const low=y-height/2,high=y+height/2,L=s-length/2,R=s+length/2;
        if(side!==entry?.side || low>=2.72 || R<=entry.center-entry.width/2 || L>=entry.center+entry.width/2){
          panel(s,y,length,height,depth,inset,surface);return;
        }
        const a=Math.max(L,entry.center-entry.width/2),b=Math.min(R,entry.center+entry.width/2);
        if(a>L)panel((a+L)/2,y,a-L,height,depth,inset,surface);
        if(b<R)panel((R+b)/2,y,R-b,height,depth,inset,surface);
        if(high>2.72)panel((a+b)/2,(high+2.72)/2,b-a,high-2.72,depth,inset,surface);
      }
      const levels=plazaGalleries&&side==='right'?1:floors;
      for(let level=0;level<levels;level++){
        const bottom=level*floor;
        if(passage && !isFront && level===0){
          besidePassage(span,(center,width)=>place(center,passage.height/2,width,passage.height,wall));
          place(0,(floor+passage.height)/2,span,floor-passage.height,wall);
          continue;
        }
        place(0,bottom+sill/2,span,sill,wall);
        place(0,bottom+floor-head/2,span,head,wall);
        for(let j=0;j<=count;j++){
          const s=-span/2+j*size;
          const pier=size-opening;
          place(j===0?s+pier/4:j===count?s-pier/4:s,bottom+sill+openingHeight/2,j===0||j===count?pier/2:pier,openingHeight,wall);
          if(j===count) continue;
          place(s+size/2,bottom+sill+openingHeight/2,opening-.03,openingHeight-.04,.075,.32,mat.frame);
          place(s+size/2,bottom+sill+openingHeight/2,opening-.15,openingHeight-.16,.05,.26,mat.glass);
          place(s+size/2,bottom+sill+openingHeight/2,.052,openingHeight-.05,.055,.218,mat.frame);
          place(s+size/2,bottom+sill-.045,opening+.08,.065,.44,.025,mat.structure);
        }
      }
    }
    facade('front',w,d,bays);
    if(rear) facade('back',w,d,Math.max(3,bays-1));
    else if(backDoor){
      const lo=backDoor.x-backDoor.width/2,hi=backDoor.x+backDoor.width/2;
      for(const [a,b] of [[x-w/2,lo],[hi,x+w/2]])
        box(parent,[b-a,total,.38],[(a+b)/2,total/2,z-d/2],mat.brick,brickUV);
      box(parent,[backDoor.width,total-backDoor.height,.38],[backDoor.x,(total+backDoor.height)/2,z-d/2],mat.brick,brickUV);
    }
    else box(parent,[w,total,.38],[x,total/2,z-d/2],mat.brick,brickUV);
    facade('left',d,w,sideCount);
    facade('right',d,w,sideCount);
    box(parent,[w+.32,.3,d+.32],[x,total-.51,z],mat.structure);
    box(parent,[w-.58,.15,d-.58],[x,total-.28,z],mat.structure);
    box(parent,[w+.43,.15,.32],[x,total+.055,z+d/2],mat.brick,brickUV);
    box(parent,[w+.43,.15,.32],[x,total+.055,z-d/2],mat.brick,brickUV);
    for(const s of [-1,1]) box(parent,[.32,.15,d-.1],[x+s*w/2,total+.055,z],mat.brick,brickUV);
    if(podium) {
      const base=(width,height,depth,y,surface)=>{
        if(entry){
          const edge=.23;
          for(const sign of [-1,1])box(parent,[edge,height,depth],[x+sign*(width-edge)/2,y,z],surface);
          for(const [side,sign] of [['front',1],['back',-1]]){
            const spans=side===entry.side?[[-width/2,entry.center-entry.width/2],[entry.center+entry.width/2,width/2]]:[[-width/2,width/2]];
            for(const [a,b] of spans)box(parent,[b-a,height,edge],[x+(a+b)/2,y,z+sign*(depth-edge)/2],surface);
          }
          return;
        }
        if(!passage){
          box(parent,[width,height,depth],[x,y,z],surface);
          return;
        }
        besidePassage(depth,(center,span)=>box(parent,[width,height,span],[x,y,z+center],surface));
      };
      base(w-.38,.72,d+.30,.36,mat.skirting);
      base(w+.2,.15,d+.24,.75,mat.structure);
    }
  }

  const blockI=buildBlockI(sceneKit,mat,brickUV);

  const west=group('Bloques del ala occidental');
  const westPatio=group('Bloque longitudinal del patio');
  const westPatioRight=group('Bloque derecho del patio occidental');
  const westCourt=buildWestCourt(sceneKit,mat,leafSpray);
  brickBlock(west,{x:-35,z:-23.7,w:27.6,d:17.2,floors:4,floor:3.70,bays:6,podium:true,entry:{side:'front',center:.6,width:2.70}});
  const opening={center:-.85,width:14.3,height:3.43};
  const rearBlock={x:-38.5,z:12.25,w:12.2,d:26.2,floors:4,floor:3.70,bays:4,podium:true,passage:opening,plazaGalleries:true};
  brickBlock(westPatio,rearBlock);
  brickBlock(westPatioRight,{...westCourtRightBlock,entry:{side:'front',center:0,width:2.80}});
  const crossing=group('Paso peatonal · Patio occidental');
  crossing.position.set(rearBlock.x,0,rearBlock.z+opening.center);
  westPatio.add(crossing);
  box(crossing,[rearBlock.w+.95,.075,opening.width],[0,.0025,0],mat.pavement);
  box(crossing,[rearBlock.w+.13,.18,opening.width+.20],[0,opening.height+.09,0],mat.structure);
  for(const side of [-1,1]){
    const edge=side*(opening.width/2+.09);
    box(crossing,[rearBlock.w+.10,opening.height,.24],[0,opening.height/2,edge],mat.brick,brickUV);
    box(crossing,[rearBlock.w+.04,.48,.035],[0,.28,side*(opening.width/2-.040)],mat.skirting);
    box(crossing,[.52,.13,opening.width+.16],[side*rearBlock.w/2,opening.height+.035,0],mat.structure);
  }
  for(const z of [-4.8,4.8]){
    box(crossing,[.50,opening.height,.42],[0,opening.height/2,z],mat.structure);
    box(crossing,[rearBlock.w-.4,.23,.39],[0,opening.height-.115,z],mat.structure);
  }
  for(const z of [-3.2,0,3.2]){
    for(const x of [-3.75,0,3.75]){
      box(crossing,[.72,.050,.27],[x,opening.height-.025,z],mat.frame);
      box(crossing,[.64,.016,.22],[x,opening.height-.054,z],mat.ivory,{shadow:false});
    }
  }
  box(west,[6.0,5.8,13.5],[-26,2.9,-30],mat.brick,brickUV);

  const central=group('Bloque central · galerías curvas abiertas');
  const center=-10;
  const front=-28.5;
  const edge=[[-12,-9],[-12,.3]];
  for(let i=1;i<=9;i++){
    const a=Math.PI-(Math.PI/2)*i/9;
    edge.push([-8.7+3.3*Math.cos(a),.3+2.55*Math.sin(a)]);
  }
  edge.push([8.7,2.85]);
  for(let i=1;i<=9;i++){
    const a=(Math.PI/2)*(1-i/9);
    edge.push([8.7+3.3*Math.cos(a),.3+2.55*Math.sin(a)]);
  }
  edge.push([12,-9]);
  const floorShape=extrudedPolygon(edge.map(([x,z])=>[x,-z]),.29);
  floorShape.rotateX(-Math.PI/2);
  const gallerySurface=new THREE.ShapeGeometry(new THREE.Shape(edge.map(([x,z])=>new THREE.Vector2(x,-z))));
  gallerySurface.rotateX(-Math.PI/2);
  const curve=edge.slice(1,-1);
  const topLevel=11;
  for(let level=0;level<=3;level++){
    const y=.08+level*3.47;
    mesh(central,'Placa de galería curva',floorShape,mat.structure,[center,y,front]);
    mesh(central,'Pavimento de galería',gallerySurface,mat.pavement,[center,y+.295,front]);
    if(level===0) continue;
    const points=[];
    for(const [x,z] of curve) points.push(x,0,z,x,.83,z);
    const indices=[];
    for(let i=0;i<curve.length-1;i++){
      const a=i*2;
      indices.push(a,a+2,a+1,a+1,a+2,a+3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const surface=mat.rails.clone();
    surface.side=THREE.DoubleSide;
    const apron=mesh(central,'Antepecho curvo continuo',geometry,surface,[center,y+.28,front]);
    const top=curve.map(([x,z])=>new THREE.Vector3(x,.85,z));
    const segments=top.slice(1).map((point,i)=>new THREE.LineCurve3(top[i],point));
    const rim=new THREE.CurvePath();
    for(const segment of segments) rim.add(segment);
    const rail=mesh(central,'Remate de antepecho',new THREE.TubeGeometry(rim,40,.065,5,false),mat.rails);
    rail.position.copy(apron.position);
  }
  for(const x of [-11.2,-7.0,0,7.0,11.2]){
    const z=Math.abs(x)>9?front+1.65:front+2.45;
    box(central,[.43,11.25,.43],[center+x,5.65,z],mat.structure);
    box(central,[.70,.22,.70],[center+x,.11,z],mat.structure);
  }
  box(central,[24,10.95,.32],[center,5.47,front-7.85],mat.teal);
  for(let level=0;level<3;level++){
    for(let i=0;i<5;i++){
      const x=center-9+i*4.5;
      box(central,[1.05,2.19,.15],[x,level*3.47+1.38,front-7.64],mat.door);
      box(central,[2.11,.78,.10],[x+1.55,level*3.47+2.56,front-7.64],mat.glass);
    }
  }
  const crown=group('Coronación del bloque central');
  crown.position.y=topLevel;
  brickBlock(crown,{x:center,z:front-2.8,w:24.4,d:12.5,floors:1,floor:3.42,bays:8,narrow:true});
  const service=group('Núcleo alto de la galería');
  box(service,[6.85,15.42,9.5],[6,7.71,-32.5],mat.brick,brickUV);
  box(service,[6.99,.22,9.65],[6,15.45,-32.5],mat.structure);
  for(let level=0;level<4;level++){
    box(service,[.77,1.33,.036],[5.25,2.55+3.47*level,-27.73],mat.glass);
    box(service,[.77,1.33,.036],[6.77,2.55+3.47*level,-27.73],mat.glass);
  }
  brickBlock(service,{x:14,z:-36.4,w:10,d:12,floors:3,bays:3,entry:{side:'front',center:0,width:2.45}});

  const walks=group('Plaza · senderos cubiertos');
  function canopy(parent,x,z,length,width,covered) {
    const y=2.85;
    const ridge=.93;
    const profile=[[-width/2,y],[0,y+ridge],[width/2,y]];
    const z0=z-length/2;
    const z1=z+length/2;
    if(covered){
      const coords=[], uv=[], indices=[];
      for(let side=0;side<2;side++){
        for(const [i,depth] of [z0,z1].entries()){
          for(const vertex of profile.slice(side,side+2)) {
            coords.push(vertex[0],vertex[1],depth-z);
            uv.push(i*length/4.8,(vertex[0]+width/2)/2.6);
          }
        }
        const a=side*4;
        indices.push(a,a+2,a+1,a+1,a+2,a+3);
      }
      const surface=new THREE.BufferGeometry();
      surface.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));
      surface.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
      surface.setIndex(indices);
      surface.computeVertexNormals();
      mesh(parent,'Faldones de lámina acanalada',surface,mat.roof,[x,0,z]);
      box(parent,[.14,.09,length+.04],[x,y+ridge+.035,z],mat.trim);
      for(const side of [-1,1]){
        box(parent,[.075,.104,length],[x+side*width/2,y-.035,z],mat.pine);
        box(parent,[.10,.15,length-.32],[x+side*(width/2-.32),y-.22,z],mat.pine);
      }
    }
    const count=Math.ceil(length/4.4);
    for(let i=0;i<=count;i++){
      const rz=z0+.38+(length-.76)*i/count;
      for(const side of [-1,1]){
        const px=x+side*(width/2-.34);
        box(parent,[covered?.23:.35,2.80,covered?.23:.34],[px,1.4,rz],mat.pine);
        box(parent,[.39,.13,.39],[px,.065,rz],mat.structure);
      }
      for(let side=0;side<2;side++){
        const a=profile[side], b=profile[side+1];
        beam(parent,cube,[x+a[0],a[1]-.07,rz],[x+b[0],b[1]-.07,rz],covered?.095:.20,.13,covered?mat.trim:mat.rails);
      }
      if(covered){
        box(parent,[width-.35,.07,.09],[x,y-.21,rz],mat.trim);
      }
    }
  }
  canopy(walks,-6.4,12.3,39.4,4.6,true);
  canopy(walks,6.4,12.3,39.4,4.6,true);

  const annex=group('Pabellón del acceso · estuco turquesa');
  brickBlock(annex,{x:27,z:36.3,w:23,d:11.4,floors:2,bays:6,narrow:true,rear:false,backDoor:pavilionDoor});
  const jambLeft=pavilionDoor.x-pavilionDoor.width/2,jambRight=pavilionDoor.x+pavilionDoor.width/2;
  for(const [a,b] of [[15.4,jambLeft],[jambRight,38.6]])
    box(annex,[b-a,3.07,.30],[(a+b)/2,1.54,30.51],mat.teal);
  for(const x of [jambLeft,jambRight])box(annex,[.09,2.84,.28],[x,1.42,30.48],mat.pine);
  box(annex,[pavilionDoor.width+.16,.24,.30],[pavilionDoor.x,2.96,30.51],mat.pine);
  box(annex,[pavilionDoor.width+.25,.10,2.9],[pavilionDoor.x,.015,31.50],mat.pavement);
  for(let i=0;i<6;i++){
    const x=17.8+i*3.64;
    if(x>jambLeft&&x<jambRight)continue;
    box(annex,[2.19,1.07,.071],[x,1.79,30.32],mat.dark);
    for(let j=0;j<9;j++) box(annex,[.045,1.05,.047],[x-.93+j*.233,1.79,30.267],mat.ivory,{shadow:false});
    box(annex,[2.24,.09,.064],[x,1.79,30.26],mat.ivory,{shadow:false});
  }
  box(annex,[23.38,.14,.40],[27,3.12,30.51],mat.rails);

  const props=group('Mobiliario y escala humana');
  function shrubs(x,z,s,base,parent){
    const y=base+s*.41;
    for(let i=0;i<13;i++){
      const a=i*2.39996;
      const d=s*(i===0?0:.15+random()*.22);
      const r=s*(.35+random()*.25);
      part(parent,leaves,leaf[i%5],[r,r*.83,r], [x+d*Math.cos(a),y+random()*s*.20,z+d*Math.sin(a)],[0,random()*6.28,0]);
    }
  }

  function frondShape(curl) {
    const points=[], indices=[];
    const veins=26;
    function stem(t){return [t,Math.sin(Math.PI*t)*.28-curl*t*t,0];}
    for(let i=0;i<veins;i++){
      const t=.035+i*.93/veins;
      for(const side of [-1,1]){
        const a=stem(t+(side+1)*.006);
        const width=Math.sin(Math.PI*(t*.88+.07))*.22;
        const droop=width*(.56+.24*Math.sin(i*4.3));
        const n=points.length/3;
        points.push(...a,a[0]+.016,a[1]+.025,side*width*.45,
          a[0]+.039,a[1]+.032,side*width*.46,a[0]+.062,a[1]+.012,side*width*.44,
          a[0]+.093+.04*t,a[1]-droop,side*width);
        indices.push(n,n+1,n+2,n,n+2,n+3,n+1,n+4,n+2,n+2,n+4,n+3);
      }
      const a=stem(Math.max(0,t-.036)),b=stem(t+.007);
      const n=points.length/3;
      points.push(a[0],a[1],-.007,b[0],b[1],-.006,b[0],b[1],.006,a[0],a[1],.007);
      indices.push(n,n+1,n+2,n,n+2,n+3);
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }
  const fronds=[frondShape(.35),frondShape(.63)];
  function palm(x,z,h,size,base,parent) {
    const lean=(random()-.5)*1.24;
    for(let i=0;i<18;i++){
      const a=i/18,b=(i+1)/18,rad=.23-.095*a+.045*Math.exp(-a*16);
      beam(parent,cylinder,[x+lean*a*a,base+h*a,z],[x+lean*b*b,base+h*b,z],rad,rad,
        i<16?mat.barkPalm:crownShaft);
      if(i<16)part(parent,cylinder,ringWood,[rad+.009,.032,rad+.009],[x+lean*a*a,base+h*a+.034,z],[0,0,.035*Math.sin(i)]);
    }
    const start=6.28*random();
    for(let i=0;i<18;i++){
      const angle=start+i*2.39996;
      const tier=i%3,s=size*(1-.14*tier)*(.88+random()*.14);
      part(parent,fronds[i%2],palmLeaf[i%4],[s,s,s],[x+lean,h+base+.10*tier-.16,z],[0,angle,-.18+tier*.39,'YXZ']);
    }
  }

  const grove=group('Arbolado exterior y jardines');
  const landscape=[
    [132,153,7,5],[153,145,7,4],[188,145,6,4],[236,140,6.5,5],[264,135,7,6],
    [316,168,8,6],[337,176,8,6],[354,197,7,5],[288,198,7,4],
    [324,287,5,3],[358,286,7,4],[365,261,7,4],
    [108,185,7,4],[110,206,7,5],[138,241,7,5],[150,256,8,5],[175,276,6,5],
    [191,285,7.5,6],[212,288,6,5],[232,302,6,5],[252,314,6,4],[221,338,8,7],
    [242,352,6.9,5],[256,372,6.5,5],[280,367,6,4],[303,368,6,5],[322,370,7,5],
    [92,145,6,4],[63,137,5,4],[139,130,5,4],[156,118,4.0,3],[224,118,7,5],
    [239,105,8,6],[261,126,6,4],[402,287,7,5],[467,250,8,5],[473,283,6,4],
    [454,335,6,4],[429,419,5.7,5],[283,393,5,4],[264,405,5,4]
  ];
  for(const [u,v,h,s] of landscape) {
    const [x,,z]=sitePoint([u,v]);
    tree(x,z,h,s,0,grove);
  }
  const plazaPalms=group('Palmeras de las galerías');
  for(const [x,z,h,s] of [[-1.45,-22.8,8.0,3],[2.55,-22.7,9.2,3.8],[6.35,-22.8,8.5,3.35]]) {
    palm(x,z,h,s,0,plazaPalms);
  }
  for(const side of [-1,1]){
    for(let i=0;i<14;i++) shrubs(side*3.70,30.8-i*2.92,.66+random()*.20,0,walks);
  }
  function lamppost(x,z,surface,twin=false){
    part(props,cylinder,mat.structure,[.16,.18,.16],[x,.09,z]);
    part(props,cylinder,surface,[.06,3.65,.06],[x,1.825,z]);
    for(const side of twin?[-1,1]:[1]){
      beam(props,cube,[x,3.49,z],[x+side*.59,3.73,z],.068,.068,surface);
      box(props,[.29,.10,.16],[x+side*.65,3.74,z],surface);
      box(props,[.24,.04,.13],[x+side*.65,3.679,z],mat.ivory,{shadow:false});
    }
  }
  for(const [x,z] of [[-14,30],[14,29],[-23,1.5],[-24,13.85],[31,-.5],[33,24]]) lamppost(x,z,mat.pine);
  lamppost(29,-.35,mat.red,true);
  lamppost(35,-4.5,mat.red,true);

  const sign=buildMonument(sceneKit,mat);

  const garments=[0x5c796e,0xb26b55,0xe2dac5,0x6d7b9a,0x986d65].map(hex=>material('Ropa de figura de escala',hex));
  const skin=material('Figuras · piel',0xa36e50);
  const pants=material('Figuras · pantalón',0x414c55);
  const hair=material('Figuras · pelo',0x473b32);
  function person(x,z,color,side,parent=props){
    const y=1.71;
    part(parent,sphere,skin,[.102,.122,.10],[x,y-.125,z]);
    part(parent,sphere,hair,[.103,.075,.102],[x,y-.061,z-.017]);
    part(parent,sphere,garments[color],[.203,.293,.115],[x,1.19,z]);
    for(const s of [-1,1]){
      beam(parent,cylinder,[x+s*.088,1.06,z],[x+s*.112,.105,z+s*side*.12],.069,.070,pants);
      part(parent,sphere,hair,[.078,.052,.12],[x+s*.112,.07,z+s*side*.12+.054]);
      beam(parent,cylinder,[x+s*.172,1.36,z],[x+s*.235,1.03,z-s*side*.07],.054,.061,garments[color]);
      part(parent,sphere,skin,[.053,.183,.055],[x+s*.234,.968,z-s*side*.07]);
    }
  }
  for(const [i,[x,z]] of [[-.8,22.8],[.65,19.6],[5.2,7.3],[-6.5,-3.4],[-11.4,-18.9],[-23,3.8],[-23,13.6],[23.3,3.1],[31,-2],[1.5,35.2]].entries()) person(x,z,i%5,i%2?1:-1);

  fitGroup(annex,[27,36.3],[399,401],.86,.64,.83);
  const {round,large,blockH}=buildSite(sceneKit,mat,brickBlock,brickUV,tree,annex,person,palm);
  const blockP=buildBlockP(sceneKit,mat,texture,brickUV,palm);
  fitGroup(blockP,[0,0],blockPCenter,blockPBearing);
  buildCafe(sceneKit,mat,texture,brickUV);
  const cafeA=buildBlockACafe(sceneKit,mat,texture);
  fitGroup(cafeA,[0,0],cafeACenter,cafeABearing);
  fitGroup(west,[-35,-23.7],[186,179],.075,1.43,1.57);
  fitGroup(westPatio,[-38.5,12.25],[219,229],.08,1.68,1.60);
  const frontA=buildBlockAFront(sceneKit,mat,texture,tree,palm,leafSpray,westPatio,
    {x:rearBlock.x+rearBlock.w/2,z:rearBlock.z+opening.center});
  fitGroup(westPatioRight,[0,0],westCourtCenter,westCourtBearing);
  fitGroup(westCourt,[0,0],westCourtCenter,westCourtBearing);
  for(const item of [central,crown,service,plazaPalms]) fitGroup(item,[-10,-25.7],[259,193],.09,1.62,1.62);
  fitGroup(walks,[0,12.3],[347,334],.85,.65,1.21);
  fitGroup(sign,[0,0],monumentCenter,monumentBearing);
  fitGroup(props,[0,12.3],[303,271],.47,.82,1.08);

  const passages=makePassages(sceneKit,texture);
  const admin=academicEntry(sceneKit,passages.materials,texture,round);
  passages.install(round,'Académico-administrativo',{x:-1.95,z:entryZ-3.12,y:.23,depth:15.4,height:3.32});
  passages.install(blockH,'Bloque H',{x:11.05,z:11.81,y:.154,depth:18.4,floors:5,rise:3.8});
  passages.install(west,'Ala occidental',{x:-34.4,z:-15.1,opening:2.7*west.scale.x,depth:18.9,floors:4});
  passages.install(westPatioRight,'Ala derecha del patio',{x:22,z:16.55,opening:2.8,depth:18.0,floors:4});
  passages.install(large,'Edificio del extremo sur',{z:-29,reverse:true,opening:2.95,depth:23.6,floors:2,rise:4.08});
  passages.install(annex,'Pabellón del acceso',{x:pavilionDoor.x,z:30.60,reverse:true,depth:7.85,width:4.60,
    floors:2,rise:3.65,y:.071,height:2.95});
  passages.install(service,'Ala de las galerías',{x:14,z:-30.4,opening:2.45*service.scale.x,depth:15.2,floors:3,rise:3.65});
  finish();
  passages.furnish(blockP.getObjectByName('Banca metálica de 3 plazas'));
  addRightACPlatform(westCourt);
  alignPaving(root,mat.pavement);
  return {root,blockI,frontA,admin,halls:passages.halls};
}





