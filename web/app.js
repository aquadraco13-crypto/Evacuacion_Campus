'use strict';

const NS = 'http://www.w3.org/2000/svg';

// Edificios: solo decoración del plano (el grafo vive en el servidor Java).
const EDIFICIOS = [
  { n: 'Comedor',                x: 30,   y: 40,  w: 120, h: 95 },
  { n: 'Bloque H',               x: 350,  y: 40,  w: 120, h: 100 },
  { n: 'Bloques C · D',          x: 130,  y: 165, w: 270, h: 115 },
  { n: 'Bloques A · B',          x: 130,  y: 340, w: 270, h: 120 },
  { n: 'Cafetería',              x: 30,   y: 250, w: 100, h: 70 },
  { n: 'Bloque I',               x: 560,  y: 145, w: 100, h: 100 },
  { n: 'Caf. I-P',               x: 640,  y: 100, w: 90,  h: 55 },
  { n: 'Bloque P · Laboratorios',x: 720,  y: 145, w: 130, h: 170 },
  { n: 'Académico-Adm.',         x: 1030, y: 210, w: 140, h: 120 },
  { n: 'Biblio · Registro · Aud.', x: 520, y: 555, w: 250, h: 120 },
];

const RADIO = { SALON: 7, PASILLO: 4.5, SALIDA: 5.5, PUNTO_ENCUENTRO: 13 };

const PISTAS = {
  ubicacion: 'Toca un punto del mapa para indicar dónde estás.',
  bloqueo: 'Toca un camino (línea) o un punto para marcarlo como bloqueado: escombros, daños, humo, etc. Tócalo otra vez para liberarlo.',
};

// La misma lógica sirve a las dos páginas: index.html (estudiantes, solo ver)
// y admin.html (administradores). El rol solo cambia qué controles existen;
// quién puede CAMBIAR algo lo decide el servidor (cookie de sesión).
const ES_ADMIN = document.body.dataset.rol === 'admin';
const TITULO_BASE = document.title;

const estado = {
  version: -1,
  admin: false,
  campus: null,
  nodos: new Map(),
  origen: null,
  modo: 'ubicacion',
  nodosBloq: new Set(),
  aristasBloq: new Set(),
  alerta: false,          // lo decide el servidor
  plan: null,
  simulando: false,
  personas: [],          // { id, camino, idx, progreso, el }
};

const refs = { nodos: new Map(), aristas: new Map() };
let capaRuta = null;
let capaMarcas = null;
let capaPersonas = null;
let ticket = 0;
let animFrame = null;

const $ = (id) => document.getElementById(id);
const sobre = (id, evento, fn) => { const e = $(id); if (e) e.addEventListener(evento, fn); };

const esc = (s) => String(s).replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function el(tag, attrs = {}, padre = null) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (padre) padre.appendChild(e);
  return e;
}

function fmtTiempo(seg) {
  if (seg < 60) return `${seg} s`;
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return s === 0 ? `${m} min` : `${m} min ${s} s`;
}

// ---------------------------------------------------------------- Arranque

async function iniciar() {
  try {
    const resp = await fetch('/api/campus');
    estado.campus = await resp.json();
  } catch (e) {
    $('resultado').innerHTML =
      '<div class="tarjeta mal">No se pudo conectar con el servidor Java. ¿Está ejecutándose?</div>';
    document.body.classList.remove('cargando');
    return;
  }
  for (const n of estado.campus.nodos) estado.nodos.set(n.id, n);
  $('mapa').setAttribute('viewBox', `0 0 ${estado.campus.ancho} ${estado.campus.alto}`);

  construirMapa();
  llenarSelect();
  conectarControles();
  if (!ES_ADMIN) recuperarOrigen();
  dibujar();

  await sincronizar();
  setInterval(sincronizar, 2500);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) sincronizar(); });
}

// ------------------------------------------------- Estado compartido (servidor)

let postsHechos = 0;
let cola = Promise.resolve();

/** Pregunta al servidor si hay emergencia, qué está bloqueado y si soy admin. */
async function sincronizar() {
  const antes = postsHechos;
  let f;
  try {
    const resp = await fetch('/api/estado');
    f = await resp.json();
  } catch (e) {
    document.body.classList.add('desconectado');
    pintarEstado();
    document.body.classList.remove('cargando');
    return;
  }
  if (antes !== postsHechos) return;     // llegó un cambio del admin mientras tanto
  document.body.classList.remove('desconectado');
  if (ES_ADMIN) document.body.classList.toggle('sin-sesion', !f.admin);
  const cambioRol = estado.admin !== !!f.admin;
  estado.admin = !!f.admin;
  aplicarFoto(f, cambioRol);
  document.body.classList.remove('cargando');
}

function aplicarFoto(f, forzar = false) {
  if (f.version === estado.version) {
    pintarEstado();
    if (forzar) calcular();
    return;
  }
  const antes = estado.alerta;
  estado.version = f.version;
  estado.alerta = f.emergencia;
  estado.nodosBloq = new Set(f.nodos);
  estado.aristasBloq = new Set(f.aristas);
  document.body.classList.toggle('alerta', estado.alerta);
  pintarEstado();
  if (antes !== estado.alerta) actualizarComportamientoPersonas();
  calcular();
}

/** Textos del encabezado según el estado (y la conexión). */
function pintarEstado() {
  const act = estado.alerta;
  const sinRed = document.body.classList.contains('desconectado');
  const t = $('textoEstado');
  if (t) t.textContent = (act ? 'Emergencia: ACTIVA' : 'Sin emergencia') + (sinRed ? ' · sin conexión' : '');
  const b = $('btnAlerta');
  if (b) {
    $('textoAlerta').textContent = act ? 'Emergencia: ACTIVA · Desactivar' : 'Emergencia: INACTIVA · Activar';
    b.setAttribute('aria-pressed', String(act));
  }
  const banner = $('bannerAlerta');
  if (banner) banner.hidden = !act;
  const info = $('infoAdmin');
  if (info) {
    const n = estado.nodosBloq.size + estado.aristasBloq.size;
    info.textContent = (act ? 'Emergencia ACTIVA' : 'Sin emergencia') + ' · ' +
      (n === 0 ? 'ningún bloqueo' : n === 1 ? '1 bloqueo' : n + ' bloqueos') +
      (sinRed ? ' · sin conexión con el servidor' : '');
  }
  document.title = act ? '🚨 EMERGENCIA · Net Path UPC' : TITULO_BASE;
}

/** Envía un cambio de administrador. Se hacen de uno en uno para que lleguen en orden. */
function enviarAdmin(url, datos) {
  const tarea = cola.then(async () => {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(datos).toString(),
      credentials: 'same-origin',
    });
    postsHechos++;
    if (resp.status === 401) {
      document.body.classList.add('sin-sesion');
      estado.admin = false;
      throw new Error('sesion');
    }
    if (!resp.ok) throw new Error('http ' + resp.status);
    return resp.json();
  });
  cola = tarea.catch(() => {});
  return tarea;
}

// Ubicación del estudiante: se recuerda en este navegador (solo comodidad).
function guardarOrigen() {
  try {
    if (estado.origen) localStorage.setItem('ruta.origen', estado.origen);
    else localStorage.removeItem('ruta.origen');
  } catch (_) { /* almacenamiento bloqueado: no pasa nada */ }
}

function recuperarOrigen() {
  try {
    const id = localStorage.getItem('ruta.origen');
    if (id && estado.nodos.has(id)) {
      estado.origen = id;
      $('selOrigen').value = id;
    }
  } catch (_) { /* idem */ }
}

function construirMapa() {
  const svg = $('mapa');
  svg.replaceChildren();

  // Fondo: plaza y edificios
  // Plaza central
  el('rect', { x: 450, y: 340, width: 160, height: 90, rx: 16, class: 'plaza' }, svg);
  el('text', { x: 530, y: 390, class: 'plaza-nombre', 'text-anchor': 'middle' }, svg).textContent = 'Plaza central';

  // Entradas (etiquetas grandes)
  el('rect', { x: 1085, y: 360, width: 100, height: 36, rx: 8, fill: '#dbeafe', stroke: '#3b82f6', 'stroke-width': 2 }, svg);
  el('text', { x: 1135, y: 383, class: 'plaza-nombre', 'text-anchor': 'middle', fill: '#1d4ed8', 'font-weight': '700' }, svg).textContent = 'ENTRADA';

  el('rect', { x: 15, y: 455, width: 90, height: 36, rx: 8, fill: '#dbeafe', stroke: '#3b82f6', 'stroke-width': 2 }, svg);
  el('text', { x: 60, y: 478, class: 'plaza-nombre', 'text-anchor': 'middle', fill: '#1d4ed8', 'font-weight': '700' }, svg).textContent = 'LATERAL';

  // Arbolización
  const arboles = [
    [180, 130], [480, 120], [560, 90], [900, 120],
    [100, 520], [400, 520], [500, 500], [850, 480],
    [300, 650], [800, 650], [1000, 500], [150, 600],
  ];
  for (const [ax, ay] of arboles) {
    el('circle', { cx: ax, cy: ay, r: 14, fill: '#c6e6c8', stroke: '#9ccc9e', 'stroke-width': 1.5, opacity: 0.85 }, svg);
    el('circle', { cx: ax, cy: ay, r: 7, fill: '#a8d4aa', opacity: 0.9 }, svg);
  }

  for (const e of EDIFICIOS) {
    el('rect', { x: e.x, y: e.y, width: e.w, height: e.h, rx: 10, class: 'edificio' }, svg);
    el('text', { x: e.x + 8, y: e.y + e.h - 8, class: 'edif-nombre' }, svg).textContent = e.n;
  }

  // Caminos
  const capaAristas = el('g', {}, svg);
  for (const a of estado.campus.aristas) {
    const na = estado.nodos.get(a.a);
    const nb = estado.nodos.get(a.b);
    const g = el('g', {}, capaAristas);
    const coords = { x1: na.x, y1: na.y, x2: nb.x, y2: nb.y };

    const visible = el('line', { ...coords, class: 'camino' + (a.riesgo > 1 ? ' riesgo' : '') }, g);
    const hit = el('line', { ...coords, class: 'hit' }, g);
    let texto = `${na.nombre} ↔ ${nb.nombre} · ${a.metros} m`;
    if (a.riesgo > 1) texto += ' · zona de riesgo';
    el('title', {}, hit).textContent = texto;
    hit.addEventListener('click', () => clickArista(a.clave));

    const marca = el('text', { x: (na.x + nb.x) / 2, y: (na.y + nb.y) / 2 + 5, class: 'x-bloqueo' }, g);
    marca.textContent = '✕';
    marca.style.display = 'none';
    refs.aristas.set(a.clave, { visible, marca });
  }

  capaRuta = el('g', {}, svg);
  capaPersonas = el('g', { id: 'capa-personas' }, svg);

  // Puntos
  const capaNodos = el('g', {}, svg);
  for (const n of estado.campus.nodos) {
    const g = el('g', { class: 'nodo tipo-' + n.tipo }, capaNodos);
    el('circle', { cx: n.x, cy: n.y, r: RADIO[n.tipo] }, g);
    el('title', {}, g).textContent = n.nombre;
    if (n.tipo === 'PUNTO_ENCUENTRO') {
      el('text', { x: n.x, y: n.y + 3.5, class: 'pe-sigla' }, g).textContent = 'PE';
    }
    if (n.tipo === 'SALON' || n.tipo === 'PUNTO_ENCUENTRO') etiquetaNodo(n, g);
    g.addEventListener('click', () => clickNodo(n.id));
    refs.nodos.set(n.id, g);
  }

  capaMarcas = el('g', {}, svg);
}

function etiquetaNodo(n, g) {
  const pe = n.tipo === 'PUNTO_ENCUENTRO';
  const ancho = estado.campus.ancho;
  let x = n.x;
  let anchor = 'middle';
  if (n.x < 90) { anchor = 'start'; x = Math.max(n.x - 16, 6); }
  else if (n.x > ancho - 90) { anchor = 'end'; x = Math.min(n.x + 16, ancho - 6); }
  const y = pe ? n.y + 28 : n.y - 12;
  el('text', { x, y, 'text-anchor': anchor, class: pe ? 'et-pe' : 'et-nodo' }, g).textContent = n.nombre;
}

function llenarSelect() {
  const sel = $('selOrigen');
  sel.replaceChildren(new Option('— Elige tu ubicación —', ''));
  const grupos = [
    ['Salones y lugares', (n) => n.tipo === 'SALON'],
    ['Pasillos y puertas', (n) => n.tipo === 'PASILLO' || n.tipo === 'SALIDA'],
    ['Puntos de encuentro', (n) => n.tipo === 'PUNTO_ENCUENTRO'],
  ];
  for (const [titulo, filtro] of grupos) {
    const og = document.createElement('optgroup');
    og.label = titulo;
    estado.campus.nodos
      .filter(filtro)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      .forEach((n) => og.appendChild(new Option(n.nombre, n.id)));
    sel.appendChild(og);
  }
}

function conectarControles() {
  sobre('selOrigen', 'change', (e) => {
    estado.origen = e.target.value || null;
    guardarOrigen();
    calcular();
  });

  // Todo lo de abajo solo existe en admin.html
  document.querySelectorAll('[data-modo]').forEach((b) =>
    b.addEventListener('click', () => cambiarModo(b.dataset.modo)));
  sobre('btnLimpiar', 'click', () => {
    estado.nodosBloq.clear();
    estado.aristasBloq.clear();
    guardarBloqueos();
  });
  sobre('btnAzar', 'click', ubicacionAlAzar);
  sobre('btnAlerta', 'click', alternarAlerta);
  sobre('btnSimular', 'click', iniciarSimulacion);
  sobre('btnDetener', 'click', detenerSimulacion);

  if (ES_ADMIN) cambiarModo('ubicacion');
}

// ------------------------------------------------------------ Interacciones

function cambiarModo(modo) {
  estado.modo = modo;
  document.querySelectorAll('[data-modo]').forEach((b) =>
    b.classList.toggle('activo', b.dataset.modo === modo));
  if ($('pistaModo')) $('pistaModo').textContent = PISTAS[modo];
  $('mapa').classList.toggle('modo-bloqueo', modo === 'bloqueo');
}

function clickNodo(id) {
  if (ES_ADMIN && estado.modo === 'bloqueo') {
    alternar(estado.nodosBloq, id);
    guardarBloqueos();
    return;
  }
  estado.origen = id;
  guardarOrigen();
  $('selOrigen').value = id;
  calcular();
}

function clickArista(clave) {
  if (!ES_ADMIN || estado.modo !== 'bloqueo') return;
  alternar(estado.aristasBloq, clave);
  guardarBloqueos();
}

/** Admin: manda los bloqueos al servidor (los estudiantes los verán en pocos segundos). */
async function guardarBloqueos() {
  dibujar();                               // se ve al instante; el servidor confirma después
  try {
    const f = await enviarAdmin('/api/admin/bloqueos', {
      nodos: [...estado.nodosBloq].join(','),
      aristas: [...estado.aristasBloq].join(','),
    });
    aplicarFoto(f);
  } catch (e) {
    avisoAdmin(e.message === 'sesion'
      ? 'Tu sesión expiró. Vuelve a entrar.' : 'No se pudo guardar el bloqueo.');
    sincronizar();
  }
}

function avisoAdmin(texto) {
  const c = $('resultado');
  if (c) c.innerHTML = `<div class="tarjeta mal">${esc(texto)}</div>`;
}

function alternar(conjunto, valor) {
  if (!conjunto.delete(valor)) conjunto.add(valor);
}

function ubicacionAlAzar() {
  const candidatos = estado.campus.nodos.filter(
    (n) => n.tipo !== 'PUNTO_ENCUENTRO' && !estado.nodosBloq.has(n.id));
  const n = candidatos[Math.floor(Math.random() * candidatos.length)];
  estado.origen = n.id;
  $('selOrigen').value = n.id;
  guardarOrigen();
  calcular();
}

async function alternarAlerta() {
  const activar = !estado.alerta;
  const pregunta = activar
    ? '¿Activar la emergencia?\n\nTodos los estudiantes verán la alerta y su ruta de evacuación.'
    : '¿Desactivar la emergencia?\n\nLos estudiantes dejarán de ver la ruta de evacuación.';
  if (!window.confirm(pregunta)) return;
  try {
    const f = await enviarAdmin('/api/admin/emergencia', { activa: String(activar) });
    aplicarFoto(f);
  } catch (e) {
    avisoAdmin(e.message === 'sesion'
      ? 'Tu sesión expiró. Vuelve a entrar.' : 'No se pudo cambiar el estado de la emergencia.');
    sincronizar();
  }
}

// ------------------------------------------------------------------ Servidor

async function calcular() {
  const mio = ++ticket;
  dibujar();
  if (!estado.origen) {
    estado.plan = null;
    dibujar();
    return;
  }
  // Los bloqueos ya no se mandan: el servidor usa los suyos.
  const q = new URLSearchParams({ origen: estado.origen });
  try {
    const resp = await fetch('/api/ruta?' + q.toString());
    const plan = await resp.json();
    if (mio !== ticket) return;
    estado.plan = plan;
  } catch (e) {
    if (mio !== ticket) return;
    estado.plan = { ok: false, mensaje: 'No se pudo contactar con el servidor Java.', opciones: [] };
  }
  dibujar();
}

// ------------------------------------------------------------------- Dibujo

function dibujar() {
  const plan = (estado.alerta || ES_ADMIN) ? estado.plan : null;
  const hayRuta = !!(plan && plan.ok);

  for (const [id, g] of refs.nodos) {
    g.classList.toggle('bloqueado', estado.nodosBloq.has(id));
    g.classList.toggle('destino', hayRuta && plan.destino === id);
  }
  for (const [clave, r] of refs.aristas) {
    const bloqueada = estado.aristasBloq.has(clave);
    r.visible.classList.toggle('bloqueada', bloqueada);
    r.marca.style.display = bloqueada ? '' : 'none';
  }

  capaRuta.replaceChildren();
  capaMarcas.replaceChildren();

  if (hayRuta && plan.camino.length > 1) {
    const puntos = plan.camino.map((id) => {
      const n = estado.nodos.get(id);
      return `${n.x},${n.y}`;
    }).join(' ');
    el('polyline', { points: puntos, class: 'ruta-base' }, capaRuta);
    el('polyline', { points: puntos, class: 'ruta-flujo' }, capaRuta);
  }

  if (estado.origen) {
    const n = estado.nodos.get(estado.origen);
    el('circle', { cx: n.x, cy: n.y, r: 10, class: 'yo-pulso' }, capaMarcas);
    el('circle', { cx: n.x, cy: n.y, r: 7, class: 'yo' }, capaMarcas);
  }

  pintarPanel();
}

function pintarPanel() {
  const cont = $('resultado');
  const alt = $('alternativas');

  if (!estado.alerta && !ES_ADMIN) {
    cont.innerHTML = '<div class="tarjeta neutra"><b>No hay ninguna emergencia activa.</b><br>' +
      'Si se activa, aquí aparecerá tu ruta hacia el punto de encuentro.</div>';
    alt.innerHTML = '';
    return;
  }
  // El admin puede ensayar rutas aunque no haya emergencia (los estudiantes no ven nada).
  const aviso = estado.alerta ? '' :
    '<div class="tarjeta previa"><b>Vista previa.</b> Los estudiantes no ven esto hasta que actives la emergencia.</div>';

  const plan = estado.plan;
  if (!estado.origen || !plan) {
    cont.innerHTML = aviso + '<div class="tarjeta neutra">Elige tu ubicación para ver la ruta al punto de encuentro más cercano.</div>';
    alt.innerHTML = '';
    return;
  }

  if (!plan.ok) {
    cont.innerHTML = aviso + `<div class="tarjeta mal">${esc(plan.mensaje)}</div>`;
  } else if (plan.camino.length === 1) {
    cont.innerHTML = aviso + `<div class="tarjeta ok"><div class="etiqueta">Estás en un lugar seguro</div>
      <div class="destino">${esc(plan.destinoNombre)}</div>
      Ya te encuentras en un punto de encuentro. Mantente aquí y espera instrucciones.</div>`;
  } else {
    const pasos = plan.camino.map((id) => `<li>${esc(estado.nodos.get(id).nombre)}</li>`).join('');
    cont.innerHTML = aviso + `<div class="tarjeta ok">
        <div class="etiqueta">Dirígete a</div>
        <div class="destino">${esc(plan.destinoNombre)}</div>
        <div class="metricas">
          <div><b>${plan.distanciaM.toFixed(0)} m</b><span>distancia</span></div>
          <div><b>${fmtTiempo(plan.tiempoS)}</b><span>tiempo aprox.</span></div>
        </div>
        <ol class="pasos">${pasos}</ol>
      </div>`;
  }

  if (plan.opciones && plan.opciones.length) {
    const filas = plan.opciones.map((o) => `<tr class="${hayMejor(plan, o) ? 'mejor' : ''}">
        <td>${esc(o.nombre)}</td>
        <td>${o.alcanzable ? o.distanciaM.toFixed(0) + ' m' : '<span class="sin">sin acceso</span>'}</td>
      </tr>`).join('');
    alt.innerHTML = `<table><caption>Todos los puntos de encuentro</caption>${filas}</table>`;
  } else {
    alt.innerHTML = '';
  }
}

const hayMejor = (plan, o) => plan.ok && plan.destino === o.id;

// ================================================================
//  SIMULACIÓN DE PERSONAS
//  - Sin emergencia: caminan normal por el campus (roaming)
//  - Con emergencia: corren hacia el punto de encuentro más cercano
// ================================================================

async function pedirRuta(origenId) {
  const q = new URLSearchParams({ origen: origenId });
  const resp = await fetch('/api/ruta?' + q.toString());
  return resp.json();
}

/** Vecinos directos de un nodo (no bloqueados). */
function vecinosDe(id) {
  return estado.campus.aristas
    .filter(a => (a.a === id || a.b === id) && !estado.aristasBloq.has(a.clave))
    .map(a => a.a === id ? a.b : a.a)
    .filter(nid => !estado.nodosBloq.has(nid));
}

/** Camino aleatorio corto de roaming (2-4 pasos) para modo normal. */
function caminoRoaming(desdeId) {
  const camino = [desdeId];
  let actual = desdeId;
  const pasos = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < pasos; i++) {
    const vecs = vecinosDe(actual).filter(v => v !== camino[camino.length - 2]);
    if (vecs.length === 0) break;
    const sig = vecs[Math.floor(Math.random() * vecs.length)];
    camino.push(sig);
    actual = sig;
  }
  return camino.length >= 2 ? camino : null;
}

function idActualPersona(p) {
  if (!p.camino || p.camino.length === 0) return null;
  return p.camino[Math.min(p.idx, p.camino.length - 1)];
}

function aplicarEstiloPersona(p) {
  // Emergencia = morado intenso + un poco más grande; normal = azul suave
  if (estado.alerta) {
    p.circulo.setAttribute('fill', '#7c3aed');
    p.circulo.setAttribute('r', '6.2');
    p.sombra.setAttribute('fill', 'rgba(124, 58, 237, 0.28)');
    p.sombra.setAttribute('r', '11');
  } else {
    p.circulo.setAttribute('fill', '#3b82f6');
    p.circulo.setAttribute('r', '5.2');
    p.sombra.setAttribute('fill', 'rgba(59, 130, 246, 0.18)');
    p.sombra.setAttribute('r', '9');
  }
}

async function ponerEnModoEmergencia(p) {
  const actual = idActualPersona(p);
  if (!actual) return;
  p.modo = 'evacuando';
  p.velocidad = 0.028 + Math.random() * 0.015; // más rápido (corren)
  aplicarEstiloPersona(p);
  try {
    const plan = await pedirRuta(actual);
    if (plan.ok && plan.camino && plan.camino.length >= 2) {
      p.camino = plan.camino;
      p.idx = 0;
      p.progreso = 0;
      p.espera = 0;
    } else {
      // Sin ruta: intenta moverse a un vecino
      const vecs = vecinosDe(actual);
      if (vecs.length) {
        p.camino = [actual, vecs[Math.floor(Math.random() * vecs.length)]];
        p.idx = 0;
        p.progreso = 0;
      }
    }
  } catch (_) { /* ignore */ }
}

function ponerEnModoNormal(p) {
  p.modo = 'normal';
  p.velocidad = 0.008 + Math.random() * 0.008; // más lento, caminata normal
  aplicarEstiloPersona(p);
  const actual = idActualPersona(p);
  if (!actual) return;
  const camino = caminoRoaming(actual);
  if (camino) {
    p.camino = camino;
    p.idx = 0;
    p.progreso = 0;
    p.espera = 0;
  }
}

async function iniciarSimulacion() {
  if (estado.simulando) return;
  estado.simulando = true;
  $('btnSimular').classList.add('oculto');
  $('btnDetener').classList.remove('oculto');

  const candidatos = estado.campus.nodos.filter(
    (n) => (n.tipo === 'SALON' || n.tipo === 'PASILLO' || n.tipo === 'SALIDA')
         && !estado.nodosBloq.has(n.id)
  );
  const cantidad = Math.min(14, candidatos.length);
  const elegidos = [];
  const usados = new Set();
  while (elegidos.length < cantidad) {
    const n = candidatos[Math.floor(Math.random() * candidatos.length)];
    if (!usados.has(n.id)) {
      usados.add(n.id);
      elegidos.push(n);
    }
  }

  estado.personas = [];
  capaPersonas.replaceChildren();

  for (const origen of elegidos) {
    const g = el('g', { class: 'persona' }, capaPersonas);
    const sombra = el('circle', { r: 9, class: 'persona-sombra' }, g);
    const circulo = el('circle', { r: 5.5 }, g);

    circulo.setAttribute('cx', origen.x);
    circulo.setAttribute('cy', origen.y);
    sombra.setAttribute('cx', origen.x);
    sombra.setAttribute('cy', origen.y);

    const p = {
      camino: [origen.id],
      idx: 0,
      progreso: 0,
      espera: Math.floor(Math.random() * 30),
      el: g,
      sombra,
      circulo,
      velocidad: 0.01,
      modo: estado.alerta ? 'evacuando' : 'normal',
      buscando: false,
    };
    aplicarEstiloPersona(p);
    estado.personas.push(p);

    // Asignar primera ruta según el estado de alerta
    if (estado.alerta) {
      ponerEnModoEmergencia(p);
    } else {
      ponerEnModoNormal(p);
    }
  }

  if (estado.personas.length === 0) {
    detenerSimulacion();
    return;
  }

  animarPersonas();
}

function detenerSimulacion() {
  estado.simulando = false;
  estado.personas = [];
  if (animFrame) cancelAnimationFrame(animFrame);
  animFrame = null;
  capaPersonas.replaceChildren();
  $('btnSimular').classList.remove('oculto');
  $('btnDetener').classList.add('oculto');
}

/** Cuando se activa/desactiva la alerta, todas las personas cambian de comportamiento. */
function actualizarComportamientoPersonas() {
  if (!estado.simulando) return;
  for (const p of estado.personas) {
    if (estado.alerta) {
      ponerEnModoEmergencia(p);
    } else {
      ponerEnModoNormal(p);
    }
  }
}

function animarPersonas() {
  if (!estado.simulando) return;

  for (const p of estado.personas) {
    // Pausa breve al llegar a un nodo destino
    if (p.espera > 0) {
      p.espera--;
      if (p.espera === 0 && !p.buscando) {
        p.buscando = true;
        const promesa = estado.alerta
          ? ponerEnModoEmergencia(p)
          : Promise.resolve(ponerEnModoNormal(p));
        Promise.resolve(promesa).finally(() => { p.buscando = false; });
      }
      continue;
    }

    // Llegó al final del camino actual
    if (p.idx >= p.camino.length - 1) {
      const dest = estado.nodos.get(p.camino[p.camino.length - 1]);
      if (dest) {
        p.circulo.setAttribute('cx', dest.x);
        p.circulo.setAttribute('cy', dest.y);
        p.sombra.setAttribute('cx', dest.x);
        p.sombra.setAttribute('cy', dest.y);
      }

      if (estado.alerta && dest && dest.tipo === 'PUNTO_ENCUENTRO') {
        // En emergencia y ya está en un PE: se queda un rato "seguro"
        p.espera = 80 + Math.floor(Math.random() * 60);
      } else {
        // Pausa corta y sigue
        p.espera = estado.alerta
          ? 8 + Math.floor(Math.random() * 15)   // casi no para (urgente)
          : 25 + Math.floor(Math.random() * 40); // pausa natural
      }
      continue;
    }

    const a = estado.nodos.get(p.camino[p.idx]);
    const b = estado.nodos.get(p.camino[p.idx + 1]);
    if (!a || !b) {
      p.espera = 15;
      continue;
    }

    p.progreso += p.velocidad;
    if (p.progreso >= 1) {
      p.progreso = 0;
      p.idx++;
      continue;
    }

    const x = a.x + (b.x - a.x) * p.progreso;
    const y = a.y + (b.y - a.y) * p.progreso;
    p.circulo.setAttribute('cx', x);
    p.circulo.setAttribute('cy', y);
    p.sombra.setAttribute('cx', x);
    p.sombra.setAttribute('cy', y);
  }

  animFrame = requestAnimationFrame(animarPersonas);
}

iniciar();
