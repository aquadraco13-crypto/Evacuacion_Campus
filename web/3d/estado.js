const $=id=>document.getElementById(id);
const titulo=document.title;
export function conectarEstado(estado, alCambiar) {
  let turno=0, ocupado=false;
  const aviso=$('red-mensaje');
  function aplicar(f) {
    const admin=!!f.admin;
    const cambio=f.version!==estado.version || admin!==estado.admin;
    Object.assign(estado,{admin,version:f.version,emergencia:f.emergencia,nodos:new Set(f.nodos),aristas:new Set(f.aristas)});
    const bloqueos=f.nodos.length+f.aristas.length;
    const resumen=(f.emergencia?'Emergencia activa':'Sin emergencia')+' · '+bloqueos+(bloqueos===1?' bloqueo':' bloqueos');
    if($('red-estado').textContent!==resumen) $('red-estado').textContent=resumen;
    $('red-estado').classList.toggle('alerta',f.emergencia);
    $('bannerAlerta3d').hidden=!f.emergencia;
    $('bannerAlerta3d').textContent='Emergencia activa · Selecciona tu ubicación para consultar la ruta.';
    document.title=f.emergencia?'Emergencia · '+titulo:titulo;
    $('red-admin').hidden=!admin;
    $('red-login').hidden=admin;
    $('red-alerta').textContent=f.emergencia?'Desactivar emergencia':'Activar emergencia';
    $('red-alerta').setAttribute('aria-pressed',String(f.emergencia));
    document.querySelector('.conmutador a').href=admin?'admin.html':'index.html';
    if(cambio) alCambiar();
  }
  async function leer() {
    const r=await fetch('/api/estado',{cache:'no-store'});
    if(!r.ok) throw new Error('No se pudo consultar el estado.');
    return r.json();
  }
  async function sincronizar() {
    if(ocupado) return;
    const orden=++turno;
    try{
      const f=await leer();
      if(orden===turno) aplicar(f);
    }catch {
      if(orden===turno) $('red-estado').textContent='Sin conexión con el simulador.';
    }
  }
  async function enviar(url,preparar,exito='') {
    if(ocupado) return;
    ocupado=true;
    ++turno;
    $('red-admin').disabled=true;
    $('red-login').querySelector('button').disabled=true;
    aviso.textContent='';
    try{
      const datos=typeof preparar==='function'?preparar(await leer()):preparar;
      if(datos===null) return;
      const r=await fetch(url,{method:'POST',body:new URLSearchParams(datos),credentials:'same-origin'});
      const respuesta=await r.json();
      if(!r.ok) throw new Error(respuesta.mensaje || (r.status===401?'Vuelve a entrar como administrador.':'No se pudo guardar el cambio.'));
      aviso.textContent=exito;
      if(url==='/api/login') $('red-clave').value='';
    }catch(e){
      aviso.textContent=e instanceof TypeError?'No se pudo contactar con el servidor.':e.message;
    }finally{
      ocupado=false;
      await sincronizar();
      $('red-admin').disabled=false;
      $('red-login').querySelector('button').disabled=false;
    }
  }
  $('red-login').addEventListener('submit',e=>{
    e.preventDefault();
    enviar('/api/login',{clave:$('red-clave').value},'Sesión iniciada.');
  });
  $('red-salir').onclick=()=>enviar('/api/logout',{},'Sesión cerrada.');
  $('red-alerta').onclick=()=>{
    const activar=!estado.emergencia;
    const pregunta=activar?'¿Activar la emergencia para todas las vistas del simulador?':'¿Desactivar la emergencia para todas las vistas del simulador?';
    if(window.confirm(pregunta)) enviar('/api/admin/emergencia',{activa:String(activar)});
  };
  document.addEventListener('visibilitychange',()=>{if(!document.hidden) sincronizar();});
  sincronizar();
  setInterval(sincronizar,2500);
  return {
    bloqueo(tipo,id){
      enviar('/api/admin/bloqueos',f=>{
        if(!f.admin) return null;
        const items=new Set(f[tipo]);
        if(!items.delete(id)) items.add(id);
        return {nodos:(tipo==='nodos'?[...items]:f.nodos).join(','),aristas:(tipo==='aristas'?[...items]:f.aristas).join(',')};
      });
    },
    limpiar(){enviar('/api/admin/bloqueos',{nodos:'',aristas:''});},
    get ocupado(){return ocupado;}
  };
}
