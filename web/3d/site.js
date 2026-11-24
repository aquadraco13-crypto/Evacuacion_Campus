import * as THREE from './three.module.js';
import {blockHCenter,blockHBearing,blockHFountain,buildBlockH} from './block-h.js';
import {diningCenter,diningBearing,buildDiningHall} from './dining-hall.js';
import {entryAngle} from './academic-entry.js';
import {buildCoveredLink} from './covered-link.js';

// The reference is the 562 × 516 map crop. Ground distances use a shared estimated scale.
const metersPerPixel = .59;
export function sitePoint([u,v],y=0) {
  // Widen the central court while keeping the buildings on either side rigid.
  const smooth=THREE.MathUtils.smoothstep;
  const eastOffset=20*smooth(u,248,306)*(1-smooth(u,465,533))*smooth(v,110,160)*(1-smooth(v,286,316));
  return [(u-260)*metersPerPixel+eastOffset,y,(v-223)*metersPerPixel];
}

// Make room on the model's laboratory side, moving the grass edge, sidewalk and
// bordering street together. The old plan is still the coordinate system for buildings.
export function expandSectorP([u,v]){
  const t=Math.max(0,Math.min(1,(u-286)/125,(521-u)/95));
  const blend=t*t*(3-2*t);
  return [u+26*blend,v-20*blend];
}
export const boundary = [
  ...[[10,121],[61,75],[111,36],[163,8],[178,8],[208,34],[240,62],[294,104],[345,144],
  [392,183],[431,219],[470,251],[514,286]].map(expandSectorP),[521,295],[498,330],[466,380],[430,440],
  [391,502],[364,542],[353,544],[327,520],[298,484],[257,433],[213,379],[170,326],
  [127,271],[88,221],[49,176],[17,136]
];

const borderWalk = [
  ...[[26,129],[65,96],[115,50],[166,23],[178,24],[232,70],[283,113],[337,153],[383,192],
  [426,230],[471,267],[505,293]].map(expandSectorP),[481,330],[448,380],[415,434],[378,492],[355,526],
  [327,496],[289,449],[249,399],[204,344],[161,289],[116,231],[73,180]
];

function planePolygon(polygon, tile=10) {
  const geometry=new THREE.ShapeGeometry(new THREE.Shape(polygon.map(point=>{
    const [x,,z]=sitePoint(point);
    return new THREE.Vector2(x,-z);
  })));
  geometry.rotateX(-Math.PI/2);
  const {position,uv}=geometry.attributes;
  for(let i=0;i<position.count;i++) uv.setXY(i,position.getX(i)/tile,position.getZ(i)/tile);
  return geometry;
}

function polygonBase(polygon, height) {
  const shape=new THREE.Shape(polygon.map(point=>{
    const [x,,z]=sitePoint(point);
    return new THREE.Vector2(x,-z);
  }));
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false});
  geometry.rotateX(-Math.PI/2);
  return geometry;
}

function pathSurface(points,width,y,pattern=0) {
  const path=new THREE.CatmullRomCurve3(points.map(point=>new THREE.Vector3(...sitePoint(point,y))));
  const segments=Math.max(13,points.length*8);
  const positions=[], uvs=[], indices=[];
  let distance=0;
  let previous=path.getPointAt(0);
  for(let i=0;i<=segments;i++) {
    const t=i/segments;
    const p=path.getPointAt(t);
    const tangent=path.getTangentAt(t);
    distance+=p.distanceTo(previous);
    previous=p;
    for(const side of [-1,1]){
      const x=p.x-tangent.z*width*.5*side, z=p.z+tangent.x*width*.5*side;
      positions.push(x,p.y,z);
      uvs.push(pattern?x/pattern:(side+1)/2,pattern?z/pattern:distance/6);
    }
    if(i>0){
      const a=i*2-2;
      indices.push(a,a+1,a+2,a+1,a+3,a+2);
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function fitGroup(object, origin, mapLocation, angle=0, across=1, depth=1) {
  object.scale.set(across,1,depth);
  object.rotation.y=angle;
  const delta=new THREE.Vector3(origin[0]*across,0,origin[1]*depth).applyAxisAngle(new THREE.Vector3(0,1,0),angle);
  object.position.set(...sitePoint(mapLocation,object.position.y)).sub(delta);
}

export function buildSite(kit,mat,brickBlock,brickUV,tree,pavilion,person,palm) {
  const {group,mesh,box,part}=kit;
  const curb=new THREE.MeshStandardMaterial({name:'Bordillo claro',color:0xd3cabc,roughness:.89});
  const road=new THREE.MeshStandardMaterial({name:'Asfalto',color:0x535b58,roughness:.95});
  const paleRoad=new THREE.MeshStandardMaterial({name:'Calzada Diagonal 21',color:0x777468,roughness:.94});
  const lane=new THREE.MeshStandardMaterial({name:'Señalización horizontal',color:0xdfd3ac,roughness:.94});
  const water=new THREE.MeshStandardMaterial({name:'Agua de la fuente',color:0x508a87,metalness:.22,roughness:.24});
  const roofMetal=new THREE.MeshStandardMaterial({name:'Lámina blanca',color:0xc1c5ba,metalness:.19,roughness:.61});
  const roofConcrete=new THREE.MeshStandardMaterial({name:'Cubierta de concreto gris',color:0x9c978b,roughness:.92});
  const cylinder = new THREE.CylinderGeometry(1,1,1,48);
  const floor=group('Predio de la sede Sabanas');
  mesh(floor,'Base con la forma del perímetro',polygonBase(boundary,1),mat.base,[0,-1.12,0]).castShadow=false;
  mesh(floor,'Césped del predio',planePolygon(boundary),mat.grass,[0,-.06,0]).castShadow=false;

  function surface(parent,name,polygon,material,y=.012,repeat=11){
    mesh(parent,name,planePolygon(polygon,repeat),material,[0,y,0]).castShadow=false;
  }
  function path(parent,name,points,width,material,y=.02,pattern=0){
    mesh(parent,name,pathSurface(points,width,y,pattern),material).castShadow=false;
  }
  const sidewalks=group('Aceras y calles de referencia');
  const carrera=[[5,132],[70,212],[144,307],[219,400],[295,495],[348,555]];
  const transverse=[[175,-4],[224,34],[303,99],[386,166],[430,201],[470,232],[529,282]].map(expandSectorP);
  const calle=[[3,113],[54,67],[109,29],[157,2],[173,-6]];
  const diagonal=[[536,286],[509,329],[464,403],[418,482],[378,540],[365,556]];
  path(sidewalks,'Carrera 30 · borde de la calzada',carrera,8,curb,-.036);
  path(sidewalks,'Carrera 30',carrera,6.5,road,-.004);
  path(sidewalks,'Transversal 29 · borde de la calzada',transverse,7.5,curb,-.036);
  path(sidewalks,'Transversal 29',transverse,6,road,-.004);
  path(sidewalks,'Calle 19C',calle,5.4,road,-.006);
  path(sidewalks,'Diagonal 21 · borde de la calzada',diagonal,15.1,curb,-.036);
  path(sidewalks,'Diagonal 21',diagonal,13.3,paleRoad,-.004);
  path(sidewalks,'Separador central de la Diagonal 21',diagonal,1.05,curb,.008);
  for(const [a,b] of [[[525,310],[518,322]],[[497,357],[490,367]],[[465,410],[458,421]],[[430,464],[423,475]],[[395,518],[388,528]]]){
    for(const offset of [-3.1,3.1]){
      const shift=point=>[point[0]+offset,point[1]+offset*.52];
      path(sidewalks,'Marcas viales',[shift(a),shift(b)],.13,lane,.009);
    }
  }
  path(sidewalks,'Andén alrededor del predio', [...borderWalk,borderWalk[0]],2.2,mat.pavement,.012);
  const access=group('Vía interna y accesos');
  const ringRoad=[[120,259],[98,228],[102,180],[115,151],[178,139],[242,133],[297,137],[338,158],[366,187],[384,218],[384,259],[368,302],[380,335],[400,363],[441,406]];
  path(access,'Anillo de circulación',ringRoad,4.9,road,.027);
  path(access,'Conexión de la Transversal 29',[[366,207],[394,204],[423,198],expandSectorP([426,201])],5.8,road,.029);

  const paving=group('Plazas y senderos del campus');
  surface(paving,'Plaza central',[[230,188],[295,189],[299,225],[292,251],[303,276],[325,290],[356,317],[380,345],[361,375],[335,354],[320,332],[301,312],[278,296],[246,285],[226,258],[228,229]],mat.pavement,.023,11.6);
  surface(paving,'Patio occidental',[[116,182],[181,178],[235,195],[233,229],[222,283],[193,291],[157,273],[126,237],[107,214]],mat.pavement,.019,11.6);
  surface(paving,'Explanada de acceso',[[356,365],[394,328],[439,334],[473,367],[449,404],[430,441],[409,455],[366,414],[342,390]],mat.pavement,.018);
  path(paving,'Paseo del jardín sur',[[206,292],[239,310],[274,312],[282,346],[295,371],[307,389],[353,407]],3.6,mat.pavement,.028,11.6);
  path(paving,'Sendero lateral de los bloques',[[302,176],[328,184],[356,205],[362,247],[358,287],[337,306]],3.2,mat.pavement,.025,11.6);
  path(paving,'Paso del Bloque I a la cafetería',[[306,215],[307,207],[312,202],[326,195]],3.8,mat.pavement,.030,11.6);
  path(paving,'Paseo entre los bloques I y P',[[362,257],[373,255],[383,253],[394,251],[407,249]],3.3,mat.pavement,.042,11.6);

  surface(paving,'Plaza de la Fuente UPC',[[54,101],[106,65],[124,45],[190,32],[224,68],[258,98],[237,122],[191,126],[137,138],[96,158],[63,167]],mat.pavement,.014);
  const font=group('Sector Fuente UPC');
  fitGroup(font,[0,0],[153,84],-.56);
  const basin=group('Fuente UPC · fuente y jardín de plaza');
  const fountain=sitePoint(blockHFountain);
  const at=(y)=>[fountain[0],y,fountain[2]];
  part(basin,cylinder,mat.structure,[4.1,.35,4.1],at(.232));
  part(basin,cylinder,mat.ivory,[3.91,.14,3.91],at(.39));
  part(basin,cylinder,water,[3.55,.025,3.55],at(.469));
  part(basin,cylinder,mat.structure,[.54,.57,.54],at(.71));
  part(basin,cylinder,water,[1.41,.06,1.41],at(.99));
  part(basin,cylinder,mat.ivory,[.15,.48,.15],at(1.23));
  for(const side of [-1,1]) {
    box(font,[3,.14,.56],[side*4.7,.49,7.2],mat.bench);
    box(font,[.34,.42,.39],[side*4.7,.21,7.2],mat.structure);
  }

  const blockH=buildBlockH({group,box,mesh,part},mat,brickUV,roofConcrete);
  fitGroup(blockH,[0,0],blockHCenter,blockHBearing);
  const dining=buildDiningHall(kit,mat,tree);
  fitGroup(dining,[0,0],diningCenter,diningBearing);

  const round=group('Edificio circular junto a la Diagonal 21');
  const drumGeo=new THREE.CylinderGeometry(1,1,1,64);
  const arc=2*Math.PI-2*entryAngle;
  const brickDrum=new THREE.CylinderGeometry(1,1,1,64,1,true,entryAngle,arc);
  const brickUv=brickDrum.attributes.uv;
  for(let i=0;i<brickUv.count;i++)brickUv.setXY(i,brickUv.getX(i)*44,brickUv.getY(i)*4.1);
  // Leave the entrance and interior free all the way down to the new threshold.
  const ring=new THREE.Shape();
  const angles=Array.from({length:65},(_,i)=>entryAngle+arc*i/64);
  const outline=[...angles.map(t=>[20.10*Math.sin(t),-20.10*Math.cos(t)]),
    ...angles.slice().reverse().map(t=>[18.08*Math.sin(t),-18.08*Math.cos(t)])];
  outline.forEach(([x,z],i)=>i?ring.lineTo(x,z):ring.moveTo(x,z));
  ring.closePath();
  const plinth=new THREE.ExtrudeGeometry(ring,{depth:.35,bevelEnabled:false});
  plinth.rotateX(-Math.PI/2);mesh(round,'Zócalo circular abierto en el acceso',plinth,mat.structure,[0,.005,0]);
  part(round,brickDrum,mat.brick,[18.9,5.8,18.9],[0,3.02,0]);
  part(round,brickDrum,mat.dark,[19.16,1.46,19.16],[0,4.7,0]);
  part(round,drumGeo,mat.structure,[19.96,.28,19.96],[0,5.94,0]);
  const domeProfile=[[20.15,6.23],[17.7,6.67],[14.3,7.19],[10.7,7.68],[6.8,8.03],[3,8.32],[0,8.45]].map(([x,y])=>new THREE.Vector2(x,y));
  const dome=new THREE.LatheGeometry(domeProfile,72);
  mesh(round,'Cubierta circular con cúpula',dome,roofConcrete);
  const centerCap=new THREE.SphereGeometry(3.9,32,14,0,2*Math.PI,0,Math.PI/2);
  const domeCap=mesh(round,'Lucernario central',centerCap,roofMetal,[0,8.21,0]);
  domeCap.scale.y=.71;
  for(let i=0;i<28;i++){
    const angle=i*Math.PI/14;
    const [x,z]=[Math.sin(angle),Math.cos(angle)].map(value=>value*19.14);
    if(z>0 && Math.abs(x)<5.65)continue;
    box(round,[.25,5.3,.36],[x,2.97,z],mat.structure,{rotate:[0,angle,0]});
  }
  fitGroup(round,[0,0],[440,319],-.74,1.08,1.20);

  const large=group('Edificio de cubierta amplia · extremo sur');
  brickBlock(large,{x:0,z:0,w:52,d:58,floors:2,floor:4.08,bays:9,narrow:true,entry:{side:'back',center:0,width:2.95}});
  box(large,[53.4,.34,59.2],[0,8.36,0],roofConcrete);
  box(large,[51.7,.07,57.5],[0,8.565,0],mat.structure);
  for(let i=0;i<8;i++){
    box(large,[.045,.025,57.4],[-22+i*6.28,8.61,0],roofConcrete,{shadow:false});
  }
  for(let j=0;j<8;j++){
    box(large,[51.6,.025,.042],[0,8.612,-25+j*7.14],roofConcrete,{shadow:false});
  }
  box(large,[7.1,1.45,4.3],[-2.8,9.28,4],mat.brick,{...brickUV,rotate:[0,-.65,0]});
  box(large,[7.4,.16,4.55],[-2.8,10.09,4],roofConcrete,{rotate:[0,-.65,0]});
  fitGroup(large,[0,0],[345,448],.055,1.0,.92);

  const roadCurve=new THREE.CatmullRomCurve3(ringRoad.map(p=>new THREE.Vector3(...sitePoint(p))));
  buildCoveredLink(kit,mat,pavilion,round,roadCurve,person,tree,palm);
  return {round,large,blockH};
}
