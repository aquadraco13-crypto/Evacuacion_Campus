# Net Path UPC · Navegación de emergencias en el campus (boceto)

Universidad Popular del Cesar. El campus se modela como un **grafo** y se usa el **algoritmo de Dijkstra**
para calcular la ruta más corta hacia el **punto de encuentro** más conveniente en caso de emergencia (sismo, incendio u otra).
Si un camino o una puerta queda bloqueado, la ruta se recalcula al instante.

Solo usa el JDK (Java 17 o superior). No hay que instalar librerías.

## Cómo ejecutarlo

**Linux / macOS**
```
./ejecutar.sh
```
(si dice "permiso denegado": `chmod +x ejecutar.sh`)

**Windows**: doble clic en `ejecutar.bat`.

**A mano** (cualquier sistema), desde esta carpeta:
```
javac -encoding UTF-8 -d out -sourcepath src src/evacuacion/Main.java src/evacuacion/pruebas/Pruebas.java
java -cp "out:lib/postgresql-42.7.2.jar" evacuacion.pruebas.Pruebas
java -cp "out:lib/postgresql-42.7.2.jar" evacuacion.Main 8080 web
```
(en Windows se usa `;` en vez de `:` en el `-cp`)

Luego abre en el navegador (para otro puerto: `./ejecutar.sh 9090`):

- **Estudiantes:** http://localhost:8080  (solo ven; no pueden cambiar nada)
- **Administradores:** http://localhost:8080/admin.html  (piden clave)

> Si lo ejecutas desde NetBeans, la clase principal es `evacuacion.Main` (ya está configurada en el proyecto).

## Base de datos (PostgreSQL)

El sistema guarda **el mapa, el estado de la emergencia y los bloqueos** en PostgreSQL. Se activa con una variable de entorno:

```
DATABASE_URL=postgres://usuario:clave@servidor:5432/basededatos
```

- **Sin `DATABASE_URL`** todo queda en memoria (sirve para probar rápido; la emergencia se pierde al reiniciar).
- **Con `DATABASE_URL`** las tablas (`plano`, `nodo`, `arista`, `estado`, `bloqueo`) se crean solas. La primera vez, con la base vacía,
  se carga el mapa del campus; después se lee de la base. La emergencia y los bloqueos sobreviven a un reinicio.
- Si la clave tiene símbolos como `@` o `/`, se escriben codificados (`@` = `%40`). Hostings como Render, Neon o Supabase
  entregan esta dirección ya lista. Si la base la pide, se agrega `?sslmode=require` al final.
- Las sesiones de administrador **no** se guardan en la base (son temporales): tras reiniciar hay que volver a entrar.
- Para las pruebas con base real: `PRUEBAS_DATABASE_URL=postgres://usuario:clave@localhost:5432/base_de_pruebas ./ejecutar.sh`.
  Trabajan en un esquema temporal que se borra al terminar. Sin esa variable se omiten (59 pruebas); con ella corren las 68.
- El driver de PostgreSQL está en `lib/postgresql-42.7.2.jar` (es la única librería externa del proyecto).

## Estudiantes y administradores

| | Estudiante (`/`) | Administrador (`/admin.html`) |
|---|---|---|
| Ver si hay emergencia | Sí, se actualiza solo cada ~2.5 s | Sí |
| Ver su ruta al punto de encuentro | Solo cuando hay emergencia | Siempre (vista previa) |
| Ver los caminos bloqueados | Sí | Sí |
| **Activar / desactivar la emergencia** | **No** | Sí |
| **Bloquear / liberar caminos** | **No** | Sí |
| Simular personas | No | Sí |

La separación **la hace el servidor**, no la página: aunque un estudiante abra la consola del navegador
y mande una petición a `/api/admin/...`, el servidor responde `401` si no trae una sesión de administrador.
El estado (emergencia y bloqueos) vive en el servidor y es el mismo para todos.

### La clave de administrador

El servidor la busca en este orden:

1. Archivo **`admin.properties`** (en la carpeta del proyecto, junto a `web/`): escribe `clave=TuClaveSegura1`.
2. Variable de entorno `ADMIN_CLAVE`.
3. Si no hay ninguna, inventa una **distinta en cada arranque** y la muestra en la consola
   (`Clave de administrador de ESTA ejecución: ...`).

Mínimo 8 caracteres. Es una sola clave compartida por todos los administradores.
Si la pones en `admin.properties`, no subas ese archivo a un repositorio público.

### Qué protege y qué no

- La sesión dura 8 horas y va en una cookie `HttpOnly` (JavaScript no puede leerla).
- 5 claves incorrectas seguidas desde una misma IP bloquean los intentos por 1 minuto.
- Las peticiones de cambio solo se aceptan desde la misma página (revisión de `Origin`) y el servidor
  valida que los puntos y caminos bloqueados existan.
- **Es HTTP simple** (sin cifrado). Sirve para el boceto y una red local, pero en una red real habría que
  ponerlo detrás de HTTPS, porque la clave viajaría sin cifrar.
- El estado no se guarda en disco: si reinicias el servidor, la emergencia queda **desactivada** y sin bloqueos.

## Cómo se usa

**Estudiantes**
1. Entran a la página y eligen su ubicación (o tocan un punto del mapa). Se acuerda en ese navegador.
2. Mientras no haya emergencia ven "No hay ninguna emergencia activa".
3. Cuando un administrador la activa, la pantalla se pone roja y les marca en verde la ruta al punto de
   encuentro más cercano, con distancia, tiempo y pasos. Si hay caminos bloqueados, la ruta los esquiva.

**Administradores**
1. Entran a `/admin.html` con la clave.
2. El botón del encabezado activa o desactiva la emergencia (pide confirmación).
3. En **Bloquear camino** tocan un camino o un punto (escombros, daño, humo): se guarda en el servidor y
   los estudiantes lo ven en pocos segundos. Si no queda ninguna salida, el sistema lo indica.
4. El camino naranja es una **zona de riesgo**: es corto pero "cuesta" más, así que el sistema prefiere un rodeo más seguro.
5. **Punto de partida** sirve para ensayar qué ruta le saldría a un estudiante en cualquier lugar.

## Arquitectura

Está organizado en **4 capas** (paquetes) y aplica **GRASP** y **SOLID (S, O, L)**.
La explicación completa, con la tabla de qué principio está en qué clase, está en [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).

```
src/evacuacion/
  Main.java                  arma todo (único lugar que conoce las clases concretas)
  presentacion/              CAPA DE PRESENTACIÓN
    http/                    controladores (uno por endpoint), ServidorWeb, SesionHttp, Http
    json/                    vistas JSON: MapaJson, PlanJson, EstadoJson
  negocio/                   CAPA DE NEGOCIO
    servicios/               casos de uso: Mapa, Emergencia, Evacuacion, Autenticacion
    ruta/                    AlgoritmoRuta (Dijkstra, BellmanFord), CalculadoraCosto, PlanificadorEvacuacion
    seguridad/               VerificadorClave, LimitadorIntentos, GeneradorToken, ResolutorClave
  datos/                     CAPA DE DATOS
    Repositorio*.java        interfaces (mapa, emergencia, sesiones)
    memoria/                 implementaciones en memoria (aquí se edita el mapa: MapaEnMemoria)
    bd/                      implementaciones en PostgreSQL: MapaEnBD, EmergenciaEnBD, ConexionBD, ConfiguracionBD, CargadorInicial
    clave/                   fuentes de la clave: ClaveDeArchivo, ClaveDeEntorno
  modelo/                    ENTIDADES: Nodo, Arista, Grafo, Restricciones, EstadoEmergencia, PlanEvacuacion...
  pruebas/Pruebas.java       59 pruebas automáticas (68 con PostgreSQL de pruebas)
lib/                         driver JDBC de PostgreSQL (postgresql-42.7.2.jar)
web/                         navegador: index.html (estudiantes), admin.html, app.js, acceso.js, estilos.css
admin.properties             clave de administrador
docs/ARQUITECTURA.md         capas, GRASP y SOLID explicados
```

## Cambiar el mapa por el real

El plano original está en `src/evacuacion/datos/memoria/MapaEnMemoria.java` (con `DATABASE_URL` se copia a la base la primera vez; después hay que cambiarlo en las tablas `nodo` y `arista`): cada `agregarNodo(...)` es un punto
(id, nombre, x, y, tipo) y cada `conectar(a, b)` es un camino. Los metros se calculan solos con la distancia en el dibujo
(`METROS_POR_PIXEL` en `modelo/Grafo.java`). Los rectángulos de edificios del dibujo están en `web/app.js` (`EDIFICIOS`).

## Cómo agregar cosas (sin modificar lo que ya funciona)

- **Otro algoritmo de rutas:** una clase que implemente `AlgoritmoRuta` y se cambia una línea en `Main`.
- **Otro criterio de costo:** una clase que implemente `CalculadoraCosto`.
- **Otro endpoint:** una clase que implemente `Controlador` y se agrega a la lista de `Main`.

## Limitaciones del boceto

- Una sola clave compartida para todos los administradores (no hay usuarios individuales).
- Supone **un solo servidor** escribiendo en la base (la emergencia se guarda también en memoria para responder rápido).
- Sin `DATABASE_URL` el estado se pierde al reiniciar.
- Los bloqueos los marca una persona; no hay sensores ni reportes en vivo.
- El tiempo usa una velocidad fija de 1.5 m/s y no considera aglomeración.

## Ponerlo en internet (hosting)

Para que los estudiantes entren desde cualquier red, el proyecto incluye un `Dockerfile`
(sirve en Render, Railway, Fly.io, etc.):

1. Sube la carpeta a un repositorio de GitHub (`.gitignore` ya excluye `out/`, `build/`, `dist/`).
2. En el hosting crea un servicio web desde ese repositorio (tipo **Docker**).
3. Crea una base PostgreSQL en el mismo hosting (o en Neon o Supabase) y, en las variables de entorno del servicio, agrega:
   `DATABASE_URL` (la dirección que te da la base) y `ADMIN_CLAVE` con una clave **larga y propia**
   (así la clave no queda escrita en GitHub). El hosting define `PORT` solo.
4. Cuando termine de desplegar te da un link `https://...`: ese es el de los estudiantes;
   el de admin es el mismo con `/admin.html`.

Con `TRUST_PROXY=1` (ya viene en el Dockerfile) el límite de intentos cuenta por IP real de cada visitante
y la cookie de sesión se marca `Secure`. Los planes gratuitos suelen "dormir" el servicio tras un rato sin visitas
y, sin base de datos, al despertar se pierde el estado. Con PostgreSQL el estado se conserva; igual abre el link antes de la exposición, porque el servicio tarda en despertar.
