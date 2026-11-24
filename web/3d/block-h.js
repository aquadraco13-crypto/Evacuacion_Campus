import * as THREE from './three.module.js';
import {buildParking} from './parking.js';

export const blockHCenter=[174,73];
export const blockHBearing=.065;
export const blockHFountain=[166,110];

export function buildBlockH(kit,mat,brickUV,roofConcrete) {
  const {group,box,part}=kit;
  const h=group('Bloque H');
  h.userData={reference:'Fachada principal según la fotografía. Laterales y cubierta aproximados.'};
  const facade=group('Bloque H · Fachada principal');
  const volume=group('Bloque H · Volumen y cubierta');
  const garden=group('Bloque H · Jardín frontal');
  h.add(facade,volume,garden);

  const surface=(name,color,options={})=>new THREE.MeshStandardMaterial({
    name:'Bloque H · '+name,color,roughness:.79,...options
  });
  const green=surface('concreto verde oliva',0xa8ad7d);
  const greenBase=surface('pórtico verde salvia',0x789284);
  const greenTop=surface('cantos superiores',0xc2c6a7);
  const aluminum=surface('carpintería de aluminio',0xa8aba0,{metalness:.4,roughness:.44});
  const seals=surface('juntas oscuras',0x3b4943);
  const glass=[0x53615e,0x4c5755,0x455452,0x596363,0x4a5452].map((color,i)=>
    surface('vidrio ahumado '+(i+1),color,{metalness:.23,roughness:.30}));
  const ac=surface('carcasa de climatización',0xbbb9a5);
  const grilles=surface('rejillas de climatización',0x6c6f61);
  const foliage=[0x52642c,0x687e39,0x839746].map((color,i)=>surface('arbusto '+(i+1),color));
  const windowZ=13.65;
  const front=14;
  const width=40;
  const rise=3.8;
  const height=5*rise;
  const bays=[-10.4,-3.5,3.4,10.3];

  function masonry(parent,w,height,depth,x,y,z){
    box(parent,[w,height,depth],[x,y,z],mat.brick,brickUV);
  }
  function window(parent,x,y,z,w,height,seed,panes=5){
    box(parent,[w+.10,height+.10,.07],[x,y,z-.045],seals);
    const paneWidth=w/panes;
    for(let i=0;i<panes;i++){
      box(parent,[paneWidth-.042,height-.042,.046],
        [x-w/2+(i+.5)*paneWidth,y,z+.013],glass[(i+seed)%glass.length]);
    }
    for(let i=0;i<=panes;i++){
      box(parent,[i===0||i===panes?.067:.048,height+.075,.077],
        [x-w/2+i*paneWidth,y,z+.057],aluminum);
    }
    for(const side of [-1,1]){
      box(parent,[w+.11,.063,.084],[x,y+side*height/2,z+.058],aluminum);
    }
  }
  function condenser(parent,x,y,z){
    box(parent,[.86,.61,.42],[x,y,z],ac);
    box(parent,[.73,.056,.49],[x,y-.34,z],greenTop);
    box(parent,[.61,.43,.018],[x,y,z+.217],grilles);
    for(let i=0;i<6;i++){
      box(parent,[.65,.019,.031],[x,y-.182+i*.070,z+.229],ac,{shadow:false});
    }
    for(const side of [-1,1]){
      box(parent,[.054,.13,.50],[x+side*.29,y-.326,z],grilles);
    }
  }

  // Behind the layered front elevation, build the exterior volume on its existing footprint.
  masonry(volume,width,height,.36,0,height/2,-13.88);
  for(const side of [-1,1]){
    masonry(volume,.35,height,27.9,side*(width/2-.15),height/2,.02);
  }
  box(volume,[39.85,.32,27.85],[0,height-.36,0],roofConcrete);
  for(const side of [-1,1]){
    masonry(volume,40.14,.64,.27,0,height-.04,side*13.98);
    masonry(volume,.27,.64,27.48,side*19.95,height-.04,0);
  }
  masonry(volume,5.1,1.04,4.4,-13.6,height+.31,-7.6);
  box(volume,[5.26,.13,4.56],[-13.6,height+.89,-7.6],roofConcrete);

  masonry(facade,6.17,height,.33,16.91,height/2,13.76);
  for(let level=0;level<5;level++){
    const floor=group('Bloque H · Nivel '+(level+1));
    facade.add(floor);
    const y=level*rise;
    const frameColor=level===0?greenBase:green;
    const hasEntry=level===0;
    const openingBottom=hasEntry?1.20:1.10;
    const openingHeight=hasEntry?1.88:1.76;
    const head=openingBottom+openingHeight;

    for(const [i,x] of bays.entries()){
      // One open entrance bay at the lower right, as in the photo.
      if(hasEntry && i===3){
        box(floor,[6.15,.17,3.1],[x,.063,13.61],mat.pavement,{repeat:[2.4,2.4]});
        box(floor,[6.14,.22,2.45],[x,.14,14.65],mat.pavement);
        const doorCenter=x+.75;
        box(floor,[2.44,.080,.32],[doorCenter,.109,11.94],mat.pavement);
        for(const [lo,hi] of [[x-3.075,doorCenter-1.22],[doorCenter+1.22,x+3.075]])
          box(floor,[hi-lo,3.2,.20],[(lo+hi)/2,1.60,11.81],greenBase);
        box(floor,[2.44,.60,.20],[doorCenter,2.90,11.81],greenBase);
        for(const side of [-1,1])box(floor,[.18,3.17,1.91],[x+side*3.06,1.60,12.75],greenBase);
        masonry(floor,6.60,.56,.35,x,3.47,13.70);
      } else {
        masonry(floor,6.7,openingBottom,.36,x,y+openingBottom/2,13.72);
        masonry(floor,6.7,rise-head,.36,x,y+(rise+head)/2,13.72);
        window(floor,x,y+openingBottom+openingHeight/2,windowZ,6.08,openingHeight,level+2*i);
        box(floor,[6.24,.105,.35],[x,y+openingBottom-.045,13.83],greenTop);
        if(level>0 || i===0) condenser(floor,x-2.34,y+.57,14.00);
      }
    }

    for(let j=0;j<=bays.length;j++){
      const x=bays[0]-3.45+j*6.9;
      box(floor,[.72,rise,.62],[x,y+rise/2,13.88],frameColor);
    }
    box(floor,[28.72,.32,1.44],[-.05,y+rise-.11,14.25],frameColor);
    box(floor,[28.76,.070,1.48],[-.05,y+rise+.065,14.25],greenTop);

    // Narrow utility windows on the brick wing to the left of the main windows.
    const utilityX=-16.9;
    const sill=hasEntry?1.98:1.87;
    const slot=.38;
    masonry(floor,6.26,sill,.36,utilityX,y+sill/2,13.72);
    masonry(floor,6.26,rise-sill-slot,.36,utilityX,y+(rise+sill+slot)/2,13.72);
    for(const [center,w] of [[-19.48,1.10],[-16.9,1.46],[-14.47,1.10]]){
      masonry(floor,w,slot,.36,center,y+sill+slot/2,13.72);
    }
    for(const x of [-18.35,-15.56]){
      window(floor,x,y+sill+slot/2,windowZ,1.24,slot,level,2);
    }
  }
  box(facade,[40,.26,.46],[0,19.17,front-.15],mat.brick,brickUV);

  const lawnUV={repeat:[10,10],shadow:false};
  box(garden,[29.2,.055,12.4],[-5.63,.05,20.07],mat.grass,lawnUV);
  box(garden,[9.71,.055,12.4],[16.54,.05,20.07],mat.grass,lawnUV);
  box(garden,[34,.084,1.45],[.6,.074,16.58],mat.pavement);
  box(garden,[2.65,.086,12.0],[10.24,.075,20.44],mat.pavement);
  const cluster=new THREE.IcosahedronGeometry(1,1);
  for(const [i,x] of [-12.5,1.5,7.2,14.8,17.2].entries()){
    const z=17.92+Math.sin(i*2.4)*.81;
    const scale=[.78,.90,.70,1.05,.83][i];
    for(let layer=0;layer<5;layer++){
      const height=layer*.43;
      const r=(.73-layer*.104)*scale;
      part(garden,cluster,foliage[layer%3],[r,.51*scale,r*.79],
        [x+Math.sin(layer*5.4+i)*.13,.47+height*scale,z+Math.cos(layer*4.9)*.10]);
      for(let side=0;side<3;side++){
        const angle=side*2.094+layer*1.43;
        part(garden,cluster,foliage[(layer+side)%3],[r*.58,.31*scale,r*.56],
          [x+Math.cos(angle)*r*.70,.40+height*scale,z+Math.sin(angle)*r*.64]);
      }
    }
  }
  const sign=surface('placa verde',0x386050);
  box(garden,[.042,1.28,.047],[-4.1,.66,18],aluminum);
  box(garden,[.67,.43,.092],[-4.1,1.11,18],sign);
  buildParking(kit,h,mat);
  return h;
}
