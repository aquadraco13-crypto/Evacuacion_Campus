import * as THREE from './three.module.js';

export const diningCenter=[104,110];
export const diningBearing=.085;

function muralTexture(kind) {
  const canvas=document.createElement('canvas');
  canvas.width=384;
  canvas.height=512;
  const ctx=canvas.getContext('2d');
  const colors={
    comedor:['#272c25','#d7a655','#f0c986','#50574c','#ba7352'],
    retrato:['#c9bd9d','#454440','#e5b67d','#987e67','#98715c'],
    abstracto:['#d7ba89','#70424b','#dba655','#435648','#925941']
  }[kind];
  const [background,dark,skin,accent,shadow]=colors;
  const polygon=(color,points)=>{
    ctx.fillStyle=color;
    ctx.beginPath();
    for(const [i,[x,y]] of points.entries()) i?ctx.lineTo(x,y):ctx.moveTo(x,y);
    ctx.closePath();
    ctx.fill();
  };
  ctx.fillStyle=background;
  ctx.fillRect(0,0,384,512);
  for(let i=0;i<14;i++){
    const a=i*2.4,x=192+220*Math.cos(a),y=285+245*Math.sin(a);
    polygon(i%2?accent:shadow,[[192,285],[x,y],[x+33,y+71]]);
  }
  if(kind==='abstracto'){
    polygon(dark,[[76,445],[102,223],[153,70],[248,40],[305,167],[313,320],[253,423]]);
    polygon(accent,[[86,456],[125,327],[257,162],[298,189],[250,363],[188,473]]);
  }
  polygon('#e1d4ab',[[16,512],[38,448],[114,403],[144,374],[230,372],[264,416],[336,459],[366,512]]);
  polygon(shadow,[[139,338],[235,330],[235,404],[204,434],[151,402]]);
  polygon(skin,[[115,217],[157,168],[222,174],[271,224],[254,341],[217,388],[163,378],[124,324]]);
  polygon(shadow,[[218,183],[270,214],[269,262],[247,302],[239,350],[215,387],[188,387],[230,324],[236,263]]);
  polygon('#302d28',[[107,252],[105,205],[120,163],[168,145],[223,147],[269,170],[286,219],[267,251],[245,210],[202,194],[157,216],[123,268]]);
  polygon('#43372d',[[132,266],[160,253],[181,261],[180,268],[145,271]]);
  polygon('#43372d',[[205,262],[228,254],[250,261],[244,270],[209,270]]);
  polygon(shadow,[[191,268],[183,312],[193,319],[209,313],[199,303]]);
  polygon('#744537',[[164,343],[186,335],[216,338],[224,349],[186,354]]);
  if(kind==='comedor'){
    ctx.textAlign='center';
    ctx.font='bold 36px Georgia';
    ctx.fillStyle='#d49050';
    ctx.fillText('COMEDOR',192,63);
    ctx.fillStyle='#e5cf8e';
    ctx.font='bold 31px Georgia';
    ctx.fillText('UNIVERSITARIO',192,104);
  }
  return canvas;
}

function signTexture() {
  const canvas=document.createElement('canvas');
  canvas.width=512; canvas.height=384;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#dfded0';
  ctx.fillRect(0,0,512,384);
  ctx.fillStyle='#556f66';
  ctx.textAlign='center';
  ctx.font='bold 38px Arial';
  ctx.fillText('GOBIERNO DEL',256,142);
  ctx.font='italic bold 130px Georgia';
  ctx.fillText('Cesar',256,257);
  return canvas;
}

function piercedPanel() {
  const shape=new THREE.Shape();
  shape.moveTo(-.56,-.48); shape.lineTo(.56,-.48); shape.lineTo(.56,.48); shape.lineTo(-.56,.48); shape.closePath();
  for(let row=0;row<3;row++){
    for(let column=0;column<4;column++){
      const x=(column-1.5)*.244,y=(row-1)*.267;
      const sign=(row+column)%2?-1:1;
      const hole=new THREE.Path();
      hole.moveTo(x-.074,y-.073*sign);
      hole.lineTo(x+.073,y);
      hole.lineTo(x-.074,y+.073*sign);
      hole.closePath();
      shape.holes.push(hole);
    }
  }
  return new THREE.ExtrudeGeometry(shape,{depth:.052,bevelEnabled:false});
}

export function buildDiningHall({group,box,mesh,beam,part,cube},mat,tree) {
  const dining=group('Comedor universitario');
  dining.userData={reference:'Fachada y patio según la fotografía. Medidas, murales y distribución del mobiliario aproximados.'};
  function section(name){
    const child=group(name);
    dining.add(child);
    return child;
  }
  const architecture=section('Comedor · Estructura y cubierta');
  const terrace=section('Comedor · Terraza y baranda perforada');
  const furniture=section('Comedor · Mesas y sillas');
  const art=section('Comedor · Murales y letrero');
  const garden=section('Comedor · Césped y árbol frontal');
  const material=(name,color,options={})=>new THREE.MeshStandardMaterial({name:'Comedor · '+name,color,roughness:.74,...options});
  const steel=material('acero gris',0x687a76,{metalness:.22});
  const roof=material('lámina galvanizada',0xb0b7af,{metalness:.24,roughness:.6});
  const white=material('concreto marfil',0xd6d5c7);
  const dark=material('fondo de servicio',0x505a4f);
  const slats=material('celosía metálica',0x81938a);
  const plaster=material('muro verde pálido',0xa0aa84);
  const colored=[0x456e62,0x789746,0xd2a839].map((color,i)=>material('soporte inclinado '+(i+1),color));
  const yellow=material('sillas amarillo lima',0xbbbc36);
  const greenChair=material('sillas verde oliva',0x7b9347);
  const chairLeg=material('patas tubulares',0x6e7965,{metalness:.21});
  const tabletop=material('superficie de mesa',0xd1d3be);
  const curb=material('bordillo amarillo',0xb49a51);
  const lamp=material('luminarias',0xd7dccd,{emissive:0xc3dccb,emissiveIntensity:.20});
  const post=new THREE.CylinderGeometry(1,1,1,12);
  const floorY=.10, deckY=3.86, roofY=8.62;
  const width=31.5;
  const slabUV={repeat:[12,12],shadow:false};

  box(architecture,[32.4,.21,18.3],[0,-.002,.21],mat.structure);
  box(architecture,[32.1,.045,17.9],[0,floorY-.021,.10],mat.pavement,slabUV);
  box(architecture,[32.1,.40,18.05],[0,deckY-.20,.19],white);
  box(terrace,[32.05,.03,17.99],[0,deckY+.015,.19],mat.pavement,slabUV);
  box(architecture,[31.4,3.58,.27],[0,1.90,-8.26],plaster);
  box(architecture,[30.9,3.10,.25],[0,5.44,-8.26],plaster);
  box(architecture,[.28,7.31,11.65],[-15.57,3.75,-2.52],plaster);
  for(const x of [-13.6,-7.5,-1.4,4.7,10.8,14.7]){
    box(architecture,[.27,7.15,.27],[x,3.67,-7.92],steel);
  }
  for(const level of [floorY,deckY]){
    for(const x of [-4.8,2.25,9.24]){
      box(architecture,[5.9,2.12,.084],[x,level+1.73,-7.99],dark);
      box(architecture,[6.04,.14,.14],[x,level+2.80,-7.9],white);
      box(architecture,[6.04,.10,.14],[x,level+.66,-7.9],white);
      for(let i=0;i<27;i++){
        box(architecture,[.048,2.12,.073],[x-2.87+i*.221,level+1.73,-7.9],slats,{shadow:false});
      }
    }
  }

  const roofSlope=.079;
  box(architecture,[33.85,.17,20.5],[0,roofY,.25],roof,{rotate:[-roofSlope,0,0]});
  for(let i=0;i<57;i++){
    box(architecture,[.038,.037,20.44],[-16.52+i*.59,roofY+.097,.25],white,
      {rotate:[-roofSlope,0,0],shadow:false});
  }
  for(const z of [-9.97,10.48]){
    box(architecture,[33.87,.20,.16],[0,roofY+(z-.25)*Math.sin(roofSlope),z],steel);
  }
  for(let i=0;i<8;i++){
    const x=-15.4+i*4.4;
    beam(architecture,cube,[x,roofY-.99,-9.7],[x,roofY+.54,9.7],.17,.24,steel);
    box(architecture,[.22,3.84,.24],[x,deckY+1.74,-5.90],steel);
  }
  for(const z of [-6.1,-2.6,.9,4.4,8.0]){
    const y=roofY-.245+(z-.25)*Math.sin(roofSlope);
    box(architecture,[33.22,.14,.19],[0,y,z],steel);
  }
  for(const z of [-6.7,-3.0,.8,4.5,8.0]){
    box(architecture,[width,.19,.22],[0,deckY-.49,z],steel);
    for(const x of [-10,-4,2,8]){
      box(architecture,[1.08,.043,.13],[x,deckY-.603,z],lamp,{shadow:false});
    }
  }

  for(const [i,x] of [-10.25,-3.85,2.60,9.05].entries()){
    const color=colored[Math.min(i,2)];
    for(const side of [-1,1]){
      const foot=[x+side*1.29,floorY,7.39],joint=[x,deckY-.15,7.39];
      beam(architecture,post,foot,joint,.143,.143,color);
      part(architecture,post,steel,[.20,.07,.20],foot.map((v,i)=>i===1?v+.035:v));
      beam(architecture,post,[x+side*1.05,deckY+.08,7.39],[x,roofY+.32,7.39],.11,.11,color);
    }
  }

  const panels=piercedPanel();
  const rail=material('paneles perforados marfil',0xdadace);
  for(let i=0;i<24;i++){
    const x=-15.33+i*1.31;
    part(terrace,panels,rail,[1,1,1],[x,deckY+.58,9.02]);
    box(terrace,[.045,1.14,.074],[x-.655,deckY+.595,9.04],steel,{shadow:false});
  }
  for(const y of [deckY+.102,deckY+1.12]){
    box(terrace,[32.18,.055,.087],[0,y,9.05],steel);
  }
  for(const side of [-1,1]){
    for(let i=0;i<6;i++){
      const z=8.38-i*1.34;
      part(terrace,panels,rail,[1,1,1],[side*15.89,deckY+.58,z],[0,side*Math.PI/2,0]);
      box(terrace,[.074,1.14,.046],[side*15.9,deckY+.59,z+.64],steel,{shadow:false});
    }
    box(terrace,[.055,.051,8.0],[side*15.89,deckY+1.12,4.99],steel);
  }

  box(architecture,[8.21,3.39,2.82],[-11.72,1.80,-.95],white);
  box(architecture,[3.65,3.45,2.86],[13.77,1.825,7.22],white);
  box(architecture,[3.77,3.80,2.92],[13.77,deckY+2.0,6.99],white);
  box(architecture,[1.12,2.32,.088],[-14.49,1.28,.495],mat.door);
  box(architecture,[.072,.22,.05],[-14.11,1.15,.55],steel);

  function graphic(name,canvas,w,h,position){
    const texture=new THREE.CanvasTexture(canvas);
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.anisotropy=4;
    const surface=material(name,0xffffff,{map:texture});
    mesh(art,name,new THREE.PlaneGeometry(w,h),surface,position).castShadow=false;
  }
  graphic('Mural del comedor',muralTexture('comedor'),3.59,3.34,[13.77,1.80,8.656]);
  graphic('Mural lateral · retrato',muralTexture('retrato'),2.16,2.82,[-10.19,1.57,.469]);
  graphic('Mural lateral · figura',muralTexture('abstracto'),1.75,2.82,[-8.16,1.57,.469]);
  graphic('Letrero del Gobierno del Cesar',signTexture(),3.4,2.55,[13.77,deckY+2.38,8.461]);

  function chair(x,y,z,angle,color){
    const point=(a,b,c)=>[x+a*Math.cos(angle)+c*Math.sin(angle),y+b,z-a*Math.sin(angle)+c*Math.cos(angle)];
    const rotate={rotate:[0,angle,0],shadow:false};
    box(furniture,[.43,.063,.42],point(0,.465,0),color,rotate);
    box(furniture,[.405,.237,.056],point(0,.735,.193),color,{rotate:[-.14,angle,0],shadow:false});
    for(const side of [-1,1]){
      for(const depth of [-1,1]){
        beam(furniture,post,point(side*.209,.022,depth*.215),point(side*.16,.463,depth*.164),.016,.016,chairLeg,false);
      }
      beam(furniture,post,point(side*.17,.83,.18),point(side*.20,.023,.215),.014,.014,chairLeg,false);
    }
  }
  for(const [level,y,rows] of [[0,floorY,[2.6,5.54]],[1,deckY+.03,[1.6]]]){
    for(const [row,z] of rows.entries()){
      for(const [i,x] of [-5.65,-2.35,.94,4.22,7.51,10.79].entries()){
        const color=(i+row+level)%4===0?greenChair:yellow;
        box(furniture,[1.37,.063,.80],[x,y+.755,z],tabletop);
        for(const dx of [-.54,.54]){
          for(const dz of [-.29,.29]){
            box(furniture,[.046,.73,.046],[x+dx,y+.371,z+dz],chairLeg,{shadow:false});
          }
          chair(x+dx*.85,y,z+.71,0,color);
          chair(x+dx*.85,y,z-.71,Math.PI,color);
        }
      }
    }
  }

  box(garden,[35.2,.075,12.42],[-1.4,.042,16.08],mat.grass,{repeat:[9,9],shadow:false});
  box(garden,[4.25,.075,10.45],[13.9,.046,14.32],mat.pavement,{shadow:false});
  const kerbPoints=[[-19,.105,22.4],[-11,.105,21.72],[-4,.105,21.19],[4,.105,20.85],[10.9,.105,20.82]];
  for(let i=1;i<kerbPoints.length;i++){
    const a=kerbPoints[i-1],b=kerbPoints[i];
    const angle=Math.atan2(b[2]-a[2],b[0]-a[0]);
    box(garden,[Math.hypot(b[0]-a[0],b[2]-a[2])+.015,.16,.235],
      [(a[0]+b[0])/2,.091,(a[2]+b[2])/2],curb,{rotate:[0,-angle,0]});
  }
  box(garden,[39.4,.046,4.8],[-.5,.027,24.73],mat.frame,{shadow:false});
  for(const [x,z,angle] of [[-12,24.2,-.11],[1.6,25.9,.12],[11.5,23.4,-.12]]){
    box(garden,[9.1,.008,.016],[x,.054,z],mat.dark,{rotate:[0,angle,0],shadow:false});
  }
  const shadeTree=group('Comedor · Árbol frontal');
  garden.add(shadeTree);
  tree(-10.4,15.48,8.55,6.23,.082,shadeTree);

  const stone=material('esculturas de piedra clara',0xcdccb6);
  const head=new THREE.IcosahedronGeometry(1,1);
  for(const [x,z,scale] of [[-16.15,13.27,.89],[-14.05,10.9,.76]]){
    part(garden,head,stone,[.42*scale,.69*scale,.36*scale],[x,.22+.68*scale,z]);
    part(garden,head,stone,[.37*scale,.59*scale,.34*scale],[x,.24+1.37*scale,z]);
    box(garden,[.17*scale,.35*scale,.21*scale],[x,.23+1.33*scale,z+.35*scale],stone,{rotate:[.16,0,0]});
    box(garden,[.36*scale,.11*scale,.12*scale],[x,.23+1.12*scale,z+.31*scale],stone);
  }
  return dining;
}
