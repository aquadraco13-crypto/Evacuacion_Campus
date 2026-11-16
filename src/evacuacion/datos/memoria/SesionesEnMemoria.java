package evacuacion.datos.memoria;

import evacuacion.datos.RepositorioSesiones;

import java.util.HashMap;
import java.util.Map;

/** Sesiones de administrador guardadas en memoria. */
public class SesionesEnMemoria implements RepositorioSesiones {

    private final Map<String, Long> sesiones = new HashMap<>();

    @Override
    public synchronized void guardar(String token, long vence) {
        sesiones.put(token, vence);
    }

    @Override
    public synchronized Long vence(String token) {
        return sesiones.get(token);
    }

    @Override
    public synchronized void eliminar(String token) {
        sesiones.remove(token);
    }

    @Override
    public synchronized void eliminarVencidas(long ahora) {
        sesiones.values().removeIf(v -> v <= ahora);
    }
}
