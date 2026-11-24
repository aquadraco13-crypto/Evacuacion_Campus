import * as THREE from './three.module.js';
import {fitGroup, sitePoint} from './site.js';
import {buildIceCreamShop} from './ice-cream-shop.js';
import {buildElevator, elevatorBayWidth, elevatorZ} from './elevator.js';
export {elevatorZ} from './elevator.js';

export const blockCenter = [337,245];
export const floorRise = 3.57;
export const blockBearing = .05;
export const stairEntryX = -12.04;
export const stairDownZ = -18.31;
export const stairUpZ = stairDownZ+2.46;
const flightLength = 2.86;
const landingDepth = 1.79;
const landingStart = stairEntryX+flightLength;
const stairBack = landingStart+landingDepth;
const stairSideA = stairDownZ-1.15;
const stairSideB = stairUpZ+1.15;
const stairDivider = (stairDownZ+stairUpZ)/2;

function stairPlaster() {
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d');
  const pixels=ctx.createImageData(canvas.width,canvas.height);
  let seed=89;
  for(let i=0;i<pixels.data.length;i+=4){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const shade=231+(seed>>>28)-((seed>>>20)&7);
    pixels.data.set([shade,shade,shade,255],i);
  }
  ctx.putImageData(pixels,0,0);
  const map=new THREE.CanvasTexture(canvas);
  map.colorSpace=THREE.SRGBColorSpace;
  map.wrapS=map.wrapT=THREE.RepeatWrapping;
  map.anisotropy=4;
  return map;
}

export function blockPoint(x,y,z) {
  const [cx,,cz]=sitePoint(blockCenter);
  return [cx+x*Math.cos(blockBearing)+z*Math.sin(blockBearing),y,
    cz-x*Math.sin(blockBearing)+z*Math.cos(blockBearing)];
}

export function buildBlockI(kit, mat, brickUV) {
  const {group,box,part,beam,cube}=kit;
  const surface=(name,color,options={})=>new THREE.MeshStandardMaterial({name,color,roughness:.82,...options});
  const moss=surface('Bloque I · muro verde claro',0x889466);
  const mint=surface('Planta baja · verde menta',0x84a995);
  const plaster=stairPlaster();
  const stairWall=surface('Escalera I · estuco verde',0x5c7362,{map:plaster});
  const stairJamb=surface('Escalera I · jamba verde profunda',0x437463,{map:plaster});
  const brickScreen=surface('Escalera I · celosía de ladrillo oscuro',0x824832);
  const stairTile=surface('Escalera I · terracota oscura',0xd3ada3,{map:mat.tile.map,roughness:.73});
  const stepEdge=surface('Escalera I · nariz de peldaño',0x855b49,{roughness:.64});
  const stairRail=surface('Escalera I · pasamanos metálico',0x303732,{metalness:.38,roughness:.55});
  const bottle=surface('Bloque I · columnas y puertas verde oscuro',0x344d3e);
  const dado=surface('Bloque I · zócalo terracota estriado',0x8e5141);
  const cap=surface('Bloque I · remate de piedra',0x8c8272);
  const steel=surface('Bloque I · casilleros de acero gris',0xb2b9b7,{metalness:.23});
  const hardware=surface('Bloque I · tiradores y rejillas',0x333e3c,{metalness:.20});
  const ceiling=surface('Bloque I · techo marfil',0xdfd4c0);
  const lamp=surface('Bloque I · luminarias',0xe7dfcf,{emissive:0xffe6bd,emissiveIntensity:.29});
  const notice=surface('Bloque I · cartelera azul',0x275355);
  const extinguisher=surface('Bloque I · extintor',0xb93632);
  const tileUV={repeat:[2.4,2.4]};
  const plasterUV={repeat:[1.55,1.55]};
  const slim={shadow:false};
  const cylinder=new THREE.CylinderGeometry(1,1,1,12);
  const bands=Array.from({length:8},(_,i)=>-19.6+i*5.6);

  const block=group('Bloque I');
  const levels=[];
  const stairs=[];
  function child(name,parent) {
    const item=group(name);
    parent.add(item);
    return item;
  }
  function shopWall(parent,y){
    const tileHeight=.91;
    const stone=surface('Heladería · franja de terrazo',0x9a9084,{roughness:.96});
    for(const [x,z,d] of [[-12.255,-20.745,2.60],[-16.942,-21.88,.56],[-16.942,-19.60,.56]]){
      const side=x < -15 ? 1 : -1;
      box(parent,[.032,tileHeight,d],[x,y+tileHeight/2,z],dado);
      box(parent,[.043,.069,d],[x+side*.011,y+.958,z],stone);
      box(parent,[.040,.043,d],[x+side*.014,y+.029,z],cap);
      for(let offset=.023;offset<d-.015;offset+=.045){
        box(parent,[.017,.83,.015],[x+side*.023,y+.468,z-d/2+offset],dado,slim);
      }
    }
  }
  function plaque(parent,index,height,z) {
    const c=document.createElement('canvas');
    c.width=256; c.height=192;
    const ctx=c.getContext('2d');
    ctx.fillStyle='#243e37'; ctx.fillRect(0,0,256,192);
    ctx.strokeStyle='#d4cab0'; ctx.lineWidth=5; ctx.strokeRect(6,6,244,180);
    ctx.fillStyle='#ece4cc'; ctx.font='700 25px Arial'; ctx.fillText('BLOQUE I',24,47);
    ctx.font='700 65px Arial'; ctx.fillText('PISO '+index,20,126);
    ctx.fillStyle='#adb690'; ctx.fillRect(22,147,211,3);
    const map=new THREE.CanvasTexture(c);
    map.colorSpace=THREE.SRGBColorSpace;
    const sign=surface('Señal del piso '+index,0xffffff,{map});
    box(parent,[.021,.38,.50],[-12.741,height,z],sign,slim);
  }
  function lockers(parent,y,z) {
    box(parent,[.38,1.84,1.26],[-13.05,y+.92,z],hardware);
    for(let row=0;row<4;row++) for(let col=0;col<3;col++) {
      const cz=z+(col-1)*.4, cy=y+.253+row*.441;
      box(parent,[.053,.426,.385],[-13.24,cy,cz],steel);
      box(parent,[.026,.115,.040],[-13.276,cy+.032,cz+.078],hardware,slim);
      box(parent,[.025,.08,.023],[-13.289,cy+.031,cz+.078],steel,slim);
      for(let i=0;i<3;i++) box(parent,[.015,.010,.072],[-13.273,cy-.113+i*.027,cz-.035],hardware,slim);
    }
  }
  function detailSlab(parent,y,x,z,w,d){
    box(parent,[w,.22,d],[x,y-.132,z],ceiling);
    box(parent,[w,.02,d],[x,y-.012,z],mat.pavement);
  }
  function masonryScreen(parent,y,left,right,centers,place) {
    const width=right-left, middle=(left+right)/2;
    const panelSill=1.59, panelTop=3.29, panelWidth=1.91;
    place(width,panelSill,.34,middle,y+panelSill/2,mat.brick,brickUV);
    place(width,floorRise-panelTop,.34,middle,y+(floorRise+panelTop)/2,mat.brick,brickUV);
    for(const [from,to] of [[left,centers[0]-panelWidth/2],
      [centers[0]+panelWidth/2,centers[1]-panelWidth/2],[centers[1]+panelWidth/2,right]]){
      place(to-from,panelTop-panelSill,.34,(from+to)/2,y+(panelSill+panelTop)/2,mat.brick,brickUV);
    }
    const rows=9;
    const pitch=(panelTop-panelSill)/rows;
    const bed=.078, jamb=.155, pier=.13;
    const openingsByRow=[
      [[.16,.24],[.66,.24],[1.16,.24],[1.66,.18]],
      [[.33,.25],[.83,.25],[1.33,.23]]
    ];
    for(const center of centers){
      const start=center-panelWidth/2;
      for(let row=0;row<rows;row++){
        const base=y+panelSill+row*pitch;
        place(panelWidth,bed,.27,center,base+bed/2,brickScreen,slim);
        let solidStart=0;
        for(const [openingStart,gap] of openingsByRow[row%2]){
          const span=openingStart-solidStart;
          place(span,pitch-bed,.27,start+solidStart+span/2,base+(pitch+bed)/2,brickScreen,slim);
          solidStart=openingStart+gap;
        }
        const end=panelWidth-solidStart;
        place(end,pitch-bed,.27,start+solidStart+end/2,base+(pitch+bed)/2,brickScreen,slim);
      }
      for(const x of [start+jamb/2,start+panelWidth-jamb/2]){
        place(pier,panelTop-panelSill,.30,x,y+(panelSill+panelTop)/2,brickScreen,slim);
      }
    }
  }
  function stairEnclosure(level,y,index) {
    const walls=child('Cerramiento de la escalera · Piso '+(index+1),level);
    const wallX=-12.13, clearHeight=3.34, midY=y+clearHeight/2;
    const wallColor=index===0?mint:moss;
    function front(from,to,height=clearHeight,base=0,color=wallColor){
      box(walls,[.22,height,to-from],[wallX,y+base+height/2,(from+to)/2],color,plasterUV);
    }
    front(-22.05,stairSideA);
    front(stairSideB,-14.0);
    front(19.595,22.045);
    for(const z of [stairSideA-.10,stairSideB+.10]){
      box(walls,[stairBack-stairEntryX+.13,clearHeight,.20],
        [(stairBack+stairEntryX-.13)/2,midY,z],stairWall,plasterUV);
    }
    const threshold=2.56;
    box(walls,[.22,clearHeight-threshold,stairSideB-stairSideA],
      [wallX,y+(clearHeight+threshold)/2,(stairSideA+stairSideB)/2],stairWall,plasterUV);
    for(const [from,to,color] of [[stairSideA-.04,stairSideA+.07,ceiling],
      [stairDivider-.16,stairDivider+.16,stairJamb],[stairSideB-.07,stairSideB+.04,stairJamb]]){
      front(from,to,threshold,0,color);
    }
    if(index===0) front(stairSideA+.07,stairDivider-.16,threshold);
    if(index===3) front(stairDivider+.16,stairSideB-.07,threshold);
    masonryScreen(walls,y,stairSideA-.10,stairSideB+.10,[stairDownZ,stairUpZ],
      (w,h,d,z,cy,mat,options)=>box(walls,[d,h,w],[stairBack+.17,cy,z],mat,options));
    box(walls,[.32,.055,stairSideB-stairSideA],[-12.18,y-.026,(stairSideA+stairSideB)/2],mat.pavement);
  }
  for(let i=0;i<4;i++) {
    const y=i*floorRise+.13;
    const level=child('Bloque I · Piso '+(i+1),block);
    levels.push(level);
    function corridorSlab(w,d,x,z) {
      box(level,[w,.205,d],[x,y-.103,z],mat.pavement);
      box(level,[w,.052,d],[x,y-.228,z],ceiling);
    }
    corridorSlab(5.25,44.22,-14.74,0);
    if(i===0) detailSlab(level,y,2.35,0,29.42,44.2);
    else {
      const openingEnd=stairBack+.06, coreEnd=17.06;
      detailSlab(level,y,(openingEnd+coreEnd)/2,0,coreEnd-openingEnd,44.2);
      for(const [from,to] of [[-22.1,stairSideA],[stairSideB,22.1]]){
        detailSlab(level,y,(-12.12+openingEnd)/2,(from+to)/2,openingEnd+12.12,to-from);
      }
    }
    box(level,[.34,3.25,44.05],[17.08,y+1.63,0],mat.brick,brickUV);
    box(level,[29.40,3.22,.33],[2.36,y+1.61,22.05],mat.brick,brickUV);
    box(level,[24.16,3.22,.33],[4.98,y+1.61,-22.05],mat.brick,brickUV);
    masonryScreen(level,y,-12.25,-7.1,[-10.94,-8.48],
      (w,h,d,x,cy,mat,options)=>box(level,[w,h,d],[x,cy,-22.05],mat,options));
    for(let j=0;j<8;j++){
      const z=-19.25+j*5.5;
      box(level,[.04,1.03,2.62],[17.263,y+2.01,z],mat.glass,slim);
      box(level,[.055,.051,2.75],[17.295,y+1.48,z],cap,slim);
      box(level,[.049,1.02,.047],[17.294,y+2.01,z],hardware,slim);
    }
    for(let j=1;j<7;j++){
      const z=bands[j]+2.80;
      box(level,[.22,3.24,5.46],[-12.13,y+1.62,z],i===0?mint:moss);
      box(level,[.045,.94,5.43],[-12.27,y+.475,z],dado);
      box(level,[.056,.084,5.44],[-12.30,y+.969,z],cap);
      for(let k=0;k<52;k++) box(level,[.018,.915,.013],[-12.297,y+.477,z-2.66+k*.104],dado,slim);
      box(level,[.058,.57,5.42],[-12.275,y+2.89,z],mat.glass);
      for(let k=0;k<=27;k++) box(level,[.034,.57,.021],[-12.32,y+2.89,z-2.67+k*.1978],hardware,slim);
      for(const h of [2.61,2.80,2.98,3.18]) box(level,[.035,.019,5.42],[-12.321,y+h,z],bottle,slim);
    }
    for(const z of [-21.88,...bands,21.88]){
      box(level,[.57,3.31,.65],[-12.44,y+1.65,z],bottle);
      box(level,[.61,.98,.68],[-12.45,y+.49,z],dado);
      box(level,[.61,.042,.68],[-12.45,y+.995,z],cap);
      box(level,[.88,3.52,.58],[-17.01,y+1.76,z],mat.brick,brickUV);
      box(level,[.34,2.16,.53],[-16.51,y+2.17,z],bottle);
    }
    stairEnclosure(level,y,i);
    const bayHalf=elevatorBayWidth/2;
    const parapets=i===0 ? [[-13.65,22.05]] :
      [[-22.05,elevatorZ-bayHalf],[elevatorZ+bayHalf,22.05]];
    for(const [from,to] of parapets){
      box(level,[.39,1.04,to-from],[-17.01,y+.53,(from+to)/2],dado);
      box(level,[.46,.12,to-from],[-17.01,y+1.10,(from+to)/2],cap);
      for(let z=from+.07;z<to-.02;z+=.1102){
        box(level,[.028,1.01,.014],[-16.803,y+.523,z],dado,slim);
      }
    }
    box(level,[.39,.23,44.23],[-17.03,y+3.205,0],mat.brick,brickUV);
    box(level,[4.73,3.28,.28],[-14.79,y+1.64,22.05],bottle);
    box(level,[1.38,2.22,.067],[-14.24,y+1.12,21.87],hardware);
    for(let j=0;j<21;j++) box(level,[1.30,.025,.067],[-14.24,y+.2+j*.091,21.82],steel,slim);
    if(i===0){
      box(level,[4.57,1.01,.26],[-14.8,y+2.80,-22.04],ceiling);
      for(const x of [-16.45,-13.06]) box(level,[.50,2.31,.27],[x,y+1.155,-22.04],bottle);
    } else {
      const lookout=child('Mirador hacia la cafetería · Piso '+(i+1),level);
      box(lookout,[4.77,.98,.27],[-14.8,y+.49,-22.04],dado);
      box(lookout,[4.80,.09,.35],[-14.8,y+1.025,-22.04],cap);
      box(lookout,[4.77,.26,.29],[-14.8,y+3.17,-22.04],mat.brick,brickUV);
      for(const x of [-16.92,-12.51]) box(lookout,[.36,3.25,.32],[x,y+1.625,-22.04],mat.brick,brickUV);
    }
    for(const z of [.6,10.7]){
      box(level,[.166,2.24,1.16],[-12.42,y+1.12,z],bottle);
      box(level,[.033,2.065,.96],[-12.525,y+1.06,z],mat.door);
      box(level,[.054,.091,.027],[-12.563,y+1.04,z+.34],steel,slim);
    }
    if(i>0) for(const z of [-10.2,7.94]) lockers(level,y,z);
    if(i===0){
      const shop=child('Heladería · Planta baja del Bloque I',level);
      shopWall(shop,y);
      buildIceCreamShop(kit,shop,y);
    }
    const elevator=child('Ascensor · Piso '+(i+1)+' del Bloque I',level);
    buildElevator(kit,elevator,y,i+1,floorRise,mat,brickUV);
    box(level,[.063,1.07,1.65],[-12.37,y+1.79,-3.95],cap);
    box(level,[.07,.96,1.54],[-12.414,y+1.79,-3.95],notice);
    for(let j=0;j<4;j++) box(level,[.02,.20+j*.02,.124],[-12.455,y+1.78+(j%2)*.13,-4.29+j*.18],ceiling,slim);
    part(level,cylinder,extinguisher,[.092,.37,.092],[-12.57,y+1.39,-11.22]);
    part(level,cylinder,hardware,[.041,.093,.041],[-12.57,y+1.607,-11.22]);
    plaque(level,i+1,y+2.47,bands[0]);
    for(const z of [-18.2,-13.0,-7.8,-2.6,2.6,7.8,13.0,19.7]){
      box(level,[.68,.052,.69],[-14.65,y+3.255,z],hardware,slim);
      box(level,[.62,.041,.63],[-14.65,y+3.216,z],lamp,slim);
    }
    box(level,[.038,.043,43.7],[-16.14,y+3.27,0],hardware,slim);
    for(const z of [-6.95,8.81]) for(const [j,color] of [hardware,bottle,steel].entries()){
      box(level,[.34,.67,.285],[-16.51,y+.335,z+j*.296],color);
      box(level,[.37,.046,.30],[-16.51,y+.691,z+j*.296],hardware);
    }
  }

  const roof=child('Bloque I · Cubierta removible en el visor',block);
  const top=4*floorRise+.12;
  box(roof,[35.0,.30,44.6],[0,top-.154,0],ceiling);
  box(roof,[34.7,.12,44.3],[0,top+.13,0],cap);
  for(const z of [-22.21,22.21]) box(roof,[34.9,.41,.25],[0,top+.34,z],mat.brick,brickUV);
  for(const x of [-17.35,17.35]) box(roof,[.25,.41,44.13],[x,top+.34,0],mat.brick,brickUV);
  box(roof,[4.7,.94,6.2],[12.6,top+.71,-11.9],mat.brick,brickUV);
  box(roof,[4.85,.16,6.32],[12.6,top+1.24,-11.9],cap);

  // Both runs face the corridor, in the bay next to the ice cream shop.
  const stairWidth=2.02;
  const treadUV={repeat:[5.0,2.4]};
  for(let floor=0;floor<3;floor++){
    const stair=child('Escalera I · Piso '+(floor+1)+' a '+(floor+2),block);
    stairs.push(stair);
    const y=.13+floor*floorRise;
    const riser=floorRise/20;
    const tread=flightLength/10;
    box(stair,[flightLength,3.20,.17],[(landingStart+stairEntryX)/2,y+1.60,stairDivider],stairWall,plasterUV);
    for(let flight=0;flight<2;flight++){
      const z=flight===0?stairUpZ:stairDownZ;
      const start=flight===0?stairEntryX:landingStart, direction=flight===0?1:-1;
      const startY=y+flight*floorRise/2;
      for(let j=0;j<10;j++){
        const x=start+direction*(j+.5)*tread;
        const top=startY+(j+1)*riser;
        box(stair,[tread+.018,.215,stairWidth],[x,top-.1075,z],stairTile,treadUV);
        const noseX=x-direction*(tread/2+.005);
        box(stair,[.034,.021,stairWidth-.018],[noseX,top-.012,z],stepEdge,slim);
        beam(stair,cylinder,[noseX,top-.005,z-stairWidth/2+.021],
          [noseX,top-.005,z+stairWidth/2-.021],.012,.016,stepEdge,false);
      }
      beam(stair,cube,[start,startY-.236,z],
        [start+direction*flightLength,startY+floorRise/2-.236,z],.26,stairWidth-.064,stairWall);
      const wallZ=flight===0?stairSideB:stairSideA;
      const railZ=wallZ-direction*.14;
      const railPoint=t=>[start+direction*t*flightLength,startY+.91+t*floorRise/2,railZ];
      beam(stair,cylinder,railPoint(.02),railPoint(.98),.024,.024,stairRail);
      for(const t of [.02,.23,.57,.83,.98]) {
        const p=railPoint(t);
        const support=[p[0],p[1]-.065,wallZ];
        beam(stair,cylinder,support,p,.011,.011,stairRail,false);
        part(stair,cylinder,stairRail,[.034,.008,.034],support,[Math.PI/2,0,0],false);
      }
    }
    const landing=child('Descanso intermedio · Pisos '+(floor+1)+' y '+(floor+2),stair);
    box(landing,[landingDepth,.215,stairSideB-stairSideA],
      [landingStart+landingDepth/2,y+floorRise/2-.1075,stairDivider],stairTile,tileUV);
  }
  fitGroup(block,[0,0],blockCenter,blockBearing);
  block.userData={floors:4,reference:'Planta baja y arranque de escalera según video. El giro detrás de la celosía y los tramos superiores se estimaron.'};
  return {block,levels,stairs,roof};
}
