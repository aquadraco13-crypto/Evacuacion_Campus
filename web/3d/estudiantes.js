import * as THREE from './three.module.js';

// Perfiles en metros. El frente de cada figura mira hacia +Z.
const pieles = [0x9d6346, 0xbd805d, 0xe1ad87, 0x754b39, 0xd49a72, 0xad7253];
const cabellos = [0x322824, 0x201e21, 0x4c352b, 0x654432];
const atuendos = [
  [0x42766c, 0x303e49, 0xa65b3f], [0xc37c48, 0x384b5d, 0x3e5855],
  [0xdee0d1, 0x405649, 0x8c4f46], [0x61799b, 0x3b3943, 0xb3a183],
  [0xa45f70, 0x384c53, 0x4d6159], [0x53644e, 0x6b5647, 0x3e4d61]
];
const elegir = a => a[Math.floor(Math.random() * a.length)];
function perfil(puntos) {
  return new THREE.LatheGeometry(puntos.map(([y,r]) => new THREE.Vector2(r,y)), 12);
}
const perfilCara=[[0,0],[.015,.06],[.065,.105],[.15,.123],[.217,.118],[.257,.087],[.275,0]];
function corteDePelo(){
  const vertices=[], indices=[], lados=24, filas=10;
  for(let j=0;j<=filas;j++) for(let i=0;i<=lados;i++){
    const a=i/lados*Math.PI*2;
    const frente=Math.cos(a);
    const linea=.153+.057*frente+.008*Math.sin(2*a);
    const y=THREE.MathUtils.lerp(linea,.289,j/filas);
    const h=Math.min(.275,y-.014);
    const k=perfilCara.findIndex(p=>p[0]>=h);
    const [lo,r0]=perfilCara[k-1], [hi,r1]=perfilCara[k];
    const radio=THREE.MathUtils.lerp(r0,r1,(h-lo)/(hi-lo))+(j===filas?0:.011);
    vertices.push(Math.sin(a)*radio,y,frente*radio*.98);
    if(j<filas && i<lados){
      const v=j*(lados+1)+i;
      indices.push(v,v+1,v+lados+1,v+1,v+lados+2,v+lados+1);
    }
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geo.setIndex(indices);geo.computeVertexNormals();return geo;
}
function pivote(padre, x, y, z) {
  const p = new THREE.Object3D();
  padre.add(p);
  p.position.set(x,y,z);
  return p;
}
function cinta(lado){
  const puntos=[[.105,.391,-.119],[.128,.441,-.048],[.132,.434,.041],[.128,.382,.117],
    [.123,.274,.131],[.132,.195,.104],[.160,.147,.047],[.171,.134,-.033],[.141,.147,-.118]];
  const curva=new THREE.CatmullRomCurve3(puntos.map(([x,y,z])=>new THREE.Vector3(lado*x,y,z)));
  return new THREE.TubeGeometry(curva,18,.016,7,false);
}

export function crearEstudiantes(escena, cantidad, camara) {
  const geometrias = {
    ovalo:new THREE.SphereGeometry(1,12,10),
    ovaloLejano:new THREE.SphereGeometry(1,6,4),
    torso:perfil([[0,0],[.004,.165],[.024,.178],[.08,.174],[.18,.165],[.30,.201],[.356,.215],[.384,.202],[.412,.148],[.435,.082],[.437,0]]),
    cara:perfil(perfilCara),
    muslo:perfil([[-.425,0],[-.408,.056],[-.38,.077],[-.18,.096],[-.045,.104],[.026,.096],[.061,.067],[.08,0]]),
    pierna:perfil([[-.373,.057],[-.35,.061],[-.29,.064],[-.13,.081],[-.04,.082],[.015,.074],[.045,.045],[.055,0]]),
    cabello:corteDePelo(),
    cintaIzq:cinta(-1),cintaDer:cinta(1)
  };
  const material = new THREE.MeshStandardMaterial({roughness:.93});
  const grupo = new THREE.Group();
  grupo.name = 'Estudiantes en movimiento';
  escena.add(grupo);
  const lotes = new Map();
  const lienzo=document.createElement('canvas');
  lienzo.width=lienzo.height=64;
  const ctx=lienzo.getContext('2d'), sombra=ctx.createRadialGradient(32,32,0,32,32,32);
  sombra.addColorStop(0,'rgba(37,31,29,.42)');sombra.addColorStop(.55,'rgba(37,31,29,.20)');sombra.addColorStop(1,'rgba(37,31,29,0)');
  ctx.fillStyle=sombra;ctx.fillRect(0,0,64,64);
  const sombras=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({
    map:new THREE.CanvasTexture(lienzo),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,toneMapped:false
  }),cantidad);
  sombras.count=0;sombras.frustumCulled=false;sombras.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  grupo.add(sombras);
  const color = new THREE.Color();
  // Cada geometría se dibuja una sola vez para toda la multitud.
  for (const [nombre,geo] of Object.entries(geometrias)) {
    const instancias = new THREE.InstancedMesh(geo,material,cantidad*(nombre.startsWith('ovalo')?52:4));
    instancias.count = 0;
    instancias.frustumCulled = false;
    instancias.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    instancias.name = nombre;
    grupo.add(instancias);
    lotes.set(nombre,instancias);
  }
  const figuras=[], visibles=[];
  let piezas, reorganizar=false;
  function pieza(padre,tipo,tinte,x,y,z,sx=1,sy=1,sz=1) {
    const nodo = pivote(padre,x,y,z);
    nodo.scale.set(sx,sy,sz);
    const lote=lotes.get(tipo);
    let lejano=lote;
    if(tipo==='ovalo') lejano=Math.max(sx,sy,sz)>=.085?lotes.get('ovaloLejano'):null;
    if(tipo.startsWith('cinta')) lejano=null;
    piezas.push({nodo,lote,lejano,tinte});
    return nodo;
  }
  const raices=[];
  function crear() {
    const raiz=new THREE.Object3D();
    piezas=[];
    figuras.push({raiz,piezas,cerca:null});
    reorganizar=true;
    raices.push(raiz);
    const huella=pivote(raiz,0,.012,.015);
    huella.rotation.x=-Math.PI/2;huella.scale.set(.69,.92,1);
    piezas.push({nodo:huella,lote:sombras,lejano:null});
    const cuerpo=pivote(raiz,0,0,0);
    raiz.scale.setScalar(.91+Math.random()*.16);
    const piel=elegir(pieles), pelo=elegir(cabellos);
    const [camisa,jean,bolso]=elegir(atuendos);
    const ancho=.91+Math.random()*.16;
    const torso=pivote(cuerpo,0,.86,0);
    pieza(torso,'ovalo',jean,0,.024,-.005,.174*ancho,.114,.123);
    pieza(torso,'torso',camisa,0,.055,0,ancho,1,.7);
    pieza(torso,'ovalo',piel,0,.518,0,.073,.111,.072);
    pieza(torso,'ovalo',camisa,0,.474,0,.095,.026,.085);
    const cabeza=pivote(torso,0,.517,.006);
    pieza(cabeza,'cara',piel,0,0,0,1,1,.96);
    pieza(cabeza,'cabello',pelo,0,0,0);
    const peinado=Math.random();
    if(peinado<.33) {
      pieza(cabeza,'ovalo',pelo,0,.115,-.135,.075,.075,.079);
      pieza(cabeza,'ovalo',pelo,0,.046,-.14,.059,.09,.052);
    } else if(peinado<.7) {
      pieza(cabeza,'ovalo',pelo,-.036,.242,.049,.094,.045,.073).rotation.z=.16;
    } else {
      for (const x of [-.075,0,.075]) pieza(cabeza,'ovalo',pelo,x,.26-Math.abs(x)*.28,0,.061,.054,.085);
    }
    pieza(cabeza,'ovalo',piel,0,.111,.105,.017,.027,.019);
    pieza(cabeza,'ovalo',0x805344,0,.061,.10,.023,.003,.004);
    for(const s of [-1,1]){
      pieza(cabeza,'ovalo',piel,s*.122,.119,0,.019,.035,.022);
      pieza(cabeza,'ovalo',0x44312c,s*.044,.149,.108,.013,.006,.006);
      pieza(cabeza,'ovalo',pelo,s*.045,.168,.107,.018,.004,.006).rotation.z=s*.08;
    }
    if (raices.length===1 || Math.random()<.68) {
      pieza(torso,'ovalo',bolso,0,.262,-.138,.156,.204,.09);
      pieza(torso,'ovalo',bolso,0,.212,-.207,.109,.094,.039);
      pieza(torso,'cintaIzq',bolso,0,0,0,ancho,1,1);
      pieza(torso,'cintaDer',bolso,0,0,0,ancho,1,1);
    }
    const lados=[];
    for (const s of [-1,1]) {
      const cadera=pivote(cuerpo,s*.091*ancho,.86,0);
      pieza(cadera,'muslo',jean,0,0,0);
      const rodilla=pivote(cadera,0,-.395,0);
      pieza(rodilla,'pierna',jean,0,0,0);
      const pie=pivote(rodilla,0,-.365,0);
      pieza(pie,'ovalo',0xe4dfd1,0,-.067,.048,.073,.031,.129);
      pieza(pie,'ovalo',0x42484b,0,-.04,.045,.07,.053,.125);
      for(const z of [.055,.084]) pieza(pie,'ovalo',0xc7c9c2,0,.004,z,.041,.007,.008);
      const hombro=pivote(torso,s*.193*ancho,.42,0);
      hombro.rotation.z=s*.085;
      pieza(hombro,'ovalo',piel,0,-.153,0,.054,.137,.056);
      pieza(hombro,'ovalo',camisa,0,-.064,0,.081,.108,.083);
      const codo=pivote(hombro,0,-.235,0);
      pieza(codo,'ovalo',piel,0,0,0,.047,.048,.047);
      pieza(codo,'ovalo',piel,0,-.10,0,.045,.126,.047);
      pieza(codo,'ovalo',piel,0,-.231,.008,.038,.058,.038);
      lados.push({s,cadera,rodilla,pie,hombro,codo});
    }
    for(const {nodo} of piezas){
      nodo.updateMatrix();
      nodo.matrixAutoUpdate=false;
    }
    return {raiz,cuerpo,torso,cabeza,lados,fase:Math.random()*6.28,paso:0};
  }
  function posar(figura, distancia, rapido, dt) {
    const {raiz,cuerpo,torso,cabeza,lados}=figura;
    const mov=distancia>0.0001;
    figura.paso=THREE.MathUtils.damp(figura.paso,mov?1:0,12,dt);
    figura.fase+=distancia*(rapido?3.95:5.0)/raiz.scale.y;
    const f=figura.fase, a=figura.paso;
    let apoyo=Infinity;
    torso.rotation.set((rapido?.115:.036)*a,Math.sin(f)*.095*a,Math.cos(f)*.027*a);
    cabeza.rotation.y=-torso.rotation.y*.64;
    for(const {s,cadera,rodilla,pie,hombro,codo} of lados){
      const swing=Math.sin(f)*s;
      cadera.rotation.x=-(rapido?.69:.48)*swing*a;
      rodilla.rotation.x=(.05+(1-swing)*.18+Math.max(0,-s*Math.cos(f))*(rapido?.70:.36))*a;
      pie.rotation.x=-(cadera.rotation.x+rodilla.rotation.x)*.73;
      const espinilla=cadera.rotation.x+rodilla.rotation.x;
      const suela=espinilla+pie.rotation.x;
      const altura=.86-.395*Math.cos(cadera.rotation.x)-.365*Math.cos(espinilla)-.067*Math.cos(suela)-.048*Math.sin(suela)-Math.hypot(.031*Math.cos(suela),.129*Math.sin(suela));
      apoyo=Math.min(apoyo,altura);
      hombro.rotation.x=(rapido?.71:.4)*swing*a-.055;
      codo.rotation.x=-.17-(rapido?.85:.24)*a+Math.min(0,swing)*.19*a;
    }
    cuerpo.position.y=-apoyo;
  }
  function dibujar(){
    for(const figura of figuras){
      const distancia=figura.raiz.position.distanceToSquared(camara.position);
      const cerca=distancia<(figura.cerca?34*34:28*28);
      // La cámara peatonal puede coincidir con un estudiante que cruza el recorrido.
      const pos=figura.raiz.position, dx=pos.x-camara.position.x, dz=pos.z-camara.position.z;
      const oculta=Math.abs(camara.position.y-pos.y-1.05)<1.25 &&
        dx*dx+dz*dz<(figura.oculta?1.45*1.45:1.18*1.18);
      if(cerca!==figura.cerca || oculta!==figura.oculta){
        figura.cerca=cerca;figura.oculta=oculta;reorganizar=true;
      }
    }
    if(reorganizar){
      visibles.length=0;
      for(const lote of grupo.children) lote.count=0;
      for(const figura of figuras){
        if(figura.oculta) continue;
        for(const pieza of figura.piezas){
          const lote=figura.cerca?pieza.lote:pieza.lejano;
          if(!lote) continue;
          pieza.destino=lote;
          pieza.indice=lote.count++;
          if(pieza.tinte!==undefined) lote.setColorAt(pieza.indice,color.setHex(pieza.tinte));
          visibles.push(pieza);
        }
      }
      for(const lote of lotes.values()) if(lote.instanceColor) lote.instanceColor.needsUpdate=true;
      reorganizar=false;
    }
    for(const raiz of raices) raiz.updateMatrixWorld(true);
    for(const {nodo,destino,indice} of visibles) destino.setMatrixAt(indice,nodo.matrixWorld);
    for(const lote of lotes.values()) lote.instanceMatrix.needsUpdate=true;
    sombras.instanceMatrix.needsUpdate=true;
  }
  function limpiar(){
    piezas=null;figuras.length=0;visibles.length=0;
    raices.length=0;
    sombras.count=0;
    for(const lote of lotes.values()) lote.count=0;
  }
  return {crear,posar,dibujar,limpiar};
}
