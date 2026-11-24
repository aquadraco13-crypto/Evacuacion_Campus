import * as THREE from './three.module.js';

const tile=.36;
const coat=(name,color,extra={})=>new THREE.MeshStandardMaterial({name,color,roughness:.79,...extra});

function tileFinish(texture,name,colors,checker){
  const map=texture(name,512,512,(c,w,h,r)=>{
    c.fillStyle=checker?'#958c7e':'#b5a69a';c.fillRect(0,0,w,h);
    for(let j=0;j<4;j++)for(let i=0;i<4;i++){
      const x=i*128,y=j*128;
      c.fillStyle=colors[checker?(i+j)%2:Math.floor(r()*colors.length)];
      c.fillRect(x+1.35,y+1.35,125.3,125.3);
      c.fillStyle='rgba(255,244,219,.13)';c.fillRect(x+2,y+2,124,1.4);
      c.fillStyle='rgba(29,19,18,.18)';c.fillRect(x+126,y+2,1,124);
      for(let k=0;k<105;k++){
        c.fillStyle=k%2?'rgba(235,218,194,.13)':'rgba(61,38,31,.14)';
        c.fillRect(x+3+r()*121,y+3+r()*121,1.2,1);
      }
    }
  },7);
  return coat(name,0xffffff,{map,roughness:checker?.47:.50});
}

function hallwayMaterials(texture){
  const ribbed=texture('Lambrín cerámico acanalado',256,256,(c,w,h)=>{
    c.fillStyle='#995f50';c.fillRect(0,0,w,h);
    for(let x=0;x<w;x+=8){
      c.fillStyle='#77483e';c.fillRect(x,0,1.3,h);c.fillStyle='#ae7864';c.fillRect(x+2,0,1,h);
    }
    c.fillStyle='#78554c';c.fillRect(0,0,2,h);
  },10);
  return {
    tile:tileFinish(texture,'Pasillo · gres terracota',['#916b59','#977360','#926c5d','#8d6858','#946e5d'],false),
    check:tileFinish(texture,'Pasillo · damero azul y crema',['#526f88','#d7cba9'],true),
    plaster:coat('Pasillo · estuco verde claro',0x9db69c,{map:texture('Revoque pintado verde',256,256,(c,w,h,r)=>{
      c.fillStyle='#f2f0e9';c.fillRect(0,0,w,h);
      for(let i=0;i<760;i++){
        c.fillStyle=i%3?'rgba(100,108,90,.085)':'rgba(245,248,237,.65)';
        c.fillRect(r()*w,r()*h,1+r()*4,1+r()*3);
      }
    },11)}),
    darkGreen:coat('Pasillo · verde institucional',0x345c4c),
    lining:coat('Pasillo · zócalo estriado',0xffffff,{map:ribbed}),
    stone:coat('Pasillo · remate de granito',0xaaa397,{map:texture('Árido del granito',128,128,(c,w,h,r)=>{
      c.fillStyle='#bcb8aa';c.fillRect(0,0,w,h);
      for(let i=0;i<2900;i++){
        c.fillStyle=i%3?'#686960':'#eeece0';c.fillRect(r()*w,r()*h,1+r()*2,1+r()*2);
      }
    },8)}),
    iron:coat('Pasillo · barras oscuras',0x363730,{metalness:.26}),
    oak:coat('Pasillo · carpintería',0x796a56),
    steel:coat('Pasillo · aluminio satinado',0xbbc0b8,{metalness:.38,roughness:.39}),
    glass:coat('Pasillo · cristal íntegro',0xacc5bd,{transparent:true,opacity:.24,depthWrite:false,side:THREE.DoubleSide,roughness:.20}),
    reveal:coat('Pasillo · sombra del hueco',0x43584d),
    white:coat('Pasillo · cielo raso marfil',0xe4e2d6),
    recess:coat('Pasillo · estuco del vestíbulo',0xb9cebb,{emissive:0xadccc0,emissiveIntensity:.17}),
    lamp:coat('Pasillo · difusor',0xfff9e6,{emissive:0xfff1ce,emissiveIntensity:.50})
  };
}

// Coordinates are metric. +Z faces the exterior, so the bench is on the left
// and the ramp is on the right when entering from the forecourt.
function hallway(kit,m,g,w,d,h){
  const {box,mesh}=kit,H=w/2;
  const landingStart=d-2.25,rampRun=Math.min(5.10,d*.36),rampStart=landingStart-rampRun;
  const rise=Math.min(.405,.083*rampRun),stepRise=rise/3;
  const split=H-Math.min(2.0,w*.36),stride=.34;
  const inner=-H+1.10,outer=H-1.10,band=2*tile;
  const tiled=m.tile.clone(),checked=m.check.clone();
  tiled.vertexColors=checked.vertexColors=true;
  const bands=[[-H,inner-band/2,m.tile],[inner-band/2,inner+band/2,m.check],
    [inner+band/2,outer-band/2,m.tile],[outer-band/2,outer+band/2,m.check],[outer+band/2,H,m.tile]];
  function floorSurface(name,x0,x1,s0,s1,y0,y1,material){
    const geo=new THREE.BufferGeometry(),positions=[],uv=[],colors=[],indices=[];
    const origin=material===m.check?x0:0,pitch=tile*4;
    const nx=Math.ceil((x1-x0)/.38),ns=Math.ceil((s1-s0)/.45);
    for(let j=0;j<=ns;j++)for(let i=0;i<=nx;i++){
      const x=x0+(x1-x0)*i/nx,s=s0+(s1-s0)*j/ns;
      positions.push(x,y0+(y1-y0)*j/ns,-s);uv.push((x-origin)/pitch,s/pitch);
      // Diffuse daylight from the right bays, plus contact shade under the metal seat.
      const transverse=(x+H)/w,day=.5+.5*Math.cos(2*Math.PI*(s/3.65-.15*transverse));
      const underSeat=Math.exp(-((x+H-.40)**2/.30+(s-d*.49)**2/1.02));
      const value=.78+.20*transverse+.13*transverse*day-.32*underSeat-.19*Math.exp(-Math.max(0,H-Math.abs(x))/.22);
      colors.push(value,value*.995,value*.99);
      if(i<nx&&j<ns){const a=j*(nx+1)+i;indices.push(a,a+1,a+nx+2,a,a+nx+2,a+nx+1);}
    }
    geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    geo.setIndex(indices);geo.computeVertexNormals();mesh(g,name,geo,material===m.check?checked:tiled);
  }
  function paved(name,x0,x1,s0,s1,y0,y1){
    for(const [a,b,material] of bands){
      const lo=Math.max(a,x0),hi=Math.min(b,x1);
      if(hi>lo+.001)floorSurface(name,lo,hi,s0,s1,y0,y1,material);
    }
  }
  paved('Baldosas del corredor',-H,H,0,rampStart,0,0);
  paved('Piso ante los escalones',-H,split,rampStart,landingStart-3*stride,0,0);
  floorSurface('Rampa lateral',split,H,rampStart,landingStart,0,rise,m.tile);
  // Solid rising cheek beside the ramp, with a bullnose along its exposed edge.
  const triangle=new THREE.Shape();
  triangle.moveTo(-landingStart,0);triangle.lineTo(-rampStart,0);triangle.lineTo(-landingStart,rise);triangle.closePath();
  const cheek=new THREE.ExtrudeGeometry(triangle,{depth:.065,bevelEnabled:false});
  cheek.rotateY(-Math.PI/2);mesh(g,'Canto de la rampa',cheek,m.tile,[split,0,0]);
  kit.beam(g,kit.cube,[split+.015,.012,-rampStart],[split+.015,rise+.012,-landingStart],.06,.028,m.stone);
  for(let i=0;i<3;i++){
    const start=landingStart-(3-i)*stride,y=stepRise*(i+1);
    box(g,[split+H,stepRise,.03],[(split-H)/2,y-stepRise/2,-start],m.lining,{repeat:[.6,.55]});
    floorSurface('Huella de gres',-H,split,start,start+stride,y,y,m.tile);
    box(g,[split+H,.017,.027],[(split-H)/2,y+.005,-start-.021],m.iron);
  }
  floorSurface('Descanso superior',-H,H,landingStart,d,rise,rise,m.tile);
  const halfWall=1.05;
  for(const side of [-1,1]){
    const x=side*(H+.08);
    box(g,[.16,halfWall,d],[x,halfWall/2,-d/2],m.lining,{repeat:[.58,.62]});
    box(g,[.18,.092,d],[x,halfWall+.046,-d/2],m.stone,{repeat:[.35,.35]});
  }
  // The wall is built around the deep, barred lights rather than behind the glass.
  const zWindows=[.24,.43,.62].map(f=>d*f),winW=.66,sill=1.44,head=Math.min(h-.29,2.84);
  const wall=(a,b,y0,y1)=>{if(b>a&&y1>y0)box(g,[.16,y1-y0,b-a],[-H-.08,(y0+y1)/2,-(a+b)/2],m.plaster);};
  wall(0,d,halfWall+.092,sill);wall(0,d,head,h);
  let last=0;
  for(const center of zWindows){
    const a=center-winW/2,b=center+winW/2,mid=(head+sill)/2;
    wall(last,a,sill,head);last=b;
    box(g,[.036,head-sill,winW],[-H-.17,mid,-center],m.reveal);
    box(g,[.018,head-sill-.08,winW-.07],[-H-.13,mid,-center],m.glass);
    for(const z of [a,b])box(g,[.19,head-sill,.042],[-H-.07,mid,-z],m.oak);
    for(const y of [sill,head])box(g,[.19,.04,winW],[-H-.07,y,-center],m.oak);
    for(let i=1;i<=4;i++)box(g,[.035,head-sill-.025,.021],[-H-.012,mid,-(a+winW*i/5)],m.iron);
    box(g,[.043,.028,winW],[-H-.013,mid+.16,-center],m.iron);
  }
  wall(last,d,sill,head);
  const bays=Math.max(2,Math.round(d/3.6)),bay=d/bays;
  for(let i=0;i<=bays;i++){
    const s=Math.min(d-.14,Math.max(.14,i*bay));
    box(g,[.33,h-.06,.29],[H+.02,h/2,-s],m.darkGreen);
    if(i===bays)continue;
    // Recessed windows admit light from the perimeter and adjoining spaces.
    box(g,[.025,h-1.64,bay-.26],[H+.10,(h+1.10)/2,-(i+.5)*bay],m.glass);
    box(g,[.13,.19,bay],[H+.05,h-.115,-(i+.5)*bay],m.plaster);
  }
  // Shallow side gallery visible between the green piers; enclose it on every storey.
  box(g,[.15,h, d],[H+1.42,h/2,-d/2],m.recess);
  box(g,[1.39,.09,d],[H+.76,-.01,-d/2],m.tile,{repeat:[1.44,1.44]});
  box(g,[1.46,.10,d],[H+.75,h+.05,-d/2],m.white);
  for(const z of [-d+.06,-.09])box(g,[1.38,h,.15],[H+.77,h/2,z],m.plaster);
  for(let j=0;j<bays;j++){
    const z=-(j+.48)*bay;
    box(g,[.072,2.25,.99],[H+1.32,1.16,z],m.darkGreen);
    box(g,[.030,.52,.71],[H+1.27,1.77,z],m.reveal);
    box(g,[.060,.028,.13],[H+1.25,1.04,z+.31],m.steel);
  }
  box(g,[w+.33,.12,d],[0,h+.06,-d/2],m.white);
  for(let j=0;j<Math.ceil(d/4.2);j++){
    const z=-d*(j+.5)/Math.ceil(d/4.2);
    box(g,[.30,.055,.91],[.08,h-.04,z],m.steel);
    box(g,[.253,.018,.85],[.08,h-.077,z],m.lamp);
  }
  // An inset door and counter frame the raised landing at the end of the hall.
  const dx=H*.46,dw=1.14,doorTop=rise+2.12;
  const alcoveLeft=-H+.31,alcoveRight=dx-dw/2-.23;
  for(const [a,b] of [[-H,alcoveLeft],[alcoveRight,dx-dw/2],[dx+dw/2,H]]){
    box(g,[b-a,h,.18],[(a+b)/2,h/2,-d],m.plaster);
    box(g,[b-a,.9,.035],[(a+b)/2,.45+rise,-d+.10],m.darkGreen);
  }
  box(g,[dw,h-doorTop,.18],[dx,(h+doorTop)/2,-d],m.darkGreen);
  box(g,[dw-.07,2.07,.055],[dx,rise+1.035,-d-.06],m.oak);
  box(g,[dw-.20,.58,.025],[dx,rise+1.66,-d-.015],m.glass);
  box(g,[.16,.032,.07],[dx+.35,rise+.99,-d+.005],m.steel);
  const alcoveMid=(alcoveLeft+alcoveRight)/2,alcoveW=alcoveRight-alcoveLeft;
  box(g,[alcoveW,h,.13],[alcoveMid,h/2,-d-.86],m.recess);
  for(const x of [alcoveLeft,alcoveRight])box(g,[.10,h,.92],[x,h/2,-d-.42],m.darkGreen);
  box(g,[alcoveW,.16,.96],[alcoveMid,h-.08,-d-.41],m.white);
  box(g,[alcoveW-.14,.78,.36],[alcoveMid,rise+.39,-d-.55],m.plaster);
  box(g,[alcoveW-.04,.085,.49],[alcoveMid,rise+.83,-d-.51],m.stone);
  box(g,[alcoveW-.10,.035,.9],[alcoveMid,rise-.017,-d-.40],m.tile);
  box(g,[.73,.028,.20],[alcoveMid,h-.17,-d-.38],m.lamp);
  for(let i=0;i<4;i++)box(g,[dw-.12,.033,.042],[dx,doorTop+.10+i*.075,-d+.11],m.iron);
  box(g,[.14,.11,.02],[-H+.018,.54,-d*.16],m.white,{rotate:[0,Math.PI/2,0]});
  for(const s of [-1,1])box(g,[.018,.028,.012],[-H+.041,.54,-d*.16+s*.023],m.iron);
  box(g,[.008,.20,.14],[-H+.008,1.82,-d*.18],m.white);
  g.userData.ramp={start:rampStart,end:landingStart,split,rise};
}

export function makePassages(kit,texture){
  const m=hallwayMaterials(texture),halls=[],pending=[];
  function install(parent,label,{x=0,y=.12,z=0,reverse=false,depth,width=5.28,floors=1,rise=3.7,height=3.16,opening=0}){
    const shell=kit.group('Pasillos · '+label);parent.add(shell);
    shell.position.set(x,y,z);shell.rotation.y=reverse?Math.PI:0;
    shell.scale.set(1/parent.scale.x,1,1/parent.scale.z);
    const level=kit.group(label+' · pasillo 1');shell.add(level);
    hallway(kit,m,level,width,depth,height);
    if(opening){
      // Exterior trim belongs only at grade; upper levels retain their existing windows.
      const threshold=kit.group('Ingreso · '+label);parent.add(threshold);
      threshold.position.copy(shell.position);threshold.scale.copy(shell.scale);threshold.rotation.copy(shell.rotation);
      const head=2.72-y;
      for(const side of [-1,1])kit.box(threshold,[.073,head,.30],[side*(opening/2-.037),head/2,0],m.darkGreen);
      kit.box(threshold,[opening,.092,.30],[0,head-.046,0],m.darkGreen);
      const sill=new THREE.PlaneGeometry(opening,1);sill.rotateX(-Math.PI/2);sill.translate(0,0,.5);
      const positions=sill.attributes.position,uv=sill.attributes.uv;
      for(let i=0;i<positions.count;i++){
        const z=positions.getZ(i);positions.setY(i,(.035-y)*z);
        uv.setXY(i,positions.getX(i)/1.44,-z/1.44);
      }
      sill.computeVertexNormals();kit.mesh(threshold,'Umbral del pasillo',sill,m.tile);
    }
    const record={label,shell,level,depth,width,floors,rise};
    halls.push(record);pending.push(record);
    return record;
  }
  function furnish(bench){
    for(const {label,shell,level,width,depth,floors,rise} of pending){
      const bank=bench.clone(true);bank.name='Banca de espera · '+label;
      bank.position.set(-width/2+.39,.012,-depth*.49);bank.rotation.set(0,-Math.PI/2,0);
      level.add(bank);
      for(let i=1;i<floors;i++){
        const next=level.clone(true);next.name=label+' · pasillo '+(i+1);
        next.position.y=i*rise;shell.add(next);
      }
    }
  }
  return {install,furnish,halls,materials:m};
}
