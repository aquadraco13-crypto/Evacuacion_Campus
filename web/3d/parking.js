import * as THREE from './three.module.js';

function paint(name,color,metalness=.15,roughness=.48) {
  return new THREE.MeshStandardMaterial({name,color,metalness,roughness});
}

function loft(sections, profile) {
  const vertices=[],indices=[];
  const slice=profile(sections[0]).length;
  for(const section of sections) for(const point of profile(section)) vertices.push(...point);
  for(let i=0;i<sections.length-1;i++){
    for(let j=0;j<slice;j++){
      const a=i*slice+j,b=i*slice+(j+1)%slice;
      indices.push(a,a+slice,b,b,a+slice,b+slice);
    }
  }
  for(let j=1;j<slice-1;j++){
    const n=vertices.length/3-slice;
    indices.push(0,j,j+1,n,n+j+1,n+j);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function gravelTexture() {
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=384;
  const context=canvas.getContext('2d');
  context.fillStyle='#a29881';
  context.fillRect(0,0,384,384);
  let state=818;
  const random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);
  for(let i=0;i<5700;i++){
    const x=random()*384,y=random()*384,r=.32+random()**2*3.7;
    context.fillStyle=['#746f62','#bcb29a','#959387','#c5b899','#857a65'][i%5];
    for(const sx of [-384,0,384]) for(const sy of [-384,0,384]){
      if(x+sx+r<0 || x+sx-r>384 || y+sy+r<0 || y+sy-r>384) continue;
      context.beginPath();
      context.ellipse(x+sx,y+sy,r,.64*r,(i%12)*.23,0,Math.PI*2);
      context.fill();
    }
  }
  const map=new THREE.CanvasTexture(canvas);
  map.colorSpace=THREE.SRGBColorSpace;
  map.wrapS=map.wrapT=THREE.RepeatWrapping;
  map.anisotropy=8;
  return map;
}

export function buildParking({group,box,mesh,part},parent,mat) {
  const lot=group('Bloque H · Estacionamiento');
  parent.add(lot);
  const soil=paint('Gravilla beige del estacionamiento',0xffffff,0,.91);
  soil.map=gravelTexture();
  box(lot,[38,.06,10.85],[0,.033,33.06],soil,{repeat:[3.8,3.8],shadow:false});
  box(lot,[38,.20,.23],[0,.094,27.78],mat.structure);
  box(lot,[38,.07,1.30],[0,.117,27.0],mat.structure);
  for(let i=0;i<19;i++){
    box(lot,[.022,.008,1.29],[-18+i*2,.156,27.0],mat.frame,{shadow:false});
  }

  const tire=paint('Caucho de neumáticos',0x212322,0,.92);
  const wheel=paint('Aluminio de llantas',0x9da2a0,.52,.41);
  const wheelDark=paint('Huecos de llantas',0x303635,.15,.69);
  const tint=paint('Cristal ahumado',0x293a40,.23,.22);
  tint.emissive.setHex(0x13242c);
  tint.emissiveIntensity=.27;
  const trim=paint('Molduras de autos',0x242a2a,.18,.49);
  const chrome=paint('Molduras metálicas',0xa6aaa6,.53,.32);
  const red=paint('Luces traseras',0x9f322d,.25,.26);
  const reflector=paint('Reflectores rojos',0xc95744,.2,.33);
  const headlight=paint('Faros delanteros',0xdbe2da,.12,.29);
  const yellow=paint('Placas amarillas',0xd2ae46,.1,.54);
  const plateInk=paint('Caracteres de matrícula',0x4b432b,0,.87);
  const cylinder=new THREE.CylinderGeometry(1,1,1,20);
  const ring=new THREE.TorusGeometry(1,.043,6,24);
  const shellStations=[[-2.19,.70,.56,.35],[-2.04,.84,.73,.31],[-1.70,.90,.81,.32],
    [-1.10,.91,.88,.33],[-.55,.93,.93,.32],[.37,.93,.94,.31],[1.0,.91,.93,.31],
    [1.56,.90,.85,.32],[1.99,.85,.81,.32],[2.17,.72,.77,.38]];
  const wheelZ=[-1.37,1.37];
  const arch=.383;
  const arcSamples=wheelZ.flatMap(z=>Array.from({length:11},(_,i)=>z+arch*Math.cos(i*Math.PI/10)));
  const bodySlices=[...shellStations.map(([z])=>z),...arcSamples].sort((a,b)=>a-b).map(z=>{
    const upper=shellStations.findIndex(s=>s[0]>=z);
    const a=shellStations[Math.max(0,upper-1)],b=shellStations[upper];
    const mix=a===b?0:(z-a[0])/(b[0]-a[0]);
    const w=THREE.MathUtils.lerp(a[1],b[1],mix), top=THREE.MathUtils.lerp(a[2],b[2],mix);
    const bottom=THREE.MathUtils.lerp(a[3],b[3],mix);
    const gap=Math.min(...wheelZ.map(axle=>Math.abs(z-axle)));
    const archY=gap<arch ? .338+Math.sqrt(arch*arch-gap*gap) : bottom;
    return [z,w,top,Math.max(bottom,archY)];
  });
  const body=loft(bodySlices,([z,w,top,base])=>[
    [-.78*w,top,z],[.78*w,top,z],[w,top-.105,z],
    [w,base,z],[.91*w,base-.022,z],[-.91*w,base-.022,z],[-w,base,z],[-w,top-.105,z]
  ]);
  const roof=loft([[-.53,.61,1.356],[-.34,.66,1.43],[.33,.67,1.455],[.61,.62,1.40],[.72,.55,1.35]],
    ([z,w,h])=>[[-w,h-.05,z],[-w*.73,h,z],[w*.73,h,z],[w,h-.05,z],[w,h-.082,z],[-w,h-.082,z]]);
  const rounded=new THREE.SphereGeometry(1,12,8);

  function pane(car,name,points,surface){
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));
    g.setIndex([0,1,2,0,2,3]);
    g.computeVertexNormals();
    mesh(car,name,g,surface);
  }
  tint.side=THREE.DoubleSide;

  for(const [name,color,x,z,angle,length] of [
    ['Sedán rojo',0x731c22,-5.2,32.27,.07,.95],
    ['Sedán plateado',0xc9ceca,-.45,32.03,.63,1.04],
    ['Auto gris',0x575d60,4.05,32.12,.52,.98]
  ]){
    const car=group('Bloque H · '+name);
    lot.add(car);
    car.position.set(x,.065,z);
    car.rotation.y=angle;
    car.scale.set(1,1,length);
    const finish=paint(name+' · pintura',color,.39,.35);
    const bodyMaterial=finish.clone();
    bodyMaterial.side=THREE.DoubleSide;
    mesh(car,'Carrocería',body,bodyMaterial);
    mesh(car,'Techo',roof,bodyMaterial);
    pane(car,'Parabrisas',[[-.776,.895,-1.13],[.776,.895,-1.13],[.61,1.31,-.53],[-.61,1.31,-.53]],tint);
    pane(car,'Luneta trasera',[[-.55,1.321,.71],[.55,1.321,.71],[.775,.895,1.36],[-.775,.895,1.36]],tint);
    for(const side of [-1,1]){
      const s=v=>side*v;
      pane(car,'Vidrios laterales',[[s(.786),.91,-1.11],[s(.611),1.31,-.53],[s(.552),1.325,.71],[s(.786),.915,1.33]],tint);
      box(car,[.052,.405,.076],[s(.694),1.107,.08],trim,{rotate:[0,0,-side*.45]});
      box(car,[.049,.304,.062],[s(.713),1.049,.76],finish,{rotate:[-.47,0,-side*.45]});
      box(car,[.038,.042,2.22],[s(.811),.915,.09],chrome);
      for(const pos of [-.17,.58]){
        box(car,[.033,.032,.152],[s(.929),.828,pos],chrome);
        box(car,[.012,.13,.011],[s(.935),.742,pos-.17],trim,{shadow:false});
      }
      box(car,[.19,.048,.072],[s(.87),.989,-.82],trim);
      part(car,rounded,finish,[.115,.054,.084],[s(1.016),1.025,-.83]);
      for(const axle of wheelZ){
        const hubX=s(.822);
        part(car,cylinder,tire,[.337,.197,.337],[hubX,.337,axle],[0,0,Math.PI/2]);
        part(car,cylinder,wheelDark,[.238,.024,.238],[s(.931),.337,axle],[0,0,Math.PI/2]);
        part(car,ring,wheel,[.233,.233,.233],[s(.947),.337,axle],[0,Math.PI/2,0]);
        for(let spoke=0;spoke<5;spoke++){
          const a=spoke*2*Math.PI/5;
          box(car,[.019,.165,.030],[s(.950),.337+Math.cos(a)*.105,axle+Math.sin(a)*.105],wheel,{rotate:[a,0,0],shadow:false});
        }
        part(car,cylinder,wheel,[.059,.026,.059],[s(.954),.337,axle],[0,0,Math.PI/2]);
      }
      box(car,[.29,.108,.045],[s(.525),.688,2.177],red,{rotate:[0,side*.26,0]});
      box(car,[.239,.028,.045],[s(.54),.636,2.18],reflector,{rotate:[0,side*.26,0]});
      box(car,[.248,.068,.06],[s(.584),.626,-2.111],headlight,{rotate:[0,-side*.35,0]});
    }
    box(car,[1.19,.13,.078],[0,.405,2.146],trim);
    box(car,[.48,.048,.022],[0,.646,2.176],chrome);
    box(car,[.285,.135,.017],[0,.525,2.178],yellow);
    for(let i=0;i<6;i++){
      box(car,[.013,.066,.009],[-.103+i*.041,.527,2.192],plateInk,{shadow:false});
    }
    box(car,[.87,.12,.045],[0,.448,-2.125],trim);
    for(let i=0;i<4;i++){
      box(car,[.78,.008,.020],[0,.412+i*.024,-2.151],chrome,{shadow:false});
    }
  }
}
