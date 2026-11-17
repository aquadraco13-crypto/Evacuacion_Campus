package evacuacion.negocio.servicios;

import evacuacion.datos.RepositorioSesiones;
import evacuacion.negocio.seguridad.GeneradorToken;
import evacuacion.negocio.seguridad.LimitadorIntentos;
import evacuacion.negocio.seguridad.VerificadorClave;

import java.util.function.LongSupplier;

/**
 * Caso de uso: iniciar y cerrar sesión de administrador, y saber si un token es válido.
 * GRASP Alta cohesión: solo orquesta; comparar la clave, limitar intentos, crear tokens
 * y guardar sesiones lo hacen clases separadas (SOLID S).
 */
public class AutenticacionServicio {

    public enum Resultado { OK, INCORRECTA, BLOQUEADA }

    public record Intento(Resultado resultado, String token) { }

    public static final long DURACION_MS = 8L * 60 * 60 * 1000;

    private final VerificadorClave verificador;
    private final RepositorioSesiones sesiones;
    private final LimitadorIntentos limitador;
    private final GeneradorToken tokens;
    private final LongSupplier reloj;

    public AutenticacionServicio(VerificadorClave verificador, RepositorioSesiones sesiones,
                                 LimitadorIntentos limitador, GeneradorToken tokens, LongSupplier reloj) {
        this.verificador = verificador;
        this.sesiones = sesiones;
        this.limitador = limitador;
        this.tokens = tokens;
        this.reloj = reloj;
    }

    public synchronized Intento iniciarSesion(String clave, String ip) {
        if (limitador.bloqueada(ip)) return new Intento(Resultado.BLOQUEADA, null);
        if (!verificador.coincide(clave)) {
            limitador.registrarFallo(ip);
            return new Intento(Resultado.INCORRECTA, null);
        }
        limitador.registrarExito(ip);
        long ahora = reloj.getAsLong();
        sesiones.eliminarVencidas(ahora);
        String token = tokens.nuevo();
        sesiones.guardar(token, ahora + DURACION_MS);
        return new Intento(Resultado.OK, token);
    }

    public synchronized boolean esAdmin(String token) {
        if (token == null) return false;
        Long vence = sesiones.vence(token);
        if (vence == null) return false;
        if (vence <= reloj.getAsLong()) {
            sesiones.eliminar(token);
            return false;
        }
        return true;
    }

    public synchronized void cerrarSesion(String token) {
        if (token != null) sesiones.eliminar(token);
    }
}
