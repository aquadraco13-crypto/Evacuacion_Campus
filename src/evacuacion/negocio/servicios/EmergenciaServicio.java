package evacuacion.negocio.servicios;

import evacuacion.datos.RepositorioEmergencia;
import evacuacion.datos.RepositorioMapa;
import evacuacion.modelo.Arista;
import evacuacion.modelo.EstadoEmergencia;
import evacuacion.modelo.Restricciones;
import evacuacion.negocio.DatoInvalidoException;

import java.util.HashSet;
import java.util.Set;

/**
 * Caso de uso: activar/desactivar la emergencia y marcar bloqueos.
 * Aquí viven las REGLAS (validar ids, subir la versión solo si algo cambia);
 * el repositorio solo guarda. Quién puede llamarlo (solo admin) lo decide la capa de presentación.
 */
public class EmergenciaServicio {

    private final RepositorioEmergencia emergencia;
    private final RepositorioMapa mapa;

    public EmergenciaServicio(RepositorioEmergencia emergencia, RepositorioMapa mapa) {
        this.emergencia = emergencia;
        this.mapa = mapa;
    }

    public EstadoEmergencia consultar() {
        return emergencia.obtener();
    }

    public synchronized EstadoEmergencia fijarEmergencia(boolean activa) {
        EstadoEmergencia actual = emergencia.obtener();
        if (actual.activa() == activa) return actual;
        EstadoEmergencia nuevo = new EstadoEmergencia(activa, actual.version() + 1, actual.restricciones());
        emergencia.guardar(nuevo);
        return nuevo;
    }

    /** Lanza DatoInvalidoException (sin cambiar nada) si algún punto o camino no existe en el campus. */
    public synchronized EstadoEmergencia fijarBloqueos(Set<String> nodos, Set<String> aristas) {
        var grafo = mapa.obtener().grafo();
        for (String n : nodos) {
            if (grafo.nodo(n) == null) throw new DatoInvalidoException("Punto desconocido: " + n);
        }
        Set<String> validas = new HashSet<>();
        for (Arista ar : grafo.aristas()) validas.add(ar.clave());
        for (String k : aristas) {
            if (!validas.contains(k)) throw new DatoInvalidoException("Camino desconocido: " + k);
        }

        EstadoEmergencia actual = emergencia.obtener();
        Restricciones nuevas = new Restricciones(nodos, aristas);
        if (nuevas.equals(actual.restricciones())) return actual;
        EstadoEmergencia nuevo = new EstadoEmergencia(actual.activa(), actual.version() + 1, nuevas);
        emergencia.guardar(nuevo);
        return nuevo;
    }
}
