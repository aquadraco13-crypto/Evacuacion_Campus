import * as THREE from './three.module.js';
import {stairP,wellSlab,furnishStair} from './block-p-stairs.js';

export const blockPCenter=[425,247];
export const blockPBearing=-1.48;
export const blockPFloors=5;
export const blockPRise=stairP.rise;
const rise=blockPRise;
const art=new Image();
art.src=new URL('./media/arte.jpg', import.meta.url).href;
await art.decode();

function waitingSeat(){
  // One continuous bent sheet, from the front lip up to the top of the backrest.
  const profile=[[-.26,.425],[-.26,.45],[-.23,.466],[-.10,.445],[.09,.423],
    [.16,.45],[.187,.51],[.201,.62],[.244,.80],[.269,.897],[.265,.925]];
  const positions=[],uv=[],indices=[];
  for(let i=0;i<profile.length;i++){
    const [z,y]=profile[i],half=i===0||i===profile.length-1?.219:.237;
    for(const x of [-half,half]){positions.push(x,y,z);uv.push(x<0?0:7,i*.98);}
    if(i){const n=2*i;indices.push(n-2,n-1,n,n,n-1,n+1);}
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
  return g;
}

export function buildBlockP(kit,mat,texture,brickUV,palm){
  const {group,part,box,beam,cube,mesh}=kit;
  const block=group('Bloque P');
  block.userData={floors:blockPFloors,reference:'Dos videos y una foto. Cinco niveles estimados; interiores de aula y huella esquemáticos.'};
  function child(name,parent=block){const g=group(name);parent.add(g);return g;}
  const level=Array.from({length:blockPFloors},(_,i)=>{
    const g=child('Bloque P · Piso '+(i+1));g.position.y=i*rise;return g;
  });
  const coat=(name,color,options={})=>new THREE.MeshStandardMaterial({name:'Bloque P · '+name,color,roughness:.81,...options});
  const wall=coat('estuco cálido',0xe9e3d1),trim=coat('carpintería de aluminio',0xb1aea3,{metalness:.45,roughness:.42});
  const soffit=coat('cielo raso marfil',0xf4f1e5,{emissive:0xb5b3ac,emissiveIntensity:.24});
  const navy=coat('puerta azul petróleo',0x294654),anthracite=coat('perfilería oscura',0x444c4d);
  const chrome=coat('bastidores cromados',0xb4bab6,{metalness:.57,roughness:.32});
  const innerGlass=coat('vidrio claro',0xb2cecd,{transparent:true,opacity:.13,depthWrite:false,side:THREE.DoubleSide,roughness:.20});
  const glassMap=texture('Bloque P · reflejos del cielo',256,128,(c,w,h,r)=>{
    const sky=c.createLinearGradient(0,0,w*.25,h);
    sky.addColorStop(0,'#566875');sky.addColorStop(.50,'#788795');sky.addColorStop(1,'#a5a39d');
    c.fillStyle=sky;c.fillRect(0,0,w,h);
    c.fillStyle='#344d4a66';c.beginPath();c.moveTo(0,h);
    for(let x=0;x<=w+4;x+=4)c.lineTo(x,h*.79+9*Math.sin(x*.04)+(r()-.5)*6);
    c.lineTo(w,h);c.fill();
  });
  const panes=[0xb2c0cc,0x8997a9,0x737e83].map((col,i)=>coat('ventanal '+(i+1),col,{map:glassMap,roughness:.33,metalness:.15}));
  const pores=texture('Bloque P · chapa microperforada',64,64,(c,w,h)=>{
    c.fillStyle='#d2d6cd';c.fillRect(0,0,w,h);
    for(let j=-1;j<5;j++)for(let i=-1;i<5;i++){
      const x=i*16+(j%2)*8,y=j*16;
      c.fillStyle='#616b69';c.beginPath();c.arc(x,y,3.2,0,Math.PI*2);c.fill();
    }
  });
  const perforated=coat('asientos perforados',0xabb5b0,{map:pores,side:THREE.DoubleSide,metalness:.27,roughness:.5});
  const light=coat('difusores',0xfff7e2,{emissive:0xffefd0,emissiveIntensity:.48});
  const atlas=texture('Bloque P · murales y señalética',1024,1024,(c,w,h)=>{
    c.drawImage(art,0,0,768,320,0,0,768,320);
    function panel(x,y,width,height,bg){c.fillStyle=bg;c.fillRect(x,y,width,height);}
    function word(t,x,y,size,color,weight=600){
      c.font=weight+' '+size+'px Arial';c.textBaseline='middle';c.textAlign='center';c.fillStyle=color;c.fillText(t,x,y);
    }
    panel(0,338,768,138,'#ded9bd');c.strokeStyle='#655f50';c.lineWidth=5;c.strokeRect(5,343,758,128);
    word('LABORATORIO',384,380,33,'#3d443d');word('PROGRAMA DE MICROBIOLOGÍA',384,430,36,'#39463d');
    panel(0,490,384,120,'#264739');word('BLOQUE  P',192,550,48,'#f4efd9');
    panel(390,490,376,120,'#e9e6d4');word('LABORATORIOS',578,550,33,'#365347');
    panel(0,775,600,84,'#343d36');word('PUNTO ECOLÓGICO',300,817,40,'#f1efdf');
    for(let n=2;n<=5;n++){
      const x=(n-2)*240;panel(x,886,226,90,'#315745');
      word('PISO  '+n,x+113,931,38,'#f6f4de');
    }
    for(const [i,label] of ['Aprovechables','Orgánicos','No aprovechables'].entries()){
      const x=i*250;panel(x,636,240,116,['#e9e7d9','#396957','#383d39'][i]);
      word('↻',x+120,667,42,i?'#efefdf':'#404b45');
      word(label,x+120,715,20,i?'#efefdf':'#404b45');
    }
  });
  const graphics=coat('gráfica documental',0xffffff,{map:atlas});
  function sign(g,name,rect,w,h,x,y,z,yaw=0){
    const geometry=new THREE.PlaneGeometry(w,h),uv=geometry.attributes.uv;
    const [u,v,r,s]=rect;
    for(let k=0;k<uv.count;k++)uv.setXY(k,(u+1+uv.getX(k)*(r-2))/1024,1-(v+1+(1-uv.getY(k))*(s-2))/1024);
    const o=mesh(g,name,geometry,graphics,[x,y,z]);o.rotation.y=yaw;o.castShadow=false;
  }
  const rod=new THREE.CylinderGeometry(1,1,1,12),seat=waitingSeat();
  const pipe=(g,a,b,r,m=chrome)=>beam(g,rod,a,b,r,r,m);
  const B=(g,x,y,z,w,h,d,m,opts)=>box(g,[w,h,d],[x,y,z],m,opts);
  const brick=(g,x,y,z,w,h,d)=>B(g,x,y,z,w,h,d,mat.brick,brickUV);
  const top=blockPFloors*rise;
  const sections=[
    {x:0,z:-8,w:34,d:10},{x:-13.5,z:4,w:7,d:14},{x:13.5,z:4,w:7,d:14}
  ];
  // A wall's local x follows the facade and its +z points outside.
  function facade(g,cx,cz,yaw,length,bays,kind,story,sharedPier=-1){
    const c=Math.cos(yaw),s=Math.sin(yaw),pitch=length/bays,rot=[0,yaw,0];
    function piece(u,y,v,w,h,d,surface){
      const opt=surface===mat.brick?{...brickUV,rotate:rot}:{rotate:rot};
      B(g,cx+c*u+s*v,y,cz-s*u+c*v,w,h,d,surface,opt);
    }
    const arcade=story===0 && kind==='court';
    const waiting=kind==='waiting';
    const sill=arcade?0:waiting?.89:1.04,lintel=arcade?3.04:waiting?3.05:2.62;
    const span=(kind==='end'?.57:waiting?.85:kind==='court'?.78:.71)*pitch, pier=pitch-span;
    if(sill)piece(0,sill/2,-.12,length,sill,.24,mat.brick);
    piece(0,(rise+lintel)/2,-.12,length,rise-lintel,.24,mat.brick);
    for(let i=0;i<=bays;i++){
      const last=i===bays,edge=i===0||last;
      const u=-length/2+i*pitch+(i===0?pier/4:last?-pier/4:0);
      if(!arcade||i!==sharedPier)
        piece(u,(sill+lintel)/2,-.12,edge?pier/2:pier,lintel-sill,.24,mat.brick);
      if(last||arcade)continue;
      const k=-length/2+(i+.5)*pitch,wh=lintel-sill;
      piece(k,sill-.014,-.005,span+.11,.058,.37,trim);
      piece(k,lintel+.005,-.10,span,.065,.21,anthracite);
      if(waiting){
        piece(k,(sill+lintel)/2,-.12,span,wh,.028,innerGlass);
        piece(k,(sill+lintel)/2,-.12,.049,wh,.078,trim);
        continue;
      }
      piece(k,(sill+lintel)/2,-.25,span,.10+wh,.065,anthracite);
      for(const side of [-1,1]){
        piece(k+side*span*.25,(sill+lintel)/2,-.20,span*.50-.055,wh-.085,.036,
          panes[(i+story+(side<0?1:0))%3]);
      }
    }
  }
  const leftSlab=wellSlab(.19),leftSoffit=wellSlab(.065);
  const slabParts=[{x:3.5,z:-8,w:27,d:10},sections[2]];
  for(let i=0;i<blockPFloors;i++){
    const g=level[i];
    for(const r of slabParts){
      B(g,r.x,.04,r.z,r.w,.19,r.d,mat.pavement);
      B(g,r.x,rise-.112,r.z,r.w,.065,r.d,soffit);
    }
    if(i===0)B(g,-13.5,.04,-1,7,.19,24,mat.pavement);
    else mesh(g,'Losa con ojo de escalera',leftSlab,mat.pavement,[0,-.055,0]);
    if(i===blockPFloors-1)B(g,-13.5,rise-.112,-1,7,.065,24,soffit);
    else mesh(g,'Cielo raso con ojo de escalera',leftSoffit,soffit,[0,rise-.1445,0]);
    facade(g,0,-13,Math.PI,34,6,'back',i);
    for(const side of [-1,1]){
      facade(g,side*17,-1,side*Math.PI/2,24,4,'back',i);
      facade(g,side*13.5,11,0,7,1,'end',i);
      facade(g,side*10,4,-side*Math.PI/2,14,3,'court',i,side>0?0:3);
    }
    if(i===0){
      // The ground-floor gallery opens directly onto the patio.
      brick(g,0,3.295,-3.12,20,.51,.24);
      for(const x of [-10,-10/3,10/3,10])B(g,x,1.55,-3.12,.24,3.10,.26,wall);
    }else facade(g,0,-3,0,20,3,'waiting',i);
    // The oblique bay catches the light where the left wing meets the back wall.
    const tri=new THREE.Shape([new THREE.Vector2(-10,3),new THREE.Vector2(-7.6,3),new THREE.Vector2(-10,.6)]);
    const corner=new THREE.ExtrudeGeometry(tri,{depth:.18,bevelEnabled:false});corner.rotateX(-Math.PI/2);
    mesh(g,'Encuentro en chaflán',corner,mat.pavement, [0,-.05,0]);
    if(i===0)B(g,-8.8,3.295,-1.8,Math.sqrt(2)*2.4,.51,.24,mat.brick,{...brickUV,rotate:[0,Math.PI/4,0]});
    else facade(g,-8.8,-1.8,Math.PI/4,Math.sqrt(2)*2.4,1,'court',i);
    if(i>0){
      B(g,-13.5,1.70,6.65,.16,3.20,8.5,wall);
      B(g,13.5,1.70,4,.16,3.20,13.8,wall);
    }
  }
  const roof=child('Bloque P · Azotea');
  for(const r of sections)B(roof,r.x,top+.035,r.z,r.w+.12,.25,r.d+.12,mat.structure);
  const bevel=new THREE.Shape([new THREE.Vector2(-10,3),new THREE.Vector2(-7.6,3),new THREE.Vector2(-10,.6)]);
  const cap=new THREE.ExtrudeGeometry(bevel,{depth:.25,bevelEnabled:false});cap.rotateX(-Math.PI/2);
  mesh(roof,'Cubierta sobre el chaflán',cap,mat.structure,[0,top-.09,0]);
  for(const [x,z,w,d] of [[0,-13,34,.20],[-17,-1,.20,24],[17,-1,.20,24],[-13.5,11,7,.20],
    [13.5,11,7,.20],[-10,4,.20,14],[10,4,.20,14],[0,-3,20,.20]]){
    brick(roof,x,top+.25,z,w,.34,d);
    B(roof,x,top+.435,z,w+.075,.06,d+.075,trim);
  }
  const outside=child('Bloque P · Patio y pórticos');
  B(outside,0,.006,5.9,20,.12,18,mat.pavement,{repeat:[8.2,8.2]});
  for(const side of [-1,1]){
    const center=side<0?6.65:4,depth=side<0?8.5:13.8;
    B(outside,side*13.5,1.76,center,.19,3.30,depth,wall);
    B(outside,side*13.39,.35,center,.047,.43,depth,mat.skirting);
    for(const z of side<0?[5.6]:[-.75,5.6]){
      B(outside,side*13.38,1.27,z,.12,2.33,1.28,navy);
      B(outside,side*13.38,2.71,z,.12,.42,1.28,panes[1]);
    }
  }
  const lampRed=coat('farol rojo',0xa24642,{roughness:.58,metalness:.22});
  function lamp(x,z,pair){
    B(outside,x,.14,z,.35,.19,.34,mat.structure);pipe(outside,[x,.20,z],[x,4.30,z],.064,lampRed);
    for(const s of pair?[-1,1]:[1]){
      pipe(outside,[x,3.92,z],[x+s*.60,4.23,z],.041,lampRed);
      B(outside,x+s*.72,4.26,z,.42,.12,.18,lampRed,{rotate:[0,0,s*.30]});
      B(outside,x+s*.72,4.21,z,.31,.04,.149,light,{rotate:[0,0,s*.30]});
    }
  }
  lamp(-2.65,5.17,true);lamp(5.60,.38,false);
  for(const [x,z,h,r] of [[-7.56,3.56,3.70,1.67],[7.89,5.71,3.05,1.42]]){
    part(outside,rod,mat.structure,[.69,.11,.69],[x,.123,z]);
    part(outside,rod,mat.dirt,[.61,.035,.61],[x,.191,z]);
    palm(x,z,h,r,.20,outside);
  }
  sign(outside,'Pilar pintado del patio',[0,0,192,320],.98,2.32,9.994,1.44,4-14/6,-Math.PI/2);
  sign(outside,'Identificación exterior del bloque',[0,490,384,120],1.65,.52,0,3.24,-2.869);

  const hall=child('Bloque P · Pasillo de laboratorios',level[0]);
  const labs=child('Bloque P · Aulas de laboratorio',level[0]);
  const furniture=child('Bloque P · Sala de espera',hall);
  const pavement=.135;
  // Teaching-room doors are on the interior wall; the opposite side is open.
  const inner=-9.11,outer=-4.42;
  const doors=[-9.21,-2.04,7.34],doorW=1.24;
  let last=-16.80;
  function wallSpan(a,b,z,height=3.37,base=pavement){
    if(b>a)brick(hall,(a+b)/2,base+height/2,z,b-a,height,.205);
  }
  for(const [i,x] of doors.entries()){
    wallSpan(last,x-doorW/2,inner);
    wallSpan(x-doorW/2,x+doorW/2,inner,.52,2.96);
    for(const s of [-1,1])B(hall,x+s*.61,1.52,inner+.052,.073,2.77,.19,anthracite);
    B(hall,x,2.48,inner+.048,1.22,.07,.18,anthracite);
    B(hall,x,2.73,inner+.042,1.14,.43,.048,panes[0]);
    // Offset the leaf of one teaching room, so its furnishings can be seen in the model.
    if(i===1)B(hall,x-.57,1.32,inner-.55,.078,2.34,1.14,navy);
    else {
      B(hall,x,1.31,inner+.05,1.14,2.31,.075,navy);
      for(const y of [.70,1.74])B(hall,x,y,inner+.095,1.05,.018,.013,anthracite);
      B(hall,x+.41,1.15,inner+.13,.16,.035,.055,chrome);
    }
    last=x+doorW/2;
  }
  wallSpan(last,16.8,inner);
  // A continuous central aisle passes through the glazed portal and under the sign.
  const portal=-4.97;
  for(const [z,width] of [[-8.64,.81],[-5.01,.98]]){
    B(hall,portal,1.69,z,.036,2.99,width,innerGlass,{shadow:false});
    for(const side of [-1,1])B(hall,portal,1.68,z+side*width/2,.072,3.05,.047,trim);
    B(hall,portal,.20,z,.066,.080,width,trim);
  }
  B(hall,portal,3.18,-6.77,.095,.095,4.60,trim);
  B(hall,portal,2.84,-6.81,.07,.47,2.45,anthracite);
  sign(hall,'Rótulo de Microbiología',[0,338,768,138],2.40,.425,portal-.044,2.84,-6.81,-Math.PI/2);
  sign(hall,'Aviso del pasillo',[576,0,192,320],.69,1.02,portal-.055,1.84,-8.62,-Math.PI/2);
  // Masonry at the waiting room and a narrow louvered shaft like the one in the photo.
  B(hall,-6.59,1.80,-5.03,.74,3.32,1.01,wall);
  brick(hall,-6.99,1.80,-4.92,.16,3.32,.84);
  B(hall,-6.98,1.76,-5.56,.58,3.13,.055,anthracite);
  for(let i=0;i<29;i++)B(hall,-6.98,.25+i*.103,-5.61,.56,.049,.065,trim,{rotate:[.34,0,0]});
  for(const x of [-14,-9.5,-5,-.5,4,8.5,13]){
    part(hall,rod,trim,[.164,.021,.164],[x,3.39,-6.82]);
    part(hall,rod,light,[.146,.019,.146],[x,3.372,-6.82]);
  }
  for(const x of [-10,-1,8])part(hall,rod,anthracite,[.038,.050,.038],[x,3.361,-6.23]);
  B(hall,0,3.398,-5.37,33,.038,.047,trim);

  function bench(parent,x,z,yaw,count){
    const bank=child('Banca metálica de '+count+' plazas',parent);
    bank.position.set(x,pavement,z);bank.rotation.y=yaw;
    const width=count*.548;
    B(bank,0,.315,0,width-.11,.073,.08,anthracite);
    for(let i=0;i<count;i++){
      const u=(i-(count-1)/2)*.548;
      part(bank,seat,perforated,[1,1,1],[u,0,0]);
      for(const side of [-1,1])pipe(bank,[u+side*.232,.427,-.225],[u+side*.232,.445,.165],.015);
    }
    for(const s of [-1,1]){
      const u=s*(width/2-.17);
      for(const f of [-1,1]){
        pipe(bank,[u,.315,.015],[u+s*.055,.030,f*.25],.027);
        part(bank,rod,anthracite,[.045,.027,.045],[u+s*.055,.014,f*.25]);
      }
      const end=s*(width/2-.013);
      const curve=new THREE.CatmullRomCurve3([[end,.416,-.19],[end,.54,-.24],[end,.623,-.11],
        [end,.635,.13],[end,.59,.192]].map(v=>new THREE.Vector3(...v)));
      mesh(bank,'Apoyabrazos tubular',new THREE.TubeGeometry(curve,12,.020,7,false),chrome);
    }
  }
  bench(furniture,-11.36,-8.74,Math.PI,3);bench(furniture,-6.62,-8.74,Math.PI,3);
  bench(furniture,15.55,-6.75,Math.PI/2,3);
  const bins=[coat('recipiente blanco',0xe9e5d6),coat('recipiente verde',0x386952),coat('recipiente negro',0x3a413d)];
  function recycling(parent,x,z,yaw){
    const station=child('Bloque P · Punto ecológico',parent);
    station.position.set(x,0,z);station.rotation.y=yaw;
    B(station,0,1.10,-.19,1.34,.22,.085,anthracite);
    sign(station,'Rótulo del punto ecológico',[0,775,600,84],1.17,.16,0,1.10,-.142);
    for(const [i,m] of bins.entries()){
      const binX=(i-1)*.43;
      B(station,binX,.52,0,.383,.73,.41,m);
      B(station,binX,.904,0,.408,.062,.435,m);
      B(station,binX,.938,0,.21,.01,.105,anthracite);
      sign(station,'Identificación de recipiente '+(i+1),[i*250,636,240,116],.32,.155,binX,.57,.210);
    }
  }
  recycling(furniture,-7.54,-5.03,-Math.PI/2);
  // Teaching rooms are schematic beyond the portions visible from the photographed gallery.
  for(const x of [-7.61,2.56,11.87])B(labs,x,1.75,-11.06,.155,3.27,3.76,wall);
  for(const x of [-12,-2,7.4,14.3]){
    B(labs,x,.64,-11.45,2.65,.93,.80,mat.ivory);
    B(labs,x,1.13,-11.45,2.78,.078,.88,anthracite);
    for(const s of [-1,1]){
      part(labs,rod,chrome,[.041,.54,.041],[x+s*.64,.41,-10.53]);
      part(labs,rod,anthracite,[.205,.075,.205],[x+s*.64,.715,-10.53]);
      part(labs,rod,chrome,[.235,.043,.235],[x+s*.64,.157,-10.53]);
    }
  }
  B(hall,16.7,1.8,-6.72,.14,3.31,4.58,wall);
  sign(hall,'Collage del vestíbulo',[192,0,384,320],3.86,2.61,16.62,1.97,-6.72,-Math.PI/2);
  for(const x of [1.66,3.22,4.78,6.34]){
    B(hall,x,.57,outer-.23,1.48,.85,.39,mat.ivory);
    for(let j=0;j<3;j++){
      B(hall,x-.47+j*.47,.60,outer-.44,.42,.72,.037,trim);
      B(hall,x-.45+j*.47,.65,outer-.464,.025,.10,.02,anthracite);
    }
  }
  sign(hall,'Placa de laboratorios',[390,490,376,120],.58,.19,-.86,1.83,inner+.112);
  furnishStair(kit,child,level);
  for(let i=1;i<level.length;i++){
    const gallery=child('Bloque P · Vestíbulo del piso '+(i+1),level[i]);
    // The filmed waiting alcove ends at the photographic mural; the passage
    // continues beside it and meets the stair landing on the same level.
    const north=-9.25;
    let edge=-16.85;
    for(const x of [-5.65,6.35,13.34]){
      const jamb=x-.66;
      brick(gallery,(edge+jamb)/2,1.76,north,jamb-edge,3.25,.20);
      brick(gallery,x,3.01,north,1.32,.76,.20);
      B(gallery,x,1.38,north+.012,1.31,2.49,.14,anthracite);
      B(gallery,x,1.34,north+.095,1.17,2.35,.040,navy);
      B(gallery,x,2.46,north+.117,1.10,.15,.014,panes[0]);
      B(gallery,x+.43,1.11,north+.15,.15,.037,.055,chrome);
      B(gallery,x,pavement+.009,north+.46,1.05,.018,.64,anthracite);
      edge=x+.66;
    }
    brick(gallery,(edge+16.85)/2,1.76,north,16.85-edge,3.25,.20);
    const panelX=-9.62,panelZ=-4.92;
    B(gallery,panelX,1.78,panelZ,.16,3.28,3.77,wall);
    sign(gallery,'Mural fotográfico de la sala de espera',[192,0,384,320],
      3.57,2.45,panelX+.083,1.87,panelZ,Math.PI/2);
    bench(gallery,panelX+.42,panelZ,-Math.PI/2,4);
    bench(gallery,-6.76,-8.82,Math.PI,2);
    for(const x of [-5.62,.33,4.83])bench(gallery,x,-3.53,0,4);
    B(gallery,-3.34,1.77,-3.64,1.01,3.27,.98,wall);
    brick(gallery,-3.34,1.77,-4.148,.90,3.25,.058);
    B(gallery,-2.818,1.71,-3.64,.035,2.99,.82,anthracite);
    for(let j=0;j<25;j++)B(gallery,-2.788,.29+j*.115,-3.64,.055,.048,.80,trim,{rotate:[0,0,-.29]});
    sign(gallery,'Número de piso',[(i-1)*240,886,226,90],.40,.16,-3.34,1.79,-4.184,Math.PI);
    recycling(gallery,-1.87,-3.70,Math.PI);
    sign(gallery,'Aviso de pared',[576,0,192,320],.28,.39,-4.61,1.65,north+.104);
    for(const x of [-14,-9.7,-5.4,-1.1,3.2,7.5,11.8,15.4]){
      part(gallery,rod,trim,[.153,.021,.153],[x,3.392,-6.59]);
      part(gallery,rod,light,[.135,.019,.135],[x,3.374,-6.59]);
    }
    for(const x of [-7.4,1.2,9.7])part(gallery,rod,anthracite,[.040,.045,.040],[x,3.373,-6.61]);
    B(gallery,0,3.392,-5.06,32.9,.028,.032,trim);
  }
  return block;
}
