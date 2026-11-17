package evacuacion.pruebas;

import evacuacion.datos.RepositorioMapa;
import evacuacion.datos.clave.ProveedorClave;
import evacuacion.datos.bd.CargadorInicial;
import evacuacion.datos.bd.ConexionBD;
import evacuacion.datos.bd.ConfiguracionBD;
import evacuacion.datos.bd.EmergenciaEnBD;
import evacuacion.datos.bd.MapaEnBD;
import evacuacion.datos.memoria.EmergenciaEnMemoria;
import evacuacion.datos.memoria.MapaEnMemoria;
import evacuacion.datos.memoria.SesionesEnMemoria;
import evacuacion.modelo.Arista;
import evacuacion.modelo.EstadoEmergencia;
import evacuacion.modelo.Grafo;
import evacuacion.modelo.MapaCampus;
import evacuacion.modelo.Nodo;
import evacuacion.modelo.PlanEvacuacion;
import evacuacion.modelo.Restricciones;
import evacuacion.modelo.ResultadoRuta;
import evacuacion.negocio.DatoInvalidoException;
import evacuacion.negocio.ruta.AlgoritmoRuta;
import evacuacion.negocio.ruta.BellmanFord;
import evacuacion.negocio.ruta.CalculadoraCosto;
import evacuacion.negocio.ruta.CostoPorDistancia;
import evacuacion.negocio.ruta.CostoPorRiesgo;
import evacuacion.negocio.ruta.Dijkstra;
import evacuacion.negocio.ruta.PlanificadorEvacuacion;
import evacuacion.negocio.seguridad.GeneradorToken;
import evacuacion.negocio.seguridad.LimitadorIntentos;
import evacuacion.negocio.seguridad.ResolutorClave;
import evacuacion.negocio.seguridad.VerificadorClave;
import evacuacion.negocio.servicios.AutenticacionServicio;
import evacuacion.negocio.servicios.EmergenciaServicio;
import evacuacion.negocio.servicios.EvacuacionServicio;
import evacuacion.presentacion.json.Json;
import evacuacion.presentacion.json.PlanJson;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

/** Pruebas automáticas (sin librerías). Se ejecutan con ejecutar.bat / ejecutar.sh o desde NetBeans. */
public class Pruebas {

    static int total = 0;
    static int fallos = 0;

    static void verificar(boolean condicion, String descripcion) {
        total++;
        if (condicion) {
            System.out.println("  ok     " + descripcion);
        } else {
            fallos++;
            System.out.println("  FALLO  " + descripcion);
        }
    }

    public static void main(String[] args) throws IOException {
        Grafo g = new MapaEnMemoria().obtener().grafo();
        Restricciones nada = Restricciones.ninguna();
        PlanificadorEvacuacion plan = new PlanificadorEvacuacion(new Dijkstra(), new CostoPorRiesgo());

        System.out.println("1) Ruta normal desde Bloque A");
        PlanEvacuacion p1 = plan.planificar(g, "A1", nada);
        verificar(p1.ok(), "Desde Salón A-101 hay ruta a un punto de encuentro");
        verificar(p1.ok() && p1.mejor() != null, "Se elige un PE válido");
        if (p1.ok()) {
            System.out.println("     -> PE elegido: " + p1.mejor().nombre()
                    + " (" + Json.num(p1.mejor().distanciaM()) + " m)");
        }

        System.out.println("2) Bloqueo de puerta A: se recalcula");
        PlanEvacuacion p2 = plan.planificar(g, "A1", new Restricciones(Set.of("SA"), Set.of()));
        verificar(p2.ok(), "Con la puerta A bloqueada aún hay ruta alternativa");
        verificar(p2.ok() && !p2.mejor().camino().contains("SA"), "La nueva ruta no pasa por la puerta bloqueada");

        System.out.println("3) Camino bloqueado (arista)");
        PlanEvacuacion p3 = plan.planificar(g, "A1", new Restricciones(Set.of(), Set.of(Arista.clave("PA", "SA"))));
        verificar(p3.ok(), "Bloqueando el pasillo A -> Puerta A, aún hay ruta");

        System.out.println("4) Sin salida");
        PlanEvacuacion p4 = plan.planificar(g, "PE_NORTE", new Restricciones(Set.of("FUENTE"), Set.of()));
        verificar(p4.ok() && p4.mejor().id().equals("PE_NORTE"), "Un PE aislado sigue siendo su propio destino");
        PlanEvacuacion aislado = plan.planificar(g, "COM", new Restricciones(Set.of("SCOM"), Set.of()));
        verificar(!aislado.ok() && aislado.mensaje().contains("brigada"),
                "Sin ruta posible, el mensaje manda esperar a la brigada");

        System.out.println("5) Desde el centro hacia PE");
        PlanEvacuacion p5 = plan.planificar(g, "PLAZA", nada);
        verificar(p5.ok(), "Desde la plaza hay ruta a un PE");

        System.out.println("6) Casos límite");
        PlanEvacuacion p6 = plan.planificar(g, "PE_NORTE", nada);
        verificar(p6.ok() && p6.mejor().id().equals("PE_NORTE") && p6.mejor().distanciaM() == 0,
                "Si ya estás en un PE, la distancia es 0");
        verificar(!plan.planificar(g, "A1", new Restricciones(Set.of("A1"), Set.of())).ok(), "Origen bloqueado -> sin ruta");
        verificar(!plan.planificar(g, "NOEXISTE", nada).ok(), "Origen desconocido -> sin ruta");
        verificar(!plan.planificar(g, null, nada).ok(), "Sin origen -> sin ruta");

        System.out.println("7) Dijkstra contra Floyd-Warshall (todos los pares)");
        verificar(coincideConFloydWarshall(g), "Los costos mínimos de Dijkstra coinciden con Floyd-Warshall");

        System.out.println("8) SOLID L: cualquier AlgoritmoRuta cumple el mismo contrato (se pueden intercambiar)");
        List<AlgoritmoRuta> algoritmos = List.of(new Dijkstra(), new BellmanFord());
        List<CalculadoraCosto> costos = List.of(new CostoPorRiesgo(), new CostoPorDistancia());
        Restricciones algunas = new Restricciones(Set.of("SA", "SD"), Set.of(Arista.clave("CENTRO", "SADM")));
        boolean mismosCostos = true;
        boolean origenOk = true;
        boolean sinPasarPorBloqueos = true;
        for (CalculadoraCosto c : costos) {
            for (Restricciones r : List.of(nada, algunas)) {
                ResultadoRuta a = algoritmos.get(0).calcular(g, "A1", r, c);
                ResultadoRuta b = algoritmos.get(1).calcular(g, "A1", r, c);
                for (Nodo n : g.nodos()) {
                    if (Math.abs(a.costoHasta(n.id) - b.costoHasta(n.id)) > 1e-9
                            && !(Double.isInfinite(a.costoHasta(n.id)) && Double.isInfinite(b.costoHasta(n.id)))) {
                        mismosCostos = false;
                    }
                    for (ResultadoRuta rr : List.of(a, b)) {
                        if (rr.alcanzable(n.id) && r.bloqueaNodo(n.id)) sinPasarPorBloqueos = false;
                        List<String> camino = rr.camino(n.id);
                        for (int i = 0; i + 1 < camino.size(); i++) {
                            Arista ar = g.buscar(camino.get(i), camino.get(i + 1));
                            if (ar == null || r.bloqueaArista(ar)) sinPasarPorBloqueos = false;
                        }
                    }
                }
            }
        }
        for (AlgoritmoRuta alg : algoritmos) {
            for (CalculadoraCosto c : costos) {
                ResultadoRuta r0 = alg.calcular(g, "A1", nada, c);
                if (r0.costoHasta("A1") != 0) origenOk = false;
                if (alg.calcular(g, "NOEXISTE", nada, c).alcanzable("A1")) origenOk = false;
                if (alg.calcular(g, "A1", new Restricciones(Set.of("A1"), Set.of()), c).alcanzable("A1")) origenOk = false;
            }
        }
        verificar(mismosCostos, "Dijkstra y Bellman-Ford dan el mismo costo mínimo a todos los puntos (con y sin bloqueos)");
        verificar(sinPasarPorBloqueos, "Ninguno pasa por puntos ni caminos bloqueados");
        verificar(origenOk, "Ambos manejan origen desconocido o bloqueado sin lanzar excepción");
        boolean costosValidos = true;
        for (CalculadoraCosto c : costos) {
            for (Arista ar : g.aristas()) {
                double v = c.costo(ar);
                if (Double.isNaN(v) || Double.isInfinite(v) || v < 0) costosValidos = false;
            }
        }
        verificar(costosValidos, "Toda CalculadoraCosto devuelve valores finitos y no negativos");

        System.out.println("9) SOLID O: se cambia el comportamiento sin modificar las clases existentes");
        PlanificadorEvacuacion conBellman = new PlanificadorEvacuacion(new BellmanFord(), new CostoPorRiesgo());
        PlanEvacuacion pb = conBellman.planificar(g, "A1", nada);
        verificar(pb.ok() && Math.abs(pb.mejor().costo() - p1.mejor().costo()) < 1e-9,
                "El planificador funciona igual con otro algoritmo (Bellman-Ford)");
        CalculadoraCosto triple = a -> a.metros * 3;   // un criterio nuevo, escrito aquí mismo
        PlanEvacuacion pt = new PlanificadorEvacuacion(new Dijkstra(), triple).planificar(g, "A1", nada);
        verificar(pt.ok(), "Un criterio de costo nuevo funciona sin tocar el algoritmo");
        double soloMetros = new PlanificadorEvacuacion(new Dijkstra(), new CostoPorDistancia())
                .planificar(g, "A1", nada).mejor().costo();
        verificar(Math.abs(pt.mejor().costo() - 3 * soloMetros) < 1e-6,
                "El costo nuevo se refleja en el resultado (3 x metros)");

        System.out.println("10) Estado de la emergencia (servicio con repositorio en memoria)");
        RepositorioMapa mapa = new MapaEnMemoria();
        EmergenciaServicio emerg = new EmergenciaServicio(new EmergenciaEnMemoria(), mapa);
        verificar(!emerg.consultar().activa(), "Al iniciar no hay emergencia");
        long v0 = emerg.consultar().version();
        verificar(emerg.fijarEmergencia(true).version() == v0 + 1, "Activar sube la versión");
        verificar(emerg.fijarEmergencia(true).version() == v0 + 1, "Repetir el mismo valor no cambia la versión");
        emerg.fijarBloqueos(Set.of("PA"), Set.of(Arista.clave("E", "PB")));
        verificar(emerg.consultar().restricciones().bloqueaNodo("PA"), "Los bloqueos válidos se guardan");
        long v1 = emerg.consultar().version();
        boolean r1 = false, r2 = false;
        try { emerg.fijarBloqueos(Set.of("NOEXISTE"), Set.of()); } catch (DatoInvalidoException e) { r1 = true; }
        try { emerg.fijarBloqueos(Set.of(), Set.of("X|Y")); } catch (DatoInvalidoException e) { r2 = true; }
        verificar(r1 && r2, "Un punto o camino desconocido se rechaza");
        verificar(emerg.consultar().version() == v1 && emerg.consultar().restricciones().bloqueaNodo("PA"),
                "Un bloqueo rechazado no cambia nada");

        System.out.println("11) Regla: los estudiantes solo ven rutas durante la emergencia");
        var emergenciaRepo = new EmergenciaEnMemoria();
        EmergenciaServicio e3 = new EmergenciaServicio(emergenciaRepo, mapa);
        EvacuacionServicio evac = new EvacuacionServicio(mapa, emergenciaRepo, plan);
        verificar(evac.consultar("A1", false).sinEmergencia(), "Sin emergencia, el estudiante no recibe ruta");
        verificar(!evac.consultar("A1", true).sinEmergencia() && evac.consultar("A1", true).plan().ok(),
                "Sin emergencia, el administrador sí puede ensayar rutas");
        e3.fijarEmergencia(true);
        verificar(evac.consultar("A1", false).plan().ok(), "Con emergencia, el estudiante recibe su ruta");
        e3.fijarBloqueos(Set.of("SA"), Set.of());
        verificar(!evac.consultar("A1", false).plan().mejor().camino().contains("SA"),
                "La ruta respeta los bloqueos guardados en el servidor");

        System.out.println("12) GRASP Bajo acoplamiento: el negocio funciona con un mapa falso (sin el campus real)");
        RepositorioMapa mapaFalso = () -> new MapaCampus(mapaMinimo(), 100, 100);
        PlanEvacuacion pm = new PlanificadorEvacuacion(new Dijkstra(), new CostoPorRiesgo())
                .planificar(mapaFalso.obtener().grafo(), "A", nada);
        verificar(pm.ok() && pm.mejor().id().equals("PE1") && Math.abs(pm.mejor().distanciaM() - 10.0) < 1e-6,
                "Con un mapa mínimo elige el PE más cercano (PE1 a 10 m, no PE2 a 100 m)");

        System.out.println("13) Sesiones de administrador");
        long[] reloj = {0};
        AutenticacionServicio auth = nuevaAutenticacion("clave-segura-123", reloj);
        verificar(auth.iniciarSesion("mala", "1.1.1.1").resultado() == AutenticacionServicio.Resultado.INCORRECTA,
                "Clave incorrecta se rechaza");
        verificar(!auth.esAdmin(null) && !auth.esAdmin("inventado"), "Tokens inventados no valen");
        var ok = auth.iniciarSesion("clave-segura-123", "1.1.1.1");
        verificar(ok.resultado() == AutenticacionServicio.Resultado.OK && auth.esAdmin(ok.token()),
                "Clave correcta da sesión válida");
        verificar(ok.token().length() == 64, "El token tiene 32 bytes (64 hex)");
        reloj[0] = AutenticacionServicio.DURACION_MS - 1;
        verificar(auth.esAdmin(ok.token()), "La sesión sigue válida antes de 8 horas");
        reloj[0] = AutenticacionServicio.DURACION_MS;
        verificar(!auth.esAdmin(ok.token()), "La sesión expira a las 8 horas");
        var otro = auth.iniciarSesion("clave-segura-123", "1.1.1.1");
        auth.cerrarSesion(otro.token());
        verificar(!auth.esAdmin(otro.token()), "Cerrar sesión invalida el token");

        long[] reloj2 = {0};
        AutenticacionServicio lim = nuevaAutenticacion("clave-segura-123", reloj2);
        for (int i = 0; i < 5; i++) lim.iniciarSesion("x", "9.9.9.9");
        verificar(lim.iniciarSesion("clave-segura-123", "9.9.9.9").resultado() == AutenticacionServicio.Resultado.BLOQUEADA,
                "Tras 5 fallos la IP queda bloqueada (aunque acierte)");
        verificar(lim.iniciarSesion("clave-segura-123", "8.8.8.8").resultado() == AutenticacionServicio.Resultado.OK,
                "Otra IP no se ve afectada");
        reloj2[0] += 60_000;
        verificar(lim.iniciarSesion("clave-segura-123", "9.9.9.9").resultado() == AutenticacionServicio.Resultado.OK,
                "El bloqueo termina al pasar el minuto");

        System.out.println("14) Clave de administrador: fuentes intercambiables");
        ProveedorClave corta = fuente("corta", "abc");
        ProveedorClave buena = fuente("buena", "una-clave-larga-1");
        ProveedorClave vacia = fuente("vacia", null);
        var r = new ResolutorClave(List.of(vacia, buena)).resolver();
        verificar(r.clave().equals("una-clave-larga-1"), "Usa la primera fuente que tenga clave");
        verificar(r.mensajes().stream().noneMatch(m -> m.contains("una-clave-larga-1")), "Nunca muestra la clave configurada");
        var r2b = new ResolutorClave(List.of(corta, buena)).resolver();
        verificar(r2b.clave().equals("una-clave-larga-1") && r2b.mensajes().stream().anyMatch(m -> m.contains("ATENCION")),
                "Una clave corta se ignora con aviso y se pasa a la siguiente fuente");
        var r3 = new ResolutorClave(List.of(vacia)).resolver();
        verificar(r3.clave().length() == 12, "Sin ninguna fuente, genera una clave al azar de 12 caracteres");

        System.out.println("15) Vista JSON separada del modelo");
        String json = PlanJson.de(p1);
        verificar(json.contains("\"ok\":true") && json.contains("\"tiempoS\":") && json.contains("\"camino\":["),
                "PlanJson arma la respuesta que usa la web");
        verificar(PlanJson.sinEmergencia().contains("\"inactiva\":true"), "Hay respuesta propia para 'sin emergencia'");

        System.out.println("16) Arquitectura en capas: ninguna capa depende de una que no le corresponde");
        revisarCapas();

        System.out.println("17) Base de datos PostgreSQL (dirección de conexión y repositorios)");
        configuracionBD();
        repositoriosBD();

        System.out.println();
        System.out.println((total - fallos) + " de " + total + " pruebas correctas");
        if (fallos > 0) System.exit(1);
    }

    // ---------------------------------------------------------------- base de datos

    static void configuracionBD() {
        ConfiguracionBD c = ConfiguracionBD.desde("postgres://ana:p%40ss%2Fw@db.ejemplo.com:5433/campus?sslmode=require", null, null);
        verificar(c.jdbcUrl().equals("jdbc:postgresql://db.ejemplo.com:5433/campus?sslmode=require"),
                "DATABASE_URL se convierte a dirección JDBC (conserva sslmode)");
        verificar("ana".equals(c.usuario()) && "p@ss/w".equals(c.clave()),
                "Usuario y clave se leen de la dirección y se decodifican");
        verificar(ConfiguracionBD.desde("postgresql://u:p@host/base", null, null).jdbcUrl()
                .equals("jdbc:postgresql://host:5432/base"), "Sin puerto se usa el 5432");
        verificar(!c.toString().contains("p@ss") && !c.descripcion().contains("ana"),
                "Ni toString ni descripcion muestran la clave");
        ConfiguracionBD j = ConfiguracionBD.desde("jdbc:postgresql://h/b", "u", "k");
        verificar(j.usuario().equals("u") && j.clave().equals("k"), "Forma JDBC con DB_USUARIO y DB_CLAVE");
        verificar(ConfiguracionBD.desdeEntorno(k -> null).isEmpty()
                && ConfiguracionBD.desdeEntorno(k -> "  ").isEmpty(), "Sin DATABASE_URL no hay base de datos");
        boolean rechazo = false;
        try {
            ConfiguracionBD.desde("mysql://u:clave-secreta@h/b", null, null);
        } catch (IllegalArgumentException e) {
            rechazo = !e.getMessage().contains("clave-secreta");
        }
        verificar(rechazo, "Una dirección que no es de PostgreSQL se rechaza sin mostrar la clave");
        boolean sinBase = false;
        try {
            ConfiguracionBD.desde("postgres://u:p@h", null, null);
        } catch (IllegalArgumentException e) {
            sinBase = true;
        }
        verificar(sinBase, "Una dirección sin nombre de base se rechaza");
    }

    /** Necesita un PostgreSQL de pruebas: variable PRUEBAS_DATABASE_URL. Trabaja en un esquema temporal. */
    static void repositoriosBD() {
        String url = System.getenv("PRUEBAS_DATABASE_URL");
        if (url == null || url.isBlank()) {
            System.out.println("  (se omiten las pruebas con base real: define PRUEBAS_DATABASE_URL, p. ej.");
            System.out.println("   postgres://usuario:clave@localhost:5432/base_de_pruebas)");
            return;
        }
        ConfiguracionBD base = ConfiguracionBD.desde(url.trim(), null, null);
        String esquema = "pruebas_" + Long.toHexString(System.nanoTime());
        ConexionBD admin = new ConexionBD(base);
        try {
            ejecutarSql(admin, "CREATE SCHEMA " + esquema);
            ConexionBD bd = new ConexionBD(base.conEsquema(esquema));

            bd.crearTablas();
            bd.crearTablas();
            verificar(true, "Crear las tablas dos veces no falla");

            RepositorioMapa semilla = new MapaEnMemoria();
            verificar(CargadorInicial.cargarSiVacia(bd, semilla), "La primera vez se carga el mapa a la base");
            verificar(!CargadorInicial.cargarSiVacia(bd, semilla), "La segunda vez no vuelve a cargar");

            MapaCampus enBD = new MapaEnBD(bd).obtener();
            MapaCampus enMem = semilla.obtener();
            verificar(enBD.ancho() == enMem.ancho() && enBD.alto() == enMem.alto(), "El tamaño del plano se conserva");
            verificar(mismoGrafo(enBD.grafo(), enMem.grafo()),
                    "El mapa leído de la base es igual al original (puntos, caminos, metros, riesgo y orden)");

            PlanificadorEvacuacion plan = new PlanificadorEvacuacion(new Dijkstra(), new CostoPorRiesgo());
            PlanEvacuacion a = plan.planificar(enBD.grafo(), "A1", Restricciones.ninguna());
            PlanEvacuacion b = plan.planificar(enMem.grafo(), "A1", Restricciones.ninguna());
            verificar(a.ok() && b.ok() && a.mejor().id().equals(b.mejor().id())
                    && a.mejor().camino().equals(b.mejor().camino()),
                    "Con el mapa de la base se obtiene la misma ruta (sustitución de Liskov)");

            EmergenciaEnBD emergencia = new EmergenciaEnBD(bd);
            verificar(!emergencia.obtener().activa() && emergencia.obtener().version() == 0,
                    "Sin datos guardados, la emergencia empieza apagada");
            EmergenciaServicio servicio = new EmergenciaServicio(emergencia, new RepositorioMapa() {
                @Override public MapaCampus obtener() { return enBD; }
            });
            servicio.fijarEmergencia(true);
            servicio.fijarBloqueos(Set.of("PA"), Set.of(Arista.clave("E", "PB")));
            EstadoEmergencia antes = emergencia.obtener();

            EmergenciaEnBD reiniciada = new EmergenciaEnBD(bd);
            EstadoEmergencia despues = reiniciada.obtener();
            verificar(despues.activa() && despues.version() == antes.version()
                    && despues.restricciones().bloqueaNodo("PA")
                    && despues.restricciones().aristas().contains(Arista.clave("E", "PB")),
                    "Tras reiniciar (nuevo repositorio) la emergencia y los bloqueos siguen ahí");
            servicio.fijarBloqueos(Set.of(), Set.of());
            verificar(new EmergenciaEnBD(bd).obtener().restricciones().nodos().isEmpty(),
                    "Quitar los bloqueos también se guarda");
        } catch (RuntimeException e) {
            verificar(false, "Las pruebas con la base fallaron: " + e);
        } finally {
            try {
                ejecutarSql(admin, "DROP SCHEMA IF EXISTS " + esquema + " CASCADE");
            } catch (RuntimeException e) {
                System.out.println("  (no se pudo borrar el esquema temporal " + esquema + ")");
            }
        }
    }

    static void ejecutarSql(ConexionBD bd, String sql) {
        try (Connection c = bd.abrir(); Statement st = c.createStatement()) {
            st.execute(sql);
        } catch (java.sql.SQLException e) {
            throw new IllegalStateException(e.getMessage(), e);
        }
    }

    static boolean mismoGrafo(Grafo x, Grafo y) {
        List<Nodo> nx = new ArrayList<>(x.nodos());
        List<Nodo> ny = new ArrayList<>(y.nodos());
        if (nx.size() != ny.size() || x.aristas().size() != y.aristas().size()) return false;
        for (int i = 0; i < nx.size(); i++) {
            Nodo p = nx.get(i);
            Nodo q = ny.get(i);
            if (!p.id.equals(q.id) || !p.nombre.equals(q.nombre) || p.x != q.x || p.y != q.y || p.tipo != q.tipo) return false;
        }
        for (int i = 0; i < x.aristas().size(); i++) {
            Arista p = x.aristas().get(i);
            Arista q = y.aristas().get(i);
            if (!p.a.equals(q.a) || !p.b.equals(q.b) || p.metros != q.metros || p.riesgo != q.riesgo) return false;
        }
        return true;
    }

    // ---------------------------------------------------------------- ayudas

    static Grafo mapaMinimo() {
        Grafo g = new Grafo();
        g.agregarNodo(new Nodo("A", "Salón A", 0, 0, Nodo.Tipo.SALON));
        g.agregarNodo(new Nodo("B", "Pasillo", 20, 0, Nodo.Tipo.PASILLO));
        g.agregarNodo(new Nodo("PE1", "Punto 1", 20, 20, Nodo.Tipo.PUNTO_ENCUENTRO));
        g.agregarNodo(new Nodo("PE2", "Punto 2", 400, 0, Nodo.Tipo.PUNTO_ENCUENTRO));
        g.conectar("A", "B");      // 20 px = 5 m
        g.conectar("B", "PE1");
        g.conectar("A", "PE2");
        // A -> B -> PE1 = 5 + 5 = 10 m, mientras que A -> PE2 = 100 m
        return g;
    }

    static AutenticacionServicio nuevaAutenticacion(String clave, long[] reloj) {
        return new AutenticacionServicio(new VerificadorClave(clave), new SesionesEnMemoria(),
                new LimitadorIntentos(() -> reloj[0], 5, 60_000), new GeneradorToken(), () -> reloj[0]);
    }

    static ProveedorClave fuente(String nombre, String valor) {
        return new ProveedorClave() {
            @Override public Optional<String> obtener() { return Optional.ofNullable(valor); }
            @Override public String origen() { return nombre; }
        };
    }

    static boolean coincideConFloydWarshall(Grafo g) {
        CalculadoraCosto costo = new CostoPorRiesgo();
        List<Nodo> ns = new ArrayList<>(g.nodos());
        int n = ns.size();
        double[][] d = new double[n][n];
        for (double[] fila : d) Arrays.fill(fila, Double.POSITIVE_INFINITY);
        for (int i = 0; i < n; i++) d[i][i] = 0;

        for (Arista ar : g.aristas()) {
            int i = indice(ns, ar.a);
            int j = indice(ns, ar.b);
            d[i][j] = Math.min(d[i][j], costo.costo(ar));
            d[j][i] = Math.min(d[j][i], costo.costo(ar));
        }
        for (int k = 0; k < n; k++)
            for (int i = 0; i < n; i++)
                for (int j = 0; j < n; j++)
                    if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];

        for (int i = 0; i < n; i++) {
            ResultadoRuta r = new Dijkstra().calcular(g, ns.get(i).id, Restricciones.ninguna(), costo);
            for (int j = 0; j < n; j++) {
                double obtenido = r.costoHasta(ns.get(j).id);
                boolean igual = (Double.isInfinite(obtenido) && Double.isInfinite(d[i][j]))
                        || Math.abs(obtenido - d[i][j]) < 1e-9;
                if (!igual) return false;
            }
        }
        return true;
    }

    static int indice(List<Nodo> ns, String id) {
        for (int i = 0; i < ns.size(); i++) {
            if (ns.get(i).id.equals(id)) return i;
        }
        throw new IllegalStateException("Nodo inexistente: " + id);
    }

    /**
     * Lee los archivos .java y comprueba que cada capa solo importa lo permitido:
     * modelo no importa nada de las otras; datos solo usa modelo; negocio usa modelo y datos;
     * presentacion usa negocio y modelo (no accede directo a datos).
     */
    static void revisarCapas() throws IOException {
        Path raiz = Paths.get("src", "evacuacion");
        if (!Files.isDirectory(raiz)) {
            System.out.println("  (se omite: ejecuta las pruebas desde la carpeta del proyecto)");
            return;
        }
        String[][] prohibido = {
            {"modelo", "datos", "negocio", "presentacion"},
            {"datos", "negocio", "presentacion"},
            {"negocio", "presentacion"},
            {"presentacion", "datos"},
        };
        for (String[] regla : prohibido) {
            String capa = regla[0];
            boolean limpia = true;
            Path dir = raiz.resolve(capa);
            try (Stream<Path> archivos = Files.walk(dir)) {
                for (Path f : (Iterable<Path>) archivos.filter(p -> p.toString().endsWith(".java"))::iterator) {
                    String texto = Files.readString(f);
                    for (int i = 1; i < regla.length; i++) {
                        if (texto.contains("import evacuacion." + regla[i] + ".")) {
                            limpia = false;
                            System.out.println("     " + f + " importa " + regla[i]);
                        }
                    }
                }
            }
            String prohibe = String.join(", ", Arrays.copyOfRange(regla, 1, regla.length));
            verificar(limpia, "La capa " + capa + " no depende de: " + prohibe);
        }
    }
}
