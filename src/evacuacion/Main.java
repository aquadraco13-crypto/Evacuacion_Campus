package evacuacion;

import evacuacion.datos.RepositorioEmergencia;
import evacuacion.datos.RepositorioMapa;
import evacuacion.datos.RepositorioSesiones;
import evacuacion.datos.bd.CargadorInicial;
import evacuacion.datos.bd.ConexionBD;
import evacuacion.datos.bd.ConfiguracionBD;
import evacuacion.datos.bd.EmergenciaEnBD;
import evacuacion.datos.bd.MapaEnBD;
import evacuacion.datos.clave.ClaveDeArchivo;
import evacuacion.datos.clave.ClaveDeEntorno;
import evacuacion.datos.memoria.EmergenciaEnMemoria;
import evacuacion.datos.memoria.MapaEnMemoria;
import evacuacion.datos.memoria.SesionesEnMemoria;
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
import evacuacion.negocio.servicios.MapaServicio;
import evacuacion.presentacion.http.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

/**
 * Punto de arranque. Aquí (y solo aquí) se eligen las clases concretas y se conectan entre sí:
 * GRASP Creador + SOLID O. Para cambiar de algoritmo, de criterio de costo o de almacenamiento
 * se cambia UNA línea de este archivo y nada más.
 *
 * Uso: Main [puerto] [carpeta-web]   (el puerto también puede venir de la variable PORT)
 */
public class Main {

    public static void main(String[] args) throws IOException {
        String env = System.getenv("PORT");
        int puerto = args.length > 0 ? Integer.parseInt(args[0])
                : env != null && !env.isBlank() ? Integer.parseInt(env.trim()) : 8080;
        Path web = ArchivosControlador.resolverWeb(args.length > 1 ? args[1] : null);
        if (!Files.isRegularFile(web.resolve("index.html"))) {
            System.out.println("ATENCION: no se encontro index.html en " + web);
            System.out.println("Pasa la ruta de la carpeta web como segundo argumento.");
        }

        // ---- Capa de datos ----
        // Con DATABASE_URL se usa PostgreSQL; sin ella, memoria. Es la única decisión de almacenamiento.
        RepositorioMapa mapa;
        RepositorioEmergencia emergencia;
        var configBD = configuracionBD();
        if (configBD != null) {
            try {
                var bd = new ConexionBD(configBD);
                bd.crearTablas();
                if (CargadorInicial.cargarSiVacia(bd, new MapaEnMemoria())) {
                    System.out.println("Base de datos vacía: se cargó el mapa del campus.");
                }
                mapa = new MapaEnBD(bd);
                emergencia = new EmergenciaEnBD(bd);
                System.out.println("Base de datos PostgreSQL: " + configBD.descripcion());
            } catch (RuntimeException e) {
                System.out.println("ERROR con la base de datos (" + configBD.descripcion() + "): " + e.getMessage());
                System.out.println("Revisa DATABASE_URL. Para usar memoria, quita esa variable.");
                System.exit(1);
                return;
            }
        } else {
            mapa = new MapaEnMemoria();
            emergencia = new EmergenciaEnMemoria();
            System.out.println("Sin DATABASE_URL: datos en memoria (la emergencia se pierde al reiniciar).");
        }
        RepositorioSesiones sesiones = new SesionesEnMemoria();

        // ---- Clave de administrador ----
        Path raiz = web.getParent();
        var clave = new ResolutorClave(List.of(
                new ClaveDeArchivo(raiz == null ? null : raiz.resolve("admin.properties")),
                new ClaveDeEntorno("ADMIN_CLAVE"))).resolver();
        clave.mensajes().forEach(System.out::println);

        // ---- Capa de negocio ----
        var planificador = new PlanificadorEvacuacion(new Dijkstra(), new CostoPorRiesgo());
        var mapaServicio = new MapaServicio(mapa);
        var emergenciaServicio = new EmergenciaServicio(emergencia, mapa);
        var evacuacionServicio = new EvacuacionServicio(mapa, emergencia, planificador);
        var autenticacion = new AutenticacionServicio(
                new VerificadorClave(clave.clave()), sesiones,
                new LimitadorIntentos(System::currentTimeMillis, 5, 60_000),
                new GeneradorToken(), System::currentTimeMillis);

        // ---- Capa de presentación ----
        var sesion = new SesionHttp(autenticacion);
        new ServidorWeb(puerto, List.of(
                new MapaControlador(mapaServicio),
                new EstadoControlador(emergenciaServicio, sesion),
                new RutaControlador(evacuacionServicio, sesion),
                new LoginControlador(autenticacion, sesion),
                new LogoutControlador(sesion),
                new EmergenciaAdminControlador(emergenciaServicio, sesion),
                new BloqueosAdminControlador(emergenciaServicio, sesion),
                new ArchivosControlador(web))).iniciar();

        System.out.println("Sistema de evacuación listo en http://localhost:" + puerto);
        System.out.println("Carpeta web: " + web);
        System.out.println("Estudiantes:     http://localhost:" + puerto + "/");
        System.out.println("Administradores: http://localhost:" + puerto + "/admin.html");
    }

    /** @return la configuración de PostgreSQL, o null si no se pidió base de datos. */
    private static ConfiguracionBD configuracionBD() {
        try {
            return ConfiguracionBD.desdeEntorno(System::getenv).orElse(null);
        } catch (IllegalArgumentException e) {
            System.out.println("ERROR: " + e.getMessage());
            System.exit(1);
            return null;
        }
    }
}
