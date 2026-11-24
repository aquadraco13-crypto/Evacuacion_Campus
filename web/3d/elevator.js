import * as THREE from './three.module.js';

export const elevatorZ = -20.72;
export const elevatorBayWidth = 1.82;
const doorX = -17.83;
const doorWidth = 1.16;
const doorHeight = 2.18;

function doorGraphics() {
  const canvas=document.createElement('canvas');
  canvas.width=512;
  canvas.height=960;
  const ctx=canvas.getContext('2d');
  const gray=ctx.createLinearGradient(0,0,512,0);
  gray.addColorStop(0,'#b4c0c6');
  gray.addColorStop(.43,'#d9e1dc');
  gray.addColorStop(1,'#adbabe');
  ctx.fillStyle=gray;
  ctx.fillRect(0,0,512,960);
  ctx.fillStyle='#4e765e';
  ctx.textAlign='center';
  ctx.font='900 68px Arial';
  ctx.fillText('ESTAMOS',256,278);
  ctx.font='bold 42px Arial';
  ctx.fillText('MODO',256,332);
  ctx.font='italic 61px Georgia';
  ctx.fillText('Acreditación',256,405);

  for(const [color,h] of [['#637a58',520],['#427653',583],['#306449',667]]){
    ctx.fillStyle=color;
    ctx.beginPath();
    ctx.moveTo(0,h+39);
    ctx.quadraticCurveTo(102,h+84,237,h+27);
    ctx.quadraticCurveTo(363,h-29,512,h+13);
    ctx.lineTo(512,960);
    ctx.lineTo(0,960);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle='#25523c';
  ctx.beginPath();
  ctx.arc(255,835,116,0,2*Math.PI);
  ctx.fill();
  ctx.fillStyle='#e3ebe4';
  ctx.font='900 83px Arial';
  ctx.fillText('UPC',256,864);

  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=4;
  return texture;
}

export function buildElevator({box,mesh},parent,y,floor,floorRise,mat,brickUV) {
  const surface=(name,color,options={})=>new THREE.MeshStandardMaterial({
    name:'Ascensor · '+name,color,roughness:.74,...options
  });
  const green=surface('marco verde oscuro',0x294a3f);
  const steel=surface('acero satinado',0xa8b2b0,{metalness:.30,roughness:.46});
  const shadow=surface('junta central',0x53625d);
  const button=surface('llamada',0xa2473b);
  const display=surface('indicador de planta',0xb8dabf,{emissive:0x81ba8d,emissiveIntensity:.33});
  const z=elevatorZ;
  const opening=elevatorBayWidth;
  const top=floorRise;

  box(parent,[.65,.205,opening],[doorX+.315,y-.104,z],mat.pavement);
  box(parent,[.29,top,opening+.30],[-19.60,y+top/2,z],mat.brick,brickUV);
  if(floor===4){
    box(parent,[2.50,.20,opening+.30],[-18.51,y+top,z],mat.structure);
  }
  for(const side of [-1,1]){
    box(parent,[2.46,top,.22],[-18.49,y+top/2,z+side*opening/2],mat.brick,brickUV);
    box(parent,[.50,2.65,.245],[-17.35,y+1.325,z+side*opening/2],mat.brick,brickUV);
    box(parent,[.13,2.36,.18],[doorX,y+1.18,z+side*.686],green);
  }
  box(parent,[.13,.174,1.56],[doorX,y+2.273,z],green);
  const lintelStart=2.36;
  box(parent,[.21,top-lintelStart,1.82],[doorX-.045,y+(top+lintelStart)/2,z],mat.brick,brickUV);
  box(parent,[.10,2.33,1.29],[doorX-.079,y+1.16,z],green);
  box(parent,[.38,.027,1.33],[doorX+.09,y+.014,z],steel);
  for(const delta of [-.12,-.06,.06]) box(parent,[.012,.005,1.24],[doorX+delta+.13,y+.03,z],shadow,{shadow:false});

  const leaf=surface('hojas de acero',0xc2c9c6,{metalness:.21});
  const skin=floor===1
    ? surface('gráfica de acreditación',0xffffff,{map:doorGraphics()})
    : leaf;
  for(const [i,side] of [-1,1].entries()){
    const center=z+side*.293;
    box(parent,[.054,doorHeight,.575],[doorX-.014,y+1.12,center],leaf);
    const panel=new THREE.PlaneGeometry(.575,doorHeight);
    panel.rotateY(Math.PI/2);
    const uv=panel.attributes.uv;
    // +X faces the corridor, so the low-Z panel carries the right half of the print.
    for(let k=0;k<uv.count;k++) uv.setX(k,(uv.getX(k)+1-i)/2);
    mesh(parent,i===0?'Puerta del ascensor · derecha':'Puerta del ascensor · izquierda',panel,skin,[doorX+.014,y+1.12,center]).castShadow=false;
  }
  box(parent,[.042,doorHeight,.008],[doorX+.002,y+1.12,z],shadow,{shadow:false});
  box(parent,[.040,.23,.116],[doorX+.078,y+1.24,z+.802],steel);
  box(parent,[.034,.036,.041],[doorX+.112,y+1.26,z+.802],button);
  box(parent,[.036,.14,.30],[doorX+.077,y+2.268,z],shadow);
  const segments=[
    [0,.043,.016,.056],[-.030,.022,.048,.012],[-.030,-.022,.048,.012],
    [0,-.043,.016,.056],[.030,-.022,.048,.012],[.030,.022,.048,.012],[0,0,.014,.056]
  ];
  const digits=['12','01643','01623','5612'];
  for(const segment of digits[floor-1]){
    const [dz,dy,h,w]=segments[Number(segment)];
    box(parent,[.009,h,w],[doorX+.100,y+2.268+dy,z+dz],display,{shadow:false});
  }
}
