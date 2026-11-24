import * as THREE from './three.module.js';

export function buildIceCreamShop({box,mesh,part,beam,cube},parent,y) {
  const material=(name,color,options={})=>new THREE.MeshStandardMaterial({
    name:'Heladería · '+name,color,roughness:.77,...options
  });
  const enamel=material('esmalte blanco cálido',0xe6e6df);
  const edge=material('perfiles gris claro',0xc2c7c1,{metalness:.16});
  const iceBlue=material('máquina gris azulada',0xb3c1c3,{metalness:.19});
  const dark=material('caucho y herrajes',0x272c2a);
  const ivory=material('panel marfil',0xe3ddcd);
  const coral=material('acento coral',0xb76256);
  const forest=material('papelera verde',0x276647);
  const chair=material('asiento grafito',0x404a44);
  const metal=material('tubos pintados',0xbac4bb,{metalness:.19});
  const lamp=material('Luz del local',0xf6f0dc,{emissive:0xfff2d6,emissiveIntensity:.55});
  const cylinder=new THREE.CylinderGeometry(1,1,1,16);
  const cup=new THREE.CylinderGeometry(1,.77,1,16);
  const sphere=new THREE.SphereGeometry(1,12,8);
  const slim={shadow:false};
  function block(w,h,d,x,height,z,mat,options) {
    box(parent,[w,h,d],[x,y+height,z],mat,options);
  }
  function round(geo,x,height,z,r,h,depth,mat,rotation) {
    part(parent,geo,mat,[r,h,depth],[x,y+height,z],rotation);
  }
  function rod(geo,a,b,w,d,mat) {
    const at=([x,h,z])=>[x,y+h,z];
    beam(parent,geo,at(a),at(b),w,d,mat);
  }
  function sign(name,width,height,x,h,z,paint) {
    const canvas=document.createElement('canvas');
    canvas.width=512; canvas.height=256;
    paint(canvas.getContext('2d'));
    const map=new THREE.CanvasTexture(canvas);
    map.colorSpace=THREE.SRGBColorSpace;
    map.anisotropy=4;
    const geometry=new THREE.PlaneGeometry(width,height);
    geometry.rotateY(-Math.PI/2);
    const plane=mesh(parent,name,geometry,material(name,0xffffff,{map}),[x,y+h,z]);
    plane.castShadow=false;
  }
  function mark(ctx,title) {
    ctx.fillStyle='#e5ded4'; ctx.fillRect(0,0,512,256);
    ctx.fillStyle='#b56a5f'; ctx.beginPath(); ctx.ellipse(260,127,94,94,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#eee6db'; ctx.font='bold 144px Georgia'; ctx.textAlign='center'; ctx.fillText('D',260,175);
    if(title){
      ctx.fillStyle='#605953'; ctx.font='bold 26px Arial'; ctx.fillText('HELADOS',82,136);
    }
  }
  function menu(ctx) {
    ctx.fillStyle='#f0e9da'; ctx.fillRect(0,0,512,256);
    ctx.fillStyle='#a25349'; ctx.font='bold 47px Georgia'; ctx.fillText('Helados',24,53);
    ctx.fillStyle='#5d584c'; ctx.font='19px Arial'; ctx.fillText('Conos · Copas · Batidos',26,87);
    const flavors=[['#e9c489','Vainilla'],['#bd807d','Fresa'],['#89624b','Chocolate'],['#d3b7a4','Copa'],['#83a58b','Batido']];
    for(const [i,[color,label]] of flavors.entries()){
      const x=56+i*100;
      ctx.fillStyle='#ad825e';
      ctx.beginPath(); ctx.moveTo(x-19,154); ctx.lineTo(x+19,154); ctx.lineTo(x,199); ctx.closePath(); ctx.fill();
      ctx.fillStyle=color; ctx.beginPath(); ctx.arc(x,145,24,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#544b42'; ctx.font='17px Arial'; ctx.textAlign='center'; ctx.fillText(label,x,232);
    }
  }

  // Shallow counter against the corridor wall. The machine sits beside it.
  block(.034,2.36,2.57,-12.255,1.68,-20.72,ivory);
  for(let i=0;i<14;i++) block(.019,1.16,.018,-12.277,1.30,-22.00+i*.187,enamel,slim);
  for(const h of [.76,1.19,1.78]) block(.020,.022,2.56,-12.277,h,-20.72,enamel,slim);
  sign('Rótulo circular',1.28,.64,-12.28,2.55,-21.26,ctx=>mark(ctx,true));
  sign('Menú ilustrado',1.10,.55,-12.28,2.04,-20.78,menu);
  block(.10,.05,1.12,-12.35,1.745,-20.78,lamp,slim);
  block(.53,.88,1.22,-13.18,.495,-21.09,enamel);
  block(.60,.077,1.34,-13.17,.971,-21.09,enamel);
  block(.50,.108,1.17,-13.19,.084,-21.09,dark);
  for(let i=0;i<8;i++){
    block(.021,.014,1.18,-13.451,.69+i*.032,-21.09,edge,slim);
    block(.47,.014,.020,-13.16,.69+i*.032,-20.469,edge,slim);
  }
  sign('Emblema del mostrador',.30,.15,-13.457,.40,-21.10,ctx=>mark(ctx,false));
  block(.17,.022,.23,-13.12,1.024,-20.87,dark);
  block(.046,.12,.036,-13.10,1.085,-20.87,dark);
  block(.034,.235,.30,-13.115,1.23,-20.87,dark,{rotate:[0,0,.15]});
  block(.036,.18,.25,-13.138,1.23,-20.87,iceBlue,{rotate:[0,0,.15],shadow:false});
  const tubs=[material('tapa amarilla',0xe2c377),material('tapa rosa',0xbe7a73),ivory];
  for(const [i,color] of tubs.entries()){
    const z=-21.59+i*.136;
    round(cup,-13.28,1.075,z,.047,.14,.047,enamel);
    round(cylinder,-13.28,1.153,z,.051,.023,.051,color);
  }
  for(let i=0;i<5;i++) round(cup,-13.01,1.027+i*.032,-21.55,.041,.11,.041,ivory);
  block(.51,1.51,.73,-12.61,.80,-19.99,iceBlue);
  block(.52,.075,.74,-12.62,1.56,-19.99,edge);
  block(.035,.29,.58,-12.88,1.31,-19.99,dark);
  block(.039,.30,.59,-12.883,1.016,-19.99,enamel);
  for(let i=0;i<3;i++){
    const z=-20.16+i*.17;
    round(cylinder,-12.926,1.31,z,.023,.14,.023,dark,[0,0,-.58]);
    round(cylinder,-12.912,1.176,z,.031,.033,.031,edge);
  }
  block(.18,.038,.62,-12.92,.873,-19.99,dark);
  for(let i=0;i<6;i++) block(.013,.14,.026,-12.87,.47,-20.237+.092*i,dark,slim);
  block(.46,.08,.68,-12.61,.13,-19.99,dark);
  block(.254,.38,.27,-12.81,.216,-19.48,enamel);
  block(.27,.037,.29,-12.81,.419,-19.48,dark);
  block(.26,.023,.278,-12.81,.324,-19.48,coral,slim);

  // Leave the bay opposite the counter free as the elevator approach.
  const tx=-16.05, tz=-17.62;
  round(cylinder,tx,.746,tz,.50,.055,.43,enamel);
  for(const side of [-1,1]){
    rod(cube,[tx-.29,.035,tz+side*.23],[tx+.24,.70,tz+side*.23],.054,.054,metal);
    rod(cube,[tx+.29,.035,tz+side*.23],[tx-.24,.70,tz+side*.23],.054,.054,metal);
  }
  for(const side of [-1,1]){
    const z=tz+side*1.03;
    const x=-16.19;
    round(sphere,x,.453,z,.235,.043,.216,chair);
    round(sphere,x,.70,z+side*.18,.215,.237,.049,chair,[side*-.14,0,0]);
    for(const dx of [-.16,.16]){
      for(const dz of [-.15,.15]) rod(cylinder,[x+dx*1.22,.025,z+dz*1.23],[x+dx,.446,z+dz],.018,.018,metal);
      rod(cylinder,[x+dx,.54,z+side*.17],[x+dx,.84,z+side*.207],.019,.019,chair);
      rod(cylinder,[x+dx,.592,z-.13],[x+dx,.605,z+.13],.022,.022,chair);
    }
  }
  const stoolX=-13.70, stoolZ=-21.81;
  round(cylinder,stoolX,.623,stoolZ,.211,.048,.211,ivory);
  for(let i=0;i<4;i++) {
    const a=(i+.5)*Math.PI/2, dx=Math.cos(a), dz=Math.sin(a);
    rod(cylinder,[stoolX+dx*.24,.023,stoolZ+dz*.24],[stoolX+dx*.15,.63,stoolZ+dz*.15],.016,.016,ivory);
  }
  for(let i=0;i<9;i++) rod(cylinder,[stoolX+.16,.64,stoolZ-.17+i*.043],[stoolX+.236,.935,stoolZ-.195+i*.049],.014,.014,ivory);
  rod(cylinder,[stoolX+.236,.935,stoolZ-.21],[stoolX+.236,.935,stoolZ+.21],.024,.024,ivory);
  block(.295,.545,.305,-16.53,.275,-15.69,forest);
  block(.325,.082,.328,-16.53,.566,-15.69,forest,{rotate:[.10,0,0]});
  block(.193,.015,.13,-16.52,.61,-15.69,dark,slim);
}
