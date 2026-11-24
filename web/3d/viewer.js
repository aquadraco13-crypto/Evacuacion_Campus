import { montarNavegacion } from './navegacion.js';
import { montarRed } from './red.js';
import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';
import { GLTFExporter } from './GLTFExporter.js';
import {monumentCenter,monumentBearing} from './monument.js';
import { buildCampus } from './model.js';
import { boundary, expandSectorP, sitePoint } from './site.js';
import {blockPCenter,blockPBearing,blockPFloors,blockPRise} from './block-p.js';
import {blockPoint, elevatorZ, floorRise, stairEntryX, stairDownZ, stairUpZ} from './block-i.js';
import {blockHCenter,blockHBearing,blockHFountain} from './block-h.js';
import {diningCenter,diningBearing} from './dining-hall.js';
import {westCourtCenter,westCourtBearing} from './west-court.js';
import {cafeCenter,cafeBearing} from './block-i-cafe.js';
import {cafeACenter,cafeABearing} from './block-a-cafe.js';

const host = document.querySelector('.canvas-host');
const viewport = document.querySelector('.viewer');
const notice = document.querySelector('#notice');
const viewLabel = document.querySelector('#view-label');
const exportButton = document.querySelector('#export');
const exportStatus = document.querySelector('#export-status');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const touch = matchMedia('(pointer: coarse)');
const streetKey = document.querySelector('.street-key');
const sectorKey = document.querySelector('#sector-key');
const streetPoints = {calle:[72,55],transverse:expandSectorP([346,134]),carrera:[167,342],diagonal:[480,401]};
function localPoint(center,bearing,x,y,z){
  const [cx,,cz]=sitePoint(center);
  return [cx+x*Math.cos(bearing)+z*Math.sin(bearing),y,
    cz-x*Math.sin(bearing)+z*Math.cos(bearing)];
}

const cafePoint=(x,y,z)=>localPoint(cafeCenter,cafeBearing,x,y,z);
const hPoint=(x,y,z)=>localPoint(blockHCenter,blockHBearing,x,y,z);
const diningPoint=(x,y,z)=>localPoint(diningCenter,diningBearing,x,y,z);
const westCourtPoint=(x,y,z)=>localPoint(westCourtCenter,westCourtBearing,x,y,z);
const cafeAPoint=(x,y,z)=>localPoint(cafeACenter,cafeABearing,x,y,z);
const pPoint=(x,y,z)=>localPoint(blockPCenter,blockPBearing,x,y,z);

const views = {
  model: {label:'Maqueta general',direction:[.40,1.13,.87],target:sitePoint([259,255],4),fit:true},
  map: {label:'Vista desde arriba',direction:[0,1,.001],target:sitePoint([266,270]),fit:true},
  plaza: {label:'Plaza principal',position:sitePoint([281,272],1.7),target:sitePoint([258,189],5.2),fov:57},
  walks: {label:'Plaza techada',position:sitePoint([379,362],3.8),target:sitePoint([311,300],2.75),fov:59},
  cafeteria: {label:'Cafetería del Bloque I',position:cafePoint(-3.65,4.20,9.25),target:cafePoint(1.45,1.68,-1.42),fov:66,mobileFov:82},
  kioskI: {label:'Ventanilla del Bloque I',position:cafePoint(6.10,1.67,3.70),target:cafePoint(7.02,1.35,-3.12),fov:57,mobileFov:70},
  cafeA: {label:'Cafetería del Bloque A',position:cafeAPoint(7.50,1.85,-13.2),target:cafeAPoint(.6,2.12,-.68),fov:59,mobileFov:82},
  iceCream: {label:'Heladería · Bloque I',position:blockPoint(-15.18,1.73,-16.29),target:blockPoint(-14.22,1.41,-20.86),fov:69},
  monument: {label:'Monumento YO ♥ UPC',position:localPoint(monumentCenter,monumentBearing,-4.1,1.81,8.9),
    target:localPoint(monumentCenter,monumentBearing,0,1.15,0),fov:43,mobileFov:68},
  southGarden: {label:'Jardín sur',position:localPoint(monumentCenter,monumentBearing,-7.3,15.3,22),
    target:localPoint(monumentCenter,monumentBearing,0,1,-3.4),fov:51,mobileFov:73},
  fountain: {label:'Fuente UPC',position:hPoint(-15,2.35,31),target:sitePoint(blockHFountain,.72),fov:60},
  blockH: {label:'Fachada del Bloque H',position:hPoint(-.7,3.55,42.9),target:hPoint(-.85,7.1,13.9),fov:75,mobileFov:101},
  blockP: {label:'Bloque P · Patio',position:pPoint(-4.9,2.35,17.7),target:pPoint(1.15,8.10,-3.6),fov:71,mobileFov:85},
  labsP: {label:'Bloque P · Pasillo de laboratorios',position:pPoint(-15.15,1.66,-6.38),target:pPoint(-4.7,1.56,-6.96),fov:66,mobileFov:77},
  sectorP: {label:'Bloques I y P',direction:[-.45,1.35,.73],target:sitePoint([381,246],6),fit:'sectorP'},
  dining: {label:'Comedor universitario',position:diningPoint(5.2,2.35,27.2),target:diningPoint(.2,4.15,8.5),fov:78,mobileFov:101},
  arrival: {label:'Diagonal 21',position:sitePoint([488,387],6.2),target:sitePoint([423,346],4.25),fov:63},
  coveredLink: {label:'Pasaje cubierto',position:sitePoint([469,377],40),target:sitePoint([404,366],3.3),fov:48,mobileFov:73},
  underVault: {label:'Bajo la bóveda',position:sitePoint([397,388],1.72),target:sitePoint([413,348],4.05),fov:73,mobileFov:86},
  garden: {label:'Patio arbolado',position:westCourtPoint(5.8,1.78,20.4),target:westCourtPoint(.23,1.25,7.4),fov:55,mobileFov:69},
  gardenPlan: {label:'Patio desde arriba',position:westCourtPoint(-3,62,55),target:westCourtPoint(0,1,4),fov:46,mobileFov:65},
  gardenPassage: {label:'Paso del patio',position:westCourtPoint(.95,3.35,14.9),target:westCourtPoint(.95,2.6,-14.3),fov:59,mobileFov:80},
  gardenAC: {label:'Andén de los aires',position:westCourtPoint(-10.02,1.82,20.45),target:westCourtPoint(-13.33,.50,10.85),fov:53,mobileFov:67},
  gardenACBoth: {label:'Aires de ambos lados',position:westCourtPoint(-1.7,2.55,24.4),target:westCourtPoint(-.8,1.0,3.2),fov:85,mobileFov:105}
};

function launch() {
  const renderer = new THREE.WebGLRenderer({antialias:true,alpha:true,logarithmicDepthBuffer:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.55));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.13;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', 'Modelo tridimensional. Flechas para girar, más y menos para acercar o alejar.');
  host.append(canvas);
  if (touch.matches) document.querySelector('#controls-hint').textContent = 'Arrastra para girar · Pellizca para acercarte';

  const scene = new THREE.Scene();
  const {root:model,blockI,frontA,admin,halls} = buildCampus();
  scene.add(model);
  const approach=(x,y,z)=>frontA.localToWorld(new THREE.Vector3(x,y,z)).toArray();
  let pisoPasillo=0;
  function corridorView(hall){
    const i=pisoPasillo;
    const p=(x,y,z)=>hall.shell.localToWorld(new THREE.Vector3(x,i*hall.rise+y,z)).toArray();
    return {label:hall.label+' · Pasillo del piso '+(i+1),
      position:p(.55,1.57,-.095*hall.depth),target:p(-.43,1.10,-hall.depth*.72),fov:65,mobileFov:80};
  }
  const adminPoint=(x,y,z)=>admin.localToWorld(new THREE.Vector3(x,y,z)).toArray();
  views.adminEntry={label:'Acceso académico-administrativo',position:adminPoint(-.41,1.81,8.85),
    target:adminPoint(-.05,2.62,-.15),horizontalFov:60};
  const gateway=model.getObjectByName('Entrada principal UPC');
  const gatePoint=(x,y,z)=>gateway.localToWorld(new THREE.Vector3(x,y,z)).toArray();
  views.mainGate={label:'Entrada principal',position:gatePoint(-.45,2.40,30.5),
    target:gatePoint(.0,3.30,-1.3),horizontalFov:51};
  views.frontI={label:'Frente del Bloque I',position:approach(-4.95,1.71,59.4),
    target:approach(-4.12,-1.7,4.0),fov:61,mobileFov:76};
  views.centralSquare={label:'Plaza central ampliada',position:approach(-35,42,73),
    target:approach(-6,.3,28),fov:53,mobileFov:74};
  views.facadeA={label:'Galerías del Bloque A',position:approach(-13.0,2.25,16.10),
    target:approach(-2.45,7.35,1.05),fov:67,mobileFov:83};
  const camera = new THREE.PerspectiveCamera(40, 1, 0.08, 1800);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = !reducedMotion.matches;
  controls.dampingFactor = 0.10;
  controls.rotateSpeed = 0.64;
  controls.minDistance = 0.9;
  controls.maxDistance = 1200;
  controls.maxPolarAngle = Math.PI * .58;
  controls.minPolarAngle = .001;

  scene.add(new THREE.HemisphereLight(0xf0f9ff, 0xb5aa91, 1.86));
  const sun = new THREE.DirectionalLight(0xffe3be, 2.55);
  sun.position.set(-160, 145, 87);
  sun.target.position.set(0, 0, 0);
  sun.castShadow = true;
  const shadowSize = touch.matches ? 2048 : 4096;
  sun.shadow.mapSize.set(shadowSize,shadowSize);
  Object.assign(sun.shadow.camera, {left:-187, right:187, bottom:-175, top:175, near:5, far:525});
  sun.shadow.normalBias = .023;
  sun.shadow.bias = -.00007;
  scene.add(sun, sun.target);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), new THREE.ShadowMaterial({color:0x454e42, opacity:.14}));
  ground.rotation.x = -Math.PI/2;
  ground.position.y = -1.126;
  ground.receiveShadow = true;
  scene.add(ground);

  const outline = [...boundary,[-5,113],[172,-12],[550,285],[365,570],
    [237,156],[298,163],[354,218]].map((point,i,points)=>
      new THREE.Vector3(...sitePoint(point,i>=points.length-3?17:0)));
  outline.push(...[-20,20].map(x=>new THREE.Vector3(...hPoint(x,20,14))));
  const sectorOutline=[];
  for(const x of [-17,17])for(const z of [-13,11])for(const y of [0,18.3]){
    const corner=new THREE.Vector3(...pPoint(x,y,z));sectorOutline.push(corner);outline.push(corner);
  }
  for(const x of [-18,18])for(const z of [-23,23])for(const y of [0,15.1])
    sectorOutline.push(new THREE.Vector3(...blockPoint(x,y,z)));
  const roofs={i:blockPoint(0,15.3,0),p:pPoint(0,18.4,-8)};
  let selected = 'model';
  let pFloor=0;
  let activeFloor = 0;
  let cut = false;
  let interiorMode = 'corridor';
  let queued = false;
  let colocarRotulos;
  let estudianteSeguido = null;
  const posicionAnterior = new THREE.Vector3(), avance = new THREE.Vector3();

  const modosI={blockI:'corridor',stairsI:'stairs',cutI:'corridor',lookoutI:'lookout',elevator:'elevator'};
  const mostrarNavegacion=montarNavegacion(halls,applyView,i=>{
    if(!selected) return;
    if(Object.hasOwn(modosI,selected)){
      activeFloor=i;
      applyView(selected==='lookoutI' && !i?'blockI':selected);
    }else if(selected.startsWith('hall-')){
      pisoPasillo=i;
      applyView(selected);
    }else{
      pFloor=i;
      applyView(selected==='stairsP'?'stairsP':i===0?'labsP':'upperP');
    }
  });

  function viewInsideP(name){
    const y=pFloor*blockPRise;
    if(name==='upperP')return {label:'Bloque P · Pasillo del piso '+(pFloor+1),
      position:pPoint(3.16,y+1.65,-6.15),target:pPoint(-8.63,y+1.55,-5.73),fov:66,mobileFov:76};
    if(pFloor===blockPFloors-1)return {label:'Bloque P · Escalera · Piso '+(pFloor+1),
      position:pPoint(-12.18,y+1.72,-5.17),target:pPoint(-13.61,y-1.05,-2.12),fov:73,mobileFov:86};
    return {label:'Bloque P · Escalera · Piso '+(pFloor+1),
      position:pPoint(-8.76,y+1.58,-6.17),target:pPoint(-13.50,y+1.76,-2.55),fov:64,mobileFov:76};
  }

  function interiorView() {
    const y=.13+activeFloor*floorRise;
    if(cut) return {label:'Bloque I · Piso '+(activeFloor+1)+' en corte',
      position:blockPoint(-27,y+17,20),target:blockPoint(-13,y+.35,0),fov:60};
    if(interiorMode==='elevator') return {label:'Ascensor · Piso '+(activeFloor+1),
      position:blockPoint(-14.54,y+1.51,elevatorZ+.47),
      target:blockPoint(-17.56,y+1.16,elevatorZ),fov:61};
    if(interiorMode==='lookout') return {label:'Cafetería desde el piso '+(activeFloor+1),
      position:blockPoint(-14.1,y+1.69,-21.86),target:sitePoint(cafeCenter,.78),fov:56};
    if(interiorMode==='stairs'){
      const lower = Math.min(activeFloor,2);
      const stairY = .13+lower*floorRise;
      return {label:'Escalera · Pisos '+(lower+1)+' y '+(lower+2),
        position:blockPoint(-16.23,stairY+1.62,(stairDownZ+stairUpZ)/2),
        target:blockPoint(stairEntryX+.9,stairY+1.36,(stairDownZ+stairUpZ)/2),fov:66};
    }
    if(activeFloor===0) return {label:'Bloque I · Piso 1',
      position:blockPoint(-14.64,y+1.59,-8.7),target:blockPoint(-14.14,y+1.42,-21.5),fov:62};
    return {label:'Bloque I · Piso '+(activeFloor+1),
      position:blockPoint(-14.88,y+1.60,-19.38),target:blockPoint(-14.22,y+1.56,17.5),fov:62};
  }
  function updateBlockVisibility(interior) {
    for (const [i,level] of blockI.levels.entries()) level.visible = !interior || !cut || i<=activeFloor;
    for (const [i,stair] of blockI.stairs.entries()) stair.visible = !interior || !cut || i<activeFloor;
    blockI.roof.visible = !interior || !cut;
  }
  function render() {
    queued = false;
    if (estudianteSeguido) {
      avance.subVectors(estudianteSeguido,posicionAnterior);
      camera.position.add(avance);
      controls.target.add(avance);
      posicionAnterior.copy(estudianteSeguido);
    }
    controls.update();
    renderer.render(scene, camera);
    colocarRotulos?.();
    if (selected === 'map' || selected === 'sectorP') {
      const street=selected==='map';
      for (const marker of (street?streetKey:sectorKey).children) {
        const location=street?sitePoint(streetPoints[marker.dataset.street]):roofs[marker.dataset.block];
        const p = new THREE.Vector3(...location).project(camera);
        marker.style.left = `${50+50*p.x}%`;
        marker.style.top = `${50-50*p.y}%`;
      }
    }
  }
  function requestFrame() {
    if (!queued) {
      queued = true;
      requestAnimationFrame(render);
    }
  }
  function applyView(name) {
    estudianteSeguido = null;
    const anterior=selected;
    selected=name;
    const interior=Object.hasOwn(modosI,name);
    const hall=name.startsWith('hall-')?halls[Number(name.slice(5))]:null;
    const interiorP=['labsP','upperP','stairsP'].includes(name);
    if(interior){
      interiorMode=modosI[name];
      cut=name==='cutI';
      if(name==='lookoutI') activeFloor=Math.max(1,activeFloor);
    }
    if(hall && anterior!==name) pisoPasillo=0;
    if(name==='labsP') pFloor=0;
    if(name==='upperP') pFloor=Math.max(1,pFloor);
    const view=hall?corridorView(hall):interior?interiorView():
      interiorP && name!=='labsP'?viewInsideP(name):views[name];
    mostrarNavegacion(name,interior?blockI.levels.length:interiorP?blockPFloors:hall?.floors,
      interior?activeFloor:interiorP?pFloor:pisoPasillo);
    updateBlockVisibility(interior);
    const target = new THREE.Vector3(...view.target);
    camera.fov = view.fit ? 37 : camera.aspect < .93 ? (view.mobileFov ?? view.fov+7) : view.fov;
    if(view.horizontalFov){
      const halfWidth=Math.tan(THREE.MathUtils.degToRad(view.horizontalFov/2));
      camera.fov=THREE.MathUtils.clamp(2*THREE.MathUtils.radToDeg(Math.atan(halfWidth/camera.aspect)),27,96);
    }
    viewport.dataset.camera = name === 'map' ? 'map' : view.fit ? 'aerial' : 'ground';
    streetKey.hidden = name !== 'map';
    sectorKey.hidden = name !== 'sectorP';
    if (view.fit) {
      const direction = new THREE.Vector3(...view.direction).normalize();
      const right = new THREE.Vector3().crossVectors(camera.up, direction).normalize();
      const up = new THREE.Vector3().crossVectors(direction, right).normalize();
      const vertical = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const horizontal = vertical * camera.aspect;
      let distance = 0;
      for (const corner of view.fit==='sectorP'?sectorOutline:outline) {
        const delta = corner.clone().sub(target);
        const atLeast = Math.max(Math.abs(delta.dot(right)) / (horizontal * .86), Math.abs(delta.dot(up)) / (vertical * .85));
        distance = Math.max(distance, delta.dot(direction) + atLeast);
      }
      camera.position.copy(target).addScaledVector(direction, distance);
    } else {
      camera.position.set(...view.position);
    }
    camera.updateProjectionMatrix();
    controls.target.copy(target);
    controls.update();
    viewLabel.textContent = view.label;
    requestFrame();
  }
  function enterFreeView() {
    estudianteSeguido = null;
    selected = null;
    mostrarNavegacion(null);
    streetKey.hidden = true;
    sectorKey.hidden = true;
    viewLabel.textContent = 'Vista libre';
  }
  controls.addEventListener('change', requestFrame);
  controls.addEventListener('start', enterFreeView);
  canvas.addEventListener('keydown', (event) => {
    const steps = {ArrowLeft:[.105,0], ArrowRight:[-.105,0], ArrowUp:[0,.075], ArrowDown:[0,-.075]};
    const zoom = {'+':.88, '=':.88, '-':1.136};
    if (!(event.key in steps) && !(event.key in zoom)) return;
    event.preventDefault();
    enterFreeView();
    const orbit = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    if (event.key in steps) {
      const [theta, phi] = steps[event.key];
      orbit.theta += theta;
      orbit.phi = THREE.MathUtils.clamp(orbit.phi + phi, controls.minPolarAngle, controls.maxPolarAngle);
    } else {
      orbit.radius = THREE.MathUtils.clamp(orbit.radius * zoom[event.key], controls.minDistance, controls.maxDistance);
    }
    camera.position.setFromSpherical(orbit).add(controls.target);
    controls.update();
    requestFrame();
  });
  new ResizeObserver(() => {
    if (!host.clientWidth || !host.clientHeight) return;
    renderer.setSize(host.clientWidth, host.clientHeight, false);
    camera.aspect = host.clientWidth / host.clientHeight;
    if (selected) applyView(selected);
    else camera.updateProjectionMatrix();
    requestFrame();
  }).observe(host);
  applyView(selected);
  exportButton.disabled = false;
  exportButton.addEventListener('click', async () => {
    exportButton.disabled = true;
    exportStatus.textContent = 'Preparando el archivo…';
    try {
      const binary = await new GLTFExporter().parseAsync(model, {binary:true,maxTextureSize:1024,onlyVisible:false});
      const url = URL.createObjectURL(new Blob([binary], {type:'model/gltf-binary'}));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'campus-upc-bloque-i.glb';
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      exportStatus.textContent = 'Descarga iniciada.';
    } catch (error) {
      console.error(error);
      exportStatus.textContent = 'Hubo un error al exportar el modelo.';
    } finally {
      exportButton.disabled = false;
    }
  });
  function acercar(figura) {
    if (!figura) {
      if (estudianteSeguido) applyView('model');
      return;
    }
    enterFreeView();
    const posicion=figura.position;
    estudianteSeguido = posicion;
    posicionAnterior.copy(posicion);
    controls.target.copy(posicion).y += 1.02;
    const offset=new THREE.Vector3(2.05,1.48,3.25).applyAxisAngle(camera.up,figura.rotation.y);
    camera.position.copy(posicion).add(offset);
    camera.fov = 40;
    camera.updateProjectionMatrix();
    controls.update();
    viewport.dataset.camera = 'ground';
    viewLabel.textContent = 'Estudiante en simulación';
    if (touch.matches) viewport.scrollIntoView({block:'center'});
    requestFrame();
  }
  montarRed({scene,camera,viewport,requestFrame,verMapa:()=>applyView('map'),acercar})
    .then(actualizar=>{colocarRotulos=actualizar;requestFrame();});
  requestFrame();
  notice.hidden = true;
}

try {
  launch();
} catch (error) {
  console.error(error);
  notice.textContent = 'No se pudo abrir el visor 3D. Verifica que tu navegador tenga WebGL habilitado.';
}



