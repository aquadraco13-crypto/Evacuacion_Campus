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
javac -encoding UTF-8 -d out src/*.java
java -cp out Pruebas
java -cp out Servidor 8080 web
```

Luego abre en el navegador (para otro puerto: `./ejecutar.sh 9090`):

- **Estudiantes:** http://localhost:8080  (solo ven; no pueden cambiar nada)
- **Administradores:** http://localhost:8080/admin.html  (piden clave)

> Si lo ejecutas desde NetBeans, la clase principal es `Servidor` (ya está configurada en el proyecto).

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

## Estructura

```
src/
  Nodo.java        punto del campus (salón, pasillo, puerta, punto de encuentro)
  Arista.java      camino entre dos nodos: metros y factor de riesgo
  Grafo.java       grafo no dirigido con listas de adyacencia
  Dijkstra.java    algoritmo (cola de prioridad), admite bloqueos
  Evacuacion.java  elige el mejor punto de encuentro entre todos
  Campus.java      DATOS del plano (aquí se edita el mapa)
  Servidor.java    servidor web y API (campus, estado, ruta, login y acciones de admin)
  Estado.java      emergencia y bloqueos guardados en el servidor (compartidos por todos)
  Sesiones.java    clave de admin, sesiones de 8 h y límite de intentos
  Json.java        utilidad para escribir JSON
  Pruebas.java     29 pruebas automáticas (algoritmo, estado y sesiones)
web/
  index.html       página de estudiantes (solo lectura)
  admin.html       entrada y panel de administradores
  app.js           mapa y lógica (la misma para las dos páginas)
  acceso.js        login / cerrar sesión (solo admin.html)
  estilos.css
admin.properties   clave de administrador
```

## Cambiar el mapa por el real

Todo el plano está en `src/Campus.java`: cada `agregarNodo(...)` es un punto (id, nombre, x, y, tipo)
y cada `conectar(a, b)` es un camino. Los metros se calculan solos con la distancia en el dibujo
(`METROS_POR_PIXEL` en `Grafo.java`). Los rectángulos de edificios del dibujo están en `web/app.js` (`EDIFICIOS`).

## Limitaciones del boceto

- Una sola clave compartida para todos los administradores (no hay usuarios individuales).
- Sin HTTPS y sin base de datos: el estado se pierde al reiniciar.
- Los bloqueos los marca una persona; no hay sensores ni reportes en vivo.
- El tiempo usa una velocidad fija de 1.5 m/s y no considera aglomeración.
