import * as THREE from './three.module.js';
import {sitePoint} from './site.js';
import {conectarEstado} from './estado.js';
import {crearSimulacion} from './simulacion.js';

const COLOR={SALON:0x2f5d8a,PASILLO:0x7f8f84,SALIDA:0xc77b2a,PUNTO_ENCUENTRO:0x24985a,camino:0xeae6d9,riesgo:0xdf941b,cierre:0xb93632,ruta:0x14854b};
const clave=(a,b)=>a<b?a+'|'+b:b+'|'+a;
const $=id=>document.getElementById('red-'+id);
function material(color) {
  return new THREE.MeshBasicMaterial({color,depthTest:false,depthWrite:false});
}
function formatearTiempo(seg) {
  const s=Math.round(seg), minutos=Math.floor(s/60);
  return minutos ? minutos+' min'+(s%60?' '+(s%60)+' s':'') : s+' s';
}

export async function montarRed({scene,camera,viewport,requestFrame,verMapa,acercar}) {
  let campus;
  try{
    const r=await fetch('/api/campus');
    if(!r.ok) throw Error();
    campus=await r.json();
  }catch{
    $('estado').textContent='No se pudo cargar el plano. Recarga la página para volver a conectar.';
    document.querySelectorAll('.red-panel button,.red-panel select').forEach(x=>x.disabled=true);
    return;
  }
  const nodos=new Map(campus.nodos.map(n=>[n.id,n]));
  const posiciones=new Map(campus.nodos.map(n=>[n.id,new THREE.Vector3(...sitePoint([n.x/2,n.y/2]))]));
  const vecinos=new Map(campus.nodos.map(n=>[n.id,[]]));
  const estado={admin:false,emergencia:false,version:null,nodos:new Set(),aristas:new Set()};
  const libre=(a,b)=>!estado.nodos.has(a)&&!estado.nodos.has(b)&&!estado.aristas.has(clave(a,b));
  const red=new THREE.Group(), ruta=new THREE.Group();
  red.visible=false;scene.add(red,ruta);
  const objetivos=[], caminos=[], puntos=[], rotulos=[];
  const marca=new THREE.SphereGeometry(1,14,8), tubo=new THREE.CylinderGeometry(1,1,1,8);
  const arriba=new THREE.Vector3(0,1,0);
  function segmento(a,b,radio,mat,orden) {
    const desde=posiciones.get(a), hasta=posiciones.get(b);
    const dir=new THREE.Vector3().subVectors(hasta,desde);
    const m=new THREE.Mesh(tubo,mat);
    m.position.copy(desde).lerp(hasta,.5);m.position.y=.32;
    m.scale.set(radio,dir.length(),radio);
    m.quaternion.setFromUnitVectors(arriba,dir.normalize());m.renderOrder=orden;
    return m;
  }
  const selector=$('origen'), objetivo=$('objetivo');
  const grupoPuntos=document.createElement('optgroup'), grupoCaminos=document.createElement('optgroup');
  grupoPuntos.label='Puntos';grupoCaminos.label='Tramos';objetivo.append(grupoPuntos,grupoCaminos);
  const ordenados=[...nodos.values()].sort((a,b)=>a.nombre.localeCompare(b.nombre,'es'));
  for(const [nombre,tipos] of [['Salones y lugares',['SALON']],['Pasillos y puertas',['PASILLO','SALIDA']],['Puntos de encuentro',['PUNTO_ENCUENTRO']]]) {
    const grupo=document.createElement('optgroup');grupo.label=nombre;
    for(const n of ordenados.filter(n=>tipos.includes(n.tipo))) grupo.append(new Option(n.nombre,n.id));
    selector.append(grupo);
  }
  for(const n of ordenados){
    const m=new THREE.Mesh(marca,material(COLOR[n.tipo]));
    m.position.copy(posiciones.get(n.id));m.position.y=.48;
    const pe=n.tipo==='PUNTO_ENCUENTRO', radio=pe?2.2:1.3;
    m.scale.set(radio,.68,radio);m.renderOrder=12;
    m.userData={tipo:'nodos',id:n.id};red.add(m);puntos.push(m);objetivos.push(m);
    grupoPuntos.append(new Option(n.nombre,'nodos:'+n.id));
    if(pe) {
      const e=document.createElement('span');e.className='etiqueta-red pe';e.hidden=true;e.textContent=n.nombre;
      viewport.append(e);rotulos.push({e,p:m.position.clone().setY(1.4)});
    }
  }
  for(const a of campus.aristas){
    vecinos.get(a.a).push(a.b);vecinos.get(a.b).push(a.a);
    const id=clave(a.a,a.b);
    const m=segmento(a.a,a.b,.45,material(COLOR.camino),10);
    m.userData={tipo:'aristas',id};red.add(m);objetivos.push(m);caminos.push({a,m});
    grupoCaminos.append(new Option(nodos.get(a.a).nombre+' — '+nodos.get(a.b).nombre,'aristas:'+id));
  }
  let editor=false, solicitud=0;
  const cache=new Map();
  function pedirRuta(id) {
    if(!cache.has(id)){
      const pendiente=fetch('/api/ruta?'+new URLSearchParams({origen:id})).then(r=>{
        if(!r.ok) throw Error();
        return r.json();
      }).catch(()=>{
        if(cache.get(id)===pendiente) cache.delete(id);
        return {ok:false,mensaje:'No se pudo consultar la ruta.'};
      });
      cache.set(id,pendiente);
    }
    return cache.get(id);
  }
  const sim=crearSimulacion({scene,camera,nodos,posiciones,vecinos,libre,estado,pedirRuta,requestFrame});
  const matRuta=material(COLOR.ruta), matOrigen=material(0x255e9b);
  function mostrarRed(mostrar){
    red.visible=mostrar;
    $('ver').setAttribute('aria-pressed',String(mostrar));
    $('ver').textContent=mostrar?'Ocultar caminos':'Mostrar caminos';
    $('pista').hidden=!mostrar || editor;
    for(const {e} of rotulos) e.hidden=!mostrar;
    if(!mostrar && editor) editar(false);
    requestFrame();
  }
  function editar(si){
    editor=si&&estado.admin;
    $('editor').hidden=!editor;
    $('editar').setAttribute('aria-pressed',String(editor));
    $('editar').textContent=editor?'Terminar edición':'Editar bloqueos';
    viewport.classList.toggle('editando',editor);
    $('pista').hidden=editor || !red.visible;
    if(editor){verMapa();mostrarRed(true);}
  }
  function escoger(id){
    selector.value=id;
    if(!estado.admin) try{
      if(id) localStorage.setItem('ruta.origen',id);
      else localStorage.removeItem('ruta.origen');
    }catch{}
    pintarRuta();
  }
  function detalle(plan){
    const pasos=$('pasos'), opciones=$('opciones');
    pasos.replaceChildren();opciones.replaceChildren();
    for(const id of plan.camino||[]){
      const li=document.createElement('li');li.textContent=nodos.get(id)?.nombre||id;pasos.append(li);
    }
    for(const o of plan.opciones||[]){
      const fila=opciones.insertRow();
      const th=document.createElement('th');th.scope='row';th.textContent=o.nombre;fila.append(th);
      fila.insertCell().textContent=o.alcanzable?Math.round(o.distanciaM)+' m':'Sin acceso';
    }
    $('recorrido').hidden=!pasos.childElementCount&&!opciones.childElementCount;
  }
  async function pintarRuta() {
    const ticket=++solicitud, id=selector.value;
    ruta.clear();$('recorrido').hidden=true;$('ruta').textContent='';requestFrame();
    if(!id) return;
    const origen=new THREE.Mesh(marca,matOrigen);
    origen.position.copy(posiciones.get(id));origen.position.y=.7;origen.scale.set(1.55,.66,1.55);
    origen.renderOrder=14;ruta.add(origen);
    if(!estado.admin&&!estado.emergencia){
      $('ruta').textContent='La ruta aparece cuando el administrador activa la emergencia.';return;
    }
    const plan=await pedirRuta(id);
    if(ticket!==solicitud) return;
    detalle(plan);
    const prefijo=estado.emergencia?'':'Vista previa · ';
    if(!plan.ok){$('ruta').textContent=prefijo+plan.mensaje;return;}
    if(plan.camino.length===1){
      $('ruta').textContent=prefijo+'Ya estás en el punto de encuentro '+plan.destinoNombre+'.';return;
    }
    for(let i=1;i<plan.camino.length;i++) ruta.add(segmento(plan.camino[i-1],plan.camino[i],.71,matRuta,11));
    $('ruta').textContent=prefijo+plan.destinoNombre+' · '+Math.round(plan.distanciaM)+' m · '+formatearTiempo(plan.tiempoS);
    requestFrame();
  }
  function botonObjetivo(){
    const [tipo,id]=objetivo.value.split(':');
    $('alternar').textContent=estado[tipo]?.has(id)?'Liberar':'Bloquear';
  }
  function pintarEstado(){
    cache.clear();
    if(!estado.admin && editor) editar(false);
    $('etiqueta').textContent=estado.admin?'Punto de partida de prueba':'Punto de partida';
    $('limpiar').disabled=!estado.nodos.size&&!estado.aristas.size;
    for(const {a,m} of caminos){
      const cerrado=!libre(a.a,a.b);
      m.material.color.setHex(cerrado?COLOR.cierre:a.riesgo>1?COLOR.riesgo:COLOR.camino);
      m.scale.x=m.scale.z=cerrado?.70:.45;
    }
    for(const m of puntos){
      const id=m.userData.id;
      m.material.color.setHex(estado.nodos.has(id)?COLOR.cierre:COLOR[nodos.get(id).tipo]);
    }
    botonObjetivo();sim.cambiarEstado();pintarRuta();requestFrame();
  }
  try{
    const guardado=localStorage.getItem('ruta.origen');
    if(nodos.has(guardado)) selector.value=guardado;
  }catch{}
  const servicio=conectarEstado(estado,pintarEstado);
  $('ver').onclick=()=>mostrarRed(!red.visible);
  $('sim').onclick=()=>{
    if(sim.activo) {sim.detener();acercar(null);}
    else if(!sim.iniciar()) $('ruta').textContent='No hay puntos disponibles para iniciar la simulación.';
    $('sim').textContent=sim.activo?'Detener personas':'Simular personas';
    $('sim').setAttribute('aria-pressed',String(sim.activo));$('acercar').hidden=!sim.activo;
    document.querySelector('#grupo-estudiantes').hidden=!sim.activo;
    $('cantidad').textContent=sim.activo?sim.cantidad+' estudiantes':'';
  };
  $('acercar').onclick=()=>{if(sim.primera){mostrarRed(false);acercar(sim.primera);}};
  selector.onchange=()=>escoger(selector.value);
  $('editar').onclick=()=>editar(!editor);
  $('azar').onclick=()=>{
    const libres=ordenados.filter(n=>n.tipo!=='PUNTO_ENCUENTRO'&&!estado.nodos.has(n.id));
    if(libres.length) escoger(libres[Math.floor(Math.random()*libres.length)].id);
  };
  objetivo.onchange=botonObjetivo;
  $('alternar').onclick=()=>{
    const [tipo,id]=objetivo.value.split(':');
    if(editor && id) servicio.bloqueo(tipo,id);
  };
  $('limpiar').onclick=()=>servicio.limpiar();
  const canvas=viewport.querySelector('canvas'), ray=new THREE.Raycaster();
  const punteros=new Set();
  let inicio=null;
  canvas.addEventListener('pointerdown',e=>{
    punteros.add(e.pointerId);
    inicio=punteros.size===1&&e.button===0?[e.clientX,e.clientY]:null;
  });
  canvas.addEventListener('pointercancel',e=>{punteros.delete(e.pointerId);inicio=null;});
  canvas.addEventListener('pointermove',e=>{
    if(inicio && Math.hypot(e.clientX-inicio[0],e.clientY-inicio[1])>5) inicio=null;
  });
  canvas.addEventListener('pointerup',e=>{
    punteros.delete(e.pointerId);
    const click=inicio;inicio=null;
    if(!click||!red.visible||e.button!==0||Math.hypot(e.clientX-click[0],e.clientY-click[1])>5) return;
    const r=canvas.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)*2/r.width-1,1-(e.clientY-r.top)*2/r.height),camera);
    const opciones=editor?objetivos:puntos;
    let elegido=ray.intersectObjects(opciones,false)[0]?.object;
    if(!elegido) {
      // Mantener seleccionables los tramos finos al alejar la cámara o en una pantalla táctil.
      const local=new THREE.Vector2(e.clientX-r.left,e.clientY-r.top);
      const pantalla=p=>{
        const v=p.clone().setY(.4).project(camera);
        return Math.abs(v.z)<=1?new THREE.Vector2((1+v.x)*r.width/2,(1-v.y)*r.height/2):null;
      };
      let mejor=e.pointerType==='touch'?12:6;
      function cercano(m,distancia){
        if(distancia<mejor){mejor=distancia;elegido=m;}
      }
      for(const m of puntos){
        const p=pantalla(m.position);
        if(p) cercano(m,p.distanceTo(local));
      }
      if(editor) for(const {a,m} of caminos){
        const p=pantalla(posiciones.get(a.a)),q=pantalla(posiciones.get(a.b));
        if(!p||!q) continue;
        const delta=q.clone().sub(p);
        const t=THREE.MathUtils.clamp(local.clone().sub(p).dot(delta)/(delta.lengthSq()||1),0,1);
        cercano(m,p.addScaledVector(delta,t).distanceTo(local)+2);
      }
    }
    if(!elegido) return;
    const {id,tipo}=elegido.userData;
    if(editor&&estado.admin&&!servicio.ocupado){
      objetivo.value=tipo+':'+id;botonObjetivo();servicio.bloqueo(tipo,id);
    }else if(!editor&&tipo==='nodos') escoger(id);
  });
  const proy=new THREE.Vector3();
  return function colocarRotulos(){
    if(!red.visible) return;
    for(const {e,p} of rotulos){
      proy.copy(p).project(camera);
      e.hidden=Math.abs(proy.z)>1||Math.abs(proy.x)>1||Math.abs(proy.y)>1;
      if(!e.hidden){e.style.left=(50+50*proy.x)+'%';e.style.top=(50-50*proy.y)+'%';}
    }
  };
}
