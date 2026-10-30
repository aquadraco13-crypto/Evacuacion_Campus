import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Map;
import java.util.function.LongSupplier;

/**
 * Inicio de sesión de administradores.
 *  - La clave se compara con SHA-256 + MessageDigest.isEqual (tiempo constante).
 *  - El token de sesión son 32 bytes aleatorios (SecureRandom); dura 8 horas.
 *  - Límite de intentos por IP: 5 fallos seguidos -> bloqueo de 1 minuto.
 */
public class Sesiones {

    public enum Resultado { OK, INCORRECTA, BLOQUEADA }

    public record Intento(Resultado resultado, String token) { }

    public static final long DURACION_MS = 8L * 60 * 60 * 1000;
    public static final int MAX_FALLOS = 5;
    public static final long BLOQUEO_MS = 60_000;

    private static final class Fallos {
        int cantidad;
        long hasta;
    }

    private final byte[] hashClave;
    private final LongSupplier reloj;
    private final SecureRandom azar = new SecureRandom();
    private final Map<String, Long> sesiones = new HashMap<>();   // token -> vence
    private final Map<String, Fallos> fallosPorIp = new HashMap<>();

    public Sesiones(String clave) {
        this(clave, System::currentTimeMillis);
    }

    public Sesiones(String clave, LongSupplier reloj) {
        this.hashClave = sha256(clave);
        this.reloj = reloj;
    }

    public synchronized Intento iniciar(String clave, String ip) {
        long ahora = reloj.getAsLong();
        Fallos f = fallosPorIp.computeIfAbsent(ip, k -> new Fallos());
        if (f.hasta > ahora) return new Intento(Resultado.BLOQUEADA, null);

        boolean ok = clave != null && MessageDigest.isEqual(hashClave, sha256(clave));
        if (!ok) {
            f.cantidad++;
            if (f.cantidad >= MAX_FALLOS) {
                f.hasta = ahora + BLOQUEO_MS;
                f.cantidad = 0;
            }
            return new Intento(Resultado.INCORRECTA, null);
        }
        fallosPorIp.remove(ip);
        limpiar(ahora);
        byte[] b = new byte[32];
        azar.nextBytes(b);
        String token = HexFormat.of().formatHex(b);
        sesiones.put(token, ahora + DURACION_MS);
        return new Intento(Resultado.OK, token);
    }

    public synchronized boolean valida(String token) {
        if (token == null) return false;
        Long vence = sesiones.get(token);
        if (vence == null) return false;
        if (vence <= reloj.getAsLong()) {
            sesiones.remove(token);
            return false;
        }
        return true;
    }

    public synchronized void cerrar(String token) {
        if (token != null) sesiones.remove(token);
    }

    private void limpiar(long ahora) {
        sesiones.values().removeIf(v -> v <= ahora);
        fallosPorIp.values().removeIf(f -> f.cantidad == 0 && f.hasta <= ahora);
    }

    private static byte[] sha256(String s) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8));
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
