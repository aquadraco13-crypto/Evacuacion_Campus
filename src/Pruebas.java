import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;


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

    static boolean cerca(double a, double b, double tolerancia) {
        return Math.abs(a - b) <= tolerancia;
    }

    public static void main(String[] args) {
        Grafo g = Campus.crear();
        Set<String> nada = Set.of();

        System.out.println("1) Ruta normal desde Bloque A");
        Evacuacion.Plan p1 = Evacuacion.calcular(g, "A1", nada, nada);
        verificar(p1.ok(), "Desde Salón A-101 hay ruta a un punto de encuentro");
        verificar(p1.ok() && p1.mejor() != null, "Se elige un PE válido");
        if (p1.ok()) {
            System.out.println("     -> PE elegido: " + p1.mejor().nombre()
                    + " (" + Json.num(p1.mejor().distanciaM()) + " m)");
        }

        System.out.println("2) Bloqueo de puerta A: se recalcula");
        Evacuacion.Plan p2 = Evacuacion.calcular(g, "A1", Set.of("SA"), nada);
        verificar(p2.ok(), "Con la puerta A bloqueada aún hay ruta alternativa");
        if (p2.ok()) {
            verificar(!p2.mejor().camino().contains("SA"),
                    "La nueva ruta no pasa por la puerta bloqueada");
        }

        System.out.println("3) Camino bloqueado (arista)");
        Evacuacion.Plan p3 = Evacuacion.calcular(g, "A1", nada, Set.of(Arista.clave("PA", "SA")));
        verificar(p3.ok(), "Bloqueando el pasillo A -> Puerta A, aún hay ruta");

        System.out.println("4) Sin salida (bloqueando salidas cercanas de A/C)");
        Evacuacion.Plan p4 = Evacuacion.calcular(g, "A1",
                Set.of("SA", "SC", "SCAF", "LATERAL", "PA", "PC"), nada);
        
        verificar(p4 != null, "El cálculo no falla con muchos bloqueos");

        System.out.println("5) Desde el centro hacia PE");
        Evacuacion.Plan p5 = Evacuacion.calcular(g, "PLAZA", nada, nada);
        verificar(p5.ok(), "Desde la plaza hay ruta a un PE");
        if (p5.ok()) {
            System.out.println("     -> PE elegido: " + p5.mejor().nombre()
                    + " (" + Json.num(p5.mejor().distanciaM()) + " m)");
        }

        System.out.println("6) Casos límite");
        Evacuacion.Plan p6 = Evacuacion.calcular(g, "PE_NORTE", nada, nada);
        verificar(p6.ok() && p6.mejor().id().equals("PE_NORTE") && p6.mejor().distanciaM() == 0,
                "Si ya estás en un PE, la distancia es 0");
        verificar(!Evacuacion.calcular(g, "A1", Set.of("A1"), nada).ok(),
                "Origen bloqueado -> sin ruta");
        verificar(!Evacuacion.calcular(g, "NOEXISTE", nada, nada).ok(),
                "Origen desconocido -> sin ruta");

        System.out.println("7) Dijkstra contra Floyd-Warshall (todos los pares)");
        verificar(coincideConFloydWarshall(g),
                "Los costos mínimos de Dijkstra coinciden con Floyd-Warshall");

        System.out.println("8) Estado de la emergencia (compartido por el servidor)");
        Estado est = new Estado(g);
        verificar(!est.foto().emergencia(), "Al iniciar no hay emergencia");
        long v0 = est.foto().version();
        est.fijarEmergencia(true);
        verificar(est.foto().emergencia() && est.foto().version() == v0 + 1, "Activar sube la versión");
        est.fijarEmergencia(true);
        verificar(est.foto().version() == v0 + 1, "Repetir el mismo valor no cambia la versión");
        verificar(est.fijarBloqueos(Set.of("PA"), Set.of(Arista.clave("E", "PB"))), "Bloqueos válidos se aceptan");
        verificar(est.foto().nodos().contains("PA"), "El bloqueo queda guardado");
        long v1 = est.foto().version();
        verificar(!est.fijarBloqueos(Set.of("NOEXISTE"), Set.of()), "Nodo desconocido se rechaza");
        verificar(!est.fijarBloqueos(Set.of(), Set.of("X|Y")), "Arista desconocida se rechaza");
        verificar(est.foto().version() == v1 && est.foto().nodos().contains("PA"),
                "Un bloqueo rechazado no cambia nada");

        System.out.println("9) Sesiones de administrador");
        long[] reloj = {0};
        Sesiones ses = new Sesiones("clave-segura-123", () -> reloj[0]);
        verificar(ses.iniciar("mala", "1.1.1.1").resultado() == Sesiones.Resultado.INCORRECTA, "Clave incorrecta se rechaza");
        verificar(!ses.valida(null) && !ses.valida("inventado"), "Tokens inventados no valen");
        Sesiones.Intento ok = ses.iniciar("clave-segura-123", "1.1.1.1");
        verificar(ok.resultado() == Sesiones.Resultado.OK && ses.valida(ok.token()), "Clave correcta da sesión válida");
        verificar(ok.token().length() == 64, "El token tiene 32 bytes (64 hex)");
        reloj[0] = Sesiones.DURACION_MS - 1;
        verificar(ses.valida(ok.token()), "La sesión sigue válida antes de 8 horas");
        reloj[0] = Sesiones.DURACION_MS;
        verificar(!ses.valida(ok.token()), "La sesión expira a las 8 horas");
        Sesiones.Intento otro = ses.iniciar("clave-segura-123", "1.1.1.1");
        ses.cerrar(otro.token());
        verificar(!ses.valida(otro.token()), "Cerrar sesión invalida el token");

        Sesiones lim = new Sesiones("clave-segura-123", () -> reloj[0]);
        for (int i = 0; i < Sesiones.MAX_FALLOS; i++) lim.iniciar("x", "9.9.9.9");
        verificar(lim.iniciar("clave-segura-123", "9.9.9.9").resultado() == Sesiones.Resultado.BLOQUEADA,
                "Tras 5 fallos la IP queda bloqueada (aunque acierte)");
        verificar(lim.iniciar("clave-segura-123", "8.8.8.8").resultado() == Sesiones.Resultado.OK,
                "Otra IP no se ve afectada");
        reloj[0] += Sesiones.BLOQUEO_MS;
        verificar(lim.iniciar("clave-segura-123", "9.9.9.9").resultado() == Sesiones.Resultado.OK,
                "El bloqueo termina al pasar el minuto");

        System.out.println();
        System.out.println((total - fallos) + " de " + total + " pruebas correctas");
        if (fallos > 0) System.exit(1);
    }

    static boolean coincideConFloydWarshall(Grafo g) {
        List<Nodo> ns = new ArrayList<>(g.nodos());
        int n = ns.size();
        double[][] d = new double[n][n];
        for (double[] fila : d) Arrays.fill(fila, Double.POSITIVE_INFINITY);
        for (int i = 0; i < n; i++) d[i][i] = 0;

        for (Arista ar : g.aristas()) {
            int i = indice(ns, ar.a);
            int j = indice(ns, ar.b);
            d[i][j] = Math.min(d[i][j], ar.costo());
            d[j][i] = Math.min(d[j][i], ar.costo());
        }
        for (int k = 0; k < n; k++)
            for (int i = 0; i < n; i++)
                for (int j = 0; j < n; j++)
                    if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];

        for (int i = 0; i < n; i++) {
            Dijkstra.Resultado r = Dijkstra.calcular(g, ns.get(i).id, Set.of(), Set.of());
            for (int j = 0; j < n; j++) {
                double obtenido = r.costo.getOrDefault(ns.get(j).id, Double.POSITIVE_INFINITY);
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
}
