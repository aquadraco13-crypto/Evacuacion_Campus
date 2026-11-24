const zonas = [
  ['Campus', [
    ['model', 'Maqueta general'], ['map', 'Desde arriba'], ['sectorP', 'Conjunto de los bloques I y P']
  ]],
  ['Plazas y jardines', [
    ['plaza', 'Plaza principal'], ['centralSquare', 'Panorámica de la plaza central'],
    ['walks', 'Plaza techada'], ['monument', 'Monumento YO ♥ UPC'], ['southGarden', 'Jardín sur']
  ]],
  ['Bloque A', [['facadeA','Galerías'], ['cafeA','Cafetería']]],
  ['Bloque H', [['blockH','Fachada'], ['fountain','Fuente UPC'], ['dining','Comedor universitario']]],
  ['Bloque I', [
    ['frontI','Explanada'], ['blockI','Pasillo interior'], ['stairsI','Escaleras'], ['elevator','Ascensor'],
    ['cutI','Corte del edificio'], ['lookoutI','Vista a la cafetería'], ['cafeteria','Cafetería'],
    ['kioskI','Ventanilla'], ['iceCream','Heladería']
  ]],
  ['Bloque P', [
    ['blockP','Patio'], ['labsP','Laboratorios'], ['upperP','Pasillos superiores'], ['stairsP','Escalera en espiral']
  ]],
  ['Patio arbolado', [
    ['garden','Patio a nivel del suelo'], ['gardenPlan','Patio desde arriba'], ['gardenPassage','Paso entre edificios'],
    ['gardenAC','Andén de los aires'], ['gardenACBoth','Vista de ambos andenes']
  ]],
  ['Accesos y pasajes', [
    ['mainGate','Entrada principal'], ['arrival','Diagonal 21'], ['coveredLink','Pasaje cubierto'],
    ['underVault','Bajo la bóveda'], ['adminEntry','Acceso académico-administrativo']
  ]]
];

export function montarNavegacion(halls, viajar, cambiarPiso) {
  const catalogo = new Map(zonas.map(([zona,vistas])=>[zona,[...vistas]]));
  const alas = {
    'Bloque H': ['Bloque H','Pasillo interior'],
    'Académico-administrativo': ['Accesos y pasajes','Pasillo académico-administrativo'],
    'Pabellón del acceso': ['Accesos y pasajes','Pasillo del pabellón'],
    'Ala occidental': ['Patio arbolado','Pasillo del ala occidental'],
    'Ala derecha del patio': ['Patio arbolado','Pasillo del ala derecha'],
    'Ala de las galerías': ['Bloque A','Pasillo de las galerías']
  };
  for(const [i,hall] of halls.entries()){
    const [zona,nombre]=alas[hall.label] || [hall.label,'Pasillo interior'];
    if(!catalogo.has(zona)) catalogo.set(zona,[]);
    catalogo.get(zona).push(['hall-'+i,nombre]);
  }
  const zona=document.querySelector('#zona'), vista=document.querySelector('#vista');
  const pisos=document.querySelector('#pisos'), lista=pisos.querySelector('.floor-list');
  const zonaPorVista=new Map();
  for(const [nombre,opciones] of catalogo){
    zona.add(new Option(nombre,nombre));
    for(const [id] of opciones) zonaPorVista.set(id,nombre);
  }
  function llenarVistas(nombre) {
    zona.value=nombre;
    const libre=new Option('Vista libre','');
    libre.hidden=true;libre.disabled=true;
    vista.replaceChildren(libre,...catalogo.get(nombre).map(([id,label])=>new Option(label,id)));
  }
  zona.onchange=()=>viajar(catalogo.get(zona.value)[0][0]);
  vista.onchange=()=>viajar(vista.value);
  lista.addEventListener('click',e=>{
    const boton=e.target.closest('button[data-piso]');
    if(boton) cambiarPiso(Number(boton.dataset.piso));
  });
  zona.disabled=false;vista.disabled=false;
  let opcionesDe=null;
  return function mostrar(id,cuantos=0,activo=0){
    if(id && opcionesDe!==zonaPorVista.get(id)){
      opcionesDe=zonaPorVista.get(id);
      llenarVistas(opcionesDe);
    }
    vista.value=id || '';
    pisos.hidden=cuantos<2;
    if(pisos.hidden) return;
    if(lista.childElementCount!==cuantos){
      lista.replaceChildren(...Array.from({length:cuantos},(_,i)=>{
        const b=document.createElement('button');b.type='button';b.dataset.piso=i;
        b.textContent=i+1;b.setAttribute('aria-label','Piso '+(i+1));return b;
      }));
    }
    for(const b of lista.children) b.setAttribute('aria-pressed',String(Number(b.dataset.piso)===activo));
  };
}
