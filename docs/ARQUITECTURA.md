# Arquitectura en capas · GRASP · SOLID

Net Path UPC está organizado en **4 paquetes (capas)**. Cada capa solo puede usar a las de abajo,
y la regla **se comprueba automáticamente** en la prueba 16 de `Pruebas.java`
(si alguien agrega un `import` prohibido, la prueba falla).

```
┌─────────────────────────────────────────────────────────────┐
│ PRESENTACIÓN   evacuacion.presentacion                      │
│  http/  Controladores (un endpoint cada uno), ServidorWeb   │
│  json/  Vistas JSON (cómo se escribe cada respuesta)        │
│  + web/ (HTML, CSS y JavaScript del navegador)              │
└───────────────────────────┬─────────────────────────────────┘
                            │ usa
┌───────────────────────────▼─────────────────────────────────┐
│ NEGOCIO        evacuacion.negocio                           │
│  servicios/  Casos de uso: Mapa, Emergencia, Evacuacion,    │
│              Autenticacion                                  │
│  ruta/       AlgoritmoRuta (Dijkstra, BellmanFord),         │
│              CalculadoraCosto, PlanificadorEvacuacion       │
│  seguridad/  Verificador de clave, Limitador, Token         │
└───────────────────────────┬─────────────────────────────────┘
                            │ usa (solo interfaces)
┌───────────────────────────▼─────────────────────────────────┐
│ DATOS          evacuacion.datos                             │
│  Repositorio* (interfaces) · memoria/ · bd/ (PostgreSQL)    │
│  clave/ (de dónde sale la clave: archivo, entorno)          │
└─────────────────────────────────────────────────────────────┘
        ▲ todas las capas usan
┌───────┴─────────────────────────────────────────────────────┐
│ MODELO         evacuacion.modelo                            │
│  Nodo, Arista, Grafo, Restricciones, EstadoEmergencia,      │
│  PlanEvacuacion... (solo datos y reglas propias; no depende │
│  de ninguna otra capa)                                      │
└─────────────────────────────────────────────────────────────┘

Main (evacuacion.Main): arma todo. Es el único que conoce las clases concretas.
```

| Capa | Puede usar | NO puede usar |
| --- | --- | --- |
| modelo | nada (solo Java) | datos, negocio, presentacion |
| datos | modelo | negocio, presentacion |
| negocio | modelo, datos | presentacion |
| presentacion | negocio, modelo | **datos** (siempre pasa por un servicio) |

## Cómo viaja una petición

`Estudiante pide su ruta` → `RutaControlador` (presentación) → `EvacuacionServicio` (negocio: ¿hay emergencia?
¿es admin?) → `PlanificadorEvacuacion` → `AlgoritmoRuta` (Dijkstra) con `CalculadoraCosto` sobre el `Grafo` (modelo),
leyendo el mapa y los bloqueos de los `Repositorio*` (datos) → `PlanJson` lo escribe como JSON → el navegador lo dibuja.

## GRASP

### Básicos

| Patrón | Dónde se ve | Por qué |
| --- | --- | --- |
| **Experto en información** | `Restricciones.bloqueaNodo/bloqueaArista`, `Arista.clave()`, `ResultadoRuta.camino()`, `OpcionEvacuacion.tiempoSegundos()`, `Nodo.esPuntoDeEncuentro()` | Cada dato lo manipula la clase que lo tiene |
| **Creador** | `MapaEnMemoria` crea el `Grafo` con sus `Nodo` y `Arista`; `Grafo.conectar` crea las `Arista`; `Main` crea los servicios | Crea el objeto quien lo contiene o lo usa más de cerca |
| **Controlador** | `*Controlador` (presentación) reciben los eventos HTTP y delegan; los `*Servicio` coordinan cada caso de uso | La interfaz no contiene reglas; solo traduce HTTP ↔ negocio |
| **Bajo acoplamiento** | La presentación solo habla con servicios; el negocio solo conoce interfaces de datos; `Dijkstra` no sabe de HTTP | Se puede cambiar una parte sin romper las otras (prueba 12 usa un mapa falso) |
| **Alta cohesión** | `LimitadorIntentos` solo limita; `VerificadorClave` solo compara; `GeneradorToken` solo crea tokens | Cada clase tiene un tema |

### Avanzados

| Patrón | Dónde se ve | Por qué |
| --- | --- | --- |
| **Polimorfismo** | `AlgoritmoRuta` (Dijkstra / BellmanFord), `CalculadoraCosto` (CostoPorRiesgo / CostoPorDistancia), `Controlador`, `ProveedorClave`, `Repositorio*` | Se cambia el comportamiento eligiendo otra implementación, sin `if` por tipo |
| **Fabricación pura** | `PlanificadorEvacuacion`, `LimitadorIntentos`, `ServidorWeb`, `Http`, los repositorios | Clases que no existen en el campus, creadas para mantener limpio el resto |
| **Indirección** | Los `*Servicio` entre controladores y datos; los `Repositorio*` entre negocio y almacenamiento; `SesionHttp` entre la cookie y la autenticación | Una pieza intermedia evita que dos capas se conozcan |
| **Variaciones protegidas** | `AlgoritmoRuta` y `CalculadoraCosto` protegen al planificador de cambios de algoritmo o criterio; `Repositorio*` protegen al negocio de cambios de almacenamiento (memoria → base de datos); `ProveedorClave` de cambios en el origen de la clave | Los puntos donde se espera que algo cambie quedan detrás de una interfaz |

## SOLID

### S · Responsabilidad única

Cada clase tiene **una sola razón para cambiar**. Lo que se separó al refactorizar:

- Antes `Servidor` hacía todo (rutas, archivos, cookies, clave, cabeceras, JSON). Ahora son `ServidorWeb`, 7 controladores, `ArchivosControlador`, `SesionHttp`, `Http` y `ResolutorClave`.
- Antes `Sesiones` verificaba la clave, limitaba intentos, creaba tokens y guardaba sesiones. Ahora son `VerificadorClave`, `LimitadorIntentos`, `GeneradorToken`, `SesionesEnMemoria` y `AutenticacionServicio` (que solo coordina).
- Antes `Evacuacion.Plan` sabía escribirse como JSON. Ahora `PlanEvacuacion` solo guarda datos y `PlanJson` lo escribe.
- Antes `Arista` decidía su costo. Ahora lo decide una `CalculadoraCosto`.
- Antes `Estado` guardaba y además aplicaba las reglas. Ahora `RepositorioEmergencia` guarda y `EmergenciaServicio` aplica las reglas.

### O · Abierto/cerrado

Se **extiende agregando clases**, sin modificar las que ya funcionan:

| Quiero... | Hago... | No toco... |
| --- | --- | --- |
| Otro algoritmo de rutas | Nueva clase que implemente `AlgoritmoRuta` y cambiar 1 línea en `Main` | `PlanificadorEvacuacion`, servicios, controladores |
| Otro criterio de costo (por ejemplo, evitar escaleras) | Nueva clase que implemente `CalculadoraCosto` | `Dijkstra`, `Arista` |
| Un endpoint nuevo | Nueva clase que implemente `Controlador` y agregarla a la lista de `Main` | `ServidorWeb` |
| Otra fuente de la clave (por ejemplo, un servicio externo) | Nueva clase que implemente `ProveedorClave` | `ResolutorClave` |
| Guardar en una base de datos | Implementar los `Repositorio*` (ya hecho para PostgreSQL: `MapaEnBD`, `EmergenciaEnBD`) | Todo el negocio |

Las pruebas 8 y 9 lo demuestran: usan `BellmanFord` y un criterio de costo nuevo escrito en una línea, sin modificar nada.

### L · Sustitución de Liskov

Cualquier implementación de una interfaz **cumple el mismo contrato**, así que se puede cambiar por otra sin que nadie lo note.
Los contratos están escritos en el comentario de cada interfaz:

- `AlgoritmoRuta`: devuelve el costo **mínimo**, no pasa por bloqueos, y con un origen inválido devuelve un resultado vacío (no lanza excepción).
- `CalculadoraCosto`: devuelve un número finito y **no negativo**, igual en ambos sentidos.
- `ProveedorClave`: si no tiene clave devuelve `Optional.empty()`, nunca texto vacío ni excepción.
- `Controlador`: siempre responde la petición.

La prueba 8 verifica el contrato de `Dijkstra` y `BellmanFord` con los dos criterios de costo, con y sin bloqueos.

> Bonus: los `Repositorio*` y `Main` también aplican **Inversión de dependencias (D)**: el negocio depende de interfaces, no de las clases en memoria.
> No usamos Segregación de interfaces (I) de forma deliberada: casi todas nuestras interfaces tienen 1 o 2 métodos.

## Qué queda por mejorar (honesto)

- El navegador (`web/app.js`) sigue siendo un solo archivo de unas 770 líneas; no se separó por capas.
- `Http` es una clase de utilidades con métodos estáticos; podría convertirse en objetos con interfaz.
- Los repositorios de mapa y emergencia tienen versión en memoria y en PostgreSQL; las sesiones siguen solo en memoria (son temporales). La base supone un solo servidor escribiendo, y no hay herramienta de migraciones: las tablas se crean con `CREATE TABLE IF NOT EXISTS`.
- Las pruebas son un programa propio (`Pruebas.java`), no JUnit.
