import * as THREE from './three.module.js';
import { crearEstudiantes } from './estudiantes.js';

const capacidad = 108;
const lugaresConcurridos=new Set(['PLAZA','CENTRO','PEN','GAL','SC','SD','SI','SFG','SCAF1','SCAF2','ENTRA','SCOM','SH']);

function repartir(nodos,posiciones,vecinos,libre,estado){
  const aptos=[...nodos.values()].filter(n=>n.tipo!=='PUNTO_ENCUENTRO' && !estado.nodos.has(n.id));
  const tramos=[];
  for(const a of aptos) for(const b of vecinos.get(a.id)){
    if(a.id>=b || nodos.get(b).tipo==='PUNTO_ENCUENTRO' || !libre(a.id,b)) continue;
    const largo=posiciones.get(a.id).distanceTo(posiciones.get(b));
    const popular=lugaresConcurridos.has(a.id)||lugaresConcurridos.has(b);
    const peso=largo*(popular?2.4:1);
    tramos.push({a:a.id,b,largo,peso,cupo:Math.floor(largo/1.85),asignados:0});
  }
  // Repartir por longitud y afluencia, respetando el espacio físico disponible en cada tramo.
  for(let i=0;i<capacidad;i++){
    let mejor=null;
    for(const t of tramos){
      if(t.asignados>=t.cupo) continue;
      if(!mejor || t.peso/(t.asignados+1)>mejor.peso/(mejor.asignados+1)) mejor=t;
    }
    if(!mejor) break;
    mejor.asignados++;
  }
  const semillas=[];
  for(const t of tramos){
    for(let i=0;i<t.asignados;i++){
      const fraccion=(i+.35+Math.random()*.3)/t.asignados;
      const vuelta=i%2===1;
      semillas.push({a:vuelta?t.b:t.a,b:vuelta?t.a:t.b,fraccion:vuelta?1-fraccion:fraccion});
    }
  }
  // Mantener el seguimiento inicial cerca de la plaza si ese lugar está disponible.
  const plaza=semillas.findIndex(s=>s.a==='PLAZA'||s.b==='PLAZA');
  if(plaza>0) [semillas[0],semillas[plaza]]=[semillas[plaza],semillas[0]];
  for(const n of aptos){
    if(semillas.length>=capacidad) break;
    semillas.push({a:n.id,b:null,fraccion:0});
  }
  return semillas;
}

export function crearSimulacion({scene, camera, nodos, posiciones, vecinos, libre, estado, pedirRuta, requestFrame}) {
  const multitud=crearEstudiantes(scene,capacidad,camera);
  let personas=[], activo=false, animacion=0, anterior=0;
  const desplazamiento=new THREE.Vector3();
  function detener() {
    activo=false;
    cancelAnimationFrame(animacion);
    for(const p of personas) p.peticion++;
    personas=[];
    multitud.limpiar();
    requestFrame();
  }
  function iniciar() {
    detener();
    const semillas=repartir(nodos,posiciones,vecinos,libre,estado);
    if(!semillas.length) return false;
    personas=semillas.map(({a,b,fraccion},i)=>{
      const figura=multitud.crear();
      const offset=new THREE.Vector3((Math.random()-.5)*.95,.06,(Math.random()-.5)*.95);
      const radio=.38*Math.sqrt(i), angulo=i*2.399963;
      const refugio=new THREE.Vector3(radio*Math.cos(angulo),.06,radio*Math.sin(angulo));
      const p={figura,offset,refugio,origen:a,previo:null,destino:null,d:0,total:0,espera:Math.random(),ruta:[],peticion:0,buscando:false,ritmo:.88+Math.random()*.24,retirando:false};
      const inicio=posiciones.get(a);
      figura.raiz.position.copy(inicio);
      if(b){
        tramo(p,b);
        p.d=p.total*fraccion;
        const fin=posiciones.get(b);
        figura.raiz.position.lerp(fin,fraccion);
        figura.raiz.rotation.y=Math.atan2(fin.x-inicio.x,fin.z-inicio.z);
      }
      figura.raiz.position.add(offset);
      multitud.posar(figura,0,estado.emergencia,0);
      return p;
    });
    activo=true;
    multitud.dibujar();
    anterior=performance.now();
    animacion=requestAnimationFrame(avanzar);
    requestFrame();
    return true;
  }
  function tramo(p,id) {
    p.destino=id;
    p.total=posiciones.get(p.origen).distanceTo(posiciones.get(id));
    p.d=0;
    p.retirando=false;
  }
  async function decidir(p) {
    if(p.buscando || estado.nodos.has(p.origen)) return;
    if(estado.emergencia) {
      if(nodos.get(p.origen).tipo==='PUNTO_ENCUENTRO') return;
      if(!p.ruta.length) {
        const ticket=++p.peticion;
        p.buscando=true;
        const plan=await pedirRuta(p.origen);
        if(!activo || p.peticion!==ticket) return;
        p.buscando=false;
        if(!plan.ok || plan.camino.length<2){p.espera=2;return;}
        p.ruta=plan.camino.slice(1);
      }
      const id=p.ruta.shift();
      if(libre(p.origen,id)) tramo(p,id);
      else p.ruta=[];
    } else {
      const candidatos=vecinos.get(p.origen).filter(id=>libre(p.origen,id));
      const otros=candidatos.filter(id=>id!==p.previo);
      const lista=otros.length?otros:candidatos;
      if(lista.length) tramo(p,lista[Math.floor(Math.random()*lista.length)]);
      else p.espera=1;
    }
  }
  function cambiarEstado(){
    for(const p of personas) {
      p.peticion++;
      p.buscando=false;
      p.ruta=[];
      p.espera=0;
      if(!p.destino || libre(p.origen,p.destino)) {p.retirando=false;continue;}
      // Si el tramo se cierra durante el paso, regresar por lo ya recorrido.
      if(estado.nodos.has(p.destino) || (!p.retirando && !estado.nodos.has(p.origen))) {
        if(!estado.nodos.has(p.origen)) {
          [p.origen,p.destino]=[p.destino,p.origen];
          p.d=p.total-p.d;
        }
      }
      p.retirando=true;
    }
  }
  function avanzar(t) {
    if(!activo) return;
    const dt=Math.min(.12,Math.max(0,(t-anterior)/1000));
    anterior=t;
    for(const p of personas) {
      p.espera-=dt;
      if(!p.destino && p.espera<=0) decidir(p);
      let distancia=0;
      if(p.destino && !estado.nodos.has(p.destino)) {
        const a=posiciones.get(p.origen), b=posiciones.get(p.destino);
        distancia=Math.min((estado.emergencia?2.5:1.32)*p.ritmo*dt,Math.max(0,p.total-p.d));
        p.d+=distancia;
        const raiz=p.figura.raiz;
        const t=p.total?p.d/p.total:1;
        const inicio=nodos.get(p.origen).tipo==='PUNTO_ENCUENTRO'?p.refugio:p.offset;
        const fin=nodos.get(p.destino).tipo==='PUNTO_ENCUENTRO'?p.refugio:p.offset;
        raiz.position.lerpVectors(a,b,t).add(desplazamiento.lerpVectors(inicio,fin,t));
        const rumbo=Math.atan2(b.x-a.x,b.z-a.z);
        const delta=rumbo-raiz.rotation.y;
        raiz.rotation.y+=Math.atan2(Math.sin(delta),Math.cos(delta))*(1-Math.exp(-11*dt));
        if(p.d>=p.total) {
          p.previo=p.origen;p.origen=p.destino;p.destino=null;
          if(!estado.emergencia && Math.random()<.28) p.espera=.5+Math.random()*1.8;
        }
      }
      multitud.posar(p.figura,distancia,estado.emergencia,dt);
    }
    multitud.dibujar();
    requestFrame();
    animacion=requestAnimationFrame(avanzar);
  }
  return {iniciar,detener,cambiarEstado,get activo(){return activo;},get cantidad(){return personas.length;},get primera(){return personas[0]?.figura.raiz;}};
}
