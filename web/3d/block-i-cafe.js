import * as THREE from './three.module.js';
import {fitGroup} from './site.js';

export const cafeCenter=[329,191];
export const cafeBearing=-.10;
const floor=.10;
const muralImage=new Image();
muralImage.src=new URL('./media/mural-i.png', import.meta.url).href;
await muralImage.decode();

function patioSurface(kit,yard,mat){
  // Extend the tiled apron right up to the angled approach from Block I.
  const outline=[[-11,-3.5],[-9,-8.2],[-7,-8.65],[-1,-9.65],[3.8,-6.34],[11,-6.14],
    [11,8.09],[8,8.52],[0,9.74],[-5,10.44],[-11,10.38]];
  const shape=new THREE.Shape(outline.map(([x,z])=>new THREE.Vector2(x,-z)));
  const geo=new THREE.ShapeGeometry(shape);geo.rotateX(-Math.PI/2);
  kit.mesh(yard,'Pavimento hasta el corredor del bloque',geo,mat.pavement,[0,floor,0]);
}

function muralCorner(kit,yard,texture,mat){
  const x=-7.02,z=-8.98,radius=1.57;
  // The small portrait is sampled from the last part of the pan.
  const painted=texture('Mural junto a la cafetería I',512,256,(c,w,h,random)=>{
    c.fillStyle='#ad735c';c.fillRect(0,0,w,h);
    for(let i=0;i<w;i+=5){
      c.fillStyle=random()<.48?'#96664f':'#a06750';c.fillRect(i,0,1.6,h);
      c.fillStyle='#ba8367';c.fillRect(i+2,0,1,h);
    }
    c.drawImage(muralImage,177,88,106,136);
  },9);
  const finish=new THREE.MeshStandardMaterial({name:'Ladrillo estriado con mural',map:painted,roughness:.97});
  // The return overlaps the existing gallery wall at its back edge.
  const arc=new THREE.CylinderGeometry(radius,radius,2.78,36,1,true,-Math.PI/2,Math.PI);
  kit.mesh(yard,'Esquina curva pintada',arc,finish,[x,1.53,z]);
  const cap=new THREE.CylinderGeometry(radius+.025,radius+.025,.085,36);
  kit.mesh(yard,'Remate del muro curvo',cap,mat.skirting,[x,2.96,z]);
  for(const [width,depth,y] of [[1.44,1.34,.14],[1.44,.94,.22],[1.44,.55,.30]]){
    kit.box(yard,[width,.08,depth],[x-1.46,y,z+.89-(1.34-depth)*.50],mat.structure);
  }
}

// A leafy twig with transparent gaps. Many tilted copies catch light on both sides.
function paintSpray(c,w,h,random){
  c.lineCap='round';
  function stem(x,y,len,angle,depth){
    const tipX=x+Math.cos(angle)*len,tipY=y+Math.sin(angle)*len;
    c.strokeStyle=depth?'#615a35':'#576537';
    c.lineWidth=depth?2.8:1.25;
    c.beginPath();c.moveTo(x,y);c.lineTo(tipX,tipY);c.stroke();
    const colors=['#54733d','#708c41','#90a653','#5a8044','#81984d','#4e743d'];
    for(let i=1;i<=6;i++){
      const t=i/7,side=i%2?1:-1;
      const px=x+(tipX-x)*t,py=y+(tipY-y)*t;
      const a=angle+side*(.48+.51*random());
      if(depth){stem(px,py,len*(.26+.21*Math.sin(t*Math.PI)),a,depth-1);continue;}
      c.save();c.translate(px,py);c.rotate(a);
      const leaf=len*(.33+.13*random());
      c.fillStyle=colors[Math.floor(random()*colors.length)];
      c.beginPath();c.moveTo(0,0);
      c.bezierCurveTo(leaf*.25,-leaf*.22,leaf*.72,-leaf*.18,leaf,0);
      c.bezierCurveTo(leaf*.61,leaf*.22,leaf*.25,leaf*.21,0,0);c.fill();
      c.strokeStyle='#bdc98380';c.lineWidth=.75;c.beginPath();c.moveTo(1,0);c.lineTo(leaf*.83,0);c.stroke();
      c.restore();
    }
  }
  for(const a of [-2.40,-1.96,-1.54,-1.13,-.75]) stem(w*.49,h*.89,h*(.55+.12*random()),a,1);
}

function plantTrees(kit,trees,mat,texture){
  const {mesh,part,box}=kit;
  const map=texture('Cafetería I · hojas compuestas',256,256,paintSpray);
  const foliage=new THREE.MeshStandardMaterial({name:'Hojas caladas de la cafetería',map,
    color:0xf7ffda,alphaTest:.36,side:THREE.DoubleSide,roughness:.9});
  const spray=new THREE.PlaneGeometry(1,1);
  const bark=new THREE.MeshStandardMaterial({name:'Corteza de los árboles del patio I',vertexColors:true,roughness:1});
  const pos=[],colors=[],idx=[];
  let seed=34991;
  const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  function limb(points,radii,tone){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const steps=(points.length-1)*3,sides=9,frames=curve.computeFrenetFrames(steps,false);
    const first=pos.length/3,color=new THREE.Color(tone);
    for(let i=0;i<=steps;i++){
      const t=i/steps,center=curve.getPointAt(t),k=t*(radii.length-1),lo=Math.floor(k);
      const r=THREE.MathUtils.lerp(radii[lo],radii[Math.min(lo+1,radii.length-1)],k-lo);
      for(let j=0;j<sides;j++){
        const a=j*2*Math.PI/sides,rr=r*(1+.07*Math.cos(3*a+.4*i/steps));
        const p=center.clone().addScaledVector(frames.normals[i],rr*Math.cos(a)).addScaledVector(frames.binormals[i],rr*Math.sin(a));
        pos.push(p.x,p.y,p.z);
        const f=.74+.24*(.5+.5*Math.sin(j*7.16+.3*i/steps));
        colors.push(color.r*f,color.g*f,color.b*f);
        if(i<steps){
          const n=first+i*sides+j,m=first+i*sides+(j+1)%sides;
          idx.push(n,m,n+sides,m,m+sides,n+sides);
        }
      }
    }
  }
  function tree(x,z,height,reach,radius,angle,smooth){
    const at=(dx,y,dz)=>[x+dx,y+floor,z+dz];
    const soilWidth=smooth?1.32:2.02;
    box(trees,[soilWidth,.022,soilWidth],[x,floor+.008,z],mat.dirt);
    const tone=smooth?0xb9a58b:0x927e66;
    const mid=at(.22,height*.29,-.20),fork=at(-.18,height*.45,.13);
    limb([at(0,-.02,0),at(.12,height*.12,-.05),mid,fork],[radius*1.36,radius*.93,radius*.80,radius*.60],tone);
    for(let k=0;k<(smooth?5:12);k++){
      const a=angle+k*2.40,len=(.54+rand()*.51)*(smooth?.72:1.37);
      const dx=Math.cos(a),dz=Math.sin(a);
      limb([at(dx*len,.009,dz*len),at(dx*len*.56,.13,dz*len*.55),
        at(dx*radius*.67+.12,.52,dz*radius*.65),at(.16,radius*(smooth?2.1:4.2),-.12)],
        [.021,radius*.26,radius*.27,.055],tone);
    }
    if(radius>.55){
      // Thick fused stems and a long, low bough are visible below the canopy in the video.
      for(let j=0;j<7;j++){
        const a=j*2*Math.PI/7;
        limb([at(.98*Math.cos(a),.02,.98*Math.sin(a)),
          at(.52*Math.cos(a),.69,.56*Math.sin(a)),
          at(.19+.43*Math.cos(a+.40),2.05,-.12+.42*Math.sin(a+.40)),
          at(.20+.27*Math.cos(a+.78),3.35,-.13+.27*Math.sin(a+.78))],
          [.070,.17,.13,.056],j%3?0x968169:0xaa9071);
      }
      limb([at(-.03,2.91,.08),at(-.74,3.67,.41),at(-2.48,4.04,1.18),
        at(-3.73,4.35,1.91),at(-4.30,5.23,2.17)],[.34,.31,.22,.13,.052],tone);
      for(let j=0;j<9;j++){
        const a=j*2.4;
        part(trees,spray,foliage,[1.92,1.55,1],at(-4.30+.55*Math.cos(a),5.28+.24*Math.sin(a),2.17+.6*Math.sin(a)),
          [-.90,a,.37*j]);
      }
    }
    for(let k=0;k<12;k++){
      const a=k*2.39996+angle+.19*rand(),r=reach*(.59+.40*rand());
      const fraction=.60+.22*rand();
      const elbow=at(Math.cos(a)*r*.43,height*(fraction-.09),Math.sin(a)*r*.43);
      const knuckle=at(Math.cos(a+.24)*r*.78,height*fraction,Math.sin(a+.24)*r*.78);
      const start=k%3===0?mid:fork;
      limb([start,elbow,knuckle],[radius*(k%3===0?.50:.39),radius*.25,.11],tone);
      for(let j=0;j<3;j++){
        const b=a+(j-1)*.55,dy=height*(.13+.15*rand());
        const end=[knuckle[0]+Math.cos(b)*r*.36,knuckle[1]+dy,knuckle[2]+Math.sin(b)*r*.36];
        limb([knuckle,[(end[0]+knuckle[0])*.5,knuckle[1]+dy*.34,(end[2]+knuckle[2])*.5],end],
          [.115,.063,.018],tone);
        for(let n=0;n<14;n++){
          const theta=rand()*Math.PI*2,spread=Math.sqrt(rand())*reach*.36;
          const size=1.55+rand()*1.18;
          part(trees,spray,foliage,[size,size*(.79+.22*rand()),1],
            [end[0]+Math.cos(theta)*spread,end[1]+(.60-rand())*1.25,end[2]+Math.sin(theta)*spread],
            [-.50-rand()*1.12,theta,rand()*2.45]);
        }
      }
    }
  }
  tree(2.65,-2.35,9.8,5.1,.63,.23,false);
  tree(-5.9,.30,8.5,4.0,.48,1.18,false);
  tree(-8.75,3.85,8.1,3.2,.32,2.31,true);
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(idx);g.computeVertexNormals();
  mesh(trees,'Troncos, ramas curvas y raíces tabulares',g,bark);
}

export function buildCafe(kit,mat,texture,brickUV){
  const {group,box,part,beam,cube}=kit;
  const cafe=group('Cafetería junto al Bloque I');
  fitGroup(cafe,[0,0],cafeCenter,cafeBearing);
  function section(name){
    const item=group('Cafetería I · '+name);cafe.add(item);return item;
  }
  const yard=section('Patio en retícula'),trees=section('Arbolado de sombra');
  const kiosk=section('Quiosco y ventanilla'),goods=section('Estantes y canastas');
  const furniture=section('Mesas y bancos'),students=section('Estudiantes sentados');
  const coat=(name,color,extra={})=>new THREE.MeshStandardMaterial({name:'Cafetería I · '+name,color,roughness:.83,...extra});
  const stone=coat('piedra moteada',0xc1b7a0);
  const steel=coat('tubo gris grafito',0x3b4341,{metalness:.36,roughness:.55});
  const enamel=coat('quiosco verde',0x46694e),cream=coat('filete marfil',0xe2dfca);
  const terracotta=coat('ladrillo de borde',0x99574a);
  const chestnut=coat('laminado oscuro',0x71513f), iron=coat('silla de hierro',0x424746);
  const sage=coat('silla de plástico gris verdoso',0xa6b3a3);
  const red=coat('canastas rojas',0xae3430);
  const bottleColors=[0xb58242,0x929246,0x426f58].map((c,i)=>coat('botella '+(i+1),c));
  const cylinder=new THREE.CylinderGeometry(1,1,1,14);
  const taper=new THREE.CylinderGeometry(.74,1,1,12);
  const sphere=new THREE.SphereGeometry(1,12,9);
  const legs=(g,a,b,r,surface)=>beam(g,cylinder,a,b,r,r,surface);
  const plank=(g,x,y,z,w,h,d,m)=>box(g,[w,h,d],[x,y,z],m);

  patioSurface(kit,yard,mat);
  muralCorner(kit,yard,texture,mat);
  // The low planted border and the benches run along the edge rather than across the entrance.
  box(yard,[1.11,.24,5.30],[-10.37,.18,.80],mat.dirt);
  for(const x of [-10.93,-9.81]) box(yard,[.14,.41,5.52],[x,.25,.80],terracotta);
  for(const z of [-1.89,3.49]) box(yard,[1.23,.41,.14],[-10.37,.25,z],terracotta);
  for(const x of [-10.93,-9.81]) box(yard,[.18,.07,5.58],[x,.49,.80],mat.rails);
  for(const z of [-1.89,3.49]) box(yard,[1.28,.07,.18],[-10.37,.49,z],mat.rails);
  for(let i=0;i<12;i++){
    const x=-10.38+.21*Math.sin(i*4.3),z=-1.55+i*.42;
    for(let j=0;j<5;j++){
      const a=j*1.256+i;
      legs(yard,[x,.30,z],[x+.16*Math.cos(a),.52+.11*Math.sin(j+1),z+.16*Math.sin(a)],.025,mat.lip);
    }
  }
  plantTrees(kit,trees,mat,texture);

  // Open serving hatch on the patio side, with a return counter to its left.
  kiosk.position.set(7.36,0,-3.72);kiosk.add(goods);
  plank(kiosk,0,.16,0,5.74,.12,3.55,mat.structure);
  plank(kiosk,0,1.49,-1.54,5.4,2.64,.16,mat.dark);
  plank(kiosk,2.64,1.46,.04,.15,2.58,3.24,enamel);
  plank(kiosk,-2.64,.64,.04,.15,.96,3.24,enamel);
  plank(kiosk,0,.66,1.50,5.4,.98,.18,enamel);
  for(const x of [-2.60,-.39,2.61]) plank(kiosk,x,1.86,1.50,.12,1.52,.16,enamel);
  plank(kiosk,0,2.54,1.50,5.42,.29,.20,enamel);
  plank(kiosk,0,1.16,1.57,5.58,.083,.43,cream);
  plank(kiosk,-2.65,1.16,0,.37,.083,3.37,cream);
  for(const z of [-1.49,.02,1.49]) plank(kiosk,-2.64,1.88,z,.12,1.42,.10,mat.pine);
  box(kiosk,[6.22,.15,4.29],[0,2.77,0],mat.roof,{repeat:[2.1,2.1],rotate:[.063,0,0]});
  plank(kiosk,0,2.63,2.13,6.22,.155,.085,mat.pine);
  plank(kiosk,0,2.61,2.18,6.22,.042,.036,cream);
  plank(kiosk,-2.31,1.80,1.51,.49,1.34,.18,enamel);
  plank(kiosk,-2.31,1.85,1.612,.28,.39,.012,cream);
  for(let i=0;i<4;i++)plank(kiosk,-2.32,1.94-i*.065,1.621,i===0?.18:.14,.012,.006,mat.frame);
  for(const x of [-1.98,1.69]){
    legs(kiosk,[x,2.24,1.48],[x,2.58,2.02],.035,mat.frame);
  }
  plank(goods,.37,.66,-1.19,4.34,.94,.51,mat.ivory);
  for(const y of [1.14,1.68,2.16]) plank(goods,.37,y,-1.17,4.37,.055,.53,cream);
  function bottles(x,y,z,count){
    for(let i=0;i<count;i++){
      const px=x+i*.154,m=bottleColors[Math.floor(i/3)%3];
      const h=.16+.038*((i+Math.floor(x+3))%3);
      part(goods,cylinder,m,[.052,h,.052],[px,y+h/2,z]);
      part(goods,taper,m,[.052,.050,.052],[px,y+h+.025,z]);
      part(goods,cylinder,m,[.023,.045,.023],[px,y+h+.070,z]);
      part(goods,cylinder,cream,[.024,.017,.024],[px,y+h+.097,z]);
      if(i%4!==1)part(goods,cylinder,cream,[.053,.054,.053],[px,y+h*.55,z]);
    }
  }
  for(const h of [1.17,1.71]){
    bottles(-1.52,h,-1.06,9);bottles(.64,h,-1.06,10);
  }
  for(let j=0;j<3;j++)for(let i=0;i<2;i++){
    const x=-.02+i*.16,y=1.76+j*.10;
    plank(goods,x,y,-1.02,.14,.09,.16,j%2?terracotta:mat.rails);
  }
  // Open slats keep the stacks readable even when seen in silhouette.
  function crate(x,z,tiers){
    for(let k=0;k<tiers;k++){
      const y=.13+k*.27;
      plank(goods,x,y+.026,z,.59,.042,.42,red);
      for(const dx of [-.27,.27]) for(const dz of [-.19,.19])
        plank(goods,x+dx,y+.14,z+dz,.051,.26,.049,red);
      for(const dy of [.085,.174,.252]){
        for(const dz of [-.19,.19]) plank(goods,x,y+dy,z+dz,.585,.038,.045,red);
        for(const dx of [-.27,.27]) plank(goods,x+dx,y+dy,z,.047,.038,.41,red);
      }
    }
    bottles(x-.21,.17+(tiers-1)*.27,z,4);
  }
  crate(-3.31,.96,4);crate(-3.40,.38,3);crate(-3.11,-.25,2);
  plank(goods,1.56,1.22,1.59,.74,.05,.28,mat.frame);
  for(const x of [1.23,1.89]) plank(goods,x,1.40,1.59,.023,.33,.26,cream);
  plank(goods,1.56,1.58,1.59,.73,.031,.28,cream);
  for(let i=0;i<4;i++)part(goods,sphere,bottleColors[0],[.083,.045,.067],[1.31+i*.16,1.30,1.59]);

  function pose(x,z,yaw){
    const c=Math.cos(yaw),s=Math.sin(yaw);
    return (u,y,v)=>[x+c*u+s*v,floor+y,z-s*u+c*v];
  }
  function stoneSet(x,z,yaw){
    const p=pose(x,z,yaw),rot={rotate:[0,yaw,0]};
    function slab(zOffset,top,width,depth){
      box(furniture,[width,.095,depth],p(0,top-.0475,zOffset),stone,rot);
      for(const u of [-width*.31,width*.31]){
        box(furniture,[.31,.06,depth*.8],p(u,.03,zOffset),stone,rot);
        box(furniture,[.21,top-.155,depth*.61],p(u,(top-.095+.06)/2,zOffset),stone,rot);
      }
    }
    slab(0,.77,1.50,.81);slab(-.72,.44,1.48,.37);slab(.72,.44,1.48,.37);
  }
  const skins=[0xb97d59,0x9c694c,0xcb926d].map((c,i)=>coat('figura · piel '+i,c));
  const shirts=[0xb5443b,0x36596b,0xe0d5b9,0x535650].map((c,i)=>coat('figura · camisa '+i,c));
  const trousers=coat('figura · mezclilla',0x485565),hair=coat('figura · cabello',0x35312d);
  function sitter(p,yaw,index){
    const skin=skins[index%skins.length],shirt=shirts[index%shirts.length];
    part(students,sphere,shirt,[.192,.25,.123],p(0,.71,.0),[.12,yaw,0]);
    part(students,sphere,skin,[.102,.133,.103],p(0,1.065,-.052),[0,yaw,0]);
    part(students,sphere,hair,[.107,.083,.104],p(0,1.135,-.040),[0,yaw,0]);
    if(index%3===0)part(students,sphere,hair,[.086,.15,.06],p(0,1.02,.029),[0,yaw,0]);
    for(const s of [-1,1]){
      legs(students,p(s*.082,.48,.013),p(s*.104,.45,-.29),.077,trousers);
      legs(students,p(s*.104,.45,-.29),p(s*.125,.085,-.25),.054,trousers);
      part(students,sphere,steel,[.068,.046,.123],p(s*.125,.052,-.30),[0,yaw,0]);
      const elbow=p(s*.223,.70,-.13);
      legs(students,p(s*.151,.86,-.012),elbow,.061,shirt);
      legs(students,elbow,p(s*.142,.77,-.33),.041,skin);
      part(students,sphere,skin,[.046,.031,.060],p(s*.14,.78,-.33),[0,yaw,0]);
    }
  }
  function chair(x,z,yaw,plastic,seated){
    const p=pose(x,z,yaw),surface=plastic?sage:iron;
    box(furniture,[.43,.05,.42],p(0,.435,0),surface,{rotate:[0,yaw,0]});
    for(const u of [-.17,.17])for(const v of [-.16,.16])
      legs(furniture,p(u*1.20,.018,v*1.16),p(u,.425,v),plastic?.023:.016,surface);
    for(const u of [-.19,.19])legs(furniture,p(u,.44,.174),p(u,.84,.231),.024,surface);
    for(const y of [.64,.73,.815]){
      box(furniture,[.395,plastic?.050:.032,.030],p(0,y,.213),surface,{rotate:[0,yaw,0]});
    }
    if(seated!=null)sitter(p,yaw,seated);
  }
  function cafeTable(x,z,yaw,chairs){
    const p=pose(x,z,yaw);
    box(furniture,[.95,.049,.83],p(0,.75,0),chestnut,{rotate:[0,yaw,0]});
    for(const u of [-.40,.40])for(const v of [-.34,.34])
      legs(furniture,p(u,.016,v),p(u,.726,v),.021,steel);
    for(const [a,plastic,person] of chairs){
      const sit=p(.69*Math.sin(a),0,.69*Math.cos(a));
      chair(sit[0],sit[2],yaw+a,plastic,person);
    }
  }
  stoneSet(-5.68,3.77,-.06);stoneSet(.35,3.93,.04);stoneSet(5.1,4.55,-.16);
  stoneSet(-4.18,-2.47,.09);
  cafeTable(.12,.41,.12,[[0,false,1],[2.86,false,2],[-1.6,false,null]]);
  cafeTable(8.10,1.90,-.17,[[0,false,0],[2.91,false,3],[-1.42,true,null]]);
  cafeTable(-.65,-4.27,-.20,[[.13,true,null],[2.94,false,1],[-1.46,false,null]]);
  cafeTable(-8.10,-3.64,.11,[[.15,false,2],[3.14,false,0]]);
  chair(1.52,3.63,-1.25,true,null);chair(6.19,3.74,-.75,true,null);

  function lamp(x,z,yaw){
    const p=pose(x,z,yaw);
    box(yard,[.26,.10,.27],p(0,.05,0),mat.structure);
    legs(yard,p(0,.10,0),p(0,3.16,0),.052,steel);
    const slope=.21;
    const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(0,yaw,0))
      .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),slope));
    part(yard,cube,steel,[.31,.075,.97],p(0,3.18,.14),q);
    part(yard,cube,cream,[.26,.018,.79],p(0,3.13,.14),q);
  }
  lamp(-2.88,2.28,-.35);lamp(4.47,.6,.73);lamp(-7.31,-1.58,.35);
  const benchPose=pose(-8.80,1.14,Math.PI/2+.13);
  for(let i=0;i<5;i++){
    const z=-.18+i*.084;
    legs(yard,benchPose(-.84,.445,z),benchPose(.84,.445,z),.028,steel);
  }
  for(const u of [-.64,.64]){
    legs(yard,benchPose(u,.02,-.20),benchPose(u,.43,-.13),.037,steel);
    legs(yard,benchPose(u,.02,.20),benchPose(u,.43,.13),.037,steel);
    legs(yard,benchPose(u,.425,-.20),benchPose(u,.425,.20),.034,steel);
  }
  return cafe;
}
