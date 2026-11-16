package evacuacion.datos;

/** Guarda las sesiones de administrador abiertas (token -> momento en que vencen). */
public interface RepositorioSesiones {

    void guardar(String token, long vence);

    /** Cuándo vence la sesión, o null si no existe. */
    Long vence(String token);

    void eliminar(String token);

    void eliminarVencidas(long ahora);
}
