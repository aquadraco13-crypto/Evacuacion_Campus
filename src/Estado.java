import java.util.HashSet;
import java.util.Set;

/**
 * Estado de la emergencia, guardado en el SERVIDOR y compartido por todos los clientes.
 * Solo los administradores pueden cambiarlo (ver Servidor y Sesiones).
 * Cada cambio sube "version", así los estudiantes saben que hay algo nuevo.
 */
public class Estado {

    public record Foto(boolean emergencia, long version, Set<String> nodos, Set<String> aristas) {

        public String toJson() {
            return "{\"emergencia\":" + emergencia
                    + ",\"version\":" + version
                    + ",\"nodos\":" + Json.lista(java.util.List.copyOf(new java.util.TreeSet<>(nodos)))
                    + ",\"aristas\":" + Json.lista(java.util.List.copyOf(new java.util.TreeSet<>(aristas)))
                    + "}";
        }
    }

    private final Grafo grafo;
    private boolean emergencia = false;
    private long version = 0;
    private Set<String> nodos = Set.of();
    private Set<String> aristas = Set.of();

    public Estado(Grafo grafo) {
        this.grafo = grafo;
    }

    public synchronized Foto foto() {
        return new Foto(emergencia, version, nodos, aristas);
    }

    public synchronized void fijarEmergencia(boolean activa) {
        if (activa == emergencia) return;
        emergencia = activa;
        version++;
    }

    /** Devuelve false (sin cambiar nada) si algún id no existe en el campus. */
    public synchronized boolean fijarBloqueos(Set<String> nuevosNodos, Set<String> nuevasAristas) {
        for (String n : nuevosNodos) {
            if (grafo.nodo(n) == null) return false;
        }
        Set<String> clavesValidas = new HashSet<>();
        for (Arista ar : grafo.aristas()) clavesValidas.add(ar.clave());
        for (String k : nuevasAristas) {
            if (!clavesValidas.contains(k)) return false;
        }
        if (nuevosNodos.equals(nodos) && nuevasAristas.equals(aristas)) return true;
        nodos = Set.copyOf(nuevosNodos);
        aristas = Set.copyOf(nuevasAristas);
        version++;
        return true;
    }
}
